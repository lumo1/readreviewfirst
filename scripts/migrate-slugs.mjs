// scripts/migrate-slugs.mjs
import dotenv from 'dotenv';
import { MongoClient } from 'mongodb';

// load your .env.local
dotenv.config({ path: '.env.local' });

/**
 * Turn arbitrary text into a clean URL segment:
 *  - lowercase
 *  - spaces → hyphens
 *  - strip non-alphanum/hyphen
 *  - collapse multiples
 *  - trim hyphens
 */
function slugify(text) {
  return text
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

async function migrate() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('Missing MONGODB_URI in .env.local');
    process.exit(1);
  }

  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db('readreviewfirst');
  const col = db.collection('products');

  // fetch all products
  const all = await col.find().toArray();
  console.log(`Found ${all.length} products total.`);

  let moved = 0;
  for (const prod of all) {
    if (typeof prod.name !== 'string' || typeof prod.category !== 'string') {
      console.warn(`SKIP ${prod._id}: missing name or category`);
      continue;
    }

    const categorySlug = slugify(prod.category);
    const nameSlug     = slugify(prod.name);
    const correctId    = `${categorySlug}/${nameSlug}`;

    if (correctId === prod._id) {
      continue; // already correct
    }

    console.log(`→ Migrating "${prod._id}" → "${correctId}"`);

    // check if target ID already exists
    const conflict = await col.findOne({ _id: correctId });
    if (conflict) {
      console.warn(`   SKIP: target ID "${correctId}" already exists`);
      continue;
    }

    // insert under new ID
    const newDoc = { ...prod, _id: correctId };
    await col.insertOne(newDoc);

    // delete old
    await col.deleteOne({ _id: prod._id });

    moved++;
  }

  console.log(`\nMigration complete. ${moved} products moved.`);
  await client.close();
}

migrate().catch(err => {
  console.error(err);
  process.exit(1);
});
