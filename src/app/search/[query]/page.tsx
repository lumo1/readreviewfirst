// src/app/search/[query]/page.tsx
"use client";
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
<<<<<<< HEAD
import SuggestionCard from '@/components/SuggestionCard';

=======
import { Button } from "@/components/ui/button";
import Link from 'next/link';
import Image from 'next/image';
<<<<<<< HEAD
import { Skeleton } from "@/components/ui/skeleton"; // --- CHANGE 1: Import Skeleton for loading state

=======

// The Suggestion interface now includes our new placeholder field
>>>>>>> 0c5de07fcdeef2d115c20d12a6a065d9dcbee33a
>>>>>>> 72a3fcc6448439a8dc02337b5b40a80617202a73
interface Suggestion {
  name: string;
  category: string;
  exists: boolean;
<<<<<<< HEAD
  imageUrl?: string | null; // Start as null for new items
  slug?: string;
}

=======
  imageUrl?: string | null;
<<<<<<< HEAD
  placeholderImageUrl?: string | null;
  slug?: string;
}

// --- CHANGE 2: Create a dedicated Skeleton Card component for the loading state ---
function SuggestionSkeleton() {
  return (
    <Card className="flex flex-col overflow-hidden">
      <Skeleton className="w-full h-48" />
      <CardContent className="p-4 flex flex-col flex-grow">
        <Skeleton className="h-6 w-3/4 mb-2" />
        <Skeleton className="h-4 w-1/2 mb-4" />
        <Skeleton className="h-10 w-full mt-auto" />
      </CardContent>
    </Card>
  );
}

=======
  placeholderImageUrl?: string | null; // <-- MODIFICATION 1: Add the new field
  slug?: string;
}

>>>>>>> 0c5de07fcdeef2d115c20d12a6a065d9dcbee33a
>>>>>>> 72a3fcc6448439a8dc02337b5b40a80617202a73
export default function SearchResultsPage() {
  const params = useParams();
  const query = Array.isArray(params.query) ? params.query[0] : params.query;
  const decodedQuery = decodeURIComponent(query || '');

  const [isLoading, setIsLoading] = useState(true);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [error, setError] = useState<string | null>(null);

<<<<<<< HEAD
  // This effect fetches the initial list of suggestions
=======
<<<<<<< HEAD
=======
  // The useEffect hook for fetching data remains exactly the same.
>>>>>>> 0c5de07fcdeef2d115c20d12a6a065d9dcbee33a
>>>>>>> 72a3fcc6448439a8dc02337b5b40a80617202a73
  useEffect(() => {
    if (!decodedQuery) { setIsLoading(false); return; }
    
    const fetchInterpretation = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/interpret-search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: decodedQuery }),
<<<<<<< HEAD
=======
<<<<<<< HEAD
          // --- CHANGE 3: Add Next.js caching. Cache results for 1 hour. ---
          next: { revalidate: 3600 } 
=======
>>>>>>> 0c5de07fcdeef2d115c20d12a6a065d9dcbee33a
>>>>>>> 72a3fcc6448439a8dc02337b5b40a80617202a73
        });
        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data.error || "Our AI had trouble understanding that.");
        }
        const data = await response.json();
        
        // Set initial suggestions. New items will have imageUrl: null
        setSuggestions(data.suggestions || []);

      } catch (err: any) {
        setError(err.message || "An unexpected error occurred.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchInterpretation();
  }, [decodedQuery]);

<<<<<<< HEAD
  // --- THIS IS THE NEW ORCHESTRATION LOGIC ---
  // This second effect runs AFTER we have the suggestions list.
  useEffect(() => {
    if (suggestions.length === 0) return;
=======
<<<<<<< HEAD
  // --- CHANGE 4: Create a dynamic header subtitle based on results ---
  const getHeaderSubtitle = () => {
    if (isLoading || error || suggestions.length === 0) return null;
>>>>>>> 72a3fcc6448439a8dc02337b5b40a80617202a73

    const fetchImagesSequentially = async () => {
      // Create a mutable copy of the suggestions array
      const updatedSuggestions = [...suggestions];
      
      // Use a for loop to process items one by one
      for (let i = 0; i < updatedSuggestions.length; i++) {
        const suggestion = updatedSuggestions[i];

        // Only fetch if it's a new item and doesn't have an image yet
        if (!suggestion.exists && suggestion.imageUrl === null) {
          try {
            const response = await fetch('/api/get-image-url', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ productName: suggestion.name, category: suggestion.category }),
            });
            if (response.ok) {
              const data = await response.json();
              // Update the imageUrl for this specific suggestion
              updatedSuggestions[i].imageUrl = data.imageUrl;
            } else {
              // Mark as failed by setting to an empty string
              updatedSuggestions[i].imageUrl = ''; 
            }
          } catch (e) {
            updatedSuggestions[i].imageUrl = '';
          }
          
          // Update the state with the new image URL, triggering a re-render for this card
          setSuggestions([...updatedSuggestions]);

<<<<<<< HEAD
          // The respectful delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 300));
        }
      }
    };

    fetchImagesSequentially();
    // We only want this to run once when suggestions change, so we serialize the suggestions array
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(suggestions.map(s => s.name))]);
=======
  const renderContent = () => {
    // --- CHANGE 5: Use the new Skeleton component for the loading state ---
    if (isLoading) {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 py-6">
          <SuggestionSkeleton />
          <SuggestionSkeleton />
          <SuggestionSkeleton />
        </div>
      );
    }
    if (error) { 
      return <div className="text-center py-10 text-red-500">{error}</div>;
    }
    if (suggestions.length === 0) {
      return <div className="text-center py-10">No products found for your search. Try another query!</div>;
    }
=======
  const renderContent = () => {
    if (isLoading) { /* ... same loading state ... */ }
    if (error) { /* ... same error state ... */ }
    if (suggestions.length === 0) { /* ... same empty state ... */ }
>>>>>>> 0c5de07fcdeef2d115c20d12a6a065d9dcbee33a

    return (
      <div className="py-6">
        <p className="mb-6 text-gray-600 font-semibold text-center">
<<<<<<< HEAD
          {getHeaderSubtitle()}
=======
          {suggestions.length > 1 ? "Your search is a bit broad. Did you mean one of these?" : "We found a likely match. Ready to generate a review?"}
>>>>>>> 0c5de07fcdeef2d115c20d12a6a065d9dcbee33a
        </p>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {suggestions.map((s, i) => {
            const href = s.exists ? `/product/${s.slug}` : `/create?name=${encodeURIComponent(s.name)}&category=${encodeURIComponent(s.category)}`;
            const buttonText = s.exists ? "View Existing Review" : "Generate AI Review";
<<<<<<< HEAD
=======
            
            // --- MODIFICATION 2: Use the new placeholderImageUrl ---
>>>>>>> 0c5de07fcdeef2d115c20d12a6a065d9dcbee33a
            const displayImageUrl = s.imageUrl || s.placeholderImageUrl;
            const isPlaceholder = !s.imageUrl && s.placeholderImageUrl;

            return (
              <Card key={i} className="flex flex-col overflow-hidden transition-transform duration-300 hover:scale-105 hover:shadow-xl ">
                <div className="relative w-full h-48 bg-slate-200 group">
                  {displayImageUrl ? (
                    <Image
                      src={`/api/image-proxy?url=${encodeURIComponent(displayImageUrl)}`}
                      alt={`Image of ${s.name}`}
                      fill
<<<<<<< HEAD
                      className={`object-cover transition-transform duration-300 group-hover:scale-105 ${isPlaceholder ? 'blur-md' : ''}`}
                    />
                  ) : (
                    <div className="w-full h-full bg-slate-200 flex items-center justify-center text-xs text-slate-500">No Image</div>
                  )}
=======
                      // Conditionally apply blur and other styles if it's a placeholder
                      className={`
            object-cover 
            transition-transform duration-300 group-hover:scale-105 
            ${isPlaceholder ? 'blur-md' : ''}
          `}
                    />
                  ) : (
                    // Fallback for when no image of any kind could be found
                    <div className="w-full h-full bg-slate-200 flex items-center justify-center text-xs text-slate-500">No Image</div>
                  )}

                  {/* Show the "Generate" overlay ONLY if it's a placeholder */}
>>>>>>> 0c5de07fcdeef2d115c20d12a6a065d9dcbee33a
                  {isPlaceholder && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 text-white p-2 text-center">
                      <p className="font-bold text-lg">Generate Review</p>
                      <p className="text-xs mt-1">to see specific product images</p>
                    </div>
                  )}
                </div>
<<<<<<< HEAD
                <CardContent className="p-4 flex flex-col flex-grow">
                  <p className="font-bold text-lg flex-grow">{s.name}</p>
                  <p className="text-sm text-gray-500 mb-4">{s.category}</p>
=======
                
                <CardContent className="p-4 flex flex-col flex-grow">
                  <p className="font-bold text-lg flex-grow">{s.name}</p>
                  <p className="text-sm text-gray-500 mb-4">{s.category}</p>
                  
>>>>>>> 0c5de07fcdeef2d115c20d12a6a065d9dcbee33a
                  <Button asChild className={`w-full mt-auto ${s.exists ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'}`}>
                    <Link href={href}>
                      {buttonText}
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    );
  };
>>>>>>> 72a3fcc6448439a8dc02337b5b40a80617202a73

  return (
    <main className="flex justify-center min-h-screen p-4 sm:p-8 bg-gray-50">
      <div className="w-full max-w-5xl">
        <Card>
          <CardHeader><CardTitle>{`Search Results for "${decodedQuery}"`}</CardTitle></CardHeader>
          <CardContent>
            {/* The render logic is now much simpler */}
            {isLoading ? (
              <p>Loading initial suggestions...</p>
            ) : error ? (
              <p className="text-red-500">{error}</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 py-6">
                {suggestions.map((s, i) => <SuggestionCard key={i} suggestion={s} />)}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}