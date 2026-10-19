import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {timeline} from '/home/user/Youtube-videos/Future_Got_Weird/the-last-choice/source/src/r2/film/MainR2';
import * as fs from 'node:fs';
const STEP = Number(process.env.STEP ?? 6);
const out: any[] = [];
let cur: any = null;
(globalThis as any).__REC = (p: any) => { if (cur) cur.cams.push({f: (globalThis as any).__FRAME, x: p.view.pos.x, y: p.view.pos.y, z: p.view.pos.z}); };
for (const s of timeline()) {
  cur = {id: s.id, start: s.start, end: s.end, cams: []}; out.push(cur);
  const n = Math.max(1, Math.round((s.end - s.start) * 30));
  for (let f = 0; f < n; f += STEP) { (globalThis as any).__FRAME = f; try { renderToStaticMarkup(React.createElement(s.C)); } catch (e: any) { break; } }
}
fs.writeFileSync('cams.json', JSON.stringify(out));
console.log('shots', out.length);
