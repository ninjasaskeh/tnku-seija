"use client";

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useContent } from "@/components/ContentProvider";
import { ping } from "@/lib/net";
import { CHAPTER_ORDER, CHAPTERS } from "@/lib/stage";

export type Line = {
  id: number;
  kind: "in" | "out" | "err" | "ai";
  text: string;
};

const SESSION_KEY = "portfolio:chat";
export const MAX_LEN = 600;

let nextId = 0;
const line = (kind: Line["kind"], text: string): Line => ({
  id: nextId++,
  kind,
  text,
});

type Chat = {
  lines: Line[];
  busy: boolean;
  /** jalanin input: perintah lokal, atau pertanyaan ke AI */
  run: (raw: string) => void;
};

const ChatContext = createContext<Chat | null>(null);

/**
 * Satu percakapan buat seluruh halaman: terminal di section Handshake dan panel chat
 * mengambang (ChatLauncher) baca & nulis ke state yang sama, jadi obrolannya nyambung.
 * - Perintah (help, whoami, traceroute, ping, ...) dijawab lokal dari data konten.
 * - Teks lain = pertanyaan ke Claude lewat /api/chat (streaming). Riwayat disimpen server,
 *   id sesinya di sessionStorage biar konteks nyambung selama tab kebuka.
 */
export function ChatProvider({ children }: { children: ReactNode }) {
  const { profile, skills, projects, experience } = useContent();
  const [lines, setLines] = useState<Line[]>(() => [
    line("out", "Ask me anything, or type a command (help)."),
  ]);
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const abort = useRef<AbortController | null>(null);

  useEffect(() => () => abort.current?.abort(), []);

  const push = useCallback(
    (...ls: Line[]) => setLines((prev) => [...prev, ...ls].slice(-80)),
    [],
  );
  const patch = useCallback(
    (id: number, text: string) =>
      setLines((prev) => prev.map((l) => (l.id === id ? { ...l, text } : l))),
    [],
  );

  const commands = useMemo<Record<string, () => string[]>>(
    () => ({
      help: () => [
        "Commands: whoami, traceroute, ping, curl, experience, skills, projects, contact, clear",
        "Anything else is sent to an AI that answers as me, based on this site.",
      ],
      whoami: () => [`${profile.name} / ${profile.role}`, profile.tagline],
      skills: () =>
        skills.map((s) => `${s.group.padEnd(9)} ${s.items.join(", ")}`),
      projects: () =>
        projects.map(
          (p, i) =>
            `${String(i + 1).padStart(2, "0")}  ${p.title} (${p.year}) / ${p.stack.join(", ")}`,
        ),
      experience: () =>
        experience.length
          ? experience.map(
              (e) =>
                `${e.start} → ${(e.end ?? "now").padEnd(7)}  ${e.role} @ ${e.company}`,
            )
          : ["access.log is empty for now."],
      contact: () => [
        profile.email,
        ...profile.socials.map((s) => `${s.label}: ${s.href}`),
      ],
      ls: () => ["about/  projects/  experience/  skills/  contact/"],
      traceroute: () => [
        `traceroute to ${profile.domain}, ${CHAPTER_ORDER.length} hops max`,
        ...CHAPTER_ORDER.map((id, i) => {
          const c = CHAPTERS[id];
          return `${String(i + 1).padStart(2)}  ${c.label.toLowerCase().padEnd(10)} ${c.addr.padEnd(10)} ${String(c.ms).padStart(5)} ms`;
        }),
      ],
      curl: () => [
        "HTTP/2 200",
        "content-type: application/json",
        "",
        JSON.stringify(
          {
            name: profile.name,
            role: profile.role,
            email: profile.email,
            open: true,
          },
          null,
          2,
        ),
      ],
      sudo: () => ["Permission denied. Nice try."],
      // easter egg: sengaja nggak masuk daftar `help`
      credits: () => [
        "Built with: Next.js, React, Three.js (R3F), GSAP, Lenis, Tailwind CSS",
        "Backend: PostgreSQL + Prisma, Better Auth, Claude API for this terminal",
        "Pair-programmed with Claude Code. Thanks for the late nights.",
      ],
    }),
    [profile, skills, projects, experience],
  );

  // ping beneran: 3 request HEAD ke server ini, hasilnya nongol satu-satu
  const pingLive = useCallback(async () => {
    const got: number[] = [];
    for (let i = 0; i < 3; i++) {
      const ms = await ping();
      if (ms === null) {
        push(
          line(
            "err",
            "Request timeout: no route (offline or opened from a file).",
          ),
        );
        return;
      }
      got.push(ms);
      push(line("out", `reply from ${profile.domain}: seq=${i} time=${ms} ms`));
    }
    push(
      line(
        "out",
        `3 sent, 3 received, 0% loss. min/avg/max = ${Math.min(...got)}/${Math.round(got.reduce((a, b) => a + b) / 3)}/${Math.max(...got)} ms`,
      ),
    );
  }, [profile.domain, push]);

  // tanya Claude: jawaban di-stream ke satu baris "ai" yang terus diperbarui
  const ask = useCallback(
    async (question: string) => {
      busyRef.current = true;
      setBusy(true);
      const reply = line("ai", "");
      push(reply);
      const ctrl = new AbortController();
      abort.current = ctrl;
      let sessionId: string | null = null;
      try {
        sessionId = sessionStorage.getItem(SESSION_KEY);
      } catch {}

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ message: question, sessionId }),
          signal: ctrl.signal,
        });
        if (!res.ok || !res.body) {
          const data = (await res.json().catch(() => null)) as {
            error?: string;
          } | null;
          setLines((prev) => prev.filter((l) => l.id !== reply.id));
          push(
            line(
              "err",
              data?.error ??
                `HTTP ${res.status}. Try again, or email ${profile.email}.`,
            ),
          );
          return;
        }
        const sid = res.headers.get("x-chat-session");
        if (sid) {
          try {
            sessionStorage.setItem(SESSION_KEY, sid);
          } catch {}
        }
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let text = "";
        for (;;) {
          const { done, value: chunk } = await reader.read();
          if (done) break;
          text += decoder.decode(chunk, { stream: true });
          patch(reply.id, text);
        }
        if (!text.trim()) patch(reply.id, "(no answer, try rephrasing)");
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        setLines((prev) => prev.filter((l) => l.id !== reply.id || l.text));
        push(
          line(
            "err",
            `Connection dropped. Try again, or email ${profile.email}.`,
          ),
        );
      } finally {
        busyRef.current = false;
        setBusy(false);
        abort.current = null;
      }
    },
    [patch, profile.email, push],
  );

  const run = useCallback(
    (raw: string) => {
      const input = raw.trim();
      if (!input || busyRef.current) return;
      const cmd = input.toLowerCase();
      if (cmd === "clear") {
        setLines([]);
        return;
      }
      push(line("in", input));
      const word = cmd.split(/\s+/)[0]!;
      if (word === "ping") {
        push(
          line(
            "out",
            `PING ${profile.domain}: real packets, from your browser`,
          ),
        );
        pingLive();
        return;
      }
      const fn = commands[word];
      if (fn && word === cmd) {
        push(...fn().map((t) => line("out", t)));
        return;
      }
      // bukan perintah → pertanyaan buat AI ("ask ..." juga boleh)
      ask(input.replace(/^ask\s+/i, "").slice(0, MAX_LEN));
    },
    [ask, commands, pingLive, profile.domain, push],
  );

  const value = useMemo(() => ({ lines, busy, run }), [lines, busy, run]);
  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat(): Chat {
  const c = useContext(ChatContext);
  if (!c) throw new Error("useChat() harus dipake di dalam <ChatProvider>");
  return c;
}
