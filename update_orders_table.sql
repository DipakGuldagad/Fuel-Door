-- Update orders table for the Fuel@Door pump assignment system
-- Run this in your Supabase SQL Editor
-- This ensures all required columns exist and removes problematic ones

-- Add assigned_pump_id column to orders table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'orders' AND column_name = 'assigned_pump_id') THEN
        ALTER TABLE public.orders ADD COLUMN assigned_pump_id BIGINT REFERENCES public.petrol_pumps(id);
        RAISE NOTICE 'Added assigned_pump_id column to orders table';
    ELSE
        RAISE NOTICE 'assigned_pump_id column already exists in orders table';
    END IF;
END $$;

-- Add customer name and mobile columns if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'orders' AND column_name = 'customer_name') THEN
        ALTER TABLE public.orders ADD COLUMN customer_name TEXT;
        RAISE NOTICE 'Added customer_name column to orders table';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'orders' AND column_name = 'customer_mobile') THEN
        ALTER TABLE public.orders ADD COLUMN customer_mobile TEXT;
        RAISE NOTICE 'Added customer_mobile column to orders table';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'orders' AND column_name = 'delivery_time') THEN
        ALTER TABLE public.orders ADD COLUMN delivery_time TEXT;
        RAISE NOTICE 'Added delivery_time column to orders table';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'orders' AND column_name = 'landmark') THEN
        ALTER TABLE public.orders ADD COLUMN landmark TEXT;
        RAISE NOTICE 'Added landmark column to orders table';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'orders' AND column_name = 'pincode') THEN
        ALTER TABLE public.orders ADD COLUMN pincode TEXT;
        RAISE NOTICE 'Added pincode column to orders table';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'orders' AND column_name = 'fuel_cost') THEN
        ALTER TABLE public.orders ADD COLUMN fuel_cost DECIMAL(10,2);
        RAISE NOTICE 'Added fuel_cost column to orders table';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'orders' AND column_name = 'delivery_fee') THEN
        ALTER TABLE public.orders ADD COLUMN delivery_fee DECIMAL(10,2);
        RAISE NOTICE 'Added delivery_fee column to orders table';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'orders' AND column_name = 'total_amount') THEN
        ALTER TABLE public.orders ADD COLUMN total_amount DECIMAL(10,2);
        RAISE NOTICE 'Added total_amount column to orders table';
    END IF;
END $$;

-- Create index for efficient filtering by assigned pump
CREATE INDEX IF NOT EXISTS idx_orders_assigned_pump_id ON public.orders (assigned_pump_id);

-- Verify the final structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public'
AND table_name = 'orders'
ORDER BY ordinal_position;
