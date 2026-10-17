// Battlefield continuity: what one section breaks stays broken in every later shot. A section registers each machine
// it downs (or pins, or wrecks) as a Persist entry in src/r2/shots/<SEC>/persist.ts: the SAME spec function its own
// shots use, evaluated at film time T (all t0s in specs are film seconds, so a fall that finished at 86 s still
// reads as fallen at 200 s). Later shots call persistItems(view, T) to draw them.
//
//   PERSIST_D1 = [{key: 'd1_u3', sec: 'D1', from: M.BR3, kind: 'unit', spec: (T) => ({...U3, t: T}), note: 'tethered into u4, down at the rim'}]
//   <Stage ... items={(v) => [...persistItems(v, T, {exceptSec: 'D2'}), ...mine]} />
import type {Item, View} from '../engine';
import {toView} from '../engine';
import {combatUnit, drone, heavy, UnitSpec, DroneSpec, HeavySpec} from '../mech';
import type {Mv} from '../timing';
import {PERSIST} from '../shots/persist';

export type Persist =
  | {key: string; sec: Mv | 'EF'; from: number; until?: number; kind: 'unit'; spec: (T: number) => UnitSpec; note: string}
  | {key: string; sec: Mv | 'EF'; from: number; until?: number; kind: 'drone'; spec: (T: number) => DroneSpec; note: string}
  | {key: string; sec: Mv | 'EF'; from: number; until?: number; kind: 'heavy'; spec: (T: number) => HeavySpec; note: string}
  | {key: string; sec: Mv | 'EF'; from: number; until?: number; kind: 'items'; items: (view: View, T: number) => Item[]; note: string};

export type PersistOpts = {
  /** leave out this section's entries (its own shots animate them) */
  exceptSec?: string | string[];
  /** leave out these keys */
  skip?: string[];
  /** cull beyond this distance from the camera (m) */
  maxDist?: number;
  /** LOD switch distances (m): full inside `full`, mid inside `mid`, far beyond */
  lod?: {full?: number; mid?: number};
};

export const persistAt = (T: number, o: PersistOpts = {}) => {
  const ex = o.exceptSec ? (Array.isArray(o.exceptSec) ? o.exceptSec : [o.exceptSec]) : [];
  return PERSIST.filter((p) => T >= p.from && (p.until === undefined || T < p.until) && !ex.includes(p.sec) && !(o.skip ?? []).includes(p.key));
};

export const persistItems = (view: View, T: number, o: PersistOpts = {}): Item[] => {
  const out: Item[] = [];
  const full = o.lod?.full ?? 40, mid = o.lod?.mid ?? 160;
  for (const p of persistAt(T, o)) {
    if (p.kind === 'items') {
      out.push(...p.items(view, T));
      continue;
    }
    const sp = p.spec(T);
    const d = Math.hypot(sp.pos.x - view.pos.x, sp.pos.y - view.pos.y, sp.pos.z - view.pos.z);
    if (o.maxDist !== undefined && d > o.maxDist) continue;
    if (toView(view, sp.pos).z < -12) continue; // well behind the camera
    const lod = d < full ? 'full' : d < mid ? 'mid' : 'far';
    if (p.kind === 'unit') {
      const u = p.spec(T);
      out.push(...combatUnit({...u, key: u.key ?? p.key, lod: u.lod ?? lod}));
    } else if (p.kind === 'drone') {
      const dr = p.spec(T);
      out.push(...drone({...dr, key: dr.key ?? p.key, lod: dr.lod ?? (lod === 'full' ? 'full' : 'far')}));
    } else {
      const h = p.spec(T);
      out.push(...heavy({...h, key: h.key ?? p.key, lod: h.lod ?? lod}));
    }
  }
  return out;
};
