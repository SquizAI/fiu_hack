#!/bin/bash

echo "🚀 Starting LocalPulse Dashboard..."
echo "📍 Port: 8080"
echo "🌐 URL: http://localhost:8080"
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Start the server
echo "🔄 Starting server..."
node server.js 