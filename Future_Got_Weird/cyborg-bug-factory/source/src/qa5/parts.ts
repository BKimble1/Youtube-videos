// V5 build: every robot part must enter the frame from outside (no part appearing in mid-air).
import {add3, basis, proj} from '../core/three';
import {cam} from '../camera';
import {camBuild, FLY, PARTS, partOff, RB} from '../v5/build5';
const FPS = 30;
for (const p of PARTS) {
  const f0 = Math.ceil((p.t - FLY) * FPS);
  const t = f0 / FPS;
  const B = basis(cam(camBuild(t)));
  const o = add3(RB, partOff(p, t));
  // the part's extent: a generous 30 mm box around its origin (the biggest part, the chassis, is 44 x 22 mm)
  const pts = [-1, 1].flatMap((a) => [-1, 1].flatMap((b) => [-1, 1].map((c) => add3(o, [a * 24, b * 18, c * 14 + 7] as any))));
  const P = pts.map((q) => proj(B, q as any));
  const vis = P.some((q) => q.z > 5 && q.x > 0 && q.x < 1080 && q.y > 0 && q.y < 1920);
  const c = proj(B, add3(o, [0, 0, 7]));
  console.log(p.name.padEnd(8), 'first frame', f0, 't', t.toFixed(3), 'centre on screen at', c.x.toFixed(0), c.y.toFixed(0), vis ? 'PART EXTENT IN VIEW' : 'outside the frame');
}
