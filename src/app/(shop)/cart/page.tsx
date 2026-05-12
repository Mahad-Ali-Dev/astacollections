import { prisma } from "@/lib/prisma";
import { CartPageClient } from "@/components/shop/cart-page-client";

export const dynamic = "force-dynamic";
export const metadata = { title: "Your Bag" };

export default async function CartPage() {
  const recommended = await prisma.product.findMany({
    where: { isActive: true, isFeatured: true },
    include: { images: { orderBy: { sortOrder: "asc" }, take: 1 } },
    take: 4,
    orderBy: { createdAt: "desc" },
  });

  const recList = recommended.map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    price: p.price,
    comparePrice: p.comparePrice,
    sku: p.sku,
    stock: p.stock,
    image: p.images[0]?.url,
    video: p.videoUrl,
    videoPoster: p.videoPoster,
    isFeatured: p.isFeatured,
  }));

  return <CartPageClient recommended={recList} />;
}
