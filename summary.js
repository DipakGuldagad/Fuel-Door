// Order Summary Page Logic with Pump Selection
(function () {
    const yearEl = document.getElementById("year");
    if (yearEl) yearEl.textContent = String(new Date().getFullYear());

    // Get order data from localStorage
    const orderData = JSON.parse(localStorage.getItem("fuelAtDoorOrder") || "{}");
    const sessionUser = window.AuthUtils.getSession() || {};
    const userData = {
        name: sessionUser.full_name || "Customer",
        mobile: sessionUser.mobile || sessionUser.phone || "N/A",
        pan: sessionUser.pan_number || "N/A"
    };

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

    function calculateOrder() {
        const { type, price, unit, quantity } = orderData;

        // Use PricingUtils with a 5% tax rate as previously defined
        const pricing = window.PricingUtils.calculateOrder(quantity, price, 0.05);
        const { fuelCost, deliveryFee, totalAmount: total } = pricing;
        const tax = (fuelCost + deliveryFee) * 0.05;

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

    form.addEventListener("submit", async function (e) {
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
        const finalTotal = parseFloat(total.toFixed(2));

        // Get selected pump details
        const selectedPumpId = parseInt(petrolPumpInput.value);
        const selectedPumpText = petrolPumpInput.options[petrolPumpInput.selectedIndex].text;

        const orderPayload = {
            // Customer details
            customer_name: userData.name,
            customer_mobile: userData.mobile,
            // Order details
            fuel_type: orderData.type,
            quantity: parseFloat(orderData.quantity),
            unit: orderData.unit,
            price_per_liter: parseFloat(orderData.price),
            // Delivery details
            customer_location: addressInput.value.trim(),
            landmark: document.getElementById("landmark")?.value?.trim() || "",
            pincode: pincodeInput.value.trim(),
            delivery_time: deliveryTimeInput.value,
            // Pump assignment
            assigned_pump_id: selectedPumpId,
            // Pricing
            fuel_cost: parseFloat(fuelCost.toFixed(2)),
            delivery_fee: parseFloat(deliveryFee.toFixed(2)),
            total_amount: finalTotal,
            // Status
            status: "pending",
            payment_status: "Pending",
            created_at: new Date().toISOString()
        };

        try {
            if (!supabaseClient) {
                throw new Error("Database connection not available");
            }

            console.log('📦 Submitting order payload:', orderPayload);

            // 1. Insert order
            const { data, error } = await supabaseClient
                .from(ordersTable)
                .insert([orderPayload])
                .select('id')
                .single();

            if (error) {
                console.error('❌ Database error:', error);
                throw new Error(error.message);
            }

            if (!data || !data.id) {
                throw new Error('Order created but ID not returned.');
            }

            const numericId = data.id;
            const displayCode = `FD${numericId}`;
            console.log('✅ Order created with ID:', numericId, 'Code:', displayCode);

            // 2. Update order_code (separation of display and numeric ID)
            await supabaseClient
                .from(ordersTable)
                .update({ order_code: displayCode })
                .eq('id', numericId);

            // 3. Store order data for payment page
            const pendingOrderData = {
                numericId: numericId,
                orderCode: displayCode,
                totalAmount: finalTotal,
                fuel_type: orderData.type,
                quantity: orderData.quantity,
                unit: orderData.unit,
                pump_name: selectedPumpText.split(' - ')[0]
            };
            localStorage.setItem('pendingOrder', JSON.stringify(pendingOrderData));

            // Clear old order data
            localStorage.removeItem("fuelAtDoorOrder");

            // 4. Redirect to payment page with BOTH display code and amount
            const redirectUrl = `qr_payment_section.html?orderId=${displayCode}&amount=${finalTotal}`;
            console.log('🔀 Redirecting to:', redirectUrl);

            orderSuccess.innerHTML = `<div style="color: #059669; padding: 1rem; background: #d1fae5; border-radius: 0.5rem;">
                <strong>✅ Order Created!</strong><br>
                Order Code: ${displayCode}<br>
                Redirecting to payment...
            </div>`;

            setTimeout(() => {
                window.location.href = redirectUrl;
            }, 1500);

        } catch (error) {
            console.error("❌ Order submission error:", error);
            orderSuccess.innerHTML = `
                <div style="color: #dc2626; padding: 1rem; background: #fee2e2; border-radius: 0.5rem;">
                    <strong>❌ Order submission failed:</strong><br>
                    ${error.message}
                </div>
            `;
        }
    });

})();
