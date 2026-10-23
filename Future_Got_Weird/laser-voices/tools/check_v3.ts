// V3 check: the obstruction lands on the locked frames (815 cut, 958 return), the companion's feet are planted on the
// existing footsteps, and every performance curve and the camera are continuous across the loop seam.
import {blocked, clerkX, X_ENTER, X_EXIT, footAt, leadPose, leadBody, clerkFeet, motifEnv, received} from '../source/src/v3/story3';
import {camAt} from '../source/src/v3/cam3';
import {screenBlocked} from '../source/src/v3/occlude3';
import {FRAMES, FPS, STRIKES, DUR} from '../source/src/v3/world3';
const blockF: number[] = [];
let mism = 0;
for (let f = 0; f < FRAMES; f++) {
  if (blocked(f / FPS)) blockF.push(f);
  if (blocked(f / FPS) !== screenBlocked(f / FPS)) { mism++; if (mism < 8) console.log('screen/plan mismatch at frame', f); }
}
const contiguous = blockF.every((f, i) => i === 0 || f === blockF[i - 1] + 1);
// seam: the step from the last frame to frame 0 against the typical step between frames 1 and 2
const d = (a: Record<string, number>, b: Record<string, number>) => Math.max(...Object.keys(a).filter((k) => typeof a[k] === 'number').map((k) => Math.abs(a[k] - b[k])));
const tl = (FRAMES - 1) / FPS, t1 = 1 / FPS, t2 = 2 / FPS;
const cam = (t: number) => camAt(t) as unknown as Record<string, number>;
const camStep = (a: Record<string, number>, b: Record<string, number>) => ({dx: (b.x - a.x) * b.z, dy: (b.y - a.y) * b.z, dlogz: Math.log(b.z / a.z)});
const flat = (o: Record<string, unknown>) => Object.fromEntries(Object.entries(o).flatMap(([k, v]) => (typeof v === 'number' ? [[k, v]] : v && typeof v === 'object' ? Object.entries(v as Record<string, number>).map(([k2, v2]) => [`${k}.${k2}`, v2]) : [])));
const out = {
  frames: FRAMES, screenMismatches: mism, blockedFrames: [blockF[0], blockF[blockF.length - 1] + 1], contiguous, expected: [815, 958], X_ENTER, X_EXIT,
  clerkX: {start: clerkX(0), atBlock: clerkX(815 / FPS), atClear: clerkX(958 / FPS), end: clerkX(DUR)},
  plants: STRIKES.map((s) => [s, +footAt(s + 0.001, 0).x.toFixed(3), +footAt(s + 0.001, 1).x.toFixed(3)]),
  seam: {
    camStepLastTo0: camStep(cam(tl), cam(0)), camStep1to2: camStep(cam(t1), cam(t2)),
    leadPoseJumpLastTo0: +d(flat(leadPose(tl)), flat(leadPose(0))).toFixed(4), leadPoseStep1to2: +d(flat(leadPose(t1)), flat(leadPose(t2))).toFixed(4),
    leadBodyJumpLastTo0: +d(flat(leadBody(tl)), flat(leadBody(0))).toFixed(3), leadBodyStep1to2: +d(flat(leadBody(t1)), flat(leadBody(t2))).toFixed(3),
    motifEnv: {last: motifEnv(tl), first: motifEnv(0)}, received: {last: received(tl), first: received(0)},
    clerkOffscreenAtSeam: clerkFeet(tl).x,
  },
};
console.log(JSON.stringify(out, null, 1));
process.exit(mism === 0 && contiguous && blockF[0] === 815 && blockF[blockF.length - 1] + 1 === 958 ? 0 : 1);
