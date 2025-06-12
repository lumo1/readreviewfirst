// src/lib/types.ts
import { ObjectId } from "mongodb";

export interface Product {
  _id: string; // The _id will be our custom string slug.
  name: string;
  category: string;
  review: string;
  images: string[];
  affiliateUrl: string;
  createdAt: Date;
  verification_score: number;
  upvotes: number;
  downvotes: number;
<<<<<<< HEAD
  productEmbedding?: number[];
  lastImageSearchQuery?: string; 
=======
>>>>>>> 0c5de07fcdeef2d115c20d12a6a065d9dcbee33a
}