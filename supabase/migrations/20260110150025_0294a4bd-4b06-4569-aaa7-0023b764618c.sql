-- Allow customers to view their own payment reminders
CREATE POLICY "Customers can view their own payment reminders" 
ON public.payment_reminders 
FOR SELECT 
USING (auth.uid() IN (
  SELECT user_id FROM public.profiles WHERE id = customer_id
));