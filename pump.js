(function() {
// Initialize Supabase client
const supa = window.supabase?.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
if (!supa) {
	alert('Supabase not configured. Please set SUPABASE_URL and SUPABASE_ANON_KEY in config.js');
	return;
}

// DOM Elements
const loginTab = document.getElementById('loginTab');
const registerTab = document.getElementById('registerTab');
const loginSection = document.getElementById('loginSection');
const registerSection = document.getElementById('registerSection');
const successModal = document.getElementById('successModal');
const generatedUserId = document.getElementById('generatedUserId');
const closeModal = document.getElementById('closeModal');

// Login Form Elements
const loginForm = document.getElementById('loginForm');
const loginUserId = document.getElementById('loginUserId');
const loginPassword = document.getElementById('loginPassword');
const toggleLoginPassword = document.getElementById('toggleLoginPassword');
const loginUserIdError = document.getElementById('loginUserIdError');
const loginPasswordError = document.getElementById('loginPasswordError');
const loginMessage = document.getElementById('loginMessage');
const loginBtn = document.getElementById('loginBtn');

// Registration Form Elements
const registerForm = document.getElementById('registerForm');
const companyName = document.getElementById('companyName');
const location = document.getElementById('location');
const ownerName = document.getElementById('ownerName');
const ownerMobile = document.getElementById('ownerMobile');
const licenseNumber = document.getElementById('licenseNumber');
const fuelPrice = document.getElementById('fuelPrice');
const registerPassword = document.getElementById('registerPassword');
const toggleRegisterPassword = document.getElementById('toggleRegisterPassword');
const registerMessage = document.getElementById('registerMessage');
const registerBtn = document.getElementById('registerBtn');

// Error elements for registration
const companyNameError = document.getElementById('companyNameError');
const locationError = document.getElementById('locationError');
const ownerNameError = document.getElementById('ownerNameError');
const ownerMobileError = document.getElementById('ownerMobileError');
const licenseNumberError = document.getElementById('licenseNumberError');
const fuelPriceError = document.getElementById('fuelPriceError');
const registerPasswordError = document.getElementById('registerPasswordError');

// Constants
const PETROL_PUMPS_TABLE = 'petrol_pumps';

// Tab Switching
function switchTab(activeTab, activeSection) {
	// Update tab buttons
	loginTab.classList.toggle('active', activeTab === 'login');
	registerTab.classList.toggle('active', activeTab === 'register');
	
	// Update sections
	loginSection.classList.toggle('active', activeSection === 'login');
	registerSection.classList.toggle('active', activeSection === 'register');
}

loginTab.addEventListener('click', () => switchTab('login', 'login'));
registerTab.addEventListener('click', () => switchTab('register', 'register'));

// Password Toggle Functionality
function togglePasswordVisibility(passwordInput, toggleButton) {
	const isPassword = passwordInput.type === 'password';
	passwordInput.type = isPassword ? 'text' : 'password';
	
	const svg = toggleButton.querySelector('svg path');
	if (isPassword) {
		// Show eye-off icon
		svg.setAttribute('d', 'M1.18 8.85c2.98-5.63 9.64-5.63 12.62 0a.5.5 0 0 1 0 .3c-2.98 5.63-9.64 5.63-12.62 0a.5.5 0 0 1 0-.3ZM12 9a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z');
	} else {
		// Show eye icon
		svg.setAttribute('d', 'M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z');
	}
}

toggleLoginPassword.addEventListener('click', () => togglePasswordVisibility(loginPassword, toggleLoginPassword));
toggleRegisterPassword.addEventListener('click', () => togglePasswordVisibility(registerPassword, toggleRegisterPassword));

// Validation Patterns
const patterns = {
	companyName: /^[A-Za-z\s]{2,50}$/,
	location: /^.{5,100}$/,
	ownerName: /^[A-Za-z\s]{2,50}$/,
	mobile: /^[6-9][0-9]{9}$/,
	licenseNumber: /^[A-Za-z0-9\-\/]{5,20}$/,
	password: /^.{8,}$/,
	userId: /^[A-Za-z0-9\-_]{5,30}$/
};

// Validation Functions
function validateField(input, pattern, errorElement, message) {
	const value = input.value.trim();
	if (!pattern.test(value)) {
		errorElement.textContent = message;
		return false;
	}
	errorElement.textContent = '';
	return true;
}

function validateCompanyName() {
	return validateField(
		companyName, 
		patterns.companyName, 
		companyNameError, 
		'Company name must be 2-50 characters (letters and spaces only)'
	);
}

function validateLocation() {
	return validateField(
		location, 
		patterns.location, 
		locationError, 
		'Location must be 5-100 characters'
	);
}

function validateOwnerName() {
	return validateField(
		ownerName, 
		patterns.ownerName, 
		ownerNameError, 
		'Owner name must be 2-50 characters (letters and spaces only)'
	);
}

function validateOwnerMobile() {
	return validateField(
		ownerMobile, 
		patterns.mobile, 
		ownerMobileError, 
		'Enter a valid 10-digit mobile number starting with 6-9'
	);
}

function validateLicenseNumber() {
	return validateField(
		licenseNumber, 
		patterns.licenseNumber, 
		licenseNumberError, 
		'License number must be 5-20 characters (letters, numbers, hyphens, slashes)'
	);
}

function validateFuelPrice() {
	const value = parseFloat(fuelPrice.value);
	if (isNaN(value) || value <= 0 || value > 500) {
		fuelPriceError.textContent = 'Fuel price must be a valid number between 0.01 and 500';
		return false;
	}
	fuelPriceError.textContent = '';
	return true;
}

function validateRegisterPassword() {
	return validateField(
		registerPassword, 
		patterns.password, 
		registerPasswordError, 
		'Password must be at least 8 characters long'
	);
}

function validateLoginUserId() {
	return validateField(
		loginUserId, 
		patterns.userId, 
		loginUserIdError, 
		'User ID must be 5-30 characters (letters, numbers, hyphens, underscores)'
	);
}

function validateLoginPassword() {
	const value = loginPassword.value.trim();
	if (value.length === 0) {
		loginPasswordError.textContent = 'Password is required';
		return false;
	}
	loginPasswordError.textContent = '';
	return true;
}

// Generate Unique User ID
function generateUserId(companyNameValue) {
	// Extract first few characters from company name
	const prefix = companyNameValue
		.replace(/[^A-Za-z]/g, '') // Remove non-letters
		.slice(0, Math.min(5, companyNameValue.length)) // Take first 3-5 characters
		.charAt(0).toUpperCase() + companyNameValue.slice(1, Math.min(5, companyNameValue.length)).toLowerCase();
	
	// Generate random suffix
	const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
	let suffix = '';
	for (let i = 0; i < 5; i++) {
		suffix += chars.charAt(Math.floor(Math.random() * chars.length));
	}
	
	return `${prefix}-${suffix}`;
}

// Hash Password (simple client-side hashing - in production, use proper server-side hashing)
function hashPassword(password) {
	// Simple hash function for demo purposes
	// In production, use proper server-side hashing with bcrypt or similar
	let hash = 0;
	for (let i = 0; i < password.length; i++) {
		const char = password.charCodeAt(i);
		hash = ((hash << 5) - hash) + char;
		hash = hash & hash; // Convert to 32-bit integer
	}
	return Math.abs(hash).toString(16);
}

// Registration Function
// Geocoding function for pump registration
async function geocodePumpLocation(address) {
	try {
		const response = await fetch(
			`${window.LOCATIONIQ_BASE_URL}/search.php?key=${window.LOCATIONIQ_API_KEY}&q=${encodeURIComponent(address)}&format=json&limit=1`
		);
		
		if (!response.ok) {
			throw new Error('Failed to geocode pump address');
		}
		
		const data = await response.json();
		if (data.length === 0) {
			return null; // Address not found, but allow registration to continue
		}
		
		return {
			latitude: parseFloat(data[0].lat),
			longitude: parseFloat(data[0].lon)
		};
	} catch (error) {
		console.error('Geocoding error:', error);
		return null; // Allow registration to continue without coordinates
	}
}

async function registerPetrolPump(event) {
	event.preventDefault();
	
	// Validate all fields
	const validations = [
		validateCompanyName(),
		validateLocation(),
		validateOwnerName(),
		validateOwnerMobile(),
		validateLicenseNumber(),
		validateFuelPrice(),
		validateRegisterPassword()
	];
	
	if (!validations.every(Boolean)) {
		registerMessage.innerHTML = '<span class="text-red-600">Please fix the errors above</span>';
		return;
	}
	
	// Disable submit button
	registerBtn.disabled = true;
	registerBtn.textContent = 'Registering...';
	registerMessage.innerHTML = '<span class="text-blue-600">Creating your account...</span>';
	
	try {
		// Generate unique user ID
		const userId = generateUserId(companyName.value.trim());
		
		// Try to get coordinates for the pump location
		registerMessage.innerHTML = '<span class="text-blue-600">Getting location coordinates...</span>';
		const coordinates = await geocodePumpLocation(location.value.trim());
		
		// Check if user ID already exists
		registerMessage.innerHTML = '<span class="text-blue-600">Checking availability...</span>';
		const { data: existingPump } = await supa
			.from(PETROL_PUMPS_TABLE)
			.select('user_id')
			.eq('user_id', userId)
			.single();
		
		let finalUserId = userId;
		if (existingPump) {
			// Generate new ID if collision occurs
			finalUserId = generateUserId(companyName.value.trim()) + '-' + Date.now().toString().slice(-4);
		}
		
		// Prepare data for insertion
		const pumpData = {
			user_id: finalUserId,
			company_name: companyName.value.trim(),
			location: location.value.trim(),
			latitude: coordinates?.latitude || null,
			longitude: coordinates?.longitude || null,
			owner_name: ownerName.value.trim(),
			owner_mobile: ownerMobile.value.trim(),
			license_number: licenseNumber.value.trim(),
			fuel_price: parseFloat(fuelPrice.value),
			password_hash: hashPassword(registerPassword.value),
			created_at: new Date().toISOString(),
			status: 'active'
		};
		
		// Insert into Supabase
		registerMessage.innerHTML = '<span class="text-blue-600">Saving pump details...</span>';
		const { data, error } = await supa
			.from(PETROL_PUMPS_TABLE)
			.insert([pumpData])
			.select();
		
		if (error) {
			throw new Error(error.message);
		}
		
		// Show success modal with generated user ID
		generatedUserId.textContent = finalUserId;
		successModal.classList.remove('hidden');
		successModal.classList.add('flex');
		
		// Reset form
		registerForm.reset();
		registerMessage.innerHTML = '';
		
		// Show location status
		if (coordinates) {
			console.log('Pump registered with coordinates:', coordinates);
		} else {
			console.warn('Pump registered without coordinates - manual location setup may be needed');
		}
		
	} catch (error) {
		console.error('Registration error:', error);
		registerMessage.innerHTML = `<span class="text-red-600">Registration failed: ${error.message}</span>`;
	} finally {
		// Re-enable submit button
		registerBtn.disabled = false;
		registerBtn.textContent = 'Register Petrol Pump';
	}
}

// Login Function
async function loginPetrolPump(event) {
	event.preventDefault();
	
	// Validate fields
	if (!validateLoginUserId() || !validateLoginPassword()) {
		loginMessage.innerHTML = '<span class="text-red-600">Please fix the errors above</span>';
		return;
	}
	
	// Disable login button
	loginBtn.disabled = true;
	loginBtn.textContent = 'Signing in...';
	loginMessage.innerHTML = '<span class="text-blue-600">Verifying credentials...</span>';
	
	try {
		const userIdValue = loginUserId.value.trim();
		const passwordValue = loginPassword.value;
		const hashedPassword = hashPassword(passwordValue);
		
		// Query Supabase for matching credentials
		const { data: pumpData, error } = await supa
			.from(PETROL_PUMPS_TABLE)
			.select('*')
			.eq('user_id', userIdValue)
			.eq('password_hash', hashedPassword)
			.eq('status', 'active')
			.single();
		
		if (error || !pumpData) {
			throw new Error('Invalid User ID or Password');
		}
		
		// Store authentication data
		localStorage.setItem('pumpAuth', JSON.stringify({
			userId: pumpData.user_id,
			companyName: pumpData.company_name,
			location: pumpData.location,
			loginTime: Date.now()
		}));
		
		loginMessage.innerHTML = '<span class="text-green-600">Login successful! Redirecting...</span>';
		
		// Redirect to dashboard
		setTimeout(() => {
			window.location.href = 'pump-dashboard.html';
		}, 1500);
		
	} catch (error) {
		console.error('Login error:', error);
		loginMessage.innerHTML = `<span class="text-red-600">${error.message}</span>`;
	} finally {
		// Re-enable login button
		loginBtn.disabled = false;
		loginBtn.textContent = 'Sign In';
	}
}

// Event Listeners
registerForm.addEventListener('submit', registerPetrolPump);
loginForm.addEventListener('submit', loginPetrolPump);

// Real-time validation
companyName.addEventListener('input', validateCompanyName);
location.addEventListener('input', validateLocation);
ownerName.addEventListener('input', validateOwnerName);
ownerMobile.addEventListener('input', validateOwnerMobile);
licenseNumber.addEventListener('input', validateLicenseNumber);
fuelPrice.addEventListener('input', validateFuelPrice);
registerPassword.addEventListener('input', validateRegisterPassword);
loginUserId.addEventListener('input', validateLoginUserId);
loginPassword.addEventListener('input', validateLoginPassword);

// Modal close functionality
closeModal.addEventListener('click', () => {
	successModal.classList.add('hidden');
	successModal.classList.remove('flex');
	// Switch to login tab
	switchTab('login', 'login');
});

// Close modal on overlay click
successModal.addEventListener('click', (e) => {
	if (e.target === successModal) {
		closeModal.click();
	}
});

})();
