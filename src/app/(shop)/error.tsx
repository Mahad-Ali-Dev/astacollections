"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCcw } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="container py-24 text-center max-w-md mx-auto">
      <AlertTriangle className="h-12 w-12 text-amber-600 mx-auto mb-4" />
      <h1 className="text-3xl font-serif mb-2">Something went wrong</h1>
      <p className="text-muted-foreground mb-8">
        We&apos;ve logged the error and will look into it. Please try again.
      </p>
      <div className="flex gap-3 justify-center">
        <Button onClick={reset} variant="gold">
          <RefreshCcw className="h-4 w-4" />
          Try again
        </Button>
        <Link href="/">
          <Button variant="outline">Back to Home</Button>
        </Link>
      </div>
    </div>
  );
}
