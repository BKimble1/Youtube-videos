// V2 D. "Failed trial -> next experiment" (90.0 -> 101.81 s): the pilot's first session, which ended early on a
// network problem, told as an action first and as evidence second.
//
// Beats (times from the measured narration):
//  W1  90.0  the plain game full-frame (contract IN). The pirate ship launches a rocket; the camera pulls back off
//            the screen to Rao's monitor and computer while the BCI cursor slides in and climbs to FIRE. The FIRE
//            command leaves the computer along the network cable; the camera tracks it right. It slows and stalls at
//            a cable coupler (spinner), the coupler pops apart and the command breaks up. The rocket hits the city.
//  LOG 93.8  the failed result becomes the evidence: the game screen freezes into a snapshot that flies into the
//            pilot report's session log, the two broken cable ends fly in as its icon, and the line
//            Session 1 — ended early: network problems writes itself in, the last words highlighted. Then a fast push
//            into the broken-cable icon.
//  LABS 97.3 match cut on the plug and socket into the gap between the two 2013 labs; the camera pulls out to both
//            labs (Rao in his EEG cap at the game, Stocco in his swim cap with the coil over his left hemisphere,
//            frame-right in this front view, wired to the TMS machine). The plug meets the socket and the link lights
//            from Rao's computer to the TMS machine; both ends go ready.
//      100.13 "Bad connection": the coupler pops apart, both halves drop and swing, Rao's game turns into a
//            spinner, his smile goes flat (Stocco, who can see nothing, waits). The camera pushes in on the dangling
//            plug, which carries the cut into 2014 (E opens on the same plug going into a new socket).
import React from 'react';
import {clamp, easeIn, easeInOut, easeOut, easeOutBack, fmt, lerp} from '../dc/math';
import {lit} from '../dc/color';
import {CamS, FPS, T, TE, camKeys, pr} from './core2';
import {Cam, Computer, FONT_HEAD, INK, K, Packet} from '../art/kit';
import {GameScreen} from '../art/game';
import {GAME_FULL} from './contracts';
import {Panel, RA, RaoRoom, SB, StoccoRoom, Z2} from '../art/s2rooms';
import {TmsBox} from '../art/s5parts';

// ---------------------------------------------------------------- shared helpers (also used by E)
/** a camera that keeps world point p moving in a straight screen line from s0 to s1 while the zoom goes z0 -> z1 */
export const anchorCam = (p: {x: number; y: number}, s0: {x: number; y: number}, s1: {x: number; y: number}, z0: number, z1: number, u: number): CamS => {
  const z = Math.exp(lerp(Math.log(z0), Math.log(z1), u));
  const sx = lerp(s0.x, s1.x, u), sy = lerp(s0.y, s1.y, u);
  return {x: p.x - (sx - 960) / z, y: p.y - (sy - 540) / z, z};
};
/** world -> screen under a camera */
export const toScr = (c: CamS, p: {x: number; y: number}) => ({x: 960 + (p.x - c.x) * c.z, y: 540 + (p.y - c.y) * c.z});

/** Network plug (male). Local frame: origin at the top of the body, the tip pointing +y (ang 0 = tip down); the cable
 *  joins at (0, -26). Body 52 wide, tip at y 92. */
export const PLUG_JOIN = 26;
export const PLUG_TIP = 92;
export const Plug: React.FC<{x: number; y: number; s?: number; ang?: number; glow?: number}> = ({x, y, s = 1, ang = 0, glow = 0}) => (
  <g transform={`translate(${fmt(x)} ${fmt(y)}) rotate(${fmt(ang)}) scale(${fmt(s)})`}>
    {glow > 0.001 && <rect x={-46} y={-20} width={92} height={130} rx={30} fill={K.saffron} opacity={0.45 * clamp(glow)} />}
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
export const Socket: React.FC<{x: number; y: number; s?: number; ang?: number}> = ({x, y, s = 1, ang = 0}) => (
  <g transform={`translate(${fmt(x)} ${fmt(y)}) rotate(${fmt(ang)}) scale(${fmt(s)})`}>
    <rect x={-15} y={-22} width={30} height={30} rx={7} fill="#46525C" stroke={INK} strokeWidth={5} />
    <rect x={-34} y={0} width={68} height={80} rx={11} fill="#5D6B76" stroke={INK} strokeWidth={5} />
    <rect x={-26} y={8} width={14} height={50} rx={5} fill="#76848F" />
    <rect x={-25} y={64} width={50} height={16} rx={3} fill={INK} />
  </g>
);
/** a cable as a sagging quadratic between two points */
export const Cable: React.FC<{a: {x: number; y: number}; b: {x: number; y: number}; sag?: number; w?: number; color?: string; glow?: number; glowFrom?: number}> = ({a, b, sag = 0, w = 16, color = '#3D4852', glow = 0}) => {
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
/** a quadratic point */
const qpt = (a: {x: number; y: number}, c: {x: number; y: number}, b: {x: number; y: number}, u: number) => ({
  x: (1 - u) * (1 - u) * a.x + 2 * u * (1 - u) * c.x + u * u * b.x,
  y: (1 - u) * (1 - u) * a.y + 2 * u * (1 - u) * c.y + u * u * b.y,
});
/** a small green ready badge (a check in a circle) */
const Ready: React.FC<{x: number; y: number; s: number; k: number}> = ({x, y, s, k}) =>
  k <= 0.001 ? null : (
    <g transform={`translate(${fmt(x)} ${fmt(y)}) scale(${fmt(s * (0.6 + 0.4 * easeOutBack(clamp(k))))})`} opacity={clamp(k * 2)}>
      <circle r={40} fill="#4CB36A" stroke={INK} strokeWidth={7} />
      <path d="M-18,2 L-5,15 L19,-12" fill="none" stroke="#FFFFFF" strokeWidth={10} strokeLinecap="round" strokeLinejoin="round" />
    </g>
  );
/** sparks at a break (k 0..1) */
const Sparks: React.FC<{x: number; y: number; s: number; k: number}> = ({x, y, s, k}) => {
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

// ---------------------------------------------------------------- timing
const tl = () => {
  const s = T('There’s a detail I love') - 0.5; // 90.0 (sequence start)
  const launch = s + 0.25;
  const cityHit = launch + 3.0;
  const fire = s + 1.35; // the cursor reaches FIRE
  const send = fire + 0.06;
  const stall = send + 0.85;
  const brk = stall + 0.45;
  const xf0 = T('Their first session') - 0.25; // snapshot starts
  const xf1 = xf0 + 0.7;
  const into = TE('network problems') + 0.03; // push into the icon
  const cut = T('Two human brains'); // match cut to the labs
  const join = cut + 0.5;
  const ready = T('ready to go');
  const bad = T('Bad connection');
  const end = T('A year later') - 0.55; // 101.81
  return {s, launch, cityHit, fire, send, stall, brk, xf0, xf1, into, cut, join, ready, bad, end};
};

// ---------------------------------------------------------------- W1: game -> monitor -> network cable
// World = screen space of GAME_FULL (the game fills 0..1920 x -60..1140).
const BEZ = {x0: -80, y0: -140, x1: 2000, y1: 1240};
const DESK_Y = 1560;
const TOWER = {x: 2330, y: DESK_Y - 10, s: 3};
const NET_Y = 880;
const PORT = {x: 2540, y: 1290}; // network port on the tower's side
const C1 = {x: 3700, y: NET_Y}; // the coupler on the line
const CS1 = 2.2; // plug scale in W1
const pathPts = (() => {
  // cable: tower port -> up the wall -> along to the right edge
  const pts: {x: number; y: number}[] = [];
  const a = PORT, b = {x: 2900, y: PORT.y}, c = {x: 2780, y: NET_Y}, d = {x: 3080, y: NET_Y};
  for (let i = 0; i <= 24; i++) {
    const u = i / 24;
    const m = (1 - u) ** 3, n = 3 * u * (1 - u) ** 2, o = 3 * u * u * (1 - u), q = u ** 3;
    pts.push({x: m * a.x + n * b.x + o * c.x + q * d.x, y: m * a.y + n * b.y + o * c.y + q * d.y});
  }
  pts.push({x: 5600, y: NET_Y});
  return pts;
})();
const pathLen = pathPts.slice(1).reduce((s, p, i) => s + Math.hypot(p.x - pathPts[i].x, p.y - pathPts[i].y), 0);
const along = (d: number) => {
  let acc = 0;
  for (let i = 1; i < pathPts.length; i++) {
    const l = Math.hypot(pathPts[i].x - pathPts[i - 1].x, pathPts[i].y - pathPts[i - 1].y);
    if (acc + l >= d) {
      const u = (d - acc) / l;
      return {x: lerp(pathPts[i - 1].x, pathPts[i].x, u), y: lerp(pathPts[i - 1].y, pathPts[i].y, u)};
    }
    acc += l;
  }
  return pathPts[pathPts.length - 1];
};
/** the cable's points up to arc length d */
const pathTo = (d: number) => {
  const out = [pathPts[0]];
  let acc = 0;
  for (let i = 1; i < pathPts.length; i++) {
    const l = Math.hypot(pathPts[i].x - pathPts[i - 1].x, pathPts[i].y - pathPts[i - 1].y);
    if (acc + l >= d) {
      out.push(along(d));
      return out;
    }
    out.push(pathPts[i]);
    acc += l;
  }
  return out;
};
// the coupler: plug (left) and socket (right) joined at C1; their junctions on the line
const PJ = C1.x - (PLUG_TIP - 9 + PLUG_JOIN) * CS1; // plug junction x
const SJ = C1.x + (SOCK_LEN - 9 + SOCK_JOIN) * CS1; // socket junction x
const lineLenToPJ = (() => {
  // arc length from the port to the plug junction (the line is straight after x 3080)
  let acc = 0;
  for (let i = 1; i < pathPts.length; i++) {
    const p = pathPts[i - 1], q = pathPts[i];
    if (q.x >= PJ && q.y === NET_Y && p.y === NET_Y) return acc + (PJ - p.x);
    acc += Math.hypot(q.x - p.x, q.y - p.y);
  }
  return acc;
})();

/** where the two broken ends are after the break (k 0..1 droop) */
const brokenEnds = (t: number, M: ReturnType<typeof tl>) => {
  const k = t < M.brk ? 0 : 1 - Math.exp(-(t - M.brk) * 5) * Math.cos((t - M.brk) * 9);
  const pj = {x: PJ - 70 * k, y: NET_Y + 230 * k};
  const sj = {x: SJ + 60 * k, y: NET_Y + 210 * k};
  return {k, pj, sj, pAng: lerp(-90, -28, clamp(k)), sAng: lerp(90, 30, clamp(k))};
};
// (rotate(ang) maps local +y to (-sin ang, cos ang)) -> origin = junction + (JOIN along +y)
const alongY = (j: {x: number; y: number}, ang: number, d: number) => {
  const r = (ang * Math.PI) / 180;
  return {x: j.x - Math.sin(r) * d, y: j.y + Math.cos(r) * d};
};

const camW1 = (t: number, M: ReturnType<typeof tl>): CamS =>
  camKeys(t * FPS, [
    [M.s, {x: 960, y: 540, z: 1}],
    [M.s + 0.3, {x: 960, y: 540, z: 1}],
    [M.send, {x: 1480, y: 650, z: 0.6}],
    [M.stall + 0.1, {x: 2520, y: 780, z: 0.44}],
    [M.cityHit - 0.3, {x: 2440, y: 760, z: 0.45}],
    [M.xf0, {x: 1650, y: 660, z: 0.52}],
  ]);

/** the BCI cursor window (copied from GameScreen so it can slide in); game-local units */
const CursorWin: React.FC<{cursor: number; slide: number}> = ({cursor, slide}) =>
  slide <= 0.001 ? null : (
    <g transform={`translate(${fmt(-110 * (1 - easeOut(slide)))} 0)`}>
      <rect x={6} y={6} width={92} height={388} rx={10} fill="#1F3442" opacity={0.88} stroke={INK} strokeWidth={3} />
      <circle cx={52} cy={52} r={34} fill={K.blue} stroke="#FFFFFF" strokeWidth={4} opacity={0.95} />
      <text x={52} y={60} textAnchor="middle" fontFamily={FONT_HEAD} fontWeight={700} fontSize={20} fill="#FFFFFF">FIRE</text>
      <line x1={52} y1={92} x2={52} y2={370} stroke="#FFFFFF" strokeWidth={2} strokeDasharray="4 8" opacity={0.35} />
      <rect x={36} y={fmt(354 - clamp(cursor) * 300)} width={32} height={20} rx={4} fill="#FFFFFF" stroke={INK} strokeWidth={2.5} />
      {cursor >= 0.999 && <circle cx={52} cy={52} r={44} fill="none" stroke={K.saffron} strokeWidth={6} />}
    </g>
  );

/** the game's own clock continues C's (C ends at 90.0 s with GameScreen t = 8.64), so the ship's bob is continuous */
const GCLK = (M: ReturnType<typeof tl>) => 8.64 - M.s;

const W1: React.FC<{f: number; freeze?: boolean}> = ({f}) => {
  const M = tl();
  const t = f / FPS;
  const go = GCLK(M);
  const cam = camW1(Math.min(t, M.xf0), M);
  const events = [{kind: 'rocket' as const, t0: M.launch, dur: M.cityHit - M.launch}];
  const cursor = pr(f, M.s + 0.55, M.fire, easeInOut) * (1 - pr(f, M.brk + 0.1, M.brk + 0.6));
  const slide = pr(f, M.s + 0.35, M.s + 0.7);
  // the command on the line
  const sendK = clamp((t - M.send) / (M.stall - M.send));
  const stopD = lineLenToPJ - 300;
  const pd = easeOut(sendK) * stopD;
  const pk = along(pd);
  const pVis = t >= M.send && t < M.brk + 0.05;
  const shake = t > M.stall && t < M.brk ? Math.sin(t * 60) * 6 * clamp((t - M.stall) / 0.3) : 0;
  const spinK = t > M.stall && t < M.brk + 0.25 ? pr(f, M.stall, M.stall + 0.12) * (1 - pr(f, M.brk + 0.05, M.brk + 0.25)) : 0;
  const ends = brokenEnds(t, M);
  // packet halves after the break
  const bk = t - M.brk;
  const halves = bk > 0 && bk < 0.9 ? [-1, 1].map((sd) => {
    const x = pk.x + sd * (40 + 260 * bk);
    const y = pk.y - 120 * bk + 1500 * bk * bk;
    return (
      <g key={sd} transform={`translate(${fmt(x)} ${fmt(y)}) rotate(${fmt(sd * 70 * bk)})`} opacity={clamp(1 - bk / 0.9)}>
        <path d={sd < 0 ? 'M-125,-64 L0,-64 L-18,-20 L10,8 L-10,64 L-125,64 Z' : 'M0,-64 L125,-64 L125,64 L-10,64 L10,8 L-18,-20 Z'} fill={K.saffron} stroke={INK} strokeWidth={10} strokeLinejoin="round" />
      </g>
    );
  }) : null;
  const hit = t >= M.cityHit;
  return (
    <g>
      <defs>
        <linearGradient id="vd-wall" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={lit(K.raoWall, 0.3)} />
          <stop offset="1" stopColor={K.raoWall} />
        </linearGradient>
      </defs>
      <rect x={0} y={0} width={1920} height={1080} fill={K.raoWall} />
      <Cam x={cam.x} y={cam.y} z={cam.z}>
        {/* Rao's wall and desk */}
        <rect x={-3000} y={-2200} width={10000} height={DESK_Y + 2200} fill="url(#vd-wall)" />
        <rect x={-3000} y={DESK_Y - 300} width={10000} height={60} fill={K.raoWallDeep} opacity={0.6} />
        <rect x={-3000} y={DESK_Y} width={10000} height={2000} fill={K.desk} stroke={INK} strokeWidth={10} />
        <rect x={-3000} y={DESK_Y} width={10000} height={34} fill={lit(K.desk, 0.3)} />
        {/* the network line along the wall, with its small wall boxes */}
        <rect x={2700} y={NET_Y - 70} width={110} height={140} rx={16} fill="#C9D3DA" stroke={INK} strokeWidth={8} />
        <rect x={4650} y={NET_Y - 70} width={110} height={140} rx={16} fill="#C9D3DA" stroke={INK} strokeWidth={8} />
        {/* the cable: port -> coupler (left half), coupler -> right edge (right half) */}
        {(() => {
          const left = pathPts.filter((p) => p.x < PJ - 2);
          const pts = [...left];
          if (t < M.brk) pts.push({x: PJ, y: NET_Y});
          const dl = `M${pts.map((p) => `${fmt(p.x)},${fmt(p.y)}`).join(' L')}`;
          const lastStraight = {x: 3080, y: NET_Y};
          const lineGlow = t > M.send && t < M.stall + 0.2 ? 1 : 0;
          return (
            <g fill="none" strokeLinecap="round" strokeLinejoin="round">
              {t < M.brk ? (
                <g>
                  <path d={dl} stroke={INK} strokeWidth={50} />
                  <path d={dl} stroke="#3D4852" strokeWidth={34} />
                  <path d={`M${fmt(SJ)},${NET_Y} L5600,${NET_Y}`} stroke={INK} strokeWidth={50} />
                  <path d={`M${fmt(SJ)},${NET_Y} L5600,${NET_Y}`} stroke="#3D4852" strokeWidth={34} />
                </g>
              ) : (
                <g>
                  <path d={`M${left.map((p) => `${fmt(p.x)},${fmt(p.y)}`).join(' L')}`} stroke={INK} strokeWidth={50} />
                  <path d={`M${left.map((p) => `${fmt(p.x)},${fmt(p.y)}`).join(' L')}`} stroke="#3D4852" strokeWidth={34} />
                  <Cable a={lastStraight} b={ends.pj} sag={60 * ends.k} w={34} />
                  <Cable a={{x: 4700, y: NET_Y}} b={ends.sj} sag={60 * ends.k} w={34} />
                  <path d={`M4700,${NET_Y} L5600,${NET_Y}`} stroke={INK} strokeWidth={50} />
                  <path d={`M4700,${NET_Y} L5600,${NET_Y}`} stroke="#3D4852" strokeWidth={34} />
                </g>
              )}
              {lineGlow > 0 && (
                <path d={`M${pathTo(pd).map((p) => `${fmt(p.x)},${fmt(p.y)}`).join(' L')}`} stroke={K.saffron} strokeWidth={14} opacity={0.8} />
              )}
            </g>
          );
        })()}
        {/* the coupler (plug + socket) */}
        {t < M.brk ? (
          <g>
            <Plug {...alongY({x: PJ, y: NET_Y}, -90, PLUG_JOIN * CS1)} s={CS1} ang={-90} />
            <Socket {...alongY({x: SJ, y: NET_Y}, 90, SOCK_JOIN * CS1)} s={CS1} ang={90} />
          </g>
        ) : (
          <g>
            <Plug {...alongY(ends.pj, ends.pAng, PLUG_JOIN * CS1)} s={CS1} ang={ends.pAng} />
            <Socket {...alongY(ends.sj, ends.sAng, SOCK_JOIN * CS1)} s={CS1} ang={ends.sAng} />
          </g>
        )}
        <Sparks x={C1.x} y={NET_Y} s={2.4} k={(t - M.brk) / 0.45} />
        {/* monitor + stand + tower */}
        <rect x={880} y={BEZ.y1 - 10} width={160} height={DESK_Y - BEZ.y1} fill={K.metal} stroke={INK} strokeWidth={14} />
        <path d={`M640,${DESK_Y} L1280,${DESK_Y} L1220,${DESK_Y - 60} L700,${DESK_Y - 60} Z`} fill={K.metalDeep} stroke={INK} strokeWidth={14} strokeLinejoin="round" />
        <rect x={BEZ.x0} y={BEZ.y0} width={BEZ.x1 - BEZ.x0} height={BEZ.y1 - BEZ.y0} rx={70} fill="#2A3B47" stroke={INK} strokeWidth={18} />
        <path d={`M2000,700 C2150,700 2160,1150 2240,1150`} fill="none" stroke={INK} strokeWidth={30} strokeLinecap="round" />
        <path d={`M2000,700 C2150,700 2160,1150 2240,1150`} fill="none" stroke="#3D4852" strokeWidth={18} strokeLinecap="round" />
        <Computer x={TOWER.x} y={TOWER.y} s={TOWER.s} blink={t > M.fire && t < M.send + 0.3 ? 1 : 0} color={K.saffron} />
        <rect x={PORT.x - 24} y={PORT.y - 40} width={44} height={80} rx={8} fill="#56636E" stroke={INK} strokeWidth={8} />
        {/* the game on the monitor (GAME_FULL frame) */}
        <defs>
          <clipPath id="vd-gclip">
            <rect x={0} y={-60} width={1920} height={1200} />
          </clipPath>
        </defs>
        <g clipPath="url(#vd-gclip)">
          <g transform={GAME_FULL}>
            <GameScreen t={t + go} events={events.map((e) => ({...e, t0: e.t0 + go}))} cityHitAt={hit ? M.cityHit + go : undefined} />
            <CursorWin cursor={cursor} slide={slide} />
          </g>
        </g>
        {hit && t < M.cityHit + 0.9 && <rect x={-20} y={-80} width={1960} height={1240} fill="none" stroke={K.coral} strokeWidth={36} opacity={1 - (t - M.cityHit) / 0.9} />}
        {/* the command on its way, the stall, the break */}
        {pVis && (
          <g transform={`translate(${fmt(shake)} 0)`}>
            <Packet x={pk.x} y={pk.y} s={1.6} text="FIRE" k={clamp((t - M.send) / 0.15)} />
          </g>
        )}
        {spinK > 0 && (
          <g opacity={spinK}>
            <circle cx={pk.x} cy={pk.y} r={210} fill="none" stroke={INK} strokeWidth={34} opacity={0.18} />
            {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
              const a = (i / 8) * Math.PI * 2;
              const head = (t * 1.6) % 1;
              const age = ((head * 8 - i) % 8 + 8) % 8;
              return <circle key={i} cx={fmt(pk.x + Math.cos(a - Math.PI / 2) * 210)} cy={fmt(pk.y + Math.sin(a - Math.PI / 2) * 210)} r={30} fill={INK} opacity={fmt(1 - age / 8.5)} />;
            })}
          </g>
        )}
        {halves}
      </Cam>
    </g>
  );
};

// ---------------------------------------------------------------- the session log (screen space)
const PAGE = {x0: 200, y0: 70, x1: 1720};
const THUMB = {x: 250, y: 360, w: 336, h: 210};
const ICON = {x: 1400, y: 415};
const IS = 1.1; // plug scale in the icon (screen px per plug unit at page zoom 1)
/** separation (plug units) of the broken plug and socket, in the icon and in the labs at the match */
const GAPU = 70;
/** the icon's plug / socket origins and junctions (screen, page zoom 1) */
const iconPlugJ = {x: ICON.x - (PLUG_TIP - 9 + PLUG_JOIN + GAPU / 2) * IS, y: ICON.y};
const iconSockJ = {x: ICON.x + (SOCK_LEN - 9 + SOCK_JOIN + GAPU / 2) * IS, y: ICON.y};

const LINE1 = {x: 640, y: 432};
const LINE2 = {x: 640, y: 520};
const Typed: React.FC<{x: number; y: number; text: string; size: number; k: number; weight?: number; id: string; color?: string}> = ({x, y, text, size, k, weight = 600, id, color = INK}) => {
  if (k <= 0.001) return null;
  const w = text.length * size * 0.56 + 20;
  return (
    <g>
      <defs>
        <clipPath id={id}>
          <rect x={x - 6} y={y - size * 1.1} width={fmt(w * clamp(k))} height={size * 1.5} />
        </clipPath>
      </defs>
      <text x={x} y={y} fontFamily={FONT_HEAD} fontWeight={weight} fontSize={size} fill={color} clipPath={`url(#${id})`}>{text}</text>
    </g>
  );
};

const LogPage: React.FC<{f: number}> = ({f}) => {
  const M = tl();
  const t = f / FPS;
  const rise = easeOut(pr(f, M.xf0 + 0.08, M.xf1, (x) => x));
  const dy = 1150 * (1 - rise);
  const kS1 = pr(f, T('first session') - 0.05, T('session ended') + 0.05);
  const kL2a = pr(f, T('ended early'), TE('ended early') + 0.05, (x) => x);
  const kL2b = pr(f, T('network problems') - 0.05, TE('network problems') - 0.15, (x) => x);
  const hl = pr(f, T('network problems') + 0.15, TE('network problems') + 0.05);
  return (
    <g transform={`translate(0 ${fmt(dy)})`}>
      <rect x={PAGE.x0 + 16} y={PAGE.y0 + 20} width={PAGE.x1 - PAGE.x0} height={1300} rx={10} fill={INK} opacity={0.22} />
      <rect x={PAGE.x0} y={PAGE.y0} width={PAGE.x1 - PAGE.x0} height={1300} rx={10} fill="#FFFDF7" stroke={INK} strokeWidth={6} />
      <text x={250} y={170} fontFamily={FONT_HEAD} fontWeight={700} fontSize={58} fill={INK}>Pilot report · 2013</text>
      <rect x={1290} y={128} width={360} height={16} rx={8} fill="#E2DACB" />
      <text x={250} y={268} fontFamily={FONT_HEAD} fontWeight={700} fontSize={40} fill={INK} opacity={0.8}>Session log</text>
      <rect x={250} y={290} width={1420} height={5} fill={INK} opacity={0.75} />
      {/* row 1: snapshot slot, text, icon slot */}
      <rect x={THUMB.x - 14} y={THUMB.y - 14} width={THUMB.w + 28} height={THUMB.h + 28} rx={12} fill="#F1EADB" />
      <Typed id={`vd-l1-${f}`} x={LINE1.x} y={LINE1.y} text="Session 1 —" size={54} weight={700} k={kS1} />
      {/* line 2: the highlight is the same line drawn with a thick saffron stroke on the last two words, swept in */}
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
          <tspan fill="none">{'ended early:\u00A0'}</tspan>
          <tspan fill={K.saffron} stroke={K.saffron} strokeWidth={30} strokeLinejoin="round">network problems</tspan>
        </text>
      )}
      <text x={LINE2.x} y={LINE2.y} fontFamily={FONT_HEAD} fontWeight={600} fontSize={46} fill={INK} clipPath={`url(#vd-l2-${f})`}>
        <tspan>{'ended early:\u00A0'}</tspan>
        <tspan fontWeight={700}>network problems</tspan>
      </text>
      <rect x={250} y={620} width={1420} height={3} fill={INK} opacity={0.22} />
      <text x={640} y={700} fontFamily={FONT_HEAD} fontWeight={700} fontSize={44} fill={INK} opacity={0.4}>Session 2</text>
      <rect x={900} y={676} width={520} height={20} rx={10} fill="#E2DACB" />
      <rect x={250} y={760} width={1420} height={3} fill={INK} opacity={0.22} />
      {[0, 1].map((i) => <rect key={i} x={250} y={810 + i * 48} width={[1300, 980][i]} height={20} rx={10} fill="#E9E2D4" />)}
    </g>
  );
};

/** the snapshot of the failed game: screen rect from the W1 monitor to the log thumbnail */
const Snapshot: React.FC<{f: number}> = ({f}) => {
  const M = tl();
  const t = f / FPS;
  const k = easeInOut(pr(f, M.xf0, M.xf1, (x) => x));
  const cam = camW1(M.xf0, M);
  const a = toScr(cam, {x: 0, y: -60});
  const w0 = 1920 * cam.z;
  const x = lerp(a.x, THUMB.x, k), y = lerp(a.y, THUMB.y, k), w = lerp(w0, THUMB.w, k);
  const h = w * (400 / 640);
  const rot = -3 * Math.sin(k * Math.PI) - 1.2 * k;
  const border = 14 * pr(f, M.xf0, M.xf0 + 0.15);
  const ts = Math.min(t, M.cityHit + 0.45);
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
          <GameScreen t={ts + GCLK(M)} events={[]} cityHitAt={M.cityHit + GCLK(M)} />
          <CursorWin cursor={0} slide={1} />
        </g>
      </g>
      <rect x={x} y={y} width={w} height={h} fill="none" stroke={INK} strokeWidth={4} />
    </g>
  );
};

/** the two broken ends: from the W1 coupler to the log icon (screen space before the page camera) */
const FlyingEnds: React.FC<{f: number}> = ({f}) => {
  const M = tl();
  const k = easeInOut(pr(f, M.xf0 + 0.05, M.xf1 + 0.05, (x) => x));
  const cam = camW1(M.xf0, M);
  const ends = brokenEnds(M.xf0, M);
  const p0 = toScr(cam, ends.pj), s0 = toScr(cam, ends.sj);
  const sc0 = CS1 * cam.z;
  const pj = {x: lerp(p0.x, iconPlugJ.x, k), y: lerp(p0.y, iconPlugJ.y, k)};
  const sj = {x: lerp(s0.x, iconSockJ.x, k), y: lerp(s0.y, iconSockJ.y, k)};
  const sc = lerp(sc0, IS, k);
  const pa = lerp(ends.pAng, -90, k), sa = lerp(ends.sAng, 90, k);
  // stubs: cable from the frame edge in to each end (they grow in as the ends settle)
  const stub = clamp((k - 0.5) / 0.5);
  return (
    <g>
      {stub > 0 && (
        <g opacity={stub}>
          <Cable a={{x: ICON.x - 300, y: pj.y}} b={pj} w={ICON_W} />
          <Cable a={sj} b={{x: ICON.x + 300, y: sj.y}} w={ICON_W} />
        </g>
      )}
      <Plug {...alongY(pj, pa, PLUG_JOIN * sc)} s={sc} ang={pa} />
      <Socket {...alongY(sj, sa, SOCK_JOIN * sc)} s={sc} ang={sa} />
      {k >= 1 && <Sparks x={ICON.x} y={ICON.y} s={0.6} k={((f / FPS - M.xf1 - 0.05) % 1.1) / 0.5} />}
    </g>
  );
};

const camLog = (f: number): CamS => {
  const M = tl();
  const t = f / FPS;
  if (t < M.into) return {x: lerp(960, 1010, pr(f, M.xf1, M.into)), y: 540, z: lerp(1, 1.05, pr(f, M.xf1, M.into))};
  const u = easeInOut(clamp((t - M.into) / (M.cut - 0.04 - M.into)));
  return anchorCam(ICON, {x: 960 + (ICON.x - 1010) * 1.05, y: 540 + (ICON.y - 540) * 1.05}, {x: 960, y: 540}, 1.05, LOG_ZEND, u);
};
const LOG_ZEND = 3.2;
/** icon cable width so it matches the labs cable at the match cut */
const ICON_W = (16 * (LOG_ZEND * IS) / 0.6) / LOG_ZEND;

const Log: React.FC<{f: number}> = ({f}) => {
  const M = tl();
  const t = f / FPS;
  const dim = pr(f, M.xf0, M.xf1);
  const cam = camLog(f);
  return (
    <g>
      <W1 f={Math.min(f, Math.round(M.xf0 * FPS))} />
      <rect x={0} y={0} width={1920} height={1080} fill={INK} opacity={0.55 * dim} />
      <Cam x={cam.x} y={cam.y} z={cam.z}>
        <LogPage f={f} />
        <Snapshot f={f} />
        <FlyingEnds f={f} />
      </Cam>
    </g>
  );
};

// ---------------------------------------------------------------- LABS: the two 2013 labs and the link
const LS = 0.6; // plug scale in the labs world
const LC = {x: 0, y: 520}; // the coupler
const PA = {x: -240, y: 520}; // Rao-side wall port (just outside his panel)
const PB = {x: 240, y: 520}; // Stocco-side wall port
const ZM = (LOG_ZEND * IS) / LS; // labs zoom at the match cut
const STO_BOX = {x: 90, y: 545}; // TMS box in Stocco's panel (panel-local)
const plugJ = (sep: number) => ({x: LC.x - (PLUG_TIP - 9 + PLUG_JOIN + sep / 2) * LS, y: LC.y});
const sockJ = (sep: number) => ({x: LC.x + (SOCK_LEN - 9 + SOCK_JOIN + sep / 2) * LS, y: LC.y});
const L_PLUG = Math.abs(plugJ(0).x - PA.x);
const L_SOCK = Math.abs(sockJ(0).x - PB.x);
export const HANG_DECAY = 1.55;
export const HANG_W = 5.2;
/** a hanging end after the snap: damped pendulum from the joined position */
const hang = (anchor: {x: number; y: number}, L: number, side: -1 | 1, dt: number) => {
  const th0 = (Math.PI / 2) * 0.92; // released nearly horizontal
  const th = th0 * Math.exp(-dt * HANG_DECAY) * Math.cos(dt * HANG_W);
  // side -1: the plug hangs from PA and swings toward +x; side 1 mirrored
  const j = {x: anchor.x - side * Math.sin(th) * L, y: anchor.y + Math.cos(th) * L};
  const ang = side * ((th * 180) / Math.PI); // plug tip points away from the anchor along the cable
  return {j, ang};
};
export const D_PLUG_END = (() => {
  // the plug's resting state and the final camera (E's first frame matches it)
  const z = 3.5;
  return {z, screen: {x: 960, y: 430}};
})();

const camLabs = (f: number): CamS => {
  const M = tl();
  const t = f / FPS;
  const two = {x: 0, y: 470, z: Z2};
  if (t < M.cut + 1.1) {
    const v = clamp((t - M.cut) / 1.1);
    const u = v * v * (3 - 2 * v) * 0.35 + easeOut(v) * 0.65; // gentle start from the matched frame
    return anchorCam(LC, {x: 960, y: 540}, toScr(two, LC), ZM, Z2, u);
  }
  if (t < M.bad + 0.8)
    return camKeys(f, [
      [M.cut + 1.1, two],
      [M.ready + 0.4, {x: 0, y: 470, z: Z2 * 1.03}],
      [M.bad - 0.02, {x: -40, y: 500, z: Z2 * 1.28}],
      [M.bad + 0.8, {x: -60, y: 510, z: Z2 * 1.33}, easeOut],
    ]);
  const c0: CamS = {x: -60, y: 510, z: Z2 * 1.33};
  const rest = hang(PA, L_PLUG, -1, 99);
  const po = alongY(rest.j, rest.ang, PLUG_JOIN * LS);
  const uu = clamp((t - (M.bad + 0.8)) / (M.end - (M.bad + 0.8)));
  const u = uu * uu * (1.6 - 0.6 * uu); // eases in, still moving at the cut (E continues the push)
  return anchorCam(po, toScr(c0, po), D_PLUG_END.screen, c0.z, D_PLUG_END.z, u);
};

const Labs: React.FC<{f: number}> = ({f}) => {
  const M = tl();
  const t = f / FPS;
  const cam = camLabs(f);
  // join: the plug and socket slide together; the link lights from Rao's computer to the TMS machine
  const sep = GAPU * (1 - easeIn(pr(f, M.cut + 0.15, M.join, (x) => x)));
  const joined = t >= M.join && t < M.bad;
  const glowU = pr(f, M.join + 0.05, M.ready - 0.05, (x) => x);
  const ready = pr(f, M.ready - 0.05, M.ready + 0.2);
  const readyOff = pr(f, M.bad, M.bad + 0.15);
  const broken = t >= M.bad;
  const dt = t - M.bad;
  const spin = pr(f, M.bad + 0.3, M.bad + 0.5);
  const flat = t > M.bad + 0.85;
  const capGlow = 0.5 + 0.5 * Math.sin((t - M.cut) * 7) * pr(f, M.cut + 0.3, M.cut + 0.8) * (1 - pr(f, M.bad, M.bad + 0.3));
  // handshake: a small blip waits at the coupler just before the drop
  const blip = t > M.ready + 0.5 && t < M.bad ? (t - (M.ready + 0.5)) / 0.7 : -1;
  // ends
  let pjj = plugJ(sep), sjj = sockJ(sep), pa = -90, sa = 90;
  if (broken) {
    const h1 = hang(PA, L_PLUG, -1, dt);
    const h2 = hang(PB, L_SOCK, 1, dt);
    const blend = clamp(dt / 0.12);
    pjj = h1.j;
    sjj = h2.j;
    pa = lerp(-90, h1.ang, blend);
    sa = lerp(90, h2.ang, blend);
  }
  const rao = RA, sto = SB;
  const linkCol = '#3D4852';
  const lp = (u: number) => qpt(PA, {x: (PA.x + plugJ(0).x) / 2, y: LC.y + 10}, plugJ(0), u);
  return (
    <g>
      <rect x={0} y={0} width={1920} height={1080} fill={K.paper} />
      <Cam x={cam.x} y={cam.y} z={cam.z}>
        <Panel id="vd-pa" ox={rao.x} oy={rao.y}>
          <RaoRoom f={f} events={[]} gameDim={0.45 * spin} spin={spin} capGlow={capGlow * (1 - pr(f, M.bad, M.bad + 0.3))}
            face={{lookX: 0.85, lookY: 0.15, mouth: flat ? 'flat' : 'smile', brows: flat ? -0.2 : 0.25}} />
          {/* the network cable from Rao's computer to his wall port */}
          <Cable a={{x: 1640, y: 470}} b={{x: 1940, y: 520}} sag={40} w={16} glow={joined ? clamp(glowU * 3) : 0} />
          <Ready x={1420} y={300} s={1} k={ready * (1 - readyOff)} />
        </Panel>
        <Panel id="vd-pb" ox={sto.x} oy={sto.y}>
          <StoccoRoom f={f} coil={1} face={{mouth: 'flat', lookX: 0, lookY: 0.05}} />
          {/* TMS machine on the desk, wired to the coil (up the wall, along the ceiling, down the stand) */}
          <path d={`M${STO_BOX.x + 190},${STO_BOX.y + 4} C${STO_BOX.x + 220},300 ${STO_BOX.x + 240},120 ${STO_BOX.x + 260},-40`} fill="none" stroke={INK} strokeWidth={16} strokeLinecap="round" />
          <path d={`M${STO_BOX.x + 190},${STO_BOX.y + 4} C${STO_BOX.x + 220},300 ${STO_BOX.x + 240},120 ${STO_BOX.x + 260},-40`} fill="none" stroke="#3D4852" strokeWidth={8} strokeLinecap="round" />
          <TmsBox x={STO_BOX.x} y={STO_BOX.y} lv={joined && glowU > 0.95 ? 0.35 : 0} />
          <Cable a={{x: -20, y: 520}} b={{x: STO_BOX.x + 4, y: STO_BOX.y + 70}} sag={30} w={16} glow={joined ? clamp(glowU * 3 - 2) : 0} />
          <Ready x={STO_BOX.x + 115} y={STO_BOX.y - 70} s={1} k={ready * (1 - readyOff)} />
        </Panel>
        {/* wall ports */}
        <rect x={PA.x - 44} y={PA.y - 30} width={44} height={60} rx={8} fill="#56636E" stroke={INK} strokeWidth={5} />
        <rect x={PB.x} y={PB.y - 30} width={44} height={60} rx={8} fill="#56636E" stroke={INK} strokeWidth={5} />
        {/* the link */}
        {!broken ? (
          <g>
            <Cable a={PA} b={plugJ(sep)} sag={8} w={16} glow={joined ? clamp(glowU * 3 - 1) : 0} />
            <Cable a={sockJ(sep)} b={PB} sag={8} w={16} glow={joined ? clamp(glowU * 3 - 1.5) : 0} />
          </g>
        ) : (
          <g>
            <Cable a={PA} b={pjj} sag={0} w={16} />
            <Cable a={PB} b={sjj} sag={0} w={16} />
          </g>
        )}
        <Plug {...alongY(pjj, pa, PLUG_JOIN * LS)} s={LS} ang={pa} />
        <Socket {...alongY(sjj, sa, SOCK_JOIN * LS)} s={LS} ang={sa} />
        {blip >= 0 && blip < 1.4 && (() => {
          const p = lp(clamp(blip));
          return <circle cx={p.x} cy={p.y - 2} r={9} fill={K.saffron} stroke={INK} strokeWidth={3} opacity={blip > 1 ? 1 - (blip - 1) / 0.4 : 1} />;
        })()}
        <Sparks x={LC.x} y={LC.y} s={0.5} k={dt / 0.4} />
        {/* the sparks of the join */}
        <Sparks x={LC.x} y={LC.y} s={0.35} k={(t - M.join) / 0.3} />
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

/** the hanging plug's scale and cable length (E continues its sway) */
export const D_PLUG = {LS, L: L_PLUG, PA};
/** the plug's resting pose at the end of D (E's first frame continues it) */
export const dPlugEnd = () => {
  const M = tl();
  const h = hang(PA, L_PLUG, -1, M.end - M.bad);
  return {ang: h.ang, s: LS};
};

/** sound cues (gain in dB) */
export const CUES_VD = (): {t: number; kind: string; gain?: number; dur?: number}[] => {
  const M = tl();
  return [
    {t: M.launch, kind: 'rocket_launch', gain: -9},
    {t: M.fire, kind: 'tick', gain: -10},
    {t: M.send, kind: 'packet_send', gain: -7},
    {t: M.stall, kind: 'spinner', gain: -11, dur: M.brk - M.stall},
    {t: M.brk, kind: 'error', gain: -5},
    {t: M.cityHit, kind: 'city_hit', gain: -5},
    {t: M.join, kind: 'packet_arrive', gain: -8},
    {t: M.ready - 0.05, kind: 'pop', gain: -11},
    {t: M.bad, kind: 'error', gain: -3},
    {t: M.bad + 0.3, kind: 'spinner', gain: -14, dur: 1.2},
  ];
};
