// Camera-motion probe: how much the camera itself moves the picture, frame to frame, independent of anything moving in
// the scene. For each frame, nine points fixed 2.5 m in front of the camera (a 3 x 3 grid filling the frame) are
// re-projected through the next frame's camera; the mean pixel displacement is the camera's image motion (translation
// parallax, rotation and zoom together). Full-frame interfaces count as a still camera; a cut (a different camera on
// the next frame) is reported as a cut, not as motion. usage: bundle with esbuild, run with node <out.json>
import * as fs from 'fs';
import {add3, B, basis, Cam, mul3, proj} from '../../source/src/world/cam';
import {labCam, LAB_OUT} from '../../source/src/v7/Lab7';
import {LAB_IN} from '../../source/src/v7/hero7';
import {cafeCam, E_OUT, G_IN, OR_SPLIT, povCam, splitCam, UI_IN, UI_OUT} from '../../source/src/v7/Cafe7';
import {ss} from '../../source/src/lib';
import {studyCam} from '../../source/src/v7/Study7';
import {DUR} from '../../source/src/lib';

const camAt = (t: number): [string, Cam | null] => {
  if (t < LAB_OUT) return ['lab', labCam(t)];
  if (t < UI_IN) return ['cafe', cafeCam(t)];
  if (t < UI_OUT) return ['split (gait track)', splitCam(t)];
  if (t < E_OUT) return ['cafe', cafeCam(t)];
  if (t < G_IN) return ['study', studyCam(t)];
  if (t < OR_SPLIT) return ['cafe', cafeCam(t)];
  if (t < LAB_IN) return ['ending split (cctv picture)', povCam(900 - 330 * ss(t, OR_SPLIT, OR_SPLIT + 0.3))];
  return ['lab', labCam(t)];
};
const grid = (b: B) => {
  const pts = [];
  for (const sx of [-0.4, 0, 0.4]) for (const sy of [-0.7, 0, 0.7]) {
    const d = 2.5;
    pts.push(add3(add3(add3(b.c.pos, mul3(b.fwd, d)), mul3(b.right, (sx * 1080 * d) / b.c.f)), mul3(b.up, (sy * 1920 * d) / 2 / b.c.f)));
  }
  return pts;
};
const N = Math.round(DUR * 30);
const per: {f: number; scene: string; px: number; cut: boolean}[] = [];
for (let f = 0; f < N - 1; f++) {
  const [s0, c0] = camAt(f / 30), [s1, c1] = camAt((f + 1) / 30);
  if (!c0 || !c1) { per.push({f, scene: s0, px: 0, cut: s0 !== s1}); continue; }
  const b0 = basis(c0), b1 = basis(c1);
  const pts = grid(b0);
  const px = pts.reduce((a, p) => { const q0 = proj(b0, p), q1 = proj(b1, p); return a + Math.hypot(q1.x - q0.x, q1.y - q0.y); }, 0) / pts.length;
  per.push({f, scene: s0, px: +px.toFixed(2), cut: s0 !== s1 || px > 150});
}
const moving = per.filter((p) => !p.cut);
const sec = Array.from({length: Math.ceil(N / 30)}, (_, s) => { const seg = moving.filter((p) => Math.floor(p.f / 30) === s); return seg.length ? +(seg.reduce((a, p) => a + p.px, 0) / seg.length).toFixed(1) : 0; });
const summary = {
  frames: N, cuts: per.filter((p) => p.cut).map((p) => +(p.f / 30).toFixed(2)),
  still_frames_lt_1px: moving.filter((p) => p.px < 1).length,
  slow_1_to_6px: moving.filter((p) => p.px >= 1 && p.px < 6).length,
  fast_6_to_15px: moving.filter((p) => p.px >= 6 && p.px < 15).length,
  very_fast_ge_15px: moving.filter((p) => p.px >= 15).length,
  mean_px_per_frame: +(moving.reduce((a, p) => a + p.px, 0) / moving.length).toFixed(2),
  max: moving.reduce((a, p) => (p.px > a.px ? p : a), {f: 0, px: 0} as {f: number; px: number}),
  per_second_mean: sec,
};
console.log(JSON.stringify(summary));
fs.writeFileSync(process.argv[2], JSON.stringify({summary, per}, null, 0));
