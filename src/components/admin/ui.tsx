import type { CSSProperties, ReactNode } from "react";

/**
 * Komponen dasar area admin ("NOC"). Gaya: hitam, garis tipis, aksen acid, mono.
 * Server-safe (tanpa state), dipake di halaman & skeleton.
 */

export const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

/** Kelas tombol. variant: primary (acid), ghost (garis), danger (violet). */
export function btn(variant: "primary" | "ghost" | "danger" = "primary", size: "sm" | "md" = "md") {
  return cx(
    "inline-flex items-center justify-center gap-2 font-bold transition-colors disabled:pointer-events-none disabled:opacity-50",
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-acid",
    size === "sm" ? "px-2.5 py-1 text-micro" : "px-4 py-2 text-small",
    variant === "primary" && "bg-acid text-ink hover:bg-paper",
    variant === "ghost" && "border border-line text-paper hover:border-acid hover:text-acid",
    variant === "danger" && "border border-violet/60 text-violet hover:bg-violet hover:text-ink",
  );
}

export function PageHeader({
  kicker,
  title,
  description,
  actions,
}: {
  kicker: string;
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-5">
      <div className="min-w-0">
        <p className="text-micro text-acid">{kicker}</p>
        <h1 className="display mt-1 text-[clamp(1.75rem,3vw,2.5rem)]">{title}</h1>
        {description && <p className="mt-2 max-w-[60ch] text-ash">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}

/** Kartu dengan judul + sudut "crosshair" ala HUD. */
export function Panel({
  title,
  subtitle,
  action,
  children,
  className,
  bodyClassName,
}: {
  title?: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section className={cx("corners relative border border-line bg-ink/80 [--c:var(--color-ash)] [--len:8px]", className)}>
      {(title || action) && (
        <header className="flex items-start justify-between gap-3 border-b border-line px-4 py-3">
          <div className="min-w-0">
            {title && <h2 className="font-bold">{title}</h2>}
            {subtitle && <p className="mt-0.5 text-micro text-ash">{subtitle}</p>}
          </div>
          {action}
        </header>
      )}
      <div className={cx("p-4", bodyClassName)}>{children}</div>
    </section>
  );
}

export function Badge({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "accent" | "warn" }) {
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1 border px-1.5 py-px text-micro font-bold uppercase tracking-wide",
        tone === "neutral" && "border-line text-ash",
        tone === "accent" && "border-acid/60 text-acid",
        tone === "warn" && "border-violet/60 text-violet",
      )}
    >
      {children}
    </span>
  );
}

/** Status sistem: titik + label (warna nggak pernah jadi satu-satunya penanda). */
export function StatusDot({ ok, label, detail }: { ok: boolean; label: string; detail?: string }) {
  return (
    <li className="flex items-center gap-2" title={detail}>
      <span
        aria-hidden="true"
        className={cx("size-2 shrink-0", ok ? "bg-acid" : "border border-violet bg-transparent")}
      />
      <span className="min-w-0 flex-1 truncate">{label}</span>
      <span className={cx("text-micro", ok ? "text-ash" : "text-violet")}>{ok ? "OK" : "OFF"}</span>
    </li>
  );
}

export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="grid place-items-center gap-1 border border-dashed border-line px-4 py-10 text-center">
      <p className="font-bold">{title}</p>
      {children && <p className="max-w-[44ch] text-micro text-ash">{children}</p>}
    </div>
  );
}

/** Balok abu yang berdenyut pelan, buat skeleton loading. */
export function Skeleton({ className, style }: { className?: string; style?: CSSProperties }) {
  return <div aria-hidden="true" style={style} className={cx("animate-pulse bg-line/70", className)} />;
}

/** Bungkus skeleton: diumumin ke screen reader sebagai "loading". */
export function Loading({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div role="status" aria-busy="true" aria-live="polite">
      <span className="sr-only">{label}</span>
      {children}
    </div>
  );
}

const compact = new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 });
export const fmtNum = (n: number) => (Math.abs(n) >= 10_000 ? compact.format(n) : n.toLocaleString("en-US"));
export const fmtUsd = (n: number) => (n > 0 && n < 0.01 ? `$${n.toFixed(4)}` : `$${n.toFixed(2)}`);

/** "3m ago", "2h ago", "5d ago" */
export function timeAgo(date: Date, now = Date.now()) {
  const s = Math.max(0, Math.round((now - date.getTime()) / 1000));
  if (s < 60) return "just now";
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  return d < 30 ? `${d}d ago` : date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}
