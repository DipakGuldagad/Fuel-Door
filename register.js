/**
 * register.js
 * Logic for the dedicated registration page
 */

(function () {
    // 1. Redirect if already logged in (using shared utility)
    if (window.AuthUtils.redirectIfLoggedIn()) return;

    // 2. Initialize Supabase Client
    const supa = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);

    // 3. DOM Elements
    const registerForm = document.getElementById('registerForm');
    const regPan = document.getElementById('regPan');
    const regPanError = document.getElementById('regPanError');
    const regName = document.getElementById('regName');
    const regNameError = document.getElementById('regNameError');
    const regBtn = document.getElementById('regBtn');

    const authContainer = document.getElementById('authContainer');
    const greetingSection = document.getElementById('greetingSection');
    const greetingName = document.getElementById('greetingName');

    // 4. Regex Patterns
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;

    // --- Validation ---
    function validateForm() {
        const pan = regPan.value.trim().toUpperCase();
        const name = regName.value.trim();

        const isPanValid = panRegex.test(pan);
        const isNameValid = name.length >= 2;

        regBtn.disabled = !(isPanValid && isNameValid);
    }

    [regPan, regName].forEach(input => {
        input.addEventListener('input', () => {
            if (input === regPan) input.value = input.value.toUpperCase();
            validateForm();
        });
    });

    // --- Registration Flow ---
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const pan = regPan.value.trim().toUpperCase();
        const name = regName.value.trim();

        if (!pan || !name) return;

        regBtn.disabled = true;
        regBtn.textContent = 'Creating Account...';
        regPanError.textContent = '';
        regNameError.textContent = '';

        try {
            // 1. Check if already registered
            const { data: existing } = await supa
                .from('pan_users')
                .select('id')
                .eq('pan_number', pan)
                .single();

            if (existing) {
                showError(regPanError, 'This PAN is already registered. Please sign in.');
                regBtn.disabled = false;
                regBtn.textContent = 'Create Account';
                return;
            }

            // 2. Insert into pan_users
            const { data: user, error } = await supa
                .from('pan_users')
                .insert([{ full_name: name, pan_number: pan }])
                .select()
                .single();

            if (error) throw error;

            console.log('Registration success:', user);

            // Save session using shared utility
            window.AuthUtils.saveSession(user);

            // Show Greeting
            authContainer.style.display = 'none';
            greetingName.textContent = `Welcome, ${user.full_name}`;
            greetingSection.classList.remove('hidden');
            setTimeout(() => greetingSection.classList.add('show'), 10);

            // Redirect to dashboard
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 2000);

        } catch (err) {
            console.error('Registration error:', err);
            showError(regPanError, err.message || 'Error creating account. Please try again.');
            regBtn.disabled = false;
            regBtn.textContent = 'Create Account';
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
