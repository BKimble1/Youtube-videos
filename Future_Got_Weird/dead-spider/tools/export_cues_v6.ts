// V6 sound cues read from the picture's own state (v3/world3.ts): needle contact, the pressure pulses, when the legs
// pass open, each leg's first contact with the block and with the second spider, the block leaving the bench and
// landing in the dish, the second spider leaving its platform. usage: esbuild bundle -> node out.cjs audio/cues_v6.json
import fs from 'fs';
import {DUR, WORDS} from '../source/src/v2/lib2';
import {BLOCK_H, blockAt, CUT, DISH, H_NEEDLE, hookPose, L_NEEDLE, labLegsFree, labPose, leafPose, natPose, s2At, T_DROP, T_LIFT_BLOCK, T_LIFT_S2, TM} from '../source/src/v6/world3';

const out = process.argv[2] ?? 'audio/cues_v6.json';
const scan = (fn: (t: number) => boolean, t0: number, t1: number) => {
  for (let t = t0; t <= t1; t += 1 / 240) if (fn(t)) return +t.toFixed(3);
  return null;
};
const mean = (e: number[]) => e.reduce((a, b) => a + b, 0) / e.length;
const contacts = (t0: number, t1: number) => {
  const hit: (number | null)[] = Array(8).fill(null);
  for (let t = t0; t <= t1; t += 1 / 240) {
    const P = labPose(t), free = labLegsFree(t);
    P.e.forEach((e, i) => {
      if (hit[i] === null && e > free[i] + 0.01) hit[i] = +t.toFixed(3);
    });
  }
  return hit;
};
const landings = () => {
  const ts: number[] = [];
  let prev = blockAt(T_DROP).c[2], falling = true;
  for (let t = T_DROP; t < T_DROP + 0.6; t += 1 / 960) {
    const z = blockAt(t).c[2];
    if (falling && z > prev + 1e-6 && prev < DISH.floor + BLOCK_H + 0.05) ts.push(+t.toFixed(3));
    falling = z <= prev;
    prev = z;
  }
  return ts;
};
/** first moment each leg passes an extension */
const legPass = (pose: (t: number) => {e: number[]}, t0: number, t1: number, thr: number) => Array.from({length: 8}, (_, i) => scan((t) => pose(t).e[i] > thr, t0, t1));
const cues = {
  DUR,
  WORDS,
  TM,
  CUT,
  hook: {
    contact: scan((t) => H_NEEDLE(t) <= 0, 0, 1), press: 0.36, legOpen: legPass(hookPose, 0.36, 1.2, 0.45), grip0: 1.05, grip1: 1.45, crane: 2.0, push2: 2.18, ease2: 2.66, push3: 3.42,
    move: scan((t) => mean(hookPose(t).e) > 0.85, 3.4, 4.3),
  },
  nature: {dies: TM.dies, curl0: scan((t) => mean(natPose(t).e) < 0.9, 5, 7.8), curl1: scan((t) => mean(natPose(t).e) < 0.15, 5, 7.8), settle: scan((t) => natPose(t).pos[2] < natPose(7.79).pos[2] + 0.05, 6, 7.8)},
  leaf: {bent: 8.3, fluid: TM.fluid, straighten: scan((t) => leafPose(t).e[4] > 0.6, 9, 11), die: TM.die, drop: TM.pressure2, curl0: scan((t) => mean(leafPose(t).e) < 0.9, 11, 13.4), settle: scan((t) => leafPose(t).pos[2] < leafPose(13.45).pos[2] + 0.05, 12, 13.45)},
  lab: {
    forceps: 14.35, descend0: 14.3, descend1: 15.45, contact: scan((t) => L_NEEDLE(t) <= 0, 14, 16), padLift0: 16.02, padLift1: 16.45,
    push0: 16.62, push1: 16.98, pulse0: 16.72, pulse1: 17.62, stir: 17.6, push2_0: 18.5, push2_1: 18.66, open: scan((t) => mean(labPose(t).e) > 0.85, 18.5, 19.6),
    swing0: 16.5, swing1: 17.65, lower0: 19.05, lower1: 19.95, fingerOff: 20.38, plungerUp0: 20.5, plungerUp1: 21.2, out0: 20.85, out1: 21.55, clampContacts: contacts(21.55, 22.3),
    lift0: T_LIFT_BLOCK, lift1: 22.85, lift2: 23.35, lift3: 24.0, blockClear: scan((t) => blockAt(t).c[2] > BLOCK_H + 0.2, T_LIFT_BLOCK, 24),
    carry0: 23.78, carry1: 24.95, press0: 25.18, press1: 25.38, dropOpen: T_DROP, bounces: landings(),
    travel0: 25.7, travel1: 27.35, descend2_1: 28.4, out2: 28.42, s2Contacts: contacts(28.55, 29.2),
    lift2_0: T_LIFT_S2, lift2_1: 29.55, s2Clear: scan((t) => s2At(t).pos[2] > s2At(0).pos[2] + 0.2, T_LIFT_S2, 30.2),
  },
};
fs.writeFileSync(out, JSON.stringify(cues, null, 1));
console.log(JSON.stringify({hook: cues.hook, nature: cues.nature, leaf: cues.leaf, clamp: cues.lab.clampContacts, s2: cues.lab.s2Contacts, bounces: cues.lab.bounces, open: cues.lab.open, s2Clear: cues.lab.s2Clear}));
