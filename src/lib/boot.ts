"use client";

import { useSyncExternalStore } from "react";

/** Status "boot screen udah selesai". Animasi hero nunggu ini. */
const EVENT = "boot:done";

export function markBooted() {
  if (document.documentElement.dataset.booted === "1") return;
  document.documentElement.dataset.booted = "1";
  document.documentElement.classList.remove("is-booting");
  window.dispatchEvent(new Event(EVENT));
}

function subscribe(cb: () => void) {
  window.addEventListener(EVENT, cb);
  return () => window.removeEventListener(EVENT, cb);
}

export function useBooted() {
  return useSyncExternalStore(
    subscribe,
    () => document.documentElement.dataset.booted === "1",
    () => false,
  );
}
