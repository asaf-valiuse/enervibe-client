/**
 * Simplified Application Module
 * Handles token verification, user data loading, and PowerBI report display
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
    const profileButton = document.getElementById('profile-button');
    const profileDropdown = document.getElementById('profile-dropdown');
    const logoutButton = document.getElementById('logout-button');
    const mobileLogoutButton = document.getElementById('mobile-logout-button');
    const mobileMenuButton = document.getElementById('mobile-menu-button');
    const mobileMenu = document.getElementById('mobile-menu');
    const powerbiContainer = document.getElementById('powerbi-container');

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
            
            // Load PowerBI report
            loadPowerBIReport();
            
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
     * Load PowerBI report
     * Dynamically creates and inserts the PowerBI iframe to hide it from page source
     */
    function loadPowerBIReport() {
        if (powerbiContainer) {
            // PowerBI report URL
            const powerbiReportUrl = "https://app.powerbi.com/view?r=eyJrIjoiYWI4MDZhYTUtNDM3YS00MzA0LTljM2QtMzU3MTYyNjc4ZWVkIiwidCI6IjU0N2Y2MWNiLTQ1NjQtNDFmOS1hNjA3LTI0OWU1N2NiNDkxNSIsImMiOjl9&pageName=36c4e50ad83ba20b65e0";
            
            // Create iframe element dynamically
            const iframe = document.createElement('iframe');
            iframe.id = 'powerbi-iframe';
            iframe.title = 'enervibe-atal';
            iframe.width = '100%';
            iframe.height = '804';
            iframe.frameBorder = '0';
            iframe.allowFullscreen = true;
            iframe.className = 'max-w-full iframe-lazy-load';
            
            // Add event listener for iframe load
            iframe.addEventListener('load', function() {
                iframe.classList.add('loaded');
                console.log('PowerBI iframe loaded successfully');
            });
            
            // Set the source URL last to prevent multiple reloads
            iframe.src = powerbiReportUrl;
            console.log('Loading PowerBI iframe from:', powerbiReportUrl);
            
            // Append iframe to container
            powerbiContainer.appendChild(iframe);
        } else {
            console.error('PowerBI container not found');
        }
    }

    /**
     * Fetch user data from API
     * @returns {Promise<Object>} User data object
     */
    async function fetchUserData() {
        try {
            const userDetailsUrl = `${config.api.baseUrl}${config.api.endpoints.userDetails}`;
            console.log('Fetching user details from:', userDetailsUrl);
            
            const response = await fetch(userDetailsUrl, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            // Handle unauthorized response (invalid token)
            if (response.status === 401) {
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
                throw new Error('Failed to load user data. Please try again.');
            }

            // Parse response with error handling
            let data;
            try {
                const text = await response.text();
                console.log('User details response:', text);
                data = text ? JSON.parse(text) : {};
            } catch (parseError) {
                console.error('JSON parse error:', parseError);
                throw new Error('Invalid response from server. Please try again.');
            }
            return data;
        } catch (error) {
            console.error('Error fetching user data:', error);
            
            // For development/debugging: use placeholder data if API call fails
            console.log('Using placeholder data instead');
            const username = localStorage.getItem(config.storage.username) || 'User';
            return {
                user_name: username,
                email: `${username.toLowerCase()}@example.com`,
                role: 'user',
                // Add any other placeholder data needed
            };
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

        // Update user name and email in header
        userName.textContent = userData.user_name || 'User';
        userEmail.textContent = userData.email || '';
        
        if (mobileUserName && mobileUserEmail) {
            mobileUserName.textContent = userData.user_name || 'User';
            mobileUserEmail.textContent = userData.email || '';
        }

        // Store user data in localStorage for future use
        localStorage.setItem(config.storage.userData, JSON.stringify(userData));
    }

    /**
     * Initialize UI event listeners
     */
    function initializeEventListeners() {
        // Toggle profile dropdown
        if (profileButton && profileDropdown) {
            profileButton.addEventListener('click', () => {
                profileDropdown.classList.toggle('hidden');
            });

            // Close dropdown when clicking outside
            document.addEventListener('click', (event) => {
                if (!profileButton.contains(event.target) && !profileDropdown.contains(event.target)) {
                    profileDropdown.classList.add('hidden');
                }
            });
        }

        // Toggle mobile menu
        if (mobileMenuButton && mobileMenu) {
            mobileMenuButton.addEventListener('click', () => {
                mobileMenu.classList.toggle('hidden');
            });
        }

        // Handle logout
        if (logoutButton) {
            logoutButton.addEventListener('click', handleLogout);
        }
        
        if (mobileLogoutButton) {
            mobileLogoutButton.addEventListener('click', handleLogout);
        }
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
