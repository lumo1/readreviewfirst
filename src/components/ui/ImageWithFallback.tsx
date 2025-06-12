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
