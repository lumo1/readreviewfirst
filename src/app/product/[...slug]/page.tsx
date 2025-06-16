// src/app/product/[...slug]/page.tsx
import { notFound } from "next/navigation";
import { MongoClient, WithId } from "mongodb";
import { Product } from "@/lib/types";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import ProductImageGallery from "@/components/ProductImageGallery";
import ReviewCallout from "@/components/ReviewCallout";
import StarRating from "@/components/StarRating";
import ProsConsPills from "@/components/ProsConsPills";
import TwoColMarkdown from "@/components/TwoColMarkdown";
import ReviewActions from "@/components/ReviewActions";
import { Button } from "@/components/ui/button";
import Link from "next/link";

type Props = { params: { slug: string[] } };

export default async function ProductPage({ params }: Props) {
  // await the dynamic params as per Next13
  const { slug } = await params;
  const uniqueId = slug.join("/");

  const client = new MongoClient(process.env.MONGODB_URI || "");
  let product: WithId<Product> | null = null;
  try {
    await client.connect();
    product = await client.db("readreviewfirst")
                          .collection<Product>("products")
                          .findOne({ _id: uniqueId });
  } finally {
    await client.close();
  }
  if (!product) return notFound();

  return (
    <main className="flex justify-center bg-gray-50 p-8">
      <div className="w-full max-w-4xl">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-4xl">{product.name}</CardTitle>
            <ReviewCallout summary={product.review.shortSummary} />
            <StarRating rating={product.review.rating} />
          </CardHeader>

          <CardContent>
            <ProductImageGallery
              initialImages={product.images}
              productId={product._id}
              productName={product.name}
              category={product.category}
              initialSearchQuery={product.lastImageSearchQuery}
            />

            <div className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Pros & Cons</h2>
              <ProsConsPills pros={product.review.pros} cons={product.review.cons} />
            </div>

            <div className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Full Review</h2>
              <TwoColMarkdown markdown={product.review.detailedReview} />
            </div>

            <ReviewActions
              productId={product._id}
              initialScore={product.verification_score}
            />

            <div className="text-center mt-8">
              <Button asChild size="lg" className="bg-green-600 hover:bg-green-700">
                <Link
                  href={product.affiliateUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block truncate max-w-xs text-center"
                  title={product.review.cta}  // tooltip on overflow
                >
                  {product.review.cta}
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
