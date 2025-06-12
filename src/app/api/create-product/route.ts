// src/app/api/create-product/route.ts
import { GoogleGenerativeAI } from "@google/generative-ai";
import { MongoClient } from "mongodb";
import { Product } from "@/lib/types";

// Helper function to fetch product images from Google Custom Search API.
async function getProductImages(query: string): Promise<string[]> {
  const apiKey = process.env.GOOGLE_API_KEY;
  const searchEngineId = process.env.SEARCH_ENGINE_ID;
  const url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${searchEngineId}&q=${encodeURIComponent(query)}&searchType=image&num=5`;

  try {
    const response = await fetch(url);
    const data = await response.json();
    if (!data.items || data.items.length === 0) return [];
    return data.items.map((item: { link: string }) => item.link);
  } catch (error) {
    console.error("Image Search API Error:", error);
    return [];
  }
}

export async function POST(req: Request) {
  const { productName, category } = await req.json();

  if (!productName || !category) {
    return new Response(JSON.stringify({ error: "Product name and category are required." }), { status: 400 });
  }

  // Create a URL-friendly slug for the category and product name to form a unique ID.
  const productSlug = productName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  const categorySlug = category.toLowerCase().replace(/\s+/g, '-');
  const uniqueId = `${categorySlug}/${productSlug}`;
  
  const client = new MongoClient(process.env.MONGODB_URI || "");

  try {
    await client.connect();
    const db = client.db("readreviewfirst");
    const productsCollection = db.collection<Product>("products");

    // Before creating, check if a product with this unique ID already exists.
    const existingProduct = await productsCollection.findOne({ _id: uniqueId });
    if (existingProduct) {
      return new Response(JSON.stringify({ message: "Product already exists.", product: existingProduct }), { status: 200 });
    }

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
    const aiResponse = JSON.parse(jsonString);

    const reviewText = aiResponse.reviewText;
    const imageSearchQuery = aiResponse.imageSearchQuery;

    // Fetch images using the AI-generated search query.
    const images = await getProductImages(imageSearchQuery);

    // Assemble the complete new product document.
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
    };

    // This call is now fully type-safe, no 'as any' needed.
    await productsCollection.insertOne(newProduct);

    return new Response(JSON.stringify({ message: "Product created successfully.", product: newProduct }), { status: 201 });

  } catch (error) {
    console.error("Failed to create product:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), { status: 500 });
  } finally {
    await client.close();
  }
}