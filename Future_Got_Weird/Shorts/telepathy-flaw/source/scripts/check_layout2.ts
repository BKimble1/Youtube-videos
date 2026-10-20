// V2 per-frame layout check: does the caption lane collide with anything the story needs to show (faces' eye regions,
// packets, the cancel control and its track, the warning card, the AR card, the waiting Hey)?
// Writes ../qa/v2/LAYOUT_CHECK.json. Usage: npx tsx scripts/check_layout2.ts
import fs from 'node:fs';
import path from 'node:path';
import {chunkWindows} from '../src/lib/captions';
import {routePoint} from '../src/art/Ui';
import {
  arCard, camAt2, CARD_C, FPS, heyQueued, HEYQ_C, headW, hookAlpha, hookU, normalAlpha, normalU, receiverEye, redAlpha, redU, routeAt2, TOTAL2, UNDO_C, undoChip, warnCard,
  WARN_C, SR, RR, V2,
} from '../src/v2/choreo2';

type Box = {name: string; x0: number; y0: number; x1: number; y1: number};
const W = chunkWindows();
const toS = (cam: {x: number; y: number; z: number}, p: {x: number; y: number}) => ({x: 540 + (p.x - cam.x) * cam.z, y: 960 + (p.y - cam.y) * cam.z});
const box = (name: string, cam: {x: number; y: number; z: number}, cx: number, cy: number, hw: number, hh: number): Box => {
  const c = toS(cam, {x: cx, y: cy});
  return {name, x0: c.x - hw * cam.z, y0: c.y - hh * cam.z, x1: c.x + hw * cam.z, y1: c.y + hh * cam.z};
};
const hit = (a: Box, b: Box) => a.x0 < b.x1 && a.x1 > b.x0 && a.y0 < b.y1 && a.y1 > b.y0;
const found: Record<string, {frames: number[]; first: number; last: number}> = {};
let captioned = 0;
for (let f = 0; f < TOTAL2; f++) {
  const t = f / FPS;
  const c = W.find((w) => t >= w.start && t < w.end);
  if (!c) continue;
  captioned++;
  const lines = c.text.length * 36 > 780 ? 2 : 1;
  const w = Math.min(780, c.text.length * 36);
  const cap: Box = {name: 'caption', x0: 495 - w / 2, x1: 495 + w / 2, y0: 1450 - (lines * 82) / 2 - 8, y1: 1450 + (lines * 82) / 2 + 8};
  const cam = camAt2(t);
  const els: Box[] = [];
  // the sender's eye/brow band (head space 58,-30; 44 wide, 40 tall) - only when the head is a normal exterior view
  if (cam.z < 6) {
    const e = headW({x: 58, y: -28}, t);
    els.push(box('sender eyes', cam, e.x, e.y, 30 * (SR / 100), 26 * (SR / 100)));
  }
  const re = receiverEye(t);
  els.push(box('receiver eyes', cam, re.x, re.y, 70 * (RR / 125), 40 * (RR / 125)));
  const route = routeAt2(t);
  if (hookAlpha(t) > 0.3) els.push(box('hook packet', cam, routePoint(route, hookU(t)).x, routePoint(route, hookU(t)).y, 70 / cam.z, 55 / cam.z));
  if (normalAlpha(t) > 0.3) els.push(box('packet', cam, routePoint(route, normalU(t)).x, routePoint(route, normalU(t)).y, 70 / cam.z, 55 / cam.z));
  if (redAlpha(t) > 0.3) els.push(box('red packet', cam, routePoint(route, redU(t)).x, routePoint(route, redU(t)).y, 70 / cam.z, 55 / cam.z));
  if (undoChip(t).alpha > 0.3) els.push(box('cancel control', cam, UNDO_C.x + 50, UNDO_C.y - 50, 100, 85));
  if (warnCard(t).alpha > 0.3) els.push(box('warning card', cam, WARN_C.x, WARN_C.y, 171 * 0.9, 68 * 0.9));
  if (arCard(t).alpha > 0.3) els.push(box('AR card', cam, CARD_C.x, CARD_C.y, 125, 93));
  if (heyQueued(t) > 0.3) els.push(box('waiting Hey', cam, HEYQ_C.x, HEYQ_C.y, 75, 50));
  for (const e of els) {
    if (hit(cap, e)) {
      const k = e.name;
      found[k] ??= {frames: [], first: f, last: f};
      found[k].frames.push(f);
      found[k].last = f;
    }
  }
}
const out: Record<string, unknown> = {captioned_frames: captioned, collisions: {}};
for (const [k, v] of Object.entries(found)) (out.collisions as Record<string, unknown>)[k] = {count: v.frames.length, first: v.first, last: v.last, first_s: +(v.first / FPS).toFixed(2), last_s: +(v.last / FPS).toFixed(2), frames: v.frames.length < 40 ? v.frames : undefined};
fs.mkdirSync(path.resolve(__dirname, '..', '..', 'qa', 'v2'), {recursive: true});
fs.writeFileSync(path.resolve(__dirname, '..', '..', 'qa', 'v2', 'LAYOUT_CHECK.json'), JSON.stringify(out, null, 1));
console.log(JSON.stringify(out, null, 1));
void V2;
