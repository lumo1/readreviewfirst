// src/app/api/create-product/route.ts
import { GoogleGenerativeAI } from "@google/generative-ai";
import { MongoClient } from "mongodb";
import { Product } from "@/lib/types";

// --- HELPER FUNCTIONS ---

// Retries the given async function up to `retries` times with exponential backoff.
async function withRetry<T>(fn: () => Promise<T>, retries = 3, delay = 1000): Promise<T> {
  let lastError: Error | null = null;
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      console.log(`Attempt ${i + 1} failed for create-product. Retrying in ${(delay * (i + 1)) / 1000}s...`);
      await new Promise(res => setTimeout(res, delay * (i + 1)));
    }
  }
  throw lastError ?? new Error("All retries failed.");
}

// Fetches up to 5 images from Google Custom Search.
async function getProductImages(query: string): Promise<string[]> {
  const apiKey = process.env.GOOGLE_API_KEY;
  const searchEngineId = process.env.SEARCH_ENGINE_ID;
  const url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${searchEngineId}&q=${encodeURIComponent(query)}&searchType=image&num=5`;

  try {
    const response = await fetch(url);
    if (!response.ok) return [];
    const data = await response.json();
    if (!data.items || data.items.length === 0) return [];
    return data.items.map((item: { link: string }) => item.link);
  } catch (error) {
    console.error("Image Search API Error:", error);
    return [];
  }
}

// Generates an embedding vector for the given text.
async function generateEmbedding(text: string): Promise<number[]> {
  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || "");
  const embeddingModel = genAI.getGenerativeModel({ model: "text-embedding-004" });
  const result = await embeddingModel.embedContent(text);
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

  // Build a URL-friendly unique ID.
  const productSlug = productName
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
  const categorySlug = category.toLowerCase().replace(/\s+/g, "-");
  const uniqueId = `${categorySlug}/${productSlug}`;

  const client = new MongoClient(process.env.MONGODB_URI || "");

  try {
    await client.connect();
    const db = client.db("readreviewfirst");
    const productsCollection = db.collection<Product>("products");

    // If it already exists, return it with a 200.
    const existingProduct = await productsCollection.findOne({ _id: uniqueId });
    if (existingProduct) {
      return new Response(
        JSON.stringify({ message: "Product already exists.", product: existingProduct }),
        { status: 200 }
      );
    }

    // Ask Gemini to generate the review and an image search query.
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || "");
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = `
      You are an expert API. Your only function is to return a valid JSON object with no extra text.
      Generate a review for: "${productName}".
      Return an object with:
        1. "reviewText": Markdown-formatted review, including "### Pros" and "### Cons".
        2. "imageSearchQuery": An optimized query for Google Image Search.
    `;
    const generationResult = await withRetry(() => model.generateContent(prompt));
    const fullText = await generationResult.response.text();
    const jsonStart = fullText.indexOf("{");
    const jsonEnd = fullText.lastIndexOf("}") + 1;
    const aiResponse = JSON.parse(fullText.substring(jsonStart, jsonEnd));

    // Fetch images and embedding concurrently.
    const [images, embedding] = await Promise.all([
      withRetry(() => getProductImages(aiResponse.imageSearchQuery)),
      withRetry(() => generateEmbedding(productName)),
    ]);

    // Assemble and insert the new product.
    const newProduct: Product = {
      _id: uniqueId,
      name: productName,
      category,
      review: aiResponse.reviewText,
      images,
      affiliateUrl: `https://www.amazon.com/s?k=${encodeURIComponent(productName)}`,
      createdAt: new Date(),
      verification_score: 0,
      upvotes: 0,
      downvotes: 0,
      productEmbedding: embedding,
      lastImageSearchQuery: aiResponse.imageSearchQuery,
    };

    await productsCollection.insertOne(newProduct);
    return new Response(
      JSON.stringify({ message: "Product created successfully.", product: newProduct }),
      { status: 201 }
    );

  } catch (error: any) {
    console.error("Failed to create product:", error);
    return new Response(
      JSON.stringify({ error: "Internal Server Error" }),
      { status: 500 }
    );
  } finally {
    await client.close();
  }
}
