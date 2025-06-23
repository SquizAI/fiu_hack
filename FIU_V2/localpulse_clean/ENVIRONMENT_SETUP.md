# 🔐 Environment Variables Setup Guide

## 🚨 IMPORTANT: API Keys Security

**NEVER commit real API keys to Git!** This guide shows you how to set up environment variables securely.

## 📋 Required API Keys

### 1. OpenWeather API Key (Required for Weather Data)
- **Get it FREE**: https://openweathermap.org/api
- **Sign up** → **Get API key** → **Free tier: 1000 calls/day**
- **Used for**: Current weather + 5-day forecast for Miami

### 2. Windy API Key (Already Configured)
- ✅ **Already set**: `5jVQqxUM3iRPuBsAXVG8PtE0ORCktGCf`
- **Used for**: Interactive weather maps and overlays

## 🔧 Local Development Setup

### Option 1: Use the setup script
```bash
./setup-env.sh
```
Then edit `.env` file and replace `your_openweather_api_key_here` with your real key.

### Option 2: Manual setup
Create `.env` file:
```env
NODE_ENV=development
PORT=8080
OPENWEATHER_API_KEY=your_actual_api_key_here
WINDY_API_KEY=5jVQqxUM3iRPuBsAXVG8PtE0ORCktGCf
CORS_ORIGIN=*
```

## 🚀 DigitalOcean Production Setup

### Current Status
- ✅ **Windy API**: Already configured in app.yaml
- ⚠️ **OpenWeather API**: Needs your real key

### To Update OpenWeather API Key:

#### Method 1: Via DigitalOcean Dashboard
1. Go to your app: https://cloud.digitalocean.com/apps
2. Click on your `localpulse-dashboard` app
3. Go to **Settings** → **Environment Variables**
4. Edit `OPENWEATHER_API_KEY` and set your real key
5. **Deploy** the changes

#### Method 2: Via CLI (Update app.yaml)
1. Edit `.do/app.yaml` and replace the OpenWeather key
2. Run: `doctl apps update 1f30f4b1-5d1f-4a3d-966d-9722583da2b0 --spec .do/app.yaml`

## 🧪 Testing API Keys

### Test OpenWeather API
```bash
curl "https://api.openweathermap.org/data/2.5/weather?q=Miami,FL,US&appid=YOUR_API_KEY&units=imperial"
```

### Test Windy API
The Windy API key is already working in your dashboard!

## 🔍 Troubleshooting

### Weather not loading?
1. Check browser console for API errors
2. Verify OpenWeather API key is valid
3. Check if you've exceeded API rate limits (1000/day free tier)

### "API key not configured" error?
1. Make sure `.env` file exists (local) or environment variables are set (production)
2. Restart the server after adding API keys
3. Check that the key is exactly as provided by OpenWeatherMap

## 📊 API Usage Limits

### OpenWeather (Free Tier)
- **Calls/day**: 1,000
- **Calls/minute**: 60
- **Current usage**: ~10 calls/hour for your dashboard

### Windy API
- **Already configured** and working
- **Used for**: Interactive weather maps

## 🎯 Production Deployment Checklist

- [ ] Get OpenWeather API key from openweathermap.org
- [ ] Update environment variable in DigitalOcean
- [ ] Test weather functionality
- [ ] Verify all API endpoints return real data
- [ ] Check browser console for any API errors

---

**Your LocalPulse dashboard is live at**: https://localpulse-dashboard-6rl6s.ondigitalocean.app

**Next step**: Get your free OpenWeather API key and update the environment variable! 