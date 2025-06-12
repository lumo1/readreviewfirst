// src/components/ProductImageGallery.tsx
"use client";

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
    </div>
  );
}