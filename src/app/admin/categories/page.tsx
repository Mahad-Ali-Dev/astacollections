import { prisma } from "@/lib/prisma";
import { CategoriesClient } from "@/components/admin/categories-client";

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
  const categories = await prisma.category.findMany({
    orderBy: { sortOrder: "asc" },
    include: { _count: { select: { products: true } } },
  });
  return <CategoriesClient initial={categories} />;
}
