// The traced Roadster (same trace as short3/Roadster.tsx and the v2 companion), rebuilt for v3 so its parts can
// move: two side panels that hinge open (the dark lower sill and the body above it), a suspension that compresses,
// tyres that flatten slightly on contact, wheel spin, a moving reflection, and a roll that turns the car about its
// long axis (the profile turns edge-on and over, with two speed lines around the axis while it is edge-on).
//
// Everything inside the panels is conceptual staging (fan housings, a tank, a valve, a pipe and nozzles): Tesla has
// not shown where any of it sits. Car-local frame: facing right (+x forward), contact line at y = 0, up is -y,
// world units (the car is 430 long, about 4.3 m).
import React from 'react';
import trace from '../data/roadster_profile.json';
import {C} from '../theme';

type P = [number, number];
const LEVEL = (3.5 * Math.PI) / 180;
const PIV: P = [960, 560];
const lev = ([x, y]: P): P => {
  const dx = x - PIV[0], dy = y - PIV[1];
  return [PIV[0] + dx * Math.cos(LEVEL) - dy * Math.sin(LEVEL), PIV[1] + dx * Math.sin(LEVEL) + dy * Math.cos(LEVEL)];
};
const body0 = (trace.body as P[]).map(lev);
const skirt0 = (trace.skirt as P[]).map(lev);
const glass0 = (trace.glass as P[]).map(lev);
const wheels0 = trace.wheels.map((w) => ({c: lev([w.cx, w.cy]), r: w.r}));
const xMin = Math.min(...body0.map((p) => p[0]));
const xMax = Math.max(...body0.map((p) => p[0]));
const wheelBottom = Math.max(...wheels0.map((w) => w.c[1] + w.r));
const DROOP = 12; // source px of wheel drop (as in the v2 diagrams) so the floor gap reads
export const K3 = 430 / (xMax - xMin);
const midX = (wheels0[0].c[0] + wheels0[1].c[0]) / 2;
const L = ([x, y]: P): P => [(midX - x) * K3, (y - (wheelBottom + DROOP)) * K3];
const BODY = body0.map(L);
const SKIRT = skirt0.map(L);
const GLASS = glass0.map(L);
export const WHEELS3 = wheels0.map((w) => ({x: (midX - w.c[0]) * K3, y: (w.c[1] + DROOP - (wheelBottom + DROOP)) * K3, r: w.r * K3}));

const smooth = (pts: P[], corners: Set<number> = new Set()) => {
  const n = pts.length;
  const g = (i: number) => pts[(i + n) % n];
  let d = `M ${g(0)[0].toFixed(1)} ${g(0)[1].toFixed(1)}`;
  for (let i = 0; i < n; i++) {
    const p0 = g(i - 1), p1 = g(i), p2 = g(i + 1), p3 = g(i + 2);
    const k1 = corners.has(i) ? 0 : 1 / 6;
    const k2 = corners.has((i + 1) % n) ? 0 : 1 / 6;
    const c1: P = [p1[0] + (p2[0] - p0[0]) * k1, p1[1] + (p2[1] - p0[1]) * k1];
    const c2: P = [p2[0] - (p3[0] - p1[0]) * k2, p2[1] - (p3[1] - p1[1]) * k2];
    d += ` C ${c1[0].toFixed(1)} ${c1[1].toFixed(1)}, ${c2[0].toFixed(1)} ${c2[1].toFixed(1)}, ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  return d + ' Z';
};
const BODY_D = smooth(BODY, new Set([0, 22, 23, 26, 27, 28, 41, 46, 47, 58, 60]));
const SKIRT_D = smooth(SKIRT, new Set([0, 5, 6, 10]));
const GLASS_D = smooth(GLASS, new Set([0, 9, 10]));
/** The body outline (car-local), for tracing the car over footage. */
export const OUTLINE_D = BODY_D;
/** The dark lower sill (car-local), for clipping cutaways that reach into it. */
export const SKIRT_OUTLINE_D = SKIRT_D;
const poly = (pts: P[]) => 'M ' + pts.map((p) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' L ') + ' Z';

/** Car-local geometry for scenes. */
export const CAR3 = {
  len: 430,
  nose: (midX - xMin) * K3,
  tail: (xMax - midX) * K3,
  roof: Math.min(...BODY.map((p) => p[1])),
  floorFront: SKIRT[6][1], // skirt lower edge at its front end (about -25)
  floorRear: SKIRT[10][1], // ... at its rear end (about -19)
  gapFront: SKIRT[6][0], // sealed span along the floor
  gapRear: SKIRT[10][0],
  cy: -76, // roll axis height
  width: 198, // plan width (matches the rear view at REAR_PER_SIDE)
  // conceptual hardware (local)
  fans: [-62, 28], fanY: -33, fanR: 8.5,
  vent: {x: -106, y: -36},
  tank: {x0: -92, x1: 40, y0: -90, y1: -62},
  valve: {x: -100, y: -76},
  pipeY: -93,
  nozzle: {x: -216, y: -93}, // rear nozzle mouth (points backward, -x)
  sideNozzles: [[150, -66], [62, -38], [-60, -40], [-186, -84]] as P[], // Rocket's extra ports on the near side
  compressor: {x: 70, y: -76},
};
/** Lower edge of the floor (skirt) at local x, between the seals. */
export const floorAt = (x: number) => {
  const u = (x - CAR3.gapRear) / (CAR3.gapFront - CAR3.gapRear);
  return CAR3.floorRear + (CAR3.floorFront - CAR3.floorRear) * Math.max(0, Math.min(1, u));
};
/** Top of the body at local x (for pressure arrows on the roof side). */
export const roofAt3 = (x: number) => {
  let best = 0, bd = 1e9;
  for (const p of BODY) if (p[1] < -60 && Math.abs(p[0] - x) < bd) { bd = Math.abs(p[0] - x); best = p[1]; }
  return best;
};

// region of the upper panel (below the glass line, above the sill and the rear arch)
const UPPER_PANEL: P[] = [
  [-222, -98], [104, -98], [104, -40], [92.6, -41], [68.9, -42.1], [18.1, -44.9], [-32.8, -48.5], [-83.7, -53], [-104.9, -55.9],
  [-105.3, -61], [-108.4, -70.9], [-114.8, -79.8], [-123.7, -86], [-136.5, -88.6], [-149.1, -87.8], [-159.8, -83.8], [-169.5, -77.3],
  [-176, -72.7], [-184.5, -73.9], [-199.1, -78], [-212.1, -83.1], [-222, -86],
];
const UPPER_D = poly(UPPER_PANEL);
const HINGE_UP = -98;
const HINGE_LO = -50;

export type Parts = {fans?: boolean; tank?: boolean; nozzle?: boolean; sideNozzles?: boolean; compressor?: boolean};
export type CarState = {
  x: number; y: number; heading?: number; roll?: number; squash?: number; compress?: number; spin?: number; refl?: number;
  openLo?: number; openUp?: number; parts?: Parts; opacity?: number; valve?: number; fanSpin?: number; glowFans?: number;
  glowTank?: number; id?: string;
};

const INK = '#0B1418';

const Wheel: React.FC<{x: number; y: number; r: number; spin: number; compress: number}> = ({x, y, r, spin, compress}) => {
  const k = compress;
  const cyb = y + r; // contact point
  return (
    <g transform={`translate(${x} ${cyb}) scale(${1 + 0.035 * k} ${1 - 0.07 * k}) translate(${-x} ${-cyb})`}>
      <circle cx={x} cy={y} r={r} fill="#14191C" stroke={INK} strokeWidth={3.2} />
      <circle cx={x} cy={y} r={r * 0.72} fill="#8E989E" />
      <circle cx={x} cy={y} r={r * 0.66} fill="none" stroke="#6F797F" strokeWidth={1.2} />
      {/* spin marker: a soft highlight arc on the flat wheel cover */}
      <g transform={`rotate(${spin} ${x} ${y})`}>
        <path d={`M ${x + r * 0.5} ${y} A ${r * 0.5} ${r * 0.5} 0 0 1 ${x} ${y + r * 0.5}`} stroke="rgba(255,255,255,0.55)" strokeWidth={2.6} fill="none" strokeLinecap="round" />
        <circle cx={x - r * 0.42} cy={y - r * 0.12} r={1.8} fill="#5C666C" />
      </g>
      <circle cx={x} cy={y} r={r * 0.13} fill="#2A3135" />
    </g>
  );
};

/** The side profile (closed or open), in local coords. `inner` draws inside the open cavities (clipped). */
const Profile: React.FC<{s: CarState; uid: string; innerUp?: React.ReactNode; innerLo?: React.ReactNode; ink?: string}> = ({s, uid, innerUp, innerLo}) => {
  const squash = s.squash ?? 0;
  const parts = s.parts ?? {};
  const oLo = s.openLo ?? 0, oUp = s.openUp ?? 0;
  const thLo = (oLo * 82 * Math.PI) / 180, thUp = (oUp * 80 * Math.PI) / 180;
  const refl = s.refl ?? 0;
  const spin = s.spin ?? 0;
  const comp = s.compress ?? 0;
  const bodyT = `translate(0 ${squash})`;
  const fanSpin = s.fanSpin ?? 0;
  const valve = s.valve ?? 0;
  return (
    <g>
      <defs>
        <linearGradient id={`${uid}g`} x1="0" y1={-135} x2="0" y2={-20} gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#FFFFFF" />
          <stop offset="0.55" stopColor="#EEF2F4" />
          <stop offset="1" stopColor="#C9D2D7" />
        </linearGradient>
        <clipPath id={`${uid}body`}><path d={BODY_D} /></clipPath>
        <clipPath id={`${uid}up`}><path d={UPPER_D} /></clipPath>
        <clipPath id={`${uid}lo`}><path d={SKIRT_D} /></clipPath>
        <pattern id={`${uid}weave`} width={8} height={8} patternUnits="userSpaceOnUse">
          <rect width={8} height={8} fill="#2E3438" />
          <path d="M 0 4 L 4 0 M 4 8 L 8 4" stroke="#4A5257" strokeWidth={1.8} />
        </pattern>
      </defs>
      <g transform={bodyT}>
        {/* far-side wheels peek below the sill, darker */}
        <path d={BODY_D} fill={`url(#${uid}g)`} stroke={INK} strokeWidth={3.2} strokeLinejoin="round" />
        {/* moving reflection */}
        <g clipPath={`url(#${uid}body)`}>
          <path d={`M ${refl - 40} -150 L ${refl + 10} -150 L ${refl - 50} 0 L ${refl - 100} 0 Z`} fill="rgba(255,255,255,0.55)" />
          <path d={`M ${refl + 30} -150 L ${refl + 44} -150 L ${refl - 16} 0 L ${refl - 30} 0 Z`} fill="rgba(255,255,255,0.4)" />
        </g>
        {/* cavities (drawn under the hinged panels) */}
        {oUp > 0.001 && (
          <g clipPath={`url(#${uid}up)`}>
            <g clipPath={`url(#${uid}body)`}>
              <rect x={-240} y={-140} width={360} height={120} fill="#2B3338" />
              <path d={UPPER_D} fill="none" stroke="#151B1E" strokeWidth={8} />
              {parts.tank && (
                <g>
                  <path d={`M ${CAR3.valve.x} ${CAR3.valve.y} L ${CAR3.valve.x - 8} ${CAR3.pipeY} L ${CAR3.nozzle.x + 2} ${CAR3.pipeY}`} stroke="#9AA6AD" strokeWidth={4.5} fill="none" strokeLinejoin="round" />
                  <rect x={CAR3.tank.x0} y={CAR3.tank.y0} width={CAR3.tank.x1 - CAR3.tank.x0} height={CAR3.tank.y1 - CAR3.tank.y0} rx={14} fill={`url(#${uid}weave)`} stroke={INK} strokeWidth={2.5} />
                  <rect x={CAR3.tank.x0 + 10} y={CAR3.tank.y0 + 3} width={CAR3.tank.x1 - CAR3.tank.x0 - 20} height={5} rx={2.5} fill="rgba(255,255,255,0.16)" />
                  <path d={`M ${CAR3.tank.x0} ${CAR3.valve.y} L ${CAR3.valve.x + 6} ${CAR3.valve.y}`} stroke="#9AA6AD" strokeWidth={4.5} />
                  {/* valve body and its handle (turns a quarter when open) */}
                  <rect x={CAR3.valve.x - 10} y={CAR3.valve.y - 10} width={20} height={20} rx={4} fill={C.blue} stroke={INK} strokeWidth={2.4} />
                  {/* lever: across the pipe when shut, along it when open */}
                  <g transform={`translate(${CAR3.valve.x} ${CAR3.valve.y}) rotate(${90 - 90 * valve})`}>
                    <rect x={-15} y={-2.6} width={30} height={5.2} rx={2.6} fill={C.coral} stroke={INK} strokeWidth={1.6} />
                    <circle r={3.4} fill={INK} />
                  </g>
                </g>
              )}
              {parts.compressor && (
                <g transform={`translate(${CAR3.compressor.x} ${CAR3.compressor.y})`}>
                  <rect x={-14} y={-12} width={28} height={24} rx={4} fill="#5A646A" stroke={INK} strokeWidth={2} />
                  <g transform={`rotate(${fanSpin})`}>
                    {[0, 120, 240].map((a) => <path key={a} d="M 0 0 Q 3 -7 0 -8 Q -4 -5 0 0" fill="#C9D3D9" transform={`rotate(${a})`} />)}
                  </g>
                  <path d={`M -14 0 L ${CAR3.tank.x1 - 18 - CAR3.compressor.x} 0`} stroke="#9AA6AD" strokeWidth={3} />
                </g>
              )}
              {innerUp}
              {(s.glowTank ?? 0) > 0 && parts.tank && (
                <rect x={CAR3.tank.x0 - 6} y={CAR3.tank.y0 - 6} width={CAR3.tank.x1 - CAR3.tank.x0 + 12} height={CAR3.tank.y1 - CAR3.tank.y0 + 12} rx={18} fill="none" stroke={C.saffron} strokeWidth={4} opacity={s.glowTank} />
              )}
            </g>
          </g>
        )}
        {oLo > 0.001 && (
          <g clipPath={`url(#${uid}lo)`}>
            <rect x={-120} y={-70} width={240} height={60} fill="#262E32" />
            <path d={SKIRT_D} fill="none" stroke="#11171A" strokeWidth={6} />
            {parts.fans && (
              <g>
                {/* duct to the exhaust vent ahead of the rear wheel */}
                <path d={`M ${CAR3.fans[1]} ${CAR3.fanY - 6} L ${CAR3.vent.x} ${CAR3.fanY - 6}`} stroke="#3A4449" strokeWidth={11} />
                {CAR3.fans.map((fx) => (
                  <g key={fx} transform={`translate(${fx} ${CAR3.fanY})`}>
                    <rect x={-17} y={-12} width={34} height={22} rx={5} fill="#3A4449" stroke={INK} strokeWidth={2} />
                    <circle r={CAR3.fanR} fill="#4E595F" stroke="#1C2327" strokeWidth={1.5} />
                    <g transform={`rotate(${fanSpin})`}>
                      {[0, 90, 180, 270].map((a) => <path key={a} d="M 0 0 Q 4 -7 0 -8 Q -4 -5 0 0" fill="#C9D3D9" transform={`rotate(${a})`} />)}
                    </g>
                    <circle r={1.8} fill={INK} />
                    {/* intake slots to the gap below */}
                    <path d="M -10 10 L 10 10" stroke="#8E989E" strokeWidth={2} strokeDasharray="3 2" />
                  </g>
                ))}
                {(s.glowFans ?? 0) > 0 && CAR3.fans.map((fx) => <circle key={`g${fx}`} cx={fx} cy={CAR3.fanY} r={16} fill="none" stroke={C.saffron} strokeWidth={3.5} opacity={s.glowFans} />)}
              </g>
            )}
            {innerLo}
          </g>
        )}
        {/* the hinged panels: each a copy of the closed body, foreshortened toward its hinge as it swings out */}
        <g clipPath={`url(#${uid}up)`} transform={`translate(0 ${HINGE_UP}) scale(1 ${Math.cos(thUp)}) translate(0 ${-HINGE_UP})`}>
          <g clipPath={`url(#${uid}body)`}>
            <path d={BODY_D} fill={`url(#${uid}g)`} />
            <path d={`M ${refl - 40} -150 L ${refl + 10} -150 L ${refl - 50} 0 L ${refl - 100} 0 Z`} fill="rgba(255,255,255,0.55)" />
            {oUp > 0 && <rect x={-240} y={-140} width={360} height={140} fill="#FFFFFF" opacity={0.35 * Math.sin(thUp)} />}
          </g>
          {oUp > 0.02 && <path d={UPPER_D} fill="none" stroke={INK} strokeWidth={2.5} clipPath={`url(#${uid}body)`} />}
        </g>
        {/* sill (dark lower panel) */}
        <g transform={`translate(0 ${HINGE_LO}) scale(1 ${Math.cos(thLo)}) translate(0 ${-HINGE_LO})`}>
          <path d={SKIRT_D} fill={oLo > 0 ? `rgba(56,68,75,${1 - 0.25 * Math.sin(thLo)})` : '#38444B'} stroke={INK} strokeWidth={3.2} strokeLinejoin="round" />
        </g>
        {/* panel seams (closed) */}
        {oUp < 0.02 && <path d={`M ${-104} -98 L ${100} -98`} stroke="rgba(22,42,50,0.18)" strokeWidth={1.6} />}
        {oUp < 0.02 && <path d="M 8 -98 L 4 -46" stroke="rgba(22,42,50,0.2)" strokeWidth={1.6} />}
        <path d={GLASS_D} fill="#11181D" stroke={INK} strokeWidth={2} strokeLinejoin="round" />
        <path d="M -60 -126 Q 0 -130 50 -122" stroke="rgba(255,255,255,0.22)" strokeWidth={3} fill="none" strokeLinecap="round" />
        {/* tail light */}
        <path d={`M ${BODY[26][0] + 2} ${BODY[26][1] + 2} L ${BODY[28][0] + 1} ${BODY[28][1]}`} stroke="#E8332B" strokeWidth={4.2} strokeLinecap="round" />
        {parts.nozzle && (
          <path d={`M ${CAR3.nozzle.x + 2} ${CAR3.nozzle.y - 3} L ${CAR3.nozzle.x - 12} ${CAR3.nozzle.y - 7} L ${CAR3.nozzle.x - 12} ${CAR3.nozzle.y + 7} L ${CAR3.nozzle.x + 2} ${CAR3.nozzle.y + 3} Z`} fill="#5A646A" stroke={INK} strokeWidth={2} strokeLinejoin="round" />
        )}
        {parts.sideNozzles && CAR3.sideNozzles.map(([nx, ny], i) => (
          <g key={i}>
            <circle cx={nx} cy={ny} r={6.5} fill="#5A646A" stroke={INK} strokeWidth={2} />
            <circle cx={nx} cy={ny} r={2.8} fill="#1C2327" />
          </g>
        ))}
      </g>
      {WHEELS3.map((w, i) => <Wheel key={i} x={w.x} y={w.y} r={w.r} spin={spin * (i === 0 ? 1 : 1.07)} compress={comp} />)}
    </g>
  );
};

/**
 * The car placed in the world: contact-line midpoint at (x, y), rotated by `heading` (deg, SVG clockwise), rolled by
 * `roll` (deg about the long axis; 0 = as drawn, 180 = far side, upside down). `children` are drawn in car-local
 * coordinates (unrolled frame), `gap` under the floor, `innerUp`/`innerLo` inside the open panels.
 */
export const Car3: React.FC<CarState & {children?: React.ReactNode; gap?: React.ReactNode; innerUp?: React.ReactNode; innerLo?: React.ReactNode; over?: React.ReactNode}> = (props) => {
  const {x, y, heading = 0, roll = 0, opacity = 1, children, gap, innerUp, innerLo, over, id = 'c3'} = props;
  const r = (roll * Math.PI) / 180;
  const cr = Math.cos(r), sr = Math.sin(r);
  const yc = CAR3.cy;
  const rolled = Math.abs(sr) > 0.004;
  const side = (
    <g transform={`translate(0 ${yc}) scale(1 ${Math.sign(cr || 1) * Math.max(0.22, Math.abs(cr))}) translate(0 ${-yc})`}>
      <Profile s={props} uid={id} innerUp={rolled ? undefined : innerUp} innerLo={rolled ? undefined : innerLo} />
    </g>
  );
  // mid-roll the profile is edge-on: two curved speed lines around the long axis carry the turn
  const edge = rolled ? Math.max(0, 1 - Math.abs(cr) / 0.5) : 0;
  const plan = edge > 0 ? (
    <g opacity={edge} fill="none" strokeLinecap="round">
      <path d={`M -170 ${yc - 70} Q -40 ${yc - 92} 120 ${yc - 70}`} stroke="rgba(255,255,255,0.9)" strokeWidth={7} />
      <path d={`M -120 ${yc + 72} Q 20 ${yc + 94} 170 ${yc + 72}`} stroke="rgba(255,255,255,0.9)" strokeWidth={7} />
      <path d={`M -170 ${yc - 70} Q -40 ${yc - 92} 120 ${yc - 70}`} stroke="rgba(22,42,50,0.35)" strokeWidth={2} />
      <path d={`M -120 ${yc + 72} Q 20 ${yc + 94} 170 ${yc + 72}`} stroke="rgba(22,42,50,0.35)" strokeWidth={2} />
    </g>
  ) : null;
  return (
    <g transform={`translate(${x} ${y}) rotate(${heading})`} opacity={opacity}>
      {!rolled && gap}
      {plan}{side}
      {children}
      {over}
    </g>
  );
};
