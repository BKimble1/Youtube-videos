// Rig probe over the whole film: every working link inside the actuator range (0.28-0.43 m); no end below the
// surface; joined ends exactly at their vertex; separate modules never pass through each other; planted stick tips
// do not slide during a push. Usage: bundle with esbuild, run with node.
import {benchState} from '../source/src/world/bench';
import {rampState, R0} from '../source/src/world/ramp';
import {runoutState, brokenLinks, C0, EV} from '../source/src/world/runout';
import {FRAMES, FPS} from '../source/src/lib/time';
import {len, sub, segSegDist, dist} from '../source/src/lib/v3';
import {L_MIN, L_MAX, GY, Link} from '../source/src/rig/truss';

const fails: string[] = [];
const range: Record<string, [number, number]> = {};
const chk = (f: number, links: Link[], skip: string[] = []) => {
  for (const l of links) {
    const L = len(sub(l.b, l.a));
    const k = l.id.replace(/\d+$/, '');
    range[k] = [Math.min(range[k]?.[0] ?? 9, L), Math.max(range[k]?.[1] ?? 0, L)];
    if (!skip.includes(l.id) && (L < L_MIN - 1e-4 || L > L_MAX + 1e-4)) fails.push(`f${f} ${l.id} length ${L.toFixed(3)}`);
    for (const p of [l.a, l.b]) if (p.y < GY - 1e-4) fails.push(`f${f} ${l.id} below the surface ${p.y.toFixed(4)}`);
  }
};
/** two separate (unjoined) links must stay apart: centre lines >= 2 housing radii + margin */
const apart = (f: number, a: Link, b: Link, min = 0.036) => {
  const d = segSegDist(a.a, a.b, b.a, b.b);
  if (d < min) fails.push(`f${f} ${a.id}/${b.id} clearance ${d.toFixed(3)}`);
};
for (let f = 0; f < FRAMES; f++) {
  const t = f / FPS;
  if (t < R0) {
    const s = benchState(t);
    chk(f, s.links);
    if (s.joined && dist(s.X.a, s.tet.V1) > 1e-6) fails.push(`f${f} X not at V1`);
    if (!s.joined) for (const l of s.links.slice(0, 6)) apart(f, s.X, l, 0.0);
  } else if (t < C0) {
    const s = rampState(t);
    chk(f, [...s.links, ...s.plain]);
  } else {
    const s = runoutState(t);
    // X is dead after the failure: its length is fixed, so it is exempt from the range only if it is out of it then
    chk(f, s.links);
    if (t > EV.side0 + 0.2) for (const l of s.links.filter((l) => l.id.startsWith('T'))) apart(f, s.X, l, 0.03);
    apart(f, s.X, s.R);
    for (const b of brokenLinks(t)) for (const l of s.links) apart(f, b, l, 0.05);
  }
}
console.log(`${FRAMES} frames; ${fails.length} faults`);
for (const [k, [a, b]] of Object.entries(range)) console.log(`  ${k}: ${a.toFixed(3)}-${b.toFixed(3)} m`);
const seen = new Set<string>();
for (const m of fails) { const k = m.split(' ').slice(1, 3).join(' '); if (!seen.has(k)) { seen.add(k); console.log('  ', m); } }
process.exitCode = fails.length ? 1 : 0;
