// The shot list. Each shot is a time range and a view (camera + station) as a pure function of time. Times come from
// the measured narration (lib/time.ts), so every action lands on its words.
import React from 'react';
import {Scene3D} from './Scene3D';
import {benchState} from './world/bench';
import {benchItems} from './world/benchView';
import {cam, camPath} from './lib/campath';
import {E, T} from './lib/time';
import {Cam} from './lib/r3';
import {FEED_CAM, Operator} from './art/Operator';
import {mix, ss5} from './lib/v3';
import {R0, rampItems, rampXf} from './world/ramp';
import {C0, runoutItems} from './world/runout';

export type Shot = {id: string; from: number; to: number; view: (t: number) => React.ReactNode};

const bench = (c: Cam, t: number) => {
  const s = benchState(t);
  return <Scene3D cam={c} build={(P) => benchItems(P, s)} />;
};

// ---- A: the bench, 0 .. "A person"
// A1 the hook (the module diagonal in the foreground, the robot beyond, both participating ends in view), then one
// continuous move along the joined module: its telescoping housing (A2), then on to the joint at V1 (A3).
const tA2 = T("it's built"), tA3 = T('with magnets');
const camA = camPath([
  [0, cam([0.8, 0.44, 0.48], [0.25, 0.07, -0.02], 1450, {oy: 60})],
  [2.7, cam([0.76, 0.42, 0.45], [0.22, 0.07, -0.02], 1540, {oy: 60})],
  [tA2 + 0.75, cam([0.62, 0.3, 0.64], [0.35, 0.08, -0.02], 1350, {oy: 40})],
  [T('stretch') - 0.1, cam([0.46, 0.39, 0.84], [0.3, 0.1, -0.02], 1260, {oy: 60})],
  [E('shrink') - 0.15, cam([0.44, 0.37, 0.8], [0.29, 0.1, -0.02], 1290, {oy: 60})],
  [tA3 + 0.7, cam([0.28, 0.22, 0.2], [0.245, 0.035, 0.0], 2000, {oy: 0})],
  [E('ends') + 0.45, cam([0.276, 0.215, 0.19], [0.245, 0.035, 0.0], 2100, {oy: 0})],
], 'inout');

// ---- O: the operator station
const tO = T('a person');
const tA4 = T('guiding');

// ---- A4/A5: back on the bench from the feed camera; the robot rears up onto the module and walks on it
const feed = FEED_CAM(tA4);
const camB = camPath([
  [tA4, feed],
  [T('place') + 0.3, cam([0.1, 0.3, 0.9], [0.14, 0.1, 0.0], 1420)],
  [E('connects') + 0.1, cam([0.4, 0.24, 0.45], [0.17, 0.13, 0.0], 1650, {oy: 60})],
  [E('extra piece') + 0.25, cam([0.62, 0.14, 0.42], [0.42, 0.04, 0.0], 1500, {oy: 120})],
  [E('stick') + 0.2, cam([0.18, 0.22, 0.95], [0.08, 0.1, 0.0], 1300, {oy: 60})],
  [T('helping') + 0.3, cam([0.08, 0.22, 0.95], [-0.02, 0.1, 0.0], 1300, {oy: 60})],
], 'inout');

/** the operator shot ends by pushing into the monitor; at the cut the monitor fills the frame centre exactly where
 *  the next shot (the same camera, full frame) continues */
/** the operator's key presses (s) */
export const KEYS = [T('controls') + 0.12, T('movements') + 0.15, T('guiding') - 0.12];
const operator = (t: number) => {
  // a smooth push that arrives at rest on the cut, where the next shot starts from rest on the same camera
  const k = ss5(tA4 - 0.8, tA4 - 0.02, t);
  // base framing: the station a little closer (scale 1.18 about the desk); at the cut the monitor centre (370, 800)
  // sits at the screen centre at the feed's native scale (1080 / 600)
  const b = 1.18, bx = 540 - 600 * b, by = 1060 - 1000 * b;
  const sc = mix(b, 1080 / 600, k);
  const cx = 370, cy = 800;
  const tx = mix(bx, 540 - cx * (1080 / 600), k), ty = mix(by, 960 - cy * (1080 / 600), k);
  return (
    <div style={{position: 'absolute', inset: 0, transformOrigin: '0 0', transform: `translate(${tx}px, ${ty}px) scale(${sc})`}}>
      <Operator t={t} keyT={KEYS} />
    </div>
  );
};

// ---- B: the ramp race (a cut to the inclined test). A slow pan with the robots; the marks stay fixed.
const camR = camPath([
  [R0, cam([0.46, 0.97, 1.12], [0.78, 0.1, -0.07], 1300, {oy: 0})],
  [C0, cam([0.2, 0.93, 1.1], [0.52, 0.08, -0.07], 1300, {oy: 0})],
], 'none');

// ---- C: the module station (a cut: a separate demonstration). One continuous camera to the end.
const camC = camPath([
  [C0, cam([0.82, 0.3, 0.74], [0.4, 0.09, 0.02], 1450, {oy: 40})],
  [T('stops working') + 0.25, cam([0.78, 0.3, 0.56], [0.47, 0.1, 0.0], 1650, {oy: 60})],
  [T('it can') + 0.1, cam([0.86, 0.42, 0.76], [0.42, 0.07, 0.04], 1400, {oy: 40})],
  [T('and attach') + 0.35, cam([0.86, 0.52, 0.66], [0.5, 0.05, 0.1], 1600, {oy: 30})],
  [E('replacement') + 0.4, cam([0.75, 0.62, 1.05], [0.3, 0.05, 0.12], 1250, {oy: 30})],
  [T('beside') + 0.2, cam([0.12, 0.86, 1.6], [-0.14, 0.03, 0.32], 1150, {oy: 0})],
  [T('could') + 0.35, cam([-0.75, 0.55, 1.25], [-0.3, 0.02, 0.47], 1500, {oy: 0})],
  [E('body part') + 0.9, cam([-0.72, 0.52, 1.18], [-0.3, 0.02, 0.46], 1580, {oy: 0})],
], 'inout');

export const SHOTS: Shot[] = [
  {id: 'A1-A3 hook, rod, magnets', from: 0, to: tO - 0.04, view: (t) => bench(camA(t), t)},
  {id: 'O operator', from: tO - 0.04, to: tA4, view: operator},
  {id: 'A4-A5 into place, walking stick', from: tA4, to: R0, view: (t) => bench(camB(t), t)},
  {id: 'B ramp race', from: R0, to: C0, view: (t) => <Scene3D cam={camR(t)} xf={rampXf} build={(P, Pw) => rampItems(P, Pw, t)} />},
  {id: 'C module station', from: C0, to: 999, view: (t) => <Scene3D cam={camC(t)} build={(P) => runoutItems(P, t)} />},
];

/** caption centre height per caption index (and time) */
export const capPlace = (i: number, t: number) => {
  void i;
  if (t >= tO - 0.04 && t < tA4) return 1600;
  // the ending: a little lower, clear of the broken robot in the tray (still above the Shorts title band)
  if (t >= T('so that') - 0.1) return 1575;
  return 1500;
};
