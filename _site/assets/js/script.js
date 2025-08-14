// Three.js Fabric Lines Visualization
console.log('Script loaded, checking Three.js...');

// Check if Three.js is available
if (typeof THREE === 'undefined') {
    console.error('Three.js not loaded!');
} else {

console.log('Three.js loaded successfully:', THREE.REVISION);

// Configuration - Edit these values to customize the appearance
const CONFIG = {
    // Line properties
    lineCount: 100,           // Number of horizontal lines
    lineLength: 80,           // Length of each line
    lineSpacing: 0.05,        // Vertical spacing between lines
    linePoints: 400,         // Number of points per line (higher = smoother curves)
    lineColor: 0xffffff,     // Line color (hex: 0xffffff = white, 0xff0000 = red, etc.)
    lineOpacity: 0.25,        // Line transparency (0.0 = invisible, 1.0 = solid)
    lineWidth: 1,            // Line thickness
    
    // Contour shape (abstract curve the lines follow)
    contourAmplitude1: 0.8,  // Primary wave amplitude
    contourAmplitude2: 1.4,  // Secondary wave amplitude  
    contourAmplitude3: 1.2,  // Tertiary wave amplitude
    contourFrequency1: 0.3,  // Primary wave frequency
    contourFrequency2: 0.1,  // Secondary wave frequency
    contourFrequency3: 0.5,  // Tertiary wave frequency
    
    // Mouse interaction
    mouseInfluenceRange: 4.0,     // Distance mouse affects lines
    oscillationAmplitude: 0.8,    // How much lines wiggle
    dampeningAmplitude: 0.5,      // Secondary movement amplitude
    animationSpeed: 0.005,        // Speed of oscillation
    returnSpeed: 0.05,            // How fast lines return to original position
    returnSpeedNoMouse: 0.03,     // Return speed when mouse not over canvas
    
    // Natural wave animation (subtle movement when no mouse interaction)
    naturalWaveEnabled: true,     // Enable/disable natural wave animation
    naturalWaveAmplitude: 0.1,    // How much natural movement (very subtle)
    naturalWaveSpeed: 0.01,      // Speed of natural wave animation (very slow)
    naturalWaveFrequency: 0.5,    // Frequency of natural waves
    
    // Scene rotation (for abstract look)
    rotationX: Math.PI * -0.08,    // ~15 degrees
    rotationY: Math.PI * -0.08,    // Slight y rotation
    
    // Camera
    cameraDistance: 5,            // How far camera is from scene
    fov: 85                       // Field of view
};

// Scene setup
let scene, camera, renderer, lines = [];
let mouse = new THREE.Vector2();
let raycaster = new THREE.Raycaster();
let isMouseOver = false;
let mousePosition = new THREE.Vector3();

// Initialize the scene
function init() {
    // Create scene
    scene = new THREE.Scene();
    
    // Create camera
    camera = new THREE.PerspectiveCamera(CONFIG.fov, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 0, CONFIG.cameraDistance);
    
    // Create renderer
    const canvas = document.getElementById('canvas');
    renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
    renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    renderer.setClearColor(0x000000, 0); // Transparent background
    
    // Create the fabric-like line grid
    createFabricLines();
    
    // Set up mouse interaction
    setupMouseInteraction();
    
    // Rotate the entire scene for abstract look
    scene.rotation.x = CONFIG.rotationX;
    scene.rotation.y = CONFIG.rotationY;
    
    // Start animation loop
    animate();
}

// Create symmetrical lines following an abstract contour
function createFabricLines() {
    for (let i = 0; i < CONFIG.lineCount; i++) {
        const y = (i - CONFIG.lineCount / 2) * CONFIG.lineSpacing;
        
        // Create abstract contour using sine waves for smooth curves
        const points = [];
        for (let j = 0; j <= CONFIG.linePoints; j++) {
            const x = (j / CONFIG.linePoints) * CONFIG.lineLength - CONFIG.lineLength / 2;
            
            // Abstract contour using multiple sine waves for smooth, organic shape
            const contourOffset = Math.sin(i * CONFIG.contourFrequency1) * CONFIG.contourAmplitude1 + 
                                 Math.sin(i * CONFIG.contourFrequency2) * CONFIG.contourAmplitude2 + 
                                 Math.cos(x * CONFIG.contourFrequency3) * CONFIG.contourAmplitude3;
            
            const z = contourOffset;
            points.push(new THREE.Vector3(x, y, z));
        }
        
        // Create geometry from points
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        
        // Create material using config values
        const material = new THREE.LineBasicMaterial({ 
            color: CONFIG.lineColor, 
            linewidth: CONFIG.lineWidth,
            transparent: true,
            opacity: CONFIG.lineOpacity
        });
        
        // Create line mesh
        const line = new THREE.Line(geometry, material);
        
        // Store original positions for animation
        line.userData = {
            originalPositions: [...points],
            index: i,
            currentOffset: 0
        };
        
        lines.push(line);
        scene.add(line);
    }
}

// Set up mouse interaction
function setupMouseInteraction() {
    const canvas = document.getElementById('canvas');
    
    canvas.addEventListener('mousemove', (event) => {
        const rect = canvas.getBoundingClientRect();
        mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        
        // Convert mouse position to world coordinates more accurately
        // Project the mouse coordinates to the z=0 plane where our lines are
        const vector = new THREE.Vector3(mouse.x, mouse.y, 0);
        vector.unproject(camera);
        
        // Calculate the direction from camera to the unprojected point
        const direction = vector.sub(camera.position).normalize();
        
        // Find intersection with z=0 plane (where our lines roughly are)
        const distance = -camera.position.z / direction.z;
        mousePosition.copy(camera.position).add(direction.multiplyScalar(distance));
        
        isMouseOver = true;
        
        // Debug output (remove this later)
        console.log('Mouse world position:', mousePosition.x.toFixed(2), mousePosition.y.toFixed(2));
    });
    
    canvas.addEventListener('mouseleave', () => {
        isMouseOver = false;
    });
}

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    
    // Update line positions for fabric effect
    updateFabricEffect();
    
    renderer.render(scene, camera);
}

// Update fabric effect - make lines wiggle near mouse
function updateFabricEffect() {
    lines.forEach((line, lineIndex) => {
        const positions = line.geometry.attributes.position.array;
        const originalPositions = line.userData.originalPositions;
        
        for (let i = 0; i < originalPositions.length; i++) {
            const originalPoint = originalPositions[i];
            
            // Calculate natural wave animation (subtle baseline movement)
            let naturalOffsetX = 0, naturalOffsetY = 0, naturalOffsetZ = 0;
            if (CONFIG.naturalWaveEnabled) {
                const time = Date.now() * CONFIG.naturalWaveSpeed;
                const pointRatio = i / originalPositions.length;
                
                // Create gentle wave patterns using multiple sine waves
                naturalOffsetX = Math.sin(time + lineIndex * CONFIG.naturalWaveFrequency + pointRatio * Math.PI * 2) * CONFIG.naturalWaveAmplitude;
                naturalOffsetY = Math.sin(time * 0.7 + lineIndex * CONFIG.naturalWaveFrequency * 0.8 + pointRatio * Math.PI * 1.5) * CONFIG.naturalWaveAmplitude * 0.5;
                naturalOffsetZ = Math.cos(time * 0.5 + lineIndex * CONFIG.naturalWaveFrequency * 1.2) * CONFIG.naturalWaveAmplitude * 0.3;
            }
            
            if (isMouseOver) {
                // Calculate distance from mouse to this point
                const distance = mousePosition.distanceTo(originalPoint);
                
                if (distance < CONFIG.mouseInfluenceRange) {
                    // Create ripple effect - closer points move more
                    const influence = Math.pow(1 - (distance / CONFIG.mouseInfluenceRange), 2);
                    const time = Date.now() * CONFIG.animationSpeed;
                    
                    // Guitar string-like oscillation
                    const oscillation = Math.sin(time + lineIndex * 0.5 + i * 0.1) * influence * CONFIG.oscillationAmplitude;
                    const dampening = Math.sin(time * 0.7 + lineIndex * 0.3) * influence * CONFIG.dampeningAmplitude;
                    
                    // Apply the effect (mouse interaction + natural wave)
                    positions[i * 3] = originalPoint.x + oscillation + naturalOffsetX;
                    positions[i * 3 + 1] = originalPoint.y + dampening + naturalOffsetY;
                    positions[i * 3 + 2] = originalPoint.z + oscillation * 0.5 + naturalOffsetZ;
                } else {
                    // Gradually return to original position + natural wave
                    const targetX = originalPoint.x + naturalOffsetX;
                    const targetY = originalPoint.y + naturalOffsetY;
                    const targetZ = originalPoint.z + naturalOffsetZ;
                    
                    positions[i * 3] = positions[i * 3] + (targetX - positions[i * 3]) * CONFIG.returnSpeed;
                    positions[i * 3 + 1] = positions[i * 3 + 1] + (targetY - positions[i * 3 + 1]) * CONFIG.returnSpeed;
                    positions[i * 3 + 2] = positions[i * 3 + 2] + (targetZ - positions[i * 3 + 2]) * CONFIG.returnSpeed;
                }
            } else {
                // Return to natural wave position when mouse is not over
                const targetX = originalPoint.x + naturalOffsetX;
                const targetY = originalPoint.y + naturalOffsetY;
                const targetZ = originalPoint.z + naturalOffsetZ;
                
                positions[i * 3] = positions[i * 3] + (targetX - positions[i * 3]) * CONFIG.returnSpeedNoMouse;
                positions[i * 3 + 1] = positions[i * 3 + 1] + (targetY - positions[i * 3 + 1]) * CONFIG.returnSpeedNoMouse;
                positions[i * 3 + 2] = positions[i * 3 + 2] + (targetZ - positions[i * 3 + 2]) * CONFIG.returnSpeedNoMouse;
            }
        }
        
        line.geometry.attributes.position.needsUpdate = true;
    });
}

// Handle window resize
function onWindowResize() {
    const canvas = document.getElementById('canvas');
    camera.aspect = canvas.clientWidth / canvas.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(canvas.clientWidth, canvas.clientHeight);
}

window.addEventListener('resize', onWindowResize);

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    init();
});

}

