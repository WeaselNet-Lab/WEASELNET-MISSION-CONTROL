"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";

import { publicNoteLabel, publicNoteText, publicThreadTags } from "@/lib/explore/public-name";
import { pickDiscovery, pushTrail, trailBack, TRAIL_LIMIT } from "@/lib/explore/trail";
import type { VisitorNote, VisitorSnapshot } from "@/lib/visitor/snapshot";

import { BlueprintField, PULSE, threadPulseRoute } from "@/components/explore/blueprint-field";
import { LabEntry, clearEntrySeen } from "@/components/explore/lab-entry";
import { ProjectShowcase } from "@/components/explore/project-showcase";

const THEME_KEY = "weaselnet-explore-theme";
type ThemeChoice = "a" | "b";
const themeListeners = new Set<() => void>();

function readTheme(): ThemeChoice {
  try {
    const stored = window.localStorage.getItem(THEME_KEY);
    return stored === "a" || stored === "b" ? stored : "a";
  } catch {
    return "a";
  }
}

function subscribeTheme(listener: () => void) {
  themeListeners.add(listener);
  return () => {
    themeListeners.delete(listener);
  };
}

export function ExploreExperience({ snapshot }: { snapshot: VisitorSnapshot }) {
  const router = useRouter();
  const notes = new Map(snapshot.notes.map((note) => [note.slug, note]));
  const theme = useSyncExternalStore(subscribeTheme, readTheme, () => "a" as ThemeChoice);
  const [history, setHistory] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [pulse, setPulse] = useState<{ d: string; w: number; h: number } | null>(null);
  const [pulseFading, setPulseFading] = useState(false);
  const [energized, setEnergized] = useState<string | null>(null);
  const [motionReady, setMotionReady] = useState(false);
  const [revealed, setRevealed] = useState<ReadonlySet<string>>(() => new Set());
  const rootRef = useRef<HTMLDivElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastThread = useRef<string | null>(null);
  const pulseSvgRef = useRef<SVGSVGElement>(null);
  const pulseTimers = useRef<number[]>([]);
  const pulseBusy = useRef(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
    titleRef.current?.focus({ preventScroll: true });
  }, [open, history]);

  // Scroll reveal from the reference: sections fade up the first time they enter view.
  // Without IntersectionObserver, or with reduced motion, everything simply stays visible.
  useEffect(() => {
    const root = rootRef.current;
    if (!root || !("IntersectionObserver" in window)) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const targets = Array.from(root.querySelectorAll<HTMLElement>("[data-reveal]"));
    const onScreen = targets.filter((target) => target.getBoundingClientRect().top < window.innerHeight);
    setRevealed(new Set(onScreen.map((target) => target.dataset.reveal ?? "")));
    setMotionReady(true);
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const key = (entry.target as HTMLElement).dataset.reveal;
          if (key) setRevealed((current) => (current.has(key) ? current : new Set(current).add(key)));
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.07 },
    );
    targets.forEach((target) => observer.observe(target));
    return () => observer.disconnect();
  }, []);

  const revealClass = (key: string) => (revealed.has(key) ? "reveal visible" : "reveal");

  function chooseTheme(next: ThemeChoice) {
    window.localStorage.setItem(THEME_KEY, next);
    themeListeners.forEach((listener) => listener());
  }

  function openNote(slug: string, restart = false) {
    if (!notes.has(slug)) return;
    if (!open || restart) {
      previousFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      setHistory([slug].slice(-TRAIL_LIMIT));
      setOpen(true);
      return;
    }
    setHistory((current) => pushTrail(current, slug));
  }

  /**
   * Rabbit holes open through the blueprint: one orange pulse travels the
   * trunk line to the chosen thread, the row's border brightens on arrival,
   * and only then does the field-notes transition begin. Reduced motion, a
   * missing route, or a pulse already in flight all skip straight to open.
   */
  function energizeOpen(slug: string, thread: HTMLElement | null) {
    if (!notes.has(slug)) return;
    const root = rootRef.current;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const route = !reduced && root && thread && !pulseBusy.current ? threadPulseRoute(root, thread) : null;
    if (!route) {
      openNote(slug, true);
      return;
    }
    pulseBusy.current = true;
    setPulse(route);
    setPulseFading(false);
    pulseTimers.current.push(window.setTimeout(() => setEnergized(slug), PULSE.travel));
    pulseTimers.current.push(
      window.setTimeout(() => {
        setPulseFading(true);
        openNote(slug, true);
      }, PULSE.travel + PULSE.hold),
    );
    pulseTimers.current.push(
      window.setTimeout(() => {
        setPulse(null);
        setPulseFading(false);
        setEnergized(null);
        pulseBusy.current = false;
      }, PULSE.travel + PULSE.hold + PULSE.fade),
    );
  }

  // Drive the pulse along its route: draw-on trace, fading trail, bright head.
  useEffect(() => {
    if (!pulse) return;
    const svg = pulseSvgRef.current;
    const routePath = svg?.querySelector<SVGPathElement>(".pulse-route");
    const trailPath = svg?.querySelector<SVGPathElement>(".pulse-trail");
    const head = svg?.querySelector<SVGCircleElement>(".pulse-head");
    const glow = svg?.querySelector<SVGCircleElement>(".pulse-head-glow");
    if (!routePath || !trailPath || !head || !glow) return;
    const length = routePath.getTotalLength();
    const trail = Math.min(0.35, 96 / length);
    trailPath.style.strokeDasharray = `${trail} 2`;
    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / PULSE.travel);
      routePath.style.strokeDashoffset = String(1 - t);
      trailPath.style.strokeDashoffset = String(trail - t);
      const point = routePath.getPointAtLength(t * length);
      for (const dot of [head, glow]) {
        dot.setAttribute("cx", String(point.x));
        dot.setAttribute("cy", String(point.y));
      }
      if (t < 1) {
        frame = requestAnimationFrame(tick);
      } else {
        head.style.opacity = "0";
        glow.style.opacity = "0";
      }
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [pulse]);

  useEffect(
    () => () => {
      pulseTimers.current.forEach((id) => window.clearTimeout(id));
    },
    [],
  );

  function closeNotes() {
    setOpen(false);
    setHistory([]);
    const focus = previousFocus.current;
    if (focus?.isConnected) focus.focus({ preventScroll: true });
  }

  const current = history.length ? notes.get(history[history.length - 1] ?? "") : undefined;
  const depth = history.length > 1
    ? `${history.length - 1} ${history.length === 2 ? "turn" : "turns"} down the rabbit hole. Follow a breadcrumb above to head back.`
    : "A starting point. Choose a connection and see where it goes.";

  return (
    <div ref={rootRef} className={motionReady ? "explore-root motion-ready" : "explore-root"} data-theme={theme}>
      <BlueprintField rootRef={rootRef} />
      <LabEntry />
      <a className="skip-link" href="#projects">Skip to projects</a>
      <header className="site-header">
        <a className="brand" href="#intro-title" aria-label="WeaselNet Labs home">
          <Image
            src="/brand/weaselnet/Weaselnet-lab-W.png"
            alt=""
            width={1536}
            height={1024}
            priority
            className="brand-mark"
          />
          <span className="brand-words">
            <span className="brand-name">WEASELNET</span>
            <span className="brand-labs">LABS</span>
          </span>
        </a>
        <nav aria-label="Main navigation">
          <a href="#projects">The projects</a>
          <a href="#connections">Rabbit holes <span className="tiny-arrow">↗</span></a>
          <a href="#builder">The builder</a>
        </nav>
        <span className="header-note">INDEPENDENT EXPERIMENTS</span>
      </header>
      <div className="design-options" aria-label="Design options">
        <span>DESIGN STUDY</span>
        <a href="#projects" aria-current={theme === "a" ? "page" : undefined} onClick={(event) => { event.preventDefault(); chooseTheme("a"); }}>A / Original</a>
        <a href="#projects" aria-current={theme === "b" ? "page" : undefined} onClick={(event) => { event.preventDefault(); chooseTheme("b"); }}>B / Graphite + ember</a>
        <button
          type="button"
          onClick={() => {
            clearEntrySeen();
            router.refresh();
          }}
        >
          Replay entrance
        </button>
        <Link href="/">Mission Control</Link>
      </div>
      <main>
        <section className="intro section-width" aria-labelledby="intro-title">
          <div className="intro-main">
            <div className="eyebrow"><span className="short-line" /> CURIOSITY, GIVEN A WORKBENCH.</div>
            <h1 id="intro-title">A few good parts.<br />A wonderfully<br /><em>unreasonable idea.</em></h1>
            <p className="intro-copy">Welcome to WeaselNet Labs. A little robotics, a little intelligence, and a persistent habit of asking “what if?”</p>
            <a className="primary-link" href="#projects">Let me show you around <span>↗</span></a>
          </div>
          <aside className="intro-aside">
            <span className="mono dim">FIELD GUIDE / 001</span>
            <p>Some things start<br />with a plan.<br /><span>Others start with<br />“don&apos;t throw that out.”</span></p>
            <a href="#connections" className="quiet-link">Follow the loose thread <span>↓</span></a>
          </aside>
        </section>
        <section className="workshop section-width" aria-label="Workshop concept illustration">
          <div className="workshop-image" role="img" aria-label="Concept illustration of a robotics workbench under blue and amber light" />
          <div className="workshop-shade" />
          <div className="image-top"><span className="image-tag">THE WORKSHOP, IMAGINED</span><span className="mono image-counter">FIG. 01</span></div>
          <div className="image-caption">
            <div><span className="eyebrow">A PLACE FOR THE POSSIBLE</span><p>“Oh, that?<br />We&apos;re teaching it to walk.”</p></div>
            <button className="image-hotspot" type="button" onClick={() => openNote("dragons", true)} aria-label="Discover the dragon project">
              <span className="hotspot-ring">+</span><span>What&apos;s on the bench?<small>Open field notes</small></span>
            </button>
          </div>
        </section>
        <div className="bench-strip section-width"><span>BUILT FROM QUESTIONS. AND OCCASIONALLY SPARE PARTS.</span><span>SCROLL TO EXPLORE <span>↓</span></span></div>
        <ProjectShowcase cards={snapshot.cards} onExplore={(slug) => openNote(slug, true)} />
        <section id="connections" className={`connections section-width ${revealClass("connections")}`} data-reveal="connections">
          <div className="rabbit-intro">
            <div className="eyebrow">02 / THE RABBIT HOLES</div>
            <h2>Nothing here<br />is <em>quite</em> separate.</h2>
            <p>Pull on an idea. See what it connects to.<br />There is no required reading order.</p>
            <button
              className="text-button"
              type="button"
              onClick={() => {
                const pick = pickDiscovery(snapshot.discovery, lastThread.current);
                if (!pick) return;
                lastThread.current = pick;
                const row = rootRef.current?.querySelector<HTMLElement>(`.thread[data-slug="${pick}"]`) ?? null;
                energizeOpen(pick, row);
              }}
            >
              Pick a thread for me <span>↗</span>
            </button>
          </div>
          <div className="threads">
            {snapshot.threads.map((thread) => (
              <button
                key={thread.slug}
                className="thread"
                type="button"
                data-slug={thread.slug}
                data-energized={energized === thread.slug ? "true" : undefined}
                onClick={(event) => energizeOpen(thread.slug, event.currentTarget)}
              >
                <span className="thread-num">{thread.threadNum}</span>
                <span className="thread-body">
                  <span className="thread-tags">{thread.threadTags ? publicThreadTags(thread.threadTags) : null}</span>
                  <strong>{thread.threadTitle}</strong>
                  <span>{thread.threadDetail}</span>
                </span>
                <span className="thread-arrow">↗</span>
              </button>
            ))}
          </div>
        </section>
        <section id="builder" className={`builder section-width ${revealClass("builder")}`} data-reveal="builder">
          <div className="eyebrow">03 / THE HUMAN IN THE LOOP</div>
          <div className="builder-grid">
            <h2>Engineer by trade.<br /><em>“What if?”</em> by default.</h2>
            <div>
              <p>I&apos;m Josh. A software and hardware verification engineer, dad, and builder of things that tend to require an explanation.</p>
              <p>WeaselNet Labs is where those questions get room to become something real. Sometimes that means local AI. Sometimes it means building dragons with my daughters. Usually, it means learning something I didn&apos;t know I needed.</p>
              <div className="signature">Josh <span>/ FOUNDER, CHIEF PARTS KEEPER</span></div>
            </div>
          </div>
        </section>
        <div className={`last-note section-width ${revealClass("last-note")}`} data-reveal="last-note">
          <span className="mono">A NOTE BEFORE YOU GO</span>
          <p>Stay curious.<br />The interesting part is usually <button type="button" onClick={() => openNote("underneath", true)}>underneath.</button></p>
          <span className="note-mark" aria-hidden="true">↳</span>
        </div>
      </main>
      <footer className="section-width">
        <a className="footer-name" href="#intro-title">WEASELNET LABS</a>
        <span>A WORKSHOP IN PROGRESS.</span>
        <a href="#intro-title">Back to the surface ↑</a>
      </footer>
      {pulse ? (
        <svg
          ref={pulseSvgRef}
          className="pulse-overlay"
          viewBox={`0 0 ${pulse.w} ${pulse.h}`}
          data-fading={pulseFading ? "true" : undefined}
          aria-hidden="true"
          focusable="false"
        >
          <path className="pulse-route" d={pulse.d} pathLength={1} strokeDasharray={1} strokeDashoffset={1} />
          <path className="pulse-trail" d={pulse.d} pathLength={1} strokeDasharray="0 2" strokeDashoffset={0} />
          <circle className="pulse-head-glow" cx="-20" cy="-20" r="5.5" />
          <circle className="pulse-head" cx="-20" cy="-20" r="2.2" />
        </svg>
      ) : null}
      <dialog
        id="field-notes"
        ref={dialogRef}
        aria-labelledby="note-title"
        onClose={closeNotes}
        onClick={(event) => {
          const dialog = dialogRef.current;
          if (!dialog || event.target !== dialog) return;
          const rect = dialog.getBoundingClientRect();
          if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) closeNotes();
        }}
        onKeyDown={(event) => {
          if (event.key === "Escape") closeNotes();
        }}
      >
        <div className="dialog-top">
          <span className="mono">WEASELNET / FIELD NOTES</span>
          <button type="button" className="close-button" aria-label="Close field notes" onClick={closeNotes}>✕</button>
        </div>
        <div className="dialog-scroll" ref={scrollRef}>
          {current ? <NoteBody note={current} history={history} notes={notes} depth={depth} titleRef={titleRef} onOpen={openNote} onBack={(index) => setHistory((currentHistory) => trailBack(currentHistory, index))} /> : <p>That connection is not on the visitor map.</p>}
        </div>
      </dialog>
    </div>
  );
}

function NoteBody({
  note,
  history,
  notes,
  depth,
  titleRef,
  onOpen,
  onBack,
}: {
  note: VisitorNote;
  history: string[];
  notes: Map<string, VisitorNote>;
  depth: string;
  titleRef: React.RefObject<HTMLHeadingElement | null>;
  onOpen: (slug: string) => void;
  onBack: (index: number) => void;
}) {
  return (
    <>
      <div className="trail" aria-label="Your exploration path">
        {history.map((slug, index) => {
          const source = notes.get(slug);
          const label = source ? publicNoteLabel(source) : slug;
          const last = index === history.length - 1;
          return (
            <span key={`${slug}-${index}`}>
              {index > 0 ? <span aria-hidden="true"> / </span> : null}
              {last ? <span aria-current="page">{label}</span> : <button type="button" onClick={() => onBack(index)}>{label}</button>}
            </span>
          );
        })}
      </div>
      <div className="eyebrow" id="note-category">{note.category}</div>
      <h2 id="note-title" ref={titleRef} tabIndex={-1}>
        {note.titleLines.map((line) => <span key={line}>{publicNoteText(line)}<br /></span>)}
      </h2>
      <p className="note-lead">{publicNoteText(note.lead)}</p>
      <div>
        {note.blocks.map((block) => (
          <div className="note-block" key={block.heading}>
            <h3>{publicNoteText(block.heading)}</h3>
            <p>{publicNoteText(block.body)}</p>
          </div>
        ))}
        <p className="note-aside">{publicNoteText(note.aside)}</p>
      </div>
      <div className="note-divider" />
      <div className="eyebrow">KEEP FOLLOWING THE THREAD</div>
      <div className="note-links">
        {note.links.map((link) => (
          <button key={link.targetSlug} className="note-link" type="button" onClick={() => onOpen(link.targetSlug)}>
            <span>{publicNoteText(link.label)}</span><span aria-hidden="true">↗</span>
          </button>
        ))}
      </div>
      <p className="depth">{depth}</p>
    </>
  );
}
