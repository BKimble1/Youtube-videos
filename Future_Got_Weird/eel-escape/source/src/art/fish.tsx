// The predator's exterior: a dark sleeper (Odontobutis obscura), facing LEFT on the riverbed, in fish-local units
// (anatomy.ts). Drawn in parts so the Scene can slot the eel between them (BUILD_BRIEF, "How the Scene composes"):
//   FishFar (far-side fins) → … → FishBody (skin, head, eye, mouth, median fins, near pelvic) → GillGap (the dark
//   opening beneath the gill cover's free edge; the eel's near-exit section is clipped to gillGapPath) → Operculum (the
//   gill cover, a separate plate behind the eye) → Pectoral (near pectoral fin) → the eel's outside part.
// Every outline is a function of the FishLook state and is shared with the X-ray (xray.tsx), so both match exactly.
import React from 'react';
import {ANAL, BODY, DORSAL, DORSAL1, DORSAL2, EXIT, EYE, OPERCLE_EDGE, PECTORAL, PELVIC, PREOPERCLE, VENTRAL} from '../anatomy';
import {add, closed, lerpP, mul, n4, nrm, open, P, poly, pt, rot, sub} from '../core/geo';
import {lit, mix, shade} from '../core/color';
import {uid} from '../core/ids';
import {clamp, hash, lerp} from '../lib';
import {C, INK, INK_PX, NS} from './palette';

export type FishLook = {t: number; gill: number; finPhase: number; startle: number; prop: number; look: number};
/** a calm resting state (handy defaults for tests and stills) */
export const FISH_REST: FishLook = {t: 0, gill: 0.16, finPhase: 0, startle: 0, prop: 0, look: 0};

const D2R = Math.PI / 180;
/** the warm key-light tint for highlights */
const WARM = '#FFE9B8';
const maskUrl = (m?: string) => (!m ? undefined : m.startsWith('url(') ? m : `url(#${m.replace(/^#/, '')})`);

// ---------------------------------------------------------------- curve sampling (the same Catmull-Rom Béziers as geo.ts)
const bz = (a: P, b: P, c: P, d: P, t: number): P => {
  const u = 1 - t, A = u * u * u, B = 3 * u * u * t, Cc = 3 * u * t * t, D = t * t * t;
  return pt(A * a.x + B * b.x + Cc * c.x + D * d.x, A * a.y + B * b.y + Cc * c.y + D * d.y);
};
/** dense samples of geo.open(ps, tension) (wrap = false) or geo.closed(ps, tension) (wrap = true) */
export const sampleCurve = (ps: P[], tension = 1, per = 8, wrap = false): P[] => {
  const n = ps.length, k = tension / 6, out: P[] = [];
  const at = (i: number) => (wrap ? ps[(i + n) % n] : ps[Math.max(0, Math.min(n - 1, i))]);
  const m = wrap ? n : n - 1;
  for (let i = 0; i < m; i++) {
    const p0 = at(i - 1), p1 = at(i), p2 = at(i + 1), p3 = at(i + 2);
    const c1 = pt(p1.x + (p2.x - p0.x) * k, p1.y + (p2.y - p0.y) * k);
    const c2 = pt(p2.x - (p3.x - p1.x) * k, p2.y - (p3.y - p1.y) * k);
    for (let j = 0; j < per; j++) out.push(bz(p1, c1, c2, p2, j / per));
  }
  if (!wrap) out.push(ps[n - 1]);
  return out;
};
const arcLen = (ps: P[]) => {
  const s = [0];
  for (let i = 1; i < ps.length; i++) s.push(s[i - 1] + Math.hypot(ps[i].x - ps[i - 1].x, ps[i].y - ps[i - 1].y));
  return s;
};
/** n points evenly spaced in arc length along a polyline */
const resample = (ps: P[], n: number): P[] => {
  const s = arcLen(ps), L = s[s.length - 1], out: P[] = [];
  let j = 0;
  for (let i = 0; i < n; i++) {
    const target = (L * i) / (n - 1);
    while (j < ps.length - 2 && s[j + 1] < target) j++;
    const u = (target - s[j]) / (s[j + 1] - s[j] || 1);
    out.push(lerpP(ps[j], ps[j + 1], clamp(u)));
  }
  return out;
};
const signedArea = (ps: P[]) => {
  let a = 0;
  for (let i = 0; i < ps.length; i++) {
    const p = ps[i], q = ps[(i + 1) % ps.length];
    a += p.x * q.y - q.x * p.y;
  }
  return a / 2;
};
/** orient a closed control polygon like BODY (so silhouette subpaths union under the nonzero rule) */
const orient = (ps: P[]) => (signedArea(ps) * BODY_SIGN < 0 ? [...ps].reverse() : ps);
const BODY_SIGN = Math.sign(signedArea(BODY));
/** ellipse as a path (so many spots fit in one <path>) */
const ellD = (c: P, rx: number, ry: number, ang: number) => {
  const ca = Math.cos(ang), sa = Math.sin(ang), deg = n4(ang / D2R);
  const a = pt(c.x - rx * ca, c.y - rx * sa);
  return `M${n4(a.x)} ${n4(a.y)}a${n4(rx)} ${n4(ry)} ${deg} 1 0 ${n4(2 * rx * ca)} ${n4(2 * rx * sa)}a${n4(rx)} ${n4(ry)} ${deg} 1 0 ${n4(-2 * rx * ca)} ${n4(-2 * rx * sa)}Z`;
};
const circD = (c: P, r: number) => ellD(c, r, r, 0);
const quadAt = (a: P, c: P, b: P, u: number) => {
  const v = 1 - u;
  return pt(v * v * a.x + 2 * v * u * c.x + u * u * b.x, v * v * a.y + 2 * v * u * c.y + u * u * b.y);
};
const quadTan = (a: P, c: P, b: P, u: number) => nrm(pt(2 * (1 - u) * (c.x - a.x) + 2 * u * (b.x - c.x), 2 * (1 - u) * (c.y - a.y) + 2 * u * (b.y - c.y)));
const bumpS = (u: number) => (u <= 0 || u >= 1 ? 0 : Math.pow(Math.sin(Math.PI * u), 0.9));

// ---------------------------------------------------------------- the body outline
const BT = 1;
/** the body without fins (closed): the path every view shares */
export const BODY_PATH = closed(BODY, BT);
const BODY_PTS = sampleCurve(BODY, BT, 12, true);
const ND = DORSAL.length;
const DORS_PTS = BODY_PTS.slice(0, (ND - 1) * 12 + 1); // snout → peduncle top
const VENT_PTS = BODY_PTS.slice(ND * 12, (BODY.length - 1) * 12 + 1).reverse(); // jaw → peduncle bottom
const profAt = (ps: P[], x: number) => {
  if (x <= ps[0].x) return ps[0].y;
  for (let i = 1; i < ps.length; i++) if (ps[i].x >= x) return lerp(ps[i - 1].y, ps[i].y, (x - ps[i - 1].x) / (ps[i].x - ps[i - 1].x || 1));
  return ps[ps.length - 1].y;
};
/** the body's top (dorsal) and bottom (ventral) edge at x */
export const topY = (x: number) => profAt(DORS_PTS, x);
export const botY = (x: number) => profAt(VENT_PTS, x);
void VENTRAL;

// ---------------------------------------------------------------- the fins (ray fans; geometry shared with the X-ray)
export type Ray = {b: P; c: P; t: P};
export type Fin = {
  /** closed control polygon of the membrane (geo.closed with `tension`) */
  outline: P[];
  tension: number;
  rays: Ray[];
  /** band positions along the rays (0 base .. 1 tip) where the dark spots sit */
  bands: number[];
  spot: number;
  /** gradient axis: base → edge */
  g0: P;
  g1: P;
};
const ray = (b: P, ang: number, len: number, bend: number): Ray => {
  const d = pt(Math.cos(ang), Math.sin(ang));
  const t = add(b, mul(d, len));
  const m = add(lerpP(b, t, 0.5), mul(pt(-d.y, d.x), bend * len));
  return {b, c: m, t};
};
/** a membrane edge through the ray tips, dipping a little between them (scalloped for spiny fins) */
const edgeThrough = (rays: Ray[], dip: number) => {
  const out: P[] = [];
  rays.forEach((r, i) => {
    out.push(r.t);
    if (i < rays.length - 1) {
      const n = rays[i + 1];
      const mid = lerpP(r.t, n.t, 0.5);
      const bm = lerpP(r.b, n.b, 0.5);
      out.push(lerpP(mid, bm, dip));
    }
  });
  return out;
};

/** points along a ray (from u0 to u1), pushed outward by `out` (u) on the side away from the fan: keeps the
 *  Catmull-Rom outline hugging the outer rays instead of overshooting */
const alongRay = (r: Ray, us: number[], out: number, side: 1 | -1) =>
  us.map((u) => {
    const q = quadAt(r.b, r.c, r.t, u), tg = quadTan(r.b, r.c, r.t, u);
    return add(q, mul(pt(-tg.y, tg.x), out * side));
  });
/** which side of ray a lies away from ray b (+1 / -1 in alongRay's normal) */
const awayFrom = (a: Ray, b: Ray): 1 | -1 => {
  const tg = quadTan(a.b, a.c, a.t, 0.5), nb = pt(-tg.y, tg.x);
  const m = quadAt(b.b, b.c, b.t, 0.5), q = quadAt(a.b, a.c, a.t, 0.5);
  return (m.x - q.x) * nb.x + (m.y - q.y) * nb.y > 0 ? -1 : 1;
};

/** first dorsal fin: short, spiny, rounded */
const finDorsal1 = (s: FishLook): Fin => {
  const n = 6, H = [0.8, 1.0, 0.98, 0.88, 0.72, 0.5];
  const st = s.startle;
  const rays: Ray[] = [];
  for (let i = 0; i < n; i++) {
    const f = i / (n - 1);
    const x = lerp(DORSAL1.x0 + 0.5, DORSAL1.x1 - 0.6, f);
    const b = pt(x, topY(x) + 0.7);
    const flex = 0.045 * Math.sin(s.finPhase * 0.7 + i * 0.7);
    const a = -90 * D2R + lerp(20, 50, f) * D2R - 12 * D2R * st + flex;
    rays.push(ray(b, a, DORSAL1.h * H[i] * (1 + 0.14 * st), 0.05 + 0.03 * Math.sin(s.finPhase * 0.7 + i)));
  }
  const b0 = pt(DORSAL1.x0, topY(DORSAL1.x0) + 0.6), b1 = pt(DORSAL1.x1, topY(DORSAL1.x1) + 0.5);
  const outline = [b0, ...edgeThrough(rays, 0.085), b1, pt(DORSAL1.x1, topY(DORSAL1.x1) + 2), pt(DORSAL1.x0, topY(DORSAL1.x0) + 2)];
  return {outline: orient(outline), tension: 0.85, rays, bands: [0.38, 0.7], spot: 1, g0: pt(-5, -12.5), g1: pt(-2, -19)};
};
/** second dorsal fin: long, soft-rayed, rounded at the rear */
const finDorsal2 = (s: FishLook): Fin => {
  const n = 11, H = [0.7, 0.82, 0.9, 0.95, 0.98, 1.0, 1.0, 0.97, 0.9, 0.78, 0.6];
  const st = s.startle;
  const rays: Ray[] = [];
  for (let i = 0; i < n; i++) {
    const f = i / (n - 1);
    const x = lerp(DORSAL2.x0 + 0.4, DORSAL2.x1 - 0.5, f);
    const b = pt(x, topY(x) + 0.7);
    const flex = 0.05 * Math.sin(s.finPhase * 0.7 - i * 0.45);
    const a = -90 * D2R + lerp(36, 60, f) * D2R - 10 * D2R * st + flex;
    rays.push(ray(b, a, DORSAL2.h * H[i] * (1 + 0.1 * st), 0.06));
  }
  const b0 = pt(DORSAL2.x0, topY(DORSAL2.x0) + 0.6), b1 = pt(DORSAL2.x1 + 0.6, topY(DORSAL2.x1 + 0.6) + 0.5);
  const outline = [b0, ...edgeThrough(rays, 0.012), b1, pt(DORSAL2.x1, topY(DORSAL2.x1) + 2), pt(DORSAL2.x0, topY(DORSAL2.x0) + 2)];
  return {outline: orient(outline), tension: 1, rays, bands: [0.26, 0.47, 0.67, 0.86], spot: 1, g0: pt(12, -10), g1: pt(16, -17)};
};
/** the bed line the lower fins stay above */
const BED_Y = 12.95;
/** anal fin: under the second dorsal, folded back (the fish rests on the bed) */
const finAnal = (s: FishLook): Fin => {
  const n = 10, H = [0.7, 0.82, 0.9, 0.95, 1.0, 1.0, 0.97, 0.9, 0.78, 0.6];
  const st = s.startle;
  const rays: Ray[] = [];
  for (let i = 0; i < n; i++) {
    const f = i / (n - 1);
    const x = lerp(ANAL.x0 + 0.4, ANAL.x1 - 0.4, f);
    const b = pt(x, botY(x) - 0.7);
    const len = ANAL.h * H[i] * (1 + 0.08 * st);
    const flex = 0.04 * Math.sin(s.finPhase * 0.7 + 1.3 - i * 0.45);
    let a = 90 * D2R - lerp(62, 50, f) * D2R + flex; // from straight down, swept back
    const maxDy = BED_Y - b.y;
    if (len * Math.sin(a) > maxDy) a = Math.asin(clamp(maxDy / len, 0, 1));
    rays.push(ray(b, a, len, -0.05));
  }
  const b0 = pt(ANAL.x0, botY(ANAL.x0) - 0.6), b1 = pt(ANAL.x1 + 0.5, botY(ANAL.x1 + 0.5) - 0.5);
  const outline = [b0, ...edgeThrough(rays, 0.012), b1, pt(ANAL.x1, botY(ANAL.x1) - 2), pt(ANAL.x0, botY(ANAL.x0) - 2)];
  return {outline: orient(outline), tension: 1, rays, bands: [0.35, 0.7], spot: 0.9, g0: pt(13, 9), g1: pt(17, 13)};
};
/** the big rounded caudal fin (sways gently with finPhase) */
const finCaudal = (s: FishLook): Fin => {
  const st = s.startle;
  const sway = Math.sin(s.finPhase * 0.55);
  const yaw = 1 - 0.05 * (0.5 + 0.5 * Math.sin(s.finPhase * 1.1)); // the fin turning a little out of the view plane
  const spread = 1 + 0.12 * st;
  const R: P[] = [pt(33.6, -5.0), pt(37.4, -8.4), pt(42.0, -9.5), pt(46.4, -8.1), pt(49.2, -4.7), pt(50.0, 0), pt(49.2, 4.7), pt(46.4, 8.1), pt(42.0, 9.5), pt(37.4, 8.4), pt(33.6, 5.0)];
  const piv = pt(33, 0);
  const rim = resample(sampleCurve(R, 1, 10), 15).map((q) => {
    const d = sub(q, piv);
    const bend = 0.035 * sway * (d.x / 17) ** 2;
    return add(piv, rot(pt(d.x * yaw, d.y * spread), 0.03 * sway + bend));
  });
  const rays: Ray[] = rim.map((q, i) => {
    const f = i / (rim.length - 1);
    const b = pt(32.2, lerp(-4.4, 4.4, f));
    const m = add(lerpP(b, q, 0.5), pt(0, 0.25 * sway));
    return {b, c: m, t: q};
  });
  const outline = [pt(31.5, -5.6), pt(33.6, -5.6), ...edgeThrough(rays, 0.025).slice(1, -1), pt(33.6, 5.6), pt(31.5, 5.6)];
  return {outline: orient(outline), tension: 1, rays, bands: [0.24, 0.42, 0.6, 0.78], spot: 1.05, g0: pt(33, 0), g1: pt(49, 0)};
};
/** pelvic fin (separate, resting on the bed under the pectoral); far = the far-side one, a little behind */
const finPelvic = (s: FishLook, far: boolean): Fin => {
  const n = 7, H = [0.8, 0.92, 0.99, 1.0, 0.97, 0.9, 0.78];
  const o = far ? pt(0.9, -0.35) : pt(0, 0);
  const base = add(PELVIC.base, o);
  const rays: Ray[] = [];
  for (let i = 0; i < n; i++) {
    const f = i / (n - 1);
    const b = add(base, pt(-0.15 * f, lerp(-0.45, 0.35, f)));
    const flex = 0.025 * Math.sin(s.finPhase * 0.8 + i * 0.5 + (far ? 2 : 0));
    let a = lerp(-22, 5, f) * D2R + flex + 8 * D2R * s.startle * (f - 0.5);
    const len = PELVIC.reach * H[i] * (far ? 0.9 : 1);
    if (b.y + len * Math.sin(a) > BED_Y + 0.1) a = Math.asin(clamp((BED_Y + 0.1 - b.y) / len, -1, 1));
    rays.push(ray(b, a, len, 0.02));
  }
  const r0 = rays[0], rn = rays[n - 1];
  const outline = [add(base, pt(0.3, -0.75)), ...alongRay(r0, [0.3, 0.65], 0.12, awayFrom(r0, rn)), ...edgeThrough(rays, 0.0), ...alongRay(rn, [0.65, 0.3], 0.1, awayFrom(rn, r0)), add(base, pt(0.3, 0.5)), add(base, pt(-0.5, 0))];
  return {outline: orient(outline), tension: 1, rays, bands: [0.42, 0.7], spot: 0.8, g0: base, g1: add(base, pt(7.5, 0))};
};
/** pectoral fin: a big rounded fan behind the lower half of the gill cover; fans with finPhase */
const finPectoral = (s: FishLook, far: boolean): Fin => {
  const n = 13;
  const st = s.startle;
  const ph = s.finPhase + (far ? Math.PI * 0.8 : 0);
  const [B0, B1] = PECTORAL.base;
  const o = far ? pt(0.9, -0.6) : pt(0, 0);
  const swing = 0.075 * Math.sin(ph) - 0.16 * st; // the whole fan rocking about its base (− lifts it)
  const spread = 1 + 0.09 * Math.sin(ph + 0.9) + 0.32 * st;
  const reach = PECTORAL.reach * (1 - 0.05 * (0.5 + 0.5 * Math.sin(ph)) + 0.04 * st);
  const mid = 7 * D2R;
  const rays: Ray[] = [];
  for (let i = 0; i < n; i++) {
    const f = i / (n - 1);
    const b = add(lerpP(B0, B1, lerp(0.06, 0.94, f)), add(o, pt(-0.35 * Math.sin(Math.PI * f), 0)));
    const a0 = lerp(-26, 31, f) * D2R;
    const a = mid + (a0 - mid) * spread + swing + 0.03 * Math.sin(ph * 1.3 + f * 3);
    const len = reach * (0.8 + 0.2 * Math.sin(Math.PI * lerp(0.12, 0.92, f)));
    rays.push(ray(b, a, len, 0.035 + 0.02 * Math.sin(ph + f * 2)));
  }
  const bb0 = add(B0, add(o, pt(0.1, -0.35))), bb1 = add(B1, add(o, pt(0.25, 0.3)));
  const bm = add(lerpP(B0, B1, 0.5), add(o, pt(-0.9, 0)));
  const r0 = rays[0], rn = rays[n - 1];
  const outline = [bb0, ...alongRay(r0, [0.35, 0.7], 0.12, awayFrom(r0, rn)), ...rays.map((r) => r.t), ...alongRay(rn, [0.7, 0.35], 0.12, awayFrom(rn, r0)), bb1, bm];
  return {outline: orient(outline), tension: 1, rays, bands: [0.3, 0.5, 0.68, 0.85], spot: 1, g0: lerpP(B0, B1, 0.5), g1: add(lerpP(B0, B1, 0.5), pt(11, 1))};
};
export type Fins = {d1: Fin; d2: Fin; anal: Fin; caudal: Fin; pelvic: Fin; pelvicFar: Fin; pectoral: Fin; pectoralFar: Fin};
export const finsFor = (s: FishLook): Fins => ({
  d1: finDorsal1(s), d2: finDorsal2(s), anal: finAnal(s), caudal: finCaudal(s),
  pelvic: finPelvic(s, false), pelvicFar: finPelvic(s, true), pectoral: finPectoral(s, false), pectoralFar: finPectoral(s, true),
});
export const finPath = (f: Fin) => closed(f.outline, f.tension);
export const raysPath = (f: Fin, from = 0, to = 1) =>
  f.rays.map((r) => {
    const a = quadAt(r.b, r.c, r.t, from), b = quadAt(r.b, r.c, r.t, to);
    const c = quadAt(r.b, r.c, r.t, (from + to) / 2);
    const cc = pt(2 * c.x - (a.x + b.x) / 2, 2 * c.y - (a.y + b.y) / 2);
    return `M${n4(a.x)} ${n4(a.y)}Q${n4(cc.x)} ${n4(cc.y)} ${n4(b.x)} ${n4(b.y)}`;
  }).join('');
const spotsPath = (f: Fin) => {
  let d = '';
  f.rays.forEach((r, i) => {
    const nb = f.rays[Math.min(f.rays.length - 1, i + 1)], pb = f.rays[Math.max(0, i - 1)];
    f.bands.forEach((u0, k) => {
      const u = clamp(u0 + (i % 2 ? 0.035 : -0.02) + 0.03 * (hash(i * 7.1 + k * 3.3) - 0.5));
      const c = quadAt(r.b, r.c, r.t, u);
      const gap = (Math.hypot(nb.t.x - pb.t.x, nb.t.y - pb.t.y) / (nb === pb ? 1 : i === 0 || i === f.rays.length - 1 ? 1 : 2)) * u;
      const tg = quadTan(r.b, r.c, r.t, u);
      const rx = clamp(gap * 0.4, 0.18, 0.6) * f.spot * (0.8 + 0.35 * hash(i * 1.7 + k));
      const ry = clamp(gap * 0.27, 0.13, 0.4) * f.spot;
      d += ellD(c, rx, ry, Math.atan2(tg.y, tg.x));
    });
  });
  return d;
};

/** one fin, painted: amber membrane (darker at the base), rays, rows of dark spots, ink edge */
const FinArt: React.FC<{f: Fin; dim?: number; ink?: number}> = ({f, dim = 0, ink = INK_PX * 0.86}) => {
  const g = uid('fin');
  const base = shade(mix(C.fin, C.finDark, 0.22), dim);
  const edge = shade(lit(C.fin, 0.2), dim);
  const d = finPath(f);
  return (
    <g>
      <defs>
        <linearGradient id={g} gradientUnits="userSpaceOnUse" x1={n4(f.g0.x)} y1={n4(f.g0.y)} x2={n4(f.g1.x)} y2={n4(f.g1.y)}>
          <stop offset="0" stopColor={base} />
          <stop offset="0.55" stopColor={shade(C.fin, dim)} />
          <stop offset="1" stopColor={edge} />
        </linearGradient>
      </defs>
      <path d={d} fill={`url(#${g})`} />
      <path d={raysPath(f, 0.04, 0.985)} fill="none" stroke={shade(C.finRay, dim)} strokeWidth={1.35} vectorEffect={NS} strokeLinecap="round" opacity={0.9} />
      <path d={spotsPath(f)} fill={shade(C.finDark, dim)} opacity={0.78} />
      <path d={d} fill="none" stroke={INK} strokeWidth={ink} vectorEffect={NS} strokeLinejoin="round" />
    </g>
  );
};

// ---------------------------------------------------------------- the gill cover's free edge and the gap beneath it
const EDGE_N = 72;
const E0: P[] = resample(sampleCurve(OPERCLE_EDGE, 1, 16), EDGE_N);
const E0_S = arcLen(E0);
const E0_LEN = E0_S[E0_S.length - 1];
/** the rear (outward) normal of the edge at each sample */
const E0_NRM: P[] = E0.map((_, i) => {
  const a = E0[Math.max(0, i - 1)], b = E0[Math.min(EDGE_N - 1, i + 1)];
  const t = nrm(sub(b, a));
  return pt(t.y, -t.x);
});
const EXIT_I = (() => {
  let best = 0, bd = 1e9;
  E0.forEach((q, i) => {
    const d = Math.hypot(q.x - EXIT.x, q.y - EXIT.y);
    if (d < bd) { bd = d; best = i; }
  });
  return best;
})();
const EXIT_S = E0_S[EXIT_I];

export type OperGeom = {
  /** the cover's (flared, notched) free edge, top → bottom */
  ec: P[];
  /** the body-side margin of the gill opening behind it, top → bottom */
  eb: P[];
  /** outward normals at the samples */
  nrm: P[];
  /** per sample: flare displacement, gap width, notch depth (all u) */
  d: number[];
  w: number[];
  notch: number[];
  /** the gill cover plate outline (closed polygon) */
  plate: P[];
  /** the dark opening (closed polygon, overlapping the cover a little) */
  gap: P[];
  /** the clip for the eel's near-exit section (closed polygon: from well under the cover back to the body margin) */
  clip: P[];
};
/** the cover's lower, front (preopercle groove) and upper borders, from the edge's bottom end round to its top end */
const PLATE_REST: P[] = (() => {
  const top = OPERCLE_EDGE[0], bot = OPERCLE_EDGE[OPERCLE_EDGE.length - 1];
  const cps = [bot, pt(-31.6, 10.45), pt(-34.7, 9.95), pt(-37.4, 9.0), ...[...PREOPERCLE].reverse(), pt(-33.7, -10.5), pt(-30.4, -10.95), top];
  return sampleCurve(cps, 0.9, 8).slice(1, -1);
})();
export const opercGeom = (s: FishLook): OperGeom => {
  const fl = s.startle * 0.32 * Math.abs(Math.sin(s.t * 23));
  const g = clamp(s.gill + fl, 0, 1.3);
  const pr = clamp(s.prop, 0, 1.2);
  const d: number[] = [], w: number[] = [], notch: number[] = [];
  const ec: P[] = [], eb: P[] = [], gapF: P[] = [], clipF: P[] = [];
  for (let i = 0; i < EDGE_N; i++) {
    const a = E0_S[i] / E0_LEN;
    const bm = bumpS(a);
    const loc = Math.exp(-Math.pow(Math.abs(E0_S[i] - EXIT_S) / 2.25, 3)) * Math.min(1, a / 0.06);
    const di = 0.95 * g * bm;
    const wi = (0.1 + 1.15 * g) * Math.pow(bm, 0.8) + pr * 0.55 * loc;
    const ni = pr * 2.15 * loc;
    d.push(di); w.push(wi); notch.push(ni);
    const n = E0_NRM[i];
    ec.push(add(E0[i], mul(n, di - ni)));
    eb.push(add(E0[i], mul(n, di + wi)));
    gapF.push(add(E0[i], mul(n, di - ni - 0.35 * bm)));
    clipF.push(add(E0[i], mul(n, di - ni - 1.5 * Math.min(1, a / 0.05, (1 - a) / 0.05))));
  }
  const plate = [...ec, ...PLATE_REST];
  return {ec, eb, nrm: E0_NRM, d, w, notch, plate, gap: [...gapF, ...[...eb].reverse()], clip: [...clipF, ...[...eb].reverse()]};
};
/** the eel's near-exit section is clipped to this: the gill opening beneath the cover's edge (fish-local path) */
export const gillGapPath = (s: FishLook) => poly(opercGeom(s).clip);

// ---------------------------------------------------------------- the silhouette (body + every fin), for masks and the X-ray
const ORBIT_R = 3.02;
const orbitPts = () => orient(Array.from({length: 24}, (_, i) => add(EYE.c, pt(Math.cos((i / 24) * 2 * Math.PI) * ORBIT_R, Math.sin((i / 24) * 2 * Math.PI) * ORBIT_R))));
export const fishSilhouette = (s: FishLook): string => {
  const f = finsFor(s);
  return [BODY_PATH, closed(orbitPts(), 1), finPath(f.caudal), finPath(f.d1), finPath(f.d2), finPath(f.anal), finPath(f.pelvic), finPath(f.pelvicFar), finPath(f.pectoral), finPath(f.pectoralFar)].join('');
};

// ---------------------------------------------------------------- skin pattern (olive-brown with dark saddles and mottling)
const blob = (c: P, rx: number, ry: number, ang: number, seed: number, n = 10, rough = 0.2): P[] =>
  Array.from({length: n}, (_, i) => {
    const a = (i / n) * 2 * Math.PI;
    const r = 1 + rough * (hash(seed * 13.7 + i * 3.1) * 2 - 1);
    return add(c, rot(pt(Math.cos(a) * rx * r, Math.sin(a) * ry * r), ang));
  });
/** dark saddles over the back, slanting a little backward */
const SADDLES: [P, number, number, number][] = [
  [pt(-24.8, -10.2), 3.3, 6.4, 0.16], [pt(-10.2, -9.4), 4.3, 8.6, 0.17], [pt(4.6, -8.6), 4.0, 8.2, 0.2],
  [pt(17.6, -6.8), 3.5, 7.2, 0.22], [pt(28.6, -3.6), 2.6, 5.6, 0.12], [pt(-34.5, -11.6), 3.0, 3.2, 0.1],
];
/** irregular blotches along the mid and lower flank */
const BLOTCHES: [P, number, number][] = [
  [pt(-17.2, 1.4), 2.2, 1.6], [pt(-2.6, 2.4), 2.5, 1.8], [pt(11.4, 1.6), 2.2, 1.6], [pt(23.4, 0.9), 1.9, 1.4],
  [pt(-9.6, 6.6), 1.8, 1.3], [pt(4.6, 6.9), 2.0, 1.3], [pt(17.0, 5.0), 1.6, 1.2], [pt(30.6, 1.6), 1.3, 1.1],
  [pt(-24.0, 4.6), 1.3, 1.0], [pt(-4.0, -3.4), 1.5, 1.1], [pt(10.6, -2.6), 1.4, 1.0], [pt(-16.6, -4.4), 1.4, 1.0],
];
const SADDLE_D = SADDLES.map(([c, rx, ry, a], i) => closed(blob(c, rx, ry, a, i + 1, 14, 0.24), 1)).join('');
const BLOTCH_D = BLOTCHES.map(([c, rx, ry], i) => closed(blob(c, rx, ry, 0.3 * (hash(i) - 0.5), i + 20, 9, 0.24), 1)).join('');
/** fine dark speckles over the upper two thirds (deterministic) */
const SPECKLE_D = (() => {
  let d = '';
  for (let i = 0; i < 90; i++) {
    const x = lerp(-47, 31, hash(i * 3.71 + 0.5));
    const top = topY(x), bot = botY(x);
    const y = lerp(top + 0.7, top + (bot - top) * 0.62, hash(i * 5.13 + 1.7));
    const e = Math.hypot(x - EYE.c.x, y - EYE.c.y);
    if (e < ORBIT_R + 0.6) continue;
    if (x < -40 && y > -1) continue; // keep the lips clean
    d += circD(pt(x, y), lerp(0.14, 0.32, hash(i * 9.7)));
  }
  return d;
})();
/** larger dark spots on the snout and cheek */
const HEAD_SPOTS_D = [
  [pt(-46.6, -4.6), 0.42], [pt(-44.2, -2.2), 0.5], [pt(-46.0, -1.6), 0.34], [pt(-42.0, -2.0), 0.36], [pt(-39.2, -2.6), 0.44],
  [pt(-43.4, -10.0), 0.34], [pt(-37.6, -1.0), 0.32], [pt(-41.6, 5.6), 0.36], [pt(-44.6, 4.6), 0.3],
].map(([c, r]) => circD(c as P, r as number)).join('');

/** rim lines just inside the dorsal and ventral profiles */
const DORS_RIM_D = open(Array.from({length: 40}, (_, i) => {
  const x = lerp(-48.2, 31, i / 39);
  return pt(x, topY(x) + 0.3);
}));
const VENT_RIM_D = open(Array.from({length: 34}, (_, i) => {
  const x = lerp(-44, 30, i / 33);
  return pt(x, botY(x) - 0.38);
}));
/** gloss streaks: along the upper flank (a little below the dorsal profile) and over the snout */
const GLOSS_D = open(Array.from({length: 16}, (_, i) => {
  const x = lerp(-45.5, 12, i / 15);
  return pt(x, topY(x) + lerp(1.5, 2.6, i / 15));
}));
const GLOSS2_D = open([pt(-48.6, -1.9), pt(-47.6, -3.6), pt(-46.0, -5.2)]);
/** the scale hint: a tile of rear-facing scale edges, offset in alternate columns (ctenoid scales ≈ 2 u) */
const SCALE_W = 1.9, SCALE_H = 2.2;
const SCALE_D = (() => {
  const r = SCALE_H * 0.52;
  const arc = (x: number, y: number) => `M${n4(x)} ${n4(y - r)}A${n4(r)} ${n4(r)} 0 0 1 ${n4(x)} ${n4(y + r)}`;
  return arc(0, 0) + arc(0, SCALE_H) + arc(SCALE_W / 2, SCALE_H / 2) + arc(SCALE_W, 0) + arc(SCALE_W, SCALE_H);
})();
const SCALE_HI = (() => {
  const r = SCALE_H * 0.44;
  const arc = (x: number, y: number) => `M${n4(x + 0.12)} ${n4(y - r)}A${n4(r)} ${n4(r)} 0 0 1 ${n4(x + r * 0.95)} ${n4(y - 0.1)}`;
  return arc(0, 0) + arc(0, SCALE_H) + arc(SCALE_W / 2, SCALE_H / 2) + arc(SCALE_W, 0) + arc(SCALE_W, SCALE_H);
})();

// mouth: the closed cleft from the snout tip to the corner below the eye; a fleshy upper lip (premaxilla) above it,
// the slightly jutting lower jaw below it
const CLEFT = [pt(-50.85, 0.2), pt(-48.6, 0.86), pt(-46.2, 1.5), pt(-43.7, 2.12), pt(-41.3, 2.66)];
const UPPER_LIP = [pt(-50.25, -0.95), pt(-48.2, -0.5), pt(-45.7, 0.22), pt(-43.2, 0.98), pt(-41.0, 1.62), pt(-39.75, 2.1)];
const LOWER_LIP = [pt(-51.05, 1.75), pt(-48.7, 2.62), pt(-46.1, 3.28), pt(-43.6, 3.72), pt(-41.7, 3.74), pt(-40.7, 3.2)];
/** the maxilla's rounded rear end, just behind the corner */
const MAX_END = [pt(-39.75, 2.1), pt(-39.6, 2.6), pt(-40.0, 2.98), pt(-40.55, 3.0)];
const UPPER_LIP_D = poly([...sampleCurve(UPPER_LIP, 1, 6), ...sampleCurve(MAX_END, 1, 4).slice(1), ...[...sampleCurve(CLEFT, 1, 6)].reverse(), pt(-51.3, -0.5)]);
const LOWER_LIP_D = poly([...sampleCurve(CLEFT, 1, 6), pt(-40.55, 3.05), ...[...sampleCurve(LOWER_LIP, 1, 6)].reverse(), pt(-51.7, 1.1)]);

// ---------------------------------------------------------------- components

/** the far-side fins (behind the body): far pectoral and far pelvic, in shade */
export const FishFar: React.FC<{s: FishLook}> = ({s}) => {
  const f = finsFor(s);
  return (
    <g>
      <FinArt f={f.pectoralFar} dim={0.42} />
      <FinArt f={f.pelvicFar} dim={0.4} />
    </g>
  );
};

/** skin, head, eye, mouth, the median fins and the near pelvic fin (NOT the gill cover or the near pectoral) */
export const FishBody: React.FC<{s: FishLook; opacity?: number; mask?: string}> = ({s, opacity, mask}) => {
  const f = finsFor(s);
  const id = {llip: uid('fbLlip'), gl: uid('fbGl'), sad: uid('fbSad'), sm: uid('fbSm'), smg: uid('fbSmg'), scl: uid('fbScl'), body: uid('fbBody'), clip: uid('fbClip'), lo: uid('fbLo'), hi: uid('fbHi'), head: uid('fbHead'), iris: uid('fbIris'), orb: uid('fbOrb'), lip: uid('fbLip'), sc: uid('fbSc'), strk: uid('fbStk')};
  const E = EYE.c, r = EYE.r;
  const look = clamp(s.look, -1, 1);
  const pup = add(E, pt(0.62 * look, 0.08 + 0.06 * Math.abs(look)));
  return (
    <g opacity={opacity} mask={maskUrl(mask)}>
      <defs>
        <linearGradient id={id.body} gradientUnits="userSpaceOnUse" x1="0" y1="-13" x2="0" y2="12.6">
          <stop offset="0" stopColor={C.fishDark} />
          <stop offset="0.22" stopColor={mix(C.fishDark, C.fishBody, 0.7)} />
          <stop offset="0.48" stopColor={C.fishBody} />
          <stop offset="0.66" stopColor={C.fishCheek} />
          <stop offset="0.79" stopColor={mix(C.fishCheek, C.fishBelly, 0.65)} />
          <stop offset="0.9" stopColor={C.fishBelly} />
          <stop offset="1" stopColor={mix(C.fishBelly, C.fishBody, 0.35)} />
        </linearGradient>
        <linearGradient id={id.lo} gradientUnits="userSpaceOnUse" x1="0" y1="2" x2="0" y2="12.8">
          <stop offset="0" stopColor={C.fishDark} stopOpacity={0} />
          <stop offset="0.7" stopColor={C.fishDark} stopOpacity={0.16} />
          <stop offset="1" stopColor={C.fishDark} stopOpacity={0.42} />
        </linearGradient>
        <linearGradient id={id.hi} gradientUnits="userSpaceOnUse" x1="0" y1="-13" x2="0" y2="0">
          <stop offset="0" stopColor={C.fishDark} stopOpacity={0.38} />
          <stop offset="0.24" stopColor={WARM} stopOpacity={0} />
          <stop offset="0.52" stopColor={WARM} stopOpacity={0.1} />
          <stop offset="1" stopColor={WARM} stopOpacity={0} />
        </linearGradient>
        <radialGradient id={id.head} gradientUnits="userSpaceOnUse" cx="-41" cy="-6" r="12" fx="-44" fy="-9">
          <stop offset="0" stopColor={WARM} stopOpacity={0.2} />
          <stop offset="1" stopColor={WARM} stopOpacity={0} />
        </radialGradient>
        <linearGradient id={id.strk} gradientUnits="userSpaceOnUse" x1="10" y1="0" x2="34" y2="0">
          <stop offset="0" stopColor={C.fishDark} stopOpacity={0} />
          <stop offset="1" stopColor={C.fishDark} stopOpacity={0.24} />
        </linearGradient>
        <radialGradient id={id.iris} gradientUnits="userSpaceOnUse" cx={n4(E.x)} cy={n4(E.y)} r={n4(r)} fx={n4(E.x - 0.8)} fy={n4(E.y - 0.9)}>
          <stop offset="0" stopColor={lit(C.eyeIris, 0.35)} />
          <stop offset="0.55" stopColor={C.eyeIris} />
          <stop offset="0.86" stopColor={mix(C.eyeIris, C.eyeRing, 0.6)} />
          <stop offset="1" stopColor={C.eyeRing} />
        </radialGradient>
        <radialGradient id={id.orb} gradientUnits="userSpaceOnUse" cx={n4(E.x)} cy={n4(E.y)} r={n4(ORBIT_R)} fx={n4(E.x - 1)} fy={n4(E.y - 1.6)}>
          <stop offset="0.75" stopColor={mix(C.fishBody, C.fishCheek, 0.5)} />
          <stop offset="1" stopColor={C.fishDark} />
        </radialGradient>
        <linearGradient id={id.lip} gradientUnits="userSpaceOnUse" x1="-45.6" y1="0.1" x2="-45.3" y2="1.5">
          <stop offset="0" stopColor={mix(C.fishCheek, C.fishBelly, 0.25)} />
          <stop offset="1" stopColor={mix(C.fishLip, C.fishCheek, 0.4)} />
        </linearGradient>
        <clipPath id={id.clip}>
          <path d={BODY_PATH} />
        </clipPath>
        <linearGradient id={id.sad} gradientUnits="userSpaceOnUse" x1="0" y1="-12" x2="0" y2="3">
          <stop offset="0" stopColor={mix(C.fishSaddle, C.fishDark, 0.35)} stopOpacity={0.85} />
          <stop offset="0.55" stopColor={C.fishSaddle} stopOpacity={0.62} />
          <stop offset="1" stopColor={C.fishSaddle} stopOpacity={0.12} />
        </linearGradient>
        <linearGradient id={id.smg} gradientUnits="userSpaceOnUse" x1="-27" y1="-13" x2="-21" y2="13">
          <stop offset="0" stopColor="#000" />
          <stop offset="0.12" stopColor="#FFF" />
          <stop offset="0.75" stopColor="#888" />
          <stop offset="1" stopColor="#333" />
        </linearGradient>
        <mask id={id.sm} maskUnits="userSpaceOnUse" x="-28" y="-14" width="64" height="28">
          <rect x={-28} y={-14} width={64} height={28} fill={`url(#${id.smg})`} />
        </mask>
        <pattern id={id.scl} patternUnits="userSpaceOnUse" width={SCALE_W} height={SCALE_H} patternTransform="rotate(-6)">
          <path d={SCALE_D} fill="none" stroke={C.fishDark} strokeWidth={0.075} />
          <path d={SCALE_HI} fill="none" stroke={WARM} strokeWidth={0.06} opacity={0.5} />
        </pattern>
        <clipPath id={id.sc}>
          <rect x={-60} y={-30} width={92.85} height={60} />
        </clipPath>
      </defs>
      {/* the median fins, behind the body */}
      <FinArt f={f.caudal} />
      <FinArt f={f.d2} />
      <FinArt f={f.d1} />
      <FinArt f={f.anal} />
      {/* skin */}
      <path d={BODY_PATH} fill={`url(#${id.body})`} />
      <g clipPath={`url(#${id.clip})`}>
        <rect x={-28} y={-14} width={64} height={28} fill={`url(#${id.scl})`} opacity={0.24} mask={`url(#${id.sm})`} />
        <path d={SADDLE_D} fill={`url(#${id.sad})`} />
        <path d={BLOTCH_D} fill={C.fishSaddle} opacity={0.5} />
        <path d={SPECKLE_D} fill={C.fishDark} opacity={0.42} />
        <path d={HEAD_SPOTS_D} fill={C.fishDark} opacity={0.5} />
        <rect x={-60} y={-14} width={100} height={28} fill={`url(#${id.hi})`} />
        <rect x={-60} y={-14} width={100} height={28} fill={`url(#${id.lo})`} />
        <rect x={-60} y={-14} width={100} height={28} fill={`url(#${id.strk})`} />
        <circle cx={-41} cy={-6} r={12} fill={`url(#${id.head})`} />
        {/* rim light along the back (key light from above) and a bounce from the sand along the belly */}
        <path d={DORS_RIM_D} fill="none" stroke={WARM} strokeWidth={0.32} opacity={0.3} strokeLinecap="round" />
        <path d={VENT_RIM_D} fill="none" stroke={lit(C.sand, 0.4)} strokeWidth={0.4} opacity={0.32} strokeLinecap="round" />
        {/* wet-skin gloss: a soft streak along the upper flank, and on the snout */}
        <path d={GLOSS_D} fill="none" stroke={`url(#${id.gl})`} strokeWidth={0.9} strokeLinecap="round" />
        <path d={GLOSS2_D} fill="none" stroke={WARM} strokeWidth={0.55} strokeLinecap="round" opacity={0.3} />
        {/* lips: the closed mouth, lower jaw jutting a little */}
        <path d={LOWER_LIP_D} fill={`url(#${id.llip})`} />
        <path d={open(CLEFT.map((q) => add(q, pt(0.1, 0.34))))} fill="none" stroke={C.fishLip} strokeWidth={0.5} opacity={0.55} strokeLinecap="round" />
        <path d={UPPER_LIP_D} fill={`url(#${id.lip})`} />
        <path d={open(UPPER_LIP) + open(MAX_END)} fill="none" stroke={INK} strokeWidth={1.4} vectorEffect={NS} opacity={0.55} strokeLinecap="round" />
        <path d={open(LOWER_LIP.slice(1))} fill="none" stroke={INK} strokeWidth={1.2} vectorEffect={NS} opacity={0.3} strokeLinecap="round" />
        <path d={open(UPPER_LIP.slice(0, 5).map((q) => add(q, pt(0.1, 0.28))))} fill="none" stroke={lit(C.fishCheek, 0.45)} strokeWidth={1.8} vectorEffect={NS} opacity={0.4} strokeLinecap="round" />
      </g>
      {/* the cleft: one firm line, the mouth shut */}
      <path d={open(CLEFT) + `Q${-40.7} ${2.85} ${-40.5} ${3.2}`} fill="none" stroke={INK} strokeWidth={2.3} vectorEffect={NS} strokeLinecap="round" strokeLinejoin="round" />
      {/* nostrils */}
      <path d={circD(pt(-47.7, -3.35), 0.34)} fill={C.fishDark} stroke={INK} strokeWidth={1.1} vectorEffect={NS} opacity={0.9} />
      <path d={circD(pt(-45.5, -5.15), 0.22)} fill={C.fishDark} opacity={0.75} />
      {/* the eye: a bulging gold eye high on the head */}
      <circle cx={E.x} cy={E.y} r={ORBIT_R} fill={`url(#${id.orb})`} />
      <circle cx={E.x} cy={E.y} r={r} fill={`url(#${id.iris})`} />
      <path d={`M${n4(E.x - r * 0.96)} ${n4(E.y - r * 0.28)}A${r} ${r} 0 0 1 ${n4(E.x + r * 0.96)} ${n4(E.y - r * 0.28)}A${r * 1.25} ${r * 0.9} 0 0 0 ${n4(E.x - r * 0.96)} ${n4(E.y - r * 0.28)}Z`} fill={C.fishDark} opacity={0.38} />
      <circle cx={pup.x} cy={pup.y} r={r * 0.5} fill={C.pupil} />
      <circle cx={E.x} cy={E.y} r={r} fill="none" stroke={INK} strokeWidth={2.2} vectorEffect={NS} />
      <ellipse cx={E.x - 0.72} cy={E.y - 0.78} rx={0.62} ry={0.42} transform={`rotate(-32 ${E.x - 0.72} ${E.y - 0.78})`} fill="#FFFFFF" opacity={0.92} />
      <circle cx={pup.x + 0.62} cy={pup.y + 0.6} r={0.19} fill="#FFFFFF" opacity={0.6} />
      {/* silhouette ink (the peduncle end is left to the caudal fin) */}
      <g clipPath={`url(#${id.sc})`}>
        <path d={BODY_PATH} fill="none" stroke={INK} strokeWidth={INK_PX} vectorEffect={NS} strokeLinejoin="round" />
      </g>
      <path d={`M${n4(E.x - ORBIT_R * 0.75)} ${n4(E.y - ORBIT_R * 0.66)}A${ORBIT_R} ${ORBIT_R} 0 0 1 ${n4(E.x + ORBIT_R * 0.8)} ${n4(E.y - ORBIT_R * 0.6)}`} fill="none" stroke={INK} strokeWidth={1.4} vectorEffect={NS} opacity={0.5} />
      {/* the near pelvic fin, splayed on the bed */}
      <FinArt f={f.pelvic} />
    </g>
  );
};

/** the dark gill opening beneath the cover's free edge: a crescent that widens with `gill`, deepened at EXIT by `prop` */
export const GillGap: React.FC<{s: FishLook}> = ({s}) => {
  const G = opercGeom(s);
  const id = {clip: uid('ggClip'), grad: uid('ggGrad')};
  // red gill filaments seen through the slit: a dense feathery fringe on the cover's side of the opening
  let fil = '';
  for (let i = 1; i < EDGE_N - 1; i++) {
    const n = G.nrm[i];
    const len = (0.3 + 0.75 * G.w[i]) * (0.75 + 0.5 * hash(i * 3.7));
    const a = add(G.ec[i], mul(n, -0.3));
    const b = add(G.ec[i], mul(add(n, mul(pt(-n.y, n.x), 0.35 * (hash(i * 1.3) - 0.3))), len));
    fil += `M${n4(a.x)} ${n4(a.y)}L${n4(b.x)} ${n4(b.y)}`;
  }
  const mid = G.ec[Math.round(EDGE_N * 0.5)];
  const nm = G.nrm[Math.round(EDGE_N * 0.5)];
  return (
    <g>
      <defs>
        <clipPath id={id.clip}>
          <path d={poly(G.gap)} />
        </clipPath>
        <linearGradient id={id.grad} gradientUnits="userSpaceOnUse" x1={n4(mid.x - nm.x * 0.5)} y1={n4(mid.y - nm.y * 0.5)} x2={n4(mid.x + nm.x * 1.8)} y2={n4(mid.y + nm.y * 1.8)}>
          <stop offset="0" stopColor={mix(C.gillDark, '#000000', 0.45)} />
          <stop offset="0.6" stopColor={C.chamber} />
          <stop offset="1" stopColor={mix(C.chamber, C.gillRed, 0.25)} />
        </linearGradient>
      </defs>
      <path d={poly(G.gap)} fill={`url(#${id.grad})`} />
      <g clipPath={`url(#${id.clip})`}>
        <path d={fil} fill="none" stroke={mix(C.gillRed, C.gillDark, 0.25)} strokeWidth={0.36} strokeLinecap="round" opacity={0.75 * clamp(s.gill * 1.4 + 0.25)} />
        <path d={fil} fill="none" stroke={C.gillFilament} strokeWidth={0.09} strokeLinecap="round" opacity={0.55 * clamp(s.gill * 1.4)} />
        <path d={open(G.ec)} fill="none" stroke="#000000" strokeWidth={0.7} opacity={0.5} />
        <path d={open(G.eb)} fill="none" stroke="#000000" strokeWidth={0.35} opacity={0.35} />
      </g>
      {/* the body-side rim of the opening, lit, and its ink */}
      <path d={open(G.eb.slice(3, -3).map((q, i) => add(q, mul(G.nrm[i + 3], 0.14))))} fill="none" stroke={lit(C.fishCheek, 0.3)} strokeWidth={1.6} vectorEffect={NS} opacity={0.5} strokeLinecap="round" />
      <path d={open(G.eb)} fill="none" stroke={INK} strokeWidth={1.5} vectorEffect={NS} opacity={0.75} strokeLinecap="round" />
    </g>
  );
};

const offsetLine = (ps: P[], ns: P[], k: (i: number) => number) => ps.map((q, i) => add(q, mul(ns[i], k(i))));

/** the gill cover: a separate plate just behind the eye, its free rear edge a flap that flares with `gill` */
export const Operculum: React.FC<{s: FishLook; opacity?: number; mask?: string}> = ({s, opacity, mask}) => {
  const G = opercGeom(s);
  const g = clamp(s.gill, 0, 1.3);
  const id = {form: uid('opForm'), gl: uid('opGl'), plate: uid('opPlate'), sheen: uid('opSheen'), clip: uid('opClip'), behind: uid('opBehind'), blur: uid('opBlur'), lo: uid('opLo')};
  const plateD = poly(G.plate);
  const n = EDGE_N;
  const taper = (i: number) => Math.min(1, i / 6, (n - 1 - i) / 6);
  // the membrane margin: a pale band just inside the free edge
  const rimIn = offsetLine(G.ec, G.nrm, (i) => -0.62 * taper(i));
  const rimD = poly([...G.ec, ...[...rimIn].reverse()]);
  const ridge = offsetLine(G.ec, G.nrm, (i) => -0.95 * taper(i)).slice(2, -2);
  // the region behind the edge (where the cover's shadow falls)
  const behind = poly([...G.ec, pt(G.ec[n - 1].x + 2, 16), pt(-8, 16), pt(-8, -16), pt(G.ec[0].x + 2, -16)]);
  const shadowLine = G.ec.map((q, i) => add(q, mul(G.nrm[i], 0.18 + 0.25 * g * bumpS(i / (n - 1)))));
  // where the eel lifts the edge: the underside of the lifted lip shows as a thin dark band
  const lipK = (i: number) => G.notch[i];
  const lipOut = offsetLine(G.ec, G.nrm, (i) => 0.42 * Math.min(1, lipK(i) / 0.9));
  const lifted = s.prop > 0.02;
  const lipBand = lifted ? poly([...G.ec, ...[...lipOut].reverse()]) : '';
  const blots = [
    closed(blob(pt(-27.6, -8.4), 2.2, 2.4, 0.2, 41), 1), closed(blob(pt(-31.2, -4.6), 1.7, 1.25, -0.2, 42), 1),
    closed(blob(pt(-28.6, 2.6), 1.4, 1.05, 0.3, 43), 1), closed(blob(pt(-33.2, 4.8), 1.15, 0.9, 0.1, 44), 1),
    closed(blob(pt(-25.6, -2.2), 1.0, 0.8, 0.0, 45), 1),
  ].join('');
  let spk = '';
  for (let i = 0; i < 16; i++) {
    const q = pt(lerp(-35, -24.5, hash(i * 2.3 + 9)), lerp(-9.5, 7.5, hash(i * 4.1 + 3)));
    spk += circD(q, lerp(0.14, 0.3, hash(i * 7.7)));
  }
  return (
    <g opacity={opacity} mask={maskUrl(mask)}>
      <defs>
        <linearGradient id={id.plate} gradientUnits="userSpaceOnUse" x1="0" y1="-13" x2="0" y2="12.6">
          <stop offset="0" stopColor={lit(C.fishDark, 0.06)} />
          <stop offset="0.2" stopColor={lit(mix(C.fishDark, C.fishBody, 0.65), 0.06)} />
          <stop offset="0.46" stopColor={lit(mix(C.fishBody, C.fishCheek, 0.5), 0.07)} />
          <stop offset="0.66" stopColor={lit(mix(C.fishCheek, C.fishBelly, 0.42), 0.05)} />
          <stop offset="0.82" stopColor={C.fishBelly} />
          <stop offset="1" stopColor={mix(C.fishBelly, C.fishBody, 0.3)} />
        </linearGradient>
        <radialGradient id={id.sheen} gradientUnits="userSpaceOnUse" cx="-31.5" cy="-4" r="11" fx="-34" fy="-7.5">
          <stop offset="0" stopColor="#FFF7E6" stopOpacity={0.22 + 0.06 * g} />
          <stop offset="0.55" stopColor="#FFF7E6" stopOpacity={0.05} />
          <stop offset="1" stopColor={C.fishDark} stopOpacity={0.16} />
        </radialGradient>
        <linearGradient id={id.lo} gradientUnits="userSpaceOnUse" x1="0" y1="2" x2="0" y2="11">
          <stop offset="0" stopColor={C.fishDark} stopOpacity={0} />
          <stop offset="1" stopColor={C.fishDark} stopOpacity={0.3} />
        </linearGradient>
        <linearGradient id={id.form} gradientUnits="userSpaceOnUse" x1="-34" y1="-8" x2="-24" y2="7">
          <stop offset="0" stopColor={C.fishDark} stopOpacity={0} />
          <stop offset="0.55" stopColor={C.fishDark} stopOpacity={0.04} />
          <stop offset="1" stopColor={C.fishDark} stopOpacity={0.24} />
        </linearGradient>
        <linearGradient id={id.gl} gradientUnits="userSpaceOnUse" x1="-35" y1="0" x2="-26" y2="0">
          <stop offset="0" stopColor={WARM} stopOpacity={0} />
          <stop offset="0.4" stopColor={WARM} stopOpacity={0.26 + 0.1 * g} />
          <stop offset="1" stopColor={WARM} stopOpacity={0} />
        </linearGradient>
        <clipPath id={id.clip}>
          <path d={plateD} />
        </clipPath>
        <clipPath id={id.behind}>
          <path d={behind} />
        </clipPath>
        <filter id={id.blur} filterUnits="userSpaceOnUse" x="-34" y="-14" width="18" height="28">
          <feGaussianBlur stdDeviation={0.22 + 0.12 * g} />
        </filter>
      </defs>
      {/* the shadow the flap casts on the body (and into the opening) behind it */}
      <g clipPath={`url(#${id.behind})`}>
        <path d={open(shadowLine)} fill="none" stroke={mix(C.fishDark, '#000000', 0.5)} strokeWidth={0.45 + 0.55 * g + 0.5 * clamp(s.prop)} opacity={0.5} filter={`url(#${id.blur})`} />
      </g>
      {lifted && <path d={lipBand} fill={mix(C.fishLip, C.pharynx, 0.35)} />}
      {/* the plate */}
      <path d={plateD} fill={`url(#${id.plate})`} />
      <g clipPath={`url(#${id.clip})`}>
        <path d={blots} fill={C.fishSaddle} opacity={0.55} />
        <path d={spk} fill={C.fishDark} opacity={0.4} />
        <path d={plateD} fill={`url(#${id.sheen})`} />
        <rect x={-40} y={-12} width={20} height={24} fill={`url(#${id.lo})`} />
        <rect x={-40} y={-12} width={20} height={24} fill={`url(#${id.form})`} />
        <path d={rimD} fill={lit(C.fishCheek, 0.35)} opacity={0.42} />
        <path d={open(ridge)} fill="none" stroke={INK} strokeWidth={1.2} vectorEffect={NS} opacity={0.28} strokeLinecap="round" />
        <path d={open(G.ec.slice(4, Math.round(n * 0.42)).map((q, i) => add(q, mul(G.nrm[i + 4], -0.2))))} fill="none" stroke="#FFF7E6" strokeWidth={1.6} vectorEffect={NS} opacity={0.32} strokeLinecap="round" />
        <path d={open(PREOPERCLE.map((q) => add(q, pt(0.35, 0))))} fill="none" stroke="#FFF7E6" strokeWidth={1.5} vectorEffect={NS} opacity={0.22} strokeLinecap="round" />
        {/* a soft gloss across the convex plate (stronger as it turns toward the light when flared) */}
        <path d={open([pt(-34.8, -7.2), pt(-32.2, -8.9), pt(-29.0, -9.25), pt(-26.4, -8.0)].map((q) => add(q, pt(0.5 * g, 0))))} fill="none" stroke={`url(#${id.gl})`} strokeWidth={1.1} strokeLinecap="round" />
      </g>
      {/* ink: the preopercle groove in front, light borders above and below, the strong free edge behind */}
      <path d={open(PREOPERCLE)} fill="none" stroke={INK} strokeWidth={2} vectorEffect={NS} strokeLinecap="round" opacity={0.85} />
      <path d={open(PLATE_REST.slice(0, 26))} fill="none" stroke={INK} strokeWidth={1.3} vectorEffect={NS} opacity={0.4} strokeLinecap="round" />
      <path d={open(PLATE_REST.slice(PLATE_REST.length - 22))} fill="none" stroke={INK} strokeWidth={1.3} vectorEffect={NS} opacity={0.4} strokeLinecap="round" />
      {lifted && <path d={open(lipOut)} fill="none" stroke={INK} strokeWidth={1.4} vectorEffect={NS} opacity={0.6 * clamp(s.prop * 3)} />}
      <path d={open(G.ec)} fill="none" stroke={INK} strokeWidth={INK_PX} vectorEffect={NS} strokeLinecap="round" strokeLinejoin="round" />
    </g>
  );
};

/** the near pectoral fin: a big amber fan on the flank behind the lower half of the gill cover */
export const Pectoral: React.FC<{s: FishLook; opacity?: number; mask?: string}> = ({s, opacity, mask}) => {
  const f = finsFor(s).pectoral;
  const id = uid('pcBase');
  const [B0, B1] = PECTORAL.base;
  const bc = lerpP(B0, B1, 0.5);
  const ax = nrm(sub(B1, B0));
  const nx = pt(ax.y, -ax.x); // toward the fin (rearward)
  // an ellipse hugging the base, its front half sunk into the flank
  const lc = add(bc, mul(nx, 0.05));
  const lobeAt = (a: number) => add(lc, add(mul(ax, -Math.cos(a) * 2.6), mul(nx, Math.sin(a) * 0.7)));
  const lobe = closed(Array.from({length: 24}, (_, i) => lobeAt((i / 24) * 2 * Math.PI)), 1);
  const lobeEdge = open(Array.from({length: 13}, (_, i) => lobeAt(0.18 + (i / 12) * (Math.PI - 0.36))));
  return (
    <g opacity={opacity} mask={maskUrl(mask)}>
      <defs>
        <radialGradient id={id} gradientUnits="userSpaceOnUse" cx={n4(bc.x - 0.6)} cy={n4(bc.y - 1.6)} r="3.6">
          <stop offset="0" stopColor={mix(C.fishBody, C.fishBelly, 0.45)} />
          <stop offset="0.7" stopColor={mix(C.fishBody, C.fishBelly, 0.2)} />
          <stop offset="1" stopColor={mix(C.fishBody, C.fishDark, 0.25)} />
        </radialGradient>
      </defs>
      <FinArt f={f} />
      {/* the fleshy base lobe (flat side against the body; ink only where the fin leaves it) */}
      <path d={lobe} fill={`url(#${id})`} />
      <path d={lobeEdge} fill="none" stroke={INK} strokeWidth={1.5} vectorEffect={NS} strokeLinecap="round" opacity={0.8} />
    </g>
  );
};

/** the pupil centre for a given look (for the X-ray and other modules) */
export const pupilAt = (s: FishLook) => add(EYE.c, pt(0.62 * clamp(s.look, -1, 1), 0.08));
export {ORBIT_R, E0 as EDGE_REST};
