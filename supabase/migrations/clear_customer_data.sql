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

-- Step 1: Delete all data from customer-related tables
-- (These will cascade delete due to foreign key constraints)

-- Delete payment requests (if table exists)
DELETE FROM public.payment_requests 
WHERE customer_id IN (
  SELECT user_id FROM public.profiles 
  WHERE id IN (
    SELECT id FROM public.profiles p
    LEFT JOIN public.user_roles ur ON p.user_id = ur.user_id
    WHERE ur.role = 'customer' OR ur.role IS NULL
  )
);

-- Delete payment reminders
DELETE FROM public.payment_reminders 
WHERE customer_id IN (
  SELECT user_id FROM public.profiles 
  WHERE id IN (
    SELECT id FROM public.profiles p
    LEFT JOIN public.user_roles ur ON p.user_id = ur.user_id
    WHERE ur.role = 'customer' OR ur.role IS NULL
  )
);

-- Delete payments (will also remove child records)
DELETE FROM public.payments 
WHERE customer_id IN (
  SELECT user_id FROM public.profiles 
  WHERE id IN (
    SELECT id FROM public.profiles p
    LEFT JOIN public.user_roles ur ON p.user_id = ur.user_id
    WHERE ur.role = 'customer' OR ur.role IS NULL
  )
);

-- Delete bills (will cascade to payments if any remain)
DELETE FROM public.bills 
WHERE customer_id IN (
  SELECT user_id FROM public.profiles 
  WHERE id IN (
    SELECT id FROM public.profiles p
    LEFT JOIN public.user_roles ur ON p.user_id = ur.user_id
    WHERE ur.role = 'customer' OR ur.role IS NULL
  )
);

-- Delete order items (must delete before orders)
DELETE FROM public.order_items 
WHERE order_id IN (
  SELECT id FROM public.orders 
  WHERE customer_id IN (
    SELECT user_id FROM public.profiles 
    WHERE id IN (
      SELECT id FROM public.profiles p
      LEFT JOIN public.user_roles ur ON p.user_id = ur.user_id
      WHERE ur.role = 'customer' OR ur.role IS NULL
    )
  )
);

-- Delete orders
DELETE FROM public.orders 
WHERE customer_id IN (
  SELECT user_id FROM public.profiles 
  WHERE id IN (
    SELECT id FROM public.profiles p
    LEFT JOIN public.user_roles ur ON p.user_id = ur.user_id
    WHERE ur.role = 'customer' OR ur.role IS NULL
  )
);

-- Delete sample requests
DELETE FROM public.sample_requests 
WHERE customer_id IN (
  SELECT user_id FROM public.profiles 
  WHERE id IN (
    SELECT id FROM public.profiles p
    LEFT JOIN public.user_roles ur ON p.user_id = ur.user_id
    WHERE ur.role = 'customer' OR ur.role IS NULL
  )
);

-- Delete stock history (if table exists)
-- This allows the new organization to add their own stock data
DELETE FROM public.stock_history;

-- Step 2: Delete customer profiles (but keep admin and CA)
DELETE FROM public.profiles 
WHERE user_id IN (
  SELECT p.user_id FROM public.profiles p
  LEFT JOIN public.user_roles ur ON p.user_id = ur.user_id
  WHERE ur.role = 'customer' OR ur.role IS NULL
);

-- Step 3: Delete customer user_roles entries
DELETE FROM public.user_roles 
WHERE role = 'customer';

-- Step 4: Delete customer auth users (this will cascade delete anything remaining)
-- Note: This removes the actual user accounts from Supabase Auth
DELETE FROM auth.users 
WHERE id NOT IN (
  SELECT user_id FROM public.user_roles 
  WHERE role IN ('admin', 'ca')
);

-- Step 5: Verify what's left
-- This will show you the remaining accounts (should only be admin and CA)
DO $$
DECLARE
  admin_count INT;
  ca_count INT;
  customer_count INT;
  products_count INT;
  bills_count INT;
  orders_count INT;
  payments_count INT;
  stock_history_count INT;
BEGIN
  SELECT COUNT(*) INTO admin_count FROM public.user_roles WHERE role = 'admin';
  SELECT COUNT(*) INTO ca_count FROM public.user_roles WHERE role = 'ca';
  SELECT COUNT(*) INTO customer_count FROM public.user_roles WHERE role = 'customer';
  SELECT COUNT(*) INTO products_count FROM public.products;
  SELECT COUNT(*) INTO bills_count FROM public.bills;
  SELECT COUNT(*) INTO orders_count FROM public.orders;
  SELECT COUNT(*) INTO payments_count FROM public.payments;
  SELECT COUNT(*) INTO stock_history_count FROM public.stock_history;
  
  RAISE NOTICE '=== CLEANUP COMPLETE ===';
  RAISE NOTICE 'Remaining Admin accounts: %', admin_count;
  RAISE NOTICE 'Remaining CA accounts: %', ca_count;
  RAISE NOTICE 'Remaining Customer accounts: % (should be 0)', customer_count;
  RAISE NOTICE 'Products in catalog: %', products_count;
  RAISE NOTICE 'Stock history entries: % (should be 0)', stock_history_count;
  RAISE NOTICE 'Bills remaining: % (should be 0)', bills_count;
  RAISE NOTICE 'Orders remaining: % (should be 0)', orders_count;
  RAISE NOTICE 'Payments remaining: % (should be 0)', payments_count;
  
  IF customer_count > 0 THEN
    RAISE WARNING 'WARNING: % customer accounts still exist!', customer_count;
  END IF;
  
  IF bills_count > 0 OR orders_count > 0 OR payments_count > 0 THEN
    RAISE WARNING 'WARNING: Customer data still exists in the database!';
  END IF;
END $$;

COMMIT;

-- After running this script, you should see:
-- ✅ Admin accounts: 1 or more
-- ✅ CA accounts: 0 or more
-- ✅ Customer accounts: 0
-- ✅ Products: Your existing product catalog
-- ✅ Bills, Orders, Payments: All should be 0
