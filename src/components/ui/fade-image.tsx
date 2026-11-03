"use client";

import Image, { type ImageProps } from "next/image";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * next/image that fades in when it finishes loading (see `.img-fade` in
 * globals.css). It is only hidden if, after hydration, it is still loading;
 * images the server rendered or the browser already decoded stay visible.
 */
export function FadeImage({ className, onLoad, ...props }: ImageProps) {
  const ref = useRef<HTMLImageElement>(null);
  const [loaded, setLoaded] = useState<"pending" | "false" | "true">("pending");
  useEffect(() => {
    const img = ref.current;
    if (img && !img.complete) setLoaded((s) => (s === "pending" ? "false" : s));
  }, []);
  return (
    <Image
      {...props}
      ref={ref}
      data-loaded={loaded === "pending" ? undefined : loaded}
      onLoad={(e) => {
        setLoaded("true");
        onLoad?.(e);
      }}
      className={cn("img-fade", className)}
    />
  );
}
