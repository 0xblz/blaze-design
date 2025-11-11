// Generate random triad colors and update CSS variables
function generateTriadColors() {
    // Generate a random hue between 0-360
    const primaryHue = Math.floor(Math.random() * 360);
    
    // Calculate triad colors (120 degrees apart on color wheel)
    const secondaryHue = (primaryHue + 120) % 360;
    const tertiaryHue = (primaryHue + 240) % 360;
    
    // Convert HSL to Hex with saturation and lightness values for vibrant colors
    const saturation = 100;
    const lightness = 64;
    
    const primaryColor = hslToHex(primaryHue, saturation, lightness);
    const secondaryColor = hslToHex(secondaryHue, saturation, lightness);
    const tertiaryColor = hslToHex(tertiaryHue, saturation, lightness);
    
    // Update CSS variables
    document.documentElement.style.setProperty('--primary-color', primaryColor);
    document.documentElement.style.setProperty('--secondary-color', secondaryColor);
    document.documentElement.style.setProperty('--tertiary-color', tertiaryColor);
    
    // Update water and line colors for waves
    document.documentElement.style.setProperty('--line-color', primaryColor);
    
    console.log('New triad colors:', { primaryColor, secondaryColor, tertiaryColor });
    
    // Dispatch custom event to notify waves.js of color change
    const colorChangeEvent = new CustomEvent('themeColorsChanged', {
        detail: { primaryColor, secondaryColor, tertiaryColor }
    });
    window.dispatchEvent(colorChangeEvent);
}

// Convert HSL to Hex color format
function hslToHex(h, s, l) {
    s /= 100;
    l /= 100;
    
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs((h / 60) % 2 - 1));
    const m = l - c / 2;
    
    let r = 0, g = 0, b = 0;
    
    if (h >= 0 && h < 60) {
        r = c; g = x; b = 0;
    } else if (h >= 60 && h < 120) {
        r = x; g = c; b = 0;
    } else if (h >= 120 && h < 180) {
        r = 0; g = c; b = x;
    } else if (h >= 180 && h < 240) {
        r = 0; g = x; b = c;
    } else if (h >= 240 && h < 300) {
        r = x; g = 0; b = c;
    } else if (h >= 300 && h < 360) {
        r = c; g = 0; b = x;
    }
    
    // Convert to 0-255 range
    r = Math.round((r + m) * 255);
    g = Math.round((g + m) * 255);
    b = Math.round((b + m) * 255);
    
    // Convert to hex
    const toHex = (n) => {
        const hex = n.toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    };
    
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

// Add click event listener to the refresh button
document.addEventListener('DOMContentLoaded', function() {
    const refreshButton = document.querySelector('.theme');
    
    if (refreshButton) {
        refreshButton.addEventListener('click', function(e) {
            e.preventDefault();
            generateTriadColors();
            
            // Add a subtle rotation animation to the refresh icon
            const icon = this.querySelector('i');
            if (icon) {
                icon.style.transform = 'rotate(360deg)';
                icon.style.transition = 'transform 0.5s ease';
                setTimeout(() => {
                    icon.style.transform = 'rotate(0deg)';
                    icon.style.transition = 'none';
                }, 500);
            }
        });
    }
});

