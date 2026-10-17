// Street — the avenue ground band seen from the side: far sidewalk (top y −140 → curb at −70), asphalt from −56 down to
// yFront (the action line y = 0 lies on the asphalt). Cracks, potholes, puddles, lane markings, debris, a steaming
// manhole. Street furniture: Streetlight, TrafficLight, Hydrant (bases on the sidewalk, y ≈ −100).
import React from 'react';
import {CITY} from '../theme';
import {rnd, noise, f2, range, polyPath, smoothPath, INK, K, SmokeColumn, Glow, blobD} from './cityKit';

export const SIDEWALK_Y = -100; // where furniture on the far sidewalk stands

export type StreetProps = {x0: number; x1: number; yFront?: number; t: number; seed?: number; ink?: number; debris?: number; manholes?: number[]; puddles?: boolean};

export const Street: React.FC<StreetProps> = ({x0, x1, yFront = 1600, t, seed = 5, ink = 6, debris = 1, manholes = [], puddles = true}) => {
  const W = x1 - x0;
  const els: React.ReactElement[] = [];
  // sidewalk slabs (sparse joints, no striping)
  for (let x = x0 - (x0 % 700); x < x1; x += 700) els.push(<line key={`sj${x}`} x1={x} y1={-140} x2={x + 30} y2={-70} stroke={K.sidewalkDark} strokeWidth={ink * 0.6} />);
  // lane markings (dashed, worn)
  for (let x = x0 - (x0 % 900); x < x1; x += 900) {
    const k = seed * 7 + Math.round(x / 900);
    if (rnd(k) < 0.25) continue;
    els.push(<rect key={`ln${x}`} x={x} y={190} width={420} height={18} rx={6} fill={K.lane} opacity={0.55 + rnd(k + 1) * 0.3} />);
  }
  // cracks
  range(Math.floor(W / 1500)).forEach((i) => {
    const k = seed * 31 + i;
    const cx = x0 + rnd(k) * W, cy = 40 + rnd(k + 1) * (Math.min(yFront, 900) - 120);
    const pts = range(5).map((j) => ({x: cx + j * 90 + (rnd(k + j) - 0.5) * 60, y: cy + (rnd(k + j + 9) - 0.5) * 70}));
    els.push(<polyline key={`cr${i}`} points={pts.map((p) => `${f2(p.x)},${f2(p.y)}`).join(' ')} fill="none" stroke="#25201F" strokeWidth={ink * 0.7} strokeLinejoin="round" />);
  });
  // potholes and puddles
  range(Math.floor(W / 2600)).forEach((i) => {
    const k = seed * 53 + i;
    const cx = x0 + rnd(k) * W, cy = 120 + rnd(k + 1) * (Math.min(yFront, 700) - 200);
    const isPuddle = puddles && rnd(k + 2) > 0.5;
    els.push(<path key={`ph${i}`} d={blobD(isPuddle ? 220 : 120, k, 10, 0.35, 1.6, 0.32)} transform={`translate(${f2(cx)} ${f2(cy)})`} fill={isPuddle ? CITY.puddle : '#2A2426'} stroke={INK} strokeWidth={ink * 0.6} />);
    if (isPuddle) els.push(<path key={`pr${i}`} d={`M ${f2(cx - 140)} ${f2(cy - 6)} Q ${f2(cx)} ${f2(cy - 18 + noise(t, k) * 6)} ${f2(cx + 110)} ${f2(cy - 4)}`} stroke={CITY.fire} strokeWidth={ink * 0.9} fill="none" opacity={0.5 + 0.2 * noise(t * 2, k)} />);
  });
  // debris: concrete chunks, bricks, glass, paper
  range(Math.floor((W / 260) * debris)).forEach((i) => {
    const k = seed * 97 + i;
    const cx = x0 + rnd(k) * W, cy = -40 + rnd(k + 1) * (Math.min(yFront, 900) + 10);
    const kind = rnd(k + 2);
    const s = 0.6 + rnd(k + 3) * 0.9;
    if (kind < 0.45) els.push(<path key={`db${i}`} d={polyPath(range(5).map((j) => ({x: cx + Math.cos(j * 1.26 + k) * 40 * s * (0.6 + rnd(k + j) * 0.6), y: cy + Math.sin(j * 1.26 + k) * 22 * s})))} fill={rnd(k + 4) > 0.5 ? K.concreteLight : K.concrete} stroke={INK} strokeWidth={ink * 0.6} strokeLinejoin="round" />);
    else if (kind < 0.7) els.push(<rect key={`db${i}`} x={cx} y={cy - 16 * s} width={60 * s} height={26 * s} rx={3} fill={CITY.brick} stroke={INK} strokeWidth={ink * 0.6} transform={`rotate(${f2((rnd(k + 5) - 0.5) * 50)} ${f2(cx)} ${f2(cy)})`} />);
    else if (kind < 0.85) els.push(<path key={`db${i}`} d={`M ${f2(cx)} ${f2(cy)} l ${f2(30 * s)} ${f2(-12 * s)} l ${f2(-6 * s)} ${f2(20 * s)} Z`} fill="#9FB8C6" opacity={0.85} />);
    else els.push(<rect key={`db${i}`} x={cx} y={cy - 6} width={70 * s} height={46 * s} fill="#D9D0BC" opacity={0.75} transform={`rotate(${f2((rnd(k + 6) - 0.5) * 70)} ${f2(cx)} ${f2(cy)}) skewX(14)`} />);
  });
  return (
    <g>
      <rect x={x0} y={-56} width={W} height={yFront + 56} fill={CITY.asphalt} />
      <rect x={x0} y={-140} width={W} height={70} fill={K.sidewalk} stroke={INK} strokeWidth={ink} />
      <rect x={x0} y={-70} width={W} height={16} fill={K.curb} stroke={INK} strokeWidth={ink * 0.8} />
      <rect x={x0} y={-54} width={W} height={34} fill="#2F2A2B" opacity={0.6} />
      {els}
      {manholes.map((mx, i) => <Manhole key={`mh${i}`} x={mx} y={110} t={t} seed={seed + i} ink={ink} />)}
    </g>
  );
};

export const Manhole: React.FC<{x: number; y: number; t: number; seed?: number; ink?: number; steam?: number}> = ({x, y, t, seed = 1, ink = 6, steam = 1}) => (
  <g>
    <ellipse cx={x} cy={y} rx={160} ry={34} fill="#3A3434" stroke={INK} strokeWidth={ink} />
    <ellipse cx={x} cy={y} rx={110} ry={20} fill="none" stroke="#2A2526" strokeWidth={ink * 0.7} />
    {steam > 0 && <SmokeColumn x={x} y={y - 10} h={900} w={260} t={t} seed={seed * 3 + 1} color="#C9C3BC" op={0.45 * steam} drift={0.15} n={7} />}
  </g>
);

/** NYC-style davit streetlight. Base at (x, y). lit: 0 dead … 1 on (flickers a little). dir: arm points ±1. */
export const Streetlight: React.FC<{x: number; y?: number; t: number; lit?: number; dir?: 1 | -1; ink?: number; seed?: number; bent?: number}> = ({x, y = -100, t, lit = 0, dir = 1, ink = 6, seed = 1, bent = 0}) => {
  const top = y - 2000;
  const fl = lit * (0.82 + 0.18 * noise(t * 7, seed));
  return (
    <g transform={bent ? `rotate(${bent} ${x} ${y})` : undefined}>
      <path d={`M ${f2(x - 34)} ${f2(y)} L ${f2(x - 16)} ${f2(top)} L ${f2(x + 16)} ${f2(top)} L ${f2(x + 34)} ${f2(y)} Z`} fill={CITY.steelDark} stroke={INK} strokeWidth={ink} />
      <rect x={x - 48} y={y - 220} width={96} height={220} rx={10} fill={CITY.steel} stroke={INK} strokeWidth={ink} />
      <path d={`M ${f2(x)} ${f2(top + 10)} Q ${f2(x + dir * 30)} ${f2(top - 220)} ${f2(x + dir * 420)} ${f2(top - 180)}`} fill="none" stroke={INK} strokeWidth={30 + ink * 2} strokeLinecap="round" />
      <path d={`M ${f2(x)} ${f2(top + 10)} Q ${f2(x + dir * 30)} ${f2(top - 220)} ${f2(x + dir * 420)} ${f2(top - 180)}`} fill="none" stroke={CITY.steelDark} strokeWidth={30} strokeLinecap="round" />
      <path d={`M ${f2(x + dir * 330)} ${f2(top - 190)} L ${f2(x + dir * 540)} ${f2(top - 170)} L ${f2(x + dir * 500)} ${f2(top - 120)} L ${f2(x + dir * 360)} ${f2(top - 130)} Z`} fill={CITY.steel} stroke={INK} strokeWidth={ink} strokeLinejoin="round" />
      <ellipse cx={x + dir * 435} cy={top - 122} rx={70} ry={14} fill={fl > 0.05 ? K.lampOrange : '#4A4446'} opacity={fl > 0.05 ? 0.6 + fl * 0.4 : 1} />
      {fl > 0.05 && <Glow id={`sl${seed}_${Math.round(x)}`} cx={x + dir * 435} cy={top - 60} rx={420} ry={520} color={K.lampOrange} op={0.32 * fl} />}
    </g>
  );
};

/** Traffic signal on a mast arm. state: dead or a blinking amber. */
export const TrafficLight: React.FC<{x: number; y?: number; t: number; dir?: 1 | -1; state?: 'dead' | 'amber'; ink?: number}> = ({x, y = -100, t, dir = 1, state = 'amber', ink = 6}) => {
  const top = y - 1700;
  const on = state === 'amber' && Math.floor(t * 1.4) % 2 === 0;
  const hx = x + dir * 900;
  return (
    <g>
      <rect x={x - 26} y={top} width={52} height={y - top} fill={CITY.steelDark} stroke={INK} strokeWidth={ink} />
      <rect x={Math.min(x, hx) - 10} y={top + 20} width={Math.abs(hx - x) + 20} height={30} fill={CITY.steelDark} stroke={INK} strokeWidth={ink} />
      <rect x={hx - 55} y={top + 50} width={110} height={300} rx={18} fill="#2A2C22" stroke={INK} strokeWidth={ink} />
      {[0, 1, 2].map((i) => <circle key={i} cx={hx} cy={top + 105 + i * 92} r={34} fill={i === 1 && on ? K.signalAmber : K.signalDead} stroke={INK} strokeWidth={ink * 0.6} />)}
      {on && <Glow id={`tl${Math.round(x)}`} cx={hx} cy={top + 197} rx={200} ry={200} color={K.signalAmber} op={0.4} />}
    </g>
  );
};

export const Hydrant: React.FC<{x: number; y?: number; ink?: number}> = ({x, y = -100, ink = 6}) => (
  <g>
    <rect x={x - 50} y={y - 190} width={100} height={190} rx={18} fill="#B8352B" stroke={INK} strokeWidth={ink} />
    <path d={`M ${f2(x - 56)} ${f2(y - 190)} Q ${f2(x)} ${f2(y - 270)} ${f2(x + 56)} ${f2(y - 190)} Z`} fill="#B8352B" stroke={INK} strokeWidth={ink} />
    <rect x={x - 82} y={y - 140} width={164} height={40} rx={12} fill="#9A2B23" stroke={INK} strokeWidth={ink} />
    <rect x={x - 66} y={y - 12} width={132} height={14} fill="#9A2B23" stroke={INK} strokeWidth={ink * 0.8} />
  </g>
);

/** Generic loose rubble heap (concrete and brick) for edges of frames. Base at (x, y). */
export const Rubble: React.FC<{x: number; y: number; w: number; h: number; seed?: number; ink?: number}> = ({x, y, w, h, seed = 3, ink = 6}) => {
  const n = 7;
  const outline = [{x: x - w / 2, y}, ...range(n).map((i) => ({x: x - w / 2 + ((i + 0.5) / n) * w, y: y - h * Math.sin(((i + 0.5) / n) * Math.PI) * (0.7 + rnd(seed + i) * 0.4)})), {x: x + w / 2, y}];
  return (
    <g>
      <path d={smoothPath(outline, true, 0.4)} fill={K.concrete} stroke={INK} strokeWidth={ink} />
      {range(6).map((i) => {
        const k = seed * 11 + i;
        const cx = x - w * 0.4 + rnd(k) * w * 0.8, cy = y - h * (0.2 + rnd(k + 1) * 0.5);
        return <path key={i} d={blobD(30 + rnd(k + 2) * 50, k, 6, 0.6)} transform={`translate(${f2(cx)} ${f2(cy)})`} fill={rnd(k + 3) > 0.5 ? CITY.brick : K.concreteLight} stroke={INK} strokeWidth={ink * 0.7} />;
      })}
      <line x1={x - w * 0.2} y1={y - h * 0.6} x2={x - w * 0.05} y2={y - h * 1.15} stroke={K.rebar} strokeWidth={ink * 1.2} strokeLinecap="round" />
    </g>
  );
};
