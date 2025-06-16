// src/app/create/page.tsx
"use client";

import { Button } from '@/components/ui/button';
import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';

export default function CreatePage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const name = searchParams.get('name');
  const category = searchParams.get('category');

  const [status, setStatus] = useState("Initializing...");
  const [error, setError] = useState<string | null>(null);

  // Prevent double‐submission in React Strict Mode
  const hasSubmitted = useRef(false);

  useEffect(() => {
    if (!name || !category) {
      setError("No product query provided. Please go back and try again.");
      return;
    }

    const createProduct = async () => {
      if (hasSubmitted.current) return;
      hasSubmitted.current = true;

      setStatus(`Generating page for "${name}"...`);

      try {
        const res = await fetch('/api/create-product', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productName: name, category })
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Unknown error");
        }

        // Redirect to the exact slug (_id) from the database:
        setStatus("Success! Redirecting...");
        router.replace(`/product/${data.product._id}`);
      } catch (e: any) {
        console.error("Create failed:", e);
        setError(`Failed to create product: ${e.message}`);
      }
    };

    createProduct();
  }, [name, category, router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
      {error ? (
        <div className="text-red-500">
          <h2 className="text-2xl font-bold mb-4">Something Went Wrong</h2>
          <p>{error}</p>
          <Button onClick={() => router.back()} className="mt-4">
            Go Back
          </Button>
        </div>
      ) : (
        <>
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-gray-900 mb-6"></div>
          <h1 className="text-2xl font-bold">Please wait</h1>
          <p className="mt-2 text-gray-600">{status}</p>
        </>
      )}
    </div>
  );
}
