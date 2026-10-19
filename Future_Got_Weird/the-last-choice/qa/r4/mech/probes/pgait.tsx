import {unitWorld, UnitSpec, straightPath, U_DIM} from './mechapi';
import {unitProbe, summarize, d3} from './probekit';
const U = U_DIM as any;
// marching unit: planted-foot hover / slide
for (const [stride, speed] of [[1.5, 1.3], [1.5, 1.8], [1.2, 1.3], [1.8, 1.3]] as [number, number][]) {
  const path = straightPath({x: 0, y: 0, z: 0}, 90);
  const spec = (T: number): UnitSpec => ({id: 3, t: T, pos: {x: 0, y: 0, z: 0}, heading: 90, gait: {path, dist: T * speed, stride}} as any);
  let hover = 0, sink = 0, slide = 0, n = 0, worstSlide = 0;
  let prev: any = null;
  for (let t = 1; t < 9; t += 1 / 30) {
    const r = unitWorld(spec(t));
    // a foot is planted when its ankle is near ankle height; its horizontal motion between frames is then 'slide'
    ([0, 1] as const).forEach((i) => {
      const a = r.an[i];
      const planted = a.y < U.ankleH + 0.012;
      const err = a.y - U.ankleH;
      if (planted) { /* ok */ }
      hover = Math.max(hover, err > 0 && err < 0.02 ? 0 : 0);
      if (prev && prev[i].planted && planted) { const s = Math.hypot(a.x - prev[i].x, a.z - prev[i].z) * 30; worstSlide = Math.max(worstSlide, Math.abs(s - speed)); slide = Math.max(slide, s); }
      sink = Math.min(sink, err);
    });
    prev = [0, 1].map((i) => ({x: r.an[i].x, z: r.an[i].z, planted: r.an[i].y < U.ankleH + 0.012}));
    n++;
  }
  const res = unitProbe(spec, 1, 9);
  console.log(`stride ${stride} v ${speed}: planted-foot speed max ${slide.toFixed(2)} (pelvis speed ${speed}), sink min ${sink.toFixed(3)}; probe: max bone err ${res.stats.maxBone.toFixed(4)}`, summarize(res.flags).slice(0, 5));
}
