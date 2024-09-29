import os
import streamlit as st
import pandas as pd
import numpy as np
import plotly.express as px
import plotly.graph_objects as go
import pydeck as pdk
from datetime import datetime, timedelta
import requests
from census import Census
from us import states
from newsapi import NewsApiClient
from textblob import TextBlob
from wordcloud import WordCloud
import matplotlib.pyplot as plt
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler

# Set page config
st.set_page_config(page_title="Coral Gables AI for Good Dashboard", layout="wide")

# API Keys
NEWSAPI_KEY = os.environ["NEWSAPI_KEY"]
CENSUS_API_KEY = os.environ["CENSUS_API_KEY"]
EPA_AIRNOW_API_KEY = os.environ["EPA_AIRNOW_API_KEY"]

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

# Get Air Quality Data
@st.cache_data
def get_air_quality_data():
    url = f"http://www.airnowapi.org/aq/observation/zipCode/current/?format=application/json&zipCode=33146&distance=25&API_KEY={EPA_AIRNOW_API_KEY}"
    response = requests.get(url)
    return pd.DataFrame(response.json())

air_quality_data = get_air_quality_data()

# Get News Articles
@st.cache_data
def get_news_articles():
    articles = newsapi.get_everything(q='Coral Gables', language='en', sort_by='publishedAt', page_size=50)
    return pd.DataFrame(articles['articles'])

news_articles = get_news_articles()

# Advanced Data Analysis Functions
def perform_kmeans_clustering(data, n_clusters=5):
    scaler = StandardScaler()
    scaled_data = scaler.fit_transform(data[['lat', 'lon']])
    kmeans = KMeans(n_clusters=n_clusters, random_state=42)
    data['Cluster'] = kmeans.fit_predict(scaled_data)
    return data, kmeans.cluster_centers_

def analyze_sentiment(text):
    return TextBlob(text).sentiment.polarity

# Visualization Functions
def create_3d_scatter_plot():
    fig = go.Figure(data=[go.Scatter3d(
        x=police_data['lon'],
        y=police_data['lat'],
        z=police_data['Date'].astype(int) / 10**9,
        mode='markers',
        marker=dict(
            size=5,
            color=police_data['Date'].astype(int),
            colorscale='Viridis',
            opacity=0.8
        ),
        text=police_data['Incident Type'],
        hoverinfo='text'
    )])
    fig.update_layout(scene=dict(zaxis=dict(title='Time')))
    return fig

def create_incident_heatmap():
    incident_pivot = pd.pivot_table(police_data, values='Date', index='Incident Type', 
                                    columns=police_data['Date'].dt.date, aggfunc='count', fill_value=0)
    fig = px.imshow(incident_pivot, aspect="auto", title="Incident Heatmap Over Time")
    fig.update_xaxes(title="Date")
    fig.update_yaxes(title="Incident Type")
    return fig

def create_wordcloud(text):
    wordcloud = WordCloud(width=800, height=400, background_color='white').generate(text)
    fig, ax = plt.subplots(figsize=(10, 5))
    ax.imshow(wordcloud, interpolation='bilinear')
    ax.axis('off')
    return fig

# Streamlit App
def main():
    st.title("Coral Gables AI for Good Dashboard")

    # Sidebar
    st.sidebar.header("Navigation")
    page = st.sidebar.radio("Go to", ["Home", "Crime Analysis", "Environmental Data", "News and Social Media", "Predictive Analytics"])

    if page == "Home":
        st.write("Welcome to the advanced Coral Gables AI for Good Dashboard. This tool provides deep insights into crime, environmental data, news, and social media for Coral Gables, Florida.")
        
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

        st.plotly_chart(px.bar(census_data.melt(id_vars=['NAME']), x='variable', y='value', title="Census Data Overview"))

    elif page == "Crime Analysis":
        st.subheader("3D Crime Incident Visualization")
        st.plotly_chart(create_3d_scatter_plot())

        st.subheader("Crime Incident Heatmap")
        st.plotly_chart(create_incident_heatmap())

        st.subheader("Crime Hotspot Analysis")
        clustered_data, centers = perform_kmeans_clustering(police_data)
        fig = px.scatter_mapbox(clustered_data, lat="lat", lon="lon", color="Cluster", 
                                zoom=11, height=600, size_max=15, mapbox_style="carto-positron")
        fig.add_trace(go.Scattermapbox(lat=centers[:, 1], lon=centers[:, 0], mode='markers', 
                                       marker=go.scattermapbox.Marker(size=15, color='red'), name='Cluster Centers'))
        st.plotly_chart(fig)

    elif page == "Environmental Data":
        st.subheader("Air Quality Analysis")
        if not air_quality_data.empty:
            fig = px.bar(air_quality_data, x='ParameterName', y='AQI', color='Category', 
                         title="Air Quality Index by Parameter")
            st.plotly_chart(fig)

            st.write("Air Quality Categories:")
            for _, row in air_quality_data.iterrows():
                st.write(f"- {row['ParameterName']}: {row['Category']} (AQI: {row['AQI']})")
        else:
            st.warning("Air quality data is not available.")

    elif page == "News and Social Media":
        st.subheader("News Sentiment Analysis")
        news_articles['sentiment'] = news_articles['description'].apply(analyze_sentiment)
        fig = px.histogram(news_articles, x='sentiment', nbins=50, title="Distribution of News Sentiment")
        st.plotly_chart(fig)

        st.subheader("Top News Keywords")
        all_text = ' '.join(news_articles['description'].dropna())
        st.pyplot(create_wordcloud(all_text))

        st.subheader("Social Media Activity")
        fig_social = px.line(social_media_data.groupby('date').size().reset_index(name='count'),
                             x='date', y='count', title='Social Media Posts Over Time')
        st.plotly_chart(fig_social)

        st.subheader("Top Social Media Topics")
        all_social_text = ' '.join(social_media_data['content'].dropna())
        st.pyplot(create_wordcloud(all_social_text))

    elif page == "Predictive Analytics":
        st.subheader("Crime Trend Prediction")
        # Here you would implement your predictive model
        st.write("This section would contain predictive models for crime trends.")

        st.subheader("Incident Type Classification")
        # Here you would implement a classification model
        st.write("This section would contain a model to classify incident types based on various features.")

if __name__ == "__main__":
    main()