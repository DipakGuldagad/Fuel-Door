-- Migration script to add EV charging support to Fuel@Door database
-- Run this SQL in your Supabase SQL Editor

-- First, let's check what tables and columns actually exist
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name IN ('petrol_pumps', 'orders')
AND table_schema = 'public'
ORDER BY table_name, ordinal_position;

-- Check existing constraints
SELECT 
    constraint_name,
    table_name,
    constraint_type
FROM information_schema.table_constraints 
WHERE table_name IN ('orders')
AND table_schema = 'public';

-- If the orders table doesn't exist, create it first
CREATE TABLE IF NOT EXISTS public.orders (
    id BIGSERIAL PRIMARY KEY,
    customer_location TEXT NOT NULL,
    customer_latitude DECIMAL(10,8),
    customer_longitude DECIMAL(11,8),
    pump_id BIGINT,
    pump_user_id TEXT,
    fuel_type TEXT NOT NULL DEFAULT 'petrol',
    quantity INTEGER NOT NULL,
    price_per_liter DECIMAL(10,2) NOT NULL,
    fuel_cost DECIMAL(10,2) NOT NULL,
    delivery_fee DECIMAL(10,2) DEFAULT 49.00,
    total_amount DECIMAL(10,2) NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add the fuel_type column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'orders' AND column_name = 'fuel_type') THEN
        ALTER TABLE public.orders ADD COLUMN fuel_type TEXT NOT NULL DEFAULT 'petrol';
    END IF;
END $$;

-- Now update the fuel_type constraint to allow 'ev'
ALTER TABLE public.orders 
DROP CONSTRAINT IF EXISTS orders_fuel_type_check;

-- Add the updated constraint that includes 'ev'
ALTER TABLE public.orders 
ADD CONSTRAINT orders_fuel_type_check 
CHECK (fuel_type IN ('petrol', 'diesel', 'ev'));

-- Add status constraint if it doesn't exist
ALTER TABLE public.orders 
DROP CONSTRAINT IF EXISTS orders_status_check;

ALTER TABLE public.orders 
ADD CONSTRAINT orders_status_check 
CHECK (status IN ('pending', 'confirmed', 'in_progress', 'delivered', 'cancelled'));

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_orders_pump_id ON public.orders (pump_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders (status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders (created_at);

-- Enable RLS for orders table
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow all operations for anon users on orders" ON public.orders;
DROP POLICY IF EXISTS "Allow all operations for authenticated users on orders" ON public.orders;

-- Create policies for orders table
CREATE POLICY "Allow all operations for anon users on orders" 
ON public.orders 
FOR ALL 
TO anon 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Allow all operations for authenticated users on orders" 
ON public.orders 
FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- Add some sample EV charging stations (optional - for testing)
-- Uncomment if you want test data
/*
INSERT INTO public.petrol_pumps (
    user_id, 
    company_name, 
    location, 
    latitude,
    longitude,
    owner_name, 
    owner_mobile, 
    license_number, 
    fuel_price, 
    password_hash, 
    status
) VALUES 
(
    'EVChargePoint-001',
    'Green Energy EV Hub',
    'Bandra East, Mumbai',
    19.0596,
    72.8406,
    'Priya Sharma',
    '9123456789',
    'EV-MH-2024-001',
    12.00,  -- ₹12 per kWh
    'demoevpasswordhash',
    'active'
),
(
    'TeslaCharger-002', 
    'Tesla Supercharger Station',
    'Powai, Mumbai',
    19.1176,
    72.9060,
    'Arjun Patel',
    '9234567890',
    'EV-MH-2024-002',
    12.00,
    'demoteslapasswordhash',
    'active'
);
*/

-- Verify the changes
SELECT 
    table_name,
    constraint_name,
    constraint_type
FROM information_schema.table_constraints 
WHERE table_name = 'orders' 
AND constraint_name LIKE '%fuel_type%';

-- Show current fuel types allowed
SELECT 
    constraint_name,
    check_clause
FROM information_schema.check_constraints 
WHERE constraint_name = 'orders_fuel_type_check';
