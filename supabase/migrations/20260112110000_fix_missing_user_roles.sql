-- Check which users don't have a role and assign customer role to them
INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'customer'
FROM auth.users u
LEFT JOIN public.user_roles ur ON u.id = ur.user_id
WHERE ur.user_id IS NULL;

-- Verify all users now have roles
SELECT 
  u.id,
  u.email,
  ur.role
FROM auth.users u
LEFT JOIN public.user_roles ur ON u.id = ur.user_id
ORDER BY u.created_at DESC;
