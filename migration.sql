-- Master Migration Script for Fuel@Door
-- Runs on new Supabase Project: https://qfqfmkktvyojubrsbamb.supabase.co

-- 1. Enable RLS on all tables we create
-- 2. Define tables: petrol_pumps, orders, logins, agent_login

-- ==========================================
-- TABLE 1: petrol_pumps
-- ==========================================
DROP TABLE IF EXISTS public.petrol_pumps CASCADE;

CREATE TABLE public.petrol_pumps (
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

CREATE INDEX idx_petrol_pumps_user_id ON public.petrol_pumps (user_id);
CREATE INDEX idx_petrol_pumps_status ON public.petrol_pumps (status);

ALTER TABLE public.petrol_pumps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations for anon users" ON public.petrol_pumps FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for authenticated users" ON public.petrol_pumps FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ==========================================
-- TABLE 2: orders
-- ==========================================
DROP TABLE IF EXISTS public.orders CASCADE;

CREATE TABLE public.orders (
    id BIGSERIAL PRIMARY KEY,
    customer_location TEXT NOT NULL,
    customer_latitude DECIMAL(10,8),
    customer_longitude DECIMAL(11,8),
    pump_id BIGINT REFERENCES public.petrol_pumps(id),
    
    -- We use this to link to the pump's user_id string if needed, 
    -- though pump_id FK is better for relational integrity.
    pump_user_id TEXT, 
    
    -- Order Details
    fuel_type TEXT NOT NULL CHECK (fuel_type IN ('petrol', 'diesel', 'ev')),
    quantity INTEGER NOT NULL,
    unit TEXT DEFAULT 'L', -- 'L' for fuel, 'kWh' for EV
    price_per_liter DECIMAL(10,2) NOT NULL,
    fuel_cost DECIMAL(10,2) NOT NULL,
    delivery_fee DECIMAL(10,2) DEFAULT 49.00,
    total_amount DECIMAL(10,2) NOT NULL,
    
    -- Customer Info (Snapshot)
    customer_name TEXT,
    customer_mobile TEXT,
    
    -- Status
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'pending_payment', 'confirmed', 'in_progress', 'out_for_delivery', 'delivered', 'cancelled')),
    
    -- Delivery Tracking
    driver_name TEXT,
    driver_mobile TEXT,
    driver_latitude DECIMAL(10,8),
    driver_longitude DECIMAL(11,8),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_orders_pump_id ON public.orders (pump_id);
CREATE INDEX idx_orders_status ON public.orders (status);
CREATE INDEX idx_orders_created_at ON public.orders (created_at);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations for anon users on orders" ON public.orders FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for authenticated users on orders" ON public.orders FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ==========================================
-- TABLE 3: logins (Customer Login)
-- ==========================================
DROP TABLE IF EXISTS public.logins CASCADE;

CREATE TABLE public.logins (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    mobile TEXT NOT NULL,
    pan TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_logins_mobile ON public.logins (mobile);

ALTER TABLE public.logins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read/write access for logins" ON public.logins FOR ALL TO anon USING (true) WITH CHECK (true);

-- ==========================================
-- TABLE 4: agent_login (Delivery Agent)
-- ==========================================
DROP TABLE IF EXISTS public.agent_login CASCADE;

CREATE TABLE public.agent_login (
    id BIGSERIAL PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    mobile TEXT NOT NULL,
    vehicle_number TEXT,
    status TEXT DEFAULT 'active',
    current_latitude DECIMAL(10,8),
    current_longitude DECIMAL(11,8),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.agent_login ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read/write access for agents" ON public.agent_login FOR ALL TO anon USING (true) WITH CHECK (true);

-- ==========================================
-- DATA: Sample Pumps (Optional)
-- ==========================================
-- Uncomment to insert sample data
/*
INSERT INTO public.petrol_pumps (user_id, company_name, location, latitude, longitude, owner_name, owner_mobile, license_number, fuel_price, password_hash, status)
VALUES 
('DEMO-PUMP-001', 'Shell Petrol Station', 'Andheri West, Mumbai', 19.1334, 72.8267, 'Rajesh Kumar', '+919876543210', 'SH-MH-2024-001', 105.50, 'demo_hash', 'active'),
('DEMO-PUMP-002', 'HP Petrol Pump', 'Bandra East, Mumbai', 19.0596, 72.8406, 'Priya Sharma', '+919123456789', 'HP-MH-2024-002', 104.75, 'demo_hash', 'active');
*/
