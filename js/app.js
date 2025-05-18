/**
 * Main Application Module
 * Handles token verification, user data loading, and UI interactions
 */

import config from './config.js';

document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const loadingSpinner = document.getElementById('loading-spinner');
    const dashboardContent = document.getElementById('dashboard-content');
    const errorContainer = document.getElementById('error-container');
    const errorMessage = document.getElementById('error-message');
    const userName = document.getElementById('user-name');
    const userEmail = document.getElementById('user-email');
    const mobileUserName = document.getElementById('mobile-user-name');
    const mobileUserEmail = document.getElementById('mobile-user-email');
    const userFullName = document.getElementById('user-full-name');
    const userEmailDetail = document.getElementById('user-email-detail');
    const profileButton = document.getElementById('profile-button');
    const profileDropdown = document.getElementById('profile-dropdown');
    const logoutButton = document.getElementById('logout-button');
    const mobileLogoutButton = document.getElementById('mobile-logout-button');
    const mobileMenuButton = document.getElementById('mobile-menu-button');
    const mobileMenu = document.getElementById('mobile-menu');

    // Check for access token
    const token = localStorage.getItem(config.storage.authToken);
    if (!token) {
        // Redirect to login page if no token is found
        window.location.href = 'index.html';
        return;
    }

    // Initialize the application
    initApp();

    /**
     * Initialize the application
     */
    async function initApp() {
        try {
            // Fetch user data from API
            const userData = await fetchUserData();
            
            // Update UI with user data
            updateUserInterface(userData);
            
            // Check for fleet alerts
            checkFleetAlerts();
            
            // Show dashboard content
            showDashboard();
            
            // Initialize UI event listeners
            initializeEventListeners();
        } catch (error) {
            console.error('Application initialization error:', error);
            showError(error.message);
        }
    }
    
    /**
     * Check for active fleet alerts
     */
    async function checkFleetAlerts() {
        try {
            // In a real application, this would fetch alert data from an API
            // For demonstration, we'll simulate some alerts
            const alertCount = simulateFleetAlerts();
            
            if (alertCount > 0) {
                showFleetAlerts(alertCount);
            }
        } catch (error) {
            console.error('Error checking fleet alerts:', error);
        }
    }
    
    /**
     * Simulate fleet alerts for demonstration
     * @returns {number} Number of active alerts
     */
    function simulateFleetAlerts() {
        // For demonstration purposes, generate a random number of alerts
        // In a real application, this would come from an API
        const alertProbability = 0.7; // 70% chance of having alerts
        
        if (Math.random() < alertProbability) {
            return Math.floor(Math.random() * 5) + 1; // 1-5 alerts
        }
        
        return 0;
    }
    
    /**
     * Show fleet alerts on the dashboard
     * @param {number} alertCount - Number of active alerts
     */
    function showFleetAlerts(alertCount) {
        const alertContainer = document.getElementById('fleet-alert-container');
        const alertCountElement = document.getElementById('fleet-alert-count');
        
        if (alertContainer && alertCountElement) {
            alertCountElement.textContent = alertCount;
            alertContainer.classList.remove('hidden');
            
            // Add a pulsing effect to draw attention
            alertContainer.classList.add('pulse');
        }
    }

    /**
     * Helper function to join URL parts without double slashes
     * @param {string} base - Base URL
     * @param {string} path - Path to append
     * @returns {string} Properly joined URL
     */
    function joinUrl(base, path) {
        // Remove trailing slash from base if present
        const cleanBase = base.endsWith('/') ? base.slice(0, -1) : base;
        // Remove leading slash from path if present
        const cleanPath = path.startsWith('/') ? path.slice(1) : path;
        return `${cleanBase}/${cleanPath}`;
    }

    /**
     * Fetch user data from API
     * @returns {Promise<Object>} User data object
     */
    async function fetchUserData() {
        try {
            // Always use the proxy endpoint with full URL
            const userDetailsUrl = 'http://localhost:3000/api/user/details/';
            console.log('Fetching user details from:', userDetailsUrl);
            
            // Log the token being used (first few characters for security)
            const tokenPreview = token.substring(0, 10) + '...';
            console.log('Using authorization token:', tokenPreview);
            
            const response = await fetch(userDetailsUrl, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            console.log('User details response status:', response.status);
            console.log('User details response headers:', response.headers);

            // Handle unauthorized response (invalid token)
            if (response.status === 401) {
                console.error('Authentication failed: Unauthorized (401)');
                // Clear invalid token
                localStorage.removeItem(config.storage.authToken);
                localStorage.removeItem(config.storage.username);
                localStorage.removeItem(config.storage.userData);
                
                // Redirect to login page
                window.location.href = 'index.html';
                throw new Error('Session expired. Please log in again.');
            }

            // Handle other error responses
            if (!response.ok) {
                console.error(`API error: ${response.status} ${response.statusText}`);
                throw new Error(`Failed to load user data (${response.status}). Please try again.`);
            }

            // Parse response with error handling
            let data;
            try {
                const text = await response.text();
                console.log('User details response text:', text);
                
                if (!text) {
                    console.warn('Empty response received from user details endpoint');
                    throw new Error('Empty response from server');
                }
                
                data = JSON.parse(text);
                console.log('Parsed user data:', data);
                
                if (!data || (Object.keys(data).length === 0)) {
                    console.warn('Empty data object after parsing');
                    throw new Error('Invalid user data format');
                }
            } catch (parseError) {
                console.error('JSON parse error:', parseError);
                throw new Error('Invalid response from server. Please try again.');
            }
            
            return data;
        } catch (error) {
            console.error('Error fetching user data:', error);
            
            // Try to get stored user data first (for offline scenarios)
            const storedUserData = localStorage.getItem(config.storage.userData);
            if (storedUserData) {
                try {
                    console.log('Using stored user data as fallback');
                    return JSON.parse(storedUserData);
                } catch (parseError) {
                    console.error('Error parsing stored user data:', parseError);
                }
            }
            
            // If we reach here, we have no data - throw error to be handled by caller
            throw new Error('Failed to load user data. Please check your connection and try again.');
        }
    }

    /**
     * Update UI with user data
     * @param {Object} userData - User data from API
     */
    function updateUserInterface(userData) {
        // Check if userData exists
        if (!userData) {
            throw new Error('Invalid user data received.');
        }

        console.log('Updating UI with user data:', userData);

        // Update user name and email in header
        userName.textContent = userData.user_name || 'User';
        userEmail.textContent = userData.email || '';
        mobileUserName.textContent = userData.user_name || 'User';
        mobileUserEmail.textContent = userData.email || '';

        // Update dropdown user info
        const dropdownUserName = document.getElementById('dropdown-user-name');
        const dropdownUserEmail = document.getElementById('dropdown-user-email');
        const dropdownUserPhone = document.getElementById('dropdown-user-phone');
        
        if (dropdownUserName) dropdownUserName.textContent = userData.user_name || 'User';
        if (dropdownUserEmail) dropdownUserEmail.textContent = userData.email || '';
        if (dropdownUserPhone) dropdownUserPhone.textContent = userData.phone_number || '(Not available)';

        // Update user details in profile section
        userFullName.textContent = userData.user_name || 'Not available';
        userEmailDetail.textContent = userData.email || 'Not available';
        
        // Update account type if available
        const userAccountType = document.getElementById('user-account-type');
        if (userAccountType && userData.role) {
            userAccountType.textContent = userData.role.charAt(0).toUpperCase() + userData.role.slice(1);
        }

        // Display the auth token for debugging
        const authToken = localStorage.getItem(config.storage.authToken);
        const authTokenDebug = document.getElementById('auth-token-debug');
        if (authTokenDebug) {
            authTokenDebug.textContent = authToken || 'No token found';
        }

        // Store user data in localStorage for future use
        localStorage.setItem(config.storage.userData, JSON.stringify(userData));
    }

    /**
     * Initialize UI event listeners
     */
    function initializeEventListeners() {
        // Toggle profile dropdown
        profileButton.addEventListener('click', () => {
            profileDropdown.classList.toggle('hidden');
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', (event) => {
            if (!profileButton.contains(event.target) && !profileDropdown.contains(event.target)) {
                profileDropdown.classList.add('hidden');
            }
        });

        // Toggle mobile menu
        mobileMenuButton.addEventListener('click', () => {
            mobileMenu.classList.toggle('hidden');
        });

        // Handle logout
        logoutButton.addEventListener('click', handleLogout);
        mobileLogoutButton.addEventListener('click', handleLogout);
    }

    /**
     * Handle user logout
     * @param {Event} e - Click event
     */
    function handleLogout(e) {
        e.preventDefault();
        
        // Clear localStorage
        localStorage.removeItem(config.storage.authToken);
        localStorage.removeItem(config.storage.username);
        localStorage.removeItem(config.storage.userData);
        
        // Redirect to login page
        window.location.href = 'index.html';
    }

    /**
     * Show dashboard content and hide loading spinner
     */
    function showDashboard() {
        loadingSpinner.classList.add('hidden');
        dashboardContent.classList.remove('hidden');
    }

    /**
     * Show error message
     * @param {string} message - Error message to display
     */
    function showError(message) {
        loadingSpinner.classList.add('hidden');
        errorMessage.textContent = message;
        errorContainer.classList.remove('hidden');
    }
});
