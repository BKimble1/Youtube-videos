// The proving ground, side view: one coherent place seen from the road's edge. The road band is drawn in world
// millimetres (the car's wheels touch y = profile(x) along its middle); everything behind it sits on parallax layers
// (control tower, grandstand and hangar, rolling hills, tree lines, infield), everything in front of the car is the near
// kerb and verge. Light comes from the upper right throughout. Three zones share the sky and the skyline:
//   launch  = the straight (start gantry, painted launch box, concrete wall)
//   rough   = the rough-road section (bump markers, gravel runoff, tyre wall)
//   bend    = the handling circuit (tyre wall, red-and-white kerbs, chevron board)
import React from 'react';
import {C} from '../theme';
import {Cam, toScreen} from './stage';
import {rand} from './util';

export type Sign = {x: number; kind: 'brake' | 'bend' | 'bumps'; opacity?: number};
export type Profile = (x: number) => number;
export const FLAT: Profile = () => 0;
export type Zone = 'launch' | 'rough' | 'bend';
/** Which part of the proving ground: the demonstration pad, the cornering section, the braking zone, the uneven road. */
export type Look = 'pad' | 'corner' | 'brake' | 'rough';
const LOOKS: Record<Look, {sky: [string, string]; hills: [string, string]; sun: string; sunY: number}> = {
  pad: {sky: ['#CFE7E4', '#FAF3DF'], hills: ['#C6E3DC', '#B2DACF'], sun: C.saffronLight, sunY: 360},
  corner: {sky: ['#C5DDF0', '#FAF3DF'], hills: ['#B9D6E6', '#A3CAD9'], sun: C.white, sunY: 400},
  brake: {sky: ['#F7D9BE', '#FBF1DC'], hills: ['#EBD7B5', '#DDC8A0'], sun: '#FFB35C', sunY: 250},
  rough: {sky: ['#DCEAC4', '#FAF3DF'], hills: ['#C9E0B8', '#B4D4A4'], sun: C.saffronLight, sunY: 330},
};

export const FAR_EDGE = 330;
export const NEAR_EDGE = -700;
const INK = C.ink;

// aerial perspective: far things drift toward the sky colour
const mix = (a: string, b: string, t: number) => {
  const p = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const A = p(a), B = p(b);
  return `rgb(${A.map((v, i) => Math.round(v + (B[i] - v) * t)).join(',')})`;
};
const SKY_LOW = '#EFEBD6';

export type SideSceneProps = {
  cam: Cam;
  zone?: Zone;
  look?: Look;
  profile?: Profile;
  patches?: [number, number][];
  signs?: Sign[];
  stopLine?: number;
  /** x ranges (mm) of the foreground wall that hides the far-side barrier, e.g. for a passing wipe */
  hideSky?: boolean;
};

/** Repeating layer: items every `spacing` layer-mm, seeded so the same x always draws the same thing. */
const layerItems = (cam: Cam, p: number, spacing: number, seed: number) => {
  const half = 1100 / (cam.z * p);
  const k0 = Math.floor((cam.x - half) / spacing) - 1, k1 = Math.ceil((cam.x + half) / spacing) + 1;
  const out: {k: number; sx: number; r: number}[] = [];
  for (let k = k0; k <= k1; k++) out.push({k, sx: 960 + (k * spacing + rand(seed + k * 13) * spacing * 0.6 - cam.x) * cam.z * p, r: rand(seed + k * 7 + 3)});
  return out;
};

const Tower: React.FC<{sx: number; by: number; s: number; tint: number}> = ({sx, by, s, tint}) => (
  <g transform={`translate(${sx} ${by}) scale(${s})`}>
    <rect x={-16} y={-250} width={32} height={250} fill={mix('#EADFC2', SKY_LOW, tint)} stroke={INK} strokeOpacity={0.4} strokeWidth={3} />
    <rect x={-58} y={-320} width={116} height={78} rx={10} fill={mix('#EADFC2', SKY_LOW, tint)} stroke={INK} strokeOpacity={0.4} strokeWidth={3} />
    <rect x={-50} y={-304} width={100} height={42} rx={6} fill={mix('#7FB6BC', SKY_LOW, tint)} stroke={INK} strokeOpacity={0.35} strokeWidth={2} />
    <rect x={-66} y={-332} width={132} height={16} rx={6} fill={mix('#E9A91C', SKY_LOW, tint * 0.6)} stroke={INK} strokeOpacity={0.4} strokeWidth={3} />
    <line x1={0} y1={-332} x2={0} y2={-372} stroke={INK} strokeOpacity={0.5} strokeWidth={3} />
    <circle cx={0} cy={-376} r={7} fill={C.coral} />
  </g>
);
const Stand: React.FC<{sx: number; by: number; s: number; tint: number}> = ({sx, by, s, tint}) => (
  <g transform={`translate(${sx} ${by}) scale(${s})`}>
    {[0, 1, 2, 3].map((i) => (
      <rect key={i} x={-190 + i * 18} y={-34 - i * 34} width={380 - i * 36} height={34} fill={mix(['#EF6B55', '#FFC744', '#4F7CC9', '#1CA7A0'][i], SKY_LOW, tint * 0.8)} stroke={INK} strokeOpacity={0.4} strokeWidth={3} />
    ))}
    <path d="M -214 -176 L 214 -176 L 206 -192 L -206 -192 Z" fill={mix('#F4EFE3', SKY_LOW, tint * 0.5)} stroke={INK} strokeOpacity={0.4} strokeWidth={3} />
    {[-170, -60, 60, 170].map((x) => <line key={x} x1={x} y1={-176} x2={x} y2={-30} stroke={INK} strokeOpacity={0.3} strokeWidth={4} />)}
  </g>
);
const Hangar: React.FC<{sx: number; by: number; s: number; tint: number}> = ({sx, by, s, tint}) => (
  <g transform={`translate(${sx} ${by}) scale(${s})`}>
    <path d="M -170 0 L -170 -70 C -170 -150 170 -150 170 -70 L 170 0 Z" fill={mix('#BFD0D8', SKY_LOW, tint * 0.8)} stroke={INK} strokeOpacity={0.4} strokeWidth={3} />
    <rect x={-80} y={-70} width={160} height={70} fill={mix('#8FA3AE', SKY_LOW, tint * 0.8)} stroke={INK} strokeOpacity={0.35} strokeWidth={2.5} />
    <line x1={0} y1={-70} x2={0} y2={0} stroke={INK} strokeOpacity={0.3} strokeWidth={3} />
  </g>
);
const Tank: React.FC<{sx: number; by: number; s: number; tint: number}> = ({sx, by, s, tint}) => (
  <g transform={`translate(${sx} ${by}) scale(${s})`}>
    <rect x={-6} y={-190} width={12} height={190} fill={mix('#BFC9CE', SKY_LOW, tint)} stroke={INK} strokeOpacity={0.4} strokeWidth={3} />
    <ellipse cx={0} cy={-205} rx={52} ry={34} fill={mix('#E8D9B5', SKY_LOW, tint * 0.7)} stroke={INK} strokeOpacity={0.4} strokeWidth={3} />
  </g>
);

const Tree: React.FC<{sx: number; by: number; s: number; kind: number; tint: number}> = ({sx, by, s, kind, tint}) => (
  <g transform={`translate(${sx} ${by}) scale(${s})`}>
    {kind === 0 ? (
      <>
        <rect x={-6} y={-54} width={12} height={54} fill={mix('#8A6A4A', SKY_LOW, tint)} stroke={INK} strokeOpacity={0.5} strokeWidth={3} />
        <circle cx={0} cy={-90} r={46} fill={mix('#5FB8A6', SKY_LOW, tint)} stroke={INK} strokeOpacity={0.5} strokeWidth={3} />
        <circle cx={-24} cy={-72} r={30} fill={mix('#77C6B4', SKY_LOW, tint)} stroke={INK} strokeOpacity={0.5} strokeWidth={3} />
        <circle cx={22} cy={-104} r={22} fill={mix('#8AD1BF', SKY_LOW, tint)} stroke={INK} strokeOpacity={0.4} strokeWidth={2.5} />
      </>
    ) : (
      <>
        <rect x={-5} y={-30} width={10} height={30} fill={mix('#8A6A4A', SKY_LOW, tint)} stroke={INK} strokeOpacity={0.5} strokeWidth={3} />
        <path d="M 0 -170 L 38 -86 L 22 -88 L 50 -34 L -50 -34 L -22 -88 L -38 -86 Z" fill={mix('#4FA695', SKY_LOW, tint)} stroke={INK} strokeOpacity={0.5} strokeWidth={3} strokeLinejoin="round" />
      </>
    )}
  </g>
);

const Cloud: React.FC<{sx: number; sy: number; s: number}> = ({sx, sy, s}) => (
  <g transform={`translate(${sx} ${sy}) scale(${s})`} fill={C.white} opacity={0.85}>
    <ellipse cx={0} cy={0} rx={90} ry={26} />
    <ellipse cx={-40} cy={-16} rx={44} ry={30} />
    <ellipse cx={22} cy={-26} rx={52} ry={34} />
  </g>
);

export const ProvingSide: React.FC<SideSceneProps> = ({cam, zone: zoneIn = 'launch', look, profile = FLAT, patches = [], signs = [], stopLine}) => {
  const lk: Look = look ?? (zoneIn === 'launch' ? 'pad' : zoneIn === 'rough' ? 'rough' : 'corner');
  const zone: Zone = look ? (look === 'pad' ? 'launch' : look === 'rough' ? 'rough' : 'bend') : zoneIn;
  const LK = LOOKS[lk];
  const g0 = toScreen(cam, 0, 0);
  const xl = cam.x - 1000 / cam.z - 400, xr = cam.x + 1000 / cam.z + 400;
  const dz = Math.pow(cam.z / 0.24, 0.25);
  const horizon = g0.y - 1010 * cam.z; // just above the top of the wall, so the skyline and hills read over it
  const sw = 3 / cam.z; // world-unit stroke that stays 3 px on screen

  const skyline = layerItems(cam, 0.07, 9000, 31).map(({k, sx, r}) => {
    const kinds = [Stand, Hangar, Tank, Hangar, Stand, Tank, Hangar];
    const K = k % 6 === 0 ? Tower : kinds[Math.floor(r * kinds.length) % kinds.length];
    return <K key={`s${k}`} sx={sx} by={horizon + 8} s={(0.62 + 0.3 * rand(k + 5)) * dz * 0.9} tint={0.55} />;
  });
  const hillPath = (p: number, amp: number, base: number, fill: string, seed: number, period: number) => {
    const off = (((-cam.x * cam.z * p) % period) + period) % period;
    const pts: string[] = [];
    for (let sx = -period; sx <= 1920 + period; sx += 60) {
      const u = (sx - off) / period;
      const k = Math.floor(u);
      const f = u - k;
      const h0 = 0.4 + 0.6 * rand(seed + k), h1 = 0.4 + 0.6 * rand(seed + k + 1);
      const h = h0 + (h1 - h0) * (f * f * (3 - 2 * f));
      pts.push(`${sx},${horizon - base * dz - amp * dz * h * (0.75 + 0.25 * Math.sin(f * Math.PI))}`);
    }
    return <path d={`M -2400 1200 L ${pts.join(' L ')} L 4400 1200 Z`} fill={fill} stroke={INK} strokeWidth={3} strokeOpacity={0.3} />;
  };
  const treeRow = (p: number, spacing: number, seed: number, scale: number, tint: number, per: number) =>
    layerItems(cam, p, spacing, seed).flatMap(({k, sx}) =>
      Array.from({length: per}, (_, j) => {
        const r = rand(seed + k * 11 + j * 5);
        if (rand(seed + k * 17 + j * 3) < 0.28) return null;
        return <Tree key={`${seed}-${k}-${j}`} sx={sx + j * (spacing * cam.z * p) / per + (r - 0.5) * 60} by={horizon + 14 + (seed % 3) * 5} s={(0.75 + 0.5 * r) * scale * dz} kind={r > 0.7 ? 1 : 0} tint={tint} />;
      }),
    );
  const clouds = layerItems(cam, 0.02, 7000, 71).map(({k, sx, r}) => <Cloud key={`c${k}`} sx={sx} sy={horizon - 330 * dz - r * 120} s={(0.7 + r * 0.6) * dz} />);

  // road polylines (profile only moves the contact line; the band edges stay level)
  const step = Math.max(40, 12 / cam.z);
  const contact: string[] = [];
  for (let x = xl; x <= xr; x += step) contact.push(`${x},${profile(x)}`);
  const road: React.ReactNode[] = [];
  // dashed centre line and painted edge lines
  const DP = 5200;
  for (let k = Math.floor(xl / DP) - 1; k <= Math.ceil(xr / DP); k++) road.push(<rect key={`d${k}`} x={k * DP} y={-205} width={2400} height={100} fill={C.cream} opacity={0.9} />);
  // road texture: seeded specks, kept to a sensible count at any zoom
  const cell = Math.max(160, 26 / cam.z);
  const specks: React.ReactNode[] = [];
  for (let k = Math.floor(xl / cell); k <= Math.ceil(xr / cell); k++) {
    for (let j = 0; j < 3; j++) {
      const r = rand(k * 3 + j * 977);
      specks.push(<circle key={`${k}-${j}`} cx={k * cell + rand(k + j * 31) * cell} cy={NEAR_EDGE + 90 + rand(k * 5 + j) * (FAR_EDGE - NEAR_EDGE - 180)} r={(4 + r * 7) / cam.z * Math.min(1.5, cam.z * 3) * 0.7} fill={r > 0.5 ? '#7C868C' : '#A2ABAF'} opacity={0.55} />);
    }
  }
  // kerb along the near edge: red and cream blocks (bend), plain cream line elsewhere
  const KP = 900;
  const kerbs: React.ReactNode[] = [];
  const kerbBlocks = zone === 'bend' || zone === 'rough';
  for (let k = Math.floor(xl / KP) - 1; k <= Math.ceil(xr / KP); k++) {
    kerbBlocks
      ? kerbs.push(<rect key={`k${k}`} x={k * KP} y={NEAR_EDGE - 120} width={KP} height={120} fill={k % 2 === 0 ? C.coral : C.cream} stroke={INK} strokeOpacity={0.5} strokeWidth={sw * 0.7} />)
      : null;
  }
  // far-side barrier: concrete wall (launch), tyre wall (bend, rough)
  const wallBase = FAR_EDGE + 70;
  const wall: React.ReactNode[] = [];
  if (zone === 'launch') {
    wall.push(<rect key="w" x={xl} y={wallBase} width={xr - xl} height={430} fill="#DDD6C2" stroke={INK} strokeWidth={sw} strokeOpacity={0.55} />);
    wall.push(<rect key="w2" x={xl} y={wallBase + 250} width={xr - xl} height={80} fill="#EFE9D6" />);
    for (let k = Math.floor(xl / 3000) - 1; k <= Math.ceil(xr / 3000); k++) wall.push(<line key={`j${k}`} x1={k * 3000} y1={wallBase} x2={k * 3000} y2={wallBase + 430} stroke={INK} strokeOpacity={0.35} strokeWidth={sw * 0.8} />);
    wall.push(<rect key="cap" x={xl} y={wallBase + 430} width={xr - xl} height={50} fill="#C9C1AA" stroke={INK} strokeWidth={sw} strokeOpacity={0.55} />);
  } else {
    // tyre stacks, two rows high
    const TW = 620;
    for (let k = Math.floor(xl / TW) - 1; k <= Math.ceil(xr / TW); k++) {
      for (let row = 0; row < 2; row++) {
        const col = (k + row) % 5 === 0 ? C.coral : (k + row) % 5 === 2 ? C.cream : '#2A343B';
        wall.push(<rect key={`t${k}-${row}`} x={k * TW + (row % 2) * TW * 0.5} y={wallBase + row * 230} width={TW * 0.96} height={226} rx={85} fill={col} stroke={INK} strokeWidth={sw} strokeOpacity={0.7} />);
      }
    }
  }
  return (
    <g>
      <defs>
        <linearGradient id={`ps-sky-${lk}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={LK.sky[0]} />
          <stop offset="1" stopColor={LK.sky[1]} />
        </linearGradient>
      </defs>
      <rect x={0} y={0} width={1920} height={1080} fill={`url(#ps-sky-${lk})`} />
      <circle cx={1500 - ((cam.x * cam.z * 0.01) % 400)} cy={horizon - LK.sunY * dz} r={72 * dz} fill={LK.sun} opacity={0.95} />
      {clouds}
      {hillPath(0.04, 190, 60, LK.hills[0], 11, 2600)}
      {hillPath(0.09, 120, 0, LK.hills[1], 23, 2000)}
      {skyline}
      {treeRow(0.16, 3400, 41, 0.62, 0.4, 3)}
      {/* infield grass from the horizon down */}
      <rect x={0} y={horizon} width={1920} height={1080} fill="#CFE3B8" />
      {treeRow(0.3, 3600, 53, 0.9, 0.12, 3)}
      <g transform={`translate(960 540) scale(${cam.z} ${-cam.z}) translate(${-cam.x} ${-cam.y})`}>
        {/* verge behind the wall, wall, fence */}
        <rect x={xl} y={FAR_EDGE} width={xr - xl} height={110} fill="#E2DAC4" />
        {wall}
        <rect x={xl} y={NEAR_EDGE} width={xr - xl} height={FAR_EDGE - NEAR_EDGE} fill="#8F999D" />
        <rect x={xl} y={NEAR_EDGE} width={xr - xl} height={(FAR_EDGE - NEAR_EDGE) * 0.42} fill="#86909A" opacity={0.6} />
        {specks}
        {zone === 'rough' && patches.length === 0 ? null : null}
        {patches.map(([a, b], i) => (
          <rect key={i} x={a} y={NEAR_EDGE + 80} width={b - a} height={FAR_EDGE - NEAR_EDGE - 160} rx={60} fill="#7A8389" stroke={INK} strokeWidth={sw * 0.8} strokeOpacity={0.5} />
        ))}
        {road}
        {/* edge lines */}
        <rect x={xl} y={FAR_EDGE - 70} width={xr - xl} height={34} fill={C.cream} opacity={0.9} />
        <rect x={xl} y={NEAR_EDGE + 40} width={xr - xl} height={34} fill={C.cream} opacity={0.9} />
        {stopLine !== undefined && <rect x={stopLine} y={NEAR_EDGE + 40} width={260} height={FAR_EDGE - NEAR_EDGE - 80} fill={C.cream} />}
        {zone === 'launch' && <LaunchBox xl={xl} xr={xr} sw={sw} />}
        <rect x={xl} y={NEAR_EDGE - 120} width={xr - xl} height={120} fill="#E2DAC4" />
        {kerbs}
        <rect x={xl} y={NEAR_EDGE - 9000} width={xr - xl} height={8880} fill="#BFD9A8" />
        <line x1={xl} y1={FAR_EDGE} x2={xr} y2={FAR_EDGE} stroke={INK} strokeWidth={sw} strokeOpacity={0.5} />
        <line x1={xl} y1={NEAR_EDGE - 120} x2={xr} y2={NEAR_EDGE - 120} stroke={INK} strokeWidth={sw} strokeOpacity={0.5} />
        {/* road surface profile (bumps) */}
        <path d={`M ${xl} 0 L ${contact.join(' L ')} L ${xr} 0 Z`} fill="#BCC5C9" stroke={INK} strokeWidth={sw * 1.4} strokeLinejoin="round" />
        {lk === 'corner' && boardRow(xl, xr, 7200, 1800, (x, k) => <Chevron key={`cv${k}`} x={x} y={wallBase + 470} px={cam.z} />)}
        {lk === 'brake' && boardRow(xl, xr, 9000, 0, (x, k) => <BrakeBoard key={`bb${k}`} x={x} y={wallBase + 470} n={(k % 3 + 3) % 3 + 1} px={cam.z} />)}
        {lk === 'pad' && boardRow(xl, xr, 15000, 3000, (x, k) => <Gantry key={`gt${k}`} x={x} y={wallBase + 470} px={cam.z} />)}
        {lk === 'rough' && boardRow(xl, xr, 8000, 2500, (x, k) => <RoadSign key={`rb${k}`} x={x} kind="bumps" px={cam.z} opacity={1} />)}
        {signs.map((s, i) => <RoadSign key={i} x={s.x} kind={s.kind} px={cam.z} opacity={s.opacity ?? 1} />)}
      </g>
    </g>
  );
};

/** Painted launch box: two saffron lines across the straight. */
const LaunchBox: React.FC<{xl: number; xr: number; sw: number}> = ({xl, xr}) => {
  const out: React.ReactNode[] = [];
  for (const x of [-3600, 3600]) {
    if (x > xl - 300 && x < xr + 300) out.push(<rect key={x} x={x - 100} y={NEAR_EDGE + 40} width={200} height={FAR_EDGE - NEAR_EDGE - 80} fill={C.saffron} opacity={0.92} />);
  }
  return <g>{out}</g>;
};

const RoadSign: React.FC<{x: number; kind: Sign['kind']; px: number; opacity: number}> = ({x, kind, px, opacity}) => {
  const sw = 4 / px;
  const y0 = FAR_EDGE + 30;
  return (
    <g opacity={opacity}>
      <rect x={x - 30} y={y0} width={60} height={1700} fill="#B8C2C8" stroke={C.ink} strokeWidth={sw} />
      <g transform={`translate(${x} ${y0 + 2000})`}>
        {kind === 'brake' && (
          <g>
            <polygon points="-330,-140 -140,-330 140,-330 330,-140 330,140 140,330 -140,330 -330,140" fill={C.coral} stroke={C.ink} strokeWidth={sw} />
            <g transform={`scale(${1 / px} ${-1 / px})`}>
              <text x={0} y={0} textAnchor="middle" dominantBaseline="central" fontFamily="'Fredoka Variable'" fontWeight={700} fontSize={150 * px} fill={C.white}>BRAKE</text>
            </g>
          </g>
        )}
        {kind === 'bend' && (
          <g>
            <polygon points="0,380 380,0 0,-380 -380,0" fill={C.saffron} stroke={C.ink} strokeWidth={sw} />
            <path d="M -60 -200 L -60 40 C -60 140 20 180 120 180" fill="none" stroke={C.ink} strokeWidth={70} strokeLinecap="round" />
            <polygon points="100,260 220,180 100,100" fill={C.ink} />
          </g>
        )}
        {kind === 'bumps' && (
          <g>
            <polygon points="0,380 380,0 0,-380 -380,0" fill={C.saffron} stroke={C.ink} strokeWidth={sw} />
            <path d="M -220 -110 L -150 -110 C -110 20 -40 20 0 -110 C 40 20 110 20 150 -110 L 220 -110" fill="none" stroke={C.ink} strokeWidth={60} strokeLinecap="round" strokeLinejoin="round" />
          </g>
        )}
      </g>
    </g>
  );
};

const boardRow = (xl: number, xr: number, period: number, phase: number, f: (x: number, k: number) => React.ReactNode) => {
  const out: React.ReactNode[] = [];
  for (let k = Math.floor((xl - phase) / period) - 1; k <= Math.ceil((xr - phase) / period); k++) out.push(f(k * period + phase, k));
  return <g>{out}</g>;
};
/** Chevron board on a post, behind the tyre wall (the cornering section). */
const Chevron: React.FC<{x: number; y: number; px: number}> = ({x, y, px}) => {
  const sw = 4 / px;
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect x={-30} y={0} width={60} height={520} fill="#B8C2C8" stroke={C.ink} strokeWidth={sw} />
      <rect x={-260} y={520} width={520} height={420} rx={30} fill={C.saffron} stroke={C.ink} strokeWidth={sw} />
      <path d="M -90 600 L 90 730 L -90 860" fill="none" stroke={C.ink} strokeWidth={70} strokeLinecap="round" strokeLinejoin="round" />
    </g>
  );
};
/** Braking-zone board: white with 1-3 diagonal coral stripes. */
const BrakeBoard: React.FC<{x: number; y: number; n: number; px: number}> = ({x, y, n, px}) => {
  const sw = 4 / px;
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect x={-30} y={0} width={60} height={520} fill="#B8C2C8" stroke={C.ink} strokeWidth={sw} />
      <clipPath id={`bb-${Math.round(x)}`}><rect x={-230} y={520} width={460} height={420} rx={30} /></clipPath>
      <rect x={-230} y={520} width={460} height={420} rx={30} fill={C.white} />
      <g clipPath={`url(#bb-${Math.round(x)})`}>
        {Array.from({length: n}, (_, i) => <polygon key={i} points={`${-300 + i * 130},520 ${-210 + i * 130},520 ${-20 + i * 130},940 ${-110 + i * 130},940`} fill={C.coral} />)}
      </g>
      <rect x={-230} y={520} width={460} height={420} rx={30} fill="none" stroke={C.ink} strokeWidth={sw} />
    </g>
  );
};
/** Start gantry post with a light bar (the demonstration pad). */
const Gantry: React.FC<{x: number; y: number; px: number}> = ({x, y, px}) => {
  const sw = 4 / px;
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect x={-50} y={0} width={100} height={1500} fill="#C9D2D8" stroke={C.ink} strokeWidth={sw} />
      <rect x={-330} y={1500} width={660} height={190} rx={36} fill="#EADFC2" stroke={C.ink} strokeWidth={sw} />
      {[-200, 0, 200].map((o) => <circle key={o} cx={o} cy={1595} r={52} fill={o === 200 ? C.teal : '#8FA3AE'} stroke={C.ink} strokeWidth={sw} />)}
    </g>
  );
};
