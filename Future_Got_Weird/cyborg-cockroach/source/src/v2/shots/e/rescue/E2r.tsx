// E2 (655-679, "beneath collapsed"): the descent carried on from E1, now low at the opening under the fallen slab. The
// camera keeps E1's forward speed and keeps sinking toward the insect's height as it follows the medic in under the
// slab's lip: one physical move through the gap, built as a pinhole camera over flat layers at real depths (mm): the
// slab's broken front face and the block propping it are cards at the lip, the floor and the slab's underside are
// planes, the passage beyond and its thin shaft of daylight are cards deeper in, the rescuer's glove (it has just set
// the insect down) a card on the floor at the right. Nearer things grow and slide out faster than far ones (the glove
// leaves first, the lip passes overhead), so it reads as moving through the gap, never as a zoom. The daylight behind
// falls off as the lip passes over; the insect grows steadily from E1's size to E3's.
import React from 'react';
import {poseRoach, straightPath, RoachPose} from '../../../../rig/roach';
import {Roach2D} from '../../../roach/Roach2D';
import {Gear2D} from '../../../roach/Gear2D';
import {viewAt, View} from '../../../roach/ortho';
import {clamp, sr, rnd} from '../../../../lib/ease';
import {INK} from '../../../../lib/ink';
import {mix, shade as shadeC, lit as litC} from '../../../../lib/color';
import {RB, Pt, Slab, Rebar, Glow2, Motes, Shaft, VGrad, jag, poly, f2} from '../art';
import {GloveArm} from '../../b/common';
import {HAND_RELAXED} from '../../../dc/Hand';
import {ShotProps} from '../../index2';
import {idf, FPS, cardT, probe} from './kit';
import {E1_END_RATE} from './E1r';

export const E2_N = 25;
const E2_F0 = 655;
/** the lens (px focal length) and its principal point: aimed level into the gap */
const F = 740;
const G = {x: 540, y: 1250};
/** the lip of the fallen slab (depth, mm), the gap's height under it (mm, lower to the right where the slab comes down
 *  to the floor), the slab's thickness */
const DL = 200;
const hL = (x: number) => Math.max(0, 95 - 0.16 * x);
const T = 210;

// ---------------------------------------------------------------- the camera
const herm = (u: number, m0: number, m1: number) => {
  const x = clamp(u);
  return -2 * x ** 3 + 3 * x ** 2 + m0 * (x ** 3 - 2 * x ** 2 + x) + m1 * (x ** 3 - x ** 2);
};
const ZC0 = -105, ZC1 = 158;
/** E1's forward rate at the cut (the subject layer's growth per frame), carried into the slab here */
const V0 = E1_END_RATE * (DL - ZC0); // mm per frame
const V1 = 4;
export type E2Cam = {zc: number; H: number; xc: number};
export const e2U = (lf: number) => clamp(lf / (E2_N - 1));
export const e2Cam = (lf: number): E2Cam => {
  const u = e2U(lf);
  const k = (E2_N - 1) / (ZC1 - ZC0);
  return {zc: ZC0 + (ZC1 - ZC0) * herm(u, V0 * k, V1 * k), H: 14 + 20 * (1 - u) ** 2.4, xc: 0.45 * insectXZ(lf)[0]};
};

/** the local frame at which the lip passes over the camera (it is then 60 mm ahead): the air pass ends here */
export const e2LipLf = () => {
  let lf = 0;
  while (lf < E2_N - 1 && DL - e2Cam(lf).zc > 60) lf++;
  return lf;
};

// ---------------------------------------------------------------- the medic: walking in under the lip
const V_MM = 52;
const BETA = (8 * Math.PI) / 180; // a little to the right of straight in
const Z0 = 247, X0 = -24;
const insectXZ = (lf: number): [number, number] => {
  const d = V_MM * (lf / FPS);
  return [X0 + Math.sin(BETA) * d, Z0 + Math.cos(BETA) * d];
};
export const e2Pose = (lf: number): RoachPose => {
  const t = lf / FPS;
  return poseRoach({path: straightPath([0, 0, 0], 0), s: 70 + V_MM * t, t: t + 21.8, ...probe(lf + E2_F0, 1), seed: 5});
};

/** world (x right, y up from the floor, z ahead; mm) to the screen, for the camera */
const pr = (c: E2Cam, x: number, y: number, z: number): Pt => {
  const d = Math.max(1, z - c.zc);
  return [G.x + (F * (x - c.xc)) / d, G.y - (F * (y - c.H)) / d];
};
/** authored px of a card at depth D (as the reference camera sees it: on the floor at the origin) */
const ap = (D: number) => (x: number, y: number): Pt => [G.x + (F * x) / D, G.y - (F * y) / D];
/** a card at depth D, placed for the camera */
const Card: React.FC<{c: E2Cam; D: number; children: React.ReactNode}> = ({c, D, children}) =>
  D - c.zc < 6 ? null : <g transform={cardT(G, D, c.zc, F * c.xc, -F * c.H)}>{children}</g>;
/** ink width in a card at depth D that comes out as w screen px */
const wAt = (c: E2Cam, D: number, w: number) => (w * Math.max(6, D - c.zc)) / D;

const e2View = (lf: number, c: E2Cam, pose: RoachPose): View => {
  const [x, z] = insectXZ(lf);
  const at = pr(c, x, 0, z);
  return viewAt(-90 + 8, 22 - 10 * e2U(lf), F / (z - c.zc), [pose.bodyFrame0.o[0], 0, 0], at[0], at[1]);
};

// ---------------------------------------------------------------- the daylit ruin behind the slab (seen over it)
const DB = 5000;
const Behind: React.FC<{id: string; t: number}> = ({id, t}) => {
  const a = ap(DB);
  const fac: Pt[] = [a(-6000, -200), a(-6000, 14000), a(-1500, 14000), a(-1300, 11000), a(-1600, 8000), a(-900, 5200), a(-1200, 2500), a(-600, -200)];
  return (
    <g>
      <VGrad id={`${id}-sk`} x0={-2000} y0={-2600} x1={3000} y1={1400} stops={[[0, '#BFD6E0'], [0.5, '#F2E6CC'], [1, '#EBD3AA']]} />
      <Glow2 id={`${id}-pl`} cx={a(1600, 3000)[0] + 10 * Math.sin(t)} cy={a(1600, 3000)[1]} rx={700} ry={520} color={RB.dust} a={0.6} />
      <path d={poly(fac)} fill={mix('#A9A29B', '#F2E6CC', 0.5)} />
      {Array.from({length: 5}, (_, r) =>
        Array.from({length: 3}, (_, k) => {
          const x = -5200 + k * 1300, y = 1800 + r * 2500;
          return <path key={`${r}-${k}`} d={poly([a(x, y), a(x + 700, y), a(x + 700, y + 1100), a(x, y + 1100)])} fill={mix('#5B6E78', '#F2E6CC', 0.55)} />;
        }),
      )}
      <path d={poly(jag([a(-3000, -200), a(-2000, 900), a(-600, 1300), a(900, 700), a(2600, 1500), a(5000, 900), a(5000, -200)], 10, 241, 40))} fill={mix('#8A817A', '#F2E6CC', 0.3)} />
    </g>
  );
};

// ---------------------------------------------------------------- deep in: the passage, a shaft of daylight
const DFAR = 1700, DSH = 720;
const Far: React.FC<{id: string}> = ({id}) => {
  const a = ap(DFAR);
  return (
    <g>
      <path d={poly([a(-3000, -60), a(3000, -60), a(3000, 400), a(-3000, 400)])} fill="#1A1513" />
      <Glow2 id={`${id}-fg`} cx={a(60, 30)[0]} cy={a(60, 30)[1]} rx={160} ry={40} color={RB.day} a={0.18} />
      <path d={poly(jag([a(-900, -5), a(-300, 40), a(-120, 25), a(-60, -5)], 4, 251, 20))} fill="#2A2320" />
      <path d={poly(jag([a(240, -5), a(380, 50), a(900, 70), a(1200, -5)], 4, 252, 20))} fill="#2A2320" />
    </g>
  );
};
const ShaftIn: React.FC<{id: string; t: number}> = ({id, t}) => {
  const a = ap(DSH);
  const x = 70, top = hL(x);
  const pts: Pt[] = [a(x - 5, top), a(x + 5, top), a(x + 16, 0), a(x - 14, 0)];
  return (
    <g>
      <Shaft id={`${id}-sh`} pts={pts} from={a(x, top)} to={a(x, 0)} a={0.9} />
      <Glow2 id={`${id}-sp`} cx={a(x, 0)[0]} cy={a(x, 0)[1]} rx={(F * 40) / DSH} ry={(F * 8) / DSH} color={RB.dayHot} a={0.75} />
      <Motes id={`${id}-mo`} t={t} n={10} x0={a(x - 14, 0)[0]} y0={a(x, top)[1]} x1={a(x + 16, 0)[0]} y1={a(x, 0)[1]} r={1.6} seed={256} clip={poly(pts)} a={0.9} />
    </g>
  );
};
/** chunks of rubble lying in the passage (cards standing on the floor) */
const IN_CHUNKS: {x: number; z: number; w: number; h: number; seed: number; tone: string}[] = [
  {x: -230, z: 430, w: 120, h: 34, seed: 261, tone: RB.concDark},
  {x: 210, z: 560, w: 150, h: 24, seed: 262, tone: RB.conc},
  {x: -120, z: 980, w: 160, h: 40, seed: 263, tone: RB.concDark},
  {x: 330, z: 1150, w: 200, h: 20, seed: 264, tone: RB.conc},
];
const InChunk: React.FC<{id: string; ch: (typeof IN_CHUNKS)[number]; lit: number}> = ({id, ch, lit}) => {
  const a = ap(ch.z);
  const pts: Pt[] = jag([a(ch.x - ch.w / 2, -1), a(ch.x - ch.w / 2 + 10, ch.h * 0.8), a(ch.x - 10, ch.h), a(ch.x + ch.w / 2 - 16, ch.h * 0.7), a(ch.x + ch.w / 2, -1)], (F * 3) / ch.z, ch.seed, (F * 20) / ch.z);
  return <Slab id={id} face={pts} tone={ch.tone} w={(F * 1.2) / ch.z} dark={0.72 - 0.2 * lit} specks={6} />;
};

// ---------------------------------------------------------------- the fallen slab at the lip, the propping block
const SlabFront: React.FC<{id: string; w: number}> = ({id, w}) => {
  const a = ap(DL);
  const x0 = -1300, x1 = 590;
  const lower: Pt[] = jag([a(x0, hL(x0)), a(x1, hL(x1))], 10, 211, 50, false);
  const upper: Pt[] = jag([a(x0, hL(x0) + T), a(x1 + 150, hL(x1) + T - 40)], 14, 212, 50, false);
  const face: Pt[] = [...upper, a(x1 + 150, 0), a(x1, 0), ...lower.slice().reverse()];
  const und: Pt[] = [...lower, a(x1, -2), a(x0, -2)].slice(0, 0);
  void und;
  return (
    <g>
      <Slab id={`${id}-sf`} face={face} tone={RB.conc} w={w} dark={0.26} specks={140} topTone={RB.concLit}
        cracks={[[a(-260, 150), a(-200, 200), a(-230, 250)], [a(120, 120), a(170, 170), a(150, 230)], [a(430, 90), a(400, 160)]]}
        rim={upper} />
      {/* the lip's underside edge, a dark band where the face turns under */}
      <path d={line2(lower)} stroke="#231E1B" strokeWidth={f2(w * 2.4)} fill="none" strokeLinecap="round" />
      <Rebar pts={[a(-90, hL(-90) + 2), a(-80, hL(-90) - 14), a(-92, hL(-90) - 24)]} w={w * 1.6} dark={0.4} />
      <Rebar pts={[a(320, hL(320) + 2), a(312, hL(320) - 10), a(326, hL(320) - 18)]} w={w * 1.6} dark={0.4} />
      <Glow2 id={`${id}-sun`} cx={a(-500, T)[0]} cy={a(-500, T)[1]} rx={600} ry={260} color={RB.dayHot} a={0.35} />
    </g>
  );
};
const line2 = (pts: Pt[]) => `M${pts.map((p) => `${f2(p[0])},${f2(p[1])}`).join(' L')}`;
const DBLK = DL - 6;
const Block: React.FC<{id: string; w: number}> = ({id, w}) => {
  const a = ap(DBLK);
  return (
    <Slab id={`${id}-bl`} face={jag([a(-1300, 0), a(-1300, hL(-1300)), a(-240, hL(-240)), a(-215, 0)], 8, 214, 40)} tone={RB.concDark} w={w} dark={0.32} specks={20}
      rim={[a(-240, hL(-240) - 4), a(-215, 2)]} rimColor={mix(RB.day, RB.concLit, 0.4)} />
  );
};

// ---------------------------------------------------------------- the rescuer's glove at the right of the opening
const DG = 165;
const Glove: React.FC<{id: string; w: number}> = ({id, w}) => {
  const a = ap(DG);
  const wr = a(235, 6), tip = a(40, 6);
  const L = Math.hypot(tip[0] - wr[0], tip[1] - wr[1]);
  return (
    <g transform={`translate(${f2(wr[0])} ${f2(wr[1])}) scale(1 0.62) translate(${f2(-wr[0])} ${f2(-wr[1])})`}>
      <GloveArm id={`${id}-ga`} a={{wrist: {x: wr[0], y: wr[1]}, ang: -172, L, ts: 1, pose: {...HAND_RELAXED, spread: 0.3}, fore: 2}} ink={w} shadow={{alpha: 0.3, offset: {x: 0.03 * L, y: 0.1 * L}}} />
    </g>
  );
};

// ---------------------------------------------------------------- overhead: rebar stubs and debris hanging from the underside
const HANG: {x: number; z: number; L: number; seed: number}[] = [
  {x: -150, z: 228, L: 22, seed: 281},
  {x: 120, z: 262, L: 16, seed: 282},
  {x: -60, z: 330, L: 26, seed: 283},
  {x: 190, z: 420, L: 14, seed: 284},
  {x: -230, z: 520, L: 30, seed: 285},
];
const Hang: React.FC<{h: (typeof HANG)[number]; w: number}> = ({h, w}) => {
  const a = ap(h.z);
  const y0 = hL(h.x);
  const k = (rnd(h.seed, 3) - 0.5) * 8;
  void w;
  return (
    <g>
      <Rebar pts={[a(h.x - 6, y0 + 1), a(h.x - 4 + k * 0.2, y0 - h.L * 0.6), a(h.x + k, y0 - h.L), a(h.x + 8 + k, y0 - h.L * 0.7), a(h.x + 10, y0 + 1)]} w={(F * 1.3) / h.z} dark={0.45} />
    </g>
  );
};

/** dust motes in the gap's air (world points, mm): drifting slowly, lit by the daylight near the mouth */
const DUST = Array.from({length: 46}, (_, i) => ({x: -170 + rnd(i, 291) * 340, y: 4 + rnd(i + 1, 291) * 80, z: -60 + rnd(i + 2, 291) * 560, ph: rnd(i + 3, 291) * 6.28}));
const DustIn: React.FC<{c: E2Cam; t: number; light: number}> = ({c, t, light}) => (
  <g>
    {DUST.map((d, i) => {
      const z = d.z, dd = z - c.zc;
      if (dd < 12 || d.y > hL(d.x) - 2) return null;
      const [x, y] = pr(c, d.x + 3 * Math.sin(t * 0.9 + d.ph), d.y + 2 * Math.sin(t * 0.7 + d.ph * 2), z);
      if (x < -20 || x > 1100 || y < -20 || y > 1940) return null;
      const r = Math.min(9, (F * 0.55) / dd);
      const lit = z < DL ? 1 : 0.35 + 0.65 * light * (1 - sr(z, DL, DL + 200));
      return <circle key={i} cx={f2(x)} cy={f2(y)} r={f2(r)} fill={RB.dayHot} opacity={f2(0.5 * lit * Math.min(1, dd / 40))} />;
    })}
  </g>
);

/** cracks and drifts of dust on the floor (world polylines on the floor plane) */
const CRACKS: [number, number][][] = [
  [[-260, -40], [-220, 40], [-240, 110], [-200, 170]],
  [[150, -60], [120, 20], [160, 90], [140, 150], [175, 190]],
  [[-90, 60], [-40, 95], [10, 90], [60, 130]],
  [[330, 10], [290, 80], [300, 160]],
];
const DRIFT = [{x: -140, z: 40, rx: 90, rz: 50}, {x: 190, z: 120, rx: 120, rz: 40}, {x: -10, z: -30, rx: 140, rz: 40}];
const FloorMarks: React.FC<{c: E2Cam}> = ({c}) => (
  <g>
    {DRIFT.map((d, i) => {
      if (d.z - d.rz - c.zc < 14) return null;
      const pts: Pt[] = Array.from({length: 16}, (_, j) => {
        const th = (j / 16) * Math.PI * 2;
        return pr(c, d.x + d.rx * Math.cos(th), 0, d.z + d.rz * Math.sin(th));
      });
      return <path key={`d${i}`} d={poly(pts)} fill="#D2C4AE" opacity={0.35} />;
    })}
    {CRACKS.map((cr, i) => {
      const pts = cr.filter((p) => p[1] - c.zc > 14).map((p) => pr(c, p[0], 0, p[1]));
      if (pts.length < 2) return null;
      const d = Math.max(20, cr[0][1] - c.zc);
      return <path key={`c${i}`} d={line2(pts)} stroke="#6A5F55" strokeWidth={f2(Math.min(4, (F * 0.6) / d))} fill="none" strokeLinecap="round" strokeLinejoin="round" opacity={0.7} />;
    })}
  </g>
);

// ---------------------------------------------------------------- floor grit (projected on the floor plane)
const GRIT = Array.from({length: 240}, (_, i) => ({
  x: -420 + rnd(i, 271) * 840,
  z: -70 + rnd(i + 1, 271) ** 1.6 * 1400,
  r: 1.2 + rnd(i + 2, 271) ** 2 * 6,
  k: 5 + Math.floor(rnd(i + 3, 271) * 3),
  a0: rnd(i + 4, 271) * 6.28,
  tone: i % 4 === 0 ? RB.concLit : i % 3 ? RB.concDark : RB.conc,
}));
const Grit2: React.FC<{c: E2Cam; items: typeof GRIT}> = ({c, items}) => (
  <g>
    {items.map((g, i) => {
      const d = g.z - c.zc;
      if (d < 14) return null;
      const [x, y] = pr(c, g.x, 0, g.z);
      if (x < -60 || x > 1140 || y > 1990) return null;
      const s = F / d;
      const flat = Math.max(0.28, Math.min(0.8, (c.H + 2) / d + 0.22));
      const pts: Pt[] = Array.from({length: g.k}, (_, j) => {
        const th = g.a0 + (j / g.k) * Math.PI * 2;
        const rr = g.r * s * (0.75 + 0.3 * rnd(i * 7 + j, 272));
        return [x + Math.cos(th) * rr, y - g.r * s * 0.4 + Math.sin(th) * rr * flat];
      });
      const inside = sr(g.z, DL - 30, DL + 120);
      const col = mix(litC(g.tone, 0.1), mix(g.tone, RB.deep, 0.75), inside);
      return <path key={i} d={poly(pts)} fill={col} stroke={INK} strokeWidth={f2(Math.min(3.2, Math.max(0.8, s * 0.45)))} strokeLinejoin="round" />;
    })}
  </g>
);

export const E2: React.FC<ShotProps> = ({f, lf}) => {
  const id = idf('e3b', f);
  const t = lf / FPS;
  const c = e2Cam(lf);
  const u = e2U(lf);
  const pose = e2Pose(lf);
  const v = e2View(lf, c, pose);
  const [ix, iz] = insectXZ(lf);
  // the floor: lit in front of the lip, falling into the dark under the slab
  const yLip = pr(c, 0, 0, DL)[1];
  const near: Pt[] = [pr(c, -4000, 0, c.zc + 10), pr(c, 4000, 0, c.zc + 10), pr(c, 4000, 0, DL), pr(c, -4000, 0, DL)];
  const inFloor: Pt[] = [pr(c, -4000, 0, DL), pr(c, 4000, 0, DL), pr(c, 4000, 0, DFAR), pr(c, -4000, 0, DFAR)];
  // the slab's underside: a plane over the passage (its height follows the lip)
  const ceil: Pt[] = [pr(c, -1300, hL(-1300), DL), pr(c, 594, 0, DL), pr(c, 594, 0, DFAR), pr(c, -1300, hL(-1300), DFAR)];
  const yFar = pr(c, 0, 0, DFAR)[1];
  // the light falls off as the lip passes over the camera
  const under = sr(c.zc, 40, ZC1);
  const shade = 0.86 - 0.14 * u; // the insect is already in the slab's shadow
  const grFar = GRIT.filter((g) => g.z >= iz), grNear = GRIT.filter((g) => g.z < iz);
  const chunks = IN_CHUNKS.map((ch, i) => <Card key={i} c={c} D={ch.z}><InChunk id={`${id}-ic${i}`} ch={ch} lit={0} /></Card>);
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920">
      <defs>
        <linearGradient id={`${id}-nf`} x1="0" y1={f2(yLip)} x2="0" y2="1920" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#7A6E62" />
          <stop offset="0.35" stopColor="#A89A88" />
          <stop offset="1" stopColor="#C4B5A0" />
        </linearGradient>
        <linearGradient id={`${id}-if`} x1="0" y1={f2(yFar)} x2="0" y2={f2(yLip)} gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#1C1714" />
          <stop offset="0.6" stopColor="#302822" />
          <stop offset="1" stopColor="#5A4F45" />
        </linearGradient>
        <linearGradient id={`${id}-cl`} x1="0" y1={f2(pr(c, 0, hL(0), DL)[1])} x2="0" y2={f2(pr(c, 0, hL(0), DFAR)[1])} gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#4A403A" />
          <stop offset="0.25" stopColor="#2A231F" />
          <stop offset="1" stopColor="#151110" />
        </linearGradient>
        <filter id={`${id}-sd`} x="-20%" y="-20%" width="140%" height="140%" colorInterpolationFilters="sRGB">
          <feColorMatrix type="matrix" values={`${shade} 0 0 0 0  0 ${shade} 0 0 0  0 0 ${shade * 0.97} 0 0  0 0 0 1 0`} />
        </filter>
      </defs>
      <Card c={c} D={DB}><Behind id={`${id}k`} t={t} /></Card>
      <Card c={c} D={DFAR}><Far id={`${id}r`} /></Card>
      <path d={poly(inFloor)} fill={`url(#${id}-if)`} />
      <path d={poly(ceil)} fill={`url(#${id}-cl)`} />
      {chunks.slice(2).reverse()}
      <Card c={c} D={DSH}><ShaftIn id={`${id}h`} t={t} /></Card>
      {chunks.slice(0, 2).reverse()}
      {HANG.map((h, i) => <Card key={`h${i}`} c={c} D={h.z}><Hang h={h} w={wAt(c, h.z, 4)} /></Card>)}
      <path d={poly(near)} fill={`url(#${id}-nf)`} />
      <Glow2 id={`${id}-pool`} cx={pr(c, 80, 0, DL - 90)[0]} cy={pr(c, 80, 0, DL - 90)[1]} rx={700} ry={160} color={RB.dayHot} a={0.28 * (1 - under)} />
      <FloorMarks c={c} />
      <Grit2 c={c} items={grFar} />
      {/* the dust hanging in the gap, between the camera and the insect and beyond (world points: they stream past) */}
      <DustIn c={c} t={t} light={1 - under} />
      <g filter={`url(#${id}-sd)`}>
        <Roach2D pose={pose} v={v} o={{id: `${id}-r`, gear: <Gear2D id={`${id}-g`} v={v} f={pose.frame} g={{kind: 'injector'}} />}} />
      </g>
      <Grit2 c={c} items={grNear} />
      <Card c={c} D={DBLK}><Block id={`${id}b`} w={wAt(c, DBLK, 5)} /></Card>
      <Card c={c} D={DL}><SlabFront id={`${id}s`} w={wAt(c, DL, 5.5)} /></Card>
      <Card c={c} D={DG}><Glove id={`${id}v`} w={wAt(c, DG, 8)} /></Card>
      <Motes id={`${id}-m`} t={t} n={14} x0={-100} y0={300} x1={1180} y1={1800} r={4} seed={225} a={0.45 * (1 - under)} />
      <Glow2 id={`${id}-rim`} cx={pr(c, ix, 10, iz)[0]} cy={pr(c, ix, 10, iz)[1]} rx={260} ry={130} color={RB.day} a={0.1 * (1 - under)} />
    </svg>
  );
};
void shadeC;
