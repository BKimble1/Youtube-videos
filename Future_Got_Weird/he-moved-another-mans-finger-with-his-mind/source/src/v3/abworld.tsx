// V3 sequences A, B and H: the shared world.
//  - cameras: anchor-preserving keyed camera (a pull-out keeps its subject steady), near-layer parallax
//  - RaoRoom   Rao's lab, front view (room-local 1920 x 1080, crew3 rig): EEG cap -> cable -> computer -> network
//              out through the right wall; the game monitor; his RIGHT hand (profile arm, abhand) flat on the desk,
//              frame-left
//  - StoccoRoom Stocco's lab, front view (the camera is the bare wall he faces; there is no screen on his desk):
//              swim cap, earbuds, round coil over his LEFT motor cortex (frame-right in a front view) on its
//              holder arm, the TMS unit (frame-left), his RIGHT hand (profile arm) on the keyboard, frame-left
//  - Campus    the two labs in two different buildings (CW world units), the network line between them, far/mid
//              parallax layers, and the signal route (cap -> cable -> computer -> network -> TMS -> coil)
// Every value is a pure function of the frame. Ids are prefixed by the caller (`va-` / `vb-`).
import React from 'react';
import {clamp, easeIn, easeInOut, easeOut, fmt, lerp} from '../dc/math';
import {lit, lit as lit_, mix, shade} from '../dc/color';
import {CrewChar, IDLE, Look, Pose} from './crew3';
import {RAO, STOCCO} from '../art/people';
import {GameScreen, GEvent, arcPt, CANNON, evState} from '../art/game';
import {Computer, Desk, FONT_HEAD, INK, K, RoundCoil, Tree} from '../art/kit';
import {SoftArc} from '../art/s6world';
import {FPS} from './core2';
import {FLAT_DESK_Y, H_FLAT, H_HOVER, HPose, HS, h2r, inkFor, KB, KEY, RoomArm, W as HW} from './abhand';

export type CamS = {x: number; y: number; z: number};
/** precise number for transforms (dc fmt rounds to 2 decimals, too coarse for scales under deep zooms) */
export const fx = (n: number) => (Math.abs(n) < 1e-9 ? '0' : n.toFixed(5));
type Ease = (t: number) => number;
export const lin1: Ease = (t) => t;

// ---------------------------------------------------------------- cameras
/** zoom-pan interpolation: zoom is exponential and the centre follows the visible window, so a subject that is in
 *  view at both ends stays steady (a pull-out does not swing its subject across the frame) */
export const camLerp = (a: CamS, b: CamS, k: number): CamS => {
  if (Math.abs(a.z - b.z) < 1e-6) return {x: lerp(a.x, b.x, k), y: lerp(a.y, b.y, k), z: a.z};
  const z = a.z * Math.pow(b.z / a.z, k);
  const w = (1 / a.z - 1 / z) / (1 / a.z - 1 / b.z);
  return {x: lerp(a.x, b.x, w), y: lerp(a.y, b.y, w), z};
};
/** keyed camera [t, cam, ease-of-the-segment-ending-here] */
export const camPath = (t: number, ks: [number, CamS, Ease?][]): CamS => {
  if (t <= ks[0][0]) return ks[0][1];
  for (let i = 0; i < ks.length - 1; i++) {
    const [ta, a] = ks[i];
    const [tb, b, e] = ks[i + 1];
    if (t <= tb) return camLerp(a, b, (e ?? easeInOut)(clamp((t - ta) / (tb - ta || 1e-6))));
  }
  return ks[ks.length - 1][1];
};
export const camT = (c: CamS) => `translate(960 540) scale(${fx(c.z)}) translate(${fx(-c.x)} ${fx(-c.y)})`;
export const toScr = (c: CamS, p: {x: number; y: number}) => ({x: 960 + (p.x - c.x) * c.z, y: 540 + (p.y - c.y) * c.z});
/** camera that shows world point p at screen point s with zoom z */
export const camAt = (p: {x: number; y: number}, s: {x: number; y: number}, z: number): CamS => ({x: p.x - (s.x - 960) / z, y: p.y - (s.y - 540) / z, z});
export const World: React.FC<{cam: CamS; children: React.ReactNode}> = ({cam, children}) => <g transform={camT(cam)}>{children}</g>;

/** a parallax layer authored in screen coordinates as seen from camera `ref`; d < 1 far, d > 1 near */
export const Par: React.FC<{cam: CamS; ref0: CamS; d: number; children: React.ReactNode; opacity?: number}> = ({cam, ref0, d, children, opacity}) => {
  const z = ref0.z * Math.pow(cam.z / ref0.z, d);
  const cx = ref0.x + (cam.x - ref0.x) * d;
  const cy = ref0.y + (cam.y - ref0.y) * d;
  return (
    <g opacity={opacity} transform={`translate(960 540) scale(${fx(z)}) translate(${fx(-cx)} ${fx(-cy)}) translate(${fx(ref0.x)} ${fx(ref0.y)}) scale(${fx(1 / ref0.z)}) translate(-960 -540)`}>
      {children}
    </g>
  );
};
/** a near foreground layer for lateral / vertical tracks: authored in screen coordinates at camera `ref`, it slides
 *  k times as fast as the focus plane (k > 1) */
export const Near: React.FC<{cam: CamS; ref0: CamS; k: number; children: React.ReactNode; opacity?: number}> = ({cam, ref0, k, children, opacity}) => (
  <g opacity={opacity} transform={`translate(${fmt(-(cam.x - ref0.x) * k * cam.z)} ${fmt(-(cam.y - ref0.y) * k * cam.z)})`}>{children}</g>
);

// ---------------------------------------------------------------- geometry helpers
type V = {x: number; y: number};
export const cub = (p: V[], u: number): V => {
  const a = (1 - u) ** 3, b = 3 * u * (1 - u) ** 2, c = 3 * u * u * (1 - u), d = u ** 3;
  return {x: a * p[0].x + b * p[1].x + c * p[2].x + d * p[3].x, y: a * p[0].y + b * p[1].y + c * p[2].y + d * p[3].y};
};
const cubD = (p: V[]) => `M${fmt(p[0].x)},${fmt(p[0].y)} C${fmt(p[1].x)},${fmt(p[1].y)} ${fmt(p[2].x)},${fmt(p[2].y)} ${fmt(p[3].x)},${fmt(p[3].y)}`;
export type Poly = {pts: V[]; L: number[]};
export const polyOf = (pts: V[]): Poly => {
  const L = [0];
  for (let i = 1; i < pts.length; i++) L.push(L[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y));
  return {pts, L};
};
/** sample a cubic into points */
export const cubPts = (p: V[], n = 16) => Array.from({length: n + 1}, (_, i) => cub(p, i / n));
/** point at arc length fraction k */
export const polyAt = (P: Poly, k: number): V => {
  const tot = P.L[P.L.length - 1];
  const s = clamp(k) * tot;
  for (let i = 1; i < P.pts.length; i++) {
    if (P.L[i] >= s) {
      const u = (s - P.L[i - 1]) / (P.L[i] - P.L[i - 1] || 1);
      return {x: lerp(P.pts[i - 1].x, P.pts[i].x, u), y: lerp(P.pts[i - 1].y, P.pts[i].y, u)};
    }
  }
  return P.pts[P.pts.length - 1];
};
/** sub-path between arc fractions a..b */
export const polySub = (P: Poly, a: number, b: number) => {
  const tot = P.L[P.L.length - 1];
  const sa = clamp(a) * tot, sb = clamp(b) * tot;
  const out: V[] = [polyAt(P, a)];
  for (let i = 1; i < P.pts.length - 1; i++) if (P.L[i] > sa && P.L[i] < sb) out.push(P.pts[i]);
  out.push(polyAt(P, b));
  return `M${out.map((q) => `${fmt(q.x)},${fmt(q.y)}`).join(' L')}`;
};

/** a travelling signal: a short glowing trail ending at the head (k = arc fraction of the head) */
export const Pulse: React.FC<{P: Poly; k: number; len?: number; w: number; color: string; op?: number}> = ({P, k, len = 0.06, w, color, op = 1}) => {
  if (op <= 0.001 || k <= 0) return null;
  const h = polyAt(P, k);
  const d = polySub(P, Math.max(0, k - len), Math.min(1, k));
  return (
    <g opacity={op} fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} stroke={color} strokeWidth={w * 3} opacity={0.28} />
      <path d={d} stroke={color} strokeWidth={w} />
      {k < 1 && (
        <g>
          <circle cx={fmt(h.x)} cy={fmt(h.y)} r={fmt(w * 2.2)} fill={color} opacity={0.35} />
          <circle cx={fmt(h.x)} cy={fmt(h.y)} r={fmt(w * 1.05)} fill={color} stroke={INK} strokeWidth={fmt(w * 0.28)} />
        </g>
      )}
    </g>
  );
};

// ---------------------------------------------------------------- the monitor (kit Monitor with fadeable glare and screen edge)
export const MonitorV2: React.FC<{id: string; x: number; y: number; s?: number; children?: React.ReactNode; glare?: number; edge?: number; on?: number}> = ({id, x, y, s = 1, children, glare = 1, edge = 1, on = 1}) => (
  <g transform={`translate(${fx(x)} ${fx(y)}) scale(${fx(s)})`}>
    <path d="M-90,0 L90,0 L70,-18 L-70,-18 Z" fill={K.metalDeep} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
    <rect x={-22} y={-90} width={44} height={74} fill={K.metal} stroke={INK} strokeWidth={5} />
    <rect x={-350} y={-540} width={700} height={460} rx={22} fill="#2A3B47" stroke={INK} strokeWidth={6} />
    <rect x={-340} y={-530} width={680} height={440} rx={14} fill="#33495A" />
    <defs>
      <clipPath id={`${id}-clip`}>
        <rect x={-320} y={-510} width={640} height={400} rx={6} />
      </clipPath>
    </defs>
    <rect x={-320} y={-510} width={640} height={400} rx={6} fill={K.screenDark} />
    <g clipPath={`url(#${id}-clip)`} opacity={on}>
      <g transform="translate(-320 -510)">{children}</g>
    </g>
    {edge > 0.001 && <rect x={-320} y={-510} width={640} height={400} rx={6} fill="none" stroke={INK} strokeWidth={4} opacity={edge} />}
    {glare > 0.001 && <path d="M-300,-500 L-120,-500 L-260,-330 L-300,-330 Z" fill="#FFFFFF" opacity={0.06 * glare} />}
  </g>
);
/** game (u, v) -> monitor parent coordinates */
export const monPt = (m: {x: number; y: number; s: number}, u: number, v: number): V => ({x: m.x + (u - 320) * m.s, y: m.y + (v - 510) * m.s});
/** a game camera {x, y, z} (game px) expressed in the monitor's parent space */
export const gameCamIn = (m: {x: number; y: number; s: number}, g: CamS): CamS => {
  const c = monPt(m, g.x, g.y);
  return {x: c.x, y: c.y, z: g.z / m.s};
};
/** keep a game camera inside the 640 x 400 screen (no bezel in frame) */
export const clampG = (g: CamS): CamS => {
  const hx = 960 / g.z, hy = 540 / g.z;
  return {x: hx >= 320 ? 320 : clamp(g.x, hx, 640 - hx), y: hy >= 200 ? 200 : clamp(g.y, hy, 400 - hy), z: g.z};
};
/** the camera on a monitor that reproduces GAME_FULL exactly */
export const fullGameCam = (m: {x: number; y: number; s: number}): CamS => ({x: m.x, y: m.y - 310 * m.s, z: 3 / m.s});
/** the in-game shot position for an event at game time g (matches art/game.tsx) */
export const shotPos = (e: GEvent, g: number) => {
  const s = evState(e, g);
  const hp = arcPt(s.uHit);
  const want = Math.atan2(hp.y - CANNON.y, hp.x - CANNON.x);
  const sk = clamp((g - (e.fire ?? 0)) / 0.32);
  const m0 = {x: CANNON.x + Math.cos(want) * 50, y: CANNON.y + Math.sin(want) * 50};
  return {p: {x: m0.x + (hp.x - CANNON.x) * sk, y: m0.y + (hp.y - CANNON.y) * sk}, muzzle: {x: CANNON.x + Math.cos(want) * 58, y: CANNON.y + Math.sin(want) * 58}, hit: hp, ang: (want * 180) / Math.PI};
};
// ---------------------------------------------------------------- the cast rig, placed in a room
export const CS = 1.5;
export const GR = 1050;
const HY = -372, HR = 58;
const driftF = (g: number, seed = 0, period = 120) => 0.65 * Math.sin((g / period + seed * 0.37) * Math.PI * 2) + 0.35 * Math.sin((g / (period * 0.61) + seed * 0.91) * Math.PI * 2);
/** the room position of a crew character's shoulder (side -1 = rig L = frame-left), replicating the rig's own
 *  idle lean/bob so an arm drawn outside the rig stays attached */
export const shoulderAt = (cx: number, pose: Pose, frame: number, seed: number, life: number, side: -1 | 1 = -1): V => {
  const lean = pose.lean + driftF(frame, seed + 7, 210) * 0.7 * life;
  const bob = (pose.bob ?? 0) + driftF(frame, seed + 3, 96) * 1.4 * life;
  const lx = 66 * side, ly = -292;
  const a = (lean * Math.PI) / 180;
  const rx = lx * Math.cos(a) - (ly + 150) * Math.sin(a);
  const ry = lx * Math.sin(a) + (ly + 150) * Math.cos(a) - 150;
  return {x: cx + rx * CS, y: GR + (ry + bob) * CS};
};
/** head centre (room) of a crew character, for framing */
export const headAt = (cx: number) => ({x: cx, y: GR + HY * CS});

// ---------------------------------------------------------------- Rao's lab (front view)
export const RAO_X = 640;
export const RAO_HEAD = headAt(RAO_X);
export const RAO_DESK = 750;
/** his RIGHT hand (frame-left in a front view): the wrist pivot of the profile arm, flat on the desk */
export const RAO_P: V = {x: 425, y: RAO_DESK - (FLAT_DESK_Y - HW.y) * HS};
/** game monitor (room-local; MonitorV2 coordinates) */
export const RMON = {x: 1075, y: RAO_DESK, s: 0.56};
const COMP = {x: 818, y: RAO_DESK, s: 0.5};
/** EEG cable: from the end of the cap's own lead (on his left shoulder, frame-right) down to the computer */
const capLead = {x: RAO_X + (HR + 26) * CS, y: GR + (HY + 120) * CS};
export const RAO_CABLE: V[] = [capLead, {x: 760, y: 744}, {x: 770, y: 748}, {x: 790, y: 704}];
const RAO_MONCABLE: V[] = [{x: 850, y: 704}, {x: 900, y: 742}, {x: 980, y: 744}, {x: 1060, y: 744}];
/** network: computer -> along the back of the desk -> out through the right wall (toward Stocco's building) */
export const RAO_NET: V[] = [{x: 850, y: 735}, {x: 900, y: 744}, {x: 1300, y: 744}, {x: 1920, y: 744}];
const hs = (x: number, y: number): V => ({x: RAO_X + x * CS, y: GR + y * CS});
/** the route inside Rao's lab: cap crown -> cap lead -> cable -> computer -> network exit (room-local) */
export const RAO_ROUTE = (() => {
  const a: V[] = [
    hs(0, HY - HR - 6), hs(30, HY - HR + 4), hs(HR - 2, HY - 6),
    ...cubPts([hs(HR - 2, HY - 6), hs(HR + 30, HY + 30), hs(HR + 30, HY + 70), hs(HR + 26, HY + 120)], 8).slice(1),
    ...cubPts(RAO_CABLE, 16).slice(1),
    {x: COMP.x, y: COMP.y - 60},
  ];
  const b: V[] = [...cubPts(RAO_NET, 18)];
  const P = polyOf([...a, ...b]);
  const tot = P.L[P.L.length - 1];
  const kComp = P.L[a.length - 1] / tot;
  return {P, kComp, box0: P.L[a.length - 2] / tot, box1: P.L[a.length] / tot};
})();
const ELEC: [number, number][] = [[-40, -12], [-20, -34], [0, -40], [20, -34], [40, -12], [-30, 4], [0, -16], [30, 4], [-50, 6], [50, 6]];
/** EEG cap with electrodes that light teal in a travelling wave (lit 0..1) */
export const CapV3: React.FC<{lit: number; t: number}> = ({lit: lk, t}) => (
  <g>
    {lk > 0.01 && <ellipse cx={0} cy={HY - HR + 6} rx={HR + 26} ry={HR * 0.85} fill={K.teal} opacity={0.2 * lk} />}
    <path d={`M ${-HR - 4} ${HY + 4} Q ${-HR - 6} ${HY - HR - 22} 0 ${HY - HR - 20} Q ${HR + 6} ${HY - HR - 22} ${HR + 4} ${HY + 4} Q ${HR * 0.5} ${HY - 18} 0 ${HY - 20} Q ${-HR * 0.5} ${HY - 18} ${-HR - 4} ${HY + 4} Z`} fill="#3B4A57" stroke={INK} strokeWidth={4} strokeLinejoin="round" />
    {ELEC.map(([x, y], i) => {
      const w = lk * (0.55 + 0.45 * Math.sin(t * 11 - x * 0.09 + y * 0.05));
      return (
        <g key={i}>
          {w > 0.05 && <circle cx={x} cy={HY - HR + 22 + y} r={11} fill={K.teal} opacity={0.4 * w} />}
          <circle cx={x} cy={HY - HR + 22 + y} r={6.5} fill={mix('#D9DEE2', '#7FE3DA', w)} stroke={INK} strokeWidth={2.5} />
        </g>
      );
    })}
    <path d={`M ${HR - 2} ${HY - 6} Q ${HR + 30} ${HY + 30} ${HR + 26} ${HY + 120}`} fill="none" stroke={INK} strokeWidth={7} strokeLinecap="round" />
    <path d={`M ${HR - 2} ${HY - 6} Q ${HR + 30} ${HY + 30} ${HR + 26} ${HY + 120}`} fill="none" stroke="#3B4A57" strokeWidth={3.5} strokeLinecap="round" />
  </g>
);
/** the game reflected small in Rao's glasses (head space) */
const Lenses: React.FC<{id: string; k: number; content: React.ReactNode}> = ({id, k, content}) => {
  if (k <= 0.01) return null;
  const ey = HY - 6;
  return (
    <g opacity={k}>
      {[-37, 7].map((x, i) => (
        <g key={i}>
          <defs>
            <clipPath id={`${id}-ln${i}`}>
              <rect x={x + 2} y={ey - 13} width={26} height={22} rx={6} />
            </clipPath>
          </defs>
          <g clipPath={`url(#${id}-ln${i})`}>
            <g transform={`translate(${x + 2} ${ey - 13}) scale(${26 / 640} ${22 / 400})`} opacity={0.75}>{content}</g>
            <path d={`M${x + 4},${ey - 4} L${x + 14},${ey - 13} L${x + 20},${ey - 13} L${x + 8},${ey + 1} Z`} fill="#FFFFFF" opacity={0.45} />
          </g>
        </g>
      ))}
    </g>
  );
};

/** a lit wire (the connection, drawn along the real cables) and a travelling pulse on a room route */
export const RouteGlow: React.FC<{P: Poly; lit?: number; k?: number; kSplit?: number; w?: number; len?: number; r0?: number; r1?: number}> = ({P, lit = 0, k = -1, kSplit = 0, w = 7, len = 0.08, r0 = 0, r1 = 1}) => {
  const col = (a: number) => (a < kSplit ? K.teal : K.saffron);
  const seg = (a: number, b: number) => (Math.max(a, r0) < Math.min(b, r1) ? polySub(P, Math.max(a, r0), Math.min(b, r1)) : null);
  const tA = seg(0, kSplit), sA = seg(kSplit, 1);
  // the pulse, restricted to [r0, r1]
  const pk0 = Math.max(r0, k - len), pk1 = Math.min(r1, k);
  const ph = k >= r0 && k <= r1 ? polyAt(P, k) : null;
  const pc = col(Math.min(k, 1));
  return (
    <g>
      {lit > 0.01 && (
        <g fill="none" strokeLinecap="round" strokeLinejoin="round" opacity={lit}>
          {tA && <path d={tA} stroke={K.teal} strokeWidth={w * 2.6} opacity={0.35} />}
          {tA && <path d={tA} stroke="#7FE3DA" strokeWidth={w * 0.9} />}
          {sA && <path d={sA} stroke={K.saffron} strokeWidth={w * 2.6} opacity={0.35} />}
          {sA && <path d={sA} stroke={K.saffron} strokeWidth={w * 0.9} />}
        </g>
      )}
      {k > 0 && pk1 > pk0 && (
        <g fill="none" strokeLinecap="round" strokeLinejoin="round">
          <path d={polySub(P, pk0, pk1)} stroke={pc} strokeWidth={w * 3} opacity={0.28} />
          <path d={polySub(P, pk0, pk1)} stroke={pc} strokeWidth={w} />
          {ph && k < 1 && <circle cx={fmt(ph.x)} cy={fmt(ph.y)} r={fmt(w * 2.2)} fill={pc} opacity={0.35} />}
          {ph && k < 1 && <circle cx={fmt(ph.x)} cy={fmt(ph.y)} r={fmt(w * 1.05)} fill={pc} stroke={INK} strokeWidth={fmt(w * 0.28)} />}
        </g>
      )}
    </g>
  );
};

export type RaoOpts = {
  id: string;
  f: number;
  /** the game screen content (640 x 400 local) */
  screen: React.ReactNode;
  capLit?: number;
  compBlink?: number;
  compColor?: string;
  face?: Partial<Pose>;
  lens?: number;
  lensContent?: React.ReactNode;
  glare?: number;
  edge?: number;
  /** the monitor present 0..1 (it is carried in and out in A's split and B's desk gag) */
  mon?: number;
  /** the route: lit wire 0..1, pulse head 0..1 (< 0 off) */
  lit?: number;
  sig?: number;
  /** his right hand (profile) pose and an optional lift of the whole forearm (hand units) */
  hand?: HPose;
  armLift?: number;
  /** room zoom of the camera that shows this room (for the hand's contour width) */
  zr?: number;
  life?: number;
};
export const RaoRoom: React.FC<RaoOpts> = ({id, f, screen, capLit = 0, compBlink = 0, compColor = K.teal, face = {}, lens = 0, lensContent, glare = 1, edge = 1, mon = 1, lit = 0, sig = -1, hand = H_FLAT, armLift = 0, zr = 1, life = 0.5}) => {
  const t = f / FPS;
  const pose: Pose = {...IDLE, armL: {a: 20, b: 20}, armR: {a: 6, b: 6}, handR: {curl: 0.4, spread: 0.2}, lookX: 0.85, lookY: 0.1, mouth: 'smile', ...face};
  const gear = (
    <g>
      <Lenses id={`${id}-l`} k={lens} content={lensContent ?? screen} />
      <CapV3 lit={capLit} t={t} />
    </g>
  );
  const sh = shoulderAt(RAO_X, pose, f, 3, life);
  const common = {look: RAO as Look, pose, frame: f, seed: 3, x: RAO_X, y: GR, scale: CS, flip: false, life, headGear: gear, id: `${id}-c`, shadow: false};
  return (
    <g>
      <defs>
        <linearGradient id={`${id}-wl`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={lit_(K.raoWall, 0.25)} />
          <stop offset="1" stopColor={K.raoWall} />
        </linearGradient>
      </defs>
      <rect x={-600} y={-600} width={3120} height={2400} fill={`url(#${id}-wl)`} />
      <rect x={-600} y={RAO_DESK - 220} width={3120} height={30} fill={K.raoWallDeep} />
      {/* pinboard + a framed plot: Rao's room */}
      <rect x={110} y={150} width={250} height={180} rx={8} fill="#E9D8B8" stroke={INK} strokeWidth={6} />
      <rect x={142} y={176} width={78} height={60} fill="#FFFFFF" stroke={INK} strokeWidth={4} transform="rotate(-4 181 206)" />
      <rect x={242} y={186} width={84} height={98} fill={K.blueLight} stroke={INK} strokeWidth={4} transform="rotate(5 284 235)" />
      <circle cx={182} cy={178} r={7} fill={K.coral} stroke={INK} strokeWidth={3} />
      <rect x={940} y={170} width={190} height={140} rx={6} fill="#FFFFFF" stroke={INK} strokeWidth={6} />
      <path d="M964,280 L1004,244 L1036,264 L1096,198" fill="none" stroke={K.blue} strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" />
      <rect x={1380} y={250} width={300} height={22} rx={6} fill={K.deskDeep} stroke={INK} strokeWidth={5} />
      {[0, 1, 2, 3, 4].map((i) => <rect key={i} x={1400 + i * 38} y={160 + (i % 2) * 14} width={30} height={90 - (i % 2) * 14} rx={4} fill={[K.coral, K.blue, K.saffron, K.teal, K.blueLight][i]} stroke={INK} strokeWidth={4} />)}
      {/* chair back */}
      <rect x={RAO_X - 150} y={GR - 520} width={300} height={360} rx={44} fill="#4A5866" stroke={INK} strokeWidth={6} />
      <rect x={RAO_X - 118} y={GR - 496} width={236} height={40} rx={18} fill={lit_('#4A5866', 0.18)} opacity={0.6} />
      <CrewChar {...common} front="L" pass="body" />
      <Desk id={`${id}-desk`} x0={-200} x1={2200} y={RAO_DESK} d={110} h={420} />
      {/* network cable along the back of the desk and out through the right wall (toward Stocco's building) */}
      <g fill="none" strokeLinecap="round">
        <path d={cubD(RAO_NET)} stroke={INK} strokeWidth={13} />
        <path d={cubD(RAO_NET)} stroke="#5D6B76" strokeWidth={7} />
      </g>
      <RouteGlow P={RAO_ROUTE.P} lit={lit} k={sig} kSplit={RAO_ROUTE.kComp} w={8} len={0.07} r0={RAO_ROUTE.box1} />
      <Computer x={COMP.x} y={COMP.y} s={COMP.s} blink={compBlink} color={compColor} />
      {mon > 0.001 && (
        <g opacity={clamp(mon * 3)}>
          <g fill="none" strokeLinecap="round">
            <path d={cubD(RAO_MONCABLE)} stroke={INK} strokeWidth={12} />
            <path d={cubD(RAO_MONCABLE)} stroke="#3B4A57" strokeWidth={6} />
          </g>
          <MonitorV2 id={`${id}-mon`} x={RMON.x} y={RMON.y} s={RMON.s} glare={glare} edge={edge}>
            {screen}
          </MonitorV2>
        </g>
      )}
      {/* the EEG cable from the cap lead down to the computer */}
      <g fill="none" strokeLinecap="round">
        <path d={cubD(RAO_CABLE)} stroke={INK} strokeWidth={13} />
        <path d={cubD(RAO_CABLE)} stroke="#3B4A57" strokeWidth={7} />
      </g>
      <RouteGlow P={RAO_ROUTE.P} lit={lit} k={sig} kSplit={RAO_ROUTE.kComp} w={8} len={0.07} r1={RAO_ROUTE.box0} />
      {/* his right arm and hand (profile), flat on the desk */}
      <RoomArm id={`${id}-arm`} P={RAO_P} shoulderRoom={sh} pose={hand} skin={K.raoSkin} sleeve={K.raoSleeve} inkW={inkFor(zr)} keyboard={false} surfaceY={FLAT_DESK_Y} armLift={armLift} />
    </g>
  );
};

// ---------------------------------------------------------------- Stocco's lab (front view; the camera is the bare wall he faces)
export const STO_X = 1060;
export const STO_HEAD = headAt(STO_X);
export const STO_DESK = 770;
/** his RIGHT hand on the keyboard: the wrist pivot (room) */
export const STO_P: V = {x: 770, y: STO_DESK - (KB.base - HW.y) * HS};
/** the space bar centre and the fingertip at hover (room), for framing */
export const STO_KEY = h2r(STO_P, {x: KEY.x, y: KEY.y - KEY.depth / 2});
const TMS = {x: 320, y: 440, w: 170, h: 196};
/** the coil over his LEFT motor cortex: frame-right on the top of the head in this front view */
export const SCOIL = {x: STO_X + 44 * CS, y: GR - 426 * CS, s: 0.3 * CS, ang: 40};
const S_HANDLE = {x: SCOIL.x - Math.cos((SCOIL.ang * Math.PI) / 180) * 250 * SCOIL.s, y: SCOIL.y - Math.sin((SCOIL.ang * Math.PI) / 180) * 250 * SCOIL.s};
const TMS_CABLE: V[] = [{x: TMS.x + 120, y: TMS.y + 4}, {x: 470, y: 110}, {x: 820, y: 70}, {x: S_HANDLE.x - 10, y: S_HANDLE.y - 4}];
/** network: in through the left wall (toward Rao's building) -> the TMS unit */
const STO_NET: V[] = [{x: 0, y: 600}, {x: 120, y: 600}, {x: 240, y: 560}, {x: TMS.x, y: 560}];
/** the route in Stocco's lab: wall -> TMS -> coil cable -> coil (room-local) */
export const STO_ROUTE = polyOf([...cubPts(STO_NET, 8), {x: TMS.x + 60, y: 540}, {x: TMS.x + 120, y: TMS.y + 40}, ...cubPts(TMS_CABLE, 20), {x: SCOIL.x, y: SCOIL.y}]);
/** route fractions: the pulse enters the TMS box, and leaves it on the coil cable */
export const STO_K = (() => {
  const n = cubPts(STO_NET, 8).length;
  const tot = STO_ROUTE.L[STO_ROUTE.L.length - 1];
  return {box0: STO_ROUTE.L[n - 1] / tot, box1: STO_ROUTE.L[n + 1] / tot};
})();
/** the stimulation pathway (metaphor): coil -> left motor cortex -> down, crossing at the neck -> right shoulder */
export const stimPath = (sh: V): Poly => polyOf([{x: SCOIL.x + 4, y: SCOIL.y + 14}, {x: STO_X + 96, y: STO_HEAD.y - 6}, {x: STO_X + 92, y: STO_HEAD.y + 40}, {x: STO_X + 62, y: STO_HEAD.y + 104}, {x: STO_X + 10, y: STO_HEAD.y + 118}, {x: sh.x + 50, y: sh.y - 4}, sh]);

/** swim cap marking the coil site on his LEFT hemisphere (frame-right in a front view) */
const SwimCapV3: React.FC = () => (
  <g>
    <path d={`M ${-HR - 3} ${HY + 2} Q ${-HR - 5} ${HY - HR - 18} 0 ${HY - HR - 16} Q ${HR + 5} ${HY - HR - 18} ${HR + 3} ${HY + 2} Q ${HR * 0.5} ${HY - 22} 0 ${HY - 24} Q ${-HR * 0.5} ${HY - 22} ${-HR - 3} ${HY + 2} Z`} fill={K.swimCap} stroke={INK} strokeWidth={4} strokeLinejoin="round" />
    <path d={`M ${-HR * 0.7} ${HY - HR + 4} Q ${-HR * 0.3} ${HY - HR - 12} ${HR * 0.1} ${HY - HR - 10}`} fill="none" stroke="#FFFFFF" strokeWidth={4} opacity={0.3} strokeLinecap="round" />
  </g>
);
const EarbudsV3: React.FC<{glow?: number}> = ({glow = 0}) => (
  <g>
    {[-1, 1].map((s) => (
      <g key={s}>
        {glow > 0.01 && <circle cx={s * (HR + 4)} cy={HY + 8} r={20} fill={K.saffron} opacity={0.45 * glow} />}
        <circle cx={s * (HR + 4)} cy={HY + 8} r={10} fill="#F4F6F8" stroke={INK} strokeWidth={3.5} />
        <path d={`M${s * (HR + 4)},${HY + 17} q${s * 2},16 ${s * -4},30`} fill="none" stroke="#F4F6F8" strokeWidth={4} strokeLinecap="round" />
      </g>
    ))}
  </g>
);

export type StoOpts = {
  id: string;
  f: number;
  face?: Partial<Pose>;
  /** the coil's pulse (click) 0..1 and the TMS display */
  coilPulse?: number;
  tmsLit?: number;
  /** route: lit wire, pulse head (wall -> coil); stimulation path head (coil -> shoulder) */
  lit?: number;
  sig?: number;
  stim?: number;
  /** the hand */
  hand?: HPose;
  press?: number;
  keyGlow?: number;
  drive?: number;
  /** keyboard present 0..1 (carried in and out) */
  kb?: number;
  earGlow?: number;
  zr?: number;
  life?: number;
  /** H: the coil slides from the motor site to the back of the head (0..1) */
  coilBack?: number;
  armLift?: number;
  /** the stimulation path and the arm lit as a whole (frame 0's complete circuit) */
  stimLit?: number;
  /** H: the room forms around the carried bar: wall and desk tinted toward the paper 0..1, keyboard build 0..1,
   *  the hand entering (room-unit offset of the arm) */
  paper?: number;
  kbRise?: number;
  handOffset?: V;
  /** the phosphene (a soft flash in his vision) 0..1 */
  flash?: number;
};
export const StoccoRoom: React.FC<StoOpts> = ({id, f, face = {}, coilPulse = 0, tmsLit = 0, lit = 0, sig = -1, stim = -1, hand = H_HOVER, press = 0, keyGlow = 0, drive = -1, kb = 1, earGlow = 0, zr = 1, life = 0.35, coilBack = 0, armLift = 0, stimLit = 0, paper = 0, kbRise = 1, handOffset, flash = 0}) => {
  const pose: Pose = {...IDLE, armL: {a: 20, b: 20}, armR: {a: 6, b: 8}, handR: {curl: 0.4, spread: 0.2}, lookX: 0.05, lookY: 0.18, mouth: 'flat', brows: 0, ...face};
  const sh = shoulderAt(STO_X, pose, f, 5, life);
  const common = {look: STOCCO as Look, pose, frame: f, seed: 5, x: STO_X, y: GR, scale: CS, flip: false, life, id: `${id}-c`, shadow: false};
  // the coil: on the motor site, or slid round to the back of the head (H)
  const cb = easeInOut(clamp(coilBack));
  const coil = {x: lerp(SCOIL.x, STO_X + 96, cb), y: lerp(SCOIL.y, STO_HEAD.y + 30, cb), ang: lerp(SCOIL.ang, 90, cb)};
  const handleEnd = {x: coil.x - Math.cos((coil.ang * Math.PI) / 180) * 250 * SCOIL.s, y: coil.y - Math.sin((coil.ang * Math.PI) / 180) * 250 * SCOIL.s};
  const coilCable: V[] = [{x: TMS.x + 120, y: TMS.y + 4}, {x: 470, y: 110}, {x: lerp(820, 900, cb), y: lerp(70, 120, cb)}, {x: handleEnd.x - 10, y: handleEnd.y - 4}];
  const holder = `M${TMS.x + TMS.w - 24},${TMS.y + 10} L${lerp(640, 700, cb)},${lerp(170, 190, cb)} L${fmt(handleEnd.x + 4)},${fmt(handleEnd.y + 2)}`;
  const coilEl = <g transform={`translate(${fmt(coil.x)} ${fmt(coil.y)}) scale(-1 1)`}><RoundCoil x={0} y={0} s={SCOIL.s} ang={-coil.ang} pulse={0} /></g>;
  const sp = sig >= 0 ? sig : -1;
  return (
    <g>
      <defs>
        <linearGradient id={`${id}-wall`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={mix(lit_(K.stoccoWall, 0.22), K.paper, paper)} />
          <stop offset="1" stopColor={mix(K.stoccoWall, K.paper, paper)} />
        </linearGradient>
      </defs>
      <rect x={-600} y={-600} width={3120} height={2400} fill={`url(#${id}-wall)`} />
      <rect x={-600} y={STO_DESK - 200} width={3120} height={26} fill={K.stoccoWallDeep} />
      {/* a light switch and a calendar: his room */}
      <rect x={1640} y={300} width={170} height={210} rx={6} fill="#FFFFFF" stroke={INK} strokeWidth={6} />
      <rect x={1640} y={300} width={170} height={50} fill={K.coral} stroke={INK} strokeWidth={6} />
      {[0, 1, 2, 3].map((r) => [0, 1, 2, 3].map((c) => <rect key={`${r}${c}`} x={1660 + c * 36} y={368 + r * 32} width={24} height={20} rx={3} fill={K.paper} />))}
      <rect x={1500} y={430} width={44} height={60} rx={6} fill="#FBF3E4" stroke={INK} strokeWidth={4} />
      {/* network cable in through the left wall -> the TMS unit (on its cart, behind the desk) */}
      <g fill="none" strokeLinecap="round">
        <path d={cubD(STO_NET)} stroke={INK} strokeWidth={13} />
        <path d={cubD(STO_NET)} stroke="#5D6B76" strokeWidth={7} />
      </g>
      <RouteGlow P={STO_ROUTE} lit={lit} k={sp} w={8} len={0.06} r1={STO_K.box0} />
      <g>
        <rect x={TMS.x + TMS.w / 2 - 12} y={TMS.y + TMS.h - 4} width={24} height={STO_DESK - TMS.y - TMS.h + 10} fill="#7E8B96" stroke={INK} strokeWidth={4} />
        <rect x={TMS.x} y={TMS.y} width={TMS.w} height={TMS.h} rx={16} fill="#D9DEE2" stroke={INK} strokeWidth={6} />
        <rect x={TMS.x + 24} y={TMS.y + 30} width={TMS.w - 48} height={68} rx={8} fill={K.screenDark} stroke={INK} strokeWidth={4} />
        {tmsLit > 0.01 && <text x={TMS.x + TMS.w / 2} y={TMS.y + 78} textAnchor="middle" fontFamily={FONT_HEAD} fontWeight={700} fontSize={36} fill={K.saffron} opacity={tmsLit}>FIRE</text>}
        {[0, 1, 2].map((i) => <rect key={i} x={TMS.x + 28 + i * 50} y={TMS.y + 126} width={38} height={14} rx={6} fill="#B5BEC6" />)}
        <circle cx={TMS.x + TMS.w - 36} cy={TMS.y + 186} r={15} fill={mix('#6E7C86', K.saffron, tmsLit)} stroke={INK} strokeWidth={4} />
      </g>
      {/* the coil holder arm and the coil cable, over his head */}
      <g fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path d={holder} stroke={INK} strokeWidth={24} />
        <path d={holder} stroke="#9AA7B1" strokeWidth={13} />
        <circle cx={lerp(640, 700, cb)} cy={lerp(170, 190, cb)} r={15} fill="#7E8B96" stroke={INK} strokeWidth={5} />
        <path d={cubD(coilCable)} stroke={INK} strokeWidth={15} />
        <path d={cubD(coilCable)} stroke="#2D363D" strokeWidth={9} />
      </g>
      {/* the coil at the back of the head is behind him */}
      {cb > 0.5 && coilEl}
      <CrewChar {...common} front="L" pass="body" headGear={<g><SwimCapV3 /><EarbudsV3 glow={earGlow} /></g>} />
      {cb <= 0.5 && coilEl}
      {coilPulse > 0.01 && cb <= 0.5 && <ellipse cx={coil.x} cy={coil.y} rx={46 * coilPulse + 20} ry={(46 * coilPulse + 20) * 0.55} transform={`rotate(${coil.ang} ${coil.x} ${coil.y})`} fill={K.saffron} opacity={0.75 * coilPulse} />}
      <g opacity={1 - paper}>
        <Desk id={`${id}-desk`} x0={-200} x1={2200} y={STO_DESK} d={110} h={420} />
      </g>
      {paper > 0.001 && <rect x={-200} y={STO_DESK - 110} width={2400} height={530} fill={mix(K.stoccoWall, K.paper, paper)} opacity={paper} />}
      {/* a mug and a notepad: an ordinary desk, but no screen */}
      <g>
        <rect x={1420} y={STO_DESK - 92} width={64} height={78} rx={10} fill={K.coral} stroke={INK} strokeWidth={5} />
        <path d="M1484,700 q30,0 28,22 q-2,20 -28,18" fill="none" stroke={INK} strokeWidth={6} />
        <path d="M1240,760 L1380,760 L1400,738 L1260,738 Z" fill="#FFFFFF" stroke={INK} strokeWidth={4} strokeLinejoin="round" />
      </g>
      <RouteGlow P={STO_ROUTE} lit={lit} k={sp} w={8} len={0.06} r0={STO_K.box1} />
      {(stim >= 0 || stimLit > 0.01) && <RouteGlow P={stimPath(sh)} lit={stimLit} k={stim} w={7} len={0.4} />}
      {/* his right arm and hand (profile) on the keyboard */}
      <g opacity={1}>
        <RoomArm id={`${id}-arm`} P={STO_P} shoulderRoom={sh} pose={hand} press={press} keyGlow={keyGlow} drive={drive} driveLit={stimLit} skin={K.stoccoSkin} sleeve={K.stoccoSleeve} inkW={inkFor(zr)} keyboard={kb > 0.5} keyRise={kbRise} armLift={armLift}
          handOffset={handOffset ? {x: handOffset.x / HS, y: handOffset.y / HS} : undefined} />
      </g>
      {flash > 0.001 && <SoftArc x={STO_X + 4} y={STO_HEAD.y - 46} w={250} k={flash} />}
    </g>
  );
};

// ---------------------------------------------------------------- the campus (CW world units)
export const LAWN = 740;
/** the two lab windows (each shows its room at 1/3 scale) */
export const WL = {x: -880, y: 300, w: 640, h: 360};
export const WR = {x: 240, y: 300, w: 640, h: 360};
export const RS = 1 / 3;
export const Lw = (p: V): V => ({x: WL.x + p.x * RS, y: WL.y + p.y * RS});
export const Rw = (p: V): V => ({x: WR.x + p.x * RS, y: WR.y + p.y * RS});
/** a camera on a room point (room-local) with a room zoom */
export const camL = (p: V, zr: number): CamS => ({...Lw(p), z: zr / RS});
export const camR = (p: V, zr: number): CamS => ({...Rw(p), z: zr / RS});
/** the wide two-building framing (reference for the parallax layers) */
export const W0: CamS = {x: 0, y: 470, z: 1.05};
const BL = {x0: -1760, x1: -150, top: -330};
const BR = {x0: 150, x1: 1760, top: -210};
const CONDUIT = 772;
const extRoute = (): V[] => [
  {x: WL.x + WL.w, y: 548}, {x: -196, y: 548}, {x: -178, y: 556}, {x: -172, y: 572},
  {x: -172, y: 742}, {x: -166, y: 762}, {x: -146, y: CONDUIT}, {x: 146, y: CONDUIT}, {x: 166, y: 762}, {x: 172, y: 742},
  {x: 172, y: 530}, {x: 178, y: 512}, {x: 196, y: 500}, {x: WR.x, y: 500},
];
/** the whole route in CW units with key fractions */
export const ROUTE = (() => {
  const a = RAO_ROUTE.P.pts.map(Lw);
  const b = extRoute();
  const c = STO_ROUTE.pts.map(Rw).slice(1);
  const pts = [...a, ...b.slice(1), ...c];
  const P = polyOf(pts);
  const tot = P.L[P.L.length - 1];
  const kA = P.L[a.length - 1] / tot; // leaves Rao's room
  const kB = P.L[a.length - 1 + b.length - 1] / tot; // enters Stocco's room
  const kComp = (RAO_ROUTE.kComp * P.L[a.length - 1]) / tot;
  return {P, kA, kB, kComp};
})();
/** the exterior network line only */
export const EXT = polyOf(extRoute());

const Facade: React.FC<{id: string; x0: number; x1: number; top: number; color: string; style: 'brick' | 'stone'; win: {x: number; y: number; w: number; h: number}; room: React.ReactNode; glass?: number}> = ({id, x0, x1, top, color, style, win, room, glass = 1}) => {
  const w = x1 - x0;
  const wins: React.ReactNode[] = [];
  if (style === 'brick') {
    // collegiate brick: tall arched upper windows, big ground-floor windows
    for (let r = 0; r < 2; r++)
      for (let c = 0; c < 8; c++) {
        const wx = x0 + 70 + c * ((w - 140) / 8) + 20, wy = top + 90 + r * 300;
        const ww = (w - 140) / 8 - 40, wh = 200;
        wins.push(
          <g key={`u${r}${c}`}>
            <path d={`M${wx},${wy + wh} L${wx},${wy + ww / 2} A${ww / 2},${ww / 2} 0 0 1 ${wx + ww},${wy + ww / 2} L${wx + ww},${wy + wh} Z`} fill="#BFD9E8" stroke={INK} strokeWidth={5} />
            <path d={`M${wx + ww / 2},${wy + 4} L${wx + ww / 2},${wy + wh}`} stroke={INK} strokeWidth={3} opacity={0.6} />
            <rect x={wx - 8} y={wy + wh} width={ww + 16} height={12} fill={K.stone} stroke={INK} strokeWidth={3} />
          </g>,
        );
      }
  } else {
    // modern stone: ribbon windows between concrete bands
    for (let r = 0; r < 2; r++) {
      const wy = top + 80 + r * 270;
      wins.push(<rect key={`b${r}`} x={x0 + 40} y={wy} width={w - 80} height={150} fill="#9FC3D6" stroke={INK} strokeWidth={5} />);
      for (let c = 1; c < 10; c++) wins.push(<path key={`m${r}${c}`} d={`M${x0 + 40 + (c * (w - 80)) / 10},${wy} L${x0 + 40 + (c * (w - 80)) / 10},${wy + 150}`} stroke={INK} strokeWidth={4} opacity={0.7} />);
      wins.push(<path key={`g${r}`} d={`M${x0 + 60},${wy + 20} L${x0 + 180},${wy + 20}`} stroke="#FFFFFF" strokeWidth={8} opacity={0.35} />);
    }
  }
  // ground floor: other big windows (dim glass) beside the lab
  const gfl: React.ReactNode[] = [];
  const gw = 300;
  for (let gx = x0 + 60; gx + gw < x1 - 40; gx += gw + 90) {
    if (gx + gw > win.x - 60 && gx < win.x + win.w + 60) continue;
    gfl.push(
      <g key={gx}>
        <rect x={gx} y={win.y + 30} width={gw} height={win.h - 30} rx={6} fill="#8FB2C6" stroke={INK} strokeWidth={6} />
        <path d={`M${gx + 30},${win.y + 60} L${gx + 120},${win.y + 60}`} stroke="#FFFFFF" strokeWidth={10} opacity={0.3} strokeLinecap="round" />
        <rect x={gx - 12} y={win.y + win.h} width={gw + 24} height={18} fill={K.stone} stroke={INK} strokeWidth={4} />
      </g>,
    );
  }
  return (
    <g>
      <defs>
        <linearGradient id={`${id}-f`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor={lit(color, 0.1)} />
          <stop offset="1" stopColor={shade(color, 0.14)} />
        </linearGradient>
        <clipPath id={`${id}-win`}>
          <rect x={win.x} y={win.y} width={win.w} height={win.h} />
        </clipPath>
      </defs>
      <rect x={x0} y={top} width={w} height={LAWN - top} fill={`url(#${id}-f)`} stroke={INK} strokeWidth={7} />
      {style === 'brick' && (
        <g opacity={0.18} stroke={shade(color, 0.4)} strokeWidth={3}>
          {Array.from({length: Math.floor((LAWN - top) / 40)}, (_, i) => (
            <path key={i} d={`M${x0},${top + 20 + i * 40} L${x1},${top + 20 + i * 40}`} />
          ))}
        </g>
      )}
      {style === 'stone' && <rect x={x0} y={top + 240} width={w} height={26} fill={shade(color, 0.08)} stroke={INK} strokeWidth={4} />}
      <rect x={x0 - 20} y={top - 40} width={w + 40} height={46} fill={style === 'brick' ? '#6F7E88' : shade(color, 0.18)} stroke={INK} strokeWidth={7} />
      {wins}
      {gfl}
      <rect x={x0} y={LAWN - 50} width={w} height={50} fill={K.stone} stroke={INK} strokeWidth={5} />
      {/* the lab window: the room inside, at 1/3 scale */}
      <rect x={win.x - 22} y={win.y - 22} width={win.w + 44} height={win.h + 44} rx={6} fill={K.stone} stroke={INK} strokeWidth={6} />
      <g clipPath={`url(#${id}-win)`}>
        <g transform={`translate(${win.x} ${win.y}) scale(${fx(RS)})`}>{room}</g>
        {glass > 0.01 && <path d={`M${win.x + 40},${win.y} L${win.x + 150},${win.y} L${win.x + 30},${win.y + win.h} L${win.x - 80},${win.y + win.h} Z`} fill="#FFFFFF" opacity={0.1 * glass} />}
      </g>
      <rect x={win.x} y={win.y} width={win.w} height={win.h} fill="none" stroke={INK} strokeWidth={5} />
      <rect x={win.x - 34} y={win.y + win.h + 20} width={win.w + 68} height={20} fill={K.stone} stroke={INK} strokeWidth={5} />
    </g>
  );
};

const Cloud: React.FC<{x: number; y: number; s: number}> = ({x, y, s}) => (
  <g transform={`translate(${fmt(x)} ${y}) scale(${s})`} opacity={0.92}>
    <ellipse cx={0} cy={0} rx={90} ry={34} fill="#FFFFFF" />
    <ellipse cx={-50} cy={8} rx={60} ry={26} fill="#FFFFFF" />
    <ellipse cx={60} cy={10} rx={64} ry={24} fill="#FFFFFF" />
  </g>
);
/** far + mid campus layers, authored in screen coordinates at W0 */
const FarLayer: React.FC<{t: number}> = ({t}) => (
  <g>
    {/* a distant snow-capped peak and hills */}
    <path d="M300,700 L760,330 Q800,300 840,330 L1300,700 Z" fill="#B9CBDB" />
    <path d="M700,380 L760,330 Q800,300 840,330 L900,380 Q860,370 830,392 Q800,372 770,394 Q740,372 700,380 Z" fill="#FFFFFF" opacity={0.9} />
    <path d="M-2600,720 Q-1400,560 -300,690 T1700,640 T4200,690 L4200,1400 L-2600,1400 Z" fill="#A9C79A" />
    {[-1400, -200, 1500, 2700].map((x, i) => <Cloud key={i} x={x + ((t * 14) % 600)} y={140 + (i % 2) * 90} s={1 + (i % 3) * 0.2} />)}
  </g>
);
const MidLayer: React.FC = () => {
  const b = (x: number, w: number, h: number, c: string, k: number) => (
    <g key={x}>
      <rect x={x} y={760 - h} width={w} height={h} fill={c} stroke={INK} strokeWidth={4} opacity={0.95} />
      {Array.from({length: Math.floor(w / 46)}, (_, i) => (
        <rect key={i} x={x + 14 + i * 46} y={760 - h + 24} width={22} height={h - 60} fill="#CFE0EA" opacity={0.6} />
      ))}
      {k > 0 && <path d={`M${x + w / 2 - 30},${760 - h} L${x + w / 2},${760 - h - 120} L${x + w / 2 + 30},${760 - h} Z`} fill={shade(c, 0.15)} stroke={INK} strokeWidth={4} />}
    </g>
  );
  return (
    <g>
      {b(-1900, 520, 260, '#C79B82', 0)}
      {b(-1300, 380, 330, '#D3B48F', 1)}
      {b(-700, 420, 230, '#BE8A73', 0)}
      {/* a collegiate tower */}
      <g>
        <rect x={880} y={330} width={160} height={430} fill="#D5C0A0" stroke={INK} strokeWidth={4} />
        <path d="M870,330 L960,190 L1050,330 Z" fill="#8C7A64" stroke={INK} strokeWidth={4} />
        <rect x={926} y={380} width={68} height={110} rx={30} fill="#CFE0EA" opacity={0.7} />
      </g>
      {b(1200, 420, 250, '#C9A487', 0)}
      {b(1800, 520, 300, '#BF8E76', 1)}
      {b(2500, 480, 240, '#D4B595', 0)}
      {[-1500, -500, 300, 1500, 2300].map((x, i) => (
        <g key={i} transform={`translate(${x} 770) scale(0.8)`}>
          <rect x={-12} y={-90} width={24} height={90} fill="#8A5A3B" />
          <circle cx={0} cy={-140} r={78} fill={K.grassDeep} />
        </g>
      ))}
    </g>
  );
};

export type CampusOpts = {
  id: string;
  f: number;
  cam: CamS;
  roomL: React.ReactNode;
  roomR: React.ReactNode;
  /** the network line, drawn (0..1 visibility) */
  netK?: number;
  /** signal head on ROUTE (arc fraction); < 0 hides it */
  sig?: number;
  sigLen?: number;
  sigWidth?: number;
  /** pulses streaming along the exterior line 0..1 */
  stream?: number;
  /** near foreground layer */
  near?: React.ReactNode;
  overlay?: React.ReactNode;
  /** window glass sheen 0..1 */
  glass?: number;
  /** window glows (left monitor blue / right keyboard saffron) */
  glowL?: number;
  glowR?: number;
};
export const Campus: React.FC<CampusOpts> = ({id, f, cam, roomL, roomR, netK = 1, sig = -1, sigLen = 0.05, sigWidth, stream = 0, near, overlay, glass = 1, glowL = 0, glowR = 0}) => {
  const t = f / FPS;
  const sigW = sigWidth ?? Math.max(3, 10 / Math.sqrt(Math.max(0.3, cam.z)));
  const sigCol = sig < ROUTE.kComp ? K.teal : K.saffron;
  // the exterior network line
  const netD = polySub(EXT, 0, 1);
  return (
    <g>
      <defs>
        <linearGradient id={`${id}-sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={K.skyDeep} />
          <stop offset="1" stopColor={lit(K.sky, 0.3)} />
        </linearGradient>
      </defs>
      <rect x={0} y={0} width={1920} height={1080} fill={`url(#${id}-sky)`} />
      <Par cam={cam} ref0={W0} d={0.25}>
        <FarLayer t={t} />
      </Par>
      <Par cam={cam} ref0={W0} d={0.55}>
        <MidLayer />
      </Par>
      <World cam={cam}>
        {/* lawn, path, the gap between the two buildings */}
        <rect x={-6000} y={LAWN} width={12000} height={4000} fill={K.grass} />
        <path d={`M-6000,${LAWN} L6000,${LAWN}`} stroke={K.grassDeep} strokeWidth={10} />
        <path d={`M-150,${LAWN + 120} C-60,${LAWN + 200} 60,${LAWN + 200} 150,${LAWN + 120} L1900,${LAWN + 120} L1900,${LAWN + 180} L150,${LAWN + 180} C60,${LAWN + 260} -60,${LAWN + 260} -150,${LAWN + 180} L-1900,${LAWN + 180} L-1900,${LAWN + 120} Z`} fill={K.path} opacity={0.9} />
        <Tree x={-20} y={LAWN + 6} s={1.25} />
        {/* lamp post in the gap */}
        <g>
          <rect x={86} y={LAWN - 300} width={12} height={300} fill="#46525C" stroke={INK} strokeWidth={3} />
          <rect x={72} y={LAWN - 330} width={40} height={36} rx={8} fill="#FFF3C4" stroke={INK} strokeWidth={4} />
        </g>
        {/* walkers on the far path (background life) */}
        {[0, 1, 2].map((i) => {
          const u = (t * (0.035 + i * 0.01) + i * 0.37) % 1;
          const px = -1700 + 3400 * (i % 2 ? 1 - u : u);
          const py = LAWN + 150;
          const step = Math.sin(t * 9 + i) * 4;
          const col = [K.coral, K.teal, K.saffron][i];
          return (
            <g key={i} transform={`translate(${fmt(px)} ${py}) scale(2.2)`}>
              <ellipse cx={0} cy={2} rx={11} ry={3} fill={INK} opacity={0.15} />
              <rect x={-4 + step * 0.4} y={-14} width={3.4} height={14} rx={1.5} fill="#2E3F5C" />
              <rect x={0.6 - step * 0.4} y={-14} width={3.4} height={14} rx={1.5} fill="#2E3F5C" />
              <rect x={-6} y={-32} width={12} height={20} rx={4} fill={col} stroke={INK} strokeWidth={1.6} />
              <circle cx={0} cy={-38} r={6} fill="#E8B48F" stroke={INK} strokeWidth={1.6} />
            </g>
          );
        })}
        <Facade id={`${id}-bl`} x0={BL.x0} x1={BL.x1} top={BL.top} color={K.brick} style="brick" win={WL} room={roomL} glass={glass} />
        <Facade id={`${id}-br`} x0={BR.x0} x1={BR.x1} top={BR.top} color="#D8C4A2" style="stone" win={WR} room={roomR} glass={glass} />
        {glowL > 0.01 && <rect x={WL.x - 22} y={WL.y - 22} width={WL.w + 44} height={WL.h + 44} rx={8} fill="none" stroke={K.blue} strokeWidth={16} opacity={glowL} />}
        {glowR > 0.01 && <rect x={WR.x - 22} y={WR.y - 22} width={WR.w + 44} height={WR.h + 44} rx={8} fill="none" stroke={K.saffron} strokeWidth={16} opacity={glowR} />}
        {/* the network line between the buildings: down the corner, under the lawn, up the other corner */}
        {netK > 0.01 && (
          <g opacity={netK} fill="none" strokeLinecap="round" strokeLinejoin="round">
            <path d={netD} stroke={INK} strokeWidth={13} />
            <path d={netD} stroke="#5D6B76" strokeWidth={7} />
            {stream > 0.01 &&
              [0, 1, 2, 3, 4].map((i) => {
                const u = (t * 0.45 + i / 5) % 1;
                const q = polyAt(EXT, u);
                return <circle key={i} cx={fmt(q.x)} cy={fmt(q.y)} r={9} fill={K.saffron} stroke={INK} strokeWidth={2.5} opacity={stream} />;
              })}
          </g>
        )}
        {sig >= 0 && <Pulse P={ROUTE.P} k={sig} len={sigLen} w={sigW} color={sigCol} />}
        {overlay}
      </World>
      {near}
    </g>
  );
};

// ---------------------------------------------------------------- the ordinary desk (the "sitting down at a desk" gag)
export const OfficeChair: React.FC<{x: number; y: number; s: number; rock: number; spin: number}> = ({x, y, s, rock, spin}) => (
  <g transform={`translate(${fmt(x)} ${fmt(y)}) rotate(${fmt(rock)}) scale(${fmt(s)})`}>
    <ellipse cx={0} cy={4} rx={150} ry={16} fill={INK} opacity={0.14} />
    {[-1, -0.45, 0.45, 1].map((u, i) => (
      <g key={i}>
        <path d={`M0,-40 L${u * 120},${-12 + Math.abs(u) * 4}`} stroke={INK} strokeWidth={22} strokeLinecap="round" />
        <path d={`M0,-40 L${u * 120},${-12 + Math.abs(u) * 4}`} stroke="#4A4F57" strokeWidth={12} strokeLinecap="round" />
        <circle cx={u * 120} cy={-2} r={14} fill="#2D3238" stroke={INK} strokeWidth={4} />
        <path d={`M${u * 120},-2 l${fmt(Math.cos(spin + i) * 10)},${fmt(Math.sin(spin + i) * 10)}`} stroke="#8A929B" strokeWidth={3} />
      </g>
    ))}
    <rect x={-13} y={-170} width={26} height={136} rx={6} fill="#7E8B96" stroke={INK} strokeWidth={5} />
    <ellipse cx={0} cy={-176} rx={130} ry={34} fill="#3E4A57" stroke={INK} strokeWidth={6} />
    <rect x={-16} y={-250} width={32} height={80} fill="#46525C" stroke={INK} strokeWidth={5} />
    <rect x={-112} y={-420} width={224} height={200} rx={48} fill="#4A5866" stroke={INK} strokeWidth={6} />
    <rect x={-86} y={-400} width={172} height={36} rx={16} fill={lit('#4A5866', 0.2)} opacity={0.7} />
  </g>
);
/** an ordinary desk: top, apron, a drawer pedestal on the left, a leg on the right */
export const PlainDesk: React.FC<{id: string; x0: number; x1: number; y: number; d: number; h: number}> = ({id, x0, x1, y, d, h}) => {
  const ap = 44;
  const fl = y + h;
  const ped = {x0: x0 + 20, x1: x0 + 330};
  const leg = {x0: x1 - 60, x1: x1 - 20};
  return (
    <g>
      <ellipse cx={(x0 + x1) / 2} cy={fl + 6} rx={(x1 - x0) * 0.56} ry={20} fill={INK} opacity={0.12} />
      <rect x={ped.x1} y={y + ap} width={leg.x0 - ped.x1} height={(fl - y - ap) * 0.62} fill={shade(K.desk, 0.42)} stroke={INK} strokeWidth={5} />
      <Desk id={id} x0={x0} x1={x1} y={y} d={d} h={ap} />
      <rect x={ped.x0} y={y + ap} width={ped.x1 - ped.x0} height={fl - y - ap} fill={shade(K.desk, 0.06)} stroke={INK} strokeWidth={6} />
      {[0, 1, 2].map((i) => {
        const hh = (fl - y - ap - 40) / 3;
        const yy = y + ap + 14 + i * (hh + 6);
        return (
          <g key={i}>
            <rect x={ped.x0 + 18} y={yy} width={ped.x1 - ped.x0 - 36} height={hh} rx={8} fill={lit(K.desk, 0.08)} stroke={INK} strokeWidth={4} />
            <rect x={(ped.x0 + ped.x1) / 2 - 40} y={yy + hh / 2 - 6} width={80} height={12} rx={6} fill={K.deskDeep} />
          </g>
        );
      })}
      <rect x={leg.x0} y={y + ap} width={leg.x1 - leg.x0} height={fl - y - ap} fill={shade(K.desk, 0.1)} stroke={INK} strokeWidth={6} />
    </g>
  );
};

// ---------------------------------------------------------------- game helpers
export const GameAt: React.FC<{cam: CamS; t: number; events: GEvent[]; cityHitAt?: number; children?: React.ReactNode}> = ({cam, t, events, cityHitAt, children}) => (
  <g transform={camT(cam)}>
    <rect x={-2000} y={-2000} width={4640} height={4400} fill="#E3F4FA" />
    <GameScreen t={t} events={events} cityHitAt={cityHitAt} />
    {children}
  </g>
);
/** dashed arc showing the path every plane and rocket flies (game coords) */
export const ArcGhost: React.FC<{k: number; u0?: number; u1?: number; w?: number}> = ({k, u0 = 0, u1 = 1, w = 3}) => {
  if (k <= 0.01) return null;
  const pts = Array.from({length: 41}, (_, i) => arcPt(lerp(u0, u1, i / 40)));
  return <path d={`M${pts.map((p) => `${fmt(p.x)},${fmt(p.y)}`).join(' L')}`} fill="none" stroke="#FFFFFF" strokeWidth={w} strokeDasharray={`${w * 3} ${w * 3}`} strokeLinecap="round" opacity={0.85 * k} />;
};

export {easeIn, easeOut, easeInOut};
