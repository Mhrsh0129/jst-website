-- Allow admins to update any profile
CREATE POLICY "Admins can update any profile"
ON public.profiles
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to delete profiles (with CASCADE this will clean up related data)
CREATE POLICY "Admins can delete profiles"
ON public.profiles
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to create profiles for new customers
CREATE POLICY "Admins can create profiles"
ON public.profiles
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to update any bill (amounts, status, etc.)
CREATE POLICY "Admins can update any bill"
ON public.bills
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to delete bills
CREATE POLICY "Admins can delete bills"
ON public.bills
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to delete payments
CREATE POLICY "Admins can delete payments"
ON public.payments
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));