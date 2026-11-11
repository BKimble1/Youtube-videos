// V4 lab sequences: V3's picture with every HUD, callout, panel and tag removed; one clean 68 s graphic.
// V3 lab sequences (the machine is the subject):
//  A  0-5     frame 0: extreme macro, the gripper bringing a tiny module down onto a fixed, living insect (already moving);
//             the wrist camera locks on the implant point and the module makes a fine alignment correction; implant,
//             press, latch, cyan LED; a quick smooth pull back to the workstation (one platform on a slider, the
//             holder, the arm), with a dashed, labelled illustration of the cycle repeating; an industrial macro
//             inspection of the installed module; the rods lift and the insect walks off while the machine resets.
//  B  4.3-6.4 "68 seconds": the next cycle, sped up, under a step bar FIX . SCAN . GRASP . IMPLANT . LATCH . LET GO . RELEASE.
//  C1 6.4-10.4 close on the gripper taking the next module from the holder; one continuous shot of the placement.
//  C2 10.4-14.9 extreme macro of the module and its attachment points; the station console's wireless test, briefly;
//             the rods lift and the insect leaves the platform, turning.
//  G  26.7-end a finished cyborg leaves the platform; pull back as the machine resets (platform out and back with the
//             next insect, arm to the holder); the next module comes into position and down; into frame 0's macro.
import React from 'react';
import {add3, Orbit, V3} from '../core/three';
import {at, chain} from '../camera';
import {DUR, ring, ss} from '../lib';
import {PACK_SEAT} from '../roach/rig';
import {LabView3} from '../v3/LabView3';
import {armAt3, bugAt3, PLAT_H} from '../v3/story3';
import {HOLD_SEAT} from '../v3/machine3';
import {Badge68} from './overlays4';

const SEAT: V3 = [0, PACK_SEAT[0], PACK_SEAT[2] + PLAT_H];
/** frame 0's macro (a pure function of tau, so the end can land on it exactly) */
export const macro0 = (tau: number): Orbit => at(add3(SEAT, [0, -2, 4 + 0.6 * tau]), 140 + 3 * tau, 20, 29, 1010);
const bodyAt = (k: number, t: number, dz = 6): V3 => {
  const b = bugAt3(k, t);
  return b ? add3(b.st.body.o, [0, 0, dz]) : SEAT;
};

export const camA_C3 = (t: number): Orbit =>
  chain(t, (tt) => macro0(tt), [
    // the latch done, a quick smooth pull back: the whole workstation
    {a: 1.05, b: 1.95, o: () => at([-36, -18, 14], 146, 44, 4.2, 980)},
    // into the installed module (industrial macro inspection)
    {a: 1.98, b: 2.9, o: (tt) => at(add3(SEAT, [0, 2 - 3 * ss(tt, 2.4, 3.2), 1]), 120, 62, 44, 960)},
    // the machine resets while the insect walks off
    {a: 3.1, b: 4.15, o: () => at([-8, 6, 10], 168, 30, 9, 1020)},
    // B: over the station for the sped-up cycle
    {a: 4.2, b: 4.8, o: () => at([-30, -26, 10], 150, 54, 6.6, 1180)},
    // C1: close on the gripper at the holder
    {a: 6.2, b: 6.95, o: () => at(add3(HOLD_SEAT, [0, 0, 6]), 150, 26, 22, 1000)},
    {a: 7.45, b: 8.45, o: (tt) => at(add3(armAt3(tt).arm.tcp, [0, 0, 2]), 128, 30, 17, 1000)},
    // one continuous placement shot, low three-quarter
    {a: 8.3, b: 9.3, o: () => at(add3(SEAT, [1, 4, -2]), 114, 17, 27, 1000)},
    // C2: extreme macro of the module and its attachment points
    {a: 10.15, b: 10.95, o: (tt) => at(add3(SEAT, [0, 3 - 4 * ss(tt, 10.6, 11.6), 0.5]), 104, 58, 48, 960)},
    // the station: rods lift, the insect leaves the platform turning, the machine stays in the foreground
    {a: 11.3, b: 12.55, o: () => at([-4, 26, 10], 176, 26, 7.4, 1060)},
    {a: 13.0, b: 14.3, o: () => at([-26, 70, 8], 170, 42, 5.4, 1060)},
  ]);

const kick = (t: number) => ({x: 2 * ring(t, 1.02, 9, 0.06) + 1.6 * ring(t, 10.15, 9, 0.06), y: 4 * ring(t, 1.02, 8, 0.06) + 3 * ring(t, 10.15, 8, 0.06)});
const pulseFor = (t: number) => (k: number) => {
  if (k !== 2) return undefined;
  const u = (t - 12.62) / 0.3;
  return u > 0 && u < 1.35 ? {t: u, side: 1 as const} : undefined;
};
export const LabA_C4: React.FC<{t: number; fkey: string}> = ({t, fkey}) => {
  const O = camA_C3(t);
  const kk = kick(t);
  return (
    <div style={{position: 'absolute', inset: 0, transform: `translate(${kk.x.toFixed(2)}px, ${kk.y.toFixed(2)}px)`}}>
      <LabView3
        t={t}
        orbit={O}
        fkey={fkey}
        o={{
          pulse: pulseFor(t),
          xray: (k) => (k === 0 ? ss(t, 0.7, 0.8) * (1 - ss(t, 1.05, 1.2)) + ss(t, 2.1, 2.3) * (1 - ss(t, 3.0, 3.2)) : k === 2 ? ss(t, 8.95, 9.3) * (1 - ss(t, 10.2, 10.4)) + ss(t, 10.4, 10.6) * (1 - ss(t, 11.4, 11.6)) + ss(t, 12.5, 12.62) * (1 - ss(t, 13.0, 13.1)) : 0),
          pronoOp: (k) => (k === 0 ? 1 - 0.6 * (ss(t, 0.7, 0.8) * (1 - ss(t, 1.05, 1.2)) + ss(t, 2.1, 2.3) * (1 - ss(t, 3.0, 3.2))) : k === 2 ? 1 - 0.6 * (ss(t, 8.95, 9.3) * (1 - ss(t, 10.2, 10.4)) + ss(t, 10.4, 10.6) * (1 - ss(t, 11.4, 11.6))) : undefined),
        }}
      />
      <Badge68 t={t} t0={4.43} t1={5.58} out={6.3} />
    </div>
  );
};

// ------------------------------------------------------------------ the ending
export const camG3 = (t: number): Orbit => chain(t, (tt) => at(add3(bodyAt(3, tt, 6), [0, 6, 0]), 178, 16, 13, 1060), [
  // pull back: the workstation resets (platform out and back with the next insect, arm to the holder)
  {a: 27.3, b: 28.4, o: () => at([-34, -20, 14], 150, 40, 4.4, 1000)},
  // the next module comes into position and down
  {a: 28.9, b: 30.0, o: (tt) => at(add3(armAt3(tt).arm.tcp, [0, 0, -8]), 140, 22, 14, 940)},
  // into frame 0's macro
  {a: 30.1, b: DUR, o: (tt) => macro0(tt - DUR)},
]);

export const LabG4: React.FC<{t: number; fkey: string}> = ({t, fkey}) => <LabView3 t={t} orbit={camG3(t)} fkey={fkey} o={{dof: 1.1}} />;
