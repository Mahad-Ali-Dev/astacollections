/**
 * Picks reviews for a visible set: no two cards show the same text.
 *
 * Most reviews in the store share template wording (951 reviews, 72 distinct
 * texts in Nov 2026), so a stricter "no shared sentence" rule leaves only 3.
 * Different reviews may still share a sentence, so those with the fewest
 * sentences already on show go first, alternating ratings where it costs nothing.
 * Review text is never edited: a review is either shown whole or skipped.
 */
const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();

/** Normalized sentences of a review. Very short fragments ("Love it") are ignored. */
function sentencesOf(body: string): string[] {
  return body
    .split(/(?<=[.!?])\s+|\n+/)
    .map(normalize)
    .filter((s) => s.split(" ").length >= 3);
}

export function selectDistinctReviews<T extends { body: string; rating: number }>(pool: T[], limit: number): T[] {
  const byText = new Map<string, T>();
  for (const r of pool) {
    const text = normalize(r.body);
    if (text && !byText.has(text)) byText.set(text, r);
  }

  const remaining = [...byText.values()];
  const shown = new Set<string>();
  const picked: T[] = [];
  while (picked.length < limit && remaining.length > 0) {
    const lastRating = picked[picked.length - 1]?.rating;
    let best = 0;
    let bestCost = Infinity;
    remaining.forEach((r, i) => {
      const repeats = sentencesOf(r.body).filter((s) => shown.has(s)).length;
      const cost = repeats * 2 + (r.rating === lastRating ? 1 : 0);
      if (cost < bestCost) {
        best = i;
        bestCost = cost;
      }
    });
    const [next] = remaining.splice(best, 1);
    sentencesOf(next.body).forEach((s) => shown.add(s));
    picked.push(next);
  }
  return picked;
}
