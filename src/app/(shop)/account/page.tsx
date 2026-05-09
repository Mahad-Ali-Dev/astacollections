import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ShoppingBag, User, Package, ArrowRight } from "lucide-react";
import { getCustomerFromCookie } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { formatPrice, formatDateTime } from "@/lib/utils";
import { LogoutButton } from "@/components/shop/logout-button";

export const dynamic = "force-dynamic";
export const metadata = { title: "My Account" };

export default async function AccountPage() {
  const customer = await getCustomerFromCookie();
  if (!customer) redirect("/login?redirect=/account");

  const orders = await prisma.order.findMany({
    where: { customerEmail: customer.email },
    orderBy: { createdAt: "desc" },
    include: { items: { take: 1 } },
    take: 20,
  });

  const totalSpent = orders.reduce((sum, o) => sum + o.total, 0);

  return (
    <div className="container py-12 md:py-16 max-w-5xl">
      {/* Hero */}
      <div className="bg-gradient-to-br from-secondary via-rose-50 to-white border border-border rounded-3xl p-8 md:p-12 mb-10 card-soft">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-foreground text-background flex items-center justify-center font-serif text-2xl">
              {customer.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="eyebrow-accent mb-1">My Account</p>
              <h1 className="font-serif text-3xl md:text-4xl">Welcome, {customer.name.split(" ")[0]}</h1>
              <p className="text-sm text-muted-foreground mt-1">{customer.email}</p>
            </div>
          </div>
          <LogoutButton />
        </div>

        <div className="grid grid-cols-3 gap-4 mt-8 pt-8 border-t border-border/70">
          <Stat label="Orders" value={String(orders.length)} />
          <Stat label="Total Spent" value={formatPrice(totalSpent)} />
          <Stat label="Member Since" value="2026" />
        </div>
      </div>

      {/* Orders */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-serif text-2xl flex items-center gap-2">
            <Package className="h-5 w-5 text-accent" strokeWidth={1.6} />
            Order History
          </h2>
          <Link
            href="/products"
            className="text-xs uppercase tracking-[0.2em] font-semibold text-accent hover:underline"
          >
            Continue Shopping
          </Link>
        </div>

        {orders.length === 0 ? (
          <div className="text-center py-16 bg-white border border-border rounded-3xl">
            <div className="bg-secondary w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5">
              <ShoppingBag className="h-9 w-9 text-accent" strokeWidth={1.4} />
            </div>
            <p className="font-serif text-xl mb-2">No orders yet</p>
            <p className="text-sm text-muted-foreground mb-6 max-w-xs mx-auto">
              Browse our collection and your orders will appear here.
            </p>
            <Link
              href="/products"
              className="inline-flex items-center gap-2 bg-foreground text-background px-7 h-12 rounded-full text-xs uppercase tracking-[0.2em] font-semibold hover:bg-accent transition-colors"
            >
              Browse Products
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((o) => (
              <article
                key={o.id}
                className="bg-white border border-border rounded-2xl p-5 hover:border-accent/50 hover:shadow-sm transition-all flex items-center gap-5"
              >
                {o.items[0]?.image && (
                  <div className="relative w-16 h-16 rounded-xl bg-secondary shrink-0 overflow-hidden">
                    <Image src={o.items[0].image} alt="" fill sizes="64px" className="object-cover" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-mono text-xs text-muted-foreground">{o.orderNumber}</p>
                    <Badge
                      variant={
                        o.status === "DELIVERED"
                          ? "success"
                          : o.status === "CANCELLED"
                            ? "danger"
                            : o.status === "SHIPPED"
                              ? "default"
                              : "warning"
                      }
                    >
                      {o.status}
                    </Badge>
                    {o.trackingNumber && (
                      <Link
                        href="/track-order"
                        className="text-xs text-accent hover:underline inline-flex items-center gap-1"
                      >
                        Track <ArrowRight className="h-3 w-3" />
                      </Link>
                    )}
                  </div>
                  <p className="font-medium mt-1">
                    {o.items.length} item{o.items.length !== 1 ? "s" : ""}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {formatDateTime(o.createdAt)}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-semibold tabular-nums">{formatPrice(o.total)}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {o.paymentMethod === "COD" ? "COD" : "Bank Transfer"}
                  </p>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-[0.32em] text-muted-foreground mb-1">{label}</p>
      <p className="font-serif text-xl md:text-2xl">{value}</p>
    </div>
  );
}
