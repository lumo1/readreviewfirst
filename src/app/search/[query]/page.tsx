// src/app/search/[query]/page.tsx
"use client";

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation'; 
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from 'next/link';
import Image from 'next/image';
import { Skeleton } from "@/components/ui/skeleton"; // --- CHANGE 1: Import Skeleton for loading state

interface Suggestion {
  name: string;
  category: string;
  exists: boolean;
  imageUrl?: string | null;
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

export default function SearchResultsPage() {
  const params = useParams(); 
  const query = Array.isArray(params.query) ? params.query[0] : params.query;
  const decodedQuery = decodeURIComponent(query || '');

  const [isLoading, setIsLoading] = useState(true);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!decodedQuery) {
      setIsLoading(false);
      return;
    }
    const fetchInterpretation = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/interpret-search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: decodedQuery }),
          // --- CHANGE 3: Add Next.js caching. Cache results for 1 hour. ---
          next: { revalidate: 3600 } 
        });
        if (!response.ok) {
          throw new Error("Our AI had trouble understanding that. Please try another search.");
        }
        const data = await response.json();
        setSuggestions(data.suggestions || []);
      } catch (err: any) {
        setError(err.message || "An unexpected error occurred.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchInterpretation();
  }, [decodedQuery]);

  // --- CHANGE 4: Create a dynamic header subtitle based on results ---
  const getHeaderSubtitle = () => {
    if (isLoading || error || suggestions.length === 0) return null;

    const hasExisting = suggestions.some(s => s.exists);
    const hasNew = suggestions.some(s => !s.exists);

    if (hasExisting && hasNew) {
      return "We found some matches in our database and new ideas for you to explore.";
    }
    if (hasExisting) {
      return "We found the following matches in our database.";
    }
    if (hasNew) {
      return "We couldn't find an exact match, but here are some ideas to get you started.";
    }
    return null;
  };

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

    return (
      <div className="py-6">
        <p className="mb-6 text-gray-600 font-semibold text-center">
          {getHeaderSubtitle()}
        </p>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {suggestions.map((s, i) => {
            const href = s.exists ? `/product/${s.slug}` : `/create?name=${encodeURIComponent(s.name)}&category=${encodeURIComponent(s.category)}`;
            const buttonText = s.exists ? "View Existing Review" : "Generate AI Review";
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
                      className={`object-cover transition-transform duration-300 group-hover:scale-105 ${isPlaceholder ? 'blur-md' : ''}`}
                    />
                  ) : (
                    <div className="w-full h-full bg-slate-200 flex items-center justify-center text-xs text-slate-500">No Image</div>
                  )}
                  {isPlaceholder && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 text-white p-2 text-center">
                      <p className="font-bold text-lg">Generate Review</p>
                      <p className="text-xs mt-1">to see specific product images</p>
                    </div>
                  )}
                </div>
                <CardContent className="p-4 flex flex-col flex-grow">
                  <p className="font-bold text-lg flex-grow">{s.name}</p>
                  <p className="text-sm text-gray-500 mb-4">{s.category}</p>
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

  return (
    <main className="flex justify-center min-h-screen p-4 sm:p-8 bg-gray-50">
      <div className="w-full max-w-5xl">
        <Card>
          <CardHeader>
            <CardTitle>{`Search Results for "${decodedQuery}"`}</CardTitle>
          </CardHeader>
          <CardContent>
            {renderContent()}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}