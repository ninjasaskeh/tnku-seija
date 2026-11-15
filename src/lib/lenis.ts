import type Lenis from "lenis";

/** Instance Lenis global (null kalau reduced motion / belum mount). */
export const lenisRef: { current: Lenis | null } = { current: null };
