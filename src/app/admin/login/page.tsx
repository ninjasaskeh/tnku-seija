import { redirect } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { logout } from "@/app/admin/actions";
import { authConfigured, getViewer } from "@/lib/session";
import { GoogleSignIn } from "./GoogleSignIn";

const ERRORS: Record<string, string> = {
  // dilempar databaseHooks di src/lib/auth.ts kalau email bukan admin
  not_admin: "That Google account is not allowed to sign in here.",
  unable_to_create_user: "Could not create your account. Check the server logs.",
  access_denied: "Sign-in was cancelled.",
};

export default function LoginPage({ searchParams }: PageProps<"/admin/login">) {
  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center px-5">
      <p className="text-acid">$ ssh admin@portfolio</p>
      <h1 className="display mt-3 text-h2">Admin</h1>
      <Suspense fallback={<p className="mt-6 text-ash">Checking session…</p>}>
        <LoginState searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function LoginState({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await connection(); // env & sesi dibaca per request, bukan dibekukan waktu build
  const cfg = authConfigured();
  if (!cfg.ready) {
    return (
      <p className="mt-6 border border-violet p-3 text-violet">
        Admin login is not configured. Set {cfg.missing.join(", ")} in your environment, then restart.
      </p>
    );
  }

  const viewer = await getViewer();
  if (viewer?.isAdmin) redirect("/admin");

  if (viewer) {
    // udah login Google, tapi emailnya bukan admin
    return (
      <div className="mt-6 space-y-4">
        <p className="border border-violet p-3 text-violet">
          Signed in as {viewer.email}, which is not an admin account.
        </p>
        <form action={logout}>
          <button type="submit" className="w-full border border-line px-4 py-2 hover:border-acid hover:text-acid">
            Sign out and use another account
          </button>
        </form>
      </div>
    );
  }

  const code = (await searchParams).error;
  const message =
    typeof code === "string" ? (ERRORS[code.toLowerCase()] ?? `Sign-in failed (${code.slice(0, 60)}). Try again.`) : null;

  return (
    <>
      {message && (
        <p role="alert" className="mt-6 border border-violet p-3 text-violet">
          {message}
        </p>
      )}
      <GoogleSignIn />
    </>
  );
}
