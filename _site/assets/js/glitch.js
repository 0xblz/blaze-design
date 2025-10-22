// Text glitch effect configuration
const GLITCH_CONFIG = {
    interval: 3000,           // 3 seconds between glitches
    glitchDuration: 300,      // Duration of glitch animation (matches CSS)
    words: ['designer', 'prototyper', 'builder'],
    currentWordIndex: 0
};

// Initialize glitch effect
function initGlitchEffect() {
    const h1Element = document.querySelector('h1.glitch');
    if (!h1Element) {
        console.warn('No h1 element with glitch class found');
        return;
    }
    
    // Set up the glitch interval
    setInterval(() => {
        performGlitch(h1Element);
    }, GLITCH_CONFIG.interval);
    
    console.log('Glitch effect initialized');
}

// Perform the glitch effect and text transformation
function performGlitch(element) {
    // Add glitching class to trigger CSS animations
    element.classList.add('glitching');
    
    // After a short delay, change the text during the glitch
    setTimeout(() => {
        // Switch to next word
        GLITCH_CONFIG.currentWordIndex = (GLITCH_CONFIG.currentWordIndex + 1) % GLITCH_CONFIG.words.length;
        const newText = GLITCH_CONFIG.words[GLITCH_CONFIG.currentWordIndex];
        
        // Update text content and data attribute
        element.textContent = newText;
        element.setAttribute('data-text', newText);
        
        console.log('Text glitched to:', newText);
    }, GLITCH_CONFIG.glitchDuration / 2); // Change text halfway through glitch animation
    
    // Remove glitching class after animation completes
    setTimeout(() => {
        element.classList.remove('glitching');
    }, GLITCH_CONFIG.glitchDuration);
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('Initializing glitch effect...');
    initGlitchEffect();
});
