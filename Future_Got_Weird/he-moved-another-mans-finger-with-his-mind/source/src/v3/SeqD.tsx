// V3 D. "The failed session" (90.0 -> 101.81 s): the pilot's first session ended early on a network problem, told as
// an action first and as evidence second, then as a character moment between the two researchers.
//
// Beats (times from the measured narration):
//  W1  90.0  the plain game full-frame (contract IN, clock 8.64). The pirate ship launches a rocket; one continuous
//            pull-back off the monitor reveals Rao (crew3, EEG cap) at his desk, the tower, and the network cable that
//            runs behind him along the wall to a wall jack on his left. He concentrates, the cursor climbs to FIRE, he
//            smiles. The FIRE command leaves the tower, rides the cable behind him, and stutters at the jack; the plug
//            works loose and pops out (sparks), tumbles and swings on its cable. Rao's head snaps toward the pop, then
//            the rocket hits the city and he whips back to the screen (startle, hands off the desk), then slumps.
//  LOG 93.8  the evidence: the pilot report's page rises over the (still living) room; a snapshot of the failed screen
//            and the plug + jack fly into its session-log line, which writes itself on the narration
//            ("Session 1 — ended early: network problems"). A push into the broken-plug icon.
//  LABS 97.3 clean graphic match cut (same plug, socket, cable, paper) into the gap between the two 2013 labs; pull out
//            to both researchers. The plug seats; the link lights from Rao's tower to Stocco's TMS machine; both
//            ready lights come on. "Ready to go": Rao rubs his hands, Stocco bounces and limbers up his finger.
//      100.13 "Bad connection": the coupler snaps apart and both halves swing. Rao's game freezes on a spinner: a
//            startled double take, then a slow facepalm. Stocco, who can see nothing, waits, looks left and right,
//            then shrugs with open hands. The camera pushes in on the dangling plug, which carries the cut into 2014.
import React from 'react';
import {clamp, easeIn, easeInOut, easeOut, fmt, lerp} from '../dc/math';
import {lit, shade} from '../dc/color';
import {CamS, FPS, T, TE, pr} from './core2';
import {Cam, Computer, Desk, FONT_HEAD, INK, K, Keyboard, Monitor, Packet, RoundCoil} from '../art/kit';
import {GameScreen} from '../art/game';
import {GameScreenDE} from './gameDE';
import {GAME_FULL} from './contracts';
import {Spinner} from '../art/s2rooms';
import {TmsBox} from '../art/s5parts';
import {EEGCap, Earbuds, RAO, STOCCO, SwimCap} from '../art/people';
import {blinkAt, bump, HEAD_L, kp, ks, kv, Person3, Pt, rigWorld} from './de_cast';
import {Mouth} from './crew3';

// ---------------------------------------------------------------- shared helpers (also used by E)
/** a camera that keeps world point p moving in a straight screen line from s0 to s1 while the zoom goes z0 -> z1 */
export const anchorCam = (p: Pt, s0: Pt, s1: Pt, z0: number, z1: number, u: number): CamS => {
  const z = Math.exp(lerp(Math.log(z0), Math.log(z1), u));
  const sx = lerp(s0.x, s1.x, u), sy = lerp(s0.y, s1.y, u);
  return {x: p.x - (sx - 960) / z, y: p.y - (sy - 540) / z, z};
};
/** world -> screen under a camera */
export const toScr = (c: CamS, p: Pt) => ({x: 960 + (p.x - c.x) * c.z, y: 540 + (p.y - c.y) * c.z});

/** Network plug (male). Local frame: origin at the top of the body, the tip pointing +y (ang 0 = tip down); the cable
 *  joins at (0, -26). Body 52 wide, tip at y 92. */
export const PLUG_JOIN = 26;
export const PLUG_TIP = 92;
export const Plug: React.FC<{x: number; y: number; s?: number; ang?: number}> = ({x, y, s = 1, ang = 0}) => (
  <g transform={`translate(${fmt(x)} ${fmt(y)}) rotate(${fmt(ang)}) scale(${fmt(s)})`}>
    <rect x={-15} y={-28} width={30} height={34} rx={7} fill="#46525C" stroke={INK} strokeWidth={5} />
    <rect x={-26} y={0} width={52} height={74} rx={9} fill="#E4E9ED" stroke={INK} strokeWidth={5} />
    <rect x={-17} y={12} width={18} height={44} rx={5} fill="#C3CCD3" />
    <rect x={-22} y={70} width={44} height={22} rx={4} fill="#D3DAE0" stroke={INK} strokeWidth={4} />
    {[-13, -4, 5, 14].map((cx) => <rect key={cx} x={cx - 2} y={76} width={4} height={12} fill="#D9A21F" />)}
  </g>
);
/** Socket (female coupler). Local frame: origin at the top of the body, the opening at y 80 (ang 0 = opening down);
 *  the cable joins at (0, -20). */
export const SOCK_JOIN = 20;
export const SOCK_LEN = 80;
export const Socket: React.FC<{x: number; y: number; s?: number; ang?: number; lit?: number}> = ({x, y, s = 1, ang = 0, lit: lt = 0}) => (
  <g transform={`translate(${fmt(x)} ${fmt(y)}) rotate(${fmt(ang)}) scale(${fmt(s)})`}>
    <rect x={-15} y={-22} width={30} height={30} rx={7} fill="#46525C" stroke={INK} strokeWidth={5} />
    <rect x={-34} y={0} width={68} height={80} rx={11} fill="#5D6B76" stroke={INK} strokeWidth={5} />
    <rect x={-26} y={8} width={14} height={50} rx={5} fill="#76848F" />
    <rect x={-25} y={64} width={50} height={16} rx={3} fill={INK} />
    <circle cx={16} cy={22} r={7} fill={lt > 0.5 ? '#5BE37D' : '#3A454F'} stroke={INK} strokeWidth={3} />
  </g>
);
/** a cable as a sagging quadratic between two points */
export const Cable: React.FC<{a: Pt; b: Pt; sag?: number; w?: number; color?: string; glow?: number}> = ({a, b, sag = 0, w = 16, color = '#3D4852', glow = 0}) => {
  const c = {x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 + sag};
  const d = `M${fmt(a.x)},${fmt(a.y)} Q${fmt(c.x)},${fmt(c.y)} ${fmt(b.x)},${fmt(b.y)}`;
  return (
    <g fill="none" strokeLinecap="round">
      <path d={d} stroke={INK} strokeWidth={w * 1.55} />
      <path d={d} stroke={color} strokeWidth={w} />
      {glow > 0.001 && <path d={d} stroke={K.saffron} strokeWidth={w * 0.55} opacity={clamp(glow)} />}
    </g>
  );
};
/** (rotate(ang) maps local +y to (-sin ang, cos ang)) -> origin = junction + d along that direction */
export const alongY = (j: Pt, ang: number, d: number) => {
  const r = (ang * Math.PI) / 180;
  return {x: j.x - Math.sin(r) * d, y: j.y + Math.cos(r) * d};
};
/** sparks at a break (k 0..1) */
export const Sparks: React.FC<{x: number; y: number; s: number; k: number}> = ({x, y, s, k}) => {
  if (k <= 0 || k >= 1) return null;
  const r = 30 + 70 * easeOut(k);
  return (
    <g opacity={1 - k} stroke={K.saffron} strokeWidth={9 * s} strokeLinecap="round">
      {[-70, -25, 20, 60, 110, 160].map((a, i) => {
        const rr = (r + (i % 2) * 20) * s;
        const c = Math.cos((a * Math.PI) / 180), sn = Math.sin((a * Math.PI) / 180);
        return <line key={i} x1={fmt(x + c * rr * 0.55)} y1={fmt(y + sn * rr * 0.55)} x2={fmt(x + c * rr)} y2={fmt(y + sn * rr)} />;
      })}
    </g>
  );
};
const polyPt = (pts: Pt[], d: number) => {
  let acc = 0;
  for (let i = 1; i < pts.length; i++) {
    const l = Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
    if (acc + l >= d) {
      const u = (d - acc) / l;
      return {x: lerp(pts[i - 1].x, pts[i].x, u), y: lerp(pts[i - 1].y, pts[i].y, u)};
    }
    acc += l;
  }
  return pts[pts.length - 1];
};
const polyTo = (pts: Pt[], d: number) => {
  const out = [pts[0]];
  let acc = 0;
  for (let i = 1; i < pts.length; i++) {
    const l = Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
    if (acc + l >= d) {
      out.push(polyPt(pts, d));
      return out;
    }
    out.push(pts[i]);
    acc += l;
  }
  return out;
};
const polyLen = (pts: Pt[]) => pts.slice(1).reduce((s, p, i) => s + Math.hypot(p.x - pts[i].x, p.y - pts[i].y), 0);
const pathD = (pts: Pt[]) => `M${pts.map((p) => `${fmt(p.x)},${fmt(p.y)}`).join(' L')}`;

// ---------------------------------------------------------------- timing
const tl = () => {
  const s = T('There’s a detail I love') - 0.5; // 90.0 (sequence start)
  const launch = s + 0.25;
  const cityHit = launch + 3.0; // 93.25
  const fire = s + 1.35; // the cursor reaches FIRE
  const send = fire + 0.06;
  const stall = send + 0.95;
  const brk = stall + 0.42;
  const xf0 = T('Their first session') - 0.25; // the page starts to rise
  const xf1 = xf0 + 0.75;
  const into = TE('network problems') - 0.32; // push into the icon
  const cut = T('Two human brains'); // match cut to the labs
  const join = cut + 0.55;
  const ready = T('ready to go');
  const bad = T('Bad connection');
  const push = bad + 1.02; // push into Stocco's TMS machine
  const end = T('A year later') - 0.55; // 101.81
  return {s, launch, cityHit, fire, send, stall, brk, xf0, xf1, into, cut, join, ready, bad, push, end};
};
type TL = ReturnType<typeof tl>;

// ---------------------------------------------------------------- W1: game -> Rao's room -> the wall jack
// World = screen space of GAME_FULL (the game fills 0..1920 x -60..1140).
const BEZ = {x0: -80, y0: -140, x1: 2000, y1: 1240};
const DESK_Y = 1560; // monitor foot
const TOWER = {x: 2330, y: DESK_Y - 10, s: 3};
const PORT = {x: 2540, y: 1290};
const RAO1 = {x: -2250, y: 2700, s: 7};
const CS1 = 2.2; // plug / socket scale in W1
const JACK = {x: -3330, y: 720}; // the socket's opening
const WALL_Y = 1060; // the cable's run along the wall (behind the desk)
const CLIP = {x: JACK.x + 210, y: WALL_Y};
const SOCK_J = {x: JACK.x, y: JACK.y - (SOCK_LEN - 9 + SOCK_JOIN) * CS1};
const PLUG_J0 = {x: JACK.x, y: JACK.y + (PLUG_TIP - 9 + PLUG_JOIN) * CS1};
/** the command's route: tower port -> down behind the desk -> along the wall behind Rao -> up into the plug */
const ROUTE: Pt[] = [PORT, {x: 2700, y: 1330}, {x: 2640, y: WALL_Y}, {x: CLIP.x + 40, y: WALL_Y}, CLIP, PLUG_J0];
const ROUTE_L = polyLen(ROUTE);

/** the plug's junction and angle (tip direction) at time t: seated, working loose, then popped and swinging */
const plugW1 = (t: number, M: TL) => {
  if (t < M.brk) {
    const loose = pr(t * FPS, M.stall, M.brk, (x) => x);
    const jit = t > M.stall ? Math.sin(t * 70) * 3 * loose : 0;
    return {j: {x: PLUG_J0.x + jit, y: PLUG_J0.y + 22 * loose * loose}, ang: 180 + jit * 0.8, k: 0};
  }
  const dt = t - M.brk;
  const L0 = Math.hypot(PLUG_J0.x - CLIP.x, PLUG_J0.y + 22 - CLIP.y);
  const L = lerp(L0, 360, easeOut(clamp(dt / 0.28)));
  const th0 = Math.atan2(PLUG_J0.x - CLIP.x, PLUG_J0.y + 22 - CLIP.y); // up-left of the clip
  const th = th0 * Math.exp(-dt * 1.7) * Math.cos(dt * 5.6);
  const j = {x: CLIP.x + Math.sin(th) * L, y: CLIP.y + Math.cos(th) * L};
  const hang = (-th * 180) / Math.PI;
  const ang = lerp(180, hang, easeOut(clamp(dt / 0.32)));
  return {j, ang, k: 1};
};

const camW1 = (t: number, M: TL): CamS => {
  const G = {x: 960, y: 540};
  const end: CamS = {x: -660, y: 880, z: 0.3};
  const sEnd = toScr(end, G);
  if (t < M.s + 0.28) return {x: 960, y: 540, z: 1};
  if (t < M.s + 1.75) {
    const u = clamp((t - M.s - 0.28) / 1.47);
    return anchorCam(G, G, sEnd, 1, end.z, u * u * (3 - 2 * u) * 0.55 + easeOut(u) * 0.45);
  }
  // a slow drift toward Rao while the failure plays out (it continues under the page)
  const u = easeInOut(clamp((t - M.s - 1.75) / (M.xf1 + 0.5 - M.s - 1.75)));
  return anchorCam(G, sEnd, {x: sEnd.x + 50, y: sEnd.y + 8}, end.z, end.z * 1.06, u);
};

/** Rao's performance in W1 */
const raoW1 = (t: number, M: TL) => {
  const lookX = kv(t, [[M.s, 0.9], [M.brk + 0.05, 0.9], [M.brk + 0.16, -1, easeOut], [M.cityHit + 0.02, -1], [M.cityHit + 0.12, 0.95, easeOut]]);
  const lookY = kv(t, [[M.s, 0.15], [M.brk + 0.05, 0.15], [M.brk + 0.16, 0.5], [M.cityHit + 0.02, 0.5], [M.cityHit + 0.12, 0.1], [M.cityHit + 1.0, 0.35]]);
  const lean = kv(t, [[M.s, 1.5], [M.brk + 0.04, 1.5], [M.brk + 0.22, -4, easeOut], [M.cityHit + 0.02, -4], [M.cityHit + 0.16, 4.5, easeOut], [M.cityHit + 0.5, 2.5], [M.cityHit + 1.2, -0.5]]);
  const tilt = kv(t, [[M.s, 0], [M.s + 0.9, -3], [M.brk + 0.04, -3], [M.brk + 0.22, -8, easeOut], [M.cityHit + 0.02, -8], [M.cityHit + 0.16, 3, easeOut], [M.cityHit + 1.1, 7]]);
  const brows = kv(t, [[M.s, 0], [M.s + 0.7, -0.45], [M.fire, -0.45], [M.fire + 0.12, 0.3], [M.brk, 0.25], [M.brk + 0.12, 0.6], [M.cityHit, 0.5], [M.cityHit + 0.1, 0.9], [M.cityHit + 0.5, 0.45], [M.cityHit + 1.2, -0.35]]);
  const mouth: Mouth = t < M.s + 0.7 ? 'smile' : t < M.fire + 0.05 ? 'hmm' : t < M.brk + 0.08 ? 'smile' : t < M.cityHit + 0.55 ? 'o' : 'frown';
  const capGlow = pr(t * FPS, M.s + 0.5, M.s + 0.8) * (1 - pr(t * FPS, M.fire + 0.1, M.fire + 0.5));
  const st = bump(t, M.cityHit + 0.06, M.cityHit + 0.95, 0.18, 0.5);
  const hl = kp(t, [[M.s, {x: -2780, y: 1545}], [M.cityHit + 0.06, {x: -2780, y: 1545}], [M.cityHit + 0.2, {x: -2860, y: 1330}, 40, easeOut], [M.cityHit + 0.55, {x: -2850, y: 1350}], [M.cityHit + 1.05, {x: -2780, y: 1545}, -30]]);
  const hr = kp(t, [[M.s, {x: -1720, y: 1545}], [M.cityHit + 0.08, {x: -1720, y: 1545}], [M.cityHit + 0.22, {x: -1600, y: 1320}, -40, easeOut], [M.cityHit + 0.55, {x: -1620, y: 1340}], [M.cityHit + 1.1, {x: -1720, y: 1545}, 30]]);
  const sh = {curl: lerp(0.22, 0.04, st), spread: lerp(0.35, 0.9, st)};
  return {pose: {lookX, lookY, lean, tilt, brows, mouth, blink: blinkAt(t, [M.cityHit + 0.04, M.s + 1.9])}, hl, hr, sl: sh, sr: sh, capGlow};
};

const W1: React.FC<{f: number}> = ({f}) => {
  const M = tl();
  const t = f / FPS;
  const go = 8.64 - M.s; // the game's clock continues C's (C ends at 90.0 s with GameScreen t = 8.64)
  const cam = camW1(t, M);
  const events = [{kind: 'rocket' as const, t0: M.launch + go, dur: M.cityHit - M.launch}];
  const cursor = pr(f, M.s + 0.55, M.fire, easeInOut) * (1 - pr(f, M.brk + 0.1, M.brk + 0.6));
  const slide = pr(f, M.s + 0.35, M.s + 0.7);
  const hit = t >= M.cityHit;
  // the command on the cable
  const sendK = clamp((t - M.send) / (M.stall - M.send));
  const pd = (1 - Math.pow(1 - sendK, 2.2)) * (ROUTE_L - 60);
  const pk = polyPt(ROUTE, pd);
  const pVis = t >= M.send && t < M.brk + 0.03;
  const stutter = t > M.stall && t < M.brk ? Math.sin(t * 55) * 22 * clamp((t - M.stall) / 0.2) : 0;
  const pl = plugW1(t, M);
  const bk = t - M.brk;
  const halves = bk > 0 && bk < 0.8 ? [-1, 1].map((sd) => {
    const x = pk.x + sd * (40 + 300 * bk);
    const y = pk.y - 150 * bk + 1700 * bk * bk;
    return (
      <g key={sd} transform={`translate(${fmt(x)} ${fmt(y)}) rotate(${fmt(sd * 80 * bk)}) scale(1.4)`} opacity={clamp(1 - bk / 0.8)}>
        <path d={sd < 0 ? 'M-78,-40 L0,-40 L-12,-12 L6,6 L-6,40 L-78,40 Z' : 'M0,-40 L78,-40 L78,40 L-6,40 L6,6 L-12,-12 Z'} fill={K.saffron} stroke={INK} strokeWidth={6} strokeLinejoin="round" />
      </g>
    );
  }) : null;
  const R = raoW1(t, M);
  const cableD = (() => {
    // tower -> wall run -> clip, then the last stretch to the plug (it follows the plug after the pop)
    const run = pathD(ROUTE.slice(0, 5));
    const c = {x: (CLIP.x + pl.j.x) / 2 + 30, y: Math.max(CLIP.y, pl.j.y) + 40};
    return `${run} Q${fmt(c.x)},${fmt(c.y)} ${fmt(pl.j.x)},${fmt(pl.j.y)}`;
  })();
  const lineGlow = t > M.send && t < M.stall + 0.25;
  return (
    <g>
      <defs>
        <linearGradient id="vd-wall" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={lit(K.raoWall, 0.3)} />
          <stop offset="1" stopColor={K.raoWall} />
        </linearGradient>
        <clipPath id="vd-gclip">
          <rect x={0} y={-60} width={1920} height={1200} />
        </clipPath>
      </defs>
      <rect x={0} y={0} width={1920} height={1080} fill={K.raoWall} />
      <Cam x={cam.x} y={cam.y} z={cam.z}>
        <rect x={-9000} y={-6000} width={18000} height={DESK_Y + 6000} fill="url(#vd-wall)" />
        <rect x={-9000} y={WALL_Y - 260} width={18000} height={70} fill={K.raoWallDeep} opacity={0.55} />
        {/* a framed plot on the wall between Rao and his monitor */}
        <rect x={-1420} y={-640} width={820} height={600} rx={24} fill="#FFFFFF" stroke={INK} strokeWidth={22} />
        <path d="M-1330,-140 L-1160,-300 L-1010,-210 L-720,-500" fill="none" stroke={K.blue} strokeWidth={34} strokeLinecap="round" strokeLinejoin="round" />
        {/* the wall jack: a wall plate and the socket, its conduit up the wall */}
        <rect x={JACK.x - 150} y={SOCK_J.y - 120} width={300} height={480} rx={34} fill="#C9D3DA" stroke={INK} strokeWidth={14} />
        <Cable a={{x: SOCK_J.x, y: -6000}} b={SOCK_J} w={30} />
        <Socket {...alongY(SOCK_J, 0, SOCK_JOIN * CS1)} s={CS1} lit={t < M.brk ? 1 : 0} />
        {/* the network cable (behind Rao and the monitor) and the command riding it */}
        <g fill="none" strokeLinecap="round" strokeLinejoin="round">
          <path d={cableD} stroke={INK} strokeWidth={50} />
          <path d={cableD} stroke="#3D4852" strokeWidth={34} />
          {lineGlow && <path d={pathD(polyTo(ROUTE, pd))} stroke={K.saffron} strokeWidth={14} opacity={0.85} />}
        </g>
        <Plug {...alongY(pl.j, pl.ang, PLUG_JOIN * CS1)} s={CS1} ang={pl.ang} />
        <Sparks x={JACK.x} y={JACK.y} s={2.6} k={(t - M.brk) / 0.45} />
        {pVis && (
          <g transform={`translate(${fmt(stutter)} 0)`}>
            <Packet x={pk.x} y={pk.y} s={1.6} text="FIRE" k={clamp((t - M.send) / 0.15)} />
          </g>
        )}
        {halves}
        {/* Rao at his desk (chair behind him, the desk over his lap, both hands in front) */}
        <Person3 id="vd-rao1" look={RAO} f={f} x={RAO1.x} y={RAO1.y} scale={RAO1.s} seed={3} perf={R} gear={<EEGCap glow={R.capGlow} />} life={0.45}
          behind={<g>
            <rect x={RAO1.x - 800} y={RAO1.y - 3290} width={1600} height={2520} rx={300} fill="#4A5866" stroke={INK} strokeWidth={26} />
            <rect x={RAO1.x - 620} y={RAO1.y - 3120} width={1240} height={260} rx={120} fill={lit('#4A5866', 0.18)} opacity={0.6} />
          </g>}
          desk={<Desk id="vd-desk1" x0={-9000} x1={9000} y={DESK_Y + 90} d={190} h={3000} />} />
        {/* monitor + stand + tower */}
        <rect x={880} y={BEZ.y1 - 10} width={160} height={DESK_Y - BEZ.y1} fill={K.metal} stroke={INK} strokeWidth={14} />
        <path d={`M640,${DESK_Y} L1280,${DESK_Y} L1220,${DESK_Y - 60} L700,${DESK_Y - 60} Z`} fill={K.metalDeep} stroke={INK} strokeWidth={14} strokeLinejoin="round" />
        <rect x={BEZ.x0} y={BEZ.y0} width={BEZ.x1 - BEZ.x0} height={BEZ.y1 - BEZ.y0} rx={70} fill="#2A3B47" stroke={INK} strokeWidth={18} />
        <path d="M2000,700 C2150,700 2160,1150 2240,1150" fill="none" stroke={INK} strokeWidth={30} strokeLinecap="round" />
        <path d="M2000,700 C2150,700 2160,1150 2240,1150" fill="none" stroke="#3D4852" strokeWidth={18} strokeLinecap="round" />
        <Computer x={TOWER.x} y={TOWER.y} s={TOWER.s} blink={t > M.fire && t < M.send + 0.3 ? 1 : 0} color={K.saffron} />
        <rect x={PORT.x - 24} y={PORT.y - 40} width={44} height={80} rx={8} fill="#56636E" stroke={INK} strokeWidth={8} />
        <g clipPath="url(#vd-gclip)">
          <g transform={GAME_FULL}>
            <GameScreen t={t + go} events={events} cityHitAt={hit ? M.cityHit + go : undefined} />
            <CursorWin cursor={cursor} slide={slide} />
          </g>
        </g>
        {hit && t < M.cityHit + 0.9 && <rect x={-20} y={-80} width={1960} height={1240} fill="none" stroke={K.coral} strokeWidth={36} opacity={1 - (t - M.cityHit) / 0.9} />}
      </Cam>
    </g>
  );
};

/** the BCI cursor window (copied from GameScreen so it can slide in); game-local units */
const CursorWin: React.FC<{cursor: number; slide: number}> = ({cursor, slide}) =>
  slide <= 0.001 ? null : (
    <g transform={`translate(${fmt(-110 * (1 - easeOut(slide)))} 0)`}>
      <rect x={6} y={6} width={92} height={388} rx={10} fill="#1F3442" opacity={0.88} stroke={INK} strokeWidth={3} />
      <circle cx={52} cy={52} r={34} fill={K.blue} stroke="#FFFFFF" strokeWidth={4} opacity={0.95} />
      <text x={52} y={60} textAnchor="middle" fontFamily={FONT_HEAD} fontWeight={700} fontSize={20} fill="#FFFFFF">FIRE</text>
      <line x1={52} y1={92} x2={52} y2={370} stroke="#FFFFFF" strokeWidth={2} strokeDasharray="4 8" opacity={0.35} />
      <rect x={36} y={fmt(354 - clamp(cursor) * 300)} width={32} height={20} rx={4} fill="#FFFFFF" stroke={INK} strokeWidth={2.5} />
      {cursor >= 0.999 && <rect x={22} y={22} width={60} height={60} rx={30} fill="none" stroke={K.saffron} strokeWidth={5} />}
    </g>
  );

// ---------------------------------------------------------------- the session log (screen space)
const PAGE = {x0: 200, y0: 70, x1: 1720};
const THUMB = {x: 250, y: 400, w: 336, h: 210};
const ICON = {x: 1450, y: 425};
const IS = 1.1; // plug scale in the icon
/** separation (plug units) of the broken plug and socket, in the icon and in the labs at the match */
const GAPU = 70;
const iconPlugJ = {x: ICON.x - (PLUG_TIP - 9 + PLUG_JOIN + GAPU / 2) * IS, y: ICON.y};
const iconSockJ = {x: ICON.x + (SOCK_LEN - 9 + SOCK_JOIN + GAPU / 2) * IS, y: ICON.y};
const LINE1 = {x: 640, y: 480};
const LINE2 = {x: 640, y: 592};
const LOG_ZEND = 4.4;

const Typed: React.FC<{x: number; y: number; text: string; size: number; k: number; weight?: number; id: string}> = ({x, y, text, size, k, weight = 600, id}) => {
  if (k <= 0.001) return null;
  const w = text.length * size * 0.56 + 20;
  return (
    <g>
      <defs>
        <clipPath id={id}>
          <rect x={x - 6} y={y - size * 1.1} width={fmt(w * clamp(k))} height={size * 1.5} />
        </clipPath>
      </defs>
      <text x={x} y={y} fontFamily={FONT_HEAD} fontWeight={weight} fontSize={size} fill={INK} clipPath={`url(#${id})`}>{text}</text>
    </g>
  );
};

const LogPage: React.FC<{f: number}> = ({f}) => {
  const M = tl();
  const rise = easeOut(pr(f, M.xf0 + 0.05, M.xf1, (x) => x));
  const dy = 1150 * (1 - rise);
  const kS1 = pr(f, T('first session') - 0.05, T('session ended') + 0.05);
  const kL2a = pr(f, T('ended early'), TE('ended early') + 0.05, (x) => x);
  const kL2b = pr(f, T('network problems') - 0.05, TE('network problems') - 0.2, (x) => x);
  const hl = pr(f, T('network problems') + 0.1, TE('network problems') - 0.05);
  return (
    <g transform={`translate(0 ${fmt(dy)})`}>
      <rect x={PAGE.x0 + 16} y={PAGE.y0 + 20} width={PAGE.x1 - PAGE.x0} height={1300} rx={10} fill={INK} opacity={0.22} />
      <rect x={PAGE.x0} y={PAGE.y0} width={PAGE.x1 - PAGE.x0} height={1300} rx={10} fill={K.paper} stroke={INK} strokeWidth={6} />
      <text x={250} y={170} fontFamily={FONT_HEAD} fontWeight={700} fontSize={58} fill={INK}>Pilot report · 2013</text>
      <rect x={1290} y={128} width={360} height={16} rx={8} fill="#E2DACB" />
      <text x={250} y={262} fontFamily={FONT_HEAD} fontWeight={700} fontSize={40} fill={INK} opacity={0.8}>Session log</text>
      <rect x={250} y={284} width={1420} height={5} fill={INK} opacity={0.75} />
      <rect x={THUMB.x - 14} y={THUMB.y - 14} width={THUMB.w + 28} height={THUMB.h + 28} rx={12} fill="#EFE5CC" />
      <Typed id={`vd-l1-${f}`} x={LINE1.x} y={LINE1.y} text="Session 1 —" size={54} weight={700} k={kS1} />
      <defs>
        <clipPath id={`vd-hl-${f}`}>
          <rect x={LINE2.x} y={LINE2.y - 60} width={fmt(lerp(250, 760, hl))} height={90} />
        </clipPath>
        <clipPath id={`vd-l2-${f}`}>
          <rect x={LINE2.x - 6} y={LINE2.y - 60} width={fmt(lerp(0, 290, kL2a) + 470 * kL2b)} height={90} />
        </clipPath>
      </defs>
      {hl > 0.001 && (
        <text x={LINE2.x} y={LINE2.y} fontFamily={FONT_HEAD} fontWeight={700} fontSize={46} clipPath={`url(#vd-hl-${f})`}>
          <tspan fill="none">{'ended early: '}</tspan>
          <tspan fill={K.saffron} stroke={K.saffron} strokeWidth={30} strokeLinejoin="round">network problems</tspan>
        </text>
      )}
      <text x={LINE2.x} y={LINE2.y} fontFamily={FONT_HEAD} fontWeight={600} fontSize={46} fill={INK} clipPath={`url(#vd-l2-${f})`}>
        <tspan>{'ended early: '}</tspan>
        <tspan fontWeight={700}>network problems</tspan>
      </text>
      <rect x={250} y={670} width={1420} height={3} fill={INK} opacity={0.22} />
      <text x={640} y={745} fontFamily={FONT_HEAD} fontWeight={700} fontSize={44} fill={INK} opacity={0.4}>Session 2</text>
      <rect x={900} y={721} width={520} height={20} rx={10} fill="#E2DACB" />
      <rect x={250} y={800} width={1420} height={3} fill={INK} opacity={0.22} />
      {[0, 1].map((i) => <rect key={i} x={250} y={850 + i * 48} width={[1300, 980][i]} height={20} rx={10} fill="#E9E2D4" />)}
    </g>
  );
};

/** the snapshot of the failed game: the W1 screen rect flies into the log thumbnail */
const Snapshot: React.FC<{f: number}> = ({f}) => {
  const M = tl();
  const k = easeInOut(pr(f, M.xf0, M.xf1, (x) => x));
  const cam = camW1(M.xf0, M);
  const a = toScr(cam, {x: 0, y: -60});
  const w0 = 1920 * cam.z;
  const x = lerp(a.x, THUMB.x, k), y = lerp(a.y, THUMB.y, k), w = lerp(w0, THUMB.w, k);
  const h = w * (400 / 640);
  const rot = -3 * Math.sin(k * Math.PI) - 1.2 * k;
  const border = 14 * pr(f, M.xf0, M.xf0 + 0.15);
  const go = 8.64 - M.s;
  return (
    <g transform={`rotate(${fmt(rot)} ${fmt(x + w / 2)} ${fmt(y + h / 2)})`}>
      <rect x={x - border + 8} y={y - border + 12} width={w + 2 * border} height={h + 2 * border} rx={10} fill={INK} opacity={0.25 * clamp(k * 3)} />
      <rect x={x - border} y={y - border} width={w + 2 * border} height={h + 2 * border} rx={10} fill="#FFFFFF" stroke={INK} strokeWidth={5} />
      <defs>
        <clipPath id={`vd-snap-${f}`}>
          <rect x={x} y={y} width={w} height={h} />
        </clipPath>
      </defs>
      <g clipPath={`url(#vd-snap-${f})`}>
        <g transform={`translate(${fmt(x)} ${fmt(y)}) scale(${fmt(w / 640)})`}>
          <GameScreen t={M.cityHit + 0.45 + go} events={[]} cityHitAt={M.cityHit + go} />
          <CursorWin cursor={0} slide={1} />
        </g>
      </g>
      <rect x={x} y={y} width={w} height={h} fill="none" stroke={INK} strokeWidth={4} />
    </g>
  );
};

/** icon cable width so it matches the labs cable at the match cut */
const LS = 0.6; // plug scale in the labs world
const ZM = (LOG_ZEND * IS) / LS; // labs zoom at the match cut
const ICON_W = (16 * ZM) / LOG_ZEND;

/** the plug and the jack fly from the W1 wall into the log icon; their cable stubs grow out as they settle */
const FlyingEnds: React.FC<{f: number}> = ({f}) => {
  const M = tl();
  const k = easeInOut(pr(f, M.xf0 + 0.05, M.xf1 + 0.1, (x) => x));
  const cam = camW1(M.xf0, M);
  const pl = plugW1(M.xf0, M);
  const p0 = toScr(cam, pl.j), s0 = toScr(cam, SOCK_J);
  const sc0 = CS1 * cam.z;
  const pj = {x: lerp(p0.x, iconPlugJ.x, k), y: lerp(p0.y, iconPlugJ.y, k) - 120 * Math.sin(k * Math.PI)};
  const sj = {x: lerp(s0.x, iconSockJ.x, k), y: lerp(s0.y, iconSockJ.y, k) - 160 * Math.sin(k * Math.PI)};
  const sc = lerp(sc0, IS, k);
  const pa = lerp(pl.ang, -90, k), sa = lerp(0, 90, k);
  const stub = easeOut(clamp((k - 0.55) / 0.45));
  return (
    <g>
      {stub > 0 && (
        <g>
          <Cable a={{x: pj.x - 420 * stub, y: pj.y}} b={pj} w={ICON_W} />
          <Cable a={sj} b={{x: sj.x + 420 * stub, y: sj.y}} w={ICON_W} />
        </g>
      )}
      <Plug {...alongY(pj, pa, PLUG_JOIN * sc)} s={sc} ang={pa} />
      <Socket {...alongY(sj, sa, SOCK_JOIN * sc)} s={sc} ang={sa} />
    </g>
  );
};

const camLog = (f: number): CamS => {
  const M = tl();
  const t = f / FPS;
  if (t < M.into) return {x: lerp(960, 990, pr(f, M.xf1, M.into)), y: 540, z: lerp(1, 1.04, pr(f, M.xf1, M.into))};
  const u = easeIn(clamp((t - M.into) / (M.cut - 1 / FPS - M.into)));
  const c0: CamS = {x: 990, y: 540, z: 1.04};
  return anchorCam(ICON, toScr(c0, ICON), {x: 960, y: 540}, 1.04, LOG_ZEND, u * 0.6 + easeInOut(u) * 0.4);
};

const Log: React.FC<{f: number}> = ({f}) => {
  const M = tl();
  const dim = pr(f, M.xf0, M.xf1);
  const cam = camLog(f);
  return (
    <g>
      <W1 f={f} />
      <rect x={0} y={0} width={1920} height={1080} fill={INK} opacity={0.5 * dim} />
      <Cam x={cam.x} y={cam.y} z={cam.z}>
        <LogPage f={f} />
        <Snapshot f={f} />
        <FlyingEnds f={f} />
      </Cam>
    </g>
  );
};

// ---------------------------------------------------------------- LABS: the two 2013 labs (crew3 Rao and Stocco)
const RW = 1150, RWS = 1250, RH = 1080, G2 = 460;
const RA = {x: -G2 / 2 - RW, y: 0};
const SB = {x: G2 / 2, y: 0};
const LC = {x: 0, y: 520}; // the coupler
const PA = {x: -200, y: 520}; // Rao-side wall port
const PB = {x: 200, y: 520}; // Stocco-side wall port
const Z2L = 1920 / (RW + RWS + G2 + 140);
const TWO: CamS = {x: (RWS - RW) / 2, y: 500, z: Z2L};
const plugJ = (sep: number) => ({x: LC.x - (PLUG_TIP - 9 + PLUG_JOIN + sep / 2) * LS, y: LC.y});
const sockJ = (sep: number) => ({x: LC.x + (SOCK_LEN - 9 + SOCK_JOIN + sep / 2) * LS, y: LC.y});
const L_PLUG = Math.abs(plugJ(0).x - PA.x);
const L_SOCK = Math.abs(sockJ(0).x - PB.x);
const HANG_DECAY = 1.55;
const HANG_W = 5.2;
/** the swing angle of the hanging ends after the snap (released nearly horizontal) */
export const dSwing = (t: number) => {
  const dt = Math.max(0, t - T('Bad connection'));
  return (Math.PI / 2) * 0.92 * Math.exp(-dt * HANG_DECAY) * Math.cos(dt * HANG_W);
};
const hang = (anchor: Pt, L: number, side: -1 | 1, t: number) => {
  const th = dSwing(t);
  const j = {x: anchor.x - side * Math.sin(th) * L, y: anchor.y + Math.cos(th) * L};
  return {j, ang: side * ((th * 180) / Math.PI)};
};
/** D's last frame: Stocco's TMS machine (E opens on the 2014 machine at the same place and size) */
const BOX_END = {z: 3.0, screen: {x: 960, y: 560}};

// room-local layout
const R_MON = {x: 430, y: 708, s: 0.62};
const RAO2 = {x: 830, y: 1000, s: 1.5};
const STO2 = {x: 540, y: 1000, s: 1.5};
const S_KB = {x: 300, y: 750, s: 0.7};
const S_COIL = {x: 604, y: 350, s: 0.55, ang: 28};
const S_GRIP = {x: S_COIL.x + Math.cos((S_COIL.ang * Math.PI) / 180) * 262 * S_COIL.s, y: S_COIL.y + Math.sin((S_COIL.ang * Math.PI) / 180) * 262 * S_COIL.s};
const S_TMS = {x: 800, y: 600};
const BOX_C = {x: G2 / 2 + S_TMS.x + 115, y: S_TMS.y + 75};

const raoLabs = (t: number, M: TL) => {
  const r0 = M.ready - 0.12;
  const rub = bump(t, r0, r0 + 1.0, 0.3, 0.35);
  const osc = Math.sin((t - r0) * 26) * 16 * clamp((t - r0 - 0.2) / 0.1) * (1 - clamp((t - r0 - 0.72) / 0.12));
  const head = rigWorld({x: RAO2.x, y: RAO2.y, scale: RAO2.s, lean: 3}, HEAD_L);
  const rest = {l: {x: 660, y: 716}, r: {x: 1000, y: 716}};
  const hl = t < M.bad + 0.3
    ? {x: lerp(rest.l.x, 800, rub), y: lerp(rest.l.y, 655 + osc, rub)}
    : kp(t, [[M.bad + 0.3, rest.l], [M.bad + 0.72, {x: head.x - 22, y: head.y - 34}, -60, easeInOut]]);
  const hr = {x: lerp(rest.r.x, 855, rub), y: lerp(rest.r.y, 655 - osc, rub)};
  const lean = kv(t, [[M.cut, 0], [M.ready + 1.0, 0], [M.ready + 1.5, -2.5], [M.bad + 0.05, -2.5], [M.bad + 0.2, 3, easeOut], [M.bad + 0.75, 3]]);
  const tilt = kv(t, [[M.cut, 0], [M.ready + 1.0, -2], [M.bad + 0.12, -2], [M.bad + 0.25, 2, easeOut], [M.bad + 0.55, 2], [M.bad + 0.9, 9]]);
  const lookX = kv(t, [[M.cut, -0.85], [r0, -0.85], [r0 + 0.15, 0.1], [r0 + 0.8, 0.1], [r0 + 0.95, -0.9]]);
  const brows = kv(t, [[M.cut, 0.15], [r0, 0.15], [r0 + 0.1, 0.45], [r0 + 1.0, 0.4], [r0 + 1.3, -0.35], [M.bad + 0.1, -0.35], [M.bad + 0.2, 0.8, easeOut], [M.bad + 0.6, 0.6], [M.bad + 0.95, -0.3]]);
  const mouth: Mouth = t < r0 ? 'smile' : t < r0 + 1.05 ? 'grin' : t < M.bad + 0.15 ? 'hmm' : t < M.bad + 0.62 ? 'o' : 'frown';
  const eyes = t > M.bad + 0.78 ? 0.05 : blinkAt(t, [M.bad + 0.17, r0 + 1.6]);
  const sh = t < M.bad + 0.3 ? {curl: lerp(0.25, 0.5, rub), spread: lerp(0.35, 0.1, rub)} : ks(t, [[M.bad + 0.3, {curl: 0.25, spread: 0.35}], [M.bad + 0.7, {curl: 0.12, spread: 0.75}]]);
  return {pose: {lookX, lookY: 0.15, lean, tilt, brows, mouth, blink: eyes}, hl, hr, sl: sh, sr: {curl: lerp(0.25, 0.5, rub), spread: 0.25}};
};
const stoLabs = (t: number, M: TL) => {
  const kbHover = {x: S_KB.x + 14, y: 712};
  const shrug = bump(t, M.bad + 0.62, M.end + 1, 0.2, 0.01);
  const wig = t > M.ready + 0.05 && t < M.ready + 0.75 ? 0.5 + 0.5 * Math.sin((t - M.ready) * 22) : 0;
  const hl = {x: lerp(kbHover.x, 340, shrug), y: lerp(kbHover.y, 640, shrug) - 4 * wig};
  const hr = {x: lerp(740, 760, shrug), y: lerp(716, 640, shrug)};
  const lookX = kv(t, [[M.cut, 0], [M.bad + 0.3, 0], [M.bad + 0.42, -0.8, easeOut], [M.bad + 0.6, -0.8], [M.bad + 0.72, 0.8, easeOut], [M.bad + 0.9, 0.8], [M.bad + 1.05, 0.15]]);
  const lookY = kv(t, [[M.cut, 0.05], [M.ready + 0.95, 0.05], [M.ready + 1.1, -0.75], [M.ready + 1.55, -0.75], [M.ready + 1.7, 0.05]]);
  const bob = kv(t, [[M.cut, 0], [M.ready, 0], [M.ready + 0.12, 5, easeOut], [M.ready + 0.32, -1], [M.ready + 0.5, 0]]);
  const brows = kv(t, [[M.cut, 0], [M.join + 0.2, 0], [M.join + 0.35, 0.3], [M.ready + 0.9, 0.2], [M.bad + 0.62, 0], [M.bad + 0.85, 0.75]]);
  const tilt = kv(t, [[M.cut, 0], [M.bad + 0.62, 0], [M.bad + 0.9, -8]]);
  const mouth: Mouth = t < M.join + 0.3 ? 'flat' : t < M.ready + 0.9 ? 'smile' : t < M.bad + 0.66 ? 'flat' : 'hmm';
  const sl = t < M.bad + 0.5 ? {curl: 0.35 + 0.25 * wig, spread: 0.3 + 0.2 * wig} : {curl: lerp(0.35, 0.05, shrug), spread: lerp(0.3, 0.85, shrug)};
  const sr = {curl: lerp(0.25, 0.05, shrug), spread: lerp(0.35, 0.85, shrug)};
  return {pose: {lookX, lookY, bob, brows, tilt, mouth, blink: blinkAt(t, [M.ready + 1.8])}, hl, hr, sl, sr};
};

const RaoLab: React.FC<{f: number; M: TL}> = ({f, M}) => {
  const t = f / FPS;
  const linkOn = t >= M.join + 0.1 && t < M.bad;
  const glowU = pr(f, M.join + 0.05, M.ready - 0.1, (x) => x);
  const spin = pr(f, M.bad + 0.2, M.bad + 0.4);
  const cursor = pr(f, M.ready + 1.1, M.bad - 0.05, (x) => x) * 0.8;
  const capGlow = t > M.join + 0.2 && t < M.bad ? 0.55 + 0.45 * Math.sin((t - M.join) * 7) : 0;
  const R = raoLabs(t, M);
  return (
    <g>
      <defs>
        <linearGradient id="vd-rw" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={lit(K.raoWall, 0.25)} />
          <stop offset="1" stopColor={K.raoWall} />
        </linearGradient>
      </defs>
      <rect x={-40} y={-40} width={RW + 80} height={RH + 80} fill="url(#vd-rw)" />
      <rect x={-40} y={540} width={RW + 80} height={30} fill={K.raoWallDeep} />
      <rect x={940} y={130} width={170} height={130} rx={6} fill="#FFFFFF" stroke={INK} strokeWidth={6} />
      <path d="M962,230 L1000,196 L1030,216 L1086,158" fill="none" stroke={K.blue} strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" />
      {/* network cable: tower -> along the wall behind Rao -> the wall port at the panel edge */}
      <Cable a={{x: 150, y: 560}} b={{x: RW + 60, y: 520}} sag={-40} w={16} glow={linkOn ? clamp(glowU * 3) : 0} />
      <Person3 id="vd-rao2" look={RAO} f={f} x={RAO2.x} y={RAO2.y} scale={RAO2.s} seed={3} perf={R} gear={<EEGCap glow={capGlow} />} life={0.45}
        behind={<rect x={RAO2.x - 150} y={RAO2.y - 470} width={300} height={360} rx={44} fill="#4A5866" stroke={INK} strokeWidth={6} />}
        desk={<g>
          <Desk id="vd-rdesk" x0={-40} x1={RW + 40} y={760} d={130} h={340} />
          <Monitor id="vd-rmon" x={R_MON.x} y={R_MON.y} s={R_MON.s}>
            <GameScreenDE t={t} events={[]} cursor={cursor} dim={0.45 * spin} idp="vd-rg" />
            <Spinner x={320} y={200} r={54} t={t} k={spin} />
          </Monitor>
          <Computer x={120} y={748} s={1.1} blink={linkOn ? 1 : 0} color="#5BE37D" />
        </g>} />
    </g>
  );
};

const StoLab: React.FC<{f: number; M: TL}> = ({f, M}) => {
  const t = f / FPS;
  const linkOn = t >= M.join + 0.1 && t < M.bad;
  const glowU = pr(f, M.join + 0.05, M.ready - 0.1, (x) => x);
  const S = stoLabs(t, M);
  const mark = (
    <g stroke="#FFFFFF" strokeWidth={4} strokeLinecap="round">
      <path d="M 18 -424 l 12 12 M 30 -424 l -12 12" />
    </g>
  );
  return (
    <g>
      <defs>
        <linearGradient id="vd-sw" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={lit(K.stoccoWall, 0.25)} />
          <stop offset="1" stopColor={K.stoccoWall} />
        </linearGradient>
      </defs>
      <rect x={-40} y={-40} width={RW + 80} height={RH + 80} fill="url(#vd-sw)" />
      <rect x={-40} y={540} width={RW + 80} height={30} fill={K.stoccoWallDeep} />
      <rect x={1040} y={150} width={150} height={190} rx={8} fill="#F8EEDC" stroke={INK} strokeWidth={6} />
      <path d="M1065,190 L1165,190 M1065,220 L1145,220 M1065,250 L1170,250 M1065,280 L1130,280" stroke="#C8B79A" strokeWidth={8} strokeLinecap="round" />
      {/* the network cable from the left wall port, behind Stocco, to the TMS machine */}
      <Cable a={{x: -40, y: 520}} b={{x: S_TMS.x + 6, y: S_TMS.y + 60}} sag={90} w={16} glow={linkOn ? clamp(glowU * 3 - 2) : 0} />
      <path d={`M${S_GRIP.x},${S_GRIP.y} C${S_GRIP.x + 60},${S_GRIP.y + 160} ${S_TMS.x + 80},${S_TMS.y - 120} ${S_TMS.x + 150},${S_TMS.y + 4}`} fill="none" stroke={INK} strokeWidth={14} strokeLinecap="round" />
      <path d={`M${S_GRIP.x},${S_GRIP.y} C${S_GRIP.x + 60},${S_GRIP.y + 160} ${S_TMS.x + 80},${S_TMS.y - 120} ${S_TMS.x + 150},${S_TMS.y + 4}`} fill="none" stroke="#3D4852" strokeWidth={7} strokeLinecap="round" />
      <Person3 id="vd-sto2" look={STOCCO} f={f} x={STO2.x} y={STO2.y} scale={STO2.s} seed={5} perf={S} gear={<><SwimCap mark={false} />{mark}<Earbuds /></>} life={0.45}
        behind={<rect x={STO2.x - 150} y={STO2.y - 470} width={300} height={360} rx={44} fill="#6B5A4A" stroke={INK} strokeWidth={6} />}
        desk={<g>
          <Desk id="vd-sdesk" x0={-40} x1={RWS + 40} y={760} d={130} h={340} top="#D9A773" face={shade('#C98F57', 0.02)} />
          <Keyboard id="vd-skb" x={S_KB.x} y={S_KB.y} s={S_KB.s} />
          <TmsBox x={S_TMS.x} y={S_TMS.y} lv={0} />
          <circle cx={S_TMS.x + 206} cy={S_TMS.y + 44} r={10} fill={t >= M.ready - 0.05 && t < M.bad ? '#5BE37D' : '#3A454F'} stroke={INK} strokeWidth={3} />
        </g>}
        front={<g>
          {/* the coil on its stand arm over his left motor cortex (frame-right in this front view) */}
          <path d={`M${S_GRIP.x + 40},-40 L${S_GRIP.x + 60},${S_GRIP.y - 120} L${S_GRIP.x},${S_GRIP.y}`} fill="none" stroke={INK} strokeWidth={24} strokeLinecap="round" strokeLinejoin="round" />
          <path d={`M${S_GRIP.x + 40},-40 L${S_GRIP.x + 60},${S_GRIP.y - 120} L${S_GRIP.x},${S_GRIP.y}`} fill="none" stroke={K.metal} strokeWidth={13} strokeLinecap="round" strokeLinejoin="round" />
          <RoundCoil x={S_COIL.x} y={S_COIL.y} s={S_COIL.s} ang={S_COIL.ang} />
        </g>} />
    </g>
  );
};

const LabPanel: React.FC<{id: string; ox: number; w: number; children: React.ReactNode}> = ({id, ox, w, children}) => (
  <g transform={`translate(${fmt(ox)} 0)`}>
    <defs>
      <clipPath id={`${id}-clip`}>
        <rect x={0} y={0} width={w} height={RH} rx={36} />
      </clipPath>
    </defs>
    <g clipPath={`url(#${id}-clip)`}>{children}</g>
    <rect x={0} y={0} width={w} height={RH} rx={36} fill="none" stroke={INK} strokeWidth={10} />
  </g>
);

const camLabs = (f: number): CamS => {
  const M = tl();
  const t = f / FPS;
  if (t < M.cut + 1.05) {
    const v = clamp((t - M.cut) / 1.05);
    const u = v * v * (3 - 2 * v) * 0.4 + easeOut(v) * 0.6;
    return anchorCam(LC, {x: 960, y: 540}, toScr(TWO, LC), ZM, Z2L, u);
  }
  const c1: CamS = {x: TWO.x, y: 510, z: Z2L * 1.05};
  if (t < M.push) {
    const u = easeInOut(clamp((t - M.cut - 1.05) / (M.bad - 0.1 - M.cut - 1.05)));
    return {x: lerp(TWO.x, c1.x, u), y: lerp(TWO.y, c1.y, u), z: Math.exp(lerp(Math.log(TWO.z), Math.log(c1.z), u))};
  }
  const u = easeInOut(clamp((t - M.push) / (M.end - 1 / FPS - M.push)));
  return anchorCam(BOX_C, toScr(c1, BOX_C), BOX_END.screen, c1.z, BOX_END.z, u);
};

const Labs: React.FC<{f: number}> = ({f}) => {
  const M = tl();
  const t = f / FPS;
  const cam = camLabs(f);
  const sep = GAPU * (1 - easeIn(pr(f, M.cut + 0.2, M.join, (x) => x)));
  const joined = t >= M.join && t < M.bad;
  const glowU = pr(f, M.join + 0.05, M.ready - 0.1, (x) => x);
  const broken = t >= M.bad;
  const dt = t - M.bad;
  let pjj = plugJ(sep), sjj = sockJ(sep), pa = -90, sa = 90;
  if (broken) {
    const h1 = hang(PA, L_PLUG, -1, t);
    const h2 = hang(PB, L_SOCK, 1, t);
    const blend = clamp(dt / 0.12);
    pjj = h1.j;
    sjj = h2.j;
    pa = lerp(-90, h1.ang, blend);
    sa = lerp(90, h2.ang, blend);
  }
  return (
    <g>
      <rect x={0} y={0} width={1920} height={1080} fill={K.paper} />
      <Cam x={cam.x} y={cam.y} z={cam.z}>
        <LabPanel id="vd-pa" ox={RA.x} w={RW}>
          <RaoLab f={f} M={M} />
        </LabPanel>
        <LabPanel id="vd-pb" ox={SB.x} w={RWS}>
          <StoLab f={f} M={M} />
        </LabPanel>
        <rect x={PA.x - 44} y={PA.y - 30} width={44} height={60} rx={8} fill="#56636E" stroke={INK} strokeWidth={5} />
        <rect x={PB.x} y={PB.y - 30} width={44} height={60} rx={8} fill="#56636E" stroke={INK} strokeWidth={5} />
        {!broken ? (
          <g>
            <Cable a={PA} b={plugJ(sep)} sag={0} w={16} glow={joined ? clamp(glowU * 3 - 1) : 0} />
            <Cable a={sockJ(sep)} b={PB} sag={0} w={16} glow={joined ? clamp(glowU * 3 - 1.5) : 0} />
          </g>
        ) : (
          <g>
            <Cable a={PA} b={pjj} w={16} />
            <Cable a={PB} b={sjj} w={16} />
          </g>
        )}
        <Plug {...alongY(pjj, pa, PLUG_JOIN * LS)} s={LS} ang={pa} />
        <Socket {...alongY(sjj, sa, SOCK_JOIN * LS)} s={LS} ang={sa} lit={joined ? 1 : 0} />
        <Sparks x={LC.x} y={LC.y} s={0.5} k={dt / 0.4} />
        <Sparks x={LC.x} y={LC.y} s={0.3} k={(t - M.join) / 0.3} />
      </Cam>
    </g>
  );
};

// ---------------------------------------------------------------- the sequence
export const VD: React.FC<{f: number}> = ({f}) => {
  const M = tl();
  const t = f / FPS;
  if (t < M.xf0) return <W1 f={f} />;
  if (t < M.cut) return <Log f={f} />;
  return <Labs f={f} />;
};

/** D's last frame: Stocco's TMS machine (world box rect) under the final camera; E opens on the 2014 machine there */
export const D_END = {box: {x: SB.x + S_TMS.x, y: S_TMS.y, w: 230, h: 150}, cam: () => camLabs(Math.ceil(tl().end * FPS) - 1)};

/** sound cues (gain in dB) */
export const CUES_VD = (): {t: number; kind: string; gain?: number; dur?: number}[] => {
  const M = tl();
  return [
    {t: M.launch, kind: 'rocket_launch', gain: -9},
    {t: M.fire, kind: 'tick', gain: -10},
    {t: M.send, kind: 'packet_send', gain: -7},
    {t: M.brk, kind: 'error', gain: -6},
    {t: M.cityHit, kind: 'city_hit', gain: -5},
    {t: M.join, kind: 'packet_arrive', gain: -8},
    {t: M.ready - 0.05, kind: 'tick', gain: -14},
    {t: M.bad, kind: 'error', gain: -3},
    {t: M.bad + 0.3, kind: 'spinner', gain: -15, dur: 1.2},
  ];
};
