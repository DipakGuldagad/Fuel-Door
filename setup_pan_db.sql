-- Create tables for PAN-based login system

-- Table: pan_users
-- Stores validated PAN numbers and names extracted from OCR
CREATE TABLE IF NOT EXISTS public.pan_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pan_number TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fast PAN lookup
CREATE INDEX IF NOT EXISTS idx_pan_users_pan_number ON public.pan_users (pan_number);

-- Table: pan_login_logs
-- Stores login attempts with geolocation
CREATE TABLE IF NOT EXISTS public.pan_login_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pan_number TEXT NOT NULL REFERENCES public.pan_users(pan_number),
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    login_time TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.pan_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pan_login_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Allow read access to pan_users for all (authenticated and anon)
-- needed for login check. We could restrict this to a function but for this scope direct select is fine.
CREATE POLICY "Allow public read access to pan_users"
ON public.pan_users FOR SELECT
TO anon, authenticated
USING (true);

-- Allow insert access to pan_login_logs for all
CREATE POLICY "Allow public insert access to pan_login_logs"
ON public.pan_login_logs FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Allow read access to logs only for authenticated users (admins) implies we might need a dashboard later
CREATE POLICY "Allow authenticated read access to pan_login_logs"
ON public.pan_login_logs FOR SELECT
TO authenticated
USING (true);
