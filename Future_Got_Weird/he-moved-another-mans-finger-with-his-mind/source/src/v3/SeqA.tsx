// V3 A (0 -> 19.54 s): the opening.
//  0.00  DIPTYCH (frame 0): Rao's lab frame-left (EEG cap lit, the rocket on his screen), Stocco's frame-right (his
//        right hand over the space bar), joined by the one lit route along the real equipment: cap -> cable ->
//        computer -> network (across the gap between the panels) -> TMS -> coil; the command is at the coil.
//  0.03  the coil clicks; the stimulation runs down his right arm; the wrist is yanked up, drops, the finger hits the
//        space bar (0.38) and releases; the cannon fires on Rao's screen the next frame; the rocket bursts (0.73).
//        Rao grins; Stocco looks down at the hand that just moved.
//  3.20  "Watch the hand on the left": the gutter slides right, the left camera settles on Rao's right hand, flat
//        and still on the desk; "That's the guy playing": tilt up to his face, cap and screen (a new rocket).
//  6.00  "The finger on the right just fired his cannon": both labs wide; a new command runs the whole route:
//        cap -> computer -> wall -> across -> TMS -> coil -> arm -> finger (contact on "fired") -> the cannon.
//  9.10  "a man across campus": the two panels ARE two lab windows; they shrink into the windows of two different
//        buildings and the cable between them straightens into the network line down one facade, under the lawn
//        and up the other ("who can't even see the game": push toward Stocco's window: no screen).
// 13.17  "In 2013 ... University of Washington": crane up and out over the campus (one command runs between them);
// 16.82  "split one video game between two buildings": the screen flies to Rao's window, the keyboard to Stocco's;
//        the camera swoops toward Rao's window (B continues).
import React from 'react';
import {clamp, easeIn, easeInOut, easeOut, fmt, lerp} from '../dc/math';
import {GEvent, GameScreen} from '../art/game';
import {INK, K, Keyboard, Tag} from '../art/kit';
import {FPS, T, sp} from './core2';
import {
  Campus, camAt, camL, camPath, CamS, camR, camT, Lw, lin1, MonitorV2, Near, RAO_HEAD, RAO_P, RAO_ROUTE, RaoRoom,
  RMON, ROUTE, Rw, shotPos, STO_HEAD, STO_KEY, STO_P, STO_ROUTE, StoccoRoom, W0, WL, WR,
} from './abworld';
import {Diptych, dipRects, Panel, r2s} from './abdip';
import {H_HOVER, HPose, KEY, mixH, tmsPress} from './abhand';
import {Pose} from './crew3';

// ---------------------------------------------------------------- timing (all from the measured words)
/** command 1 is already at the coil on frame 0: the coil clicks (T_CLICK), the stimulation runs down his arm, and
 *  the wrist jerk starts after TP1 (contact ~0.75 s); the cannon fires on the next frame */
export const T_CLICK = 2 / FPS;
export const TP1 = 0.4;
/** command 2: leaves Rao's cap on "The finger", so the press lands on "fired" */
const C2 = () => {
  const tp = T('fired') - 0.35;
  return {cap: T('The finger on the right') + 0.04, comp: tp - 0.52, wall: tp - 0.36, enter: tp - 0.2, coil: tp, tp};
};
const T_SLIDE1 = () => T('Watch the hand') - 0.3;
const T_UP = () => T('That’s the guy') - 0.1;
const T_WIDE2 = () => T('The finger on the right') - 0.45;
const T_MERGE0 = () => T('It belongs to') + 0.02;
const T_MERGE1 = () => T('across campus') + 0.75;
const T_STO = () => T('who can’t') - 0.1;
const T_CRANE = () => T('In 2013') - 0.5;
const T_SPLIT = () => T('split one video game');

/** the game on Rao's monitor (film clock): rocket 1 is shot on frame 1's press; rocket 2 on "fired" */
export const EV_A = (): GEvent[] => {
  const p1 = tmsPress(0, TP1).tc;
  const p2 = tmsPress(0, C2().tp).tc;
  return [
    {kind: 'rocket', t0: p1 + 1 / FPS + 0.32 - 0.62 * 3.4, dur: 3.4, fire: p1 + 1 / FPS},
    {kind: 'plane', t0: 2.2, dur: 2.6},
    {kind: 'rocket', t0: T('That’s the guy') - 0.4, dur: 3.4, fire: p2 + 1 / FPS},
  ];
};

// ---------------------------------------------------------------- the diptych cameras (room-local cameras per panel)
export type PK = {gx: number; L: CamS; R: CamS};
export const P0_DIP: PK = {gx: 840, L: {x: 840, y: 505, z: 0.98}, R: {x: 818, y: 520, z: 1.24}};
const keysD = (t: number, ks: [number, PK, ((x: number) => number)?][]): PK => {
  if (t <= ks[0][0]) return ks[0][1];
  for (let i = 0; i < ks.length - 1; i++) {
    const [a, A] = ks[i];
    const [b, B, e] = ks[i + 1];
    if (t <= b) {
      const u = (e ?? easeInOut)(clamp((t - a) / (b - a)));
      const cl = (p: CamS, q: CamS): CamS => ({x: lerp(p.x, q.x, u), y: lerp(p.y, q.y, u), z: Math.exp(lerp(Math.log(p.z), Math.log(q.z), u))});
      return {gx: lerp(A.gx, B.gx, u), L: cl(A.L, B.L), R: cl(A.R, B.R)};
    }
  }
  return ks[ks.length - 1][1];
};
const dipCam = (t: number): PK => {
  const c2 = C2();
  return keysD(t, [
    [0, P0_DIP],
    [0.04, P0_DIP],
    // follow the stimulation down his arm into the hand; Rao's screen stays in view for the shot
    [0.44, {gx: 700, L: {x: 990, y: 560, z: 1.05}, R: {x: 676, y: 690, z: 2.3}}],
    [0.98, {gx: 694, L: {x: 996, y: 562, z: 1.07}, R: {x: 672, y: 694, z: 2.36}}, lin1],
    // after the hit: back out to the two faces (Rao's grin, Stocco looking down at the hand that moved)
    [1.85, {gx: 840, L: {x: 800, y: 500, z: 1.04}, R: {x: 840, y: 540, z: 1.3}}],
    [2.9, {gx: 840, L: {x: 790, y: 498, z: 1.08}, R: {x: 850, y: 536, z: 1.36}}, lin1],
    // "Watch the hand on the left": the left panel widens and settles on his still right hand
    [T_SLIDE1() + 0.75, {gx: 1180, L: {x: 420, y: 640, z: 1.75}, R: {x: 880, y: 545, z: 1.4}}],
    [T_UP() - 0.05, {gx: 1190, L: {x: 430, y: 636, z: 1.82}, R: {x: 880, y: 545, z: 1.4}}, lin1],
    // "That's the guy playing": tilt up to his face, cap and screen
    [T_UP() + 0.7, {gx: 1160, L: {x: 820, y: 520, z: 1.12}, R: {x: 860, y: 600, z: 1.3}}],
    [T_WIDE2(), {gx: 1150, L: {x: 840, y: 515, z: 1.16}, R: {x: 860, y: 600, z: 1.3}}, lin1],
    // "The finger on the right": both labs wide enough to show the whole route
    [c2.cap - 0.05, {gx: 860, L: {x: 760, y: 560, z: 0.8}, R: {x: 700, y: 560, z: 0.98}}],
    [c2.tp, {gx: 860, L: {x: 765, y: 560, z: 0.8}, R: {x: 740, y: 585, z: 1.06}}, lin1],
    [c2.tp + 0.4, {gx: 860, L: {x: 765, y: 560, z: 0.8}, R: {x: 780, y: 610, z: 1.16}}],
    [T_MERGE0(), {gx: 860, L: {x: 790, y: 545, z: 0.84}, R: {x: 830, y: 580, z: 1.14}}],
  ]);
};
/** the campus camera behind the diptych, and after the merge */
const C_M0: CamS = {x: 0, y: 470, z: 1.32};
const C_M1: CamS = {x: 0, y: 470, z: 0.98};
const mergeK = (t: number) => easeInOut(clamp((t - T_MERGE0()) / (T_MERGE1() - T_MERGE0())));
const STO_WIN: CamS = {...Rw({x: 940, y: 560}), z: 2.85};
const CRANE: CamS = {x: 0, y: 150, z: 0.46};
const SPLIT_CAM: CamS = {x: -40, y: 260, z: 0.6};
export const campusCamA = (t: number): CamS => {
  const m0 = T_MERGE0(), m1 = T_MERGE1();
  if (t < m0) return C_M0;
  if (t < m1) {
    const k = mergeK(t);
    return {x: 0, y: 470, z: Math.exp(lerp(Math.log(C_M0.z), Math.log(C_M1.z), k))};
  }
  return camPath(t, [
    [m1, C_M1],
    [T_STO() + 0.85, STO_WIN],
    [T_CRANE(), {...STO_WIN, z: 2.35, x: STO_WIN.x + 6}, lin1],
    [15.1, {x: -470, y: 250, z: 0.62}],
    [15.55, {x: -380, y: 250, z: 0.62}, easeIn],
    [16.25, {x: 230, y: 250, z: 0.62}, lin1],
    [16.75, {x: 380, y: 250, z: 0.62}, easeOut],
    [T('two buildings') - 0.2, SPLIT_CAM],
    [20.0, camL({x: 720, y: 560}, 1.32)],
  ]);
};

// ---------------------------------------------------------------- the people's performance
/** Stocco's hand: the involuntary presses, otherwise a near-still hover (tiny breathing) */
const stoHand = (t: number) => {
  const c2 = C2();
  const a = tmsPress(t, TP1);
  if (t < a.r1 + 0.05) return a;
  const b = tmsPress(t, c2.tp);
  if (t >= c2.tp - 0.01 && t < b.r1 + 0.05) return b;
  const br = Math.sin(t * 1.7) * 0.4;
  return {pose: {...H_HOVER, wrist: H_HOVER.wrist + br}, press: 0, keyGlow: 0, tc: 0, j0: 0, r1: 0};
};
const stoFace = (t: number): Partial<Pose> => {
  const c2 = C2();
  const p1 = tmsPress(0, TP1).tc, p2 = tmsPress(0, c2.tp).tc;
  // he feels it: the eyes drop to his right hand (frame-left), brows up; then back to the bare wall
  const look1 = clamp((t - (p1 + 0.18)) / 0.2) * (1 - clamp((t - 2.5) / 0.45));
  const look2 = clamp((t - (p2 + 0.15)) / 0.2) * (1 - clamp((t - (T_MERGE0() + 0.4)) / 0.5));
  const lk = Math.max(look1, look2);
  const puzzled = clamp((t - (p1 + 0.35)) / 0.3) * (1 - clamp((t - 2.6) / 0.4)) + clamp((t - (p2 + 0.3)) / 0.3) * (1 - clamp((t - T_MERGE0()) / 0.4));
  // "who can't even see the game": nothing in front of him; his eyes wander over the bare wall
  const ts = T_STO() + 0.25;
  const scanK = clamp((t - ts) / 0.2) * (1 - clamp((t - (T_CRANE() + 0.2)) / 0.4));
  const scan = Math.sin(clamp((t - ts) / 1.6) * Math.PI * 2) * 0.7 * scanK;
  return {lookX: lerp(0.05, -0.95, lk) + scan, lookY: lerp(0.18, 0.85, lk) - 0.25 * scanK, tilt: -5 * lk + 2 * scan, brows: 0.6 * clamp(puzzled) + 0.35 * scanK, browAsym: 0.5 * clamp(puzzled), mouth: puzzled > 0.5 ? 'hmm' : 'flat', lean: -1.5 * lk};
};
const raoFace = (t: number): Partial<Pose> => {
  const ev = EV_A();
  const hit1 = (ev[0].fire ?? 0) + 0.32, hit2 = (ev[2].fire ?? 0) + 0.32;
  const grin = Math.max(clamp((t - (hit1 + 0.08)) / 0.2) * (1 - clamp((t - 2.2) / 0.4)), clamp((t - (hit2 + 0.1)) / 0.2) * (1 - clamp((t - (T_MERGE0() + 1)) / 0.4)));
  const conc = Math.max(1 - clamp((t - (hit1 - 0.25)) / 0.25), clamp((t - (T_UP() - 0.2)) / 0.4) * (1 - clamp((t - (hit2 - 0.2)) / 0.3)));
  // he watches the screen; on the plane his eyes rise and follow it; the hit: a small lean back and a grin
  const pl = ev[1];
  const pu = clamp((t - pl.t0) / pl.dur);
  const onPlane = t > pl.t0 && t < pl.t0 + pl.dur ? Math.sin(Math.PI * pu) : 0;
  return {
    lookX: 0.85 - 0.15 * onPlane, lookY: 0.05 - 0.45 * onPlane,
    brows: -0.4 * conc + 0.35 * grin, mouth: grin > 0.5 ? 'grin' : conc > 0.5 ? 'flat' : 'smile',
    lean: 2.2 * grin - 1.2 * conc, tilt: 3 * grin,
  };
};

// ---------------------------------------------------------------- the game (full frame, with the world extended past the screen)
export const GameWorld: React.FC<{t: number; events: GEvent[]; trail?: boolean; children?: React.ReactNode; id?: string}> = ({t, events, trail, children, id = 'va'}) => (
  <g>
    <defs>
      <linearGradient id={`${id}-gx`} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="400">
        <stop offset="0" stopColor="#9FD3EC" />
        <stop offset="1" stopColor="#E3F4FA" />
      </linearGradient>
    </defs>
    <rect x={-700} y={-500} width={2100} height={900} fill={`url(#${id}-gx)`} />
    <rect x={-700} y={350} width={1000} height={600} fill="#4F98C2" />
    <rect x={300} y={374} width={1100} height={600} fill="#8DB97A" />
    <rect x={300} y={430} width={1100} height={600} fill="#7AA868" />
    <GameScreen t={t} events={events} />
    {trail && events.map((e, i) => <ShotTrail key={i} e={e} g={t} />)}
    {children}
  </g>
);
const ShotTrail: React.FC<{e: GEvent; g: number}> = ({e, g}) => {
  if (e.fire === undefined || g < e.fire || g > e.fire + 0.32) return null;
  const s = shotPos(e, g);
  const a = s.muzzle, b = s.p;
  return (
    <g strokeLinecap="round">
      <path d={`M${fmt(a.x)},${fmt(a.y)} L${fmt(b.x)},${fmt(b.y)}`} stroke="#FFFFFF" strokeWidth={7} opacity={0.55} />
      <path d={`M${fmt(lerp(a.x, b.x, 0.4))},${fmt(lerp(a.y, b.y, 0.4))} L${fmt(b.x)},${fmt(b.y)}`} stroke={K.saffron} strokeWidth={3.4} />
    </g>
  );
};

// ---------------------------------------------------------------- near layers for the campus moves
const NEAR_CRANE = CRANE;
const CraneNear: React.FC = () => (
  <g>
    <circle cx={140} cy={1290} r={250} fill="#557F4C" stroke={INK} strokeWidth={9} />
    <circle cx={230} cy={1210} r={120} fill="#77A86B" opacity={0.85} />
    <circle cx={1650} cy={1300} r={260} fill="#5E8F55" stroke={INK} strokeWidth={9} />
    <circle cx={1580} cy={1230} r={130} fill="#77A86B" opacity={0.85} />
    <circle cx={1980} cy={1200} r={230} fill="#557F4C" stroke={INK} strokeWidth={9} />
  </g>
);

// ---------------------------------------------------------------- "split one video game": the screen and the keyboard
const SplitIcons: React.FC<{t: number}> = ({t}) => {
  const ts = T_SPLIT();
  const tLand = T('two buildings') + 0.15;
  const appear = clamp((t - (ts - 0.05)) / 0.3);
  if (appear <= 0 || t >= tLand) return null;
  const k = easeInOut(clamp((t - (ts + 0.55)) / (tLand - ts - 0.55)));
  const home = {x: 0, y: 40};
  const toL = Lw({x: RMON.x, y: RMON.y});
  const kbRoom = {x: STO_KEY.x, y: STO_KEY.y + 26};
  const toR = Rw(kbRoom);
  const arc = Math.sin(Math.PI * k) * 140;
  const sep = easeOut(clamp((t - (ts + 0.25)) / 0.35));
  const s0 = 0.72 * (0.85 + 0.15 * easeOut(appear));
  const sm = Math.exp(lerp(Math.log(s0), Math.log(RMON.s / 3), k));
  const sk = Math.exp(lerp(Math.log(s0 * 0.9), Math.log(0.64 / 3), k));
  const mon = {x: lerp(home.x - 60 * sep, toL.x, k), y: lerp(home.y, toL.y, k) - arc};
  const kb = {x: lerp(home.x + 60 * sep, toR.x, k), y: lerp(home.y + 70 + 40 * sep, toR.y, k) - arc};
  return (
    <g opacity={Math.min(1, appear * 1.4)}>
      <MonitorV2 id="va-icmon" x={mon.x} y={mon.y} s={sm}>
        <GameScreen t={t} events={[]} />
      </MonitorV2>
      <Keyboard id="va-ickb" x={kb.x} y={kb.y} s={sk} glowSpace={sep * (1 - k)} />
    </g>
  );
};

// ---------------------------------------------------------------- the rooms at time t
const roomsAt = (t: number, f: number, id: string, zL: number, zR: number) => {
  const c2 = C2();
  const ev = EV_A();
  const sh = stoHand(t);
  // route 1 (frame 0): lit wire everywhere, the pulse at the coil; route 2: the travelling command
  const lit1 = 1 - clamp((t - 0.3) / 0.7);
  const s2 = t >= c2.cap - 0.01 && t < c2.tp + 0.5;
  const sigL = s2 ? lerp(0, 1, clamp((t - c2.cap) / (c2.wall - c2.cap))) + (t > c2.wall ? (t - c2.wall) * 0.4 : 0) : -1;
  const sigR = s2 ? clamp((t - c2.enter) / (c2.coil - c2.enter)) + (t > c2.coil ? (t - c2.coil) * 0.3 : 0) : -1;
  const capLit = Math.max(1 - clamp((t - 0.6) / 0.5), clamp((t - (T_UP() + 0.2)) / 0.4) * (1 - clamp((t - (c2.comp + 0.1)) / 0.4)), 0.5 * clamp((t - (T('mind') - 0.05)) / 0.2) * (1 - clamp((t - 3.0) / 0.4)));
  const compOn = Math.max(t < 0.5 ? 1 : 0, t > c2.comp && t < c2.comp + 0.5 ? 1 : 0);
  const coilPulse = Math.max(t >= T_CLICK ? 1 - clamp((t - T_CLICK) / 0.3) : 0, t >= c2.coil ? 1 - clamp((t - c2.coil) / 0.25) : 0);
  const tmsLit = Math.max(t < 0.5 ? 1 : 0, t > c2.enter && t < c2.coil + 0.3 ? 1 : 0);
  const stim = t < 0.45 ? (t - T_CLICK) / 0.24 : t >= c2.coil && t < c2.coil + 0.3 ? (t - c2.coil) * 5 : -1;
  const drive = t < 0.6 ? (t - 0.24) / 0.2 : t >= c2.coil + 0.03 && t < c2.coil + 0.4 ? (t - c2.coil - 0.03) / 0.16 : -1;
  const roomL = (
    <RaoRoom id={`${id}-rao`} f={f} screen={<GameWorld id={`${id}-g`} t={t} events={ev} trail />} capLit={capLit} compBlink={compOn} compColor={K.saffron}
      face={raoFace(t)} lens={0.9} lensContent={<GameScreen t={t} events={ev} />} lit={lit1} sig={sigL} zr={zL} />
  );
  const roomR = (
    <StoccoRoom id={`${id}-sto`} f={f} face={stoFace(t)} coilPulse={coilPulse} tmsLit={tmsLit} lit={lit1} sig={t < 0.05 ? 1 : sigR} stim={stim} hand={sh.pose} press={sh.press} keyGlow={sh.keyGlow}
      drive={drive} stimLit={1 - clamp((t - 0.06) / 0.3)} zr={zR} earGlow={clamp((t - (T('can’t even see') - 0.1)) / 0.3) * (1 - clamp((t - (T_CRANE() - 0.2)) / 0.4))} />
  );
  return {roomL, roomR, bridgeSig: s2 ? clamp((t - c2.wall) / (c2.enter - c2.wall)) + (t > c2.enter ? (t - c2.enter) * 0.6 : 0) : -1, lit1};
};

// ---------------------------------------------------------------- the sequence
export const VA: React.FC<{f: number}> = ({f}) => {
  const t = f / FPS;
  const C = campusCamA(t);
  const m = t < T_MERGE0() ? 0 : mergeK(t);
  if (m < 1) {
    const pk = dipCam(t);
    const [rl, rr] = dipRects(pk.gx);
    const L: Panel = {rect: rl, cam: pk.L};
    const R: Panel = {rect: rr, cam: pk.R};
    const {roomL, roomR, bridgeSig, lit1} = roomsAt(t, f, 'va', pk.L.z, pk.R.z);
    const campus = <CampusA f={f} C={C} t={t} roomL={<g />} roomR={<g />} />;
    return (
      <g>
        <Diptych id="va-dip" L={L} R={R} roomL={roomL} roomR={roomR} C={C} m={m} campus={campus} lit={lit1} sig={bridgeSig} routeL={RAO_ROUTE.P.pts} routeR={STO_ROUTE.pts} />
        <DipTags t={t} L={L} R={R} />
      </g>
    );
  }
  const {roomL, roomR} = roomsAt(t, f, 'va', C.z / 3, C.z / 3);
  return <CampusA f={f} C={C} t={t} roomL={roomL} roomR={roomR} />;
};

/** labels: none needed in the diptych (the narration names the hand and the finger) */
const DipTags: React.FC<{t: number; L: Panel; R: Panel}> = () => null;

/** the campus world shot (A after the merge, and B through its window moves) */
export const CampusA: React.FC<{f: number; C: CamS; t: number; roomL: React.ReactNode; roomR: React.ReactNode; id?: string; sig?: number; overlay?: React.ReactNode}> = ({f, C, t, roomL, roomR, id = 'va', sig, overlay}) => {
  const craneK = t > T_CRANE() && t < 17.9 ? 1 : 0;
  const near = craneK > 0 && C.z < 3 ? (
    <Near cam={C} ref0={NEAR_CRANE} k={1.8}>
      <CraneNear />
    </Near>
  ) : null;
  const ts = T_SPLIT();
  const tLand = T('two buildings') + 0.15;
  const glowL = clamp((t - tLand) / 0.15) * (1 - clamp((t - (tLand + 0.35)) / 0.35));
  const tagK = clamp((t - (T('In 2013') + 0.15)) / 0.35) * (1 - clamp((t - (ts - 0.3)) / 0.3));
  const chipK = clamp((t - (T('In 2013') + 0.5)) / 0.35) * (1 - clamp((t - 19.25) / 0.25));
  const sig2 = sig ?? (t < 15.1 || t > 16.95 ? -1 : clamp((t - 15.1) / 1.55));
  const stream = clamp((t - 16.7) / 0.3) * (1 - clamp((t - 18.3) / 0.4));
  return (
    <g>
      <Campus id={`${id}-cw`} f={f} cam={C} roomL={roomL} roomR={roomR} sig={sig2} sigLen={0.07} sigWidth={16} near={near} stream={stream * 0.9}
        glowL={glowL} glowR={glowL} glass={clamp((2.2 - C.z) / 0.8)} overlay={overlay ?? <SplitIcons t={t} />} />
      <Tag x={960} y={96} text="University of Washington · 2013" size={46} k={tagK} />
      <Tag x={36} y={50} anchor="start" size={26} text="Animated reconstruction" fill="#FFFFFF" k={chipK} />
    </g>
  );
};

/** sound cues (gain dB) */
export const CUES_VA = (): {t: number; kind: string; gain?: number; dur?: number}[] => {
  const c2 = C2();
  const ev = EV_A();
  const p1 = tmsPress(0, TP1).tc, p2 = tmsPress(0, c2.tp).tc;
  return [
    {t: T_CLICK, kind: 'coil_pulse', gain: -4},
    {t: p1, kind: 'key_click', gain: 0},
    {t: ev[0].fire!, kind: 'cannon', gain: -3},
    {t: ev[0].fire! + 0.32, kind: 'boom', gain: -6},
    {t: ev[1].t0, kind: 'plane_pass', gain: -14, dur: ev[1].dur},
    {t: ev[2].t0, kind: 'rocket_launch', gain: -10},
    {t: c2.cap, kind: 'packet_send', gain: -10},
    {t: c2.enter, kind: 'packet_arrive', gain: -12},
    {t: c2.coil, kind: 'coil_pulse', gain: -4},
    {t: p2, kind: 'key_click', gain: 0},
    {t: ev[2].fire!, kind: 'cannon', gain: -2},
    {t: ev[2].fire! + 0.32, kind: 'boom', gain: -4},
    {t: T_MERGE0() + 0.1, kind: 'whoosh', gain: -14, dur: 1.4},
    {t: T('In 2013') + 0.15, kind: 'pop', gain: -10},
    {t: 15.15, kind: 'packet_send', gain: -13},
    {t: 16.6, kind: 'packet_arrive', gain: -13},
    {t: T('two buildings') + 0.15, kind: 'tick', gain: -10},
  ];
};
export {RAO_HEAD, RAO_P, STO_HEAD, STO_P, KEY, r2s, camAt, camT, W0, WL, WR, ROUTE, mixH, sp};
export type {HPose};
