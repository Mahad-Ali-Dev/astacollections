import { prisma } from "@/lib/prisma";
import { BundleForm } from "@/components/admin/bundle-form";

export default async function NewBundlePage() {
  const products = await prisma.product.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    include: { images: { take: 1, orderBy: { sortOrder: "asc" } } },
  });
  return <BundleForm products={products} />;
}
