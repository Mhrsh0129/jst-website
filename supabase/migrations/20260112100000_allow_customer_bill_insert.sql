-- Allow customers to insert bills for their own orders
CREATE POLICY "Customers can create their own bills"
ON public.bills
FOR INSERT
TO authenticated
WITH CHECK (
  customer_id = auth.uid()
);
