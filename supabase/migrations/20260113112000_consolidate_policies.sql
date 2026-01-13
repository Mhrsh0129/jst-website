-- Mega-Optimization: Policy Consolidation & RLS Performance (Final Refined)
-- Target: Consolidate multiple permissive policies into single optimized policies
-- Target: Prevent row-by-row re-evaluation of auth.uid()
-- Target: Enforce strict role access (CA ONLY sees bills)

-- 1. PROFILES (Exclude CA)
DROP POLICY IF EXISTS "profiles_poly_select" ON public.profiles;

DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

DROP POLICY IF EXISTS "Admins and CA can view all profiles" ON public.profiles;

CREATE POLICY "profiles_poly_select" ON public.profiles FOR
SELECT TO authenticated USING (
        user_id = (
            SELECT auth.uid ()
        )
        OR public.has_role (
            (
                SELECT auth.uid ()
            ), 'admin'
        )
    );

-- 2. ORDERS (Exclude CA)
DROP POLICY IF EXISTS "orders_poly_select" ON public.orders;

DROP POLICY IF EXISTS "Customers can view their own orders" ON public.orders;

DROP POLICY IF EXISTS "Admins and CA can view all orders" ON public.orders;

CREATE POLICY "orders_poly_select" ON public.orders FOR
SELECT TO authenticated USING (
        customer_id = (
            SELECT auth.uid ()
        )
        OR public.has_role (
            (
                SELECT auth.uid ()
            ), 'admin'
        )
    );

-- 3. BILLS (Admin and CA can see all)
DROP POLICY IF EXISTS "bills_poly_select" ON public.bills;

DROP POLICY IF EXISTS "Customers can view their own bills" ON public.bills;

DROP POLICY IF EXISTS "Admins and CA can view all bills" ON public.bills;

CREATE POLICY "bills_poly_select" ON public.bills FOR
SELECT TO authenticated USING (
        customer_id = (
            SELECT auth.uid ()
        )
        OR public.is_admin_or_ca (
            (
                SELECT auth.uid ()
            )
        )
    );

-- 4. ORDER ITEMS (Exclude CA)
DROP POLICY IF EXISTS "order_items_poly_select" ON public.order_items;

DROP POLICY IF EXISTS "Customers can view their own order items" ON public.order_items;

DROP POLICY IF EXISTS "Admins and CA can view all order items" ON public.order_items;

CREATE POLICY "order_items_poly_select" ON public.order_items FOR
SELECT TO authenticated USING (
        public.has_role (
            (
                SELECT auth.uid ()
            ), 'admin'
        )
        OR EXISTS (
            SELECT 1
            FROM public.orders
            WHERE
                orders.id = order_items.order_id
                AND orders.customer_id = (
                    SELECT auth.uid ()
                )
        )
    );

-- 5. PAYMENTS (Exclude CA)
DROP POLICY IF EXISTS "payments_poly_select" ON public.payments;

DROP POLICY IF EXISTS "Customers can view their own payments" ON public.payments;

DROP POLICY IF EXISTS "Admins can view all payments" ON public.payments;

DROP POLICY IF EXISTS "Admins and CA can view all payments" ON public.payments;

CREATE POLICY "payments_poly_select" ON public.payments FOR
SELECT TO authenticated USING (
        customer_id = (
            SELECT auth.uid ()
        )
        OR public.has_role (
            (
                SELECT auth.uid ()
            ), 'admin'
        )
    );

-- 6. DUPLICATE INDEX CLEANUP
DROP INDEX IF EXISTS public.idx_payments_customer_id;

CREATE INDEX IF NOT EXISTS idx_payments_customer_bill ON public.payments (customer_id, bill_id);