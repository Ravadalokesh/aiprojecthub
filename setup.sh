#!/bin/bash

# ProjectHub - Setup and Run Script

echo "ðŸš€ ProjectHub Setup & Execution\n"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if backend/.env exists
if [ ! -f "backend/.env" ]; then
    echo -e "${YELLOW}ðŸ“ Creating backend/.env${NC}"
    cp backend/.env.example backend/.env
    echo -e "${BLUE}⚠️  Please update backend/.env with your OPENROUTER_API_KEY${NC}"
    echo -e "${BLUE}   Visit: https://openrouter.ai/keys${NC}"
fi

# Check if frontend/.env exists
if [ ! -f "frontend/.env" ]; then
    echo -e "${YELLOW}ðŸ“ Creating frontend/.env${NC}"
    cp frontend/.env.example frontend/.env
fi

echo -e "\n${GREEN}âœ… Setup complete!${NC}\n"
echo -e "${BLUE}To start the application:${NC}\n"
echo "Option 1: Using Docker (Recommended)"
echo "  docker-compose up -d"
echo ""
echo "Option 2: Local Development"
echo "  Terminal 1: cd backend && npm run dev"
echo "  Terminal 2: cd frontend && npm run dev"
echo ""
echo -e "${GREEN}Then open: http://localhost:5173${NC}\n"
