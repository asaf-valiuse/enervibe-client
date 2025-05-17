/**
 * Vehicle Visualization Module
 * Handles rendering and interaction with vehicle visualizations
 */

document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const loadingSpinner = document.getElementById('loading-spinner');
    const visualizationContent = document.getElementById('visualization-content');
    const errorContainer = document.getElementById('error-container');
    const errorMessage = document.getElementById('error-message');
    const vehicleSvg = document.getElementById('vehicle-svg');
    const vehicleGroup = document.getElementById('vehicle-group');
    
    // Hide loading spinner initially
    loadingSpinner.classList.add('hidden');
    
    // Form Elements
    const vehicleTypeInputs = document.querySelectorAll('input[name="vehicle-type"]');
    const axleCountSelect = document.getElementById('axle-count');
    const wheelConfigSelect = document.getElementById('wheel-config');
    const statusSimulationSelect = document.getElementById('status-simulation');
    const updateVisualizationButton = document.getElementById('update-visualization');
    
    // Zoom Controls
    const zoomInButton = document.getElementById('zoom-in');
    const zoomOutButton = document.getElementById('zoom-out');
    const resetViewButton = document.getElementById('reset-view');
    
    // Wheel Info Elements
    const wheelInfoPlaceholder = document.getElementById('wheel-info-placeholder');
    const wheelInfoDetails = document.getElementById('wheel-info-details');
    const wheelIdElement = document.getElementById('wheel-id');
    const wheelAxleElement = document.getElementById('wheel-axle');
    const wheelPositionElement = document.getElementById('wheel-position');
    const wheelStatusElement = document.getElementById('wheel-status');
    const wheelTemperatureElement = document.getElementById('wheel-temperature');
    const wheelPressureElement = document.getElementById('wheel-pressure');
    const wheelLastUpdatedElement = document.getElementById('wheel-last-updated');
    const wheelBatteryElement = document.getElementById('wheel-battery');
    
    // State
    let currentVehicleType = 'truck';
    let currentAxleCount = 2;
    let currentWheelConfig = 'single';
    let currentStatusSimulation = 'all-normal';
    let currentScale = 1;
    let currentTranslateX = 0;
    let currentTranslateY = 0;
    let selectedWheelId = null;
    let vehicleData = null;
    
    // Constants
    const WHEEL_RADIUS = 20;
    const AXLE_SPACING = 150;
    const WHEEL_SPACING = 60;
    const DUAL_WHEEL_OFFSET = 15;
    
    // Initialize the visualization
    initVisualization();
    
    /**
     * Initialize the visualization
     */
    function initVisualization() {
        try {
            console.log('Initializing vehicle visualization');
            
            // Show loading spinner
            loadingSpinner.classList.remove('hidden');
            
            // Generate initial vehicle data
            generateVehicleData();
            
            // Render the vehicle
            renderVehicle();
            
            // Add event listeners
            setupEventListeners();
            
            // Hide loading spinner and show content
            loadingSpinner.classList.add('hidden');
            visualizationContent.classList.remove('hidden');
            
            console.log('Visualization initialized successfully');
        } catch (error) {
            console.error('Visualization initialization error:', error);
            showError(error.message);
        }
    }
    
    /**
     * Set up event listeners
     */
    function setupEventListeners() {
        // Vehicle type selection
        vehicleTypeInputs.forEach(input => {
            input.addEventListener('change', () => {
                if (input.checked) {
                    currentVehicleType = input.value;
                    
                    // Update axle count options based on vehicle type
                    updateAxleCountOptions();
                }
            });
        });
        
        // Update button
        updateVisualizationButton.addEventListener('click', () => {
            currentAxleCount = parseInt(axleCountSelect.value);
            currentWheelConfig = wheelConfigSelect.value;
            currentStatusSimulation = statusSimulationSelect.value;
            
            // Generate new vehicle data
            generateVehicleData();
            
            // Re-render the vehicle
            renderVehicle();
        });
        
        // Zoom controls
        zoomInButton.addEventListener('click', () => {
            currentScale += 0.1;
            updateTransform();
        });
        
        zoomOutButton.addEventListener('click', () => {
            currentScale = Math.max(0.5, currentScale - 0.1);
            updateTransform();
        });
        
        resetViewButton.addEventListener('click', () => {
            currentScale = 1;
            currentTranslateX = 0;
            currentTranslateY = 0;
            updateTransform();
        });
        
        // Pan functionality
        let isDragging = false;
        let dragStartX = 0;
        let dragStartY = 0;
        
        vehicleSvg.addEventListener('mousedown', (e) => {
            if (e.target === vehicleSvg || e.target === vehicleGroup) {
                isDragging = true;
                dragStartX = e.clientX;
                dragStartY = e.clientY;
                vehicleSvg.style.cursor = 'grabbing';
            }
        });
        
        document.addEventListener('mousemove', (e) => {
            if (isDragging) {
                const dx = e.clientX - dragStartX;
                const dy = e.clientY - dragStartY;
                dragStartX = e.clientX;
                dragStartY = e.clientY;
                
                currentTranslateX += dx / currentScale;
                currentTranslateY += dy / currentScale;
                updateTransform();
            }
        });
        
        document.addEventListener('mouseup', () => {
            isDragging = false;
            vehicleSvg.style.cursor = 'default';
        });
        
        // Wheel selection
        document.addEventListener('click', (e) => {
            const wheelElement = e.target.closest('.wheel');
            if (wheelElement) {
                const wheelId = wheelElement.getAttribute('data-wheel-id');
                selectWheel(wheelId);
            }
        });
    }
    
    /**
     * Update axle count options based on vehicle type
     */
    function updateAxleCountOptions() {
        // Clear existing options
        axleCountSelect.innerHTML = '';
        
        // Set min and max axle counts based on vehicle type
        let minAxles = 1;
        let maxAxles = 6;
        let defaultAxles = 2;
        
        switch (currentVehicleType) {
            case 'truck':
                maxAxles = 4;
                break;
            case 'tractor':
                minAxles = 2;
                defaultAxles = 2;
                break;
            case 'trailer':
                maxAxles = 6;
                defaultAxles = 3;
                break;
            case 'combined':
                minAxles = 3;
                maxAxles = 8;
                defaultAxles = 5;
                break;
        }
        
        // Add options
        for (let i = minAxles; i <= maxAxles; i++) {
            const option = document.createElement('option');
            option.value = i;
            option.textContent = `${i} Axle${i > 1 ? 's' : ''}`;
            option.selected = i === defaultAxles;
            axleCountSelect.appendChild(option);
        }
        
        // Update current axle count
        currentAxleCount = defaultAxles;
    }
    
    /**
     * Generate vehicle data based on current settings
     */
    function generateVehicleData() {
        const data = {
            type: currentVehicleType,
            axles: []
        };
        
        // Determine axle distribution based on vehicle type
        let tractorAxles = 0;
        let trailerAxles = 0;
        
        switch (currentVehicleType) {
            case 'truck':
                // All axles belong to the truck
                break;
            case 'tractor':
                // All axles belong to the tractor
                break;
            case 'trailer':
                // All axles belong to the trailer
                break;
            case 'combined':
                // Distribute axles between tractor and trailer
                tractorAxles = Math.min(3, Math.floor(currentAxleCount / 2));
                trailerAxles = currentAxleCount - tractorAxles;
                break;
        }
        
        // Generate axles and wheels
        for (let axleIndex = 0; axleIndex < currentAxleCount; axleIndex++) {
            const axleNumber = axleIndex + 1;
            const isTractorAxle = currentVehicleType === 'combined' && axleIndex < tractorAxles;
            const isTrailerAxle = currentVehicleType === 'combined' && axleIndex >= tractorAxles;
            
            // Determine wheel count for this axle
            let wheelsPerSide = 1;
            if (currentWheelConfig === 'dual') {
                wheelsPerSide = 2;
            } else if (currentWheelConfig === 'mixed') {
                // Front axle has single wheels, rear axles have dual wheels
                wheelsPerSide = axleIndex === 0 ? 1 : 2;
            }
            
            // Create axle data
            const axle = {
                axleNumber,
                position: axleIndex * AXLE_SPACING + 100,
                isTractorAxle,
                isTrailerAxle,
                wheels: []
            };
            
            // Generate wheels for left side
            for (let wheelIndex = 0; wheelIndex < wheelsPerSide; wheelIndex++) {
                const wheelNumber = wheelIndex + 1;
                const wheelId = `${axleNumber}L${wheelNumber}`;
                
                axle.wheels.push({
                    id: wheelId,
                    side: 'left',
                    index: wheelNumber,
                    status: generateWheelStatus(),
                    data: generateWheelData()
                });
            }
            
            // Generate wheels for right side
            for (let wheelIndex = 0; wheelIndex < wheelsPerSide; wheelIndex++) {
                const wheelNumber = wheelIndex + 1;
                const wheelId = `${axleNumber}R${wheelNumber}`;
                
                axle.wheels.push({
                    id: wheelId,
                    side: 'right',
                    index: wheelNumber,
                    status: generateWheelStatus(),
                    data: generateWheelData()
                });
            }
            
            data.axles.push(axle);
        }
        
        vehicleData = data;
    }
    
    /**
     * Generate a random wheel status based on current simulation setting
     * @returns {string} Wheel status (normal, warning, critical, nodata)
     */
    function generateWheelStatus() {
        switch (currentStatusSimulation) {
            case 'all-normal':
                return 'normal';
            case 'random-warnings':
                return Math.random() < 0.3 ? 'warning' : 'normal';
            case 'random-critical':
                return Math.random() < 0.2 ? 'critical' : 'normal';
            case 'mixed':
                const rand = Math.random();
                if (rand < 0.6) return 'normal';
                if (rand < 0.8) return 'warning';
                if (rand < 0.95) return 'critical';
                return 'nodata';
            default:
                return 'normal';
        }
    }
    
    /**
     * Generate random wheel sensor data
     * @returns {Object} Wheel sensor data
     */
    function generateWheelData() {
        // Generate a random date within the last 24 hours
        const now = new Date();
        const lastUpdated = new Date(now - Math.random() * 24 * 60 * 60 * 1000);
        
        return {
            temperature: (Math.random() * 30 + 20).toFixed(1), // 20-50°C
            pressure: (Math.random() * 2 + 7).toFixed(1),      // 7-9 bar
            lastUpdated: lastUpdated.toLocaleString(),
            battery: `${Math.floor(Math.random() * 30 + 70)}%` // 70-100%
        };
    }
    
    /**
     * Render the vehicle visualization
     */
    function renderVehicle() {
        // Clear previous content
        vehicleGroup.innerHTML = '';
        
        // Reset selection
        selectedWheelId = null;
        hideWheelInfo();
        
        // Determine vehicle dimensions based on type and axle count
        const vehicleLength = calculateVehicleLength();
        const vehicleWidth = 200;
        const vehicleHeight = 100;
        
        // Render vehicle body based on type
        switch (currentVehicleType) {
            case 'truck':
                renderTruck(vehicleLength, vehicleWidth, vehicleHeight);
                break;
            case 'tractor':
                renderTractor(vehicleLength, vehicleWidth, vehicleHeight);
                break;
            case 'trailer':
                renderTrailer(vehicleLength, vehicleWidth, vehicleHeight);
                break;
            case 'combined':
                renderCombined(vehicleLength, vehicleWidth, vehicleHeight);
                break;
        }
        
        // Render axles and wheels
        renderAxlesAndWheels();
        
        // Center the vehicle in the viewport
        centerVehicle(vehicleLength, vehicleWidth);
    }
    
    /**
     * Calculate vehicle length based on type and axle count
     * @returns {number} Vehicle length in pixels
     */
    function calculateVehicleLength() {
        const baseLength = 200;
        const axleSpacing = AXLE_SPACING;
        
        switch (currentVehicleType) {
            case 'truck':
                return baseLength + (currentAxleCount - 1) * axleSpacing;
            case 'tractor':
                return baseLength + (currentAxleCount - 1) * axleSpacing;
            case 'trailer':
                return baseLength + (currentAxleCount - 1) * axleSpacing;
            case 'combined':
                // Tractor + trailer with connector
                const tractorAxles = Math.min(3, Math.floor(currentAxleCount / 2));
                const trailerAxles = currentAxleCount - tractorAxles;
                return (baseLength + (tractorAxles - 1) * axleSpacing) + 
                       (baseLength + (trailerAxles - 1) * axleSpacing) + 50;
            default:
                return baseLength + (currentAxleCount - 1) * axleSpacing;
        }
    }
    
    /**
     * Render a truck (Type A)
     * @param {number} length - Vehicle length
     * @param {number} width - Vehicle width
     * @param {number} height - Vehicle height
     */
    function renderTruck(length, width, height) {
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        
        // Truck body
        const body = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        body.setAttribute('x', 50);
        body.setAttribute('y', 150 - height);
        body.setAttribute('width', length);
        body.setAttribute('height', height);
        body.setAttribute('rx', 10);
        body.setAttribute('class', 'vehicle-body');
        svg.appendChild(body);
        
        // Cabin (front part)
        const cabin = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        cabin.setAttribute('x', 50);
        cabin.setAttribute('y', 150 - height);
        cabin.setAttribute('width', 100);
        cabin.setAttribute('height', 70);
        cabin.setAttribute('rx', 10);
        cabin.setAttribute('class', 'vehicle-cabin');
        svg.appendChild(cabin);
        
        // Windshield
        const windshield = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        windshield.setAttribute('x', 70);
        windshield.setAttribute('y', 150 - height + 15);
        windshield.setAttribute('width', 60);
        windshield.setAttribute('height', 40);
        windshield.setAttribute('rx', 5);
        windshield.setAttribute('class', 'vehicle-window');
        svg.appendChild(windshield);
        
        // Front lights
        const leftLight = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        leftLight.setAttribute('x', 55);
        leftLight.setAttribute('y', 150 - height + 50);
        leftLight.setAttribute('width', 15);
        leftLight.setAttribute('height', 10);
        leftLight.setAttribute('rx', 2);
        leftLight.setAttribute('class', 'vehicle-light front');
        svg.appendChild(leftLight);
        
        const rightLight = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rightLight.setAttribute('x', 130);
        rightLight.setAttribute('y', 150 - height + 50);
        rightLight.setAttribute('width', 15);
        rightLight.setAttribute('height', 10);
        rightLight.setAttribute('rx', 2);
        rightLight.setAttribute('class', 'vehicle-light front');
        svg.appendChild(rightLight);
        
        // Rear lights
        const leftRearLight = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        leftRearLight.setAttribute('x', length + 30);
        leftRearLight.setAttribute('y', 150 - height + 50);
        leftRearLight.setAttribute('width', 15);
        leftRearLight.setAttribute('height', 10);
        leftRearLight.setAttribute('rx', 2);
        leftRearLight.setAttribute('class', 'vehicle-light rear');
        svg.appendChild(leftRearLight);
        
        const rightRearLight = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rightRearLight.setAttribute('x', length + 30);
        rightRearLight.setAttribute('y', 150 - height + 20);
        rightRearLight.setAttribute('width', 15);
        rightRearLight.setAttribute('height', 10);
        rightRearLight.setAttribute('rx', 2);
        rightRearLight.setAttribute('class', 'vehicle-light rear');
        svg.appendChild(rightRearLight);
        
        vehicleGroup.appendChild(svg);
    }
    
    /**
     * Render a tractor (Type B) using custom SVG
     * @param {number} length - Vehicle length
     * @param {number} width - Vehicle width
     * @param {number} height - Vehicle height
     */
    function renderTractor(length, width, height) {
        // Clear previous content
        vehicleGroup.innerHTML = '';
        
        // Create a group for the tractor
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        
        // Load both SVG files
        Promise.all([
            fetch('images/tractor_body.svg').then(response => response.text()),
            fetch('images/tractor_wheels.svg').then(response => response.text())
        ])
        .then(([bodyContent, wheelsContent]) => {
            // Create a temporary div to parse the SVG content
            const bodyDiv = document.createElement('div');
            bodyDiv.innerHTML = bodyContent;
            
            const wheelsDiv = document.createElement('div');
            wheelsDiv.innerHTML = wheelsContent;
            
            // Get the SVG elements from the parsed content
            const bodySvgElement = bodyDiv.querySelector('svg');
            const wheelsSvgElement = wheelsDiv.querySelector('svg');
            
            // Extract the inner content of the SVGs
            const bodySvgInnerContent = bodySvgElement.innerHTML;
            const wheelsSvgInnerContent = wheelsSvgElement.innerHTML;
            
            // Create a new SVG element for the combined content
            const tractorSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            tractorSvg.setAttribute('width', bodySvgElement.getAttribute('width'));
            tractorSvg.setAttribute('height', bodySvgElement.getAttribute('height'));
            tractorSvg.setAttribute('viewBox', `0 0 ${bodySvgElement.getAttribute('width')} ${bodySvgElement.getAttribute('height')}`);
            
            // Combine the content
            tractorSvg.innerHTML = bodySvgInnerContent + wheelsSvgInnerContent;
            
            // Add the SVG to our group
            svg.appendChild(tractorSvg);
            
            // Handle axle visibility based on axle count
            const axle1Right = tractorSvg.querySelector('#Axle1Right');
            const axle2Right = tractorSvg.querySelector('#Axle2Right');
            const axle2Left = tractorSvg.querySelector('#Axel2-left');
            const axle1Left = tractorSvg.querySelector('#Axel1Left');
            
            // Show/hide axles based on axle count
            if (axle1Right && axle1Left) {
                // Axle 1 (rearmost) is always visible
                axle1Right.style.display = 'block';
                axle1Left.style.display = 'block';
            }
            
            if (axle2Right && axle2Left) {
                // Axle 2 (inner) is only visible with 3+ axles
                if (currentAxleCount >= 3) {
                    axle2Right.style.display = 'block';
                    axle2Left.style.display = 'block';
                } else {
                    axle2Right.style.display = 'none';
                    axle2Left.style.display = 'none';
                }
            }
            
            // Add color to the SVG elements
            const paths = tractorSvg.querySelectorAll('path');
            paths.forEach(path => {
                if (path.getAttribute('fill') === '#FFFFFF') {
                    path.setAttribute('fill', '#E0E0E0');
                }
                if (path.getAttribute('stroke') === '#042433') {
                    path.setAttribute('stroke-width', '3');
                }
            });
            
            // Add the wheels after the SVG is loaded
            renderAxlesAndWheels();
        })
        .catch(error => {
            console.error('Error loading SVG:', error);
            // Fallback to the original tractor rendering
            renderFallbackTractor(length, width, height);
        });
        
        vehicleGroup.appendChild(svg);
    }
    
    /**
     * Render a fallback tractor if the SVG fails to load
     * @param {number} length - Vehicle length
     * @param {number} width - Vehicle width
     * @param {number} height - Vehicle height
     */
    function renderFallbackTractor(length, width, height) {
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        
        // Tractor body
        const body = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        body.setAttribute('x', 50);
        body.setAttribute('y', 150 - height);
        body.setAttribute('width', length - 50);
        body.setAttribute('height', height);
        body.setAttribute('rx', 10);
        body.setAttribute('class', 'vehicle-body');
        svg.appendChild(body);
        
        // Cabin (front part)
        const cabin = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        cabin.setAttribute('x', 50);
        cabin.setAttribute('y', 150 - height);
        cabin.setAttribute('width', 100);
        cabin.setAttribute('height', 70);
        cabin.setAttribute('rx', 10);
        cabin.setAttribute('class', 'vehicle-cabin');
        svg.appendChild(cabin);
        
        // Windshield
        const windshield = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        windshield.setAttribute('x', 70);
        windshield.setAttribute('y', 150 - height + 15);
        windshield.setAttribute('width', 60);
        windshield.setAttribute('height', 40);
        windshield.setAttribute('rx', 5);
        windshield.setAttribute('class', 'vehicle-window');
        svg.appendChild(windshield);
        
        // Front lights
        const leftLight = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        leftLight.setAttribute('x', 55);
        leftLight.setAttribute('y', 150 - height + 50);
        leftLight.setAttribute('width', 15);
        leftLight.setAttribute('height', 10);
        leftLight.setAttribute('rx', 2);
        leftLight.setAttribute('class', 'vehicle-light front');
        svg.appendChild(leftLight);
        
        const rightLight = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rightLight.setAttribute('x', 130);
        rightLight.setAttribute('y', 150 - height + 50);
        rightLight.setAttribute('width', 15);
        rightLight.setAttribute('height', 10);
        rightLight.setAttribute('rx', 2);
        rightLight.setAttribute('class', 'vehicle-light front');
        svg.appendChild(rightLight);
        
        // Connector (fifth wheel)
        const connector = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        connector.setAttribute('x', length - 70);
        connector.setAttribute('y', 150 - 20);
        connector.setAttribute('width', 40);
        connector.setAttribute('height', 20);
        connector.setAttribute('rx', 5);
        connector.setAttribute('class', 'vehicle-connector');
        svg.appendChild(connector);
        
        vehicleGroup.appendChild(svg);
    }
    
    /**
     * Render a trailer (Type C)
     * @param {number} length - Vehicle length
     * @param {number} width - Vehicle width
     * @param {number} height - Vehicle height
     */
    function renderTrailer(length, width, height) {
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        
        // Trailer body
        const body = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        body.setAttribute('x', 100);
        body.setAttribute('y', 150 - height);
        body.setAttribute('width', length);
        body.setAttribute('height', height);
        body.setAttribute('rx', 5);
        body.setAttribute('class', 'vehicle-body');
        svg.appendChild(body);
        
        // Connector (kingpin)
        const connector = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        connector.setAttribute('x', 70);
        connector.setAttribute('y', 150 - 20);
        connector.setAttribute('width', 30);
        connector.setAttribute('height', 20);
        connector.setAttribute('rx', 5);
        connector.setAttribute('class', 'vehicle-connector');
        svg.appendChild(connector);
        
        // Rear lights
        const leftRearLight = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        leftRearLight.setAttribute('x', length + 85);
        leftRearLight.setAttribute('y', 150 - height + 50);
        leftRearLight.setAttribute('width', 15);
        leftRearLight.setAttribute('height', 10);
        leftRearLight.setAttribute('rx', 2);
        leftRearLight.setAttribute('class', 'vehicle-light rear');
        svg.appendChild(leftRearLight);
        
        const rightRearLight = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rightRearLight.setAttribute('x', length + 85);
        rightRearLight.setAttribute('y', 150 - height + 20);
        rightRearLight.setAttribute('width', 15);
        rightRearLight.setAttribute('height', 10);
        rightRearLight.setAttribute('rx', 2);
        rightRearLight.setAttribute('class', 'vehicle-light rear');
        svg.appendChild(rightRearLight);
        
        vehicleGroup.appendChild(svg);
    }
    
    /**
     * Render a combined tractor-trailer
     * @param {number} length - Total vehicle length
     * @param {number} width - Vehicle width
     * @param {number} height - Vehicle height
     */
    function renderCombined(length, width, height) {
        const tractorAxles = Math.min(3, Math.floor(currentAxleCount / 2));
        const trailerAxles = currentAxleCount - tractorAxles;
        
        const tractorLength = 200 + (tractorAxles - 1) * AXLE_SPACING;
        const trailerLength = 200 + (trailerAxles - 1) * AXLE_SPACING;
        
        // Render tractor
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        
        // Tractor body
        const tractorBody = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        tractorBody.setAttribute('x', 50);
        tractorBody.setAttribute('y', 150 - height);
        tractorBody.setAttribute('width', tractorLength - 50);
        tractorBody.setAttribute('height', height);
        tractorBody.setAttribute('rx', 10);
        tractorBody.setAttribute('class', 'vehicle-body');
        svg.appendChild(tractorBody);
        
        // Tractor cabin
        const cabin = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        cabin.setAttribute('x', 50);
        cabin.setAttribute('y', 150 - height);
        cabin.setAttribute('width', 100);
        cabin.setAttribute('height', 70);
        cabin.setAttribute('rx', 10);
        cabin.setAttribute('class', 'vehicle-cabin');
        svg.appendChild(cabin);
        
        // Windshield
        const windshield = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        windshield.setAttribute('x', 70);
        windshield.setAttribute('y', 150 - height + 15);
        windshield.setAttribute('width', 60);
        windshield.setAttribute('height', 40);
        windshield.setAttribute('rx', 5);
        windshield.setAttribute('class', 'vehicle-window');
        svg.appendChild(windshield);
        
        // Front lights
        const leftLight = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        leftLight.setAttribute('x', 55);
        leftLight.setAttribute('y', 150 - height + 50);
        leftLight.setAttribute('width', 15);
        leftLight.setAttribute('height', 10);
        leftLight.setAttribute('rx', 2);
        leftLight.setAttribute('class', 'vehicle-light front');
        svg.appendChild(leftLight);
        
        const rightLight = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rightLight.setAttribute('x', 130);
        rightLight.setAttribute('y', 150 - height + 50);
        rightLight.setAttribute('width', 15);
        rightLight.setAttribute('height', 10);
        rightLight.setAttribute('rx', 2);
        rightLight.setAttribute('class', 'vehicle-light front');
        svg.appendChild(rightLight);
        
        // Tractor connector (fifth wheel)
        const tractorConnector = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        tractorConnector.setAttribute('x', tractorLength - 70);
        tractorConnector.setAttribute('y', 150 - 20);
        tractorConnector.setAttribute('width', 40);
        tractorConnector.setAttribute('height', 20);
        tractorConnector.setAttribute('rx', 5);
        tractorConnector.setAttribute('class', 'vehicle-connector');
        svg.appendChild(tractorConnector);
        
        // Trailer body
        const trailerX = tractorLength + 20;
        const trailerBody = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        trailerBody.setAttribute('x', trailerX);
        trailerBody.setAttribute('y', 150 - height);
        trailerBody.setAttribute('width', trailerLength);
        trailerBody.setAttribute('height', height);
        trailerBody.setAttribute('rx', 5);
        trailerBody.setAttribute('class', 'vehicle-body');
        svg.appendChild(trailerBody);
        
        // Trailer connector (kingpin)
        const trailerConnector = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        trailerConnector.setAttribute('x', trailerX - 30);
        trailerConnector.setAttribute('y', 150 - 20);
        trailerConnector.setAttribute('width', 30);
        trailerConnector.setAttribute('height', 20);
        trailerConnector.setAttribute('rx', 5);
        trailerConnector.setAttribute('class', 'vehicle-connector');
        svg.appendChild(trailerConnector);
        
        // Rear lights
        const leftRearLight = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        leftRearLight.setAttribute('x', trailerX + trailerLength - 15);
        leftRearLight.setAttribute('y', 150 - height + 50);
        leftRearLight.setAttribute('width', 15);
        leftRearLight.setAttribute('height', 10);
        leftRearLight.setAttribute('rx', 2);
        leftRearLight.setAttribute('class', 'vehicle-light rear');
        svg.appendChild(leftRearLight);
        
        const rightRearLight = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rightRearLight.setAttribute('x', trailerX + trailerLength - 15);
        rightRearLight.setAttribute('y', 150 - height + 20);
        rightRearLight.setAttribute('width', 15);
        rightRearLight.setAttribute('height', 10);
        rightRearLight.setAttribute('rx', 2);
        rightRearLight.setAttribute('class', 'vehicle-light rear');
        svg.appendChild(rightRearLight);
        
        vehicleGroup.appendChild(svg);
    }
    
    /**
     * Render axles and wheels using custom wheel positions
     */
    function renderAxlesAndWheels() {
        if (!vehicleData || !vehicleData.axles) return;
        
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        
        // Only render wheels for non-tractor vehicle types or if we're using the fallback tractor
        if (currentVehicleType !== 'tractor' || document.querySelector('.vehicle-body rect')) {
            // Original wheel rendering logic for non-tractor vehicles
            vehicleData.axles.forEach(axle => {
                // Determine axle position based on vehicle type
                let axleX = axle.position;
                
                if (currentVehicleType === 'combined') {
                    // Adjust position for trailer axles
                    if (axle.isTrailerAxle) {
                        const tractorAxles = vehicleData.axles.filter(a => a.isTractorAxle).length;
                        const tractorLength = 200 + (tractorAxles - 1) * AXLE_SPACING;
                        
                        // Offset trailer axles by tractor length + connector
                        const trailerStartX = tractorLength + 70;
                        const trailerAxleIndex = axle.axleNumber - tractorAxles - 1;
                        axleX = trailerStartX + 100 + trailerAxleIndex * AXLE_SPACING;
                    }
                }
                
                // Axle line
                const axleLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                axleLine.setAttribute('x1', axleX);
                axleLine.setAttribute('y1', 150 - WHEEL_SPACING);
                axleLine.setAttribute('x2', axleX);
                axleLine.setAttribute('y2', 150 + WHEEL_SPACING);
                axleLine.setAttribute('class', 'axle-line');
                svg.appendChild(axleLine);
                
                // Axle number
                const axleNumber = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                axleNumber.setAttribute('x', axleX);
                axleNumber.setAttribute('y', 150 - WHEEL_SPACING - 15);
                axleNumber.setAttribute('class', 'axle-number');
                axleNumber.textContent = `Axle ${axle.axleNumber}`;
                svg.appendChild(axleNumber);
                
                // Render wheels for this axle
                axle.wheels.forEach(wheel => {
                    renderWheel(svg, wheel, axleX);
                });
            });
        } else if (currentVehicleType === 'tractor') {
            // For custom tractor SVG, use predefined wheel positions
            const wheelPositionsByAxle = {
                // Front axle
                1: [
                    { x: 1307, y: 703, side: 'left' },   // Front left
                    { x: 1307, y: 1432, side: 'right' }  // Front right
                ],
                // Rear axle 1 (always visible)
                2: [
                    { x: 3114.5, y: 1330, side: 'left' },  // Rear left (Axel1Left)
                    { x: 3114.5, y: 810, side: 'right' }   // Rear right (Axle1Right)
                ],
                // Rear axle 2 (visible with 3+ axles)
                3: [
                    { x: 2684.5, y: 1330, side: 'left' },  // Inner left (Axel2-left)
                    { x: 2684.5, y: 810, side: 'right' }   // Inner right (Axle2Right)
                ]
            };
            
            // Scale factor to adjust coordinates from SVG to our viewport
            const scaleX = 0.1;  // Scale factor for X coordinates
            const scaleY = 0.1;  // Scale factor for Y coordinates
            const offsetX = -50; // Offset to center the wheels
            const offsetY = -50; // Offset to center the wheels
            
            // Render wheels for visible axles only
            for (let axleNumber = 1; axleNumber <= Math.min(currentAxleCount, 3); axleNumber++) {
                // Skip axle 3 if we have fewer than 3 axles
                if (axleNumber === 3 && currentAxleCount < 3) continue;
                
                const positions = wheelPositionsByAxle[axleNumber];
                if (positions) {
                    positions.forEach(position => {
                        const wheelId = `${axleNumber}${position.side.charAt(0).toUpperCase()}1`;
                        
                        // Create wheel data
                        const wheelData = {
                            id: wheelId,
                            side: position.side,
                            index: 1,
                            status: generateWheelStatus(),
                            data: generateWheelData()
                        };
                        
                        // Scale and offset the position to match our viewport
                        const scaledX = position.x * scaleX + offsetX;
                        const scaledY = position.y * scaleY + offsetY;
                        
                        // Render the wheel at the specific position
                        renderWheelAtPosition(svg, wheelData, scaledX, scaledY);
                    });
                }
            }
        }
        
        vehicleGroup.appendChild(svg);
    }
    
    /**
     * Render a wheel at a specific position
     * @param {SVGElement} svg - SVG element to append the wheel to
     * @param {Object} wheel - Wheel data
     * @param {number} wheelX - X position of the wheel
     * @param {number} wheelY - Y position of the wheel
     */
    function renderWheelAtPosition(svg, wheel, wheelX, wheelY) {
        const wheelGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        wheelGroup.setAttribute('class', `wheel status-${wheel.status}`);
        wheelGroup.setAttribute('data-wheel-id', wheel.id);
        
        // Wheel outer circle
        const wheelOuter = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        wheelOuter.setAttribute('cx', wheelX);
        wheelOuter.setAttribute('cy', wheelY);
        wheelOuter.setAttribute('r', WHEEL_RADIUS);
        wheelOuter.setAttribute('class', 'wheel-outer');
        wheelGroup.appendChild(wheelOuter);
        
        // Wheel inner circle
        const wheelInner = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        wheelInner.setAttribute('cx', wheelX);
        wheelInner.setAttribute('cy', wheelY);
        wheelInner.setAttribute('r', WHEEL_RADIUS / 2);
        wheelInner.setAttribute('class', 'wheel-inner');
        wheelGroup.appendChild(wheelInner);
        
        // Wheel label
        const wheelLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        wheelLabel.setAttribute('x', wheelX);
        wheelLabel.setAttribute('y', wheelY);
        wheelLabel.setAttribute('class', 'wheel-label');
        wheelLabel.textContent = wheel.id;
        wheelGroup.appendChild(wheelLabel);
        
        svg.appendChild(wheelGroup);
    }
    
    /**
     * Render a wheel at a specific axle position
     * @param {SVGElement} svg - SVG element to append the wheel to
     * @param {Object} wheel - Wheel data
     * @param {number} axleX - X position of the axle
     */
    function renderWheel(svg, wheel, axleX) {
        const wheelGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        wheelGroup.setAttribute('class', `wheel status-${wheel.status}`);
        wheelGroup.setAttribute('data-wheel-id', wheel.id);
        
        // Determine wheel position
        let wheelY = 150;
        let wheelX = axleX;
        
        if (wheel.side === 'left') {
            wheelY -= WHEEL_SPACING;
        } else {
            wheelY += WHEEL_SPACING;
        }
        
        // Offset for dual wheels
        if (currentWheelConfig === 'dual' || (currentWheelConfig === 'mixed' && wheel.index > 1)) {
            if (wheel.index === 2) {
                wheelX += DUAL_WHEEL_OFFSET;
            } else if (wheel.index === 1) {
                wheelX -= DUAL_WHEEL_OFFSET;
            }
        }
        
        // Wheel outer circle
        const wheelOuter = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        wheelOuter.setAttribute('cx', wheelX);
        wheelOuter.setAttribute('cy', wheelY);
        wheelOuter.setAttribute('r', WHEEL_RADIUS);
        wheelOuter.setAttribute('class', 'wheel-outer');
        wheelGroup.appendChild(wheelOuter);
        
        // Wheel inner circle
        const wheelInner = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        wheelInner.setAttribute('cx', wheelX);
        wheelInner.setAttribute('cy', wheelY);
        wheelInner.setAttribute('r', WHEEL_RADIUS / 2);
        wheelInner.setAttribute('class', 'wheel-inner');
        wheelGroup.appendChild(wheelInner);
        
        // Wheel label
        const wheelLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        wheelLabel.setAttribute('x', wheelX);
        wheelLabel.setAttribute('y', wheelY);
        wheelLabel.setAttribute('class', 'wheel-label');
        wheelLabel.textContent = wheel.id;
        wheelGroup.appendChild(wheelLabel);
        
        svg.appendChild(wheelGroup);
    }
    
    /**
     * Center the vehicle in the viewport
     * @param {number} vehicleLength - Vehicle length
     * @param {number} vehicleWidth - Vehicle width
     */
    function centerVehicle(vehicleLength, vehicleWidth) {
        if (currentVehicleType === 'tractor') {
            // For tractor, use specific scaling for the custom SVG
            const svgWidth = 2749;
            const svgHeight = 1024;
            
            // Calculate scale factor to fit in viewport
            const scaleX = 900 / svgWidth;
            const scaleY = 400 / svgHeight;
            const scaleFactor = Math.min(scaleX, scaleY) * 0.5; // 50% to fit properly
            
            // Center the vehicle
            currentScale = scaleFactor;
            currentTranslateX = 300; // Adjusted for better positioning
            currentTranslateY = 100;  // Adjusted for better positioning
            
            console.log('Centering custom SVG vehicle:', { 
                scale: currentScale,
                translateX: currentTranslateX, 
                translateY: currentTranslateY 
            });
        } else {
            // For other vehicle types, use the original centering logic
            const centerX = 500;
            const centerY = 200;
            
            // Calculate vehicle center
            const vehicleCenterX = 50 + vehicleLength / 2;
            const vehicleCenterY = 150;
            
            // Calculate translation
            currentTranslateX = centerX - vehicleCenterX;
            currentTranslateY = centerY - vehicleCenterY;
            
            console.log('Centering vehicle:', { 
                vehicleLength, 
                vehicleCenterX, 
                vehicleCenterY, 
                translateX: currentTranslateX, 
                translateY: currentTranslateY 
            });
        }
        
        // Apply transform
        updateTransform();
    }
    
    /**
     * Update the SVG transform
     */
    function updateTransform() {
        const transform = `translate(${currentTranslateX},${currentTranslateY}) scale(${currentScale})`;
        console.log('Applying transform:', transform);
        vehicleGroup.setAttribute('transform', transform);
    }
    
    /**
     * Select a wheel and show its information
     * @param {string} wheelId - Wheel ID
     */
    function selectWheel(wheelId) {
        // Deselect previously selected wheel
        if (selectedWheelId) {
            const prevWheel = document.querySelector(`.wheel[data-wheel-id="${selectedWheelId}"]`);
            if (prevWheel) {
                prevWheel.classList.remove('selected');
            }
        }
        
        // Select new wheel
        selectedWheelId = wheelId;
        const wheel = document.querySelector(`.wheel[data-wheel-id="${wheelId}"]`);
        if (wheel) {
            wheel.classList.add('selected');
        }
        
        // Find wheel data
        const wheelData = findWheelData(wheelId);
        if (wheelData) {
            showWheelInfo(wheelData);
        }
    }
    
    /**
     * Find wheel data by ID
     * @param {string} wheelId - Wheel ID
     * @returns {Object|null} Wheel data or null if not found
     */
    function findWheelData(wheelId) {
        if (!vehicleData || !vehicleData.axles) return null;
        
        for (const axle of vehicleData.axles) {
            for (const wheel of axle.wheels) {
                if (wheel.id === wheelId) {
                    return {
                        ...wheel,
                        axleNumber: axle.axleNumber
                    };
                }
            }
        }
        
        return null;
    }
    
    /**
     * Show wheel information
     * @param {Object} wheelData - Wheel data
     */
    function showWheelInfo(wheelData) {
        // Hide placeholder and show details
        wheelInfoPlaceholder.classList.add('hidden');
        wheelInfoDetails.classList.remove('hidden');
        
        // Update wheel info
        wheelIdElement.textContent = wheelData.id;
        wheelAxleElement.textContent = `Axle ${wheelData.axleNumber}`;
        wheelPositionElement.textContent = `${wheelData.side.charAt(0).toUpperCase() + wheelData.side.slice(1)} side, position ${wheelData.index}`;
        
        // Status with color
        let statusHtml = '';
        switch (wheelData.status) {
            case 'normal':
                statusHtml = '<span class="text-green-600 font-medium">Normal</span>';
                break;
            case 'warning':
                statusHtml = '<span class="text-yellow-600 font-medium">Warning</span>';
                break;
            case 'critical':
                statusHtml = '<span class="text-red-600 font-medium">Critical</span>';
                break;
            case 'nodata':
                statusHtml = '<span class="text-gray-500 font-medium">No Data</span>';
                break;
        }
        wheelStatusElement.innerHTML = statusHtml;
        
        // Sensor data
        if (wheelData.data) {
            wheelTemperatureElement.textContent = `${wheelData.data.temperature}°C`;
            wheelPressureElement.textContent = `${wheelData.data.pressure} bar`;
            wheelLastUpdatedElement.textContent = wheelData.data.lastUpdated;
            wheelBatteryElement.textContent = wheelData.data.battery;
        }
    }
    
    /**
     * Hide wheel information
     */
    function hideWheelInfo() {
        wheelInfoPlaceholder.classList.remove('hidden');
        wheelInfoDetails.classList.add('hidden');
    }
    
    /**
     * Show error message
     * @param {string} message - Error message
     */
    function showError(message) {
        loadingSpinner.classList.add('hidden');
        errorMessage.textContent = message;
        errorContainer.classList.remove('hidden');
    }
});
