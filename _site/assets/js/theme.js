// Track current theme state
let isDarkTheme = false;

// Create audio element for tap sound
const tapSound = new Audio('/assets/audio/tap.mp3');

// Get CSS variable values
function getCSSVariable(name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

// Store original colors on page load
let originalColors = {};

// Play tap sound
function playTapSound() {
    tapSound.currentTime = 0; // Reset to start
    tapSound.play().catch(err => console.log('Audio play failed:', err));
}

// Toggle between light and dark theme
function toggleTheme() {
    isDarkTheme = !isDarkTheme;
    
    if (isDarkTheme) {
        // Switch to dark colors
        document.documentElement.style.setProperty('--primary-color', getCSSVariable('--primary-color-dark'));
        document.documentElement.style.setProperty('--secondary-color', getCSSVariable('--secondary-color-dark'));
        document.documentElement.style.setProperty('--tertiary-color', getCSSVariable('--tertiary-color-dark'));
    } else {
        // Switch back to original colors
        document.documentElement.style.setProperty('--primary-color', originalColors.primary);
        document.documentElement.style.setProperty('--secondary-color', originalColors.secondary);
        document.documentElement.style.setProperty('--tertiary-color', originalColors.tertiary);
    }
    
    console.log(`Switched to ${isDarkTheme ? 'dark' : 'light'} theme`);
}

// Add click event listener to the h1 theme element
document.addEventListener('DOMContentLoaded', function() {
    // Store original color values on page load
    originalColors = {
        primary: getCSSVariable('--primary-color'),
        secondary: getCSSVariable('--secondary-color'),
        tertiary: getCSSVariable('--tertiary-color')
    };
    
    const themeHeading = document.querySelector('h1.theme');
    
    if (themeHeading) {
        themeHeading.style.cursor = 'pointer';
        themeHeading.addEventListener('click', function(e) {
            e.preventDefault();
            playTapSound();
            toggleTheme();
        });
    }
});

