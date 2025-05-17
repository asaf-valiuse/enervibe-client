# Client Portal Application

A simple web application with a login page and a protected main page. The app communicates with an external API for authentication and user data.

## Features

- Login page with email and password authentication
- Protected dashboard page that requires authentication
- User profile and account information display
- Responsive design using TailwindCSS

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)

### Installation

1. Clone the repository or download the files
2. Navigate to the project directory
3. Install dependencies:

```bash
npm install
```

### Running the Application

There are several ways to run the application:

#### 1. Standard Mode (Static Files Only)

To start the local development server with automatic browser opening:

```bash
npm start
```

This will start the application on http://localhost:8080 and open the server test page in your default browser.

Alternatively, you can start the server without opening the browser:

```bash
npm run dev
```

#### 2. With Proxy Server (Recommended)

To run both the static file server and the proxy server for handling API requests:

##### Using Start Scripts (Easiest)

Windows:
```
start.bat
```

macOS/Linux:
```bash
chmod +x start.sh  # Make the script executable (first time only)
./start.sh
```

##### Using npm:
```bash
npm run full
```

This will:
- Start the proxy server on http://localhost:3000
- Start the static file server on http://localhost:8081
- Allow the frontend to communicate with the external API without CORS issues

#### 3. Proxy Server Only

If you want to run just the proxy server:

```bash
npm run proxy
```

This is useful if you're using a different static file server or running the frontend from another source.

## Usage

1. When you run `npm start`, the server test page will open automatically
2. Click on "Go to Client Portal" or navigate to http://localhost:8080/index.html
3. Log in with your credentials
4. View your dashboard and user information

## API Integration

The application integrates with the following API endpoints:

- Authentication: `https://ev-api.valiuse.com/auth/login`
- User data: `https://ev-api.valiuse.com/me`

### CORS Handling

Since the application runs locally but communicates with an external API, it may encounter CORS (Cross-Origin Resource Sharing) restrictions. To solve this issue, a proxy server is included that forwards requests to the API and handles the CORS headers.

The proxy server provides the following endpoints:

- `/api/auth/login` - Forwards authentication requests to the external API
- `/api/me` - Forwards user data requests to the external API
- `/api/health` - Health check endpoint to verify the proxy server is running

To use the proxy server, make sure to:

1. Run the proxy server using `npm run proxy`
2. Use the proxy endpoints in your frontend code (already configured)

## Project Structure

```
ClientPortal/
├── index.html         # Login page
├── main.html          # Protected page
├── server-test.html   # Server test page
├── server.js          # Proxy server for API requests
├── start.bat          # Windows start script
├── start.sh           # macOS/Linux start script
├── js/
│   ├── auth.js        # Login logic
│   └── app.js         # Main page logic
├── css/
│   └── style.css      # Additional styles
├── package.json       # Project configuration and dependencies
├── .gitignore         # Git ignore file
└── README.md          # Project documentation
```

## License

ISC
