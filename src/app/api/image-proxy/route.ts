// src/app/api/image-proxy/route.ts
import { NextRequest, NextResponse } from "next/server";

// Helper to validate URLs
function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const imageUrl = searchParams.get("url");

  // Validate query parameter
  if (!imageUrl || !isValidUrl(imageUrl)) {
    return new NextResponse("A valid 'url' parameter is required.", { status: 400 });
  }

  try {
    const imageResponse = await fetch(imageUrl, {
      headers: {
        // Some servers block non-browser user agents
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      // Abort if it takes too long
      signal: AbortSignal.timeout(8000),
    });

    if (!imageResponse.ok) {
      return new NextResponse(
        `Failed to fetch image: ${imageResponse.status} ${imageResponse.statusText}`,
        { status: imageResponse.status }
      );
    }

    const contentType = imageResponse.headers.get("content-type") || "";
    if (!contentType.startsWith("image/")) {
      return new NextResponse("The requested resource is not an image.", { status: 400 });
    }

    const buffer = await imageResponse.arrayBuffer();
    const headers = new Headers({
      'Content-Type': contentType,
      // Cache images aggressively
      'Cache-Control': 'public, max-age=31536000, immutable',
    });

    return new NextResponse(buffer, { status: 200, headers });
  } catch (error: unknown) {
    console.error(`Image proxy error for URL: ${imageUrl}`, error);
    return new NextResponse(
      "An error occurred while proxying the image.",
      { status: 500 }
    );
  }
}
