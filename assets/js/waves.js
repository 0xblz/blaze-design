// Three.js Gradient Contour Visualization
console.log('Background gradient contours script loaded, checking Three.js...');

// Check if Three.js is available
if (typeof THREE === 'undefined') {
    console.error('Three.js not loaded!');
} else {

console.log('Three.js loaded successfully:', THREE.REVISION);

// Configuration - Edit these values to customize the appearance
const CONFIG = {
    // Contour properties
    contourCount: 200,         // Number of contour lines
    contourWidth: 400,         // Width of each contour layer
    contourSpacing: 1,       // Vertical spacing between contour layers
    contourResolution: 400,    // Number of points per contour (higher = smoother)
    
    // Line properties
    lineWidth: 0.1,            // Thickness of contour lines (adjustable)
    
    // Natural wave animation
    naturalWaveEnabled: true,     // Enable/disable natural wave animation
    naturalWaveAmplitude: 16,     // How much natural movement
    naturalWaveSpeed: 0.001,      // Speed of natural wave animation
    naturalWaveFrequency: 0.1,    // Frequency of natural waves
    
    // Scene rotation
    rotationX: Math.PI * 0,    // No tilt
    rotationY: Math.PI * 0,    // No y rotation
    
    // Camera
    cameraDistance: 30,        // Camera distance
    fov: 75                    // Field of view
};

// Scene setup
let scene, camera, renderer, contourLines = [];

// Initialize the scene
function init() {
    // Get colors from CSS variables
    const lightColor = getComputedStyle(document.documentElement).getPropertyValue('--line-color').trim();
    CONFIG.lineColor = lightColor;
    console.log('Using line color:', lightColor);
    
    // Create scene
    scene = new THREE.Scene();
    
    // Create camera (full screen)
    const canvas = document.getElementById('canvas');
    camera = new THREE.PerspectiveCamera(CONFIG.fov, canvas.clientWidth / canvas.clientHeight, 0.1, 1000);
    camera.position.set(0, 0, CONFIG.cameraDistance); // Center camera
    
    // Create renderer (for full-screen canvas)
    renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
    renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    renderer.setClearColor(0x000000, 0); // Transparent background
    
    // Apply mix-blend-mode to canvas
    canvas.style.mixBlendMode = 'overlay';
    
    // Create contour lines
    createContourLines();
    
    // Rotate the entire scene for abstract look
    scene.rotation.x = CONFIG.rotationX;
    scene.rotation.y = CONFIG.rotationY;
    
    // Start animation loop
    animate();
}


// Create contour lines
function createContourLines() {
    for (let i = 0; i < CONFIG.contourCount; i++) {
        // Position contours to fill the screen from bottom to top
        const baseY = (i - CONFIG.contourCount / 2) * CONFIG.contourSpacing;
        
        // Create line at this contour level
        const topLinePoints = [];
        for (let j = 0; j <= CONFIG.contourResolution; j++) {
            const x = (j / CONFIG.contourResolution) * CONFIG.contourWidth - CONFIG.contourWidth / 2;
            const y = baseY;
            topLinePoints.push(new THREE.Vector3(x, y, 0));
        }
        
        // Create thick line using BufferGeometry with custom vertices for width
        const lineGeometry = new THREE.BufferGeometry();
        const lineVertices = [];
        const lineIndices = [];
        const lineWidth = CONFIG.lineWidth; // Adjustable line thickness
        
        // Create vertices for a thick line (quad strip)
        for (let j = 0; j < topLinePoints.length; j++) {
            const point = topLinePoints[j];
            // Create two vertices per point (top and bottom of thick line)
            lineVertices.push(point.x, point.y + lineWidth/2, point.z);
            lineVertices.push(point.x, point.y - lineWidth/2, point.z);
            
            // Create triangles to connect the quads
            if (j < topLinePoints.length - 1) {
                const base = j * 2;
                // First triangle
                lineIndices.push(base, base + 1, base + 2);
                // Second triangle  
                lineIndices.push(base + 1, base + 3, base + 2);
            }
        }
        
        lineGeometry.setAttribute('position', new THREE.Float32BufferAttribute(lineVertices, 3));
        lineGeometry.setIndex(lineIndices);
        lineGeometry.computeVertexNormals();
        
        const lineMaterial = new THREE.MeshBasicMaterial({
            color: CONFIG.lineColor,
            transparent: true,
            opacity: 0.2,
            side: THREE.DoubleSide
        });
        
        const line = new THREE.Mesh(lineGeometry, lineMaterial);
        line.position.z = i * 0.01;
        
        // Store original data for animation
        line.userData = {
            index: i,
            originalPoints: [...topLinePoints]
        };
        
        contourLines.push(line);
        scene.add(line);
    }
}




// Animation loop
function animate() {
    requestAnimationFrame(animate);
    
    // Update contour lines
    updateLineAnimation();
    
    renderer.render(scene, camera);
}



// Update line animation - natural wave animation
function updateLineAnimation() {
    if (!CONFIG.naturalWaveEnabled) return;
    
    const time = Date.now() * CONFIG.naturalWaveSpeed;
    
    contourLines.forEach((line, lineIndex) => {
        const linePositions = line.geometry.attributes.position.array;
        const lineOriginalPoints = line.userData.originalPoints;
        const lineWidth = CONFIG.lineWidth;
        
        // Update each pair of vertices in the thick line
        for (let i = 0; i < lineOriginalPoints.length; i++) {
            const originalPoint = lineOriginalPoints[i];
            const pointRatio = i / (lineOriginalPoints.length - 1);
            
            // Calculate natural wave animation for this line
            const naturalOffsetX = Math.sin(time + lineIndex * CONFIG.naturalWaveFrequency + pointRatio * Math.PI * 2) * CONFIG.naturalWaveAmplitude;
            const naturalOffsetY = Math.sin(time * 0.7 + lineIndex * CONFIG.naturalWaveFrequency * 0.8 + pointRatio * Math.PI * 1.5) * CONFIG.naturalWaveAmplitude * 0.5;
            
            // Apply animation to both vertices of this line segment (top and bottom)
            const animatedX = originalPoint.x + naturalOffsetX;
            const animatedY = originalPoint.y + naturalOffsetY;
            const animatedZ = originalPoint.z;
            
            // Top vertex
            linePositions[i * 6] = animatedX;
            linePositions[i * 6 + 1] = animatedY + lineWidth/2;
            linePositions[i * 6 + 2] = animatedZ;
            
            // Bottom vertex
            linePositions[i * 6 + 3] = animatedX;
            linePositions[i * 6 + 4] = animatedY - lineWidth/2;
            linePositions[i * 6 + 5] = animatedZ;
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

// Function to update colors dynamically
function updateWaveColors() {
    // Get new colors from CSS variables
    const lightColor = getComputedStyle(document.documentElement).getPropertyValue('--line-color').trim();
    
    console.log('Updating line color:', lightColor);
    
    // Update CONFIG
    CONFIG.lineColor = lightColor;
    
    // Update all contour lines
    contourLines.forEach((line) => {
        line.material.color.set(lightColor);
    });
    
    console.log('Line colors updated successfully');
}

// Listen for theme color changes
window.addEventListener('themeColorsChanged', () => {
    console.log('Theme colors changed event received');
    updateWaveColors();
});

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('Initializing three.js scene with contour lines...');
    init();
    console.log('Contour lines created:', contourLines.length);
});

}
