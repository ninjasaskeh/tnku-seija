import type { Metadata } from "next";
import "@fontsource-variable/archivo/wdth.css";
import "@fontsource/space-mono/400.css";
import "@fontsource/space-mono/700.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "Your Name — Fullstack Developer",
  description: "Fullstack developer portfolio. You are the request: follow it through the whole stack.",
};

/**
 * Jalan sebelum paint: kalau boot screen udah pernah tampil di tab ini, sembunyiin dari awal
 * (tanpa ini, tiap reload boot screen dari HTML server sempet kedip sebelum JS jalan).
 * Key harus sama dengan BootScreen.tsx.
 */
const BOOT_SEEN = `try{if(sessionStorage.getItem("portfolio:booted")==="1")document.documentElement.classList.add("boot-seen")}catch(e){}`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // suppressHydrationWarning: class `boot-seen` dipasang script sebelum React hydrate
    <html lang="en" className="antialiased" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: BOOT_SEEN }} />
      </head>
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
