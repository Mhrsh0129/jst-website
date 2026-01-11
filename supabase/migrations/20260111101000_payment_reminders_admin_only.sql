-- Payment Reminders: Admin only (not CA)
DROP POLICY IF EXISTS "Admin and CA can create reminders" ON public.payment_reminders;
DROP POLICY IF EXISTS "Admin and CA can view all reminders" ON public.payment_reminders;

CREATE POLICY "Admins can create reminders"
ON public.payment_reminders FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can view all reminders"
ON public.payment_reminders FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
