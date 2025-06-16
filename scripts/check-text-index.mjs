// scripts/check-text-index.mjs
import dotenv from 'dotenv';
import { MongoClient } from 'mongodb';

dotenv.config({ path: '.env.local' });

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('Missing MONGODB_URI in .env.local');

  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db('readreviewfirst');
  const col = db.collection('products');

  // 1) List all indexes
  console.log('\n📑 Indexes on products:');
  const indexes = await col.listIndexes().toArray();
  indexes.forEach(idx => {
    console.log(` • ${idx.name} →`, idx.key);
  });

  // 2) Check for any text index
  const hasText =
    indexes.some(idx =>
      Object.values(idx.key).some(v => v === 'text')
    );
  console.log(`\n🔍 Text index present? ${hasText ? '✅ yes' : '❌ no'}`);

  // 3) Try a text search
  if (hasText) {
    const sampleQuery = 'new balance';
    const found = await col
      .find({ $text: { $search: sampleQuery } }, { projection: { _id: 1, score: { $meta: 'textScore' } } })
      .sort({ score: { $meta: 'textScore' } })
      .limit(5)
      .toArray();

    console.log(`\n🔎 Text‐search for "${sampleQuery}" returned ${found.length} docs:`);
    found.forEach(doc => console.log('   •', doc._id, `(score=${doc.score.toFixed(2)})`));
  } else {
    console.log('\n⚠️  Skipping sample find because no text index is defined.');
  }

  await client.close();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
