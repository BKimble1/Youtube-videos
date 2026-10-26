// V2: the laser system as a detailed 2D illustration in the Crew finish (ink contours, gradient fills, one cool storm
// key plus the discharge's light). Drawn in local units: ground at y = 0, the enclosure to the left, the launch
// telescope on its fork mount to the right, aimed `ang` degrees from vertical (positive = toward screen-right).
// `exitOf` gives the exit window's local position so a 3D background can be lined up with it.
// Real system (for proportion only): a weatherproof enclosure several metres long holding the laser, a relay to a
// large beam-expanding telescope that sends the infrared beam up past the tower. Nothing here is a weapon.
import React from 'react';
import {mix} from '../dc/color';
import {clamp, fmt, hash, V} from '../dc/math';

const INK = '#0B151C';
export const PIVOT: V = {x: 160, y: -250};
export const TUBE = {back: 150, front: 240, r: 54};
const dirOf = (ang: number): V => ({x: Math.sin((ang * Math.PI) / 180), y: -Math.cos((ang * Math.PI) / 180)});
export const exitOf = (ang: number): V => {
  const d = dirOf(ang);
  return {x: PIVOT.x + d.x * (TUBE.front + 26), y: PIVOT.y + d.y * (TUBE.front + 26)};
};

type Props = {id: string; ang: number; flash: number; fire: number; t: number; rain?: number; detail?: 'full' | 'telescope'};

export const LaserArt: React.FC<Props> = ({id, ang, flash, fire, t, rain = 1, detail = 'full'}) => {
  const d = dirOf(ang);
  const n = {x: -d.y, y: d.x}; // across the tube (to its right)
  const at = (u: number, v: number): V => ({x: PIVOT.x + d.x * u + n.x * v, y: PIVOT.y + d.y * u + n.y * v});
  const P = (p: V) => `${fmt(p.x)},${fmt(p.y)}`;
  const quad = (a: V, b: V, c: V, e: V) => `M${P(a)} L${P(b)} L${P(c)} L${P(e)} Z`;
  const white = mix('#CDD5DA', '#F0F2FF', flash * 0.5), whiteD = mix('#7C8992', '#B4BCE4', flash * 0.5);
  const steel = mix('#4E5C66', '#9AA4D0', flash * 0.4), steelL = mix('#7A8892', '#C4CBF2', flash * 0.5);
  const dark = '#18232B';
  const R = TUBE.r;
  // the tube body: back cap .. dew shield
  const body = quad(at(-TUBE.back, -R), at(TUBE.front - 40, -R), at(TUBE.front - 40, R), at(-TUBE.back, R));
  const shield = quad(at(TUBE.front - 46, -R - 7), at(TUBE.front + 26, -R - 9), at(TUBE.front + 26, R + 9), at(TUBE.front - 46, R + 7));
  const ex = at(TUBE.front + 26, 0);
  const ellA = (Math.atan2(n.y, n.x) * 180) / Math.PI;
  // rain beads on the upper side of the tube and the shield rim (they catch the light when it fires)
  const beads = Array.from({length: 16}, (_, i) => {
    const u = -TUBE.back + 20 + ((TUBE.front + 10) * hash(i, 11));
    const v = -R + 4 + 10 * hash(i, 13);
    const slide = ((t * (0.25 + 0.4 * hash(i, 15)) + hash(i, 17)) % 1) * 30;
    return {p: at(u - slide * 0.2, v + slide * 0.06), r: 2.5 + 3 * hash(i, 19)};
  });
  const glow = clamp(fire);
  return (
    <g>
      <defs>
        <linearGradient id={`${id}-tb`} gradientUnits="userSpaceOnUse" x1={fmt(at(0, -R).x)} y1={fmt(at(0, -R).y)} x2={fmt(at(0, R).x)} y2={fmt(at(0, R).y)}>
          <stop offset="0" stopColor={mix(white, '#FFFFFF', 0.25)} />
          <stop offset="0.35" stopColor={white} />
          <stop offset="0.8" stopColor={whiteD} />
          <stop offset="1" stopColor={mix(whiteD, '#E6EAFF', flash * 0.7)} />
        </linearGradient>
        <linearGradient id={`${id}-en`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={mix(white, '#FFFFFF', 0.1)} />
          <stop offset="1" stopColor={whiteD} />
        </linearGradient>
        <radialGradient id={`${id}-ex`}>
          <stop offset="0" stopColor="#FAF6FF" stopOpacity={0.95 * glow} />
          <stop offset="0.35" stopColor="#C2ADFF" stopOpacity={0.55 * glow} />
          <stop offset="1" stopColor="#8C6CFF" stopOpacity={0} />
        </radialGradient>
      </defs>
      {detail === 'full' && (
        <g>
          {/* concrete pad and drain */}
          <path d="M-600,0 L420,0 L440,26 L-620,26 Z" fill={mix('#56636B', '#98A2C8', flash * 0.4)} stroke={INK} strokeWidth={3} />
          <path d="M-600,26 L440,26" stroke={INK} strokeOpacity={0.4} strokeWidth={2} />
          {/* enclosure: insulated panels on a steel skid */}
          <rect x={-560} y={-14} width={500} height={14} fill={steel} stroke={INK} strokeWidth={2.5} />
          {[-540, -420, -300, -180, -80].map((x) => <rect key={x} x={x} y={-12} width={18} height={12} fill={dark} />)}
          <path d="M-552,-14 L-552,-250 Q-552,-262 -540,-262 L-80,-262 Q-68,-262 -68,-250 L-68,-14 Z" fill={`url(#${id}-en)`} stroke={INK} strokeWidth={3.5} strokeLinejoin="round" />
          {Array.from({length: 9}, (_, i) => <line key={i} x1={-552 + 54 * (i + 1)} y1={-258} x2={-552 + 54 * (i + 1)} y2={-18} stroke={INK} strokeOpacity={0.22} strokeWidth={2} />)}
          {/* roof overhang with a gutter, water dripping off its edge */}
          <path d="M-572,-262 L-48,-262 L-56,-282 L-564,-282 Z" fill={mix('#8E9AA2', '#D6DAFF', flash * 0.5)} stroke={INK} strokeWidth={3} strokeLinejoin="round" />
          <rect x={-576} y={-266} width={532} height={7} fill={steel} stroke={INK} strokeWidth={2} />
          {rain > 0 && Array.from({length: 8}, (_, i) => {
            const x = -560 + 66 * i + 20 * hash(i, 31);
            const y = -258 + (((t * 1.6 + hash(i, 33)) % 1) * 240);
            return <ellipse key={i} cx={fmt(x)} cy={fmt(y)} rx={2.4} ry={5} fill="#BFD0E0" opacity={0.6 * rain} />;
          })}
          {/* access door with a small window and a handle */}
          <rect x={-520} y={-218} width={96} height={202} rx={4} fill={mix(white, '#B8C0C6', 0.25)} stroke={INK} strokeWidth={3} />
          <rect x={-504} y={-200} width={64} height={46} rx={4} fill="#22303A" stroke={INK} strokeWidth={2.5} />
          <path d="M-504,-200 L-468,-200 L-494,-154 L-504,-154 Z" fill="#FFFFFF" opacity={0.12 + 0.3 * flash} />
          <rect x={-438} y={-128} width={8} height={30} rx={3} fill={steel} stroke={INK} strokeWidth={2} />
          {/* cooling unit: a grille over a fan, louvres */}
          <rect x={-392} y={-206} width={150} height={150} rx={8} fill={mix('#9AA6AE', '#D8DCFF', flash * 0.4)} stroke={INK} strokeWidth={3} />
          <circle cx={-317} cy={-131} r={58} fill={dark} stroke={INK} strokeWidth={2.5} />
          {[0, 1, 2].map((k) => {
            const a = (k * 120 + t * 900) * (Math.PI / 180);
            return <path key={k} d={`M-317,-131 L${fmt(-317 + Math.cos(a) * 52)},${fmt(-131 + Math.sin(a) * 52)} L${fmt(-317 + Math.cos(a + 0.5) * 50)},${fmt(-131 + Math.sin(a + 0.5) * 50)} Z`} fill="#3A4852" />;
          })}
          {Array.from({length: 9}, (_, i) => <line key={i} x1={-386} y1={-196 + 16 * i + 4} x2={-248} y2={-196 + 16 * i + 4} stroke={mix('#6E7A82', '#AEB6E0', flash * 0.4)} strokeWidth={4} />)}
          {/* status lights and a hazard band (no text) */}
          <rect x={-212} y={-232} width={34} height={92} rx={6} fill={dark} stroke={INK} strokeWidth={2.5} />
          {[{c: '#5BF08A', on: 1}, {c: '#F0B85B', on: glow}, {c: '#FF5A4E', on: glow * (Math.sin(t * 18) > 0 ? 1 : 0.3)}].map((l, i) => (
            <g key={i}>
              <circle cx={-195} cy={-214 + 28 * i} r={10} fill={l.on > 0.4 ? l.c : mix(l.c, '#1A2228', 0.7)} stroke={INK} strokeWidth={2} />
              {l.on > 0.4 && <circle cx={-195} cy={-214 + 28 * i} r={22} fill={l.c} opacity={0.25 * l.on} />}
            </g>
          ))}
          <rect x={-552} y={-42} width={484} height={14} fill="#E2B33C" />
          {Array.from({length: 26}, (_, i) => <path key={i} d={`M${-548 + i * 19},-28 l10,-14 l8,0 l-10,14 Z`} fill="#1E252B" />)}
          {/* the relay: a boxed beam duct from the enclosure up to the mount */}
          <path d="M-68,-168 L70,-168 L104,-214 L104,-188 L80,-140 L-68,-140 Z" fill={whiteD} stroke={INK} strokeWidth={3} strokeLinejoin="round" />
          <rect x={-60} y={-160} width={12} height={12} fill={dark} />
          {/* cables: power and fibre conduit across the pad toward the shelter */}
          <path d="M-120,-10 Q20,34 200,22 Q330,14 440,40" fill="none" stroke="#0E1418" strokeWidth={14} strokeLinecap="round" />
          <path d="M-90,-6 Q40,26 210,14 Q330,6 440,26" fill="none" stroke="#24323A" strokeWidth={8} strokeLinecap="round" />
        </g>
      )}
      {/* the mount: a heavy pedestal with bolts and a fork holding the tube at its pivot */}
      <path d={`M60,0 L74,-150 L246,-150 L260,0 Z`} fill={steel} stroke={INK} strokeWidth={3.5} strokeLinejoin="round" />
      {[84, 128, 172, 216].map((x) => <circle key={x} cx={x} cy={-14} r={6} fill={steelL} stroke={INK} strokeWidth={2} />)}
      <rect x={66} y={-168} width={188} height={24} rx={6} fill={steelL} stroke={INK} strokeWidth={3} />
      <path d={`M90,-160 L${fmt(at(0, -R - 26).x)},${fmt(at(0, -R - 26).y)} L${fmt(at(0, -R - 6).x)},${fmt(at(0, -R - 6).y)} L118,-160 Z`} fill={steel} stroke={INK} strokeWidth={3} strokeLinejoin="round" />
      {/* the tube */}
      <path d={body} fill={`url(#${id}-tb)`} stroke={INK} strokeWidth={4} strokeLinejoin="round" />
      {[-110, -30, 120].map((u) => <path key={u} d={quad(at(u, -R - 1), at(u + 16, -R - 1), at(u + 16, R + 1), at(u, R + 1))} fill="#334049" />)}
      <path d={quad(at(-TUBE.back - 14, -R + 8), at(-TUBE.back, -R + 8), at(-TUBE.back, R - 8), at(-TUBE.back - 14, R - 8))} fill={steel} stroke={INK} strokeWidth={3} />
      <path d={shield} fill={mix('#5E6C75', '#B3BBE6', flash * 0.5)} stroke={INK} strokeWidth={4} strokeLinejoin="round" />
      {/* the fork's near arm over the tube, and the pivot hub */}
      <path d={`M210,-160 L${fmt(at(0, R + 26).x)},${fmt(at(0, R + 26).y)} L${fmt(at(0, R + 6).x)},${fmt(at(0, R + 6).y)} L182,-160 Z`} fill={mix(steel, steelL, 0.4)} stroke={INK} strokeWidth={3} strokeLinejoin="round" />
      <circle cx={fmt(at(0, R + 16).x)} cy={fmt(at(0, R + 16).y)} r={16} fill={steelL} stroke={INK} strokeWidth={3} />
      <circle cx={fmt(at(0, R + 16).x)} cy={fmt(at(0, R + 16).y)} r={6} fill={dark} />
      {/* rain beads catching the light */}
      {rain > 0 && beads.map((b, i) => (
        <g key={i} opacity={0.85 * rain}>
          <circle cx={fmt(b.p.x)} cy={fmt(b.p.y)} r={fmt(b.r)} fill="#D6E2EE" opacity={0.55} />
          <circle cx={fmt(b.p.x - b.r * 0.3)} cy={fmt(b.p.y - b.r * 0.3)} r={fmt(b.r * 0.35)} fill="#FFFFFF" opacity={0.6 + 0.4 * glow} />
        </g>
      ))}
      {/* the exit window: dark glass, its rim, and the beam's glow when it fires */}
      <ellipse cx={fmt(ex.x)} cy={fmt(ex.y)} rx={R + 8} ry={15} transform={`rotate(${fmt(ellA)} ${fmt(ex.x)} ${fmt(ex.y)})`} fill="#18213C" stroke={INK} strokeWidth={4} />
      <ellipse cx={fmt(ex.x)} cy={fmt(ex.y)} rx={R - 6} ry={10} transform={`rotate(${fmt(ellA)} ${fmt(ex.x)} ${fmt(ex.y)})`} fill={mix('#33446E', '#B8A8FF', glow * 0.6)} />
      <ellipse cx={fmt(ex.x - n.x * 14)} cy={fmt(ex.y - n.y * 14)} rx={14} ry={4} transform={`rotate(${fmt(ellA)} ${fmt(ex.x - n.x * 14)} ${fmt(ex.y - n.y * 14)})`} fill="#FFFFFF" opacity={0.45} />
      {glow > 0.02 && <circle cx={fmt(ex.x)} cy={fmt(ex.y)} r={120} fill={`url(#${id}-ex)`} style={{mixBlendMode: 'screen'}} />}
      {/* light from the exit on the shield's inner lip */}
      {glow > 0.02 && <path d={quad(at(TUBE.front + 8, -R - 7), at(TUBE.front + 26, -R - 9), at(TUBE.front + 26, R + 9), at(TUBE.front + 8, R + 7))} fill="#C9B6FF" opacity={0.25 * glow} style={{mixBlendMode: 'screen'}} />}
    </g>
  );
};
