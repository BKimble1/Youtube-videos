// V3 rig and motion QA over every frame (the source's own pose functions, not the MP4): anatomy limits for both
// characters, foot contact, and motion continuity (jerks) of joints and camera inside each shot. Writes JSON.
// usage: bundle with esbuild (platform node), then: node rig_qa_v3.cjs <out.json>
import fs from 'node:fs';
import {DUR, FPS} from '../source/src/world';
import {a3, d3, l3, m3, n3, s3, V3} from '../source/src/v2/p3';
import {camAt, guardAt, shotAt, womanAt} from '../source/src/v3/story3';
import {DIM_G3, DIM_W3, Dims3, joints3, Pose3} from '../source/src/v3/Person3';

type Flag = {t: number; who: string; what: string; v: number};
const flags: Flag[] = [];
const N = Math.round(DUR * FPS);
const track: Record<string, V3[]> = {};
const push = (k: string, p: V3) => (track[k] ??= []).push(p);
const check = (who: string, pz: Pose3, D: Dims3, t: number) => {
  const j = joints3(pz, D);
  // knees: bend direction must point the way the foot points
  (['l', 'r'] as const).forEach((k) => {
    const g = j.legs[k];
    const mid = m3(a3(g.H, g.A), 0.5);
    const off = s3(g.K, mid);
    const ff = v3f(Math.sin(g.yaw), 0, Math.cos(g.yaw));
    if (l3(off) > 0.02 && d3(n3(off), ff) < 0.2) flags.push({t, who, what: `knee ${k} not over toes`, v: +d3(n3(off), ff).toFixed(2)});
    // planted foot reachable (no floating shoe)
    const f = pz.feet[k];
    const miss = l3(s3(g.A, f.ank));
    if (f.contact > 0 && miss > 0.012) flags.push({t, who, what: `foot ${k} unreachable`, v: +miss.toFixed(3)});
    if (g.A.y < D.foot.ankH - 0.006) flags.push({t, who, what: `foot ${k} below floor`, v: +g.A.y.toFixed(3)});
    push(`${who}.knee${k}`, g.K); push(`${who}.ank${k}`, g.A);
  });
  (['R', 'L'] as const).forEach((k) => {
    const a = j[k];
    const mid = m3(a3(a.S, a.W), 0.5);
    const off = s3(a.E, mid);
    if (l3(off) > 0.03) {
      const b = n3(off);
      if (d3(b, j.Fs) > 0.55 && d3(b, v3f(0, 1, 0)) > 0.35) flags.push({t, who, what: `elbow ${k} points forward-up`, v: +d3(b, j.Fs).toFixed(2)});
    }
    // elbow and wrist outside the chest
    [['elbow', a.E], ['wrist', a.W]].forEach(([nm, p]) => {
      const rel = s3(p as V3, j.P);
      const ax = d3(rel, j.thor);
      if (ax > 0.08 && ax < D.torso * 0.95) {
        const rad = s3(rel, m3(j.thor, ax));
        const e = (d3(rad, j.Rs) / D.rings.chestA) ** 2 + (d3(rad, j.Fs) / D.rings.chestB) ** 2;
        if (e < 0.8) flags.push({t, who, what: `${nm} ${k} inside torso`, v: +e.toFixed(2)});
      }
    });
    push(`${who}.elbow${k}`, a.E); push(`${who}.wrist${k}`, a.W);
  });
  push(`${who}.head`, j.Hc); push(`${who}.pelvis`, j.P); push(`${who}.chest`, j.S);
};
const v3f = (x: number, y: number, z: number): V3 => ({x, y, z});
const shots: string[] = [];
for (let f = 0; f < N; f++) {
  const t = f / FPS;
  shots.push(shotAt(t));
  check('her', womanAt(t).pose, DIM_W3, t);
  check('guard', guardAt(t), DIM_G3, t);
  const c = camAt(t);
  push('cam.pos', c.pos); push('cam.tgt', c.tgt);
}
// jerks: second differences (m/frame^2) far above their neighbourhood inside a shot
const jerks: Flag[] = [];
for (const [k, ps] of Object.entries(track)) {
  const acc: number[] = [];
  for (let i = 1; i < ps.length - 1; i++) acc.push(l3(a3(s3(ps[i + 1], ps[i]), s3(ps[i - 1], ps[i]))));
  for (let i = 1; i < acc.length - 1; i++) {
    const f = i + 1;
    if (shots[f - 1] !== shots[f] || shots[f] !== shots[f + 1]) continue;
    const lim = k.startsWith('cam') ? 0.02 : 0.03;
    if (acc[i] > lim) jerks.push({t: +(f / FPS).toFixed(3), who: k, what: 'accel spike', v: +acc[i].toFixed(3)});
  }
}
const sum = (arr: Flag[]) => {
  const g: Record<string, {n: number; first: number; last: number; worst: number}> = {};
  arr.forEach((x) => {
    const key = `${x.who}: ${x.what}`;
    const e = (g[key] ??= {n: 0, first: x.t, last: x.t, worst: x.v});
    e.n++; e.last = x.t; if (Math.abs(x.v) > Math.abs(e.worst)) e.worst = x.v;
  });
  return g;
};
fs.writeFileSync(process.argv[2], JSON.stringify({frames: N, anatomy: sum(flags), jerks: sum(jerks), jerkList: jerks, anatomyList: flags.slice(0, 400)}, null, 1));
console.log(JSON.stringify({anatomy: sum(flags), jerks: sum(jerks)}, null, 1));
