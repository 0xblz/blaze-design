function generateSplitComplementaryColors() {
    // Generate a random base hue (0-360)
    const baseHue = Math.floor(Math.random() * 360);
    
    // Set fixed saturation and lightness values
    const saturation = 25;
    const lightness = 45;

    // Calculate split-complementary colors (base + complement ± degrees)
    const hue1 = baseHue;                    // Primary color
    const hue2 = (baseHue + 45) % 360;      // Complementary color
    const hue3 = (baseHue + 90) % 360;      // Split-complementary color
    
    // Use consistent lightness value
    const finalLightness = lightness;
    
    // Convert HSL to hex - create 3 split-complementary colors + 1 dark
    const color1 = hslToHex(hue1, saturation, finalLightness);                    // Primary color
    const color2 = hslToHex(hue2, saturation, finalLightness);                    // Complementary color
    const color3 = hslToHex(hue3, saturation, finalLightness);                    // Split-complementary color
    const color4 = hslToHex(hue1, saturation, Math.max(10, finalLightness * 0.4)); // Darker version of primary

    // Generate random positions for the pseudo-elements with moderate movement
    const beforeTop = Math.random() * 50 - 25; // -25% to 25%
    const beforeLeft = Math.random() * 80 - 40; // -40% to 40%
    const afterBottom = Math.random() * 50 - 25; // -25% to 25%
    const afterRight = Math.random() * 80 - 40; // -40% to 40%
    
    // Generate random rotation angles
    const beforeRotation = Math.random() * 360; // 0-360 degrees
    const afterRotation = Math.random() * 360; // 0-360 degrees

    // Update CSS variables
    document.documentElement.style.setProperty('--primary-color', color1);
    document.documentElement.style.setProperty('--secondary-color', color2);
    document.documentElement.style.setProperty('--tertiary-color', color3);
    document.documentElement.style.setProperty('--quaternary-color', color4);
    
    // Update position variables for transform-based animation
    document.documentElement.style.setProperty('--before-top', `${beforeTop}vw`);
    document.documentElement.style.setProperty('--before-left', `${beforeLeft}vw`);
    document.documentElement.style.setProperty('--after-bottom', `${afterBottom}vw`);
    document.documentElement.style.setProperty('--after-right', `${afterRight}vw`);
    
    // Update rotation variables
    document.documentElement.style.setProperty('--before-rotation', `${beforeRotation}deg`);
    document.documentElement.style.setProperty('--after-rotation', `${afterRotation}deg`);
}

function hslToHex(h, s, l) {
    l /= 100;
    const a = s * Math.min(l, 1 - l) / 100;
    const f = n => {
        const k = (n + h / 30) % 12;
        const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
        return Math.round(255 * color).toString(16).padStart(2, '0');
    };
    return `#${f(0)}${f(8)}${f(4)}`;
}

// Word cycling functionality
class WordCycler {
    constructor(element, words, interval = 2000) {
        this.element = element;
        this.words = words;
        this.interval = interval;
        this.currentIndex = 0;
        this.isAnimating = false;
        this.fadeOutDuration = 300;
        this.fadeInDuration = 300;
        
        // Set initial word
        this.element.textContent = this.words[0];
        
        // Start cycling
        this.startCycling();
    }
    
    startCycling() {
        setInterval(() => {
            this.cycleToNextWord();
        }, this.interval);
    }
    
    cycleToNextWord() {
        if (this.isAnimating) return;
        
        this.isAnimating = true;
        
        // Fade out current word
        this.element.style.transition = `opacity ${this.fadeOutDuration}ms ease-out`;
        this.element.style.opacity = '0';
        
        setTimeout(() => {
            // Change to next word
            this.currentIndex = (this.currentIndex + 1) % this.words.length;
            this.element.textContent = this.words[this.currentIndex];
            
            // Generate new background colors when word changes
            generateSplitComplementaryColors();
            
            // Fade in new word
            this.element.style.transition = `opacity ${this.fadeInDuration}ms ease-in`;
            this.element.style.opacity = '1';
            
            setTimeout(() => {
                this.isAnimating = false;
            }, this.fadeInDuration);
            
        }, this.fadeOutDuration);
    }
}

// Generate colors when the page loads
document.addEventListener('DOMContentLoaded', () => {
    generateSplitComplementaryColors();

    // Initialize word cycling for h1
    const h1Element = document.querySelector('.intro-cycle');
    if (h1Element) {
        const words = [
            'creative builder',
            'ui/ux designer',
            'micro animator',
            'design prototyper',
            'systems maker'
        ];
        
        new WordCycler(h1Element, words, 4000);
    }
});
