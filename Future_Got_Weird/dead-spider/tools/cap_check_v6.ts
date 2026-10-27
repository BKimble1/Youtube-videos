// V6 caption check: for every frame with a caption, project the key action points through that frame's camera (needle
// entry and hub, the gripper's body and eight leg tips, the block, the second spider, the thumb rest while a hand is on
// it, the cutaway joint) and report any that fall inside the caption's box.
// usage: esbuild bundle -> node out.cjs qa/v6/caption_check.json [scan]
import fs from 'fs';
import {FPS} from '../source/src/lib';
import {CAPTIONS, FRAMES} from '../source/src/v2/lib2';
import {capIndex3 as capIndex2, capY3 as capY2} from '../source/src/v6/Captions3';
import {basis, Cam3, proj, V3} from '../source/src/three';
import {legLocal, legTipsWorld, SpiderPose, toWorld} from '../source/src/spider';
import {blockAt, B_LEG, CUT, entryOf, hookPose, leafPose, natPose, s2At} from '../source/src/v6/world3';
import {camHook3} from '../source/src/v6/shots/Hook3';
import {camNat} from '../source/src/v6/shots/Nature3';
import {camLeaf} from '../source/src/v6/shots/Leaf3';
import {camLab3, rigAt3} from '../source/src/v6/shots/Lab3';

const out: {f: number; caption: string; point: string; x: number; y: number}[] = [];
const SCAN = process.argv[3] === 'scan';
const free: Record<number, Set<number>> = {};
const CANDS = Array.from({length: 63}, (_, k) => 300 + k * 20);
const box = (i: number, text: string) => {
  const lines = text.length > 21 ? 2 : 1;
  const h = lines * 77 + 24;
  return {x0: 110, x1: 870, y0: capY2(i) - h / 2, y1: capY2(i) + h / 2};
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
  if (t < CUT.nature) {
    cam = camHook3(t);
    const P = hookPose(t);
    spider(P);
    pts.push(['needle entry', entryOf(P)]);
  } else if (t < CUT.leaf) {
    cam = camNat(t);
    spider(natPose(t));
  } else if (t < CUT.lab) {
    cam = camLeaf(t);
    const P = leafPose(t);
    spider(P);
    pts.push(['joint', toWorld(P, legLocal(B_LEG, P.e[B_LEG], P.dth?.[B_LEG] ?? 0)[2])]);
  } else {
    cam = camLab3(t);
    const r = rigAt3(t);
    spider(r.P);
    pts.push(['needle entry', r.entry], ['hub', r.hub], ['thumb rest', r.g.thumb], ['block', blockAt(t).c]);
    if (t > CUT.travel) spider(s2At(t), 'second ');
  }
  const B = basis(cam);
  if (SCAN) {
    free[i] = free[i] ?? new Set(CANDS);
    const lines = CAPTIONS[i].text.length > 21 ? 2 : 1;
    const h = lines * 77 + 24;
    for (const y of CANDS) {
      for (const [, p] of pts) {
        const q = proj(B, p);
        if (q.z > 0 && q.x > 100 && q.x < 880 && q.y > y - h / 2 - 16 && q.y < y + h / 2 + 16) free[i].delete(y);
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
fs.writeFileSync(process.argv[2] ?? 'qa/v6/caption_check.json', JSON.stringify(out, null, 1));
const byCap: Record<string, string> = {};
out.forEach((o) => {
  const k = `${o.caption} :: ${o.point.replace(/ \d$/, '')}`;
  byCap[k] = byCap[k] ? `${byCap[k].split('-')[0]}-${o.f}` : `${o.f}`;
});
console.log(out.length === 0 ? 'no key point under a caption' : JSON.stringify(byCap, null, 1));
