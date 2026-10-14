// S05-S06: tracking inside the vessel (side view, never a first-person tunnel). The near wall is cut
// away; the lumen is masked so every bead and red cell stays inside the tube. Beads travel at three
// depths; a few foreground beads pass close to the camera, softened. Then sensors dock at the lower
// wall and scan the tissue cells beside it: the invented "cellular decay" read-out of this story.
import React from 'react';
import {Bead, BeadDefs} from './Beads';
import {Cam, Layer} from '../lib/camera';
import {lit, mix, PAL, shade} from '../lib/color';
import {clamp, easeInOut, easeOut, fmt, hash, inv, lerp, noise1, V} from '../lib/math';
import {Blob, Glow, Lin} from '../lib/shade';

export const VS = {
  y: 960,
  rOut: 430,
  wall: 74,
  cellsX: 3420,
};
const LUM = VS.rOut - VS.wall;
const rect = (x: number, y: number, w: number, h: number) => `M${x},${y} h${w} v${h} h${-w} Z`;

/** Red blood cell: biconcave disc seen at a tilt (rim lighter, dimpled centre darker). */
const RBC: React.FC<{id: string; p: V; r: number; tilt: number; rot: number; tone: number}> = ({id, p, r, tilt, rot, tone}) => {
  const base = mix('#D23A47', '#8E1A28', tone);
  return (
    <g transform={`translate(${fmt(p.x)} ${fmt(p.y)}) rotate(${fmt(rot)})`}>
      <defs>
        <radialGradient id={id} cx="0.45" cy="0.42" r="0.6">
          <stop offset="0" stopColor={shade(base, 0.25)} />
          <stop offset="0.45" stopColor={shade(base, 0.1)} />
          <stop offset="0.78" stopColor={lit(base, 0.22)} />
          <stop offset="1" stopColor={base} />
        </radialGradient>
      </defs>
      <ellipse cx={0} cy={0} rx={fmt(r)} ry={fmt(r * tilt)} fill={`url(#${id})`} />
      <ellipse cx={fmt(-r * 0.35)} cy={fmt(-r * tilt * 0.55)} rx={fmt(r * 0.32)} ry={fmt(Math.max(1, r * tilt * 0.16))} fill="#FFFFFF" opacity={0.45} />
    </g>
  );
};

/** Tissue cell: soft sphere with a nucleus. decay 0..1 shrinks, wrinkles and greys it. */
const Cell: React.FC<{id: string; c: V; r: number; decay: number; glow: number; glowColor: string; f: number}> = ({id, c, r, decay, glow, glowColor, f}) => {
  const col = mix('#F4A9A0', '#8E7C94', decay);
  const rr = r * (1 - 0.18 * decay);
  const pts: string[] = [];
  for (let i = 0; i < 28; i++) {
    const a = (i / 28) * Math.PI * 2;
    const wob = 1 + decay * 0.12 * Math.sin(a * 5 + c.x * 0.01) + decay * 0.05 * noise1(i * 0.9 + f * 0.05, c.x | 0);
    pts.push(`${fmt(c.x + Math.cos(a) * rr * wob)},${fmt(c.y + Math.sin(a) * rr * 0.86 * wob)}`);
  }
  return (
    <g>
      {glow > 0.01 && <Glow id={`${id}-g`} c={c} r={r * 2} color={glowColor} alpha={0.75 * glow} />}
      <Blob id={`${id}-b`} d={`M${pts.join(' L')} Z`} c={c} r={rr * 1.1} color={col} k={0.9} />
      <Blob id={`${id}-n`} d={`M${fmt(c.x - rr * 0.34)},${fmt(c.y + 2)} a${fmt(rr * 0.34)},${fmt(rr * 0.3)} 0 1,0 ${fmt(rr * 0.68)},0 a${fmt(rr * 0.34)},${fmt(rr * 0.3)} 0 1,0 ${fmt(-rr * 0.68)},0 Z`} c={{x: c.x - 4, y: c.y}} r={rr * 0.4} color={mix('#B05A7A', '#5E5068', decay)} k={0.8} />
    </g>
  );
};

/** Gradient ring (a diagnostic scan pulse), not a stroke. */
const Ring: React.FC<{id: string; c: V; r: number; color: string; a: number}> = ({id, c, r, color, a}) => (
  <g>
    <defs>
      <radialGradient id={id}>
        <stop offset="0.72" stopColor={color} stopOpacity={0} />
        <stop offset="0.88" stopColor={color} stopOpacity={a} />
        <stop offset="1" stopColor={color} stopOpacity={0} />
      </radialGradient>
    </defs>
    <circle cx={fmt(c.x)} cy={fmt(c.y)} r={fmt(r)} fill={`url(#${id})`} />
  </g>
);

export const vesselCam = (f: number, a: number, b: number, c: number): Cam => {
  // a: S05 start, b: S06 start, c: S06 end. Fast track, ease to a stop at the cells, quick pull-out at the end.
  const x = f < b ? lerp(700, 2700, (f - a) / (b - a)) : lerp(2700, VS.cellsX, easeOut(inv(b, b + 34, f)));
  const out = easeInOut(inv(c - 16, c, f));
  return {
    x: x + out * 0,
    y: lerp(lerp(960, 1080, easeInOut(inv(b, b + 30, f))), 960, out),
    z: lerp(lerp(1.0, 1.25, easeInOut(inv(b, b + 30, f))), 0.62, out),
  };
};

export type VesselState = {f: number; cam: Cam; a: number; b: number; c: number; decayAt: number};

export const VesselRide: React.FC<{id: string; st: VesselState}> = ({id, st}) => {
  const {f, cam} = st;
  const top = VS.y - VS.rOut;
  const bot = VS.y + VS.rOut;
  const cx = cam.x;
  // particles flow right; positions wrap in a window around the camera so the stream never runs out
  const flowX = (i: number, speed: number, seed: number, span = 3200) => {
    const x0 = hash(i, seed) * span;
    return cx - span / 2 + ((((x0 + speed * f) % span) + span) % span);
  };
  const lane = (i: number, seed: number, rad: number) => VS.y + (hash(i, seed) * 2 - 1) * (LUM - rad - 10);

  const far: React.ReactNode[] = [];
  const mid: React.ReactNode[] = [];
  const near: React.ReactNode[] = [];
  for (let i = 0; i < 26; i++) {
    const r = 34 + hash(i, 5) * 10;
    far.push(<RBC key={`fr${i}`} id={`${id}-fr${i}`} p={{x: flowX(i, 9, 11), y: lane(i, 12, r * 0.6) * 0.92 + VS.y * 0.08}} r={r * 0.8} tilt={0.3 + hash(i, 6) * 0.5} rot={noise1(f * 0.02, i) * 30} tone={0.45} />);
  }
  for (let i = 0; i < 40; i++) {
    const r = 3 + hash(i, 15) * 4;
    far.push(<circle key={`fd${i}`} cx={fmt(flowX(i, 17, 16))} cy={fmt(lane(i, 18, r))} r={r} fill="#BDF1FF" opacity={0.7} />);
  }
  // mid: the sensor stream (directed, faster than the cells) plus mid red cells
  const docking = [0, 1, 2, 3];
  for (let i = 0; i < 16; i++) {
    const r = 46 + hash(i, 25) * 12;
    mid.push(<RBC key={`mr${i}`} id={`${id}-mr${i}`} p={{x: flowX(i, 13, 21), y: lane(i, 22, r * 0.6)}} r={r} tilt={0.25 + hash(i, 23) * 0.6} rot={noise1(f * 0.025, i + 40) * 40} tone={0.15} />);
  }
  for (let i = 0; i < 22; i++) {
    if (f > st.b && docking.includes(i)) continue;
    const r = 18 + hash(i, 35) * 12;
    const x = flowX(i, 26, 31);
    const y = lane(i, 32, r * 2) + Math.sin(f * 0.08 + i) * 6;
    mid.push(<Bead key={`mb${i}`} id={`${id}-b`} p={{x, y}} r={r} dir={{x: 1, y: 0}} wake={3.4} />);
  }
  // docking sensors: leave the stream and settle on the lower wall above the cells
  const dockX = [VS.cellsX - 230, VS.cellsX - 70, VS.cellsX + 90, VS.cellsX + 250];
  const dockY = bot - VS.wall - 26;
  docking.forEach((k, j) => {
    const t = easeOut(inv(st.b + 2 + j * 4, st.b + 26 + j * 4, f));
    if (f <= st.b) return;
    const sx = cx - 700 + j * 160;
    const p = {x: lerp(sx, dockX[j], t), y: lerp(VS.y - 60 + j * 40, dockY, t)};
    const decaying = j === 1 || j === 3;
    const amber = decaying ? clamp(inv(st.decayAt, st.decayAt + 10, f)) : 0;
    mid.push(
      <g key={`dk${j}`}>
        {amber > 0 && <Glow id={`${id}-dg${j}`} c={p} r={70} color="#FFB23E" alpha={0.7 * amber} />}
        <Bead id={`${id}-b`} p={p} r={24} dir={t < 1 ? {x: 1, y: 0.6} : undefined} wake={t < 0.95 ? 3 : 0} />
      </g>,
    );
  });
  // near: a few big beads passing close to the camera (soft focus), always inside the lumen band
  for (let i = 0; i < 4; i++) {
    const r = 64 + hash(i, 45) * 20;
    near.push(<Bead key={`nb${i}`} id={`${id}-b`} p={{x: flowX(i, 44, 41, 4200), y: lane(i, 42, r + 30)}} r={r} dir={{x: 1, y: 0}} wake={2.6} halo={0.6} opacity={0.85} />);
  }

  // cells below the wall
  const cells: [number, number, number, boolean][] = [
    [-300, 1560, 78, false],
    [-150, 1600, 70, true],
    [0, 1550, 82, false],
    [130, 1610, 72, false],
    [260, 1570, 76, true],
    [400, 1600, 70, false],
    [-440, 1610, 74, false],
  ];
  const scanT = (j: number) => inv(st.b + 30 + j * 4, st.b + 56 + j * 4, f);

  return (
    <g>
      <BeadDefs id={`${id}-b`} />
      <defs>
        <clipPath id={`${id}-lum`}>
          <rect x={cx - 4000} y={VS.y - LUM} width={8000} height={LUM * 2} />
        </clipPath>
        <filter id={`${id}-soft`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation={5} />
        </filter>
      </defs>
      <Layer cam={cam} depth={1}>
        {/* surrounding cut face: fat above, muscle tissue below */}
        <Lin id={`${id}-fat`} d={rect(cx - 4000, top - 3000, 8000, 3000)} from={{x: 0, y: top - 600}} to={{x: 0, y: top}} stops={[[0, PAL.fat], [1, shade(PAL.fat, 0.2)]]} />
        {Array.from({length: 26}).map((_, i) => {
          const x = Math.floor((cx - 2000) / 260) * 260 + i * 160;
          const y = top - 140 - (i % 3) * 120;
          return <Blob key={i} id={`${id}-fl${i}`} d={`M${x - 95},${y} a95,80 0 1,0 190,0 a95,80 0 1,0 -190,0 Z`} c={{x, y}} r={110} color={PAL.fat} k={0.8} />;
        })}
        <Lin id={`${id}-tis`} d={rect(cx - 4000, bot, 8000, 3000)} from={{x: 0, y: bot}} to={{x: 0, y: bot + 900}} stops={[[0, lit(PAL.tissue, 0.06)], [1, shade(PAL.tissue, 0.25)]]} />
        {cells.map(([dx, y, r, dec], j) => {
          const decay = dec ? clamp(inv(st.decayAt - 4, st.decayAt + 14, f)) : 0;
          const scan = clamp(scanT(j % 4)) * (f > st.b ? 1 : 0);
          return <Cell key={j} id={`${id}-c${j}`} c={{x: VS.cellsX + dx, y}} r={r} decay={decay} glow={scan * (1 - scan) * 4 * 0.6 + decay * 0.5} glowColor={dec ? '#FFB23E' : PAL.signal} f={f} />;
        })}
        {/* the tube: far wall interior, lumen, cut rims */}
        <Lin id={`${id}-far`} d={rect(cx - 4000, top, 8000, VS.rOut * 2)} from={{x: 0, y: top}} to={{x: 0, y: bot}} stops={[[0, shade(PAL.vessel, 0.2)], [0.5, PAL.vessel], [1, lit(PAL.vessel, 0.08)]]} />
        <Lin id={`${id}-lm`} d={rect(cx - 4000, VS.y - LUM, 8000, LUM * 2)} from={{x: 0, y: VS.y - LUM}} to={{x: 0, y: VS.y + LUM}} stops={[[0, '#4A0812'], [0.3, mix(PAL.blood, PAL.vessel, 0.2)], [0.8, mix(PAL.blood, PAL.vessel, 0.45)], [1, shade(PAL.blood, 0.2)]]} />
        <g clipPath={`url(#${id}-lum)`}>
          {Array.from({length: 7}).map((_, i) => (
            <ellipse key={i} cx={fmt(flowX(i, 7, 51, 3600))} cy={VS.y + (i % 3 - 1) * 140} rx={420} ry={40} fill="#FF8A92" opacity={0.08} />
          ))}
          {far}
          {mid}
        </g>
        {/* scan pulses from docked sensors reach down through the wall toward the cells */}
        {f > st.b &&
          dockX.map((x, j) => {
            const t = scanT(j);
            if (t <= 0 || t >= 1) return null;
            const decaying = j === 1 || j === 3;
            const col = decaying && f > st.decayAt ? '#FFB23E' : PAL.signal;
            return <Ring key={j} id={`${id}-rg${j}`} c={{x, y: dockY + 30}} r={40 + t * 260} color={col} a={0.9 * (1 - t)} />;
          })}
        <Lin id={`${id}-rT`} d={rect(cx - 4000, top, 8000, VS.wall)} from={{x: 0, y: top}} to={{x: 0, y: top + VS.wall}} stops={[[0, lit(PAL.vessel, 0.32)], [1, mix(PAL.vessel, '#F07A84', 0.3)]]} />
        <Lin id={`${id}-rB`} d={rect(cx - 4000, bot - VS.wall, 8000, VS.wall)} from={{x: 0, y: bot - VS.wall}} to={{x: 0, y: bot}} stops={[[0, mix(PAL.vessel, '#F07A84', 0.25)], [1, shade(PAL.vessel, 0.22)]]} />
        <Lin id={`${id}-rBs`} d={rect(cx - 4000, bot, 8000, 50)} from={{x: 0, y: bot}} to={{x: 0, y: bot + 50}} stops={[[0, '#5A1A20', 0.32], [1, '#5A1A20', 0]]} />
      </Layer>
      <Layer cam={cam} depth={0.8}>
        <g clipPath={`url(#${id}-lum)`} filter={`url(#${id}-soft)`}>
          {near}
        </g>
      </Layer>
    </g>
  );
};
