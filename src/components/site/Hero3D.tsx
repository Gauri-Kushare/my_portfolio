import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

export function Hero3D() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [webglSupported, setWebglSupported] = useState(true);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Check WebGL availability
    try {
      const testCanvas = document.createElement("canvas");
      const gl = testCanvas.getContext("webgl") || testCanvas.getContext("experimental-webgl");
      if (!gl) {
        setWebglSupported(false);
        return;
      }
    } catch {
      setWebglSupported(false);
      return;
    }

    let isVisible = true;
    let animationFrameId: number;

    // Scene, Camera, Renderer
    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      100,
    );
    camera.position.z = 6.2;

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    container.appendChild(renderer.domElement);

    // 1. Centerpiece Sculpture: Chrome & Glass Complex Geometry
    const coreGroup = new THREE.Group();
    scene.add(coreGroup);

    // Inner faceted jewel: Icosahedron
    const coreGeo = new THREE.IcosahedronGeometry(1.4, 0);
    const coreMat = new THREE.MeshPhysicalMaterial({
      color: 0x181030,
      emissive: 0x221344,
      emissiveIntensity: 0.35,
      metalness: 0.88,
      roughness: 0.16,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1,
      reflectivity: 0.95,
      flatShading: true,
    });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    coreGroup.add(coreMesh);

    // Outer wireframe crystalline aura
    const wireGeo = new THREE.IcosahedronGeometry(1.68, 1);
    const wireMat = new THREE.MeshBasicMaterial({
      color: 0x8b5cf6,
      wireframe: true,
      transparent: true,
      opacity: 0.28,
    });
    const wireMesh = new THREE.Mesh(wireGeo, wireMat);
    coreGroup.add(wireMesh);

    // Orbital kinetic chrome rings (Gyroscopic aesthetic)
    const ringGeo1 = new THREE.TorusGeometry(2.1, 0.024, 16, 100);
    const ringMat1 = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      metalness: 0.95,
      roughness: 0.15,
      emissive: 0x38bdf8,
      emissiveIntensity: 0.2,
    });
    const ring1 = new THREE.Mesh(ringGeo1, ringMat1);
    ring1.rotation.x = Math.PI / 3;
    ring1.rotation.y = Math.PI / 6;
    coreGroup.add(ring1);

    const ringGeo2 = new THREE.TorusGeometry(2.35, 0.018, 16, 100);
    const ringMat2 = new THREE.MeshStandardMaterial({
      color: 0xa855f7,
      metalness: 0.9,
      roughness: 0.2,
      emissive: 0x9333ea,
      emissiveIntensity: 0.3,
    });
    const ring2 = new THREE.Mesh(ringGeo2, ringMat2);
    ring2.rotation.x = -Math.PI / 4;
    ring2.rotation.y = Math.PI / 3;
    coreGroup.add(ring2);

    // 2. Luminous Stardust Floating Particles
    const particlesCount = 180;
    const positions = new Float32Array(particlesCount * 3);
    const colors = new Float32Array(particlesCount * 3);

    const colorViolet = new THREE.Color(0xa855f7);
    const colorCyan = new THREE.Color(0x38bdf8);
    const colorWhite = new THREE.Color(0xffffff);

    for (let i = 0; i < particlesCount; i++) {
      const radius = 2.4 + Math.random() * 3.2;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);

      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = radius * Math.cos(phi);

      const mixChoice = Math.random();
      const pColor = mixChoice < 0.45 ? colorViolet : mixChoice < 0.8 ? colorCyan : colorWhite;
      colors[i * 3] = pColor.r;
      colors[i * 3 + 1] = pColor.g;
      colors[i * 3 + 2] = pColor.b;
    }

    const particlesGeo = new THREE.BufferGeometry();
    particlesGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    particlesGeo.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    const particlesMat = new THREE.PointsMaterial({
      size: 0.045,
      vertexColors: true,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending,
    });
    const particleSystem = new THREE.Points(particlesGeo, particlesMat);
    scene.add(particleSystem);

    // 3. Cinematic Atmospheric Lighting
    const ambientLight = new THREE.AmbientLight(0x0f1026, 2.4);
    scene.add(ambientLight);

    // Electric violet key point light
    const violetLight = new THREE.PointLight(0xa855f7, 45, 12);
    violetLight.position.set(3, 2.5, 3);
    scene.add(violetLight);

    // Electric blue rim point light
    const cyanLight = new THREE.PointLight(0x38bdf8, 35, 12);
    cyanLight.position.set(-3.5, -2, 2.5);
    scene.add(cyanLight);

    // Silver top-down key light
    const topKeyLight = new THREE.DirectionalLight(0xffffff, 2.2);
    topKeyLight.position.set(2, 6, 4);
    scene.add(topKeyLight);

    // Pointer-reactive smoothing
    let targetRotationX = 0;
    let targetRotationY = 0;
    let currentRotationX = 0;
    let currentRotationY = 0;

    let targetLightX = 3;
    let targetLightY = 2.5;

    const onPointerMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);

      targetRotationY = x * 0.75;
      targetRotationX = -y * 0.55;

      targetLightX = 3 + x * 2.5;
      targetLightY = 2.5 + y * 2.5;
    };

    window.addEventListener("mousemove", onPointerMove, { passive: true });

    // Touch support for drag-tilting
    let touchStartX = 0;
    let touchStartY = 0;
    const onTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      if (touch) {
        touchStartX = touch.clientX;
        touchStartY = touch.clientY;
      }
    };
    const onTouchMove = (e: TouchEvent) => {
      const touch = e.touches[0];
      if (touch) {
        const dx = (touch.clientX - touchStartX) / window.innerWidth;
        const dy = (touch.clientY - touchStartY) / window.innerHeight;
        targetRotationY += dx * 0.05;
        targetRotationX += dy * 0.05;
      }
    };
    container.addEventListener("touchstart", onTouchStart, { passive: true });
    container.addEventListener("touchmove", onTouchMove, { passive: true });

    // Resize Observer
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", handleResize);

    // Intersection Observer to stop render loop when hero is scrolled past
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry) {
          isVisible = entry.isIntersecting;
        }
      },
      { threshold: 0.05 },
    );
    io.observe(container);

    // Motion preference check
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const speedMultiplier = prefersReducedMotion ? 0.2 : 1.0;

    // Animation Loop using standard timestamp (zero deprecation warnings)
    const startTime = performance.now();

    const animate = (time: number) => {
      animationFrameId = requestAnimationFrame(animate);
      if (!isVisible) return;

      const elapsed = (time - startTime) * 0.001 * speedMultiplier;

      // Base kinetic spinning
      coreGroup.rotation.y += 0.005 * speedMultiplier;
      wireMesh.rotation.y -= 0.003 * speedMultiplier;
      ring1.rotation.z += 0.008 * speedMultiplier;
      ring2.rotation.z -= 0.006 * speedMultiplier;
      particleSystem.rotation.y = elapsed * 0.03;

      // Smooth pointer lerp
      currentRotationX += (targetRotationX - currentRotationX) * 0.05;
      currentRotationY += (targetRotationY - currentRotationY) * 0.05;

      coreGroup.rotation.x = currentRotationX + Math.sin(elapsed * 0.6) * 0.08;
      coreGroup.rotation.z = currentRotationY * 0.5 + Math.cos(elapsed * 0.5) * 0.05;

      // Dynamic light movement
      violetLight.position.x += (targetLightX - violetLight.position.x) * 0.05;
      violetLight.position.y += (targetLightY - violetLight.position.y) * 0.05;

      // Camera gentle breathing
      camera.position.x = currentRotationY * 0.4;
      camera.position.y = currentRotationX * 0.3;
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
    };

    animate(performance.now());

    return () => {
      cancelAnimationFrame(animationFrameId);
      io.disconnect();
      window.removeEventListener("mousemove", onPointerMove);
      window.removeEventListener("resize", handleResize);
      container.removeEventListener("touchstart", onTouchStart);
      container.removeEventListener("touchmove", onTouchMove);

      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }

      coreGeo.dispose();
      coreMat.dispose();
      wireGeo.dispose();
      wireMat.dispose();
      ringGeo1.dispose();
      ringMat1.dispose();
      ringGeo2.dispose();
      ringMat2.dispose();
      particlesGeo.dispose();
      particlesMat.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative flex h-[380px] w-full items-center justify-center sm:h-[460px] md:h-[560px] lg:h-[620px]"
      aria-label="Interactive 3D Dimensional Centerpiece"
    >
      {/* Background radial glow */}
      <div className="pointer-events-none absolute h-[280px] w-[280px] rounded-full bg-violet-600/20 blur-[90px] md:h-[420px] md:w-[420px]" />
      <div className="pointer-events-none absolute -bottom-6 h-[180px] w-[180px] rounded-full bg-sky-500/15 blur-[80px]" />

      {!webglSupported && (
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <div className="animate-float relative flex h-48 w-48 items-center justify-center rounded-full border border-violet-500/30 bg-gradient-to-tr from-violet-950/60 via-slate-900/40 to-sky-950/60 shadow-[0_0_80px_rgba(139,92,246,0.3)] backdrop-blur-xl">
            <div className="h-32 w-32 rounded-full border border-sky-400/30 bg-gradient-to-br from-violet-500/20 to-transparent blur-sm" />
            <span className="font-display absolute text-2xl font-bold tracking-widest text-white/90">
              GK
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
