// LocalPulse HTML Dashboard Configuration
// Copy this file to config.js and fill in your actual API keys
// Make sure to add config.js to .gitignore for security

window.LocalPulseConfig = {
    // ===========================================
    // MAPBOX CONFIGURATION
    // ===========================================
    // Get your Mapbox access token from: https://account.mapbox.com/access-tokens/
    mapbox: {
        accessToken: 'pk.eyJ1IjoiWU9VUl9VU0VSTkFNRSIsImEiOiJZT1VSX0FDQ0VTU19UT0tFTiJ9.EXAMPLE_TOKEN_REPLACE_WITH_REAL',
        // Enhanced Mapbox endpoints
        endpoints: {
            geocoding: 'https://api.mapbox.com/geocoding/v5/mapbox.places',
            directions: 'https://api.mapbox.com/directions/v5/mapbox/driving',
            isochrone: 'https://api.mapbox.com/isochrone/v1/mapbox/driving',
            matrix: 'https://api.mapbox.com/directions-matrix/v1/mapbox/driving',
            tilequery: 'https://api.mapbox.com/v4/mapbox.mapbox-streets-v8/tilequery'
        }
    },

    // ===========================================
    // AI/LLM API CONFIGURATION
    // ===========================================
    ai: {
        // Google Gemini API
        gemini: {
            apiKey: 'your_gemini_api_key_here',
            endpoint: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent',
            model: 'gemini-2.5-flash'
        },
        // OpenAI API (fallback)
        openai: {
            apiKey: 'your_openai_api_key_here',
            endpoint: 'https://api.openai.com/v1/chat/completions',
            model: 'gpt-4o-2024-08-06'
        }
    },

    // ===========================================
    // WEATHER API CONFIGURATION
    // ===========================================
    weather: {
        openWeather: {
            apiKey: 'your_openweather_api_key_here',
            endpoint: 'https://api.openweathermap.org/data/2.5'
        }
    },

    // ===========================================
    // SOCIAL MEDIA API CONFIGURATION
    // ===========================================
    social: {
        reddit: {
            clientId: 'your_reddit_client_id_here',
            clientSecret: 'your_reddit_client_secret_here',
            userAgent: 'LocalPulse:v1.0 (by /u/yourusername)'
        }
    },

    // ===========================================
    // CAMERA/VEHICLE DETECTION CONFIGURATION
    // ===========================================
    cameras: {
        main: {
            streamUrl: 'https://165-d6.divas.cloud/CHAN-3733/CHAN-3733_1.stream/playlist.m3u8?207.104.43.103&vdswztokenhash=461LVNdYHfTNh83qZQ48fJzya9ED8ORLMpGwvS2ierc=',
            name: 'Main Traffic Camera'
        },
        backup: {
            streamUrl: '',
            name: 'Backup Camera'
        },
        internal: {
            apiUrl: 'http://your-camera-api.local/api',
            apiKey: 'your_camera_api_key_here'
        }
    },

    // ===========================================
    // LOCATION CONFIGURATION
    // ===========================================
    location: {
        coralGables: {
            latitude: 25.721,
            longitude: -80.268,
            zoomLevel: 13,
            name: 'Coral Gables, FL'
        }
    },

    // ===========================================
    // DATA SOURCE CONFIGURATION
    // ===========================================
    dataSources: {
        miamiDade: {
            baseUrl: 'https://gis-mdc.opendata.arcgis.com/',
            endpoints: {
                crime: '/datasets/crime-incidents',
                traffic: '/datasets/traffic-incidents'
            }
        },
        fdot: {
            baseUrl: 'https://gis-fdot.opendata.arcgis.com/',
            token: 'your_fdot_token_here'
        },
        miami311: {
            baseUrl: 'https://opendata.miamigov.com/',
            endpoint: '/api/311-requests'
        }
    },

    // ===========================================
    // ALERT THRESHOLDS
    // ===========================================
    alerts: {
        vehicle: {
            threshold: 10,
            peopleThreshold: 20
        },
        crime: {
            high: 5,
            critical: 10
        },
        traffic: {
            incidents: 3,
            critical: 5
        }
    },

    // ===========================================
    // OPTIONAL ENHANCED FEATURES
    // ===========================================
    optional: {
        googleMaps: {
            apiKey: 'your_google_maps_api_key_here'
        },
        notifications: {
            sendgrid: {
                apiKey: 'your_sendgrid_api_key_here',
                fromEmail: 'alerts@localpulse.app'
            },
            twilio: {
                accountSid: 'your_twilio_account_sid_here',
                authToken: 'your_twilio_auth_token_here',
                phoneNumber: '+1234567890'
            },
            slack: {
                webhookUrl: 'https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK'
            }
        },
        analytics: {
            googleAnalytics: 'your_ga_tracking_id_here',
            mixpanel: 'your_mixpanel_token_here'
        }
    },

    // ===========================================
    // DEVELOPMENT/DEBUG CONFIGURATION
    // ===========================================
    debug: {
        environment: 'development', // 'development' or 'production'
        enableLogging: true,
        useMockData: true,
        apiTimeout: 30000
    },

    // ===========================================
    // SECURITY CONFIGURATION
    // ===========================================
    security: {
        allowedOrigins: [
            'http://localhost:3000',
            'https://your-domain.netlify.app'
        ],
        rateLimitPerMinute: 100
    }
};

// Validation function to check if required configurations are present
window.LocalPulseConfig.validate = function() {
    const required = [
        'mapbox.accessToken'
    ];
    
    const missing = [];
    
    required.forEach(path => {
        const value = path.split('.').reduce((obj, key) => obj && obj[key], this);
        if (!value || value.includes('your_') || value.includes('_here')) {
            missing.push(path);
        }
    });
    
    if (missing.length > 0) {
        console.warn('⚠️ Missing required configuration:', missing);
        return false;
    }
    
    console.log('✅ Configuration validation passed');
    return true;
};

// Initialize configuration
document.addEventListener('DOMContentLoaded', () => {
    if (window.LocalPulseConfig) {
        window.LocalPulseConfig.validate();
    }
}); 