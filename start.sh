#!/bin/bash

# ProjectHub - Start All Services (Linux/macOS)

echo ""
echo "================================================"
echo "   ProjectHub - Starting All Services"
echo "================================================"
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check prerequisites
echo -e "${BLUE}ðŸ“‹ Checking prerequisites...${NC}"

# Check Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}âŒ Node.js not installed!${NC}"
    echo "   Download from: https://nodejs.org/"
    exit 1
fi

# Check Docker
if command -v docker &> /dev/null; then
    echo -e "${GREEN}âœ… Docker found${NC}"
    DOCKER_AVAILABLE=true
else
    echo -e "${YELLOW}âš ï¸  Docker not found (optional)${NC}"
    DOCKER_AVAILABLE=false
fi

echo ""
echo -e "${BLUE}Select startup option:${NC}"
echo "1) Docker (Recommended - all services)"
echo "2) Local Development (Backend + Frontend)"
echo "3) Backend only"
echo "4) Frontend only"
echo ""
read -p "Enter choice (1-4): " choice

case $choice in
    1)
        if [ "$DOCKER_AVAILABLE" = true ]; then
            echo ""
            echo -e "${GREEN}ðŸ³ Starting with Docker...${NC}"
            echo ""
            docker-compose up -d
            echo ""
            echo -e "${GREEN}âœ… Services started!${NC}"
            echo ""
            echo "Frontend: http://localhost:5173"
            echo "Backend: http://localhost:5000/api"
            echo "MongoDB: localhost:27017"
            echo "Redis: localhost:6379"
            echo ""
            echo "View logs: docker-compose logs -f"
            echo "Stop services: docker-compose down"
        else
            echo -e "${RED}Docker not found. Please install from: https://docker.com${NC}"
            exit 1
        fi
        ;;
    2)
        echo ""
        echo -e "${GREEN}ðŸš€ Starting Local Development...${NC}"
        echo ""
        echo -e "${BLUE}ðŸ“ Make sure MongoDB and Redis are running in separate terminals:${NC}"
        echo "   $ mongod"
        echo "   $ redis-server"
        echo ""

        # Start backend
        cd backend
        if [ ! -d "node_modules" ]; then
            echo -e "${YELLOW}ðŸ“¦ Installing backend dependencies...${NC}"
            npm install
        fi
        echo -e "${GREEN}âœ… Starting backend...${NC}"
        npm run dev &
        BACKEND_PID=$!

        # Start frontend
        cd ../frontend
        if [ ! -d "node_modules" ]; then
            echo -e "${YELLOW}ðŸ“¦ Installing frontend dependencies...${NC}"
            npm install
        fi
        echo -e "${GREEN}âœ… Starting frontend...${NC}"
        npm run dev &
        FRONTEND_PID=$!

        echo ""
        echo -e "${GREEN}âœ… Services started!${NC}"
        echo ""
        echo "Backend PID: $BACKEND_PID"
        echo "Frontend PID: $FRONTEND_PID"
        echo ""
        echo "Frontend: http://localhost:5173"
        echo "Backend: http://localhost:5000/api"
        echo ""
        echo "To stop: kill $BACKEND_PID $FRONTEND_PID"

        wait
        ;;
    3)
        echo ""
        echo -e "${GREEN}ðŸš€ Starting Backend...${NC}"
        echo ""
        cd backend
        if [ ! -d "node_modules" ]; then
            echo -e "${YELLOW}ðŸ“¦ Installing dependencies...${NC}"
            npm install
        fi
        npm run dev
        ;;
    4)
        echo ""
        echo -e "${GREEN}ðŸš€ Starting Frontend...${NC}"
        echo ""
        cd frontend
        if [ ! -d "node_modules" ]; then
            echo -e "${YELLOW}ðŸ“¦ Installing dependencies...${NC}"
            npm install
        fi
        npm run dev
        ;;
    *)
        echo -e "${RED}Invalid choice${NC}"
        exit 1
        ;;
esac
