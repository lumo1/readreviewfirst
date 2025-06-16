// src/app/api/interpret-search/route.ts
import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse }   from "next/server";
import { MongoClient }                 from "mongodb";
import { Product }                     from "@/lib/types";

type ProductWithScore = Product & { score: number };

// ————————————————————————————————————————————————————————————————
// 1) HELPER: Embedding
async function generateEmbedding(text: string): Promise<number[]> {
  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || "");
  const model = genAI.getGenerativeModel({ model: "text-embedding-004" });
  const res   = await model.embedContent(text);
  return res.embedding.values;
}

// ————————————————————————————————————————————————————————————————
// 2) HELPER: Google Custom Search (for EXISTING products only)
async function getGoogleImage(productName: string, category: string): Promise<string|null> {
  const apiKey        = process.env.GOOGLE_API_KEY;
  const searchEngine = process.env.SEARCH_ENGINE_ID;
  if (!apiKey || !searchEngine) return null;

  const q   = `${productName} ${category} product photo`;
  const url = `https://www.googleapis.com/customsearch/v1?` +
              `key=${apiKey}&cx=${searchEngine}` +
              `&q=${encodeURIComponent(q)}` +
              `&searchType=image&num=1`;

  try {
    const r    = await fetch(url);
    const txt  = await r.text();
    if (!r.ok) {
      console.warn(`[getGoogleImage] failed ${r.status} for “${q}”`);
      return null;
    }
    const js   = JSON.parse(txt);
    const item = js.items?.[0];
    if (!item) return null;
    // trust mime or extension
    if (item.mime?.startsWith("image/")) return item.link;
    const ext = new URL(item.link).pathname.split(".").pop()?.toLowerCase();
    if (ext && ["jpg","jpeg","png","gif","webp","svg"].includes(ext)) return item.link;
  } catch (e) {
    console.error("[getGoogleImage] error", e);
  }
  return null;
}

// ————————————————————————————————————————————————————————————————
// 3) HELPER: Unsplash (for NEW products / placeholders)
async function getUnsplashImage(productName: string, category: string): Promise<string|null> {
  const key = process.env.UNSPLASH_ACCESS_KEY;
  if (!key) return null;

  const q   = `${productName} ${category}`;
  const url = `https://api.unsplash.com/search/photos` +
              `?query=${encodeURIComponent(q)}` +
              `&per_page=1&orientation=squarish`;

  try {
    const r  = await fetch(url, {
      headers: { Authorization: `Client-ID ${key}` }
    });
    if (!r.ok) {
      console.warn(`[getUnsplashImage] ${r.status} searching “${q}”`);
      return null;
    }
    const js = await r.json();
    return js.results?.[0]?.urls?.small || null;
  } catch (e) {
    console.error("[getUnsplashImage] error", e);
    return null;
  }
}

// ————————————————————————————————————————————————————————————————
// MAIN
export async function POST(req: NextRequest) {
  const { query } = await req.json();
  if (!query) {
    return NextResponse.json({ error: "Query is required" }, { status: 400 });
  }

  const client = new MongoClient(process.env.MONGODB_URI || "");
  try {
    // 1) embed & vector‐search existing
    const queryEmbedding = await generateEmbedding(query);
    await client.connect();
    const db      = client.db("readreviewfirst");
    const coll    = db.collection<Product>("products");
    const textIds = await coll
      .find({ $text: { $search: query } }, { projection: { _id: 1 } })
      .map(d => d._id)
      .toArray();
    
    let existing: ProductWithScore[] = [];
    if (textIds.length) {
      existing = await coll.aggregate<ProductWithScore>([
        {
          $vectorSearch: {
            index: "vector_index",
            path: "productEmbedding",
            queryVector: queryEmbedding,
            filter: { _id: { $in: textIds } },
            numCandidates: 50,
            limit: 5
          }
        },
        {
          $project: {
            _id: 1,
            name: 1,
            category: 1,
            images: 1,
            score: { $meta: "vectorSearchScore" }
          }
        }
      ]).toArray();
    }

    // 2) generate up to 4 new ideas via Gemini
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || "");
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = `Brainstorm up to 4 specific, likely product names related to "${query}".` +
                   ` Return a JSON array, each with "name" and "category".`;
    const aiJson = await model
      .generateContent(prompt)
      .then(r => JSON.parse(
        r.response.text().replace(/```json\n|```/g, "").trim()
      ))
      .catch(e => {
        console.error("[AI] suggestion failed", e);
        return [];
      });

    // 3) dedupe & format “existing”
    const formattedExisting = existing.map(p => ({
      name: p.name,
      category: p.category,
      exists: true,
      imageUrl: p.images?.[0] || null,
      slug: p._id,
      score: p.score
    }));
    const seen = new Set(formattedExisting.map(x => x.slug));

    // 4) for each new idea → only unsplash
    const newOnes = aiJson.filter((s: any) => {
      const slug = `${s.category}`.toLowerCase()
                   .replace(/\s+/g, "-")
                   .replace(/[^a-z0-9-]/g, "");
      return !seen.has(slug);
    });

    const newSuggestions = [];
    for (const idea of newOnes) {
      const placeholder = await getUnsplashImage(idea.name, idea.category);
      newSuggestions.push({
        name: idea.name,
        category: idea.category,
        exists: false,
        imageUrl: placeholder
      });
      // be nice to Unsplash
      await new Promise(r => setTimeout(r, 250));
    }

    return NextResponse.json({
      query_type: "hybrid_filtered",
      suggestions: [...formattedExisting, ...newSuggestions]
    });
  } catch (e: any) {
    console.error("Interpret search error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  } finally {
    await client.close();
  }
}
