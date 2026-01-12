-- Add coupon and discount fields to order_items
ALTER TABLE public.order_items 
ADD COLUMN coupon_code TEXT,
ADD COLUMN discount_applied DECIMAL(12,2) DEFAULT 0;

-- Add indexes for coupon_code for performance
CREATE INDEX idx_order_items_coupon_code ON public.order_items(coupon_code);
