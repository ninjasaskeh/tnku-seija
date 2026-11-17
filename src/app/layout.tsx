import type { Metadata } from "next";
import { getContent } from "@/lib/content";
import "@fontsource-variable/archivo/wdth.css";
import "@fontsource/space-mono/400.css";
import "@fontsource/space-mono/700.css";
import "./globals.css";

/** Judul & deskripsi dari konten di database (pake cache yang sama dengan halaman). */
export async function generateMetadata(): Promise<Metadata> {
  const { profile } = await getContent();
  return {
    title: { default: `${profile.name} — ${profile.role}`, template: `%s · ${profile.name}` },
    description: `${profile.role} portfolio. ${profile.tagline}`,
  };
}

/**
 * Jalan sebelum paint: kalau boot screen udah pernah tampil di tab ini, sembunyiin dari awal
 * (tanpa ini, tiap reload boot screen dari HTML server sempet kedip sebelum JS jalan).
 * Key harus sama dengan BootScreen.tsx.
 */
const BOOT_SEEN = `try{if(sessionStorage.getItem("portfolio:booted")==="1")document.documentElement.classList.add("boot-seen")}catch(e){}`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // suppressHydrationWarning: class `boot-seen` dipasang script sebelum React hydrate.
    // data-scroll-behavior: globals.css pake scroll-behavior smooth; atribut ini bikin Next
    // matiin smooth scroll sementara waktu pindah halaman (mis. ke /admin).
    <html lang="en" className="antialiased" data-scroll-behavior="smooth" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: BOOT_SEEN }} />
      </head>
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
