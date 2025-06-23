"""
LocalPulse Configuration Management
Centralized configuration loading and validation for API keys and settings.
"""

import os
import warnings
from typing import Optional, Dict, Any
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class Config:
    """Configuration class for LocalPulse application"""
    
    def __init__(self):
        """Initialize configuration with environment variables"""
        self._load_config()
        self._validate_critical_apis()
    
    def _load_config(self):
        """Load all configuration from environment variables"""
        
        # =============================================================================
        # API KEYS
        # =============================================================================
        self.MAPBOX_ACCESS_TOKEN = os.getenv('MAPBOX_ACCESS_TOKEN', '')
        self.OPENWEATHER_API_KEY = os.getenv('OPENWEATHER_API_KEY', '')
        self.GOOGLE_GEMINI_API_KEY = os.getenv('GOOGLE_GEMINI_API_KEY', '')
        self.GOOGLE_MAPS_API_KEY = os.getenv('GOOGLE_MAPS_API_KEY', '')
        self.HUGGINGFACE_API_KEY = os.getenv('HUGGINGFACE_API_KEY', '')
        self.OPENAI_API_KEY = os.getenv('OPENAI_API_KEY', '')
        
        # Social Media APIs
        self.REDDIT_CLIENT_ID = os.getenv('REDDIT_CLIENT_ID', '')
        self.REDDIT_CLIENT_SECRET = os.getenv('REDDIT_CLIENT_SECRET', '')
        self.REDDIT_USER_AGENT = os.getenv('REDDIT_USER_AGENT', 'LocalPulse/1.0')
        
        # Government Data APIs
        self.MIAMI_DADE_API_KEY = os.getenv('MIAMI_DADE_API_KEY', '')
        self.FDOT_ARCGIS_TOKEN = os.getenv('FDOT_ARCGIS_TOKEN', '')
        self.CENSUS_API_KEY = os.getenv('CENSUS_API_KEY', '')
        self.ZILLOW_API_KEY = os.getenv('ZILLOW_API_KEY', '')
        
        # Communication APIs
        self.SENDGRID_API_KEY = os.getenv('SENDGRID_API_KEY', '')
        self.SENDGRID_FROM_EMAIL = os.getenv('SENDGRID_FROM_EMAIL', 'noreply@localpulse.com')
        self.TWILIO_ACCOUNT_SID = os.getenv('TWILIO_ACCOUNT_SID', '')
        self.TWILIO_AUTH_TOKEN = os.getenv('TWILIO_AUTH_TOKEN', '')
        self.TWILIO_PHONE_NUMBER = os.getenv('TWILIO_PHONE_NUMBER', '')
        
        # =============================================================================
        # DATABASE & STORAGE
        # =============================================================================
        self.DATABASE_URL = os.getenv('DATABASE_URL', '')
        self.MONGODB_URI = os.getenv('MONGODB_URI', '')
        self.AWS_ACCESS_KEY_ID = os.getenv('AWS_ACCESS_KEY_ID', '')
        self.AWS_SECRET_ACCESS_KEY = os.getenv('AWS_SECRET_ACCESS_KEY', '')
        self.AWS_S3_BUCKET_NAME = os.getenv('AWS_S3_BUCKET_NAME', '')
        
        # =============================================================================
        # VIDEO STREAMING
        # =============================================================================
        self.MAIN_CAMERA_STREAM_URL = os.getenv('MAIN_CAMERA_STREAM_URL', '')
        self.BACKUP_CAMERA_STREAM_URL = os.getenv('BACKUP_CAMERA_STREAM_URL', '')
        self.TRAFFIC_CAMERA_API_KEY = os.getenv('TRAFFIC_CAMERA_API_KEY', '')
        
        # =============================================================================
        # APPLICATION SETTINGS
        # =============================================================================
        self.ENVIRONMENT = os.getenv('ENVIRONMENT', 'development')
        self.DEBUG = os.getenv('DEBUG', 'true').lower() == 'true'
        self.APP_URL = os.getenv('APP_URL', 'http://localhost:8501')
        
        # =============================================================================
        # LOCATION SETTINGS
        # =============================================================================
        self.DEFAULT_LATITUDE = float(os.getenv('DEFAULT_LATITUDE', '25.721'))
        self.DEFAULT_LONGITUDE = float(os.getenv('DEFAULT_LONGITUDE', '-80.268'))
        self.DEFAULT_ZOOM_LEVEL = int(os.getenv('DEFAULT_ZOOM_LEVEL', '13'))
        
        # Geofencing boundaries
        self.CORAL_GABLES_NORTH_BOUNDARY = float(os.getenv('CORAL_GABLES_NORTH_BOUNDARY', '25.75'))
        self.CORAL_GABLES_SOUTH_BOUNDARY = float(os.getenv('CORAL_GABLES_SOUTH_BOUNDARY', '25.70'))
        self.CORAL_GABLES_EAST_BOUNDARY = float(os.getenv('CORAL_GABLES_EAST_BOUNDARY', '-80.25'))
        self.CORAL_GABLES_WEST_BOUNDARY = float(os.getenv('CORAL_GABLES_WEST_BOUNDARY', '-80.30'))
        
        # =============================================================================
        # ALERT THRESHOLDS
        # =============================================================================
        self.DEFAULT_CRIME_ALERT_THRESHOLD = int(os.getenv('DEFAULT_CRIME_ALERT_THRESHOLD', '5'))
        self.DEFAULT_TRAFFIC_ALERT_THRESHOLD = int(os.getenv('DEFAULT_TRAFFIC_ALERT_THRESHOLD', '10'))
        self.DEFAULT_VEHICLE_ALERT_THRESHOLD = int(os.getenv('DEFAULT_VEHICLE_ALERT_THRESHOLD', '20'))
        
        # =============================================================================
        # DATA REFRESH INTERVALS (in minutes)
        # =============================================================================
        self.CRIME_DATA_REFRESH_INTERVAL = int(os.getenv('CRIME_DATA_REFRESH_INTERVAL', '60'))
        self.TRAFFIC_DATA_REFRESH_INTERVAL = int(os.getenv('TRAFFIC_DATA_REFRESH_INTERVAL', '30'))
        self.SOCIAL_MEDIA_REFRESH_INTERVAL = int(os.getenv('SOCIAL_MEDIA_REFRESH_INTERVAL', '15'))
        
        # =============================================================================
        # SECURITY
        # =============================================================================
        self.JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', '')
        self.SESSION_SECRET = os.getenv('SESSION_SECRET', '')
        self.ADMIN_USERNAME = os.getenv('ADMIN_USERNAME', 'admin')
        self.ADMIN_PASSWORD = os.getenv('ADMIN_PASSWORD', '')
        
        # =============================================================================
        # ANALYTICS & MONITORING
        # =============================================================================
        self.GOOGLE_ANALYTICS_ID = os.getenv('GOOGLE_ANALYTICS_ID', '')
        self.SENTRY_DSN = os.getenv('SENTRY_DSN', '')
    
    def _validate_critical_apis(self):
        """Validate that critical API keys are present"""
        critical_apis = {
            'MAPBOX_ACCESS_TOKEN': self.MAPBOX_ACCESS_TOKEN,
            'OPENWEATHER_API_KEY': self.OPENWEATHER_API_KEY,
        }
        
        missing_apis = [name for name, value in critical_apis.items() if not value]
        
        if missing_apis:
            warnings.warn(
                f"Missing critical API keys: {', '.join(missing_apis)}. "
                f"Some features may not work properly. "
                f"Please check your .env file or environment variables.",
                UserWarning
            )
    
    def get_api_status(self) -> Dict[str, bool]:
        """Get the status of all API keys"""
        return {
            'Mapbox': bool(self.MAPBOX_ACCESS_TOKEN),
            'OpenWeather': bool(self.OPENWEATHER_API_KEY),
            'Google Gemini': bool(self.GOOGLE_GEMINI_API_KEY),
            'Google Maps': bool(self.GOOGLE_MAPS_API_KEY),
            'Reddit': bool(self.REDDIT_CLIENT_ID),
            'SendGrid': bool(self.SENDGRID_API_KEY),
            'Twilio': bool(self.TWILIO_ACCOUNT_SID),
            'Main Camera': bool(self.MAIN_CAMERA_STREAM_URL),
            'Miami-Dade Data': bool(self.MIAMI_DADE_API_KEY),
            'FDOT Data': bool(self.FDOT_ARCGIS_TOKEN),
            'Database': bool(self.DATABASE_URL),
        }
    
    def get_missing_apis(self) -> list:
        """Get list of missing API configurations"""
        status = self.get_api_status()
        return [api for api, configured in status.items() if not configured]
    
    def is_production(self) -> bool:
        """Check if running in production environment"""
        return self.ENVIRONMENT.lower() == 'production'
    
    def is_development(self) -> bool:
        """Check if running in development environment"""
        return self.ENVIRONMENT.lower() == 'development'
    
    def get_location_bounds(self) -> Dict[str, float]:
        """Get the geographic boundaries for the area"""
        return {
            'north': self.CORAL_GABLES_NORTH_BOUNDARY,
            'south': self.CORAL_GABLES_SOUTH_BOUNDARY,
            'east': self.CORAL_GABLES_EAST_BOUNDARY,
            'west': self.CORAL_GABLES_WEST_BOUNDARY,
        }
    
    def get_default_location(self) -> tuple:
        """Get the default latitude and longitude"""
        return (self.DEFAULT_LATITUDE, self.DEFAULT_LONGITUDE)

# Create global config instance
config = Config()

def get_config() -> Config:
    """Get the global configuration instance"""
    return config

def check_api_setup():
    """Check and display API setup status"""
    import streamlit as st
    
    status = config.get_api_status()
    missing = config.get_missing_apis()
    
    if missing:
        st.warning(
            f"⚠️ Missing API configurations: {', '.join(missing)}. "
            f"Some features may not work properly. "
            f"Please check your .env file."
        )
    
    if config.DEBUG:
        with st.expander("🔧 API Configuration Status"):
            for api, configured in status.items():
                status_icon = "✅" if configured else "❌"
                st.write(f"{status_icon} {api}")
            
            if missing:
                st.write("### Missing Configurations:")
                for api in missing:
                    st.write(f"• {api}")
                st.write("Please add these to your .env file to enable full functionality.")

if __name__ == "__main__":
    # Test configuration loading
    print("LocalPulse Configuration Test")
    print("=" * 40)
    print(f"Environment: {config.ENVIRONMENT}")
    print(f"Debug Mode: {config.DEBUG}")
    print(f"Default Location: {config.get_default_location()}")
    print(f"Missing APIs: {config.get_missing_apis()}")
    print("API Status:")
    for api, status in config.get_api_status().items():
        print(f"  {api}: {'✅' if status else '❌'}") 