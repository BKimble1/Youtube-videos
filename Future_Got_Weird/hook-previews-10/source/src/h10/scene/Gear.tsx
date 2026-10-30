// HOOK 10: the wearable hardware of the brain-spine interface: the headset (an arch over the head carrying the two
// antenna coils that sit over the skull implants), the cable from the headset to the backpack that holds the portable
// processing unit, the cable down to a transmitter on an elastic belt over the implanted pulse generator, and the
// backpack's shoulder strap. Status lights show activity (receive, decode, transmit); no labels, no graphics.
import React from 'react';
import {lit, mix, shade} from '../rig/color';
import {INK} from '../rig/ink';
import {add, fmt, mul, V} from '../rig/math';
import {closedPath, openPath} from '../../shared/lib';
import {Frames, polyD} from './body';
import {HEADPT, Paths, TORPT} from './paths';
import {SIG, SIG_CORE} from './Pulse';

const GRAPH = '#2B363E';
const ptsD = (pts: V[]) => closedPath(pts.map((p) => ({x: p.x, y: p.y})), 1);

/** headset, drawn in head-local units: a light medical arch from ear to ear over the crown, with the two round
 *  antenna-coil housings resting on the scalp over the implants (the near one on his near side, the far one just
 *  showing over the crown) */
export const Headset: React.FC<{F: Frames; rx: number}> = ({F, rx}) => {
  const h = F.j.head;
  const tr = `translate(${fmt(h.x)} ${fmt(h.y)}) rotate(${fmt(F.headRoll)}) scale(${fmt(F.hs)})`;
  const pk = HEADPT.puck, pf = HEADPT.puckFar;
  const SHELL = '#3A4750';
  const Puck = ({c, r, rot, far}: {c: V; r: number; rot: number; far?: boolean}) => {
    const body = far ? shade(SHELL, 0.22) : SHELL;
    const ry = r * 0.36;
    return (
      <g transform={`rotate(${rot} ${c.x} ${c.y})`}>
        <path d={`M${c.x - r},${c.y} L${c.x - r},${c.y + 8} A${r} ${ry} 0 0 0 ${c.x + r},${c.y + 8} L${c.x + r},${c.y} Z`} fill={shade(body, 0.3)} stroke={INK} strokeWidth={2.2} />
        <ellipse cx={c.x} cy={c.y} rx={r} ry={ry} fill={lit(body, 0.3)} stroke={INK} strokeWidth={2.2} />
        {/* the antenna coil inside the housing */}
        <ellipse cx={c.x} cy={c.y} rx={r * 0.66} ry={ry * 0.62} fill="none" stroke={mix('#5E9AA4', SIG, rx * 0.85)} strokeWidth={2.6} opacity={far ? 0.55 : 0.9} />
        <ellipse cx={c.x} cy={c.y} rx={r * 0.5} ry={ry * 0.45} fill="none" stroke={mix('#4C7E88', SIG, rx * 0.7)} strokeWidth={1.4} opacity={far ? 0.45 : 0.8} />
        {!far && rx > 0.02 && <ellipse cx={c.x} cy={c.y} rx={r * 1.6} ry={ry * 2.6} fill="url(#h10-glow-sig)" opacity={0.65 * rx} />}
        <ellipse cx={c.x - r * 0.4} cy={c.y - ry * 0.3} rx={r * 0.32} ry={ry * 0.24} fill="#FFFFFF" opacity={0.22} />
      </g>
    );
  };
  const arch = 'M-34,-122 C-8,-132 30,-128 56,-108 C80,-90 98,-64 100,-34';
  return (
    <g transform={tr}>
      <path d={arch} fill="none" stroke={INK} strokeWidth={13} strokeLinecap="round" />
      <path d={arch} fill="none" stroke={shade(SHELL, 0.12)} strokeWidth={8.5} strokeLinecap="round" />
      <path d="M-26,-127 C0,-133 30,-126 50,-112" fill="none" stroke="#FFFFFF" strokeOpacity={0.4} strokeWidth={2.4} strokeLinecap="round" />
      {/* ear piece holding the arch above the near ear */}
      <path d={ptsD([{x: 90, y: -44}, {x: 108, y: -46}, {x: 112, y: -24}, {x: 94, y: -20}])} fill={shade(SHELL, 0.18)} stroke={INK} strokeWidth={2.2} />
      <Puck c={pf} r={20} rot={22} far />
      <Puck c={pk} r={30} rot={42} />
      <circle cx={pk.x - 2} cy={pk.y + 18} r={2.8} fill={mix('#3A6670', SIG_CORE, 0.25 + 0.75 * rx)} stroke={INK} strokeWidth={0.8} />
    </g>
  );
};

/** the backpack holding the portable processing unit (drawn behind him) */
export const Backpack: React.FC<{F: Frames; dec: number; t: number}> = ({F, dec, t}) => {
  const T = (u: number, v: number) => F.tor(u, v);
  const body = [T(344, 86), T(346, 132), T(330, 160), T(220, 166), T(190, 152), T(188, 90)];
  const pocket = [T(290, 128), T(292, 160), T(214, 164), T(212, 128)];
  const leds = [0, 1, 2, 3].map((i) => {
    const on = dec * (0.5 + 0.5 * Math.sin(t * 30 - i * 1.6));
    return {p: T(320 - i * 12, 146), on};
  });
  const bodyD = ptsD(body);
  return (
    <g>
      <path d={bodyD} fill="#36454F" stroke={INK} strokeWidth={4} strokeLinejoin="round" />
      <path d={ptsD([T(340, 92), T(342, 126), T(300, 132), T(290, 96)])} fill="#56687A" opacity={0.45} />
      <path d={ptsD(pocket)} fill="#2C3A43" stroke={INK} strokeWidth={2.5} />
      <path d={openPath([T(336, 100), T(334, 150)].map((p) => ({x: p.x, y: p.y})))} stroke="#FFFFFF" strokeOpacity={0.12} strokeWidth={4} fill="none" strokeLinecap="round" />
      {leds.map((l, i) => (
        <g key={i}>
          {l.on > 0.05 && <circle cx={fmt(l.p.x)} cy={fmt(l.p.y)} r={9} fill={SIG} opacity={0.35 * l.on} />}
          <circle cx={fmt(l.p.x)} cy={fmt(l.p.y)} r={2.8} fill={mix('#2A4A50', SIG_CORE, l.on)} stroke={INK} strokeWidth={0.8} />
        </g>
      ))}
    </g>
  );
};

/** cables (external), strap, belt and transmitter (drawn over the body, outside the cutaway) */
export const Wearables: React.FC<{F: Frames; Pt: Paths; tx: number}> = ({F, Pt, tx}) => {
  const T = (u: number, v: number) => F.tor(u, v);
  const cable = (d: string, w = 5) => (
    <g>
      <path d={d} fill="none" stroke={INK} strokeWidth={w + 3} strokeLinecap="round" strokeLinejoin="round" />
      <path d={d} fill="none" stroke="#38454E" strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" />
      <path d={d} fill="none" stroke="#FFFFFF" strokeOpacity={0.16} strokeWidth={w * 0.3} strokeLinecap="round" strokeLinejoin="round" transform="translate(-0.8 -1)" />
    </g>
  );
  const pod = T(TORPT.pod.u, TORPT.pod.v);
  const podPts = [T(48, -50), T(48, -90), T(14, -92), T(12, -50)];
  // the belt follows the waist (behind the pod)
  const belt = [T(40, -90), T(38, -40), T(36, 20), T(38, 92)];
  const belt2 = [T(22, 94), T(20, 20), T(22, -40), T(24, -92)];
  return (
    <g>
      <path d={ptsD([...belt, ...belt2])} fill="#2A343B" stroke={INK} strokeWidth={2.5} opacity={0.95} />
      {cable(polyD(Pt.cableBelt.pts), 4.5)}
      <path d={ptsD(podPts)} fill="#323F48" stroke={INK} strokeWidth={3} />
      <path d={ptsD([T(44, -56), T(44, -84), T(20, -86), T(18, -56)])} fill="#3E4D57" />
      {tx > 0.03 && <circle cx={fmt(pod.x)} cy={fmt(pod.y)} r={26} fill="url(#h10-glow-sig)" opacity={0.7 * tx} />}
      <circle cx={fmt(T(40, -78).x)} cy={fmt(T(40, -78).y)} r={3} fill={mix('#2A4A50', SIG_CORE, tx)} />
      {cable(polyD(Pt.cableHead.pts), 5)}
    </g>
  );
};

export {add, mul};
