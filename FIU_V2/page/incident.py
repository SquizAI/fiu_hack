# incident.py
import pandas as pd
import plotly.express as px
import streamlit as st

# -------------------------------
# 0. Custom CSS for Dark Theme and Enhanced Filter Appearance
# -------------------------------
st.markdown(
    """
    <style>
    /* Set the background color and text color for the main content */
    .reportview-container {
        background-color: #1e1e1e;
        color: white;
    }

    /* Set the background color and text color for the sidebar */
    .sidebar .sidebar-content {
        background-color: #2e2e2e;
        color: white;
    }

    /* Style for headers and text in the main content */
    .reportview-container .main .block-container h1,
    .reportview-container .main .block-container h2,
    .reportview-container .main .block-container h3,
    .reportview-container .main .block-container h4,
    .reportview-container .main .block-container h5,
    .reportview-container .main .block-container h6,
    .reportview-container .main .block-container p,
    .reportview-container .main .block-container label {
        color: white;
    }

    /* Style for headers and text in the sidebar */
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

    /* Customize the appearance of Streamlit widgets */
    .css-1kyxreq.edgvbvh3 {
        background-color: #3a3a3a;
        color: white;
    }

    /* Change the color of selected options in multiselect widgets */
    .css-1wa3eu0-option {
        background-color: #3a3a3a;
        color: white;
    }

    /* Change the color of selected items in multiselect widgets */
    .css-1uccc91-singleValue {
        color: white !important;
    }

    /* Adjust the scrollbar color in the sidebar */
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

# -------------------------------
# 1. Helper Functions
# -------------------------------

@st.cache_data
def load_data(filepath):
    """
    Load and parse the incident data from a CSV file.
    """
    try:
        # Automatically detect the delimiter
        df = pd.read_csv(
            filepath,
            sep=None,          # Let pandas infer the separator
            engine='python',   # Required for delimiter inference
            header=None,       # No header in CSV
            names=['index', 'date', 'incident_type', 'address', 'city', 'state', 'zip'],
            dtype={'index': str, 'zip': str},  # Ensure 'index' and 'zip' are strings
            na_values=['', 'NA', 'NaN']        # Additional NA values
        )
        return df
    except FileNotFoundError:
        st.error(f"File not found: {filepath}")
        return pd.DataFrame()
    except pd.errors.ParserError as e:
        st.error(f"Error parsing the CSV file: {e}")
        return pd.DataFrame()

def clean_data(df):
    """
    Clean and preprocess the incident data.
    """
    if df.empty:
        return df

    # Convert 'date' to datetime with flexible parsing
    df['date'] = pd.to_datetime(df['date'], errors='coerce', dayfirst=True)

    # Drop rows with invalid dates
    df = df.dropna(subset=['date'])

    return df

def categorize_incidents(df):
    """
    Categorize incidents into broader categories.
    """
    # Comprehensive category mapping
    category_mapping = {
        'Violent Crime': ['assault', 'battery', 'robbery', 'homicide', 'violence'],
        'Property Crime': ['theft', 'larceny', 'shoplifting', 'burglary', 'embezzlement', 'fraud'],
        'Property Damage': ['vandalism', 'property damage', 'arson'],
        'Traffic Incident': ['accident', 'vehicle', 'traffic', 'collision'],
        'Public Disorder': ['riot', 'protest', 'public disorder'],
        'Safety Emergency': ['fire', 'medical', 'emergency', 'hazard'],
        'Environmental': ['pollution', 'environmental', 'natural disaster'],
        # Add more categories and keywords as needed
    }

    def get_category(incident):
        if pd.isna(incident):
            return 'Other'
        incident_lower = incident.lower()
        for category, keywords in category_mapping.items():
            if any(keyword in incident_lower for keyword in keywords):
                return category
        return 'Other'

    df['Category'] = df['incident_type'].apply(get_category)
    return df

def filter_data(df, categories, start_month, end_month):
    """
    Filter the incident data based on selected categories and month range.
    """
    # Create 'Month' column in 'YYYY-MM' format
    df['Month'] = df['date'].dt.to_period('M').astype(str)

    # Generate list of months between start_month and end_month
    all_months = pd.period_range(start=start_month, end=end_month, freq='M').astype(str).tolist()

    filtered = df[
        df['Category'].isin(categories) &
        df['Month'].isin(all_months)
    ]

    return filtered

# -------------------------------
# 2. Data Import and Cleaning
# -------------------------------

# Load the data
df = load_data('incidents_data.csv')

# Clean the data
df_cleaned = clean_data(df)

# If DataFrame is empty after cleaning, stop the app
if df_cleaned.empty:
    st.error("No valid date data available after cleaning. Please check your data source.")
    st.stop()

# -------------------------------
# 3. Incident Categorization
# -------------------------------

df_categorized = categorize_incidents(df_cleaned)

# Display number of incidents per category before filtering
category_counts = df_categorized['Category'].value_counts().reset_index()
category_counts.columns = ['Category', 'Count']
st.write("## Incident Counts by Category")
st.table(category_counts)

# -------------------------------
# 4. Streamlit Application
# -------------------------------

# Sidebar Filters
st.sidebar.header('Filter Options')

# Category Selection
category_options = sorted(df_categorized['Category'].unique())
selected_categories = st.sidebar.multiselect(
    'Select Category(ies):',
    options=category_options,
    default=category_options
)

# Date Range Selection using two dropdowns
# Extract unique months in 'YYYY-MM' format
df_categorized['Month'] = df_categorized['date'].dt.to_period('M').astype(str)
unique_months = sorted(df_categorized['Month'].unique())

# Starting Month Dropdown
start_month = st.sidebar.selectbox(
    'Select Starting Month:',
    options=unique_months,
    index=0
)

# Ending Month Dropdown
end_month = st.sidebar.selectbox(
    'Select Ending Month:',
    options=unique_months,
    index=len(unique_months) - 1
)

# Validate that start_month is not after end_month
start_month_period = pd.Period(start_month, freq='M')
end_month_period = pd.Period(end_month, freq='M')

if start_month_period > end_month_period:
    st.sidebar.error("Starting month must be earlier than or equal to Ending month.")
    st.stop()

# Toggle for decomposing by Zip Code
decompose_zip = st.sidebar.checkbox('Decompose by Zip Code')

# -------------------------------
# 5. Data Filtering
# -------------------------------

filtered_df = filter_data(df_categorized, selected_categories, start_month, end_month)

st.write(f"### Total Incidents After Filtering: {len(filtered_df)}")

# -------------------------------
# 6. Data Analysis and Visualization - Time Series with Optional Decomposition
# -------------------------------

if not filtered_df.empty:
    if decompose_zip:
        # Group data by 'date' and 'zip' to get 'incident_count'
        time_trends = filtered_df.groupby(['date', 'zip']).size().reset_index(name='incident_count')
        
        # Sort the data by zip and date
        time_trends = time_trends.sort_values(['zip', 'date'])
        
        # Create the time series plot with decomposition by Zip Code
        fig = px.line(
            time_trends,
            x='date',
            y='incident_count',
            color='zip',
            title='Incident Trends Over Time by Zip Code',
            labels={
                'date': 'Date',
                'incident_count': 'Number of Incidents',
                'zip': 'Zip Code'
            },
            template='plotly_dark'  # Use dark theme
        )
    else:
        # Group data by 'date' to get 'incident_count'
        time_trends = filtered_df.groupby('date').size().reset_index(name='incident_count')
        
        # Sort the data by date
        time_trends = time_trends.sort_values('date')
        
        # Create the time series plot without decomposition
        fig = px.line(
            time_trends,
            x='date',
            y='incident_count',
            title='Incident Trends Over Time',
            labels={
                'date': 'Date',
                'incident_count': 'Number of Incidents'
            },
            template='plotly_dark'  # Use dark theme
        )
    
    # Update axes for better readability
    fig.update_xaxes(
        title_font=dict(size=14, family='Arial', color='white'),
        tickfont=dict(size=12, family='Arial', color='white'),
        title='Date',
        showgrid=True,
        gridcolor='gray',
        tickformat='%Y-%m-%d',
        tickangle=45
    )

    fig.update_yaxes(
        title_font=dict(size=14, family='Arial', color='white'),
        tickfont=dict(size=12, family='Arial', color='white'),
        title='Number of Incidents',
        showgrid=True,
        gridcolor='gray',
        tickformat=',d'
    )

    # Update layout for better aesthetics and wider chart
    fig.update_layout(
        title=dict(
            text='Incident Trends Over Time' + (' by Zip Code' if decompose_zip else ''),
            x=0.5,
            xanchor='center',
            font=dict(size=20, family='Arial', color='white')
        ),
        legend=dict(
            title='Zip Code' if decompose_zip else None,
            title_font=dict(size=14, family='Arial', color='white'),
            font=dict(size=12, family='Arial', color='white')
        ),
        margin=dict(l=60, r=60, t=80, b=80),
        plot_bgcolor='rgba(0,0,0,0)',  # Transparent background
        paper_bgcolor='rgba(0,0,0,0)',  # Transparent background
        line_shape='linear',             # Smooth lines
        width=1200,                       # Make the chart wider
        height=600                       # Set a height for better visibility
    )

    # Increase line width for better visibility
    fig.update_traces(line=dict(width=3))

    # Display the plot with increased width
    st.plotly_chart(fig, use_container_width=True)
else:
    st.warning('No data available for the selected filters.')

# -------------------------------
# 7. Display Data Table (Optional)
# -------------------------------

if st.checkbox('Show Raw Data'):
    st.subheader('Filtered Data')
    # Select relevant columns to display
    display_columns = ['date', 'Category', 'incident_type', 'address', 'city', 'state', 'zip']
    st.dataframe(filtered_df[display_columns].reset_index(drop=True))

# -------------------------------
# 8. Additional Insights (Optional)
# -------------------------------

if not filtered_df.empty:
    st.subheader('Total Incidents by Category')
    # When decomposing by zip, still show total per category
    incident_summary = filtered_df.groupby('Category').size().reset_index(name='incident_count')
    st.table(incident_summary)
