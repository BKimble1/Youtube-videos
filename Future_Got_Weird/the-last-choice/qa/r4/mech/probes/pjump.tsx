import {unitWorld} from API;
const d3 = (a: any, b: any) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
const BUMP = (x: number, z: number) => 0.16 * Math.sin(0.9 * x + 0.4) * Math.cos(0.7 * z) + 0.05 * x + 0.04 * Math.sin(2.3 * x + 1.7 * z);
for (const [gname, g] of [['flat', () => 0], ['bump', BUMP]] as [string, any][]) {
  const worst: Record<string, [number, string]> = {};
  for (let di = 0; di < 8; di++) {
    const ang = di * Math.PI / 4; const dir = {x: Math.cos(ang), y: 0, z: Math.sin(ang)};
    for (const getUp of [undefined, 3.0]) {
      let prev: any = null;
      for (let f = 0; f < 150; f++) {
        const t = f / 30;
        const r = unitWorld({id: 9, t, pos: {x: 1, y: 0, z: 1}, heading: di * 45, ground: g, idle: 0, fall: {t0: 0.5, dir, getUp}} as any);
        const J: any = {head: r.head.pos, pel: r.pelvis.pos, shL: r.sh[0], elL: r.el[0], wrL: r.wr[0], elR: r.el[1], wrR: r.wr[1], knL: r.kn[0], anL: r.an[0], knR: r.kn[1], anR: r.an[1]};
        if (prev) for (const k of Object.keys(J)) { const j = d3(J[k], prev[k]); if (!worst[k] || j > worst[k][0]) worst[k] = [j, `dir${di} f${f} getUp${getUp}`]; }
        prev = J;
      }
    }
  }
  console.log(gname, Object.entries(worst).map(([k, [v, c]]) => `${k} ${v.toFixed(3)} (${c})`).join(' | '));
}
