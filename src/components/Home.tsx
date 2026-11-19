import { ChatLauncher } from "@/components/chat/ChatLauncher";
import { ChatProvider } from "@/components/chat/ChatProvider";
import { ContentProvider } from "@/components/ContentProvider";
import { Analytics } from "@/components/fx/Analytics";
import { BootScreen } from "@/components/fx/BootScreen";
import { CircuitTrace } from "@/components/fx/CircuitTrace";
import { PingField } from "@/components/fx/PingField";
import { Cursor } from "@/components/fx/Cursor";
import { SmoothScroll } from "@/components/fx/SmoothScroll";
import { StageDirector } from "@/components/fx/StageDirector";
import { TabPresence } from "@/components/fx/TabPresence";
import { TraceHud } from "@/components/fx/TraceHud";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { About } from "@/components/sections/About";
import { Contact } from "@/components/sections/Contact";
import { Experience } from "@/components/sections/Experience";
import { Hero } from "@/components/sections/Hero";
import { KeepAlive } from "@/components/sections/KeepAlive";
import { Projects } from "@/components/sections/Projects";
import { Skills } from "@/components/sections/Skills";
import { Stage } from "@/components/three/Stage";
import type { Content } from "@/lib/content-types";

/**
 * KONSEP: ROUND TRIP — pengunjung = satu HTTP request yang nembus seluruh stack.
 * Susunan halaman:
 * - Stage      : scene 3D layar penuh di belakang semua konten
 * - Director   : ganti bentuk kubus + warna halaman tiap pindah bab (hop)
 * - TraceHud   : waterfall ms + RTT asli (kanan bawah)
 * - CircuitTrace : jalur PCB yang nyambungin semua hop, paket nyala ngikutin scroll
 * - TabPresence  : judul tab + favicon ikut status request
 * - PingField    : klik area kosong = ping beneran
 * - Analytics    : catat kunjungan & hop yang dibuka (anonim) ke /api/track
 * - ChatLauncher : tombol chat mengambang; obrolannya sama dengan terminal di Handshake (ChatProvider)
 * - 7 hop      : Request (Hero), Handshake (About), Routes (Projects), Logs (Experience),
 *                Query (Skills), Keep-Alive (cerita perjalanan), Response (Contact)
 *
 * Konten (`content`) dateng dari luar: dari database lewat src/app/page.tsx,
 * atau dari src/data lewat build preview (preview/main.tsx). Komponen client bacanya
 * pake useContent(); komponen server dapet lewat props.
 */
export function Home({ content }: { content: Content }) {
  const { profile, skills, experience } = content;
  return (
    <ContentProvider value={content}>
      <ChatProvider>
        <noscript>
          <style>{`.boot{display:none} [data-reasm] [data-c], #top [data-in]{visibility:visible !important}`}</style>
        </noscript>
        <Stage />
        <BootScreen />
        <SmoothScroll />
        <StageDirector />
        <Cursor />
        <TraceHud />
        <TabPresence />
        <PingField />
        <Analytics />
        <a
          href="#main"
          className="bg-accent sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:px-4 focus:py-2"
        >
          Skip to content
        </a>
        <SiteHeader />
        <main id="main" className="relative">
          <CircuitTrace />
          <Hero profile={profile} />
          <About profile={profile} />
          <Projects />
          <Experience experience={experience} />
          <Skills skills={skills} />
          <KeepAlive profile={profile} />
          <Contact profile={profile} />
        </main>
        <ChatLauncher />
      </ChatProvider>
    </ContentProvider>
  );
}
