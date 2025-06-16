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
  imageUrl?: string | null;
  slug?: string;
}

export default function SearchResultsPage() {
  const params = useParams();
  const query = Array.isArray(params.query) ? params.query[0] : params.query;
  const decodedQuery = decodeURIComponent(query || '');

  const [isLoading, setIsLoading] = useState(true);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Fetch initial suggestions (existing + AI)
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
        });

        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data.error || "Our AI had trouble understanding that.");
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

  return (
    <main className="flex justify-center min-h-screen p-4 sm:p-8 bg-gray-50">
      <div className="w-full max-w-5xl">
        <Card>
          <CardHeader>
            <CardTitle>{`Search Results for "${decodedQuery}"`}</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p>Loading initial suggestions...</p>
            ) : error ? (
              <p className="text-red-500">{error}</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 py-6">
                {suggestions.map((s, i) => (
                  <SuggestionCard key={i} suggestion={s} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
