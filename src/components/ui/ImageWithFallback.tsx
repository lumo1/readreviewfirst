// src/components/ui/ImageWithFallback.tsx
"use client";

import { useState, useEffect } from 'react';
import Image, { ImageProps } from 'next/image';

export function ImageWithFallback(props: ImageProps) {
  const { src, alt, ...rest } = props;
  const [hasError, setHasError] = useState(!src);

  useEffect(() => {
    setHasError(!src);
  }, [src]);

  if (hasError) {
    // If there's an error or no src, just show a simple, clean box.
    return (
      <div className="w-full h-full bg-slate-200 flex items-center justify-center rounded-lg">
        <span className="text-xs text-slate-500">No Image</span>
      </div>
    );
  }

  return <Image alt={alt} src={src} onError={() => setHasError(true)} {...rest} />;
}