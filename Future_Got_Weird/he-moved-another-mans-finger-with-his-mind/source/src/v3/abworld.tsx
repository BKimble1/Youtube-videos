// V2 sequences A + B (0 -> 44.64 s): the shared world.
//  - cameras: anchor-preserving keyed camera (a pull-out keeps its subject steady), near-layer parallax
//  - RaoRoom   Rao's lab, front view (room-local 1920 x 1080): EEG cap -> cable -> computer -> network out, the
//              game monitor, his right hand flat on the desk (frame-left)
//  - StoccoRoom Stocco's lab, seen from BEHIND (room-local 1920 x 1080): he faces a bare wall; swim cap, earbuds,
//              round coil over his LEFT motor cortex (frame-left in a back view), TMS unit, keyboard + right hand
//  - Campus    the two labs in two different buildings (CW world units), the network line between them, far/mid
//              parallax layers, and the signal route (cap -> cable -> computer -> network -> TMS -> coil)
// Every value is a pure function of the frame. Ids are prefixed by the caller (`va-` / `vb-`).
import React from 'react';
import {clamp, easeIn, easeInOut, easeOut, fmt, lerp} from '../dc/math';
import {lit, mix, shade} from '../dc/color';
import {Capsule, Blob, SoftShadow} from '../dc/shade';
import {Inked} from '../dc/ink';
import {Arm, CrewChar, IDLE, Look, Pose, reachLocal} from '../art/crew';
import {RAO} from '../art/people';
import {GameScreen, GEvent, arcPt, CANNON, evState} from '../art/game';
import {Computer, Desk, FONT_HEAD, INK, K, Keyboard, RoundCoil, Tree} from '../art/kit';
import {FPS} from './core2';

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

// ---------------------------------------------------------------- Rao's lab (front view)
const CS = 1.5, GR = 1000, HY = -372, HR = 58;
export const RAO_X = 620;
export const RAO_HEAD = {x: RAO_X, y: GR + HY * CS};
export const RAO_DESK_Y = 760;
/** Rao's game monitor (room-local) */
export const RMON = {x: 1440, y: 708, s: 0.62};
/** computer tower on the desk (bottom centre) */
const COMP = {x: 1010, y: 712, s: 0.6};
/** Rao's hands (room-local): his RIGHT hand is frame-left in a front view */
export const RAO_RH = {x: 430, y: 714};
const RAO_LH = {x: 810, y: 716};
/** EEG cable: from the end of the cap's own lead (on his left shoulder) down to the desk and on to the computer */
export const RAO_CABLE: V[] = [{x: RAO_X + (HR + 26) * CS, y: GR + (HY + 120) * CS}, {x: 770, y: 730}, {x: 808, y: 744}, {x: 968, y: 690}];
const RAO_MONCABLE: V[] = [{x: 1052, y: 672}, {x: 1150, y: 700}, {x: 1300, y: 712}, {x: 1420, y: 700}];
/** network: computer -> along the back of the desk -> out of the room at the right wall (x 1920) */
export const RAO_NET: V[] = [{x: 1050, y: 690}, {x: 1150, y: 750}, {x: 1600, y: 748}, {x: 1920, y: 744}];
const hs = (x: number, y: number): V => ({x: RAO_X + x * CS, y: GR + y * CS});
/** route inside Rao's lab, room-local: cap crown -> cap lead -> cable -> computer -> network exit */
export const raoRoute = (): V[] => [
  hs(0, HY - HR - 6), hs(30, HY - HR + 4), hs(HR - 2, HY - 6),
  ...cubPts([hs(HR - 2, HY - 6), hs(HR + 30, HY + 30), hs(HR + 30, HY + 70), hs(HR + 26, HY + 120)], 8).slice(1),
  ...cubPts(RAO_CABLE, 16).slice(1),
  {x: COMP.x, y: 660}, {x: 1050, y: 690},
  ...cubPts(RAO_NET, 18).slice(1),
];
/** fraction of the Rao route at which the signal reaches the computer (teal -> saffron) */
export const RAO_COMP_K = (() => {
  const r = raoRoute();
  const P = polyOf(r);
  const i = r.findIndex((p) => p.x === COMP.x && p.y === 660);
  return P.L[i] / P.L[P.L.length - 1];
})();

/** the measurement path in Rao's room: cap crown -> lead -> cable -> computer */
const RAO_FLOW = (() => {
  const r = raoRoute();
  const i = r.findIndex((p) => p.x === COMP.x && p.y === 660);
  return polyOf(r.slice(0, i + 1));
})();
const RouteDots: React.FC<{P: Poly; t: number; k: number; color?: string; n?: number; r?: number}> = ({P, t, k, color = K.teal, n = 5, r = 9}) => (
  <g opacity={clamp(k)}>
    {Array.from({length: n}, (_, i) => {
      const q = polyAt(P, (t * 0.7 + i / n) % 1);
      return (
        <g key={i}>
          <circle cx={fmt(q.x)} cy={fmt(q.y)} r={r * 2} fill={color} opacity={0.3} />
          <circle cx={fmt(q.x)} cy={fmt(q.y)} r={r} fill={color} stroke={INK} strokeWidth={2.5} />
        </g>
      );
    })}
  </g>
);
const ELEC: [number, number][] = [[-40, -12], [-20, -34], [0, -40], [20, -34], [40, -12], [-30, 4], [0, -16], [30, 4], [-50, 6], [50, 6]];
/** EEG cap (art/people EEGCap) with electrodes that light up teal in a travelling wave (lit 0..1, wave = phase) */
const CapV2: React.FC<{lit: number; t: number}> = ({lit: lk, t}) => (
  <g>
    {lk > 0.01 && <ellipse cx={0} cy={HY - HR + 6} rx={HR + 26} ry={HR * 0.85} fill={K.teal} opacity={0.22 * lk} />}
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
/** the game reflected small in Rao's glasses (head space, under the cap) */
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
const armTo = (cx: number, flip: boolean, side: -1 | 1, wx: number, wy: number): Arm => reachLocal(((flip ? -1 : 1) * (wx - cx)) / CS, (wy - GR) / CS, side);

export type RaoOpts = {
  id: string;
  f: number;
  /** the game screen content (640 x 400 local) */
  screen: React.ReactNode;
  /** electrodes lit 0..1 */
  capLit?: number;
  /** computer status light 0..1 and its colour */
  compBlink?: number;
  compColor?: string;
  face?: Partial<Pose>;
  /** game reflected in his glasses 0..1 (and the content) */
  lens?: number;
  lensContent?: React.ReactNode;
  /** a saffron ring on his still right hand ("the hand on the left") */
  handRing?: number;
  /** monitor glare / screen edge (fade them on a full-screen push) */
  glare?: number;
  edge?: number;
  /** emphasis on the monitor 0..1 */
  monGlow?: number;
  /** the EEG cable lit teal 0..1, and teal measurement dots flowing cap -> computer 0..1 */
  cableGlow?: number;
  flow?: number;
};
export const RaoRoom: React.FC<RaoOpts> = ({id, f, screen, capLit = 0, compBlink = 0, compColor = K.teal, face = {}, lens = 0, lensContent, handRing = 0, glare = 1, edge = 1, monGlow = 0, cableGlow = 0, flow = 0}) => {
  const t = f / FPS;
  const sR: -1 | 1 = -1; // front view, unflipped: the right hand is rig side -1
  const aR = armTo(RAO_X, false, sR, RAO_RH.x, RAO_RH.y);
  const aL = armTo(RAO_X, false, 1, RAO_LH.x, RAO_LH.y);
  const pose: Pose = {...IDLE, lookX: 0.85, lookY: 0.12, mouth: 'smile', ...face, armL: aR, armR: aL};
  const gear = (
    <g>
      <Lenses id={`${id}-l`} k={lens} content={lensContent ?? screen} />
      <CapV2 lit={capLit} t={t} />
    </g>
  );
  const common = {look: RAO as Look, pose, frame: f, seed: 3, x: RAO_X, y: GR, scale: CS, flip: false, life: 0.45, headGear: gear, id: `${id}-c`, shadow: false};
  return (
    <g>
      <defs>
        <linearGradient id={`${id}-wl`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={lit(K.raoWall, 0.25)} />
          <stop offset="1" stopColor={K.raoWall} />
        </linearGradient>
      </defs>
      <rect x={-300} y={-400} width={2520} height={1900} fill={`url(#${id}-wl)`} />
      <rect x={-300} y={540} width={2520} height={30} fill={K.raoWallDeep} />
      {/* pinboard + a framed plot: Rao's room */}
      <rect x={110} y={140} width={250} height={180} rx={8} fill="#E9D8B8" stroke={INK} strokeWidth={6} />
      <rect x={142} y={166} width={78} height={60} fill="#FFFFFF" stroke={INK} strokeWidth={4} transform="rotate(-4 181 196)" />
      <rect x={242} y={176} width={84} height={98} fill={K.blueLight} stroke={INK} strokeWidth={4} transform="rotate(5 284 225)" />
      <circle cx={182} cy={168} r={7} fill={K.coral} stroke={INK} strokeWidth={3} />
      <rect x={1640} y={150} width={170} height={130} rx={6} fill="#FFFFFF" stroke={INK} strokeWidth={6} />
      <path d="M1662,250 L1700,216 L1730,236 L1786,178" fill="none" stroke={K.blue} strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" />
      {/* chair back */}
      <rect x={RAO_X - 150} y={GR - 470} width={300} height={360} rx={44} fill="#4A5866" stroke={INK} strokeWidth={6} />
      <rect x={RAO_X - 118} y={GR - 446} width={236} height={40} rx={18} fill={lit('#4A5866', 0.18)} opacity={0.6} />
      <CrewChar {...common} front="L" pass="body" />
      <Desk id={`${id}-desk`} x0={60} x1={2200} y={RAO_DESK_Y} d={130} h={420} />
      {/* network cable along the back of the desk and out through the wall (frame right: toward Stocco's building) */}
      <g fill="none" strokeLinecap="round">
        <path d={cubD(RAO_NET)} stroke={INK} strokeWidth={13} />
        <path d={cubD(RAO_NET)} stroke="#5D6B76" strokeWidth={7} />
      </g>
      <Computer x={COMP.x} y={COMP.y} s={COMP.s} blink={compBlink} color={compColor} />
      <g fill="none" strokeLinecap="round">
        <path d={cubD(RAO_MONCABLE)} stroke={INK} strokeWidth={12} />
        <path d={cubD(RAO_MONCABLE)} stroke="#3B4A57" strokeWidth={6} />
      </g>
      {monGlow > 0.01 && <rect x={RMON.x - 236} y={RMON.y - 350} width={472} height={310} rx={30} fill={K.saffron} opacity={0.35 * monGlow} />}
      <MonitorV2 id={`${id}-mon`} x={RMON.x} y={RMON.y} s={RMON.s} glare={glare} edge={edge}>
        {screen}
      </MonitorV2>
      <CrewChar {...common} front="L" pass="frontArm" />
      <CrewChar {...common} front="R" pass="frontArm" />
      {/* the EEG cable from the cap lead, over his left shoulder and arm, down to the desk and the computer */}
      <g fill="none" strokeLinecap="round">
        {cableGlow > 0.01 && <path d={cubD(RAO_CABLE)} stroke={cableGlow > 0.8 ? '#FFFFFF' : K.teal} strokeWidth={34} opacity={0.35 * cableGlow} />}
        <path d={cubD(RAO_CABLE)} stroke={INK} strokeWidth={13} />
        <path d={cubD(RAO_CABLE)} stroke={mix('#3B4A57', cableGlow > 0.8 ? K.saffron : '#7FE3DA', cableGlow)} strokeWidth={7} />
      </g>
      {flow > 0.01 && <RouteDots P={RAO_FLOW} t={t} k={flow} />}
      {handRing > 0.01 && (
        <g opacity={Math.min(1, handRing * 1.5)}>
          <ellipse cx={RAO_RH.x + 10} cy={RAO_RH.y + 4} rx={150 + 40 * (1 - handRing)} ry={100 + 26 * (1 - handRing)} fill="none" stroke={K.saffron} strokeWidth={22} />
          <ellipse cx={RAO_RH.x + 10} cy={RAO_RH.y + 4} rx={150 + 40 * (1 - handRing)} ry={100 + 26 * (1 - handRing)} fill="none" stroke={INK} strokeWidth={5} opacity={0.6} />
        </g>
      )}
    </g>
  );
};

// ---------------------------------------------------------------- Stocco's lab, seen from behind (he faces a bare wall)
const SHD = {x: 960, y: 330, rx: 118, ry: 128};
/** the coil sits over his LEFT motor cortex: frame-left in this back view */
const SCOIL = {x: 853, y: 240, s: 0.5, ang: -50.9};
const S_HANDLE = {x: 938, y: 135};
const TMS = {x: 212, y: 398, w: 226, h: 296};
const TMS_CABLE: V[] = [{x: 300, y: 402}, {x: 300, y: 130}, {x: 700, y: 10}, {x: 940, y: 131}];
/** network: in through the left wall (x 0, toward Rao's building) -> the TMS unit */
const STO_NET: V[] = [{x: 0, y: 600}, {x: 80, y: 600}, {x: 150, y: 610}, {x: TMS.x, y: 600}];
export const SKB = {x: 1430, y: 704, s: 0.62};
/** where a screen would stand behind his keyboard (the dashed "no screen" outline) */
export const GHOST = {x: 1430, y: 372};
/** the right hand (back view): wrist and the index tip on the space bar */
const S_ELBOW = {x: 1304, y: 846};
const S_WRIST = {x: 1398, y: 778};
/** where the index fingertip rests: on the space bar */
export const S_TIP = {x: 1392, y: 699};
export const stoRoute = (): V[] => [
  ...cubPts(STO_NET, 10),
  {x: TMS.x + 60, y: 560}, {x: 300, y: 470}, {x: 300, y: 402},
  ...cubPts(TMS_CABLE, 20).slice(1),
  {x: S_HANDLE.x, y: S_HANDLE.y}, {x: SCOIL.x, y: SCOIL.y},
];
/** the dorsal (back-of-hand) view of his right hand resting just in front of the keyboard, index on the space bar.
 *  press 0..1 pushes the index down (and the cap with it). */
const BackHand: React.FC<{id: string; press?: number; lift?: number}> = ({id, press = 0, lift = 0}) => {
  const sk = K.stoccoSkin;
  const W = {x: S_WRIST.x, y: S_WRIST.y - 6 * lift};
  // hand axis: from the wrist forward (up-screen) toward the space bar; across = toward the little finger (frame right)
  const dx = S_TIP.x + 22 - W.x, dy = S_TIP.y - W.y, dl = Math.hypot(dx, dy);
  const ax = {x: dx / dl, y: dy / dl};
  const nx = {x: -ax.y, y: ax.x};
  const P = (u: number, v: number): V => ({x: W.x + ax.x * u + nx.x * v, y: W.y + ax.y * u + nx.y * v - lift * 14 * (u / 80)});
  const kn = [-24, -8, 8, 23].map((v, i) => P(58 - Math.abs(i - 1.2) * 4, v));
  const tipLen = [24 + 6 * press, 20, 18, 14];
  const fingers = kn.map((k, i) => {
    const L = tipLen[i];
    const tip = {x: k.x + ax.x * L, y: k.y + ax.y * L * 0.6 + (i === 0 ? 2 * press : 0)};
    return {k, tip};
  });
  const palm = `M${fmt(P(0, -24).x)},${fmt(P(0, -24).y)} C${fmt(P(30, -36).x)},${fmt(P(30, -36).y)} ${fmt(P(58, -38).x)},${fmt(P(58, -38).y)} ${fmt(P(66, -30).x)},${fmt(P(66, -30).y)} L${fmt(P(64, 34).x)},${fmt(P(64, 34).y)} C${fmt(P(46, 38).x)},${fmt(P(46, 38).y)} ${fmt(P(20, 32).x)},${fmt(P(20, 32).y)} ${fmt(P(0, 24).x)},${fmt(P(0, 24).y)} Z`;
  const th0 = P(14, -26), th1 = P(34, -40), th2 = P(48, -40);
  return (
    <g>
      <Inked w={6}>
        {fingers.slice().reverse().map((g, i) => (
          <Capsule key={i} id={`${id}-f${i}`} a={g.k} b={g.tip} ra={9.5} rb={8} color={i === 3 ? sk : shade(sk, 0.06 + 0.03 * i)} />
        ))}
        <Capsule id={`${id}-t1`} a={th0} b={th1} ra={11} rb={9} color={sk} />
        <Capsule id={`${id}-t2`} a={th1} b={th2} ra={9} rb={8} color={sk} />
        <Blob id={`${id}-palm`} d={palm} c={P(36, -6)} r={60} color={sk} />
        <Capsule id={`${id}-fa`} a={S_ELBOW} b={W} ra={38} rb={30} color={K.stoccoSleeve} spec={0.1} />
      </Inked>
      {/* knuckle bumps */}
      {fingers.map((g, i) => (
        <circle key={i} cx={fmt(g.k.x + 2)} cy={fmt(g.k.y - 1)} r={4} fill={lit(sk, 0.35)} opacity={0.7} />
      ))}
      <path d={`M${fmt(W.x - 26)},${fmt(W.y + 18)} L${fmt(W.x + 22)},${fmt(W.y - 8)}`} stroke={shade(K.stoccoSleeve, 0.35)} strokeWidth={6} strokeLinecap="round" opacity={0.6} />
    </g>
  );
};

export type StoOpts = {
  id: string;
  f: number;
  /** coil pulse 0..1 */
  coilPulse?: number;
  /** TMS unit light 0..1 */
  tmsLit?: number;
  /** space bar glow / press */
  space?: number;
  press?: number;
  /** the hand jerk (lift) 0..1 */
  lift?: number;
  /** a dashed "no screen here" outline on the bare wall 0..1 */
  ghostScreen?: number;
  /** a soft glow on the earbuds 0..1 */
  earGlow?: number;
};
export const StoccoRoom: React.FC<StoOpts> = ({id, f, coilPulse = 0, tmsLit = 0, space = 0, press = 0, lift = 0, ghostScreen = 0, earGlow = 0}) => {
  const t = f / FPS;
  const bob = Math.sin(t * 1.4) * 1.5;
  const sk = K.stoccoSkin;
  return (
    <g>
      <defs>
        <linearGradient id={`${id}-wall`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={lit(K.stoccoWall, 0.22)} />
          <stop offset="1" stopColor={K.stoccoWall} />
        </linearGradient>
        <linearGradient id={`${id}-shirt`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor={lit(K.stoccoSleeve, 0.18)} />
          <stop offset="1" stopColor={shade(K.stoccoSleeve, 0.22)} />
        </linearGradient>
        <radialGradient id={`${id}-head`} cx="0.38" cy="0.32" r="0.8">
          <stop offset="0" stopColor={lit(sk, 0.2)} />
          <stop offset="1" stopColor={shade(sk, 0.18)} />
        </radialGradient>
        <radialGradient id={`${id}-cap`} cx="0.35" cy="0.25" r="0.85">
          <stop offset="0" stopColor={lit(K.swimCap, 0.25)} />
          <stop offset="1" stopColor={shade(K.swimCap, 0.2)} />
        </radialGradient>
        <clipPath id={`${id}-hclip`}>
          <ellipse cx={SHD.x} cy={SHD.y} rx={SHD.rx} ry={SHD.ry} />
        </clipPath>
      </defs>
      {/* the bare wall he faces: nothing to watch */}
      <rect x={-300} y={-500} width={2520} height={1110} fill={`url(#${id}-wall)`} />
      <rect x={-300} y={584} width={2520} height={26} fill={K.stoccoWallDeep} />
      <rect x={1790} y={470} width={44} height={60} rx={6} fill="#FBF3E4" stroke={INK} strokeWidth={4} />
      <circle cx={1812} cy={492} r={4} fill={INK} opacity={0.5} />
      <circle cx={1812} cy={510} r={4} fill={INK} opacity={0.5} />
      {ghostScreen > 0.01 && (
        <g opacity={ghostScreen} fill="none" stroke={INK} strokeLinejoin="round">
          <rect x={GHOST.x - 199} y={GHOST.y - 124} width={398} height={248} rx={10} strokeWidth={7} strokeDasharray="26 18" />
          <path d={`M${GHOST.x - 14},${GHOST.y + 140} L${GHOST.x - 14},${GHOST.y + 196} M${GHOST.x + 14},${GHOST.y + 140} L${GHOST.x + 14},${GHOST.y + 196} M${GHOST.x - 60},${GHOST.y + 206} L${GHOST.x + 60},${GHOST.y + 206}`} strokeWidth={6} strokeDasharray="14 10" />
        </g>
      )}
      {/* desk top (seen past him), the desk front edge, the dark knee space and the floor */}
      <path d="M-300,610 L2220,610 L2220,770 L-300,770 Z" fill="#D9A773" stroke={INK} strokeWidth={6} />
      <path d="M-300,610 L2220,610" stroke={lit('#D9A773', 0.35)} strokeWidth={8} />
      <rect x={-300} y={770} width={2520} height={36} fill={shade('#D9A773', 0.25)} stroke={INK} strokeWidth={5} />
      <rect x={-300} y={806} width={2520} height={420} fill="#6F5B4A" />
      <rect x={-300} y={1226} width={2520} height={500} fill="#CFC2AE" />
      <Keyboard id={`${id}-kb`} x={SKB.x} y={SKB.y} s={SKB.s} spaceDown={press} glowSpace={space} />
      {/* network cable in through the left wall -> the TMS unit */}
      <g fill="none" strokeLinecap="round">
        <path d={cubD(STO_NET)} stroke={INK} strokeWidth={13} />
        <path d={cubD(STO_NET)} stroke="#5D6B76" strokeWidth={7} />
      </g>
      {/* TMS unit on its cart (frame left) */}
      <g>
        <rect x={236} y={690} width={180} height={30} fill="#7E8B96" stroke={INK} strokeWidth={5} />
        <rect x={250} y={720} width={14} height={500} fill="#7E8B96" stroke={INK} strokeWidth={4} />
        <rect x={392} y={720} width={14} height={500} fill="#7E8B96" stroke={INK} strokeWidth={4} />
        <rect x={TMS.x} y={TMS.y} width={TMS.w} height={TMS.h} rx={16} fill="#D9DEE2" stroke={INK} strokeWidth={6} />
        <rect x={244} y={432} width={162} height={74} rx={8} fill={K.screenDark} stroke={INK} strokeWidth={4} />
        {tmsLit > 0.01 && <text x={325} y={482} textAnchor="middle" fontFamily={FONT_HEAD} fontWeight={700} fontSize={38} fill={K.saffron} opacity={tmsLit}>FIRE</text>}
        {[0, 1, 2].map((i) => <rect key={i} x={250 + i * 52} y={540} width={40} height={14} rx={6} fill="#B5BEC6" />)}
        <circle cx={392} cy={630} r={16} fill={mix('#6E7C86', K.saffron, tmsLit)} stroke={INK} strokeWidth={4} />
      </g>
      {/* coil holder arm and the coil cable */}
      <g fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path d={`M420,410 L560,70 L${S_HANDLE.x - 6},${S_HANDLE.y - 14}`} stroke={INK} strokeWidth={26} />
        <path d={`M420,410 L560,70 L${S_HANDLE.x - 6},${S_HANDLE.y - 14}`} stroke="#9AA7B1" strokeWidth={14} />
        <circle cx={560} cy={70} r={16} fill="#7E8B96" stroke={INK} strokeWidth={5} />
        <path d={cubD(TMS_CABLE)} stroke={INK} strokeWidth={16} />
        <path d={cubD(TMS_CABLE)} stroke="#2D363D" strokeWidth={10} />
      </g>
      {/* Stocco from behind */}
      <g transform={`translate(0 ${fmt(bob)})`}>
        <Inked w={7}>
          <Capsule id={`${id}-lfa`} a={{x: 632, y: 822}} b={{x: 700, y: 742}} ra={40} rb={34} color={K.stoccoSleeve} />
        </Inked>
        <rect x={918} y={400} width={84} height={110} fill={sk} stroke={INK} strokeWidth={6} />
        <path d="M650,1140 L668,650 Q676,566 770,538 L908,494 Q960,484 1012,494 L1150,538 Q1244,566 1252,650 L1270,1140 Z" fill={`url(#${id}-shirt)`} stroke={INK} strokeWidth={7} strokeLinejoin="round" />
        <path d="M908,494 Q960,520 1012,494" fill="none" stroke={shade(K.stoccoSleeve, 0.35)} strokeWidth={6} strokeLinecap="round" />
        <path d="M960,520 L960,880" stroke={shade(K.stoccoSleeve, 0.25)} strokeWidth={5} opacity={0.5} />
        <Inked w={7}>
          <Capsule id={`${id}-lua`} a={{x: 724, y: 590}} b={{x: 640, y: 822}} ra={52} rb={44} color={K.stoccoSleeve} spec={0.1} />
          <Capsule id={`${id}-rua`} a={{x: 1196, y: 590}} b={S_ELBOW} ra={52} rb={44} color={shade(K.stoccoSleeve, 0.06)} spec={0.1} />
        </Inked>
        <BackHand id={`${id}-bh`} press={press} lift={lift} />
        {/* chair back */}
        <rect x={720} y={880} width={480} height={300} rx={40} fill="#46525C" stroke={INK} strokeWidth={7} />
        <rect x={744} y={900} width={160} height={30} rx={14} fill="#5D6B76" opacity={0.7} />
        {/* ears + noise-cancelling earbuds */}
        {[-1, 1].map((sd) => (
          <g key={sd}>
            <ellipse cx={SHD.x + sd * (SHD.rx - 2)} cy={SHD.y + 30} rx={16} ry={28} fill={shade(sk, 0.08)} stroke={INK} strokeWidth={6} />
            {earGlow > 0.01 && <circle cx={SHD.x + sd * (SHD.rx + 4)} cy={SHD.y + 32} r={26} fill={K.saffron} opacity={0.45 * earGlow} />}
            <circle cx={SHD.x + sd * (SHD.rx + 4)} cy={SHD.y + 32} r={12} fill="#F4F6F8" stroke={INK} strokeWidth={4} />
            <rect x={SHD.x + sd * (SHD.rx + 4) - 4} y={SHD.y + 38} width={8} height={26} rx={4} fill="#F4F6F8" stroke={INK} strokeWidth={3} />
          </g>
        ))}
        <ellipse cx={SHD.x} cy={SHD.y} rx={SHD.rx} ry={SHD.ry} fill={`url(#${id}-head)`} />
        <g clipPath={`url(#${id}-hclip)`}>
          <path d={`M${SHD.x - 130},372 Q${SHD.x},420 ${SHD.x + 130},372 L${SHD.x + 130},430 Q${SHD.x},468 ${SHD.x - 130},430 Z`} fill="#5A3A22" />
          <path d={`M${SHD.x - 140},160 L${SHD.x + 140},160 L${SHD.x + 140},368 Q${SHD.x},404 ${SHD.x - 140},368 Z`} fill={`url(#${id}-cap)`} />
          <path d={`M${SHD.x - 130},362 Q${SHD.x},398 ${SHD.x + 130},362`} fill="none" stroke={shade(K.swimCap, 0.35)} strokeWidth={8} />
          <path d={`M${SHD.x - 70},226 Q${SHD.x - 30},208 ${SHD.x + 10},214`} fill="none" stroke="#FFFFFF" strokeWidth={10} strokeLinecap="round" opacity={0.3} />
          {/* the coil-site mark on the cap: his LEFT hemisphere (frame left from behind) */}
          <g stroke="#FFFFFF" strokeWidth={7} strokeLinecap="round" opacity={0.9}>
            <path d="M884,268 l20,20 M904,268 l-20,20" />
          </g>
        </g>
        <ellipse cx={SHD.x} cy={SHD.y} rx={SHD.rx} ry={SHD.ry} fill="none" stroke={INK} strokeWidth={7} />
        <RoundCoil x={SCOIL.x} y={SCOIL.y} s={SCOIL.s} ang={SCOIL.ang} pulse={coilPulse} />
      </g>
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
  const a = raoRoute().map(Lw);
  const b = extRoute();
  const c = stoRoute().map(Rw).slice(1);
  const pts = [...a, ...b.slice(1), ...c];
  const P = polyOf(pts);
  const tot = P.L[P.L.length - 1];
  const kA = P.L[a.length - 1] / tot; // leaves Rao's room
  const kB = P.L[a.length - 1 + b.length - 1] / tot; // enters Stocco's room
  const kComp = (RAO_COMP_K * P.L[a.length - 1]) / tot;
  return {P, kA, kB, kComp};
})();
/** the exterior network line only */
const EXT = polyOf(extRoute());

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
