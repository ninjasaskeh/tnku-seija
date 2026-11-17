import { Suspense } from "react";
import { logout } from "@/app/admin/actions";
import { Sidebar } from "@/components/admin/Sidebar";
import { UserSkeleton } from "@/components/admin/skeletons";
import { btn, StatusDot } from "@/components/admin/ui";
import { authConfigured, requireAdmin } from "@/lib/auth";
import { CHAT_MODEL } from "@/lib/chat";
import { storageConfigured } from "@/lib/storage";

/**
 * Kerangka panel admin (semua halaman selain /admin/login).
 * Sidebar statis langsung tampil; bagian yang baca sesi (user + status) streaming di <Suspense>.
 */
export default function PanelLayout({ children }: LayoutProps<"/admin">) {
  return (
    <div className="min-h-dvh bg-ink lg:flex">
      <Sidebar
        footer={
          <Suspense fallback={<UserSkeleton />}>
            <PanelFooter />
          </Suspense>
        }
      />
      <main className="min-w-0 flex-1 bg-[radial-gradient(circle_at_1px_1px,var(--color-line)_1px,transparent_0)] bg-size-[24px_24px]">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-8 sm:py-8">{children}</div>
        {/* HP: status + akun di bawah halaman (sidebar-nya cuma ada di desktop) */}
        <div className="border-t border-line bg-ink p-4 lg:hidden">
          <Suspense fallback={<UserSkeleton />}>
            <PanelFooter />
          </Suspense>
        </div>
      </main>
    </div>
  );
}

async function PanelFooter() {
  const viewer = await requireAdmin();
  const auth = authConfigured();
  return (
    <div className="space-y-4">
      <div>
        <p className="text-micro uppercase tracking-widest text-ash/70">System</p>
        <ul className="mt-2 space-y-1.5 text-small">
          <StatusDot ok={!!process.env.DATABASE_URL} label="Database" detail="PostgreSQL (Neon)" />
          <StatusDot ok={!!process.env.ANTHROPIC_API_KEY} label="AI chat" detail={CHAT_MODEL} />
          <StatusDot ok={storageConfigured()} label="Image storage" detail="Neon Object Storage" />
          <StatusDot ok={auth.ready} label="Auth" detail="Neon Auth (Google)" />
        </ul>
      </div>
      <div className="flex items-center gap-2.5 border-t border-line pt-4">
        {viewer.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={viewer.image} alt="" referrerPolicy="no-referrer" className="size-8 shrink-0 border border-line object-cover" />
        ) : (
          <span aria-hidden="true" className="grid size-8 shrink-0 place-items-center bg-acid font-bold text-ink">
            {viewer.name.slice(0, 1).toUpperCase()}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-small font-bold">{viewer.name}</p>
          <p className="truncate text-micro text-ash">{viewer.email}</p>
        </div>
      </div>
      <form action={logout}>
        <button type="submit" className={`${btn("ghost", "sm")} w-full`}>
          Sign out
        </button>
      </form>
    </div>
  );
}
