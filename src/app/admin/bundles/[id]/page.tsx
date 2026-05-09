import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { BundleForm } from "@/components/admin/bundle-form";

export default async function EditBundlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [bundle, products] = await Promise.all([
    prisma.bundle.findUnique({
      where: { id },
      include: {
        items: {
          orderBy: { sortOrder: "asc" },
          include: { product: true },
        },
      },
    }),
    prisma.product.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      include: { images: { take: 1, orderBy: { sortOrder: "asc" } } },
    }),
  ]);
  if (!bundle) notFound();
  return <BundleForm bundle={bundle} products={products} />;
}
