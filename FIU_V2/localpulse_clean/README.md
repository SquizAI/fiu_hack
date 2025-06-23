# LocalPulse - Real-Time City Dashboard

A comprehensive real-time dashboard for city management featuring live data integration, vehicle detection, and AI-powered analytics.

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Start the Server
```bash
npm start
```

### 3. Open Dashboard
Navigate to: `http://localhost:8080`

## 🎥 Vehicle Detection System

The dashboard includes a real-time vehicle detection system using YOLO (You Only Look Once) object detection:

### Features:
- **Live HLS Stream Processing**: Supports multiple camera feeds including FL511 traffic cameras
- **Real-time Object Detection**: Detects cars, trucks, motorcycles, and pedestrians
- **CORS Proxy**: Built-in proxy to handle cross-origin video streams
- **Multiple Camera Sources**: Test streams and live traffic cameras

### Camera Sources:
- Test streams (Big Buck Bunny, Sintel)
- FL511 live traffic cameras
- Demo HLS streams

### Detection Capabilities:
- Vehicle counting and classification
- Pedestrian detection
- Real-time analytics overlay
- Traffic congestion analysis

## 📊 Data Sources

### Live Data Integration:
- **Miami 311 Service Requests**: Real-time city service data
- **Miami-Dade Fire Rescue**: Live emergency calls
- **Traffic Data**: FDOT traffic incidents
- **Weather Data**: OpenWeather API integration

### AI Analytics:
- Crime pattern analysis
- Traffic flow optimization
- Emergency response insights
- Predictive analytics

## 🛠 Technical Stack

- **Backend**: Node.js + Express
- **Frontend**: Vanilla JavaScript + Bootstrap
- **Maps**: Mapbox GL JS
- **Charts**: Chart.js
- **AI Detection**: TensorFlow.js + COCO-SSD
- **Video**: HLS.js for stream processing

## 🔧 Configuration

### Environment Variables (.env):
```bash
OPENWEATHER_API_KEY=your_weather_api_key
MAPBOX_TOKEN=your_mapbox_token
OPENAI_API_KEY=your_openai_key (optional)
```

### API Endpoints:

#### Dashboard Data:
- `GET /api/dashboard/:timeframe` - Main dashboard data
- `GET /api/dashboard/view/:viewType` - View-specific data
- `GET /api/trends/:metric` - Trend analysis

#### Vehicle Detection:
- `GET /api/cameras/list` - Available camera feeds
- `GET /api/proxy/url_:urlIndex/:filename` - HLS proxy for CORS
- `GET /api/vehicle-detection/stats` - Real-time detection stats

#### Utilities:
- `GET /api/proxy/hls?url=:url` - General HLS proxy
- `OPTIONS /api/proxy/*` - CORS preflight handling

## 🎯 Features

### Real-Time Dashboard:
- Live emergency response tracking
- Traffic flow monitoring
- Crime incident mapping
- Weather integration
- Economic indicators

### Vehicle Detection:
- Multi-camera support
- Real-time YOLO detection
- Traffic counting
- Congestion analysis
- Automatic camera failover

### AI Analytics:
- Pattern recognition
- Predictive insights
- Automated reporting
- Trend analysis

## 🚨 Troubleshooting

### Common Issues:

1. **Camera Streams Not Loading**:
   - Check CORS proxy endpoints
   - Verify camera URLs are accessible
   - Test with different browsers

2. **Detection Not Working**:
   - Ensure TensorFlow.js loads properly
   - Check browser console for errors
   - Verify YOLO model downloads

3. **API Data Issues**:
   - Check network connectivity
   - Verify API endpoints are accessible
   - Review server logs for errors

### Debug Mode:
Enable verbose logging by setting `DEBUG=true` in your environment.

## 📱 Browser Support

- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

## 🔐 Security

- CORS properly configured
- Input validation on all endpoints
- Rate limiting implemented
- Secure headers set

## 📈 Performance

- Optimized video streaming
- Efficient object detection
- Lazy loading for large datasets
- Client-side caching

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Make changes
4. Test thoroughly
5. Submit pull request

## 📄 License

MIT License - see LICENSE file for details.

---

**FIU Hackathon 2024** - Real-time city management dashboard with AI-powered vehicle detection. 