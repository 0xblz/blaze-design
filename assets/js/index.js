const toggle = document.getElementById('theme-toggle');

// Check for saved preference, default to system preference
const saved = localStorage.getItem('theme');
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

if (saved) {
   document.documentElement.dataset.theme = saved;
   toggle.checked = saved === 'dark';
} else {
   toggle.checked = prefersDark;
}

toggle.addEventListener('change', () => {
   const theme = toggle.checked ? 'dark' : 'light';
   document.documentElement.dataset.theme = theme;
   localStorage.setItem('theme', theme);
});

// Page load animation
document.querySelectorAll('main > *').forEach((el, i) => {
   el.style.setProperty('--i', i + 1);
});
requestAnimationFrame(() => {
   document.body.classList.add('loaded');
});
