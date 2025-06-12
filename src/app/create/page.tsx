// src/app/create/page.tsx
"use client";

import { Button } from '@/components/ui/button';
import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react'; // <-- Import useRef

export default function CreatePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const name = searchParams.get('name');
  const category = searchParams.get('category');
  
  const [status, setStatus] = useState("Initializing...");
  const [error, setError] = useState<string | null>(null);

  // --- THE FIX: Use a ref for a stable "run once" lock ---
  // A ref's value persists across renders without causing re-renders.
  const hasSubmitted = useRef(false);

  useEffect(() => {
    // This effect will still run twice in dev mode, but our lock will handle it.
    if (!name || !category) {
      setError("No product query provided. Please go back and try a new search.");
      return;
    }

    const createProduct = async () => {
      // --- THE ROBUST LOCK ---
      // If our ref flag is true, it means we've already started, so we exit immediately.
      if (hasSubmitted.current) {
        return;
      }
      // Set the flag to true immediately. This happens synchronously.
      hasSubmitted.current = true;
      
      setStatus(`Generating a page for "${name}"...`);

      try {
        const response = await fetch('/api/create-product', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productName: name, category: category }),
        });

        const data = await response.json();

        if (response.ok) { // Check for any 2xx status
          setStatus("Success! Redirecting you to the page...");
          // Use replace instead of push to prevent the user from clicking "back" to this loading page.
          router.replace(`/product/${data.product._id}`); 
        } else {
          throw new Error(data.error || "An unknown error occurred.");
        }
        
      } catch (e: any) {
        console.error("Fetch error:", e);
        setError(`Failed to create product page: ${e.message}`);
        // We don't reset the lock here, because the process failed.
        // The user should go back and try again from the search page.
      }
    };

    createProduct();
    // The dependency array is now much cleaner and more stable.
  }, [name, category, router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center p-4">
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
          <p className="mt-2 text-lg text-gray-600">{status}</p>
        </>
      )}
    </div>
  );
}