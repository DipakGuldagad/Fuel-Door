# Fuel@Door - Fuel Delivery System

A complete fuel delivery management system where customers can order fuel and petrol pumps can manage their orders through a dashboard.

## 🚀 Quick Start

### Option 1: Using Python (Recommended)
```bash
# Double-click the file
start_server.bat
```

Then open your browser and go to: **http://localhost:8000**

### Option 2: Using Python directly
```bash
python -m http.server 8000
```

Then open your browser and go to: **http://localhost:8000**

### Option 3: Using Node.js (if you have it installed)
```bash
npx http-server -p 8000
```

## 📋 Prerequisites

- **Python 3** (for running the server) - Already installed on Windows
- **Web Browser** (Chrome, Firefox, Edge, etc.)
- **Supabase Account** (Free tier is fine)

## 🔧 Setup Instructions

### Step 1: Configure Supabase

1. **Create a Supabase account** (if you don't have one)
   - Go to: https://supabase.com
   - Sign up for free

2. **Create a new project**
   - Click "New Project"
   - Choose a name (e.g., "FuelAtDoor")
   - Set a database password (save this!)
   - Wait for project to be created

3. **Get your project credentials**
   - Go to Settings → API
   - Copy these values:
     - **Project URL**: `https://xxxxx.supabase.co`
     - **anon public key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6...`

4. **Update config.js** (already configured for demo)
   ```javascript
   // File is already configured with demo credentials
   // If you want to use your own Supabase, update these:
   window.SUPABASE_URL = 'your-project-url';
   window.SUPABASE_ANON_KEY = 'your-anon-key';
   ```

### Step 2: Set Up Database Tables

1. **Open Supabase SQL Editor**
   - In your Supabase dashboard, go to SQL Editor

2. **Run the setup script**
   - Open `supabase_setup.sql` file from this project
   - Copy the entire content
   - Paste into Supabase SQL Editor
   - Click "Run"

3. **Run the fix script** (for orders table)
   - Open `fix_orders_table.sql` file
   - Copy and paste into SQL Editor
   - Click "Run"

4. **Verify tables were created**
   - Go to Table Editor in Supabase
   - You should see:
     - `petrol_pumps` table
     - `orders` table
     - `logins` table

### Step 3: Configure Location API (Optional)

LocationIQ API is already configured in `config.js`. If you want to use your own:
- Sign up at: https://locationiq.com
- Get your API key
- Update in `config.js`:
  ```javascript
  window.LOCATIONIQ_API_KEY = 'your-api-key';
  ```

## 🎯 Running the Project

### Start the Server

**Windows:**
```bash
# Simply double-click:
start_server.bat

# OR run in terminal:
python -m http.server 8000
```

**Mac/Linux:**
```bash
python3 -m http.server 8000
```

### Open in Browser

- **Home Page**: http://localhost:8000/index.html
- **Customer Login**: http://localhost:8000/login.html
- **Pump Registration/Login**: http://localhost:8000/pump.html
- **Pump Dashboard**: http://localhost:8000/pump-dashboard.html (after login)

## 📖 How to Use

### For Customers:

1. **Go to Home Page**
   - Open: http://localhost:8000/index.html
   - Click "Order Now"

2. **Login/Register**
   - Fill in your details (Name, Mobile, PAN)
   - Click "Login"

3. **Place Order**
   - Select your location (Current location or Manual)
   - Choose fuel type and quantity
   - Select a petrol pump
   - Confirm and pay
   - Order will be assigned to the nearest pump

### For Petrol Pumps:

1. **Register Your Pump**
   - Go to: http://localhost:8000/pump.html
   - Click "Register" tab
   - Fill in all details
   - **Save your User ID** (e.g., "BharatPetro-XY123")

2. **Login to Dashboard**
   - Go to: http://localhost:8000/pump.html
   - Enter your User ID and Password
   - Click "Sign In"

3. **View Orders**
   - Orders will appear automatically
   - You can see customer details
   - Contact customers directly

## 🗂️ Project Structure

```
Fuel@Door/
├── index.html              # Home page
├── login.html              # Customer login/order placement
├── pump.html               # Pump login/registration
├── pump-dashboard.html     # Pump dashboard for managing orders
├── config.js               # Supabase configuration
├── script.js               # Main customer order logic
├── pump.js                 # Pump authentication logic
├── styles.css              # Styling
├── supabase_setup.sql      # Database setup script
├── start_server.bat        # Quick start script (Windows)
├── run_https_server.py     # HTTPS server (optional)
└── qr_payment_section.html # Payment page
```

## 🔍 Testing the Fix

After the recent fix, orders should now appear on pump dashboards. To test:

### Test Flow:
1. **Register a pump** (save the User ID)
2. **Place a customer order** and select that pump
3. **Login to pump dashboard** with the saved User ID
4. **Order should appear immediately**

### Debug Mode:
- Open browser console (F12)
- Check for logs showing:
  - ✅ Pump ID when creating order
  - ✅ Pump ID when loading dashboard
  - ✅ Number of orders found

## ⚠️ Troubleshooting

### Server won't start
- Make sure Python is installed: `python --version`
- Try: `python -m http.server 8000`

### "Cannot connect to Supabase"
- Check your internet connection
- Verify credentials in `config.js`
- Check Supabase project is active

### Orders not showing on pump dashboard
- Check browser console (F12) for errors
- Verify pump IDs match between order and pump
- See `PUMP_DASHBOARD_FIX.md` for details

### Location not working
- Allow browser location access
- Check LocationIQ API key in config.js
- Try manual address entry instead

### Database errors
- Re-run `supabase_setup.sql`
- Re-run `fix_orders_table.sql`
- Check Supabase project is active

## 🛠️ Development

### Adding New Features

Key files to modify:
- `script.js` - Customer order logic
- `pump.js` - Pump authentication
- `pump-dashboard.html` - Pump dashboard

### Database Schema

**petrol_pumps table:**
- `id` - Auto-increment (Primary Key)
- `user_id` - Unique identifier for login
- `company_name` - Company name
- `location` - Physical location
- `fuel_price` - Price per liter
- Other details...

**orders table:**
- `id` - Auto-increment (Primary Key)
- `assigned_pump_id` - Links to petrol_pumps.id
- `customer_name` - Customer name
- `fuel_type` - petrol/diesel
- `quantity` - Amount ordered
- `total_amount` - Total price
- `status` - Order status
- Other details...

## 📝 Notes

- This is a demo project for learning/testing
- Uses Supabase free tier (sufficient for development)
- Browser console shows detailed logging for debugging
- All data is stored in Supabase cloud database
- No data is stored locally (except temporary session data)

## 🤝 Support

If you encounter issues:
1. Check browser console (F12) for errors
2. Verify Supabase connection is working
3. Ensure database tables are created
4. See individual fix guides:
   - `PUMP_DASHBOARD_FIX.md`
   - `PETROL_PUMP_FIX_GUIDE.md`

## 📄 License

This is a demo project for educational purposes.

---

**Made with ❤️ for Fuel@Door**

