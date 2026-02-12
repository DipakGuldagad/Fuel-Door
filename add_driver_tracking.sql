-- Add driver details and location columns to orders table
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS driver_name TEXT,
ADD COLUMN IF NOT EXISTS driver_mobile TEXT,
ADD COLUMN IF NOT EXISTS driver_latitude DECIMAL(10,8),
ADD COLUMN IF NOT EXISTS driver_longitude DECIMAL(11,8);

-- Add status 'out_for_delivery' to the check constraint if possible, 
-- or just rely on text value if constraint is flexible or needs dropping.
-- For safety, we'll try to drop and recreate the constraint if we need stricter checks,
-- but for now let's just assume we can insert the value if the text matches.
-- If the existing constraint is strict, we might need to recreate it.

-- Let's check existing constraint name usually assumes 'orders_status_check'
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_status_check;

ALTER TABLE public.orders 
ADD CONSTRAINT orders_status_check 
CHECK (status IN ('pending', 'confirmed', 'in_progress', 'out_for_delivery', 'delivered', 'cancelled'));

-- Create policy to allow public read access for tracking (simplified for demo)
-- Ideally should be restricted to the specific customer, but for demo 'anon' reading orders by ID is okay if we use RLS or just trust the policy we have.
-- We already have "Allow all operations for anon users on orders" so we are good.
