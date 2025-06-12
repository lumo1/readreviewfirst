// src/components/ReviewActions.tsx
"use client";
import { useState } from "react";
import { Button } from "./ui/button";

type Props = {
  productId: string;
  initialScore: number;
};

export default function ReviewActions({ productId, initialScore }: Props) {
  const [score, setScore] = useState(initialScore);
  const [voted, setVoted] = useState<'up' | 'down' | null>(null);

  const handleVote = async (action: 'upvote' | 'downvote') => {
    if (voted) return; // Prevent re-voting for simplicity
    setVoted(action === 'upvote' ? 'up' : 'down');
    
    const response = await fetch('/api/verify-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, action }),
    });
    const data = await response.json();
    setScore(data.newScore);
  };

  return (
    <div className="mt-6 p-4 border-t text-center">
      <p className="text-sm font-semibold mb-2">Was this review helpful?</p>
      <div className="flex justify-center items-center gap-4">
        <Button onClick={() => handleVote('upvote')} disabled={!!voted} variant={voted === 'up' ? 'default' : 'outline'}>
          👍 Looks Accurate
        </Button>
        <span className="font-bold text-lg w-12">{score}</span>
        <Button onClick={() => handleVote('downvote')} disabled={!!voted} variant={voted === 'down' ? 'destructive' : 'outline'}>
          👎 Seems Wrong
        </Button>
      </div>
    </div>
  );
}