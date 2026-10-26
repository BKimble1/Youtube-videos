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

export const s03Cam = (t: number, eyeA: V3 = [-150, 120, 520], eyeB: V3 = [-120, 112, 470], tgt: V3 = [260, 330, -380], f = 900): Cam => {
  const u = sr(t, 3.4, 5.0);
  return lookAt(lerp3(eyeA, eyeB, u), tgt, f, 540, 960);
};

export const S03Scene: React.FC<{t: number; cam: Cam; operator?: (cam: Cam) => React.ReactNode}> = ({t, cam, operator}) => {
  const {path, s, L, settle} = s01Motion(t);
  const pose = poseRoach({path, s, t, search: 0.6, offset: [0, -settle, 0]});
  const items: Item[] = [
    {z: depth(cam, [-8, 30, 0]), el: <TargetFixture key="tgt" id="s03t" cam={cam} />},
    {z: depth(cam, pose.frame.o), el: <Roach key="r" pose={pose} cam={cam} o={{id: 's03r', gear: <Gear id="s03g" cam={cam} f={pose.frame} g={{kind: 'injector', loaded: false, latched: false, springExt: 1}} />}} />},
    ...(L.inj ? [{z: depth(cam, L.inj.o) - 1, el: <Injector key="inj" id="s03inj" cam={cam} s={{f: L.inj, plunger: 0, needleEnd: NEEDLE_TIP - EMBED}} />}] : []),
    ...arenaWalls(cam),
  ];
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920">
      <LabBackdrop id="s03b" cam={cam} blur={10} />
      <Monitor cam={cam} id="s03m" />
      {operator && operator(cam)}
      <Bench cam={cam} />
      <ArenaFloor id="s03f" cam={cam} fade={2600} />
      <FixtureShadow cam={cam} />
      <Sorted items={items} />
    </svg>
  );
};

export const S03: React.FC<ShotProps> = ({f}) => {
  const t = f / FPS;
  return <S03Scene t={t} cam={s03Cam(t)} />;
};
