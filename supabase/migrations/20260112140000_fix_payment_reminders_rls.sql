-- Ensure payment_reminders RLS is properly configured for admin access
ALTER TABLE public.payment_reminders ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'payment_reminders' AND schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.payment_reminders';
    END LOOP;
END $$;

-- Create admin-only policies for payment reminders
CREATE POLICY "admins_insert_reminders"
ON public.payment_reminders FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "admins_view_reminders"
ON public.payment_reminders FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "admins_update_reminders"
ON public.payment_reminders FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "admins_delete_reminders"
ON public.payment_reminders FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
