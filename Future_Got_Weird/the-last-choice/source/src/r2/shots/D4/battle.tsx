// Section D4: everything in the world at film time T for a given view — the Crew (sprites), the named machines and
// the ring closing (LOD by distance), heavy 2, the drones, the avenue's halted block and streaming columns, heavy 1's
// wreck, the earlier sections' wrecks, the lost tools and the section's FX. Shots pick a camera and call d4Items().
// Once a machine is set in its tableau place it is drawn from the tableau's own spec (shots/EF/tableau.ts), so the
// last frames are E/F's first.
import type {Item, View} from '../../engine';
import {toView, viewToScreen} from '../../engine';
import {V3} from '../../../kit/math';
import {combatUnit, drone, heavy, armyItems, standing, UnitSpec, Formation} from '../../mech';
import {figureSprite, FigSpec, Role2} from '../../rig';
import {persistItems, persistAt} from '../../film/continuity';
import {FxOut} from '../../fx';
import {ringSpecs, holderSpecs, heavy1Spec, streamForm, TB_RESERVE, Holder} from '../EF/tableau';
import {gripAt} from '../EF/crew';
import {NAMED, RING_PLANS, RING_SET, RING_IN, HOLDER_FINAL, unitAt, heavy2At, droneD4, DRONE_IDS, ringExtras} from './machines';
import {crewAt, ROLES} from './crew';
import {d4Fx} from './fx';
import {G} from './motion';

export type D4Opts = {
  /** crew to draw (default all) */
  crew?: Role2[];
  /** per-role overrides of the sprite spec (anchor, bias) */
  tweak?: Partial<Record<Role2, Partial<FigSpec>>>;
  /** named units to skip / per-unit bias (W1, W2, W3, H1, H5, H2, H3, H4, or a tableau id) */
  skipUnits?: string[];
  unitBias?: Record<string, number>;
  /** leave out the avenue's block and streams (close shots) */
  near?: boolean;
  /** full-mesh radius (m) for machines; mid beyond, far sprites beyond `far` */
  full?: number; far?: number;
  /** max full-LOD units (nearest first) */
  maxFull?: number;
  extra?: Item[];
};

const grip = (h: Holder, T: number): V3 => (h.who && h.who !== 'drone' && h.who !== 'director' && h.who !== 'runner' ? gripAt(h.who, T) : h.at);

/**
 * On screen (with a margin)? A point `up` m above the ground spot: in front of the camera and within the frame widened
 * by `m` frame widths/heights on each side (units are ~2 m tall; near ones get a wider margin). Off-screen machines
 * are not drawn: the avenue's block and streams alone are ~1000 slots.
 */
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

/** every combat unit's spec at T (named + ring), switching to the tableau's spec once set */
export const unitSpecsAt = (T: number): {name: string; spec: UnitSpec}[] => {
  const out: {name: string; spec: UnitSpec}[] = [];
  const ring = new Map(ringSpecs(T).map((s) => [s.id, s]));
  const hold = new Map(holderSpecs(T, grip).map((s) => [s.id, s]));
  Object.entries(NAMED).forEach(([name, pl]) => {
    const f = HOLDER_FINAL[pl.id];
    out.push({name, spec: f !== undefined && T >= f ? hold.get(pl.id)! : unitAt(pl, T)});
  });
  RING_PLANS.forEach((pl) => {
    if (T < RING_SET[pl.id]) { out.push({name: String(pl.id), spec: unitAt(pl, T)}); return; }
    // set in its slot: the tableau's own spec, plus D4's scan and attention (they end before the tableau's securing)
    const r = ring.get(pl.id)!, x = ringExtras(pl.id, RING_IN[pl.id]);
    const sc = r.scan ? (Array.isArray(r.scan) ? r.scan : [r.scan]) : [];
    out.push({name: String(pl.id), spec: {...r, scan: [x.scan as NonNullable<UnitSpec['scan']> & object, ...sc] as UnitSpec['scan'], attend: [...(x.attend ?? []), ...(r.attend ?? [])]}});
  });
  return out;
};

export const d4Items = (v: View, T: number, o: D4Opts = {}): Item[] => {
  const items: Item[] = [];
  (o.crew ?? ROLES).forEach((r) => {
    const c = crewAt(r, T);
    if (toView(v, c.spec.pos).z < 0.3) return;
    items.push(figureSprite({...c.spec, ...(o.tweak?.[r] ?? {})}));
  });
  const full = o.full ?? 26, far = o.far ?? 90;
  const dist = (p: V3) => Math.hypot(p.x - v.pos.x, p.y - v.pos.y, p.z - v.pos.z);
  // units: nearest get full meshes (up to maxFull), then mid, then far sprites
  const specs = unitSpecsAt(T).filter(({name}) => !o.skipUnits?.includes(name)).map(({name, spec}) => {
    const p = spec.gait ? spec.gait.path(spec.gait.dist).pos : spec.pos;
    const q = {x: p.x, y: G(p.x, p.z) + 1.1, z: p.z};
    return {name, spec, p, d: dist(q), z: toView(v, q).z};
  }).filter((u) => u.z > -2 && (u.d < 4 || onScreen(v, u.p, 0.2))).sort((a, b) => a.d - b.d);
  const maxFull = o.maxFull ?? 14;
  specs.forEach((u, i) => {
    const lod: UnitSpec['lod'] = i < maxFull && u.d < full ? 'full' : u.d < far ? 'mid' : 'far';
    const its = combatUnit({...u.spec, lod});
    const b = o.unitBias?.[u.name];
    items.push(...(b ? its.map((it) => (it.kind === 'raw' ? it : {...it, bias: (it.bias ?? 0) + b})) : its));
  });
  // heavy 2
  const h2 = heavy2At(T);
  const hd = dist(h2.pos);
  if (toView(v, {...h2.pos, y: 4}).z > -8) items.push(...heavy({...h2, lod: hd < 60 ? 'full' : hd < 200 ? 'mid' : 'far'}));
  // heavy 1's wreck across the crater (the tableau's fallback until D3 registers its own)
  if (!persistAt(T).some((p) => p.sec === 'D3' && p.kind === 'heavy')) {
    const h1 = heavy1Spec(T);
    const d1 = dist(h1.pos);
    if (toView(v, {...h1.pos, y: 2}).z > -10) items.push(...heavy({...h1, lod: d1 < 70 ? 'full' : d1 < 220 ? 'mid' : 'far'}));
  }
  // drones
  DRONE_IDS.forEach((id) => {
    const d = droneD4(id, T);
    if (toView(v, d.pos).z < -2) return;
    const dd = dist(d.pos);
    items.push(...drone({...d, lod: dd < 45 ? 'full' : 'far', scale: dd > 120 ? 1.6 : 1}));
  });
  // the avenue: the halted block and the columns streaming west
  if (!o.near) {
    // (from a low camera the columns beyond ~320 m are specks behind the rubble: leave them out; the wides keep all)
    items.push(...armyItems(v, T, culled(standing(TB_RESERVE), v), {ground: G, maxFull: 1, maxMid: 8, farFrom: 110, ctl: () => ({idle: 0.18})}));
    items.push(...armyItems(v, T, culled(streamForm(), v, v.pos.y > 8 ? Infinity : 320), {ground: G, maxFull: 0, maxMid: 6, farFrom: 120}));
  }
  items.push(...persistItems(v, T, {exceptSec: 'D4', lod: {full: 30, mid: 120}}));
  items.push(...(o.extra ?? []));
  return items;
};
/** the section's FX at T (camera independent): items into the scene, lights and shake into the Stage */
export const d4FxAt = (T: number): FxOut => d4Fx(T);
