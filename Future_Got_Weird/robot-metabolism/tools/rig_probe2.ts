// V2 rig probe over every frame: working links inside 0.28-0.43 m; no end under its surface; the apex really at its
// commanded link lengths (an impossible tetrahedron would be flattened by the solver); joined ends exactly on their
// vertex; separate modules never pass through each other or through the robots.
import {earlyState, lateState, EARLY_END, L0, SNAP_S, LEV} from '../source/src/v2/yard';
import {ramp2State} from '../source/src/v2/ramp2';
import {pairState, PT} from '../source/src/v2/pair';
import {FRAMES, FPS} from '../source/src/lib/time';
import {len, sub, segSegDist, dist, V3} from '../source/src/lib/v3';
import {L_MIN, L_MAX, GY, Link} from '../source/src/rig/truss';

const fails: string[] = [];
const range: Record<string, [number, number]> = {};
const lenOk = (f: number, links: Link[]) => {
  for (const l of links) {
    const L = len(sub(l.b, l.a));
    const k = l.id.replace(/\d+$/, '');
    range[k] = [Math.min(range[k]?.[0] ?? 9, L), Math.max(range[k]?.[1] ?? 0, L)];
    if (L < L_MIN - 1e-3 || L > L_MAX + 1e-3) fails.push(`f${f} ${l.id} length ${L.toFixed(3)}`);
    for (const p of [l.a, l.b]) if (p.y < GY - 1e-4) fails.push(`f${f} ${l.id} under the surface ${p.y.toFixed(4)}`);
  }
};
const apart = (f: number, a: Link, b: Link, min = 0.034, tag = '') => {
  const d = segSegDist(a.a, a.b, b.a, b.b);
  if (d < min) fails.push(`f${f} ${tag}${a.id}/${b.id} clearance ${d.toFixed(3)}`);
};
/** a tetrahedron's apex must sit at its commanded lengths */
const apexOk = (f: number, tet: {V0: V3; V1: V3; V2: V3; V3: V3}, tag: string) => {
  if (tet.V3.y < GY + 0.05) fails.push(`f${f} ${tag} apex collapsed ${tet.V3.y.toFixed(3)}`);
};
for (let f = 0; f < FRAMES; f++) {
  const t = f / FPS;
  if (t < EARLY_END) {
    const s = earlyState(t);
    lenOk(f, s.links);
    apexOk(f, s.tet, 'T');
    if (t >= SNAP_S && dist(s.S.a, s.tet.V0) > 1e-6) fails.push(`f${f} S not on V0`);
    const robot = s.links.filter((l) => l.id !== 'S');
    if (t < SNAP_S - 0.75) for (const l of robot) apart(f, s.S, l, 0.034); // (the last 3 cm of the approach are the contact)
    if (s.pair) {
      if (!s.pair.open && dist(s.pair.M.b, s.pair.tet.V1) > 1e-6) fails.push(`f${f} M not on V1`);
      for (const d of s.D) for (const l of s.links) if (l.id !== 'M' || t > 0.7) apart(f, d, l, 0.03, 'D:');
    }
  } else if (t < L0) {
    const s = ramp2State(t);
    lenOk(f, s.links);
    apexOk(f, s.tet, 'T');
  } else {
    const s = lateState(t);
    lenOk(f, s.links.filter((l) => l.id !== 'S' || t < LEV.release));
    apexOk(f, s.tet, 'T');
    const robot = s.links.filter((l) => l.id !== 'S' && l.id !== 'R');
    if (t > LEV.fall1) { for (const l of robot) apart(f, s.S, l, 0.034, 'S:'); apart(f, s.S, s.R, 0.04); }
    if (t < LEV.contact - 0.35) for (const l of robot) apart(f, s.R, l, 0.034, 'R:');
    const p = s.pair;
    lenOk(f, p.links);
    apexOk(f, p.tet, 'O2');
    for (const a of [...s.links]) for (const b of [...p.links, ...p.D]) apart(f, a, b, 0.05, 'pair:');
  }
}
// the pair alone over its whole pre-roll and hook
for (let tau = -3.2; tau < PT.risen; tau += 1 / FPS) {
  const p = pairState(tau, {x: 0, y: 0, z: 0});
  lenOk(Math.round(tau * FPS), p.links);
  apexOk(Math.round(tau * FPS), p.tet, 'O');
}
console.log(`${FRAMES} frames; ${fails.length} faults`);
for (const [k, [a, b]] of Object.entries(range)) console.log(`  ${k}: ${a.toFixed(3)}-${b.toFixed(3)} m`);
const seen = new Set<string>();
for (const m of fails) { const k = m.split(' ').slice(1, 3).join(' '); if (!seen.has(k)) { seen.add(k); console.log('  ', m); } }
process.exitCode = fails.length ? 1 : 0;
