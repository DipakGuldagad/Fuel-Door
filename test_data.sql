-- Minimal test data for Fuel@Door application
-- Run this after setting up the database structure

-- Add a few test petrol pumps
INSERT INTO public.petrol_pumps (
    user_id, 
    company_name, 
    location, 
    latitude,
    longitude,
    owner_name, 
    owner_mobile, 
    license_number, 
    fuel_price, 
    password_hash, 
    status
) VALUES 
(
    'DEMO-PUMP-001',
    'Shell Petrol Station',
    'Andheri West, Mumbai',
    19.1334,
    72.8267,
    'Rajesh Kumar',
    '+919876543210',
    'SH-MH-2024-001',
    105.50,
    'demo_password_hash',
    'active'
),
(
    'DEMO-PUMP-002',
    'HP Petrol Pump',
    'Bandra East, Mumbai', 
    19.0596,
    72.8406,
    'Priya Sharma',
    '+919123456789',
    'HP-MH-2024-002',
    104.75,
    'demo_password_hash',
    'active'
),
(
    'DEMO-EV-001',
    'Green Energy EV Hub',
    'Powai, Mumbai',
    19.1176,
    72.9060,
    'Arjun Patel',
    '+919234567890',
    'EV-MH-2024-001',
    12.00,
    'demo_password_hash',
    'active'
)
ON CONFLICT (user_id) DO NOTHING;
