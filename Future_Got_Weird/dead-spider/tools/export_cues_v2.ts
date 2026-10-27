// V2 sound cues from the picture: narration anchors, cuts, and physical events read from the same state functions the
// shots draw (v2/world2.ts): needle contact, plunger travel, when the legs pass open, each leg's first contact with the
// block and with the second spider, the block leaving the bench and landing in the dish, the second spider leaving its pad.
// usage: esbuild bundle -> node out.cjs audio/cues_v2.json
import fs from 'fs';
import {DUR, WORDS} from '../source/src/v2/lib2';
import {blockAt, CUT, H_NEEDLE, hookPose, L_NEEDLE, L_PLUNGER, L_Z, labLegsFree, labPose, s2At, T_DROP, T_LIFT_BLOCK, T_LIFT_S2, TM, DISH, BLOCK_H} from '../source/src/v2/world2';

const out = process.argv[2] ?? 'audio/cues_v2.json';
const scan = (fn: (t: number) => boolean, t0: number, t1: number) => {
  for (let t = t0; t <= t1; t += 1 / 240) if (fn(t)) return +t.toFixed(3);
  return null;
};
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
/** times the falling block meets the dish floor */
const landings = () => {
  const ts: number[] = [];
  let prev = blockAt(T_DROP).c[2], falling = true;
  for (let t = T_DROP; t < T_DROP + 0.6; t += 1 / 960) {
    const z = blockAt(t).c[2];
    if (falling && z > prev + 1e-6 && prev < DISH.floor + BLOCK_H + 0.05) ts.push(+t.toFixed(3));
    falling = z <= prev;
    prev = z;
  }
  const zf = DISH.floor + BLOCK_H;
  const settle = scan((t) => t > T_DROP + 0.05 && Math.abs(blockAt(t).c[2] - zf) < 1e-4, T_DROP, T_DROP + 0.8);
  return {bounces: ts, settle};
};
const openAt = (pose: (t: number) => {e: number[]}, t0: number, t1: number, thr = 0.85) => scan((t) => pose(t).e.reduce((a, b) => a + b, 0) / 8 > thr, t0, t1);
const cues = {
  DUR,
  WORDS,
  TM,
  CUT,
  hook: {
    contact: scan((t) => H_NEEDLE(t) <= 0, 0, 1), inserted: 0.3, lift0: 0.3, lift1: 0.72, press0: 0.33, press1: 0.58,
    open: openAt(hookPose, 0.3, 1.5), release0: 2.5, release1: 2.74, sag: 2.62, press2_0: 3.36, press2_1: 3.56, open2: openAt(hookPose, 3.4, 4.4),
  },
  lab: {
    descend0: 13.7, descend1: 15.45, contact: scan((t) => L_NEEDLE(t) <= 0, 14, 16), glue: 15.72, padLift0: 16.02, padLift1: 16.45,
    push0: 16.62, push1: 16.98, pulse0: 16.72, pulse1: 17.62, stir: 17.6, push2_0: 18.5, push2_1: 18.66,
    open: openAt(labPose, 18.5, 19.6),
    swing0: 19.5, swing1: 20.75, lower0: 20.3, lower1: 21.45,
    finger_off: 20.47, plunger_up0: 20.64, plunger_up1: 21.75,
    clampContacts: contacts(21.9, 22.6),
    lift0: T_LIFT_BLOCK, lift1: 23.75, blockClear: scan((t) => blockAt(t).c[2] > BLOCK_H + 0.2, T_LIFT_BLOCK, 24),
    carry0: 23.78, carry1: 24.95, press0: 25.18, press1: 25.38, dropOpen: T_DROP, drop: landings(),
    swing2_0: 25.78, swing2_1: 26.62, descend2_0: 26.62, descend2_1: 28.02,
    release0: 28.2, release1: 28.45, s2Contacts: contacts(28.25, 28.9),
    lift2_0: T_LIFT_S2, lift2_1: 29.72, s2Clear: scan((t) => s2At(t).pos[2] > s2At(0).pos[2] + 0.2, T_LIFT_S2, 30),
    zTop: L_Z(0), plungerMax: L_PLUNGER(19),
  },
};
fs.writeFileSync(out, JSON.stringify(cues, null, 1));
console.log(JSON.stringify({hook: cues.hook, clamp: cues.lab.clampContacts, s2: cues.lab.s2Contacts, drop: cues.lab.drop, blockClear: cues.lab.blockClear, s2Clear: cues.lab.s2Clear, open: cues.lab.open}));
