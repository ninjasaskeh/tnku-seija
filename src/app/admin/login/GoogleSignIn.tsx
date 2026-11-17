"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";

/** Tombol login Google (Neon Auth). Balik lagi ke /admin setelah sukses. */
export function GoogleSignIn() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const signIn = async () => {
    setPending(true);
    setError(null);
    const { error } = await authClient.signIn.social({
      provider: "google",
      callbackURL: `${window.location.origin}/admin`,
    });
    // kalau sukses browser langsung pindah ke Google; sampai sini berarti gagal
    if (error) {
      setError(error.message ?? "Could not start Google sign-in.");
      setPending(false);
    }
  };

  return (
    <div className="mt-6">
      <button
        type="button"
        onClick={signIn}
        disabled={pending}
        className="flex w-full items-center justify-center gap-3 bg-acid px-4 py-3 font-bold text-ink hover:bg-paper disabled:opacity-50"
      >
        <svg aria-hidden="true" viewBox="0 0 24 24" className="size-4" fill="currentColor">
          <path d="M21.35 11.1H12v2.98h5.35c-.23 1.4-1.66 4.1-5.35 4.1a5.95 5.95 0 0 1 0-11.9c1.85 0 3.1.79 3.8 1.47l2.6-2.5C16.74 3.7 14.6 2.8 12 2.8a9.2 9.2 0 1 0 0 18.4c5.3 0 8.83-3.73 8.83-8.98 0-.6-.07-1.06-.15-1.52Z" />
        </svg>
        {pending ? "Redirecting…" : "Sign in with Google"}
      </button>
      <p className="mt-3 text-micro text-ash">Only emails on the admin list get in.</p>
      {error && (
        <p role="alert" className="mt-3 text-violet">
          {error}
        </p>
      )}
    </div>
  );
}
