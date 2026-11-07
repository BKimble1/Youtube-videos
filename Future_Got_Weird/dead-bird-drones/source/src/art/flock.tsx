// FLOCK: living birds of the same generic look as the hero (same palette, the same body silhouette from rig.BODY plus
// the hero's tail-base volume, the hero's short fan tail with pale tips, the same wing outline), simplified for their
// smaller size on screen, flapping naturally. They are alive: varied wingbeat frequency, a downstroke slightly longer
// than the upstroke, wings that flex a little at the wrist on the upstroke (kept moderate so the projected wing never
// folds through itself; an edge-on wing is drawn as a thin round-ended blade), a small body bob, a gentle wobble in
// heading and bank, and an occasional glide. They do not react to the drone, do not scatter and carry no labels.
// Projected through the shot camera like everything else (true 3D size and parallax).
import React from 'react';
import {add3, Basis, bodyFrame, cross3, deg, depth, ellipsoid2, facing, Frame, mul3, norm3, P2, poly, proj, rad, rotZ, smoothClosed, smoothOpen, V2, V3, xf, xfv} from '../three';
import {BEAK, BODY, EYE, FEATHERS, HINGE, TAIL, WING_OUTLINE} from '../rig';
import {C, INK, INK_PX, LINE_PX, NS} from './palette';
import {clamp, lerp, noise1, ss} from '../lib';
import {mix} from '../core/color';
import {uid} from '../core/ids';
import {coc} from './world';

/** a living bird: position at t = 0, velocity (cm/s), size relative to the hero, wingbeat phase (turns) and frequency (Hz) */
export type LivingBird = {o: V3; v: V3; scale: number; phase: number; freq?: number};

const frac = (x: number) => x - Math.floor(x);
const cosE = (x: number) => 0.5 - 0.5 * Math.cos(Math.PI * clamp(x));
const fx = (n: number) => n.toFixed(1);

/** the wing's state at an instant: arm and hand elevation (deg), sweep back at the shoulder and at the wrist (deg), how
 *  folded the hand is (0..1), body bob (cm, hero units) and pitch (deg), and how much the bird is gliding (0..1) */
export type Beat = {arm: number; hand: number; armSweep: number; sweep: number; fold: number; bob: number; pitch: number; glide: number};
const DOWN = 0.54; // fraction of the cycle spent on the downstroke
export const wingbeat = (bird: LivingBird, t: number, seed: number): Beat => {
  const fq = bird.freq ?? 2.3;
  const p = frac(bird.phase + fq * t);
  let k: number, up: number, dn: number;
  if (p < DOWN) {
    k = cosE(p / DOWN);
    up = 0;
    dn = Math.sin((Math.PI * p) / DOWN);
  } else {
    const q = (p - DOWN) / (1 - DOWN);
    k = 1 - cosE(q);
    up = Math.sin(Math.PI * Math.pow(q, 0.8));
    dn = 0;
  }
  const arm = lerp(52, -34, k);
  // the hand lags (higher) through the downstroke and trails a little low, swept back and slightly folded, through the
  // upstroke (kept moderate so the projected wing never folds through itself)
  const hand = arm + 9 * dn - 12 * up;
  // an occasional glide (wings held out with a slight dihedral), gated by slow noise so each bird has its own rhythm
  const g = ss(noise1(t * 0.3 + seed * 3.7, seed * 1.3 + 7), 0.34, 0.66);
  return {
    arm: lerp(arm, 7, g),
    hand: lerp(hand, 2, g),
    armSweep: lerp(4 + 3 * up, 3, g),
    sweep: lerp(6 + 7 * up, 9, g),
    fold: lerp(up, 0.1, g),
    bob: (1 - g) * -0.9 * Math.cos(2 * Math.PI * p),
    pitch: (1 - g) * 2.2 * Math.sin(2 * Math.PI * (p - 0.1)),
    glide: g,
  };
};
/** where the bird is at t and how its body is oriented (heading along its velocity, gentle wobble) */
export const livingFrame = (bird: LivingBird, t: number, seed: number, bt: Beat): Frame => {
  const pos = add3(bird.o, mul3(bird.v, t));
  const yaw = deg(Math.atan2(-bird.v[2], bird.v[0])) + 3 * noise1(t * 0.4 + seed, seed + 2);
  const pitch = deg(Math.atan2(bird.v[1], Math.hypot(bird.v[0], bird.v[2]))) + bt.pitch + 1.5 * noise1(t * 0.35 + seed * 2.1, seed + 4);
  const bank = 4.5 * noise1(t * 0.5 + seed * 1.7, seed + 3);
  return bodyFrame(add3(pos, [0, bt.bob * bird.scale, 0]), yaw, pitch, bank);
};

// ------------------------------------------------------------------ the wing, mapped through shoulder and wrist
const AW = 19.5; // the wrist: cm out along the span from the hinge (hero units)
type WingMap = {pt: (a: number, b: number) => V3; top: V3; mid: V3};
const wingMap = (F: Frame, S: number, side: 1 | -1, bt: Beat): WingMap => {
  const X: V3 = [-1, 0, 0];
  const span0 = (d: number): V3 => [0, Math.sin(rad(d)), side * Math.cos(rad(d))];
  const rot = (s0: V3, d: number) => ({s: add3(mul3(s0, Math.cos(rad(d))), mul3(X, Math.sin(rad(d)))), c: add3(mul3(X, Math.cos(rad(d))), mul3(s0, -Math.sin(rad(d))))});
  const A = rot(span0(bt.arm), bt.armSweep);
  const Hd = rot(span0(bt.hand), bt.sweep);
  const hinge = side > 0 ? HINGE.near : HINGE.far;
  const wrist = add3(hinge, mul3(A.s, AW));
  const pt = (a: number, b: number): V3 => {
    const w = ss(a, AW - 5, AW + 3);
    const bb = b * (1 - 0.12 * bt.fold * w);
    const base = a <= AW ? add3(hinge, mul3(A.s, a)) : add3(wrist, mul3(Hd.s, a - AW));
    const chord = norm3(add3(mul3(A.c, 1 - w), mul3(Hd.c, w)));
    return xf(F, mul3(add3(base, mul3(chord, bb)), S));
  };
  const topL = side > 0 ? cross3(A.c, A.s) : cross3(A.s, A.c);
  return {pt, top: xfv(F, topL), mid: pt(16, 5)};
};
/** wing regions in (a = span from the hinge, b = back along the chord), hero units */
const ROOT_L: [number, number] = [2.6, -1.2], ROOT_T: [number, number] = [2.6, 8.8];
const OUTLINE: [number, number][] = [ROOT_L, ...WING_OUTLINE, ROOT_T];
const COVERTS: [number, number][] = [ROOT_L, [5.4, -1.9], [9, -2.5], [13, -2.75], [17, -2.6], [19.6, -2.2], [23, -1.4], [26.6, -0.1], [26.2, 1.9], [23.2, 3.4], [20.2, 5.3], [16, 6.0], [12, 6.0], [8, 5.8], [5.4, 5.5], [2.6, 5.1]];
const LESSER: [number, number][] = [ROOT_L, [5.4, -1.9], [9, -2.5], [13, -2.75], [17, -2.6], [19.6, -2.2], [22.6, -1.5], [22.2, 0.5], [18, 1.3], [13, 1.6], [8.5, 1.5], [5.4, 1.3], [2.6, 1.0]];
const TRAIL: [number, number][] = WING_OUTLINE.slice(10).map(([a, b]) => [a, b - 0.75]);
const FLIGHT_LINES = FEATHERS.filter((f) => f.kind === 'primary' || f.kind === 'secondary');
/** signed area of a polygon (shoelace) */
const area2 = (p: V2[]) => {
  let s = 0;
  for (let i = 0, n = p.length; i < n; i++) {
    const a = p[i], b = p[(i + 1) % n];
    s += a.x * b.y - b.x * a.y;
  }
  return s / 2;
};
/** the wing's own area (hero cm^2): the projected area of a wing seen face-on at s px/cm is A_WING s^2 */
const A_WING = Math.abs(area2(OUTLINE.map(([a, b]) => ({x: a, y: b}))));
/** does a closed polygon cross itself? (any two non-adjacent edges intersect) */
const selfCrossing = (p: V2[]) => {
  const n = p.length;
  const cr = (o: V2, a: V2, b: V2) => (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
  for (let i = 0; i < n; i++) {
    const a = p[i], b = p[(i + 1) % n];
    for (let j = i + 2; j < n; j++) {
      if (i === 0 && j === n - 1) continue;
      const c = p[j], d = p[(j + 1) % n];
      const d1 = cr(a, b, c), d2 = cr(a, b, d), d3 = cr(c, d, a), d4 = cr(c, d, b);
      if (d1 * d2 < 0 && d3 * d4 < 0) return true;
    }
  }
  return false;
};

const LivingWing: React.FC<{B: Basis; M: WingMap; w: number; col: (c: string) => string; lod: number; sPx: number; far?: boolean}> = ({B, M, w, col, lod, sPx, far}) => {
  const P = (ab: [number, number]) => {
    const q = proj(B, M.pt(ab[0], ab[1]));
    return {x: q.x, y: q.y};
  };
  const out = OUTLINE.map(P);
  const dorsal = facing(B, M.mid, M.top) > 0;
  // nearly edge-on (projected area under 20% of the wing's own) or folded through itself in projection: draw the
  // wing as what it then looks like, a thin inked round-ended blade, not a broken filled outline with needles
  const ratio = Math.abs(area2(out)) / (A_WING * sPx * sPx);
  const crossed = selfCrossing(out);
  if (ratio < 0.2 || crossed) {
    // the wing's silhouette collapsed toward a line: its convex outline, thickened by the wing's own depth (about
    // 1 cm) with round ends, so it reads as a wing seen edge-on (a tapered, round-ended stroke), never a needle or a
    // broken shard. The ink skips the root edges, so the wing still grows out of the body without a seam.
    const hp = hull2(out);
    const isRoot = (p: V2) => p === out[0] || p === out[out.length - 1];
    const r = Math.max(0.8, 0.5 * sPx);
    let k = hp.findIndex(isRoot);
    let open: V2[] = hp;
    if (k >= 0) {
      while (isRoot(hp[(k + 1) % hp.length]) && k < 2 * hp.length) k++;
      const rot = [...hp.slice((k + 1) % hp.length), ...hp.slice(0, (k + 1) % hp.length)];
      open = rot.filter((p) => !isRoot(p));
    }
    const closedD = poly(hp);
    const openD = far || k < 0 ? closedD : poly(open, false);
    const fill = col(dorsal ? C.plumage : C.underwing);
    return (
      <g strokeLinejoin="round" strokeLinecap="round">
        <path d={openD} fill="none" stroke={col(INK)} strokeWidth={2 * r + 2 * w} />
        <path d={closedD} fill={fill} stroke={fill} strokeWidth={2 * r} />
      </g>
    );
  }
  const lines = lod > 1 ? FLIGHT_LINES.filter((_, i) => lod > 2.6 || i % 2 === 0).map((f) => `M${P2(P(f.base))} L${P2(P(f.tip))}`).join(' ') : '';
  return (
    <g>
      <path d={smoothClosed(out)} fill={col(dorsal ? C.flight : mix(C.underwingDeep, C.underwing, 0.25))} />
      <path d={smoothClosed(COVERTS.map(P))} fill={col(dorsal ? C.plumage : C.underwing)} />
      {dorsal && lod > 1 && <path d={smoothClosed(LESSER.map(P))} fill={col(C.plumageLit)} opacity={0.75} />}
      {lod > 1 && <path d={lines} stroke={col(dorsal ? C.plumageBar : C.underwingDeep)} strokeWidth={LINE_PX * 0.8} opacity={0.55} vectorEffect={NS} />}
      {dorsal && lod > 1 && <path d={smoothOpen(TRAIL.map(P))} fill="none" stroke={col(C.flightEdge)} strokeWidth={Math.max(1, w * 0.9)} strokeLinecap="round" opacity={0.85} />}
      <path d={smoothOpen(out.slice(1, -1))} fill="none" stroke={col(INK)} strokeWidth={w} strokeLinejoin="round" strokeLinecap="round" vectorEffect={NS} />
    </g>
  );
};

// ------------------------------------------------------------------ the body
const ellFrame = (F: Frame, c: V3, tilt: number, S: number): Frame => ({
  o: xf(F, mul3(c, S)),
  ex: xfv(F, rotZ([1, 0, 0], tilt)),
  ey: xfv(F, rotZ([0, 1, 0], tilt)),
  ez: F.ez,
});
/** half-width of the body (z) at body-local (x, y), from the chest, rear and tail-base volumes */
const halfW = (x: number, y: number) => {
  const a = 1 - ((x - 2) / 10.5) ** 2 - (y / 7) ** 2;
  const b = 1 - ((x + 7.5) / 8.5) ** 2 - ((y - 0.7) / 5.3) ** 2;
  const n = 1 - ((x - 10.2) / 4.8) ** 2 - ((y - 4) / 4.5) ** 2;
  const tb = 1 - ((x + 15.6) / 5.0) ** 2 - ((y - 1.75) / 2.2) ** 2;
  return Math.max(7.2 * Math.sqrt(Math.max(0, a)), 5.6 * Math.sqrt(Math.max(0, b)), 4.1 * Math.sqrt(Math.max(0, n)), 3.1 * Math.sqrt(Math.max(0, tb)), 1.2);
};
/** the flank line between the brown back and the cream breast, from beyond the tail base (so the back's end edge falls
 *  outside the body and the rump is brown on top, as on the hero) to the chin */
const EQUATOR: [number, number][] = [[-22, 1.6], [-19, 1.2], [-16, 0.9], [-12, -0.2], [-7, -1.4], [-1, -2.0], [4.5, -1.6], [8.4, -0.1], [11, 2.1], [13.3, 4.0], [15.6, 5.1], [18.5, 5.6]];
/** the hero's tail-base volume (bird.tsx TAILBASE, copied): it tapers the rear into the tail and carries the tail
 *  coverts, so only the outer part of the fan shows, as on the hero */
const TAILBASE = {c: [-15.6, 1.75, 0] as V3, r: [5.0, 2.2, 3.1] as V3, tilt: 11};
/** the hero's tail fan (bird.tsx TAIL_FEATHERS): 12 feathers from x = -14.4 to the tip line (outer ones 1.3 cm
 *  shorter), arched (outer tips 2 cm lower), each 1.9 cm wide. u in [-1, 1] across the fan, s in [0, 1] root to tip */
const TAIL_ARCH = 2.0;
const fanPt = (u: number, s: number, spread: number, dy = 0): V3 => {
  const lift = rad(TAIL.lift);
  const yAt = (x: number) => TAIL.root[1] + (TAIL.root[0] - x) * Math.tan(lift);
  const uu = clamp(Math.abs(u), 0, 1);
  const xt = TAIL.tipX + 1.3 * uu * uu, xb = -14.4;
  const tip: V3 = [xt, yAt(xt) - TAIL_ARCH * uu * uu, u * spread];
  const base: V3 = [xb, yAt(xb), u * spread * 0.2];
  return [base[0] + (tip[0] - base[0]) * s, base[1] + (tip[1] - base[1]) * s + dy, base[2] + (tip[2] - base[2]) * s];
};
/** one tail feather's outline (u = its shaft across the fan, -1..1), hero profile: narrower at the root, a rounded tip
 *  from s = 0.84; hw = half width (cm); s0..s1 = the stretch of the feather (0.9..1 = its pale tip) */
const featherPts = (u: number, sp: number, hw: number, s0 = 0.36, s1 = 1): V3[] => {
  const SS = [0, 0.3, 0.6, 0.84, 0.92, 0.97, 1].map((k) => s0 + (s1 - s0) * k);
  const half = (s: number) => hw * (0.55 + 0.45 * clamp(s / 0.3)) * (s > 0.84 ? Math.sqrt(Math.max(0, 1 - ((s - 0.84) / 0.16) ** 2)) : 1);
  const at = (s: number, side: number): V3 => {
    const c = fanPt(u, s, sp);
    // across the feather: along z, and following the arch's slope so neighbours stay overlapped when seen edge-on
    const dz = side * half(s);
    return [c[0], c[1] - TAIL_ARCH * 2 * u * (dz / sp) * s, c[2] + dz];
  };
  const pts: V3[] = SS.map((s) => at(s, 1));
  for (let i = SS.length - 2; i >= 0; i--) pts.push(at(SS[i], -1));
  return pts;
};

/** the haze distant living birds fade toward when the shot passes none: a neutral pale that sits between the meadow's
 *  cool morning haze and the sky shot's warm late haze (pass MEADOW.haze or SKY.haze for an exact match) */
export const FLOCK_HAZE = '#E9E6DA';
export const LivingBirdView: React.FC<{B: Basis; t: number; bird: LivingBird; seed?: number; haze?: string}> = ({B, t, bird, seed = 1, haze = FLOCK_HAZE}) => {
  const bt = wingbeat(bird, t, seed);
  const F = livingFrame(bird, t, seed, bt);
  const S = bird.scale;
  const c0 = proj(B, F.o);
  if (c0.z < 15) return null;
  const sPx = c0.s * S; // screen px per hero-cm
  if (sPx * 50 < 6) return null;
  const R0 = 42 * sPx; // a generous bound of the bird with its wings
  if (c0.x + R0 < -60 || c0.x - R0 > 1140 || c0.y + R0 < -60 || c0.y - R0 > 1980) return null;
  const lod = sPx; // > 1: feather lines, > 1.5: eye and cheek
  const w = clamp(sPx * 0.42, 0.8, INK_PX);
  const d = c0.z;
  const tone = clamp((d - 1600) / 10000, 0, 0.42);
  const col = (c: string) => (tone > 0.005 ? mix(c, haze, tone) : c);
  const L = (p: V3) => xf(F, mul3(p, S));
  const Pp = (p: V3) => {
    const q = proj(B, L(p));
    return {x: q.x, y: q.y};
  };
  const n = sPx > 4 ? 40 : sPx > 1.5 ? 28 : 18;
  const ellE = (e: {c: V3; r: V3; tilt?: number}, m = n) => ellipsoid2(B, ellFrame(F, e.c, e.tilt ?? 0, S), [0, 0, 0], mul3(e.r, S), m);
  const ellP = (k: keyof typeof BODY) => ellE(BODY[k]);
  // one smooth body as on the hero: the chest, rear and tail base merged (convex), the neck and head merged
  const torso = smoothClosed(hull2([...ellP('chest'), ...ellP('rear'), ...ellE(TAILBASE, Math.max(14, n - 12))]));
  const neckHead = smoothClosed(hull2([...ellP('neck'), ...ellP('head')]));
  const head = smoothClosed(ellP('head'));
  // tail: the hero's fan (a little wider in a glide), drawn as the hero draws it but with fewer, wider feathers: outer
  // feathers first when seen from above (centre ones overlap them), each with its pale tip; only the outer part of the
  // fan shows beyond the tail base
  const sp = TAIL.spread * (1 + 0.22 * bt.glide);
  const tailN = lod > 3.5 ? 7 : 5;
  const tailDorsal = facing(B, L(fanPt(0, 0.7, sp)), xfv(F, [Math.sin(rad(TAIL.lift)), Math.cos(rad(TAIL.lift)), 0])) >= 0;
  const tailHW = ((2 * sp) / (tailN - 1)) * 0.62 + 0.15;
  const tailF = Array.from({length: tailN}, (_, k) => -1 + (2 * k) / (tailN - 1))
    .sort((a, b) => (tailDorsal ? Math.abs(b) - Math.abs(a) : Math.abs(a) - Math.abs(b)))
    .map((u) => ({u, out: poly(featherPts(u, sp, tailHW).map(Pp)), tip: poly(featherPts(u, sp, tailHW, 0.9, 1).map(Pp))}));
  const tail = tailF.map((f) => f.out).join(' ');
  const tailBase = tailDorsal ? C.tail : mix(C.underwingDeep, C.underwing, 0.3);
  const tailTip = tailDorsal ? C.flightEdge : mix(C.underwing, '#FFFFFF', 0.2);
  const featherLine = clamp((lod - 1.4) / 2.5, 0, 1);
  // beak: a cone from the base ellipse to the tip
  const beakPts: V2[] = [Pp(BEAK.tip)];
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2;
    beakPts.push(Pp([BEAK.base[0], BEAK.base[1] + BEAK.hh * Math.sin(a), BEAK.hw * Math.cos(a)]));
  }
  const beak = poly(hull2(beakPts));
  // the side of the body facing the camera, for the flank line, cheek and eye
  const side: 1 | -1 = facing(B, L([2, 0, 0]), F.ez) >= 0 ? 1 : -1;
  const eq = EQUATOR.map(([x, y]) => Pp([x, y, side * halfW(x, y) * 0.97]));
  const eqTop = EQUATOR.map(([x, y]) => Pp([x, y + 22, 0])).reverse();
  // the flank edge is a smooth curve (no kinks at any size); the rest of the back shape lies outside the body clip
  const back = `${smoothOpen(eq)} ${eqTop.map((p) => `L${P2(p)}`).join(' ')} Z`;
  const up = Pp([2, 9, 0]), dn = Pp([2, -8, 0]);
  const eyeP: V3 = side > 0 ? EYE.near : EYE.far;
  const eyeN: V3 = side > 0 ? EYE.nNear : EYE.nFar;
  const eyeVis = lod > 1.5 && facing(B, L(eyeP), xfv(F, eyeN)) > 0.12;
  const eye = proj(B, L(eyeP));
  const cheek = Pp([15.3, 6.7, side * 3.0]);
  // wings, far one first
  const Mn = wingMap(F, S, 1, bt), Mf = wingMap(F, S, -1, bt);
  const [far, near] = depth(B, Mn.mid) > depth(B, Mf.mid) ? [Mn, Mf] : [Mf, Mn];
  const ids = {clip: uid('lbc'), back: uid('lbb'), belly: uid('lbv'), blur: uid('lbf')};
  const r = 40 * sPx;
  const blur = coc(B, d, 0.45) / 2;
  const body = (
    <g>
      <defs>
        <clipPath id={ids.clip}>
          <path d={torso} />
          <path d={neckHead} />
        </clipPath>
        <linearGradient id={ids.back} gradientUnits="userSpaceOnUse" x1={up.x - 0.3 * r} y1={up.y - 0.1 * r} x2={dn.x} y2={dn.y}>
          <stop offset={0} stopColor={col(C.plumageLit)} />
          <stop offset={0.35} stopColor={col(C.plumage)} />
          <stop offset={1} stopColor={col(C.plumageDeep)} />
        </linearGradient>
        <linearGradient id={ids.belly} gradientUnits="userSpaceOnUse" x1={up.x} y1={up.y} x2={dn.x} y2={dn.y}>
          <stop offset={0.3} stopColor={col(C.breastLit)} />
          <stop offset={0.7} stopColor={col(C.breast)} />
          <stop offset={1} stopColor={col(C.breastDeep)} />
        </linearGradient>
      </defs>
      {/* the merged outer contour (one silhouette for body, head, tail and beak) */}
      <g fill={col(INK)} stroke={col(INK)} strokeWidth={2 * w} strokeLinejoin="round" vectorEffect={NS}>
        <path d={tail} vectorEffect={NS} />
        <path d={torso} vectorEffect={NS} />
        <path d={neckHead} vectorEffect={NS} />
        <path d={beak} vectorEffect={NS} />
      </g>
      {tailF.map((f) => (
        <React.Fragment key={f.u}>
          <path d={f.out} fill={col(Math.abs(f.u) < 0.2 ? mix(tailBase, C.plumageLit, 0.3) : mix(tailBase, C.plumage, 0.3 - 0.2 * Math.abs(f.u)))}
            stroke={col(INK)} strokeWidth={LINE_PX} strokeOpacity={0.55 * featherLine} strokeLinejoin="round" vectorEffect={NS} />
          <path d={f.tip} fill={col(tailTip)} opacity={0.9} />
        </React.Fragment>
      ))}
      <g fill={`url(#${ids.belly})`}>
        <path d={torso} />
        <path d={neckHead} />
      </g>
      <path d={back} fill={`url(#${ids.back})`} clipPath={`url(#${ids.clip})`} />
      <path d={head} fill={col(C.head)} />
      {lod > 1.5 && <ellipse cx={cheek.x} cy={cheek.y} rx={1.45 * sPx} ry={1.15 * sPx} fill={col(C.cheek)} opacity={0.9} clipPath={`url(#${ids.clip})`} />}
      <path d={beak} fill={col(C.beak)} />
      {lod > 1.5 && <path d={`M${P2(Pp([BEAK.base[0], BEAK.base[1] + BEAK.hh * 0.85, 0]))} L${P2(Pp(BEAK.tip))}`} stroke={col(C.beakLit)} strokeWidth={Math.max(1, 0.25 * sPx)} strokeLinecap="round" />}
      {eyeVis && (
        <g>
          <circle cx={eye.x} cy={eye.y} r={0.78 * sPx} fill={col(C.eyeRing)} opacity={0.8} />
          <circle cx={eye.x} cy={eye.y} r={0.62 * sPx} fill={col(C.eyeGlass)} />
          <circle cx={eye.x - 0.2 * sPx} cy={eye.y - 0.22 * sPx} r={Math.max(0.6, 0.17 * sPx)} fill="#FFFFFF" opacity={0.9} />
        </g>
      )}
    </g>
  );
  const content = (
    <g>
      <LivingWing B={B} M={far} w={w} col={col} lod={lod} sPx={sPx} far />
      {body}
      <LivingWing B={B} M={near} w={w} col={col} lod={lod} sPx={sPx} />
    </g>
  );
  if (blur < 0.4) return content;
  const sd = Math.round(blur * 4) / 4;
  return (
    <g>
      <defs>
        <filter id={ids.blur} filterUnits="userSpaceOnUse" x={fx(c0.x - r - 4 * sd)} y={fx(c0.y - r - 4 * sd)} width={fx(2 * r + 8 * sd)} height={fx(2 * r + 8 * sd)}>
          <feGaussianBlur stdDeviation={sd} />
        </filter>
      </defs>
      <g filter={`url(#${ids.blur})`}>{content}</g>
    </g>
  );
};
const hull2 = (pts: V2[]): V2[] => {
  const p = [...pts].sort((a, b) => a.x - b.x || a.y - b.y);
  if (p.length < 3) return p;
  const cr = (o: V2, a: V2, b: V2) => (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
  const lo: V2[] = [], hi: V2[] = [];
  for (const q of p) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop(); lo.push(q); }
  for (let i = p.length - 1; i >= 0; i--) { const q = p[i]; while (hi.length >= 2 && cr(hi[hi.length - 2], hi[hi.length - 1], q) <= 0) hi.pop(); hi.push(q); }
  return lo.slice(0, -1).concat(hi.slice(0, -1));
};

/** living birds, drawn far to near. haze: the colour distant birds fade toward (pass the shot's haze, e.g. MEADOW.haze
 *  or SKY.haze from world.tsx; default FLOCK_HAZE, a neutral pale between the two) */
export const Flock: React.FC<{B: Basis; t: number; birds: LivingBird[]; haze?: string}> = ({B, t, birds, haze}) => {
  const items = birds
    .map((b, i) => ({b, i, d: depth(B, add3(b.o, mul3(b.v, t)))}))
    .filter((x) => x.d > 20)
    .sort((a, b) => b.d - a.d);
  return (
    <g>
      {items.map(({b, i}) => (
        <LivingBirdView key={i} B={B} t={t} bird={b} seed={i * 7.31 + b.phase * 13.7 + 1} haze={haze} />
      ))}
    </g>
  );
};

/** suggested flocks framed for the story's cameras (checked in src/test/world.entry.tsx, WorldStory): positions are
 *  relative to the drone's x at the shot's start (shift them with offsetFlock; the meadow drone starts at x = 0, the sky
 *  drone at V_FLY * (SKY_T0 - DUR)). Spread in depth from 15 to 52 m beyond the drone, they hold the frame's upper half
 *  over the treeline and sky through the whole shot, drifting gently ahead (speeds solved against the camera moves). */
export const FLOCK_MEADOW: LivingBird[] = [
  {o: [-247, 1, -1600], v: [183, -8, 0], scale: 1, phase: 0.1, freq: 2.3},
  {o: [-242, -32, -2300], v: [173, -8, 0], scale: 1, phase: 0.55, freq: 2.1},
  {o: [-245, -13, -3000], v: [162, -10, 0], scale: 1, phase: 0.3, freq: 2.5},
  {o: [-469, -99, -3800], v: [154, -8, 0], scale: 1, phase: 0.8, freq: 2.2},
  {o: [-462, -178, -5200], v: [133, -8, 0], scale: 1, phase: 0.42, freq: 2.4},
];
export const FLOCK_SKY: LivingBird[] = [
  {o: [-397, -76, -1500], v: [197, -14, 0], scale: 1, phase: 0.2, freq: 2.2},
  {o: [-487, -117, -2200], v: [191, -18, 0], scale: 1, phase: 0.65, freq: 2.4},
  {o: [-559, -205, -3000], v: [183, -14, 0], scale: 1, phase: 0.4, freq: 2.1},
  {o: [-903, -341, -3800], v: [184, -14, 0], scale: 1, phase: 0.9, freq: 2.5},
  {o: [-1034, -453, -5200], v: [170, -14, 0], scale: 1, phase: 0.15, freq: 2.3},
];
/** shift a flock along x (e.g. by the drone's x at the shot's start) */
export const offsetFlock = (birds: LivingBird[], dx: number): LivingBird[] => birds.map((b) => ({...b, o: [b.o[0] + dx, b.o[1], b.o[2]]}));
