// src/app/api/fetch-images/route.ts
import { MongoClient } from 'mongodb';
import { NextRequest, NextResponse } from 'next/server';

//
// 1) Try Google Custom Search
//
async function getGoogleImages(query: string): Promise<string[]> {
  const apiKey       = process.env.GOOGLE_API_KEY;
  const searchEngine = process.env.SEARCH_ENGINE_ID;
  if (!apiKey || !searchEngine) return [];

  const url =
    `https://www.googleapis.com/customsearch/v1?key=${apiKey}` +
    `&cx=${searchEngine}` +
    `&q=${encodeURIComponent(query)}` +
    `&searchType=image&num=5`;

  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.warn(`[getGoogleImages] Google returned ${res.status} for "${query}"`);
      return [];
    }
    const data: any = await res.json();
    if (!Array.isArray(data.items) || data.items.length === 0) return [];
    return data.items.map((item: any) => item.link as string);
  } catch (err) {
    console.error("[getGoogleImages] network error:", err);
    return [];
  }
}

//
// 2) Fallback to Unsplash
//
async function getUnsplashImage(query: string): Promise<string | null> {
  const key = process.env.UNSPLASH_ACCESS_KEY;
  if (!key) return null;

  const url =
    `https://api.unsplash.com/search/photos` +
    `?query=${encodeURIComponent(query)}` +
    `&per_page=1&orientation=landscape`;

  try {
    const res = await fetch(url, {
      headers: { Authorization: `Client-ID ${key}` }
    });
    if (!res.ok) {
      console.warn(`[getUnsplashImage] Unsplash returned ${res.status} for "${query}"`);
      return null;
    }
    const data: any = await res.json();
    const photo = data.results?.[0];
    return photo?.urls?.small || null;
  } catch (err) {
    console.error("[getUnsplashImage] network error:", err);
    return null;
  }
}

export async function POST(req: NextRequest) {
  const { productId, searchQuery } = await req.json();
  if (!productId || !searchQuery) {
    return NextResponse.json(
      { error: "Product ID and searchQuery are required" },
      { status: 400 }
    );
  }

  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    return NextResponse.json(
      { error: "Missing MongoDB URI" },
      { status: 500 }
    );
  }

  const client = new MongoClient(mongoUri);
  try {
    await client.connect();
    const db = client.db("readreviewfirst");
    const products = db.collection("products");

    // 1) Try to reuse cache if the same query
    const existing = await products.findOne<{
      images: string[];
      lastImageSearchQuery?: string;
    }>(
      { _id: productId },
      { projection: { images: 1, lastImageSearchQuery: 1 } }
    );

    let images: string[] = [];

    if (
      existing?.images?.length &&
      existing.lastImageSearchQuery === searchQuery
    ) {
      images = existing.images;
    } else {
      // 2) Attempt Google
      images = await getGoogleImages(searchQuery);

      // 3) If no Google results, try Unsplash once
      if (images.length === 0) {
        const unsplashUrl = await getUnsplashImage(searchQuery);
        if (unsplashUrl) {
          images = [unsplashUrl];
        }
      }

      // 4) Save whatever we got (could be empty if both failed)
      await products.updateOne(
        { _id: productId },
        { $set: { images, lastImageSearchQuery: searchQuery } }
      );
    }

    return NextResponse.json({ images });
  } catch (err) {
    console.error("Fetch-images error:", err);
    return NextResponse.json(
      { error: "Failed to fetch images" },
      { status: 500 }
    );
  } finally {
    await client.close();
  }
}
