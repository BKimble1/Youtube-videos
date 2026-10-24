// Visibility check for the lab shots: lists every frame where one of her arms switches between drawn and not drawn
// (she is drawn only where herDrawn(t) holds, and an arm within 25 cm of the lens is not drawn) and whether any of its joints is on screen at that moment (a pop).
// build: source/node_modules/.bin/esbuild tools/vis_check.ts --bundle --platform=node --format=cjs --jsx=automatic --outfile=/tmp/vc.cjs && node /tmp/vc.cjs qa/vis_check.json
import * as fs from 'fs';
import {labCam, herDrawn} from '../source/src/scenes/Lab';
import {LT, herLab} from '../source/src/scenes/labWorld';
import {basis, proj, lerp3} from '../source/src/rig/geo';
const out: any[] = [];
const prev: Record<string, boolean | null> = {L: null, R: null};
for (let f = Math.round(5.3 * 30); f < 952; f++) {
  const t = f / 30;
  if (t >= LT.macro && t < LT.back) { prev.L = prev.R = null; continue; }
  const b = basis(labCam(t)); const h = herLab(t);
  for (const [k, a] of [['L', h.armL], ['R', h.armR]] as const) {
    const S = proj(b, a.S), E = proj(b, a.E), W = proj(b, a.W);
    const vis = herDrawn(t) && Math.min(S.z, E.z, W.z) >= 0.25;
    if (prev[k] !== null && vis !== prev[k]) {
      // any point along the arm on screen?
      let onScreen = false;
      for (const [p, q] of [[a.S, a.E], [a.E, a.W]]) for (let i = 0; i <= 10; i++) {
        const r = proj(b, lerp3(p, q, i / 10));
        if (r.z > 0.02 && r.x > -40 && r.x < 1120 && r.y > -40 && r.y < 1960) onScreen = true;
      }
      out.push({t: +t.toFixed(3), arm: k, change: vis ? 'appears' : 'hidden', onScreen});
    }
    prev[k] = vis;
  }
}
fs.writeFileSync(process.argv[2], JSON.stringify(out, null, 1));
console.log(out.map((o) => `${o.t} ${o.arm} ${o.change}${o.onScreen ? '  ON SCREEN' : ''}`).join('\n'));
