"use client";

import { createContext, useContext, type ReactNode } from "react";

import type { OwnerCatalog } from "@/lib/owner/types";

const CatalogContext = createContext<OwnerCatalog | null>(null);

export function CatalogProvider({ catalog, children }: { catalog: OwnerCatalog; children: ReactNode }) {
  return <CatalogContext.Provider value={catalog}>{children}</CatalogContext.Provider>;
}

export function useCatalog(): OwnerCatalog {
  return (
    useContext(CatalogContext) ?? {
      projects: [],
      departments: [],
      hardware: [],
      hardwareKinds: [],
      missionLinks: {},
      constellations: [],
    }
  );
}
