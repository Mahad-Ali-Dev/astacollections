import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { formatPrice, formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

const STATUS_FILTERS = ["ALL", "PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"];

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const sp = await searchParams;
  const status = sp.status && sp.status !== "ALL" ? sp.status : undefined;

  const orders = await prisma.order.findMany({
    where: status ? { status } : {},
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-serif">Orders</h1>
        <p className="text-sm text-muted-foreground">Manage customer orders</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {STATUS_FILTERS.map((s) => {
          const active = (sp.status ?? "ALL") === s;
          return (
            <Link
              key={s}
              href={s === "ALL" ? "/admin/orders" : `/admin/orders?status=${s}`}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${
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

      <div className="bg-card border rounded-lg overflow-hidden">
        {orders.length === 0 ? (
          <p className="p-8 text-center text-muted-foreground text-sm">No orders found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs uppercase text-muted-foreground border-b bg-muted/30">
                <tr>
                  <th className="text-left p-3">Order #</th>
                  <th className="text-left p-3">Customer</th>
                  <th className="text-left p-3">Date</th>
                  <th className="text-left p-3">Total</th>
                  <th className="text-left p-3">Payment</th>
                  <th className="text-left p-3">Pay Status</th>
                  <th className="text-left p-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id} className="border-b last:border-0 hover:bg-muted/20">
                    <td className="p-3">
                      <Link
                        href={`/admin/orders/${o.id}`}
                        className="font-mono text-xs text-accent hover:underline"
                      >
                        {o.orderNumber}
                      </Link>
                    </td>
                    <td className="p-3">
                      <p className="font-medium">{o.customerName}</p>
                      <p className="text-xs text-muted-foreground">{o.customerPhone}</p>
                    </td>
                    <td className="p-3 text-xs text-muted-foreground whitespace-nowrap">
                      {formatDateTime(o.createdAt)}
                    </td>
                    <td className="p-3 font-medium whitespace-nowrap">{formatPrice(o.total)}</td>
                    <td className="p-3">
                      <Badge variant="outline">
                        {o.paymentMethod === "COD" ? "COD" : "Bank"}
                      </Badge>
                    </td>
                    <td className="p-3">
                      <Badge
                        variant={
                          o.paymentStatus === "PAID"
                            ? "success"
                            : o.paymentStatus === "FAILED"
                              ? "danger"
                              : "warning"
                        }
                      >
                        {o.paymentStatus}
                      </Badge>
                    </td>
                    <td className="p-3">
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
