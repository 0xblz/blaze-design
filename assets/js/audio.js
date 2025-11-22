// Audio Manager
const AudioManager = {
    clickSound: null,
    
    init: function() {
        // Initialize the click sound
        this.clickSound = new Audio('/assets/audio/click.mp3');
        this.clickSound.volume = 0.3; // Set to 30% volume for a subtle effect
        this.clickSound.preload = 'auto';
    },
    
    playClick: function() {
        if (this.clickSound) {
            // Clone the audio to allow rapid successive clicks
            const sound = this.clickSound.cloneNode();
            sound.volume = 0.3;
            sound.play().catch(err => {
                // Silently handle autoplay restrictions
                console.log('Audio playback prevented:', err);
            });
        }
    }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    AudioManager.init();
});

// Make it globally accessible for other scripts
window.AudioManager = AudioManager;

