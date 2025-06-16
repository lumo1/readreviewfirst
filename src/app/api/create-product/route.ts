// src/app/api/create-product/route.ts
import { GoogleGenerativeAI } from "@google/generative-ai";
import { MongoClient } from "mongodb";
import { Product } from "@/lib/types";
import { slugify } from "@/lib/slugify";  // ← our new helper

// --- HELPER FUNCTIONS ---

// Retries the given async function up to `retries` times with exponential backoff.
async function withRetry<T>(
  fn: () => Promise<T>,
  retries = 3,
  delay = 1000
): Promise<T> {
  let lastError: Error | null = null;
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (err: any) {
      lastError = err;
      console.log(
        `Attempt ${i + 1} failed for create-product. Retrying in ${
          (delay * (i + 1)) / 1000
        }s…`
      );
      await new Promise((r) => setTimeout(r, delay * (i + 1)));
    }
  }
  throw lastError ?? new Error("All retries failed.");
}

// Fetches up to 5 images from Google Custom Search.
async function getProductImages(query: string): Promise<string[]> {
  const apiKey = process.env.GOOGLE_API_KEY;
  const searchEngineId = process.env.SEARCH_ENGINE_ID;
  const url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}` +
              `&cx=${searchEngineId}` +
              `&q=${encodeURIComponent(query)}` +
              `&searchType=image&num=5`;
  try {
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    if (!Array.isArray(data.items) || data.items.length === 0) return [];
    return data.items.map((item: any) => item.link as string);
  } catch (error) {
    console.error("Image Search API Error:", error);
    return [];
  }
}

// Generates an embedding vector for the given text.
async function generateEmbedding(text: string): Promise<number[]> {
  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || "");
  const model = genAI.getGenerativeModel({ model: "text-embedding-004" });
  const result = await model.embedContent(text);
  return result.embedding.values;
}

export async function POST(req: Request) {
  const { productName, category } = await req.json();
  if (!productName || !category) {
    return new Response(
      JSON.stringify({ error: "Product name and category are required." }),
      { status: 400 }
    );
  }

  // Build a URL- and filesystem-safe unique ID:
  //   slugify("Shoe & Accessories") -> "shoe-and-accessories"
  //   slugify("Cool Widget 3000") -> "cool-widget-3000"
  const uniqueId = `${slugify(category)}/${slugify(productName)}`;

  const client = new MongoClient(process.env.MONGODB_URI || "");
  try {
    await client.connect();
    const products = client.db("readreviewfirst").collection<Product>("products");

    // 1) If it already exists, return it (200 OK).
    const existing = await products.findOne({ _id: uniqueId });
    if (existing) {
      return new Response(
        JSON.stringify({ message: "Product already exists.", product: existing }),
        { status: 200 }
      );
    }

    // 2) Ask Gemini for review + image query.
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || "");
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = `
      You are an expert API. Output ONLY a valid JSON object:
      - "reviewText": a markdown-formatted review with "### Pros" / "### Cons".
      - "imageSearchQuery": a concise Google Images query for a clean product photo.
      The product is: "${productName}"
    `;
    const aiResult = await withRetry(() => model.generateContent(prompt));
    const raw = await aiResult.response.text();
    const jsonStart = raw.indexOf("{");
    const jsonEnd = raw.lastIndexOf("}") + 1;
    const { reviewText, imageSearchQuery } = JSON.parse(raw.slice(jsonStart, jsonEnd));

    // 3) In parallel, fetch images & compute embedding
    const [images, embedding] = await Promise.all([
      withRetry(() => getProductImages(imageSearchQuery)),
      withRetry(() => generateEmbedding(productName))
    ]);

    // 4) Assemble and insert the new product document.
    const newProduct: Product = {
      _id: uniqueId,
      name: productName,
      category,
      review: reviewText,
      images,
      affiliateUrl: `https://www.amazon.com/s?k=${encodeURIComponent(productName)}`,
      createdAt: new Date(),
      verification_score: 0,
      upvotes: 0,
      downvotes: 0,
      productEmbedding: embedding,
      lastImageSearchQuery: imageSearchQuery,
    };

    await products.insertOne(newProduct);
    return new Response(
      JSON.stringify({ message: "Product created successfully.", product: newProduct }),
      { status: 201 }
    );

  } catch (err: any) {
    console.error("create-product error:", err);
    return new Response(
      JSON.stringify({ error: "Internal Server Error" }),
      { status: 500 }
    );
  } finally {
    await client.close();
  }
}
