// src/app/api/interpret-search/route.ts
import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";
import { MongoClient } from "mongodb";
import { Product } from "@/lib/types";
import { slugify } from "@/lib/slugify";

type Suggestion = {
  name:      string;
  category:  string;
  exists:    boolean;
  slug:      string;
  imageUrl:  string | null;
  score?:    number;
};

// helper to get one image from Google Custom Search
async function getGoogleImage(name: string, category: string): Promise<string|null> {
  const key = process.env.GOOGLE_API_KEY;
  const cx  = process.env.SEARCH_ENGINE_ID;
  if (!key || !cx) return null;

  const q   = `${name} ${category} product photo`;
  const url = `https://www.googleapis.com/customsearch/v1?key=${key}&cx=${cx}` +
              `&q=${encodeURIComponent(q)}&searchType=image&num=1`;

  try {
    const r  = await fetch(url);
    if (!r.ok) return null;
    const j  = await r.json();
    const it = j.items?.[0];
    return it?.link || null;
  } catch {
    return null;
  }
}

// fallback to Unsplash
async function getUnsplashImage(name: string, category: string): Promise<string|null> {
  const key = process.env.UNSPLASH_ACCESS_KEY;
  if (!key) return null;

  const q   = `${name} ${category}`;
  const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(q)}` +
              `&per_page=1&orientation=squarish`;

  try {
    const r  = await fetch(url, { headers: { Authorization: `Client-ID ${key}` } });
    if (!r.ok) return null;
    const j  = await r.json();
    return j.results?.[0]?.urls?.small || null;
  } catch {
    return null;
  }
}

// get embedding for vector search
async function generateEmbedding(text: string): Promise<number[]> {
  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || "");
  const mdl   = genAI.getGenerativeModel({ model: "text-embedding-004" });
  const res   = await mdl.embedContent(text);
  return res.embedding.values;
}

// GPU brainstorming
async function getAISuggestions(query: string) {
  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || "");
  const mdl   = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  const prompt = `Brainstorm up to 4 specific product names related to "${query}".` +
                 ` Return a JSON array of { "name", "category" } only.`;
  const r     = await mdl.generateContent(prompt);
  // 1) Pull out the full text
  const raw = await r.response.text();

  // 2) Strip out any ```json fences
  const cleaned = raw
    .replace(/```json\s*/g, "")
    .replace(/```/g, "")
    .trim();

  // 3) Parse
  try {
    return JSON.parse(cleaned);
  } catch (e) {
    console.error("Failed to parse AI JSON:", { raw, cleaned, err: e });
    return [];  // or throw, depending on how you want to recover
  }
}

export async function POST(req: NextRequest) {
  const { query } = await req.json();
  if (!query) return NextResponse.json({ error: "Query required" }, { status: 400 });

  const client = new MongoClient(process.env.MONGODB_URI || "");
  await client.connect();
  const coll = client.db("readreviewfirst").collection<Product>("products");

  // 1) Text + Vector search
  const textHits = await coll.find({ $text: { $search: query } }, { projection: { _id: 1 } })
                              .map(d => d._id).toArray();

  let existingRaw: Array<Product & { score?: number }> = [];
  if (textHits.length) {
    try {
      const vec = await generateEmbedding(query);
      existingRaw = await coll.aggregate([
        {
          $vectorSearch: {
            index: "vector_index",
            path:  "productEmbedding",
            queryVector: vec,
            filter:      { _id: { $in: textHits } },
            numCandidates: 50,
            limit: 5
          }
        },
        { $project: { _id:1, name:1, category:1, images:1, score: { $meta:"vectorSearchScore" } } }
      ]).toArray() as Array<Product & { score?: number }>;
    } catch {
      // fallback to plain text hits if vector search fails
      existingRaw = await coll.find({ _id: { $in: textHits } })
                              .project({ name:1, category:1, images:1 })
                              .toArray() as Array<Product & { score?: number }>;
      existingRaw.forEach((d: Product & { score?: number }) => d.score = 1);
    }
  }

  // 2) AI ideas
  const aiIdeas = await getAISuggestions(query);

  // 3) format & dedupe
  const suggestions: Suggestion[] = [];
  const seen = new Set<string>();

  // existing
  for (const p of existingRaw) {
    const slug = p._id;
    seen.add(slug);
    suggestions.push({
      name:     p.name,
      category: p.category,
      exists:   true,
      slug,
      imageUrl: p.images?.[0] ?? null,
      score:    p.score
    });
  }

  // new AI ideas
  for (const idea of aiIdeas) {
    const catSlug  = slugify(idea.category);
    const nameSlug = slugify(idea.name);
    const slug     = `${catSlug}/${nameSlug}`;
    if (seen.has(slug)) continue;
    seen.add(slug);
    suggestions.push({
      name:     idea.name,
      category: idea.category,
      exists:   false,
      slug,
      imageUrl: null  // we'll populate below
    });
  }

  // 4) One‐time image fetch for anything still missing
  for (const s of suggestions) {
    if (s.imageUrl === null) {
      // only do one lookup per item
      s.imageUrl = await getGoogleImage(s.name!, s.category!) 
                ?? await getUnsplashImage(s.name!, s.category!)
                ?? null;
      // be gentle on the APIs
      await new Promise(r => setTimeout(r, 250));
    }
  }

  await client.close();
  return NextResponse.json({ query_type: "hybrid_filtered", suggestions });
}
