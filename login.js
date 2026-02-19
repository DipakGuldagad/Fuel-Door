/**
 * login.js
 * Logic for the dedicated login page
 */

(function () {
    // 1. Redirect if already logged in (using shared utility)
    if (window.AuthUtils.redirectIfLoggedIn()) return;

    // 2. Initialize Supabase Client
    const supa = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);

    // 3. DOM Elements
    const loginForm = document.getElementById('loginForm');
    const loginPan = document.getElementById('loginPan');
    const loginPanError = document.getElementById('loginPanError');
    const loginBtn = document.getElementById('loginBtn');

    const authContainer = document.getElementById('authContainer');
    const greetingSection = document.getElementById('greetingSection');
    const greetingName = document.getElementById('greetingName');

    // 4. Regex Patterns
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;

    // --- Login Flow ---
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const pan = loginPan.value.trim().toUpperCase();

        if (!panRegex.test(pan)) {
            showError(loginPanError, 'Please enter a valid PAN number (ABCDE1234F)');
            return;
        }

        loginBtn.disabled = true;
        loginBtn.textContent = 'Verifying...';
        loginPanError.textContent = '';

        try {
            const { data: user, error } = await supa
                .from('pan_users')
                .select('*')
                .eq('pan_number', pan)
                .single();

            if (error || !user) {
                showError(loginPanError, 'User not found. Please register first.');
                loginBtn.disabled = false;
                loginBtn.textContent = 'Sign In';
                return;
            }

            console.log('Login success:', user);

            // Save session using shared utility
            window.AuthUtils.saveSession(user);

            // Show Greeting
            authContainer.style.display = 'none';
            greetingName.textContent = `Welcome, ${user.full_name}`;
            greetingSection.classList.remove('hidden');
            setTimeout(() => greetingSection.classList.add('show'), 10);

            // Redirect to index.html after greeting
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 2500);

        } catch (err) {
            console.error('Login error:', err);
            showError(loginPanError, 'Security verification failed. Please try again.');
            loginBtn.disabled = false;
            loginBtn.textContent = 'Sign In';
        }
    });

    // Helper
    function showError(element, message) {
        if (element) {
            element.textContent = message;
            element.style.color = '#ff4444';
        }
    }

})();
