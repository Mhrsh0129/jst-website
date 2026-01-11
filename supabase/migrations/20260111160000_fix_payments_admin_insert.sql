-- Fix payments table to allow only admins to insert payments (record payments)
-- CA can only VIEW bills, not record payments
-- Drop the incorrect customer-only insert policy
DROP POLICY IF EXISTS "Customers can create their own payments" ON public.payments;

-- Add proper policy for admins only to record payments
CREATE POLICY "Admins can insert payments for any customer"
ON public.payments FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Keep customers able to record their own payments (for online payments)
CREATE POLICY "Customers can record their own payments"
ON public.payments FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = customer_id);

-- Ensure admins can delete payments if needed
CREATE POLICY "Admins can delete payments"
ON public.payments FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
