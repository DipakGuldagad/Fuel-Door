-- ============================================================================
-- FIX: Pump Dashboard Login & Query Column Mismatch
-- ============================================================================

-- 1. FIX PETROL_PUMPS RLS
-- This allows the dashboard to load pump info after login
ALTER TABLE public.petrol_pumps ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow anon read pumps" ON public.petrol_pumps;
CREATE POLICY "Allow anon read pumps"
ON public.petrol_pumps
FOR SELECT
TO anon
USING (true);

-- 2. ENSURE ORDERS TABLE HAS CORRECT COLUMN NAMES
-- We use 'assigned_pump_id' for linking orders to pumps
DO $$ 
BEGIN 
    -- If 'pump_id' exists but 'assigned_pump_id' doesn't, rename it
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'pump_id') 
       AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'assigned_pump_id') THEN
        ALTER TABLE public.orders RENAME COLUMN pump_id TO assigned_pump_id;
    END IF;
END $$;

-- 3. ENSURE ALL PAYMENT COLUMNS EXIST (Re-run for safety)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'utr_number') THEN
        ALTER TABLE public.orders ADD COLUMN utr_number TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'payment_screenshot_url') THEN
        ALTER TABLE public.orders ADD COLUMN payment_screenshot_url TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'payment_status') THEN
        ALTER TABLE public.orders ADD COLUMN payment_status TEXT DEFAULT 'Pending';
    END IF;
END $$;
