"""
Working Data Integration for Miami-Dade and FDOT
Uses actual available datasets and APIs
"""

import requests
import pandas as pd
import json
import streamlit as st
from datetime import datetime, timedelta
from pathlib import Path
import logging
from typing import Dict, List, Optional, Any

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class WorkingDataIntegration:
    """
    Working integration with actual available Miami data sources
    """
    
    def __init__(self):
        self.data_dir = Path("data/miami_integration")
        self.data_dir.mkdir(exist_ok=True)
        
    def download_miami_crime_data(self) -> Dict[str, Any]:
        """
        Download Miami-Dade crime data from Open Data Portal
        """
        try:
            # Use the actual Miami-Dade crime data CSV download
            url = "https://opendata.miamidade.gov/api/views/3t7d-5gn3/rows.csv?accessType=DOWNLOAD"
            
            st.info("🔄 Downloading Miami-Dade crime data...")
            
            # Download the data
            response = requests.get(url, timeout=60)
            response.raise_for_status()
            
            # Save to file
            csv_file = self.data_dir / "miami_dade_crime.csv"
            with open(csv_file, 'w', encoding='utf-8') as f:
                f.write(response.text)
            
            # Load into DataFrame
            df = pd.read_csv(csv_file)
            
            return {
                'success': True,
                'data': df,
                'source': 'Miami-Dade Crime Data',
                'count': len(df),
                'file_path': str(csv_file),
                'timestamp': datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error downloading Miami crime data: {e}")
            return {
                'success': False,
                'error': str(e),
                'timestamp': datetime.now().isoformat()
            }
    
    def download_miami_311_data(self) -> Dict[str, Any]:
        """
        Download Miami 311 service requests data
        """
        try:
            # Miami 311 data endpoint
            url = "https://opendata.miamidade.gov/api/views/dj6j-qg5t/rows.csv?accessType=DOWNLOAD"
            
            st.info("🔄 Downloading Miami 311 service requests...")
            
            response = requests.get(url, timeout=60)
            response.raise_for_status()
            
            csv_file = self.data_dir / "miami_311_requests.csv"
            with open(csv_file, 'w', encoding='utf-8') as f:
                f.write(response.text)
            
            df = pd.read_csv(csv_file)
            
            return {
                'success': True,
                'data': df,
                'source': 'Miami 311 Service Requests',
                'count': len(df),
                'file_path': str(csv_file),
                'timestamp': datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error downloading Miami 311 data: {e}")
            return {
                'success': False,
                'error': str(e),
                'timestamp': datetime.now().isoformat()
            }
    
    def download_fdot_traffic_data(self) -> Dict[str, Any]:
        """
        Download FDOT traffic data for the region
        """
        try:
            # FDOT Traffic data endpoint (example - adjust as needed)
            url = "https://services1.arcgis.com/O1JpcwDW8sjYuddV/arcgis/rest/services/Traffic_Counts/FeatureServer/0/query"
            
            params = {
                'where': '1=1',
                'outFields': '*',
                'f': 'json',
                'geometry': '-80.30,25.70,-80.25,25.75',  # Coral Gables area
                'geometryType': 'esriGeometryEnvelope',
                'spatialRel': 'esriSpatialRelIntersects',
                'resultRecordCount': 1000
            }
            
            st.info("🔄 Downloading FDOT traffic data...")
            
            response = requests.get(url, params=params, timeout=30)
            response.raise_for_status()
            
            data = response.json()
            features = data.get('features', [])
            
            if features:
                # Convert to DataFrame
                records = []
                for feature in features:
                    record = feature.get('attributes', {})
                    geometry = feature.get('geometry', {})
                    if geometry:
                        record['longitude'] = geometry.get('x')
                        record['latitude'] = geometry.get('y')
                    records.append(record)
                
                df = pd.DataFrame(records)
                
                # Save to CSV
                csv_file = self.data_dir / "fdot_traffic_data.csv"
                df.to_csv(csv_file, index=False)
                
                return {
                    'success': True,
                    'data': df,
                    'source': 'FDOT Traffic Data',
                    'count': len(df),
                    'file_path': str(csv_file),
                    'timestamp': datetime.now().isoformat()
                }
            else:
                return {
                    'success': False,
                    'error': 'No traffic data features found',
                    'timestamp': datetime.now().isoformat()
                }
            
        except Exception as e:
            logger.error(f"Error downloading FDOT traffic data: {e}")
            return {
                'success': False,
                'error': str(e),
                'timestamp': datetime.now().isoformat()
            }
    
    def get_comprehensive_data(self) -> Dict[str, Any]:
        """
        Get comprehensive data from all sources
        """
        results = {
            'timestamp': datetime.now().isoformat(),
            'sources': {},
            'summary': {}
        }
        
        # Download data from each source
        results['sources']['miami_crime'] = self.download_miami_crime_data()
        results['sources']['miami_311'] = self.download_miami_311_data()
        results['sources']['fdot_traffic'] = self.download_fdot_traffic_data()
        
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

def display_working_miami_integration():
    """
    Display the working Miami data integration in Streamlit
    """
    st.title("🏛️ Miami-Dade & FDOT Data Integration")
    st.markdown("Real-time data integration with Miami-Dade County and Florida DOT")
    
    # Initialize integration
    integration = WorkingDataIntegration()
    
    # Control buttons
    col1, col2, col3 = st.columns(3)
    
    with col1:
        if st.button("🔄 Refresh All Data", use_container_width=True):
            st.session_state['refresh_data'] = True
    
    with col2:
        if st.button("📊 View Analytics", use_container_width=True):
            st.session_state['show_analytics'] = True
    
    with col3:
        if st.button("💾 Download Data", use_container_width=True):
            st.session_state['download_data'] = True
    
    # Load or refresh data
    if st.session_state.get('refresh_data', False) or 'miami_data' not in st.session_state:
        with st.spinner("Loading Miami area data..."):
            st.session_state['miami_data'] = integration.get_comprehensive_data()
        st.session_state['refresh_data'] = False
        st.success("✅ Data refreshed successfully!")
    
    # Display results if data is available
    if 'miami_data' in st.session_state:
        data = st.session_state['miami_data']
        
        # Summary metrics
        st.subheader("📊 Data Summary")
        col1, col2, col3, col4 = st.columns(4)
        
        with col1:
            st.metric("Total Records", f"{data['summary']['total_records']:,}")
        
        with col2:
            st.metric("Active Sources", f"{data['summary']['successful_sources']}/{data['summary']['total_sources']}")
        
        with col3:
            st.metric("Success Rate", data['summary']['success_rate'])
        
        with col4:
            st.metric("Last Updated", data['timestamp'][:16])
        
        # Source details
        st.subheader("🔗 Data Sources")
        
        for source_name, source_data in data['sources'].items():
            with st.expander(f"{source_name.replace('_', ' ').title()} - {'✅ Success' if source_data.get('success') else '❌ Error'}"):
                if source_data.get('success'):
                    st.success(f"Successfully loaded {source_data.get('count', 0):,} records")
                    st.info(f"Source: {source_data.get('source', 'Unknown')}")
                    st.info(f"File: {source_data.get('file_path', 'Not saved')}")
                    
                    # Show sample data if available
                    if 'data' in source_data and isinstance(source_data['data'], pd.DataFrame):
                        df = source_data['data']
                        st.markdown("**Sample Data:**")
                        st.dataframe(df.head(5), use_container_width=True)
                        
                        # Show column info
                        st.markdown("**Dataset Info:**")
                        st.write(f"- Rows: {len(df):,}")
                        st.write(f"- Columns: {len(df.columns)}")
                        st.write(f"- Memory Usage: {df.memory_usage(deep=True).sum() / 1024 / 1024:.2f} MB")
                        
                        # Show columns
                        st.markdown("**Columns:**")
                        st.write(", ".join(df.columns.tolist()[:10]) + ("..." if len(df.columns) > 10 else ""))
                        
                else:
                    st.error(f"Failed to load data: {source_data.get('error', 'Unknown error')}")
        
        # Analytics section
        if st.session_state.get('show_analytics', False):
            st.subheader("📈 Data Analytics")
            
            # Analyze each successful dataset
            for source_name, source_data in data['sources'].items():
                if source_data.get('success') and 'data' in source_data:
                    df = source_data['data']
                    
                    st.markdown(f"### {source_name.replace('_', ' ').title()}")
                    
                    # Basic statistics
                    col1, col2 = st.columns(2)
                    
                    with col1:
                        st.markdown("**Numeric Columns:**")
                        numeric_cols = df.select_dtypes(include=['number']).columns.tolist()
                        if numeric_cols:
                            for col in numeric_cols[:5]:  # Show first 5 numeric columns
                                if not df[col].isna().all():
                                    st.metric(col, f"{df[col].mean():.2f}", f"±{df[col].std():.2f}")
                        else:
                            st.info("No numeric columns found")
                    
                    with col2:
                        st.markdown("**Data Quality:**")
                        total_cells = len(df) * len(df.columns)
                        missing_cells = df.isna().sum().sum()
                        completeness = ((total_cells - missing_cells) / total_cells * 100) if total_cells > 0 else 0
                        
                        st.metric("Data Completeness", f"{completeness:.1f}%")
                        st.metric("Missing Values", f"{missing_cells:,}")
                        st.metric("Unique Rows", f"{len(df.drop_duplicates()):,}")
                    
                    # Show data distribution for key columns
                    if len(df) > 0:
                        # Find date columns
                        date_cols = []
                        for col in df.columns:
                            if 'date' in col.lower() or 'time' in col.lower():
                                try:
                                    pd.to_datetime(df[col].dropna().iloc[:100])
                                    date_cols.append(col)
                                except:
                                    pass
                        
                        if date_cols:
                            st.markdown("**Time Series Analysis:**")
                            date_col = date_cols[0]  # Use first date column
                            try:
                                df_time = df.copy()
                                df_time[date_col] = pd.to_datetime(df_time[date_col])
                                df_time = df_time.dropna(subset=[date_col])
                                
                                if len(df_time) > 0:
                                    # Group by date and count
                                    time_series = df_time.groupby(df_time[date_col].dt.date).size()
                                    st.line_chart(time_series)
                            except Exception as e:
                                st.warning(f"Could not create time series chart: {e}")
        
        # Download section
        if st.session_state.get('download_data', False):
            st.subheader("💾 Download Options")
            
            for source_name, source_data in data['sources'].items():
                if source_data.get('success') and 'data' in source_data:
                    df = source_data['data']
                    
                    # Create download link
                    csv = df.to_csv(index=False)
                    st.download_button(
                        label=f"📥 Download {source_name.replace('_', ' ').title()} CSV",
                        data=csv,
                        file_name=f"{source_name}_{datetime.now().strftime('%Y%m%d')}.csv",
                        mime="text/csv",
                        key=f"download_{source_name}"
                    )
    
    else:
        st.info("👆 Click 'Refresh All Data' to load Miami area datasets")

if __name__ == "__main__":
    # Test the integration
    integration = WorkingDataIntegration()
    data = integration.get_comprehensive_data()
    print(f"Integration test results: {data['summary']}") 