-- Fix Foreign Key Constraint Error for Fuel Delivery App
-- This script ensures proper foreign key relationship between orders and petrol_pumps

-- 1. Ensure pump_id column exists with proper foreign key
DO $$ 
BEGIN
    -- Check if pump_id exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public'
        AND table_name = 'orders' 
        AND column_name = 'pump_id'
    ) THEN
        -- Create pump_id with foreign key constraint
        ALTER TABLE public.orders 
        ADD COLUMN pump_id BIGINT REFERENCES public.petrol_pumps(id) ON DELETE SET NULL;
        
        RAISE NOTICE 'Created pump_id column with foreign key constraint';
    ELSE
        RAISE NOTICE 'pump_id column already exists';
    END IF;
END $$;

-- 2. Remove assigned_pump_id to avoid confusion (TEXT column without FK)
ALTER TABLE public.orders DROP COLUMN IF EXISTS assigned_pump_id;

-- 3. Ensure required customer columns exist
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS customer_mobile TEXT,
ADD COLUMN IF NOT EXISTS customer_pan TEXT,
ADD COLUMN IF NOT EXISTS customer_name TEXT;

-- 4. Remove customer_email if it exists
ALTER TABLE public.orders DROP COLUMN IF EXISTS customer_email;

-- 5. Ensure other required columns exist
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS fuel_type TEXT,
ADD COLUMN IF NOT EXISTS quantity INTEGER,
ADD COLUMN IF NOT EXISTS unit TEXT DEFAULT 'L',
ADD COLUMN IF NOT EXISTS price_per_liter DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS fuel_cost DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS delivery_fee DECIMAL(10,2) DEFAULT 49.00,
ADD COLUMN IF NOT EXISTS total_amount DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending_payment';

-- 6. Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_orders_pump_id 
ON public.orders(pump_id);

CREATE INDEX IF NOT EXISTS idx_orders_customer_mobile 
ON public.orders(customer_mobile);

CREATE INDEX IF NOT EXISTS idx_orders_status 
ON public.orders(status);

-- 7. Ensure RLS is enabled
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- 8. Create RLS policies if they don't exist
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

-- 9. Verify schema
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public'
AND table_name = 'orders' 
ORDER BY ordinal_position;

-- 10. Check foreign key constraints
SELECT
    tc.constraint_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_schema = 'public'
AND tc.table_name = 'orders';

-- 11. List available pumps (to verify pumps exist)
SELECT id, user_id, company_name, location, status  
FROM public.petrol_pumps 
ORDER BY id
LIMIT 10;
