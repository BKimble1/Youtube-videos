// Profile cross-section of the face device through a mouth corner (face looks left). Explanatory cutaway, simplified
// from the 2024 study: dermis equivalent (human fibroblasts in collagen) on a silicone layer over a rigid base; the
// tissue gels into V-shaped perforations ("perforation-type anchors", inspired by skin ligaments) so it stays attached.
// At the mouth corner the anchored tissue sits in a movable insert; an actuator pulls it up and back and the covering
// follows, bunching into the cheek. Skin thickness and cells are shown at an illustrative scale.
import React from 'react';
import {Pt, smooth, path, lerp, clamp, rnd} from '../lib';
import {TissueSection, TMap, DERM, tc} from './Tissue';
import {K} from './Face';

const CTRL: Pt[] = [
  {x: 90, y: 500}, {x: 18, y: 440}, {x: -26, y: 360}, {x: -40, y: 280}, {x: -38, y: 212}, {x: -30, y: 160},
  {x: -38, y: 104}, {x: -48, y: 40}, {x: -34, y: -40}, {x: -6, y: -104}, {x: -14, y: -170}, {x: -2, y: -270},
  {x: 26, y: -380}, {x: 90, y: -470},
]; // chin (bottom) -> forehead (top): arc length s increases upward
// sample the base curve and its arc length
const SAMP = (() => {
  const pts: Pt[] = [];
  const n = CTRL.length;
  for (let i = 0; i < n - 1; i++) {
    const p0 = CTRL[Math.max(0, i - 1)], p1 = CTRL[i], p2 = CTRL[i + 1], p3 = CTRL[Math.min(n - 1, i + 2)];
    for (let k = 0; k < 40; k++) {
      const t = k / 40, t2 = t * t, t3 = t2 * t;
      pts.push({
        x: 0.5 * (2 * p1.x + (-p0.x + p2.x) * t + (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 + (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3),
        y: 0.5 * (2 * p1.y + (-p0.y + p2.y) * t + (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 + (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3),
      });
    }
  }
  pts.push(CTRL[n - 1]);
  const L = [0];
  for (let i = 1; i < pts.length; i++) L.push(L[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y));
  return {pts, L, total: L[L.length - 1]};
})();
export const S_TOTAL = SAMP.total;
// point and outward normal (pointing away from the base, i.e. to the left) at arc length s
export const curveAt = (s: number) => {
  const {pts, L} = SAMP;
  s = clamp(s, 0, L[L.length - 1] - 0.01);
  let lo = 0, hi = L.length - 1;
  while (hi - lo > 1) { const m = (lo + hi) >> 1; if (L[m] <= s) lo = m; else hi = m; }
  const t = (s - L[lo]) / (L[hi] - L[lo]);
  const p = {x: lerp(pts[lo].x, pts[hi].x, t), y: lerp(pts[lo].y, pts[hi].y, t)};
  const tx = pts[hi].x - pts[lo].x, ty = pts[hi].y - pts[lo].y, tl = Math.hypot(tx, ty);
  // tangent points up (decreasing y); outward normal = tangent rotated so it points left
  return {p, t: {x: tx / tl, y: ty / tl}, n: {x: ty / tl, y: -tx / tl}};
};

export const SEC = {sil: 34, skin: 26, k: 26 / DERM, sc: 0, plateBack: 380};
// the mouth-corner insert sits where the curve crease is (y ~ 160)
SEC.sc = (() => { let best = 0, bd = 1e9; for (let s = 0; s < SAMP.total; s += 1) { const d = Math.abs(curveAt(s).p.y - 160); if (d < bd) { bd = d; best = s; } } return best; })();
export const HERO_U = 640; // the fibroblast the film dives into
const S_HERO = SEC.sc + 72; // just above the corner, in the cheek
export const uToS = (u: number) => S_HERO + (u - HERO_U) * SEC.k;
export const sToU = (s: number) => HERO_U + (s - S_HERO) / SEC.k;
// pull direction of the corner insert: up and back toward the motor
export const PULL = (() => { const d = {x: 0.72, y: -0.69}; const l = Math.hypot(d.x, d.y); return {x: d.x / l, y: d.y / l}; })();
export const MOTOR = {x0: 400, y0: -250, x1: 520, y1: -150};

// displacement of the covering for pull amount d (0..1): tissue near the corner follows the insert; the cheek bulges
const dispAt = (s: number, off: number, d: number) => {
  const c = curveAt(s);
  const w = Math.exp(-(((s - SEC.sc) / 70) ** 2));
  const wb = Math.exp(-(((s - (SEC.sc + 90)) / 60) ** 2));
  // bonded to the base: the silicone's underside only moves where the insert carries it
  const near = Math.exp(-(((s - SEC.sc) / 22) ** 2));
  const bond = clamp(off / SEC.sil, 0, 1) * (1 - near) + near;
  const tp = 40 * d * w * bond;
  const bz = 22 * d * wb * clamp(off / SEC.sil, 0, 1.6);
  return {x: PULL.x * tp * 0.55 + c.t.x * tp * 0.6 + c.n.x * bz, y: PULL.y * tp * 0.55 + c.t.y * tp * 0.6 + c.n.y * bz};
};
// world position of a point at arc length s, offset `off` outward from the base surface, under pull d
export const secPt = (s: number, off: number, d: number): Pt => {
  const c = curveAt(s), q = dispAt(s, off, d);
  return {x: c.p.x + c.n.x * off + q.x, y: c.p.y + c.n.y * off + q.y};
};
export const secMap = (d: number): TMap => (u, w) => secPt(uToS(u), SEC.sil + SEC.skin - w * SEC.k, d);

export const ANCHORS = [70, 190, 310, 430, 560, 690, 820, 950].map((a) => (Math.abs(a - SEC.sc) < 70 ? a + (a < SEC.sc ? -40 : 40) : a)); // fixed V perforations

const VHole: React.FC<{s: number; d: number; ins?: Pt; tone: number; glow: number; id: string}> = ({s, d, ins = {x: 0, y: 0}, tone, glow, id}) => {
  const c = curveAt(s);
  const P = (a: number, depth: number) => ({x: c.p.x + c.t.x * a - c.n.x * depth + ins.x, y: c.p.y + c.t.y * a - c.n.y * depth + ins.y});
  // V: wide (28) at the surface narrowing to 9 at depth 34, then a rounded pocket where the gel locks in
  const hole = [P(-14, -1), P(-4.5, 34), P(-11, 40), P(-11, 52), P(0, 58), P(11, 52), P(11, 40), P(4.5, 34), P(14, -1)];
  const C = tc(tone);
  const sTop = secPt(s, SEC.sil, d), sBot = secPt(s, 1, d);
  return (
    <g>
      {glow > 0 && <path d={smooth(hole, true, 0.12)} fill="none" stroke="#7FF2EA" strokeWidth={9} opacity={0.45 * glow} />}
      {/* the tissue column: from the skin, through the silicone, into the V and its pocket */}
      <path d={path([{x: sTop.x - c.t.x * 7, y: sTop.y - c.t.y * 7}, {x: sTop.x + c.t.x * 7, y: sTop.y + c.t.y * 7}, {x: sBot.x + c.t.x * 7, y: sBot.y + c.t.y * 7}, {x: sBot.x - c.t.x * 7, y: sBot.y - c.t.y * 7}])} fill={C.matrix} />
      <path d={smooth(hole, true, 0.12)} fill={C.matrix} stroke={K.blockInk} strokeWidth={1.6} />
      {[0, 1].map((k) => <path key={k} d={smooth([P(-6 + k * 9, 4), P(-2 + k * 4, 22), P(-3 + k * 6, 44)])} fill="none" stroke={C.fiber} strokeWidth={1.4} opacity={0.7} />)}
    </g>
  );
};

export const DeviceSection: React.FC<{d: number; t: number; tone: number; id: string; anchorGlow?: number[]; uRange?: [number, number]; motorGlow?: number}> = ({d, t, tone, id, anchorGlow = [], uRange, motorGlow = 0}) => {
  const N = 160;
  const sAt = (i: number) => (i / N) * (S_TOTAL - 1);
  const base = Array.from({length: N + 1}, (_, i) => curveAt(sAt(i)).p);
  const silTop = Array.from({length: N + 1}, (_, i) => secPt(sAt(i), SEC.sil, d));
  const silBot = Array.from({length: N + 1}, (_, i) => secPt(sAt(i), 0, d));
  // block cut face: the base curve, then around the back
  const blockPts = [...base, {x: 300, y: -500}, {x: SEC.plateBack, y: -470}, {x: SEC.plateBack, y: 480}, {x: 300, y: 520}];
  const ins = {x: PULL.x * 40 * d * 0.55 + curveAt(SEC.sc).t.x * 40 * d * 0.6, y: PULL.y * 40 * d * 0.55 + curveAt(SEC.sc).t.y * 40 * d * 0.6};
  const cs = curveAt(SEC.sc);
  const slot = [-1, 1].flatMap((sg) => [0, 1].map((e) => ({x: cs.p.x - cs.n.x * 40 + cs.t.x * sg * 20 + PULL.x * (e ? 46 : -6), y: cs.p.y - cs.n.y * 40 + cs.t.y * sg * 20 + PULL.y * (e ? 46 : -6)})));
  const insPts = [-1, 1].flatMap((sg) => [0, 1].map((e) => ({x: cs.p.x + cs.t.x * sg * 18 - cs.n.x * (e ? 66 : 2) + ins.x, y: cs.p.y + cs.t.y * sg * 18 - cs.n.y * (e ? 66 : 2) + ins.y})));
  const rodA = {x: cs.p.x - cs.n.x * 50 + ins.x, y: cs.p.y - cs.n.y * 50 + ins.y};
  const rodB = {x: MOTOR.x0 + 20, y: MOTOR.y1 - 20};
  const [u0, u1] = uRange ?? [sToU(0), sToU(S_TOTAL)];
  return (
    <g>
      <defs>
        <pattern id={`${id}-hatch`} width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <rect width="14" height="14" fill="#DFE6EB" />
          <line x1="0" y1="0" x2="0" y2="14" stroke="#C6D0D8" strokeWidth="3" />
        </pattern>
        <linearGradient id={`${id}-sil`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#E8F1F6" />
          <stop offset="1" stopColor="#C4D4DE" />
        </linearGradient>
      </defs>
      {/* motor housing behind the block, with the pull rod running to the corner insert */}
      <g>
        <rect x={MOTOR.x0} y={MOTOR.y0} width={MOTOR.x1 - MOTOR.x0} height={MOTOR.y1 - MOTOR.y0} rx={12} fill={K.metal} stroke={K.metalDark} strokeWidth={3} />
        {[0, 1, 2, 3].map((q) => <line key={q} x1={MOTOR.x1 - 14 - q * 10} y1={MOTOR.y0 + 10} x2={MOTOR.x1 - 14 - q * 10} y2={MOTOR.y1 - 10} stroke={K.metalHi} strokeWidth={3} opacity={0.6} />)}
        {motorGlow > 0 && <rect x={MOTOR.x0 - 8} y={MOTOR.y0 - 8} width={MOTOR.x1 - MOTOR.x0 + 16} height={MOTOR.y1 - MOTOR.y0 + 16} rx={16} fill="none" stroke="#7FF2EA" strokeWidth={4} opacity={motorGlow} />}
      </g>
      <path d={smooth(blockPts.slice(0, base.length)) + blockPts.slice(base.length).map((p) => `L${p.x} ${p.y}`).join('') + 'Z'} fill={`url(#${id}-hatch)`} stroke={K.blockInk} strokeWidth={2.5} />
      {/* rod channel and slot */}
      <path d={`M${rodA.x - ins.x} ${rodA.y - ins.y}L${rodB.x} ${rodB.y}`} stroke="#9AA7B2" strokeWidth={22} strokeLinecap="round" />
      <path d={path([slot[0], slot[1], slot[3], slot[2]])} fill="#9AA7B2" />
      <path d={`M${rodA.x} ${rodA.y}L${rodB.x} ${rodB.y}`} stroke={K.rod} strokeWidth={10} strokeLinecap="round" />
      <path d={`M${rodA.x} ${rodA.y}L${rodB.x} ${rodB.y}`} stroke="#FFFFFF" strokeWidth={3} strokeLinecap="round" opacity={0.6} />
      {(() => { const m = {x: lerp(rodA.x, rodB.x, 0.55), y: lerp(rodA.y, rodB.y, 0.55)}; return <circle cx={m.x} cy={m.y} r={9} fill={K.accent} />; })()}
      {/* silicone layer (stand-in for the tissue under real skin) */}
      <path d={smooth(silBot) + 'L' + [...silTop].reverse().map((p) => `${p.x} ${p.y}`).join('L') + 'Z'} fill={`url(#${id}-sil)`} />
      {/* fixed anchors */}
      {ANCHORS.map((s, k) => <VHole key={k} s={s} d={d} tone={tone} glow={anchorGlow[k] ?? 0} id={id} />)}
      {/* the movable corner insert, anchored the same way */}
      <path d={path([insPts[0], insPts[1], insPts[3], insPts[2]])} fill="#8D9AA6" stroke={K.metalDark} strokeWidth={2} />
      <VHole s={SEC.sc} d={d} ins={ins} tone={tone} glow={anchorGlow[ANCHORS.length] ?? 0} id={id} />
      {/* the living covering */}
      <TissueSection m={secMap(d)} u0={Math.max(u0, sToU(0))} u1={Math.min(u1, sToU(S_TOTAL - 1))} t={t} tone={tone} id={`${id}-ts`} />
    </g>
  );
};
