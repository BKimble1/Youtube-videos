// V2 shot list. Every action is timed from the measured narration (lib/time.ts); camera paths are keyed in world
// coordinates and pass through their keys with continuous velocity (lib/campath.ts).
import React from 'react';
import {Scene3D} from '../Scene3D';
import {cam, camPath, Key} from '../lib/campath';
import {E, T} from '../lib/time';
import {Cam} from '../lib/r3';
import {Operator} from '../art/Operator';
import {add, mix, ss, ss5, v3, V3} from '../lib/v3';
import {rampXf} from '../world/ramp';
import {earlyItems, lateItems, rampItems2} from './views';
import {DUR, EARLY_END, H2, L0} from './yard';
import {PT} from './pair';
import {ramp2State} from './ramp2';
import {Link} from '../rig/truss';

export type Shot = {id: string; from: number; to: number; view: (t: number) => React.ReactNode};

// ---------------------------------------------------------------- the hook (pair at the origin)
/** the opening camera: the transfer, tight; it is also where the film ends (at H2) */
export const HOOK0 = cam([0.72, 0.44, 0.6], [0.19, 0.06, 0.12], 1500);
const shift = (c: Cam, o: V3): Cam => ({...c, eye: add(c.eye, o), target: add(c.target, o)});

const tO = T('a person') - 0.04;
const tB = T('controls') + 0.27; // back to the robot: its response
const camA = camPath([
  [0, HOOK0],
  [PT.snap1, cam([0.66, 0.4, 0.6], [0.15, 0.07, 0.12], 1620)],
  [PT.snap2 + 0.05, cam([0.64, 0.42, 0.66], [0.2, 0.08, 0.06], 1560)],
  [E('parts') + 0.15, cam([0.55, 0.56, 0.98], [0.12, 0.13, 0.05], 1420)],
  // the robot walks off (left): full view, then a low side profile on the stretch, then the motor cut-away on the shrink
  [T('motorized') + 0.1, cam([-0.05, 0.52, 1.05], [-0.02, 0.12, 0.02], 1330)],
  [T('stretch') - 0.05, cam([-0.16, 0.17, 0.82], [-0.14, 0.11, 0.02], 1480)],
  [T('shrink') + 0.1, cam([-0.02, 0.15, 0.48], [-0.12, 0.07, 0.08], 1750)],
  // along the module to its joint at the rear vertex (a gentle dolly that widens while it travels, then settles in
  // close): the connector cut-away while the joint angles change. The next module is revealed after the operator.
  [T('with') + 0.02, cam([-0.02, 0.21, 0.5], [-0.05, 0.055, 0.05], 1560)],
  [T('magnets') + 0.5, cam([0.0, 0.2, 0.37], [0.03, 0.04, 0.03], 1800)],
  [tO, cam([-0.01, 0.2, 0.33], [0.03, 0.04, 0.02], 1950)],
], 'inout');

// ---------------------------------------------------------------- the operator: a key press, nothing more
export const KEYS2 = [T('controls') + 0.1];
const operator = (t: number) => {
  const sc = 1.32;
  const tx = 540 - 560 * sc, ty = 980 - 1080 * sc;
  const feedCam = cam([-0.3, 0.6, 1.05], [-0.3, 0.08, 0.05], 1250);
  return (
    <div style={{position: 'absolute', inset: 0, transformOrigin: '0 0', transform: `translate(${tx}px, ${ty}px) scale(${sc})`}}>
      <Operator t={t} keyT={KEYS2} feed={(tt) => <Scene3D cam={feedCam} build={(P) => earlyItems(P, tt)} idp="mon" />} />
    </div>
  );
};

// ---------------------------------------------------------------- the robot responds; S guided in and connected
const camB = camPath([
  [tB, cam([-0.3, 0.5, 1.02], [-0.4, 0.07, 0.08], 1320)],
  [T('guiding') + 0.2, cam([-0.32, 0.36, 0.86], [-0.46, 0.05, 0.14], 1500)],
  [T('connects') - 0.2, cam([-0.33, 0.18, 0.52], [-0.47, 0.03, 0.16], 1850)],
  [E('connects') + 0.1, cam([-0.33, 0.22, 0.62], [-0.48, 0.04, 0.15], 1700)],
  [EARLY_END, cam([-0.28, 0.5, 1.12], [-0.42, 0.08, 0.05], 1280)],
], 'inout');

// ---------------------------------------------------------------- the ramp: one side-tracking view
const rampTrack = (t: number) => ramp2State(t).fx;
const rk: Key[] = [];
for (let k = 0; k <= 8; k++) {
  const t = mix(EARLY_END, L0, k / 8);
  // a smoothed follow point: the average front position over half a second
  let f = 0;
  for (let j = -5; j <= 5; j++) f += rampTrack(Math.min(L0, Math.max(EARLY_END, t + j * 0.05)));
  f /= 11;
  const tg = rampXf(v3(f + 0.14, 0.12, 0.0));
  rk.push([t, cam([tg.x - 0.12, tg.y + 0.5, 0.86], [tg.x, tg.y, tg.z - 0.04], 1700)]);
}
const camR = camPath(rk, 'none');

// ---------------------------------------------------------------- the late part: failure, repair, and the loop
const end = shift(HOOK0, H2);
const camC = camPath([
  [L0, cam([0.58, 0.36, 0.78], [0.2, 0.1, 0.0], 1450)],
  [T('stops working') + 0.3, cam([0.56, 0.3, 0.66], [0.24, 0.08, 0.0], 1600)],
  [T('it can') + 0.1, cam([0.5, 0.45, 0.98], [0.26, 0.05, 0.04], 1400)],
  [T('and attach') + 0.25, cam([0.62, 0.42, 0.72], [0.36, 0.05, -0.08], 1650)],
  [E('replacement') + 0.3, cam([0.45, 0.5, 0.95], [0.18, 0.08, -0.06], 1400)],
  // follow the dropped module in the foreground, then along the floor to the broken robot beside it
  [T('broken') + 0.1, cam([0.56, 0.22, 0.8], [0.4, 0.03, 0.12], 1550)],
  [E('beside it') - 0.1, cam([-0.25, 0.6, 1.15], [-0.55, 0.05, 0.12], 1250)],
  // lands on the opening camera (shifted to H2) on the last frame, at rest, so the cut back to frame 0 is invisible.
  // (No duplicate trailing key: a Catmull-Rom segment between two equal keys still bulges with the incoming tangent.)
  [DUR - 1 / 30, end],
], 'inout');

export const SHOTS2: Shot[] = [
  {id: 'H hook, rise, rods, magnets', from: 0, to: tO, view: (t) => <Scene3D cam={camA(t)} build={(P) => earlyItems(P, t, modA(t))} />},
  {id: 'O operator', from: tO, to: tB, view: operator},
  {id: 'B response, stick connects', from: tB, to: EARLY_END, view: (t) => <Scene3D cam={camB(t)} build={(P) => earlyItems(P, t)} />},
  {id: 'R ramp', from: EARLY_END, to: L0, view: (t) => <Scene3D cam={camR(t)} xf={rampXf} build={(P, Pw) => rampItems2(P, Pw, t)} />},
  {id: 'C failure, repair, loop', from: L0, to: 999, view: (t) => <Scene3D cam={camC(t)} build={(P) => lateItems(P, t)} />},
];

/** the explanation's cut-aways: the module's housing (motor, lead screw, nut) on "stretch and shrink", the connectors
 *  at the rear vertex on "magnets" */
const modA = (t: number) => {
  const cut = ss(T('stretch') - 0.2, T('stretch') + 0.15, t) * (1 - ss(E('shrink') + 0.1, E('shrink') + 0.35, t));
  const sec = ss(T('magnets') - 0.2, T('magnets') + 0.15, t) * (1 - ss(E('ends') + 0.05, E('ends') + 0.3, t));
  return (l: Link): Link => (l.id === 'M' ? {...l, cut, secB: sec} : l.id === 'O2' ? {...l, secA: sec} : l);
};

/** caption centre height per caption index (and time) */
export const capPlace2 = (i: number, t: number) => {
  void i;
  // the opening and the ending (the same composition): over the wall, clear of both robots and both contacts
  if (t < E('parts') + 0.3 || t >= T('could') - 0.1) return 330;
  if (t >= tO && t < tB) return 1640;
  return 1500;
};
void ss5;
