// ============================================================================
// PRODUCTION-READY PAYMENT PAGE INITIALIZATION
// ============================================================================
// This replaces the DOMContentLoaded handler in qr_payment_section.html
// Includes comprehensive validation and error handling
// ============================================================================

window.addEventListener('DOMContentLoaded', function () {
    console.log('=== PAYMENT PAGE LOADED ===');

    // ========================================================================
    // STEP 1: Get URL Parameters
    // ========================================================================
    const urlParams = new URLSearchParams(window.location.search);
    const urlOrderId = urlParams.get('orderId');
    const urlAmount = urlParams.get('amount');

    console.log('URL Parameters:', {
        orderId: urlOrderId,
        amount: urlAmount,
        fullURL: window.location.href
    });

    // ========================================================================
    // STEP 2: Get LocalStorage Backup Data
    // ========================================================================
    let pendingOrder = null;
    const pendingOrderStr = localStorage.getItem('pendingOrder');

    if (pendingOrderStr) {
        try {
            pendingOrder = JSON.parse(pendingOrderStr);
            console.log('LocalStorage pendingOrder:', pendingOrder);
        } catch (e) {
            console.error('Error parsing pendingOrder from localStorage:', e);
        }
    }

    // ========================================================================
    // STEP 3: Determine Final Order ID and Amount (with Validation)
    // ========================================================================
    let finalOrderId = null;
    let finalAmount = null;

    // Priority 1: URL Parameters (most reliable)
    if (urlOrderId && urlAmount) {
        finalOrderId = urlOrderId;
        finalAmount = parseFloat(urlAmount);
        console.log('✅ Using URL parameters');
    }
    // Priority 2: LocalStorage (backup)
    else if (pendingOrder && pendingOrder.orderId && pendingOrder.totalAmount) {
        finalOrderId = pendingOrder.orderId;
        finalAmount = parseFloat(pendingOrder.totalAmount);
        console.log('✅ Using localStorage data');
    }

    // ========================================================================
    // STEP 4: Validate Order ID
    // ========================================================================
    if (!finalOrderId || finalOrderId === '' || finalOrderId === 'undefined' || finalOrderId === 'null') {
        console.error('❌ Invalid Order ID:', finalOrderId);
        showErrorPage('Missing Order ID', 'Order ID not found. Please create a new order.');
        return;
    }

    // Validate Order ID format (should be FD followed by numbers)
    if (!finalOrderId.match(/^FD\d+$/)) {
        console.error('❌ Invalid Order ID format:', finalOrderId);
        showErrorPage('Invalid Order ID', `Order ID "${finalOrderId}" has an invalid format.`);
        return;
    }

    console.log('✅ Order ID validated:', finalOrderId);

    // ========================================================================
    // STEP 5: Validate Amount
    // ========================================================================
    if (!finalAmount || isNaN(finalAmount) || finalAmount <= 0) {
        console.error('❌ Invalid amount:', finalAmount);
        showErrorPage('Invalid Amount', 'Order amount is invalid. Please create a new order.');
        return;
    }

    // Ensure amount is a proper number with 2 decimal places
    finalAmount = parseFloat(finalAmount.toFixed(2));
    console.log('✅ Amount validated:', finalAmount);

    // ========================================================================
    // STEP 6: Store Validated Values Globally
    // ========================================================================
    window.currentOrderId = finalOrderId;
    window.currentAmount = finalAmount;

    console.log('📋 Final validated data:', {
        orderId: window.currentOrderId,
        amount: window.currentAmount
    });

    // ========================================================================
    // STEP 7: Update UI with Validated Data
    // ========================================================================
    try {
        // Update amount displays
        const displayAmountEl = document.getElementById('displayAmount');
        const confirmAmountEl = document.getElementById('confirmAmount');
        const displayOrderIdEl = document.getElementById('displayOrderId');

        if (displayAmountEl) {
            displayAmountEl.textContent = `₹${finalAmount.toFixed(2)}`;
        }
        if (confirmAmountEl) {
            confirmAmountEl.textContent = `₹${finalAmount.toFixed(2)}`;
        }
        if (displayOrderIdEl) {
            displayOrderIdEl.textContent = finalOrderId;
        }

        console.log('✅ UI updated with order data');

    } catch (error) {
        console.error('❌ Error updating UI:', error);
        showErrorPage('Display Error', 'Unable to display order information.');
        return;
    }

    // ========================================================================
    // STEP 8: Generate QR Code
    // ========================================================================
    try {
        generateQRCode(finalAmount, finalOrderId);
        console.log('✅ QR Code generated successfully');
    } catch (error) {
        console.error('❌ Error generating QR code:', error);
        showErrorPage('QR Code Error', 'Unable to generate payment QR code.');
        return;
    }

    // ========================================================================
    // STEP 9: Setup Payment Verification Form
    // ========================================================================
    setupPaymentVerificationForm();

    console.log('✅ Payment page initialized successfully');
});

// ============================================================================
// FUNCTION: Generate QR Code
// ============================================================================
function generateQRCode(amount, orderId) {
    // Validate inputs again before generating QR
    if (!amount || isNaN(amount) || amount <= 0) {
        throw new Error('Invalid amount for QR code generation');
    }
    if (!orderId || orderId === '') {
        throw new Error('Invalid order ID for QR code generation');
    }

    // UPI Configuration (replace with your actual UPI details)
    const UPI_ID = 'dipak.guldagad1305@okhdfcbank'; // Replace with your UPI ID
    const PAYEE_NAME = 'Fuel@Door'; // Replace with your business name

    // Create UPI payment link with Order ID in transaction note
    const upiLink = `upi://pay?pa=${UPI_ID}&pn=${encodeURIComponent(PAYEE_NAME)}&am=${amount.toFixed(2)}&cu=INR&tn=${encodeURIComponent(orderId)}`;

    console.log('🔗 UPI Link:', upiLink);

    // Clear existing QR code
    const qrContainer = document.getElementById('qrcode');
    if (!qrContainer) {
        throw new Error('QR code container not found');
    }
    qrContainer.innerHTML = '';

    // Generate new QR code
    new QRCode(qrContainer, {
        text: upiLink,
        width: 256,
        height: 256,
        colorDark: "#000000",
        colorLight: "#ffffff",
        correctLevel: QRCode.CorrectLevel.H
    });
}

// ============================================================================
// FUNCTION: Setup Payment Verification Form
// ============================================================================
function setupPaymentVerificationForm() {
    const paymentProofForm = document.getElementById('paymentProofForm');
    if (!paymentProofForm) {
        console.warn('Payment proof form not found');
        return;
    }

    paymentProofForm.addEventListener('submit', async function (e) {
        e.preventDefault();

        // ====================================================================
        // Validate Order ID and Amount are still available
        // ====================================================================
        if (!window.currentOrderId || !window.currentAmount) {
            alert('Session expired. Please create a new order.');
            window.location.href = 'order-summary.html';
            return;
        }

        // ====================================================================
        // Get Form Inputs
        // ====================================================================
        const utrInput = document.getElementById('utrNumber');
        const screenshotInput = document.getElementById('paymentScreenshot');
        const submitButton = paymentProofForm.querySelector('button[type="submit"]');

        if (!utrInput || !screenshotInput) {
            alert('Form fields not found. Please refresh the page.');
            return;
        }

        const utrValue = utrInput.value.trim();
        const screenshotFile = screenshotInput.files[0];

        // ====================================================================
        // Validate UTR Number
        // ====================================================================
        const utrValidation = PaymentValidation.validateUTR(utrValue);
        if (!utrValidation.valid) {
            PaymentValidation.showNotification(utrValidation.error, 'error');
            return;
        }

        // ====================================================================
        // Validate Screenshot
        // ====================================================================
        const screenshotValidation = PaymentValidation.validateScreenshot(screenshotFile);
        if (!screenshotValidation.valid) {
            PaymentValidation.showNotification(screenshotValidation.error, 'error');
            return;
        }

        // ====================================================================
        // Show Loading State
        // ====================================================================
        const originalButtonText = submitButton.textContent;
        submitButton.disabled = true;
        submitButton.textContent = 'Uploading...';

        try {
            // ================================================================
            // Upload Screenshot to Supabase Storage
            // ================================================================
            const fileExtension = screenshotFile.name.split('.').pop();
            const filename = PaymentValidation.generateScreenshotFilename(
                window.currentOrderId,
                fileExtension
            );

            console.log('📤 Uploading screenshot:', filename);

            const { data: uploadData, error: uploadError } = await supabaseClient.storage
                .from('payment-screenshots')
                .upload(filename, screenshotFile, {
                    cacheControl: '3600',
                    upsert: false
                });

            if (uploadError) {
                throw uploadError;
            }

            // ================================================================
            // Get Public URL for Screenshot
            // ================================================================
            const { data: urlData } = supabaseClient.storage
                .from('payment-screenshots')
                .getPublicUrl(filename);

            const screenshotUrl = urlData.publicUrl;
            console.log('✅ Screenshot uploaded:', screenshotUrl);

            // ================================================================
            // Extract Numeric Order ID for Database Update
            // ================================================================
            const numericOrderId = parseInt(window.currentOrderId.replace('FD', ''), 10);

            if (isNaN(numericOrderId) || numericOrderId <= 0) {
                throw new Error('Invalid order ID format');
            }

            console.log('🔢 Numeric Order ID:', numericOrderId);

            // ================================================================
            // Update Order in Database
            // ================================================================
            const { error: updateError } = await supabaseClient
                .from('orders')
                .update({
                    utr_number: utrValue,
                    payment_screenshot_url: screenshotUrl,
                    payment_status: 'Verification Pending',
                    payment_submitted_at: new Date().toISOString()
                })
                .eq('id', numericOrderId);

            if (updateError) {
                throw updateError;
            }

            console.log('✅ Order updated successfully');

            // ================================================================
            // Show Success Page
            // ================================================================
            showSuccessPage(utrValue);

        } catch (error) {
            console.error('❌ Payment submission error:', error);

            const errorMessage = PaymentValidation.handleUploadError(error);
            PaymentValidation.showNotification(errorMessage, 'error');

            // Re-enable button
            submitButton.disabled = false;
            submitButton.textContent = originalButtonText;
        }
    });
}

// ============================================================================
// FUNCTION: Show Success Page
// ============================================================================
function showSuccessPage(utrNumber) {
    const paymentCard = document.getElementById('paymentCard');
    if (!paymentCard) return;

    paymentCard.innerHTML = `
        <div class="text-center mb-6">
            <div class="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4 animate-bounce">
                <svg class="w-12 h-12 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                </svg>
            </div>
            <h2 class="text-3xl font-bold text-gray-800 mb-2">Payment Submitted Successfully!</h2>
            <p class="text-gray-600">Awaiting Verification</p>
        </div>

        <div class="bg-gray-50 rounded-xl p-6 mb-6 space-y-3">
            <div class="flex justify-between">
                <span class="text-gray-600">Order ID</span>
                <span class="font-semibold text-gray-800">${window.currentOrderId}</span>
            </div>
            <div class="flex justify-between">
                <span class="text-gray-600">Amount Paid</span>
                <span class="font-semibold text-gray-800">₹${window.currentAmount.toFixed(2)}</span>
            </div>
            <div class="flex justify-between">
                <span class="text-gray-600">UTR Number</span>
                <span class="font-semibold text-gray-800">${utrNumber}</span>
            </div>
            <div class="flex justify-between">
                <span class="text-gray-600">Submitted At</span>
                <span class="font-semibold text-gray-800">${new Date().toLocaleTimeString()}</span>
            </div>
        </div>

        <div class="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
            <p class="text-sm text-blue-800">
                <strong>📱 Next Steps:</strong><br>
                Your payment proof has been submitted to the petrol pump for verification.
                You will be notified once your payment is verified.
            </p>
        </div>

        <button onclick="window.location.href='login.html'" 
                class="w-full px-6 py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition">
            Back to Home
        </button>
    `;

    // Clear stored order data
    localStorage.removeItem('pendingOrder');
}

// ============================================================================
// FUNCTION: Show Error Page
// ============================================================================
function showErrorPage(title, message) {
    const paymentCard = document.getElementById('paymentCard');
    if (!paymentCard) {
        alert(`${title}: ${message}`);
        return;
    }

    paymentCard.innerHTML = `
        <div class="text-center mb-6">
            <div class="mx-auto w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <svg class="w-12 h-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
            </div>
            <h2 class="text-3xl font-bold text-gray-800 mb-2">${title}</h2>
            <p class="text-gray-600">${message}</p>
        </div>

        <div class="space-y-3">
            <button onclick="window.location.href='order-summary.html'" 
                    class="w-full px-6 py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition">
                Create New Order
            </button>
            <button onclick="window.location.href='login.html'" 
                    class="w-full px-6 py-3 bg-gray-200 text-gray-800 rounded-xl font-medium hover:bg-gray-300 transition">
                Back to Home
            </button>
        </div>
    `;
}

// ============================================================================
// USAGE INSTRUCTIONS
// ============================================================================
// 1. Replace the existing window.addEventListener('DOMContentLoaded', ...)
//    in qr_payment_section.html with this entire code block
// 2. Ensure payment_validation.js is loaded before this script
// 3. Ensure Supabase client is initialized as 'supabaseClient'
// 4. Test thoroughly with various scenarios
// ============================================================================
