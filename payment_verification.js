/**
 * Payment Verification Functions for Pump Dashboard
 * Handles loading, displaying, approving, and rejecting payment verifications
 */

// Use a self-executing function to avoid global namespace pollution
(function () {
    // DOM Element Helpers with logging
    const getEl = (id) => {
        const el = document.getElementById(id);
        if (!el) console.warn(`[Dashboard Warning] Element with ID "${id}" was not found.`);
        return el;
    };

    // Lazy load elements to ensure they exist when accessed
    const elements = {
        get loading() { return getEl('loadingPayments'); },
        get empty() { return getEl('noPayments'); },
        get list() { return getEl('paymentsList'); },
        get count() { return getEl('pendingPaymentsCount'); },
        get refreshBtn() { return getEl('refreshPayments'); },
        get modal() { return getEl('screenshotModal'); },
        get modalImg() { return getEl('modalScreenshot'); }
    };

    /**
     * Load pending payments for verification
     */
    async function loadPendingPayments() {
        if (!window.currentPumpId) {
            console.error('No pump ID available for loading payments');
            return;
        }

        showLoadingPaymentsState();

        try {
            const { data: payments, error } = await supa
                .from(ORDERS_TABLE)
                .select('*')
                .eq('assigned_pump_id', window.currentPumpId)
                .eq('payment_status', 'Verification Pending')
                .order('payment_submitted_at', { ascending: false });

            if (error) throw error;
            displayPendingPayments(payments || []);
        } catch (error) {
            console.error('❌ Error loading pending payments:', error);
            showPaymentsErrorState('Failed to load pending payments: ' + error.message);
        }
    }

    /**
     * Display pending payments in the UI
     */
    async function displayPendingPayments(payments) {
        hideLoadingPaymentsState();

        // Update count safely
        if (elements.count) {
            elements.count.textContent = `${payments.length} Pending`;
        }

        if (payments.length === 0) {
            showNoPaymentsState();
            return;
        }

        // Create payment cards with async signed URL loading
        if (elements.list) {
            elements.list.innerHTML = '';
            for (const payment of payments) {
                const paymentCard = await createPaymentCard(payment);
                elements.list.appendChild(paymentCard);
            }
            elements.list.classList.remove('hidden');
        }

        if (elements.empty) elements.empty.classList.add('hidden');
    }

    /**
     * Create a payment verification card
     */
    async function createPaymentCard(payment) {
        const card = document.createElement('div');
        card.className = 'bg-white p-6 hover:bg-slate-50/50 transition-colors animate-fade-in';
        card.id = `payment-${payment.id}`;

        const submittedDate = new Date(payment.payment_submitted_at);
        const formattedDate = submittedDate.toLocaleString('en-IN', {
            day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
        });

        const orderId = `FD${payment.id}`;
        let screenshotUrl = payment.payment_screenshot_url;

        if (screenshotUrl && !screenshotUrl.startsWith('http')) {
            try {
                const { data, error } = await supa.storage.from('payment-screenshots').createSignedUrl(screenshotUrl, 3600);
                if (data) screenshotUrl = data.signedUrl;
            } catch (err) {
                console.error('Error generating signed URL:', err);
            }
        }

        const status = payment.payment_status || 'Verification Pending';
        const statusColors = {
            'Verification Pending': 'bg-orange-100 text-orange-600',
            'Paid': 'bg-green-100 text-green-600',
            'Rejected': 'bg-red-100 text-red-600'
        };
        const badgeClass = statusColors[status] || 'bg-slate-100 text-slate-600';

        card.innerHTML = `
            <div class="space-y-4">
                <div class="flex items-start justify-between">
                    <div>
                        <div class="flex items-center gap-2 mb-1">
                            <h3 class="font-bold text-slate-900 truncate max-w-[120px]">${window.escapeHtml(payment.customer_name || 'Customer')}</h3>
                            <span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${badgeClass}">${status}</span>
                        </div>
                        <p class="text-xs text-slate-500">${window.escapeHtml(payment.customer_mobile || 'No phone')}</p>
                    </div>
                    <div class="text-right">
                        <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">#${orderId}</span>
                        <p class="text-xs font-semibold text-green-600">₹${payment.total_amount || 0}</p>
                    </div>
                </div>
                
                <div class="bg-slate-100 rounded-lg p-2 flex justify-between items-center">
                    <span class="text-[10px] text-slate-500 font-medium">UTR:</span>
                    <span class="text-xs font-mono font-bold text-slate-700">${window.escapeHtml(payment.utr_number || 'N/A')}</span>
                </div>
                
                <div class="relative group">
                    <div class="aspect-video w-full overflow-hidden rounded-lg border border-slate-200 bg-slate-100 flex items-center justify-center relative">
                        <img 
                            src="${screenshotUrl || ''}" 
                            id="screenshot-img-${payment.id}"
                            class="w-full h-full object-contain transition-transform group-hover:scale-105"
                            onerror="this.src='https://placehold.co/400x300?text=Image+Not+Found'; this.classList.add('opacity-50');"
                            onclick="window.viewScreenshot(this.src)"
                        />
                        <div class="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors pointer-events-none"></div>
                    </div>
                    <div class="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <span class="bg-black/50 text-white text-[10px] px-2 py-1 rounded backdrop-blur-sm">Click to enlarge</span>
                    </div>
                </div>
                
                <div class="flex gap-2">
                    <button onclick="window.approvePayment(${payment.id})" class="flex-1 py-2 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-green-600 transition-colors shadow-sm">Confirm</button>
                    <button onclick="window.rejectPayment(${payment.id})" class="px-3 py-2 border border-slate-200 text-slate-400 rounded-lg text-xs font-bold hover:text-red-600 hover:border-red-100 transition-colors">Reject</button>
                </div>
                <p class="text-[10px] text-center text-slate-400">Sent ${formattedDate}</p>
            </div>
        `;
        return card;
    }

    // Export functions to window safely
    window.loadPendingPayments = loadPendingPayments;

    window.approvePayment = async function (orderId) {
        if (!confirm('Approve this payment?')) return;
        try {
            const pumpAuth = JSON.parse(localStorage.getItem('pumpAuth'));
            const { error } = await supa.from(ORDERS_TABLE).update({
                payment_status: 'Paid',
                payment_verified_by: pumpAuth.userId,
                payment_verified_at: new Date().toISOString()
            }).eq('id', orderId);
            if (error) throw error;
            showNotification('Payment approved!', 'success');
            const card = document.getElementById(`payment-${orderId}`);
            if (card) card.remove();
            loadPendingPayments();
        } catch (e) { showNotification(e.message, 'error'); }
    };

    window.rejectPayment = async function (orderId) {
        if (!confirm('Reject this payment?')) return;
        try {
            const { error } = await supa.from(ORDERS_TABLE).update({ payment_status: 'Rejected' }).eq('id', orderId);
            if (error) throw error;
            showNotification('Payment rejected', 'warning');
            const card = document.getElementById(`payment-${orderId}`);
            if (card) card.remove();
            loadPendingPayments();
        } catch (e) { showNotification(e.message, 'error'); }
    };

    window.viewScreenshot = function (url) {
        if (!url || !elements.modal || !elements.modalImg) return;
        elements.modalImg.src = url;
        elements.modal.classList.remove('hidden');
        elements.modal.classList.add('flex');
        document.body.style.overflow = 'hidden';
    };

    window.closeScreenshotModal = function () {
        if (!elements.modal || !elements.modalImg) return;
        elements.modal.classList.add('hidden');
        elements.modal.classList.remove('flex');
        elements.modalImg.src = '';
        document.body.style.overflow = '';
    };

    function showNotification(message, type = 'info') {
        const colors = { success: 'bg-green-500', error: 'bg-red-500', warning: 'bg-yellow-500', info: 'bg-blue-500' };
        const toast = document.createElement('div');
        toast.className = `fixed top-4 right-4 ${colors[type] || colors.info} text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-fade-in`;
        toast.innerHTML = `<div class="flex items-center gap-2"><span>${message}</span></div>`;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    }

    function showLoadingPaymentsState() {
        if (elements.loading) elements.loading.classList.remove('hidden');
        if (elements.empty) elements.empty.classList.add('hidden');
        if (elements.list) elements.list.classList.add('hidden');
    }

    function hideLoadingPaymentsState() {
        if (elements.loading) elements.loading.classList.add('hidden');
    }

    function showNoPaymentsState() {
        hideLoadingPaymentsState();
        if (elements.empty) elements.empty.classList.remove('hidden');
        if (elements.list) elements.list.classList.add('hidden');
    }

    function showPaymentsErrorState(msg) {
        hideLoadingPaymentsState();
        if (elements.list) {
            elements.list.innerHTML = `<div class="text-center py-12 text-red-600">${msg}</div>`;
            elements.list.classList.remove('hidden');
        }
    }

    // Setup Realtime Subscription for Payment Verification
    function setupRealtimePayments() {
        if (!window.supa || !window.currentPumpId) return;

        console.log('📡 Dashboard: Setting up realtime payment listener');
        supa.channel('payment-verifications')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: ORDERS_TABLE,
                filter: `assigned_pump_id=eq.${window.currentPumpId}`
            }, (payload) => {
                console.log('🔄 Dashboard: Payment Change Detected', payload.eventType);
                // Reload full list to ensure accuracy and count updates
                loadPendingPayments();

                // Also trigger order list reload if defined in main dashboard script
                if (window.loadAssignedOrders) window.loadAssignedOrders();
            })
            .subscribe();
    }

    // Initialization logic
    function init() {
        if (elements.refreshBtn) elements.refreshBtn.addEventListener('click', loadPendingPayments);
        if (elements.modal) {
            elements.modal.addEventListener('click', (e) => { if (e.target === elements.modal) window.closeScreenshotModal(); });
        }
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && elements.modal && !elements.modal.classList.contains('hidden')) window.closeScreenshotModal();
        });

        // Load initial data and setup realtime
        if (window.currentPumpId) {
            loadPendingPayments();
            setupRealtimePayments();
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
