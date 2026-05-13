var images = window.galleryImages || [];

// ─── Card flip ───────────────────────────────────────────────────────────────
var card = document.getElementById('card');
var isFlipped = false;

// Populated by the tilt IIFE — aborts any in-flight spring-back before a flip.
var cancelSpringBack = function () {};

card.addEventListener('click', function (e) {
    if (e.target.closest('a')) return;
    cancelSpringBack();
    card.style.transition = '';
    card.style.transform = '';
    isFlipped = !isFlipped;
    card.classList.add('flipping');
    card.classList.toggle('flipped', isFlipped);
});
card.addEventListener('transitionend', function (e) {
    if (e.propertyName === 'transform') card.classList.remove('flipping');
});

// ─── Card tilt ───────────────────────────────────────────────────────────────
// Tilt is applied directly to .card, composing with the flip transform.
// Guide lines stay flat — only the card moves.
(function () {
    if (!window.matchMedia('(hover: hover)').matches) return;

    var frame = card.closest('.card-frame');
    if (!frame) return;

    var faces = frame.querySelectorAll('.card-face');

    var MAX_TILT      = 10;
    var MAX_SHADOW    = 18;
    var SHADOW_BLUR   = 40;
    var SHADOW_SPREAD = -8;
    var SHADOW_ALPHA  = 0.22;

    var rafId      = null;
    var targetRotX = 0;
    var targetRotY = 0;
    var targetMx   = 50;
    var targetMy   = 50;
    var active     = false;

    function getFlipY() {
        return isFlipped ? 180 : 0;
    }

    function applyTilt(rotX, rotY, mx, my) {
        card.style.transform = 'rotateX(' + rotX + 'deg) rotateY(' + (getFlipY() + rotY) + 'deg)';
        card.style.setProperty('--mx', mx.toFixed(2) + '%');
        card.style.setProperty('--my', my.toFixed(2) + '%');

        var nx = rotY / MAX_TILT;
        var ny = -rotX / MAX_TILT;
        card.style.setProperty('--angle', (Math.atan2(ny, nx) * (180 / Math.PI) + 90).toFixed(2) + 'deg');
        var sx = -nx * MAX_SHADOW;
        var sy = -ny * MAX_SHADOW;
        var dist = Math.sqrt(nx * nx + ny * ny);
        var alpha = SHADOW_ALPHA + dist * 0.12;
        var shadow = sx + 'px ' + sy + 'px ' + SHADOW_BLUR + 'px ' + SHADOW_SPREAD + 'px rgba(0,0,0,' + alpha.toFixed(3) + ')';

        for (var i = 0; i < faces.length; i++) {
            faces[i].style.boxShadow = shadow;
        }
    }

    function resetTilt() {
        card.style.transition = 'transform 0.55s cubic-bezier(0.16, 1, 0.3, 1)';
        card.style.transform = 'rotateX(0deg) rotateY(' + getFlipY() + 'deg)';
        for (var i = 0; i < faces.length; i++) {
            faces[i].style.boxShadow = '';
        }
        // Clear inline transition once spring-back finishes so it doesn't
        // interfere with future flips. Stored so a click can abort it first.
        function cleanup(e) {
            if (e.target !== card || e.propertyName !== 'transform') return;
            card.removeEventListener('transitionend', cleanup);
            cancelSpringBack = function () {};
            if (!active) card.style.transition = '';
        }
        card.addEventListener('transitionend', cleanup);
        cancelSpringBack = function () {
            card.removeEventListener('transitionend', cleanup);
            cancelSpringBack = function () {};
        };
    }

    function tick() {
        rafId = null;
        if (!active) return;
        applyTilt(targetRotX, targetRotY, targetMx, targetMy);
    }

    frame.addEventListener('mousemove', function (e) {
        if (card.classList.contains('flipping')) return;

        var rect = frame.getBoundingClientRect();
        var nx = ((e.clientX - rect.left) / rect.width  - 0.5) * 2;
        var ny = ((e.clientY - rect.top)  / rect.height - 0.5) * 2;

        targetRotY =  nx * MAX_TILT;
        targetRotX = -ny * MAX_TILT;
        targetMx   = (nx * 0.5 + 0.5) * 100;
        targetMy   = (ny * 0.5 + 0.5) * 100;

        if (!active) {
            active = true;
            card.style.transition = 'none';
        }

        if (rafId === null) {
            rafId = requestAnimationFrame(tick);
        }
    });

    frame.addEventListener('mouseleave', function () {
        active = false;
        if (rafId !== null) {
            cancelAnimationFrame(rafId);
            rafId = null;
        }
        resetTilt();
    });
}());

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
