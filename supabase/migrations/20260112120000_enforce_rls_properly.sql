-- Ensure RLS is enabled on critical tables
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Drop any overly permissive policies and recreate them correctly
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.orders;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.bills;

-- Ensure orders policies are correct
DROP POLICY IF EXISTS "Customers can view their own orders" ON public.orders;
CREATE POLICY "Customers can view their own orders"
ON public.orders FOR SELECT
TO authenticated
USING (
  customer_id = auth.uid()
  OR public.is_admin_or_ca(auth.uid())
);

-- Ensure bills policies are correct
DROP POLICY IF EXISTS "Customers can view their own bills" ON public.bills;
CREATE POLICY "Customers can view their own bills"
ON public.bills FOR SELECT
TO authenticated
USING (
  customer_id = auth.uid()
  OR public.is_admin_or_ca(auth.uid())
);
