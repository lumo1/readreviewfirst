// src/app/product/[...slug]/loading.tsx
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <main className="flex justify-center min-h-screen p-4 sm:p-8 bg-gray-50">
      <div className="w-full max-w-4xl animate-pulse">
        <Card>
          <CardHeader>
            {/* title */}
            <CardTitle>
              <Skeleton className="h-10 w-1/3 mx-auto" />
            </CardTitle>
            {/* subtitle */}
            <div className="text-center mt-2">
              <Skeleton className="h-4 w-1/4 mx-auto" />
            </div>
          </CardHeader>
          <CardContent>
            {/* image carousel */}
            <Skeleton className="h-64 w-full mb-6" />

            {/* markdown summary */}
            <div className="space-y-4 mb-6">
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-40 w-full" />
            </div>

            {/* review actions */}
            <div className="flex justify-center">
              <Skeleton className="h-10 w-1/3" />
            </div>

            {/* affiliate button */}
            <div className="flex justify-center mt-8">
              <Skeleton className="h-12 w-2/5" />
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
