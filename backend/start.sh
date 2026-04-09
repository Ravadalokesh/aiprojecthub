#!/bin/bash

# ProjectHub - Start Server (Linux/macOS)

echo ""
echo "================================================"
echo "   ProjectHub - Backend Server Starting"
echo "================================================"
echo ""

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "âŒ Error: backend/.env not found!"
    echo "ðŸ“ Creating from .env.example..."
    cp .env.example .env
    echo ""
    echo "âš ï¸  IMPORTANT: Update .env with your values:"
    echo "   - OPENROUTER_API_KEY (from https://openrouter.ai/keys)"
    echo "   - JWT_SECRET"
    echo ""
    exit 1
fi

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "âŒ Error: Node.js not installed!"
    echo "   Download from: https://nodejs.org/"
    exit 1
fi

# Check npm packages
if [ ! -d "node_modules" ]; then
    echo "ðŸ“¦ Installing dependencies..."
    npm install
fi

echo "ðŸš€ Starting backend server on port 5000..."
echo "ðŸ“¡ Socket.io ready for real-time updates"
echo "ðŸ’¾ MongoDB connection: $MONGODB_URI"
echo ""
echo "ðŸ”— Backend running at: http://localhost:5000"
echo "ðŸ“Š Health check: http://localhost:5000/health"
echo ""
echo "Press Ctrl+C to stop"
echo ""

# Start server
npm run dev
