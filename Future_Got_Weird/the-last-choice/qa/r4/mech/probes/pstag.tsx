import {unitWorld, unitImpacts, U_DIM} from './mechapi';
import {unitProbe, summarize} from './probekit';
const U = U_DIM as any;
for (const [name, dir, steps, strength] of [['push from front', {x: 0, y: 0, z: 1}, 3, 1], ['push from right', {x: -1, y: 0, z: 0}, 2, 1], ['hard push 4 steps', {x: 0, y: 0, z: 1}, 4, 1.4]] as [string, any, number, number][]) {
  const spec = (t: number): any => ({id: 4, t, pos: {x: 0, y: 0, z: 0}, heading: 0, idle: 0, posture: 'guard', stagger: {t0: 1.0, dir, steps, strength}});
  let hover = 0, slideDuringStance = 0, prev: any = null;
  const rootAt: string[] = [];
  for (let t = 0.8; t < 3.4; t += 1 / 30) {
    const r = unitWorld(spec(t));
    r.an.forEach((a, i) => { hover = Math.max(hover, a.y - U.ankleH - 0.16); if (prev && prev[i].y < U.ankleH + 0.002 && a.y < U.ankleH + 0.002) slideDuringStance = Math.max(slideDuringStance, Math.hypot(a.x - prev[i].x, a.z - prev[i].z) * 30); });
    prev = r.an;
    if (Math.abs((t * 30) % 6) < 0.5) rootAt.push(`${t.toFixed(1)}:(${r.root.x.toFixed(2)},${r.root.z.toFixed(2)})`);
  }
  const res = unitProbe(spec, 0.8, 3.4);
  const steps_ = unitImpacts(spec(1.0)).filter((i: any) => i.kind === 'step');
  console.log(name, '| footfalls', steps_.map((s: any) => s.t.toFixed(2)).join(','), '| planted-foot creep max', slideDuringStance.toFixed(2), 'm/s | bone err', res.stats.maxBone.toFixed(3), '| jumps', summarize(res.flags).slice(0, 4), '| root', rootAt.join(' '));
}
