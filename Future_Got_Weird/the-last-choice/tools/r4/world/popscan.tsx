import {makeView} from '/home/user/Youtube-videos/Future_Got_Weird/the-last-choice/source/src/r2/engine';
import {setItems, atmosItems} from '/home/user/Youtube-videos/Future_Got_Weird/the-last-choice/source/src/r2/world';
import {camPath, withShake} from '/home/user/Youtube-videos/Future_Got_Weird/the-last-choice/source/src/r2/film/stage';
import {AERIAL} from '/home/user/Youtube-videos/Future_Got_Weird/the-last-choice/source/src/r2/world';
import {camF1, MOVE} from '/home/user/Youtube-videos/Future_Got_Weird/the-last-choice/source/src/r2/shots/EF/camera';
import {M} from '/home/user/Youtube-videos/Future_Got_Weird/the-last-choice/source/src/r2/timing';
import * as fs from 'node:fs';

const mode = process.env.MODE ?? 'A1';
const ids = new WeakMap<object, number>(); let nid = 1;
const idOf = (o: any) => { if (!ids.has(o)) ids.set(o, nid++); return ids.get(o)!; };
const smooth = (x: number) => { const t = Math.min(1, Math.max(0, x)); return t * t * (3 - 2 * t); };

const camAt = (T: number) => {
  if (mode === 'A1') {
    const DUR = M.TITLE_IN;
    return camPath([{t: 0, pos: AERIAL.from.pos, target: AERIAL.from.target, fov: 44}, {t: DUR, pos: AERIAL.to.pos, target: AERIAL.to.target, fov: 42}], T, 0.35);
  }
  return camF1(T);
};
const optsAt = (T: number, cam: any) => {
  if (mode === 'A1') return {set: {lodCams: Array.from({length: 23}, (_, i) => camAt((i / 22) * M.TITLE_IN).pos)}, atmos: {fireSmoke: (id: string) => (['wreck6', 'bldN4'].includes(id) ? 0.3 : 1)}};
  const up = smooth((cam.pos.y - 4) / 16);
  const NEAR: Record<string, number> = {ruinW1: 0.55, ruinW2: 0.22, ruinW3: 0.3, ridgeN: 0.5, ridgeS: 0.35, spillE: 0.6, wreck0: 0.6, w2_room: 0.5};
  return {set: {skip: ['radio']}, atmos: {smoke: 1, fireSmoke: (id: string) => (id in NEAR ? 1 - (1 - NEAR[id]) * up : 1), haze: 1 - 0.7 * smooth((cam.pos.y - 6) / 22)}};
};
const t0 = mode === 'A1' ? 0 : Number(process.env.T0 ?? MOVE.b), t1 = mode === 'A1' ? M.TITLE_IN : Number(process.env.T1 ?? M.CARD_IN);
const step = Number(process.env.STEP ?? 1);
type Snap = Map<string, number>;
let prevS: Snap | null = null, prevA: Snap | null = null;
const ev: {f: number; T: number; layer: string; key: string; what: string; px?: number}[] = [];
const items = (v: any, T: number, o: any) => ({s: setItems(v, T, o.set), a: atmosItems(v, T, o.atmos)});
for (let f = Math.round(t0 * 30); f <= Math.round(t1 * 30); f += step) {
  const T = f / 30;
  const t = mode === 'A1' ? T : T;
  const cam0 = camAt(mode === 'A1' ? T : T);
  const cam = mode === 'A1' ? withShake(cam0, T, 0, 0.25) : cam0;
  const v = makeView(cam);
  const o = optsAt(T, cam);
  const {s, a} = items(v, T, o);
  const snapS: Snap = new Map(), snapA: Snap = new Map();
  s.forEach((it: any, i: number) => { const k = it.key ?? `#${i}`; snapS.set(k, it.kind === 'mesh' ? idOf(it.mesh) : 0); });
  a.forEach((it: any, i: number) => { const k = it.key ?? `#${i}`; snapA.set(k, it.kind === 'sprite' ? Math.round((it.bias ?? 0) * 100) : 0); });
  const cmp = (cur: Snap, prev: Snap | null, layer: string) => {
    if (!prev) return;
    for (const [k, id] of cur) { if (!prev.has(k)) ev.push({f, T, layer, key: k, what: 'in'}); else if (prev.get(k) !== id) ev.push({f, T, layer, key: k, what: layer === 'atmos' ? 'bias' : 'lod'}); }
    for (const k of prev.keys()) if (!cur.has(k)) ev.push({f, T, layer, key: k, what: 'out'});
  };
  cmp(snapS, prevS, 'set'); cmp(snapA, prevA, 'atmos');
  prevS = snapS; prevA = snapA;
}
fs.writeFileSync(process.env.OUT ?? 'pop.json', JSON.stringify(ev));
const g = new Map<string, number>();
ev.forEach((e) => g.set(`${e.layer}:${e.what}`, (g.get(`${e.layer}:${e.what}`) ?? 0) + 1));
console.log(mode, 'events', ev.length, [...g].map(([k, n]) => `${k}=${n}`).join(' '));
