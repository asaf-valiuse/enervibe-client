const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const API_BASE_URL = 'https://ev-api.valiuse.com';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Proxy endpoint for login
app.post('/api/auth/login', async (req, res) => {
  try {
    console.log('Proxying login request to:', `${API_BASE_URL}/auth/login`);
    console.log('Request body:', JSON.stringify(req.body));
    
    const response = await axios.post(`${API_BASE_URL}/auth/login`, req.body);
    
    console.log('Login response status:', response.status);
    console.log('Login response headers:', JSON.stringify(response.headers));
    
    // Check if response has data
    if (response.data) {
      console.log('Login successful, returning data');
      return res.json(response.data);
    } else {
      console.log('Login response has no data');
      return res.status(200).json({ message: 'Login successful but no data returned' });
    }
  } catch (error) {
    console.error('Login proxy error:', error.message);
    
    // Log detailed error information
    if (error.response) {
      console.error('Error response status:', error.response.status);
      console.error('Error response data:', JSON.stringify(error.response.data));
      return res.status(error.response.status).json(error.response.data);
    } else if (error.request) {
      console.error('No response received from API');
      return res.status(503).json({ message: 'No response from authentication service' });
    }
    
    res.status(500).json({ message: 'Error connecting to authentication service' });
  }
});

// Proxy endpoint for user data
app.get('/api/me', async (req, res) => {
  try {
    const token = req.headers.authorization;
    if (!token) {
      return res.status(401).json({ message: 'No authorization token provided' });
    }
    
    console.log('Proxying user data request to:', `${API_BASE_URL}/me`);
    console.log('Using authorization token:', token.substring(0, 15) + '...');
    
    const response = await axios.get(`${API_BASE_URL}/me`, {
      headers: {
        Authorization: token
      }
    });
    
    console.log('User data response status:', response.status);
    
    // Check if response has data
    if (response.data) {
      console.log('User data retrieved successfully');
      return res.json(response.data);
    } else {
      console.log('User data response has no data');
      return res.status(200).json({ message: 'User authenticated but no data returned' });
    }
  } catch (error) {
    console.error('User data proxy error:', error.message);
    
    // Log detailed error information
    if (error.response) {
      console.error('Error response status:', error.response.status);
      console.error('Error response data:', JSON.stringify(error.response.data));
      return res.status(error.response.status).json(error.response.data);
    } else if (error.request) {
      console.error('No response received from API');
      return res.status(503).json({ message: 'No response from user data service' });
    }
    
    res.status(500).json({ message: 'Error fetching user data' });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'Proxy server is running',
    timestamp: new Date().toISOString(),
    api_target: API_BASE_URL
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Proxy server running at http://localhost:${PORT}`);
  console.log(`API requests will be proxied to ${API_BASE_URL}`);
  console.log(`Health check available at http://localhost:${PORT}/api/health`);
  console.log('Press Ctrl+C to stop the server');
});
