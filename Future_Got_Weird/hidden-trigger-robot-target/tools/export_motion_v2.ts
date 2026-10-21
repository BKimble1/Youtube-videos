// Bundled with esbuild and run in node: per-frame rig data from the V2 choreography (same kinematics the video uses).
// -> qa/motion_v2.json, qa/motion_summary_v2.json and audio/cues_v2.json (shot boundaries + phrase cues for the mix)
import fs from 'node:fs';
import {solve, knifeFrame} from '../source/src/rig/kin';
import {ROBOT, APPLE, HANDPROP, DURATION, FPS} from '../source/src/theme';
import {S, V, COMPARE} from '../source/src/v2/theme2';
import {armPose2, POSE_CUTS, MIME, MOVE} from '../source/src/v2/kin2';

const out: any[] = [];
let prev: any = null;
const cutFrames = POSE_CUTS.map((c) => Math.round(c * FPS));
for (let f = 0; f < DURATION; f++) {
  const t = f / FPS;
  const pose = armPose2(t);
  const j = solve(pose);
  const k = knifeFrame(pose);
  const len = (a: any, b: any) => Math.hypot(a.x - b.x, a.y - b.y);
  const edgeY = k.edgeStart.y;
  const x0 = Math.min(k.tip.x, k.edgeStart.x), x1 = Math.max(k.tip.x, k.edgeStart.x);
  const overApple = x1 > APPLE.x - APPLE.r && x0 < APPLE.x + APPLE.r;
  const overHand = x1 > HANDPROP.left && x0 < HANDPROP.right;
  const cut = cutFrames.includes(f);
  const rec = {
    f, t: +t.toFixed(4), G: [+pose.x.toFixed(2), +pose.y.toFixed(2)], phi: pose.phi,
    th1: +j.th1.toFixed(3), th2: +j.th2.toFixed(3), th3: j.th3,
    E: [+j.E.x.toFixed(2), +j.E.y.toFixed(2)],
    L1: +len(j.S, j.E).toFixed(4), L2: +len(j.E, j.W1).toFixed(4), L3: +len(j.W1, j.W2).toFixed(4), GRIP: +len(j.W2, j.G).toFixed(4),
    reach: +j.reachRatio.toFixed(4),
    clearApple: overApple ? +(APPLE.stemTop - edgeY).toFixed(2) : null,
    clearHand: overHand ? +(HANDPROP.top - edgeY).toFixed(2) : null,
    cut,
    speed: prev && !cut ? +(Math.hypot(pose.x - prev.G[0], pose.y - prev.G[1]) * FPS).toFixed(2) : 0,
    dth1: prev ? +Math.abs(j.th1 - prev.th1).toFixed(3) : 0,
    dth2: prev ? +Math.abs(j.th2 - prev.th2).toFixed(3) : 0,
  };
  out.push(rec);
  prev = rec;
}
fs.mkdirSync('qa', {recursive: true});
fs.writeFileSync('qa/motion_v2.json', JSON.stringify(out));
fs.writeFileSync('audio/cues_v2.json', JSON.stringify({S, V, COMPARE, MIME, MOVE, DURATION, FPS}, null, 1));
const num = (a: (number | null)[]) => a.filter((x): x is number => x !== null);
const free = out.filter((r) => !r.cut && r.f > 0);
const summary = {
  frames: out.length,
  linkLengthMaxError: Math.max(...out.map((r) => Math.max(Math.abs(r.L1 - ROBOT.L1), Math.abs(r.L2 - ROBOT.L2), Math.abs(r.L3 - ROBOT.L3), Math.abs(r.GRIP - ROBOT.GRIP)))),
  maxReach: Math.max(...out.map((r) => r.reach)),
  minClearApple: Math.min(...num(out.map((r) => r.clearApple))),
  minClearHand: Math.min(...num(out.map((r) => r.clearHand))),
  th1Range: [Math.min(...out.map((r) => r.th1)), Math.max(...out.map((r) => r.th1))],
  elbowYMaxBelowShoulder: Math.max(...out.map((r) => r.E[1] - ROBOT.shoulder.y)),
  intentionalPoseCutFrames: cutFrames,
  maxJointStepDegExclCuts: Math.max(...free.map((r) => Math.max(r.dth1, r.dth2))),
  maxSpeedPxS: Math.max(...free.map((r) => r.speed)),
  loopWrap: {lastG: out[out.length - 1].G, firstG: out[0].G, lastStepSpeed: out[out.length - 1].speed, firstStepSpeed: out[1].speed,
    wrapStepSpeed: +(Math.hypot(out[0].G[0] - out[out.length - 1].G[0], out[0].G[1] - out[out.length - 1].G[1]) * FPS).toFixed(2)},
};
fs.writeFileSync('qa/motion_summary_v2.json', JSON.stringify(summary, null, 1));
console.log(JSON.stringify(summary, null, 1));
