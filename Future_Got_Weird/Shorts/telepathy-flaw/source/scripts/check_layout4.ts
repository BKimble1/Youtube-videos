// V4 per-frame layout check: where the caption lane meets something the story needs to show: faces (the head disc),
// hands, the implant, the small labels. Boxes are projected through the shot's camera. Writes ../qa/v4/LAYOUT_CHECK.json.
// Usage: npx tsx scripts/check_layout4.ts
import fs from 'node:fs';
import path from 'node:path';
import {chunkWindows} from '../src/lib/captions';
import {SHOTS, FPS, TOTAL4} from '../src/v4/plan4';
import {solveInterior, S as IS} from '../src/v4/world/interior';
import {interiorCam} from '../src/v4/shots/interiorShots';
import {exteriorCam} from '../src/v4/shots/exteriorShots';
import {manJoints} from '../src/v4/rig/Man';
import {womanJoints} from '../src/v4/rig/Woman';
import {solveExterior, ES} from '../src/v4/world/exterior';

type Box = {name: string; x0: number; y0: number; x1: number; y1: number};
const W = chunkWindows();
const CAP = {size: 70, line: 82, maxW: 780, cx: 495, cy: 1450};
const toS = (cam: {x: number; y: number; z: number}, p: {x: number; y: number}) => ({x: 540 + (p.x - cam.x) * cam.z, y: 960 + (p.y - cam.y) * cam.z});
const bx = (name: string, cam: {x: number; y: number; z: number}, c: {x: number; y: number}, r: number): Box => {
  const p = toS(cam, c);
  return {name, x0: p.x - r * cam.z, y0: p.y - r * cam.z, x1: p.x + r * cam.z, y1: p.y + r * cam.z};
};
const hit = (a: Box, b: Box) => a.x0 < b.x1 && a.x1 > b.x0 && a.y0 < b.y1 && a.y1 > b.y0;
const _mixC = (a: {x: number; y: number; z: number}, b: {x: number; y: number; z: number}, k: number) => ({x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k, z: a.z + (b.z - a.z) * k});
const _ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const hits: {t: number; frame: number; shot: string; caption: string; thing: string}[] = [];
const per: Record<string, {frames: number; faceHits: number; handHits: number; implantHits: number}> = {};
for (let f = 0; f < TOTAL4; f++) {
  const t = f / FPS;
  const shot = SHOTS.find((s) => t >= s.a - 1e-6 && t < s.b - 1e-6)!;
  const cw = W.find((w) => t >= w.start && t < w.end);
  if (!cw) continue;
  const text = cw.text;
  const width = Math.min(CAP.maxW, text.length * CAP.size * 0.5);
  const lines = text.length * CAP.size * 0.5 > CAP.maxW ? 2 : 1;
  const lane: Box = {name: 'caption', x0: CAP.cx - width / 2, x1: CAP.cx + width / 2, y0: CAP.cy - (lines * CAP.line) / 2, y1: CAP.cy + (lines * CAP.line) / 2};
  const things: Box[] = [];
  const interior = ['intWide', 'intTwo', 'sendFalter', 'reality', 'sendReject', 'handCup', 'calmTwo', 'realize', 'recvRecog', 'withdraw', 'sendRegister', 'signal'].includes(shot.id);
  if (interior && shot.id !== 'signal') {
    const cam = interiorCam(shot.id as never, t, shot);
    const S = solveInterior(t);
    const wj = womanJoints(S.w.pose);
    const mj = manJoints(S.m.pose);
    things.push(bx('face(woman)', cam, S.w.head, 96 * IS * 0.95), bx('face(man)', cam, S.m.head, 96 * IS * 0.95));
    things.push(bx('hand(woman near)', cam, wj.L.W, 42 * IS), bx('hand(woman far)', cam, wj.R.W, 42 * IS), bx('hand(man near)', cam, mj.L.W, 42 * IS), bx('hand(man far)', cam, mj.R.W, 42 * IS));
    const yaw = ((S.m.pose.yaw ?? 20) * Math.PI) / 180;
    things.push(bx('implant', cam, {x: S.m.head.x - 98 * Math.sin(yaw) * 0.96 * IS, y: S.m.head.y - 84 * 0.96 * IS}, 20 * IS));
  } else if (['extWide', 'recvHey', 'sendSmile'].includes(shot.id)) {
    const s0 = solveExterior(t);
    const cam = exteriorCam(shot.id as never, t, shot);
    things.push(bx('face(woman)', cam, s0.wHead, 96 * ES), bx('face(man)', cam, s0.mHead, 96 * ES), bx('hand(woman cup)', cam, s0.hand, 60 * ES));
  }
  const key = shot.id;
  per[key] = per[key] ?? {frames: 0, faceHits: 0, handHits: 0, implantHits: 0};
  per[key].frames++;
  for (const th of things) {
    if (hit(lane, th)) {
      hits.push({t: +t.toFixed(2), frame: f, shot: shot.id, caption: text, thing: th.name});
      if (th.name.startsWith('face')) per[key].faceHits++;
      else if (th.name.startsWith('hand')) per[key].handHits++;
      else per[key].implantHits++;
    }
  }
}
const out = {
  note: 'projected boxes (face = head disc, hand = ~42 rig units round the wrist, implant = the disc); the caption box is estimated from the character count, so this is a screening check, not a pixel measurement',
  perShot: per,
  hitFrames: hits.length,
  firstHits: hits.slice(0, 40),
};
const outDir = path.resolve(__dirname, '../../qa/v4');
fs.mkdirSync(outDir, {recursive: true});
fs.writeFileSync(path.join(outDir, 'LAYOUT_CHECK.json'), JSON.stringify(out, null, 1));
console.log(JSON.stringify(out.perShot, null, 1));
console.log('frames with any collision:', hits.length);
