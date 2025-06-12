// src/app/api/image-proxy/route.ts
import { NextRequest, NextResponse } from "next/server";

// A simple helper function to validate if a string is a well-formed URL
function isValidUrl(string: string) {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const imageUrl = searchParams.get("url");

  // Validate the URL parameter first
  if (!imageUrl || !isValidUrl(imageUrl)) {
    return new NextResponse("A valid URL parameter is required.", { status: 400 });
  }

  try {
    const imageResponse = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      signal: AbortSignal.timeout(8000), // 8-second timeout
    });

    if (!imageResponse.ok) {
      return new NextResponse(`Failed to fetch image: ${imageResponse.statusText}`, { status: imageResponse.status });
    }

    // Check the Content-Type to ensure we're serving an actual image
    const contentType = imageResponse.headers.get("content-type");
    if (!contentType || !contentType.startsWith("image/")) {
      return new NextResponse("The linked resource is not a valid image.", { status: 400 });
    }

    const imageBuffer = await imageResponse.arrayBuffer();
    
    // Set the correct headers for the response to the browser
    const headers = new Headers({
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=31536000, immutable'
    });

    return new NextResponse(imageBuffer, { status: 200, headers });

  } catch (error: any) {
    console.error(`Image proxy error for URL: ${imageUrl}`, {
      message: error.message,
      cause: error.cause,
    });
    return new NextResponse("An error occurred while proxying the image.", { status: 500 });
  }
}