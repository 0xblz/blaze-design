const toggle = document.getElementById('theme-toggle');
const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');

// Check for saved preference, default to system preference
const saved = localStorage.getItem('theme');

if (saved) {
   document.documentElement.dataset.theme = saved;
   toggle.checked = saved === 'dark';
} else {
   toggle.checked = darkModeQuery.matches;
}

toggle.addEventListener('change', () => {
   const theme = toggle.checked ? 'dark' : 'light';
   document.documentElement.dataset.theme = theme;
   localStorage.setItem('theme', theme);
});

// Listen for system theme changes
darkModeQuery.addEventListener('change', (e) => {
   // Only auto-switch if user hasn't set a manual preference
   if (!localStorage.getItem('theme')) {
      toggle.checked = e.matches;
   }
});

// Page load animation
document.querySelectorAll('main > *').forEach((el, i) => {
   el.style.setProperty('--i', i + 1);
});
requestAnimationFrame(() => {
   document.body.classList.add('loaded');
});

// Change status text after 3 seconds
setTimeout(() => {
   const status = document.querySelector('.about span');
   if (status) {
      status.innerHTML = 'Bio added below&nbsp;<i class="fas fa-check"></i>';
      status.classList.add('done');
   }
}, 4000);
