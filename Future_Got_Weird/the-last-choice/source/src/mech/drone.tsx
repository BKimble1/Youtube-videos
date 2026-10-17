// Surveillance drone: quad rotors (blurred discs), a pale hull and an underslung gimbal carrying the SensorEye.
// Anchor: hull centre (x, y). ~150 units wide at s = 1. face −1..1 turns it from front (0) to side (±1, nose toward
// that side). look is where the eye points (−1..1). smash breaks it into flying pieces with sparks.
import React from 'react';
import {SYS} from '../theme';
import {V2, clamp, rnd, f2} from '../kit/math';
import {INK, M, SensorEye, Sparks, Flying, rrect, SysMark} from './common';

export type DroneProps = {
  x: number; y: number; s?: number; t: number; seed?: number; ink?: number;
  tilt?: number; face?: number; look?: V2; lock?: number; lightOn?: number; glow?: number; rotor?: number;
  smash?: {t0: number; dir: number; groundY?: number; power?: number};
};

const Rotor: React.FC<{x: number; y: number; w: number; t: number; seed: number; ink: number; speed?: number}> = ({x, y, w, t, seed, ink, speed = 1}) => {
  const ph = t * 38 * speed + seed * 1.7;
  const streak = (k: number) => {
    const a = ph + k * Math.PI;
    const c = Math.cos(a);
    return <line key={k} x1={x - c * w * 0.95} y1={y - Math.sin(a) * w * 0.12} x2={x + c * w * 0.95} y2={y + Math.sin(a) * w * 0.12} stroke="#E9F2F5" strokeWidth={w * 0.07} strokeLinecap="round" opacity={0.45} />;
  };
  return (
    <g>
      <ellipse cx={x} cy={y} rx={w} ry={w * 0.17} fill="rgba(214,232,238,0.32)" stroke="rgba(22,42,50,0.35)" strokeWidth={ink * 0.5} />
      {speed > 0.05 ? [streak(0), streak(0.5)] : <line x1={x - w * 0.9} y1={y} x2={x + w * 0.9} y2={y} stroke={INK} strokeWidth={w * 0.09} strokeLinecap="round" />}
      <circle cx={x} cy={y} r={w * 0.1} fill={M.frameDark} />
    </g>
  );
};

/** Drawn parts in drone-local coordinates (origin hull centre, s = 1). */
const parts = (p: DroneProps, ink: number) => {
  const face = clamp(p.face ?? 0, -1, 1);
  const af = Math.abs(face);
  const bw = 74 + 16 * af; // hull width grows when seen from the side (it is longer than wide)
  const t = p.t, seed = p.seed ?? 1;
  const rotor = p.rotor ?? 1;
  const nose = face; // nose toward screen side
  const eyeX = nose * 24;
  const L = (sd: number) => (
    <g key={`arm${sd}`}>
      {/* rear rotor (slightly higher and inward: the drone is seen a little from above) */}
      <path d={`M ${sd * 20} -4 L ${sd * 54} -14`} stroke={M.frameDark} strokeWidth={8} strokeLinecap="round" />
      <rect x={sd * 54 - 6} y={-22} width={12} height={10} rx={3} fill={M.frame} stroke={INK} strokeWidth={ink * 0.6} />
      <Rotor x={sd * 54} y={-24} w={28} t={t} seed={seed + sd * 3} ink={ink} speed={rotor} />
    </g>
  );
  const F = (sd: number) => (
    <g key={`farm${sd}`}>
      <path d={`M ${sd * 22} 2 L ${sd * 68} -4`} stroke={M.frame} strokeWidth={10} strokeLinecap="round" />
      <path d={`M ${sd * 22} 2 L ${sd * 68} -4`} stroke={INK} strokeWidth={10 + ink * 2} strokeLinecap="round" opacity={0} />
      <rect x={sd * 68 - 8} y={-14} width={16} height={14} rx={4} fill={M.plate} stroke={INK} strokeWidth={ink * 0.7} />
      <Rotor x={sd * 68} y={-16} w={34} t={t} seed={seed + sd * 7} ink={ink} speed={rotor} />
    </g>
  );
  const hull = (
    <g key="hull">
      <path d={rrect(0, 0, bw, 30, 13)} fill={M.plate} stroke={INK} strokeWidth={ink} />
      <path d={`M ${-bw / 2 + 6} 4 Q 0 14 ${bw / 2 - 6} 4 L ${bw / 2 - 8} 9 Q 0 17 ${-bw / 2 + 8} 9 Z`} fill={M.plateShade} />
      <path d={rrect(nose * 8, -9, bw * 0.5, 9, 4)} fill={M.frame} />
      <SysMark x={-nose * 18 - (1 - af) * 18} y={1} r={6} opacity={0.9} />
      {(p.lightOn ?? 1) > 0 && <circle cx={nose * 28 + (1 - af) * 16} cy={-8} r={3.2} fill={SYS.sensor} opacity={p.lightOn ?? 1} />}
    </g>
  );
  const gimbal = (
    <g key="gimbal">
      <path d={`M ${eyeX - 14} 10 L ${eyeX - 12} 24 M ${eyeX + 14} 10 L ${eyeX + 12} 24`} stroke={M.frameDark} strokeWidth={6} strokeLinecap="round" />
      <SensorEye x={eyeX} y={27} r={16} look={p.look} lock={p.lock} glow={p.glow ?? 0.4} ink={ink * 0.8} squash={1 - af * 0.15} id={`dreye${seed}_${Math.round(p.x)}_${Math.round(p.y)}`} />
    </g>
  );
  return {rear: [L(-1), L(1)], front: [F(-1), F(1)], hull, gimbal};
};

export const Drone: React.FC<DroneProps> = (p) => {
  const s = p.s ?? 1;
  const ink = (p.ink ?? 4 * s) / s;
  const bob = Math.sin(p.t * 3.1 + (p.seed ?? 1)) * 3 * (p.smash ? 0 : 1);
  const q = parts(p, ink);
  const sm = p.smash;
  if (!sm || p.t < sm.t0) {
    return (
      <g transform={`translate(${f2(p.x)} ${f2(p.y + bob * s)}) scale(${f2(s)}) rotate(${f2(p.tilt ?? 0)})`}>
        {q.rear}{q.gimbal}{q.hull}{q.front}
      </g>
    );
  }
  // smashed: pieces fly from the impact; positions in world units
  const pw = sm.power ?? 1;
  const a = (sm.dir * Math.PI) / 180;
  const base = {vx: Math.cos(a) * 520 * pw, vy: Math.sin(a) * 520 * pw - 200};
  const seed = p.seed ?? 1;
  const piece = (k: number, el: React.ReactNode, ox: number, oy: number) => (
    <Flying key={k} t={p.t} t0={sm.t0} x={p.x + ox * s} y={p.y + oy * s} vx={base.vx + (rnd(seed * 7 + k) - 0.5) * 520 * pw} vy={base.vy + (rnd(seed * 11 + k) - 0.6) * 520 * pw}
      spin={(rnd(seed * 3 + k) - 0.5) * 900} rot0={p.tilt ?? 0} groundY={sm.groundY}>
      <g transform={`scale(${f2(s)}) translate(${f2(-ox)} ${f2(-oy)})`}>{el}</g>
    </Flying>
  );
  return (
    <g>
      {piece(1, q.rear[0], -54, -18)}
      {piece(2, q.rear[1], 54, -18)}
      {piece(3, q.front[0], -60, -6)}
      {piece(4, q.front[1], 60, -6)}
      {piece(5, <g><path d={rrect(-14, 0, 46, 30, 12)} fill={M.plate} stroke={INK} strokeWidth={ink} /><path d={`M 8 -15 L 2 -4 L 9 4 L 3 15`} fill="none" stroke={INK} strokeWidth={ink} /></g>, -14, 0)}
      {piece(6, <g><path d={rrect(16, 0, 40, 30, 12)} fill={M.plateShade} stroke={INK} strokeWidth={ink} /><path d={`M 2 -12 L 9 -2 L 2 8`} fill="none" stroke={SYS.cable[0]} strokeWidth={3} /></g>, 16, 0)}
      {piece(7, q.gimbal, 0, 27)}
      <Sparks t={p.t} t0={sm.t0} x={p.x} y={p.y} dir={sm.dir} spread={200} n={22} speed={800 * pw} life={0.7} seed={seed * 5} w={3.4 * s} groundY={sm.groundY} />
    </g>
  );
};
