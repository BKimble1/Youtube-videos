// Section D4 props in the world (no React components: engine meshes, the mech kit's cable): the tools the Crew lose
// — torn out of a hand, flung, dropped — and where they come to rest, the slab heavy 2 staggers off, and the cut
// tether cable left wrapped round W3's shins. ./persist.ts registers the resting ones so E/F (and anything later)
// show them where they fell.
import type {Item} from '../../engine/scene';
import {prep, Prepped, box, merge, Mesh} from '../../engine/mesh';
import {V3, lerp, clamp, smooth, easeIn, rnd, add3, mul3, norm3, cross3} from '../../../kit/math';
import {groundH} from '../../world/ground';
import {brokenSlab} from '../../world/props';
import {cable, unitAttach, UnitSpec} from '../../mech';
import {EV} from './times';
import {H2_SLAB, LAUNCHER_REST} from './machines';

const G = (x: number, z: number) => groundH(x, z);

// ------------------------------------------------------------------ meshes (object space: x along the tool, y up)
const cache = new Map<string, Prepped>();
const mk = (k: string, f: () => Mesh) => { let p = cache.get(k); if (!p) cache.set(k, (p = prep(f()))); return p; };
const MESH = {
  halligan: () => mk('hal', () => merge(
    box({x: -0.46, y: 0, z: -0.018}, {x: 0.42, y: 0.036, z: 0.018}, 'steelDark'),
    box({x: 0.42, y: 0, z: -0.05}, {x: 0.5, y: 0.03, z: 0.05}, 'steel'), // the fork
    box({x: -0.5, y: 0, z: -0.02}, {x: -0.44, y: 0.11, z: 0.02}, 'steel'), // the adze
  )),
  launcher: () => mk('lau', () => merge(
    box({x: -0.16, y: 0, z: -0.045}, {x: 0.2, y: 0.085, z: 0.045}, 'm_dark'),
    box({x: -0.06, y: 0.03, z: -0.048}, {x: 0.05, y: 0.06, z: 0.048}, 'taxi'),
    box({x: -0.1, y: -0.07, z: -0.025}, {x: -0.05, y: 0, z: 0.025}, 'm_rubber'),
  )),
  breaker: () => mk('brk', () => merge(
    box({x: -0.3, y: 0, z: -0.07}, {x: 0.1, y: 0.14, z: 0.07}, 'carRed'), // tank
    box({x: 0.1, y: 0.03, z: -0.045}, {x: 0.55, y: 0.12, z: 0.045}, 'steelDark'), // ram body
    box({x: 0.55, y: 0.04, z: -0.06}, {x: 0.63, y: 0.11, z: 0.06}, 'steel'), // head
    box({x: -0.1, y: 0.12, z: -0.05}, {x: 0.05, y: 0.15, z: 0.05}, 'taxi'),
  )),
  tablet: () => mk('tab', () => merge(
    box({x: -0.12, y: 0, z: -0.085}, {x: 0.12, y: 0.012, z: 0.085}, 'm_black'),
    box({x: -0.105, y: 0.012, z: -0.07}, {x: 0.06, y: 0.016, z: 0.07}, 'glassLight'),
  )),
  controller: () => mk('ctl', () => merge(
    box({x: -0.085, y: 0, z: -0.05}, {x: 0.085, y: 0.03, z: 0.05}, 'm_dark'),
    box({x: -0.04, y: 0.03, z: -0.03}, {x: 0.04, y: 0.034, z: 0.03}, 'm_black'),
  )),
};
export type PropKind = keyof typeof MESH;

/**
 * A dropped/flung tool: from the hand (world point at t0) on a short arc to its resting place, one small bounce,
 * tumbling as it goes; at rest it lies flat at `yaw`. Null before t0 (the hand still draws it).
 */
export type Drop = {kind: PropKind; t0: number; from: V3; to: {x: number; z: number; yaw: number}; flight: number; apex: number; spin: number; key: string};
export const dropAt = (d: Drop, T: number): Item | null => {
  if (T < d.t0) return null;
  const u = clamp((T - d.t0) / d.flight);
  const rest = {x: d.to.x, y: G(d.to.x, d.to.z), z: d.to.z};
  // a parabola into a first touch at 85% of the way, then a little hop to rest
  const k1 = 0.85;
  let p: V3, roll: number;
  if (u < k1) {
    const v = u / k1;
    const hit = {x: lerp(d.from.x, rest.x, k1), z: lerp(d.from.z, rest.z, k1)};
    p = {x: lerp(d.from.x, hit.x, v), y: lerp(d.from.y, G(hit.x, hit.z), easeIn(v)) + d.apex * Math.sin(Math.PI * v), z: lerp(d.from.z, hit.z, v)};
    roll = d.spin * v;
  } else {
    const v = (u - k1) / (1 - k1);
    p = {x: lerp(lerp(d.from.x, rest.x, k1), rest.x, v), y: lerp(G(d.to.x, d.to.z), rest.y, v) + 0.06 * Math.sin(Math.PI * v), z: lerp(lerp(d.from.z, rest.z, k1), rest.z, v)};
    roll = d.spin + (Math.round(d.spin / 180) * 180 - d.spin) * smooth(v);
  }
  const yaw = lerp(d.to.yaw - 40, d.to.yaw, smooth(u));
  return {kind: 'mesh', mesh: MESH[d.kind](), key: d.key, xf: {pos: {x: p.x, y: p.y + 0.005, z: p.z}, yaw, roll: u >= 1 ? Math.round(d.spin / 180) * 180 : roll}, asObject: true};
};

// ------------------------------------------------------------------ the tools the Crew lose
/** world positions of the hands at the drop times (from the choreography; checked against the rig in crew.tsx) */
export const DROPS: Record<string, Drop> = {
  // H1 flings the torn launcher down at 158.1
  launcher: {kind: 'launcher', t0: EV.launcherDrop, from: {x: 19.0, y: G(19.0, -1.0) + 0.75, z: -1.0}, to: LAUNCHER_REST, flight: 0.42, apex: 0.05, spin: 180, key: 'd4_launcher'},
  // the halligan flies out of the runner's hand as the blow lands
  halligan: {kind: 'halligan', t0: EV.runnerHit + 0.06, from: {x: 17.45, y: G(17.45, 7.55) + 1.5, z: 7.55}, to: {x: 18.55, z: 6.75, yaw: 140}, flight: 0.7, apex: 0.5, spin: 520, key: 'd4_halligan'},
  // the decoy maker lets the smashed tablet fall in front of her (from her left hand at 160.15)
  tablet: {kind: 'tablet', t0: EV.tabletDrop, from: {x: 12.87, y: 1.04, z: 5.81}, to: {x: 13.12, z: 5.7, yaw: 20}, flight: 0.4, apex: 0.02, spin: 180, key: 'd4_tablet'},
  // the drone pilot lets go of the controller as her arm comes up at the diving drone (170.0, as her hands part)
  controller: {kind: 'controller', t0: 170.0, from: {x: 11.82, y: 1.12, z: 3.97}, to: {x: 12.2, z: 4.3, yaw: 70}, flight: 0.5, apex: 0.12, spin: 360, key: 'd4_controller'},
  // the breaker lets the empty breaker fall as his leg gives
  breaker: {kind: 'breaker', t0: 181.35, from: {x: 9.76, y: 1.22, z: 7.62}, to: {x: 10.3, z: 7.35, yaw: 40}, flight: 0.45, apex: 0.03, spin: 180, key: 'd4_breaker'},
};

// ------------------------------------------------------------------ the slab heavy 2 staggers off (D4-5)
// A broken slab of road lying almost flat on the avenue; at the stumble the heavy's rear-left foot comes down on its
// edge and it tips (its far edge lifts), and the foot slides off it.
const SLAB_O = {x: H2_SLAB.x - 1.0, z: H2_SLAB.z - 0.75};
const slabMesh = () => mk('h2slab', () => brokenSlab({x: 0, y: 0, z: 0}, {x: 1, y: 0, z: 0}, norm3({x: 0, y: 0.18, z: 1}), 2.1, 1.6, 0.26, 4421, 'asphaltBroken', 'rubbleDark'));
export const heavySlab = (T: number): Item => {
  const tip = T < EV.slabTip ? 0 : 1 - Math.exp(-(T - EV.slabTip) * 9) * Math.cos((T - EV.slabTip) * 18);
  return {kind: 'mesh', mesh: slabMesh(), key: 'd4_h2slab', xf: {pos: {x: SLAB_O.x, y: G(SLAB_O.x, SLAB_O.z) - 0.12 - 0.05 * clamp(tip), z: SLAB_O.z}, yaw: 82, pitch: 0, roll: -9 * clamp(tip, 0, 1.2)}, asObject: false};
};

// ------------------------------------------------------------------ the cut cable
const CABLE_C = '#3E4A52';
/**
 * The length of cut tether cable round W3's shins after the wrap: a spiral of 1½ turns about both shins at mid-shin,
 * then the free end — to her hands while she hauls, dropped on the ground after (`loose` 0..1).
 */
export const wrapPoints = (u: UnitSpec, turns = 1.5, n = 12): V3[] => {
  const a = unitAttach(u);
  const shin = (k: number) => {
    const L = {x: lerp(a.kneeL.x, a.footL.x, k), y: lerp(a.kneeL.y, a.footL.y, k), z: lerp(a.kneeL.z, a.footL.z, k)};
    const R = {x: lerp(a.kneeR.x, a.footR.x, k), y: lerp(a.kneeR.y, a.footR.y, k), z: lerp(a.kneeR.z, a.footR.z, k)};
    return {L, R};
  };
  const pts: V3[] = [];
  for (let i = 0; i <= n; i++) {
    const v = i / n, s = shin(0.45 + 0.25 * v);
    const c = mul3(add3(s.L, s.R), 0.5);
    const ax = norm3({x: s.R.x - s.L.x, y: s.R.y - s.L.y, z: s.R.z - s.L.z});
    const up = norm3({x: (a.kneeL.x + a.kneeR.x) / 2 - (a.footL.x + a.footR.x) / 2, y: (a.kneeL.y + a.kneeR.y) / 2 - (a.footL.y + a.footR.y) / 2, z: (a.kneeL.z + a.kneeR.z) / 2 - (a.footL.z + a.footR.z) / 2});
    const fw = norm3(cross3(up, ax));
    const ang = v * turns * Math.PI * 2;
    const rx = Math.hypot(s.R.x - s.L.x, s.R.y - s.L.y, s.R.z - s.L.z) / 2 + 0.07, rz = 0.1;
    pts.push(add3(c, add3(mul3(ax, Math.cos(ang) * rx), mul3(fw, Math.sin(ang) * rz))));
  }
  return pts;
};
export const polyCable = (pts: V3[], key: string, thick = 0.02): Item[] => pts.slice(1).map((p, i) => cable(pts[i], p, 0, CABLE_C, thick, `${key}_${i}`, true, 2));
/** the cable's free end lying on the ground after she lets go (from the wrap toward where she stood) */
export const looseEnd = (from: V3, seed = 3): V3[] => {
  const pts: V3[] = [from];
  let x = from.x, z = from.z;
  for (let i = 1; i <= 6; i++) {
    x += -0.28 + (rnd(seed * 7 + i) - 0.5) * 0.12; z += 0.18 + (rnd(seed * 11 + i) - 0.5) * 0.14;
    pts.push({x, y: G(x, z) + 0.02, z});
  }
  return pts;
};
void [easeIn];
