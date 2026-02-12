-- QUICK FIX: Disable Row Level Security on orders table
-- Run this single line in your Supabase SQL Editor

ALTER TABLE public.orders DISABLE ROW LEVEL SECURITY;

-- Verify it worked
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'orders' AND schemaname = 'public';
