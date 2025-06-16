// src/components/NavBar.tsx
'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { Waves } from 'lucide-react';

export default function NavBar() {
  const router = useRouter();
  const [query, setQuery] = useState('');

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (trimmed) {
      router.push(`/search/${encodeURIComponent(trimmed)}`);
      setQuery('');
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-2">
          <Waves className="h-6 w-6 text-blue-600" />
          <span className="font-bold text-lg">ReadReviewFirst</span>
        </Link>

        {/* Centered Search Bar */}
        <form
          onSubmit={handleSubmit}
          className="hidden sm:flex flex-1 max-w-xl items-center bg-white p-1 rounded-full shadow transition-shadow hover:shadow-md focus-within:ring-2 focus-within:ring-blue-500"
        >
          <Search className="h-5 w-5 text-gray-400 mx-3" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products..."
            className="flex-1 bg-transparent border-none focus:ring-0 text-sm placeholder-gray-400"
          />
          <Button
            type="submit"
            className="ml-2 bg-blue-600 hover:bg-blue-700 rounded-full px-4 py-1 text-sm text-white"
          >
            Search
          </Button>
        </form>

        {/* Browse All (always visible) */}
        <div className="flex items-center space-x-4">
          <Button asChild variant="ghost">
            <Link href="/categories">Browse All Categories</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
