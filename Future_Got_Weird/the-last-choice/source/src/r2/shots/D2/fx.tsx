// Section D2 FX at film time T: the canisters and their smoke wall, the clip-on projector and its beam, the projected
// figures, the light landing on fists and drones that go through them, heavy 1's round and the blast inside the smoke,
// every contact (block, parry, hammer on the plate, the knee, the pry and the cables, the clamp, the drag, the crash,
// the hook through the parry, the shield, the counter, the ankle), all derived from the same choreography (crew.tsx,
// machines.ts), so every camera sees the same event at the same world point. Returns FxOut {items, lights, shake}.
// Contacts are scaled by kind: a light parry is a few sparks; a heavy block a ring and chips; a hard impact a flash-free
// burst with shake; a mechanical failure (pop, cables, crash) sparks, arcs and debris. No large white flashes over the
// contact points.
import React from 'react';
import {V3, add3, sub3, mul3, norm3, lerp, clamp, rnd, smooth} from '../../../kit/math';
import {
  FxOut, fx, combine, impact, dust3, chips3, sparks3, flash3, ring3, tetherItems, TetherOpts, decoyItems, smokeCanister, canisterSource, puffsAt,
  allyDrone, DronePose, blast, muzzle, shakeAt, CanisterOpts, SmokeSource, Puff, f1, glowEl, gid, glowTone, tone, inkTone,
} from '../../fx';
import {unitAttach, unitImpacts, cable, heavyAttach} from '../../mech';
import type {UnitSpec} from '../../mech';
import type {Item} from '../../engine';
import {project} from '../../engine';
import {G} from '../D1/motion';
import {EV2, CAN_TO, DECOY, decoyPt, BLAST_AT, unitD2, heavy1, ANCHOR, CRASH_AT, DRAG, ALLY2_KEYS, SHIELD_AT, diveThrough, HEAVY1, aYank, dHookFoot} from './machines';
import {tetherAt, runnerAt, canisterFrom, crewFootfalls, clampTarget, LENS_AT, TABLET_AT, tabletInHand, directorPlate, breakerAt, breakerLoose, BRK_DROP} from './crew';

const ground = (p: V3) => G(p.x, p.z);
const CABLES = ['#E0543E', '#3F7FD1', '#E8C547', '#2E9E6A'];
const lerpV = (a: V3, b: V3, k: number): V3 => ({x: lerp(a.x, b.x, k), y: lerp(a.y, b.y, k), z: lerp(a.z, b.z, k)});
const at = (name: string, t: number) => unitAttach(unitD2(name, t));

// ------------------------------------------------------------------ the canisters and the smoke wall
let CANS: CanisterOpts[] | null = null;
export const canisters = (): CanisterOpts[] => (CANS ??= ([0, 1] as const).map((i) => {
  const to = {x: CAN_TO[i].x, y: G(CAN_TO[i].x, CAN_TO[i].z), z: CAN_TO[i].z};
  return {
    key: `d2can${i}`, from: canisterFrom(i), to, t0: i === 0 ? EV2.rel1 : EV2.rel2, flight: EV2.canFlight, apex: 2.1, ground: to.y, popDelay: EV2.pop,
    // R3: a wall the figures land on, not a fog over the fight: tighter, shorter-lived puffs, the breeze carrying them
    // south-east along the wall and away from the units' backs (where the Crew come in)
    dur: SMK[i].dur, rate: SMK[i].rate, life: SMK[i].life, size: SMK[i].size, grow: SMK[i].grow, wind: SMK[i].wind, color: '#EEEAE3', seed: 3 + i * 5, bounce: 0.9, roll: 0.5,
  };
}));
export const SMK = [
  // the first, at the wall's north-west end by the fight: small and short-lived
  // (it burns out at ~100.8: the wall's end by the units has cleared when the Crew hit them)
  {dur: 5.0, rate: 11, life: 6.0, size: 0.5, grow: 0.6, wind: {x: 0.25, y: 0, z: 0.35}, spread: 0.55, jet: {x: 0.2, y: 2.3, z: 0.2}},
  // the second, mid-wall: the big screen
  {dur: 16, rate: 14, life: 8.0, size: 0.6, grow: 0.85, wind: {x: 0.22, y: 0, z: 0.26}, spread: 0.8, jet: {x: 0.15, y: 2.5, z: 0.2}},
];
let SRC: SmokeSource[] | null = null;
/** the two canisters' smoke (a wall across the crater's north-west slope) — the decoy's screen */
export const smokeSources = (): SmokeSource[] => (SRC ??= canisters().map((c, i) => ({...canisterSource(c), up: 0.7, spread: SMK[i].spread, jet: SMK[i].jet, jetSpread: 1.3, opacity: 0.9})));
// one evaluation of all puffs per film time (the decoy samples the density ~60 times a frame)
let puffT = NaN, puffs: Puff[] = [];
const puffsNow = (T: number) => {
  if (T !== puffT) { puffT = T; puffs = smokeSources().flatMap((s) => puffsAt(s, T)); }
  return puffs;
};
/** smoke density at a world point (as fx/smoke smokeDensity, over the cached puffs) */
export const smokeAt = (p: V3, T: number): number => {
  let d = 0;
  for (const q of puffsNow(T)) {
    const dx = p.x - q.c.x, dy = p.y - q.c.y, dz = p.z - q.c.z;
    const k = (dx * dx + dy * dy + dz * dz) / (q.r * q.r);
    if (k < 2.5) d += q.o * Math.exp(-k * 2.4) * 0.9;
  }
  return 1 - Math.exp(-d * 1.4);
};

// ------------------------------------------------------------------ the tablet and its clip-on projector on the slab
const tabletItem = (T: number): Item => ({
  kind: 'sprite', pos: TABLET_AT, key: 'd2tablet', bias: 0.08,
  draw: (c) => {
    const A = {x: 0.03, y: 0, z: 1}, B = norm3({x: -0.38, y: 0.92, z: 0});
    const P = (a: number, b: number) => project(c.view, add3(TABLET_AT, add3(mul3(A, a), mul3(B, b))));
    const Q = [P(-0.135, -0.095), P(0.135, -0.095), P(0.135, 0.095), P(-0.135, 0.095)];
    const S = [P(-0.11, -0.075), P(0.11, -0.075), P(0.11, 0.072), P(-0.11, 0.072)];
    // the clip-on projector: a small dark box on the tablet's top edge, its lens facing the crater
    const pj = [P(-0.05, 0.095), P(0.05, 0.095), P(0.05, 0.15), P(-0.05, 0.15)];
    if (Q.some((q) => q.z < c.view.near)) return null;
    const pts = (L: {x: number; y: number}[]) => L.map((q) => `${f1(q.x)},${f1(q.y)}`).join(' ');
    const on = T > EV2.projOn && T < EV2.projOff;
    const lens = project(c.view, LENS_AT);
    const iw = Math.max(0.8, Math.min(2.2, 0.01 * c.k));
    return (
      <g>
        <polygon points={pts(Q)} fill={tone(c, '#3A444C')} stroke={inkTone(c)} strokeWidth={f1(iw)} strokeLinejoin="round" />
        <polygon points={pts(S)} fill={glowTone(c, on ? '#2A4B57' : '#20343A')} />
        <polygon points={pts(pj)} fill={tone(c, '#5B646B')} stroke={inkTone(c)} strokeWidth={f1(iw * 0.8)} strokeLinejoin="round" />
        {glowEl(gid('d2lens', on ? 1 : 0), lens.x, lens.y, Math.max(3, 0.06 * c.k), glowTone(c, on ? '#FFF2C8' : '#7FA4AE', 0.2), on ? 0.95 : 0.4, 0.3)}
      </g>
    );
  },
});

// ------------------------------------------------------------------ the breaker let go for the catch (on the ground)
/** the same tool as the rig's two-handed breaker(): yellow rear, slate tube, red tank with the gauge, steel ram head */
const looseBreakerItem = (T: number): Item | null => {
  const L = breakerLoose(T);
  if (!L) return null;
  const P = (x: number, up = 0) => add3(add3(L.back, mul3(L.u, x)), {x: 0, y: up, z: 0});
  return {
    kind: 'sprite', pos: P(0.3), key: 'd2brkloose', bias: 0.04,
    draw: (c) => {
      const pr = (p: V3) => project(c.view, p);
      const a = pr(L.rear), y1 = pr(P(-0.239 + 0.29)), m = pr(P(0.8)), tip = pr(L.tip), tank0 = pr(P(-0.22, -0.06)), tank1 = pr(P(0.0, -0.06));
      if ([a, tip].some((q) => q.z < c.view.near)) return null;
      const k = c.k * 0.0875, ink = Math.max(0.8, Math.min(2.2, 0.01 * c.k));
      const seg = (p: {x: number; y: number}, q: {x: number; y: number}, col: string, w: number) => (
        <g>
          <line x1={f1(p.x)} y1={f1(p.y)} x2={f1(q.x)} y2={f1(q.y)} stroke={inkTone(c)} strokeWidth={f1(w + ink * 2)} strokeLinecap="round" />
          <line x1={f1(p.x)} y1={f1(p.y)} x2={f1(q.x)} y2={f1(q.y)} stroke={tone(c, col)} strokeWidth={f1(w)} strokeLinecap="round" />
        </g>
      );
      return (
        <g>
          {seg(tank0, tank1, '#B8483A', k * 1.15)}
          {seg(a, m, '#4A5258', k)}
          {seg(a, y1, '#E8C547', k)}
          {seg(pr(L.tip), pr(sub3(L.tip, mul3(L.u, 0.1))), '#A9B0B4', k * 1.3)}
        </g>
      );
    },
  };
};

// ------------------------------------------------------------------ the allied drone (smooth through its keys)
const spl = (k: number[][], t: number, ax: number) => {
  const n = k.length;
  if (t <= k[0][0]) return k[0][ax];
  if (t >= k[n - 1][0]) return k[n - 1][ax];
  let i = 0;
  while (i < n - 2 && t > k[i + 1][0]) i++;
  const p0 = k[Math.max(0, i - 1)], p1 = k[i], p2 = k[i + 1], p3 = k[Math.min(n - 1, i + 2)];
  const u = (t - p1[0]) / (p2[0] - p1[0]);
  const m1 = ((p2[ax] - p0[ax]) / Math.max(1e-3, p2[0] - p0[0])) * (p2[0] - p1[0]);
  const m2 = ((p3[ax] - p1[ax]) / Math.max(1e-3, p3[0] - p1[0])) * (p2[0] - p1[0]);
  const u2 = u * u, u3 = u2 * u;
  return (2 * u3 - 3 * u2 + 1) * p1[ax] + (u3 - 2 * u2 + u) * m1 + (-2 * u3 + 3 * u2) * p2[ax] + (u3 - u2) * m2;
};
const allyAt = (t: number): V3 => ({x: spl(ALLY2_KEYS, t, 1), y: spl(ALLY2_KEYS, t, 2), z: spl(ALLY2_KEYS, t, 3)});
/** the allied drone's pose (shared with the pilot's eye line): heading from velocity, nose-down with speed, bank */
export const allyPose = (t: number): DronePose => {
  const p = allyAt(t), v = mul3(sub3(allyAt(t + 0.08), allyAt(t - 0.08)), 6.25);
  const sp = Math.hypot(v.x, v.z);
  const hv = (q: V3) => (Math.atan2(q.x, -q.z) * 180) / Math.PI;
  const face = t > 112.4 && t < 113.6 ? sub3(SHIELD_AT, {x: 50.15, y: SHIELD_AT.y, z: -5.55}) : null;
  let heading = sp > 0.5 ? hv(v) : face ? hv(mul3(face, -1)) : hv(sub3(allyAt(t + 0.6), allyAt(t - 0.6)));
  if (face && sp < 1.5) heading = hv(mul3(face, -1));
  const v2 = sub3(allyAt(t + 0.25), allyAt(t)), v1 = sub3(allyAt(t), allyAt(t - 0.25));
  const turn = ((hv(v2) - hv(v1) + 540) % 360) - 180;
  const roll = sp > 0.5 ? clamp(-turn * 0.6, -28, 28) : 0;
  const bob = 0.035 * Math.sin(t * 3.1 + 3) + 0.02 * Math.sin(t * 5.3 + 6);
  return {pos: add3(p, {x: 0, y: bob, z: 0}), heading, pitch: -clamp(sp * 3.2, 0, 26), roll, speed: sp};
};
const SHIELD_DIR: V3 = norm3({x: -0.8, y: -0.25, z: -0.45});
export const allyOpts = (T: number) => ({key: 'd2ally', t: T, pose: allyPose, hits: [{at: EV2.shield, dir: SHIELD_DIR, strength: 1.4}], ground: 0, seed: 3});

/** dust where a falling machine lands (from the mech's own impact descriptors) */
const landDust = (T: number, name: string, seed: number): FxOut => {
  const imps = unitImpacts(unitD2(name, T)).filter((q) => q.kind === 'ground');
  return combine(...imps.map((q, i) => (T < q.t - 0.05 || T > q.t + 2.5 ? null : combine(
    fx(dust3({at: {x: q.pos.x, y: ground(q.pos) + 0.1, z: q.pos.z}, t: T, t0: q.t, key: `d2ld_${name}${i}`, ring: 0.45, n: 8, speed: 1.3, size: 0.16, grow: 0.38, life: 1.9, rise: 0.25, color: '#958A80', opacity: 0.6, seed: seed + i})),
    fx(chips3({at: {x: q.pos.x, y: ground(q.pos) + 0.1, z: q.pos.z}, t: T, t0: q.t, key: `d2lc_${name}${i}`, n: 7, spread: 70, speed: [1.5, 4], size: [0.04, 0.11], material: 'asphalt', ground: ground(q.pos), seed: seed + 5})),
    fx([], [], shakeAt(T, q.t, 0.05)),
  ))));
};
/** a fist (or a drone) passing through the projected light: the light lands on it for a moment (no contact) */
const lightOn = (T: number, p: V3, t0: number, key: string, r = 0.32): FxOut => (T < t0 - 0.06 || T > t0 + 0.3 ? fx() : fx(flash3({at: p, t: T, t0: t0 - 0.04, key, r, dur: 0.24, color: '#FFEDB5'})));
/** the strikes that go through the light: [unit, film time, side] (the fist at contact, from the unit's own solve) */
const THROUGH: [string, number, 'L' | 'R'][] = [['B', EV2.hitA, 'R'], ['A', EV2.hitB, 'L'], ['D', EV2.dHit, 'R'], ['A', EV2.aHit2, 'R'], ['U8', EV2.u8Hit, 'L'], ['B', EV2.bHit2, 'L'], ['D', 102.4, 'L'], ['U8', 103.4, 'R'], ['D', 104.3, 'R']];
const fistAt = (name: string, t: number, side: 'L' | 'R') => { const a = at(name, t); return side === 'L' ? a.handL : a.handR; };

// ------------------------------------------------------------------ heavy 1: footfalls (dust, shake)
const heavyFalls = (T: number, win = 1.4): {t: number; pos: V3; key: string}[] => {
  const out: {t: number; pos: V3; key: string}[] = [];
  if (T < HEAVY1.T0 || T > HEAVY1.T1 + win) return out;
  const dist = (t: number) => heavy1(t).gait!.dist;
  const a = Math.max(HEAVY1.T0, T - win), b = Math.min(T, HEAVY1.T1);
  if (b <= a) return out;
  const d0 = dist(a), d1 = dist(b), stride = 3.0;
  [0.0, 0.5, 0.75, 0.25].forEach((ph, leg) => {
    for (let k = Math.ceil(d0 / stride + ph); (k - ph) * stride <= d1 && k < 1e4; k++) {
      const dk = (k - ph) * stride;
      let lo = a, hi = b;
      for (let i = 0; i < 16; i++) { const m = (lo + hi) / 2; if (dist(m) < dk) lo = m; else hi = m; }
      out.push({t: hi, pos: heavyAttach(heavy1(hi + 0.02)).feet[leg], key: `hv${leg}_${k}`});
    }
  });
  return out;
};
const CACHE = new Map<string, V3>();
const once = (k: string, f: () => V3) => { let v = CACHE.get(k); if (!v) CACHE.set(k, (v = f())); return v; };

export const d2Fx = (T: number): FxOut => {
  const out: (FxOut | null)[] = [];
  // ---- running feet kick dust (the rim's grit)
  crewFootfalls(T, 1.0).forEach((f, i) => {
    const k = clamp(f.speed / 5);
    if (k < 0.25) return;
    out.push(fx(dust3({at: {...f.pos, y: f.pos.y + 0.03}, t: T, t0: f.t, key: `d2ff_${f.key}`, n: 2, size: 0.05, grow: 0.22 * k, speed: 0.5, life: 1.0, dir: {x: -0.4, y: 1, z: 0}, spread: 60, rise: 0.25, color: '#8E857C', opacity: 0.45 * k, seed: 300 + i})));
  });
  heavyFalls(T).forEach((f, i) => out.push(
    fx(dust3({at: {...f.pos, y: ground(f.pos) + 0.05}, t: T, t0: f.t, key: `d2hf_${f.key}`, ring: 0.3, n: 6, speed: 0.9, size: 0.18, grow: 0.4, life: 1.6, rise: 0.2, color: '#8A8078', opacity: 0.5, seed: 900 + i})),
    fx([], [], shakeAt(T, f.t, 0.012)),
  ));
  // ---- D2-1: the canisters (lob, bounce, roll, hiss) and the smoke wall
  canisters().forEach((c) => { if (T >= c.t0) out.push(smokeCanister(c, T)); });
  // ---- D2-2: the tablet on the slab, the projector clicking on, its beam and the figures on the smoke
  if (!tabletInHand(T)) out.push(fx([tabletItem(T)]));
  // ---- D2-6: the breaker's tool on the ground beside him (dropped for the catch), its clatter
  const loose = looseBreakerItem(T);
  if (loose) out.push(fx([loose]));
  if (T > BRK_DROP + 0.3 && T < BRK_DROP + 1.4) { const L = breakerLoose(BRK_DROP + 0.33)!; out.push(fx(dust3({at: {...L.back, y: ground(L.back) + 0.03}, t: T, t0: BRK_DROP + 0.32, key: 'd2brkdrop', n: 4, speed: 0.4, size: 0.07, grow: 0.25, life: 0.9, rise: 0.15, color: '#8E857C', opacity: 0.4, seed: 77}))); }
  out.push(fx(flash3({at: LENS_AT, t: T, t0: EV2.projOn, key: 'd2click', r: 0.18, dur: 0.1, color: '#FFF6D8'})));
  out.push(decoyItems({
    key: 'd2dec', t: T, projector: () => LENS_AT, center: DECOY.center, walkHeading: DECOY.walkHeading, height: DECOY.height, spacing: DECOY.spacing,
    walkSpeed: DECOY.walkSpeed, on: EV2.projOn, off: EV2.projOff, density: smokeAt, seed: DECOY.seed, surface: 2.6, motes: 34,
    // the first canister burnt out, the wall thinning: once the Crew are in, the figures are fainter (the fight reads)
    gain: (t) => 1 - 0.45 * smooth(clamp((t - 101.9) / 0.8)),
  }));
  // ---- D2-3: fists through the light (no contact: the light lands on them), drones diving through it
  THROUGH.forEach(([n, t0, s], i) => { if (T > t0 - 0.1 && T < t0 + 0.35) out.push(lightOn(T, once(`th${i}`, () => fistAt(n, t0, s)), t0, `d2th${i}`)); });
  diveThrough(T).forEach((d) => out.push(lightOn(T, d.at, d.tc, `d2dive${d.id}`, 0.45)));
  // heavy 1 fires into the smoke: muzzle flash, the round's streak, the blast inside the white wall among its own units
  if (T > EV2.fire - 0.1 && T < EV2.blast + 4) {
    const mz = heavyAttach(heavy1(EV2.fire)).muzzle;
    const dir = norm3(sub3(BLAST_AT, mz));
    out.push(muzzle({at: mz, dir, t: T, t0: EV2.fire, key: 'd2hvmz', size: 0.9}));
    if (T >= EV2.fire && T < EV2.blast) {
      const u = (T - EV2.fire) / (EV2.blast - EV2.fire);
      const head = lerpV(mz, BLAST_AT, u), tail = lerpV(mz, BLAST_AT, Math.max(0, u - 0.35));
      out.push(fx([{
        kind: 'sprite', pos: head, key: 'd2round', bias: 0.2,
        draw: (c) => {
          const a = project(c.view, head), b = project(c.view, tail);
          if (a.z < c.view.near || b.z < c.view.near) return null;
          return <g>{glowEl(gid('d2rnd'), a.x, a.y, Math.max(5, 0.4 * a.k), glowTone(c, '#FFD9A0', 0.2), 0.9, 0.3)}<line x1={f1(b.x)} y1={f1(b.y)} x2={f1(a.x)} y2={f1(a.y)} stroke={glowTone(c, '#FFF1D6', 0.2)} strokeWidth={f1(Math.max(1.5, 0.06 * a.k))} strokeLinecap="round" opacity={0.85} /></g>;
        },
      }], [{pos: head, color: '#FFD9A0', power: 0.8, radius: 6}]));
    }
    const bl = blast({at: BLAST_AT, t: T, t0: EV2.blast, key: 'd2blast', size: 2.0, groundH: G, ground: G(BLAST_AT.x, BLAST_AT.z), seed: 21, debris: 'asphalt'});
    out.push({...bl, items: bl.items.map((it) => (it.kind === 'sprite' && /_(fb\d|flash)/.test(it.key ?? '') ? {...it, bias: (it.bias ?? 0) + 8} : it))});
  }
  // ---- D2-4 FLANK
  // the adze behind B's right knee: a scrape of metal on the joint, then the knee hits the ground
  if (T > EV2.knee - 0.1 && T < EV2.knee + 2.5) {
    const k = once('knee', () => at('B', EV2.knee).kneeR);
    out.push(fx(sparks3({at: k, t: T, t0: EV2.knee, key: 'd2knee', n: 9, dir: {x: -0.4, y: 0.6, z: -0.6}, spread: 55, speed: [1.5, 4], ground: ground(k), seed: 41, flash: 0})));
    const kd = once('kneeG', () => at('B', EV2.knee + 0.3).kneeR);
    out.push(fx(dust3({at: {x: kd.x, y: ground(kd) + 0.04, z: kd.z}, t: T, t0: EV2.knee + 0.26, key: 'd2kneeg', n: 5, size: 0.09, grow: 0.3, speed: 0.8, life: 1.3, spread: 75, rise: 0.2, color: '#8E857C', opacity: 0.6, seed: 43})));
  }
  // A blocks the Director's bash (heavy block: forearm on plate) and its hammer lands on the plate (hard impact)
  if (T > EV2.block - 0.1 && T < EV2.aHam + 2.5) {
    const p1 = once('block', () => directorPlate(EV2.block));
    out.push(impact({at: p1, normal: {x: -0.6, y: 0.3, z: -0.7}, t: T, t0: EV2.block, key: 'd2block', strength: 0.95, material: 'armor', ground: ground(p1), seed: 45}));
    const p2 = once('ham', () => directorPlate(EV2.aHam));
    out.push(impact({at: p2, normal: {x: -0.5, y: 0.6, z: -0.6}, t: T, t0: EV2.aHam, key: 'd2ham', strength: 1.35, material: 'armor', ground: ground(p2), seed: 46}));
    // his heels skid on the slope
    const b = once('hamFeet', () => add3(directorPlate(EV2.aHam + 0.2), {x: 0, y: -1.3, z: 0}));
    out.push(fx(dust3({at: {x: b.x, y: ground(b) + 0.03, z: b.z}, t: T, t0: EV2.aHam + 0.05, key: 'd2skid', n: 5, size: 0.08, grow: 0.3, speed: 0.9, life: 1.2, dir: {x: -0.5, y: 0.6, z: -0.6}, spread: 50, color: '#8E857C', opacity: 0.55, seed: 47})));
  }
  // the pry: sparks along the edge as the fork bites, the plate pops, the cables come out in his hand
  if (T > EV2.pryIn && T < EV2.rip + 3) {
    const u = once('pryB', () => at('B', EV2.pryPop).backPlate);
    const edge = add3(u, {x: 0, y: 0.16, z: 0});
    out.push(fx(sparks3({at: edge, t: T, t0: EV2.pryIn + 0.05, t1: EV2.pryPop, rate: 30, key: 'd2pry', n: 0, dir: {x: -0.3, y: 1, z: -0.2}, spread: 50, speed: [1, 3], life: [0.1, 0.3], flash: 0, seed: 61})));
    out.push(impact({at: edge, normal: {x: -0.4, y: 0.8, z: -0.3}, t: T, t0: EV2.pryPop, key: 'd2pop', strength: 0.9, material: 'armor', ground: ground(edge), seed: 63}));
    if (T > EV2.pryPop + 0.04) {
      const r = runnerAt(T).pts;
      const from = at('B', T).backPlate;
      const hand = r?.cablesHand ?? add3(from, {x: 0.3, y: 0.3, z: 0});
      const ripped = T > EV2.rip + 0.05;
      CABLES.forEach((c, k) => {
        const a = add3(from, {x: (k - 1.5) * 0.04, y: 0.02 * (k % 2), z: (k - 1.5) * 0.02});
        if (!ripped) out.push(fx([cable(a, hand, -0.03 - 0.02 * k, c, 0.016, `d2cab${k}`, true, 5)]));
        else {
          const tear = add3(a, mul3(sub3(hand, a), 0.45 + 0.05 * k));
          if (T < 105.6) out.push(fx([cable(hand, add3(tear, {x: 0, y: -0.1 * Math.min(1, (T - EV2.rip) * 2), z: 0}), -0.06, c, 0.016, `d2cabh${k}`, true, 5)]));
          out.push(fx([cable(a, add3(a, {x: 0.08 * (k - 1.5), y: 0.14 - 0.25 * Math.min(1, (T - EV2.rip) * 1.5), z: 0.05}), -0.03, c, 0.016, `d2cabs${k}`, true, 4)]));
        }
      });
      out.push(fx(sparks3({at: from, t: T, t0: EV2.rip, key: 'd2rip', n: 22, dir: {x: -0.2, y: 1, z: -0.3}, spread: 80, speed: [2, 6], ground: ground(from), seed: 65, flash: 0.15})));
    }
  }
  // the breaker's swing parried off A's forearm (a glancing clang); the shove drops him on a knee (dust)
  if (T > EV2.brkSwing - 0.1 && T < EV2.aShove + 2) {
    const tip = once('brkTip', () => {
      const b = breakerAt(EV2.brkSwing).pts!;
      return add3(b.front, mul3(norm3(sub3(b.front, b.back)), 144 / 251.4));
    });
    out.push(impact({at: tip, normal: {x: -0.5, y: 0.5, z: 0.7}, t: T, t0: EV2.brkSwing, key: 'd2parry', strength: 0.55, material: 'metal', ground: ground(tip), seed: 51}));
    const kn = once('brkDown', () => add3(breakerAt(EV2.aShove + 0.35).body.pos, {x: 0, y: 0.05, z: 0}));
    out.push(fx(dust3({at: kn, t: T, t0: EV2.aShove + 0.3, key: 'd2brkdn', n: 6, size: 0.1, grow: 0.34, speed: 0.9, life: 1.4, spread: 70, rise: 0.2, color: '#8E857C', opacity: 0.6, seed: 52})));
  }
  // A's finishing blow jerked off by the clamp: its fist into the ground beside the breaker
  if (T > EV2.aFin - 0.1 && T < EV2.aFin + 2) {
    const f = once('aFin', () => at('A', EV2.aFin).handR);
    const g = {x: f.x, y: ground(f) + 0.05, z: f.z};
    out.push(impact({at: g, normal: {x: 0, y: 1, z: 0}, t: T, t0: EV2.aFin, key: 'd2afin', strength: 0.8, material: 'asphalt', ground: g.y, seed: 55}));
  }
  // ---- D2-5 TETHER: fire → bite → it grabs the line → wrap round post 3 → taut (the reel) → release → reel in
  if (T >= EV2.tFire && T < EV2.reelEnd + 0.05) {
    const muz = (t: number) => tetherAt(t).pts?.muzzle ?? add3(tetherAt(t).body.pos, {x: 0, y: 1.25, z: 0});
    if (T < EV2.release + 0.3) {
      const target = (t: number) => {
        if (t < EV2.release) return clampTarget(Math.min(t, EV2.crash + 0.05));
        const k = clamp((t - EV2.release) / 0.3);
        return lerpV(clampTarget(EV2.crash + 0.05), ANCHOR, k * k);
      };
      const o: TetherOpts = {key: 'd2teth', t: T, muzzle: muz, target, fireAt: EV2.tFire, flight: EV2.tBite - EV2.tFire, anchor: ANCHOR, wrapAt: EV2.wrap, anchorR: 0.21, tautAt: EV2.taut, slackLen: 13, seed: 9, cableR: 0.03};
      out.push(tetherItems(o));
    } else {
      const target = (t: number) => { const k = clamp((t - EV2.release - 0.3) / (EV2.reelEnd - EV2.release - 0.3)); return add3(lerpV(ANCHOR, muz(t), k * k), {x: 0, y: -0.35 * Math.sin(Math.PI * k), z: 0}); };
      out.push(tetherItems({key: 'd2teth2', t: T, muzzle: muz, target, fireAt: EV2.release - 2, flight: 0.3, tautAt: EV2.release - 1, seed: 9, cableR: 0.03}));
    }
    // the clamp bites: a snap of sparks on its chest plate
    const c = once('bite', () => clampTarget(EV2.tBite));
    out.push(fx(sparks3({at: c, t: T, t0: EV2.tBite, key: 'd2bite', n: 10, dir: {x: -0.5, y: 0.5, z: -0.6}, spread: 60, speed: [1.5, 4], ground: ground(c), seed: 57, flash: 0})));
  }
  // the drag: its feet plough the slope (dust kicked up behind it, every few frames)
  if (T > EV2.taut && T < EV2.crash + 1.5) {
    for (let i = 0; i < 10; i++) {
      const t0 = EV2.taut + 0.12 + i * 0.15;
      if (t0 > EV2.crash || T < t0) continue;
      const f = once(`drag${i}`, () => at('A', t0).footL);
      out.push(fx(dust3({at: {x: f.x, y: ground(f) + 0.04, z: f.z}, t: T, t0, key: `d2drag${i}`, n: 3, size: 0.12, grow: 0.36, speed: 0.6, life: 1.5, dir: {x: -DRAG.dir.x, y: 0.7, z: -DRAG.dir.z}, spread: 50, rise: 0.2, color: '#8E857C', opacity: 0.55, seed: 140 + i})));
    }
  }
  // ---- the sweep: A into C; then both into the girder (a big metal crash; the girder shudders, dust and rust rain)
  if (T > EV2.sweep - 0.1 && T < EV2.sweep + 3) {
    const c = once('sweep', () => at('C', EV2.sweep).backPlate);
    out.push(impact({at: c, normal: {x: -DRAG.dir.x, y: 0.3, z: -DRAG.dir.z}, t: T, t0: EV2.sweep, key: 'd2sweep', strength: 1.2, material: 'armor', ground: ground(c), seed: 71}));
  }
  if (T > EV2.crash - 0.1 && T < EV2.crash + 4) {
    const a = CRASH_AT();
    out.push(impact({at: a, normal: {x: -DRAG.dir.x * 0.6, y: 0.4, z: -DRAG.dir.z * 0.6 + 0.5}, t: T, t0: EV2.crash, key: 'd2crash', strength: 2.0, material: 'armor', ground: ground(a), seed: 73}));
    out.push(fx(sparks3({at: add3(a, {x: 0, y: 0.2, z: 0}), t: T, t0: EV2.crash, key: 'd2crsp', n: 40, dir: {x: 0.2, y: 0.6, z: 0.75}, spread: 85, speed: [3, 10], ground: ground(a), seed: 74, flash: 0.3})));
    out.push(fx(chips3({at: a, t: T, t0: EV2.crash, key: 'd2crch', n: 12, dir: {x: 0.3, y: 0.8, z: 0.5}, spread: 70, speed: [2, 6], size: [0.04, 0.12], material: 'metal', ground: ground(a), seed: 75})));
    out.push(fx([], T < EV2.crash + 0.12 ? [{pos: a, color: '#FFD9A0', power: 1.0, radius: 6}] : [], shakeAt(T, EV2.crash, 0.15, 4.5)));
    // the girder shakes loose its dust and rust along a few metres either side of the hit
    for (let i = 0; i < 6; i++) {
      const s = (i - 2.5) * 1.3;
      const p = {x: a.x + 0.95 * s, y: 0, z: a.z + 0.26 * s};
      const py = 0.173 * ((p.x - 35.32) / 0.95) - 0.1 + (i % 2) * 1.4;
      const q = {x: p.x - 0.26 * 2.6 * (i % 3 === 0 ? 0 : 0.4), y: py, z: p.z};
      out.push(fx(dust3({at: q, t: T, t0: EV2.crash + 0.03 + i * 0.03, key: `d2gd${i}`, n: 3, size: 0.12, grow: 0.42, speed: 0.35, life: 2.4, dir: {x: 0, y: -1, z: 0}, spread: 40, rise: -0.25, color: i % 2 ? '#7A5A44' : '#9C9187', opacity: 0.55, seed: 80 + i})));
      out.push(fx(chips3({at: q, t: T, t0: EV2.crash + 0.05 + i * 0.04, key: `d2gc${i}`, n: 3, dir: {x: 0, y: -1, z: 0}, spread: 50, speed: [0.3, 1.2], size: [0.02, 0.05], material: i % 2 ? 'metal' : 'concrete', ground: G(q.x, q.z), seed: 90 + i})));
    }
  }
  // A stirs at the girder's foot: the Director's plate on its head (eye out in a spit of sparks)
  if (T > EV2.aKill - 0.1 && T < EV2.aKill + 2) {
    const h = once('aKill', () => at('A', EV2.aKill).head);
    out.push(impact({at: h, normal: {x: -0.2, y: 0.9, z: 0.3}, t: T, t0: EV2.aKill, key: 'd2akill', strength: 1.0, material: 'armor', ground: ground(h), seed: 151}));
  }
  // the machines going down: A and C at the girder's foot, B on the slope, D on the crest
  out.push(landDust(T, 'A', 51), landDust(T, 'B', 52), landDust(T, 'C', 53), landDust(T, 'D', 54));
  // ---- D2-6: D's hook breaks through the bar he raised (metal on metal, then the blow lands); the stumble; the catch
  if (T > EV2.knock - 0.1 && T < EV2.knock + 2.5) {
    const bar = once('bar', () => runnerAt(EV2.knock).spec.world?.handL ?? add3(runnerAt(EV2.knock).body.pos, {x: 0.1, y: 1.3, z: 0.1}));
    const hp = once('dFist', () => at('D', EV2.knock).handR);
    const p = lerpV(hp, bar, 0.4);
    out.push(impact({at: p, normal: {x: 0.7, y: 0.2, z: 0.6}, t: T, t0: EV2.knock, key: 'd2knock', strength: 1.0, material: 'metal', ground: ground(p), seed: 101}));
    out.push(impact({at: add3(runnerAt(EV2.knock).body.pos, {x: 0.05, y: 1.15, z: 0.05}), normal: {x: -0.6, y: 0.3, z: -0.6}, t: T, t0: EV2.knock + 0.03, key: 'd2knockf', strength: 0.9, material: 'flesh', seed: 102}));
  }
  if (T > EV2.catch - 0.6 && T < EV2.catch + 2) {
    const r = runnerAt(EV2.catch).spec.world!;
    [r.footR!, r.footL!].forEach((f, i) => out.push(fx(dust3({at: {...f, y: f.y + 0.03}, t: T, t0: 110.86 + i * 0.32, key: `d2scuff${i}`, n: 2, size: 0.06, grow: 0.2, speed: 0.45, life: 1.0, dir: {x: -0.5, y: 1, z: -0.5}, spread: 60, color: '#A2968A', opacity: 0.45, seed: 110 + i}))));
  }
  // ---- D2-7: the allied drone takes D's blow (sparks, a wobble, a wisp); the Director's plate into D's side; the adze
  out.push(allyDrone(allyOpts(T)));
  if (T > EV2.shield - 0.1 && T < EV2.shield + 2) out.push(impact({at: SHIELD_AT, normal: {x: 0.75, y: 0.3, z: 0.55}, t: T, t0: EV2.shield, key: 'd2shield', strength: 1.15, material: 'metal', seed: 121}));
  if (T > EV2.counter - 0.1 && T < EV2.counter + 3) {
    const d = once('counter', () => directorPlate(EV2.counter));
    out.push(impact({at: d, normal: {x: 0.6, y: 0.2, z: -0.75}, t: T, t0: EV2.counter, key: 'd2counter', strength: 1.45, material: 'armor', ground: ground(d), seed: 131}));
  }
  if (T > EV2.hook - 0.1 && T < EV2.hook + 2) {
    const f = dHookFoot().L0;
    out.push(fx(sparks3({at: add3(f, {x: 0, y: 0.12, z: 0}), t: T, t0: EV2.hook, key: 'd2ankle', n: 6, dir: {x: -0.5, y: 0.6, z: -0.4}, spread: 60, speed: [1, 3], ground: f.y, seed: 135, flash: 0})));
    out.push(fx(dust3({at: {...f, y: f.y + 0.04}, t: T, t0: EV2.hook + 0.05, key: 'd2ankled', n: 4, size: 0.08, grow: 0.3, speed: 0.8, life: 1.2, spread: 60, rise: 0.15, color: '#8E857C', opacity: 0.55, seed: 136})));
  }
  void aYank;
  return combine(...(out.filter(Boolean) as FxOut[]));
};

/** the girder's shudder after the crash: a flex of its span (fixed at the ground end and the column), metres */
export const girderShudder = (T: number) => (T < EV2.crash ? 0 : 0.07 * Math.exp(-(T - EV2.crash) * 3.2) * Math.sin((T - EV2.crash) * 2 * Math.PI * 7.5));
void [rnd, flash3];
export type {UnitSpec};
