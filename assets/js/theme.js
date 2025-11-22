// Theme Switcher
document.addEventListener('DOMContentLoaded', function() {
    const colorButtons = document.querySelectorAll('.colors .color');
    const root = document.documentElement;
    
    // Load saved theme from localStorage, or default to theme 1
    const savedTheme = localStorage.getItem('theme') || '1';
    applyTheme(savedTheme);
    updateActiveButton(savedTheme);
    
    // Add click event listeners to each color button
    colorButtons.forEach((button, index) => {
        button.addEventListener('click', function() {
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
});

