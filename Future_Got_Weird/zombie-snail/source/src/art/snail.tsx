// An amber snail (Succinea, the usual host of Leucochloridium) in side view, facing +x, sole on y = 0 at the origin's
// front. World millimetres: about 21 mm from tail to snout, a thin amber shell on the back, a pale grey body with
// darker grooves and tubercles, two upper tentacles (the eyestalks) and two short lower tentacles.
// The front of the body bends (head lift, head dip while feeding) without sliding the sole; pedal waves run forward
// along the foot fringe while it crawls. With xray > 0 a cutaway opens along the side of the body, from the head back, and the interior shows.
import React from 'react';
import {add, closed, dir, open, P, pt, rot, sub, tube} from '../core/geo';
import {uid} from '../core/ids';
import {clamp, hash, lerp, sm} from '../lib';
import {Stalk, StalkState} from './stalk';

export type StalkParams = Omit<StalkState, 'base' | 't'>;
export type SnailState = {
  o: P; // world position of the sole's front
  k: number; // size factor
  t: number;
  crawl: number; // distance crawled (mm), drives the pedal waves
  lift: number; // head lift (radians, + raises the head)
  dip?: number; // head dip toward the food (0..1)
  rasp?: number; // mouth working 0..1
  flinch?: number; // a recoil 0..1 (the body contracts back)
  near: StalkParams;
  far: StalkParams;
  lowRetract?: number;
  xray?: number;
  cutAlpha?: number; // the body cutaway fades closed (1 open .. 0 closed)
  interior?: (local: (p: P) => P) => React.ReactNode; // drawn inside the glassy body, in snail-local coordinates
  shellAng?: number;
  light?: number;
};

const BODY: P[] = [
  pt(-19.6, -0.12), pt(-18.6, -0.85), pt(-16.6, -1.85), pt(-14.0, -2.85), pt(-11.0, -3.55), pt(-8.0, -3.9), pt(-5.6, -4.1), pt(-3.9, -4.3),
  pt(-2.6, -4.55), pt(-1.15, -4.62), pt(0.15, -4.3), pt(1.05, -3.7), pt(1.6, -2.95), pt(1.85, -2.15), pt(1.95, -1.45), pt(2.35, -0.85), pt(2.3, -0.32), pt(1.7, -0.06), pt(0.4, 0.02),
  pt(-3, 0.04), pt(-8, 0.04), pt(-14, 0.03), pt(-18.2, 0.0),
];
// tubercles: deterministic points inside the side of the body
const TUB = (() => {
  const out: {x: number; y: number; rx: number; ry: number; a: number; l: number}[] = [];
  let k = 0;
  for (let gy = 0; gy < 14; gy++) {
    for (let gx = 0; gx < 60; gx++) {
      k++;
      const x = -19.2 + gx * 0.36 + (gy % 2) * 0.18 + (hash(k * 3.1) - 0.5) * 0.14;
      const top = topAt(x);
      const y = top + 0.12 + gy * 0.3 + (hash(k * 7.7) - 0.5) * 0.1;
      if (y > -0.62 || x > 2.0) continue;
      out.push({x, y, rx: 0.2 + 0.07 * hash(k * 1.9), ry: 0.13 + 0.04 * hash(k * 2.3), a: -58 + 14 * (hash(k * 5.3) - 0.5), l: hash(k * 9.1)});
    }
  }
  return out;
})();
function topAt(x: number) {
  // upper contour height at x (the shell covers -16..-5)
  for (let i = 0; i < 12; i++) {
    const a = BODY[i], b = BODY[i + 1];
    if (x >= a.x && x <= b.x) return a.y + ((x - a.x) / (b.x - a.x)) * (b.y - a.y);
  }
  return -3;
}

/** the front bends about a hinge behind the head; dip lowers the snout toward the food */
const bendFn = (st: SnailState) => {
  const flinch = st.flinch ?? 0;
  return (p: P): P => {
    const w = sm((p.x + 7.5) / 6.5) * (1 - 0.3 * clamp(-p.y / 6 - 0.6));
    const hinge = pt(-7.5, -0.6);
    let q = add(hinge, rot(sub(p, hinge), -(st.lift - 0.16 * (st.dip ?? 0)) * w));
    // the sole stays down: lifted points near the sole are pulled back toward y = 0
    if (p.y > -0.4 && st.lift > 0) q = {x: q.x, y: lerp(q.y, p.y, 0.6 * (1 - w))};
    // recoil: the front shortens backward
    q = {x: q.x - flinch * 1.6 * sm((p.x + 10) / 12), y: q.y + flinch * 0.25 * sm((p.x + 4) / 6)};
    return q;
  };
};

export const snailTips = (st: SnailState) => {
  const b = bendFn(st);
  const L = (p: P) => add(st.o, {x: p.x * st.k, y: p.y * st.k});
  return {head: L(b(pt(0.4, -3.2))), mouth: L(b(pt(2.0, -0.7))), nearBase: L(b(pt(-1.0, -4.45))), farBase: L(b(pt(-2.2, -4.5)))};
};

export const Snail: React.FC<{st: SnailState}> = ({st}) => {
  const id = uid('sn');
  const bend = bendFn(st);
  const k = st.k;
  const xr = st.xray ?? 0;
  const light = st.light ?? 1;
  const body = BODY.map(bend);
  const bodyD = closed(body, 0.95);
  // eyestalk bases follow the bent head; their direction turns with it
  const headTurn = -(st.lift - 0.16 * (st.dip ?? 0)) * 1 - (st.flinch ?? 0) * 0.25;
  const nearBase = bend(pt(-1.0, -4.45));
  const farBase = bend(pt(-2.2, -4.5));
  const toLocal = (s: StalkParams, base: P): StalkState => ({
    ...s,
    base,
    t: st.t,
    ang: s.ang + headTurn,
    Ln: s.Ln / k,
    Ls: s.Ls / k,
    rn: s.rn / k,
    rmax: s.rmax / k,
  });
  // pedal waves along the fringe
  const waves: React.ReactNode[] = [];
  for (let i = 0; i < 9; i++) {
    const x = (((i * 2.3 + st.crawl * 1.6) % 20.7) + 20.7) % 20.7 - 19.0;
    const q = bend(pt(x, -0.4));
    waves.push(<ellipse key={i} cx={q.x} cy={q.y} rx={0.55} ry={0.32} fill="#5A5446" opacity={0.12 * sm((x + 19) / 2) * sm((1.5 - x) / 2)} />);
  }
  // lower tentacles
  const lowRet = st.lowRetract ?? 0;
  const lowT = (base: P, ang: number, far: boolean) => {
    const C: P[] = [];
    const R: number[] = [];
    const Lt = 1.0 * (1 - 0.8 * lowRet);
    for (let i = 0; i < 8; i++) {
      const u = i / 7;
      C.push(add(base, add({x: 0, y: 0}, {x: Math.cos(ang + 0.25 * u) * Lt * u, y: Math.sin(ang + 0.25 * u) * Lt * u})));
      R.push(0.2 - 0.05 * u + 0.04 * sm((u - 0.8) / 0.2));
    }
    const tb = tube(C, R, true, false);
    const tip = C[C.length - 1];
    return (
      <g>
        <path d={closed(tb.outline, 0.9)} fill={far ? '#6E685B' : '#8A836F'} stroke="#3E392E" strokeWidth={0.04} strokeOpacity={0.5} />
        <path d={open(C.map((p, i) => add(p, {x: tb.N[i].x * R[i] * 0.45, y: tb.N[i].y * R[i] * 0.45})))} fill="none" stroke="#FFFFFF" strokeWidth={0.05} strokeOpacity={0.25} />
        <circle cx={tip.x} cy={tip.y} r={0.13} fill="#4A4436" opacity={0.6} />
      </g>
    );
  };
  // grooves: lines following the body, broken into pieces
  const grooves: React.ReactNode[] = [];
  for (let r = 0; r < 5; r++) {
    const pts: P[] = [];
    for (let x = -18.5; x <= 1.2; x += 0.5) {
      const top = topAt(x);
      const y = top + (r + 1) * 0.62 + 0.08 * Math.sin(x * 2.1 + r);
      if (y > -0.9) continue;
      pts.push(bend(pt(x, y)));
    }
    if (pts.length > 2) grooves.push(<path key={r} d={open(pts)} fill="none" stroke="#3E392E" strokeWidth={0.05} strokeOpacity={0.22} strokeDasharray="0.9 0.35" />);
  }
  const shellA = st.shellAng ?? 0;
  const shellC = bend(pt(-10.4, -6.0));
  const SH = shellPath(shellC, shellA);
  const glass = 1;
  const cutX = lerp(2.6, -15.5, sm(xr));
  return (
    <g transform={`translate(${st.o.x} ${st.o.y}) scale(${k})`}>
      <defs>
        <linearGradient id={`${id}g`} x1="0" y1="-4.7" x2="0" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#4F493D" />
          <stop offset="0.3" stopColor="#7A7262" />
          <stop offset="0.7" stopColor="#A39B85" />
          <stop offset="1" stopColor="#CFC6AC" />
        </linearGradient>
        <clipPath id={`${id}c`}>
          <path d={bodyD} />
        </clipPath>
        <filter id={`${id}n`} x="-20%" y="-20%" width="140%" height="140%">
          <feTurbulence type="fractalNoise" baseFrequency="0.7" numOctaves={3} seed={7} result="n" />
          <feColorMatrix in="n" type="matrix" values="0 0 0 0 0.2  0 0 0 0 0.18  0 0 0 0 0.14  0 0 0 -2.2 1.25" />
        </filter>
        <radialGradient id={`${id}tb`} cx="0.38" cy="0.32" r="0.62">
          <stop offset="0" stopColor="#CFC7AF" stopOpacity={0.7} />
          <stop offset="0.45" stopColor="#968D78" stopOpacity={0.35} />
          <stop offset="0.85" stopColor="#4E473A" stopOpacity={0.45} />
          <stop offset="1" stopColor="#4E473A" stopOpacity={0} />
        </radialGradient>
        <filter id={`${id}bump`} x="-5%" y="-5%" width="110%" height="110%" colorInterpolationFilters="sRGB">
          <feTurbulence type="turbulence" baseFrequency="0.95 1.35" numOctaves={2} seed={3} result="t" />
          <feColorMatrix in="t" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  -1.6 0 0 0 1.25" result="h" />
          <feDiffuseLighting in="h" surfaceScale={2.4} diffuseConstant={1.05} lightingColor="#FFFFFF" result="d">
            <feDistantLight azimuth={235} elevation={42} />
          </feDiffuseLighting>
          <feSpecularLighting in="h" surfaceScale={2.4} specularConstant={0.9} specularExponent={22} lightingColor="#FFFFFF" result="s">
            <feDistantLight azimuth={235} elevation={48} />
          </feSpecularLighting>
          <feComposite in="s" in2="h" operator="in" result="s2" />
          <feBlend in="d" in2="SourceGraphic" mode="multiply" result="m" />
          <feComposite in="s2" in2="m" operator="arithmetic" k1={0} k2={0.32} k3={1} k4={0} />
        </filter>
        <filter id={`${id}sb`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="0.22" />
        </filter>
        <filter id={`${id}sh`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="0.08" />
        </filter>
        <radialGradient id={`${id}sg`} cx={shellC.x - 1.5} cy={shellC.y - 1.6} r="7.5" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#F2D9A0" />
          <stop offset="0.45" stopColor="#D6AA62" />
          <stop offset="0.85" stopColor="#A87832" />
          <stop offset="1" stopColor="#7A521E" />
        </radialGradient>
      </defs>
      {/* far eyestalk behind the head */}
      <Stalk st={{...toLocal(st.far, farBase), far: true}} />
      {lowT(bend(pt(1.45, -1.95)), 0.55, true)}
      <g opacity={glass}>
        <path d={bodyD} fill={`url(#${id}g)`} />
        <g clipPath={`url(#${id}c)`}>
          {TUB.map((q, i) => {
            const c = bend(pt(q.x, q.y));
            return <ellipse key={i} cx={c.x} cy={c.y} rx={q.rx} ry={q.ry} transform={`rotate(${q.a} ${c.x} ${c.y})`} fill={`url(#${id}tb)`} opacity={0.5 + 0.4 * q.l} />;
          })}
          <rect x={-21} y={-6} width={25} height={7} filter={`url(#${id}n)`} opacity={0.4} />
          {grooves}
          {/* foot fringe, lighter, with the pedal waves */}
          <path d={open([-19.3, -17, -14, -10, -6, -2, 0.5, 1.6].map((x) => bend(pt(x, -0.72 - 0.05 * Math.sin(x * 3)))))} fill="none" stroke="#D9D0B6" strokeWidth={0.5} strokeOpacity={0.5} />
          {waves}
          {/* wet sheen along the top */}
          <path d={open(BODY.slice(1, 13).map((p) => bend(pt(p.x, p.y + 0.42))))} fill="none" stroke="#FFFFFF" strokeWidth={0.45} strokeOpacity={0.22 * light} filter={`url(#${id}sb)`} />
          <path d={open(BODY.slice(8, 13).map((p) => bend(pt(p.x, p.y + 0.3))))} fill="none" stroke="#FFFFFF" strokeWidth={0.07} strokeOpacity={0.35 * light} filter={`url(#${id}sh)`} />
          {/* shadow under the shell */}
          <ellipse cx={shellC.x + 0.8} cy={shellC.y + 3.4} rx={6.5} ry={1.4} fill="#2B261C" opacity={0.35} filter={`url(#${id}sb)`} />
        </g>
        {/* mouth */}
        {(() => {
          const m = bend(pt(2.2, -0.95));
          const o = st.rasp ?? 0;
          return <ellipse cx={m.x} cy={m.y} rx={0.08 + 0.12 * o} ry={0.22 + 0.1 * o} fill="#2C251B" opacity={0.75} />;
        })()}
      </g>
      {/* the interior, inside the glassy body */}
      {xr > 0.01 && st.interior && (
        <g opacity={st.cutAlpha ?? 1}>
          <defs>
            <clipPath id={`${id}w`}>
              <path d={`M6 -9.5 L${cutX + 0.3} -9.5 ${Array.from({length: 13}, (_, q) => `L${(cutX + 0.35 * Math.sin(q * 1.3) + 0.2 * Math.sin(q * 3.1)).toFixed(3)} ${(-9.5 + q * 0.85).toFixed(3)}`).join(' ')} L6 1.2 Z`} />
            </clipPath>
          </defs>
          <g clipPath={`url(#${id}c)`}>
            <g clipPath={`url(#${id}w)`}>
              {st.interior(bend)}
              {/* the cut skin: a fleshy rim inside the outline and along the cut */}
              <path d={bodyD} fill="none" stroke="#B88C7E" strokeWidth={0.55} />
              <path d={bodyD} fill="none" stroke="#5A3A30" strokeWidth={0.16} />
            </g>
            <path d={`M${cutX + 0.3} -9.5 ${Array.from({length: 13}, (_, q) => `L${(cutX + 0.35 * Math.sin(q * 1.3) + 0.2 * Math.sin(q * 3.1)).toFixed(3)} ${(-9.5 + q * 0.85).toFixed(3)}`).join(' ')}`} fill="none" stroke="#B88C7E" strokeWidth={0.3} opacity={xr < 0.99 ? 1 : 0} />
          </g>
        </g>
      )}
      {/* shell (the visceral mass shows through its thin wall) */}
      <g opacity={1 - 0.62 * xr * (st.cutAlpha ?? 1)}>
        <path d={SH.d} fill="#3A2E1E" opacity={0.75} />
        <path d={SH.inner} fill="#2E2416" opacity={0.5} filter={`url(#${id}sb)`} />
        <path d={SH.d} fill={`url(#${id}sg)`} opacity={0.72} />
        {SH.whorls.map((w, i) => <path key={i} d={w} fill="none" stroke="#5C3410" strokeWidth={0.07} strokeOpacity={0.5} />)}
        <path d={SH.inner} fill="#5B3A16" opacity={0.28} filter={`url(#${id}sb)`} />
        {SH.growth.map((g, i) => <path key={i} d={g} fill="none" stroke="#6E4011" strokeWidth={0.05} strokeOpacity={0.35} />)}
        <path d={SH.suture} fill="none" stroke="#5C3410" strokeWidth={0.09} strokeOpacity={0.6} />
        <path d={SH.hl} fill="none" stroke="#FFF2D2" strokeWidth={0.9} strokeOpacity={0.35 * light} strokeLinecap="round" filter={`url(#${id}sb)`} />
        <path d={SH.hl2} fill="none" stroke="#FFFFFF" strokeWidth={0.12} strokeOpacity={0.75 * light} strokeLinecap="round" />
        {/* mantle collar at the aperture */}
        <path d={open([bend(pt(-4.9, -3.95)), bend(pt(-5.6, -4.6)), bend(pt(-6.8, -5.0))])} fill="none" stroke="#5E5646" strokeWidth={0.3} strokeOpacity={0.55} strokeLinecap="round" />
      </g>
      {lowT(bend(pt(1.7, -2.05)), 0.45, false)}
      <Stalk st={toLocal(st.near, nearBase)} />
    </g>
  );
};

/** the thin amber shell: an elongated oval whose small spire points up and back */
const shellPath = (c: P, extra: number) => {
  const ang = 0.24 + extra; // long axis: apex up-back
  const ax = dir(Math.PI + ang); // toward the apex
  const ay = dir(ang - Math.PI / 2);
  const P_ = (a: number, b: number) => ({x: c.x + ax.x * a + ay.x * b, y: c.y + ax.y * a + ay.y * b});
  const pts: P[] = [];
  for (let i = 0; i < 36; i++) {
    const th = (i / 36) * Math.PI * 2;
    const ca = Math.cos(th), sa = Math.sin(th);
    // a: along the axis (+ toward apex); the apex end tapers
    const a = ca > 0 ? ca * 6.6 : ca * 5.4;
    const taper = ca > 0 ? 1 - 0.55 * Math.pow(ca, 2.2) : 1;
    pts.push(P_(a, sa * 3.75 * taper));
  }
  const d = closed(pts, 0.95);
  const inner = closed(pts.map((p) => ({x: c.x + (p.x - c.x) * 0.72 + 0.6, y: c.y + (p.y - c.y) * 0.62 + 0.9})), 0.95);
  const suture = open([P_(6.1, 1.0), P_(4.8, 1.85), P_(3.5, 1.9), P_(2.5, 1.0)]);
  const growth: string[] = [];
  for (let i = 0; i < 9; i++) {
    const a = -4.2 + i * 0.95;
    const h = 3.6 * Math.sqrt(Math.max(0, 1 - Math.pow(a / 6.4, 2)));
    growth.push(open([P_(a + 0.3, -h * 0.95), P_(a - 0.2, 0), P_(a + 0.1, h * 0.95)]));
  }
  const whorls = [open([P_(6.25, 0.55), P_(5.6, 1.45), P_(4.7, 1.55)]), open([P_(6.45, -0.25), P_(6.05, 0.75)])];
  const hl = open([P_(4.4, 2.0), P_(1.5, 3.0), P_(-1.8, 3.1), P_(-4.0, 2.4)]);
  const hl2 = open([P_(2.6, 2.75), P_(0.4, 3.15), P_(-1.6, 3.05)]);
  return {d, inner, suture, growth, hl, hl2, whorls};
};
