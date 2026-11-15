// Mechanical consistency check of the crawl, over every frame where it is on screen (S7, S1, S2, S3), plus wall
// clearance for every in-gut pose (the crawl on the gut axis, and the steered pose of the tool shot).
//   1. a gripping anchor (inflation >= 0.5) never moves relative to the wall
//   2. no part moves backward
//   3. the body only lengthens or shortens while at least one anchor grips (never slides free)
//   4. net forward progress every cycle
//   5. no robot surface point lies outside the wall (the half-pipe below the cut plane), except anchor contact,
//      where the wall itself yields (that is the grip)
import {crawl, PHASES} from '../source/src/robot/state';
import {layout, radius, FrameF} from '../source/src/robot/geom';
import {wallR} from '../source/src/world/gut';
import {C3, N3} from '../source/src/world/path';
import {contactOf, gutFrame} from '../source/src/world/frames';
import {steerFrame, toolsState, TOOLS_ST} from '../source/src/scenes/tools';
import {DUR, FPS} from '../source/src/lib';
import {SCENES} from '../source/src/Film';
import {add3, dot3, mul3, sub3} from '../source/src/core/three';

const taus: number[] = [];
for (let f = 0; f < Math.round(DUR * FPS); f++) {
  const t = f / FPS;
  if (t < SCENES.s4 + 0.6) taus.push(t);
  else if (t >= SCENES.s7) taus.push(t - DUR);
}
taus.sort((a, b) => a - b);
let moveGrip = 0, backward = 0, freeSlide = 0, maxGripMove = 0;
let prev: ReturnType<typeof crawl> | null = null, prevTau = 0;
const pos = (st: ReturnType<typeof crawl>) => {
  const L = layout(st.e);
  return {ta: st.sTail + (L.u1 + L.u2) / 2, ha: st.sTail + (L.u5 + L.u6) / 2, tail: st.sTail, head: st.sTail + L.u7};
};
for (const tau of taus) {
  const st = crawl(tau);
  if (prev && tau - prevTau < 0.04) {
    const a = pos(prev), b = pos(st);
    if (prev.aT >= 0.5 && st.aT >= 0.5) { const d = Math.abs(b.ta - a.ta); maxGripMove = Math.max(maxGripMove, d); if (d > 1e-9) moveGrip++; }
    if (prev.aH >= 0.5 && st.aH >= 0.5) { const d = Math.abs(b.ha - a.ha); maxGripMove = Math.max(maxGripMove, d); if (d > 1e-9) moveGrip++; }
    if (b.tail < a.tail - 1e-9 || b.head < a.head - 1e-9) backward++;
    if (Math.abs(st.e - prev.e) > 1e-9 && Math.min(st.aT, prev.aT) < 0.5 && Math.min(st.aH, prev.aH) < 0.5) freeSlide++;
  }
  prev = st; prevTau = tau;
}
// net progress per cycle (CO phase to CO phase)
const cos = PHASES.filter((p) => p[0] === 'CO').map((p) => p[2]);
const prog = cos.slice(1).map((t, i) => crawl(t).sTail - crawl(cos[i]).sTail);
// wall clearance
const clearance = (frame: FrameF, st: ReturnType<typeof crawl>, label: string) => {
  const L = layout(st.e);
  const contact = contactOf(st);
  let worst = 1e9, at = '';
  for (let u = 0; u <= L.u7; u += 0.05) {
    const sec = radius(u, 0, st, L).sec;
    const isAnchor = sec === 'tailAnchor' || sec === 'headAnchor';
    const f = frame(st.sTail + u);
    for (let k = 0; k < 32; k++) {
      const phi = (k / 32) * Math.PI * 2;
      const r = radius(u, phi, st, L).r;
      const p = add3(f.p, add3(mul3(f.N, r * Math.cos(phi)), mul3(f.B, r * Math.sin(phi))));
      if (p[2] > 0) continue; // above the cut plane: no wall there
      // the point's position relative to the gut axis at the nearest arc length (search near s)
      let best = {d: 1e9, s: 0};
      for (let s = st.sTail + u - 1.5; s <= st.sTail + u + 1.5; s += 0.01) { const d = Math.abs(dot3(sub3(p, C3(s)), [Math.sin(0), 0, 0]) * 0 + 0) ; void d; const q = sub3(p, C3(s)); const along = Math.abs(q[0] * N3(s)[1] - q[1] * N3(s)[0]); if (along < best.d) best = {d: along, s}; }
      const q = sub3(p, C3(best.s));
      const lat = dot3(q, N3(best.s)), down = -q[2];
      const rad = Math.hypot(lat, down), th = Math.atan2(down, lat);
      const w = wallR(best.s, th, isAnchor ? contact : undefined).r;
      const gap = w - rad;
      if (gap < worst) { worst = gap; at = `u=${u.toFixed(2)} ${sec}`; }
    }
  }
  return `${label}: min clearance to the wall ${worst.toFixed(3)} units (${at})`;
};
console.log(`frames checked: ${taus.length}`);
console.log(`1. gripping anchor moved: ${moveGrip} frame pairs (max displacement ${maxGripMove.toExponential(1)} units)`);
console.log(`2. backward motion: ${backward} frame pairs`);
console.log(`3. body changed length with neither anchor gripping: ${freeSlide} frame pairs`);
console.log(`4. net progress per cycle (units): ${prog.map((x) => x.toFixed(2)).join(', ')}`);
const samples = [-4.0, -2.9, -1.0, 0.5, 1.0, 1.8, 3.2, 5.6, 7.7, 8.6, 9.2, 9.9, 10.7, 11.4];
for (const tau of samples) console.log('5. ' + clearance(gutFrame, crawl(tau), `crawl tau=${tau}`));
for (const t of [16.9, 17.4, 18.2, 19.0]) console.log('5. ' + clearance(steerFrame(toolsState(t).bend), TOOLS_ST, `tool shot t=${t}`));
const ok = moveGrip === 0 && backward === 0 && freeSlide === 0 && prog.every((x) => x > 0);
console.log(ok ? 'KINEMATICS OK' : 'KINEMATICS FAIL');
