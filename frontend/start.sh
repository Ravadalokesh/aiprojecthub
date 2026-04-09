#!/bin/bash

# ProjectHub - Start Frontend (Linux/macOS)

echo ""
echo "================================================"
echo "   ProjectHub - Frontend Starting"
echo "================================================"
echo ""

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "📝 Creating .env from .env.example..."
    cp .env.example .env
fi

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Error: Node.js not installed!"
    echo "   Download from: https://nodejs.org/"
    exit 1
fi

# Check npm packages
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

echo "🚀 Starting frontend server on port 5173..."
echo ""
echo "🔗 Frontend running at: http://localhost:5173"
echo "📡 Backend API: http://localhost:5000/api"
echo ""
echo "Press Ctrl+C to stop"
echo ""

# Start server
npm run dev
