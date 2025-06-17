// src/app/api/create-product/route.ts

import { GoogleGenerativeAI } from "@google/generative-ai";
import { MongoClient } from "mongodb";
import { Product } from "@/lib/types";
import { slugify } from "@/lib/slugify";

// --- HELPER: retry with exponential backoff ---
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
      console.warn(`Attempt ${i + 1} failed. Retrying in ${(delay * (i + 1)) / 1000}s…`);
      await new Promise((r) => setTimeout(r, delay * (i + 1)));
    }
  }
  throw lastError!;
}

// --- HELPER: fetch images from Google Custom Search ---
async function getProductImages(query: string): Promise<string[]> {
  const apiKey = process.env.GOOGLE_API_KEY;
  const cx     = process.env.SEARCH_ENGINE_ID;
  if (!apiKey || !cx) return [];

  const url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}` +
              `&cx=${cx}` +
              `&q=${encodeURIComponent(query)}` +
              `&searchType=image&num=5`;

  try {
    const res = await fetch(url);
    if (!res.ok) return [];
    const js  = await res.json();
    return Array.isArray(js.items) 
      ? js.items.map((it: any) => it.link as string) 
      : [];
  } catch {
    return [];
  }
}

// --- HELPER: embedding for vector search ---
async function generateEmbedding(text: string): Promise<number[]> {
  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || "");
  const mdl   = genAI.getGenerativeModel({ model: "text-embedding-004" });
  const out   = await mdl.embedContent(text);
  return out.embedding.values;
}

export async function POST(req: Request) {
  const { productName, category } = await req.json();
  if (!productName || !category) {
    return new Response(JSON.stringify({ error: "Product name and category are required." }), { status: 400 });
  }

  // 1) Build unique ID
  const uniqueId = `${slugify(category)}/${slugify(productName)}`;
  const client   = new MongoClient(process.env.MONGODB_URI || "");
  await client.connect();
  const products = client.db("readreviewfirst").collection<Product>("products");

  // 2) If already exists, return it
  const existing = await products.findOne({ _id: uniqueId });
  if (existing) {
    await client.close();
    return new Response(
      JSON.stringify({ message: "Product already exists.", product: existing }),
      { status: 200 }
    );
  }

  // 3) Ask Gemini for a structured review + image query
  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || "");
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  const prompt = `
You are an AI product reviewing expert.  Output ONLY valid JSON with these keys:
  • "shortSummary": a single-sentence TL;DR.
  • "rating": number 0–5 (allow one decimal, e.g. 4.2).
  • "pros": array of strings.
  • "cons": array of strings.
  • "detailedReview": markdown-formatted full review.
  • "cta": a concise recommendation sentence.
  • "imageSearchQuery": the query to fetch a clean product photo.
Product: "${productName}"
`;
  const aiResultRaw = await withRetry(() => model.generateContent(prompt));
  const rawText     = await aiResultRaw.response.text();
  // extract JSON substring
  const jsonStart   = rawText.indexOf("{");
  const jsonEnd     = rawText.lastIndexOf("}") + 1;
  const parsed      = JSON.parse(rawText.slice(jsonStart, jsonEnd));
  const {
    shortSummary,
    rating,
    pros,
    cons,
    detailedReview,
    cta,
    imageSearchQuery
  } = parsed as {
    shortSummary: string;
    rating: number;
    pros: string[];
    cons: string[];
    detailedReview: string;
    cta: string;
    imageSearchQuery: string;
  };

  // 4) Fetch images & embedding in parallel
  const [images, embedding] = await Promise.all([
    withRetry(() => getProductImages(imageSearchQuery)),
    withRetry(() => generateEmbedding(productName))
  ]);

  // 5) Assemble first ReviewVersion
  const firstVersion = {
    review: {
      shortSummary,
      rating,
      pros,
      cons,
      detailedReview,
      cta
    },
    imageSearchQuery,
    generatedAt: new Date()
  };

  // 6) Build and insert the product document
  const newProduct: Product = {
    _id:                   uniqueId,
    name:                  productName,
    category,
    reviewHistory:         [ firstVersion ],
    images,
    affiliateUrl:          `https://www.amazon.com/s?k=${encodeURIComponent(productName)}`,
    createdAt:             new Date(),
    verification_score:    0,
    upvotes:               0,
    downvotes:             0,
    productEmbedding:      embedding,
    lastImageSearchQuery:  imageSearchQuery
    // legacyMarkdownReview is left undefined for new docs
  };

  await products.insertOne(newProduct);
  await client.close();

  return new Response(
    JSON.stringify({ message: "Product created.", product: newProduct }),
    { status: 201 }
  );
}
