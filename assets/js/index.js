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

// Change status text after 3 seconds
setTimeout(() => {
   const status = document.querySelector('.about span');
   if (status) {
      status.innerHTML = 'Bio added below&nbsp;<i class="fas fa-check"></i>';
      status.classList.add('done');
   }
}, 4000);

// ── Particle Stream Background ──
(function () {
   if (typeof THREE === 'undefined') return;

   // ── Config (tweak these) ──
   const CONFIG = {
      particles:    800,           // total particle count
      width:        [300, 100],    // river width [base, random range]
      speed:        [0.0003, 0.0004], // particle speed [base, random range]
      spread:       0.3,           // lateral spread (gaussian multiplier)
      curve:        [0.18, 0.10],  // S-bend amplitudes [primary, secondary]
      widening:     [0.3, 1.4],    // perspective widening [start, quadratic scale]
      sizeRange:    [2.0, 4.0],    // dot size [min at top, added at bottom]
      alpha:        0.8,           // max particle opacity
      fadeEdge:     0.08,          // fade in/out zone at stream ends (0-1)
      mouseRadius:  420,           // cursor repulsion radius (px)
      mouseForce:   60,            // cursor repulsion strength
      colorDark:    'hsl(211, 60%, 55%)',  // particle color in dark mode
      colorLight:   'hsl(211, 100%, 90%)',  // particle color in light mode
      colorHoverDark:  'hsl(129, 100%, 58%)',           // hover color in dark mode
      colorHoverLight: 'hsl(211, 100%, 58%)',           // hover color in light mode
      hoverEaseIn:  0.15,          // how fast particles ease to hover color (0-1)
      hoverEaseOut: 0.04,          // how fast particles ease back (0-1)
      clickRadius:  300,           // click scatter radius (px)
      clickForce:   [25, 15],      // scatter velocity [min, random range]
      clickFriction: 0.96,         // scatter velocity decay per frame (0-1)
      burstClicks:  5,             // rapid clicks to break the stream
      burstWindow:  1500,          // time window for rapid clicks (ms)
      burstForce:   [30, 20],      // explosion velocity [min, random range]
      burstResetDelay: 2000,       // ms before stream reforms
   };

   // ── Theme colors ──
   function isDarkMode() {
      const theme = document.documentElement.dataset.theme;
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      return theme === 'dark' || (!theme && prefersDark);
   }

   function getParticleColor() {
      return isDarkMode()
         ? new THREE.Color(CONFIG.colorDark)
         : new THREE.Color(CONFIG.colorLight);
   }

   function getHoverColor() {
      return isDarkMode()
         ? new THREE.Color(CONFIG.colorHoverDark)
         : new THREE.Color(CONFIG.colorHoverLight);
   }

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
      const bend = Math.sin(t * Math.PI * 2.0) * W * CONFIG.curve[0]
                  + Math.sin(t * Math.PI * 3.5 + 0.5) * W * CONFIG.curve[1];
      // River widens dramatically toward bottom-left
      const riverWidth = width * (CONFIG.widening[0] + t * t * CONFIG.widening[1]);
      // Perpendicular offset from centerline (diagonal is at 45 deg)
      const perpX = -offset * riverWidth * 0.707;
      const perpY =  offset * riverWidth * 0.707;
      return { x: x + bend + perpX, y: y + perpY };
   }

   // ── Init particle data ──
   const positions = new Float32Array(CONFIG.particles * 3);
   const alphas = new Float32Array(CONFIG.particles);
   const sizes = new Float32Array(CONFIG.particles);
   const colorMix = new Float32Array(CONFIG.particles);

   function initParticle() {
      return {
         t: Math.random(),
         speed: CONFIG.speed[0] + Math.random() * CONFIG.speed[1],
         offset: gaussRandom() * CONFIG.spread,
         width: CONFIG.width[0] + Math.random() * CONFIG.width[1],
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
         sizes[i] = CONFIG.sizeRange[0] + p.t * CONFIG.sizeRange[1];
      }
   }

   // ── Geometry & material ──
   const geometry = new THREE.BufferGeometry();
   geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
   geometry.setAttribute('alpha', new THREE.BufferAttribute(alphas, 1));
   geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
   geometry.setAttribute('colorMix', new THREE.BufferAttribute(colorMix, 1));

   let particleColor = getParticleColor();

   const material = new THREE.ShaderMaterial({
      uniforms: {
         uColor: { value: particleColor },
         uHoverColor: { value: getHoverColor() },
         uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
      },
      vertexShader: `
         attribute float alpha;
         attribute float size;
         attribute float colorMix;
         varying float vAlpha;
         varying float vColorMix;
         uniform float uPixelRatio;
         void main() {
            vAlpha = alpha;
            vColorMix = colorMix;
            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
            gl_PointSize = size * uPixelRatio;
            gl_Position = projectionMatrix * mvPosition;
         }
      `,
      fragmentShader: `
         uniform vec3 uColor;
         uniform vec3 uHoverColor;
         varying float vAlpha;
         varying float vColorMix;
         void main() {
            float d = length(gl_PointCoord - vec2(0.5));
            if (d > 0.5) discard;
            float strength = 1.0 - smoothstep(0.0, 0.5, d);
            vec3 col = mix(uColor, uHoverColor, vColorMix);
            gl_FragColor = vec4(col, vAlpha * strength);
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
      setTimeout(function () {
         for (let i = 0; i < CONFIG.particles; i++) {
            Object.assign(pData[i], initParticle());
            pData[i].sx = 0;
            pData[i].sy = 0;
            pData[i].colorMix = 0;
         }
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
   let fxEnabled = true;
   let animId = null;
   const fxToggle = document.getElementById('fx-toggle');

   function startFx() {
      if (animId) return;
      canvas.style.display = '';
      function animate() {
         animId = requestAnimationFrame(animate);
         updateParticles(mouseX, mouseY);
         geometry.attributes.position.needsUpdate = true;
         geometry.attributes.alpha.needsUpdate = true;
         geometry.attributes.size.needsUpdate = true;
         geometry.attributes.colorMix.needsUpdate = true;
         renderer.render(scene, camera);
      }
      animate();
   }

   function stopFx() {
      if (animId) {
         cancelAnimationFrame(animId);
         animId = null;
      }
      canvas.style.display = 'none';
   }

   if (fxToggle) {
      fxToggle.addEventListener('change', function () {
         fxEnabled = fxToggle.checked;
         fxEnabled ? startFx() : stopFx();
      });
   }

   startFx();
})();
