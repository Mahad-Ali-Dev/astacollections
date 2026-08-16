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
  searchParams: Promise<{ status?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const status = sp.status && sp.status !== "ALL" ? sp.status : undefined;
  const where = status ? { status: status as any } : {};

  const PER_PAGE = 50;
  const page = Math.max(1, Number(sp.page) || 1);

  const reviews = await prisma.review.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: { product: { select: { name: true, slug: true } } },
    skip: (page - 1) * PER_PAGE,
    take: PER_PAGE,
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
  const deletableCount = await prisma.review.count({ where });
  const totalPages = Math.max(1, Math.ceil(deletableCount / PER_PAGE));

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

      {totalPages > 1 && (
        <div className="flex items-center justify-between gap-4 flex-wrap pt-2">
          <p className="text-xs text-muted-foreground">
            Showing {(page - 1) * PER_PAGE + 1}–
            {Math.min(page * PER_PAGE, deletableCount)} of {deletableCount}
          </p>
          <div className="flex items-center gap-2">
            <PageLink status={sp.status} page={page - 1} disabled={page <= 1}>
              Previous
            </PageLink>
            <span className="text-xs text-muted-foreground px-1">
              Page {page} of {totalPages}
            </span>
            <PageLink status={sp.status} page={page + 1} disabled={page >= totalPages}>
              Next
            </PageLink>
          </div>
        </div>
      )}
    </div>
  );
}

function PageLink({
  status,
  page,
  disabled,
  children,
}: {
  status?: string;
  page: number;
  disabled: boolean;
  children: React.ReactNode;
}) {
  const base =
    "px-3 h-9 inline-flex items-center rounded-md border text-xs font-medium transition";
  if (disabled) {
    return (
      <span className={`${base} text-muted-foreground/50 border-border/50`}>{children}</span>
    );
  }
  const params = new URLSearchParams();
  if (status && status !== "ALL") params.set("status", status);
  if (page > 1) params.set("page", String(page));
  const qs = params.toString();
  return (
    <Link href={`/admin/reviews${qs ? `?${qs}` : ""}`} className={`${base} hover:bg-secondary`}>
      {children}
    </Link>
  );
}
