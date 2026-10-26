// coarse search of the observer's walk for S08's framing (dev only)
import {observerRig, OBS, ObsParams} from '../../shots/S07';
import {medicPose, povCam, FW} from '../../shots/S08';
import {proj, depth, Cam} from '../../lib/cam';
import {toW, sub, dot, norm, V3} from '../../lib/v3';
import {RoachPose} from '../../rig/roach';
const DEG = Math.PI / 180;
const o = (FW - 1080) / 2;
const bbox = (c: Cam, p: RoachPose) => {
  const pts: V3[] = [...p.antL, ...p.antR, ...p.cerci.flat(), ...p.legs.flatMap((l) => [l.knee, l.foot]), toW(p.frame, [-42, 8, 0]), toW(p.frame, [36, 8, 0])];
  const q = pts.map((x) => proj(c, x)[0] - o);
  return [Math.min(...q), Math.max(...q)];
};
const score = (P: ObsParams, log = false) => {
  const rig = observerRig(P);
  let e = 0;
  const yaw0 = Math.atan2(-rig.pose(12.4).frame.x[2], rig.pose(12.4).frame.x[0]);
  for (let t = 12.4; t <= 15.4; t += 0.1) {
    const c = povCam(t, rig.pose);
    const mp = medicPose(t);
    const [a, b] = bbox(c, mp);
    e += Math.max(0, 80 - a) ** 2 + Math.max(0, b - 1000) ** 2 + 0.05 * ((a + b) / 2 - 560) ** 2;
    if (t > 13.6) {
      const tl = proj(c, [-20, 56, -24])[0] - o, tr = proj(c, [-20, 0, 24])[0] - o;
      e += Math.max(0, 40 - Math.min(tl, tr)) ** 2;
    }
    if (log) console.log(t.toFixed(1), a.toFixed(0), b.toFixed(0));
  }
  const c = povCam(15.4, rig.pose), mp = medicPose(15.4);
  const mc = toW(mp.frame, [0, 12, 0]);
  const va = Math.acos(-dot(norm(sub(c.eye, mc)), mp.frame.x)) / DEG;
  e += 200 * Math.max(0, 28 - va) ** 2 + 200 * Math.max(0, va - 42) ** 2;
  const d = depth(c, mc);
  e += 100 * Math.max(0, 135 - d) ** 2 + 30 * Math.max(0, d - 158) ** 2;
  const yaw1 = Math.atan2(-rig.pose(15.4).frame.x[2], rig.pose(15.4).frame.x[0]);
  const turn = Math.abs(yaw1 - yaw0) / DEG;
  e += 300 * Math.max(0, turn - 16) ** 2;
  return {e, va, d, turn};
};
let best: {e: number; P?: ObsParams; r?: any} = {e: Infinity};
for (const ex of [176, 186, 196, 206, 216]) for (const ez of [70, 80, 90, 100, 110]) for (const pe of [26, 30, 34, 38, 42]) for (const ps of [40, 45, 50, 55]) for (const tb of [35, 50, 65]) {
  const P: ObsParams = {...OBS, endLens: [ex, ez], phiEnd: pe * DEG, phiStart: ps * DEG, turn: [-4, tb]};
  const r = score(P);
  if (r.e < best.e) best = {e: r.e, P, r};
}
console.log(JSON.stringify({...best, P: {...best.P, phiEnd: best.P!.phiEnd / DEG, phiStart: best.P!.phiStart / DEG}}));
score(best.P!, true);
