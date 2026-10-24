// V6 checks: (1) the visitor's body cuts the beam on exactly frames 815..957; (2) the loop seam: the camera and both
// leads' joints move from the last frame to frame 0 by an ordinary frame step; the crowd too.
import {FPS, FRAMES, DUR} from '../source/src/v4/core4';
import {joints4} from '../source/src/v6/rig/Crew6';
import {BODY_P} from '../source/src/v4/rig/cast4';
import {cardToWorld, V3} from '../source/src/v4/rig/geo4';
import {blocked, leadAt, friendAt, EXTRA_LIST, extraAt, W_LANE, CharState} from '../source/src/v6/stage6';
import {atriumCamAt} from '../source/src/v6/Film6';

const bad: number[] = [];
for (let f = 690; f < 969; f++) if (blocked(f / FPS) !== (f >= 815 && f < 958)) bad.push(f);
const d3 = (a: V3, b: V3) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
const pts = (s: CharState) => { const j = joints4(BODY_P, s.pose); return [j.Hc, j.WL, j.WR, j.AL, j.AR, j.P].map((p) => cardToWorld(s.ground, s.heading, p)); };
const maxStep = (fn: (t: number) => CharState, f0: number, f1: number) => Math.max(...pts(fn(f0 / FPS)).map((p, i) => d3(p, pts(fn(f1 / FPS))[i])));
const camStep = (f0: number, f1: number) => { const a = atriumCamAt(f0 / FPS)!, b = atriumCamAt(f1 / FPS)!; return {pos: +d3(a.pos, b.pos).toFixed(5), yaw: +(a.yaw - b.yaw).toFixed(4), f: +(a.f - b.f).toFixed(3)}; };
const L = FRAMES - 1;
const out = {
  block_mismatched_frames_690_968: bad,
  seam: {
    camera: {before: camStep(L - 1, L), seam: camStep(L, 0), after: camStep(0, 1)},
    lead_joint_max_m: {before: +maxStep(leadAt, L - 1, L).toFixed(4), seam: +maxStep(leadAt, L, 0).toFixed(4), after: +maxStep(leadAt, 0, 1).toFixed(4)},
    friend_joint_max_m: {before: +maxStep(friendAt, L - 1, L).toFixed(4), seam: +maxStep(friendAt, L, 0).toFixed(4), after: +maxStep(friendAt, 0, 1).toFixed(4)},
    crowd_max_m: +Math.max(...EXTRA_LIST.map((e) => { const a = extraAt(e, L / FPS).ground, b = extraAt(e, 0).ground; const dx = (((b.x - a.x) % W_LANE) + W_LANE * 1.5) % W_LANE - W_LANE / 2; return Math.abs(dx); })).toFixed(4),
  },
  DUR,
};
console.log(JSON.stringify(out, null, 1));
