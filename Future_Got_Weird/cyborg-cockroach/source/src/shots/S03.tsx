// S03 (3.40-5.00 s) "...decides when it shoots." A new composition that establishes the geography: the arena on the
// bench in the foreground with the medic insect beside the target (the injector still in it), and the operator standing
// behind the bench on the right, remote in hand, looking down-left at the insect: a clear eyeline from controller to
// insect. A slow eased push holds the relationship.
import React from 'react';
import {lookAt, depth, proj, scaleAt, Cam} from '../lib/cam';
import {V3, lerp3} from '../lib/v3';
import {sr} from '../lib/ease';
import {poseRoach} from '../rig/roach';
import {Roach} from '../rig/Roach';
import {Gear, Injector} from '../rig/Gear';
import {NEEDLE_TIP, EMBED} from '../rig/launch';
import {LabBackdrop, ArenaFloor, TargetFixture} from '../sets/Lab';
import {Bench, arenaWalls, Monitor, ROOM} from '../sets/LabRoom';
import {Sorted, Item} from '../lib/scene';
import {s01Motion, FixtureShadow} from './S01';
import {ShotProps} from './index';
import {FPS} from '../timeline';
import {OperatorAtBench, operatorAtBench} from '../crew/operator';

// a low view from beside the arena, up to the operator: one slow eased push toward the insect over the shot
export const s03Cam = (t: number, eyeA: V3 = [85, 78, 307], eyeB: V3 = [80, 75, 288], dir: V3 = [0.12, 0.098, -1], f = 800): Cam => {
  const u = sr(t, 3.4, 5.0);
  const e = lerp3(eyeA, eyeB, u);
  return lookAt(e, [e[0] + dir[0] * 1000, e[1] + dir[1] * 1000, e[2] + dir[2] * 1000], f, 540, 960);
};

/** the dc rig's size: head centre height above the hip at scale 1 (px) -> mm per px (head centre 0.67 m above the hip) */
const HEAD_PX = Math.abs(operatorAtBench({x: 0, y: 0, scale: 1}).head.y);
const MM_PER_PX = 670 / HEAD_PX;

/** the operator placed in the projected room: hip anchor, scale from the camera, body below the bench's far edge hidden */
export const operatorIn = (cam: Cam, t: number, opts: {layer: 'body' | 'hands'; gaze: [number, number]; press?: number; exprMix?: number}) => {
  const hip = ROOM.operator.hip;
  const p = proj(cam, hip);
  const scale = scaleAt(cam, hip) * MM_PER_PX;
  const bench = proj(cam, [hip[0], 0, ROOM.bench.z0]);
  return (
    <OperatorAtBench id={`op-${opts.layer}`} x={p[0]} y={p[1]} scale={scale} t={t} expr="focus" exprTo="pleased" exprMix={opts.exprMix ?? 0}
      thumbPress={opts.press ?? 0} led="fired" gazeX={opts.gaze[0]} gazeY={opts.gaze[1]} benchTopY={bench[1]} farHand="bench" layer={opts.layer} />
  );
};

export const S03Scene: React.FC<{t: number; cam: Cam; operator?: (cam: Cam) => React.ReactNode; hands?: (cam: Cam) => React.ReactNode}> = ({t, cam, operator, hands}) => {
  const {path, s, L, settle} = s01Motion(t);
  const pose = poseRoach({path, s, t, search: 0.6, offset: [0, -settle, 0]});
  const items: Item[] = [
    {z: depth(cam, [-8, 30, 0]), el: <TargetFixture key="tgt" id="s03t" cam={cam} />},
    {z: depth(cam, pose.frame.o), el: <Roach key="r" pose={pose} cam={cam} o={{id: 's03r', gear: <Gear id="s03g" cam={cam} f={pose.frame} g={{kind: 'injector', loaded: false, latched: false, springExt: 1}} />}} />},
    ...(L.inj ? [{z: depth(cam, L.inj.o) - 1, el: <Injector key="inj" id="s03inj" cam={cam} s={{f: L.inj, plunger: 0, needleEnd: NEEDLE_TIP - EMBED}} />}] : []),
    ...arenaWalls(cam, {skip: ['n', 's']}),
  ];
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920">
      <LabBackdrop id="s03b" cam={cam} blur={10} />
      <Monitor cam={cam} id="s03m" />
      {operator && operator(cam)}
      <Bench cam={cam} />
      {hands && hands(cam)}
      <ArenaFloor id="s03f" cam={cam} fade={2600} />
      <FixtureShadow cam={cam} />
      <Sorted items={items} />
    </svg>
  );
};

export const S03: React.FC<ShotProps> = ({f}) => {
  const t = f / FPS;
  const cam = s03Cam(t);
  const {path, s} = s01Motion(t);
  const head = proj(cam, poseRoach({path, s, t}).frame.o);
  // he watches the insect; a small satisfied softening as "shoots" lands
  const mix = sr(t, 4.1, 4.7) * 0.6;
  return (
    <S03Scene t={t} cam={cam} operator={(c) => operatorIn(c, t, {layer: 'body', gaze: head, exprMix: mix})} hands={(c) => operatorIn(c, t, {layer: 'hands', gaze: head, exprMix: mix})} />
  );
};
