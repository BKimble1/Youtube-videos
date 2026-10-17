// Section D4 FX at film time T: every contact's sparks, chips, dust and light, the cut cable, the last flare, the
// lost tools — all derived from the same choreography (crew.tsx, machines.ts, marks.ts), so every camera sees the same
// event at the same world point. Returns FxOut {items, lights, shake}.
import {V3, add3, sub3, mul3, norm3, lerp, clamp, smooth} from '../../../kit/math';
import type {Item} from '../../engine';
import {FxOut, fx, combine, impact, plateHit, dust3, chips3, sparks3, flash3, ring3, flare, optikFlash, shakeAt} from '../../fx';
import {unitAttach, unitImpacts, heavyAttach} from '../../mech';
import {EV} from './times';
import {BLOCK_PLATE, RUNNER_CHEST, RUNNER_DOWN, STRIKE_PLATE, SLAM, PLANT} from './marks';
import {unitD4, heavy2At, heavy2Footfalls, h1Fist, droneD4} from './machines';
import {crewAt, crewFootfalls, clubPoint, FLARE} from './crew';
import {DROPS, dropAt, heavySlab, wrapPoints, polyCable, looseEnd} from './props';
import {cable} from '../../mech';
import {G} from './motion';

const ground = (p: V3) => G(p.x, p.z);
const CABLE_C = '#3E4A52';
const lerpV = (a: V3, b: V3, k: number): V3 => ({x: lerp(a.x, b.x, k), y: lerp(a.y, b.y, k), z: lerp(a.z, b.z, k)});

/** dust where a falling machine lands (from the mech's own impact descriptors) */
const landDust = (T: number, name: string, seed: number): FxOut => {
  const imps = unitImpacts(unitD4(name, T)).filter((q) => q.kind === 'ground' && T > q.t - 0.05 && T < q.t + 3);
  return combine(...imps.map((q, i) => combine(
    fx(dust3({at: {x: q.pos.x, y: ground(q.pos) + 0.1, z: q.pos.z}, t: T, t0: q.t, key: `d4ld_${name}${i}`, ring: 0.45, n: 8, speed: 1.3, size: 0.16, grow: 0.38, life: 1.9, rise: 0.25, color: '#958A80', opacity: 0.6, seed: seed + i})),
    fx(chips3({at: {x: q.pos.x, y: ground(q.pos) + 0.1, z: q.pos.z}, t: T, t0: q.t, key: `d4lc_${name}${i}`, n: 7, spread: 70, speed: [1.5, 4], size: [0.03, 0.09], material: 'asphalt', ground: ground(q.pos), seed: seed + 5})),
    fx([], [], shakeAt(T, q.t, 0.05)),
  )));
};
/** a person hitting the ground: a low puff */
const bodyDust = (T: number, at: V3, t0: number, key: string, seed: number, k = 1): FxOut =>
  T < t0 - 0.05 || T > t0 + 2.5 ? fx() : fx(dust3({at: {x: at.x, y: ground(at) + 0.05, z: at.z}, t: T, t0, key, n: 5, ring: 0.3, speed: 0.8 * k, size: 0.1, grow: 0.3 * k, life: 1.5, rise: 0.15, color: '#9E9388', opacity: 0.55, seed}));

export const d4Fx = (T: number): FxOut => {
  const out: (FxOut | null)[] = [];
  // ---- running feet kick dust (the avenue's grit, the ridge-foot rubble)
  crewFootfalls(T, 1.0).forEach((f, i) => {
    const onRubble = f.pos.x < 20;
    out.push(fx(dust3({at: {...f.pos, y: f.pos.y + 0.03}, t: T, t0: f.t, key: `d4ff_${f.key}`, n: onRubble ? 3 : 2, size: 0.05, grow: onRubble ? 0.26 : 0.16, speed: 0.5, life: 1.0, dir: {x: 0.4, y: 1, z: 0}, spread: 60, rise: 0.25, color: onRubble ? '#A89E92' : '#8E857C', opacity: onRubble ? 0.5 : 0.36, seed: 300 + i})));
  });
  // ---- heavy 2's footfalls: dust under each foot, the ground shakes
  heavy2Footfalls(T - 1.6, T).forEach((f, i) => {
    out.push(fx(dust3({at: {...f.pos, y: f.pos.y + 0.05}, t: T, t0: f.t, key: `d4hf_${f.t.toFixed(2)}_${f.leg}`, n: 5, ring: 0.5, speed: 1.1, size: 0.2, grow: 0.5, life: 1.6, rise: 0.2, color: '#8E847A', opacity: 0.5, seed: 900 + i})));
    out.push(fx([], [], shakeAt(T, f.t, 0.025)));
  });
  // ---- D4-1 the block: W1's hammer on the plate — the crack goes right through; his heels skid back
  if (T > EV.w1Swing - 0.1 && T < EV.w1Swing + 3) {
    out.push(plateHit({at: add3(BLOCK_PLATE, {x: 0.06, y: 0, z: 0}), normal: {x: 1, y: 0.25, z: 0.15}, t: T, t0: EV.w1Swing, key: 'd4blk', stage: 'crack', ground: ground(BLOCK_PLATE), seed: 81}));
    out.push(fx([], [], shakeAt(T, EV.w1Swing, 0.1)));
    const d0 = crewAt('director', EV.w1Swing + 0.005).spec.world!, d1 = crewAt('director', EV.w1Swing + 0.34).spec.world!;
    [d0.footL!, d0.footR!].forEach((f, i) => {
      const g = [d1.footL!, d1.footR!][i];
      for (let j = 0; j < 3; j++) {
        const u = j / 2, p = {x: lerp(f.x, g.x, u), y: G(lerp(f.x, g.x, u), lerp(f.z, g.z, u)) + 0.03, z: lerp(f.z, g.z, u)};
        out.push(fx(dust3({at: p, t: T, t0: EV.w1Swing + 0.02 + u * 0.26, key: `d4sk${i}${j}`, n: 2, size: 0.06, grow: 0.2, speed: 0.45, life: 1.1, dir: {x: 0.6, y: 1, z: 0}, spread: 55, rise: 0.2, color: '#A2968A', opacity: 0.5, seed: 83 + i * 3 + j})));
      }
    });
  }
  // ---- D4-2 the runner: the backhand to the chest, the fall on his back; the halligan clatters away
  if (T > EV.runnerHit - 0.1 && T < EV.runnerHit + 3) {
    out.push(impact({at: RUNNER_CHEST, normal: {x: 0.9, y: 0.2, z: -0.3}, t: T, t0: EV.runnerHit, key: 'd4rhit', strength: 1, material: 'flesh', seed: 101}));
    out.push(fx([], [], shakeAt(T, EV.runnerHit, 0.04)));
    out.push(bodyDust(T, {x: RUNNER_DOWN.x, y: 0, z: RUNNER_DOWN.z}, EV.runnerDown - 0.2, 'd4rdn', 103, 1.2));
  }
  // ---- D4-2 the disarm: the launcher's grip tears out of its mounting in H1's fist (sparks, chips)
  if (T > EV.disarmTear - 0.1 && T < EV.disarmTear + 2) {
    const f = h1Fist(EV.disarmTear)!.hand;
    out.push(fx(sparks3({at: f, t: T, t0: EV.disarmTear, key: 'd4tear', n: 14, dir: {x: -0.5, y: 0.6, z: 0.3}, spread: 70, speed: [1.5, 4.5], ground: ground(f), seed: 111, flash: 0.15})));
    out.push(fx(chips3({at: f, t: T, t0: EV.disarmTear, key: 'd4tearc', n: 4, dir: {x: -0.6, y: 0.7, z: 0}, spread: 60, speed: [1, 3], size: [0.015, 0.04], material: 'metal', ground: ground(f), seed: 113})));
  }
  // the launcher in H1's fist (torn free → lifted → flung down), then on the ground
  if (T >= EV.disarmTear && T < EV.launcherDrop) {
    const f = h1Fist(T)!;
    out.push(fx([{kind: 'mesh', mesh: launcherMesh(), key: 'd4_launcherH', xf: {pos: add3(f.hand, {x: -0.05, y: -0.04, z: 0}), yaw: 250, roll: 60 * smooth((T - EV.disarmTear) / 0.4)}, asObject: true}]));
  }
  Object.values(DROPS).forEach((d) => {
    const it = dropAt(d, T);
    if (it) out.push(fx([it]));
    const land = d.t0 + d.flight * 0.85;
    if (T > land - 0.05 && T < land + 2) out.push(fx(dust3({at: {x: d.to.x, y: G(d.to.x, d.to.z) + 0.03, z: d.to.z}, t: T, t0: land, key: `d4dd_${d.key}`, n: 3, size: 0.05, grow: 0.16, speed: 0.4, life: 1.0, rise: 0.12, color: '#9E9388', opacity: 0.45, seed: 121})));
  });
  // ---- D4-3/4 the cut cable: pulled off the reel, carried, thrown round W3's shins, hauled, let go
  out.push(cableFx(T));
  // ---- D4-4 W1: the plate into its chest — the chest plate comes off; it topples
  if (T > EV.w1Smash - 0.1 && T < EV.w1Smash + 3) {
    const c = unitAttach(unitD4('W1', EV.w1Smash)).chest;
    out.push(impact({at: add3(c, {x: -0.1, y: -0.05, z: 0.05}), normal: {x: -0.9, y: 0.25, z: 0.35}, t: T, t0: EV.w1Smash, key: 'd4w1', strength: 1.4, material: 'armor', ground: ground(c), seed: 131}));
    out.push(fx([], [], shakeAt(T, EV.w1Smash, 0.08)));
  }
  // ---- W2: the empty breaker swung into its raised arm — the arm comes off at the shoulder
  if (T > EV.club - 0.1 && T < EV.club + 3) {
    const p = clubPoint();
    out.push(impact({at: p, normal: {x: -0.7, y: 0.5, z: -0.4}, t: T, t0: EV.club, key: 'd4club', strength: 1.5, material: 'armor', ground: ground(p), seed: 141}));
    out.push(fx(ring3({at: p, normal: {x: -1, y: 0.3, z: 0}, t: T, t0: EV.club, key: 'd4clubr', r0: 0.1, speed: 6, dur: 0.16, width: 0.05})));
    out.push(fx([], [], shakeAt(T, EV.club, 0.08)));
  }
  // ---- W3: the Director drives into it (its shins bound) — over it goes
  if (T > EV.w3Drive - 0.1 && T < EV.w3Drive + 3) {
    const c = unitAttach(unitD4('W3', EV.w3Drive)).chest;
    out.push(impact({at: add3(c, {x: -0.12, y: -0.15, z: 0}), normal: {x: -0.8, y: 0.3, z: 0.5}, t: T, t0: EV.w3Drive, key: 'd4w3', strength: 1.3, material: 'armor', ground: ground(c), seed: 151}));
    out.push(fx([], [], shakeAt(T, EV.w3Drive, 0.08)));
  }
  out.push(landDust(T, 'W1', 161), landDust(T, 'W2', 163), landDust(T, 'W3', 165));
  // ---- the last flare: struck (165.22), thrown (165.8) into heavy 2's eye (166.14): the flash; it drops burning
  if (T > FLARE.strike - 0.1) {
    const eye = heavyAttach(heavy2At(FLARE.hit)).eye;
    const hand = crewAt('flares', FLARE.throw).pts!.hand;
    const drop = {x: eye.x + 0.9, y: 0, z: eye.z + 0.5};
    drop.y = G(drop.x, drop.z);
    if (T >= FLARE.throw && T < FLARE.hit) out.push(flare({key: 'd4flA', from: hand, to: eye, t0: FLARE.throw, flight: FLARE.hit - FLARE.throw, apex: 0.35, ground: 0, ignite: FLARE.strike, burn: 40, seed: 17}, T));
    if (T >= FLARE.hit) out.push(flare({key: 'd4flB', from: eye, to: drop, t0: FLARE.hit, flight: 0.75, apex: 0.2, ground: drop.y, ignite: FLARE.strike, burn: 40, seed: 17}, T));
    if (T > FLARE.strike && T < FLARE.strike + 0.6) out.push(fx(sparks3({at: hand, t: T, t0: FLARE.strike, key: 'd4fls', n: 12, dir: {x: 0, y: 1, z: 0}, spread: 50, speed: [1, 3], seed: 171, flash: 0.2})));
    out.push(optikFlash({eye, t: T, at: FLARE.hit, key: 'd4blind', strength: 1.5}));
  }
  // ---- D4-5 heavy 2 staggers off the slab: the slab tips, grit and dust where the foot slips off it
  out.push(fx([heavySlab(T)]));
  if (T > EV.slabTip - 0.1 && T < EV.slabTip + 3) {
    const f = heavy2At(EV.stumble + 0.2).feet![2]!;
    out.push(fx(dust3({at: {...f, y: ground(f) + 0.1}, t: T, t0: EV.slabTip, key: 'd4slab', ring: 0.6, n: 9, speed: 1.6, size: 0.22, grow: 0.6, life: 2.2, rise: 0.3, color: '#8E847A', opacity: 0.6, seed: 181})));
    out.push(fx(chips3({at: {...f, y: ground(f) + 0.2}, t: T, t0: EV.slabTip, key: 'd4slabc', n: 9, spread: 70, speed: [1.5, 4.5], size: [0.03, 0.1], material: 'asphalt', ground: ground(f), seed: 183})));
    out.push(fx([], [], shakeAt(T, EV.slabTip, 0.12)));
  }
  // ---- 170.22 the drone clips the drone pilot's head; she goes down (a puff where she lands)
  if (T > EV.droneHit - 0.1 && T < EV.droneHit + 3) {
    const p = droneD4(7601, EV.droneHit).pos;
    out.push(impact({at: p, normal: {x: 0.7, y: 0.5, z: 0.3}, t: T, t0: EV.droneHit, key: 'd4dhit', strength: 0.5, material: 'metal', ground: ground(p), seed: 191}));
    out.push(bodyDust(T, {x: 10.6, y: 0, z: 4.45}, 170.72, 'd4pdn', 193));
  }
  // ---- D4-8 THE STRIKE: the ram meets the plate, the plate shatters; he is thrown into the slab
  if (T > EV.strike - 0.1 && T < EV.strike + 4) {
    out.push(plateHit({at: STRIKE_PLATE, normal: {x: 0.9, y: 0.25, z: -0.2}, t: T, t0: EV.strike, key: 'd4strike', stage: 'shatter', ground: ground(STRIKE_PLATE), seed: 201}));
    out.push(fx(flash3({at: STRIKE_PLATE, t: T, t0: EV.strike, key: 'd4strfl', r: 0.9, dur: 0.1, color: '#FFF6DE'}), T < EV.strike + 0.12 ? [{pos: add3(STRIKE_PLATE, {x: 0.4, y: 0.2, z: 0}), color: '#FFE9C0', power: 1.6, radius: 7}] : []));
    out.push(fx(ring3({at: STRIKE_PLATE, normal: {x: 1, y: 0.1, z: 0}, t: T, t0: EV.strike, key: 'd4strr', r0: 0.15, speed: 9, dur: 0.2, width: 0.07})));
    out.push(fx([], [], shakeAt(T, EV.strike, 0.2, 5)));
    // the slab: his back slams into it — concrete dust and grit off its face
    const back = {x: SLAM.x - 0.25, y: G(SLAM.x, SLAM.z) + 1.1, z: SLAM.z - 0.05};
    out.push(impact({at: back, normal: {x: 0.85, y: 0.3, z: 0.4}, t: T, t0: EV.slam, key: 'd4slam', strength: 0.9, material: 'concrete', ground: ground(back), seed: 211}));
    out.push(fx([], [], shakeAt(T, EV.slam, 0.07)));
    // his feet scrape in front of the slab as they come down
    out.push(bodyDust(T, {x: SLAM.x + 0.15, y: 0, z: SLAM.z}, EV.slam + 0.03, 'd4slf', 213, 0.8));
  }
  // ---- D4-9 the slide down the slab: grit trickles, a puff as he sits
  if (T > EV.slide && T < EV.slideEnd + 2.5) {
    const top = {x: SLAM.x - 0.3, y: G(SLAM.x, SLAM.z) + 1.0, z: SLAM.z};
    out.push(fx(chips3({at: top, t: T, t0: EV.slide + 0.1, key: 'd4sl1', n: 6, dir: {x: 0.3, y: -0.2, z: 0}, spread: 40, speed: [0.3, 1], size: [0.015, 0.04], material: 'concrete', ground: ground(top), seed: 221})));
    out.push(bodyDust(T, {x: 6.75, y: 0, z: 3.55}, EV.slideEnd - 0.15, 'd4sit', 223, 0.9));
  }
  return combine(...(out.filter(Boolean) as FxOut[]));
};

// ------------------------------------------------------------------ the cut cable
import {prep, box, merge} from '../../engine/mesh';
let LM: ReturnType<typeof prep> | null = null;
const launcherMesh = () => (LM ??= prep(merge(box({x: -0.16, y: 0, z: -0.045}, {x: 0.2, y: 0.085, z: 0.045}, 'm_dark'), box({x: -0.06, y: 0.03, z: -0.048}, {x: 0.05, y: 0.06, z: 0.048}, 'taxi'))));
const cableFx = (T: number): FxOut => {
  if (T < EV.cablePull || T > 260) return fx();
  const items: Item[] = [];
  const ln = (a: V3, b: V3, sag: number, key: string) => items.push(cable(a, b, sag, CABLE_C, 0.02, key, true, 8));
  if (T < EV.cableThrow) {
    const p = crewAt('tether', T).pts!;
    const hl = p.handL, hr = p.handR;
    if (!hl || !hr) return fx();
    if (T < EV.cablePullEnd) ln(p.reel, hl, 0.1, 'd4cb_reel');
    if (T > EV.cablePull + 0.35) ln(hl, hr, 0.32, 'd4cb_loop');
    ln(hr, add3(hr, {x: 0.04, y: -0.5, z: 0.06}), 0.04, 'd4cb_end');
    return fx(items);
  }
  const W3 = unitD4('W3', T);
  const wrap = wrapPoints(W3);
  if (T < EV.cableWrap) {
    // the loop flies from her right hand to its shins
    const p = crewAt('tether', T).pts!;
    const from = crewAt('tether', EV.cableThrow).pts!.handR ?? wrap[0];
    const u = clamp((T - EV.cableThrow) / (EV.cableWrap - EV.cableThrow));
    const end = add3(lerpV(from, wrap[0], u), {x: 0, y: 0.4 * Math.sin(Math.PI * u), z: 0});
    if (p.handL) ln(p.handL, end, 0.25 * (1 - u) + 0.05, 'd4cb_fly');
    return fx(items);
  }
  // wound round: revealed as it whips round the shins (164.78 → 164.9), then taut to her hands while she hauls
  const n = Math.max(2, Math.round(wrap.length * clamp((T - EV.cableWrap) / 0.12)));
  items.push(...polyCable(wrap.slice(0, n), 'd4cb_wrap'));
  if (T < 165.45) {
    const p = crewAt('tether', T).pts!;
    const hand = p.handL ?? p.handR;
    if (hand) ln(wrap[n - 1], hand, T > EV.cableHaul ? 0.01 : 0.12, 'd4cb_haul');
  } else {
    // let go: the free end drops and lies on the ground
    const d = clamp((T - 165.45) / 0.4);
    const le = looseEnd(wrap[wrap.length - 1]);
    const hand0 = crewAt('tether', 165.44).pts!.handL ?? le[le.length - 1];
    const lifted = le.map((q, i) => lerpV(lerpV(wrap[wrap.length - 1], hand0, i / (le.length - 1)), q, smooth(d)));
    items.push(...polyCable(lifted, 'd4cb_loose'));
  }
  return fx(items);
};
void [sub3, mul3, norm3, PLANT];
