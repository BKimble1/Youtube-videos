// F5 (891-935, "want it to get closer."): the loop shot. A1's exact camera and the same walk, now in the rubble: the
// cyborg cockroach walks screen-right toward her open, relaxed hand, which lies where the lab target stands in the
// opening (a clear gap between the needle and her fingertips: no contact, no injection). Its walk continues straight
// into A1's frame 0 (a1Walk / a1View run on loop time, film time minus the film's length).
import React from 'react';
import {Roach2D} from '../../roach/Roach2D';
import {Gear2D, deployAt} from '../../roach/Gear2D';
import {P, f2} from '../../roach/ortho';
import {toW} from '../../../lib/v3';
import {Surface2D} from '../../sets/Lab2';
import {Hand, HAND_RELAXED, mixHand, HAND_LIMP} from '../../dc/Hand';
import {Lin, SoftShadow} from '../../../lib/shade';
import {noise1, sr} from '../../../lib/ease';
import {a1Pose, a1View, A1_FIRE, A1_TRAVEL, A1_FACE} from './A1';
import {FRAMES2} from '../../cuts2';
import {ShotProps} from '../index2';

const SKIN = '#F7D9C4';
export const RUB2 = {
  deep: '#2B2724',
  mid: '#5E5751',
  concrete: '#9C9590',
  concreteDeep: '#7E7772',
  concreteLight: '#B8B0A6',
  dust: '#C9BFAF',
  floor: '#A99F92',
  day: '#FFE8B8',
};

/** a flat broken-concrete chunk (scene px): an irregular polygon with a lit top edge and a few aggregate specks */
const Chunk: React.FC<{pts: [number, number][]; color: string; ink?: number}> = ({pts, color, ink = 5}) => {
  const d = `M${pts.map((p) => `${f2(p[0])},${f2(p[1])}`).join(' L')} Z`;
  return (
    <g>
      <path d={d} fill={color} stroke="#172B3A" strokeWidth={ink} strokeLinejoin="round" />
      <path d={`M${f2(pts[0][0])},${f2(pts[0][1])} L${f2(pts[1][0])},${f2(pts[1][1])}`} stroke="#FFFFFF" strokeOpacity={0.22} strokeWidth={ink * 1.6} strokeLinecap="round" />
    </g>
  );
};

/** the rubble backdrop for the close shots (blurred: it is far behind the macro subject) */
export const RubbleBack2: React.FC<{id: string; t: number}> = ({id, t}) => (
  <g>
    <Lin id={`${id}-bg`} d="M0,0 H1080 V1920 H0 Z" from={{x: 0, y: 0}} to={{x: 0, y: 1300}} stops={[[0, '#3C3632'], [1, '#6E655D']]} />
    <g filter={`url(#${id}-bl)`}>
      <defs>
        <filter id={`${id}-bl`} x="-10%" y="-10%" width="120%" height="120%">
          <feGaussianBlur stdDeviation="8" />
        </filter>
      </defs>
      <Chunk pts={[[-60, 380], [420, 300], [520, 700], [60, 820], [-60, 760]]} color={RUB2.concreteDeep} ink={8} />
      <Chunk pts={[[560, 120], [1140, 60], [1140, 640], [700, 720], [520, 520]]} color={RUB2.concrete} ink={8} />
      <Chunk pts={[[300, 760], [760, 700], [880, 900], [260, 960]]} color={RUB2.mid} ink={8} />
      <path d="M760,0 L1080,0 L1080,40 L520,980 L380,980 Z" fill={RUB2.day} opacity={0.12} />
      {[...Array(26)].map((_, i) => {
        const x = (i * 137.3) % 1080, y = 120 + ((i * 251.7) % 820) + 18 * noise1(t * 0.5 + i, 3);
        return <circle key={i} cx={f2(x + 10 * noise1(t * 0.4 + i * 2, 5))} cy={f2(y)} r={2 + (i % 3)} fill={RUB2.dust} opacity={0.5} />;
      })}
    </g>
  </g>
);

/** her open hand in the near foreground, resting on the rubble and reaching up toward the insect beside its path (never
 *  in the needle's line): the crew hand, large as a real hand is next to the insect, a little foreshortened */
export const F5Hand: React.FC<{id: string; t: number; tip: {x: number; y: number}; L: number; open?: number}> = ({id, t, tip, L, open = 1}) => {
  const ang = 208 + 2.5 * noise1(t * 0.3, 7) - 4 * (1 - open);
  const r = (ang * Math.PI) / 180;
  const wrist = {x: tip.x - Math.cos(r) * L * 0.98, y: tip.y - Math.sin(r) * L * 0.98};
  return (
    <g transform={`translate(${f2(tip.x)} ${f2(tip.y)}) scale(1 0.78) translate(${f2(-tip.x)} ${f2(-tip.y)})`}>
      <SoftShadow id={`${id}-sh`} c={{x: tip.x + 0.42 * L, y: tip.y + 0.26 * L}} rx={0.6 * L} ry={0.2 * L} alpha={0.3} rotate={ang - 180} />
      <Hand id={id} wrist={wrist} ang={ang} L={L} thumbSide={1} view="back" pose={mixHand(HAND_LIMP, HAND_RELAXED, open)} color={SKIN} sheen={0.8} ink={7} />
    </g>
  );
};

export const F5Scene: React.FC<{t: number; id: string}> = ({t, id}) => {
  const tau = t - FRAMES2 / 30; // loop time: A1's clock
  const v = a1View(tau);
  const pose = a1Pose(tau);
  const d = deployAt(tau, A1_FIRE, A1_TRAVEL);
  // fingertips in the near foreground, ahead of and below the insect's head where it stops at the loop point (fixed in
  // the world: placed from the stance pose, on A1's frame-0 view)
  const head0 = P(a1View(0), toW(a1Pose(0).frame, [36, 4, 0]));
  // (the relaxed fingers curl, so the drawn tips land well short of the hand's straight length: aim it further in)
  const tip = {0: head0[0] - 120, 1: head0[1] + 120};
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920">
      <RubbleBack2 id={`${id}b`} t={t} />
      <Surface2D v={v} x0={-400} x1={420} z0={-160} z1={140} color={RUB2.floor} />
      {[...Array(18)].map((_, i) => {
        const g = P(v, [-120 + ((i * 47.3) % 240), 0, -60 + ((i * 29.1) % 120)]);
        return <circle key={i} cx={f2(g[0])} cy={f2(g[1])} r={3 + (i % 4)} fill={i % 2 ? RUB2.concreteDeep : RUB2.dust} opacity={0.8} />;
      })}
      <F5Hand id={`${id}h`} t={t} tip={{x: tip[0], y: tip[1]}} L={118 * v.s} open={sr(t, 29.6, 30.4)} />
      <Roach2D pose={pose} v={v} o={{id: `${id}r`, gear: <Gear2D id={`${id}g`} v={v} f={pose.frame} g={{kind: 'injector', injRear: d.injRear, latched: d.latched, heat: d.heat}} />}} />
    </svg>
  );
};

export const F5: React.FC<ShotProps> = ({f}) => <F5Scene t={f / 30} id="f5" />;
