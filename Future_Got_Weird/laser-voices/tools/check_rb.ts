// Rebuild V1 checks: (1) the passerby's head/shoulders cut the path on exactly frames 786..957 (the voice's silence);
// (2) the loop seam: the close-up performance's joints move from the last frame to frame 0 by an ordinary step.
import {FRAMES, FPS, DUR} from '../source/src/rb/beats';
import {passerbyAim} from '../source/src/rb/shots/Aim';
import {loopPerf} from '../source/src/rb/shots/Close';
import {joints} from '../source/src/rb/art/Person';

const bad: number[] = [];
for (let f = 660; f < FRAMES; f++) if (passerbyAim(f / FPS).blocked !== (f >= 786 && f < 958)) bad.push(f);
const pts = (tau: number) => {
  const j = joints(loopPerf(tau).p);
  return [j.head, j.N.E, j.N.W, j.F.W, j.Sh];
};
const step = (a: number, b: number) => Math.max(...pts(a).map((p, i) => Math.hypot(p.x - pts(b)[i].x, p.y - pts(b)[i].y)));
const L = (FRAMES - 1) / FPS - DUR;
console.log(JSON.stringify({block_mismatched_frames_660_1021: bad, seam_joint_step_px: {before: +step(L - 1 / FPS, L).toFixed(2), seam: +step(L, 0).toFixed(2), after: +step(0, 1 / FPS).toFixed(2)}}, null, 1));
