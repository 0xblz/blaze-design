const images = [
    '/assets/images/uno-1.jpg',
    '/assets/images/uno-2.jpg',
    '/assets/images/uno-3.jpg',
    '/assets/images/uno-4.jpg',
    '/assets/images/uno-5.jpg',
    '/assets/images/windvector-1.jpg',
    '/assets/images/windvector-2.jpg',
    '/assets/images/windvector-3.jpg',
    '/assets/images/windvector-4.jpg',
    '/assets/images/earth-data-1.jpg',
    '/assets/images/earth-data-2.jpg',
    '/assets/images/earth-data-3.jpg',
    '/assets/images/earth-data-4.jpg',
    '/assets/images/howstheroads-1.jpg',
    '/assets/images/howstheroads-2.jpg',
    '/assets/images/howstheroads-3.jpg',
    '/assets/images/dial-1.jpg',
    '/assets/images/dial-2.jpg',
    '/assets/images/dial-3.jpg',
    '/assets/images/dial-4.jpg',
    '/assets/images/3d-viewer-1.jpg',
    '/assets/images/3d-viewer-2.jpg',
    '/assets/images/3d-viewer-3.jpg',
    '/assets/images/party-1.jpg',
    '/assets/images/party-2.jpg',
    '/assets/images/party-3.jpg',
    '/assets/images/showtime-1.jpg',
    '/assets/images/showtime-2.jpg',
    '/assets/images/showtime-3.jpg',
    '/assets/images/showtime-4.jpg',
];

const lightbox = document.getElementById('lightbox');
const lightboxImg = lightbox.querySelector('img');
const btnClose = lightbox.querySelector('.lightbox-close');
const btnPrev = lightbox.querySelector('.lightbox-prev');
const btnNext = lightbox.querySelector('.lightbox-next');
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

function next() {
    if (current < images.length - 1) show(current + 1);
}

function prev() {
    if (current > 0) show(current - 1);
}

document.getElementById('gallery-link').addEventListener('click', function (e) {
    e.preventDefault();
    show(0);
});

btnClose.addEventListener('click', function (e) { e.stopPropagation(); close(); });
btnPrev.addEventListener('click', function (e) { e.stopPropagation(); prev(); });
btnNext.addEventListener('click', function (e) { e.stopPropagation(); next(); });

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
    close();
});
