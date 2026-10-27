// V2 hardware: a 1 mL syringe standing upright on the needle's luer hub (the needle glued into the prosoma), the air
// it pushes (a pale accent: the only colour the air ever has), and the lab stand that carries it (base, rod, boss
// head, swinging arm, barrel clamp).
import React from 'react';
import {GLASS, HUB, needleItems, NeedleRig, STEEL} from '../apparatus';
import {boxItem, capsuleItem, cylinderItem, Item} from '../draw3';
import {add3, Basis, cross3, mul3, norm3, P2, proj, sub3, V3} from '../three';

export const AIR_C = '#7FD6EA';
/** 1 mL syringe dimensions (mm) */
export const S1 = {nozzle: 7, barrel: 58, r: 3.3, travel: 40, rodR: 1.5, thumbR: 4.8};

/** geometry of an upright syringe standing on a hub top; plunger 0..1 (1 = stopper at the bottom of the barrel) */
export const syr1 = (hubTop: V3, plunger: number) => {
  const at = (d: number): V3 => add3(hubTop, [0, 0, d]);
  const b0 = S1.nozzle - 3; // the luer tip sits 3 mm into the hub
  const b1 = b0 + S1.barrel;
  const stop = b0 + 1.2 + (1 - plunger) * S1.travel; // bottom face of the stopper
  return {at, nozzle0: at(-3), barrel0: at(b0), barrel1: at(b1), stop0: at(stop), stop1: at(stop + 3.6), rodTop: at(stop + 3.6 + S1.barrel - 1), thumb: at(stop + 3.6 + S1.barrel + 0.2), clampAt: at(b0 + S1.barrel * 0.86)};
};

/** the syringe, with the air below the stopper (`air` 0..1 brightens it) and an air pulse running down at `pulse`
 *  (0 = leaving the stopper .. 1 = reaching the needle tip; undefined = none) */
export const syringe1Items = (B: Basis, hubTop: V3, plunger: number, o: {air?: number; pulse?: number; needleTip?: V3} = {}): Item[] => {
  const g = syr1(hubTop, plunger);
  const it: Item[] = [];
  // nozzle (luer slip tip)
  it.push(cylinderItem(B, g.nozzle0, g.barrel0, 1.0, '#E9EFF2', {glass: true}));
  // the air column below the stopper: faint blue, brighter while it is pushed
  const air = o.air ?? 0;
  it.push(cylinderItem(B, add3(g.barrel0, [0, 0, 0.6]), g.stop0, S1.r * 0.86, mixAir(air), {opacity: 0.18 + 0.4 * air, zBias: -S1.r - 1}));
  // rubber stopper and plunger rod
  it.push(cylinderItem(B, g.stop0, g.stop1, S1.r * 0.94, '#36444F', {zBias: -S1.r - 1.2, cap: '#4A5966'}));
  it.push(cylinderItem(B, g.stop1, g.rodTop, S1.rodR, '#F1F4F6', {zBias: -0.2}));
  it.push(cylinderItem(B, g.rodTop, g.thumb, S1.thumbR, '#E2E8EC', {cap: '#F4F7F9'}));
  // the clear barrel and its finger flange
  it.push(cylinderItem(B, g.barrel0, g.barrel1, S1.r, GLASS, {glass: true, spec: 1.4}));
  it.push(boxItem(B, add3(g.barrel1, [0, 0, 0.5]), [8.5, 3.2, 0.55], '#E6ECEF', {yaw: 20}));
  // graduations on the side facing the camera
  const toEye = sub3(B.eye, g.barrel0);
  const side = norm3([toEye[0], toEye[1], 0]);
  const lat = norm3(cross3([0, 0, 1], side));
  for (let k = 1; k <= 10; k++) {
    const z = 4 + k * 4.6;
    const c = add3(g.barrel0, [0, 0, z]);
    const p0 = add3(add3(c, mul3(side, S1.r * 0.98)), mul3(lat, -S1.r * 0.25));
    const p1 = add3(p0, mul3(lat, k % 5 === 0 ? -S1.r * 0.7 : -S1.r * 0.4));
    const a = proj(B, p0), b = proj(B, p1);
    it.push({z: a.z - S1.r - 0.2, el: <path key={`gr${k}`} d={`M${P2(a)} L${P2(b)}`} stroke="#5E7684" strokeWidth={Math.max(0.8, 0.09 * a.s).toFixed(2)} opacity={0.75} strokeLinecap="round" />});
  }
  // the air pulse: a bright slug moving down the barrel, through the hub and down the needle
  if (o.pulse !== undefined && o.pulse > 0 && o.pulse < 1.15) {
    const path = pulsePath(hubTop, plunger, o.needleTip ?? add3(hubTop, [0, 0, -18]));
    const at = along(path, o.pulse);
    const at2 = along(path, Math.max(0, o.pulse - 0.1));
    const fade = 1 - clamp01((o.pulse - 1) / 0.15);
    const r = 0.42;
    if (seg2(path, o.pulse) > 0) it.push(capsuleItem(B, at2, at, r * 0.9, r, AIR_C, {opacity: 0.85 * fade, zBias: -6, spec: 1.2, ink: 0.4}));
  }
  return it;
};
/** which leg of the pulse path a fraction falls on (0 = inside the barrel: shown by the air column instead) */
const seg2 = (pts: V3[], u: number) => {
  const seg = pts.slice(1).map((p, i) => Math.hypot(...sub3(p, pts[i])));
  const tot = seg.reduce((a, b) => a + b, 0);
  return u * tot > seg[0] ? 1 : 0;
};
/** the air's way from the stopper face to the needle tip */
export const pulsePath = (hubTop: V3, plunger: number, tip: V3): V3[] => {
  const g = syr1(hubTop, plunger);
  return [g.stop0, g.barrel0, add3(hubTop, [0, 0, -7]), tip];
};
const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const mixAir = (a: number) => (a > 0.5 ? AIR_C : '#BFE4EE');
export const along = (pts: V3[], u: number): V3 => {
  const seg = pts.slice(1).map((p, i) => Math.hypot(...sub3(p, pts[i])));
  const tot = seg.reduce((a, b) => a + b, 0);
  let d = clamp01(u) * tot;
  for (let i = 0; i < seg.length; i++) {
    if (d <= seg[i]) return add3(pts[i], mul3(sub3(pts[i + 1], pts[i]), d / seg[i]));
    d -= seg[i];
  }
  return pts[pts.length - 1];
};

/** the needle and hub only (no support arm: the syringe is the support) */
export const needle1Items = (B: Basis, entry: V3, tipAbove: number, glue: number): Item[] => needleItems(B, {entry, tipAbove, glue, armDir: 0, armLen: 0} as NeedleRig, {noArm: true});
export const hubTopOf = (entry: V3, tipAbove: number): V3 => add3(entry, [0, 0, tipAbove + 11 + 7]);

/** the lab stand: base plate, rod, the boss head at arm height, the arm out to a clamp round the barrel */
export const standItems2 = (B: Basis, rod: V3, clampAt: V3, baseDir: number, rodTop = 190): Item[] => {
  const it: Item[] = [];
  const toC = sub3(clampAt, [rod[0], rod[1], clampAt[2]]);
  const d = norm3(toC);
  const yaw = (Math.atan2(d[1], d[0]) * 180) / Math.PI;
  // base plate (behind the rod, away from the arm)
  const bd: V3 = [Math.cos((baseDir * Math.PI) / 180), Math.sin((baseDir * Math.PI) / 180), 0];
  const base = add3([rod[0], rod[1], 0], mul3(bd, -30));
  it.push(boxItem(B, add3(base, [0, 0, 3]), [48, 34, 3], '#46535C', {top: '#56646D', yaw: baseDir}));
  it.push(cylinderItem(B, [rod[0], rod[1], 6], [rod[0], rod[1], rodTop], 4.2, '#9AA7B0', {spec: 1.2}));
  // boss head and its knob
  const boss: V3 = [rod[0], rod[1], clampAt[2]];
  it.push(boxItem(B, boss, [7, 7, 7], '#3E4A53', {yaw}));
  it.push(cylinderItem(B, add3(boss, mul3(norm3(cross3([0, 0, 1], d)), 7)), add3(boss, mul3(norm3(cross3([0, 0, 1], d)), 13)), 3.4, '#2D373F', {cap: '#46525B'}));
  // the arm and the barrel clamp
  const end = add3(clampAt, mul3(d, -(S1.r + 2.2)));
  it.push(cylinderItem(B, add3(boss, mul3(d, 6)), end, 2.4, '#7D8B95', {spec: 1.1}));
  it.push(cylinderItem(B, add3(clampAt, [0, 0, -3.2]), add3(clampAt, [0, 0, 3.2]), S1.r + 1.5, '#4C5963'));
  return it;
};
export {HUB, STEEL};
