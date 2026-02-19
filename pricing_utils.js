/**
 * Pricing Utilities for Fuel@Door
 * Centralizes delivery fee and total amount calculations
 */

const PricingUtils = {
    /**
     * Calculate delivery fee based on quantity slabs
     * 1–10 liters → ₹60
     * 11–25 liters → ₹40
     * 26–50 liters → ₹20
     * 50+ liters → Free
     * 
     * @param {number} quantity - Quantity in liters or kWh
     * @returns {number} Delivery fee in ₹
     */
    calculateDeliveryFee: function (quantity) {
        const qty = parseFloat(quantity) || 0;
        if (qty <= 0) return 60; // Default for invalid/minimum
        if (qty <= 10) return 60;
        if (qty <= 25) return 40;
        if (qty <= 50) return 20;
        return 0;
    },

    /**
     * Get delivery fee description for UI
     * @param {number} quantity 
     * @returns {string}
     */
    getDeliveryFeeDescription: function (quantity) {
        const qty = parseFloat(quantity) || 0;
        if (qty <= 10) return "Slab: 1-10L (₹60)";
        if (qty <= 25) return "Slab: 11-25L (₹40)";
        if (qty <= 50) return "Slab: 26-50L (₹20)";
        return "Slab: 50L+ (Free)";
    },

    /**
     * Calculate total order details
     * @param {number} quantity 
     * @param {number} pricePerUnit 
     * @param {number} taxRate - Default 0
     * @returns {object} { fuelCost, deliveryFee, totalAmount }
     */
    calculateOrder: function (quantity, pricePerUnit, taxRate = 0) {
        const qty = parseFloat(quantity) || 0;
        const price = parseFloat(pricePerUnit) || 0;
        const tax = parseFloat(taxRate) || 0;

        const fuelCost = qty * price;
        const deliveryFee = this.calculateDeliveryFee(qty);
        const totalAmount = fuelCost + deliveryFee + (fuelCost + deliveryFee) * tax;

        const result = {
            fuelCost: parseFloat(fuelCost.toFixed(2)) || 0,
            deliveryFee: parseFloat(deliveryFee.toFixed(2)) || 0,
            totalAmount: parseFloat(totalAmount.toFixed(2)) || 0
        };

        console.log(`[PricingUtils] Calculation: Qty=${qty}, Price=${price}, Tax=${tax} => Total=${result.totalAmount}`);
        return result;
    }
};

// Export to window for browser use
window.PricingUtils = PricingUtils;
