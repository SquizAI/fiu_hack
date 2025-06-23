# LocalPulse HTML Dashboard - Complete Setup Guide

## 🚀 Quick Start

This enhanced HTML dashboard features **AI-powered analysis** using both **Gemini and OpenAI APIs** with **structured outputs**, plus comprehensive **Mapbox data integration** for advanced geospatial features.

### Features Added
- ✅ **Gemini 2.5 Flash** with structured JSON outputs
- ✅ **OpenAI GPT-4o** with structured outputs (fallback)
- ✅ **Enhanced Mapbox integration** (Geocoding, Isochrones, Directions, Matrix API)
- ✅ **AI Crime Pattern Analysis** with risk assessment and hotspot detection
- ✅ **AI Traffic Analysis** with congestion prediction and route optimization
- ✅ **AI Social Sentiment Analysis** with community insights
- ✅ **Interactive maps** with AI analysis buttons
- ✅ **Professional modal displays** for analysis results
- ✅ **Configuration management** system
- ✅ **Error handling** and fallback systems

## 📋 Prerequisites

1. **Web Browser** with modern JavaScript support
2. **Text Editor** (VS Code recommended)
3. **API Keys** (see configuration section)

## 🔧 Installation

### Step 1: Copy Configuration File
```bash
cp config.example.js config.js
```

### Step 2: Configure API Keys

Edit `config.js` and add your API keys:

#### Required APIs:
- **Mapbox**: Already configured with working token
- **Gemini API**: Get from [Google AI Studio](https://ai.google.dev/gemini-api/docs)
- **OpenAI API**: Get from [OpenAI Platform](https://platform.openai.com/api-keys)

#### Optional APIs:
- **OpenWeather**: For enhanced weather data
- **Reddit**: For social media monitoring
- **SendGrid**: For email notifications

### Step 3: Security Setup

Add `config.js` to your `.gitignore`:
```gitignore
# API Configuration (contains sensitive keys)
config.js
```

## 🔑 API Configuration Guide

### 1. Google Gemini API Setup

1. Visit [Google AI Studio](https://ai.google.dev/gemini-api/docs)
2. Click "Get API Key"
3. Create a new project or select existing
4. Generate API key
5. Add to `config.js`:
```javascript
ai: {
    gemini: {
        apiKey: 'your_actual_gemini_api_key_here'
    }
}
```

### 2. OpenAI API Setup (Fallback)

1. Visit [OpenAI Platform](https://platform.openai.com/api-keys)
2. Create account and add billing method
3. Generate API key
4. Add to `config.js`:
```javascript
ai: {
    openai: {
        apiKey: 'your_actual_openai_api_key_here'
    }
}
```

### 3. Enhanced Mapbox Features

The dashboard uses multiple Mapbox APIs:
- **Geocoding API**: Location search and address lookup
- **Isochrone API**: Travel time analysis
- **Directions API**: Route optimization
- **Matrix API**: Multi-point routing
- **Tile Query API**: Point of interest discovery

Current token works for basic features. For production, get your own:
1. Visit [Mapbox Account](https://account.mapbox.com/access-tokens/)
2. Create new token with all URL restrictions removed
3. Add required scopes: `styles:read`, `fonts:read`, `datasets:read`, `vision:read`

## 🌐 Deployment Options

### Option 1: Netlify (Recommended)

1. **Drag & Drop Deployment**:
   - Zip the `web_dashboard` folder
   - Go to [Netlify](https://netlify.com)
   - Drag zip file to deploy area
   - Site will be live instantly

2. **Git Integration**:
   ```bash
   # In your repository
   git add .
   git commit -m "Deploy LocalPulse dashboard"
   git push origin main
   ```
   - Connect repository to Netlify
   - Set publish directory to `FIU_V2/web_dashboard`
   - Deploy automatically on commits

3. **Custom Domain** (Optional):
   - Add custom domain in Netlify settings
   - Configure DNS records
   - SSL certificate auto-generated

### Option 2: Local Development

```bash
# Simple HTTP server
python -m http.server 8080
# OR
npx http-server

# Open browser
open http://localhost:8080
```

### Option 3: GitHub Pages

1. Push to GitHub repository
2. Go to repository Settings > Pages
3. Select source branch (main)
4. Set folder to `/FIU_V2/web_dashboard`
5. Access at `https://username.github.io/repository-name`

## 🧠 AI Analysis Features

### Crime Pattern Analysis
- **Trend Detection**: Identifies increasing/decreasing crime patterns
- **Risk Assessment**: Categorizes areas by risk level (low/medium/high)
- **Hotspot Mapping**: Pinpoints crime concentration areas
- **Recommendations**: AI-generated safety suggestions

### Traffic Analysis
- **Congestion Prediction**: Real-time traffic flow analysis
- **Route Optimization**: Best path recommendations
- **Incident Detection**: Automatic traffic incident identification
- **Delay Estimation**: Accurate travel time predictions

### Social Sentiment Analysis
- **Community Mood**: Overall sentiment scoring (-1 to +1)
- **Theme Extraction**: Key topics and concerns
- **Concern Identification**: Community issues detection
- **Positive Highlights**: Community achievements and praise

## 🗺️ Enhanced Mapbox Features

### Interactive Maps
- **Click Analysis**: Click any map element for AI insights
- **Layer Controls**: Toggle between different data visualizations
- **Real-time Updates**: Live data integration
- **Export Capabilities**: Save analysis reports

### Geospatial Analysis
- **Isochrone Zones**: Travel time accessibility mapping
- **Point of Interest**: Nearby amenities and services
- **Route Matrix**: Multi-destination optimization
- **Geocoding**: Address and coordinate conversion

## 🔍 Usage Instructions

### 1. Main Dashboard
- View real-time metrics and alerts
- Access quick navigation to all sections
- Monitor system status and API health

### 2. Crime Analysis
- Click **"🧠 Analyze Crime Patterns"** button
- View AI-generated insights in modal
- Export reports for further analysis
- Interactive map with crime hotspots

### 3. Traffic Monitoring
- Click **"🧠 Analyze Traffic Patterns"** button
- Real-time congestion analysis
- Route optimization recommendations
- Incident tracking and alerts

### 4. Social Media Monitoring
- Click **"🧠 Analyze Community Sentiment"** button
- Community mood analysis
- Key themes and concerns
- Positive community highlights

### 5. Vehicle Detection
- Live camera feed simulation
- Real-time counting and alerts
- Historical data tracking
- Location-based monitoring

## 🛠️ Troubleshooting

### Common Issues

1. **API Key Errors**:
   ```
   Error: API key not configured
   ```
   - Check `config.js` file exists
   - Verify API keys are correctly set
   - Ensure no placeholder text remains

2. **CORS Errors**:
   ```
   Access-Control-Allow-Origin error
   ```
   - Deploy to proper hosting (not file://)
   - Use local HTTP server for development
   - Check Mapbox token restrictions

3. **Map Not Loading**:
   - Verify Mapbox token is valid
   - Check browser console for errors
   - Ensure internet connectivity

4. **AI Analysis Fails**:
   - Verify Gemini/OpenAI API keys
   - Check API quotas and billing
   - Monitor browser console for errors

### Debug Mode

Enable debug mode in `config.js`:
```javascript
debug: {
    enableLogging: true,
    useMockData: true  // For testing without real APIs
}
```

## 📊 Performance Optimization

### For Production:
1. **Minify JavaScript files**
2. **Optimize images and assets**
3. **Enable CDN for static assets**
4. **Configure caching headers**
5. **Monitor API usage and costs**

### API Rate Limiting:
- **Gemini**: 15 requests per minute (free tier)
- **OpenAI**: Based on your plan
- **Mapbox**: 100,000 requests/month (free tier)

## 🔐 Security Best Practices

1. **Never commit `config.js`** to version control
2. **Use environment variables** in production
3. **Restrict API tokens** to specific domains
4. **Monitor API usage** for unusual activity
5. **Implement rate limiting** for public deployments

## 📈 Monitoring & Analytics

### Built-in Analytics:
- API response times
- Error rates and types
- User interaction tracking
- Performance metrics

### Optional Integrations:
- Google Analytics
- Mixpanel
- Custom logging systems

## 🆘 Support & Resources

### Documentation:
- [Gemini API Docs](https://ai.google.dev/gemini-api/docs)
- [OpenAI API Docs](https://platform.openai.com/docs/guides/structured-outputs)
- [Mapbox GL JS Docs](https://docs.mapbox.com/mapbox-gl-js/)

### Community:
- [Mapbox Discord](https://discord.gg/mapbox)
- [OpenAI Community](https://community.openai.com/)
- [Google AI Forum](https://discuss.ai.google.dev/)

## 🎯 Next Steps

1. **Deploy to Netlify** for public access
2. **Configure all API keys** for full functionality
3. **Customize styling** to match your brand
4. **Add real data sources** for your location
5. **Implement user authentication** for sensitive data
6. **Set up monitoring** and alerting systems

## 📝 Changelog

### v2.0.0 - Enhanced AI Integration
- Added Gemini 2.5 Flash with structured outputs
- Added OpenAI GPT-4o with structured outputs
- Enhanced Mapbox data integration
- Added comprehensive AI analysis features
- Improved error handling and fallbacks
- Added configuration management system

### v1.0.0 - Initial Release
- Basic dashboard functionality
- Simple map integration
- Vehicle detection simulation
- Weather and social media widgets

---

**Ready to deploy!** 🚀 Your enhanced LocalPulse dashboard is now equipped with cutting-edge AI analysis capabilities and comprehensive geospatial features. 