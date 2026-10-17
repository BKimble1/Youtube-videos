// SkylineFar — the burning Midtown silhouette behind the avenue (north, far parallax layer, p ≈ 0.1–0.35).
// Drawn near screen scale: horizon line at `base` (default 0), towers rise to about −900·h. Generic towers plus a
// terraced-crown spire (Chrysler-like) and a stepped tower with a mast (Empire State-like). No text, no logos.
import React from 'react';
import {CITY} from '../theme';
import {rnd, noise, f2, range, Flames, Glow, SmokeColumn, INK} from './cityKit';

const TOWER = ['#2E1F28', '#342230', '#3A2730', '#2A1C24'];
const TOWER_NEAR = ['#43292E', '#4B2E30', '#3E2629'];

const Windows: React.FC<{x: number; y: number; w: number; h: number; seed: number; lit: number; t: number; size: number}> = ({x, y, w, h, seed, lit, t, size}) => {
  const out: React.ReactElement[] = [];
  const cols = Math.max(1, Math.floor(w / (size * 2.4)));
  const rows = Math.max(1, Math.floor(h / (size * 2.6)));
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const k = seed * 977 + r * 31 + c;
    if (rnd(k) > lit) continue;
    const fl = 0.75 + 0.25 * noise(t * 0.8 + k, k);
    out.push(<rect key={`${r}_${c}`} x={x + (c + 0.3) * (w / cols)} y={y + (r + 0.3) * (h / rows)} width={size} height={size * 1.3} fill={rnd(k + 5) > 0.75 ? CITY.fireHot : CITY.windowLit} opacity={0.55 * fl} />);
  }
  return <g>{out}</g>;
};

/** A terraced, arched crown on a slim tower (Chrysler-like silhouette). x = centre, base = ground. */
const SpireTower: React.FC<{x: number; base: number; h: number; t: number; ink: number}> = ({x, base, h, t, ink}) => {
  const shaftW = 120 * h, shaftH = 760 * h, top = base - shaftH;
  const tiers = range(6).map((i) => {
    const w = shaftW * (0.92 - i * 0.14), y = top - i * 36 * h;
    return <path key={i} d={`M ${f2(x - w / 2)} ${f2(y)} L ${f2(x - w / 2)} ${f2(y - 16 * h)} A ${f2(w / 2)} ${f2(w * 0.42)} 0 0 1 ${f2(x + w / 2)} ${f2(y - 16 * h)} L ${f2(x + w / 2)} ${f2(y)} Z`} fill={TOWER[2]} stroke={INK} strokeWidth={ink * 0.6} />;
  });
  const tri = range(5).map((i) => {
    const w = shaftW * (0.78 - i * 0.14), y = top - i * 36 * h - 22 * h;
    return range(3).map((j) => <path key={`${i}_${j}`} d={`M ${f2(x + (j - 1) * w * 0.28 - 5 * h)} ${f2(y)} l ${f2(5 * h)} ${f2(-12 * h)} l ${f2(5 * h)} ${f2(12 * h)} Z`} fill={CITY.windowLit} opacity={0.6 + 0.3 * noise(t + i + j, 7)} />);
  });
  return (
    <g>
      <rect x={x - shaftW / 2} y={top} width={shaftW} height={shaftH} fill={TOWER[1]} stroke={INK} strokeWidth={ink * 0.6} />
      <rect x={x - shaftW * 0.62} y={base - shaftH * 0.42} width={shaftW * 1.24} height={shaftH * 0.42} fill={TOWER[0]} stroke={INK} strokeWidth={ink * 0.6} />
      {tiers}
      {tri}
      <path d={`M ${f2(x - 6 * h)} ${f2(top - 220 * h)} L ${f2(x)} ${f2(top - 330 * h)} L ${f2(x + 6 * h)} ${f2(top - 220 * h)} Z`} fill={TOWER[2]} stroke={INK} strokeWidth={ink * 0.5} />
      <Windows x={x - shaftW / 2} y={top + 20} w={shaftW} h={shaftH * 0.55} seed={11} lit={0.18} t={t} size={7 * h} />
    </g>
  );
};

/** Stepped setback tower with a mast (Empire State-like silhouette). */
const SteppedTower: React.FC<{x: number; base: number; h: number; t: number; ink: number}> = ({x, base, h, t, ink}) => {
  const steps: [number, number][] = [[260, 300], [200, 480], [150, 720], [110, 860], [70, 910], [40, 960]];
  return (
    <g>
      {steps.map(([w, top], i) => (
        <rect key={i} x={x - (w * h) / 2} y={base - top * h} width={w * h} height={top * h - (i ? steps[i - 1][1] * h : 0) + 2} fill={TOWER[i % 2 ? 0 : 3]} stroke={INK} strokeWidth={ink * 0.6} />
      ))}
      <line x1={x} y1={base - 960 * h} x2={x} y2={base - 1110 * h} stroke={TOWER[1]} strokeWidth={10 * h} />
      <line x1={x} y1={base - 960 * h} x2={x} y2={base - 1110 * h} stroke={INK} strokeWidth={ink * 0.5} />
      <circle cx={x} cy={base - 1110 * h} r={4 * h} fill={CITY.ember} opacity={0.5 + 0.5 * Math.max(0, Math.sin(t * 2.4))} />
      <Windows x={x - 100 * h} y={base - 700 * h} w={200 * h} h={600 * h} seed={23} lit={0.22} t={t} size={7 * h} />
    </g>
  );
};

export type SkylineProps = {x0?: number; x1?: number; base?: number; h?: number; t: number; seed?: number; ink?: number; fire?: number; spireX?: number; steppedX?: number; sky?: boolean};

/** Sky + far towers + smoke + fire glow. Spans x0..x1 (default −400..2400, i.e. a little wider than the frame). */
export const SkylineFar: React.FC<SkylineProps> = ({x0 = -400, x1 = 2400, base = 0, h = 1, t, seed = 3, ink = 2, fire = 1, spireX, steppedX, sky = true}) => {
  const W = x1 - x0;
  const towers: React.ReactElement[] = [];
  let x = x0 - 40;
  let i = 0;
  while (x < x1 + 40) {
    const w = (90 + rnd(seed * 50 + i) * 170) * h;
    const th = (260 + rnd(seed * 50 + i + 7) * 520) * h;
    const col = TOWER[i % TOWER.length];
    const crown = rnd(seed * 50 + i + 13);
    towers.push(
      <g key={i}>
        <rect x={x} y={base - th} width={w} height={th + 4} fill={col} stroke={INK} strokeWidth={ink * 0.6} />
        {crown > 0.7 && <rect x={x + w * 0.2} y={base - th - 40 * h} width={w * 0.6} height={42 * h} fill={col} stroke={INK} strokeWidth={ink * 0.6} />}
        {crown < 0.18 && <line x1={x + w * 0.5} y1={base - th} x2={x + w * 0.5} y2={base - th - 90 * h} stroke={INK} strokeWidth={ink * 0.8} />}
        <Windows x={x + 6} y={base - th + 14} w={w - 12} h={th - 40} seed={seed * 13 + i} lit={0.16} t={t} size={6 * h} />
      </g>,
    );
    x += w * (0.85 + rnd(seed * 50 + i + 3) * 0.4);
    i++;
  }
  // a nearer, lower tier of blocks (darker warm) to set the far towers back
  const near: React.ReactElement[] = [];
  x = x0 - 60;
  i = 0;
  while (x < x1 + 60) {
    const w = (140 + rnd(seed * 70 + i) * 220) * h;
    const th = (120 + rnd(seed * 70 + i + 9) * 200) * h;
    near.push(<rect key={i} x={x} y={base - th} width={w} height={th + 4} fill={TOWER_NEAR[i % TOWER_NEAR.length]} stroke={INK} strokeWidth={ink * 0.6} />);
    x += w * 0.92;
    i++;
  }
  const sx = spireX ?? x0 + W * 0.36, ex = steppedX ?? x0 + W * 0.62;
  const fires = [0.12, 0.47, 0.8].map((u, k) => x0 + W * u + rnd(seed + k) * 80);
  const gid = `skyg${seed}`;
  return (
    <g>
      {sky && (
        <>
          <defs>
            <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={CITY.skyTop} />
              <stop offset="55%" stopColor={CITY.skyMid} />
              <stop offset="88%" stopColor={CITY.skyLow} />
              <stop offset="100%" stopColor={CITY.haze} />
            </linearGradient>
          </defs>
          <rect x={x0 - 400} y={base - 2600 * h} width={W + 800} height={2700 * h + 400} fill={`url(#${gid})`} />
        </>
      )}
      {fires.map((fx, k) => <Glow key={`g${k}`} id={`${gid}gl${k}`} cx={fx} cy={base - 60 * h} rx={520 * h} ry={380 * h} op={0.5 * fire} />)}
      {towers}
      <SteppedTower x={ex} base={base} h={h * 0.95} t={t} ink={ink} />
      <SpireTower x={sx} base={base} h={h} t={t} ink={ink} />
      {/* fires burn among the far blocks: small flames, mostly hidden by the near tier, with tall smoke */}
      {fires.map((fx, k) => (
        <g key={`f${k}`}>
          <g transform={`translate(${f2(fx)} ${f2(base - 150 * h)})`}><Flames w={110 * h * fire} h={70 * h * fire} t={t} seed={seed + k * 3} n={3} /></g>
          <SmokeColumn x={fx} y={base - 160 * h} h={1300 * h} w={260 * h} t={t} seed={seed * 9 + k} op={0.72} drift={0.25 + k * 0.08} />
        </g>
      ))}
      {near}
    </g>
  );
};
