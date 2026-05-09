import { getSettings } from "@/lib/settings";
import { ContentClient } from "@/components/admin/content-client";

export const dynamic = "force-dynamic";

export default async function AdminContentPage() {
  const settings = await getSettings();
  return <ContentClient initial={settings} />;
}
