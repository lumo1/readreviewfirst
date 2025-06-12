// src/app/api/fetch-images/route.ts
import { MongoClient } from 'mongodb';
import { NextRequest, NextResponse } from 'next/server';

// Copied helper function.
async function getProductImages(query: string): Promise<string[]> {
  const apiKey = process.env.GOOGLE_API_KEY;
  const searchEngineId = process.env.SEARCH_ENGINE_ID;
  const url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${searchEngineId}&q=${encodeURIComponent(query)}&searchType=image&num=5`;
  try {
    const response = await fetch(url);
    if (!response.ok) return [];
    const data = await response.json();
    if (!data.items || data.items.length === 0) return [];
    return data.items.map((item: { link: string }) => item.link);
  } catch (error) {
    console.error("Image Search API Error:", error);
    return [];
  }
}

export async function POST(req: NextRequest) {
  const { productId, searchQuery } = await req.json();

  if (!productId || !searchQuery) {
    return NextResponse.json({ error: 'Product ID and Search Query are required' }, { status: 400 });
  }

  const client = new MongoClient(process.env.MONGODB_URI || "");

  try {
    const images = await getProductImages(searchQuery);

    if (images.length === 0) {
      return NextResponse.json({ message: "Still couldn't find any images with that query." }, { status: 404 });
    }

    await client.connect();
    const db = client.db("readreviewfirst");
    const productsCollection = db.collection("products");

    await productsCollection.updateOne(
      { _id: productId },
      { $set: { images: images, lastImageSearchQuery: searchQuery } }
    );

    return NextResponse.json({ images });

  } catch (error) {
    console.error("Fetch images error:", error);
    return NextResponse.json({ error: "Failed to fetch images" }, { status: 500 });
  } finally {
    await client.close();
  }
}