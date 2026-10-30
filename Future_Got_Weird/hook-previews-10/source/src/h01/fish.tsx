// The host: a spotted rose snapper (Lutjanus guttatus) head, mouth open, in fish-local millimetres (see geo.ts).
// Drawn in layers so the open mouth reads correctly from the high 3/4 view and from the low side orbit:
//   headAll -> throat (the opening) -> lower-jaw exterior -> [floor, cutaway, tongue, parasite] -> lower lip and teeth
//   -> near cheek -> maxilla -> snout and upper teeth -> eye.
import React from 'react';
import {hull, smoothClosed, smoothOpen, V2, V3} from '../shared/three';
import {Inked, INK} from '../shared/ink';
import {clamp, lerp} from '../shared/lib';
import {Ctx, f2, P, PJ, poly} from './geo';
import {LinG, lit, mix, RadG, shade} from './paint';

const R = Math.PI / 180;
export const INKW = 7.5;

// ------------------------------------------------------------------ shape
export const RIM = {cx: -22, rx: 44, ry: 12.8, corner: 79};
export const rimW = (fx: number) => RIM.ry * Math.sqrt(Math.max(0, 1 - ((fx - RIM.cx) / RIM.rx) ** 2));
export const rimZ = (fx: number) => 1.5 + 1.9 * (1 - clamp((fx - RIM.cx) / RIM.rx, -1, 1));
/** a point on the lip rim; th in degrees (-90 far hinge .. 0 chin/snout tip .. +90 near hinge) */
export const rimPt = (th: number, prot = 0): V3 => {
  const c = Math.cos(th * R);
  return [RIM.cx + RIM.rx * c + prot * c * c, RIM.ry * Math.sin(th * R), 1.5 + 1.9 * (1 - c)];
};
export const dorsal = (fx: number) => {
  const u = Math.max(0, 23.6 - fx);
  return 4.6 + 0.9 * u - 0.0026 * u * u;
};
export const headW = (fx: number) => Math.min(17.5, 4.0 + 0.44 * Math.max(0, 23.6 - fx));
export const venH = (fx: number) => -10 - 0.32 * Math.max(0, -14 - fx);
const SNOUT_X = [24.0, 23.5, 22.6, 21, 18, 14, 9, 3, -3, -8, -13.9];
const FULL_X = [-14, -19, -25, -33, -43, -56, -74, -104, -144];

/** snout arch section (above the upper lip) */
const snoutSec = (fx: number, prot: number): V3[] => {
  const wb = fx > 22.2 ? Math.max(0.8, 3.0 - (fx - 22.2) * 1.4) : rimW(fx) + 1.3;
  const zb = fx > 22.2 ? 1.6 + (fx - 22.2) * 1.2 : rimZ(fx) - 0.2;
  const zt = dorsal(fx), wm = headW(fx);
  const out: V3[] = [];
  const N = 9;
  for (const sgn of [1, -1]) {
    for (let i = 0; i <= N; i++) {
      const h = sgn > 0 ? i / N : 1 - i / N;
      const w = (wb * (1 - h) + wm * h * 1.25) * Math.sqrt(Math.max(0, 1 - h ** 2.5));
      const pr = prot * (1 - h) ** 2 * clamp((fx + 8) / 30);
      out.push([fx + pr, sgn * w, zb + (zt - zb) * h]);
    }
  }
  return out;
};
/** full head section behind the mouth corner; side: 'all' | 'near' */
const fullSec = (fx: number, near = false): V3[] => {
  const zt = dorsal(fx), zv = venH(fx), wm = headW(fx);
  const out: V3[] = [];
  const N = 12;
  for (const sgn of near ? [1] : [1, -1]) {
    for (let i = 0; i <= N; i++) {
      const h = i / N;
      const w = wm * Math.pow(Math.sin(Math.PI * Math.pow(h, 0.92)), 0.62);
      out.push([fx, sgn * w, zv + (zt - zv) * h]);
    }
  }
  if (near) out.push([fx, -2, zv + (zt - zv) * 0.98], [fx, -2, zv + 0.5]);
  return out;
};
export const headSurfaceW = (fx: number, fz: number) => {
  const zt = dorsal(fx), zv = venH(fx), wm = headW(fx);
  const h = clamp((fz - zv) / (zt - zv));
  return wm * Math.pow(Math.sin(Math.PI * Math.pow(h, 0.92)), 0.62);
};

/** the union of slab hulls of a loft: one path */
const loftPath = (secs: V2[][]) => {
  let d = '';
  for (let i = 0; i < secs.length - 1; i++) d += poly(hull([...secs[i], ...secs[i + 1]])) + ' ';
  return d;
};

// ------------------------------------------------------------------ jaw
const jawSec = (fx: number): V3[] => {
  const wr = rimW(fx) + 1.0, zr = rimZ(fx);
  const zv = lerp(-12.5, -3.6, clamp((fx + 22) / 44) ** 1.3);
  const out: V3[] = [];
  const N = 12;
  for (let i = 0; i <= N; i++) {
    const ph = (Math.PI * i) / N;
    out.push([fx, wr * Math.cos(ph) * (1 + 0.12 * Math.sin(ph)), zr - (zr - zv) * Math.pow(Math.sin(ph), 0.75)]);
  }
  return out;
};
const JAW_X = [-22, -17, -11, -5, 1, 7, 12, 16, 18.8, 20.6, 21.5, 22.1];

export type FishArt = {ctx: Ctx; t: number; uid: string};

const colTop = '#7A1C2C', colMid = '#B5303F', colSide = '#D9545A', colLow = '#EE8F86', colBelly = '#F5CDBE';

/** the whole head (drawn first, under the opening) */
export const HeadBack: React.FC<FishArt> = ({ctx, uid}) => {
  const prot = ctx.fish.prot;
  const secs = [...SNOUT_X.map((x) => snoutSec(x, prot)), ...FULL_X.map((x) => fullSec(x))].map((s) => s.map((p) => P(ctx, p)));
  const d = loftPath(secs);
  return <HeadPaint ctx={ctx} d={d} uid={uid + 'hb'} />;
};

const HeadPaint: React.FC<{ctx: Ctx; d: string; uid: string; ink?: boolean}> = ({ctx, d, uid, ink = true}) => {
  const top = P(ctx, [-24, 0, dorsal(-24)]), bot = P(ctx, [-24, 0, venH(-24)]);
  const hi = P(ctx, [8, 8, 16]);
  const sh = P(ctx, [-40, 16, -6]);
  const body = (
    <>
      <defs>
        <LinG id={uid + 'g'} a={top} b={bot} stops={[[0, colTop], [0.22, colMid], [0.45, colSide], [0.72, colLow], [1, colBelly]]} />
        <radialGradient id={uid + 'h'} gradientUnits="userSpaceOnUse" cx={f2(hi.x)} cy={f2(hi.y)} r={f2(Math.abs(top.y - bot.y) * 0.75)}>
          <stop offset="0" stopColor="#FFE9D2" stopOpacity="0.26" />
          <stop offset="1" stopColor="#FFF1DE" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={uid + 's'} gradientUnits="userSpaceOnUse" cx={f2(sh.x)} cy={f2(sh.y)} r={f2(Math.abs(top.y - bot.y) * 0.8)}>
          <stop offset="0" stopColor="#3A0E24" stopOpacity="0.38" />
          <stop offset="1" stopColor="#3A0E24" stopOpacity="0" />
        </radialGradient>
      </defs>
      <path d={d} fill={`url(#${uid}g)`} />
      <path d={d} fill={`url(#${uid}h)`} />
      <path d={d} fill={`url(#${uid}s)`} />
    </>
  );
  return ink ? <Inked w={INKW}>{body}</Inked> : body;
};

/** scales and markings on the visible near side, behind the cheek */
export const HeadMarks: React.FC<FishArt> = ({ctx, uid}) => {
  const out: React.ReactNode[] = [];
  // scale rows on the cheek/opercle (fy>0 surface)
  let k = 0;
  for (let fx = -30; fx >= -110; fx -= 3.4) {
    const row = Math.round((-30 - fx) / 3.4);
    for (let fz = venH(fx) + 4; fz < dorsal(fx) - 3; fz += 3.0) {
      const z = fz + (row % 2) * 1.5;
      if (fx > -46 && z > 12) continue; // keep the eye area and the smooth snout clean
      const w = headSurfaceW(fx, z);
      const a = P(ctx, [fx + 1.4, w, z - 1.5]), m = P(ctx, [fx - 0.6, w + 0.2, z]), b = P(ctx, [fx + 1.4, w, z + 1.5]);
      out.push(<path key={k++} d={`M${f2(a.x)},${f2(a.y)} Q${f2(m.x)},${f2(m.y)} ${f2(b.x)},${f2(b.y)}`} fill="none" stroke={shade(colSide, 0.35)} strokeOpacity={0.32} strokeWidth={1.6} />);
    }
  }
  // preopercle edge and the gill-cover margin
  const pre: V2[] = [];
  for (let i = 0; i <= 10; i++) {
    const u = i / 10;
    const fx = lerp(-34, -44, Math.sin(u * Math.PI * 0.5)) + 4 * u * u;
    const fz = lerp(16, -9, u);
    pre.push(P(ctx, [fx, headSurfaceW(fx, fz) + 0.2, fz]));
  }
  const op: V2[] = [];
  for (let i = 0; i <= 10; i++) {
    const u = i / 10;
    const fx = -52 - 6 * Math.sin(u * Math.PI);
    const fz = lerp(30, -14, u);
    op.push(P(ctx, [fx, headSurfaceW(fx, fz) + 0.2, fz]));
  }
  // nostrils
  const n1 = P(ctx, [-6, headSurfaceW(-6, 22) * 0.92, 22]), n2 = P(ctx, [-9.5, headSurfaceW(-9.5, 24) * 0.92, 24]);
  const s = P(ctx, [-6, 10, 22]).s;
  return (
    <g>
      {out}
      <path d={smoothOpen(pre)} fill="none" stroke={shade(colSide, 0.5)} strokeOpacity={0.55} strokeWidth={2.2} />
      <path d={smoothOpen(op)} fill="none" stroke={shade(colTop, 0.45)} strokeOpacity={0.65} strokeWidth={2.6} />
      <ellipse cx={f2(n1.x)} cy={f2(n1.y)} rx={f2(0.75 * s)} ry={f2(0.5 * s)} fill={shade(colTop, 0.6)} opacity={0.7} />
      <ellipse cx={f2(n2.x)} cy={f2(n2.y)} rx={f2(0.6 * s)} ry={f2(0.45 * s)} fill={shade(colTop, 0.6)} opacity={0.6} />
    </g>
  );
};

/** the dark opening between the lips (throat, far inner cheek) */
export const Throat: React.FC<FishArt> = ({ctx, uid}) => {
  const up: V2[] = [], lo: V2[] = [];
  for (let th = -RIM.corner; th <= RIM.corner; th += 4) up.push(P(ctx, rimPt(th, ctx.fish.prot)));
  for (let th = RIM.corner; th >= -RIM.corner; th -= 4) lo.push(PJ(ctx, rimPt(th)));
  const half = Math.floor(up.length / 2);
  const c = P(ctx, [-27, 0, 0]);
  const tip = P(ctx, [22, 0, 1.5]);
  const r = Math.hypot(tip.x - c.x, tip.y - c.y) * 1.15;
  // gill arches deep in the throat: pale curved bars
  const arches = [-25, -28.5, -32].map((fx, i) => {
    const pts: V2[] = [];
    for (let k = 0; k <= 10; k++) {
      const a = (-80 + 160 * k / 10) * R;
      pts.push(P(ctx, [fx + 2 * Math.cos(a), 8 * Math.sin(a), -2.5 + 5.5 * Math.cos(a)]));
    }
    return <path key={i} d={smoothOpen(pts)} fill="none" stroke="#C9737A" strokeOpacity={0.5 - i * 0.12} strokeWidth={f2(c.s * 1.2)} strokeLinecap="round" />;
  });
  return (
    <g>
      <defs>
        <radialGradient id={uid + 'th'} gradientUnits="userSpaceOnUse" cx={f2(c.x)} cy={f2(c.y)} r={f2(r)}>
          <stop offset="0" stopColor="#1C070D" />
          <stop offset="0.38" stopColor="#3E1018" />
          <stop offset="0.8" stopColor="#7E2A35" />
          <stop offset="1" stopColor="#A2434B" />
        </radialGradient>
      </defs>
      <path d={poly([...up, ...lo])} fill={`url(#${uid}th)`} />
      <path d={poly([...up.slice(0, half + 1), ...lo.slice(lo.length - 1 - half)])} fill={`url(#${uid}th)`} />
      <path d={poly([...up.slice(half), ...lo.slice(0, lo.length - half)])} fill={`url(#${uid}th)`} />
      <g clipPath={`url(#${uid}thc)`}>{arches}</g>
      <clipPath id={uid + 'thc'}><path d={poly([...up, ...lo])} /></clipPath>
    </g>
  );
};

/** lower jaw outside */
export const JawOut: React.FC<FishArt> = ({ctx, uid}) => {
  const secs = JAW_X.map((x) => jawSec(x).map((p) => PJ(ctx, p)));
  const d = loftPath(secs);
  const a = PJ(ctx, [10, 6, rimZ(10)]), b = PJ(ctx, [10, 4, -7]);
  const hi = PJ(ctx, [20, 2, 0]);
  return (
    <Inked w={INKW}>
      <defs>
        <LinG id={uid + 'jg'} a={a} b={b} stops={[[0, '#F4B3A3'], [0.45, '#E58E86'], [1, '#B4585E']]} />
        <radialGradient id={uid + 'jh'} gradientUnits="userSpaceOnUse" cx={f2(hi.x)} cy={f2(hi.y)} r={f2(hi.s * 16)}>
          <stop offset="0" stopColor="#FFF1E4" stopOpacity="0.35" />
          <stop offset="1" stopColor="#FFF1E4" stopOpacity="0" />
        </radialGradient>
      </defs>
      <path d={d} fill={`url(#${uid}jg)`} />
      <path d={d} fill={`url(#${uid}jh)`} />
    </Inked>
  );
};
/** the jaw outline path (for clipping the cut window) */
export const jawPath = (ctx: Ctx) => loftPath(JAW_X.map((x) => jawSec(x).map((p) => PJ(ctx, p))));

/** the floor of the mouth inside the lower lip */
export const floorPoly = (ctx: Ctx): V2[] => {
  const pts: V2[] = [];
  for (let th = -RIM.corner; th <= RIM.corner; th += 3) pts.push(PJ(ctx, rimPt(th)));
  pts.push(PJ(ctx, [-18, 10, -2]), PJ(ctx, [-26, 0, -2.5]), PJ(ctx, [-18, -10, -2]));
  return pts;
};
export const Floor: React.FC<FishArt> = ({ctx, uid}) => {
  const fp = floorPoly(ctx);
  const c = PJ(ctx, [15, 1, -2]);
  return (
    <g>
      <defs>
        <RadG id={uid + 'fl'} c={c} r={c.s * 34} col="#C35A66" focal={0.1} stops={[[0, '#F2A3A0'], [0.32, '#D06A72'], [0.62, '#8A2C3A'], [0.85, '#3E0F1A'], [1, '#22070D']]} />
      </defs>
      <path d={poly(fp)} fill={`url(#${uid}fl)`} />
    </g>
  );
};

/** a fleshy lip band along part of the lower rim, with its teeth */
export const LipBand: React.FC<FishArt & {from: number; to: number; mask?: string}> = ({ctx, from, to, mask}) => {
  const pts: (V2 & {s: number})[] = [];
  for (let th = from; th <= to; th += 3) pts.push(PJ(ctx, rimPt(th)));
  const hi: V2[] = [];
  for (let th = from; th <= to; th += 3) {
    const p = rimPt(th);
    hi.push(PJ(ctx, [p[0] + 0.2 * Math.cos(th * R), p[1] + 0.2 * Math.sin(th * R), p[2] + 0.45]));
  }
  const teeth: React.ReactNode[] = [];
  let k = 0;
  for (let th = Math.ceil(from / 6) * 6; th <= Math.min(to, 70); th += 6) {
    const b = rimPt(th);
    const dx = Math.cos(th * R), dy = Math.sin(th * R);
    const len = Math.abs(th) < 18 ? 1.25 : 0.85;
    const p1 = PJ(ctx, [b[0] - 0.3 * dy - 0.55 * dx, b[1] + 0.3 * dx - 0.55 * dy, b[2] + 0.1]);
    const p2 = PJ(ctx, [b[0] + 0.3 * dy - 0.55 * dx, b[1] - 0.3 * dx - 0.55 * dy, b[2] + 0.1]);
    const tp = PJ(ctx, [b[0] - 0.85 * dx, b[1] - 0.85 * dy, b[2] + 0.2 + len]);
    teeth.push(<path key={k++} d={`M${f2(p1.x)},${f2(p1.y)} Q${f2((p1.x + tp.x) / 2 - 1)},${f2((p1.y + tp.y) / 2)} ${f2(tp.x)},${f2(tp.y)} Q${f2((p2.x + tp.x) / 2 + 1)},${f2((p2.y + tp.y) / 2)} ${f2(p2.x)},${f2(p2.y)} Z`} fill="#F4ECDD" stroke={INK} strokeWidth={1.3} strokeLinejoin="round" />);
  }
  const sw = Math.max(3, pts[Math.floor(pts.length / 2)].s * 0.95);
  return (
    <g mask={mask}>
      {teeth}
      <path d={smoothOpen(pts)} fill="none" stroke={INK} strokeWidth={f2(sw + 2.6)} strokeLinecap="round" strokeOpacity={0.8} />
      <path d={smoothOpen(pts)} fill="none" stroke="#E58C88" strokeWidth={f2(sw)} strokeLinecap="round" />
      <path d={smoothOpen(hi)} fill="none" stroke="#FFD2C4" strokeWidth={f2(sw * 0.28)} strokeLinecap="round" opacity={0.8} />
    </g>
  );
};

/** region on screen above the near half of the lower lip (where the inside of the mouth is not hidden by the jaw wall) */
export const aboveNearRim = (ctx: Ctx): string => {
  const pts: V2[] = [];
  for (let th = -30; th <= 90; th += 4) pts.push(PJ(ctx, rimPt(th)));
  const a = pts[0], b = pts[pts.length - 1];
  return poly([{x: a.x - 4000, y: a.y + 30}, ...pts, {x: b.x + 4000, y: b.y}, {x: b.x + 4000, y: -6000}, {x: a.x - 4000, y: -6000}]);
};

/** near cheek behind the mouth corner (covers the jaw joint); its front edge is the cheek margin */
export const NearCheek: React.FC<FishArt> = ({ctx, uid}) => {
  const front: [number, number][] = [[-12.6, 7.5], [-13.6, 3.2], [-15.2, -1.0], [-17.6, -5.2], [-20.4, -8.8], [-23.2, -11.8], [-25.8, -13.6]];
  const back: [number, number][] = [];
  for (let fx = -28; fx >= -76; fx -= 6) back.push([fx, venH(fx) + 1.0]);
  const top: [number, number][] = [[-76, 4], [-44, 5], [-26, 8.8], [-16, 10.2]];
  const pt = ([x, z]: [number, number]) => P(ctx, [x, headSurfaceW(x, z) + 0.2, z]);
  const d = poly([...front, ...back, ...top].map(pt));
  const fr = smoothOpen(front.map(pt));
  return (
    <g>
      <HeadPaint ctx={ctx} d={d} uid={uid + 'nc'} ink={false} />
      <path d={fr} fill="none" stroke={shade(colSide, 0.35)} strokeWidth={9} strokeOpacity={0.35} strokeLinecap="round" transform="translate(4,2)" />
      <path d={fr} fill="none" stroke={INK} strokeWidth={2.7} strokeLinecap="round" />
    </g>
  );
};

/** the maxilla: the long upper-jaw bone along the side of the mouth; its rear end swings down as the mouth opens */
export const Maxilla: React.FC<FishArt> = ({ctx, uid}) => {
  const a = ctx.fish.alpha * 0.32;
  const piv = {x: 14, z: 3};
  const rot = (fx: number, fz: number): [number, number] => {
    const c = Math.cos(a * R), s = Math.sin(a * R);
    const dx = fx - piv.x, dz = fz - piv.z;
    return [piv.x + dx * c + dz * s, piv.z - dx * s + dz * c];
  };
  const outline: [number, number][] = [[13, 4.4], [6, 3.1], [-3, 2.5], [-9, 2.1], [-13.6, 1.5], [-16.3, 3.0], [-16.8, 6.0], [-15.2, 8.4], [-10, 8.1], [-3, 6.8], [6, 5.6]];
  const pts = outline.map(([fx, fz]) => {
    const [x, z] = rot(fx, fz);
    return P(ctx, [x, headSurfaceWClamp(x, z) + 0.6, z]);
  });
  const c = pts[7];
  return (
    <Inked w={INKW * 0.8}>
      <defs>
        <RadG id={uid + 'mx'} c={c} r={c.s * 18} col="#D9625F" k={0.8} />
      </defs>
      <path d={smoothClosed(pts)} fill={`url(#${uid}mx)`} />
    </Inked>
  );
};
const headSurfaceWClamp = (fx: number, fz: number) => (fx > -20 ? Math.max(rimW(fx) + 1.5, snoutW(fx, fz)) : headSurfaceW(fx, fz));
/** half-width of the snout surface at a height */
export const snoutW = (fx: number, fz: number) => {
  const wb = rimW(fx) + 1.3, zb = rimZ(fx) - 0.2, zt = dorsal(fx), wm = headW(fx);
  const h = clamp((fz - zb) / (zt - zb));
  return (wb * (1 - h) + wm * h * 1.25) * Math.sqrt(Math.max(0, 1 - h ** 2.5));
};

/** snout and upper jaw (drawn over the inside of the mouth) */
export const Snout: React.FC<FishArt> = ({ctx, uid}) => {
  const prot = ctx.fish.prot;
  const secs = SNOUT_X.map((x) => snoutSec(x, prot).map((p) => P(ctx, p)));
  const d = loftPath(secs);
  // upper teeth: small cones and two front canines
  const teeth: React.ReactNode[] = [];
  let k = 0;
  for (let th = -70; th <= 74; th += 6.5) {
    const b = rimPt(th, prot);
    const dx = Math.cos(th * R), dy = Math.sin(th * R);
    const can = Math.abs(Math.abs(th) - 16) < 4;
    const len = can ? 3.0 : 1.1;
    const wdt = can ? 0.62 : 0.4;
    const p1 = P(ctx, [b[0] - wdt * dy - 0.4 * dx, b[1] + wdt * dx - 0.4 * dy, b[2] + 0.1]);
    const p2 = P(ctx, [b[0] + wdt * dy - 0.4 * dx, b[1] - wdt * dx - 0.4 * dy, b[2] + 0.1]);
    const tp = P(ctx, [b[0] - 0.9 * dx + (can ? 0.4 : 0), b[1] - 0.9 * dy, b[2] - len]);
    teeth.push(<path key={k++} d={`M${f2(p1.x)},${f2(p1.y)} Q${f2((p1.x + tp.x) / 2 - 1.5)},${f2((p1.y + tp.y) / 2)} ${f2(tp.x)},${f2(tp.y)} Q${f2((p2.x + tp.x) / 2 + 1.5)},${f2((p2.y + tp.y) / 2)} ${f2(p2.x)},${f2(p2.y)} Z`} fill="#F7F0E2" stroke={INK} strokeWidth={1.5} strokeLinejoin="round" />);
  }
  return (
    <g>
      {teeth}
      <HeadPaint ctx={ctx} d={d} uid={uid + 'sn'} />
    </g>
  );
};

/** the fleshy upper lip (premaxilla) along the visible part of the upper rim */
export const UpperLip: React.FC<FishArt> = ({ctx}) => {
  const prot = ctx.fish.prot;
  const pts: (V2 & {s: number})[] = [], hi: V2[] = [];
  for (let th = -14; th <= RIM.corner; th += 3) {
    const p = rimPt(th, prot);
    const o = 0.55;
    pts.push(P(ctx, [p[0] + o * Math.cos(th * R), p[1] + o * Math.sin(th * R), p[2] + 0.55]));
    hi.push(P(ctx, [p[0] + 0.9 * Math.cos(th * R), p[1] + 0.9 * Math.sin(th * R), p[2] + 1.05]));
  }
  const sw = Math.max(3, pts[Math.floor(pts.length / 2)].s * 1.05);
  return (
    <g>
      <path d={smoothOpen(pts)} fill="none" stroke={INK} strokeWidth={f2(sw + 2.6)} strokeLinecap="round" strokeOpacity={0.8} />
      <path d={smoothOpen(pts)} fill="none" stroke="#D9686F" strokeWidth={f2(sw)} strokeLinecap="round" />
      <path d={smoothOpen(hi)} fill="none" stroke="#FFC9BA" strokeWidth={f2(sw * 0.25)} strokeLinecap="round" opacity={0.7} />
    </g>
  );
};

/** the fish's eye on the near side */
export const Eye: React.FC<FishArt> = ({ctx, uid, t}) => {
  const ec: V3 = [-17.5, 0, 18.5];
  const w = headSurfaceW(ec[0], ec[2]);
  const c: V3 = [ec[0], w + 0.8, ec[2]];
  const n = [0.18, 0.95, 0.25];
  const ring = (r: number, off: [number, number] = [0, 0], bulge = 0) => {
    const pts: V2[] = [];
    for (let i = 0; i < 28; i++) {
      const a = (i / 28) * Math.PI * 2;
      const u = Math.cos(a) * r + off[0], v = Math.sin(a) * r + off[1];
      pts.push(P(ctx, [c[0] + u - n[0] * 0.0, c[1] + bulge - (u * n[0] + v * n[2]) * 0.2, c[2] + v]));
    }
    return smoothClosed(pts);
  };
  const look: [number, number] = [1.2 + 0.4 * Math.sin(t * 1.3), -0.6 + 0.3 * Math.sin(t * 0.9 + 1)];
  const cc = P(ctx, c);
  const hl = P(ctx, [c[0] + 2.0, c[1] + 1.2, c[2] + 2.6]);
  return (
    <g>
      <defs>
        <RadG id={uid + 'ir'} c={P(ctx, [c[0] + look[0], c[1] + 1, c[2] + look[1]])} r={cc.s * 8} col="#C8642A" k={1} stops={[[0, '#F9C45A'], [0.45, '#E58A3A'], [0.8, '#B5402E'], [1, '#6A1E1E']]} />
      </defs>
      <path d={ring(7.9)} fill={shade(colSide, 0.25)} stroke={INK} strokeWidth={2.2} />
      <path d={ring(6.6, [0, 0], 0.8)} fill={`url(#${uid}ir)`} stroke={INK} strokeWidth={2.4} />
      <path d={ring(3.5, look, 1.4)} fill="#0E0B10" />
      <ellipse cx={f2(hl.x)} cy={f2(hl.y)} rx={f2(cc.s * 1.6)} ry={f2(cc.s * 1.05)} transform={`rotate(-30 ${f2(hl.x)} ${f2(hl.y)})`} fill="#FFFFFF" opacity={0.85} />
      <ellipse cx={f2(hl.x + cc.s * 2.6)} cy={f2(hl.y + cc.s * 1.9)} rx={f2(cc.s * 0.5)} ry={f2(cc.s * 0.4)} fill="#FFFFFF" opacity={0.6} />
    </g>
  );
};
