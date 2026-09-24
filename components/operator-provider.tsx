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

let csrfToken = "";
let currentRevision = 1;
let syncError = "";
let boot: { state: OperatorState; revision: number; csrfToken: string } | null = null;

function rememberBoot(next: { state: OperatorState; revision: number; csrfToken: string }) {
  boot = next;
}
let saveTimer: ReturnType<typeof setTimeout> | null = null;

function persist(next: OperatorState) {
  if (!csrfToken) return;
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    const revision = currentRevision;
    void fetch("/api/operator", {
      method: "PUT",
      headers: {
        "content-type": "application/json",
        "x-csrf-token": csrfToken,
      },
      body: JSON.stringify({ revision, state: next }),
    })
      .then(async (response) => {
        if (response.status === 409) {
          syncError = "The saved board changed. These edits are still on screen and were not written over it.";
          emit();
          return;
        }
        if (!response.ok) {
          syncError = "The board could not be saved. These edits are still on screen.";
          emit();
          return;
        }
        const body = (await response.json()) as { revision?: number };
        if (typeof body.revision === "number") currentRevision = body.revision;
        syncError = "";
        emit();
      })
      .catch(() => {
        syncError = "The board could not be saved. These edits are still on screen.";
        emit();
      });
  }, 400);
}

function emit() {
  version += 1;
  listeners.forEach((listener) => listener());
}

function subscribe(onStoreChange: () => void) {
  if (!loaded) {
    loaded = true;
    if (boot) {
      cached = boot.state;
      currentRevision = boot.revision;
      csrfToken = boot.csrfToken;
    }
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
  syncError: string;
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

export function OperatorProvider({
  children,
  initialState,
  revision = 1,
  csrf = "",
}: {
  children: ReactNode;
  initialState?: OperatorState;
  revision?: number;
  csrf?: string;
}) {
  if (initialState) {
    rememberBoot({ state: initialState, revision, csrfToken: csrf });
  }
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
    syncError,
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

  return (
    <OperatorContext.Provider value={value}>
      <LocalCacheNotice serverHasRecords={hasOperatorRecords(initialState)} />
      {syncError ? <p className="mb-3 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">{syncError}</p> : null}
      {children}
    </OperatorContext.Provider>
  );
}

export function useOperator() {
  const value = useContext(OperatorContext);
  if (!value) {
    throw new Error("useOperator must run inside OperatorProvider");
  }
  return value;
}

function hasOperatorRecords(state?: OperatorState): boolean {
  if (!state) return false;
  return (
    Object.keys(state.notes).length > 0 ||
    state.pinned.length > 0 ||
    state.captures.length > 0 ||
    state.activity.length > 0 ||
    state.evidence.length > 0 ||
    Boolean(state.checkpoint)
  );
}

function localCacheSnapshot() {
  try {
    return Boolean(window.localStorage.getItem(STORAGE_KEY));
  } catch {
    return false;
  }
}

function LocalCacheNotice({ serverHasRecords }: { serverHasRecords: boolean }) {
  const hasLocalCache = useSyncExternalStore(
    () => () => {},
    localCacheSnapshot,
    () => false,
  );
  if (!hasLocalCache || serverHasRecords) return null;
  return (
    <p className="mb-3 rounded-lg border border-primary/30 bg-primary/10 p-3 text-sm text-primary">
      This browser still has a local operator cache under {STORAGE_KEY}. It was not imported. Use Exfil when you want to copy it into the database. Nothing was erased.
    </p>
  );
}
