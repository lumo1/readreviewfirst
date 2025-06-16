// src/components/ProductImageGallery.tsx
"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import ImageCarousel from './ImageCarousel';

type GalleryProps = { 
  initialImages: string[], 
  productId: string, 
  productName: string,
  category: string,
  initialSearchQuery: string 
};

export default function ProductImageGallery({
  initialImages,
  productId,
  productName,
  category,
  initialSearchQuery,
}: GalleryProps) {
  const [images, setImages] = useState<string[]>(initialImages);
  const [searchQuery, setSearchQuery] = useState<string>(initialSearchQuery);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [statusText, setStatusText] = useState<string>('');
  const [error, setError] = useState<string>('');

  const handleFetchAndGenerate = async () => {
    setIsLoading(true);
    setError('');
    try {
      setStatusText('Finding product photos...');
      const fetchRes = await fetch('/api/fetch-images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, searchQuery }),
      });
      if (fetchRes.ok) {
        const data = await fetchRes.json();
        setImages(data.images);
        setIsLoading(false);
        return;
      }

      // Fallback to AI generation
      setStatusText('No match found. Asking AI to create an image...');
      const generateRes = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, productName, category }),
      });
      const generateData = await generateRes.json();
      if (!generateRes.ok) {
        throw new Error(generateData.error || 'AI image generation failed.');
      }
      setImages(generateData.images);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
      setStatusText('');
    }
  };

  if (images && images.length > 0) {
    return <ImageCarousel images={images} productName={productName} />;
  }

  return (
    <div className="p-6 border rounded-lg bg-gray-50/50 text-center mb-8">
      <h3 className="font-semibold">No product images could be found.</h3>
      <p className="text-sm text-gray-600 mt-2">
        You can help us find them by refining the search query below.
      </p>
      <div className="flex items-center gap-2 mt-4 max-w-sm mx-auto">
        <Input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <Button onClick={handleFetchAndGenerate} disabled={isLoading}>
          {isLoading ? 'Working...' : 'Find or Generate Images'}
        </Button>
      </div>
      {isLoading && (
        <p className="text-blue-600 text-sm mt-2 animate-pulse">{statusText}</p>
      )}
      {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
    </div>
  );
}
