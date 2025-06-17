// src/components/ImageCarousel.tsx
"use client";
import { useState, useEffect } from "react";
import { ImageWithFallback } from '@/components/ui/ImageWithFallback';
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from "@/components/ui/carousel";

type Props = { images: string[]; productName: string; };

export default function ImageCarousel({ images, productName }: Props) {
  const [mainApi, setMainApi] = useState<CarouselApi>();
  const [thumbnailApi, setThumbnailApi] = useState<CarouselApi>();
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    if (!mainApi) { return; }
    const onSelect = (api: CarouselApi) => {
      if (api) {
        setSelectedIndex(api.selectedScrollSnap());
        if (thumbnailApi) {
          thumbnailApi.scrollTo(api.selectedScrollSnap());
        }
      }
    };
    mainApi.on("select", onSelect);
    // Initialize
    onSelect(mainApi); 
    // Cleanup
    return () => { mainApi.off("select", onSelect); };
  }, [mainApi, thumbnailApi]);

  const onThumbClick = (index: number) => { mainApi?.scrollTo(index); };

  if (!images || images.length === 0) { return null; }

  return (
    <div className="mb-8">
      <Carousel setApi={setMainApi} className="w-full max-w-xl mx-auto">
        <CarouselContent>
          {images.map((imgUrl, index) => (
            <CarouselItem key={index}>
              <div className="relative aspect-square w-full">
                <ImageWithFallback src={`/api/image-proxy?url=${encodeURIComponent(imgUrl)}`} alt={`${productName} image ${index + 1}`} fill className="rounded-lg object-contain" priority={index === 0} />
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
      <div className="mt-4">
        <Carousel setApi={setThumbnailApi} opts={{ align: "start", containScroll: "trimSnaps" }} className="w-full max-w-2xl mx-auto">
          <CarouselContent className="-ml-2">
            {images.map((imgUrl, index) => (
              <CarouselItem key={index} className="pl-2 basis-1/4 md:basis-1/5">
                <div className="relative aspect-square w-full cursor-pointer" onClick={() => onThumbClick(index)}>
                  <ImageWithFallback src={`/api/image-proxy?url=${encodeURIComponent(imgUrl)}`} alt={`${productName} thumbnail ${index + 1}`} fill className={`rounded-md object-cover transition-opacity ${index === selectedIndex ? 'opacity-100 border-2 border-blue-500' : 'opacity-50'}`} />
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      </div>
    </div>
  );
}