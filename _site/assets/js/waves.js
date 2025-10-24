// Three.js Gradient Contour Visualization
console.log('Background gradient contours script loaded, checking Three.js...');

// Check if Three.js is available
if (typeof THREE === 'undefined') {
    console.error('Three.js not loaded!');
} else {

console.log('Three.js loaded successfully:', THREE.REVISION);

// Configuration - Edit these values to customize the appearance
const CONFIG = {
    // Gradient contour properties
    contourCount: 140,         // Number of gradient contour layers
    contourWidth: 140,         // Width of each contour layer
    contourSpacing: 1,      // Vertical spacing between contour layers
    contourResolution: 400,   // Number of points per contour (higher = smoother)
    gradientColors: null,     // Will be set dynamically from CSS variables
    gradientOpacity: 0.8,     // Base gradient transparency
    
    // Line properties
    lineWidth: 0.1,          // Thickness of contour lines (adjustable)
    
    
    // Wave animation is now handled entirely by natural wave animation
    
    // Animation settings
    animationSpeed: 0.005,        // Speed of oscillation (kept for potential future use)
    
    // Natural wave animation (ocean wave movement)
    naturalWaveEnabled: true,     // Enable/disable natural wave animation
    naturalWaveAmplitude: 12.5,    // How much natural movement (more for ocean waves)
    naturalWaveSpeed: 0.001,      // Speed of natural wave animation (slower for ocean)
    naturalWaveFrequency: 0.2,    // Frequency of natural waves (lower for ocean)
    
    // Scene rotation (for ocean perspective)
    rotationX: Math.PI * 0.0,    // Slight tilt for ocean perspective
    rotationY: Math.PI * 0,       // No y rotation
    
    // Camera
    cameraDistance: 16,            // Closer camera for ocean view
    fov: 85                       // Narrower field of view for ocean
};

// Scene setup
let scene, camera, renderer, gradientContours = [];

// Initialize the scene
function init() {
    // Get colors from CSS variables
    const primaryColor = getComputedStyle(document.documentElement).getPropertyValue('--water-color').trim();
    const lightColor = getComputedStyle(document.documentElement).getPropertyValue('--light-color').trim();
    CONFIG.gradientColors = primaryColor;
    CONFIG.lineColor = lightColor;
    console.log('Using gradient color:', primaryColor);
    console.log('Using line color:', lightColor);
    
    // Create scene
    scene = new THREE.Scene();
    
    // Create camera (full screen with elevated POV)
    const canvas = document.getElementById('canvas');
    camera = new THREE.PerspectiveCamera(CONFIG.fov, canvas.clientWidth / canvas.clientHeight, 0.1, 1000);
    camera.position.set(0, 4, CONFIG.cameraDistance); // Position higher to see ocean in bottom half
    
    // Create renderer (for half-screen canvas)
    renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
    renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    renderer.setClearColor(0x000000, 0); // Transparent background
    
    // Create gradient contours
    createGradientContours();
    
    // Rotate the entire scene for abstract look
    scene.rotation.x = CONFIG.rotationX;
    scene.rotation.y = CONFIG.rotationY;
    
    // Start animation loop
    animate();
}


// Create gradient contour surfaces
function createGradientContours() {
    for (let i = 0; i < CONFIG.contourCount; i++) {
        // Position contours from bottom to top for ocean wave effect
        const baseY = (i - CONFIG.contourCount) * CONFIG.contourSpacing + 1; // Position waves in bottom half
        const nextY = ((i + 1) - CONFIG.contourCount) * CONFIG.contourSpacing + 1; // Next contour level
        
        // Create points for this contour surface
        const points = [];
        
        // Bottom edge of this contour (current level) - flat, waves come from animation
        for (let j = 0; j <= CONFIG.contourResolution; j++) {
            const x = (j / CONFIG.contourResolution) * CONFIG.contourWidth - CONFIG.contourWidth / 2;
            const y = baseY; // Flat contour, waves added by animation
            points.push(new THREE.Vector2(x, y));
        }
        
        // Top edge of this contour (next level) - only if not the last contour
        if (i < CONFIG.contourCount - 1) {
            for (let j = CONFIG.contourResolution; j >= 0; j--) {
                const x = (j / CONFIG.contourResolution) * CONFIG.contourWidth - CONFIG.contourWidth / 2;
                const y = nextY; // Flat contour, waves added by animation
                points.push(new THREE.Vector2(x, y));
            }
        } else {
            // For the top contour, create a thin band
            for (let j = CONFIG.contourResolution; j >= 0; j--) {
                const x = (j / CONFIG.contourResolution) * CONFIG.contourWidth - CONFIG.contourWidth / 2;
                const y = baseY + 0.1; // Thin top band
                points.push(new THREE.Vector2(x, y));
            }
        }
        
        // Create shape and geometry
        const shape = new THREE.Shape(points);
        const geometry = new THREE.ShapeGeometry(shape);
        
        // Create gradient material with opacity based on depth
        const opacity = CONFIG.gradientOpacity * (1 - (i / CONFIG.contourCount) * 0.7); // Fade with depth
        const material = new THREE.MeshBasicMaterial({
            color: CONFIG.gradientColors,
            transparent: true,
            opacity: opacity,
            side: THREE.DoubleSide
        });
        
        // Create mesh
        const contour = new THREE.Mesh(geometry, material);
        contour.position.z = i * 0.01; // Slight depth separation
        
        // Create line at the top edge of this contour
        const topLinePoints = [];
        for (let j = 0; j <= CONFIG.contourResolution; j++) {
            const x = (j / CONFIG.contourResolution) * CONFIG.contourWidth - CONFIG.contourWidth / 2;
            const y = baseY; // Same Y as the bottom edge of contour
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
            opacity: 0.6,
            side: THREE.DoubleSide
        });
        
        const topLine = new THREE.Mesh(lineGeometry, lineMaterial);
        topLine.position.z = i * 0.01 + 0.005; // Slightly in front of contour
        
        // Store original data for animation
        contour.userData = {
            originalPoints: [...points],
            index: i,
            baseOpacity: opacity,
            bottomPointCount: CONFIG.contourResolution + 1,
            topLine: topLine,
            topLineOriginalPoints: [...topLinePoints]
        };
        
        gradientContours.push(contour);
        scene.add(contour);
        scene.add(topLine);
    }
}




// Animation loop
function animate() {
    requestAnimationFrame(animate);
    
    // Update gradient contours and their lines
    updateGradientEffect();
    
    renderer.render(scene, camera);
}



// Update gradient effect - natural wave animation
function updateGradientEffect() {
    if (!CONFIG.naturalWaveEnabled) return;
    
    const time = Date.now() * CONFIG.naturalWaveSpeed;
    
    gradientContours.forEach((contour, contourIndex) => {
        const positions = contour.geometry.attributes.position.array;
        const originalPoints = contour.userData.originalPoints;
        const bottomPointCount = contour.userData.bottomPointCount;
        
        // Process bottom edge points (first half of points array)
        for (let i = 0; i < bottomPointCount; i++) {
            const originalPoint = originalPoints[i];
            const pointRatio = i / (bottomPointCount - 1);
            
            // Calculate natural wave animation for this contour level
            const naturalOffsetX = Math.sin(time + contourIndex * CONFIG.naturalWaveFrequency + pointRatio * Math.PI * 2) * CONFIG.naturalWaveAmplitude;
            const naturalOffsetY = Math.sin(time * 0.7 + contourIndex * CONFIG.naturalWaveFrequency * 0.8 + pointRatio * Math.PI * 1.5) * CONFIG.naturalWaveAmplitude * 0.5;
            
            // Apply animation directly to bottom edge
            positions[i * 3] = originalPoint.x + naturalOffsetX;
            positions[i * 3 + 1] = originalPoint.y + naturalOffsetY;
        }
        
        // Process top edge points (second half of points array) - only if not the top contour
        if (contourIndex < CONFIG.contourCount - 1) {
            for (let i = bottomPointCount; i < originalPoints.length; i++) {
                const originalPoint = originalPoints[i];
                const topPointIndex = originalPoints.length - 1 - i + bottomPointCount; // Reverse index for top edge
                const pointRatio = topPointIndex / (bottomPointCount - 1);
                
                // Calculate natural wave animation for the NEXT contour level
                const naturalOffsetX = Math.sin(time + (contourIndex + 1) * CONFIG.naturalWaveFrequency + pointRatio * Math.PI * 2) * CONFIG.naturalWaveAmplitude;
                const naturalOffsetY = Math.sin(time * 0.7 + (contourIndex + 1) * CONFIG.naturalWaveFrequency * 0.8 + pointRatio * Math.PI * 1.5) * CONFIG.naturalWaveAmplitude * 0.5;
                
                // Apply animation directly to top edge
                positions[i * 3] = originalPoint.x + naturalOffsetX;
                positions[i * 3 + 1] = originalPoint.y + naturalOffsetY;
            }
        }
        
        contour.geometry.attributes.position.needsUpdate = true;
        
        // Update the top line for this contour
        if (contour.userData.topLine) {
            const topLine = contour.userData.topLine;
            const linePositions = topLine.geometry.attributes.position.array;
            const lineOriginalPoints = contour.userData.topLineOriginalPoints;
            const lineWidth = CONFIG.lineWidth;
            
            // Update each pair of vertices in the thick line
            for (let i = 0; i < lineOriginalPoints.length; i++) {
                const originalPoint = lineOriginalPoints[i];
                const pointRatio = i / (lineOriginalPoints.length - 1);
                
                // Calculate natural wave animation for this line (same as bottom edge of contour)
                const naturalOffsetX = Math.sin(time + contourIndex * CONFIG.naturalWaveFrequency + pointRatio * Math.PI * 2) * CONFIG.naturalWaveAmplitude;
                const naturalOffsetY = Math.sin(time * 0.7 + contourIndex * CONFIG.naturalWaveFrequency * 0.8 + pointRatio * Math.PI * 1.5) * CONFIG.naturalWaveAmplitude * 0.5;
                
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
            
            topLine.geometry.attributes.position.needsUpdate = true;
        }
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
    console.log('Initializing three.js scene with gradient contours...');
    init();
    console.log('Gradient contours created:', gradientContours.length);
});

}
