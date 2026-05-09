import { prisma } from "@/lib/prisma";
import { CouponsClient } from "@/components/admin/coupons-client";

export const dynamic = "force-dynamic";

export default async function AdminCouponsPage() {
  const coupons = await prisma.coupon.findMany({ orderBy: { createdAt: "desc" } });
  return <CouponsClient initial={coupons} />;
}
