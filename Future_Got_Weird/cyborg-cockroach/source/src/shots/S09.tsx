// S09 (15.40-17.90 s) "Once it lines up, they fire the injector." A stable side cutaway of the prepared trial: the
// medic insect stands in its firing stance (body x = 58, heading -x, as in S01/S08) a few centimetres in front of the
// silicone target (frame left), seen square-on from its left side. The launch tube is drawn cut open along its length
// (rig/Section.tsx) so the mechanism reads: the compressed spring, the loaded injector, the latch line through the holes
// at the mouth round the needle hub in front of the collar, the nichrome coil on the line, the fine wire from the board.
// "lines up": the body pivots the last few degrees on its planted feet and levels, so the tube axis points squarely at
// the target. Then the cause-and-effect chain: a pulse runs from the board along the coil wire, the coil heats, the line
// parts on "fire" (the two cut ends spring apart), the spring drives the injector out, it crosses the few centimetres and
// the needle embeds; the body takes a small recoil through its planted legs. Locked camera.
import React from 'react';
import {lookAt, depth, proj, scaleAt, Cam} from '../lib/cam';
import {V3, Frame, add, mul, toW} from '../lib/v3';
import {clamp, easeIn, easeOut, keys, ramp, sr} from '../lib/ease';
import {poseRoach, straightPath, plantedStop, RoachPose} from '../rig/roach';
import {Roach} from '../rig/Roach';
import {Injector} from '../rig/Gear';
import {INJ} from '../rig/gear';
import {NEEDLE_TIP, EMBED} from '../rig/launch';
import {LabBackdrop, ArenaFloor, TargetFixture} from '../sets/Lab';
import {arenaWalls} from '../sets/LabRoom';
import {FixtureShadow, S01_BODY_X} from './S01';
import {PackBase, SectionTube, SEC} from '../rig/Section';
import {fmt} from '../lib/g3';
import {ShotProps} from './index';
import {FPS, word, wordIn} from '../timeline';

const DEG = Math.PI / 180;

// ---------------------------------------------------------------------------------------------------------------
// Timing, all from the narration
// ---------------------------------------------------------------------------------------------------------------
const T_LINES = wordIn('lines up').start; // 15.77
const T_UP = wordIn('lines up', 1).end; // 16.25
// "fire" (second occurrence): the aligner starts it with "they"; it is voiced from the end of "they" (16.59)
const T_FIRE = Math.max(wordIn('fire the injector').start, wordIn('they fire the injector').end);
/** the frame the latch line parts (the mechanism click), on the first frame of "fire" */
export const S09_CUT_F = Math.ceil(T_FIRE * FPS - 0.3);
export const S09_T_CUT = S09_CUT_F / FPS;
/** flight from release to the needle in the target */
const FLIGHT = 7 / FPS;
/** the frame the needle embeds in the silicone (the impact) */
export const S09_IMPACT_F = S09_CUT_F + 7;
const T_P0 = S09_T_CUT - 0.33, T_P1 = S09_T_CUT - 0.15; // pulse along the coil wire
const T_INJ = word('injector', 0).start;

// ---------------------------------------------------------------------------------------------------------------
// The medic: firing stance (S01's), the last few degrees of turn and a levelling on its planted feet, the recoil
// ---------------------------------------------------------------------------------------------------------------
const S_STOP = plantedStop(36);
export const S09_PATH = straightPath([S01_BODY_X + S_STOP, 0, 0], Math.PI);
const SETTLE = 0.8; // as S01/S08 (settled into the stance)
/** the travel of the injector's rear from its loaded place (body x) to where it stops with the needle embedded */
const TRAVEL = S01_BODY_X + EMBED - NEEDLE_TIP - SEC.loadedRear;

/** body recoil envelope after the release */
const recoilAt = (t: number) => {
  const dt = t - S09_T_CUT;
  if (dt < 0) return 0;
  return dt < 0.04 ? easeOut(dt / 0.04) : Math.exp(-(dt - 0.04) / 0.16);
};
/** line-up: 0 at the start (a few degrees off, nose a little low), 1 when squared up (all feet planted throughout) */
const lineUp = (t: number) => sr(t, T_LINES - 0.12, T_UP);

export const s09Pose = (t: number): RoachPose => {
  const u = lineUp(t);
  const rec = recoilAt(t);
  // after the release the antennae flick back and settle spread out to the sides (clear of the target), then by the
  // end of S10 drift forward again, searching
  const after = sr(t, S09_T_CUT + 0.12, S09_T_CUT + 0.9) - 0.45 * sr(t, 19.5, 20.6);
  return poseRoach({
    path: S09_PATH, s: S_STOP, t, seed: 3,
    search: keys(t, [[15.4, 0.75], [T_UP, 0.35], [S09_T_CUT, 0.3], [S09_T_CUT + 0.5, 0.8]]),
    yawAdd: 5.5 * DEG * (1 - u),
    pitch: -1.6 * DEG * (1 - u) + 0.016 * rec,
    offset: [-1.1 * (1 - u) - 1.0 * rec, -SETTLE - 0.3 * rec, 0],
    // antennae held up and forward toward the target (clear of the cradle's base plate), flicking back at the release
    antL: {yaw: 0.66 - 0.1 * u + 0.3 * rec + 0.8 * after, pitch: 0.3 + 0.18 * rec + 0.22 * after, curl: 0.72},
    antR: {yaw: 0.72 - 0.1 * u + 0.3 * rec + 0.75 * after, pitch: 0.32 + 0.18 * rec + 0.22 * after, curl: 0.72},
  });
};
/** the body frame the launch follows: squared up, settled, no recoil (the tube axis at the release) */
export const S09_LAUNCH_FRAME: Frame = poseRoach({path: S09_PATH, s: S_STOP, t: 0, offset: [0, -SETTLE, 0]}).frame;

export type S09Launch = {
  /** body x of the injector's rear (along the launch frame) */
  rear: number;
  inTube: boolean;
  flying: boolean;
  embedded: boolean;
  impact: number; // s since impact (negative before)
  springFront: number;
  cutT: number | null;
  heat: number;
  pulse: number | null;
};
export const s09Launch = (t: number): S09Launch => {
  const dt = t - S09_T_CUT;
  const heat = sr(t, T_P1 - 0.02, S09_T_CUT - 0.01) * (1 - sr(t, S09_T_CUT + 0.08, S09_T_CUT + 0.65));
  const pulse = t >= T_P0 && t <= T_P1 ? ramp(t, T_P0, T_P1) : null;
  if (dt < 0) return {rear: SEC.loadedRear, inTube: true, flying: false, embedded: false, impact: -1, springFront: SEC.loadedRear, cutT: null, heat, pulse};
  const u = clamp(dt / FLIGHT);
  // fast out of the tube on the spring, then steady through the air (almost no slowing over a few cm)
  const prog = u < 0.3 ? 0.3 * easeIn(u / 0.3, 1.6) : 0.3 + 0.7 * ((u - 0.3) / 0.7);
  const rear = SEC.loadedRear + TRAVEL * prog;
  const free = SEC.springFree;
  // the spring follows the injector to its free length, then rings down a little
  const tFree = FLIGHT * 0.42;
  const ring = dt > tFree ? 0.55 * Math.exp(-(dt - tFree) / 0.07) * Math.sin((dt - tFree) * 70) : 0;
  return {
    rear, inTube: rear < SEC.xMouth, flying: u < 1, embedded: u >= 1, impact: dt - FLIGHT,
    springFront: Math.min(rear, free) + ring, cutT: dt, heat, pulse,
  };
};

// ---------------------------------------------------------------------------------------------------------------
// Camera: square-on from the insect's left, a little above, the target at frame left; locked off.
// ---------------------------------------------------------------------------------------------------------------
// The eye sits square over the insect's middle (x = 60) and the picture is shifted (the image plane stays parallel to
// the insect's side), so the target's face is seen a little more open at frame left while the whole tube stays in.
const CAM = {eyeX: 60, x: 33.5, y: 24, el: 5 * DEG, D: 220, f: 3000, cy: 940};
export const S09_CAM: Cam = (() => {
  const eye: V3 = [CAM.eyeX, CAM.y + CAM.D * Math.sin(CAM.el), CAM.D * Math.cos(CAM.el)];
  const c0 = lookAt(eye, [CAM.eyeX, CAM.y, 0], CAM.f, 540, CAM.cy);
  // shift the principal point so world x = CAM.x lands on the frame centre
  const p = proj(c0, [CAM.x, CAM.y, 0]);
  return {...c0, cx: c0.cx + (540 - p[0])};
})();

/** the injector's world frame for a rear position along the launch frame */
const injFrame = (rear: number): Frame => ({o: toW(S09_LAUNCH_FRAME, [rear, SEC.y, 0]), x: S09_LAUNCH_FRAME.x, y: S09_LAUNCH_FRAME.y, z: S09_LAUNCH_FRAME.z});
/** where the injector rests in the target (for S10) */
export const S09_EMBED_FRAME: Frame = injFrame(SEC.loadedRear + TRAVEL);

export const S09: React.FC<ShotProps> = ({f}) => {
  const t = f / FPS;
  const cam = S09_CAM;
  const pose = s09Pose(t);
  const L = s09Launch(t);
  // until the release the injector rides in the posed body frame (it lines up with it); from the release it follows the
  // launch line, free of the body's recoil
  const inTubeFrame = (fr: Frame) => (L.cutT === null ? fr : injFrame(L.rear));
  const gear = (
    <g>
      <PackBase cam={cam} f={pose.frame} part="back" />
      <SectionTube
        id="s09m" cam={cam} f={pose.frame}
        s={{injRear: L.inTube ? L.rear : null, springFront: L.springFront, line: {cutT: L.cutT}, heat: L.heat, pulse: L.pulse}}
        injector={(fr) => <Injector id="s09ti" cam={cam} s={{f: inTubeFrame(fr), plunger: 0}} />}
      />
      <PackBase cam={cam} f={pose.frame} part="front" />
    </g>
  );
  const items: {z: number; el: React.ReactNode}[] = [];
  items.push({z: depth(cam, [-8, 30, 0]), el: <TargetFixture key="tgt" id="s09t" cam={cam} />});
  items.push({z: depth(cam, pose.frame.o), el: <Roach key="roach" pose={pose} cam={cam} o={{id: 's09r', gear}} />});
  items.push(...arenaWalls(cam, {skip: ['s', 'e', 'w']}).map((w) => ({z: w.z, el: w.el})));
  items.sort((a, b) => b.z - a.z);
  const out = !L.inTube;
  const inj = out ? injFrame(L.rear) : null;
  // short motion trail while it flies
  const trail = inj && L.flying ? [0.45, 0.25, 0.12].map((a, k) => ({a, o: add(inj.o, mul(inj.x, -(k + 1) * 3.4))})) : [];
  // the silicone gives a little at the impact
  const jig = L.impact >= 0 ? Math.exp(-L.impact / 0.06) * Math.sin(L.impact * 70) : 0;
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920">
      <LabBackdrop id="s09b" cam={cam} blur={16} />
      <ArenaFloor id="s09f" cam={cam} />
      <FixtureShadow cam={cam} />
      {items.map((it) => it.el)}
      {trail.map((tr, k) => (
        <g key={k} opacity={tr.a}>
          <Injector id={`s09tr${k}`} cam={cam} s={{f: {...inj!, o: tr.o}, plunger: 0}} />
        </g>
      ))}
      {inj && (
        <g transform={jig ? `translate(${fmt(-jig * 2)} 0)` : undefined}>
          <Injector id="s09inj" cam={cam} s={{f: inj, plunger: 0, needleEnd: L.embedded ? NEEDLE_TIP - EMBED : undefined}} />
          {L.embedded && (() => {
            const p = proj(cam, [0.1, inj.o[1], inj.o[2]]);
            const r = 1.1 * scaleAt(cam, [0, inj.o[1], 0]);
            return <ellipse cx={fmt(p[0])} cy={fmt(p[1])} rx={fmt(r * 0.22)} ry={fmt(r)} fill="#B9705C" opacity={0.6} />;
          })()}
        </g>
      )}
    </svg>
  );
};
export const S09_T_INJ = T_INJ;
