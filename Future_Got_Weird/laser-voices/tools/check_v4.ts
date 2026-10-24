// V4 checks: (1) the friend's body cuts the atrium beam on exactly frames 815..957; (2) the loop seam: the camera,
// the leads and the crowd move from the last frame to frame 0 by one ordinary frame step (no jump).
import {FPS, FRAMES, DUR} from '../source/src/v4/core4';
import {friendAt, leadAt, blocks, EXTRA_LIST, extraAt, W_LANE} from '../source/src/v4/story4';
import {atriumCam} from '../source/src/v4/camAtrium4';
import {BAY} from '../source/src/v4/atrium4';

const bad: number[] = [];
for (let f = 0; f < FRAMES; f++) if (blocks(friendAt(f / FPS)) !== (f >= 815 && f < 958)) bad.push(f);
const d3 = (a: {x: number; y: number; z: number}, b: {x: number; y: number; z: number}) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
const step = (fn: (t: number) => {x: number; y: number; z: number}) => {
  const last = fn((FRAMES - 1) / FPS), first = fn(0), prev = fn((FRAMES - 2) / FPS), next = fn(1 / FPS);
  // the end is one bay further along x than the start
  const lastS = {...last, x: last.x - BAY}, prevS = {...prev, x: prev.x - BAY};
  return {seam: +d3(lastS, first).toFixed(4), before: +d3(prevS, lastS).toFixed(4), after: +d3(first, next).toFixed(4)};
};
const out = {
  block_mismatched_frames: bad,
  seam_step_m: {
    camera_pos: step((t) => atriumCam(t).pos),
    lead_ground: step((t) => leadAt(t).ground),
    friend_ground: step((t) => friendAt(t).ground),
    crowd_max: Math.max(...EXTRA_LIST.map((e) => {
      const a = extraAt(e, (FRAMES - 1) / FPS).ground, b = extraAt(e, 0).ground;
      const dx = ((b.x - (a.x - BAY)) % W_LANE + W_LANE * 1.5) % W_LANE - W_LANE / 2;
      return Math.abs(dx);
    })).toFixed(4),
  },
  camera_angles_deg: {last: (() => { const c = atriumCam((FRAMES - 1) / FPS); return [c.yaw, c.pitch, c.f]; })(), first: (() => { const c = atriumCam(0); return [c.yaw, c.pitch, c.f]; })()},
  DUR,
};
console.log(JSON.stringify(out, null, 1));
