// src/app/api/interpret-search/route.ts
import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";
import { MongoClient } from "mongodb";
import { Product } from "@/lib/types";

<<<<<<< HEAD
// --- HELPER FUNCTIONS ---

async function withRetry<T>(fn: () => Promise<T>, retries = 3, delay = 1000): Promise<T> {
  let lastError: Error | null = null;
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      console.log(`Attempt ${i + 1} failed for interpret-search. Retrying in ${delay / 1000}s...`);
      await new Promise(res => setTimeout(res, delay * (i + 1)));
    }
  }
  if (lastError) {
    throw lastError;
  }
  throw new Error("All retries failed.");
}

async function generateEmbedding(text: string): Promise<number[]> {
  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || "");
  const embeddingModel = genAI.getGenerativeModel({ model: "text-embedding-004" });
  const result = await embeddingModel.embedContent(text);
  return result.embedding.values;
}

async function getProductImages(productName: string, category: string): Promise<string[]> {
  const apiKey = process.env.GOOGLE_API_KEY;
  const searchEngineId = process.env.SEARCH_ENGINE_ID;
  const createUrl = (query: string) => `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${searchEngineId}&q=${encodeURIComponent(query)}&searchType=image&num=1`;

  try {
    const specificQuery = `${productName}`;
    let response = await fetch(createUrl(specificQuery));
    if (response.ok) {
      const data = await response.json();
      if (data.items && data.items.length > 0 && data.items[0].link) {
        return [data.items[0].link];
      }
    }
    const categoryQuery = `${productName} ${category}`;
    response = await fetch(createUrl(categoryQuery));
    if (response.ok) {
      const data = await response.json();
      if (data.items && data.items.length > 0 && data.items[0].link) {
        return [data.items[0].link];
      }
    }
    return [];
  } catch (error) {
    console.error(`Image Search API Error for "${productName}":`, error);
=======
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
>>>>>>> 0c5de07fcdeef2d115c20d12a6a065d9dcbee33a
    return [];
  }
}

<<<<<<< HEAD
type ProductWithScore = Product & { score: number; };

// --- MAIN API ROUTE ---
export async function POST(req: NextRequest) {
  const { query } = await req.json();
  if (!query) return NextResponse.json({ error: "Query is required" }, { status: 400 });
=======
export async function POST(req: NextRequest) {
  const { query } = await req.json();

  if (!query) {
    return NextResponse.json({ error: "Query is required" }, { status: 400 });
  }
>>>>>>> 0c5de07fcdeef2d115c20d12a6a065d9dcbee33a

  const client = new MongoClient(process.env.MONGODB_URI || "");

  try {
<<<<<<< HEAD
    const queryEmbedding = await withRetry(() => generateEmbedding(query));
    await client.connect();
    const db = client.db("readreviewfirst");
    const productsCollection = db.collection<Product>("products");

    // Task 1: Search our own database.
    const vectorSearchPromise = (async () => {
      const relevantProductIds = await productsCollection.find(
        { $text: { $search: query } }, { projection: { _id: 1 } }
      ).map(doc => doc._id).toArray();
      if (relevantProductIds.length > 0) {
        return productsCollection.aggregate<ProductWithScore>([
          {
            $vectorSearch: {
              index: "vector_index", path: "productEmbedding",
              queryVector: queryEmbedding, filter: { _id: { $in: relevantProductIds } },
              numCandidates: 100, limit: 5,
            },
          },
          { $project: { _id: 1, name: 1, category: 1, images: 1, score: { $meta: "vectorSearchScore" } } }
        ]).toArray();
      }
      return [];
    })();

    // Task 2: Brainstorm with AI, with graceful degradation.
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || "");
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = `Brainstorm up to 8 specific, likely product names related to the search query: "${query}". Return a valid JSON array of objects, each with "name" and "category".`;
    
    const aiSuggestionPromise = withRetry(() => 
      model.generateContent(prompt)
           .then(result => JSON.parse(result.response.text().replace(/```json\n|```/g, '').trim()))
    ).catch(error => {
      console.error("AI suggestion failed after all retries:", error.message);
      return []; // Instead of failing, return an empty array.
    });
      
    const [existingProducts, aiSuggestions] = await Promise.all([vectorSearchPromise, aiSuggestionPromise]);
      
    const finalSuggestions = existingProducts.map(p => ({
      name: p.name, category: p.category, exists: true,
      imageUrl: p.images?.[0] || null, slug: p._id, score: p.score
    }));
    const seenSlugs = new Set(finalSuggestions.map(s => s.slug));
    const newDiscoveryIdeas = aiSuggestions.filter((s: { name: string; category: string }) => {
        const productSlug = `${s.category.toLowerCase().replace(/\s+/g, '-')}/${s.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}`;
        return !seenSlugs.has(productSlug);
    });
    const maxNewSuggestions = 9 - finalSuggestions.length;

    const newSuggestions = await Promise.all(
      newDiscoveryIdeas.slice(0, maxNewSuggestions).map(async (s: { name: string; category: string }) => {
        const placeholderImages = await getProductImages(s.name, s.category);
        return { 
          name: s.name, category: s.category, exists: false,
          placeholderImageUrl: placeholderImages[0] || null,
        };
      })
    );
    
    const combinedSuggestions = [...finalSuggestions, ...newSuggestions];

    return NextResponse.json({
      query_type: "hybrid_filtered",
      suggestions: combinedSuggestions
    });

  } catch (error: any) {
    console.error("Critical Interpret search error:", error.message);
    return NextResponse.json({ error: "Our AI had trouble understanding that. Please try another search." }, { status: 500 });
  } finally {
    await client.close();
=======
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
>>>>>>> 0c5de07fcdeef2d115c20d12a6a065d9dcbee33a
  }
}