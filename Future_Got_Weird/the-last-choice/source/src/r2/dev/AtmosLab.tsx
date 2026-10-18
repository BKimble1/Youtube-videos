// Fire / smoke / atmosphere check on the real set (page prop). Not part of the film. Film time = page base + frame/30.
//   0 close fires: the burnt car on the crater rim, debris on the far rim (T 110)
//   1 the south flank: rooms burning behind the blown-out facade, the spilled facade alight (T 100)
//   2 the ridge looking east down the avenue (B3-like, T 25): wrecks burning, room fires, blocks burning far off
//   3 the opening aerial (AERIAL from → to over 6.6 s)
//   4 high over the avenue near the end of the pullback (T 225)
//   5 depth test: low on the avenue at x 175 looking back west — plumes behind the frontage must be hidden by it
//   6 a burning block, medium distance (T 60)
//   7 contrast test: a figure in front of the ruin fires with their smoke drifting across (T 45)
import React from 'react';
import {useCurrentFrame} from 'remotion';
import {Scene, Item, makeView, Cam3, figureView} from '../engine';
import {setItems} from '../world/set';
import {atmosItems} from '../world/atmos';
import {lightFor, MATS} from '../world/lighting';
import {groundH} from '../world/ground';
import {AERIAL} from '../world/plan';
import {Actor} from '../../rig/actor';
import {CAST} from '../../rig/looks';
import {lerp3, smooth, clamp} from '../../kit/math';
import {PULLBACK} from './SetLab';

const PAGES = ['close fires', 'south flank rooms', 'ridge east', 'aerial', 'pullback high', 'depth test', 'burning block', 'contrast'];

const standIn = (key: string, x: number, z: number, heading: number, t: number, look = CAST.clerkC): Item => {
  const pos = {x, y: groundH(x, z), z};
  return {
    kind: 'sprite', key, pos,
    draw: (c) => {
      const fv = figureView(c.view, pos, heading);
      return <Actor look={look} t={t} x={fv.x} y={fv.y} s={fv.s250} yaw={fv.yaw} ink={clamp(fv.s250 * 4, 0.8, 4)} />;
    },
  };
};

const camFor = (page: number, f: number): {cam: Cam3; t: number} => {
  switch (page) {
    case 0: return {cam: {pos: {x: 48.5 + f * 0.01, y: 2.6, z: 11}, target: {x: 58, y: 1.6, z: 2}, fov: 44}, t: 110 + f / 30};
    case 1: return {cam: {pos: {x: 30, y: 3.2, z: -6}, target: {x: 50, y: 8, z: 19}, fov: 50}, t: 100 + f / 30};
    case 2: return {cam: {pos: {x: 2.2, y: 6.4, z: 1.4}, target: {x: 140, y: 9, z: -6}, fov: 40}, t: 25 + f / 30};
    case 3: {
      const u = smooth(f / 198);
      return {cam: {pos: lerp3(AERIAL.from.pos, AERIAL.to.pos, u), target: lerp3(AERIAL.from.target, AERIAL.to.target, u), fov: 44}, t: f / 30};
    }
    case 4: {
      const P = PULLBACK.pos, T = PULLBACK.tgt;
      return {cam: {pos: lerp3(P[5], P[6], 0.5), target: lerp3(T[5], T[6], 0.5), fov: 46}, t: 225 + f / 30};
    }
    case 5: return {cam: {pos: {x: 176, y: 2.2, z: 9}, target: {x: 60, y: 22, z: -24}, fov: 50}, t: 120 + f / 30};
    case 6: return {cam: {pos: {x: 150, y: 34, z: 4}, target: {x: 236, y: 30, z: -34}, fov: 42}, t: 60 + f / 30};
    default: return {cam: {pos: {x: 6.5, y: 5.6, z: 3.2}, target: {x: -22, y: 3.5, z: -3}, fov: 42}, t: 45 + f / 30};
  }
};

export const AtmosLab: React.FC<{page?: number}> = ({page = 0}) => {
  const f = useCurrentFrame();
  const {cam, t} = camFor(page, f);
  const view = makeView(cam);
  const light = lightFor(t);
  const figs: Item[] = [];
  if (page === 0) figs.push(standIn('a', 53.5, 6.5, 70, t, CAST.clerkA));
  if (page === 7) figs.push(standIn('b', 3.0, 1.8, 250, t, CAST.honest), standIn('c', 0.9, -1.0, 280, t, CAST.clerkC));
  const items: Item[] = [...setItems(view, t), ...atmosItems(view, t), ...figs];
  return (
    <Scene view={view} light={light} mats={MATS} items={items} t={t}
      over={<text x={24} y={44} fill="#FFF6E8" fontSize={28} fontFamily="sans-serif">{`p${page} ${PAGES[page] ?? ''}  t=${t.toFixed(2)}`}</text>} />
  );
};
