// src/app/api/create-product/route.ts
import { GoogleGenerativeAI } from "@google/generative-ai";
import { MongoClient } from "mongodb";
import { Product, Review } from "@/lib/types";
import { slugify } from "@/lib/slugify";

// Exponential-backoff retry helper
async function withRetry<T>(fn: () => Promise<T>, retries = 3, delay = 1000): Promise<T> {
  let lastError: any = null;
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      await new Promise(r => setTimeout(r, delay * (i + 1)));
    }
  }
  throw lastError;
}

// Fetches images (unchanged)
async function getProductImages(query: string): Promise<string[]> { /* …same as before… */ }

// Embedding (unchanged)
async function generateEmbedding(text: string): Promise<number[]> { /* …same as before… */ }

export async function POST(req: Request) {
  const { productName, category } = await req.json();
  if (!productName || !category) {
    return new Response(JSON.stringify({ error: "Product name and category are required." }), { status: 400 });
  }

  const uniqueId = `${slugify(category)}/${slugify(productName)}`;
  const client = new MongoClient(process.env.MONGODB_URI || "");
  try {
    await client.connect();
    const products = client.db("readreviewfirst").collection<Product>("products");

    // 1) If it already exists, return 200
    const existing = await products.findOne({ _id: uniqueId });
    if (existing) {
      return new Response(JSON.stringify({ message: "Already exists", product: existing }), { status: 200 });
    }

    // 2) New prompt for rich JSON schema
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || "");
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = `
      You are an expert API. Output ONLY a valid JSON object:
      - "shortSummary": a one-sentence hook.
      - "rating": a number 0–5.
      - "pros": an array of bullet-point strings.
      - "cons": an array of bullet-point strings.
      - "detailedReview": full markdown prose.
      - "cta": a brief call-to-action (NO MORE THAN 5 WORDS, e.g. "See it on Amazon").
      The product is: "${productName}"
    `;


    const aiResult = await withRetry(() => model.generateContent(prompt));
    const raw = await aiResult.response.text();
    const jsonStart = raw.indexOf("{");
    const jsonEnd = raw.lastIndexOf("}") + 1;
    const review: Review = JSON.parse(raw.slice(jsonStart, jsonEnd));

    // 3) Parallel: fetch images + embeddings
    const [images, productEmbedding] = await Promise.all([
      withRetry(() => getProductImages(review.shortSummary)),
      withRetry(() => generateEmbedding(productName))
    ]);

    // 4) Assemble and store
    const newProduct: Product = {
      _id: uniqueId,
      name: productName,
      category,
      review,
      images,
      affiliateUrl: `https://www.amazon.com/s?k=${encodeURIComponent(productName)}`,
      createdAt: new Date(),
      verification_score: 0,
      upvotes: 0,
      downvotes: 0,
      productEmbedding,
      lastImageSearchQuery: review.shortSummary,
    };

    await products.insertOne(newProduct);
    return new Response(JSON.stringify({ message: "Created", product: newProduct }), { status: 201 });

  } catch (err) {
    console.error("create-product error:", err);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), { status: 500 });
  } finally {
    await client.close();
  }
}
