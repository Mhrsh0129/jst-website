-- Drop all existing tables (excluding Supabase system tables)
DROP TABLE IF EXISTS public.sample_requests CASCADE;
DROP TABLE IF EXISTS public.payment_reminders CASCADE;
DROP TABLE IF EXISTS public.payments CASCADE;
DROP TABLE IF EXISTS public.bills CASCADE;
DROP TABLE IF EXISTS public.order_items CASCADE;
DROP TABLE IF EXISTS public.orders CASCADE;
DROP TABLE IF EXISTS public.products CASCADE;
DROP TABLE IF EXISTS public.user_roles CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TYPE IF EXISTS public.app_role CASCADE;

-- Now all tables are dropped
-- Migrations will recreate them when you run: npx supabase db push
