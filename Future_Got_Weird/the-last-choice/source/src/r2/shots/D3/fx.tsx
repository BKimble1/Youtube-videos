// Section D3 FX at film time T: the flare into heavy 1's eye (and its burn on the crater floor), the blinding flash, the
// tether (fire → bite → wrap round post 3 → taut → cut by a drone's cutter → snap), the plate bangs, the ram's slam, the
// knee split, the topple (the crash, the dust wave rolling out, debris, the lingering dust the decoy needs), heavy 2's
// footfalls and its step over the wreck, the decoy's light figures and their flicker-out, the smashed tablet, the
// allied drone struck down, heavy 2's round and the blast on the rim. Everything is derived from the same choreography
// (crew.tsx, machines.ts), so every camera sees the same event at the same world point. Returns FxOut.
import React from 'react';
import {V3, add3, sub3, mul3, norm3, lerp, clamp, smooth, noise} from '../../../kit/math';
import {
  FxOut, fx, combine, impact, breakerHit, dust3, chips3, sparks3, flash3, ring3, tetherItems, decoyItems, allyDrone, blast, muzzle, shakeAt,
  optikFlash, smokeItems, smokeCanister, SmokeSource, puffsAt, Puff, f1, glowEl, gid, glowTone, tone, inkTone, inkPx,
} from '../../fx';
import {heavyAttach, unitAttach} from '../../mech';
import type {Item} from '../../engine';
import {project} from '../../engine';
import {G} from '../D4/motion';
import {footAt, KP} from '../D4/motion';
import {heavy1} from '../D2/machines';
import {canisters as d2Cans} from '../D2/fx';
import {allyPose as d2AllyPose} from '../D2/fx';
import {EV2, ANCHOR} from '../D2/machines';
import {EV3} from './times';
import {heavy1D3, heavy2D3, H2_FALLS, H1_LEGS, BLAST_AT, RAM2_AT, SMASH_AT, CUT_AT, h1ClampPt, allyPose3, ALLY_KILL_DIR, ALLY_CRASH_GROUND, ARC, arcUnit} from './machines';
import {crewFootfalls, tetherAt, directorAt, kneeTarget, FLARE_TO, flareFrom, decoyAt} from './crew';

const ground = (p: V3) => G(p.x, p.z);
const lerpV = (a: V3, b: V3, k: number): V3 => ({x: lerp(a.x, b.x, k), y: lerp(a.y, b.y, k), z: lerp(a.z, b.z, k)});

// ------------------------------------------------------------------ the flare: struck, thrown into the eye, dropped
let FLARE: {from: V3; to: V3} | null = null;
const flareGeo = () => (FLARE ??= {from: flareFrom(), to: FLARE_TO()});
/** the flare's position: in the air to the eye (a flat fast arc), then it drops off the heavy's face to the floor */
export const flarePos = (t: number): V3 => {
  const {from, to} = flareGeo();
  if (t < EV3.flareRel) return from;
  if (t < EV3.flash) {
    const u = (t - EV3.flareRel) / EV3.flareFlight;
    return {x: lerp(from.x, to.x, u), y: lerp(from.y, to.y, u) + 4 * 0.7 * u * (1 - u), z: lerp(from.z, to.z, u)};
  }
  // bounced back off the head, falling to the crater floor below, a short skid
  const a = t - EV3.flash, d = norm3({x: from.x - to.x, y: 0, z: from.z - to.z});
  const g0 = G(to.x + d.x * 1.2, to.z + d.z * 1.2);
  const tl = Math.sqrt(Math.max(0.05, 2 * (to.y - g0) / 9.81)) + 0.05;
  if (a < tl) return {x: to.x + d.x * 1.2 * (a / tl), y: Math.max(g0 + 0.03, to.y + 1.0 * a - 4.9 * a * a), z: to.z + d.z * 1.2 * (a / tl)};
  const s = Math.min(0.6, (a - tl) * 1.5);
  return {x: to.x + d.x * (1.2 + s), y: G(to.x + d.x * (1.2 + s), to.z + d.z * (1.2 + s)) + 0.03, z: to.z + d.z * (1.2 + s)};
};
const flareFx = (T: number): FxOut => {
  if (T < EV3.flareRel || T > EV3.flareStrike + 25) return fx();
  const p = flarePos(T), tip = add3(p, {x: 0, y: 0.04, z: 0});
  const b = clamp((T - EV3.flareStrike) / 0.15) * (0.82 + 0.18 * noise(T * 13, 7));
  const items: Item[] = [
    {kind: 'sprite', pos: p, key: 'd3flare_stick', draw: (c) => {
      const L = 0.3 * c.k, R = 0.022 * c.k;
      if (L < 2) return null;
      const rot = T < EV3.flash ? (T - EV3.flareRel) * 900 : 12;
      return (
        <g transform={`translate(${f1(c.x)} ${f1(c.y - R)}) rotate(${f1(rot)})`}>
          <rect x={f1(-L / 2)} y={f1(-R)} width={f1(L)} height={f1(2 * R)} rx={f1(R)} fill={tone(c, '#C9302C')} stroke={inkTone(c)} strokeWidth={f1(inkPx(c, 0.008, 0.5, 1.6))} />
          <rect x={f1(-L / 2)} y={f1(-R)} width={f1(L * 0.18)} height={f1(2 * R)} fill={tone(c, '#E8E0D0')} />
        </g>
      );
    }},
    {kind: 'sprite', pos: tip, key: 'd3flare_glow', bias: 0.1, draw: (c) => (
      <g>
        {glowEl(gid('d3flare', 'halo'), c.x, c.y, Math.max(10, 2.2 * c.k) * (0.9 + 0.2 * b), glowTone(c, '#FF4A3A', 0.35), 0.45 * b, 0)}
        {glowEl(gid('d3flare', 'core'), c.x, c.y, Math.max(3, 0.35 * c.k), glowTone(c, '#FFF2EA', 0.2), b, 0.35)}
      </g>
    )},
  ];
  const trail: SmokeSource = {pos: (te) => add3(flarePos(te), {x: 0, y: 0.06, z: 0}), start: EV3.flash + 0.6, end: EV3.flareStrike + 25, rate: 4, life: 2.4, up: 0.9, size: 0.06, grow: 0.28, color: '#C9ABA4', opacity: 0.42, seed: 913};
  return combine(
    fx(items, [{pos: add3(tip, {x: 0, y: 0.3, z: 0}), color: '#FF5A40', power: 1.2 * b, radius: 12, flicker: 0.3, seed: 7}]),
    fx(sparks3({at: tip, t: T, t0: EV3.flareRel, t1: EV3.flareStrike + 25, rate: 26, key: 'd3flare_f', n: 0, dir: {x: 0, y: 1, z: 0}, spread: 40, speed: [0.8, 2.6], life: [0.15, 0.45], width: 0.012, flash: 0, seed: 15})),
    fx(smokeItems(T, [trail], 'd3flare_tr')),
  );
};

/** sprites whose key matches `re`, drawn at `k` × their opacity (smoke thinning) */
export const fadeItems = (items: Item[], k: number, re: RegExp): Item[] => {
  if (k >= 0.999) return items;
  return items.flatMap((it): Item[] => {
    if (it.kind !== 'sprite' || !it.key || !re.test(it.key)) return [it];
    if (k <= 0.01) return [];
    const draw = it.draw;
    return [{...it, draw: (c) => { const el = draw(c); return el ? <g opacity={f1(k)}>{el}</g> : el; }}];
  });
};

// ------------------------------------------------------------------ the crash's dust (low, lingering): the decoy's screen
let DUST: SmokeSource[] | null = null;
export const dustSources = (): SmokeSource[] => (DUST ??= [
  {pos: {x: 61.4, y: G(61.4, -3.6) + 0.3, z: -3.6}, start: EV3.land, end: EV3.land + 5.5, rate: 6, life: 7.5, up: 0.32, spread: 3.2, jet: {x: -1.9, y: 0.9, z: 1.2}, jetSpread: 1.2, size: 0.85, grow: 0.95, wind: {x: 0.08, y: 0, z: -0.04}, color: '#B9AD9E', opacity: 0.56, seed: 31},
  {pos: {x: 64.6, y: G(64.6, -5.6) + 0.3, z: -5.6}, start: EV3.land + 0.05, end: EV3.land + 4.5, rate: 4, life: 7, up: 0.4, spread: 2.6, jet: {x: 0.6, y: 1.2, z: -0.6}, jetSpread: 1.4, size: 0.85, grow: 0.9, wind: {x: 0.1, y: 0, z: -0.06}, color: '#B4A897', opacity: 0.52, seed: 37},
  {pos: {x: 57.6, y: G(57.6, -0.8) + 0.3, z: -0.8}, start: EV3.land + 0.35, end: EV3.land + 6.5, rate: 4.5, life: 11, up: 0.26, spread: 2.4, jet: {x: -0.8, y: 0.5, z: 0.6}, jetSpread: 1.2, size: 0.95, grow: 1.0, wind: {x: 0.05, y: 0, z: -0.03}, color: '#BDB2A3', opacity: 0.6, seed: 41},
]);
let puffT = NaN, puffs: Puff[] = [];
const puffsNow = (T: number) => {
  if (T !== puffT) { puffT = T; puffs = dustSources().flatMap((s) => puffsAt(s, T)); }
  return puffs;
};
export const dustAt = (p: V3, T: number): number => {
  let d = 0;
  for (const q of puffsNow(T)) {
    const dx = p.x - q.c.x, dy = p.y - q.c.y, dz = p.z - q.c.z;
    const k = (dx * dx + dy * dy + dz * dz) / (q.r * q.r);
    if (k < 2.5) d += q.o * Math.exp(-k * 2.4) * 0.9;
  }
  return 1 - Math.exp(-d * 1.4);
};

// ------------------------------------------------------------------ the decoy (D3-7): the light figures on the dust
export const DECOY3 = {center: {x: 56.2, y: G(56.2, -0.6) + 3.0, z: -0.6} as V3, walkHeading: 158, height: 5.6, spacing: 2.4, walkSpeed: 0.4, seed: 6};
const LENS = (T: number): V3 => {
  void T;
  return {x: SMASH_AT.x + 0.02, y: SMASH_AT.y + 0.14, z: SMASH_AT.z};
};

// ------------------------------------------------------------------ footfalls of the two heavies (dust, shake)
const legFalls = (legs: KP[][], Ta: number, Tb: number) => {
  const out: {t: number; pos: V3; leg: number}[] = [];
  legs.forEach((k, leg) => k.forEach((kk, j) => {
    if (j === 0) return;
    const prev = k[j - 1];
    if (Math.hypot(kk[1] - prev[1], kk[2] - prev[2]) < 0.05) return;
    if (kk[0] > Ta && kk[0] <= Tb) out.push({t: kk[0], pos: {x: kk[1], y: G(kk[1], kk[2]), z: kk[2]}, leg});
  }));
  return out;
};
/** heavy 1's footfalls: D2's walk until its halt, then its keyed steps (the swing round) */
export const h1Falls = (T: number, win = 1.5): {t: number; pos: V3; key: string}[] => {
  const out: {t: number; pos: V3; key: string}[] = [];
  const a = T - win;
  if (a < 121.05) {
    const dist = (t: number) => heavy1(t).gait!.dist;
    const lo0 = Math.max(116.0, a), hi0 = Math.min(T, 121.0);
    if (hi0 > lo0) {
      const d0 = dist(lo0), d1 = dist(hi0), stride = 3.0;
      [0.0, 0.5, 0.75, 0.25].forEach((ph, leg) => {
        for (let k = Math.ceil(d0 / stride + ph); (k - ph) * stride <= d1 && k < 1e4; k++) {
          const dk = (k - ph) * stride;
          let lo = lo0, hi = hi0;
          for (let i = 0; i < 16; i++) { const m = (lo + hi) / 2; if (dist(m) < dk) lo = m; else hi = m; }
          out.push({t: hi, pos: heavyAttach(heavy1(hi + 0.02)).feet[leg], key: `h1w${leg}_${k}`});
        }
      });
    }
  }
  if (T > 121.0 && a < 124.0) legFalls(H1_LEGS, Math.max(121.0, a), Math.min(T, 124.0)).forEach((f) => out.push({t: f.t, pos: f.pos, key: `h1k${f.leg}_${Math.round(f.t * 100)}`}));
  return out;
};
let H1F: Map<number, {t: number; pos: V3; key: string}[]> = new Map();
const h1FallsCached = (T: number) => {
  const k = Math.round(T * 30);
  let v = H1F.get(k);
  if (!v) { if (H1F.size > 64) H1F = new Map(); v = h1Falls(T); H1F.set(k, v); }
  return v;
};

// ------------------------------------------------------------------ the tether (D3-2 … D3-8)
const tetherFx = (T: number): FxOut => {
  if (T < EV3.tFire) return fx();
  const muz = (t: number) => tetherAt(t).pts?.muzzle ?? add3(tetherAt(t).body.pos, {x: 0, y: 1.25, z: 0});
  const target = (t: number) => h1ClampPt(t);
  // the cut: where along the cable (muzzle → post → clamp) the cutter goes through
  const M0 = muz(EV3.cut), C0 = target(EV3.cut);
  const L1 = Math.hypot(ANCHOR.x - M0.x, ANCHOR.y - M0.y, ANCHOR.z - M0.z), L2 = Math.hypot(C0.x - ANCHOR.x, C0.y - ANCHOR.y, C0.z - ANCHOR.z);
  const Lc = Math.hypot(CUT_AT.x - ANCHOR.x, CUT_AT.y - ANCHOR.y, CUT_AT.z - ANCHOR.z);
  const snapU = (L1 + Lc) / (L1 + L2);
  return tetherItems({key: 'd3teth', t: T, muzzle: muz, target, fireAt: EV3.tFire, flight: EV3.tBite - EV3.tFire, anchor: ANCHOR, wrapAt: EV3.wrap, anchorR: 0.21, tautAt: EV3.taut, snapAt: EV3.cut, snapU, reelAt: EV3.cut + 0.35, slackLen: 17, seed: 19, cableR: 0.03});
};

// ------------------------------------------------------------------ the round's streak (launcher → rim)
const roundFx = (T: number): FxOut => {
  if (T < EV3.fire || T >= EV3.blast) return fx();
  const mz = heavyAttach(heavy2D3(EV3.fire)).muzzle;
  const u = (T - EV3.fire) / (EV3.blast - EV3.fire);
  const head = lerpV(mz, BLAST_AT, u), tail = lerpV(mz, BLAST_AT, Math.max(0, u - 0.35));
  return fx([{
    kind: 'sprite', pos: head, key: 'd3round', bias: 0.2,
    draw: (c) => {
      const a = project(c.view, head), b = project(c.view, tail);
      if (a.z < c.view.near || b.z < c.view.near) return null;
      return <g>{glowEl(gid('d3rnd'), a.x, a.y, Math.max(5, 0.4 * a.k), glowTone(c, '#FFD9A0', 0.2), 0.9, 0.3)}<line x1={f1(b.x)} y1={f1(b.y)} x2={f1(a.x)} y2={f1(a.y)} stroke={glowTone(c, '#FFF1D6', 0.2)} strokeWidth={f1(Math.max(1.5, 0.06 * a.k))} strokeLinecap="round" opacity={0.85} /></g>;
    },
  }], [{pos: head, color: '#FFD9A0', power: 0.8, radius: 6}]);
};

/** the allied drone's options (D2's shield hit kept: its wisp and the damage continue) */
export const allyOpts3 = (T: number) => ({
  key: 'd2ally', t: T, seed: 3, ground: ALLY_CRASH_GROUND,
  pose: (t: number) => (t <= 116.92 ? d2AllyPose(t) : allyPose3(t)),
  hits: [{at: EV2.shield, dir: norm3({x: -0.8, y: -0.25, z: -0.45}), strength: 1.4}],
  destroyAt: EV3.kill, destroyDir: ALLY_KILL_DIR,
});

export const d3Fx = (T: number): FxOut => {
  const out: (FxOut | null)[] = [];
  // ---- running feet kick dust
  crewFootfalls(T, 1.0).forEach((f, i) => {
    const k = clamp(f.speed / 5);
    if (k < 0.25) return;
    out.push(fx(dust3({at: {...f.pos, y: f.pos.y + 0.03}, t: T, t0: f.t, key: `d3ff_${f.key}`, n: 2, size: 0.05, grow: 0.22 * k, speed: 0.5, life: 1.0, dir: {x: -0.4, y: 1, z: 0}, spread: 60, rise: 0.25, color: '#8E857C', opacity: 0.45 * k, seed: 300 + i})));
  });
  // ---- the D2 canisters' smoke: the wind takes it (thin by the flash, gone by ~123.5)
  if (T < 124.0) {
    const k = (1 - 0.8 * smooth((T - 116.95) / 1.5)) * (1 - smooth((T - 120.5) / 2.5));
    d2Cans().forEach((c) => { if (T >= c.t0) { const f = smokeCanister(c, T); out.push({...f, items: fadeItems(f.items, k, /_sm_/)}); } });
  }
  // ---- heavy 1: footfalls; the flare and the flash; the ram's slam; the knee; the crash
  h1FallsCached(T).forEach((f, i) => out.push(
    fx(dust3({at: {...f.pos, y: ground(f.pos) + 0.05}, t: T, t0: f.t, key: `d3h1f_${f.key}`, ring: 0.3, n: 6, speed: 0.9, size: 0.18, grow: 0.4, life: 1.5, rise: 0.2, color: '#8A8078', opacity: 0.5, seed: 900 + i})),
    fx([], [], shakeAt(T, f.t, 0.014)),
  ));
  out.push(flareFx(T));
  if (T > EV3.flash - 0.05 && T < EV3.flash + 1.6) {
    const eye = heavyAttach(heavy1D3(T)).eye;
    out.push(optikFlash({eye, t: T, at: EV3.flash, key: 'd3blind', strength: 1.5}));
    out.push(fx([], T < EV3.flash + 0.25 ? [{pos: eye, color: '#FFF4F0', power: 2.4 * (1 - (T - EV3.flash) / 0.25), radius: 9}] : []));
    out.push(fx(sparks3({at: eye, t: T, t0: EV3.flash, key: 'd3blindsp', n: 18, dir: {x: -0.8, y: 0.3, z: 0.3}, spread: 90, speed: [1.5, 5], ground: ground(eye) - 2, seed: 51, flash: 0.4})));
  }
  // the plate bangs (a ring off the plate), the ram's slam short of the Director
  [EV3.bang1, EV3.bang2].forEach((t0, i) => {
    if (T < t0 - 0.05 || T > t0 + 0.4) return;
    const p = directorAt(t0).pts?.bang ?? directorAt(t0).pts!.plate;
    out.push(fx(ring3({at: p, normal: {x: 1, y: 0.1, z: -0.2}, t: T, t0, key: `d3bang${i}`, r0: 0.08, speed: 3.5, dur: 0.14, width: 0.03})));
  });
  if (T > EV3.ram2 - 0.1 && T < EV3.ram2 + 3) {
    out.push(impact({at: RAM2_AT, normal: {x: -0.3, y: 1, z: -0.2}, t: T, t0: EV3.ram2, key: 'd3ram2', strength: 1.8, material: 'asphalt', ground: ground(RAM2_AT), seed: 61}));
    out.push(fx(dust3({at: {...RAM2_AT, y: ground(RAM2_AT) + 0.05}, t: T, t0: EV3.ram2, key: 'd3ram2d', ring: 0.4, n: 10, speed: 2.4, size: 0.24, grow: 0.6, life: 2.2, rise: 0.4, color: '#958A80', opacity: 0.7, seed: 62})));
    out.push(fx(chips3({at: RAM2_AT, t: T, t0: EV3.ram2, key: 'd3ram2c', n: 16, dir: {x: -0.6, y: 0.8, z: -0.3}, spread: 65, speed: [2, 7], size: [0.03, 0.1], material: 'asphalt', ground: ground(RAM2_AT), seed: 63})));
    out.push(fx([], [], shakeAt(T, EV3.ram2, 0.16, 5)));
  }
  if (T > EV3.knee - 0.1 && T < EV3.knee + 3) {
    const k = kneeTarget();
    out.push(breakerHit({at: k, dir: {x: 0.0, y: 0.3, z: -0.95}, t: T, t0: EV3.knee, key: 'd3knee', ground: ground(k), seed: 71, strength: 1.6}));
    out.push(fx(flash3({at: k, t: T, t0: EV3.knee, key: 'd3kneefl', r: 0.8, dur: 0.14, color: '#FFE6B8'})));
    out.push(fx(sparks3({at: k, t: T, t0: EV3.knee, key: 'd3kneesp', n: 40, dir: {x: 0, y: 0.5, z: 0.8}, spread: 80, speed: [2, 9], ground: ground(k), seed: 72, flash: 0.5})));
    out.push(fx([], [], shakeAt(T, EV3.knee, 0.12, 6)));
  }
  // the crash (the biggest of the film): the hull lands, a dust wave rolls out, debris rains, the ground shakes
  if (T > EV3.land - 0.1 && T < EV3.land + 6) {
    const w = heavyAttach(heavy1D3(EV3.land + 0.05)).hull;
    const g0 = {x: w.x, y: G(w.x, w.z) + 0.1, z: w.z};
    out.push(fx(dust3({at: g0, t: T, t0: EV3.land, key: 'd3wave', ring: 2.6, n: 26, speed: 6.5, size: 0.7, grow: 1.8, life: 4.2, rise: 0.7, color: '#9C9087', opacity: 0.88, seed: 81})));
    out.push(fx(dust3({at: g0, t: T, t0: EV3.land + 0.08, key: 'd3wave2', ring: 1.6, n: 18, speed: 3.6, size: 0.9, grow: 1.6, life: 5.0, rise: 1.1, color: '#A99D90', opacity: 0.8, seed: 82})));
    out.push(fx(chips3({at: add3(g0, {x: 0, y: 0.4, z: 0}), t: T, t0: EV3.land, key: 'd3crch', n: 34, dir: {x: 0, y: 1, z: 0}, spread: 80, speed: [3, 10], size: [0.06, 0.24], material: 'asphalt', ground: g0.y, life: 6, seed: 83})));
    out.push(fx(chips3({at: add3(g0, {x: -1.0, y: 0.8, z: 0.8}), t: T, t0: EV3.land + 0.05, key: 'd3crmet', n: 14, dir: {x: -0.4, y: 0.9, z: 0.4}, spread: 70, speed: [3, 8], size: [0.05, 0.16], material: 'metal', ground: g0.y, life: 6, seed: 84})));
    out.push(fx(sparks3({at: add3(g0, {x: -0.8, y: 0.6, z: 0.6}), t: T, t0: EV3.land, key: 'd3crsp', n: 50, dir: {x: -0.5, y: 0.7, z: 0.5}, spread: 90, speed: [3, 11], ground: g0.y, seed: 85, flash: 0.6})));
    out.push(fx(ring3({at: add3(g0, {x: 0, y: 0.1, z: 0}), normal: {x: 0, y: 1, z: 0}, t: T, t0: EV3.land, key: 'd3crshock', r0: 2.0, speed: 22, dur: 0.3, width: 0.12})));
    out.push(fx([], T < EV3.land + 0.15 ? [{pos: add3(g0, {x: 0, y: 1.5, z: 0}), color: '#FFD9A0', power: 1.0, radius: 9}] : [], shakeAt(T, EV3.land, 0.42, 3.2)));
    // debris rain: grit falling back across the slope
    for (let i = 0; i < 5; i++) out.push(fx(chips3({at: {x: g0.x - 3 + i * 1.6, y: g0.y + 5.5 + (i % 2), z: g0.z + 1 - i * 0.8}, t: T, t0: EV3.land + 0.6 + i * 0.12, key: `d3rain${i}`, n: 6, dir: {x: 0, y: -1, z: 0}, spread: 35, speed: [0.5, 1.6], size: [0.02, 0.06], material: 'concrete', ground: G(g0.x - 3 + i * 1.6, g0.z + 1 - i * 0.8), life: 3, seed: 90 + i})));
  }
  if (T > EV3.land - 0.1) out.push(fx(smokeItems(T, dustSources(), 'd3dust')));
  // ---- the tether
  out.push(tetherFx(T));
  // the cutter goes through the cable: sparks off the arm
  if (T > EV3.cut - 0.4 && T < EV3.cut + 1.2) out.push(fx(sparks3({at: CUT_AT, t: T, t0: EV3.cut - 0.12, t1: EV3.cut + 0.02, rate: 90, key: 'd3cutsp', n: 0, dir: {x: 0, y: 0.4, z: 0.6}, spread: 70, speed: [1.5, 4], life: [0.1, 0.3], flash: 0, seed: 101})));
  // ---- the decoy again: the figures on the crash's dust; the tablet smashed: they flicker out
  out.push(decoyItems({
    key: 'd3dec', t: T, projector: LENS, center: DECOY3.center, walkHeading: DECOY3.walkHeading, height: DECOY3.height, spacing: DECOY3.spacing,
    walkSpeed: DECOY3.walkSpeed, on: EV3.projOn, off: EV3.projOff, density: dustAt, seed: DECOY3.seed, surface: 3.0,
  }));
  if (T > EV3.projOn - 0.05 && T < EV3.projOn + 0.3) out.push(fx(flash3({at: LENS(T), t: T, t0: EV3.projOn, key: 'd3click', r: 0.22, dur: 0.12, color: '#FFF6D8'})));
  if (T > EV3.smash - 0.05 && T < EV3.smash + 3) {
    out.push(impact({at: SMASH_AT, normal: {x: -0.6, y: 0.6, z: -0.4}, t: T, t0: EV3.smash, key: 'd3smash', strength: 1.1, material: 'metal', ground: ground(SMASH_AT), seed: 111}));
    out.push(fx(chips3({at: SMASH_AT, t: T, t0: EV3.smash, key: 'd3smashg', n: 18, dir: {x: -0.5, y: 0.7, z: -0.3}, spread: 80, speed: [1.5, 5], size: [0.012, 0.04], material: 'glass', ground: ground(SMASH_AT), seed: 112})));
    out.push(fx(chips3({at: SMASH_AT, t: T, t0: EV3.smash + 0.01, key: 'd3smashp', n: 6, dir: {x: -0.3, y: 0.8, z: 0.4}, spread: 60, speed: [1.5, 4], size: [0.03, 0.07], material: 'plate', ground: ground(SMASH_AT), seed: 113})));
    out.push(fx(flash3({at: SMASH_AT, t: T, t0: EV3.smash, key: 'd3smashfl', r: 0.5, dur: 0.12, color: '#DDF6FF'})));
    out.push(fx([], [], shakeAt(T, EV3.smash, 0.05)));
  }
  // ---- the allied drone: hunted, struck, down smoking
  out.push(allyDrone(allyOpts3(T)));
  if (T > EV3.kill - 0.05 && T < EV3.kill + 1.5) out.push(impact({at: allyPose3(EV3.kill).pos, normal: {x: 0.5, y: 0.4, z: -0.6}, t: T, t0: EV3.kill, key: 'd3kill', strength: 1.0, material: 'metal', seed: 121}));
  // ---- heavy 2: its footfalls (the step over the wreck lands hard), the launcher, the round, the blast
  H2_FALLS.forEach((f) => {
    if (T < f.t - 0.05 || T > f.t + 2.0) return;
    const big = f.over ? 1 : 0;
    out.push(fx(dust3({at: {...f.pos, y: ground(f.pos) + 0.05}, t: T, t0: f.t, key: `d3h2f_${f.leg}_${Math.round(f.t * 100)}`, ring: 0.35, n: 6 + 6 * big, speed: 1.0 + big, size: 0.2, grow: 0.45, life: 1.7, rise: 0.25, color: '#8A8078', opacity: 0.55, seed: 700 + Math.round(f.t * 10)})));
    out.push(fx([], [], shakeAt(T, f.t, 0.016 + 0.05 * big)));
  });
  if (T > EV3.fire - 0.1 && T < EV3.blast + 12) {
    const mz = heavyAttach(heavy2D3(EV3.fire)).muzzle;
    out.push(muzzle({at: mz, dir: norm3(sub3(BLAST_AT, mz)), t: T, t0: EV3.fire, key: 'd3h2mz', size: 1.0}));
    out.push(roundFx(T));
    out.push(blastFx(T));
  }
  return combine(...(out.filter(Boolean) as FxOut[]));
};

/** the round bursts on the rim crest (also registered in persist.ts for what follows) */
export const blastFx = (T: number): FxOut => {
  if (T < EV3.blast) return fx();
  return combine(
    blast({at: BLAST_AT, t: T, t0: EV3.blast, key: 'd3blast', size: 2.5, groundH: G, ground: G(BLAST_AT.x, BLAST_AT.z), seed: 131, debris: 'concrete', dir: {x: -0.6, y: 0.8, z: 0}}),
    // a chunk of the rim flies west at the flare carrier (it opens his brow)
    fx(chips3({at: add3(BLAST_AT, {x: -0.4, y: 0.3, z: 0.6}), t: T, t0: EV3.blast + 0.01, key: 'd3blch', n: 10, dir: {x: -0.85, y: 0.35, z: 0.45}, spread: 30, speed: [7, 13], size: [0.05, 0.16], material: 'concrete', ground: 0, life: 4, seed: 132})),
  );
};
void [smooth, unitAttach, ARC, arcUnit, footAt, decoyAt, tone, mul3];
