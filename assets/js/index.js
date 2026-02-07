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

         const pos = flowPosition(p.t, p.offset, p.width);
         let px = pos.x;
         let py = pos.y;

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

   // ── Render loop ──
   function animate() {
      requestAnimationFrame(animate);
      updateParticles(mouseX, mouseY);
      geometry.attributes.position.needsUpdate = true;
      geometry.attributes.alpha.needsUpdate = true;
      geometry.attributes.size.needsUpdate = true;
      geometry.attributes.colorMix.needsUpdate = true;
      renderer.render(scene, camera);
   }
   animate();
})();
