<<<<<<< HEAD
// src/components/ui/ImageWithFallback.tsx
"use client";

import { useState, useEffect } from 'react';
import Image, { ImageProps } from 'next/image';

// We extend the ImageProps to accept a custom fallback component if needed
interface ImageWithFallbackProps extends ImageProps {
  fallback?: React.ReactNode;
}

export function ImageWithFallback(props: ImageWithFallbackProps) {
  const { src, fallback, alt, ...rest } = props;
  
  // State to track if an error has occurred
  const [hasError, setHasError] = useState(false);

  // When the 'src' prop changes, we should reset the error state.
  // This is important if the component is reused for different images.
  useEffect(() => {
    setHasError(false);
  }, [src]);

  // The default UI to show when an image fails to load
  const defaultFallback = (
    <div className="w-full h-full bg-slate-200 flex items-center justify-center rounded-lg">
      <span className="text-xs text-slate-500">{alt || "Image"}</span>
    </div>
  );

  // If an error has been triggered, render the fallback UI.
  if (hasError) {
    return fallback || defaultFallback;
  }

  // Otherwise, try to render the Next.js Image component.
  // The onError handler will set our error state if the browser fails to load it.
  return (
    <Image
      {...rest}
      alt={alt}
      src={src}
      onError={() => setHasError(true)}
    />
  );
}
=======
'use client';
import Image, { ImageProps } from 'next/image';
import { useState } from 'react';

export function ImageWithFallback(props: ImageProps) {
  const { src, alt, ...rest } = props;
  const [imgSrc, setImgSrc] = useState(src);

  return (
    <Image
      {...rest}
      src={imgSrc}
      alt={alt}
      onError={() => setImgSrc('/no-image.svg')}
    />
  );
}
>>>>>>> 0c5de07fcdeef2d115c20d12a6a065d9dcbee33a
