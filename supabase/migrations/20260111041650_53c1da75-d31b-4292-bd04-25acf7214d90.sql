-- Fix 1: Strengthen payment_reminders RLS policy
-- Drop the existing customer policy and recreate with direct user_id comparison
DROP POLICY IF EXISTS "Customers can view their own payment reminders" ON public.payment_reminders;

-- Create a more secure policy using a direct join approach
CREATE POLICY "Customers can view their own payment reminders" 
ON public.payment_reminders 
FOR SELECT 
USING (
  customer_id IN (
    SELECT id FROM public.profiles WHERE user_id = auth.uid()
  )
);

-- Fix 2: Add customer_id column to order_items for direct access control
ALTER TABLE public.order_items 
ADD COLUMN IF NOT EXISTS customer_id UUID;

-- Populate customer_id from orders table
UPDATE public.order_items oi
SET customer_id = o.customer_id
FROM public.orders o
WHERE oi.order_id = o.id AND oi.customer_id IS NULL;

-- Drop existing order_items policies and recreate with direct customer_id checks
DROP POLICY IF EXISTS "Customers can view their own order items" ON public.order_items;
DROP POLICY IF EXISTS "Customers can insert their own order items" ON public.order_items;
DROP POLICY IF EXISTS "Admins and CA can view all order items" ON public.order_items;

-- Recreate with direct customer_id comparison
CREATE POLICY "Customers can view their own order items" 
ON public.order_items 
FOR SELECT 
USING (auth.uid() = customer_id);

CREATE POLICY "Customers can insert their own order items" 
ON public.order_items 
FOR INSERT 
WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "Admins and CA can view all order items" 
ON public.order_items 
FOR SELECT 
USING (is_admin_or_ca(auth.uid()));

-- Create trigger to auto-populate customer_id on insert
CREATE OR REPLACE FUNCTION public.set_order_item_customer_id()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  SELECT customer_id INTO NEW.customer_id
  FROM public.orders
  WHERE id = NEW.order_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_order_item_customer_id_trigger ON public.order_items;

CREATE TRIGGER set_order_item_customer_id_trigger
BEFORE INSERT ON public.order_items
FOR EACH ROW
EXECUTE FUNCTION public.set_order_item_customer_id();