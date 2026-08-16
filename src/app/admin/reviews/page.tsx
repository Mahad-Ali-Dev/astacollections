import Link from "next/link";
import { Star } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { ReviewModerator } from "@/components/admin/review-moderator";
import { ReviewImporter } from "@/components/admin/review-importer";
import { ReviewBulkDelete } from "@/components/admin/review-bulk-delete";
import { formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

const STATUS_FILTERS = ["ALL", "PENDING", "APPROVED", "REJECTED"];

export default async function AdminReviewsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const sp = await searchParams;
  const status = sp.status && sp.status !== "ALL" ? sp.status : undefined;

  const reviews = await prisma.review.findMany({
    where: status ? { status: status as any } : {},
    orderBy: { createdAt: "desc" },
    include: { product: { select: { name: true, slug: true } } },
    take: 200,
  });

  // Feed the importer a product list so reviews can be attached from a
  // dropdown instead of hand-typing a SKU.
  const products = await prisma.product.findMany({
    where: { isActive: true },
    select: { id: true, name: true, sku: true },
    orderBy: { name: "asc" },
  });

  // The delete button acts on whatever the status filter is showing, so it
  // needs that filter's count rather than the overall total.
  const deletableCount = await prisma.review.count({
    where: status ? { status: status as any } : {},
  });

  const counts = {
    pending: await prisma.review.count({ where: { status: "PENDING" } }),
    approved: await prisma.review.count({ where: { status: "APPROVED" } }),
    rejected: await prisma.review.count({ where: { status: "REJECTED" } }),
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-serif">Reviews</h1>
          <p className="text-sm text-muted-foreground">
            {counts.pending} pending · {counts.approved} approved · {counts.rejected} rejected
          </p>
        </div>
        <ReviewBulkDelete
          status={sp.status && sp.status !== "ALL" ? sp.status : "ALL"}
          count={deletableCount}
        />
      </div>

      <ReviewImporter products={products} />

      <div className="flex flex-wrap gap-2">
        {STATUS_FILTERS.map((s) => {
          const active = (sp.status ?? "ALL") === s;
          return (
            <Link
              key={s}
              href={s === "ALL" ? "/admin/reviews" : `/admin/reviews?status=${s}`}
              className={`px-4 py-1.5 rounded-full text-xs font-medium uppercase tracking-[0.18em] transition ${
                active
                  ? "bg-foreground text-background"
                  : "bg-muted text-muted-foreground hover:bg-muted/70"
              }`}
            >
              {s}
            </Link>
          );
        })}
      </div>

      {reviews.length === 0 ? (
        <p className="bg-card border rounded-xl p-12 text-center text-muted-foreground text-sm">
          No reviews found.
        </p>
      ) : (
        <div className="space-y-3">
          {reviews.map((r) => (
            <article key={r.id} className="bg-card border rounded-xl p-5 space-y-3">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <p className="font-medium">{r.customerName}</p>
                    <span className="text-xs text-muted-foreground">{r.customerEmail}</span>
                    <Badge
                      variant={
                        r.status === "APPROVED"
                          ? "success"
                          : r.status === "REJECTED"
                            ? "danger"
                            : "warning"
                      }
                    >
                      {r.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDateTime(r.createdAt)} ·{" "}
                    <Link
                      href={`/products/${r.product.slug}`}
                      target="_blank"
                      className="text-accent hover:underline"
                    >
                      {r.product.name}
                    </Link>
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${
                        i < r.rating ? "fill-amber-500 text-amber-500" : "fill-muted text-muted-foreground"
                      }`}
                    />
                  ))}
                </div>
              </div>
              {r.title && <p className="font-medium">{r.title}</p>}
              <p className="text-sm text-muted-foreground leading-relaxed">{r.body}</p>
              <ReviewModerator id={r.id} status={r.status} />
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
