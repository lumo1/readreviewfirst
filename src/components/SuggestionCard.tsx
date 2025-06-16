// src/components/SuggestionCard.tsx
"use client";

import Link from 'next/link';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ImageWithFallback } from "./ui/ImageWithFallback";

interface Suggestion {
  name: string;
  category: string;
  exists: boolean;
  imageUrl?: string | null;
  errorCode?: "RATE_LIMIT";  // only one for now
  slug?: string;
}

export default function SuggestionCard({ suggestion }: { suggestion: Suggestion }) {
  const isLoadingImage = suggestion.imageUrl === undefined;
  const hasImage       = !!suggestion.imageUrl;
  const rateLimited    = suggestion.errorCode === "RATE_LIMIT";

  // detect our Unsplash fallback so we can blur it
  const isFallbackImage =
    !suggestion.exists &&
    hasImage &&
    suggestion.imageUrl!.includes("images.unsplash.com");

  // split the raw slug back into [category, product]
  const [catSegment = "", prodSegment = ""] = (suggestion.slug ?? "").split("/");

  // re-encode each one for the URL
  const href = suggestion.exists
    ? `/product/${encodeURIComponent(catSegment)}/${encodeURIComponent(prodSegment)}`
    : `/create?name=${encodeURIComponent(suggestion.name)}&category=${encodeURIComponent(suggestion.category)}`;

  const buttonText = suggestion.exists ? "View Existing Review" : "Generate AI Review";

  return (
    <Card className="flex flex-col overflow-hidden hover:scale-105 transition-shadow">
      <div className="relative w-full h-48 bg-slate-200 group">
        {isLoadingImage && (
          <Skeleton className="w-full h-full" />
        )}

        {!isLoadingImage && !hasImage && rateLimited && (
          <div className="w-full h-full bg-yellow-100 flex flex-col items-center justify-center text-sm text-yellow-900 p-2">
            <p>🔄 API limit reached</p>
            <p className="mt-1">Images temporarily unavailable</p>
          </div>
        )}

        {!isLoadingImage && !hasImage && !rateLimited && (
          <div className="w-full h-full bg-slate-200 flex items-center justify-center text-sm text-gray-500">
            No Image Found
          </div>
        )}

        {hasImage && (
          <ImageWithFallback
            src={`/api/image-proxy?url=${encodeURIComponent(suggestion.imageUrl!)}`}
            alt={`Image of ${suggestion.name}`}
            fill
            sizes="(max-width: 640px) 100vw, 33vw"
            className={`
              object-cover
              transition-transform
              group-hover:scale-105
              ${isFallbackImage ? "blur-md" : ""}
            `}
          />
        )}
      </div>

      <CardContent className="p-4 flex flex-col flex-grow">
        <h3 className="font-bold text-lg">{suggestion.name}</h3>
        <p className="text-sm text-gray-500 mb-4">{suggestion.category}</p>
        <Button
          asChild
          className={`w-full mt-auto ${suggestion.exists ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'}`}
        >
          <Link href={href}>{buttonText}</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
