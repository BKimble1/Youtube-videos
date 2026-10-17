// Section D2 FX at film time T: the canisters and their smoke wall, the projected light-figures, heavy 1's round and the
// blast inside the smoke, every contact's sparks/chips/dust, the tether (wrapped round girder post 3), the crash into
// the girder, the allied drone — all derived from the same choreography (crew.tsx, machines.ts), so every camera sees
// the same event at the same world point. Returns FxOut {items, lights, shake}.
import React from 'react';
import {V3, add3, sub3, mul3, norm3, lerp, clamp, smooth, rnd} from '../../../kit/math';
import {
  FxOut, fx, combine, impact, breakerHit, dust3, chips3, sparks3, flash3, ring3, tetherItems, TetherOpts, decoyItems, smokeCanister, canisterSource, puffsAt,
  allyDrone, DronePose, blast, muzzle, shakeAt, CanisterOpts, SmokeSource, Puff, f1, glowEl, gid, glowTone, tone, inkTone,
} from '../../fx';
import {unitAttach, unitImpacts, cable, heavyAttach} from '../../mech';
import type {Item} from '../../engine';
import {project} from '../../engine';
import {G} from '../D1/motion';
import {EV2, CAN_TO, DECOY, decoyPt, BLAST_AT, unitD2, heavy1, ANCHOR, CRASH_AT, DRAG, ALLY2_KEYS, SHIELD_AT, diveThrough, HEAVY1} from './machines';
import {tetherAt, runnerAt, canisterFrom, crewFootfalls, kneeTarget, clampTarget, LENS_AT, TABLET_AT, tabletInHand, directorPlate} from './crew';

const ground = (p: V3) => G(p.x, p.z);
const CABLES = ['#E0543E', '#3F7FD1', '#E8C547', '#2E9E6A'];
const lerpV = (a: V3, b: V3, k: number): V3 => ({x: lerp(a.x, b.x, k), y: lerp(a.y, b.y, k), z: lerp(a.z, b.z, k)});

// ------------------------------------------------------------------ the canisters and the smoke wall
let CANS: CanisterOpts[] | null = null;
export const canisters = (): CanisterOpts[] => (CANS ??= ([0, 1] as const).map((i) => {
  const to = {x: CAN_TO[i].x, y: G(CAN_TO[i].x, CAN_TO[i].z), z: CAN_TO[i].z};
  return {
    key: `d2can${i}`, from: canisterFrom(i), to, t0: i === 0 ? EV2.rel1 : EV2.rel2, flight: EV2.canFlight, apex: 2.3, ground: to.y, popDelay: EV2.pop,
    dur: 16, rate: 13, life: 10, size: 0.6, grow: 1.25, wind: {x: 0.26, y: 0, z: 0.12}, color: '#EEEAE3', seed: 3 + i * 5, bounce: 1.1, roll: 0.6,
  };
}));
let SRC: SmokeSource[] | null = null;
/** the two canisters' smoke (a wall filling the crater floor) — the decoy's screen */
export const smokeSources = (): SmokeSource[] => (SRC ??= canisters().map((c) => ({...canisterSource(c), up: 0.75, spread: 0.7, jet: {x: 0.3, y: 2.8, z: -0.1}, jetSpread: 1.6, opacity: 0.92})));
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

// ------------------------------------------------------------------ the tablet on the slab (a small world prop)
const tabletItem = (T: number): Item => ({
  kind: 'sprite', pos: TABLET_AT, key: 'd2tablet', bias: 0.08,
  draw: (c) => {
    const A = {x: 0.03, y: 0, z: 1}, B = norm3({x: -0.38, y: 0.92, z: 0});
    const P = (a: number, b: number) => project(c.view, add3(TABLET_AT, add3(mul3(A, a), mul3(B, b))));
    const Q = [P(-0.135, -0.095), P(0.135, -0.095), P(0.135, 0.095), P(-0.135, 0.095)];
    const S = [P(-0.11, -0.075), P(0.11, -0.075), P(0.11, 0.072), P(-0.11, 0.072)];
    if (Q.some((q) => q.z < c.view.near)) return null;
    const pts = (L: {x: number; y: number}[]) => L.map((q) => `${f1(q.x)},${f1(q.y)}`).join(' ');
    const on = T > EV2.projOn && T < EV2.projOff;
    const lens = project(c.view, LENS_AT);
    const iw = Math.max(0.8, Math.min(2.2, 0.01 * c.k));
    return (
      <g>
        <polygon points={pts(Q)} fill={tone(c, '#3A444C')} stroke={inkTone(c)} strokeWidth={f1(iw)} strokeLinejoin="round" />
        <polygon points={pts(S)} fill={glowTone(c, on ? '#2A4B57' : '#20343A')} />
        {glowEl(gid('d2lens', on ? 1 : 0), lens.x, lens.y, Math.max(3, 0.06 * c.k), glowTone(c, on ? '#FFF2C8' : '#7FA4AE', 0.2), on ? 0.95 : 0.4, 0.3)}
      </g>
    );
  },
});

// ------------------------------------------------------------------ the allied drone (smooth through its keys)
const spl = (k: number[][], t: number, ax: number) => {
  const n = k.length;
  if (t <= k[0][0]) return k[0][ax];
  if (t >= k[n - 1][0]) return k[n - 1][ax];
  let i = 0;
  while (i < n - 2 && t > k[i + 1][0]) i++;
  const p0 = k[Math.max(0, i - 1)], p1 = k[i], p2 = k[i + 1], p3 = k[Math.min(n - 1, i + 2)];
  const u = (t - p1[0]) / (p2[0] - p1[0]);
  // Catmull-Rom with time-scaled tangents (non-uniform keys)
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
/** a fist (or a drone) passing through the projected light: the light lands on it for a moment */
const lightOn = (T: number, at: V3, t0: number, key: string, r = 0.42): FxOut => (T < t0 - 0.06 || T > t0 + 0.3 ? fx() : fx(flash3({at, t: T, t0: t0 - 0.04, key, r, dur: 0.26, color: '#FFEDB5'})));

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
  // ---- D2-1/2: the canisters (lob, bounce, roll, hiss) and the smoke wall
  canisters().forEach((c) => { if (T >= c.t0) out.push(smokeCanister(c, T)); });
  // the pin rings: a glint as each pin comes out
  // ---- the tablet on the slab, the projector clicking on, the light figures on the smoke
  if (!tabletInHand(T)) out.push(fx([tabletItem(T)]));
  out.push(fx(flash3({at: LENS_AT, t: T, t0: EV2.projOn, key: 'd2click', r: 0.25, dur: 0.12, color: '#FFF6D8'})));
  out.push(decoyItems({
    key: 'd2dec', t: T, projector: () => LENS_AT, center: DECOY.center, walkHeading: DECOY.walkHeading, height: DECOY.height, spacing: DECOY.spacing,
    walkSpeed: DECOY.walkSpeed, on: EV2.projOn, off: EV2.projOff, density: smokeAt, seed: DECOY.seed, surface: 3.2,
  }));
  // ---- D2-3: fists through the light (no contact: the light lands on them), drones diving through it
  out.push(lightOn(T, decoyPt(3, EV2.hitA, 0.25), EV2.hitA, 'd2thA'), lightOn(T, decoyPt(2, EV2.hitB, 0.24), EV2.hitB, 'd2thB'), lightOn(T, decoyPt(3, 101.45, 0.3), 101.45, 'd2thA2'), lightOn(T, decoyPt(2, 101.3, 0.28), 101.3, 'd2thB2'));
  ([[1, 103.55], [2, 103.95], [3, 104.35]] as [number, number][]).forEach(([j, t0]) => out.push(lightOn(T, decoyPt(j, t0, 0.27), t0, `d2thR${j}`)));
  diveThrough(T).forEach((d) => out.push(lightOn(T, d.at, d.tc, `d2dive${d.id}`, 0.6)));
  // heavy 1 fires into the smoke: muzzle flash, the round's streak, the blast inside the white wall
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
    // the fireball burns inside the white wall: its sprites draw through the smoke's front puffs (bias), its light on them
    const bl = blast({at: BLAST_AT, t: T, t0: EV2.blast, key: 'd2blast', size: 2.3, groundH: G, ground: G(BLAST_AT.x, BLAST_AT.z), seed: 21, debris: 'asphalt'});
    out.push({...bl, items: bl.items.map((it) => (it.kind === 'sprite' && /_(fb\d|flash)/.test(it.key ?? '') ? {...it, bias: (it.bias ?? 0) + 8} : it))});
  }
  // ---- D2-4 FLANK: the breaker breaks B's knee from behind; the Director's plate into A's back; the pry and the rip
  if (T > EV2.knee - 0.1 && T < EV2.knee + 3) {
    const k = kneeTarget();
    const bh = breakerHit({at: k, dir: {x: 0.45, y: -0.3, z: 0.84}, t: T, t0: EV2.knee, key: 'd2knee', ground: ground(k), seed: 41, strength: 1.1});
    out.push({...bh, items: bh.items.filter((it) => !(it.key ?? '').startsWith('d2knee_ch'))});
    out.push(fx(chips3({at: k, t: T, t0: EV2.knee, key: 'd2kneech', n: 8, dir: {x: 0.4, y: 0.7, z: 0.5}, spread: 60, speed: [1.5, 4.5], size: [0.012, 0.035], material: 'armor', ground: ground(k), seed: 42})));
    const kd = unitAttach(unitD2('B', EV2.knee + 0.26)).kneeL;
    const kg = {x: kd.x, y: ground(kd) + 0.04, z: kd.z};
    out.push(fx(dust3({at: kg, t: T, t0: EV2.knee + 0.26, key: 'd2kneeg', n: 4, size: 0.08, grow: 0.28, speed: 0.7, life: 1.3, spread: 75, rise: 0.2, color: '#8E857C', opacity: 0.55, seed: 43})));
  }
  if (T > EV2.bash - 0.1 && T < EV2.bash + 3) {
    const a = unitAttach(unitD2('A', EV2.bash));
    const at = lerpV(a.backPlate, a.shoulderR, 0.5);
    out.push(impact({at, normal: {x: -0.75, y: 0.25, z: -0.6}, t: T, t0: EV2.bash, key: 'd2bash', strength: 1.3, material: 'armor', ground: ground(at), seed: 45}));
    out.push(fx(ring3({at: directorPlate(EV2.bash), normal: {x: -0.6, y: 0.1, z: -0.8}, t: T, t0: EV2.bash, key: 'd2bashr', r0: 0.1, speed: 6, dur: 0.16, width: 0.05})));
    out.push(fx([], [], shakeAt(T, EV2.bash, 0.07)));
  }
  if (T > EV2.pryIn && T < EV2.rip + 3) {
    const u = unitAttach(unitD2('B', EV2.pryPop));
    const edge = add3(u.backPlate, {x: 0, y: 0.16, z: 0});
    out.push(fx(sparks3({at: edge, t: T, t0: EV2.pryIn + 0.05, t1: EV2.pryPop, rate: 40, key: 'd2pry', n: 0, dir: {x: -0.3, y: 1, z: -0.2}, spread: 50, speed: [1, 3], life: [0.1, 0.3], flash: 0, seed: 61})));
    out.push(impact({at: edge, normal: {x: -0.4, y: 0.8, z: -0.3}, t: T, t0: EV2.pryPop, key: 'd2pop', strength: 1.0, material: 'armor', ground: ground(edge), seed: 63}));
    if (T > 104.47) {
      const r = runnerAt(T).pts;
      const from = unitAttach(unitD2('B', T)).backPlate;
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
      out.push(fx(sparks3({at: from, t: T, t0: EV2.rip, key: 'd2rip', n: 26, dir: {x: -0.2, y: 1, z: -0.3}, spread: 80, speed: [2, 6], ground: ground(from), seed: 65, flash: 0.35})));
      out.push(fx(flash3({at: from, t: T, t0: EV2.rip, key: 'd2ripfl', r: 0.45, dur: 0.12, color: '#BFEAFF'})));
    }
  }
  // ---- D2-5 TETHER: fire → bite → wrap round post 3 → taut (the reel) → release → reel in
  if (T >= EV2.tFire && T < EV2.reelEnd + 0.05) {
    const muz = (t: number) => tetherAt(t).pts?.muzzle ?? add3(tetherAt(t).body.pos, {x: 0, y: 1.25, z: 0});
    if (T < EV2.release + 0.3) {
      const target = (t: number) => {
        if (t < EV2.release) return clampTarget(Math.min(t, EV2.crash + 0.05));
        const k = clamp((t - EV2.release) / 0.3);
        return lerpV(clampTarget(EV2.crash + 0.05), ANCHOR, k * k);
      };
      const o: TetherOpts = {key: 'd2teth', t: T, muzzle: muz, target, fireAt: EV2.tFire, flight: EV2.tBite - EV2.tFire, anchor: ANCHOR, wrapAt: EV2.wrap, anchorR: 0.21, tautAt: EV2.taut, slackLen: 11, seed: 9, cableR: 0.03};
      out.push(tetherItems(o));
    } else {
      // the clamp flipped off the post, reeled back to the launcher
      const target = (t: number) => { const k = clamp((t - EV2.release - 0.3) / (EV2.reelEnd - EV2.release - 0.3)); return add3(lerpV(ANCHOR, muz(t), k * k), {x: 0, y: -0.35 * Math.sin(Math.PI * k), z: 0}); };
      out.push(tetherItems({key: 'd2teth2', t: T, muzzle: muz, target, fireAt: EV2.release - 2, flight: 0.3, tautAt: EV2.release - 1, seed: 9, cableR: 0.03}));
    }
  }
  // ---- the sweep: A into C; then both into the girder (a big metal crash; the girder shudders, dust and rust rain)
  if (T > EV2.sweep - 0.1 && T < EV2.sweep + 3) {
    const c = unitAttach(unitD2('C', EV2.sweep)).backPlate;
    out.push(impact({at: c, normal: {x: -DRAG.dir.x, y: 0.3, z: -DRAG.dir.z}, t: T, t0: EV2.sweep, key: 'd2sweep', strength: 1.4, material: 'armor', ground: ground(c), seed: 71}));
    out.push(fx([], [], shakeAt(T, EV2.sweep, 0.06)));
  }
  if (T > EV2.crash - 0.1 && T < EV2.crash + 4) {
    const at = CRASH_AT();
    out.push(impact({at, normal: {x: -DRAG.dir.x * 0.6, y: 0.4, z: -DRAG.dir.z * 0.6 + 0.5}, t: T, t0: EV2.crash, key: 'd2crash', strength: 2.0, material: 'armor', ground: ground(at), seed: 73}));
    out.push(fx(sparks3({at: add3(at, {x: 0, y: 0.2, z: 0}), t: T, t0: EV2.crash, key: 'd2crsp', n: 44, dir: {x: 0.2, y: 0.6, z: 0.75}, spread: 85, speed: [3, 10], ground: ground(at), seed: 74, flash: 0.5})));
    out.push(fx(flash3({at, t: T, t0: EV2.crash, key: 'd2crfl', r: 0.9, dur: 0.14, color: '#FFE8C0'})));
    out.push(fx(ring3({at, normal: {x: 0, y: 0, z: 1}, t: T, t0: EV2.crash, key: 'd2crrg', r0: 0.2, speed: 9, dur: 0.2, width: 0.07})));
    out.push(fx(chips3({at, t: T, t0: EV2.crash, key: 'd2crch', n: 12, dir: {x: 0.3, y: 0.8, z: 0.5}, spread: 70, speed: [2, 6], size: [0.04, 0.12], material: 'metal', ground: ground(at), seed: 75})));
    out.push(fx([], T < EV2.crash + 0.12 ? [{pos: at, color: '#FFD9A0', power: 1.2, radius: 7}] : [], shakeAt(T, EV2.crash, 0.16, 4.5)));
    // the girder shakes loose its dust and rust along a few metres either side of the hit
    for (let i = 0; i < 6; i++) {
      const s = (i - 2.5) * 1.3;
      const p = {x: at.x + 0.95 * s, y: 0, z: at.z + 0.26 * s};
      const py = 0.173 * ((p.x - 35.32) / 0.95) - 0.1 + (i % 2) * 1.4;
      const q = {x: p.x - 0.26 * 2.6 * (i % 3 === 0 ? 0 : 0.4), y: py, z: p.z};
      out.push(fx(dust3({at: q, t: T, t0: EV2.crash + 0.03 + i * 0.03, key: `d2gd${i}`, n: 3, size: 0.12, grow: 0.42, speed: 0.35, life: 2.4, dir: {x: 0, y: -1, z: 0}, spread: 40, rise: -0.25, color: i % 2 ? '#7A5A44' : '#9C9187', opacity: 0.55, seed: 80 + i})));
      out.push(fx(chips3({at: q, t: T, t0: EV2.crash + 0.05 + i * 0.04, key: `d2gc${i}`, n: 3, dir: {x: 0, y: -1, z: 0}, spread: 50, speed: [0.3, 1.2], size: [0.02, 0.05], material: i % 2 ? 'metal' : 'concrete', ground: G(q.x, q.z), seed: 90 + i})));
    }
  }
  // the machines going down: A and C at the girder's foot, B on the slope, D on the crest
  out.push(landDust(T, 'A', 51), landDust(T, 'B', 52), landDust(T, 'C', 53), landDust(T, 'D', 54));
  // ---- D2-6: the backhand meets the bar he raised; the stumble; the catch (a scuff of feet)
  if (T > EV2.knock - 0.1 && T < EV2.knock + 2.5) {
    const bar = runnerAt(EV2.knock).spec.world?.handL ?? add3(runnerAt(EV2.knock).body.pos, {x: 0.1, y: 1.3, z: 0.1});
    const hp = unitAttach(unitD2('D', EV2.knock)).handR;
    const at = lerpV(hp, bar, 0.4);
    out.push(impact({at, normal: {x: 0.7, y: 0.2, z: 0.6}, t: T, t0: EV2.knock, key: 'd2knock', strength: 0.8, material: 'metal', ground: ground(at), seed: 101}));
    out.push(impact({at: add3(runnerAt(EV2.knock).body.pos, {x: 0.05, y: 1.15, z: 0.05}), normal: {x: -0.6, y: 0.3, z: -0.6}, t: T, t0: EV2.knock + 0.02, key: 'd2knockf', strength: 0.9, material: 'flesh', seed: 102}));
    out.push(fx([], [], shakeAt(T, EV2.knock, 0.05)));
  }
  if (T > EV2.catch - 0.6 && T < EV2.catch + 2) {
    const r = runnerAt(EV2.catch).spec.world!;
    [r.footR!, r.footL!].forEach((f, i) => out.push(fx(dust3({at: {...f, y: f.y + 0.03}, t: T, t0: 110.86 + i * 0.32, key: `d2scuff${i}`, n: 2, size: 0.06, grow: 0.2, speed: 0.45, life: 1.0, dir: {x: -0.5, y: 1, z: -0.5}, spread: 60, color: '#A2968A', opacity: 0.45, seed: 110 + i}))));
  }
  // ---- D2-7: the allied drone takes D's blow (sparks, a wobble, a wisp); the Director's plate drives D down
  out.push(allyDrone(allyOpts(T)));
  if (T > EV2.shield - 0.1 && T < EV2.shield + 2) out.push(impact({at: SHIELD_AT, normal: {x: 0.75, y: 0.3, z: 0.55}, t: T, t0: EV2.shield, key: 'd2shield', strength: 1.2, material: 'metal', seed: 121}));
  if (T > EV2.counter - 0.1 && T < EV2.counter + 3) {
    const d = unitAttach(unitD2('D', EV2.counter));
    const at = lerpV(d.chest, d.shoulderR, 0.5);
    out.push(impact({at, normal: {x: 0.72, y: 0.2, z: -0.69}, t: T, t0: EV2.counter, key: 'd2counter', strength: 1.5, material: 'armor', ground: ground(at), seed: 131}));
    out.push(fx(ring3({at, normal: {x: 0.72, y: 0.1, z: -0.69}, t: T, t0: EV2.counter, key: 'd2counterr', r0: 0.1, speed: 6.5, dur: 0.16, width: 0.05})));
    out.push(fx([], [], shakeAt(T, EV2.counter, 0.08)));
  }
  return combine(...(out.filter(Boolean) as FxOut[]));
};

/** the girder's shudder after the crash: a flex of its span (fixed at the ground end and the column), metres */
export const girderShudder = (T: number) => (T < EV2.crash ? 0 : 0.07 * Math.exp(-(T - EV2.crash) * 3.2) * Math.sin((T - EV2.crash) * 2 * Math.PI * 7.5));
void [rnd, smooth, EV2];
