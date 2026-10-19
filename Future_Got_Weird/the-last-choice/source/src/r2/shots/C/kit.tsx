// Section C shared drawing: the Crew as sprites, the allied drone, the smoke over the west ruin they come out of,
// footfall dust and grit on the rubble (walks and climbs), the contacts' dust/chips (the vault, the palms on rubble, the
// drone's downwash), the vault wall, and the army beyond the crater — drawn exactly as D1 draws it (B's halted army
// minus the vanguard units D1 animates, those units and the reserve from D1's own specs), so the front rank that breaks
// into its run at 57.1 in C6 is the same machines, at the same places, that D1-1 cuts to.
import React from 'react';
import {V3, add3, clamp, rnd} from '../../../kit/math';
import type {Item, View, SpriteItem} from '../../engine';
import {toView, project} from '../../engine';
import {figureSprite} from '../../rig';
import type {FigSpec} from '../../rig';
import {allyDrone, dust3, chips3, combine, fx, FxOut} from '../../fx';
import type {ColumnOpts} from '../../world/atmos';
import {persistItems} from '../../film/continuity';
import {combatUnit, drone, heavy, armyItems} from '../../mech';
import type {Formation, UnitSpec} from '../../mech';
import {ARMY_B, HEAVIES_B, DRONES_B, heavySpecB, droneSpecB} from '../B/army';
import {unitD1, FRONT, RESERVE_NAMES, enemyDrones, D1_ARMY_IDS, unitFootfalls} from '../D1/machines';
import {groundH} from '../../world/ground';
import {crewC, droneC, DRONE_SPIN, RoleC, ROLES_C, WALKS_C, CLIMBS_C, VAULT_GRIP, HOP, hopLandings, hopPalm} from './crew';
import {runDist, gaitC, climbPlants} from './motion';
import {GC} from './ground';
import {vaultWallItems} from './props';
import {TR, T3} from './beats';

// ------------------------------------------------------------------ smoke over the west ruin (and the south-west edge)
export const C_COLUMNS: {key: string; base: V3; o: ColumnOpts}[] = [
  {key: 'cRu1', base: {x: -19.4, y: 0.9, z: -2.0}, o: {n: 7, life: 15, rise: 0.22, r0: 2.0, r1: 4.6, drift: 0.32, dark: 0.12, alpha: 0.5, warm: 0.12, seed: 41}},
  {key: 'cRu2', base: {x: -20.2, y: 1.0, z: 2.6}, o: {n: 7, life: 15, rise: 0.22, r0: 2.0, r1: 4.6, drift: 0.32, dark: 0.14, alpha: 0.48, warm: 0.12, seed: 42}},
  {key: 'cRu3', base: {x: -18.8, y: 0.8, z: -5.6}, o: {n: 5, life: 14, rise: 0.25, r0: 1.8, r1: 4.2, drift: 0.35, dark: 0.18, alpha: 0.42, warm: 0.1, seed: 43}},
  {key: 'cSW1', base: {x: -13.2, y: 0.6, z: 14.4}, o: {n: 6, life: 14, rise: 0.3, r0: 1.8, r1: 4.4, drift: 0.45, dark: 0.18, alpha: 0.5, warm: 0.15, seed: 45}},
];

// ------------------------------------------------------------------ the Crew
export type CrewDraw = {only?: RoleC[]; skip?: RoleC[]; anchor?: Partial<Record<RoleC, V3>>; bias?: Partial<Record<RoleC, number>>};
export const crewItems = (v: View, T: number, o: CrewDraw = {}): Item[] => {
  const c = crewC(T, v);
  const out: Item[] = [];
  for (const r of o.only ?? ROLES_C) {
    if (o.skip?.includes(r)) continue;
    const spec: FigSpec = {...c[r].spec, anchor: o.anchor?.[r] ?? c[r].spec.anchor, bias: o.bias?.[r] ?? c[r].spec.bias};
    if (toView(v, spec.pos).z < 0.25 && !o.anchor?.[r]) continue;
    out.push({...figureSprite(spec), noCull: true});
  }
  // the runner in the air over the wall: his shadow on the ground under him (the rig's contact shadow is off then)
  if (T > TR.hand - 0.02 && T < TR.land + 0.02 && !(o.skip ?? []).includes('runner')) {
    const p = c.runner.body.pos;
    const g: V3 = {x: p.x + 0.15, y: GC(p.x + 0.15, p.z + 0.1) + 0.01, z: p.z + 0.1};
    const h = p.y - g.y;
    out.push({kind: 'sprite', key: 'cRunSh', pos: g, bias: -0.3, draw: (cx) => {
      const a = project(cx.view, g);
      const k = clamp(1 - h / 1.6);
      return <ellipse cx={a.x} cy={a.y} rx={0.42 * a.k} ry={0.12 * a.k} fill="#0E0B0A" opacity={0.35 * k} />;
    }});
  }
  return out;
};

// ------------------------------------------------------------------ the allied drone
export const droneFx = (T: number): FxOut => (T < T3.go - 0.5 ? fx() : allyDrone({key: 'cAlly', t: T, pose: droneC, spinUp: DRONE_SPIN, ground: 0, seed: 3}));

// ------------------------------------------------------------------ dust and grit
/** every footfall of the Crew in (T − win, T] on a walk or a climb (world point, time, how hard) */
const footfalls = (T: number, win = 1.3): {t: number; p: V3; key: string; k: number}[] => {
  const out: {t: number; p: V3; key: string; k: number}[] = [];
  for (const [who, walks] of Object.entries(WALKS_C)) walks.forEach((w, wi) => {
    const A = w.A ?? 0.8, D = w.D ?? 0.7, Ls = w.path.Ls;
    const a = Math.max(w.T0, T - win), b = Math.min(T, w.T1);
    if (b <= a) return;
    const s = (t: number) => runDist(t, w.T0, w.T1, Ls, A, D);
    const s0 = s(a), s1 = s(b), W = w.gait.stride;
    for (const phi of [0, 0.5]) {
      // a foot plants when s / W + phi crosses an integer
      for (let k = Math.ceil(s0 / W + phi); k - phi <= s1 / W && k < 1e4; k++) {
        const sk = (k - phi) * W;
        if (sk < 0.3) continue;
        let lo = a, hi = b;
        for (let i = 0; i < 18; i++) { const m = (lo + hi) / 2; if (s(m) < sk) lo = m; else hi = m; }
        const g = gaitC(w.path, sk + W * w.gait.duty * 0.5 + 1e-3, w.gait);
        const sp = (s(hi + 0.03) - s(hi - 0.03)) / 0.06;
        out.push({t: hi, p: phi === 0 ? g.footR : g.footL, key: `${who}${wi}_${k}_${phi}`, k: clamp(sp / 3)});
      }
    }
  });
  for (const [who, climbs] of Object.entries(CLIMBS_C)) climbs.forEach((c, ci) => {
    if (T < c.T0 || T > c.T1 + win) return;
    // (the runner's steps 7-8 are the bound now: its landings are the next two footfalls)
    climbPlants(c).forEach((f, i) => { if (who === 'runner' && f.t > HOP.t0 && f.t < HOP.t1) return; if (f.t <= T && f.t > T - win) out.push({t: f.t, p: f.p, key: `${who}c${ci}_${i}`, k: 0.25 + 0.5 * f.k}); });
  });
  { const lg = hopLandings(); [[HOP.landL, lg.L, 'L'], [HOP.landR, lg.R, 'R']].forEach(([t, p, n]) => { if ((t as number) <= T && (t as number) > T - win) out.push({t: t as number, p: p as V3, key: `runnerHop${n}`, k: 0.95}); }); }
  return out;
};
export const dustFx = (T: number, o: {near?: V3; maxDist?: number} = {}): FxOut => {
  const out: FxOut[] = [];
  footfalls(T).forEach((f, i) => {
    if (o.near && Math.hypot(f.p.x - o.near.x, f.p.z - o.near.z) > (o.maxDist ?? 30)) return;
    const k = 0.35 + 0.65 * f.k;
    out.push(fx(dust3({at: {...f.p, y: f.p.y + 0.03}, t: T, t0: f.t, key: `cff_${f.key}`, n: 3, size: 0.05, grow: 0.22 * k, speed: 0.45, life: 1.1, dir: {x: 0, y: 1, z: 0}, spread: 70, rise: 0.2, color: '#A89E92', opacity: 0.5 * k, seed: 300 + i})));
    if (f.k > 0.5) out.push(fx(chips3({at: {...f.p, y: f.p.y + 0.03}, t: T, t0: f.t, key: `cfc_${f.key}`, n: 2, dir: {x: 0, y: 1, z: 0}, spread: 55, speed: [0.5, 1.5], size: [0.012, 0.03], material: 'concrete', ground: f.p.y, life: 1.2, seed: 500 + i})));
  });
  // the vault: grit off the wall's top under his palm; the landing (right, then left)
  const g = VAULT_GRIP;
  if (T > TR.hand - 0.1 && T < TR.hand + 3) {
    out.push(fx(chips3({at: add3(g, {x: 0.05, y: 0.02, z: 0}), t: T, t0: TR.hand, key: 'cvChip', n: 7, dir: {x: 0.5, y: 0.6, z: 0.4}, spread: 70, speed: [0.5, 1.6], size: [0.008, 0.022], material: 'concrete', ground: GC(g.x + 0.4, g.z), life: 2.5, seed: 61})));
    out.push(fx(dust3({at: g, t: T, t0: TR.hand, key: 'cvDust', n: 4, size: 0.04, grow: 0.16, speed: 0.4, life: 1.3, rise: 0.12, color: '#B2A696', opacity: 0.55, seed: 62})));
  }
  if (T > TR.land - 0.1 && T < TR.land + 3) {
    const c = crewC(TR.land + 0.15).runner;
    const fr = c.spec.world?.footR, fl = c.spec.world?.footL;
    if (fr) out.push(fx(dust3({at: {...fr, y: GC(fr.x, fr.z) + 0.03}, t: T, t0: TR.land, key: 'cvLand', ring: 0.3, n: 6, size: 0.07, grow: 0.3, speed: 0.8, life: 1.5, rise: 0.2, color: '#A89E92', opacity: 0.65, seed: 63})));
    if (fl) out.push(fx(dust3({at: {...fl, y: GC(fl.x, fl.z) + 0.03}, t: T, t0: TR.land + 0.1, key: 'cvLand2', n: 4, size: 0.06, grow: 0.25, speed: 0.6, life: 1.3, rise: 0.15, color: '#A89E92', opacity: 0.55, seed: 64})));
    if (fr) out.push(fx(chips3({at: {...fr, y: GC(fr.x, fr.z) + 0.03}, t: T, t0: TR.land, key: 'cvLandC', n: 6, dir: {x: 0.3, y: 1, z: 0.2}, spread: 65, speed: [0.8, 2.2], size: [0.015, 0.04], material: 'concrete', ground: GC(fr.x, fr.z), life: 1.6, seed: 65})));
  }
  // palms on the rubble (every climb's hand plants)
  let pi = 0;
  for (const [who, climbs] of Object.entries(CLIMBS_C)) climbs.forEach((c, ci) => c.hands.forEach((h, hi) => {
    const i = pi++;
    if (T < h.on - 0.1 || T > h.on + 2.5) return;
    const key = `cph_${who}${ci}_${hi}`;
    out.push(fx(dust3({at: h.p, t: T, t0: h.on + 0.02, key, n: 4, size: 0.04, grow: 0.16, speed: 0.4, life: 1.2, rise: 0.12, color: '#ADA193', opacity: 0.55, seed: 70 + i})));
    out.push(fx(chips3({at: h.p, t: T, t0: h.on + 0.02, key: `${key}c`, n: 4, dir: {x: 0, y: 1, z: 0}, spread: 60, speed: [0.3, 1.0], size: [0.008, 0.02], material: 'concrete', ground: h.p.y - 0.03, life: 1.6, seed: 80 + i})));
  }));
  // the bound's palm (R4): grit off the rubble under his left palm
  if (T > HOP.palmOn - 0.1 && T < HOP.palmOn + 2.5) {
    const hp = hopPalm(HOP.palmOn).p;
    out.push(fx(dust3({at: hp, t: T, t0: HOP.palmOn + 0.02, key: 'chopD', n: 4, size: 0.04, grow: 0.16, speed: 0.4, life: 1.2, rise: 0.12, color: '#ADA193', opacity: 0.55, seed: 78})));
    out.push(fx(chips3({at: hp, t: T, t0: HOP.palmOn + 0.02, key: 'chopC', n: 5, dir: {x: 0, y: 1, z: 0}, spread: 60, speed: [0.3, 1.1], size: [0.008, 0.02], material: 'concrete', ground: hp.y - 0.03, life: 1.6, seed: 79})));
  }
  // the drone's downwash as it spins up over the pilot's palm: dust off the slope at her feet
  if (T > T3.spin && T < T3.lift + 2.5) {
    const c = crewC(T3.spin).drone.body.pos;
    for (let i = 0; i < 3; i++) out.push(fx(dust3({at: {x: c.x + (rnd(i * 3) - 0.5) * 0.6, y: GC(c.x, c.z) + 0.04, z: c.z + (rnd(i * 5) - 0.5) * 0.6}, t: T, t0: T3.spin + 0.25 + i * 0.22, key: `cdw${i}`, ring: 0.4, n: 4, size: 0.05, grow: 0.3, speed: 0.9, life: 1.2, rise: 0.05, color: '#A89E92', opacity: 0.45, seed: 90 + i})));
  }
  return combine(...out);
};

// ------------------------------------------------------------------ the set additions and the world beyond
/** C's own dressing (the vault wall) and everything earlier sections left (B's slab, D1's cover slab …) */
export const setC = (v: View, T: number): Item[] => [...vaultWallItems(), ...persistItems(v, T, {exceptSec: 'C'})];
/** B's halted army without the vanguard units D1 animates (D1/battle.tsx ARMY_REST) */
const ARMY_REST: Formation = {slots: (T) => ARMY_B.slots(T).filter((sl) => !D1_ARMY_IDS.has(sl.id))};
/**
 * The army beyond the crater as D1 draws it: the rest at their halt, the vanguard's front units and the reserve from
 * D1's specs (still until 57.0, then the front breaks into its run and the reserve steps up), the heavies, B's drones
 * and the enemy drones low over the crater. LOD by distance to the view; only what is in front of it.
 */
export const armyC = (v: View, T: number, o: {full?: number; far?: number; maxMid?: number; farFrom?: number} = {}): Item[] => {
  const items: Item[] = [];
  const full = o.full ?? 26, far = o.far ?? 90;
  const lodOf = (p: V3) => {
    const d = Math.hypot(p.x - v.pos.x, p.y - v.pos.y, p.z - v.pos.z);
    return d < full ? 'full' : d < far ? 'mid' : 'far';
  };
  const draw = (name: string) => {
    const s: UnitSpec = unitD1(name, T);
    const p = s.gait ? s.gait.path(s.gait.dist).pos : s.pos;
    if (toView(v, {x: p.x, y: groundH(p.x, p.z) + 1.1, z: p.z}).z < -2) return;
    items.push(...combatUnit({...s, lod: lodOf(p)}));
  };
  FRONT.forEach(draw);
  RESERVE_NAMES.forEach(draw);
  items.push(...armyItems(v, T, ARMY_REST, {ground: groundH, maxFull: 0, maxMid: o.maxMid ?? 16, farFrom: o.farFrom ?? 75, ctl: () => ({idle: 0.4})}));
  HEAVIES_B.forEach((h, i) => {
    const l = lodOf({x: h.rest.x, y: 3, z: h.rest.z});
    items.push(...heavy(heavySpecB(i, T, {lod: l === 'full' ? 'mid' : l, look: {x: 44, y: 1.5, z: 0}, key: `d1hv${h.id}`})));
  });
  DRONES_B.forEach((_, i) => items.push(...drone({...droneSpecB(i, T), lod: 'far'})));
  enemyDrones(T).forEach((d) => items.push(...drone({...d, lod: lodOf(d.pos) === 'far' ? 'far' : 'full'})));
  return items;
};
/** dust under the front units' first strides (D1's own footfalls) */
export const armyDustFx = (T: number): FxOut => {
  if (T < 57.0) return fx();
  return combine(...unitFootfalls(T, 0.9).map((f, i) => fx(dust3({at: {...f.pos, y: f.pos.y + 0.03}, t: T, t0: f.t, key: `cuf_${f.key}`, n: 2, size: 0.09, grow: 0.3, speed: 0.6, life: 1.0, spread: 70, rise: 0.2, color: '#8A8078', opacity: 0.5, seed: 700 + i}))));
};
export type {SpriteItem};
