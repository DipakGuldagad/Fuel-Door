-- Diagnostic script to check current Fuel@Door database structure
-- Run this first to see what exists in your database

-- Check if tables exist
SELECT 
    schemaname,
    tablename,
    hasindexes,
    hasrules,
    hastriggers
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('petrol_pumps', 'orders');

-- Check all columns in both tables
SELECT 
    table_name,
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public'
AND table_name IN ('petrol_pumps', 'orders')
ORDER BY table_name, ordinal_position;

-- Check constraints on orders table
SELECT 
    tc.constraint_name,
    tc.table_name,
    tc.constraint_type,
    cc.check_clause
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.check_constraints cc ON tc.constraint_name = cc.constraint_name
WHERE tc.table_schema = 'public'
AND tc.table_name = 'orders';

-- Check if there are any existing rows in the tables
SELECT 'petrol_pumps' as table_name, COUNT(*) as row_count FROM public.petrol_pumps
UNION ALL
SELECT 'orders' as table_name, COUNT(*) as row_count FROM public.orders;
