import Link from "next/link";
import {
  ShoppingBag,
  Package,
  DollarSign,
  Clock,
  TrendingUp,
  AlertCircle,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatPrice, formatDateTime } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const [
    totalOrders,
    pendingOrders,
    totalProducts,
    lowStock,
    totalRevenue,
    todayOrders,
    recentOrders,
  ] = await Promise.all([
    prisma.order.count(),
    prisma.order.count({ where: { status: "PENDING" } }),
    prisma.product.count({ where: { isActive: true } }),
    prisma.product.count({ where: { stock: { lt: 5 }, isActive: true } }),
    prisma.order.aggregate({
      _sum: { total: true },
      where: { paymentStatus: "PAID" },
    }),
    prisma.order.count({
      where: { createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } },
    }),
    prisma.order.findMany({
      take: 8,
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const stats = [
    {
      label: "Total Orders",
      value: totalOrders,
      sub: `${todayOrders} today`,
      icon: ShoppingBag,
      color: "text-blue-600 bg-blue-50",
    },
    {
      label: "Pending Orders",
      value: pendingOrders,
      sub: "Awaiting confirmation",
      icon: Clock,
      color: "text-amber-600 bg-amber-50",
    },
    {
      label: "Active Products",
      value: totalProducts,
      sub: `${lowStock} low stock`,
      icon: Package,
      color: "text-green-600 bg-green-50",
    },
    {
      label: "Revenue (paid)",
      value: formatPrice(totalRevenue._sum.total ?? 0),
      sub: "All time",
      icon: DollarSign,
      color: "text-purple-600 bg-purple-50",
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-serif">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Overview of your store</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="bg-card border rounded-lg p-4">
            <div className={`inline-flex p-2 rounded-md ${s.color}`}>
              <s.icon className="h-4 w-4" />
            </div>
            <p className="text-xs text-muted-foreground mt-3">{s.label}</p>
            <p className="text-2xl font-semibold mt-1">{s.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{s.sub}</p>
          </div>
        ))}
      </div>

      {lowStock > 0 && (
        <Link
          href="/admin/products"
          className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-lg p-4 hover:bg-amber-100"
        >
          <AlertCircle className="h-5 w-5 text-amber-600 shrink-0" />
          <p className="text-sm flex-1">
            <strong>{lowStock} product(s)</strong> are running low on stock (less than 5 in stock).
          </p>
          <span className="text-xs text-amber-700">Review →</span>
        </Link>
      )}

      <div className="bg-card border rounded-lg">
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="font-semibold">Recent Orders</h2>
          <Link href="/admin/orders" className="text-sm text-accent hover:underline">
            View all →
          </Link>
        </div>
        {recentOrders.length === 0 ? (
          <p className="p-8 text-center text-muted-foreground text-sm">No orders yet.</p>
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
                  <th className="text-left p-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((o) => (
                  <tr key={o.id} className="border-b hover:bg-muted/20">
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
                      <p className="text-xs text-muted-foreground">{o.customerEmail}</p>
                    </td>
                    <td className="p-3 text-xs text-muted-foreground">
                      {formatDateTime(o.createdAt)}
                    </td>
                    <td className="p-3 font-medium">{formatPrice(o.total)}</td>
                    <td className="p-3">
                      <Badge variant="outline">{o.paymentMethod}</Badge>
                    </td>
                    <td className="p-3">
                      <Badge variant={o.status === "PENDING" ? "warning" : "success"}>
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
