// src/app/categories/page.tsx
import Link from "next/link";
import { MongoClient } from "mongodb";
import { slugify } from "@/lib/slugify";

export default async function CategoriesPage() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("Missing MONGODB_URI");
  }
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db("readreviewfirst");
  const names: string[] = await db
    .collection("products")
    .distinct("category");
  await client.close();

  const sorted = names.sort((a, b) => a.localeCompare(b));

  return (
    <main className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">All Categories</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {sorted.map((cat) => {
          const slug = slugify(cat);
          return (
            <Link
              key={slug}
              href={`/category/${slug}`}
              className="block rounded-lg border bg-white p-4 text-center hover:shadow-lg transition"
            >
              {cat}
            </Link>
          );
        })}
      </div>
    </main>
  );
}
