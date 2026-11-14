// The small intestine, in 3D, as a half-pipe cutaway: the wall's far half (theta in [0, pi] below the cut plane z = 0)
// around the centreline (path.ts), with circular folds (plicae), a moist sheen, the cut faces at the two rims showing
// the wall layers (mucosa with villi, submucosa, two muscle layers, serosa), the wall pushed outward wherever an inflated
// anchor presses on it, and the robot's soft contact shadow on the floor.
//
// One model for every in-gut shot: the opening tunnel (an oblique view along the half-pipe), the macro (top-down at a
// rim), the cutaway (top-down), the tool close-up. Rims: theta = 0 is the +N side, theta = pi the -N side.
import {add3, Basis, dot3, mul3, norm3, cross3, P2, proj, sub3, V2, V3} from '../core/three';
import {depthOf, fogAmt, gradFrom, Item, Light, ramp, shadeAt} from '../core/render';
import {C, INK} from '../art/palette';
import {mix, rgba} from '../core/color';
import {clamp, hash, noise1, ss} from '../lib';
import {C3, N3, T3, Z3} from './path';

export const RL = 2.0; // lumen radius (relaxed)
const FOLD_P = 0.95, FOLD_W = 0.13, FOLD_H = 0.34;
export const LAYERS = [0, 0.15, 0.27, 0.42, 0.52, 0.57]; // cut-face boundaries (mucosa | submucosa | circ. | long. | serosa)
const LAYER_COLS = [C.mucosa, C.submucosa, C.muscleC, C.muscleL, C.serosa];

/** robot outer radius at arc length s (0 where there is no anchor), supplied by the shot */
export type ContactF = (s: number) => number;

const foldsNear = (s: number) => {
  const k0 = Math.floor(s / FOLD_P) - 1;
  return [k0, k0 + 1, k0 + 2, k0 + 3];
};
const foldS = (k: number, th: number) => k * FOLD_P + 0.22 * (hash(k * 7.3) - 0.5) + 0.1 * Math.sin(th * 1.3 + k * 2.1);
/** how far past the cut plane the wall rises on each side (rad); set per shot by gutItems */
let EXT = 0, EXT2 = 0;
const rimTaper = (th: number) => ss(th + EXT, 0.05, 0.55) * ss(Math.PI + EXT2 - th, 0.05, 0.55);
/** outward radial direction at (s, theta) */
const rhoAt = (s: number, th: number): V3 => add3(mul3(N3(s), Math.cos(th)), mul3(Z3, -Math.sin(th)));
const foldH = (k: number, th: number) => FOLD_H * (0.7 + 0.5 * hash(k * 3.7)) * clamp(0.35 + 0.65 * (0.5 + 0.5 * noise1(th * 1.6 + k * 5.3, 2)) * 1.25, 0, 1) * rimTaper(th);

/** wall radius at (s, theta), and how hard the robot is pressing there (0..1) */
export const wallR = (s: number, th: number, contact?: ContactF) => {
  let r = RL * (1 + 0.03 * noise1(s * 0.6 + th * 0.9, 1));
  let fold = 0;
  for (const k of foldsNear(s)) {
    const d = (s - foldS(k, th)) / FOLD_W;
    fold += foldH(k, th) * Math.exp(-d * d);
  }
  const rc = contact ? contact(s) : 0;
  const press = rc > 0 ? ss(rc, RL - 0.55, RL - 0.05) : 0;
  r -= fold * (1 - 0.85 * press);
  if (rc > 0) {
    const a = r, b = rc + 0.015, k = 0.06;
    r = 0.5 * (a + b + Math.sqrt((a - b) * (a - b) + k * k));
  }
  return {r, press};
};

const wallPt = (s: number, th: number, r: number): V3 => {
  const c = C3(s), n = N3(s);
  return add3(c, add3(mul3(n, r * Math.cos(th)), mul3(Z3, -r * Math.sin(th))));
};

export type GutOpts = {
  sFrom: number;
  sTo: number;
  contact?: ContactF;
  /** extra screen-size refinement (smaller = finer) */
  px?: number;
  /** robot span on the centreline, for the contact shadow */
  shadow?: {s0: number; s1: number; r: (s: number) => number; op?: number};
  /** draw villi on the rims when they are at least this many px apart */
  villiPx?: number;
  /** villi lean (traction) per s: 0 = upright */
  lean?: (s: number) => number;
  /** the wall rises this far (rad) past the cut plane on both sides (a deeper trench for the tunnel shot) */
  ext?: number;
  /** the -N side's rise, if different (the far wall arching over in the tunnel shot) */
  ext2?: number;
  /** biopsy notch and dye (the tool close-up): rim side, s, amount */
  notch?: {side: 1 | -1; s: number; depth: number};
  dye?: {side: 1 | -1; s: number; amt: number};
};

export const gutItems = (B: Basis, Lt: Light, o: GutOpts): {back: Item[]; rims: Item[]} => {
  const back: Item[] = [];
  const rims: Item[] = [];
  // ---- s samples, adaptive to screen size
  const ss_: number[] = [];
  let s = o.sFrom;
  const target = o.px ?? 9;
  while (s < o.sTo) {
    ss_.push(s);
    const pp = proj(B, C3(s));
    const z = depthOf(B, C3(s));
    const ds = z > 0.5 ? clamp((target / Math.max(1, pp.s)) * 1.0, 0.035, 0.7) : 0.2;
    s += ds;
  }
  ss_.push(o.sTo);
  const NTH = 64;
  EXT = o.ext ?? 0;
  EXT2 = o.ext2 ?? EXT;
  const ths = Array.from({length: NTH + 1}, (_, j) => -EXT + (j / NTH) * (Math.PI + EXT + EXT2));
  const grid: {p: V3; press: number; r: number}[][] = ss_.map((sv) => ths.map((th) => {
    const {r, press} = wallR(sv, th, o.contact);
    return {p: wallPt(sv, th, r), press, r};
  }));
  // ---- wall: per s-interval, four quarter-arc bands, each shaded smoothly by a gradient across it
  const Q = 4, per = NTH / Q;
  for (let i = 0; i < ss_.length - 1; i++) {
    const axis = C3((ss_[i] + ss_[i + 1]) / 2);
    for (let q = 0; q < Q; q++) {
      const j0 = q * per, j1 = j0 + per;
      const samples: {p: V2; c: string}[] = [];
      let zs = 0;
      for (let j = j0; j <= j1; j++) {
        const jm = Math.min(NTH - 1, Math.max(0, j === NTH ? j - 1 : j));
        const a = grid[i][jm].p, b = grid[i][jm + 1].p, c = grid[i + 1][jm + 1].p, d = grid[i + 1][jm].p;
        let n = norm3(cross3(sub3(c, a), sub3(d, b)));
        if (dot3(n, sub3(axis, a)) < 0) n = mul3(n, -1);
        const pm = mul3(add3(grid[i][j].p, grid[i + 1][j].p), 0.5);
        const press = (grid[i][j].press + grid[i + 1][j].press) / 2;
        const c0 = shadeAt(B, Lt, C.wall, pm, n, {spec: 0.16, specPow: 9, amb: 0.1, tint: press > 0.01 ? ['#7A1830', 0.22 * press] : undefined});
        samples.push({p: proj(B, pm), c: c0});
        zs += depthOf(B, pm);
      }
      const ga = samples[0].p, gb = samples[samples.length - 1].p;
      const poly: V2[] = [];
      for (let j = j0; j <= j1; j++) poly.push(proj(B, grid[i][j].p));
      for (let j = j1; j >= j0; j--) poly.push(proj(B, grid[i + 1][j].p));
      back.push({z: zs / (j1 - j0 + 1), d: `M${poly.map(P2).join('L')}Z`, grad: gradFrom(ga, gb, samples), sw: 1.2});
    }
  }
  // ---- wet glints along fold crests (the light catching mucus)
  const kA = Math.floor(o.sFrom / FOLD_P), kB = Math.ceil(o.sTo / FOLD_P);
  for (let k = kA; k <= kB; k++) {
    let run: {p: V2; w: number; z: number}[] = [];
    const flush = () => {
      if (run.length > 2) {
        const zz = run.reduce((m, q) => m + q.z, 0) / run.length;
        const w = run.reduce((m, q) => Math.max(m, q.w), 0);
        back.push({z: zz - 0.05, d: `M${run.map((q) => P2(q.p)).join('L')}`, stroke: rgba('#FFF1EA', 0.55), sw: w, round: true});
      }
      run = [];
    };
    for (let j = 3; j <= NTH - 3; j++) {
      const th = ths[j];
      const sk = foldS(k, th) - 0.03;
      if (sk < o.sFrom || sk > o.sTo) { flush(); continue; }
      const {r, press} = wallR(sk, th, o.contact);
      const p = wallPt(sk, th, r - 0.004);
      const n = norm3(sub3(C3(sk), p));
      const l = norm3(sub3(Lt.pos, p)), v = norm3(sub3(B.eye, p));
      const h = norm3(add3(l, v));
      const sp = Math.max(0, dot3(n, h)) ** 30 * (1 - press) * (1 - fogAmt(B, Lt, p));
      const pp = proj(B, p);
      if (sp > 0.22 && foldH(k, th) > 0.18) run.push({p: pp, w: clamp(pp.s * 0.035 * sp, 0.6, 9), z: depthOf(B, p)});
      else flush();
    }
    flush();
  }
  // ---- moist speckle highlights scattered on the wall (deterministic)
  for (let k = Math.floor(o.sFrom * 6); k < o.sTo * 6; k++) {
    const sv = k / 6 + 0.12 * hash(k * 1.7);
    const th = 0.15 + (Math.PI - 0.3) * hash(k * 9.1);
    const {r, press} = wallR(sv, th, o.contact);
    const p = wallPt(sv, th, r - 0.003);
    const n = norm3(sub3(C3(sv), p));
    const l = norm3(sub3(Lt.pos, p)), v = norm3(sub3(B.eye, p));
    const sp = Math.max(0, dot3(n, norm3(add3(l, v)))) ** 18 * (1 - press) * (1 - fogAmt(B, Lt, p));
    if (sp < 0.3) continue;
    const pp = proj(B, p);
    const rr = clamp(pp.s * 0.018 * (0.6 + hash(k * 3.3)), 0.6, 8);
    back.push({z: depthOf(B, p) - 0.04, d: ellipse(pp, rr * 1.6, rr * 0.7, hash(k) * 180), fill: rgba('#FFF4EE', clamp(sp * 0.7, 0, 0.75))});
  }
  // ---- contact shadow of the robot on the floor
  if (o.shadow) {
    const sh = o.shadow;
    for (const [wid, op] of [[1.35, 0.1], [1.0, 0.12], [0.7, 0.14]] as [number, number][]) {
      const left: V2[] = [], right: V2[] = [];
      let zsum = 0, nz = 0;
      for (let sv = sh.s0; sv <= sh.s1 + 1e-6; sv += 0.12) {
        const rr = sh.r(sv);
        const endFade = ss(sv, sh.s0 - 0.01, sh.s0 + 0.9) * ss(sh.s1 - sv, -0.01, 0.9);
        const half = ((wid * rr) / RL) * (0.25 + 0.75 * endFade);
        const t0 = Math.PI / 2 + 0.28 - half, t1 = Math.PI / 2 + 0.28 + half;
        const pa = wallPt(sv, t0, wallR(sv, t0, o.contact).r - 0.01), pb = wallPt(sv, t1, wallR(sv, t1, o.contact).r - 0.01);
        left.push(proj(B, pa)); right.push(proj(B, pb));
        zsum += depthOf(B, pa); nz++;
      }
      back.push({z: zsum / Math.max(1, nz) - 1.2, d: `M${[...left, ...right.reverse()].map(P2).join('L')}Z`, fill: rgba('#1A0410', op * (sh.op ?? 1))});
    }
  }
  // ---- the cut faces at both rims
  for (const side of [1, -1] as const) {
    const th = side === 1 ? -EXT : Math.PI + EXT2;
    const faceN = (sv: number): V3 => (side === 1 ? mul3(rhoAt(sv, th - Math.PI / 2), 1) : mul3(rhoAt(sv, th + Math.PI / 2), 1));
    // chunks along s so fog grades along the length
    const step = Math.max(1, Math.floor(ss_.length / 24));
    for (let i0 = 0; i0 < ss_.length - 1; i0 += step) {
      const i1 = Math.min(ss_.length - 1, i0 + step);
      const seg = ss_.slice(i0, i1 + 1);
      const mid = C3(seg[Math.floor(seg.length / 2)]);
      for (let l = 0; l < LAYERS.length - 1; l++) {
        const inner: V2[] = [], outer: V2[] = [];
        for (const sv of seg) {
          const {r, press} = wallR(sv, th, o.contact);
          const squeeze = 1 - 0.18 * press;
          const c = C3(sv), n = rhoAt(sv, th);
          let a = r + LAYERS[l] * squeeze, b = r + LAYERS[l + 1] * squeeze;
          if (o.notch && o.notch.side === side && l === 0) {
            const nd = o.notch.depth * Math.exp(-(((sv - o.notch.s) / 0.07) ** 2));
            a += nd;
          }
          inner.push(proj(B, add3(c, mul3(n, a))));
          outer.push(proj(B, add3(c, mul3(n, b))));
        }
        let col = LAYER_COLS[l];
        if (o.dye && o.dye.side === side && (l === 0 || l === 1)) col = col; // dye drawn as its own bloom
        const lit = shadeAt(B, Lt, [mix(col, '#2A0A1C', 0.75), mix(col, '#2A0A1C', 0.4), col, mix(col, '#FFF4EE', 0.25), mix(col, '#FFFFFF', 0.45)], mid, faceN(seg[0]), {amb: 0.45, spec: 0.1});
        rims.push({z: -1e6 + i0 * 0, d: `M${[...inner, ...outer.reverse()].map(P2).join('L')}Z`, fill: lit, stroke: lit, sw: 0.8});
      }
    }
    if (o.notch && o.notch.side === side && o.notch.depth > 0.002) {
      const a: V2[] = [], b: V2[] = [];
      for (let sv = o.notch.s - 0.2; sv <= o.notch.s + 0.2; sv += 0.01) {
        const {r} = wallR(sv, th, o.contact);
        const nd = o.notch.depth * Math.exp(-(((sv - o.notch.s) / 0.07) ** 2));
        a.push(proj(B, add3(C3(sv), mul3(rhoAt(sv, th), r - 0.01))));
        b.push(proj(B, add3(C3(sv), mul3(rhoAt(sv, th), r + nd))));
      }
      rims.push({z: -1e6, d: `M${[...a, ...b.reverse()].map(P2).join('L')}Z`, fill: '#C23B4B', stroke: '#8E1F33', sw: 1.2});
    }
    // ink: the inner (lumen) edge and the outer surface
    const edge = (off: number, w: number, col: string) => {
      const pts: V2[] = [];
      for (const sv of ss_) {
        const {r, press} = wallR(sv, th, o.contact);
        let a = r + off * (1 - 0.18 * press);
        if (off === 0 && o.notch && o.notch.side === side) a += o.notch.depth * Math.exp(-(((sv - o.notch.s) / 0.07) ** 2));
        pts.push(proj(B, add3(C3(sv), mul3(rhoAt(sv, th), a))));
      }
      rims.push({z: -1e6, d: `M${pts.map(P2).join('L')}`, stroke: col, sw: w, round: true});
    };
    const sc = proj(B, C3((o.sFrom + o.sTo) / 2)).s;
    edge(LAYERS[LAYERS.length - 1], clamp(sc * 0.012, 1.2, 3.2), INK);
    edge(0, clamp(sc * 0.01, 1, 2.8), mix(INK, C.wall[1], 0.3));
    // villi on the mucosal edge, at macro scale
    const vpx = o.villiPx ?? 7;
    const vstep = 0.045;
    const vop = clamp((sc * vstep - vpx * 0.6) / (vpx * 0.6));
    if (vop > 0.01) {
      const vs: string[] = [];
      for (let sv = Math.ceil(o.sFrom / vstep) * vstep; sv < o.sTo; sv += vstep) {
        const {r, press} = wallR(sv, th, o.contact);
        let base = r;
        if (o.notch && o.notch.side === side) base += o.notch.depth * Math.exp(-(((sv - o.notch.s) / 0.07) ** 2));
        const nz = o.notch && o.notch.side === side ? 1 - 0.9 * Math.exp(-(((sv - o.notch.s) / 0.06) ** 2)) * clamp(o.notch.depth / 0.05) : 1;
        const len = (0.06 + 0.04 * hash(sv * 91) + 0.012 * Math.sin(sv * 37)) * (1 - 0.55 * press) * nz;
        const lean = (o.lean ? o.lean(sv) : 0) + 0.15 * (hash(sv * 13) - 0.5);
        const c = C3(sv), n = rhoAt(sv, th), t = T3(sv);
        const root = add3(c, mul3(n, base + 0.005));
        const dir = norm3(add3(mul3(n, -1), mul3(t, -lean)));
        const tipP = add3(root, mul3(dir, len));
        const w = 0.013 + 0.006 * hash(sv * 57);
        const pr = (q: V3) => proj(B, q);
        const r1 = pr(add3(root, mul3(t, -w))), r2 = pr(add3(root, mul3(t, w)));
        const tp = pr(tipP);
        const t1 = pr(add3(tipP, mul3(t, -w * 0.9))), t2 = pr(add3(tipP, mul3(t, w * 0.9)));
        const tip2 = pr(add3(tipP, mul3(dir, w)));
        vs.push(`M${P2(r1)}L${P2(t1)}Q${P2(tip2)} ${P2(t2)}L${P2(r2)}Z`);
        void tp;
      }
      rims.push({z: -1e6, d: vs.join(''), fill: C.villus, stroke: mix(C.mucosa, INK, 0.35), sw: clamp(sc * 0.004, 0.6, 2), op: vop});
      // a thin mucus film over the villus tips
      const film: V2[] = [];
      for (let sv = o.sFrom; sv <= o.sTo; sv += vstep / 2) {
        const {r, press} = wallR(sv, th, o.contact);
        film.push(proj(B, add3(C3(sv), mul3(rhoAt(sv, th), r - 0.075 * (1 - 0.55 * press) - 0.01))));
      }
      rims.push({z: -1e6, d: `M${film.map(P2).join('L')}`, stroke: rgba(C.mucus, 0.35), sw: clamp(sc * 0.012, 1, 6), round: true, op: vop});
    }
  }
  return {back, rims};
};

export const ellipse = (c: V2, rx: number, ry: number, rotDeg: number) => {
  const a = (rotDeg * Math.PI) / 180;
  const pts: V2[] = [];
  for (let k = 0; k < 14; k++) {
    const t = (k / 14) * Math.PI * 2;
    const x = rx * Math.cos(t), y = ry * Math.sin(t);
    pts.push({x: c.x + x * Math.cos(a) - y * Math.sin(a), y: c.y + x * Math.sin(a) + y * Math.cos(a)});
  }
  return `M${pts.map(P2).join('L')}Z`;
};
export const _r = ramp;

// ---- the neighbouring loops of gut that pack the body cavity around the cut-away segment (world-anchored, so a moving
// camera gets true parallax). Drawn before the wall, darker and fogged: context, never competing with the subject.
type Loop = {a: V3; b: V3; r: number; tone: number};
const LOOPS: Loop[] = (() => {
  const out: Loop[] = [];
  for (let k = -30; k <= 40; k++) {
    for (const side of [1, -1]) {
      const s0 = k * 3.1 + 1.3 * hash(k * 5 + side);
      const c = C3(s0), n = N3(s0), t = T3(s0);
      const lat = side * (4.3 + 1.6 * hash(k * 11 + side * 3));
      const dz = -1.2 - 2.2 * hash(k * 7 + side);
      const ctr = add3(add3(c, mul3(n, lat)), mul3(Z3, dz));
      const ang = (hash(k * 13 + side * 7) - 0.5) * 2.4;
      const dir = norm3(add3(mul3(t, Math.cos(ang)), add3(mul3(n, Math.sin(ang) * 0.8), mul3(Z3, (hash(k * 17 + side) - 0.5) * 0.6))));
      const half = 2.2 + 1.6 * hash(k * 19 + side);
      out.push({a: add3(ctr, mul3(dir, -half)), b: add3(ctr, mul3(dir, half)), r: 1.75 + 0.6 * hash(k * 23 + side), tone: hash(k * 29 + side)});
    }
  }
  return out;
})();

export const loopItems = (B: Basis, Lt: Light, sFrom: number, sTo: number, dim = 1): Item[] => {
  const items: Item[] = [];
  const lo = C3(sFrom), hi = C3(sTo);
  for (const L of LOOPS) {
    const m = mul3(add3(L.a, L.b), 0.5);
    // only loops near the visible stretch
    const along = dot3(sub3(m, lo), norm3(sub3(hi, lo)));
    const span = Math.hypot(hi[0] - lo[0], hi[1] - lo[1]);
    if (along < -6 || along > span + 6) continue;
    if (depthOf(B, L.a) < 1 || depthOf(B, L.b) < 1) continue;
    const pa = proj(B, L.a), pb = proj(B, L.b);
    const ra = L.r * pa.s, rb = L.r * pb.s;
    const d = capsule(pa, pb, ra, rb);
    const ax = pb.x - pa.x, ay = pb.y - pa.y;
    const al = Math.hypot(ax, ay) || 1;
    const nx = -ay / al, ny = ax / al;
    const pm = proj(B, m), rm = (ra + rb) / 2;
    const g0 = {x: pm.x - nx * rm, y: pm.y - ny * rm}, g1 = {x: pm.x + nx * rm, y: pm.y + ny * rm};
    // shade across: sample the tube's normals facing the camera
    const toCam = norm3(sub3(B.eye, m));
    const axis = norm3(sub3(L.b, L.a));
    const side3 = norm3(cross3(axis, toCam));
    const samples: {p: V2; c: string}[] = [];
    for (let k = 0; k <= 6; k++) {
      const a = -Math.PI / 2 + (Math.PI * k) / 6;
      const n = norm3(add3(mul3(side3, -Math.sin(a)), mul3(toCam, Math.cos(a))));
      const p3 = add3(m, mul3(n, L.r));
      const col = shadeAt(B, {...Lt, gain: (Lt.gain ?? 1) * 0.62 * dim}, C.wall, p3, n, {amb: 0.06, spec: 0.2, specPow: 14});
      const t = 0.5 - 0.5 * Math.sin(a) * -1;
      samples.push({p: {x: g0.x + (g1.x - g0.x) * t, y: g0.y + (g1.y - g0.y) * t}, c: mix(col, C.cavityDeep, 0.25 + 0.25 * L.tone)});
    }
    items.push({z: depthOf(B, m) + L.r, d, grad: gradFrom(g0, g1, samples), sw: 0});
  }
  return items.sort((a, b) => b.z - a.z);
};

const capsule = (a: V2, b: V2, ra: number, rb: number) => {
  const pts: V2[] = [];
  const ax = b.x - a.x, ay = b.y - a.y;
  const ang = Math.atan2(ay, ax);
  for (let k = 0; k <= 12; k++) {
    const t = ang + Math.PI / 2 + (Math.PI * k) / 12;
    pts.push({x: a.x + ra * Math.cos(t), y: a.y + ra * Math.sin(t)});
  }
  for (let k = 0; k <= 12; k++) {
    const t = ang - Math.PI / 2 + (Math.PI * k) / 12;
    pts.push({x: b.x + rb * Math.cos(t), y: b.y + rb * Math.sin(t)});
  }
  return `M${pts.map(P2).join('L')}Z`;
};
