"use client";

import dynamic from "next/dynamic";
import { Component, type ReactNode, useEffect, useState } from "react";
import type { SceneMode } from "./StageScene";

// Scene 3D di-load terpisah, cuma di browser.
const StageScene = dynamic(() => import("./StageScene"), { ssr: false });

class Boundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

function hasWebGL() {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

type Mode = SceneMode | "off";

/**
 * Panggung 3D: canvas layar penuh, nempel di belakang semua konten.
 * - desktop: full (dither)
 * - mobile / layar sentuh: lite (tanpa post-processing)
 * - reduced motion / WebGL nggak ada: off. Halaman tetep ganti warna per bab, cuma tanpa 3D.
 */
export function Stage() {
  const [mode, setMode] = useState<Mode>("off");

  useEffect(() => {
    const pick = (): Mode => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !hasWebGL()) return "off";
      return window.matchMedia("(max-width: 1023px), (pointer: coarse)").matches ? "lite" : "full";
    };
    const apply = () => setMode(pick());
    apply();
    const mq = window.matchMedia("(max-width: 1023px)");
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  if (mode === "off") return null;

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10">
      <Boundary>
        <StageScene mode={mode} />
      </Boundary>
      {mode === "lite" && <div className="scanlines absolute inset-0 opacity-60" />}
    </div>
  );
}
