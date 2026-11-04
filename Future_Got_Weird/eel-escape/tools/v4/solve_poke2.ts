// Re-solve the S7 POKE camera against the actual exit at the cut (escape.exitAt(T.poke)) and the tip's actual
// outward direction there, AND keep the predator's eye in frame at the cut (a landmark from the first frame).
//   npx tsx tools/v4/solve_poke2.ts  (from source/: npx tsx ../tools/v4/solve_poke2.ts)
import {basis, norm3, orbitCam, proj, add3, mul3, V3} from '../../source/src/v4/three';
import {EDGE, POKE_AT, POKE_DIR, POKE_SPEED} from '../../source/src/v4/timing';
import {OPERCLE_EDGE, EYE} from '../../source/src/anatomy';
import {exitAt, dirOf} from '../../source/src/v4/escape';
const D = Math.PI / 180;
const ex = exitAt(12.58).p as V3;
const out = norm3(dirOf(17 * D, 25 * D));
const a0 = OPERCLE_EDGE[1], b0 = OPERCLE_EDGE[3];
const edgeT = norm3([b0.x - a0.x, b0.y - a0.y, 1.5]);
const ed = {x: EDGE[3].x - EDGE[1].x, y: EDGE[3].y - EDGE[1].y};
const el0 = Math.hypot(ed.x, ed.y);
const edgeDir = {x: ed.x / el0, y: ed.y / el0};
const eyeW: V3 = [EYE.c.x, EYE.c.y, 5];
const f = 1300;
const sols: any[] = [];
for (let az = -40; az <= 100; az += 2)
  for (let el = -60; el <= 60; el += 2)
    for (let roll = -60; roll <= 60; roll += 1) {
      const B = basis(orbitCam({target: ex, az, el, d: 22, f, cx: POKE_AT.x, cy: POKE_AT.y, roll}));
      const p0 = proj(B, ex), p1 = proj(B, add3(ex, mul3(out, 0.3))), q1 = proj(B, add3(ex, mul3(edgeT, 0.3)));
      const dv = {x: p1.x - p0.x, y: p1.y - p0.y}, lv = Math.hypot(dv.x, dv.y);
      const de = {x: q1.x - p0.x, y: q1.y - p0.y}, le = Math.hypot(de.x, de.y);
      const e1 = 1 - (dv.x * POKE_DIR.x + dv.y * POKE_DIR.y) / lv;
      const e2 = 1 - Math.abs(de.x * edgeDir.x + de.y * edgeDir.y) / le;
      const fs = lv / (0.3 * p0.s);
      const err = e1 * 4 + e2 + 0.15 * (1 - fs);
      if (err > 0.2) continue;
      const d = (4 * f * fs) / POKE_SPEED;
      const B2 = basis(orbitCam({target: ex, az, el, d, f, cx: POKE_AT.x, cy: POKE_AT.y, roll}));
      const pe = proj(B2, eyeW);
      const inFrame = pe.z > 1 && pe.x > 30 && pe.x < 1050 && pe.y > 540 && pe.y < 1750;
      if (inFrame) sols.push({az, el, roll, d: +d.toFixed(2), err: +err.toFixed(4), fs: +fs.toFixed(3), eye: [Math.round(pe.x), Math.round(pe.y)]});
    }
sols.sort((a, b) => a.err - b.err);
console.log('exit', JSON.stringify(ex.map((v) => +v.toFixed(3))), 'n', sols.length);
const cells = new Map<string, any>();
for (const s of sols) { const k = `${Math.round(s.az / 10)},${Math.round(s.el / 10)}`; if (!cells.has(k)) cells.set(k, s); }
for (const s of [...cells.values()].slice(0, 12)) console.log(JSON.stringify(s));
