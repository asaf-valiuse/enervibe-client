/**
 * Authentication Module
 * Handles user login and token storage
 */

import config from './config.js';

console.log('Auth.js loaded - Version 3.1');

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM Content Loaded - Initializing auth module');
    
    // Initialize API endpoint switcher
    initApiEndpointSwitcher();
    
    // Check if user is already logged in
    const token = localStorage.getItem(config.storage.authToken);
    if (token) {
        console.log('Token found, verifying with server before redirecting');
        
        // Show loading indicator
        const loadingIndicator = document.getElementById('loading-indicator');
        if (loadingIndicator) {
            loadingIndicator.classList.remove('hidden');
        }
        
        // Verify token by fetching user details
        verifyTokenAndRedirect(token);
    }
    
    /**
     * Verify token by fetching user details and redirect if successful
     * @param {string} token - The authentication token
     */
    async function verifyTokenAndRedirect(token) {
        try {
            // Always use the proxy endpoint with full URL
            const userDetailsUrl = 'http://localhost:3000/api/user/details/';
            console.log('DEBUG: Verifying token by fetching user details from:', userDetailsUrl);
            console.log('DEBUG: Token being used (first 10 chars):', token.substring(0, 10) + '...');
            
            // Ensure we're using the proper Authorization header format
            const authHeader = `Bearer ${token}`;
            console.log('DEBUG: Making fetch request with headers:', {
                'Authorization': authHeader.substring(0, 20) + '...',
                'Content-Type': 'application/json'
            });
            
            const response = await fetch(userDetailsUrl, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
                // Removed credentials: 'include' to avoid CORS issues
            });
            
            console.log('DEBUG: User details response status:', response.status);
            
            // Clone the response to log its body content
            const clonedResponse = response.clone();
            clonedResponse.text().then(text => {
                console.log('DEBUG: User details response body text:', text);
                try {
                    const jsonData = JSON.parse(text);
                    console.log('DEBUG: User details parsed JSON data:', jsonData);
                } catch (e) {
                    console.error('DEBUG: Could not parse user details response as JSON:', e);
                }
            });
            
            // If response is not ok, throw error
            if (!response.ok) {
                console.log('DEBUG: User details response not OK');
                throw new Error(`Failed to verify token (${response.status})`);
            }
            
            // Parse the response
            const userData = await response.json();
            console.log('DEBUG: User details retrieved successfully:', userData);
            
            // Store user data in localStorage for future use
            localStorage.setItem(config.storage.userData, JSON.stringify(userData));
            
            // Redirect to main page
            console.log('DEBUG: Token verified, redirecting to main page');
            const targetPage = config.appMode.simplified ? 'simplified-main.html' : 'main.html';
            console.log('DEBUG: Redirecting to:', targetPage);
            window.location.href = targetPage;
        } catch (error) {
            console.error('DEBUG: Token verification failed:', error);
            
            // Clear invalid token
            localStorage.removeItem(config.storage.authToken);
            localStorage.removeItem(config.storage.username);
            localStorage.removeItem(config.storage.userData);
            
            // Hide loading indicator
            const loadingIndicator = document.getElementById('loading-indicator');
            if (loadingIndicator) {
                loadingIndicator.classList.add('hidden');
            }
            
            // Show error message
            showError("Session expired or invalid. Please log in again.");
        }
    }

    // Handle form submission
    document.getElementById('loginForm').addEventListener('submit', function(e) {
        e.preventDefault();
        console.log('Login form submitted');

        // Show loading state
        const loginButton = document.getElementById('login-button');
        const buttonText = document.getElementById('button-text');
        const buttonSpinner = document.getElementById('button-spinner');
        
        loginButton.disabled = true;
        buttonText.textContent = 'Signing in...';
        buttonSpinner.classList.remove('hidden');
        
        // Hide any previous error messages
        const errorDiv = document.getElementById('errorMessage');
        errorDiv.classList.add('hidden');

        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        console.log('Username:', username, 'Password:', '********');

        // Helper function to join URL parts without double slashes
        function joinUrl(base, path) {
            // Remove trailing slash from base if present
            const cleanBase = base.endsWith('/') ? base.slice(0, -1) : base;
            // Remove leading slash from path if present
            const cleanPath = path.startsWith('/') ? path.slice(1) : path;
            return `${cleanBase}/${cleanPath}`;
        }

        // Create request payload
        const requestPayload = { username, password };
        // Always use the proxy endpoint with full URL
        const loginUrl = 'http://localhost:3000/api/auth/login';
        
        console.log('Request payload:', JSON.stringify(requestPayload));
        console.log('Request URL:', loginUrl);
        console.log('Request headers:', { 'Content-Type': 'application/json' });

        fetch(loginUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestPayload)
            // Removed credentials: 'include' to avoid CORS issues
        })
        .then(response => {
            console.log('DEBUG: Received response status:', response.status);
            console.log('DEBUG: Received response headers:', response.headers);
            console.log('DEBUG: Received response:', response);
            
            // Clone the response to log its body content
            const clonedResponse = response.clone();
            clonedResponse.text().then(text => {
                console.log('DEBUG: Response body text:', text);
                try {
                    const jsonData = JSON.parse(text);
                    console.log('DEBUG: Parsed JSON data:', jsonData);
                } catch (e) {
                    console.error('DEBUG: Could not parse response as JSON:', e);
                }
            });
            
            // Check if the response is not successful (e.g., 401 Unauthorized)
            if (!response.ok) {
                console.log('DEBUG: Response not OK, status:', response.status);
                // Reset login button
                resetLoginButton();
                
                // Show error message based on status code
                if (response.status === 401) {
                    console.log('DEBUG: 401 Unauthorized - Invalid credentials');
                    showError("Invalid credentials. Please try again.");
                } else {
                    console.log(`DEBUG: Login failed with status ${response.status}`);
                    showError(`Login failed (${response.status}). Please try again.`);
                }
                
                // Still try to parse the JSON for logging purposes
                return response.json().catch(e => {
                    console.error('DEBUG: Failed to parse error response as JSON:', e);
                    return { error: 'Failed to parse response' };
                });
            }
            
            console.log('DEBUG: Response OK, proceeding to parse JSON');
            return response.json();
        })
        .then(data => {
            console.log('Received data:', data);
            if (data.token) {
                // Store token and username
                localStorage.setItem(config.storage.authToken, data.token);
                localStorage.setItem(config.storage.username, username);
                console.log('Login successful. Verifying token and fetching user details...');
                
                // Show loading indicator
                const loadingIndicator = document.getElementById('loading-indicator');
                if (loadingIndicator) {
                    loadingIndicator.classList.remove('hidden');
                }
                
                // Verify token and fetch user details before redirecting
                verifyTokenAndRedirect(data.token);
            } else {
                // Reset login button
                resetLoginButton();
                // Show error message
                showError("Login failed: " + (data.message || "Invalid credentials"));
            }
        })
        .catch(error => {
            console.error('Error during login:', error);
            // Reset login button
            resetLoginButton();
            showError("Error during login. Please check your credentials and try again.");
        });
        
        /**
         * Reset login button to its original state
         */
        function resetLoginButton() {
            const loginButton = document.getElementById('login-button');
            const buttonText = document.getElementById('button-text');
            const buttonSpinner = document.getElementById('button-spinner');
            
            loginButton.disabled = false;
            buttonText.textContent = 'Sign In';
            buttonSpinner.classList.add('hidden');
        }
    });
});

// Function to display the error message slider
function showError(message) {
    const errorDiv = document.getElementById('errorMessage');
    const errorText = document.getElementById('error-text');
    if (errorText) {
        errorText.textContent = message;
    } else {
        errorDiv.textContent = message;
    }
    errorDiv.classList.remove('hidden');
    
    // Hide the message after 3 seconds (adjust timing as needed)
    setTimeout(() => {
        errorDiv.classList.add('hidden');
    }, 3000);
}

/**
 * Initialize the API endpoint switcher
 * Only shows in development environments
 */
function initApiEndpointSwitcher() {
    const apiEndpointSwitcher = document.getElementById('api-endpoint-switcher');
    const apiEndpointSelect = document.getElementById('api-endpoint-select');
    
    // Only show the switcher in non-production environments
    if (!config.environment.isProduction) {
        console.log('Development environment detected, showing API endpoint switcher');
        apiEndpointSwitcher.classList.remove('hidden');
        
        // Set the initial value based on the current endpoint
        const currentEndpoint = config.api.baseUrl;
        if (currentEndpoint === config.api.endpointOptions.local) {
            apiEndpointSelect.value = 'local';
        } else if (currentEndpoint === config.api.endpointOptions.production) {
            apiEndpointSelect.value = 'production';
        }
        
        // Add event listener for changes
        apiEndpointSelect.addEventListener('change', function() {
            const selectedEndpoint = this.value;
            console.log(`Switching API endpoint to: ${selectedEndpoint}`);
            
            // Use the config function to switch endpoints
            const success = config.switchApiEndpoint(selectedEndpoint);
            
            if (success) {
                console.log(`API endpoint switched to: ${config.api.baseUrl}`);
                // Show a success message
                showEndpointChangeMessage(selectedEndpoint);
            } else {
                console.error('Failed to switch API endpoint');
            }
        });
    } else {
        console.log('Production environment detected, API endpoint switcher disabled');
    }
}

/**
 * Show a message when the API endpoint is changed
 */
function showEndpointChangeMessage(endpointType) {
    // Create a temporary message element
    const messageDiv = document.createElement('div');
    messageDiv.className = 'fixed bottom-4 right-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded';
    messageDiv.style.zIndex = '9999';
    
    const endpointName = endpointType === 'local' ? 'Local Server' : 'Production API';
    messageDiv.textContent = `API Endpoint switched to: ${endpointName}`;
    
    // Add to the document
    document.body.appendChild(messageDiv);
    
    // Remove after 3 seconds
    setTimeout(() => {
        messageDiv.remove();
    }, 3000);
}
