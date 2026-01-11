-- Allow only admins to record payments for any customer
CREATE POLICY "Admins can insert payments"
ON public.payments FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));
