# Fix Guide: Petrol Pump Registration Latitude/Longitude Error

## 🚨 **Error**: 
```
Registration failed: Could not find the 'latitude' column of 'petrol_pumps' in the schema cache
```

## 🔍 **Root Cause**
The `petrol_pumps` table is missing the `latitude` and `longitude` columns that the pump registration code expects to insert.

## 🛠️ **Complete Solution**

### **Step 1: Diagnose Current Database State**

**Option A: Using Test Page (Recommended)**
1. Open `test_database.html` in your browser
2. Click "Check Pump Columns" 
3. This will show you exactly which columns are missing

**Option B: Using SQL Query**
```sql
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public'
AND table_name = 'petrol_pumps'
ORDER BY ordinal_position;
```

### **Step 2: Fix the Database Structure**

Run the `fix_petrol_pumps_table.sql` file in your Supabase SQL Editor:

1. Go to your Supabase Dashboard
2. Navigate to SQL Editor
3. Paste the contents of `fix_petrol_pumps_table.sql`
4. Click "Run"

This script will:
- ✅ Add missing `latitude` and `longitude` columns
- ✅ Add any other missing columns (company_name, owner_name, etc.)
- ✅ Set up proper constraints and indexes
- ✅ Configure Row Level Security policies

### **Step 3: Verify the Fix**

1. Run the test page again: `test_database.html`
2. Click "Check Pump Columns"
3. All columns should show ✅ green checkmarks

### **Step 4: Test Petrol Pump Registration**

1. Go to `pump.html`
2. Try registering a new petrol pump
3. The registration should now work without the latitude/longitude error

## 📋 **Expected Database Schema After Fix**

The `petrol_pumps` table should have these columns:

| Column | Type | Required | Description |
|--------|------|----------|-------------|
| id | BIGSERIAL | ✅ | Primary key |
| user_id | TEXT | ✅ | Unique pump identifier |
| company_name | TEXT | ✅ | Pump company name |
| location | TEXT | ✅ | Address description |
| latitude | DECIMAL(10,8) | ❌ | GPS latitude coordinate |
| longitude | DECIMAL(11,8) | ❌ | GPS longitude coordinate |
| owner_name | TEXT | ✅ | Owner full name |
| owner_mobile | TEXT | ✅ | Owner mobile number |
| license_number | TEXT | ✅ | Business license number |
| fuel_price | DECIMAL(10,2) | ✅ | Current fuel price per liter |
| password_hash | TEXT | ✅ | Hashed password |
| created_at | TIMESTAMP | ❌ | Registration timestamp |
| updated_at | TIMESTAMP | ❌ | Last update timestamp |
| status | TEXT | ❌ | 'active', 'inactive', or 'suspended' |

## 🎯 **What This Fixes**

- ✅ **"Could not find the 'latitude' column"** → Adds missing latitude column
- ✅ **"Could not find the 'longitude' column"** → Adds missing longitude column  
- ✅ **Other missing column errors** → Adds all required columns
- ✅ **Pump registration failures** → Registration will work properly
- ✅ **Location-based pump finding** → Customer app can find nearby pumps

## 🔄 **If You Still Get Errors**

1. **Check that script ran successfully**: Look for "success message" at the end
2. **Refresh your browser cache**: Clear cache and reload the pump registration page
3. **Verify in Supabase**: Go to Table Editor and check that petrol_pumps has all columns
4. **Check policies**: Ensure RLS policies allow insertions

## 📞 **Need Help?**

1. Run the diagnostic: `test_database.html` → "Check Pump Columns"
2. Check the browser console for detailed error messages
3. Verify your Supabase connection in `config.js`

## 🚀 **After Fix is Complete**

Your petrol pump registration will:
- ✅ Successfully save pump details to database
- ✅ Store GPS coordinates (if geocoding works)  
- ✅ Generate unique pump IDs
- ✅ Allow pump login and dashboard access
- ✅ Enable customer app to find nearby pumps
