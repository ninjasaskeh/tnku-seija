"use client";

import { useState } from "react";

/** Tombol salin email. Kalau clipboard ditolak browser, kasih tau biar disalin manual. */
export function CopyEmail({ email }: { email: string }) {
  const [state, setState] = useState<"idle" | "ok" | "fail">("idle");

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(email);
      setState("ok");
    } catch {
      setState("fail");
    }
    window.setTimeout(() => setState("idle"), 2400);
  };

  return (
    <>
      <button
        type="button"
        onClick={copy}
        data-cursor="COPY"
        className="bg-accent border border-(--stage-light) px-5 py-3 font-bold hover:bg-transparent hover:text-(--stage-fg)"
      >
        Copy email
      </button>
      <span role="status" className="ml-3 text-small font-bold">
        {state === "ok" && "Email copied"}
        {state === "fail" && "Could not copy. Select the address and copy it manually."}
      </span>
    </>
  );
}
