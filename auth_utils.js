/**
 * auth_utils.js
 * Shared authentication and session utilities for Fuel@Door
 */

const AuthUtils = {
    STORAGE_KEY: 'user',

    /**
     * Gets the current user session from localStorage
     * @returns {Object|null} The user object or null if not logged in
     */
    getSession: function () {
        try {
            const userJson = localStorage.getItem(this.STORAGE_KEY);
            return userJson ? JSON.parse(userJson) : null;
        } catch (e) {
            console.error("Error reading session:", e);
            return null;
        }
    },

    /**
     * Saves user session to localStorage
     * @param {Object} user - User object { pan_number, full_name }
     */
    saveSession: function (user) {
        if (!user) return;
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify({
            full_name: user.full_name,
            pan_number: user.pan_number
        }));
    },

    /**
     * Clears session and redirects to login
     */
    logout: function () {
        localStorage.removeItem(this.STORAGE_KEY);
        window.location.href = 'login.html';
    },

    /**
     * Redirects to login if user is not authenticated
     * @returns {boolean} True if redirecting
     */
    protectPage: function () {
        if (!this.getSession()) {
            window.location.replace('login.html');
            return true;
        }
        return false;
    },

    /**
     * Redirects to home if user is already authenticated
     * @returns {boolean} True if redirecting
     */
    redirectIfLoggedIn: function () {
        if (this.getSession()) {
            window.location.replace('index.html');
            return true;
        }
        return false;
    }
};

// Export for use in other scripts
window.AuthUtils = AuthUtils;
