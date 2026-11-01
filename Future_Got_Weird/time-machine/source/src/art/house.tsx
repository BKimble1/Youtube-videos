// The neighbourhood, one place seen across decades (D = 0 the day he left, D = 1 the day he returns):
// the friend's house (centre), a sapling that becomes a huge tree, the street with a car that evolves into a hover
// car, the skyline behind growing into towers, and the astronaut's family home (right) slowly going quiet (blinds
// drawn, ivy). Also the landing capsule. World units: px at zoom 1, ground line G.
import React from 'react';
import {mix} from '../core/color';
import {clamp, hash, lerp, sm} from '../lib';
import {Building, makeSkyline, Pod, skyBot, skyTop} from './city';
import {C, INK, OUT} from './crew';

const ss = (x: number, a: number, b: number) => sm((x - a) / (b - a));
export const G = 1600;
export const FRIEND_HOUSE = {x0: 470, x1: 1090, wall: 430, apex: 670, door: 960};
export const HOME = {x0: 1380, x1: 2060, wall: 720, apex: 980, door: 1640, doorW: 120, doorH: 230};
export const TREE_X = 1110;

export const Neighbourhood: React.FC<{D: number; t: number; id: string; sunArcs?: number; doorOpen?: number; doorPortal?: React.ReactNode}> = ({D, t, id, sunArcs = 0, doorOpen = 0, doorPortal}) => {
  const far = React.useMemo(() => makeSkyline(26, -900, 3000, 71, 260, 520, 1.6, ['#A9BCD0', '#B8C6D6', '#9EB1C7'], ['#B9E4EC', '#CFE9F7', '#A8D8E6']), []);
  const f = D;
  const FH = FRIEND_HOUSE;
  const wallC = mix('#F2D6A2', '#E9DCC3', ss(D, 0, 0.6));
  const g = ss(D, 0, 0.9); // tree growth
  const season = Math.sin(D * Math.PI * 2 * 9);
  const leaf = mix(mix('#6FB36A', '#E9A23B', clamp(season) * 0.65 * (D > 0.02 && D < 0.98 ? 1 : 0)), '#5DA35E', 0);
  const trunkW = lerp(10, 54, g), trunkH = lerp(110, 560, g), canopy = lerp(40, 330, g);
  const ivy = ss(D, 0.25, 1);
  return (
    <g>
      <defs>
        <linearGradient id={`${id}-sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={skyTop(f * 0.8)} />
          <stop offset="1" stopColor={skyBot(f * 0.8)} />
        </linearGradient>
      </defs>
      <rect x={-2500} y={-3200} width={7000} height={7000} fill={`url(#${id}-sky)`} />
      {/* sun trails: each pass of the sun leaves a faint arc, as in a long exposure; they pile up as years go by */}
      {sunArcs > 0 && Array.from({length: 7}, (_, k) => (
        <path key={k} d={`M -300 ${900 - k * 30} Q 900 ${-120 - k * 40} 2300 ${900 - k * 30}`} fill="none" stroke="#FFF1C4" strokeWidth={10} opacity={0.32 * clamp(sunArcs * 7 - k)} strokeLinecap="round" />
      ))}
      <g opacity={0.95}>{far.map((b, i) => <Building key={i} b={b} f={f} base={G - 210} detail={0.6} light={0} />)}</g>
      {[0, 1, 2].map((k) => {
        const x = ((k * 700 + t * (180 + 60 * k)) % 3200) - 600;
        return <g key={k} opacity={ss(f, 0.45 + 0.1 * k, 0.7 + 0.1 * k)}><Pod x={k % 2 ? 2400 - x : x} y={520 + k * 120} s={0.8} c={['#EF6B55', '#FFC744', '#1CA7A0'][k]} dir={k % 2 ? -1 : 1} /></g>;
      })}
      {/* lawns */}
      <rect x={-2500} y={G - 210} width={7000} height={220} fill={mix('#9CC77E', '#8DC08A', f)} stroke={INK} strokeWidth={OUT} />
      {/* ---- the friend's house ---- */}
      <g>
        <path d={`M ${FH.x0 - 40} ${G - FH.wall} L ${(FH.x0 + FH.x1) / 2} ${G - FH.apex} L ${FH.x1 + 40} ${G - FH.wall} Z`} fill={mix('#B5523B', '#8E5A4A', ss(D, 0, 0.8))} stroke={INK} strokeWidth={OUT} strokeLinejoin="round" />
        {/* solar tiles arrive on the roof */}
        <g opacity={ss(D, 0.45, 0.65)}>
          {[0, 1, 2].map((k) => <path key={k} d={`M ${FH.x0 + 60 + k * 70} ${G - FH.wall - 20 - k * 30} l 60 -28 l 0 22 l -60 28 Z`} fill="#2E4A7A" stroke={INK} strokeWidth={2.5} />)}
        </g>
        <rect x={FH.x0} y={G - FH.wall} width={FH.x1 - FH.x0} height={FH.wall} fill={wallC} stroke={INK} strokeWidth={OUT} />
        <rect x={FH.x1 - 140} y={G - FH.wall} width={140} height={FH.wall} fill={mix(wallC, '#7A5A50', 0.22)} />
        <rect x={FH.x0 + 70} y={G - 330} width={170} height={140} rx={6} fill={mix('#BFE0F0', '#D9F4F7', f)} stroke={INK} strokeWidth={OUT} />
        <line x1={FH.x0 + 155} y1={G - 330} x2={FH.x0 + 155} y2={G - 190} stroke={INK} strokeWidth={3} />
        <rect x={FH.door - 55} y={G - 240} width={110} height={240} rx={6} fill={mix('#3F7C6B', '#2E5F72', ss(D, 0.4, 0.7))} stroke={INK} strokeWidth={OUT} />
        <circle cx={FH.door + 30} cy={G - 120} r={6} fill={C.saffron} stroke={INK} strokeWidth={2.5} />
        {/* porch light: bulb, then a slim strip */}
        <rect x={FH.door - 90} y={G - 230} width={14} height={lerp(30, 90, ss(D, 0.5, 0.8))} rx={7} fill={mix('#FFE7A6', '#BFF4F0', ss(D, 0.5, 0.8))} stroke={INK} strokeWidth={2.5} />
      </g>
      {/* ---- the tree (grows from a sapling) ---- */}
      <g>
        <path d={`M ${TREE_X - trunkW / 2} ${G - 150} Q ${TREE_X - trunkW * 0.3} ${G - 150 - trunkH * 0.5} ${TREE_X - trunkW * 0.25} ${G - 150 - trunkH} L ${TREE_X + trunkW * 0.25} ${G - 150 - trunkH} Q ${TREE_X + trunkW * 0.3} ${G - 150 - trunkH * 0.5} ${TREE_X + trunkW / 2} ${G - 150} Z`} fill="#8A5A3B" stroke={INK} strokeWidth={OUT} strokeLinejoin="round" />
        {g > 0.3 && <path d={`M ${TREE_X} ${G - 150 - trunkH * 0.6} q ${-trunkH * 0.25} ${-trunkH * 0.15} ${-trunkH * 0.35} ${-trunkH * 0.45} M ${TREE_X} ${G - 150 - trunkH * 0.7} q ${trunkH * 0.25} ${-trunkH * 0.12} ${trunkH * 0.3} ${-trunkH * 0.4}`} fill="none" stroke={INK} strokeWidth={trunkW * 0.28 + 6} strokeLinecap="round" />}
        {g > 0.3 && <path d={`M ${TREE_X} ${G - 150 - trunkH * 0.6} q ${-trunkH * 0.25} ${-trunkH * 0.15} ${-trunkH * 0.35} ${-trunkH * 0.45} M ${TREE_X} ${G - 150 - trunkH * 0.7} q ${trunkH * 0.25} ${-trunkH * 0.12} ${trunkH * 0.3} ${-trunkH * 0.4}`} fill="none" stroke="#8A5A3B" strokeWidth={trunkW * 0.28} strokeLinecap="round" />}
        {[[0, -1, 1], [-0.62, -0.62, 0.78], [0.62, -0.66, 0.74], [-0.3, -1.35, 0.7], [0.35, -1.3, 0.72], [0, -0.35, 0.8]].map(([dx, dy, s], k) => (
          <circle key={k} cx={TREE_X + dx * canopy} cy={G - 150 - trunkH + dy * canopy * 0.55 + canopy * 0.35} r={canopy * s * 0.62} fill={mix(leaf, k % 2 ? '#3F8A55' : '#7CC070', 0.35)} stroke={INK} strokeWidth={OUT} />
        ))}
        <circle cx={TREE_X - canopy * 0.2} cy={G - 150 - trunkH - canopy * 0.1} r={canopy * 0.25} fill="#FFFFFF" opacity={0.12} />
      </g>
      {/* ---- the family home ---- */}
      <g>
        <path d={`M ${HOME.x0 - 40} ${G - HOME.wall} L ${(HOME.x0 + HOME.x1) / 2} ${G - HOME.apex} L ${HOME.x1 + 40} ${G - HOME.wall} Z`} fill="#4F5F7A" stroke={INK} strokeWidth={OUT} strokeLinejoin="round" />
        <rect x={HOME.x0} y={G - HOME.wall} width={HOME.x1 - HOME.x0} height={HOME.wall} fill={mix('#D9E3EE', '#C9CFD6', ss(D, 0.2, 1))} stroke={INK} strokeWidth={OUT} />
        {[[HOME.x0 + 70, G - 620], [HOME.x0 + 400, G - 620], [HOME.x0 + 70, G - 340]].map(([x, y], k) => (
          <g key={k}>
            <rect x={x} y={y} width={170} height={150} rx={6} fill={mix('#FFE7A6', '#4A5A70', ss(D, 0.35 + k * 0.1, 0.8 + k * 0.05))} stroke={INK} strokeWidth={OUT} />
            <rect x={x} y={y} width={170} height={150 * ss(D, 0.5 + k * 0.1, 0.9)} rx={6} fill="#C9B79A" stroke={INK} strokeWidth={2.5} opacity={0.9} />
          </g>
        ))}
        {/* ivy climbs as the house goes quiet */}
        {ivy > 0.01 && Array.from({length: 22}, (_, k) => {
          const x = HOME.x0 + 10 + hash(k * 3.3) * 180, y = G - 20 - hash(k * 7.1) * 520 * ivy;
          return <circle key={k} cx={x} cy={y} r={14 + 10 * hash(k * 1.1)} fill={k % 2 ? '#4F8A50' : '#6AA65E'} stroke={INK} strokeWidth={2.5} opacity={clamp(ivy * 3 - hash(k * 2.2) * 2)} />;
        })}
        {/* door: opens inward to a dark hall (the hall itself is drawn through the opening when given) */}
        <rect x={HOME.door - HOME.doorW / 2} y={G - HOME.doorH} width={HOME.doorW} height={HOME.doorH} fill="#1C1A24" stroke={INK} strokeWidth={OUT} />
        <clipPath id={`${id}-door`}><rect x={HOME.door - HOME.doorW / 2} y={G - HOME.doorH} width={HOME.doorW} height={HOME.doorH} /></clipPath>
        {doorPortal && doorOpen > 0.05 && <g clipPath={`url(#${id}-door)`}>{doorPortal}</g>}
        <rect x={HOME.door - HOME.doorW / 2} y={G - HOME.doorH} width={HOME.doorW * (1 - 0.85 * doorOpen)} height={HOME.doorH} fill="#7A4E3A" stroke={INK} strokeWidth={OUT} />
        <circle cx={HOME.door - HOME.doorW / 2 + HOME.doorW * (1 - 0.85 * doorOpen) - 20} cy={G - 110} r={6} fill={C.saffron} stroke={INK} strokeWidth={2.5} opacity={1 - doorOpen} />
        <rect x={HOME.door - 90} y={G - 18} width={180} height={18} fill="#8E8E96" stroke={INK} strokeWidth={3} />
      </g>
      {/* fence */}
      {Array.from({length: 13}, (_, k) => {
        const x = FH.x0 - 120 + k * 50;
        if (x > FH.door - 80 && x < FH.door + 60) return null;
        return <path key={k} d={`M ${x} ${G - 10} L ${x} ${G - 100} L ${x + 14} ${G - 116} L ${x + 28} ${G - 100} L ${x + 28} ${G - 10} Z`} fill={mix('#FFFBF0', '#DCD6C8', ss(D, 0, 1))} stroke={INK} strokeWidth={3} />;
      })}
      {/* pavement and road */}
      <rect x={-2500} y={G - 10} width={7000} height={80} fill={mix('#D9D2C3', '#E3E6EA', f)} stroke={INK} strokeWidth={OUT} />
      <rect x={-2500} y={G + 70} width={7000} height={1200} fill={mix('#6E7884', '#5E6E86', f)} stroke={INK} strokeWidth={OUT} />
      {Array.from({length: 30}, (_, k) => <rect key={k} x={-1500 + k * 180} y={G + 250} width={90} height={14} rx={7} fill={mix('#F3E6B5', '#7FE3DC', ss(f, 0.6, 0.9))} />)}
    </g>
  );
};

/** the parked car: a boxy sedan (D 0) rounds out (D 0.5) and lifts into a hover car (D 1) */
export const Car: React.FC<{D: number; x: number; t: number}> = ({D, x, t}) => {
  const u = ss(D, 0.1, 0.55), h = ss(D, 0.55, 0.95);
  const lift = 26 * h + Math.sin(t * 4) * 3 * h;
  const body = mix('#C94A36', '#1CA7A0', ss(D, 0.3, 0.8));
  const roofH = lerp(70, 58, u), len = 300, rnd = lerp(10, 40, u);
  return (
    <g transform={`translate(${x} ${G + 150 - lift})`}>
      <ellipse cx={0} cy={30 + lift} rx={150} ry={12} fill="rgba(22,42,50,0.2)" />
      {h > 0.02 && <ellipse cx={0} cy={22 + lift * 0.4} rx={110} ry={8} fill="#BFF4F0" opacity={h * 0.7} />}
      <path d={`M ${-len / 2} 10 L ${-len / 2} ${-30 + rnd * 0.3} Q ${-len / 2} -40 ${-len / 2 + rnd} -40 L ${-len * 0.3} -40 L ${-len * 0.2 + 10 * u} ${-40 - roofH} L ${len * 0.18 + 20 * u} ${-40 - roofH} L ${len * 0.32 + 20 * u} -40 L ${len / 2 - rnd} -40 Q ${len / 2} -40 ${len / 2} ${-30 + rnd * 0.3} L ${len / 2} 10 Z`} fill={body} stroke={INK} strokeWidth={OUT} strokeLinejoin="round" />
      <path d={`M ${-len * 0.26} -44 L ${-len * 0.18 + 10 * u} ${-36 - roofH} L ${len * 0.16 + 20 * u} ${-36 - roofH} L ${len * 0.27 + 20 * u} -44 Z`} fill="#D3E1F8" stroke={INK} strokeWidth={3} />
      {[-1, 1].map((s) => (
        <g key={s} transform={`translate(${s * len * 0.3} 12)`} opacity={1 - h}>
          <circle r={30 * (1 - 0.5 * h)} fill="#2B2B33" stroke={INK} strokeWidth={OUT} />
          <circle r={12 * (1 - 0.5 * h)} fill="#B9C4CC" />
        </g>
      ))}
      <rect x={len / 2 - 22} y={-30} width={16} height={12} rx={4} fill="#FFE7A6" stroke={INK} strokeWidth={2.5} />
    </g>
  );
};

/** the return capsule: a cone with a round hatch, landing legs and retro-rocket flames */
export const Capsule: React.FC<{hatch: number; flame: number; t: number; legs: number}> = ({hatch, flame, t, legs}) => {
  const fl = 1 + 0.15 * Math.sin(t * 50) + 0.1 * Math.sin(t * 83);
  return (
    <g>
      {flame > 0.01 && (
        <g opacity={flame}>
          <path d={`M -60 0 Q -40 ${120 * fl * flame} -20 0 Z M 20 0 Q 40 ${120 * fl * flame} 60 0 Z`} fill={C.saffron} />
          <path d={`M -52 0 Q -40 ${70 * fl * flame} -28 0 Z M 28 0 Q 40 ${70 * fl * flame} 52 0 Z`} fill="#FFFBF0" />
        </g>
      )}
      {[-1, 1].map((s) => (
        <path key={s} d={`M ${s * 90} -60 L ${s * (110 + 40 * legs)} ${-10 + 10 * legs} L ${s * (130 + 40 * legs)} ${-6 + 10 * legs}`} fill="none" stroke={INK} strokeWidth={12} strokeLinecap="round" strokeLinejoin="round" />
      ))}
      <path d="M -150 -40 L -100 -330 Q 0 -380 100 -330 L 150 -40 Q 0 -10 -150 -40 Z" fill="#F4F6F8" stroke={INK} strokeWidth={OUT} strokeLinejoin="round" />
      <path d="M 60 -350 Q 110 -300 150 -40 Q 120 -30 90 -28 Q 90 -200 40 -356 Z" fill="#C9D3DC" opacity={0.8} />
      <path d="M -150 -40 Q 0 -10 150 -40 L 150 -10 Q 0 22 -150 -10 Z" fill="#3F5560" stroke={INK} strokeWidth={OUT} strokeLinejoin="round" />
      <path d="M -132 -110 Q 0 -80 132 -110 L 136 -90 Q 0 -60 -136 -90 Z" fill={C.saffron} stroke={INK} strokeWidth={3} />
      {/* hatch: swings open (to the left) to show the dark interior */}
      <ellipse cx={-10} cy={-210} rx={64} ry={76} fill="#1C1A24" stroke={INK} strokeWidth={OUT} />
      <g transform={`translate(-74 -210) scale(${1 - 0.92 * hatch} 1) translate(74 210)`}>
        <ellipse cx={-10} cy={-210} rx={64} ry={76} fill="#DCE3EA" stroke={INK} strokeWidth={OUT} />
        <circle cx={-10} cy={-210} r={30} fill="#13213A" stroke={INK} strokeWidth={3} />
        <path d="M -30 -222 A 22 22 0 0 1 -14 -236" fill="none" stroke="#FFF" strokeWidth={3} opacity={0.6} strokeLinecap="round" />
      </g>
      {/* scorch: the heat shield glows faintly after re-entry */}
      <path d="M -150 -10 Q 0 22 150 -10" fill="none" stroke="#EF6B55" strokeWidth={5} opacity={0.6 * flame + 0.2} />
    </g>
  );
};

/** dust puffs on landing (p 0 -> 1) */
export const Dust: React.FC<{p: number; x: number}> = ({p, x}) => {
  if (p <= 0 || p >= 1) return null;
  return (
    <g opacity={1 - p}>
      {Array.from({length: 9}, (_, k) => {
        const s = k % 2 ? 1 : -1;
        const d = (60 + 260 * p) * (0.5 + hash(k * 3.1));
        return <circle key={k} cx={x + s * d} cy={G + 60 - 40 * p * hash(k * 1.7)} r={30 + 70 * p * (0.5 + hash(k * 2.9))} fill="#E8E2D2" stroke={INK} strokeWidth={3} opacity={0.85} />;
      })}
    </g>
  );
};
