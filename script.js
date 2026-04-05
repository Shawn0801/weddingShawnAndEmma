(function initPetalTrail() {
  const container = document.getElementById('heart-trail-container'); // 沿用之前的容器 ID
  if (!container) return;

  let lastMousePos = { x: 0, y: 0 };
  const threshold = 12; // 游標移動超過 12px 產生一片花瓣

  // 花瓣色調組合（搭配你的婚禮色系）
  const petalColors = [
    '#c8553a', // var(--color-accent)
    '#e07455', // var(--color-accent-light)
    '#f0ece6'  // var(--color-white-warm)
  ];

  window.addEventListener('mousemove', (e) => {
    const distance = Math.hypot(e.clientX - lastMousePos.x, e.clientY - lastMousePos.y);

    if (distance > threshold) {
      createPetal(e.clientX, e.clientY);
      lastMousePos = { x: e.clientX, y: e.clientY };
    }
  });

  function createPetal(x, y) {
    const petal = document.createElement('div');
    petal.className = 'trail-petal';

    // 使用花瓣符號 (也可以換成你喜歡的符號，如 ❀, ✿, 🌸)
    petal.innerHTML = '❀';

    const size = Math.random() * 12 + 8;
    const color = petalColors[Math.floor(Math.random() * petalColors.colors)];

    petal.style.fontSize = `${size}px`;
    petal.style.color = petalColors[Math.floor(Math.random() * petalColors.length)];
    petal.style.left = `${x}px`;
    petal.style.top = `${y}px`;
    petal.style.opacity = Math.random() * 0.5 + 0.3; // 隨機透明度 (0.3 ~ 0.8)

    container.appendChild(petal);

    // GSAP 飄落動畫
    gsap.to(petal, {
      duration: Math.random() * 2 + 1.5, // 飄落時間較長
      y: 80 + Math.random() * 100,      // 向下飄移
      x: (Math.random() - 0.5) * 100,   // 較大幅度的左右晃動
      rotationX: Math.random() * 360,   // 3D 翻轉感
      rotationZ: Math.random() * 360,
      opacity: 0,
      scale: 0.3,
      ease: "sine.out",                 // 使用正弦曲線讓動作更柔和
      onComplete: () => petal.remove()
    });
  }
})();


/* ═══════════════════════════════════════════════════════════════════
   THREE.JS — 3D TULIP ANIMATION

   Creates an interactive 3D tulip that follows the user's scroll:
   ① HERO: Positioned LEFT of "Shawn & Emma", tilted LEFT
   ② GROOM: Stays LEFT side, tilted LEFT
   ③ CROSSOVER: Sweeps from LEFT to RIGHT between sections
   ④ BRIDE: Positioned RIGHT, tilted RIGHT (mirrors groom)
   ⑤ GALLERY: Faded to background, parked far right
   ⑥ FOOTER: RIGHT side, tilts RIGHT, petals bloom open
   ═══════════════════════════════════════════════════════════════════ */
(function initTulip3D() {
  if (window.innerWidth <= 639) return;
  // ─── RENDERER SETUP ───
  const canvas = document.getElementById('tulip-canvas');
  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,      // Transparent background
    antialias: true   // Smooth edges
  });
  // Cap pixel ratio to 2 for performance (prevents 3x rendering on high-DPI displays)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);

  // ─── SCENE & CAMERA ───
  const scene = new THREE.Scene();
  // PerspectiveCamera: (FOV, aspect ratio, near clip, far clip)
  const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.set(0, 0, 8); // Camera positioned 8 units back from origin

  // ─── ENHANCED LIGHTING SYSTEM ───
  // Ambient light: soft base illumination (warm white)
  scene.add(new THREE.AmbientLight(0xfff8f0, 0.5));

  // Main directional light: key light from upper right (warm peachy tone)
  const dirLight = new THREE.DirectionalLight(0xffe0cc, 1.0);
  dirLight.position.set(3, 5, 4); // Upper right front
  scene.add(dirLight);

  // Rim light: accent from behind (reddish tone matches petal color)
  const rimLight = new THREE.DirectionalLight(0xc8553a, 0.35);
  rimLight.position.set(-2, 2, -3); // Behind and to the left
  scene.add(rimLight);

  // Fill light: soften shadows from below (warm orange)
  const fillLight = new THREE.DirectionalLight(0xffd4a3, 0.25);
  fillLight.position.set(-1, -2, 2); // Below and front
  scene.add(fillLight);

  // ─── BUILD TULIP GROUP ───
  // Group contains: stem, leaves, petals, pistil, pollen
  const tulipGroup = new THREE.Group();
  scene.add(tulipGroup);

  // ─── STEM: Curved green stem ───
  // Create curved path using quadratic bezier (start, control, end)
  const stemCurve = new THREE.QuadraticBezierCurve3(
    new THREE.Vector3(0, -2.2, 0),      // Bottom (root)
    new THREE.Vector3(0.15, -0.8, 0.1), // Control point (creates natural curve)
    new THREE.Vector3(0, 0.6, 0)        // Top (where flower attaches)
  );
  // Create tube geometry following the curve
  const stem = new THREE.Mesh(
    new THREE.TubeGeometry(
      stemCurve,  // Path to follow
      32,         // Path segments (smoothness)
      0.06,       // Tube radius
      12,         // Radial segments (roundness)
      false       // Not closed
    ),
    new THREE.MeshStandardMaterial({
      color: 0x5a7247,              // Dark green
      roughness: 0.75,              // Slightly rough surface
      metalness: 0.02,              // Barely metallic
      emissive: 0x2a3620,           // Subtle dark green glow
      emissiveIntensity: 0.05       // Very faint
    })
  );
  tulipGroup.add(stem);

  // ─── LEAVES: Two elongated leaves along stem ───
  // Factory function to create leaf on left or right side
  function createLeaf(side) {
    // Create 2D shape for leaf using bezier curves
    const shape = new THREE.Shape();
    shape.moveTo(0, 0); // Start at base

    // Draw natural tulip leaf outline with bezier curves
    // side = -1 for left, +1 for right
    shape.bezierCurveTo(side * 0.3, 0.2, side * 0.65, 0.6, side * 0.4, 1.0);  // Bulge outward
    shape.bezierCurveTo(side * 0.2, 1.3, side * 0.08, 1.5, side * 0.0, 1.6); // Taper to tip
    shape.bezierCurveTo(side * -0.05, 1.3, side * 0.05, 0.7, 0, 0);           // Return to base

    // Extrude 2D shape into 3D with rounded beveled edges
    const geometry = new THREE.ExtrudeGeometry(shape, {
      depth: 0.015,           // Thin leaf
      bevelEnabled: true,     // Rounded edges
      bevelThickness: 0.012,  // Bevel depth
      bevelSize: 0.015,       // Bevel width
      bevelSegments: 3,       // Bevel smoothness
      curveSegments: 20       // Outline smoothness
    });

    return new THREE.Mesh(
      geometry,
      new THREE.MeshStandardMaterial({
        color: 0x6b8a55,              // Medium green
        roughness: 0.65,              // Slightly rough (natural leaf texture)
        metalness: 0.03,              // Non-metallic
        emissive: 0x2d3a25,           // Dark green subtle glow
        emissiveIntensity: 0.04,      // Very faint
        side: THREE.DoubleSide        // Visible from both sides
      })
    );
  }

  // Create and position left leaf
  const leafL = createLeaf(-1);
  leafL.position.set(0.05, -1.6, 0.05);  // Lower on stem, slightly forward
  leafL.rotation.z = 0.2;                // Angle outward
  leafL.rotation.y = -0.1;               // Slight twist
  tulipGroup.add(leafL);

  // Create and position right leaf (higher than left for natural asymmetry)
  const leafR = createLeaf(1);
  leafR.position.set(-0.05, -1.3, -0.05); // Higher on stem, slightly back
  leafR.rotation.z = -0.15;               // Angle outward (opposite)
  leafR.rotation.y = 0.1;                 // Slight twist (opposite)
  tulipGroup.add(leafR);

  // ─── FLOWER HEAD GROUP ───
  // Contains petals and pistil (center), positioned at top of stem
  const petalGroup = new THREE.Group();
  petalGroup.position.set(0, 0.6, 0); // Top of stem
  tulipGroup.add(petalGroup);

  // ─── PISTIL: Yellow flower center ───
  const pistilBase = new THREE.Mesh(
    new THREE.SphereGeometry(0.12, 16, 16), // Smooth sphere
    new THREE.MeshStandardMaterial({
      color: 0xe8d44d,              // Bright yellow
      roughness: 0.6,               // Slightly matte
      metalness: 0.1,               // Hint of shine
      emissive: 0xd4c042,           // Golden glow
      emissiveIntensity: 0.15       // Moderate glow
    })
  );
  pistilBase.position.y = 0.1;      // Slightly above petal base
  pistilBase.scale.set(1, 1.3, 1);  // Stretch vertically (egg-shaped)
  petalGroup.add(pistilBase);

  // ─── POLLEN PARTICLES: Tiny spheres around pistil ───
  const pollenGroup = new THREE.Group();
  pollenGroup.position.copy(pistilBase.position);

  // Create ring of pollen particles
  for (let i = 0; i < 12; i++) {
    const angle = (i / 12) * Math.PI * 2;  // Evenly spaced around circle
    const radius = 0.11;                   // Distance from pistil center

    const pollen = new THREE.Mesh(
      new THREE.SphereGeometry(0.015, 6, 6), // Tiny sphere
      new THREE.MeshStandardMaterial({
        color: 0xfff4a3,              // Light yellow
        roughness: 0.8,               // Very matte
        emissive: 0xffe870,           // Bright yellow glow
        emissiveIntensity: 0.2        // Noticeable glow
      })
    );

    // Position around pistil in circular pattern
    pollen.position.set(
      Math.cos(angle) * radius,           // X position
      0.15 + Math.random() * 0.02,        // Y with slight random variation
      Math.sin(angle) * radius            // Z position
    );
    pollenGroup.add(pollen);
  }
  petalGroup.add(pollenGroup);

  // Reference to pistil for bloom animation (will scale during animation)
  const pistil = pistilBase;

  // ─── PETAL FACTORY: Creates individual tulip petal ───
  function createPetal(color, index) {
    // Create 2D petal outline using bezier curves
    const shape = new THREE.Shape();
    shape.moveTo(0, 0); // Base of petal (attached to center)

    // Add subtle size variation (even petals slightly larger)
    const variation = index % 2 === 0 ? 1.0 : 0.98;

    // Draw classic tulip petal shape: wide at middle, pointed at top
    // Left side of petal
    shape.bezierCurveTo(-0.38 * variation, 0.25, -0.4 * variation, 0.7, -0.15, 1.1);
    // Top curve (rounded tip)
    shape.bezierCurveTo(-0.05, 1.35, 0.05, 1.35, 0.15, 1.1);
    // Right side of petal (back to base)
    shape.bezierCurveTo(0.4 * variation, 0.7, 0.38 * variation, 0.25, 0, 0);

    // Extrude 2D shape into 3D with smooth beveled edges
    const geometry = new THREE.ExtrudeGeometry(shape, {
      depth: 0.025,           // Petal thickness
      bevelEnabled: true,     // Smooth rounded edges
      bevelThickness: 0.018,  // Edge roundness depth
      bevelSize: 0.022,       // Edge roundness width
      bevelSegments: 4,       // Smoothness of bevel
      curveSegments: 24       // Smoothness of outline
    });

    // Create color gradient effect (darker at base)
    const baseColor = new THREE.Color(color);
    const darkerColor = baseColor.clone().multiplyScalar(0.85); // 15% darker

    return new THREE.Mesh(
      geometry,
      new THREE.MeshStandardMaterial({
        color: color,                 // Base petal color (red/orange)
        roughness: 0.5,               // Slightly glossy (silky texture)
        metalness: 0.08,              // Minimal metallic sheen
        emissive: darkerColor,        // Subtle darker glow at edges
        emissiveIntensity: 0.08,      // Very subtle
        side: THREE.DoubleSide        // Visible from both sides
      })
    );
  }

  // ─── CREATE 6 PETALS IN CIRCULAR ARRANGEMENT ───
  const petalPivots = []; // Store petal references for bloom animation
  // Three shades of red/orange for natural color variation
  const petalColors = [0xc8553a, 0xd4634a, 0xba4a33, 0xc8553a, 0xd4634a, 0xba4a33];
  const petalCount = 6;

  for (let i = 0; i < petalCount; i++) {
    // Create pivot group for each petal (enables bloom rotation)
    const pivot = new THREE.Group();
    pivot.rotation.y = (i / petalCount) * Math.PI * 2; // Distribute in circle (60° apart)

    // Create petal with slight natural variations
    const petal = createPetal(petalColors[i], i);
    petal.rotation.x = -0.15 - (i % 2) * 0.02; // Slight alternating tilt inward
    petal.position.y = 0.01 * (i % 3);         // Slight height variation

    pivot.add(petal);
    petalGroup.add(pivot);
    petalPivots.push({ pivot, petal }); // Store for animation
  }

  // ─── INITIAL STATE: Position tulip on left side for hero section ───
  tulipGroup.scale.set(0.65, 0.65, 0.65);   // Initial size (65% of full)
  tulipGroup.position.set(-3.8, 0.2, 0);    // Left side positioning
  tulipGroup.rotation.z = 0.5;              // Tilted left (~30 degrees for elegant lean)

  // ─── SCROLL TRACKING VARIABLES ───
  let scrollProgress = 0;       // Overall page scroll (0-1)
  let bloomProgress = 0;        // Flower bloom animation (0-1)
  let targetBloom = 0;          // Target bloom value for smooth transition
  let brideSectionProgress = 0; // Bride section visibility progress (0-1)

  // Calculate normalized scroll progress (0 = top, 1 = bottom)
  function getSectionProgress() {
    const docH = document.documentElement.scrollHeight - window.innerHeight;
    return Math.max(0, Math.min(1, window.scrollY / docH));
  }

  // Calculate bride section progress (0 = not visible, 1 = fully entered)
  function getBrideSectionProgress() {
    const bride = document.getElementById('intro-bride');
    if (!bride) return 0;
    const r = bride.getBoundingClientRect();
    // Start transition when bride section is 60% from top
    // Complete when bride section reaches 40% from top
    const startTrigger = window.innerHeight * 0.6;
    const endTrigger = window.innerHeight * 0.4;
    if (r.top > startTrigger) return 0;
    if (r.top < endTrigger) return 1;
    return 1 - ((r.top - endTrigger) / (startTrigger - endTrigger));
  }

  // Check if user is viewing gallery sections (where tulip should fade)
  function isInGalleryZone() {
    const gw = document.getElementById('gallery-wedding');
    const gp = document.getElementById('gallery-prewedding');
    if (!gw || !gp) return false;

    const gwR = gw.getBoundingClientRect();
    const gpR = gp.getBoundingClientRect();

    // Gallery zone active when wedding gallery enters until prewedding gallery exits
    return (gwR.top < window.innerHeight * 0.8 && gpR.bottom > window.innerHeight * 0.2);
  }

  // Calculate footer section progress for bloom animation trigger
  function getFooterProgress() {
    const footer = document.getElementById('footer');
    if (!footer) return 0;
    const r = footer.getBoundingClientRect();
    const vis = 1 - Math.max(0, Math.min(1, r.top / window.innerHeight));
    return Math.max(0, Math.min(1, (vis - 0.1) / 0.7));
  }

  // Listen to scroll events and update progress values
  window.addEventListener('scroll', () => {
    scrollProgress = getSectionProgress();  // Update scroll position
    targetBloom = getFooterProgress();      // Update bloom target for footer
    brideSectionProgress = getBrideSectionProgress(); // Update bride section visibility
  }, { passive: true }); // Passive for better scroll performance

  // ─── SMOOTHED VALUES for smooth animations ───
  // These values interpolate gradually towards targets for fluid motion
  let smoothOpacity = 1;      // Current opacity (transitions smoothly)
  let smoothX = -3.8;         // Current X position
  let smoothY = 0.2;          // Current Y position
  let smoothRotZ = 0.5;       // Current Z-axis rotation
  let smoothScale = 0.65;     // Current scale factor

  // Main animation loop - runs every frame
  function animate() {
    requestAnimationFrame(animate); // Request next frame

    // Smoothly interpolate bloom progress (4% per frame = smooth easing)
    bloomProgress += (targetBloom - bloomProgress) * 0.04;

    // Get current state values
    const p = scrollProgress;               // Current scroll progress (0-1)
    const bsp = brideSectionProgress;       // Bride section visibility (0-1)
    const inGallery = isInGalleryZone();   // Are we in gallery section?
    const footerProg = getFooterProgress(); // Footer visibility (0-1)

    /* ═══ OPACITY CONTROL ═══
       Dynamic opacity based on scroll position:
       • Hero (0–0.05):     Fade in from 0 to 1
       • Groom section:     Full visibility (opacity = 1) until bride enters
       • Crossover (bsp 0-1): Dim during left→right transition (0.25)
       • Bride section:     Reduced to background element (0.35)
       • Gallery (0.35–0.75):    Very faded, stays out of way (0.1)
       • Footer (0.75–1.0):      Fade back in for bloom finale (0.15→0.75)
    */
    let targetOpacity;
    if (p < 0.05) {
      // Initial fade-in: gradually appear from transparent to opaque
      targetOpacity = Math.min(1, p / 0.05);
    } else if (bsp === 0 && p <= 0.35) {
      // Hero + Groom sections: fully visible on left side (until bride enters)
      targetOpacity = 1;
    } else if (bsp > 0 && bsp < 1 && p <= 0.35) {
      // Crossover transition: dim heavily during left-to-right sweep
      targetOpacity = 0.25;
    } else if (p <= 0.35) {
      // Bride section: subtle background element, don't distract from content
      targetOpacity = 0.35;
    } else if (inGallery && footerProg < 0.1) {
      // Gallery zones: fade to background, let photos take focus
      targetOpacity = 0.1;
    } else if (footerProg > 0.05) {
      // Footer: fade back in for final bloom display
      targetOpacity = 0.15 + footerProg * 0.6;
    } else {
      // Transition into gallery: gradual fade
      targetOpacity = Math.max(0.1, 1 - (p - 0.35) * 6);
    }
    // Smooth opacity interpolation (6% per frame)
    smoothOpacity += (targetOpacity - smoothOpacity) * 0.06;

    /* ═══ POSITION & TRANSFORM PATH ═══
       Tulip follows a choreographed journey through the page:
       • 0.00–0.10: Hero section — Left of names, tilted left
       • 0.10–: Groom section — Stays left, drifts down gently (until bride enters)
       • Bride entry (brideSectionProgress 0-1): Crossover — Dramatic sweep from left to right
       • After crossover: Bride section — Positioned right, tilted right (mirrors groom)
       • 0.35–0.75: Gallery zones — Parked far right, stays out of way
       • 0.75–1.00: Footer — Right side, blooms open as finale
    */
    let targetX, targetY, targetRotZ, targetScale;

    if (p <= 0.10) {
      // ① HERO: Position left of couple names, elegant left tilt
      targetX = -3.8;      // Far left
      targetY = 0.2;       // Slightly above center
      targetRotZ = 0.5;    // Tilt left (~29 degrees)
      targetScale = 0.65;  // Medium size
    } else if (bsp < 1.0 && p <= 0.35) {
      // ② GROOM SECTION + CROSSOVER: Stay on left during groom, then sweep to right for bride
      if (bsp === 0) {
        // Still in groom section: gentle downward drift on left side
        const t = Math.min(1, (p - 0.10) / 0.10);  // Normalize groom section progress
        const e = t * t * (3 - 2 * t);             // Smooth ease (smoothstep)
        targetX = THREE.MathUtils.lerp(-3.8, -3.5, e);     // Drift slightly right
        targetY = THREE.MathUtils.lerp(0.2, -0.3, e);      // Drift down
        targetRotZ = THREE.MathUtils.lerp(0.5, 0.4, e);    // Reduce tilt slightly
        targetScale = 0.65;                                 // Maintain size
      } else {
        // ③ CROSSOVER: Bride section entering - dramatic left→right sweep
        const e = bsp * bsp * (3 - 2 * bsp);       // Smooth ease based on bride visibility
        targetX = THREE.MathUtils.lerp(-3.5, 5.2, e);      // Sweep across screen
        targetY = THREE.MathUtils.lerp(-0.3, 0.2, e);      // Arc upward
        targetRotZ = THREE.MathUtils.lerp(0.4, -0.5, e);   // Flip tilt: left→right
        targetScale = THREE.MathUtils.lerp(0.65, 0.65, e); // Keep size consistent
      }
    } else if (p <= 0.35) {
      // ④ BRIDE SECTION: Position far right beside Emma's portrait
      const t = (p - 0.25) / 0.10;
      const e = t * t * (3 - 2 * t);
      targetX = THREE.MathUtils.lerp(5.2, 5.5, e);       // Settle far right
      targetY = THREE.MathUtils.lerp(0.2, -0.3, e);      // Drift down (mirrors groom)
      targetRotZ = THREE.MathUtils.lerp(-0.5, -0.4, e);  // Tilt right (mirrors left tilt)
      targetScale = THREE.MathUtils.lerp(0.65, 0.55, e); // Slightly smaller
    } else if (p <= 0.75) {
      // ⑤ GALLERY: Park far right, stay minimal and out of the way
      targetX = 5.5;       // Far right edge
      targetY = -0.8;      // Lower position
      targetRotZ = -0.35;  // Gentle right tilt
      targetScale = 0.5;   // Smaller to not distract from photos
    } else {
      // ⑥ FOOTER: Final bloom - rise up, grow larger, open petals
      const t = (p - 0.75) / 0.25;
      const e = t * t * (3 - 2 * t);
      targetX = THREE.MathUtils.lerp(5.5, 4.2, e);       // Pull in from edge
      targetY = THREE.MathUtils.lerp(-0.8, -0.3, e);     // Rise up
      targetRotZ = THREE.MathUtils.lerp(-0.35, -0.45, e);// Tilt right more
      targetScale = THREE.MathUtils.lerp(0.5, 0.85, e);  // Grow for finale
    }

    // Smooth interpolation for all transform values (5% per frame = gentle easing)
    smoothX += (targetX - smoothX) * 0.05;
    smoothY += (targetY - smoothY) * 0.05;
    smoothRotZ += (targetRotZ - smoothRotZ) * 0.05;
    smoothScale += (targetScale - smoothScale) * 0.05;

    // Apply position transformations to tulip group
    tulipGroup.position.x = smoothX;    // Horizontal movement
    tulipGroup.position.y = smoothY;    // Vertical movement
    tulipGroup.rotation.z = smoothRotZ; // Tilt angle

    // Add subtle idle rotation for organic feel (gentle 3D spin)
    tulipGroup.rotation.y = Math.sin(Date.now() * 0.0004) * 0.15;

    // Apply uniform scale to entire tulip
    tulipGroup.scale.set(smoothScale, smoothScale, smoothScale);

    /* ═══ BLOOM ANIMATION (Footer only) ═══
       Petals gradually open outward in staggered sequence
       Creates cascading bloom effect from first to last petal
    */
    petalPivots.forEach((pp, i) => {
      // Stagger each petal's bloom timing (15% delay between petals)
      const stagger = (i / petalCount) * 0.15;
      // Calculate this petal's individual bloom progress
      const localBloom = Math.max(0, Math.min(1, (bloomProgress - stagger) / (1 - stagger)));

      // Calculate petal opening angle
      let openAngle = -0.15 + localBloom * (-0.85 + (i % 2) * 0.2); // Base bloom
      if (i >= 3) openAngle -= localBloom * 0.25;  // Outer petals open wider

      // Add subtle breathing motion to bloomed petals
      openAngle += Math.sin(Date.now() * 0.001 + i) * 0.02 * localBloom;

      pp.petal.rotation.x = openAngle; // Apply rotation
    });

    // Pistil grows taller as flower blooms
    pistil.scale.y = 1.3 + bloomProgress * 0.3;

    // Apply opacity to all materials in the tulip (petals, stem, leaves, etc.)
    tulipGroup.traverse(child => {
      if (child.material) {
        child.material.transparent = true;         // Enable transparency
        child.material.opacity = smoothOpacity;    // Apply current opacity value
      }
    });

    // Render the 3D scene to canvas
    renderer.render(scene, camera);
  }

  // Start animation loop
  animate();

  // Handle window resize - maintain correct aspect ratio and canvas size
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
})(); // End of tulip 3D initialization

/* ═══════════════════════════════════════════
   GSAP
   ═══════════════════════════════════════════ */
gsap.registerPlugin(ScrollTrigger);
ScrollTrigger.config({
  ignoreMobileResize: true,
  autoRefreshEvents: 'visibilitychange,DOMContentLoaded,load'
});

// Optimize scroll performance with passive listeners
if ('scrollRestoration' in history) {
  history.scrollRestoration = 'manual';
}

// Add smooth scroll behavior optimization
document.documentElement.style.scrollBehavior = 'auto';

// Preload all HO images
function preloadImages() {
  const imageUrls = Array.from(document.querySelectorAll('img[src]'))
    .map(img => img.src)
    .filter(src => src.startsWith('http'));

  let loadedCount = 0;
  const totalImages = imageUrls.length;

  return new Promise((resolve) => {
    if (totalImages === 0) {
      resolve();
      return;
    }

    imageUrls.forEach(url => {
      const img = new Image();
      img.onload = img.onerror = () => {
        loadedCount++;
        if (loadedCount === totalImages) {
          resolve();
        }
      };
      img.src = url;
    });
  });
}

window.addEventListener('load', () => {
  const minDelay = new Promise(resolve => setTimeout(resolve, 2500));

  Promise.all([preloadImages(), minDelay]).then(() => {
    console.log('✅ All images preloaded');
    gsap.to('#loader', {
      duration: 0.8, opacity: 0,
      onComplete: () => {
        document.getElementById('loader').classList.add('hidden');
        initHeroAnimations();
        ScrollTrigger.refresh();
      }
    });
  });
});

function initHeroAnimations() {
  const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
  tl
    .to('.hero-portrait', { opacity: 1, duration: 1.2, scale: 1, ease: 'power2.out' })
    .to('.hero-date', { opacity: 1, duration: 0.8 }, '-=0.6')
    .to('.hero-name', { opacity: 1, y: 0, duration: 1, stagger: 0.25 }, '-=0.4')
    .to('.hero-ampersand', { opacity: 1, duration: 0.6 }, '-=0.8')
    .to('.hero-jp', { opacity: 1, duration: 0.8 }, '-=0.3')
    .to('.hero-scroll-hint', { opacity: 1, duration: 0.6 }, '-=0.2');

  // ── Hands + Red String animation ──
  gsap.to('.hero-hands', { opacity: 1, duration: 1, delay: 3.5, ease: 'power2.out' });
  // Stagger hand reveal then string
  setTimeout(() => {
    document.querySelectorAll('.hand-path').forEach(p => p.classList.add('animate'));
    setTimeout(() => {
      const rs = document.querySelector('.red-string-path');
      if (rs) rs.classList.add('animate');
    }, 800);
  }, 3500);

  // Parallax
  gsap.to('.hero-portrait', {
    y: -80, scale: 0.95,
    scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom top', scrub: 1.5 }
  });
  gsap.to('.hero-content', {
    y: -120, opacity: 0,
    scrollTrigger: { trigger: '#hero', start: '30% top', end: 'bottom top', scrub: 1 }
  });
  gsap.to('.hero-hands', {
    y: -60, opacity: 0,
    scrollTrigger: { trigger: '#hero', start: '20% top', end: '70% top', scrub: 1 }
  });
  gsap.utils.toArray('.floating-kanji').forEach((k, i) => {
    gsap.to(k, {
      y: -100 * (i % 2 === 0 ? 1 : -1),
      scrollTrigger: { trigger: k.closest('section'), start: 'top bottom', end: 'bottom top', scrub: 2 }
    });
  });
}

/* INTRO ANIMATIONS */
function initIntro(sid, pid, bid, tid) {
  gsap.to(`#${pid}`, {
    opacity: 1, scale: 1, duration: 1.2, ease: 'power2.out',
    scrollTrigger: { trigger: `#${sid}`, start: 'top 70%', toggleActions: 'play none none reverse' }
  });
  gsap.to(`#${sid} .intro-portrait-accent`, {
    opacity: 1, scale: 1.1, duration: 1, delay: 0.3,
    scrollTrigger: { trigger: `#${sid}`, start: 'top 60%', toggleActions: 'play none none reverse' }
  });

  // Portrait icons — burst out FROM center of circle TO final positions
  // Each icon starts stacked at the portrait center, then flies outward
  const portrait = document.getElementById(pid);
  if (portrait) {
    const icons = portrait.querySelectorAll('.portrait-icon');
    const portraitRect = { w: 320, h: 320 }; // portrait dimensions
    const cx = portraitRect.w / 2;
    const cy = portraitRect.h / 2;

    icons.forEach((icon, i) => {
      // Read where CSS wants this icon to end up
      const style = getComputedStyle(icon);
      const finalTop = style.top !== 'auto' ? parseFloat(style.top) : null;
      const finalBottom = style.bottom !== 'auto' ? parseFloat(style.bottom) : null;
      const finalLeft = style.left !== 'auto' ? parseFloat(style.left) : null;
      const finalRight = style.right !== 'auto' ? parseFloat(style.right) : null;
      const iconW = parseFloat(style.width);
      const iconH = parseFloat(style.height);

      // Calculate final position as top/left
      let endX = finalLeft !== null ? finalLeft : (portraitRect.w - (finalRight + iconW));
      let endY = finalTop !== null ? finalTop : (portraitRect.h - (finalBottom + iconH));

      // Start position: center of portrait
      const startX = cx - iconW / 2;
      const startY = cy - iconH / 2;

      // Set initial position at center, scaled down, hidden
      gsap.set(icon, {
        top: startY,
        left: startX,
        right: 'auto',
        bottom: 'auto',
        scale: 0,
        opacity: 0
      });

      // Animate: burst from center to final position
      gsap.to(icon, {
        top: endY,
        left: endX,
        scale: 1,
        opacity: 0.6,
        duration: 0.9,
        delay: 0.5 + i * 0.12,
        ease: 'back.out(2.5)',
        scrollTrigger: {
          trigger: `#${sid}`,
          start: 'top 60%',
          toggleActions: 'play none none reverse'
        }
      });
    });
  }

  gsap.to([`#${sid} .intro-label`, `#${sid} .intro-name`, `#${sid} .intro-name-jp`, `#${sid} .accent-line`, `#${bid}`, `#${tid}`], {
    opacity: 1, y: 0, duration: 0.8, stagger: 0.15, ease: 'power2.out',
    scrollTrigger: { trigger: `#${sid}`, start: 'top 55%', toggleActions: 'play none none reverse' }
  });
  gsap.from(`#${tid} .timeline-item`, {
    x: -20, opacity: 0, duration: 0.6, stagger: 0.2,
    scrollTrigger: { trigger: `#${tid}`, start: 'top 80%', toggleActions: 'play none none reverse' }
  });
}
initIntro('intro-groom', 'groom-portrait', 'groom-bio', 'groom-timeline');
initIntro('intro-bride', 'bride-portrait', 'bride-bio', 'bride-timeline');

/* HORIZONTAL GALLERY */
function initHGallery() {
  const gallery = document.getElementById('hGallery');
  const wrapper = document.querySelector('.horizontal-gallery-wrapper');
  if (!gallery || !wrapper) return;
  ['gallery-label', 'gallery-heading', 'gallery-heading-jp'].forEach((c, i) => {
    gsap.to(`#gallery-wedding .${c}`, {
      opacity: 1, y: 0, duration: 0.8, delay: i * 0.1,
      scrollTrigger: { trigger: '#gallery-wedding .gallery-title-section', start: 'top 70%', toggleActions: 'play none none reverse' }
    });
  });
  const getScroll = () => gallery.scrollWidth - wrapper.offsetWidth;
  gsap.to(gallery, {
    x: () => -getScroll(), ease: 'none',
    scrollTrigger: { trigger: wrapper, start: 'top top', end: () => `+=${getScroll()}`, pin: true, scrub: 1, invalidateOnRefresh: true, anticipatePin: 1, fastScrollEnd: true }
  });
}
function initMobileGallery() {
  const gallery = document.getElementById('hGallery');
  const wrapper = document.querySelector('.horizontal-gallery-wrapper');
  if (!gallery || !wrapper) return;

  ['gallery-label', 'gallery-heading', 'gallery-heading-jp'].forEach((c, i) => {
    gsap.to(`#gallery-wedding .${c}`, {
      opacity: 1, y: 0, duration: 0.8, delay: i * 0.1,
      scrollTrigger: { trigger: '#gallery-wedding .gallery-title-section', start: 'top 70%', toggleActions: 'play none none reverse' }
    });
  });

  const items = gallery.querySelectorAll('.h-gallery-item');
  const prevBtn = document.getElementById('galleryPrev');
  const nextBtn = document.getElementById('galleryNext');
  const counter = document.getElementById('galleryCounter');
  const total = items.length;
  let current = 0;

  function goTo(index) {
    current = Math.max(0, Math.min(total - 1, index));
    gallery.style.transform = `translateX(calc(-${current} * 100vw))`;
    if (counter) counter.textContent = `${current + 1} / ${total}`;
    if (prevBtn) prevBtn.disabled = current === 0;
    if (nextBtn) nextBtn.disabled = current === total - 1;
  }

  if (prevBtn) prevBtn.addEventListener('click', () => goTo(current - 1));
  if (nextBtn) nextBtn.addEventListener('click', () => goTo(current + 1));

  goTo(0);
}

ScrollTrigger.matchMedia({
  '(min-width: 640px)': () => initHGallery(),
  '(max-width: 639px)': () => initMobileGallery()
});

/* MASONRY */
(function () {
  ['gallery-label', 'gallery-heading', 'gallery-heading-jp'].forEach((c, i) => {
    gsap.to(`#gallery-prewedding .${c}`, {
      opacity: 1, duration: 0.8, delay: i * 0.1,
      scrollTrigger: { trigger: '#gallery-prewedding .gallery-title-section', start: 'top 75%', toggleActions: 'play none none reverse' }
    });
  });
  gsap.utils.toArray('.masonry-item').forEach((item, i) => {
    gsap.to(item, {
      opacity: 1, y: 0, duration: 0.8, delay: (i % 3) * 0.1, ease: 'power2.out',
      scrollTrigger: { trigger: item, start: 'top 90%', toggleActions: 'play none none reverse' }
    });
  });
})();

/* LIGHTBOX */
const lightbox = document.getElementById('lightbox');
const lightboxImage = document.getElementById('lightboxImage');
const lightboxContent = document.getElementById('lightboxContent');

function openLightbox(imageSrc) {
  lightboxImage.src = imageSrc;
  lightbox.classList.add('active');
  document.body.style.overflow = 'hidden'; // Prevent scrolling
}

function closeLightbox() {
  lightbox.classList.remove('active');
  document.body.style.overflow = ''; // Restore scrolling
  setTimeout(() => {
    lightboxImage.src = ''; // Clear image after animation
  }, 500);
}

// Add click handlers to all gallery images
// Masonry gallery
document.querySelectorAll('.masonry-item img').forEach(img => {
  img.parentElement.parentElement.style.cursor = 'pointer';
  img.parentElement.parentElement.addEventListener('click', () => {
    openLightbox(img.src);
  });
});

// Horizontal gallery
document.querySelectorAll('.h-gallery-item img').forEach(img => {
  img.parentElement.parentElement.parentElement.style.cursor = 'pointer';
  img.parentElement.parentElement.parentElement.addEventListener('click', () => {
    openLightbox(img.src);
  });
});

// Close lightbox handlers
document.getElementById('lightboxClose').addEventListener('click', e => {
  e.stopPropagation();
  closeLightbox();
});

// Click outside image to close
lightbox.addEventListener('click', (e) => {
  if (e.target === lightbox) {
    closeLightbox();
  }
});

// ESC key to close
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && lightbox.classList.contains('active')) {
    closeLightbox();
  }
});

/* FOOTER ANIMATIONS + CONFETTI */
gsap.to(['.footer-label', '.footer-date', '.footer-date-jp', '#footer .accent-line', '.footer-location', '.footer-address', '.footer-message', '.footer-hearts', '.footer-bottom'], {
  opacity: 1, y: 0, duration: 0.8, stagger: 0.12, ease: 'power2.out',
  scrollTrigger: { trigger: '#footer', start: 'top 60%', toggleActions: 'play none none reverse', onEnter: startConfetti }
});

function startConfetti() {
  const cv = document.getElementById('confettiCanvas');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  cv.width = window.innerWidth; cv.height = window.innerHeight;
  const particles = [];
  const colors = [
    { fill: '#c8553a', type: 'petal' }, { fill: '#d4634a', type: 'petal' },
    { fill: '#e07455', type: 'petal' }, { fill: '#ba4a33', type: 'petal' },
    { fill: '#6b8a55', type: 'leaf' }, { fill: '#5a7247', type: 'leaf' },
    { fill: '#fafafa', type: 'dot' }
  ];
  for (let i = 0; i < 50; i++) {
    const c = colors[Math.floor(Math.random() * colors.length)];
    particles.push({
      x: Math.random() * cv.width, y: -20 - Math.random() * cv.height * 0.5,
      rot: Math.random() * Math.PI * 2, rs: (Math.random() - 0.5) * 0.06,
      sx: (Math.random() - 0.5) * 1.2, sy: 0.8 + Math.random() * 2,
      sz: 6 + Math.random() * 12, color: c.fill, type: c.type,
      op: 0.5 + Math.random() * 0.4, wb: Math.random() * Math.PI * 2
    });
  }
  let frame = 0;
  function anim() {
    if (frame > 360) { ctx.clearRect(0, 0, cv.width, cv.height); return; }
    frame++; ctx.clearRect(0, 0, cv.width, cv.height);
    const gf = frame > 300 ? (360 - frame) / 60 : 1;
    particles.forEach(p => {
      p.x += p.sx + Math.sin(p.wb + frame * 0.015) * 0.4;
      p.y += p.sy; p.rot += p.rs; p.wb += 0.01;
      const a = p.op * gf;
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.globalAlpha = a; ctx.fillStyle = p.color;
      if (p.type === 'petal') {
        ctx.beginPath(); ctx.moveTo(0, -p.sz * 0.6);
        ctx.bezierCurveTo(p.sz * 0.4, -p.sz * 0.3, p.sz * 0.4, p.sz * 0.3, 0, p.sz * 0.6);
        ctx.bezierCurveTo(-p.sz * 0.4, p.sz * 0.3, -p.sz * 0.4, -p.sz * 0.3, 0, -p.sz * 0.6);
        ctx.fill();
      } else if (p.type === 'leaf') {
        ctx.beginPath(); ctx.moveTo(0, -p.sz * 0.5);
        ctx.quadraticCurveTo(p.sz * 0.25, 0, 0, p.sz * 0.5);
        ctx.quadraticCurveTo(-p.sz * 0.25, 0, 0, -p.sz * 0.5);
        ctx.fill();
      } else {
        ctx.globalAlpha = a * 0.7; ctx.beginPath(); ctx.arc(0, 0, p.sz * 0.2, 0, Math.PI * 2); ctx.fill();
      }
      ctx.restore();
      if (p.y > cv.height + 20) { p.y = -20; p.x = Math.random() * cv.width; }
    });
    requestAnimationFrame(anim);
  }
  anim();
}

/* NAV DOTS */
const navDots = document.querySelectorAll('.nav-dot');
['hero', 'intro-groom', 'intro-bride', 'gallery-wedding', 'gallery-prewedding', 'footer'].forEach((s, i) => {
  ScrollTrigger.create({
    trigger: `#${s}`, start: 'top center', end: 'bottom center',
    onEnter: () => navDots.forEach((d, j) => d.classList.toggle('active', j === i)),
    onEnterBack: () => navDots.forEach((d, j) => d.classList.toggle('active', j === i))
  });
});
navDots.forEach(d => {
  d.addEventListener('click', () => {
    const t = document.getElementById(d.dataset.target);
    if (t) gsap.to(window, { duration: 1.2, scrollTo: { y: t }, ease: 'power3.inOut' });
  });
});

/* ═══════════════════════════════════════════
   HANDWRITING — Scroll-triggered letter animation
   Each letter uses a random handwriting font,
   revealed one by one as user scrolls into view
   ═══════════════════════════════════════════ */
(function initHandwriting() {
  const seed = 42;
  const text = 'From the moment our eyes first met, I knew something beautiful had begun. Every laugh we share, every quiet evening together, every adventure we take — they all weave into the story of us. I promise to love you through every season, to hold your hand through every storm, and to celebrate every sunrise by your side. This is our forever.';

  const fonts = [
    'caveat', 'cedarville-cursive', 'indie-flower',
    'nothing-you-could-do', 'oooh-baby', 'reenie-beanie', 'shadows-into-light'
  ];
  const blacklist = {
    l: ['cedarville-cursive', 'oooh-baby', 'nothing-you-could-do']
  };

  function seededRandom(s) {
    let x = Math.sin(s++) * 10000;
    return x - Math.floor(x);
  }

  const element = document.getElementById('handwritingText');
  if (!element) return;

  // Build spans for each letter with random handwriting fonts
  element.innerHTML = '';
  const lastUsed = {};
  let currentSeed = seed;
  const spans = [];

  for (const char of text) {
    if (char === ' ') {
      const sp = document.createElement('span');
      sp.className = 'hw-space';
      sp.innerHTML = '&nbsp;';
      element.appendChild(sp);
      spans.push(sp);
      currentSeed++;
      continue;
    }

    const lowerChar = char.toLowerCase();
    let availableFonts = [...fonts];

    if (blacklist[lowerChar]) {
      availableFonts = availableFonts.filter(f => !blacklist[lowerChar].includes(f));
    }
    if (lastUsed[lowerChar]) {
      availableFonts = availableFonts.filter(f => f !== lastUsed[lowerChar]);
    }
    if (availableFonts.length === 0) availableFonts = fonts;

    const fontIndex = Math.floor(seededRandom(currentSeed) * availableFonts.length);
    const font = availableFonts[fontIndex] || fonts[0];
    lastUsed[lowerChar] = font;

    const span = document.createElement('span');
    span.className = font;
    span.textContent = char;
    element.appendChild(span);
    spans.push(span);
    currentSeed++;
  }

  // Create cursor element (initially hidden)
  const cursor = document.createElement('span');
  cursor.className = 'hw-cursor';
  cursor.id = 'hwCursor';
  cursor.style.opacity = '0';

  // Scroll-triggered writing animation
  let revealed = 0;
  const totalChars = spans.length;
  let hasStarted = false;

  function startWriting() {
    if (hasStarted) return;
    hasStarted = true;
    revealed = 0;

    spans.forEach(s => s.classList.remove('hw-visible'));

    // Insert cursor at the beginning
    if (element.firstChild) {
      element.insertBefore(cursor, element.firstChild);
    } else {
      element.appendChild(cursor);
    }
    cursor.style.opacity = '1';

    let lastTime = 0;
    const interval = 20;

    function writeNext(timestamp) {
      if (revealed >= totalChars) {
        setTimeout(() => { cursor.style.opacity = '0'; }, 1200);
        return;
      }

      if (!lastTime) lastTime = timestamp;

      if (timestamp - lastTime >= interval) {
        if (revealed < totalChars) {
          // Reveal current character
          spans[revealed].classList.add('hw-visible');

          // Move cursor to after the revealed character
          const currentSpan = spans[revealed];
          if (currentSpan.nextSibling) {
            element.insertBefore(cursor, currentSpan.nextSibling);
          } else {
            element.appendChild(cursor);
          }

          revealed++;
        }
        lastTime = timestamp;
      }

      requestAnimationFrame(writeNext);
    }

    requestAnimationFrame(writeNext);
  }

  // Only trigger when user scrolls to this section
  ScrollTrigger.create({
    trigger: '#handwriting-section',
    start: 'top 80%',  // Start when section is 80% down the viewport
    onEnter: () => { if (!hasStarted) startWriting(); },
    onEnterBack: () => { if (!hasStarted) startWriting(); }
  });
})();

// 相簿
(function initPhotoPortal() {
  const trigger = document.getElementById('photo-portal-trigger');
  const overlay = document.getElementById('photo-portal-overlay');
  const closeBtn = document.getElementById('portalClose');

  if (!trigger || !overlay || !closeBtn) return;

  trigger.addEventListener('click', () => {
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden'; // 禁止底層滾動
  });

  closeBtn.addEventListener('click', () => {
    overlay.classList.remove('active');
    document.body.style.overflow = ''; // 恢復滾動
  });

  // 點擊空白處也可以關閉
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      overlay.classList.remove('active');
      document.body.style.overflow = '';
    }
  });
})();

/* DIVIDERS */
gsap.utils.toArray('.section-divider').forEach(d => {
  gsap.fromTo(d, { scaleX: 0 }, { scaleX: 1, duration: 1.2, ease: 'power2.out', scrollTrigger: { trigger: d, start: 'top 85%', toggleActions: 'play none none reverse' } });
});
gsap.utils.toArray('.accent-line').forEach(l => {
  gsap.fromTo(l, { scaleX: 0 }, { scaleX: 1, duration: 0.8, ease: 'power2.out', scrollTrigger: { trigger: l, start: 'top 85%', toggleActions: 'play none none reverse' } });
});

/* RESIZE */
let rt;
window.addEventListener('resize', () => {
  clearTimeout(rt);
  rt = setTimeout(() => {
    ScrollTrigger.refresh();
    const cc = document.getElementById('confettiCanvas');
    if (cc) { cc.width = window.innerWidth; cc.height = window.innerHeight; }
  }, 250);
});
