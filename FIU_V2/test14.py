import streamlit as st
import pandas as pd
import numpy as np
import pydeck as pdk
import plotly.express as px
import plotly.graph_objects as go
from datetime import datetime, timedelta
import random
from textblob import TextBlob
from wordcloud import WordCloud
import matplotlib.pyplot as plt

# Set page config
st.set_page_config(page_title="Coral Gables AI for Good Dashboard", layout="wide")

# Generate synthetic data
@st.cache_data
def generate_crime_data(num_records=1000):
    now = datetime.now()
    dates = [now - timedelta(days=random.randint(0, 365)) for _ in range(num_records)]
    incident_types = ['Theft', 'Assault', 'Burglary', 'Vandalism', 'Fraud']
    return pd.DataFrame({
        'Date': dates,
        'Incident Type': [random.choice(incident_types) for _ in range(num_records)],
        'lat': np.random.uniform(25.70, 25.75, num_records),
        'lon': np.random.uniform(-80.30, -80.25, num_records)
    })

@st.cache_data
def generate_traffic_data(num_records=1000):
    now = datetime.now()
    dates = [now - timedelta(days=random.randint(0, 365)) for _ in range(num_records)]
    return pd.DataFrame({
        'Date': dates,
        'Severity': np.random.choice(['Minor', 'Moderate', 'Severe'], num_records),
        'lat': np.random.uniform(25.70, 25.75, num_records),
        'lon': np.random.uniform(-80.30, -80.25, num_records)
    })

@st.cache_data
def generate_real_estate_data(num_records=365):
    dates = pd.date_range(end=datetime.now(), periods=num_records)
    base_value = 500000
    trend = np.linspace(0, 0.2, num_records)  # 20% increase over the period
    noise = np.random.normal(0, 0.02, num_records)  # 2% daily noise
    values = base_value * (1 + trend + noise)
    return pd.DataFrame({
        'Date': dates,
        'ZHVI': values
    })

@st.cache_data
def generate_news_data(num_records=100):
    now = datetime.now()
    dates = [now - timedelta(days=random.randint(0, 30)) for _ in range(num_records)]
    titles = [
        "New Development Project Announced in Coral Gables",
        "Local Restaurant Wins Culinary Award",
        "City Council Approves New Green Initiative",
        "Coral Gables Museum Hosts International Art Exhibition",
        "Tech Startup Opens Headquarters in Coral Gables"
    ]
    return pd.DataFrame({
        'Date': dates,
        'Title': [random.choice(titles) for _ in range(num_records)],
        'Sentiment': np.random.uniform(-1, 1, num_records)
    })

# Load synthetic data
crime_data = generate_crime_data()
traffic_data = generate_traffic_data()
real_estate_data = generate_real_estate_data()
news_data = generate_news_data()

# Visualization Functions
def create_map(data, color_scale):
    return pdk.Deck(
        map_style="mapbox://styles/mapbox/light-v9",
        initial_view_state=pdk.ViewState(
            latitude=25.72,
            longitude=-80.27,
            zoom=12,
            pitch=50,
        ),
        layers=[
            pdk.Layer(
                "HexagonLayer",
                data=data,
                get_position=['lon', 'lat'],
                radius=100,
                elevation_scale=4,
                elevation_range=[0, 1000],
                pickable=True,
                extruded=True,
                color_scale=color_scale,
            ),
        ],
    )

def create_time_series(data, x, y, title):
    fig = px.line(data, x=x, y=y, title=title)
    fig.update_layout(height=400)
    return fig

def create_heatmap(data, x, y, z, title):
    fig = go.Figure(data=go.Heatmap(
        x=data[x],
        y=data[y],
        z=data[z],
        colorscale='Viridis'))
    fig.update_layout(
        title=title,
        xaxis_title=x,
        yaxis_title=y,
        height=400
    )
    return fig

# Streamlit App
def main():
    st.title("Coral Gables AI for Good Dashboard")

    # Sidebar
    st.sidebar.header("Navigation")
    page = st.sidebar.radio("Go to", ["Home", "Crime Analysis", "Traffic Analysis", "Real Estate Trends", "News Sentiment"])

    if page == "Home":
        st.write("Welcome to the enhanced Coral Gables AI for Good Dashboard. This tool provides comprehensive insights into crime, traffic, real estate, and news sentiment in Coral Gables, Florida.")
        
        col1, col2, col3, col4 = st.columns(4)
        col1.metric("Total Crimes", len(crime_data))
        col2.metric("Traffic Incidents", len(traffic_data))
        col3.metric("Avg. Home Value", f"${real_estate_data['ZHVI'].mean():,.0f}")
        col4.metric("News Articles", len(news_data))

        st.subheader("Overview Map")
        st.pydeck_chart(create_map(pd.concat([crime_data, traffic_data]), [[0, "green"], [0.5, "yellow"], [1, "red"]]))

    elif page == "Crime Analysis":
        st.subheader("Crime Incidents Heatmap")
        st.pydeck_chart(create_map(crime_data, [[0, "green"], [0.5, "yellow"], [1, "red"]]))

        st.subheader("Crime Trends")
        crime_trends = crime_data.groupby([crime_data['Date'].dt.to_period('M'), 'Incident Type']).size().unstack(fill_value=0)
        st.plotly_chart(create_heatmap(crime_trends.reset_index(), 'Date', 'Incident Type', 'value', 'Crime Trends Over Time'))

        st.subheader("Incident Type Distribution")
        fig = px.pie(crime_data, names='Incident Type', title='Distribution of Incident Types')
        st.plotly_chart(fig)

    elif page == "Traffic Analysis":
        st.subheader("Traffic Incidents Heatmap")
        st.pydeck_chart(create_map(traffic_data, [[0, "green"], [0.5, "yellow"], [1, "red"]]))

        st.subheader("Traffic Incident Trends")
        traffic_trends = traffic_data.groupby([traffic_data['Date'].dt.to_period('M'), 'Severity']).size().unstack(fill_value=0)
        st.plotly_chart(create_heatmap(traffic_trends.reset_index(), 'Date', 'Severity', 'value', 'Traffic Incident Trends Over Time'))

        st.subheader("Severity Distribution")
        fig = px.pie(traffic_data, names='Severity', title='Distribution of Traffic Incident Severity')
        st.plotly_chart(fig)

    elif page == "Real Estate Trends":
        st.subheader("Home Value Index Trends")
        st.plotly_chart(create_time_series(real_estate_data, 'Date', 'ZHVI', 'Zillow Home Value Index Over Time'))

        st.subheader("Monthly Change in Home Values")
        monthly_change = real_estate_data.set_index('Date').resample('M')['ZHVI'].last().pct_change() * 100
        fig = px.bar(monthly_change.reset_index(), x='Date', y='ZHVI', title='Monthly Percentage Change in Home Values')
        st.plotly_chart(fig)

        st.subheader("Price Distribution")
        fig = px.histogram(real_estate_data, x='ZHVI', nbins=50, title='Distribution of Home Values')
        st.plotly_chart(fig)

    elif page == "News Sentiment":
        st.subheader("News Sentiment Over Time")
        sentiment_over_time = news_data.set_index('Date')['Sentiment'].rolling(window=7).mean()
        st.plotly_chart(create_time_series(sentiment_over_time.reset_index(), 'Date', 'Sentiment', '7-Day Rolling Average of News Sentiment'))

        st.subheader("Sentiment Distribution")
        fig = px.histogram(news_data, x='Sentiment', nbins=50, title='Distribution of News Sentiment')
        st.plotly_chart(fig)

        st.subheader("Top News Headlines")
        top_positive = news_data.nlargest(5, 'Sentiment')
        top_negative = news_data.nsmallest(5, 'Sentiment')
        
        st.write("Most Positive Headlines:")
        for _, row in top_positive.iterrows():
            st.write(f"- {row['Title']} (Sentiment: {row['Sentiment']:.2f})")
        
        st.write("Most Negative Headlines:")
        for _, row in top_negative.iterrows():
            st.write(f"- {row['Title']} (Sentiment: {row['Sentiment']:.2f})")

if __name__ == "__main__":
    main()