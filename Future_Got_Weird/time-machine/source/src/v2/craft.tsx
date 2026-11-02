// V2: ONE capsule for the whole story. It sweeps around the black hole (2.05-4.70 s), the camera follows it into its
// cockpit window, and later the same capsule descends on retro jets, lands in the street and opens its hatch.
// Weird Crew finish: flat fills, one ink outline per part, one cel shadow (key light upper-left), no text.
import React from 'react';
import {mix} from '../core/color';
import {clamp, hash, lerp} from '../lib';
import {C, INK, OUT} from '../art/crew';

const rad = (d: number) => (d * Math.PI) / 180;
const HULL = '#F4F6F8', HULL_SH = '#C9D3DC', HULL_DEEP = '#AEBBC6', SHIELD = '#3F5560', SHIELD_SH = '#2B3D48', STEEL = '#B9C4CC';
/** geometry, local units: base centre at (0, 0), nose up (-y) */
export const CAPSULE2 = {
  height: 600, baseHalf: 232, topHalf: 78,
  win: {x: 0, y: -468, r: 52},
  hatch: {x: 38, y: -206, rx: 92, ry: 168},
  sill: -38,
};
const halfAt = (y: number) => lerp(CAPSULE2.baseHalf, CAPSULE2.topHalf, clamp(-y / 540));

export const Capsule2: React.FC<{t: number; id: string; flame?: number; retro?: number; hatch?: number; legs?: number; win?: React.ReactNode; bank?: number; glow?: number}> = ({t, id, flame = 0, retro = 0, hatch = 0, legs = 0, win, bank = 0, glow = 0}) => {
  const b = clamp(bank, -1, 1);
  const sq = 1 - 0.1 * Math.abs(b); // a 2.5D turn: slight squash, details slide toward the turning side
  const off = b * 46;
  const fl = 1 + 0.14 * Math.sin(t * 47) + 0.09 * Math.sin(t * 83 + 1.3);
  const W = CAPSULE2;
  const hull = `M ${-W.baseHalf} -30 L ${-W.topHalf} -540 Q ${-W.topHalf + 8} -592 0 -600 Q ${W.topHalf - 8} -592 ${W.topHalf} -540 L ${W.baseHalf} -30 Q 0 -6 ${-W.baseHalf} -30 Z`;
  const bandY0 = -150, bandY1 = -118;
  const H = W.hatch;
  return (
    <g transform={`scale(${sq} 1)`}>
      {/* main engine flame (flight) */}
      {flame > 0.01 && (
        <g opacity={flame}>
          <path d={`M -96 2 Q 0 ${300 * fl * flame} 96 2 Z`} fill={C.saffron} />
          <path d={`M -58 2 Q 0 ${190 * fl * flame} 58 2 Z`} fill="#FFF3D6" />
        </g>
      )}
      {/* retro jets (landing): angled down and out from the base corners */}
      {retro > 0.01 && [-1, 1].map((s) => (
        <g key={s} opacity={retro} transform={`translate(${s * 190} -4) rotate(${s * -24})`}>
          <path d={`M -34 0 Q 0 ${220 * fl * retro} 34 0 Z`} fill={C.saffron} />
          <path d={`M -18 0 Q 0 ${130 * fl * retro} 18 0 Z`} fill="#FFF3D6" />
        </g>
      ))}
      {/* landing legs */}
      {[-1, 1].map((s) => {
        const kx = s * (W.baseHalf - 30 + 70 * legs), ky = -40 + 30 * legs;
        const fx = s * (W.baseHalf + 10 + 90 * legs), fy = -30 + 34 * legs;
        return (
          <g key={s} opacity={clamp(legs * 4)}>
            <path d={`M ${s * (W.baseHalf - 70)} -70 L ${kx} ${ky} L ${fx} ${fy}`} fill="none" stroke={INK} strokeWidth={22} strokeLinecap="round" strokeLinejoin="round" />
            <path d={`M ${s * (W.baseHalf - 70)} -70 L ${kx} ${ky} L ${fx} ${fy}`} fill="none" stroke={STEEL} strokeWidth={12} strokeLinecap="round" strokeLinejoin="round" />
            <ellipse cx={fx} cy={fy + 4} rx={30} ry={9} fill={STEEL} stroke={INK} strokeWidth={OUT} />
          </g>
        );
      })}
      {/* heat shield */}
      <path d={`M ${-W.baseHalf - 6} -40 Q 0 -10 ${W.baseHalf + 6} -40 L ${W.baseHalf - 6} 4 Q 0 26 ${-W.baseHalf + 6} 4 Z`} fill={SHIELD} stroke={INK} strokeWidth={OUT} strokeLinejoin="round" />
      <path d={`M ${-W.baseHalf + 30} -6 Q 0 14 ${W.baseHalf - 30} -6`} fill="none" stroke={mix('#EF6B55', SHIELD, 1 - glow)} strokeWidth={6} opacity={0.4 + 0.6 * glow} />
      {/* hull */}
      <path d={hull} fill={HULL} stroke={INK} strokeWidth={OUT} strokeLinejoin="round" />
      <clipPath id={`${id}-hull`}><path d={hull} /></clipPath>
      <g clipPath={`url(#${id}-hull)`}>
        {/* cel shadow on the right (key light upper-left); it slides with the bank */}
        <path d={`M ${70 + off} -620 Q ${160 + off} -300 ${180 + off} 0 L 400 0 L 400 -620 Z`} fill={HULL_SH} opacity={0.85} />
        {/* panel seams */}
        {[-300, -420].map((y) => <path key={y} d={`M ${-halfAt(y) - 10} ${y} Q ${off * 0.3} ${y + 12} ${halfAt(y) + 10} ${y}`} fill="none" stroke={INK} strokeWidth={2.5} opacity={0.35} />)}
        <path d={`M ${off * 0.5} -600 L ${off * 0.8} -40`} fill="none" stroke={INK} strokeWidth={2.2} opacity={0.18} />
        {/* saffron band (his suit's stripes) */}
        <path d={`M -300 ${bandY0} Q ${off * 0.4} ${bandY0 + 16} 300 ${bandY0} L 300 ${bandY1} Q ${off * 0.4} ${bandY1 + 16} -300 ${bandY1} Z`} fill={C.saffron} />
        <path d={`M -300 ${bandY1} Q ${off * 0.4} ${bandY1 + 16} 300 ${bandY1} L 300 ${bandY1 + 8} Q ${off * 0.4} ${bandY1 + 24} -300 ${bandY1 + 8} Z`} fill={C.saffronDeep} opacity={0.8} />
        {/* small RCS blocks near the nose */}
        {[-1, 1].map((s) => <rect key={s} x={s * 60 - 14 + off * 0.6} y={-528} width={28} height={22} rx={5} fill={HULL_DEEP} stroke={INK} strokeWidth={2.5} />)}
      </g>
      {/* side hatch (opens to a dark interior) */}
      <g transform={`translate(${off * 0.7} 0)`}>
        <ellipse cx={H.x} cy={H.y} rx={H.rx} ry={H.ry} fill="#1A1C26" stroke={INK} strokeWidth={OUT} />
        <ellipse cx={H.x} cy={H.y - H.ry * 0.25} rx={H.rx * 0.7} ry={H.ry * 0.5} fill="#262A38" opacity={clamp(hatch * 2)} />
        <g transform={`translate(${H.x - H.rx} 0) scale(${1 - 0.9 * hatch} 1) translate(${-(H.x - H.rx)} 0)`}>
          <ellipse cx={H.x} cy={H.y} rx={H.rx} ry={H.ry} fill={HULL_DEEP} stroke={INK} strokeWidth={OUT} />
          <ellipse cx={H.x} cy={H.y} rx={H.rx - 16} ry={H.ry - 16} fill="none" stroke={INK} strokeWidth={2.5} opacity={0.45} />
          <rect x={H.x + H.rx - 34} y={H.y - 14} width={14} height={28} rx={5} fill={SHIELD} stroke={INK} strokeWidth={2.5} opacity={1 - hatch} />
        </g>
      </g>
      {/* cockpit window: rim, glass clip (portal), glint */}
      <g transform={`translate(${off} 0)`}>
        <circle cx={W.win.x} cy={W.win.y} r={W.win.r + 18} fill={STEEL} stroke={INK} strokeWidth={OUT} />
        {Array.from({length: 8}, (_, k) => {
          const a = (k / 8) * Math.PI * 2;
          return <circle key={k} cx={W.win.x + Math.cos(a) * (W.win.r + 9)} cy={W.win.y + Math.sin(a) * (W.win.r + 9)} r={3.2} fill={HULL_DEEP} stroke={INK} strokeWidth={1.4} />;
        })}
        <circle cx={W.win.x} cy={W.win.y} r={W.win.r} fill="#13213A" stroke={INK} strokeWidth={3} />
        <clipPath id={`${id}-win`}><circle cx={W.win.x} cy={W.win.y} r={W.win.r} /></clipPath>
        {win && <g clipPath={`url(#${id}-win)`}>{win}</g>}
        <path d={`M ${W.win.x - 34} ${W.win.y - 14} A 38 38 0 0 1 ${W.win.x - 10} ${W.win.y - 38}`} fill="none" stroke="#FFFFFF" strokeWidth={6} strokeLinecap="round" opacity={0.6} />
      </g>
      {/* warm rim light from the disk (flight only) */}
      {glow > 0.01 && <path d={`M ${-W.baseHalf + 4} -40 L ${-W.topHalf + 4} -540`} fill="none" stroke="#FF9A55" strokeWidth={6} opacity={0.8 * glow} />}
    </g>
  );
};

/** the pass around the hole (space units M; hole at origin; the lensed disk reaches x +-17.5, y -9..+9 around the
 *  shadow): an arc centred on the hole, radius 26 M, from the left (175 deg) over the top (270) to the right (365),
 *  >= 8 M from any disk pixel. ang = heading (deg, screen), nose leads; scale = capsule height in M. */
export const FLIGHT = {cx: 0, cy: 0.5, r: 26, th0: 175, th1: 365, scale: 6.6};
export const flightPath = (u: number) => {
  const th = rad(lerp(FLIGHT.th0, FLIGHT.th1, u));
  const x = FLIGHT.cx + FLIGHT.r * Math.cos(th), y = FLIGHT.cy + FLIGHT.r * Math.sin(th);
  const heading = (th * 180) / Math.PI + 90; // tangent, increasing theta (clockwise on screen)
  return {x, y, ang: heading, scale: FLIGHT.scale};
};
/** rotation to apply to Capsule2 so its nose points along a heading (deg) */
export const noseRot = (heading: number) => heading + 90;

/** exhaust trail of the path already flown (u0..u), tapering and fading toward its tail. px = screen px per M. */
export const Trail: React.FC<{u: number; id: string; px: number; u0?: number}> = ({u, id, px, u0 = 0}) => {
  const n = 40;
  const a = Math.max(u0, u - 0.55);
  if (u <= a + 0.005) return null;
  const segs = [];
  for (let k = 0; k < n; k++) {
    const p0 = flightPath(a + ((u - a) * k) / n), p1 = flightPath(a + ((u - a) * (k + 1)) / n);
    const w = k / n; // 0 at the tail, 1 at the capsule
    segs.push(<line key={k} x1={p0.x} y1={p0.y} x2={p1.x} y2={p1.y} stroke="#BFF4F0" strokeWidth={(2 + 9 * w) / px} strokeLinecap="round" opacity={0.08 + 0.5 * w * w} />);
  }
  void id;
  void hash;
  return <g>{segs}</g>;
};
