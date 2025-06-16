// src/app/api/image-proxy/route.ts
<<<<<<< HEAD
=======
<<<<<<< HEAD
>>>>>>> 72a3fcc6448439a8dc02337b5b40a80617202a73
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
<<<<<<< HEAD
=======
=======
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const imageUrl = searchParams.get('url');

  if (!imageUrl) {
    return new NextResponse('URL parameter is missing', { status: 400 });
  }

  try {
    const imageResponse = await fetch(imageUrl);

    if (!imageResponse.ok) {
      return new NextResponse('Failed to fetch image', { status: imageResponse.status });
    }

    const contentType = imageResponse.headers.get('content-type') || 'application/octet-stream';
    const imageBuffer = await imageResponse.arrayBuffer();

    return new NextResponse(imageBuffer, {
      status: 200,
      headers: { 'Content-Type': contentType },
    });

  } catch (error) {
    console.error("Image proxy error:", error);
    return new NextResponse('Internal Server Error', { status: 500 });
>>>>>>> 0c5de07fcdeef2d115c20d12a6a065d9dcbee33a
>>>>>>> 72a3fcc6448439a8dc02337b5b40a80617202a73
  }
}