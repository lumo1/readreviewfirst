// src/components/NavBar.tsx
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Waves } from 'lucide-react'; // A nice, abstract logo icon

export default function NavBar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-2xl items-center">
        
        {/* Logo and Site Name */}
        <div className="mr-4 flex items-center">
          <Link href="/" className="flex items-center space-x-2">
            <Waves className="h-6 w-6 text-blue-600" />
            <span className="font-bold sm:inline-block">
              ReadReviewFirst
            </span>
          </Link>
        </div>

        {/* Main Navigation (for future use) */}
        <nav className="flex flex-1 items-center space-x-6 text-sm font-medium">
          {/* We can add links here later, like "Categories" or "Trending" */}
        </nav>

        {/* Right-side Action Button */}
        <div className="flex items-center justify-end space-x-4">
          <Button asChild variant="ghost">
            <Link href="/search/all">
              Browse All
            </Link>
          </Button>
        </div>

      </div>
    </header>
  );
}