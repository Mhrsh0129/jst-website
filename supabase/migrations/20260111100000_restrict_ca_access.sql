-- Restrict CA access - only admin can view/manage most tables
-- CA can only view bills

-- Drop existing policies that allow CA access and recreate with admin-only

-- Order Items: Admin only
DROP POLICY IF EXISTS "Admins and CA can view all order items" ON public.order_items;
CREATE POLICY "Admins can view all order items"
ON public.order_items FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Orders: Admin only
DROP POLICY IF EXISTS "Admins and CA can view all orders" ON public.orders;
CREATE POLICY "Admins can view all orders"
ON public.orders FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Payments: Admin only
DROP POLICY IF EXISTS "Admins and CA can view all payments" ON public.payments;
CREATE POLICY "Admins can view all payments"
ON public.payments FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Profiles: Admin only
DROP POLICY IF EXISTS "Admins and CA can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Sample Requests: Admin only
DROP POLICY IF EXISTS "Admins and CA can view all sample requests" ON public.sample_requests;
CREATE POLICY "Admins can view all sample requests"
ON public.sample_requests FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Payment Reminders: Admin only (create and view)
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

-- Bills: Keep CA access for viewing (CA can view all bills)
-- This policy should already exist, but ensure it's correct
DROP POLICY IF EXISTS "Admins and CA can view all bills" ON public.bills;
CREATE POLICY "Admins and CA can view all bills"
ON public.bills FOR SELECT
TO authenticated
USING (public.is_admin_or_ca(auth.uid()));