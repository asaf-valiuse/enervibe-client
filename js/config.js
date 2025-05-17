/**
 * Configuration Module
 * Central place for application configuration settings
 */

const config = {
    // Application mode
    appMode: {
        simplified: true, // Set to true for simplified mode, false for full mode
    },
    
    // API configuration
    api: {
        // Base URL for API endpoints
        baseUrl: 'https://ev-api.valiuse.com',
        
        // API endpoints
        endpoints: {
            login: '/auth/login',
            userDetails: '/user/details'
        }
    },
    
    // Storage keys
    storage: {
        authToken: 'authToken',
        username: 'username',
        userData: 'user_data'
    }
};

// Export the configuration object
export default config;
