// The operator's hand: the Weird Crew "guesser" (white sleeve with the saffron stripes of his tee, peach wrist) in a
// nitrile lab glove, built on the crew's Hand rig (dc/Hand.tsx). Seen from above, entering from the lower right.
// Two tools: a cotton swab loaded with the dye solution (application) and a wash bottle (rinse).
// Everything is placed from the tool's working point, so the swab tip and the bottle nozzle are exactly where the
// action is (contact is attached to the skin, never through it).
import React from 'react';
import {mix} from '../dc/color';
import {Hand, HandPose} from '../dc/Hand';
import {INK, Inked} from '../dc/ink';
import {add, mul, perp, V} from '../dc/math';
import {Capsule} from '../dc/shade';

const GLOVE = '#93C3E8';
const SLEEVE = '#FFFFFF';
const STRIPE = '#FFC744';
const WRIST = '#F2C9A8';
const PENCIL: HandPose = {curl: [0.5, 0.62, 0.7, 0.76], spread: 0.25, thumb: 38, thumbCurl: 0.3};
const SQUEEZE: HandPose = {curl: [0.62, 0.7, 0.76, 0.8], spread: 0.2, thumb: 48, thumbCurl: 0.45};

const unit = (a: number): V => ({x: Math.cos((a * Math.PI) / 180), y: Math.sin((a * Math.PI) / 180)});

const Arm: React.FC<{id: string; wrist: V; d: V; L: number}> = ({id, wrist, d, L}) => {
  // forearm runs from the wrist back along d (away from the work), off frame
  const cuff = add(wrist, mul(d, L * 0.42));
  const elbow = add(wrist, mul(d, L * 3.2));
  const n = perp(d);
  return (
    <g>
      <Inked w={L * 0.05}>
        <Capsule id={`${id}-w`} a={wrist} b={cuff} ra={L * 0.19} rb={L * 0.22} color={WRIST} />
        <Capsule id={`${id}-s`} a={cuff} b={elbow} ra={L * 0.27} rb={L * 0.33} color={SLEEVE} spec={0.2} />
      </Inked>
      {[0.25, 0.55].map((u, k) => {
        const c = add(cuff, mul(d, L * 0.4 + u * L * 1.1));
        const r = L * (0.28 + u * 0.03);
        return <path key={k} d={`M${c.x + n.x * r},${c.y + n.y * r} L${c.x - n.x * r},${c.y - n.y * r}`} stroke={STRIPE} strokeWidth={L * 0.14} />;
      })}
    </g>
  );
};

/** cotton swab held like a pencil; `tip` is the cotton tip on the skin, `ang` the direction tip -> hand (deg) */
export const SwabHand: React.FC<{id: string; tip: V; ang: number; lift: number; k?: number}> = ({id, tip, ang, lift, k = 3.2}) => {
  const d = unit(ang);
  const L = 150;
  const back = add(tip, mul(d, 300));
  const grip = add(tip, mul(d, 80));
  const wrist = add(grip, add(mul(d, 120), mul(perp(d), 18)));
  return (
    <g transform={`translate(${tip.x} ${tip.y}) scale(${k}) translate(${-tip.x} ${-tip.y})`}>
      {/* shadow of hand and swab on the skin/pad below (shifts with lift) */}
      <g opacity={0.22} transform={`translate(${6 + lift * 10} ${8 + lift * 14})`} style={{filter: 'blur(9px)'}}>
        <path d={`M${tip.x},${tip.y} L${back.x},${back.y}`} stroke="#0B1C2A" strokeWidth={12} />
        <circle cx={wrist.x - d.x * 60} cy={wrist.y - d.y * 60} r={70} fill="#0B1C2A" />
      </g>
      <path d={`M${tip.x},${tip.y} L${back.x},${back.y}`} stroke={INK} strokeWidth={10} strokeLinecap="round" />
      <path d={`M${tip.x},${tip.y} L${back.x},${back.y}`} stroke="#F6F2EA" strokeWidth={5.5} strokeLinecap="round" />
      {/* cotton tip, soaked in the yellow-orange solution: a fibrous, slightly irregular wad */}
      <g transform={`translate(${tip.x} ${tip.y}) rotate(${ang + 90})`}>
        <path d={Array.from({length: 48}, (_, i) => {
          const a = (i / 48) * Math.PI * 2, r = 1 + 0.035 * Math.sin(i * 1.9) + 0.025 * Math.sin(i * 4.3);
          return `${i ? 'L' : 'M'}${(15 * r * Math.cos(a)).toFixed(1)},${(25 * r * Math.sin(a)).toFixed(1)}`;
        }).join(' ') + ' Z'} fill="#F4B03C" stroke={INK} strokeWidth={3.5} strokeLinejoin="round" />
        <ellipse cx={-4} cy={-8} rx={6} ry={10} fill="#FFE7A6" opacity={0.85} />
        {[[-6, 4], [5, 9], [-2, 15], [7, -2]].map(([x, y], i) => <path key={i} d={`M${x - 4},${y} q4,-3 8,0`} stroke="#C97B14" strokeWidth={1.6} fill="none" opacity={0.7} />)}
      </g>
      <Arm id={`${id}-a`} wrist={wrist} d={d} L={L} />
      <Hand id={`${id}-h`} wrist={wrist} ang={ang + 180} L={L} thumbSide={-1} view="back" pose={PENCIL} color={GLOVE} sheen={1.4} />
    </g>
  );
};

/** wash bottle squeezed in the hand; `nozzle` is the nozzle tip, `ang` the direction nozzle -> bottle (deg) */
export const BottleHand: React.FC<{id: string; nozzle: V; ang: number; squeeze: number; k?: number}> = ({id, nozzle, ang, squeeze, k = 2.8}) => {
  const d = unit(ang);
  const n = perp(d);
  const neck = add(nozzle, mul(d, 120));
  const body0 = add(nozzle, mul(d, 150));
  const body1 = add(nozzle, mul(d, 380));
  const w = 78 * (1 - 0.06 * squeeze);
  const L = 160;
  const wrist = add(add(nozzle, mul(d, 270)), mul(n, -150));
  const q = (p: V, k: number) => add(p, mul(n, k));
  return (
    <g transform={`translate(${nozzle.x} ${nozzle.y}) scale(${k}) translate(${-nozzle.x} ${-nozzle.y})`}>
      <g opacity={0.2} transform="translate(14 20)" style={{filter: 'blur(8px)'}}>
        <path d={`M${body0.x},${body0.y} L${body1.x},${body1.y}`} stroke="#0B1C2A" strokeWidth={w * 2} strokeLinecap="round" />
      </g>
      {/* bent nozzle */}
      <path d={`M${nozzle.x},${nozzle.y} L${neck.x},${neck.y}`} stroke={INK} strokeWidth={15} strokeLinecap="round" />
      <path d={`M${nozzle.x},${nozzle.y} L${neck.x},${neck.y}`} stroke="#F5F7F8" strokeWidth={8} strokeLinecap="round" />
      {/* bottle body: translucent white plastic, water inside */}
      <path d={`M${q(body0, -w * 0.5).x},${q(body0, -w * 0.5).y} L${q(body0, w * 0.5).x},${q(body0, w * 0.5).y} L${q(body1, w).x},${q(body1, w).y} L${q(body1, -w).x},${q(body1, -w).y} Z`}
        fill="#EAF4F8" stroke={INK} strokeWidth={5} strokeLinejoin="round" />
      <path d={`M${q(add(body0, mul(d, 60)), -w * 0.45).x},${q(add(body0, mul(d, 60)), -w * 0.45).y} L${q(body1, -w * 0.75).x},${q(body1, -w * 0.75).y}`} stroke="#fff" strokeWidth={10} strokeLinecap="round" opacity={0.8} />
      <path d={`M${q(add(body0, mul(d, 110)), w * 0.62).x},${q(add(body0, mul(d, 110)), w * 0.62).y} L${q(body1, w * 0.92).x},${q(body1, w * 0.92).y}`} stroke={mix('#BFE3F2', '#8CC6E0', 0.5)} strokeWidth={22} strokeLinecap="round" opacity={0.7} />
      <Arm id={`${id}-a`} wrist={wrist} d={{x: -n.x * 0.55 + d.x * 0.83, y: -n.y * 0.55 + d.y * 0.83}} L={L} />
      <Hand id={`${id}-h`} wrist={wrist} ang={(Math.atan2(n.y, n.x) * 180) / Math.PI + 10} L={L} thumbSide={1} view="back" pose={SQUEEZE} color={GLOVE} sheen={1.4} />
    </g>
  );
};

/** the rinse stream from the nozzle to a landing point on the skin, plus splash/run-off */
export const Stream: React.FC<{from: V; to: V; a: number; t: number}> = ({from, to, a, t}) => {
  if (a <= 0) return null;
  const mid = {x: (from.x + to.x) / 2 + 40, y: (from.y + to.y) / 2 - 30};
  const d = `M${from.x},${from.y} Q${mid.x},${mid.y} ${to.x},${to.y}`;
  return (
    <g opacity={a}>
      <path d={d} stroke="#2B6C8F" strokeWidth={17} fill="none" strokeLinecap="round" opacity={0.5} />
      <path d={d} stroke="#D8F1FF" strokeWidth={11} fill="none" strokeLinecap="round" />
      <path d={d} stroke="#fff" strokeWidth={3} fill="none" strokeDasharray="22 30" strokeDashoffset={-t * 600} strokeLinecap="round" />
      {[0, 1, 2, 3, 4, 5].map((k) => {
        const ph = (t * 3.2 + k / 6) % 1;
        const ang = (k / 6) * Math.PI * 2 + 0.5;
        return <circle key={k} cx={to.x + Math.cos(ang) * (16 + ph * 46)} cy={to.y + Math.sin(ang) * (12 + ph * 34)} r={5 * (1 - ph) + 1.5} fill="#E8F7FF" stroke="#2B6C8F" strokeWidth={1.5} opacity={1 - ph} />;
      })}
      <ellipse cx={to.x} cy={to.y} rx={30} ry={22} fill="#EAF8FF" opacity={0.75} />
    </g>
  );
};
