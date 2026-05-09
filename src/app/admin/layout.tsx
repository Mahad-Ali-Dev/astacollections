import { getAdminFromCookie } from "@/lib/auth";
import { AdminShell } from "@/components/admin/admin-shell";

export const metadata = { title: "Admin Panel" };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await getAdminFromCookie();
  // Middleware redirects unauthenticated requests for any non-login path,
  // so if there's no admin here, it's the login page — render bare.
  if (!admin) return <>{children}</>;
  return <AdminShell admin={admin}>{children}</AdminShell>;
}
