// src/app/create/page.tsx
"use client"; // This page must be a Client Component to use hooks

import { Button } from '@/components/ui/button';
import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function CreatePage() {
  // Hooks to read URL parameters and control navigation
  const searchParams = useSearchParams();
  const router = useRouter();
  
  // Get the product name from the URL query string
  
  const name = searchParams.get('name');
  const category = searchParams.get('category');
  
  // State to manage the feedback message shown to the user
  const [status, setStatus] = useState("Initializing...");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // This effect runs once when the component mounts
    if (!name || !category) {
      setError("No product query provided. Please go back and try a new search.");
      return;
    }

    const createProduct = async () => {
      setStatus(`Generating a page for "${name}" in category "${category}"...`);
      try {
        // Call the backend API we created in Step 1
        const response = await fetch('/api/create-product', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productName: name, category: category}),
        });

        const data = await response.json();

         if (response.status === 201) { // 201 Created
          setStatus("Success! New page generated. Redirecting...");
          router.push(`/product/${data.product._id}`);
        } else if (response.status === 200) { // 200 OK (Already Existed)
          setStatus("This product already exists! Redirecting you to the page...");
          router.push(`/product/${data.product._id}`);
        } else { // Handle actual errors
          setError(`Error: ${data.error || "An unknown error occurred."}`);
        }
        
      } catch (e) {
        console.error("Fetch error:", e);
        setError("Failed to connect to the server. Please check your connection and try again.");
      }
    };

    createProduct();
  }, [name, category, router]); // The effect depends on the query and router

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
          {/* A simple spinning loader */}
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-gray-900 mb-6"></div>
          <h1 className="text-2xl font-bold">Please wait</h1>
          <p className="mt-2 text-lg text-gray-600">{status}</p>
        </>
      )}
    </div>
  );
}