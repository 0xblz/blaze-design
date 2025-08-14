// Three.js Cube Grid Visualization
console.log('Script loaded, checking Three.js...');

// Check if Three.js is available
if (typeof THREE === 'undefined') {
    console.error('Three.js not loaded!');
} else {
    console.log('Three.js loaded successfully:', THREE.REVISION);
}

let scene, camera, renderer, cubes = [];
let mouse, gridSize = 15, cubeSpacing = 2.0;

function init() {
    // Check Three.js again
    if (typeof THREE === 'undefined') {
        console.error('Three.js not available in init!');
        return;
    }
    
    const canvas = document.getElementById('canvas');
    if (!canvas) {
        console.error('Canvas not found!');
        return;
    }
    console.log('Canvas found, initializing Three.js...');
    
    // Initialize mouse
    mouse = new THREE.Vector2();
    
    // Ensure canvas has dimensions
    if (!canvas.style.width) canvas.style.width = '100%';
    if (!canvas.style.height) canvas.style.height = '100%';

    // Scene setup
    scene = new THREE.Scene();
    
    // Camera setup
    const width = canvas.clientWidth || 800;
    const height = canvas.clientHeight || 600;
    camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.z = 10;
    
    // Check canvas dimensions
    console.log('Canvas dimensions:', canvas.clientWidth, 'x', canvas.clientHeight);
    
    // Renderer setup
    renderer = new THREE.WebGLRenderer({ 
        canvas: canvas, 
        antialias: true,
        alpha: true 
    });
    
    // Use the same width/height variables
    
    renderer.setSize(width, height);
    renderer.setClearColor(0x000000, 0); // Transparent background
    
    console.log('Renderer initialized with size:', width, 'x', height);
    
    // Create cube grid
    createCubeGrid();
    
    // Mouse tracking
    canvas.addEventListener('mousemove', onMouseMove);
    
    // Handle resize
    window.addEventListener('resize', onWindowResize);
    
    // Listen for color scheme changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', updateCubeColors);
    
    // Test render immediately
    renderer.render(scene, camera);
    console.log('Initial render called');
    
    // Start animation
    animate();
}

function createCubeGrid() {
    const geometry = new THREE.BoxGeometry(1.2, 1.2, 4.0);
    
    // Detect user's color scheme preference
    const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    // Get color values - SteelBlue for dark mode, white for light mode
    const cubeColor = isDarkMode ? 
        new THREE.Color('SteelBlue') : 
        new THREE.Color('white');
    
    // Create shader material for depth fade effect
    const vertexShader = `
        varying vec3 vWorldPosition;
        void main() {
            vec4 worldPosition = modelMatrix * vec4(position, 1.0);
            vWorldPosition = worldPosition.xyz;
            gl_Position = projectionMatrix * viewMatrix * worldPosition;
        }
    `;
    
    const fragmentShader = `
        uniform vec3 cubeColor;
        varying vec3 vWorldPosition;
        void main() {
            // Calculate alpha based on world Z position (depth from viewer)
            // Closer to camera (higher Z) = more opaque
            // Further from camera (lower Z) = more transparent
            float depth = vWorldPosition.z;
            float alpha = (depth + 1.5) / 3.0; // Fade happens sooner and more dramatically
            alpha = clamp(alpha, 0.05, 0.85);
            
            gl_FragColor = vec4(cubeColor, alpha);
        }
    `;
    
    console.log('Creating cube grid...');
    
    // Calculate grid offset to center it
    const offset = (gridSize - 1) * cubeSpacing / 2;
    
    for (let x = 0; x < gridSize; x++) {
        for (let y = 0; y < gridSize; y++) {
            // Create shader material with depth fade
            const material = new THREE.ShaderMaterial({
                vertexShader: vertexShader,
                fragmentShader: fragmentShader,
                uniforms: {
                    cubeColor: { value: cubeColor }
                },
                transparent: true,
                side: THREE.DoubleSide
            });
            
            const cube = new THREE.Mesh(geometry, material);
            
            // Position cubes in a grid
            cube.position.x = x * cubeSpacing - offset;
            cube.position.y = y * cubeSpacing - offset;
            cube.position.z = 0;
            
            // Store original position and rotation for animation
            cube.originalPosition = new THREE.Vector3(
                cube.position.x,
                cube.position.y,
                cube.position.z
            );
            cube.originalRotation = new THREE.Euler(
                cube.rotation.x,
                cube.rotation.y,
                cube.rotation.z
            );
            
            scene.add(cube);
            cubes.push(cube);
        }
    }
    
    console.log(`Created ${cubes.length} cubes`);
}

function onMouseMove(event) {
    const canvas = document.getElementById('canvas');
    const rect = canvas.getBoundingClientRect();
    
    // Convert mouse position to normalized device coordinates (-1 to +1)
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
}

function animate() {
    requestAnimationFrame(animate);
    
    // Update cube positions based on mouse
    cubes.forEach((cube, index) => {
        const originalPos = cube.originalPosition;
        
        // Calculate distance from mouse to cube in screen space
        const cubeScreenPos = originalPos.clone();
        cubeScreenPos.project(camera);
        
        const distanceToMouse = Math.sqrt(
            Math.pow(cubeScreenPos.x - mouse.x, 2) + 
            Math.pow(cubeScreenPos.y - mouse.y, 2)
        );
        
        // Create fabric-like effect - closer cubes move more
        const influence = Math.max(0, 1 - distanceToMouse * 2);
        const moveAmount = influence * 0.5;
        
        // Apply smooth movement toward mouse direction
        const targetX = originalPos.x + (mouse.x * moveAmount * 2);
        const targetY = originalPos.y + (mouse.y * moveAmount * 2);
        const targetZ = originalPos.z + (moveAmount * 1.5);
        
        // Smooth interpolation for organic feel
        cube.position.x += (targetX - cube.position.x) * 0.1;
        cube.position.y += (targetY - cube.position.y) * 0.1;
        cube.position.z += (targetZ - cube.position.z) * 0.1;
        
        // Controlled rotation based on mouse direction
        const originalRot = cube.originalRotation;
        const rotationAmount = influence * 0.3;
        
        // Rotate based on mouse position relative to cube
        const targetRotX = originalRot.x + (mouse.y - cubeScreenPos.y) * rotationAmount;
        const targetRotY = originalRot.y + (mouse.x - cubeScreenPos.x) * rotationAmount;
        
        // Smooth rotation interpolation
        cube.rotation.x += (targetRotX - cube.rotation.x) * 0.1;
        cube.rotation.y += (targetRotY - cube.rotation.y) * 0.1;
    });
    
    renderer.render(scene, camera);
}

function updateCubeColors() {
    const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const newColor = isDarkMode ? 
        new THREE.Color('SteelBlue') : 
        new THREE.Color('white');
    
    // Update all cube materials
    cubes.forEach(cube => {
        if (cube.material.uniforms && cube.material.uniforms.cubeColor) {
            cube.material.uniforms.cubeColor.value = newColor;
        }
    });
    
    console.log('Updated cube colors for', isDarkMode ? 'dark' : 'light', 'mode');
}

function onWindowResize() {
    const canvas = document.getElementById('canvas');
    if (!canvas) return;
    
    camera.aspect = canvas.clientWidth / canvas.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(canvas.clientWidth, canvas.clientHeight);
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', init);
