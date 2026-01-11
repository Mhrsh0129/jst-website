-- Assign Admin and CA roles after creating users in Dashboard
-- Run this in Supabase SQL Editor after adding users via Auth → Users

DO $$
DECLARE 
  admin_id uuid;
  ca_id uuid;
BEGIN
  -- Get user IDs
  SELECT id INTO admin_id FROM auth.users WHERE email = 'admin@jst.com';
  SELECT id INTO ca_id FROM auth.users WHERE email = 'ca@jst.com';

  -- Ensure profiles exist (trigger should create these, but double-check)
  INSERT INTO public.profiles (user_id, full_name, email, business_name)
  SELECT admin_id, 'Administrator', 'admin@jst.com', 'Jay Shree Traders'
  WHERE admin_id IS NOT NULL
  ON CONFLICT (user_id) DO UPDATE SET full_name = 'Administrator';

  INSERT INTO public.profiles (user_id, full_name, email, business_name)
  SELECT ca_id, 'Chartered Accountant', 'ca@jst.com', 'Jay Shree Traders'
  WHERE ca_id IS NOT NULL
  ON CONFLICT (user_id) DO UPDATE SET full_name = 'Chartered Accountant';

  -- Remove default customer role and assign correct roles
  DELETE FROM public.user_roles WHERE user_id IN (admin_id, ca_id);

  -- Assign admin role
  INSERT INTO public.user_roles (user_id, role)
  SELECT admin_id, 'admin'::app_role
  WHERE admin_id IS NOT NULL;

  -- Assign CA role
  INSERT INTO public.user_roles (user_id, role)
  SELECT ca_id, 'ca'::app_role
  WHERE ca_id IS NOT NULL;

  -- Show results
  RAISE NOTICE 'Admin ID: %', admin_id;
  RAISE NOTICE 'CA ID: %', ca_id;
END $$;

-- Verify role assignments
SELECT 
  u.email,
  u.id as user_id,
  r.role,
  p.full_name
FROM auth.users u
LEFT JOIN public.user_roles r ON r.user_id = u.id
LEFT JOIN public.profiles p ON p.user_id = u.id
WHERE u.email IN ('admin@jst.com', 'ca@jst.com')
ORDER BY u.email;
