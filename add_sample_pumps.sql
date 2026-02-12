-- Add sample petrol pump data for testing
-- Run this in your Supabase SQL Editor

INSERT INTO public.petrol_pumps (company_name, location, latitude, longitude, fuel_price, contact_number, is_active) VALUES
('Shell Petrol Pump', 'Mumbai Central, Mumbai', 19.0176, 72.8562, 105.50, '+919876543210', true),
('HP Petrol Station', 'Dadar West, Mumbai', 19.0176, 72.8428, 104.80, '+919876543211', true),
('Indian Oil Pump', 'Bandra East, Mumbai', 19.0596, 72.8656, 106.20, '+919876543212', true),
('Bharat Petroleum', 'Andheri West, Mumbai', 19.1136, 72.8697, 105.00, '+919876543213', true),
('Reliance Petrol Pump', 'Borivali West, Mumbai', 19.2403, 72.8492, 105.90, '+919876543214', true),
('Shell Station', 'Powai, Mumbai', 19.1197, 72.9047, 106.50, '+919876543215', true),
('HP Energy', 'Thane West, Thane', 19.2183, 72.9781, 104.50, '+919876543216', true),
('Indian Oil', 'Vashi, Navi Mumbai', 19.0728, 73.0007, 105.20, '+919876543217', true),
('Bharat Petroleum', 'Kandivali East, Mumbai', 19.2074, 72.8777, 105.80, '+919876543218', true),
('Essar Petrol Pump', 'Malad West, Mumbai', 19.1865, 72.8494, 106.00, '+919876543219', true)
ON CONFLICT DO NOTHING;

-- Verify the data was inserted
SELECT COUNT(*) as total_pumps FROM public.petrol_pumps;
SELECT * FROM public.petrol_pumps LIMIT 5;

