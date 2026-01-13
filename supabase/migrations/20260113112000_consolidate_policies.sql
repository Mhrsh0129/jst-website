-- Clean-up Migration: Remove redundant policies and indexes identified by Supabase Linter
-- Targeted at specific names: "Optimized ..." and duplicate indexes

-- 1. Drop specific redundant policy names
DROP POLICY IF EXISTS "Optimized Profiles SELECT" ON public.profiles;

DROP POLICY IF EXISTS "profiles_poly_select" ON public.profiles;

DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

DROP POLICY IF EXISTS "Admins and CA can view all profiles" ON public.profiles;

DROP POLICY IF EXISTS "Optimized Orders SELECT" ON public.orders;

DROP POLICY IF EXISTS "orders_poly_select" ON public.orders;

DROP POLICY IF EXISTS "Customers can view their own orders" ON public.orders;

DROP POLICY IF EXISTS "Admins and CA can view all orders" ON public.orders;

DROP POLICY IF EXISTS "Optimized Bills SELECT" ON public.bills;

DROP POLICY IF EXISTS "bills_poly_select" ON public.bills;

DROP POLICY IF EXISTS "Customers can view their own bills" ON public.bills;

DROP POLICY IF EXISTS "Admins and CA can view all bills" ON public.bills;

DROP POLICY IF EXISTS "Optimized Order Items SELECT" ON public.order_items;

DROP POLICY IF EXISTS "order_items_poly_select" ON public.order_items;

DROP POLICY IF EXISTS "Customers can view their own order_items" ON public.order_items;

DROP POLICY IF EXISTS "Admins and CA can view all order_items" ON public.order_items;

DROP POLICY IF EXISTS "Optimized Payments SELECT" ON public.payments;

DROP POLICY IF EXISTS "payments_poly_select" ON public.payments;

DROP POLICY IF EXISTS "Customers can view their own payments" ON public.payments;

DROP POLICY IF EXISTS "Admins and CA can view all payments" ON public.payments;

DROP POLICY IF EXISTS "Admins can view all payments" ON public.payments;

-- 2. Create the Final Consolidated Policies (Optimized & Permission-Aware)
CREATE POLICY "final_profiles_select" ON public.profiles FOR
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

CREATE POLICY "final_orders_select" ON public.orders FOR
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

CREATE POLICY "final_bills_select" ON public.bills FOR
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

CREATE POLICY "final_payments_select" ON public.payments FOR
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

CREATE POLICY "final_order_items_select" ON public.order_items FOR
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

-- 3. Duplicate Index Cleanup
DROP INDEX IF EXISTS public.idx_pay_bill_speed;

DROP INDEX IF EXISTS public.idx_payments_customer_id;

CREATE INDEX IF NOT EXISTS idx_payments_customer_bill ON public.payments (customer_id, bill_id);