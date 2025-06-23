"""
Data Connectors for External APIs
Handles FDOT traffic data and Miami-Dade government data integration
"""

import requests
import pandas as pd
import json
from datetime import datetime, timedelta
import time
from typing import Dict, List, Optional, Any
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class FDOTConnector:
    """
    Florida Department of Transportation (FDOT) Data Connector
    Accesses traffic, road, and infrastructure data
    """
    
    def __init__(self):
        self.base_url = "https://services1.arcgis.com/O1JpcwDW8sjYuddV/arcgis/rest/services"
        self.session = requests.Session()
        
    def get_traffic_data(self, bbox: Optional[List[float]] = None) -> Dict[str, Any]:
        """
        Get real-time traffic data for Coral Gables area
        
        Args:
            bbox: Bounding box [xmin, ymin, xmax, ymax] for Coral Gables
                 Default: [-80.30, 25.70, -80.25, 25.75]
        
        Returns:
            Dict containing traffic data and metadata
        """
        if bbox is None:
            # Coral Gables bounding box
            bbox = [-80.30, 25.70, -80.25, 25.75]
            
        try:
            # Try Real Time Traffic Volume and Speed data
            endpoint = f"{self.base_url}/Real_Time_Traffic_Volume_and_Speed_Current_All_Directions_TDA/FeatureServer/0/query"
            
            params = {
                'where': '1=1',
                'geometry': f"{bbox[0]},{bbox[1]},{bbox[2]},{bbox[3]}",
                'geometryType': 'esriGeometryEnvelope',
                'spatialRel': 'esriSpatialRelIntersects',
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
                'source': 'FDOT Real-Time Traffic',
                'count': len(data.get('features', []))
            }
            
        except Exception as e:
            logger.error(f"Error fetching FDOT traffic data: {e}")
            return {
                'success': False,
                'error': str(e),
                'timestamp': datetime.now().isoformat()
            }
    
    def get_traffic_incidents(self, bbox: Optional[List[float]] = None) -> Dict[str, Any]:
        """
        Get traffic incidents and road conditions
        """
        if bbox is None:
            bbox = [-80.30, 25.70, -80.25, 25.75]
            
        try:
            # Try to get traffic incident data
            endpoint = f"{self.base_url}/Traffic_Signal_Locations_TDA/FeatureServer/0/query"
            
            params = {
                'where': '1=1',
                'geometry': f"{bbox[0]},{bbox[1]},{bbox[2]},{bbox[3]}",
                'geometryType': 'esriGeometryEnvelope',
                'spatialRel': 'esriSpatialRelIntersects',
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
                'source': 'FDOT Traffic Signals',
                'count': len(data.get('features', []))
            }
            
        except Exception as e:
            logger.error(f"Error fetching FDOT incidents: {e}")
            return {
                'success': False,
                'error': str(e),
                'timestamp': datetime.now().isoformat()
            }

    def get_road_network(self, bbox: Optional[List[float]] = None) -> Dict[str, Any]:
        """
        Get road network and infrastructure data
        """
        if bbox is None:
            bbox = [-80.30, 25.70, -80.25, 25.75]
            
        try:
            endpoint = f"{self.base_url}/State_Roads_TDA/FeatureServer/0/query"
            
            params = {
                'where': '1=1',
                'geometry': f"{bbox[0]},{bbox[1]},{bbox[2]},{bbox[3]}",
                'geometryType': 'esriGeometryEnvelope',
                'spatialRel': 'esriSpatialRelIntersects',
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
                'source': 'FDOT State Roads',
                'count': len(data.get('features', []))
            }
            
        except Exception as e:
            logger.error(f"Error fetching FDOT road network: {e}")
            return {
                'success': False,
                'error': str(e),
                'timestamp': datetime.now().isoformat()
            }

class MiamiDadeConnector:
    """
    Miami-Dade County Open Data Connector
    Accesses crime, emergency services, and government data
    """
    
    def __init__(self):
        self.base_url = "https://gis-mdc.opendata.arcgis.com/api/v3"
        self.session = requests.Session()
        
    def search_datasets(self, query: str, limit: int = 10) -> Dict[str, Any]:
        """
        Search for datasets in Miami-Dade portal
        
        Args:
            query: Search term (e.g., "crime", "traffic", "emergency")
            limit: Maximum number of results
            
        Returns:
            Dict containing search results
        """
        try:
            endpoint = f"{self.base_url}/datasets"
            
            params = {
                'q': query,
                'page[size]': limit
            }
            
            response = self.session.get(endpoint, params=params, timeout=30)
            response.raise_for_status()
            
            data = response.json()
            
            return {
                'success': True,
                'data': data,
                'timestamp': datetime.now().isoformat(),
                'source': 'Miami-Dade Open Data',
                'query': query,
                'count': len(data.get('data', []))
            }
            
        except Exception as e:
            logger.error(f"Error searching Miami-Dade datasets: {e}")
            return {
                'success': False,
                'error': str(e),
                'timestamp': datetime.now().isoformat()
            }
    
    def get_crime_data(self, bbox: Optional[List[float]] = None) -> Dict[str, Any]:
        """
        Get crime data from Miami-Dade (via available crime datasets)
        """
        try:
            # Search for crime datasets
            crime_search = self.search_datasets("crime", limit=5)
            
            if not crime_search['success']:
                return crime_search
                
            # Extract relevant crime datasets
            datasets = crime_search['data'].get('data', [])
            crime_datasets = []
            
            for dataset in datasets:
                if 'crime' in dataset.get('attributes', {}).get('name', '').lower():
                    crime_datasets.append({
                        'id': dataset.get('id'),
                        'name': dataset.get('attributes', {}).get('name'),
                        'description': dataset.get('attributes', {}).get('description'),
                        'url': dataset.get('attributes', {}).get('url'),
                        'modified': dataset.get('attributes', {}).get('modified')
                    })
            
            return {
                'success': True,
                'data': crime_datasets,
                'timestamp': datetime.now().isoformat(),
                'source': 'Miami-Dade Crime Data',
                'count': len(crime_datasets)
            }
            
        except Exception as e:
            logger.error(f"Error fetching Miami-Dade crime data: {e}")
            return {
                'success': False,
                'error': str(e),
                'timestamp': datetime.now().isoformat()
            }
    
    def get_emergency_data(self) -> Dict[str, Any]:
        """
        Get emergency services and incident data
        """
        try:
            # Search for emergency-related datasets
            emergency_search = self.search_datasets("emergency OR fire OR police OR EMS", limit=10)
            
            if not emergency_search['success']:
                return emergency_search
                
            datasets = emergency_search['data'].get('data', [])
            emergency_datasets = []
            
            for dataset in datasets:
                name = dataset.get('attributes', {}).get('name', '').lower()
                if any(term in name for term in ['emergency', 'fire', 'police', 'ems', 'incident']):
                    emergency_datasets.append({
                        'id': dataset.get('id'),
                        'name': dataset.get('attributes', {}).get('name'),
                        'description': dataset.get('attributes', {}).get('description'),
                        'url': dataset.get('attributes', {}).get('url'),
                        'modified': dataset.get('attributes', {}).get('modified'),
                        'type': dataset.get('attributes', {}).get('type')
                    })
            
            return {
                'success': True,
                'data': emergency_datasets,
                'timestamp': datetime.now().isoformat(),
                'source': 'Miami-Dade Emergency Data',
                'count': len(emergency_datasets)
            }
            
        except Exception as e:
            logger.error(f"Error fetching Miami-Dade emergency data: {e}")
            return {
                'success': False,
                'error': str(e),
                'timestamp': datetime.now().isoformat()
            }

class DataProcessor:
    """
    Process and combine data from multiple sources
    """
    
    def __init__(self):
        self.fdot = FDOTConnector()
        self.miami_dade = MiamiDadeConnector()
        
    def get_comprehensive_traffic_data(self, bbox: Optional[List[float]] = None) -> Dict[str, Any]:
        """
        Get comprehensive traffic data from all sources
        """
        results = {
            'timestamp': datetime.now().isoformat(),
            'sources': {},
            'summary': {}
        }
        
        # Get FDOT traffic data
        fdot_traffic = self.fdot.get_traffic_data(bbox)
        results['sources']['fdot_traffic'] = fdot_traffic
        
        # Get FDOT incidents
        fdot_incidents = self.fdot.get_traffic_incidents(bbox)
        results['sources']['fdot_incidents'] = fdot_incidents
        
        # Get road network
        fdot_roads = self.fdot.get_road_network(bbox)
        results['sources']['fdot_roads'] = fdot_roads
        
        # Create summary
        total_features = 0
        successful_sources = 0
        
        for source_name, source_data in results['sources'].items():
            if source_data.get('success'):
                successful_sources += 1
                total_features += source_data.get('count', 0)
        
        results['summary'] = {
            'total_features': total_features,
            'successful_sources': successful_sources,
            'total_sources': len(results['sources']),
            'bbox_used': bbox or [-80.30, 25.70, -80.25, 25.75]
        }
        
        return results
    
    def get_comprehensive_safety_data(self) -> Dict[str, Any]:
        """
        Get comprehensive safety and crime data
        """
        results = {
            'timestamp': datetime.now().isoformat(),
            'sources': {},
            'summary': {}
        }
        
        # Get Miami-Dade crime data
        md_crime = self.miami_dade.get_crime_data()
        results['sources']['miami_dade_crime'] = md_crime
        
        # Get Miami-Dade emergency data
        md_emergency = self.miami_dade.get_emergency_data()
        results['sources']['miami_dade_emergency'] = md_emergency
        
        # Create summary
        total_datasets = 0
        successful_sources = 0
        
        for source_name, source_data in results['sources'].items():
            if source_data.get('success'):
                successful_sources += 1
                total_datasets += source_data.get('count', 0)
        
        results['summary'] = {
            'total_datasets': total_datasets,
            'successful_sources': successful_sources,
            'total_sources': len(results['sources'])
        }
        
        return results

# Example usage and testing functions
def test_connectors():
    """Test all data connectors"""
    print("🔧 Testing Data Connectors...")
    
    processor = DataProcessor()
    
    # Test traffic data
    print("\n📊 Testing Traffic Data...")
    traffic_data = processor.get_comprehensive_traffic_data()
    print(f"Traffic Data Summary: {traffic_data['summary']}")
    
    # Test safety data
    print("\n🚔 Testing Safety Data...")
    safety_data = processor.get_comprehensive_safety_data()
    print(f"Safety Data Summary: {safety_data['summary']}")
    
    return traffic_data, safety_data

if __name__ == "__main__":
    test_connectors() 