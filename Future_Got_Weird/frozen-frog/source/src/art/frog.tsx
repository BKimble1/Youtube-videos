// The wood frog (Lithobates sylvaticus), side view facing screen right. Units mm, y down, ground at y = 0.
// The trunk and head are drawn in a body frame (vent at the origin, snout at +x) and placed by a root point and a pitch;
// the limbs are solved in world space so the feet stay planted. Wood-frog markings: the dark mask from the snout
// through the eye to behind the eardrum, the pale upper-lip stripe, the dorsolateral folds, dark leg bars, a cream
// belly. Matte cel shading with an upper-left key light and one ink outline.
// Frozen: frost crystals spread over the skin from the ground contact upward, the skin pales, the lens clouds over (as
// a frozen wood frog's eyes do). Nothing about the anatomy moves when it freezes.
import React from 'react';
import {P, add, closed, dir, mul, open, pt, sub, tube} from '../core/geo';
import {mix, rgba} from '../core/color';
import {uid} from '../core/ids';
import {clamp, hash, lerp, ss} from '../lib';

export type FrogState = {
  root: P;          // world position of the vent
  pitch: number;    // body pitch, degrees (negative = nose up)
  hind: number;     // 0 folded (sitting) .. 1 fully extended (take-off)
  fore: number;     // 0 planted .. 1 reaching forward (flight, landing)
  crouch: number;   // 0..1 a lower, tenser sit before the jump
  frost: number;    // 0..1 frost spread over the skin
  pale: number;     // 0..1 frozen pallor
  cloud: number;    // 0..1 clouded lens
  blink: number;    // 0 open .. 1 shut
  throat: number;   // 0..1 the throat's breathing pump (inflation)
  wet: number;      // 0..1 meltwater beads on the skin
  look: number;     // -1..1 eye roll (pupil shift forward/back)
  cut?: {c: P; r: number; layers: number}; // the chest cutaway (body frame), radius mm, rim layers 0..1
  leaves?: number;  // 0..1 fallen leaves resting on the back (winter)
  t: number;
};

const SKIN = {lt: '#D9A06A', base: '#B97B4B', mid: '#9C6038', dk: '#6E3F22', ink: '#24150D', belly: '#EFE3C8', bellyDk: '#CDBB98',
  mask: '#3A2116', maskDk: '#24130C', lip: '#F4EBD6', fold: '#E2B888', bar: '#5A341C', iris: '#C9A13C', irisDk: '#7A5A1A'};
const FROST = {base: '#DCEBF4', lt: '#F7FCFF', blue: '#9CC3DD', deep: '#6F9CBD'};

// ---------------------------------------------------------------- body frame geometry
const OUT: [number, number][] = [
  [52, -1.4], [50.6, -4.4], [47.2, -7.4], [43, -9.9], [37.4, -10.9], [31.5, -10.9], [25, -12.4], [17, -14.4], [10, -16.2], [4.6, -16.4],
  [0.2, -13.2], [-2.2, -7.6], [-1.6, -1.4], [1.4, 3.8], [7.5, 7.4], [16, 8.6], [24, 8.0], [30.5, 6.0], [36.4, 3.8], [42, 2.4], [47, 1.4], [50.8, 0.4],
];
export const BODY = OUT.map(([x, y]) => pt(x, y));
export const EYE = pt(39.4, -10.2);
export const EYE_R = 4.3;
export const TYMP = pt(31.6, -6.2);
export const HEART_B = pt(26.8, 0.8);      // the heart, body frame
export const LIVER_B = pt(19.5, 2.2);
export const LUNG_B = pt(22, -6.4);
export const MICRO_B = pt(7, -8.6);       // where the camera enters the tissue: the back muscle under the spine
const SHOULDER_B = pt(33.4, 5.0);
const HIP_B = pt(2.2, -2.4);

const R = (deg: number) => (deg * Math.PI) / 180;
/** body frame -> world */
export const toWorld = (s: FrogState, p: P): P => {
  const a = R(s.pitch), c = Math.cos(a), sn = Math.sin(a);
  return pt(s.root.x + p.x * c - p.y * sn, s.root.y + p.x * sn + p.y * c);
};
export const SIT: Pick<FrogState, 'root' | 'pitch'> = {root: pt(-24, -7.2), pitch: -24};

// ---------------------------------------------------------------- limbs (world space)
type Chain = {pts: P[]; r: number[]};
const chain = (start: P, segs: [number, number][]): P[] => {
  const out = [start];
  let p = start;
  for (const [L, ang] of segs) {
    p = add(p, mul(dir(R(ang)), L));
    out.push(p);
  }
  return out;
};
const lerpA = (a: number, b: number, u: number) => a + (b - a) * u;
/** hind leg: thigh, shank, tarsus, toes (world angles). Sitting: the thigh runs forward and down to a low knee, the
 * shank folds back to the heel under the rump, the long foot runs forward along the ground. Take-off unfolds the knee
 * first, then the ankle, into one straight line behind the body. */
export const hindLeg = (s: FrogState, far = false): Chain => {
  const hip = toWorld(s, add(HIP_B, far ? pt(1.6, -1.2) : pt(0, 0)));
  const u = clamp(s.hind), cr = s.crouch;
  const k1 = ss(u, 0, 0.7), k2 = ss(u, 0.08, 0.85), k3 = ss(u, 0.2, 1);
  const dp = s.pitch + 24; // follow the body's pitch a little once the leg unfolds
  const th = lerpA(21 + 7 * cr, 152 + 0.4 * dp, k1);
  const sh = lerpA(175 - 3 * cr, 158 + 0.4 * dp, k2);
  const ta = lerpA(10, 160 + 0.4 * dp, k3);
  const to = lerpA(3, 166 + 0.4 * dp, k3);
  const pts = chain(hip, [[17, th], [16.5, sh], [10, ta], [12, to]]);
  return {pts, r: far ? [4.8, 3.0, 2.6, 1.5, 1.0] : [5.6, 3.6, 3.0, 1.7, 1.1]};
};
export const foreLeg = (s: FrogState, far = false): Chain => {
  const sh = toWorld(s, add(SHOULDER_B, far ? pt(-2.4, -0.6) : pt(0, 0)));
  const u = clamp(s.fore);
  const dp = s.pitch + 24;
  const a1 = lerpA(106 + 6 * s.crouch - dp, 30, u) + (far ? -5 : 0);
  const a2 = lerpA(70 - 0.5 * dp, 6, u) + (far ? 6 : 0);
  const pts = chain(sh, [[7.4, a1], [7.6, a2], [3.0, lerpA(10, -4, u)]]);
  return {pts, r: far ? [1.9, 1.35, 1.05, 0.9] : [2.3, 1.6, 1.2, 1.0]};
};

// ---------------------------------------------------------------- frost (fixed crystal sites in the body frame)
type Flake = {p: P; a: number; s: number; th: number; n: number};
/** frost sites (body frame): it nucleates where the body touches the frozen ground and climbs up and forward */
export const frostTh = (p: P, i = 0) => clamp(0.6 * (1 - (p.y + 16) / 25) + 0.26 * hash(i * 1.9 + 0.3) + 0.14 * Math.abs(p.x - 12) / 40);
const FLAKES: Flake[] = (() => {
  const out: Flake[] = [];
  for (let i = 0; i < 520; i++) {
    const x = -2.5 + hash(i * 3.17 + 1) * 55, y = -17 + hash(i * 7.31 + 2) * 26;
    const p = pt(x, y);
    out.push({p, a: -Math.PI / 2 + (hash(i * 5.3) - 0.5) * 2.2, s: 0.25 + hash(i * 2.2) ** 2 * 0.8, th: frostTh(p, i), n: 3 + Math.floor(hash(i * 8.8) * 3)});
  }
  return out;
})();
/** a rime tuft: a few fine needles fanned from one point, each with tiny side barbs */
const flakePath = (f: Flake, k: number) => {
  let d = '';
  for (let j = 0; j < f.n; j++) {
    const a = f.a + (j - (f.n - 1) / 2) * 0.55 + 0.25 * Math.sin(j * 7.1 + f.p.x);
    const L = f.s * k * (0.6 + 0.4 * Math.abs(Math.sin(j * 3.3 + f.p.y)));
    const e = add(f.p, mul(dir(a), L));
    d += `M${f.p.x.toFixed(3)} ${f.p.y.toFixed(3)}L${e.x.toFixed(3)} ${e.y.toFixed(3)}`;
    if (L > 0.5) {
      const m = add(f.p, mul(dir(a), L * 0.55));
      for (const sg of [-1, 1]) {
        const q = add(m, mul(dir(a + sg * 0.9), L * 0.22));
        d += `M${m.x.toFixed(3)} ${m.y.toFixed(3)}L${q.x.toFixed(3)} ${q.y.toFixed(3)}`;
      }
    }
  }
  return d;
};

// ---------------------------------------------------------------- the ice wave
/** the freezing front sweeps the body from the ground and rear up over the head: q rises along WAVE_N */
export const WAVE_N = pt(0.8, -0.6);
export const waveQ = (p: P) => p.x * WAVE_N.x + p.y * WAVE_N.y;
export const waveF = (frost: number) => lerp(4, 47, clamp(frost));
/** how far the front has passed a point (0 not yet .. 1 well behind the front) */
export const frozenAt = (frost: number, p: P, soft = 6) => clamp((waveF(frost) - waveQ(p)) / soft);
const halfPlane = (F: number, back: number) => {
  const tg = pt(0.6, 0.8);
  const p0 = mul(WAVE_N, F), p1 = mul(WAVE_N, F - back);
  const a = add(p0, mul(tg, 120)), b = add(p0, mul(tg, -120)), c = add(p1, mul(tg, -120)), d = add(p1, mul(tg, 120));
  return `M${a.x} ${a.y}L${b.x} ${b.y}L${c.x} ${c.y}L${d.x} ${d.y}Z`;
};

// ---------------------------------------------------------------- the frog
export const Frog: React.FC<{s: FrogState; anatomy?: React.ReactNode; legsOnly?: boolean}> = ({s, anatomy}) => {
  const ids = {skin: uid('fs'), belly: uid('fb'), clip: uid('fc'), cut: uid('fk'), soft: uid('fo'), leg: uid('fl'), rim: uid('fr'), eye: uid('fe'), frost: uid('ff'), sh: uid('fh'), cav: uid('fv')};
  const fr = clamp(s.frost), pale = clamp(s.pale);
  const skin = (c: string) => mix(c, '#C9D2D8', 0.55 * pale);
  const body = closed(BODY, 0.82);
  // throat pump: the gular region swells
  const th = s.throat;
  const bodyPts = BODY.map((p) => (p.x > 31 && p.x < 49 && p.y > 0 ? add(p, pt(0, th * 1.6 * Math.sin(Math.PI * clamp((p.x - 31) / 18)))) : p));
  const bodyD = closed(bodyPts, 0.82);
  void body;
  const hF = hindLeg(s, true), hN = hindLeg(s), fF = foreLeg(s, true), fN = foreLeg(s);
  /** one limb segment: a tapered capsule with a slight muscle swell */
  const seg = (a: P, b: P, ra: number, rb: number, swell = 1.08) => closed(tube([a, lerpP(a, b, 0.42), b], [ra, ((ra + rb) / 2) * swell, rb], true, true).outline, 0.6);
  const transform = `translate(${s.root.x} ${s.root.y}) rotate(${s.pitch})`;
  const bars = (a: P, b: P, ra: number, rb: number, k0: string, n: number) => {
    // dark crossbars across a segment (clipped to it by the caller)
    const v = sub(b, a), L = Math.hypot(v.x, v.y), u = mul(v, 1 / L), nrm = pt(-u.y, u.x);
    const out: React.ReactNode[] = [];
    for (let k = 1; k <= n; k++) {
      const m = add(a, mul(v, k / (n + 1)));
      const r = lerp(ra, rb, k / (n + 1)) * 1.6;
      const p1 = add(m, mul(nrm, r)), p2 = add(m, mul(nrm, -r));
      const q = mul(u, Math.min(1.5, L * 0.08));
      out.push(<path key={`${k0}${k}`} d={`M${p1.x} ${p1.y}L${p2.x} ${p2.y}L${p2.x + q.x} ${p2.y + q.y}L${p1.x + q.x} ${p1.y + q.y}Z`} fill={skin(SKIN.bar)} opacity={0.8} />);
    }
    return out;
  };
  const footWeb = (c: Chain, far: boolean) => {
    // the long webbed toes, fanned along the ground
    const ank = c.pts[3], tip = c.pts[4];
    const v = sub(tip, ank), L = Math.hypot(v.x, v.y), base = Math.atan2(v.y, v.x);
    const toes = [-0.2, -0.08, 0.04, 0.14].map((da, i) => add(ank, mul(dir(base + da * (1 - 0.4 * s.hind)), L * [0.78, 1.0, 0.92, 0.7][i])));
    const web = closed([ank, ...toes.map((q, i) => (i === 0 ? q : add(lerpP(ank, q, 0.62), pt(0, 0)))), ...toes.slice(0).reverse()].slice(0, 6), 0.5);
    void web;
    return (
      <g>
        <path d={`M${ank.x} ${ank.y} ${toes.map((q) => `L${q.x} ${q.y}`).join(' ')} Z`} fill={rgba(skin(far ? SKIN.dk : SKIN.mid), 0.75)} stroke={SKIN.ink} strokeWidth={0.18} strokeLinejoin="round" />
        {toes.map((q, i) => (
          <g key={i}>
            <path d={open([ank, lerpP(ank, q, 0.5), q])} stroke={SKIN.ink} strokeWidth={0.95} strokeLinecap="round" fill="none" />
            <path d={open([ank, lerpP(ank, q, 0.5), q])} stroke={skin(far ? SKIN.dk : SKIN.base)} strokeWidth={0.6} strokeLinecap="round" fill="none" />
            <circle cx={q.x} cy={q.y} r={0.42} fill={skin(SKIN.base)} stroke={SKIN.ink} strokeWidth={0.12} />
          </g>
        ))}
      </g>
    );
  };
  const hand = (c: Chain, far: boolean) => {
    const w = c.pts[2], tip = c.pts[3];
    const base = Math.atan2(tip.y - w.y, tip.x - w.x);
    return [-0.55, -0.15, 0.25, 0.6].map((da, i) => {
      const q = add(w, mul(dir(base + da), 3.2 - Math.abs(da) * 1.2));
      return (
        <g key={i}>
          <path d={`M${w.x} ${w.y}L${q.x} ${q.y}`} stroke={SKIN.ink} strokeWidth={1.0} strokeLinecap="round" />
          <path d={`M${w.x} ${w.y}L${q.x} ${q.y}`} stroke={skin(far ? SKIN.dk : SKIN.base)} strokeWidth={0.62} strokeLinecap="round" />
        </g>
      );
    });
  };
  // the front reaches the hind legs first (low and at the rear), the forelegs later
  const legAt = (key: string) => (key.startsWith('h') ? (key.endsWith('th') ? 0.24 : 0.14) : key.endsWith('ua') ? 0.6 : 0.52);
  const segDraw = (a: P, b: P, ra: number, rb: number, far: boolean, key: string, nb: number) => {
    const d = seg(a, b, ra, rb);
    const cid = `${ids.leg}${key}`;
    return (
      <g key={key}>
        <defs><clipPath id={cid}><path d={d} /></clipPath></defs>
        <path d={d} fill={SKIN.ink} stroke={SKIN.ink} strokeWidth={0.5} strokeLinejoin="round" />
        <path d={d} fill={far ? skin(mix(SKIN.mid, SKIN.dk, 0.45)) : `url(#${ids.leg})`} />
        <g clipPath={`url(#${cid})`}>
          {nb > 0 && <g opacity={far ? 0.6 : 1}>{bars(a, b, ra, rb, key, nb)}</g>}
          {/* top light along the upper edge */}
          {!far && <path d={seg(add(a, pt(0, -ra * 0.45)), add(b, pt(0, -rb * 0.45)), ra * 0.45, rb * 0.45)} fill={skin(SKIN.lt)} opacity={0.35} />}
          {fr > 0.02 && <rect x={Math.min(a.x, b.x) - 8} y={Math.min(a.y, b.y) - 8} width={Math.abs(a.x - b.x) + 16} height={Math.abs(a.y - b.y) + 16} fill={FROST.base} opacity={0.5 * ss(fr, legAt(key) - 0.06, legAt(key) + 0.1)} />}
        </g>
      </g>
    );
  };
  const limb = (c: Chain, far: boolean, kind: 'h' | 'f') => {
    const P_ = c.pts, r = c.r;
    if (kind === 'h') {
      return (
        <g>
          {footWeb(c, far)}
          {segDraw(P_[2], P_[3], r[2], r[3], far, (far ? 'hf' : 'hn') + 'ta', 0)}
          {segDraw(P_[1], P_[2], r[1], r[2], far, (far ? 'hf' : 'hn') + 'sh', 3)}
          {segDraw(P_[0], P_[1], r[0], r[1], far, (far ? 'hf' : 'hn') + 'th', 3)}
        </g>
      );
    }
    return (
      <g>
        {hand(c, far)}
        {segDraw(P_[1], P_[2], r[1], r[2], far, (far ? 'ff' : 'fn') + 'fa', 0)}
        {segDraw(P_[0], P_[1], r[0], r[1], far, (far ? 'ff' : 'fn') + 'ua', 0)}
      </g>
    );
  };
  // the eye
  const eyeC = EYE;
  const lid = clamp(s.blink);
  // frost crystals (body frame)
  const F = waveF(fr);
  const flakes = FLAKES.filter((f) => waveQ(f.p) + f.th * 5 < F).map((f, i) => {
    const g = clamp((F - waveQ(f.p) - f.th * 5) / 5);
    return (
      <g key={i}>
        <path d={flakePath(f, 0.3 + 0.7 * g)} stroke={FROST.lt} strokeWidth={0.07 + 0.04 * g} strokeLinecap="round" opacity={0.85 * g} />
        <circle cx={f.p.x} cy={f.p.y} r={0.07 + 0.05 * g} fill="#FFFFFF" opacity={0.8 * g} />
      </g>
    );
  });
  const cut = s.cut && s.cut.r > 0.02 ? s.cut : undefined;
  const cutW = cut ? {c: toWorld(s, cut.c), r: cut.r + 1.1} : undefined;
  // wet beads (melt)
  const beads: React.ReactNode[] = [];
  if (s.wet > 0.02) {
    for (let i = 0; i < 46; i++) {
      const f = FLAKES[(i * 3) % FLAKES.length];
      const r = (0.35 + 0.45 * hash(i * 9.1)) * clamp(s.wet * 1.4 - hash(i * 1.3) * 0.4);
      if (r < 0.05) continue;
      const slide = (s.t * 0.9 + hash(i)) % 1;
      const p = add(f.p, pt(0, slide * 1.2 * hash(i * 4.1)));
      beads.push(
        <g key={i}>
          <circle cx={p.x} cy={p.y} r={r} fill="rgba(210,235,255,0.35)" stroke="rgba(30,40,60,0.55)" strokeWidth={0.1} />
          <circle cx={p.x - r * 0.35} cy={p.y - r * 0.35} r={r * 0.32} fill="#FFFFFF" opacity={0.9} />
        </g>,
      );
    }
  }
  return (
    <g>
      <defs>
        <linearGradient id={ids.skin} x1="0.2" y1="0" x2="0.35" y2="1">
          <stop offset={0} stopColor={skin(SKIN.lt)} />
          <stop offset={0.45} stopColor={skin(SKIN.base)} />
          <stop offset={0.8} stopColor={skin(SKIN.mid)} />
        </linearGradient>
        <linearGradient id={ids.belly} x1="0" y1="0" x2="0" y2="1">
          <stop offset={0} stopColor={skin(SKIN.belly)} />
          <stop offset={1} stopColor={skin(SKIN.bellyDk)} />
        </linearGradient>
        <linearGradient id={ids.leg} x1="0" y1="0" x2="0" y2="1">
          <stop offset={0} stopColor={skin(SKIN.base)} />
          <stop offset={1} stopColor={skin(SKIN.mid)} />
        </linearGradient>
        <radialGradient id={ids.eye} cx="0.42" cy="0.38" r="0.62">
          <stop offset={0} stopColor={mix('#E8C760', '#D9E2E8', s.cloud * 0.8)} />
          <stop offset={0.6} stopColor={mix(SKIN.iris, '#C5D0D8', s.cloud * 0.8)} />
          <stop offset={1} stopColor={mix(SKIN.irisDk, '#8C99A6', s.cloud * 0.8)} />
        </radialGradient>
        <radialGradient id={ids.cav} cx="0.5" cy="0.5" r="0.5">
          <stop offset={0.55} stopColor="#000" stopOpacity={0} />
          <stop offset={1} stopColor="#000" stopOpacity={0.55} />
        </radialGradient>
        <clipPath id={ids.clip}><path d={bodyD} /></clipPath>
        {cut && <clipPath id={ids.cut}><circle cx={cut.c.x} cy={cut.c.y} r={cut.r} /></clipPath>}
        {cut && (
          <mask id={ids.frost} maskUnits="userSpaceOnUse" x={-10} y={-25} width={75} height={40}>
            <rect x={-10} y={-25} width={75} height={40} fill="#FFF" />
            <circle cx={cut.c.x} cy={cut.c.y} r={cut.r + 0.3} fill="#000" />
          </mask>
        )}
        <filter id={ids.soft} x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation={0.5} /></filter>
      </defs>
      {/* far limbs */}
      {limb(hF, true, 'h')}
      {limb(fF, true, 'f')}
      {/* the trunk and head */}
      <g transform={transform}>
        <path d={bodyD} fill={SKIN.ink} stroke={SKIN.ink} strokeWidth={0.9} strokeLinejoin="round" />
        <path d={bodyD} fill={`url(#${ids.skin})`} />
        <g clipPath={`url(#${ids.clip})`}>
          {/* cream belly and throat below the lateral line */}
          <path d={closed([pt(-2, 1.5), pt(8, 2.2), pt(18, 2.6), pt(28, 1.6), pt(36, 0.6), pt(44, 0.4), pt(52, 0.2), pt(52, 12), pt(-2, 12)], 0.6)} fill={`url(#${ids.belly})`} />
          <path d={open([pt(-2, 1.5), pt(8, 2.2), pt(18, 2.6), pt(28, 1.6), pt(36, 0.6), pt(44, 0.4)])} stroke={skin(SKIN.mid)} strokeWidth={0.9} fill="none" opacity={0.5} filter={`url(#${ids.soft})`} />
          {/* back spots */}
          {[[8, -9.5, 1.3], [15, -10.6, 1.0], [21, -9.2, 0.9], [4.5, -7, 1.1], [12, -6.4, 0.8], [26, -9.9, 0.7], [18, -6.8, 0.7]].map(([x, y, r], i) => (
            <ellipse key={i} cx={x} cy={y} rx={r * 1.3} ry={r * 0.8} fill={skin(SKIN.dk)} opacity={0.55} />
          ))}
          {/* dorsolateral fold: pale ridge with a shadow line under it */}
          <path d={open([pt(35, -8.8), pt(28, -10.2), pt(18, -11.3), pt(8, -11.4), pt(2.5, -9.8)])} stroke={skin(SKIN.dk)} strokeWidth={0.8} fill="none" opacity={0.55} transform="translate(0 0.75)" />
          <path d={open([pt(35, -8.8), pt(28, -10.2), pt(18, -11.3), pt(8, -11.4), pt(2.5, -9.8)])} stroke={skin(SKIN.fold)} strokeWidth={0.75} fill="none" strokeLinecap="round" />
          {/* the mask: snout through the eye to behind the eardrum */}
          <path d={closed([pt(51.8, -1.6), pt(48, -4.6), pt(43.5, -7.2), pt(37, -8.6), pt(30.5, -9.4), pt(26.4, -7.2), pt(25.6, -3.2), pt(28.2, -0.6), pt(34, -0.6), pt(42, -0.2), pt(49, -0.4)], 0.7)} fill={skin(SKIN.mask)} opacity={0.94} />
          {/* pale upper-lip stripe */}
          <path d={closed([pt(51.4, -0.4), pt(46, 0.0), pt(39, 0.3), pt(32, 0.9), pt(27.2, 1.0), pt(26.6, 2.4), pt(31, 2.6), pt(39, 1.7), pt(46, 1.1), pt(50.8, 0.6)], 0.6)} fill={skin(SKIN.lip)} />
          {/* top-light sheen along the back, shade under the belly */}
          <path d={open([pt(44, -8.6), pt(34, -10.4), pt(20, -11.8), pt(8, -12.2)])} stroke={skin('#F2C79A')} strokeWidth={0.9} fill="none" opacity={0.55} filter={`url(#${ids.soft})`} />
          <path d={open([pt(2, 4.5), pt(14, 6.4), pt(28, 5.8)])} stroke={skin('#8E7650')} strokeWidth={1.6} fill="none" opacity={0.45} filter={`url(#${ids.soft})`} />
        </g>
        {/* eardrum */}
        <circle cx={TYMP.x} cy={TYMP.y} r={2.7} fill={skin(SKIN.maskDk)} stroke={SKIN.ink} strokeWidth={0.22} />
        <circle cx={TYMP.x - 0.5} cy={TYMP.y - 0.5} r={1.5} fill={skin(SKIN.mask)} opacity={0.8} />
        {/* mouth line and nostril */}
        <path d={open([pt(51.6, -0.3), pt(45, -0.1), pt(37, 0.3), pt(31.4, 0.9), pt(29.6, 2.1)])} stroke={SKIN.ink} strokeWidth={0.32} fill="none" strokeLinecap="round" />
        <ellipse cx={49.2} cy={-4.1} rx={0.5} ry={0.32} fill={SKIN.ink} transform="rotate(-30 49.2 -4.1)" />
        {/* the eye: a bulging dome, golden iris, horizontal pupil */}
        <ellipse cx={eyeC.x - 0.2} cy={eyeC.y + 0.6} rx={EYE_R + 1.15} ry={EYE_R + 0.75} fill={skin(SKIN.mask)} stroke={SKIN.ink} strokeWidth={0.32} />
        <circle cx={eyeC.x} cy={eyeC.y} r={EYE_R} fill={`url(#${ids.eye})`} stroke={SKIN.ink} strokeWidth={0.3} />
        {/* iris flecks */}
        {Array.from({length: 14}, (_, i) => {
          const a = (i / 14) * Math.PI * 2;
          const p1 = add(eyeC, mul(dir(a), 1.9)), p2 = add(eyeC, mul(dir(a + 0.08), 3.6));
          return <path key={i} d={`M${p1.x} ${p1.y}L${p2.x} ${p2.y}`} stroke={mix(SKIN.irisDk, '#9AA6B0', s.cloud)} strokeWidth={0.18} opacity={0.5} />;
        })}
        <ellipse cx={eyeC.x + 0.45 * s.look} cy={eyeC.y + 0.1} rx={2.3} ry={1.15} fill={mix('#0B0705', '#5C6670', s.cloud * 0.7)} />
        {/* the frozen lens: a milky film */}
        <circle cx={eyeC.x} cy={eyeC.y} r={EYE_R - 0.1} fill="#EEF4F8" opacity={0.62 * s.cloud} />
        <ellipse cx={eyeC.x - 1.4} cy={eyeC.y - 1.6} rx={1.15} ry={0.75} fill="#FFFFFF" opacity={0.95 - 0.4 * s.cloud} transform={`rotate(-30 ${eyeC.x - 1.4} ${eyeC.y - 1.6})`} />
        <circle cx={eyeC.x + 1.7} cy={eyeC.y + 1.4} r={0.35} fill="#FFFFFF" opacity={0.6} />
        {/* eyelid (the lower lid rises over the eye, as frogs blink) */}
        {lid > 0.01 && (
          <g clipPath={undefined}>
            <path d={`M${eyeC.x - EYE_R - 0.3} ${eyeC.y} A${EYE_R + 0.3} ${EYE_R + 0.3} 0 0 0 ${eyeC.x + EYE_R + 0.3} ${eyeC.y} L${eyeC.x + EYE_R + 0.3} ${eyeC.y + EYE_R} L${eyeC.x - EYE_R - 0.3} ${eyeC.y + EYE_R} Z`}
              transform={`translate(0 ${(1 - lid) * (EYE_R * 2 + 0.4)})`} fill={skin(SKIN.mask)} stroke={SKIN.ink} strokeWidth={0.25} clipPath={undefined} opacity={1} />
          </g>
        )}
        {/* fallen leaves draped over the back */}
        {(s.leaves ?? 0) > 0.01 && <BackLeaves k={s.leaves!} />}
        {/* the chest cutaway: a cleanly cut window through the skin layers into the body */}
        {cut && (
          <g>
            <g clipPath={`url(#${ids.clip})`}>
              <g clipPath={`url(#${ids.cut})`}>
                <rect x={cut.c.x - cut.r} y={cut.c.y - cut.r} width={cut.r * 2} height={cut.r * 2} fill="#3B0E16" />
                {anatomy}
                <circle cx={cut.c.x} cy={cut.c.y} r={cut.r} fill={`url(#${ids.cav})`} />
              </g>
              {/* the cut skin: brown skin, cream dermis, red body wall (layered rim) */}
              <circle cx={cut.c.x} cy={cut.c.y} r={cut.r + 0.05} fill="none" stroke="#8E2F2B" strokeWidth={0.9 * cut.layers + 0.15} />
              <circle cx={cut.c.x} cy={cut.c.y} r={cut.r + 0.55 * cut.layers + 0.1} fill="none" stroke={skin('#F1DEC0')} strokeWidth={0.45 * cut.layers + 0.1} />
              <circle cx={cut.c.x} cy={cut.c.y} r={cut.r + 0.95 * cut.layers + 0.2} fill="none" stroke={SKIN.ink} strokeWidth={0.28} />
            </g>
          </g>
        )}
        {/* frost: pale glaze, then crystals */}
        {fr > 0.01 && (
          <g clipPath={`url(#${ids.clip})`} mask={cut ? `url(#${ids.frost})` : undefined}>
            {/* behind the front: a frosted glaze; at the front: a bright advancing edge */}
            <path d={halfPlane(F - 1.5, 200)} fill={FROST.base} opacity={0.34 * (cut ? 0.85 : 1)} />
            {fr < 0.995 && <path d={halfPlane(F + 1.2, 6)} fill="#F2FBFF" opacity={0.6} filter={`url(#${ids.soft})`} />}
            {fr < 0.995 && <path d={halfPlane(F, 0.5)} fill="#FFFFFF" opacity={0.85} />}
            <g>{flakes}</g>
          </g>
        )}
        {beads.length > 0 && <g clipPath={`url(#${ids.clip})`} mask={cut ? `url(#${ids.frost})` : undefined}>{beads}</g>}
      </g>
      {/* near limbs (cut away inside the window, like everything in front of the cut plane) */}
      {cutW ? (
        <>
          <defs>
            <mask id={ids.rim} maskUnits="userSpaceOnUse" x={cutW.c.x - 200} y={cutW.c.y - 200} width={400} height={400}>
              <rect x={cutW.c.x - 200} y={cutW.c.y - 200} width={400} height={400} fill="#FFF" />
              <circle cx={cutW.c.x} cy={cutW.c.y} r={cutW.r} fill="#000" />
            </mask>
          </defs>
          <g mask={`url(#${ids.rim})`}>
            {limb(hN, false, 'h')}
            {limb(fN, false, 'f')}
          </g>
        </>
      ) : (
        <>
          {limb(hN, false, 'h')}
          {limb(fN, false, 'f')}
        </>
      )}
    </g>
  );
};
const lerpP = (a: P, b: P, u: number) => pt(a.x + (b.x - a.x) * u, a.y + (b.y - a.y) * u);

/** two oak leaves resting on the frog's back (body frame) */
const BackLeaves: React.FC<{k: number}> = ({k}) => (
  <g opacity={clamp(k * 2)}>
    <Leaf c={pt(12, -12.6)} ang={-8} len={17} col="#8A5A2B" />
    <Leaf c={pt(-0.5, -10)} ang={-62} len={13} col="#6E4424" />
  </g>
);
export const Leaf: React.FC<{c: P; ang: number; len: number; col: string; lobes?: boolean; frost?: number}> = ({c, ang, len, col, lobes = true, frost = 0}) => {
  // an oak-like lobed leaf: built along its midrib
  const pts: P[] = [];
  const n = 9;
  for (let i = 0; i <= n; i++) {
    const u = i / n;
    const w = Math.sin(Math.PI * u) ** 0.8 * len * 0.3 * (lobes ? 0.75 + 0.25 * Math.cos(u * Math.PI * 7) : 1);
    pts.push(pt(-len / 2 + u * len, -w));
  }
  for (let i = n; i >= 0; i--) {
    const u = i / n;
    const w = Math.sin(Math.PI * u) ** 0.8 * len * 0.28 * (lobes ? 0.75 + 0.25 * Math.cos(u * Math.PI * 7 + 0.6) : 1);
    pts.push(pt(-len / 2 + u * len, w));
  }
  return (
    <g transform={`translate(${c.x} ${c.y}) rotate(${ang})`}>
      <path d={closed(pts, 0.7)} fill={mix(col, '#DDE8F0', frost * 0.55)} stroke="#2A170C" strokeWidth={Math.max(0.15, len * 0.018)} strokeLinejoin="round" />
      <path d={`M${-len / 2 - len * 0.08} 0L${len / 2} 0`} stroke={mix(col, '#2A170C', 0.4)} strokeWidth={Math.max(0.12, len * 0.02)} />
      {[0.25, 0.45, 0.65].map((u, i) => (
        <path key={i} d={`M${-len / 2 + u * len} 0l${len * 0.1} ${-len * 0.13}M${-len / 2 + u * len} 0l${len * 0.1} ${len * 0.12}`} stroke={mix(col, '#2A170C', 0.3)} strokeWidth={Math.max(0.08, len * 0.012)} />
      ))}
    </g>
  );
};
