/**
 * Configuration Module
 * Central place for application configuration settings
 */

// Environment detection
const isProduction = window.location.hostname !== 'localhost' && 
                     window.location.hostname !== '127.0.0.1';

// API endpoints configuration
const apiEndpoints = {
    local: 'http://localhost:3000',
    production: 'https://ev-api.valiuse.com'
};

// Get stored API preference (only if not in production)
let storedApiPreference = null;
if (!isProduction) {
    storedApiPreference = localStorage.getItem('apiEndpointPreference');
    // Default to production API for testing
    if (!storedApiPreference) {
        storedApiPreference = apiEndpoints.production;
    }
}

const config = {
    // Environment settings
    environment: {
        isProduction: isProduction,
        allowEndpointSwitch: !isProduction // Only allow switching in non-production
    },
    
    // Application mode
    appMode: {
        simplified: true, // Set to true for simplified mode, false for full mode
    },
    
    // API configuration
    api: {
        // Available endpoints
        endpoints: {
            login: '/auth/login',
            userDetails: '/user/details/'  // Added trailing slash
        },
        
        // API endpoint options
        endpointOptions: {
            local: apiEndpoints.local,
            production: apiEndpoints.production
        },
        
        // Current base URL (use stored preference if available and not in production)
        baseUrl: isProduction ? 
                 apiEndpoints.production : 
                 (storedApiPreference || apiEndpoints.local)
    },
    
    // Storage keys
    storage: {
        authToken: 'authToken',
        username: 'username',
        userData: 'user_data',
        apiPreference: 'apiEndpointPreference'
    },
    
    // Function to switch API endpoint (only works in non-production)
    switchApiEndpoint: function(endpointType) {
        if (isProduction) return false; // Prevent switching in production
        
        if (endpointType === 'local' || endpointType === 'production') {
            this.api.baseUrl = this.api.endpointOptions[endpointType];
            localStorage.setItem(this.storage.apiPreference, this.api.baseUrl);
            return true;
        }
        return false;
    }
};

// Export the configuration object
export default config;
