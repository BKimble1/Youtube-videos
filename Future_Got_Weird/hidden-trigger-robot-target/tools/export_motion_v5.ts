// Bundled with esbuild and run in node: per-frame rig data from the V5 choreography (the kinematics the video uses).
// -> qa/motion_v5.json, qa/motion_summary_v5.json, audio/cues_v5.json
import fs from 'node:fs';
import {solve3, knifeWorld, R3, KN} from '../source/src/v3/rig3';
import {armPose5 as armPose3, POSE_CUTS5 as POSE_CUTS3, MIME5} from '../source/src/v5/kin5';
import {SH5, CONTACT} from '../source/src/v5/theme5';
import {LANDINGS, OUTLET} from '../source/src/v5/Fluid5';
import {W3, DURATION3, FPS3} from '../source/src/v3/theme3';
import {APPLE3, HAND3} from '../source/src/v3/World3';

const cutFrames = POSE_CUTS3.map((c) => Math.round(c * FPS3));
const out: any[] = [];
let prev: any = null;
const unwrap = (a: number, ref: number) => a + 360 * Math.round((ref - a) / 360);
for (let f = 0; f < DURATION3; f++) {
  const t = f / FPS3;
  const p = armPose3(t);
  const j = solve3(p);
  const k = knifeWorld(p);
  // lowest blade point along the edge and its x span
  const xs = [k.W(KN.handleFront, KN.edge).x, k.W(KN.tipU, KN.edge).x];
  const x0 = Math.min(...xs), x1 = Math.max(...xs);
  const edgeH = k.edgeLowest;
  const overApple = x1 > APPLE3.x - APPLE3.r && x0 < APPLE3.x + APPLE3.r;
  const overHand = x1 > HAND3.left && x0 < HAND3.right;
  const L = (a: any, b: any) => Math.hypot(a.x - b.x, a.h - b.h);
  const cut = cutFrames.includes(f);
  const th1 = prev ? unwrap(j.th1, prev.th1) : j.th1, th2 = prev ? unwrap(j.th2, prev.th2) : j.th2;
  const rec = {
    f, t: +t.toFixed(4), G: [+p.x.toFixed(2), +p.h.toFixed(2)], th1: +th1.toFixed(3), th2: +th2.toFixed(3),
    E: [+j.E.x.toFixed(1), +j.E.h.toFixed(1)], L1: +L(j.S, j.E).toFixed(4), L2: +L(j.E, j.W1).toFixed(4), L3: +L(j.W1, j.W2).toFixed(4), GRIP: +L(j.W2, j.G).toFixed(4), reach: +j.reach.toFixed(4),
    clearApple: overApple ? +(edgeH - APPLE3.stemTop).toFixed(2) : null,
    clearHand: overHand ? +(edgeH - HAND3.palmTop).toFixed(2) : null,
    cut,
    speed: prev && !cut ? +(Math.hypot(p.x - prev.G[0], p.h - prev.G[1]) * FPS3).toFixed(2) : 0,
    dth: prev && !cut ? +Math.max(Math.abs(th1 - prev.th1), Math.abs(th2 - prev.th2)).toFixed(3) : 0,
  };
  out.push(rec);
  prev = rec;
}
fs.mkdirSync('qa', {recursive: true});
fs.writeFileSync('qa/motion_v5.json', JSON.stringify(out));
fs.writeFileSync('audio/cues_v5.json', JSON.stringify({SH: SH5, W3, CONTACT, MIME: MIME5, LANDINGS, OUTLET, DURATION: DURATION3, FPS: FPS3}, null, 1));
const num = (a: (number | null)[]) => a.filter((x): x is number => x !== null);
const free = out.filter((r) => !r.cut && r.f > 0);
const summary = {
  frames: out.length,
  linkLengthMaxError: Math.max(...out.map((r) => Math.max(Math.abs(r.L1 - R3.L1), Math.abs(r.L2 - R3.L2), Math.abs(r.L3 - R3.L3), Math.abs(r.GRIP - R3.GRIP)))),
  maxReach: Math.max(...out.map((r) => r.reach)),
  minBladeClearanceOverAppleStemTop: Math.min(...num(out.map((r) => r.clearApple))),
  minBladeClearanceOverPalmTop: Math.min(...num(out.map((r) => r.clearHand))), // negative = the designed press at contact
  palmPressFrames: out.filter((r) => r.clearHand !== null && r.clearHand < 0).map((r) => r.f),
  elbowAlwaysAboveShoulder: out.every((r) => r.E[1] > R3.S.h),
  intentionalPoseCutFrames: cutFrames,
  maxJointStepDegExclCuts: Math.max(...free.map((r) => r.dth)),
  maxGripperSpeedPxS: Math.max(...free.map((r) => r.speed)),
  loopWrap: {lastStepSpeed: out[out.length - 1].speed, wrapStepSpeed: +(Math.hypot(out[0].G[0] - out[out.length - 1].G[0], out[0].G[1] - out[out.length - 1].G[1]) * FPS3).toFixed(2), firstStepSpeed: out[1].speed},
};
fs.writeFileSync('qa/motion_summary_v5.json', JSON.stringify(summary, null, 1));
console.log(JSON.stringify(summary, null, 1));
