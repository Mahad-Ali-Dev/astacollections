import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center p-6 bg-gradient-to-br from-secondary to-background">
      <p className="text-[10rem] md:text-[16rem] font-serif italic gold-text leading-none">404</p>
      <h1 className="text-3xl md:text-4xl font-serif mt-2">Page not found</h1>
      <p className="text-muted-foreground mt-3 max-w-md">
        The page you&apos;re looking for has moved, or never existed. Let&apos;s get you back to
        something beautiful.
      </p>
      <div className="flex gap-3 mt-8">
        <Link href="/">
          <Button variant="gold" size="lg">Back to Home</Button>
        </Link>
        <Link href="/products">
          <Button variant="outline" size="lg">
            <Search className="h-4 w-4" />
            Browse Products
          </Button>
        </Link>
      </div>
    </div>
  );
}
