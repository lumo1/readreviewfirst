// src/components/ReviewActions.tsx
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function ReviewActions({
  productId,
  initialGeneratedAt, // Date ISO from your DB
}: {
  productId: string;
  initialGeneratedAt: string;
}) {
  const [lastGen, setLastGen] = useState<Date>(new Date(initialGeneratedAt));
  const [cooldown, setCooldown] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  // compute remaining seconds until 24h since lastGen
  useEffect(() => {
    const tick = () => {
      const elapsed = (Date.now() - lastGen.getTime()) / 1000;
      const rem = Math.max(0, 24 * 3600 - elapsed);
      setCooldown(rem);
    };
    tick();
    const iv = setInterval(tick, 60 * 1000);
    return () => clearInterval(iv);
  }, [lastGen]);

  const handleRegenerate = async () => {
    if (cooldown > 0) return;
    setLoading(true);
    const res = await fetch("/api/regenerate-review", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId }),
    });
    const json = await res.json();
    if (res.ok) {
      setLastGen(new Date(json.generatedAt));
      // you might also want to refresh the page or re-fetch the review
    } else {
      console.error(json.error);
    }
    setLoading(false);
  };

  const hours = Math.floor(cooldown / 3600);
  const mins  = Math.floor((cooldown % 3600) / 60);

  return (
    <div className="flex justify-center space-x-4 mt-4">
      <Button
        onClick={handleRegenerate}
        disabled={cooldown > 0 || loading}
        variant="outline"
      >
        {loading
          ? "Regenerating…"
          : cooldown > 0
          ? `Retry in ${hours}h${mins}m`
          : "Regenerate Review"}
      </Button>
    </div>
  );
}
