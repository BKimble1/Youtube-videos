import {unitWorld, UnitSpec, U_DIM} from './mechapi';
const U = U_DIM as any;
const d3 = (a: any, b: any) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
const dirs = [{x: 1, y: 0, z: 0}, {x: -0.7, y: 0, z: 0.7}, {x: 0, y: 0, z: -1}];
let worst: Record<string, number> = {};
const rec = (k: string, v: number, ctx: string) => { if (!(k in worst) || v > worst[k]) { worst[k] = v; (worst as any)[k + '_ctx'] = ctx; } };
for (const [di, dir] of dirs.entries()) {
  for (let f = 0; f <= 90; f++) {
    const t = f / 30;
    const sp: UnitSpec = {id: 5, t, pos: {x: 0, y: 0, z: 0}, heading: 90 + di * 50, idle: 0, fall: {t0: 0.2, dir}};
    const r = unitWorld(sp);
    const ctx = `dir${di} f${f}`;
    ([0, 1] as const).forEach((i) => {
      rec('thigh', Math.abs(d3(r.hip[i], r.kn[i]) - U.thigh), ctx);
      rec('shin', Math.abs(d3(r.kn[i], r.an[i]) - U.shin), ctx);
      rec('upper', Math.abs(d3(r.sh[i], r.el[i]) - U.upper), ctx);
      rec('fore', Math.abs(d3(r.el[i], r.wr[i]) - U.fore), ctx);
    });
    // neck-to-chest consistency: spine pos to neck pos distance should be ~0.56
    rec('spine-neck', Math.abs(d3(r.spine.pos, r.neck.pos) - 0.56), ctx);
    rec('pelvis-spine', Math.abs(d3(r.pelvis.pos, r.spine.pos) - 0.10), ctx);
    rec('shoulder-w', Math.abs(d3(r.sh[0], r.sh[1]) - 2 * U.shW), ctx);
    rec('hip-w', Math.abs(d3(r.hip[0], r.hip[1]) - 2 * U.hipW), ctx);
  }
}
console.log(JSON.stringify(worst, null, 1));
