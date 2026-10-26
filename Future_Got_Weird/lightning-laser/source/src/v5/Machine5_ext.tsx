// V5 shot C1: the laser enclosure's side wall, close, in the storm at night (the wall plane, world units: at the
// shot's first framing one unit is one screen pixel). The Crew finish: ink contours, flat and gradient fills; storm-dark
// steel lit mostly by the machine itself (its cyan pump light, the lamps).
//   viewport  a heavy bolted inspection window (W_OPEN) onto the optics bench inside (Machine5_optics)
//   power     left of it, the pump power unit: a charge column (green / amber / red segments, like the control
//             room's console) and a needle gauge, fed by two armoured cables
//   status    right of it, caged lamps (green power, amber charging, red firing) over a louvred vent that leaks the
//             pump light
//   build     roof slab with a gutter dripping, panel seams and rivets, a hazard band, the steel skid, the wet pad
// Everything that lights up is driven by the power state (Machine5.tsx pwC1). Lighting: the wall stands in the
// storm's dark (a night layer over all of it); the machine's own light opens that dark only where it reaches, with
// falloff (a mask of soft holes round the viewport, the vents, the lamps and the charge column), and tints what it
// reaches cyan; the relay's blast is a bloom out of the viewport and the vents, not a lift of the whole frame.
import React from 'react';
import {mix} from '../dc/color';
import {clamp, fmt, hash} from '../dc/math';
import {PAL} from '../v3/palette';

const INK = '#0B151C';
/** the viewport's opening (world units) */
export const W_OPEN = {x0: 280, y0: 462, x1: 800, y1: 1318, r: 46};
export const W_C = {x: (W_OPEN.x0 + W_OPEN.x1) / 2, y: (W_OPEN.y0 + W_OPEN.y1) / 2};
const rr = (x0: number, y0: number, x1: number, y1: number, r: number) =>
  `M${x0 + r},${y0} L${x1 - r},${y0} Q${x1},${y0} ${x1},${y0 + r} L${x1},${y1 - r} Q${x1},${y1} ${x1 - r},${y1} L${x0 + r},${y1} Q${x0},${y1} ${x0},${y1 - r} L${x0},${y0 + r} Q${x0},${y0} ${x0 + r},${y0} Z`;
export const openingD = rr(W_OPEN.x0, W_OPEN.y0, W_OPEN.x1, W_OPEN.y1, W_OPEN.r);
const BZ = 40; // bezel width
const ROOF = 100, HAZ = 1430, SKID = 1540, PAD = 1580;

export type PowerC1 = {hum: number; charge: number; gauge: number; amber: number; red: number; flash: number; tick: number; glow: number; cable: number; strobe: number; light: number; vent: number; steam: number};

/** a soft glow (radial gradient) of colour c */
const Glow: React.FC<{id: string; cx: number; cy: number; r: number; c: string; a: number; sy?: number}> = ({id, cx, cy, r, c, a, sy = 1}) => (
  <g>
    <defs>
      <radialGradient id={id}>
        <stop offset="0" stopColor={c} stopOpacity={0.85} />
        <stop offset="0.3" stopColor={c} stopOpacity={0.35} />
        <stop offset="1" stopColor={c} stopOpacity={0} />
      </radialGradient>
    </defs>
    <ellipse cx={fmt(cx)} cy={fmt(cy)} rx={fmt(r)} ry={fmt(r * sy)} fill={`url(#${id})`} opacity={fmt(clamp(a))} style={{mixBlendMode: 'screen'}} />
  </g>
);

/** the wall, everything on it except the viewport's glass (drawn with an opening cut for the bench to show through) */
export const WallC1: React.FC<{tag: string; pw: PowerC1; t: number}> = ({tag, pw, t}) => {
  const steel = '#3E4B55', steelL = '#6E7C86', dark = '#121B22';
  const segs = 12;
  const lit = Math.round(clamp(pw.charge) * segs);
  const wall = `M-700,${ROOF + 50} L1800,${ROOF + 50} L1800,${SKID} L-700,${SKID} Z ${openingD}`;
  const needle = (-130 + 200 * clamp(pw.gauge)) * (Math.PI / 180);
  const light = clamp(pw.light), vent = clamp(pw.vent, 0, 1.4), F = clamp(pw.flash, 0, 1.3);
  const spill = clamp(light + 0.6 * F, 0, 1.4);
  const GX = 30, GY = 600; // gauge
  const CX0 = 136, CX1 = 194; // charge column
  return (
    <g>
      <defs>
        <linearGradient id={`${tag}-wl`} gradientUnits="userSpaceOnUse" x1="0" y1={ROOF + 50} x2="0" y2={SKID}>
          <stop offset="0" stopColor="#7C8A95" />
          <stop offset="0.07" stopColor="#66747F" />
          <stop offset="0.55" stopColor="#4A5763" />
          <stop offset="1" stopColor="#2E3A44" />
        </linearGradient>
        <linearGradient id={`${tag}-bz`} gradientUnits="userSpaceOnUse" x1="0" y1={W_OPEN.y0 - BZ} x2="0" y2={W_OPEN.y1 + BZ}>
          <stop offset="0" stopColor="#8794A0" />
          <stop offset="0.45" stopColor="#5C6A75" />
          <stop offset="1" stopColor="#3A4650" />
        </linearGradient>
        {/* the machine's light on its wall, round the viewport (it falls off within a few hundred px) */}
        <radialGradient id={`${tag}-sp`}>
          <stop offset="0.45" stopColor={PAL.laser} stopOpacity={0.6} />
          <stop offset="0.7" stopColor={PAL.laserGlow} stopOpacity={0.25} />
          <stop offset="1" stopColor={PAL.laserGlow} stopOpacity={0} />
        </radialGradient>
        {/* the relay's blast out of the viewport: a cyan bloom, white only at its heart */}
        <radialGradient id={`${tag}-bl`}>
          <stop offset="0" stopColor={PAL.packet} stopOpacity={0.55} />
          <stop offset="0.3" stopColor={PAL.laser} stopOpacity={0.45} />
          <stop offset="0.65" stopColor={PAL.laserGlow} stopOpacity={0.16} />
          <stop offset="1" stopColor={PAL.laserGlow} stopOpacity={0} />
        </radialGradient>
        {/* a soft hole in the night layer (black in the mask = the light reaches here) */}
        <radialGradient id={`${tag}-hole`}>
          <stop offset="0" stopColor="#000" stopOpacity={1} />
          <stop offset="0.5" stopColor="#000" stopOpacity={0.7} />
          <stop offset="1" stopColor="#000" stopOpacity={0} />
        </radialGradient>
        <radialGradient id={`${tag}-stm`}>
          <stop offset="0" stopColor="#B8D6E0" stopOpacity={0.5} />
          <stop offset="0.6" stopColor="#8FB4C2" stopOpacity={0.18} />
          <stop offset="1" stopColor="#8FB4C2" stopOpacity={0} />
        </radialGradient>
        {/* the wall's own light stays off the glass: inside the viewport the bench lights itself */}
        <clipPath id={`${tag}-out`}>
          <path d={wall} clipRule="evenodd" />
        </clipPath>
        <mask id={`${tag}-lm`} maskUnits="userSpaceOnUse" x={-900} y={-200} width={2900} height={2000}>
          <rect x={-900} y={-200} width={2900} height={2000} fill="#FFFFFF" />
          {/* round the viewport (a bigger reach on the blast) */}
          <ellipse cx={W_C.x} cy={W_C.y} rx={fmt(360 + 170 * F)} ry={fmt(560 + 200 * F)} fill={`url(#${tag}-hole)`} opacity={fmt(clamp(0.3 + 0.6 * light + 0.4 * F))} />
          {/* the grille over it and the louvred vent */}
          <ellipse cx={W_C.x} cy={369} rx={fmt(360 + 90 * F)} ry={fmt(110 + 60 * F)} fill={`url(#${tag}-hole)`} opacity={fmt(clamp(0.15 + 0.65 * clamp(vent)))} />
          <ellipse cx={951} cy={1015} rx={fmt(210 + 70 * F)} ry={fmt(260 + 70 * F)} fill={`url(#${tag}-hole)`} opacity={fmt(clamp(0.15 + 0.65 * clamp(vent)))} />
          {/* the charge column and the lamps light their own surroundings a little */}
          <ellipse cx={(CX0 + CX1) / 2} cy={fmt(1250 - lit * 32)} rx={150} ry={fmt(80 + lit * 34)} fill={`url(#${tag}-hole)`} opacity={fmt(clamp(0.2 + 0.03 * lit))} />
          {[1, pw.amber, pw.red].map((on, i) => (on > 0.5 ? <circle key={i} cx={902} cy={520 + i * 96} r={120} fill={`url(#${tag}-hole)`} opacity={0.4} /> : null))}
        </mask>
        <linearGradient id={`${tag}-vn`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={PAL.packet} stopOpacity={0.9} />
          <stop offset="1" stopColor={PAL.laserGlow} stopOpacity={0.2} />
        </linearGradient>
      </defs>
      {/* the wall: insulated panels, seams and rivets */}
      <path d={wall} fill={`url(#${tag}-wl)`} fillRule="evenodd" stroke={INK} strokeWidth={4} />
      {[-150, 230, 850, 1110, 1370].map((x) => (
        <g key={x}>
          <line x1={x} y1={ROOF + 54} x2={x} y2={HAZ - 20} stroke={INK} strokeOpacity={0.5} strokeWidth={3} />
          <line x1={x + 4} y1={ROOF + 54} x2={x + 4} y2={HAZ - 20} stroke="#A8B4BE" strokeOpacity={0.28} strokeWidth={2} />
          {Array.from({length: 11}, (_, i) => <circle key={i} cx={x - 12} cy={ROOF + 110 + i * 110} r={4.5} fill="#5E6C76" stroke={INK} strokeWidth={1.6} />)}
        </g>
      ))}
      <line x1={-700} y1={HAZ - 20} x2={1800} y2={HAZ - 20} stroke={INK} strokeOpacity={0.5} strokeWidth={3} />
      {/* rain running down the panels (slow rivulets catching the light) */}
      {Array.from({length: 16}, (_, i) => {
        const x = -140 + 1400 * hash(i, 301);
        if (x > W_OPEN.x0 - BZ - 20 && x < W_OPEN.x1 + BZ + 20) return null;
        const y0 = ROOF + 90 + 900 * hash(i, 303);
        const L = 90 + 170 * hash(i, 305);
        const drop = ((t * (0.5 + 0.6 * hash(i, 307)) + hash(i, 309)) % 1) * L;
        return (
          <g key={i} opacity={0.5}>
            <path d={`M${fmt(x)},${fmt(y0)} q6,${fmt(L * 0.3)} -2,${fmt(L * 0.6)} t3,${fmt(L * 0.4)}`} fill="none" stroke="#B6C4D0" strokeOpacity={0.3} strokeWidth={2.2} />
            <ellipse cx={fmt(x + 1)} cy={fmt(y0 + drop)} rx={3} ry={4.5} fill="#D2DEE8" opacity={0.65} />
          </g>
        );
      })}
      {/* the roof slab, its gutter and the water coming off it */}
      <path d={`M-740,${ROOF} L1840,${ROOF} L1840,${ROOF + 46} L-740,${ROOF + 46} Z`} fill="#5E6A73" stroke={INK} strokeWidth={4} />
      <rect x={-740} y={ROOF + 44} width={2580} height={14} fill="#3C4851" stroke={INK} strokeWidth={3} />
      <rect x={-740} y={ROOF + 58} width={2580} height={30} fill="#0B141A" opacity={0.32} />
      {Array.from({length: 13}, (_, i) => {
        const x = -150 + 1300 * ((i + hash(i, 311)) / 13);
        const y = ROOF + 60 + (((t * 2.2 + hash(i, 313)) % 1) * 380);
        return <ellipse key={i} cx={fmt(x)} cy={fmt(y)} rx={3.2} ry={7} fill="#C9D6E2" opacity={fmt(0.6 * (1 - (y - ROOF - 60) / 380))} />;
      })}
      {/* hazard band and skid */}
      <rect x={-700} y={HAZ} width={2500} height={SKID - 10 - HAZ} fill="#2A353E" stroke={INK} strokeWidth={3} />
      {[-560, -300, -40, 220, 480, 740, 1000, 1260].map((x) => <circle key={x} cx={x} cy={HAZ + 50} r={6} fill="#4E5B64" stroke={INK} strokeWidth={2} />)}
      <rect x={-700} y={SKID - 10} width={2500} height={50} fill={steel} stroke={INK} strokeWidth={3} />
      {[-600, -360, -120, 120, 360, 600, 840, 1080, 1320].map((x) => <rect key={x} x={x} y={SKID - 2} width={40} height={30} rx={4} fill={dark} />)}

      {/* the pump power unit */}
      <rect x={-130} y={430} width={350} height={880} rx={16} fill="#25313A" stroke={INK} strokeWidth={4} />
      <rect x={-114} y={446} width={318} height={848} rx={11} fill="#18232B" />
      {/* needle gauge (the charge) */}
      <circle cx={GX} cy={GY} r={70} fill="#DDE3E7" stroke={INK} strokeWidth={4} />
      <circle cx={GX} cy={GY} r={70} fill="none" stroke="#9AA6AE" strokeWidth={6} opacity={0.6} />
      {Array.from({length: 9}, (_, i) => {
        const a = (-130 + 25 * i) * (Math.PI / 180);
        return <line key={i} x1={fmt(GX + Math.sin(a) * 48)} y1={fmt(GY - Math.cos(a) * 48)} x2={fmt(GX + Math.sin(a) * 60)} y2={fmt(GY - Math.cos(a) * 60)} stroke={i > 6 ? '#D8402F' : INK} strokeWidth={i > 6 ? 6 : 3.5} />;
      })}
      <line x1={GX} y1={GY} x2={fmt(GX + Math.sin(needle) * 54)} y2={fmt(GY - Math.cos(needle) * 54)} stroke="#C2322A" strokeWidth={6} strokeLinecap="round" />
      <circle cx={GX} cy={GY} r={10} fill={INK} />
      {/* a heavy switch housing and indicator under the gauge */}
      <rect x={-60} y={720} width={180} height={120} rx={10} fill="#2E3A44" stroke={INK} strokeWidth={3} />
      <rect x={-34} y={748} width={60} height={64} rx={8} fill={pw.red > 0.5 ? '#B8322A' : '#5A2A26'} stroke={INK} strokeWidth={3} />
      <rect x={52} y={752} width={44} height={56} rx={6} fill="#151E25" stroke={INK} strokeWidth={2.5} />
      <rect x={60} y={760} width={28} height={18} rx={3} fill={pw.red > 0.5 ? '#7A2420' : '#2A2020'} />
      {/* the charge column */}
      <rect x={CX0 - 12} y={470} width={CX1 - CX0 + 24} height={800} rx={10} fill="#0B1217" stroke={INK} strokeWidth={3} />
      {Array.from({length: segs}, (_, i) => {
        const on = i < lit;
        const c = i < 6 ? '#5BF08A' : i < 10 ? '#F0B85B' : '#FF5A4E';
        const y = 1250 - i * 64;
        return <rect key={i} x={CX0} y={y - 52} width={CX1 - CX0} height={52} rx={6} fill={on ? c : mix(c, '#10171C', 0.84)} stroke={INK} strokeWidth={2} />;
      })}
      {/* armoured cables into the unit's foot (the FIRE surge runs up them to the relay) */}
      {[0, 1].map((k) => {
        const d = `M${-260 + k * 40},${PAD + 40 - k * 24} C${-80 + k * 30},${PAD + 30 - k * 24} ${40 + k * 40},${PAD - 50} ${40 + k * 40},${1306}`;
        return (
          <g key={k}>
            <path d={d} fill="none" stroke={INK} strokeWidth={34} strokeLinecap="round" />
            <path d={d} fill="none" stroke="#26313A" strokeWidth={26} strokeLinecap="round" />
            <path d={d} fill="none" stroke="#4E5B64" strokeWidth={6} strokeDasharray="10 14" strokeLinecap="round" />
            {pw.cable > 0.01 && <path d={d} fill="none" stroke={PAL.packet} strokeWidth={12} strokeLinecap="round" strokeDasharray="90 1400" strokeDashoffset={fmt(-(pw.cable * 520) + 60 + k * 30)} style={{mixBlendMode: 'screen'}} />}
          </g>
        );
      })}
      <rect x={10} y={1296} width={150} height={34} rx={6} fill={steel} stroke={INK} strokeWidth={3} />

      {/* the viewport's bezel: heavy, bolted, a dark gasket at the glass; its inner lip catches the bench light */}
      <path d={`${rr(W_OPEN.x0 - BZ, W_OPEN.y0 - BZ, W_OPEN.x1 + BZ, W_OPEN.y1 + BZ, W_OPEN.r + BZ - 6)} ${openingD}`} fill={`url(#${tag}-bz)`} fillRule="evenodd" stroke={INK} strokeWidth={4} />
      {/* the gasket (just outside the opening, so nothing of it lies over the bench) */}
      <path d={rr(W_OPEN.x0 - 6, W_OPEN.y0 - 6, W_OPEN.x1 + 6, W_OPEN.y1 + 6, W_OPEN.r + 6)} fill="none" stroke={mix('#0A1116', PAL.laser, clamp(spill * 0.55))} strokeWidth={12} />
      <path d={rr(W_OPEN.x0 - 1.5, W_OPEN.y0 - 1.5, W_OPEN.x1 + 1.5, W_OPEN.y1 + 1.5, W_OPEN.r + 1.5)} fill="none" stroke={INK} strokeWidth={3} />
      {Array.from({length: 24}, (_, i) => {
        const w = W_OPEN.x1 - W_OPEN.x0 + BZ, h = W_OPEN.y1 - W_OPEN.y0 + BZ;
        let s = (i / 24) * 2 * (w + h);
        let x = W_OPEN.x0 - BZ / 2, y = W_OPEN.y0 - BZ / 2;
        if (s < w) x += s; else if ((s -= w) < h) { x += w; y += s; } else if ((s -= h) < w) { x += w - s; y += h; } else { s -= w; y += h - s; }
        return <circle key={i} cx={fmt(x)} cy={fmt(y)} r={7} fill={steelL} stroke={INK} strokeWidth={2} />;
      })}
      {/* the vent grille over the viewport (pump light leaks through its slats) */}
      <rect x={W_OPEN.x0 - 10} y={336} width={W_OPEN.x1 - W_OPEN.x0 + 20} height={66} rx={10} fill="#141E25" stroke={INK} strokeWidth={3} />
      <rect x={W_OPEN.x0 + 4} y={348} width={W_OPEN.x1 - W_OPEN.x0 - 8} height={42} rx={5} fill={`url(#${tag}-vn)`} opacity={fmt(clamp(0.08 + 0.8 * vent))} />
      {Array.from({length: 17}, (_, i) => <path key={i} d={`M${W_OPEN.x0 + 4 + i * 30},348 l16,0 l-10,42 l-16,0 Z`} fill="#3E4A54" stroke={INK} strokeWidth={1.5} />)}

      {/* status lamps (caged) */}
      {[{c: '#5BF08A', on: 1}, {c: '#F0B85B', on: pw.amber}, {c: '#FF5A4E', on: pw.red}].map((l, i) => {
        const cx = 902, cy = 520 + i * 96;
        return (
          <g key={i}>
            <rect x={cx - 36} y={cy - 36} width={72} height={72} rx={12} fill="#212C34" stroke={INK} strokeWidth={3} />
            <circle cx={cx} cy={cy} r={24} fill={mix(l.c, '#141C22', 0.78)} stroke={INK} strokeWidth={3} />
            <path d={`M${cx - 24},${cy} L${cx + 24},${cy} M${cx},${cy - 24} L${cx},${cy + 24}`} stroke={INK} strokeWidth={3} />
          </g>
        );
      })}
      {/* the louvred vent (cooling for the pump modules: their light shows between the louvres) */}
      <rect x={846} y={850} width={210} height={330} rx={12} fill="#141E25" stroke={INK} strokeWidth={4} />
      <rect x={860} y={866} width={182} height={298} rx={6} fill={`url(#${tag}-vn)`} opacity={fmt(clamp(0.08 + 0.85 * vent))} />
      {Array.from({length: 9}, (_, i) => <path key={i} d={`M860,${880 + i * 33} L1042,${880 + i * 33} L1032,${898 + i * 33} L870,${898 + i * 33} Z`} fill="#44515B" stroke={INK} strokeWidth={2} />)}

      {/* night: until the machine lights it, the wall is in the storm's dark (the lights below are not) */}
      <path d={`M-760,${ROOF - 4} L1860,${ROOF - 4} L1860,${SKID + 40} L-760,${SKID + 40} Z ${openingD}`} fill="#040A0F" fillRule="evenodd" opacity={0.66} mask={`url(#${tag}-lm)`} />
      {/* the lights: charge segments, lamps */}
      {Array.from({length: segs}, (_, i) => {
        if (i >= lit) return null;
        const c = i < 6 ? '#5BF08A' : i < 10 ? '#F0B85B' : '#FF5A4E';
        const y = 1250 - i * 64;
        return (
          <g key={`L${i}`}>
            <rect x={CX0} y={y - 52} width={CX1 - CX0} height={52} rx={6} fill={mix(c, '#FFFFFF', 0.25 + 0.35 * clamp(pw.flash))} stroke={INK} strokeWidth={2} />
            <Glow id={`${tag}-cg${i}`} cx={(CX0 + CX1) / 2} cy={y - 26} r={60} sy={0.75} c={c} a={0.45 + 0.35 * clamp(pw.flash)} />
          </g>
        );
      })}
      {[{c: '#5BF08A', on: 1}, {c: '#F0B85B', on: pw.amber}, {c: '#FF5A4E', on: pw.red}].map((l, i) => {
        if (l.on <= 0.5) return null;
        const cx = 902, cy = 520 + i * 96;
        return (
          <g key={`M${i}`}>
            <circle cx={cx} cy={cy} r={24} fill={mix(l.c, '#FFFFFF', 0.3)} stroke={INK} strokeWidth={3} />
            <path d={`M${cx - 24},${cy} L${cx + 24},${cy} M${cx},${cy - 24} L${cx},${cy + 24}`} stroke={INK} strokeWidth={3} />
            <circle cx={cx - 9} cy={cy - 9} r={5} fill="#FFFFFF" opacity={0.8} />
            <Glow id={`${tag}-lg${i}`} cx={cx} cy={cy} r={110} c={l.c} a={0.6} />
          </g>
        );
      })}
      {/* the machine's light on its own wall: round the viewport and out of the vents; the bezel's rim catches it */}
      <g style={{mixBlendMode: 'screen'}} clipPath={`url(#${tag}-out)`}>
        <ellipse cx={W_C.x} cy={W_C.y} rx={fmt(420 + 160 * F)} ry={fmt(640 + 180 * F)} fill={`url(#${tag}-sp)`} opacity={fmt(clamp(0.22 * light + 0.5 * F))} />
        <path d={rr(W_OPEN.x0 - BZ, W_OPEN.y0 - BZ, W_OPEN.x1 + BZ, W_OPEN.y1 + BZ, W_OPEN.r + BZ - 6)} fill="none" stroke={PAL.laser} strokeWidth={5} opacity={fmt(clamp(0.18 + 0.3 * light + 0.5 * F))} />
        <Glow id={`${tag}-vg1`} cx={951} cy={1015} r={200 + 60 * F} sy={1.15} c={PAL.laser} a={0.32 * vent} />
        <Glow id={`${tag}-vg2`} cx={W_C.x} cy={369} r={330} sy={0.3} c={PAL.laser} a={0.3 * vent} />
        {F > 0.02 && <ellipse cx={W_C.x} cy={W_C.y} rx={fmt(330 + 120 * F)} ry={fmt(500 + 140 * F)} fill={`url(#${tag}-bl)`} opacity={fmt(clamp(0.6 * F))} />}
        {F > 0.02 && <Glow id={`${tag}-vf1`} cx={951} cy={1015} r={150} sy={1.4} c={PAL.packet} a={0.45 * F} />}
        {F > 0.02 && <Glow id={`${tag}-vf2`} cx={W_C.x} cy={369} r={300} sy={0.22} c={PAL.packet} a={0.45 * F} />}
      </g>
      {/* heat: the hot louvres steam in the rain (soft wisps rising off the vent, lit by its light) */}
      {pw.steam > 0.01 && (
        <g opacity={fmt(pw.steam)}>
          {Array.from({length: 6}, (_, i) => {
            const per = 0.7 + 0.25 * hash(i, 701);
            const ph = ((t - 8.07) / per + hash(i, 703)) % 1;
            const x = 870 + 160 * hash(i, 705) + 30 * ph * (hash(i, 707) - 0.3);
            const y = 860 - 230 * ph;
            const r = 26 + 60 * ph;
            const a = Math.sin(Math.PI * ph) * (0.75 + 0.3 * clamp(vent));
            return <ellipse key={i} cx={fmt(x)} cy={fmt(y)} rx={fmt(r)} ry={fmt(r * 0.75)} fill={`url(#${tag}-stm)`} opacity={fmt(clamp(a))} />;
          })}
        </g>
      )}
    </g>
  );
};

/** the glass: a faint cool tint, two soft reflections, rain beads with highlights and a couple of runs. `g` fades it all
 *  out as the camera reaches the glass (at the cut nothing of it is left: C2's frame is clean) */
export const GlassC1: React.FC<{tag: string; g: number; t: number; glow: number}> = ({tag, g, t, glow}) => {
  if (g <= 0.005) return null;
  const {x0, y0, x1, y1} = W_OPEN;
  const beads = Array.from({length: 22}, (_, i) => {
    const x = x0 + 18 + (x1 - x0 - 36) * hash(i, 401);
    const y = y0 + 18 + (y1 - y0 - 36) * hash(i, 403);
    const r = 3 + 6 * Math.pow(hash(i, 405), 2);
    const run = i < 4 ? ((t * (0.35 + 0.2 * hash(i, 407)) + hash(i, 409)) % 1) * 260 : 0;
    return {x, y: Math.min(y1 - 12, y + run), r, run: i < 4};
  });
  return (
    <g opacity={fmt(clamp(g))}>
      <defs>
        <clipPath id={`${tag}-gc`}>
          <path d={openingD} />
        </clipPath>
        <linearGradient id={`${tag}-rf`} gradientUnits="userSpaceOnUse" x1={x0} y1={y0} x2={x1} y2={y1}>
          <stop offset="0" stopColor="#FFFFFF" stopOpacity={0} />
          <stop offset="0.3" stopColor="#FFFFFF" stopOpacity={0} />
          <stop offset="0.38" stopColor="#DDEBF4" stopOpacity={0.12} />
          <stop offset="0.47" stopColor="#FFFFFF" stopOpacity={0} />
          <stop offset="0.62" stopColor="#FFFFFF" stopOpacity={0} />
          <stop offset="0.66" stopColor="#DDEBF4" stopOpacity={0.08} />
          <stop offset="0.71" stopColor="#FFFFFF" stopOpacity={0} />
        </linearGradient>
      </defs>
      <g clipPath={`url(#${tag}-gc)`}>
        <rect x={x0} y={y0} width={x1 - x0} height={y1 - y0} fill="#0A1C26" opacity={0.12} />
        <rect x={x0} y={y0} width={x1 - x0} height={y1 - y0} fill={`url(#${tag}-rf)`} />
        {beads.map((b, i) => (
          <g key={i}>
            {b.run && <line x1={fmt(b.x)} y1={fmt(b.y - 80)} x2={fmt(b.x)} y2={fmt(b.y)} stroke="#CFE0EC" strokeOpacity={0.16} strokeWidth={2.5} />}
            <circle cx={fmt(b.x)} cy={fmt(b.y)} r={fmt(b.r)} fill="#9FB8C8" opacity={fmt(0.16 + 0.3 * clamp(glow))} />
            <circle cx={fmt(b.x - b.r * 0.3)} cy={fmt(b.y - b.r * 0.35)} r={fmt(b.r * 0.35)} fill="#FFFFFF" opacity={fmt(0.45 + 0.45 * clamp(glow))} />
          </g>
        ))}
      </g>
    </g>
  );
};
export const PAD_Y = PAD;
