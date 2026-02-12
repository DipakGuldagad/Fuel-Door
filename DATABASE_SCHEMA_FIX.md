# Database Schema Fix - pump_location Error

## Problem
```
Warning: Order could not be saved to database: Could not find the 'pump_location' column of 'orders' in the schema cache
```

## Root Cause
The code was trying to save `pump_name` and `pump_location` fields to the `orders` table, but these columns don't exist in the database schema. These fields are redundant because:

1. We already store `assigned_pump_id` which links to the `petrol_pumps` table
2. We can get pump name and location by joining with the `petrol_pumps` table
3. These fields violate database normalization principles

## Solution
Modified `script.js` to:

1. **Create two separate objects**:
   - `orderData` - Contains all data including pump_name and pump_location for UI/localStorage
   - `orderDataForDB` - Contains only database-compatible fields

2. **Keep pump details for UI**:
   - Store `pump_name` and `pump_location` in `orderData` for use in:
     - localStorage
     - Payment success page (qr_payment_section.html)
     - Customer-facing displays

3. **Save only valid fields to database**:
   - Use `orderDataForDB` when inserting into Supabase
   - This object excludes `pump_name` and `pump_location`
   - These fields don't exist in the orders table schema

## Code Changes

### Before (Error-Prone)
```javascript
const orderData = {
    customer_location: selectedLocation.address,
    assigned_pump_id: nearestPump.id,
    fuel_type: selectedFuelType,
    // ... other fields ...
    pump_name: nearestPump.company_name,      // ❌ Not in DB schema
    pump_location: nearestPump.location       // ❌ Not in DB schema
};

// This would fail because pump_name and pump_location don't exist
await supabaseClient.from('orders').insert([orderData]);
```

### After (Fixed)
```javascript
const orderData = {
    customer_location: selectedLocation.address,
    assigned_pump_id: nearestPump.id,
    fuel_type: selectedFuelType,
    // ... other valid fields ...
};

// Create DB-compatible version without pump_name/pump_location
const orderDataForDB = { ...orderData };

// Keep pump details for UI only (not saved to DB)
orderData.pump_name = nearestPump.company_name;
orderData.pump_location = nearestPump.location;

// Save to localStorage (with pump details for UI)
localStorage.setItem('pendingOrder', JSON.stringify(orderData));

// Save to database (without pump details)
await supabaseClient.from('orders').insert([orderDataForDB]); // ✅ Works
```

## Database Schema

The `orders` table has these columns:

### Valid Columns (Can Save)
- `id` - Primary key
- `customer_location` - Customer address
- `assigned_pump_id` - Links to petrol_pumps table
- `fuel_type` - petrol/diesel/ev
- `quantity` - Amount ordered
- `unit` - L or kWh
- `price_per_liter` - Fuel price
- `fuel_cost` - Cost before delivery
- `delivery_fee` - Delivery charge
- `total_amount` - Total cost
- `status` - Order status
- `customer_name` - Customer name
- `customer_mobile` - Customer phone
- `created_at` - Timestamp
- Other valid fields...

### Invalid Columns (Cannot Save)
- ❌ `pump_name` - Does not exist in schema
- ❌ `pump_location` - Does not exist in schema

These are accessible via the foreign key relationship:
```sql
SELECT o.*, p.company_name as pump_name, p.location as pump_location
FROM orders o
JOIN petrol_pumps p ON o.assigned_pump_id = p.id
```

## Why This Approach?

### Separation of Concerns
- **UI Data**: Store pump details for immediate display needs
- **Database Data**: Store only normalized data with relationships

### Best Practices
1. **Don't duplicate data** - Use foreign keys instead
2. **Normalize database** - Store pump details once in `petrol_pumps`
3. **Keep UI data separate** - For better user experience

### Benefits
- ✅ No more database errors
- ✅ Cleaner database schema
- ✅ Better data consistency
- ✅ UI still shows pump name/location
- ✅ Can update pump details without updating all orders

## Testing

### Verify the Fix

1. **Place an order**:
   - Go to login.html
   - Place a customer order
   - Check browser console (F12)
   - Should see: "Order saved to database successfully"

2. **Check payment page**:
   - Complete payment
   - Success page should show pump name and location
   - These come from localStorage, not database

3. **Check pump dashboard**:
   - Login to pump-dashboard.html
   - Order should appear
   - Can join with petrol_pumps to get pump details

## Related Files

- ✅ `script.js` - Fixed to use orderDataForDB for database inserts
- ✅ `qr_payment_section.html` - Still works (uses localStorage orderData)
- ✅ `pump-dashboard.html` - Can join with petrol_pumps table for pump details

## Summary

The fix separates UI data (pump_name, pump_location) from database data. This allows:
- Orders to save successfully to database
- UI to still show pump details from localStorage
- Pump dashboard to display orders correctly
- Database to maintain proper relationships

No database migration needed - we're simply not saving those fields anymore!

