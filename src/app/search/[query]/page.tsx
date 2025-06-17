// src/app/search/[query]/page.tsx
"use client";

import { useState, useEffect } from 'react';
import { useParams }         from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton }          from "@/components/ui/skeleton";
import SuggestionCard        from '@/components/SuggestionCard';

interface Suggestion {
  name: string;
  category: string;
  exists: boolean;
  imageUrl?: string | null;
  errorCode?: "RATE_LIMIT";
  slug?: string;
}

export default function SearchResultsPage() {
  const params   = useParams();
  const rawQuery = Array.isArray(params.query) ? params.query[0] : params.query;
  const query    = rawQuery ? decodeURIComponent(rawQuery) : "";

  const [loadingStep, setLoadingStep] = useState<string>("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [error, setError] = useState<string | null>(null);

  // 🔍 1️⃣ Kick off the single API call on mount / query change
  useEffect(() => {
    if (!query) return;

    const run = async () => {
      setError(null);
      setSuggestions([]);
      setLoadingStep("Searching our database…");

      // immediately move to phase 2 while the promise is inflight
      const p = fetch('/api/interpret-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });
      setLoadingStep("Brainstorming AI ideas…");

      try {
        const res  = await p;
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Unexpected error");
        setSuggestions(json.suggestions || []);
      } catch (e: unknown) {
        if (e instanceof Error) {
          setError(e.message);
        } else {
          setError("An unknown error occurred");
        }
      }

      // done
      setLoadingStep("");
    };

    run();
  }, [query]);

  return (
    <main className="flex justify-center min-h-screen p-4 sm:p-8 bg-gray-50">
      <div className="w-full max-w-5xl">
        <Card>
          <CardHeader>
            <CardTitle>{`Search Results for "${query}"`}</CardTitle>
            {loadingStep && (
              <p className="mt-1 text-sm text-gray-500">{loadingStep}</p>
            )}
          </CardHeader>
          <CardContent>
            {error ? (
              <div className="text-red-500 text-center py-10">{error}</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 py-6">
                {loadingStep ? (
                  // show 6 skeleton cards while loading
                  Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton
                      key={i}
                      className="h-64 w-full rounded-lg bg-slate-200 animate-pulse"
                    />
                  ))
                ) : (
                  suggestions.map((s, i) => (
                    <SuggestionCard key={i} suggestion={s} />
                  ))
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
