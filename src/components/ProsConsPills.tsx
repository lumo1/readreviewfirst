// src/components/ProsConsPills.tsx
import React from "react";

export default function ProsConsPills({
  pros = [],    // default to empty array
  cons = [],    // same here
}: {
  pros?: string[];
  cons?: string[];
}) {
  return (
    <div className="grid grid-cols-2 gap-8 mb-8">
      <div>
        <h3 className="font-semibold text-green-600 mb-2">Pros</h3>
        {(pros || []).map((p, i) => (
          <p
            key={i}
            className="bg-green-50 px-3 py-1 rounded inline-block mr-2 mb-2 text-sm"
          >
            {p}
          </p>
        ))}
      </div>
      <div>
        <h3 className="font-semibold text-red-600 mb-2">Cons</h3>
        {(cons || []).map((c, i) => (
          <p
            key={i}
            className="bg-red-50 px-3 py-1 rounded inline-block mr-2 mb-2 text-sm"
          >
            {c}
          </p>
        ))}
      </div>
    </div>
  );
}
