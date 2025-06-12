// src/app/api/generate-image/route.ts
import { MongoClient } from 'mongodb';
import { NextRequest, NextResponse } from 'next/server';
import { Product } from '@/lib/types';

export async function POST(req: NextRequest) {
  const { productId, productName, category } = await req.json();

  if (!productId || !productName || !category) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  // Use AI to generate a descriptive prompt for our image generation service.
  const genAIPrompt = `Create a simple, descriptive prompt for an image generation AI. The product is "${productName}" in the category "${category}". The prompt should describe a clean, professional product photo on a white background. For example: "A professional studio product photo of a ${productName}, a ${category}, on a pure white background."`;
  
  // For simplicity in a hackathon, we can use a free, URL-based image generator.
  // In a real app, you would call DALL-E or Imagen here.
  const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(genAIPrompt)}`;

  const client = new MongoClient(process.env.MONGODB_URI || "");

  try {
    await client.connect();
    const db = client.db("readreviewfirst");
    const productsCollection = db.collection<Product>("products");

    // Update the product with the new AI-generated image URL.
    await productsCollection.updateOne(
      { _id: productId },
      { $set: { images: [imageUrl] } } // Save it as a single-item array
    );

    return NextResponse.json({ images: [imageUrl] });

  } catch (error) {
    console.error("AI Image Generation error:", error);
    return NextResponse.json({ error: "Failed to generate or save AI image" }, { status: 500 });
  } finally {
    await client.close();
  }
}