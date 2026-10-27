// V2 caption check: for every frame with a caption, project the key action points through that frame's camera (needle
// entry and hub, the gripper's body and eight leg tips, the block, the second spider, the thumb rest while a hand is on
// it, the cutaway joint) and report any that fall inside the caption's box.
// usage: esbuild bundle -> node out.cjs qa/v2_caption_check.json
import fs from 'fs';
import {FPS} from '../source/src/lib';
import {CAPTIONS, FRAMES} from '../source/src/v2/lib2';
import {capIndex2, capY2} from '../source/src/v2/Captions2';
import {basis, Cam3, proj, V3} from '../source/src/three';
import {legLocal, legTipsWorld, SpiderPose, toWorld} from '../source/src/spider';
import {blockAt, CUT, entryOf, hookPose, overheadPose, s2At} from '../source/src/v2/world2';
import {camHook} from '../source/src/v2/shots/Hook';
import {camA} from '../source/src/v2/shots/Overhead';
import {camB, cutPose} from '../source/src/v2/shots/Cutaway';
import {camLab, rigAt} from '../source/src/v2/shots/Lab';
import {C_LEG} from '../source/src/shots/C';

const out: {f: number; caption: string; point: string; x: number; y: number}[] = [];
const SCAN = process.argv[3] === 'scan';
const free: Record<number, Set<number>> = {};
const CANDS = Array.from({length: 63}, (_, k) => 300 + k * 20);
const box = (i: number, text: string) => {
  const lines = text.length > 26 ? 2 : 1;
  const h = lines * 77 + 24;
  return {x0: 96, x1: 984, y0: capY2(i) - h / 2, y1: capY2(i) + h / 2};
};
for (let f = 0; f < FRAMES; f++) {
  const t = f / FPS;
  const i = capIndex2(t);
  if (i < 0) continue;
  const b = box(i, CAPTIONS[i].text);
  let cam: Cam3;
  const pts: [string, V3][] = [];
  const spider = (P: SpiderPose, tag = '') => {
    pts.push([`${tag}body`, P.pos], [`${tag}abdomen`, toWorld(P, [-4.75, 0, 0.35])]);
    legTipsWorld(P).forEach((p, k) => pts.push([`${tag}leg tip ${k}`, p]));
  };
  if (t < CUT.overhead) {
    cam = camHook(t);
    const P = hookPose(t);
    spider(P);
    pts.push(['needle entry', entryOf(P)]);
  } else if (t < CUT.leg) {
    cam = camA(t);
    spider(overheadPose(t));
  } else if (t < CUT.lab) {
    cam = camB(t);
    const P = cutPose(t);
    spider(P);
    pts.push(['joint', toWorld(P, legLocal(C_LEG, P.e[C_LEG])[2])]);
  } else {
    cam = camLab(t);
    const r = rigAt(t);
    spider(r.P);
    pts.push(['needle entry', r.entry], ['hub', r.hub], ['thumb rest', r.g.thumb], ['block', blockAt(t).c]);
    if (t > CUT.reveal) spider(s2At(t), 'second ');
  }
  const B = basis(cam);
  if (SCAN) {
    free[i] = free[i] ?? new Set(CANDS);
    const lines = CAPTIONS[i].text.length > 26 ? 2 : 1;
    const h = lines * 77 + 24;
    for (const y of CANDS) {
      for (const [, p] of pts) {
        const q = proj(B, p);
        if (q.z > 0 && q.x > 80 && q.x < 1000 && q.y > y - h / 2 - 16 && q.y < y + h / 2 + 16) free[i].delete(y);
      }
    }
    continue;
  }
  for (const [name, p] of pts) {
    const q = proj(B, p);
    if (q.z > 0 && q.x > b.x0 && q.x < b.x1 && q.y > b.y0 && q.y < b.y1) out.push({f, caption: CAPTIONS[i].text, point: name, x: Math.round(q.x), y: Math.round(q.y)});
  }
}
if (SCAN) {
  CAPTIONS.forEach((c, i) => {
    const ys = [...(free[i] ?? [])].sort((a, b) => a - b);
    console.log(`${i} ${c.text.padEnd(40)} ${ys.join(',')}`);
  });
  process.exit(0);
}
fs.writeFileSync(process.argv[2] ?? 'qa/v2_caption_check.json', JSON.stringify(out, null, 1));
const byCap: Record<string, string> = {};
out.forEach((o) => {
  const k = `${o.caption} :: ${o.point.replace(/ \d$/, '')}`;
  byCap[k] = byCap[k] ? `${byCap[k].split('-')[0]}-${o.f}` : `${o.f}`;
});
console.log(out.length === 0 ? 'no key point under a caption' : JSON.stringify(byCap, null, 1));
