import { prisma } from "@/lib/prisma";
import { CartPageClient } from "@/components/shop/cart-page-client";
import { privatePageMeta } from "@/lib/seo";
import { codLine, deliveryLine, getStorePolicy } from "@/lib/store-policy";

export const dynamic = "force-dynamic";
// Transactional page: kept out of search results.
export const metadata = privatePageMeta("Your Bag");

export default async function CartPage() {
  const policy = await getStorePolicy();
  const recommended = await prisma.product.findMany({
    where: { isActive: true, isFeatured: true },
    include: { images: { orderBy: { sortOrder: "asc" }, take: 2 }, _count: { select: { attributes: true } } },
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
    hoverImage: p.images[1]?.url,
    hasOptions: p._count.attributes > 0,
    video: p.videoUrl,
    videoPoster: p.videoPoster,
    isFeatured: p.isFeatured,
  }));

  return (
    <CartPageClient
      recommended={recList}
      // Display-only copy of the delivery terms; checkout computes the charge.
      shipping={{
        fee: policy.shippingFee,
        freeThreshold: policy.freeShippingThreshold,
        deliveryLine: deliveryLine(policy),
        codLine: codLine(policy),
        returnDays: policy.returnDays,
      }}
    />
  );
}
