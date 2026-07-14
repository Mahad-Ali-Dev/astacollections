import { getSettings } from "@/lib/settings";
import { CheckoutDesignerClient } from "@/components/admin/checkout-designer-client";

export const dynamic = "force-dynamic";

export default async function AdminCheckoutPage() {
  const settings = await getSettings();
  return <CheckoutDesignerClient initial={settings} />;
}
