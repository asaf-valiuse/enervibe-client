/**
 * Authentication Module
 * Handles user login and token storage
 */

import config from './config.js';

console.log('Auth.js loaded - Version 3.0');

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM Content Loaded - Initializing auth module');
    
    // Check if user is already logged in
    const token = localStorage.getItem(config.storage.authToken);
    if (token) {
        // Redirect to main page if token exists
        console.log('Token found, redirecting to main page');
        // Use simplified or full version based on config
        const targetPage = config.appMode.simplified ? 'simplified-main.html' : 'main.html';
        window.location.href = targetPage;
    }

    // Handle form submission
    document.getElementById('loginForm').addEventListener('submit', function(e) {
        e.preventDefault();
        console.log('Login form submitted');

        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        console.log('Username:', username, 'Password:', '********');

        // Create request payload
        const requestPayload = { username, password };
        const loginUrl = `${config.api.baseUrl}${config.api.endpoints.login}`;
        
        console.log('Request payload:', JSON.stringify(requestPayload));
        console.log('Request URL:', loginUrl);
        console.log('Request headers:', { 'Content-Type': 'application/json' });

        fetch(loginUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestPayload)
        })
        .then(response => {
            console.log('Received response status:', response.status);
            console.log('Received response headers:', response.headers);
            console.log('Received response:', response);
            
            // Clone the response to log its body content
            const clonedResponse = response.clone();
            clonedResponse.text().then(text => {
                console.log('Response body text:', text);
            });
            
            return response.json();
        })
        .then(data => {
            console.log('Received data:', data);
            if (data.token) {
                // Store token and username
                localStorage.setItem(config.storage.authToken, data.token);
                localStorage.setItem(config.storage.username, username);
                console.log('Login successful. Redirecting to main page...');
                // Use simplified or full version based on config
                const targetPage = config.appMode.simplified ? 'simplified-main.html' : 'main.html';
                window.location.href = targetPage;
            } else {
                // Show error message
                showError("Login failed: " + (data.message || "Invalid credentials"));
            }
        })
        .catch(error => {
            console.error('Error during login:', error);
            showError("Error during login. Check console for details.");
        });
    });
});

// Function to display the error message slider
function showError(message) {
    const errorDiv = document.getElementById('errorMessage');
    errorDiv.textContent = message;
    errorDiv.classList.remove('hidden');
    
    // Hide the message after 3 seconds (adjust timing as needed)
    setTimeout(() => {
        errorDiv.classList.add('hidden');
    }, 3000);
}
