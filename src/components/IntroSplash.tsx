import { useEffect, useMemo, useRef, useState } from "react";
import { Aurora, particles as Particles } from "@appletosolutions/reactbits";
import * as THREE from "three";

type IntroSplashProps = {
  title?: string;
  durationMs?: number;
};

const DEFAULT_TITLE = "Fujita-create Portfolio";
const SECTION_ITEMS = ["Home", "Skills", "Works", "Contacts"] as const;
type Section = (typeof SECTION_ITEMS)[number];

export default function IntroSplash({
  title = DEFAULT_TITLE,
  durationMs = 2600
}: IntroSplashProps) {
  const [completed, setCompleted] = useState(false);
  const [activeSection, setActiveSection] = useState<Section>("Home");
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
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.28;

    const loader = new THREE.TextureLoader();
    const disposables: Array<THREE.BufferGeometry | THREE.Material | THREE.Texture> = [];
    const orbitPivots: THREE.Object3D[] = [];
    const orbitSpeeds: number[] = [];
    const spinMeshes: Array<{ mesh: THREE.Mesh; speed: number }> = [];

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
    <div className={`scene ${completed ? "scene-done" : ""}`}>
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

      <h1 className={`intro-title intro-title-floating ${completed ? "title-docked" : ""}`}>
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

      <div className="app-shell" aria-hidden={!completed}>
        <aside className="left-rail" aria-label="Main Menu">
          <nav className="main-nav">
            {SECTION_ITEMS.map((item) => (
              <button
                key={item}
                type="button"
                className={`menu-link ${activeSection === item ? "is-active" : ""}`}
                onClick={() => setActiveSection(item)}
              >
                {item}
              </button>
            ))}
          </nav>
        </aside>

        <section className="content-pane" aria-live="polite">
          <h2>{activeSection}</h2>
        </section>
      </div>
    </div>
  );
}
