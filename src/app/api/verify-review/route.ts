// src/app/api/verify-review/route.ts
import { MongoClient } from "mongodb";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { productId, action } = await req.json(); // action: 'upvote' or 'downvote'
  if (!productId || !action) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const client = new MongoClient(process.env.MONGODB_URI || "");

  try {
    await client.connect();
    
    // --- THIS IS THE MISSING LINE ---
    const db = client.db("readreviewfirst");
    // ---------------------------------

    const productsCollection = db.collection("products");

    // Use $inc to atomically increment the correct fields
    const updateField = action === 'upvote' 
      ? { verification_score: 1, upvotes: 1 } 
      : { verification_score: -1, downvotes: 1 };
    
    const result = await productsCollection.findOneAndUpdate(
      { _id: productId },
      { $inc: updateField },
      { returnDocument: 'after' } // This ensures the updated document is returned
    );

    if (!result) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // result.value is deprecated, use result directly if your driver version supports it, otherwise use result
    const updatedDocument = result;

    return NextResponse.json({ newScore: updatedDocument.verification_score });

  } catch (error) {
    console.error("Verification API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  } finally {
    await client.close();
  }
}