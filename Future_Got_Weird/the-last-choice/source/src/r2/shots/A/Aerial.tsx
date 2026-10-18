// A1 (0.00–6.60): New York falls. A dusk aerial high over the west end of the district, drifting east and down along
// the avenue toward the skyline. Near roofs slide under the lens while the skyline barely moves; fires burn on several
// blocks (each with a source), smoke leans north-east, machine formations stream west along the avenue and out of the
// cross streets as moving eye-lights and silhouettes (every lane steered round the wrecks: shots/A/army.ts), drones
// drift above them. On LOW_HIT the failing tower (east-north-east) starts to go: the top section tilts and drops into
// its own dust, and keeps falling until the cut to black.
//
// R3: three distinct damage events, each leaving its result in the set for the rest of the film (world/plan.ts
// A1_EVENTS; the falling pieces and the heap are world/set.tsx's) and each with a fire source for ATMOS (FIRE_SITES):
//   E1 1.30  a six-storey section of FS7's west wall (face-on to the lens, right of the avenue) tears loose at the
//            top, leans out (1.30–1.80), breaks off and falls in three pieces toward the rubble lot below it, dust
//            pouring from the break; it lands below the frame (~4.9–5.6) and its floors burn in the heap from then on
//   E2 2.90  high on FN11 (the tall stepped tower left of the avenue) a fireball blows two floors of windows out over
//            the avenue: glass rains down, the room burns from then on
//   E3 5.60  the box truck at the north kerb (x 405), among the streaming columns, goes up: a fireball, sparks, its fire
import React from 'react';
import {Stage, useShotTime, camPath, fadeIn} from '../../film/stage';
import {AERIAL, A1_EVENTS, FIRE_SITES, STREET_OBSTACLES} from '../../world';
import {groundH} from '../../world/ground';
import {openingFor, CITY, wallPoint} from '../../world/city';
import {peelState} from '../../world/set';
import {armyItems, straightPath, drone, heavy} from '../../mech';
import {blast, dust3, chips3, sparks3, combine, fx} from '../../fx';
import type {FxOut} from '../../fx';
import type {Item} from '../../engine';
import {M} from '../../timing';
import {A1_ARMY, A1_HEAVIES, A1_DRONES} from './army';

const ground = (x: number, z: number) => groundH(x, z);
/** fires whose smoke crosses E1's wall from this lens */
const A1_THIN = ['wreck6', 'bldN4'];
const DUR = M.TITLE_IN;

/** where the events happen (world), resolved once */
const EV = (() => {
  const pe = A1_EVENTS.peel;
  const st = peelState(0);
  const blow = FIRE_SITES.find((q) => q.id === A1_EVENTS.blowout.site)!;
  const o = openingFor(blow.pos, 14);
  const truck = STREET_OBSTACLES.find((q) => q.id === A1_EVENTS.truck.obstacle)!;
  const b = CITY().find((q) => q.id === pe.bld)!;
  const um = (pe.u0 + pe.u1) / 2;
  return {
    peelTop: wallPoint(b, pe.side, um, pe.y1, 0.4),
    peelHinge: wallPoint(b, pe.side, um, pe.y0, 0.4),
    peelN: wallPoint(b, pe.side, 0, 0, 1),
    peelO: wallPoint(b, pe.side, 0, 0, 0),
    lands: st.map((s) => s.land),
    rest: peelState(99).map((s) => s.c),
    blowAt: o ? {x: o.center.x + o.normal.x * 3.5, y: o.center.y, z: o.center.z + o.normal.z * 3.5} : blow.pos,
    blowN: o ? o.normal : {x: 0, y: 0, z: -1},
    truck: {x: truck.x, y: groundH(truck.x, truck.z) + 1.8, z: truck.z},
  };
})();

/** the events' effects at film time T (dust, chips, glass, fireballs; the set draws the pieces and the heap) */
export const a1EventFx = (T: number): FxOut => {
  const pe = A1_EVENTS.peel;
  const out: (FxOut | null)[] = [];
  const N = {x: EV.peelN.x - EV.peelO.x, y: 0, z: EV.peelN.z - EV.peelO.z}; // the wall's outward normal
  // E1: the crack opening along the top (a thin spurt of dust and chips at the seam), the break at the base, and
  // each falling piece shedding chips and a short dust trail — kept small and outside the wall so the tearing section
  // itself stays readable
  if (T >= pe.t0 && T < pe.t0 + 3) {
    const seam = {x: EV.peelTop.x + N.x * 0.6, y: EV.peelTop.y, z: EV.peelTop.z + N.z * 0.6};
    out.push(fx([
      ...dust3({at: seam, t: T, t0: pe.t0, key: 'a1e1_d0', n: 4, size: 0.7, grow: 1.1, speed: 2.2, life: 1.8, dir: {x: N.x, y: 0.6, z: N.z}, spread: 50, color: '#B0A699', opacity: 0.55, seed: 11, rise: 1.4}),
      ...chips3({at: seam, t: T, t0: pe.t0, key: 'a1e1_c0', n: 10, dir: {x: N.x, y: 0.2, z: N.z}, spread: 60, speed: [2, 6], size: [0.25, 0.6], material: 'brick', ground: 0.1, seed: 12, life: 3}),
    ]));
  }
  if (T >= pe.tb && T < pe.tb + 3.2) {
    const seam = {x: EV.peelHinge.x + N.x * 1.2, y: EV.peelHinge.y - 0.5, z: EV.peelHinge.z + N.z * 1.2};
    out.push(fx([
      ...dust3({at: seam, t: T, t0: pe.tb, key: 'a1e1_d1', n: 5, size: 0.9, grow: 1.4, speed: 2.4, life: 2.4, dir: {x: N.x, y: -0.5, z: N.z}, spread: 60, color: '#B0A699', opacity: 0.6, seed: 13, rise: 0.3}),
      ...chips3({at: seam, t: T, t0: pe.tb, key: 'a1e1_c1', n: 16, dir: {x: N.x, y: -0.3, z: N.z}, spread: 70, speed: [2, 7], size: [0.3, 0.8], material: 'brick', ground: 0.1, seed: 14, life: 3.4}),
    ]));
  }
  // falling pieces shed debris from their lower edges (a burst every ~0.35 s while they fall)
  peelState(T).forEach((st, k) => {
    if (st.phase !== 'fall') return;
    for (let j = 0; j < 6; j++) {
      const t0 = pe.tb + 0.2 + j * 0.35;
      if (T < t0 || T > t0 + 1.6 || t0 > st.land) continue;
      const p = peelState(t0)[k].c;
      out.push(fx(chips3({at: {x: p.x + N.x * 1.5, y: p.y - 2.5, z: p.z + N.z * 1.5}, t: T, t0, key: `a1e1_f${k}_${j}`, n: 4, dir: {x: N.x, y: -0.2, z: N.z}, spread: 80, speed: [1, 3], size: [0.25, 0.6], material: 'brick', ground: 0.1, seed: 60 + k * 7 + j, life: 1.6})));
    }
  });
  EV.lands.forEach((tl, k) => {
    if (T < tl || T > tl + 4) return;
    const c = EV.rest[k];
    const at = {x: c.x, y: 0.6, z: c.z};
    out.push(fx([
      ...dust3({at, t: T, t0: tl, key: `a1e1_l${k}`, n: 12, ring: 2.5, speed: 9, size: 2.4, grow: 3.4, life: 3.6, color: '#A39A90', opacity: 0.8, seed: 20 + k, rise: 1.6}),
      ...chips3({at: {...at, y: 1.2}, t: T, t0: tl, key: `a1e1_lc${k}`, n: 14, dir: {x: 0, y: 1, z: 0.4}, spread: 75, speed: [3, 8], size: [0.3, 0.9], material: 'concrete', ground: 0.1, seed: 30 + k, life: 3}),
    ]));
  });
  // E2: the blow-out — fireball out of the room, glass raining onto the avenue
  const tB = A1_EVENTS.blowout.t0;
  if (T >= tB && T < tB + 4) {
    out.push(blast({at: EV.blowAt, t: T, t0: tB, key: 'a1e2', size: 12, seed: 41, debris: 'glass', dir: EV.blowN}));
    out.push(fx(chips3({at: EV.blowAt, t: T, t0: tB, key: 'a1e2_g', n: 34, dir: {x: EV.blowN.x, y: 0.25, z: EV.blowN.z}, spread: 60, speed: [6, 18], size: [0.35, 1.0], material: 'glass', ground: 0.1, seed: 42, life: 3.5})));
  }
  // E3: the truck catches — its tank goes up in a fireball, sparks, then ATMOS's fire along its body (FIRE_SITES a1_truck)
  const tC = A1_EVENTS.truck.t0;
  if (T >= tC && T < tC + 3) {
    out.push(blast({at: {...EV.truck, y: EV.truck.y + 1.5}, t: T, t0: tC, key: 'a1e3', size: 8.5, seed: 51, debris: 'metal', dir: {x: 0, y: 1, z: 0}}));
    out.push(fx(sparks3({at: EV.truck, t: T, t0: tC, key: 'a1e3_s', n: 28, dir: {x: 0, y: 1, z: 0}, spread: 70, speed: [5, 14], ground: 0.1, seed: 52})));
  }
  const c = combine(...out);
  return {...c, shake: 0};
};

export const AerialA1: React.FC = () => {
  const {t, T} = useShotTime(0);
  const cam = camPath(
    [
      {t: 0, pos: AERIAL.from.pos, target: AERIAL.from.target, fov: 44},
      {t: DUR, pos: AERIAL.to.pos, target: AERIAL.to.target, fov: 42},
    ],
    t,
    0.35,
  );
  const ev = a1EventFx(T);
  const items = (v: Parameters<typeof armyItems>[0]): Item[] => [
    ...armyItems(v, T, A1_ARMY, {ground, maxFull: 0, maxMid: 12, farFrom: 60, eye: 'cyan'}),
    ...A1_HEAVIES.flatMap((h, k) =>
      heavy({id: 700 + k, t: T, pos: {x: h.x, y: 0, z: h.z}, heading: 270, gait: {path: straightPath({x: h.x + 40, y: 0, z: h.z}, 270), dist: (T + 40) * 0.9}, ground, lod: 'far'}),
    ),
    ...A1_DRONES.flatMap((d, i) =>
      drone({id: 760 + i, t: T, pos: {x: d.x - T * 6, y: d.y + Math.sin(T * 0.9 + d.ph) * 1.2, z: d.z + Math.sin(T * 0.5 + d.ph) * 2}, heading: 270, vel: {x: -6, y: 0, z: 0}, eye: 'cyan', lod: 'far', scale: 1.8}),
    ),
    ...ev.items,
  ];
  // from this lens the plumes of the burning wreck (wreck6) and FN7's burning room (bldN4) drift across FN10's west
  // wall, where E1 happens: thinner in this shot only (ATMOS's fireSmoke option), so the tearing wall reads
  return <Stage T={T} cam={cam} items={items} lights={ev.lights} drift={0.25} black={fadeIn(t, 0.55)} vignette={0.6} atmos={{fireSmoke: (id: string) => (A1_THIN.includes(id) ? 0.3 : 1)}} />;
};
