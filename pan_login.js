document.addEventListener('DOMContentLoaded', () => {
    // Initialize Supabase
    const supabaseUrl = window.SUPABASE_URL;
    const supabaseKey = window.SUPABASE_ANON_KEY;
    const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

    const loginForm = document.getElementById('pan-login-form');
    const panInput = document.getElementById('pan-number');
    const loginBtn = document.getElementById('login-btn');
    const statusMessage = document.getElementById('status-message');

    // Manual Location Elements
    const manualLocationGroup = document.getElementById('manual-location-group');
    const manualLocationInput = document.getElementById('manual-location');

    // PAN Regex: 5 letters, 4 numbers, 1 letter
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]$/;

    // Input Validation Visualization
    panInput.addEventListener('input', (e) => {
        // Force uppercase
        e.target.value = e.target.value.toUpperCase();

        const val = e.target.value;
        if (panRegex.test(val)) {
            panInput.style.borderColor = '#4cd137';
        } else if (val.length === 10) {
            panInput.style.borderColor = '#ff4d4d';
        } else {
            panInput.style.borderColor = 'rgba(255, 255, 255, 0.1)';
        }
        statusMessage.textContent = ''; // Clear error on typing
    });

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const pan = panInput.value.trim();

        if (!panRegex.test(pan)) {
            showError("Invalid PAN format. Example: ABCDE1234F");
            return;
        }

        setLoading(true);

        try {
            // 1. Get Location
            let lat = null;
            let lng = null;
            let locationName = "Unknown";

            try {
                const position = await getGeolocation();
                lat = position.coords.latitude;
                lng = position.coords.longitude;
            } catch (geoError) {
                console.warn("Geolocation failed:", geoError);

                // Check if manual location is visible and filled
                if (manualLocationGroup.classList.contains('hidden')) {
                    // Show manual input and ask user to fill it
                    manualLocationGroup.classList.remove('hidden');
                    manualLocationInput.required = true;
                    showError("Location access denied. Please enter location manually.");
                    setLoading(false);
                    return;
                } else {
                    // Manual input is visible
                    const manualLoc = manualLocationInput.value.trim();
                    if (!manualLoc) {
                        showError("Please enter your current location.");
                        setLoading(false);
                        return;
                    }
                    locationName = manualLoc;
                    // We don't have lat/lng for manual entry, so we leave them null or set to 0
                    lat = 0;
                    lng = 0;
                }
            }

            // 2. Check PAN in Database
            const { data, error } = await supabase
                .from('pan_users')
                .select('full_name')
                .eq('pan_number', pan)
                .single();

            if (error || !data) {
                // If single() returns no rows, it throws error with code PGRST116
                if (error && error.code !== 'PGRST116') {
                    console.error('Database Error:', error);
                    showError("System error. Please try again.");
                } else {
                    showError("PAN number not registered.");
                }
                setLoading(false);
                return;
            }

            const fullName = data.full_name;

            // 3. Log Login Attempt
            const { error: logError } = await supabase
                .from('pan_login_logs')
                .insert([{
                    pan_number: pan,
                    latitude: lat,
                    longitude: lng,
                    login_time: new Date().toISOString()
                }]);

            if (logError) {
                console.warn('Logging failed:', logError);
            }

            // 4. Success
            showSuccess(`Welcome, ${fullName}!`);

            setTimeout(() => {
                alert(`Login Successful!\nUser: ${fullName}\nLocation: ${locationName !== "Unknown" ? locationName : lat + ", " + lng}`);
                setLoading(false);
                // window.location.href = 'dashboard.html';
            }, 1000);

        } catch (err) {
            console.error(err);
            showError("An unexpected error occurred.");
            setLoading(false);
        }
    });

    async function getGeolocation() {
        if (!navigator.geolocation) {
            throw new Error("Geolocation not supported");
        }

        const getPos = (options) => {
            return new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, options);
            });
        };

        try {
            // Attempt 1: High Accuracy (5s timeout)
            return await getPos({ enableHighAccuracy: true, timeout: 5000, maximumAge: 0 });
        } catch (err) {
            // If User Denied (code 1), do not retry
            if (err.code === 1) {
                throw new Error("User denied Geolocation");
            }

            console.warn("High accuracy geolocation failed, retrying with low accuracy...", err);

            try {
                // Attempt 2: Low Accuracy (20s timeout, allow any cached)
                return await getPos({ enableHighAccuracy: false, timeout: 20000, maximumAge: Infinity });
            } catch (err2) {
                if (err2.code === 1) {
                    throw new Error("User denied Geolocation");
                }
                throw err2;
            }
        }
    }

    function setLoading(isLoading) {
        if (isLoading) {
            loginBtn.classList.add('loading');
            loginBtn.disabled = true;
            statusMessage.textContent = '';
        } else {
            loginBtn.classList.remove('loading');
            loginBtn.disabled = false;
        }
    }

    function showError(msg) {
        statusMessage.textContent = msg;
        statusMessage.classList.remove('success-message');
    }

    function showSuccess(msg) {
        statusMessage.textContent = msg;
        statusMessage.classList.add('success-message');
    }
});
