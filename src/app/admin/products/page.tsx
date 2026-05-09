import Link from "next/link";
import Image from "next/image";
import { Plus } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  const products = await prisma.product.findMany({
    include: {
      category: true,
      images: { orderBy: { sortOrder: "asc" }, take: 1 },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif">Products</h1>
          <p className="text-sm text-muted-foreground">{products.length} total</p>
        </div>
        <Link href="/admin/products/new">
          <Button variant="gold">
            <Plus className="h-4 w-4" />
            New Product
          </Button>
        </Link>
      </div>

      <div className="bg-card border rounded-lg overflow-hidden">
        {products.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-muted-foreground mb-4">No products yet.</p>
            <Link href="/admin/products/new">
              <Button variant="gold">Create your first product</Button>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs uppercase text-muted-foreground border-b bg-muted/30">
                <tr>
                  <th className="text-left p-3">Product</th>
                  <th className="text-left p-3">SKU</th>
                  <th className="text-left p-3">Category</th>
                  <th className="text-left p-3">Price</th>
                  <th className="text-left p-3">Stock</th>
                  <th className="text-left p-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id} className="border-b last:border-0 hover:bg-muted/20">
                    <td className="p-3">
                      <Link
                        href={`/admin/products/${p.id}`}
                        className="flex items-center gap-3 hover:text-accent"
                      >
                        <div className="relative w-10 h-10 rounded bg-muted overflow-hidden shrink-0">
                          {p.images[0] && (
                            <Image
                              src={p.images[0].url}
                              alt={p.name}
                              fill
                              sizes="40px"
                              className="object-cover"
                            />
                          )}
                        </div>
                        <span className="font-medium">{p.name}</span>
                      </Link>
                    </td>
                    <td className="p-3 font-mono text-xs">{p.sku}</td>
                    <td className="p-3 text-muted-foreground">{p.category.name}</td>
                    <td className="p-3">
                      <p className="font-medium">{formatPrice(p.price)}</p>
                      {p.comparePrice && (
                        <p className="text-xs text-muted-foreground line-through">
                          {formatPrice(p.comparePrice)}
                        </p>
                      )}
                    </td>
                    <td className="p-3">
                      <span
                        className={
                          p.stock === 0
                            ? "text-destructive font-semibold"
                            : p.stock < 5
                              ? "text-amber-600 font-semibold"
                              : ""
                        }
                      >
                        {p.stock}
                      </span>
                    </td>
                    <td className="p-3 space-x-1">
                      <Badge variant={p.isActive ? "success" : "outline"}>
                        {p.isActive ? "Active" : "Hidden"}
                      </Badge>
                      {p.isFeatured && <Badge variant="gold">Featured</Badge>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
