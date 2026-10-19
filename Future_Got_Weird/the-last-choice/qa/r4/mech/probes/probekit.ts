import {unitWorld, UnitSpec, U_DIM} from './mechapi';
const U = U_DIM as any;
export const d3 = (a: any, b: any) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
export type Flag = {t: number; what: string; v: number};
/** per-frame continuity of a unit: joint jumps, bone lengths, planted-foot hover / slide. */
export const unitProbe = (spec: (T: number) => UnitSpec, t0: number, t1: number, o: {fps?: number; jump?: number; ground?: (x: number, z: number) => number} = {}) => {
  const fps = o.fps ?? 30, dt = 1 / fps;
  const g = o.ground ?? (() => 0);
  const flags: Flag[] = [];
  let prev: any = null;
  const stats = {maxJump: {} as Record<string, number>, maxBone: 0, footErr: 0, nFrames: 0};
  for (let t = t0; t <= t1 + 1e-9; t += dt) {
    const r = unitWorld(spec(t));
    stats.nFrames++;
    const J: Record<string, any> = {head: r.head.pos, pel: r.pelvis.pos, shL: r.sh[0], shR: r.sh[1], elL: r.el[0], elR: r.el[1], wrL: r.wr[0], wrR: r.wr[1], knL: r.kn[0], knR: r.kn[1], anL: r.an[0], anR: r.an[1]};
    ([0, 1] as const).forEach((i) => {
      const lens: [string, number, number][] = [['thigh', d3(r.hip[i], r.kn[i]), U.thigh], ['shin', d3(r.kn[i], r.an[i]), U.shin], ['upper', d3(r.sh[i], r.el[i]), U.upper], ['fore', d3(r.el[i], r.wr[i]), U.fore]];
      for (const [n, a, b] of lens) { const e = Math.abs(a - b); stats.maxBone = Math.max(stats.maxBone, e); if (e > 0.02) flags.push({t, what: `bone ${n}${i ? 'R' : 'L'}`, v: e}); }
    });
    if (prev) for (const k of Object.keys(J)) {
      const j = d3(J[k], prev[k]);
      stats.maxJump[k] = Math.max(stats.maxJump[k] ?? 0, j);
      const lim = o.jump ?? (k.startsWith('wr') ? 0.45 : k.startsWith('an') ? 0.4 : 0.3);
      if (j > lim) flags.push({t, what: `jump ${k}`, v: j});
    }
    prev = J;
  }
  return {flags, stats};
};
export const summarize = (flags: Flag[]) => {
  const m = new Map<string, {n: number; t0: number; t1: number; max: number}>();
  for (const f of flags) { const e = m.get(f.what) ?? {n: 0, t0: f.t, t1: f.t, max: 0}; e.n++; e.t1 = f.t; e.max = Math.max(e.max, f.v); m.set(f.what, e); }
  return [...m.entries()].map(([k, e]) => `${k}: n=${e.n} t ${e.t0.toFixed(2)}–${e.t1.toFixed(2)} max ${e.max.toFixed(3)}`);
};
