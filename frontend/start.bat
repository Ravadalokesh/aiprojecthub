@echo off
REM ProjectHub - Start Frontend (Windows)

echo.
echo ================================================
echo    ProjectHub - Frontend Starting
echo ================================================
echo.

REM Check if .env exists
if not exist ".env" (
    echo [*] Creating .env from .env.example...
    copy .env.example .env
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
echo [*] Starting frontend server on port 5173...
echo [*] Frontend running at: http://localhost:5173
echo [*] Backend API: http://localhost:5000/api
echo.
echo [*] Press Ctrl+C to stop
echo.

REM Start server
call npm run dev

pause
