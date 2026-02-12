// Order Summary Page Logic with Pump Selection
(function() {
const yearEl = document.getElementById("year");
if (yearEl) yearEl.textContent = String(new Date().getFullYear());

// Get order data from localStorage
const orderData = JSON.parse(localStorage.getItem("fuelAtDoorOrder") || "{}");
const userData = JSON.parse(localStorage.getItem("fuelAtDoorUser") || "{}");

// If no order data, redirect back to login
if (!orderData.type) {
window.location.href = "login.html";
return;
}

// Supabase client
let supabaseClient = null;
try {
if (window.SUPABASE_URL && window.SUPABASE_ANON_KEY && window.supabase) {
supabaseClient = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
}
} catch (err) {
console.warn("Supabase init failed:", err);
}

const ordersTable = 'orders';
const petrolPumpsTable = 'petrol_pumps';

// Calculate pricing - Variable delivery fee based on quantity
const BASE_DELIVERY_FEE = 50; // Base fee for up to 10 liters
const EXTRA_DELIVERY_FEE_PER_LITER = 5; // Extra fee per liter above 10L
const TAX_RATE = 0.05;

function calculateDeliveryFee(quantity) {
    if (quantity <= 10) {
        return BASE_DELIVERY_FEE;
    }
    const extraLiters = quantity - 10;
    return BASE_DELIVERY_FEE + (extraLiters * EXTRA_DELIVERY_FEE_PER_LITER);
}

function calculateOrder() {
const { type, price, unit, quantity } = orderData;
const fuelCost = price * quantity;
const deliveryFee = calculateDeliveryFee(quantity);
const tax = (fuelCost + deliveryFee) * TAX_RATE;
const total = fuelCost + deliveryFee + tax;

// Update display
document.getElementById("orderType").textContent = type;
document.getElementById("orderQuantity").textContent = quantity + " " + unit;
document.getElementById("orderPrice").textContent = formatCurrency(fuelCost);
document.getElementById("deliveryFeeDisplay").textContent = formatCurrency(deliveryFee);
document.getElementById("orderTax").textContent = formatCurrency(tax);
document.getElementById("orderTotal").textContent = formatCurrency(total);

return { fuelCost, deliveryFee, tax, total };
}

function formatCurrency(v) {
return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(v);
}

// Load petrol pumps
async function loadPetrolPumps() {
const petrolPumpSelect = document.getElementById('petrolPump');

if (!supabaseClient) {
petrolPumpSelect.innerHTML = '<option value="">Supabase not configured</option>';
return;
}

try {
const { data: pumps, error } = await supabaseClient
.from(petrolPumpsTable)
.select('id, company_name, location, fuel_price')
.eq('status', 'active')
.order('company_name');

if (error) {
throw new Error(error.message);
}

// Clear loading option
petrolPumpSelect.innerHTML = '<option value="">Select a petrol pump</option>';

// Add pump options
pumps.forEach(pump => {
const option = document.createElement('option');
option.value = pump.id;
option.textContent = `${pump.company_name} - ${pump.location} (₹${pump.fuel_price}/L)`;
petrolPumpSelect.appendChild(option);
});

if (pumps.length === 0) {
petrolPumpSelect.innerHTML = '<option value="">No petrol pumps available</option>';
}

} catch (error) {
console.error('Error loading petrol pumps:', error);
petrolPumpSelect.innerHTML = '<option value="">Error loading pumps</option>';
}
}

// Initialize order display and load pumps
calculateOrder();
loadPetrolPumps();

// Form validation
const form = document.getElementById("deliveryForm");
const addressInput = document.getElementById("address");
const pincodeInput = document.getElementById("pincode");
const deliveryTimeInput = document.getElementById("deliveryTime");
const petrolPumpInput = document.getElementById("petrolPump");
const addressError = document.getElementById("addressError");
const pincodeError = document.getElementById("pincodeError");
const deliveryTimeError = document.getElementById("deliveryTimeError");
const petrolPumpError = document.getElementById("petrolPumpError");
const orderSuccess = document.getElementById("orderSuccess");

const patterns = {
pincode: /^[1-9][0-9]{5}$/
};

function validateAddress() {
const value = addressInput.value.trim();
if (value.length < 10) {
addressError.textContent = "Please enter a complete address (at least 10 characters).";
return false;
}
addressError.textContent = "";
return true;
}

function validatePincode() {
const value = pincodeInput.value.trim();
if (!patterns.pincode.test(value)) {
pincodeError.textContent = "Enter a valid 6-digit pincode.";
return false;
}
pincodeError.textContent = "";
return true;
}

function validateDeliveryTime() {
const value = deliveryTimeInput.value;
if (!value) {
deliveryTimeError.textContent = "Please select a delivery time slot.";
return false;
}
deliveryTimeError.textContent = "";
return true;
}

function validatePetrolPump() {
const value = petrolPumpInput.value;
if (!value) {
petrolPumpError.textContent = "Please select a petrol pump.";
return false;
}
petrolPumpError.textContent = "";
return true;
}

addressInput.addEventListener("input", validateAddress);
pincodeInput.addEventListener("input", validatePincode);
deliveryTimeInput.addEventListener("change", validateDeliveryTime);
petrolPumpInput.addEventListener("change", validatePetrolPump);

form.addEventListener("submit", async function(e) {
e.preventDefault();

const isValid = [
validateAddress(), 
validatePincode(), 
validateDeliveryTime(),
validatePetrolPump()
].every(Boolean);

if (!isValid) {
orderSuccess.textContent = "";
return;
}

const { fuelCost, deliveryFee, tax, total } = calculateOrder();

// Get selected pump details
const selectedPumpId = parseInt(petrolPumpInput.value);
const selectedPumpText = petrolPumpInput.options[petrolPumpInput.selectedIndex].text;

const orderPayload = {
// Customer details
customer_name: userData.name,
customer_mobile: userData.mobile,
// Order details from localStorage
fuel_type: orderData.type,
quantity: orderData.quantity,
unit: orderData.unit,
price_per_liter: orderData.price,
// Delivery details
customer_location: addressInput.value.trim(),
landmark: document.getElementById("landmark").value.trim(),
pincode: pincodeInput.value.trim(),
delivery_time: deliveryTimeInput.value,
// Pump assignment
assigned_pump_id: selectedPumpId,
// Pricing
fuel_cost: fuelCost,
delivery_fee: deliveryFee,
total_amount: total,
// Status
status: "pending",
created_at: new Date().toISOString()
};

try {
if (!supabaseClient) {
throw new Error("Database connection not available");
}

const { data, error } = await supabaseClient
.from(ordersTable)
.insert([orderPayload])
.select('id')
.single();

if (error) {
throw new Error(error.message);
}

// Success
orderSuccess.innerHTML = `
<strong>Order placed successfully!</strong><br>
Order ID: ${data.id}<br>
Assigned to: ${selectedPumpText.split(' - ')[0]}<br>
You will receive a confirmation call shortly.
`;

// Disable form
form.querySelectorAll("input, textarea, select, button").forEach(el => {
el.disabled = true;
});

// Clear order data
localStorage.removeItem("fuelAtDoorOrder");

} catch (error) {
console.error("Order submission error:", error);
orderSuccess.innerHTML = `
<div style="color: #dc2626;">
<strong>Order submission failed:</strong><br>
${error.message}
</div>
`;
}
});

})();
