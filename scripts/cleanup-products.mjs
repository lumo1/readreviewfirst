// scripts/cleanup-products.mjs

/**
 * cleanup-products.mjs
 *
 * Purpose:
 *  - Remove specific legacy products that were missing `name` or `category` fields,
 *    which broke slug generation and routing.
 *  - Purge any products without images, ensuring the site only displays items
 *    with at least one image (important for user experience).
 *
 * Usage:
 *   1. Make sure you have installed dependencies:
 *        npm install dotenv mongodb
 *   2. Run the script from your project root:
 *        node ./scripts/cleanup-products.mjs
 */

import dotenv from 'dotenv';
import { MongoClient } from 'mongodb';

// Load environment variables from .env.local (or .env)
dotenv.config({ path: '.env.local' });

async function cleanup() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('ERROR: MONGODB_URI not set in .env.local');
    process.exit(1);
  }

  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db('readreviewfirst');
  const col = db.collection('products');

  // 1) Remove previously identified bad products
  //    These documents lacked `name` or `category` fields and were skipped
  //    in our slug migration. They cannot be displayed correctly.
  const badIds = [
    'mug-from-italy',
    'yellow-tablet',
    'green-monkey',
    'ding-dong-doorbell'
  ];
  const { deletedCount: deletedBad } = await col.deleteMany({
    _id: { $in: badIds }
  });
  console.log(`Removed ${deletedBad} legacy products missing name/category.`);

  // 2) Remove any product documents without images
  //    We want to ensure every product shown to users has at least one image.
  const { deletedCount: deletedNoImg } = await col.deleteMany({
    $or: [
      { images: { $exists: false } }, // no images field
      { images: { $size: 0 } }         // empty images array
    ]
  });
  console.log(`Removed ${deletedNoImg} products without images.`);

  await client.close();
  console.log('Cleanup complete. Please restart your development server.');
}

cleanup().catch(err => {
  console.error('Cleanup script failed:', err);
  process.exit(1);
});
