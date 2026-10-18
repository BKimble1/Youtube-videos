// Section D3: everything in the world at film time T for a given view — the Crew (sprites; the breaker's hand on the
// runner's shoulder at the start and the Director's grab on the decoy maker solved per view with handOn), heavy 1 (blinded, pinned, toppled:
// its wreck), heavy 2, the 27 units of the arc, B's halted army until FORMATION (then the tableau's reserve block and
// the streams that D4 shows), the drones, the earlier sections' wrecks and the section's FX. Off-screen machines are
// culled (the avenue's army alone is ~1000 slots). Shots pick a camera and call d3Items().
import type {Item, View} from '../../engine';
import {toView, viewToScreen} from '../../engine';
import {V3} from '../../../kit/math';
import {combatUnit, drone, heavy, armyItems, standing, UnitSpec, Formation} from '../../mech';
import {figureSprite, FigSpec, handOn, Role2, SH_X, SH_H} from '../../rig';
import {persistItems} from '../../film/continuity';
import {FxOut} from '../../fx';
import {ARMY_B, HEAVIES_B, DRONES_B, heavySpecB, droneSpecB} from '../B/army';
import {D1_ARMY_IDS} from '../D1/machines';
import {unitD2, YIELD_NAMES, YIELD_IDS} from '../D2/machines';
import {TB_RESERVE, streamForm} from '../EF/tableau';
import {M} from '../../timing';
import {G} from '../D4/motion';
import {EV3} from './times';
import {heavy1D3, heavy2D3, ARC, arcUnit, VAN_TAKEN, dronesD3, DRONE_SRC_IDS} from './machines';
import {crewAt, ROLES} from './crew';
import {d3Fx} from './fx';

/** the switch of the far army: B's halted army until FORMATION, the tableau's reserve and streams after (D4's) */
export const ARMY_SWITCH = M.FORMATION;

export type D3Opts = {
  crew?: Role2[];
  tweak?: Partial<Record<Role2, Partial<FigSpec>>>;
  /** arc units to skip (tableau ids) / per-unit depth bias */
  skipUnits?: number[];
  unitBias?: Record<number, number>;
  /** leave out the far army (close shots) */
  near?: boolean;
  /** full-mesh radius (m) for machines; mid beyond, far sprites beyond `far` */
  full?: number; far?: number;
  maxFull?: number;
  extra?: Item[];
};

const onScreen = (v: View, p: V3, m = 0.15, up = 1.0): boolean => {
  const q = toView(v, {x: p.x, y: G(p.x, p.z) + up, z: p.z});
  if (q.z < 0.3) return false;
  const s = viewToScreen(v, q);
  const mm = q.z < 8 ? m + 0.35 : m;
  return s.x > -mm * v.W && s.x < (1 + mm) * v.W && s.y > -(mm + 0.3) * v.H && s.y < (1 + mm + 0.3) * v.H;
};
const culled = (f: Formation, v: View, maxD = Infinity): Formation => ({
  slots: (t) => f.slots(t).filter((s) => onScreen(v, s.pos) && Math.hypot(s.pos.x - v.pos.x, s.pos.z - v.pos.z) < maxD),
});
/** B's halted army minus the vanguard units D1, D2 and D3 animate themselves */
const ARMY_REST: Formation = {slots: (T) => ARMY_B.slots(T).filter((sl) => !D1_ARMY_IDS.has(sl.id) && !YIELD_IDS.has(sl.id) && !VAN_TAKEN.has(sl.id))};

/** the breaker's hand on the runner's shoulder (D2's last frames); the Director's hand on the decoy maker's arm (the
 *  grab on the crest, the haul west, until the blast throws them apart) */
const pairs = (v: View, T: number, s: Partial<Record<Role2, FigSpec>>) => {
  if (s.runner && s.breaker && T < 117.5) {
    const w = 1 - Math.min(1, Math.max(0, (T - 117.25) / 0.25));
    s.breaker = handOn(v, s.runner, {r: SH_X - 10, u: SH_H + 12, f: -6}, s.breaker, 'R', w * w * (3 - 2 * w), {palm: {x: 0, y: -1, z: 0}});
  }
  if (s.decoy && s.director && T > EV3.grab - 0.14 && T < EV3.blast + 0.02) {
    const a = Math.min(1, Math.max(0, (T - (EV3.grab - 0.14)) / 0.14)), b = 1 - Math.min(1, Math.max(0, (T - (EV3.blast - 0.04)) / 0.06));
    const w = Math.min(a * a * (3 - 2 * a), b);
    s.director = handOn(v, s.decoy, {r: -SH_X - 4, u: SH_H - 44, f: 2}, s.director, 'R', w);
  }
};

export const d3Items = (v: View, T: number, o: D3Opts = {}): Item[] => {
  const items: Item[] = [];
  const specs: Partial<Record<Role2, FigSpec>> = {};
  (o.crew ?? ROLES).forEach((r) => { specs[r] = {...crewAt(r, T).spec, ...(o.tweak?.[r] ?? {})}; });
  pairs(v, T, specs);
  (Object.keys(specs) as Role2[]).forEach((r) => {
    const s = specs[r]!;
    if (toView(v, s.pos).z < 0.3) return;
    items.push(figureSprite(s));
  });
  const full = o.full ?? 28, far = o.far ?? 90;
  const dist = (p: V3) => Math.hypot(p.x - v.pos.x, p.y - v.pos.y, p.z - v.pos.z);
  // ---- the arc's 27 (and D2's yielded units until the switch)
  const units: {key: string; spec: UnitSpec; bias?: number}[] = [];
  ARC.forEach((u) => { if (!o.skipUnits?.includes(u.id)) units.push({key: String(u.id), spec: arcUnit(u, T), bias: o.unitBias?.[u.id]}); });
  if (T < ARMY_SWITCH) YIELD_NAMES.forEach((n) => units.push({key: n, spec: unitD2(n, T)}));
  const ranked = units.map((u) => {
    const p = u.spec.gait ? u.spec.gait.path(u.spec.gait.dist).pos : u.spec.pos;
    const q = {x: p.x, y: G(p.x, p.z) + 1.1, z: p.z};
    return {...u, p, d: dist(q), z: toView(v, q).z};
  }).filter((u) => u.z > -2 && (u.d < 4 || onScreen(v, u.p, 0.2))).sort((a, b) => a.d - b.d);
  const maxFull = o.maxFull ?? 16;
  ranked.forEach((u, i) => {
    const lod: UnitSpec['lod'] = i < maxFull && u.d < full ? 'full' : u.d < far ? 'mid' : 'far';
    const its = combatUnit({...u.spec, lod});
    items.push(...(u.bias ? its.map((it) => (it.kind === 'raw' ? it : {...it, bias: (it.bias ?? 0) + u.bias!})) : its));
  });
  // ---- heavy 1, heavy 2
  const h1 = heavy1D3(T), h1p = heavyAttach1(h1);
  if (toView(v, {...h1p, y: h1p.y + 2}).z > -10) { const d = dist(h1p); items.push(...heavy({...h1, lod: d < 70 ? 'full' : d < 220 ? 'mid' : 'far'})); }
  const h2 = heavy2D3(T);
  if (toView(v, {...h2.pos, y: G(h2.pos.x, h2.pos.z) + 4}).z > -8) { const d = dist(h2.pos); items.push(...heavy({...h2, lod: d < 60 ? 'full' : d < 200 ? 'mid' : 'far'})); }
  // ---- drones (the tableau's eight; B's sky until the switch)
  dronesD3(T).forEach((d) => {
    if (toView(v, d.pos).z < -2) return;
    const dd = dist(d.pos);
    items.push(...drone({...d, lod: dd < 45 ? 'full' : 'far', scale: dd > 120 ? 1.6 : 1}));
  });
  if (!o.near) {
    if (T < ARMY_SWITCH) {
      items.push(...armyItems(v, T, culled(ARMY_REST, v), {ground: G, maxFull: 0, maxMid: 16, farFrom: 75, ctl: () => ({idle: 0.4})}));
      HEAVIES_B.forEach((h, i) => {
        if (i === 0 || i === 2) return; // heavy 1, and heavy 2 (drawn above)
        if (!onScreen(v, h.rest, 0.3, 3)) return;
        const d = dist({x: h.rest.x, y: 3, z: h.rest.z});
        items.push(...heavy(heavySpecB(i, T, {lod: d < 60 ? 'mid' : 'far', look: {x: 56, y: 1.5, z: -2}, key: `d3hv${h.id}`})));
      });
      DRONES_B.forEach((d, i) => { if (!DRONE_SRC_IDS.has(d.id)) items.push(...drone({...droneSpecB(i, T), lod: 'far'})); });
    } else {
      items.push(...armyItems(v, T, culled(standing(TB_RESERVE), v), {ground: G, maxFull: 1, maxMid: 8, farFrom: 110, ctl: () => ({idle: 0.18})}));
      items.push(...armyItems(v, T, culled(streamForm(), v, v.pos.y > 8 ? Infinity : 320), {ground: G, maxFull: 0, maxMid: 6, farFrom: 120}));
    }
  }
  items.push(...persistItems(v, T, {exceptSec: 'D3', lod: {full: 30, mid: 120}}));
  items.push(...(o.extra ?? []));
  return items;
};
const heavyAttach1 = (h: ReturnType<typeof heavy1D3>): V3 => (h.gait ? h.gait.path(h.gait.dist).pos : h.pos);
/** the section's FX at T (camera independent) */
export const d3FxAt = (T: number): FxOut => d3Fx(T);
