// Charts functionality using Chart.js
class ChartManager {
    constructor() {
        this.charts = {};
        this.chartOptions = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                },
                title: {
                    display: true,
                }
            }
        };
    }

    initializeActivityChart() {
        const ctx = document.getElementById('activity-chart');
        if (!ctx) return;

        // Destroy existing chart if it exists
        if (this.charts.activity) {
            this.charts.activity.destroy();
            delete this.charts.activity;
        }

        // Also destroy any existing Chart.js instance on this canvas
        if (Chart.getChart(ctx)) {
            Chart.getChart(ctx).destroy();
        }

        // Generate sample activity data for the last 7 days
        const activityData = this.generateActivityData();

        this.charts.activity = new Chart(ctx, {
            type: 'line',
            data: {
                labels: activityData.labels,
                datasets: [
                    {
                        label: 'Crime Incidents',
                        data: activityData.crime,
                        borderColor: '#ff6b6b',
                        backgroundColor: 'rgba(255, 107, 107, 0.1)',
                        tension: 0.4
                    },
                    {
                        label: 'Traffic Events',
                        data: activityData.traffic,
                        borderColor: '#4ecdc4',
                        backgroundColor: 'rgba(78, 205, 196, 0.1)',
                        tension: 0.4
                    },
                    {
                        label: 'Vehicle Detections',
                        data: activityData.vehicles,
                        borderColor: '#45b7d1',
                        backgroundColor: 'rgba(69, 183, 209, 0.1)',
                        tension: 0.4
                    }
                ]
            },
            options: {
                ...this.chartOptions,
                plugins: {
                    ...this.chartOptions.plugins,
                    title: {
                        display: true,
                        text: 'Activity Trends (Last 7 Days)'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }

    initializeCrimeChart() {
        const ctx = document.getElementById('crime-chart');
        if (!ctx) return;

        // Destroy existing chart if it exists
        if (this.charts.crime) {
            this.charts.crime.destroy();
            delete this.charts.crime;
        }

        // Also destroy any existing Chart.js instance on this canvas
        if (Chart.getChart(ctx)) {
            Chart.getChart(ctx).destroy();
        }

        const crimeData = this.generateCrimeTypeData();

        this.charts.crime = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: crimeData.labels,
                datasets: [{
                    data: crimeData.values,
                    backgroundColor: [
                        '#ff6b6b',
                        '#4ecdc4',
                        '#45b7d1',
                        '#f9ca24',
                        '#f0932b'
                    ],
                    borderWidth: 2,
                    borderColor: '#fff'
                }]
            },
            options: {
                ...this.chartOptions,
                plugins: {
                    ...this.chartOptions.plugins,
                    title: {
                        display: true,
                        text: 'Crime Types Distribution'
                    },
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }

    initializeTrafficChart() {
        const ctx = document.getElementById('traffic-chart');
        if (!ctx) return;

        // Destroy existing chart if it exists
        if (this.charts.traffic) {
            this.charts.traffic.destroy();
            delete this.charts.traffic;
        }

        // Also destroy any existing Chart.js instance on this canvas
        if (Chart.getChart(ctx)) {
            Chart.getChart(ctx).destroy();
        }

        const trafficData = this.generateTrafficData();

        this.charts.traffic = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: trafficData.labels,
                datasets: [{
                    label: 'Traffic Volume',
                    data: trafficData.volumes,
                    backgroundColor: [
                        '#2ed573', // Green - free flow
                        '#fffa65', // Yellow - light traffic
                        '#ffa502', // Orange - moderate traffic
                        '#ff4757'  // Red - heavy traffic
                    ],
                    borderColor: [
                        '#20bf6b',
                        '#f1c40f',
                        '#e67e22',
                        '#e74c3c'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                ...this.chartOptions,
                plugins: {
                    ...this.chartOptions.plugins,
                    title: {
                        display: true,
                        text: 'Traffic Volume by Route'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Vehicles per Hour'
                        }
                    }
                }
            }
        });
    }

    initializeDetectionChart() {
        const ctx = document.getElementById('detection-chart');
        if (!ctx) return;

        // Destroy existing chart if it exists
        if (this.charts.detection) {
            this.charts.detection.destroy();
            delete this.charts.detection;
        }

        // Also destroy any existing Chart.js instance on this canvas
        if (Chart.getChart(ctx)) {
            Chart.getChart(ctx).destroy();
        }

        // Initialize with empty data - will be updated in real-time
        this.charts.detection = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [
                    {
                        label: 'Cars',
                        data: [],
                        borderColor: '#0066cc',
                        backgroundColor: 'rgba(0, 102, 204, 0.1)',
                        tension: 0.4
                    },
                    {
                        label: 'People',
                        data: [],
                        borderColor: '#28a745',
                        backgroundColor: 'rgba(40, 167, 69, 0.1)',
                        tension: 0.4
                    }
                ]
            },
            options: {
                ...this.chartOptions,
                plugins: {
                    ...this.chartOptions.plugins,
                    title: {
                        display: true,
                        text: 'Live Detection Count'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true
                    }
                },
                animation: {
                    duration: 0 // Disable animation for real-time updates
                }
            }
        });
    }

    updateDetectionChart(carCount, peopleCount) {
        if (!this.charts.detection) return;

        const chart = this.charts.detection;
        const now = new Date().toLocaleTimeString();

        // Add new data point
        chart.data.labels.push(now);
        chart.data.datasets[0].data.push(carCount);
        chart.data.datasets[1].data.push(peopleCount);

        // Keep only last 20 data points
        if (chart.data.labels.length > 20) {
            chart.data.labels.shift();
            chart.data.datasets[0].data.shift();
            chart.data.datasets[1].data.shift();
        }

        chart.update('none'); // Update without animation
    }

    generateActivityData() {
        const labels = [];
        const crime = [];
        const traffic = [];
        const vehicles = [];

        // Generate data for last 7 days
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            labels.push(date.toLocaleDateString('en-US', { weekday: 'short' }));
            
            crime.push(Math.floor(Math.random() * 20) + 10);
            traffic.push(Math.floor(Math.random() * 15) + 5);
            vehicles.push(Math.floor(Math.random() * 200) + 100);
        }

        return { labels, crime, traffic, vehicles };
    }

    generateCrimeTypeData() {
        return {
            labels: ['Theft', 'Burglary', 'Assault', 'Vandalism', 'Robbery'],
            values: [45, 25, 15, 10, 5]
        };
    }

    generateTrafficData() {
        return {
            labels: ['US-1', 'Coral Way', 'LeJeune Rd', 'Ponce de Leon'],
            volumes: [3500, 2800, 2200, 1900]
        };
    }

    updateChartData(chartName, newData) {
        if (!this.charts[chartName]) return;

        const chart = this.charts[chartName];
        
        if (newData.labels) {
            chart.data.labels = newData.labels;
        }
        
        if (newData.datasets) {
            newData.datasets.forEach((dataset, index) => {
                if (chart.data.datasets[index]) {
                    chart.data.datasets[index].data = dataset.data;
                }
            });
        }

        chart.update();
    }

    destroyChart(chartName) {
        if (this.charts[chartName]) {
            this.charts[chartName].destroy();
            delete this.charts[chartName];
        }
    }

    destroyAllCharts() {
        Object.keys(this.charts).forEach(chartName => {
            this.destroyChart(chartName);
        });
    }

    resizeCharts() {
        Object.values(this.charts).forEach(chart => {
            // Check if chart canvas still exists in DOM before resizing
            if (chart && chart.canvas && chart.canvas.parentNode) {
                try {
                    chart.resize();
                } catch (error) {
                    console.warn('Chart resize failed:', error);
                }
            }
        });
    }
}

// Global chart manager instance
let chartManager;

// Initialize charts function called from app.js
function initializeCharts() {
    if (!chartManager) {
        chartManager = new ChartManager();
    }

    // Initialize charts based on what's visible
    setTimeout(() => {
        if (document.getElementById('activity-chart')) {
            chartManager.initializeActivityChart();
        }
        
        if (document.getElementById('crime-chart') && document.getElementById('crime-chart').offsetParent !== null) {
            chartManager.initializeCrimeChart();
        }
        
        if (document.getElementById('traffic-chart') && document.getElementById('traffic-chart').offsetParent !== null) {
            chartManager.initializeTrafficChart();
        }
        
        if (document.getElementById('detection-chart') && document.getElementById('detection-chart').offsetParent !== null) {
            chartManager.initializeDetectionChart();
        }
    }, 100);
}

// Handle section changes to initialize charts
document.addEventListener('DOMContentLoaded', () => {
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
                const target = mutation.target;
                if (target.style.display === 'block') {
                    setTimeout(() => {
                        if (!chartManager) {
                            chartManager = new ChartManager();
                        }
                        
                        if (target.id === 'crime-section' && document.getElementById('crime-chart')) {
                            chartManager.initializeCrimeChart();
                        } else if (target.id === 'traffic-section' && document.getElementById('traffic-chart')) {
                            chartManager.initializeTrafficChart();
                        } else if (target.id === 'vehicle-detection-section' && document.getElementById('detection-chart')) {
                            chartManager.initializeDetectionChart();
                        }
                        
                        // Resize charts when sections become visible
                        chartManager.resizeCharts();
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
    if (chartManager) {
        chartManager.resizeCharts();
    }
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ChartManager;
} 