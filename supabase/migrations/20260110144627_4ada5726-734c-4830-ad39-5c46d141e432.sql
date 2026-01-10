-- Add credit_limit column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS credit_limit DECIMAL(12, 2) DEFAULT 50000.00;

-- Create payment_reminders table to track sent reminders
CREATE TABLE public.payment_reminders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  bill_id UUID REFERENCES public.bills(id) ON DELETE SET NULL,
  reminder_type TEXT NOT NULL CHECK (reminder_type IN ('sms', 'whatsapp', 'email')),
  message TEXT NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  sent_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.payment_reminders ENABLE ROW LEVEL SECURITY;

-- RLS policies for payment_reminders - only admin/ca can view and create
CREATE POLICY "Admin and CA can view all reminders"
ON public.payment_reminders
FOR SELECT
USING (public.is_admin_or_ca(auth.uid()));

CREATE POLICY "Admin and CA can create reminders"
ON public.payment_reminders
FOR INSERT
WITH CHECK (public.is_admin_or_ca(auth.uid()));

-- Add index for faster queries
CREATE INDEX idx_payment_reminders_customer ON public.payment_reminders(customer_id);
CREATE INDEX idx_payment_reminders_sent_at ON public.payment_reminders(sent_at DESC);