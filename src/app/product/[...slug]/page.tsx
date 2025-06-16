// src/app/product/[...slug]/page.tsx
import { notFound } from "next/navigation";
import { MongoClient, WithId } from "mongodb";
import { Product } from "@/lib/types";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
<<<<<<< HEAD
import remarkGfm from 'remark-gfm';
=======
<<<<<<< HEAD
import remarkGfm from 'remark-gfm';
=======
>>>>>>> 0c5de07fcdeef2d115c20d12a6a065d9dcbee33a
>>>>>>> 72a3fcc6448439a8dc02337b5b40a80617202a73
import ProductImageGallery from "@/components/ProductImageGallery";
import ReviewActions from "@/components/ReviewActions";

type Props = {
  params: { slug: string[] };
};

export default async function ProductPage({ params }: Props) {
<<<<<<< HEAD
  // Await the params object before accessing its properties for dynamic routes.
=======
<<<<<<< HEAD
  // --- THIS IS THE FIX ---
  // Await the params object before accessing its properties for dynamic routes.
=======
>>>>>>> 0c5de07fcdeef2d115c20d12a6a065d9dcbee33a
>>>>>>> 72a3fcc6448439a8dc02337b5b40a80617202a73
  const { slug } = await params;
  const uniqueId = slug.join('/');

  const client = new MongoClient(process.env.MONGODB_URI || "");
  let product: WithId<Product> | null = null;
  
  try {
    await client.connect();
    const db = client.db("readreviewfirst");
    const productsCollection = db.collection<Product>("products");
<<<<<<< HEAD
=======
<<<<<<< HEAD
=======
    
>>>>>>> 0c5de07fcdeef2d115c20d12a6a065d9dcbee33a
>>>>>>> 72a3fcc6448439a8dc02337b5b40a80617202a73
    product = await productsCollection.findOne({ _id: uniqueId });
  } finally {
    await client.close();
  }

  if (!product) {
    notFound();
  }

  return (
    <main className="flex justify-center min-h-screen p-4 sm:p-8 bg-gray-50">
      <div className="w-full max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl font-bold text-center">
              {product.name}
            </CardTitle>
            <p className="text-center text-sm text-gray-500 pt-2">
              AI-Generated Review & Analysis
            </p>
<<<<<<< HEAD
=======
<<<<<<< HEAD
>>>>>>> 72a3fcc6448439a8dc02337b5b40a80617202a73
          </CardHeader>
          <CardContent>
            
            <ProductImageGallery 
              initialImages={product.images || []} 
              productId={product._id.toString()}
              productName={product.name}
              category={product.category}
              initialSearchQuery={product.lastImageSearchQuery || product.name}
            />

            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4">AI-Generated Summary</h2>
              <div className="prose prose-sm md:prose-base max-w-none p-6 bg-slate-100 rounded-lg">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {product.review}
                </ReactMarkdown>
<<<<<<< HEAD
=======
=======
          </CardHeader> {/* <-- THIS IS THE CORRECTED CLOSING TAG */}
          <CardContent>
            
            <ProductImageGallery images={product.images} productName={product.name} />

            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4">AI-Generated Summary</h2>
              <div className="prose prose-lg max-w-none p-6 bg-slate-100 rounded-lg">
                <ReactMarkdown>{product.review}</ReactMarkdown>
>>>>>>> 0c5de07fcdeef2d115c20d12a6a065d9dcbee33a
>>>>>>> 72a3fcc6448439a8dc02337b5b40a80617202a73
              </div>
            </div>
            
            <ReviewActions 
              productId={product._id.toString()} 
              initialScore={product.verification_score || 0}
            />

            <div className="text-center mt-10">
              <Button asChild size="lg" className="bg-green-600 hover:bg-green-700">
                <Link href={product.affiliateUrl || '#'} target="_blank" rel="noopener noreferrer">
                  Check Price & Availability
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}