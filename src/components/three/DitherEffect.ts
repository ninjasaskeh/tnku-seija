import { Effect } from "postprocessing";
import { Color, Uniform } from "three";

/**
 * Efek post-processing custom: dither 1-bit (Bayer 4x4) + scanline + glitch baris.
 * - uPixel : ukuran satu "pixel" dither (device px)
 * - uGlitch: 0..1, dinaikin kecepatan mouse → baris-baris geser horizontal
 * - uScan  : seberapa kuat scanline (0 = mati)
 * - uLight / uDark: dua warna 1-bit-nya (diisi dari warna bab yang aktif)
 */
const fragmentShader = /* glsl */ `
uniform float uPixel;
uniform float uGlitch;
uniform float uScan;
uniform vec3 uLight;
uniform vec3 uDark;

float bayer2(vec2 a) {
  a = floor(a);
  return fract(a.x / 2.0 + a.y * a.y * 0.75);
}
float bayer4(vec2 a) {
  return bayer2(0.5 * a) * 0.25 + bayer2(a);
}
float hash(float n) {
  return fract(sin(n) * 43758.5453123);
}

void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
  vec2 frag = uv * resolution;
  vec2 cell = floor(frag / uPixel);

  // glitch: sebagian pita baris digeser ke samping
  float band = floor(cell.y / 5.0);
  float n = hash(band * 12.9898 + floor(time * 20.0) * 78.233);
  float shift = (n - 0.5) * 0.2 * uGlitch * step(1.0 - uGlitch * 0.7, n);

  vec2 suv = (cell + 0.5) * uPixel / resolution;
  suv.x = clamp(suv.x + shift, 0.0, 1.0);

  vec3 c = texture2D(inputBuffer, suv).rgb;
  float lum = dot(c, vec3(0.299, 0.587, 0.114));
  lum = pow(clamp(lum, 0.0, 1.0), 0.8);

  float on = step(bayer4(cell) + 0.03, lum);
  // scanline: baris genap ditarik sedikit ke arah warna latar
  float line = uScan * step(1.0, mod(cell.y, 2.0));

  outputColor = vec4(mix(uDark, mix(uLight, uDark, line), on), 1.0);
}
`;

export class DitherEffect extends Effect {
  constructor() {
    super("DitherEffect", fragmentShader, {
      uniforms: new Map<string, Uniform>([
        ["uPixel", new Uniform(3)],
        ["uGlitch", new Uniform(0)],
        ["uScan", new Uniform(0.38)],
        ["uLight", new Uniform(new Color("#c6ff00"))],
        ["uDark", new Uniform(new Color("#000000"))],
      ]),
    });
  }
}
