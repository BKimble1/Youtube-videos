// Per-frame layout check: does the caption lane collide with anything the story needs to show?
// For every captioned frame, the screen-space boxes of the faces' eye regions, the chip, the interface panels, the
// packets and bubbles and the cancel button are tested against the caption box. Writes ../qa/LAYOUT_CHECK.json.
// Usage: npx tsx scripts/check_layout.ts
import fs from 'node:fs';
import path from 'node:path';
import {B, FPS, T, TOTAL} from '../src/lib/timeline';
import {chunkWindows} from '../src/lib/captions';
import {
  camAt, cancelState, CANCEL_C, hookU, hudState, HUD_C, normalU, PANEL_C, panelState, QUEUED, queuedU, redU, RED_FORMS, routeAt,
  senderState, receiverState,
} from '../src/lib/choreo';
import {RECEIVER_C, RECEIVER_R, SENDER_C, SENDER_R} from '../src/art/Figures';
import {routePoint} from '../src/art/Ui';
import {chipWorld} from '../src/art/Section';

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
for (let f = 0; f < TOTAL; f++) {
  const t = f / FPS;
  const c = W.find((w) => t >= w.start && t < w.end);
  if (!c) continue;
  captioned++;
  const lines = c.text.length * 36 > 780 ? 2 : 1;
  const w = Math.min(780, c.text.length * 36);
  const cap: Box = {name: 'caption', x0: 495 - w / 2, x1: 495 + w / 2, y0: 1450 - (lines * 82) / 2 - 8, y1: 1450 + (lines * 82) / 2 + 8};
  const cam = camAt(f);
  const ss = senderState(t);
  const rs = receiverState(t);
  const els: Box[] = [];
  // faces: the eye/brow band of each head (the part the story acts with)
  els.push(box('sender eyes', cam, SENDER_C.x + ss.shiftX * 0.7, SENDER_C.y + ss.shiftY * 0.7 - 20, SENDER_R * 0.8, SENDER_R * 0.55));
  els.push(box('sender mouth', cam, SENDER_C.x + ss.shiftX * 0.7 + 25, SENDER_C.y + ss.shiftY * 0.7 + 60, SENDER_R * 0.45, SENDER_R * 0.25));
  els.push(box('receiver eyes', cam, RECEIVER_C.x + rs.shiftX * 0.8, RECEIVER_C.y + rs.shiftY * 0.8 - 20, RECEIVER_R * 0.8, RECEIVER_R * 0.55));
  els.push(box('receiver mouth', cam, RECEIVER_C.x + rs.shiftX * 0.8 - 20, RECEIVER_C.y + rs.shiftY * 0.8 + 55, RECEIVER_R * 0.45, RECEIVER_R * 0.25));
  const route = routeAt(t);
  const chip = route.A;
  els.push(box('chip', cam, chip.x, chip.y, 30, 30));
  const hud = hudState(t);
  if (hud.alpha > 0.3) els.push(box('receiver HUD', cam, HUD_C.x, HUD_C.y, 180, 135));
  const pan = panelState(t);
  if (pan.alpha > 0.3) els.push(box('sender panel', cam, PANEL_C.x, PANEL_C.y, 230, 125));
  if (cancelState(t).alpha > 0.3) els.push(box('cancel button', cam, CANCEL_C.x, CANCEL_C.y, 52, 52));
  const pk = (name: string, u: number) => {
    const p = routePoint(route, u);
    els.push(box(name, cam, p.x, p.y, 36, 32));
  };
  if (t > B.sendHook - 0.3 && t < B.arriveHook) pk('hook packet', hookU(t));
  if (t > B.sendNormal && t < B.arriveNormal) pk('normal packet', normalU(t));
  if (t > RED_FORMS && t < B.redArrives) pk('red packet', t < B.redLeaves ? 0.04 : redU(t));
  if (t > QUEUED.from && t < QUEUED.to) pk('queued Hey', queuedU(t));
  if (t > B.heyForms && t < B.sendNormal) els.push(box('Hey bubble', cam, chip.x + 8, chip.y - 92, 76, 50));
  for (const e of els) {
    if (hit(cap, e)) {
      const r = (found[e.name] ??= {frames: [], first: f, last: f});
      r.frames.push(f);
      r.last = f;
    }
  }
}
const ranges = (a: number[]) => a.reduce((r: number[][], f) => { const l = r[r.length - 1]; if (l && f - l[1] <= 1) l[1] = f; else r.push([f, f]); return r; }, []).map((x) => x[0] === x[1] ? `${x[0]}` : `${x[0]}-${x[1]}`).join(", ");
const out = {captioned_frames: captioned, collisions: Object.fromEntries(Object.entries(found).map(([k, v]) => [k, {frames: ranges(v.frames), count: v.frames.length, first: v.first, last: v.last, first_s: +(v.first / FPS).toFixed(2), last_s: +(v.last / FPS).toFixed(2)}]))};
fs.mkdirSync(path.resolve(__dirname, '..', '..', 'qa'), {recursive: true});
fs.writeFileSync(path.resolve(__dirname, '..', '..', 'qa', 'LAYOUT_CHECK.json'), JSON.stringify(out, null, 1));
console.log(JSON.stringify(out, null, 1));
void T;
