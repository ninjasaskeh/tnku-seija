#!/usr/bin/env node
// Packet sniffer for the Logs hop: a capture head sweeps the public contribution
// calendar week by week; every day with commits is a "packet" that flashes, is
// captured (cell goes hollow) and flies into the capture counter.
//
// Usage: node scripts/sniffer.mjs [username] > sniffer.svg
// No token needed: it reads the public calendar at github.com/users/<user>/contributions.

const user = process.argv[2] || "ninjasaskeh";

const ACID = "#c6ff00";
const LEVELS = ["#161616", "#3d4f00", "#6b8a00", "#9ccc00", ACID];
const DIM = "#7a7a7a";
const LINE = "#2a2a2a";
const MONO = "'Space Mono',ui-monospace,SFMono-Regular,Menlo,Consolas,monospace";

const W = 900, H = 244;
const GX = 44, GY = 66, CELL = 11, PITCH = 14, ROWS = 7;
const T = 10; // seconds per sweep loop
const SWEEP = 0.9; // fraction of the loop spent sweeping

const html = await fetch(`https://github.com/users/${user}/contributions`, {
  headers: { "X-Requested-With": "XMLHttpRequest", "User-Agent": "profile-sniffer" },
}).then((r) => {
  if (!r.ok) throw new Error(`contributions fetch failed: ${r.status}`);
  return r.text();
});

// cell: <td ... data-date="2026-10-04" id="contribution-day-component-<row>-<col>" data-level="2" ...>
const counts = new Map();
for (const m of html.matchAll(/for="contribution-day-component-(\d+-\d+)"[^>]*>(\d+|No) contributions?/g)) {
  counts.set(m[1], m[2] === "No" ? 0 : Number(m[2]));
}
const days = [];
for (const m of html.matchAll(/data-date="(\d{4}-\d{2}-\d{2})" id="contribution-day-component-(\d+)-(\d+)" data-level="(\d)"/g)) {
  const [, date, row, col, level] = m;
  days.push({ date, row: +row, col: +col, level: +level, count: counts.get(`${row}-${col}`) ?? 0 });
}
if (!days.length) throw new Error("no calendar cells found; GitHub markup may have changed");

const cols = Math.max(...days.map((d) => d.col)) + 1;
const hits = days.filter((d) => d.level > 0).sort((a, b) => a.col - b.col || a.row - b.row);
const total = hits.reduce((s, d) => s + d.count, 0);

const at = (c) => (c / cols) * SWEEP * T; // seconds after loop start when the head reaches column c
const pct = (s) => ((s / T) * 100).toFixed(2);
const cx = (c) => GX + c * PITCH;
const cy = (r) => GY + r * PITCH;
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// month labels: first row-0 cell of each month
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
let months = "", lastMonth = -1, lastX = -99;
for (const d of days.filter((d) => d.row === 0).sort((a, b) => a.col - b.col)) {
  const m = +d.date.slice(5, 7) - 1;
  if (m !== lastMonth && cx(d.col) - lastX > 30) {
    months += `<text x="${cx(d.col)}" y="${GY - 10}" fill="${DIM}" font-size="11">${MONTHS[m]}</text>`;
    lastX = cx(d.col);
  }
  lastMonth = m;
}

let grid = "";
for (const d of days) {
  if (d.level > 0) continue;
  grid += `<rect x="${cx(d.col)}" y="${cy(d.row)}" width="${CELL}" height="${CELL}" fill="${LEVELS[0]}"/>`;
}

// captured packets + the packet that flies to the counter
const COUNTER = { x: W - 40, y: 18 };
let packets = "", flyKeys = "";
hits.forEach((d, i) => {
  const delay = at(d.col).toFixed(3);
  const x = cx(d.col), y = cy(d.row);
  packets += `<rect class="pk" x="${x}" y="${y}" width="${CELL}" height="${CELL}" style="--c:${LEVELS[d.level]};fill:${LEVELS[d.level]};animation-delay:${delay}s"><title>${esc(`${d.count} commit${d.count === 1 ? "" : "s"} · ${d.date}`)}</title></rect>`;
  const dx = COUNTER.x - 4 - x, dy = COUNTER.y - 10 - y;
  flyKeys += `@keyframes f${i}{0%{opacity:0;transform:translate(0,0)}.4%{opacity:1;transform:translate(0,0)}9%{opacity:.9;transform:translate(${dx}px,${dy}px)}9.5%,100%{opacity:0;transform:translate(${dx}px,${dy}px)}}`;
  packets += `<rect class="fly" x="${x + 2}" y="${y + 2}" width="7" height="7" fill="${ACID}" style="animation:f${i} ${T}s linear ${delay}s infinite both"/>`;
});

// capture counter: one text per value, each visible from its capture until the next
const steps = [{ t: 0, n: 0 }];
let running = 0;
for (const d of hits) {
  running += d.count;
  const t = at(d.col) + 0.9; // after the packet lands
  if (steps.at(-1).t === t) steps.at(-1).n = running;
  else steps.push({ t, n: running });
}
let counter = "", counterKeys = "";
const pad = String(total).length;
steps.forEach((s, i) => {
  const from = pct(s.t), to = i + 1 < steps.length ? pct(steps[i + 1].t) : "100";
  const show = i === 0 ? `0%,${to}%{opacity:1}` : `0%,${(from - 0.01).toFixed(2)}%{opacity:0}${from}%,${to}%{opacity:1}`;
  const hide = to === "100" ? "" : `${(+to + 0.01).toFixed(2)}%,100%{opacity:0}`;
  counterKeys += `@keyframes n${i}{${show}${hide}}`;
  counter += `<text class="cnt" x="${COUNTER.x + 16}" y="${COUNTER.y + 4}" fill="${s.n ? ACID : DIM}" font-size="13" text-anchor="end" style="animation:n${i} ${T}s steps(1) infinite">${String(s.n).padStart(pad, "0")}/${total}</text>`;
});

// latest captures as tcpdump lines under the grid
const latest = [...hits].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 3);
const log = latest
  .map((d, i) => `<text x="${GX}" y="${GY + ROWS * PITCH + 28 + i * 18}" fill="${i ? DIM : "#fff"}" font-size="12">${esc(`${d.date}  IP you.443 > github.com: commit, length ${d.count}`)}</text>`)
  .join("");

const headX = cx(0) - 2, headTravel = (cols - 1) * PITCH;
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="Packet sniffer over ${user}'s contribution graph: ${total} commits on ${hits.length} days in the last year.">
<style>
text{font-family:${MONO}}
.head{animation:sweep ${T}s infinite}
.pk{transform-box:fill-box;transform-origin:center;animation:cap ${T}s linear infinite}
.cnt{opacity:0}
.caret{animation:blink 1s steps(1) infinite}
@keyframes sweep{0%{transform:translateX(0);opacity:1;animation-timing-function:steps(${cols - 1},jump-none)}${(SWEEP * 100).toFixed(0)}%{transform:translateX(${headTravel}px);opacity:1}${(SWEEP * 100 + 2).toFixed(0)}%,100%{transform:translateX(${headTravel}px);opacity:0}}
@keyframes cap{0%{fill:#fff;stroke:none;transform:scale(1.8)}3%{fill:#fff;transform:scale(1)}7%{fill:transparent;stroke:var(--c);stroke-width:1.5}96%{fill:transparent;stroke:var(--c)}100%{fill:var(--c);stroke:none}}
@keyframes blink{50%{opacity:0}}
${flyKeys}
${counterKeys}
@media (prefers-reduced-motion:reduce){.head,.fly{display:none}.pk{animation:none}.cnt{animation:none!important}.cnt:last-of-type{opacity:1}}
</style>
<rect width="${W}" height="${H}" fill="#000"/>
<rect x=".5" y=".5" width="${W - 1}" height="${H - 1}" fill="none" stroke="${LINE}"/>
<line x1="0" y1="34" x2="${W}" y2="34" stroke="${LINE}"/>
<text x="16" y="22" fill="${ACID}" font-size="13">$ tcpdump -i github0 'commit' -w commits.pcap</text>
<text x="${COUNTER.x - 52}" y="${COUNTER.y + 4}" fill="${DIM}" font-size="13" text-anchor="end">captured</text>
<rect x="${COUNTER.x - 46}" y="${COUNTER.y - 8}" width="10" height="10" fill="${ACID}" class="caret"/>
${counter}
<text x="10" y="${cy(1) + 9}" fill="${DIM}" font-size="10">M</text><text x="10" y="${cy(3) + 9}" fill="${DIM}" font-size="10">W</text><text x="10" y="${cy(5) + 9}" fill="${DIM}" font-size="10">F</text>
${months}
${grid}
<g class="head">
<rect x="${headX}" y="${GY - 4}" width="${CELL + 4}" height="${ROWS * PITCH + 5}" fill="${ACID}" fill-opacity=".12" stroke="${ACID}"/>
<path d="M${headX + 7.5} ${GY + ROWS * PITCH + 4} l-5 7 h10z" fill="${ACID}"/>
</g>
${packets}
${log}
<text x="${W - 16}" y="${H - 14}" fill="${DIM}" font-size="11" text-anchor="end">${hits.length} days · ${total} commits · last 365d · public only</text>
</svg>
`;
process.stdout.write(svg);
