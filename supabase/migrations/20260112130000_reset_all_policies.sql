-- Drop ALL existing policies on orders and bills
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'orders' AND schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.orders';
    END LOOP;
    
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'bills' AND schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.bills';
    END LOOP;
END $$;

-- Recreate ONLY the correct policies for orders
CREATE POLICY "customers_view_own_orders"
ON public.orders FOR SELECT
TO authenticated
USING (customer_id = auth.uid());

CREATE POLICY "admins_ca_view_all_orders"
ON public.orders FOR SELECT
TO authenticated
USING (public.is_admin_or_ca(auth.uid()));

CREATE POLICY "customers_create_own_orders"
ON public.orders FOR INSERT
TO authenticated
WITH CHECK (customer_id = auth.uid());

CREATE POLICY "admins_update_orders"
ON public.orders FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "admins_delete_orders"
ON public.orders FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Recreate ONLY the correct policies for bills
CREATE POLICY "customers_view_own_bills"
ON public.bills FOR SELECT
TO authenticated
USING (customer_id = auth.uid());

CREATE POLICY "admins_ca_view_all_bills"
ON public.bills FOR SELECT
TO authenticated
USING (public.is_admin_or_ca(auth.uid()));

CREATE POLICY "customers_create_own_bills"
ON public.bills FOR INSERT
TO authenticated
WITH CHECK (customer_id = auth.uid());

CREATE POLICY "admins_create_bills"
ON public.bills FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "admins_update_bills"
ON public.bills FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "admins_delete_bills"
ON public.bills FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
