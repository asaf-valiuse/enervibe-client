const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const API_BASE_URL = process.env.API_BASE_URL || 'https://ev-api.valiuse.com/';

// Check if we're in production mode
const isProduction = process.env.NODE_ENV === 'production';

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl requests)
    if (!origin) return callback(null, true);
    
    // Check if the origin is allowed
    if (origin === 'http://localhost:3000' || origin === 'http://127.0.0.1:8080') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

// Apply CORS middleware
app.use(cors(corsOptions));

// Log all requests for debugging
app.use((req, res, next) => {
  console.log(`DEBUG: ${req.method} request to ${req.url} from origin: ${req.headers.origin}`);
  next();
});

// Other middleware
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Helper function to join URL parts without double slashes
function joinUrl(base, path) {
  // Remove trailing slash from base if present
  const cleanBase = base.endsWith('/') ? base.slice(0, -1) : base;
  // Remove leading slash from path if present
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return `${cleanBase}/${cleanPath}`;
}

// Proxy endpoint for login
app.post('/api/auth/login', async (req, res) => {
  try {
    // This is the exact URL that accesses the real API for login
    const apiUrl = joinUrl(API_BASE_URL, 'auth/login');
    console.log('DEBUG: Proxying login request to:', apiUrl);
    console.log('DEBUG: Request body:', JSON.stringify(req.body));
    console.log('DEBUG: Request headers:', JSON.stringify(req.headers));
    
    // If there's an authorization header, extract the token
    let headers = { 'Content-Type': 'application/json' };
    if (req.headers.authorization) {
      const authHeader = req.headers.authorization;
      const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : authHeader;
      headers.Authorization = token;
      console.log('DEBUG: Authorization header found, extracted token:', token.substring(0, 10) + '...');
    } else {
      console.log('DEBUG: No authorization header found');
    }
    
    // This is the actual API call to the real backend
    console.log('DEBUG: Making API call to:', apiUrl);
    console.log('DEBUG: With headers:', JSON.stringify(headers));
    console.log('DEBUG: With body:', JSON.stringify(req.body));
    
    const response = await axios.post(apiUrl, req.body, { headers });
    
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
    console.error('DEBUG: Login proxy error:', error.message);
    
    // Log detailed error information
    if (error.response) {
      console.error('DEBUG: Error response status:', error.response.status);
      console.error('DEBUG: Error response data:', JSON.stringify(error.response.data));
      console.error('DEBUG: Error response headers:', JSON.stringify(error.response.headers));
      
      // Log the complete error for debugging
      console.error('DEBUG: Complete error object:', JSON.stringify(error.toJSON ? error.toJSON() : error));
      
      return res.status(error.response.status).json(error.response.data);
    } else if (error.request) {
      console.error('DEBUG: No response received from API');
      console.error('DEBUG: Request details:', JSON.stringify(error.request._header || error.request));
      return res.status(503).json({ message: 'No response from authentication service' });
    }
    
    console.error('DEBUG: Unexpected error:', error);
    res.status(500).json({ message: 'Error connecting to authentication service' });
  }
});

// Proxy endpoint for user details
app.get('/api/user/details', async (req, res) => {
  try {
    console.log('DEBUG: User details request received');
    console.log('DEBUG: Request headers:', JSON.stringify(req.headers));
    
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      console.log('DEBUG: No authorization header provided');
      return res.status(401).json({ message: 'No authorization token provided' });
    }
    
    // Extract the token from the Authorization header
    // Format is typically "Bearer <token>"
    const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : authHeader;
    
    // This is the exact URL that accesses the real API for user details
    const apiUrl = 'https://ev-api.valiuse.com/user/details/';
    console.log('DEBUG: Proxying user details request to:', apiUrl);
    console.log('DEBUG: Original authorization header:', authHeader.substring(0, 15) + '...');
    console.log('DEBUG: Extracted token:', token.substring(0, 15) + '...');
    
    // Always use Bearer format for the API
    const authHeaderForApi = `Bearer ${token}`;
    console.log('DEBUG: Sending to API with Bearer header:', authHeaderForApi.substring(0, 20) + '...');
    
    try {
      // This is the actual API call to the real backend for user details
      console.log('DEBUG: Making API call to:', apiUrl);
      console.log('DEBUG: With headers:', JSON.stringify({ Authorization: authHeaderForApi.substring(0, 20) + '...' }));
      
      const response = await axios.get(apiUrl, {
        headers: {
          Authorization: authHeaderForApi
        }
      });
      
      console.log('DEBUG: User details response status:', response.status);
      console.log('DEBUG: User details response headers:', JSON.stringify(response.headers));
      console.log('DEBUG: User details response data:', JSON.stringify(response.data));
      
      // Check if response has data
      if (response.data) {
        console.log('User details retrieved successfully');
        return res.json(response.data);
      } else {
        console.log('User details response has no data');
        return res.status(200).json({ message: 'User authenticated but no details returned' });
      }
    } catch (error) {
      console.error('DEBUG: Request with Bearer prefix failed:', error.message);
      
      if (error.response) {
        console.error('DEBUG: Error response status:', error.response.status);
        console.error('DEBUG: Error response data:', JSON.stringify(error.response.data));
      }
      
      // If we get a specific error that suggests the token format is wrong, try without the Bearer prefix
      if (error.response && (error.response.status === 401 || error.response.status === 422)) {
        console.log('DEBUG: Trying API request with token only (no Bearer prefix) as fallback');
        
        try {
          const response = await axios.get(apiUrl, {
            headers: {
              Authorization: token
            }
          });
          
          console.log('Fallback request succeeded with token only');
          console.log('User details response status:', response.status);
          
          // Check if response has data
          if (response.data) {
            console.log('User details retrieved successfully with token only');
            return res.json(response.data);
          } else {
            console.log('User details response has no data');
            return res.status(200).json({ message: 'User authenticated but no details returned' });
          }
        } catch (fallbackError) {
          console.error('Fallback request also failed:', fallbackError.message);
          throw error; // Throw the original error to be handled below
        }
      } else {
        throw error; // Re-throw the error to be handled below
      }
    }
  } catch (error) {
    console.error('User details proxy error:', error.message);
    
    // Log detailed error information
    if (error.response) {
      console.error('Error response status:', error.response.status);
      console.error('Error response data:', JSON.stringify(error.response.data));
      console.error('Error response headers:', JSON.stringify(error.response.headers));
      
      // Log the complete error for debugging
      console.error('Complete error object:', JSON.stringify(error.toJSON ? error.toJSON() : error));
      
      return res.status(error.response.status).json({
        message: 'Error from API server',
        details: error.response.data
      });
    } else if (error.request) {
      console.error('No response received from API');
      console.error('Request details:', JSON.stringify(error.request._header));
      return res.status(503).json({ message: 'No response from user details service' });
    }
    
    console.error('Unexpected error:', error);
    res.status(500).json({ message: 'Error fetching user details' });
  }
});

// Add a route for the endpoint with trailing slash to ensure both formats work
app.get('/api/user/details/', async (req, res) => {
  // This is the same handler as the one without the trailing slash
  try {
    console.log('DEBUG: User details request received (with trailing slash)');
    console.log('DEBUG: Request headers:', JSON.stringify(req.headers));
    
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      console.log('DEBUG: No authorization header provided');
      return res.status(401).json({ message: 'No authorization token provided' });
    }
    
    // Extract the token from the Authorization header
    // Format is typically "Bearer <token>"
    const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : authHeader;
    
    // This is the exact URL that accesses the real API for user details
    const apiUrl = 'https://ev-api.valiuse.com/user/details/';
    console.log('DEBUG: Proxying user details request to:', apiUrl);
    console.log('DEBUG: Original authorization header:', authHeader.substring(0, 15) + '...');
    console.log('DEBUG: Extracted token:', token.substring(0, 15) + '...');
    
    // Always use Bearer format for the API
    const authHeaderForApi = `Bearer ${token}`;
    console.log('DEBUG: Sending to API with Bearer header:', authHeaderForApi.substring(0, 20) + '...');
    
    try {
      // This is the actual API call to the real backend for user details
      console.log('DEBUG: Making API call to:', apiUrl);
      console.log('DEBUG: With headers:', JSON.stringify({ Authorization: authHeaderForApi.substring(0, 20) + '...' }));
      
      const response = await axios.get(apiUrl, {
        headers: {
          Authorization: authHeaderForApi
        }
      });
      
      console.log('DEBUG: User details response status:', response.status);
      console.log('DEBUG: User details response headers:', JSON.stringify(response.headers));
      console.log('DEBUG: User details response data:', JSON.stringify(response.data));
      
      // Check if response has data
      if (response.data) {
        console.log('User details retrieved successfully');
        return res.json(response.data);
      } else {
        console.log('User details response has no data');
        return res.status(200).json({ message: 'User authenticated but no details returned' });
      }
    } catch (error) {
      console.error('DEBUG: Request with Bearer prefix failed:', error.message);
      
      if (error.response) {
        console.error('DEBUG: Error response status:', error.response.status);
        console.error('DEBUG: Error response data:', JSON.stringify(error.response.data));
      }
      
      // If we get a specific error that suggests the token format is wrong, try without the Bearer prefix
      if (error.response && (error.response.status === 401 || error.response.status === 422)) {
        console.log('DEBUG: Trying API request with token only (no Bearer prefix) as fallback');
        
        try {
          const response = await axios.get(apiUrl, {
            headers: {
              Authorization: token
            }
          });
          
          console.log('Fallback request succeeded with token only');
          console.log('User details response status:', response.status);
          
          // Check if response has data
          if (response.data) {
            console.log('User details retrieved successfully with token only');
            return res.json(response.data);
          } else {
            console.log('User details response has no data');
            return res.status(200).json({ message: 'User authenticated but no details returned' });
          }
        } catch (fallbackError) {
          console.error('Fallback request also failed:', fallbackError.message);
          throw error; // Throw the original error to be handled below
        }
      } else {
        throw error; // Re-throw the error to be handled below
      }
    }
  } catch (error) {
    console.error('User details proxy error:', error.message);
    
    // Log detailed error information
    if (error.response) {
      console.error('Error response status:', error.response.status);
      console.error('Error response data:', JSON.stringify(error.response.data));
      console.error('Error response headers:', JSON.stringify(error.response.headers));
      
      // Log the complete error for debugging
      console.error('Complete error object:', JSON.stringify(error.toJSON ? error.toJSON() : error));
      
      return res.status(error.response.status).json({
        message: 'Error from API server',
        details: error.response.data
      });
    } else if (error.request) {
      console.error('No response received from API');
      console.error('Request details:', JSON.stringify(error.request._header));
      return res.status(503).json({ message: 'No response from user details service' });
    }
    
    console.error('Unexpected error:', error);
    res.status(500).json({ message: 'Error fetching user details' });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Proxy server running at http://localhost:${PORT}`);
  console.log(`API requests will be proxied to ${API_BASE_URL}`);
  console.log('Press Ctrl+C to stop the server');
});
