// A1 (0-41, "This cockroach can fire a needle."): the V3 hook, one continuous shot.
//   0.00-0.30  a close three-quarter view: the living medic walks the last few millimetres toward a CLEAR silicone
//              target, its launcher aligned with it; it settles on planted feet with a small yaw correction, antennae
//              searching; the nichrome coil is already glowing.
//   0.30       the trigger: the coil cuts the latch line (spark, the two tails whip back).
//   0.30-0.50  the launch: the spring drives the injector forward along the tube, accelerating (speed streaks); the
//              camera travels with it toward the target.
//   0.50-0.85  contact: the needle enters the clear silicone, the block squashes and wobbles, the injector rebounds a
//              little and seats; the camera holds tight on the needle inside the silicone.
//   0.85-1.40  the camera tracks back along the injector and the launch tube over the backpack to reveal the living
//              insect wearing it (legs, antennae, breathing); the board's receiver LED blinks (the match cut to the remote).
// Frame 0 continues F6's walk (the loop): a1Walk / a1Pose are defined for negative t.
import React from 'react';
import {poseRoach, straightPath, plantedStop, RoachPose} from '../../../rig/roach';
import {INJ, PACK} from '../../../rig/gear';
import {clamp, sr} from '../../../lib/ease';
import {toW} from '../../../lib/v3';
import {Roach2D} from '../../roach/Roach2D';
import {Gear2D} from '../../roach/Gear2D';
import {viewAt, View, P, f2} from '../../roach/ortho';
import {LabWall2, Bench2, Surface2D, Target2D, LAB2} from '../../sets/Lab2';
import {Layer} from '../../dc/camera';
import {ShotProps} from '../index2';
import {constrainAntenna} from '../d/trial';

/** the firing stance: body origin at world x = 0 heading +x, the clear target's face 42 mm ahead */
export const A1_FACE = 42;
/** the loaded needle tip (body x) and the injector's travel to the face, then 5 mm into the silicone */
const TIP0 = INJ.loadedRear + INJ.barrelLen + 1.2 + INJ.needleLen;
const GAP = A1_FACE - TIP0;
export const A1_TRAVEL = GAP + 5;
/** the trigger (the coil cuts the line) and the launch time (spring stroke to the face, accelerating) */
export const A1_REL = 0.3;
export const A1_STROKE = 0.2;
export const A1_FIRE = A1_REL; // (kept name: the release time)
export const A1_IMPACT = A1_REL + A1_STROKE;

const S_STOP = plantedStop(36);
const V0 = (26 * 2.2) / 0.97;
/** the walk into the stance: moving at frame 0, planted by 0.22 s (before frame 0 it is F6's approach) */
export const a1Walk = (t: number) => (t < -0.75 ? S_STOP - 26 + V0 * (t + 0.75) : S_STOP - 26 * Math.pow(1 - clamp((t + 0.75) / 0.97), 2.2));
const PATH = straightPath([-S_STOP, 0, 0], 0);

/** the launch: injector rear (body x along the tube), latch, coil heat, body recoil, time since contact, motion */
export const a1Launch = (t: number) => {
  const heat = t < A1_REL ? clamp((t + 0.45) / 0.7) : Math.max(0, 1 - (t - A1_REL) / 0.3);
  const dt = t - A1_REL;
  if (dt < 0) return {injRear: INJ.loadedRear, latched: true, heat, recoil: 0, impact: -1, speed: 0};
  let x: number, speed: number;
  if (dt < A1_STROKE) {
    const u = dt / A1_STROKE;
    x = GAP * u * u;
    speed = u; // 0..1 of the stroke's top speed
  } else if (dt < A1_STROKE + 0.05) {
    const u = (dt - A1_STROKE) / 0.05;
    x = GAP + 5 * Math.sin((u * Math.PI) / 2);
    speed = 1 - u;
  } else {
    const u = dt - A1_STROKE - 0.05;
    x = A1_TRAVEL - 0.9 * Math.exp(-u / 0.09) * Math.sin(u * 28); // a small rebound, then it seats
    speed = 0;
  }
  const recoil = dt < 0.04 ? dt / 0.04 : Math.max(0, 1 - (dt - 0.04) / 0.35);
  return {injRear: INJ.loadedRear + x, latched: false, heat, recoil, impact: dt - A1_STROKE, speed};
};
/** `lab`: the clear target stands ahead (the antennae flex along it instead of passing in); F6 has none */
export const a1Pose = (t: number, lab = true): RoachPose => {
  const d = a1Launch(t);
  const settle = Math.sin(Math.PI * clamp((t - 0.02) / 0.3)) * 0.05; // the small positioning correction
  const p = poseRoach({
    path: PATH, s: a1Walk(t), t, search: 0.75,
    offset: [-1.6 * d.recoil, -0.3 * d.recoil, 0],
    yawAdd: settle,
    antL: {yaw: 1.2, pitch: 0.75, curl: 0.7}, antR: {yaw: 1.2, pitch: 0.75, curl: 0.7},
  });
  return lab ? {...p, antL: constrainAntenna(p.antL, A1_FACE), antR: constrainAntenna(p.antR, A1_FACE)} : p;
};
/** the stance frame at the release (the injector travels and stays in this frame while the body recoils) */
export const a1InjFrame = () => a1Pose(A1_REL).frame;

/** the camera: frame 0 holds the whole insect and the target; the launch carries it toward the target and in; it holds
 *  on the needle in the silicone; then it tracks back along the launcher to the insect and rises a little.
 *  `dx` shifts the look point along x (F6 pans with the insect, settling onto this view). */
export const A1_AZ = 24;
export type ViewParams = {az: number; el: number; s: number; at: [number, number, number]; sx: number; sy: number};
export const a1ViewParams = (t: number, dx = 0): ViewParams => {
  const go = sr(t, A1_REL, A1_IMPACT + 0.12); // follow the launch in
  const back = sr(t, 0.85, 1.45); // track back along the launcher
  const s = 12.4 + 8.2 * go - 11.6 * back + 0.4 * sr(t, -0.2, 0.3);
  const atX = 15 + 25 * go - 42 * back + dx;
  const atY = 17 + 9 * go - 12 * back;
  return {az: A1_AZ - 4 * back, el: 17 + 16 * back, s, at: [atX, atY, 0], sx: 540 - 40 * go + 60 * back, sy: 1010 - 90 * go + 40 * back};
};
export const viewOf = (q: ViewParams): View => viewAt(q.az, q.el, q.s, q.at, q.sx, q.sy);
export const a1View = (t: number, dx = 0): View => viewOf(a1ViewParams(t, dx));
/** the board's receiver LED on screen at the last frame (A2 opens on the remote with its button here) */
export const a1Led = (t: number) => {
  const p = a1Pose(t);
  const q = P(a1View(t), toW(p.frame, [PACK.board.c[0] - 9.5, PACK.board.c[1] + 0.9, 4.6]));
  return {x: q[0], y: q[1]};
};
export const A1_LED_END = a1Led(41 / 30);

/** speed streaks behind the injector while the spring drives it (thin crisp lines along the tube, fading) */
const Streaks: React.FC<{v: View; frame: ReturnType<typeof a1InjFrame>; rear: number; k: number}> = ({v, frame, rear, k}) => {
  if (k <= 0.05) return null;
  const y = PACK.tube.a[1];
  return (
    <g stroke="#172B3A" strokeLinecap="round" opacity={0.55 * k}>
      {[-1.6, 0.2, 1.8].map((dy, i) => {
        const a = P(v, toW(frame, [rear - 2 - 9 * k - i * 2, y + dy, 0.5 * dy])), b = P(v, toW(frame, [rear + 8, y + dy, 0.5 * dy]));
        return <path key={i} d={`M${f2(a[0])},${f2(a[1])} L${f2(b[0])},${f2(b[1])}`} strokeWidth={f2(Math.max(1.5, 0.28 * v.s))} />;
      })}
    </g>
  );
};
/** the line parting: a small bright spark at the coil for a few frames */
const Spark: React.FC<{v: View; frame: ReturnType<typeof a1InjFrame>; t: number}> = ({v, frame, t}) => {
  const u = (t - A1_REL + 0.02) / 0.14;
  if (u < 0 || u > 1) return null;
  const c = P(v, toW(frame, [PACK.tube.b[0] + 0.4, PACK.tube.a[1] + PACK.tube.r * 0.55, 0]));
  const r = (2.2 + 4.5 * u) * v.s;
  return (
    <g opacity={1 - u * u}>
      <circle cx={f2(c[0])} cy={f2(c[1])} r={f2(r * 1.25)} fill="#FFD36B" opacity={0.35} />
      <circle cx={f2(c[0])} cy={f2(c[1])} r={f2(r * 0.45)} fill="#FFF6DE" opacity={0.9} />
      {[0, 1, 2, 3, 4, 5].map((i) => {
        const a = (i / 6) * Math.PI * 2 + 0.3;
        return <path key={i} d={`M${f2(c[0] + Math.cos(a) * r * 0.35)},${f2(c[1] + Math.sin(a) * r * 0.35)} L${f2(c[0] + Math.cos(a) * r)},${f2(c[1] + Math.sin(a) * r)}`} stroke="#FFF6DE" strokeWidth={f2(Math.max(1.5, 0.25 * v.s))} strokeLinecap="round" />;
      })}
    </g>
  );
};
/** expanding rings in the clear silicone around the entry, just after contact */
const Rings: React.FC<{v: View; imp: number}> = ({v, imp}) => {
  if (imp < 0 || imp > 0.4) return null;
  const c = P(v, [A1_FACE, PACK.tube.a[1], 0]);
  return (
    <g fill="none" stroke="#FFFFFF">
      {[0, 0.08].map((d, i) => {
        const u = clamp((imp - d) / 0.3);
        if (u <= 0 || u >= 1) return null;
        return <ellipse key={i} cx={f2(c[0])} cy={f2(c[1])} rx={f2((0.6 + 2.2 * u) * v.s * Math.abs(v.R[0]) + 2)} ry={f2((1 + 4.5 * u) * v.s)} strokeWidth={f2(Math.max(1.5, 0.3 * v.s * (1 - u)))} opacity={0.9 * (1 - u)} />;
      })}
    </g>
  );
};

export const A1Scene: React.FC<{t: number; id: string}> = ({t, id}) => {
  const v = a1View(t);
  const pose = a1Pose(t);
  const d = a1Launch(t);
  const imp = d.impact;
  // the block squashes on contact and wobbles back (a soft solid)
  const wob = imp >= 0 ? Math.exp(-imp / 0.12) * Math.sin(imp * 42) : 0;
  const F = a1InjFrame();
  const led = t > 1.1 && Math.floor((t - 1.1) * 12 + 1) % 2 === 0 ? 1 : 0.25; // lit on the last frame (the match cut)
  const cam = {x: 540, y: 960, z: 1 + 0.25 * sr(t, A1_REL, 0.7) - 0.2 * sr(t, 0.85, 1.45)};
  const tgt = (veil?: number) => (
    <g transform={wob ? `translate(${f2(wob * 0.5 * v.s)} 0)` : undefined}>
      <Target2D id={`${id}t${veil ? 'v' : ''}`} v={v} face={A1_FACE} dir={1} dent={!veil && imp >= 0 ? 1 : 0} entryY={PACK.tube.a[1]} veil={veil} />
    </g>
  );
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920">
      <g filter={`url(#${id}-bl)`}>
        <defs>
          <filter id={`${id}-bl`} x="-10%" y="-10%" width="120%" height="120%">
            <feGaussianBlur stdDeviation="8" />
          </filter>
        </defs>
        <Layer cam={cam} depth={1}>
          <g transform="translate(-160 -330) scale(1.25)">
            <LabWall2 id={`${id}w`} />
          </g>
        </Layer>
      </g>
      <Layer cam={cam} depth={1.6}>
        <Bench2 id={`${id}b`} top={1250} k={1.4} />
      </Layer>
      <Surface2D v={v} x0={-400} x1={400} z0={-160} z1={140} color={LAB2.surface} />
      {tgt()}
      <Roach2D
        pose={pose}
        v={v}
        o={{id: `${id}r`, gear: (
          <g>
            <Gear2D id={`${id}g`} v={v} f={pose.frame} g={{kind: 'injector', injRear: d.injRear, injFrame: d.latched ? undefined : F, latched: d.latched, heat: d.heat, led}} />
            <Streaks v={v} frame={F} rear={d.injRear} k={d.speed} />
            <Spark v={v} frame={F} t={t} />
          </g>
        )}}
      />
      {tgt(0.62)}
      <Rings v={v} imp={imp} />
    </svg>
  );
};

export const A1: React.FC<ShotProps> = ({f}) => <A1Scene t={f / 30} id={`a1f${f}`} />;
