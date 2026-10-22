// V3 face device (from V2): the section is now a LOCAL cutaway notch at the mouth corner (x > xc, ya < y < yb in rest
// coordinates), masked out of the surface with tight strip hulls, so the face stays whole and upright; added a soft contact
// shadow and strain lines where the covering meets the rigid rim.
// V2 face device. Same simple laboratory prototype as V1 (pink cultured covering on a white face-shaped base, block,
// stand, pull motors behind), with:
//  - a covering of real thickness: dermis equivalent (12) over a silicone layer (10), anchored to the base through
//    V-shaped perforations (the 2024 "perforation-type anchors"); the mouth-corner perforations sit in a movable insert;
//  - a stronger corner pull: deeper smile, local compression creases, and a wet highlight that rides the deforming
//    surface (it is defined on the surface, so it stretches and moves with it);
//  - a clean section plane x = xc (rest coordinates) that removes the covering and base beyond it; its exposed face is
//    the tissue itself (TissueSection mapped onto the cut), so the camera can move into the layer. No inset window.
import React from 'react';
import {Pt, hull, path, smooth, lerp, rnd, clamp} from '../lib';
import {TissueSection, TMap, DERM, tc, EPI} from '../v2/Tissue2';
import {proj, View, P3, Extrude, K} from '../art/Face';

export {proj, K};
export type {View};
export const F2 = {a: 250, b: 312, T: 22, SK: 12, formPad: 22, corner: {x: 118, y: 150}};
const A2 = F2.a + F2.formPad, B2 = F2.b + F2.formPad;
export const formZ = (x: number, y: number) => {
  const q = (x / A2) ** 2 + (y / B2) ** 2;
  if (q >= 1) return 0;
  const dome = 84 * Math.pow(1 - q, 0.55);
  const nose = 24 * Math.exp(-((x / 38) ** 2 + ((y - 12) / 70) ** 2));
  const eyes = -11 * (Math.exp(-(((x - 100) / 52) ** 2 + ((y + 96) / 32) ** 2)) + Math.exp(-(((x + 100) / 52) ** 2 + ((y + 96) / 32) ** 2)));
  return dome + nose + eyes;
};
// pull field: the corner inserts drag the covering up and outward; the cheek above bunches (bulge) and compresses
export const disp2 = (x: number, y: number, s: number): P3 => {
  let dx = 0, dy = 0, dz = 0;
  for (const sg of [-1, 1]) {
    const cx = sg * F2.corner.x, cy = F2.corner.y;
    const w = Math.exp(-((x - cx) ** 2 + (y - cy) ** 2) / (84 * 84));
    dx += s * sg * 22 * w;
    dy += s * -58 * w;
    const wb = Math.exp(-((x - (cx + sg * 30)) ** 2 + (y - (cy - 66)) ** 2) / (58 * 58));
    dz += s * 19 * wb;
    // a small inward pinch right at the corner (the anchor pulls the surface down into the base)
    dz -= s * 9 * Math.exp(-((x - cx) ** 2 + (y - cy) ** 2) / (16 * 16));
  }
  return {x: dx, y: dy, z: dz};
};
// covering point: the silicone's underside is bonded to the base, so displacement grows toward the surface
export const covPt = (x: number, y: number, s: number, lift = F2.T): P3 => {
  const d = disp2(x, y, s);
  const b = 0.18 + 0.82 * clamp(lift / F2.T);
  return {x: x + d.x * b, y: y + d.y * b, z: formZ(x, y) + lift + d.z * b};
};
export const surf = (x: number, y: number, s: number, v: View, lift = F2.T) => proj(covPt(x, y, s, lift), v);
export const mouth2 = (u: number, s: number) => ({x: u * F2.corner.x, y: F2.corner.y + 7 * (1 - u * u) + 13 * s * (1 - u * u) ** 2});

// section geometry: tissue (u, w) on the cut face; u runs down the face (y), w into the covering
export const CUT = {kT: F2.SK / DERM, yH: 60, uH: 640};
export const cutMap = (xc: number, s: number, v: View): TMap => (u, w) => {
  const y = CUT.yH + (u - CUT.uH) * CUT.kT;
  return proj(covPt(xc, y, s, F2.T - w * CUT.kT), v);
};
export const yToU = (y: number) => CUT.uH + (y - CUT.yH) / CUT.kT;
// perforations through the base (rest y), and the mouth-corner insert
export const ANCH_Y = [-214, -132, -52, 62, 232];
export const INSERT = {y0: 134, y1: 170, travel: 15};

const rrect = (x0: number, y0: number, x1: number, y1: number, r: number, n = 6) => {
  const pts: {x: number; y: number}[] = [];
  const cs = [[x1 - r, y0 + r, -90], [x1 - r, y1 - r, 0], [x0 + r, y1 - r, 90], [x0 + r, y0 + r, 180]];
  for (const [cx, cy, a0] of cs) for (let i = 0; i <= n; i++) { const a = ((a0 + (90 * i) / n) * Math.PI) / 180; pts.push({x: cx + r * Math.cos(a), y: cy + r * Math.sin(a)}); }
  return pts;
};
const CylX: React.FC<{x0: number; x1: number; y: number; z: number; r: number; v: View; id: string}> = ({x0, x1, y, z, r, v, id}) => {
  const a = proj({x: x0, y: y - r, z}, v), b = proj({x: x1, y: y - r, z}, v), c = proj({x: x1, y: y + r, z}, v), d = proj({x: x0, y: y + r, z}, v);
  return (
    <g>
      <defs><linearGradient id={id} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={K.metalHi} /><stop offset="0.35" stopColor="#FFFFFF" stopOpacity={0.9} /><stop offset="0.6" stopColor={K.rod} /><stop offset="1" stopColor={K.metalHi} /></linearGradient></defs>
      <path d={path([a, b, c, d])} fill={`url(#${id})`} />
    </g>
  );
};
const PORES = Array.from({length: 230}, (_, i) => {
  const a = rnd(i * 2 + 1) * Math.PI * 2, r = Math.sqrt(rnd(i * 2 + 2)) * 0.94;
  return {x: Math.cos(a) * r * F2.a, y: Math.sin(a) * r * F2.b, k: rnd(i * 5 + 3)};
});
// clip a rest-coordinate polyline at the section plane
const keep = (pts: {x: number; y: number}[], xc: number) => pts.filter((p) => p.x <= xc - 0.5);

export type Notch = {xc: number; ya: number; yb: number};
export const notchAt = (k: number): Notch | null => (k <= 0.001 ? null : {xc: lerp(F2.a + 6, 148, k), ya: 105 - 75 * k, yb: 105 + 75 * k});
export const FaceDevice3: React.FC<{
  v: View; s: number; t: number; id: string;
  notch?: Notch | null; // local cutaway (rest coordinates)
  tone?: number; stretch?: number; showStand?: boolean; anchorGlow?: number; visY?: [number, number]; detail?: number;
}> = ({v, s, t, id, notch = null, tone = 0, stretch = 0, showStand = true, anchorGlow = 0, visY, detail = 1}) => {
  const cut = !!notch && notch.xc < F2.a - 0.5;
  const xc = 999; // the surface itself is never removed: the notch is masked out below
  const N = notch ?? {xc: 999, ya: 0, yb: 0};
  const block = rrect(-338, -410, 338, 420, 64);
  const housingR = rrect(230, -262, 470, -150, 16), housingL = rrect(-470, -262, -230, -150, 16);
  const slide = 16 * s;
  // remaining covering surface
  const NS = 26, top: Pt[] = [], rimT: Pt[] = [], rim0: Pt[] = [];
  for (let i = 0; i <= NS; i++) for (let j = 0; j <= NS; j++) {
    const x = (-1 + (2 * i) / NS) * F2.a, y = (-1 + (2 * j) / NS) * F2.b;
    if ((x / F2.a) ** 2 + (y / F2.b) ** 2 <= 1 && x <= xc) top.push(surf(x, y, s, v));
  }
  const rimN = 90;
  for (let i = 0; i < rimN; i++) {
    const a = (i / rimN) * Math.PI * 2, x = Math.cos(a) * F2.a, y = Math.sin(a) * F2.b;
    if (x > xc) continue;
    rimT.push(surf(x, y, s, v)); rim0.push(surf(x, y, s, v, 0));
  }
  const NC = 40;
  const ys = Array.from({length: NC + 1}, (_, i) => lerp(N.ya, N.yb, i / NC));
  const cTop = cut ? ys.map((y) => surf(N.xc, y, s, v)) : [];
  const cDerm = cut ? ys.map((y) => surf(N.xc, y, s, v, F2.T - F2.SK)) : [];
  const cSil = cut ? ys.map((y) => surf(N.xc, y, s, v, 0)) : [];
  const fTop = cut ? ys.map((y) => proj({x: N.xc, y, z: formZ(N.xc, y)}, v)) : [];
  const fBot = cut ? ys.map((y) => proj({x: N.xc, y, z: 0}, v)) : [];
  const skinTopHull = hull([...top, ...rimT]);
  const skinSideHull = hull([...rimT, ...rim0]);
  // mask for the removed block: union of tight hulls over thin y-strips of the notch
  const notchMask: Pt[][] = [];
  if (cut) {
    const strips = 8;
    for (let k = 0; k < strips; k++) {
      const y0 = lerp(N.ya, N.yb, k / strips), y1 = lerp(N.ya, N.yb, (k + 1) / strips);
      const pts: Pt[] = [];
      for (const y of [y0, (y0 + y1) / 2, y1]) for (let i = 0; i <= 10; i++) {
        const x = lerp(N.xc, A2 + 2, i / 10);
        pts.push(proj({x, y, z: 0}, v));
        if ((x / A2) ** 2 + (y / B2) ** 2 < 1) pts.push(proj({x, y, z: formZ(x, y)}, v));
        if ((x / F2.a) ** 2 + (y / F2.b) ** 2 < 1) { pts.push(surf(x, y, s, v)); pts.push(surf(x, y, s, v, 0)); }
      }
      notchMask.push(hull(pts));
    }
  }
  const formRim: Pt[] = [], formTop: Pt[] = [];
  for (let i = 0; i < rimN; i++) { const a = (i / rimN) * Math.PI * 2, x = Math.cos(a) * A2, y = Math.sin(a) * B2; if (x <= xc) formRim.push(proj({x, y, z: 0}, v)); }
  for (let i = 0; i <= 18; i++) for (let j = 0; j <= 18; j++) { const x = (-1 + i / 9) * A2, y = (-1 + j / 9) * B2; if ((x / A2) ** 2 + (y / B2) ** 2 <= 1 && x <= xc) formTop.push(proj({x, y, z: formZ(x, y)}, v)); }
  const formHull = hull([...formTop, ...formRim]);
  const L = surf(-96, -176, s, v);
  const S = (x: number, y: number, lift?: number) => surf(x, y, s, v, lift);
  const line = (pts: {x: number; y: number}[], lift?: number) => keep(pts, xc).map((p) => S(p.x, p.y, lift));
  const mouth = line(Array.from({length: 33}, (_, i) => mouth2(-1 + i / 16, s)));
  const mouthLip = line(Array.from({length: 33}, (_, i) => { const u = -1 + i / 16, r = mouth2(u, s); return {x: r.x * 0.97, y: r.y + 8 + 3 * s * (1 - u * u)}; }));
  const eye = (sg: number) => Array.from({length: 18}, (_, i) => { const a = (i / 18) * Math.PI * 2; return S(sg * 100 + Math.cos(a) * 46, -96 + Math.sin(a) * 24); });
  const corners = [-1, 1].filter((sg) => sg * F2.corner.x <= xc).map((sg) => S(sg * F2.corner.x, F2.corner.y));
  // fold from each corner up along the bulge, and compression creases stacked above it
  const folds = [-1, 1].map((sg) => line(Array.from({length: 8}, (_, q) => { const k = q / 7; return {x: sg * (F2.corner.x + 6 + 34 * k), y: F2.corner.y - 4 - 70 * k + 26 * k * k}; })));
  const creases = [-1, 1].flatMap((sg) => [0, 1, 2, 3].map((k) => line(Array.from({length: 6}, (_, q) => {
    const a = -0.5 + q / 5;
    const cx = sg * (F2.corner.x + 22 + 9 * k), cy = F2.corner.y - 22 - 13 * k;
    return {x: cx + sg * a * 22 * 0.7, y: cy + a * 22 * 0.7 * -1 + 3 * a * a};
  }))));
  const ridgeHi = [-1, 1].map((sg) => line(Array.from({length: 8}, (_, q) => { const k = q / 7; return {x: sg * (F2.corner.x + 12 + 34 * k), y: F2.corner.y - 14 - 70 * k + 26 * k * k}; })));
  // wet highlight defined ON the surface (rest coordinates), so it stretches and travels with the pull
  // wet streak along the bulge ridge, defined on the surface so it slides and stretches with the pull
  const ridgeC = (sg: number, k: number) => ({x: sg * (F2.corner.x + 24 + 34 * k), y: F2.corner.y - 52 - 58 * k + 22 * k * k});
  const wet = [-1, 1].map((sg) => line([...Array.from({length: 11}, (_, q) => { const k = -0.15 + (q / 10) * 1.2, c = ridgeC(sg, k), w = 11 * Math.sin(Math.PI * (q / 10)); return {x: c.x - sg * w * 0.6, y: c.y - w}; }),
    ...Array.from({length: 11}, (_, q) => { const k = 1.05 - (q / 10) * 1.2, c = ridgeC(sg, k), w = 7 * Math.sin(Math.PI * (1 - q / 10)); return {x: c.x + sg * w * 0.6, y: c.y + w}; })]));
  const wetCore = [-1, 1].map((sg) => line(Array.from({length: 9}, (_, q) => ridgeC(sg, 0.05 + (q / 8) * 0.75))));
  const pz = 0.6 + 0.4 * s;
  // where the covering meets the rigid rim: the edge is held, so the band between corner and rim is stretched (thin
  // sheen) and the covering bunches slightly against the rim lip (soft compression shade); both are surface-defined
  const rimStretch = [-1, 1].map((sg) => line(Array.from({length: 9}, (_, q) => { const a = q / 8; return {x: sg * lerp(F2.corner.x + 34, F2.a * 0.95, a), y: lerp(F2.corner.y - 40, 95, a) - 18 * Math.sin(Math.PI * a)}; })));
  const rimPress = [-1, 1].map((sg) => line(Array.from({length: 9}, (_, q) => { const a = 0.12 + (q / 8) * 0.3; return {x: sg * F2.a * Math.cos(a) * 0.955, y: F2.b * Math.sin(a) * 0.955}; })));
  const rimShadow = Array.from({length: 61}, (_, i) => { const a = (i / 60) * Math.PI * 2; return surf(Math.cos(a) * F2.a * 1.004, Math.sin(a) * F2.b * 1.004, s, v, 0); });
  return (
    <g>
      <defs>
        <radialGradient id={`${id}-skin`} gradientUnits="userSpaceOnUse" cx={L.x} cy={L.y} r={470}>
          <stop offset="0" stopColor={K.skinLight} /><stop offset="0.38" stopColor={K.skin} /><stop offset="0.78" stopColor={K.skinDark} /><stop offset="1" stopColor={K.skinDeep} />
        </radialGradient>
        <radialGradient id={`${id}-form`} gradientUnits="userSpaceOnUse" cx={L.x} cy={L.y} r={480}>
          <stop offset="0" stopColor="#FFFFFF" /><stop offset="0.7" stopColor={K.form} /><stop offset="1" stopColor={K.formShade} />
        </radialGradient>
        <radialGradient id={`${id}-hollow`} cx="0.5" cy="0.45" r="0.6"><stop offset="0" stopColor={K.skinDeep} stopOpacity={0.2} /><stop offset="1" stopColor={K.skinDeep} stopOpacity={0} /></radialGradient>
        <linearGradient id={`${id}-blk`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={K.blockTop} /><stop offset="1" stopColor={K.block} /></linearGradient>
        <pattern id={`${id}-hatch`} width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <rect width="7" height="7" fill="#E7ECF0" /><line x1="0" y1="0" x2="0" y2="7" stroke="#CBD4DB" strokeWidth="1.6" />
        </pattern>
        <clipPath id={`${id}-skinclip`}><path d={path(skinTopHull)} /></clipPath>
        <filter id={`${id}-soft`} x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation={3} /></filter>
      </defs>
      {showStand && (
        <g>
          <Extrude pts={rrect(-80, 380, 80, 620, 14)} z0={-60} z1={-120} v={v} front={K.metal} side={K.metalDark} sideDark={K.metalDark} />
          <Extrude pts={rrect(-230, 600, 230, 650, 18)} z0={40} z1={-220} v={v} front={K.metal} side={K.metalDark} sideDark={'#1A2026'} top={K.metalHi} />
        </g>
      )}
      {[-1, 1].map((sg) => {
        const c0 = proj({x: sg * 300, y: -150, z: -230}, v), c1 = proj({x: sg * 300, y: 200, z: -236}, v), c2 = proj({x: sg * 60, y: 520, z: -110}, v);
        return <path key={sg} d={`M${c0.x} ${c0.y}C${c1.x} ${c1.y} ${c1.x} ${c1.y} ${c2.x} ${c2.y}`} fill="none" stroke={K.metalDark} strokeWidth={9} strokeLinecap="round" />;
      })}
      {[housingL, housingR].map((hp, k) => {
        const sg = k ? 1 : -1;
        return (
          <g key={k}>
            <Extrude pts={hp} z0={-165} z1={-262} v={v} front={K.metal} side={K.metalDark} sideDark={'#1A2026'} top={K.metalHi} />
            {[0, 1, 2, 3].map((q) => { const x = sg * (430 - q * 11); const a2 = proj({x, y: -252, z: -165}, v), b2 = proj({x, y: -160, z: -165}, v); return <line key={q} x1={a2.x} y1={a2.y} x2={b2.x} y2={b2.y} stroke={K.metalHi} strokeWidth={3} opacity={0.6} />; })}
            <CylX x0={sg > 0 ? 470 : -500} x1={sg > 0 ? 500 : -470} y={-206} z={-212} r={10} v={v} id={`${id}-sh${k}`} />
            {(() => { const x = sg * (478 + slide * 0.9); const p0 = proj({x: x - 5, y: -219, z: -212}, v), p1 = proj({x: x + 5, y: -193, z: -212}, v); return <rect x={Math.min(p0.x, p1.x)} y={p0.y} width={Math.abs(p1.x - p0.x) + 4} height={p1.y - p0.y} rx={2} fill={K.accent} />; })()}
          </g>
        );
      })}
      <Extrude pts={block} z0={0} z1={-150} v={v} front={`url(#${id}-blk)`} side={K.blockSide} sideDark={'#97A3AE'} top={K.blockTop} stroke={K.blockInk} />
      {[[-290, -362], [290, -362], [-290, 372], [290, 372]].map(([x, y], k) => {
        const p = proj({x, y, z: 0}, v);
        return (<g key={k}><circle cx={p.x} cy={p.y} r={11} fill={K.formShade} /><circle cx={p.x} cy={p.y} r={7} fill={K.blockInk} /><line x1={p.x - 5} y1={p.y} x2={p.x + 5} y2={p.y} stroke={K.form} strokeWidth={2} /></g>);
      })}
      <mask id={`${id}-nm`} maskUnits="userSpaceOnUse" x={-5000} y={-5000} width={10000} height={10000}>
        <rect x={-5000} y={-5000} width={10000} height={10000} fill="#FFFFFF" />
        {notchMask.map((h, k) => <path key={k} d={path(h)} fill="#000000" stroke="#000000" strokeWidth={0.6} />)}
      </mask>
      <g mask={cut ? `url(#${id}-nm)` : undefined}>
      <path d={path(formHull)} fill={`url(#${id}-form)`} stroke={K.formShade} strokeWidth={1.5} />
      <path d={smooth(rimShadow, true)} fill="none" stroke="#5A3A40" strokeWidth={9} opacity={0.22} filter={`url(#${id}-soft)`} />
      <path d={path(skinSideHull)} fill={K.skinEdge} />
      <path d={path(skinTopHull)} fill={`url(#${id}-skin)`} />
      <g clipPath={`url(#${id}-skinclip)`}>
        {[-1, 1].map((sg) => <path key={sg} d={smooth(eye(sg), true)} fill={`url(#${id}-hollow)`} />)}
        {(() => { const nsh = S(22, 34); return <ellipse cx={nsh.x} cy={nsh.y} rx={26} ry={52} fill={`url(#${id}-hollow)`} opacity={0.9} />; })()}
        {PORES.filter((p) => p.x <= xc).map((p, k) => { const q = S(p.x, p.y); return <circle key={k} cx={q.x} cy={q.y} r={p.k > 0.5 ? 1.7 : 1.2} fill={p.k > 0.72 ? K.skinDeep : '#FFFFFF'} opacity={p.k > 0.72 ? 0.22 : 0.28} />; })}
        {/* cheek bulge light, fold, compression creases, ridge sheen */}
        {folds.map((f, k) => f.length > 1 && (
          <g key={k}>
            <path d={smooth(f)} fill="none" stroke={K.skinDeep} strokeWidth={12} strokeLinecap="round" opacity={0.16 * s} />
            <path d={smooth(f)} fill="none" stroke={K.skinDeep} strokeWidth={3.4} strokeLinecap="round" opacity={0.5 * s} />
          </g>
        ))}
        {rimStretch.map((c, k) => c.length > 1 && <path key={`r${k}`} d={smooth(c)} fill="none" stroke="#FFFFFF" strokeWidth={14} strokeLinecap="round" opacity={0.12 * clamp(s * 1.3 - 0.2)} filter={`url(#${id}-soft)`} />)}
        {rimPress.map((c, k) => c.length > 1 && <path key={`p${k}`} d={smooth(c)} fill="none" stroke={K.skinDeep} strokeWidth={10} strokeLinecap="round" opacity={0.22 * clamp(s * 1.3 - 0.2)} filter={`url(#${id}-soft)`} />)}
        {creases.map((c, k) => c.length > 1 && <path key={k} d={smooth(c)} fill="none" stroke={K.skinDeep} strokeWidth={2.4} strokeLinecap="round" opacity={0.55 * clamp(s * 1.6 - 0.45) * (0.6 + 0.4 * stretch)} />)}
        {wet.map((w, k) => w.length > 2 && <path key={k} d={smooth(w, true)} fill="#FFFFFF" opacity={0.12 + 0.16 * s} filter={`url(#${id}-soft)`} />)}
        {wetCore.map((w, k) => w.length > 1 && <path key={k} d={smooth(w)} fill="none" stroke="#FFFFFF" strokeWidth={3 + 1.5 * s} strokeLinecap="round" opacity={0.2 + 0.25 * s} filter={`url(#${id}-soft)`} />)}
        {mouth.length > 1 && <path d={smooth(mouth)} fill="none" stroke={K.skinDeep} strokeWidth={18} strokeLinecap="round" opacity={0.2 * pz} />}
        {mouthLip.length > 1 && <path d={smooth(mouthLip)} fill="none" stroke="#FFFFFF" strokeWidth={4} strokeLinecap="round" opacity={0.24} />}
        {mouth.length > 1 && <path d={smooth(mouth)} fill="none" stroke={K.skinDeep} strokeWidth={5} strokeLinecap="round" opacity={0.92} />}
        {corners.map((c, k) => (
          <g key={k}>
            {anchorGlow > 0 && <circle cx={c.x} cy={c.y} r={24} fill="none" stroke="#7FF2EA" strokeWidth={3} opacity={anchorGlow} />}
            <ellipse cx={c.x} cy={c.y} rx={9 + 4 * s} ry={7 + 4 * s} fill={K.skinDeep} opacity={0.35} />
            <circle cx={c.x} cy={c.y} r={5 + 3 * s} fill={K.skinDeep} opacity={0.85} />
            <path d={`M${c.x - 6 - 3 * s} ${c.y + 5 + 3 * s}Q${c.x} ${c.y + 9 + 4 * s} ${c.x + 6 + 3 * s} ${c.y + 5 + 3 * s}`} fill="none" stroke="#FFFFFF" strokeWidth={1.6} opacity={0.4} />
          </g>
        ))}
        {(() => { const h = S(-84, -170), h2 = S(-150, -30); return (
          <g>
            <ellipse cx={h.x} cy={h.y} rx={70} ry={30} fill="#FFFFFF" opacity={0.2} transform={`rotate(-24 ${h.x} ${h.y})`} />
            <ellipse cx={h.x - 20} cy={h.y - 6} rx={24} ry={8} fill="#FFFFFF" opacity={0.33} transform={`rotate(-24 ${h.x} ${h.y})`} />
            <ellipse cx={h2.x} cy={h2.y} rx={10} ry={36} fill="#FFFFFF" opacity={0.15} transform={`rotate(12 ${h2.x} ${h2.y})`} />
          </g>
        ); })()}
      </g>
      </g>
      {cut && <CutFace xc={N.xc} ya={N.ya} yb={N.yb} s={s} v={v} t={t} tone={tone} id={id} ys={ys} cTop={cTop} cDerm={cDerm} cSil={cSil} fTop={fTop} fBot={fBot} visY={visY} detail={detail} />}
    </g>
  );
};

// the exposed section: base (hatched) with V perforations filled by the gel, silicone, then the living covering
const CutFace: React.FC<{xc: number; ya: number; yb: number; s: number; v: View; t: number; tone: number; id: string; ys: number[]; cTop: Pt[]; cDerm: Pt[]; cSil: Pt[]; fTop: Pt[]; fBot: Pt[]; visY?: [number, number]; detail: number}> = ({xc, ya, yb, s, v, t, tone, id, ys, cTop, cDerm, cSil, fTop, fBot, visY, detail}) => {
  const C = tc(tone);
  const band = (a: Pt[], b: Pt[]) => smooth(a) + 'L' + [...b].reverse().map((p) => `${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join('L') + 'Z';
  const ins = -INSERT.travel * s; // insert slides up with the pull
  const P = (y: number, z: number) => proj({x: xc, y, z}, v);
  const hole = (y0: number, dy = 0) => {
    // keyhole perforation: a V narrowing into the rigid base, then a rounded undercut the gel locks into
    const zt = formZ(xc, y0), H = Math.min(zt - 2, 15);
    const pts = [[-6.5, zt + 0.5], [-2.5, zt - H * 0.55], [-4.6, zt - H * 0.7], [-4.8, zt - H * 0.86], [-2.7, zt - H], [0, zt - H - 0.8], [2.7, zt - H], [4.8, zt - H * 0.86], [4.6, zt - H * 0.7], [2.5, zt - H * 0.55], [6.5, zt + 0.5]] as [number, number][];
    return pts.map(([a, z]) => P(y0 + a + dy, z));
  };
  const column = (y0: number, dy = 0) => {
    const a = surf(xc, y0 - 3.5, s, v, F2.T - F2.SK), b = surf(xc, y0 + 3.5, s, v, F2.T - F2.SK);
    const c = P(y0 + 3.5 + dy, formZ(xc, y0)), d = P(y0 - 3.5 + dy, formZ(xc, y0));
    return [a, b, c, d];
  };
  const m = cutMap(xc, s, v);
  const [vy0, vy1] = visY ?? [ya, yb];
  const u0 = yToU(Math.max(ya, vy0 - 20)), u1 = yToU(Math.min(yb, vy1 + 20));
  const iy = (INSERT.y0 + INSERT.y1) / 2;
  const insPts = [P(INSERT.y0 + ins, formZ(xc, INSERT.y0) - 1), P(INSERT.y1 + ins, formZ(xc, INSERT.y1) - 1), P(INSERT.y1 + ins, 1), P(INSERT.y0 + ins, 1)];
  const slot = [P(INSERT.y0 - INSERT.travel - 2, formZ(xc, INSERT.y0) - 0.5), P(INSERT.y1 + 2, formZ(xc, INSERT.y1) - 0.5), P(INSERT.y1 + 2, 0.5), P(INSERT.y0 - INSERT.travel - 2, 0.5)];
  return (
    <g>
      {/* lower wall of the notch (seen slightly from above), then the main section face */}
      {(() => {
        const xs = Array.from({length: 12}, (_, i) => lerp(xc, A2, i / 11)).filter((x) => (x / A2) ** 2 + (yb / B2) ** 2 < 1);
        const topE = xs.map((x) => ((x / F2.a) ** 2 + (yb / F2.b) ** 2 < 1 ? surf(x, yb, s, v) : proj({x, y: yb, z: formZ(x, yb)}, v)));
        const botE = xs.map((x) => proj({x, y: yb, z: 0}, v));
        return xs.length > 1 ? <path d={path([...topE, ...botE.reverse()])} fill="#D9E1E7" stroke={K.blockInk} strokeWidth={1} /> : null;
      })()}
      {/* base, cut */}
      <path d={band(fTop, fBot)} fill={`url(#${id}-hatch)`} stroke={K.blockInk} strokeWidth={1.2} />
      <path d={path(slot)} fill="#A9B5BF" />
      <path d={path(insPts)} fill="#7F8C98" stroke={K.metalDark} strokeWidth={1.2} />
      {/* gel columns through the silicone, into the perforations */}
      {[...ANCH_Y.filter((y) => y > ya + 9 && y < yb - 9).map((y) => ({y, dy: 0})), ...(iy > ya + 20 && iy < yb - 20 ? [{y: iy, dy: ins}] : [])].map(({y, dy}, k) => (
        <g key={k}>
          <path d={path(column(y, dy))} fill="#EFC3BE" />
          <path d={smooth(hole(y, dy), true, 0.14)} fill="#2E3841" />
          <path d={smooth(hole(y, dy).map((p, i, a) => ({x: lerp(p.x, (a[0].x + a[a.length - 1].x + a[5].x) / 3, 0.14), y: lerp(p.y, (a[0].y + a[a.length - 1].y + a[5].y) / 3, 0.14)})), true, 0.14)} fill="#EFC3BE" />
          {[-1.6, 0, 1.6].map((o, q) => { const zt = formZ(xc, y); return <path key={q} d={smooth([surf(xc, y + o, s, v, F2.T - F2.SK - 1), P(y + o * 0.6 + dy, zt), P(y + o * 0.3 + dy, zt - 8), P(y + o * 0.8 + dy, zt - 13)])} fill="none" stroke="#FFF0EA" strokeWidth={0.6} opacity={0.75} />; })}
        </g>
      ))}
      {/* silicone layer */}
      <path d={band(cDerm, cSil)} fill="#E6E8EC" opacity={0.85} />
      {[...ANCH_Y.filter((y) => y > ya + 9 && y < yb - 9).map((y) => ({y, dy: 0})), ...(iy > ya + 20 && iy < yb - 20 ? [{y: iy, dy: ins}] : [])].map(({y, dy}, k) => <path key={k} d={path(column(y, dy))} fill="#EFC3BE" opacity={0.8} />)}
      {/* the living covering: same cells and fibres as every other tissue view */}
      <TissueSection m={m} u0={u0} u1={u1} t={t} tone={tone} id={`${id}-cut`} detail={detail} />
      <path d={smooth(cTop)} fill="none" stroke="#FFFFFF" strokeWidth={1.4} opacity={0.5} />
      <path d={path([cTop[0], ...fTop.length ? [] : [], fBot[0], fBot[fBot.length - 1], cTop[cTop.length - 1]], false)} fill="none" stroke="#7FF2EA" strokeWidth={1.2} opacity={0.0} />
    </g>
  );
};
