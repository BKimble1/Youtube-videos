// HOOK 05: drawing the bombardier beetle in the FGW finish (ink contour per part, gradient fill from the upper-left key
// light, a restrained highlight). Every part is an Item with a camera depth, so near legs pass in front of the body.
import React from 'react';
import {add3, Basis, cross3, dot3, hull, mul3, norm3, P2, proj, smoothClosed, smoothOpen, sub3, V2, V3} from '../../shared/three';
import {capsuleItem, ellipsoidItem, inkW, Item, resample} from '../core/draw3';
import {lit, mix, rgba, shade} from '../../shared/color';
import {INK} from '../../shared/ink';
import {dirW, Frame, toW} from '../core/frame';
import {BRig, bw, HEAD_AX, hw, LegJ, LEN, pair, RAD} from './rig';

export const BCOL = {
  head: '#C04A2A',
  pron: '#D8762E',
  elytra: '#25395F',
  elyLine: '#5C7DB4',
  thoraxV: '#C4642E',
  abdV: '#3A2C2C',
  tip: '#B85C30',
  leg: '#D67E38',
  tars: '#C26C32',
  ant: '#D88844',
  eye: '#1B1512',
  mand: '#B8532B',
  mandTip: '#3B1A10',
};
const LIGHT = {x: -0.62, y: -0.78};
const f2 = (n: number) => n.toFixed(2);
let uid = 0;
export const resetBIds = () => { uid = 0; };
const nid = (p: string) => `b${p}${uid++}`;

/** a shaded closed shape (screen path d) whose gradient is centred on world point c with radius Rmm */
export const blobItem = (B: Basis, d: string, c: V3, Rmm: number, color: string, o: {zBias?: number; deco?: React.ReactNode; spec?: number; glossy?: boolean; opacity?: number; fillOpacity?: number; ink?: number; key?: string} = {}): Item => {
  const C = proj(B, c);
  const R = Rmm * C.s;
  const id = nid('g');
  const el = (
    <g key={o.key ?? id} opacity={o.opacity}>
      <defs>
        <radialGradient id={id} gradientUnits="userSpaceOnUse" cx={f2(C.x + LIGHT.x * R * 0.45)} cy={f2(C.y + LIGHT.y * R * 0.45)} r={f2(R * 1.3)}>
          <stop offset="0" stopColor={lit(color, 0.36)} />
          <stop offset="0.45" stopColor={color} />
          <stop offset="1" stopColor={shade(color, 0.55)} />
        </radialGradient>
        <clipPath id={`${id}c`}>
          <path d={d} />
        </clipPath>
      </defs>
      <path d={d} fill={`url(#${id})`} fillOpacity={o.fillOpacity} />
      <g clipPath={`url(#${id}c)`}>
        {o.deco}
        {(o.spec ?? 1) > 0 && (
          <ellipse cx={f2(C.x + LIGHT.x * R * 0.4)} cy={f2(C.y + LIGHT.y * R * 0.42)} rx={f2(R * 0.2)} ry={f2(R * 0.07)} transform={`rotate(-32 ${f2(C.x + LIGHT.x * R * 0.4)} ${f2(C.y + LIGHT.y * R * 0.42)})`} fill="#FFFFFF" opacity={(o.glossy ? 0.34 : 0.18) * (o.spec ?? 1)} />
        )}
      </g>
      <path d={d} fill="none" stroke={INK} strokeWidth={f2(o.ink ?? inkW(C.s, 1.1))} strokeLinejoin="round" />
    </g>
  );
  return {z: C.z + (o.zBias ?? 0), el};
};

/** a swept body part: along body x from cx-a (u=-1) to cx+a (u=+1); cross-section half width w(u), dorsal height hu(u),
 *  ventral depth hd(u), centre height zc(u). Returns world sample points. */
export type Prof = (u: number) => {w: number; hu: number; hd: number; zc: number};
export const sweepPts = (F: Frame, cx: number, a: number, prof: Prof, u0 = -1, u1 = 1, nu = 22, nph = 18): V3[] => {
  const out: V3[] = [];
  for (let i = 0; i <= nu; i++) {
    const u = u0 + ((u1 - u0) * i) / nu;
    const p = prof(u);
    for (let j = 0; j < nph; j++) {
      const ph = (j / nph) * Math.PI * 2;
      const c = Math.cos(ph), s = Math.sin(ph);
      out.push(toW(F, [cx + a * u, p.w * c, p.zc + (s >= 0 ? p.hu : p.hd) * s]));
    }
  }
  return out;
};
export const hullPath = (B: Basis, pts: V3[], n = 44) => smoothClosed(resample(hull(pts.map((p) => proj(B, p))), n));

/** a polyline on the swept surface at fixed section angle ph, split where it turns away from the camera */
const surfLine = (B: Basis, F: Frame, cx: number, a: number, prof: Prof, ph: number, u0: number, u1: number, n = 18) => {
  let d = '';
  let on = false;
  for (let i = 0; i <= n; i++) {
    const u = u0 + ((u1 - u0) * i) / n;
    const p = prof(u);
    const c = Math.cos(ph), s = Math.sin(ph);
    const q = toW(F, [cx + a * u, p.w * c * 1.002, p.zc + p.hu * s * 1.002]);
    const nrm = norm3(dirW(F, [0, c / Math.max(0.2, p.w), s / Math.max(0.2, p.hu)]));
    const vis = dot3(nrm, sub3(B.eye, q)) > 0;
    if (vis) {
      d += `${on ? ' L' : ' M'}${P2(proj(B, q))}`;
      on = true;
    } else on = false;
  }
  return d;
};

const keys = (u: number, k: [number, number][]) => {
  if (u <= k[0][0]) return k[0][1];
  for (let i = 1; i < k.length; i++) if (u <= k[i][0]) {
    const x = (u - k[i - 1][0]) / (k[i][0] - k[i - 1][0]);
    const e = x * x * (3 - 2 * x);
    return k[i - 1][1] + (k[i][1] - k[i - 1][1]) * e;
  }
  return k[k.length - 1][1];
};
// elytra: a box-like convex shell, slightly wider behind, truncate at the apex
export const ELY = {cx: -2.6, a: 2.72, u0: -0.97, u1: 0.97};
export const elyProf: Prof = (u) => {
  const se = Math.pow(Math.max(0, 1 - Math.pow(Math.abs(u), 5)), 1 / 5);
  return {w: (1.62 - 0.2 * u) * se, hu: 1.12 * Math.pow(Math.max(0, 1 - Math.pow(Math.abs(u), 3)), 1 / 3) * (1 - 0.06 * u), hd: 0.4 * se, zc: -0.1};
};
export const PRON = {cx: 1.05, a: 0.92};
export const pronProf: Prof = (u) => {
  const w = keys(u, [[-1, 0.66], [-0.55, 0.8], [0, 1.04], [0.4, 1.12], [0.82, 0.98], [1, 0.8]]);
  const h = 0.6 * Math.pow(Math.max(0, 1 - Math.pow(Math.abs(u), 4)), 0.25) + 0.04;
  return {w, hu: h, hd: 0.42, zc: 0.05};
};
export const ABD = {cx: -2.7, a: 2.55};
export const abdProf = (pump: number): Prof => (u) => {
  const se = Math.pow(Math.max(0, 1 - Math.pow(Math.abs(u), 3)), 1 / 3);
  return {w: 1.32 * se * (1 + 0.025 * pump), hu: 0.45 * se, hd: (0.58 + 0.04 * pump) * se, zc: -0.4};
};

export type BDrawOpts = {shell?: number; key?: string};

export const beetleItems = (B: Basis, R: BRig, o: BDrawOpts = {}): Item[] => {
  const st = R.st;
  const F = st.body;
  const items: Item[] = [];
  const op = o.shell;
  // ---- ventral abdomen (mostly hidden under the elytra) with sternite lines
  {
    const pts = sweepPts(F, ABD.cx, ABD.a, abdProf(st.pump), -1, 1, 16, 14);
    const d = hullPath(B, pts);
    const c = bw(st, [ABD.cx, 0, -0.5]);
    const lines = [-0.55, -0.2, 0.15, 0.5].map((u) => {
      const p = abdProf(st.pump)(u);
      const ring: V3[] = Array.from({length: 13}, (_, j) => {
        const ph = Math.PI + (j / 12) * Math.PI;
        return toW(F, [ABD.cx + ABD.a * u, p.w * Math.cos(ph), p.zc + p.hd * Math.sin(ph)]);
      });
      return smoothOpen(ring.map((q) => proj(B, q)));
    });
    const sS = proj(B, c).s;
    items.push(blobItem(B, d, c, 2.4, BCOL.abdV, {opacity: op, spec: 0.4, deco: <g>{lines.map((l, k) => <path key={k} d={l} fill="none" stroke={lit(BCOL.abdV, 0.25)} strokeWidth={f2(Math.max(0.8, 0.05 * sS))} opacity={0.7} />)}</g>}));
  }
  // ---- ventral thorax
  items.push(ellipsoidItem(B, bw(st, [0.35, 0, -0.42]), [mul3(F.f, 1.45), mul3(F.l, 1.0), mul3(F.u, 0.5)], BCOL.thoraxV, {opacity: op, spec: 0.3}));
  // ---- abdominal tip (mobile; it carries the gland openings)
  {
    const a = R.tipBase, b = R.tipEnd;
    items.push(capsuleItem(B, a, b, 0.6, 0.4, BCOL.tip, {key: 'tip', spec: 0.6, opacity: op}));
    // the opening: a dark orifice ring facing along the tip direction
    const n = R.tipDirW;
    let u = cross3(n, [0, 0, 1]);
    if (Math.hypot(...u) < 1e-4) u = [1, 0, 0];
    u = norm3(u);
    const v = cross3(n, u);
    const ring = (r: number) => Array.from({length: 16}, (_, j) => {
      const th = (j / 16) * Math.PI * 2;
      return proj(B, add3(b, add3(mul3(u, r * Math.cos(th)), mul3(v, r * Math.sin(th)))));
    });
    const facing = dot3(n, sub3(B.eye, b)) > 0;
    if (facing) {
      const E = proj(B, b);
      items.push({z: E.z - 0.02, el: <g key="noz" opacity={op}><path d={smoothClosed(ring(0.3))} fill={shade(BCOL.tip, 0.4)} stroke={INK} strokeWidth={f2(inkW(E.s, 0.6))} /><path d={smoothClosed(ring(0.15))} fill="#2A120C" /></g>});
    }
  }
  // ---- elytra: the shell, the suture and the striae
  {
    const pts = sweepPts(F, ELY.cx, ELY.a, elyProf, ELY.u0, ELY.u1, 22, 18);
    const d = hullPath(B, pts, 56);
    const c = bw(st, [ELY.cx + 0.6, 0, 0.5]);
    const sS = proj(B, c).s;
    const lw = Math.max(0.7, 0.045 * sS);
    const lines: React.ReactNode[] = [];
    // suture (dark seam between the elytra) with a light edge beside it
    lines.push(<path key="su" d={surfLine(B, F, ELY.cx, ELY.a, elyProf, Math.PI / 2, ELY.u0, ELY.u1)} fill="none" stroke={shade(BCOL.elytra, 0.8)} strokeWidth={f2(lw * 1.8)} strokeLinecap="round" />);
    [0.22, 0.42, 0.62, 0.8].forEach((q, k) => {
      [1, -1].forEach((s) => {
        const ph = s > 0 ? Math.acos(q) : Math.PI - Math.acos(q);
        lines.push(<path key={`r${k}${s}`} d={surfLine(B, F, ELY.cx, ELY.a, elyProf, ph, ELY.u0 + 0.06, ELY.u1 - 0.05)} fill="none" stroke={BCOL.elyLine} strokeWidth={f2(lw)} strokeLinecap="round" opacity={0.45} />);
      });
    });
    // the truncate apex edge, a lighter rim
    items.push(blobItem(B, d, c, 3.3, BCOL.elytra, {opacity: op, spec: 1.1, glossy: true, deco: <g>{lines}</g>}));
  }
  // ---- pronotum (cordiform) with its median line
  {
    const pts = sweepPts(F, PRON.cx, PRON.a, pronProf, -1, 1, 16, 16);
    const d = hullPath(B, pts, 40);
    const c = bw(st, [PRON.cx + 0.2, 0, 0.35]);
    const sS = proj(B, c).s;
    const ml = surfLine(B, F, PRON.cx, PRON.a, pronProf, Math.PI / 2, -0.85, 0.85, 10);
    items.push(blobItem(B, d, c, 1.3, BCOL.pron, {opacity: op, spec: 1, glossy: true, deco: <path d={ml} fill="none" stroke={shade(BCOL.pron, 0.45)} strokeWidth={f2(Math.max(0.7, 0.04 * sS))} opacity={0.7} />}));
  }
  // ---- head, eyes, mandibles, palps, antennae
  const H = R.head;
  const hAx: [V3, V3, V3] = [mul3(H.f, HEAD_AX[0]), mul3(H.l, HEAD_AX[1]), mul3(H.u, HEAD_AX[2])];
  items.push(ellipsoidItem(B, R.headC, hAx, BCOL.head, {opacity: op, spec: 0.9, glossy: true}));
  [1, -1].forEach((s) => {
    const c = hw(H, [1.12, 0.74 * s, 0.14]);
    const n = norm3(dirW(H, [0.15, s, 0.25]));
    if (dot3(n, sub3(B.eye, c)) > -0.35) items.push(ellipsoidItem(B, c, [mul3(H.f, 0.34), mul3(n, 0.2), mul3(H.u, 0.3)], BCOL.eye, {zBias: -0.25, spec: 1.6, glossy: true, opacity: op}));
  });
  [1, -1].forEach((s) => {
    const open = (st.mand * 26 * Math.PI) / 180;
    const pts: V3[] = [];
    const N = 8;
    const P = (u: number, w: number) => {
      const x = 1.52 + 0.78 * u, y = s * (0.34 - 0.02 * u - 0.32 * u * u), z = -0.26 - 0.06 * u;
      // swing outward about the base by `open`
      const bx = 1.52, by = 0.34 * s;
      const dx = x - bx, dy = y - by;
      const c = Math.cos(open * s), sn = Math.sin(open * s);
      const rx = bx + dx * c - dy * sn, ry = by + dx * sn + dy * c;
      // half-width across the blade (in the head's horizontal plane, perpendicular to the blade)
      return hw(H, [rx + w * 0.3 * s * (u - 0.4), ry + w * s, z]);
    };
    for (let k = 0; k <= N; k++) pts.push(P(k / N, 0.17 * (1 - k / N) + 0.02));
    for (let k = N; k >= 0; k--) pts.push(P(k / N, -(0.1 * (1 - k / N) + 0.015)));
    const sp = pts.map((p) => proj(B, p));
    const z = proj(B, P(0.5, 0)).z;
    const w = inkW(proj(B, P(0, 0)).s, 0.75);
    const tip = [0.7, 0.8, 0.9, 1.0].map((u) => proj(B, P(u, 0)));
    items.push({z: z - 0.1, el: <g key={`md${s}`} opacity={op}><path d={smoothClosed(sp)} fill={BCOL.mand} stroke={INK} strokeWidth={f2(w)} strokeLinejoin="round" /><path d={smoothOpen(tip)} stroke={BCOL.mandTip} strokeWidth={f2(w * 1.6)} strokeLinecap="round" fill="none" /><path d={smoothOpen([0.1, 0.3, 0.5].map((u) => proj(B, P(u, 0.06))))} stroke={lit(BCOL.mand, 0.5)} strokeWidth={f2(w * 0.9)} strokeLinecap="round" fill="none" opacity={0.8} /></g>});
  });
  R.palps.forEach((pp, j) => {
    for (let k = 0; k < pp.length - 1; k++) items.push(capsuleItem(B, pp[k], pp[k + 1], 0.07, 0.06, BCOL.leg, {key: `p${j}${k}`, spec: 0.3, opacity: op}));
  });
  R.ants.forEach((a, j) => {
    for (let k = 0; k < a.length - 1; k++) {
      const r = k === 0 ? 0.1 : k === 1 ? 0.08 : 0.068 - 0.002 * k;
      items.push(capsuleItem(B, a[k], a[k + 1], r, r * 0.92, k < 2 ? BCOL.ant : mix(BCOL.ant, '#B8682E', k / 12), {key: `a${j}${k}`, spec: 0.35, opacity: op}));
    }
  });
  // ---- legs
  R.legs.forEach((L: LegJ) => {
    const k = pair(L.i);
    items.push(capsuleItem(B, L.socket, L.troch, RAD.coxa, RAD.coxa * 0.8, BCOL.thoraxV, {key: `c${L.i}`, spec: 0.4, opacity: op}));
    items.push(capsuleItem(B, L.troch, L.knee, RAD.femur[k][0], RAD.femur[k][1], BCOL.leg, {key: `f${L.i}`, spec: 0.6, opacity: op}));
    items.push(capsuleItem(B, L.knee, L.ankle, RAD.tibia[0], RAD.tibia[1], BCOL.leg, {key: `t${L.i}`, spec: 0.5, opacity: op}));
    // apical tibial spurs
    const sp = norm3(sub3(L.ankle, L.knee));
    const A = proj(B, L.ankle);
    const sw = inkW(A.s, 0.6);
    const spur = (k2: number) => {
      const e = add3(L.ankle, add3(mul3(sp, 0.22), mul3(st.body.u, -0.12 * k2)));
      return `M${P2(proj(B, add3(L.ankle, mul3(sp, -0.05))))} L${P2(proj(B, e))}`;
    };
    items.push({z: A.z - 0.05, el: <g key={`sp${L.i}`} opacity={op}><path d={spur(1)} stroke={INK} strokeWidth={f2(sw)} strokeLinecap="round" /><path d={spur(-0.6)} stroke={INK} strokeWidth={f2(sw)} strokeLinecap="round" /></g>});
    for (let m = 0; m < 5; m++) {
      const ra = 0.1 - m * 0.008, rb = ra * 0.82;
      items.push(capsuleItem(B, L.tars[m], L.tars[m + 1], ra, rb, BCOL.tars, {key: `s${L.i}${m}`, spec: 0.25, opacity: op}));
    }
    // paired claws
    const cd = norm3(sub3(L.tars[5], L.tars[4]));
    const side = norm3(cross3(cd, [0, 0, 1]));
    const F5 = proj(B, L.tars[5]);
    const claw = (s: number) => smoothOpen([L.tars[5], add3(L.tars[5], add3(mul3(cd, 0.12), mul3(side, 0.06 * s))), add3(L.tars[5], add3(mul3(cd, 0.16), add3(mul3(side, 0.08 * s), [0, 0, -0.08])))].map((p) => proj(B, p)));
    items.push({z: F5.z - 0.02, el: <g key={`cl${L.i}`} opacity={op}><path d={claw(1)} fill="none" stroke={INK} strokeWidth={f2(inkW(F5.s, 0.55))} strokeLinecap="round" /><path d={claw(-1)} fill="none" stroke={INK} strokeWidth={f2(inkW(F5.s, 0.55))} strokeLinecap="round" /></g>});
  });
  return items;
};

/** screen outlines of the abdomen region (elytra, ventral abdomen and tip), to clip what is seen inside */
export const abdomenClip = (B: Basis, R: BRig): string[] => {
  const st = R.st, F = st.body;
  return [
    hullPath(B, sweepPts(F, ELY.cx, ELY.a, elyProf, ELY.u0, ELY.u1, 22, 18), 56),
    hullPath(B, sweepPts(F, ABD.cx, ABD.a, abdProf(st.pump), -1, 1, 16, 14)),
    hullPath(B, [R.tipBase, R.tipEnd].flatMap((c, k) => {
      const r = k === 0 ? 0.6 : 0.4;
      return Array.from({length: 26}, (_, j) => {
        const th = (j / 26) * Math.PI * 2, ph = (Math.floor(j / 2) % 13) / 13 * Math.PI;
        return add3(c, [r * Math.cos(th) * Math.sin(ph + 0.1), r * Math.sin(th) * Math.sin(ph + 0.1), r * Math.cos(ph + 0.1)] as V3);
      });
    }), 30),
  ];
};
export {rgba};
