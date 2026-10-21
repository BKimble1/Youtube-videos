// Bundled with esbuild and run in node: per-frame rig data from the same kinematics the video uses.
// -> qa/motion_v1.json (joint angles, link lengths, blade clearance over the props) and audio/cues_v1.json (cue times)
import fs from 'node:fs';
import {armPose, solve, knifeFrame} from '../source/src/rig/kin';
import {ROBOT, APPLE, HANDPROP, KNIFE, DURATION, FPS, T, CUE, TABLE} from '../source/src/theme';

const PROP_CONTACT_Y = 1250;
const out: any[] = [];
let prev: any = null;
for (let f = 0; f < DURATION; f++) {
  const t = f / FPS;
  const pose = armPose(t);
  const j = solve(pose);
  const k = knifeFrame(pose);
  const len = (a: any, b: any) => Math.hypot(a.x - b.x, a.y - b.y);
  // lowest blade point = the straight edge (v = edgeV), from u = handleFront to the tip
  const edgeY = k.edgeStart.y;
  const x0 = Math.min(k.tip.x, k.edgeStart.x), x1 = Math.max(k.tip.x, k.edgeStart.x);
  const overApple = x1 > APPLE.x - APPLE.r && x0 < APPLE.x + APPLE.r;
  const overHand = x1 > HANDPROP.left && x0 < HANDPROP.right;
  const jawBottom = pose.y + 11; // jaw tips extend 11 px past the jaw centre
  const rec = {
    f, t: +t.toFixed(4), G: [pose.x, pose.y], phi: pose.phi,
    th1: +j.th1.toFixed(3), th2: +j.th2.toFixed(3), th3: j.th3,
    E: [+j.E.x.toFixed(2), +j.E.y.toFixed(2)],
    L1: +len(j.S, j.E).toFixed(4), L2: +len(j.E, j.W1).toFixed(4), L3: +len(j.W1, j.W2).toFixed(4), GRIP: +len(j.W2, j.G).toFixed(4),
    reach: +j.reachRatio.toFixed(4),
    clearApple: overApple ? +(APPLE.stemTop - edgeY).toFixed(2) : null,
    clearHand: overHand ? +(HANDPROP.top - edgeY).toFixed(2) : null,
    clearTable: +(PROP_CONTACT_Y - Math.max(edgeY, jawBottom)).toFixed(2), // props stand on the table at y ~1250
    speed: prev ? +(Math.hypot(pose.x - prev.G[0], pose.y - prev.G[1]) * FPS).toFixed(2) : 0,
    dth1: prev ? +Math.abs(j.th1 - prev.th1).toFixed(3) : 0,
    dth2: prev ? +Math.abs(j.th2 - prev.th2).toFixed(3) : 0,
  };
  out.push(rec);
  prev = rec;
}
fs.mkdirSync('qa', {recursive: true});
fs.writeFileSync('qa/motion_v1.json', JSON.stringify(out));
fs.writeFileSync('audio/cues_v1.json', JSON.stringify({T, CUE, DURATION, FPS, KNIFE, ROBOT: {L1: ROBOT.L1, L2: ROBOT.L2, L3: ROBOT.L3, GRIP: ROBOT.GRIP}}, null, 1));
const num = (a: (number | null)[]) => a.filter((x): x is number => x !== null);
const summary = {
  frames: out.length,
  linkLengthMaxError: Math.max(...out.map((r) => Math.max(Math.abs(r.L1 - ROBOT.L1), Math.abs(r.L2 - ROBOT.L2), Math.abs(r.L3 - ROBOT.L3), Math.abs(r.GRIP - ROBOT.GRIP)))),
  maxReach: Math.max(...out.map((r) => r.reach)),
  minClearApple: Math.min(...num(out.map((r) => r.clearApple))),
  minClearHand: Math.min(...num(out.map((r) => r.clearHand))),
  minClearTable: Math.min(...out.map((r) => r.clearTable)),
  th1Range: [Math.min(...out.map((r) => r.th1)), Math.max(...out.map((r) => r.th1))],
  elbowYMaxBelowShoulder: Math.max(...out.map((r) => r.E[1] - ROBOT.shoulder.y)),
  // per-frame joint jumps outside the intentional cuts (T.withT reset, hidden reset at 22.4 s, wrap at the end)
  maxJointStepDegExclCuts: Math.max(...out.filter((r) => ![Math.round(T.without * FPS), Math.round(T.withT * FPS), Math.round(22.4 * FPS), Math.round(T.wipe * FPS)].some((c) => Math.abs(r.f - c) <= 1)).map((r) => Math.max(r.dth1, r.dth2))),
  maxSpeedPxS: Math.max(...out.filter((r) => r.dth1 < 5).map((r) => r.speed)),
  loopWrap: {lastG: out[out.length - 1].G, firstG: out[0].G, lastSpeed: out[out.length - 1].speed, firstStepSpeed: out[1].speed},
};
fs.writeFileSync('qa/motion_summary_v1.json', JSON.stringify(summary, null, 1));
console.log(JSON.stringify(summary, null, 1));
