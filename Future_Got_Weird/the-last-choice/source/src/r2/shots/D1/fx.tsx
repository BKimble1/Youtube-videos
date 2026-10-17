// Section D1 FX at film time T: every contact's sparks, chips, dust and light, the tether cable, the flare, the allied
// drone — all derived from the same choreography (crew.tsx, machines.ts), so every camera sees the same event at the
// same world point. Returns FxOut {items, lights, shake}.
import {V3, add3, sub3, mul3, norm3, lerp, clamp} from '../../../kit/math';
import {FxOut, fx, combine, impact, breakerHit, plateHit, dust3, chips3, sparks3, tetherItems, TetherOpts, flare, optikFlash, allyDrone, droneKeys, flash3, shakeAt} from '../../fx';
import {unitAttach, unitImpacts, cable} from '../../mech';

const CABLES = ['#E0543E', '#3F7FD1', '#E8C547', '#2E9E6A'];
import {EV, unitD1, FRONT, unitFootfalls} from './machines';
import {directorAt, tetherAt, runnerAt, flaresAt, ALLY_KEYS, TETHER_SHOTS, FLARE, crewFootfalls} from './crew';
import {G, fwdOf, rightOf} from './motion';

const ground = (p: V3) => G(p.x, p.z);

/** the allied drone's pose function (shared with the pilot's eye line) */
export const allyPose = (T: number) => droneKeys(T, ALLY_KEYS, undefined, 3);

/** dust kicked at a heel skid: puffs strung along the slide */
const skidDust = (T: number, from: V3, to: V3, t0: number, t1: number, key: string, seed: number): FxOut => {
  const out: FxOut[] = [];
  for (let i = 0; i < 4; i++) {
    const u = i / 3;
    const p = {x: lerp(from.x, to.x, u), y: G(lerp(from.x, to.x, u), lerp(from.z, to.z, u)) + 0.03, z: lerp(from.z, to.z, u)};
    out.push(fx(dust3({at: p, t: T, t0: lerp(t0, t1, u), key: `${key}${i}`, n: 2, size: 0.06, grow: 0.2, speed: 0.45, life: 1.2, dir: norm3({x: (from.x - to.x) * 2, y: 1, z: 0}), spread: 55, rise: 0.2, color: '#A2968A', opacity: 0.5, seed: seed + i})));
  }
  out.push(fx(chips3({at: {...from, y: ground(from) + 0.04}, t: T, t0, key: `${key}_ch`, n: 5, dir: norm3({x: -0.4, y: 1, z: 0.1}), spread: 50, speed: [0.8, 2.4], size: [0.02, 0.05], material: 'asphalt', ground: ground(from), seed})));
  return combine(...out);
};

/** dust where a falling machine lands (from the mech's own impact descriptors) */
const landDust = (T: number, name: string, seed: number): FxOut => {
  const imps = unitImpacts(unitD1(name, T)).filter((q) => q.kind === 'ground');
  return combine(...imps.map((q, i) => combine(
    fx(dust3({at: {x: q.pos.x, y: ground(q.pos) + 0.1, z: q.pos.z}, t: T, t0: q.t, key: `d1ld_${name}${i}`, ring: 0.45, n: 8, speed: 1.3, size: 0.16, grow: 0.38, life: 1.9, rise: 0.25, color: '#958A80', opacity: 0.6, seed: seed + i})),
    fx(chips3({at: {x: q.pos.x, y: ground(q.pos) + 0.1, z: q.pos.z}, t: T, t0: q.t, key: `d1lc_${name}${i}`, n: 7, spread: 70, speed: [1.5, 4], size: [0.04, 0.11], material: 'asphalt', ground: ground(q.pos), seed: seed + 5})),
    fx([], [], shakeAt(T, q.t, 0.05)),
  )));
};

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
  // ---- CLASH: the plate slams into U1's chest
  if (T > EV.clash - 0.1 && T < EV.clash + 3) {
    const c = unitAttach(unitD1('U1', EV.clash)).chest;
    out.push(impact({at: add3(c, {x: -0.12, y: -0.05, z: 0}), normal: {x: -1, y: 0.2, z: 0}, t: T, t0: EV.clash, key: 'd1clash', strength: 1.3, material: 'armor', ground: ground(c), seed: 31}));
    out.push(fx([], [], shakeAt(T, EV.clash, 0.06)));
  }
  // ---- U1's first blow glances off the plate; his bash back
  if (T > EV.u1jab - 0.1 && T < EV.u1jab + 2) {
    const p = directorAt(EV.u1jab).pts!.plate;
    out.push(impact({at: p, normal: {x: 1, y: 0.3, z: -0.2}, t: T, t0: EV.u1jab, key: 'd1jab', strength: 0.6, material: 'metal', ground: ground(p), seed: 33}));
  }
  if (T > EV.bash1 - 0.1 && T < EV.bash1 + 2) {
    const c = unitAttach(unitD1('U1', EV.bash1)).chest;
    out.push(impact({at: add3(c, {x: -0.1, y: 0, z: 0}), normal: {x: -1, y: 0.1, z: 0}, t: T, t0: EV.bash1, key: 'd1bash', strength: 0.9, material: 'armor', ground: ground(c), seed: 35}));
  }
  // ---- the breaker breaks U4's knee; the knee hits the ground
  if (T > EV.knee - 0.1 && T < EV.knee + 3) {
    const k = unitAttach(unitD1('U4', EV.knee)).kneeL;
    // (strike direction tilted so the spark cone and chips spray back up and north, away from the D1-4a lens)
    // (the kit's armour chips are 4–12 cm: from a lens 2 m away they read as slabs, so they are swapped for grit here)
    const bh = breakerHit({at: k, dir: {x: 0.75, y: -0.35, z: 0.55}, t: T, t0: EV.knee, key: 'd1knee', ground: ground(k), seed: 41, strength: 1.1});
    out.push({...bh, items: bh.items.filter((it) => !(it.key ?? '').startsWith('d1knee_ch'))});
    out.push(fx(chips3({at: k, t: T, t0: EV.knee, key: 'd1kneech', n: 8, dir: {x: -0.6, y: 0.7, z: -0.4}, spread: 60, speed: [1.5, 4.5], size: [0.012, 0.035], material: 'armor', ground: ground(k), seed: 42})));
    const kd = unitAttach(unitD1('U4', EV.knee + 0.26)).kneeL;
    const kg = {x: kd.x, y: ground(kd) + 0.04, z: kd.z};
    out.push(fx(dust3({at: kg, t: T, t0: EV.knee + 0.26, key: 'd1kneeg', n: 4, size: 0.08, grow: 0.28, speed: 0.7, life: 1.3, spread: 75, rise: 0.2, color: '#8E857C', opacity: 0.55, seed: 43})));
    out.push(fx(chips3({at: kg, t: T, t0: EV.knee + 0.26, key: 'd1kneec', n: 5, dir: {x: 0.2, y: 1, z: -0.4}, spread: 60, speed: [1, 2.6], size: [0.015, 0.04], material: 'asphalt', ground: kg.y - 0.04, seed: 44})));
  }
  // ---- the tether: both shots (fire → bite → taut → release → reel in)
  for (const s of TETHER_SHOTS) {
    if (T < s.fire || T > s.reelEnd + 0.1) continue;
    const muzzle = (t: number) => tetherAt(t).pts?.muzzle ?? add3(tetherAt(t).body.pos, {x: 0, y: 1.25, z: 0});
    const tgtAt = (t: number) => (s.target === 'U5' ? unitAttach(unitD1('U5', t)).kneeL : unitAttach(unitD1('U1', t)).shoulderR);
    const target = (t: number) => {
      if (t < s.release) return tgtAt(t);
      // released: the clamp lets go and is reeled back to the launcher
      const k = clamp((t - s.release) / (s.reelEnd - s.release));
      const a = tgtAt(s.release), b = muzzle(t);
      return add3(lerpV(a, b, k * k), {x: 0, y: -0.4 * Math.sin(Math.PI * k), z: 0});
    };
    const o: TetherOpts = {key: `d1teth_${s.name}`, t: T, muzzle, target, fireAt: s.fire, flight: s.bite - s.fire, tautAt: s.taut, seed: s.name === 'yank' ? 5 : 9, cableR: 0.026};
    out.push(tetherItems(o));
  }
  // U5 lands on its back; U4 topples; U1 into U2 (BR3); U3 into the crater (BR4)
  out.push(landDust(T, 'U5', 51), landDust(T, 'U4', 52), landDust(T, 'U1', 53), landDust(T, 'U2', 54), landDust(T, 'U3', 55));
  // ---- the runner's pry: sparks at the edge while levering, the plate pops; the rip: cables torn out with sparks
  if (T > EV.pryIn && T < EV.rip + 3) {
    const u = unitAttach(unitD1('U4', EV.pryPop));
    const edge = add3(u.backPlate, {x: 0, y: 0.16, z: 0});
    out.push(fx(sparks3({at: edge, t: T, t0: EV.pryIn + 0.05, t1: EV.pryPop, rate: 40, key: 'd1pry', n: 0, dir: {x: 0.3, y: 1, z: 0.2}, spread: 50, speed: [1, 3], life: [0.1, 0.3], flash: 0, seed: 61})));
    out.push(impact({at: edge, normal: {x: 0.4, y: 0.8, z: 0.3}, t: T, t0: EV.pryPop, key: 'd1pop', strength: 1.0, material: 'armor', ground: ground(edge), seed: 63}));
    const r = runnerAt(T).pts;
    const from = unitAttach(unitD1('U4', T)).backPlate;
    if (T > 76.45) {
      // cables: from inside the back to the fist while gripped; after the rip, torn ends hang from the hand and the back
      const hand = r?.cablesHand ?? add3(from, {x: 0.3, y: 0.3, z: 0});
      const ripped = T > EV.rip + 0.05;
      CABLES.forEach((c, k) => {
        const a = add3(from, {x: (k - 1.5) * 0.04, y: 0.02 * (k % 2), z: (k - 1.5) * 0.02});
        if (!ripped) out.push(fx([cable(a, hand, -0.03 - 0.02 * k, c, 0.016, `d1cab${k}`, true, 5)]));
        else {
          const tear = mulAdd(a, sub3(hand, a), 0.45 + 0.05 * k);
          out.push(fx([cable(hand, add3(tear, {x: 0, y: -0.1 * Math.min(1, (T - EV.rip) * 2), z: 0}), -0.06, c, 0.016, `d1cabh${k}`, true, 5)]));
          out.push(fx([cable(a, add3(a, {x: 0.08 * (k - 1.5), y: 0.14 - 0.25 * Math.min(1, (T - EV.rip) * 1.5), z: 0.05}), -0.03, c, 0.016, `d1cabs${k}`, true, 4)]));
        }
      });
      out.push(fx(sparks3({at: from, t: T, t0: EV.rip, key: 'd1rip', n: 26, dir: {x: 0.2, y: 1, z: 0.4}, spread: 80, speed: [2, 6], ground: ground(from), seed: 65, flash: 0.35})));
      out.push(fx(flash3({at: from, t: T, t0: EV.rip, key: 'd1ripfl', r: 0.45, dur: 0.12, color: '#BFEAFF'})));
    }
  }
  // ---- the flare: struck, thrown at U6's face; the blinding flash; it drops burning at the unit's feet
  if (T > FLARE.strike - 0.1 && T < 96) {
    const eye = unitAttach(unitD1('U6', FLARE.hit)).eye;
    const hand = flaresAt(FLARE.throw).pts?.hand ?? add3(flaresAt(FLARE.throw).body.pos, {x: 0.2, y: 1.7, z: 0.2});
    if (T < FLARE.hit) {
      if (T >= FLARE.throw) out.push(flare({key: 'd1flA', from: hand, to: eye, t0: FLARE.throw, flight: FLARE.hit - FLARE.throw, apex: 0.25, ground: 0, ignite: FLARE.strike, burn: 30, seed: 7}, T));
    } else {
      const drop = {x: eye.x - 0.55, y: 0, z: eye.z + 0.25};
      drop.y = G(drop.x, drop.z);
      out.push(flare({key: 'd1flB', from: eye, to: drop, t0: FLARE.hit, flight: 0.42, apex: 0.12, ground: drop.y, ignite: FLARE.strike, burn: 30, seed: 7}, T));
    }
    out.push(optikFlash({eye, t: T, at: FLARE.hit, key: 'd1blind', strength: 1.2}));
  }
  // ---- the allied drone (harries the enemy drone at 77.42)
  out.push(allyDrone({key: 'd1ally', t: T, pose: allyPose, ground: 0, seed: 3}));
  if (T > EV.allyHit && T < EV.allyHit + 1.5) {
    const p = allyPose(EV.allyHit).pos;
    out.push(impact({at: add3(p, {x: 0.25, y: 0, z: -0.1}), normal: {x: -1, y: 0.3, z: 0.2}, t: T, t0: EV.allyHit, key: 'd1allyhit', strength: 1.0, material: 'metal', seed: 71}));
  }
  // ---- BR1: the swing meets the plate — it dents; his heels skid back with dust
  if (T > EV.br1 - 0.1 && T < EV.br1 + 3) {
    const p = directorAt(EV.br1).pts!.plate;
    out.push(plateHit({at: add3(p, {x: 0.06, y: 0, z: 0}), normal: {x: 1, y: 0.25, z: 0.15}, t: T, t0: EV.br1, key: 'd1br1', stage: 'dent', ground: ground(p), seed: 81}));
    out.push(fx([], [], shakeAt(T, EV.br1, 0.09)));
    const d0 = directorAt(EV.br1 + 0.005).spec.world!, d1 = directorAt(EV.br1 + 0.34).spec.world!;
    out.push(skidDust(T, d0.footL!, d1.footL!, EV.br1 + 0.01, EV.br1 + 0.28, 'd1skL', 83));
    out.push(skidDust(T, d0.footR!, d1.footR!, EV.br1 + 0.02, EV.br1 + 0.31, 'd1skR', 87));
    // the re-plant: a scuff where the rear foot catches
    const rp = directorAt(EV.br1 + 0.6).spec.world!.footR!;
    out.push(fx(dust3({at: {...rp, y: rp.y + 0.03}, t: T, t0: EV.br1 + 0.58, key: 'd1rp', n: 3, size: 0.06, grow: 0.2, speed: 0.5, life: 1.1, spread: 70, rise: 0.15, color: '#A2968A', opacity: 0.5, seed: 89})));
  }
  // ---- BR2: the breaker smashes U1's chest plate
  if (T > EV.br2 - 0.1 && T < EV.br2 + 3) {
    const c = unitAttach(unitD1('U1', EV.br2)).chest;
    out.push(breakerHit({at: add3(c, {x: 0.05, y: 0, z: 0.1}), dir: {x: -0.2, y: -0.05, z: -1}, t: T, t0: EV.br2, key: 'd1br2', ground: ground(c), seed: 91, strength: 1.35}));
  }
  // ---- BR3: U1 slams into U2
  if (T > EV.br3Crash - 0.1 && T < EV.br3Crash + 3) {
    const a = unitAttach(unitD1('U2', EV.br3Crash)).shoulderL;
    out.push(impact({at: a, normal: {x: 0.5, y: 0.3, z: 0.8}, t: T, t0: EV.br3Crash, key: 'd1br3', strength: 1.5, material: 'armor', ground: ground(a), seed: 93}));
    out.push(fx([], [], shakeAt(T, EV.br3Crash, 0.08)));
  }
  // ---- BR4: the shoulder charge into U3; U3 goes over the rim
  if (T > EV.br4 - 0.1 && T < EV.br4 + 3) {
    const c = unitAttach(unitD1('U3', EV.br4)).chest;
    out.push(impact({at: add3(c, {x: -0.12, y: -0.1, z: 0}), normal: {x: -0.25, y: 0.85, z: 0.45}, t: T, t0: EV.br4, key: 'd1br4', strength: 1.4, material: 'armor', ground: ground(c), seed: 95}));
    out.push(fx([], [], shakeAt(T, EV.br4, 0.08)));
    // his driving feet dig in
    const w = directorAt(EV.br4 + 0.3).spec.world!;
    [w.footL!, w.footR!].forEach((f, i) => out.push(fx(dust3({at: {...f, y: f.y + 0.03}, t: T, t0: EV.br4 + 0.15 + i * 0.18, key: `d1dig${i}`, n: 2, size: 0.05, grow: 0.18, speed: 0.45, life: 0.9, dir: {x: -0.6, y: 1, z: 0}, spread: 50, color: '#A2968A', opacity: 0.45, seed: 97 + i}))));
  }
  return combine(...out.filter(Boolean) as FxOut[]);
};

const lerpV = (a: V3, b: V3, k: number): V3 => ({x: lerp(a.x, b.x, k), y: lerp(a.y, b.y, k), z: lerp(a.z, b.z, k)});
const mulAdd = (a: V3, d: V3, k: number): V3 => add3(a, mul3(d, k));
void [fwdOf, rightOf, FRONT];
