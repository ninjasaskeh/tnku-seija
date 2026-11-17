"use client";

import { type FormEvent, useEffect, useRef, useState } from "react";
import { profile, skills } from "@/data/profile";
import { projects } from "@/data/projects";
import { ping } from "@/lib/net";
import { CHAPTER_ORDER, CHAPTERS } from "@/lib/stage";

type Line = { kind: "in" | "out" | "err"; text: string };

const COMMANDS: Record<string, () => string[]> = {
  help: () => ["Commands: whoami, traceroute, ping, curl, skills, projects, contact, clear"],
  whoami: () => [`${profile.name} / ${profile.role}`, profile.tagline],
  skills: () => skills.map((s) => `${s.group.padEnd(9)} ${s.items.join(", ")}`),
  projects: () =>
    projects.map((p, i) => `${String(i + 1).padStart(2, "0")}  ${p.title} (${p.year}) / ${p.stack.join(", ")}`),
  contact: () => [profile.email, ...profile.socials.map((s) => `${s.label}: ${s.href}`)],
  ls: () => ["about/  projects/  skills/  contact/"],
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
    JSON.stringify({ name: profile.name, role: profile.role, email: profile.email, open: true }, null, 2),
  ],
  sudo: () => ["Permission denied. Nice try."],
};

const QUICK = ["help", "whoami", "traceroute", "ping", "curl"];

/** Terminal mini yang beneran bisa diketik. Isinya diambil dari file data. */
export function Terminal() {
  const [lines, setLines] = useState<Line[]>([
    { kind: "out", text: "Type a command and press Enter, or use the buttons below." },
  ]);
  const [value, setValue] = useState("");
  const log = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (log.current) log.current.scrollTop = log.current.scrollHeight;
  }, [lines]);

  // ping beneran: 3 request HEAD ke server ini, hasilnya nongol satu-satu
  const pingLive = async () => {
    const push = (text: string, kind: Line["kind"] = "out") => setLines((prev) => [...prev, { kind, text }].slice(-60));
    const got: number[] = [];
    for (let i = 0; i < 3; i++) {
      const ms = await ping();
      if (ms === null) {
        push("Request timeout: no route (offline or opened from a file).", "err");
        return;
      }
      got.push(ms);
      push(`reply from ${profile.domain}: seq=${i} time=${ms} ms`);
    }
    push(`3 sent, 3 received, 0% loss. min/avg/max = ${Math.min(...got)}/${Math.round(got.reduce((a, b) => a + b) / 3)}/${Math.max(...got)} ms`);
  };

  const run = (raw: string) => {
    const cmd = raw.trim().toLowerCase();
    if (!cmd) return;
    if (cmd === "clear") {
      setLines([]);
      return;
    }
    if (cmd.split(" ")[0] === "ping") {
      pingLive();
      setLines((prev) => [...prev, { kind: "in" as const, text: cmd }, { kind: "out" as const, text: `PING ${profile.domain}: real packets, from your browser` }].slice(-60));
      return;
    }
    const fn = COMMANDS[cmd.split(" ")[0]];
    const out: Line[] = fn
      ? fn().map((text): Line => ({ kind: "out", text }))
      : [{ kind: "err", text: `Unknown command "${cmd}". Try: help` }];
    setLines((prev) => [...prev, { kind: "in" as const, text: cmd }, ...out].slice(-60));
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    run(value);
    setValue("");
  };

  return (
    <div className="border border-line bg-ink text-small">
      <div className="flex items-center justify-between border-b border-line px-4 py-2 text-ash">
        <span>visitor@{profile.domain}: ~</span>
        <span aria-hidden="true" className="flex gap-1.5">
          <i className="size-2 bg-acid" />
          <i className="size-2 bg-volt" />
          <i className="size-2 bg-paper" />
        </span>
      </div>
      <div
        ref={log}
        role="log"
        aria-live="polite"
        data-lenis-prevent
        className="h-52 overflow-y-auto overscroll-contain px-4 py-3"
      >
        {lines.map((l, i) => (
          <p key={i} className={`whitespace-pre-wrap break-words ${l.kind === "err" ? "text-violet" : l.kind === "in" ? "text-acid" : ""}`}>
            {l.kind === "in" ? `$ ${l.text}` : l.text}
          </p>
        ))}
      </div>
      <form onSubmit={submit} className="flex items-center gap-2 border-t border-line px-4 py-2">
        <label htmlFor="term-input" className="text-acid">
          <span aria-hidden="true">$</span>
          <span className="sr-only">Terminal command</span>
        </label>
        <input
          id="term-input"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
          placeholder="help"
          className="min-w-0 flex-1 bg-transparent py-1 text-paper placeholder:text-ash/60 focus:outline-none"
        />
        <button type="submit" className="border border-line px-3 py-1 hover:border-acid hover:text-acid">
          Run
        </button>
      </form>
      <div className="flex flex-wrap gap-2 border-t border-line px-4 py-3">
        {QUICK.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => run(c)}
            className="border border-line px-2 py-1 text-ash hover:border-acid hover:text-acid"
          >
            {c}
          </button>
        ))}
      </div>
    </div>
  );
}
