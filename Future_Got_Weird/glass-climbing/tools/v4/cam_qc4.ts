// V4 camera-track QC: for every shot whose camera is a plain function of the frame (CAMS4), the per-frame camera
// (x, y, log z) is checked for: more than one move (separate runs of motion), any reversal of direction in x, y or
// zoom (a bounce, an overshoot or an oscillating zoom), and the peak screen speed (pan in screen pixels per frame at
// the shot's zoom, zoom in % per frame). usage: node cam_qc4.cjs
import {CAMS4, SHOTS4} from '../../source/src/v4/shots4';

const EPS = {pos: 0.02, z: 1e-5};
let ok = true;
for (const s of SHOTS4) {
  const fn = CAMS4[s.name];
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
