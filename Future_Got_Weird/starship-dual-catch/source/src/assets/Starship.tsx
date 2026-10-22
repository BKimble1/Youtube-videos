import React, {useId} from 'react';
import {C} from '../theme';
import {Flame} from './Flame';

// Starship V3 upper stage, hero 3/4 view: heat-shield (windward) side on the LEFT.
// Local units are 0.1 m; origin = centre of the aft skirt bottom; the nose is at y = -520 (about 52 m).
// Every shot uses this one drawing so proportions, flap positions and engines never change.
// Catch points are deliberately generic: SpaceX has not published the ship-side catch interface.
export const SHIP_H = 520;
export const SHIP_R = 45;
const NOSE_Y = -330;

export type ShipProps = {
  fwd?: number; // forward flap deflection, degrees (+ = tip swings toward nose)
  aft?: number; // aft flap deflection, degrees
  burn?: number; // 0..1 engine throttle (sea-level engines)
  t?: number; // frame, for flicker
  catchPoints?: boolean; // show the conceptual catch points
  tileEdge?: number; // x of the tile boundary (view angle); default 3/4 view
  plasma?: number; // 0..1 reentry glow on the windward (left) side
  engines?: boolean; // false = engines not installed (ground tests)
};

const nosePath = `M -45 ${NOSE_Y} C -45 -430, -24 -503, -4 -518 Q 0 -521 4 -518 C 24 -503, 45 -430, 45 ${NOSE_Y}`;

export const Starship: React.FC<ShipProps> = ({fwd = 0, aft = 0, burn = 0, t = 0, catchPoints = false, tileEdge = -4, plasma = 0, engines = true}) => {
  const id = useId().replace(/:/g, '');
  const outline = `${nosePath} L 45 0 L -45 0 Z`;
  const te = tileEdge;
  const tiles = `M -60 6 L ${te} 6 L ${te} ${NOSE_Y} C ${te} -430, ${te * 0.5} -503, 0 -520 L -60 -540 Z`;
  const flapF = 'M 0 -38 L 0 38 L -26 22 L -28 -26 Z'; // drawn about its hinge midpoint
  const flapA = 'M 0 -55 L 0 55 L -40 36 L -42 -44 Z';
  const flap = (d: string, x: number, y: number, ang: number, mirror: boolean, k = 1) => (
    <g transform={`translate(${x} ${y}) scale(${mirror ? -k : 1} 1) rotate(${ang})`}>
      <path d={d} fill={C.tile1} stroke={C.steel0} strokeWidth={1.4} strokeLinejoin="round" />
      <path d={d} fill={`url(#fsh${id})`} />
      <rect x={-5} y={d === flapF ? -40 : -57} width={7} height={d === flapF ? 80 : 114} rx={3} fill={C.steel1} />
    </g>
  );
  return (
    <g>
      <defs>
        <clipPath id={`cl${id}`}>
          <path d={outline} />
        </clipPath>
        <linearGradient id={`st${id}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor={C.steel0} />
          <stop offset="0.35" stopColor={C.steel1} />
          <stop offset="0.72" stopColor={C.steel3} />
          <stop offset="0.86" stopColor={C.steel2} />
          <stop offset="1" stopColor={C.steel0} />
        </linearGradient>
        <linearGradient id={`sh${id}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#000" stopOpacity={0.5} />
          <stop offset="0.3" stopColor="#000" stopOpacity={0} />
          <stop offset="0.75" stopColor="#fff" stopOpacity={0.1} />
          <stop offset="1" stopColor="#000" stopOpacity={0.35} />
        </linearGradient>
        <linearGradient id={`fsh${id}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#fff" stopOpacity={0.12} />
          <stop offset="1" stopColor="#000" stopOpacity={0.25} />
        </linearGradient>
        <pattern id={`hx${id}`} width={6} height={10.4} patternUnits="userSpaceOnUse">
          <path d="M 0 0 L 3 1.7 L 3 5.2 L 0 6.9 M 3 5.2 L 6 6.9 M 3 1.7 L 6 0 M 0 6.9 L 0 10.4 M 6 6.9 L 6 10.4" stroke={C.tileLine} strokeWidth={0.45} fill="none" />
        </pattern>
        <linearGradient id={`en${id}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#2a2d33" />
          <stop offset="0.5" stopColor="#6d727b" />
          <stop offset="1" stopColor="#24272c" />
        </linearGradient>
        <radialGradient id={`pl${id}`} cx="0" cy="0.5" r="1">
          <stop offset="0" stopColor={C.plasma0} stopOpacity={0.95} />
          <stop offset="0.35" stopColor={C.plasma1} stopOpacity={0.6} />
          <stop offset="1" stopColor={C.plasma2} stopOpacity={0} />
        </radialGradient>
      </defs>
      {/* engine plumes (behind the skirt) */}
      {burn > 0 && (
        <g>
          <g transform="translate(0 14)"><Flame len={200 * burn} w={15} t={t} seed={1} /></g>
          <g transform="translate(-13 12)"><Flame len={170 * burn} w={13} t={t} seed={2} opacity={0.85} /></g>
          <g transform="translate(13 12)"><Flame len={170 * burn} w={13} t={t} seed={3} opacity={0.85} /></g>
        </g>
      )}
      {/* engines: three Raptor Vacuum bells (outer, large) and three sea-level Raptors (centre); two RVac + centre SL visible */}
      {engines && (
        <g>
          <path d="M -36 -2 L -12 -2 L -9 20 L -39 20 Z" fill={`url(#en${id})`} stroke="#15171b" strokeWidth={1} />
          <path d="M 12 -2 L 36 -2 L 39 20 L 9 20 Z" fill={`url(#en${id})`} stroke="#15171b" strokeWidth={1} />
          <path d="M -7 -2 L 7 -2 L 9 14 L -9 14 Z" fill={`url(#en${id})`} stroke="#15171b" strokeWidth={1} />
        </g>
      )}
      {/* aft flaps (behind body edge) */}
      {flap(flapA, -44, -78, -aft, false)}
      {flap(flapA, 44, -78, -aft, true, 0.72)}
      {/* forward flaps: smaller, near the base of the nose */}
      {flap(flapF, -42, -392, -fwd, false)}
      {flap(flapF, 42, -392, -fwd, true, 0.72)}
      {/* body */}
      <path d={outline} fill={`url(#st${id})`} />
      <g clipPath={`url(#cl${id})`}>
        {Array.from({length: 18}, (_, i) => (
          <line key={i} x1={te} x2={50} y1={-18 - i * 18} y2={-18 - i * 18} stroke="#000" strokeOpacity={0.1} strokeWidth={0.8} />
        ))}
        <path d={tiles} fill={C.tile0} />
        <path d={tiles} fill={`url(#hx${id})`} />
        <line x1={te} y1={6} x2={te} y2={NOSE_Y} stroke={C.steel1} strokeOpacity={0.5} strokeWidth={0.8} />
        <rect x={-50} y={-12} width={100} height={12} fill="#000" opacity={0.25} />
        <path d={outline} fill={`url(#sh${id})`} />
      </g>
      <path d={outline} fill="none" stroke="#2b2f36" strokeWidth={1.2} />
      {catchPoints && (
        // near-side catch point (a matching one sits on the far side, hidden); conceptual placement
        <g>
          <path d="M -12 -360 L 6 -360 L 9 -348 L -15 -348 Z" fill={C.accent} stroke="#5a3a00" strokeWidth={1} />
          <rect x={-15} y={-349} width={24} height={3} fill="#5a3a00" opacity={0.6} />
        </g>
      )}
      {plasma > 0 && (
        <g opacity={plasma} style={{mixBlendMode: 'screen'}}>
          <ellipse cx={-50} cy={-250} rx={34} ry={300} fill={`url(#pl${id})`} />
          <path d={`M -48 -520 C -80 -400, -82 -100, -50 40`} stroke={C.plasma0} strokeWidth={4} fill="none" opacity={0.8} />
        </g>
      )}
    </g>
  );
};
