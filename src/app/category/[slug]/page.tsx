// src/app/category/[slug]/page.tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import { MongoClient } from "mongodb";
import SuggestionCard from "@/components/SuggestionCard";
import { slugify } from "@/lib/slugify";

// force dynamic in case you’re on Vercel’s edge or static‐by‐default
export const dynamic = "force-dynamic";

export default async function CategoryPage({
  params,
}: {
  params: { slug: string };
}) {
  const { slug } = params;

  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("Missing MONGODB_URI");
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db("readreviewfirst");

  // 1) get the real category name from the list
  const allCats: string[] = await db
    .collection("products")
    .distinct("category");
  const match = allCats.find((c) => slugify(c) === slug);
  if (!match) {
    await client.close();
    notFound();
  }

  // 2) fetch all products in that category
  const products = await db
    .collection("products")
    .find({ category: match })
    .toArray();
  await client.close();

  return (
    <main className="container mx-auto p-8">
      {/* Breadcrumbs */}
      <nav className="text-sm text-gray-500 mb-6">
        <Link href="/" className="hover:underline">
          Home
        </Link>
        <span className="px-2">/</span>
        <Link href="/categories" className="hover:underline">
          Categories
        </Link>
        <span className="px-2">/</span>
        <span>{match}</span>
      </nav>

      <h1 className="text-3xl font-bold mb-8">{match}</h1>

      {products.length === 0 ? (
        <p className="text-center text-gray-600">No products found.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((p) => (
            <SuggestionCard
              key={p._id.toString()}
              suggestion={{
                name: p.name,
                category: p.category,
                exists: true,
                slug: p._id.toString(),
                imageUrl: p.images?.[0] ?? null,
              }}
            />
          ))}
        </div>
      )}
    </main>
);
}
