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
}