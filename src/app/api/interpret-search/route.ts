// src/app/api/interpret-search/route.ts
import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";
import { MongoClient } from "mongodb";
import { Product } from "@/lib/types";

// --- HELPER FUNCTIONS ---
async function generateEmbedding(text: string): Promise<number[]> {
  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || "");
  const embeddingModel = genAI.getGenerativeModel({ model: "text-embedding-004" });
  const result = await embeddingModel.embedContent(text);
  return result.embedding.values;
}

async function getProductImage(productName: string, category: string): Promise<string | null> {
  const apiKey = process.env.GOOGLE_API_KEY;
  const searchEngineId = process.env.SEARCH_ENGINE_ID;
  if (!apiKey || !searchEngineId) {
    console.error("CRITICAL: GOOGLE_API_KEY or SEARCH_ENGINE_ID is not set.");
    return null;
  }

  const query = `${productName} ${category} product photo`;
  const url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${searchEngineId}&q=${encodeURIComponent(
    query
  )}&searchType=image&num=1`;

  try {
    const response = await fetch(url);
    const raw = await response.text();
    if (!response.ok) {
      console.error(`[getProductImage] FAILED for "${query}" status=${response.status}`, raw);
      return null;
    }

    const data = JSON.parse(raw);
    if (!data.items?.length) return null;

    const item = data.items[0];
    // Method 1: MIME check
    if (item.mime?.startsWith("image/")) {
      return item.link;
    }
    // Method 2: extension fallback
    try {
      const parsed = new URL(item.link);
      const ext = parsed.pathname.split(".").pop()?.toLowerCase();
      if (ext && ["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext)) {
        return item.link;
      }
    } catch { /* ignore */ }
    return null;
  } catch (err) {
    console.error(`[getProductImage] ERROR for "${query}":`, err);
    return null;
  }
}

type ProductWithScore = Product & { score: number };

// --- MAIN API ROUTE ---
export async function POST(req: NextRequest) {
  const { query } = await req.json();
  if (!query) {
    return NextResponse.json({ error: "Query is required" }, { status: 400 });
  }

  const client = new MongoClient(process.env.MONGODB_URI || "");
  try {
    // 1) Embed and vector-search existing products
    const queryEmbedding = await generateEmbedding(query);
    await client.connect();
    const db = client.db("readreviewfirst");
    const products = db.collection<Product>("products");

    const vectorSearchPromise = (async () => {
      const ids = await products
        .find({ $text: { $search: query } }, { projection: { _id: 1 } })
        .map((d) => d._id)
        .toArray();
      if (!ids.length) return [];
      return products
        .aggregate<ProductWithScore>([
          {
            $vectorSearch: {
              index: "vector_index",
              path: "productEmbedding",
              queryVector: queryEmbedding,
              filter: { _id: { $in: ids } },
              numCandidates: 100,
              limit: 5,
            },
          },
          { $project: { _id: 1, name: 1, category: 1, images: 1, score: { $meta: "vectorSearchScore" } } },
        ])
        .toArray();
    })();

    // 2) Ask Gemini for up to 4 new product ideas
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || "");
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = `Brainstorm up to 4 specific, likely product names related to the search query: "${query}". Return a valid JSON array of objects, each with "name" and "category".`;
    const aiSuggestionPromise = model
      .generateContent(prompt)
      .then((r) => JSON.parse(r.response.text().replace(/```json\n|```/g, "").trim()))
      .catch((err) => {
        console.error("AI suggestion failed:", err);
        return [];
      });

    const [existing, aiIdeas] = await Promise.all([vectorSearchPromise, aiSuggestionPromise]);

    // 3) Map existing → our response format
    const finalSuggestions = existing.map((p) => ({
      name: p.name,
      category: p.category,
      exists: true,
      imageUrl: p.images?.[0] || null,
      slug: p._id,
    }));
    const seen = new Set(finalSuggestions.map((s) => s.slug));

    // 4) Filter out duplicates
    const newIdeas = aiIdeas.filter((s: any) => {
      const slug = `${s.category.toLowerCase().replace(/\s+/g, "-")}/${s.name
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, "")}`;
      return !seen.has(slug);
    });

    // 5) Rate-limited loop for placeholder fetch
    const newSuggestions = [];
    for (const idea of newIdeas) {
      const img = await getProductImage(idea.name, idea.category);
      newSuggestions.push({
        name: idea.name,
        category: idea.category,
        exists: false,
        imageUrl: img,        // ← unified field name
      });
      await new Promise((r) => setTimeout(r, 300));
    }

    // 6) Return combined list
    return NextResponse.json({
      query_type: "hybrid_filtered",
      suggestions: [...finalSuggestions, ...newSuggestions],
    });
  } catch (err: any) {
    console.error("Critical Interpret search error:", err);
    return NextResponse.json({ error: "AI had trouble understanding. Please try again." }, { status: 500 });
  } finally {
    await client.close();
  }
}
