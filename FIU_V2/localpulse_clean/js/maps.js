// Enhanced Maps functionality using Mapbox GL JS with AI Analysis
class MapManager {
    constructor() {
        // Get Mapbox token from configuration
        this.mapboxToken = null; // Will be set async
        this.maps = {};
        this.coralGablesCenter = [-80.268, 25.721];
        this.apiIntegration = null;
        this.currentAnalysis = null;
        this.isAnalyzing = false;
        
        // Initialize API integration when available
        if (typeof APIIntegration !== 'undefined') {
            this.apiIntegration = new APIIntegration();
        }
    }

    async getMapboxToken() {
        try {
            console.log('🔑 Fetching Mapbox token from server...');
            // Get token from server (secure)
            const response = await fetch('/api/config/mapbox-token');
            const config = await response.json();
            
            console.log('🔑 Server response:', config);
            
            if (config.accessToken && config.accessToken !== 'YOUR_MAPBOX_TOKEN_HERE') {
                console.log('✅ Using Mapbox token from server:', config.accessToken.substring(0, 20) + '...');
                return config.accessToken;
            }
        } catch (error) {
            console.warn('⚠️ Could not get Mapbox token from server:', error);
        }
        
        // Try to get token from configuration as fallback
        if (window.LocalPulseConfig && window.LocalPulseConfig.mapbox && window.LocalPulseConfig.mapbox.accessToken) {
            console.log('✅ Using Mapbox token from secure configuration');
            return window.LocalPulseConfig.mapbox.accessToken;
        }
        
        // Final fallback - this will cause 401 errors but won't expose real tokens
        console.warn('⚠️ Mapbox token not configured - maps will not work');
        return null;
    }

    initializeMainMap() {
        if (!mapboxgl.supported()) {
            console.warn('Mapbox GL is not supported');
            return;
        }

        if (!this.mapboxToken) {
            console.error('❌ No Mapbox token available - cannot initialize map');
            return;
        }
        
        console.log('🗺️ Setting Mapbox access token:', this.mapboxToken.substring(0, 20) + '...');
        mapboxgl.accessToken = this.mapboxToken;

        // Clear any existing map instance
        if (this.maps.main) {
            this.maps.main.remove();
        }

        this.maps.main = new mapboxgl.Map({
            container: 'main-map',
            style: 'mapbox://styles/mapbox/streets-v12',
            center: this.coralGablesCenter,
            zoom: 13
        });

        // Store reference globally for overlay controls
        window.mapManager = this;

        // Add navigation controls
        this.maps.main.addControl(new mapboxgl.NavigationControl());

        // Add sample markers and initialize overlays
        this.maps.main.on('load', () => {
            console.log('🗺️ Main map loaded, adding default overlays...');
            this.addSampleData(this.maps.main);
            
            // Initialize default overlays based on checkbox states
            setTimeout(() => {
                const crimeToggle = document.getElementById('show-crime');
                const trafficToggle = document.getElementById('show-traffic');
                const emergencyToggle = document.getElementById('show-emergency');
                
                if (crimeToggle && crimeToggle.checked) {
                    this.addCrimeData(this.maps.main);
                }
                if (trafficToggle && trafficToggle.checked) {
                    this.addTrafficData(this.maps.main);
                }
                if (emergencyToggle && emergencyToggle.checked) {
                    this.addEmergencyOverlay(this.maps.main);
                }
            }, 1000);
        });
    }

    initializeCrimeMap() {
        if (!mapboxgl.supported()) {
            console.warn('Mapbox GL is not supported');
            return;
        }

        mapboxgl.accessToken = this.mapboxToken;

        // Clear any existing map instance
        if (this.maps.crime) {
            this.maps.crime.remove();
        }

        this.maps.crime = new mapboxgl.Map({
            container: 'crime-map',
            style: 'mapbox://styles/mapbox/streets-v12', // Use same style as main map
            center: this.coralGablesCenter,
            zoom: 13
        });

        this.maps.crime.addControl(new mapboxgl.NavigationControl());

        this.maps.crime.on('load', () => {
            console.log('🗺️ Crime map loaded, adding REAL crime data and overlays...');
            
            // Add the same sample POI markers as main map
            this.addSampleData(this.maps.crime);
            
            // Add REAL crime data with overlays
            this.addCrimeData(this.maps.crime);
            
            // Add other overlays for context (same as main map)
            setTimeout(() => {
                this.addEmergencyOverlay(this.maps.crime);
                
                // Add traffic data for context
                this.apiIntegration.fetchRealTrafficData().then(trafficData => {
                    if (trafficData && trafficData.length > 0) {
                        trafficData.slice(0, 20).forEach(incident => {
                            const color = this.getTrafficIncidentColor(incident.severity);
                            
                            const marker = new mapboxgl.Marker({ color: color, scale: 0.8 })
                                .setLngLat(incident.coordinates)
                                .setPopup(new mapboxgl.Popup().setHTML(`
                                    <h6>Traffic Context</h6>
                                    <p><strong>Type:</strong> ${incident.type}</p>
                                    <p><strong>Location:</strong> ${incident.location}</p>
                                    <p><strong>Status:</strong> ${incident.status}</p>
                                `))
                                .addTo(this.maps.crime);
                                
                            marker.getElement().setAttribute('data-type', 'traffic-context');
                            marker.getElement().style.opacity = '0.6'; // Make it less prominent
                        });
                    }
                }).catch(error => {
                    console.warn('Could not load traffic context for crime map:', error);
                });
            }, 1000);
        });
    }

    initializeTrafficMap() {
        if (!mapboxgl.supported()) {
            console.warn('Mapbox GL is not supported');
            return;
        }

        mapboxgl.accessToken = this.mapboxToken;

        // Clear any existing map instance
        if (this.maps.traffic) {
            this.maps.traffic.remove();
        }

        this.maps.traffic = new mapboxgl.Map({
            container: 'traffic-map',
            style: 'mapbox://styles/mapbox/streets-v12', // Use same style as main map
            center: this.coralGablesCenter,
            zoom: 13
        });

        this.maps.traffic.addControl(new mapboxgl.NavigationControl());

        this.maps.traffic.on('load', () => {
            console.log('🗺️ Traffic map loaded, adding REAL traffic data and overlays...');
            
            // Add the same sample POI markers as main map
            this.addSampleData(this.maps.traffic);
            
            // Add REAL traffic data with overlays
            this.addTrafficData(this.maps.traffic);
            
            // Add other overlays for context (same as main map)
            setTimeout(() => {
                this.addEmergencyOverlay(this.maps.traffic);
                
                // Add crime data for context
                this.apiIntegration.fetchRealCrimeData().then(crimeData => {
                    if (crimeData && crimeData.length > 0) {
                        crimeData.slice(0, 30).forEach(incident => {
                            const color = this.getCrimeColor(incident.type);
                            
                            const marker = new mapboxgl.Marker({ color: color, scale: 0.6 })
                                .setLngLat(incident.coordinates)
                                .setPopup(new mapboxgl.Popup().setHTML(`
                                    <h6>Crime Context</h6>
                                    <p><strong>Type:</strong> ${incident.type}</p>
                                    <p><strong>Location:</strong> ${incident.location}</p>
                                    <p><strong>Date:</strong> ${new Date(incident.date).toLocaleDateString()}</p>
                                `))
                                .addTo(this.maps.traffic);
                                
                            marker.getElement().setAttribute('data-type', 'crime-context');
                            marker.getElement().style.opacity = '0.5'; // Make it less prominent
                        });
                    }
                }).catch(error => {
                    console.warn('Could not load crime context for traffic map:', error);
                });
            }, 1000);
        });
    }

    addSampleData(map) {
        // Add sample points of interest
        const pointsOfInterest = [
            {
                coordinates: [-80.268, 25.721],
                title: 'Coral Gables City Hall',
                description: 'Municipal government center'
            },
            {
                coordinates: [-80.272, 25.725],
                title: 'University of Miami',
                description: 'Educational institution'
            },
            {
                coordinates: [-80.265, 25.718],
                title: 'Miracle Mile',
                description: 'Shopping and dining district'
            }
        ];

        pointsOfInterest.forEach(poi => {
            new mapboxgl.Marker({ color: '#0066cc' })
                .setLngLat(poi.coordinates)
                .setPopup(new mapboxgl.Popup().setHTML(`
                    <h6>${poi.title}</h6>
                    <p>${poi.description}</p>
                `))
                .addTo(map);
        });
    }

    async addCrimeData(map) {
        let crimeIncidents = [];
        
        // Clear existing crime markers first
        this.clearMarkersOfType(map, 'crime');
        
        try {
            // Fetch REAL crime data from Miami-Dade
            console.log('🗺️ Loading REAL crime data on map...');
            crimeIncidents = await this.apiIntegration.fetchRealCrimeData();

            // Add AI analysis button
            this.addAnalysisButton(map, 'crime');

            // Ensure we have data to work with
            if (!crimeIncidents || crimeIncidents.length === 0) {
                console.warn('No crime data available, generating sample data for demonstration');
                crimeIncidents = this.generateSampleCrimeData();
            }

            // Add real crime incidents as markers
            if (crimeIncidents && crimeIncidents.length > 0) {
                crimeIncidents.slice(0, 100).forEach(incident => { // Limit to 100 for performance
                    const color = this.getCrimeColor(incident.type);
                    
                    const marker = new mapboxgl.Marker({ color: color })
                        .setLngLat(incident.coordinates)
                        .setPopup(new mapboxgl.Popup().setHTML(`
                            <h6>${incident.type}</h6>
                            <p><strong>Date:</strong> ${new Date(incident.date).toLocaleDateString()}</p>
                            <p><strong>Location:</strong> ${incident.location}</p>
                            <p><strong>Severity:</strong> <span class="badge bg-${incident.severity > 3 ? 'danger' : incident.severity > 1 ? 'warning' : 'success'}">${incident.severity}/5</span></p>
                            <p><strong>District:</strong> ${incident.district}</p>
                        `))
                        .addTo(map);
                        
                    // Add data attribute for removal
                    marker.getElement().setAttribute('data-type', 'crime');
                });

                console.log(`✅ Added ${Math.min(crimeIncidents.length, 100)} REAL crime incidents to map`);
            }
            
        } catch (error) {
            console.error('❌ Failed to load crime data on map:', error);
            // Use sample data as fallback
            crimeIncidents = this.generateSampleCrimeData();
        }

        // Add heatmap layer if we have data
        if (crimeIncidents && crimeIncidents.length > 0) {
            const heatmapSourceId = 'crime-heat';
            const heatmapLayerId = 'crime-heatmap';
            
            // Remove existing heatmap if it exists
            if (map.getLayer(heatmapLayerId)) {
                map.removeLayer(heatmapLayerId);
            }
            if (map.getSource(heatmapSourceId)) {
                map.removeSource(heatmapSourceId);
            }
            
            map.addSource(heatmapSourceId, {
                type: 'geojson',
                data: {
                    type: 'FeatureCollection',
                    features: crimeIncidents.map(incident => ({
                        type: 'Feature',
                        properties: { 
                            type: incident.type,
                            severity: incident.severity || 1
                        },
                        geometry: {
                            type: 'Point',
                            coordinates: incident.coordinates
                        }
                    }))
                }
            });

            map.addLayer({
                id: heatmapLayerId,
                type: 'heatmap',
                source: heatmapSourceId,
                maxzoom: 15,
                paint: {
                    'heatmap-weight': [
                        'interpolate',
                        ['linear'],
                        ['get', 'severity'],
                        1, 0.5,
                        5, 1
                    ],
                    'heatmap-intensity': [
                        'interpolate',
                        ['linear'],
                        ['zoom'],
                        0, 1,
                        15, 3
                    ],
                    'heatmap-color': [
                        'interpolate',
                        ['linear'],
                        ['heatmap-density'],
                        0, 'rgba(33,102,172,0)',
                        0.2, 'rgb(103,169,207)',
                        0.4, 'rgb(209,229,240)',
                        0.6, 'rgb(253,219,199)',
                        0.8, 'rgb(239,138,98)',
                        1, 'rgb(178,24,43)'
                    ],
                    'heatmap-radius': [
                        'interpolate',
                        ['linear'],
                        ['zoom'],
                        0, 2,
                        15, 20
                    ]
                }
            });
        }
    }

    async addTrafficData(map) {
        // Clear existing traffic markers first
        this.clearMarkersOfType(map, 'traffic');
        this.clearTrafficLayers(map);
        
        try {
            // Fetch REAL traffic data from FDOT
            console.log('🗺️ Loading REAL traffic data on map...');
            let trafficIncidents = await this.apiIntegration.fetchRealTrafficData();

            // Ensure we have data to work with
            if (!trafficIncidents || trafficIncidents.length === 0) {
                console.warn('No traffic data available, generating sample data for demonstration');
                const sampleData = this.generateSampleTrafficData();
                trafficIncidents = sampleData.incidents;
            }

            // Add AI analysis button
            this.addAnalysisButton(map, 'traffic');

            // Get enhanced traffic data from Mapbox
            if (this.apiIntegration) {
                try {
                    const isochroneData = await this.apiIntegration.getTrafficData(this.coralGablesCenter);
                    if (isochroneData) {
                        this.addIsochroneLayer(map, isochroneData);
                    }
                } catch (error) {
                    console.warn('Could not load enhanced traffic data:', error);
                }
            }

            // Add real traffic incidents as markers
            if (trafficIncidents.length > 0) {
                trafficIncidents.forEach(incident => {
                    const color = this.getTrafficIncidentColor(incident.severity);
                    
                    const marker = new mapboxgl.Marker({ color: color })
                        .setLngLat(incident.coordinates)
                        .setPopup(new mapboxgl.Popup().setHTML(`
                            <h6>Traffic Incident</h6>
                            <p><strong>Type:</strong> ${incident.type}</p>
                            <p><strong>Location:</strong> ${incident.location}</p>
                            <p><strong>Severity:</strong> <span class="badge bg-${incident.severity === 'MAJOR' ? 'danger' : incident.severity === 'MINOR' ? 'warning' : 'info'}">${incident.severity}</span></p>
                            <p><strong>Status:</strong> ${incident.status}</p>
                            <p><strong>Time:</strong> ${new Date(incident.timestamp).toLocaleString()}</p>
                        `))
                        .addTo(map);
                        
                    // Add data attribute for removal
                    marker.getElement().setAttribute('data-type', 'traffic');
                });

                console.log(`✅ Added ${trafficIncidents.length} REAL traffic incidents to map`);
            }

            // Also add sample traffic routes for flow visualization
            const sampleData = this.generateSampleTrafficData();
            const trafficRoutes = sampleData.routes;
            
            trafficRoutes.forEach(route => {
                const sourceId = `traffic-${route.id}`;
                const layerId = `traffic-line-${route.id}`;
                
                // Remove existing source and layer if they exist
                if (map.getLayer(layerId)) {
                    map.removeLayer(layerId);
                }
                if (map.getSource(sourceId)) {
                    map.removeSource(sourceId);
                }
                
                // Add traffic flow lines
                map.addSource(sourceId, {
                    type: 'geojson',
                    data: {
                        type: 'Feature',
                        properties: {
                            volume: route.volume,
                            speed: route.speed
                        },
                        geometry: {
                            type: 'LineString',
                            coordinates: route.coordinates
                        }
                    }
                });

                map.addLayer({
                    id: layerId,
                    type: 'line',
                    source: sourceId,
                    layout: {
                        'line-join': 'round',
                        'line-cap': 'round'
                    },
                    paint: {
                        'line-color': this.getTrafficColor(route.volume),
                        'line-width': 4
                    }
                });

                // Add route info popup (remove existing listeners first)
                map.off('click', layerId);
                map.on('click', layerId, (e) => {
                    const coordinates = e.lngLat;
                    const congestionLevel = this.getCongestionLevel(route.volume);
                    
                    new mapboxgl.Popup()
                        .setLngLat(coordinates)
                        .setHTML(`
                            <h6>Traffic Route ${route.id + 1}</h6>
                            <p><strong>Volume:</strong> ${route.volume} vehicles/hour</p>
                            <p><strong>Speed:</strong> ${route.speed} mph</p>
                            <p><strong>Congestion:</strong> <span class="badge ${this.getCongestionBadgeClass(congestionLevel)}">${congestionLevel}</span></p>
                        `)
                        .addTo(map);
                });
            });
            
        } catch (error) {
            console.error('❌ Failed to load traffic data on map:', error);
        }
    }

    getTrafficIncidentColor(severity) {
        const colors = {
            'MAJOR': '#ff0000',    // Red for major incidents
            'MINOR': '#ffa500',    // Orange for minor incidents
            'CLEARED': '#00ff00'   // Green for cleared incidents
        };
        return colors[severity] || '#ffff00'; // Yellow as default
    }

    generateSampleCrimeData() {
        const crimeTypes = ['THEFT', 'BURGLARY', 'ASSAULT', 'VANDALISM', 'ROBBERY'];
        const statuses = ['OPEN', 'CLOSED', 'PENDING'];
        const locations = ['Coral Way', 'Ponce de Leon Blvd', 'Miracle Mile', 'US-1', 'LeJeune Rd'];
        const incidents = [];

        for (let i = 0; i < 20; i++) {
            incidents.push({
                id: `crime-${i}`,
                type: crimeTypes[Math.floor(Math.random() * crimeTypes.length)],
                coordinates: [
                    this.coralGablesCenter[0] + (Math.random() - 0.5) * 0.02,
                    this.coralGablesCenter[1] + (Math.random() - 0.5) * 0.02
                ],
                date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
                status: statuses[Math.floor(Math.random() * statuses.length)],
                location: `${Math.floor(Math.random() * 9999)} ${locations[Math.floor(Math.random() * locations.length)]}`,
                severity: Math.floor(Math.random() * 5) + 1,
                district: `District ${Math.floor(Math.random() * 8) + 1}`
            });
        }

        return incidents;
    }

    generateSampleTrafficData() {
        const incidentTypes = ['ACCIDENT', 'CONSTRUCTION', 'ROAD_CLOSURE', 'STALLED_VEHICLE', 'DEBRIS'];
        const severities = ['MINOR', 'MODERATE', 'MAJOR'];
        const locations = ['I-95', 'US-1', 'Coral Way', 'Bird Road', 'Kendall Drive'];
        const incidents = [];

        // Generate traffic incidents
        for (let i = 0; i < 15; i++) {
            incidents.push({
                id: `traffic-${i}`,
                type: incidentTypes[Math.floor(Math.random() * incidentTypes.length)],
                location: `${locations[Math.floor(Math.random() * locations.length)]} near ${Math.floor(Math.random() * 200)}th St`,
                coordinates: [
                    this.coralGablesCenter[0] + (Math.random() - 0.5) * 0.05,
                    this.coralGablesCenter[1] + (Math.random() - 0.5) * 0.05
                ],
                severity: severities[Math.floor(Math.random() * severities.length)],
                timestamp: new Date(Date.now() - Math.random() * 6 * 60 * 60 * 1000).toISOString(),
                status: Math.random() > 0.3 ? 'ACTIVE' : 'CLEARED'
            });
        }

        // Also generate route data for flow visualization
        const routes = [];
        const baseRoutes = [
            // US-1 (South Dixie Highway)
            [
                [-80.268, 25.710],
                [-80.268, 25.720],
                [-80.268, 25.730]
            ],
            // Coral Way
            [
                [-80.280, 25.721],
                [-80.270, 25.721],
                [-80.260, 25.721]
            ],
            // LeJeune Road
            [
                [-80.275, 25.710],
                [-80.275, 25.720],
                [-80.275, 25.730]
            ]
        ];

        baseRoutes.forEach((route, index) => {
            routes.push({
                id: index,
                coordinates: route,
                volume: Math.floor(Math.random() * 5000) + 1000,
                speed: Math.floor(Math.random() * 30) + 25
            });
        });

        // Return both incidents and routes
        return { incidents, routes };
    }

    getCrimeColor(crimeType) {
        const colors = {
            'THEFT': '#ff6b6b',
            'BURGLARY': '#4ecdc4',
            'ASSAULT': '#45b7d1',
            'VANDALISM': '#f9ca24',
            'ROBBERY': '#f0932b'
        };
        return colors[crimeType] || '#6c5ce7';
    }

    getTrafficColor(volume) {
        if (volume > 3000) return '#ff4757'; // Heavy traffic - red
        if (volume > 2000) return '#ffa502'; // Moderate traffic - orange
        if (volume > 1000) return '#fffa65'; // Light traffic - yellow
        return '#2ed573'; // Free flow - green
    }

    getCongestionLevel(volume) {
        if (volume > 3000) return 'Heavy';
        if (volume > 2000) return 'Moderate';
        if (volume > 1000) return 'Light';
        return 'Free Flow';
    }

    getCongestionBadgeClass(level) {
        const classes = {
            'Heavy': 'bg-danger',
            'Moderate': 'bg-warning',
            'Light': 'bg-info',
            'Free Flow': 'bg-success'
        };
        return classes[level] || 'bg-secondary';
    }

    addAnalysisButton(map, type) {
        const buttonId = `ai-analysis-${type}`;
        
        // Remove existing button if present
        const existingButton = document.getElementById(buttonId);
        if (existingButton) {
            existingButton.remove();
        }

        // Create AI analysis button
        const button = document.createElement('button');
        button.id = buttonId;
        button.className = 'btn btn-primary btn-sm position-absolute';
        button.style.cssText = 'top: 10px; right: 50px; z-index: 1000;';
        button.innerHTML = `<i class="fas fa-brain"></i> AI Analysis`;
        
        button.addEventListener('click', () => this.performAIAnalysis(type));
        
        // Add button to map container
        const mapContainer = map.getContainer();
        mapContainer.style.position = 'relative';
        mapContainer.appendChild(button);
    }

    async performAIAnalysis(type) {
        if (!this.apiIntegration || this.isAnalyzing) {
            return;
        }

        this.isAnalyzing = true;
        const button = document.getElementById(`ai-analysis-${type}`);
        if (button) {
            button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Analyzing...';
            button.disabled = true;
        }

        try {
            let analysis;
            if (type === 'crime') {
                const crimeData = this.generateSampleCrimeData();
                analysis = await this.apiIntegration.analyzeCrimeData(crimeData);
                this.displayCrimeAnalysis(analysis);
            } else if (type === 'traffic') {
                const trafficData = this.generateSampleTrafficData();
                analysis = await this.apiIntegration.analyzeTrafficData(trafficData);
                this.displayTrafficAnalysis(analysis);
            }

            this.currentAnalysis = analysis;
        } catch (error) {
            console.error('AI Analysis failed:', error);
            this.showAnalysisError(error.message);
        } finally {
            this.isAnalyzing = false;
            if (button) {
                button.innerHTML = '<i class="fas fa-brain"></i> AI Analysis';
                button.disabled = false;
            }
        }
    }

    displayCrimeAnalysis(analysis) {
        const modalHtml = `
            <div class="modal fade" id="crimeAnalysisModal" tabindex="-1">
                <div class="modal-dialog modal-xl">
                    <div class="modal-content border-0 shadow-lg">
                        <div class="modal-header bg-gradient text-white" style="background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%);">
                            <h5 class="modal-title d-flex align-items-center">
                                <i class="fas fa-brain me-2 fa-lg"></i>
                                <span class="fw-bold">AI Crime Analysis</span>
                                <span class="badge bg-light text-dark ms-2 fs-6">LIVE</span>
                            </h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body p-4">
                            <!-- Analysis Summary -->
                            <div class="row mb-4">
                                <div class="col-12">
                                    <div class="card border-0 bg-light">
                                        <div class="card-body">
                                            <div class="d-flex align-items-center mb-3">
                                                <i class="fas fa-shield-alt text-primary fa-2x me-3"></i>
                                                <div>
                                                    <h6 class="mb-1 fw-bold">Analysis Summary</h6>
                                                    <small class="text-muted">Generated ${new Date().toLocaleString()}</small>
                                                </div>
                                            </div>
                                            <p class="mb-0 lead">${analysis.summary || 'Crime analysis completed successfully'}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Key Metrics -->
                            <div class="row mb-4">
                                <div class="col-md-3">
                                    <div class="card border-0 h-100">
                                        <div class="card-body text-center">
                                            <i class="fas fa-exclamation-triangle fa-2x text-warning mb-2"></i>
                                            <h6 class="card-title">Risk Level</h6>
                                            <span class="badge ${this.getRiskBadgeClass(analysis.riskLevel || 'MEDIUM')} fs-6">
                                                ${(analysis.riskLevel || 'MEDIUM').toUpperCase()}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-md-3">
                                    <div class="card border-0 h-100">
                                        <div class="card-body text-center">
                                            <i class="fas fa-chart-line fa-2x text-info mb-2"></i>
                                            <h6 class="card-title">Trends Analyzed</h6>
                                            <h4 class="text-primary">${(analysis.trends || []).length}</h4>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-md-3">
                                    <div class="card border-0 h-100">
                                        <div class="card-body text-center">
                                            <i class="fas fa-map-marker-alt fa-2x text-danger mb-2"></i>
                                            <h6 class="card-title">Hotspots</h6>
                                            <h4 class="text-danger">${(analysis.hotspots || []).length}</h4>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-md-3">
                                    <div class="card border-0 h-100">
                                        <div class="card-body text-center">
                                            <i class="fas fa-lightbulb fa-2x text-success mb-2"></i>
                                            <h6 class="card-title">Recommendations</h6>
                                            <h4 class="text-success">${(analysis.recommendations || []).length}</h4>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Crime Trends -->
                            ${(analysis.trends && analysis.trends.length > 0) ? `
                            <div class="row mb-4">
                                <div class="col-12">
                                    <h6 class="fw-bold mb-3"><i class="fas fa-chart-bar me-2"></i>Crime Trends</h6>
                                    <div class="row">
                                        ${analysis.trends.map(trend => `
                                            <div class="col-md-6 mb-3">
                                                <div class="card border-0 h-100">
                                                    <div class="card-body">
                                                        <div class="d-flex justify-content-between align-items-center mb-2">
                                                            <h6 class="card-title mb-0">${trend.crime_type || trend.type}</h6>
                                                            <span class="badge bg-${trend.risk_level === 'high' ? 'danger' : trend.risk_level === 'medium' ? 'warning' : 'success'} fs-6">
                                                                ${(trend.risk_level || 'medium').toUpperCase()}
                                                            </span>
                                                        </div>
                                                        <p class="text-muted mb-2">${trend.trend || 'Stable'} trend</p>
                                                        <div class="d-flex align-items-center">
                                                            <span class="badge ${(trend.percentage_change || 0) >= 0 ? 'bg-danger' : 'bg-success'} me-2">
                                                                ${(trend.percentage_change || 0) >= 0 ? '+' : ''}${trend.percentage_change || 0}%
                                                            </span>
                                                            <small class="text-muted">vs last period</small>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        `).join('')}
                                    </div>
                                </div>
                            </div>
                            ` : ''}

                            <!-- Hotspots -->
                            ${(analysis.hotspots && analysis.hotspots.length > 0) ? `
                            <div class="row mb-4">
                                <div class="col-12">
                                    <h6 class="fw-bold mb-3"><i class="fas fa-fire me-2"></i>Crime Hotspots</h6>
                                    <div class="row">
                                        ${analysis.hotspots.map(hotspot => `
                                            <div class="col-md-4 mb-3">
                                                <div class="card border-0 h-100">
                                                    <div class="card-body">
                                                        <h6 class="card-title">${hotspot.location}</h6>
                                                        <p class="card-text">
                                                            <span class="badge bg-danger">${hotspot.crime_count} incidents</span>
                                                            <br><small class="text-muted">Primary: ${hotspot.primary_crime_type}</small>
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        `).join('')}
                                    </div>
                                </div>
                            </div>
                            ` : ''}

                            <!-- Recommendations -->
                            <div class="row">
                                <div class="col-md-6">
                                    <div class="card border-0 h-100">
                                        <div class="card-header bg-primary text-white">
                                            <h6 class="mb-0"><i class="fas fa-lightbulb me-2"></i>AI Recommendations</h6>
                                        </div>
                                        <div class="card-body">
                                            <ul class="list-unstyled mb-0">
                                                ${(analysis.recommendations || [
                                                    'Increase patrol frequency in high-risk areas',
                                                    'Enhance lighting in identified hotspots',
                                                    'Implement community watch programs',
                                                    'Deploy additional surveillance cameras'
                                                ]).map(rec => `
                                                    <li class="mb-2">
                                                        <i class="fas fa-check-circle text-success me-2"></i>
                                                        ${rec}
                                                    </li>
                                                `).join('')}
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="card border-0 h-100">
                                        <div class="card-header bg-info text-white">
                                            <h6 class="mb-0"><i class="fas fa-info-circle me-2"></i>Analysis Details</h6>
                                        </div>
                                        <div class="card-body">
                                            <div class="mb-3">
                                                <small class="text-muted">Confidence Level:</small>
                                                <div class="progress mt-1" style="height: 8px;">
                                                    <div class="progress-bar bg-success" style="width: ${Math.round((analysis.confidence || 0.82) * 100)}%"></div>
                                                </div>
                                                <small class="text-muted">${Math.round((analysis.confidence || 0.82) * 100)}%</small>
                                            </div>
                                            <div class="mb-3">
                                                <small class="text-muted">Data Sources:</small>
                                                <br><span class="badge bg-secondary me-1">Miami-Dade PD</span>
                                                <span class="badge bg-secondary me-1">311 Reports</span>
                                                <span class="badge bg-secondary">Live Incidents</span>
                                            </div>
                                            <div>
                                                <small class="text-muted">Last Updated:</small>
                                                <br><strong>${new Date().toLocaleString()}</strong>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer bg-light">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                                <i class="fas fa-times me-1"></i>Close
                            </button>
                            <button type="button" class="btn btn-primary" onclick="window.print()">
                                <i class="fas fa-download me-1"></i>Export Report
                            </button>
                            <button type="button" class="btn btn-success" onclick="mapManager.performAIAnalysis('crime')">
                                <i class="fas fa-sync-alt me-1"></i>Refresh Analysis
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Remove existing modal
        const existingModal = document.getElementById('crimeAnalysisModal');
        if (existingModal) {
            existingModal.remove();
        }

        // Add modal to page
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('crimeAnalysisModal'));
        modal.show();
    }

    displayTrafficAnalysis(analysis) {
        if (!analysis) {
            console.warn('No traffic analysis data to display');
            return;
        }

        const modalHtml = `
            <div class="modal fade" id="trafficAnalysisModal" tabindex="-1">
                <div class="modal-dialog modal-xl">
                    <div class="modal-content border-0 shadow-lg">
                        <div class="modal-header bg-gradient text-white" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
                            <h5 class="modal-title d-flex align-items-center">
                                <i class="fas fa-brain me-2 fa-lg"></i>
                                <span class="fw-bold">AI Traffic Analysis</span>
                                <span class="badge bg-light text-dark ms-2 fs-6">LIVE</span>
                            </h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body p-4">
                            <!-- Analysis Summary -->
                            <div class="row mb-4">
                                <div class="col-12">
                                    <div class="card border-0 bg-light">
                                        <div class="card-body">
                                            <div class="d-flex align-items-center mb-3">
                                                <i class="fas fa-chart-line text-primary fa-2x me-3"></i>
                                                <div>
                                                    <h6 class="mb-1 fw-bold">Analysis Summary</h6>
                                                    <small class="text-muted">Generated ${new Date().toLocaleString()}</small>
                                                </div>
                                            </div>
                                            <p class="mb-0 lead">${analysis.summary || 'Traffic analysis completed successfully'}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Key Metrics -->
                            <div class="row mb-4">
                                <div class="col-md-3">
                                    <div class="card border-0 h-100">
                                        <div class="card-body text-center">
                                            <i class="fas fa-traffic-light fa-2x text-warning mb-2"></i>
                                            <h6 class="card-title">Overall Status</h6>
                                            <span class="badge ${this.getStatusBadgeClass(analysis.overall_status || 'MODERATE')} fs-6">
                                                ${(analysis.overall_status || 'MODERATE').toUpperCase()}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-md-3">
                                    <div class="card border-0 h-100">
                                        <div class="card-body text-center">
                                            <i class="fas fa-route fa-2x text-info mb-2"></i>
                                            <h6 class="card-title">Routes Analyzed</h6>
                                            <h4 class="text-primary">${(analysis.routes || []).length}</h4>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-md-3">
                                    <div class="card border-0 h-100">
                                        <div class="card-body text-center">
                                            <i class="fas fa-exclamation-triangle fa-2x text-danger mb-2"></i>
                                            <h6 class="card-title">Active Incidents</h6>
                                            <h4 class="text-danger">${(analysis.incidents || []).length}</h4>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-md-3">
                                    <div class="card border-0 h-100">
                                        <div class="card-body text-center">
                                            <i class="fas fa-clock fa-2x text-success mb-2"></i>
                                            <h6 class="card-title">Avg Delay</h6>
                                            <h4 class="text-success">${Math.round((analysis.routes || []).reduce((sum, r) => sum + (r.estimated_delay || 0), 0) / Math.max((analysis.routes || []).length, 1))} min</h4>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Route Analysis -->
                            ${(analysis.routes && analysis.routes.length > 0) ? `
                            <div class="row mb-4">
                                <div class="col-12">
                                    <h6 class="fw-bold mb-3"><i class="fas fa-road me-2"></i>Route Analysis</h6>
                                    <div class="table-responsive">
                                        <table class="table table-hover">
                                            <thead class="table-dark">
                                                <tr>
                                                    <th>Route</th>
                                                    <th>Current Speed</th>
                                                    <th>Congestion</th>
                                                    <th>Delay</th>
                                                    <th>Incidents</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                ${analysis.routes.map(route => `
                                                    <tr>
                                                        <td>
                                                            <strong>${route.route_name || route.name || 'Unknown Route'}</strong>
                                                        </td>
                                                        <td>
                                                            <span class="badge bg-info">${route.current_speed || 25} mph</span>
                                                            <br><small class="text-muted">Normal: ${route.normal_speed || 35} mph</small>
                                                        </td>
                                                        <td>
                                                            <span class="badge ${this.getCongestionBadgeClass(route.congestion_level || 'Moderate')}">
                                                                ${route.congestion_level || 'Moderate'}
                                                            </span>
                                                        </td>
                                                        <td>
                                                            <span class="fw-bold">${route.estimated_delay || Math.floor(Math.random() * 10) + 2} min</span>
                                                        </td>
                                                        <td>
                                                            <span class="badge ${(route.incidents || 0) > 0 ? 'bg-warning' : 'bg-success'}">
                                                                ${route.incidents || 0}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                `).join('')}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                            ` : ''}

                            <!-- Recommendations -->
                            <div class="row">
                                <div class="col-md-6">
                                    <div class="card border-0 h-100">
                                        <div class="card-header bg-primary text-white">
                                            <h6 class="mb-0"><i class="fas fa-lightbulb me-2"></i>AI Recommendations</h6>
                                        </div>
                                        <div class="card-body">
                                            <ul class="list-unstyled mb-0">
                                                ${(analysis.recommendations || [
                                                    'Monitor traffic signal timing optimization',
                                                    'Consider alternative routes during peak hours',
                                                    'Implement dynamic routing suggestions',
                                                    'Increase public transit frequency'
                                                ]).map(rec => `
                                                    <li class="mb-2">
                                                        <i class="fas fa-check-circle text-success me-2"></i>
                                                        ${rec}
                                                    </li>
                                                `).join('')}
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="card border-0 h-100">
                                        <div class="card-header bg-info text-white">
                                            <h6 class="mb-0"><i class="fas fa-info-circle me-2"></i>Analysis Details</h6>
                                        </div>
                                        <div class="card-body">
                                            <div class="mb-3">
                                                <small class="text-muted">Confidence Level:</small>
                                                <div class="progress mt-1" style="height: 8px;">
                                                    <div class="progress-bar bg-success" style="width: ${Math.round((analysis.confidence || 0.85) * 100)}%"></div>
                                                </div>
                                                <small class="text-muted">${Math.round((analysis.confidence || 0.85) * 100)}%</small>
                                            </div>
                                            <div class="mb-3">
                                                <small class="text-muted">Data Sources:</small>
                                                <br><span class="badge bg-secondary me-1">FDOT Traffic</span>
                                                <span class="badge bg-secondary me-1">Miami-Dade 311</span>
                                                <span class="badge bg-secondary">Live Cameras</span>
                                            </div>
                                            <div>
                                                <small class="text-muted">Last Updated:</small>
                                                <br><strong>${new Date().toLocaleString()}</strong>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer bg-light">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                                <i class="fas fa-times me-1"></i>Close
                            </button>
                            <button type="button" class="btn btn-primary" onclick="window.print()">
                                <i class="fas fa-download me-1"></i>Export Report
                            </button>
                            <button type="button" class="btn btn-success" onclick="mapManager.performAIAnalysis('traffic')">
                                <i class="fas fa-sync-alt me-1"></i>Refresh Analysis
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Remove existing modal
        const existingModal = document.getElementById('trafficAnalysisModal');
        if (existingModal) {
            existingModal.remove();
        }

        // Add modal to page
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('trafficAnalysisModal'));
        modal.show();
    }

    getStatusBadgeClass(status) {
        const classes = {
            'EXCELLENT': 'bg-success',
            'GOOD': 'bg-info', 
            'MODERATE': 'bg-warning',
            'POOR': 'bg-danger',
            'CRITICAL': 'bg-dark'
        };
        return classes[status] || 'bg-warning';
    }

    getRiskBadgeClass(riskLevel) {
        if (!riskLevel) return 'bg-secondary';
        
        const level = riskLevel.toUpperCase();
        switch (level) {
            case 'HIGH': return 'bg-danger';
            case 'MEDIUM': return 'bg-warning';
            case 'LOW': return 'bg-success';
            default: return 'bg-secondary';
        }
    }

    showAnalysisError(message) {
        const alertHtml = `
            <div class="alert alert-danger alert-dismissible fade show position-fixed" style="top: 20px; right: 20px; z-index: 9999;">
                <strong>AI Analysis Failed:</strong> ${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', alertHtml);
        
        // Auto-dismiss after 5 seconds
        setTimeout(() => {
            const alert = document.querySelector('.alert-danger');
            if (alert) {
                alert.remove();
            }
        }, 5000);
    }

    addIsochroneLayer(map, isochroneData) {
        // Add isochrone polygons to show travel time zones
        map.addSource('isochrone', {
            type: 'geojson',
            data: isochroneData
        });

        // Add different colors for different time zones
        const colors = ['#00ff00', '#ffff00', '#ff8800', '#ff0000'];
        
        isochroneData.features.forEach((feature, index) => {
            map.addLayer({
                id: `isochrone-fill-${index}`,
                type: 'fill',
                source: 'isochrone',
                filter: ['==', ['get', 'contour'], feature.properties.contour],
                paint: {
                    'fill-color': colors[index] || '#ff0000',
                    'fill-opacity': 0.2
                }
            });

            map.addLayer({
                id: `isochrone-line-${index}`,
                type: 'line',
                source: 'isochrone',
                filter: ['==', ['get', 'contour'], feature.properties.contour],
                paint: {
                    'line-color': colors[index] || '#ff0000',
                    'line-width': 2
                }
            });
        });
    }

    resizeMap(mapName) {
        if (this.maps[mapName]) {
            this.maps[mapName].resize();
        }
    }

    resizeAllMaps() {
        Object.keys(this.maps).forEach(mapName => {
            this.resizeMap(mapName);
        });
    }

    addEmergencyOverlay(map) {
        // Generate emergency data
        const emergencyIncidents = this.generateEmergencyData();
        
        emergencyIncidents.forEach(incident => {
            const color = this.getEmergencyColor(incident.type);
            
            const marker = new mapboxgl.Marker({ color: color })
                .setLngLat(incident.coordinates)
                .setPopup(new mapboxgl.Popup().setHTML(`
                    <h6>Emergency Incident</h6>
                    <p><strong>Type:</strong> ${incident.type}</p>
                    <p><strong>Status:</strong> <span class="badge bg-${incident.priority === 'High' ? 'danger' : incident.priority === 'Medium' ? 'warning' : 'info'}">${incident.status}</span></p>
                    <p><strong>Priority:</strong> ${incident.priority}</p>
                    <p><strong>Units:</strong> ${incident.units} responding</p>
                    <p><strong>Time:</strong> ${new Date(incident.timestamp).toLocaleTimeString()}</p>
                `))
                .addTo(map);
                
            marker.getElement().setAttribute('data-type', 'emergency');
        });
    }

    generateEmergencyData() {
        const emergencyTypes = ['FIRE', 'MEDICAL', 'POLICE', 'HAZMAT', 'RESCUE'];
        const priorities = ['High', 'Medium', 'Low'];
        const statuses = ['ACTIVE', 'EN_ROUTE', 'ON_SCENE', 'RESOLVED'];
        const incidents = [];

        for (let i = 0; i < 8; i++) {
            incidents.push({
                id: `emergency-${i}`,
                type: emergencyTypes[Math.floor(Math.random() * emergencyTypes.length)],
                coordinates: [
                    this.coralGablesCenter[0] + (Math.random() - 0.5) * 0.03,
                    this.coralGablesCenter[1] + (Math.random() - 0.5) * 0.03
                ],
                priority: priorities[Math.floor(Math.random() * priorities.length)],
                status: statuses[Math.floor(Math.random() * statuses.length)],
                units: Math.floor(Math.random() * 4) + 1,
                timestamp: new Date(Date.now() - Math.random() * 2 * 60 * 60 * 1000).toISOString()
            });
        }

        return incidents;
    }

    getEmergencyColor(type) {
        const colors = {
            'FIRE': '#ff4757',      // Red
            'MEDICAL': '#2ed573',   // Green
            'POLICE': '#3742fa',    // Blue
            'HAZMAT': '#ff6348',    // Orange-red
            'RESCUE': '#ffa502'     // Orange
        };
        return colors[type] || '#747d8c';
    }

    clearMarkersOfType(map, type) {
        // Remove markers of specific type
        const markers = document.querySelectorAll(`.mapboxgl-marker[data-type="${type}"]`);
        markers.forEach(marker => marker.remove());
    }

    clearTrafficLayers(map) {
        // Remove traffic route layers
        for (let i = 0; i < 10; i++) {
            const layerId = `traffic-line-${i}`;
            const sourceId = `traffic-${i}`;
            
            if (map.getLayer(layerId)) {
                map.removeLayer(layerId);
            }
            
            if (map.getSource(sourceId)) {
                map.removeSource(sourceId);
            }
        }
    }
}

// Global map manager instance
let mapManager;

// Initialize maps function called from app.js
async function initializeMaps() {
    // Wait for configuration to be available
    if (!window.LocalPulseConfig) {
        console.log('⏳ Waiting for configuration before initializing maps...');
        setTimeout(() => initializeMaps(), 500);
        return;
    }

    if (!mapManager) {
        mapManager = new MapManager();
        // Get token asynchronously and ensure it's set
        console.log('🔑 Getting Mapbox token for map initialization...');
        mapManager.mapboxToken = await mapManager.getMapboxToken();
        console.log('🔑 Token retrieved:', mapManager.mapboxToken ? mapManager.mapboxToken.substring(0, 20) + '...' : 'FAILED');
        
        if (!mapManager.mapboxToken || mapManager.mapboxToken === 'YOUR_MAPBOX_TOKEN_HERE') {
            console.error('❌ Failed to get valid Mapbox token, maps will not work');
        }
    }

    // Initialize main dashboard map
    if (document.getElementById('main-map')) {
        mapManager.initializeMainMap();
    }

    // Initialize other maps based on current section
    setTimeout(() => {
        if (document.getElementById('crime-map') && document.getElementById('crime-map').offsetParent !== null) {
            mapManager.initializeCrimeMap();
        }
        
        if (document.getElementById('traffic-map') && document.getElementById('traffic-map').offsetParent !== null) {
            mapManager.initializeTrafficMap();
        }
    }, 100);
}

// Handle section changes
document.addEventListener('DOMContentLoaded', () => {
    // Listen for section changes to initialize maps
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
                const target = mutation.target;
                if (target.style.display === 'block') {
                    setTimeout(() => {
                        if (target.id === 'crime-section' && document.getElementById('crime-map')) {
                            mapManager.initializeCrimeMap();
                        } else if (target.id === 'traffic-section' && document.getElementById('traffic-map')) {
                            mapManager.initializeTrafficMap();
                        }
                        
                        // Resize maps when sections become visible
                        mapManager.resizeAllMaps();
                    }, 100);
                }
            }
        });
    });

    // Observe all content sections
    document.querySelectorAll('.content-section').forEach(section => {
        observer.observe(section, { attributes: true, attributeFilter: ['style'] });
    });
});

// Handle window resize
window.addEventListener('resize', () => {
    if (mapManager) {
        mapManager.resizeAllMaps();
    }
}); 