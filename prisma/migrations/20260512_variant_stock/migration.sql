-- Per-variant stock. NULL means no cap (defer to Product.stock).
ALTER TABLE "ProductAttributeOption"
  ADD COLUMN "stock" INTEGER;
