"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Returns true for ~600ms whenever `value` goes up (e.g. the bag count after
 * Add to bag), so callers can play a one-shot CSS animation (.bag-bounce,
 * .count-bump in globals.css). Never fires on the first render.
 */
export function useBump(value: number, ms = 600): boolean {
  const prev = useRef<number | null>(null);
  const [on, setOn] = useState(false);
  useEffect(() => {
    if (prev.current !== null && value > prev.current) {
      setOn(true);
      const t = setTimeout(() => setOn(false), ms);
      prev.current = value;
      return () => clearTimeout(t);
    }
    prev.current = value;
  }, [value, ms]);
  return on;
}
