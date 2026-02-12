// Enhanced Location Fix with Detailed Debugging
// Add this script to your login.html to debug location issues

(function() {
    console.log('=== Location Debug Info ===');
    console.log('Protocol:', window.location.protocol);
    console.log('Host:', window.location.host);
    console.log('Geolocation available:', 'geolocation' in navigator);
    console.log('Is secure context:', window.isSecureContext);
    
    if (!window.isSecureContext && window.location.protocol !== 'file:') {
        console.warn('⚠️ NOT SECURE CONTEXT - Geolocation may be blocked!');
        console.warn('Solution: Access via https:// or use localhost with HTTPS');
    }
    
    // Test geolocation immediately
    if ('geolocation' in navigator) {
        console.log('Testing geolocation permissions...');
        
        navigator.permissions.query({name: 'geolocation'}).then(function(result) {
            console.log('Geolocation permission status:', result.state);
            
            if (result.state === 'denied') {
                console.error('❌ Location permission DENIED');
                console.log('Fix: Clear site settings in browser or use a different browser');
            } else if (result.state === 'prompt') {
                console.log('✓ Will prompt for permission when requested');
            } else if (result.state === 'granted') {
                console.log('✓ Location permission GRANTED');
            }
        }).catch(function(error) {
            console.error('Permission query error:', error);
        });
    } else {
        console.error('❌ Geolocation not supported by browser');
    }
})();

// Enhanced getCurrentLocation with debugging
window.debugGetLocation = function() {
    console.log('Manual location test started...');
    
    if (!navigator.geolocation) {
        alert('Geolocation is not supported by this browser');
        return;
    }
    
    console.log('Requesting position...');
    
    navigator.geolocation.getCurrentPosition(
        function(position) {
            console.log('✅ SUCCESS! Location obtained:');
            console.log('Latitude:', position.coords.latitude);
            console.log('Longitude:', position.coords.longitude);
            console.log('Accuracy:', position.coords.accuracy, 'meters');
            alert(`Location obtained!\nLat: ${position.coords.latitude}\nLon: ${position.coords.longitude}`);
        },
        function(error) {
            console.error('❌ Geolocation error:');
            console.error('Code:', error.code);
            console.error('Message:', error.message);
            
            let userMessage = 'Location error: ';
            switch(error.code) {
                case 1: // PERMISSION_DENIED
                    userMessage += 'Permission denied. Please allow location access in your browser settings.';
                    console.log('Fix: Click the location icon in address bar and allow location');
                    break;
                case 2: // POSITION_UNAVAILABLE
                    userMessage += 'Position unavailable. Check your device location settings.';
                    break;
                case 3: // TIMEOUT
                    userMessage += 'Request timed out. Try again.';
                    break;
                default:
                    userMessage += error.message;
            }
            
            alert(userMessage);
        },
        {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
        }
    );
};

console.log('To test location manually, run: debugGetLocation()');

