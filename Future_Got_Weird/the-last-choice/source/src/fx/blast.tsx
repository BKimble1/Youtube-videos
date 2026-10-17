// The decisive blast and the breaching charge that causes it.
import React from 'react';
import {CITY, SYS} from '../theme';
import {rnd, clamp, lerp, noise} from '../kit/math';
import {fxId, mixHex} from './common';
import {Glow} from './light';
import {Debris, Sparks, Material} from './particles';
import {Smoke, Dust} from './smoke';

export type BlastProps = {
  x: number; y: number; t: number; t0: number; seed?: number; size?: number; ground?: number;
  debris?: boolean; debrisMaterial?: Material; debrisN?: number; smoke?: boolean; sparks?: boolean; ink?: number; dir?: number;
};
/**
 * Explosion centred at (x, y) at t0, radius scale `size` (fireball ≈ size). Flash (0–0.18 s) → expanding fireball
 * cooling from white-hot to ember to dark smoke (0.1–1.2 s) → rising plume (to ~5 s) + shock ring, debris, sparks.
 */
export const Blast: React.FC<BlastProps> = ({x, y, t, t0, seed = 1, size = 300, ground, debris = true, debrisMaterial = 'concrete', debrisN = 22, smoke = true, sparks = true, ink = 3, dir = -90}) => {
  const a = t - t0;
  if (a < -0.01) return null;
  const out: React.ReactElement[] = [];
  // plume (behind the fireball)
  if (smoke) out.push(<Smoke key="plume" x={x} y={y - size * 0.35} t={t} t0={t0 + 0.12} t1={t0 + 1.3} rate={9} life={4.2} vx={20} vy={-size * 0.55} size={size * 0.32} grow={size * 0.22} spread={size * 0.5} color="#2E272B" shade="#1A1618" opacity={0.85} seed={seed + 3} id={fxId('bp', seed, x, y)} />);
  if (ground !== undefined) out.push(<Dust key="dust" x={x} y={ground} t={t} t0={t0 + 0.05} size={size * 0.9} n={12} seed={seed + 5} color="#8E8378" life={3} id={fxId('bd', seed, x, ground)} />);
  // fireball: each blob has an ember/fire rim, a hot body and (early) a white core; it cools toward dark smoke and
  // hands over to the plume
  const n = 9;
  const L0: React.ReactElement[] = [], L1: React.ReactElement[] = [], L2: React.ReactElement[] = [];
  for (let i = 0; i < n; i++) {
    const ang = rnd(seed * 3 + i) * Math.PI * 2;
    const off = size * 0.48 * Math.sqrt(rnd(seed * 5 + i));
    const grow = 1 - Math.exp(-7 * a);
    const rise = a * size * 0.3 * (0.5 + rnd(seed * 7 + i));
    const cx = x + Math.cos(ang) * off * grow;
    const cy = y + Math.sin(ang) * off * grow * 0.75 - rise;
    const r = size * (0.3 + 0.22 * rnd(seed * 9 + i)) * (0.35 + 0.65 * grow) * (1 + 0.05 * noise(t * 8 + i, seed));
    const cool = clamp((a - 0.04 - 0.08 * rnd(seed * 11 + i)) / 0.95);
    const rim = cool < 0.35 ? mixHex(CITY.fire, CITY.ember, cool / 0.35) : mixHex(CITY.ember, '#3A2F33', (cool - 0.35) / 0.45);
    const body = cool < 0.3 ? mixHex(CITY.fireCore, CITY.fireHot, cool / 0.3) : mixHex(CITY.fireHot, CITY.ember, (cool - 0.3) / 0.4);
    const op = clamp(1.25 - Math.max(0, a - 0.75) / 0.55);
    if (op <= 0) continue;
    L0.push(<circle key={`a${i}`} cx={cx} cy={cy} r={r} fill={rim} opacity={op} />);
    const bk = clamp(1 - (cool - 0.5) / 0.3);
    if (bk > 0) L1.push(<circle key={`b${i}`} cx={cx - r * 0.06} cy={cy - r * 0.14} r={r * 0.7 * (0.6 + 0.4 * bk)} fill={body} opacity={op * bk} />);
    const ck = clamp(1 - cool / 0.28);
    if (ck > 0) L2.push(<circle key={`c${i}`} cx={cx - r * 0.1} cy={cy - r * 0.22} r={r * 0.38 * ck} fill={CITY.fireCore} opacity={op} />);
  }
  out.push(<g key="fb">{L0}{L1}{L2}</g>);
  // hot core
  if (a < 0.45) out.push(<circle key="core" cx={x} cy={y - a * size * 0.15} r={size * 0.38 * (1 - Math.exp(-10 * a)) * (1 - a / 0.45)} fill={CITY.fireCore} opacity={1 - a / 0.45} />);
  // shock ring
  if (a < 0.3) out.push(<circle key="ring" cx={x} cy={y} r={size * (0.5 + a * 7)} fill="none" stroke="#FFF6E0" strokeWidth={size * 0.04 * (1 - a / 0.3)} opacity={0.45 * (1 - a / 0.3)} />);
  // flash
  if (a < 0.2) out.push(<Glow key="flash" x={x} y={y} r={size * (1.6 + a * 10)} color="#FFF4D0" opacity={1 - a / 0.2} id={fxId('bf', seed, x, y)} core={0.25} />);
  out.push(<Glow key="lit" x={x} y={y} r={size * 3} color={CITY.fire} opacity={0.45 * clamp(1 - a / 1.6)} id={fxId('bl', seed, x, y)} />);
  if (debris) out.push(<Debris key="deb" x={x} y={y} t={t} t0={t0} seed={seed + 7} n={debrisN} dir={dir} spread={200} speed={[size * 2, size * 6]} size={[size * 0.03, size * 0.1]} ground={ground} material={debrisMaterial} ink={ink} />);
  if (sparks) out.push(<Sparks key="sp" x={x} y={y} t={t} t0={t0} seed={seed + 9} n={26} spread={240} speed={[size * 2.5, size * 7]} width={Math.max(2, size * 0.012)} life={[0.3, 0.9]} />);
  return <g>{out}</g>;
};

export type ChargeProps = {x0: number; y0: number; x1: number; y1: number; t: number; t0: number; t1: number; arc?: number; size?: number; seed?: number; color?: string};
/** A breaching charge flying from (x0, y0) at t0 to (x1, y1) at t1 on a shallow arc, with a smoke trail and a hot
 *  slug; nothing outside [t0, t1] (pair it with a Blast at t1). */
export const chargePos = (p: ChargeProps, u: number) => {
  const mx = (p.x0 + p.x1) / 2, my = (p.y0 + p.y1) / 2 - (p.arc ?? 0);
  const q = (a: number, b: number, c: number) => (1 - u) * (1 - u) * a + 2 * (1 - u) * u * b + u * u * c;
  return {x: q(p.x0, mx, p.x1), y: q(p.y0, my, p.y1)};
};
export const Charge: React.FC<ChargeProps> = (p) => {
  const {t, t0, t1, size = 24, seed = 1, color = SYS.lock} = p;
  const u = (t - t0) / (t1 - t0);
  if (u < 0 || u > 1) return null;
  const pos = chargePos(p, u);
  const prev = chargePos(p, Math.max(0, u - 0.02));
  const ang = (Math.atan2(pos.y - prev.y, pos.x - prev.x) * 180) / Math.PI;
  const trail: React.ReactElement[] = [];
  for (let k = 1; k <= 14; k++) {
    const uk = u - k * 0.022;
    if (uk < 0) break;
    const q = chargePos(p, uk);
    const age = k / 14;
    trail.push(<circle key={k} cx={q.x + noise(k + t * 3, seed) * size * 0.3} cy={q.y - age * size * 0.6} r={size * (0.35 + age * 0.9)} fill="#8F8A86" opacity={0.45 * (1 - age)} />);
  }
  const streak = chargePos(p, Math.max(0, u - 0.06));
  return (
    <g>
      {trail}
      <line x1={streak.x} y1={streak.y} x2={pos.x} y2={pos.y} stroke={color} strokeWidth={size * 0.5} strokeLinecap="round" opacity={0.7} />
      <Glow x={pos.x} y={pos.y} r={size * 3} color={color} opacity={0.6} id={fxId('cg', seed, p.x0, p.y0)} />
      <g transform={`translate(${pos.x.toFixed(1)} ${pos.y.toFixed(1)}) rotate(${ang.toFixed(1)})`}>
        <rect x={-size} y={-size * 0.42} width={size * 2} height={size * 0.84} rx={size * 0.4} fill={SYS.dark} stroke="#0E1418" strokeWidth={size * 0.12} />
        <circle cx={size * 0.75} cy={0} r={size * 0.32} fill={SYS.lockCore} />
      </g>
    </g>
  );
};
void lerp;
