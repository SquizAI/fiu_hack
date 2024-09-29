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
import plotly.express as px
import plotly.graph_objects as go
import time
import psycopg2
from sklearn.feature_extraction.text import CountVectorizer
from sklearn.decomposition import LatentDirichletAllocation

# Set page config
st.set_page_config(page_title="Coral Gables AI for Good Dashboard", layout="wide")

# API Keys and Database Connection
NEWSAPI_KEY = os.environ["NEWSAPI_KEY"]
CENSUS_API_KEY = os.environ["CENSUS_API_KEY"]
OPENWEATHERMAP_API_KEY = os.environ["OPENWEATHERMAP_API_KEY"]
GOOGLE_API_KEY = os.environ["GOOGLE_API_KEY"]
GOOGLE_CSE_ID = os.environ["GOOGLE_CSE_ID"]
NYT_API_KEY = os.environ["NYT_API_KEY"]

# Database connection parameters
db_params = {
    "dbname": "shellhack_data",
    "user": "postgres",
    "password": "Wecamewesawwelost1!",
    "host": "35.193.25.198",
    "port": "5432"
}

# Initialize API clients
newsapi = NewsApiClient(api_key=NEWSAPI_KEY)

# Load Data
@st.cache_data
def load_police_data():
    df = pd.read_csv("data/police_data_with_zip.csv", delimiter=';')
    df['Date'] = pd.to_datetime(df['date'])
    df['lat'] = np.random.uniform(25.70, 25.75, len(df))
    df['lon'] = np.random.uniform(-80.30, -80.25, len(df))
    return df

@st.cache_data
def load_social_media_data():
    df = pd.read_csv("data/online_posts.csv")
    df['date'] = pd.to_datetime(df['date'])
    return df

@st.cache_data
def query_nextdoor_posts():
    results = []
    try:
        conn = psycopg2.connect(**db_params)
        cursor = conn.cursor()
        query = "SELECT content FROM shellhack_data_schema.nextdoor_posts;"
        cursor.execute(query)
        rows = cursor.fetchall()
        for row in rows:
            results.append(row[0])
        cursor.close()
        conn.close()
    except psycopg2.Error as e:
        st.error(f"An error occurred: {e}")
    return results

@st.cache_data
def load_traffic_data():
    url = "https://opendata.arcgis.com/datasets/1a7f1db1ea3f40fb98861a55425c18e3_0.geojson"
    try:
        response = requests.get(url)
        response.raise_for_status()
        data = response.json()
        
        if 'features' in data and isinstance(data['features'], list):
            df = pd.DataFrame([feature.get('properties', {}) for feature in data['features']])
        else:
            st.warning("Traffic data structure has changed. Using dummy data.")
            df = pd.DataFrame({
                'DATETIME': pd.date_range(start='2023-01-01', periods=100, freq='D'),
                'lat': np.random.uniform(25.70, 25.75, 100),
                'lon': np.random.uniform(-80.30, -80.25, 100)
            })
        
        df['Date'] = pd.to_datetime(df['DATETIME'])
        df = df[df['Date'].dt.year >= 2023]
        return df
    except requests.exceptions.RequestException as e:
        st.error(f"Error fetching traffic data: {e}")
        return pd.DataFrame({
            'Date': pd.date_range(start='2023-01-01', periods=100, freq='D'),
            'lat': np.random.uniform(25.70, 25.75, 100),
            'lon': np.random.uniform(-80.30, -80.25, 100)
        })

@st.cache_data
def load_real_estate_data():
    url = "https://files.zillowstatic.com/research/public_csvs/zhvi/Metro_zhvi_uc_sfrcondo_tier_0.33_0.67_sm_sa_month.csv"
    df = pd.read_csv(url)
    df = df[df['RegionName'] == 'Miami-Fort Lauderdale-West Palm Beach, FL']
    df = df.melt(id_vars=['RegionName'], var_name='Date', value_name='ZHVI')
    df['Date'] = pd.to_datetime(df['Date'])
    return df[df['Date'].dt.year >= 2023]

@st.cache_data
def load_weather_data():
    base_url = "http://api.openweathermap.org/data/2.5/forecast"
    params = {
        "lat": 25.72,
        "lon": -80.27,
        "appid": OPENWEATHERMAP_API_KEY,
        "units": "imperial"
    }
    response = requests.get(base_url, params=params)
    data = response.json()
    df = pd.DataFrame(data['list'])
    df['Date'] = pd.to_datetime(df['dt_txt'])
    return df

@st.cache_data
def google_search(query, api_key, cse_id, num_results=10):
    url = "https://www.googleapis.com/customsearch/v1"
    params = {
        'key': api_key,
        'cx': cse_id,
        'q': query,
        'num': num_results
    }
    try:
        response = requests.get(url, params=params)
        response.raise_for_status()
        data = response.json()
        results = []
        for item in data.get('items', []):
            results.append({
                'title': item.get('title'),
                'link': item.get('link'),
                'snippet': item.get('snippet')
            })
        return pd.DataFrame(results)
    except requests.exceptions.RequestException as e:
        st.error(f"Error fetching data from Google: {e}")
        return pd.DataFrame()

@st.cache_data
def nyt_article_search(query, api_key, num_results=10):
    url = "https://api.nytimes.com/svc/search/v2/articlesearch.json"
    params = {
        'q': query,
        'api-key': api_key,
        'sort': 'newest',
        'page': 0
    }
    results = []
    for i in range(num_results // 10):
        try:
            response = requests.get(url, params=params)
            response.raise_for_status()
            data = response.json()
            docs = data.get('response', {}).get('docs', [])
            for doc in docs:
                results.append({
                    'title': doc.get('headline', {}).get('main'),
                    'link': doc.get('web_url'),
                    'snippet': doc.get('abstract'),
                    'published_date': doc.get('pub_date')
                })
            params['page'] += 1
            time.sleep(1)
        except requests.exceptions.RequestException as e:
            st.error(f"Error fetching data from NYT: {e}")
            break
    return pd.DataFrame(results)

# Load data
police_data = load_police_data()
social_media_data = load_social_media_data()
nextdoor_posts = query_nextdoor_posts()
traffic_data = load_traffic_data()
real_estate_data = load_real_estate_data()
weather_data = load_weather_data()
google_data = google_search("Coral Gables", GOOGLE_API_KEY, GOOGLE_CSE_ID, num_results=20)
nyt_data = nyt_article_search("Coral Gables", NYT_API_KEY, num_results=20)

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

def perform_topic_modeling(texts, num_topics=5, num_words=10):
    vectorizer = CountVectorizer(max_df=0.95, min_df=2, stop_words='english')
    doc_term_matrix = vectorizer.fit_transform(texts)
    lda = LatentDirichletAllocation(n_components=num_topics, random_state=42)
    lda.fit(doc_term_matrix)
    
    feature_names = vectorizer.get_feature_names_out()
    topics = []
    for topic_idx, topic in enumerate(lda.components_):
        top_words = [feature_names[i] for i in topic.argsort()[:-num_words - 1:-1]]
        topics.append(f"Topic {topic_idx + 1}: {', '.join(top_words)}")
    return topics

# DeckGL Visualization Functions
def create_scatterplot_layer(data, color):
    return pdk.Layer(
        "ScatterplotLayer",
        data=data,
        get_position=['lon', 'lat'],
        get_color=color,
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

def create_heatmap_layer(data):
    return pdk.Layer(
        "HeatmapLayer",
        data=data,
        get_position=['lon', 'lat'],
        get_weight='weight',
        radiusPixels=60,
        opacity=0.9,
        aggregation=pdk.types.String("SUM"),
    )

# Streamlit App
def main():
    st.title("Coral Gables AI for Good Dashboard")

    # Sidebar
    st.sidebar.header("Navigation")
    page = st.sidebar.radio("Go to", ["Home", "Crime Analysis", "Social Media Analysis", "Traffic Analysis", "Real Estate Trends", "Weather Forecast", "News and Search Results"])

    if page == "Home":
        st.write("Welcome to the enhanced Coral Gables AI for Good Dashboard. This tool provides comprehensive insights into crime, social media, traffic, real estate, weather, news, and search results for Coral Gables, Florida.")
        
        st.subheader("Quick Stats")
        col1, col2, col3 = st.columns(3)
        col1.metric("Total Incidents", len(police_data))
        col2.metric("Traffic Accidents", len(traffic_data))
        col3.metric("Latest ZHVI", f"${real_estate_data['ZHVI'].iloc[-1]:,.0f}")
        
        st.subheader("Census Data Insights")
        total_population = int(census_data['B01003_001E'].values[0])
        median_income = int(census_data['B19013_001E'].values[0])
        bachelors_degree = int(census_data['B15003_022E'].values[0])
        
        st.write(f"Coral Gables has a population of {total_population} with a median income of ${median_income}.")
        st.write(f"Approximately {bachelors_degree / total_population:.2%} of the population has a bachelor's degree or higher.")

    elif page == "Crime Analysis":
        st.subheader("Interactive Crime Map")
        
        map_type = st.selectbox("Select Map Type", ["Scatterplot", "Heatmap"])
        
        if map_type == "Scatterplot":
            layer = create_scatterplot_layer(police_data, [200, 30, 0, 160])
        else:
            layer = create_heatmap_layer(police_data)
        
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
        incident_counts = police_data.groupby(['Date', 'incident_type']).size().unstack(fill_value=0)
        st.line_chart(incident_counts)
        
        st.subheader("Top 5 Incident Types")
        top_incidents = police_data['incident_type'].value_counts().head()
        fig = px.pie(values=top_incidents.values, names=top_incidents.index, title="Top 5 Incident Types")
        st.plotly_chart(fig)

    elif page == "Social Media Analysis":
        st.subheader("Social Media Insights")
        
        # Display social media data summary
        st.write("Summary of Social Media Posts")
        st.write(social_media_data.describe())
        
        # Display sentiment analysis of social media posts
        st.subheader("Sentiment Analysis of Social Media Posts")
        social_media_data['sentiment'] = social_media_data['content'].apply(analyze_sentiment)
        fig = px.histogram(social_media_data, x='sentiment', nbins=50, title="Distribution of Social Media Sentiment")
        st.plotly_chart(fig)
        
        # Display topic modeling results
        st.subheader("Topic Modeling of Social Media Posts")
        topics = perform_topic_modeling(social_media_data['content'].tolist())
        for topic in topics:
            st.write(topic)
        
        # Display Nextdoor posts
        st.subheader("Recent Nextdoor Posts")
        for post in nextdoor_posts[:5]:
            st.write(post)
            st.write("---")

    elif page == "Traffic Analysis":
        st.subheader("Traffic Accident Heatmap")
        layer = create_heatmap_layer(traffic_data)
        
        view_state = pdk.ViewState(
            latitude=25.72,
            longitude=-80.27,
            zoom=11,
            pitch=50,
        )
        r = pdk.Deck(
            layers=[layer],
            initial_view_state=view_state,
            map_style="mapbox://styles/mapbox/light-v9",
        )
        
        st.pydeck_chart(r)
        
        st.subheader("Traffic Accidents Over Time")
        traffic_counts = traffic_data.groupby('Date').size().reset_index(name='count')
        fig = px.line(traffic_counts, x='Date', y='count', title='Traffic Accidents Over Time')
        st.plotly_chart(fig)
        
        # Add day of week analysis
        st.subheader("Traffic Accidents by Day of Week")
        traffic_data['Day_of_Week'] = traffic_data['Date'].dt.day_name()
        day_order = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
        day_counts = traffic_data['Day_of_Week'].value_counts().reindex(day_order)
        fig = px.bar(x=day_counts.index, y=day_counts.values, title="Traffic Accidents by Day of Week")
        st.plotly_chart(fig)

    elif page == "Real Estate Trends":
        st.subheader("Zillow Home Value Index (ZHVI) Trends")
        fig = px.line(real_estate_data, x='Date', y='ZHVI', title='Zillow Home Value Index Over Time')
        st.plotly_chart(fig)
        
        annual_change = (real_estate_data['ZHVI'].iloc[-1] / real_estate_data['ZHVI'].iloc[-13] - 1) * 100
        st.metric("Annual Change in ZHVI", f"{annual_change:.2f}%")
        
        # Add monthly change analysis
        st.subheader("Monthly ZHVI Change")
        real_estate_data['Monthly_Change'] = real_estate_data['ZHVI'].pct_change() * 100
        fig = px.bar(real_estate_data, x='Date', y='Monthly_Change', title='Monthly Percentage Change in ZHVI')
        st.plotly_chart(fig)

    elif page == "Weather Forecast":
        st.subheader("5-Day Weather Forecast")
        weather_forecast = weather_data[['Date', 'main.temp', 'weather.0.description']].rename(columns={'main.temp': 'Temperature', 'weather.0.description': 'Description'})
        weather_forecast = weather_forecast.groupby('Date').agg({'Temperature': 'mean', 'Description': 'first'}).reset_index()
        
        fig = px.line(weather_forecast, x='Date', y='Temperature', title='Temperature Forecast')
        st.plotly_chart(fig)
        
        st.write(weather_forecast)
        
        # Add weather description wordcloud
        st.subheader("Common Weather Descriptions")
        weather_text = ' '.join(weather_data['weather.0.description'])
        wordcloud = WordCloud(width=800, height=400, background_color='white').generate(weather_text)
        fig, ax = plt.subplots(figsize=(10, 5))
        ax.imshow(wordcloud, interpolation='bilinear')
        ax.axis('off')
        st.pyplot(fig)

    elif page == "News and Search Results":
        st.subheader("News Articles")
        for _, article in news_articles.head(5).iterrows():
            st.write(f"**{article['title']}**")
            st.write(article['description'])
            st.write(f"[Read more]({article['url']})")
            st.write("---")
        
        st.subheader("Google Search Results")
        for _, result in google_data.head(5).iterrows():
            st.write(f"**{result['title']}**")
            st.write(result['snippet'])
            st.write(f"[Read more]({result['link']})")
            st.write("---")
        
        st.subheader("New York Times Articles")
        for _, article in nyt_data.head(5).iterrows():
            st.write(f"**{article['title']}**")
            st.write(article['snippet'])
            st.write(f"[Read more]({article['link']})")
            st.write("---")
        
        st.subheader("News Sentiment Analysis")
        news_articles['sentiment'] = news_articles['description'].apply(analyze_sentiment)
        fig = px.histogram(news_articles, x='sentiment', nbins=50, title="Distribution of News Sentiment")
        st.plotly_chart(fig)
        
        st.subheader("Top Keywords")
        all_text = ' '.join(news_articles['description'].dropna()) + ' '.join(google_data['snippet'].dropna()) + ' '.join(nyt_data['snippet'].dropna())
        wordcloud = WordCloud(width=800, height=400, background_color='white').generate(all_text)
        fig, ax = plt.subplots(figsize=(10, 5))
        ax.imshow(wordcloud, interpolation='bilinear')
        ax.axis('off')
        st.pyplot(fig)

if __name__ == "__main__":
    main()