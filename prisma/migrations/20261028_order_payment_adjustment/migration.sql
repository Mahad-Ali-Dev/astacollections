-- Checkout pricing can now depend on the payment method: the admin can add a
-- fee (e.g. COD charges) or a discount (e.g. prepaid bank transfer) per method.
--
-- The signed amount is stored on the order so the receipt, admin view and
-- email can show the line that made up the total. It is already included in
-- "total". Existing orders had no adjustment, hence the 0 default.
ALTER TABLE "Order" ADD COLUMN "paymentAdjustment" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "Order" ADD COLUMN "paymentAdjustmentLabel" TEXT;
