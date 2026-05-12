import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { OrderDetailClient } from "@/components/admin/order-detail-client";

export const dynamic = "force-dynamic";

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: true, coupon: true },
  });
  if (!order) notFound();

  return <OrderDetailClient order={order as any} />;
}
