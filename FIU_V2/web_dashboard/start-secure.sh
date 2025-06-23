#!/bin/bash

# LocalPulse Dashboard - Secure Startup Script
echo "🔐 LocalPulse Dashboard - Secure Configuration"
echo "=============================================="

# Check if we're in the right directory
if [ ! -f "index.html" ]; then
    echo "❌ Error: Please run this script from the web_dashboard directory"
    exit 1
fi

# Function to check if backend is running
check_backend() {
    if curl -s http://localhost:3001/api/health > /dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

# Check if backend directory exists
if [ ! -d "backend" ]; then
    echo "❌ Backend directory not found. Please ensure the secure backend is set up."
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js to run the backend server."
    echo "   Visit: https://nodejs.org/"
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm to manage backend dependencies."
    exit 1
fi

# Install backend dependencies if needed
echo "📦 Checking backend dependencies..."
cd backend

if [ ! -d "node_modules" ]; then
    echo "📦 Installing backend dependencies..."
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ Failed to install backend dependencies"
        exit 1
    fi
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "⚠️  No .env file found. Creating from template..."
    if [ -f "env.example" ]; then
        cp env.example .env
        echo "✅ Created .env file from template"
        echo "📝 Please edit backend/.env with your API keys before continuing"
        echo ""
        echo "Required API keys:"
        echo "  - MAPBOX_PUBLIC_TOKEN (get from https://account.mapbox.com/access-tokens/)"
        echo "  - GEMINI_API_KEY (optional, get from https://aistudio.google.com/app/apikey)"
        echo "  - OPENAI_API_KEY (optional, get from https://platform.openai.com/api-keys)"
        echo ""
        read -p "Press Enter after configuring your .env file..."
    else
        echo "❌ env.example file not found"
        exit 1
    fi
fi

# Check if backend is already running
if check_backend; then
    echo "✅ Backend server is already running"
else
    echo "🚀 Starting backend server..."
    
    # Start backend in background
    npm start &
    BACKEND_PID=$!
    
    # Wait for backend to start
    echo "⏳ Waiting for backend to start..."
    for i in {1..10}; do
        if check_backend; then
            echo "✅ Backend server started successfully"
            break
        fi
        sleep 1
        if [ $i -eq 10 ]; then
            echo "❌ Backend server failed to start"
            kill $BACKEND_PID 2>/dev/null
            exit 1
        fi
    done
fi

# Go back to web_dashboard directory
cd ..

# Check if Python is available
if command -v python3 &> /dev/null; then
    PYTHON_CMD="python3"
elif command -v python &> /dev/null; then
    PYTHON_CMD="python"
else
    echo "❌ Python is not installed. Please install Python to run the frontend server."
    exit 1
fi

# Start frontend server
echo "🌐 Starting frontend server..."
echo ""
echo "🎉 LocalPulse Dashboard is starting with secure configuration!"
echo ""
echo "📊 Backend API: http://localhost:3001"
echo "🌐 Frontend: http://localhost:8080"
echo "🏥 Health Check: http://localhost:3001/api/health"
echo ""
echo "Press Ctrl+C to stop both servers"
echo ""

# Start frontend server
$PYTHON_CMD -m http.server 8080 