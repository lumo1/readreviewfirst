// src/components/ProductImageGallery.tsx
"use client";
<<<<<<< HEAD
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import ImageCarousel from './ImageCarousel'; // This imports the other component
=======
<<<<<<< HEAD
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import ImageCarousel from './ImageCarousel';
>>>>>>> 72a3fcc6448439a8dc02337b5b40a80617202a73

type GalleryProps = { 
  initialImages: string[], 
  productId: string, 
  productName: string,
<<<<<<< HEAD
  category: string,
=======
  category: string, // Add category for the AI image prompt
>>>>>>> 72a3fcc6448439a8dc02337b5b40a80617202a73
  initialSearchQuery: string 
};

export default function ProductImageGallery({ initialImages, productId, productName, category, initialSearchQuery }: GalleryProps) {
  const [images, setImages] = useState(initialImages);
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const [isLoading, setIsLoading] = useState(false);
  const [statusText, setStatusText] = useState('');
  const [error, setError] = useState('');

  const handleFetchAndGenerate = async () => {
    setIsLoading(true);
    setError('');
<<<<<<< HEAD
    try {
=======

    try {
      // --- Step 1: Try to fetch images with the refined query ---
>>>>>>> 72a3fcc6448439a8dc02337b5b40a80617202a73
      setStatusText('Finding product photos...');
      const fetchRes = await fetch('/api/fetch-images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, searchQuery }),
      });
<<<<<<< HEAD
=======

>>>>>>> 72a3fcc6448439a8dc02337b5b40a80617202a73
      if (fetchRes.ok) {
        const data = await fetchRes.json();
        setImages(data.images);
        setIsLoading(false);
<<<<<<< HEAD
        return;
      }
=======
        return; // Success! We're done.
      }

      // --- Step 2: If fetch fails, fall back to AI generation ---
>>>>>>> 72a3fcc6448439a8dc02337b5b40a80617202a73
      setStatusText('No match found. Asking AI to create an image...');
      const generateRes = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, productName, category }),
      });
<<<<<<< HEAD
=======

>>>>>>> 72a3fcc6448439a8dc02337b5b40a80617202a73
      const generateData = await generateRes.json();
      if (!generateRes.ok) {
        throw new Error(generateData.error || "AI image generation failed.");
      }
<<<<<<< HEAD
      setImages(generateData.images);
=======
      
      setImages(generateData.images);

>>>>>>> 72a3fcc6448439a8dc02337b5b40a80617202a73
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
<<<<<<< HEAD
      <p className="text-sm text-gray-600 mt-2">You can help us find them by refining the search query below.</p>
=======
      <p className="text-sm text-gray-600 mt-2">
        You can help us find them by refining the search query below.
      </p>
>>>>>>> 72a3fcc6448439a8dc02337b5b40a80617202a73
      <div className="flex items-center gap-2 mt-4 max-w-sm mx-auto">
        <Input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
        <Button onClick={handleFetchAndGenerate} disabled={isLoading}>
          {isLoading ? "Working..." : "Find or Generate Images"}
        </Button>
      </div>
      {isLoading && <p className="text-blue-600 text-sm mt-2 animate-pulse">{statusText}</p>}
      {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
<<<<<<< HEAD
=======
=======

import { useState, useEffect } from "react";
import Image from "next/image";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";

type Props = {
  images: string[];
  productName: string;
};

export default function ProductImageGallery({ images, productName }: Props) {
  // State to hold the API instance for both carousels
  const [mainApi, setMainApi] = useState<CarouselApi>();
  const [thumbnailApi, setThumbnailApi] = useState<CarouselApi>();
  
  // State to track the selected slide index
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    if (!mainApi) return;

    // When the main carousel settles on a new slide, update our index
    const onSelect = () => {
      setSelectedIndex(mainApi.selectedScrollSnap());
      // Also, scroll the thumbnail carousel to keep the active thumb in view
      if (thumbnailApi) {
        thumbnailApi.scrollTo(mainApi.selectedScrollSnap());
      }
    };
    
    mainApi.on("select", onSelect);
    // Set the initial index
    setSelectedIndex(mainApi.selectedScrollSnap());

    // Clean up the event listener on component unmount
    return () => {
      mainApi.off("select", onSelect);
    };
  }, [mainApi, thumbnailApi]);

  // Handler for when a user clicks a thumbnail
  const onThumbClick = (index: number) => {
    if (mainApi) {
      mainApi.scrollTo(index);
    }
  };

  if (!images || images.length === 0) {
    return (
      <div className="mb-8 p-4 text-center text-gray-500">
        No product images could be found.
      </div>
    );
  }

  return (
    <div className="mb-8">
      {/* Main Image Carousel */}
      <Carousel setApi={setMainApi} className="w-full max-w-xl mx-auto">
        <CarouselContent>
          {images.map((imgUrl, index) => (
            <CarouselItem key={index}>
              <div className="relative aspect-square w-full">
                <Image
                  src={`/api/image-proxy?url=${encodeURIComponent(imgUrl)}`}
                  alt={`${productName} image ${index + 1}`}
                  fill
                  className="rounded-lg object-contain"
                  priority={index === 0} // Prioritize loading the first image
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>

      {/* Thumbnail Carousel */}
      <div className="mt-4">
        <Carousel
          setApi={setThumbnailApi}
          opts={{
            align: "start",
            slidesToScroll: 1,
            containScroll: "trimSnaps",
          }}
          className="w-full max-w-2xl mx-auto"
        >
          <CarouselContent className="-ml-2">
            {images.map((imgUrl, index) => (
              <CarouselItem key={index} className="pl-2 basis-1/4 md:basis-1/5">
                <div
                  className="relative aspect-square w-full cursor-pointer"
                  onClick={() => onThumbClick(index)}
                >
                  <Image
                    src={`/api/image-proxy?url=${encodeURIComponent(imgUrl)}`}
                    alt={`${productName} thumbnail ${index + 1}`}
                    fill
                    // Apply conditional styling for the active thumbnail
                    className={`rounded-md object-cover transition-opacity ${
                      index === selectedIndex ? 'opacity-100 border-2 border-blue-500' : 'opacity-50'
                    }`}
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  />
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      </div>
>>>>>>> 0c5de07fcdeef2d115c20d12a6a065d9dcbee33a
>>>>>>> 72a3fcc6448439a8dc02337b5b40a80617202a73
    </div>
  );
}