// E and G in the assembly cell.
//  E  "And here's the crazy part" (after "actual living insects"): straight down over the cell, the camera gliding along
//     the conveyor: insects waiting under their clamps, one being fitted at the station (shown sped up), finished
//     cyborgs walking off into the arena. A research prototype that fits one insect at a time.
//  G  "Which means we're not just building robots anymore. We're turning bugs into them.": low and close in front of
//     a cyborg walking toward the lens, the station blurred behind it with the next insect already clamped and the arm
//     fetching the next backpack. On the last line the camera cranes up over the cyborg's backpack (the cyborg walks
//     out under the lens) and settles on exactly the frame-0 view of the next insect, the backpack coming down: the loop.
import React from 'react';
import {add3, V3} from '../core/three';
import {at, chain} from '../camera';
import {DUR, ss} from '../lib';
import {LabView} from './LabView';
import {HOOK_O} from './hook';
import {Tag} from './overlays';
import {walkState, Path} from '../roach/gait';
import {cyborgGroup} from '../roach/compose';
import {seatFrame} from '../kit/backpack';
import {PACK_SEAT} from '../roach/rig';
import {toW} from '../core/frame';

export const E0 = 20.6, E1 = 22.27, G0 = 26.74;

export const LabE: React.FC<{t: number; fkey: string}> = ({t, fkey}) => {
  const u = ss(t, E0, E1 + 0.3);
  const O = at([-150 + 190 * u, 10 + 70 * u, 0], 158 - 10 * u, 84, 2.25 + 0.25 * u, 960);
  const a = ss(t, E0 + 0.1, E0 + 0.35) * (1 - ss(t, E1 - 0.15, E1));
  return (
    <div style={{position: 'absolute', inset: 0}}>
      <LabView t={t} orbit={O} fkey={fkey} o={{dof: 0}} />
      <Tag text="LAB PROTOTYPE" sub="one insect at a time · sped up" a={a} y={200} />
    </div>
  );
};

// the cyborg in G: walks out of the arena toward the lens, past the station's next insect
const RG: Path = {p0: [35, 90, 0], yaw0: 68, segs: [{len: 1000}]};
const rgS = (t: number) => 34 * Math.max(0, t - G0 + 0.6);
export const rgState = (t: number) => walkState(RG, rgS(t), {antTw: [20 + 7 * Math.sin(t * 2.6), 20 - 7 * Math.sin(t * 2.6)], antLift: [16, 14], headPitch: -6, breathe: 0.5});
const rgPack = (t: number): V3 => toW(rgState(t).body, [PACK_SEAT[0], 0, PACK_SEAT[2] + 1]);

export const camG = (t: number) => chain(t, (tt) => at(rgPack(tt), 158, 8, 27, 1060), [
  // hold close on the approaching cyborg (it nears the lens: the backpack grows)
  {a: G0, b: 28.6, o: (tt) => at(rgPack(tt), 158, 10, 31, 1080)},
  // "we're turning bugs into them": crane up over the backpack as the cyborg walks out under the lens, keeping both it
  // and the next insect on the station in frame ...
  {a: 28.9, b: 30.0, o: (tt) => at(add3(rgPack(tt), [-10, -26, 0]), 158, 34, 21, 1200)},
  {a: 29.75, b: 30.75, o: (tt) => at([20, 30, 6], 158, 44, 9.5, 1150 - 120 * ss(tt, 29.8, 30.8))},
  // ... and settle on the frame-0 view of the next insect
  {a: 30.45, b: DUR, o: (tt) => HOOK_O(tt - DUR)},
]);

export const LabG: React.FC<{t: number; fkey: string}> = ({t, fkey}) => {
  const O = camG(t);
  const st = rgState(t);
  return (
    <LabView
      t={t}
      orbit={O}
      fkey={fkey}
      o={{dof: 1.4, extra: (B) => [cyborgGroup(B, st, {F: seatFrame(st.body, PACK_SEAT), led: 0.85 + 0.15 * Math.sin(t * 7), hook: 1}, 'rg', {}).item]}}
    />
  );
};
