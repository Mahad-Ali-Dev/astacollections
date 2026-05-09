/** Convert a comma-separated tags string into a clean array. */
export function parseTags(tags?: string | null): string[] {
  if (!tags) return [];
  return tags
    .split(",")
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean);
}

/** Normalize tags for storage (lowercase, trimmed, deduped, comma-joined). */
export function normalizeTags(input: string | string[]): string {
  const arr = Array.isArray(input) ? input : input.split(",");
  const seen = new Set<string>();
  for (const raw of arr) {
    const t = raw.trim().toLowerCase();
    if (t) seen.add(t);
  }
  return Array.from(seen).join(",");
}

/** Pretty-print a tag for UI (capitalize first letter, hyphens → spaces). */
export function prettyTag(tag: string): string {
  return tag.replace(/-/g, " ").replace(/^\w/, (c) => c.toUpperCase());
}
