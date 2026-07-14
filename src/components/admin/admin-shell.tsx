"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  FolderTree,
  Ticket,
  ShoppingBag,
  Settings,
  LogOut,
  Menu,
  X,
  ExternalLink,
  Layers,
  Star,
  ImageIcon,
  CreditCard,
  Menu as MenuIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/orders", label: "Orders", icon: ShoppingBag },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/categories", label: "Categories", icon: FolderTree },
  { href: "/admin/bundles", label: "Bundles", icon: Layers },
  { href: "/admin/reviews", label: "Reviews", icon: Star },
  { href: "/admin/coupons", label: "Coupons", icon: Ticket },
  { href: "/admin/checkout", label: "Checkout", icon: CreditCard },
  { href: "/admin/content", label: "Site Content", icon: ImageIcon },
  { href: "/admin/navigation", label: "Navigation", icon: MenuIcon },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export function AdminShell({
  admin,
  children,
}: {
  admin: { name: string; email: string };
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    toast.success("Signed out");
    router.push("/admin/login");
    router.refresh();
  };

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(href + "/");

  return (
    <div className="min-h-screen bg-muted/30 flex">
      {/* Sidebar (desktop) */}
      <aside className="hidden lg:flex w-64 bg-card border-r flex-col fixed inset-y-0">
        <SidebarContent
          admin={admin}
          isActive={isActive}
          onLogout={logout}
          onClose={() => setMobileOpen(false)}
        />
      </aside>

      {/* Mobile sidebar */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-64 bg-card flex flex-col">
            <SidebarContent
              admin={admin}
              isActive={isActive}
              onLogout={logout}
              onClose={() => setMobileOpen(false)}
            />
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 lg:ml-64 flex flex-col min-w-0">
        <header className="h-14 bg-card border-b flex items-center px-4 lg:px-6 sticky top-0 z-30">
          <button
            className="lg:hidden mr-2"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <h1 className="font-medium text-sm">
            {NAV.find((n) => isActive(n.href, n.exact))?.label ?? "Admin"}
          </h1>
          <div className="ml-auto flex items-center gap-3">
            <Link
              href="/"
              target="_blank"
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
            >
              View Store <ExternalLink className="h-3 w-3" />
            </Link>
          </div>
        </header>
        <main className="flex-1 p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}

function SidebarContent({
  admin,
  isActive,
  onLogout,
  onClose,
}: {
  admin: { name: string; email: string };
  isActive: (href: string, exact?: boolean) => boolean;
  onLogout: () => void;
  onClose: () => void;
}) {
  return (
    <>
      <div className="p-4 border-b flex items-center justify-between">
        <Link href="/admin" className="font-serif text-xl">
          Asta <span className="text-accent">Admin</span>
        </Link>
        <button onClick={onClose} className="lg:hidden" aria-label="Close menu">
          <X className="h-5 w-5" />
        </button>
      </div>
      <nav className="p-3 space-y-1 flex-1">
        {NAV.map((item) => {
          const active = isActive(item.href, item.exact);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition",
                active
                  ? "bg-accent/10 text-accent font-medium"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="p-3 border-t space-y-2">
        <div className="px-3 py-2 text-xs">
          <p className="font-medium truncate">{admin.name}</p>
          <p className="text-muted-foreground truncate">{admin.email}</p>
        </div>
        <Button
          onClick={onLogout}
          variant="outline"
          size="sm"
          className="w-full justify-start gap-2"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </Button>
      </div>
    </>
  );
}
