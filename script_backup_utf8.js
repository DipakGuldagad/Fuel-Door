// Utilities
(function() {
const yearEl = document.getElementById("year");
if (yearEl) yearEl.textContent = String(new Date().getFullYear());

// If user is logged in, we can optionally personalize
const user = JSON.parse(localStorage.getItem("fuelAtDoorUser") || "null");
const loginCta = document.getElementById("loginCta");
if (user && loginCta) {
loginCta.textContent = "Account";
}

// Show sections below hero only after login on the homepage; adjust hero CTA accordingly
const isLoginPage = document.body.classList.contains("login-page");
if (!isLoginPage) {
const featuresSectionEl = document.getElementById("features");
const orderSectionEl = document.getElementById("order");
const footerEl = document.querySelector(".site-footer");
const heroCta = document.querySelector(".hero .hero-actions a");

function setDisplay(el, visible) {
if (!el) return;
el.style.display = visible ? "" : "none";
}

const isLoggedIn = Boolean(user);
setDisplay(featuresSectionEl, isLoggedIn);
setDisplay(orderSectionEl, isLoggedIn);
setDisplay(footerEl, isLoggedIn);

if (heroCta) {
if (isLoggedIn && orderSectionEl) {
heroCta.setAttribute("href", "#order");
heroCta.addEventListener("click", function(e) {
e.preventDefault();
orderSectionEl.scrollIntoView({ behavior: "smooth", block: "start" });
});
} else {
heroCta.setAttribute("href", "login.html");
}
}
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
const loginsTable = 'logins';

// Order section logic
(function setupOrderSection() {
const orderRoot = document.getElementById("orderSection");
if (!orderRoot) return;

const fuelCards = Array.from(orderRoot.querySelectorAll(".fuel-card"));
const qtyInput = document.getElementById("qtyInput");
const presetButtons = Array.from(orderRoot.querySelectorAll(".preset-btn"));
const spinButtons = Array.from(orderRoot.querySelectorAll(".spin-btn"));

const DELIVERY_FEE = 49;
const TAX_RATE = 0.05;
const MIN_QTY = 5;
const MAX_QTY = 100;

function getSelectedFuel() {
const selected = fuelCards.find(c => c.classList.contains("selected")) || fuelCards[0];
return {
type: selected.getAttribute("data-type"),
price: Number(selected.getAttribute("data-price")),
unit: selected.getAttribute("data-unit")
};
}

function updateUnitDisplay() {
const { unit } = getSelectedFuel();
const unitDisplays = document.querySelectorAll("[id^=\"unitDisplay\"], [id^=\"unitHint\"]");
unitDisplays.forEach(el => {
el.textContent = unit;
});
}

fuelCards.forEach(card => {
card.addEventListener("click", () => {
fuelCards.forEach(c => { 
c.classList.remove("selected"); 
c.setAttribute("aria-pressed", "false"); 
c.setAttribute("aria-selected", "false"); 
});
card.classList.add("selected");
card.setAttribute("aria-pressed", "true");
card.setAttribute("aria-selected", "true");
updateUnitDisplay();
});
});

presetButtons.forEach(btn => {
btn.addEventListener("click", () => {
qtyInput.value = String(Math.max(MIN_QTY, Math.min(MAX_QTY, Number(btn.getAttribute("data-qty")))));
});
});

spinButtons.forEach(btn => {
btn.addEventListener("click", () => {
const step = Number(btn.getAttribute("data-step"));
qtyInput.value = String(Math.max(MIN_QTY, Math.min(MAX_QTY, (Number(qtyInput.value) || 0) + step)));
});
});

// Proceed to summary button
const proceedBtn = document.getElementById("proceedToSummary");
if (proceedBtn) {
proceedBtn.addEventListener("click", function() {
const { type, price, unit } = getSelectedFuel();
const qty = Number(qtyInput.value) || 0;

// Store order data
const orderData = {
type: type,
price: price,
unit: unit,
quantity: qty,
timestamp: new Date().toISOString(),
login_id: localStorage.getItem('fuelAtDoorLoginId') || null
};

localStorage.setItem("fuelAtDoorOrder", JSON.stringify(orderData));

// Redirect to summary page
window.location.href = "order-summary.html";
});
}

updateUnitDisplay();
})();

// Login form logic
const form = document.getElementById("loginForm");
if (!form) return;

const nameInput = document.getElementById("name");
const mobileInput = document.getElementById("mobile");
const panInput = document.getElementById("pan");
const vehicleInput = document.getElementById("vehicle");
const otpInput = document.getElementById("otp");
const sendOtpBtn = document.getElementById("sendOtp");
const verifyOtpBtn = document.getElementById("verifyOtp");

const nameError = document.getElementById("nameError");
const mobileError = document.getElementById("mobileError");
const panError = document.getElementById("panError");
const vehicleError = document.getElementById("vehicleError");
const otpError = document.getElementById("otpError");
const otpHint = document.getElementById("otpHint");
const formSuccess = document.getElementById("formSuccess");

// Default login credentials
const DEFAULT_CREDENTIALS = {
name: "dipak",
mobile: "9876542345",
pan: "ABCDE1234F",
vehicle: "MH12FR3214"
};

const patterns = {
name: /^[A-Za-z ]{2,}$/,
// Accept either Indian 10-digit (starting 6-9) or E.164 (+XXXXXXXX)
mobile: /^(?:[6-9][0-9]{9}|\+[1-9][0-9]{7,14})$/,
pan: /^[A-Z]{5}[0-9]{4}[A-Z]$/,
vehicle: /^[A-Z]{2}[0-9]{2}[A-Z]{2}[0-9]{4}$/,
otp: /^[0-9]{6}$/
};

function validateName() {
const value = nameInput.value.trim();
if (!patterns.name.test(value)) {
nameError.textContent = "Enter a valid full name (letters and spaces).";
return false;
}
nameError.textContent = "";
return true;
}

function validateMobile() {
const value = mobileInput.value.trim();
if (!patterns.mobile.test(value)) {
mobileError.textContent = "Enter +countrycode number (e.g., +14155551212) or 10-digit Indian number.";
return false;
}
mobileError.textContent = "";
return true;
}

function validatePan() {
const value = panInput.value.trim().toUpperCase();
panInput.value = value;
if (!patterns.pan.test(value)) {
panError.textContent = "PAN must be ABCDE1234F (5 letters, 4 digits, 1 letter).";
return false;
}
panError.textContent = "";
return true;
}

function validateVehicle() {
const value = vehicleInput.value.trim().toUpperCase();
vehicleInput.value = value;
if (!patterns.vehicle.test(value)) {
vehicleError.textContent = "Vehicle no. must be MH12AB1234 (AA99AA9999).";
return false;
}
vehicleError.textContent = "";
return true;
}

function checkDefaultCredentials(payload) {
return payload.name.toLowerCase() === DEFAULT_CREDENTIALS.name.toLowerCase() &&
   payload.mobile === DEFAULT_CREDENTIALS.mobile &&
   payload.pan === DEFAULT_CREDENTIALS.pan &&
   payload.vehicle === DEFAULT_CREDENTIALS.vehicle;
}

async function sendOtp() {
otpError.textContent = "";
otpHint.textContent = "";
localStorage.removeItem('fuelAtDoorOtpVerified');
if (!validateMobile()) return;
if (!supabaseClient || !supabaseClient.auth) {
otpError.textContent = "Service unavailable. Try again.";
return;
}
const raw = mobileInput.value.trim();
const phone = raw.startsWith('+') ? raw : `+91${raw}`; // assume India
try {
const { error } = await supabaseClient.auth.signInWithOtp({ phone, options: { channel: 'sms' } });
if (error) throw error;
otpHint.textContent = "OTP sent via SMS. It will be valid for a few minutes.";
} catch (err) {
const msg = (err && (err.message || err.error_description || err.error)) ? (err.message || err.error_description || err.error) : "Failed to send OTP. Try again.";
otpError.textContent = msg;
console.warn("sendOtp error:", err);
}
}

async function verifyOtp() {
otpError.textContent = "";
otpHint.textContent = "";
if (!validateMobile()) return;
if (!patterns.otp.test(otpInput.value.trim())) {
otpError.textContent = "Enter the 6-digit OTP.";
return;
}
if (!supabaseClient || !supabaseClient.auth) {
otpError.textContent = "Service unavailable. Try again.";
return;
}
const raw = mobileInput.value.trim();
const phone = raw.startsWith('+') ? raw : `+91${raw}`;
const token = otpInput.value.trim();
try {
const { data, error } = await supabaseClient.auth.verifyOtp({ phone, token, type: 'sms' });
if (error) throw error;
// Logged in session is returned in data.session
localStorage.setItem('fuelAtDoorOtpVerified', 'true');
otpHint.textContent = "OTP verified.";
} catch (err) {
const msg = (err && (err.message || err.error_description || err.error)) ? (err.message || err.error_description || err.error) : "Verification failed. Try again.";
otpError.textContent = msg;
console.warn("verifyOtp error:", err);
}
}

if (sendOtpBtn) sendOtpBtn.addEventListener('click', sendOtp);
if (verifyOtpBtn) verifyOtpBtn.addEventListener('click', verifyOtp);

async function performLogin(payload) {
// Require OTP
if (localStorage.getItem('fuelAtDoorOtpVerified') !== 'true') {
formSuccess.textContent = "Please verify OTP before logging in.";
return;
}

// Check for default credentials
if (checkDefaultCredentials(payload)) {
// For default credentials, also create a login row to link orders
try {
if (supabaseClient) {
const { data, error } = await supabaseClient.from(loginsTable).insert(payload).select('id').single();
if (!error && data) {
localStorage.setItem("fuelAtDoorLoginId", data.id);
}
}
} catch (err) {
console.warn("Supabase write (default user) failed:", err);
}

localStorage.setItem("fuelAtDoorUser", JSON.stringify(payload));
formSuccess.textContent = "Welcome back, Dipak! Redirecting to order page...";

// Show order section immediately
const orderEl = document.getElementById("order");
if (orderEl) {
orderEl.style.display = "";
orderEl.scrollIntoView({ behavior: "smooth", block: "start" });
}
return;
}

// Regular login process for other users
let savedRemotely = false;
if (supabaseClient) {
try {
const { data, error } = await supabaseClient.from(loginsTable).insert(payload).select('id').single();
if (!error) {
savedRemotely = true;
if (data && data.id) localStorage.setItem('fuelAtDoorLoginId', data.id);
}
} catch (err) {
console.warn("Supabase write failed:", err);
}
}

localStorage.setItem("fuelAtDoorUser", JSON.stringify(payload));

formSuccess.textContent = savedRemotely ? "Login successful! You can place your order below." : "Saved locally. You can place your order below.";
const orderEl = document.getElementById("order");
if (orderEl) {
orderEl.style.display = "";
orderEl.scrollIntoView({ behavior: "smooth", block: "start" });
}
}

nameInput.addEventListener("input", validateName);
mobileInput.addEventListener("input", validateMobile);
panInput.addEventListener("input", validatePan);
vehicleInput.addEventListener("input", validateVehicle);

// Quick login button functionality
const quickLoginBtn = document.getElementById("quickLogin");
if (quickLoginBtn) {
quickLoginBtn.addEventListener("click", function() {
// Fill form with default credentials
nameInput.value = DEFAULT_CREDENTIALS.name;
mobileInput.value = DEFAULT_CREDENTIALS.mobile;
panInput.value = DEFAULT_CREDENTIALS.pan;
vehicleInput.value = DEFAULT_CREDENTIALS.vehicle;

// Clear any existing errors
nameError.textContent = "";
mobileError.textContent = "";
panError.textContent = "";
vehicleError.textContent = "";

// Require OTP even for quick login
formSuccess.textContent = "Please verify OTP, then click Quick Login again.";
});
}

form.addEventListener("submit", function(e) {
e.preventDefault();
const ok = [validateName(), validateMobile(), validatePan(), validateVehicle()].every(Boolean);
if (!ok) {
formSuccess.textContent = "";
return;
}

const payload = {
name: nameInput.value.trim(),
mobile: mobileInput.value.trim(),
pan: panInput.value.trim().toUpperCase(),
vehicle: vehicleInput.value.trim().toUpperCase()
};

performLogin(payload);
});
})();
