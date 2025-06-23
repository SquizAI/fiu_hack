# LocalPulse API Setup Guide

This guide will help you obtain and configure all the necessary API keys for the LocalPulse application.

## 🚀 Quick Start

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Follow the sections below to obtain API keys

3. Fill in your `.env` file with the obtained keys

4. Run the application:
   ```bash
   streamlit run main4.py
   ```

## 📋 API Keys Needed

### 🗺️ **Essential APIs (Required for Core Features)**

#### 1. Mapbox Access Token
**Purpose**: 3D maps, visualizations, and mapping features
**Free Tier**: Yes (100,000 map loads/month)

**How to get it:**
1. Go to [mapbox.com](https://www.mapbox.com/)
2. Sign up for a free account
3. Go to Account → Access Tokens
4. Copy the default public token or create a new one
5. Add to `.env`: `MAPBOX_ACCESS_TOKEN=your_token_here`

#### 2. OpenWeatherMap API Key
**Purpose**: Real-time weather data
**Free Tier**: Yes (1,000 calls/day)

**How to get it:**
1. Go to [openweathermap.org](https://openweathermap.org/api)
2. Sign up for a free account
3. Go to API keys section
4. Copy your API key
5. Add to `.env`: `OPENWEATHER_API_KEY=your_key_here`

### 🤖 **AI & Machine Learning APIs**

#### 3. Google Gemini API Key
**Purpose**: AI chat, text analysis, and intelligent insights
**Free Tier**: Yes (generous free quota)

**How to get it:**
1. Go to [Google AI Studio](https://aistudio.google.com/)
2. Sign in with your Google account
3. Click "Get API Key"
4. Create a new API key
5. Add to `.env`: `GOOGLE_GEMINI_API_KEY=your_key_here`

#### 4. Google Maps API Key (Optional)
**Purpose**: Enhanced geocoding and location services
**Free Tier**: Yes ($200 credit/month)

**How to get it:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Maps JavaScript API
4. Go to Credentials → Create API Key
5. Add to `.env`: `GOOGLE_MAPS_API_KEY=your_key_here`

### 📱 **Social Media APIs (Optional)**

#### 5. Reddit API
**Purpose**: Community discussions and local insights
**Free Tier**: Yes

**How to get it:**
1. Go to [reddit.com/prefs/apps](https://www.reddit.com/prefs/apps)
2. Click "Create App" or "Create Another App"
3. Choose "script" as the app type
4. Copy the client ID and secret
5. Add to `.env`:
   ```
   REDDIT_CLIENT_ID=your_client_id_here
   REDDIT_CLIENT_SECRET=your_client_secret_here
   ```

### 🏛️ **Government & Public Data APIs (Optional)**

#### 6. Miami-Dade County Open Data
**Purpose**: Local government data (covers Coral Gables area)
**Free Tier**: Yes (mostly open access)

**How to get it:**
1. Most data is available without API keys
2. For advanced features, register at Miami-Dade Open Data portal
3. Add to `.env`: `MIAMI_DADE_API_KEY=your_key_here` (if needed)

#### 7. FDOT (Florida Department of Transportation) Data
**Purpose**: Traffic and transportation data
**Free Tier**: Yes (via ArcGIS services)

**How to get it:**
1. Most FDOT data is available through [ArcGIS Open Data](https://gis-fdot.opendata.arcgis.com/)
2. For advanced features, get ArcGIS developer account at [developers.arcgis.com](https://developers.arcgis.com/)
3. Add to `.env`: `FDOT_ARCGIS_TOKEN=your_token_here` (if needed)

#### 8. U.S. Census Bureau API
**Purpose**: Demographic and economic data
**Free Tier**: Yes

**How to get it:**
1. Go to [census.gov/developers](https://www.census.gov/developers/)
2. Request an API key
3. Add to `.env`: `CENSUS_API_KEY=your_key_here`

### 💬 **Communication APIs (Optional)**

#### 9. SendGrid API (for email notifications)
**Purpose**: Email notifications and alerts
**Free Tier**: Yes (100 emails/day)

**How to get it:**
1. Go to [sendgrid.com](https://sendgrid.com/)
2. Sign up for free account
3. Go to Settings → API Keys
4. Create a new API key
5. Add to `.env`: `SENDGRID_API_KEY=your_key_here`

#### 10. Twilio API (for SMS notifications)
**Purpose**: SMS alerts and notifications
**Free Tier**: Yes (trial credit)

**How to get it:**
1. Go to [twilio.com](https://www.twilio.com/)
2. Sign up for free account
3. Get your Account SID and Auth Token from console
4. Add to `.env`:
   ```
   TWILIO_ACCOUNT_SID=your_sid_here
   TWILIO_AUTH_TOKEN=your_token_here
   TWILIO_PHONE_NUMBER=your_twilio_number_here
   ```

## 🔧 Configuration Steps

### Step 1: Create your .env file
```bash
cp .env.example .env
```

### Step 2: Edit the .env file
Open `.env` in your text editor and add your API keys:

```bash
# Essential APIs
MAPBOX_ACCESS_TOKEN=pk.eyJ1IjoiWU9VUl9VU0VSTkFNRSIsImEiOiJZT1VSX0FDQ0VTU19UT0tFTiJ9.EXAMPLE_REPLACE_WITH_REAL
OPENWEATHER_API_KEY=abc123def456ghi789
GOOGLE_GEMINI_API_KEY=AIzaSyC123456789abcdef

# Optional APIs (add as needed)
GOOGLE_MAPS_API_KEY=AIzaSyD987654321fedcba
TWITTER_API_KEY=your_twitter_key
REDDIT_CLIENT_ID=your_reddit_id
CENSUS_API_KEY=your_census_key
```

### Step 3: Test your configuration
Run the configuration test:
```bash
python3 config.py
```

This will show you which APIs are configured and which are missing.

### Step 4: Run the application
```bash
streamlit run main4.py
```

## 🚨 Security Best Practices

### ✅ DO:
- Keep your `.env` file private (never commit to git)
- Use environment variables in production
- Rotate API keys regularly
- Set up API key restrictions where possible
- Monitor API usage

### ❌ DON'T:
- Hardcode API keys in source code
- Share API keys in chat/email
- Use production keys in development
- Commit `.env` files to version control

## 🔍 Troubleshooting

### Common Issues:

#### "Missing API configurations" warning
- Check that your `.env` file exists in the correct directory
- Verify API key names match exactly (case-sensitive)
- Ensure no extra spaces around the `=` sign

#### API key not working
- Verify the key is copied correctly (no extra characters)
- Check if the API requires activation/billing setup
- Confirm API quotas haven't been exceeded

#### Streamlit app not loading environment variables
- Restart the Streamlit app after changing `.env`
- Check file path: `.env` should be in the same directory as `main4.py`

### Debug Mode
Set `DEBUG=true` in your `.env` file to see detailed API configuration status in the app.

## 📊 API Usage Monitoring

Most APIs provide usage dashboards:
- **Mapbox**: [account.mapbox.com](https://account.mapbox.com/)
- **OpenWeather**: [home.openweathermap.org/statistics](https://home.openweathermap.org/statistics)
- **Google**: [console.cloud.google.com](https://console.cloud.google.com/)

## 💰 Cost Optimization

### Free Tier Limits:
- **Mapbox**: 100,000 map loads/month
- **OpenWeather**: 1,000 calls/day
- **Google Gemini**: Generous free quota
- **Twitter**: Basic tier with limitations
- **SendGrid**: 100 emails/day

### Tips to stay within free limits:
- Cache API responses when possible
- Use data refresh intervals wisely
- Monitor usage regularly
- Consider rate limiting for high-traffic scenarios

## 🆘 Support

If you need help with API setup:

1. Check the official documentation for each API
2. Look for community forums and Stack Overflow
3. Contact API provider support if needed
4. Check the LocalPulse troubleshooting section

## 📚 Additional Resources

- [Mapbox Documentation](https://docs.mapbox.com/)
- [OpenWeatherMap API Docs](https://openweathermap.org/api)
- [Google AI Documentation](https://ai.google.dev/)
- [Twitter API Docs](https://developer.twitter.com/en/docs)
- [Reddit API Docs](https://www.reddit.com/dev/api/)

---

**Note**: This application is designed to work with minimal API configuration. You can start with just Mapbox and OpenWeather APIs and add others as needed for enhanced functionality. 