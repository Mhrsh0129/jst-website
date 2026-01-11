-- Add DELETE policy for admins on profiles table
-- This allows admins to delete customer profiles

CREATE POLICY "Admins can delete profiles"
ON public.profiles FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
