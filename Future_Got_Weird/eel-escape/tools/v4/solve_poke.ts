// Solve the S7 POKE camera so the outside matches the inside at the cut (v4/timing.ts hand-off 2): the exit lands on
// POKE_AT, the tip's travel (the exit's outward direction) on POKE_DIR, the cover's rear edge along EDGE, and the tip
// moves at POKE_SPEED px/s (4 u/s along the body). Prints an Orbit for shots/Exterior.tsx POKE_ORBIT.
//   npx esbuild tools/v4/solve_poke.ts --bundle --platform=node --outfile=/tmp/x.js && node /tmp/x.js [edgeTangent x,y,z]
import {basis, norm3, orbitCam, proj, sub3, add3, mul3, V3} from '../../source/src/v4/three';
import {EDGE, POKE_AT, POKE_DIR, POKE_SPEED} from '../../source/src/v4/timing';
import {predGeom, PRED_REST} from '../../source/src/v4/pred';
import {OPERCLE_EDGE} from '../../source/src/anatomy';

const B0 = basis(orbitCam({target: [0, 0, 0], az: 0, el: 0, d: 100, f: 1000}));
const g = predGeom(B0, PRED_REST);
import {EXIT0} from '../../source/src/v4/escape';
const ex = EXIT0.p, out = norm3(EXIT0.out);
let edgeT: V3;
if (process.argv[2]) edgeT = norm3(process.argv[2].split(',').map(Number) as V3);
else {
  // the cover's rear edge near the exit, on the cheek surface (z rises toward the middle of the edge)
  const a = OPERCLE_EDGE[1], b = OPERCLE_EDGE[3];
  edgeT = norm3([b.x - a.x, b.y - a.y, 1.5]);
}
const ed = {x: EDGE[3].x - EDGE[1].x, y: EDGE[3].y - EDGE[1].y};
const el0 = Math.hypot(ed.x, ed.y);
const edgeDir = {x: ed.x / el0, y: ed.y / el0};
const f = 1300;
const sols: {err: number; az: number; el: number; roll: number; d: number; fs: number}[] = [];
for (let az = -40; az <= 100; az += 2)
  for (let el = -60; el <= 60; el += 2)
    for (let roll = -90; roll <= 90; roll += 1) {
      const B = basis(orbitCam({target: ex, az, el, d: 22, f, cx: POKE_AT.x, cy: POKE_AT.y, roll}));
      const p0 = proj(B, ex);
      const p1 = proj(B, add3(ex, mul3(out, 0.3)));
      const q1 = proj(B, add3(ex, mul3(edgeT, 0.3)));
      const dv = {x: p1.x - p0.x, y: p1.y - p0.y};
      const lv = Math.hypot(dv.x, dv.y);
      const de = {x: q1.x - p0.x, y: q1.y - p0.y};
      const le = Math.hypot(de.x, de.y);
      // the edge's sense is free (either direction along it)
      const e1 = 1 - (dv.x * POKE_DIR.x + dv.y * POKE_DIR.y) / lv;
      const e2 = 1 - Math.abs(de.x * edgeDir.x + de.y * edgeDir.y) / le;
      // prefer the tip not foreshortened much (fs: projected length per unit at d=22 relative to unforeshortened)
      const fs = lv / (0.3 * p0.s);
      const err = e1 * 4 + e2 + 0.15 * (1 - fs);
      if (err < 0.06) sols.push({err, az, el, roll, d: 0, fs});
    }
// distinct solutions (best per 15° az x 15° el cell), with the distance for the speed:
// screen speed = 4 u/s * (f/d) * fs = POKE_SPEED
sols.sort((a, b) => a.err - b.err);
const cells = new Map<string, typeof sols[0]>();
for (const s of sols) { const k = `${Math.round(s.az / 15)},${Math.round(s.el / 15)}`; if (!cells.has(k)) cells.set(k, s); }
for (const s of [...cells.values()].slice(0, 12)) {
  s.d = (4 * f * s.fs) / POKE_SPEED;
  console.log(JSON.stringify({target: ex, az: s.az, el: s.el, roll: s.roll, d: +s.d.toFixed(2), f, cx: POKE_AT.x, cy: POKE_AT.y, err: +s.err.toFixed(4), fs: +s.fs.toFixed(3)}));
}
