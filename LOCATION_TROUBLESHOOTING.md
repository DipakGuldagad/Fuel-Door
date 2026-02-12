# Location Error Troubleshooting Guide

## Problem: "Failed to fetch" or Location Errors

### Quick Fix Options:

### ✅ Option 1: Use Demo Location (FASTEST)
1. Open http://localhost:8000/login.html
2. Click the **"Use Demo Location (Test Mode)"** button (orange border)
3. This bypasses geolocation entirely for testing

### ✅ Option 2: Enable Location Permissions
1. Look for the **location icon** in your browser's address bar (🔒 or ⓘ)
2. Click it and select **"Always allow location"**
3. Refresh the page
4. Click "Use Current Location"

### ✅ Option 3: Check Browser Console
1. Press **F12** to open Developer Tools
2. Go to the **Console** tab
3. Look for the debug output starting with "=== Location Debug Info ==="
4. It will tell you exactly what's wrong:
   - ❌ Permission denied → Allow location in browser settings
   - ❌ Position unavailable → Check Windows location settings
   - ❌ Not secure context → You need HTTPS (but localhost should work)

### ✅ Option 4: Manual Address Entry
1. Scroll down on the location page
2. Use the **"Enter Address Manually"** option
3. Type any address and click "Search This Address"

---

## Common Issues & Solutions

### Issue 1: "Permission Denied"
**Solution:**
- Chrome: Settings → Privacy and Security → Site Settings → Location → Allow
- Firefox: Address bar (🔒) → Permissions → Location → Allow
- Clear browser cache and try again

### Issue 2: "Position Unavailable"
**Solution:**
- **Windows 10/11:** Settings → Privacy → Location → Turn ON
- Make sure Windows Location Service is enabled
- Restart browser after enabling

### Issue 3: HTTP vs HTTPS
**Problem:** Geolocation only works on HTTPS or localhost
**Solution:**
- ✅ Using `http://localhost:8000` is fine
- ❌ Using `http://192.168.x.x:8000` won't work (use Demo Location instead)

---

## Testing Location Manually

1. Open browser console (F12)
2. Type: `debugGetLocation()`
3. Press Enter
4. This will show detailed error messages

---

## For Development/Testing

**Just use the Demo Location button!** It's specifically added for testing when:
- You don't want to share your real location
- Geolocation is blocked by browser/system
- You're developing and need quick testing

The demo location uses Mumbai coordinates (19.0760, 72.8777) and will find nearest pumps from your database.

