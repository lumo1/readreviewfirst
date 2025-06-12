// scripts/backfill-embeddings.mjs
import dotenv from 'dotenv';
import { MongoClient } from 'mongodb';
import { GoogleGenerativeAI } from '@google/generative-ai';

// =============================================================================
// SCRIPT DOCUMENTATION
// =============================================================================
//
// WHAT IS THIS SCRIPT?
// This is a one-time or occasional maintenance script. Its purpose is to find
// all products in the 'products' collection in MongoDB that are missing the
// `productEmbedding` field and generate it for them using Google's AI model.
//
// WHEN SHOULD I RUN THIS?
// 1. Run it once after adding the `productEmbedding` field to the Product type.
// 2. Run it any time you manually add products to the database without going
//    through the application's create-product API (which generates embeddings
//    automatically).
//
// HOW DO I RUN THIS?
// 1. Make sure you have run `npm install dotenv`.
// 2. From your project's root directory, run the following command in your terminal:
//    node ./scripts/backfill-embeddings.mjs
//
// =============================================================================

// Configure dotenv to load variables from your .env.local file
dotenv.config({ path: '.env.local' });

/**
 * Generates a vector embedding for a given text string.
 * @param {string} text - The text to embed.
 * @param {GoogleGenerativeAI} genAI - The Google AI client instance.
 * @returns {Promise<number[]|null>} The embedding array or null if it fails.
 */
async function generateEmbedding(text, genAI) {
  const embeddingModel = genAI.getGenerativeModel({ model: "text-embedding-004" });
  try {
    const result = await embeddingModel.embedContent(text);
    return result.embedding.values;
  } catch (error) {
    console.error(`Failed to embed: "${text}". Skipping. Error: ${error.message}`);
    return null;
  }
}

/**
 * The main backfill function.
 */
async function backfill() {
  if (!process.env.MONGODB_URI || !process.env.GOOGLE_API_KEY) {
    console.error("ERROR: Missing MONGODB_URI or GOOGLE_API_KEY in the .env.local file.");
    return;
  }

  const client = new MongoClient(process.env.MONGODB_URI);
  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
  
  console.log("Connecting to database...");
  await client.connect();
  console.log("Connected successfully.");
  
  const db = client.db("readreviewfirst");
  const productsCollection = db.collection("products");

  // Find all products that DO NOT have the productEmbedding field.
  const productsToUpdate = await productsCollection.find({ productEmbedding: { $exists: false } }).toArray();

  if (productsToUpdate.length === 0) {
    console.log("All products already have embeddings. Nothing to do.");
    await client.close();
    return;
  }

  console.log(`Found ${productsToUpdate.length} products that need an embedding.`);

  for (const product of productsToUpdate) {
    console.log(`- Generating embedding for: ${product.name}`);
    const embedding = await generateEmbedding(product.name, genAI);
    
    // Only update if the embedding was successfully generated.
    if (embedding) {
      await productsCollection.updateOne(
        { _id: product._id },
        { $set: { productEmbedding: embedding } }
      );
      console.log(`  -> Updated document: ${product._id}`);
    }
  }

  console.log("\nBackfill script finished.");
  await client.close();
}

// Execute the main function.
backfill();