// Wyatt: a side-view kid in the Weird Crew construction (dc/ rig primitives: two-pass ink contours, cylinder-shaded
// limbs from the fixed upper-left key light, the crew Head, five-digit Hands). He always faces screen-LEFT, so his
// RIGHT side is nearest the camera; the RIGHT leg is the rotationplasty leg in every shot of the film.
//
// The rotationplasty leg (anatomy that never changes): hip -> thigh -> the ankle joint at the height of his other
// knee. His own foot, turned to face backward, sits in the prosthetic socket as the "shin": heel forward (where a
// kneecap would be), sole facing forward, toes down and behind. At a straight "knee" the foot is plantarflexed
// (pointed), 35 degrees off the shank axis; bending the "knee" is the foot dorsiflexing, so the socket, pylon and the
// forward-facing cleat swing back exactly like a shin. The near wall of the socket can be cut away to show the foot.
//
// World units are centimetres, y down, ground at y = 0.
import React from 'react';
import {Deco, INK, Inked, InkLine, InkPath, useInk} from '../dc/ink';
import {Blob, Capsule, Lin, SoftShadow} from '../dc/shade';
import {Limb} from '../dc/limb';
import {Expr, Head} from '../dc/Head';
import {Hand, HandPose, HAND_RELAXED} from '../dc/Hand';
import {lit, mix, shade} from '../dc/color';
import {add, fmt, len, mul, norm, P, perp, sub, V} from '../dc/math';
import {closed} from '../core/geo';
import {C} from './pal';

const rad = (d: number) => (d * Math.PI) / 180;
/** direction at angle a from straight DOWN, + = toward his front (screen-left) */
export const dirA = (a: number): V => ({x: -Math.sin(rad(a)), y: Math.cos(rad(a))});
/** direction at angle a from straight UP, + = leaning toward his front */
export const upA = (a: number): V => ({x: -Math.sin(rad(a)), y: -Math.cos(rad(a))});
const angOf = (d: V) => (Math.atan2(d.y, d.x) * 180) / Math.PI;

export const DIMW = {thigh: 35, shin: 31, ankH: 7.7, torso: 36, neck: 4.5, headR: 11.4, upper: 20.5, fore: 18.5, hand: 11, footOff: 35};

export type Leg = {hip: number; knee: number; ank: number};
export type Arm = {sh: number; el: number};
export type WPose = {
  /** near (right) hip joint */
  x: number;
  y: number;
  /** torso lean from vertical, + = toward his front */
  lean: number;
  near: Leg;
  far: Leg;
  /** far hip offset toward his back (screen +x) in cm: the "slightly staggered" view */
  stagger: number;
  /** far hip raised (cm): a lens slightly above sees the far side a little higher */
  staggerY?: number;
  aN: Arm;
  aF: Arm;
  neck: number;
  turn: number;
  expr: Expr;
  blink: number;
  /** the biological foot's extra plantarflexion relative to the socket's seat (deg): only before the socket is fitted */
  bf?: number;
};

// --------------------------------------------------------------------------------------------------------- frames
/** a foot frame: origin at the ankle pivot, u toward the toes at angle fa (from down), v toward the sole. h = +1 for
 *  a normal foot, -1 for the turned-around foot (its side view is mirrored) */
export const footPt = (A: V, fa: number, h: 1 | -1, u: number, v: number): V => add(A, add(mul(dirA(fa), u), mul(dirA(fa - 90 * h), v)));
/** a shank frame: origin at the joint, d down the shank (angle sa), f toward his front */
export const shankPt = (A: V, sa: number, f: number, d: number): V => add(A, add(mul(dirA(sa), d), mul(dirA(sa + 90), f)));

/** his own foot, side profile (u from the ankle pivot toward the toes, v toward the sole). Seen from the inside (the
 *  big toe and the arch) once it has been turned around. */
export const FOOT: [number, number][] = [
  [2.2, -3.1], [6.4, -0.8], [10.8, 1.4], [13.6, 2.3], [15.8, 2.9], [17.0, 4.2], [16.4, 5.6], [14.2, 6.1], [12.2, 6.3],
  [8.8, 5.5], [4.6, 5.0], [0.6, 5.6], [-2.4, 6.3], [-4.6, 6.3], [-6.3, 4.8], [-6.6, 1.8], [-5.2, -1.4], [-3.4, -3.6],
];
/** the cleat, lateral side (same frame as FOOT, normal foot) */
export const CLEAT: [number, number][] = [
  [-4.4, -3.7], [2.8, -3.5], [5.6, -1.7], [9.6, 0.3], [13.6, 1.9], [16.4, 3.1], [17.7, 4.5], [17.3, 5.9], [15.6, 6.7],
  [6, 6.8], [-4, 6.8], [-6.7, 6.1], [-7.2, 3.6], [-6.7, 0.4], [-5.7, -2.2],
];
export const STUDS = [14.3, 10.1, 4.6, -2.6, -5.6];
/** the bio foot's seat in the socket: angle off the shank axis, toward his back */
export const SEAT = 35;

// ------------------------------------------------------------------------------------------------- socket geometry
const hull = (ps: V[]): V[] => {
  const s = [...ps].sort((a, b) => a.x - b.x || a.y - b.y);
  const cr = (o: V, a: V, b: V) => (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
  const lo: V[] = [], hi: V[] = [];
  for (const p of s) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop(); lo.push(p); }
  for (const p of [...s].reverse()) { while (hi.length >= 2 && cr(hi[hi.length - 2], hi[hi.length - 1], p) <= 0) hi.pop(); hi.push(p); }
  return [...lo.slice(0, -1), ...hi.slice(0, -1)];
};
const offsetPoly = (ps: V[], d: number): V[] => {
  const n = ps.length;
  // outward normals: the polygon from hull() is counter-clockwise in a y-down frame when viewed... compute by centroid
  const cx = ps.reduce((s, p) => s + p.x, 0) / n, cy = ps.reduce((s, p) => s + p.y, 0) / n;
  return ps.map((p, i) => {
    const a = ps[(i - 1 + n) % n], b = ps[(i + 1) % n];
    let nn = norm(perp(sub(b, a)));
    if ((p.x - cx) * nn.x + (p.y - cy) * nn.y < 0) nn = mul(nn, -1);
    return add(p, mul(nn, d));
  });
};
/** clip a polygon to the side of line (a -> b) where cross > 0 */
const clipHalf = (ps: V[], a: V, b: V): V[] => {
  const side = (p: V) => (b.x - a.x) * (p.y - a.y) - (b.y - a.y) * (p.x - a.x);
  const out: V[] = [];
  for (let i = 0; i < ps.length; i++) {
    const p = ps[i], q = ps[(i + 1) % ps.length];
    const sp = side(p), sq = side(q);
    if (sp >= 0) out.push(p);
    if (sp * sq < 0) out.push(add(p, mul(sub(q, p), sp / (sp - sq))));
  }
  return out;
};
// everything in shank-local (f, d) as plain x = f, y = d points
const footLocal = (seatOff = 0): V[] => FOOT.map(([u, v]) => {
  const w = footPt({x: 0, y: 0}, -SEAT - seatOff, -1, u, v);
  return {x: -w.x, y: w.y}; // world x -> f (f is toward -x when the shank hangs straight down)
});
const RIM_F = {x: 8.4, y: -6.6}, RIM_B = {x: -5.2, y: -2.2};
const SOCK_HULL = hull([...footLocal(), RIM_F, RIM_B, {x: 1.2, y: 18.2}, {x: -2.6, y: 18.0}, {x: 4.6, y: 16.2}]);
export const SOCKET_OUT = offsetPoly(SOCK_HULL, 2.5);
// the cutaway window: just outside the foot, below the rim band
const rimA = add(RIM_B, {x: 0, y: 1.2}), rimB = add(RIM_F, {x: 0, y: 1.0});
export const SOCKET_WIN = clipHalf(offsetPoly(SOCK_HULL, 1.25), rimA, rimB);
/** bottom of the socket on the shank axis (the pylon adapter) */
export const SOCKET_BOT = 19.0;

// ------------------------------------------------------------------------------------------------------- joints
export const joints = (p: WPose) => {
  const H: V = {x: p.x, y: p.y};
  const Hf: V = add(H, {x: p.stagger, y: -0.4 - (p.staggerY ?? 0)});
  const nSa = p.near.hip - p.near.knee;
  const A = add(H, mul(dirA(p.near.hip), DIMW.thigh));
  const PA = add(A, mul(dirA(nSa), DIMW.shin));
  const fSa = p.far.hip - p.far.knee;
  const K = add(Hf, mul(dirA(p.far.hip), DIMW.thigh));
  const FA = add(K, mul(dirA(fSa), DIMW.shin));
  const up = upA(p.lean);
  const fwd = dirA(p.lean + 90 + 180 - 180); // perpendicular toward his front
  const fw = {x: -Math.cos(rad(p.lean)), y: Math.sin(rad(p.lean))};
  void fwd;
  const B = add(H, {x: 2.2, y: -3.5});
  const S = add(B, mul(up, DIMW.torso - 6));
  const Sf = add(S, {x: p.stagger * 0.5, y: -0.6});
  const N = add(B, mul(up, DIMW.torso));
  const headC = add(N, mul(upA(p.lean + p.neck), DIMW.headR * 0.98));
  const arm = (Sh: V, a: Arm) => {
    const E = add(Sh, mul(dirA(a.sh + p.lean * 0.5), DIMW.upper));
    const Wr = add(E, mul(dirA(a.sh + p.lean * 0.5 + a.el), DIMW.fore));
    return {S: Sh, E, W: Wr};
  };
  return {
    H, Hf, A, PA, K, FA, B, S, N, headC, up, fw,
    nSa, fSa,
    nFoot: nSa + 90 - p.near.ank,
    fFoot: fSa + 90 - p.far.ank,
    bioFoot: nSa - SEAT - (p.bf ?? 0),
    armN: arm(S, p.aN),
    armF: arm(Sf, p.aF),
  };
};
export type WJ = ReturnType<typeof joints>;
/** lowest point of a cleat (stud tips) for a foot at the ankle pivot with angle fa */
export const cleatLow = (A: V, fa: number) => Math.max(...[...CLEAT.map(([u, v]) => footPt(A, fa, 1, u, v).y), ...STUDS.map((u) => footPt(A, fa, 1, u, 7.8).y)]);
/** two-bone leg IK: hip angle and knee flexion that put the ankle (or the prosthetic ankle) at T */
export const ikLeg = (H: V, T: V, l1 = DIMW.thigh, l2 = DIMW.shin): {hip: number; knee: number} => {
  const d = sub(T, H);
  const L = Math.min(len(d), l1 + l2 - 0.01);
  const base = -angOf(d) + 90; // angle from down of the hip->target line, + forward: dirA(a) = (-sin a, cos a)
  const aT = (Math.atan2(-d.x, d.y) * 180) / Math.PI;
  void base;
  const cosH = (l1 * l1 + L * L - l2 * l2) / (2 * l1 * L);
  const hOff = (Math.acos(Math.max(-1, Math.min(1, cosH))) * 180) / Math.PI;
  const cosK = (l1 * l1 + l2 * l2 - L * L) / (2 * l1 * l2);
  const knee = 180 - (Math.acos(Math.max(-1, Math.min(1, cosK))) * 180) / Math.PI;
  return {hip: aT + hOff, knee};
};

// ------------------------------------------------------------------------------------------------------ drawing
const toPath = (ps: V[], t = 1) => closed(ps, t);
const fpath = (A: V, fa: number, h: 1 | -1, pts: [number, number][], t = 1) => toPath(pts.map(([u, v]) => footPt(A, fa, h, u, v)), t);

/** a cleat on a foot (or the prosthetic foot) at ankle pivot A, foot angle fa */
export const Cleat: React.FC<{id: string; A: V; fa: number; iw: number; dim?: number}> = ({id, A, fa, iw, dim = 0}) => {
  const F = (u: number, v: number) => footPt(A, fa, 1, u, v);
  const col = (c: string) => (dim ? shade(c, dim) : c);
  const d = fpath(A, fa, 1, CLEAT);
  const c0 = F(4, 0), dir = sub(F(10, 0), F(-2, 0));
  return (
    <g>
      <Inked w={iw}>
        {STUDS.map((u, i) => (
          <InkPath key={i} d={toPath([F(u - 0.8, 6.4), F(u + 0.8, 6.4), F(u + 0.55, 7.8), F(u - 0.55, 7.8)], 0.2)} fill={col(C.stud)} />
        ))}
        <Blob id={`${id}-b`} d={d} c={add(c0, {x: 0, y: -2})} r={12} color={col(C.cleat)} k={0.9} />
      </Inked>
      <Deco>
        <path d={toPath([F(-6.9, 5.5), F(17.4, 5.5), F(17.1, 6.1), F(15.6, 6.75), F(-4, 6.85), F(-6.7, 6.1)], 0.4)} fill={col(C.cleatAccent)} />
        <path d={toPath([F(-1.4, 0.9), F(11.6, 2.7), F(11.0, 4.0), F(-1.9, 2.9)], 0.5)} fill={col(C.cleatAccent)} />
        <path d={toPath([F(-7.1, 3.6), F(-6.6, 0.4), F(-4.3, 0.8), F(-4.6, 4.1)], 0.5)} fill={col(C.cleatAccent)} opacity={0.9} />
        <path d={toPath([F(-3.6, -3.4), F(2.4, -3.3), F(2.0, -2.2), F(-3.4, -2.4)], 0.5)} fill={col('#20262E')} />
        {[4.4, 6.8, 9.2].map((u) => (
          <InkLine key={u} d={`M${P(F(u - 0.6, -1.2 + (u - 4) * 0.42))} L${P(F(u + 0.8, 0.2 + (u - 4) * 0.42))}`} w={iw * 0.5} />
        ))}
        <ellipse cx={fmt(F(13.5, 2.6).x)} cy={fmt(F(13.5, 2.6).y)} rx={fmt(1.6)} ry={fmt(0.55)} transform={`rotate(${fmt(angOf(dir))} ${fmt(F(13.5, 2.6).x)} ${fmt(F(13.5, 2.6).y)})`} fill="#FFFFFF" opacity={0.85} />
      </Deco>
    </g>
  );
};

/** the foot's body without the toes (same frame as FOOT) */
export const FOOT_BODY: [number, number][] = [
  [2.2, -3.1], [6.4, -0.9], [10.4, 0.9], [12.7, 1.9], [13.4, 3.6], [13.0, 5.8], [11.2, 6.2], [8.4, 5.4], [4.6, 5.0],
  [0.6, 5.6], [-2.4, 6.3], [-4.6, 6.3], [-6.3, 4.8], [-6.6, 1.8], [-5.2, -1.4], [-3.4, -3.6],
];
/** toes: base (u, v), length, radius. [0] is the big toe (nearest the camera in the inside view) */
export const TOES: [number, number, number, number][] = [
  [12.4, 4.25, 4.0, 1.75], [12.6, 2.55, 3.1, 1.12], [12.2, 1.6, 2.6, 1.0], [11.6, 0.8, 2.2, 0.9], [10.9, 0.1, 1.8, 0.8],
];

/** his own foot (bare skin), turned around (h = -1) or normal (h = +1), at ankle pivot A with angle fa.
 *  toeCurl (deg, + = toward the sole) flexes the toes about their bases (the wiggle). */
export const BioFoot: React.FC<{id: string; A: V; fa: number; h: 1 | -1; iw: number; toeCurl?: number; skin?: string; nails?: boolean}> = ({id, A, fa, h, iw, toeCurl = 0, skin = C.skin, nails = true}) => {
  const F = (u: number, v: number) => footPt(A, fa, h, u, v);
  const d = toPath(FOOT_BODY.map(([u, v]) => F(u, v)));
  // toe k: from its base along u, bent toward the sole by toeCurl (the small toes a little more)
  const toe = (k: number) => {
    const [u, v, l, r] = TOES[k];
    const a = rad(toeCurl * (k === 0 ? 1 : 1.15) - (k === 0 ? 2 : 4 + k * 2));
    const tip = {u: u + l * Math.cos(a), v: v + l * Math.sin(a)};
    return {b: F(u - 0.6, v), t: F(tip.u, tip.v), r, tipUV: tip, a};
  };
  const ts = [0, 1, 2, 3, 4].map(toe);
  const fdir = dirA(fa);
  return (
    <g>
      {/* the four smaller toes, a little behind the big toe (farther from the camera) */}
      <Inked w={iw}>
        {[4, 3, 2, 1].map((k) => (
          <Capsule key={k} id={`${id}-t${k}`} a={ts[k].b} b={ts[k].t} ra={ts[k].r * 1.05} rb={ts[k].r} color={shade(skin, 0.08 + 0.04 * k)} />
        ))}
      </Inked>
      <Inked w={iw}>
        <Blob id={`${id}-f`} d={d} c={F(3, 0.5)} r={13} color={skin} k={0.85} />
        <Capsule id={`${id}-t0`} a={ts[0].b} b={ts[0].t} ra={1.95} rb={ts[0].r} color={skin} />
      </Inked>
      <Deco>
        {/* arch shade, ankle bone, heel highlight, the crease at the toe's base, toenails */}
        <ellipse cx={fmt(F(6.2, 4.2).x)} cy={fmt(F(6.2, 4.2).y)} rx={4.0} ry={0.85} transform={`rotate(${fmt(angOf(fdir))} ${fmt(F(6.2, 4.2).x)} ${fmt(F(6.2, 4.2).y)})`} fill={shade(skin, 0.3)} opacity={0.35} />
        <ellipse cx={fmt(F(-0.4, -1.0).x)} cy={fmt(F(-0.4, -1.0).y)} rx={1.7} ry={1.4} fill={lit(skin, 0.35)} opacity={0.55} />
        <InkLine d={`M${P(F(-1.6, -2.2))} Q${P(F(-0.3, -2.9))} ${P(F(1.0, -1.9))}`} w={iw * 0.45} opacity={0.5} />
        <ellipse cx={fmt(F(-4.6, 2.4).x)} cy={fmt(F(-4.6, 2.4).y)} rx={1.3} ry={0.8} fill="#FFFFFF" opacity={0.3} />
        <InkLine d={`M${P(F(12.1, 3.2))} Q${P(F(12.5, 4.4))} ${P(F(12.2, 5.6))}`} w={iw * 0.4} opacity={0.5} />
        {nails && ts.map((q, k) => {
          const back = k === 0 ? 1.0 : 0.6;
          const along = norm(sub(q.t, q.b));
          const c = add(add(q.t, mul(along, -back)), mul(dirA(fa - 90 * h), -q.r * 0.45));
          const rx = k === 0 ? 0.95 : 0.55, ry = k === 0 ? 0.55 : 0.36;
          return <ellipse key={k} cx={fmt(c.x)} cy={fmt(c.y)} rx={fmt(rx)} ry={fmt(ry)} transform={`rotate(${fmt(angOf(along))} ${fmt(c.x)} ${fmt(c.y)})`} fill={C.nail} stroke={INK} strokeWidth={iw * 0.3} opacity={k === 0 ? 1 : 0.9} />;
        })}
      </Deco>
    </g>
  );
};

/** the socket shell (carbon) with the near wall cut away; the foot inside; the pylon and the prosthetic foot's cleat */
export const Prosthesis: React.FC<{id: string; j: WJ; iw: number; cut: number; footVis?: number; shell?: number; toeCurl?: number}> = ({id, j, iw, cut, footVis = 1, shell = 1, toeCurl = 0}) => {
  const pass = useInk().pass;
  const sp = (q: V) => shankPt(j.A, j.nSa, q.x, q.y);
  const out = toPath(SOCKET_OUT.map(sp), 0.9);
  const win = toPath(SOCKET_WIN.map(sp), 0.75);
  const top = sp({x: 1.5, y: 2}), bot = sp({x: 1.5, y: SOCKET_BOT});
  const D = dirA(j.nSa);
  const pyl0 = sp({x: 0, y: SOCKET_BOT - 0.6}), pyl1 = sp({x: 0, y: DIMW.shin - 2.2});
  void pass; void top; void bot;
  return (
    <g>
      {/* pylon (behind the shell's bottom, into the cleat's collar) */}
      <Inked w={iw}>
        <Capsule id={`${id}-py`} a={pyl0} b={pyl1} ra={1.45} rb={1.45} color={C.pylon} spec={0.55} />
        <InkPath d={toPath([sp({x: -2.6, y: SOCKET_BOT - 1.2}), sp({x: 2.6, y: SOCKET_BOT - 1.2}), sp({x: 1.8, y: SOCKET_BOT + 1.4}), sp({x: -1.8, y: SOCKET_BOT + 1.4})], 0.3)} fill={C.pylonDeep} />
        <InkPath d={toPath([sp({x: -2.1, y: DIMW.shin - 3.6}), sp({x: 2.1, y: DIMW.shin - 3.6}), sp({x: 2.0, y: DIMW.shin - 1.6}), sp({x: -2.0, y: DIMW.shin - 1.6})], 0.3)} fill={C.pylonDeep} />
      </Inked>
      <Cleat id={`${id}-cl`} A={j.PA} fa={j.nFoot} iw={iw} />
      {/* shell */}
      <g opacity={shell}>
        <Inked w={iw}>
          <Blob id={`${id}-sh`} d={out} c={sp({x: 3, y: 4})} r={20} color={C.carbon} k={1.1} />
        </Inked>
        <Deco>
          <defs>
            <clipPath id={`${id}-oc`}><path d={out} /></clipPath>
          </defs>
          <g clipPath={`url(#${id}-oc)`}>
            {/* carbon weave: faint diagonal bands */}
            {Array.from({length: 16}, (_, i) => {
              const a = sp({x: -12 + i * 2.2, y: -8}), b = sp({x: -12 + i * 2.2 + 14, y: 24});
              return <line key={i} x1={fmt(a.x)} y1={fmt(a.y)} x2={fmt(b.x)} y2={fmt(b.y)} stroke={C.carbonLight} strokeWidth={0.5} opacity={0.22} />;
            })}
            {/* liner lip at the rim */}
            <path d={`M${P(sp({x: -6.4, y: -2.6}))} L${P(sp({x: 9.6, y: -7.2}))}`} stroke={C.liner} strokeWidth={1.5} strokeLinecap="round" />
            {/* gloss down the light side */}
            <path d={`M${P(sp({x: 7.6, y: -3.5}))} Q${P(sp({x: 8.4, y: 6}))} ${P(sp({x: 5.2, y: 14.5}))}`} stroke="#FFFFFF" strokeWidth={0.9} fill="none" strokeLinecap="round" opacity={0.28} />
          </g>
        </Deco>
      </g>
      {/* the cutaway: near wall removed, the turned-around foot inside */}
      {cut > 0.001 && pass !== 'ink' && (
        <g opacity={cut}>
          <defs>
            <clipPath id={`${id}-wc`}><path d={win} /></clipPath>
            <linearGradient id={`${id}-lg`} gradientUnits="userSpaceOnUse" x1={fmt(sp({x: 8, y: 0}).x)} y1={fmt(sp({x: 8, y: 0}).y)} x2={fmt(sp({x: -6, y: 8}).x)} y2={fmt(sp({x: -6, y: 8}).y)}>
              <stop offset="0" stopColor="#4C5968" />
              <stop offset="1" stopColor="#232C36" />
            </linearGradient>
          </defs>
          <path d={win} fill={`url(#${id}-lg)`} />
          <g clipPath={`url(#${id}-wc)`}>
            {/* the far wall's soft inner shadow */}
            <path d={win} fill="none" stroke="#2A3440" strokeWidth={2.6} opacity={0.28} />
            {/* the leg entering the socket, and the foot */}
            <g opacity={footVis}>
              <Inked w={iw}>
                <Capsule id={`${id}-lg2`} a={add(j.A, mul(sub(j.H, j.A), 0.35))} b={j.A} ra={4.2} rb={3.6} color={C.skin} />
              </Inked>
              <BioFoot id={`${id}-bf`} A={j.A} fa={j.bioFoot} h={-1} iw={iw} toeCurl={toeCurl} />
              <SoftShadow id={`${id}-fs`} c={add(j.A, mul(D, 9))} rx={7} ry={11} alpha={0.12} color="#1C2833" rotate={-j.nSa} />
            </g>
          </g>
          {/* the cut edge of the shell wall */}
          <path d={win} fill="none" stroke={C.carbonCut} strokeWidth={0.75} />
          <path d={win} fill="none" stroke={INK} strokeWidth={iw * 0.32} opacity={0.8} />
        </g>
      )}
    </g>
  );
};

/** the near (rotationplasty) thigh, from the hip to the ankle pivot */
const NearThigh: React.FC<{id: string; j: WJ}> = ({id, j}) => {
  const M = add(j.H, mul(sub(j.A, j.H), 0.62));
  return <Limb id={`${id}-nt`} A={j.H} B={M} C={j.A} rA={8.1} rB={5.4} rC={3.7} color={C.skin} k={0.9} />;
};

export type WOpts = {
  id: string;
  px: number; // cm per screen pixel (sets the contour width)
  cut: number; // socket cutaway 0..1
  /** draw the prosthesis (false: the bare reconstructed leg, e.g. in recovery) */
  prosthesis?: boolean;
  toeCurl?: number;
  hands?: {n: HandPose; f: HandPose};
  hideHead?: boolean;
  /** leave out the near leg (the illustration draws its own) */
  hideNearLeg?: boolean;
  /** draw only the near leg of the shorts (laid over the illustration leg) */
  nearShortsOnly?: boolean;
  /** shirt colour (the hospital gown in recovery) */
  shirt?: string;
  shortsColor?: string;
  /** the bare reconstructed leg below the thigh: his own foot, turned, with the post-op dressing (recovery) */
  bareFoot?: {fa: number; toeCurl: number};
  /** leave out the far leg and the shorts (under the blanket) */
  hideFarLeg?: boolean;
  /** brightness drop of the far side (depth) */
  farDim?: number;
};

/** the whole boy (side view, facing screen-left) */
export const Wyatt: React.FC<{p: WPose; o: WOpts}> = ({p, o}) => {
  const j = joints(p);
  const iw = 7 * o.px;
  const fd = o.farDim ?? 0.1;
  const id = o.id;
  const prost = o.prosthesis ?? true;
  const hN = o.hands?.n ?? HAND_RELAXED, hF = o.hands?.f ?? HAND_RELAXED;
  const T = (f: number, u: number) => add(add(j.B, mul(j.up, u)), mul(j.fw, f));
  const torsoD = toPath([T(7.4, 1), T(8.6, 10), T(9.2, 20), T(8.0, 28.5), T(4.6, 32.6), T(-2.8, 33.2), T(-7.0, 30.4), T(-8.4, 20), T(-7.6, 9), T(-8.4, 1)]);
  const shortsD = toPath([T(8.0, 4.5), T(8.8, -3), T(5, -9.5), T(-4, -10.5), T(-9.2, -5), T(-9.0, 4.0)]);
  const armDraw = (k: string, a: {S: V; E: V; W: V}, hand: HandPose, dim: number) => {
    const fdir = norm(sub(a.W, a.E));
    const sk = dim ? shade(C.skin, dim) : C.skin;
    return (
      <g>
        <Inked w={iw}>
          <Limb id={`${id}-${k}a`} A={a.S} B={a.E} C={a.W} rA={3.6} rB={3.0} rC={2.4} color={sk} k={0.9} capC="flat" crease={iw * 0.6} />
          <Hand id={`${id}-${k}h`} wrist={a.W} ang={angOf(fdir)} L={DIMW.hand} thumbSide={1} view="back" pose={hand} color={sk} bare />
        </Inked>
        <Inked w={iw}>
          <Capsule id={`${id}-${k}slv`} a={add(a.S, mul(norm(sub(a.E, a.S)), -2.5))} b={add(a.S, mul(norm(sub(a.E, a.S)), 9))} ra={5.2} rb={4.4} color={dim ? shade(o.shirt ?? C.jersey, dim) : (o.shirt ?? C.jersey)} />
        </Inked>
      </g>
    );
  };
  // far (left, biological) leg
  const kneeIn = add(j.K, mul(dirA(j.fSa), 3.2));
  const farLeg = (
    <g>
      <Inked w={iw}>
        <Limb id={`${id}-fl`} A={j.Hf} B={j.K} C={j.FA} rA={7.8} rB={4.6} rC={3.0} color={shade(C.skin, fd)} k={0.9} crease={iw * 0.6} />
      </Inked>
      <Inked w={iw}>
        <Capsule id={`${id}-fk`} a={kneeIn} b={j.FA} ra={4.75} rb={3.5} color={shade(C.sock, fd)} />
      </Inked>
      <Deco>
        <path d={`M${P(add(kneeIn, mul(dirA(j.fSa + 90), 4.7)))} L${P(add(kneeIn, mul(dirA(j.fSa + 90), -4.7)))}`} stroke={shade(C.sockBand, fd)} strokeWidth={1.4} />
      </Deco>
      <Cleat id={`${id}-fc`} A={j.FA} fa={j.fFoot} iw={iw} dim={fd} />
      <Inked w={iw}>
        <Capsule id={`${id}-fs`} a={add(j.Hf, mul(dirA(p.far.hip), -2))} b={add(j.Hf, mul(dirA(p.far.hip), 12))} ra={8.2} rb={7.7} color={shade(C.shorts, fd)} />
      </Inked>
    </g>
  );
  const nearShorts = (
    <g>
      <Inked w={iw}>
        <Capsule id={`${id}-ns`} a={add(j.H, mul(dirA(p.near.hip), -2))} b={add(j.H, mul(dirA(p.near.hip), 11.5))} ra={8.4} rb={7.8} color={C.shorts} />
      </Inked>
    </g>
  );
  if (o.nearShortsOnly) return nearShorts;
  const nearLeg = (
    <g>
      <Inked w={iw}>
        <NearThigh id={id} j={j} />
      </Inked>
      {prost && <Prosthesis id={`${id}-pr`} j={j} iw={iw} cut={o.cut} toeCurl={o.toeCurl} />}
      {o.bareFoot && (
        <g>
          <BioFoot id={`${id}-bare`} A={j.A} fa={o.bareFoot.fa} h={-1} iw={iw} toeCurl={o.bareFoot.toeCurl} />
          <Inked w={iw}>
            <Capsule id={`${id}-dr`} a={add(j.H, mul(sub(j.A, j.H), 0.64))} b={add(j.H, mul(sub(j.A, j.H), 0.84))} ra={5.6} rb={5.0} color={C.dressing} k={0.6} />
          </Inked>
          <Deco>
            {[0.69, 0.75, 0.8].map((u) => {
              const q = add(j.H, mul(sub(j.A, j.H), u));
              const n = dirA(p.near.hip + 90);
              const r0 = 5.6 - (u - 0.64) * 3;
              return <path key={u} d={`M${P(add(q, mul(n, r0)))} L${P(add(add(q, mul(n, -r0)), mul(norm(sub(j.A, j.H)), 1.2)))}`} stroke={C.dressingDeep} strokeWidth={0.45} opacity={0.8} />;
            })}
          </Deco>
        </g>
      )}
      <Inked w={iw}>
        <Capsule id={`${id}-ns`} a={add(j.H, mul(dirA(p.near.hip), -2))} b={add(j.H, mul(dirA(p.near.hip), 11.5))} ra={8.4} rb={7.8} color={o.shortsColor ?? C.shorts} />
      </Inked>
      <Deco>
        <path d={`M${P(add(j.H, add(mul(dirA(p.near.hip), 11.2), mul(dirA(p.near.hip + 90), 8.2))))} L${P(add(j.H, add(mul(dirA(p.near.hip), 11.2), mul(dirA(p.near.hip + 90), -8.2))))}`} stroke="#FFFFFF" strokeWidth={0.9} opacity={0.75} />
      </Deco>
    </g>
  );
  return (
    <g>
      {armDraw('f', j.armF, hF, fd)}
      {!o.hideFarLeg && farLeg}
      <Inked w={iw}>
        <Blob id={`${id}-sh`} d={shortsD} c={T(2, 0)} r={14} color={o.shortsColor ?? C.shorts} />
        <Capsule id={`${id}-nk`} a={T(0.5, 30)} b={T(0.8, 37)} ra={3.2} rb={3.2} color={C.skin} />
        <Blob id={`${id}-to`} d={torsoD} c={T(3, 22)} r={24} color={o.shirt ?? C.jersey} />
      </Inked>
      <Deco>
        <path d={`M${P(T(4.3, 32.4))} Q${P(T(1.0, 31.0))} ${P(T(-2.6, 33.0))}`} stroke={C.jerseyTrim} strokeWidth={1.3} fill="none" strokeLinecap="round" />
        <path d={`M${P(T(8.0, 2.2))} L${P(T(-8.3, 2.2))}`} stroke={shade(C.jersey, 0.25)} strokeWidth={0.7} opacity={0.6} />
      </Deco>
      {!o.hideHead && (
        <Head id={`${id}-hd`} c={j.headC} R={DIMW.headR} roll={-p.lean * 0.6 - p.neck} turn={p.turn} expr={p.expr} blink={p.blink} skin={C.skin} hair={C.hair} inkW={7 * o.px * (100 / DIMW.headR)} hairStyle="crop" />
      )}
      {!o.hideNearLeg && nearLeg}
      {armDraw('n', j.armN, hN, 0)}
    </g>
  );
};
