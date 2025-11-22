// Theme Switcher
document.addEventListener('DOMContentLoaded', function() {
    const colorButtons = document.querySelectorAll('.colors .color');
    const root = document.documentElement;
    let starsContainer = null;
    
    // Load saved theme from localStorage, or default to theme 1
    const savedTheme = localStorage.getItem('theme') || '1';
    applyTheme(savedTheme);
    updateActiveButton(savedTheme);
    
    // Add click event listeners to each color button
    colorButtons.forEach((button, index) => {
        button.addEventListener('click', function() {
            // Play click sound
            if (window.AudioManager) {
                window.AudioManager.playClick();
            }
            
            const colorSet = index + 1; // color-1, color-2, etc.
            applyTheme(colorSet);
            updateActiveButton(colorSet);
            localStorage.setItem('theme', colorSet);
        });
    });
    
    function applyTheme(colorSet) {
        // Update CSS variables to use the selected color set
        root.style.setProperty('--primary-color', `var(--color-set-${colorSet}-color-1)`);
        root.style.setProperty('--secondary-color', `var(--color-set-${colorSet}-color-2)`);
        root.style.setProperty('--tertiary-color', `var(--color-set-${colorSet}-color-3)`);
        root.style.setProperty('--dark-color', `var(--color-set-${colorSet}-color-4)`);
        
        // Add or remove stars based on theme selection
        if (colorSet == 3) {
            createStars();
        } else {
            removeStars();
        }
    }
    
    function updateActiveButton(colorSet) {
        // Remove active class from all buttons
        colorButtons.forEach(btn => btn.classList.remove('active'));
        // Add active class to selected button
        const activeButton = document.querySelector(`.color-${colorSet}`);
        if (activeButton) {
            activeButton.classList.add('active');
        }
    }
    
    function createStars() {
        // Remove existing stars if any
        removeStars();
        
        // Create container for stars
        starsContainer = document.createElement('div');
        starsContainer.className = 'stars-container';
        starsContainer.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 1;
            overflow: hidden;
        `;
        
        // Create multiple stars with random positions and sizes
        const starCount = 50;
        for (let i = 0; i < starCount; i++) {
            const star = document.createElement('div');
            star.className = 'star';
            
            // Random position
            const x = Math.random() * 100;
            const y = Math.random() * 100;
            
            // Random size (1-3px)
            const size = Math.random() * 2 + 1;
            
            // Random animation delay for twinkling effect
            const delay = Math.random() * 3;
            
            // Random animation duration
            const duration = Math.random() * 2 + 2;
            
            star.style.cssText = `
                position: absolute;
                left: ${x}%;
                top: ${y}%;
                width: ${size}px;
                height: ${size}px;
                background: white;
                border-radius: 50%;
                box-shadow: 0 0 ${size * 2}px rgba(255, 255, 255, 0.8);
                animation: twinkle ${duration}s ease-in-out ${delay}s infinite;
            `;
            
            starsContainer.appendChild(star);
        }
        
        // Add CSS animation for twinkling
        if (!document.getElementById('star-animation-styles')) {
            const style = document.createElement('style');
            style.id = 'star-animation-styles';
            style.textContent = `
                @keyframes twinkle {
                    0%, 100% { opacity: 0.2; }
                    50% { opacity: 1; }
                }
            `;
            document.head.appendChild(style);
        }
        
        document.body.appendChild(starsContainer);
    }
    
    function removeStars() {
        if (starsContainer) {
            starsContainer.remove();
            starsContainer = null;
        }
    }
});

