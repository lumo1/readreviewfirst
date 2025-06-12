// src/app/page.tsx
"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Badge } from "@/components/ui/badge"; // <-- 1. Import the Badge component

export default function Home() {
  const [query, setQuery] = useState("");
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search/${encodeURIComponent(query.trim())}`);
    }
  };

  // Helper function to handle clicks on the example badges
  const handleExampleClick = (searchTerm: string) => {
    setQuery(searchTerm);
    router.push(`/search/${encodeURIComponent(searchTerm.trim())}`);
  };

  return (
    <main className="flex flex-col items-center justify-center w-full h-full p-4 sm:p-8 bg-gradient-to-b from-slate-50 to-slate-100">
      <div className="text-center w-full max-w-2xl">
        
        {/* Main Headline */}
        <h1 className="text-4xl sm:text-6xl font-extrabold text-gray-800 tracking-tight">
          Unbiased Reviews, On-Demand.
        </h1>
        
        {/* Sub-headline */}
        <p className="mt-4 text-lg sm:text-xl text-gray-500 max-w-xl mx-auto">
          Tired of sifting through sponsored posts and fake reviews? 
          Search for any product and get an instant, AI-powered summary verified by a community you can trust.
        </p>

        {/* Search Form */}
        <form 
          onSubmit={handleSubmit} 
          className="mt-10 w-full max-w-lg mx-auto flex items-center gap-2 bg-white p-2 rounded-full shadow-lg focus-within:ring-2 focus-within:ring-blue-500 transition-shadow duration-300"
        >
          <Search className="h-5 w-5 text-gray-400 ml-3" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for any product, topic, or brand..."
            className="flex-1 bg-transparent border-none focus:ring-0 text-lg placeholder:text-gray-400"
          />
          <Button 
            type="submit" 
            className="bg-blue-600 hover:bg-blue-700 rounded-full px-6 py-3 text-base font-semibold"
          >
            Search
          </Button>
        </form>

        {/* --- NEW: Timeless Example Section --- */}
        <div className="mt-8 text-sm text-gray-600">
          <span className="font-semibold">Or try an example:</span> 
          <div className="flex flex-wrap justify-center gap-2 mt-3">
            <Badge 
              variant="outline" 
              className="cursor-pointer hover:bg-gray-200" 
              onClick={() => handleExampleClick("Best portable charger for travel")}
            >
              Travel Gadgets
            </Badge>
            <Badge 
              variant="outline" 
              className="cursor-pointer hover:bg-gray-200" 
              onClick={() => handleExampleClick("Dog training clicker for puppies")}
            >
              Pet Supplies
            </Badge>
            <Badge 
              variant="outline" 
              className="cursor-pointer hover:bg-gray-200" 
              onClick={() => handleExampleClick("Silent mechanical keyboard for office")}
            >
              Office Electronics
            </Badge>
            <Badge 
              variant="outline" 
              className="cursor-pointer hover:bg-gray-200" 
              onClick={() => handleExampleClick("Beginner's guide to watercolor painting")}
            >
              Hobbyist Kits
            </Badge>
          </div>
        </div>
        {/* --- END OF NEW SECTION --- */}

      </div>
    </main>
  );
}