/** Glyph pixel kotak-kotak. Murni dekorasi → aria-hidden. */
const GLYPHS = {
  arrow: ["00100", "00110", "11111", "00110", "00100"],
  plus: ["00100", "00100", "11111", "00100", "00100"],
  skull: ["01110", "10101", "11111", "01110", "01010"],
  stair: ["10000", "11000", "11100", "11110", "11111"],
  check: ["10101", "01010", "10101", "01010", "10101"],
  frame: ["11111", "10001", "10101", "10001", "11111"],
} as const;

export type GlyphName = keyof typeof GLYPHS;

export function PixelGlyph({
  name,
  size = 6,
  className = "text-acid",
}: {
  name: GlyphName;
  size?: number;
  className?: string;
}) {
  const rows = GLYPHS[name];
  return (
    <svg
      aria-hidden="true"
      width={rows[0].length * size}
      height={rows.length * size}
      viewBox={`0 0 ${rows[0].length} ${rows.length}`}
      shapeRendering="crispEdges"
      className={className}
    >
      {rows.flatMap((row, y) =>
        [...row].map((c, x) =>
          c === "1" ? (
            <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill="currentColor" />
          ) : null,
        ),
      )}
    </svg>
  );
}
