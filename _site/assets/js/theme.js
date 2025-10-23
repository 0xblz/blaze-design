// Theme toggle functionality
document.addEventListener('DOMContentLoaded', function() {
    const themeToggle = document.querySelector('.theme-toggle');
    const body = document.body;
    
    // Check for saved theme preference or default to light mode
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    // Initialize theme
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
        enableDarkTheme();
    } else {
        enableLightTheme();
    }
    
    // Add click event listener to theme toggle button
    themeToggle.addEventListener('click', function(e) {
        e.preventDefault();
        
        if (body.classList.contains('dark-theme')) {
            enableLightTheme();
        } else {
            enableDarkTheme();
        }
    });
    
    // Function to enable dark theme
    function enableDarkTheme() {
        body.classList.add('dark-theme');
        themeToggle.innerHTML = '<i class="fa-solid fa-moon"></i>'; // Moon icon for dark theme
        localStorage.setItem('theme', 'dark');
        
        // Update water color for dark theme
        if (typeof updateWaterColor === 'function') {
            updateWaterColor();
        }
    }
    
    // Function to enable light theme
    function enableLightTheme() {
        body.classList.remove('dark-theme');
        themeToggle.innerHTML = '<i class="fa-solid fa-sun"></i>'; // Sun icon for light theme
        localStorage.setItem('theme', 'light');
        
        // Update water color for light theme
        if (typeof updateWaterColor === 'function') {
            updateWaterColor();
        }
    }
    
    // Listen for system theme changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function(e) {
        if (!localStorage.getItem('theme')) {
            if (e.matches) {
                enableDarkTheme();
            } else {
                enableLightTheme();
            }
        }
    });
});