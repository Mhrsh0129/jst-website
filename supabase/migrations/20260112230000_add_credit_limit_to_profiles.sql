-- Add credit_limit column to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS credit_limit DECIMAL(12, 2) DEFAULT 50000.00;

-- Update existing profiles to have default credit limit if null
UPDATE public.profiles
SET
    credit_limit = 50000.00
WHERE
    credit_limit IS NULL;