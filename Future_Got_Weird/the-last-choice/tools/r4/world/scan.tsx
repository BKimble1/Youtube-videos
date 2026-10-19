import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {timeline} from '/home/user/Youtube-videos/Future_Got_Weird/the-last-choice/source/src/r2/film/MainR2';
import {groundH} from '/home/user/Youtube-videos/Future_Got_Weird/the-last-choice/source/src/r2/world/ground';
import {xfPoint} from '/home/user/Youtube-videos/Future_Got_Weird/the-last-choice/source/src/r2/engine';
import * as fs from 'node:fs';

const STEP = Number(process.env.STEP ?? 15); // frames
const ONLY = process.env.ONLY ? new RegExp(process.env.ONLY) : null;
type Rec = {shot: string; key: string; frames: number[]; minGap: number; maxSink: number; r: number; cx: number; cy: number; cz: number; minY: number; maxY: number; nv: number; dyn: boolean; gapAt: number};
const recs = new Map<string, Rec>();
const chipRecs = new Map<string, {shot: string; key: string; f: number[]; gap: number[]; pos: any[]}>();
let curShot = '', curFrame = 0;
(globalThis as any).__REC = (p: any) => {
  for (const it of p.items) {
    if (it.kind === 'mesh') {
      const key: string = it.key ?? '?';
      if (/^(road_|walk_|kerb_|band_|ridge_|crater_|bl_|a1peel)/.test(key)) continue;
      const m = it.mesh;
      if (m.radius > 14) continue;
      const W = m.verts.map((v: any, i: number) => { let q = it.xf ? xfPoint(v, it.xf) : v; if (it.fn) q = it.fn(q, i); return q; });
      let minGap = 1e9, maxSink = -1e9, minY = 1e9, maxY = -1e9, gapAt = 0, cx = 0, cy = 0, cz = 0;
      W.forEach((q: any, i: number) => { const g = q.y - groundH(q.x, q.z); if (g < minGap) { minGap = g; gapAt = i; } if (-g > maxSink) maxSink = -g; minY = Math.min(minY, q.y); maxY = Math.max(maxY, q.y); cx += q.x; cy += q.y; cz += q.z; });
      cx /= W.length; cy /= W.length; cz /= W.length;
      const id = `${curShot}|${key}`;
      const prev = recs.get(id);
      const rec: Rec = {shot: curShot, key, frames: [curFrame], minGap, maxSink, r: m.radius * (typeof it.xf?.scale === 'number' ? it.xf.scale : 1), cx, cy, cz, minY, maxY, nv: W.length, dyn: !!it.fn, gapAt};
      if (!prev) recs.set(id, rec);
      else { prev.frames.push(curFrame); if (minGap > prev.minGap) { prev.minGap = minGap; prev.cx = cx; prev.cy = cy; prev.cz = cz; } prev.maxSink = Math.max(prev.maxSink, maxSink); }
    } else if (it.kind === 'sprite' && /_c\d+$/.test(it.key ?? '')) {
      const id = `${curShot}|${it.key}`;
      let c = chipRecs.get(id);
      if (!c) { c = {shot: curShot, key: it.key, f: [], gap: [], pos: []}; chipRecs.set(id, c); }
      c.f.push(curFrame); c.gap.push(it.pos.y - groundH(it.pos.x, it.pos.z)); c.pos.push([it.pos.x, it.pos.y, it.pos.z]);
    }
  }
};
const tl = timeline();
for (const s of tl) {
  if (ONLY && !ONLY.test(s.id)) continue;
  curShot = s.id;
  const n = Math.max(1, Math.round((s.end - s.start) * 30));
  for (let f = 0; f < n; f += STEP) {
    curFrame = f; (globalThis as any).__FRAME = f;
    try { renderToStaticMarkup(React.createElement(s.C)); } catch (e: any) { console.error('ERR', s.id, f, String(e.message).slice(0, 120)); break; }
  }
  console.error('done', s.id, n);
}
fs.writeFileSync(process.env.OUT ?? 'scan.json', JSON.stringify({recs: [...recs.values()], chips: [...chipRecs.values()]}));
