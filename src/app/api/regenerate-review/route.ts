// src/app/api/regenerate-review/route.ts

import { NextRequest, NextResponse } from "next/server";
import { MongoClient }            from "mongodb";
import { GoogleGenerativeAI }     from "@google/generative-ai";
import { Product, ReviewVersion } from "@/lib/types";

interface RegenerateBody {
  productId: string;
}

async function getAIReview(name: string, category: string): Promise<ReviewVersion> {
  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || "");
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const prompt = `
You are an AI product reviewing expert. Output ONLY valid JSON with these keys:
  • "shortSummary": a single-sentence TL;DR.
  • "rating": number 0–5 (one decimal).
  • "pros": array of strings.
  • "cons": array of strings.
  • "detailedReview": markdown‐formatted full review.
  • "cta": a concise recommendation sentence.
  • "imageSearchQuery": the query to fetch a clean product photo.

Regenerate a fresh review for:
  Name: "${name}"
  Category: "${category}"
  Return exactly the JSON structure above—no extra text.
`;

  const aiRaw = await model.generateContent(prompt);
  const txt   = await aiRaw.response.text();
  const cleaned = txt.replace(/```json\s*/g, "").replace(/```/g, "").trim();
  const parsed = JSON.parse(cleaned);

  return {
    review: {
      shortSummary:   parsed.shortSummary,
      rating:         parsed.rating,
      pros:           parsed.pros,
      cons:           parsed.cons,
      detailedReview: parsed.detailedReview,
      cta:            parsed.cta,
    },
    imageSearchQuery: parsed.imageSearchQuery,
    generatedAt:      new Date(),
  };
}

export async function POST(req: NextRequest) {
  const { productId } = (await req.json()) as RegenerateBody;
  if (!productId) {
    return NextResponse.json({ error: "productId required" }, { status: 400 });
  }

  const client = new MongoClient(process.env.MONGODB_URI || "");
  try {
    await client.connect();
    const coll = client.db("readreviewfirst").collection<Product>("products");
    const prod = await coll.findOne({ _id: productId });
    if (!prod) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Generate a brand-new version
    const newVersion = await getAIReview(prod.name, prod.category);

    // Push it onto the history
    await coll.updateOne(
      { _id: productId },
      {
        $push: { reviewHistory: newVersion },
        $set:  { lastImageSearchQuery: newVersion.imageSearchQuery },
      }
    );

    return NextResponse.json({ newVersion });
  } finally {
    await client.close();
  }
}
