// src/app/api/create-product/route.ts
import { GoogleGenerativeAI } from "@google/generative-ai";
import { MongoClient } from "mongodb";
import { Product } from "@/lib/types";

<<<<<<< HEAD
=======
<<<<<<< HEAD
>>>>>>> 72a3fcc6448439a8dc02337b5b40a80617202a73
// --- HELPER FUNCTIONS ---

async function withRetry<T>(fn: () => Promise<T>, retries = 3, delay = 1000): Promise<T> {
  let lastError: Error | null = null;
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      console.log(`Attempt ${i + 1} failed for create-product. Retrying in ${delay / 1000}s...`);
      await new Promise(res => setTimeout(res, delay * (i + 1)));
    }
  }
  if (lastError) {
    throw lastError;
  }
  throw new Error("All retries failed.");
}

<<<<<<< HEAD
=======
=======
// Helper function to fetch product images from Google Custom Search API.
>>>>>>> 0c5de07fcdeef2d115c20d12a6a065d9dcbee33a
>>>>>>> 72a3fcc6448439a8dc02337b5b40a80617202a73
async function getProductImages(query: string): Promise<string[]> {
  const apiKey = process.env.GOOGLE_API_KEY;
  const searchEngineId = process.env.SEARCH_ENGINE_ID;
  const url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${searchEngineId}&q=${encodeURIComponent(query)}&searchType=image&num=5`;
<<<<<<< HEAD
  try {
    const response = await fetch(url);
    if (!response.ok) return [];
=======
<<<<<<< HEAD
  try {
    const response = await fetch(url);
    if (!response.ok) return [];
=======

  try {
    const response = await fetch(url);
>>>>>>> 0c5de07fcdeef2d115c20d12a6a065d9dcbee33a
>>>>>>> 72a3fcc6448439a8dc02337b5b40a80617202a73
    const data = await response.json();
    if (!data.items || data.items.length === 0) return [];
    return data.items.map((item: { link: string }) => item.link);
  } catch (error) {
    console.error("Image Search API Error:", error);
    return [];
  }
}

<<<<<<< HEAD
=======
<<<<<<< HEAD
>>>>>>> 72a3fcc6448439a8dc02337b5b40a80617202a73
async function generateEmbedding(text: string): Promise<number[]> {
  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || "");
  const embeddingModel = genAI.getGenerativeModel({ model: "text-embedding-004" });
  const result = await embeddingModel.embedContent(text);
  return result.embedding.values;
}


export async function POST(req: Request) {
  const { productName, category } = await req.json();
<<<<<<< HEAD
=======
=======
export async function POST(req: Request) {
  const { productName, category } = await req.json();

>>>>>>> 0c5de07fcdeef2d115c20d12a6a065d9dcbee33a
>>>>>>> 72a3fcc6448439a8dc02337b5b40a80617202a73
  if (!productName || !category) {
    return new Response(JSON.stringify({ error: "Product name and category are required." }), { status: 400 });
  }

<<<<<<< HEAD
=======
<<<<<<< HEAD
=======
  // Create a URL-friendly slug for the category and product name to form a unique ID.
>>>>>>> 0c5de07fcdeef2d115c20d12a6a065d9dcbee33a
>>>>>>> 72a3fcc6448439a8dc02337b5b40a80617202a73
  const productSlug = productName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  const categorySlug = category.toLowerCase().replace(/\s+/g, '-');
  const uniqueId = `${categorySlug}/${productSlug}`;
  
  const client = new MongoClient(process.env.MONGODB_URI || "");

  try {
    await client.connect();
    const db = client.db("readreviewfirst");
    const productsCollection = db.collection<Product>("products");

<<<<<<< HEAD
=======
<<<<<<< HEAD
=======
    // Before creating, check if a product with this unique ID already exists.
>>>>>>> 0c5de07fcdeef2d115c20d12a6a065d9dcbee33a
>>>>>>> 72a3fcc6448439a8dc02337b5b40a80617202a73
    const existingProduct = await productsCollection.findOne({ _id: uniqueId });
    if (existingProduct) {
      return new Response(JSON.stringify({ message: "Product already exists.", product: existingProduct }), { status: 200 });
    }

<<<<<<< HEAD
=======
<<<<<<< HEAD
>>>>>>> 72a3fcc6448439a8dc02337b5b40a80617202a73
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || "");
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    const prompt = `
      You are an expert API. Your only function is to return a valid JSON object.
      The user wants a review for: "${productName}".
      Your task is to generate a JSON object with two keys:
      1.  "reviewText": A review formatted in markdown, including "### Pros" and "### Cons" sections.
      2.  "imageSearchQuery": An optimized query for Google Image Search. For example: "${productName} official product photo".
      Your response must be ONLY the raw JSON object.
    `;
    
    const generationResult = await withRetry(() => model.generateContent(prompt));
    const responseText = generationResult.response.text();
    const jsonString = responseText.substring(responseText.indexOf('{'), responseText.lastIndexOf('}') + 1);
<<<<<<< HEAD
=======
=======
    // --- AI-Powered Content Generation ---
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || "");
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    // The final, detailed prompt to get a structured JSON response from the AI.
    const prompt = `
      You are an expert API. Your only function is to return a valid JSON object. Do not include any introductory text, markdown formatting, or explanations.
      The user wants a review for: "${productName}".
      Your task is to generate a JSON object with two keys:
      1.  "reviewText": A concise, balanced, and informative review of the most likely specific product for the query. Include "Pros" and "Cons" as bullet points.
      2.  "imageSearchQuery": A concise, optimized query for Google Image Search to find official product photos for that specific product.
      
      Your response must be ONLY the raw JSON object.
    `;
    
    const generationResult = await model.generateContent(prompt);
    const responseText = generationResult.response.text();
    
    // Robustly parse the JSON from the AI's response.
    const jsonStart = responseText.indexOf('{');
    const jsonEnd = responseText.lastIndexOf('}') + 1;
    const jsonString = responseText.substring(jsonStart, jsonEnd);
>>>>>>> 0c5de07fcdeef2d115c20d12a6a065d9dcbee33a
>>>>>>> 72a3fcc6448439a8dc02337b5b40a80617202a73
    const aiResponse = JSON.parse(jsonString);

    const reviewText = aiResponse.reviewText;
    const imageSearchQuery = aiResponse.imageSearchQuery;

<<<<<<< HEAD
    const images = await withRetry(() => getProductImages(imageSearchQuery));
    const embedding = await withRetry(() => generateEmbedding(productName));

=======
<<<<<<< HEAD
    const images = await withRetry(() => getProductImages(imageSearchQuery));
    const embedding = await withRetry(() => generateEmbedding(productName));

=======
    // Fetch images using the AI-generated search query.
    const images = await getProductImages(imageSearchQuery);

    // Assemble the complete new product document.
>>>>>>> 0c5de07fcdeef2d115c20d12a6a065d9dcbee33a
>>>>>>> 72a3fcc6448439a8dc02337b5b40a80617202a73
    const newProduct: Product = {
      _id: uniqueId,
      name: productName,
      category: category,
      review: reviewText,
      images: images,
      affiliateUrl: `https://www.amazon.com/s?k=${encodeURIComponent(productName)}`,
      createdAt: new Date(),
      verification_score: 0,
      upvotes: 0,
      downvotes: 0,
<<<<<<< HEAD
=======
<<<<<<< HEAD
>>>>>>> 72a3fcc6448439a8dc02337b5b40a80617202a73
      productEmbedding: embedding,
      lastImageSearchQuery: imageSearchQuery,
    };

    await productsCollection.insertOne(newProduct);
    return new Response(JSON.stringify({ message: "Product created successfully.", product: newProduct }), { status: 201 });

  } catch (error: any) {
    console.error("Failed to create product:", error.message);
<<<<<<< HEAD
=======
=======
    };

    // This call is now fully type-safe, no 'as any' needed.
    await productsCollection.insertOne(newProduct);

    return new Response(JSON.stringify({ message: "Product created successfully.", product: newProduct }), { status: 201 });

  } catch (error) {
    console.error("Failed to create product:", error);
>>>>>>> 0c5de07fcdeef2d115c20d12a6a065d9dcbee33a
>>>>>>> 72a3fcc6448439a8dc02337b5b40a80617202a73
    return new Response(JSON.stringify({ error: "Internal Server Error" }), { status: 500 });
  } finally {
    await client.close();
  }
}