@echo off
setlocal

REM Default API URL
set API_BASE_URL=https://ev-api.valiuse.com

REM Check for command line arguments
if "%1"=="local" (
    set API_BASE_URL=http://localhost:3000
    echo Using local API endpoint
) else if "%1"=="production" (
    set API_BASE_URL=https://ev-api.valiuse.com
    echo Using production API endpoint
) else (
    echo No API endpoint specified, using default (production)
)

echo Starting Client Portal Application...
echo.
echo This will start both the proxy server and the static file server.
echo.
echo Proxy server: http://localhost:3000
echo Static file server: http://localhost:8080
echo API endpoint: %API_BASE_URL%
echo.
echo Press Ctrl+C twice to stop the servers.
echo.

REM Export the environment variable for the Node.js process
set NODE_ENV=development
npm run dev
