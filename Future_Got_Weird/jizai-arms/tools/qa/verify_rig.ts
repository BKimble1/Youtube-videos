// Mechanical QA over every frame of the film (30 fps):
//  1. joint limits: every arm pose requested inside the prototype's limits (no silent clamping)
//  2. human hands: world-targeted hands reach their target (operator on the model, wearers on plug and link)
//  3. controller: the half-scale model's joint positions are exactly 0.5x the full arm's (S1 - S4)
//  4. clearance: no robot segment passes through a head (distance from head centre > head radius + link radius)
//  5. camera: frame-to-frame eye / target / focal jumps (flags anything not on a listed deliberate cut)
//  6. frame 0: six arms on screen (2 human hands + 4 robot hands inside the frame)
//  7. loop: last frame vs frame 0, the foreground robot hand's screen position and size
import {stateAt} from '../../source/src/film/Film';
import {proj, s3, l3, a3, k3, v3, V3} from '../../source/src/r3/m3';
import {plugged} from '../../source/src/r3/stage';
import {armFK, limitPose, ArmPose} from '../../source/src/r3/robot';
import {bodyGeo, BD} from '../../source/src/r3/body';
import {slotGeoMini} from '../../source/src/film/s1';
import * as fs from 'fs';

const FPS = 30, NF = 930;
const CUTS = [Math.round(18.5 * 30), Math.round(21.6 * 30)];
const out: Record<string, unknown> = {};
let lim: string[] = [], reach: string[] = [], mirror = 0, clash: string[] = [];
let pv: {e: V3; t: V3} | null = null;
const camJ: {f: number; eye: number; tgt: number; df: number}[] = []; // eye/tgt = change of per-frame velocity (cm/frame^2)
let prev: ReturnType<typeof proj> | null = null;
const segDist = (p: V3, a: V3, b: V3) => {
  const ab = s3(b, a); const t = Math.max(0, Math.min(1, ((p.x - a.x) * ab.x + (p.y - a.y) * ab.y + (p.z - a.z) * ab.z) / (l3(ab) ** 2 || 1)));
  return l3(s3(p, a3(a, k3(ab, t))));
};
const within = (p: ArmPose) => {
  const q = limitPose(p);
  return Math.abs(q.pitch - p.pitch) < 0.01 && Math.abs(q.elbow - p.elbow) < 0.01 && Math.abs(q.wp - p.wp) < 0.01;
};
for (let f = 0; f < NF; f++) {
  const t = f / FPS;
  const st = stateAt(t);
  const P = proj(st.cam);
  for (const w of st.wearers) {
    const bg = bodyGeo(w.pose);
    for (const a of w.arms) {
      if (!within(a.pose)) lim.push(`${t.toFixed(2)} ${w.id}.${a.tid}`);
      const g = plugged(w, a);
      for (const ww of st.wearers) {
        const hc = bodyGeo(ww.pose).head;
        const segs: [V3, V3, number][] = [[g.S, g.E, 4.2], [g.E, g.W, 3.6]];
        for (const [p0, p1, r] of segs) {
          const d = segDist(hc, p0, p1);
          if (d < BD.headR + r - 1) clash.push(`${t.toFixed(2)} ${w.id}.${a.tid} vs head ${ww.id}: ${d.toFixed(1)} cm`);
        }
      }
    }
    for (const side of ['L', 'R'] as const) {
      const A = w.pose[side];
      if (A.world) {
        const W = side === 'L' ? bg.lW : bg.rW;
        const d = l3(s3(W, A.h));
        if (d > 1.0) reach.push(`${t.toFixed(2)} ${w.id}.${side} short by ${d.toFixed(1)} cm`);
      }
    }
  }
  for (const p of st.people ?? []) {
    const bg = bodyGeo(p.pose);
    for (const side of ['L', 'R'] as const) {
      const A = p.pose[side];
      if (A.world) {
        const W = side === 'L' ? bg.lW : bg.rW;
        const d = l3(s3(W, A.h));
        if (d > 1.0) reach.push(`${t.toFixed(2)} ${p.id}.${side} short by ${d.toFixed(1)} cm`);
      }
    }
  }
  if (st.mini) {
    const w = st.wearers[0];
    const ur = w.arms.find((a) => a.tid === 'UR');
    if (ur && JSON.stringify(ur.pose) === JSON.stringify(st.mini.pose)) {
      const g = plugged(w, ur);
      const m = slotGeoMini(st.mini.pose);
      for (const [x, y, bx, by] of [[g.E, m.E, g.base, m.base], [g.W, m.W, g.base, m.base]] as [V3, V3, V3, V3][]) {
        const e = l3(s3(k3(s3(x, bx), 0.5), s3(y, by)));
        mirror = Math.max(mirror, e);
      }
    } else if (t < 21.6) mirror = Math.max(mirror, 999);
  }
  if (prev) {
    const ve = s3(P.eye, prev.eye), vt = s3(st.cam.t, prev.cam.t);
    const df = Math.abs(Math.log(st.cam.f / prev.cam.f));
    if (pv && !CUTS.includes(f) && !CUTS.includes(f - 1)) {
      const ae = l3(s3(ve, pv.e)), at = l3(s3(vt, pv.t));
      if (ae > 4 || at > 4 || df > 0.12) camJ.push({f, eye: +ae.toFixed(1), tgt: +at.toFixed(1), df: +df.toFixed(3)});
    }
    pv = {e: ve, t: vt};
  }
  prev = P;
  if (f === 0 || f === NF - 1) {
    const w = f === 0 ? st.wearers[0] : st.wearers.find((x) => x.id === 'd')!;
    const bg = bodyGeo(w.pose);
    const inF = (q: V3) => { const s = P.p(q); return s.x > 0 && s.x < 1080 && s.y > 0 && s.y < 1920; };
    const human = [bg.lW, bg.rW].filter(inF).length;
    const robot = w.arms.map((a) => plugged(w, a).W).filter(inF).length;
    const ll = plugged(w, w.arms.find((a) => a.tid === 'LL')!);
    const pc = P.p(ll.palm[2]);
    out[f === 0 ? 'frame0' : 'last'] = {humanHandsOnScreen: human, robotHandsOnScreen: robot, armsOnScreen: human + robot, llHand: {x: +pc.x.toFixed(0), y: +pc.y.toFixed(0), k: +P.k(pc.z).toFixed(2)}};
  }
}
out.jointLimitViolations = lim.length; out.jointLimitSamples = lim.slice(0, 8);
out.handReachShortfalls = reach.length; out.handReachSamples = reach;
out.controllerMirrorMaxErrorCm = +mirror.toFixed(4);
out.headClashes = clash.length; out.headClashSamples = clash;
out.cameraJumps = camJ;
fs.writeFileSync(process.argv[2] ?? '/dev/stdout', JSON.stringify(out, null, 1));
console.log(JSON.stringify(out, null, 1));
