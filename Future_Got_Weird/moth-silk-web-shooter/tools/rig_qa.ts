// Per-frame rig check over the whole film: for every character on screen, how far any IK limb falls short of its
// target (a stretched or detached limb), and for planted feet in the street, how far a loaded foot moves between
// frames (sliding). Output: qa/rig_qa.json
// build: source/node_modules/.bin/esbuild tools/rig_qa.ts --bundle --platform=node --format=cjs --jsx=automatic --outfile=/tmp/rq.cjs && node /tmp/rq.cjs qa/rig_qa.json
import * as fs from 'fs';
import {herAt, runnerAt, STREET_END} from '../source/src/scenes/Street';
import {herLab, LT} from '../source/src/scenes/labWorld';
import {joints4} from '../source/src/rig/Crew';
import {BODY_P, BODY_R} from '../source/src/rig/cast';
import {cardToWorld} from '../source/src/rig/geo';
import TL from '../source/src/data/timeline.json';

const FPS = 30, frames = TL.frames;
const issues: {f: number; t: number; who: string; what: string; u: number}[] = [];
let worstArm = {u: 0, t: 0, who: ''}, worstLeg = {u: 0, t: 0, who: ''};
const prevFoot: Record<string, {x: number; z: number; y: number} | null> = {};
for (let f = 0; f < frames; f++) {
  const t = f / FPS;
  const chars: {who: string; j: ReturnType<typeof joints4>; g?: any; h?: number; pose?: any}[] = [];
  if (t < STREET_END) {
    const r = runnerAt(t), h = herAt(t);
    chars.push({who: 'runner', j: joints4(BODY_R, r.pose), g: r.g, h: r.h, pose: r.pose}, {who: 'her', j: joints4(BODY_P, h.pose), g: h.g, h: h.h, pose: h.pose});
  } else if (t < LT.macro || t >= LT.back) {
    const l = herLab(t);
    chars.push({who: 'lab', j: l.j});
  }
  for (const c of chars) {
    if (c.j.armShort > worstArm.u) worstArm = {u: +c.j.armShort.toFixed(2), t: +t.toFixed(3), who: c.who};
    if (c.j.short > worstLeg.u) worstLeg = {u: +c.j.short.toFixed(2), t: +t.toFixed(3), who: c.who};
    if (c.j.armShort > 4) issues.push({f, t: +t.toFixed(3), who: c.who, what: 'arm short of target', u: +c.j.armShort.toFixed(1)});
    if (c.who !== 'lab' && c.j.short > 4) issues.push({f, t: +t.toFixed(3), who: c.who, what: 'leg short of target', u: +c.j.short.toFixed(1)});
    if (c.g) {
      for (const side of ['L', 'R'] as const) {
        const A = side === 'L' ? c.j.AL : c.j.AR;
        const w = cardToWorld(c.g, c.h!, A);
        const key = c.who + side;
        const p = prevFoot[key];
        const planted = (side === 'L' ? c.pose.footL.y : c.pose.footR.y) <= 14.5;
        if (p && planted && p.y <= 14.5) {
          const d = Math.hypot(w.x - p.x, w.z - p.z) * 100;
          if (d > 1.5) issues.push({f, t: +t.toFixed(3), who: c.who, what: `planted foot ${side} slid`, u: +d.toFixed(2)});
        }
        prevFoot[key] = {x: w.x, z: w.z, y: side === 'L' ? c.pose.footL.y : c.pose.footR.y};
      }
    }
  }
}
const out = {frames, worstArm, worstLeg, issueCount: issues.length, issues: issues.slice(0, 200)};
fs.writeFileSync(process.argv[2], JSON.stringify(out, null, 1));
console.log(JSON.stringify({worstArm, worstLeg, issueCount: issues.length, sample: issues.slice(0, 12)}, null, 1));
