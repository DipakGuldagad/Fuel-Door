-- ============================================================================
-- Payment Verification System Migration
-- ============================================================================
-- This migration adds payment verification columns to the orders table
-- to support manual UPI payment verification with UTR and screenshot uploads
--
-- Run this in your Supabase SQL Editor
-- ============================================================================

-- Add payment verification columns to orders table
DO $$ 
BEGIN
    -- Add UTR number column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'orders' AND column_name = 'utr_number') THEN
        ALTER TABLE public.orders ADD COLUMN utr_number TEXT;
        RAISE NOTICE 'Added utr_number column to orders table';
    ELSE
        RAISE NOTICE 'utr_number column already exists in orders table';
    END IF;

    -- Add payment screenshot URL column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'orders' AND column_name = 'payment_screenshot_url') THEN
        ALTER TABLE public.orders ADD COLUMN payment_screenshot_url TEXT;
        RAISE NOTICE 'Added payment_screenshot_url column to orders table';
    ELSE
        RAISE NOTICE 'payment_screenshot_url column already exists in orders table';
    END IF;

    -- Add payment status column with default 'Pending'
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'orders' AND column_name = 'payment_status') THEN
        ALTER TABLE public.orders ADD COLUMN payment_status TEXT DEFAULT 'Pending';
        RAISE NOTICE 'Added payment_status column to orders table';
    ELSE
        RAISE NOTICE 'payment_status column already exists in orders table';
    END IF;

    -- Add payment submitted timestamp
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'orders' AND column_name = 'payment_submitted_at') THEN
        ALTER TABLE public.orders ADD COLUMN payment_submitted_at TIMESTAMPTZ;
        RAISE NOTICE 'Added payment_submitted_at column to orders table';
    ELSE
        RAISE NOTICE 'payment_submitted_at column already exists in orders table';
    END IF;

    -- Add payment verified by (pump user ID)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'orders' AND column_name = 'payment_verified_by') THEN
        ALTER TABLE public.orders ADD COLUMN payment_verified_by TEXT;
        RAISE NOTICE 'Added payment_verified_by column to orders table';
    ELSE
        RAISE NOTICE 'payment_verified_by column already exists in orders table';
    END IF;

    -- Add payment verified timestamp
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'orders' AND column_name = 'payment_verified_at') THEN
        ALTER TABLE public.orders ADD COLUMN payment_verified_at TIMESTAMPTZ;
        RAISE NOTICE 'Added payment_verified_at column to orders table';
    ELSE
        RAISE NOTICE 'payment_verified_at column already exists in orders table';
    END IF;

END $$;

-- Update existing orders to have 'Pending' payment status if NULL
UPDATE public.orders 
SET payment_status = 'Pending' 
WHERE payment_status IS NULL;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON public.orders (payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_submitted_at ON public.orders (payment_submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_utr_number ON public.orders (utr_number);

-- Add constraint to ensure valid payment statuses
DO $$ 
BEGIN
    -- Drop existing constraint if it exists
    IF EXISTS (SELECT 1 FROM information_schema.check_constraints 
               WHERE constraint_name = 'orders_payment_status_check') THEN
        ALTER TABLE public.orders DROP CONSTRAINT orders_payment_status_check;
        RAISE NOTICE 'Dropped existing payment_status constraint';
    END IF;
    
    -- Add new constraint
    ALTER TABLE public.orders ADD CONSTRAINT orders_payment_status_check 
        CHECK (payment_status IN ('Pending', 'Verification Pending', 'Paid', 'Rejected'));
    RAISE NOTICE 'Added payment_status constraint';
END $$;

-- Display final structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public'
  AND table_name = 'orders'
  AND column_name IN (
      'utr_number', 
      'payment_screenshot_url', 
      'payment_status', 
      'payment_submitted_at', 
      'payment_verified_by', 
      'payment_verified_at'
  )
ORDER BY ordinal_position;

-- ============================================================================
-- IMPORTANT: Manual Step Required
-- ============================================================================
-- After running this migration, you MUST create a Supabase Storage bucket:
-- 
-- 1. Go to Supabase Dashboard → Storage
-- 2. Click "New Bucket"
-- 3. Name: payment-screenshots
-- 4. Set to PRIVATE (not public)
-- 5. Click "Create Bucket"
--
-- Optional: Configure RLS policies for the bucket if needed
-- ============================================================================

RAISE NOTICE 'Payment verification migration completed successfully!';
RAISE NOTICE 'REMINDER: Create storage bucket "payment-screenshots" in Supabase Dashboard';
