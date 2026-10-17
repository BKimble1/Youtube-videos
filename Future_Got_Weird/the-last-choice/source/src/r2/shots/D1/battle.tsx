// Section D1: everything in the battle at film time T for a given view — the Crew (sprites), the named machines
// (LOD by distance), the reserve and the halted army behind it, enemy drones low over the crater, heavies far back,
// the cover slab, wrecks from earlier sections, and the section's FX. Shots pick a camera and call d1Items().
import type {Item, View} from '../../engine';
import {toView} from '../../engine';
import {V3} from '../../../kit/math';
import {combatUnit, drone, heavy, armyItems, UnitSpec} from '../../mech';
import type {Formation} from '../../mech';
import {figureSprite, FigSpec} from '../../rig';
import {persistItems} from '../../film/continuity';
import {FxOut} from '../../fx';
import {unitD1, FRONT, RESERVE_NAMES, enemyDrones, D1_ARMY_IDS} from './machines';
import {ARMY_B, HEAVIES_B, DRONES_B, heavySpecB, droneSpecB} from '../B/army';
import {directorAt, breakerAt, tetherAt, runnerAt, droneAt, flaresAt, decoyAt, CrewOut} from './crew';
import {d1Fx, allyPose} from './fx';
import {coverSlabItems} from './props';
import {G} from './motion';

export type Role = 'director' | 'breaker' | 'tether' | 'runner' | 'drone' | 'flares' | 'decoy';
export const crewAt = (role: Role, T: number): CrewOut => {
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
export const ROLES: Role[] = ['director', 'breaker', 'tether', 'runner', 'drone', 'flares', 'decoy'];

/** section B's halted army (shots/B/army.ts) minus the vanguard units D1 animates itself */
const ARMY_REST: Formation = {slots: (T) => ARMY_B.slots(T).filter((sl) => !D1_ARMY_IDS.has(sl.id))};

export type D1Opts = {
  /** crew to draw (default all) */
  crew?: Role[];
  /** per-role overrides of the sprite spec (anchor, bias) */
  tweak?: Partial<Record<Role, Partial<FigSpec>>>;
  /** named units to skip / per-unit bias */
  skipUnits?: string[];
  unitBias?: Record<string, number>;
  /** draw the background army / reserve / drones / heavies (default true) */
  army?: boolean;
  /** extra items */
  extra?: Item[];
  /** full-mesh radius (m) for machines; mid beyond, far sprites beyond `far` */
  full?: number; far?: number;
};

export const d1Items = (v: View, T: number, o: D1Opts = {}): Item[] => {
  const items: Item[] = [];
  const crew: Partial<Record<Role, CrewOut>> = {};
  (o.crew ?? ROLES).forEach((r) => {
    const c = crewAt(r, T);
    crew[r] = c;
    const tw = o.tweak?.[r];
    if (toView(v, c.spec.pos).z < 0.3) return;
    items.push(figureSprite({...c.spec, ...(tw ?? {})}));
  });
  const full = o.full ?? 26, far = o.far ?? 90;
  const lodOf = (p: V3) => {
    const d = Math.hypot(p.x - v.pos.x, p.y - v.pos.y, p.z - v.pos.z);
    return d < full ? 'full' : d < far ? 'mid' : 'far';
  };
  const draw = (name: string) => {
    if (o.skipUnits?.includes(name)) return;
    const s: UnitSpec = unitD1(name, T);
    const p = s.gait ? s.gait.path(s.gait.dist).pos : s.pos;
    if (toView(v, {x: p.x, y: G(p.x, p.z) + 1.1, z: p.z}).z < -2) return;
    const its = combatUnit({...s, lod: lodOf(p)});
    const b = o.unitBias?.[name];
    items.push(...(b ? its.map((it) => (it.kind === 'raw' ? it : {...it, bias: (it.bias ?? 0) + b})) : its));
  };
  FRONT.forEach(draw);
  if (o.army !== false) {
    RESERVE_NAMES.forEach(draw);
    items.push(...armyItems(v, T, ARMY_REST, {ground: G, maxFull: 0, maxMid: 16, farFrom: 75, ctl: () => ({idle: 0.4})}));
    HEAVIES_B.forEach((h, i) => {
      const l = lodOf({x: h.rest.x, y: 3, z: h.rest.z});
      items.push(...heavy(heavySpecB(i, T, {lod: l === 'full' ? 'mid' : l, look: {x: 44, y: 1.5, z: 0}, key: `d1hv${h.id}`})));
    });
    DRONES_B.forEach((d, i) => items.push(...drone({...droneSpecB(i, T), lod: 'far'})));
    enemyDrones(T).forEach((d) => items.push(...drone({...d, lod: lodOf(d.pos) === 'far' ? 'far' : 'full'})));
  }
  items.push(...coverSlabItems());
  items.push(...persistItems(v, T, {exceptSec: 'D1'}));
  items.push(...(o.extra ?? []));
  return items;
};
/** the section's FX at T (camera independent): items into the scene, lights and shake into the Stage */
export const d1FxAt = (T: number): FxOut => d1Fx(T);
