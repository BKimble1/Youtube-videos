// Prints the V4 caption spans in frames (show, hide, placement) and writes them for QA: node <bundle> <out.json>
import fs from 'fs';
import {capAt4} from '../source/src/v4/captions4';
import {FRAMES} from '../source/src/lib';
const out: {i: number; text: string; a: number; b: number; ys: number[]}[] = [];
for (let f = 0; f < FRAMES; f++) {
  const c = capAt4(f);
  if (!c) continue;
  const last = out[out.length - 1];
  if (last && last.i === c.i) { if (!last.ys.includes(c.y)) last.ys.push(c.y); continue; }
  out.push({i: c.i, text: c.text, a: c.a, b: c.b, ys: [c.y]});
}
for (const c of out) console.log(`${String(c.a).padStart(4)}-${String(c.b).padStart(4)} (${((c.b - c.a) / 30).toFixed(2)} s) y ${c.ys.join('→')}  ${c.text}`);
if (process.argv[2]) fs.writeFileSync(process.argv[2], JSON.stringify(out, null, 1));
