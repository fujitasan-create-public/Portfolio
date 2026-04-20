import { useEffect, useMemo, useRef, useState } from "react";
import { Aurora, particles as Particles } from "@appletosolutions/reactbits";
import * as THREE from "three";

type IntroSplashProps = {
  title?: string;
  durationMs?: number;
};

const DEFAULT_TITLE = "Fujita-create Portfolio";
const SECTION_KEYS = ["home", "skills", "works", "news", "contacts"] as const;
type SectionKey = (typeof SECTION_KEYS)[number];
type Language = "ja" | "en";
const SECTION_LABELS: Record<SectionKey, string> = {
  home: "Home",
  skills: "Skills",
  works: "Works",
  news: "News",
  contacts: "Contacts"
};

export default function IntroSplash({
  title = DEFAULT_TITLE,
  durationMs = 2600
}: IntroSplashProps) {
  const [completed, setCompleted] = useState(false);
  const [showUi, setShowUi] = useState(false);
  const [hasOpenedGlass, setHasOpenedGlass] = useState(false);
  const [language, setLanguage] = useState<Language>("ja");
  const [activeSection, setActiveSection] = useState<SectionKey>("home");
  const earthHostRef = useRef<HTMLDivElement | null>(null);
  const earthCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const displayTitle = useMemo(() => title, [title]);
  const letters = useMemo(() => displayTitle.split(""), [displayTitle]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setCompleted(true);
    }, durationMs);

    return () => window.clearTimeout(timer);
  }, [durationMs]);

  useEffect(() => {
    if (!completed) {
      setShowUi(false);
      return;
    }

    const timer = window.setTimeout(() => {
      setShowUi(true);
    }, 720);

    return () => window.clearTimeout(timer);
  }, [completed]);

  useEffect(() => {
    const host = earthHostRef.current;
    const canvas = earthCanvasRef.current;
    if (!host || !canvas) {
      return;
    }

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(46, 1, 0.1, 1000);
    camera.position.set(2.8, 9.4, 17.8);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true
    });
    renderer.setClearColor(0x000000, 0);
    const nav = navigator as Navigator & { deviceMemory?: number };
    const lowPowerDevice =
      (typeof nav.hardwareConcurrency === "number" && nav.hardwareConcurrency <= 6) ||
      (typeof nav.deviceMemory === "number" && nav.deviceMemory <= 6);
    const qualityScale = lowPowerDevice ? 0.72 : 1;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, lowPowerDevice ? 1.25 : 1.6));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.28;

    const loader = new THREE.TextureLoader();
    const disposables: Array<THREE.BufferGeometry | THREE.Material | THREE.Texture> = [];
    const orbitPivots: THREE.Object3D[] = [];
    const orbitSpeeds: number[] = [];
    const spinMeshes: Array<{ mesh: THREE.Mesh; speed: number }> = [];
    const driftingGroups: Array<{ obj: THREE.Object3D; speed: number }> = [];

    const root = new THREE.Group();
    root.rotation.x = -0.2;
    root.rotation.z = -0.22;
    root.rotation.y = 0.12;
    scene.add(root);

    const makeTexture = (path: string) => {
      const texture = loader.load(path);
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.ClampToEdgeWrapping;
      disposables.push(texture);
      return texture;
    };

    const makeGlowTexture = () => {
      const size = 256;
      const c = document.createElement("canvas");
      c.width = size;
      c.height = size;
      const ctx = c.getContext("2d");
      if (!ctx) {
        return null;
      }
      const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
      g.addColorStop(0, "rgba(255,255,255,0.95)");
      g.addColorStop(0.25, "rgba(255,220,160,0.7)");
      g.addColorStop(0.6, "rgba(120,170,255,0.22)");
      g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, size, size);
      const tex = new THREE.CanvasTexture(c);
      tex.colorSpace = THREE.SRGBColorSpace;
      disposables.push(tex);
      return tex;
    };

    const glowTexture = makeGlowTexture();
    const starTexture = makeGlowTexture();

    const addGlow = (parent: THREE.Object3D, size: number, color: string, opacity: number) => {
      if (!glowTexture) {
        return;
      }
      const mat = new THREE.SpriteMaterial({
        map: glowTexture,
        color: new THREE.Color(color),
        transparent: true,
        opacity,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });
      const sprite = new THREE.Sprite(mat);
      sprite.scale.set(size, size, 1);
      parent.add(sprite);
      disposables.push(mat);
    };

    const makeCloudTexture = () => {
      const c = document.createElement("canvas");
      c.width = 1024;
      c.height = 1024;
      const ctx = c.getContext("2d");
      if (!ctx) {
        return null;
      }
      ctx.clearRect(0, 0, c.width, c.height);

      for (let i = 0; i < 180; i += 1) {
        const x = Math.random() * c.width;
        const y = Math.random() * c.height;
        const r = 30 + Math.random() * 170;
        const g = ctx.createRadialGradient(x, y, 0, x, y, r);
        const alpha = 0.02 + Math.random() * 0.06;
        g.addColorStop(0, `rgba(255,255,255,${alpha})`);
        g.addColorStop(0.45, `rgba(255,220,170,${alpha * 0.55})`);
        g.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = g;
        ctx.fillRect(x - r, y - r, r * 2, r * 2);
      }

      const tex = new THREE.CanvasTexture(c);
      tex.colorSpace = THREE.SRGBColorSpace;
      disposables.push(tex);
      return tex;
    };

    const addMilkyWayHaze = () => {
      const cloudTexture = makeCloudTexture();
      if (!cloudTexture) {
        return;
      }

      const hazeGroup = new THREE.Group();
      hazeGroup.position.set(0, -2.4, -26);
      hazeGroup.rotation.x = -0.78;
      hazeGroup.rotation.z = -0.18;
      scene.add(hazeGroup);
      driftingGroups.push({ obj: hazeGroup, speed: 0.00022 });

      const palette = ["#f5d8b5", "#d5c2ff", "#c8dbff", "#e6d0b6", "#b5c8ff"];
      for (let i = 0; i < 22; i += 1) {
        const mat = new THREE.SpriteMaterial({
          map: cloudTexture,
          color: new THREE.Color(palette[i % palette.length]),
          transparent: true,
          opacity: 0.08 + Math.random() * 0.08,
          depthWrite: false,
          blending: THREE.AdditiveBlending
        });
        const sprite = new THREE.Sprite(mat);
        sprite.position.set((Math.random() - 0.5) * 90, (Math.random() - 0.5) * 9, (Math.random() - 0.5) * 15);
        const s = 18 + Math.random() * 26;
        sprite.scale.set(s, s * (0.7 + Math.random() * 0.5), 1);
        hazeGroup.add(sprite);
        disposables.push(mat);
      }
    };

    const addStarFields = () => {
      const makeField = (
        count: number,
        spread: number,
        color: string,
        size: number,
        opacity: number,
        rotation: THREE.Euler
      ) => {
        const positions = new Float32Array(count * 3);
        for (let i = 0; i < count; i += 1) {
          const r = spread * (0.35 + Math.random() * 0.65);
          const theta = Math.random() * Math.PI * 2;
          const phi = Math.acos(2 * Math.random() - 1);
          positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
          positions[i * 3 + 1] = r * Math.cos(phi);
          positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
        }

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
        const material = new THREE.PointsMaterial({
          color,
          size,
          transparent: true,
          opacity,
          map: starTexture ?? undefined,
          alphaTest: 0.02,
          blending: THREE.AdditiveBlending,
          depthWrite: false
        });
        const points = new THREE.Points(geometry, material);
        points.rotation.copy(rotation);
        scene.add(points);
        driftingGroups.push({ obj: points, speed: 0.00012 + Math.random() * 0.00014 });
        disposables.push(geometry, material);
      };

      makeField(Math.floor(12000 * qualityScale), 260, "#b7d9ff", 0.11, 0.86, new THREE.Euler(0, 0, 0));
      makeField(Math.floor(9000 * qualityScale), 210, "#f1f2ff", 0.09, 0.66, new THREE.Euler(0.16, 0.08, 0));
      makeField(Math.floor(4200 * qualityScale), 156, "#8ea8ff", 0.13, 0.52, new THREE.Euler(-0.2, 0.14, 0.1));
      makeField(Math.floor(7000 * qualityScale), 280, "#ffffff", 0.06, 0.38, new THREE.Euler(-0.04, -0.05, 0.02));
    };

    const addGalaxyBand = () => {
      const arms = 4;
      const pointsCount = Math.floor(26000 * qualityScale);
      const galaxyRadius = 48;
      const spin = 2.7;
      const randomness = 2.8;

      const positions = new Float32Array(pointsCount * 3);
      const colors = new Float32Array(pointsCount * 3);
      const inside = new THREE.Color("#f6ddc2");
      const mid = new THREE.Color("#bfb9ff");
      const outside = new THREE.Color("#d4e0ff");

      for (let i = 0; i < pointsCount; i += 1) {
        const i3 = i * 3;
        const radius = Math.random() * galaxyRadius;
        const armAngle = ((i % arms) / arms) * Math.PI * 2;
        const spinAngle = radius * spin * 0.08;
        const randomX = (Math.random() - 0.5) * randomness * (1 + radius * 0.035);
        const randomY = (Math.random() - 0.5) * randomness * 0.16;
        const randomZ = (Math.random() - 0.5) * randomness * (1 + radius * 0.035);

        positions[i3] = Math.cos(armAngle + spinAngle) * radius + randomX;
        positions[i3 + 1] = randomY;
        positions[i3 + 2] = Math.sin(armAngle + spinAngle) * radius + randomZ;

        const mixColor = inside.clone().lerp(mid, radius / galaxyRadius).lerp(outside, (radius / galaxyRadius) ** 2);
        colors[i3] = mixColor.r;
        colors[i3 + 1] = mixColor.g;
        colors[i3 + 2] = mixColor.b;
      }

      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

      const material = new THREE.PointsMaterial({
        size: 0.14,
        vertexColors: true,
        transparent: true,
        opacity: 0.84,
        blending: THREE.AdditiveBlending,
        map: starTexture ?? undefined,
        alphaTest: 0.02,
        depthWrite: false
      });

      const galaxy = new THREE.Points(geometry, material);
      galaxy.position.set(0, -3.2, -24);
      galaxy.rotation.x = -0.82;
      scene.add(galaxy);
      driftingGroups.push({ obj: galaxy, speed: 0.00045 });
      disposables.push(geometry, material);
    };

    const sunGeometry = new THREE.SphereGeometry(2.0, 128, 128);
    const sunMaterial = new THREE.MeshStandardMaterial({
      map: makeTexture("/img/sun.jpg"),
      emissive: new THREE.Color("#ff7a1a"),
      emissiveIntensity: 1.35,
      roughness: 0.9,
      metalness: 0
    });
    const sun = new THREE.Mesh(sunGeometry, sunMaterial);
    root.add(sun);
    disposables.push(sunGeometry, sunMaterial);
    spinMeshes.push({ mesh: sun, speed: 0.0019 });
    addGlow(sun, 6.8, "#ffb366", 0.9);
    addGlow(sun, 9.4, "#ff8d4a", 0.5);
    addStarFields();
    addGalaxyBand();
    addMilkyWayHaze();

    const orbitDistances: number[] = [];

    const createOrbitPath = (distance: number) => {
      const points: THREE.Vector3[] = [];
      const segments = 160;
      for (let i = 0; i <= segments; i += 1) {
        const t = (i / segments) * Math.PI * 2;
        points.push(new THREE.Vector3(Math.cos(t) * distance, 0, Math.sin(t) * distance));
      }

      const orbitGeometry = new THREE.BufferGeometry().setFromPoints(points);
      const orbitMaterial = new THREE.LineBasicMaterial({
        color: 0x8bb7ff,
        transparent: true,
        opacity: 0.26
      });
      const orbitLine = new THREE.LineLoop(orbitGeometry, orbitMaterial);
      root.add(orbitLine);
      disposables.push(orbitGeometry, orbitMaterial);
    };

    const createPlanet = ({
      texturePath,
      radius,
      distance,
      orbitSpeed,
      spinSpeed,
      yOffset = 0
    }: {
      texturePath: string;
      radius: number;
      distance: number;
      orbitSpeed: number;
      spinSpeed: number;
      yOffset?: number;
    }) => {
      const pivot = new THREE.Object3D();
      pivot.rotation.y = Math.random() * Math.PI * 2;
      root.add(pivot);
      orbitPivots.push(pivot);
      orbitSpeeds.push(orbitSpeed);
      orbitDistances.push(distance);

      const group = new THREE.Group();
      group.position.set(distance, yOffset, 0);
      pivot.add(group);

      const geometry = new THREE.SphereGeometry(radius, 96, 96);
      const material = new THREE.MeshStandardMaterial({
        map: makeTexture(texturePath),
        roughness: 0.88,
        metalness: 0,
        emissive: new THREE.Color("#2c3f68"),
        emissiveIntensity: 0.14
      });
      const mesh = new THREE.Mesh(geometry, material);
      group.add(mesh);
      disposables.push(geometry, material);
      spinMeshes.push({ mesh, speed: spinSpeed });
      addGlow(group, radius * 3.6, "#7eb6ff", 0.2);

      return { pivot, group, mesh };
    };

    createPlanet({
      texturePath: "/img/mercury.jpg",
      radius: 0.18,
      distance: 2.8,
      orbitSpeed: 0.0082,
      spinSpeed: 0.004
    });
    createPlanet({
      texturePath: "/img/venus.jpg",
      radius: 0.29,
      distance: 3.7,
      orbitSpeed: 0.0066,
      spinSpeed: 0.0028,
      yOffset: 0.03
    });
    createPlanet({
      texturePath: "/img/earth.jpg",
      radius: 0.31,
      distance: 4.8,
      orbitSpeed: 0.0054,
      spinSpeed: 0.0031
    });
    createPlanet({
      texturePath: "/img/mars.jpg",
      radius: 0.23,
      distance: 5.7,
      orbitSpeed: 0.0046,
      spinSpeed: 0.003
    });
    createPlanet({
      texturePath: "/img/jupyter.jpg",
      radius: 0.82,
      distance: 7.3,
      orbitSpeed: 0.0031,
      spinSpeed: 0.0041,
      yOffset: -0.05
    });
    const saturn = createPlanet({
      texturePath: "/img/saturn.jpg",
      radius: 0.7,
      distance: 8.8,
      orbitSpeed: 0.0025,
      spinSpeed: 0.0037,
      yOffset: 0.04
    });
    createPlanet({
      texturePath: "/img/uranus.jpg",
      radius: 0.5,
      distance: 10.1,
      orbitSpeed: 0.0019,
      spinSpeed: 0.0033,
      yOffset: -0.03
    });
    createPlanet({
      texturePath: "/img/neptune.jpg",
      radius: 0.49,
      distance: 11.4,
      orbitSpeed: 0.0015,
      spinSpeed: 0.0032
    });

    for (const distance of orbitDistances) {
      createOrbitPath(distance);
    }

    const ringGeometry = new THREE.RingGeometry(0.95, 1.3, 96);
    const ringMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color("#d5b98d"),
      transparent: true,
      opacity: 0.72,
      side: THREE.DoubleSide,
      roughness: 0.85,
      metalness: 0
    });
    const saturnRing = new THREE.Mesh(ringGeometry, ringMaterial);
    saturnRing.rotation.x = Math.PI * 0.46;
    saturn.group.add(saturnRing);
    disposables.push(ringGeometry, ringMaterial);

    const ambient = new THREE.AmbientLight(0xffffff, 0.95);
    scene.add(ambient);

    const key = new THREE.DirectionalLight(0xffffff, 1.75);
    key.position.set(5, 3.5, 5.4);
    scene.add(key);

    const fill = new THREE.DirectionalLight(0x8ec5ff, 0.85);
    fill.position.set(-4.5, -1.2, 3.2);
    scene.add(fill);

    const rim = new THREE.PointLight(0x6bb6ff, 0.92, 70, 2);
    rim.position.set(-5, 2, -4.5);
    scene.add(rim);

    const sunLight = new THREE.PointLight(0xffbf7a, 2.35, 85, 2);
    sunLight.position.set(0, 0, 0);
    root.add(sunLight);

    const resize = () => {
      const w = Math.max(host.clientWidth, 1);
      const h = Math.max(host.clientHeight, 1);
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };

    resize();

    let rafId = 0;
    const animate = () => {
      for (let i = 0; i < orbitPivots.length; i += 1) {
        orbitPivots[i].rotation.y += orbitSpeeds[i];
      }
      for (const { mesh, speed } of spinMeshes) {
        mesh.rotation.y += speed;
      }
      for (const { obj, speed } of driftingGroups) {
        obj.rotation.y += speed;
      }
      renderer.render(scene, camera);
      rafId = window.requestAnimationFrame(animate);
    };
    animate();

    const observer = new ResizeObserver(() => resize());
    observer.observe(host);

    return () => {
      window.cancelAnimationFrame(rafId);
      observer.disconnect();
      for (const disposable of disposables) {
        disposable.dispose();
      }
      renderer.dispose();
    };
  }, []);

  return (
    <div className={`scene ${completed ? "scene-done" : ""} ${showUi ? "ui-visible" : ""}`}>
      <div className="top-page-shell" aria-hidden="true">
        <div className="rb-space-base">
          <div className="rb-aurora">
            <Aurora
              colorStops={["#4f30ff", "#57c8ff", "#4affd8"]}
              amplitude={1}
              blend={0.72}
              speed={0.62}
            />
          </div>

          <div className="rb-stars">
            <div className="rb-stars-core">
              <Particles
                particleCount={600}
                particleSpread={16}
                speed={0.095}
                particleColors={["#ffffff", "#d9eeff", "#8fd9ff", "#85f3ff"]}
                moveParticlesOnHover={false}
                particleHoverFactor={1}
                alphaParticles
                particleBaseSize={44}
                sizeRandomness={0.48}
                cameraDistance={26}
                disableRotation={false}
              />
            </div>

            <div className="rb-stars-glow">
              <Particles
                particleCount={260}
                particleSpread={15}
                speed={0.062}
                particleColors={["#ffffff", "#dbf5ff", "#88ddff", "#8ec9ff"]}
                moveParticlesOnHover={false}
                particleHoverFactor={1}
                alphaParticles
                particleBaseSize={56}
                sizeRandomness={0.4}
                cameraDistance={30}
                disableRotation={false}
              />
            </div>
          </div>

          <div className="rb-vignette" />
          <div className="rb-nebula rb-nebula-a" aria-hidden="true" />
          <div className="rb-nebula rb-nebula-b" aria-hidden="true" />
          <div className="rb-nebula rb-nebula-c" aria-hidden="true" />
          <div className="earth-solo-wrap" aria-hidden="true">
            <div className="earth-solo" ref={earthHostRef}>
              <canvas className="earth-solo-canvas" ref={earthCanvasRef}></canvas>
            </div>
          </div>
        </div>
      </div>

      <h1
        className={`intro-title intro-title-floating ${completed ? "title-docked" : ""}`}
        role="button"
        tabIndex={0}
        aria-label="Reload page"
        onClick={() => window.location.reload()}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            window.location.reload();
          }
        }}
      >
        {letters.map((char, index) => (
          <span
            key={`${char}-${index}`}
            style={{ animationDelay: `${index * 0.06}s` }}
            className={char === " " ? "space" : ""}
          >
            {char}
          </span>
        ))}
      </h1>

      <section className="intro-layer" aria-label="Intro Animation"></section>

      <div className="utility-layer" aria-hidden={!showUi}>
        <button
          type="button"
          className="lang-orb"
          onClick={() => setLanguage((prev) => (prev === "ja" ? "en" : "ja"))}
          aria-label={language === "ja" ? "Switch to English" : "日本語に切り替え"}
          title={language === "ja" ? "Switch to English" : "日本語に切り替え"}
        >
          <span className="lang-orb-core" aria-hidden="true" />
        </button>
      </div>

      <div className="app-shell" aria-hidden={!showUi}>
        <aside className="left-rail" aria-label="Main Menu">
          <nav className="main-nav" aria-label="Section Navigation">
            {SECTION_KEYS.map((item) => (
              <button
                key={item}
                type="button"
                className={`menu-link ${activeSection === item ? "is-active" : ""}`}
                onClick={() => {
                  setActiveSection(item);
                  setHasOpenedGlass(true);
                }}
              >
                {SECTION_LABELS[item]}
              </button>
            ))}
          </nav>
        </aside>

        <section className="content-pane" aria-live="polite">
          {hasOpenedGlass ? (
            <div key={activeSection} className="liquid-surface liquid-glass section-pane-reveal">
              <div className="content-scroll">
                <h2 className="glass-heading">{SECTION_LABELS[activeSection]}</h2>
              </div>
            </div>
          ) : null}
        </section>
      </div>
    </div>
  );
}
