"use client";

import { useMemo, useState } from "react";
import { Star, Loader2, MessageSquare, X, Check, BadgeCheck, PenLine } from "lucide-react";
import { toast } from "sonner";
import { cn, formatDate } from "@/lib/utils";

type Review = {
  id: string;
  customerName: string;
  rating: number;
  title?: string | null;
  body: string;
  createdAt: string | Date;
  /** True only when the admin marked the reviewer as a confirmed buyer. */
  verified?: boolean;
  /** Present when the section is showing reviews from across the catalogue. */
  product?: { name: string; slug: string } | null;
};

type Customer = { id: string; name: string; email: string } | null;

type Filter = "all" | 5 | 4 | 3;

/** Stars with fractional fill, so 4.5 reads as four and a half, not five. */
export function Stars({ rating, className = "h-3.5 w-3.5" }: { rating: number; className?: string }) {
  return (
    <span className="inline-flex gap-0.5" role="img" aria-label={`${rating.toFixed(1)} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => {
        const fill = Math.max(0, Math.min(1, rating - (i - 1)));
        return (
          <span key={i} className={cn("relative inline-block", className)} aria-hidden="true">
            <Star className={cn("absolute inset-0 h-full w-full fill-border text-border")} />
            <span className="absolute inset-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
              <Star className={cn("h-full w-full fill-amber-400 text-amber-400", className)} />
            </span>
          </span>
        );
      })}
    </span>
  );
}

/** Same wording, ignoring case and punctuation: used to collapse template repeats. */
const textKey = (body: string) => body.toLowerCase().replace(/[^a-z0-9 ]/g, "").replace(/\s+/g, " ").trim();

export function ReviewsSection({
  productId,
  initialReviews,
  customer,
  totalCount,
  averageRating,
  distribution: serverDistribution,
  scope = "product",
}: {
  productId: string;
  initialReviews: Review[];
  customer: Customer;
  /** Every approved review in scope, not just the ones rendered below. */
  totalCount?: number;
  averageRating?: number;
  distribution?: { star: number; count: number }[];
  /**
   * "product" lists only this product's reviews. "all" is used only when
   * this product has none yet: it lists store-wide reviews, labelled as
   * such, and each card names the product it is about.
   */
  scope?: "product" | "all";
}) {
  const [reviews, setReviews] = useState(initialReviews);
  const [showForm, setShowForm] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [exhausted, setExhausted] = useState(false);
  const [filter, setFilter] = useState<Filter>("all");

  const count = totalCount ?? reviews.length;
  const avg =
    averageRating !== undefined && totalCount !== undefined && totalCount > 0
      ? averageRating
      : count > 0
        ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
        : 0;
  const remaining = Math.max(0, count - reviews.length);
  const canLoadMore = !exhausted && remaining > 0;
  const isStore = scope === "all";

  async function loadMore() {
    setLoadingMore(true);
    try {
      const res = await fetch(
        isStore
          ? `/api/reviews?skip=${reviews.length}&take=50`
          : `/api/reviews?productId=${encodeURIComponent(productId)}&skip=${reviews.length}&take=50`
      );
      const data = await res.json();
      const batch: Review[] = data.reviews ?? [];
      if (batch.length === 0) {
        setExhausted(true);
        return;
      }
      // De-duplicate: a review submitted since page load shifts the offset,
      // which would otherwise repeat a row across pages.
      setReviews((current) => {
        const seen = new Set(current.map((r) => r.id));
        return [...current, ...batch.filter((r) => !seen.has(r.id))];
      });
      if (batch.length < 50) setExhausted(true);
    } catch {
      setExhausted(true);
    } finally {
      setLoadingMore(false);
    }
  }

  const distribution =
    serverDistribution ??
    [5, 4, 3, 2, 1].map((star) => ({ star, count: reviews.filter((r) => r.rating === star).length }));

  // Filter, then collapse identical texts into one card with a count.
  const groups = useMemo(() => {
    const filtered = reviews.filter((r) =>
      filter === "all" ? true : filter === 3 ? r.rating <= 3 : r.rating === filter
    );
    const map = new Map<string, { review: Review; same: number }>();
    for (const r of filtered) {
      const k = textKey(r.body);
      const hit = map.get(k);
      if (hit) hit.same += 1;
      else map.set(k, { review: r, same: 0 });
    }
    return [...map.values()];
  }, [reviews, filter]);

  const chips: { key: Filter; label: string; n: number }[] = [
    { key: "all", label: "All", n: count },
    { key: 5, label: "5 ★", n: distribution.find((d) => d.star === 5)?.count ?? 0 },
    { key: 4, label: "4 ★", n: distribution.find((d) => d.star === 4)?.count ?? 0 },
    {
      key: 3,
      label: "3 ★ & below",
      n: distribution.filter((d) => d.star <= 3).reduce((n, d) => n + d.count, 0),
    },
  ];

  return (
    <section className="mt-20 md:mt-28 scroll-mt-28" id="reviews">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4 md:mb-10">
          <div>
            <p className="eyebrow-accent flex items-center gap-3">
              <span className="h-px w-8 bg-accent" aria-hidden="true" />
              {isStore ? "Store reviews" : "Reviews"}
            </p>
            <h2 className="display-2 mt-3">
              {isStore ? "What customers say about Asta" : "What customers say"}
            </h2>
            {isStore && (
              <p className="mt-2 text-sm text-muted-foreground">
                This piece has no reviews yet, so these are reviews of other Asta pieces.
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="inline-flex h-12 items-center gap-2 rounded-full bg-foreground px-6 text-xs font-semibold uppercase tracking-[0.2em] text-background transition-colors hover:bg-accent"
          >
            <PenLine className="h-4 w-4" aria-hidden="true" />
            Write a review
          </button>
        </div>

        {/* Summary: big rating + clickable bars (adapted from 21st.dev "Review Filter Bars", ruixen.ui) */}
        <div className="grid gap-8 rounded-[2rem] border border-border/70 bg-white p-6 md:grid-cols-[220px_1fr] md:gap-12 md:p-10">
          <div className="text-center md:border-r md:border-border/70 md:pr-10 md:text-left">
            <p className="font-serif text-6xl leading-none md:text-7xl">{count > 0 ? avg.toFixed(1) : "–"}</p>
            <div className="mt-3">
              <Stars rating={avg} className="h-5 w-5" />
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              {count > 0 ? `${count} ${count === 1 ? "review" : "reviews"}${isStore ? " across the store" : ""}` : "No reviews yet"}
            </p>
          </div>
          <div className="space-y-2" role="radiogroup" aria-label="Filter reviews by rating">
            {distribution.map((d) => {
              const pct = count > 0 ? Math.round((d.count / count) * 100) : 0;
              const active = filter === d.star || (filter === 3 && d.star <= 3);
              return (
                <button
                  key={d.star}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  disabled={d.count === 0}
                  onClick={() => setFilter(d.star >= 4 ? (d.star as 5 | 4) : 3)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl border px-3 py-2 text-left transition-colors disabled:cursor-default disabled:opacity-50",
                    active ? "border-accent bg-accent/5" : "border-transparent hover:border-border"
                  )}
                >
                  <span className="w-10 shrink-0 text-xs font-medium tabular-nums">{d.star} ★</span>
                  <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-secondary">
                    <span className="block h-full rounded-full bg-amber-400" style={{ width: `${pct}%` }} />
                  </span>
                  <span className="w-10 shrink-0 text-right text-xs tabular-nums text-muted-foreground">{d.count}</span>
                </button>
              );
            })}
          </div>
        </div>

        {reviews.length > 0 && (
          <div className="mt-8 flex flex-wrap gap-2" role="radiogroup" aria-label="Show reviews">
            {chips.filter((c) => c.key === "all" || c.n > 0).map((c) => (
              <button
                key={String(c.key)}
                type="button"
                role="radio"
                aria-checked={filter === c.key}
                onClick={() => setFilter(c.key)}
                className={cn(
                  "inline-flex h-10 items-center gap-1.5 rounded-full border px-4 text-sm transition-colors",
                  filter === c.key ? "border-foreground bg-foreground text-background" : "border-border hover:border-accent"
                )}
              >
                {c.label}
                <span className={cn("text-xs tabular-nums", filter === c.key ? "text-background/70" : "text-muted-foreground")}>
                  {c.n}
                </span>
              </button>
            ))}
          </div>
        )}

        {reviews.length === 0 ? (
          <div className="py-16 text-center">
            <MessageSquare className="mx-auto mb-4 h-10 w-10 text-muted-foreground" strokeWidth={1.4} aria-hidden="true" />
            <p className="mb-2 font-serif text-xl">No reviews yet</p>
            <p className="text-sm text-muted-foreground">Be the first to share your experience.</p>
          </div>
        ) : (
          <>
            {groups.length === 0 ? (
              <p className="mt-8 text-sm text-muted-foreground">No reviews with that rating yet.</p>
            ) : (
              <ul className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-5">
                {groups.map(({ review, same }) => (
                  <li key={review.id}>
                    <ReviewCard review={review} same={same} showProduct={isStore} />
                  </li>
                ))}
              </ul>
            )}

            {canLoadMore && (
              <div className="mt-8 flex flex-col items-center gap-2">
                <button
                  type="button"
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="inline-flex h-11 items-center gap-2 rounded-full border border-border px-7 text-xs font-semibold uppercase tracking-[0.2em] transition-colors hover:border-accent hover:text-accent disabled:opacity-60"
                >
                  {loadingMore ? "Loading…" : `Load ${Math.min(50, remaining)} more`}
                </button>
                <p className="text-xs text-muted-foreground">
                  Loaded {reviews.length} of {count}
                </p>
              </div>
            )}
          </>
        )}
      </div>

      {showForm && (
        <ReviewFormModal productId={productId} customer={customer} onClose={() => setShowForm(false)} />
      )}
    </section>
  );
}

function ReviewCard({ review, same, showProduct }: { review: Review; same: number; showProduct?: boolean }) {
  return (
    <article className="h-full rounded-2xl border border-border/70 bg-white p-6 transition-colors hover:border-accent/40">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span
            aria-hidden="true"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-rose-100 to-rose-200 font-serif text-base text-rose-800"
          >
            {review.customerName.trim().charAt(0).toUpperCase()}
          </span>
          <div className="min-w-0">
            <p className="flex flex-wrap items-center gap-x-2 text-sm font-medium">
              {review.customerName}
              {review.verified && (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700">
                  <BadgeCheck className="h-3.5 w-3.5" aria-hidden="true" /> Verified buyer
                </span>
              )}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">{formatDate(new Date(review.createdAt))}</p>
          </div>
        </div>
        <Stars rating={review.rating} />
      </div>
      {showProduct && review.product && (
        <a
          href={`/products/${review.product.slug}`}
          className="mt-3 inline-block text-[11px] uppercase tracking-[0.16em] text-accent hover:underline"
        >
          {review.product.name}
        </a>
      )}
      {review.title && <p className="mt-3 font-serif text-lg leading-tight">{review.title}</p>}
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground text-pretty">{review.body}</p>
      {same > 0 && (
        <p className="mt-3 text-xs text-muted-foreground">
          {same} other {same === 1 ? "review uses" : "reviews use"} the same wording
        </p>
      )}
    </article>
  );
}

function ReviewFormModal({
  productId,
  customer,
  onClose,
}: {
  productId: string;
  customer: Customer;
  onClose: () => void;
}) {
  const [rating, setRating] = useState(5);
  const [hover, setHover] = useState(0);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [name, setName] = useState(customer?.name ?? "");
  const [email, setEmail] = useState(customer?.email ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (body.trim().length < 10) {
      toast.error("Please share a bit more about your experience");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          rating,
          title: title.trim() || null,
          body: body.trim(),
          customerName: name.trim(),
          customerEmail: email.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Failed to submit");
        return;
      }
      setSubmitted(true);
    } catch {
      toast.error("Failed to submit");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in">
      <div className="absolute inset-0 bg-foreground/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white w-full max-w-lg rounded-3xl shadow-2xl p-7 md:p-9 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 slide-in-from-bottom-3 duration-300">
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 w-9 h-9 rounded-full hover:bg-secondary transition-colors flex items-center justify-center"
        >
          <X className="h-4 w-4" />
        </button>

        {submitted ? (
          <div className="text-center py-8 space-y-4">
            <div className="bg-green-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
              <Check className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="font-serif text-3xl">Thank you!</h3>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto">
              Your review has been submitted. We&apos;ll publish it after a quick review.
            </p>
            <button
              onClick={onClose}
              className="inline-flex bg-foreground text-background px-7 h-12 rounded-full text-xs uppercase tracking-[0.2em] font-semibold hover:bg-accent transition-colors items-center gap-2 gold-button-glow"
            >
              Close
            </button>
          </div>
        ) : (
          <>
            <h3 className="font-serif text-2xl md:text-3xl mb-2">Write a review</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Help other customers by sharing your experience.
            </p>

            <form onSubmit={submit} className="space-y-4">
              {/* Rating */}
              <div>
                <span className="block text-xs uppercase tracking-[0.2em] font-medium text-muted-foreground mb-3">
                  Your rating
                </span>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setRating(n)}
                      onMouseEnter={() => setHover(n)}
                      onMouseLeave={() => setHover(0)}
                      className="p-1 transition-transform hover:scale-110"
                      aria-label={`${n} star${n !== 1 ? "s" : ""}`}
                    >
                      <Star
                        className={`h-8 w-8 transition-colors ${
                          n <= (hover || rating)
                            ? "fill-accent text-accent"
                            : "fill-secondary text-border"
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Title */}
              <label className="block">
                <span className="block text-xs uppercase tracking-[0.2em] font-medium text-muted-foreground mb-2">
                  Headline (optional)
                </span>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Sum it up in a few words"
                  maxLength={120}
                  className="w-full h-11 px-4 rounded-xl border border-border bg-white text-sm focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-colors"
                />
              </label>

              {/* Body */}
              <label className="block">
                <span className="block text-xs uppercase tracking-[0.2em] font-medium text-muted-foreground mb-2">
                  Your review *
                </span>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  required
                  placeholder="Tell other customers about quality, fit, and how you wear it..."
                  rows={4}
                  maxLength={2000}
                  className="w-full px-4 py-3 rounded-xl border border-border bg-white text-sm focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-colors resize-none"
                />
                <p className="text-[11px] text-muted-foreground text-right mt-1">
                  {body.length} / 2000
                </p>
              </label>

              {/* Name + Email (only if not logged in) */}
              {!customer && (
                <div className="grid sm:grid-cols-2 gap-3">
                  <label className="block">
                    <span className="block text-xs uppercase tracking-[0.2em] font-medium text-muted-foreground mb-2">
                      Your name *
                    </span>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className="w-full h-11 px-4 rounded-xl border border-border bg-white text-sm focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-colors"
                    />
                  </label>
                  <label className="block">
                    <span className="block text-xs uppercase tracking-[0.2em] font-medium text-muted-foreground mb-2">
                      Email *
                    </span>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full h-11 px-4 rounded-xl border border-border bg-white text-sm focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-colors"
                    />
                  </label>
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full h-12 bg-foreground text-background rounded-full text-xs uppercase tracking-[0.2em] font-semibold hover:bg-accent transition-colors gold-button-glow disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit Review"
                )}
              </button>

              <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/70 text-center">
                Reviews appear after a brief moderation
              </p>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
