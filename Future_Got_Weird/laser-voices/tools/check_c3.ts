// V3 geometry checks, from the picture's own functions:
//  - foot slide: for every frame in which a foot is in contact, its world position vs its plant (m);
//  - the beam through a head: for every frame, the drawn beam segment (lens -> end) against each head's sphere
//    (the head it ends on is allowed to be touched only at the end point);
//  - the loop: every character's pose, place and the camera at the last frame + 1/30 s vs frame 0;
//  - the passerby is out of the closing / opening shot's frame at the loop point.
import fs from 'node:fs';
import {DUR, FPS, FRAMES} from '../source/src/c3/lib';
import {beamEnd, cast, listenerPose, operatorPose, passerbyAt, WALKS} from '../source/src/c3/story';
import {camAt, CAM_A, shotAt} from '../source/src/c3/shots';
import {footAt} from '../source/src/c3/rig/steps';
import {basis, cardOf, cardToWorld, proj, sub3, V3, v3, len3} from '../source/src/c3/rig/geo';
import {joints4} from '../source/src/c3/rig/Crew';
import {LENS} from '../source/src/c3/world';
const R: Record<string, unknown> = {};
// feet
let slide = 0, slideAt = -1, contactFrames = 0;
for (let f = 0; f < FRAMES; f++) {
  const t = f / FPS, p = passerbyAt(t);
  const w = [...WALKS].reverse().find((x) => t >= x.w.t0 - 1e-6);
  if (!w) continue;
  for (const [side, plants] of [['L', w.pl.L], ['R', w.pl.R]] as const) {
    const fa = footAt(plants, t);
    if (!fa.contact) continue;
    contactFrames++;
    const loc = side === 'L' ? p.pose.footL : p.pose.footR;
    const wpos = cardToWorld(p.g, p.h, v3(loc.x, 0, loc.z));
    const d = Math.hypot(wpos.x - fa.x, wpos.z - fa.z);
    if (d > slide) { slide = d; slideAt = f; }
  }
}
R.foot_slide = {contact_foot_frames: contactFrames, max_m: +slide.toFixed(6), at_frame: slideAt};
// beam through heads
const segSphere = (a: V3, b: V3, c: V3) => {
  const ab = sub3(b, a), ac = sub3(c, a);
  const L2 = ab.x * ab.x + ab.y * ab.y + ab.z * ab.z;
  const u = Math.max(0, Math.min(1, (ac.x * ab.x + ac.y * ab.y + ac.z * ab.z) / L2));
  return {d: len3(sub3(c, v3(a.x + ab.x * u, a.y + ab.y * u, a.z + ab.z * u))), u};
};
const through: object[] = [];
for (let f = 0; f < FRAMES; f++) {
  const t = f / FPS, be = beamEnd(t);
  for (const a of cast(t)) {
    const H = cardToWorld(a.g, a.h, joints4(a.b, a.pose).Hc), r = a.b.R / 267;
    const {d, u} = segSphere(LENS, be.end, H);
    const endsHere = len3(sub3(be.end, H)) < r * 1.35;
    if (d < r * 0.98 && !(endsHere && u > 0.97)) through.push({f, id: a.id, d: +d.toFixed(3), r: +r.toFixed(3), u: +u.toFixed(3)});
  }
}
R.beam_through_head = {frames: through.length, first: through.slice(0, 5)};
// loop
const T1 = FRAMES / FPS; // the frame after the last = frame 0 again
const diffPose = (a: object, b: object): number => {
  let m = 0;
  const walk = (x: unknown, y: unknown) => {
    if (typeof x === 'number' && typeof y === 'number') m = Math.max(m, Math.abs(x - y));
    else if (x && y && typeof x === 'object') for (const k of Object.keys(x as object)) walk((x as Record<string, unknown>)[k], (y as Record<string, unknown>)[k]);
  };
  walk(a, b);
  return m;
};
R.loop = {
  duration_s: DUR, shot_last: shotAt((FRAMES - 1) / FPS), shot_first: shotAt(0),
  listener_pose_max_abs_diff_t1_vs_0: +diffPose(listenerPose(T1), listenerPose(0)).toFixed(4),
  operator_pose_max_abs_diff_t1_vs_0: +diffPose(operatorPose(T1), operatorPose(0)).toFixed(4),
  camera_identical: JSON.stringify(camAt((FRAMES - 1) / FPS)) === JSON.stringify(camAt(0)),
};
// passerby out of the loop-point frame (camera A)
const vis = (t: number) => {
  const p = passerbyAt(t), b = basis(CAM_A);
  const cd = cardOf(b, p.g, p.h);
  const H = proj(b, cardToWorld(p.g, p.h, joints4(passerbyAt(t).pose === p.pose ? (cast(t)[2].b) : cast(t)[2].b, p.pose).Hc));
  const halfW = 0.4 * 267 * cd.k; // body half-width on screen (px), generous
  return {x: +cd.x.toFixed(0), headX: +H.x.toFixed(0), inFrame: cd.x + halfW > 0 && cd.x - halfW < 1080 && cd.depth > 0.2};
};
R.passerby_in_closing_frame = {t_last: vis((FRAMES - 1) / FPS), t0: vis(0)};
// the passerby's last in-frame moment in the final shot
let lastIn = -1;
for (let f = 960; f < FRAMES; f++) if (vis(f / FPS).inFrame) lastIn = f;
R.passerby_last_in_frame_final_shot = lastIn;
fs.writeFileSync(process.argv[2], JSON.stringify(R, null, 1));
console.log(JSON.stringify(R, null, 1));
