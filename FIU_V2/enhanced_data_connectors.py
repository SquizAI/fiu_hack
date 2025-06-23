"""
Enhanced Data Connectors for Miami-Dade County and City of Miami
Comprehensive integration with local government data sources
"""

import requests
import pandas as pd
import json
from datetime import datetime, timedelta
import time
from typing import Dict, List, Optional, Any, Union
import logging
import streamlit as st
from pathlib import Path

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class MiamiCityConnector:
    """
    City of Miami Open Data API Connector
    Based on: https://www.miami.gov/Open-APIs-Datasets
    """
    
    def __init__(self):
        self.base_url = "https://datahub-miamigis.opendata.arcgis.com/api/v3"
        self.arcgis_url = "https://services1.arcgis.com/ORK0LGJlxR5Ek1d1/arcgis/rest/services"
        self.session = requests.Session()
        
    def get_311_service_requests(self, bbox: Optional[List[float]] = None, limit: int = 1000) -> Dict[str, Any]:
        """
        Get 311 service requests from City of Miami
        
        Args:
            bbox: Bounding box [xmin, ymin, xmax, ymax] for filtering
            limit: Maximum number of records to return
            
        Returns:
            Dict containing service request data
        """
        try:
            # 311 Service Requests endpoint
            endpoint = f"{self.arcgis_url}/Miami_311_Service_Requests/FeatureServer/0/query"
            
            params = {
                'where': '1=1',
                'outFields': '*',
                'f': 'json',
                'returnGeometry': 'true',
                'resultRecordCount': limit
            }
            
            if bbox:
                params['geometry'] = f"{bbox[0]},{bbox[1]},{bbox[2]},{bbox[3]}"
                params['geometryType'] = 'esriGeometryEnvelope'
                params['spatialRel'] = 'esriSpatialRelIntersects'
            
            response = self.session.get(endpoint, params=params, timeout=30)
            response.raise_for_status()
            
            data = response.json()
            
            return {
                'success': True,
                'data': data,
                'timestamp': datetime.now().isoformat(),
                'source': 'City of Miami 311',
                'count': len(data.get('features', []))
            }
            
        except Exception as e:
            logger.error(f"Error fetching Miami 311 data: {e}")
            return {
                'success': False,
                'error': str(e),
                'timestamp': datetime.now().isoformat()
            }
    
    def get_building_permits(self, bbox: Optional[List[float]] = None, limit: int = 1000) -> Dict[str, Any]:
        """
        Get building permits data from City of Miami
        """
        try:
            endpoint = f"{self.arcgis_url}/Building_Permits/FeatureServer/0/query"
            
            params = {
                'where': '1=1',
                'outFields': '*',
                'f': 'json',
                'returnGeometry': 'true',
                'resultRecordCount': limit,
                'orderByFields': 'ISSUE_DATE DESC'
            }
            
            if bbox:
                params['geometry'] = f"{bbox[0]},{bbox[1]},{bbox[2]},{bbox[3]}"
                params['geometryType'] = 'esriGeometryEnvelope'
                params['spatialRel'] = 'esriSpatialRelIntersects'
            
            response = self.session.get(endpoint, params=params, timeout=30)
            response.raise_for_status()
            
            data = response.json()
            
            return {
                'success': True,
                'data': data,
                'timestamp': datetime.now().isoformat(),
                'source': 'City of Miami Building Permits',
                'count': len(data.get('features', []))
            }
            
        except Exception as e:
            logger.error(f"Error fetching Miami building permits: {e}")
            return {
                'success': False,
                'error': str(e),
                'timestamp': datetime.now().isoformat()
            }
    
    def get_parks_data(self) -> Dict[str, Any]:
        """
        Get city parks data from City of Miami
        """
        try:
            endpoint = f"{self.arcgis_url}/City_Parks/FeatureServer/0/query"
            
            params = {
                'where': '1=1',
                'outFields': '*',
                'f': 'json',
                'returnGeometry': 'true'
            }
            
            response = self.session.get(endpoint, params=params, timeout=30)
            response.raise_for_status()
            
            data = response.json()
            
            return {
                'success': True,
                'data': data,
                'timestamp': datetime.now().isoformat(),
                'source': 'City of Miami Parks',
                'count': len(data.get('features', []))
            }
            
        except Exception as e:
            logger.error(f"Error fetching Miami parks data: {e}")
            return {
                'success': False,
                'error': str(e),
                'timestamp': datetime.now().isoformat()
            }

class MiamiDadeEnhancedConnector:
    """
    Enhanced Miami-Dade County Data Connector
    Direct access to specific datasets
    """
    
    def __init__(self):
        self.base_url = "https://gis-mdc.opendata.arcgis.com/api/v3"
        self.arcgis_url = "https://services1.arcgis.com/BjXcEDGHQhcNGHoP/arcgis/rest/services"
        self.session = requests.Session()
        
    def get_crime_incidents(self, bbox: Optional[List[float]] = None, days_back: int = 30) -> Dict[str, Any]:
        """
        Get crime incidents from Miami-Dade
        """
        try:
            # Calculate date filter
            end_date = datetime.now()
            start_date = end_date - timedelta(days=days_back)
            
            # Use the actual Miami-Dade crime data endpoint
            endpoint = f"{self.arcgis_url}/Crime_Data/FeatureServer/0/query"
            
            params = {
                'where': f"INCIDENT_DATE >= '{start_date.strftime('%Y-%m-%d')}' AND INCIDENT_DATE <= '{end_date.strftime('%Y-%m-%d')}'",
                'outFields': '*',
                'f': 'json',
                'returnGeometry': 'true',
                'resultRecordCount': 1000
            }
            
            if bbox:
                params['geometry'] = f"{bbox[0]},{bbox[1]},{bbox[2]},{bbox[3]}"
                params['geometryType'] = 'esriGeometryEnvelope'
                params['spatialRel'] = 'esriSpatialRelIntersects'
            
            response = self.session.get(endpoint, params=params, timeout=30)
            response.raise_for_status()
            
            data = response.json()
            
            return {
                'success': True,
                'data': data,
                'timestamp': datetime.now().isoformat(),
                'source': 'Miami-Dade Crime Data',
                'count': len(data.get('features', [])),
                'date_range': f"{start_date.date()} to {end_date.date()}"
            }
            
        except Exception as e:
            logger.error(f"Error fetching Miami-Dade crime data: {e}")
            return {
                'success': False,
                'error': str(e),
                'timestamp': datetime.now().isoformat()
            }
    
    def get_emergency_services(self) -> Dict[str, Any]:
        """
        Get emergency services locations
        """
        try:
            endpoint = f"{self.arcgis_url}/Emergency_Services/FeatureServer/0/query"
            
            params = {
                'where': '1=1',
                'outFields': '*',
                'f': 'json',
                'returnGeometry': 'true'
            }
            
            response = self.session.get(endpoint, params=params, timeout=30)
            response.raise_for_status()
            
            data = response.json()
            
            return {
                'success': True,
                'data': data,
                'timestamp': datetime.now().isoformat(),
                'source': 'Miami-Dade Emergency Services',
                'count': len(data.get('features', []))
            }
            
        except Exception as e:
            logger.error(f"Error fetching emergency services data: {e}")
            return {
                'success': False,
                'error': str(e),
                'timestamp': datetime.now().isoformat()
            }
    
    def get_traffic_signals(self, bbox: Optional[List[float]] = None) -> Dict[str, Any]:
        """
        Get traffic signals data
        """
        try:
            endpoint = f"{self.arcgis_url}/Traffic_Signals/FeatureServer/0/query"
            
            params = {
                'where': '1=1',
                'outFields': '*',
                'f': 'json',
                'returnGeometry': 'true'
            }
            
            if bbox:
                params['geometry'] = f"{bbox[0]},{bbox[1]},{bbox[2]},{bbox[3]}"
                params['geometryType'] = 'esriGeometryEnvelope'
                params['spatialRel'] = 'esriSpatialRelIntersects'
            
            response = self.session.get(endpoint, params=params, timeout=30)
            response.raise_for_status()
            
            data = response.json()
            
            return {
                'success': True,
                'data': data,
                'timestamp': datetime.now().isoformat(),
                'source': 'Miami-Dade Traffic Signals',
                'count': len(data.get('features', []))
            }
            
        except Exception as e:
            logger.error(f"Error fetching traffic signals data: {e}")
            return {
                'success': False,
                'error': str(e),
                'timestamp': datetime.now().isoformat()
            }

class DataIntegrationEngine:
    """
    Comprehensive data integration and processing engine
    """
    
    def __init__(self):
        self.miami_city = MiamiCityConnector()
        self.miami_dade = MiamiDadeEnhancedConnector()
        self.cache_dir = Path("data/cache")
        self.cache_dir.mkdir(exist_ok=True)
        
    def get_comprehensive_city_data(self, bbox: Optional[List[float]] = None) -> Dict[str, Any]:
        """
        Get comprehensive data from all Miami sources
        """
        results = {
            'timestamp': datetime.now().isoformat(),
            'sources': {},
            'summary': {},
            'bbox': bbox or [-80.30, 25.70, -80.25, 25.75]  # Default Coral Gables area
        }
        
        # City of Miami data
        results['sources']['miami_311'] = self.miami_city.get_311_service_requests(bbox)
        results['sources']['miami_permits'] = self.miami_city.get_building_permits(bbox)
        results['sources']['miami_parks'] = self.miami_city.get_parks_data()
        
        # Miami-Dade data
        results['sources']['mdade_crime'] = self.miami_dade.get_crime_incidents(bbox)
        results['sources']['mdade_emergency'] = self.miami_dade.get_emergency_services()
        results['sources']['mdade_traffic'] = self.miami_dade.get_traffic_signals(bbox)
        
        # Create summary
        successful_sources = 0
        total_records = 0
        
        for source_name, source_data in results['sources'].items():
            if source_data.get('success'):
                successful_sources += 1
                total_records += source_data.get('count', 0)
        
        results['summary'] = {
            'total_records': total_records,
            'successful_sources': successful_sources,
            'total_sources': len(results['sources']),
            'success_rate': f"{(successful_sources / len(results['sources']) * 100):.1f}%"
        }
        
        return results
    
    def process_for_dashboard(self, raw_data: Dict[str, Any]) -> Dict[str, pd.DataFrame]:
        """
        Process raw data into DataFrames for dashboard use
        """
        processed = {}
        
        for source_name, source_data in raw_data['sources'].items():
            if source_data.get('success') and source_data.get('data', {}).get('features'):
                try:
                    features = source_data['data']['features']
                    
                    # Extract attributes and geometry
                    records = []
                    for feature in features:
                        record = feature.get('attributes', {})
                        
                        # Add geometry if available
                        geometry = feature.get('geometry')
                        if geometry:
                            if geometry.get('x') and geometry.get('y'):
                                record['longitude'] = geometry['x']
                                record['latitude'] = geometry['y']
                            elif geometry.get('coordinates'):
                                coords = geometry['coordinates']
                                if len(coords) >= 2:
                                    record['longitude'] = coords[0]
                                    record['latitude'] = coords[1]
                        
                        records.append(record)
                    
                    if records:
                        df = pd.DataFrame(records)
                        processed[source_name] = df
                        
                except Exception as e:
                    logger.error(f"Error processing {source_name}: {e}")
        
        return processed
    
    def save_to_cache(self, data: Dict[str, Any], cache_key: str):
        """
        Save data to cache for faster subsequent loads
        """
        try:
            cache_file = self.cache_dir / f"{cache_key}.json"
            with open(cache_file, 'w') as f:
                json.dump(data, f, indent=2, default=str)
        except Exception as e:
            logger.error(f"Error saving to cache: {e}")
    
    def load_from_cache(self, cache_key: str, max_age_hours: int = 1) -> Optional[Dict[str, Any]]:
        """
        Load data from cache if it's fresh enough
        """
        try:
            cache_file = self.cache_dir / f"{cache_key}.json"
            if cache_file.exists():
                # Check file age
                file_age = datetime.now() - datetime.fromtimestamp(cache_file.stat().st_mtime)
                if file_age.total_seconds() < max_age_hours * 3600:
                    with open(cache_file, 'r') as f:
                        return json.load(f)
        except Exception as e:
            logger.error(f"Error loading from cache: {e}")
        
        return None

# Streamlit integration functions
@st.cache_data(ttl=3600)  # Cache for 1 hour
def get_miami_data_cached(bbox_str: str = "default") -> Dict[str, Any]:
    """
    Cached function to get Miami data for Streamlit
    """
    engine = DataIntegrationEngine()
    
    # Convert bbox string back to list if needed
    bbox = [-80.30, 25.70, -80.25, 25.75] if bbox_str == "default" else None
    
    return engine.get_comprehensive_city_data(bbox)

def display_miami_data_dashboard():
    """
    Display Miami data in Streamlit dashboard
    """
    st.subheader("🏛️ Miami-Dade & City of Miami Data Integration")
    
    # Get data
    with st.spinner("Loading Miami area data..."):
        data = get_miami_data_cached()
    
    # Display summary
    col1, col2, col3, col4 = st.columns(4)
    
    with col1:
        st.metric("Total Records", data['summary']['total_records'])
    
    with col2:
        st.metric("Active Sources", f"{data['summary']['successful_sources']}/{data['summary']['total_sources']}")
    
    with col3:
        st.metric("Success Rate", data['summary']['success_rate'])
    
    with col4:
        st.metric("Last Updated", data['timestamp'][:16])
    
    # Display source details
    st.subheader("📊 Data Sources Status")
    
    source_status = []
    for source_name, source_data in data['sources'].items():
        status_row = {
            'Source': source_name.replace('_', ' ').title(),
            'Status': '✅ Active' if source_data.get('success') else '❌ Error',
            'Records': source_data.get('count', 0),
            'Last Updated': source_data.get('timestamp', '')[:16] if source_data.get('timestamp') else 'N/A'
        }
        if not source_data.get('success'):
            status_row['Error'] = source_data.get('error', 'Unknown error')
        
        source_status.append(status_row)
    
    st.dataframe(pd.DataFrame(source_status), use_container_width=True)
    
    # Process and display data
    engine = DataIntegrationEngine()
    processed_data = engine.process_for_dashboard(data)
    
    if processed_data:
        st.subheader("🗺️ Geographic Data Visualization")
        
        # Create a map with all data points
        map_data = []
        colors = {
            'miami_311': [255, 0, 0],      # Red for 311 requests
            'miami_permits': [0, 255, 0],  # Green for permits
            'miami_parks': [0, 0, 255],    # Blue for parks
            'mdade_crime': [255, 165, 0],  # Orange for crime
            'mdade_emergency': [128, 0, 128], # Purple for emergency
            'mdade_traffic': [255, 255, 0]  # Yellow for traffic
        }
        
        for source_name, df in processed_data.items():
            if 'latitude' in df.columns and 'longitude' in df.columns:
                source_df = df[['latitude', 'longitude']].dropna()
                source_df = source_df[(source_df['latitude'] != 0) & (source_df['longitude'] != 0)]
                
                if not source_df.empty:
                    source_df['source'] = source_name
                    source_df['color'] = [colors.get(source_name, [128, 128, 128])] * len(source_df)
                    map_data.append(source_df)
        
        if map_data:
            combined_map_data = pd.concat(map_data, ignore_index=True)
            
            # Create pydeck map
            import pydeck as pdk
            
            view_state = pdk.ViewState(
                latitude=25.721,
                longitude=-80.268,
                zoom=11,
                pitch=0,
            )
            
            layer = pdk.Layer(
                "ScatterplotLayer",
                combined_map_data,
                get_position=["longitude", "latitude"],
                get_color="color",
                get_radius=50,
                pickable=True,
            )
            
            deck = pdk.Deck(
                map_style='mapbox://styles/mapbox/light-v9',
                initial_view_state=view_state,
                layers=[layer],
            )
            
            st.pydeck_chart(deck)
        
        # Display individual datasets
        st.subheader("📋 Dataset Details")
        
        for source_name, df in processed_data.items():
            with st.expander(f"{source_name.replace('_', ' ').title()} ({len(df)} records)"):
                st.dataframe(df.head(10), use_container_width=True)
                
                if len(df) > 10:
                    st.info(f"Showing first 10 of {len(df)} records")
    
    return data, processed_data

# Testing function
def test_enhanced_connectors():
    """Test the enhanced connectors"""
    print("🔧 Testing Enhanced Miami Data Connectors...")
    
    engine = DataIntegrationEngine()
    
    # Test comprehensive data fetch
    print("\n📊 Testing Comprehensive Data Fetch...")
    data = engine.get_comprehensive_city_data()
    print(f"Summary: {data['summary']}")
    
    # Test data processing
    print("\n🔄 Testing Data Processing...")
    processed = engine.process_for_dashboard(data)
    print(f"Processed {len(processed)} datasets")
    
    for name, df in processed.items():
        print(f"  - {name}: {len(df)} records")
    
    return data, processed

if __name__ == "__main__":
    test_enhanced_connectors() 