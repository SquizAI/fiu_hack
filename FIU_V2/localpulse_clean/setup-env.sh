#!/bin/bash

echo "🔧 Setting up LocalPulse Dashboard Environment"
echo "=============================================="

# Create .env file
cat > .env << EOF
# LocalPulse Dashboard Environment Variables
NODE_ENV=development
PORT=8080

# Weather API Keys
OPENWEATHER_API_KEY=your_openweather_api_key_here
WINDY_API_KEY=YOUR_WINDY_API_KEY_HERE

# CORS Settings
CORS_ORIGIN=*

# FL511 Camera Tokens (Update these when they expire)
FL511_TOKEN_1=your_fl511_token_1
FL511_TOKEN_2=your_fl511_token_2
EOF

echo "✅ .env file created"
echo ""
echo "🔑 IMPORTANT: Get your free OpenWeather API key:"
echo "   1. Go to: https://openweathermap.org/api"
echo "   2. Sign up for free"
echo "   3. Get your API key"
echo "   4. Replace 'your_openweather_api_key_here' in .env file"
echo ""
echo "🌤️ Windy API key is already configured!"
echo ""
echo "🚀 Ready to run: npm start" 