// The JIZAI arm: one articulated robot limb that plugs into a terminal on the base unit. Drawn after the real system
// (white segment shells, dark rotary joints, a black articulated hand, a detachable connector) in the Weird Crew vector
// finish. The same rig, scaled by 0.5, is the half-scale controller model: equal joint angles give the same shape.
//
// Kinematics (forward, parent -> child, in one 3D frame chain):
//   base frame B at the terminal (z = terminal axis, out of the socket)
//   plug length L0 along B.z -> shoulder hub
//   shoulder: rz(yaw) about the terminal axis, then rx(pitch)   -> upper link (L1) along the result's z
//   elbow:    rx(elbow)                                          -> forearm (L2)
//   wrist:    rx(wp) then rz(wr)                                 -> hand (palm along z, palm faces -y)
// Joint limits are clamped to the prototype's plausible range (pitch +-125, elbow 0..135 either side, wrist +-80).
import React from 'react';
import {Capsule, SoftShadow} from '../dc/shade';
import {Inked, Deco, InkLine} from '../dc/ink';
import {lit, mix, shade} from '../dc/color';
import {fmt, P} from '../dc/math';
import {a3, d3, frameZ, Item, k3, l3, M3, mm, mv, n3, Proj, rx, rz, s3, V3, v3, x3} from './m3';

export const RC = {
  shell: '#F3F5F7',
  shellShade: '#C9D2DA',
  joint: '#2C333C',
  jointRim: '#56616D',
  jointCap: '#8E9BA8',
  hand: '#24282F',
  handLit: '#4A5260',
  pin: '#D9B45A',
  led: '#3BE3B0',
};

export type ArmPose = {
  yaw: number;
  pitch: number;
  elbow: number;
  wp: number;
  wr: number;
  /** 0 open .. 1 closed fist */
  grip: number;
  /** finger fan 0..1 */
  spread?: number;
};
export const mixArm = (a: ArmPose, b: ArmPose, t: number): ArmPose => ({
  yaw: a.yaw + (b.yaw - a.yaw) * t,
  pitch: a.pitch + (b.pitch - a.pitch) * t,
  elbow: a.elbow + (b.elbow - a.elbow) * t,
  wp: a.wp + (b.wp - a.wp) * t,
  wr: a.wr + (b.wr - a.wr) * t,
  grip: a.grip + (b.grip - a.grip) * t,
  spread: (a.spread ?? 0.3) + ((b.spread ?? 0.3) - (a.spread ?? 0.3)) * t,
});

export const DIMS = {L0: 7, L1: 28, L2: 26, palm: 9.2, rS: 4.5, rE: 4.0, rW: 3.2};
const clampA = (x: number, a: number, b: number) => Math.min(b, Math.max(a, x));
export const limitPose = (p: ArmPose): ArmPose => ({
  ...p,
  pitch: clampA(p.pitch, -125, 125),
  elbow: clampA(p.elbow, -135, 135),
  wp: clampA(p.wp, -80, 80),
  grip: clampA(p.grip, 0, 1),
});

export type ArmGeo = {
  base: V3;
  B: M3;
  plug: V3;
  S: V3;
  E: V3;
  W: V3;
  Rs: M3;
  Re: M3;
  Rw: M3;
  sc: number;
  /** fingertip and joint chains */
  fingers: {pts: V3[]; r: number[]}[];
  thumb: {pts: V3[]; r: number[]};
  palm: V3[];
  side: 1 | -1;
};

/** Forward kinematics. `side` mirrors the hand (thumb on the arm's inner side). `sc` = 1 full size, 0.5 the model. */
export const armFK = (base: V3, B: M3, pose0: ArmPose, side: 1 | -1, sc = 1, plugOut = 0): ArmGeo => {
  const pose = limitPose(pose0);
  const L0 = DIMS.L0 * sc, L1 = DIMS.L1 * sc, L2 = DIMS.L2 * sc;
  const plug = a3(base, k3(B.z, plugOut * sc));
  const S = a3(plug, k3(B.z, L0));
  const Rs = mm(B, mm(rz(pose.yaw), rx(pose.pitch)));
  const E = a3(S, k3(Rs.z, L1));
  const Re = mm(Rs, rx(pose.elbow));
  const W = a3(E, k3(Re.z, L2));
  const Rw = mm(Re, mm(rx(pose.wp), rz(pose.wr)));
  const loc = (x: number, y: number, z: number) => a3(W, mv(Rw, v3(x * side * sc, y * sc, z * sc)));
  const palm = [loc(-3.1, 0, 0.6), loc(3.1, 0, 0.6), loc(3.9, 0, DIMS.palm), loc(-3.7, 0, DIMS.palm)];
  // fingers: knuckles across the palm's end; each joint curls toward the palm side (-y) about the palm's x axis
  const g = pose.grip;
  const spr = pose.spread ?? 0.3;
  const F = [
    {x: 2.85, len: [3.6, 2.7, 2.2], fan: 7},
    {x: 0.95, len: [3.9, 2.9, 2.3], fan: 2},
    {x: -0.95, len: [3.7, 2.8, 2.2], fan: -3},
    {x: -2.85, len: [3.0, 2.3, 1.9], fan: -8},
  ];
  const curlDeg = [62, 72, 52];
  const fingers = F.map((f, i) => {
    let R = mm(Rw, rx(0));
    // fan about the palm normal
    R = mm(R, rotY(f.fan * spr * side));
    let p = loc(f.x * 0.98, 0, DIMS.palm + 0.2);
    const pts = [p];
    const gi = Math.min(1, g * (1 + i * 0.06));
    for (let k = 0; k < 3; k++) {
      R = mm(R, rx(curlDeg[k] * gi + 4));
      p = a3(p, k3(R.z, f.len[k] * sc));
      pts.push(p);
    }
    return {pts, r: [1.25 * sc, 1.12 * sc, 1.0 * sc, 0.86 * sc]};
  });
  // thumb: from the palm's inner edge, angled across; it opposes as the grip closes
  let RT = mm(Rw, mm(rotY(side * (58 - 26 * g)), rx(18 + 30 * g)));
  let tp = loc(3.6, -0.9, 2.6);
  const tpts = [tp];
  [3.2, 2.5, 2.0].forEach((ln, k) => {
    RT = mm(RT, rx(k === 0 ? 0 : 26 * g + 6));
    tp = a3(tp, k3(RT.z, ln * sc));
    tpts.push(tp);
  });
  return {base, B, plug, S, E, W, Rs, Re, Rw, sc, fingers, thumb: {pts: tpts, r: [1.45 * sc, 1.28 * sc, 1.1 * sc, 0.92 * sc]}, palm, side};
};
const rotY = (d: number): M3 => {
  const c = Math.cos((d * Math.PI) / 180), s = Math.sin((d * Math.PI) / 180);
  return {x: v3(c, 0, -s), y: v3(0, 1, 0), z: v3(s, 0, c)};
};

/** Inverse kinematics for the wrist position: yaw/pitch/elbow that put W on `target` (world). `eSide` picks the
 *  elbow-bend direction. Keeps the given wrist, grip and spread. Out-of-reach targets give a straight arm. */
export const armIK = (base: V3, B: M3, target: V3, keep: ArmPose, eSide: 1 | -1 = 1, sc = 1): ArmPose => {
  const L0 = DIMS.L0 * sc, L1 = DIMS.L1 * sc, L2 = DIMS.L2 * sc;
  const S = a3(base, k3(B.z, L0));
  const dw = s3(target, S);
  const d = v3(d3(dw, B.x), d3(dw, B.y), d3(dw, B.z));
  const r = Math.hypot(d.x, d.y);
  const yaw = r < 1e-3 ? keep.yaw : (Math.atan2(d.x, -d.y) * 180) / Math.PI;
  const D = Math.min(L1 + L2 - 0.01, Math.max(Math.abs(L1 - L2) + 0.01, l3(d)));
  const ce = (D * D - L1 * L1 - L2 * L2) / (2 * L1 * L2);
  const e = Math.acos(Math.max(-1, Math.min(1, ce)));
  const alpha = Math.atan2(r, d.z);
  const beta = Math.atan2(L2 * Math.sin(e), L1 + L2 * Math.cos(e));
  const pitch = ((alpha - eSide * beta) * 180) / Math.PI;
  return {...keep, yaw, pitch, elbow: (eSide * e * 180) / Math.PI};
};

/** Wrist pitch/roll that best point the hand along `dir` (wrist -> knuckles) with the palm facing `palm` (world
 *  unit vectors), given the arm's other joints. Coarse grid then local refinement; joint limits respected. */
export const solveWrist = (base: V3, B: M3, pose: ArmPose, side: 1 | -1, dir: V3, palm: V3, sc = 1): ArmPose => {
  const g0 = armFK(base, B, {...pose, wp: 0, wr: 0}, side, sc);
  const Re = g0.Re;
  const score = (wp: number, wr: number) => {
    const Rw = mm(Re, mm(rx(wp), rz(wr)));
    const pal = k3(Rw.y, -1);
    return d3(Rw.z, dir) * 1.0 + d3(pal, palm) * 0.8;
  };
  let best = {wp: 0, wr: 0, s: -1e9};
  for (let wp = -80; wp <= 80; wp += 10)
    for (let wr = -180; wr < 180; wr += 15) {
      const s0 = score(wp, wr);
      if (s0 > best.s) best = {wp, wr, s: s0};
    }
  let step = 5;
  while (step > 0.2) {
    let moved = false;
    for (const [a, b] of [[step, 0], [-step, 0], [0, step], [0, -step]]) {
      const wp = Math.max(-80, Math.min(80, best.wp + a));
      const wr = best.wr + b;
      const s0 = score(wp, wr);
      if (s0 > best.s + 1e-6) {
        best = {wp, wr, s: s0};
        moved = true;
      }
    }
    if (!moved) step /= 2;
  }
  return {...pose, wp: best.wp, wr: best.wr};
};

/** Reach: IK for the wrist, then orient the hand. */
export const reachArm = (base: V3, B: M3, wrist: V3, dir: V3, palm: V3, keep: ArmPose, side: 1 | -1, eSide: 1 | -1, sc = 1, wrRef?: number): ArmPose => {
  const p = armIK(base, B, wrist, keep, eSide, sc);
  const r = solveWrist(base, B, p, side, n3(dir), n3(palm), sc);
  // keep wrist roll continuous relative to a reference (avoid 360 flips)
  if (wrRef !== undefined) {
    while (r.wr - wrRef > 180) r.wr -= 360;
    while (r.wr - wrRef < -180) r.wr += 360;
  }
  return r;
};

// ------------------------------------------------------------------ drawing helpers
const ellipsePath = (c: {x: number; y: number}, rxx: number, ryy: number, ang: number) => {
  const a = (ang * Math.PI) / 180;
  const ux = Math.cos(a), uy = Math.sin(a);
  const p = (t: number) => ({x: c.x + ux * rxx * Math.cos(t) - uy * ryy * Math.sin(t), y: c.y + uy * rxx * Math.cos(t) + ux * ryy * Math.sin(t)});
  const pts = Array.from({length: 24}, (_, i) => p((i / 24) * Math.PI * 2));
  return `M${P(pts[0])} ${pts.slice(1).map((q) => `L${P(q)}`).join(' ')} Z`;
};

/** A short cylinder (rotary joint, connector collar or socket) seen in perspective: side band plus the visible cap. */
export const cylinderEls = (Pj: Proj, id: string, c: V3, axis: V3, r: number, h: number, col: {side: string; cap: string; rim?: string; core?: string; coreR?: number}, inkW: number, notch?: {a: V3; color: string}, extra?: React.ReactNode) => {
  const ax = n3(axis);
  const c1 = Pj.p(a3(c, k3(ax, -h / 2)));
  const c2 = Pj.p(a3(c, k3(ax, h / 2)));
  const cc = Pj.p(c);
  const k = Pj.k(cc.z);
  const view = n3(s3(c, Pj.eye));
  const cosv = Math.abs(d3(ax, view));
  let ang = (Math.atan2(c2.y - c1.y, c2.x - c1.x) * 180) / Math.PI + 90;
  if (Math.hypot(c2.x - c1.x, c2.y - c1.y) < 0.01) ang = 0;
  const R = r * k;
  const ry = Math.max(R * 0.04, R * cosv);
  const front = d3(ax, view) < 0 ? c2 : c1; // the cap facing the camera
  const back = front === c2 ? c1 : c2;
  const a = (ang * Math.PI) / 180;
  const M = {x: Math.cos(a) * R, y: Math.sin(a) * R};
  const band = `M${fmt(back.x + M.x)},${fmt(back.y + M.y)} L${fmt(front.x + M.x)},${fmt(front.y + M.y)} L${fmt(front.x - M.x)},${fmt(front.y - M.y)} L${fmt(back.x - M.x)},${fmt(back.y - M.y)} Z`;
  return (
    <g>
      <Inked w={inkW}>
        <path d={ellipsePath(back, R, ry, ang)} fill={col.side} />
        <path d={band} fill={col.side} />
        <path d={ellipsePath(front, R, ry, ang)} fill={col.cap} />
      </Inked>
      <Deco>
        <defs>
          <linearGradient id={`${id}-sg`} gradientUnits="userSpaceOnUse" x1={fmt(front.x + M.x)} y1={fmt(front.y + M.y)} x2={fmt(front.x - M.x)} y2={fmt(front.y - M.y)}>
            <stop offset="0" stopColor="#000" stopOpacity={0.28} />
            <stop offset="0.5" stopColor="#000" stopOpacity={0} />
            <stop offset="0.8" stopColor="#FFF" stopOpacity={0.18} />
            <stop offset="1" stopColor="#000" stopOpacity={0.1} />
          </linearGradient>
        </defs>
        <path d={band} fill={`url(#${id}-sg)`} />
        {col.rim && <path d={ellipsePath(front, R * 0.8, ry * 0.8, ang)} fill="none" stroke={col.rim} strokeWidth={Math.max(0.6, R * 0.12)} />}
        {col.core && <path d={ellipsePath(front, R * (col.coreR ?? 0.45), ry * (col.coreR ?? 0.45), ang)} fill={col.core} />}
        <path d={ellipsePath({x: front.x - M.x * 0.25 - Math.sin(a) * ry * 0.35, y: front.y - M.y * 0.25 + Math.cos(a) * ry * -0.35}, R * 0.28, ry * 0.18, ang)} fill="#FFF" opacity={0.22} />
        {notch && (() => {
          const nOut = Pj.p(a3(a3(c, k3(ax, (d3(ax, view) < 0 ? 1 : -1) * h * 0.5)), k3(n3(notch.a), r * 0.98)));
          const nIn = Pj.p(a3(a3(c, k3(ax, (d3(ax, view) < 0 ? 1 : -1) * h * 0.5)), k3(n3(notch.a), r * 0.62)));
          return <line x1={fmt(nIn.x)} y1={fmt(nIn.y)} x2={fmt(nOut.x)} y2={fmt(nOut.y)} stroke={notch.color} strokeWidth={Math.max(0.8, R * 0.16)} strokeLinecap="round" />;
        })()}
        {extra}
      </Deco>
    </g>
  );
};

/** A white segment shell between two joints: a tapered body with a parting seam and dark end bands (pieces, not a
 *  tube). */
const shellEls = (Pj: Proj, id: string, a: V3, b: V3, ra: number, rb: number, inkW: number, shellColor = RC.shell) => {
  const A = Pj.p(a), B = Pj.p(b);
  const ka = Pj.k(A.z), kb = Pj.k(B.z);
  const Ra = ra * ka, Rb = rb * kb;
  const mid = Pj.p(a3(k3(a, 0.5), k3(b, 0.5)));
  const L = Math.hypot(B.x - A.x, B.y - A.y) || 1;
  const ux = (B.x - A.x) / L, uy = (B.y - A.y) / L;
  const bulge = {x: mid.x, y: mid.y};
  const Rm = Math.max(Ra, Rb) * 1.08;
  // seam: along the centre, slightly to the shadow side
  const s0 = {x: A.x + ux * Ra * 1.3 - uy * Ra * -0.18, y: A.y + uy * Ra * 1.3 + ux * Ra * -0.18};
  const s1 = {x: B.x - ux * Rb * 1.3 - uy * Rb * -0.18, y: B.y - uy * Rb * 1.3 + ux * Rb * -0.18};
  return (
    <g>
      <Inked w={inkW}>
        <Capsule id={`${id}-c`} a={A} b={B} ra={Ra} rb={Rb} color={shellColor} spec={0.55} k={1.1} />
        {/* the shell swells a little mid-segment (moulded cover) */}
        <Capsule id={`${id}-m`} a={{x: bulge.x - ux * L * 0.22, y: bulge.y - uy * L * 0.22}} b={{x: bulge.x + ux * L * 0.18, y: bulge.y + uy * L * 0.18}} ra={Rm} rb={Rm * 0.96} color={shellColor} spec={0.5} k={1.1} />
      </Inked>
      <Deco>
        {L > Ra * 3 && <InkLine d={`M${P(s0)} L${P(s1)}`} w={Math.max(0.6, inkW * 0.38)} opacity={0.28} />}
        {L > Ra * 3 && <circle cx={fmt(bulge.x - uy * Rm * 0.45)} cy={fmt(bulge.y + ux * Rm * 0.45)} r={fmt(Math.max(0.6, Rm * 0.08))} fill={RC.jointRim} opacity={0.6} />}
      </Deco>
    </g>
  );
};

export type ArmDrawOpts = {
  id: string;
  /** contour width in cm (scaled by depth) */
  ink?: number;
  /** plug collar twist (deg): 0 locked, 60 released */
  collar?: number;
  /** status LED 0..1 */
  led?: number;
  /** extra items to sort with the hand (e.g. a held object): drawn between the far fingers and the near ones */
  held?: {z: number; el: React.ReactNode};
  shellColor?: string;
  /** a coloured identification band on the upper link (the borrowed arm) */
  band?: string;
  /** hide the plug (when the socket draws it) */
  noPlug?: boolean;
};

/** Depth-sorted items for one arm. */
export const armItems = (Pj: Proj, g: ArmGeo, o: ArmDrawOpts): Item[] => {
  const items: Item[] = [];
  const sc = g.sc;
  const iw = (z: number) => (o.ink ?? 0.55) * sc * Pj.k(z) * (1 / sc) * sc;
  const zOf = (q: V3) => Pj.p(q).z;
  const id = o.id;
  // plug + collar (the detachable connector)
  if (!o.noPlug) {
    const pc = a3(g.plug, k3(g.B.z, 2.6 * sc));
    const notchA = mv(g.B, v3(Math.cos(((o.collar ?? 0) * Math.PI) / 180), Math.sin(((o.collar ?? 0) * Math.PI) / 180), 0));
    items.push({
      z: zOf(pc) + 0.5,
      key: `${id}-plug`,
      el: cylinderEls(Pj, `${id}-plug`, pc, g.B.z, 3.5 * sc, 4.6 * sc, {side: RC.shell, cap: RC.shell, rim: RC.shellShade}, iw(zOf(pc)) * 0.8, {a: notchA, color: RC.joint}),
    });
  }
  // shoulder hub: axis = pitch axis
  const hubs: [V3, V3, number, string][] = [
    [g.S, g.Rs.x, DIMS.rS * 1.12 * sc, 'S'],
    [g.E, g.Re.x, DIMS.rE * 1.1 * sc, 'E'],
    [g.W, g.Rw.x, DIMS.rW * 1.08 * sc, 'W'],
  ];
  // the yaw drum between the plug and the shoulder hub
  const yawC = a3(g.S, k3(g.B.z, -3.2 * sc));
  items.push({z: zOf(yawC) + 0.3, key: `${id}-yaw`, el: cylinderEls(Pj, `${id}-yaw`, yawC, g.B.z, 3.0 * sc, 3.6 * sc, {side: RC.joint, cap: RC.jointRim}, iw(zOf(yawC)) * 0.8)});
  hubs.forEach(([c, ax, r, k]) => {
    items.push({
      z: zOf(c) - 0.4,
      key: `${id}-hub${k}`,
      el: cylinderEls(Pj, `${id}-h${k}`, c, ax, r, r * 1.75, {side: RC.joint, cap: RC.jointRim, rim: RC.jointCap, core: RC.joint, coreR: 0.32}, iw(zOf(c)) * 0.75),
    });
  });
  // links
  const u0 = a3(g.S, k3(g.Rs.z, DIMS.rS * 0.9 * sc));
  const u1 = a3(g.E, k3(g.Rs.z, -DIMS.rE * 0.9 * sc));
  const f0 = a3(g.E, k3(g.Re.z, DIMS.rE * 0.9 * sc));
  const f1 = a3(g.W, k3(g.Re.z, -DIMS.rW * 0.9 * sc));
  const um = a3(k3(u0, 0.5), k3(u1, 0.5));
  const fm = a3(k3(f0, 0.5), k3(f1, 0.5));
  items.push({z: zOf(um), key: `${id}-up`, el: <g>{shellEls(Pj, `${id}-up`, u0, u1, 4.2 * sc, 3.6 * sc, iw(zOf(um)), o.shellColor)}{o.band && bandEl(Pj, `${id}-bd`, a3(k3(u0, 0.62), k3(u1, 0.38)), g.Rs.z, 4.45 * sc, o.band)}</g>});
  items.push({z: zOf(fm), key: `${id}-fo`, el: shellEls(Pj, `${id}-fo`, f0, f1, 3.6 * sc, 3.0 * sc, iw(zOf(fm)), o.shellColor)});
  // LED on the forearm root
  if ((o.led ?? 0) > 0) {
    const lp = Pj.p(a3(f0, k3(g.Re.y, 2.9 * sc)));
    items.push({z: zOf(f0) - 3 * sc, key: `${id}-led`, el: <g><circle cx={fmt(lp.x)} cy={fmt(lp.y)} r={fmt(Pj.k(lp.z) * 0.9 * sc)} fill={RC.led} opacity={o.led} /><circle cx={fmt(lp.x)} cy={fmt(lp.y)} r={fmt(Pj.k(lp.z) * 2.2 * sc)} fill={RC.led} opacity={(o.led ?? 0) * 0.25} /></g>});
  }
  // hand
  items.push(...handItems(Pj, g, id, iw, o.held));
  return items;
};

const bandEl = (Pj: Proj, id: string, c: V3, axis: V3, r: number, color: string) => cylinderEls(Pj, id, c, axis, r, 2.2, {side: color, cap: color}, Pj.k(Pj.p(c).z) * 0.35);

const handItems = (Pj: Proj, g: ArmGeo, id: string, iw: (z: number) => number, held?: {z: number; el: React.ReactNode}): Item[] => {
  const items: Item[] = [];
  const pp = g.palm.map((q) => Pj.p(q));
  const pc = a3(k3(a3(g.palm[0], g.palm[2]), 0.5), v3(0, 0, 0));
  const zc = Pj.p(pc).z;
  const palmNormal = g.Rw.y; // back of the hand faces +y
  const view = n3(s3(pc, Pj.eye));
  const backVisible = d3(palmNormal, view) < 0;
  const palmD = (() => {
    // rounded quad
    const c = {x: (pp[0].x + pp[1].x + pp[2].x + pp[3].x) / 4, y: (pp[0].y + pp[1].y + pp[2].y + pp[3].y) / 4};
    const sm = pp.map((q) => ({x: c.x + (q.x - c.x) * 1.0, y: c.y + (q.y - c.y) * 1.0}));
    const mids = sm.map((q, i) => ({x: (q.x + sm[(i + 1) % 4].x) / 2, y: (q.y + sm[(i + 1) % 4].y) / 2}));
    return `M${P(mids[3])} Q${P(sm[0])} ${P(mids[0])} Q${P(sm[1])} ${P(mids[1])} Q${P(sm[2])} ${P(mids[2])} Q${P(sm[3])} ${P(mids[3])} Z`;
  })();
  const k = Pj.k(zc);
  const palmThick = 2.0 * g.sc * k;
  const iwp = iw(zc) * 0.75;
  const palmEl = (
    <g>
      <Inked w={iwp}>
        <path d={palmD} fill={RC.hand} stroke={RC.hand} strokeWidth={palmThick * 2} strokeLinejoin="round" />
      </Inked>
      <Deco>
        {(() => {
          const c = {x: (pp[0].x + pp[1].x + pp[2].x + pp[3].x) / 4, y: (pp[0].y + pp[1].y + pp[2].y + pp[3].y) / 4};
          return (
            <g>
              <ellipse cx={fmt(c.x - 1.2 * k * g.sc)} cy={fmt(c.y - 1.2 * k * g.sc)} rx={fmt(2.6 * k * g.sc)} ry={fmt(1.3 * k * g.sc)} fill={RC.handLit} opacity={backVisible ? 0.7 : 0.35} transform={`rotate(-30 ${fmt(c.x)} ${fmt(c.y)})`} />
              {backVisible && <InkLine d={`M${P(Pj.p(a3(g.W, mv(g.Rw, v3(-2 * g.side * g.sc, 1, 3.5 * g.sc)))))} L${P(Pj.p(a3(g.W, mv(g.Rw, v3(2 * g.side * g.sc, 1, 3.5 * g.sc)))))}`} w={iwp * 0.6} opacity={0.4} color="#0E1116" />}
            </g>
          );
        })()}
      </Deco>
    </g>
  );
  items.push({z: zc, key: `${id}-palm`, el: palmEl});
  const digit = (pts: V3[], r: number[], key: string) => {
    const zs = pts.map((q) => Pj.p(q).z);
    const zm = zs.reduce((a, b) => a + b, 0) / zs.length;
    const ps = pts.map((q) => Pj.p(q));
    const ks = ps.map((q) => Pj.k(q.z));
    items.push({
      z: zm,
      key: `${id}-${key}`,
      el: (
        <g>
          <Inked w={iw(zm) * 0.62}>
            {ps.slice(0, -1).map((q, i) => (
              <Capsule key={i} id={`${id}-${key}-${i}`} a={q} b={ps[i + 1]} ra={r[i] * ks[i]} rb={r[i + 1] * ks[i + 1]} color={RC.hand} spec={0.25} k={1.3} />
            ))}
          </Inked>
          <Deco>
            {ps.slice(1, -1).map((q, i) => (
              <circle key={i} cx={fmt(q.x)} cy={fmt(q.y)} r={fmt(r[i + 1] * ks[i + 1] * 0.55)} fill={RC.jointCap} opacity={0.75} />
            ))}
          </Deco>
        </g>
      ),
    });
  };
  g.fingers.forEach((f, i) => digit(f.pts, f.r, `f${i}`));
  digit(g.thumb.pts, g.thumb.r, 'th');
  if (held) items.push({z: held.z, key: `${id}-held`, el: held.el});
  return items;
};

/** The base unit's terminal (socket): white collar, dark keyed face, three contact pins and a status LED. */
export const socketItem = (Pj: Proj, id: string, c: V3, axis: V3, B: M3, ink: number, led: number, occupied: boolean): Item => {
  const z = Pj.p(c).z;
  const k = Pj.k(z);
  const ax = n3(axis);
  const view = n3(s3(c, Pj.eye));
  const facing = d3(ax, view) < 0;
  const face = a3(c, k3(ax, 1.6));
  const pins = [0, 120, 240].map((a) => Pj.p(a3(face, mv(B, v3(Math.cos((a * Math.PI) / 180) * 1.3, Math.sin((a * Math.PI) / 180) * 1.3, 0)))));
  const key = Pj.p(a3(face, mv(B, v3(0, 2.1, 0))));
  const ledP = Pj.p(a3(c, mv(B, v3(3.6, 0, 0.2))));
  return {
    z: z + 1.2,
    key: `${id}`,
    el: (
      <g>
        {cylinderEls(Pj, id, c, ax, 4.1, 3.2, {side: RC.shell, cap: occupied ? RC.shell : RC.joint, rim: RC.shellShade, core: occupied ? undefined : '#14181D', coreR: 0.62}, ink * k)}
        {!occupied && facing && (
          <g>
            {pins.map((q, i) => (
              <circle key={i} cx={fmt(q.x)} cy={fmt(q.y)} r={fmt(0.45 * k)} fill={RC.pin} />
            ))}
            <circle cx={fmt(key.x)} cy={fmt(key.y)} r={fmt(0.5 * k)} fill={RC.jointCap} />
          </g>
        )}
        <circle cx={fmt(ledP.x)} cy={fmt(ledP.y)} r={fmt(0.55 * k)} fill={led > 0.05 ? RC.led : '#3A4652'} opacity={0.6 + 0.4 * led} />
        {led > 0.05 && <circle cx={fmt(ledP.x)} cy={fmt(ledP.y)} r={fmt(1.6 * k)} fill={RC.led} opacity={0.3 * led} />}
      </g>
    ),
  };
};

/** Soft contact shadow item (on the floor or a table top). */
export const shadowItem = (Pj: Proj, key: string, c: V3, rxCm: number, rzCm: number, alpha: number): Item => {
  const p = Pj.p(c);
  const k = Pj.k(p.z);
  const q = Pj.p(a3(c, v3(0, 0, rzCm)));
  const ry = Math.max(1, Math.abs(q.y - p.y));
  return {z: p.z + 200, key, el: <SoftShadow id={key} c={{x: p.x, y: p.y}} rx={rxCm * k} ry={ry} alpha={alpha} color="#0B1620" />};
};

export {lit, mix, shade, x3, frameZ};
