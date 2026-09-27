"use client";

import { useLayoutEffect, useRef, useState } from "react";

import { EntryLabLogo } from "@/components/explore/entry-lab-logo";
import { brandArt, placementForGlyph } from "@/lib/brand/entry-lab-brand";
import { exhibitFrame, exhibitTravelUnits } from "@/lib/explore/exhibit-scroll";
import { publicProjectName } from "@/lib/explore/public-name";
import type { VisitorCard } from "@/lib/visitor/snapshot";

type ShowcaseMode = "list" | "pinned";

function teaserLines(teaser: string) {
  const lines = teaser.split("\n");
  return lines.map((line, index) => (
    <span key={`${index}-${line}`}>
      {line}
      {index < lines.length - 1 ? <br /> : null}
    </span>
  ));
}

function catalogNumber(number: string): string {
  const trimmed = number.trim();
  if (!trimmed) return "";
  return /^p[-\s]/i.test(trimmed) ? trimmed : `P-${trimmed}`;
}

function ExhibitVisual({ card }: { card: VisitorCard }) {
  const artSlot = placementForGlyph(card.glyph);
  if (artSlot && brandArt(artSlot)) {
    return (
      <div className="project-glyph project-art">
        <EntryLabLogo placement={artSlot} />
      </div>
    );
  }
  if (card.glyph === "alfred") {
    return (
      <div className="project-glyph alfred-glyph" aria-hidden="true">
        <span>Al<span className="glyph-dot">.</span></span>
        <div className="signal-lines">{Array.from({ length: 11 }, (_, index) => <i key={index} />)}</div>
      </div>
    );
  }
  if (card.glyph === "dragon") {
    return (
      <div className="project-glyph dragon-glyph" aria-hidden="true">
        <span>Life<span className="glyph-dot">_</span></span>
        <div className="glyph-caption">Mechanics to personality</div>
      </div>
    );
  }
  if (card.glyph === "space") {
    return (
      <div className="project-glyph space-glyph" aria-hidden="true">
        <span>Here<span className="glyph-dot">²</span></span>
        <div className="glyph-caption">Two perspectives, one place</div>
      </div>
    );
  }
  return (
    <div className="project-glyph deck-glyph" aria-hidden="true">
      <span>&gt;_</span>
      <div className="glyph-caption">Salvage, rebuild, reimagine</div>
    </div>
  );
}

function prefersList(): boolean {
  return (
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
    || window.matchMedia("(max-width: 1150px)").matches
    || window.matchMedia("(max-height: 720px)").matches
  );
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

export function ProjectShowcase({
  cards,
  onExplore,
}: {
  cards: VisitorCard[];
  onExplore: (noteSlug: string) => void;
}) {
  const sectionRef = useRef<HTMLElement>(null);
  const stickyRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef(0);
  const [mode, setMode] = useState<ShowcaseMode>("list");
  const [progress, setProgress] = useState(0);
  const count = cards.length;
  const pinned = mode === "pinned" && count > 0;
  const frame = exhibitFrame(pinned ? progress : 0, count);
  const overviewLive = !pinned || frame.overview >= 0.5;
  const activeCard = frame.activeIndex >= 0 ? cards[frame.activeIndex] : undefined;

  useLayoutEffect(() => {
    const queries = [
      window.matchMedia("(prefers-reduced-motion: reduce)"),
      window.matchMedia("(max-width: 1150px)"),
      window.matchMedia("(max-height: 720px)"),
    ];
    const update = () => setMode(prefersList() ? "list" : "pinned");
    update();
    for (const query of queries) query.addEventListener("change", update);
    return () => {
      for (const query of queries) query.removeEventListener("change", update);
    };
  }, []);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    const sticky = stickyRef.current;
    if (!section || !sticky) return;
    if (mode !== "pinned" || count === 0) {
      section.style.height = "";
      progressRef.current = 0;
      return;
    }

    const headerOffset = () => {
      const header = section.closest(".explore-root")?.querySelector(".site-header");
      return header instanceof HTMLElement ? header.offsetHeight : 0;
    };

    const travelFor = () => Math.round(window.innerHeight * exhibitTravelUnits(count));

    const applyHeight = (preserve: boolean) => {
      const topOffset = headerOffset();
      const before = sticky.getBoundingClientRect();
      const wasPinned = before.top <= topOffset + 1 && before.bottom > topOffset + 40;
      const fraction = progressRef.current;
      const travel = travelFor();
      section.style.height = `${sticky.offsetHeight + travel}px`;
      if (preserve && wasPinned) {
        const nextTop = section.getBoundingClientRect().top + window.scrollY;
        window.scrollTo({ top: nextTop - topOffset + fraction * travel, behavior: "auto" });
      }
      measure();
    };

    const measure = () => {
      const topOffset = headerOffset();
      const sectionTop = section.getBoundingClientRect().top + window.scrollY;
      const travel = Math.max(0, section.offsetHeight - sticky.offsetHeight);
      const scrolled = window.scrollY - (sectionTop - topOffset);
      const next = clamp01(travel <= 0 ? 0 : scrolled / travel);
      if (Math.abs(next - progressRef.current) < 0.0005) return;
      progressRef.current = next;
      setProgress(next);
    };

    applyHeight(false);
    let frameId = 0;
    const onScroll = () => {
      cancelAnimationFrame(frameId);
      frameId = requestAnimationFrame(measure);
    };
    const onResize = () => applyHeight(true);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
    };
  }, [mode, count]);

  return (
    <section
      id="projects"
      ref={sectionRef}
      className="project-showcase"
      data-mode={mode}
      data-exhibit={pinned ? String(frame.activeIndex) : "list"}
      aria-labelledby="projects-title"
    >
      <div className="showcase-sticky" ref={stickyRef}>
        <div className="section-width showcase-room">
          <div className="showcase-heading">
            <div>
              <div className="eyebrow">01 / The projects</div>
              <h2 id="projects-title">Ideas with fingerprints.</h2>
            </div>
            <p>Different experiments. The same instinct: understand it, take it apart, make it possible.</p>
          </div>
          {count === 0 ? (
            <p className="showcase-empty">Approved projects will show up in this room.</p>
          ) : (
            <div className="exhibit-frame" data-phase={overviewLive ? "overview" : "feature"}>
              <div
                className="exhibit-overview"
                data-live={overviewLive}
                data-on={!pinned || frame.overview > 0.02}
                aria-hidden={pinned && !overviewLive}
                inert={pinned && !overviewLive}
                style={pinned ? {
                  opacity: frame.overview,
                  transform: `scale(${1 + (1 - frame.overview) * 0.02})`,
                } : undefined}
              >
                <div className="project-grid" style={{ ["--cards" as string]: count }}>
                  {cards.map((card) => {
                    const name = publicProjectName(card);
                    return (
                      <button
                        key={card.slug}
                        type="button"
                        className="project-card"
                        onClick={() => onExplore(card.noteSlug)}
                      >
                        <div className="card-top">
                          <span className="project-number">{catalogNumber(card.number)}</span>
                          <span className="category">{card.category}</span>
                        </div>
                        <ExhibitVisual card={card} />
                        <div className="card-content">
                          <h3>{name} <span aria-hidden="true">↗</span></h3>
                          <p>{teaserLines(card.teaser)}</p>
                          <div className="card-bottom"><span>{card.exploreLabel}</span></div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
              {pinned ? (
                <div className="exhibit-stage">
                  {cards.map((card, index) => {
                    const layer = frame.features[index] ?? { opacity: 0, shift: 1 };
                    const name = publicProjectName(card);
                    const live = !overviewLive && frame.activeIndex === index;
                    return (
                      <article
                        key={card.slug}
                        className="exhibit-feature"
                        data-live={live}
                        data-on={layer.opacity > 0.02}
                        aria-hidden={!live}
                        inert={!live}
                        style={{
                          opacity: layer.opacity,
                          transform: `translate3d(0, ${layer.shift * 18}px, 0) scale(${0.985 + layer.opacity * 0.015})`,
                          zIndex: 1 + Math.round(layer.opacity * 2),
                        }}
                      >
                        <div className="exhibit-visual">
                          <ExhibitVisual card={card} />
                        </div>
                        <div className="exhibit-copy">
                          <div className="exhibit-kicker">
                            <span className="category">{card.category}</span>
                            <span className="project-number">
                              {catalogNumber(card.number)}
                              <span aria-hidden="true"> →</span>
                            </span>
                          </div>
                          <h3 id={`feature-${card.slug}`}>{name}</h3>
                          <p>{teaserLines(card.teaser)}</p>
                          <button type="button" className="exhibit-link" onClick={() => onExplore(card.noteSlug)}>
                            {card.exploreLabel}
                            <span className="showcase-live">, {name}</span>
                          </button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              ) : null}
            </div>
          )}
          {pinned ? (
            <p className="showcase-live" aria-live="polite">
              {activeCard ? publicProjectName(activeCard) : "All projects"}
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
