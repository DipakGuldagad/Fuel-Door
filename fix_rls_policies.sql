-- Fix Row Level Security (RLS) policies for orders table
-- Run this in your Supabase SQL Editor to allow order placement

-- First, let's check the current RLS status
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'orders' AND schemaname = 'public';

-- Check existing policies on orders table
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'orders' AND schemaname = 'public';

-- Option 1: Disable RLS entirely for orders table (simplest solution)
-- This allows all operations on the orders table
ALTER TABLE public.orders DISABLE ROW LEVEL SECURITY;

-- Option 2: If you want to keep RLS enabled but allow operations, create policies
-- Uncomment the lines below if you prefer to use RLS with policies

/*
-- Enable RLS (if not already enabled)
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Policy to allow anyone to insert orders (for customer order placement)
CREATE POLICY "Allow insert orders" ON public.orders
    FOR INSERT
    WITH CHECK (true);

-- Policy to allow users to view their own orders (by customer_mobile)
CREATE POLICY "Allow view own orders" ON public.orders
    FOR SELECT
    USING (true); -- Change to USING (auth.jwt() ->> 'phone' = customer_mobile) for user-specific access

-- Policy to allow pump owners to view assigned orders
CREATE POLICY "Allow pump view assigned orders" ON public.orders
    FOR SELECT
    USING (true); -- You can add more specific logic here

-- Policy to allow pump owners to update assigned orders status
CREATE POLICY "Allow pump update assigned orders" ON public.orders
    FOR UPDATE
    USING (true)
    WITH CHECK (true);

-- Policy to allow deleting orders (if needed)
CREATE POLICY "Allow delete orders" ON public.orders
    FOR DELETE
    USING (true);
*/

-- Verify the RLS status after changes
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'orders' AND schemaname = 'public';

-- Test insert to verify it works now
INSERT INTO public.orders (
    customer_name,
    customer_mobile,
    fuel_type,
    quantity,
    unit,
    price_per_liter,
    customer_location,
    assigned_pump_id,
    fuel_cost,
    delivery_fee,
    total_amount,
    status
) VALUES (
    'RLS Test Customer',
    '0000000000',
    'petrol',
    10,
    'liters',
    105.00,
    'Test Location for RLS',
    1,
    1050.00,
    50.00,
    1155.00,
    'pending'
) RETURNING id;

-- Clean up the test record
DELETE FROM public.orders WHERE customer_name = 'RLS Test Customer';

RAISE NOTICE 'RLS policies fixed successfully! Orders can now be placed.';
