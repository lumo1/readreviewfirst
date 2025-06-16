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
<<<<<<<<< Temporary merge branch 1
      setStatus(`Generating a page for "${name}" in category "${category}"...`);
      try {
        // Call the backend API we created in Step 1
        const response = await fetch('/api/create-product', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productName: name, category: category}),
=========
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
>>>>>>>>> Temporary merge branch 2
        });

        const data = await response.json();

<<<<<<<<< Temporary merge branch 1
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
=========
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
>>>>>>>>> Temporary merge branch 2
      }
    };

    createProduct();
<<<<<<<<< Temporary merge branch 1
  }, [name, category, router]); // The effect depends on the query and router
=========
    // The dependency array is now much cleaner and more stable.
  }, [name, category, router]);
>>>>>>>>> Temporary merge branch 2

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
<<<<<<<<< Temporary merge branch 1
          {/* A simple spinning loader */}
=========
>>>>>>>>> Temporary merge branch 2
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-gray-900 mb-6"></div>
          <h1 className="text-2xl font-bold">Please wait</h1>
          <p className="mt-2 text-lg text-gray-600">{status}</p>
        </>
      )}
    </div>
  );
}