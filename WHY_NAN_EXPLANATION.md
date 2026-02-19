# 🔍 WHY AMOUNT SHOWS NaN - ROOT CAUSE ANALYSIS

## The Problem

Your URL: `qr_payment_section.html?amount=57769.00`

**Missing:** `orderId` parameter!

## Why This Causes NaN

1. **URL only has `amount`, no `orderId`**
2. **Code checks:** `if (urlOrderId && urlAmount)` 
3. **Result:** FALSE (because urlOrderId is null)
4. **Falls back to:** localStorage
5. **localStorage might have old/invalid data**
6. **Result:** `currentAmount` gets set to undefined or invalid value
7. **When passed to `generateQRCode()`:** `parseFloat(undefined)` = **NaN**

## The REAL Problem

**Order creation in summary.js is FAILING!**

The redirect happens like this:
```javascript
// In summary.js (BROKEN)
window.location.href = `qr_payment_section.html?orderId=${orderId}&amount=${total}`;
```

But `orderId` is **undefined** because the database insert failed!

So the actual redirect becomes:
```javascript
window.location.href = `qr_payment_section.html?orderId=undefined&amount=57769.00`;
```

And the browser drops the `orderId=undefined` parameter, leaving only:
```
qr_payment_section.html?amount=57769.00
```

## How to Fix

### Step 1: Check Browser Console When Creating Order

1. Open browser console (F12)
2. Go to order-summary.html
3. Fill form and click "Place Order"
4. **Look for this in console:**

**If you see:**
```
❌ Database error: new row violates row-level security policy
```

**Then:** You MUST run the RLS fix SQL!

**If you see:**
```
✅ Order created with ID: 123
📋 Formatted Order ID: FD123
🔀 Redirecting to: qr_payment_section.html?orderId=FD123&amount=57769.00
```

**Then:** Order creation is working!

### Step 2: Run RLS Fix (If Needed)

**In Supabase SQL Editor, run:**

```sql
-- Enable RLS
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Allow anonymous users to insert
CREATE POLICY "Allow anon insert orders"
ON public.orders
FOR INSERT
TO anon
WITH CHECK (true);

-- Allow anonymous users to update
CREATE POLICY "Allow anon update orders"
ON public.orders
FOR UPDATE
TO anon
USING (true)
WITH CHECK (true);

-- Allow anonymous users to read
CREATE POLICY "Allow anon read orders"
ON public.orders
FOR SELECT
TO anon
USING (true);
```

### Step 3: Clear Browser Data

1. Open DevTools (F12)
2. Application tab → Storage → Clear site data
3. Or manually: localStorage → Right-click → Clear

### Step 4: Test Again

1. Create new order
2. Watch console
3. Should see: `Redirecting to: qr_payment_section.html?orderId=FD123&amount=57769.00`
4. Payment page should show valid amount and order ID

## Quick Test

**Open browser console and type:**

```javascript
// Check what's in localStorage
console.log(localStorage.getItem('pendingOrder'));

// Check current URL
console.log(window.location.href);

// Check URL params
const params = new URLSearchParams(window.location.search);
console.log('orderId:', params.get('orderId'));
console.log('amount:', params.get('amount'));
```

**Expected output if working:**
```
orderId: FD123
amount: 57769.00
```

**Your current output:**
```
orderId: null  ← THIS IS THE PROBLEM!
amount: 57769.00
```

## Summary

**Root Cause:** Order creation failing → No order ID generated → Redirect without orderId → Payment page can't find orderId → NaN

**Solution:** Fix RLS policies so order creation succeeds!

I've updated `qr_payment_section.html` to show you an alert when orderId is missing, so you'll know immediately if order creation failed.
