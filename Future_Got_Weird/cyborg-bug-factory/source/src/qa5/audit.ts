// V5 animation-integrity audit: every frame of the film, the same measurements for any version's world.
// usage (after esbuild bundling): node audit.js v4|v5 out.json
import {basis, dot3, len3, Orbit, proj, sub3, V3} from '../core/three';
import {cam} from '../camera';
import {toL, toW, Frame} from '../core/frame';
import {DUR, FPS} from '../lib';
import {solve, Rig} from '../roach/rig';
import {antPts, bodyElls, bodyTopLocal, boxDepth, boxPts, capPts, ellDepth, fmt, legCaps, segDist} from './geom';
import {World} from './world';
import {world4} from './world4';
import {world5} from './world5';
import * as fs from 'fs';

const W: World = process.argv[2] === 'v5' ? world5 : world4;
const N = Math.round(DUR * FPS);
type Hit = {t: number; v: number; what: string};
const log: Record<string, Hit[]> = {};
const add = (check: string, t: number, v: number, what: string) => { (log[check] ??= []).push({t: fmt(t, 3), v: fmt(v, 2), what}); };
const onScreen = (O: Orbit | null, p: V3, m = 0) => {
  if (!O) return false;
  const P = proj(basis(cam(O)), p);
  return P.z > 5 && P.x > -m && P.x < 1080 + m && P.y > -m && P.y < 1920 + m;
};
const corners = (F: Frame): V3[] => [[-6.3, -7.3, 0], [6.3, -7.3, 0], [6.3, 7.3, 0], [-6.3, 7.3, 0], [-1, 0, 4.9]].map((p) => toW(F, p as V3));
const maxDisp = (a: V3[], b: V3[]) => Math.max(...a.map((p, i) => len3(sub3(p, b[i]))));
const angDeg = (a: V3, b: V3) => (Math.acos(Math.max(-1, Math.min(1, dot3(a, b)))) * 180) / Math.PI;
/** body sample points for collisions: each drawn ellipsoid's surface */
const bodySurf = (R: Rig): V3[] => bodyElls(R).flatMap((E) => {
  const out: V3[] = [];
  for (let i = 0; i < 6; i++) for (let j = 0; j < 8; j++) {
    const th = (Math.PI * (i + 0.5)) / 6, ph = (2 * Math.PI * j) / 8;
    out.push(toW(E.F, [E.a[0] * Math.sin(th) * Math.cos(ph), E.a[1] * Math.sin(th) * Math.sin(ph), E.a[2] * Math.cos(th)]));
  }
  return out;
});

/** a rod part's sample points: a rounded tip (a == b) is sampled over its sphere, a shaft along its axis */
const tipPts = (c: {a: V3; b: V3; r: number}): V3[] => {
  if (len3(sub3(c.a, c.b)) > 1e-6) return capPts(c as any, 6);
  const out: V3[] = [];
  for (let i = 0; i < 7; i++) for (let j = 0; j < 10; j++) {
    const th = (Math.PI * i) / 6, ph = (2 * Math.PI * j) / 10;
    out.push([c.a[0] + c.r * Math.sin(th) * Math.cos(ph), c.a[1] + c.r * Math.sin(th) * Math.sin(ph), c.a[2] + c.r * Math.cos(th)]);
  }
  return out;
};
const prevFoot: Record<string, {p: V3; planted: boolean}> = {};
let prevModule: Record<string, V3[]> = {};
let prevBugs = new Set<number>();

for (let f = 0; f < N; f++) {
  const t = f / FPS;
  const lab = t < W.build.t0 - 3.04 || t >= W.rubble.t1; // the lab is on screen before the build cut and after the rubble
  const O = W.labCam(t);
  const modules: Record<string, V3[]> = {};
  if (lab) {
    const bugs = W.labBugs(t);
    const arm = W.arm(t);
    const sx = W.sledX(t);
    const plat = W.platform(t);
    const rods = W.rods(t);
    const ids = new Set<number>();
    for (const b of bugs) {
      ids.add(b.k);
      const R = solve(b.st);
      const E = bodyElls(R);
      const visible = onScreen(O, b.st.body.o, 60);
      // C13: insects appearing / vanishing on screen
      if (!prevBugs.has(b.k) && f > 0 && prevBugs.size > 0 && visible) add('insect appears on screen', t, 1, `insect ${b.k}`);
      // C6: legs through the body
      let legIn = 0, legWhat = '';
      for (const c of legCaps(R)) capPts(c, 10).forEach((p, i) => {
        if (c.name.startsWith('femur') && i < 4) return;
        for (const e of E) {
          if (e.name === 'venter') continue;
          if (e.name !== 'head' && toL(e.F, p)[2] < 0) continue; // under a plate's rim: where the legs leave the body
          const d = ellDepth(e, p) - c.r * 0.5; if (d > legIn) { legIn = d; legWhat = `${c.name} in ${e.name}`; }
        }
      });
      if (legIn > 0.4) add('leg passes through the body', t, legIn, `insect ${b.k}: ${legWhat}`);
      // C7/C8/C11: feet on the real ground, sliding, the platform leaving under the insect
      R.legs.forEach((L) => {
        const g = b.onSled ? b.st.body.o[2] - (b.st.body.o[2] - 3.2) : W.walkGround(L.foot[0], L.foot[1]);
        const walkH = L.foot[2] - g;
        const planted = walkH < 0.08;
        // the real support under this foot: the platform if the foot is over it, else the bench
        const overPlat = boxDepth({...plat, h: [plat.h[0], plat.h[1], 50]}, [L.foot[0], L.foot[1], 1.6]) > 0;
        const realG = overPlat ? 3.2 : 0;
        if (planted && Math.abs(L.foot[2] - realG) > 0.3) add(L.foot[2] > realG ? 'foot planted on nothing (floats)' : 'foot sunk into a surface', t, Math.abs(L.foot[2] - realG), `insect ${b.k} leg ${L.i}${!b.onSled && sx < -0.5 ? ' (platform has slid away)' : ''}`);
        const key = `${b.k}:${L.i}`;
        const pv = prevFoot[key];
        if (pv && pv.planted && planted && !(b.onSled && Math.abs(W.sledX(t) - W.sledX(t - 1 / FPS)) > 1e-6)) { const sl = Math.hypot(L.foot[0] - pv.p[0], L.foot[1] - pv.p[1]); if (sl > 0.35) add('planted foot slides', t, sl, `insect ${b.k} leg ${L.i}`); }
        prevFoot[key] = {p: L.foot, planted};
      });
      if (!b.onSled && Math.abs(sx) > 0.5 && W.walkGround(b.st.body.o[0], b.st.body.o[1]) > 0.5) add('platform slides away under a walking insect', t, Math.abs(sx), `insect ${b.k}`);
      // C9: legs/antennae vs the rods
      for (const c of [...legCaps(R), ...rods.solid.map((x) => x)]) void c;
      let rodHit = 0, rodWhat = '';
      for (const lc of legCaps(R)) for (const p of capPts(lc, 8)) for (const rc of [...rods.solid, ...rods.tips]) {
        const d = lc.r + rc.r - segDist(p, rc.a, rc.b);
        if (d > rodHit) { rodHit = d; rodWhat = `${lc.name} x ${rc.name}`; }
      }
      if (rodHit > 0.3) add('leg passes through a rod', t, rodHit, `insect ${b.k}: ${rodWhat}`);
      // C5: rods vs the body (only the insect fixed on the platform)
      if (b.onSled) {
        let rb = 0, rw = '';
        for (const rc of [...rods.tips, ...rods.solid]) for (const p of tipPts(rc)) for (const e of E) {
          const d = ellDepth(e, p);
          if (d > rb) { rb = d; rw = `${rc.name} in ${e.name}`; }
        }
        if (rb > 0.3) add('rod penetrates the body', t, rb, `insect ${b.k}: ${rw}`);
      }
      // the module on the insect; rods vs the module
      if (b.packF) {
        modules[`m${b.k}`] = corners(b.packF);
        let rm = 0, rmw = '';
        const mpts = [...W.packBoxes(b.packF).flatMap((bx) => boxPts(bx, 3)), ...W.packHanging(b.packF, b.hook)];
        for (const rc of [...rods.solid, ...rods.tips]) for (const p of mpts) { const d = rc.r - segDist(p, rc.a, rc.b); if (d > rm) { rm = d; rmw = rc.name; } }
        if (rm > 0.2) add('rod passes through the module', t, rm, `insect ${b.k}: ${rmw}`);
      }
      // C10: arm vs this insect
      let ai = 0, aw = '';
      for (const lc of arm.links) for (const p of capPts(lc, 10)) for (const e of E) { const d = ellDepth(e, p) + 0; if (d > ai) { ai = d; aw = `${lc.name} in ${e.name}`; } }
      for (const bx of [arm.gripBody, ...arm.fingers]) for (const p of boxPts(bx, 3)) for (const e of E) { const d = ellDepth(e, p); if (d > ai) { ai = d; aw = `${bx.name} in ${e.name}`; } }
      if (ai > 0.3) add('arm / gripper passes through an insect', t, ai, `insect ${b.k}: ${aw}`);
      // the held module vs the insect body (placement)
      if (arm.heldF && arm.held === b.k) {
        let pi = 0, pw = '';
        for (const bx of W.packBoxes(arm.heldF)) for (const p of boxPts(bx, 4)) for (const e of E) { const d = ellDepth(e, p); if (d > pi) { pi = d; pw = `${bx.name} in ${e.name}`; } }
        if (pi > 0.3) add('module passes into the insect during placement', t, pi, `insect ${b.k}: ${pw}`);
      }
    }
    prevBugs = ids;
    // the platform (and the rods it carries) vs the holder, the arm and every insect not riding it
    {
      const pts = boxPts(plat, 6);
      let pd = 0, pw = '';
      for (const p of [...pts, ...rods.solid.flatMap((c) => capPts(c, 6))]) {
        for (const h of W.holderSolids) { const d = boxDepth(h, p); if (d > pd) { pd = d; pw = h.name; } }
        for (const lc of arm.links) { const d = lc.r - segDist(p, lc.a, lc.b); if (d > pd) { pd = d; pw = lc.name; } }
      }
      for (const b of bugs) if (!b.onSled) for (const L of solve(b.st).legs) { const d = boxDepth({...plat, h: [plat.h[0], plat.h[1], plat.h[2] + 0.3]}, L.foot); if (d > 0.2 && Math.abs(sx) > 0.5) { pd = Math.max(pd, d); pw = `insect ${b.k} foot`; } }
      if (pd > 0.2) add('platform / rods pass through something', t, pd, pw);
    }
    // C1: the held module vs the gripper (orientation, pad and finger penetration)
    if (arm.heldF) {
      const a = angDeg(arm.heldF.u, arm.tool.u);
      if (a > 0.5) add('held module not aligned with the gripper', t, a, 'degrees between the module and tool axes');
      const tab = W.packBoxes(arm.heldF)[1];
      let pd = 0, pw = '';
      for (const bx of [...arm.pads, ...arm.fingers]) for (const p of boxPts(bx, 4)) { const d = boxDepth(tab, p); if (d > pd) { pd = d; pw = bx.name; } }
      if (pd > 0.1) add('gripper penetrates the module tab', t, pd, pw);
      // the pads must actually touch the tab while holding
      const gap = Math.min(...arm.pads.map((bx) => Math.abs(toL(tab.F, bx.F.o)[1]) - bx.h[1] - tab.h[1]));
      if (gap > 0.3) add('module held without finger contact', t, gap, 'mm between pad and tab');
      modules[`m${arm.held}`] = corners(arm.heldF);
      modules[`held:m${arm.held}`] = corners(arm.heldF);
    }
    // gripper vs the platform, the holder and the bench; arm links vs the bench
    for (const lc of arm.links) for (const p of capPts(lc, 10)) {
      if (p[2] - lc.r < -0.3) add('arm passes through the bench', t, lc.r - p[2], lc.name);
      const d = boxDepth({...plat, h: [plat.h[0] + lc.r, plat.h[1] + lc.r, plat.h[2] + lc.r]}, p);
      if (d > 0.3) add('arm passes through the platform', t, d, lc.name);
    }
    for (const bx of [arm.gripBody, ...arm.fingers]) for (const p of boxPts(bx, 3)) {
      const d = Math.max(boxDepth(plat, p), ...W.holderSolids.map((h) => boxDepth(h, p)));
      if (d > 0.2) add('gripper passes through the platform / holder', t, d, bx.name);
      for (const rc of [...rods.solid, ...rods.tips]) { const dd = rc.r - segDist(p, rc.a, rc.b); if (dd > 0.2) add('gripper passes through a rod', t, dd, `${bx.name} x ${rc.name}`); }
    }
    // C4: the holder's modules vs the holder; a module appearing on the holder in view
    const parked = W.parked(t);
    parked.forEach((F, j) => {
      modules[`holder${F.o[1].toFixed(0)}`] = corners(F);
      let hd = 0;
      for (const p of W.packHanging(F, 0)) {
        const inCyl = W.holderCyl.r > 0 && Math.hypot(p[0] - W.holderCyl.c[0], p[1] - W.holderCyl.c[1]) < W.holderCyl.r && p[2] < W.holderCyl.c[2] + W.holderCyl.h && p[2] > 0;
        hd = Math.max(hd, ...W.holderSolids.map((h) => boxDepth(h, p)), inCyl ? W.holderCyl.c[2] + W.holderCyl.h - p[2] : 0);
      }
      for (const bx of W.packBoxes(F)) for (const p of boxPts(bx, 3)) hd = Math.max(hd, ...W.holderSolids.map((h) => boxDepth(h, p) - 0.05));
      if (hd > 0.2) add('module electrodes / branches pass through the holder', t, hd, `parked module ${j}`);
      const key = `holder${F.o[1].toFixed(0)}`;
      if (!prevModule[key] && f > 0 && !arm.heldF?.o.every((v, i) => Math.abs(v - F.o[i]) < 0.01) && onScreen(O, F.o, 0)) add('module appears on the holder in view', t, 1, key);
    });
    // a module disappearing (e.g. a one-frame gap between the holder and the gripper)
    for (const id of Object.keys(prevModule)) if (!id.startsWith('held:') && !modules[id] && !(arm.heldF && id.startsWith('holder')) && onScreen(O, prevModule[id][0], 0)) add('module vanishes in view', t, 1, id);
    // C2: the gripper -> insect handover: the module's first frame on the insect vs its last frame in the gripper
    for (const [id, c] of Object.entries(modules)) {
      const pc = prevModule[`held:${id}`];
      if (pc && !(arm.heldF && `m${arm.held}` === id)) add('handover: module jumps when the gripper lets go', t, maxDisp(c, pc), id);
    }
    // pickup from the holder: the module's first held frame vs its last parked frame
    for (const id of Object.keys(prevModule)) if (id.startsWith('holder') && !modules[id] && arm.heldF) add('pickup: module offset from its parked place', t, maxDisp(corners(arm.heldF), prevModule[id]), `${id} -> gripper`);
    // C14: platform speed in real time (not the sped-up cycle)
    const v = Math.abs(W.sledX(t) - W.sledX(Math.max(0, t - 1 / FPS)));
    if (v > 30 && O && onScreen(O, [W.sledX(t), 0, 2], 200)) add(t > 4.25 && t < 6.35 ? 'platform moves > 30 mm per frame in view (inside the sped-up 68 s sequence)' : 'platform moves > 30 mm per frame in view (real time)', t, v, 'slider');
    prevModule = modules;
  } else {
    prevModule = {};
    prevBugs = new Set();
    for (const k of Object.keys(prevFoot)) delete prevFoot[k];
  }
  // rubble: the insect's whole envelope vs the concrete
  if (t >= W.rubble.t0 && t < W.rubble.t1) {
    const b = W.rubble.bug(t);
    const R = solve(b.st);
    const pts: [V3, string][] = [
      ...bodySurf(R).map((p) => [p, 'body'] as [V3, string]),
      ...legCaps(R).flatMap((c) => capPts(c, 6).map((p) => [p, c.name] as [V3, string])),
      ...antPts(R).map((p) => [p, 'antenna'] as [V3, string]),
      ...W.packBoxes(b.packF).flatMap((bx) => boxPts(bx, 3).map((p) => [p, `backpack ${bx.name}`] as [V3, string])),
    ];
    let worst = 0, what = '';
    for (const [p, nm] of pts) for (const s of W.rubble.solids) { const d = boxDepth(s, p); if (d > worst) { worst = d; what = `${nm} inside ${s.name}`; } }
    if (worst > 0.3) add('insect passes through rubble', t, worst, what);
    R.legs.forEach((L) => { if (L.foot[2] < -0.3) add('foot below the rubble floor', t, -L.foot[2], `leg ${L.i}`); });
  }
  if (t >= W.build.t0 && t < W.build.t1) {
    const b = W.build.bug(t);
    const R = solve(b.st);
    R.legs.forEach((L) => { if (L.foot[2] < -0.3) add('foot below the bench (build)', t, -L.foot[2], `leg ${L.i}`); });
  }
}

// module seating: plate underside vs the thorax top, on a fitted insect at rest and walking
const seat: {t: number; minGap: number; maxGap: number}[] = [];
for (const t of [1.6, 3.0, 10.6, 13.5, 28.0]) {
  const b = W.labBugs(t).find((x) => x.packF);
  if (!b || !b.packF) continue;
  const R = solve(b.st);
  const gaps: number[] = [];
  for (const x of [-6, -4, -2, 0, 2]) for (const y of [-3, 0, 3]) {
    const pw = toW(b.packF, [x, y, 0]);
    const q = toL(b.st.body, pw);
    const top = bodyTopLocal(b.st, R, q[0], q[1]);
    if (top > -1e8) gaps.push(q[2] - top);
  }
  seat.push({t, minGap: fmt(Math.min(...gaps)), maxGap: fmt(Math.max(...gaps))});
}

// summary: per check, the number of frames, the worst value and its time, and contiguous time ranges
const summary = Object.entries(log).map(([check, hits]) => {
  const w = hits.reduce((a, b) => (b.v > a.v ? b : a));
  const ranges: string[] = [];
  let a = hits[0].t, p = hits[0].t;
  for (const h of hits.slice(1)) { if (h.t - p > 0.05) { ranges.push(`${a.toFixed(2)}-${p.toFixed(2)}`); a = h.t; } p = h.t; }
  ranges.push(`${a.toFixed(2)}-${p.toFixed(2)}`);
  return {check, frames: new Set(hits.map((h) => h.t)).size, worst: w.v, at: w.t, what: w.what, ranges: ranges.slice(0, 12)};
});
const out = {version: W.name, frames: N, seat, summary, detail: log};
fs.writeFileSync(process.argv[3], JSON.stringify(out, null, 1));
console.log(JSON.stringify({version: W.name, seat, summary}, null, 1));
