-- AlterTable: add parentId to Category for nested subcategories
ALTER TABLE "Category" ADD COLUMN "parentId" TEXT;

CREATE INDEX "Category_parentId_idx" ON "Category"("parentId");

ALTER TABLE "Category"
ADD CONSTRAINT "Category_parentId_fkey"
FOREIGN KEY ("parentId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateTable: NavItem (fully admin-customizable navigation)
CREATE TABLE "NavItem" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "href" TEXT,
    "categoryId" TEXT,
    "parentId" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "openInNewTab" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NavItem_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "NavItem_parentId_sortOrder_idx" ON "NavItem"("parentId", "sortOrder");
CREATE INDEX "NavItem_isActive_idx" ON "NavItem"("isActive");

ALTER TABLE "NavItem"
ADD CONSTRAINT "NavItem_categoryId_fkey"
FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "NavItem"
ADD CONSTRAINT "NavItem_parentId_fkey"
FOREIGN KEY ("parentId") REFERENCES "NavItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
