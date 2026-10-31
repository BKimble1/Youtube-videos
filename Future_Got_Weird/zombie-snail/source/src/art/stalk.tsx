// The snail's upper tentacle (eyestalk), healthy or filled by a Leucochloridium broodsac.
// Healthy: a slim, wrinkled, translucent grey tentacle with the eye on a small bulb at its tip.
// Infected: the broodsac swells the tentacle from its base upward to several times its width; the skin stretches thin
// and the sac's banded pattern (lime, deep green, cream and yellow rings, a dark ring and black flecks near the tip)
// shows through it. The sac pulses: a contraction wave runs from base to tip, the rings bunch and stretch, and the
// whole tentacle twitches, which is what makes it read as a caterpillar. Everything is in world millimetres.
import React from 'react';
import {add, across, closed, dir, lerpP, mul, nrm, open, P, perp, poly, sub, tube} from '../core/geo';
import {uid} from '../core/ids';
import {clamp, lerp, sm} from '../lib';
import {mix, rgba} from '../core/color';

export type StalkState = {
  base: P;
  ang: number; // direction at the base (radians, SVG: -PI/2 is straight up)
  bend: number; // total turn along the length (radians)
  Ln: number; // healthy length
  Ls: number; // swollen length
  rn: number; // healthy radius
  rmax: number; // swollen radius
  S: number; // swelling 0..1 (spreads from the base to the tip)
  band: number; // visibility of the sac's rings 0..1
  t: number;
  pulse: number; // pulse strength 0..1
  freq?: number;
  phase?: number;
  retract?: number; // 0 extended .. 1 drawn into the head
  wound?: number; // the stub left after a bird tears the sac off (0..1)
  far?: boolean;
  xray?: number; // 0..1: the skin turns glassy (inside view)
  vivid?: number; // 0..1: extra colour saturation (the lure at full strength)
  skin?: string;
  cut?: number; // 0..1: a lengthwise cutaway opens from the tip down, showing the sac and its larvae
  dev?: number; // 0..1: the larvae inside the sac develop (germ balls -> larvae)
  bulge?: number; // strength of the travelling contraction bulge (default = pulse)
  glass?: number; // 0..1: the skin turns translucent and the sac's living interior shows through (V4 hook)
};

export const SKIN = '#9C9583';
// the broodsac's rings, base (v = 0) to tip (v = 1)
const RINGS: [number, number, string][] = (() => {
  const out: [number, number, string][] = [[0, 0.16, '#A9C84C']];
  let v = 0.16;
  const unit: [number, string][] = [[0.032, '#1F431B'], [0.016, '#4F8C2A'], [0.036, '#F3EFCF'], [0.024, '#E9CF3A'], [0.012, '#8CBB3C']];
  while (v < 0.78) {
    for (const [w, c] of unit) {
      out.push([v, Math.min(0.8, v + w), c]);
      v += w;
      if (v >= 0.8) break;
    }
  }
  out.push([0.8, 0.865, '#203F18'], [0.865, 1.01, '#93C43E']);
  return out;
})();
const FLECKS = Array.from({length: 11}, (_, k) => ({u: 0.885 + ((k * 0.37) % 1) * 0.09, s: -0.75 + ((k * 0.61) % 1) * 1.5, r: 0.05 + ((k * 0.29) % 1) * 0.05}));

export const stalkGeom = (st: StalkState) => {
  const N = 44;
  const ret = st.retract ?? 0;
  const wound = st.wound ?? 0;
  const f = st.freq ?? 1.55;
  const ph = st.phase ?? 0;
  const S = st.S;
  const Lfull = lerp(st.Ln, st.Ls, sm(S));
  const L = Lfull * (1 - 0.86 * ret) * (1 - 0.72 * wound);
  const w = 2 * Math.PI * (f * st.t) + ph;
  const pulse = st.pulse;
  // local swelling: from the base upward
  const sw = (u: number) => sm(clamp((S * 1.45 - 0.45 * u) / 1.0));
  // a contraction bulge travelling from the base to the tip once per beat
  const bulgeK = (st.bulge ?? pulse) * 1;
  const uw = ((((f * st.t + ph / (2 * Math.PI)) % 1) + 1) % 1) * 1.3 - 0.15;
  const bulgeAt = (u: number) => bulgeK * Math.exp(-Math.pow((u - uw) / 0.11, 2));
  const C: P[] = [];
  const R: number[] = [];
  let p = st.base;
  const d0 = L / (N - 1);
  for (let i = 0; i < N; i++) {
    const u = i / (N - 1);
    // twitch and an inching wave along the tentacle
    const wig = pulse * (0.07 * Math.sin(w - 3.2 * u) * u + 0.035 * Math.sin(2 * w + 1.3));
    // the bulge pushes the tentacle sideways as it passes (asymmetric, organic)
    const bz = bulgeAt(u);
    const a = st.ang + st.bend * u + wig * sw(u) + 0.16 * bulgeK * Math.cos(Math.PI * 2 * (u - uw)) * Math.exp(-Math.pow((u - uw) / 0.22, 2)) * sw(u) + 0.0 * bz;
    if (i > 0) p = add(p, mul(dir(a), d0));
    C.push(p);
    const rn = lerp(st.rn, st.rn * 0.78, u) + st.rn * 0.3 * sm((u - 0.84) / 0.16) - st.rn * 0.25 * sm((u - 0.97) / 0.03);
    const bump = Math.pow(Math.sin(Math.PI * (0.09 + 0.83 * u)), 0.55);
    const baseNeck = lerp(0.5, 1, sm(u / 0.16));
    const contraction = 1 + pulse * 0.07 * Math.sin(w - 2 * Math.PI * 1.1 * u) + pulse * 0.04 * Math.sin(2 * w) + 0.24 * bulgeAt(u) - 0.06 * bulgeK * Math.exp(-Math.pow((u - uw + 0.2) / 0.1, 2));
    const rs = st.rmax * (0.36 + 0.64 * bump) * baseNeck * contraction;
    R.push(Math.max(0.05, lerp(rn, rs, sw(u))));
  }
  if (wound > 0) for (let i = 0; i < N; i++) R[i] = lerp(R[i], st.rn * 1.25 * (1 - 0.35 * (i / (N - 1))), wound);
  const tb = tube(C, R, true, false);
  // ring coordinate: the rings bunch toward the base on each contraction and stretch on the release
  const vOf = (u: number) => clamp(u + pulse * 0.03 * Math.sin(w - 2.5 * u) * Math.sin(Math.PI * u) - 0.025 * bulgeK * Math.sin(Math.PI * clamp((u - uw + 0.15) / 0.3)) * (u > uw - 0.15 && u < uw + 0.15 ? 1 : 0), 0, 1);
  return {tb, L, sw, vOf, w, N, uw, bulgeK};
};

/** interpolated point across the tube at fractional position u (0 base .. 1 tip), s in [-1, 1] */
const at = (g: ReturnType<typeof stalkGeom>, u: number, s: number) => {
  const x = clamp(u, 0, 1) * (g.N - 1);
  const i = Math.min(g.N - 2, Math.floor(x));
  const k = x - i;
  return lerpP(across(g.tb, i, s), across(g.tb, i + 1, s), k);
};
/** a ring boundary across the tube, bowed as a cylinder seen slightly from above */
const ringEdge = (g: ReturnType<typeof stalkGeom>, u: number, bow: number) => {
  const out: P[] = [];
  for (let k = 0; k <= 8; k++) {
    const s = -1 + (2 * k) / 8;
    out.push(at(g, u + bow * Math.sqrt(Math.max(0, 1 - s * s)), s * 0.999));
  }
  return out;
};

export const Stalk: React.FC<{st: StalkState; light?: P}> = ({st, light = {x: -0.55, y: -0.83}}) => {
  const g = stalkGeom(st);
  const {tb} = g;
  if (g.L < 0.05) return null;
  const id = uid('stk');
  const rmean = tb.rad.reduce((a, b) => a + b, 0) / tb.rad.length;
  const band = clamp(st.band) * (1 - (st.wound ?? 0));
  const xr = st.xray ?? 0;
  const cut = st.cut ?? 0;
  const trans = st.glass ?? 0;
  const vivid = st.vivid ?? 0;
  const skin = st.skin ?? SKIN;
  const outline = closed(tb.outline, 0.9);
  // which side faces the light
  const mid = Math.floor(tb.C.length * 0.5);
  const side = tb.N[mid].x * light.x + tb.N[mid].y * light.y > 0 ? 1 : -1;
  const bowK = 0.035 * (rmean / Math.max(0.3, g.L)) * 6;
  // the inverse of the ring coordinate (sampled)
  const us = Array.from({length: 121}, (_, k) => k / 120);
  const vs = us.map(g.vOf);
  const uOf = (v: number) => {
    for (let k = 1; k < vs.length; k++) if (vs[k] >= v) return us[k - 1] + ((v - vs[k - 1]) / (vs[k] - vs[k - 1] || 1)) * (us[k] - us[k - 1]);
    return 1;
  };
  const rings: React.ReactNode[] = [];
  if (band > 0.01) {
    RINGS.forEach(([v0, v1, c], k) => {
      const u0 = uOf(v0), u1 = uOf(Math.min(1, v1));
      if (u1 - u0 < 1e-3) return;
      const e0 = ringEdge(g, u0, bowK), e1 = ringEdge(g, Math.min(1.02, u1), bowK);
      const left: P[] = [], right: P[] = [];
      for (let q = 0; q <= 6; q++) {
        const u = u0 + ((u1 - u0) * q) / 6;
        left.push(at(g, u, 0.999));
        right.push(at(g, u, -0.999));
      }
      const col = vivid > 0 ? mix(c, c === '#F3EFCF' ? '#FFFBE0' : c === '#E9CF3A' ? '#FFE02A' : c === '#1F431B' || c === '#203F18' ? '#0E3410' : '#9EE03A', 0.5 * vivid) : c;
      rings.push(<path key={k} d={poly([...e0, ...left.slice(1), ...[...e1].reverse(), ...[...right].reverse().slice(1)])} fill={col} />);
    });
  }
  const swAvg = us.reduce((a, u) => a + g.sw(u), 0) / us.length;
  // highlight strip on the lit side
  const hl: P[] = [];
  const hr: number[] = [];
  for (let k = 2; k <= 40; k++) {
    const u = k / 42;
    hl.push(at(g, u, 0.42 * side));
    hr.push(0.1);
  }
  const wrinkles: React.ReactNode[] = [];
  const nW = Math.round(g.L / 0.32);
  for (let k = 1; k < nW; k++) {
    const u = k / nW;
    const a = (1 - g.sw(u) * 0.9) * (1 - xr);
    if (a < 0.05) continue;
    wrinkles.push(<path key={k} d={open(ringEdge(g, u, bowK * 1.6))} fill="none" stroke="#3B3528" strokeWidth={rmean * 0.07} strokeOpacity={0.32 * a} />);
  }
  const tip = g.N - 1;
  const eyeP = at(g, 0.975, 0.18 * side);
  const eyeR = st.rn * (0.48 - 0.12 * g.sw(1));
  const fleck = FLECKS.map((q, k) => {
    const c = at(g, q.u, q.s);
    return <ellipse key={k} cx={c.x} cy={c.y} rx={q.r * st.rmax * 0.8} ry={q.r * st.rmax * 0.55} fill="#121A0C" opacity={0.85 * band} />;
  });
  const glass = 0.55 * xr;
  const baseFill = mix(skin, '#C8C9A0', 0.18 * swAvg);
  const tipC = tb.C[tip];
  const mA = across(tb, mid, 1.0), mB = across(tb, mid, -1.0);
  const lA = side > 0 ? mA : mB, dB = side > 0 ? mB : mA;
  const drawInterior = (cv: number, alpha: number, edges: boolean, key: string) => {
        // the cutaway window: the near half of the skin and of the sac wall removed, from the tip down
        const u0 = lerp(0.58, 0.07, sm(cv)), u1 = lerp(0.6, 0.965, sm(cv));
        const S0 = 0.74;
        // a lens-shaped opening: a slit that widens, round-ended (never a box)
        const uc = (u0 + u1) / 2, hw = Math.max(1e-3, (u1 - u0) / 2);
        const lens = (u: number) => Math.min(1, lerp(0.75, 1.8, sm(cv)) * Math.sqrt(Math.max(0, 1 - Math.pow((u - uc) / hw, 2))));
        const edge = (sv: number, a: number, b: number) => Array.from({length: 25}, (_, q) => {
          const u = a + ((b - a) * q) / 24;
          return at(g, u, sv * lens(u));
        });
        const win = [...edge(S0, u0, u1), ...edge(-S0, u0, u1).reverse()];
        const lum = [...edge(0.62, u0, u1), ...edge(-0.62, u0, u1).reverse()];
        const dv = clamp(st.dev ?? 1);
        const lar: React.ReactNode[] = [];
        // larvae packed in rows; they shuffle up the sac with every contraction
        for (let row = 0; row < 19; row++) {
          for (let col = 0; col < 3; col++) {
            const k = row * 3 + col;
            let u = 0.1 + row * 0.046 + (col % 2) * 0.023 + 0.012 * Math.sin(g.w - 6 * (0.1 + row * 0.046)) + 0.004 * Math.sin(st.t * 5 + k);
            if (u < u0 + 0.02 || u > u1 - 0.03) continue;
            const sv = -0.36 + col * 0.36 + 0.06 * Math.sin(k * 2.3 + st.t * 3);
            const c = at(g, u, sv);
            const tA = at(g, Math.min(1, u + 0.01), sv);
            const ang = (Math.atan2(tA.y - c.y, tA.x - c.x) * 180) / Math.PI + 18 * Math.sin(k * 1.7 + st.t * 4);
            const ri = at(g, u, 0).x - at(g, u, 1).x, rj = at(g, u, 0).y - at(g, u, 1).y;
            const rr = Math.hypot(ri, rj);
            const L = rr * (0.18 + 0.12 * dv) * (0.85 + 0.25 * ((k * 0.37) % 1));
            lar.push(
              <g key={k} transform={`translate(${c.x} ${c.y}) rotate(${ang})`}>
                <ellipse rx={L} ry={L * (0.62 - 0.12 * dv)} fill={mix('#CFE58A', '#F7F0D0', dv)} stroke="#6B5A1E" strokeWidth={L * 0.07} />
                {dv > 0.3 && <ellipse cx={-L * 0.05} rx={L * 0.62} ry={L * 0.34} fill="#D9A94E" opacity={0.75 * dv} />}
                {dv > 0.3 && <circle cx={L * 0.55} r={L * 0.17} fill="#8A5A1E" opacity={dv} />}
                {dv > 0.5 && <circle cx={-L * 0.1} r={L * 0.2} fill="#8A5A1E" opacity={0.8 * dv} />}
              </g>,
            );
          }
        }
        const musc = Array.from({length: 13}, (_, q) => at(g, u0 + ((u1 - 0.04 - u0) * q) / 12, -0.08 + 0.05 * Math.sin(q + st.t * 2)));
        return (
          <g key={key} opacity={alpha}>
            <path d={poly(win)} fill="#13200F" />
            <path d={poly(lum)} fill="#3E6E22" />
            <path d={poly(lum)} fill="#0C1A08" opacity={0.25} />
            <path d={open(musc)} fill="none" stroke="#B5605A" strokeWidth={rmean * 0.12} strokeOpacity={0.8} strokeLinecap="round" />
            <path d={open(musc)} fill="none" stroke="#E79A88" strokeWidth={rmean * 0.04} strokeOpacity={0.7} strokeDasharray={`${rmean * 0.05} ${rmean * 0.05}`} />
            <clipPath id={`${id}lw${key}`}>
              <path d={poly(lum)} />
            </clipPath>
            <g clipPath={`url(#${id}lw${key})`}>{lar}</g>
            {edges && (
              <g>
                {/* cut edges: the sac wall (lime) and the skin (fleshy grey-pink) */}
                <path d={open(edge(0.62, u0, u1))} fill="none" stroke="#B8F04A" strokeWidth={rmean * 0.06} />
                <path d={open(edge(-0.62, u0, u1))} fill="none" stroke="#B8F04A" strokeWidth={rmean * 0.06} />
                <path d={poly(win)} fill="#E9F3D6" opacity={0.1} />
                <path d={poly(win)} fill="none" stroke="#D8E6C4" strokeWidth={rmean * 0.16} strokeOpacity={0.45} filter={`url(#${id}h)`} />
                <path d={poly(win)} fill="none" stroke="#C9A497" strokeWidth={rmean * 0.06} strokeOpacity={0.8} />
              </g>
            )}
          </g>
        );
      };
  return (
    <g opacity={st.far ? 0.96 : 1}>
      <defs>
        <clipPath id={`${id}c`}>
          <path d={outline} />
        </clipPath>
        <linearGradient id={`${id}x`} gradientUnits="userSpaceOnUse" x1={lA.x} y1={lA.y} x2={dB.x} y2={dB.y}>
          <stop offset="0" stopColor="#FFFFFF" stopOpacity={0.12} />
          <stop offset="0.3" stopColor="#FFFFFF" stopOpacity={0} />
          <stop offset="0.62" stopColor="#000000" stopOpacity={0} />
          <stop offset="1" stopColor="#06120A" stopOpacity={st.far ? 0.62 : 0.5} />
        </linearGradient>
        <filter id={`${id}b`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation={Math.max(0.004, rmean * 0.022)} />
        </filter>
        <filter id={`${id}s`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation={Math.max(0.01, rmean * 0.28)} />
        </filter>
        <filter id={`${id}h`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation={Math.max(0.006, rmean * 0.08)} />
        </filter>
      </defs>
      {/* the body of the tentacle */}
      <path d={outline} fill={baseFill} opacity={1 - glass} />
      <g clipPath={`url(#${id}c)`}>
        {/* the sac seen through the stretched skin */}
        {band > 0.01 && (
          <g filter={`url(#${id}b)`} opacity={band}>
            <path d={outline} fill={mix('#93C23F', '#A6E040', 0.5 * vivid)} />
            {rings}
            {fleck}
          </g>
        )}
        {band > 0.01 && [0, 1, 2, 3, 4, 5].map((q) => {
          const u0 = q * 0.025, u1 = u0 + 0.03;
          const e: P[] = [];
          for (let z = 0; z <= 4; z++) e.push(at(g, u0 + ((u1 - u0) * z) / 4, 1));
          for (let z = 4; z >= 0; z--) e.push(at(g, u0 + ((u1 - u0) * z) / 4, -1));
          return <path key={`c${q}`} d={poly(e)} fill={skin} opacity={(1 - q / 6) * 0.9 * (1 - xr)} />;
        })}
        {/* stretched skin: a pale veil, thinner where the sac pushes hardest */}
        <path d={outline} fill={skin} opacity={(0.16 + 0.1 * (1 - band)) * (1 - xr)} />
        {wrinkles}
        {/* round shading: dark toward both edges, a cool rim on the shadow side */}
        <path d={outline} fill="none" stroke={band > 0.3 ? '#0D1E08' : '#2A2519'} strokeWidth={rmean * 0.9} strokeOpacity={0.5 * (1 - 0.5 * xr)} filter={`url(#${id}s)`} />
        <path d={open(tb.C.map((_, i) => across(tb, i, -0.92 * side)))} fill="none" stroke="#C7D6E0" strokeWidth={rmean * 0.12} strokeOpacity={0.22 + glass * 0.5} filter={`url(#${id}h)`} />
        <path d={outline} fill={`url(#${id}x)`} />
        {st.far && <path d={outline} fill="#0A1408" opacity={0.18} />}
        {/* the wet highlight */}
        <path d={open(hl)} fill="none" stroke="#FFFFFF" strokeWidth={rmean * 0.26} strokeOpacity={0.22 + 0.12 * band} strokeLinecap="round" filter={`url(#${id}s)`} />
        <path d={open(hl.slice(8, 24))} fill="none" stroke="#FFFFFF" strokeWidth={rmean * 0.07} strokeOpacity={0.4 + 0.25 * band} strokeLinecap="round" filter={`url(#${id}h)`} />
      </g>
      {glass > 0.01 && <path d={outline} fill="none" stroke="#E8F4F6" strokeWidth={rmean * 0.06} strokeOpacity={glass} />}
      {/* the contraction bulge: a bright ring of stretched skin travelling up the sac */}
      {band > 0.2 && g.bulgeK > 0.05 && g.uw > 0.05 && g.uw < 0.95 && (
        <g clipPath={`url(#${id}c)`}>
          <path d={open(ringEdge(g, g.uw, bowK))} fill="none" stroke="#FFFFF0" strokeWidth={rmean * 0.3} strokeOpacity={0.22 * g.bulgeK * band} filter={`url(#${id}h)`} />
        </g>
      )}
      {/* V4 hook: the skin turns translucent and the living sac shows through, still banded */}
      {trans > 0.01 && (
        <g clipPath={`url(#${id}c)`}>
          {drawInterior(1, 0.62 * sm(trans), false, 'g')}
          <path d={outline} fill={skin} opacity={0.1 * trans} />
        </g>
      )}
      {cut > 0.01 && drawInterior(cut, sm(clamp(cut * 3)), true, 'c')}
      {/* the eye at the tip */}
      {(st.wound ?? 0) < 0.5 && (
        <g>
          <circle cx={eyeP.x} cy={eyeP.y} r={eyeR} fill="#0B0B0A" />
          <circle cx={eyeP.x + light.x * eyeR * 0.35} cy={eyeP.y + light.y * eyeR * 0.35} r={eyeR * 0.2} fill="#FFFFFF" opacity={0.55} />
        </g>
      )}
      {(st.wound ?? 0) > 0.01 && (
        <ellipse cx={tipC.x} cy={tipC.y} rx={st.rn * 0.9} ry={st.rn * 0.6} transform={`rotate(${(Math.atan2(tb.T[tip].y, tb.T[tip].x) * 180) / Math.PI + 90} ${tipC.x} ${tipC.y})`} fill="#8A4E3A" opacity={0.75 * (st.wound ?? 0)} />
      )}
    </g>
  );
};
void nrm; void perp; void sub; void rgba;
