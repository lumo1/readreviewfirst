import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI || "";
async function getCollection() {
  const client = new MongoClient(uri);
  await client.connect();
  return { collection: client.db("readreviewfirst").collection("imageCache"), client };
}

export type CacheEntry = { query: string; url: string | null; createdAt: Date };

export async function lookupCachedImage(query: string): Promise<string | null> {
  const { collection, client } = await getCollection();
  try {
    const doc = await collection.findOne<{ url: string }>({ query });
    return doc?.url ?? null;
  } finally {
    await client.close();
  }
}

export async function storeCachedImage(query: string, url: string | null): Promise<void> {
  const { collection, client } = await getCollection();
  try {
    await collection.updateOne(
      { query },
      { $set: { url, createdAt: new Date() } },
      { upsert: true }
    );
  } finally {
    await client.close();
  }
}
