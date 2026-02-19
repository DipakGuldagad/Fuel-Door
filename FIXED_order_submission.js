// ============================================================================
// PRODUCTION-READY ORDER SUBMISSION HANDLER
// ============================================================================
// This replaces the form submit handler in summary.js (around line 170)
// Includes comprehensive validation and error handling
// ============================================================================

form.addEventListener("submit", async function (e) {
    e.preventDefault();

    // Clear previous messages
    orderSuccess.textContent = "";
    orderSuccess.innerHTML = "";

    // ========================================================================
    // STEP 1: Validate Form Fields
    // ========================================================================
    const isValid = [
        validateAddress(),
        validatePincode(),
        validateDeliveryTime(),
        validatePetrolPump()
    ].every(Boolean);

    if (!isValid) {
        return;
    }

    // ========================================================================
    // STEP 2: Calculate Order Totals
    // ========================================================================
    const { fuelCost, deliveryFee, tax, total } = calculateOrder();

    // CRITICAL: Validate that total is a valid number
    if (!total || isNaN(total) || total <= 0) {
        orderSuccess.innerHTML = `
            <div style="color: #dc2626; padding: 1rem; background: #fee2e2; border-radius: 0.5rem;">
                <strong>❌ Calculation Error:</strong><br>
                Unable to calculate order total. Please refresh and try again.
            </div>
        `;
        console.error('Invalid total calculated:', { fuelCost, deliveryFee, tax, total });
        return;
    }

    // ========================================================================
    // STEP 3: Validate Pump Selection
    // ========================================================================
    const petrolPumpInput = document.getElementById('petrolPump');
    const selectedPumpValue = petrolPumpInput.value;

    // CRITICAL: Check if pump is selected
    if (!selectedPumpValue || selectedPumpValue === "") {
        orderSuccess.innerHTML = `
            <div style="color: #dc2626; padding: 1rem; background: #fee2e2; border-radius: 0.5rem;">
                <strong>❌ Validation Error:</strong><br>
                Please select a petrol pump.
            </div>
        `;
        return;
    }

    // CRITICAL: Parse and validate pump ID is a valid integer
    const selectedPumpId = parseInt(selectedPumpValue, 10);

    if (isNaN(selectedPumpId) || selectedPumpId <= 0) {
        orderSuccess.innerHTML = `
            <div style="color: #dc2626; padding: 1rem; background: #fee2e2; border-radius: 0.5rem;">
                <strong>❌ Invalid Pump Selection:</strong><br>
                Selected pump ID is invalid. Please select again.
            </div>
        `;
        console.error('Invalid pump ID:', { selectedPumpValue, selectedPumpId });
        return;
    }

    const selectedPumpText = petrolPumpInput.options[petrolPumpInput.selectedIndex].text;

    // ========================================================================
    // STEP 4: Validate User Data
    // ========================================================================
    if (!userData || !userData.name || !userData.mobile) {
        orderSuccess.innerHTML = `
            <div style="color: #dc2626; padding: 1rem; background: #fee2e2; border-radius: 0.5rem;">
                <strong>❌ Session Error:</strong><br>
                User data not found. Please <a href="login.html" style="text-decoration: underline;">login again</a>.
            </div>
        `;
        return;
    }

    // ========================================================================
    // STEP 5: Build Order Payload with Validated Data
    // ========================================================================
    const orderPayload = {
        // Customer details (validated)
        customer_name: userData.name,
        customer_mobile: userData.mobile,

        // Order details from localStorage (validated on previous page)
        fuel_type: orderData.type,
        quantity: parseFloat(orderData.quantity), // Ensure numeric
        unit: orderData.unit,
        price_per_liter: parseFloat(orderData.price), // Ensure numeric

        // Delivery details (validated above)
        customer_location: addressInput.value.trim(),
        landmark: document.getElementById("landmark").value.trim() || null,
        pincode: pincodeInput.value.trim(),
        delivery_time: deliveryTimeInput.value,

        // Pump assignment (VALIDATED - guaranteed to be valid integer)
        assigned_pump_id: selectedPumpId,

        // Pricing (VALIDATED - guaranteed to be valid numbers)
        fuel_cost: parseFloat(fuelCost.toFixed(2)),
        delivery_fee: parseFloat(deliveryFee.toFixed(2)),
        total_amount: parseFloat(total.toFixed(2)),

        // Status
        status: "pending",
        payment_status: "Pending",

        // Timestamp
        created_at: new Date().toISOString()
    };

    // ========================================================================
    // STEP 6: Final Payload Validation
    // ========================================================================
    console.log('📦 Order Payload:', orderPayload);

    // Validate critical numeric fields
    const criticalFields = {
        'assigned_pump_id': selectedPumpId,
        'quantity': orderPayload.quantity,
        'price_per_liter': orderPayload.price_per_liter,
        'fuel_cost': orderPayload.fuel_cost,
        'delivery_fee': orderPayload.delivery_fee,
        'total_amount': orderPayload.total_amount
    };

    for (const [fieldName, value] of Object.entries(criticalFields)) {
        if (value === undefined || value === null || isNaN(value)) {
            orderSuccess.innerHTML = `
                <div style="color: #dc2626; padding: 1rem; background: #fee2e2; border-radius: 0.5rem;">
                    <strong>❌ Data Validation Error:</strong><br>
                    Invalid value for ${fieldName}: ${value}<br>
                    Please refresh and try again.
                </div>
            `;
            console.error(`Invalid ${fieldName}:`, value);
            return;
        }
    }

    // ========================================================================
    // STEP 7: Show Loading State
    // ========================================================================
    const submitButton = form.querySelector('button[type="submit"]');
    const originalButtonText = submitButton.textContent;
    submitButton.disabled = true;
    submitButton.textContent = "Creating Order...";

    try {
        // ====================================================================
        // STEP 8: Check Supabase Connection
        // ====================================================================
        if (!supabaseClient) {
            throw new Error("Database connection not available. Please check your internet connection.");
        }

        // ====================================================================
        // STEP 9: Insert Order into Database
        // ====================================================================
        console.log('🚀 Inserting order into database...');

        const { data, error } = await supabaseClient
            .from(ordersTable)
            .insert([orderPayload])
            .select('id')
            .single();

        // ====================================================================
        // STEP 10: Handle Database Errors
        // ====================================================================
        if (error) {
            console.error('❌ Database error:', error);

            // User-friendly error messages
            let errorMessage = error.message;

            if (error.message.includes('row-level security')) {
                errorMessage = 'Permission denied. Please contact support.';
            } else if (error.message.includes('violates')) {
                errorMessage = 'Invalid data format. Please check your inputs.';
            } else if (error.message.includes('network')) {
                errorMessage = 'Network error. Please check your internet connection.';
            }

            throw new Error(errorMessage);
        }

        // ====================================================================
        // STEP 11: Validate Order ID Was Returned
        // ====================================================================
        if (!data || !data.id) {
            throw new Error('Order created but ID not returned. Please contact support.');
        }

        const orderId = data.id;
        console.log('✅ Order created successfully with ID:', orderId);

        // ====================================================================
        // STEP 12: Generate Order ID in FD Format
        // ====================================================================
        const formattedOrderId = `FD${orderId}`;
        console.log('📋 Formatted Order ID:', formattedOrderId);

        // ====================================================================
        // STEP 13: Prepare Data for Payment Page
        // ====================================================================
        const pendingOrderData = {
            orderId: formattedOrderId,
            orderIdNumeric: orderId, // Store numeric ID as well
            totalAmount: parseFloat(total.toFixed(2)),
            fuel_type: orderData.type,
            quantity: orderData.quantity,
            unit: orderData.unit,
            pump_name: selectedPumpText.split(' - ')[0],
            pump_location: selectedPumpText.split(' - ')[1]?.split(' (')[0] || '',
            customer_name: userData.name,
            customer_mobile: userData.mobile
        };

        // ====================================================================
        // STEP 14: Store in LocalStorage (Backup)
        // ====================================================================
        localStorage.setItem('pendingOrder', JSON.stringify(pendingOrderData));
        console.log('💾 Stored pendingOrder in localStorage:', pendingOrderData);

        // Clear old order data
        localStorage.removeItem("fuelAtDoorOrder");

        // ====================================================================
        // STEP 15: Build Redirect URL with Validated Parameters
        // ====================================================================
        const redirectUrl = `qr_payment_section.html?orderId=${encodeURIComponent(formattedOrderId)}&amount=${encodeURIComponent(total.toFixed(2))}`;

        console.log('🔀 Redirecting to:', redirectUrl);

        // ====================================================================
        // STEP 16: Show Success Message (Brief)
        // ====================================================================
        orderSuccess.innerHTML = `
            <div style="color: #059669; padding: 1rem; background: #d1fae5; border-radius: 0.5rem;">
                <strong>✅ Order Created Successfully!</strong><br>
                Order ID: ${formattedOrderId}<br>
                Redirecting to payment page...
            </div>
        `;

        // ====================================================================
        // STEP 17: Redirect to Payment Page
        // ====================================================================
        setTimeout(() => {
            window.location.href = redirectUrl;
        }, 1000);

    } catch (error) {
        // ====================================================================
        // ERROR HANDLING
        // ====================================================================
        console.error("❌ Order submission error:", error);

        orderSuccess.innerHTML = `
            <div style="color: #dc2626; padding: 1rem; background: #fee2e2; border-radius: 0.5rem;">
                <strong>❌ Order Submission Failed:</strong><br>
                ${error.message}<br><br>
                <small>Please try again or contact support if the issue persists.</small>
            </div>
        `;

        // Re-enable submit button
        submitButton.disabled = false;
        submitButton.textContent = originalButtonText;
    }
});

// ============================================================================
// USAGE INSTRUCTIONS
// ============================================================================
// 1. Replace the existing form.addEventListener("submit", ...) in summary.js
//    (starting around line 170) with this entire code block
// 2. Ensure all referenced elements exist in your HTML
// 3. Test thoroughly with various inputs
// ============================================================================
