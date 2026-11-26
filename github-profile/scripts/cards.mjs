#!/usr/bin/env node
// Builds the custom data cards for the profile README, in the Round Trip style:
//   routes.svg  — hop 03: an API inspector (profile JSON + languages payload)
//   logs.svg    — hop 04: tail of access.log built from the latest real commits
//   uptime.svg  — hop 06: `uptime` for the connection (streaks, load average, sessions per year)
//
// Usage: node scripts/cards.mjs [username]   (writes the three files into the current directory)
// Works without a token (public REST API + public contribution calendar). Set GITHUB_TOKEN for
// higher rate limits.

import { writeFileSync } from "node:fs";

const user = process.argv[2] || "ninjasaskeh";
const TOKEN = process.env.GITHUB_TOKEN;

const ACID = "#c6ff00", VIOLET = "#b18cff", WHITE = "#ffffff", DIM = "#7a7a7a", LINE = "#2a2a2a", INK = "#000000";
const MONO = "'Space Mono',ui-monospace,SFMono-Regular,Menlo,Consolas,monospace";
const SANS = "'Archivo','Arial Black','Helvetica Neue',Arial,sans-serif";
const W = 900;

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const cut = (s, n) => (s.length > n ? s.slice(0, n - 1) + "…" : s);
const today = new Date().toISOString().slice(0, 10);

async function api(path) {
  const r = await fetch(`https://api.github.com${path}`, {
    headers: {
      Accept: "application/vnd.github+json",
      "User-Agent": "profile-cards",
      ...(TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {}),
    },
  });
  if (!r.ok) throw new Error(`GET ${path} → ${r.status} ${await r.text()}`);
  return r.json();
}

async function calendar(year) {
  const r = await fetch(`https://github.com/users/${user}/contributions?from=${year}-01-01&to=${year}-12-31`, {
    headers: { "X-Requested-With": "XMLHttpRequest", "User-Agent": "profile-cards" },
  });
  if (!r.ok) throw new Error(`contributions ${year} → ${r.status}`);
  const html = await r.text();
  const counts = new Map();
  for (const m of html.matchAll(/for="contribution-day-component-(\d+-\d+)"[^>]*>(\d+|No) contributions?/g)) {
    counts.set(m[1], m[2] === "No" ? 0 : Number(m[2]));
  }
  const days = [];
  for (const m of html.matchAll(/data-date="(\d{4}-\d{2}-\d{2})" id="contribution-day-component-(\d+-\d+)"/g)) {
    if (m[1].startsWith(String(year)) && m[1] <= today) days.push({ date: m[1], count: counts.get(m[2]) ?? 0 });
  }
  return days;
}

// ---------- data ----------
const profile = await api(`/users/${user}`);
const repos = (await api(`/users/${user}/repos?per_page=100&type=owner&sort=pushed`)).filter((r) => !r.fork);
const commits = (await api(`/search/commits?q=author:${user}&per_page=1`)).total_count;
const prs = (await api(`/search/issues?q=author:${user}+type:pr&per_page=1`)).total_count;
const stars = repos.reduce((s, r) => s + r.stargazers_count, 0);
const since = profile.created_at.slice(0, 10);

const langCount = new Map();
for (const r of repos) if (r.language) langCount.set(r.language, (langCount.get(r.language) || 0) + 1);
const langs = [...langCount].sort((a, b) => b[1] - a[1]);
const langTotal = langs.reduce((s, [, n]) => s + n, 0);
const topLangs = langs.slice(0, 6);
const otherN = langTotal - topLangs.reduce((s, [, n]) => s + n, 0);
if (otherN > 0) topLangs.push(["other", otherN]);

const recent = [];
// no author= filter: commits made with an email not linked to the account have no author login
for (const r of repos.filter((r) => r.name.toLowerCase() !== user.toLowerCase()).slice(0, 4)) {
  const list = await api(`/repos/${r.full_name}/commits?per_page=5`).catch(() => []);
  for (const c of list) {
    recent.push({ repo: r.name, sha: c.sha.slice(0, 7), date: c.commit.author.date, msg: c.commit.message.split("\n")[0] });
  }
}
recent.sort((a, b) => b.date.localeCompare(a.date));

const days = [];
for (let y = +since.slice(0, 4); y <= +today.slice(0, 4); y++) days.push(...(await calendar(y)));
days.sort((a, b) => a.date.localeCompare(b.date));
const totalContrib = days.reduce((s, d) => s + d.count, 0);

let longest = { len: 0, from: "", to: "" }, run = 0, runFrom = "";
for (const d of days) {
  if (d.count > 0) {
    if (!run) runFrom = d.date;
    run++;
    if (run > longest.len) longest = { len: run, from: runFrom, to: d.date };
  } else run = 0;
}
let current = 0;
{
  let i = days.length - 1;
  if (i >= 0 && days[i].count === 0) i--; // today without commits does not break the streak yet
  while (i >= 0 && days[i].count > 0) (current++, i--);
}
const avg = (n) => days.slice(-n).reduce((s, d) => s + d.count, 0) / n;
const load = [7, 30, 365].map((n) => avg(n).toFixed(2));
const perYear = new Map();
for (const d of days) perYear.set(d.date.slice(0, 4), (perYear.get(d.date.slice(0, 4)) || 0) + d.count);

const upDays = Math.floor((Date.now() - Date.parse(profile.created_at)) / 86400000);
const upText = `${Math.floor(upDays / 365)} years, ${upDays % 365} days`;

// ---------- shared chrome ----------
const frame = (h, bg, border, title, right, rightColor) => `
<rect width="${W}" height="${h}" fill="${bg}"/>
<rect x=".5" y=".5" width="${W - 1}" height="${h - 1}" fill="none" stroke="${border}"/>
<line x1="0" y1="34" x2="${W}" y2="34" stroke="${border}"/>
${title}
<text x="${W - 16}" y="22" fill="${rightColor}" font-size="12" text-anchor="end">${right}</text>`;
const svgOpen = (h, label, css) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${h}" width="${W}" height="${h}" role="img" aria-label="${esc(label)}">
<style>text{font-family:${MONO}}${css}
@keyframes in{from{opacity:0}to{opacity:1}}
@keyframes blink{50%{opacity:0}}
@keyframes pop{from{opacity:0;transform:scale(.2)}to{opacity:1;transform:none}}
@keyframes grow{from{transform:scaleY(0)}to{transform:none}}
.in{opacity:0;animation:in .2s ease-out forwards}
.caret{animation:blink 1s steps(1) infinite}
@media (prefers-reduced-motion:reduce){.in,.vx,.bar{animation:none!important;opacity:1}.caret{animation:none}}
</style>`;

// ---------- routes.svg ----------
{
  const H = 340;
  const json = [
    ["{", null],
    ["login", user],
    ["name", profile.name || user],
    ["since", since],
    ["repos", repos.length],
    ["commits", commits],
    ["pull_requests", prs],
    ["stars", stars],
    ["followers", profile.followers],
    ["}", null],
  ];
  let body = "";
  json.forEach(([k, v], i) => {
    const y = 74 + i * 23, delay = (0.2 + i * 0.12).toFixed(2);
    let line;
    if (v === null) line = `<tspan fill="${DIM}">${k}</tspan>`;
    else {
      const val = typeof v === "number" ? `<tspan fill="${VIOLET}">${v}</tspan>` : `<tspan fill="${ACID}">"${esc(v)}"</tspan>`;
      const comma = json[i + 1][1] === null ? "" : `<tspan fill="${DIM}">,</tspan>`;
      line = `<tspan fill="${WHITE}">  "${k}"</tspan><tspan fill="${DIM}">: </tspan>${val}${comma}`;
    }
    body += `<text class="in" x="24" y="${y}" font-size="14" xml:space="preserve" style="animation-delay:${delay}s">${line}</text>`;
  });

  const CELLS = 24, PITCH = 10, BX = 572;
  const max = Math.max(...topLangs.map(([, n]) => n));
  const shade = [ACID, WHITE, VIOLET, "#9ccc00", "#d0d0d0", "#8a6fd1", DIM];
  let rows = "";
  topLangs.forEach(([name, n], i) => {
    const y = 84 + i * 31;
    const cells = Math.max(1, Math.round((n / max) * CELLS));
    const pct = Math.round((n / langTotal) * 100);
    const base = 0.5 + i * 0.12;
    rows += `<text class="in" x="456" y="${y + 9}" fill="${WHITE}" font-size="13" style="animation-delay:${base.toFixed(2)}s">${esc(cut(name, 13))}</text>`;
    for (let c = 0; c < CELLS; c++) {
      const on = c < cells;
      rows += `<rect class="vx" x="${BX + c * PITCH}" y="${y}" width="8" height="8" fill="${on ? shade[i] : "#161616"}" style="animation-delay:${(base + c * 0.025).toFixed(3)}s"/>`;
    }
    rows += `<text class="in" x="${W - 24}" y="${y + 9}" fill="${DIM}" font-size="12" text-anchor="end" style="animation-delay:${(base + 0.6).toFixed(2)}s">${n} · ${pct}%</text>`;
  });

  const title = `<rect x="16" y="11" width="44" height="14" fill="${ACID}"/><text x="38" y="22" fill="${INK}" font-size="11" font-weight="700" text-anchor="middle">GET</text>
<text x="68" y="22" fill="${WHITE}" font-size="13">/api/v1/users/${esc(user)}</text>`;
  const svg = `${svgOpen(H, `GET /api/v1/users/${user}: ${repos.length} repos, ${commits} commits, ${prs} pull requests, ${stars} stars, ${profile.followers} followers. Languages by repo: ${topLangs.map(([l, n]) => `${l} ${n}`).join(", ")}.`, `
.vx{opacity:0;transform-box:fill-box;transform-origin:center;animation:pop .25s cubic-bezier(.2,.8,.2,1) forwards}`)}
${frame(H, INK, LINE, title, `<tspan fill="${ACID}">200 OK</tspan> · 112ms · application/json`, DIM)}
<line x1="432" y1="34" x2="432" y2="${H - 34}" stroke="${LINE}"/>
<text x="24" y="54" fill="${DIM}" font-size="11">RESPONSE BODY</text>
<text x="456" y="54" fill="${DIM}" font-size="11">GET …/languages · primary language of ${langTotal} repos</text>
${body}
${rows}
<line x1="0" y1="${H - 34}" x2="${W}" y2="${H - 34}" stroke="${LINE}"/>
<text x="24" y="${H - 13}" fill="${DIM}" font-size="11">snapshot ${today} · public data only</text>
<text x="${W - 24}" y="${H - 13}" fill="${DIM}" font-size="11" text-anchor="end">L2 / API · 10.0.2.4</text>
</svg>
`;
  writeFileSync("routes.svg", svg);
}

// ---------- logs.svg ----------
{
  const lines = recent.slice(0, 7);
  const H = 70 + lines.length * 26 + 52;
  const method = (m) => {
    const s = m.toLowerCase();
    if (/^(fix|benerin|bug|hotfix|patch)/.test(s)) return ["PATCH", VIOLET];
    if (/^(add|feat|new|create|init|initial|tambah|bikin)/.test(s)) return ["POST", ACID];
    if (/^(remove|delete|drop|hapus)/.test(s)) return ["DELETE", "#ff5c5c"];
    return ["PUT", WHITE];
  };
  let rows = "";
  lines.forEach((c, i) => {
    const y = 72 + i * 26, delay = (0.25 + i * 0.18).toFixed(2);
    const [m, color] = method(c.msg);
    const ts = c.date.replace("T", " ").slice(0, 16);
    rows += `<g class="in" style="animation-delay:${delay}s">
<text x="20" y="${y}" fill="${DIM}" font-size="12">${ts}</text>
<rect x="152" y="${y - 12}" width="54" height="16" fill="${color}"/>
<text x="179" y="${y}" fill="${INK}" font-size="11" font-weight="700" text-anchor="middle">${m}</text>
<text x="218" y="${y}" fill="${WHITE}" font-size="12">${esc(cut(c.repo, 16))}</text>
<text x="362" y="${y}" fill="${VIOLET}" font-size="12">${c.sha}</text>
<text x="428" y="${y}" fill="${i ? "#bdbdbd" : WHITE}" font-size="12">${esc(cut(`"${c.msg}"`, 56))}</text>
</g>`;
  });
  const cy = 72 + lines.length * 26;
  rows += `<g class="in" style="animation-delay:${(0.25 + lines.length * 0.18).toFixed(2)}s"><rect class="caret" x="20" y="${cy - 11}" width="8" height="14" fill="${ACID}"/><text x="36" y="${cy}" fill="${DIM}" font-size="12">waiting for the next packet…</text></g>`;

  // req/day sparkline (last 30 days) in the title bar
  const last = days.slice(-30), mx = Math.max(1, ...last.map((d) => d.count));
  let spark = "";
  last.forEach((d, i) => {
    const h = d.count ? 3 + Math.round((d.count / mx) * 15) : 1;
    spark += `<rect class="bar" x="${W - 200 + i * 6}" y="${28 - h}" width="4" height="${h}" fill="${d.count ? ACID : "#333"}" style="transform-box:fill-box;transform-origin:bottom;animation:grow .4s ${(i * 0.02).toFixed(2)}s both"/>`;
  });
  const title = `<text x="16" y="22" fill="${ACID}" font-size="13">$ tail -f /var/log/github/access.log</text>
<text x="${W - 210}" y="22" fill="${DIM}" font-size="11" text-anchor="end">req/day · 30d</text>${spark}`;
  const svg = `${svgOpen(H, `access.log: latest commits by ${user}. ${lines.map((c) => `${c.date.slice(0, 10)} ${c.repo}: ${c.msg}`).join("; ")}`, "")}
${frame(H, INK, LINE, title, "", DIM)}
${[["TIME (UTC)", 20], ["METHOD", 152], ["REPO", 218], ["SHA", 362], ["MESSAGE", 428]].map(([t, x]) => `<text x="${x}" y="54" fill="${DIM}" font-size="11">${t}</text>`).join("")}
${rows}
<line x1="0" y1="${H - 30}" x2="${W}" y2="${H - 30}" stroke="${LINE}"/>
<text x="20" y="${H - 11}" fill="${DIM}" font-size="11">snapshot ${today} · method from the commit message: fix → PATCH, add → POST, remove → DELETE, else PUT</text>
</svg>
`;
  writeFileSync("logs.svg", svg);
}

// ---------- uptime.svg ----------
{
  const H = 300;
  const DIMV = "rgba(0,0,0,.55)", LINEV = "rgba(0,0,0,.35)";
  const tiles = [
    ["CURRENT STREAK", `${current}d`, current ? "connection open" : "idle, reconnecting"],
    ["LONGEST STREAK", `${longest.len}d`, longest.len ? `${longest.from} → ${longest.to}` : "—"],
    ["CONTRIBUTIONS", String(totalContrib), `since ${since.slice(0, 4)}`],
    ["FIRST PACKET", since.slice(0, 4), since],
  ];
  let tl = "";
  tiles.forEach(([label, big, sub], i) => {
    const x = 24 + i * 218, d = (0.5 + i * 0.15).toFixed(2);
    tl += `<g class="in" style="animation-delay:${d}s">
<text x="${x}" y="104" fill="${DIMV}" font-size="11">${label}</text>
<text x="${x - 2}" y="156" fill="${INK}" style="font-family:${SANS};font-size:50px;font-weight:900;letter-spacing:-1px">${esc(big)}</text>
<text x="${x}" y="178" fill="${DIMV}" font-size="11">${esc(sub)}</text>
</g>`;
    if (i) tl += `<line x1="${x - 14}" y1="92" x2="${x - 14}" y2="182" stroke="${LINEV}"/>`;
  });

  const years = [...perYear];
  const ymx = Math.max(1, ...years.map(([, n]) => n));
  const BW = 54, GAP = (W - 48 - years.length * BW) / Math.max(1, years.length - 1);
  let bars = "";
  years.forEach(([y, n], i) => {
    const x = 24 + i * (BW + GAP), h = n ? 4 + Math.round((n / ymx) * 34) : 2;
    bars += `<rect class="bar" x="${x}" y="${258 - h}" width="${BW}" height="${h}" fill="${INK}" style="transform-box:fill-box;transform-origin:bottom;animation:grow .5s ${(1 + i * 0.1).toFixed(2)}s both"/>
<text x="${x}" y="276" fill="${INK}" font-size="11">${y}</text><text x="${x + BW}" y="276" fill="${DIMV}" font-size="11" text-anchor="end">${n}</text>`;
  });

  const now = new Date().toISOString().slice(11, 16);
  const title = `<rect x="16" y="13" width="10" height="10" fill="${INK}"/><text x="34" y="22" fill="${INK}" font-size="13">$ uptime</text>`;
  const svg = `${svgOpen(H, `uptime: up ${upText}. Current streak ${current} days, longest ${longest.len} days, ${totalContrib} contributions since ${since.slice(0, 4)}.`, "")}
${frame(H, VIOLET, INK, title, "L5 / CONNECTION · 10.0.5.2", DIMV)}
<text class="in" x="24" y="64" fill="${INK}" font-size="14" xml:space="preserve" style="animation-delay:.15s"> ${now}  up ${upText},  1 session,  load average: ${load.join(", ")}<tspan class="caret" fill="${INK}">▌</tspan></text>
<text class="in" x="24" y="82" fill="${DIMV}" font-size="11" style="animation-delay:.3s">load average = contributions per day over 7 / 30 / 365 days</text>
${tl}
<line x1="0" y1="200" x2="${W}" y2="200" stroke="${LINEV}"/>
<text x="24" y="218" fill="${DIMV}" font-size="11">SESSIONS PER YEAR</text>
<text x="${W - 24}" y="218" fill="${DIMV}" font-size="11" text-anchor="end">snapshot ${today}</text>
${bars}
</svg>
`;
  writeFileSync("uptime.svg", svg);
}

console.log(`routes.svg logs.svg uptime.svg · ${repos.length} repos, ${commits} commits, streak ${current}/${longest.len}, ${totalContrib} contributions`);
