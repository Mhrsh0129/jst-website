-- Database Performance Optimization Migration
-- Created: 2026-01-13
-- Focus: Missing Indexes, RLS Policy Efficiency, and Query Performance

-- 0. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 1. PROFILE OPTIMIZATIONS
-- Index user_id for fast profile lookups (Crucial for auth/signup/metadata)
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles (user_id);
-- Index business_name for search/autocomplete in Admin dashboard
CREATE INDEX IF NOT EXISTS idx_profiles_business_name ON public.profiles USING gin (business_name gin_trgm_ops)
WHERE
    business_name IS NOT NULL;

-- 2. ORDER OPTIMIZATIONS
-- Index customer_id for fast "My Orders" view
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON public.orders (customer_id);
-- Index status for Admin dashboard filtering
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders (status);
-- Index order_number for global search
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON public.orders (order_number);

-- 3. BILLING & PAYMENTS OPTIMIZATIONS
-- Index bill_id and customer_id in payments for ledger views
CREATE INDEX IF NOT EXISTS idx_payments_bill_id ON public.payments (bill_id);

CREATE INDEX IF NOT EXISTS idx_payments_customer_id ON public.payments (customer_id);
-- Index bills for customer lookup and status
CREATE INDEX IF NOT EXISTS idx_bills_customer_id ON public.bills (customer_id);

CREATE INDEX IF NOT EXISTS idx_bills_status ON public.bills (status);

-- 4. ORDER ITEMS (The most queried table for details)
-- Explicit index for order_id to make order detail views instant
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items (order_id);

-- 5. ANALYTICS OPTIMIZATIONS (BRIN indexes for time-series data)
-- BRIN indexes are extremely small and make "Date Range" queries very fast on large tables
CREATE INDEX IF NOT EXISTS idx_orders_created_at_brin ON public.orders USING BRIN (created_at);

CREATE INDEX IF NOT EXISTS idx_payments_created_at_brin ON public.payments USING BRIN (created_at);

CREATE INDEX IF NOT EXISTS idx_bills_created_at_brin ON public.bills USING BRIN (created_at);

-- 6. RLS POLICY EFFICIENCY UPGRADES
-- Using (auth.uid()) in parentheses tells Postgres the value is STABLE for the duration of the scan

-- Profiles
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

CREATE POLICY "Users can view their own profile" ON public.profiles FOR
SELECT TO authenticated USING ((auth.uid ()) = user_id);

-- Orders
DROP POLICY IF EXISTS "Customers can view their own orders" ON public.orders;

CREATE POLICY "Customers can view their own orders" ON public.orders FOR
SELECT TO authenticated USING ((auth.uid ()) = customer_id);

-- Bills
DROP POLICY IF EXISTS "Customers can view their own bills" ON public.bills;

CREATE POLICY "Customers can view their own bills" ON public.bills FOR
SELECT TO authenticated USING ((auth.uid ()) = customer_id);

-- Order Items (Optimized for speed)
DROP POLICY IF EXISTS "Customers can view their own order items" ON public.order_items;

CREATE POLICY "Customers can view their own order items" ON public.order_items FOR
SELECT TO authenticated USING (
        EXISTS (
            SELECT 1
            FROM public.orders
            WHERE
                orders.id = order_items.order_id
                AND orders.customer_id = (auth.uid ())
        )
    );

-- 7. CLEANUP SEARCH PATHS (Security & Speed)
-- Ensure all public functions have strict search paths to avoid "Schema Scan" overhead
ALTER FUNCTION public.has_role(UUID, app_role) SET search_path = public;

ALTER FUNCTION public.is_admin_or_ca(UUID) SET search_path = public;

ALTER FUNCTION public.handle_new_user() SET search_path = public;

ALTER FUNCTION public.update_updated_at_column() SET search_path = public;