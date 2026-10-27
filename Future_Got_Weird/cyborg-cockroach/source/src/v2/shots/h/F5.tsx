// F6 (892-935, "it to get closer."): the loop shot (V2's F5). A1's exact camera and the same walk, now in the rubble: the
// cyborg cockroach walks screen-right toward her open, relaxed hand, which lies where the lab target stands in the
// opening (a clear gap between the needle and her fingertips: no contact, no injection). Its walk continues straight
// into A1's frame 0 (a1Walk / a1View run on loop time, film time minus the film's length).
import React from 'react';
import {Roach2D} from '../../roach/Roach2D';
import {Gear2D} from '../../roach/Gear2D';
import {P, f2} from '../../roach/ortho';
import {toW} from '../../../lib/v3';
import {Surface2D} from '../../sets/Lab2';
import {Hand, HAND_RELAXED, mixHand, HAND_LIMP} from '../../dc/Hand';
import {Lin, SoftShadow} from '../../../lib/shade';
import {noise1, sr} from '../../../lib/ease';
import {RB, Shaft, Motes, Glow2, Vignette} from '../e/art';
import {a1Pose, a1Walk, a1Launch, a1ViewParams, viewOf, A1_FACE} from './A1';
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

/** the rubble backdrop for the close shots, in her pocket's light (group E's palette: dark concrete, a warm daylight
 *  shaft from the upper right, dust motes); blurred, it is far behind the macro subject */
export const RubbleBack2: React.FC<{id: string; t: number}> = ({id, t}) => (
  <g>
    <Lin id={`${id}-bg`} d="M0,0 H1080 V1920 H0 Z" from={{x: 0, y: 0}} to={{x: 0, y: 1100}} stops={[[0, RB.deep], [1, RB.far]]} />
    <g filter={`url(#${id}-bl)`}>
      <defs>
        <filter id={`${id}-bl`} x="-10%" y="-10%" width="120%" height="120%">
          <feGaussianBlur stdDeviation="9" />
        </filter>
      </defs>
      <Chunk pts={[[-60, 300], [460, 210], [560, 640], [60, 780], [-60, 720]]} color={RB.far} ink={8} />
      <Chunk pts={[[600, 60], [1140, -20], [1140, 600], [760, 700], [560, 470]]} color={RB.concDark} ink={8} />
      <Chunk pts={[[280, 700], [780, 640], [900, 860], [240, 930]]} color={RB.farLit} ink={8} />
      <path d="M520,690 L1140,330" stroke={RB.rebar} strokeWidth={14} strokeLinecap="round" />
    </g>
    <Shaft id={`${id}-sh`} pts={[[820, -40], [1120, -40], [700, 1100], [260, 1100]]} from={[960, 0]} to={[480, 1100]} a={0.42} />
    <Motes id={`${id}-m`} t={t} n={34} x0={300} y0={60} x1={1060} y1={1000} r={2.6} seed={11} a={0.7} />
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

/** the camera: it opens more frontal and wider (the insect coming toward us), then arcs round and closes in with it as
 *  it approaches her fingertips, settling with zero velocity exactly on A1's frame-0 view (the loop) */
const f6View = (tau: number) => {
  const u = sr(tau, -1.47, 0);
  const q0 = a1ViewParams(0);
  const head = a1Walk(tau) - a1Walk(0); // mm behind its loop-point position
  const lerp = (a: number, b: number) => a + (b - a) * u;
  return viewOf({
    az: lerp(62, q0.az), el: lerp(24, q0.el), s: lerp(8.6, q0.s),
    at: [lerp(q0.at[0] + 0.85 * head, q0.at[0]), lerp(14, q0.at[1]), lerp(4, q0.at[2])],
    sx: lerp(560, q0.sx), sy: lerp(1000, q0.sy),
  });
};
/** her fingertips on the floor ahead of and beside its path (world mm, A1's stance frame): never in the needle's line */
const TIP_W: [number, number, number] = [A1_FACE - 2, 0, 26];
export const F5Scene: React.FC<{t: number; id: string}> = ({t, id}) => {
  const tau = t - FRAMES2 / 30; // loop time: A1's clock
  const v = f6View(tau);
  const pose = a1Pose(tau, false);
  const d = a1Launch(tau);
  const tp = P(v, TIP_W);
  const tip = {x: tp[0], y: tp[1]};
  const head = P(v, toW(pose.frame, [30, 2, 0]));
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920">
      <RubbleBack2 id={`${id}b`} t={t} />
      <Surface2D v={v} x0={-900} x1={900} z0={-220} z1={400} color={RB.conc} />
      <Glow2 id={`${id}gl`} cx={head[0] + 80} cy={head[1] + 60} rx={620} ry={300} color={RB.day} a={0.34} />
      {[...Array(22)].map((_, i) => {
        const g = P(v, [-220 + ((i * 47.3) % 440), 0, -60 + ((i * 29.1) % 120)]);
        return <circle key={i} cx={f2(g[0])} cy={f2(g[1])} r={3 + (i % 4)} fill={i % 2 ? RB.concDark : RB.dust} opacity={0.8} />;
      })}
      <Roach2D pose={pose} v={v} o={{id: `${id}r`, gear: <Gear2D id={`${id}g`} v={v} f={pose.frame} g={{kind: 'injector', injRear: d.injRear, latched: d.latched, heat: d.heat}} />}} />
      <F5Hand id={`${id}h`} t={t} tip={tip} L={118 * v.s} open={1} />
      <Vignette id={`${id}vg`} a={0.45} />
    </svg>
  );
};

export const F6: React.FC<ShotProps> = ({f}) => <F5Scene t={f / 30} id={`f6f${f}`} />;
