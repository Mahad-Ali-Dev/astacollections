-- Products can now appear under more than one category.
--
-- Product.categoryId stays as the primary category so breadcrumbs, JSON-LD
-- and the product's own page remain unambiguous. This join table holds the
-- additional categories a product also shows up under when browsing.
--
-- Column names and the index layout follow Prisma's implicit many-to-many
-- convention ("_ProductExtraCategories", A/B ordered alphabetically by model)
-- so the client maps onto it without an explicit model.
CREATE TABLE "_ProductExtraCategories" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

CREATE UNIQUE INDEX "_ProductExtraCategories_AB_unique"
  ON "_ProductExtraCategories"("A", "B");

CREATE INDEX "_ProductExtraCategories_B_index"
  ON "_ProductExtraCategories"("B");

ALTER TABLE "_ProductExtraCategories"
  ADD CONSTRAINT "_ProductExtraCategories_A_fkey"
  FOREIGN KEY ("A") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "_ProductExtraCategories"
  ADD CONSTRAINT "_ProductExtraCategories_B_fkey"
  FOREIGN KEY ("B") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
