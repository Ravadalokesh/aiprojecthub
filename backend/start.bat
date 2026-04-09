@echo off
REM ProjectHub - Start Backend Server (Windows)

echo.
echo ================================================
echo    ProjectHub - Backend Server Starting
echo ================================================
echo.

REM Check if .env exists
if not exist ".env" (
    echo [X] Error: backend\.env not found!
    echo [*] Creating from .env.example...
    copy .env.example .env
    echo.
    echo [!] IMPORTANT: Update .env with your values:
    echo     - OPENROUTER_API_KEY (from https://openrouter.ai/keys)
    echo     - JWT_SECRET
    echo.
    pause
    exit /b 1
)

REM Check Node.js
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [X] Error: Node.js not installed!
    echo     Download from: https://nodejs.org/
    pause
    exit /b 1
)

REM Check npm packages
if not exist "node_modules" (
    echo [*] Installing dependencies...
    call npm install
)

echo.
echo [*] Starting backend server on port 5000...
echo [*] Socket.io ready for real-time updates
echo [*] Backend running at: http://localhost:5000
echo [*] Health check: http://localhost:5000/health
echo.
echo [*] Press Ctrl+C to stop
echo.

REM Start server
call npm run dev

pause
