// src/app/api/interpret-search/route.ts
import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";
import { MongoClient } from "mongodb";
import { Product } from "@/lib/types";

// --- MODIFICATION 1: Create a dedicated helper function for fetching images ---
// This keeps our code clean and reusable.
async function getProductImages(query: string, count: number = 1): Promise<string[]> {
  const apiKey = process.env.GOOGLE_API_KEY;
  const searchEngineId = process.env.SEARCH_ENGINE_ID;
  const url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${searchEngineId}&q=${encodeURIComponent(query)}&searchType=image&num=${count}`;

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

export async function POST(req: NextRequest) {
  const { query } = await req.json();

  if (!query) {
    return NextResponse.json({ error: "Query is required" }, { status: 400 });
  }

  const client = new MongoClient(process.env.MONGODB_URI || "");

  try {
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || "");
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // The prompt remains the same, it's already excellent.
    const prompt = `
      Analyze the following user search query for a product review site: "${query}"
      Determine if the query is for a specific, identifiable product or a generic category.
      Your task is to return a single, valid JSON object with two keys:
      1. "query_type": A string, either "specific" or "generic".
      2. "suggestions": An array. 
         - If the query is specific, the array should contain one object with the "name" of the specific product and a likely "category".
         - If the query is generic, the array should contain up to 4 objects, each with a "name" and a "category" for a likely product the user might mean.
      
      Example for a generic query "yellow tablet":
      {
        "query_type": "generic",
        "suggestions": [
          { "name": "Bayer Low Dose 81mg Aspirin", "category": "Health" },
          { "name": "Amazon Fire 7 Kids Tablet (Yellow Case)", "category": "Electronics" }
        ]
      }
    `;

    const result = await model.generateContent(prompt);
    const jsonString = result.response.text().replace(/```json\n|```/g, '').trim();
    const aiData = JSON.parse(jsonString);

    if (aiData.suggestions && aiData.suggestions.length > 0) {
      await client.connect();
      const db = client.db("readreviewfirst");
      const productsCollection = db.collection<Product>("products");
      
      const potentialIds = aiData.suggestions.map((s: { name: string; category: string }) => {
        const productSlug = s.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
        const categorySlug = s.category.toLowerCase().replace(/\s+/g, '-');
        return `${categorySlug}/${productSlug}`;
      });

      const existingProducts = await productsCollection.find({ _id: { $in: potentialIds } }).toArray();
      const existingProductsMap = new Map(existingProducts.map(p => [p._id, p]));

      // --- MODIFICATION 2: Make the mapping function async and use Promise.all ---
      // This allows us to await the new placeholder image fetch inside the map.
      aiData.suggestions = await Promise.all(aiData.suggestions.map(async (s: { name: string; category: string }) => {
        const productSlug = s.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
        const categorySlug = s.category.toLowerCase().replace(/\s+/g, '-');
        const uniqueId = `${categorySlug}/${productSlug}`;
        
        const existingProduct = existingProductsMap.get(uniqueId);
        
        if (existingProduct) {
          return {
            ...s,
            exists: true,
            imageUrl: existingProduct.images?.[0] || null,
            slug: uniqueId,
          };
        } else {
          // --- MODIFICATION 3: Fetch a placeholder if the product doesn't exist ---
          const placeholderImages = await getProductImages(`${s.name} product photo`, 1);
          return { 
            ...s, 
            exists: false,
            placeholderImageUrl: placeholderImages[0] || null,
          };
        }
      }));
    }

    return NextResponse.json(aiData);

  } catch (error) {
    console.error("Interpret search error:", error);
    return NextResponse.json({ error: "Failed to interpret search query" }, { status: 500 });
  } finally {
    if (client) {
      await client.close();
    }
  }
}