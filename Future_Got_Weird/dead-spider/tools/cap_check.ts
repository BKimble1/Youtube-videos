// Caption check: for every frame with a caption, project the key action points through that shot's camera (the needle
// entry, the gripper's body, its eight leg tips, the payload, the joint in the cutaway) and report any that fall inside the
// caption's box. usage: esbuild bundle -> node out.cjs qa/caption_check.json
import fs from 'fs';
import {CAPTIONS, FPS, FRAMES} from '../source/src/lib';
import {capIndex, capY} from '../source/src/Captions';
import {basis, Cam3, proj, V3} from '../source/src/three';
import {legTipsWorld, legLocal, toWorld} from '../source/src/spider';
import {BLOCK, CUT, D_BLOCK_LIFT, E_WEIGHT_C, gripperPose, needleEntry, S2_AT} from '../source/src/world';
import {camA} from '../source/src/shots/A';
import {camD} from '../source/src/shots/D';
import {camE} from '../source/src/shots/E';
import {camF} from '../source/src/shots/F';
import {cPose, C_LEG} from '../source/src/shots/C';

// C's camera is internal to the shot; recompute it the same way through the exported pose is not possible, so the
// cutaway is checked against the joint and body with the caption band only (captions sit at the top there)
const out: {f: number; caption: string; point: string; x: number; y: number}[] = [];
const box = (i: number, text: string) => {
  const lines = text.length > 26 ? 2 : 1;
  const h = lines * 77 + 20;
  return {x0: 96, x1: 984, y0: capY(i) - h / 2, y1: capY(i) + h / 2};
};
for (let f = 0; f < FRAMES; f++) {
  const t = f / FPS;
  const i = capIndex(t);
  if (i < 0) continue;
  const b = box(i, CAPTIONS[i].text);
  let cam: Cam3 | null = null;
  const pts: [string, V3][] = [];
  const grip = (st: 'A' | 'D' | 'E' | 'F') => {
    const P = gripperPose(t, st);
    pts.push(['needle entry', needleEntry(P)], ['body', P.pos]);
    legTipsWorld(P).forEach((p, k) => pts.push([`leg tip ${k}`, p]));
  };
  if (t < CUT.cutaway) {
    cam = camA(t);
    grip('A');
  } else if (t < CUT.specimenD) {
    // cutaway: the joint and body are in the middle band; the captions there sit at y 380
    const P = cPose(t);
    const J = toWorld(P, legLocal(C_LEG, P.e[C_LEG])[2]);
    void J;
    continue;
  } else if (t < CUT.load) {
    cam = camD(t);
    if (t < CUT.operator || t >= CUT.low - 0.4) {
      grip('D');
      pts.push(['block', [BLOCK.c[0], BLOCK.c[1], BLOCK.c[2] + D_BLOCK_LIFT(t)]]);
    }
  } else if (t < CUT.tray) {
    cam = camE(t);
    grip('E');
    pts.push(['weight', E_WEIGHT_C(t)]);
  } else {
    cam = camF(t);
    grip('F');
    pts.push(['second spider', S2_AT(t).pos]);
  }
  if (!cam) continue;
  const B = basis(cam);
  for (const [name, p] of pts) {
    const q = proj(B, p);
    if (q.z > 0 && q.x > b.x0 && q.x < b.x1 && q.y > b.y0 && q.y < b.y1) out.push({f, caption: CAPTIONS[i].text, point: name, x: Math.round(q.x), y: Math.round(q.y)});
  }
}
fs.writeFileSync(process.argv[2] ?? 'qa/caption_check.json', JSON.stringify(out, null, 1));
const byCap: Record<string, number> = {};
out.forEach((o) => (byCap[`${o.caption} :: ${o.point.replace(/ \d$/, '')}`] = (byCap[`${o.caption} :: ${o.point.replace(/ \d$/, '')}`] ?? 0) + 1));
console.log(out.length === 0 ? 'no key point under a caption' : JSON.stringify(byCap, null, 1));
