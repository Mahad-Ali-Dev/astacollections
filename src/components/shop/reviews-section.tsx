"use client";

import { useState } from "react";
import { Star, Loader2, MessageSquare, X, Check } from "lucide-react";
import { toast } from "sonner";
import { formatDate } from "@/lib/utils";

type Review = {
  id: string;
  customerName: string;
  rating: number;
  title?: string | null;
  body: string;
  createdAt: string | Date;
};

type Customer = { id: string; name: string; email: string } | null;

export function ReviewsSection({
  productId,
  initialReviews,
  customer,
  totalCount,
  averageRating,
  distribution: serverDistribution,
}: {
  productId: string;
  initialReviews: Review[];
  customer: Customer;
  /** Every approved review, not just the ones rendered below. */
  totalCount?: number;
  averageRating?: number;
  distribution?: { star: number; count: number }[];
}) {
  const [reviews, setReviews] = useState(initialReviews);
  const [showForm, setShowForm] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [exhausted, setExhausted] = useState(false);

  // The list starts capped and grows via Load more, so the summary can't be
  // derived from it — it uses the server-side totals when supplied. Newly
  // submitted reviews land as PENDING and never join this list, so nothing
  // needs adding optimistically.
  const count = totalCount ?? reviews.length;
  const avg =
    averageRating !== undefined && totalCount !== undefined && totalCount > 0
      ? averageRating
      : count > 0
        ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
        : 0;
  const remaining = Math.max(0, count - reviews.length);
  const canLoadMore = !exhausted && remaining > 0;

  async function loadMore() {
    setLoadingMore(true);
    try {
      const res = await fetch(
        `/api/reviews?productId=${encodeURIComponent(productId)}&skip=${reviews.length}&take=50`
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
    [5, 4, 3, 2, 1].map((star) => ({
      star,
      count: reviews.filter((r) => r.rating === star).length,
    }));

  return (
    <section className="mt-24" id="reviews">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <p className="eyebrow-accent mb-3 flex items-center justify-center gap-3">
            <span className="h-px w-8 bg-accent" />
            Customer Reviews
            <span className="h-px w-8 bg-accent" />
          </p>
          <h2 className="display-2">What our customers say</h2>
        </div>

        {/* Summary card */}
        <div className="bg-gradient-to-br from-secondary via-rose-50 to-white border border-border rounded-3xl p-7 md:p-10 card-soft grid md:grid-cols-3 gap-8 items-center">
          <div className="text-center md:text-left md:col-span-1 md:border-r md:border-border/70 md:pr-8">
            <p className="font-serif text-6xl md:text-7xl text-balance leading-none">
              {avg.toFixed(1)}
            </p>
            <div className="flex justify-center md:justify-start mt-3 mb-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`h-5 w-5 ${
                    i < Math.round(avg) ? "fill-accent text-accent" : "fill-secondary text-border"
                  }`}
                />
              ))}
            </div>
            <p className="text-sm text-muted-foreground">
              Based on {count} review{count !== 1 ? "s" : ""}
            </p>
          </div>

          <div className="md:col-span-1 space-y-2">
            {distribution.map((d) => {
              const pct = count > 0 ? (d.count / count) * 100 : 0;
              return (
                <div key={d.star} className="flex items-center gap-3">
                  <span className="text-xs font-medium w-3 tabular-nums">{d.star}</span>
                  <Star className="h-3 w-3 fill-accent text-accent" />
                  <div className="flex-1 h-1.5 bg-border/50 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-accent transition-all duration-700"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground w-8 text-right tabular-nums">
                    {d.count}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="md:col-span-1 text-center md:text-right">
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 bg-foreground text-background px-7 h-12 rounded-full text-xs uppercase tracking-[0.2em] font-semibold hover:bg-accent transition-colors gold-button-glow"
            >
              <MessageSquare className="h-4 w-4" />
              Write a Review
            </button>
            <p className="text-xs text-muted-foreground mt-3">
              {customer ? `Signed in as ${customer.name}` : "Sign-in optional"}
            </p>
          </div>
        </div>

        {/* Reviews list */}
        {reviews.length === 0 ? (
          <div className="text-center py-16">
            <MessageSquare className="h-10 w-10 text-muted-foreground mx-auto mb-4" strokeWidth={1.4} />
            <p className="font-serif text-xl mb-2">No reviews yet</p>
            <p className="text-sm text-muted-foreground">Be the first to share your experience.</p>
          </div>
        ) : (
          <>
          <div className="grid md:grid-cols-2 gap-5 mt-12">
            {reviews.map((r) => (
              <ReviewCard key={r.id} review={r} />
            ))}
          </div>

          {canLoadMore && (
            <div className="mt-8 flex flex-col items-center gap-2">
              <button
                type="button"
                onClick={loadMore}
                disabled={loadingMore}
                className="inline-flex items-center gap-2 h-11 px-7 rounded-full border border-border hover:border-accent hover:text-accent transition-colors text-xs uppercase tracking-[0.2em] font-semibold disabled:opacity-60"
              >
                {loadingMore ? "Loading…" : `Load ${Math.min(50, remaining)} more`}
              </button>
              <p className="text-xs text-muted-foreground">
                Showing {reviews.length} of {count}
              </p>
            </div>
          )}
          </>
        )}
      </div>

      {/* Review form modal */}
      {showForm && (
        <ReviewFormModal
          productId={productId}
          customer={customer}
          onClose={() => setShowForm(false)}
        />
      )}
    </section>
  );
}

function ReviewCard({ review }: { review: Review }) {
  return (
    <article className="bg-white border border-border rounded-2xl p-6 card-soft hover:border-accent/40 transition-colors">
      <div className="flex items-start justify-between mb-3 gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-secondary text-foreground flex items-center justify-center font-serif text-base">
            {review.customerName.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-medium text-sm">{review.customerName}</p>
            <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground mt-0.5">
              {formatDate(new Date(review.createdAt))}
            </p>
          </div>
        </div>
        <div className="flex">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={`h-3.5 w-3.5 ${
                i < review.rating ? "fill-accent text-accent" : "fill-secondary text-border"
              }`}
            />
          ))}
        </div>
      </div>
      {review.title && <p className="font-serif text-lg mb-2 leading-tight">{review.title}</p>}
      <p className="text-sm text-muted-foreground leading-relaxed text-pretty">{review.body}</p>
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
