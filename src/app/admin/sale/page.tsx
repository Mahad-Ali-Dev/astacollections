import { getSaleSummary } from "@/lib/store-sale";
import { SaleClient } from "@/components/admin/sale-client";

export const dynamic = "force-dynamic";

export default async function AdminSalePage() {
  const sale = await getSaleSummary();
  return <SaleClient initial={sale} />;
}
