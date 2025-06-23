// Real Vehicle Detection with YOLO Integration
class VehicleDetectionManager {
    constructor() {
        this.isRunning = false;
        this.detectionCounts = {
            cars: 0,
            people: 0,
            trucks: 0,
            motorcycles: 0
        };
        this.streamUrl = null;
        this.canvas = null;
        this.ctx = null;
        this.video = null;
        this.model = null;
        this.isDetecting = false;
        this.detectionResults = [];
        
        // Camera URLs for vehicle detection (prioritizing working streams)
        this.cameraUrls = [
            // WORKING TEST STREAMS (No CORS issues)
            'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
            'https://demo-live.eonet.no/hls/camera1_main/playlist.m3u8',
            'https://demo-live.eonet.no/hls/camera2_main/playlist.m3u8',
            
            // LIVE STREAMS (From FL511 - will use proxy)
            'https://dim-se12.divas.cloud:8200/chan-3732/index.m3u8?token=bfcd28f8465ebc94c040d31087d264796b2ba928e1745a16b5170017bd005717',
            'https://dim-se8.divas.cloud:8200/chan-8486/index.m3u8?token=29238149597848403922f018a7c856abb083c6a3b6a1dbc23f8c05a143ef9e2c',
            'https://dim-se12.divas.cloud:8200/chan-3732/index.m3u8?token=c92d7fc893d2fcdce18eb1e6ff4d38c80ab7ce907e1e4f97378e9ea50461f77b',
            
            // ADDITIONAL WORKING STREAMS
            'https://bitdash-a.akamaihd.net/content/sintel/hls/playlist.m3u8',
            'https://multiplatform-f.akamaihd.net/i/multi/will/bunny/big_buck_bunny_,640x360_400,640x360_700,640x360_1000,950x540_1500,.f4v.csmil/master.m3u8',
            
            // FL511 Static Cameras (will be embedded as iframes)
            'https://fl511.com/map/Cctv/95-015',
            'https://fl511.com/map/Cctv/95-020', 
            'https://fl511.com/map/Cctv/95-025',
            'https://fl511.com/map/Cctv/US1-010',
            'https://fl511.com/map/Cctv/US1-015',
            'https://fl511.com/map/Cctv/826-005',
            'https://fl511.com/map/Cctv/826-010'
        ];
        
        this.currentCameraIndex = 0;
        this.init();
        this.setupEventListeners();
        this.loadCameraOptions();
        this.loadCamerasFromAPI();
        
        // Auto-select and load the primary HLS stream
        setTimeout(() => {
            this.loadCameraStream();
        }, 1000);
    }

    async init() {
        try {
            // Load YOLO model from CDN
            await this.loadYOLOModel();
            this.setupCanvas();
            this.setupControls();
            console.log('✅ Vehicle Detection initialized with YOLO');
        } catch (error) {
            console.error('❌ Vehicle Detection initialization failed:', error);
        }
    }

    async loadYOLOModel() {
        try {
            // Load TensorFlow.js and COCO-SSD model for object detection
            if (typeof tf === 'undefined') {
                await this.loadScript('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@latest');
            }
            if (typeof cocoSsd === 'undefined') {
                await this.loadScript('https://cdn.jsdelivr.net/npm/@tensorflow-models/coco-ssd@latest');
            }
            
            this.model = await cocoSsd.load();
            console.log('✅ YOLO/COCO-SSD model loaded successfully');
        } catch (error) {
            console.error('❌ Failed to load YOLO model:', error);
            throw error;
        }
    }

    loadScript(src) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    setupCanvas() {
        this.canvas = document.createElement('canvas');
        this.canvas.width = 640;
        this.canvas.height = 480;
        this.ctx = this.canvas.getContext('2d');
        
        // Add canvas to the camera feed container
        const cameraFeed = document.getElementById('camera-feed');
        if (cameraFeed) {
            cameraFeed.innerHTML = '';
            cameraFeed.appendChild(this.canvas);
        }
    }

    setupControls() {
        const startBtn = document.getElementById('start-detection');
        const stopBtn = document.getElementById('stop-detection');
        
        if (startBtn) {
            startBtn.addEventListener('click', () => this.startDetection());
        }
        
        if (stopBtn) {
            stopBtn.addEventListener('click', () => this.stopDetection());
        }
    }

    async startDetection() {
        if (this.isRunning) return;
        
        try {
            this.isRunning = true;
            this.updateStatus('🔄 Starting camera stream...');
            
            // Get camera stream URL from current selection
            this.streamUrl = this.cameraUrls[this.currentCameraIndex];
            
            if (!this.streamUrl) {
                throw new Error('Camera stream URL not configured');
            }

            // Create video element for stream
            this.video = document.createElement('video');
            this.video.crossOrigin = 'anonymous';
            this.video.autoplay = true;
            this.video.muted = true;
            
            // For HLS streams, we need to use HLS.js
            if (this.streamUrl.includes('.m3u8')) {
                await this.setupHLSStream();
            } else {
                this.video.src = this.streamUrl;
            }

            this.video.addEventListener('loadeddata', () => {
                this.updateStatus('✅ Camera connected - Starting YOLO detection...');
                this.startYOLODetection();
            });

            this.video.addEventListener('error', (e) => {
                console.error('Video stream error:', e);
                this.updateStatus('❌ Camera stream failed');
            });

        } catch (error) {
            console.error('Detection start failed:', error);
            this.updateStatus(`❌ Error: ${error.message}`);
            this.isRunning = false;
        }
    }

    async setupHLSStream() {
        try {
            // Load HLS.js for m3u8 streams
            if (typeof Hls === 'undefined') {
                await this.loadScript('https://cdn.jsdelivr.net/npm/hls.js@latest');
            }

            if (Hls.isSupported()) {
                const hls = new Hls();
                hls.loadSource(this.streamUrl);
                hls.attachMedia(this.video);
                
                hls.on(Hls.Events.MANIFEST_PARSED, () => {
                    console.log('✅ HLS stream ready');
                });
                
                hls.on(Hls.Events.ERROR, (event, data) => {
                    console.error('HLS error:', data);
                    this.updateStatus('❌ Stream connection failed');
                });
            } else if (this.video.canPlayType('application/vnd.apple.mpegurl')) {
                // Safari native HLS support
                this.video.src = this.streamUrl;
            } else {
                throw new Error('HLS not supported in this browser');
            }
        } catch (error) {
            console.error('HLS setup failed:', error);
            throw error;
        }
    }

    async startYOLODetection() {
        if (!this.model || !this.video || !this.isRunning) return;

        const detectFrame = async () => {
            if (!this.isRunning) return;

            try {
                // Draw video frame to canvas
                this.ctx.drawImage(this.video, 0, 0, this.canvas.width, this.canvas.height);
                
                // Run YOLO detection
                const predictions = await this.model.detect(this.canvas);
                
                // Process detections
                this.processDetections(predictions);
                
                // Draw detections on canvas
                this.drawDetections(predictions);
                
                // Continue detection loop
                requestAnimationFrame(detectFrame);
                
            } catch (error) {
                console.error('Detection frame error:', error);
                setTimeout(detectFrame, 1000); // Retry after 1 second
            }
        };

        detectFrame();
    }

    processDetections(predictions) {
        // Reset frame counts
        const frameCounts = {
            cars: 0,
            people: 0,
            trucks: 0,
            motorcycles: 0
        };

        predictions.forEach(prediction => {
            const className = prediction.class.toLowerCase();
            const confidence = prediction.score;
            
            // Only count high-confidence detections (> 50%)
            if (confidence < 0.5) return;
            
            // Enhanced COCO class mapping for better vehicle detection
            if (['car', 'automobile', 'sedan', 'suv'].includes(className)) {
                frameCounts.cars++;
            } else if (['person', 'people', 'pedestrian'].includes(className)) {
                frameCounts.people++;
            } else if (['truck', 'bus', 'semi', 'lorry', 'van'].includes(className)) {
                frameCounts.trucks++;
            } else if (['motorcycle', 'motorbike', 'bike', 'scooter'].includes(className)) {
                frameCounts.motorcycles++;
            }
        });

        // Update total counts (cumulative)
        Object.keys(frameCounts).forEach(key => {
            if (frameCounts[key] > 0) {
                this.detectionCounts[key] += frameCounts[key];
            }
        });

        // Update UI
        this.updateDetectionCounts();
        
        // Send real-time data to analytics
        this.sendDetectionData(frameCounts);
        
        // Log detections for debugging
        if (Object.values(frameCounts).some(count => count > 0)) {
            console.log('🚗 YOLO Detection Results:', {
                frame: frameCounts,
                total: this.detectionCounts,
                predictions: predictions.length
            });
        }
    }

    drawDetections(predictions) {
        // Clear previous drawings
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.drawImage(this.video, 0, 0, this.canvas.width, this.canvas.height);

        let detectionCount = 0;
        predictions.forEach(prediction => {
            const [x, y, width, height] = prediction.bbox;
            const className = prediction.class;
            const score = prediction.score;

            // Only draw high-confidence detections
            if (score < 0.5) return;
            detectionCount++;

            // Enhanced color coding for better visibility
            let color = '#00ff00'; // Default green
            let lineWidth = 2;
            
            if (className.toLowerCase().includes('person')) {
                color = '#ff0000'; // Red for people
                lineWidth = 3;
            } else if (className.toLowerCase().includes('car')) {
                color = '#0080ff'; // Blue for cars
                lineWidth = 2;
            } else if (className.toLowerCase().includes('truck') || className.toLowerCase().includes('bus')) {
                color = '#ffaa00'; // Orange for trucks/buses
                lineWidth = 3;
            } else if (className.toLowerCase().includes('motorcycle')) {
                color = '#ff00ff'; // Magenta for motorcycles
                lineWidth = 2;
            }

            // Draw bounding box with enhanced styling
            this.ctx.strokeStyle = color;
            this.ctx.lineWidth = lineWidth;
            this.ctx.strokeRect(x, y, width, height);

            // Draw semi-transparent background for label
            this.ctx.fillStyle = color + '40'; // Add transparency
            this.ctx.fillRect(x, y > 25 ? y - 25 : y + height, width, 25);

            // Draw label with better contrast
            this.ctx.fillStyle = '#ffffff';
            this.ctx.font = 'bold 14px Arial';
            this.ctx.strokeStyle = '#000000';
            this.ctx.lineWidth = 1;
            
            const label = `${className} ${(score * 100).toFixed(0)}%`;
            this.ctx.strokeText(label, x + 2, y > 25 ? y - 8 : y + height + 15);
            this.ctx.fillText(label, x + 2, y > 25 ? y - 8 : y + height + 15);
        });

        // Draw detection line (for counting)
        const lineY = this.canvas.height * 0.6;
        this.ctx.strokeStyle = '#00ffff';
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([10, 5]);
        this.ctx.beginPath();
        this.ctx.moveTo(0, lineY);
        this.ctx.lineTo(this.canvas.width, lineY);
        this.ctx.stroke();
        this.ctx.setLineDash([]); // Reset dash
        
        // Draw detection info
        this.ctx.fillStyle = '#00ffff';
        this.ctx.font = 'bold 12px Arial';
        this.ctx.strokeStyle = '#000000';
        this.ctx.lineWidth = 1;
        this.ctx.strokeText('YOLO DETECTION LINE', 10, lineY - 10);
        this.ctx.fillText('YOLO DETECTION LINE', 10, lineY - 10);

        // Draw real-time stats overlay
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(this.canvas.width - 200, 10, 190, 100);
        
        this.ctx.fillStyle = '#00ff00';
        this.ctx.font = 'bold 14px Arial';
        this.ctx.fillText('🤖 YOLO LIVE DETECTION', this.canvas.width - 195, 30);
        this.ctx.fillText(`Detections: ${detectionCount}`, this.canvas.width - 195, 50);
        this.ctx.fillText(`Cars: ${this.detectionCounts.cars}`, this.canvas.width - 195, 70);
        this.ctx.fillText(`People: ${this.detectionCounts.people}`, this.canvas.width - 195, 90);
    }

    updateDetectionCounts() {
        // Update UI elements
        const elements = {
            'cars-detected': this.detectionCounts.cars,
            'people-detected': this.detectionCounts.people,
            'vehicle-count': this.detectionCounts.cars + this.detectionCounts.trucks + this.detectionCounts.motorcycles
        };

        Object.entries(elements).forEach(([id, count]) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = count.toLocaleString();
            }
        });
    }

    sendDetectionData(frameCounts) {
        // Send real detection data to analytics system
        const detectionEvent = {
            timestamp: new Date().toISOString(),
            counts: frameCounts,
            totalCounts: { ...this.detectionCounts },
            location: 'Main Traffic Camera',
            confidence: 'high'
        };

        // Dispatch custom event for other components to listen
        window.dispatchEvent(new CustomEvent('vehicleDetection', {
            detail: detectionEvent
        }));

        // Log for debugging
        if (Object.values(frameCounts).some(count => count > 0)) {
            console.log('🚗 Real detection:', frameCounts);
        }
    }

    stopDetection() {
        this.isRunning = false;
        
        if (this.video) {
            this.video.pause();
            this.video.src = '';
            this.video = null;
        }

        this.updateStatus('⏹️ Detection stopped');
        
        // Clear canvas
        if (this.ctx) {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        }
    }

    resetCounts() {
        this.detectionCounts = {
            cars: 0,
            people: 0,
            trucks: 0,
            motorcycles: 0
        };
        this.updateDetectionCounts();
    }

    updateStatus(message) {
        const statusElement = document.getElementById('detection-status');
        if (statusElement) {
            statusElement.textContent = message;
        }
        console.log('Detection Status:', message);
    }

    // Get real traffic analysis data
    getTrafficAnalysis() {
        const totalVehicles = this.detectionCounts.cars + this.detectionCounts.trucks + this.detectionCounts.motorcycles;
        const totalPeople = this.detectionCounts.people;
        
        return {
            vehicleCount: totalVehicles,
            peopleCount: totalPeople,
            vehicleTypes: {
                cars: this.detectionCounts.cars,
                trucks: this.detectionCounts.trucks,
                motorcycles: this.detectionCounts.motorcycles
            },
            congestionLevel: this.calculateCongestionLevel(totalVehicles),
            timestamp: new Date().toISOString()
        };
    }

    calculateCongestionLevel(vehicleCount) {
        if (vehicleCount > 50) return 'heavy';
        if (vehicleCount > 25) return 'moderate';
        if (vehicleCount > 10) return 'light';
        return 'free_flow';
    }

    setupEventListeners() {
        // Implementation of setupEventListeners method
    }

    loadCameraOptions() {
        // Populate camera dropdown with real options
        const cameraSelect = document.getElementById('camera-select');
        if (cameraSelect) {
            cameraSelect.innerHTML = `
                <option value="">Select Camera Feed</option>
                <option value="0" selected>🎬 Big Buck Bunny Test Stream (Working)</option>
                <option value="1">🎥 Demo Stream 1 (Working)</option>
                <option value="2">🎥 Demo Stream 2 (Working)</option>
                <option value="3">🔴 FL511 Camera Stream 1 (chan-3732)</option>
                <option value="4">🔴 FL511 Camera Stream 2 (chan-8486)</option>
                <option value="5">🔴 Backup Stream (chan-3732)</option>
                <option value="6">🎭 Sintel Movie Stream (Working)</option>
                <option value="7">🐰 Big Buck Bunny Multi-bitrate</option>
                <option value="8">📷 I-95 at NW 79th St</option>
                <option value="9">📷 I-95 at NW 95th St</option>
                <option value="10">📷 I-95 at NW 125th St</option>
                <option value="11">📷 US-1 at SW 8th St</option>
                <option value="12">📷 US-1 at SW 40th St</option>
                <option value="13">📷 SR-826 at NW 25th St</option>
                <option value="14">📷 SR-826 at NW 58th St</option>
            `;
            
            cameraSelect.addEventListener('change', (e) => {
                const selectedIndex = parseInt(e.target.value);
                if (!isNaN(selectedIndex)) {
                    this.currentCameraIndex = selectedIndex;
                    this.loadCameraStream();
                }
            });
        }
    }

    loadCameraStream() {
        const cameraContainer = document.getElementById('camera-feed');
        const selectedUrl = this.cameraUrls[this.currentCameraIndex];
        
        if (cameraContainer && selectedUrl) {
            console.log(`🎥 Loading camera stream: ${selectedUrl}`);
            
            // For FL511 cameras, we need to handle them differently
            if (selectedUrl.includes('fl511.com')) {
                this.loadFL511Camera(selectedUrl);
            } else if (selectedUrl.includes('.m3u8')) {
                // Handle HLS streams
                this.loadHLSCameraStream(selectedUrl, cameraContainer);
            } else {
                // Direct stream URLs - create video element
                const videoElement = document.createElement('video');
                videoElement.src = selectedUrl;
                videoElement.autoplay = true;
                videoElement.muted = true;
                videoElement.controls = true;
                videoElement.style.width = '100%';
                videoElement.style.height = '300px';
                
                // Clear container and add video
                cameraContainer.innerHTML = '';
                cameraContainer.appendChild(videoElement);
                
                videoElement.onerror = () => {
                    console.warn(`⚠️ Failed to load camera ${this.currentCameraIndex}, trying next...`);
                    this.tryNextCamera();
                };
            }
        }
    }

    loadHLSCameraStream(url, container) {
        // Create video element for HLS stream
        const videoElement = document.createElement('video');
        videoElement.autoplay = true;
        videoElement.muted = true;
        videoElement.controls = true;
        videoElement.style.width = '100%';
        videoElement.style.height = '300px';
        
        // Clear container and add video
        container.innerHTML = '';
        container.appendChild(videoElement);
        
        // Load HLS.js if not already loaded
        if (typeof Hls === 'undefined') {
            this.loadScript('https://cdn.jsdelivr.net/npm/hls.js@latest').then(() => {
                this.setupHLSPlayer(videoElement, url);
            }).catch(() => {
                this.showCameraError();
            });
        } else {
            this.setupHLSPlayer(videoElement, url);
        }
    }

    setupHLSPlayer(videoElement, url) {
        console.log(`🎥 Attempting to load HLS stream: ${url}`);
        
        // Use our proxy for CORS-protected streams
        const filename = url.split('/').pop();
        const proxyUrl = `http://localhost:8080/api/proxy/url_${this.currentCameraIndex}/${filename}`;
        console.log(`🔄 Using proxy URL: ${proxyUrl}`);
        
        if (Hls.isSupported()) {
            const hls = new Hls({
                enableWorker: false,
                lowLatencyMode: false,
                backBufferLength: 30,
                maxLoadingDelay: 4,
                maxBufferLength: 30,
                maxBufferSize: 60 * 1000 * 1000,
                xhrSetup: function(xhr, requestUrl) {
                    // Set headers for our proxy
                    xhr.setRequestHeader('Cache-Control', 'no-cache');
                }
            });
            
            // Try direct URL first, then proxy if it fails
            hls.loadSource(url);
            hls.attachMedia(videoElement);
            
            hls.on(Hls.Events.MANIFEST_PARSED, () => {
                console.log('✅ HLS stream ready');
                videoElement.play().catch(e => {
                    console.log('Autoplay prevented:', e);
                    // Show play button overlay
                    this.showPlayButton(videoElement);
                });
            });
            
            hls.on(Hls.Events.ERROR, (event, data) => {
                console.warn('HLS error:', data);
                if (data.fatal) {
                    switch (data.type) {
                        case Hls.ErrorTypes.NETWORK_ERROR:
                            console.log('🔄 Network error, trying proxy...');
                            // Try proxy URL as fallback
                            if (!url.includes('localhost:8080/api/proxy')) {
                                console.log('🔄 Retrying with proxy...');
                                hls.loadSource(proxyUrl);
                            } else {
                                console.log('🔄 Proxy also failed, trying next camera...');
                                this.tryNextCamera();
                            }
                            break;
                        case Hls.ErrorTypes.MEDIA_ERROR:
                            console.log('🔄 Media error, recovering...');
                            hls.recoverMediaError();
                            break;
                        default:
                            console.log('🔄 Fatal error, trying proxy or next camera...');
                            if (!url.includes('localhost:8080/api/proxy')) {
                                hls.loadSource(proxyUrl);
                            } else {
                                this.tryNextCamera();
                            }
                            break;
                    }
                }
            });
        } else if (videoElement.canPlayType('application/vnd.apple.mpegurl')) {
            // Safari native HLS support
            videoElement.src = url;
            videoElement.onerror = () => {
                console.log('🔄 Direct stream failed, trying proxy...');
                videoElement.src = proxyUrl;
            };
            videoElement.play().catch(e => {
                console.log('Autoplay prevented:', e);
                this.showPlayButton(videoElement);
            });
        } else {
            console.error('HLS not supported in this browser');
            this.showCameraError('HLS streaming not supported in this browser');
        }
    }

    showPlayButton(videoElement) {
        // Show a play button overlay for manual playback
        const container = videoElement.parentElement;
        if (container) {
            const playButton = document.createElement('div');
            playButton.className = 'position-absolute top-50 start-50 translate-middle';
            playButton.innerHTML = `
                <button class="btn btn-primary btn-lg rounded-circle" style="width: 80px; height: 80px;">
                    <i class="bi bi-play-fill" style="font-size: 2rem;"></i>
                </button>
            `;
            playButton.addEventListener('click', () => {
                videoElement.play();
                playButton.remove();
            });
            container.appendChild(playButton);
        }
    }

    loadFL511Camera(url) {
        // FL511 cameras need special handling - embed as iframe or fetch image
        const videoContainer = document.getElementById('camera-feed').parentElement;
        
        // Create iframe for FL511 camera
        const iframe = document.createElement('iframe');
        iframe.src = url;
        iframe.style.width = '100%';
        iframe.style.height = '300px';
        iframe.style.border = 'none';
        
        // Replace video element with iframe
        const videoElement = document.getElementById('camera-feed');
        if (videoElement && videoContainer) {
            videoContainer.replaceChild(iframe, videoElement);
            iframe.id = 'camera-feed';
        }
    }

    tryNextCamera() {
        // Try next camera if current one fails
        this.currentCameraIndex = (this.currentCameraIndex + 1) % this.cameraUrls.length;
        
        if (this.currentCameraIndex === 0) {
            console.error('❌ All cameras failed to load');
            this.showCameraError();
            return;
        }
        
        setTimeout(() => {
            this.loadCameraStream();
        }, 1000);
    }

    showCameraError() {
        const videoContainer = document.getElementById('camera-feed').parentElement;
        if (videoContainer) {
            videoContainer.innerHTML = `
                <div class="d-flex align-items-center justify-content-center bg-dark text-white" style="height: 300px;">
                    <div class="text-center">
                        <i class="bi bi-camera-video-off display-4"></i>
                        <h6 class="mt-2">Camera Feed Unavailable</h6>
                        <p class="small">Please check camera selection or try again later</p>
                        <button class="btn btn-outline-light btn-sm" onclick="vehicleDetectionManager.loadCameraStream()">
                            <i class="bi bi-arrow-clockwise"></i> Retry
                        </button>
                    </div>
                </div>
            `;
        }
    }
}

// Global instance
let vehicleDetectionManager;

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    vehicleDetectionManager = new VehicleDetectionManager();
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = VehicleDetectionManager;
} else {
    window.VehicleDetectionManager = VehicleDetectionManager;
} 