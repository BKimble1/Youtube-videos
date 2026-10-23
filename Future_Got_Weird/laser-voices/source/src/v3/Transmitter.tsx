// V3 laser head, drawn in true perspective from world coordinates (metres) through the one projection: a compact
// housing on a mount on the lab bench, its exit window facing the listener. `open` slides the top cover back and off
// to show the inside from above: the laser module fires sideways into the scanning mirror, a small plate standing on
// the vertical shaft of its motor (the pivot), which folds the beam out through the exit. The mirror's swing is shown
// slowed and enlarged; the output direction turns with it (twice the mirror angle).
import React from 'react';
import {C, ROOM as R, LIGHT} from './theme3';
import {pp, proj, EXIT, EAR, CART, CAMPOS, EXIT_Y, v3, V3} from './world3';
import {P, Pt, f3, clamp, lerp} from './lib3';

// housing frame: a = horizontal axis toward the listener, s = side (+x-ish), y up
const AZ = Math.atan2(EAR.x - EXIT.x, EAR.z - EXIT.z);
export const AX = {x: Math.sin(AZ), z: Math.cos(AZ)}, SX = {x: Math.cos(AZ), z: -Math.sin(AZ)};
// local (alpha along a from the exit, sigma along s, y) -> world
export const loc = (al: number, si: number, y: number): V3 => v3(EXIT.x + AX.x * al + SX.x * si, y, EXIT.z + AX.z * al + SX.z * si);
const L2 = (al: number, si: number, y: number) => pp(loc(al, si, y));
export const HOUSING = {al0: -0.36, al1: 0, si: 0.12, y0: EXIT_Y - 0.075, y1: EXIT_Y + 0.08};
export const MIRROR = {al: -0.1, si: 0, y: EXIT_Y};
export const SWEEP0 = 16.06, SWEEP_T = 1.613; // the mirror turns round on the four existing tick sounds
export const mirrorDev = (t: number, on: number) => 2.5 * on * Math.cos((2 * Math.PI * (t - SWEEP0)) / SWEEP_T); // deg
// the output direction for a given mirror deviation: the path rotated about the vertical through the exit
export const outAt = (u: number, devDeg: number): V3 => {
  const r = (2 * devDeg * Math.PI) / 180, dx = EAR.x - EXIT.x, dz = EAR.z - EXIT.z;
  const rx = dx * Math.cos(r) + dz * Math.sin(r), rz = -dx * Math.sin(r) + dz * Math.cos(r);
  return v3(EXIT.x + rx * u, EXIT.y + (EAR.y - EXIT.y) * u, EXIT.z + rz * u);
};

const poly = (pts: Pt[]) => 'M' + pts.map((p) => `${f3(p.x)} ${f3(p.y)}`).join('L') + 'Z';
const faceVis = (c: V3, n: {x: number; y: number; z: number}) => (CAMPOS.x - c.x) * n.x + (CAMPOS.y - c.y) * n.y + (CAMPOS.z - c.z) * n.z > 0;
// a box in the housing frame; draws its visible faces (shaded by orientation)
export const Box: React.FC<{al0: number; al1: number; si0: number; si1: number; y0: number; y1: number; top: string; side: string; end: string; sw?: number}> = ({al0, al1, si0, si1, y0, y1, top, side, end, sw = 2.6}) => {
  const c = (a: number, s: number, y: number) => L2(a, s, y);
  const mid = loc((al0 + al1) / 2, (si0 + si1) / 2, (y0 + y1) / 2);
  const faces: {pts: Pt[]; fill: string; n: {x: number; y: number; z: number}; ctr: V3}[] = [
    {pts: [c(al0, si0, y1), c(al1, si0, y1), c(al1, si1, y1), c(al0, si1, y1)], fill: top, n: {x: 0, y: 1, z: 0}, ctr: loc((al0 + al1) / 2, (si0 + si1) / 2, y1)},
    {pts: [c(al0, si0, y0), c(al0, si1, y0), c(al0, si1, y1), c(al0, si0, y1)], fill: end, n: {x: -AX.x, y: 0, z: -AX.z}, ctr: loc(al0, (si0 + si1) / 2, (y0 + y1) / 2)},
    {pts: [c(al1, si0, y0), c(al1, si1, y0), c(al1, si1, y1), c(al1, si0, y1)], fill: end, n: {x: AX.x, y: 0, z: AX.z}, ctr: loc(al1, (si0 + si1) / 2, (y0 + y1) / 2)},
    {pts: [c(al0, si1, y0), c(al1, si1, y0), c(al1, si1, y1), c(al0, si1, y1)], fill: side, n: {x: SX.x, y: 0, z: SX.z}, ctr: loc((al0 + al1) / 2, si1, (y0 + y1) / 2)},
    {pts: [c(al0, si0, y0), c(al1, si0, y0), c(al1, si0, y1), c(al0, si0, y1)], fill: side, n: {x: -SX.x, y: 0, z: -SX.z}, ctr: loc((al0 + al1) / 2, si0, (y0 + y1) / 2)},
  ];
  void mid;
  return <g>{faces.filter((f) => faceVis(f.ctr, f.n)).map((f, i) => <path key={i} d={poly(f.pts)} fill={f.fill} stroke={C.ink} strokeWidth={sw} strokeLinejoin="round" />)}</g>;
};
// a vertical cylinder (motor) seen from above: side band and top ellipse
const VCyl: React.FC<{al: number; si: number; r: number; y0: number; y1: number; fill: string; topFill: string}> = ({al, si, r, y0, y1, fill, topFill}) => {
  const ring = (y: number) => Array.from({length: 24}, (_, i) => { const a = (i / 24) * 2 * Math.PI; return L2(al + r * Math.cos(a), si + r * Math.sin(a), y); });
  const b = ring(y0), tp = ring(y1);
  const ext = (r: Pt[]) => { let a = 0, b = 0; r.forEach((p, k) => { if (p.x < r[a].x) a = k; if (p.x > r[b].x) b = k; }); return [r[a], r[b]]; };
  const [tl, tr] = ext(tp), [bl, br] = ext(b);
  return <g><path d={poly(b)} fill={fill} stroke={C.ink} strokeWidth={2} /><path d={poly([tl, tr, br, bl])} fill={fill} /><path d={`M${f3(tl.x)} ${f3(tl.y)}L${f3(bl.x)} ${f3(bl.y)}M${f3(tr.x)} ${f3(tr.y)}L${f3(br.x)} ${f3(br.y)}`} stroke={C.ink} strokeWidth={2} /><path d={poly(tp)} fill={topFill} stroke={C.ink} strokeWidth={2} /></g>;
};

export const LaserHead: React.FC<{t: number; open: number; sweep: number; id: string; beam: number}> = ({t, open, sweep, id, beam}) => {
  const dev = mirrorDev(t, sweep);
  const H = HOUSING;
  const cover = clamp(open);
  const s = proj(EXIT).s;
  // inside (seen through the open top): floor, module, motor + shaft, the mirror plate, the beam
  const inner = (
    <g>
      <path d={poly([L2(H.al0 + 0.015, -H.si + 0.015, H.y0 + 0.01), L2(H.al1 - 0.015, -H.si + 0.015, H.y0 + 0.01), L2(H.al1 - 0.015, H.si - 0.015, H.y0 + 0.01), L2(H.al0 + 0.015, H.si - 0.015, H.y0 + 0.01)])} fill="#3B5560" />
      {/* the far inner walls (lit) */}
      <path d={poly([L2(H.al1 - 0.015, -H.si + 0.015, H.y0 + 0.01), L2(H.al1 - 0.015, H.si - 0.015, H.y0 + 0.01), L2(H.al1 - 0.015, H.si - 0.015, H.y1), L2(H.al1 - 0.015, -H.si + 0.015, H.y1)])} fill="#476772" />
      <path d={poly([L2(H.al0 + 0.015, -H.si + 0.015, H.y0 + 0.01), L2(H.al1 - 0.015, -H.si + 0.015, H.y0 + 0.01), L2(H.al1 - 0.015, -H.si + 0.015, H.y1), L2(H.al0 + 0.015, -H.si + 0.015, H.y1)])} fill="#3F5D68" />
      {(() => { const q = (si: number, y: number) => L2(H.al1 - 0.016, si, y); return <path d={poly([q(-0.026, EXIT.y - 0.026), q(0.026, EXIT.y - 0.026), q(0.026, EXIT.y + 0.026), q(-0.026, EXIT.y + 0.026)])} fill="#4A1C22" stroke={LIGHT.irGlow} strokeWidth={2} />; })()}
      {/* driver board at the back */}
      <Box al0={H.al0 + 0.03} al1={H.al0 + 0.14} si0={-0.09} si1={0.09} y0={H.y0 + 0.01} y1={H.y0 + 0.03} top="#2F6F5A" side="#24584A" end="#24584A" sw={1.6} />
      {(() => { const a = L2(H.al0 + 0.06, -0.06, H.y0 + 0.031), b = L2(H.al0 + 0.11, 0.05, H.y0 + 0.031); return <path d={`M${f3(a.x)} ${f3(a.y)}L${f3(b.x)} ${f3(a.y)}`} stroke="#8FD9D2" strokeWidth={s * 0.004} opacity={0.5} />; })()}
      {/* the laser module (fires toward -sigma, into the mirror) */}
      <Box al0={MIRROR.al - 0.025} al1={MIRROR.al + 0.025} si0={-0.11} si1={-0.035} y0={MIRROR.y - 0.025} y1={MIRROR.y + 0.025} top="#4F6670" side="#3E525B" end="#5E7883" sw={1.8} />
      {[-0.095, -0.08, -0.065].map((si) => { const a = L2(MIRROR.al - 0.025, si, MIRROR.y + 0.025), b = L2(MIRROR.al + 0.025, si, MIRROR.y + 0.025); return <line key={si} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#2B3A41" strokeWidth={s * 0.004} />; })}
      <Box al0={MIRROR.al - 0.012} al1={MIRROR.al + 0.012} si0={-0.036} si1={-0.026} y0={MIRROR.y - 0.012} y1={MIRROR.y + 0.012} top="#C9771C" side="#8A4A18" end="#C9771C" sw={1.4} />
      {/* the motor under the mirror and its shaft (the pivot) */}
      <VCyl al={MIRROR.al} si={MIRROR.si} r={0.022} y0={H.y0 + 0.01} y1={MIRROR.y - 0.03} fill={R.metalDeep} topFill={R.metal} />
      {(() => { const a = L2(MIRROR.al, MIRROR.si, MIRROR.y - 0.03), b = L2(MIRROR.al, MIRROR.si, MIRROR.y + 0.03); return <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={C.ink} strokeWidth={s * 0.008 + 2} strokeLinecap="round" />; })()}
      {(() => { const k = L2(MIRROR.al, MIRROR.si, MIRROR.y + 0.036); return <circle cx={k.x} cy={k.y} r={s * 0.007} fill={C.saffron} stroke={C.ink} strokeWidth={1.6} />; })()}
      {/* the mirror: a plate on the shaft at 45 deg in plan (+dev), its reflective face toward the module and the exit */}
      {(() => {
        const ang = ((45 + 3 * dev) * Math.PI) / 180, hl = 0.036; // drawn swing exaggerated (x3) and slowed
        const da = Math.cos(ang) * hl, ds = Math.sin(ang) * hl;
        const p0 = (y: number) => L2(MIRROR.al - da, MIRROR.si - ds, y), p1 = (y: number) => L2(MIRROR.al + da, MIRROR.si + ds, y);
        const y0 = MIRROR.y - 0.026, y1 = MIRROR.y + 0.022;
        return (
          <g>
            <path d={poly([p0(y0), p1(y0), p1(y1), p0(y1)])} fill="#9FB7C2" stroke={C.ink} strokeWidth={3} strokeLinejoin="round" />
            <path d={poly([p0(y1 - 0.004), p1(y1 - 0.004), p1(y1 - 0.012), p0(y1 - 0.012)])} fill="#FFFFFF" opacity={0.9} />
          </g>
        );
      })()}
      {/* the slowed swing, shown as a short arc around the pivot */}
      {sweep > 0.05 && (() => {
        const pts = Array.from({length: 13}, (_, i) => { const a = ((45 - 9 + (18 * i) / 12) * Math.PI) / 180; return L2(MIRROR.al + Math.cos(a) * 0.058, MIRROR.si + Math.sin(a) * 0.058, MIRROR.y + 0.036); });
        return <path d={'M' + pts.map((p) => `${f3(p.x)} ${f3(p.y)}`).join('L')} fill="none" stroke={C.cream} strokeWidth={Math.max(2, s * 0.004)} strokeLinecap="round" opacity={0.7 * sweep} />;
      })()}
      {/* beam: module -> mirror -> out (illustrated, amber) */}
      {beam > 0.01 && (() => {
        const a = L2(MIRROR.al, -0.026, MIRROR.y), m = L2(MIRROR.al, MIRROR.si, MIRROR.y);
        const r = (6 * dev * Math.PI) / 180;
        const L = (H.al1 - 0.016 - MIRROR.al) / Math.cos(r), o = L2(MIRROR.al + L * Math.cos(r), MIRROR.si + L * Math.sin(r), MIRROR.y);
        return (
          <g opacity={beam}>
            <line x1={a.x} y1={a.y} x2={m.x} y2={m.y} stroke={LIGHT.irGlow} strokeWidth={s * 0.012} opacity={0.4} strokeLinecap="round" />
            <line x1={a.x} y1={a.y} x2={m.x} y2={m.y} stroke={LIGHT.ir} strokeWidth={s * 0.005} strokeDasharray={`${f3(s * 0.014)} ${f3(s * 0.01)}`} strokeDashoffset={f3(-t * s * 0.09)} strokeLinecap="round" />
            <line x1={m.x} y1={m.y} x2={o.x} y2={o.y} stroke={LIGHT.irGlow} strokeWidth={s * 0.012} opacity={0.4} strokeLinecap="round" />
            <line x1={m.x} y1={m.y} x2={o.x} y2={o.y} stroke={LIGHT.ir} strokeWidth={s * 0.005} strokeDasharray={`${f3(s * 0.014)} ${f3(s * 0.01)}`} strokeDashoffset={f3(-t * s * 0.09)} strokeLinecap="round" />
          </g>
        );
      })()}
    </g>
  );
  const slide = cover * cover * 0.42, lift = 0.05 * clamp((cover - 0.5) / 0.5);
  return (
    <g>
      {/* mount on the bench */}
      <Box al0={H.al0 + 0.155} al1={H.al1 - 0.155} si0={-0.025} si1={0.025} y0={CART.top} y1={H.y0} top={R.metal} side={R.metalDeep} end={R.metal} />
      <Box al0={H.al0 + 0.13} al1={H.al1 - 0.13} si0={-0.05} si1={0.05} y0={H.y0 - 0.03} y1={H.y0} top={R.metal} side={R.metalDeep} end={R.metal} />
      <Box al0={H.al0 + 0.1} al1={H.al1 - 0.1} si0={-0.08} si1={0.08} y0={CART.top} y1={CART.top + 0.015} top={R.metal} side={R.metalDeep} end={R.metalDeep} />
      {/* exit nozzle on the front face (seen past the top edge) */}
      <Box al0={-0.004} al1={0.03} si0={-0.035} si1={0.035} y0={EXIT.y - 0.035} y1={EXIT.y + 0.035} top={R.housingLight} side={R.housing} end={R.housing} sw={2} />
      {/* housing walls (the top is the cover) */}
      <Box al0={H.al0} al1={H.al1} si0={-H.si} si1={H.si} y0={H.y0} y1={H.y1} top={cover > 0.001 ? '#2E434C' : R.housingLight} side={R.housing} end="#3A424B" sw={3} />
      {cover > 0.001 && inner}
      {/* the cover: slides back off the housing and lifts away */}
      {cover < 0.999 && (
        <g opacity={1 - clamp((cover - 0.75) / 0.25)}>
          <Box al0={H.al0 - slide} al1={H.al1 - slide} si0={-H.si - 0.004} si1={H.si + 0.004} y0={H.y1 + lift} y1={H.y1 + 0.014 + lift} top={R.housingLight} side="#4D5761" end="#4D5761" sw={2.6} />
          {[[-0.32, -0.09], [-0.32, 0.09], [-0.03, -0.09], [-0.03, 0.09]].map(([a, si], i) => { const p = L2(a - slide, si, H.y1 + 0.014 + lift); return <circle key={i} cx={p.x} cy={p.y} r={s * 0.006} fill="#596470" stroke={C.ink} strokeWidth={1.5} />; })}
          {(() => { const a = L2(-0.3 - slide, -0.05, H.y1 + 0.014 + lift), b = L2(-0.06 - slide, -0.05, H.y1 + 0.014 + lift); return <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#596470" strokeWidth={s * 0.008} strokeLinecap="round" />; })()}
        </g>
      )}
      <defs><clipPath id={`${id}-x`}><rect x={-1} y={-1} width={1} height={1} /></clipPath></defs>
    </g>
  );
};
export {lerp, P};
