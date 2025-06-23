// Simple Vehicle Detection with Real Traffic Cameras
class VehicleDetectionManager {
    constructor() {
        this.isRunning = false;
        this.model = null;
        this.video = null;
        this.canvas = null;
        this.ctx = null;
        this.detectionCounts = {
            cars: 0,
            people: 0,
            trucks: 0,
            motorcycles: 0
        };
        
        // Real Miami Traffic Cameras (FDOT) - Static images work reliably
        this.trafficCameras = [
            {
                name: "I-95 at NW 79th St (Live Feed)",
                imageUrl: "/api/camera-image/95-079",
                type: "image"
            },
            {
                name: "I-95 at NW 95th St (Live Feed)", 
                imageUrl: "/api/camera-image/95-095",
                type: "image"
            },
            {
                name: "US-1 at SW 8th St (Live Feed)",
                imageUrl: "/api/camera-image/US1-008",
                type: "image"
            },
            {
                name: "I-95 at NW 103rd St (Live Feed)",
                imageUrl: "/api/camera-image/95-103",
                type: "image"
            },
            {
                name: "FL511 Camera 3732 (HLS - Update Token)",
                streamUrl: "https://dim-se12.divas.cloud:8200/chan-3732/index.m3u8?token=EXPIRED_TOKEN",
                type: "hls",
                tokenExpired: true
            },
            {
                name: "FL511 Camera 3729 (HLS - Update Token)", 
                streamUrl: "https://dim-se15.divas.cloud:8200/chan-3729/index.m3u8?token=EXPIRED_TOKEN",
                type: "hls",
                tokenExpired: true
            }
        ];
        
        this.currentCameraIndex = 0;
        this.init();
    }

    async init() {
        try {
            await this.loadYOLOModel();
            this.setupCanvas();
            this.setupControls();
            this.loadCameraOptions();
            this.createTokenUpdateForm();
            this.initializeTokenStatus();
            console.log('✅ Vehicle Detection initialized');
        } catch (error) {
            console.error('❌ Initialization failed:', error);
        }
    }

    async loadYOLOModel() {
        try {
            console.log('🔄 Loading TensorFlow.js and COCO-SSD model...');
            
            // Load TensorFlow.js
            if (typeof tf === 'undefined') {
                console.log('Loading TensorFlow.js...');
                await this.loadScript('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@3.21.0/dist/tf.min.js');
                await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for TF to initialize
            }
            
            // Load COCO-SSD model
            if (typeof cocoSsd === 'undefined') {
                console.log('Loading COCO-SSD model...');
                await this.loadScript('https://cdn.jsdelivr.net/npm/@tensorflow-models/coco-ssd@2.2.2/dist/coco-ssd.min.js');
                await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for model to initialize
            }
            
            console.log('🔄 Initializing COCO-SSD model...');
            this.model = await cocoSsd.load();
            console.log('✅ YOLO/COCO-SSD model loaded successfully');
            
            // Update status
            this.updateStatus('✅ AI Model Ready - Select camera and start detection');
            
        } catch (error) {
            console.error('❌ Failed to load YOLO model:', error);
            this.updateStatus('❌ Failed to load AI model - Check console');
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
        // Don't create canvas here - we'll create it when we start detection
        // This avoids conflicts with the camera feed display
    }

    setupControls() {
        const startBtn = document.getElementById('start-detection');
        const stopBtn = document.getElementById('stop-detection');
        const debugBtn = document.getElementById('debug-detection');
        const updateTokensBtn = document.getElementById('update-tokens');
        const testTokensBtn = document.getElementById('test-tokens');
        
        if (startBtn) {
            startBtn.addEventListener('click', () => this.startDetection());
        }
        
        if (stopBtn) {
            stopBtn.addEventListener('click', () => this.stopDetection());
        }
        
        if (debugBtn) {
            debugBtn.addEventListener('click', () => this.debugSystem());
        }
        
        if (updateTokensBtn) {
            updateTokensBtn.addEventListener('click', () => this.updateTokensFromForm());
        }
        
        if (testTokensBtn) {
            testTokensBtn.addEventListener('click', () => this.testTokens());
        }
    }

    loadCameraOptions() {
        const cameraSelect = document.getElementById('camera-select');
        if (cameraSelect) {
            cameraSelect.innerHTML = '<option value="">Select Traffic Camera</option>';
            
            this.trafficCameras.forEach((camera, index) => {
                const option = document.createElement('option');
                option.value = index;
                option.textContent = `📹 ${camera.name}`;
                if (index === 0) option.selected = true;
                cameraSelect.appendChild(option);
            });
            
            cameraSelect.addEventListener('change', (e) => {
                this.currentCameraIndex = parseInt(e.target.value) || 0;
                this.loadCameraFeed();
            });
        }
        
        // Load first camera by default
        this.loadCameraFeed();
    }

    loadCameraFeed() {
        const camera = this.trafficCameras[this.currentCameraIndex];
        const cameraContainer = document.getElementById('camera-feed');
        
        if (!camera || !cameraContainer) {
            console.error('❌ Camera or container not found');
            return;
        }
        
        console.log(`📹 Loading: ${camera.name} (${camera.type})`);
        this.updateStatus(`🔄 Loading ${camera.name}...`);
        
        // Clear any existing intervals
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
        }
        
        // Clear container
        cameraContainer.innerHTML = '';
        
        if (camera.type === 'hls') {
            this.loadHLSStream(camera, cameraContainer);
        } else {
            this.loadStaticImage(camera, cameraContainer);
        }
    }

    async loadHLSStream(camera, container) {
        try {
            // Load HLS.js if not already loaded
            if (typeof Hls === 'undefined') {
                await this.loadScript('https://cdn.jsdelivr.net/npm/hls.js@latest');
            }
            
            // Create video element
            const video = document.createElement('video');
            video.controls = false;
            video.autoplay = true;
            video.muted = true;
            video.loop = true;
            video.style.width = '100%';
            video.style.height = '400px';
            video.style.objectFit = 'cover';
            video.style.display = 'block';
            video.crossOrigin = 'anonymous';
            
            container.appendChild(video);
            
            if (Hls.isSupported()) {
                const hls = new Hls({
                    enableWorker: false,
                    lowLatencyMode: true
                });
                
                hls.loadSource(camera.streamUrl);
                hls.attachMedia(video);
                
                hls.on(Hls.Events.MANIFEST_PARSED, () => {
                    console.log('✅ HLS stream ready');
                    this.updateStatus(`✅ ${camera.name} - Live stream ready`);
                    video.play().catch(e => console.log('Autoplay prevented:', e));
                });
                
                hls.on(Hls.Events.ERROR, (event, data) => {
                    console.error('HLS error:', data);
                    this.updateStatus(`❌ Stream error: ${camera.name}`);
                });
                
                this.currentHLS = hls;
            } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
                // Safari native HLS support
                video.src = camera.streamUrl;
                video.addEventListener('loadeddata', () => {
                    console.log('✅ Native HLS stream ready');
                    this.updateStatus(`✅ ${camera.name} - Live stream ready`);
                });
            } else {
                throw new Error('HLS not supported');
            }
            
            // Store reference for detection
            this.cameraImage = video;
            
        } catch (error) {
            console.error('❌ HLS loading failed:', error);
            this.updateStatus(`❌ Failed to load ${camera.name}`);
        }
    }

    loadStaticImage(camera, container) {
        console.log(`📷 Loading static camera: ${camera.name}`);
        
        // Create a simple image feed that refreshes
        const img = document.createElement('img');
        img.crossOrigin = 'anonymous';
        img.style.width = '100%';
        img.style.height = '400px';
        img.style.objectFit = 'cover';
        img.style.display = 'block';
        img.style.backgroundColor = '#000';
        
        // Use the image URL and refresh every 5 seconds
        const loadImage = () => {
            const timestamp = Date.now();
            const imageUrl = `${camera.imageUrl}?t=${timestamp}`;
            console.log(`📷 Loading image: ${imageUrl}`);
            
            // Create a new image to test loading first
            const testImg = new Image();
            testImg.crossOrigin = 'anonymous';
            
            testImg.onload = () => {
                console.log('✅ Camera image loaded successfully');
                img.src = testImg.src;
                this.updateStatus(`✅ ${camera.name} - Live feed active`);
            };
            
            testImg.onerror = (error) => {
                console.warn('⚠️ Camera image failed to load:', error);
                this.updateStatus(`❌ Failed to load ${camera.name} - Retrying...`);
                setTimeout(loadImage, 5000); // Retry in 5 seconds
            };
            
            testImg.src = imageUrl;
        };
        
        // Add image to container
        container.appendChild(img);
        
        // Store reference for detection
        this.cameraImage = img;
        
        // Load initial image
        loadImage();
        
        // Clear any existing interval
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
        }
        
        // Refresh every 5 seconds
        this.refreshInterval = setInterval(loadImage, 5000);
        
        console.log(`✅ Static camera setup complete: ${camera.name}`);
    }

    async startDetection() {
        if (this.isRunning) {
            console.log('Detection already running');
            return;
        }
        
        if (!this.cameraImage) {
            this.updateStatus('❌ No camera image available');
            return;
        }
        
        try {
            this.isRunning = true;
            this.updateStatus('🔄 Starting vehicle detection...');
            
            // Create canvas overlay for detection results
            this.createDetectionCanvas();
            
            // Start detection loop
            this.detectLoop();
            
        } catch (error) {
            console.error('Detection start failed:', error);
            this.updateStatus(`❌ Error: ${error.message}`);
            this.isRunning = false;
        }
    }

    createDetectionCanvas() {
        const cameraContainer = document.getElementById('camera-feed');
        if (!cameraContainer) return;
        
        // Create canvas for detection overlay
        this.canvas = document.createElement('canvas');
        this.canvas.width = 640;
        this.canvas.height = 400;
        this.canvas.style.position = 'absolute';
        this.canvas.style.top = '0';
        this.canvas.style.left = '0';
        this.canvas.style.width = '100%';
        this.canvas.style.height = '100%';
        this.canvas.style.pointerEvents = 'none';
        this.canvas.style.zIndex = '10';
        
        this.ctx = this.canvas.getContext('2d');
        
        // Make container relative positioned
        cameraContainer.style.position = 'relative';
        
        // Add canvas overlay
        cameraContainer.appendChild(this.canvas);
        
        console.log('✅ Detection canvas created');
    }

    async detectLoop() {
        if (!this.isRunning) {
            console.log('Detection loop stopped - not running');
            return;
        }

        if (!this.model) {
            console.error('Detection loop stopped - no model loaded');
            this.updateStatus('❌ AI model not loaded');
            return;
        }

        if (!this.cameraImage) {
            console.error('Detection loop stopped - no camera image');
            this.updateStatus('❌ No camera image available');
            return;
        }

        if (!this.canvas) {
            console.error('Detection loop stopped - no canvas');
            this.updateStatus('❌ Detection canvas not created');
            return;
        }

        try {
            console.log('🔍 Running detection on image...');
            
            // Check if image is loaded
            if (this.cameraImage.tagName === 'IMG' && (!this.cameraImage.complete || !this.cameraImage.naturalWidth)) {
                console.log('⏳ Waiting for image to load...');
                this.updateStatus('⏳ Waiting for camera image...');
                setTimeout(() => this.detectLoop(), 1000);
                return;
            }
            
            // Run YOLO detection directly on the image element
            const predictions = await this.model.detect(this.cameraImage);
            console.log(`🔍 Detection complete: ${predictions.length} objects found`);
            
            // Process and draw detections
            this.processDetections(predictions);
            this.drawDetections(predictions);
            
            this.updateStatus(`✅ Live Detection: ${predictions.length} objects found`);
            
        } catch (error) {
            console.error('❌ Detection error:', error);
            this.updateStatus(`❌ Detection error: ${error.message}`);
        }
        
        // Continue detection every 2 seconds
        if (this.isRunning) {
            setTimeout(() => this.detectLoop(), 2000);
        }
    }

    processDetections(predictions) {
        const frameCounts = {
            cars: 0,
            people: 0,
            trucks: 0,
            motorcycles: 0
        };

        predictions.forEach(prediction => {
            const className = prediction.class.toLowerCase();
            const confidence = prediction.score;
            
            if (confidence < 0.5) return;
            
            if (className.includes('car')) {
                frameCounts.cars++;
            } else if (className.includes('person')) {
                frameCounts.people++;
            } else if (className.includes('truck') || className.includes('bus')) {
                frameCounts.trucks++;
            } else if (className.includes('motorcycle')) {
                frameCounts.motorcycles++;
            }
        });

        // Update total counts
        Object.keys(frameCounts).forEach(key => {
            if (frameCounts[key] > 0) {
                this.detectionCounts[key] += frameCounts[key];
            }
        });

        this.updateDetectionCounts();
        
        if (Object.values(frameCounts).some(count => count > 0)) {
            console.log('🚗 Detection:', frameCounts);
        }
    }

    drawDetections(predictions) {
        // Clear the overlay canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        let detectionCount = 0;
        predictions.forEach(prediction => {
            const [x, y, width, height] = prediction.bbox;
            const className = prediction.class;
            const score = prediction.score;

            if (score < 0.5) return;
            detectionCount++;

            // Scale coordinates to canvas size
            let scaleX, scaleY;
            
            if (this.cameraImage.tagName === 'VIDEO') {
                // For video elements, use videoWidth/videoHeight
                scaleX = this.canvas.width / (this.cameraImage.videoWidth || 640);
                scaleY = this.canvas.height / (this.cameraImage.videoHeight || 400);
            } else {
                // For image elements, use naturalWidth/naturalHeight
                scaleX = this.canvas.width / (this.cameraImage.naturalWidth || 640);
                scaleY = this.canvas.height / (this.cameraImage.naturalHeight || 400);
            }
            
            const scaledX = x * scaleX;
            const scaledY = y * scaleY;
            const scaledWidth = width * scaleX;
            const scaledHeight = height * scaleY;

            // Color coding
            let color = '#00ff00';
            if (className.toLowerCase().includes('person')) color = '#ff0000';
            else if (className.toLowerCase().includes('car')) color = '#0080ff';
            else if (className.toLowerCase().includes('truck')) color = '#ffaa00';
            else if (className.toLowerCase().includes('motorcycle')) color = '#ff00ff';

            // Draw bounding box
            this.ctx.strokeStyle = color;
            this.ctx.lineWidth = 3;
            this.ctx.strokeRect(scaledX, scaledY, scaledWidth, scaledHeight);

            // Draw label background
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
            const labelWidth = Math.min(scaledWidth, 150);
            this.ctx.fillRect(scaledX, scaledY > 25 ? scaledY - 25 : scaledY + scaledHeight, labelWidth, 25);

            // Draw label text
            this.ctx.fillStyle = color;
            this.ctx.font = 'bold 12px Arial';
            const label = `${className} ${(score * 100).toFixed(0)}%`;
            this.ctx.fillText(label, scaledX + 5, scaledY > 25 ? scaledY - 8 : scaledY + scaledHeight + 18);
        });

        // Draw stats overlay
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.fillRect(10, 10, 250, 120);
        
        this.ctx.fillStyle = '#00ff00';
        this.ctx.font = 'bold 16px Arial';
        this.ctx.fillText('🚗 LIVE TRAFFIC DETECTION', 15, 35);
        
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = 'bold 14px Arial';
        this.ctx.fillText(`Live Objects: ${detectionCount}`, 15, 55);
        this.ctx.fillText(`Total Cars: ${this.detectionCounts.cars}`, 15, 75);
        this.ctx.fillText(`Total People: ${this.detectionCounts.people}`, 15, 95);
        this.ctx.fillText(`Total Trucks: ${this.detectionCounts.trucks}`, 15, 115);
    }

    updateDetectionCounts() {
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

    stopDetection() {
        this.isRunning = false;
        this.updateStatus('⏹️ Detection stopped');
        
        // Remove detection canvas overlay
        if (this.canvas && this.canvas.parentNode) {
            this.canvas.parentNode.removeChild(this.canvas);
            this.canvas = null;
            this.ctx = null;
        }
        
        // Clean up HLS if active
        if (this.currentHLS) {
            this.currentHLS.destroy();
            this.currentHLS = null;
        }
        
        console.log('🛑 Detection stopped and canvas removed');
    }

    updateStatus(message) {
        const statusElement = document.getElementById('detection-status');
        if (statusElement) {
            statusElement.textContent = message;
        }
        console.log('Status:', message);
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

    createTokenUpdateForm() {
        const cameraContainer = document.getElementById('camera-feed');
        if (!cameraContainer || !cameraContainer.parentElement) return;

        // Create token update form
        const formContainer = document.createElement('div');
        formContainer.id = 'token-update-form';
        formContainer.style.display = 'none';
        formContainer.className = 'mt-3 p-3 border rounded bg-light';
        formContainer.innerHTML = `
            <h6><i class="bi bi-key"></i> Update FL511 Stream Tokens</h6>
            <p class="small text-muted">Get fresh tokens from FL511.com and paste them here:</p>
            <div class="mb-2">
                <label class="form-label small">Camera 3732 Token:</label>
                <input type="text" class="form-control form-control-sm" id="token-3732" placeholder="Paste new token here">
            </div>
            <div class="mb-2">
                <label class="form-label small">Camera 3729 Token:</label>
                <input type="text" class="form-control form-control-sm" id="token-3729" placeholder="Paste new token here">
            </div>
            <div class="d-flex gap-2">
                <button class="btn btn-primary btn-sm" id="update-tokens">Update Tokens</button>
                <button class="btn btn-secondary btn-sm" id="hide-token-form">Cancel</button>
            </div>
        `;

        // Insert after camera container
        cameraContainer.parentElement.appendChild(formContainer);

        // Add event listeners
        document.getElementById('update-tokens').addEventListener('click', () => this.updateTokens());
        document.getElementById('hide-token-form').addEventListener('click', () => this.hideTokenForm());
    }

    showTokenForm() {
        const form = document.getElementById('token-update-form');
        if (form) {
            form.style.display = 'block';
        }
    }

    hideTokenForm() {
        const form = document.getElementById('token-update-form');
        if (form) {
            form.style.display = 'none';
        }
    }

    updateTokens() {
        const token3732 = document.getElementById('token-3732').value.trim();
        const token3729 = document.getElementById('token-3729').value.trim();

        if (token3732) {
            this.trafficCameras[0].streamUrl = `https://dim-se12.divas.cloud:8200/chan-3732/index.m3u8?token=${token3732}`;
            this.trafficCameras[0].tokenExpired = false;
            console.log('✅ Updated Camera 3732 token');
        }

        if (token3729) {
            this.trafficCameras[1].streamUrl = `https://dim-se15.divas.cloud:8200/chan-3729/index.m3u8?token=${token3729}`;
            this.trafficCameras[1].tokenExpired = false;
            console.log('✅ Updated Camera 3729 token');
        }

        if (token3732 || token3729) {
            this.updateStatus('✅ Tokens updated - try loading stream again');
            this.hideTokenForm();
            
            // Clear form
            document.getElementById('token-3732').value = '';
            document.getElementById('token-3729').value = '';
        } else {
            alert('Please enter at least one token');
        }
    }

    updateTokensFromForm() {
        const tokenInput = document.getElementById('token-input');
        const tokenStatus = document.getElementById('token-status');
        
        if (!tokenInput || !tokenInput.value.trim()) {
            alert('Please enter at least one token');
            return;
        }

        const tokens = tokenInput.value.trim().split(',').map(t => t.trim()).filter(t => t.length > 0);
        
        if (tokens.length === 0) {
            alert('Please enter valid tokens');
            return;
        }

        let updated = 0;
        
        // Update tokens for HLS cameras
        if (tokens[0] && this.trafficCameras[0].type === 'hls') {
            this.trafficCameras[0].streamUrl = `https://dim-se12.divas.cloud:8200/chan-3732/index.m3u8?token=${tokens[0]}`;
            this.trafficCameras[0].tokenExpired = false;
            updated++;
            console.log('✅ Updated Camera 3732 token');
        }

        if (tokens[1] && this.trafficCameras[1].type === 'hls') {
            this.trafficCameras[1].streamUrl = `https://dim-se15.divas.cloud:8200/chan-3729/index.m3u8?token=${tokens[1]}`;
            this.trafficCameras[1].tokenExpired = false;
            updated++;
            console.log('✅ Updated Camera 3729 token');
        }

        if (updated > 0) {
            tokenStatus.textContent = `${updated} Token(s) Updated`;
            tokenStatus.className = 'badge bg-success';
            this.updateStatus(`✅ ${updated} token(s) updated - reload camera to test`);
            
            // Clear the input
            tokenInput.value = '';
            
            // Reload current camera if it's an HLS stream
            const currentCamera = this.trafficCameras[this.currentCameraIndex];
            if (currentCamera && currentCamera.type === 'hls') {
                this.loadCameraFeed();
            }
        } else {
            tokenStatus.textContent = 'Update Failed';
            tokenStatus.className = 'badge bg-danger';
            alert('No HLS cameras found to update');
        }
    }

    async testTokens() {
        const tokenStatus = document.getElementById('token-status');
        tokenStatus.textContent = 'Testing...';
        tokenStatus.className = 'badge bg-warning';

        let workingTokens = 0;
        
        for (let i = 0; i < this.trafficCameras.length; i++) {
            const camera = this.trafficCameras[i];
            if (camera.type === 'hls') {
                try {
                    const response = await fetch(camera.streamUrl, { method: 'HEAD' });
                    if (response.ok) {
                        workingTokens++;
                        console.log(`✅ Token for ${camera.name} is working`);
                    } else {
                        console.log(`❌ Token for ${camera.name} failed: ${response.status}`);
                    }
                } catch (error) {
                    console.log(`❌ Token for ${camera.name} failed: ${error.message}`);
                }
            }
        }

        if (workingTokens > 0) {
            tokenStatus.textContent = `${workingTokens} Working`;
            tokenStatus.className = 'badge bg-success';
        } else {
            tokenStatus.textContent = 'All Failed';
            tokenStatus.className = 'badge bg-danger';
        }
    }

    initializeTokenStatus() {
        const tokenStatus = document.getElementById('token-status');
        if (tokenStatus) {
            // Count HLS cameras with tokens
            const hlsCameras = this.trafficCameras.filter(cam => cam.type === 'hls');
            if (hlsCameras.length > 0) {
                tokenStatus.textContent = `${hlsCameras.length} Tokens Set`;
                tokenStatus.className = 'badge bg-info';
            } else {
                tokenStatus.textContent = 'No HLS Cameras';
                tokenStatus.className = 'badge bg-secondary';
            }
        }
    }

    debugSystem() {
        console.log('🐛 VEHICLE DETECTION DEBUG INFO:');
        console.log('Model loaded:', !!this.model);
        console.log('Camera image:', !!this.cameraImage);
        console.log('Canvas:', !!this.canvas);
        console.log('Is running:', this.isRunning);
        console.log('Current camera index:', this.currentCameraIndex);
        console.log('Current camera:', this.trafficCameras[this.currentCameraIndex]);
        
        if (this.cameraImage) {
            console.log('Image element:', this.cameraImage);
            console.log('Image src:', this.cameraImage.src);
            console.log('Image complete:', this.cameraImage.complete);
            console.log('Image natural size:', this.cameraImage.naturalWidth, 'x', this.cameraImage.naturalHeight);
        }
        
        // Test camera endpoint
        const camera = this.trafficCameras[this.currentCameraIndex];
        if (camera && camera.type === 'image') {
            console.log('Testing camera endpoint...');
            fetch(camera.imageUrl + '?t=' + Date.now())
                .then(response => {
                    console.log('Camera endpoint status:', response.status);
                    console.log('Camera endpoint headers:', response.headers);
                })
                .catch(error => {
                    console.error('Camera endpoint error:', error);
                });
        }
        
        alert('Debug info logged to console. Press F12 to view.');
    }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Initializing Vehicle Detection...');
    window.vehicleDetection = new VehicleDetectionManager();
}); 