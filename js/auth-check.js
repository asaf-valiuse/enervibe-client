/**
 * Authentication Pre-Check Script
 * 
 * This script runs before the page content loads to check if the user is authenticated.
 * If not authenticated, it immediately redirects to the login page without loading the page content.
 */

(function() {
    // Import configuration is not available in plain script, so we need to hardcode the storage key
    const AUTH_TOKEN_KEY = 'authToken';
    
    // Check if we're on a protected page (not index.html or other public pages)
    const currentPage = window.location.pathname.split('/').pop();
    const publicPages = ['index.html', 'login.html', ''];
    
    // Only perform the check on protected pages
    if (!publicPages.includes(currentPage)) {
        // Check for authentication token
        const token = localStorage.getItem(AUTH_TOKEN_KEY);
        
        // If no token is found, redirect to login page immediately
        if (!token) {
            console.log('No authentication token found. Redirecting to login page...');
            window.location.href = 'index.html';
        }
    }
})();
