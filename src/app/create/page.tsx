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
  
  const [status, setStatus] = useState<string>("Initializing...");
  const [error, setError] = useState<string | null>(null);

  // Use a ref to ensure the create request runs only once
  const hasSubmitted = useRef(false);

  useEffect(() => {
    if (!name || !category) {
      setError("No product query provided. Please go back and try a new search.");
      return;
    }

    const createProduct = async () => {
      if (hasSubmitted.current) return;
      hasSubmitted.current = true;

      setStatus(`Generating a page for "${name}" in category "${category}"...`);

      try {
        const response = await fetch('/api/create-product', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productName: name, category }),
        });

        const data = await response.json();

        if (response.ok) {
          setStatus("Success! Redirecting to your new page...");
          // Replace so back button won't return here
          router.replace(`/product/${data.product._id}`);
        } else {
          throw new Error(data.error || "An unknown error occurred.");
        }
      } catch (e: any) {
        console.error("Create product error:", e);
        setError(`Failed to create product page: ${e.message}`);
      }
    };

    createProduct();
  }, [name, category, router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center p-4">
      {error ? (
        <div className="text-red-500">
          <h2 className="text-2xl font-bold mb-4">Something went wrong</h2>
          <p>{error}</p>
          <Button onClick={() => router.back()} className="mt-4">
            Go Back
          </Button>
        </div>
      ) : (
        <>
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-gray-900 mb-6"></div>
          <h1 className="text-2xl font-bold">Please wait</h1>
          <p className="mt-2 text-lg text-gray-600">{status}</p>
        </>
      )}
    </div>
  );
}
