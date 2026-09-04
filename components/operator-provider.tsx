"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";

import type { OperatorState, PublishGate } from "@/lib/types";

const STORAGE_KEY = "weaselnet-operator-v1";
const EVENT = "weaselnet-operator";

const emptyState: OperatorState = {
  notes: {},
  publish: {},
  pinned: [],
  checkpoint: null,
};

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

function subscribe(onStoreChange: () => void) {
  const handler = () => onStoreChange();
  window.addEventListener("storage", handler);
  window.addEventListener(EVENT, handler);
  return () => {
    window.removeEventListener("storage", handler);
    window.removeEventListener(EVENT, handler);
  };
}

function getSnapshot(): string {
  return window.localStorage.getItem(STORAGE_KEY) ?? "";
}

function getServerSnapshot(): string {
  return "";
}

function currentState(): OperatorState {
  return parseState(window.localStorage.getItem(STORAGE_KEY));
}

function writeState(next: OperatorState) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  window.dispatchEvent(new Event(EVENT));
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
  const raw = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const state = parseState(raw || null);

  const setNote = useCallback((slug: string, note: string) => {
    const current = currentState();
    writeState({
      ...current,
      notes: { ...current.notes, [slug]: note },
    });
  }, []);

  const setPublishItem = useCallback(
    (slug: string, key: keyof PublishGate, value: boolean) => {
      const current = currentState();
      writeState({
        ...current,
        publish: {
          ...current.publish,
          [slug]: { ...current.publish[slug], [key]: value },
        },
      });
    },
    [],
  );

  const togglePin = useCallback((slug: string) => {
    const current = currentState();
    writeState({
      ...current,
      pinned: current.pinned.includes(slug)
        ? current.pinned.filter((item) => item !== slug)
        : [...current.pinned, slug],
    });
  }, []);

  const plantCheckpoint = useCallback((slug: string) => {
    const current = currentState();
    writeState({
      ...current,
      checkpoint: { slug, at: new Date().toISOString() },
    });
  }, []);

  const clearCheckpoint = useCallback(() => {
    writeState({ ...currentState(), checkpoint: null });
  }, []);

  const value = useMemo(
    () => ({
      ...state,
      setNote,
      setPublishItem,
      togglePin,
      plantCheckpoint,
      clearCheckpoint,
    }),
    [state, setNote, setPublishItem, togglePin, plantCheckpoint, clearCheckpoint],
  );

  return <OperatorContext.Provider value={value}>{children}</OperatorContext.Provider>;
}

export function useOperator() {
  const value = useContext(OperatorContext);
  if (!value) {
    throw new Error("useOperator must run inside OperatorProvider");
  }
  return value;
}
