// src/app/api/generate-image/route.ts
import { MongoClient, WithId } from 'mongodb';
import { NextRequest, NextResponse } from 'next/server';
import { Product } from '@/lib/types';


// 2) Build the AI prompt
function buildAIPrompt(name: string, category: string) {
  return `Create a professional product‐photo prompt for an image AI:
Product = "${name}"
Category = "${category}"
Output a single sentence describing a clean studio shot on white background.`;
}

// 3) Unsplash fallback
async function getUnsplashImage(name: string, category: string): Promise<string|null> {
  const key = process.env.UNSPLASH_ACCESS_KEY;
  if (!key) return null;

  const q = `${name} ${category}`;
  const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(q)}&per_page=1&orientation=squarish`;
  try {
    const res = await fetch(url, { headers: { Authorization: `Client-ID ${key}` } });
    if (!res.ok) return null;
    const js = await res.json();
    return js.results?.[0]?.urls?.small || null;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  const { productId, productName, category } = await req.json();
  if (!productId || !productName || !category) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    return NextResponse.json({ error: 'Missing Mongo URI' }, { status: 500 });
  }

  const client = new MongoClient(uri);
  try {
    await client.connect();
    const products = client.db('readreviewfirst').collection<WithId<Product & { aiImageGeneratedAt?: string | Date }>>('products');

    // 1) Check cache + freshness
    const existing = await products.findOne(
      { _id: productId },
      { projection: { images: 1, aiImageGeneratedAt: 1 } }
    );
    if (existing?.images?.length && existing.aiImageGeneratedAt) {
      const age = Date.now() - new Date(existing.aiImageGeneratedAt).getTime();
      if (age < 7 * 24 * 60 * 60 * 1000) {
        // return proxied URLs so they go through your image-proxy
        const proxied = existing.images.map(url => `/api/image-proxy?url=${encodeURIComponent(url)}`);
        return NextResponse.json({ images: proxied });
      }
    }

    // 2) Generate Pollinations URL
    const prompt = buildAIPrompt(productName, category);
    const aiUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}`;

    // 3) Verify it works (optional)
    let finalUrl: string | null = null;
    try {
      const check = await fetch(aiUrl, { method: 'HEAD', signal: AbortSignal.timeout(5000) });
      if (check.ok) finalUrl = aiUrl;
    } catch {
      // Pollinations didn’t respond—fall back to Unsplash
      finalUrl = await getUnsplashImage(productName, category);
    }

    if (!finalUrl) {
      // no image at all
      return NextResponse.json({ images: [] }, { status: 200 });
    }

    const images = [`/api/image-proxy?url=${encodeURIComponent(finalUrl)}`];

    // 4) Save + timestamp
    await products.updateOne(
      { _id: productId },
      { $set: { images, aiImageGeneratedAt: new Date() } }
    );

    return NextResponse.json({ images });

  } catch (err) {
    console.error("AI Image Generation error:", err);
    return NextResponse.json({ error: "Failed to generate AI image" }, { status: 500 });
  } finally {
    await client.close();
  }
}
