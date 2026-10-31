// The parasite: one 3D model of Cymothoa exigua (a cymothoid isopod) used in every shot, from the free-swimming
// juvenile to the adult female in the fish's mouth, so the segment count, the seven pairs of hooked legs, the eyes and
// the tail fan never change between views. Body plan (dorsal view, head first): cephalon with two dark eyes and two
// pairs of short antennae, seven pereonites (the first wraps the back of the head), five short pleonites, the shield-
// like pleotelson with a uropod on each side. Seven pairs of prehensile pereopods, each ending in a curved dactyl
// (the hook that grips the host). Everything is posed on a spine that lies on the substrate.
import React from 'react';
import {mix, lit, shade, rgba} from './core/color';
import {add3, Basis, capsule2, cross3, dot3, mul3, norm3, P2, proj, smoothOpen, sub3, V2, V3} from './core/three';
import {clamp, lerp} from './lib';

export type IsoPose = {
  o: V3; // world point under the front of the head (on the substrate)
  fwd: V3; // the way the head points
  up: V3; // dorsal
  L: number; // body length, mm
  k: number; // 0 juvenile (slender, translucent) .. 1 adult female (broad, opaque)
  bend?: number; // lateral bend (fraction of L at the tail)
  wave?: number; // lateral body wave amplitude (fraction of L)
  wavePh?: number;
  arch?: number; // dorsal arch of the middle (fraction of L)
  lift?: number; // head raised (fraction of L)
  tailLift?: number; // tail fan raised (fraction of L)
  grip?: number; // dactyls driven into the tissue (0..1)
  tuck?: number; // legs folded under the body (0..1)
  walk?: number; // gait phase (rad); undefined = standing
  step?: number; // step height (fraction of L)
  swim?: number; // legs trailing, pleopods beating (0..1)
  gut?: number; // blood visible in the gut (0..1, juvenile only shows it)
  tongue?: number; // reads as a fleshy tongue (pink, soft segment lines) (0..1)
  op?: number; // overall opacity
  segFlex?: number; // segment telescoping wave (0..1)
  segPh?: number;
};

// segment boundaries along the body (fraction of L)
const SEG = [0, 0.11, 0.215, 0.298, 0.381, 0.464, 0.547, 0.63, 0.715, 0.738, 0.761, 0.784, 0.807, 0.83, 1.0];
// half width (fraction of the maximum) along the body
const HW: [number, number][] = [
  [0, 0.3], [0.025, 0.46], [0.07, 0.56], [0.1, 0.6], [0.115, 0.74], [0.17, 0.86], [0.3, 0.95], [0.45, 1], [0.6, 0.95], [0.68, 0.84],
  [0.715, 0.7], [0.74, 0.6], [0.8, 0.56], [0.83, 0.56], [0.9, 0.52], [0.96, 0.4], [1, 0.12],
];
const HG: [number, number][] = [[0, 0.35], [0.1, 0.7], [0.3, 1], [0.6, 0.95], [0.72, 0.7], [0.83, 0.55], [1, 0.25]];
const tab = (T: [number, number][], u: number) => {
  if (u <= T[0][0]) return T[0][1];
  for (let i = 1; i < T.length; i++) if (u <= T[i][0]) return lerp(T[i - 1][1], T[i][1], (u - T[i - 1][0]) / (T[i][0] - T[i - 1][0]));
  return T[T.length - 1][1];
};
const NEAR = 1.5;
const LEG_U = [0.165, 0.256, 0.34, 0.422, 0.505, 0.588, 0.672];

let uid = 0;
let ns = 'i';
export const resetIsoIds = (p: string) => {
  uid = 0;
  ns = p.replace(/[^A-Za-z0-9_-]/g, '_');
};
const nid = (p: string) => `${ns}${p}${uid++}`;

export type IsoFrame = {P: V3; T: V3; N: V3; W: V3; hw: number; hg: number};
/** the posed body: a frame (substrate point, backward tangent, dorsal normal, lateral) at body fraction u */
export const isoBody = (p: IsoPose) => {
  const {L, k} = p;
  const fw = norm3(p.fwd);
  const up0 = norm3(sub3(p.up, mul3(fw, dot3(p.up, fw))));
  const lat = cross3(fw, up0);
  const hwMax = L * lerp(0.17, 0.235, k);
  const hgMax = L * lerp(0.11, 0.125, k);
  const pos = (u: number): V3 => {
    const s = u * L;
    const y = (p.bend ?? 0) * L * u * u + (p.wave ?? 0) * L * (Math.sin(2 * Math.PI * u * 0.9 + (p.wavePh ?? 0)) - Math.sin(p.wavePh ?? 0)) * u;
    const z = (p.arch ?? 0) * L * Math.sin(Math.PI * u) + (p.lift ?? 0) * L * Math.max(0, 1 - u / 0.35) ** 2 + (p.tailLift ?? 0) * L * Math.max(0, (u - 0.6) / 0.4) ** 2;
    // segment telescoping: a small wave of extension along the body
    const ds = (p.segFlex ?? 0) * L * 0.012 * Math.sin(2 * Math.PI * (u * 2.2) - (p.segPh ?? 0));
    return add3(p.o, add3(mul3(fw, -(s + ds)), add3(mul3(lat, y), mul3(up0, z))));
  };
  const at = (u: number): IsoFrame => {
    const P = pos(u);
    const T = norm3(sub3(pos(Math.min(1, u + 0.01)), pos(Math.max(0, u - 0.01))));
    const N = norm3(sub3(up0, mul3(T, dot3(up0, T))));
    const W = cross3(T, N);
    return {P, T, N, W, hw: hwMax * tab(HW, u), hg: hgMax * tab(HG, u)};
  };
  /** a point on the dorsal surface: body fraction u, lateral w in [-1, 1], h = extra height (mm) */
  const surf = (u: number, w: number, h = 0): V3 => {
    const F = at(u);
    const prof = 0.16 + 0.84 * Math.pow(Math.max(0, 1 - w * w), 0.6);
    return add3(F.P, add3(mul3(F.W, w * F.hw), mul3(F.N, F.hg * prof + h)));
  };
  return {at, surf, hwMax, hgMax, lat, fw, up: up0};
};

const BASE_ADULT = '#D9C4A6';
const BASE_JUV = '#C9BCA8';
const PINK = '#D9928A';
const DACTYL = '#7A4E2C';

type It = {z: number; el: React.ReactNode};

/** draw the parasite through camera B. light: world direction toward the key light. */
export const isopodItems = (B: Basis, p: IsoPose, light: V3 = [-0.3, 0, 1]): It[] => {
  const body = isoBody(p);
  const {L, k} = p;
  const tl = p.tongue ?? 0;
  const op = p.op ?? 1;
  const items: It[] = [];
  const Lw = norm3(light);
  const toCam = (q: V3) => norm3(sub3(B.eye, q));
  const pr = (q: V3) => proj(B, q);
  const base = mix(mix(BASE_JUV, BASE_ADULT, k), PINK, tl * 0.85);
  const plateOp = lerp(0.55, 1, k) * op;
  const margin = 1 - 0.75 * tl;

  // ---------------- legs (seven pairs)
  const legEls = (front: boolean) => {
    const out: It[] = [];
    LEG_U.forEach((u, i) => {
      [-1, 1].forEach((side) => {
        const F = body.at(u);
        const nearSide = dot3(mul3(F.W, side), toCam(F.P)) > 0.25;
        if (nearSide !== front) return;
        const tuck = p.tuck ?? 0;
        const swim = p.swim ?? 0;
        const dir = i < 3 ? -1 : 1; // the front three pairs reach forward, the back four backward
        let lift = 0, slide = 0;
        if (p.walk !== undefined) {
          const ph = p.walk - i * 0.85 + (side > 0 ? Math.PI : 0);
          lift = Math.max(0, Math.sin(ph)) * (p.step ?? 0.05);
          slide = Math.cos(ph) * 0.05;
        }
        const reach = L * lerp(0.15, 0.075, k) * (1 - 0.55 * tuck);
        const baseP = add3(F.P, add3(mul3(F.W, side * 0.8 * F.hw), mul3(F.N, 0.18 * F.hg)));
        const Fa = body.at(clamp(u + dir * (0.045 + 0.04 * swim) + slide * (1 - tuck), 0, 1));
        const outW = F.hw * (0.96 - 0.7 * tuck) + reach * 0.28 * (1 - 0.4 * swim);
        let foot = add3(Fa.P, add3(mul3(F.W, side * outW), mul3(F.N, -0.012 * L * (p.grip ?? 0) + L * lift + 0.04 * L * swim)));
        if (swim > 0) foot = add3(foot, mul3(F.T, 0.05 * L * swim));
        const knee = add3(add3(baseP, mul3(sub3(foot, baseP), 0.5)), add3(mul3(F.N, L * lerp(0.03, 0.018, k) * (1 - 0.5 * tuck)), mul3(F.W, side * L * 0.02)));
        const g = p.grip ?? 0;
        const tip = add3(foot, add3(mul3(F.W, -side * L * 0.04), add3(mul3(F.N, -L * (0.018 + 0.026 * g)), mul3(F.T, dir * L * 0.016))));
        const mid = add3(foot, add3(mul3(F.W, side * L * 0.006), mul3(F.N, L * 0.03)));
        const A = pr(baseP), K = pr(knee), Fo = pr(foot), Ti = pr(tip), Mi = pr(mid);
        if (Math.min(A.z, K.z, Fo.z, Ti.z, Mi.z) < NEAR) return;
        const s = A.s;
        const r1 = Math.max(0.6, 0.02 * L * s), r2 = Math.max(0.5, 0.015 * L * s), r3 = Math.max(0.45, 0.011 * L * s);
        const col = mix(base, '#C9A784', 0.4);
        const id = nid('lg');
        const z = (A.z + Fo.z) / 2;
        // the claw: a tapered curve from the last segment to its point
        const cl: V2[] = [], cr: V2[] = [];
        for (let q = 0; q <= 6; q++) {
          const f = q / 6;
          const bx = (1 - f) * (1 - f) * Fo.x + 2 * f * (1 - f) * Mi.x + f * f * Ti.x;
          const by = (1 - f) * (1 - f) * Fo.y + 2 * f * (1 - f) * Mi.y + f * f * Ti.y;
          const tx = 2 * (1 - f) * (Mi.x - Fo.x) + 2 * f * (Ti.x - Mi.x), ty = 2 * (1 - f) * (Mi.y - Fo.y) + 2 * f * (Ti.y - Mi.y);
          const tn = Math.hypot(tx, ty) || 1;
          const w = r3 * 0.95 * (1 - f) + 0.15;
          cl.push({x: bx - (ty / tn) * w, y: by + (tx / tn) * w});
          cr.push({x: bx + (ty / tn) * w, y: by - (tx / tn) * w});
        }
        const claw = `M${cl.map(P2).join(' L')} L${cr.reverse().map(P2).join(' L')} Z`;
        const edge = rgba('#5A4130', 0.6);
        const ew = Math.max(0.4, r3 * 0.25).toFixed(2);
        out.push({
          z,
          el: (
            <g key={id} opacity={op}>
              <path d={capsule2(A, K, r1, r2)} fill={col} fillOpacity={lerp(0.75, 1, k)} stroke={edge} strokeWidth={ew} />
              <path d={capsule2(K, Fo, r2 * 0.95, r3)} fill={lit(col, 0.08)} fillOpacity={lerp(0.75, 1, k)} stroke={edge} strokeWidth={ew} />
              <circle cx={K.x.toFixed(1)} cy={K.y.toFixed(1)} r={(r2 * 0.75).toFixed(2)} fill={shade(col, 0.25)} opacity={0.5} />
              <path d={claw} fill={DACTYL} stroke="#3A2212" strokeWidth={(Number(ew) * 0.7).toFixed(2)} />
              <path d={`M${P2({x: (A.x + K.x) / 2 - r1 * 0.3, y: (A.y + K.y) / 2 - r1 * 0.4})} L${P2({x: K.x - r2 * 0.3, y: K.y - r2 * 0.4})}`} stroke="#FFFFFF" strokeWidth={(r2 * 0.35).toFixed(2)} strokeLinecap="round" opacity={0.25} />
            </g>
          ),
        });
      });
    });
    return out;
  };
  const backLegs = legEls(false);
  const frontLegs = legEls(true);

  // ---------------- antennae (two short pairs at the front of the head)
  const antEls: React.ReactNode[] = [];
  [-1, 1].forEach((side) => {
    [[0.25, 0.06, 0.5], [0.42, 0.085, 0.9]].forEach(([w0, len, spread], j) => {
      const F = body.at(0.005);
      const a0 = body.surf(0.012, side * w0, 0);
      const pts: V2[] = [];
      for (let q = 0; q <= 5; q++) {
        const f = q / 5;
        const pt = add3(a0, add3(mul3(F.T, -L * len * f), add3(mul3(F.W, side * L * len * spread * f * f), mul3(F.N, -L * 0.02 * f + L * 0.01 * Math.sin(f * 3)))));
        pts.push(pr(pt));
      }
      const s = pr(a0).s;
      if (pts.some((q) => (q as {z?: number}).z! < NEAR)) return;
      antEls.push(<path key={`an${side}${j}`} d={smoothOpen(pts)} fill="none" stroke={shade(base, 0.35)} strokeWidth={Math.max(0.5, 0.009 * L * s).toFixed(2)} strokeLinecap="round" opacity={op * 0.85} />);
    });
  });

  // ---------------- uropods (each side of the tail fan)
  const uroEls: React.ReactNode[] = [];
  [-1, 1].forEach((side) => {
    const F = body.at(0.86);
    const r0 = add3(F.P, add3(mul3(F.W, side * F.hw * 0.85), mul3(F.N, F.hg * 0.25)));
    const tip = add3(r0, add3(mul3(F.T, L * 0.1), mul3(F.W, side * L * 0.04)));
    const wv = mul3(F.W, side * L * 0.028);
    if (pr(r0).z < NEAR || pr(tip).z < NEAR) return;
    const pts = [add3(r0, mul3(wv, -0.6)), add3(add3(r0, mul3(sub3(tip, r0), 0.55)), mul3(wv, -0.9)), tip, add3(add3(r0, mul3(sub3(tip, r0), 0.6)), mul3(wv, 1.1)), add3(r0, mul3(wv, 0.7))].map(pr);
    const id = nid('ur');
    uroEls.push(
      <path key={id} d={`M${P2(pts[0])} Q${P2(pts[1])} ${P2(pts[2])} Q${P2(pts[3])} ${P2(pts[4])} Z`} fill={base} fillOpacity={plateOp} stroke={rgba('#6E5642', 0.6 * op)} strokeWidth={Math.max(0.5, 0.008 * L * pts[0].s).toFixed(2)} />,
    );
  });

  // ---------------- gut (seen through the translucent juvenile)
  const gut = (p.gut ?? 0) * (1 - k * 0.85);
  const gutEl = (() => {
    if (gut < 0.01) return null;
    const pts: V2[] = [];
    for (let q = 0; q <= 10; q++) pts.push(pr(body.surf(0.06 + q * 0.064, 0, -body.at(0.06 + q * 0.064).hg * 0.45)));
    if (pts.some((q) => (q as {z?: number}).z! < NEAR)) return null;
    const s = pr(body.at(0.35).P).s;
    return <path d={smoothOpen(pts)} fill="none" stroke="#9E1220" strokeWidth={(body.hwMax * 0.7 * s * (0.4 + 0.6 * gut)).toFixed(2)} strokeLinecap="round" opacity={0.9 * gut * op} />;
  })();

  // ---------------- dorsal plates, tail first so each plate overlaps the one behind it. Each plate is drawn as two
  // half-shells (crest to edge) so its outline always contains the crest: the far half first, then the near half.
  const plates: React.ReactNode[] = [];
  const sheen = clamp(0.25 + 0.5 * tl + 0.3 * k);
  for (let i = SEG.length - 2; i >= 0; i--) {
    const u0 = SEG[i] + (i === 0 ? 0.004 : 0), u1 = Math.min(1, SEG[i + 1] + (i < SEG.length - 2 ? 0.014 : 0));
    const um = (u0 + u1) / 2;
    const F = body.at(um);
    const nearSign = dot3(F.W, toCam(F.P)) >= 0 ? 1 : -1;
    const shadeK = 0.5 + 0.5 * clamp(dot3(F.N, Lw) * 0.8 + 0.2);
    const col = mix(shade(base, 0.55), base, shadeK);
    const id = nid('pl');
    const NW = 6, NU = 4;
    const halves = [-nearSign, nearSign].map((sg, hIdx) => {
      const ring: V3[] = [];
      for (let q = 0; q <= NW; q++) ring.push(body.surf(u0, (sg * q) / NW));
      for (let q = 1; q <= NU; q++) ring.push(body.surf(u0 + ((u1 - u0) * q) / NU, sg));
      for (let q = NW - 1; q >= 0; q--) ring.push(body.surf(u1, (sg * q) / NW));
      for (let q = NU - 1; q >= 1; q--) ring.push(body.surf(u0 + ((u1 - u0) * q) / NU, 0));
      const pts = ring.map(pr);
      if (pts.some((q) => q.z < NEAR)) return null;
      const C = pr(body.surf(um, 0)), E = pr(body.surf(um, sg));
      const s = C.s;
      const back: V2[] = [];
      for (let q = 0; q <= NW; q++) back.push(pr(body.surf(u1, (sg * q) / NW, 0.02 * body.hgMax)));
      const gid = `${id}h${hIdx}`;
      const facing = clamp(0.6 + 0.6 * dot3(mul3(F.W, sg), Lw));
      const shape = `M${pts.map(P2).join(' L')} Z`;
      return (
        <g key={gid}>
          <clipPath id={`${gid}c`}><path d={shape} /></clipPath>
          <defs>
            <linearGradient id={gid} gradientUnits="userSpaceOnUse" x1={C.x.toFixed(1)} y1={C.y.toFixed(1)} x2={E.x.toFixed(1)} y2={E.y.toFixed(1)}>
              <stop offset="0" stopColor={lit(col, 0.2 + 0.1 * tl)} />
              <stop offset="0.5" stopColor={mix(shade(col, 0.2), col, facing)} />
              <stop offset="1" stopColor={shade(col, 0.5)} />
            </linearGradient>
          </defs>
          <path d={shape} fill={`url(#${gid})`} fillOpacity={plateOp} stroke={rgba(mix('#6E5642', PINK, tl * 0.6), lerp(0.75, 0.2, k) * op)} strokeWidth={Math.max(0.3, lerp(0.012, 0.004, k) * L * s).toFixed(2)} strokeLinejoin="round" />
          <g clipPath={`url(#${gid}c)`}>
          {i < SEG.length - 2 && <path d={smoothOpen(back)} fill="none" stroke={rgba(mix('#5E4634', '#B86F68', tl), 0.85 * margin * op)} strokeWidth={Math.max(0.8, 0.016 * L * s).toFixed(2)} strokeLinecap="round" />}
          {i > 0 && i < 13 && [0.2, 0.45, 0.7, 0.88].map((w, q) => {
            const c = pr(body.surf(u0 + (u1 - u0) * (0.25 + 0.17 * q + 0.1 * Math.sin(i * 3 + q)), sg * w, 0.01));
            return <circle key={q} cx={c.x.toFixed(1)} cy={c.y.toFixed(1)} r={Math.max(0.4, lerp(0.008, 0.0045, k) * L * s * (0.7 + 0.6 * Math.abs(Math.sin(i * 7 + q * 3)))).toFixed(2)} fill="#3A2218" opacity={lerp(0.8, 0.28, k) * (1 - 0.8 * tl) * op} />;
          })}
          </g>
        </g>
      );
    });
    // a wet glint on the lit shoulder of each plate (not on the head)
    const lw = dot3(F.W, Lw) >= 0 ? 1 : -1;
    const hl = [pr(body.surf(u0 + (u1 - u0) * 0.3, lw * 0.15, 0.01)), pr(body.surf(u0 + (u1 - u0) * 0.38, lw * 0.32, 0.01)), pr(body.surf(u0 + (u1 - u0) * 0.34, lw * 0.5, 0.01))];
    if (hl.some((q) => q.z < NEAR)) hl.length = 0;
    plates.push(
      <g key={id}>
        {halves}
        {i > 0 && i % 2 === 1 && hl.length > 0 && <path d={smoothOpen(hl)} fill="none" stroke="#FFFFFF" strokeWidth={Math.max(0.5, 0.009 * L * hl[1].s).toFixed(2)} strokeLinecap="round" opacity={0.3 * sheen * op} />}
      </g>,
    );
  }

  // ---------------- eyes (dark, on the sides of the head)
  const eyeEls: React.ReactNode[] = [];
  [-1, 1].forEach((side) => {
    const q = body.surf(0.045, side * 0.7, 0.002 * L);
    const F = body.at(0.05);
    const nrm = norm3(add3(F.N, mul3(F.W, side * 0.8)));
    const vis = dot3(nrm, toCam(q));
    if (vis < -0.05) return;
    const c = pr(q);
    if (c.z < NEAR) return;
    const r = 0.016 * L * c.s * (0.55 + 0.45 * clamp(vis * 1.5));
    eyeEls.push(
      <g key={`e${side}`} opacity={op * clamp((vis + 0.05) * 5) * (1 - 0.55 * tl)}>
        <ellipse cx={c.x.toFixed(1)} cy={c.y.toFixed(1)} rx={(r * 1.25).toFixed(2)} ry={(r * 0.9).toFixed(2)} fill="#20150E" opacity={0.92} />
        <ellipse cx={(c.x - r * 0.35).toFixed(1)} cy={(c.y - r * 0.3).toFixed(1)} rx={(r * 0.3).toFixed(2)} ry={(r * 0.16).toFixed(2)} fill="#FFFFFF" opacity={0.22} />
      </g>,
    );
  });

  const bodyZ = pr(body.at(0.4).P).z;
  items.push(...backLegs);
  items.push({
    z: bodyZ,
    el: (
      <g key={nid('bd')}>
        {antEls}
        {uroEls}
        {gutEl}
        {plates}
        {eyeEls}
      </g>
    ),
  });
  // near legs always in front of the body
  frontLegs.forEach((f) => items.push({...f, z: bodyZ - 1e3 - f.z * 1e-3}));
  // far legs always behind
  backLegs.forEach((b) => (b.z = bodyZ + 1e3 + b.z * 1e-3));
  return items;
};

export const isopodEl = (B: Basis, p: IsoPose, light?: V3, key = 'iso') => (
  <g key={key}>
    {isopodItems(B, p, light)
      .sort((a, b) => b.z - a.z)
      .map((it, i) => (
        <React.Fragment key={i}>{it.el}</React.Fragment>
      ))}
  </g>
);
