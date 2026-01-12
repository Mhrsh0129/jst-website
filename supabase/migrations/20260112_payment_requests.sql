-- Create payment_requests table
CREATE TABLE IF NOT EXISTS payment_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount NUMERIC(12, 2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, approved, rejected
  bills_allocated UUID[] NOT NULL, -- Array of bill IDs
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  approved_at TIMESTAMP WITH TIME ZONE,
  approved_by UUID REFERENCES auth.users(id),
  notes TEXT
);

-- Enable RLS
ALTER TABLE payment_requests ENABLE ROW LEVEL SECURITY;

-- Customers can see their own payment requests
CREATE POLICY "Customers can view own payment requests"
  ON payment_requests
  FOR SELECT
  USING (customer_id = auth.uid());

-- Only admins can update payment requests
CREATE POLICY "Only admins can approve payment requests"
  ON payment_requests
  FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid()
      AND raw_user_meta_data->>'role' = 'admin'
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid()
      AND raw_user_meta_data->>'role' = 'admin'
  ));

-- Admins can view all payment requests
CREATE POLICY "Admins can view all payment requests"
  ON payment_requests
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid()
      AND raw_user_meta_data->>'role' = 'admin'
  ));
