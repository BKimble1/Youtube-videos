// THE REFUGE — exterior. A Victorian-conservatory-like glass pavilion on a pier at the waterfront (KIT.md: world
// x 16000–19000). Side elevation from the south (the camera's side), so the entrance vestibule at the west end, its
// sliding glass doors, the outer shutter and the teal aid symbol stay visible in every wide.
//
// Local coordinates (scale 1): origin (0, 0) = the pier deck at the pavilion's west (left) end; width 3000; the dome
// apex lantern at (1500, −1560). Draw with x, y (world position of the origin) and scale.
// It must read as genuinely safe and inviting: warm light, plants, people at rest. The only hints are the glass
// itself (glints, mullions) and a very small coordination-system mark on the shutter housing.
import React from 'react';
import {C, REF, SYS} from '../theme';
import {rnd, noise, clamp, lerp} from '../kit/math';
import {fxId, mixHex} from '../fx/common';
import {Glow} from '../fx/light';
import {refLight, RefTime} from './refugeLight';
import {Plant, SoftFigure} from './refugePlants';

export const REFUGE = {
  width: 3000,
  door: {x: 290, y: -70, w: 280, h: 540},       // door opening: centre x, sill y, size
  vestibule: {x0: 60, x1: 520, top: -700},
  symbol: {x: 290, y: -820, r: 62},
  apex: {x: 1500, y: -1560},
  floorY: -70,                                   // interior floor (plinth top)
};
/** World position of a local refuge point. */
export const refugeAt = (x: number, y: number, scale: number, lx: number, ly: number) => ({x: x + lx * scale, y: y + ly * scale});

/** Small three-arc mark of the coordination system (restrained; no text). */
export const MiniMark: React.FC<{x: number; y: number; r: number; color?: string; sw?: number}> = ({x, y, r, color = SYS.mark, sw = 2}) => (
  <g fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round">
    {[1, 0.7, 0.42].map((k, i) => <path key={i} d={`M ${x - r * k} ${y} A ${r * k} ${r * k} 0 0 1 ${x + r * k} ${y}`} />)}
    <circle cx={x} cy={y} r={sw * 0.9} fill={color} stroke="none" />
  </g>
);

/** The teal aid symbol: rounded square with a white plus (no text). */
export const AidSymbol: React.FC<{x: number; y: number; r: number; ink: number; glow?: number; seed?: number}> = ({x, y, r, ink, glow = 0.5, seed = 1}) => (
  <g>
    {glow > 0 && <Glow x={x} y={y} r={r * 3.2} color={REF.aid} opacity={0.35 * glow} id={fxId('aid', seed, x, y)} />}
    <rect x={x - r} y={y - r} width={r * 2} height={r * 2} rx={r * 0.32} fill={REF.aid} stroke={C.ink} strokeWidth={ink} />
    <path d={`M ${x - r * 0.18} ${y - r * 0.62} h ${r * 0.36} v ${r * 0.44} h ${r * 0.44} v ${r * 0.36} h ${-r * 0.44} v ${r * 0.44} h ${-r * 0.36} v ${-r * 0.44} h ${-r * 0.44} v ${-r * 0.36} h ${r * 0.44} Z`} fill="#FFFFFF" />
  </g>
);

export type RefugeExteriorProps = {
  x: number; y: number; scale?: number; t: number; seed?: number; ink?: number;
  doors?: number; shutter?: number; glow?: number; time?: number | RefTime; figures?: boolean; far?: boolean; mark?: boolean; pier?: boolean;
  /** 0..1 strength of the glass glints that seed the later reveal */
  glints?: number;
};

// envelope of the glass building (local): west wing arch, central dome hall, east wing arch (one clean outline)
const WING_W = 700, WING_WALL = -560, WING_TOP = -830;
const HALL_X0 = 700, HALL_X1 = 2300, HALL_WALL = -760, DOME_TOP = -1450;
const envelopePath = () =>
  `M 0 -70 L 0 ${WING_WALL} A ${WING_W / 2} ${Math.abs(WING_TOP - WING_WALL)} 0 0 1 ${WING_W} ${WING_WALL} L ${HALL_X0} ${HALL_WALL} ` +
  `A ${(HALL_X1 - HALL_X0) / 2} ${Math.abs(DOME_TOP - HALL_WALL)} 0 0 1 ${HALL_X1} ${HALL_WALL} L ${HALL_X1} ${WING_WALL} ` +
  `A ${WING_W / 2} ${Math.abs(WING_TOP - WING_WALL)} 0 0 1 3000 ${WING_WALL} L 3000 -70 Z`;

export const RefugeExterior: React.FC<RefugeExteriorProps> = ({x, y, scale = 1, t, seed = 1, ink = 4, doors = 0, shutter = 0, glow = 1, time = 1, figures = true, far = false, mark = true, pier = true, glints = 1}) => {
  const L = refLight(time);
  const k = ink / scale; // ink in local units
  const dim = (c: string) => mixHex(c, '#26334C', 0.5 * L.lamps);
  const cid = fxId('refenv', seed, x, y);
  const gid = fxId('refbg', seed, x, y);
  const env = envelopePath();
  const night = L.lamps;
  // ---------------- interior (seen through the glass)
  const interior: React.ReactElement[] = [];
  interior.push(<rect key="bg" x={-20} y={-1600} width={3040} height={1540} fill={`url(#${gid})`} />);
  // back glass mullions (far side, faint)
  for (let xx = 100; xx < 3000; xx += 200) interior.push(<line key={`bm${xx}`} x1={xx} y1={-70} x2={xx} y2={-1500} stroke="#E9DCC4" strokeWidth={k * 0.8} opacity={0.5} />);
  // floor
  interior.push(<rect key="fl" x={-20} y={-150} width={3040} height={90} fill={REF.floorShade} />);
  // hanging lamps
  [500, 1100, 1500, 1900, 2500].forEach((lx, i) => {
    const ly = lx > 600 && lx < 2400 ? -1080 : -640;
    interior.push(
      <g key={`lamp${i}`}>
        <line x1={lx} y1={ly - 260} x2={lx} y2={ly} stroke={C.ink} strokeWidth={k * 0.8} />
        <path d={`M ${lx - 34} ${ly + 22} Q ${lx} ${ly - 30} ${lx + 34} ${ly + 22} Z`} fill={REF.woodDark} stroke={C.ink} strokeWidth={k * 0.8} />
        <Glow x={lx} y={ly + 30} r={220} color="#FFD58A" opacity={0.25 + 0.5 * night} id={fxId('rl' + i, seed, x, y)} />
      </g>,
    );
  });
  if (!far) {
    // plants along the floor and a palm under the dome
    [[180, 'bush', 0.9], [560, 'tall', 1], [980, 'fern', 1.1], [1500, 'palm', 1.25], [1250, 'tall', 0.9], [1760, 'bush', 1.1], [2150, 'tall', 1.05], [2600, 'fern', 1], [2850, 'bush', 0.85]].forEach(([px, kind, ps], i) =>
      interior.push(<Plant key={`pl${i}`} x={px as number} y={-70} s={ps as number} t={t} seed={seed * 10 + i} ink={k * 0.8} kind={kind as 'tall'} pot={kind !== 'palm'} />));
    if (figures) {
      [[760, false, 0.85], [880, true, 0.85], [1380, false, 0.9], [1650, true, 0.85], [2050, false, 0.88], [2380, true, 0.85]].forEach(([fx, seated, fs], i) =>
        interior.push(<SoftFigure key={`fg${i}`} x={fx as number} y={(seated ? -150 : -80)} s={fs as number} t={t} seed={seed * 7 + i} seated={seated as boolean} ink={k * 0.8} opacity={0.92} />));
    }
  } else {
    [400, 1000, 1500, 2000, 2600].forEach((px, i) => interior.push(<ellipse key={`fp${i}`} cx={px} cy={-200} rx={170} ry={130} fill={i % 2 ? REF.leaf : REF.leafDark} />));
    if (figures) [700, 1300, 1800, 2300].forEach((fx, i) => interior.push(<g key={`ff${i}`}><rect x={fx - 26} y={-330} width={52} height={150} rx={22} fill="#9A7F96" /><circle cx={fx} cy={-360} r={26} fill="#E8B996" /></g>));
  }
  // ---------------- glass, reflections and mullions (front)
  const front: React.ReactElement[] = [];
  front.push(<path key="tint" d={env} fill={mixHex('#D6F0F6', '#2C3E62', night)} opacity={0.14 + 0.1 * (1 - night)} />);
  // sky reflected in the upper glass (fades by night)
  front.push(<path key="skyref" d={env} fill={`url(#${gid}s)`} opacity={0.5 * (1 - night * 0.8)} />);
  // reflection bands (diagonal) — subtle, seeded; these are the glints that make the glass physically present
  const bands: React.ReactElement[] = [];
  for (let i = 0; i < 7; i++) {
    const bx = 150 + rnd(seed * 3 + i) * 2700, w = 40 + rnd(seed * 5 + i) * 90;
    bands.push(<polygon key={i} points={`${bx},-80 ${bx + w},-80 ${bx + w + 520},-1500 ${bx + 520},-1500`} fill="#FFFFFF" opacity={(0.06 + 0.08 * rnd(seed * 7 + i)) * glints} />);
  }
  front.push(<g key="bands" clipPath={`url(#${cid})`}>{bands}</g>);
  // mullions: verticals on the walls, transoms, wing arches, dome ribs and rings
  const mull = dim(REF.mullion), mw = (far ? 6 : 9) * (k / 4) * 1.4 + 3;
  const ml: React.ReactElement[] = [];
  const vline = (xx: number, y0: number, y1: number, key: string, w = mw) => ml.push(<line key={key} x1={xx} y1={y0} x2={xx} y2={y1} stroke={mull} strokeWidth={w} />);
  for (let xx = 0; xx <= WING_W; xx += far ? 200 : 100) {
    const yTop = WING_WALL - Math.sqrt(Math.max(0, 1 - ((xx - WING_W / 2) / (WING_W / 2)) ** 2)) * Math.abs(WING_TOP - WING_WALL);
    vline(xx, -70, yTop, `wl${xx}`);
    vline(3000 - xx, -70, yTop, `wr${xx}`);
  }
  for (let xx = HALL_X0; xx <= HALL_X1; xx += far ? 160 : 80) vline(xx, xx < HALL_X0 + 1 || xx > HALL_X1 - 1 ? -70 : WING_WALL, HALL_WALL, `hv${xx}`);
  [-260, -470, WING_WALL].forEach((yy, i) => {
    ml.push(<line key={`tw${i}`} x1={0} y1={yy} x2={WING_W} y2={yy} stroke={mull} strokeWidth={mw} />);
    ml.push(<line key={`te${i}`} x1={3000 - WING_W} y1={yy} x2={3000} y2={yy} stroke={mull} strokeWidth={mw} />);
  });
  ml.push(<line key="hw" x1={HALL_X0} y1={HALL_WALL} x2={HALL_X1} y2={HALL_WALL} stroke={mull} strokeWidth={mw * 1.3} />);
  ml.push(<line key="hw2" x1={HALL_X0} y1={WING_WALL} x2={HALL_X1} y2={WING_WALL} stroke={mull} strokeWidth={mw} />);
  for (let xx = HALL_X0 + 80; xx < HALL_X1; xx += far ? 160 : 80) ml.push(<line key={`hl${xx}`} x1={xx} y1={-70} x2={xx} y2={WING_WALL} stroke={mull} strokeWidth={mw * 0.8} opacity={0.75} />);
  [-260, -470].forEach((yy, i) => ml.push(<line key={`th${i}`} x1={HALL_X0} y1={yy} x2={HALL_X1} y2={yy} stroke={mull} strokeWidth={mw * 0.8} opacity={0.75} />));
  // dome ribs (meridians projected as half-ellipses) and rings
  const RX = (HALL_X1 - HALL_X0) / 2, RY = Math.abs(DOME_TOP - HALL_WALL), cx0 = (HALL_X0 + HALL_X1) / 2;
  const ribs = far ? [-0.7, -0.35, 0, 0.35, 0.7] : [-0.85, -0.62, -0.38, -0.13, 0.13, 0.38, 0.62, 0.85];
  ribs.forEach((s0, i) => {
    const rx = Math.abs(s0) * RX;
    const sweep = s0 < 0 ? 1 : 0;
    ml.push(<path key={`rib${i}`} d={`M ${cx0 + s0 * RX} ${HALL_WALL} A ${rx} ${RY} 0 0 ${sweep} ${cx0} ${DOME_TOP}`} fill="none" stroke={mull} strokeWidth={mw * 0.9} />);
  });
  [0.35, 0.65, 0.88].forEach((h, i) => {
    const yy = HALL_WALL - h * RY, half = RX * Math.sqrt(1 - h * h);
    ml.push(<line key={`ring${i}`} x1={cx0 - half} y1={yy} x2={cx0 + half} y2={yy} stroke={mull} strokeWidth={mw * 0.9} />);
  });
  // wing arch ribs
  [WING_W / 2, 3000 - WING_W / 2].forEach((wc, j) => [0.5, 0.8].forEach((h, i) => {
    const rx = (WING_W / 2) * h, ry = Math.abs(WING_TOP - WING_WALL) * h;
    ml.push(<path key={`wa${j}${i}`} d={`M ${wc - rx} ${WING_WALL} A ${rx} ${ry} 0 0 1 ${wc + rx} ${WING_WALL}`} fill="none" stroke={mull} strokeWidth={mw * 0.8} />);
  }));
  front.push(<g key="mull" clipPath={`url(#${cid})`}>{ml}</g>);
  // outline of the envelope + lantern
  front.push(<path key="env" d={env} fill="none" stroke={C.ink} strokeWidth={k * 1.1} strokeLinejoin="round" />);
  front.push(
    <g key="lantern">
      <rect x={1430} y={-1540} width={140} height={110} rx={10} fill="#EAD9B4" stroke={C.ink} strokeWidth={k} />
      {[1465, 1500, 1535].map((lx) => <line key={lx} x1={lx} y1={-1530} x2={lx} y2={-1440} stroke={REF.mullionShade} strokeWidth={k * 0.8} />)}
      <path d={`M 1420 -1540 Q 1500 -1610 1580 -1540 Z`} fill={REF.mullion} stroke={C.ink} strokeWidth={k} strokeLinejoin="round" />
      <line x1={1500} y1={-1590} x2={1500} y2={-1650} stroke={C.ink} strokeWidth={k} />
      <Glow x={1500} y={-1480} r={160} color="#FFD58A" opacity={0.2 + 0.5 * night} id={fxId('rlan', seed, x, y)} />
    </g>,
  );
  // edge glints (moving very slowly along the rim)
  if (glints > 0) {
    const gu = (t * 0.04 + rnd(seed)) % 1;
    const ang = lerp(Math.PI * 0.95, Math.PI * 0.55, gu);
    const gx = cx0 + Math.cos(ang) * RX, gy = HALL_WALL - Math.sin(ang) * RY;
    front.push(<g key="glint" opacity={0.85 * glints}><path d={`M ${gx - 34} ${gy} L ${gx} ${gy - 8} L ${gx + 34} ${gy} L ${gx} ${gy + 8} Z M ${gx} ${gy - 34} L ${gx + 7} ${gy} L ${gx} ${gy + 34} L ${gx - 7} ${gy} Z`} fill="#FFFFFF" /></g>);
  }
  // ---------------- plinth and pier
  const base: React.ReactElement[] = [];
  base.push(<rect key="plinth" x={-40} y={-75} width={3080} height={75} fill={dim('#CDBFA6')} stroke={C.ink} strokeWidth={k} />);
  for (let xx = 60; xx < 3040; xx += 240) base.push(<line key={`pj${xx}`} x1={xx} y1={-72} x2={xx} y2={-4} stroke="#B3A68E" strokeWidth={k * 0.7} />);
  const pierEls: React.ReactElement[] = [];
  if (pier) {
    for (let px = -440; px <= 3440; px += 220) pierEls.push(<rect key={`pile${px}`} x={px - 22} y={40} width={44} height={420} fill={dim('#4A4743')} stroke={C.ink} strokeWidth={k * 0.8} />);
    pierEls.push(<rect key="deck" x={-520} y={0} width={4040} height={48} fill={dim('#B8B0A4')} stroke={C.ink} strokeWidth={k} />);
    pierEls.push(<rect key="deck2" x={-520} y={30} width={4040} height={18} fill={dim('#9E968B')} />);
  }
  // ---------------- entrance vestibule (front)
  const V = REFUGE.vestibule, D = REFUGE.door;
  const ves: React.ReactElement[] = [];
  const dl = D.x - D.w / 2, dr = D.x + D.w / 2, dt = D.y - D.h;
  const warmOn = clamp(doors * 1.5);
  // warm interior behind the doors
  ves.push(<rect key="vbg" x={V.x0} y={V.top} width={V.x1 - V.x0} height={-70 - V.top} fill={REF.warm} />);
  ves.push(<rect key="vin" x={dl} y={dt} width={D.w} height={D.h} fill="#FFE2A8" opacity={0.6 + 0.4 * warmOn} />);
  if (!far) ves.push(<g key="vplants"><Plant x={dl + 40} y={-70} s={0.55} t={t} seed={seed + 50} ink={k * 0.8} kind="bush" /></g>);
  // sliding door panels (each half the opening), sliding behind the side panes
  const pw = D.w / 2;
  const slide = clamp(doors) * pw * 0.96;
  [-1, 1].forEach((sd) => {
    const px0 = sd < 0 ? dl - slide : D.x + slide;
    ves.push(<rect key={`door${sd}`} x={px0} y={dt} width={pw} height={D.h} fill="#D6F0F6" opacity={0.35} stroke={REF.mullionShade} strokeWidth={k * 2.2} />);
    ves.push(<line key={`dh${sd}`} x1={sd < 0 ? px0 + pw - 16 : px0 + 16} y1={dt + D.h * 0.45} x2={sd < 0 ? px0 + pw - 16 : px0 + 16} y2={dt + D.h * 0.6} stroke={C.ink} strokeWidth={k * 1.2} strokeLinecap="round" />);
  });
  // fixed side panes (cover the sliding panels when open)
  ves.push(<rect key="spL" x={V.x0} y={V.top + 60} width={dl - V.x0} height={-70 - V.top - 60} fill="#D6F0F6" opacity={0.5} stroke={REF.mullion} strokeWidth={k * 2.5} />);
  ves.push(<rect key="spR" x={dr} y={V.top + 60} width={V.x1 - dr} height={-70 - V.top - 60} fill="#D6F0F6" opacity={0.5} stroke={REF.mullion} strokeWidth={k * 2.5} />);
  // shutter housing and the outer shutter (pale, ordered: the system's)
  ves.push(<rect key="shbox" x={dl - 26} y={dt - 64} width={D.w + 52} height={58} rx={8} fill={SYS.panel} stroke={C.ink} strokeWidth={k} />);
  if (mark) ves.push(<MiniMark key="mark" x={dr + 6} y={dt - 30} r={12} sw={k * 0.6} />);
  const sh = clamp(shutter);
  if (sh > 0.001) {
    const sy1 = dt - 6 + D.h * sh;
    const slats: React.ReactElement[] = [];
    for (let yy = dt; yy < sy1 - 4; yy += 30) slats.push(<line key={yy} x1={dl - 14} y1={yy} x2={dr + 14} y2={yy} stroke={SYS.panelShade} strokeWidth={k * 0.9} />);
    ves.push(<g key="shutter"><rect x={dl - 16} y={dt - 6} width={D.w + 32} height={sy1 - dt + 6} fill={SYS.panel} stroke={C.ink} strokeWidth={k} />{slats}<rect x={dl - 20} y={sy1 - 14} width={D.w + 40} height={18} rx={4} fill={SYS.slate} stroke={C.ink} strokeWidth={k} /></g>);
  }
  // threshold step from the pier deck up to the door sill
  ves.push(<path key="step" d={`M ${dl - 70} 0 L ${dl - 30} -38 L ${dl - 30} -70 L ${dr + 30} -70 L ${dr + 30} -38 L ${dr + 70} 0 Z`} fill={dim('#BFB29A')} stroke={C.ink} strokeWidth={k} strokeLinejoin="round" />);
  // frame, canopy and fascia
  ves.push(<rect key="vframe" x={V.x0} y={V.top} width={V.x1 - V.x0} height={-70 - V.top} fill="none" stroke={REF.mullion} strokeWidth={k * 4} />);
  ves.push(<rect key="vout" x={V.x0 - 4} y={V.top - 4} width={V.x1 - V.x0 + 8} height={-70 - V.top + 8} fill="none" stroke={C.ink} strokeWidth={k} />);
  ves.push(<rect key="canopy" x={V.x0 - 40} y={V.top - 26} width={V.x1 - V.x0 + 80} height={30} rx={6} fill={REF.mullion} stroke={C.ink} strokeWidth={k} />);
  ves.push(<AidSymbol key="aid" x={REFUGE.symbol.x} y={REFUGE.symbol.y} r={REFUGE.symbol.r} ink={k} glow={0.5 + 0.5 * night} seed={seed} />);
  ves.push(<line key="aidpost" x1={REFUGE.symbol.x} y1={REFUGE.symbol.y + REFUGE.symbol.r} x2={REFUGE.symbol.x} y2={V.top - 26} stroke={C.ink} strokeWidth={k * 1.2} />);
  // warm light spilling out of the open doors onto the pier
  if (warmOn > 0) ves.push(<Glow key="spill" x={D.x} y={-30} r={420} squash={0.32} color="#FFD58A" opacity={0.55 * warmOn} id={fxId('spill', seed, x, y)} />);
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <defs>
        <clipPath id={cid}><path d={env} /></clipPath>
        <linearGradient id={gid} x1="0" y1="-1500" x2="0" y2="-70" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor={mixHex('#F6E3BF', '#D99A55', night)} />
          <stop offset="100%" stopColor={REF.warm} />
        </linearGradient>
        <linearGradient id={`${gid}s`} x1="0" y1="-1560" x2="0" y2="-300" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor={L.skyTop} stopOpacity={0.9} />
          <stop offset="100%" stopColor={L.skyLow} stopOpacity={0} />
        </linearGradient>
      </defs>
      {pierEls}
      <Glow x={1500} y={-600} r={1900} squash={0.5} color="#FFD58A" opacity={(0.18 + 0.35 * L.warm) * glow} id={fxId('rglow', seed, x, y)} />
      <g clipPath={`url(#${cid})`} opacity={1}>{interior}</g>
      {front}
      {base}
      {ves}
    </g>
  );
};
void noise; void SYS;
