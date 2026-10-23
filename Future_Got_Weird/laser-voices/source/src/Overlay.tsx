// Explanatory overlays drawn through the scene camera (anchored in the room, never floating text):
//  - the illustrated infrared path (dashed amber), from the exit aperture to the listening position, cut at the
//    bystander's body when he is in the way;
//  - the listening region and the received-signal accent (teal pressure fronts moving into the ear), shown only
//    while the signal is actually received;
//  - the sweep (beat D): the beam's end moving down a short arc beside the ear at the speed the sound travels, its
//    wavelets piling up into one stronger front at the listener;
//  - the 8 FT dimension (beat D), drawn once in the scene and retired.
import React from 'react';
import {clamp, inv, lerp, smooth} from './lib/math';
import {a3, Basis, fmt, l3, lerp3, m3, n3, P2, proj, s3, V3, v3} from './p3';
import {EXIT} from './world';
import {C} from './Room';

const near = 0.06;
/** project a world segment, clipped to the part in front of the camera */
export const projSeg = (b: Basis, A: V3, B: V3): [P2, P2] | null => {
  const da = proj(b, A).d, db = proj(b, B).d;
  if (da < near && db < near) return null;
  let a = A, c = B;
  if (da < near) a = lerp3(A, B, (near - da) / (db - da));
  if (db < near) c = lerp3(A, B, (da - near) / (da - db));
  return [proj(b, a), proj(b, c)];
};

export const DashedPath: React.FC<{b: Basis; from: V3; to: V3; a: number; t: number; fadeEnd?: number; id: string}> = ({b, from, to, a, t, fadeEnd = 0, id}) => {
  if (a <= 0.003) return null;
  const sg = projSeg(b, from, to);
  if (!sg) return null;
  const [p, q] = sg;
  const k = (p.k + q.k) / 2;
  const sw = clamp(0.006 * k, 3.5, 8);
  const dash = sw * 3.2, gap = sw * 2.2;
  const L = Math.hypot(q.x - p.x, q.y - p.y);
  return (
    <g opacity={a}>
      <defs>
        <linearGradient id={`${id}-g`} gradientUnits="userSpaceOnUse" x1={fmt(p.x)} y1={fmt(p.y)} x2={fmt(q.x)} y2={fmt(q.y)}>
          <stop offset="0" stopColor={C.amber} stopOpacity={1} />
          <stop offset={fmt(clamp(1 - fadeEnd))} stopColor={C.amber} stopOpacity={1} />
          <stop offset="1" stopColor={C.amber} stopOpacity={fadeEnd > 0 ? 0 : 1} />
        </linearGradient>
      </defs>
      <path d={`M${fmt(p.x)},${fmt(p.y)} L${fmt(q.x)},${fmt(q.y)}`} stroke={`url(#${id}-g)`} strokeWidth={sw * 3.2} opacity={0.16} strokeLinecap="round" />
      <path d={`M${fmt(p.x)},${fmt(p.y)} L${fmt(q.x)},${fmt(q.y)}`} stroke="#5A3A10" strokeWidth={sw + 2.4} strokeDasharray={`${fmt(dash)} ${fmt(gap)}`} strokeDashoffset={fmt(-t * 70)} opacity={0.35} strokeLinecap="round" />
      <path d={`M${fmt(p.x)},${fmt(p.y)} L${fmt(q.x)},${fmt(q.y)}`} stroke={`url(#${id}-g)`} strokeWidth={sw} strokeDasharray={`${fmt(dash)} ${fmt(gap)}`} strokeDashoffset={fmt(-t * 70)} strokeLinecap="round" />
      {L < 2 ? null : null}
    </g>
  );
};

/** a small ring at the point where the bystander's shoulder meets the path (the cause, confirmed briefly) */
export const HitMark: React.FC<{b: Basis; p: V3; a: number; pulse: number}> = ({b, p, a, pulse}) => {
  if (a <= 0.01) return null;
  const q = proj(b, p);
  const r = clamp(0.018 * q.k, 6, 16);
  return (
    <g opacity={a}>
      <circle cx={fmt(q.x)} cy={fmt(q.y)} r={fmt(r * 0.45)} fill={C.amber} />
      {pulse > 0 && <circle cx={fmt(q.x)} cy={fmt(q.y)} r={fmt(r * (1 + 1.4 * pulse))} fill="none" stroke={C.amber} strokeWidth={3} opacity={1 - pulse} />}
    </g>
  );
};

/** the listening region (soft teal, in the air outside the ear) and the received accent: pressure fronts moving from
 *  the focus into the ear opening. `rx` is how strong the received signal is (0 when blocked). */
export const EarAccent: React.FC<{b: Basis; focus: V3; ear: V3; region: number; rx: number; t: number; id: string}> = ({b, focus, ear, region, rx, t, id}) => {
  if (region <= 0.003 && rx <= 0.003) return null;
  const f = proj(b, focus), e = proj(b, ear);
  const rad = 0.045 * f.k;
  const dx = e.x - f.x, dy = e.y - f.y;
  const dl = Math.hypot(dx, dy) || 1;
  const ux = dx / dl, uy = dy / dl;
  const ang = (Math.atan2(uy, ux) * 180) / Math.PI;
  const span = Math.max(dl, rad * 0.8);
  const fronts: React.ReactNode[] = [];
  for (let i = 0; i < 3; i++) {
    const ph = (t * 1.6 + i / 3) % 1;
    const cx = f.x - ux * span * 0.6 + ux * span * 1.25 * ph, cy = f.y - uy * span * 0.6 + uy * span * 1.25 * ph;
    const r = span * 0.9;
    const op = Math.sin(Math.PI * ph) * rx;
    fronts.push(<path key={i} d={arcD(cx - ux * r, cy - uy * r, r, ang, 46)} fill="none" stroke={C.teal} strokeWidth={clamp(0.004 * f.k, 2.5, 7)} strokeLinecap="round" opacity={op} />);
  }
  return (
    <g>
      <defs>
        <radialGradient id={`${id}-rg`}>
          <stop offset="0" stopColor={C.teal} stopOpacity={0.45} />
          <stop offset="0.6" stopColor={C.teal} stopOpacity={0.16} />
          <stop offset="1" stopColor={C.teal} stopOpacity={0} />
        </radialGradient>
      </defs>
      <ellipse cx={fmt(f.x)} cy={fmt(f.y)} rx={fmt(rad * 1.25)} ry={fmt(rad)} fill={`url(#${id}-rg)`} opacity={region * (0.55 + 0.45 * rx)} />
      {fronts}
    </g>
  );
};
/** circular arc centred at (cx, cy), radius r, around direction ang (deg), half-span hs (deg) */
export const arcD = (cx: number, cy: number, r: number, ang: number, hs: number) => {
  const a0 = ((ang - hs) * Math.PI) / 180, a1 = ((ang + hs) * Math.PI) / 180;
  return `M${fmt(cx + r * Math.cos(a0))},${fmt(cy + r * Math.sin(a0))} A${fmt(r)},${fmt(r)} 0 0 1 ${fmt(cx + r * Math.cos(a1))},${fmt(cy + r * Math.sin(a1))}`;
};

// ---------------------------------------------------------------- the sweep (beat D)
export const SWEEP_H = 0.24; // the arc's height above the listening position (m)
export const SWEEP_HZ = 0.62; // one stroke per 1.6 s: visibly slowed for explanation
/** stroke phase 0..1: the spot runs DOWN toward the listener for the first 75 %, then returns quickly */
export const sweepPhase = (t: number, t0: number) => {
  const x = ((t - t0) * SWEEP_HZ) % 1;
  return x < 0 ? x + 1 : x;
};
export const sweepSpot = (focus: V3, ph: number, amt: number): {p: V3; down: boolean; u: number} => {
  const down = ph < 0.75;
  const u = down ? ph / 0.75 : 1 - smooth((ph - 0.75) / 0.25);
  return {p: a3(focus, v3(0, SWEEP_H * (1 - u) * amt, 0)), down, u};
};
export const Sweep: React.FC<{b: Basis; focus: V3; t: number; t0: number; amt: number; strength: number}> = ({b, focus, t, t0, amt, strength}) => {
  if (amt <= 0.003) return null;
  const top = proj(b, a3(focus, v3(0, SWEEP_H, 0))), bot = proj(b, focus), ex = proj(b, EXIT);
  // the swept range: a faint fan from the exit
  const fan = `M${fmt(ex.x)},${fmt(ex.y)} L${fmt(top.x)},${fmt(top.y)} L${fmt(bot.x)},${fmt(bot.y)} Z`;
  // wavelets: emitted along the down-stroke, each growing at the spot's own speed, so their fronts gather at the
  // moving spot and arrive together at the listener (drawn for the current and previous stroke)
  const nodes: React.ReactNode[] = [];
  const ph = sweepPhase(t, t0);
  const stroke = Math.floor((t - t0) * SWEEP_HZ);
  const vis = (x: number) => Math.sin(Math.PI * clamp(x));
  for (const sk of [stroke - 1, stroke]) {
    const tStart = t0 + sk / SWEEP_HZ;
    const T = 0.75 / SWEEP_HZ; // duration of the down-stroke
    for (let i = 0; i < 7; i++) {
      const te = tStart + (i / 7) * T;
      if (te > t || te < t0) continue;
      const age = t - te;
      const emit = a3(focus, v3(0, SWEEP_H * (1 - i / 7) * amt, 0));
      const speed = (SWEEP_H * amt) / T; // m/s, the same as the spot's
      const r = speed * age;
      if (r > SWEEP_H * 1.4) continue;
      const c = proj(b, emit);
      const rp = r * c.k;
      const op = 0.85 * amt * strength * (1 - clamp(r / (SWEEP_H * 1.4))) * vis(age * 3);
      if (rp < 1) continue;
      nodes.push(<path key={`${sk}-${i}`} d={arcD(c.x, c.y, rp, 90, 62)} fill="none" stroke={C.teal} strokeWidth={clamp(0.006 * c.k, 3, 7)} strokeLinecap="round" opacity={op} />);
    }
  }
  // the gathered front at the listener: brightest right after a down-stroke completes
  const gather = ph < 0.75 ? ph / 0.75 : 1 - (ph - 0.75) / 0.25;
  const spot = sweepSpot(focus, ph, amt);
  const sp = proj(b, spot.p);
  return (
    <g>
      <path d={fan} fill={C.amber} opacity={0.08 * amt} />
      {nodes}
      <circle cx={fmt(bot.x)} cy={fmt(bot.y)} r={fmt(0.045 * bot.k * (0.6 + 0.6 * gather))} fill={C.teal} opacity={0.45 * amt * strength * gather} />
      <circle cx={fmt(sp.x)} cy={fmt(sp.y)} r={fmt(clamp(0.007 * sp.k, 3, 9))} fill={C.amber} opacity={0.9 * amt} />
    </g>
  );
};

// ---------------------------------------------------------------- 8 FT
export const Dimension: React.FC<{b: Basis; ear: V3; draw: number; a: number}> = ({b, ear, draw, a}) => {
  if (a <= 0.003) return null;
  const y = EXIT.y - 0.3;
  const A = v3(EXIT.x, y, 0), B = v3(ear.x, y, 0);
  const pa = proj(b, A), pb = proj(b, B);
  const pm = proj(b, lerp3(A, B, 0.5));
  const end = {x: lerp(pa.x, pb.x, draw), y: lerp(pa.y, pb.y, draw)};
  const ext = (P: V3) => {
    const p0 = proj(b, P), p1 = proj(b, v3(P.x, y - 0.05, P.z));
    return <path d={`M${fmt(p0.x)},${fmt(p0.y)} L${fmt(p1.x)},${fmt(p1.y)}`} stroke="#FFFFFF" strokeWidth={2} strokeDasharray="5 5" opacity={0.85} />;
  };
  const tick = (p: P2, dir: number) => {
    const ang = Math.atan2(pb.y - pa.y, pb.x - pa.x);
    const L = 14;
    const ax = Math.cos(ang) * dir, ay = Math.sin(ang) * dir;
    return <path d={`M${fmt(p.x + ax * L - ay * 8)},${fmt(p.y + ay * L + ax * 8)} L${fmt(p.x)},${fmt(p.y)} L${fmt(p.x + ax * L + ay * 8)},${fmt(p.y + ay * L - ax * 8)}`} fill="none" stroke="#FFFFFF" strokeWidth={3} strokeLinejoin="round" />;
  };
  const ang = (Math.atan2(pb.y - pa.y, pb.x - pa.x) * 180) / Math.PI;
  const lab = clamp(inv(0.75, 1, draw));
  return (
    <g opacity={a}>
      {ext(v3(EXIT.x, EXIT.y - 0.03, 0))}
      {ext(v3(ear.x, EXIT.y - 0.06, 0))}
      <path d={`M${fmt(pa.x)},${fmt(pa.y)} L${fmt(end.x)},${fmt(end.y)}`} stroke="#132430" strokeWidth={7} opacity={0.35} strokeLinecap="round" />
      <path d={`M${fmt(pa.x)},${fmt(pa.y)} L${fmt(end.x)},${fmt(end.y)}`} stroke="#FFFFFF" strokeWidth={3} strokeLinecap="round" />
      {tick(pa, 1)}
      {draw > 0.98 && tick(pb, -1)}
      {lab > 0 && (
        <g transform={`translate(${fmt(pm.x)},${fmt(pm.y)}) rotate(${fmt(ang)}) translate(0,-30) scale(${fmt(0.85 + 0.15 * lab)})`} opacity={lab}>
          <rect x={-62} y={-27} width={124} height={54} rx={27} fill="#132430" opacity={0.88} />
          <text x={0} y={13} textAnchor="middle" fontFamily='"Nunito Variable", system-ui' fontWeight={900} fontSize={38} fill="#FFFFFF" letterSpacing="0.04em">8 FT</text>
        </g>
      )}
    </g>
  );
};

export {l3, m3, n3, s3};
