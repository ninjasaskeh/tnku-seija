# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

Next.js here is 16.4 (React 19.3, Tailwind 4.3). APIs differ from training data — read `node_modules/next/dist/docs/` before using a Next API. `next.config.ts` enables `cacheComponents` and `partialPrefetching`, and Tailwind runs through a Turbopack CSS loader rule (`@tailwindcss/turbopack`), not PostCSS.

## Commands

- `npm run dev` — dev server on http://localhost:3000
- `npm run build` / `npm start` — production build / serve
- `npm run lint` — ESLint (flat config, `eslint-config-next` core-web-vitals + typescript)
- `npx tsc --noEmit` — type check (no separate script)
- `npm run preview:single` — Vite build of the same page into one self-contained `preview-dist/index.html` (all JS/CSS/fonts inlined)

No test suite exists. `README.md` is unedited create-next-app boilerplate (mentions `next/font`/Geist and `app/page.tsx`); ignore it.

## Architecture

Single-page portfolio (`src/app/page.tsx`) with a full-screen 3D voxel "stage" behind five scroll "chapters". Concept is **Round Trip**: the visitor is an HTTP request travelling the stack, so each chapter is a "hop" — hero = Request (`GET /you`), about = Handshake (SYN/SYN-ACK/ACK + certificate), projects = Routes (each project is an endpoint with a JSON response), skills = Query (filterable `SELECT ... FROM skills` table), contact = Response (`200 OK`, contact info as response headers). Keep new copy and graphics inside that metaphor. `/styleguide` is a separate design-token reference page. Code comments and data-file comments are in Indonesian; site copy is English.

**Stage state is a plain mutable module, not React state.** `src/lib/stage.ts` holds a `stage` object (current chapter, target shape id, project index, dark/light colors, pose, `glitch` 0..1 spiked on chapter change and decayed in the scene) plus `CHAPTERS` config (also per-hop `label`, `layer`, `addr`, `ms` used by headings, header URL bar, `TraceHud`, `CircuitTrace`, `TabPresence`, and the terminal's `traceroute`). `setChapter()` tweens colors/pose with GSAP and writes CSS vars `--stage-dark`, `--stage-light`, `--stage-fg` on `<html>`. The R3F scene reads `stage` every frame in `useFrame`; it never re-renders from it. `src/lib/pointer.ts` is the same pattern for mouse data (shared by cursor, hero, and scene). Keep this pattern — do not move per-frame data into React state.

**Chapter switching flow:** each section root has `data-chapter="<ChapterId>"`. `StageDirector` creates a ScrollTrigger per `[data-chapter]` element and calls `setChapter()` when it crosses 60% of the viewport. To change a chapter's shape, colors, or object position, edit `CHAPTERS` in `src/lib/stage.ts`. The projects chapter uses shape `route<index>` (voxels spell `/01`, `/02`…); `Projects.tsx` calls `setProject()` as the active slide changes. Section headings come from `HopHeading` (`components/layout/Hop.tsx`); its meta line is a `[data-node]`.

**Page-level concept pieces (all in `components/fx/`):**
- **Real network data:** `src/lib/net.ts` measures real RTT with `HEAD` fetches to the page (`startNet()` in `SmoothScroll`, `ping()` from the terminal and `PingField` clicks). Returns `null` on `file:` (preview build), so UI must show a fallback. Read it with `Rtt` from `NetStatus.tsx`. Decorative numbers (`CHAPTERS[*].ms`, `addr`, project latency) are still fake.
- **`Reassemble`** replaces scramble on big headings: each char is a numbered "packet" that arrives out of order, one is dropped and retransmitted. Styling is the `.pkt` class in `globals.css` driven by CSS vars `--pk`/`--rt`. Its wrapper is `overflow-x-clip` so flying chars never widen the page on mobile — keep that.
- **`CircuitTrace`** draws one PCB-style SVG trace through every `[data-node]` (left gutter) and a mid-section via on the right, inside `<main className="relative">`; a lit packet follows the viewport center each GSAP tick. Geometry rebuilds on `ResizeObserver`.
- **`TabPresence`** rewrites `document.title` and draws the favicon per hop; **`PingField`** turns clicks on empty space into a real ping with a pixel ring.
- **Calm mode** (`src/lib/calm.ts`, toggle button in `SiteHeader`, saved in `localStorage` key `portfolio:calm`, sets `html.calm`): hides `CircuitTrace` and `TraceHud` (`in-[.calm]:hidden`), stops the voxel packet stream and shader glitch, skips `Reassemble` and `PingField`. New busy effects should respect it. Defaults are tuned to stay quiet too: keep glitch tied to chapter changes, not mouse speed.

**3D scene (`src/components/three/`):**
- `Stage.tsx` picks mode: `full` (desktop, 4096 cubes + custom dither post-process), `lite` (≤1023px or coarse pointer, 1400 cubes, no post-processing, CSS scanlines), or `off` (reduced motion or no WebGL). Loads `StageScene` via `next/dynamic` with `ssr: false` inside an error boundary.
- `VoxelSystem.ts` animates one `InstancedMesh` on the CPU between formations. Shape ids map to generators in `points()`: `cube`, `packet` (envelope), `lock`, `db` (stacked discs), `ok` ("200"), `routeN`. Text shapes are rasterized from a 2D canvas; others use `fit()` to shrink resolution until they fit the cube budget. The last 5% of instances never join a shape: they are the "packet stream" falling in two lanes behind the object (faster while `stage.glitch` is high). Transitions funnel cubes through a narrow column top-first. A new shape needs a generator there, a `CHAPTERS` entry, and a rotation case in `StageScene.tsx`'s `Rig`.
- `quietThree.ts` (imported first in `StageScene.tsx`) uses `THREE.setConsoleFunction` to drop only the "THREE.Clock … deprecated" warning that R3F 9.x triggers internally; delete it once R3F uses `THREE.Timer`.
- `DitherEffect.ts` is a custom `postprocessing` Effect (1-bit dither + row glitch + "packet loss" block inversion) fed `stage.light`/`stage.dark` each frame.

**`TraceHud`** is only the bottom-right waterfall (layer + ms) and a mobile progress line.

**Boot sequence:** `BootScreen` waits for fonts (max 700ms), runs a `curl`-style connect log with a percent counter and block progress bar, then sweeps the screen away as a diagonal wave of outlined cells, once per tab session (`sessionStorage` key `portfolio:booted`). `markBooted()` fires at the START of that wave (not at the end), setting `html[data-booted]` and dispatching `boot:done`, so hero text assembles while the overlay leaves. Until then `globals.css` hides `#top [data-in]` and `[data-reasm="boot"]` chars (visible again under reduced motion and in `<noscript>`), so nothing shows fully and then re-animates. An inline script in `layout.tsx` `<head>` (and `preview/index.html`) adds `html.boot-seen` before paint for returning visitors so the server-rendered overlay never flashes; keep the key in sync in all three places. Log lines start `invisible` in the markup for the same reason. `StageDirector` sets the hero chapter on mount (before boot ends) so the voxels have already formed when the overlay leaves; `useBooted()` (`src/lib/boot.ts`) gates hero text animations and scroll-driven chapter switching; `SmoothScroll` keeps Lenis stopped while `html.is-booting`.

**Section / Fx split:** `components/sections/X.tsx` is a server component with markup; `XFx.tsx` is a `"use client"` component that renders `null` and only runs GSAP on that section (targets elements via selectors such as `#top [data-in]`).

**GSAP:** always import from `@/lib/gsap`, which registers plugins (ScrollTrigger, SplitText, ScrambleText, Draggable, Inertia) and exports shared media queries `MOTION_OK`, `FINE_POINTER`, `RAIL`. Wrap animations in `gsap.matchMedia()` with `MOTION_OK` so reduced motion gets no animation. Lenis smooth scroll is driven by the GSAP ticker; the global instance is `lenisRef` (`src/lib/lenis.ts`) — use `lenisRef.current?.scrollTo()` for programmatic scroll.

**Styling:** all tokens live in `@theme` in `src/app/globals.css` (palette `acid/ink/paper/volt/violet/ash/line`, fluid type scale `text-micro`…`text-mega`, fonts Archivo Variable + Space Mono via `@fontsource`). Custom variants: `rail:` (wide+tall+motion OK; Projects becomes a horizontal rail) and `fine:` (mouse). Utilities such as `panel`, `text-accent`, `bg-accent`, `method` (HTTP method badge) follow the stage CSS vars, so chapter colors propagate automatically — prefer them over fixed palette colors for content that sits on the stage. `wire-x`/`wire-y`/`wire-flow` draw dashed "cables" in `currentColor`; `caret` is a blinking terminal block.

**Content:** edit `src/data/profile.ts` (name, `domain`, bio, facts, skills, socials, timezone, nav) and `src/data/projects.ts` (project order sets the /01, /02… routes the voxels form; optional `thumbnail` from `/public/projects/`, else a generative `ProjectThumb`). `skills` group names become the layer filters in `SkillQuery`.

`data-cursor="LABEL"` on any element makes the custom cursor show that label on hover.

## Single-file preview build

`vite.preview.config.mts` builds `preview/main.tsx`, which renders `src/app/page.tsx` directly with React DOM. It aliases `next/dynamic` to `preview/next-dynamic.tsx` (`React.lazy` shim), and `preview/preview.css` imports `globals.css` with `@source "../src"`. Code under `src/` used by the home page must therefore not depend on Next-only runtime APIs beyond `next/dynamic`; adding one (e.g. `next/image`, `next/link`, server-only APIs) requires a matching shim/alias in the preview config.
