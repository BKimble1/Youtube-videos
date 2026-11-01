// What the chest cutaway shows, in the frog's body frame (mm; vent at the origin, snout at +x, y down). One layered
// cross-section: the body wall's muscle along the belly, the three-chambered heart in its pericardium, the large dark
// liver behind and below it (with the gall bladder), the lungs above, gut coils, the spine and the main vessels.
// Freezing: ice grows into the spaces around the organs (never as a cartoon block), the tissues pale and dull, the
// heart stops. The liver's sugar leaves as amber specks into the ventral abdominal vein running along the belly wall.
import React from 'react';
import {P, add, closed, dir, mul, open, pt} from '../core/geo';
import {mix, rgba} from '../core/color';
import {uid} from '../core/ids';
import {clamp, hash, lerp, ss} from '../lib';
import {HEART_B, LIVER_B, LUNG_B, MICRO_B} from './frog';

export type HeartState = {
  beat: number;   // 0 relaxed .. 1 ventricle fully contracted
  atria: number;  // 0..1 atrial contraction (leads the ventricle)
  frozen: number; // 0..1 tissue pallor and frost glaze
  twitch: number; // a small shiver of the wall (revival)
  kick?: number;  // 0..1 the powerful first pulse: the whole heart swells and snaps
};
export type AnatomyState = {
  heart: HeartState;
  ice: number;      // 0..1 ice in the spaces of the cavity
  iceFront: number; // body-frame x the ice has reached (it travels from the head end, where the camera is, back)
  frozen: number;   // 0..1 organs pale and dull
  breathe: number;  // lung inflation 0..1
  sugar: number;    // 0..1 the liver's release: its glow and the specks leaving it
  flow: number;     // seconds of flow (the specks' travel clock)
  melt: number;     // 0..1 the ice gone to water (spring)
  circ?: number;    // 0..1 circulation returning: vessels flush red
  pulses?: number[]; // the times of the heartbeats so far (each sends a red pulse out along the vessels)
  t: number;
};

// ---------------------------------------------------------------- the heart (its own frame: apex down, atria up)
const VENT = [[-2.9, -1.3], [-3.2, 0.5], [-2.5, 2.5], [-1.1, 4.0], [0.2, 4.6], [1.5, 3.8], [2.8, 2.0], [3.2, -0.2], [2.7, -1.6], [0.1, -2.1]].map(([x, y]) => pt(x, y));
const HEART_ROT = 12;
export const Heart: React.FC<{h: HeartState; size?: number}> = ({h, size = 1.18}) => {
  const id = {v: uid('hv'), a: uid('ha'), g: uid('hg')};
  const fz = clamp(h.frozen);
  const col = (c: string) => mix(c, '#8A7080', 0.62 * fz);
  const c = clamp(h.beat), ca = clamp(h.atria);
  const tw = h.twitch;
  // contraction: the ventricle squeezes toward its base, the apex rises; the atria squeeze before it
  const vt = `translate(0 -1.6) scale(${1 - 0.11 * c + 0.03 * tw} ${1 - 0.17 * c - 0.02 * tw}) translate(0 1.6)`;
  const at = (x: number, y: number) => `translate(${x} ${y}) scale(${1 - 0.16 * ca}) translate(${-x} ${-y})`;
  const fibres = [0, 1, 2, 3].map((k) => open([pt(-2.6 + k * 0.2, -0.8 + k * 1.1), pt(-0.8, 0.6 + k * 1.0), pt(1.2, -0.2 + k * 1.05), pt(2.7, -0.9 + k * 0.9)]));
  return (
    <g transform={`translate(${HEART_B.x} ${HEART_B.y}) rotate(${HEART_ROT}) scale(${size * (1 + 0.12 * (h.kick ?? 0))})`}>
      <defs>
        <radialGradient id={id.v} cx="0.36" cy="0.3" r="0.8">
          <stop offset={0} stopColor={col(mix('#E25B66', '#F48A8A', 0.35 * c))} />
          <stop offset={0.55} stopColor={col('#B1253A')} />
          <stop offset={1} stopColor={col('#6A0F22')} />
        </radialGradient>
        <radialGradient id={id.a} cx="0.4" cy="0.35" r="0.75">
          <stop offset={0} stopColor={col('#B44A72')} />
          <stop offset={1} stopColor={col('#5E1938')} />
        </radialGradient>
      </defs>
      {/* the vena cava / sinus venosus behind, from the body */}
      <path d={open([pt(-7.5, -1.4), pt(-5, -2.6), pt(-2.6, -3.1)])} stroke="#1E0A14" strokeWidth={2.3} fill="none" strokeLinecap="round" />
      <path d={open([pt(-7.5, -1.4), pt(-5, -2.6), pt(-2.6, -3.1)])} stroke={col('#6C3A7A')} strokeWidth={1.7} fill="none" strokeLinecap="round" />
      {/* the truncus arteriosus, out of the ventricle and up into two arches */}
      <path d={open([pt(1.7, -1.7), pt(3.0, -3.9), pt(2.4, -5.9), pt(0.6, -7.2)])} stroke="#1E0A14" strokeWidth={2.2} fill="none" strokeLinecap="round" />
      <path d={open([pt(1.7, -1.7), pt(3.0, -3.9), pt(2.4, -5.9), pt(0.6, -7.2)])} stroke={col('#D5636E')} strokeWidth={1.6} fill="none" strokeLinecap="round" />
      <path d={open([pt(2.4, -5.9), pt(4.4, -6.9), pt(6.0, -6.6)])} stroke="#1E0A14" strokeWidth={1.7} fill="none" strokeLinecap="round" />
      <path d={open([pt(2.4, -5.9), pt(4.4, -6.9), pt(6.0, -6.6)])} stroke={col('#D5636E')} strokeWidth={1.15} fill="none" strokeLinecap="round" />
      {/* atria */}
      <g transform={at(-1.5, -2.9)}>
        <ellipse cx={-1.5} cy={-2.9} rx={2.05} ry={1.7} fill={`url(#${id.a})`} stroke="#1E0A14" strokeWidth={0.22} />
      </g>
      <g transform={at(1.2, -3.2)}>
        <ellipse cx={1.2} cy={-3.2} rx={1.85} ry={1.55} fill={`url(#${id.a})`} stroke="#1E0A14" strokeWidth={0.22} />
      </g>
      {/* ventricle */}
      <g transform={vt}>
        <path d={closed(VENT, 0.85)} fill={`url(#${id.v})`} stroke="#1E0A14" strokeWidth={0.26} />
        {fibres.map((d, i) => <path key={i} d={d} stroke={col('#7E1428')} strokeWidth={0.13} fill="none" opacity={0.55} />)}
        <path d={open([pt(-0.2, -1.8), pt(-0.6, 0.8), pt(-0.2, 3.2)])} stroke={col('#F0C060')} strokeWidth={0.22} fill="none" opacity={0.45} />
        <ellipse cx={-1.2} cy={-0.4} rx={1.0} ry={0.55} fill="#FFFFFF" opacity={0.28 * (1 - 0.5 * fz)} transform="rotate(-30 -1.2 -0.4)" />
      </g>
      {/* frost glaze over the frozen heart */}
      {fz > 0.02 && (
        <g opacity={fz}>
          <path d={closed(VENT, 0.85)} fill="#DCEBF6" opacity={0.28} transform={vt} />
          {Array.from({length: 60}, (_, i) => {
            const p = pt(-2.8 + hash(i * 3.1) * 5.8, -4.6 + hash(i * 1.7) * 9);
            return <circle key={i} cx={p.x} cy={p.y} r={0.05 + 0.08 * hash(i * 5.5)} fill="#F4FBFF" opacity={0.8} />;
          })}
          <path d={open([pt(-2.6, -1.2), pt(-2.9, 0.6), pt(-2.2, 2.4)])} stroke="#F4FBFF" strokeWidth={0.18} fill="none" opacity={0.7} transform={vt} />
        </g>
      )}
    </g>
  );
};

// ---------------------------------------------------------------- ice shards (in the cavity's spaces)
type Shard = {p: P; a: number; L: number; w: number; th: number};
/** ice crystals: long hexagonal prisms and plates growing from nucleation sites; th orders their appearance */
const mkShards = (n: number, seed: number, box: [number, number, number, number], avoid: (p: P) => boolean, front = true): Shard[] => {
  const out: Shard[] = [];
  for (let i = 0; out.length < n && i < n * 8; i++) {
    const p = pt(box[0] + hash(i * 3.3 + seed) * (box[2] - box[0]), box[1] + hash(i * 5.7 + seed) * (box[3] - box[1]));
    if (avoid(p)) continue;
    out.push({p, a: hash(i * 2.1 + seed) * Math.PI * 2, L: 0.6 + hash(i * 7.9 + seed) ** 1.5 * 2.6, w: 0.22 + hash(i * 4.4 + seed) * 0.35, th: front ? hash(i * 9.1 + seed) : 0});
  }
  return out;
};
export const IceShard: React.FC<{s: Shard; g: number; melt?: number}> = ({s, g, melt = 0}) => {
  if (g <= 0.01) return null;
  const L = s.L * g * (1 - 0.7 * melt), w = s.w * Math.min(1, g * 1.4) * (1 - 0.5 * melt);
  const d = dir(s.a), n = pt(-d.y, d.x);
  const A = add(s.p, mul(d, -L * 0.15)), B = add(s.p, mul(d, L));
  const tipA = add(A, mul(d, -w * 0.9)), tipB = add(B, mul(d, w * 0.9));
  const poly = [tipA, add(A, mul(n, w)), add(B, mul(n, w)), tipB, add(B, mul(n, -w)), add(A, mul(n, -w))];
  const dd = 'M' + poly.map((q) => `${q.x.toFixed(3)} ${q.y.toFixed(3)}`).join('L') + 'Z';
  return (
    <g opacity={Math.min(1, g * 2) * (1 - melt)}>
      <path d={dd} fill="rgba(206,238,255,0.55)" stroke="#F4FCFF" strokeWidth={Math.max(0.05, w * 0.22)} strokeLinejoin="miter" />
      <path d={`M${add(A, mul(n, w * 0.25)).x} ${add(A, mul(n, w * 0.25)).y}L${add(B, mul(n, w * 0.25)).x} ${add(B, mul(n, w * 0.25)).y}`} stroke="#FFFFFF" strokeWidth={w * 0.25} opacity={0.8} />
    </g>
  );
};

// ---------------------------------------------------------------- ice fill: faceted crystal plates in the spaces
type Facet = {pts: P[]; c: P; a: number; th: number};
const mkFacets = (box: [number, number, number, number], step: number, seed: number): Facet[] => {
  const nx = Math.ceil((box[2] - box[0]) / step), ny = Math.ceil((box[3] - box[1]) / step);
  const g: P[][] = [];
  for (let j = 0; j <= ny; j++) {
    g.push([]);
    for (let i = 0; i <= nx; i++) {
      const jx = (hash(i * 13.1 + j * 7.7 + seed) - 0.5) * step * 0.7, jy = (hash(i * 3.9 + j * 11.3 + seed) - 0.5) * step * 0.7;
      g[j].push(pt(box[0] + i * step + (i > 0 && i < nx ? jx : 0), box[1] + j * step + (j > 0 && j < ny ? jy : 0)));
    }
  }
  const out: Facet[] = [];
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
    const q = [g[j][i], g[j][i + 1], g[j + 1][i + 1], g[j + 1][i]];
    const tris = hash(i + j * 31 + seed) > 0.5 ? [[q[0], q[1], q[2]], [q[0], q[2], q[3]]] : [[q[0], q[1], q[3]], [q[1], q[2], q[3]]];
    for (const t of tris) {
      const c = pt((t[0].x + t[1].x + t[2].x) / 3, (t[0].y + t[1].y + t[2].y) / 3);
      out.push({pts: t, c, a: hash(c.x * 7.3 + c.y * 3.1 + seed), th: hash(c.x * 1.3 + c.y * 9.7 + seed)});
    }
  }
  return out;
};
export const IceFill: React.FC<{facets: Facet[]; g: (f: Facet) => number; tint?: string}> = ({facets, g, tint = '#CDEBFA'}) => (
  <g>
    {facets.map((f, i) => {
      const k = g(f);
      if (k <= 0.01) return null;
      // each plate grows from its centre
      const pts = f.pts.map((q) => add(f.c, mul(pt(q.x - f.c.x, q.y - f.c.y), 0.35 + 0.65 * k)));
      const d = 'M' + pts.map((q) => `${q.x.toFixed(3)} ${q.y.toFixed(3)}`).join('L') + 'Z';
      return <path key={i} d={d} fill={mix(tint, '#FFFFFF', f.a * 0.5)} fillOpacity={(0.5 + 0.38 * f.a) * k} stroke="#F6FCFF" strokeOpacity={0.9 * k} strokeWidth={0.09} strokeLinejoin="round" />;
    })}
  </g>
);
const CAVITY_ICE = mkFacets([-4, -13, 36, 9], 1.5, 5);
const PERI_ICE = mkFacets([HEART_B.x - 7, HEART_B.y - 8, HEART_B.x + 7, HEART_B.y + 8], 0.95, 9);

// ---------------------------------------------------------------- organs
const LIVER_MAIN = [[12.5, 1.8], [14.5, -0.6], [18.5, -1.6], [23, -1.2], [25.6, 0.6], [25.8, 3.0], [24.4, 5.2], [20.5, 6.0], [16.5, 5.8], [13.5, 4.4]].map(([x, y]) => pt(x, y));
const LIVER_LOBE = [[20.5, 4.2], [24, 3.6], [28.4, 4.6], [30.2, 6.0], [28.4, 7.0], [23.5, 7.0], [20.8, 6.2]].map(([x, y]) => pt(x, y));
const LUNG = [[14.5, -6.8], [17, -9.4], [22, -10.2], [27.5, -9.6], [30.4, -7.8], [29.4, -5.6], [25.5, -4.6], [20, -4.4], [16, -5]].map(([x, y]) => pt(x, y));
const SPINE_Y = -11.8;
/** the ventral abdominal vein along the belly wall: out of the liver, back past the camera's entry point */
export const VEIN: P[] = [pt(14.6, 0.6), pt(12.6, -1.6), pt(10.6, -4.2), pt(8.7, -6.7), pt(MICRO_B.x, MICRO_B.y), pt(4.6, -9.0), pt(1.5, -8.2)];
const GUT: P[][] = [
  [pt(12.5, -3.6), pt(9.5, -4.4), pt(6.5, -3.6), pt(5.4, -1.8), pt(7.2, -0.6), pt(10.2, -0.9), pt(11.6, 0.8), pt(9.6, 2.6), pt(6.2, 2.9), pt(3.4, 1.9)],
  [pt(3.4, 1.9), pt(1.4, 0.2), pt(1.2, -2.4), pt(2.6, -4.6)],
];
const inEllipse = (p: P, c: P, rx: number, ry: number) => ((p.x - c.x) / rx) ** 2 + ((p.y - c.y) / ry) ** 2 < 1;
const SHARDS = mkShards(70, 11, [-1, -11, 34, 7.5], (p) => inEllipse(p, HEART_B, 4.2, 5.4) || inEllipse(p, pt(20.5, 3.0), 9.0, 4.8) || inEllipse(p, pt(22.5, -7.2), 7.4, 2.6));
const PERI = mkShards(26, 3, [HEART_B.x - 6.5, HEART_B.y - 7.5, HEART_B.x + 6.5, HEART_B.y + 7.5], (p) => inEllipse(p, HEART_B, 4.0, 5.2) || !inEllipse(p, HEART_B, 6.4, 7.4));

const tubeStroke = (pts: P[], w: number, c: string, ink = '#1E0A14', key?: string | number) => (
  <g key={key}>
    <path d={open(pts)} stroke={ink} strokeWidth={w + 0.45} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    <path d={open(pts)} stroke={c} strokeWidth={w} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    <path d={open(pts)} stroke="#FFFFFF" strokeWidth={w * 0.22} fill="none" strokeLinecap="round" opacity={0.25} transform={`translate(${-w * 0.18} ${-w * 0.22})`} />
  </g>
);
/** the main arteries out of the heart (body frame): the aorta back under the spine to the hind leg, the carotid
 * forward to the head, a branch down into the liver and gut */
export const ARTERIES: P[][] = [
  [pt(29.8, -5.6), pt(27.5, -8.6), pt(22, -10), pt(12, -9.9), pt(4, -9.2), pt(1.2, -6.5), pt(0.6, -2.5)],
  [pt(29.8, -5.6), pt(33, -7.4), pt(37.5, -6.8), pt(42, -5.2)],
  [pt(22, -10), pt(20.2, -6), pt(18.6, -2.2), pt(16.5, 0.6)],
  [pt(12, -9.9), pt(10.5, -5.5), pt(8.4, -2.4)],
];
const polyLen = (pts: P[]) => pts.slice(1).reduce((acc, q, i) => acc + Math.hypot(q.x - pts[i].x, q.y - pts[i].y), 0);
const subPath = (pts: P[], u0: number, u1: number) => {
  const n = 10;
  return open(Array.from({length: n + 1}, (_, k) => along(pts, lerp(clamp(u0), clamp(u1), k / n))));
};
/** a point along a polyline at fraction u (by length) */
export const along = (pts: P[], u: number): P => {
  const L: number[] = [0];
  for (let i = 1; i < pts.length; i++) L.push(L[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y));
  const s = clamp(u) * L[L.length - 1];
  for (let i = 1; i < pts.length; i++) {
    if (s <= L[i]) {
      const k = (s - L[i - 1]) / (L[i] - L[i - 1] || 1);
      return pt(lerp(pts[i - 1].x, pts[i].x, k), lerp(pts[i - 1].y, pts[i].y, k));
    }
  }
  return pts[pts.length - 1];
};
/** a small glucose ring (pyranose hexagon), amber, ink-edged */
export const Glucose: React.FC<{p: P; r: number; a?: number; op?: number}> = ({p, r, a = 0, op = 1}) => {
  const pts = Array.from({length: 6}, (_, k) => add(p, mul(dir(a + (k * Math.PI) / 3), r)));
  const d = 'M' + pts.map((q) => `${q.x.toFixed(3)} ${q.y.toFixed(3)}`).join('L') + 'Z';
  return (
    <g opacity={op}>
      <circle cx={p.x} cy={p.y} r={r * 2.6} fill="#FFC24A" opacity={0.14} />
      <circle cx={p.x} cy={p.y} r={r * 1.7} fill="#FFD27A" opacity={0.26} />
      <path d={d} fill="rgba(255,214,110,0.55)" stroke="#2A1606" strokeWidth={r * 0.62} strokeLinejoin="round" />
      <path d={d} fill="none" stroke="#FFC24A" strokeWidth={r * 0.34} strokeLinejoin="round" />
      <circle cx={pts[0].x} cy={pts[0].y} r={r * 0.2} fill="#FFE7A8" />
    </g>
  );
};

export const Anatomy: React.FC<{a: AnatomyState; detail?: number}> = ({a}) => {
  const id = {peri: uid('ap'), liv: uid('al'), lung: uid('ag'), wall: uid('aw'), glow: uid('ao'), blur: uid('ab')};
  const fz = clamp(a.frozen);
  const col = (c: string) => mix(c, '#8E8592', 0.5 * fz);
  const colL = (c: string) => mix(c, '#8E8592', 0.5 * fz * (1 - 0.85 * clamp(a.sugar)));
  const ice = clamp(a.ice) * (1 - clamp(a.melt));
  const shardG = (s: Shard) => clamp((ice - s.th * 0.55) / 0.45) * ss(s.p.x - a.iceFront, -3, 2.5);
  const sug = clamp(a.sugar);
  const lungK = 1 + 0.07 * a.breathe;
  // specks of sugar travelling out of the liver along the vein (and into the body generally)
  const specks: React.ReactNode[] = [];
  if (sug > 0.01) {
    for (let i = 0; i < 26; i++) {
      const u = ((a.flow * 0.42 + i / 26) % 1);
      const born = clamp((sug * 1.35 - i / 26) * 3);
      if (born <= 0) continue;
      const p = add(along(VEIN, u), pt(0.35 * Math.sin(i * 2.7), 0.25 * Math.cos(i * 1.9)));
      specks.push(<Glucose key={`v${i}`} p={p} r={0.5} a={i} op={born * clamp(u * 8) * clamp((1 - u) * 6)} />);
    }
    // specks leaving the liver's surface into the surrounding vessels
    for (let i = 0; i < 44; i++) {
      const st = LIVER_MAIN[i % LIVER_MAIN.length];
      const ph = (a.flow * 0.6 + hash(i * 3.1)) % 1;
      const born = clamp((sug * 1.4 - hash(i * 1.7)) * 3);
      if (born <= 0) continue;
      const out = add(st, mul(dir(hash(i * 4.4) * Math.PI * 2), 0.6 + 2.6 * ph));
      specks.push(<Glucose key={`l${i}`} p={out} r={0.55} a={i} op={born * Math.sin(Math.PI * ph)} />);
    }
  }
  return (
    <g>
      <defs>
        <linearGradient id={id.liv} x1="0.2" y1="0" x2="0.5" y2="1">
          <stop offset={0} stopColor={colL(mix('#A84A3C', '#F2A24E', 0.8 * sug))} />
          <stop offset={0.6} stopColor={colL(mix('#7A2A22', '#B8602E', 0.65 * sug))} />
          <stop offset={1} stopColor={colL('#45140F')} />
        </linearGradient>
        <linearGradient id={id.lung} x1="0" y1="0" x2="0" y2="1">
          <stop offset={0} stopColor={col('#F1B9BA')} />
          <stop offset={1} stopColor={col('#C77A82')} />
        </linearGradient>
        <linearGradient id={id.wall} x1="0" y1="0" x2="0" y2="1">
          <stop offset={0} stopColor={col('#9A2E34')} />
          <stop offset={1} stopColor={col('#C2484A')} />
        </linearGradient>
        <radialGradient id={id.glow} cx="0.5" cy="0.5" r="0.5">
          <stop offset={0} stopColor="#FFC24A" stopOpacity={0.5} />
          <stop offset={1} stopColor="#FFC24A" stopOpacity={0} />
        </radialGradient>
        <filter id={id.blur} x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation={0.35} /></filter>
      </defs>
      {/* the cavity's lining and the spine along the top */}
      <rect x={-6} y={-16} width={44} height={26} fill={col('#4A121C')} />
      <path d={closed([pt(-3, -13), pt(34, -13), pt(34, -10.6), pt(-3, -10.6)], 0.2)} fill={col('#5E1D24')} />
      {Array.from({length: 13}, (_, i) => (
        <rect key={i} x={0.5 + i * 2.5} y={SPINE_Y - 1.1} width={2.05} height={2.2} rx={0.6} fill={col('#E8D9BC')} stroke="#2A1608" strokeWidth={0.16} />
      ))}
      {/* dorsal aorta under the spine */}
      {tubeStroke([pt(31, -8.4), pt(26, -10.2), pt(16, -10.0), pt(6, -9.6), pt(1.5, -7.5)], 0.75, col('#C8404E'))}
      {/* ice through the cavity's spaces (the organs sit over it) */}
      {ice > 0.01 && <IceFill facets={CAVITY_ICE} g={(f) => clamp((ice * 1.25 - f.th * 0.6) / 0.4) * ss(f.c.x - a.iceFront, -3, 2.5)} />}
      {/* the back muscle under the spine (where the camera goes into the tissue) */}
      <path d={closed([pt(-3, -10.7), pt(15.5, -10.7), pt(14, -8.4), pt(9, -7.4), pt(2, -7.2), pt(-3, -7.6)], 0.5)} fill={col('#A8343C')} stroke="#3A0F18" strokeWidth={0.16} />
      {Array.from({length: 11}, (_, i) => (
        <path key={i} d={`M${-2 + i * 1.6} -10.5l0.7 2.9`} stroke={col('#7A1E26')} strokeWidth={0.11} opacity={0.6} />
      ))}
      {/* the body wall along the belly: striated muscle */}
      <path d={closed([pt(-3, 4.2), pt(10, 4.9), pt(22, 5.6), pt(34, 4.6), pt(34, 10), pt(-3, 10)], 0.4)} fill={`url(#${id.wall})`} />
      {Array.from({length: 22}, (_, i) => (
        <path key={i} d={`M${-2 + i * 1.7} ${5.2 + 0.03 * i}l0.9 4`} stroke={col('#7A1E26')} strokeWidth={0.12} opacity={0.6} />
      ))}
      {/* lungs: spongy sacs (alveolar pockets) */}
      <g transform={`translate(${LUNG_B.x} ${LUNG_B.y}) scale(${lungK}) translate(${-LUNG_B.x} ${-LUNG_B.y})`}>
        <path d={closed(LUNG, 0.8)} fill={`url(#${id.lung})`} stroke="#3A0F18" strokeWidth={0.22} />
        {Array.from({length: 34}, (_, i) => {
          const p = pt(16.5 + hash(i * 2.3) * 12.5, -9.2 + hash(i * 6.1) * 4.3);
          return <circle key={i} cx={p.x} cy={p.y} r={0.35 + hash(i) * 0.4} fill="none" stroke={col('#B0646C')} strokeWidth={0.1} opacity={0.7} />;
        })}
      </g>
      {/* gut coils */}
      {GUT.map((g, i) => tubeStroke(g, 2.1 - 0.3 * i, col(i ? '#D8A48C' : '#E2B39A'), '#3A1A12', `g${i}`))}
      {ice > 0.01 && <g opacity={0.8}>{SHARDS.map((s, i) => <IceShard key={i} s={s} g={shardG(s) * 0.8} melt={0} />)}</g>}
      {/* liver: big dark lobes, a sheen, the gall bladder */}
      <path d={closed(LIVER_LOBE, 0.8)} fill={`url(#${id.liv})`} stroke="#22080A" strokeWidth={0.24} />
      <path d={closed(LIVER_MAIN, 0.8)} fill={`url(#${id.liv})`} stroke="#22080A" strokeWidth={0.24} />
      <path d={open([pt(15, 0.2), pt(18.5, -0.8), pt(22.5, -0.4)])} stroke="#FFFFFF" strokeWidth={0.5} fill="none" opacity={0.18 * (1 - fz * 0.6)} filter={`url(#${id.blur})`} />
      <ellipse cx={16.8} cy={4.6} rx={0.95} ry={0.75} fill={col('#5E8A3C')} stroke="#1E2A0E" strokeWidth={0.14} />
      {sug > 0.01 && <ellipse cx={19.5} cy={2.6} rx={8.5 + 1.5 * sug} ry={4.8 + sug} fill={`url(#${id.glow})`} opacity={sug * (0.85 + 0.15 * Math.sin(a.t * 7))} />}
      {/* the heart in its pericardium */}
      <ellipse cx={HEART_B.x} cy={HEART_B.y - 0.6} rx={5.0} ry={6.3} fill={col('#5A1A26')} stroke={rgba('#E8B8C0', 0.35)} strokeWidth={0.2} transform={`rotate(${HEART_ROT} ${HEART_B.x} ${HEART_B.y})`} />
      <clipPath id={id.peri}><ellipse cx={HEART_B.x} cy={HEART_B.y - 0.6} rx={5.0} ry={6.3} transform={`rotate(${HEART_ROT} ${HEART_B.x} ${HEART_B.y})`} /></clipPath>
      {ice > 0.01 && <g clipPath={`url(#${id.peri})`}><IceFill facets={PERI_ICE} g={(f) => clamp((ice * 1.4 - f.th * 0.5) / 0.4)} tint="#BFE4F7" /></g>}
      <Heart h={a.heart} />
      {/* the vein along the belly wall (its blood dark; amber specks ride it) */}
      {tubeStroke(VEIN, 0.95, col(mix('#5B3A78', '#B07A3A', 0.35 * sug)))}
      {tubeStroke([pt(16.2, 5.4), pt(15.6, 3.4)], 0.8, col('#5B3A78'))}
      {/* circulation returning: the arteries flush red; each beat sends a bright pulse out along every vessel */}
      {(a.circ ?? 0) > 0.01 && (
        <g>
          {ARTERIES.map((v, i) => tubeStroke(v, 0.8 - 0.12 * Math.min(i, 2), mix('#6E3A44', '#E0303E', a.circ ?? 0), '#1E0A14', `ar${i}`))}
          {(a.pulses ?? []).flatMap((b, k) => {
            const dt = a.t - b;
            if (dt < 0 || dt > 0.9) return [];
            return [...ARTERIES, VEIN].map((v, i) => {
              const u = dt * (34 / polyLen(v)) * (i === 4 ? 0.6 : 1);
              if (u > 1.15) return null;
              return <path key={`pu${k}_${i}`} d={subPath(v, u - 0.22, u)} stroke="#FF6A5A" strokeWidth={1.25} strokeLinecap="round" fill="none" opacity={0.9 * (1 - dt / 0.9)} />;
            });
          })}
        </g>
      )}
      {specks}
      {/* ice in the spaces: around the organs and in the pericardial space */}
      {ice > 0.01 && <g clipPath={`url(#${id.peri})`}>{PERI.map((s, i) => <IceShard key={`p${i}`} s={s} g={clamp((ice - s.th * 0.4) / 0.5)} />)}</g>}
      {/* where the camera enters the tissue (a hint of the cells to come) */}
      
    </g>
  );
};
