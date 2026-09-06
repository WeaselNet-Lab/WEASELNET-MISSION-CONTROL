"use client";

import {
  createContext,
  useCallback,
  useContext,
  useSyncExternalStore,
  type ReactNode,
} from "react";

import type { ActivityEntry, CaptureItem, Checkpoint, EvidenceItem, HardwareOverride, OperatorState, PublishGate } from "@/lib/types";

const STORAGE_KEY = "weaselnet-operator-v1";

const emptyState: OperatorState = {
  notes: {},
  publish: {},
  pinned: [],
  checkpoint: null,
  captures: [],
  activity: [],
  evidence: [],
  hardware: {},
};

let cached: OperatorState = emptyState;
let version = 0;
let loaded = false;
const listeners = new Set<() => void>();

function parseState(raw: string | null): OperatorState {
  if (!raw) return emptyState;
  try {
    const parsed = JSON.parse(raw) as Partial<OperatorState>;
    return {
      notes: parsed.notes ?? {},
      publish: parsed.publish ?? {},
      pinned: parsed.pinned ?? [],
      checkpoint: parsed.checkpoint ?? null,
      captures: parsed.captures ?? [],
      activity: parsed.activity ?? [],
      evidence: parsed.evidence ?? [],
      hardware: parsed.hardware ?? {},
    };
  } catch {
    return emptyState;
  }
}

function readStoredState(): OperatorState {
  try {
    return parseState(window.localStorage.getItem(STORAGE_KEY));
  } catch {
    return emptyState;
  }
}

function persist(next: OperatorState) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Private mode can refuse storage. Keep the in-memory board anyway.
  }
}

function emit() {
  version += 1;
  listeners.forEach((listener) => listener());
}

function subscribe(onStoreChange: () => void) {
  if (!loaded) {
    loaded = true;
    cached = readStoredState();
    version += 1;
  }
  listeners.add(onStoreChange);
  return () => {
    listeners.delete(onStoreChange);
  };
}

function getSnapshot() {
  return version;
}

function getServerSnapshot() {
  return 0;
}

function writeState(next: OperatorState) {
  cached = next;
  persist(next);
  emit();
}

type OperatorContextValue = OperatorState & {
  setNote: (slug: string, note: string) => void;
  setPublishItem: (slug: string, key: keyof PublishGate, value: boolean) => void;
  togglePin: (slug: string) => void;
  plantCheckpoint: (checkpoint: Omit<Checkpoint, "at">) => void;
  clearCheckpoint: () => void;
  addCapture: (item: Omit<CaptureItem, "id" | "createdAt" | "status">) => void;
  fileCapture: (id: string, projectSlug: string) => void;
  archiveCapture: (id: string) => void;
  addActivity: (entry: Omit<ActivityEntry, "id" | "at">) => void;
  addEvidence: (entry: Omit<EvidenceItem, "id" | "createdAt">) => void;
  removeEvidence: (id: string) => void;
  setHardware: (id: string, patch: HardwareOverride) => void;
  replaceState: (state: OperatorState) => void;
};

const OperatorContext = createContext<OperatorContextValue | null>(null);

export function OperatorProvider({ children }: { children: ReactNode }) {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const state = snapshot === 0 ? emptyState : cached;

  const setNote = useCallback((slug: string, note: string) => {
    writeState({
      ...cached,
      notes: { ...cached.notes, [slug]: note },
    });
  }, []);

  const setPublishItem = useCallback(
    (slug: string, key: keyof PublishGate, value: boolean) => {
      writeState({
        ...cached,
        publish: {
          ...cached.publish,
          [slug]: { ...cached.publish[slug], [key]: value },
        },
      });
    },
    [],
  );

  const togglePin = useCallback((slug: string) => {
    writeState({
      ...cached,
      pinned: cached.pinned.includes(slug)
        ? cached.pinned.filter((item) => item !== slug)
        : [...cached.pinned, slug],
    });
  }, []);

  const plantCheckpoint = useCallback((checkpoint: Omit<Checkpoint, "at">) => {
    const at = new Date().toISOString();
    writeState({
      ...cached,
      checkpoint: { ...checkpoint, at },
      activity: [{ id: crypto.randomUUID(), projectSlug: checkpoint.slug, kind: "checkpoint", text: checkpoint.doing || checkpoint.next || "Checkpoint planted", at }, ...cached.activity],
    });
  }, []);

  const clearCheckpoint = useCallback(() => {
    writeState({ ...cached, checkpoint: null });
  }, []);

  const addCapture = useCallback((item: Omit<CaptureItem, "id" | "createdAt" | "status">) => {
    const createdAt = new Date().toISOString();
    writeState({
      ...cached,
      captures: [{ ...item, id: crypto.randomUUID(), createdAt, status: item.projectSlug ? "filed" : "inbox" }, ...cached.captures],
      activity: item.projectSlug ? [{ id: crypto.randomUUID(), projectSlug: item.projectSlug, kind: item.kind === "test" ? "test" : item.kind === "decision" ? "decision" : "note", text: `${item.title}: ${item.body}`.trim(), at: createdAt }, ...cached.activity] : cached.activity,
    });
  }, []);

  const fileCapture = useCallback((id: string, projectSlug: string) => {
    const item = cached.captures.find((capture) => capture.id === id);
    writeState({
      ...cached,
      captures: cached.captures.map((capture) => capture.id === id ? { ...capture, projectSlug, status: "filed" } : capture),
      activity: item ? [{ id: crypto.randomUUID(), projectSlug, kind: item.kind === "test" ? "test" : item.kind === "decision" ? "decision" : "note", text: `${item.title}: ${item.body}`.trim(), at: new Date().toISOString() }, ...cached.activity] : cached.activity,
    });
  }, []);

  const archiveCapture = useCallback((id: string) => {
    writeState({ ...cached, captures: cached.captures.map((capture) => capture.id === id ? { ...capture, status: "archived" } : capture) });
  }, []);

  const addActivity = useCallback((entry: Omit<ActivityEntry, "id" | "at">) => {
    writeState({ ...cached, activity: [{ ...entry, id: crypto.randomUUID(), at: new Date().toISOString() }, ...cached.activity] });
  }, []);

  const addEvidence = useCallback((entry: Omit<EvidenceItem, "id" | "createdAt">) => {
    writeState({ ...cached, evidence: [{ ...entry, id: crypto.randomUUID(), createdAt: new Date().toISOString() }, ...cached.evidence] });
  }, []);

  const removeEvidence = useCallback((id: string) => {
    writeState({ ...cached, evidence: cached.evidence.filter((entry) => entry.id !== id) });
  }, []);

  const setHardware = useCallback((id: string, patch: HardwareOverride) => {
    writeState({ ...cached, hardware: { ...cached.hardware, [id]: { ...cached.hardware[id], ...patch } } });
  }, []);

  const replaceState = useCallback((state: OperatorState) => writeState(state), []);

  const value: OperatorContextValue = {
    ...state,
    setNote,
    setPublishItem,
    togglePin,
    plantCheckpoint,
    clearCheckpoint,
    addCapture,
    fileCapture,
    archiveCapture,
    addActivity,
    addEvidence,
    removeEvidence,
    setHardware,
    replaceState,
  };

  return <OperatorContext.Provider value={value}>{children}</OperatorContext.Provider>;
}

export function useOperator() {
  const value = useContext(OperatorContext);
  if (!value) {
    throw new Error("useOperator must run inside OperatorProvider");
  }
  return value;
}
