-- Inventory enhancements: quantities, thresholds, history
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS stock_quantity INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS minimum_stock_level INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS reorder_point INTEGER DEFAULT 0;

CREATE TABLE IF NOT EXISTS public.stock_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  quantity_changed INTEGER NOT NULL,
  reason TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Simple view to surface low stock products
CREATE OR REPLACE VIEW public.low_stock_products AS
SELECT
  p.id,
  p.name,
  p.stock_quantity,
  p.minimum_stock_level,
  p.reorder_point
FROM public.products p
WHERE p.stock_quantity <= COALESCE(p.minimum_stock_level, 0);
