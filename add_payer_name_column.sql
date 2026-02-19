-- Add payer_name column to orders table
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payer_name TEXT;

-- Update RLS policies (if needed, though existing anon policies should cover it)
-- This is just to ensure the column is available for the anon role
COMMENT ON COLUMN public.orders.payer_name IS 'Name of the person who actually made the payment (if different from customer)';

RAISE NOTICE 'Added payer_name column to orders table successfully';
