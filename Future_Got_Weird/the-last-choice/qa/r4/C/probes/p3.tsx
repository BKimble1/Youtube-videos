import {pilotC, flaresC, decoyC, droneC, HOLD_UP} from '/home/user/Youtube-videos/Future_Got_Weird/the-last-choice/source/src/r2/shots/C/crew';
import {figureRig} from '/home/user/Youtube-videos/Future_Got_Weird/the-last-choice/source/src/r2/rig';
import {makeView, toView, viewToScreen} from '/home/user/Youtube-videos/Future_Got_Weird/the-last-choice/source/src/r2/engine';
import {groundH} from '/home/user/Youtube-videos/Future_Got_Weird/the-last-choice/source/src/r2/world/ground';
import {T3, CUT} from '/home/user/Youtube-videos/Future_Got_Weird/the-last-choice/source/src/r2/shots/C/beats';
import {camPath} from '/home/user/Youtube-videos/Future_Got_Weird/the-last-choice/source/src/r2/film/stage';
import {CAM_C4B} from '/home/user/Youtube-videos/Future_Got_Weird/the-last-choice/source/src/r2/shots/C/cams';
const A0 = 46.9, A1 = 47.9;
const P = (v: any, p: any) => viewToScreen(v, toView(v, p));
type Cap = {a: any; b: any; r: number};
const caps = (R: any, hairR = 0.17): Cap[] => {
  const W = R.W, g = R.rig;
  const pel = {x: (g.hip[0].x + g.hip[1].x) / 2, y: (g.hip[0].y + g.hip[1].y) / 2, z: (g.hip[0].z + g.hip[1].z) / 2};
  const nk = g.neck;
  const out: Cap[] = [{a: W(pel), b: W(nk), r: 0.19}, {a: W(g.headC), b: W(g.headC), r: hairR}];
  for (let i = 0; i < 2; i++) {
    out.push({a: W(g.hip[i]), b: W(g.knee[i]), r: 0.085}, {a: W(g.knee[i]), b: W(g.ankle[i]), r: 0.07});
    out.push({a: W(g.sh[i]), b: W(g.el[i]), r: 0.065}, {a: W(g.el[i]), b: W(g.wr[i]), r: 0.055});
  }
  return out;
};
const segGap = (v: any, c: Cap, hp: any, hr: number) => {
  const a = P(v, c.a), b = P(v, c.b);
  const dx = b.x - a.x, dy = b.y - a.y; const L2 = dx * dx + dy * dy || 1;
  const u = Math.max(0, Math.min(1, ((hp.x - a.x) * dx + (hp.y - a.y) * dy) / L2));
  const px = a.x + dx * u, py = a.y + dy * u, k = a.k + (b.k - a.k) * u;
  return Math.hypot(hp.x - px, hp.y - py) - c.r * k - hr;
};
export const evalCam = (pos: any, target: any, fov: number, verbose = false) => {
  let worstC = 1e9, worstD = 1e9, tC = 0, tD = 0, lines: string[] = [], visF = 0, visD = 0, visH = 0, n = 0;
  for (let T = A0; T <= A1 + 1e-6; T += 1 / 30) {
    const v = makeView({pos, target, fov, roll: 0});
    const pl = pilotC(T, v), fl = flaresC(T, v), dc = decoyC(T, v);
    const Rp = figureRig(v, pl.spec), Rf = figureRig(v, fl.spec), Rd = figureRig(v, dc.spec);
    const hp = P(v, Rp.head), hr = 0.15 * hp.k;
    let gC = 1e9;
    for (const Rx of [Rf, Rd]) for (const c of caps(Rx)) gC = Math.min(gC, segGap(v, c, hp, hr));
    const hf = P(v, Rf.head), hd = P(v, Rd.head);
    const inF = (q: any) => q.x > 120 && q.x < 1800 && q.y > 80 && q.y < 1000;
    n++; if (inF(hf)) visF++; if (inF(hd)) visD++; if (inF(hp)) visH++;
    const dr = droneC(T), dd = P(v, dr.pos); const bw = 0.32 * dd.k, bh = 0.10 * dd.k;
    const cx = Math.max(dd.x - bw, Math.min(hp.x, dd.x + bw)), cy = Math.max(dd.y - bh, Math.min(hp.y, dd.y + bh));
    const gD = Math.hypot(hp.x - cx, hp.y - cy) - hr;
    if (gC < worstC) { worstC = gC; tC = T; }
    if (gD < worstD) { worstD = gD; tD = T; }
    if (verbose) lines.push(T.toFixed(2) + ' head(' + hp.x.toFixed(0) + ',' + hp.y.toFixed(0) + ') r' + hr.toFixed(0) + ' gapClimbers ' + gC.toFixed(0) + ' gapDrone ' + gD.toFixed(0));
  }
  return {worstC, tC, worstD, tD, lines, visF: visF / n, visD: visD / n, visH: visH / n};
};
if (process.argv[2] === 'cur') {
  const {CAM_C4B} = await import('/home/user/Youtube-videos/Future_Got_Weird/the-last-choice/source/src/r2/shots/C/cams');
  const k = CAM_C4B[0];
  const r = evalCam(k.pos, k.target, k.fov!, true);
  console.log(r.lines.join('\n')); console.log('worst climbers', r.worstC.toFixed(0), '@', r.tC.toFixed(2), 'drone', r.worstD.toFixed(0), '@', r.tD.toFixed(2));
}
if (process.argv[2] === 'cand') {
  const pb = pilotC(47.3).body.pos;
  const res: any[] = [];
  const rt = {x: Math.cos(54 * Math.PI / 180), z: Math.sin(54 * Math.PI / 180)}, f = {x: Math.sin(54 * Math.PI / 180), z: -Math.cos(54 * Math.PI / 180)};
  for (const back of [0.6, 1.4, 2.2]) for (const lat of [1.4, 2.2, 3.0]) for (const h of [1.2, 1.9]) for (const fov of [42, 48]) {
    const x = pb.x + f.x * back - rt.x * lat, z = pb.z + f.z * back - rt.z * lat;
    const pos = {x, y: groundH(x, z) + h, z};
    const target = {x: pb.x - 0.2, y: pb.y + 1.55, z: pb.z - 0.1};
    const r = evalCam(pos, target, fov);
    res.push({back, lat, h, fov, x: +x.toFixed(2), z: +z.toFixed(2), c: Math.round(r.worstC), dr: Math.round(r.worstD), vF: +r.visF.toFixed(2), vD: +r.visD.toFixed(2), vH: +r.visH.toFixed(2)});
  }
  res.sort((a, b) => (Math.min(b.c, b.dr, 80) + 100 * (b.vF + b.vD + b.vH)) - (Math.min(a.c, a.dr, 80) + 100 * (a.vF + a.vD + a.vH)));
  console.log(res.slice(0, 20).map((r) => JSON.stringify(r)).join('\n'));
}
if (process.argv[2] === 'grid') {
  const pb = pilotC(47.3).body.pos;
  const holds = [{r: -178, u: 352, f: 22}, {r: -178, u: 352, f: -30}, {r: -200, u: 400, f: -20}, {r: -150, u: 330, f: 40}];
  const res: any[] = [];
  for (const hold of holds) {
    Object.assign(HOLD_UP, hold);
    for (let back = 2.2; back <= 5.2; back += 0.6) for (let lat = -1.6; lat <= 2.8; lat += 0.6) for (const h of [0.9, 1.7, 2.5]) {
      // camera: 'back' m ahead of her along her heading (54 deg), 'lat' m to her left
      const f = {x: Math.sin(54 * Math.PI / 180), z: -Math.cos(54 * Math.PI / 180)};
      const l = {x: -f.z, z: f.x}; // right = (cos, sin) -> left = -right
      const rt = {x: Math.cos(54 * Math.PI / 180), z: Math.sin(54 * Math.PI / 180)};
      const x = pb.x + f.x * back - rt.x * lat, z = pb.z + f.z * back - rt.z * lat;
      const pos = {x, y: groundH(x, z) + h, z};
      const target = {x: pb.x, y: pb.y + 1.8, z: pb.z};
      const r = evalCam(pos, target, 40);
      res.push({hold: JSON.stringify(hold), back: +back.toFixed(1), lat: +lat.toFixed(1), h, x: +x.toFixed(2), z: +z.toFixed(2), c: Math.round(r.worstC), tC: r.tC.toFixed(2), dr: Math.round(r.worstD), tD: r.tD.toFixed(2)});
    }
  }
  res.sort((a, b) => Math.min(b.c, b.dr) - Math.min(a.c, a.dr));
  console.log(res.slice(0, 30).map((r) => JSON.stringify(r)).join('\n'));
}
if (process.argv[2] === 'one') {
  const pb = pilotC(47.3).body.pos;
  const [back, lat, h, fov] = process.argv.slice(3).map(Number);
  const rt = {x: Math.cos(54 * Math.PI / 180), z: Math.sin(54 * Math.PI / 180)}, f = {x: Math.sin(54 * Math.PI / 180), z: -Math.cos(54 * Math.PI / 180)};
  const x = pb.x + f.x * back - rt.x * lat, z = pb.z + f.z * back - rt.z * lat;
  const pos = {x, y: groundH(x, z) + h, z};
  const target = {x: pb.x - 0.2, y: pb.y + 1.55, z: pb.z - 0.1};
  const r = evalCam(pos, target, fov, true);
  console.log(JSON.stringify(pos), r.lines.join('\n'));
}

if (process.argv[2] === 'real') {
  const T0 = 46.9, T1 = 48.0;
  let lines: string[] = [];
  let wC = 1e9, wD = 1e9, wH = 1e9;
  for (let T = T0; T <= T1 + 1e-6; T += 1 / 30) {
    const cam = camPath(CAM_C4B, T - CUT.c4b, 0.5);
    const v = makeView(cam);
    const pl = pilotC(T, v), fl = flaresC(T, v), dc = decoyC(T, v);
    const Rp = figureRig(v, pl.spec), Rf = figureRig(v, fl.spec), Rd = figureRig(v, dc.spec);
    const hp = P(v, Rp.head), hr = 0.15 * hp.k;
    let gF = 1e9, gD = 1e9;
    for (const c of caps(Rf)) gF = Math.min(gF, segGap(v, c, hp, hr));
    for (const c of caps(Rd)) gD = Math.min(gD, segGap(v, c, hp, hr));
    const dr = droneC(T), dd = P(v, dr.pos); const bw = 0.41 * dd.k, bh = 0.10 * dd.k;
    const cx = Math.max(dd.x - bw, Math.min(hp.x, dd.x + bw)), cy = Math.max(dd.y - bh, Math.min(hp.y, dd.y + bh));
    const gDr = Math.hypot(hp.x - cx, hp.y - cy) - hr;
    const inF = (q: any) => q.x > 60 && q.x < 1860 && q.y > 40 && q.y < 1040;
    const hF = P(v, Rf.head), hD = P(v, Rd.head);
    wC = Math.min(wC, gF, gD); wD = Math.min(wD, gDr);
    lines.push(T.toFixed(2) + ' pilotHead(' + hp.x.toFixed(0) + ',' + hp.y.toFixed(0) + ') r' + hr.toFixed(0) + ' gap flares ' + gF.toFixed(0) + ' decoy ' + gD.toFixed(0) + ' drone ' + gDr.toFixed(0) + ' inFrame head/fl/dc/drone ' + [inF(hp), inF(hF), inF(hD), inF(dd)].map((b) => (b ? 1 : 0)).join(''));
  }
  console.log(lines.join('\n')); console.log('worst climbers gap', wC.toFixed(0), 'worst drone gap', wD.toFixed(0));
}
if (process.argv[2] === 'endlens') {
  const Ta = 48.8, Tb = 50.0;
  const res: any[] = [];
  const hs = (T: number) => { const a = pilotC(T), b = flaresC(T), c = decoyC(T); return [a.body.pos, b.body.pos, c.body.pos]; };
  const mid = (T: number) => { const [a, b, c] = hs(T); return {x: (a.x + b.x + c.x) / 3, y: (a.y + b.y + c.y) / 3 + 1.5, z: (a.z + b.z + c.z) / 3}; };
  for (let x = -7.4; x <= -3; x += 0.55) for (let z = 0.2; z <= 4.4; z += 0.6) for (const h of [1.0, 1.9, 2.8]) for (const fov of [46]) {
    const pos = {x, y: groundH(x, z) + h, z};
    let worst = 1e9, vis = 0, n = 0;
    for (let T = Ta; T <= Tb + 1e-6; T += 1 / 15) {
      const m = mid(T);
      const v = makeView({pos, target: m, fov, roll: 0});
      const pl = pilotC(T, v), fl = flaresC(T, v), dc = decoyC(T, v);
      const R = [figureRig(v, pl.spec), figureRig(v, fl.spec), figureRig(v, dc.spec)];
      const H = R.map((r) => P(v, r.head));
      let g = 1e9;
      for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) if (i !== j) for (const c of caps(R[j])) g = Math.min(g, segGap(v, c, H[i], 0.15 * H[i].k));
      worst = Math.min(worst, g);
      n++; if (H.every((q: any) => q.x > 100 && q.x < 1820 && q.y > 60 && q.y < 1020)) vis++;
    }
    res.push({x: +x.toFixed(1), z: +z.toFixed(1), h, fov, worst: Math.round(worst), vis: +(vis / n).toFixed(2)});
  }
  res.sort((a, b) => (Math.min(b.worst, 60) + 80 * b.vis) - (Math.min(a.worst, 60) + 80 * a.vis));
  console.log(res.slice(0, 14).map((r) => JSON.stringify(r)).join('\n'));
}
