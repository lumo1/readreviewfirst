// src/app/search/[query]/page.tsx
"use client";
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import SuggestionCard from '@/components/SuggestionCard';

interface Suggestion {
  name: string;
  category: string;
  exists: boolean;
  imageUrl?: string | null; // Start as null for new items
  slug?: string;
}

export default function SearchResultsPage() {
  const params = useParams();
  const query = Array.isArray(params.query) ? params.query[0] : params.query;
  const decodedQuery = decodeURIComponent(query || '');

  const [isLoading, setIsLoading] = useState(true);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [error, setError] = useState<string | null>(null);

  // This effect fetches the initial list of suggestions
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

  // --- THIS IS THE NEW ORCHESTRATION LOGIC ---
  // This second effect runs AFTER we have the suggestions list.
  useEffect(() => {
    if (suggestions.length === 0) return;

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

          // The respectful delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 300));
        }
      }
    };

    fetchImagesSequentially();
    // We only want this to run once when suggestions change, so we serialize the suggestions array
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(suggestions.map(s => s.name))]);

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