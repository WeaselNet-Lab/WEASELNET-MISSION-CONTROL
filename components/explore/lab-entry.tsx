"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

const SEEN_KEY = "weaselnet-lab-entry";

/** One timeline for the entrance, the boot, and the handoff to the page. */
const TIMING = { fade: 250, boot: 2800, hold: 550, release: 400 } as const;
const TOTAL = TIMING.fade + TIMING.boot + TIMING.hold + TIMING.release;

/** Readiness rows appear at these points on the same timeline. Theatrical labels only. */
const READINESS = [
  { at: 15, label: "Interface" },
  { at: 35, label: "Project archive" },
  { at: 55, label: "Field notes" },
  { at: 75, label: "Rabbit holes" },
  { at: 95, label: "Lab environment" },
] as const;

const RING_RADIUS = 54;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

type EntryPhase = "idle" | "leaving" | "boot" | "done";

function hasDestination(hash: string): boolean {
  return hash.length > 1;
}

function entrySeen(): boolean {
  try {
    return window.sessionStorage.getItem(SEEN_KEY) === "1";
  } catch {
    return true;
  }
}

function markEntrySeen(): void {
  try {
    window.sessionStorage.setItem(SEEN_KEY, "1");
  } catch {
    // Storage can be unavailable; the entrance simply shows again next load.
  }
}

export function clearEntrySeen(): void {
  try {
    window.sessionStorage.removeItem(SEEN_KEY);
  } catch {
    // Nothing to clear when storage is unavailable.
  }
}

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export function LabEntry() {
  const [phase, setPhase] = useState<EntryPhase>("idle");
  const [enabled, setEnabled] = useState(false);
  const [progress, setProgress] = useState(0);
  const [skipped, setSkipped] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const skipRef = useRef<HTMLButtonElement>(null);
  const timers = useRef<number[]>([]);
  const frameRef = useRef(0);
  const doneRef = useRef(false);

  useEffect(() => {
    if (hasDestination(window.location.hash)) return;
    if (entrySeen()) return;
    const frame = requestAnimationFrame(() => setEnabled(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (!enabled) return;
    document.documentElement.classList.add("lab-entry-active");
    return () => document.documentElement.classList.remove("lab-entry-active");
  }, [enabled]);

  useEffect(() => {
    if (!enabled || phase !== "idle") return;
    buttonRef.current?.focus({ preventScroll: true });
  }, [enabled, phase]);

  useEffect(() => {
    if (phase !== "boot") return;
    skipRef.current?.focus({ preventScroll: true });
  }, [phase]);

  const finish = useCallback(() => {
    if (doneRef.current) return;
    doneRef.current = true;
    cancelAnimationFrame(frameRef.current);
    timers.current.forEach((id) => window.clearTimeout(id));
    timers.current = [];
    setPhase("done");
    setEnabled(false);
    document.documentElement.classList.remove("lab-entry-active");
  }, []);

  useEffect(() => () => {
    cancelAnimationFrame(frameRef.current);
    timers.current.forEach((id) => window.clearTimeout(id));
  }, []);

  const skip = useCallback(() => {
    setSkipped(true);
    finish();
  }, [finish]);

  const enter = useCallback(() => {
    if (phase !== "idle") return;
    markEntrySeen();
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      finish();
      return;
    }
    setPhase("leaving");
    timers.current.push(
      window.setTimeout(() => {
        setPhase("boot");
      }, TIMING.fade),
    );
    const bootStart = performance.now() + TIMING.fade;
    const tick = (now: number) => {
      if (doneRef.current) return;
      const t = Math.min(1, Math.max(0, (now - bootStart) / TIMING.boot));
      setProgress(Math.round(easeInOutCubic(t) * 100));
      if (t < 1) {
        frameRef.current = requestAnimationFrame(tick);
      }
    };
    timers.current.push(
      window.setTimeout(() => {
        frameRef.current = requestAnimationFrame(tick);
      }, TIMING.fade),
    );
    timers.current.push(window.setTimeout(finish, TOTAL));
  }, [phase, finish]);

  useEffect(() => {
    if (!enabled || phase === "idle") return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") skip();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [enabled, phase, skip]);

  if (!enabled) return null;

  const complete = progress >= 100;
  const dash = RING_CIRCUMFERENCE * (1 - progress / 100);

  return (
    <div
      className="lab-entry"
      data-phase={phase}
      role="dialog"
      aria-modal="true"
      aria-labelledby="lab-entry-title"
      style={{ ["--lab-fade" as string]: `${TIMING.fade}ms` }}
    >
      <div className="lab-entry-inner">
        <div className="lab-entry-brand">
          <Image
            src="/weaselnet-wordmark.svg"
            alt="WeaselNet Mission Control"
            width={520}
            height={96}
            priority
            className="lab-entry-logo"
          />
          <p id="lab-entry-title" className="lab-entry-lines">
            <span>Experimental engineering</span>
            <span>Robotics / AI / Shared worlds</span>
          </p>
          <button ref={buttonRef} type="button" className="lab-entry-button" onClick={enter}>
            <span className="lab-entry-rule" aria-hidden="true" />
            <span>Enter the Lab</span>
            <span aria-hidden="true">→</span>
          </button>
        </div>
      </div>
      {phase === "boot" ? (
        <div className="lab-boot" data-complete={complete} data-skipped={skipped}>
          <div className="lab-boot-panel">
            <div className="lab-boot-ring" role="img" aria-label={`Boot ${progress}%`}>
              <svg viewBox="0 0 120 120" aria-hidden="true">
                <circle className="lab-boot-track" cx="60" cy="60" r={RING_RADIUS} />
                <circle
                  className="lab-boot-arc"
                  cx="60"
                  cy="60"
                  r={RING_RADIUS}
                  strokeDasharray={RING_CIRCUMFERENCE}
                  strokeDashoffset={dash}
                  transform="rotate(-90 60 60)"
                />
              </svg>
              <span className="lab-boot-count">{progress}</span>
            </div>
            <div className="lab-boot-list">
              {READINESS.map((row) => (
                <p key={row.at} className="lab-boot-row" data-on={progress >= row.at}>
                  <span>{row.label}</span>
                  <span className="lab-boot-dots" aria-hidden="true" />
                  <span>Ready</span>
                </p>
              ))}
            </div>
          </div>
          <div className="lab-boot-welcome" data-on={complete}>
            <p>Welcome to WeaselNet Labs</p>
            <p className="lab-boot-tagline">“Let me show you around.”</p>
          </div>
          <button ref={skipRef} type="button" className="lab-boot-skip" onClick={skip}>
            Skip intro
          </button>
        </div>
      ) : null}
    </div>
  );
}
