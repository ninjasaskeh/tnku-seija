"use client";

import { createContext, type ReactNode, useContext } from "react";
import type { Content } from "@/lib/content-types";

const ContentContext = createContext<Content | null>(null);

/** Nyalurin konten (profil, skill, project) ke semua komponen client di bawahnya. */
export function ContentProvider({ value, children }: { value: Content; children: ReactNode }) {
  return <ContentContext.Provider value={value}>{children}</ContentContext.Provider>;
}

export function useContent(): Content {
  const c = useContext(ContentContext);
  if (!c) throw new Error("useContent() harus dipake di dalam <ContentProvider>");
  return c;
}
