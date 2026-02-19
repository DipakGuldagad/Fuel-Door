-- ============================================================================
-- FIX: Consolidate Auth to pan_users table
-- ============================================================================

-- 1. Ensure RLS is enabled on pan_users
ALTER TABLE public.pan_users ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Allow public read access to pan_users" ON public.pan_users;
DROP POLICY IF EXISTS "Allow anon read pan_users" ON public.pan_users;
DROP POLICY IF EXISTS "Allow anon insert pan_users" ON public.pan_users;

-- 3. Create fresh policies for anonymous access
-- Allow anyone to search for users by PAN (Login check)
CREATE POLICY "Allow anon select pan_users"
ON public.pan_users
FOR SELECT
TO anon
USING (true);

-- Allow anyone to register (Insert new PAN user)
CREATE POLICY "Allow anon insert pan_users"
ON public.pan_users
FOR INSERT
TO anon
WITH CHECK (true);

-- 4. [Optional] Index for fast PAN lookup (already exists but ensuring)
CREATE INDEX IF NOT EXISTS idx_pan_users_pan_number_v2 ON public.pan_users (pan_number);
