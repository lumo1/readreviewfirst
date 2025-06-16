// scripts/init-image-cache-index.mjs
import dotenv from 'dotenv';
import { MongoClient } from 'mongodb';

// =============================================================================
// SCRIPT DOCUMENTATION
// =============================================================================
//
// WHAT IS THIS SCRIPT?
// This one‐time (or occasional) maintenance script creates a TTL index on the
// `imageCache` collection in your `readreviewfirst` MongoDB database. Documents
// inserted into `imageCache` will automatically expire 7 days after their
// `createdAt` timestamp.
//
// WHEN SHOULD I RUN THIS?
// 1. Run once after you add the caching logic for `getProductImage` or
//    `getProductImages`, so that old cache entries auto‐delete.
// 2. You can re‐run it safely if you ever drop or recreate the index.
//
// HOW DO I RUN THIS?
// 1. Ensure you’ve installed dependencies:
//      npm install dotenv mongodb
// 2. From the project root, execute:
//      node ./scripts/init-image-cache-index.mjs
//
// =============================================================================

// Load environment variables from .env.local (or .env)
dotenv.config({ path: '.env.local' });

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("ERROR: Missing MONGODB_URI in your environment.");
    process.exit(1);
  }

  const client = new MongoClient(uri);
  try {
    console.log("Connecting to MongoDB...");
    await client.connect();

    const db = client.db("readreviewfirst");
    console.log("Ensuring TTL index on imageCache.createdAt...");
    const result = await db.collection("imageCache").createIndex(
      { createdAt: 1 },
      { expireAfterSeconds: 7 * 24 * 60 * 60 } // 7 days
    );

    console.log("Index created or already exists:", result);
    console.log("Done.");
  } catch (err) {
    console.error("Failed to create TTL index:", err);
  } finally {
    await client.close();
  }
}

main();
