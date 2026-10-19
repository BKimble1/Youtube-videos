import React from 'react';
import fs from 'node:fs';
import {renderToStaticMarkup} from 'react-dom/server';
import {timeline} from '/home/user/Youtube-videos/Future_Got_Weird/the-last-choice/source/src/r2/film/MainR2';
import {unitWorld, solveHeavy, heavyAttach, U_DIM, HEAVY_DIM} from './mechapi';
import {toView} from '/home/user/Youtube-videos/Future_Got_Weird/the-last-choice/source/src/r2/engine';
const U = U_DIM as any; const HV = HEAVY_DIM as any;
const [, , a0, a1, out] = process.argv;
const shots = timeline();
const FPS = 30;
const shotAt = (F: number) => shots.find((s) => Math.round(s.start * FPS) <= F && F < Math.round(s.end * FPS));
const g: any = globalThis;
g.__NOSCENE = true;
const f0 = Math.round(parseFloat(a0) * FPS), f1 = Math.round(parseFloat(a1) * FPS);
const d3 = (a: any, b: any) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
type Rec = {F: number; shot: string; kind: string; key: string; lod: string; parts: string[]; J?: Record<string, any>; pos: any; pxh: number; dist: number; sp: any};
let prev = new Map<string, Rec>();
const events: any[] = [];
const lodStat = new Map<string, {flips: number; seq: string}>();
const ev = (F: number, shot: string, key: string, what: string, v: number, extra = '') => events.push({F, t: +(F / FPS).toFixed(2), shot, key, what, v: +v.toFixed(3), extra});
const t0 = Date.now();
for (let F = f0; F <= f1; F++) {
  const s = shotAt(F); if (!s) { prev = new Map(); continue; }
  g.__FRAME = F - Math.round(s.start * FPS);
  const recs: Rec[] = [];
  g.__SPY = (kind: string, sp: any, res: any[]) => {
    const key = sp.key ?? `${kind[0]}${sp.id}`;
    const parts = res.filter((i: any) => i.kind === 'mesh').map((i: any) => i.key as string);
    let J: any, pos = sp.pos;
    try {
      if (kind === 'unit') {
        const r = unitWorld({...sp, lod: 'full'});
        J = {head: r.head.pos, pel: r.pelvis.pos, shL: r.sh[0], shR: r.sh[1], elL: r.el[0], elR: r.el[1], wrL: r.wr[0], wrR: r.wr[1], knL: r.kn[0], knR: r.kn[1], anL: r.an[0], anR: r.an[1], hipL: r.hip[0], hipR: r.hip[1]};
        pos = r.pelvis.pos;
      } else if (kind === 'heavy') {
        const a = heavyAttach({...sp, lod: 'full'});
        J = {hull: a.hull, f0: a.feet[0], f1: a.feet[1], f2: a.feet[2], f3: a.feet[3], k0: a.knees[0], k1: a.knees[1], k2: a.knees[2], k3: a.knees[3]};
        pos = a.hull;
      } else if (kind === 'drone') { pos = sp.pos; }
    } catch (e) { /* ignore */ }
    recs.push({F, shot: s.id, kind, key: `${kind}:${key}`, lod: sp.lod ?? 'full', parts, J, pos, pxh: 0, dist: 0, sp});
  };
  renderToStaticMarkup(<s.C />);
  const v = g.__LASTVIEW;
  const cur = new Map<string, Rec>();
  for (const r of recs) {
    if (v) { const q = toView(v, r.pos); r.dist = Math.hypot(r.pos.x - v.pos.x, r.pos.y - v.pos.y, r.pos.z - v.pos.z); r.pxh = r.kind === 'unit' ? 2.2 * v.focal / Math.max(q.z, 0.1) : r.kind === 'heavy' ? 6 * v.focal / Math.max(q.z, 0.1) : 0.75 * v.focal / Math.max(q.z, 0.1); }
    cur.set(r.key, r);
    const p = prev.get(r.key);
    if (!p || p.shot !== r.shot) continue;
    // LOD flips
    if (p.lod !== r.lod) { ev(F, r.shot, r.key, 'lod', r.pxh, `${p.lod}->${r.lod} dist ${r.dist.toFixed(0)}`); }
    // part set changes (same LOD): meshes only
    if (p.lod === r.lod) {
      const ps = new Set(p.parts), cs = new Set(r.parts);
      const gone = p.parts.filter((k) => !cs.has(k)), came = r.parts.filter((k) => !ps.has(k));
      if (gone.length || came.length) ev(F, r.shot, r.key, 'parts', gone.length + came.length, `-[${gone.join(',')}] +[${came.join(',')}]`);
    }
    // joint jumps
    if (p.J && r.J && p.lod !== 'far' || true) {
      if (p.J && r.J) for (const k of Object.keys(r.J)) {
        const j = d3(p.J[k], r.J[k]);
        const lim = r.kind === 'heavy' ? (k === 'hull' ? 0.4 : 1.2) : k.startsWith('wr') ? 0.5 : k.startsWith('an') ? 0.45 : k === 'pel' ? 0.4 : 0.35;
        if (j > lim) ev(F, r.shot, r.key, `jump ${k}`, j, `dist ${r.dist.toFixed(0)}`);
      }
    }
  }
  prev = cur;
  if ((F - f0) % 300 === 0) { console.error(`F${F} ${((Date.now() - t0) / 1000).toFixed(0)}s events ${events.length}`); fs.writeFileSync(out, JSON.stringify(events)); }
}
fs.writeFileSync(out, JSON.stringify(events));
console.log('events', events.length);
