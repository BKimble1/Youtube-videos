// Section D2: everything in the battle at film time T for a given view — the Crew (sprites; the catch and the hand
// on the shoulder solved per view with the rig's support hierarchy), D2's named machines (LOD by distance), the
// reserve and B's halted army behind them, heavy 1 and the far heavies, enemy drones, D1's wrecks and the cover slab,
// the girder (redrawn so it can shudder), and the section's FX. Shots pick a camera and call d2Items().
import type {Item, View, MeshItem} from '../../engine';
import {toView, prep} from '../../engine';
import {V3, add3, mul3, clamp, smooth, lerp} from '../../../kit/math';
import {combatUnit, drone, heavy, armyItems, UnitSpec} from '../../mech';
import type {Formation} from '../../mech';
import {figureSprite, FigSpec, supportCatch, handOn, SH_X, SH_H} from '../../rig';
import {persistItems} from '../../film/continuity';
import {FxOut} from '../../fx';
import {girderMesh, columnMeshes, carMesh} from '../../world/props';
import {groundH} from '../../world/ground';
import {ARMY_B, HEAVIES_B, DRONES_B, heavySpecB, droneSpecB} from '../B/army';
import {D1_ARMY_IDS} from '../D1/machines';
import {G} from '../D1/motion';
import {unitD2, NAMED, RESERVE_D2, YIELD_NAMES, YIELD_IDS, heavy1, enemyDronesD2, EV2, GF, GUP, GIRDER_LEN} from './machines';
import {directorAt, breakerAt, tetherAt, runnerAt, droneAt, flaresAt, decoyAt, CrewOut, towardSpec} from './crew';
import {crewAt as d1CrewAt} from '../D1/battle';
import {M} from '../../timing';
import {d2Fx, allyPose, girderShudder} from './fx';

export type Role = 'director' | 'breaker' | 'tether' | 'runner' | 'drone' | 'flares' | 'decoy';
export const ROLES: Role[] = ['director', 'breaker', 'tether', 'runner', 'drone', 'flares', 'decoy'];
const crewRaw = (role: Role, T: number): CrewOut => {
  switch (role) {
    case 'director': return directorAt(T);
    case 'breaker': return breakerAt(T);
    case 'tether': return tetherAt(T);
    case 'runner': return runnerAt(T);
    case 'drone': return droneAt(T, allyPose(T).pos);
    case 'flares': return flaresAt(T);
    default: return decoyAt(T);
  }
};
/** the Crew at film time T: the first 0.45 s blend in from D1's own last poses (the cut from D1-9b is invisible) */
export const crewAt = (role: Role, T: number): CrewOut => {
  const c = crewRaw(role, T);
  if (T >= M.P2 + 0.45) return c;
  const w = smooth(clamp((T - M.P2) / 0.45));
  return {...c, spec: towardSpec(d1CrewAt(role, T).spec, c.spec, w)};
};

/** B's halted army minus the vanguard units D1 took (D2 animates those it continues itself) */
const ARMY_REST: Formation = {slots: (T) => ARMY_B.slots(T).filter((sl) => !D1_ARMY_IDS.has(sl.id) && !YIELD_IDS.has(sl.id))};

/** the catch (KNOCKBACK → CATCH) and, after he is lowered, the breaker's hands on the runner's shoulders */
const pairRunnerBreaker = (v: View, T: number, runner: FigSpec, brk: FigSpec): {runner: FigSpec; breaker: FigSpec} => {
  if (T < EV2.knock + 0.2) return {runner, breaker: brk};
  if (T < 112.85) {
    // the cradle: his chest at the faller's shoulder blades; his palms come onto the back as the weight arrives
    const w = smooth(clamp((T - 110.74) / 0.44)); // his hands come up as the runner's back reaches him (≈110.9) and take the weight on CATCH
    const c = supportCatch(v, runner, brk, {w, cradle: {r: 0, u: 96, f: 58}, backL: {r: -36, u: 116, f: -34}, backR: {r: 34, u: 104, f: -34}});
    return {runner: c.faller, breaker: c.catcher};
  }
  // kneeling behind him, both hands on his shoulders (then one stays: BRIGHT)
  const w = smooth(clamp((T - 112.85) / 0.35));
  const wL = w * (1 - smooth(clamp((T - 115.6) / 0.5)));
  let b2 = handOn(v, runner, {r: SH_X - 10, u: SH_H + 12, f: -6}, brk, 'R', w, {palm: {x: 0, y: -1, z: 0}});
  b2 = handOn(v, runner, {r: -(SH_X - 10), u: SH_H + 12, f: -6}, b2, 'L', wL, {palm: {x: 0, y: -1, z: 0}});
  return {runner, breaker: b2};
};

// the girder, redrawn by the shots that see the crash (the set's own copy skipped): it flexes in its span
let GIR_EXTRA: MeshItem[] | null = null;
const girderExtras = (): MeshItem[] => (GIR_EXTRA ??= [
  ...columnMeshes().map((m, i): MeshItem => ({kind: 'mesh', mesh: m, key: `gcol_${i}`})),
  {kind: 'mesh', mesh: prep(carMesh('taxi', 0.85)), key: 'taxi', xf: {pos: {x: 46.5, y: groundH(46.5, -14.2), z: -14.2}, yaw: 75, roll: -6}},
]);
const GA = {x: 36, y: 0, z: -17};
export const girderItems = (T: number): Item[] => {
  const a = girderShudder(T);
  const fn = Math.abs(a) > 0.0005 ? (p: V3) => {
    const s = clamp(((p.x - GA.x) * GF.x + (p.y - GA.y) * GF.y + (p.z - GA.z) * GF.z) / GIRDER_LEN);
    return add3(p, mul3(GUP, a * Math.sin(Math.PI * s)));
  } : undefined;
  return [{kind: 'mesh', mesh: girderMesh(), key: 'girder', fn}, ...girderExtras()];
};
/** Stage `set` options for shots that draw girderItems() themselves */
export const SET_D2 = {skip: ['girder']};

export type D2Opts = {
  crew?: Role[];
  tweak?: Partial<Record<Role, Partial<FigSpec>>>;
  skipUnits?: string[];
  unitBias?: Record<string, number>;
  army?: boolean;
  extra?: Item[];
  /** full-mesh radius (m) for the named machines; mid beyond, far sprites beyond `far` */
  full?: number; far?: number;
  /** draw the girder (shots passing SET_D2 to the Stage) */
  girder?: boolean;
};

export const d2Items = (v: View, T: number, o: D2Opts = {}): Item[] => {
  const items: Item[] = [];
  const specs: Partial<Record<Role, FigSpec>> = {};
  (o.crew ?? ROLES).forEach((r) => {
    const c = crewAt(r, T);
    specs[r] = {...c.spec, ...(o.tweak?.[r] ?? {})};
  });
  if (specs.runner && specs.breaker) {
    const p = pairRunnerBreaker(v, T, specs.runner, specs.breaker);
    specs.runner = p.runner; specs.breaker = p.breaker;
  }
  (Object.keys(specs) as Role[]).forEach((r) => {
    const s = specs[r]!;
    if (toView(v, s.pos).z < 0.3) return;
    items.push(figureSprite(s));
  });
  const full = o.full ?? 26, far = o.far ?? 90;
  const lodOf = (p: V3) => {
    const d = Math.hypot(p.x - v.pos.x, p.y - v.pos.y, p.z - v.pos.z);
    return d < full ? 'full' : d < far ? 'mid' : 'far';
  };
  const draw = (name: string) => {
    if (o.skipUnits?.includes(name)) return;
    const s: UnitSpec = unitD2(name, T);
    const p = s.gait ? s.gait.path(s.gait.dist).pos : s.pos;
    if (toView(v, {x: p.x, y: G(p.x, p.z) + 1.1, z: p.z}).z < -2) return;
    const its = combatUnit({...s, lod: lodOf(p)});
    const b = o.unitBias?.[name];
    items.push(...(b ? its.map((it) => (it.kind === 'raw' ? it : {...it, bias: (it.bias ?? 0) + b})) : its));
  };
  NAMED.forEach(draw);
  if (o.army !== false) {
    RESERVE_D2.forEach(draw);
    YIELD_NAMES.forEach(draw);
    items.push(...armyItems(v, T, ARMY_REST, {ground: G, maxFull: 0, maxMid: 16, farFrom: 75, ctl: () => ({idle: 0.4})}));
    const h1 = heavy1(T);
    const l1 = lodOf(h1.gait ? h1.gait.path(h1.gait.dist).pos : h1.pos);
    items.push(...heavy({...h1, lod: l1 === 'far' ? 'mid' : 'full'}));
    HEAVIES_B.forEach((h, i) => {
      if (i === 0) return;
      const l = lodOf({x: h.rest.x, y: 3, z: h.rest.z});
      items.push(...heavy(heavySpecB(i, T, {lod: l === 'full' ? 'mid' : l, look: {x: 56, y: 1.5, z: -2}, key: `d2hv${h.id}`})));
    });
    DRONES_B.forEach((d, i) => items.push(...drone({...droneSpecB(i, T), lod: 'far'})));
    enemyDronesD2(T).forEach((d) => items.push(...drone({...d, lod: lodOf(d.pos) === 'far' ? 'far' : 'full'})));
  }
  items.push(...persistItems(v, T, {exceptSec: 'D2'}));
  if (o.girder) items.push(...girderItems(T));
  items.push(...(o.extra ?? []));
  return items;
};
/** the section's FX at T (camera independent): items into the scene, lights and shake into the Stage */
export const d2FxAt = (T: number): FxOut => d2Fx(T);
void [lerp];
