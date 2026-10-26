// numeric planning checks for S07/S08 (bundled with esbuild and run in node; not part of the film)
import {obsPose, obsS, OBS_PATH, s07Cam, LENS} from '../../shots/S07';
import {medicPose, medicS, MEDIC_PATH, povCam, FW} from '../../shots/S08';
import {proj, depth, Cam} from '../../lib/cam';
import {toW, sub, dot, norm, V3} from '../../lib/v3';
import {RoachPose} from '../../rig/roach';
const r = (x: number) => x.toFixed(0);
const D = 180 / Math.PI;
const bbox = (c: Cam, p: RoachPose, ox: number) => {
  const pts: V3[] = [...p.antL, ...p.antR, ...p.cerci.flat(), ...p.legs.flatMap((l) => [l.knee, l.foot]), toW(p.frame, [-42, 8, 0]), toW(p.frame, [36, 8, 0]), toW(p.frame, [0, 31, 0])];
  const q = pts.map((x) => proj(c, x));
  return [Math.min(...q.map((a) => a[0])) - ox, Math.max(...q.map((a) => a[0])) - ox, Math.min(...q.map((a) => a[1])), Math.max(...q.map((a) => a[1]))];
};
console.log('obs sStop', r(OBS_PATH.sStop), 'medic sStop', r(MEDIC_PATH.sStop));
for (let f = 315; f <= 462; f += 6) {
  const t = f / 30;
  const op = obsPose(t), mp = medicPose(t);
  const yawO = Math.atan2(-op.frame.x[2], op.frame.x[0]) * D;
  const yawM = Math.atan2(-mp.frame.x[2], mp.frame.x[0]) * D;
  let line = `f${f} t${t.toFixed(2)} obs(${r(op.frame.o[0])},${r(op.frame.o[2])}) yaw${r(yawO)} | med(${r(mp.frame.o[0])},${r(mp.frame.o[2])}) yaw${r(yawM)}`;
  if (f >= 372) {
    const c = povCam(t);
    const o = (FW - 1080) / 2;
    const mc = toW(mp.frame, [0, 12, 0]);
    const toCam = norm(sub(c.eye, mc));
    const va = Math.acos(Math.max(-1, Math.min(1, -dot(toCam, mp.frame.x)))) * D;
    const b = bbox(c, mp, o);
    const tl = proj(c, [-20, 56, -24]), tr = proj(c, [-20, 0, 24]);
    line += ` | POV medic x[${r(b[0])},${r(b[1])}] y[${r(b[2])},${r(b[3])}] d${r(depth(c, mc))} view${r(va)} tgt x[${r(Math.min(tl[0], tr[0]) - o)},${r(Math.max(tl[0], tr[0]) - o)}]`;
  } else {
    const c = s07Cam(t);
    const b = bbox(c, op, 0);
    line += ` | S07 obs x[${r(b[0])},${r(b[1])}] y[${r(b[2])},${r(b[3])}]`;
  }
  console.log(line);
}
