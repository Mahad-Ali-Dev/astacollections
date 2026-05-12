-- AlterTable: OrderItem now records the selected variant for each line
ALTER TABLE "OrderItem" ADD COLUMN "selectedAttributes" JSONB;

-- CreateTable: ProductAttribute
CREATE TABLE "ProductAttribute" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'OPTION',
    "required" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductAttribute_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ProductAttribute_productId_sortOrder_idx"
ON "ProductAttribute"("productId", "sortOrder");

ALTER TABLE "ProductAttribute"
ADD CONSTRAINT "ProductAttribute_productId_fkey"
FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable: ProductAttributeOption
CREATE TABLE "ProductAttributeOption" (
    "id" TEXT NOT NULL,
    "attributeId" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "colorHex" TEXT,
    "priceModifier" DOUBLE PRECISION,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ProductAttributeOption_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ProductAttributeOption_attributeId_sortOrder_idx"
ON "ProductAttributeOption"("attributeId", "sortOrder");

ALTER TABLE "ProductAttributeOption"
ADD CONSTRAINT "ProductAttributeOption_attributeId_fkey"
FOREIGN KEY ("attributeId") REFERENCES "ProductAttribute"("id") ON DELETE CASCADE ON UPDATE CASCADE;
