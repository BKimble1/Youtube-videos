// LIQUID METAL ROBOT V1 (26.0 s). One continuous camera on one lab bench, following one piece of metal:
//  1-2  the winning preview: a cast gallium figure melts in a cage on a flat induction coil, a hand-held magnet pulls
//       the liquid out between the bars and drags it into an open figure-shaped mould, it freezes, and the magnet lifts
//       the recast figure out and stands it outside the cage;
//  3    the camera pushes into the figure's chest, a cut window opens and shows a polished section: gallium grains with
//       embedded NdFeB microparticles; back out;
//  4    the coil switches on: the figure softens from the soles up into a mirror puddle; the magnet steers the puddle
//       along an S-curve; the coil switches off, a freeze front turns it matte and the magnet slides it as a rigid slug;
//  5    pulling back reveals a clear stomach model on an acrylic stage on the same bench, a ball inside; the magnet
//       draws the slug through the model's esophagus tube to the ball;
//  6    a second coil under the stage heats it: it melts, flows round the ball and climbs into a collar, freezes into a
//       grip, and the magnet (outside the model) pulls ball and grip back out through the tube;
//  7    the assembly slides out onto the bench while the camera pulls back to show how small it is.
// Science: Wang et al., Matter 2023 (MPTM). Heating is the coils' alternating field; motion is always the external
// magnet; the recast uses a mould; the stomach is a model.
import React from 'react';
import {HookProps} from '../shared/HookFrame';
import {FilmFrame} from './captions';
import {clamp, keyCR, ss} from '../shared/lib';
import {a3, Cam, circlePts, ellipsoid, facingAngle, m3, project, V3, v3} from './cam';
import {FIG_H, FIG_T, FigureArt, FigureSheen, meltDeform, PARTS, partPath} from './figure';
import {Box, Goo, gooBox, GooLayer} from './liquid';
import {cameraPrev, castPose, magnetAt, TP} from './motion';
import {affine, affStr, ap, Lip, lump, openingState, pathScreen, s3v, toLocal} from './opening';
import {Bench, cage, frontRegion, Magnet, MOULD, MouldBody, Pad, RP, ZT} from './props';
import {Ball, ballDisk, CCoil, ModelFloor, ModelShell, Stage, Stub, Tube} from './props2';
import {SoftShadow} from './shade';
import {CutWindow} from './macro';
import {Inked, InkPath} from '../shared/ink';
import {BALL0, BALL_R, ballAt, P2_0, PREV_END, puddleAt, slugAt, SLUG_TOUCH, STAGE, T, TUBE, W, warpPrev} from './timeline';

// ---------------------------------------------------------------- camera
const CK: [number, number, number, number, number, number, number][] = [
  // t, target x, y, z, scale (px/cm), pitch, yaw
  [5.1, 0.92, -1.85, 1.12, 330, 39.5, 4],
  [5.75, 1.12, -1.7, 1.28, 1250, 25, 1.5],
  [6.45, 1.13, -1.72, 1.32, 5000, 14, 0],
  [T.peak, 1.13, -1.72, 1.32, 13000, 12, -0.5],
  [7.4, 1.13, -1.7, 1.24, 3000, 19, -1.5],
  [7.72, 1.12, -1.63, 1.0, 900, 30, -3],
  [8.02, 1.1, -1.6, 0.82, 510, 36, -4],
  [8.8, 1.1, -1.6, 0.68, 455, 38.5, -3.8],
  [9.6, 1.12, -1.62, 0.55, 430, 40, -3],
  [10.7, 1.5, -1.15, 0.5, 400, 41, -1],
  [11.65, 1.8, 0.05, 0.5, 420, 42, 1],
  [12.6, 1.86, 0.28, 0.45, 490, 44, 2],
  [13.5, 2.0, 0.3, 0.5, 450, 44, 2],
  [14.4, 2.75, 0.2, 0.6, 320, 44, 1],
  [15.4, 4.9, -0.05, 0.9, 150, 48, 0],
  [16.5, 7.35, -0.3, 0.9, 124, 52, -1],
  [17.4, 6.8, 0.3, 0.7, 205, 51, -3],
  [18.2, 7.2, 0.62, 0.55, 380, 50, -4],
  [18.9, 7.62, 0.8, 0.55, 600, 50, -2],
  [20.4, 7.86, 0.86, 0.6, 720, 50, 7],
  [21.3, 7.85, 0.86, 0.6, 660, 49, 6],
  [21.9, 7.25, 0.7, 0.6, 540, 48, 4],
  [22.5, 5.95, 0.36, 0.65, 400, 47, 2],
  [23.2, 4.7, 0.25, 0.75, 240, 46, 0],
  [24.2, 4.6, -0.1, 0.9, 125, 45, -2],
  [25.1, 2.7, -0.2, 0.95, 175, 41, -4],
  [26.0, 0.9, -0.3, 1.0, 265, 37, -6],
];
const ch = (t: number, i: number) => keyCR(t, CK.map((r) => [r[0], i === 4 ? Math.log(r[4]) : r[i]] as [number, number]));
const camNew = (t: number): Cam => ({t: v3(ch(t, 1), ch(t, 2), ch(t, 3)), s: Math.exp(ch(t, 4)), pitch: ch(t, 5), yaw: ch(t, 6), D: 30, cx: 540, cy: 1010});
export const camera = (t: number): Cam => {
  const a = cameraPrev(warpPrev(Math.min(t, 5.2)));
  if (t <= 4.75) return a;
  const b = camNew(t);
  const u = ss(t, 4.75, 5.2);
  const L = (x: number, y: number) => x + (y - x) * u;
  return {t: v3(L(a.t.x, b.t.x), L(a.t.y, b.t.y), L(a.t.z, b.t.z)), s: Math.exp(L(Math.log(a.s), Math.log(b.s))), pitch: L(a.pitch, b.pitch), yaw: L(a.yaw, b.yaw), D: 30, cx: 540, cy: 1010};
};

// ---------------------------------------------------------------- magnet
const lv = (a: V3, b: V3, u: number) => v3(a.x + (b.x - a.x) * u, a.y + (b.y - a.y) * u, a.z + (b.z - a.z) * u);
const MK: [number, number, number, number][] = [
  [5.45, 1.35, -1.65, 3.0], [6.3, 3.0, -1.5, 4.2], [9.4, 3.3, -2.4, 3.2], [9.95, 2.45, -2.0, 1.45], [T.steer0, 1.86, -1.72, 0.95],
  [T.steer0 + 0.5, 2.45, -1.08, 0.92], [T.steer0 + 0.98, 2.27, -0.2, 0.92], [T.steer1, 2.55, 0.4, 0.95], [T.steer1 + 0.45, 2.75, 0.62, 1.8],
  [13.0, 2.85, 0.45, 1.55], [T.pull0 - 0.08, 2.58, 0.3, 0.93],
];
const keyM = (t: number) => v3(keyCR(t, MK.map((r) => [r[0], r[1]])), keyCR(t, MK.map((r) => [r[0], r[2]])), keyCR(t, MK.map((r) => [r[0], r[3]])));
const dzOver = (x: number) => 0.58 + 0.95 * ss(x, 2.9, 3.6) + 0.85 * ss(x, 5.3, 6.3);
const lead = (f: (t: number) => V3, t: number, d: number, fb: [number, number]) => {
  const a = f(t - 0.06), b = f(t + 0.06);
  const vx = b.x - a.x, vy = b.y - a.y, l = Math.hypot(vx, vy);
  const w = clamp(l / 0.04);
  const nx = w * (l ? vx / l : 0) + (1 - w) * fb[0], ny = w * (l ? vy / l : 0) + (1 - w) * fb[1];
  const nl = Math.hypot(nx, ny) || 1;
  return {x: (nx / nl) * d, y: (ny / nl) * d};
};
const magnetV1 = (t: number): V3 => {
  let M = keyM(t);
  if (t > T.pull0 - 0.12) {
    const s = slugAt(t + 0.12);
    const ld = lead(slugAt, t + 0.12, 0.72, [1, 0]);
    const F = v3(s.x + ld.x, s.y + ld.y, ZT + dzOver(s.x));
    M = lv(M, F, ss(t, T.pull0 - 0.12, T.pull0 + 0.1));
  }
  if (t > T.wrap0 - 0.3) M = lv(M, v3(8.75, 1.85, 4.1), ss(t, T.wrap0 - 0.3, T.wrap0 + 0.35));
  if (t > 20.85) {
    const b = ballAt(t + 0.1);
    const ld = lead(ballAt, t + 0.1, 0.75, [-1, -0.2]);
    const F = v3(b.x + ld.x, b.y + ld.y, ZT + dzOver(b.x) + 0.05);
    M = lv(M, F, ss(t, 20.85, T.carry0 - 0.02));
  }
  return v3(M.x + 0.012 * Math.sin(t * 7.1), M.y + 0.01 * Math.sin(t * 5.3 + 1), M.z + 0.012 * Math.sin(t * 6.2 + 2));
};

// ---------------------------------------------------------------- liquid helpers
const surfZ = (x: number, y: number) =>
  Math.hypot(x, y) <= RP || (x >= MOULD.x0 && x <= MOULD.x1 && y >= MOULD.y0 && y <= MOULD.y1) || (x >= STAGE.x0 && x <= STAGE.x1 && y >= STAGE.y0 && y <= STAGE.y1) ? ZT : 0;

/** a puddle of the figure's volume: a flat body with a lumpy rim; tw drives the wobble (frozen when solid) */
const puddle = (c: Cam, P: V3, r: number, tw: number, stretch = 0, sang = 0, att = 0, aang = 0): Goo[] => {
  const out: Goo[] = [];
  const wob = 1 + 0.05 * Math.sin(tw * 9.5);
  out.push({k: 'e', e: lump(c, P, r * (1 + 0.35 * stretch) * wob, (r * (1 - 0.18 * stretch)) / wob, 0.3, sang), g: 'flat'});
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2 + 0.7 + 0.2 * Math.sin(tw * 2.1 + i);
    const rr = r * (0.55 + 0.05 * Math.sin(tw * 3.3 + i * 1.9));
    out.push({k: 'e', e: lump(c, v3(P.x + rr * Math.cos(a), P.y + rr * Math.sin(a), ZT), r * 0.42, r * 0.36, 0.24, a), g: 'dome'});
  }
  if (att > 0.02) {
    const tq = v3(P.x + Math.cos(aang) * r * 0.7 * att, P.y + Math.sin(aang) * r * 0.7 * att, ZT);
    out.push({k: 'e', e: lump(c, tq, r * 0.55, r * 0.42, 0.28, aang), g: 'dome'});
    const pk = v3(P.x + Math.cos(aang) * r * 0.55 * att, P.y + Math.sin(aang) * r * 0.55 * att, ZT + 0.12 + 0.16 * att);
    const pr = r * (0.2 + 0.18 * att);
    out.push({k: 'e', e: ellipsoid(c, pk, [v3(pr, 0, 0), v3(0, pr, 0), v3(0, 0, 0.1 + 0.2 * att)]), g: 'dome'});
  }
  return out;
};
const PHI0 = Math.atan2(SLUG_TOUCH.y - BALL0.y, SLUG_TOUCH.x - BALL0.x);
/** the metal flowing round the ball and climbing it into a cup; w 0..1, B the ball centre. Returns the goo and the
 *  latitude (deg) of the cup's rim, for the ball-front mask */
const collar = (c: Cam, B: V3, w: number, tw: number): {items: Goo[]; lat: number} => {
  const out: Goo[] = [];
  const ew = w * w * (3 - 2 * w);
  const dq = 0.73 + (0.36 - 0.73) * ew;
  const rq = 0.47 * (1 - 0.72 * ss(w, 0.1, 0.75));
  const Q = v3(B.x + Math.cos(PHI0) * dq, B.y + Math.sin(PHI0) * dq, ZT);
  if (rq > 0.02) out.push({k: 'e', e: lump(c, Q, rq * (1 + 0.04 * Math.sin(tw * 8)), rq * 0.92, 0.3, PHI0), g: 'flat'});
  const alpha = ((14 + 168 * ss(w, 0, 0.7)) * Math.PI) / 180; // half-angle of the flow round the ball
  const lat = -55 + 85 * ss(w, 0.25, 1); // the rim climbs from below the equator to above it
  const n = 26;
  if (w > 0.005)
    for (let i = 0; i < n; i++) {
      const f = i / (n - 1);
      const phi = PHI0 - alpha + 2 * alpha * f;
      const edge = Math.min(1, Math.min(f, 1 - f) * 6); // thinner at the two advancing tips
      const wob = 1 + 0.06 * Math.sin(tw * 9 + i * 1.7);
      // the foot of the cup on the floor, hugging the ball
      const rf = (0.075 + 0.04 * edge) * wob;
      const rad = BALL_R * 0.92;
      out.push({k: 'e', e: lump(c, v3(B.x + Math.cos(phi) * rad, B.y + Math.sin(phi) * rad, ZT), rf, rf * 0.8, 0.16, phi), g: 'dome'});
      // the film climbing the sphere, latitude by latitude up to the rim
      const latP = lat + 16 * Math.cos(3 * (phi - PHI0)) * ss(w, 0.3, 1); // a scalloped rim: three claws
      for (let L = -50; L <= latP; L += 16) {
        const la = (L * Math.PI) / 180;
        const rr = (0.06 + 0.02 * edge) * wob;
        const q = v3(B.x + Math.cos(phi) * Math.cos(la) * (BALL_R + 0.03), B.y + Math.sin(phi) * Math.cos(la) * (BALL_R + 0.03), B.z + Math.sin(la) * (BALL_R + 0.03));
        out.push({k: 'e', e: ellipsoid(c, q, [v3(rr, 0, 0), v3(0, rr, 0), v3(0, 0, rr)]), g: 'dome'});
      }
    }
  return {items: out, lat};
};

/** a goo set rendered liquid, solid, or part-way (a front sweeping across it along screen direction dir) */
const GooPair: React.FC<{id: string; items: Goo[]; sigma: number; box: Box; ink: number; p: number; dir: [number, number]; mask?: string}> = ({id, items, sigma, box, ink, p, dir, mask}) => {
  if (!items.length) return null;
  const cx = (box.x0 + box.x1) / 2, cy = (box.y0 + box.y1) / 2, hw = Math.max(box.x1 - box.x0, box.y1 - box.y0) / 2;
  return (
    <g mask={mask}>
      {p < 0.999 && <GooLayer id={`${id}L`} items={items} sigma={sigma} box={box} ink={ink} />}
      {p > 0.001 && (
        <>
          <defs>
            <linearGradient id={`${id}-fg`} gradientUnits="userSpaceOnUse" x1={cx - dir[0] * hw} y1={cy - dir[1] * hw} x2={cx + dir[0] * hw} y2={cy + dir[1] * hw}>
              <stop offset={Math.max(0, p * 1.2 - 0.12)} stopColor="#FFF" />
              <stop offset={Math.min(1, p * 1.2)} stopColor="#000" />
            </linearGradient>
            <mask id={`${id}-fm`} maskUnits="userSpaceOnUse" x={box.x0} y={box.y0} width={box.x1 - box.x0} height={box.y1 - box.y0}>
              <rect x={box.x0} y={box.y0} width={box.x1 - box.x0} height={box.y1 - box.y0} fill={p >= 0.999 ? '#FFF' : `url(#${id}-fg)`} />
            </mask>
          </defs>
          <GooLayer id={`${id}S`} items={items} sigma={sigma} box={box} ink={ink} solid={1} mask={`url(#${id}-fm)`} />
        </>
      )}
    </g>
  );
};

const BREAKS = [7, 12, 16, 21, 28, 33, 40, 43, 46, 50, 56, 62];

const Scene: React.FC<{t: number}> = ({t}) => {
  const tp = warpPrev(t);
  const c = camera(t);
  const k0 = c.s;
  const ink = Math.min(0.0165 * k0, 9);
  const gooInk = Math.min(0.0058 * k0, 4.2);
  const macroZoom = k0 > 3200;
  const O = openingState(c, tp);

  // ---------------------------------------------------------------- the cast figure (frozen, lifted, stood, melted)
  const pose = castPose(tp);
  const th = (pose.th * Math.PI) / 180;
  const Vd = v3(0, Math.cos(th), Math.sin(th)), nrm = v3(0, -Math.sin(th), Math.cos(th));
  const Ff = a3(pose.F, m3(nrm, FIG_T));
  const sw = (pose.swing * Math.PI) / 180;
  const wpt = (u: number, vv: number) => {
    const uu = Math.cos(sw) * u - Math.sin(sw) * (vv - FIG_H);
    const vy = Math.sin(sw) * u + Math.cos(sw) * (vv - FIG_H) + FIG_H;
    return a3(Ff, a3(v3(uu, 0, 0), m3(Vd, vy)));
  };
  const o0 = wpt(0, 0);
  const Acast = affine(c, o0, s3v(wpt(1, 0), o0), s3v(wpt(0, 1), o0));
  const cb = project(c, a3(Ff, m3(nrm, -FIG_T))), cf = project(c, Ff);
  const sweepCast0 = toLocal(Acast, cb.x - cf.x, cb.y - cf.y);
  const sweepCast = {x: sweepCast0.x * ss(pose.th, 4, 30), y: sweepCast0.y * ss(pose.th, 4, 30)};
  const vc = FIG_H * 0.85 + (FIG_H - FIG_H * 0.85) * ss(pose.th, 0, 40);
  const contact = wpt(0, vc);
  const fz = FIG_H + 0.1 - (FIG_H + 0.3) * ss(tp, TP.freeze0, TP.freeze1);
  const kc = project(c, o0).k;
  // its second melt, on the coil (scene 4)
  const front2 = 0.15 + FIG_H * ss(t, T.melt0, T.front1);
  const slump2 = Math.pow(ss(t, T.slump0, T.slump1), 1.15);
  const deformed2 = PARTS.map((p) => ({name: p.name, tone: p.tone, pts: p.pts.map((q) => meltDeform(q, !!p.arm, slump2, t))}));
  const frontV2 = front2 * (1 - 0.86 * Math.pow(slump2, 1.1));
  const castVisible = tp > TP.freeze0 && slump2 < 0.62;
  const solidA2 = 1 - ss(slump2, 0.2, 0.55);
  const melting = t > T.melt0 - 0.05;

  // ---------------------------------------------------------------- power
  const power1 = t < 6 ? O.power : ss(t, T.coilOn, T.coilOn + 0.2) * (1 - ss(t, T.coilOff, T.coilOff + 0.3));
  const power2 = ss(t, T.heat2, T.heat2 + 0.2) * (1 - ss(t, T.freeze3_0 - 0.15, T.freeze3_0 + 0.15));

  // ---------------------------------------------------------------- the metal outside the cage (scenes 4-7)
  const F: Goo[] = [];
  const shadowsF: React.ReactNode[] = [];
  let pSolid = 0;
  let pDir: [number, number] = [1, 0];
  let collarLat = -90;
  let collarOn = false;
  const M = t < PREV_END + 0.45 ? magnetAt(tp, contact) : t < 5.9 ? lv(magnetAt(tp, contact), magnetV1(t), ss(t, PREV_END + 0.45, 5.9)) : magnetV1(t);
  if (melting && t < T.wrap0 + 0.01) {
    // the figure melting into a puddle on the coil, then the puddle steered, frozen and pulled as a slug
    if (t < T.slump1 + 0.4) {
      const shrink = 1 - ss(t, T.slump1 - 0.1, T.slump1 + 0.38);
      for (const p of deformed2) {
        const pts = p.pts.map((q) => ({x: q.x * shrink, y: q.y * shrink}));
        const sp = pts.map((q) => ap(Acast, q));
        const b = {x0: Math.min(...sp.map((q) => q.x)), x1: Math.max(...sp.map((q) => q.x)), y0: Math.min(...sp.map((q) => q.y)) - 40, y1: Math.max(...sp.map((q) => q.y))};
        F.push({k: 'p', d: pathScreen(Acast, pts), g: 'dome', b});
        F.push({k: 'p', d: pathScreen(Acast, pts, {x: sweepCast0.x * 0.6, y: sweepCast0.y * 0.6}), g: 'dome', b});
      }
    }
    const rp = 0.12 + 0.38 * ss(t, T.melt0 + 0.1, T.slump1 + 0.2);
    const tw = Math.min(t, T.freeze0);
    const P = t < T.pull0 ? (t < T.freeze0 ? puddleAt(t) : puddleAt(T.freeze0)) : slugAt(t);
    let stretch = 0, sang = 0, att = 0, aang = 0;
    if (t < T.freeze0) {
      const a = puddleAt(t - 0.04), b = puddleAt(t + 0.04);
      stretch = Math.min(1, Math.hypot(b.x - a.x, b.y - a.y) / 0.12);
      sang = Math.atan2(b.y - a.y, b.x - a.x);
      const dmx = M.x - P.x, dmy = M.y - P.y;
      const dist = Math.hypot(Math.hypot(dmx, dmy), M.z - ZT);
      att = t > T.steer0 - 0.3 ? Math.exp(-Math.max(0, dist - 0.65) / 0.55) * (1 - ss(t, T.freeze0 - 0.4, T.freeze0)) : 0;
      aang = Math.atan2(dmy, dmx);
      if (stretch < 0.02) sang = aang;
    }
    F.push(...puddle(c, P, rp, tw, stretch, sang, att, aang));
    pSolid = t < T.wrap0 - 0.2 ? ss(t, T.freeze0, T.freeze1) : 1;
    pDir = [0.8, 0.6];
    const pp = project(c, P);
    shadowsF.push(<SoftShadow key="sf" id="slug-sh" c={{x: pp.x + 6, y: pp.y + 6}} rx={rp * pp.k * 1.35} ry={rp * pp.k * 0.7} alpha={0.4} color="#03090C" />);
  }
  const B = ballAt(t);
  if (t > T.wrap0 - 0.25) {
    // in the model: melt (front from the coil's centre), flow round the ball, freeze into a grip, carried out
    const w = ss(t, T.wrap0, T.wrap1);
    const tw = Math.min(t, T.freeze3_0);
    const col = collar(c, B, t < T.wrap0 ? 0 : w, tw);
    collarLat = col.lat;
    collarOn = t >= T.wrap0;
    if (t >= T.wrap0) F.length = 0;
    if (t >= T.wrap0) F.push(...col.items);
    else F.push(...puddle(c, SLUG_TOUCH, 0.5, T.freeze0));
    pSolid = t < T.freeze3_0 ? 1 - ss(t, T.wrap0 - 0.22, T.wrap0 + 0.3) : ss(t, T.freeze3_0, T.freeze3_1);
    pDir = t < T.freeze3_0 ? [-0.85, -0.5] : [0.85, 0.5];
  }
  const sigF = (t > T.wrap0 - 0.25 ? 0.032 : 0.066) * k0;
  const boxF = gooBox(F, 3.2 * sigF + 20);

  // ball-front mask: in front of the ball, show the metal only below the collar's top edge
  const bd = ballDisk(c, B, BALL_R);
  let ballMask: React.ReactNode = null;
  if (collarOn) {
    const fa = facingAngle(c, B);
    const wv = ss(t, T.wrap0, T.wrap1);
    const arc = Array.from({length: 37}, (_, i) => {
      const phi = ((fa - 90 + 5 * i) * Math.PI) / 180;
      const la = ((collarLat + 16 * Math.cos(3 * (phi - PHI0)) * ss(wv, 0.3, 1) + 4) * Math.PI) / 180;
      return project(c, v3(B.x + Math.cos(phi) * Math.cos(la) * BALL_R, B.y + Math.sin(phi) * Math.cos(la) * BALL_R, B.z + Math.sin(la) * BALL_R));
    });
    const a0 = arc[0], a1 = arc[arc.length - 1];
    const sgn = a1.x > a0.x ? 1 : -1;
    const ext = BALL_R * bd.rx * 0 + bd.rx * 1.3;
    const pts = [{x: a0.x - sgn * ext, y: a0.y}, ...arc, {x: a1.x + sgn * ext, y: a1.y}, {x: a1.x + sgn * ext, y: a1.y + 3000}, {x: a0.x - sgn * ext, y: a0.y + 3000}];
    ballMask = (
      <mask id="ballfront" maskUnits="userSpaceOnUse" x={-500} y={-500} width={2100} height={3000}>
        <rect x={-500} y={-500} width={2100} height={3000} fill="#FFF" />
        <ellipse cx={bd.cx} cy={bd.cy} rx={bd.rx} ry={bd.ry} transform={`rotate(${bd.rot.toFixed(2)} ${bd.cx.toFixed(1)} ${bd.cy.toFixed(1)})`} fill="#000" />
        <g clipPath="url(#ballclip)">
          <path d={pts.map((p, i) => `${i ? 'L' : 'M'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ') + 'Z'} fill="#FFF" />
        </g>
        <clipPath id="ballclip">
          <ellipse cx={bd.cx} cy={bd.cy} rx={bd.rx} ry={bd.ry} transform={`rotate(${bd.rot.toFixed(2)} ${bd.cx.toFixed(1)} ${bd.cy.toFixed(1)})`} />
        </clipPath>
      </mask>
    );
  }

  // ---------------------------------------------------------------- the cut window (scene 3)
  const WIN = {u: 0.03, v: 0.97};
  const rw = 0.1 * ss(t, T.open0, T.open1) * (1 - ss(t, T.peak + 0.12, T.close1));
  let cutWin: React.ReactNode = null;
  if (rw > 0.0005) {
    const det = Acast.a * Acast.d - Acast.b * Acast.c;
    const inv = (x: number, y: number) => {
      const dx = x - Acast.e, dy = y - Acast.f;
      return {x: (Acast.d * dx - Acast.c * dy) / det, y: (-Acast.b * dx + Acast.a * dy) / det};
    };
    const depth = 0.006;
    const off: [number, number] = [sweepCast0.x * (depth / FIG_T) * 1e4, sweepCast0.y * (depth / FIG_T) * 1e4];
    const cs = [inv(0, 0), inv(1080, 0), inv(0, 1920), inv(1080, 1920)].map((p) => ({x: (p.x - WIN.u) * 1e4 - off[0], y: (p.y - WIN.v) * 1e4 - off[1]}));
    const view = {x0: Math.min(...cs.map((p) => p.x)), x1: Math.max(...cs.map((p) => p.x)), y0: Math.min(...cs.map((p) => p.y)), y1: Math.max(...cs.map((p) => p.y))};
    cutWin = <CutWindow cx={WIN.u} cy={WIN.v} rw={rw} off={off} view={view} t={t} pxPerUm={kc / 1e4} />;
  }

  const cg = cage(c, ink);
  const box = gooBox(O.items, 60, undefined);
  const sigma = (0.016 + 0.05 * ss(tp, 0.1, 1.2)) * k0;
  const fr = frontRegion(c);
  const mg = project(c, v3(M.x, M.y, surfZ(M.x, M.y)));
  const mh = M.z - surfZ(M.x, M.y);
  const lipNeeded = tp > TP.freeze0 && pose.F.z < ZT - 0.004 && tp > TP.touch && tp < 6;
  const world = !macroZoom;
  const showModel = t > 12.5;

  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920">
      {world && (
        <>
          <Bench c={c} t={t} />
          {showModel && <Stage c={c} ink={ink} t={t} power={power2} />}
          {showModel && <CCoil c={c} ink={ink} t={t} power={power2} />}
          {showModel && <ModelFloor c={c} ink={ink} />}
          <Pad c={c} t={t} power={power1} ink={ink} />
          <MouldBody c={c} ink={ink} />
          <defs>
            <clipPath id="cav-clip">
              {PARTS.map((p) => (
                <path key={p.name} d={pathScreen(O.Acav, p.pts)} />
              ))}
            </clipPath>
            <mask id="liqBm">
              <path d={fr} fill="#FFF" />
            </mask>
          </defs>
          <Inked w={ink * 0.8}>
            {PARTS.map((p) => (
              <InkPath key={p.name} d={pathScreen(O.Acav, p.pts)} fill="#8E3F31" />
            ))}
          </Inked>
          <g clipPath="url(#cav-clip)">
            {PARTS.map((p) => (
              <path key={p.name} d={pathScreen(O.Afloor, p.pts)} fill="#B65A47" />
            ))}
          </g>
          <GooLayer id="cav" items={O.cavItems} sigma={0.035 * k0} box={gooBox(O.cavItems, 50)} ink={gooInk} clip="url(#cav-clip)" solid={0} spec={1} />
          {O.shadows}
          {!O.figGone && (
            <SoftShadow id="fig-sh" c={{x: project(c, v3(0, 0, ZT)).x + 10, y: project(c, v3(0, 0, ZT)).y + 6}} rx={0.62 * O.kf} ry={0.24 * O.kf} alpha={0.55 * (1 - O.ms.slump)} color="#03090C" />
          )}
          {cg.back}
          <GooLayer id="liqA" items={O.items} sigma={sigma} box={box} ink={gooInk} />
          {!O.figGone && 1 - ss(O.ms.slump, 0.2, 0.55) > 0.01 && (
            <MeltingArt id="A" A={O.Afig} parts={O.deformed} sweep={O.sweepFig} ink={ink / O.kf} frontV={O.ms.front * (1 - 0.86 * Math.pow(O.ms.slump, 1.1))} opacity={1 - ss(O.ms.slump, 0.2, 0.55)} warm={O.power} />
          )}
          {cg.front}
          <GooLayer id="liqB" items={O.items} sigma={sigma} box={box} ink={gooInk} mask="url(#liqBm)" />
          {shadowsF}
        </>
      )}
      {/* the metal outside the cage (melting figure, puddle, slug, grip) */}
      {world && <GooPair id="F" items={F} sigma={sigF} box={boxF} ink={gooInk} p={pSolid} dir={pDir} />}
      {/* the recast figure: revealed as it freezes, lifted out, stood outside the cage; later melted again */}
      {castVisible && (
        <g>
          {pose.th > 20 && world && (
            <SoftShadow id="cast-sh" c={{x: project(c, v3(pose.F.x, pose.F.y - 0.12, surfZ(pose.F.x, pose.F.y))).x + 8, y: project(c, v3(pose.F.x, pose.F.y - 0.12, surfZ(pose.F.x, pose.F.y))).y + 5}}
              rx={0.6 * kc} ry={0.22 * kc} alpha={(0.5 * ss(pose.th, 20, 80) * (1 - slump2)) / (1 + 6 * Math.max(0, pose.F.z - ZT))} color="#03090C" />
          )}
          {melting ? (
            <MeltingArt id="C2" A={Acast} parts={deformed2} sweep={sweepCast} ink={ink / kc} frontV={frontV2} opacity={solidA2} warm={power1} />
          ) : (
            <g transform={affStr(Acast)}>
              <defs>
                <linearGradient id="frz-m" gradientUnits="userSpaceOnUse" x1="0" y1={(fz - 0.06).toFixed(3)} x2="0" y2={(fz + 0.06).toFixed(3)}>
                  <stop offset="0" stopColor="#000" />
                  <stop offset="1" stopColor="#FFF" />
                </linearGradient>
                <mask id="frz-mask" maskUnits="userSpaceOnUse" x="-3" y="-1" width="6" height="5">
                  <rect x="-3" y="-1" width="6" height="5" fill="url(#frz-m)" />
                </mask>
              </defs>
              <g mask={tp < TP.freeze1 + 0.02 ? 'url(#frz-mask)' : undefined}>
                <FigureArt id="figC" parts={PARTS} sweep={sweepCast} ink={ink / kc} grain={1} />
                <FigureSheen parts={PARTS} a={1} />
              </g>
              {cutWin}
            </g>
          )}
        </g>
      )}
      {world && lipNeeded && <Lip c={c} />}
      {world && showModel && (
        <>
          {collarOn ? <g>{ballMask}</g> : null}
          <Ball c={c} p={B} r={BALL_R} ink={ink} />
          {collarOn && <GooPair id="F2" items={F} sigma={sigF} box={boxF} ink={gooInk} p={pSolid} dir={pDir} mask="url(#ballfront)" />}
          <Tube c={c} ink={ink} />
          <Stub c={c} ink={ink} />
          <ModelShell c={c} ink={ink} />
        </>
      )}
      {world && (
        <>
          <SoftShadow id="mag-sh" c={{x: mg.x + 10, y: mg.y + 8}} rx={(0.42 + 0.25 * mh) * mg.k} ry={(0.2 + 0.12 * mh) * mg.k} alpha={0.42 / (1 + 1.4 * mh)} color="#03090C" />
          <Magnet c={c} M={M} ink={ink} />
        </>
      )}
    </svg>
  );
};

/** solid figure art over its liquid twin, cut away below the rising melt front */
const MeltingArt: React.FC<{id: string; A: ReturnType<typeof affine>; parts: {name: string; tone?: number; pts: {x: number; y: number}[]}[]; sweep: {x: number; y: number}; ink: number; frontV: number; opacity: number; warm: number}> = ({id, A, parts, sweep, ink, frontV, opacity, warm}) =>
  opacity <= 0.01 ? null : (
    <g transform={affStr(A)} opacity={opacity}>
      <defs>
        <linearGradient id={`${id}-mm`} gradientUnits="userSpaceOnUse" x1="0" y1={(frontV - 0.07).toFixed(3)} x2="0" y2={(frontV + 0.09).toFixed(3)}>
          <stop offset="0" stopColor="#000" />
          <stop offset="1" stopColor="#FFF" />
        </linearGradient>
        <mask id={`${id}-mask`} maskUnits="userSpaceOnUse" x="-3" y="-1" width="6" height="5">
          <rect x="-3" y="-1" width="6" height="5" fill={`url(#${id}-mm)`} />
        </mask>
        <linearGradient id={`${id}-warm`} gradientUnits="userSpaceOnUse" x1="0" y1={(frontV - 0.02).toFixed(3)} x2="0" y2={(frontV + 0.22).toFixed(3)}>
          <stop offset="0" stopColor="#FFB869" stopOpacity={0.55} />
          <stop offset="1" stopColor="#FFB869" stopOpacity={0} />
        </linearGradient>
      </defs>
      <g mask={`url(#${id}-mask)`}>
        <FigureArt id={`fig${id}`} parts={parts} sweep={sweep} ink={ink} grain={1} />
        <g>
          {parts.map((p) => (
            <path key={p.name} d={partPath(p.pts)} fill={`url(#${id}-warm)`} opacity={warm * 0.45} />
          ))}
        </g>
        <FigureSheen parts={parts} a={1} />
      </g>
    </g>
  );

export const Film: React.FC<HookProps> = (props) => (
  <FilmFrame W={W} bg="#1C3634" capY={300} breaks={BREAKS} props={props}>
    {(t) => <Scene t={t} />}
  </FilmFrame>
);
