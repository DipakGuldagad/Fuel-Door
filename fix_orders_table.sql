-- Complete SQL migration script for Fuel@Door orders table
-- Run this entire script in your Supabase SQL Editor to fix all column issues
-- This will ensure all required columns exist and remove problematic references

-- First, let's see the current structure of the orders table
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public'
  AND table_name = 'orders'
ORDER BY ordinal_position;

-- Add all required columns if they don't exist
DO $$ 
BEGIN
    -- Add assigned_pump_id column (foreign key to petrol_pumps)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'orders' AND column_name = 'assigned_pump_id') THEN
        ALTER TABLE public.orders ADD COLUMN assigned_pump_id BIGINT REFERENCES public.petrol_pumps(id);
        RAISE NOTICE 'Added assigned_pump_id column to orders table';
    ELSE
        RAISE NOTICE 'assigned_pump_id column already exists in orders table';
    END IF;

    -- Add customer information columns
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

    -- Add delivery information columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'orders' AND column_name = 'customer_location') THEN
        ALTER TABLE public.orders ADD COLUMN customer_location TEXT;
        RAISE NOTICE 'Added customer_location column to orders table';
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

    -- Add order details columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'orders' AND column_name = 'fuel_type') THEN
        ALTER TABLE public.orders ADD COLUMN fuel_type TEXT;
        RAISE NOTICE 'Added fuel_type column to orders table';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'orders' AND column_name = 'quantity') THEN
        ALTER TABLE public.orders ADD COLUMN quantity DECIMAL(10,2);
        RAISE NOTICE 'Added quantity column to orders table';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'orders' AND column_name = 'unit') THEN
        ALTER TABLE public.orders ADD COLUMN unit TEXT DEFAULT 'liters';
        RAISE NOTICE 'Added unit column to orders table';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'orders' AND column_name = 'price_per_liter') THEN
        ALTER TABLE public.orders ADD COLUMN price_per_liter DECIMAL(10,2);
        RAISE NOTICE 'Added price_per_liter column to orders table';
    END IF;

    -- Add pricing columns
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

    -- Add status column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'orders' AND column_name = 'status') THEN
        ALTER TABLE public.orders ADD COLUMN status TEXT DEFAULT 'pending';
        RAISE NOTICE 'Added status column to orders table';
    END IF;

    -- Add created_at column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'orders' AND column_name = 'created_at') THEN
        ALTER TABLE public.orders ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
        RAISE NOTICE 'Added created_at column to orders table';
    END IF;
END $$;

-- Remove problematic columns if they exist (columns that cause the error)
DO $$ 
BEGIN
    -- Remove customer_latitude if it exists
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'orders' AND column_name = 'customer_latitude') THEN
        ALTER TABLE public.orders DROP COLUMN customer_latitude;
        RAISE NOTICE 'Removed customer_latitude column from orders table';
    END IF;

    -- Remove customer_longitude if it exists
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'orders' AND column_name = 'customer_longitude') THEN
        ALTER TABLE public.orders DROP COLUMN customer_longitude;
        RAISE NOTICE 'Removed customer_longitude column from orders table';
    END IF;

    -- Remove pump_id if it exists (we use assigned_pump_id instead)
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'orders' AND column_name = 'pump_id') THEN
        ALTER TABLE public.orders DROP COLUMN pump_id;
        RAISE NOTICE 'Removed pump_id column from orders table';
    END IF;

    -- Remove pump_user_id if it exists (not needed with assigned_pump_id)
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'orders' AND column_name = 'pump_user_id') THEN
        ALTER TABLE public.orders DROP COLUMN pump_user_id;
        RAISE NOTICE 'Removed pump_user_id column from orders table';
    END IF;
END $$;

-- Update fuel_type constraint to allow petrol, diesel, and ev
DO $$ 
BEGIN
    -- First, check if the constraint exists and drop it
    IF EXISTS (SELECT 1 FROM information_schema.check_constraints 
               WHERE constraint_name = 'orders_fuel_type_check') THEN
        ALTER TABLE public.orders DROP CONSTRAINT orders_fuel_type_check;
        RAISE NOTICE 'Dropped existing fuel_type constraint';
    END IF;
    
    -- Add new constraint that allows petrol, diesel, and ev
    ALTER TABLE public.orders ADD CONSTRAINT orders_fuel_type_check 
        CHECK (fuel_type IN ('petrol', 'diesel', 'ev'));
    RAISE NOTICE 'Added updated fuel_type constraint allowing petrol, diesel, and ev';
END $$;

-- Create useful indexes for performance
CREATE INDEX IF NOT EXISTS idx_orders_assigned_pump_id ON public.orders (assigned_pump_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders (status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_customer_mobile ON public.orders (customer_mobile);

-- Show the final structure of the orders table
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_schema = 'public'
  AND table_name = 'orders'
ORDER BY ordinal_position;

-- Show constraints on the orders table
SELECT 
    constraint_name,
    constraint_type
FROM information_schema.table_constraints 
WHERE table_schema = 'public'
  AND table_name = 'orders';

RAISE NOTICE 'Orders table migration completed successfully!';
