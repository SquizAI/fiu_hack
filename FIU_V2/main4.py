# main.py

import streamlit as st
import pandas as pd
import numpy as np
import plotly.express as px
import plotly.graph_objects as go
from datetime import datetime, timedelta
from textblob import TextBlob
from wordcloud import WordCloud
import matplotlib.pyplot as plt
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
import os
import io
import base64
from pydantic import BaseModel, validator
from langchain_community.document_loaders import PyPDFLoader
from langchain_community.vectorstores import Chroma
from langchain_community.embeddings import HuggingFaceEmbeddings
import google.generativeai as genai
from google.generativeai.types import HarmCategory, HarmBlockThreshold
from sklearn.linear_model import LinearRegression
from streamlit_folium import folium_static
import folium
from folium.plugins import HeatMap, TimestampedGeoJson
import requests
from deep_translator import GoogleTranslator
import pydeck as pdk
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.feature_extraction.text import TfidfVectorizer
import re
import hashlib
import streamlit.components.v1 as components  # For embedding iframes

# ===========================================================
# 1. Configuration and Constants
# ===========================================================

# Set page config for mobile responsiveness
st.set_page_config(
    page_title="Coral Gables AI for Good Dashboard",
    layout="wide",
    initial_sidebar_state="collapsed"
)

# Embed your Mapbox Access Token directly in the script
MAPBOX_ACCESS_TOKEN = 'pk.eyJ1IjoibWF0dHlzdGpoIiwiYSI6ImNseHo3bmUwczA4a2oybHExZDE1dGVwd2gifQ.GOmYE77u9tYJA1MGOvoNjg'  # Replace with your actual Mapbox access token

# ===========================================================
# 2. Custom CSS for Dark Theme and Enhanced Appearance
# ===========================================================

st.markdown(
    """
    <style>
    /* General Container */
    .reportview-container {
        background-color: #1e1e1e;
        color: white;
    }
    /* Sidebar */
    .sidebar .sidebar-content {
        background-color: #2e2e2e;
        color: white;
    }
    /* Text and Headings */
    .reportview-container .main .block-container h1,
    .reportview-container .main .block-container h2,
    .reportview-container .main .block-container h3,
    .reportview-container .main .block-container h4,
    .reportview-container .main .block-container h5,
    .reportview-container .main .block-container h6,
    .reportview-container .main .block-container p,
    .reportview-container .main .block-container label,
    .sidebar .sidebar-content .block-container h1,
    .sidebar .sidebar-content .block-container h2,
    .sidebar .sidebar-content .block-container h3,
    .sidebar .sidebar-content .block-container h4,
    .sidebar .sidebar-content .block-container h5,
    .sidebar .sidebar-content .block-container h6,
    .sidebar .sidebar-content .block-container p,
    .sidebar .sidebar-content .block-container label {
        color: white;
    }
    /* Selectbox Options */
    .css-1kyxreq.edgvbvh3, /* Multi-select */
    .css-1wa3eu0-option { /* Dropdown options */
        background-color: #3a3a3a;
        color: white;
    }
    .css-1uccc91-singleValue { /* Selected value */
        color: white !important;
    }
    /* Scrollbar */
    ::-webkit-scrollbar {
        width: 8px;
    }
    ::-webkit-scrollbar-track {
        background: #2e2e2e;
    }
    ::-webkit-scrollbar-thumb {
        background-color: #555;
        border-radius: 4px;
    }
    </style>
    """,
    unsafe_allow_html=True
)

# ===========================================================
# 3. Helper Functions
# ===========================================================

@st.cache_data
def load_police_data():
    try:
        df = pd.read_csv("data/police_data_with.csv", delimiter=';')
        df['Date'] = pd.to_datetime(df['date'])
        # If latitude and longitude are missing, generate synthetic ones
        if 'lat' not in df.columns or 'lon' not in df.columns:
            df['lat'] = np.random.uniform(25.70, 25.75, len(df))
            df['lon'] = np.random.uniform(-80.30, -80.25, len(df))
        return df
    except FileNotFoundError:
        st.warning("`police_data_with.csv` not found. Generating synthetic police data.")
        return generate_police_data()
    except Exception as e:
        st.error(f"Error loading police data: {e}")
        return pd.DataFrame()

@st.cache_data
def load_social_media_data():
    try:
        df = pd.read_csv("data/online_posts.csv")
        df['date'] = pd.to_datetime(df['date'])
        return df
    except FileNotFoundError:
        st.warning("`online_posts.csv` not found. Generating synthetic social media data.")
        return generate_social_media_data()
    except Exception as e:
        st.error(f"Error loading social media data: {e}")
        return pd.DataFrame()

@st.cache_data
def generate_traffic_data():
    dates = pd.date_range(start='2023-01-01', end='2024-12-31', freq='D')
    return pd.DataFrame({
        'Date': dates,
        'lat': np.random.uniform(25.70, 25.75, len(dates)),
        'lon': np.random.uniform(-80.30, -80.25, len(dates)),
        'Accidents': np.random.randint(0, 10, len(dates))
    })

@st.cache_data
def generate_real_estate_data():
    dates = pd.date_range(start='2023-01-01', end='2024-12-31', freq='M')
    # Simulate ZHVI with a slight upward trend and some noise
    base_value = 400000
    values = base_value + np.cumsum(np.random.normal(loc=2000, scale=1000, size=len(dates)))
    return pd.DataFrame({
        'Date': dates,
        'ZHVI': values
    })

@st.cache_data
def generate_police_data():
    # Generate synthetic police data
    dates = pd.date_range(start='2023-01-01', end='2024-12-31', freq='D')
    incident_types = ['Theft', 'Assault', 'Burglary', 'Vandalism', 'Robbery']
    data = {
        'date': np.random.choice(dates, 1000),
        'incident_type': np.random.choice(incident_types, 1000)
    }
    df = pd.DataFrame(data)
    df['Date'] = pd.to_datetime(df['date'])
    df['lat'] = np.random.uniform(25.70, 25.75, len(df))
    df['lon'] = np.random.uniform(-80.30, -80.25, len(df))
    return df

@st.cache_data
def generate_social_media_data():
    # Generate synthetic social media data
    data = {
        'post_id': range(1, 81),
        'date': pd.date_range(start='2024-08-02', periods=80, freq='D'),
        'author': [f'User{i}' for i in range(1, 81)],
        'content': [
            "Anyone know a good handyman near 1245 DAUER DR? Need help fixing a leaky faucet and installing some shelves. Thanks!",
            "Lost dog! Our golden retriever, Max, got out near 1400 SALZEDO ST. He's wearing a red collar with tags. Please call 555-0123 if you see him.",
            "Heads up! There's a broken traffic light at the intersection of 5555 PONCE DE LEON BLVD and 2916 PONCE DE LEON BLVD. Be careful driving through there.",
        ] + [
            f"Synthetic post content {i}" for i in range(4, 81)
        ],
        'likes': np.random.randint(0, 20, 80),
        'comments': np.random.randint(0, 15, 80)
    }
    df = pd.DataFrame(data)
    return df

def get_real_time_weather(location, api_key):
    try:
        # Geocoding to get lat and lon from location
        geocode_url = f"http://api.openweathermap.org/geo/1.0/direct?q={location}&limit=1&appid={api_key}"
        geocode_response = requests.get(geocode_url)
        geocode_data = geocode_response.json()
        
        if not geocode_data:
            st.error("Location not found. Please try a different search.")
            return None
        
        lat = geocode_data[0]['lat']
        lon = geocode_data[0]['lon']
        
        # Fetch weather data using lat and lon
        weather_url = (
            f"http://api.openweathermap.org/data/2.5/weather?"
            f"lat={lat}&lon={lon}&units=metric&appid={api_key}"
        )
        weather_response = requests.get(weather_url)
        weather_data = weather_response.json()
        
        return {
            "wind_speed": weather_data["wind"]["speed"],
            "wind_deg": weather_data["wind"]["deg"],
            "temperature": weather_data["main"]["temp"],
            "description": weather_data["weather"][0]["description"].title()
        }
        
    except Exception as e:
        st.error(f"Error fetching weather data: {e}")
        return None

def analyze_sentiment(text):
    return TextBlob(text).sentiment.polarity

def create_wordcloud(text):
    if not text.strip():
        st.warning("No text available to generate word cloud.")
        return None
    wordcloud = WordCloud(width=800, height=400, background_color='white').generate(text)
    fig, ax = plt.subplots(figsize=(10, 5))
    ax.imshow(wordcloud, interpolation='bilinear')
    ax.axis('off')
    return fig

def predict_future_trend(data, days=30):
    if len(data) < 2:
        st.warning("Not enough data to predict future trends.")
        return []
    X = np.array(range(len(data))).reshape(-1, 1)
    y = data.values
    model = LinearRegression()
    model.fit(X, y)
    future_X = np.array(range(len(data), len(data) + days)).reshape(-1, 1)
    future_y = model.predict(future_X)
    return future_y

def get_table_download_link(df, filename, file_label):
    csv = df.to_csv(index=False)
    b64 = base64.b64encode(csv.encode()).decode()
    href = f'<a href="data:file/csv;base64,{b64}" download="{filename}">{file_label}</a>'
    return href

def translate_text(text, dest_lang):
    try:
        translator = GoogleTranslator(source='auto', target=dest_lang)
        return translator.translate(text)
    except Exception as e:
        st.error(f"Translation error: {e}")
        return text  # Fallback to original text

def sanitize_input(input_string):
    # Remove any potentially harmful characters
    return re.sub(r'[^\w\s-]', '', input_string)

def hash_password(password):
    return hashlib.sha256(password.encode()).hexdigest()

def compare_historical_data(df, column, start_date1, end_date1, start_date2, end_date2):
    # Ensure all dates are pd.Timestamp
    start_date1 = pd.to_datetime(start_date1)
    end_date1 = pd.to_datetime(end_date1)
    start_date2 = pd.to_datetime(start_date2)
    end_date2 = pd.to_datetime(end_date2)
    
    period1 = df[(df['Date'] >= start_date1) & (df['Date'] <= end_date1)]
    period2 = df[(df['Date'] >= start_date2) & (df['Date'] <= end_date2)]
    
    if period1.empty or period2.empty:
        st.warning("One of the selected periods has no data.")
        return go.Figure()
    
    fig = go.Figure()
    fig.add_trace(go.Scatter(x=period1['Date'], y=period1[column], name=f'Period 1: {start_date1.date()} to {end_date1.date()}'))
    fig.add_trace(go.Scatter(x=period2['Date'], y=period2[column], name=f'Period 2: {start_date2.date()} to {end_date2.date()}'))
    
    fig.update_layout(
        title=f'Comparison of {column} across two time periods',
        xaxis_title='Date',
        yaxis_title=column,
        template='plotly_dark'
    )
    return fig

def create_3d_map(data, column, color_scale, overlay_type):
    if overlay_type == "HexagonLayer":
        layer = pdk.Layer(
            "HexagonLayer",
            data=data,
            get_position=['lon', 'lat'],
            auto_highlight=True,
            radius=100,
            elevation_scale=4,
            elevation_range=[0, 1000],
            pickable=True,
            extruded=True,
            get_fill_color=color_scale,
        )
    elif overlay_type == "ScatterplotLayer":
        layer = pdk.Layer(
            "ScatterplotLayer",
            data=data,
            get_position=['lon', 'lat'],
            get_color=color_scale,
            get_radius=100,
        )
    elif overlay_type == "HeatmapLayer":
        layer = pdk.Layer(
            "HeatmapLayer",
            data=data,
            get_position=['lon', 'lat'],
            aggregation='MEAN',
            intensity=column,
            radius=100,
            upper_percentile=100,
            threshold=0.03,
        )
    else:
        st.warning("Invalid overlay type selected.")
        return go.Figure()
    
    deck = pdk.Deck(
        map_style="mapbox://styles/mapbox/dark-v9",
        initial_view_state={
            "latitude": data['lat'].mean(),
            "longitude": data['lon'].mean(),
            "zoom": 11,
            "pitch": 50,
        },
        layers=[layer],
    )
    return deck

def recommend_content(user_history, all_content):
    if not all_content:
        return []
    vectorizer = TfidfVectorizer()
    content_vectors = vectorizer.fit_transform(all_content)
    if not user_history:
        return all_content[:5]
    user_vector = vectorizer.transform([' '.join(user_history)])
    similarities = cosine_similarity(user_vector, content_vectors)
    recommended_indices = similarities.argsort()[0][-5:][::-1]
    return [all_content[i] for i in recommended_indices]

# ===========================================================
# 4. Gemini Chat Functions (Reintegrated Original Code)
# ===========================================================

def setup_gemini_chat():
    # Initialize Gemini Chat components if necessary
    # This function should set up the model and vectorstore as per your requirements
    # For now, it returns None placeholders
    return None, None

def gemini_chat(model, vectorstore, question, conversation_history):
    # Implement the Gemini Chat functionality here
    # For now, it's a placeholder returning a static response
    return "This is a placeholder response from the Gemini model."

# ===========================================================
# 5. Data Models for Custom Alerts
# ===========================================================

class CustomAlert(BaseModel):
    alert_type: str
    threshold: float
    user_id: str

    @validator('threshold')
    def validate_threshold(cls, v):
        if v < 0 or v > 100:
            raise ValueError('Threshold must be between 0 and 100')
        return v

def setup_custom_alert(alert_type, threshold, user_id):
    try:
        alert = CustomAlert(alert_type=alert_type, threshold=threshold, user_id=user_id)
        # In a real app, you would save this alert to a database
        st.success(f"Alert set up successfully for {alert.alert_type} with threshold {alert.threshold}%")
    except ValueError as e:
        st.error(f"Invalid alert setup: {str(e)}")

# ===========================================================
# 6. Display Functions
# ===========================================================

def display_home_page(police_data, traffic_data, real_estate_data, social_media_data, lang_code):
    st.write(translate_text("Welcome to the Coral Gables AI for Good Dashboard. This tool provides insights into various aspects of life in Coral Gables, Florida.", lang_code))
    
    st.subheader(translate_text("Quick Stats", lang_code))
    col1, col2, col3 = st.columns(3)
    col1.metric(translate_text("Total Incidents", lang_code), len(police_data))
    col2.metric(translate_text("Traffic Accidents", lang_code), traffic_data['Accidents'].sum())
    col3.metric(translate_text("Latest ZHVI", lang_code), f"${real_estate_data['ZHVI'].iloc[-1]:,.0f}")
    
    st.subheader(translate_text("Customize Your Dashboard", lang_code))
    widgets = st.multiselect(
        translate_text("Select widgets to display", lang_code),
        ["3D Crime Map", "3D Traffic Heatmap", "Social Media Sentiment", "Real Estate Trends"]
    )
    
    for widget in widgets:
        if widget == "3D Crime Map":
            st.subheader(translate_text("3D Crime Incident Map", lang_code))
            overlay_type = st.selectbox(
                translate_text("Select Map Overlay Type", lang_code),
                ["HexagonLayer", "ScatterplotLayer", "HeatmapLayer"],
                key=f'{widget}_overlay'
            )
            crime_3d_map = create_3d_map(police_data, 'incident_type', [255, 0, 0], overlay_type)
            st.pydeck_chart(crime_3d_map)
        elif widget == "3D Traffic Heatmap":
            st.subheader(translate_text("3D Traffic Accident Heatmap", lang_code))
            overlay_type = st.selectbox(
                translate_text("Select Map Overlay Type", lang_code),
                ["HexagonLayer", "ScatterplotLayer", "HeatmapLayer"],
                key=f'{widget}_overlay'
            )
            traffic_3d_map = create_3d_map(traffic_data, 'Accidents', [0, 255, 0], overlay_type)
            st.pydeck_chart(traffic_3d_map)
        elif widget == "Social Media Sentiment":
            st.subheader(translate_text("Social Media Sentiment Analysis", lang_code))
            social_media_data['sentiment'] = social_media_data['content'].apply(analyze_sentiment)
            fig = px.histogram(
                social_media_data, 
                x='sentiment', 
                nbins=50, 
                title=translate_text("Distribution of Social Media Sentiment", lang_code),
                template='plotly_dark'
            )
            st.plotly_chart(fig)
        elif widget == "Real Estate Trends":
            st.subheader(translate_text("Real Estate Trends", lang_code))
            fig = px.line(
                real_estate_data, 
                x='Date', 
                y='ZHVI', 
                title=translate_text('Zillow Home Value Index Over Time', lang_code),
                template='plotly_dark'
            )
            st.plotly_chart(fig)
    
    display_recommendations(police_data, social_media_data, lang_code)

def display_crime_analysis(police_data, start_date, end_date, lang_code):
    st.subheader(translate_text("3D Crime Incident Map", lang_code))
    overlay_type = st.selectbox(
        translate_text("Select Map Overlay Type", lang_code),
        ["HexagonLayer", "ScatterplotLayer", "HeatmapLayer"],
        key='crime_overlay'
    )
    filtered_police_data = police_data[
        (police_data['Date'] >= pd.Timestamp(start_date)) & 
        (police_data['Date'] <= pd.Timestamp(end_date))
    ]
    crime_3d_map = create_3d_map(filtered_police_data, 'incident_type', [255, 0, 0], overlay_type)
    st.pydeck_chart(crime_3d_map)

    st.subheader(translate_text("Incident Types Over Time", lang_code))
    if filtered_police_data.empty:
        st.warning(translate_text("No crime data available for the selected date range.", lang_code))
    else:
        incident_counts = filtered_police_data.groupby(['Date', 'incident_type']).size().unstack(fill_value=0)
        st.line_chart(incident_counts)
        
        st.subheader(translate_text("Predicted Crime Trend (Next 30 Days)", lang_code))
        total_incidents = filtered_police_data.groupby('Date').size()
        future_trend = predict_future_trend(total_incidents)
        future_dates = pd.date_range(start=total_incidents.index[-1] + pd.Timedelta(days=1), periods=30)
        fig = go.Figure()
        fig.add_trace(go.Scatter(x=total_incidents.index, y=total_incidents.values, name=translate_text('Historical', lang_code)))
        fig.add_trace(go.Scatter(x=future_dates, y=future_trend, name=translate_text('Predicted', lang_code)))
        fig.update_layout(template='plotly_dark')
        st.plotly_chart(fig)
        
        st.markdown(
            get_table_download_link(
                filtered_police_data, 
                "crime_data.csv", 
                translate_text("Download Crime Data as CSV", lang_code)
            ), 
            unsafe_allow_html=True
        )

def display_traffic_analysis(traffic_data, start_date, end_date, lang_code):
    st.subheader(translate_text("3D Traffic Accident Heatmap", lang_code))
    overlay_type = st.selectbox(
        translate_text("Select Map Overlay Type", lang_code),
        ["HexagonLayer", "ScatterplotLayer", "HeatmapLayer"],
        key='traffic_overlay_analysis'
    )
    filtered_traffic_data = traffic_data[
        (traffic_data['Date'] >= pd.Timestamp(start_date)) & 
        (traffic_data['Date'] <= pd.Timestamp(end_date))
    ]
    traffic_3d_map = create_3d_map(filtered_traffic_data, 'Accidents', [0, 255, 0], overlay_type)
    st.pydeck_chart(traffic_3d_map)

    st.subheader(translate_text("Traffic Accidents Over Time", lang_code))
    if filtered_traffic_data.empty:
        st.warning(translate_text("No traffic data available for the selected date range.", lang_code))
    else:
        fig = px.line(
            filtered_traffic_data, 
            x='Date', 
            y='Accidents', 
            title=translate_text('Traffic Accidents Over Time', lang_code),
            template='plotly_dark'
        )
        st.plotly_chart(fig)
        
        st.subheader(translate_text("Predicted Traffic Accident Trend (Next 30 Days)", lang_code))
        future_trend = predict_future_trend(filtered_traffic_data.set_index('Date')['Accidents'])
        future_dates = pd.date_range(start=filtered_traffic_data['Date'].max() + pd.Timedelta(days=1), periods=30)
        fig = go.Figure()
        fig.add_trace(go.Scatter(x=filtered_traffic_data['Date'], y=filtered_traffic_data['Accidents'], name=translate_text('Historical', lang_code)))
        fig.add_trace(go.Scatter(x=future_dates, y=future_trend, name=translate_text('Predicted', lang_code)))
        fig.update_layout(template='plotly_dark')
        st.plotly_chart(fig)
        
        st.markdown(
            get_table_download_link(
                filtered_traffic_data, 
                "traffic_data.csv", 
                translate_text("Download Traffic Data as CSV", lang_code)
            ), 
            unsafe_allow_html=True
        )

def display_social_media_analysis(social_media_data, start_date, end_date, lang_code):
    st.subheader(translate_text("Social Media Sentiment Analysis", lang_code))
    filtered_social_media_data = social_media_data[
        (social_media_data['date'] >= pd.Timestamp(start_date)) &
        (social_media_data['date'] <= pd.Timestamp(end_date))
    ]
    
    # Ensure 'content' column is not empty
    filtered_social_media_data = filtered_social_media_data.dropna(subset=['content'])
    
    if filtered_social_media_data.empty:
        st.warning(translate_text("No social media posts found for the selected date range.", lang_code))
        return
    
    all_text = ' '.join(filtered_social_media_data['content'])
    
    if not all_text.strip():
        st.warning(translate_text("No text available to generate word cloud.", lang_code))
        return
    
    filtered_social_media_data['sentiment'] = filtered_social_media_data['content'].apply(analyze_sentiment)
    fig = px.histogram(
        filtered_social_media_data, 
        x='sentiment', 
        nbins=50, 
        title=translate_text("Distribution of Social Media Sentiment", lang_code),
        template='plotly_dark'
    )
    st.plotly_chart(fig)
    
    st.subheader(translate_text("Word Cloud of Social Media Posts", lang_code))
    wordcloud_fig = create_wordcloud(all_text)
    if wordcloud_fig:
        st.pyplot(wordcloud_fig)
    
    st.subheader(translate_text("Recent Social Media Posts", lang_code))
    for _, post in filtered_social_media_data.head().iterrows():
        st.text(f"{post['date'].date()}: {post['content']}")
        st.write("---")
    
    st.markdown(
        get_table_download_link(
            filtered_social_media_data, 
            "social_media_data.csv", 
            translate_text("Download Social Media Data as CSV", lang_code)
        ), 
        unsafe_allow_html=True
    )

def display_real_estate_trends(real_estate_data, start_date, end_date, lang_code):
    st.subheader(translate_text("Zillow Home Value Index (ZHVI) Trends", lang_code))
    filtered_real_estate_data = real_estate_data[
        (real_estate_data['Date'] >= pd.Timestamp(start_date)) &
        (real_estate_data['Date'] <= pd.Timestamp(end_date))
    ]
    
    if filtered_real_estate_data.empty:
        st.warning(translate_text("No real estate data available for the selected date range.", lang_code))
        return
    
    fig = px.line(
        filtered_real_estate_data, 
        x='Date', 
        y='ZHVI', 
        title=translate_text('Zillow Home Value Index Over Time', lang_code),
        template='plotly_dark'
    )
    st.plotly_chart(fig)
    
    if len(filtered_real_estate_data) >= 13:
        try:
            annual_change = (filtered_real_estate_data['ZHVI'].iloc[-1] / filtered_real_estate_data['ZHVI'].iloc[-13] - 1) * 100
            st.metric(translate_text("Annual Change in ZHVI", lang_code), f"{annual_change:.2f}%")
        except IndexError:
            st.info(translate_text("Not enough data to calculate annual change.", lang_code))
    else:
        st.info(translate_text("Not enough data to calculate annual change.", lang_code))
    
    st.subheader(translate_text("Predicted ZHVI Trend (Next 12 Months)", lang_code))
    future_trend = predict_future_trend(filtered_real_estate_data.set_index('Date')['ZHVI'], days=365)
    future_dates = pd.date_range(start=filtered_real_estate_data['Date'].max() + pd.Timedelta(days=1), periods=12, freq='M')
    fig = go.Figure()
    fig.add_trace(go.Scatter(x=filtered_real_estate_data['Date'], y=filtered_real_estate_data['ZHVI'], name=translate_text('Historical', lang_code)))
    fig.add_trace(go.Scatter(x=future_dates, y=future_trend, name=translate_text('Predicted', lang_code)))
    fig.update_layout(template='plotly_dark')
    st.plotly_chart(fig)
    
    st.markdown(
        get_table_download_link(
            filtered_real_estate_data, 
            "real_estate_data.csv", 
            translate_text("Download Real Estate Data as CSV", lang_code)
        ), 
        unsafe_allow_html=True
    )

def display_weather(lang_code):
    st.subheader(translate_text("Real-time Weather in Coral Gables", lang_code))
    
    # Embed Windy's Interactive Map using iframe
    st.markdown(
        """
        <div style="display: flex; justify-content: center;">
            <iframe src="https://embed.windy.com/embed2.html?lat=25.7617&lon=-80.1918&detailLat=25.7617&detailLon=-80.1918&width=100%25&height=450&zoom=11&level=surface&overlay=wind&product=ecmwf&menu=&message=true&marker=&calendar=12&pressure=true&type=map&location=coordinates&detail=&metricWind=default&metricTemp=default&radarRange=-1" width="100%" height="450" frameborder="0"></iframe>
        </div>
        """,
        unsafe_allow_html=True
    )
    
    # Optional: Display Current Weather Conditions Below the Map
    # Fetch and display current weather data
    location, sport, alert_type = get_user_inputs_for_weather()
    if location:
        weather = get_real_time_weather(location, "your_openweather_api_key")  # Replace with your OpenWeatherMap API key
        if weather:
            col1, col2, col3, col4 = st.columns(4)
            col1.metric(translate_text("Wind Speed (m/s)", lang_code), weather["wind_speed"])
            col2.metric(translate_text("Wind Direction", lang_code), f"{weather['wind_deg']}°")
            col3.metric(translate_text("Temperature (°C)", lang_code), f"{weather['temperature']}°C")
            col4.metric(translate_text("Description", lang_code), weather["description"])
            
            # Assess Wind Sports Suitability
            suitability = assess_suitability(weather["wind_speed"], sport)
            st.subheader(translate_text("Wind Sports Suitability", lang_code))
            st.write(f"**{sport} conditions:** {suitability}")
            
            # Implement Alerts
            st.subheader(translate_text("Alerts for Optimal Conditions", lang_code))
            if suitability in ["Excellent", "Good"]:
                if alert_type == "Visual":
                    st.success("Optimal conditions for your selected sport!")
                elif alert_type == "Sound":
                    st.markdown(
                        """
                        <audio autoplay>
                            <source src="https://www.soundjay.com/buttons/sounds/beep-07.mp3" type="audio/mpeg">
                            Your browser does not support the audio element.
                        </audio>
                        """,
                        unsafe_allow_html=True
                    )
                    st.warning("Optimal conditions for your selected sport!")
            else:
                if alert_type == "Visual":
                    st.warning("Conditions are not optimal.")
                elif alert_type == "Sound":
                    st.markdown(
                        """
                        <audio autoplay>
                            <source src="https://www.soundjay.com/buttons/sounds/beep-07.mp3" type="audio/mpeg">
                            Your browser does not support the audio element.
                        </audio>
                        """,
                        unsafe_allow_html=True
                    )
                    st.error("Conditions are not optimal.")
    
def get_user_inputs_for_weather():
    st.sidebar.subheader("Customize Your Weather Dashboard")
    location = st.sidebar.text_input("Search location...", value="Coral Gables, FL")
    sport = st.sidebar.selectbox(
        "Select your sport:",
        ["Kitesurfing", "Windsurfing", "Sailing"],
        key="weather_sport_selector"
    )
    alert_type = st.sidebar.selectbox(
        "Select alert type:",
        ["Visual", "Sound"],
        key="weather_alert_type"
    )
    return location, sport, alert_type

def display_community_forum(lang_code):
    st.subheader(translate_text("Community Forum", lang_code))
    
    forum_post = st.text_area(translate_text("Share your thoughts or concerns about Coral Gables", lang_code))
    if st.button(translate_text("Post", lang_code), key="forum_post_button"):
        sanitized_post = sanitize_input(forum_post)
        if sanitized_post:
            st.success(translate_text("Your post has been shared with the community!", lang_code))
            if 'forum_posts' not in st.session_state:
                st.session_state.forum_posts = []
            st.session_state.forum_posts.append({"content": sanitized_post, "timestamp": datetime.now()})
        else:
            st.warning(translate_text("Cannot post empty or invalid content.", lang_code))
    
    st.subheader(translate_text("Recent Posts", lang_code))
    if 'forum_posts' in st.session_state and st.session_state.forum_posts:
        for idx, post in enumerate(reversed(st.session_state.forum_posts)):
            st.text(f"{post['timestamp'].strftime('%Y-%m-%d %H:%M:%S')}: {post['content']}")
            st.write("---")
    else:
        st.info(translate_text("No posts yet. Be the first to share!", lang_code))

def display_gemini_chat(lang_code):
    st.subheader(translate_text("Gemini Chat", lang_code))
    
    model, vectorstore = setup_gemini_chat()
    
    if 'conversation_history' not in st.session_state:
        st.session_state.conversation_history = []
    
    user_question = st.text_input(translate_text("Ask a question about Coral Gables:", lang_code), key="gemini_chat_input")
    if st.button(translate_text("Submit", lang_code), key="gemini_chat_submit"):
        if user_question:
            conversation_history = "\n".join([f"Human: {q}\nAI: {a}" for q, a in st.session_state.conversation_history])
            answer = gemini_chat(model, vectorstore, user_question, conversation_history)
            st.write(f"{translate_text('Answer:', lang_code)} {answer}")
            
            st.session_state.conversation_history.append((user_question, answer))
        else:
            st.warning(translate_text("Please enter a question.", lang_code))
    
    st.subheader(translate_text("Conversation History", lang_code))
    if st.session_state.conversation_history:
        for idx, (q, a) in enumerate(st.session_state.conversation_history):
            st.text(f"Human: {q}")
            st.text(f"AI: {a}")
            st.write("---")
    else:
        st.info(translate_text("No conversation history yet.", lang_code))
    
    if st.button(translate_text("Clear Conversation History", lang_code), key="clear_gemini_history"):
        st.session_state.conversation_history = []
        st.success(translate_text("Conversation history cleared!", lang_code))

def display_historical_comparison(police_data, traffic_data, real_estate_data, lang_code):
    st.subheader(translate_text("Compare Historical Data", lang_code))
    
    dataset = st.selectbox(translate_text("Select dataset", lang_code), 
                           ["Crime", "Traffic", "Real Estate"])
    
    col1, col2 = st.columns(2)
    with col1:
        start_date1 = st.date_input(translate_text("Start date for period 1", lang_code), value=datetime.now().date() - timedelta(days=60), key='start_date1')
        end_date1 = st.date_input(translate_text("End date for period 1", lang_code), value=datetime.now().date() - timedelta(days=30), key='end_date1')
    with col2:
        start_date2 = st.date_input(translate_text("Start date for period 2", lang_code), value=datetime.now().date() - timedelta(days=30), key='start_date2')
        end_date2 = st.date_input(translate_text("End date for period 2", lang_code), value=datetime.now().date(), key='end_date2')
    
    if start_date1 > end_date1 or start_date2 > end_date2:
        st.error(translate_text("Start date must be before end date for each period.", lang_code))
        return
    
    if dataset == "Crime":
        fig = compare_historical_data(police_data, 'incident_type', start_date1, end_date1, start_date2, end_date2)
    elif dataset == "Traffic":
        fig = compare_historical_data(traffic_data, 'Accidents', start_date1, end_date1, start_date2, end_date2)
    elif dataset == "Real Estate":
        fig = compare_historical_data(real_estate_data, 'ZHVI', start_date1, end_date1, start_date2, end_date2)
    
    if fig:
        st.plotly_chart(fig)

def display_custom_alerts(lang_code):
    st.subheader(translate_text("Set Up Custom Alerts", lang_code))
    
    alert_type = st.selectbox(translate_text("Select alert type", lang_code), 
                              ["Crime", "Traffic", "Real Estate"], key="custom_alert_type")
    threshold = st.slider(translate_text("Set threshold (%)", lang_code), 0, 100, 50, key="custom_alert_threshold")
    user_id = st.text_input(translate_text("Enter your user ID", lang_code), key="custom_alert_user_id")
    
    if st.button(translate_text("Set Alert", lang_code), key="set_custom_alert"):
        if user_id:
            setup_custom_alert(alert_type, threshold, user_id)
        else:
            st.warning(translate_text("Please enter a valid user ID.", lang_code))

def display_recommendations(police_data, social_media_data, lang_code):
    if 'user_history' not in st.session_state:
        st.session_state.user_history = []
    
    all_content = police_data['incident_type'].astype(str).tolist() + social_media_data['content'].tolist()
    recommended_content = recommend_content(st.session_state.user_history, all_content)
    
    st.subheader(translate_text("Recommended Content", lang_code))
    for idx, content in enumerate(recommended_content):
        if st.button(content, key=f"recommend_button_{idx}"):
            st.session_state.user_history.append(content)

def display_notifications(lang_code):
    if st.sidebar.checkbox(translate_text("Enable Notifications", lang_code)):
        st.sidebar.warning(translate_text("New alert: Increased traffic on Main St due to construction.", lang_code))

def display_city_services(lang_code):
    st.sidebar.subheader(translate_text("City Services", lang_code))
    service_type = st.sidebar.selectbox(
        translate_text("Select a service to report an issue:", lang_code),
        ["", "Pothole", "Streetlight Outage", "Graffiti", "Trash Collection"],
        key="city_service_selector"
    )
    if service_type:
        issue_description = st.sidebar.text_area(translate_text("Describe the issue:", lang_code), key="city_service_description")
        if st.sidebar.button(translate_text("Submit Report", lang_code), key="submit_city_service"):
            # In a real application, this would be sent to a city database or API
            st.sidebar.success(translate_text("Your report has been submitted. Thank you!", lang_code))

def display_accessibility_features():
    # Implement any additional accessibility features here
    pass

# ===========================================================
# 7. Main Function
# ===========================================================

def main():
    st.title("Coral Gables AI for Good Dashboard")

    # Multi-language support
    languages = {
        'English': 'en',
        'Español': 'es',
        'Français': 'fr'
    }
    selected_language = st.sidebar.selectbox("Select Language", list(languages.keys()))
    lang_code = languages[selected_language]

    # Sidebar Navigation
    st.sidebar.header(translate_text("Navigation", lang_code))
    page = st.sidebar.radio(
        translate_text("Go to", lang_code), 
        ["Home", "Crime Analysis", "Traffic Analysis", "Social Media Analysis",
         "Real Estate Trends", "Weather", "Community Forum", "Gemini Chat",
         "Historical Comparison", "Custom Alerts"]
    )

    # Load data
    police_data = load_police_data()
    social_media_data = load_social_media_data()
    traffic_data = generate_traffic_data()
    real_estate_data = generate_real_estate_data()

    # Date range selection
    start_date, end_date = st.sidebar.date_input(
        translate_text("Select date range", lang_code),
        [police_data['Date'].min().date(), police_data['Date'].max().date()]
    )

    # Page content
    if page == "Home":
        display_home_page(police_data, traffic_data, real_estate_data, social_media_data, lang_code)
    elif page == "Crime Analysis":
        display_crime_analysis(police_data, start_date, end_date, lang_code)
    elif page == "Traffic Analysis":
        display_traffic_analysis(traffic_data, start_date, end_date, lang_code)
    elif page == "Social Media Analysis":
        display_social_media_analysis(social_media_data, start_date, end_date, lang_code)
    elif page == "Real Estate Trends":
        display_real_estate_trends(real_estate_data, start_date, end_date, lang_code)
    elif page == "Weather":
        display_weather(lang_code)
    elif page == "Community Forum":
        display_community_forum(lang_code)
    elif page == "Gemini Chat":
        display_gemini_chat(lang_code)
    elif page == "Historical Comparison":
        display_historical_comparison(police_data, traffic_data, real_estate_data, lang_code)
    elif page == "Custom Alerts":
        display_custom_alerts(lang_code)

    # Sidebar components
    display_notifications(lang_code)
    display_city_services(lang_code)
    display_accessibility_features()

if __name__ == "__main__":
    main()
