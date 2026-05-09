import Link from "next/link";
import Image from "next/image";
import { Plus, Edit, Layers } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { computeBundlePricing } from "@/lib/bundles";
import { formatPrice } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminBundlesPage() {
  const bundles = await prisma.bundle.findMany({
    orderBy: { sortOrder: "asc" },
    include: {
      items: {
        orderBy: { sortOrder: "asc" },
        include: {
          product: { include: { images: { take: 1, orderBy: { sortOrder: "asc" } } } },
        },
      },
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif">Bundles</h1>
          <p className="text-sm text-muted-foreground">{bundles.length} total · shown on product pages and homepage</p>
        </div>
        <Link href="/admin/bundles/new">
          <Button variant="gold">
            <Plus className="h-4 w-4" />
            New Bundle
          </Button>
        </Link>
      </div>

      {bundles.length === 0 ? (
        <div className="bg-card border rounded-lg p-12 text-center">
          <Layers className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground mb-4">No bundles yet.</p>
          <Link href="/admin/bundles/new">
            <Button variant="gold">Create your first bundle</Button>
          </Link>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {bundles.map((b) => {
            const pricing = computeBundlePricing({
              discountType: b.discountType,
              discountValue: b.discountValue,
              items: b.items.map((i) => ({
                productId: i.productId,
                quantity: i.quantity,
                product: { price: i.product.price },
              })),
            });
            return (
              <Link
                key={b.id}
                href={`/admin/bundles/${b.id}`}
                className="bg-card border rounded-lg p-5 hover:border-accent hover:shadow-sm transition flex gap-4"
              >
                <div className="grid grid-cols-2 gap-1 w-24 h-24 shrink-0">
                  {b.items.slice(0, 4).map((it, i) => (
                    <div key={i} className="relative bg-muted rounded overflow-hidden">
                      {it.product.images[0] && (
                        <Image
                          src={it.product.images[0].url}
                          alt=""
                          fill
                          sizes="48px"
                          className="object-cover"
                        />
                      )}
                    </div>
                  ))}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-2 justify-between">
                    <h3 className="font-medium line-clamp-1">{b.name}</h3>
                    <Edit className="h-4 w-4 text-muted-foreground shrink-0" />
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                    {b.description ?? "—"}
                  </p>
                  <div className="flex items-center gap-2 mt-3 flex-wrap">
                    <Badge variant={b.isActive ? "success" : "outline"}>
                      {b.isActive ? "Active" : "Inactive"}
                    </Badge>
                    <Badge variant="gold">
                      {b.discountType === "PERCENTAGE"
                        ? `${b.discountValue}% off`
                        : `${formatPrice(b.discountValue)} off`}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {b.items.length} items
                    </span>
                  </div>
                  <p className="text-xs mt-2 tabular-nums">
                    <span className="text-muted-foreground line-through">
                      {formatPrice(pricing.original)}
                    </span>{" "}
                    <span className="font-semibold">{formatPrice(pricing.final)}</span>
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
