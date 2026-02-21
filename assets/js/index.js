/**
 * index.js — Homepage scripts for blaze.design
 *
 * 1. Theme toggle (light/dark) with localStorage persistence
 * 2. Page load entrance animations
 * 3. Status text typewriter effect
 * 4. Three.js particle stream background (IIFE at bottom)
 *    - Diagonal flowing river of particles (top-right → bottom-left)
 *    - S-curved path with perspective widening
 *    - Mouse hover: repulsion + color shift
 *    - Click: local scatter / 5x rapid click: full stream burst
 *    - Random FA icons (star, rocket) with per-particle rotation
 *    - Theme-aware colors, blending, and hover colors
 *    - FX toggle to enable/disable animation (localStorage persistence)
 *    - FX hidden in light mode, auto-restarts on dark if saved preference
 *    - Mobile-responsive spread and width
 *    - All tunables in CONFIG object
 */

const toggle = document.getElementById('theme-toggle');
const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');

// Check for saved preference, default to system preference
const saved = localStorage.getItem('theme');

if (saved) {
   document.documentElement.dataset.theme = saved;
   if (toggle) toggle.checked = saved === 'dark';
} else if (toggle) {
   toggle.checked = darkModeQuery.matches;
}

if (toggle) {
   toggle.addEventListener('change', () => {
      toggleSfx.currentTime = 0;
      toggleSfx.play();
      const theme = toggle.checked ? 'dark' : 'light';
      document.documentElement.dataset.theme = theme;
      localStorage.setItem('theme', theme);
   });
}

// Listen for system theme changes
darkModeQuery.addEventListener('change', (e) => {
   // Only auto-switch if user hasn't set a manual preference
   if (!localStorage.getItem('theme') && toggle) {
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

// Gallery image blur-up entrance (after parent fades in)
document.querySelectorAll('.image-set').forEach(set => {
   set.addEventListener('transitionend', (e) => {
      if (e.propertyName !== 'opacity') return;
      set.querySelectorAll('img').forEach((img, i) => {
         const reveal = () => setTimeout(() => img.classList.add('img-loaded'), i * 80);
         if (img.complete) reveal();
         else img.addEventListener('load', reveal);
      });
   }, { once: true });
});

// Preload sounds
const successSfx = new Audio('/assets/audio/success.mp3');
successSfx.volume = 0.4;
successSfx.preload = 'auto';
const toggleSfx = new Audio('/assets/audio/toggle.mp3');
toggleSfx.volume = 0.4;
toggleSfx.preload = 'auto';
const fxSfx = new Audio('/assets/audio/fx.mp3');
fxSfx.volume = 0.4;
fxSfx.preload = 'auto';

// Type out "about" in h1, then reveal status line
const aboutH1 = document.querySelector('.about h1');
const aboutSpan = document.querySelector('.about span');
if (aboutH1) {
   const fullText = aboutH1.textContent;
   aboutH1.textContent = '';
   if (aboutSpan) aboutSpan.style.display = 'none';

   let charIdx = 0;
   function typeAbout() {
      if (charIdx < fullText.length) {
         aboutH1.textContent += fullText[charIdx];
         charIdx++;
         setTimeout(typeAbout, 120);
      } else if (aboutSpan) {
         setTimeout(() => {
            // Show span — CSS animations restart fresh from display:none→flex
            aboutSpan.style.display = '';
            // Change status text after typing finishes
            setTimeout(() => {
               aboutSpan.innerHTML = 'Bio added below&nbsp;<i class="fas fa-check"></i>';
               aboutSpan.classList.add('done');
               successSfx.currentTime = 0;
               successSfx.play();
            }, 3500);
         }, 500);
      }
   }
   setTimeout(typeAbout, 400);
}

// ── Lightbox ──
const lightbox = document.createElement('div');
lightbox.className = 'lightbox';
const lightboxImg = document.createElement('img');
const lightboxPrev = document.createElement('button');
lightboxPrev.className = 'lightbox-prev';
lightboxPrev.innerHTML = '<i class="fa-solid fa-chevron-left"></i>';
const lightboxNext = document.createElement('button');
lightboxNext.className = 'lightbox-next';
lightboxNext.innerHTML = '<i class="fa-solid fa-chevron-right"></i>';
lightbox.appendChild(lightboxPrev);
lightbox.appendChild(lightboxImg);
lightbox.appendChild(lightboxNext);
document.body.appendChild(lightbox);

const allImages = Array.from(document.querySelectorAll('.image-set img'));
let currentIndex = -1;

function openLightbox(index) {
   currentIndex = index;
   const img = allImages[index];
   lightboxImg.src = img.src;
   lightboxImg.alt = img.alt || '';
   lightbox.classList.add('open');
   document.body.style.overflow = 'hidden';
}

function closeLightbox() {
   lightbox.classList.remove('open');
   document.body.style.overflow = '';
}

function animateImage(cls) {
   lightboxImg.classList.remove('slide-next', 'slide-prev');
   void lightboxImg.offsetWidth; // force reflow
   lightboxImg.classList.add(cls);
}

function showNext() {
   if (currentIndex < allImages.length - 1) {
      animateImage('slide-next');
      openLightbox(currentIndex + 1);
   }
}

function showPrev() {
   if (currentIndex > 0) {
      animateImage('slide-prev');
      openLightbox(currentIndex - 1);
   }
}

lightbox.addEventListener('click', closeLightbox);
lightboxPrev.addEventListener('click', (e) => { e.stopPropagation(); showPrev(); });
lightboxNext.addEventListener('click', (e) => { e.stopPropagation(); showNext(); });

document.addEventListener('keydown', (e) => {
   if (!lightbox.classList.contains('open')) return;
   if (e.key === 'Escape') closeLightbox();
   if (e.key === 'ArrowRight') showNext();
   if (e.key === 'ArrowLeft') showPrev();
});

// Swipe support
let touchStartX = 0;
lightbox.addEventListener('touchstart', (e) => {
   touchStartX = e.touches[0].clientX;
}, { passive: true });
lightbox.addEventListener('touchend', (e) => {
   const delta = e.changedTouches[0].clientX - touchStartX;
   if (Math.abs(delta) < 40) { closeLightbox(); return; }
   if (delta < 0) showNext();
   else showPrev();
});

allImages.forEach((img, i) => {
   img.addEventListener('click', (e) => {
      e.stopPropagation();
      openLightbox(i);
   });
});

// ── Particle Stream Background ──
(function () {
   if (typeof THREE === 'undefined') return;

   // ── Config (tweak these) ──
   const CONFIG = {
      particles:    800,           // total particle count
      width:        [400, 100],    // river width [base, random range]
      mobileWidth:  [1600, 150],    // river width on mobile (<= 768px)
      speed:        [0.0003, 0.0004], // particle speed [base, random range]
      spread:       1.3,           // lateral spread (gaussian multiplier)
      mobileSpread: 3.4,           // lateral spread on mobile (<= 768px)
      curve:        [0.28, 0.12],  // S-bend amplitudes [primary, secondary]
      mobileCurve:  [0.22, 0.10],  // S-bend amplitudes on mobile (uses H instead of W)
      widening:     [0.3, 1.4],    // perspective widening [start, quadratic scale]
      sizeRange:    [2.0, 4.0],    // dot size [min at top, added at bottom]
      alpha:        0.8,           // max particle opacity
      fadeEdge:     0.08,          // fade in/out zone at stream ends (0-1)
      mouseRadius:  420,           // cursor repulsion radius (px)
      mouseForce:   60,            // cursor repulsion strength
      color:        'hsl(211, 60%, 55%)',           // particle color
      colorHover:   'hsl(129, 100%, 58%)',           // hover color
      hoverEaseIn:  0.15,          // how fast particles ease to hover color (0-1)
      hoverEaseOut: 0.04,          // how fast particles ease back (0-1)
      clickRadius:  300,           // click scatter radius (px)
      clickForce:   [25, 15],      // scatter velocity [min, random range]
      clickFriction: 0.96,         // scatter velocity decay per frame (0-1)
      burstClicks:  5,             // rapid clicks to break the stream
      burstWindow:  1500,          // time window for rapid clicks (ms)
      burstForce:   [130, 20],      // explosion velocity [min, random range]
      burstResetDelay: 2000,       // ms before stream reforms
      icons: [                      // FA icons to scatter in stream
         { char: '\uf7bf', font: '900 48px "Font Awesome 6 Free"' },       // satellite
         { char: '\uf135', font: '900 48px "Font Awesome 6 Free"' },        // rocket (solid)
      ],
      iconRatio:     0.06,         // fraction of particles that are icons (0-1)
      iconSize:      3.0,          // icon size multiplier vs normal dots
   };

   // ── Theme colors ──
   function isDarkMode() {
      const theme = document.documentElement.dataset.theme;
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      return theme === 'dark' || (!theme && prefersDark);
   }

   function getParticleColor() {
      return new THREE.Color(CONFIG.color);
   }

   function getHoverColor() {
      return new THREE.Color(CONFIG.colorHover);
   }

   // ── Icon texture atlas ──
   var iconCount = CONFIG.icons.length;
   function createIconAtlas() {
      var size = 64;
      var c = document.createElement('canvas');
      c.width = size * iconCount;
      c.height = size;
      var ctx = c.getContext('2d');
      for (var j = 0; j < iconCount; j++) {
         ctx.font = CONFIG.icons[j].font;
         ctx.textAlign = 'center';
         ctx.textBaseline = 'middle';
         ctx.fillStyle = '#ffffff';
         ctx.fillText(CONFIG.icons[j].char, size * j + size / 2, size / 2);
      }
      var tex = new THREE.CanvasTexture(c);
      tex.needsUpdate = true;
      return tex;
   }
   var iconTexture = createIconAtlas();
   // Retry once FA fonts load
   document.fonts.ready.then(function () {
      iconTexture = createIconAtlas();
      material.uniforms.uIconTexture.value = iconTexture;
   });

   // ── Canvas & renderer ──
   const canvas = document.createElement('canvas');
   canvas.id = 'particle-canvas';
   document.body.prepend(canvas);

   const renderer = new THREE.WebGLRenderer({ canvas, alpha: true });
   renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
   renderer.setSize(window.innerWidth, window.innerHeight);

   // ── Orthographic camera in pixel coords ──
   let W = window.innerWidth;
   let H = window.innerHeight;
   const camera = new THREE.OrthographicCamera(0, W, 0, H, -1, 1);

   const scene = new THREE.Scene();

   // ── Gaussian random (Box-Muller) ──
   function gaussRandom() {
      let u = 0, v = 0;
      while (u === 0) u = Math.random();
      while (v === 0) v = Math.random();
      return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
   }

   // ── Flow path: diagonal from top-right to bottom-left with S-curves ──
   function flowPosition(t, offset, width) {
      // Base diagonal
      const x = W * (1.0 - t);
      const y = H * t;
      // Two sine bends for S-shape (curvier)
      const mobile = isMobile();
      const curveAmps = mobile ? CONFIG.mobileCurve : CONFIG.curve;
      const curveBasis = mobile ? H : W; // use H on mobile since screens are tall and narrow
      const bend = Math.sin(t * Math.PI * 2.0) * curveBasis * curveAmps[0]
                  + Math.sin(t * Math.PI * 3.5 + 0.5) * curveBasis * curveAmps[1];
      // River widens dramatically toward bottom-left
      const riverWidth = width * (CONFIG.widening[0] + t * t * CONFIG.widening[1]);
      // Perpendicular offset from centerline (diagonal is at 45 deg)
      const perpX = -offset * riverWidth * 0.707;
      const perpY =  offset * riverWidth * 0.707;
      // Apply bend perpendicular to diagonal for visible S-curve
      return { x: x + bend * 0.707 + perpX, y: y + bend * 0.707 + perpY };
   }

   // ── Init particle data ──
   const positions = new Float32Array(CONFIG.particles * 3);
   const alphas = new Float32Array(CONFIG.particles);
   const sizes = new Float32Array(CONFIG.particles);
   const colorMix = new Float32Array(CONFIG.particles);
   const isIcon = new Float32Array(CONFIG.particles);
   const rotations = new Float32Array(CONFIG.particles);

   function isMobile() { return W <= 768; }

   function getSpread() {
      return isMobile() ? CONFIG.mobileSpread : CONFIG.spread;
   }

   function getWidth() {
      const w = isMobile() ? CONFIG.mobileWidth : CONFIG.width;
      return w[0] + Math.random() * w[1];
   }

   function initParticle() {
      return {
         t: Math.random(),
         speed: CONFIG.speed[0] + Math.random() * CONFIG.speed[1],
         offset: gaussRandom() * getSpread(),
         width: getWidth(),
         icon: Math.random() < CONFIG.iconRatio ? Math.floor(Math.random() * iconCount) + 1 : 0,
         rotation: Math.random() * Math.PI * 2,
      };
   }

   // Per-particle persistent state
   const pData = [];
   for (let i = 0; i < CONFIG.particles; i++) {
      pData.push(initParticle());
   }

   function updateParticles(mouseX, mouseY) {
      for (let i = 0; i < CONFIG.particles; i++) {
         const p = pData[i];

         // Advance progress
         p.t += p.speed;
         if (p.t > 1.0) {
            p.t -= 1.0;
            Object.assign(p, initParticle());
            p.t = 0;
         }

         // Scatter decay
         if (p.sx) {
            p.sx *= CONFIG.clickFriction;
            p.sy *= CONFIG.clickFriction;
            if (Math.abs(p.sx) < 0.01) p.sx = 0;
            if (Math.abs(p.sy) < 0.01) p.sy = 0;
         }

         const pos = flowPosition(p.t, p.offset, p.width);
         let px = pos.x + (p.sx || 0);
         let py = pos.y + (p.sy || 0);

         // Mouse repulsion + hover color
         let hoverTarget = 0;
         if (mouseX >= 0 && mouseY >= 0) {
            const dx = px - mouseX;
            const dy = py - mouseY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < CONFIG.mouseRadius && dist > 0) {
               const force = (1.0 - dist / CONFIG.mouseRadius) * CONFIG.mouseForce;
               px += (dx / dist) * force;
               py += (dy / dist) * force;
               hoverTarget = 1.0 - dist / CONFIG.mouseRadius;
            }
         }
         // Ease colorMix toward target
         if (!p.colorMix) p.colorMix = 0;
         const easeRate = hoverTarget > p.colorMix ? CONFIG.hoverEaseIn : CONFIG.hoverEaseOut;
         p.colorMix += (hoverTarget - p.colorMix) * easeRate;
         colorMix[i] = p.colorMix;

         positions[i * 3] = px;
         positions[i * 3 + 1] = py;
         positions[i * 3 + 2] = 0;

         // Fade in/out at stream ends
         const edgeFade = Math.min(p.t / CONFIG.fadeEdge, (1.0 - p.t) / CONFIG.fadeEdge, 1.0);
         alphas[i] = edgeFade * CONFIG.alpha;

         // Size: small at top, larger at bottom
         var s = CONFIG.sizeRange[0] + p.t * CONFIG.sizeRange[1];
         isIcon[i] = p.icon > 0 ? p.icon : 0;
         rotations[i] = p.rotation || 0;
         sizes[i] = p.icon > 0 ? s * CONFIG.iconSize : s;
      }
   }

   // ── Geometry & material ──
   const geometry = new THREE.BufferGeometry();
   geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
   geometry.setAttribute('alpha', new THREE.BufferAttribute(alphas, 1));
   geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
   geometry.setAttribute('colorMix', new THREE.BufferAttribute(colorMix, 1));
   geometry.setAttribute('isIcon', new THREE.BufferAttribute(isIcon, 1));
   geometry.setAttribute('rotation', new THREE.BufferAttribute(rotations, 1));

   let particleColor = getParticleColor();

   const material = new THREE.ShaderMaterial({
      uniforms: {
         uColor: { value: particleColor },
         uHoverColor: { value: getHoverColor() },
         uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
         uIconTexture: { value: iconTexture },
         uIconCount: { value: iconCount },
      },
      vertexShader: `
         attribute float alpha;
         attribute float size;
         attribute float colorMix;
         attribute float isIcon;
         attribute float rotation;
         varying float vAlpha;
         varying float vColorMix;
         varying float vIsIcon;
         varying float vRotation;
         uniform float uPixelRatio;
         void main() {
            vAlpha = alpha;
            vColorMix = colorMix;
            vIsIcon = isIcon;
            vRotation = rotation;
            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
            gl_PointSize = size * uPixelRatio;
            gl_Position = projectionMatrix * mvPosition;
         }
      `,
      fragmentShader: `
         uniform vec3 uColor;
         uniform vec3 uHoverColor;
         uniform sampler2D uIconTexture;
         uniform float uIconCount;
         varying float vAlpha;
         varying float vColorMix;
         varying float vIsIcon;
         varying float vRotation;
         void main() {
            vec3 col = mix(uColor, uHoverColor, vColorMix);
            // Rotate point coords around center
            vec2 pc = gl_PointCoord - 0.5;
            float cs = cos(vRotation);
            float sn = sin(vRotation);
            vec2 rpc = vec2(pc.x * cs - pc.y * sn, pc.x * sn + pc.y * cs) + 0.5;
            if (vIsIcon > 0.5) {
               float idx = vIsIcon - 1.0;
               vec2 uv = vec2(
                  (idx + rpc.x) / uIconCount,
                  rpc.y
               );
               vec4 texel = texture2D(uIconTexture, uv);
               if (texel.a < 0.1) discard;
               gl_FragColor = vec4(col, vAlpha * texel.a);
            } else {
               float d = length(pc);
               if (d > 0.5) discard;
               float strength = 1.0 - smoothstep(0.0, 0.5, d);
               gl_FragColor = vec4(col, vAlpha * strength);
            }
         }
      `,
      transparent: true,
      blending: isDarkMode() ? THREE.AdditiveBlending : THREE.NormalBlending,
      depthWrite: false,
   });

   const points = new THREE.Points(geometry, material);
   scene.add(points);

   // ── Mouse tracking ──
   let mouseX = -9999;
   let mouseY = -9999;
   document.addEventListener('mousemove', function (e) {
      mouseX = e.clientX;
      mouseY = e.clientY;
   });

   // ── Click scatter ──
   let clickTimes = [];
   let isBurst = false;

   function burstStream() {
      isBurst = true;
      const cx = W / 2;
      const cy = H / 2;
      for (let i = 0; i < CONFIG.particles; i++) {
         const p = pData[i];
         const pos = flowPosition(p.t, p.offset, p.width);
         const angle = Math.atan2(pos.y - cy, pos.x - cx) + (Math.random() - 0.5) * 1.5;
         const vel = CONFIG.burstForce[0] + Math.random() * CONFIG.burstForce[1];
         p.sx = Math.cos(angle) * vel;
         p.sy = Math.sin(angle) * vel;
      }
      // Just re-enable clicking after the burst settles;
      // particles naturally return to the stream as sx/sy decay via clickFriction
      setTimeout(function () {
         isBurst = false;
      }, CONFIG.burstResetDelay);
   }

   document.addEventListener('click', function (e) {
      if (isBurst) return;

      // Track rapid clicks
      const now = Date.now();
      clickTimes.push(now);
      clickTimes = clickTimes.filter(function (t) { return now - t < CONFIG.burstWindow; });

      if (clickTimes.length >= CONFIG.burstClicks) {
         clickTimes = [];
         burstStream();
         return;
      }

      // Normal scatter
      const cx = e.clientX;
      const cy = e.clientY;
      for (let i = 0; i < CONFIG.particles; i++) {
         const p = pData[i];
         const pos = flowPosition(p.t, p.offset, p.width);
         const dx = pos.x - cx;
         const dy = pos.y - cy;
         const dist = Math.sqrt(dx * dx + dy * dy);
         if (dist < CONFIG.clickRadius && dist > 0) {
            const strength = (1.0 - dist / CONFIG.clickRadius);
            const vel = CONFIG.clickForce[0] + Math.random() * CONFIG.clickForce[1];
            p.sx = (p.sx || 0) + (dx / dist) * vel * strength;
            p.sy = (p.sy || 0) + (dy / dist) * vel * strength;
         }
      }
   });

   // ── Theme observer ──
   function onThemeChange() {
      particleColor = getParticleColor();
      material.uniforms.uColor.value = particleColor;
      material.uniforms.uHoverColor.value = getHoverColor();
      material.blending = isDarkMode() ? THREE.AdditiveBlending : THREE.NormalBlending;
      material.needsUpdate = true;
   }

   const observer = new MutationObserver(function (mutations) {
      for (const m of mutations) {
         if (m.attributeName === 'data-theme') {
            onThemeChange();
            break;
         }
      }
   });
   observer.observe(document.documentElement, { attributes: true });

   window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', onThemeChange);

   // ── Resize ──
   window.addEventListener('resize', function () {
      W = window.innerWidth;
      H = window.innerHeight;
      renderer.setSize(W, H);
      camera.right = W;
      camera.bottom = H;
      camera.updateProjectionMatrix();
   });

   // ── FX toggle ──
   let fxEnabled = false;
   let animId = null;
   const fxToggle = document.getElementById('fx-toggle');
   const themeToggle = document.getElementById('theme-toggle');

   function startFx() {
      if (animId) return;
      fxEnabled = true;
      if (fxToggle) fxToggle.checked = true;
      canvas.style.display = '';
      function animate() {
         animId = requestAnimationFrame(animate);
         updateParticles(mouseX, mouseY);
         geometry.attributes.position.needsUpdate = true;
         geometry.attributes.alpha.needsUpdate = true;
         geometry.attributes.size.needsUpdate = true;
         geometry.attributes.colorMix.needsUpdate = true;
         geometry.attributes.isIcon.needsUpdate = true;
         geometry.attributes.rotation.needsUpdate = true;
         renderer.render(scene, camera);
      }
      animate();
   }

   function stopFx() {
      fxEnabled = false;
      if (fxToggle) fxToggle.checked = false;
      if (animId) {
         cancelAnimationFrame(animId);
         animId = null;
      }
      canvas.style.display = 'none';
   }

   if (fxToggle) {
      fxToggle.addEventListener('change', function () {
         if (fxToggle.checked) {
            fxSfx.currentTime = 0;
            fxSfx.play();
         } else {
            toggleSfx.currentTime = 0;
            toggleSfx.play();
         }
         if (fxToggle.checked) {
            // Force dark mode when FX turns on
            document.documentElement.dataset.theme = 'dark';
            localStorage.setItem('theme', 'dark');
            if (themeToggle) themeToggle.checked = true;
            localStorage.setItem('fx', 'on');
            startFx();
         } else {
            localStorage.setItem('fx', 'off');
            stopFx();
         }
      });
   }

   // Sync FX with theme: stop on light, restart on dark
   var fxThemeObserver = new MutationObserver(function (mutations) {
      for (var m of mutations) {
         if (m.attributeName === 'data-theme') {
            if (isDarkMode() && !fxEnabled && localStorage.getItem('fx') === 'on') startFx();
            else if (!isDarkMode() && fxEnabled) stopFx();
            break;
         }
      }
   });
   fxThemeObserver.observe(document.documentElement, { attributes: true });

   // Start FX based on saved preference (default: on in dark mode)
   const savedFx = localStorage.getItem('fx');
   if (isDarkMode() && savedFx === 'on') {
      startFx();
   }
})();
