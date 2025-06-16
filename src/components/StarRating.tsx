// src/components/StarRating.tsx
import React from "react";

export default function StarRating({
  rating = 0,     // default to 0 if undefined
}: {
  rating?: number;
}) {
  const fullStars = Math.floor(rating);
  const half      = rating - fullStars >= 0.5;

  return (
    <div className="flex items-center">
      {Array.from({ length: fullStars }).map((_, i) => (
        <span key={i}>★</span>
      ))}
      {half && <span>☆</span>}
      {Array.from({ length: 5 - fullStars - (half ? 1 : 0) }).map((_, i) => (
        <span key={i}>☆</span>
      ))}
      <span className="ml-2 text-sm text-gray-500">
        {rating.toFixed(1)}
      </span>
    </div>
  );
}
