import { useEffect, useMemo, useState } from "react";

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
      <div className="bg-orbs" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>

      <div className="top-page-shell" />

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
