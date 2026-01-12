-- ⚠️ DANGER: This script will DELETE ALL DATA except Admin & CA accounts!
-- This prepares the database for a new organization by removing all operational data
-- while preserving only admin/CA accounts.
--
-- WHAT THIS SCRIPT DOES:
-- ✅ Keeps: Admin user accounts
-- ✅ Keeps: CA (Chartered Accountant) user accounts
-- ❌ Deletes: ALL customer accounts and their data
-- ❌ Deletes: ALL products and product catalog
-- ❌ Deletes: ALL bills, invoices, payment history
-- ❌ Deletes: ALL orders and order items
-- ❌ Deletes: ALL payments and payment requests
-- ❌ Deletes: ALL coupons and discounts
-- ❌ Deletes: ALL sample requests, payment reminders
-- ❌ Deletes: ALL stock history
--
-- RESULT: Only admin and CA accounts remain. Start fresh with no data.
--
-- HOW TO USE:
-- 1. Go to Supabase Dashboard → SQL Editor
-- 2. Copy and paste this entire script
-- 3. Review carefully
-- 4. Click "Run" to execute
--
-- WARNING: THIS CANNOT BE UNDONE!

BEGIN;

-- IMPORTANT: First, protect admin and CA users by getting their IDs
-- We'll use these to ensure they're never deleted

-- Step 0: Identify admin and CA users to PROTECT
-- Save their user IDs in a temporary variable
CREATE TEMPORARY TABLE protected_users AS
SELECT DISTINCT p.user_id 
FROM public.profiles p
INNER JOIN public.user_roles ur ON p.user_id = ur.user_id
WHERE ur.role IN ('admin', 'ca');

-- Step 1: Delete all customer transaction data
-- These will cascade delete due to foreign key constraints

-- Delete payment requests
DELETE FROM public.payment_requests 
WHERE customer_id IN (
  SELECT user_id FROM public.user_roles 
  WHERE role = 'customer'
);

-- Delete payment reminders
DELETE FROM public.payment_reminders 
WHERE customer_id IN (
  SELECT user_id FROM public.user_roles 
  WHERE role = 'customer'
);

-- Delete payments
DELETE FROM public.payments 
WHERE customer_id IN (
  SELECT user_id FROM public.user_roles 
  WHERE role = 'customer'
);

-- Delete bills
DELETE FROM public.bills 
WHERE customer_id IN (
  SELECT user_id FROM public.user_roles 
  WHERE role = 'customer'
);

-- Delete order items (must delete before orders)
DELETE FROM public.order_items 
WHERE order_id IN (
  SELECT id FROM public.orders 
  WHERE customer_id IN (
    SELECT user_id FROM public.user_roles 
    WHERE role = 'customer'
  )
);

-- Delete orders
DELETE FROM public.orders 
WHERE customer_id IN (
  SELECT user_id FROM public.user_roles 
  WHERE role = 'customer'
);

-- Delete sample requests
DELETE FROM public.sample_requests 
WHERE customer_id IN (
  SELECT user_id FROM public.user_roles 
  WHERE role = 'customer'
);

-- Step 2: Delete ALL products, coupons, and inventory
DELETE FROM public.coupons;

DELETE FROM public.stock_history;

DELETE FROM public.products;

-- Step 3: Delete customer profiles (ONLY customers, not admin/CA)
DELETE FROM public.profiles 
WHERE user_id IN (
  SELECT user_id FROM public.user_roles 
  WHERE role = 'customer'
)
AND user_id NOT IN (SELECT user_id FROM protected_users);

-- Step 4: Delete customer user_roles entries
DELETE FROM public.user_roles 
WHERE role = 'customer'
AND user_id NOT IN (SELECT user_id FROM protected_users);

-- Step 5: Delete customer auth users (ONLY customers, not admin/CA)
DELETE FROM auth.users 
WHERE id IN (
  SELECT user_id FROM public.user_roles 
  WHERE role = 'customer'
)
AND id NOT IN (SELECT user_id FROM protected_users);

-- Step 5: Verify what's left
-- This will show you the remaining accounts (should only be admin and CA)
DO $$
DECLARE
  admin_count INT;
  ca_count INT;
  customer_count INT;
  total_remaining INT;
  products_count INT;
  bills_count INT;
  orders_count INT;
  payments_count INT;
  stock_6: Final verification
BEGIN
  SELECT COUNT(*) INTO admin_count FROM public.user_roles WHERE role = 'admin';
  SELECT COUNT(*) INTO ca_count FROM public.user_roles WHERE role = 'ca';
  SELECT COUNT(*) INTO customer_count FROM public.user_roles WHERE role = 'customer';
  SELECT COUNT(*) INTO total_remaining FROM public.profiles;
  SELECT COUNT(*) INTO products_count FROM public.products;
  SELECT COUNT(*) INTO bills_count FROM public.bills;
  SELECT COUNT(*) INTO orders_count FROM public.orders;
  SELECT COUNT(*) INTO payments_count FROM public.payments;
  SELECT COUNT(*) INTO stock_history_count FROM public.stock_history;
  SELECT COUNT(*) INTO coupons_count FROM public.coupons;
  
  RAISE NOTICE '=== COMPLETE CLEANUP DONE ===';
  RAISE NOTICE 'Remaining Admin accounts: % (PROTECTED)', admin_count;
  RAISE NOTICE 'Remaining CA accounts: % (PROTECTED)', ca_count;
  RAISE NOTICE 'Remaining Customer accounts: % (should be 0)', customer_count;
  RAISE NOTICE 'Total remaining profiles: % (should be admin + ca)', total_remaining;
  RAISE NOTICE '--- DELETED DATA ---';
  RAISE NOTICE 'Products deleted: (now 0, was ≥ %)', products_count;
  RAISE NOTICE 'Coupons deleted: (now 0, was ≥ %)', coupons_count;
  RAISE NOTICE 'Stock history entries: % (should be 0)', stock_history_count;
  RAISE NOTICE 'Bills remaining: % (should be 0)', bills_count;
  RAISE NOTICE 'Orders remaining: % (should be 0)', orders_count;
  RAISE NOTICE 'Payments remaining: % (should be 0)', payments_count;
  
  IF admin_count = 0 THEN
    RAISE WARNING 'WARNING: No admin accounts found! At least 1 admin should remain.';
  END IF;
  
  IF customer_count > 0 THEN
    RAISE WARNING 'WARNING: % customer accounts still exist!', customer_count;
  END IF;
  
  IF products_count > 0 OR bills_count > 0 OR orders_count > 0 OR payments_count > 0 THEN
    RAISE WARNING 'WARNING: Some data still exists in the database!';
  END IF;
END $$;

COMMIT;

-- After running this script, you should see:
-- ✅ Admin accounts: 1 or more (PROTECTED)
-- ✅ CA accounts: 1 or more (PROTECTED)
-- ✅ Total profiles: Only admin + CA (2 or more)
-- ❌ Customer accounts: 0
-- ❌ Products: 0 (all deleted)
-- ❌ Coupons: 0 (all deleted)
-- ❌ Bills: 0 (all deleted)
-- ❌ Orders: 0 (all deleted)
-- ❌ Payments: 0 (all deleted)
-- ❌ Stock history: 0 (all deleted)
--
-- The database is now completely clean except for admin and CA accounts.
