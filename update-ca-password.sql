-- Update CA user password to ca12345
-- This updates the existing ca@jst.com user password

-- First, check if user exists
SELECT id, email FROM auth.users WHERE email = 'ca@jst.com';

-- If user exists, delete and recreate with new password (Edge Function will handle this)
-- Or you can manually update via Supabase Dashboard -> Authentication -> Users -> ca@jst.com -> Reset Password
