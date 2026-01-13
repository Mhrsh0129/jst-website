-- Fix: Hardening RLS for Coupons and Payment Requests
-- This fixes the 403 Forbidden error for Coupons and missing approvals for Admins

-- 1. FIX COUPONS POLICIES
DROP POLICY IF EXISTS "admins_create_coupons" ON public.coupons;

DROP POLICY IF EXISTS "admins_view_coupons" ON public.coupons;

DROP POLICY IF EXISTS "admins_update_coupons" ON public.coupons;

DROP POLICY IF EXISTS "admins_delete_coupons" ON public.coupons;

CREATE POLICY "coupons_insert_policy" ON public.coupons FOR
INSERT
    TO authenticated
WITH
    CHECK (
        public.has_role (
            (
                SELECT auth.uid ()
            ),
            'admin'
        )
    );

CREATE POLICY "coupons_select_policy" ON public.coupons FOR
SELECT TO authenticated USING (
        public.has_role (
            (
                SELECT auth.uid ()
            ), 'admin'
        )
        OR is_active
    );

CREATE POLICY "coupons_update_policy" ON public.coupons FOR
UPDATE TO authenticated USING (
    public.has_role (
        (
            SELECT auth.uid ()
        ),
        'admin'
    )
);

CREATE POLICY "coupons_delete_policy" ON public.coupons FOR DELETE TO authenticated USING (
    public.has_role (
        (
            SELECT auth.uid ()
        ),
        'admin'
    )
);

-- 2. FIX PAYMENT REQUESTS POLICIES (Was using wrong role check)
DROP POLICY IF EXISTS "Customers can view own payment requests" ON public.payment_requests;

DROP POLICY IF EXISTS "Only admins can approve payment requests" ON public.payment_requests;

DROP POLICY IF EXISTS "Admins can view all payment requests" ON public.payment_requests;

CREATE POLICY "payment_req_select_policy" ON public.payment_requests FOR
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

CREATE POLICY "payment_req_insert_policy" ON public.payment_requests FOR
INSERT
    TO authenticated
WITH
    CHECK (
        customer_id = (
            SELECT auth.uid ()
        )
    );

CREATE POLICY "payment_req_update_policy" ON public.payment_requests FOR
UPDATE TO authenticated USING (
    public.has_role (
        (
            SELECT auth.uid ()
        ),
        'admin'
    )
);

-- 3. ENSURE PRODUCTS TABLE IS FULLY OPTIMIZED
-- (Already handled, but double check if any permissive policies were left)
DROP POLICY IF EXISTS "Admins can update products" ON public.products;

DROP POLICY IF EXISTS "Admins can insert products" ON public.products;

DROP POLICY IF EXISTS "Admins can delete products" ON public.products;

CREATE POLICY "products_admin_all" ON public.products FOR ALL TO authenticated USING (
    public.has_role (
        (
            SELECT auth.uid ()
        ),
        'admin'
    )
);