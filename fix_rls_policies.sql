-- ============================================================================
-- FIX: Row Level Security Policies for Fuel@Door Payment System
-- ============================================================================
-- This script fixes RLS issues preventing:
-- 1. Order insertion
-- 2. Payment screenshot uploads
-- 3. Order status updates
--
-- Run this in Supabase SQL Editor
-- ============================================================================

-- ============================================================================
-- PART 1: Orders Table RLS Policies
-- ============================================================================

-- First, check if RLS is enabled on orders table
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'orders';

-- Enable RLS on orders table (if not already enabled)
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to start fresh (safe - will recreate)
DROP POLICY IF EXISTS "Allow public insert orders" ON public.orders;
DROP POLICY IF EXISTS "Allow public read orders" ON public.orders;
DROP POLICY IF EXISTS "Allow public update orders" ON public.orders;
DROP POLICY IF EXISTS "Allow anon insert orders" ON public.orders;
DROP POLICY IF EXISTS "Allow anon read orders" ON public.orders;
DROP POLICY IF EXISTS "Allow anon update orders" ON public.orders;

-- ============================================================================
-- POLICY 1: Allow INSERT for anonymous users (order creation)
-- ============================================================================
-- This allows customers to create orders using the anon key
CREATE POLICY "Allow anon insert orders"
ON public.orders
FOR INSERT
TO anon
WITH CHECK (true);

-- ============================================================================
-- POLICY 2: Allow SELECT for anonymous users (read orders)
-- ============================================================================
-- This allows customers to read their orders and pumps to see assigned orders
CREATE POLICY "Allow anon read orders"
ON public.orders
FOR SELECT
TO anon
USING (true);

-- ============================================================================
-- POLICY 3: Allow UPDATE for anonymous users (payment status updates)
-- ============================================================================
-- This allows updating payment status, UTR, screenshot URL
CREATE POLICY "Allow anon update orders"
ON public.orders
FOR UPDATE
TO anon
USING (true)
WITH CHECK (true);

-- ============================================================================
-- PART 2: Storage Bucket RLS Policies for payment-screenshots
-- ============================================================================

-- Check if bucket exists
SELECT * FROM storage.buckets WHERE name = 'payment-screenshots';

-- If bucket doesn't exist, create it (PRIVATE bucket)
INSERT INTO storage.buckets (id, name, public)
VALUES ('payment-screenshots', 'payment-screenshots', false)
ON CONFLICT (id) DO NOTHING;

-- Drop existing storage policies
DROP POLICY IF EXISTS "Allow public upload payment screenshots" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read payment screenshots" ON storage.objects;
DROP POLICY IF EXISTS "Allow anon upload payment screenshots" ON storage.objects;
DROP POLICY IF EXISTS "Allow anon read payment screenshots" ON storage.objects;

-- ============================================================================
-- STORAGE POLICY 1: Allow INSERT (upload) for anonymous users
-- ============================================================================
CREATE POLICY "Allow anon upload payment screenshots"
ON storage.objects
FOR INSERT
TO anon
WITH CHECK (
    bucket_id = 'payment-screenshots'
);

-- ============================================================================
-- STORAGE POLICY 2: Allow SELECT (read) for anonymous users
-- ============================================================================
-- This allows viewing uploaded screenshots
CREATE POLICY "Allow anon read payment screenshots"
ON storage.objects
FOR SELECT
TO anon
USING (
    bucket_id = 'payment-screenshots'
);

-- ============================================================================
-- STORAGE POLICY 3: Allow UPDATE for anonymous users (optional)
-- ============================================================================
CREATE POLICY "Allow anon update payment screenshots"
ON storage.objects
FOR UPDATE
TO anon
USING (
    bucket_id = 'payment-screenshots'
)
WITH CHECK (
    bucket_id = 'payment-screenshots'
);

-- ============================================================================
-- PART 3: Verify Policies Are Active
-- ============================================================================

-- Check orders table policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'orders';

-- Check storage policies
SELECT policyname, permissive, roles, cmd
FROM pg_policies
WHERE schemaname = 'storage' AND tablename = 'objects';

-- ============================================================================
-- PART 4: Test Queries (Optional - for debugging)
-- ============================================================================

-- Test if you can insert an order (should work now)
-- Uncomment to test:
/*
INSERT INTO public.orders (
    customer_name,
    customer_mobile,
    fuel_type,
    quantity,
    total_amount,
    status,
    payment_status,
    assigned_pump_id
) VALUES (
    'Test Customer',
    '9876543210',
    'petrol',
    10,
    1000,
    'pending',
    'Pending',
    1
) RETURNING id;
*/

-- ============================================================================
-- IMPORTANT NOTES
-- ============================================================================
-- 
-- 1. These policies use "anon" role which is the default for unauthenticated
--    users using the anon key from config.js
--
-- 2. For production, you should:
--    - Add authentication (Supabase Auth)
--    - Restrict policies based on user.id
--    - Add more granular permissions
--
-- 3. Current setup allows ANY anonymous user to:
--    - Create orders
--    - Read all orders
--    - Update any order
--    - Upload screenshots
--    This is OK for testing but NOT for production
--
-- 4. The storage bucket is PRIVATE, so screenshots are only accessible
--    via signed URLs or through the policies above
--
-- ============================================================================

RAISE NOTICE 'RLS policies created successfully!';
RAISE NOTICE 'Orders table: INSERT, SELECT, UPDATE allowed for anon users';
RAISE NOTICE 'Storage bucket: INSERT, SELECT, UPDATE allowed for payment-screenshots';
RAISE NOTICE 'REMINDER: These are permissive policies for testing. Tighten for production!';
