// src/lib/types.ts
import { ObjectId } from "mongodb";

export interface Review {
  shortSummary: string;
  rating: number;            // 0–5 stars
  pros: string[];
  cons: string[];
  detailedReview: string;    // full prose
  cta: string;               // e.g. “I’d recommend it to…”
}

export interface Product {
  _id: string;
  name: string;
  category: string;
  review: Review;            // now strongly typed
  images: string[];
  affiliateUrl: string;
  createdAt: Date;
  verification_score: number;
  upvotes: number;
  downvotes: number;
  productEmbedding: number[];
  lastImageSearchQuery: string;
  // (old markdown review, for any records created prior to this change)
  legacyMarkdownReview?: string;
}