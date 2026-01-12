-- Create payment_reminders table
CREATE TABLE IF NOT EXISTS public.payment_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reminder_type TEXT NOT NULL,
  message TEXT NOT NULL,
  sent_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.payment_reminders ENABLE ROW LEVEL SECURITY;

-- Create admin-only policies
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

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_payment_reminders_customer ON public.payment_reminders(customer_id);
CREATE INDEX IF NOT EXISTS idx_payment_reminders_sent_at ON public.payment_reminders(sent_at DESC);
