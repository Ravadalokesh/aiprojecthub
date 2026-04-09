@echo off
REM ProjectHub - Start All Services (Windows)

echo.
echo ================================================
echo    ProjectHub - Starting All Services
echo ================================================
echo.

REM Check prerequisites
echo [*] Checking prerequisites...

REM Check Node.js
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [X] Error: Node.js not installed!
    echo     Download from: https://nodejs.org/
    pause
    exit /b 1
)
echo [v] Node.js found

REM Check Docker
where docker >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo [v] Docker found
    set DOCKER_AVAILABLE=1
) else (
    echo [!] Docker not found (optional)
    set DOCKER_AVAILABLE=0
)

echo.
echo Select startup option:
echo 1) Docker (Recommended - all services)
echo 2) Local Development (Backend + Frontend)
echo 3) Backend only
echo 4) Frontend only
echo.

set /p choice="Enter choice (1-4): "

if "%choice%"=="1" (
    if %DOCKER_AVAILABLE% EQU 1 (
        echo.
        echo [*] Starting with Docker...
        echo.
        docker-compose up -d
        echo.
        echo [v] Services started!
        echo.
        echo Frontend: http://localhost:5173
        echo Backend: http://localhost:5000/api
        echo MongoDB: localhost:27017
        echo Redis: localhost:6379
        echo.
        echo View logs: docker-compose logs -f
        echo Stop services: docker-compose down
    ) else (
        echo [X] Docker not found. Please install from: https://docker.com
        pause
        exit /b 1
    )
) else if "%choice%"=="2" (
    echo.
    echo [*] Starting Local Development...
    echo.
    echo [!] Make sure MongoDB and Redis are running:
    echo     - MongoDB: mongod
    echo     - Redis: redis-server
    echo.

    echo [*] Starting backend...
    cd backend
    if not exist "node_modules" (
        echo [*] Installing backend dependencies...
        call npm install
    )
    start "ProjectHub Backend" cmd /k "npm run dev"

    cd ..
    timeout /t 2

    echo [*] Starting frontend...
    cd frontend
    if not exist "node_modules" (
        echo [*] Installing frontend dependencies...
        call npm install
    )
    start "ProjectHub Frontend" cmd /k "npm run dev"

    cd ..
    echo.
    echo [v] Services started in new windows!
    echo.
    echo Frontend: http://localhost:5173
    echo Backend: http://localhost:5000/api
    echo.

) else if "%choice%"=="3" (
    echo.
    echo [*] Starting Backend...
    echo.
    cd backend
    if not exist "node_modules" (
        echo [*] Installing dependencies...
        call npm install
    )
    call npm run dev
) else if "%choice%"=="4" (
    echo.
    echo [*] Starting Frontend...
    echo.
    cd frontend
    if not exist "node_modules" (
        echo [*] Installing dependencies...
        call npm install
    )
    call npm run dev
) else (
    echo [X] Invalid choice
    pause
    exit /b 1
)

pause
