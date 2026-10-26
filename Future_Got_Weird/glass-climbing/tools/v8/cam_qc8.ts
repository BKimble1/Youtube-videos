// V8 camera-track QC: for every shot whose camera is a plain function of the frame (CAMS8, and the exterior cameras
// CAMS8_3D: eye, target and focal length), the per-frame camera
// (x, y, log z) is checked for: more than one move (separate runs of motion), any reversal of direction in x, y or
// zoom (a bounce, an overshoot or an oscillating zoom), and the peak screen speed (pan in screen pixels per frame at
// the shot's zoom, zoom in % per frame). usage: npx tsx tools/v8/cam_qc8.ts
import {CAMS8, CAMS8_3D, SHOTS8} from '../../source/src/v8/shots8';

const EPS = {pos: 0.02, z: 1e-5};
let ok = true;
for (const s of SHOTS8) {
  const f3 = CAMS8_3D[s.name];
  if (f3) {
    // exterior: each of eye x/y/z, target x/y/z and the focal length moves in one direction at most
    const cs = Array.from({length: s.to - s.from}, (_, i) => f3(s.from + i));
    const comps = (c: (typeof cs)[0]) => [c.eye.x, c.eye.y, c.eye.z, c.target.x, c.target.y, c.target.z, c.f];
    let flips = 0, runs = 0, wasMoving = false;
    const last = comps(cs[0]).map(() => 0);
    for (let i = 1; i < cs.length; i++) {
      const a = comps(cs[i - 1]), b = comps(cs[i]);
      let moving = false;
      b.forEach((v, k) => {
        const dv = v - a[k], sg = Math.abs(dv) > 1e-5 ? Math.sign(dv) : 0;
        if (sg) moving = true;
        if (sg && last[k] && sg !== last[k]) flips++;
        if (sg) last[k] = sg;
      });
      if (moving && !wasMoving) runs++;
      wasMoving = moving;
    }
    const bad = runs > 1 || flips > 0;
    if (bad) ok = false;
    console.log(`${s.name.padEnd(4)} ${s.from}-${s.to}: exterior, moves ${runs}, reversals ${flips}${bad ? '  <-- FAIL' : ''}`);
    continue;
  }
  const fn = CAMS8[s.name];
  if (!fn) {
    console.log(`${s.name.padEnd(4)} ${s.from}-${s.to}: own camera (scale bridge / split), checked on sheets`);
    continue;
  }
  const cs = Array.from({length: s.to - s.from}, (_, i) => fn(s.from + i));
  const d = cs.slice(1).map((c, i) => ({x: (c.x - cs[i].x) * c.z, y: (c.y - cs[i].y) * c.z, z: Math.log(c.z) - Math.log(cs[i].z)}));
  const moving = d.map((v) => Math.abs(v.x) > EPS.pos || Math.abs(v.y) > EPS.pos || Math.abs(v.z) > EPS.z);
  let runs = 0;
  moving.forEach((m, i) => { if (m && (i === 0 || !moving[i - 1])) runs++; });
  const flips = (k: 'x' | 'y' | 'z') => {
    let n = 0, last = 0;
    const eps = k === 'z' ? EPS.z : EPS.pos;
    for (const v of d) {
      const sg = Math.abs(v[k]) > eps ? Math.sign(v[k]) : 0;
      if (sg && last && sg !== last) n++;
      if (sg) last = sg;
    }
    return n;
  };
  const fx = flips('x'), fy = flips('y'), fz = flips('z');
  const pan = Math.max(0, ...d.map((v) => Math.hypot(v.x, v.y)));
  const zm = Math.max(0, ...d.map((v) => Math.abs(v.z))) * 100;
  const bad = runs > 1 || fx || fy || fz;
  if (bad) ok = false;
  console.log(`${s.name.padEnd(4)} ${s.from}-${s.to}: moves ${runs}, reversals x${fx} y${fy} z${fz}, peak pan ${pan.toFixed(1)} px/f, peak zoom ${zm.toFixed(2)} %/f${bad ? '  <-- FAIL' : ''}`);
}
console.log(ok ? 'camera QC: every shot holds or makes one move, no reversals' : 'camera QC: FAIL');
