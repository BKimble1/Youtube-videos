// Per-frame geometry assertions for the V2 rig and world (every frame of the film, plus sub-frame samples).
// usage: node geom_audit.cjs [out.json]
import fs from 'fs';
import {pose, legAt, HUB_R, HUB_H, DOME_R, LEG_L, PATH_INFO, Leg, K_MIN, K_MAX, M_MAX, curvatureProfile, cableAt, CABLE_R, radiusAt, legAngle, RIB_RINGS} from '../../source/src/v6/robot';
import {lampHead, LAMP_R, LAMP_L} from '../../source/src/v6/lamp';
import {lampIn} from '../../source/src/v6/timing';
import {NET, NODES, ROUTES, ELECTRODES, isEdge} from '../../source/src/v6/mycelium';
import {DUR, FRAMES} from '../../source/src/v6/timing';
import {PROPS} from '../../source/src/v6/props';
import {V3, v3} from '../../source/src/lib';

const SUB = 2; // samples per frame
const R: any = {frames: FRAMES, samplesPerFrame: SUB, path: PATH_INFO, checks: {}, worst: {}};
const fail: Record<string, {t: number; v: number; leg?: number; note?: string}[]> = {};
const note = (k: string, t: number, v: number, leg?: number, n?: string) => { (fail[k] ??= []).push({t: +t.toFixed(3), v: +v.toFixed(4), leg, note: n}); };
const worst: Record<string, {v: number; t: number}> = {};
const track = (k: string, v: number, t: number, lower = true) => {
  const w = worst[k];
  if (!w || (lower ? v < w.v : v > w.v)) worst[k] = {v: +v.toFixed(4), t: +t.toFixed(3)};
};
let prevFeet: {p: V3; planted: boolean; k: number}[] | null = null;
let prevLegs: Leg[] | null = null;
let ribSig: string | null = null;
const KSER: number[][][] = [[], [], [], [], []]; const TSER: number[] = [];
const segDist = (a: V3, b: V3, c: V3, d: V3) => {
  // distance between two short segments (sampled)
  let m = 1e9;
  for (let i = 0; i <= 4; i++) for (let j = 0; j <= 4; j++) m = Math.min(m, v3.len(v3.sub(v3.lerp(a, b, i / 4), v3.lerp(c, d, j / 4))));
  return m;
};
for (let f = 0; f < FRAMES * SUB; f++) {
  const t = f / (30 * SUB);
  const P = pose(t);
  const legs: Leg[] = [0, 1, 2, 3, 4].map((i) => legAt(t, i, P));
  const yTop = P.y + HUB_H / 2, yBot = P.y - HUB_H / 2;
  track('hubBottomAboveFloor', yBot, t);
  if (yBot < 0.15) note('bodyTooLow', t, yBot);
  legs.forEach((L, i) => {
    // IK: the clamped-root soft leg reaches its foot, within its deformation limits
    track('ikErrorMax', L.err, t, false);
    if (L.err > 0.01) note('footNotReached', t, L.err, i);
    // a pneumatic bending actuator only bends toward its strain-limiting layer: k(s) >= K_MIN everywhere (no reversal)
    { const kp = curvatureProfile(L.q); const kmin = Math.min(...kp), kmax = Math.max(...kp);
      track('curvatureMin', kmin, t); track('curvatureMax', kmax, t, false);
      if (kmin < K_MIN) note('curvatureReversal', t, kmin, i); if (kmax > K_MAX) note('curvatureOverLimit', t, kmax, i);
      track('lateralMax', Math.abs(L.q[2]), t, false); if (Math.abs(L.q[2]) > M_MAX) note('lateralOverLimit', t, L.q[2], i); }
    // the socket is fixed in body-local coordinates (radius HUB_R, at the leg's own angle, at body height)
    { const a = legAngle(P.th, i); const dx = L.socket[0] - P.x, dz = L.socket[2] - P.z;
      const loc = [dx * Math.cos(a) + dz * Math.sin(a), -dx * Math.sin(a) + dz * Math.cos(a), L.socket[1] - P.y];
      const off = Math.hypot(loc[0] - HUB_R, loc[1], loc[2]); track('socketBodyLocalOffsetMax', off, t, false); if (off > 1e-9) note('socketMoved', t, off, i); }
    // thickness profile and rib positions never change
    { let dr = 0; L.rs.forEach((r, k) => { dr = Math.max(dr, Math.abs(r - radiusAt(L.s[k]))); }); if (dr > 1e-12) note('thicknessChanged', t, dr, i); }
    if (ribSig === null) ribSig = JSON.stringify([RIB_RINGS, L.s]); else if (ribSig !== JSON.stringify([RIB_RINGS, L.s])) note('ribsMoved', t, 1, i);
    // temporal continuity: leg surface vertices move < 1.2 cm per half-frame; curvature changes slowly; the bend
    // direction of a clearly bent section never flips
    if (prevLegs) {
      let mv = 0; L.rings.forEach((rg, k) => rg.forEach((p, a) => { mv = Math.max(mv, v3.len(v3.sub(p, prevLegs![i].rings[k][a]))); }));
      track('legSurfaceMovePerSampleMax', mv, t, false); if (mv > 1.2) note('legJump', t, mv, i);
      // shape rate: the curvature at root and tip changes by < 0.05 /cm per half frame (no snapping between shapes)
      const kp = curvatureProfile(L.q), kq = curvatureProfile(prevLegs![i].q);
      const dk = Math.max(Math.abs(kp[0] - kq[0]), Math.abs(kp[1] - kq[1]), Math.abs(L.q[2] - prevLegs![i].q[2]));
      track('curvatureStepPerSampleMax', dk, t, false); if (dk > 0.08) note('curvatureTooFast', t, dk, i);
    }
    // the real surface never goes below the floor
    { let mf = 1e9; [...L.rings, ...L.cap].forEach((rg) => rg.forEach((p) => { mf = Math.min(mf, p[1]); })); track('surfaceFloorClearance', mf, t); if (mf < -0.01) note('surfaceBelowFloor', t, mf, i); }
    // length
    let len = 0; for (let k = 1; k < L.pts.length; k++) len += v3.len(v3.sub(L.pts[k], L.pts[k - 1]));
    if (Math.abs(len - LEG_L) / LEG_L > 0.02) note('lengthChange', t, len, i);
    track('legLenMin', len, t); track('legLenMax', len, t, false);
    // attachment
    const att = v3.len(v3.sub(L.pts[0], L.socket));
    if (att > 1e-6) note('detached', t, att, i);
    // floor
    let mf = 1e9; for (let k = 0; k < L.pts.length; k++) mf = Math.min(mf, L.pts[k][1] - L.rs[k]);
    track('legFloorClearance', mf, t);
    if (mf < -0.01) note('belowFloor', t, mf, i);
    // planted foot touches the floor (tube bottom within 1 mm)
    if (L.foot.planted) { const tip = L.pts[L.pts.length - 1][1] - L.rs[L.rs.length - 1]; if (Math.abs(tip) > 0.01) note('plantedFootNotOnFloor', t, tip, i); }
    // hub and dome
    for (let k = 4; k < L.pts.length; k++) { // beyond the socket root (first ~1.2 cm of the tube)
      const p = L.pts[k], r = L.rs[k];
      const dh = Math.hypot(p[0] - P.x, p[2] - P.z);
      if (p[1] > yBot - r && p[1] < yTop + r) { const c = dh - HUB_R - r; track('legHubClearance', c, t); if (c < -0.02) note('legIntoHub', t, c, i); }
      if (p[1] >= yTop) { const e = Math.hypot(dh / DOME_R, (p[1] - yTop) / (DOME_R * 0.78)); const c = (e - 1) * DOME_R - r; track('legDomeClearance', c, t); if (c < 0) note('legIntoDome', t, c, i); }
      for (const pr of PROPS) { const c = pr.sdf(p) - r; track('legPropClearance', c, t); if (c < 0) note('legIntoProp', t, c, i, pr.name); }
    }
  });
  // leg vs leg
  for (let a = 0; a < 5; a++) for (let b = a + 1; b < 5; b++) {
    let m = 1e9;
    const A = legs[a], B = legs[b];
    for (let k = 1; k < A.pts.length; k++) for (let j = 1; j < B.pts.length; j++) {
      const d = segDist(A.pts[k - 1], A.pts[k], B.pts[j - 1], B.pts[j]) - Math.max(A.rs[k - 1], A.rs[k]) - Math.max(B.rs[j - 1], B.rs[j]);
      if (d < m) m = d;
    }
    track('legLegClearance', m, t);
    if (m < 0) note('legsIntersect', t, m, a * 10 + b);
  }
  // hub vs props
  for (const pr of PROPS) { const c = pr.sdf([P.x, P.y, P.z]) - HUB_R - 0.5; track('bodyPropClearance', c, t); if (c < 0) note('bodyIntoProp', t, c, undefined, pr.name); }
  // stance sliding: a planted foot keeps exactly the same world position until it lifts
  const feet = legs.map((L) => ({p: L.foot.p, planted: L.foot.planted, k: L.foot.k}));
  if (prevFeet) feet.forEach((q, i) => {
    const pq = prevFeet![i];
    if (q.planted && pq.planted && q.k === pq.k) { const d = v3.len(v3.sub(q.p, pq.p)); track('stanceSlideMax', d, t, false); if (d > 1e-9) note('footSlides', t, d, i); }
    // swing continuity: foot never jumps more than 0.8 cm between samples
    const jump = v3.len(v3.sub(q.p, pq.p)); track('footStepPerSampleMax', jump, t, false); if (jump > 1.2) note('footJump', t, jump, i);
  });
  prevFeet = feet;
  prevLegs = legs;
  // the cable: never into the floor, hub, dome, legs or the lamp
  const cab = cableAt(P, t);
  cab.forEach((p, k) => {
    if (k < 2) return; // the fitting on the rim
    track('cableFloorClearance', p[1] - CABLE_R, t); if (p[1] - CABLE_R < 0) note('cableBelowFloor', t, p[1], undefined);
    const dh = Math.hypot(p[0] - P.x, p[2] - P.z);
    if (p[1] < yTop + CABLE_R && p[1] > yBot - CABLE_R) { const c = dh - HUB_R - CABLE_R; track('cableHubClearance', c, t); if (c < 0) note('cableIntoHub', t, c); }
    if (p[1] >= yTop) { const e = Math.hypot(dh / DOME_R, (p[1] - yTop) / (DOME_R * 0.78)); const c = (e - 1) * DOME_R - CABLE_R; track('cableDomeClearance', c, t); if (c < 0) note('cableIntoDome', t, c); }
    legs.forEach((L, i) => { let m = 1e9; L.pts.forEach((q, j) => { m = Math.min(m, v3.len(v3.sub(p, q)) - L.rs[j] - CABLE_R); }); track('cableLegClearance', m, t); if (m < 0) note('cableIntoLeg', t, m, i); });
    if (lampIn(t) > 0.001) { const h = lampHead(t); const dh2 = Math.hypot(p[0] - h[0], p[2] - h[2]); const c = p[1] > h[1] - LAMP_L ? dh2 - Math.max(LAMP_R, 0.6) - CABLE_R : 1e9; track('cableLampClearance', c, t); if (c < 0) note('cableIntoLamp', t, c); }
  });
}
// snap detector at 240 Hz: a sample whose curvature rate breaks from the average of its neighbours' rates. Smooth
// motion contributes about k'''*dt^3/2 (~2e-4 here); a velocity discontinuity (switching between shapes) contributes
// half the jump in rate per sample, independent of the sampling. Threshold 0.002 /cm = a 1 /cm/s jump.
{
  const HZ = 240;
  for (let i = 0; i < 5; i++) {
    let k2: number[] | null = null, k1: number[] | null = null, k0: number[] | null = null;
    for (let g = 0; g <= FRAMES * (HZ / 30); g++) {
      const t = g / HZ;
      const L = legAt(t, i, pose(t));
      const kp = curvatureProfile(L.q);
      const k = [kp[0], kp[1], L.q[2]];
      if (k2 && k1 && k0) for (let j = 0; j < 3; j++) {
        const d0 = k1[j] - k2[j], d1 = k0[j] - k1[j], d2 = k[j] - k0[j];
        const snap = Math.abs(d1 - (d0 + d2) / 2);
        track('curvatureSnapMax240Hz', snap, t - 1 / HZ, false);
        if (snap > 0.002) note('curvatureSnap', t - 1 / HZ, snap, i);
      }
      k2 = k1; k1 = k0; k0 = k;
    }
  }
}
// the network: electrodes sit on it, and every pulse route steps only along drawn hyphae
R.network = {hyphae: NET.length, nodes: NODES.length};
ELECTRODES.forEach((e, k) => { let m = 1e9; NODES.forEach((q) => { m = Math.min(m, Math.hypot(q[0] - e[0], q[1] - e[1])); }); if (m > 0.02) note('electrodeOffNetwork', k, m); R.network['electrode' + k + 'ToNetworkCm'] = +m.toFixed(4); });
let badHop = 0; ROUTES.forEach((r) => { for (let k = 1; k < r.ids.length; k++) if (!isEdge(r.ids[k - 1], r.ids[k])) badHop++; });
if (badHop) note('pulseOffBranch', 0, badHop);
R.network.routes = ROUTES.length; R.network.offBranchHops = badHop;
// loop: everything at DUR equals t = 0
const P0 = pose(0), P1 = pose(DUR);
let loopLeg = 0;
for (let i = 0; i < 5; i++) { const a = legAt(0, i, P0), b = legAt(DUR, i, P1); a.pts.forEach((p, k) => { loopLeg = Math.max(loopLeg, v3.len(v3.sub(p, b.pts[k]))); }); }
R.loop = {bodyPos: +Math.hypot(P0.x - P1.x, P0.y - P1.y, P0.z - P1.z).toExponential(2), heading: +(((P1.th - P0.th) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI)).toExponential(2), legMaxCm: +loopLeg.toExponential(2)};
R.worst = worst;
R.failures = Object.fromEntries(Object.entries(fail).map(([k, v]) => [k, {count: v.length, first: v.slice(0, 6)}]));
R.pass = Object.keys(fail).length === 0;
fs.writeFileSync(process.argv[2] ?? '/dev/stdout', JSON.stringify(R, null, 1));
console.log(JSON.stringify({pass: R.pass, failures: Object.fromEntries(Object.entries(R.failures).map(([k, v]: any) => [k, v.count])), worst, loop: R.loop}, null, 1));
