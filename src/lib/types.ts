// src/lib/types.ts

/**
 * A single “snapshot” of an AI‐generated review.
 */
export interface ReviewVersion {
  /** The structured review content */
  review: Review;
  /** The raw image‐search query used */
  imageSearchQuery: string;
  /** When this version was generated */
  generatedAt: Date;
}

/**  
 * Your existing structured review type  
 */
export interface Review {
  shortSummary:   string;
  rating:         number;     // 0–5 stars  
  pros:           string[];
  cons:           string[];
  detailedReview: string;     // full prose  
  cta:            string;     // e.g. “I’d recommend it to…”  
}

/**  
 * A product, now holding a full history of review versions  
 */
export interface Product {
  _id:                    string;
  name:                   string;
  category:               string;

  /** 
   * All AI‐generated snapshots, in chronological order.
   * The most recent review is at reviewHistory[reviewHistory.length - 1].
   */
  reviewHistory:          ReviewVersion[];

  images:                 string[];
  affiliateUrl:           string;
  createdAt:              Date;
  verification_score:     number;
  upvotes:                number;
  downvotes:              number;
  productEmbedding:       number[];
  lastImageSearchQuery:   string;

  /** 
   * (optional) your old markdown‐based review, for legacy data 
   */
  legacyMarkdownReview?:  string;
}
