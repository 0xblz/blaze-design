var images = window.galleryImages || [];

// ─── Card flip ───────────────────────────────────────────────────────────────
var card = document.getElementById('card');
card.addEventListener('click', function (e) {
    if (e.target.closest('a')) return;
    card.classList.toggle('flipped');
});

// ─── Lightbox ────────────────────────────────────────────────────────────────
const lightbox = document.getElementById('lightbox');
const lightboxImg = lightbox.querySelector('img');
const btnClose = lightbox.querySelector('.lightbox-close');
const btnPrev = lightbox.querySelector('.lightbox-prev');
const btnNext = lightbox.querySelector('.lightbox-next');
const spinner = lightbox.querySelector('.lightbox-spinner');
let current = 0;

function show(i) {
    current = i;
    lightboxImg.src = images[current];
    lightbox.classList.add('open');
    document.body.style.overflow = 'hidden';
}

function close() {
    lightbox.classList.remove('open');
    document.body.style.overflow = '';
}

function crossfade(i) {
    lightboxImg.style.opacity = 0;
    setTimeout(function () {
        current = i;
        spinner.classList.add('visible');
        var img = new Image();
        img.onload = function () {
            lightboxImg.src = images[current];
            lightboxImg.style.opacity = 1;
            spinner.classList.remove('visible');
        };
        img.src = images[i];
    }, 150);
}

function next() {
    if (current < images.length - 1) {
        crossfade(current + 1);
    }
}

function prev() {
    if (current > 0) {
        crossfade(current - 1);
    }
}

document.getElementById('gallery-link').addEventListener('click', function (e) {
    e.preventDefault();
    e.stopPropagation();
    show(0);
});

btnClose.addEventListener('click', function (e) { e.stopPropagation(); close(); });
btnPrev.addEventListener('click', function (e) { e.stopPropagation(); prev(); });
btnNext.addEventListener('click', function (e) { e.stopPropagation(); next(); });

[btnClose, btnPrev, btnNext].forEach(function (btn) {
    btn.addEventListener('touchend', function (e) { e.stopPropagation(); });
});

document.addEventListener('keydown', function (e) {
    if (!lightbox.classList.contains('open')) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowRight') next();
    if (e.key === 'ArrowLeft') prev();
});

let touchStartX = 0;
let swiped = false;
lightbox.addEventListener('touchstart', function (e) {
    touchStartX = e.touches[0].clientX;
    swiped = false;
}, { passive: true });
lightbox.addEventListener('touchend', function (e) {
    const delta = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(delta) < 40) {
        close();
        return;
    }
    swiped = true;
    if (delta < 0) next(); else prev();
});

lightbox.addEventListener('click', function (e) {
    if (swiped) { swiped = false; return; }
    if (e.target === lightbox) close();
});
