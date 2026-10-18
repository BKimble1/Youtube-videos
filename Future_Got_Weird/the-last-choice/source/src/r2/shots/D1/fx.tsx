// Section D1 FX at film time T: every contact's sparks, chips, dust and light, the tether cable, the flare, the allied
// drone — all derived from the same choreography (crew.tsx, machines.ts, chor.ts), so every camera sees the same event
// at the same world point. Effects are graded to the contact: a light parry ticks, a heavy block rings and skids, a hard
// impact sprays chips, a mechanical failure tears and sparks. Small and directional; no flash over the contact.
// Returns FxOut {items, lights, shake}.
import {V3, add3, sub3, mul3, norm3, lerp, clamp} from '../../../kit/math';
import {FxOut, fx, combine, impact, breakerHit, plateHit, dust3, chips3, sparks3, tetherItems, TetherOpts, flare, optikFlash, allyDrone, droneKeys, shakeAt} from '../../fx';
import type {DronePose} from '../../fx';
import {unitAttach, unitImpacts} from '../../mech';
import {EV, unitD1, unitFootfalls, BR4, U3_SLIDE} from './machines';
import {directorAt, tetherAt, runnerAt, breakerAt, flaresAt, ALLY_KEYS, ALLY_DIVE, TETHER_SHOTS, tetherTarget, FLARE, crewFootfalls, BR4_DIG} from './crew';
import {G} from './motion';

const ground = (p: V3) => G(p.x, p.z);

// ------------------------------------------------------------------ the allied drone (keys, and the dive at U4's eye)
const diveAt = (t: number): V3 => {
  const K = ALLY_DIVE;
  let i = 0;
  while (i < K.length - 2 && t > K[i + 1][0]) i++;
  const tan = (j: number, ax: number) => (j === 0 || j === K.length - 1 ? 0 : (K[j + 1][ax] - K[j - 1][ax]) / (K[j + 1][0] - K[j - 1][0]));
  const a = K[i], b = K[i + 1], dt = b[0] - a[0], u = clamp((t - a[0]) / dt), u2 = u * u, u3 = u2 * u;
  const H = (ax: number) => (2 * u3 - 3 * u2 + 1) * a[ax] + (u3 - 2 * u2 + u) * tan(i, ax) * dt + (-2 * u3 + 3 * u2) * b[ax] + (u3 - u2) * tan(i + 1, ax) * dt;
  return {x: H(1), y: H(2), z: H(3)};
};
/** the allied drone's pose function (shared with the pilot's eye line, section C's last frames) */
export const allyPose = (T: number): DronePose => {
  const t0 = ALLY_DIVE[0][0], t1 = ALLY_DIVE[ALLY_DIVE.length - 1][0];
  if (T <= t0 || T >= t1) return droneKeys(T, ALLY_KEYS, undefined, 3);
  const p = diveAt(T), pa = diveAt(T - 0.05), pb = diveAt(T + 0.05);
  const v = mul3(sub3(pb, pa), 10);
  const sp = Math.hypot(v.x, v.z);
  const hv = (q: V3) => (Math.atan2(q.x, -q.z) * 180) / Math.PI;
  const face = sub3({x: 41.35, y: 1.3, z: 3.7}, p);
  const heading = sp > 0.6 ? hv(v) : hv(face);
  const bob = 0.035 * Math.sin(T * 3.1 + 3);
  return {pos: add3(p, {x: 0, y: bob, z: 0}), heading, pitch: -clamp(sp * 3.2 + (v.y < 0 ? -v.y * 3 : 0), 0, 34), roll: 0, speed: sp};
};

/** dust kicked at a heel skid: puffs strung along the slide */
const skidDust = (T: number, from: V3, to: V3, t0: number, t1: number, key: string, seed: number): FxOut => {
  const out: FxOut[] = [];
  for (let i = 0; i < 4; i++) {
    const u = i / 3;
    const p = {x: lerp(from.x, to.x, u), y: G(lerp(from.x, to.x, u), lerp(from.z, to.z, u)) + 0.03, z: lerp(from.z, to.z, u)};
    out.push(fx(dust3({at: p, t: T, t0: lerp(t0, t1, u), key: `${key}${i}`, n: 2, size: 0.06, grow: 0.2, speed: 0.45, life: 1.2, dir: norm3({x: (from.x - to.x) * 2, y: 1, z: (from.z - to.z) * 2}), spread: 55, rise: 0.2, color: '#A2968A', opacity: 0.5, seed: seed + i})));
  }
  out.push(fx(chips3({at: {...from, y: ground(from) + 0.04}, t: T, t0, key: `${key}_ch`, n: 5, dir: norm3({x: (from.x - to.x) * 0.5, y: 1, z: (from.z - to.z) * 0.5}), spread: 50, speed: [0.8, 2.4], size: [0.02, 0.05], material: 'asphalt', ground: ground(from), seed})));
  return combine(...out);
};
/** a scuff where a foot catches (a re-plant, a stumble step) */
const scuff = (T: number, at: V3, t0: number, key: string, seed: number, k = 1): FxOut =>
  fx(dust3({at: {...at, y: ground(at) + 0.03}, t: T, t0, key, n: 3, size: 0.06 * k, grow: 0.2 * k, speed: 0.5, life: 1.1, spread: 70, rise: 0.15, color: '#A2968A', opacity: 0.5, seed}));

/** dust and chips where a falling machine (or a torn piece) lands — from the mech's own impact descriptors */
const landDust = (T: number, name: string, seed: number): FxOut => {
  const imps = unitImpacts(unitD1(name, T)).filter((q) => (q.kind === 'ground' || q.kind === 'debris') && T > q.t - 0.05 && T < q.t + 2.2);
  return combine(...imps.map((q, i) => {
    const big = q.kind === 'ground';
    return combine(
      fx(dust3({at: {x: q.pos.x, y: ground(q.pos) + 0.1, z: q.pos.z}, t: T, t0: q.t, key: `d1ld_${name}${i}`, ring: big ? 0.45 : 0.15, n: big ? 8 : 4, speed: big ? 1.3 : 0.7, size: big ? 0.16 : 0.08, grow: big ? 0.38 : 0.2, life: 1.9, rise: 0.25, color: '#958A80', opacity: 0.6, seed: seed + i})),
      fx(chips3({at: {x: q.pos.x, y: ground(q.pos) + 0.1, z: q.pos.z}, t: T, t0: q.t, key: `d1lc_${name}${i}`, n: big ? 7 : 3, spread: 70, speed: [1.5, 4], size: [0.03, big ? 0.11 : 0.06], material: 'asphalt', ground: ground(q.pos), seed: seed + 5 + i})),
      fx([], [], shakeAt(T, q.t, big ? 0.05 : 0.012)),
    );
  }));
};
/** the kit's breaker hit without its white star (the audit: no large flash over the contact); sparks, chips, ring stay */
// (R3: its point light (power 1.4 x strength, radius 6 m) is kept but at 0.35: at full power it washed the whole frame milky for 3 frames at every ram hit)
const ramHit = (o: Parameters<typeof breakerHit>[0]): FxOut => { const b = breakerHit(o); return {...b, items: b.items.filter((it) => !(it.key ?? '').endsWith('_star')), lights: b.lights.map((l) => ({...l, power: l.power * 0.35}))}; };
/** a contact between t0 − 0.1 and t0 + span */
const near = (T: number, t0: number, span = 2.2) => T > t0 - 0.1 && T < t0 + span;

export const d1Fx = (T: number): FxOut => {
  const out: (FxOut | null)[] = [];
  // ---- running feet kick dust (the ridge's rubble, the avenue's grit); the machines' charge thuds
  if (T < 70) {
    crewFootfalls(T, 1.1).forEach((f, i) => {
      const k = clamp(f.speed / 5);
      if (k < 0.25) return;
      const onRubble = f.pos.x < 14;
      out.push(fx(dust3({at: {...f.pos, y: f.pos.y + 0.03}, t: T, t0: f.t, key: `d1ff_${f.key}`, n: onRubble ? 3 : 2, size: 0.05, grow: (onRubble ? 0.3 : 0.18) * k, speed: 0.5, life: 1.0, dir: {x: -0.5, y: 1, z: 0}, spread: 60, rise: 0.25, color: onRubble ? '#A89E92' : '#8E857C', opacity: (onRubble ? 0.55 : 0.4) * k, seed: 300 + i})));
      if (onRubble) out.push(fx(chips3({at: {...f.pos, y: f.pos.y + 0.03}, t: T, t0: f.t, key: `d1fc_${f.key}`, n: 2, dir: {x: -0.3, y: 1, z: 0}, spread: 50, speed: [0.6, 1.8], size: [0.015, 0.035], material: 'concrete', ground: f.pos.y, life: 1.2, seed: 500 + i})));
    });
    unitFootfalls(T, 0.9).forEach((f, i) => out.push(fx(dust3({at: {...f.pos, y: f.pos.y + 0.03}, t: T, t0: f.t, key: `d1uf_${f.key}`, n: 2, size: 0.07, grow: 0.22, speed: 0.6, life: 0.9, spread: 70, rise: 0.2, color: '#8A8078', opacity: 0.45, seed: 700 + i}))));
  }
  const plate = (t: number) => directorAt(t).pts!.plate;
  // ==== X1 the clash: U1's running hammer on the plate (HEAVY BLOCK): ring, sparks off the plate's face, his heels skid
  if (near(T, EV.clash, 2.5)) {
    const p = plate(EV.clash);
    out.push(plateHit({at: add3(p, {x: 0.07, y: 0.05, z: 0}), normal: {x: 0.9, y: 0.4, z: 0.1}, t: T, t0: EV.clash, key: 'd1clash', stage: 'dent', ground: ground(p), seed: 31}));
    const d0 = directorAt(EV.clash + 0.005).spec.world!, d1 = directorAt(68.62).spec.world!;
    out.push(skidDust(T, d0.footL!, d1.footL!, EV.clash + 0.01, 68.55, 'd1ckL', 131), skidDust(T, d0.footR!, d1.footR!, EV.clash + 0.02, 68.58, 'd1ckR', 137));
  }
  // U1's punch parried off the plate (LIGHT PARRY: a tick of sparks along the deflection)
  if (near(T, EV.u1punch)) out.push(impact({at: add3(plate(EV.u1punch), {x: 0.04, y: 0.05, z: -0.1}), normal: {x: 0.3, y: 0.4, z: -0.9}, t: T, t0: EV.u1punch, key: 'd1par1', strength: 0.35, material: 'metal', ground: 0, seed: 33}));
  // his bash into U1's chest (HARD IMPACT on armour)
  // (R3: no armour chips here: they fly back along the normal past the Director's head, and one read as a grey flake stuck to his hair for 7 frames at 70.03-70.23)
  if (near(T, EV.bash1)) {
    const c = unitAttach(unitD1('U1', EV.bash1)).chest;
    const bh = impact({at: add3(c, {x: -0.1, y: -0.05, z: 0}), normal: {x: -1, y: 0.2, z: 0}, t: T, t0: EV.bash1, key: 'd1bash1', strength: 0.9, material: 'armor', ground: ground(c), seed: 35});
    out.push({...bh, items: bh.items.filter((it) => !(it.key ?? '').startsWith('d1bash1_ch'))});
  }
  // the jabs taken on the plate (light blocks)
  [EV.u1jab2, EV.u1jab3].forEach((t0, i) => { if (near(T, t0)) out.push(impact({at: add3(plate(t0), {x: 0.06, y: 0, z: 0}), normal: {x: 1, y: 0.3, z: 0}, t: T, t0, key: `d1jab${i}`, strength: 0.4, material: 'metal', ground: 0, seed: 37 + i})); });
  // his second bash stopped by U1's forearm in the path (block on armour)
  if (near(T, EV.dirBash2)) { const f = unitAttach(unitD1('U1', EV.dirBash2)).forearmR; out.push(impact({at: f, normal: {x: -1, y: 0.3, z: 0}, t: T, t0: EV.dirBash2, key: 'd1blk', strength: 0.7, material: 'armor', ground: ground(f), seed: 39})); }
  // his third bash on the over-reached shoulder
  if (near(T, EV.dirBash3)) { const s = unitAttach(unitD1('U1', EV.dirBash3)).shoulderR; out.push(impact({at: s, normal: {x: -0.6, y: 0.3, z: -0.7}, t: T, t0: EV.dirBash3, key: 'd1bash3', strength: 0.75, material: 'armor', ground: ground(s), seed: 41})); }
  // ==== X2 the breaker and U4: the hammer on the shaft; the knee; the tug; the drone; the kill; the tool wrenched out
  if (near(T, EV.u4ham)) { const b = breakerAt(EV.u4ham).pts!; const m = lerpV(b.front, b.back, 0.4); out.push(impact({at: m, normal: {x: -0.4, y: 0.9, z: 0}, t: T, t0: EV.u4ham, key: 'd1shaft', strength: 0.85, material: 'metal', ground: ground(m), seed: 43})); }
  if (near(T, EV.knee, 3)) {
    const k = unitAttach(unitD1('U4', EV.knee)).kneeL;
    const bh = ramHit({at: k, dir: {x: 0.75, y: -0.35, z: 0.55}, t: T, t0: EV.knee, key: 'd1knee', ground: ground(k), seed: 45, strength: 1.1});
    out.push({...bh, items: bh.items.filter((it) => !(it.key ?? '').startsWith('d1knee_ch'))});
    out.push(fx(chips3({at: k, t: T, t0: EV.knee, key: 'd1kneech', n: 8, dir: {x: -0.6, y: 0.7, z: -0.4}, spread: 60, speed: [1.5, 4.5], size: [0.012, 0.035], material: 'armor', ground: ground(k), seed: 46})));
    const kd = unitAttach(unitD1('U4', EV.knee + 0.26)).kneeL;
    out.push(scuff(T, kd, EV.knee + 0.26, 'd1kneeg', 47, 1.3));
  }
  // the tug: the ram head grinding in its fist
  if (T > EV.u4catch && T < EV.u4let + 0.4) { const h = unitAttach(unitD1('U4', Math.min(T, EV.u4let))).catchR; out.push(fx(sparks3({at: h, t: T, t0: EV.u4catch, t1: EV.u4let, rate: 9, key: 'd1tug4', n: 0, dir: {x: 0, y: 1, z: 0}, spread: 70, speed: [0.6, 2], life: [0.08, 0.22], flash: 0, seed: 49}))); }
  if (near(T, EV.u4catch)) { const h = unitAttach(unitD1('U4', EV.u4catch)).catchR; out.push(impact({at: h, normal: {x: -0.8, y: 0.3, z: -0.3}, t: T, t0: EV.u4catch, key: 'd1catch4', strength: 0.35, material: 'metal', ground: ground(h), seed: 51})); }
  // the drone in its face: a glancing knock off its visor
  if (near(T, EV.harry)) { const e = unitAttach(unitD1('U4', EV.harry)).eye; out.push(impact({at: e, normal: {x: -0.7, y: 0.5, z: -0.2}, t: T, t0: EV.harry, key: 'd1harry', strength: 0.35, material: 'metal', ground: ground(e), seed: 53})); }
  if (near(T, EV.u4kill, 3)) {
    const h = add3(unitAttach(unitD1('U4', EV.u4kill)).head, {x: 0.05, y: -0.12, z: -0.02});
    out.push(ramHit({at: h, dir: {x: 0.85, y: -0.45, z: 0.3}, t: T, t0: EV.u4kill, key: 'd1kill', ground: ground(h), seed: 55, strength: 1.0}));
  }
  if (near(T, EV.toolFree)) { const h = unitAttach(unitD1('U4', EV.toolFree)).head; out.push(fx(sparks3({at: h, t: T, t0: EV.toolFree - 0.05, key: 'd1free', n: 12, dir: {x: -0.3, y: 1, z: -0.2}, spread: 60, speed: [1, 3.5], ground: ground(h), seed: 57, flash: 0.1}))); out.push(scuff(T, h, EV.toolFree, 'd1freed', 58, 0.8)); }
  // ==== X3 the runner and U2: parries on the bar, the hook, the smack, the fork, the hook that lands
  [EV.u2ham1, EV.u2ham2, EV.u2punch4].forEach((t0, i) => {
    if (!near(T, t0)) return;
    const r = runnerAt(t0).pts!;
    const m = lerpV(r.back, r.front, 0.8);
    out.push(impact({at: m, normal: {x: 0.3, y: 1, z: 0}, t: T, t0, key: `d1rpar${i}`, strength: i === 2 ? 0.45 : 0.6, material: 'metal', ground: ground(m), seed: 61 + i}));
  });
  if (near(T, EV.smack)) { const h = unitAttach(unitD1('U2', EV.smack)).head; out.push(impact({at: h, normal: {x: -0.6, y: 0.4, z: 0.6}, t: T, t0: EV.smack, key: 'd1smack', strength: 0.7, material: 'armor', ground: ground(h), seed: 65})); }
  if (near(T, EV.runJab)) { const k = unitAttach(unitD1('U2', EV.runJab)).kneeR; out.push(impact({at: k, normal: {x: -1, y: 0.4, z: 0}, t: T, t0: EV.runJab, key: 'd1fork', strength: 0.55, material: 'armor', ground: ground(k), seed: 67})); }
  if (near(T, EV.u2hit)) { const r = runnerAt(EV.u2hit).pts!; out.push(impact({at: lerpV(r.back, r.front, 0.5), normal: {x: -0.4, y: 0.6, z: -0.7}, t: T, t0: EV.u2hit, key: 'd1rhit', strength: 0.6, material: 'metal', ground: 0, seed: 69})); out.push(scuff(T, runnerAt(79.95).spec.world!.footR!, 79.95, 'd1rknee', 70, 1.2)); }
  // ==== X4 the tether: the yank of U5 (it falls on its back), the hold, the clamp torn out
  for (const s of TETHER_SHOTS) {
    if (T < s.fire || T > s.reelEnd + 0.1) continue;
    const muzzle = (t: number) => tetherAt(t).pts?.muzzle ?? add3(tetherAt(t).body.pos, {x: 0, y: 1.25, z: 0});
    const target = (t: number) => {
      if (t < s.release) return tetherTarget(s.name, t);
      // released: the clamp lets go (or is torn out and thrown) and is reeled back to the launcher
      const k = clamp((t - s.release) / (s.reelEnd - s.release));
      const a = tetherTarget(s.name, s.release), b = muzzle(t);
      const thrown = s.name === 'hold' ? add3(a, {x: -0.3 * Math.sin(Math.PI * Math.min(1, k * 2)), y: 0.5 * Math.sin(Math.PI * Math.min(1, k * 2)), z: 0.2}) : a;
      return add3(lerpV(thrown, b, k * k), {x: 0, y: -0.4 * Math.sin(Math.PI * k), z: 0});
    };
    const o: TetherOpts = {key: `d1teth_${s.name}`, t: T, muzzle, target, fireAt: s.fire, flight: s.bite - s.fire, tautAt: s.taut, seed: s.name === 'yank' ? 5 : 9, cableR: 0.026};
    out.push(tetherItems(o));
  }
  if (near(T, EV.clamp2Tear)) { const a = tetherTarget('hold', EV.clamp2Tear); out.push(impact({at: a, normal: {x: -0.5, y: 0.6, z: 0.3}, t: T, t0: EV.clamp2Tear, key: 'd1tear', strength: 0.55, material: 'metal', ground: ground(a), seed: 71})); }
  // the falls and torn pieces landing
  out.push(landDust(T, 'U5', 81), landDust(T, 'U4', 82), landDust(T, 'U1', 83), landDust(T, 'U2', 84), landDust(T, 'U3', 85));
  // ==== X5 the flare: struck, thrown at U6's eye; the blinding flash; it drops burning at the unit's feet
  if (T > FLARE.strike - 0.1 && T < 96) {
    const eye = unitAttach(unitD1('U6', FLARE.hit)).eye;
    const hand = flaresAt(FLARE.throw).pts?.hand ?? add3(flaresAt(FLARE.throw).body.pos, {x: 0.2, y: 1.7, z: 0.2});
    if (T < FLARE.hit) {
      if (T >= FLARE.throw) out.push(flare({key: 'd1flA', from: hand, to: eye, t0: FLARE.throw, flight: FLARE.hit - FLARE.throw, apex: 0.25, ground: 0, ignite: FLARE.strike, burn: 30, seed: 7}, T));
    } else {
      const drop = {x: eye.x - 0.45, y: 0, z: eye.z + 0.35};
      drop.y = G(drop.x, drop.z);
      out.push(flare({key: 'd1flB', from: eye, to: drop, t0: FLARE.hit, flight: 0.42, apex: 0.12, ground: drop.y, ignite: FLARE.strike, burn: 30, seed: 7}, T));
    }
    out.push(optikFlash({eye, t: T, at: FLARE.hit, key: 'd1blind', strength: 0.45}));
  }
  // ---- the allied drone (its dive at U4's eye at EV.harry)
  out.push(allyDrone({key: 'd1ally', t: T, pose: allyPose, ground: 0, seed: 3, hits: [{at: EV.harry, dir: {x: -0.8, y: 0.5, z: -0.3}, strength: 0.5}]}));
  // ==== X6 the rescue
  // BR1: the hammer on the plate (HEAVY BLOCK: the plate dents), his heels skid, the rear foot catches him
  if (near(T, EV.br1, 3)) {
    const p = plate(EV.br1);
    out.push(plateHit({at: add3(p, {x: 0.06, y: 0, z: 0}), normal: {x: 1, y: 0.25, z: 0.15}, t: T, t0: EV.br1, key: 'd1br1', stage: 'dent', ground: ground(p), seed: 81}));
    out.push(fx([], [], shakeAt(T, EV.br1, 0.05)));
    const d0 = directorAt(EV.br1 + 0.005).spec.world!, d1 = directorAt(78.8).spec.world!;
    out.push(skidDust(T, d0.footL!, d1.footL!, EV.br1 + 0.01, 78.76, 'd1skL', 83), skidDust(T, d0.footR!, d1.footR!, EV.br1 + 0.02, 78.79, 'd1skR', 87));
  }
  // the press (his heels slide again) and the shove (two stumbling steps)
  if (near(T, EV.press, 2)) { const d0 = directorAt(EV.press + 0.005).spec.world!, d1 = directorAt(79.64).spec.world!; out.push(skidDust(T, d0.footR!, d1.footR!, EV.press + 0.02, 79.6, 'd1prR', 89)); }
  if (near(T, EV.shove, 2)) { out.push(scuff(T, directorAt(80.1).spec.world!.footR!, 80.1, 'd1sh1', 91), scuff(T, directorAt(80.35).spec.world!.footL!, 80.35, 'd1sh2', 92)); }
  // BR2: the ram head meets U1's descending forearm (MECHANICAL FAILURE: the elbow joint gives, the forearm flies)
  if (near(T, EV.br2, 3)) {
    const a = unitAttach(unitD1('U1', EV.br2 - 0.005));
    const at = lerpV(a.elbowL, a.wristL, 0.3);
    out.push(ramHit({at, dir: {x: 0.25, y: 0.35, z: -0.9}, t: T, t0: EV.br2, key: 'd1br2', ground: ground(at), seed: 91, strength: 1.2}));
    out.push(fx(sparks3({at: a.elbowL, t: T, t0: EV.br2 + 0.04, key: 'd1elb', n: 18, dir: {x: 0.2, y: 0.8, z: -0.5}, spread: 70, speed: [1.5, 5], ground: ground(a.elbowL), seed: 93, flash: 0.15})));
    // the stump keeps spitting for a moment
    out.push(fx(sparks3({at: unitAttach(unitD1('U1', Math.min(T, EV.crash))).elbowL, t: T, t0: EV.br2 + 0.15, t1: EV.br2 + 1.4, rate: 14, key: 'd1stump', n: 0, dir: {x: 0, y: -0.3, z: -1}, spread: 50, speed: [0.5, 2.2], life: [0.1, 0.35], flash: 0, seed: 94})));
  }
  // the catch of the tool, the grind of the tug, the knee bash, the grip failing
  if (near(T, EV.grab)) { const h = unitAttach(unitD1('U1', EV.grab)).catchR; out.push(impact({at: h, normal: {x: 0.3, y: 0.3, z: 0.9}, t: T, t0: EV.grab, key: 'd1catch1', strength: 0.4, material: 'metal', ground: ground(h), seed: 95})); }
  if (T > EV.grab && T < EV.release + 0.3) { const h = unitAttach(unitD1('U1', Math.min(T, EV.release))).catchR; out.push(fx(sparks3({at: h, t: T, t0: EV.grab, t1: EV.release, rate: 14, key: 'd1tug1', n: 0, dir: {x: 0, y: 1, z: 0}, spread: 70, speed: [0.6, 2.2], life: [0.08, 0.22], flash: 0, seed: 96}))); }
  if (near(T, EV.dirKnee)) { const k = unitAttach(unitD1('U1', EV.dirKnee)).kneeR; out.push(impact({at: k, normal: {x: -0.9, y: 0.3, z: -0.2}, t: T, t0: EV.dirKnee, key: 'd1dknee', strength: 0.8, material: 'armor', ground: ground(k), seed: 97})); }
  // BR3: the ram fired into its open chest (HARD IMPACT: the chest plate goes, it is driven back)
  if (near(T, EV.br3, 3)) {
    const c = unitAttach(unitD1('U1', EV.br3)).chest;
    out.push(ramHit({at: c, dir: {x: 0.15, y: 0.1, z: -1}, t: T, t0: EV.br3, key: 'd1br3', ground: ground(c), seed: 99, strength: 1.4}));
    // its feet scrape back as it is driven into U2
    const f0 = unitAttach(unitD1('U1', EV.br3 + 0.02)), f1 = unitAttach(unitD1('U1', EV.crash - 0.02));
    out.push(skidDust(T, f0.footL, f1.footL, EV.br3 + 0.04, EV.crash, 'd1u1sk', 101));
  }
  // the crash: U1 into U2 mid wind-up (both go down)
  if (near(T, EV.crash, 3)) {
    const a = lerpV(unitAttach(unitD1('U1', EV.crash)).backPlate, unitAttach(unitD1('U2', EV.crash)).shoulderL, 0.5);
    out.push(impact({at: a, normal: {x: 0.6, y: 0.5, z: 0.6}, t: T, t0: EV.crash, key: 'd1crash', strength: 1.4, material: 'armor', ground: ground(a), seed: 103}));
  }
  // the runner throws himself clear (dust), then pins U2: the halligan in its shoulder joint
  if (near(T, EV.crash + 0.05)) out.push(scuff(T, runnerAt(83.6).spec.world!.footL!, 83.6, 'd1clear', 105, 1.3));
  if (near(T, EV.pin, 3)) { const s = unitAttach(unitD1('U2', EV.pin)).shoulderL; out.push(impact({at: s, normal: {x: -0.2, y: 1, z: 0.2}, t: T, t0: EV.pin, key: 'd1pin', strength: 0.75, material: 'armor', ground: ground(s), seed: 107})); }
  // ==== X7 BR4: shoulder and plate into U3's chest; his driving steps dig in; its feet skid back up the slope; it goes over
  // the crest, lands on the inner slope and slides down it
  if (T > BR4.go && T < BR4.slide1 + 2.5) {
    const c = unitAttach(unitD1('U3', EV.br4)).chest;
    // (normal up and south: the chips spray across the frame, not into the low lens behind him)
    out.push(impact({at: add3(c, {x: -0.05, y: -0.14, z: 0}), normal: {x: -0.15, y: 0.85, z: 0.5}, t: T, t0: EV.br4, key: 'd1br4', strength: 1.5, material: 'armor', ground: ground(c), seed: 109}));
    out.push(fx([], [], shakeAt(T, EV.br4, 0.09)));
    out.push(fx([], [], shakeAt(T, BR4.release, 0.03)));
    BR4_DIG.forEach(([t, side], i) => {
      if (T < t) return;
      const w = directorAt(t + 0.01).spec.world!;
      const f = side === 'L' ? w.footL! : w.footR!;
      out.push(fx(dust3({at: {...f, y: f.y + 0.03}, t: T, t0: t, key: `d1dig${i}`, n: 3, size: 0.05, grow: 0.22, speed: 0.6, life: 1.0, dir: {x: -0.8, y: 0.9, z: 0}, spread: 45, rise: 0.15, color: '#A2968A', opacity: 0.5, seed: 110 + i})));
      out.push(fx(chips3({at: {...f, y: f.y + 0.03}, t: T, t0: t, key: `d1digc${i}`, n: 2, dir: {x: -0.7, y: 1, z: 0.1}, spread: 40, speed: [0.8, 2], size: [0.012, 0.03], material: 'asphalt', ground: f.y, life: 1.0, seed: 120 + i})));
    });
    const fa = unitAttach(unitD1('U3', EV.br4)), fb = unitAttach(unitD1('U3', BR4.release));
    out.push(skidDust(T, fa.footL, fb.footL, EV.br4 + 0.05, BR4.release, 'd1u3skL', 131), skidDust(T, fa.footR, fb.footR, EV.br4 + 0.08, BR4.release, 'd1u3skR', 137));
    if (T > U3_SLIDE.t0) {
      const pa = unitAttach(unitD1('U3', U3_SLIDE.t0 + 0.15)).pelvis, pb = unitAttach(unitD1('U3', U3_SLIDE.t1)).chest;
      out.push(skidDust(T, pa, pb, U3_SLIDE.t0 + 0.15, U3_SLIDE.t1 - 0.2, 'd1u3sl', 141));
      out.push(fx(chips3({at: {...pb, y: ground(pb) + 0.1}, t: T, t0: U3_SLIDE.t0 + 0.3, key: 'd1u3tr', n: 9, dir: {x: 1, y: 0.3, z: -0.05}, spread: 35, speed: [0.6, 2.2], size: [0.03, 0.09], material: 'concrete', ground: ground(pb) - 0.8, life: 2.2, seed: 149})));
    }
  }
  return combine(...out.filter(Boolean) as FxOut[]);
};

const lerpV = (a: V3, b: V3, k: number): V3 => ({x: lerp(a.x, b.x, k), y: lerp(a.y, b.y, k), z: lerp(a.z, b.z, k)});
void [mul3];
