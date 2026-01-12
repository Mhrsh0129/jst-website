-- Create coupons table for discount codes
CREATE TABLE IF NOT EXISTS public.coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('fixed', 'percentage')),
  discount_value DECIMAL(10, 2) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

-- Admin can create and manage coupons
CREATE POLICY "admins_create_coupons"
ON public.coupons FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "admins_view_coupons"
ON public.coupons FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR is_active);

CREATE POLICY "admins_update_coupons"
ON public.coupons FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "admins_delete_coupons"
ON public.coupons FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Create indexes
CREATE INDEX idx_coupons_code ON public.coupons(code);
CREATE INDEX idx_coupons_product_id ON public.coupons(product_id);
CREATE INDEX idx_coupons_is_active ON public.coupons(is_active);
