import { prisma } from "@/lib/prisma";
import { CategoriesClient } from "@/components/admin/categories-client";

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
  const categories = await prisma.category.findMany({
    orderBy: { sortOrder: "asc" },
    // Both relations count: products living here, plus ones added to the
    // collection whose primary category is elsewhere.
    include: { _count: { select: { products: true, extraProducts: true } } },
  });
  return <CategoriesClient initial={categories} />;
}
