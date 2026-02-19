# 🚨 URGENT FIX: Payment Page Issues

## Problems Identified

### 1. ₹NaN Issue
**Root Cause:** `total` vs `total_amount` column name mismatch
- Your screenshot shows the amount display as `₹NaN`
- The QR page expects `amount` from URL params
- But `parseFloat(amount)` is getting `undefined` or `NaN`

### 2. Missing Order ID
**Root Cause:** Data not flowing from summary.js to QR page
- Order ID shows as "-" in your screenshot
- URL params or localStorage not being read correctly

### 3. RLS Error
**Root Cause:** No policies allowing anon users to insert/update orders

---

## FIXES

### Fix 1: Run RLS Policy SQL

**File:** `fix_rls_policies.sql`

```bash
# Open Supabase Dashboard → SQL Editor → New Query
# Copy entire contents of fix_rls_policies.sql
# Click RUN
```

This creates policies allowing:
- ✅ INSERT orders (anon users)
- ✅ UPDATE orders (anon users)  
- ✅ SELECT orders (anon users)
- ✅ Upload to payment-screenshots bucket
- ✅ Read from payment-screenshots bucket

### Fix 2: Check Column Names

**CRITICAL:** Verify your `orders` table column name for total amount.

Run in Supabase SQL Editor:
```sql
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'orders' 
AND column_name LIKE '%total%';
```

**If it returns `total`:** You need to update summary.js line 239
**If it returns `total_amount`:** Code is correct

### Fix 3: Debug Payment Page

Add this at the TOP of qr_payment_section.html after line 150:

```javascript
// DEBUG: Log all data sources
console.log('=== PAYMENT PAGE DEBUG ===');
console.log('URL Params:', window.location.search);
console.log('localStorage pendingOrder:', localStorage.getItem('pendingOrder'));

const urlParams = new URLSearchParams(window.location.search);
console.log('orderId from URL:', urlParams.get('orderId'));
console.log('amount from URL:', urlParams.get('amount'));

const storedData = localStorage.getItem('pendingOrder');
if (storedData) {
    const parsed = JSON.parse(storedData);
    console.log('Parsed pendingOrder:', parsed);
    console.log('orderId:', parsed.orderId);
    console.log('totalAmount:', parsed.totalAmount);
}
```

**Then check browser console** when you reach the payment page.

---

## Quick Test Steps

### Step 1: Run RLS SQL
```sql
-- In Supabase SQL Editor
-- Run fix_rls_policies.sql
```

### Step 2: Test Order Creation

1. Go to `order-summary.html`
2. Fill form and submit
3. **Check browser console for errors**
4. Should redirect to `qr_payment_section.html?orderId=FD123&amount=1500`

### Step 3: Check Payment Page

1. **Look at URL bar** - does it have `?orderId=FD123&amount=1500`?
2. **Open DevTools Console** - what do the debug logs show?
3. **Check localStorage** - DevTools → Application → Local Storage → look for `pendingOrder`

---

## Common Mistakes & Fixes

### Mistake 1: Column name mismatch
**Symptom:** ₹NaN  
**Fix:** Check if your table uses `total` or `total_amount`

### Mistake 2: RLS blocking inserts
**Symptom:** "new row violates row-level security policy"  
**Fix:** Run `fix_rls_policies.sql`

### Mistake 3: Data not passing to QR page
**Symptom:** Order ID shows "-", amount shows ₹NaN  
**Fix:** Check redirect URL in summary.js line 252

### Mistake 4: Storage bucket is public
**Symptom:** Screenshots visible to everyone  
**Fix:** Bucket should be PRIVATE (already set in SQL)

---

## Verification Checklist

After running fixes:

- [ ] Run `fix_rls_policies.sql` in Supabase
- [ ] Verify policies exist: `SELECT * FROM pg_policies WHERE tablename = 'orders';`
- [ ] Create test order from summary page
- [ ] Check console - no RLS errors
- [ ] Payment page shows correct amount (not NaN)
- [ ] Payment page shows Order ID (not "-")
- [ ] QR code generates successfully
- [ ] Can submit UTR + screenshot without errors
- [ ] Order appears in pump dashboard

---

## Still Not Working?

### Debug Checklist:

1. **Browser Console Errors?**
   - Open DevTools → Console
   - Look for red errors
   - Share the exact error message

2. **Network Tab Errors?**
   - DevTools → Network
   - Filter by "Fetch/XHR"
   - Look for failed requests (red)
   - Click on failed request → Preview tab

3. **Check Supabase Logs:**
   - Supabase Dashboard → Logs → Postgres Logs
   - Look for RLS policy violations

4. **Verify Data Flow:**
   ```javascript
   // In summary.js, add console.log before redirect:
   console.log('Redirecting with:', orderId, total);
   
   // In qr_payment_section.html, add at top:
   console.log('Received:', currentOrderId, currentAmount);
   ```

---

## Next Steps

1. **Run `fix_rls_policies.sql` NOW**
2. **Add debug logs to qr_payment_section.html**
3. **Test order creation**
4. **Share console output if still broken**

The RLS fix alone should resolve the "new row violates" error. The NaN issue needs debugging to see what data is actually reaching the payment page.
