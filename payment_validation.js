/**
 * Payment Validation Utilities
 * Shared validation functions for UPI payment verification system
 */

const PaymentValidation = {
    /**
     * Validate file type - only JPG and PNG allowed
     * @param {File} file - File object to validate
     * @returns {Object} { valid: boolean, error: string }
     */
    validateFileType(file) {
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
        const fileExtension = file.name.split('.').pop().toLowerCase();
        const allowedExtensions = ['jpg', 'jpeg', 'png'];

        if (!allowedTypes.includes(file.type) || !allowedExtensions.includes(fileExtension)) {
            return {
                valid: false,
                error: 'Only JPG and PNG image files are allowed'
            };
        }

        return { valid: true, error: null };
    },

    /**
     * Validate file size - max 5MB
     * @param {File} file - File object to validate
     * @returns {Object} { valid: boolean, error: string }
     */
    validateFileSize(file) {
        const maxSizeBytes = 5 * 1024 * 1024; // 5MB in bytes

        if (file.size > maxSizeBytes) {
            const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
            return {
                valid: false,
                error: `File size (${fileSizeMB}MB) exceeds maximum allowed size of 5MB`
            };
        }

        return { valid: true, error: null };
    },

    /**
     * Validate UTR number format
     * UTR numbers are typically 12-22 alphanumeric characters
     * @param {string} utr - UTR number to validate
     * @returns {Object} { valid: boolean, error: string }
     */
    validateUTR(utr) {
        if (!utr || typeof utr !== 'string') {
            return {
                valid: false,
                error: 'UTR number is required'
            };
        }

        const trimmedUTR = utr.trim();

        if (trimmedUTR.length < 12 || trimmedUTR.length > 22) {
            return {
                valid: false,
                error: 'UTR number must be between 12 and 22 characters'
            };
        }

        // Check if alphanumeric only
        const alphanumericRegex = /^[a-zA-Z0-9]+$/;
        if (!alphanumericRegex.test(trimmedUTR)) {
            return {
                valid: false,
                error: 'UTR number must contain only letters and numbers'
            };
        }

        return { valid: true, error: null };
    },

    /**
     * Validate screenshot file completely
     * @param {File} file - File object to validate
     * @returns {Object} { valid: boolean, error: string }
     */
    validateScreenshot(file) {
        if (!file) {
            return {
                valid: false,
                error: 'Payment screenshot is required'
            };
        }

        // Check file type
        const typeValidation = this.validateFileType(file);
        if (!typeValidation.valid) {
            return typeValidation;
        }

        // Check file size
        const sizeValidation = this.validateFileSize(file);
        if (!sizeValidation.valid) {
            return sizeValidation;
        }

        return { valid: true, error: null };
    },

    /**
     * Handle upload errors with user-friendly messages
     * @param {Error} error - Error object
     * @returns {string} User-friendly error message
     */
    handleUploadError(error) {
        console.error('Upload error:', error);

        // Common Supabase Storage errors
        if (error.message?.includes('storage')) {
            return 'Failed to upload screenshot. Please check your internet connection and try again.';
        }

        if (error.message?.includes('bucket')) {
            return 'Storage configuration error. Please contact support.';
        }

        if (error.message?.includes('size')) {
            return 'File size too large. Please upload a smaller image (max 5MB).';
        }

        if (error.message?.includes('network')) {
            return 'Network error. Please check your connection and try again.';
        }

        // Generic error
        return error.message || 'An unexpected error occurred. Please try again.';
    },

    /**
     * Generate unique filename for screenshot
     * @param {string} orderId - Order ID
     * @param {string} fileExtension - File extension (jpg, png)
     * @returns {string} Unique filename
     */
    generateScreenshotFilename(orderId, fileExtension) {
        const timestamp = Date.now();
        const ext = fileExtension.toLowerCase().replace('.', '');
        return `${orderId}_${timestamp}.${ext}`;
    },

    /**
     * Show notification toast
     * @param {string} message - Message to display
     * @param {string} type - 'success', 'error', 'warning', 'info'
     */
    showNotification(message, type = 'info') {
        const colors = {
            success: 'bg-green-500',
            error: 'bg-red-500',
            warning: 'bg-yellow-500',
            info: 'bg-blue-500'
        };

        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 ${colors[type] || colors.info} text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-slide-in`;
        notification.textContent = message;
        notification.style.animation = 'slideIn 0.3s ease-out';

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease-in';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
};

// Add CSS animations for notifications
if (!document.getElementById('payment-validation-styles')) {
    const style = document.createElement('style');
    style.id = 'payment-validation-styles';
    style.textContent = `
        @keyframes slideIn {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        
        @keyframes slideOut {
            from {
                transform: translateX(0);
                opacity: 1;
            }
            to {
                transform: translateX(100%);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PaymentValidation;
}
