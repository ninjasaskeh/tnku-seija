"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { type ReactNode, Suspense } from "react";
import { cx } from "./ui";

type Item = {
  href:
    | "/admin"
    | "/admin/conversations"
    | "/admin/profile"
    | "/admin/story"
    | "/admin/skills"
    | "/admin/projects"
    | "/admin/experience"
    | "/admin/easter-eggs";
  label: string;
  path: string;
};

const GROUPS: { title: string; items: Item[] }[] = [
  {
    title: "Monitor",
    items: [
      { href: "/admin", label: "Overview", path: "~/overview" },
      { href: "/admin/conversations", label: "Conversations", path: "~/chat.log" },
      { href: "/admin/easter-eggs", label: "Easter eggs", path: "~/ai.lore" },
    ],
  },
  {
    title: "Content",
    items: [
      { href: "/admin/profile", label: "Profile", path: "~/profile" },
      { href: "/admin/story", label: "Story", path: "~/keep-alive" },
      { href: "/admin/skills", label: "Skills", path: "~/skills" },
      { href: "/admin/projects", label: "Projects", path: "~/routes" },
      { href: "/admin/experience", label: "Experience", path: "~/access.log" },
    ],
  },
];

const isActive = (pathname: string, href: string) =>
  href === "/admin" ? pathname === "/admin" : pathname === href || pathname.startsWith(`${href}/`);

/**
 * Navigasi panel. Desktop: sidebar kiri nempel. HP: bar atas + menu geser horizontal.
 * `footer` (status sistem + user) dirender server, dikirim lewat props.
 */
export function Sidebar({ footer }: { footer: ReactNode }) {
  return (
    <>
      {/* HP / tablet */}
      <div className="sticky top-0 z-30 border-b border-line bg-ink lg:hidden">
        <div className="flex items-center justify-between px-4 py-3">
          <Brand />
          <Link href="/" className="text-micro text-ash hover:text-acid">
            View site ↗
          </Link>
        </div>
        <nav aria-label="Admin" className="flex gap-1 overflow-x-auto px-3 pb-2">
          <Suspense fallback={<MobileLinks pathname="" />}>
            <ActiveMobileLinks />
          </Suspense>
        </nav>
      </div>

      {/* desktop */}
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r border-line bg-ink lg:flex">
        <div className="border-b border-line px-5 py-4">
          <Brand />
        </div>
        <nav aria-label="Admin" className="flex-1 space-y-6 overflow-y-auto px-3 py-5">
          <Suspense fallback={<DesktopLinks pathname="" />}>
            <ActiveDesktopLinks />
          </Suspense>
          <div>
            <p className="px-2 text-micro uppercase tracking-widest text-ash/70">Site</p>
            <Link href="/" className="mt-2 flex items-center gap-2 px-2 py-2 text-ash hover:text-acid">
              <span aria-hidden="true" className="size-1.5 bg-line" />
              View live site ↗
            </Link>
          </div>
        </nav>
        <div className="border-t border-line p-4">{footer}</div>
      </aside>
    </>
  );
}

/* usePathname() harus di dalam <Suspense> (route dinamis + Cache Components),
   jadi menu dirender dua versi: fallback tanpa highlight, lalu versi aktif. */
function ActiveMobileLinks() {
  return <MobileLinks pathname={usePathname()} />;
}
function ActiveDesktopLinks() {
  return <DesktopLinks pathname={usePathname()} />;
}

function MobileLinks({ pathname }: { pathname: string }) {
  return (
    <>
      {GROUPS.flatMap((g) => g.items).map((it) => (
        <Link
          key={it.href}
          href={it.href}
          aria-current={isActive(pathname, it.href) ? "page" : undefined}
          className="shrink-0 border border-transparent px-2.5 py-1 text-small text-ash aria-[current=page]:border-acid aria-[current=page]:text-acid"
        >
          {it.label}
        </Link>
      ))}
    </>
  );
}

function DesktopLinks({ pathname }: { pathname: string }) {
  return (
    <>
      {GROUPS.map((g) => (
        <div key={g.title}>
          <p className="px-2 text-micro uppercase tracking-widest text-ash/70">{g.title}</p>
          <ul className="mt-2 space-y-0.5">
            {g.items.map((it) => {
              const on = isActive(pathname, it.href);
              return (
                <li key={it.href}>
                  <Link
                    href={it.href}
                    aria-current={on ? "page" : undefined}
                    className={cx(
                      "group flex items-center gap-2 border-l-2 px-2 py-2 transition-colors",
                      on
                        ? "border-acid bg-line/40 text-paper"
                        : "border-transparent text-ash hover:bg-line/30 hover:text-paper",
                    )}
                  >
                    <span
                      aria-hidden="true"
                      className={cx("size-1.5", on ? "bg-acid" : "bg-line group-hover:bg-ash")}
                    />
                    <span className="flex-1">{it.label}</span>
                    <span className="text-micro text-ash/60">{it.path}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </>
  );
}

function Brand() {
  return (
    <Link href="/admin" className="flex items-center gap-2 font-bold">
      <span className="bg-acid px-1.5 text-ink">NOC</span>
      <span className="text-small">portfolio control</span>
    </Link>
  );
}
