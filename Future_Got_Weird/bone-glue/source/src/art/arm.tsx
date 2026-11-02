// The patient's RIGHT forearm and hand, palm up, hand pointing up the frame (the Weird Crew guesser's skin), in the
// world millimetres of anatomy.ts: the skin (one ink silhouette, cel shading from the upper-left key light, creases,
// eminences, pads), the surgical incision (open, closing, sutured, scarred), the soft anatomical cutaway window, the
// cut rim of the opening with two small rake retractors, and the deep tissue bed drawn under the bones.
//
// The silhouette is ONE closed outline (forearm, hypothenar edge, the four fingers with their webs, the first web, the
// thumb and the thenar eminence), built from fingerChain / thumbChain so the skin always agrees with the skeleton.
// Every ink line is in screen pixels (vector-effect: non-scaling-stroke): the line weight is the same from the 30 mm
// close-up to the 470 mm clinical view. Surfaces that have a physical size (bands, pads, highlights) are in mm.
import React from 'react';
import {P, pt, add, sub, mul, nrm, perp, len, lerpP, closed, open, poly} from '../core/geo';
import {mix, rgba} from '../core/color';
import {clamp, hash, noise1, ss} from '../lib';
import {C, INK} from './palette';
import {Digit, FINGERS, INCISION, THUMB, WRIST_CREASE_Y, fingerChain, skinBorders, thumbChain} from './anatomy';

export type ArmState = {curl: number; thumb: number; incision: number; sutures: number; scar: number; window: {c: P; r: number; soft: number} | null; spread?: number};
type Win = {c: P; r: number; soft: number};

const NS = 'non-scaling-stroke' as const;
const LIGHT = nrm(pt(-0.62, -0.78));
const ARM_END = 700;
/** ink widths in screen pixels */
export const SKIN_INK = 3.2;
const SEP_INK = 2.1;
const CREASE_PX = 1.6;
const PALM = mix(C.skin, '#F4BDA9', 0.32);

// ---------------------------------------------------------------- small geometry helpers
const segHit = (p: P, p2: P, q: P, q2: P): {t: number; u: number} | null => {
  const r = sub(p2, p), s = sub(q2, q);
  const den = r.x * s.y - r.y * s.x;
  if (Math.abs(den) < 1e-12) return null;
  const qp = sub(q, p);
  const t = (qp.x * s.y - qp.y * s.x) / den, u = (qp.x * r.y - qp.y * r.x) / den;
  return t >= 0 && t <= 1 && u >= 0 && u <= 1 ? {t, u} : null;
};
const chaikin = (ps: P[], iters: number): P[] => {
  let cur = ps;
  for (let k = 0; k < iters; k++) {
    const out: P[] = [];
    const n = cur.length;
    for (let i = 0; i < n; i++) {
      const a = cur[i], b = cur[(i + 1) % n];
      out.push(lerpP(a, b, 0.25), lerpP(a, b, 0.75));
    }
    cur = out;
  }
  return cur;
};
const quad = (a: P, q: P, b: P, n: number): P[] => {
  const out: P[] = [];
  for (let k = 1; k < n; k++) {
    const t = k / n;
    out.push(add(add(mul(a, (1 - t) * (1 - t)), mul(q, 2 * t * (1 - t))), mul(b, t * t)));
  }
  return out;
};
const deg = (v: P) => (Math.atan2(v.y, v.x) * 180) / Math.PI;
const Lx = (y: number) => skinBorders(Math.min(y, 224))[0];
const Rx = (y: number) => skinBorders(Math.min(y, 224))[1];

// ---------------------------------------------------------------- the digits' skin
type Fg = {u: P; nL: P; c0: P; s: number[]; w: number; hw: (x: number) => number; at: (x: number, side: number) => P};
/** a digit's skin tube along its (colinear) joint chain: half-widths keyed at the joints, a soft pad on each phalanx */
const mkFg = (chain: P[], w: number, base: number, keysK: number[]): Fg => {
  const c0 = chain[0];
  const u = nrm(sub(chain[chain.length - 1], c0));
  const nL = pt(u.y, -u.x); // screen-left of a digit pointing up
  const s = chain.map((p) => len(sub(p, c0)));
  const keys: [number, number][] = [[-40, base * w * 1.1], [0, base * w]];
  s.slice(1).forEach((x, i) => keys.push([Math.max(x, keys[keys.length - 1][0] + 0.01), keysK[i] * w]));
  const hw = (x: number) => {
    let v = keys[keys.length - 1][1];
    if (x <= keys[0][0]) v = keys[0][1];
    for (let i = 0; i < keys.length - 1; i++) {
      const [x0, a] = keys[i], [x1, b] = keys[i + 1];
      if (x >= x0 && x <= x1) {
        const t = (x - x0) / (x1 - x0);
        v = a + (b - a) * t;
        break;
      }
    }
    for (let k = 0; k < s.length - 1; k++) {
      const a = s[k], b = s[k + 1];
      if (x > a && x < b && b - a > 0.5) v += 0.045 * w * Math.sin((Math.PI * (x - a)) / (b - a));
    }
    return v;
  };
  const at = (x: number, side: number) => add(add(c0, mul(u, x)), mul(nL, side * hw(x)));
  return {u, nL, c0, s, w, hw, at};
};
const sideLine = (f: Fg, side: number, s0: number, s1: number, step = 1.0): P[] => {
  const n = Math.max(1, Math.ceil(Math.abs(s1 - s0) / step));
  const out: P[] = [];
  for (let k = 0; k <= n; k++) out.push(f.at(s0 + ((s1 - s0) * k) / n, side));
  return out;
};
/** the rounded fingertip from the left side over the tip to the right side */
const capPts = (f: Fg): P[] => {
  const sT = f.s[f.s.length - 1];
  const r = f.hw(sT);
  const c = f.at(sT, 0);
  const out: P[] = [];
  for (let k = 1; k < 14; k++) {
    const a = (k / 14) * Math.PI;
    out.push(add(add(c, mul(f.nL, r * Math.cos(a))), mul(f.u, r * 0.94 * Math.sin(a))));
  }
  return out;
};
type Crotch = {sa: number; sb: number; mid: P[]; touching: boolean; p: P};
/** where two neighbouring fingers part (A on the left of B): the crossing of their sides, or a rounded web */
const crotchOf = (A: Fg, B: Fg, wA: number, wB: number): Crotch => {
  const st = 0.5;
  const ra = sideLine(A, -1, 0, A.s[3], st), lb = sideLine(B, 1, 0, B.s[3], st);
  for (let i = ra.length - 2; i >= 0; i--) {
    for (let j = 0; j < lb.length - 1; j++) {
      const h = segHit(ra[i], ra[i + 1], lb[j], lb[j + 1]);
      if (h) {
        const sa = ((i + h.t) / (ra.length - 1)) * A.s[3], sb = ((j + h.u) / (lb.length - 1)) * B.s[3];
        if (sa > 2.5 && sb > 2.5) {
          const p = lerpP(ra[i], ra[i + 1], h.t);
          return {sa, sb, mid: [p], touching: true, p};
        }
      }
    }
  }
  const pa = A.at(wA, -1), pb = B.at(wB, 1);
  const down = nrm(mul(add(A.u, B.u), -0.5));
  const lowY = Math.max(pa.y, pb.y);
  const m = lerpP(pa, pb, 0.5);
  const bottom = add(pt(m.x, lowY), mul(down, 1.4));
  return {sa: wA, sb: wB, mid: [lerpP(pa, bottom, 0.6), bottom, lerpP(pb, bottom, 0.6)], touching: false, p: bottom};
};

// ---------------------------------------------------------------- the whole silhouette (cached per pose)
export type ArmGeo = {outline: P[]; fingers: Fg[]; thumb: Fg; crotch: Crotch[]; webIdx: number; sIdx: number; sThumb: number};
const cache = new Map<string, ArmGeo>();
const S_INDEX_WEB = 9.5, S_THUMB_WEB = 7;
export const armGeo = (curl: number, thumb: number, spread = 0): ArmGeo => {
  const key = `${curl.toFixed(4)}_${thumb.toFixed(4)}_${spread.toFixed(4)}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const fingers = FINGERS.map((d: Digit) => mkFg(fingerChain(d, curl, spread), d.w, 1.08, [0.93, 0.86, 0.8]));
  const th = mkFg(thumbChain(thumb, spread), THUMB.w, 1.16, [1.02, 0.95]);
  const [I, M, R, Li] = fingers;
  const crotch = [crotchOf(Li, R, 13, 5), crotchOf(R, M, 12, 12), crotchOf(M, I, 12, 12)];
  const out: P[] = [];
  // the ulnar border of the forearm (bottom -> wrist) and the hypothenar edge of the palm
  const ysL = [ARM_END, 600, 500, 400, 330, 270, 224, 190, 150, 110, 80, 50, 25, 5, -10, -20, -28, -33, -36, -40, -46, -54, -62, -70, -78, -86, -94, -100, -105];
  for (const y of ysL) out.push(pt(Lx(y), y));
  const l0 = Li.at(1, 1);
  out.push(pt(-42.8, -111.5), pt((l0.x - 42.0) / 2 + 0.6, (l0.y - 117) / 2));
  // little finger
  out.push(...sideLine(Li, 1, 1, Li.s[3]), ...capPts(Li), ...sideLine(Li, -1, Li.s[3], crotch[0].sa), ...crotch[0].mid);
  // ring, middle
  out.push(...sideLine(R, 1, crotch[0].sb, R.s[3]), ...capPts(R), ...sideLine(R, -1, R.s[3], crotch[1].sa), ...crotch[1].mid);
  out.push(...sideLine(M, 1, crotch[1].sb, M.s[3]), ...capPts(M), ...sideLine(M, -1, M.s[3], crotch[2].sa), ...crotch[2].mid);
  // index, down its radial side into the first web
  out.push(...sideLine(I, 1, crotch[2].sb, I.s[3]), ...capPts(I), ...sideLine(I, -1, I.s[3], S_INDEX_WEB));
  const webA = I.at(S_INDEX_WEB, -1), webB = th.at(S_THUMB_WEB, 1);
  const webIdx = out.length;
  out.push(...quad(webA, pt(25.0, -124.5), webB, 9));
  // thumb, out its ulnar side, round the tip, back down its radial side
  out.push(...sideLine(th, 1, S_THUMB_WEB, th.s[2]), ...capPts(th), ...sideLine(th, -1, th.s[2], -6));
  // the thenar eminence down to the wrist, then the radial border of the forearm
  const a1 = nrm(sub(THUMB.head, THUMB.base)), n1 = perp(a1);
  const L1 = len(sub(THUMB.head, THUMB.base));
  const sIdx = out.length;
  for (const [t, off] of [[0.72, 9.9], [0.5, 10.0], [0.3, 9.6], [0.1, 8.8]] as [number, number][]) out.push(add(add(THUMB.base, mul(a1, t * L1)), mul(n1, off)));
  out.push(pt(26.6, -57.5), pt(24.2, -49.5), pt(22.5, -42.5));
  const ysR = [-36, -33, -28, -20, -10, 5, 25, 50, 80, 110, 150, 190, 224, 270, 330, 400, 500, 600, ARM_END];
  for (const y of ysR) out.push(pt(Rx(y), y));
  const outline = chaikin(out, 2);
  const g: ArmGeo = {outline, fingers, thumb: th, crotch, webIdx, sIdx, sThumb: S_THUMB_WEB};
  if (cache.size > 64) cache.clear();
  cache.set(key, g);
  return g;
};

/** the closed silhouette of forearm + hand + fingers (world mm) — the film clips the inside layer to it */
export const armOutlinePath = (s: ArmState): string => poly(armGeo(s.curl, s.thumb, s.spread ?? 0).outline);

// ---------------------------------------------------------------- the incision opening
/** the opening's half-width for an incision state (0 closed .. 1 fully retracted) */
const holeA = (e: number) => INCISION.rx * clamp(e);
/** the opening at half-width a: an ellipse with slightly pinched poles (the lips meet at the incision's ends) */
const holePts = (a: number, inset = 0, n = 96): P[] => {
  const {c, ry} = INCISION;
  const out: P[] = [];
  for (let i = 0; i < n; i++) {
    const t = (i / n) * Math.PI * 2;
    const ct = Math.cos(t), st = Math.sin(t);
    // pointed commissures at the incision's ends, the lips pulled out a little where the rakes grip
    const pinch = (1 - 0.3 * Math.abs(st) ** 3) * (1 + 0.07 * Math.exp(-(((st + 0.04 * Math.sign(ct)) / 0.32) ** 2)));
    const ax = Math.max(0, a * pinch - inset * (0.55 + 0.45 * Math.abs(ct)) * clamp(a / 5));
    const by = Math.max(0, ry - inset * 0.5 * clamp(a / 5));
    out.push(pt(c.x + ax * ct, c.y + by * st));
  }
  return out;
};

// ---------------------------------------------------------------- the cutaway window (a feathered, organic mask)
const winPts = (w: Win, k: number, n = 72): P[] => {
  const out: P[] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const q = 0.5 * Math.sin(3 * a + 1.3) + 0.28 * Math.sin(5 * a + 0.4) + 0.16 * Math.sin(8 * a + 2.2) + 0.08 * Math.sin(13 * a + 0.7);
    const rr = w.r * k * (1 + 0.07 * q);
    out.push(pt(w.c.x + rr * Math.cos(a), w.c.y + rr * Math.sin(a)));
  }
  return out;
};
/** the band of skin kept along the arm's outline inside a cutaway window (mm): the arm keeps its edge */
const EDGE_BAND = 2.4;
/** <mask id={`${id}-wm`}>: white everywhere, black (feathered) inside the window */
const WindowDefs: React.FC<{id: string; w: Win; ghost?: number; edge?: string}> = ({id, w, ghost = 0, edge}) => {
  const sd = Math.max(0.02, (w.soft * w.r) / 4.4);
  const R = w.r * 1.6;
  return (
    <>
      <filter id={`${id}-wf`} filterUnits="userSpaceOnUse" x={w.c.x - R} y={w.c.y - R} width={2 * R} height={2 * R}>
        <feGaussianBlur stdDeviation={sd} />
      </filter>
      {edge && (
        <filter id={`${id}-ef`} filterUnits="userSpaceOnUse" x={w.c.x - R} y={w.c.y - R} width={2 * R} height={2 * R}>
          <feGaussianBlur stdDeviation={0.75} />
        </filter>
      )}
      <mask id={`${id}-wm`} maskUnits="userSpaceOnUse" x={-3000} y={-3000} width={6000} height={6000}>
        <rect x={-3000} y={-3000} width={6000} height={6000} fill="#FFFFFF" />
        <path d={closed(winPts(w, 1 - w.soft * 0.5), 1)} fill="#000000" opacity={1 - ghost} filter={`url(#${id}-wf)`} />
        {edge && <path d={edge} fill="none" stroke="#FFFFFF" strokeWidth={EDGE_BAND * 2} filter={`url(#${id}-ef)`} />}
      </mask>
    </>
  );
};
/** the thin warm rim where the skin thins away at the window's edge (drawn inside the masked skin) */
const WindowRim: React.FC<{id: string; w: Win}> = ({id, w}) => {
  const R = w.r * 1.6;
  return (
    <g>
      <defs>
        <filter id={`${id}-wrf`} filterUnits="userSpaceOnUse" x={w.c.x - R} y={w.c.y - R} width={2 * R} height={2 * R}>
          <feGaussianBlur stdDeviation={Math.max(0.01, w.r * 0.012)} />
        </filter>
      </defs>
      <g filter={`url(#${id}-wrf)`}>
        <path d={closed(winPts(w, 1 - w.soft * 0.3), 1)} fill="none" stroke={C.skinLayer} strokeWidth={w.r * 0.05} opacity={0.75} />
        <path d={closed(winPts(w, 1 - w.soft * 0.42), 1)} fill="none" stroke="#D9735E" strokeWidth={w.r * 0.03} opacity={0.6} />
        <path d={closed(winPts(w, 1 - w.soft * 0.5), 1)} fill="none" stroke={C.fat} strokeWidth={w.r * 0.018} opacity={0.4} />
      </g>
    </g>
  );
};

// ---------------------------------------------------------------- skin shading pieces
/** colour across the forearm (0 = ulnar edge, lit, 1 = radial edge) */
const FA_STOPS: [number, string][] = [
  [0.0, mix(C.skin, C.skinDeep, 0.1)],
  [0.07, C.skinLight],
  [0.24, mix(C.skinLight, C.skin, 0.3)],
  [0.5, C.skin],
  [0.72, mix(C.skin, C.skinDeep, 0.26)],
  [0.88, mix(C.skin, C.skinDeep, 0.44)],
  [1.0, mix(C.skin, C.skinDeep, 0.28)],
];
const faColor = (f: number) => {
  const x = clamp(f);
  for (let i = 0; i < FA_STOPS.length - 1; i++) {
    const [a, ca] = FA_STOPS[i], [b, cb] = FA_STOPS[i + 1];
    if (x <= b) return mix(ca, cb, (x - a) / (b - a));
  }
  return FA_STOPS[FA_STOPS.length - 1][1];
};
const FA_YS = [-80, -66, -54, -46, -40, -36, -30, -22, -10, 5, 25, 50, 80, 120, 170, 224, 300, 420, 560, ARM_END + 10];
/** the forearm as a cylinder: nested strips that follow its two borders (a gradient that bends with the arm) */
const ForearmShade: React.FC<{id: string}> = ({id}) => {
  const N = 40;
  const strips: React.ReactNode[] = [];
  for (let k = 0; k < N; k++) {
    const f0 = -0.04 + (k / N) * 1.08;
    const fm = f0 + 0.5 * (1.08 / N);
    const left = FA_YS.map((y) => pt(Lx(y) + f0 * (Rx(y) - Lx(y)), y));
    const right = FA_YS.map((y) => pt(Lx(y) + 1.08 * (Rx(y) - Lx(y)), y)).reverse();
    strips.push(<path key={k} d={poly([...left, ...right])} fill={faColor(fm)} />);
  }
  return (
    <g>
      <defs>
        <linearGradient id={`${id}-fg`} gradientUnits="userSpaceOnUse" x1={0} y1={-31} x2={0} y2={-60}>
          <stop offset={0} stopColor="#FFFFFF" />
          <stop offset={1} stopColor="#000000" />
        </linearGradient>
        <mask id={`${id}-fm`} maskUnits="userSpaceOnUse" x={-200} y={-200} width={400} height={1000}>
          <rect x={-200} y={-200} width={400} height={1000} fill={`url(#${id}-fg)`} />
        </mask>
      </defs>
      <g mask={`url(#${id}-fm)`}>{strips}</g>
    </g>
  );
};
const RG: React.FC<{id: string; c: P; rx: number; ry: number; rot?: number; color: string; a: number; fx?: number; fy?: number; mid?: number}> = ({id, c, rx, ry, rot = 0, color, a, fx = 0.5, fy = 0.5, mid = 0.5}) => (
  <g>
    <defs>
      <radialGradient id={id} cx={0.5} cy={0.5} r={0.5} fx={fx} fy={fy}>
        <stop offset={0} stopColor={color} stopOpacity={a} />
        <stop offset={mid} stopColor={color} stopOpacity={a * 0.6} />
        <stop offset={1} stopColor={color} stopOpacity={0} />
      </radialGradient>
    </defs>
    <ellipse cx={c.x} cy={c.y} rx={rx} ry={ry} fill={`url(#${id})`} transform={rot ? `rotate(${rot} ${c.x} ${c.y})` : undefined} />
  </g>
);
/** a crease: a soft fold line with a light lip on its distal side */
const Crease: React.FC<{d: string; a?: number; lift?: P}> = ({d, a = 0.6, lift = pt(0, -0.35)}) => (
  <g>
    <path d={d} fill="none" stroke={C.skinLight} strokeWidth={CREASE_PX * 0.9} opacity={0.65 * a} strokeLinecap="round" transform={`translate(${lift.x} ${lift.y})`} vectorEffect={NS} />
    <path d={d} fill="none" stroke={C.crease} strokeWidth={CREASE_PX} opacity={a} strokeLinecap="round" vectorEffect={NS} />
  </g>
);
/** an arc across a digit at s, spanning a fraction of its width, bowing toward the tip */
const acrossArc = (f: Fg, s: number, span = 0.78, bow = 0.6): P[] => {
  const a = f.at(s, span), b = f.at(s, -span);
  const m = add(lerpP(a, b, 0.5), mul(f.u, bow));
  return [a, lerpP(lerpP(a, m, 0.5), m, 0.4), m, lerpP(lerpP(b, m, 0.5), m, 0.4), b];
};

/** accumulated flexion of each phalanx (rad), as in anatomy.fingerChain / thumbChain */
const flexOf = (curl: number, thumb?: boolean) => {
  if (thumb) return [0.15 + 0.4 * curl, 0.4 + curl];
  const a = [0.42 * curl + 0.18, 0.95 * curl + 0.22, 0.6 * curl + 0.12];
  return [a[0], a[0] + a[1], a[0] + a[1] + a[2]];
};
const Digit_: React.FC<{id: string; f: Fg; sBase: number; curl: number; thumb?: boolean}> = ({id, f, sBase, curl, thumb}) => {
  const flex = flexOf(curl, thumb);
  const sT = f.s[f.s.length - 1];
  const tube = [...sideLine(f, 1, sBase - 14, sT), ...capPts(f), ...sideLine(f, -1, sT, sBase - 14)];
  const mid = f.at(Math.max(sBase, (sBase + sT) * 0.5), 0);
  const hwM = f.hw((sBase + sT) * 0.5);
  const A = add(mid, mul(f.nL, hwM)), B = add(mid, mul(f.nL, -hwM));
  const m0 = f.at(sBase - 4.5, 0), m1 = f.at(sBase + 1.2, 0);
  const pads: React.ReactNode[] = [];
  const segs = f.s.length - 1;
  // each phalanx's pad, and the flexed segments turning their pads away from the light (darker as they curl)
  const turn: React.ReactNode[] = [];
  for (let k = 0; k < segs; k++) {
    const a = Math.max(f.s[k], sBase + 1), b = f.s[k + 1];
    if (b - a < 0.4) continue;
    const sm = (a + b) / 2 + (k === segs - 1 ? 0.15 * f.hw(b) : 0);
    const c = f.at(sm, 0.16);
    const ry = Math.max(f.hw(sm) * 0.5, (b - a) * 0.36);
    pads.push(<RG key={k} id={`${id}-pd${k}`} c={c} rx={f.hw(sm) * 0.62} ry={ry} rot={deg(f.u) + 90} color={C.skinLight} a={0.38} fx={0.38} fy={0.4} />);
    const acc = flex[k] ?? 0;
    const dk = clamp((acc - 0.55) * 0.42, 0, 0.3);
    if (dk > 0.01) {
      const seg = [...sideLine(f, 1, f.s[k] + 0.4, b), ...(k === segs - 1 ? capPts(f) : []), ...sideLine(f, -1, b, f.s[k] + 0.4)];
      turn.push(<path key={`t${k}`} d={poly(seg)} fill={C.skinDeep} opacity={dk} />);
    }
  }
  // fingertip: pinker pad, glossy highlight
  const tipC = f.at(sT, 0.08);
  const r = f.hw(sT);
  const gl = add(add(tipC, mul(f.nL, r * 0.38)), mul(f.u, r * 0.2));
  // flexion creases, deeper as each joint bends
  const jA = (k: number) => clamp(0.3 + 0.75 * (flex[k] - (k > 0 ? flex[k - 1] : 0)));
  const creases: [P[], number][] = [];
  if (!thumb) {
    creases.push([acrossArc(f, f.s[1] - 0.8, 0.8, 0.7), jA(1)], [acrossArc(f, f.s[1] + 0.5, 0.7, 0.6), jA(1) * 0.8], [acrossArc(f, f.s[2], 0.72, 0.5), jA(2)], [acrossArc(f, sBase + 2.2, 0.82, 0.9), 0.45]);
  } else {
    creases.push([acrossArc(f, f.s[1] - 0.3, 0.8, 0.8), jA(1)], [acrossArc(f, 1.0, 0.75, 1.2), 0.45]);
  }
  // the thumbnail, seen edge-on along the radial side of the distal phalanx
  let nail: React.ReactNode = null;
  if (thumb) {
    const s0 = f.s[1] + 0.45 * (sT - f.s[1]);
    const pts: P[] = [];
    for (let k = 0; k <= 8; k++) {
      const x = s0 + ((sT + r * 0.55 - s0) * k) / 8;
      const xx = Math.min(x, sT);
      const side = -1;
      const over = x > sT ? Math.sqrt(Math.max(0, 1 - ((x - sT) / (r * 0.94)) ** 2)) : 1;
      const e = add(f.at(xx, 0), add(mul(f.nL, side * f.hw(xx) * over), mul(f.u, x - xx)));
      pts.push(e);
    }
    const inner = pts.map((p, k) => add(p, mul(f.nL, 1.6 * Math.sin((Math.PI * k) / 8) ** 0.6 + 0.15)));
    nail = (
      <g>
        <path d={closed([...pts, ...[...inner].reverse()], 0.6)} fill="#F7E1D6" />
        <path d={open(inner, 0.6)} fill="none" stroke={mix(C.skinDeep, '#B07060', 0.3)} strokeWidth={1.3} opacity={0.75} vectorEffect={NS} />
        <path d={open(inner.slice(2, 6).map((p) => add(p, mul(f.nL, -0.5))), 0.6)} fill="none" stroke="#FFFFFF" strokeWidth={1.2} opacity={0.7} vectorEffect={NS} />
      </g>
    );
  }
  return (
    <g>
      <defs>
        <linearGradient id={`${id}-g`} gradientUnits="userSpaceOnUse" x1={A.x} y1={A.y} x2={B.x} y2={B.y}>
          <stop offset={0} stopColor={mix(PALM, C.skinDeep, 0.12)} />
          <stop offset={0.1} stopColor={C.skinLight} />
          <stop offset={0.32} stopColor={mix(C.skinLight, PALM, 0.4)} />
          <stop offset={0.56} stopColor={PALM} />
          <stop offset={0.82} stopColor={mix(PALM, C.skinDeep, 0.36)} />
          <stop offset={1} stopColor={mix(PALM, C.skinDeep, 0.22)} />
        </linearGradient>
        <linearGradient id={`${id}-mg`} gradientUnits="userSpaceOnUse" x1={m0.x} y1={m0.y} x2={m1.x} y2={m1.y}>
          <stop offset={0} stopColor="#000000" />
          <stop offset={1} stopColor="#FFFFFF" />
        </linearGradient>
        <mask id={`${id}-m`} maskUnits="userSpaceOnUse" x={-400} y={-500} width={800} height={800}>
          <rect x={-400} y={-500} width={800} height={800} fill={`url(#${id}-mg)`} />
        </mask>
      </defs>
      <g mask={`url(#${id}-m)`}>
        <path d={poly(tube)} fill={`url(#${id}-g)`} />
        {pads}
      </g>
      {turn}
      <RG id={`${id}-tp`} c={tipC} rx={r * 0.8} ry={r * 0.75} rot={deg(f.u) + 90} color="#F2A893" a={0.32} />
      {creases.map(([p, a], i) => <Crease key={i} d={open(p, 0.8)} a={a} lift={mul(f.u, 0.32)} />)}
      {nail}
      <ellipse cx={gl.x} cy={gl.y} rx={r * 0.34} ry={r * 0.16} transform={`rotate(${deg(f.u) + 90 - 25} ${gl.x} ${gl.y})`} fill="#FFFFFF" opacity={0.5} />
    </g>
  );
};

// palm creases (right palm, palm up, thumb on screen right)
const LIFE: P[] = [pt(22.4, -121.5), pt(16.0, -113.0), pt(11.2, -101.0), pt(8.6, -87.0), pt(8.0, -73.0), pt(9.0, -60.0), pt(11.2, -48.5)];
const HEAD: P[] = [pt(22.0, -121.0), pt(13.0, -118.2), pt(2.0, -114.0), pt(-10.0, -109.0), pt(-21.0, -104.6), pt(-29.0, -101.6)];
const HEART: P[] = [pt(-42.5, -117.0), pt(-35.0, -120.2), pt(-25.0, -124.6), pt(-15.0, -128.8), pt(-6.0, -132.6), pt(0.2, -138.0), pt(3.0, -144.5)];
const WRIST1: P[] = [[-28.0, 0.6], [-19.0, -0.6], [-8.0, -1.2], [2.5, -0.9], [11.5, 0.2]].map(([x, d]) => pt(x, WRIST_CREASE_Y + d));
const WRIST2: P[] = [pt(-22.0, -28.2), pt(-12.0, -28.8), pt(-2.0, -28.8), pt(5.0, -28.2)];
const HYPO: P[] = [pt(-31.0, -98.0), pt(-27.6, -84.0), pt(-27.4, -68.0), pt(-29.6, -54.0)];

// ---------------------------------------------------------------- the incision as seen on the skin
const SUT_YS = [-0.62, -0.21, 0.21, 0.62];
const THREAD = '#1A2230';
/** sutures drawing in (each stitch spans the remaining gap and pulls the lips together), the fresh line, the scar */
const IncisionSkin: React.FC<{id: string; s: ArmState; part: 'under' | 'over'}> = ({id, s, part}) => {
  const {c, ry} = INCISION;
  const a = holeA(s.incision);
  const linePts: P[] = [];
  for (let k = 0; k <= 24; k++) {
    const t = k / 24;
    const y = c.y - ry * 0.98 + t * ry * 1.96;
    linePts.push(pt(c.x + 0.18 * noise1(t * 6, 3) + 0.1 * Math.sin(t * 9), y));
  }
  const fresh = (1 - ss(a, 0.25, 1.8)) * (1 - s.scar);
  const scar = clamp(s.scar);
  const opened = s.incision > 0.004;
  if (part === 'under') {
    return (
      <g>
        {(opened || fresh > 0.01) && <RG id={`${id}-halo`} c={c} rx={16 + a * 0.7} ry={ry + 6} color="#E07A6C" a={0.2 * Math.max(clamp(s.incision * 3), fresh)} mid={0.55} />}
        {fresh > 0.01 && (
          <g opacity={fresh}>
            <path d={open(linePts, 0.6)} fill="none" stroke="#E79A8A" strokeWidth={1.4} opacity={0.55} strokeLinecap="round" />
            <path d={open(linePts, 0.6)} fill="none" stroke="#8E2E2C" strokeWidth={1.9} strokeLinecap="round" vectorEffect={NS} />
          </g>
        )}
        {scar > 0.01 && (
          <g opacity={scar}>
            <path d={open(linePts, 0.6)} fill="none" stroke="#E7A595" strokeWidth={1.25} opacity={0.5} strokeLinecap="round" />
            <path d={open(linePts, 0.6)} fill="none" stroke="#F6D2C4" strokeWidth={0.42} opacity={0.6} strokeLinecap="round" />
          </g>
        )}
      </g>
    );
  }
  if (s.sutures <= 0.001) return null;
  const sts: React.ReactNode[] = [];
  SUT_YS.forEach((f, i) => {
    const p = clamp((s.sutures - i * 0.17) / 0.45);
    if (p <= 0) return;
    const y = c.y + f * ry;
    const local = a * Math.sqrt(Math.max(0, 1 - (f * f))) ;
    const half = Math.max(2.5, local + 1.7);
    const tilt = 0.5 * (hash(i * 3.1) - 0.5);
    const L = pt(c.x - half, y + tilt), R = pt(c.x + half, y - tilt);
    const arcTop = pt(c.x, y - 0.55);
    const path = [L, lerpP(L, arcTop, 0.5), arcTop, lerpP(arcTop, R, 0.5), R];
    // progressive: the needle passes left -> right
    const nUse = 1 + p * (path.length - 1);
    const shown: P[] = [];
    for (let k = 0; k < path.length; k++) {
      if (k <= Math.floor(nUse - 1)) shown.push(path[k]);
      else { shown.push(lerpP(path[k - 1], path[k], nUse - 1 - Math.floor(nUse - 1))); break; }
    }
    const knot = ss(p, 0.85, 1);
    const kc = pt(R.x - 0.2, R.y - 0.15);
    sts.push(
      <g key={i}>
        <circle cx={L.x} cy={L.y} r={0.34} fill="#7A2A2A" opacity={0.8} />
        {p > 0.95 && <circle cx={R.x} cy={R.y} r={0.34} fill="#7A2A2A" opacity={0.8} />}
        <path d={open(shown, 0.5)} fill="none" stroke={rgba('#3A1510', 0.35)} strokeWidth={3.2} strokeLinecap="round" transform="translate(0.18 0.25)" vectorEffect={NS} />
        <path d={open(shown, 0.5)} fill="none" stroke={THREAD} strokeWidth={2.3} strokeLinecap="round" vectorEffect={NS} />
        {knot > 0 && (
          <g opacity={knot}>
            <ellipse cx={kc.x} cy={kc.y} rx={0.55} ry={0.42} fill={THREAD} />
            <path d={`M${kc.x} ${kc.y}l${1.5} ${-0.9}`} stroke={THREAD} strokeWidth={1.8} strokeLinecap="round" vectorEffect={NS} />
            <path d={`M${kc.x} ${kc.y}l${1.7} ${0.5}`} stroke={THREAD} strokeWidth={1.8} strokeLinecap="round" vectorEffect={NS} />
            <circle cx={kc.x - 0.15} cy={kc.y - 0.15} r={0.14} fill="#9FB0C6" opacity={0.8} />
          </g>
        )}
      </g>,
    );
  });
  return <g>{sts}</g>;
};

// ---------------------------------------------------------------- ArmSkin
export const ArmSkin: React.FC<{id: string; s: ArmState; noWindow?: boolean}> = ({id, s, noWindow}) => {
  const g = armGeo(s.curl, s.thumb, s.spread ?? 0);
  const outD = poly(g.outline);
  const a = holeA(s.incision);
  const hole = s.incision > 0.004 ? holePts(a) : null;
  const clipD = hole ? `${outD}${poly(hole)}` : outD;
  const win = !noWindow && s.window && s.window.r > 0.05 ? s.window : null;
  const [I, M, R, Li] = g.fingers;
  const sb = [ (g.crotch[2].sb + S_INDEX_WEB) / 2, (g.crotch[1].sb + g.crotch[2].sa) / 2, (g.crotch[0].sb + g.crotch[1].sa) / 2, g.crotch[0].sa - 1];
  const a1 = nrm(sub(THUMB.head, THUMB.base)), n1 = perp(a1);
  const thenarC = add(add(THUMB.base, mul(a1, 18)), mul(n1, 1.5));
  const seps: React.ReactNode[] = [];
  g.crotch.forEach((cr, i) => {
    if (!cr.touching) return;
    const A = [g.fingers[3 - i], g.fingers[2 - i]];
    const dn = nrm(mul(add(A[0].u, A[1].u), -0.5));
    const p1 = add(cr.p, mul(dn, 3.6));
    seps.push(<path key={i} d={open([cr.p, lerpP(cr.p, p1, 0.5), p1], 0.8)} fill="none" stroke={INK} strokeWidth={SEP_INK} strokeLinecap="round" opacity={0.8} vectorEffect={NS} />);
    seps.push(<path key={`b${i}`} d={open([lerpP(cr.p, p1, 0.6), add(p1, mul(dn, 2.2))], 0.8)} fill="none" stroke={INK} strokeWidth={SEP_INK * 0.6} strokeLinecap="round" opacity={0.45} vectorEffect={NS} />);
  });
  const fsh = [I, M, R, Li];
  return (
    <g>
      <defs>
        <clipPath id={`${id}-cl`}><path d={clipD} clipRule="evenodd" /></clipPath>
        {win && <WindowDefs id={id} w={win} edge={outD} />}
        <linearGradient id={`${id}-pt`} gradientUnits="userSpaceOnUse" x1={0} y1={-32} x2={0} y2={-62}>
          <stop offset={0} stopColor={PALM} stopOpacity={0} />
          <stop offset={1} stopColor={PALM} stopOpacity={1} />
        </linearGradient>
        <linearGradient id={`${id}-wcg`} gradientUnits="userSpaceOnUse" x1={-29} y1={0} x2={12.5} y2={0}>
          <stop offset={0} stopColor="#000000" />
          <stop offset={0.4} stopColor="#FFFFFF" />
          <stop offset={0.62} stopColor="#FFFFFF" />
          <stop offset={1} stopColor="#000000" />
        </linearGradient>
        <mask id={`${id}-wcm`} maskUnits="userSpaceOnUse" x={-60} y={-60} width={120} height={60}>
          <rect x={-60} y={-60} width={120} height={60} fill={`url(#${id}-wcg)`} />
        </mask>
        <linearGradient id={`${id}-st`} gradientUnits="userSpaceOnUse" x1={0} y1={-26} x2={0} y2={190}>
          <stop offset={0} stopColor="#FFFFFF" stopOpacity={0} />
          <stop offset={0.12} stopColor="#FFFFFF" stopOpacity={0.55} />
          <stop offset={0.45} stopColor="#FFFFFF" stopOpacity={0.3} />
          <stop offset={1} stopColor="#FFFFFF" stopOpacity={0} />
        </linearGradient>
      </defs>
      <g mask={win ? `url(#${id}-wm)` : undefined}>
        <g clipPath={`url(#${id}-cl)`}>
          <path d={outD} fill={C.skin} />
          <ForearmShade id={`${id}-fa`} />
          {/* the palm and fingers are a little pinker than the forearm */}
          <rect x={-120} y={-320} width={240} height={290} fill={`url(#${id}-pt)`} />
          {/* palm relief: hypothenar and thenar eminences lit from the upper left, the hollow of the palm */}
          <RG id={`${id}-hol`} c={pt(-2, -97)} rx={19} ry={23} color={C.skinDeep} a={0.22} />
          <RG id={`${id}-hyp`} c={pt(-34.5, -80)} rx={9.5} ry={27} rot={-4} color={C.skinLight} a={0.75} fx={0.4} fy={0.35} />
          <RG id={`${id}-thS`} c={add(thenarC, mul(n1, 7))} rx={10} ry={26} rot={deg(a1) + 90} color={C.skinDeep} a={0.32} />
          <RG id={`${id}-thL`} c={add(thenarC, mul(n1, -1.5))} rx={11} ry={22} rot={deg(a1) + 90} color={C.skinLight} a={0.8} fx={0.38} fy={0.36} />
          <RG id={`${id}-wr`} c={pt(-8, -33)} rx={30} ry={5} color={C.skinDeep} a={0.16} />
          {/* the forearm's long gloss along its lit side */}
          <path d={open([pt(-33.6, -24), pt(-34.4, 10), pt(-36.2, 60), pt(-38.6, 120), pt(-40.6, 185)], 1)} fill="none" stroke={`url(#${id}-st)`} strokeWidth={2.6} strokeLinecap="round" />
          {/* digits */}
          {fsh.map((f, i) => <Digit_ key={i} id={`${id}-d${i}`} f={f} sBase={sb[i]} curl={s.curl} />)}
          <Digit_ id={`${id}-th`} f={g.thumb} sBase={2} curl={s.thumb} thumb />
          {/* palm and wrist creases */}
          <Crease d={open(HEART, 0.8)} a={0.62} />
          <Crease d={open(HEAD, 0.8)} a={0.55} />
          <Crease d={open(LIFE, 0.8)} a={0.62} lift={pt(-0.3, -0.2)} />
          <Crease d={open(HYPO, 0.8)} a={0.18} />
          <g mask={`url(#${id}-wcm)`}>
            <Crease d={open(WRIST1, 0.8)} a={0.62} />
            <Crease d={open(WRIST2, 0.8)} a={0.32} />
          </g>
          {/* small glosses */}
          <ellipse cx={thenarC.x - 4.5} cy={thenarC.y - 6} rx={3.2} ry={1.5} transform={`rotate(${deg(a1)} ${thenarC.x - 4.5} ${thenarC.y - 6})`} fill="#FFFFFF" opacity={0.42} />
          <ellipse cx={-37.5} cy={-90} rx={1.3} ry={4.2} transform="rotate(8 -37.5 -90)" fill="#FFFFFF" opacity={0.38} />
          <IncisionSkin id={`${id}-inc`} s={s} part="under" />
          {win && <WindowRim id={id} w={win} />}
        </g>
        <path d={outD} fill="none" stroke={INK} strokeWidth={SKIN_INK} strokeLinejoin="round" vectorEffect={NS} />
        {seps}
        <IncisionSkin id={`${id}-sut`} s={s} part="over" />
      </g>
    </g>
  );
};

// ---------------------------------------------------------------- the rim of the opening and the retractors
const STEEL_INK = 1.8;
/** a small blunt rake retractor: three hooked tines over the lip, a narrow head, a flat handle running off the arm
 *  (left: down-left, right: down-right) that ends in a finger ring. `out` 0..1 withdraws it as the incision closes. */
const Rake: React.FC<{id: string; side: number; a: number; out: number}> = ({id, side, a, out}) => {
  const {c, ry} = INCISION;
  const lipX = (y: number) => c.x + side * a * Math.sqrt(Math.max(0, 1 - ((y - c.y) / ry) ** 2));
  const yc = c.y + side * 0.8;
  const tys = [-3.3, 0, 3.3].map((d) => yc + d);
  const ang = side < 0 ? (163 * Math.PI) / 180 : (11 * Math.PI) / 180;
  const hd = pt(Math.cos(ang), Math.sin(ang));
  const dx = mul(hd, out * 30);
  const lift = clamp(out * 1.6);
  const tines = tys.map((y) => {
    const x = lipX(y);
    return {p0: add(pt(x + side * 3.0, y), dx), pb: add(pt(x + side * 0.3, y - 0.2), dx), pt: add(pt(x - side * (1.05 - 0.9 * lift), y + 0.25), dx)};
  });
  // the head: a narrow bar along the lip joining the tines
  const xh = lipX(yc) + side * 3.3;
  const head = [pt(xh - side * 0.9, tys[0] - 1.25), pt(xh + side * 1.0, tys[0] - 1.45), pt(xh + side * 1.1, tys[2] + 1.45), pt(xh - side * 0.9, tys[2] + 1.25)].map((p) => add(p, dx));
  // the handle
  const hn = perp(hd);
  const h0 = add(pt(xh + side * 0.4, yc), dx);
  const HL = 66;
  const hw = (t: number) => 1.75 - 0.35 * t + 0.25 * Math.max(0, (t - 0.85) / 0.15) ** 2;
  const sideA: P[] = [], sideB: P[] = [];
  for (let k = 0; k <= 12; k++) {
    const t = k / 12;
    sideA.push(add(add(h0, mul(hd, t * HL)), mul(hn, hw(t))));
    sideB.push(add(add(h0, mul(hd, t * HL)), mul(hn, -hw(t))));
  }
  const rc = add(h0, mul(hd, HL + 5.0));
  const ringO: P[] = [], ringI: P[] = [];
  for (let k = 0; k < 28; k++) {
    const t = (k / 28) * Math.PI * 2;
    ringO.push(add(rc, add(mul(hd, 6.2 * Math.cos(t)), mul(hn, 5.0 * Math.sin(t)))));
    ringI.push(add(rc, add(mul(hd, 3.9 * Math.cos(t) + 0.3), mul(hn, 2.9 * Math.sin(t)))));
  }
  const handleD = `${closed([...sideA, ...[...sideB].reverse()], 0.4)}${closed(ringO, 1)}${closed(ringI, 1)}`;
  const g0 = add(h0, mul(hn, 2.0)), g1 = add(h0, mul(hn, -2.0));
  const shadow = 'translate(1.4 2.0)';
  return (
    <g opacity={1 - ss(out, 0.6, 1)}>
      <defs>
        <linearGradient id={`${id}-s`} gradientUnits="userSpaceOnUse" x1={g0.x} y1={g0.y} x2={g1.x} y2={g1.y}>
          <stop offset={0} stopColor={C.steelLit} />
          <stop offset={0.4} stopColor={C.steel} />
          <stop offset={0.78} stopColor={mix(C.steel, C.steelDeep, 0.5)} />
          <stop offset={1} stopColor={C.steelDeep} />
        </linearGradient>
      </defs>
      {/* contact shadow on the skin and the drape */}
      <g opacity={0.26 * (1 - lift)} transform={shadow}>
        <path d={handleD} fillRule="evenodd" fill="#2B140E" />
        <path d={closed(head, 0.6)} fill="#2B140E" />
      </g>
      {tines.map((t, i) => (
        <g key={i}>
          <path d={open([t.p0, t.pb, t.pt], 0.9)} fill="none" stroke={mix(INK, C.steelDeep, 0.3)} strokeWidth={1.05} strokeLinecap="round" />
          <path d={open([t.p0, t.pb, lerpP(t.pb, t.pt, 0.5)], 0.9)} fill="none" stroke={C.steel} strokeWidth={0.72} strokeLinecap="round" />
          <path d={open([lerpP(t.pb, t.pt, 0.3), t.pt], 0.9)} fill="none" stroke={mix(C.steel, C.steelDeep, 0.6)} strokeWidth={0.7} strokeLinecap="round" />
          <path d={open([lerpP(t.p0, t.pb, 0.1), lerpP(t.p0, t.pb, 0.8)], 0.9)} fill="none" stroke="#FFFFFF" strokeWidth={0.22} opacity={0.9} strokeLinecap="round" />
        </g>
      ))}
      <path d={closed(head, 0.6)} fill={`url(#${id}-s)`} stroke={INK} strokeWidth={STEEL_INK} strokeLinejoin="round" vectorEffect={NS} />
      <path d={handleD} fillRule="evenodd" fill={`url(#${id}-s)`} stroke={INK} strokeWidth={STEEL_INK} strokeLinejoin="round" vectorEffect={NS} />
      <path d={open(sideA.slice(1, 11).map((p) => add(p, mul(hn, -0.65))), 1)} fill="none" stroke="#FFFFFF" strokeWidth={0.45} opacity={0.8} strokeLinecap="round" />
    </g>
  );
};

/** the cut edge of the opening: skin, yellow fat and fascia in thin layers, the lips' shadow on the floor, wet
 *  glints, and two rake retractors holding the lips apart (handles off left and right). Only when incision > 0. */
export const IncisionRim: React.FC<{id: string; s: ArmState}> = ({id, s}) => {
  const e = clamp(s.incision);
  if (e <= 0.004) return null;
  const a = holeA(e);
  const {c} = INCISION;
  const H = holePts(a);
  const ring = (d0: number, d1: number) => `${poly(holePts(a, d0))}${poly(holePts(a, d1))}`;
  const kb = clamp(a / 5);
  const shift = (dx: number, dy: number) => holePts(a).map((p) => pt(p.x + dx * kb, p.y + dy * kb));
  const win = s.window && s.window.r > 0.05 ? s.window : null;
  // fat lobules along the fat band
  const lobes: React.ReactNode[] = [];
  const nLob = 64;
  for (let k = 0; k < nLob; k++) {
    const t = ((k + 0.5 * hash(k * 1.7)) / nLob) * Math.PI * 2;
    const ct = Math.cos(t), st = Math.sin(t);
    const band = 1.75 * (0.55 + 0.45 * Math.abs(ct)) * kb;
    const dd = 0.9 * kb + band * (0.3 + 0.4 * hash(k * 3.3));
    const pinch = (1 - 0.3 * Math.abs(st) ** 3) * (1 + 0.07 * Math.exp(-(((st + 0.04 * Math.sign(ct)) / 0.32) ** 2)));
    const p = pt(c.x + (a * pinch - dd * (0.55 + 0.45 * Math.abs(ct))) * ct, c.y + (INCISION.ry - dd * 0.5) * st);
    const r = band * (0.32 + 0.16 * hash(k * 5.1));
    if (r < 0.05) continue;
    lobes.push(<ellipse key={k} cx={p.x} cy={p.y} rx={r} ry={r * 0.8} transform={`rotate(${(t * 180) / Math.PI} ${p.x} ${p.y})`} fill={mix(C.fat, '#FFF3C8', 0.35)} stroke={C.fatDeep} strokeWidth={0.9} opacity={0.85} vectorEffect={NS} />);
  }
  const glints: React.ReactNode[] = [];
  for (let k = 0; k < 12; k++) {
    const t = (0.08 + 0.84 * hash(k * 7.7)) * Math.PI * 2;
    const ct = Math.cos(t), st = Math.sin(t);
    const lit = clamp(0.5 - 0.5 * (ct * LIGHT.x + st * LIGHT.y) * 1.4);
    if (lit < 0.35) continue;
    const dd = (0.3 + 1.8 * hash(k * 2.3)) * kb;
    const p = pt(c.x + (a - dd) * ct, c.y + (INCISION.ry - dd * 0.5) * st);
    const tg = nrm(pt(-a * st, INCISION.ry * ct));
    const l = 0.9 + 0.8 * hash(k);
    glints.push(<path key={k} d={`M${p.x - tg.x * l} ${p.y - tg.y * l}L${p.x + tg.x * l} ${p.y + tg.y * l}`} stroke="#FFFFFF" strokeWidth={1.6} opacity={0.75 * lit} strokeLinecap="round" vectorEffect={NS} />);
  }
  const gA = pt(c.x + LIGHT.x * a, c.y + LIGHT.y * INCISION.ry), gB = pt(c.x - LIGHT.x * a, c.y - LIGHT.y * INCISION.ry);
  const out = 1 - ss(e, 0.55, 0.95);
  return (
    <g>
      <defs>
        <clipPath id={`${id}-h`}><path d={poly(H)} /></clipPath>
        {win && <WindowDefs id={id} w={win} ghost={0.3} />}
        <linearGradient id={`${id}-wl`} gradientUnits="userSpaceOnUse" x1={gA.x} y1={gA.y} x2={gB.x} y2={gB.y}>
          <stop offset={0} stopColor="#2A0A10" stopOpacity={0.4} />
          <stop offset={0.5} stopColor="#2A0A10" stopOpacity={0.05} />
          <stop offset={1} stopColor="#FFF4E8" stopOpacity={0.18} />
        </linearGradient>
      </defs>
      <g mask={win ? `url(#${id}-wm)` : undefined}>
        <g clipPath={`url(#${id}-h)`}>
          {/* the lips' shadow on the floor of the wound (the light comes from the upper left) */}
          <path d={`${poly(H)}${poly(shift(3.4, 4.3))}`} fillRule="evenodd" fill="#4A1410" opacity={0.1} />
          <path d={`${poly(H)}${poly(shift(2.3, 2.9))}`} fillRule="evenodd" fill="#4A1410" opacity={0.12} />
          <path d={`${poly(H)}${poly(shift(1.3, 1.6))}`} fillRule="evenodd" fill="#3A0B10" opacity={0.16} />
          {/* the cut wall: skin (dermis), subcutaneous fat, fascia */}
          <path d={ring(2.55, 3.0)} fillRule="evenodd" fill={C.fascia} opacity={0.9} />
          <path d={ring(0.85, 2.6)} fillRule="evenodd" fill={C.fat} />
          <g>{lobes}</g>
          <path d={ring(0, 0.9)} fillRule="evenodd" fill={C.skinLayer} />
          <path d={open(holePts(a, 0.88).concat([holePts(a, 0.88)[0]]), 0.5)} fill="none" stroke={mix(C.skinLayer, '#B5524A', 0.45)} strokeWidth={1.0} opacity={0.7} vectorEffect={NS} />
          <path d={ring(0, 3.0)} fillRule="evenodd" fill={`url(#${id}-wl)`} />
          {glints}
        </g>
        {/* the lip: a pale rounded edge and a fine ink line */}
        <path d={poly(H)} fill="none" stroke={C.skinLight} strokeWidth={0.7} opacity={0.6} />
        <path d={poly(H)} fill="none" stroke={INK} strokeWidth={1.7} opacity={0.8} strokeLinejoin="round" vectorEffect={NS} />
      </g>
      {e > 0.3 && <Rake id={`${id}-rl`} side={-1} a={a} out={out} />}
      {e > 0.3 && <Rake id={`${id}-rr`} side={1} a={a} out={out} />}
    </g>
  );
};

// ---------------------------------------------------------------- the deep tissue bed (inside layer, under the bones)
type Muscle = {pts: P[]; axis: [P, P]; fib: number; spacing?: number; tone?: number};
const MUSCLES: Muscle[] = [
  // the long flexor bellies (FDS / FDP), the ulnar flexor (FCU) and the radial group (FPL / brachioradialis)
  {pts: [pt(-29, 32), pt(-20, 25.5), pt(-7, 24.5), pt(5, 27), pt(12.5, 36), pt(14, 70), pt(13, 130), pt(9, 230), pt(-5, 330), pt(-22, 330), pt(-32, 230), pt(-34, 130), pt(-33, 64)], axis: [pt(-9, 330), pt(-9, 24)], fib: 1, spacing: 2.1},
  {pts: [pt(-47, -12), pt(-41, -17), pt(-36.5, -6), pt(-35.5, 30), pt(-36.5, 120), pt(-40, 250), pt(-49, 330), pt(-56, 250), pt(-55.5, 120), pt(-52, 30)], axis: [pt(-46, 330), pt(-41, -16)], fib: 1, spacing: 2.0, tone: 0.1},
  {pts: [pt(14.5, 30), pt(20, 24.5), pt(27, 28), pt(33, 52), pt(36, 140), pt(34, 300), pt(19, 300), pt(15.5, 140), pt(13.5, 64)], axis: [pt(26, 300), pt(19, 25)], fib: 1, spacing: 2.0, tone: 0.12},
  // pronator quadratus: a broad sheet with transverse fibres between ulna and radius (the floor of the surgical field)
  {pts: [pt(-36, -16), pt(-24, -21.5), pt(-8, -24.5), pt(8, -24), pt(18.5, -21), pt(22.5, -12), pt(23, 2), pt(22, 15), pt(17, 23.5), pt(3, 26.5), pt(-14, 27), pt(-30, 24.5), pt(-37.5, 15), pt(-38.5, 0)], axis: [pt(-38, 2), pt(23, 2)], fib: 0, spacing: 1.75, tone: 0.06},
  // thenar eminence muscles along the thumb ray, hypothenar muscles, adductor pollicis / first interosseous
  {pts: [pt(16, -46), pt(25, -47.5), pt(36, -60), pt(46, -84), pt(50.5, -101), pt(45, -111), pt(33, -104), pt(22, -86), pt(15, -64)], axis: [pt(18, -50), pt(46, -106)], fib: 1, spacing: 1.8},
  {pts: [pt(-29, -44), pt(-37, -42.5), pt(-45, -58), pt(-47.5, -92), pt(-45, -120), pt(-37, -127), pt(-30.5, -114), pt(-28, -84), pt(-27, -60)], axis: [pt(-34, -44), pt(-40, -124)], fib: 1, spacing: 1.8, tone: 0.06},
  {pts: [pt(12, -80), pt(24, -90), pt(38, -106), pt(37, -119), pt(25, -132), pt(15, -139), pt(9.5, -122), pt(8.5, -98)], axis: [pt(9, -110), pt(40, -110)], fib: 0, spacing: 1.8, tone: 0.12},
  // interossei / lumbricals between the metacarpals
  {pts: [pt(1, -80), pt(5.5, -81), pt(8, -112), pt(7, -140), pt(3.5, -146), pt(-0.5, -137), pt(-1.5, -110)], axis: [pt(3, -80), pt(4, -144)], fib: 1, spacing: 1.6, tone: 0.18},
  {pts: [pt(-11, -80), pt(-6.5, -80), pt(-6, -110), pt(-7, -138), pt(-11, -142), pt(-14.5, -132), pt(-13, -106)], axis: [pt(-9, -80), pt(-10, -140)], fib: 1, spacing: 1.6, tone: 0.18},
  {pts: [pt(-20.5, -77), pt(-16, -78.5), pt(-17.5, -104), pt(-20.5, -131), pt(-25.5, -127), pt(-26.5, -106), pt(-23.5, -88)], axis: [pt(-19, -78), pt(-23, -130)], fib: 1, spacing: 1.6, tone: 0.18},
];
/** flexor tendons (silver-white), clear of the radius between y = -30 and +30 */
const TENDONS: {pts: P[]; w: number}[] = [
  {pts: [pt(-41, 140), pt(-40.5, 70), pt(-39.4, 20), pt(-37.4, -8), pt(-33.0, -28), pt(-27.5, -42)], w: 1.6},
  {pts: [pt(-22, 150), pt(-20.2, 80), pt(-18.7, 36), pt(-17.9, 10), pt(-17.7, -10), pt(-17.6, -28), pt(-13, -44)], w: 1.3},
  {pts: [pt(22, 170), pt(19.5, 90), pt(15.5, 52), pt(10, 38), pt(5, 34)], w: 1.5},
];
const fibreLines = (m: Muscle): P[][] => {
  const [A, B] = m.axis;
  const ax = nrm(sub(B, A)), nx = perp(ax);
  const L = len(sub(B, A));
  // extent across: project the polygon on the normal
  let lo = 1e9, hi = -1e9;
  for (const p of m.pts) {
    const d = (p.x - A.x) * nx.x + (p.y - A.y) * nx.y;
    lo = Math.min(lo, d);
    hi = Math.max(hi, d);
  }
  const sp = m.spacing ?? 1.8;
  const out: P[][] = [];
  if (m.fib === 1) {
    // fibres along the axis
    for (let d = lo + sp * 0.5; d < hi; d += sp) {
      const pts: P[] = [];
      const n = Math.max(2, Math.ceil(L / 6));
      for (let k = -1; k <= n + 1; k++) {
        const t = k / n;
        const wob = 0.25 * noise1(t * 7 + d * 0.9, 2);
        pts.push(add(add(A, mul(ax, t * L)), mul(nx, d + wob)));
      }
      out.push(pts);
    }
  } else {
    // fibres across the axis direction (transverse)
    let lo2 = 1e9, hi2 = -1e9;
    for (const p of m.pts) {
      const d = (p.x - A.x) * ax.x + (p.y - A.y) * ax.y;
      lo2 = Math.min(lo2, d);
      hi2 = Math.max(hi2, d);
    }
    for (let d = lo + sp * 0.5; d < hi; d += sp) {
      const pts: P[] = [];
      const n = Math.max(2, Math.ceil((hi2 - lo2) / 6));
      for (let k = -1; k <= n + 1; k++) {
        const t = lo2 + ((hi2 - lo2) * k) / n;
        const wob = 0.22 * noise1(t * 0.15 + d * 1.3, 4);
        pts.push(add(add(A, mul(ax, t)), mul(nx, d + wob + 0.02 * t)));
      }
      out.push(pts);
    }
  }
  return out;
};
const FIBRES = MUSCLES.map(fibreLines);

/** the deep red tissue bed inside the forearm and hand: muscle masses with restrained fibres, a few tendons */
export const DeepTissue: React.FC<{id: string; s: ArmState}> = ({id, s}) => {
  const outD = armOutlinePath(s);
  return (
    <g>
      <defs>
        <radialGradient id={`${id}-bed`} gradientUnits="userSpaceOnUse" cx={-6} cy={-30} r={160} fx={-20} fy={-60}>
          <stop offset={0} stopColor={mix(C.cavity, C.muscle, 0.3)} />
          <stop offset={0.6} stopColor={C.cavity} />
          <stop offset={1} stopColor={mix(C.cavity, '#000000', 0.25)} />
        </radialGradient>
      </defs>
      <path d={outD} fill={`url(#${id}-bed)`} />
      {MUSCLES.map((m, i) => {
        const [A, B] = m.axis;
        const ax = nrm(sub(B, A)), nx = perp(ax);
        const mid = lerpP(A, B, 0.5);
        const nl = nx.x * LIGHT.x + nx.y * LIGHT.y >= 0 ? nx : mul(nx, -1);
        let wHalf = 0;
        for (const p of m.pts) wHalf = Math.max(wHalf, Math.abs((p.x - mid.x) * nx.x + (p.y - mid.y) * nx.y));
        const g0 = add(mid, mul(nl, wHalf)), g1 = add(mid, mul(nl, -wHalf));
        const base = mix(C.muscle, C.cavity, 0.14 + (m.tone ?? 0));
        const d = closed(m.pts, 1);
        return (
          <g key={i}>
            <defs>
              <linearGradient id={`${id}-m${i}`} gradientUnits="userSpaceOnUse" x1={g0.x} y1={g0.y} x2={g1.x} y2={g1.y}>
                <stop offset={0} stopColor={mix(base, C.cavity, 0.3)} />
                <stop offset={0.16} stopColor={mix(C.muscleLit, base, 0.45)} />
                <stop offset={0.45} stopColor={base} />
                <stop offset={0.82} stopColor={mix(base, C.cavity, 0.4)} />
                <stop offset={1} stopColor={mix(base, C.cavity, 0.72)} />
              </linearGradient>
              <clipPath id={`${id}-mc${i}`}><path d={d} /></clipPath>
            </defs>
            <path d={d} fill={`url(#${id}-m${i})`} />
            <g clipPath={`url(#${id}-mc${i})`}>
              {FIBRES[i].map((pts, k) => (
                <path key={k} d={open(pts, 0.8)} fill="none" stroke={k % 2 ? mix(base, C.cavity, 0.55) : C.muscleFibre} strokeWidth={1.05} opacity={k % 2 ? 0.4 : 0.26} vectorEffect={NS} />
              ))}
              <path d={d} fill="none" stroke={mix(C.cavity, '#000000', 0.3)} strokeWidth={2.4} opacity={0.45} />
            </g>
          </g>
        );
      })}
      {TENDONS.map((t, i) => {
        const sh = t.pts.map((p) => add(p, pt(0.25, 0.3)));
        const hl = t.pts.map((p) => add(p, pt(-t.w * 0.35, 0)));
        return (
          <g key={`t${i}`}>
            <path d={open(sh, 0.8)} fill="none" stroke="#1E0408" strokeWidth={t.w * 2.5} opacity={0.4} strokeLinecap="round" />
            <path d={open(t.pts, 0.8)} fill="none" stroke={mix(C.tendonShade, C.muscle, 0.25)} strokeWidth={t.w * 2} strokeLinecap="round" />
            <path d={open(t.pts, 0.8)} fill="none" stroke={mix(C.tendon, C.tendonShade, 0.35)} strokeWidth={t.w * 1.35} strokeLinecap="round" />
            <path d={open(hl, 0.8)} fill="none" stroke="#FFF6F2" strokeWidth={t.w * 0.3} opacity={0.45} strokeLinecap="round" />
          </g>
        );
      })}
      {/* a few slow wet glints on the muscle */}
      {[pt(-27, 6), pt(17.5, 14), pt(-41, 40), pt(31, -80), pt(-38, -82), pt(-24, 50)].map((p, i) => (
        <path key={`g${i}`} d={`M${p.x - 1.4} ${p.y}Q${p.x} ${p.y - 0.6} ${p.x + 1.4} ${p.y}`} fill="none" stroke="#FFE6E2" strokeWidth={1.4} opacity={0.4} strokeLinecap="round" vectorEffect={NS} />
      ))}
    </g>
  );
};
