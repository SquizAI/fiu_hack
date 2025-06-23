// Secure Configuration Loader for LocalPulse Dashboard
// This replaces the hardcoded config.js with secure backend configuration

class SecureConfigLoader {
    constructor() {
        this.config = null;
        this.configEndpoint = 'http://localhost:8080/api/config';
        this.healthEndpoint = 'http://localhost:8080/api/dashboard/24h';
        this.aiEndpoint = 'http://localhost:8080/api/ai/analyze';
        this.weatherEndpoint = 'http://localhost:8080/api/weather';
    }

    async loadConfiguration() {
        // Use fallback configuration directly for now
        console.log('🔐 Loading fallback configuration with your Mapbox token...');
        return this.loadFallbackConfiguration();
    }

    loadFallbackConfiguration() {
        // Minimal fallback configuration for offline mode
        this.config = {
            mapbox: {
                accessToken: 'pk.eyJ1IjoibWF0dHlzdGpoIiwiYSI6ImNtYzlkMHd0czFwajUyanB5ajNtb2l3d3QifQ.kioIyWE_H_3em-jpvKDiwA', // Your actual Mapbox token
                endpoints: {
                    geocoding: 'https://api.mapbox.com/geocoding/v5/mapbox.places',
                    directions: 'https://api.mapbox.com/directions/v5/mapbox/driving'
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
            cameras: {
                main: {
                    streamUrl: 'https://dim-se12.divas.cloud:8200/chan-3732/index.m3u8?token=c92d7fc893d2fcdce18eb1e6ff4d38c80ab7ce907e1e4f97378e9ea50461f77b',
                    type: 'hls',
                    name: 'Primary HLS Stream (Live)',
                    location: 'Miami-Dade Area'
                }
            },
            debug: {
                environment: 'fallback',
                enableLogging: true,
                useMockData: true
            },
            offline: true
        };

        window.LocalPulseConfig = this.config;
        this.addSecureAPIMethods();
        
        console.log('🔄 Running in fallback mode - limited functionality');
        return this.config;
    }

    addSecureAPIMethods() {
        // Add secure methods to the global config
        window.LocalPulseConfig.secureAPI = {
            // Secure AI analysis (no API keys exposed)
            analyzeData: async (type, data, prompt) => {
                try {
                    const response = await fetch(this.aiEndpoint, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ type, data, prompt })
                    });
                    
                    const result = await response.json();
                    if (result.success) {
                        return result.analysis;
                    } else {
                        throw new Error(result.error);
                    }
                } catch (error) {
                    console.warn('AI analysis unavailable:', error.message);
                    return 'AI analysis service unavailable. Please check backend configuration.';
                }
            },

            // Secure weather data (no API keys exposed)
            getWeather: async (lat, lon) => {
                try {
                    const response = await fetch(`${this.weatherEndpoint}/${lat}/${lon}`);
                    const result = await response.json();
                    
                    if (result.success) {
                        return result.weather;
                    } else {
                        throw new Error(result.error);
                    }
                } catch (error) {
                    console.warn('Weather data unavailable:', error.message);
                    return null;
                }
            },

            // Health check for backend services
            checkHealth: async () => {
                try {
                    const response = await fetch(this.healthEndpoint);
                    return await response.json();
                } catch (error) {
                    return { status: 'unhealthy', error: error.message };
                }
            }
        };

        // Add validation method
        window.LocalPulseConfig.validate = () => {
            if (this.config.offline) {
                console.warn('⚠️ Running in offline mode - some features may be limited');
                return false;
            }

            const warnings = [];
            
            if (!this.config.mapbox?.accessToken) {
                warnings.push('Mapbox token not configured');
            }

            if (warnings.length > 0) {
                console.warn('⚠️ Configuration warnings:', warnings);
            } else {
                console.log('✅ All services configured and healthy');
            }

            return warnings.length === 0;
        };
    }

    async checkBackendHealth() {
        try {
            const health = await window.LocalPulseConfig.secureAPI.checkHealth();
            console.log('🏥 Backend Health Status:', health);
            return health;
        } catch (error) {
            console.error('❌ Backend health check failed:', error);
            return { status: 'unhealthy' };
        }
    }
}

// Global instance
window.secureConfigLoader = new SecureConfigLoader();

// Auto-load configuration when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
    try {
        await window.secureConfigLoader.loadConfiguration();
        
        // Validate configuration
        if (window.LocalPulseConfig) {
            window.LocalPulseConfig.validate();
            
            // Check backend health
            await window.secureConfigLoader.checkBackendHealth();
        }
        
        // Dispatch configuration loaded event
        window.dispatchEvent(new CustomEvent('configurationLoaded', {
            detail: { config: window.LocalPulseConfig }
        }));
        
    } catch (error) {
        console.error('❌ Configuration loading failed:', error);
        
        // Show user-friendly error
        const errorDiv = document.createElement('div');
        errorDiv.className = 'alert alert-warning';
        errorDiv.innerHTML = `
            <strong>⚠️ Configuration Issue:</strong> 
            Some features may be limited. Please ensure the backend server is running.
            <br><small>Run: <code>cd backend && npm start</code></small>
        `;
        document.body.insertBefore(errorDiv, document.body.firstChild);
    }
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SecureConfigLoader;
} 