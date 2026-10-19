import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {timeline} from '/home/user/Youtube-videos/Future_Got_Weird/the-last-choice/source/src/r2/film/MainR2';
import {CITY} from '/home/user/Youtube-videos/Future_Got_Weird/the-last-choice/source/src/r2/world/city';
import {_debug} from '/home/user/Youtube-videos/Future_Got_Weird/the-last-choice/source/src/r2/world/set';
const STEP = Number(process.env.STEP ?? 30);
const city = CITY();
const occ = _debug.occluders();
const rows = new Map<string, {shot: string; frames: number; oldCulled: number; nowDrawn: number; maxNow: number; ids: Set<string>}>();
let cur = '';
(globalThis as any).__REC = (p: any) => {
  const cam = p.view.pos;
  if (cam.y >= 26) return;
  let oldC = 0, now = 0; const ids: string[] = [];
  for (const b of city) {
    if (b.zone !== 'block' || b.h >= 46 || Math.abs(cam.z) >= 30) continue;
    const c = {x: (b.x0 + b.x1) / 2, y: b.h / 2, z: (b.z0 + b.z1) / 2};
    const d = Math.hypot(c.x - cam.x, c.y - cam.y, c.z - cam.z);
    if (d <= 90 || d > 4200) continue;
    oldC++;
    if (!_debug.hiddenBehind(occ, cam, b)) { now++; ids.push(b.id); }
  }
  const r = rows.get(cur) ?? {shot: cur, frames: 0, oldCulled: 0, nowDrawn: 0, maxNow: 0, ids: new Set<string>()};
  r.frames++; r.oldCulled += oldC; r.nowDrawn += now; r.maxNow = Math.max(r.maxNow, now); ids.forEach((i) => r.ids.add(i)); rows.set(cur, r);
};
for (const s of timeline()) {
  cur = s.id;
  const n = Math.max(1, Math.round((s.end - s.start) * 30));
  for (let f = 0; f < n; f += STEP) { (globalThis as any).__FRAME = f; try { renderToStaticMarkup(React.createElement(s.C)); } catch (e: any) { break; } }
}
let tot = 0;
for (const r of rows.values()) { console.log(r.shot.padEnd(14), 'frames', r.frames, 'avg old-culled', (r.oldCulled / r.frames).toFixed(0), 'avg newly drawn', (r.nowDrawn / r.frames).toFixed(1), 'max', r.maxNow, 'distinct', r.ids.size); tot += r.nowDrawn; }
console.log('total newly drawn building-frames', tot);
