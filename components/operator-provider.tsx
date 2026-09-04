"use client";

import {
  createContext,
  useCallback,
  useContext,
  useSyncExternalStore,
  type ReactNode,
} from "react";

import type { OperatorState, PublishGate } from "@/lib/types";

const STORAGE_KEY = "weaselnet-operator-v1";

const emptyState: OperatorState = {
  notes: {},
  publish: {},
  pinned: [],
  checkpoint: null,
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
    };
  } catch {
    return emptyState;
  }
}

function emit() {
  version += 1;
  listeners.forEach((listener) => listener());
}

function loadFromStorage() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  cached = parseState(window.localStorage.getItem(STORAGE_KEY));
  version += 1;
}

function subscribe(onStoreChange: () => void) {
  loadFromStorage();
  listeners.add(onStoreChange);
  const onStorage = (event: StorageEvent) => {
    if (event.key !== STORAGE_KEY) return;
    cached = parseState(event.newValue);
    emit();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(onStoreChange);
    window.removeEventListener("storage", onStorage);
  };
}

function getSnapshot() {
  loadFromStorage();
  return version;
}

function getServerSnapshot() {
  return 0;
}

function writeState(next: OperatorState) {
  cached = next;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  emit();
}

type OperatorContextValue = OperatorState & {
  setNote: (slug: string, note: string) => void;
  setPublishItem: (slug: string, key: keyof PublishGate, value: boolean) => void;
  togglePin: (slug: string) => void;
  plantCheckpoint: (slug: string) => void;
  clearCheckpoint: () => void;
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

  const plantCheckpoint = useCallback((slug: string) => {
    writeState({
      ...cached,
      checkpoint: { slug, at: new Date().toISOString() },
    });
  }, []);

  const clearCheckpoint = useCallback(() => {
    writeState({ ...cached, checkpoint: null });
  }, []);

  const value: OperatorContextValue = {
    ...state,
    setNote,
    setPublishItem,
    togglePin,
    plantCheckpoint,
    clearCheckpoint,
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
