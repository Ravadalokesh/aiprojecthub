@echo off
REM ProjectHub - Setup and Run Script for Windows

echo.
echo ============================================
echo   ProjectHub Setup ^& Execution
echo ============================================
echo.

REM Check if backend\.env exists
if not exist "backend\.env" (
    echo [*] Creating backend\.env...
    copy backend\.env.example backend\.env
    echo [!] Please update backend\.env with your values:
    echo     - OPENROUTER_API_KEY (from https://openrouter.ai/keys)
    echo     - JWT_SECRET
    echo.
)

REM Check if frontend\.env exists
if not exist "frontend\.env" (
    echo [*] Creating frontend\.env...
    copy frontend\.env.example frontend\.env
)

echo.
echo ============================================
echo   Setup Complete!
echo ============================================
echo.
echo Option 1: Using Docker (Recommended for Windows)
echo   docker-compose up -d
echo.
echo Option 2: Local Development
echo   Terminal 1: cd backend ^&^& npm run dev
echo   Terminal 2: cd frontend ^&^& npm run dev
echo.
echo Then open: http://localhost:5173
echo.
pause
