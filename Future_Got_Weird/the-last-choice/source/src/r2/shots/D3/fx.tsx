// Section D3 FX at film time T. THE STRONGEST ATTACK: the flare into heavy 1's eye (and its burn on the crater
// floor), the blinding flash; the tether (fire → bite → wrap round post 3 → taut → the yank it holds → cut by a drone's
// cutter → snap); U8's hammer on the Director's plate (a heavy block: the plate rings, his heels skid), the press
// (the plate scraping), his plate driven into its back (a hard impact), the runner's adze on its ankle, U8 hitting the
// ground; the knee split (a mechanical failure: the piston flash, the joint's spray); R4's hammer on the water main
// over the breaker's head (a hard impact on the beam); the topple (the crash, the dust wave, debris, the lingering
// dust). THE ADAPTATION: the decoy's light figures on the crash's dust (human-sized, as D2's) and their flicker-out,
// the smashed tablet, the cutter's sparks, the allied drone struck down. ESCALATION: heavy 2's footfalls — on the
// wreck's top a metal crunch — the launcher, the round, the blast on the rim. Everything is derived from the same
// choreography (crew.tsx, machines.ts), so every camera sees the same event at the same world point.
import React from 'react';
import {V3, add3, sub3, mul3, norm3, lerp, clamp, smooth, noise} from '../../../kit/math';
import {
  FxOut, fx, combine, impact, breakerHit, plateHit, dust3, chips3, sparks3, flash3, ring3, tetherItems, decoyItems, allyDrone, blast, muzzle, shakeAt,
  optikFlash, smokeItems, smokeCanister, SmokeSource, puffsAt, Puff, f1, glowEl, gid, glowTone, tone, inkTone, inkPx,
} from '../../fx';
import {heavyAttach, unitAttach} from '../../mech';
import type {Item} from '../../engine';
import {project} from '../../engine';
import {G, KP, fwdOf} from '../D4/motion';
import {heavy1} from '../D2/machines';
import {canisters as d2Cans} from '../D2/fx';
import {allyPose as d2AllyPose} from '../D2/fx';
import {EV2, ANCHOR} from '../D2/machines';
import {EV3} from './times';
import {dirPlate} from './marks';
import {heavy1D3, heavy2D3, H2_FALLS, H1_LEGS, BLAST_AT, SMASH_AT, CUT_AT, h1ClampPt, allyPose3, ALLY_KILL_DIR, ALLY_CRASH_GROUND, escort, PIPE_HIT} from './machines';
import {crewFootfalls, tetherAt, directorAt, kneeTarget, FLARE_TO, flareFrom} from './crew';

const ground = (p: V3) => G(p.x, p.z);
const lerpV = (a: V3, b: V3, k: number): V3 => ({x: lerp(a.x, b.x, k), y: lerp(a.y, b.y, k), z: lerp(a.z, b.z, k)});
const near = (T: number, t0: number, a = 0.1, b = 3) => T > t0 - a && T < t0 + b;

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
// The wave rolls out west from the wreck's south-west side and settles on the crater's west slope, where the arc comes
// up toward the Crew (the decoy's figures stand in it at DECOY_FAIL); D2's breeze (south-east) carries it off the rim.
let DUST: SmokeSource[] | null = null;
export const dustSources = (): SmokeSource[] => (DUST ??= [
  {pos: {x: 61.0, y: G(61.0, -3.2) + 0.3, z: -3.2}, start: EV3.land, end: EV3.land + 4.5, rate: 6, life: 7.0, up: 0.3, spread: 3.0, jet: {x: -1.6, y: 0.9, z: 0.8}, jetSpread: 1.2, size: 0.85, grow: 0.55, wind: {x: 0.16, y: 0, z: 0.12}, color: '#B9AD9E', opacity: 0.56, seed: 31},
  {pos: {x: 64.2, y: G(64.2, -6.6) + 0.3, z: -6.6}, start: EV3.land + 0.05, end: EV3.land + 3.5, rate: 4, life: 6.5, up: 0.4, spread: 2.6, jet: {x: 0.6, y: 1.2, z: -0.6}, jetSpread: 1.4, size: 0.85, grow: 0.55, wind: {x: 0.12, y: 0, z: 0.08}, color: '#B4A897', opacity: 0.5, seed: 37},
  {pos: {x: 57.4, y: G(57.4, -1.2) + 0.3, z: -1.2}, start: EV3.land + 0.3, end: EV3.land + 7.0, rate: 4.5, life: 10, up: 0.24, spread: 2.4, jet: {x: -0.9, y: 0.4, z: 0.6}, jetSpread: 1.2, size: 0.95, grow: 0.7, wind: {x: 0.12, y: 0, z: 0.1}, color: '#BDB2A3', opacity: 0.58, seed: 41},
  // the dust settled on the west slope: thin, low, long-lived (the screen at 135)
  {pos: {x: 54.0, y: G(54.0, 0.8) + 1.0, z: 0.8}, start: EV3.land + 1.2, end: EV3.projOff + 0.5, rate: 5, life: 9, up: 0.1, spread: 2.6, jet: {x: -0.3, y: 0.25, z: 0.2}, jetSpread: 1.0, size: 1.0, grow: 0.65, wind: {x: 0.05, y: 0, z: 0.04}, color: '#C1B6A7', opacity: 0.58, seed: 43},
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

// ------------------------------------------------------------------ the decoy (DECOY_FAIL): the light figures on the dust
/** human-sized like D2's (the same trick, tried again): in the dust on the west slope, walking at the arc */
export const DECOY3 = {center: {x: 53.8, y: G(53.8, 0.8) + 1.45, z: 0.8} as V3, walkHeading: 112, height: 2.9, spacing: 1.7, walkSpeed: 0.3, seed: 6};
const LENS = (): V3 => ({x: SMASH_AT.x + 0.02, y: SMASH_AT.y + 0.14, z: SMASH_AT.z});

// ------------------------------------------------------------------ footfalls of heavy 1 (dust, shake)
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
/** heavy 1's footfalls: D2's walk until its halt, then its keyed steps (the swing round, the yank on the pin) */
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
  if (T > 121.0 && a < 124.4) legFalls(H1_LEGS, Math.max(121.0, a), Math.min(T, 124.4)).forEach((f) => out.push({t: f.t, pos: f.pos, key: `h1k${f.leg}_${Math.round(f.t * 100)}`}));
  return out;
};
let H1F: Map<number, {t: number; pos: V3; key: string}[]> = new Map();
const h1FallsCached = (T: number) => {
  const k = Math.round(T * 30);
  let v = H1F.get(k);
  if (!v) { if (H1F.size > 64) H1F = new Map(); v = h1Falls(T); H1F.set(k, v); }
  return v;
};

// ------------------------------------------------------------------ the tether
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

// ------------------------------------------------------------------ the knee fight's contact points (fixed per event)
let KF: {ham: V3; hamN: V3; bash: V3; bashN: V3; hook: V3; heels: V3[]; u8Down: {t: number; at: V3}} | null = null;
const kneeFight = () => {
  if (KF) return KF;
  const ham = dirPlate(EV3.e1Ham), u8h = unitAttach(escort('U8', EV3.e1Ham)).chest;
  const hamN = norm3({x: u8h.x - ham.x, y: 0.5, z: u8h.z - ham.z});
  const ub = unitAttach(escort('U8', EV3.bash)), f = fwdOf(directorAt(EV3.bash).body.heading);
  const bash = {x: ub.chest.x - f.x * 0.32, y: ub.chest.y - 0.1, z: ub.chest.z - f.z * 0.32};
  const d = directorAt(EV3.e1Ham + 0.06).spec.world ?? {};
  const heels = [d.footL, d.footR].filter(Boolean) as V3[];
  // U8 meets the ground: the first frame its chest is within 0.5 m of it after the fall
  let u8Down = {t: EV3.e1Fall + 0.6, at: ub.chest};
  for (let t = EV3.e1Fall; t < EV3.e1Fall + 1.5; t += 1 / 60) {
    const c = unitAttach(escort('U8', t)).chest;
    if (c.y - G(c.x, c.z) < 0.5) { u8Down = {t, at: {x: c.x, y: G(c.x, c.z) + 0.05, z: c.z}}; break; }
  }
  KF = {ham, hamN, bash, bashN: norm3({x: -f.x, y: 0.3, z: -f.z}), hook: unitAttach(escort('U8', EV3.hook)).footL, heels, u8Down};
  return KF;
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
  // ---- D2's canister smoke: as D2 leaves it at P3 (the cut is exact), the breeze thinning its tail by ~119.5
  if (T < 119.6) {
    const k = 1 - smooth((T - 117.0) / 2.5);
    d2Cans().forEach((c) => { if (T >= c.t0) { const f = smokeCanister(c, T); out.push({...f, items: fadeItems(f.items, k, /_sm_/)}); } });
  }
  // ---- heavy 1: footfalls; the flare and the flash
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
  // ---- the pin: the yank the cable holds (dust off post 3's foot, the clamp grinding on the shin)
  if (near(T, EV3.yank + 0.2, 0.1, 2)) {
    const t0 = EV3.yank + 0.2, base = {x: ANCHOR.x, y: G(ANCHOR.x, ANCHOR.z) + 0.1, z: ANCHOR.z};
    out.push(fx(dust3({at: base, t: T, t0, key: 'd3yankd', ring: 0.25, n: 7, speed: 1.2, size: 0.16, grow: 0.4, life: 1.6, rise: 0.4, color: '#968B80', opacity: 0.55, seed: 141})));
    out.push(fx(sparks3({at: h1ClampPt(t0), t: T, t0, key: 'd3yanksp', n: 14, dir: {x: 0, y: 0.6, z: 0.6}, spread: 70, speed: [1.5, 4.5], ground: ground(h1ClampPt(t0)), seed: 142, flash: 0.2})));
    out.push(fx([], [], shakeAt(T, t0, 0.03)));
  }
  // ---- the knee fight on the south-west slope
  if (T > EV3.e1Ham - 0.2 && T < EV3.e1Up + 1) {
    const K = kneeFight();
    // U8's hammer on the plate: a heavy block — the plate rings, his heels skid back
    if (near(T, EV3.e1Ham)) {
      out.push(plateHit({at: K.ham, normal: K.hamN, t: T, t0: EV3.e1Ham, key: 'd3ham', stage: 'dent', ground: ground(K.ham), seed: 151}));
      K.heels.forEach((h, i) => out.push(fx(dust3({at: {...h, y: ground(h) + 0.03}, t: T, t0: EV3.e1Ham + 0.04, key: `d3skid${i}`, n: 4, size: 0.08, grow: 0.3, speed: 0.8, life: 1.2, dir: {x: K.hamN.x, y: 0.4, z: K.hamN.z}, spread: 50, rise: 0.15, color: '#8E857C', opacity: 0.5, seed: 152 + i}))));
      out.push(fx([], [], shakeAt(T, EV3.e1Ham, 0.05)));
    }
    // the press: the hammer's face scraping on the plate
    if (T > EV3.press0 - 0.05 && T < EV3.press1 + 0.6) out.push(fx(sparks3({at: dirPlate(Math.min(T, EV3.press1)), t: T, t0: EV3.press0, t1: EV3.press1, rate: 24, key: 'd3press', n: 0, dir: {x: K.hamN.x, y: 0.2, z: K.hamN.z}, spread: 60, speed: [1, 3], life: [0.1, 0.3], flash: 0, seed: 155})));
    // his plate driven into its back as it turns away: a hard impact
    if (near(T, EV3.bash)) {
      out.push(impact({at: K.bash, normal: K.bashN, t: T, t0: EV3.bash, key: 'd3bash', strength: 1.3, material: 'armor', ground: ground(K.bash), seed: 161}));
      out.push(fx(ring3({at: K.bash, normal: K.bashN, t: T, t0: EV3.bash, key: 'd3bashrg', r0: 0.1, speed: 5, dur: 0.16, width: 0.05})));
      out.push(fx([], [], shakeAt(T, EV3.bash, 0.06)));
    }
    // the adze round its ankle
    if (near(T, EV3.hook, 0.1, 1.5)) out.push(fx(sparks3({at: K.hook, t: T, t0: EV3.hook, key: 'd3hook', n: 12, dir: {x: 0.3, y: 0.7, z: 0.4}, spread: 75, speed: [1.5, 4], ground: ground(K.hook), seed: 171, flash: 0.2})));
    // U8 meets the ground
    if (near(T, K.u8Down.t, 0.05, 2.5)) {
      out.push(fx(dust3({at: K.u8Down.at, t: T, t0: K.u8Down.t, key: 'd3u8dn', ring: 0.5, n: 10, speed: 1.6, size: 0.22, grow: 0.5, life: 2.0, rise: 0.3, color: '#958A80', opacity: 0.62, seed: 175})));
      out.push(fx([], [], shakeAt(T, K.u8Down.t, 0.07)));
    }
  }
  // ---- the knee splits: a mechanical failure (the piston flash, the spark cone, the joint's hydraulic spray)
  if (near(T, EV3.knee, 0.1, 3)) {
    const k = kneeTarget();
    out.push(breakerHit({at: k, dir: {x: 0.0, y: 0.3, z: -0.95}, t: T, t0: EV3.knee, key: 'd3knee', ground: ground(k), seed: 71, strength: 1.6}));
    out.push(fx(flash3({at: k, t: T, t0: EV3.knee, key: 'd3kneefl', r: 0.8, dur: 0.14, color: '#FFE6B8'})));
    out.push(fx(sparks3({at: k, t: T, t0: EV3.knee, key: 'd3kneesp', n: 40, dir: {x: 0, y: 0.5, z: 0.8}, spread: 80, speed: [2, 9], ground: ground(k), seed: 72, flash: 0.5})));
    out.push(fx(dust3({at: k, t: T, t0: EV3.knee + 0.03, key: 'd3kneevap', n: 8, size: 0.12, grow: 0.7, speed: 2.4, life: 1.6, dir: {x: 0.2, y: 0.6, z: 0.75}, spread: 35, rise: 0.5, color: '#E4E0D8', opacity: 0.55, seed: 73})));
    out.push(fx(chips3({at: k, t: T, t0: EV3.knee, key: 'd3kneech', n: 10, dir: {x: 0.1, y: 0.5, z: 0.85}, spread: 60, speed: [2, 6], size: [0.03, 0.1], material: 'metal', ground: ground(k), seed: 74})));
    out.push(fx([], [], shakeAt(T, EV3.knee, 0.12, 6)));
  }
  // ---- R4's hammer comes down on the water main over the breaker: a hard impact on the beam
  if (near(T, EV3.e2Hit, 0.1, 2.5)) {
    out.push(impact({at: PIPE_HIT, normal: {x: 0.5, y: 0.8, z: -0.3}, t: T, t0: EV3.e2Hit, key: 'd3e2hit', strength: 1.5, material: 'metal', ground: ground(PIPE_HIT), seed: 181}));
    out.push(fx(ring3({at: PIPE_HIT, normal: {x: 0, y: 1, z: 0}, t: T, t0: EV3.e2Hit, key: 'd3e2rg', r0: 0.15, speed: 6, dur: 0.18, width: 0.06})));
    out.push(fx(chips3({at: PIPE_HIT, t: T, t0: EV3.e2Hit, key: 'd3e2ch', n: 12, dir: {x: -0.4, y: 0.7, z: 0.4}, spread: 70, speed: [1.5, 5], size: [0.03, 0.09], material: 'concrete', ground: ground(PIPE_HIT), seed: 182})));
    out.push(fx(dust3({at: {...PIPE_HIT, y: PIPE_HIT.y - 0.5}, t: T, t0: EV3.e2Hit + 0.03, key: 'd3e2d', n: 8, size: 0.12, grow: 0.5, speed: 0.6, life: 2.0, dir: {x: 0, y: -1, z: 0}, spread: 40, rise: -0.3, color: '#A69B8E', opacity: 0.5, seed: 183})));
    out.push(fx([], [], shakeAt(T, EV3.e2Hit, 0.09)));
  }
  // ---- the crash (the biggest of the film): the hull lands, a dust wave rolls out, debris rains, the ground shakes
  if (T > EV3.land - 0.1 && T < EV3.land + 6) {
    const w = heavyAttach(heavy1D3(EV3.land + 0.05)).hull;
    const g0 = {x: w.x, y: G(w.x, w.z) + 0.1, z: w.z};
    out.push(fx(dust3({at: g0, t: T, t0: EV3.land, key: 'd3wave', ring: 2.6, n: 26, speed: 5.5, size: 0.6, grow: 1.3, life: 3.6, rise: 0.7, color: '#9C9087', opacity: 0.72, seed: 81})));
    out.push(fx(dust3({at: g0, t: T, t0: EV3.land + 0.08, key: 'd3wave2', ring: 1.6, n: 18, speed: 3.2, size: 0.8, grow: 1.2, life: 4.4, rise: 1.1, color: '#A99D90', opacity: 0.62, seed: 82})));
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
    walkSpeed: DECOY3.walkSpeed, on: EV3.projOn, off: EV3.projOff, density: dustAt, seed: DECOY3.seed, surface: 4.0, motes: 30,
  }));
  if (T > EV3.projOn - 0.05 && T < EV3.projOn + 0.3) out.push(fx(flash3({at: LENS(), t: T, t0: EV3.projOn, key: 'd3click', r: 0.22, dur: 0.12, color: '#FFF6D8'})));
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
  // ---- heavy 2: its footfalls — a foot set down on the wreck's top crunches metal; the launcher, the round, the blast
  H2_FALLS.forEach((f) => {
    if (T < f.t - 0.05 || T > f.t + 2.0) return;
    const onWreck = f.pos.y - ground(f.pos) > 0.4, big = f.over || onWreck ? 1 : 0;
    const key = `d3h2f_${f.leg}_${Math.round(f.t * 100)}`, seed = 700 + Math.round(f.t * 10);
    if (onWreck) {
      out.push(fx(sparks3({at: f.pos, t: T, t0: f.t, key: `${key}s`, n: 16, dir: {x: 0, y: 0.8, z: 0}, spread: 85, speed: [1.5, 5], ground: ground(f.pos), seed, flash: 0.3})));
      out.push(fx(chips3({at: f.pos, t: T, t0: f.t, key: `${key}c`, n: 8, dir: {x: 0, y: 1, z: 0}, spread: 70, speed: [1.5, 4], size: [0.04, 0.12], material: 'metal', ground: ground(f.pos), seed: seed + 1})));
    } else out.push(fx(dust3({at: {...f.pos, y: ground(f.pos) + 0.05}, t: T, t0: f.t, key, ring: 0.35, n: 6 + 6 * big, speed: 1.0 + big, size: 0.2, grow: 0.45, life: 1.7, rise: 0.25, color: '#8A8078', opacity: 0.55, seed})));
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
void [mul3];
