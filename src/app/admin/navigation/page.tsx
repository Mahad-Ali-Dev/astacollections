import { prisma } from "@/lib/prisma";
import { NavigationClient } from "@/components/admin/navigation-client";

export const dynamic = "force-dynamic";

export default async function AdminNavigationPage() {
  const [items, categories] = await Promise.all([
    prisma.navItem.findMany({
      orderBy: [{ parentId: "asc" }, { sortOrder: "asc" }],
      include: { category: { select: { name: true, slug: true } } },
    }),
    prisma.category.findMany({
      where: { isActive: true },
      select: { id: true, name: true, slug: true },
      orderBy: { sortOrder: "asc" },
    }),
  ]);

  return (
    <NavigationClient
      initial={items.map((it) => ({
        id: it.id,
        label: it.label,
        href: it.href,
        categoryId: it.categoryId,
        categoryName: it.category?.name ?? null,
        parentId: it.parentId,
        sortOrder: it.sortOrder,
        isActive: it.isActive,
        openInNewTab: it.openInNewTab,
      }))}
      categories={categories}
    />
  );
}
