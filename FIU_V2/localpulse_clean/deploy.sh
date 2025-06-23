#!/bin/bash

echo "🚀 LocalPulse Dashboard Deployment Helper"
echo "========================================="

# Check if we're in the right directory
if [ ! -f "server.js" ]; then
    echo "❌ Error: Please run this script from the localpulse_clean directory"
    exit 1
fi

echo "📋 Pre-deployment checklist:"
echo "1. ✅ Node.js server ready"
echo "2. ✅ Package.json configured"
echo "3. ✅ Netlify.toml ready"
echo "4. ✅ Railway.toml ready"

echo ""
echo "🔧 Next steps for deployment:"
echo ""
echo "BACKEND (Railway):"
echo "1. Go to https://railway.app"
echo "2. Sign up with GitHub"
echo "3. Deploy from GitHub repo"
echo "4. Set environment variables:"
echo "   - NODE_ENV=production"
echo "   - PORT=8080"
echo "   - OPENWEATHER_API_KEY=your_key"
echo "   - CORS_ORIGIN=https://your-netlify-site.netlify.app"
echo ""
echo "FRONTEND (Netlify):"
echo "1. Go to https://netlify.com"
echo "2. Deploy from GitHub repo"
echo "3. Set build directory: FIU_V2/localpulse_clean"
echo "4. Update netlify.toml with your Railway URL"
echo ""
echo "📖 Full guide: see DEPLOYMENT_GUIDE.md"
echo ""
echo "🎯 Ready for hackathon demo! Good luck! 🚀" 