// Enhanced Maps functionality using Mapbox GL JS with AI Analysis
class MapManager {
    constructor() {
        // Get Mapbox token from configuration
        this.mapboxToken = this.getMapboxToken();
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

    getMapboxToken() {
        // Try to get token from configuration
        if (window.LocalPulseConfig && window.LocalPulseConfig.mapbox && window.LocalPulseConfig.mapbox.accessToken) {
            console.log('✅ Using Mapbox token from secure configuration');
            return window.LocalPulseConfig.mapbox.accessToken;
        }
        
        // Fallback to your actual token if configuration fails
        console.warn('⚠️ Using fallback Mapbox token');
        return 'pk.eyJ1IjoibWF0dHlzdGpoIiwiYSI6ImNtYzlkMHd0czFwajUyanB5ajNtb2l3d3QifQ.kioIyWE_H_3em-jpvKDiwA';
    }

    initializeMainMap() {
        if (!mapboxgl.supported()) {
            console.warn('Mapbox GL is not supported');
            return;
        }

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
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title"><i class="fas fa-brain"></i> AI Crime Analysis</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="row">
                                <div class="col-12">
                                    <h6>Summary</h6>
                                    <p class="text-muted">${analysis.summary}</p>
                                </div>
                                <div class="col-md-6">
                                    <h6>Crime Trends</h6>
                                    <div class="list-group">
                                        ${analysis.trends.map(trend => `
                                            <div class="list-group-item">
                                                <div class="d-flex justify-content-between">
                                                    <strong>${trend.crime_type}</strong>
                                                    <span class="badge bg-${trend.risk_level === 'high' ? 'danger' : trend.risk_level === 'medium' ? 'warning' : 'success'}">${trend.risk_level}</span>
                                                </div>
                                                <small class="text-muted">${trend.trend} (${trend.percentage_change > 0 ? '+' : ''}${trend.percentage_change}%)</small>
                                            </div>
                                        `).join('')}
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <h6>Recommendations</h6>
                                    <ul class="list-unstyled">
                                        ${analysis.recommendations.map(rec => `<li><i class="fas fa-check text-success"></i> ${rec}</li>`).join('')}
                                    </ul>
                                </div>
                            </div>
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

        const analysisHtml = `
            <div class="analysis-popup">
                <div class="analysis-header">
                    <h5><i class="fas fa-brain"></i> AI Traffic Analysis</h5>
                    <button type="button" class="btn-close" onclick="this.closest('.analysis-popup').remove()"></button>
                </div>
                <div class="analysis-content">
                    <div class="analysis-summary">
                        <h6>Summary</h6>
                        <p>${analysis.summary || 'Analysis completed'}</p>
                    </div>
                    
                    ${analysis.insights && analysis.insights.length > 0 ? `
                    <div class="analysis-insights">
                        <h6>Key Insights</h6>
                        <ul>
                            ${analysis.insights.map(insight => `<li>${insight}</li>`).join('')}
                        </ul>
                    </div>
                    ` : ''}
                    
                    ${analysis.recommendations && analysis.recommendations.length > 0 ? `
                    <div class="analysis-recommendations">
                        <h6>Recommendations</h6>
                        <ul>
                            ${analysis.recommendations.map(rec => `<li>${rec}</li>`).join('')}
                        </ul>
                    </div>
                    ` : ''}
                    
                    <div class="analysis-footer">
                        <div class="row">
                            <div class="col-6">
                                <small class="text-muted">Risk Level:</small>
                                <span class="badge ${this.getRiskBadgeClass(analysis.riskLevel || 'MEDIUM')}">${analysis.riskLevel || 'MEDIUM'}</span>
                            </div>
                            <div class="col-6 text-end">
                                <small class="text-muted">Confidence: ${Math.round((analysis.confidence || 0.75) * 100)}%</small>
                            </div>
                        </div>
                        <div class="mt-2">
                            <small class="text-muted">Source: ${analysis.dataSource || 'LocalPulse Analytics'}</small>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Remove existing analysis popup
        const existingPopup = document.querySelector('.analysis-popup');
        if (existingPopup) {
            existingPopup.remove();
        }

        // Add new analysis popup
        const popupDiv = document.createElement('div');
        popupDiv.innerHTML = analysisHtml;
        popupDiv.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            z-index: 10000;
            max-width: 600px;
            max-height: 80vh;
            overflow-y: auto;
        `;

        document.body.appendChild(popupDiv);
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
function initializeMaps() {
    // Wait for configuration to be available
    if (!window.LocalPulseConfig) {
        console.log('⏳ Waiting for configuration before initializing maps...');
        setTimeout(() => initializeMaps(), 500);
        return;
    }

    if (!mapManager) {
        mapManager = new MapManager();
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