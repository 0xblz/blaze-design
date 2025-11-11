document.addEventListener('DOMContentLoaded', function() {
    const followElement = document.querySelector('.follow');
    
    if (!followElement) return;
    
    // Track mouse movement
    document.addEventListener('mousemove', function(e) {
        const x = e.clientX;
        const y = e.clientY;
        
        // Calculate angle from center of screen to mouse position
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;
        const angle = Math.atan2(y - centerY, x - centerX) * (180 / Math.PI);
        
        // Update the gradient position and rotation
        // Combine the base centering transform with the mouse position offset
        followElement.style.transform = `translate(calc(-50% + ${x - centerX}px), calc(-50% + ${y - centerY}px)) rotate(${angle + 45}deg)`;
    });
});

