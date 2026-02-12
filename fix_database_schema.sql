-- Fix Database Schema for Fuel Delivery App
-- This removes customer_email and ensures customer_mobile exists

-- 1. Update Orders Table Schema
ALTER TABLE public.orders 
DROP COLUMN IF EXISTS customer_email,
ADD COLUMN IF NOT EXISTS customer_mobile TEXT,
ADD COLUMN IF NOT EXISTS customer_pan TEXT,
ADD COLUMN IF NOT EXISTS assigned_pump_id TEXT,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending_payment';

-- 2. Create index for faster pump dashboard queries
CREATE INDEX IF NOT EXISTS idx_orders_assigned_pump_id 
ON public.orders(assigned_pump_id);

-- 3. Create index for customer lookups
CREATE INDEX IF NOT EXISTS idx_orders_customer_mobile 
ON public.orders(customer_mobile);

-- 4. Ensure RLS Policies for Orders
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Allow public insert (for customers placing orders)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'orders' 
        AND policyname = 'Allow public insert to orders'
    ) THEN
        CREATE POLICY "Allow public insert to orders" 
        ON public.orders FOR INSERT 
        TO anon, authenticated 
        WITH CHECK (true);
    END IF;
END $$;

-- Allow public select (for customers and pumps to view orders)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'orders' 
        AND policyname = 'Allow public select from orders'
    ) THEN
        CREATE POLICY "Allow public select from orders" 
        ON public.orders FOR SELECT 
        TO anon, authenticated 
        USING (true);
    END IF;
END $$;

-- 5. Verify schema changes
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'orders' 
ORDER BY ordinal_position;
