import { useEffect, useMemo, useState } from "react";
import { Aurora, particles as Particles } from "@appletosolutions/reactbits";

type IntroSplashProps = {
  title?: string;
  durationMs?: number;
};

const DEFAULT_TITLE = "Fujita-create Portfolio";

export default function IntroSplash({
  title = DEFAULT_TITLE,
  durationMs = 2600
}: IntroSplashProps) {
  const [completed, setCompleted] = useState(false);
  const letters = useMemo(() => title.split(""), [title]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setCompleted(true);
    }, durationMs);

    return () => window.clearTimeout(timer);
  }, [durationMs]);

  return (
    <div className={`scene ${completed ? "scene-done" : ""}`}>
      <div className="top-page-shell" aria-hidden="true">
        <div className="rb-space-base">
          <div className="rb-aurora">
            <Aurora
              colorStops={["#3a29ff", "#5e8bff", "#44e7ff"]}
              amplitude={1}
              blend={0.55}
              speed={0.45}
            />
          </div>

          <div className="rb-stars">
            <div className="rb-stars-core">
              <Particles
                particleCount={600}
                particleSpread={16}
                speed={0.07}
                particleColors={["#f7fbff", "#cde7ff", "#8ec5ff"]}
                moveParticlesOnHover={false}
                particleHoverFactor={1}
                alphaParticles
                particleBaseSize={58}
                sizeRandomness={0.9}
                cameraDistance={22}
                disableRotation={false}
              />
            </div>

            <div className="rb-stars-glow">
              <Particles
                particleCount={260}
                particleSpread={15}
                speed={0.05}
                particleColors={["#ffffff", "#e7f3ff", "#9fd2ff"]}
                moveParticlesOnHover={false}
                particleHoverFactor={1}
                alphaParticles
                particleBaseSize={128}
                sizeRandomness={0.8}
                cameraDistance={24}
                disableRotation={false}
              />
            </div>
          </div>

          <div className="rb-vignette" />
        </div>
      </div>

      <section className="intro-layer" aria-label="Intro Animation">
        <h1 className="intro-title">
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
      </section>
    </div>
  );
}
