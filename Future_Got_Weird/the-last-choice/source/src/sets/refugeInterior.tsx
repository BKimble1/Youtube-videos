// THE REFUGE — interior pieces for the arrival, the death, the enclosure and the final composition.
// Scale: cast members at s = 1 are 440 units tall. Floor anchors are the floor line y unless stated.
//   MedicalBed mattress top: y − 170·s, length 600·s      Gurney top: y − 190·s
//   chairs: seat top y − 112·s (chairSeats())              Bench seat y − 115·s      Table top y − 190·s
//   EntryDoorsInside opening 560 × 600 (·s)                Locker 220 × 470 (·s)
// Everything takes `time` (refLight: 0 morning … 3 night) where light matters.
import React from 'react';
import {C, REF, SYS} from '../theme';
import {rnd, noise, clamp, lerp} from '../kit/math';
import {fxId, mixHex} from '../fx/common';
import {Glow} from '../fx/light';
import {refLight, RefTime} from './refugeLight';
import {Plant, SoftFigure} from './refugePlants';
import {MiniMark} from './refuge';

type T = number | RefTime;

// ------------------------------------------------------------------ back of the interior space (a far layer)
export const RefugeInteriorBack: React.FC<{x0: number; x1: number; yFloor: number; yTop: number; time?: T; t: number; seed?: number; ink?: number; plants?: boolean; people?: number; beds?: number; outside?: React.ReactNode}> =
  ({x0, x1, yFloor, yTop, time = 1, t, seed = 1, ink = 3, plants = true, people = 3, beds = 0, outside}) => {
    const L = refLight(time);
    const gid = fxId('rib', seed, x0, yFloor);
    const w = x1 - x0;
    const els: React.ReactElement[] = [];
    // sky / outside through the far glass
    els.push(<rect key="sky" x={x0} y={yTop} width={w} height={yFloor - yTop} fill={`url(#${gid})`} />);
    if (outside) els.push(<g key="out">{outside}</g>);
    else {
      // a soft far bank silhouette
      const hz = yFloor - 260;
      const pts: string[] = [`${x0},${hz + 40}`];
      for (let xx = x0; xx <= x1; xx += 90) pts.push(`${xx},${hz - 60 - rnd(seed * 3 + xx) * 160}`, `${xx + 70},${hz - 60 - rnd(seed * 3 + xx) * 160}`);
      pts.push(`${x1},${hz + 40}`);
      els.push(<polygon key="bank" points={pts.join(' ')} fill={mixHex('#8FA4B4', L.skyLow, 0.35)} opacity={0.75} />);
      els.push(<rect key="water" x={x0} y={hz + 30} width={w} height={yFloor - hz - 30} fill={L.water} opacity={0.6} />);
    }
    // far glass: tint, mullions, transoms
    els.push(<rect key="tint" x={x0} y={yTop} width={w} height={yFloor - yTop} fill="#E8F4F6" opacity={0.18} />);
    for (let xx = x0 + 60; xx < x1; xx += 260) els.push(<rect key={`m${xx}`} x={xx - 7} y={yTop} width={14} height={yFloor - yTop} fill={mixHex(REF.mullion, '#3A4866', 0.4 * L.lamps)} />);
    [yFloor - 520, yFloor - 1040].forEach((yy, i) => els.push(<rect key={`tr${i}`} x={x0} y={yy - 6} width={w} height={12} fill={mixHex(REF.mullion, '#3A4866', 0.4 * L.lamps)} />));
    // back planters, far beds, soft figures
    if (plants) for (let i = 0, xx = x0 + 180; xx < x1 - 100; xx += 520, i++) els.push(<Plant key={`p${i}`} x={xx} y={yFloor} s={0.75 + 0.2 * rnd(seed + i)} t={t} seed={seed * 9 + i} ink={ink} kind={(['tall', 'bush', 'palm', 'fern'] as const)[i % 4]} />);
    for (let i = 0; i < beds; i++) {
      const bx = x0 + w * (0.25 + 0.5 * (i / Math.max(1, beds - 1)));
      els.push(<MedicalBed key={`b${i}`} x={bx} y={yFloor} s={0.7} ink={ink} t={t} />);
    }
    for (let i = 0; i < people; i++) els.push(<SoftFigure key={`f${i}`} x={x0 + w * (0.15 + 0.7 * rnd(seed * 31 + i))} y={yFloor} s={0.72} t={t} seed={seed * 5 + i} seated={i % 2 === 1} ink={ink} opacity={0.9} />);
    // lamps
    for (let xx = x0 + 300; xx < x1; xx += 700) els.push(<g key={`l${xx}`}><line x1={xx} y1={yTop} x2={xx} y2={yFloor - 900} stroke={C.ink} strokeWidth={ink * 0.8} /><path d={`M ${xx - 40} ${yFloor - 870} Q ${xx} ${yFloor - 930} ${xx + 40} ${yFloor - 870} Z`} fill={REF.woodDark} stroke={C.ink} strokeWidth={ink * 0.8} /><Glow x={xx} y={yFloor - 860} r={260} color="#FFD58A" opacity={0.15 + 0.55 * L.lamps} id={fxId('ibl', seed, xx, yFloor)} /></g>);
    return (
      <g>
        <defs>
          <linearGradient id={gid} x1="0" y1={yTop} x2="0" y2={yFloor} gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor={L.skyTop} />
            <stop offset="100%" stopColor={L.skyLow} />
          </linearGradient>
        </defs>
        {els}
        <rect x={x0} y={yFloor - 6} width={w} height={12} fill={REF.floorShade} />
      </g>
    );
  };

// ------------------------------------------------------------------ floor
export const InteriorFloor: React.FC<{x0: number; x1: number; y: number; depth?: number; time?: T; ink?: number; vx?: number}> = ({x0, x1, y, depth = 300, time = 1, ink = 3, vx}) => {
  const L = refLight(time);
  const base = mixHex(REF.floor, L.tint, L.tintOp * 0.6), line = mixHex(REF.floorShade, '#000000', 0.04);
  const cx = vx ?? (x0 + x1) / 2;
  const els: React.ReactElement[] = [];
  els.push(<rect key="f" x={x0} y={y} width={x1 - x0} height={depth} fill={base} />);
  for (let k = 1; k <= 5; k++) { const yy = y + depth * Math.pow(k / 5.5, 1.6); els.push(<line key={`h${k}`} x1={x0} y1={yy} x2={x1} y2={yy} stroke={line} strokeWidth={ink * 0.6} />); }
  for (let xx = x0 - (x1 - x0); xx <= x1 + (x1 - x0); xx += 220) els.push(<line key={`v${xx}`} x1={cx + (xx - cx) * 0.55} y1={y} x2={xx} y2={y + depth} stroke={line} strokeWidth={ink * 0.6} />);
  els.push(<line key="edge" x1={x0} y1={y} x2={x1} y2={y} stroke={C.ink} strokeWidth={ink} />);
  return <g>{els}</g>;
};

// ------------------------------------------------------------------ the glass wall
export type GlassWallProps = {
  x0: number; x1: number; yTop: number; yFloor: number; t: number; seed?: number; ink?: number; spacing?: number; glint?: number;
  /** a palm print where a hand met the glass; amt 0..1 */
  handprint?: {x: number; y: number; amt: number; s?: number; mirror?: boolean};
  /** a faint reflected head-and-shoulders silhouette; amt 0..1 */
  reflection?: {x: number; y: number; amt: number; s?: number};
  tint?: number; time?: T; sill?: boolean;
};
/** Big panes that read almost as open air — but they are there: thin mullions, a low sill, faint glints. */
export const GlassWall: React.FC<GlassWallProps> = ({x0, x1, yTop, yFloor, t, seed = 1, ink = 4, spacing = 640, glint = 1, handprint, reflection, tint = 0.07, time = 1, sill = true}) => {
  const L = refLight(time);
  const mull = mixHex(REF.mullion, '#3A4866', 0.35 * L.lamps);
  const els: React.ReactElement[] = [];
  els.push(<rect key="tint" x={x0} y={yTop} width={x1 - x0} height={yFloor - yTop} fill="#DDF3F7" opacity={tint} />);
  // reflections: two faint diagonal sheens per pane, drifting very slowly with the viewer
  for (let xx = x0, i = 0; xx < x1; xx += spacing, i++) {
    const bx = xx + spacing * (0.15 + 0.4 * rnd(seed * 3 + i)), bw = spacing * (0.08 + 0.1 * rnd(seed * 5 + i));
    els.push(<polygon key={`r${i}`} points={`${bx},${yFloor} ${bx + bw},${yFloor} ${bx + bw + (yFloor - yTop) * 0.35},${yTop} ${bx + (yFloor - yTop) * 0.35},${yTop}`} fill="#FFFFFF" opacity={0.05 * glint} />);
  }
  if (reflection && reflection.amt > 0) {
    const s = reflection.s ?? 1, rx = reflection.x, ry = reflection.y;
    els.push(
      <g key="refl" opacity={0.16 * reflection.amt}>
        <circle cx={rx} cy={ry} r={60 * s} fill="#FFFFFF" />
        <path d={`M ${rx - 120 * s} ${ry + 200 * s} Q ${rx - 110 * s} ${ry + 80 * s} ${rx} ${ry + 76 * s} Q ${rx + 110 * s} ${ry + 80 * s} ${rx + 120 * s} ${ry + 200 * s} Z`} fill="#FFFFFF" />
      </g>,
    );
  }
  if (handprint && handprint.amt > 0) {
    const s = handprint.s ?? 1, hx = handprint.x, hy = handprint.y, m = handprint.mirror ? -1 : 1;
    els.push(
      <g key="hand" opacity={handprint.amt}>
        <Glow x={hx} y={hy} r={70 * s} color="#FFFFFF" opacity={0.22} id={fxId('hp', seed, hx, hy)} />
        <g fill="#FFFFFF" opacity={0.38} transform={`translate(${hx} ${hy}) scale(${m} 1)`}>
          <ellipse cx={0} cy={6 * s} rx={20 * s} ry={22 * s} />
          {[-15, -5, 5, 15].map((fx, i) => <rect key={i} x={fx * s - 4 * s} y={(-34 + Math.abs(fx) * 0.4) * s} width={8 * s} height={(26 - Math.abs(fx) * 0.3) * s} rx={4 * s} />)}
          <rect x={18 * s} y={0} width={8 * s} height={20 * s} rx={4 * s} transform={`rotate(-40 ${22 * s} ${10 * s})`} />
        </g>
      </g>,
    );
  }
  // mullions with a highlight edge (the edge highlight is what tells the eye "glass")
  for (let xx = x0; xx <= x1 + 1; xx += spacing) {
    els.push(<rect key={`m${xx}`} x={xx - 9} y={yTop} width={18} height={yFloor - yTop} fill={mull} stroke={C.ink} strokeWidth={ink * 0.6} />);
    els.push(<line key={`mh${xx}`} x1={xx + 13} y1={yTop} x2={xx + 13} y2={yFloor} stroke="#FFFFFF" strokeWidth={ink * 0.5} opacity={0.35 * glint} />);
  }
  els.push(<rect key="top" x={x0 - 20} y={yTop - 26} width={x1 - x0 + 40} height={30} fill={mull} stroke={C.ink} strokeWidth={ink * 0.7} />);
  if (sill) els.push(<rect key="sill" x={x0 - 20} y={yFloor - 36} width={x1 - x0 + 40} height={36} fill={mixHex(REF.mullionShade, '#3A4866', 0.3 * L.lamps)} stroke={C.ink} strokeWidth={ink * 0.7} />);
  // slow travelling sparkle on one mullion edge
  if (glint > 0) {
    const ph = ((t * 0.08 + rnd(seed)) % 1);
    const gx = x0 + spacing * Math.floor(rnd(seed * 9) * Math.max(1, (x1 - x0) / spacing)) + 13;
    const gy = lerp(yTop + 60, yFloor - 80, ph);
    const tw = 0.5 + 0.5 * Math.sin(t * 2.3 + seed);
    els.push(<path key="spark" d={`M ${gx - 22} ${gy} L ${gx} ${gy - 5} L ${gx + 22} ${gy} L ${gx} ${gy + 5} Z M ${gx} ${gy - 22} L ${gx + 4} ${gy} L ${gx} ${gy + 22} L ${gx - 4} ${gy} Z`} fill="#FFFFFF" opacity={0.7 * glint * tw} />);
  }
  return <g>{els}</g>;
};

// ------------------------------------------------------------------ medical bed, sheet, gurney
export const BED = {w: 600, h: 170};
export const MedicalBed: React.FC<{x: number; y: number; s?: number; headDir?: 1 | -1; t?: number; ink?: number; time?: T}> = ({x, y, s = 1, headDir = -1, ink = 4}) => {
  const w = BED.w * s, h = BED.h * s;
  const top = y - h;
  const hx = x + (headDir * w) / 2;
  return (
    <g>
      {[-1, 1].map((k) => <g key={k}><rect x={x + k * w * 0.4 - 7 * s} y={top + 40 * s} width={14 * s} height={h - 58 * s} fill="#C9D2D6" stroke={C.ink} strokeWidth={ink * 0.8} /><circle cx={x + k * w * 0.4} cy={y - 14 * s} r={14 * s} fill="#4C5D69" stroke={C.ink} strokeWidth={ink * 0.8} /></g>)}
      <rect x={x - w * 0.46} y={top + 54 * s} width={w * 0.92} height={18 * s} rx={6 * s} fill="#C9D2D6" stroke={C.ink} strokeWidth={ink * 0.8} />
      <rect x={x - w / 2} y={top + 14 * s} width={w} height={34 * s} rx={10 * s} fill="#E3E8EA" stroke={C.ink} strokeWidth={ink} />
      <rect x={x - w / 2 + 6 * s} y={top} width={w - 12 * s} height={26 * s} rx={12 * s} fill="#FBFBF8" stroke={C.ink} strokeWidth={ink} />
      <ellipse cx={hx - headDir * 70 * s} cy={top - 4 * s} rx={64 * s} ry={20 * s} fill="#FFFFFF" stroke={C.ink} strokeWidth={ink} />
      <rect x={hx - (headDir > 0 ? 18 : 0) * s - 0} y={top - 70 * s} width={18 * s} height={100 * s} rx={8 * s} fill="#C9D2D6" stroke={C.ink} strokeWidth={ink * 0.8} />
    </g>
  );
};
/** Mattress top for a bed drawn at (y, s). */
export const bedTop = (y: number, s = 1) => y - BED.h * s;

/**
 * The sheet an attendant draws over a still figure lying on a MedicalBed (same x, y, s, headDir). progress 0..1 runs
 * from the foot end to over the head. bodyS scales the body bumps (match the lying actor's scale).
 */
export const BedSheet: React.FC<{x: number; y: number; s?: number; headDir?: 1 | -1; progress: number; bodyS?: number; ink?: number; t?: number}> = ({x, y, s = 1, headDir = -1, progress, bodyS, ink = 4, t = 0}) => {
  if (progress <= 0.001) return null;
  const w = BED.w * s, top = bedTop(y, s), b = bodyS ?? s;
  // body profile over the mattress, foot (u = 0) → head (u = 1): heights above the mattress top
  const prof: [number, number][] = [[0, 14], [0.06, 62], [0.12, 40], [0.26, 54], [0.4, 48], [0.5, 66], [0.66, 82], [0.76, 78], [0.83, 50], [0.9, 104], [0.97, 96], [1.0, 30]];
  const hAt = (u: number) => {
    for (let i = 1; i < prof.length; i++) if (u <= prof[i][0]) return lerp(prof[i - 1][1], prof[i][1], (u - prof[i - 1][0]) / (prof[i][0] - prof[i - 1][0]));
    return prof[prof.length - 1][1];
  };
  const X = (u: number) => x + (-headDir * w) / 2 + headDir * u * w; // u = 0 at the foot end
  const p = clamp(progress);
  const top3: string[] = [];
  const n = 24;
  for (let i = 0; i <= n; i++) { const u = (i / n) * p; top3.push(`${X(u).toFixed(1)},${(top - hAt(u) * b - 4 * s + Math.sin(u * 30 + t) * 0.6).toFixed(1)}`); }
  const dropY = top + 70 * s;
  const lead = X(p);
  // drape over the front edge with a scalloped hem
  const hem: string[] = [];
  for (let i = n; i >= 0; i--) { const u = (i / n) * p; hem.push(`${X(u).toFixed(1)},${(dropY + Math.sin(i * 1.7) * 6 * s).toFixed(1)}`); }
  const pts = [`${X(0).toFixed(1)},${dropY}`, ...top3, `${(lead + headDir * 6 * s).toFixed(1)},${(top + 20 * s).toFixed(1)}`, ...hem];
  return (
    <g>
      <polygon points={pts.join(' ')} fill={REF.sheet} stroke={C.ink} strokeWidth={ink} strokeLinejoin="round" />
      {[0.2, 0.45, 0.72].filter((u) => u < p - 0.05).map((u) => <path key={u} d={`M ${X(u)} ${top - hAt(u) * b * 0.6} Q ${X(u) + headDir * 18 * s} ${top + 20 * s} ${X(u) - headDir * 6 * s} ${dropY - 6 * s}`} fill="none" stroke="#DCD8CC" strokeWidth={ink * 0.9} strokeLinecap="round" />)}
      <path d={`M ${lead} ${top - hAt(p) * b - 4 * s} Q ${lead + headDir * 14 * s} ${top + 10 * s} ${lead} ${dropY}`} fill="none" stroke="#DCD8CC" strokeWidth={ink * 1.2} strokeLinecap="round" />
    </g>
  );
};

export const Gurney: React.FC<{x: number; y: number; s?: number; ink?: number; t?: number; headDir?: 1 | -1}> = ({x, y, s = 1, ink = 4, headDir = -1}) => {
  const w = 540 * s, top = y - 190 * s;
  return (
    <g>
      <path d={`M ${x - w * 0.38} ${y - 20 * s} L ${x + w * 0.1} ${top + 40 * s} M ${x + w * 0.38} ${y - 20 * s} L ${x - w * 0.1} ${top + 40 * s}`} stroke="#9FAAB0" strokeWidth={14 * s} strokeLinecap="round" />
      <path d={`M ${x - w * 0.38} ${y - 20 * s} L ${x + w * 0.1} ${top + 40 * s} M ${x + w * 0.38} ${y - 20 * s} L ${x - w * 0.1} ${top + 40 * s}`} stroke={C.ink} strokeWidth={ink * 0.5} fill="none" />
      {[-0.38, 0.38].map((k) => <circle key={k} cx={x + k * w} cy={y - 12 * s} r={12 * s} fill={SYS.slate} stroke={C.ink} strokeWidth={ink * 0.8} />)}
      <rect x={x - w / 2} y={top + 24 * s} width={w} height={18 * s} rx={6 * s} fill="#C9D2D6" stroke={C.ink} strokeWidth={ink * 0.8} />
      <rect x={x - w / 2 + 6 * s} y={top} width={w - 12 * s} height={28 * s} rx={12 * s} fill="#FBFBF8" stroke={C.ink} strokeWidth={ink} />
      <rect x={x + (headDir * w) / 2 - (headDir > 0 ? 14 : 0) * s} y={top - 46 * s} width={14 * s} height={70 * s} rx={6 * s} fill="#C9D2D6" stroke={C.ink} strokeWidth={ink * 0.8} />
    </g>
  );
};
export const gurneyTop = (y: number, s = 1) => y - 190 * s;

// ------------------------------------------------------------------ seating
/** Seat-top centres of a ChairRow (put a prop or a seated figure here). */
export const chairSeats = (x: number, y: number, n: number, spacing = 190, s = 1) => Array.from({length: n}, (_, i) => ({x: x + i * spacing * s, y: y - 112 * s}));
export const ChairRow: React.FC<{x: number; y: number; n: number; spacing?: number; s?: number; ink?: number; color?: string; part?: 'all' | 'back' | 'front'}> = ({x, y, n, spacing = 190, s = 1, ink = 4, color = '#7FB0A0', part = 'all'}) => {
  // front-facing chairs: 'back' draws backrests and back legs (behind a seated figure), 'front' the seat and front legs
  const els: React.ReactElement[] = [];
  chairSeats(x, y, n, spacing, s).forEach((st, i) => {
    const cw = 150 * s;
    if (part !== 'front') {
      els.push(<rect key={`bl${i}`} x={st.x - cw * 0.42} y={st.y} width={10 * s} height={112 * s - 8 * s} fill="#5B6670" />);
      els.push(<rect key={`br${i}`} x={st.x + cw * 0.42 - 10 * s} y={st.y} width={10 * s} height={112 * s - 8 * s} fill="#5B6670" />);
      els.push(<rect key={`b${i}`} x={st.x - cw / 2} y={st.y - 128 * s} width={cw} height={110 * s} rx={22 * s} fill={color} stroke={C.ink} strokeWidth={ink} />);
    }
    if (part !== 'back') {
      els.push(<rect key={`fl${i}`} x={st.x - cw * 0.46} y={st.y + 18 * s} width={12 * s} height={94 * s} rx={4 * s} fill="#4C5D69" stroke={C.ink} strokeWidth={ink * 0.7} />);
      els.push(<rect key={`fr${i}`} x={st.x + cw * 0.46 - 12 * s} y={st.y + 18 * s} width={12 * s} height={94 * s} rx={4 * s} fill="#4C5D69" stroke={C.ink} strokeWidth={ink * 0.7} />);
      els.push(<rect key={`s${i}`} x={st.x - cw / 2 - 4 * s} y={st.y - 6 * s} width={cw + 8 * s} height={30 * s} rx={12 * s} fill={mixHex(color, '#FFFFFF', 0.25)} stroke={C.ink} strokeWidth={ink} />);
    }
  });
  return <g>{els}</g>;
};
export const Bench: React.FC<{x: number; y: number; w?: number; s?: number; ink?: number}> = ({x, y, w = 520, s = 1, ink = 4}) => {
  const ww = w * s, top = y - 115 * s;
  return (
    <g>
      {[-0.4, 0.4].map((k) => <rect key={k} x={x + k * ww - 9 * s} y={top + 10 * s} width={18 * s} height={105 * s} rx={5 * s} fill={REF.woodDark} stroke={C.ink} strokeWidth={ink * 0.8} />)}
      <rect x={x - ww / 2} y={top} width={ww} height={22 * s} rx={8 * s} fill={REF.wood} stroke={C.ink} strokeWidth={ink} />
      <line x1={x - ww / 2 + 12 * s} y1={top + 9 * s} x2={x + ww / 2 - 12 * s} y2={top + 9 * s} stroke={REF.woodDark} strokeWidth={ink * 0.6} />
    </g>
  );
};
export const benchTop = (y: number, s = 1) => y - 115 * s;
export const Table: React.FC<{x: number; y: number; w?: number; s?: number; ink?: number}> = ({x, y, w = 300, s = 1, ink = 4}) => {
  const ww = w * s, top = y - 190 * s;
  return (
    <g>
      <rect x={x - 9 * s} y={top + 12 * s} width={18 * s} height={170 * s} fill="#9AA5AB" stroke={C.ink} strokeWidth={ink * 0.8} />
      <ellipse cx={x} cy={y - 6 * s} rx={70 * s} ry={12 * s} fill="#9AA5AB" stroke={C.ink} strokeWidth={ink * 0.8} />
      <rect x={x - ww / 2} y={top} width={ww} height={20 * s} rx={8 * s} fill="#EFE9DD" stroke={C.ink} strokeWidth={ink} />
    </g>
  );
};
export const tableTop = (y: number, s = 1) => y - 190 * s;

/** A meal on a tray (origin = tray bottom centre); steam wisps rise while warm. */
export const MealTray: React.FC<{x: number; y: number; s?: number; ink?: number; t?: number; warm?: number}> = ({x, y, s = 1, ink = 4, t = 0, warm = 1}) => (
  <g>
    {warm > 0 && [-30, 0, 30].map((dx, i) => <path key={i} d={`M ${x + dx * s} ${y - 50 * s} q ${12 * s} ${-18 * s} 0 ${-36 * s} q ${-12 * s} ${-18 * s} ${noise(t + i, 3) * 8 * s} ${-36 * s}`} fill="none" stroke="#FFFFFF" strokeWidth={4 * s} strokeLinecap="round" opacity={0.5 * warm * (0.6 + 0.4 * Math.sin(t * 2 + i))} />)}
    <rect x={x - 120 * s} y={y - 14 * s} width={240 * s} height={14 * s} rx={5 * s} fill="#C7B79A" stroke={C.ink} strokeWidth={ink * 0.8} />
    <path d={`M ${x - 70 * s} ${y - 14 * s} Q ${x - 70 * s} ${y - 58 * s} ${x - 10 * s} ${y - 58 * s} Q ${x + 50 * s} ${y - 58 * s} ${x + 50 * s} ${y - 14 * s} Z`} fill="#F4F1EA" stroke={C.ink} strokeWidth={ink * 0.8} />
    <ellipse cx={x - 10 * s} cy={y - 50 * s} rx={56 * s} ry={9 * s} fill="#E39A4F" />
    <rect x={x + 62 * s} y={y - 52 * s} width={34 * s} height={38 * s} rx={6 * s} fill="#FFFFFF" stroke={C.ink} strokeWidth={ink * 0.8} />
    <ellipse cx={x - 95 * s} cy={y - 24 * s} rx={22 * s} ry={11 * s} fill="#D9A25A" stroke={C.ink} strokeWidth={ink * 0.7} />
  </g>
);

// ------------------------------------------------------------------ sealed locker
export const Locker: React.FC<{x: number; y: number; w?: number; h?: number; s?: number; open?: number; ink?: number; t?: number; light?: 'idle' | 'locked' | 'open'}> = ({x, y, w = 220, h = 470, s = 1, open = 0, ink = 4, t = 0, light = 'locked'}) => {
  const ww = w * s, hh = h * s, top = y - hh;
  const o = clamp(open);
  const dw = ww * Math.cos((o * Math.PI) / 2 * 0.95); // door foreshortens as it swings toward the viewer (hinge left)
  const lc = light === 'open' ? REF.aid : light === 'idle' ? SYS.sensor : SYS.lock;
  return (
    <g>
      <rect x={x - ww / 2} y={top} width={ww} height={hh} rx={10 * s} fill={SYS.panelShade} stroke={C.ink} strokeWidth={ink} />
      <rect x={x - ww / 2 + 12 * s} y={top + 12 * s} width={ww - 24 * s} height={hh - 24 * s} rx={6 * s} fill="#2A333A" />
      {o > 0.02 && <rect x={x - ww / 2 + 20 * s} y={top + hh * 0.45} width={ww - 40 * s} height={10 * s} fill="#4C5D69" />}
      <g>
        <path d={`M ${x - ww / 2} ${top} L ${x - ww / 2 + dw} ${top - o * 30 * s} L ${x - ww / 2 + dw} ${y + o * 30 * s} L ${x - ww / 2} ${y} Z`} fill={SYS.panel} stroke={C.ink} strokeWidth={ink} strokeLinejoin="round" />
        {dw > ww * 0.4 && <rect x={x - ww / 2 + dw - 40 * s} y={top + hh * 0.42} width={16 * s} height={60 * s} rx={8 * s} fill={SYS.panelDeep} />}
        {dw > ww * 0.5 && <circle cx={x - ww / 2 + dw * 0.5} cy={top + 46 * s} r={9 * s} fill={lc} opacity={0.6 + 0.4 * Math.sin(t * 2)} />}
        {dw > ww * 0.6 && <MiniMark x={x - ww / 2 + dw * 0.5} y={top + hh - 50 * s} r={16 * s} sw={ink * 0.6} />}
      </g>
    </g>
  );
};

// ------------------------------------------------------------------ the entry seen from inside
export type EntryProps = {x: number; y: number; s?: number; open?: number; shutter?: number; t: number; ink?: number; time?: T; sensor?: 'idle' | 'deny' | 'off'; outside?: React.ReactNode; seed?: number};
/**
 * The entrance from inside (centre x, floor y): the sliding glass doors (open 0..1), beyond them the outer shutter
 * descending (shutter 0..1, outside the vestibule) and, beyond that, the esplanade and river in daylight (or a custom
 * `outside`). A small sensor panel at the right: idle (soft cyan), deny (no response — stays dim), off.
 */
export const EntryDoorsInside: React.FC<EntryProps> = ({x, y, s = 1, open = 0, shutter = 0, t, ink = 4, time = 1, sensor = 'idle', outside, seed = 1}) => {
  const L = refLight(time);
  const W = 560 * s, H = 600 * s, top = y - H, l = x - W / 2;
  const cid = fxId('edc', seed, x, y), gid = fxId('edg', seed, x, y);
  const pw = W / 2, slide = clamp(open) * pw * 0.96;
  const shY = top + H * clamp(shutter);
  const slats: React.ReactElement[] = [];
  for (let yy = top + 26 * s; yy < shY - 10 * s; yy += 34 * s) slats.push(<line key={yy} x1={l} y1={yy} x2={l + W} y2={yy} stroke={SYS.panelShade} strokeWidth={ink * 0.8} />);
  const sensorCol = sensor === 'idle' ? SYS.sensor : sensor === 'deny' ? '#5E6E78' : '#3A4650';
  return (
    <g>
      <defs>
        <clipPath id={cid}><rect x={l} y={top} width={W} height={H} /></clipPath>
        <linearGradient id={gid} x1="0" y1={top} x2="0" y2={y} gradientUnits="userSpaceOnUse"><stop offset="0%" stopColor={L.skyTop} /><stop offset="100%" stopColor={L.skyLow} /></linearGradient>
      </defs>
      <g clipPath={`url(#${cid})`}>
        <rect x={l} y={top} width={W} height={H} fill={`url(#${gid})`} />
        {outside ?? (
          <g>
            <rect x={l} y={y - 220 * s} width={W} height={110 * s} fill={L.water} />
            <rect x={l} y={y - 115 * s} width={W} height={115 * s} fill={mixHex('#C9C0B2', L.tint, L.tintOp)} />
            {[0, 1, 2, 3, 4].map((i) => <line key={i} x1={l + i * 140 * s} y1={y - 175 * s} x2={l + i * 140 * s} y2={y - 115 * s} stroke="#4A4743" strokeWidth={6 * s} />)}
            <line x1={l} y1={y - 175 * s} x2={l + W} y2={y - 175 * s} stroke="#4A4743" strokeWidth={6 * s} />
          </g>
        )}
        {shutter > 0.001 && <g><rect x={l} y={top} width={W} height={shY - top} fill={SYS.panel} />{slats}<rect x={l} y={shY - 16 * s} width={W} height={16 * s} fill={SYS.slate} /></g>}
        {/* sliding panels */}
        {[-1, 1].map((sd) => {
          const px0 = sd < 0 ? l - slide : x + slide;
          return <g key={sd}><rect x={px0} y={top} width={pw} height={H} fill="#D6F0F6" opacity={0.22} stroke={REF.mullion} strokeWidth={ink * 2.4} /><line x1={sd < 0 ? px0 + pw - 22 * s : px0 + 22 * s} y1={top + H * 0.42} x2={sd < 0 ? px0 + pw - 22 * s : px0 + 22 * s} y2={top + H * 0.58} stroke={C.ink} strokeWidth={ink * 1.3} strokeLinecap="round" /></g>;
        })}
        <polygon points={`${l + W * 0.1},${y} ${l + W * 0.2},${y} ${l + W * 0.5},${top} ${l + W * 0.4},${top}`} fill="#FFFFFF" opacity={0.07} />
      </g>
      {/* frame and wall returns */}
      <rect x={l - 60 * s} y={top - 60 * s} width={W + 120 * s} height={60 * s} fill={REF.mullion} stroke={C.ink} strokeWidth={ink} />
      <rect x={l - 60 * s} y={top} width={60 * s} height={H} fill={REF.mullionShade} stroke={C.ink} strokeWidth={ink} />
      <rect x={l + W} y={top} width={60 * s} height={H} fill={REF.mullionShade} stroke={C.ink} strokeWidth={ink} />
      <rect x={l} y={top} width={W} height={H} fill="none" stroke={C.ink} strokeWidth={ink} />
      {/* sensor panel */}
      <rect x={l + W + 90 * s} y={top + H * 0.45} width={54 * s} height={84 * s} rx={10 * s} fill={SYS.panel} stroke={C.ink} strokeWidth={ink * 0.8} />
      <circle cx={l + W + 117 * s} cy={top + H * 0.45 + 30 * s} r={12 * s} fill={sensorCol} />
      {sensor === 'idle' && <Glow x={l + W + 117 * s} y={top + H * 0.45 + 30 * s} r={40 * s} color={SYS.sensor} opacity={0.5 + 0.2 * Math.sin(t * 2)} id={fxId('sns', seed, x, y)} />}
      <MiniMark x={l + W + 117 * s} y={top + H * 0.45 + 66 * s} r={12 * s} sw={ink * 0.5} />
    </g>
  );
};

/** Multiply-style time-of-day tint over a region (draw last, over the interior). lamps: warm pools of light that
 *  stay warm through the night tint (drawn on top, scaled by the time's lamp strength). */
export const RefugeTint: React.FC<{x0: number; y0: number; x1: number; y1: number; time?: T; lamps?: {x: number; y: number; r: number}[]; seed?: number}> = ({x0, y0, x1, y1, time = 1, lamps = [], seed = 1}) => {
  const L = refLight(time);
  return (
    <g>
      {L.tintOp > 0.001 && <rect x={x0} y={y0} width={x1 - x0} height={y1 - y0} fill={L.tint} opacity={L.tintOp} style={{mixBlendMode: 'multiply'}} />}
      {L.lamps > 0.02 && lamps.map((lp, i) => <Glow key={i} x={lp.x} y={lp.y} r={lp.r} color="#FFD58A" opacity={0.45 * L.lamps} id={fxId('rtl' + i, seed, lp.x, lp.y)} />)}
    </g>
  );
};
