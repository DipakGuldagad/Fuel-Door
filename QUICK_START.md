# 🚀 Quick Start Guide - Fuel@Door

## Get Up and Running in 3 Minutes!

### Step 1: Start the Server (30 seconds)
```bash
# On Windows, just double-click:
start_server.bat
```
Then open: **http://localhost:8000**

### Step 2: Set Up Database (2 minutes)

1. Go to https://supabase.com and create a free account
2. Create a new project
3. In Supabase, go to **SQL Editor**
4. Copy and paste this SQL (one at a time):

**First, run this:**
```sql
-- Run supabase_setup.sql file content
```
File: `supabase_setup.sql`

**Then run this:**
```sql
-- Run fix_orders_table.sql file content  
```
File: `fix_orders_table.sql`

### Step 3: Test It! (30 seconds)

1. Go to: http://localhost:8000/pump.html
2. Click "Register" tab
3. Fill in the form (use any test data)
4. **Save the User ID** shown in the success popup
5. Go to: http://localhost:8000/login.html
6. Fill in customer details
7. Place an order
8. Login to pump dashboard with the saved User ID
9. **Order should appear!** ✅

## That's it! 🎉

Your Fuel@Door system is now running.

## Common URLs

- 🏠 **Home**: http://localhost:8000/index.html
- 👤 **Customer Login**: http://localhost:8000/login.html
- ⛽ **Pump Login**: http://localhost:8000/pump.html
- 📊 **Pump Dashboard**: http://localhost:8000/pump-dashboard.html

## Quick Troubleshooting

**"Connection failed"?**
→ Check your Supabase credentials in `config.js`

**"Orders not showing"?**
→ Check browser console (F12) for pump ID logs
→ See PUMP_DASHBOARD_FIX.md for detailed help

**Server won't start?**
→ Run: `python -m http.server 8000`

## Need More Help?

Read the full README.md for detailed instructions!

