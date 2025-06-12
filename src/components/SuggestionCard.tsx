// src/components/SuggestionCard.tsx
"use client";
import Link from 'next/link';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ImageWithFallback } from "./ui/ImageWithFallback";

// The full Suggestion type is passed as a prop
interface Suggestion {
  name: string;
  category: string;
  exists: boolean;
  imageUrl?: string | null; // This will now be populated by the parent
  slug?: string;
}

export default function SuggestionCard({ suggestion }: { suggestion: Suggestion }) {
  const href = suggestion.exists ? `/product/${suggestion.slug}` : `/create?name=${encodeURIComponent(suggestion.name)}&category=${encodeURIComponent(suggestion.category)}`;
  const buttonText = suggestion.exists ? "View Existing Review" : "Generate AI Review";
  
  // The blur is now only applied to new suggestions that have successfully found an image
  const applyBlur = !suggestion.exists && suggestion.imageUrl;

  return (
    <Card className="flex flex-col overflow-hidden transition-transform duration-300 hover:scale-105 hover:shadow-xl">
      <div className="relative w-full h-48 bg-slate-200 group">
        {suggestion.imageUrl === undefined ? ( // Use undefined to check if it's still loading
          <Skeleton className="w-full h-full" />
        ) : (
          <ImageWithFallback
            src={suggestion.imageUrl ? `/api/image-proxy?url=${encodeURIComponent(suggestion.imageUrl)}` : ''}
            alt={`Image of ${suggestion.name}`}
            fill
            className={`object-cover transition-transform duration-300 group-hover:scale-105 ${applyBlur ? 'blur-md' : ''}`}
          />
        )}
        {applyBlur && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 text-white p-2 text-center">
            <p className="font-bold text-lg">Generate Review</p>
            <p className="text-xs mt-1">to see specific product images</p>
          </div>
        )}
      </div>
      <CardContent className="p-4 flex flex-col flex-grow">
        <p className="font-bold text-lg flex-grow">{suggestion.name}</p>
        <p className="text-sm text-gray-500 mb-4">{suggestion.category}</p>
        <Button asChild className={`w-full mt-auto ${suggestion.exists ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'}`}>
          <Link href={href}>{buttonText}</Link>
        </Button>
      </CardContent>
    </Card>
  );
}