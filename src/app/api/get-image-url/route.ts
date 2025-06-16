// src/app/api/get-image-url/route.ts
import { NextRequest, NextResponse } from 'next/server';

//
// 1) Try Google Custom Search
//
async function getGoogleImage(productName: string, category: string): Promise<string | null> {
  const apiKey        = process.env.GOOGLE_API_KEY;
  const searchEngine  = process.env.SEARCH_ENGINE_ID;
  if (!apiKey || !searchEngine) return null;

  const query = `${productName} ${category} product photo`;
  const url   = `https://www.googleapis.com/customsearch/v1?` +
                `key=${apiKey}&cx=${searchEngine}` +
                `&q=${encodeURIComponent(query)}` +
                `&searchType=image&num=1`;

  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.warn(`[getGoogleImage] ${res.status} for "${query}"`);
      return null;
    }
    const js   = await res.json();
    const item = js.items?.[0];
    if (!item) return null;

    // Trust MIME if provided…
    if (item.mime?.startsWith('image/')) {
      return item.link;
    }
    // …otherwise check extension
    const ext = new URL(item.link).pathname.split('.').pop()?.toLowerCase();
    if (ext && ['jpg','jpeg','png','gif','webp','svg'].includes(ext)) {
      return item.link;
    }
  } catch (e) {
    console.error('[getGoogleImage] error', e);
  }
  return null;
}

//
// 2) Fallback to Unsplash
//
async function getUnsplashImage(productName: string, category: string): Promise<string | null> {
  const key = process.env.UNSPLASH_ACCESS_KEY;
  if (!key) return null;

  const query = `${productName} ${category}`;
  const url   = `https://api.unsplash.com/search/photos` +
                `?query=${encodeURIComponent(query)}` +
                `&per_page=1&orientation=squarish`;

  try {
    const res = await fetch(url, {
      headers: { Authorization: `Client-ID ${key}` }
    });
    if (!res.ok) {
      console.warn(`[getUnsplashImage] ${res.status} for "${query}"`);
      return null;
    }
    const js = await res.json();
    return js.results?.[0]?.urls?.small || null;
  } catch (e) {
    console.error('[getUnsplashImage] error', e);
    return null;
  }
}

//
// 3) Route handler
//
export async function POST(req: NextRequest) {
  try {
    const { productName, category } = await req.json();
    if (!productName || !category) {
      return NextResponse.json(
        { error: 'Missing parameters' },
        { status: 400 }
      );
    }

    // 1) Attempt Google first
    let imageUrl = await getGoogleImage(productName, category);

    // 2) If Google fails, fall back to Unsplash
    if (!imageUrl) {
      imageUrl = await getUnsplashImage(productName, category);
    }

    // 3) If still nothing, return 404
    if (!imageUrl) {
      return NextResponse.json(
        { error: 'Image not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ imageUrl });
  } catch (error) {
    console.error('Error in get-image-url route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
