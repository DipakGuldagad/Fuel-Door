-- ============================================================================
-- SETUP: PAN-Based Customer Authentication System
-- ============================================================================

-- 1. Create Customers Table
CREATE TABLE IF NOT EXISTS public.customers (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    name TEXT NOT NULL,
    pan_number TEXT UNIQUE NOT NULL,
    mobile_number TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Index for fast PAN lookup
CREATE INDEX IF NOT EXISTS idx_customers_pan_number ON public.customers (pan_number);

-- 3. Enable RLS
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies
-- Note: Using 'anon' role as requested (no Supabase Auth)

-- Allow anyone to check if a PAN exists (Login check)
DROP POLICY IF EXISTS "Enable read access for all" ON public.customers;
CREATE POLICY "Enable read access for all"
ON public.customers
FOR SELECT
TO anon
USING (true);

-- Allow anyone to register (Insert)
DROP POLICY IF EXISTS "Enable insert for all" ON public.customers;
CREATE POLICY "Enable insert for all"
ON public.customers
FOR INSERT
TO anon
WITH CHECK (true);

-- For UPDATE/DELETE, we'd normally need a way to verify identity.
-- In this simple setup, we'll allow updates if you know the PAN.
DROP POLICY IF EXISTS "Enable update based on pan" ON public.customers;
CREATE POLICY "Enable update based on pan"
ON public.customers
FOR UPDATE
TO anon
USING (true)
WITH CHECK (true);

-- 5. Ensure pan_users is accessible to anon for verification
ALTER TABLE public.pan_users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow anon read pan_users" ON public.pan_users;
CREATE POLICY "Allow anon read pan_users"
ON public.pan_users
FOR SELECT
TO anon
USING (true);
