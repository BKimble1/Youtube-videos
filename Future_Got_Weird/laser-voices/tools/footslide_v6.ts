// V6 foot-slide check: for every planted interval of the visitor's walk (and the crowd walkers), the drawn ankle's
// world position, sampled each frame, against its position at the start of the plant (metres).
import {FPS} from '../source/src/v4/core4';
import {joints4} from '../source/src/v6/rig/Crew6';
import {BODY_P} from '../source/src/v4/rig/cast4';
import {cardToWorld} from '../source/src/v4/rig/geo4';
import {visitorAt, visitorWalker, EXTRA_LIST, extraAt, CharState} from '../source/src/v6/stage6';
import {Walker} from '../source/src/v6/rig/walk6';

let TAIL = 0.04;
const slide = (fn: (t: number) => CharState, w: Walker, t0: number, t1: number) => {
  let worst = 0;
  let at: (string | number)[] = [];
  for (const [key, plants] of [['AL', w.plantsL], ['AR', w.plantsR]] as const) {
    for (const p of plants) {
      const a = Math.max(p.t0 + 0.04, t0), b = Math.min(p.t1 - TAIL, t1);
      if (b <= a) continue;
      let ref: {x: number; z: number} | null = null;
      for (let f = Math.ceil(a * FPS); f <= Math.floor(b * FPS); f++) {
        const s = fn(f / FPS);
        const q = cardToWorld(s.ground, s.heading, joints4(BODY_P, s.pose)[key]);
        if (!ref) ref = {x: q.x, z: q.z};
        const d = Math.hypot(q.x - ref.x, q.z - ref.z);
        if (d > 1) { ref = {x: q.x, z: q.z}; continue; } // a crowd lane wrapping round (off screen), not a slide
        if (d > worst) { worst = d; at = [key, +(f / FPS).toFixed(3), +p.t0.toFixed(2), +p.t1.toFixed(2)]; }
      }
    }
  }
  return {max_m: +worst.toFixed(4), at};
};
const full = slide(visitorAt, visitorWalker, 23.37, 32.3);
TAIL = 0.12;
const core = slide(visitorAt, visitorWalker, 23.37, 32.3);
TAIL = 0.04;
const out = {
  visitor_plant_core_excluding_last_0_12s: core,
  visitor_max_slide_m_23_37_to_32_3: full,
  crowd_max_slide_m: Math.max(...EXTRA_LIST.map((e) => slide((t) => extraAt(e, t), e.w, 0, 34).max_m)),
};
console.log(JSON.stringify(out, null, 1));
