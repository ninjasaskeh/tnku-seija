"use client";

import { useEffect, useRef } from "react";
import { FINE_POINTER, gsap } from "@/lib/gsap";

const pad = (n: number) => String(Math.max(0, Math.round(n))).padStart(4, "0");

/**
 * Cursor crosshair + koordinat. Cuma aktif kalau ada mouse.
 * Elemen dengan data-cursor="TEKS" nampilin label itu pas di-hover.
 */
export function Cursor() {
  const root = useRef<HTMLDivElement>(null);
  const ring = useRef<SVGSVGElement>(null);
  const coords = useRef<HTMLSpanElement>(null);
  const label = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el || !window.matchMedia(FINE_POINTER).matches) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const html = document.documentElement;
    html.classList.add("has-cursor");

    const dur = reduce ? 0 : 0.18;
    const xTo = gsap.quickTo(el, "x", { duration: dur, ease: "power3" });
    const yTo = gsap.quickTo(el, "y", { duration: dur, ease: "power3" });

    const move = (e: PointerEvent) => {
      xTo(e.clientX);
      yTo(e.clientY);
      el.style.opacity = "1";
      if (coords.current) coords.current.textContent = `X:${pad(e.clientX)} Y:${pad(e.clientY)}`;
    };

    const over = (e: PointerEvent) => {
      const t = (e.target as Element | null)?.closest?.("a, button, [data-cursor]");
      const text = t?.getAttribute("data-cursor") ?? "";
      if (label.current) label.current.textContent = text;
      gsap.to(ring.current, {
        scale: t ? 1.7 : 1,
        rotate: t ? 45 : 0,
        duration: reduce ? 0 : 0.25,
        ease: "power3",
        overwrite: true,
      });
    };

    const leave = () => (el.style.opacity = "0");

    window.addEventListener("pointermove", move, { passive: true });
    document.addEventListener("pointerover", over, { passive: true });
    html.addEventListener("pointerleave", leave);
    return () => {
      html.classList.remove("has-cursor");
      window.removeEventListener("pointermove", move);
      document.removeEventListener("pointerover", over);
      html.removeEventListener("pointerleave", leave);
    };
  }, []);

  return (
    <div
      ref={root}
      aria-hidden="true"
      className="pointer-events-none fixed left-0 top-0 z-[100] hidden text-paper opacity-0 mix-blend-difference fine:block"
    >
      <svg
        ref={ring}
        width="44"
        height="44"
        viewBox="0 0 44 44"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.25"
        className="absolute -left-[22px] -top-[22px]"
      >
        <circle cx="22" cy="22" r="9" />
        <path d="M22 0v15M22 29v15M0 22h15M29 22h15" />
      </svg>
      <span className="absolute -left-px -top-px size-[3px] bg-current" />
      <span className="absolute left-5 top-5 whitespace-nowrap text-micro leading-tight">
        <span ref={coords}>X:0000 Y:0000</span>
        <br />
        <span ref={label} className="font-bold" />
      </span>
    </div>
  );
}
