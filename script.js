// Utilities
(function () {
	const yearEl = document.getElementById("year");
	if (yearEl) yearEl.textContent = String(new Date().getFullYear());

	// Hamburger Menu Functionality
	(function setupHamburgerMenu() {
		const hamburgerBtn = document.getElementById('hamburgerBtn');
		const hamburgerMenu = document.getElementById('hamburgerMenu');
		const menuOverlay = document.getElementById('menuOverlay');

		if (!hamburgerBtn || !hamburgerMenu || !menuOverlay) return;

		function toggleMenu() {
			const isActive = hamburgerBtn.classList.contains('active');

			if (isActive) {
				closeMenu();
			} else {
				openMenu();
			}
		}

		function openMenu() {
			hamburgerBtn.classList.add('active');
			hamburgerMenu.classList.add('active');
			menuOverlay.classList.add('active');
			hamburgerBtn.setAttribute('aria-expanded', 'true');
			document.body.style.overflow = 'hidden'; // Prevent scrolling
		}

		function closeMenu() {
			hamburgerBtn.classList.remove('active');
			hamburgerMenu.classList.remove('active');
			menuOverlay.classList.remove('active');
			hamburgerBtn.setAttribute('aria-expanded', 'false');
			document.body.style.overflow = ''; // Restore scrolling
		}

		// Event listeners
		hamburgerBtn.addEventListener('click', toggleMenu);
		menuOverlay.addEventListener('click', closeMenu);

		// Close menu when clicking on menu items
		const menuItems = hamburgerMenu.querySelectorAll('.hamburger-menu-item');
		menuItems.forEach(item => {
			item.addEventListener('click', closeMenu);
		});

		// Close menu on escape key
		document.addEventListener('keydown', (e) => {
			if (e.key === 'Escape' && hamburgerMenu.classList.contains('active')) {
				closeMenu();
			}
		});

		// Handle window resize
		window.addEventListener('resize', () => {
			if (window.innerWidth > 768 && hamburgerMenu.classList.contains('active')) {
				closeMenu();
			}
		});
	})();

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
				heroCta.addEventListener("click", function (e) {
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


	// Login form logic
	const form = document.getElementById("loginForm");
	if (!form) return;

	const mobileInput = document.getElementById("mobile");
	const panInput = document.getElementById("pan");

	const mobileError = document.getElementById("mobileError");
	const panError = document.getElementById("panError");
	const formSuccess = document.getElementById("formSuccess");
	const greetingSection = document.getElementById("greetingSection");
	const greetingName = document.getElementById("greetingName");

	const patterns = {
		mobile: /^[6-9][0-9]{9}$/,
		pan: /^[A-Z]{5}[0-9]{4}[A-Z]$/
	};

	function validateMobile() {
		const value = mobileInput.value.trim();
		if (!patterns.mobile.test(value)) {
			mobileError.textContent = "Please enter a valid 10-digit mobile number starting with 6-9.";
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

	// Fetch user name from pan_users table and show greeting
	async function fetchAndShowGreeting(pan) {
		if (!supabaseClient) {
			console.warn('Supabase client not available for name fetch');
			return null;
		}

		try {
			const { data, error } = await supabaseClient
				.from('pan_users')
				.select('full_name')
				.eq('pan_number', pan)
				.single();

			if (error || !data) {
				console.warn('PAN number not found in pan_users:', error);
				return null;
			}

			const fullName = data.full_name;

			// Show greeting with animation
			if (greetingSection && greetingName) {
				greetingName.textContent = `Welcome, ${fullName}!`;
				greetingSection.classList.remove('hidden');
				setTimeout(() => {
					greetingSection.classList.add('show');
				}, 50);

				// Hide form after showing greeting
				setTimeout(() => {
					if (form) form.style.opacity = '0.5';
				}, 100);
			}

			return fullName;
		} catch (err) {
			console.error('Error fetching user name:', err);
			return null;
		}
	}



	async function performLogin(payload) {
		// Save user data to database if possible
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

		// Save to local storage
		localStorage.setItem("fuelAtDoorUser", JSON.stringify(payload));

		// Show success message briefly
		formSuccess.textContent = savedRemotely ? "Login successful!" : "Saved locally.";

		// Auto-scroll to order process after 5 seconds
		setTimeout(() => {
			// Hide greeting with fade-out
			if (greetingSection) {
				greetingSection.classList.remove('show');
			}

			// Show integrated order process
			const orderProcessEl = document.getElementById("orderProcess");
			if (orderProcessEl) {
				orderProcessEl.style.display = "";
				orderProcessEl.scrollIntoView({ behavior: "smooth", block: "start" });
				initializeOrderProcess();
			}
		}, 5000); // 5 seconds
	}

	mobileInput.addEventListener("input", validateMobile);
	panInput.addEventListener("input", validatePan);

	form.addEventListener("submit", async function (e) {
		e.preventDefault();
		const ok = [validateMobile(), validatePan()].every(Boolean);
		if (!ok) {
			formSuccess.textContent = "";
			return;
		}

		// Fetch user name from PAN
		const fullName = await fetchAndShowGreeting(panInput.value.trim().toUpperCase());

		const payload = {
			mobile: mobileInput.value.trim(),
			pan: panInput.value.trim().toUpperCase(),
			full_name: fullName || mobileInput.value.trim().substring(0, 10)
		};

		performLogin(payload);
	});

	// ====== INTEGRATED ORDER FUEL FUNCTIONALITY ======
	function initializeOrderProcess() {
		if (!supabaseClient) {
			alert('Database not configured. Please check your configuration.');
			return;
		}

		// Global variables for order process
		let currentStep = 1;
		let selectedLocation = null;
		let nearestPump = null;
		let selectedFuelType = null;
		let selectedQuantity = 10;

		// Constants
		const PETROL_PUMPS_TABLE = 'petrol_pumps'; // Updated to match existing table name
		const ORDERS_TABLE = 'orders';
		const DELIVERY_FEE = 49;

		// DOM Elements
		const stepItems = document.querySelectorAll('.step-item');
		const stepContents = document.querySelectorAll('.step-content');
		const loadingModal = document.getElementById('loadingModal');
		const loadingMessage = document.getElementById('loadingMessage');

		// Step 1 Elements
		const useCurrentLocationBtn = document.getElementById('useCurrentLocation');
		const searchAddressBtn = document.getElementById('searchAddress');
		const manualAddress = document.getElementById('manualAddress');
		const locationDisplay = document.getElementById('locationDisplay');
		const selectedAddress = document.getElementById('selectedAddress');
		const coordinates = document.getElementById('coordinates');
		const changeLocationBtn = document.getElementById('changeLocation');
		const nearbyPumps = document.getElementById('nearbyPumps');
		const pumpsList = document.getElementById('pumpsList');
		const continueToFuelBtn = document.getElementById('continueToFuel');

		// Step 2 Elements
		const assignedPumpInfo = document.getElementById('assignedPumpInfo');
		const pumpDetails = document.getElementById('pumpDetails');
		const fuelOptions = document.querySelectorAll('.fuel-option');
		const quantityInput = document.getElementById('quantityInput');
		const decreaseQtyBtn = document.getElementById('decreaseQty');
		const increaseQtyBtn = document.getElementById('increaseQty');
		const presetQtyBtns = document.querySelectorAll('.preset-qty');
		const fuelCost = document.getElementById('fuelCost');
		const totalCost = document.getElementById('totalCost');
		const backToLocationBtn = document.getElementById('backToLocation');
		const continueToConfirmBtn = document.getElementById('continueToConfirm');

		// Step 3 Elements
		const orderSummary = document.getElementById('orderSummary');
		const backToFuelBtn = document.getElementById('backToFuel');
		const placeOrderBtn = document.getElementById('placeOrder');

		// Utility Functions
		function showLoading(message) {
			if (loadingMessage) loadingMessage.textContent = message;
			if (loadingModal) {
				loadingModal.classList.remove('hidden');
				loadingModal.style.display = 'flex';
			}
		}

		function hideLoading() {
			if (loadingModal) {
				loadingModal.classList.add('hidden');
				loadingModal.style.display = 'none';
			}
		}

		function updateStepNavigation(step) {
			stepItems.forEach((item, index) => {
				item.classList.toggle('active', index + 1 === step);
			});

			stepContents.forEach((content, index) => {
				content.classList.toggle('active', index + 1 === step);
			});

			currentStep = step;
		}

		function calculateDistance(lat1, lon1, lat2, lon2) {
			const R = 6371; // Earth's radius in kilometers
			const dLat = (lat2 - lat1) * Math.PI / 180;
			const dLon = (lon2 - lon1) * Math.PI / 180;
			const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
				Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
				Math.sin(dLon / 2) * Math.sin(dLon / 2);
			const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
			return R * c; // Distance in kilometers
		}

		// Location Functions
		async function getCurrentLocation() {
			return new Promise((resolve, reject) => {
				if (!navigator.geolocation) {
					reject(new Error('Geolocation is not supported by this browser'));
					return;
				}

				console.log('Requesting geolocation...');

				navigator.geolocation.getCurrentPosition(
					(position) => {
						console.log('Geolocation success:', position.coords);
						resolve({
							latitude: position.coords.latitude,
							longitude: position.coords.longitude,
							accuracy: position.coords.accuracy
						});
					},
					(error) => {
						console.error('Geolocation error:', error);
						let message = 'Unable to get your location';
						let helpText = '';

						switch (error.code) {
							case error.PERMISSION_DENIED:
								message = 'Location access denied';
								helpText = 'Please click the location icon in your browser address bar and allow location access.';
								break;
							case error.POSITION_UNAVAILABLE:
								message = 'Location information unavailable';
								helpText = 'Your device cannot determine your location. Check your device location settings.';
								break;
							case error.TIMEOUT:
								message = 'Location request timed out';
								helpText = 'Try again or enter your address manually.';
								break;
						}

						const fullMessage = helpText ? `${message}\n\n${helpText}` : message;
						reject(new Error(fullMessage));
					},
					{ enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
				);
			});
		}

		async function reverseGeocode(lat, lon) {
			// Return formatted coordinates - no external API needed
			return `${lat.toFixed(4)}°N, ${lon.toFixed(4)}°E`;
		}

		async function geocodeAddress(address) {
			// For manual address entry, use entered address with Mumbai coordinates as default
			// You can update these coordinates to match your service area
			return {
				latitude: 19.0760,
				longitude: 72.8777,
				display_name: address.trim()
			};
		}

		// Database Functions
		async function getAllPetrolPumps() {
			try {
				const { data, error } = await supabaseClient
					.from(PETROL_PUMPS_TABLE)
					.select('*')
					.limit(100);

				if (error) {
					console.error('Supabase error:', error);
					throw new Error('Database connection failed: ' + error.message);
				}

				if (!data || data.length === 0) {
					throw new Error('No petrol pumps found in database. Please register pumps first.');
				}

				return data;
			} catch (error) {
				console.error('Error fetching petrol pumps:', error);
				alert('Unable to fetch petrol pumps from database. Please ensure pumps are registered. Error: ' + error.message);
				throw error;
			}
		}

		// Sample pump data removed - we now require real pumps from database
		// Ensure pumps are registered through pump.html before customers can place orders

		async function findNearestPump(customerLat, customerLon) {
			try {
				showLoading('Finding nearest petrol pumps...');

				const pumps = await getAllPetrolPumps();

				if (pumps.length === 0) {
					throw new Error('No petrol pumps found');
				}

				// Calculate distances and sort
				const pumpsWithDistance = pumps.map(pump => {
					let distance = Infinity;

					if (pump.latitude && pump.longitude) {
						distance = calculateDistance(
							customerLat,
							customerLon,
							parseFloat(pump.latitude),
							parseFloat(pump.longitude)
						);
					}

					return {
						...pump,
						distance: distance,
						isAvailable: distance !== Infinity
					};
				}).sort((a, b) => a.distance - b.distance);

				hideLoading();
				return pumpsWithDistance;
			} catch (error) {
				hideLoading();
				console.error('Error finding nearest pump:', error);
				throw error;
			}
		}

		function displayNearbyPumps(pumps) {
			if (!pumpsList) return;
			pumpsList.innerHTML = '';

			pumps.slice(0, 5).forEach((pump, index) => {
				const pumpCard = document.createElement('div');
				pumpCard.className = `pump-card ${index === 0 ? 'selected' : ''}`;

				const distanceText = pump.isAvailable
					? `${pump.distance.toFixed(1)} km away`
					: 'Distance unavailable';

				const recommendedBadge = index === 0
					? '<span class="recommended-badge">Recommended</span>'
					: '';

				pumpCard.innerHTML = `
<div class="pump-info">
<div class="pump-header">
<h4>${pump.company_name || 'Petrol Pump'}</h4>
${recommendedBadge}
</div>
<p class="pump-location">${pump.location || 'Location not available'}</p>
<p class="pump-distance">${distanceText}</p>
<p class="pump-price">₹${pump.fuel_price || '105'}/L</p>
</div>
<div class="pump-select">
<div class="radio-circle ${index === 0 ? 'selected' : ''}"></div>
</div>
`;

				pumpCard.addEventListener('click', () => {
					// Update selection
					document.querySelectorAll('.pump-card').forEach(card => {
						card.classList.remove('selected');
						card.querySelector('.radio-circle').classList.remove('selected');
					});

					pumpCard.classList.add('selected');
					pumpCard.querySelector('.radio-circle').classList.add('selected');

					nearestPump = pump;
					if (continueToFuelBtn) continueToFuelBtn.disabled = false;
				});

				// Auto-select first pump (nearest)
				if (index === 0) {
					nearestPump = pump;
					if (continueToFuelBtn) continueToFuelBtn.disabled = false;
				}

				pumpsList.appendChild(pumpCard);
			});

			if (nearbyPumps) nearbyPumps.classList.remove('hidden');
		}

		// Location Selection Functions
		async function handleCurrentLocation() {
			try {
				showLoading('Getting your current location...');

				const location = await getCurrentLocation();
				console.log('✅ Location obtained:', location);

				showLoading('Getting address...');
				const address = await reverseGeocode(location.latitude, location.longitude);
				console.log('✅ Address:', address);

				selectedLocation = {
					latitude: location.latitude,
					longitude: location.longitude,
					address: address
				};

				showSelectedLocation();

				showLoading('Finding nearest pumps...');
				const pumps = await findNearestPump(location.latitude, location.longitude);
				console.log('✅ Found pumps:', pumps.length);

				displayNearbyPumps(pumps);
				hideLoading();

			} catch (error) {
				hideLoading();
				console.error('Error:', error);
				alert('Error: ' + error.message);
			}
		}

		async function handleAddressSearch() {
			try {
				if (!manualAddress) return;
				const address = manualAddress.value.trim();
				if (!address) {
					alert('Please enter an address');
					return;
				}

				showLoading('Searching for address...');

				const geocoded = await geocodeAddress(address);

				selectedLocation = {
					latitude: geocoded.latitude,
					longitude: geocoded.longitude,
					address: geocoded.display_name
				};

				showSelectedLocation();
				const pumps = await findNearestPump(geocoded.latitude, geocoded.longitude);
				displayNearbyPumps(pumps);

			} catch (error) {
				hideLoading();
				alert(`Error searching address: ${error.message}`);
			}
		}

		function showSelectedLocation() {
			if (selectedAddress) selectedAddress.textContent = selectedLocation.address;
			if (coordinates) coordinates.textContent = `${selectedLocation.latitude.toFixed(6)}, ${selectedLocation.longitude.toFixed(6)}`;
			if (locationDisplay) locationDisplay.classList.remove('hidden');
		}

		function hideSelectedLocation() {
			if (locationDisplay) locationDisplay.classList.add('hidden');
			if (nearbyPumps) nearbyPumps.classList.add('hidden');
			if (continueToFuelBtn) continueToFuelBtn.disabled = true;
			selectedLocation = null;
			nearestPump = null;
		}

		// Step 2 Functions
		function updateAssignedPumpInfo() {
			if (!nearestPump || !pumpDetails) return;

			pumpDetails.innerHTML = `
<div class="pump-assignment">
<div class="pump-info">
<p class="pump-name">${nearestPump.company_name || 'Petrol Pump'}</p>
<p class="pump-location">${nearestPump.location || ''}</p>
<p class="pump-distance">Distance: ${nearestPump.distance.toFixed(1)} km</p>
</div>
<div class="pump-price">
<p class="price">₹${nearestPump.fuel_price || '105'}/L</p>
</div>
</div>
`;

			// Update fuel prices from pump data
			const price = nearestPump.fuel_price || '105';
			if (document.getElementById('petrolPrice')) document.getElementById('petrolPrice').textContent = price;
			if (document.getElementById('dieselPrice')) document.getElementById('dieselPrice').textContent = price;
			if (document.getElementById('evPrice')) document.getElementById('evPrice').textContent = '12.00'; // Fixed EV price

			// Update fuel option data attributes
			fuelOptions.forEach(option => {
				if (option.getAttribute('data-type') === 'ev') {
					option.setAttribute('data-price', '12.00');
				} else {
					option.setAttribute('data-price', price);
				}
			});
		}

		function updatePriceSummary() {
			if (!selectedFuelType || !nearestPump) return;

			let price, unit;
			if (selectedFuelType === 'ev') {
				price = 12.00; // Fixed EV price
				unit = 'kWh';
			} else {
				price = parseFloat(nearestPump.fuel_price || '105');
				unit = 'L';
			}

			const quantity = parseInt(quantityInput?.value || '10');
			const cost = price * quantity;
			const total = cost + DELIVERY_FEE;

			if (fuelCost) fuelCost.textContent = `₹${cost.toFixed(2)}`;
			if (totalCost) totalCost.textContent = `₹${total.toFixed(2)}`;

			// Update quantity labels
			updateQuantityLabels();
		}

		// Update quantity labels based on selected fuel type
		function updateQuantityLabels() {
			const unit = selectedFuelType === 'ev' ? 'kWh' : 'L';
			const minQty = selectedFuelType === 'ev' ? '5kWh' : '5L';
			const maxQty = selectedFuelType === 'ev' ? '100kWh' : '100L';

			if (document.getElementById('quantityUnit')) {
				document.getElementById('quantityUnit').textContent = `(${unit === 'kWh' ? 'kWh' : 'Liters'})`;
			}
			if (document.getElementById('quantityHint')) {
				document.getElementById('quantityHint').textContent = `Minimum ${minQty}, Maximum ${maxQty}`;
			}

			// Update preset buttons
			const presetBtns = document.querySelectorAll('.preset-qty');
			presetBtns.forEach(btn => {
				const qty = btn.getAttribute('data-qty');
				btn.textContent = qty + unit;
			});
		}

		// Step 3 Functions
		function populateOrderSummary() {
			if (!orderSummary || !nearestPump || !selectedLocation) return;

			let price, unit, serviceType;
			if (selectedFuelType === 'ev') {
				price = 12.00;
				unit = 'kWh';
				serviceType = 'EV Charging';
			} else {
				price = parseFloat(nearestPump.fuel_price || '105');
				unit = 'L';
				serviceType = selectedFuelType === 'petrol' ? 'Petrol' : 'Diesel';
			}

			const quantity = parseInt(quantityInput?.value || '10');
			const cost = price * quantity;
			const total = cost + DELIVERY_FEE;

			const stationName = selectedFuelType === 'ev' ? 'Charging Station' : 'Petrol Pump';

			orderSummary.innerHTML = `
<div class="summary-section">
<h3>Delivery Details</h3>
<p><strong>Address:</strong> ${selectedLocation.address}</p>
</div>

<div class="summary-section">
<h3>Service Details</h3>
<p><strong>Type:</strong> ${serviceType}</p>
<p><strong>Quantity:</strong> ${quantity}${unit}</p>
<p><strong>Price per ${unit}:</strong> ₹${price}/${unit}</p>
</div>

<div class="summary-section">
<h3>Assigned ${stationName}</h3>
<p><strong>${nearestPump.company_name || stationName}</strong></p>
<p>${nearestPump.location || ''}</p>
<p>Distance: ${nearestPump.distance.toFixed(1)} km</p>
</div>

<div class="summary-section price-breakdown">
<h3>Price Summary</h3>
<div class="price-row">
<span>Service Cost:</span>
<span>₹${cost.toFixed(2)}</span>
</div>
<div class="price-row">
<span>Delivery Fee:</span>
<span>₹${DELIVERY_FEE}</span>
</div>
<div class="price-row total">
<span>Total Amount:</span>
<span>₹${total.toFixed(2)}</span>
</div>
</div>
`;
		}

		async function submitOrder() {
			try {
				showLoading('Preparing your order...');

				let price, unit;
				if (selectedFuelType === 'ev') {
					price = 12.00;
					unit = 'kWh';
				} else {
					price = parseFloat(nearestPump.fuel_price || '105');
					unit = 'L';
				}

				const quantity = parseInt(quantityInput?.value || '10');
				const cost = price * quantity;
				const total = cost + DELIVERY_FEE;

				// Get user info from localStorage
				const user = JSON.parse(localStorage.getItem("fuelAtDoorUser") || "{}");

				const orderData = {
					customer_location: selectedLocation.address,
					pump_id: nearestPump.id,
					customer_mobile: user.mobile || 'N/A',
					customer_pan: user.pan || 'N/A',
					customer_name: user.full_name || user.mobile || 'Customer',
					fuel_type: selectedFuelType,
					quantity: quantity,
					unit: unit,
					price_per_liter: price,
					fuel_cost: cost,
					delivery_fee: DELIVERY_FEE,
					total_amount: total,
					status: 'pending_payment'
				};

				// Create a separate object for database insertion (without pump_name and pump_location)
				const orderDataForDB = { ...orderData };

				// Keep pump details in orderData for localStorage/UI (not saved to DB)
				orderData.pump_name = nearestPump.company_name || 'Petrol Pump';
				orderData.pump_location = nearestPump.location || '';

				console.log('Creating order for pump ID:', nearestPump.id);
				console.log('Pump details:', {
					id: nearestPump.id,
					name: nearestPump.company_name,
					location: nearestPump.location
				});
				console.log('Order data for UI:', orderData);
				console.log('Order data for DB:', orderDataForDB);

				// Save order data to localStorage
				localStorage.setItem('pendingOrder', JSON.stringify(orderData));
				localStorage.setItem('orderAmount', total.toFixed(2));

				// Try to save to database, but continue even if it fails
				if (supabaseClient) {
					try {
						console.log('Attempting to save order to database...');
						console.log('Order data being saved:', orderDataForDB);
						console.log('Pump ID in order:', orderDataForDB.assigned_pump_id);

						console.log('Attempting database insert...');
						console.log('Table:', ORDERS_TABLE);
						console.log('Data being inserted:', JSON.stringify(orderDataForDB, null, 2));
						console.log('Pump ID type:', typeof orderDataForDB.assigned_pump_id);
						console.log('Pump ID value:', orderDataForDB.assigned_pump_id);

						const { data, error } = await supabaseClient
							.from(ORDERS_TABLE)
							.insert([orderDataForDB])
							.select()
							.single();

						if (error) {
							console.error('❌ Database save error:', error);
							console.error('Error code:', error.code);
							console.error('Error message:', error.message);
							console.error('Error details:', error.details);
							console.error('Error hint:', error.hint);
							alert('❌ Failed to save order: ' + error.message + '\n\nCheck the console for details.');
						} else if (data && data.id) {
							localStorage.setItem('orderId', data.id);
							console.log('✅ Order saved to database successfully');
							console.log('📦 Saved order details:');
							console.log('   - Order ID:', data.id);
							console.log('   - Pump ID:', data.pump_id);
							console.log('   - Customer:', data.customer_name);
							console.log('   - Total:', data.total_amount);
							console.log('   - Status:', data.status);
							console.log('   - Created:', data.created_at);
						} else {
							console.warn('⚠️ Order inserted but no data returned from database');
						}
					} catch (dbError) {
						console.error('Database error caught:', dbError);
						console.warn('Continuing with local storage only');
						alert('Warning: Database error - order saved locally only');
					}
				} else {
					console.warn('Supabase client not available');
				}

				hideLoading();

				// Redirect to QR payment page
				window.location.href = `qr_payment_section.html?amount=${total.toFixed(2)}`;

			} catch (error) {
				hideLoading();
				console.error('Error placing order:', error);
				alert(`Error: ${error.message}`);
			}
		}

		// Event Listeners
		if (useCurrentLocationBtn) {
			useCurrentLocationBtn.addEventListener('click', handleCurrentLocation);
		}

		if (searchAddressBtn) {
			searchAddressBtn.addEventListener('click', handleAddressSearch);
		}
		if (changeLocationBtn) {
			changeLocationBtn.addEventListener('click', hideSelectedLocation);
		}

		// Step navigation
		if (continueToFuelBtn) {
			continueToFuelBtn.addEventListener('click', () => {
				updateAssignedPumpInfo();
				updateStepNavigation(2);
			});
		}

		if (backToLocationBtn) {
			backToLocationBtn.addEventListener('click', () => updateStepNavigation(1));
		}

		if (continueToConfirmBtn) {
			continueToConfirmBtn.addEventListener('click', () => {
				if (!selectedFuelType) {
					alert('Please select a fuel type');
					return;
				}
				populateOrderSummary();
				updateStepNavigation(3);
			});
		}

		if (backToFuelBtn) {
			backToFuelBtn.addEventListener('click', () => updateStepNavigation(2));
		}

		if (placeOrderBtn) {
			placeOrderBtn.addEventListener('click', submitOrder);
		}

		// Fuel type selection
		fuelOptions.forEach(option => {
			option.addEventListener('click', () => {
				fuelOptions.forEach(opt => opt.classList.remove('selected'));
				option.classList.add('selected');
				selectedFuelType = option.getAttribute('data-type');
				updatePriceSummary();
				updateQuantityLabels();
			});
		});

		// Quantity controls
		if (decreaseQtyBtn) {
			decreaseQtyBtn.addEventListener('click', () => {
				if (!quantityInput) return;
				const current = parseInt(quantityInput.value);
				if (current > 5) {
					quantityInput.value = current - 1;
					updatePriceSummary();
				}
			});
		}

		if (increaseQtyBtn) {
			increaseQtyBtn.addEventListener('click', () => {
				if (!quantityInput) return;
				const current = parseInt(quantityInput.value);
				if (current < 100) {
					quantityInput.value = current + 1;
					updatePriceSummary();
				}
			});
		}

		if (quantityInput) {
			quantityInput.addEventListener('input', updatePriceSummary);
		}

		presetQtyBtns.forEach(btn => {
			btn.addEventListener('click', () => {
				if (!quantityInput) return;
				quantityInput.value = btn.getAttribute('data-qty');
				updatePriceSummary();
			});
		});

		// Initialize first fuel option as selected
		if (fuelOptions.length > 0) {
			fuelOptions[0].classList.add('selected');
			selectedFuelType = fuelOptions[0].getAttribute('data-type');
			updateQuantityLabels(); // Initialize quantity labels
		}
	}

})();
