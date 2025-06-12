// src/app/api/get-image-url/route.ts
import { NextRequest, NextResponse } from 'next/server';

async function getProductImage(productName: string, category: string): Promise<string | null> {
  const apiKey = process.env.GOOGLE_API_KEY;
  const searchEngineId = process.env.SEARCH_ENGINE_ID;
  const query = `${productName} ${category}`;
  const url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${searchEngineId}&q=${encodeURIComponent(query)}&searchType=image&num=1`;
  
  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.error(`Image search failed for "${query}" with status: ${response.status}`);
      return null;
    }
    const data = await response.json();
    return data.items?.[0]?.link || null;
  } catch (error) {
    console.error(`Image Search API Error for "${query}":`, error);
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const { productName, category } = await req.json();
    if (!productName || !category) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }
    const imageUrl = await getProductImage(productName, category);
    if (!imageUrl) {
      return NextResponse.json({ error: 'Image not found' }, { status: 404 });
    }
    return NextResponse.json({ imageUrl });
  } catch (error) {
    console.error("Error in get-image-url route:", error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}