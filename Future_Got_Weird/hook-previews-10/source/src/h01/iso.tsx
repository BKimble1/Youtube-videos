// Cymothoa exigua, adult female (cymothoid isopod), modelled in its own millimetres: ix forward (head), iy to its left,
// iz up (dorsal); origin on the belly under pereonite 4. About 31 mm long and 16 mm wide: a small cephalon with two
// dark compound eyes at its sides and two pairs of short antennae; seven dorsally convex pereonites (the first wraps
// forward round the head, 2-7 carry small coxal plates); five short pleonites; a broad rounded pleotelson with a
// uropod on each side. Seven pairs of short prehensile pereopods with strongly curved dactyli (1-3 point forward,
// 4-7 back). A buccal cone of piercing mouthparts sits under the head.
import React from 'react';
import {capsule2, hull, smoothClosed, smoothOpen, V2, V3} from '../shared/three';
import {Deco, Inked, INK} from '../shared/ink';
import {clamp, lerp, noise1} from '../shared/lib';
import {Ctx, f2, facing, PJ, poly} from './geo';
import {lit, mix, RadG, shade, LIGHT} from './paint';

const R = Math.PI / 180;
export type IsoPose = {
  ox: number; oz: number; tilt: number; // placement in jaw-local coords (tilt: nose up, deg)
  curl: number; sway: number; nod: number; breathe: number;
  t: number; flex: number; // flex 0..1: how strongly legs re-grip
  cone: number; // 0..1 visibility/extension of the buccal cone
  front: {fx: number; top: number; w: number}; // where the front claws clamp (the tongue base / stub) in jaw coords
  lift: number[]; // per-leg extra lift 0..1 (re-grip moves)
};

// body stations: ix, half-width, height, front lobe (how far the sides reach forward)
type St = {x: number; w: number; h: number; lobe?: number};
const CEPH: St[] = [{x: 15.2, w: 1.2, h: 1.0}, {x: 14.5, w: 2.3, h: 1.9}, {x: 13.2, w: 2.9, h: 2.5}, {x: 11.6, w: 2.9, h: 2.6}];
const PER: [St, St][] = [
  [{x: 11.6, w: 4.6, h: 3.3, lobe: 1.8}, {x: 8.4, w: 6.5, h: 4.9}],
  [{x: 8.4, w: 6.55, h: 4.75}, {x: 5.6, w: 7.3, h: 5.6}],
  [{x: 5.6, w: 7.35, h: 5.5}, {x: 2.6, w: 7.85, h: 6.0}],
  [{x: 2.6, w: 7.9, h: 5.9}, {x: -0.6, w: 8.05, h: 6.1}],
  [{x: -0.6, w: 8.05, h: 6.0}, {x: -3.8, w: 7.85, h: 5.7}],
  [{x: -3.8, w: 7.85, h: 5.6}, {x: -6.8, w: 7.2, h: 4.9}],
  [{x: -6.8, w: 7.2, h: 4.8}, {x: -9.4, w: 6.0, h: 3.7}],
];
const PLEON: [St, St][] = [0, 1, 2, 3, 4].map((i) => {
  const x0 = -9.0 - i * 0.6, x1 = x0 - 0.75;
  return [{x: x0, w: 4.9 - i * 0.12, h: 3.1 - i * 0.12}, {x: x1, w: 4.85 - i * 0.12, h: 2.95 - i * 0.12}];
});
const TELSON: St[] = [{x: -12.0, w: 4.5, h: 2.5}, {x: -13.2, w: 4.6, h: 2.2}, {x: -14.6, w: 3.9, h: 1.6}, {x: -15.6, w: 2.4, h: 0.9}, {x: -16.0, w: 0.8, h: 0.4}];
export const ISO_LEN = 31.2;

const COL = '#DDC196', COL_TEL = '#CBA676', COL_LEG = '#E8D3AE', COL_CLAW = '#8A5426';

/** body deformation: rear curl and sway, head nod, breathing */
const deform = (P0: IsoPose, p: V3): V3 => {
  let [x, y, z] = p;
  const r = Math.max(0, -(x - 1) / 15);
  z += P0.curl * r * r * 4 * (z > 0.05 ? 1 : 0.6);
  y += P0.sway * r * r * 4;
  const f = Math.max(0, (x - 10.5) / 5);
  z += P0.nod * f * 2;
  z *= 1 + P0.breathe * 0.025;
  return [x, y, z];
};
/** isopod-local -> jaw-local */
export const isoToJaw = (P0: IsoPose, p: V3): V3 => {
  const [x, y, z] = deform(P0, p);
  const c = Math.cos(P0.tilt * R), s = Math.sin(P0.tilt * R);
  return [P0.ox + x * c - z * s, y, P0.oz + x * s + z * c];
};
const PI_ = (C: Ctx, P0: IsoPose, p: V3) => PJ(C, isoToJaw(P0, p));

const sec = (s: St, n = 10): V3[] => {
  const out: V3[] = [];
  for (let i = 0; i <= n; i++) {
    const ph = (Math.PI * i) / n;
    const c = Math.cos(ph);
    const y = s.w * Math.sign(c) * Math.pow(Math.abs(c), 0.72);
    const z = s.h * Math.pow(Math.sin(ph), 0.85);
    const lobe = (s.lobe ?? 0) * Math.pow(Math.abs(c), 2.2);
    out.push([s.x + lobe, y, z]);
  }
  return out;
};
const mid = (a: St, b: St): St => ({x: (a.x + b.x) / 2, w: (a.w + b.w) / 2 * 1.01, h: (a.h + b.h) / 2 * 1.025});

/** shaded body plate (one segment): hull of its sections */
const Plate: React.FC<{C: Ctx; P0: IsoPose; sts: St[]; col: string; id: string; w: number; spec?: number}> = ({C, P0, sts, col, id, w, spec = 0.55}) => {
  const all: V2[] = [];
  for (const s of sts) for (const p of sec(s)) all.push(PI_(C, P0, p));
  const h = hull(all);
  const a = sts[0], b = sts[sts.length - 1];
  const mx = (a.x + b.x) / 2, mw = Math.max(...sts.map((s) => s.w)), mh = Math.max(...sts.map((s) => s.h));
  const c = PI_(C, P0, [mx, 0, mh * 0.55]);
  const top = PI_(C, P0, [mx, 0, mh]);
  const rr = Math.max(...h.map((q) => Math.hypot(q.x - c.x, q.y - c.y)));
  // specular streak along the crest, on the lit side
  const st: V2[] = [];
  for (let i = 0; i <= 6; i++) {
    const ph = lerp(0.42, 0.66, i / 6) * Math.PI;
    const cc = Math.cos(ph);
    st.push(PI_(C, P0, [mx + (a.x - b.x) * 0.08, mw * 0.8 * Math.sign(cc) * Math.pow(Math.abs(cc), 0.72), mh * 0.93 * Math.pow(Math.sin(ph), 0.85)]));
  }
  // darker band along the front edge (the overhang of the plate in front)
  const fr: V2[] = sec(a, 12).map((p) => PI_(C, P0, [p[0] - 0.25, p[1] * 0.98, p[2] + 0.02]));
  return (
    <Inked w={w}>
      <defs>
        <RadG id={id} c={{x: lerp(c.x, top.x, 0.6), y: lerp(c.y, top.y, 0.6)}} r={rr * 1.05} col={col} k={1.05} focal={0.5}
          stops={[[0, lit(col, 0.5)], [0.35, lit(col, 0.18)], [0.7, col], [0.92, shade(col, 0.42)], [1, shade(col, 0.55)]]} />
      </defs>
      <path d={poly(h)} fill={`url(#${id})`} />
      <Deco>
        <path d={smoothOpen(fr)} fill="none" stroke={shade(col, 0.5)} strokeOpacity={0.45} strokeWidth={f2(Math.max(1.2, c.s * 0.35))} />
        {spec > 0 && <path d={smoothOpen(st)} fill="none" stroke="#FFFDF6" strokeOpacity={spec} strokeWidth={f2(Math.max(1.5, c.s * 0.32))} strokeLinecap="round" />}
      </Deco>
    </Inked>
  );
};

/** a shaded tapered capsule between two projected points */
const Cap: React.FC<{a: V2 & {s: number}; b: V2 & {s: number}; ra: number; rb: number; col: string; id: string}> = ({a, b, ra, rb, col, id}) => {
  const RA = ra * a.s, RB = rb * b.s;
  const dx = b.x - a.x, dy = b.y - a.y, L = Math.hypot(dx, dy) || 1;
  let nx = -dy / L, ny = dx / L;
  if (nx * LIGHT.x + ny * LIGHT.y < 0) { nx = -nx; ny = -ny; }
  const m = {x: (a.x + b.x) / 2, y: (a.y + b.y) / 2}, r = (RA + RB) / 2;
  return (
    <g>
      <defs>
        <linearGradient id={id} gradientUnits="userSpaceOnUse" x1={f2(m.x + nx * r)} y1={f2(m.y + ny * r)} x2={f2(m.x - nx * r)} y2={f2(m.y - ny * r)}>
          <stop offset="0" stopColor={lit(col, 0.45)} />
          <stop offset="0.35" stopColor={lit(col, 0.1)} />
          <stop offset="0.7" stopColor={col} />
          <stop offset="1" stopColor={shade(col, 0.5)} />
        </linearGradient>
      </defs>
      <path d={capsule2(a, b, RA, RB)} fill={`url(#${id})`} />
    </g>
  );
};

type Leg = {side: 1 | -1; k: number; pts: V3[]; tip: V3};
const LEG_OFF = [1.7, 1.25, 0.8, -0.7, -1.1, -1.45, -1.8];
/** the seven pereopods of one side, in jaw-local coords */
export const legs = (P0: IsoPose): Leg[] => {
  const out: Leg[] = [];
  for (const side of [1, -1] as const) {
    for (let k = 0; k < 7; k++) {
      const [a, b] = PER[k];
      const m = (a.x + b.x) / 2, W = (a.w + b.w) / 2;
      const off = LEG_OFF[k];
      const ph = P0.t * (2.1 + 0.9 * P0.flex) - k * 0.19 - (side > 0 ? 0 : 0.45);
      const wave = Math.pow(Math.max(0, Math.sin(ph * Math.PI * 2)), 6);
      const g = clamp(wave * (0.25 + 0.75 * P0.flex) + (P0.lift[k] ?? 0));
      const s = side;
      // joints in isopod coords
      const A: V3 = [m, s * W * 0.78, 0.55];
      const K: V3 = [m + off * 0.45, s * (W + 0.75 + 0.3 * g), 1.0 + 0.6 * g];
      const Q: V3 = [m + off * 0.85, s * (W + 1.45 + 0.4 * g), -0.05 + 0.9 * g];
      const D: V3 = [m + off * 1.08, s * (W + 1.75 + 0.3 * g), -0.85 + 0.9 * g];
      let T: V3 = [m + off * 1.0, s * (W + 1.05), -1.45 + 1.3 * g];
      let ptsI: V3[] = [A, K, Q, D, T];
      let jaw = ptsI.map((p) => isoToJaw(P0, p));
      if (k < 2) {
        // the front claws clamp the sides of the tongue base / stub from under the head
        const fc = P0.front;
        const zt = fc.top;
        const Tj: V3 = [fc.fx + (k === 0 ? 0.9 : -1.2), s * (fc.w * 0.92 + 0.2), zt - 1.1 + 1.0 * g];
        const Dj: V3 = [Tj[0] + 0.3, s * (fc.w + 1.1), zt + 0.1 + 0.8 * g];
        const Qj: V3 = [Tj[0] + 0.1, s * (fc.w + 1.6 + 0.3 * g), zt + 1.0 + 0.6 * g];
        jaw = [jaw[0], jaw[1], lerpV(jaw[2], Qj, 0.75), Dj, Tj];
      }
      out.push({side, k, pts: jaw, tip: jaw[4]});
    }
  }
  return out;
};
const lerpV = (a: V3, b: V3, u: number): V3 => [lerp(a[0], b[0], u), lerp(a[1], b[1], u), lerp(a[2], b[2], u)];

const LegArt: React.FC<{C: Ctx; L: Leg; id: string}> = ({C, L, id}) => {
  const p = L.pts.map((q) => PJ(C, q));
  // dactylus: a strongly curved hook from Q through D to T
  const hook: (V2 & {s: number})[] = [];
  for (let i = 0; i <= 6; i++) {
    const u = i / 6;
    const a = L.pts[2], b = L.pts[3], c = L.pts[4];
    const q: V3 = [0, 1, 2].map((j) => (1 - u) * (1 - u) * a[j] + 2 * u * (1 - u) * b[j] + u * u * c[j]) as V3;
    hook.push(PJ(C, q));
  }
  const rs = [0.62, 0.52, 0.44];
  return (
    <Inked w={INKW_LEG(p[1].s)}>
      <Cap a={p[0]} b={p[1]} ra={rs[0]} rb={rs[0] * 0.92} col={COL_LEG} id={id + 'b'} />
      <Cap a={p[1]} b={p[2]} ra={rs[1]} rb={rs[2]} col={COL_LEG} id={id + 'm'} />
      {hook.slice(0, -1).map((h, i) => (
        <Cap key={i} a={h} b={hook[i + 1]} ra={lerp(0.42, 0.1, i / 6)} rb={lerp(0.42, 0.1, (i + 1) / 6)} col={mix(COL_LEG, COL_CLAW, Math.min(1, i / 3))} id={id + 'd' + i} />
      ))}
    </Inked>
  );
};
const INKW_LEG = (s: number) => clamp(s * 0.2, 3, 6.5);

/** the tissue dimples where claws hook in (drawn on the substrate, under the legs) */
export const ClawDimples: React.FC<{C: Ctx; P0: IsoPose; uid: string}> = ({C, P0, uid}) => {
  const L = legs(P0);
  return (
    <g>
      {L.map((l, i) => {
        const p = PJ(C, l.tip);
        return <ellipse key={i} cx={f2(p.x)} cy={f2(p.y)} rx={f2(p.s * 0.85)} ry={f2(p.s * 0.45)} fill="#5A1520" opacity={0.42} />;
      })}
    </g>
  );
};

/** antenna: a chain of short articles */
const antenna = (P0: IsoPose, base: V3, dir: V3, len: number, n: number, seed: number): V3[] => {
  const pts: V3[] = [base];
  let d = dir;
  for (let i = 1; i <= n; i++) {
    const w1 = noise1(P0.t * 1.6 + seed, seed) * 0.16, w2 = noise1(P0.t * 1.9 + seed * 3, seed + 5) * 0.12;
    d = [d[0], d[1] + w1 + Math.sign(dir[1]) * 0.05, d[2] + w2 - 0.06];
    const l = Math.hypot(d[0], d[1], d[2]);
    d = [d[0] / l, d[1] / l, d[2] / l];
    const p = pts[i - 1];
    pts.push([p[0] + d[0] * len / n, p[1] + d[1] * len / n, p[2] + d[2] * len / n]);
  }
  return pts;
};
const AntArt: React.FC<{C: Ctx; P0: IsoPose; pts: V3[]; r0: number; id: string}> = ({C, P0, pts, r0, id}) => {
  const p = pts.map((q) => PI_(C, P0, q));
  return (
    <Inked w={INKW_LEG(p[0].s) * 0.85}>
      {p.slice(0, -1).map((a, i) => (
        <Cap key={i} a={a} b={p[i + 1]} ra={r0 * (1 - i / p.length * 0.6)} rb={r0 * (1 - (i + 0.8) / p.length * 0.6)} col={mix(COL_LEG, '#C9A878', i / p.length * 0.5)} id={id + i} />
      ))}
    </Inked>
  );
};

export const Isopod: React.FC<{C: Ctx; P0: IsoPose; uid: string}> = ({C, P0, uid}) => {
  const s0 = PI_(C, P0, [0, 0, 3]).s;
  const w = clamp(s0 * 0.26, 4, 9);
  const L = legs(P0);
  const depth = (l: Leg) => PJ(C, l.pts[2]).z;
  const far = L.filter((l) => l.side < 0).sort((a, b) => depth(b) - depth(a));
  const near = L.filter((l) => l.side > 0).sort((a, b) => depth(b) - depth(a));
  // antennae
  const ants = ([1, -1] as const).map((s) => ({
    s,
    a1: antenna(P0, [14.8, s * 0.7, 1.35], [0.82, s * 0.38, 0.45], 3.0, 7, s > 0 ? 1 : 2),
    a2: antenna(P0, [14.4, s * 1.6, 0.8], [0.7, s * 0.72, 0.18], 3.8, 8, s > 0 ? 3 : 4),
  }));
  // eyes
  const eye = (s: number) => {
    const c: V3 = [12.85, s * 2.0, 1.9];
    const pts: V2[] = [];
    for (let i = 0; i < 20; i++) {
      const a = (i / 20) * Math.PI * 2;
      pts.push(PI_(C, P0, [c[0] + Math.cos(a) * 0.86 - 0.1, c[1] + s * Math.sin(a) * 0.26 + s * 0.1, c[2] + Math.sin(a) * 0.48 + 0.12]));
    }
    const cc = PI_(C, P0, [c[0] + 0.35, c[1] - s * 0.05, c[2] + 0.55]);
    const fac: (V2 & {s: number})[] = [];
    for (let a = -2; a <= 2; a++) for (let b = -1; b <= 1; b++) if (Math.abs(a) + Math.abs(b) < 3) fac.push(PI_(C, P0, [c[0] + a * 0.36, c[1] + s * 0.32, c[2] + 0.12 + b * 0.3 + (a % 2) * 0.1]));
    const pj = isoToJaw(P0, c), qj = isoToJaw(P0, [c[0] + 0.45, c[1] + s * 0.65, c[2] + 0.6]);
    const nj: V3 = [qj[0] - pj[0], qj[1] - pj[1], qj[2] - pj[2]];
    const pc = PJ(C, pj);
    const cos = facing(C, pj, nj, true) / (Math.hypot(nj[0], nj[1], nj[2]) * Math.max(1, pc.z));
    return {d: smoothClosed(pts), hl: cc, c: PI_(C, P0, c), fac, vis: clamp(cos * 5 + 0.6)};
  };
  const E = [eye(-1), eye(1)];
  // buccal cone (mouthparts) under the head
  const cb = PI_(C, P0, [13.4, 0, 0.5]);
  const ct = PI_(C, P0, [13.6, 0, 0.5 - 1.9 * P0.cone]);
  const ceph = CEPH;
  const ec = E[1].c;
  return (
    <g>
      <defs>
        <RadG id={uid + 'eg'} c={ec} r={ec.s * 1.2} col="#2A1A14" k={0.6} stops={[[0, '#4A3226'], [0.5, '#22150F'], [1, '#0C0806']]} />
      </defs>
      {/* far side legs and antennae */}
      {far.map((l) => <LegArt key={'f' + l.k} C={C} L={l} id={`${uid}lf${l.k}`} />)}
      {ants.filter((a) => a.s < 0).map((a) => (
        <g key="af">
          <AntArt C={C} P0={P0} pts={a.a2} r0={0.27} id={uid + 'af2'} />
          <AntArt C={C} P0={P0} pts={a.a1} r0={0.25} id={uid + 'af1'} />
        </g>
      ))}
      {P0.cone > 0.02 && <path d={capsule2(cb, ct, cb.s * 0.75, ct.s * 0.18)} fill="#B88358" stroke={INK} strokeWidth={2} />}
      {near.map((l) => <LegArt key={'n' + l.k} C={C} L={l} id={`${uid}ln${l.k}`} />)}
      {/* body, rear to front */}
      <Uropods C={C} P0={P0} uid={uid} w={w} />
      <Plate C={C} P0={P0} sts={TELSON} col={COL_TEL} id={uid + 'tel'} w={w} />
      {[...PLEON].reverse().map(([a, b], i) => <Plate key={'pl' + i} C={C} P0={P0} sts={[a, b]} col={mix(COL, COL_TEL, 0.5)} id={`${uid}pl${i}`} w={w * 0.8} spec={0.3} />)}
      {[...PER].map((ab, i) => 6 - i).map((i) => {
        const [a, b] = PER[i];
        return (
          <g key={'p' + i}>
            <Plate C={C} P0={P0} sts={[a, mid(a, b), b]} col={COL} id={`${uid}p${i}`} w={w} />
            {i > 0 && <Coxa C={C} P0={P0} a={a} b={b} s={1} id={`${uid}cx${i}`} w={w * 0.7} />}
          </g>
        );
      })}
      <Plate C={C} P0={P0} sts={ceph} col={mix(COL, '#C9AE86', 0.3)} id={uid + 'ceph'} w={w} spec={0.5} />
      {E.map((e, i) => (
        <g key={'e' + i} opacity={f2(e.vis)}>
          <path d={e.d} fill={`url(#${uid}eg)`} stroke="#3A2418" strokeWidth={1.2} />
          <ellipse cx={f2(e.hl.x)} cy={f2(e.hl.y)} rx={f2(e.hl.s * 0.2)} ry={f2(e.hl.s * 0.1)} transform={`rotate(-25 ${f2(e.hl.x)} ${f2(e.hl.y)})`} fill="#FFF8EA" opacity={0.32} />
        </g>
      ))}
      {ants.filter((a) => a.s > 0).map((a) => (
        <g key="an">
          <AntArt C={C} P0={P0} pts={a.a2} r0={0.27} id={uid + 'an2'} />
          <AntArt C={C} P0={P0} pts={a.a1} r0={0.25} id={uid + 'an1'} />
        </g>
      ))}
    </g>
  );
};

/** small coxal plate at the near side of pereonites 2-7 */
const Coxa: React.FC<{C: Ctx; P0: IsoPose; a: St; b: St; s: number; id: string; w: number}> = ({C, P0, a, b, s, id, w}) => {
  const W = (a.w + b.w) / 2;
  const pts: V3[] = [
    [a.x - 0.3, s * (a.w * 0.99), 0.95],
    [b.x + 0.2, s * (b.w * 1.0), 1.05],
    [b.x - 0.25, s * (b.w * 1.05), 0.25],
    [lerp(a.x, b.x, 0.45), s * (W * 1.06), 0.05],
    [a.x - 0.45, s * (a.w * 1.02), 0.3],
  ];
  const p = pts.map((q) => PI_(C, P0, q));
  const c = PI_(C, P0, [lerp(a.x, b.x, 0.5), s * W, 0.6]);
  return (
    <Inked w={w}>
      <defs>
        <RadG id={id} c={c} r={c.s * 2.4} col={mix(COL, COL_TEL, 0.4)} k={0.8} />
      </defs>
      <path d={smoothClosed(p)} fill={`url(#${id})`} />
    </Inked>
  );
};

const Uropods: React.FC<{C: Ctx; P0: IsoPose; uid: string; w: number}> = ({C, P0, uid, w}) => (
  <g>
    {([-1, 1] as const).map((s) => {
      const pts: V3[] = [[-12.0, s * 3.6, 0.7], [-12.4, s * 5.0, 0.55], [-14.4, s * 5.1, 0.3], [-15.3, s * 4.3, 0.2], [-14.6, s * 3.5, 0.35]];
      const p = pts.map((q) => PI_(C, P0, q));
      const c = PI_(C, P0, [-13.6, s * 4.4, 0.4]);
      return (
        <Inked key={s} w={w * 0.8}>
          <defs>
            <RadG id={`${uid}ur${s}`} c={c} r={c.s * 2.6} col={COL_TEL} k={0.8} />
          </defs>
          <path d={smoothClosed(p)} fill={`url(#${uid}ur${s})`} />
        </Inked>
      );
    })}
  </g>
);

/** the isopod's footprint in jaw coordinates (for its contact shadow) */
export const isoShadow = (C: Ctx, P0: IsoPose, floorZ: number): string => {
  const pts: V2[] = [];
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI * 2;
    const q = isoToJaw(P0, [Math.cos(a) * 16.5 - 0.5, Math.sin(a) * 9.5, 0]);
    pts.push(PJ(C, [q[0], q[1], floorZ + 0.05]));
  }
  return smoothClosed(pts);
};
export {ISO_LEN as LEN};
