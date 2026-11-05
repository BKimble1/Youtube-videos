// A Weird Crew cast member in the 3D world. The parts are the crew's own vector pieces (Head, Hand, Limb, gradient
// capsules, one ink contour per part), placed from 3D joints:
// - the torso is a loft of elliptical cross-sections, so its silhouette and the tee's stripes (and the harness straps)
//   wrap correctly as the camera orbits;
// - arms are two-bone IK chains from the shoulders to hand targets (body-local or world), with an elbow pole;
// - the head is the crew Head with its 3/4 turn taken from the face direction relative to the camera.
// Body-local axes: +x = the person's LEFT, +y up, +z the person's front. Units: cm. Feet at y = 0.
import React from 'react';
import {Expr, Head} from '../dc/Head';
import {Hand, HandPose} from '../dc/Hand';
import {Limb} from '../dc/limb';
import {Blob, Capsule, capsulePath as capsuleD} from '../dc/shade';
import {Deco, Inked, InkLine, InkPath} from '../dc/ink';
import {lit, mix, shade} from '../dc/color';
import {fmt, P, V} from '../dc/math';
import {a3, d3, Item, k3, l3, M3, mm, mv, n3, Proj, rx, ry, s3, V3, v3, x3, lerp3} from './m3';

export type Look = {
  skin: string;
  hair: string;
  style: 'spiky' | 'crop' | 'bun';
  shirt: string;
  stripe: string | null;
  pants: string;
  shoe: string;
  glasses?: boolean;
  /** long sleeves (operator's jacket) */
  longSleeve?: boolean;
};
export const GUESSER: Look = {skin: '#F2C9A8', hair: '#C0392B', style: 'spiky', shirt: '#FFFFFF', stripe: '#FFC744', pants: '#2E3F5C', shoe: '#FFFFFF'};
/** the operator: teal jacket, cropped dark hair, round glasses */
export const OPERATOR: Look = {skin: '#E2AE8A', hair: '#3B2A22', style: 'crop', shirt: '#1CA7A0', stripe: null, pants: '#384250', shoe: '#F4F1EA', glasses: true, longSleeve: true};
/** the second wearer: coral tee, dark bun */
export const WEARER2: Look = {skin: '#B97C58', hair: '#241A16', style: 'bun', shirt: '#EF6B55', stripe: null, pants: '#2E3F5C', shoe: '#FFFFFF'};

export type Arm3 = {
  /** hand (wrist) target: body-local, or world when `world` is set */
  h: V3;
  world?: boolean;
  /** elbow pole direction (body-local) */
  pole: V3;
  /** wrist -> knuckle direction (body-local, or world when world is set); default continues the forearm */
  dir?: V3;
  /** thumb direction (same space as dir) */
  thumb?: V3;
  hand: HandPose;
};

export type Pose3 = {
  pos: V3;
  /** body yaw (deg): 0 faces +z */
  face: number;
  /** upper-body lean forward (deg) */
  lean: number;
  /** head turn relative to the body (deg, + toward the person's left), nod (+ down), tilt */
  hYaw: number;
  hNod: number;
  hRoll: number;
  L: Arm3;
  R: Arm3;
  expr: Expr;
  blink: number;
  breath: number;
  /** spike sway (deg) */
  sway?: number;
};

export const BD = {
  hip: 92,
  shoulderY: 143,
  shoulderX: 18.6,
  upper: 28,
  fore: 25,
  hand: 17,
  headY: 172,
  headR: 15,
  thigh: 44,
  shin: 43,
};
const SECTIONS: [number, number, number][] = [
  // y, half-width, half-depth
  [84, 16.6, 10.8],
  [96, 16.0, 10.2],
  [108, 15.4, 10.2],
  [120, 16.8, 11.0],
  [131, 18.4, 11.2],
  [139, 19.4, 10.6],
  [145, 18.6, 9.0],
  [149.5, 12.0, 7.4],
  [152, 6.6, 5.6],
];
export const secAt = (y: number) => {
  if (y <= SECTIONS[0][0]) return {a: SECTIONS[0][1], b: SECTIONS[0][2]};
  for (let i = 0; i < SECTIONS.length - 1; i++) {
    const [y0, a0, b0] = SECTIONS[i];
    const [y1, a1, b1] = SECTIONS[i + 1];
    if (y <= y1) {
      const t = (y - y0) / (y1 - y0);
      return {a: a0 + (a1 - a0) * t, b: b0 + (b1 - b0) * t};
    }
  }
  const l = SECTIONS[SECTIONS.length - 1];
  return {a: l[1], b: l[2]};
};

export type BodyFrame = {O: V3; R: M3; lean: number; toW: (p: V3) => V3; dirW: (d: V3) => V3};
/** Body-local -> world. The lean tips the upper body forward about the hips. */
export const bodyFrame = (p: Pose3): BodyFrame => {
  const R = ry(p.face);
  const leanR = rx(p.lean);
  const toW = (q: V3) => {
    let l = q;
    if (q.y > BD.hip) {
      const rel = v3(q.x, q.y - BD.hip, q.z);
      const r2 = mv(leanR, rel);
      l = v3(r2.x, r2.y + BD.hip, r2.z);
    }
    return a3(p.pos, mv(R, l));
  };
  const dirW = (d: V3) => mv(R, d);
  return {O: p.pos, R, lean: p.lean, toW, dirW};
};

const ik3 = (S: V3, T: V3, a: number, b: number, pole: V3) => {
  const dv = s3(T, S);
  const d = Math.min(a + b - 0.05, Math.max(Math.abs(a - b) + 0.05, l3(dv)));
  const dir = n3(dv);
  const x = (a * a - b * b + d * d) / (2 * d);
  const h = Math.sqrt(Math.max(0, a * a - x * x));
  let pd = s3(pole, k3(dir, d3(pole, dir)));
  pd = l3(pd) < 1e-4 ? n3(x3(dir, v3(0, 0, 1))) : n3(pd);
  const E = a3(a3(S, k3(dir, x)), k3(pd, h));
  const W = a3(S, k3(dir, d));
  return {E, W};
};

export type BodyGeo = {
  F: BodyFrame;
  lS: V3;
  rS: V3;
  lE: V3;
  rE: V3;
  lW: V3;
  rW: V3;
  lDir: V3;
  rDir: V3;
  lTh: V3;
  rTh: V3;
  head: V3;
  neck: V3;
};

export const bodyGeo = (p: Pose3): BodyGeo => {
  const F = bodyFrame(p);
  const br = 1 + 0.012 * p.breath;
  const lS = F.toW(v3(BD.shoulderX, BD.shoulderY + 0.6 * p.breath, -1));
  const rS = F.toW(v3(-BD.shoulderX, BD.shoulderY + 0.6 * p.breath, -1));
  const arm = (S: V3, A: Arm3) => {
    const T = A.world ? A.h : F.toW(A.h);
    const pole = F.dirW(A.pole);
    const {E, W} = ik3(S, T, BD.upper, BD.fore, pole);
    const fd = n3(s3(W, E));
    const dir = A.dir ? n3(A.world ? A.dir : F.dirW(A.dir)) : fd;
    const th = A.thumb ? n3(A.world ? A.thumb : F.dirW(A.thumb)) : F.dirW(v3(0, 0, 1));
    return {E, W, dir, th};
  };
  const l = arm(lS, p.L);
  const r = arm(rS, p.R);
  const neck = F.toW(v3(0, 151, -0.5));
  const head = F.toW(v3(0, BD.headY * (br > 0 ? 1 : 1), 0.6));
  return {F, lS, rS, lE: l.E, rE: r.E, lW: l.W, rW: r.W, lDir: l.dir, rDir: r.dir, lTh: l.th, rTh: r.th, head, neck};
};

const smoothClosed = (pts: V[]) => {
  let d = `M${P(pts[0])}`;
  for (let i = 0; i < pts.length; i++) {
    const p0 = pts[(i - 1 + pts.length) % pts.length];
    const p1 = pts[i];
    const p2 = pts[(i + 1) % pts.length];
    const p3 = pts[(i + 2) % pts.length];
    const c1 = {x: p1.x + (p2.x - p0.x) / 6, y: p1.y + (p2.y - p0.y) / 6};
    const c2 = {x: p2.x - (p3.x - p1.x) / 6, y: p2.y - (p3.y - p1.y) / 6};
    d += ` C${P(c1)} ${P(c2)} ${P(p2)}`;
  }
  return d + ' Z';
};
const polyD = (pts: V[]) => `M${pts.map(P).join(' L')} Z`;

/** Visible (camera-facing) arc of a torso section at height y, sorted left to right on screen. */
const sectionArc = (Pj: Proj, F: BodyFrame, y: number, scale = 1, n = 28) => {
  const {a, b} = secAt(y);
  const pts: {s: V; w: V3; vis: boolean}[] = [];
  for (let i = 0; i < n; i++) {
    const t = (i / n) * Math.PI * 2;
    const loc = v3(Math.cos(t) * a * scale, y, Math.sin(t) * b * scale);
    const w = F.toW(loc);
    const nrm = F.dirW(v3(Math.cos(t) / a, 0, Math.sin(t) / b));
    const vis = d3(nrm, s3(Pj.eye, w)) > 0;
    const sp = Pj.p(w);
    pts.push({s: {x: sp.x, y: sp.y}, w, vis});
  }
  return pts;
};
const extremes = (pts: {s: V}[]) => {
  let lo = pts[0], hi = pts[0];
  pts.forEach((q) => {
    if (q.s.x < lo.s.x) lo = q;
    if (q.s.x > hi.s.x) hi = q;
  });
  return {lo: lo.s, hi: hi.s};
};
const visibleArc = (pts: {s: V; vis: boolean}[]) => {
  // contiguous visible run (wrap-around), returned in order
  const n = pts.length;
  let start = -1;
  for (let i = 0; i < n; i++) if (pts[i].vis && !pts[(i - 1 + n) % n].vis) start = i;
  if (start < 0) return pts.every((q) => q.vis) ? pts.map((q) => q.s) : [];
  const out: V[] = [];
  for (let k = 0; k < n; k++) {
    const q = pts[(start + k) % n];
    if (!q.vis) break;
    out.push(q.s);
  }
  return out;
};

export type PersonOpts = {
  id: string;
  look: Look;
  /** draw the harness straps and waist belt */
  harness?: boolean;
  /** contour width (cm) */
  ink?: number;
  /** legs drawn (wide shots) */
  legs?: boolean;
  /** extra items attached to this person's draw list */
};

/** The torso silhouette path (screen) and its centre depth. */
export const torsoShape = (Pj: Proj, F: BodyFrame) => {
  const ys = [86, 92, 100, 108, 116, 124, 131, 137, 141, 144.5, 147.5, 150.5];
  const L: V[] = [], R: V[] = [];
  ys.forEach((y) => {
    const e = extremes(sectionArc(Pj, F, y));
    L.push(e.lo);
    R.push(e.hi);
  });
  const hem = visibleArc(sectionArc(Pj, F, 86, 1.0, 36));
  const hemSorted = [...hem].sort((p, q) => p.x - q.x);
  const pts: V[] = [...R.slice().reverse().slice(0, -1), ...L.slice(-1)];
  // right side top -> bottom is R reversed... build: left side bottom->top, then right side top->bottom
  const path: V[] = [...L, ...R.slice().reverse()];
  void pts;
  const hemD = hemSorted.length > 3 ? hemSorted : [];
  return {path, hem: hemD};
};

export const personItems = (Pj: Proj, pose: Pose3, o: PersonOpts, extra?: (g: BodyGeo) => Item[]): Item[] => {
  const g = bodyGeo(pose);
  const F = g.F;
  const look = o.look;
  const id = o.id;
  const items: Item[] = [];
  const zOf = (q: V3) => Pj.p(q).z;
  const kAt = (q: V3) => Pj.k(zOf(q));
  const inkCm = o.ink ?? 0.62;
  const torsoC = F.toW(v3(0, 118, 0));
  const zT = zOf(torsoC);
  const kT = Pj.k(zT);

  // ---------------- legs (trousers + crew shoes)
  const legLimbs: React.ReactNode[] = [];
  if (o.legs) {
    (['L', 'R'] as const).forEach((sd) => {
      const sx = sd === 'L' ? 1 : -1;
      const hipP = F.toW(v3(9 * sx, BD.hip - 2, 0));
      const knee = F.toW(v3(9.5 * sx, BD.hip - BD.thigh, 1.2));
      const ank = F.toW(v3(9.8 * sx, 7, -1));
      const toe = F.toW(v3(10.5 * sx, 3, 15));
      const heel = F.toW(v3(9.8 * sx, 3, -5));
      const k = kAt(knee);
      const zL = Math.max(zOf(knee), zT) + 14;
      const A = Pj.p(hipP), B = Pj.p(knee), C = Pj.p(ank);
      const Tp = Pj.p(toe), Hp = Pj.p(heel);
      legLimbs.push(<Limb key={sd} id={`${id}-lg${sd}`} A={A} B={B} C={C} rA={8.6 * k} rB={6.8 * k} rC={5.6 * k} color={look.pants} spec={0.1} />);
      items.push({
        z: zL,
        key: `${id}-leg${sd}`,
        el: (
          <g>
            <Inked w={inkCm * k * 0.9}>
              <Capsule id={`${id}-sh${sd}`} a={Hp} b={Tp} ra={5.4 * k} rb={5.0 * k} color={look.shoe} spec={0.6} k={0.8} />
              <Capsule id={`${id}-so${sd}`} a={{x: Hp.x, y: Hp.y + 3.4 * k}} b={{x: Tp.x, y: Tp.y + 3.4 * k}} ra={2.4 * k} rb={2.2 * k} color="#B9C4CC" k={0.4} />
            </Inked>
          </g>
        ),
      });
    });
  }

  // ---------------- torso: tee (+ stripes), harness straps, belt
  const tor = torsoShape(Pj, F);
  const torsoD = smoothClosed(tor.path);
  const tc = Pj.p(F.toW(v3(-4, 128, 8)));
  const stripes: React.ReactNode[] = [];
  if (look.stripe) {
    for (let i = 0; i < 6; i++) {
      const y0 = 90 + i * 9.2;
      const A = visibleArc(sectionArc(Pj, F, y0, 1.03, 36));
      const B = visibleArc(sectionArc(Pj, F, y0 + 4.1, 1.03, 36));
      if (A.length < 3 || B.length < 3) continue;
      const As = [...A].sort((p, q) => p.x - q.x);
      const Bs = [...B].sort((p, q) => q.x - p.x);
      stripes.push(<path key={i} d={polyD([...As, ...Bs])} fill={look.stripe} />);
    }
  }
  // harness straps on the front surface
  const surf = (x: number, y: number, out = 0.6) => {
    const {a, b} = secAt(y);
    const xx = Math.max(-a * 0.98, Math.min(a * 0.98, x));
    const z = b * Math.sqrt(Math.max(0, 1 - (xx / a) ** 2)) + out;
    return F.toW(v3(xx, y, z));
  };
  const frontVis = d3(F.dirW(v3(0, 0, 1)), n3(s3(Pj.eye, torsoC))) > -0.15;
  const harness: React.ReactNode[] = [];
  if (o.harness && frontVis) {
    const strapC = '#2A3038';
    ([1, -1] as const).forEach((sx) => {
      const ys = [150.5, 147, 141, 133, 124, 115, 107];
      const xs = ys.map((y) => sx * (10.2 + (150 - y) * 0.06));
      const left = ys.map((y, i) => Pj.p(surf(xs[i] - 2.6, y, y > 146 ? 1.6 : 0.7)));
      const right = ys.map((y, i) => Pj.p(surf(xs[i] + 2.6, y, y > 146 ? 1.6 : 0.7)));
      const d = polyD([...left.map((q) => ({x: q.x, y: q.y})), ...right.reverse().map((q) => ({x: q.x, y: q.y}))]);
      harness.push(
        <g key={`st${sx}`}>
          <Inked w={inkCm * kT * 0.7}>
            <InkPath d={d} fill={strapC} />
          </Inked>
          <Deco>
            {(() => {
              const mid = ys.map((y, i) => Pj.p(surf(xs[i] - 1.6 * sx, y, 0.9)));
              return <path d={`M${mid.map((q) => P(q)).join(' L')}`} fill="none" stroke="#5B6672" strokeWidth={fmt(0.22 * kT)} strokeDasharray={`${fmt(0.9 * kT)} ${fmt(0.7 * kT)}`} opacity={0.8} />;
            })()}
            {/* adjuster buckle */}
            {(() => {
              const q = Pj.p(surf(xs[4], 124, 1.2));
              return <rect x={fmt(q.x - 3.4 * kT)} y={fmt(q.y - 1.4 * kT)} width={fmt(6.8 * kT)} height={fmt(2.8 * kT)} rx={fmt(0.8 * kT)} fill="#7D8995" stroke="#1B2128" strokeWidth={fmt(0.35 * kT)} />;
            })()}
          </Deco>
        </g>,
      );
    });
    // sternum strap with a clip
    const sL = Pj.p(surf(-11.2, 131.5, 1.1));
    const sR = Pj.p(surf(11.2, 131.5, 1.1));
    const sL2 = Pj.p(surf(-11.2, 129.2, 1.1));
    const sR2 = Pj.p(surf(11.2, 129.2, 1.1));
    const mc = Pj.p(surf(0, 130.3, 1.4));
    harness.push(
      <g key="ster">
        <Inked w={inkCm * kT * 0.6}>
          <InkPath d={polyD([sL, sR, sR2, sL2])} fill="#2A3038" />
          <InkPath d={`M${fmt(mc.x - 3 * kT)},${fmt(mc.y - 1.9 * kT)} h${fmt(6 * kT)} v${fmt(3.8 * kT)} h${fmt(-6 * kT)} Z`} fill="#F3F5F7" />
        </Inked>
      </g>,
    );
    // waist belt
    const A = visibleArc(sectionArc(Pj, F, 99.5, 1.05, 36));
    const B = visibleArc(sectionArc(Pj, F, 104.5, 1.05, 36));
    if (A.length > 2 && B.length > 2) {
      const As = [...A].sort((p, q) => p.x - q.x);
      const Bs = [...B].sort((p, q) => q.x - p.x);
      const bc = Pj.p(surf(0, 102, 1.6));
      harness.push(
        <g key="belt">
          <Inked w={inkCm * kT * 0.7}>
            <InkPath d={polyD([...As, ...Bs])} fill="#2A3038" />
            <InkPath d={`M${fmt(bc.x - 4.4 * kT)},${fmt(bc.y - 2.6 * kT)} h${fmt(8.8 * kT)} v${fmt(5.2 * kT)} h${fmt(-8.8 * kT)} Z`} fill="#F3F5F7" />
          </Inked>
          <Deco>
            <rect x={fmt(bc.x - 2.2 * kT)} y={fmt(bc.y - 0.9 * kT)} width={fmt(4.4 * kT)} height={fmt(1.8 * kT)} rx={fmt(0.6 * kT)} fill="#2C333C" />
          </Deco>
        </g>,
      );
    }
  }
  // pelvis (trousers): from the tee hem down to the crotch, a short rounded trapezoid the legs grow out of
  const pel0 = extremes(sectionArc(Pj, F, 86, 1.0, 24));
  const pq = (x: number, y: number, z: number) => {
    const q = Pj.p(F.toW(v3(x, y, z)));
    return {x: q.x, y: q.y};
  };
  const pelD = smoothClosed([pel0.lo, pq(-16.8, 78, 1), pq(-12, 70, 3), pq(0, 69, 5), pq(12, 70, 3), pq(16.8, 78, 1), pel0.hi]);
  items.push({
    z: zT + 1.5,
    key: `${id}-pelvis`,
    el: (
      <Inked w={inkCm * kT}>
        {legLimbs}
        <Blob id={`${id}-pel`} d={pelD} c={Pj.p(F.toW(v3(-5, 82, 6)))} r={30 * kT} color={look.pants} />
      </Inked>
    ),
  });
  items.push({
    z: zT,
    key: `${id}-torso`,
    el: (
      <g>
        <defs>
          <clipPath id={`${id}-tclip`}>
            <path d={torsoD} />
          </clipPath>
        </defs>
        <Inked w={inkCm * kT}>
          <Blob id={`${id}-tee`} d={torsoD} c={tc} r={44 * kT} color={look.shirt} k={1.1} focal={0.5} />
        </Inked>
        <Deco>
          <g clipPath={`url(#${id}-tclip)`}>
            {stripes}
            {/* soft form shading over the stripes: the side away from the light */}
            <path d={torsoD} fill={`url(#${id}-tsh)`} />
            <defs>
              <linearGradient id={`${id}-tsh`} gradientUnits="userSpaceOnUse" x1={fmt(tc.x - 30 * kT)} y1={fmt(tc.y - 20 * kT)} x2={fmt(tc.x + 26 * kT)} y2={fmt(tc.y + 16 * kT)}>
                <stop offset="0" stopColor="#FFFFFF" stopOpacity={0.12} />
                <stop offset="0.55" stopColor="#FFFFFF" stopOpacity={0} />
                <stop offset="1" stopColor="#1B2A44" stopOpacity={0.2} />
              </linearGradient>
            </defs>
          </g>
          {/* collar */}
          {(() => {
            const arc = visibleArc(sectionArc(Pj, F, 150.2, 0.62, 32));
            if (arc.length < 3) return null;
            const s = [...arc].sort((p, q) => p.x - q.x);
            return <path d={`M${s.map(P).join(' L')}`} fill="none" stroke={shade(look.shirt, 0.35)} strokeWidth={fmt(1.0 * kT)} strokeLinecap="round" opacity={0.7} />;
          })()}
        </Deco>
        {harness}
      </g>
    ),
  });

  // ---------------- neck + head
  const hc = Pj.p(g.head);
  const kH = Pj.k(hc.z);
  const nk = Pj.p(g.neck);
  // face direction vs camera -> 3/4 turn
  const fdir = F.dirW(mv(ry(pose.hYaw), v3(0, 0, 1)));
  const toCam = n3(s3(Pj.eye, g.head));
  const side = -d3(fdir, Pj.right); // + = facing screen-left
  const facing = d3(fdir, toCam);
  const turnDeg = (Math.atan2(side, Math.max(0.05, facing)) * 180) / Math.PI;
  const mirror = turnDeg < 0;
  const turn = Math.min(1, Math.abs(turnDeg) / 58);
  // screen roll of the head: the camera roll plus the person's tilt (mirrored heads take the sign into account inside Head)
  const roll = (Pj.cam.roll ?? 0) + pose.hRoll;
  const headR = BD.headR * kH;
  const hcAdj = {x: hc.x, y: hc.y + pose.hNod * 0.25 * kH};
  items.push({
    z: hc.z - 2,
    key: `${id}-head`,
    el: (
      <g>
        <Inked w={inkCm * kH}>
          <Capsule id={`${id}-nk`} a={{x: nk.x, y: nk.y + 2 * kH}} b={{x: hcAdj.x, y: hcAdj.y + headR * 0.55}} ra={5.6 * kH} rb={5.2 * kH} color={look.skin} k={0.8} />
        </Inked>
        <Head
          id={`${id}-hd`}
          c={hcAdj}
          R={headR}
          roll={roll}
          turn={turn}
          expr={{...pose.expr, gy: pose.expr.gy + pose.hNod * 0.02}}
          blink={pose.blink}
          skin={look.skin}
          hair={look.hair}
          inkW={7}
          hairSway={pose.sway ?? 0}
          glasses={look.glasses}
          mirror={mirror}
          style={look.style}
        />
      </g>
    ),
  });

  // ---------------- arms
  (['L', 'R'] as const).forEach((sd) => {
    const S = sd === 'L' ? g.lS : g.rS;
    const E = sd === 'L' ? g.lE : g.rE;
    const W = sd === 'L' ? g.lW : g.rW;
    const dir = sd === 'L' ? g.lDir : g.rDir;
    const th = sd === 'L' ? g.lTh : g.rTh;
    const A = sd === 'L' ? pose.L : pose.R;
    const Sp = Pj.p(S), Ep = Pj.p(E), Wp = Pj.p(W);
    const kA = Pj.k((Sp.z + Ep.z + Wp.z) / 3);
    const zA = (Sp.z + Ep.z * 2 + Wp.z) / 4 - 3;
    const kn = Pj.p(a3(W, k3(dir, 8)));
    const ang = (Math.atan2(kn.y - Wp.y, kn.x - Wp.x) * 180) / Math.PI;
    // thumb side on screen
    const tp = Pj.p(a3(W, k3(th, 5)));
    const ax = {x: Math.cos((ang * Math.PI) / 180), y: Math.sin((ang * Math.PI) / 180)};
    const nrm = {x: -ax.y, y: ax.x};
    const thumbSide: 1 | -1 = (tp.x - Wp.x) * nrm.x + (tp.y - Wp.y) * nrm.y >= 0 ? 1 : -1;
    const back = k3(x3(dir, th), sd === 'L' ? -1 : 1);
    const view: 'back' | 'palm' = d3(back, n3(s3(Pj.eye, W))) >= 0 ? 'back' : 'palm';
    const kW = Pj.k(Wp.z);
    const sleeveEnd = lerp3(S, E, look.longSleeve ? 1 : 0.56);
    const sl0 = Pj.p(a3(S, k3(n3(s3(E, S)), 1.0)));
    const sl1 = Pj.p(sleeveEnd);
    const skin = look.skin;
    items.push({
      z: zA,
      key: `${id}-arm${sd}`,
      el: (
        <g>
          <Inked w={inkCm * kA * 0.85}>
            {look.longSleeve ? (
              <Limb id={`${id}-ar${sd}`} A={Sp} B={Ep} C={Wp} rA={5.6 * kA} rB={4.6 * kA} rC={3.9 * kA} color={look.shirt} spec={0.12} crease={inkCm * kA * 0.5} />
            ) : (
              <Limb id={`${id}-ar${sd}`} A={Sp} B={Ep} C={Wp} rA={4.9 * kA} rB={4.0 * kA} rC={3.2 * kA} color={skin} spec={0.18} crease={inkCm * kA * 0.5} />
            )}
          </Inked>
          {!look.longSleeve && (
            <Inked w={inkCm * kA * 0.85}>
              <Capsule id={`${id}-sl${sd}`} a={sl0} b={sl1} ra={5.5 * kA} rb={5.2 * kA} color={look.shirt} spec={0.2} k={0.9} />
            </Inked>
          )}
          {!look.longSleeve && look.stripe && (() => {
            const a0 = Pj.p(lerp3(S, sleeveEnd, 0.66)), a1 = Pj.p(lerp3(S, sleeveEnd, 0.84));
            const L = Math.hypot(a1.x - a0.x, a1.y - a0.y) || 1;
            const nx = -(a1.y - a0.y) / L, ny = (a1.x - a0.x) / L;
            const r = 5.6 * kA;
            const d = `M${fmt(a0.x + nx * r)},${fmt(a0.y + ny * r)} L${fmt(a1.x + nx * r)},${fmt(a1.y + ny * r)} L${fmt(a1.x - nx * r)},${fmt(a1.y - ny * r)} L${fmt(a0.x - nx * r)},${fmt(a0.y - ny * r)} Z`;
            const cap = `M${fmt(a0.x)},${fmt(a0.y)} m${fmt(-r)},0`;
            void cap;
            return (
              <Deco>
                <defs>
                  <clipPath id={`${id}-sc${sd}`}>
                    <path d={capsuleD(sl0, sl1, 5.5 * kA, 5.2 * kA)} />
                  </clipPath>
                </defs>
                <path d={d} fill={look.stripe} clipPath={`url(#${id}-sc${sd})`} />
              </Deco>
            );
          })()}
          {look.longSleeve && (
            <Deco>
              <Capsule id={`${id}-cf${sd}`} a={Pj.p(lerp3(E, W, 0.84))} b={Pj.p(lerp3(E, W, 0.98))} ra={4.15 * kA} rb={4.05 * kA} color={shade(look.shirt, 0.18)} k={0.7} />
            </Deco>
          )}
          <Inked w={inkCm * kW * 0.8}>
            <Hand id={`${id}-hn${sd}`} wrist={{x: Wp.x, y: Wp.y}} ang={ang} L={BD.hand * kW} thumbSide={thumbSide} view={view} pose={A.hand} color={skin} ink={inkCm * kW * 0.75} />
          </Inked>
        </g>
      ),
    });
  });
  if (extra) items.push(...extra(g));
  return items;
};

export {lit, mix};
