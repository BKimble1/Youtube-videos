// the release (20.8–21.8): how close the eel comes to the predator's eye on screen (px, edge to edge), per frame, for
// candidate release headings. Usage: npx tsx ../tools/v4/release_eye.ts '[{"name":"a","h0":[x,y,z],"d1":[..]}]'
import {basis, norm3} from '../../source/src/v4/three';
import {EXT, SWIM_CFG} from '../../source/src/v4/shots/Exterior';
import {SWIM_HEAD} from '../../source/src/v4/escape';
import {eelScreen, N} from '../../source/src/v4/eelV4';
import {predGeom} from '../../source/src/v4/pred';
const cfgs: any[] = JSON.parse(process.argv[2] || '[{"name":"current"}]');
for (const c of cfgs) {
  Object.assign(SWIM_CFG, c.cam || {});
  if (c.drift) SWIM_HEAD.drift = c.drift; if (c.tau) SWIM_HEAD.tau = c.tau;
  if (c.h0) SWIM_HEAD.h0 = norm3(c.h0);
  if (c.d1) SWIM_HEAD.d1 = norm3(c.d1);
  if (c.d2) SWIM_HEAD.d2 = norm3(c.d2);
  const out: string[] = [];
  let worst = 1e9;
  for (let f = 626; f <= 656; f += 1) {
    const t = f / 30;
    const s = EXT[t < 21.3 ? 'release' : 'swim'](t);
    const B = basis(s.cam);
    const g = predGeom(B, s.pose);
    const sc = eelScreen(B, s.eel!);
    let m = 1e9;
    for (let i = 0; i <= N; i++) m = Math.min(m, Math.hypot(sc.pts[i].x - g.eye.x, sc.pts[i].y - g.eye.y) - sc.rad[i] - g.eye.r);
    worst = Math.min(worst, m);
    out.push(`${t.toFixed(2)}:${Math.round(m)}`);
  }
  console.log(c.name, 'worst', Math.round(worst), out.join(' '));
}
