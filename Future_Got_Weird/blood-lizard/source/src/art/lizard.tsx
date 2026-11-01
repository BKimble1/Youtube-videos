// The Texas horned lizard (Phrynosoma cornutum). Units cm, y down, ground at y = 0, facing screen right.
// Built in light 3D and projected from a slightly raised camera (ELEV), so the broad, flattened, round body reads as a
// disc with a fringe of pointed scales along its edge, the crown of horns fans out behind the head, and the legs
// sprawl. X forward, H up, Z toward the camera. Head pitch is an image-plane rotation about the neck.
//
// Exterior: tail, body disc (paired dark blotches with pale rims either side of a pale mid-dorsal stripe, scattered
// conical spines), lateral fringe, sprawled legs with long toes, the head (blunt snout, jaw fringe, dark bars below
// the eye, brow ridge with small spines), two long occipital horns and three temporal horns each side.
// The eye: scaly lids round a gold iris; the lids can swell (pressure) and a small pore at the rear corner of the
// lid opening is where the blood leaves.
import React from 'react';
import {P, add, closed, mul, nrm, open, perp, pt, rot, sub} from '../core/geo';
import {mix} from '../core/color';
import {uid} from '../core/ids';
import {clamp, hash, lerp, noise1, ss} from '../lib';

export const ELEV = (27 * Math.PI) / 180;
const CE = Math.cos(ELEV), SE = Math.sin(ELEV);
type P3 = {x: number; h: number; z: number};
const p3 = (x: number, h: number, z: number): P3 => ({x, h, z});
export const proj = (q: P3): P => pt(q.x, -q.h * CE + q.z * SE);

export const LZ = {
  ink: '#2E1D16', base: '#C99868', lite: '#E2BC8C', top: '#D7AC7A', shade: '#9A6E4A', deep: '#6E4A31',
  blotch: '#5A3626', rim: '#F4E4C2', stripe: '#EED6A8', spine: '#E9CFA2', spineDk: '#A9845A',
  horn: '#F1E2BF', hornDk: '#B99A6C', bar: '#4B2D20', iris: '#D29B3C', irisDk: '#7A4E14', pupil: '#120B08',
  lid: '#C08E60', lidDk: '#86603F', blood: '#8E0E15', bloodDk: '#55060B', bloodLit: '#E4473F',
};

export type EyeState = {
  look: number;   // pupil shift toward the rear (+) / front (-), -1..1
  blink: number;  // 0 open .. 1 closed
  bulge: number;  // lid swelling from sinus pressure 0..1
  blood: number;  // blood run down the cheek from the pore 0..1
  wet: number;    // fresh blood at the pore 0..1
};
export type LizardState = {
  x: number; y: number;  // root (ground point under the body centre), world
  rot: number;           // body rotation in the image plane (rad, + = nose down), about the root
  head: number;          // head pitch (rad, - = raised)
  puff: number;          // 0..1 inflation (defensive)
  gait: number;          // gait phase (cycles)
  run: number;           // 0..1 running legs
  dangle: number;        // 0..1 legs hang (held up)
  flinch: number;        // brief squash (0..1)
  eye: EyeState;
  t: number;
};

// ---------------------------------------------------------------- body
const NECK = p3(2.15, 1.3, 0);
export const HEAD_S = 1.16;
const bodyB = (X: number, puff: number) => {
  const u = (X + 0.45) / 2.95;
  const disc = 2.9 * Math.pow(Math.max(0, 1 - u * u), 0.42);
  const k = ss(X, 1.35, 2.3);
  return lerp(disc, Math.max(disc, 1.0), k) * (1 + 0.1 * puff);
};
const bodyA = (X: number, puff: number) => {
  const u = (X + 0.45) / 2.95;
  return (0.18 + 0.4 * Math.pow(Math.max(0, 1 - u * u), 0.35)) * (1 + 0.2 * puff);
};
const bodyH = (X: number, puff: number) => 0.86 + 0.08 * Math.exp(-(((X + 0.3) / 2.0) ** 2)) + 0.12 * puff;
const BX: number[] = [];
for (let x = -3.42; x <= 2.5; x += 0.2) BX.push(x);
const R = (a: number, b: number) => Math.sqrt((a * CE) ** 2 + (b * SE) ** 2);
/** a point on the dorsal surface at (X, Z) */
const dorsal = (X: number, Z: number, puff: number): P3 => {
  const b = bodyB(X, puff), a = bodyA(X, puff);
  const q = clamp(Math.abs(Z) / Math.max(0.01, b));
  return p3(X, bodyH(X, puff) + a * Math.sqrt(Math.max(0, 1 - q * q)) - 0.05, Z);
};

// ---------------------------------------------------------------- head (local to the neck, before pitch)
const HX = [-0.38, 0.05, 0.5, 0.92, 1.28, 1.55, 1.74, 1.84];
const HH = [0.14, 0.16, 0.12, 0.05, -0.03, -0.09, -0.14, -0.17];
const HA = [0.5, 0.56, 0.54, 0.47, 0.38, 0.29, 0.19, 0.09];
const HB = [1.05, 1.18, 1.1, 0.9, 0.68, 0.48, 0.3, 0.12];
const headRing = (i: number) => ({X: HX[i], c: proj(p3(HX[i], HH[i], 0)), r: R(HA[i], HB[i])});
/** silhouette of the head (local, projected) */
export const headOutline = () => {
  const top: P[] = [], bot: P[] = [];
  for (let i = 0; i < HX.length; i++) {
    const {c, r} = headRing(i);
    top.push(pt(c.x, c.y - r));
    bot.push(pt(c.x, c.y + r * 0.92));
  }
  const tip = pt(HX[HX.length - 1] + 0.12, proj(p3(0, HH[HH.length - 1], 0)).y + 0.02);
  return [...top, tip, ...bot.reverse()];
};
export const EYE_L = proj(p3(0.78, 0.3, 0.8)); // eye centre (head local, projected)
export const EYE_R = 0.25;
/** the pore at the rear, upper corner of the lid opening (head local) */
export const PORE_L = add(EYE_L, pt(-0.27, -0.16));
/** the direction the blood leaves the pore (head local, unit) */
export const PORE_DIR = nrm(pt(-0.5, -0.87));

/** horns: base, tip, base radius (head local 3D) */
const HORNS: {b: P3; d: P3; len: number; r: number; side: number}[] = [];
for (const s of [-1, 1]) {
  HORNS.push({b: p3(-0.22, 0.52, 0.3 * s), d: p3(-0.5, 0.84, 0.22 * s), len: 1.02, r: 0.15, side: s});
  HORNS.push({b: p3(-0.05, 0.42, 0.86 * s), d: p3(-0.7, 0.52, 0.48 * s), len: 0.78, r: 0.12, side: s});
  HORNS.push({b: p3(-0.18, 0.16, 1.02 * s), d: p3(-0.86, 0.2, 0.46 * s), len: 0.64, r: 0.11, side: s});
  HORNS.push({b: p3(-0.24, -0.12, 0.96 * s), d: p3(-0.9, -0.06, 0.42 * s), len: 0.48, r: 0.095, side: s});
}
const unit3 = (q: P3) => {
  const l = Math.hypot(q.x, q.h, q.z) || 1;
  return p3(q.x / l, q.h / l, q.z / l);
};
const Cone: React.FC<{b: P3; d: P3; len: number; r: number; fill: string; dk: string; sw: number}> = ({b, d, len, r, fill, dk, sw}) => {
  const u = unit3(d);
  const B = proj(b), Tp = proj(p3(b.x + u.x * len, b.h + u.h * len, b.z + u.z * len));
  const ax = nrm(sub(Tp, B));
  const n = perp(ax);
  const L = add(B, mul(n, r)), Rr = add(B, mul(n, -r));
  const mid = add(B, mul(sub(Tp, B), 0.55));
  const d0 = `M${L.x} ${L.y} Q${add(mid, mul(n, r * 0.55)).x} ${add(mid, mul(n, r * 0.55)).y} ${Tp.x} ${Tp.y} Q${add(mid, mul(n, -r * 0.55)).x} ${add(mid, mul(n, -r * 0.55)).y} ${Rr.x} ${Rr.y} Z`;
  // shade the lower side (light from upper left)
  const lower = n.y > 0 ? 1 : -1;
  const S = add(B, mul(n, r * lower));
  const d1 = `M${B.x} ${B.y} L${S.x} ${S.y} Q${add(mid, mul(n, r * 0.55 * lower)).x} ${add(mid, mul(n, r * 0.55 * lower)).y} ${Tp.x} ${Tp.y} Z`;
  return (
    <g>
      <path d={d0} fill={fill} stroke={LZ.ink} strokeWidth={sw} strokeLinejoin="round" />
      <path d={d1} fill={dk} opacity={0.75} />
      <path d={`M${add(B, mul(n, -r * 0.45 * lower)).x} ${add(B, mul(n, -r * 0.45 * lower)).y} L${add(Tp, mul(ax, -len * 0.25)).x} ${add(Tp, mul(ax, -len * 0.25)).y}`} stroke="#FFF8E6" strokeWidth={sw * 0.9} opacity={0.6} strokeLinecap="round" />
    </g>
  );
};

// ---------------------------------------------------------------- legs
type Leg = {sh: P3; el: P3; wr: P3; ft: P3; toes: number; front: boolean; side: number};
const legPose = (front: boolean, side: number, s: LizardState): Leg => {
  const X0 = front ? 1.55 : -2.2;
  const ph = s.gait + (front ? 0 : 0.5) + (side > 0 ? 0 : 0.5);
  const f = ((ph % 1) + 1) % 1;
  const stance = f < 0.62;
  const u = stance ? f / 0.62 : (f - 0.62) / 0.38;
  const L = 1.3 * s.run;
  const dx = stance ? lerp(L / 2, -L / 2, u) : lerp(-L / 2, L / 2, ss(u, 0, 1));
  const lift = stance ? 0 : 0.55 * Math.sin(Math.PI * u) * s.run;
  const z = side;
  const zb = bodyB(X0, s.puff) * 0.62;
  const sh = p3(X0, bodyH(X0, s.puff) - 0.2, z * zb);
  let ft = p3(X0 + (front ? 0.45 : -0.3) + dx, lift, z * (zb + 1.15));
  let el = p3(X0 + (front ? -0.1 : 0.5) + dx * 0.4, bodyH(X0, s.puff) + (side < 0 ? -0.3 : 0.12) + lift * 0.4, z * (zb + (side < 0 ? 0.7 : 0.95)));
  // hanging (held): the limbs fall below the body and splay
  if (s.dangle > 0) {
    const sw = 0.25 * Math.sin(s.t * 9 + (front ? 0 : 1.7) + side);
    const ftH = p3(X0 + (front ? 0.5 : -0.5) + sw, bodyH(X0, s.puff) - 1.45, z * (bodyB(X0, s.puff) * 0.72 + 0.7));
    const elH = p3(X0 + (front ? 0.25 : -0.1), bodyH(X0, s.puff) - 0.55, z * (bodyB(X0, s.puff) * 0.72 + 0.9));
    ft = p3(lerp(ft.x, ftH.x, s.dangle), lerp(ft.h, ftH.h, s.dangle), lerp(ft.z, ftH.z, s.dangle));
    el = p3(lerp(el.x, elH.x, s.dangle), lerp(el.h, elH.h, s.dangle), lerp(el.z, elH.z, s.dangle));
  }
  const wr = p3(lerp(el.x, ft.x, 0.82), lerp(el.h, ft.h, 0.82) + 0.12, lerp(el.z, ft.z, 0.82));
  return {sh, el, wr, ft, toes: 5, front, side};
};
const LegDraw: React.FC<{g: Leg; far: boolean; s: LizardState; sw: number}> = ({g, far, s, sw}) => {
  const S = proj(g.sh), E = proj(g.el), Wr = proj(g.wr), F = proj(g.ft);
  const r0 = 0.36, r1 = 0.26, r2 = 0.17;
  const upper = tubeD([S, E], [r0, r1]);
  const lower = tubeD([E, Wr], [r1, r2]);
  const fill = far ? mix(LZ.shade, LZ.deep, 0.35) : LZ.base;
  const fwd = g.front ? 1 : -0.35;
  const toes: React.ReactNode[] = [];
  for (let k = 0; k < 5; k++) {
    const a = (g.front ? -0.95 : -1.35) + k * (g.front ? 0.42 : 0.5);
    const len = [0.38, 0.55, 0.66, 0.6, 0.42][k] * (g.front ? 1 : 1.15);
    const d = rot(pt(fwd >= 0 ? 1 : -1, 0), a * (fwd >= 0 ? 1 : -1));
    const dd = pt(d.x, d.y * 0.42 + (s.dangle > 0.5 ? 0.6 : 0));
    const tip = add(F, mul(nrm(dd), len));
    toes.push(<path key={k} d={`M${F.x} ${F.y} L${tip.x} ${tip.y}`} stroke={far ? LZ.deep : LZ.ink} strokeWidth={sw * 2.2} strokeLinecap="round" />);
    toes.push(<path key={'f' + k} d={`M${F.x} ${F.y} L${tip.x} ${tip.y}`} stroke={fill} strokeWidth={sw * 1.05} strokeLinecap="round" />);
  }
  return (
    <g>
      <path d={upper} fill={fill} stroke={LZ.ink} strokeWidth={sw} strokeLinejoin="round" />
      <path d={lower} fill={fill} stroke={LZ.ink} strokeWidth={sw} strokeLinejoin="round" />
      <path d={`M${Wr.x} ${Wr.y} L${F.x} ${F.y}`} stroke={LZ.ink} strokeWidth={0.36 + sw} strokeLinecap="round" />
      <path d={`M${Wr.x} ${Wr.y} L${F.x} ${F.y}`} stroke={fill} strokeWidth={0.36 - sw * 0.2} strokeLinecap="round" />
      {toes}
      {!far && <path d={open([add(S, pt(0.05, -0.18)), add(E, pt(0.02, -0.12))])} stroke={LZ.lite} strokeWidth={sw * 1.4} opacity={0.6} strokeLinecap="round" fill="none" />}
    </g>
  );
};
const tubeD = (C: P[], r: number[]) => {
  const t = nrm(sub(C[1], C[0])), n = perp(t);
  const a = add(C[0], mul(n, r[0])), b = add(C[1], mul(n, r[1])), c = add(C[1], mul(n, -r[1])), d = add(C[0], mul(n, -r[0]));
  const e1 = add(C[1], mul(t, r[1] * 0.9)), e0 = add(C[0], mul(t, -r[0] * 0.9));
  return `M${a.x} ${a.y} L${b.x} ${b.y} Q${e1.x + n.x * r[1]} ${e1.y + n.y * r[1]} ${e1.x} ${e1.y} Q${e1.x - n.x * r[1]} ${e1.y - n.y * r[1]} ${c.x} ${c.y} L${d.x} ${d.y} Q${e0.x - n.x * r[0]} ${e0.y - n.y * r[0]} ${e0.x} ${e0.y} Q${e0.x + n.x * r[0]} ${e0.y + n.y * r[0]} ${a.x} ${a.y} Z`;
};

// ---------------------------------------------------------------- frames for the rest of the film
/** the lizard's local (projected) point -> world */
export const lzWorld = (s: LizardState, q: P) => add(pt(s.x, s.y), rot(q, s.rot));
const neckP = (s: LizardState) => proj(p3(NECK.x, NECK.h + 0.1 * s.puff, 0));
/** a head-local point -> lizard local */
export const headToLocal = (s: LizardState, q: P) => add(neckP(s), rot(mul(q, HEAD_S), s.head));
export const headToWorld = (s: LizardState, q: P) => lzWorld(s, headToLocal(s, q));
export const eyeWorld = (s: LizardState) => headToWorld(s, EYE_L);
export const poreWorld = (s: LizardState) => headToWorld(s, PORE_L);
export const poreDirWorld = (s: LizardState) => rot(PORE_DIR, s.head + s.rot);
/** the head group's world transform: [translate, rotate(rad)] */
export const headFrame = (s: LizardState) => ({o: headToWorld(s, pt(0, 0)), a: s.rot + s.head});
/** a point on the back (X along the body) in world, for holding */
export const backWorld = (s: LizardState, X: number) => lzWorld(s, proj(dorsal(X, 0, s.puff)));

// ---------------------------------------------------------------- the eye (head local)
export const Eye: React.FC<{e: EyeState; sw: number}> = ({e, sw}) => {
  const E = EYE_L;
  const r = EYE_R;
  const bl = clamp(e.blink);
  const bu = clamp(e.bulge);
  const ids = {clip: uid('ec'), ir: uid('ei')};
  // lid opening (almond), tilted slightly up at the rear
  const open_ = 1 - bl;
  const lidO = (k: number) => {
    const pts: P[] = [];
    for (let i = 0; i <= 16; i++) {
      const a = (i / 16) * Math.PI * 2;
      const x = Math.cos(a) * r * 1.12;
      const yy = Math.sin(a) * r * (a < Math.PI ? 0.78 : 0.86) * k;
      pts.push(add(E, rot(pt(x, yy), -0.12)));
    }
    return closed(pts, 0.9);
  };
  const lidRing = (k: number) => {
    const pts: P[] = [];
    for (let i = 0; i <= 20; i++) {
      const a = (i / 20) * Math.PI * 2;
      const rr = r * (1.62 + 0.32 * bu + 0.05 * Math.sin(a * 5));
      pts.push(add(E, rot(pt(Math.cos(a) * rr * 1.08, Math.sin(a) * rr * k), -0.12)));
    }
    return closed(pts, 0.9);
  };
  const look = e.look * r * 0.22;
  const swell = mix(LZ.lid, '#C9645A', 0.55 * bu);
  return (
    <g>
      <defs>
        <clipPath id={ids.clip}><path d={lidO(Math.max(0.02, open_))} /></clipPath>
        <radialGradient id={ids.ir} cx="0.42" cy="0.38" r="0.62">
          <stop offset={0} stopColor="#F4C866" />
          <stop offset={0.55} stopColor={LZ.iris} />
          <stop offset={1} stopColor={LZ.irisDk} />
        </radialGradient>
      </defs>
      {/* the swollen lid mound */}
      <path d={lidRing(0.92)} fill={swell} stroke={LZ.ink} strokeWidth={sw * 0.9} />
      <path d={lidRing(0.92)} fill="none" stroke={mix(LZ.lidDk, '#7E2A2A', bu * 0.6)} strokeWidth={sw * 2.2} opacity={0.35} transform={`translate(${0.04} ${0.05})`} />
      {/* lid scales */}
      {Array.from({length: 14}, (_, i) => {
        const a = (i / 14) * Math.PI * 2;
        const rr = r * (1.38 + 0.25 * bu);
        const q = add(E, rot(pt(Math.cos(a) * rr * 1.08, Math.sin(a) * rr * 0.92), -0.12));
        return <circle key={i} cx={q.x} cy={q.y} r={r * 0.13} fill={mix(swell, '#FFF0D6', 0.25)} opacity={0.55} />;
      })}
      <path d={lidO(Math.max(0.02, open_))} fill={LZ.pupil} stroke={LZ.ink} strokeWidth={sw} />
      <g clipPath={`url(#${ids.clip})`}>
        <circle cx={E.x + look} cy={E.y} r={r * 0.93} fill={`url(#${ids.ir})`} />
        <circle cx={E.x + look} cy={E.y} r={r * 0.93} fill="none" stroke={LZ.irisDk} strokeWidth={sw * 1.4} opacity={0.6} />
        <circle cx={E.x + look} cy={E.y + 0.01} r={r * 0.42} fill={LZ.pupil} />
        <ellipse cx={E.x + look - r * 0.3} cy={E.y - r * 0.32} rx={r * 0.2} ry={r * 0.14} fill="#FFFFFF" opacity={0.9} />
        <path d={`M${E.x - r * 1.2} ${E.y - r * 0.55} Q${E.x} ${E.y - r * 0.95} ${E.x + r * 1.2} ${E.y - r * 0.55} L${E.x + r * 1.2} ${E.y - r * 1.2} L${E.x - r * 1.2} ${E.y - r * 1.2} Z`} fill="#000" opacity={0.28} />
      </g>
      {/* lid margin and the pore */}
      <path d={lidO(Math.max(0.02, open_))} fill="none" stroke={mix(LZ.lidDk, '#5A1A16', bu)} strokeWidth={sw * 1.6} />
      <circle cx={PORE_L.x} cy={PORE_L.y} r={0.035 + 0.02 * bu} fill={LZ.bloodDk} opacity={0.35 + 0.65 * Math.max(bu, e.wet)} />
    </g>
  );
};

// ---------------------------------------------------------------- the lizard
export const Lizard: React.FC<{s: LizardState; sw?: number; interior?: (clipD: string) => React.ReactNode; reveal?: number; shadow?: boolean}> = ({s, sw = 0.05, interior, reveal = 0, shadow = true}) => {
  const puff = clamp(s.puff);
  const ids = {disc: uid('ld'), head: uid('lh'), sh: uid('ls'), hclip: uid('lc')};
  // body silhouette (top along the far side, bottom along the near flank)
  const top: P[] = [], bot: P[] = [], edge: P[] = [];
  for (const X of BX) {
    const c = proj(p3(X, bodyH(X, puff), 0));
    const rr = R(bodyA(X, puff), bodyB(X, puff));
    top.push(pt(X, c.y - rr));
    bot.push(pt(X, c.y + rr * 0.97));
    edge.push(proj(p3(X, bodyH(X, puff) - 0.12, bodyB(X, puff))));
  }
  const bodyD = closed([...top, ...[...bot].reverse()], 0.7);
  // the body silhouette in head-local coordinates, so a cutaway inside the head can continue into the neck
  const toHead = (q: P) => mul(rot(sub(q, neckP(s)), -s.head), 1 / HEAD_S);
  const bodyInHead = closed([...top, ...[...bot].reverse()].map(toHead), 0.7);
  const discD = closed([...top, ...[...edge].reverse()], 0.7);
  // tail: tapering from the rear of the body, lying along the ground with a slight sway
  const sway = 0.25 * Math.sin(s.gait * Math.PI * 2) * s.run;
  const tc: P[] = [], tr: number[] = [];
  for (let i = 0; i <= 8; i++) {
    const u = i / 8;
    const X = -3.1 - 2.5 * u;
    const H = lerp(0.8, 0.12, u) - (s.dangle > 0 ? 0.9 * s.dangle * u * u : 0);
    tc.push(proj(p3(X, H, sway * u * u + 0.25 * u)));
    tr.push(lerp(0.66, 0.05, Math.pow(u, 0.7)) * (1 + 0.08 * puff));
  }
  const tailOut: P[] = [];
  for (let i = 0; i < tc.length; i++) {
    const tg = nrm(sub(tc[Math.min(tc.length - 1, i + 1)], tc[Math.max(0, i - 1)]));
    tailOut.push(add(tc[i], mul(perp(tg), tr[i])));
  }
  for (let i = tc.length - 1; i >= 0; i--) {
    const tg = nrm(sub(tc[Math.min(tc.length - 1, i + 1)], tc[Math.max(0, i - 1)]));
    tailOut.push(add(tc[i], mul(perp(tg), -tr[i] * 0.85)));
  }
  const tailD = closed(tailOut, 0.8);
  // legs
  const legs = [legPose(true, -1, s), legPose(false, -1, s), legPose(true, 1, s), legPose(false, 1, s)];
  // dorsal pattern: paired blotches with pale rear rims, stripe, spines
  const blot = (X: number, Z: number, w: number, l: number, k: string) => {
    const pts: P[] = [];
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      const wob = 1 + 0.15 * Math.sin(a * 3 + X * 2);
      pts.push(proj(dorsal(X + Math.cos(a) * l * wob, Z + Math.sin(a) * w * wob * (a > Math.PI ? 0.8 : 1), puff)));
    }
    const rim: P[] = [];
    for (let i = 0; i <= 6; i++) {
      const a = -Math.PI / 2 + (i / 6) * Math.PI;
      rim.push(proj(dorsal(X - l * 1.05 - 0.08 * Math.cos(a), Z + Math.sin(a) * w * 1.05, puff)));
    }
    return (
      <g key={k}>
        <path d={open(rim)} stroke={LZ.rim} strokeWidth={0.12} fill="none" strokeLinecap="round" opacity={0.95} />
        <path d={closed(pts, 0.9)} fill={LZ.blotch} opacity={0.92} />
      </g>
    );
  };
  const blots: React.ReactNode[] = [];
  [[1.35, 0.4, 0.3], [0.35, 0.55, 0.38], [-0.75, 0.6, 0.42], [-1.9, 0.52, 0.38], [-2.85, 0.36, 0.26]].forEach(([X, w, l], i) => {
    for (const sd of [-1, 1]) {
      const b = bodyB(X, puff);
      blots.push(blot(X, sd * Math.min(b * 0.5, 0.55 + w), w, l, `b${i}${sd}`));
    }
  });
  const stripe: P[] = [];
  for (let X = -3.2; X <= 1.9; X += 0.3) stripe.push(proj(dorsal(X, 0, puff)));
  const spines: React.ReactNode[] = [];
  for (let i = 0; i < 40; i++) {
    const X = -3.0 + hash(i * 3.17) * 4.6;
    const b = bodyB(X, puff);
    const Z = (hash(i * 7.31) * 2 - 1) * b * 0.9;
    const q = proj(dorsal(X, Z, puff));
    const hgt = 0.1 + 0.08 * hash(i * 1.9);
    const w = 0.08 + 0.03 * hash(i * 5.5);
    spines.push(
      <g key={i}>
        <path d={`M${q.x - w} ${q.y + 0.03} L${q.x + 0.015} ${q.y - hgt} L${q.x + w} ${q.y + 0.03} Z`} fill="#CFA676" stroke={LZ.deep} strokeWidth={sw * 0.45} strokeLinejoin="round" />
        <path d={`M${q.x - w * 0.55} ${q.y + 0.01} L${q.x + 0.01} ${q.y - hgt * 0.85}`} stroke="#F6E6C6" strokeWidth={sw * 0.7} strokeLinecap="round" />
      </g>,
    );
  }
  // fringe: two rows of pointed scales along the near edge
  const fringe: React.ReactNode[] = [];
  for (let X = -3.1; X <= 1.55; X += 0.3) {
    const b = bodyB(X, puff);
    const B0 = proj(p3(X - 0.13, bodyH(X, puff) - 0.14, b * 0.98));
    const B1 = proj(p3(X + 0.13, bodyH(X, puff) - 0.14, b * 0.98));
    const Tp = proj(p3(X - 0.1, bodyH(X, puff) - 0.26, b + 0.3));
    fringe.push(<path key={X} d={`M${B0.x} ${B0.y} L${Tp.x} ${Tp.y} L${B1.x} ${B1.y} Z`} fill="#C9A06E" stroke={LZ.deep} strokeWidth={sw * 0.5} strokeLinejoin="round" />);
  }
  // head (local, projected)
  const hOut = headOutline();
  const headD = closed(hOut, 0.65);
  const N = neckP(s);
  const farHorns = HORNS.filter((h) => h.side < 0 && h.len < 1);
  const nearHorns = HORNS.filter((h) => h.side > 0);
  const occ = HORNS.filter((h) => h.len > 1);
  // jaw line and fringe of the jaw
  const jaw: P[] = [];
  for (let X = 0.0; X <= 1.8; X += 0.18) {
    const i = Math.min(HX.length - 2, HX.findIndex((v) => v > X) - 1);
    const u = clamp((X - HX[i]) / (HX[i + 1] - HX[i]));
    const b = lerp(HB[i], HB[i + 1], u), hh = lerp(HH[i], HH[i + 1], u), a = lerp(HA[i], HA[i + 1], u);
    jaw.push(proj(p3(X, hh - a * 0.42, b * 0.9)));
  }
  const jawSp: React.ReactNode[] = jaw.slice(0, 5).filter((_, i) => i % 1 === 0).map((q, i) => (
    <path key={i} d={`M${q.x - 0.06} ${q.y + 0.12} L${q.x - 0.16} ${q.y + 0.24} L${q.x + 0.05} ${q.y + 0.13} Z`} fill={LZ.shade} stroke={LZ.deep} strokeWidth={sw * 0.4} strokeLinejoin="round" />
  ));
  const E = EYE_L;
  const fl = 1 - 0.06 * s.flinch;
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
        <clipPath id={ids.hclip}><path d={headD} /></clipPath>
      </defs>
      {shadow && <ellipse cx={s.x + 0.5} cy={0.55} rx={5.6 * (1 - 0.5 * s.dangle)} ry={1.6} fill={`url(#${ids.sh})`} opacity={1 - 0.8 * s.dangle} />}
      <g transform={`translate(${s.x} ${s.y}) rotate(${(s.rot * 180) / Math.PI}) scale(1 ${fl})`}>
        {/* far legs */}
        {legs.slice(0, 2).map((g, i) => <LegDraw key={i} g={g} far s={s} sw={sw} />)}
        {/* tail */}
        <path d={tailD} fill={LZ.base} stroke={LZ.ink} strokeWidth={sw * 1.4} strokeLinejoin="round" />
        {[0.25, 0.45, 0.65, 0.82].map((u, i) => {
          const k = Math.round(u * 8);
          const c = tc[k];
          return <ellipse key={i} cx={c.x} cy={c.y - tr[k] * 0.2} rx={0.16} ry={tr[k] * 0.6} fill={LZ.blotch} opacity={0.75} />;
        })}
        {/* body */}
        <path d={bodyD} fill={LZ.shade} stroke={LZ.ink} strokeWidth={sw * 1.6} strokeLinejoin="round" />
        <path d={discD} fill={`url(#${ids.disc})`} />
        <path d={open(stripe)} stroke={LZ.stripe} strokeWidth={0.22} fill="none" strokeLinecap="round" />
        {blots}
        {spines}
        {fringe}
        {/* near legs */}
        {legs.slice(2).map((g, i) => <LegDraw key={i} g={g} far={false} s={s} sw={sw} />)}
        {/* head */}
        <g transform={`translate(${N.x} ${N.y}) rotate(${(s.head * 180) / Math.PI}) scale(${HEAD_S})`}>
          {farHorns.map((h, i) => <Cone key={i} b={h.b} d={h.d} len={h.len} r={h.r} fill={mix(LZ.horn, LZ.hornDk, 0.35)} dk={LZ.hornDk} sw={sw} />)}
          <path d={headD} fill={`url(#${ids.head})`} stroke={LZ.ink} strokeWidth={sw * 1.6} strokeLinejoin="round" />
          <g clipPath={`url(#${ids.hclip})`}>
            {/* top of the head, lighter and scaly */}
            <path d={closed([...hOut.slice(0, HX.length), ...HX.map((x, i) => proj(p3(x, HH[i] + HA[i] * 0.35, HB[i] * 0.72))).reverse()], 0.7)} fill={LZ.lite} opacity={0.55} />
            {/* dark bars below and behind the eye */}
            <path d={`M${E.x - 0.12} ${E.y + 0.2} L${E.x - 0.42} ${E.y + 0.95} L${E.x - 0.16} ${E.y + 0.98} L${E.x + 0.06} ${E.y + 0.24} Z`} fill={LZ.bar} opacity={0.85} />
            <path d={`M${E.x + 0.2} ${E.y + 0.18} L${E.x + 0.32} ${E.y + 0.9} L${E.x + 0.5} ${E.y + 0.85} L${E.x + 0.36} ${E.y + 0.16} Z`} fill={LZ.bar} opacity={0.6} />
            <path d={`M${E.x - 0.32} ${E.y - 0.06} L${E.x - 1.15} ${E.y - 0.18} L${E.x - 1.12} ${E.y + 0.06} L${E.x - 0.32} ${E.y + 0.12} Z`} fill={LZ.bar} opacity={0.55} />
            {/* the lower side in shade */}
            <path d={open(jaw)} stroke={LZ.shade} strokeWidth={0.5} fill="none" opacity={0.55} transform="translate(0 0.22)" />
            {Array.from({length: 26}, (_, i) => {
              const x = -0.3 + hash(i * 4.1) * 2.0, y = -0.7 + hash(i * 8.3) * 1.2;
              return <circle key={i} cx={x} cy={y} r={0.045 + 0.03 * hash(i)} fill={hash(i * 2.2) > 0.5 ? LZ.lite : LZ.shade} opacity={0.45} />;
            })}
          </g>
          <path d={open(jaw)} stroke={LZ.ink} strokeWidth={sw * 1.1} fill="none" strokeLinecap="round" />
          {jawSp}
          {/* nostril */}
          <ellipse cx={1.62} cy={-0.16} rx={0.055} ry={0.04} fill={LZ.ink} />
          {/* brow ridge with small spines */}
          <path d={`M${E.x - 0.5} ${E.y - 0.34} Q${E.x} ${E.y - 0.62} ${E.x + 0.5} ${E.y - 0.36}`} stroke={LZ.ink} strokeWidth={sw * 1.2} fill="none" />
          {[-0.32, 0, 0.3].map((dx, i) => (
            <path key={i} d={`M${E.x + dx - 0.07} ${E.y - 0.46} L${E.x + dx - 0.05} ${E.y - 0.64} L${E.x + dx + 0.07} ${E.y - 0.46} Z`} fill="#DDBB8C" stroke={LZ.deep} strokeWidth={sw * 0.5} strokeLinejoin="round" />
          ))}
          <Eye e={s.eye} sw={sw} />
          {interior && interior(`${headD} ${bodyInHead}`)}
          {occ.map((h, i) => <Cone key={'o' + i} b={h.b} d={h.d} len={h.len} r={h.r} fill={LZ.horn} dk={LZ.hornDk} sw={sw} />)}
          {nearHorns.filter((h) => h.len < 1).map((h, i) => <g key={'g' + i} opacity={1 - 0.88 * clamp(reveal)}><Cone key={'n' + i} b={h.b} d={h.d} len={h.len} r={h.r} fill={LZ.horn} dk={LZ.hornDk} sw={sw} /></g>)}
          {reveal < 0.98 && <g opacity={1 - clamp(reveal)}><BloodRun e={s.eye} sw={sw} t={s.t} /></g>}
        </g>
      </g>
    </g>
  );
};

/** blood that has run from the pore down the cheek (head local) */
const BloodRun: React.FC<{e: EyeState; sw: number; t: number}> = ({e, sw, t}) => {
  const b = clamp(e.blood);
  const w = clamp(e.wet);
  if (b <= 0.001 && w <= 0.001) return null;
  const P0 = PORE_L;
  const len = 0.62 * b;
  const pts = [P0, add(P0, pt(-0.06, len * 0.3)), add(P0, pt(-0.03 + 0.02 * noise1(t), len * 0.7)), add(P0, pt(-0.01, len))];
  const drop = add(P0, pt(-0.01, len + 0.03));
  return (
    <g>
      {b > 0.01 && (
        <>
          <path d={open(pts)} stroke={LZ.bloodDk} strokeWidth={0.07 + sw * 0.6} fill="none" strokeLinecap="round" />
          <path d={open(pts)} stroke={LZ.blood} strokeWidth={0.05} fill="none" strokeLinecap="round" />
          <circle cx={drop.x} cy={drop.y} r={0.055 * Math.min(1, b * 2)} fill={LZ.blood} stroke={LZ.bloodDk} strokeWidth={sw * 0.5} />
          <circle cx={drop.x - 0.03} cy={drop.y - 0.03} r={0.025} fill={LZ.bloodLit} opacity={0.8} />
        </>
      )}
      {w > 0.01 && <circle cx={P0.x} cy={P0.y} r={0.07 * w} fill={LZ.blood} stroke={LZ.bloodDk} strokeWidth={sw * 0.5} />}
    </g>
  );
};
