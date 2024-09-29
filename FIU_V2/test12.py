import os
import streamlit as st
import pandas as pd
import numpy as np
import pydeck as pdk
from datetime import datetime, timedelta
import requests
from census import Census
from us import states
from newsapi import NewsApiClient
from textblob import TextBlob
from wordcloud import WordCloud
import matplotlib.pyplot as plt

# Set page config
st.set_page_config(page_title="Coral Gables AI for Good Dashboard", layout="wide")

# API Keys
NEWSAPI_KEY = os.environ["NEWSAPI_KEY"]
CENSUS_API_KEY = os.environ["CENSUS_API_KEY"]

# Initialize API clients
newsapi = NewsApiClient(api_key=NEWSAPI_KEY)

# Load Data
@st.cache_data
def load_police_data():
    df = pd.read_csv("data/final_complete_police_incidents_data.csv")
    df['Date'] = pd.to_datetime(df['Date'])
    df['lat'] = np.random.uniform(25.70, 25.75, len(df))
    df['lon'] = np.random.uniform(-80.30, -80.25, len(df))
    return df

@st.cache_data
def load_social_media_data():
    df = pd.read_csv("data/synthetic-social-media-posts.csv")
    df['date'] = pd.to_datetime(df['date'])
    return df

police_data = load_police_data()
social_media_data = load_social_media_data()

# Get Census Data
@st.cache_data
def get_census_data():
    c = Census(CENSUS_API_KEY)
    coral_gables_data = c.acs5.state_place(
        ('NAME', 'B01003_001E', 'B19013_001E', 'B15003_022E'),
        states.FL.fips, '14125'
    )
    return pd.DataFrame(coral_gables_data)

census_data = get_census_data()

# Get News Articles
@st.cache_data
def get_news_articles():
    articles = newsapi.get_everything(q='Coral Gables', language='en', sort_by='publishedAt', page_size=50)
    return pd.DataFrame(articles['articles'])

news_articles = get_news_articles()

# Advanced Data Analysis Functions
def analyze_sentiment(text):
    return TextBlob(text).sentiment.polarity

# DeckGL Visualization Functions
def create_scatterplot_layer():
    return pdk.Layer(
        "ScatterplotLayer",
        data=police_data,
        get_position=['lon', 'lat'],
        get_color=[200, 30, 0, 160],
        get_radius=50,
        pickable=True,
        opacity=0.8,
        stroked=True,
        filled=True,
        radius_scale=6,
        radius_min_pixels=1,
        radius_max_pixels=100,
        line_width_min_pixels=1,
    )

def create_heatmap_layer():
    return pdk.Layer(
        "HeatmapLayer",
        data=police_data,
        get_position=['lon', 'lat'],
        get_weight='weight',
        radiusPixels=60,
        opacity=0.9,
        aggregation=pdk.types.String("SUM"),
    )

def create_hexagon_layer():
    return pdk.Layer(
        "HexagonLayer",
        data=police_data,
        get_position=['lon', 'lat'],
        radius=200,
        elevation_scale=4,
        elevation_range=[0, 1000],
        pickable=True,
        extruded=True,
    )

def create_text_layer():
    return pdk.Layer(
        "TextLayer",
        data=police_data,
        get_position=['lon', 'lat'],
        getText='Incident Type',
        getSize=15,
        getAngle=0,
        getTextAnchor='middle',
        getAlignmentBaseline='center',
    )

def create_arc_layer():
    return pdk.Layer(
        "ArcLayer",
        data=police_data,
        get_source_position=['lon', 'lat'],
        get_target_position=['-80.2785', '25.7216'],  # Center of Coral Gables
        get_source_color=[255, 0, 0, 255],
        get_target_color=[0, 255, 0, 255],
        get_width=2,
    )

# Streamlit App
def main():
    st.title("Coral Gables AI for Good Dashboard")

    # Sidebar
    st.sidebar.header("Navigation")
    page = st.sidebar.radio("Go to", ["Home", "Advanced Crime Mapping", "News and Social Media"])

    if page == "Home":
        st.write("Welcome to the advanced Coral Gables AI for Good Dashboard. This tool provides deep insights into crime, news, and social media for Coral Gables, Florida.")
        
        st.subheader("Quick Stats")
        col1, col2, col3 = st.columns(3)
        col1.metric("Total Incidents", len(police_data))
        col2.metric("Unique Incident Types", police_data['Incident Type'].nunique())
        col3.metric("Date Range", f"{police_data['Date'].min().date()} to {police_data['Date'].max().date()}")
        
        st.subheader("Census Data Insights")
        total_population = int(census_data['B01003_001E'].values[0])
        median_income = int(census_data['B19013_001E'].values[0])
        bachelors_degree = int(census_data['B15003_022E'].values[0])
        
        st.write(f"Coral Gables has a population of {total_population} with a median income of ${median_income}.")
        st.write(f"Approximately {bachelors_degree / total_population:.2%} of the population has a bachelor's degree or higher.")

    elif page == "Advanced Crime Mapping":
        st.subheader("Interactive Crime Map")
        
        map_type = st.selectbox("Select Map Type", ["Scatterplot", "Heatmap", "Hexagon", "Text", "Arc"])
        
        if map_type == "Scatterplot":
            layer = create_scatterplot_layer()
        elif map_type == "Heatmap":
            layer = create_heatmap_layer()
        elif map_type == "Hexagon":
            layer = create_hexagon_layer()
        elif map_type == "Text":
            layer = create_text_layer()
        else:
            layer = create_arc_layer()

        view_state = pdk.ViewState(
            latitude=25.72,
            longitude=-80.27,
            zoom=12,
            pitch=50,
        )

        r = pdk.Deck(
            layers=[layer],
            initial_view_state=view_state,
            map_style="mapbox://styles/mapbox/light-v9",
        )

        st.pydeck_chart(r)

        st.subheader("Incident Types Over Time")
        incident_counts = police_data.groupby(['Date', 'Incident Type']).size().unstack(fill_value=0)
        st.line_chart(incident_counts)

    elif page == "News and Social Media":
        st.subheader("News Sentiment Analysis")
        news_articles['sentiment'] = news_articles['description'].apply(analyze_sentiment)
        fig, ax = plt.subplots()
        ax.hist(news_articles['sentiment'], bins=50)
        ax.set_title("Distribution of News Sentiment")
        ax.set_xlabel("Sentiment")
        ax.set_ylabel("Count")
        st.pyplot(fig)

        st.subheader("Top News Keywords")
        all_text = ' '.join(news_articles['description'].dropna())
        wordcloud = WordCloud(width=800, height=400, background_color='white').generate(all_text)
        fig, ax = plt.subplots(figsize=(10, 5))
        ax.imshow(wordcloud, interpolation='bilinear')
        ax.axis('off')
        st.pyplot(fig)

        st.subheader("Social Media Activity")
        social_activity = social_media_data.groupby('date').size().reset_index(name='count')
        st.line_chart(social_activity.set_index('date'))

        st.subheader("Top Social Media Topics")
        all_social_text = ' '.join(social_media_data['content'].dropna())
        wordcloud = WordCloud(width=800, height=400, background_color='white').generate(all_social_text)
        fig, ax = plt.subplots(figsize=(10, 5))
        ax.imshow(wordcloud, interpolation='bilinear')
        ax.axis('off')
        st.pyplot(fig)

if __name__ == "__main__":
    main()