-- Fix script to ensure petrol_pumps table has all required columns
-- Run this in your Supabase SQL Editor

-- First, let's check what columns currently exist
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public'
AND table_name = 'petrol_pumps'
ORDER BY ordinal_position;

-- Create the petrol_pumps table with correct structure if it doesn't exist
CREATE TABLE IF NOT EXISTS public.petrol_pumps (
    id BIGSERIAL PRIMARY KEY,
    user_id TEXT UNIQUE NOT NULL,
    company_name TEXT NOT NULL,
    location TEXT NOT NULL,
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    owner_name TEXT NOT NULL,
    owner_mobile TEXT NOT NULL,
    license_number TEXT NOT NULL,
    fuel_price DECIMAL(10,2) NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended'))
);

-- Add latitude column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'petrol_pumps' AND column_name = 'latitude') THEN
        ALTER TABLE public.petrol_pumps ADD COLUMN latitude DECIMAL(10,8);
        RAISE NOTICE 'Added latitude column to petrol_pumps table';
    ELSE
        RAISE NOTICE 'latitude column already exists in petrol_pumps table';
    END IF;
END $$;

-- Add longitude column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'petrol_pumps' AND column_name = 'longitude') THEN
        ALTER TABLE public.petrol_pumps ADD COLUMN longitude DECIMAL(11,8);
        RAISE NOTICE 'Added longitude column to petrol_pumps table';
    ELSE
        RAISE NOTICE 'longitude column already exists in petrol_pumps table';
    END IF;
END $$;

-- Add other missing columns if they don't exist
DO $$ 
BEGIN
    -- Add company_name if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'petrol_pumps' AND column_name = 'company_name') THEN
        ALTER TABLE public.petrol_pumps ADD COLUMN company_name TEXT NOT NULL DEFAULT '';
    END IF;
    
    -- Add owner_name if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'petrol_pumps' AND column_name = 'owner_name') THEN
        ALTER TABLE public.petrol_pumps ADD COLUMN owner_name TEXT NOT NULL DEFAULT '';
    END IF;
    
    -- Add owner_mobile if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'petrol_pumps' AND column_name = 'owner_mobile') THEN
        ALTER TABLE public.petrol_pumps ADD COLUMN owner_mobile TEXT NOT NULL DEFAULT '';
    END IF;
    
    -- Add license_number if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'petrol_pumps' AND column_name = 'license_number') THEN
        ALTER TABLE public.petrol_pumps ADD COLUMN license_number TEXT NOT NULL DEFAULT '';
    END IF;
    
    -- Add fuel_price if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'petrol_pumps' AND column_name = 'fuel_price') THEN
        ALTER TABLE public.petrol_pumps ADD COLUMN fuel_price DECIMAL(10,2) NOT NULL DEFAULT 100.00;
    END IF;
    
    -- Add password_hash if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'petrol_pumps' AND column_name = 'password_hash') THEN
        ALTER TABLE public.petrol_pumps ADD COLUMN password_hash TEXT NOT NULL DEFAULT '';
    END IF;
    
    -- Add status if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'petrol_pumps' AND column_name = 'status') THEN
        ALTER TABLE public.petrol_pumps ADD COLUMN status TEXT DEFAULT 'active';
    END IF;
    
    -- Add created_at if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'petrol_pumps' AND column_name = 'created_at') THEN
        ALTER TABLE public.petrol_pumps ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
    
    -- Add updated_at if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'petrol_pumps' AND column_name = 'updated_at') THEN
        ALTER TABLE public.petrol_pumps ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- Add constraints if they don't exist
ALTER TABLE public.petrol_pumps 
DROP CONSTRAINT IF EXISTS petrol_pumps_status_check;

ALTER TABLE public.petrol_pumps 
ADD CONSTRAINT petrol_pumps_status_check 
CHECK (status IN ('active', 'inactive', 'suspended'));

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_petrol_pumps_user_id ON public.petrol_pumps (user_id);
CREATE INDEX IF NOT EXISTS idx_petrol_pumps_status ON public.petrol_pumps (status);
CREATE INDEX IF NOT EXISTS idx_petrol_pumps_location ON public.petrol_pumps (latitude, longitude);

-- Enable Row Level Security (RLS)
ALTER TABLE public.petrol_pumps ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow all operations for anon users" ON public.petrol_pumps;
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON public.petrol_pumps;

-- Create policies
CREATE POLICY "Allow all operations for anon users" 
ON public.petrol_pumps 
FOR ALL 
TO anon 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Allow all operations for authenticated users" 
ON public.petrol_pumps 
FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_petrol_pumps_updated_at ON public.petrol_pumps;
CREATE TRIGGER update_petrol_pumps_updated_at
    BEFORE UPDATE ON public.petrol_pumps
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Verify the final structure
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public'
AND table_name = 'petrol_pumps'
ORDER BY ordinal_position;

-- Show success message
SELECT 'petrol_pumps table structure has been updated successfully!' as message;
