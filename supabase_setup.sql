-- Create petrol_pumps table for Fuel@Door system
-- Run this SQL in your Supabase SQL Editor: https://qcveeqylkrkztxvkszsk.supabase.co/project/default/sql

-- Drop table if exists (for fresh setup)
DROP TABLE IF EXISTS public.petrol_pumps CASCADE;

-- Create the petrol_pumps table
CREATE TABLE public.petrol_pumps (
    id BIGSERIAL PRIMARY KEY,
    user_id TEXT UNIQUE NOT NULL,
    company_name TEXT NOT NULL,
    location TEXT NOT NULL,
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    owner_name TEXT NOT NULL,
    owner_mobile TEXT NOT NULL,
    license_number TEXT NOT NULL,
    fuel_price DECIMAL(10,2) NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended'))
);

-- Create index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_petrol_pumps_user_id ON public.petrol_pumps (user_id);

-- Create index on status for faster filtering
CREATE INDEX IF NOT EXISTS idx_petrol_pumps_status ON public.petrol_pumps (status);

-- Enable Row Level Security (RLS)
ALTER TABLE public.petrol_pumps ENABLE ROW LEVEL SECURITY;

-- Create a simple policy to allow all operations for anon users
CREATE POLICY "Allow all operations for anon users" 
ON public.petrol_pumps 
FOR ALL 
TO anon 
USING (true) 
WITH CHECK (true);

-- Create policy for authenticated users
CREATE POLICY "Allow all operations for authenticated users" 
ON public.petrol_pumps 
FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_petrol_pumps_updated_at
    BEFORE UPDATE ON public.petrol_pumps
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample data (optional - for testing)
-- You can uncomment this if you want some test data
/*
INSERT INTO public.petrol_pumps (
    user_id, 
    company_name, 
    location, 
    owner_name, 
    owner_mobile, 
    license_number, 
    fuel_price, 
    password_hash, 
    status
) VALUES 
(
    'BharatPetro-TEST1',
    'Bharat Petroleum',
    'Andheri West, Mumbai',
    'Rajesh Kumar',
    '9876543210',
    'BP-MH-2024-001',
    105.50,
    'demopasswordhash', -- This would be a real hash in production
    'active'
);
*/

-- Create orders table for fuel delivery orders
CREATE TABLE IF NOT EXISTS public.orders (
    id BIGSERIAL PRIMARY KEY,
    customer_location TEXT NOT NULL,
    customer_latitude DECIMAL(10,8),
    customer_longitude DECIMAL(11,8),
    pump_id BIGINT REFERENCES public.petrol_pumps(id),
    pump_user_id TEXT,
    fuel_type TEXT NOT NULL CHECK (fuel_type IN ('petrol', 'diesel')),
    quantity INTEGER NOT NULL,
    price_per_liter DECIMAL(10,2) NOT NULL,
    fuel_cost DECIMAL(10,2) NOT NULL,
    delivery_fee DECIMAL(10,2) DEFAULT 49.00,
    total_amount DECIMAL(10,2) NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'in_progress', 'delivered', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for orders table
CREATE INDEX IF NOT EXISTS idx_orders_pump_id ON public.orders (pump_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders (status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders (created_at);

-- Enable RLS for orders table
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

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

-- Create trigger for orders updated_at
CREATE TRIGGER update_orders_updated_at
    BEFORE UPDATE ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Verify table creation
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
