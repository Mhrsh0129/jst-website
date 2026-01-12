-- ⚠️ DANGER: This script will DELETE all customer data!
-- This prepares the database for a new organization by removing all customer records
-- while preserving admin/CA accounts and product catalog.
--
-- WHAT THIS SCRIPT DOES:
-- ✅ Keeps: Admin and CA user accounts
-- ✅ Keeps: Product catalog (products and coupons only)
-- ❌ Deletes: All customer accounts and their data
-- ❌ Deletes: All bills, payments, orders, payment requests
-- ❌ Deletes: All sample requests, payment reminders
-- ❌ Deletes: Stock history (so new org can add their own stock data)
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

-- Step 1: Delete all data from customer-related tables
-- Using a subquery to get ONLY customer user_ids
-- (These will cascade delete due to foreign key constraints)

DELETE FROM public.payment_requests 
WHERE customer_id IN (
  SELECT user_id FROM public.user_roles 
  WHERE role = 'customer'
);

DELETE FROM public.payment_reminders 
WHERE customer_id IN (
  SELECT user_id FROM public.user_roles 
  WHERE role = 'customer'
);

DELETE FROM public.payments 
WHERE customer_id IN (
  SELECT user_id FROM public.user_roles 
  WHERE role = 'customer'
);

DELETE FROM public.bills 
WHERE customer_id IN (
  SELECT user_id FROM public.user_roles 
  WHERE role = 'customer'
);

DELETE FROM public.order_items 
WHERE order_id IN (
  SELECT id FROM public.orders 
  WHERE customer_id IN (
    SELECT user_id FROM public.user_roles 
    WHERE role = 'customer'
  )
);

DELETE FROM public.orders 
WHERE customer_id IN (
  SELECT user_id FROM public.user_roles 
  WHERE role = 'customer'
);

DELETE FROM public.sample_requests 
WHERE customer_id IN (
  SELECT user_id FROM public.user_roles 
  WHERE role = 'customer'
);

DELETE FROM public.stock_history;

-- Step 2: Delete customer profiles (ONLY customers, not admin/CA)
DELETE FROM public.profiles 
WHERE user_id IN (
  SELECT user_id FROM public.user_roles 
  WHERE role = 'customer'
)
AND user_id NOT IN (SELECT user_id FROM protected_users);

-- Step 3: Delete customer user_roles entries
DELETE FROM public.user_roles 
WHERE role = 'customer'
AND user_id NOT IN (SELECT user_id FROM protected_users);

-- Step 4: Delete customer auth users (ONLY customers, not admin/CA)
-- This removes customer accounts from Supabase Auth
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
  stock_history_count INT;
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
  
  RAISE NOTICE '=== CLEANUP COMPLETE ===';
  RAISE NOTICE 'Remaining Admin accounts: %', admin_count;
  RAISE NOTICE 'Remaining CA accounts: %', ca_count;
  RAISE NOTICE 'Remaining Customer accounts: % (should be 0)', customer_count;
  RAISE NOTICE 'Total remaining profiles: %', total_remaining;
  RAISE NOTICE 'Products in catalog: %', products_count;
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
  
  IF bills_count > 0 OR orders_count > 0 OR payments_count > 0 THEN
    RAISE WARNING 'WARNING: Customer data still exists in the database!';
  END IF;
END $$;

COMMIT;

-- After running this script, you should see:
-- ✅ Admin accounts: 1 or more (PROTECTED)
-- ✅ CA accounts: 1 or more (PROTECTED)
-- ✅ Customer accounts: 0
-- ✅ Products: Your existing product catalog
-- ✅ Bills, Orders, Payments: All should be 0
