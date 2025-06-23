// Secure Configuration Server for LocalPulse Dashboard
// This server reads from environment variables and serves safe config to frontend
const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Enable CORS for frontend
app.use(cors({
    origin: [
        'http://localhost:8080',
        'http://localhost:3000',
        'https://your-domain.netlify.app'
    ]
}));

app.use(express.json());

// Serve static files (optional - for integrated deployment)
app.use(express.static(path.join(__dirname, '../')));

// Secure configuration endpoint
app.get('/api/config', (req, res) => {
    try {
        // Only send PUBLIC configuration to frontend
        // NEVER send secret keys to frontend
        const publicConfig = {
            mapbox: {
                // Only send public access token (not secret)
                accessToken: process.env.MAPBOX_PUBLIC_TOKEN || '',
                endpoints: {
                    geocoding: 'https://api.mapbox.com/geocoding/v5/mapbox.places',
                    directions: 'https://api.mapbox.com/directions/v5/mapbox/driving',
                    isochrone: 'https://api.mapbox.com/isochrone/v1/mapbox/driving',
                    matrix: 'https://api.mapbox.com/directions-matrix/v1/mapbox/driving',
                    tilequery: 'https://api.mapbox.com/v4/mapbox.mapbox-streets-v8/tilequery'
                }
            },
            location: {
                coralGables: {
                    latitude: 25.721,
                    longitude: -80.268,
                    zoomLevel: 13,
                    name: 'Coral Gables, FL'
                }
            },
            alerts: {
                vehicle: { threshold: 10, peopleThreshold: 20 },
                crime: { high: 5, critical: 10 },
                traffic: { incidents: 3, critical: 5 }
            },
            debug: {
                environment: process.env.NODE_ENV || 'development',
                enableLogging: process.env.ENABLE_LOGGING === 'true',
                useMockData: process.env.USE_MOCK_DATA === 'true'
            }
        };

        res.json({
            success: true,
            config: publicConfig,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Config endpoint error:', error);
        res.status(500).json({
            success: false,
            error: 'Configuration unavailable'
        });
    }
});

// Secure AI analysis endpoint (keeps API keys on backend)
app.post('/api/ai/analyze', async (req, res) => {
    try {
        const { type, data, prompt } = req.body;
        
        // Use API keys from environment variables (secure)
        const geminiKey = process.env.GEMINI_API_KEY;
        const openaiKey = process.env.OPENAI_API_KEY;

        if (!geminiKey && !openaiKey) {
            return res.status(503).json({
                success: false,
                error: 'AI services not configured'
            });
        }

        // Implement AI analysis here using backend API keys
        // This keeps secrets secure on the server
        let result;
        
        if (geminiKey) {
            result = await analyzeWithGemini(data, prompt, geminiKey);
        } else if (openaiKey) {
            result = await analyzeWithOpenAI(data, prompt, openaiKey);
        }

        res.json({
            success: true,
            analysis: result,
            provider: geminiKey ? 'gemini' : 'openai'
        });

    } catch (error) {
        console.error('AI analysis error:', error);
        res.status(500).json({
            success: false,
            error: 'Analysis failed'
        });
    }
});

// Weather data endpoint (secure)
app.get('/api/weather/:lat/:lon', async (req, res) => {
    try {
        const { lat, lon } = req.params;
        const weatherKey = process.env.OPENWEATHER_API_KEY;

        if (!weatherKey) {
            return res.status(503).json({
                success: false,
                error: 'Weather service not configured'
            });
        }

        // Fetch weather data using backend API key
        const weatherData = await fetchWeatherData(lat, lon, weatherKey);
        
        res.json({
            success: true,
            weather: weatherData
        });

    } catch (error) {
        console.error('Weather endpoint error:', error);
        res.status(500).json({
            success: false,
            error: 'Weather data unavailable'
        });
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        services: {
            mapbox: !!process.env.MAPBOX_PUBLIC_TOKEN,
            gemini: !!process.env.GEMINI_API_KEY,
            openai: !!process.env.OPENAI_API_KEY,
            weather: !!process.env.OPENWEATHER_API_KEY
        }
    });
});

// Helper functions for AI analysis
async function analyzeWithGemini(data, prompt, apiKey) {
    const fetch = (await import('node-fetch')).default;
    
    const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: `${prompt}\n\nData: ${JSON.stringify(data)}`
                    }]
                }]
            })
        }
    );

    const result = await response.json();
    return result.candidates?.[0]?.content?.parts?.[0]?.text || 'Analysis unavailable';
}

async function analyzeWithOpenAI(data, prompt, apiKey) {
    const fetch = (await import('node-fetch')).default;
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model: 'gpt-4o-2024-08-06',
            messages: [{
                role: 'user',
                content: `${prompt}\n\nData: ${JSON.stringify(data)}`
            }]
        })
    });

    const result = await response.json();
    return result.choices?.[0]?.message?.content || 'Analysis unavailable';
}

async function fetchWeatherData(lat, lon, apiKey) {
    const fetch = (await import('node-fetch')).default;
    
    const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`
    );

    return await response.json();
}

app.listen(PORT, () => {
    console.log(`🚀 LocalPulse Config Server running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
    console.log(`⚙️ Config endpoint: http://localhost:${PORT}/api/config`);
    
    // Log which services are configured (without exposing keys)
    console.log('\n🔧 Configured Services:');
    console.log(`  Mapbox: ${process.env.MAPBOX_PUBLIC_TOKEN ? '✅' : '❌'}`);
    console.log(`  Gemini AI: ${process.env.GEMINI_API_KEY ? '✅' : '❌'}`);
    console.log(`  OpenAI: ${process.env.OPENAI_API_KEY ? '✅' : '❌'}`);
    console.log(`  Weather: ${process.env.OPENWEATHER_API_KEY ? '✅' : '❌'}`);
});

module.exports = app; 