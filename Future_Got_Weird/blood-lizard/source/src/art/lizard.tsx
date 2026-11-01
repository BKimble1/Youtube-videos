// The Texas horned lizard (Phrynosoma cornutum), V2. Units cm, y down, ground at y = 0.
// A light 3D rig projected from a slightly raised camera (ELEV), with a heading (yaw) so it can pivot: 0 faces screen
// right, PI/2 faces the camera, PI faces screen left. Animal-local axes: X forward, H up, Z to its right side.
//
//   body   a broad, flat disc (lateral edge loop + dorsal dome), paired dark blotches with pale rims either side of a
//          pale mid-dorsal stripe, scattered conical spines, a fringe of pointed scales along the edge facing us
//   legs   four sprawled legs (shoulder/elbow/wrist/foot) with a diagonal gait; feet plant on the ground
//   tail   short and broad at the base
//   head   blunt; a crown of horns (two long occipital horns, three temporal horns each side); the eye on the side
//          facing us, with swelling lids, dark bars below it and the pore at the FRONT corner of the lids
// The cross-section (section.tsx) is drawn in the eye's frame (eyeFrame) and the eye is drawn again on top of it,
// so the eye stays seated in its lids.
import React from 'react';
import {P, add, closed, mul, nrm, open, perp, pt, rot, sub} from '../core/geo';
import {mix} from '../core/color';
import {uid} from '../core/ids';
import {clamp, hash, lerp, noise1, ss} from '../lib';

export const ELEV = (27 * Math.PI) / 180;
const CE = Math.cos(ELEV), SE = Math.sin(ELEV);
type P3 = {x: number; h: number; z: number};
const p3 = (x: number, h: number, z: number): P3 => ({x, h, z});

export const LZ = {
  ink: '#2E1D16', base: '#C99868', lite: '#E2BC8C', top: '#D7AC7A', shade: '#9A6E4A', deep: '#6E4A31',
  blotch: '#5A3626', rim: '#F4E4C2', stripe: '#EED6A8', spine: '#E9CFA2',
  horn: '#F1E2BF', hornDk: '#B99A6C', bar: '#4B2D20', iris: '#D29B3C', irisDk: '#7A4E14', pupil: '#120B08',
  lid: '#C08E60', lidDk: '#86603F', blood: '#9A0E16', bloodDk: '#55060B', bloodLit: '#E4473F',
};
export type EyeState = {look: number; blink: number; bulge: number; blood: number; wet: number};
export type LizardState = {
  x: number; y: number;  // root (ground point under the body centre), world
  yaw: number;           // heading (rad)
  head: number;          // head pitch (rad, - = raised)
  puff: number;          // 0..1 inflation (defensive)
  gait: number;          // gait phase (cycles)
  run: number;           // 0..1 legs moving
  flinch: number;        // brief squash (0..1)
  eye: EyeState;
  t: number;
};

// ---------------------------------------------------------------- frames
/** animal-local 3D -> world screen point */
const W = (s: LizardState, q: P3): P => {
  const c = Math.cos(s.yaw), sn = Math.sin(s.yaw);
  const x = q.x * c - q.z * sn, z = q.x * sn + q.z * c;
  return pt(s.x + x, s.y - q.h * CE * (1 - 0.06 * s.flinch) + z * SE);
};
/** world depth (toward the camera +) of an animal-local point */
const depth = (s: LizardState, q: P3) => q.x * Math.sin(s.yaw) + q.z * Math.cos(s.yaw);
const NECK = (puff: number) => p3(2.15, 1.3 + 0.1 * puff, 0);
export const HEAD_S = 1.16;
/** head-local 3D (head axis X, up H, right Z) -> animal-local 3D */
const H2A = (s: LizardState, q: P3): P3 => {
  const r = -s.head;
  const x = q.x * Math.cos(r) - q.h * Math.sin(r), h = q.x * Math.sin(r) + q.h * Math.cos(r);
  const n = NECK(s.puff);
  return p3(n.x + x * HEAD_S, n.h + h * HEAD_S, q.z * HEAD_S);
};

// ---------------------------------------------------------------- body
const bodyB = (X: number, puff: number) => {
  const u = (X + 0.45) / 2.95;
  const disc = 2.9 * Math.pow(Math.max(0, 1 - u * u), 0.42);
  return lerp(disc, Math.max(disc, 1.0), ss(X, 1.35, 2.3)) * (1 + 0.1 * puff);
};
const bodyA = (X: number, puff: number) => (0.18 + 0.4 * Math.pow(Math.max(0, 1 - ((X + 0.45) / 2.95) ** 2), 0.35)) * (1 + 0.2 * puff);
const bodyH = (X: number, puff: number) => 0.86 + 0.08 * Math.exp(-(((X + 0.3) / 2.0) ** 2)) + 0.12 * puff;
const BX: number[] = [];
for (let x = -3.42; x <= 2.5; x += 0.2) BX.push(x);
const dorsal = (X: number, Z: number, puff: number): P3 => {
  const b = bodyB(X, puff), a = bodyA(X, puff);
  const q = clamp(Math.abs(Z) / Math.max(0.01, b));
  return p3(X, bodyH(X, puff) + a * Math.sqrt(Math.max(0, 1 - q * q)) - 0.05, Z);
};
/** convex hull (monotone chain) */
const hull = (ps: P[]) => {
  const a = [...ps].sort((p, q) => p.x - q.x || p.y - q.y);
  const cr = (o: P, p: P, q: P) => (p.x - o.x) * (q.y - o.y) - (p.y - o.y) * (q.x - o.x);
  const lo: P[] = [], up: P[] = [];
  for (const p of a) {
    while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop();
    lo.push(p);
  }
  for (let i = a.length - 1; i >= 0; i--) {
    const p = a[i];
    while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], p) <= 0) up.pop();
    up.push(p);
  }
  return [...lo.slice(0, -1), ...up.slice(0, -1)];
};

// ---------------------------------------------------------------- head geometry (head-local)
const HX = [-0.38, 0.05, 0.5, 0.92, 1.28, 1.55, 1.74, 1.84];
const HH = [0.14, 0.16, 0.12, 0.05, -0.03, -0.09, -0.14, -0.17];
const HA = [0.5, 0.56, 0.54, 0.47, 0.38, 0.29, 0.19, 0.09];
const HB = [1.05, 1.18, 1.1, 0.9, 0.68, 0.48, 0.3, 0.12];
const ringAt = (X: number) => {
  const i = Math.max(0, Math.min(HX.length - 2, HX.findIndex((v) => v > X) - 1));
  const u = clamp((X - HX[i]) / (HX[i + 1] - HX[i]));
  return {h: lerp(HH[i], HH[i + 1], u), a: lerp(HA[i], HA[i + 1], u), b: lerp(HB[i], HB[i + 1], u)};
};
const EYE3 = (side: number) => p3(0.78, 0.3, 0.8 * side);
export const EYE_R = 0.25;
/** the pore at the FRONT, upper corner of the lid opening, and the direction blood leaves it (eye frame, x = snout) */
export const PORE_OFF = pt(0.28, -0.13);
export const PORE_DIR0 = nrm(pt(0.86, -0.5));
const HORNS: {b: P3; d: P3; len: number; r: number}[] = [];
for (const s of [-1, 1]) {
  HORNS.push({b: p3(-0.22, 0.52, 0.3 * s), d: p3(-0.5, 0.84, 0.22 * s), len: 1.02, r: 0.15});
  HORNS.push({b: p3(-0.05, 0.42, 0.86 * s), d: p3(-0.7, 0.52, 0.48 * s), len: 0.78, r: 0.12});
  HORNS.push({b: p3(-0.18, 0.16, 1.02 * s), d: p3(-0.86, 0.2, 0.46 * s), len: 0.64, r: 0.11});
  HORNS.push({b: p3(-0.24, -0.12, 0.96 * s), d: p3(-0.9, -0.06, 0.42 * s), len: 0.48, r: 0.095});
}
const unit3 = (q: P3) => {
  const l = Math.hypot(q.x, q.h, q.z) || 1;
  return p3(q.x / l, q.h / l, q.z / l);
};

/** the visible eye's frame on screen (relative to the world): centre, rotation, mirror and foreshortening */
export const eyeFrameSide = (s: LizardState, side: number) => {
  const cy = Math.cos(s.yaw);
  const c = W(s, H2A(s, EYE3(side)));
  const mx = cy >= 0 ? 1 : -1;
  const fs = clamp(side * cy * 1.1, 0.3, 1);
  const ang = s.head * mx * Math.max(0.3, Math.abs(cy));
  const vis = clamp(side * cy * 3 + 0.45);
  return {c, ang, mx, fs, vis, k: HEAD_S};
};
/** the eye on the side facing us (the one that squirts, and the one the cross-section is drawn round) */
export const eyeFrame = (s: LizardState) => eyeFrameSide(s, Math.cos(s.yaw) >= 0 ? 1 : -1);
/** eye-frame point -> world */
export const eyeToWorld = (s: LizardState, q: P) => {
  const f = eyeFrame(s);
  return add(f.c, rot(pt(q.x * f.mx * f.fs * f.k, q.y * f.k), f.ang));
};
export const eyeWorld = (s: LizardState) => eyeFrame(s).c;
export const poreWorld = (s: LizardState) => eyeToWorld(s, PORE_OFF);
export const poreDirWorld = (s: LizardState) => {
  const f = eyeFrame(s);
  return nrm(rot(pt(PORE_DIR0.x * f.mx * f.fs, PORE_DIR0.y), f.ang));
};
export const backWorld = (s: LizardState, X: number) => W(s, dorsal(X, 0, s.puff));

// ---------------------------------------------------------------- the eye (eye frame: centre at 0, x toward the snout)
export const Eye: React.FC<{e: EyeState; sw: number}> = ({e, sw}) => {
  const r = EYE_R;
  const bl = clamp(e.blink), bu = clamp(e.bulge);
  const ids = {clip: uid('ec'), ir: uid('ei')};
  const lidO = (k: number) => {
    const pts: P[] = [];
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2;
      pts.push(rot(pt(Math.cos(a) * r * 1.12, Math.sin(a) * r * (a < Math.PI ? 0.78 : 0.86) * k), 0.12));
    }
    return closed(pts, 0.9);
  };
  const lidRing = (k: number) => {
    const pts: P[] = [];
    for (let i = 0; i < 20; i++) {
      const a = (i / 20) * Math.PI * 2;
      const rr = r * (1.62 + 0.36 * bu + 0.05 * Math.sin(a * 5));
      pts.push(rot(pt(Math.cos(a) * rr * 1.08, Math.sin(a) * rr * k), 0.12));
    }
    return closed(pts, 0.9);
  };
  const open_ = Math.max(0.02, 1 - bl);
  const look = e.look * r * 0.22;
  const swell = mix(LZ.lid, '#C9645A', 0.6 * bu);
  return (
    <g>
      <defs>
        <clipPath id={ids.clip}><path d={lidO(open_)} /></clipPath>
        <radialGradient id={ids.ir} cx="0.42" cy="0.38" r="0.62">
          <stop offset={0} stopColor="#F4C866" />
          <stop offset={0.55} stopColor={LZ.iris} />
          <stop offset={1} stopColor={LZ.irisDk} />
        </radialGradient>
      </defs>
      <path d={lidRing(0.92)} fill={swell} stroke={LZ.ink} strokeWidth={sw * 0.9} />
      {Array.from({length: 14}, (_, i) => {
        const a = (i / 14) * Math.PI * 2;
        const rr = r * (1.38 + 0.28 * bu);
        const q = rot(pt(Math.cos(a) * rr * 1.08, Math.sin(a) * rr * 0.92), 0.12);
        return <circle key={i} cx={q.x} cy={q.y} r={r * 0.13} fill={mix(swell, '#FFF0D6', 0.25)} opacity={0.55} />;
      })}
      <path d={lidO(open_)} fill={LZ.pupil} stroke={LZ.ink} strokeWidth={sw} />
      <g clipPath={`url(#${ids.clip})`}>
        <circle cx={look} cy={0} r={r * 0.93} fill={`url(#${ids.ir})`} />
        <circle cx={look} cy={0} r={r * 0.42} fill={LZ.pupil} />
        <ellipse cx={look - r * 0.3} cy={-r * 0.32} rx={r * 0.2} ry={r * 0.14} fill="#FFFFFF" opacity={0.9} />
        <path d={`M${-r * 1.2} ${-r * 0.55} Q0 ${-r * 0.95} ${r * 1.2} ${-r * 0.55} L${r * 1.2} ${-r * 1.2} L${-r * 1.2} ${-r * 1.2} Z`} fill="#000" opacity={0.28} />
      </g>
      <path d={lidO(open_)} fill="none" stroke={mix(LZ.lidDk, '#5A1A16', bu)} strokeWidth={sw * 1.6} />
      <circle cx={PORE_OFF.x} cy={PORE_OFF.y} r={0.03 + 0.02 * bu} fill={LZ.bloodDk} opacity={0.3 + 0.7 * Math.max(bu, e.wet)} />
    </g>
  );
};
/** the face markings round the eye (eye frame): dark bars below and behind it, the brow ridge with small spines */
const EyeDecal: React.FC<{sw: number}> = ({sw}) => (
  <g>
    <path d="M-0.12 0.2 L-0.3 0.58 L-0.1 0.6 L0.06 0.24 Z" fill={LZ.bar} opacity={0.85} />
    <path d="M0.2 0.18 L0.28 0.52 L0.44 0.5 L0.36 0.16 Z" fill={LZ.bar} opacity={0.6} />
    <path d="M-0.32 -0.06 L-1.15 -0.18 L-1.12 0.06 L-0.32 0.12 Z" fill={LZ.bar} opacity={0.55} />
    <path d="M-0.5 -0.34 Q0 -0.62 0.5 -0.36" stroke={LZ.ink} strokeWidth={sw * 1.2} fill="none" />
    {[-0.32, 0, 0.3].map((dx, i) => <path key={i} d={`M${dx - 0.07} -0.46 L${dx - 0.05} -0.64 L${dx + 0.07} -0.46 Z`} fill="#DDBB8C" stroke={LZ.deep} strokeWidth={sw * 0.5} strokeLinejoin="round" />)}
  </g>
);
/** blood that has run from the pore down the cheek (eye frame) */
const BloodRun: React.FC<{e: EyeState; sw: number; t: number}> = ({e, sw, t}) => {
  const b = clamp(e.blood), w = clamp(e.wet);
  if (b <= 0.001 && w <= 0.001) return null;
  const P0 = PORE_OFF;
  const len = 0.62 * b;
  const pts = [P0, add(P0, pt(0.05, len * 0.3)), add(P0, pt(0.02 + 0.02 * noise1(t), len * 0.7)), add(P0, pt(0.01, len))];
  const drop = add(P0, pt(0.01, len + 0.03));
  return (
    <g>
      {b > 0.01 && (
        <>
          <path d={open(pts)} stroke={LZ.bloodDk} strokeWidth={0.07 + sw * 0.6} fill="none" strokeLinecap="round" />
          <path d={open(pts)} stroke={LZ.blood} strokeWidth={0.05} fill="none" strokeLinecap="round" />
          <circle cx={drop.x} cy={drop.y} r={0.055 * Math.min(1, b * 2)} fill={LZ.blood} stroke={LZ.bloodDk} strokeWidth={sw * 0.5} />
        </>
      )}
      {w > 0.01 && <circle cx={P0.x} cy={P0.y} r={0.07 * w} fill={LZ.blood} stroke={LZ.bloodDk} strokeWidth={sw * 0.5} />}
    </g>
  );
};

// ---------------------------------------------------------------- legs
type Leg = {sh: P3; el: P3; wr: P3; ft: P3; front: boolean; side: number};
const legPose = (front: boolean, side: number, s: LizardState): Leg => {
  const X0 = front ? 1.55 : -2.2;
  const f = ((((s.gait + (front ? 0 : 0.5) + (side > 0 ? 0 : 0.5)) % 1) + 1) % 1);
  const stance = f < 0.62;
  const u = stance ? f / 0.62 : (f - 0.62) / 0.38;
  const L = 1.3 * s.run;
  const dx = stance ? lerp(L / 2, -L / 2, u) : lerp(-L / 2, L / 2, ss(u, 0, 1));
  const lift = stance ? 0 : 0.55 * Math.sin(Math.PI * u) * s.run;
  const zb = bodyB(X0, s.puff) * 0.62;
  const H0 = bodyH(X0, s.puff);
  const sh = p3(X0, H0 - 0.2, side * zb);
  const el = p3(X0 + (front ? -0.1 : 0.5) + dx * 0.4, H0 + 0.12 + lift * 0.4, side * (zb + 0.95));
  const ft = p3(X0 + (front ? 0.45 : -0.3) + dx, lift, side * (zb + 1.15));
  const wr = p3(lerp(el.x, ft.x, 0.82), lerp(el.h, ft.h, 0.82) + 0.12, lerp(el.z, ft.z, 0.82));
  return {sh, el, wr, ft, front, side};
};
const tubeD = (a: P, b: P, r0: number, r1: number) => {
  const t = nrm(sub(b, a)), n = perp(t);
  const A = add(a, mul(n, r0)), Bp = add(b, mul(n, r1)), Cp = add(b, mul(n, -r1)), D = add(a, mul(n, -r0));
  const e1 = add(b, mul(t, r1 * 0.9)), e0 = add(a, mul(t, -r0 * 0.9));
  return `M${A.x} ${A.y} L${Bp.x} ${Bp.y} Q${e1.x + n.x * r1} ${e1.y + n.y * r1} ${e1.x} ${e1.y} Q${e1.x - n.x * r1} ${e1.y - n.y * r1} ${Cp.x} ${Cp.y} L${D.x} ${D.y} Q${e0.x - n.x * r0} ${e0.y - n.y * r0} ${e0.x} ${e0.y} Q${e0.x + n.x * r0} ${e0.y + n.y * r0} ${A.x} ${A.y} Z`;
};
const LegDraw: React.FC<{g: Leg; far: boolean; s: LizardState; sw: number}> = ({g, far, s, sw}) => {
  const S = W(s, g.sh), E = W(s, g.el), Wr = W(s, g.wr), F = W(s, g.ft);
  const fill = far ? mix(LZ.shade, LZ.deep, 0.35) : LZ.base;
  const toes: React.ReactNode[] = [];
  for (let k = 0; k < 5; k++) {
    const a = (g.front ? -0.95 : 2.2) + k * (g.front ? 0.42 : -0.45);
    const len = [0.38, 0.55, 0.66, 0.6, 0.42][k] * (g.front ? 1 : 1.15);
    const tip3 = p3(g.ft.x + Math.cos(a) * len, 0, g.ft.z + Math.sin(a) * len * g.side);
    const tip = W(s, tip3);
    toes.push(<path key={k} d={`M${F.x} ${F.y} L${tip.x} ${tip.y}`} stroke={far ? LZ.deep : LZ.ink} strokeWidth={sw * 2.2} strokeLinecap="round" />);
    toes.push(<path key={'f' + k} d={`M${F.x} ${F.y} L${tip.x} ${tip.y}`} stroke={fill} strokeWidth={sw * 1.05} strokeLinecap="round" />);
  }
  return (
    <g>
      <path d={tubeD(S, E, 0.36, 0.26)} fill={fill} stroke={LZ.ink} strokeWidth={sw} strokeLinejoin="round" />
      <path d={tubeD(E, Wr, 0.26, 0.17)} fill={fill} stroke={LZ.ink} strokeWidth={sw} strokeLinejoin="round" />
      <path d={`M${Wr.x} ${Wr.y} L${F.x} ${F.y}`} stroke={LZ.ink} strokeWidth={0.36 + sw} strokeLinecap="round" />
      <path d={`M${Wr.x} ${Wr.y} L${F.x} ${F.y}`} stroke={fill} strokeWidth={0.36 - sw * 0.2} strokeLinecap="round" />
      {toes}
    </g>
  );
};
const Cone: React.FC<{B: P; T: P; r: number; fill: string; dk: string; sw: number}> = ({B, T, r, fill, dk, sw}) => {
  const ax = nrm(sub(T, B)), n = perp(ax);
  const L = add(B, mul(n, r)), R = add(B, mul(n, -r)), mid = add(B, mul(sub(T, B), 0.55));
  const q = (k: number) => add(mid, mul(n, r * 0.55 * k));
  const lower = n.y > 0 ? 1 : -1;
  return (
    <g>
      <path d={`M${L.x} ${L.y} Q${q(1).x} ${q(1).y} ${T.x} ${T.y} Q${q(-1).x} ${q(-1).y} ${R.x} ${R.y} Z`} fill={fill} stroke={LZ.ink} strokeWidth={sw} strokeLinejoin="round" />
      <path d={`M${B.x} ${B.y} L${add(B, mul(n, r * lower)).x} ${add(B, mul(n, r * lower)).y} Q${q(lower).x} ${q(lower).y} ${T.x} ${T.y} Z`} fill={dk} opacity={0.75} />
    </g>
  );
};

// ---------------------------------------------------------------- the lizard
export type SectionGeom = {head: P[]; body: P[]; eye: ReturnType<typeof eyeFrame>};
export const Lizard: React.FC<{s: LizardState; sw?: number; section?: (g: SectionGeom, layer: 'under' | 'over') => React.ReactNode; cut?: number; shadow?: boolean}> = ({s, sw = 0.05, section, cut = 0, shadow = true}) => {
  const puff = clamp(s.puff);
  const ids = {disc: uid('ld'), head: uid('lh'), sh: uid('ls')};
  const cy = Math.cos(s.yaw), sy = Math.sin(s.yaw);
  // body
  const edgeR: P[] = [], edgeL: P[] = [], ridge: P[] = [], belly: P[] = [];
  for (const X of BX) {
    const b = bodyB(X, puff), H = bodyH(X, puff), a = bodyA(X, puff);
    edgeR.push(W(s, p3(X, H - 0.12, b)));
    edgeL.push(W(s, p3(X, H - 0.12, -b)));
    ridge.push(W(s, p3(X, H + a * 0.95, 0)));
    belly.push(W(s, p3(X, 0.38, b * 0.8)), W(s, p3(X, 0.38, -b * 0.8)));
  }
  const edgeLoop = [...edgeR, ...[...edgeL].reverse()];
  const disc = hull([...edgeLoop, ...ridge]);
  const sil = hull([...edgeLoop, ...ridge, ...belly]);
  // tail
  const tc: P[] = [], tr: number[] = [];
  const sway = 0.25 * Math.sin(s.gait * Math.PI * 2) * s.run;
  for (let i = 0; i <= 8; i++) {
    const u = i / 8;
    tc.push(W(s, p3(-3.1 - 2.5 * u, lerp(0.8, 0.12, u), sway * u * u)));
    tr.push(lerp(0.66, 0.05, Math.pow(u, 0.7)) * (1 + 0.08 * puff) * (0.75 + 0.25 * Math.abs(cy)));
  }
  const tailOut: P[] = [];
  for (let i = 0; i < tc.length; i++) tailOut.push(add(tc[i], mul(perp(nrm(sub(tc[Math.min(tc.length - 1, i + 1)], tc[Math.max(0, i - 1)]))), tr[i])));
  for (let i = tc.length - 1; i >= 0; i--) tailOut.push(add(tc[i], mul(perp(nrm(sub(tc[Math.min(tc.length - 1, i + 1)], tc[Math.max(0, i - 1)]))), -tr[i] * 0.85)));
  const tailD = closed(tailOut, 0.8);
  const tailFront = depth(s, p3(-4.5, 0, 0)) > 0.8; // the tail swings toward the camera when it faces away
  // legs, near/far by the foot's depth
  const legs = [legPose(true, 1, s), legPose(false, 1, s), legPose(true, -1, s), legPose(false, -1, s)];
  const farLegs = legs.filter((g) => depth(s, g.ft) < 0), nearLegs = legs.filter((g) => depth(s, g.ft) >= 0);
  // dorsal pattern
  const blot = (X: number, Z: number, w: number, l: number, k: string) => {
    const pts: P[] = [];
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2, wob = 1 + 0.15 * Math.sin(a * 3 + X * 2);
      pts.push(W(s, dorsal(X + Math.cos(a) * l * wob, Z + Math.sin(a) * w * wob * (a > Math.PI ? 0.8 : 1), puff)));
    }
    const rim: P[] = [];
    for (let i = 0; i <= 6; i++) {
      const a = -Math.PI / 2 + (i / 6) * Math.PI;
      rim.push(W(s, dorsal(X - l * 1.05 - 0.08 * Math.cos(a), Z + Math.sin(a) * w * 1.05, puff)));
    }
    return (
      <g key={k}>
        <path d={open(rim)} stroke={LZ.rim} strokeWidth={0.12} fill="none" strokeLinecap="round" />
        <path d={closed(pts, 0.9)} fill={LZ.blotch} opacity={0.92} />
      </g>
    );
  };
  const blots: React.ReactNode[] = [];
  [[1.35, 0.4, 0.3], [0.35, 0.55, 0.38], [-0.75, 0.6, 0.42], [-1.9, 0.52, 0.38], [-2.85, 0.36, 0.26]].forEach(([X, w, l], i) => {
    for (const sd of [-1, 1]) blots.push(blot(X, sd * Math.min(bodyB(X, puff) * 0.5, 0.55 + w), w, l, `b${i}${sd}`));
  });
  const stripe: P[] = [];
  for (let X = -3.2; X <= 1.9; X += 0.3) stripe.push(W(s, dorsal(X, 0, puff)));
  const spines: React.ReactNode[] = [];
  for (let i = 0; i < 40; i++) {
    const X = -3.0 + hash(i * 3.17) * 4.6;
    const Z = (hash(i * 7.31) * 2 - 1) * bodyB(X, puff) * 0.9;
    const q = W(s, dorsal(X, Z, puff));
    const hgt = 0.1 + 0.08 * hash(i * 1.9), w = 0.08 + 0.03 * hash(i * 5.5);
    spines.push(
      <g key={i}>
        <path d={`M${q.x - w} ${q.y + 0.03} L${q.x + 0.015} ${q.y - hgt} L${q.x + w} ${q.y + 0.03} Z`} fill="#CFA676" stroke={LZ.deep} strokeWidth={sw * 0.45} strokeLinejoin="round" />
        <path d={`M${q.x - w * 0.55} ${q.y + 0.01} L${q.x + 0.01} ${q.y - hgt * 0.85}`} stroke="#F6E6C6" strokeWidth={sw * 0.7} strokeLinecap="round" />
      </g>,
    );
  }
  const fringe: React.ReactNode[] = [];
  for (const sd of [1, -1]) {
    const vis = clamp(sd * cy * 2.5 + 0.35);
    if (vis <= 0.02) continue;
    for (let X = -3.1; X <= 1.55; X += 0.3) {
      const b = bodyB(X, puff), H = bodyH(X, puff);
      const B0 = W(s, p3(X - 0.13, H - 0.14, sd * b * 0.98)), B1 = W(s, p3(X + 0.13, H - 0.14, sd * b * 0.98)), Tp = W(s, p3(X - 0.1, H - 0.26, sd * (b + 0.3)));
      fringe.push(<path key={`${sd}${X}`} d={`M${B0.x} ${B0.y} L${Tp.x} ${Tp.y} L${B1.x} ${B1.y} Z`} fill="#C9A06E" stroke={LZ.deep} strokeWidth={sw * 0.5} strokeLinejoin="round" opacity={vis} />);
    }
  }
  // head: hull of its rings
  const headPts: P[] = [], topPts: P[] = [];
  for (let i = 0; i < HX.length; i++) {
    for (let k = 0; k < 16; k++) {
      const a = (k / 16) * Math.PI * 2;
      const q = p3(HX[i], HH[i] + HA[i] * Math.cos(a), HB[i] * Math.sin(a));
      const w = W(s, H2A(s, q));
      headPts.push(w);
      if (Math.cos(a) > 0.35) topPts.push(w);
    }
  }
  headPts.push(W(s, H2A(s, p3(1.96, -0.17, 0))));
  const headD = closed(hull(headPts), 0.6);
  const topD = closed(hull(topPts), 0.6);
  const headCenterDepth = depth(s, H2A(s, p3(0.6, 0, 0)));
  const horns = HORNS.map((h) => {
    const u = unit3(h.d);
    const b3 = H2A(s, h.b), t3 = H2A(s, p3(h.b.x + u.x * h.len, h.b.h + u.h * h.len, h.b.z + u.z * h.len));
    return {B: W(s, b3), T: W(s, t3), r: h.r * HEAD_S, far: depth(s, b3) < headCenterDepth - 0.05, occ: h.len > 1};
  });
  const eyeF = eyeFrame(s);
  const visSide = cy >= 0 ? 1 : -1;
  const jaw: P[] = [];
  for (let X = 0.0; X <= 1.8; X += 0.18) {
    const r = ringAt(X);
    jaw.push(W(s, H2A(s, p3(X, r.h - r.a * 0.42, visSide * r.b * 0.9))));
  }
  const jawVis = clamp(Math.abs(cy) * 2.5);
  const nostril = W(s, H2A(s, p3(1.66, -0.02, visSide * 0.2)));
  const headFirst = sy < -0.35; // facing away: the head is behind the body
  const eyeGroup = (node: React.ReactNode, key: string, f = eyeF) => (
    <g key={key} transform={`translate(${f.c.x} ${f.c.y}) rotate(${(f.ang * 180) / Math.PI}) scale(${f.mx * f.fs * HEAD_S} ${HEAD_S})`} opacity={f.vis}>
      {node}
    </g>
  );
  const otherF = eyeFrameSide(s, cy >= 0 ? -1 : 1);
  const headNode = (
    <g>
      {horns.filter((h) => h.far).map((h, i) => <Cone key={'f' + i} B={h.B} T={h.T} r={h.r} fill={mix(LZ.horn, LZ.hornDk, 0.35)} dk={LZ.hornDk} sw={sw} />)}
      <path d={headD} fill={`url(#${ids.head})`} stroke={LZ.ink} strokeWidth={sw * 1.6} strokeLinejoin="round" />
      <path d={topD} fill={LZ.lite} opacity={0.5} />
      {jawVis > 0.02 && <path d={open(jaw)} stroke={LZ.ink} strokeWidth={sw * 1.1} fill="none" strokeLinecap="round" opacity={jawVis} />}
      {jawVis > 0.02 && jaw.slice(0, 5).map((q, i) => <path key={i} d={`M${q.x - 0.06} ${q.y + 0.12} L${q.x - 0.06 * eyeF.mx - 0.1 * eyeF.mx} ${q.y + 0.24} L${q.x + 0.05} ${q.y + 0.13} Z`} fill={LZ.shade} stroke={LZ.deep} strokeWidth={sw * 0.4} opacity={jawVis} />)}
      <ellipse cx={nostril.x} cy={nostril.y} rx={0.055} ry={0.04} fill={LZ.ink} />
      {otherF.vis > 0.02 && eyeGroup(<EyeDecal sw={sw / HEAD_S} />, 'dec2', otherF)}
      {otherF.vis > 0.02 && eyeGroup(<Eye e={s.eye} sw={sw / HEAD_S} />, 'eyeo', otherF)}
      {eyeGroup(<EyeDecal sw={sw / HEAD_S} />, 'dec')}
      {eyeGroup(<Eye e={s.eye} sw={sw / HEAD_S} />, 'eye')}
      {section && section({head: hull(headPts), body: sil, eye: eyeF}, 'under')}
      {section && eyeGroup(<Eye e={s.eye} sw={sw / HEAD_S} />, 'eye2')}
      {section && section({head: hull(headPts), body: sil, eye: eyeF}, 'over')}
      {horns.filter((h) => !h.far).map((h, i) => <g key={'n' + i} opacity={h.occ ? 1 : 1 - 0.85 * clamp(cut)}><Cone B={h.B} T={h.T} r={h.r} fill={LZ.horn} dk={LZ.hornDk} sw={sw} /></g>)}
      {eyeGroup(<BloodRun e={s.eye} sw={sw / HEAD_S} t={s.t} />, 'run')}
    </g>
  );
  // the shadow: the body's footprint, offset away from the sun (upper left)
  const fx = Math.hypot(4.6 * cy, 3.2 * sy), fz = SE * Math.hypot(4.6 * sy, 3.2 * cy);
  return (
    <g>
      <defs>
        <linearGradient id={ids.disc} x1="0.2" y1="0" x2="0.5" y2="1">
          <stop offset={0} stopColor={LZ.lite} />
          <stop offset={0.55} stopColor={LZ.top} />
          <stop offset={1} stopColor={LZ.base} />
        </linearGradient>
        <linearGradient id={ids.head} x1="0.1" y1="0" x2="0.4" y2="1">
          <stop offset={0} stopColor={LZ.lite} />
          <stop offset={0.6} stopColor={LZ.base} />
          <stop offset={1} stopColor={LZ.shade} />
        </linearGradient>
        <radialGradient id={ids.sh} cx="0.5" cy="0.5" r="0.5">
          <stop offset={0} stopColor="#2A1608" stopOpacity={0.5} />
          <stop offset={1} stopColor="#2A1608" stopOpacity={0} />
        </radialGradient>
      </defs>
      {shadow && <ellipse cx={s.x + 0.5} cy={s.y + 0.45} rx={fx + 1.0} ry={fz + 0.9} fill={`url(#${ids.sh})`} />}
      {headFirst && headNode}
      {farLegs.map((g, i) => <LegDraw key={'fl' + i} g={g} far s={s} sw={sw} />)}
      {!tailFront && <path d={tailD} fill={LZ.base} stroke={LZ.ink} strokeWidth={sw * 1.4} strokeLinejoin="round" />}
      <path d={closed(sil, 0.5)} fill={LZ.shade} stroke={LZ.ink} strokeWidth={sw * 1.6} strokeLinejoin="round" />
      <path d={closed(disc, 0.5)} fill={`url(#${ids.disc})`} />
      <path d={open(stripe)} stroke={LZ.stripe} strokeWidth={0.22} fill="none" strokeLinecap="round" />
      {blots}
      {spines}
      {fringe}
      {tailFront && <path d={tailD} fill={LZ.base} stroke={LZ.ink} strokeWidth={sw * 1.4} strokeLinejoin="round" />}
      {nearLegs.map((g, i) => <LegDraw key={'nl' + i} g={g} far={false} s={s} sw={sw} />)}
      {!headFirst && headNode}
    </g>
  );
};
