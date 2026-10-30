// One ear, used at every stage: the carved rib-cartilage framework, the same framework as a relief under the forearm
// skin, the flap being moved, and the finished ear on the head. Geometry is in ear-local units (the world's units:
// about 0.68 mm each; the ear is 88 tall), upright, a LEFT ear seen from outside (tragus toward -x, the face side).
// Relief is drawn as a height map (white = raised, black = sunk) lit by an SVG lighting filter, so the same ridges
// shade the skin over them, the bare cartilage, and the finished ear consistently, under one upper-left key light.
import React from 'react';

export const EAR_OUTLINE =
  'M -15 -27 C -13 -38 -4 -45 6 -45 C 18 -45 27 -36 28 -22 C 29 -8 27 6 22 18 C 18 27 15 33 13 39 C 11 45 3 47 -2 43 ' +
  'C -6 40 -8 35 -9 30 C -11 25 -13 22 -12 18 C -17 15 -19 7 -17 0 C -16 -6 -16 -10 -14 -14 C -15 -18 -16 -22 -15 -27 Z';
/** the carved framework: the same rim, no lobule (the lobule is skin only) */
export const FRAME_OUTLINE =
  'M -15 -27 C -13 -38 -4 -45 6 -45 C 18 -45 27 -36 28 -22 C 29 -8 27 6 22 18 C 19 25 15 30 10 32 C 4 34 -2 31 -6 28 ' +
  'C -10 25 -13 22 -12 18 C -17 15 -19 7 -17 0 C -16 -6 -16 -10 -14 -14 C -15 -18 -16 -22 -15 -27 Z';
export const HELIX = 'M -4 -2 C -9 -8 -13 -14 -13 -22 C -12 -32 -6 -40 4 -41 C 14 -42 22 -36 24 -26 C 26 -14 25 0 21 12 C 18 21 15 27 12 31';
export const SCAPHA = 'M 13 -34 C 18 -29 20 -20 20 -10 C 20 1 18 10 14 19';
export const ANTIHELIX = 'M 7 22 C 12 14 14 4 13 -6 C 12.5 -11 11.5 -14 10 -17';
export const SUP_CRUS = 'M 10 -17 C 10 -24 10.5 -29 11 -34';
export const INF_CRUS = 'M 10 -17 C 5 -20 0 -21 -6 -21';
/** approximate path lengths (for progressive carving with dash offsets) */
export const LEN = {helix: 140, scapha: 56, antihelix: 42, sup: 18, inf: 17};

export type ReliefParts = {
  plate?: number; // the raised plate as a whole (0..1)
  rim?: number; // helix rim height
  anti?: number; // antihelix and crura
  hollows?: number; // concha, fossa, scapha depth
  tragus?: number;
  lobule?: number;
  carve?: number; // 0..1 progress along the carved grooves (1 = all)
  rimCarve?: number; // 0..1 progress of the rim ridge being cut free
};

const clampU = (x: number) => Math.min(1, Math.max(0, x));

/** The height map, in ear-local units (blurred by the Relief filter: skin over the framework softens every edge). */
export const EarHeight: React.FC<{p: ReliefParts; outline?: string}> = ({p, outline = FRAME_OUTLINE}) => {
  const plate = p.plate ?? 1, rim = p.rim ?? 1, anti = p.anti ?? 1, hol = p.hollows ?? 1;
  const carve = p.carve ?? 1, rimC = p.rimCarve ?? 1;
  const dash = (len: number, u: number) => ({strokeDasharray: `${len} ${len}`, strokeDashoffset: len * (1 - clampU(u))});
  return (
    <g>
      {/* the raised plate */}
      <path d={outline} fill="#FFF" opacity={0.52 * plate} />
      {/* rim ridge (the helix) */}
      <path d={HELIX} fill="none" stroke="#FFF" strokeWidth={7.5} strokeLinecap="round" opacity={0.58 * rim} {...dash(LEN.helix, rimC)} />
      {/* antihelix and its two crura */}
      <g opacity={0.45 * anti}>
        <path d={ANTIHELIX} fill="none" stroke="#FFF" strokeWidth={6} strokeLinecap="round" {...dash(LEN.antihelix, carve * 1.6)} />
        <path d={SUP_CRUS} fill="none" stroke="#FFF" strokeWidth={4.6} strokeLinecap="round" {...dash(LEN.sup, carve * 2 - 0.5)} />
        <path d={INF_CRUS} fill="none" stroke="#FFF" strokeWidth={4.2} strokeLinecap="round" {...dash(LEN.inf, carve * 2 - 0.6)} />
      </g>
      {/* tragus and antitragus */}
      <ellipse cx={-14} cy={8} rx={3.6} ry={6} fill="#FFF" opacity={0.42 * (p.tragus ?? 1)} />
      <ellipse cx={6} cy={23} rx={5.5} ry={3.6} transform="rotate(-25 6 23)" fill="#FFF" opacity={0.36 * anti} />
      {p.lobule ? <ellipse cx={5} cy={38} rx={8} ry={6} fill="#FFF" opacity={0.35 * p.lobule} /> : null}
      {/* the hollows: the cavum concha is the deep bowl; the cymba above the crus and the triangular fossa between the
          crura are shallow; the scapha is the long groove inside the rim */}
      <g opacity={hol}>
        <ellipse cx={-2} cy={10} rx={9.5} ry={10.5} fill="#000" opacity={0.6 * clampU(carve * 1.4)} />
        <ellipse cx={3} cy={-11} rx={7} ry={3.4} transform="rotate(-12 3 -11)" fill="#000" opacity={0.32 * clampU(carve * 1.6 - 0.3)} />
        <ellipse cx={4} cy={-28} rx={4.5} ry={4.5} transform="rotate(-20 4 -28)" fill="#000" opacity={0.34 * clampU(carve * 2 - 0.8)} />
        <path d={SCAPHA} fill="none" stroke="#000" strokeWidth={4.5} strokeLinecap="round" opacity={0.48} {...dash(LEN.scapha, carve * 1.3 - 0.2)} />
      </g>
    </g>
  );
};

/** Lit relief overlay. Children are a height map (luminance) drawn on black; the output is a shading layer: warm-dark
 *  shadow where the surface turns from the key light, warm-white light (and a little sheen) where it faces it, nothing
 *  on flat ground. `px` is screen pixels per local unit: Chrome evaluates the lighting at device resolution, so the
 *  surface scale is multiplied by it to keep the relief's look constant through the zooms. */
export const Relief: React.FC<{
  id: string; x: number; y: number; w: number; h: number; px: number; depth: number; blur: number; gain?: number; sheen?: number; shadow?: string; light?: string;
  azimuth?: number; tex?: number; texFreq?: number; children: React.ReactNode;
}> = ({id, x, y, w, h, px, depth, blur, gain = 1, sheen = 0.35, shadow = '0.36 0.17 0.11', light = '1 0.95 0.9', azimuth = 225, tex = 0, texFreq = 0.55, children}) => {
  const el = 46, I0 = Math.sin((el * Math.PI) / 180);
  const ss = depth * px;
  const kS = 0.95 * gain, kH = 1.05 * gain;
  const [sr, sg, sb] = shadow.split(' ');
  const [lr, lg, lb] = light.split(' ');
  if (depth <= 0.001) return null;
  return (
    <g>
      <defs>
        <filter id={id} filterUnits="userSpaceOnUse" x={x} y={y} width={w} height={h} colorInterpolationFilters="sRGB">
          <feColorMatrix in="SourceGraphic" type="luminanceToAlpha" result="h0" />
          <feGaussianBlur in="h0" stdDeviation={blur} result={tex > 0 ? 'hs' : 'h'} />
          {tex > 0 && <feTurbulence type="fractalNoise" baseFrequency={texFreq} numOctaves={2} seed={7} result="n" />}
          {tex > 0 && <feColorMatrix in="n" type="matrix" values={`0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  ${tex} 0 0 0 0`} result="na" />}
          {tex > 0 && <feComposite in="hs" in2="na" operator="arithmetic" k1={0} k2={1} k3={1} k4={0.22 - tex * 0.5} result="h" />}
          <feDiffuseLighting in="h" surfaceScale={ss} diffuseConstant={1} lightingColor="#FFF" result="L">
            <feDistantLight azimuth={azimuth} elevation={el} />
          </feDiffuseLighting>
          <feColorMatrix in="L" type="matrix" values={`0 0 0 0 ${sr}  0 0 0 0 ${sg}  0 0 0 0 ${sb}  ${-kS} 0 0 0 ${kS * I0}`} result="sh" />
          <feColorMatrix in="L" type="matrix" values={`0 0 0 0 ${lr}  0 0 0 0 ${lg}  0 0 0 0 ${lb}  ${kH} 0 0 0 ${-kH * I0}`} result="hi" />
          <feSpecularLighting in="h" surfaceScale={ss} specularConstant={sheen} specularExponent={28} lightingColor="#FFF8F0" result="S">
            <feDistantLight azimuth={azimuth} elevation={el} />
          </feSpecularLighting>
          <feComponentTransfer in="S" result="S2">
            <feFuncA type="linear" slope={1.4} intercept={-0.12} />
          </feComponentTransfer>
          <feMerge result="m">
            <feMergeNode in="sh" />
            <feMergeNode in="hi" />
            <feMergeNode in="S2" />
          </feMerge>
          <feGaussianBlur in="m" stdDeviation={0.3} />
        </filter>
      </defs>
      <g filter={`url(#${id})`}>
        <rect x={x} y={y} width={w} height={h} fill="#000" />
        {children}
      </g>
    </g>
  );
};
