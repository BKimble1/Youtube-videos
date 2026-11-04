// V2 A (0 -> 19.54 s): the opening and the campus.
//  0.00  ECU: Stocco's finger is DRIVEN down onto the space bar (saffron drive glow, snap, key compression)
//  0.30  the camera follows the press down through the key surface: the space bar opens into the game; the cannon
//        fires (0.50) and the camera rides the shot in slow motion
//  1.90  MATCH CUT: the shot's trajectory -> the EEG cable at the same place and angle; climb it to Rao's cap ("his mind")
//  2.95  pull out: Rao's lab (his hand on the left lies still) -> his building -> the second building across the lawn
//        with Stocco in its window ("Watch the hand on the left")
//  4.85  dive back to Rao's cap: he is the one playing (electrodes light)
//  5.95  follow the signal: cap -> cable -> computer -> network line -> across to the other building -> TMS -> coil
//  7.33  ECU: the involuntary jerk and drop; the finger lands on "fired" -> CUT ON THE CLICK to the cannon (muzzle
//        flash where the key flashed); the rocket bursts; pull out of Rao's monitor: Rao grins
//  9.05  "a man across campus": out of Rao's window and along the lawn (foreground pillar and tree sweep past) into
//        the other building: Stocco, seen from behind, faces a bare wall in noise-cancelling earbuds
// 13.17  crane up and out to the campus; the one command runs from lab to lab; one game splits in two (the screen to
//        Rao's building, the keyboard to Stocco's) and the camera swoops into Rao's window (B continues)
import React from 'react';
import {clamp, easeIn, easeInOut, easeOut, fmt, lerp} from '../dc/math';
import {GEvent, GameScreen} from '../art/game';
import {INK, K, Keyboard, Tag} from '../art/kit';
import {FPS, T, sp} from './core2';
import {ECU_CAM} from './contracts';
import {F_DOWN, F_HOVER, F_JERK, F_LIFT, FingerECU, FPose, indexPts, KEY, keyTopY, mixF, padPt, pressPose} from './finger';
import {
  Campus, camAt, camL, clampG, fx, camLerp, camPath, camR, CamS, camT, gameCamIn, Lw, lin1, MonitorV2, Near,
  RAO_HEAD, RaoRoom, RMON, ROUTE, Rw, S_TIP, shotPos, SKB, StoccoRoom, toScr, W0, WL, WR, World,
} from './abworld';

// ---------------------------------------------------------------- timing (all from the measured words)
const tc1 = 4 / FPS; // the opening contact: frame 4
const G1_FIRE = 0.58; // the cannon fires (seen through the opening key)
const SLOW = 0.22; // slow-motion factor while the camera rides the shot
const T_PORTAL = 0.84; // the key surface fills the frame: we are in the game
const T_CUT1 = 1.9; // shot -> EEG cable
const T_OUT = 2.95; // pull out from the cap
const T_DIVE = () => T('That’s the guy playing') - 0.1;
const T_SIG = () => T('That’s the guy playing') + 0.98; // the signal leaves the cap (5.94)
export const T_ECU2 = 220 / FPS; // cut to the finger (7.333)
export const T_HIT2 = 228 / FPS; // contact on "fired" (7.600)
export const T_FIRE2 = 229 / FPS; // cut on the click: the cannon fires (7.633)
const T_TRACK = () => T('It belongs to') - 0.02; // 9.05
const T_CRANE = () => T('In 2013') - 0.62; // the crane starts in the pause, slowly
const T_SPLIT = () => T('split one video game');

const gA = (t: number) => (t < G1_FIRE ? t : G1_FIRE + (t - G1_FIRE) * SLOW);
const EV1: GEvent = {kind: 'rocket', t0: G1_FIRE + 0.32 - 0.48 * 3.4, dur: 3.4, fire: G1_FIRE};
/** the game on Rao's monitor after the opening (real time): a plane passes while he plays, then the rocket */
export const EV_ROOM = (): GEvent[] => [
  {kind: 'plane', t0: 3.15, dur: 2.7},
  {kind: 'rocket', t0: T_FIRE2 + 0.32 - 0.48 * 3.4, dur: 3.4, fire: T_FIRE2},
];

// ---------------------------------------------------------------- the ECU (FingerECU world)
const PORTAL_X1 = 980; // the opening strip of the space bar (left of the finger)
const P_DIVE = {x: KEY.x - 300, y: keyTopY(1)};
const Z_END = 19;
const G0: CamS = {x: 330, y: 268, z: 3.3};
/** game -> ECU world inside the opening key */
const portalT = () => `translate(${fx(P_DIVE.x)} ${fx(P_DIVE.y)}) scale(${fx(G0.z / Z_END)}) translate(${fx(-G0.x)} ${fx(-G0.y)})`;

/** the involuntary press: from `from` the finger is pulled down to contact at tc (accelerating), then the key travel
 *  springs in with a small overshoot */
const snapState = (t: number, tc: number, from: FPose) => {
  if (t < tc) {
    const u = clamp((t - (tc - 0.2)) / 0.2);
    return {pose: mixF(from, F_DOWN, u * u * u), press: 0};
  }
  const press = Math.min(1.22, sp(t * FPS, tc, {damping: 9, stiffness: 520}));
  return {pose: pressPose(press), press};
};
/** the TMS-driven movement for the second press: hover -> sharp wrist extension (jerk) -> brief hold -> drop */
const jerkState = (t: number, t0: number, tc: number) => {
  const d = t - t0;
  if (t >= tc) return snapState(t, tc, F_JERK);
  if (d < 0.04) return {pose: F_HOVER, press: 0};
  if (d < 0.11) return {pose: mixF(F_HOVER, F_JERK, easeOut((d - 0.04) / 0.07)), press: 0};
  const drop0 = tc - 0.11;
  if (t < drop0) {
    const e = d - 0.11;
    const osc = Math.exp(-e * 14) * Math.sin(e * 46);
    return {pose: {...F_JERK, wrist: F_JERK.wrist + 1.6 * osc}, press: 0};
  }
  return {pose: mixF(F_JERK, F_DOWN, easeIn(clamp((t - drop0) / 0.11)) ** 1.3), press: 0};
};
/** motion arcs trailing the fingertip during a snap */
/** motion arcs about the knuckle, trailing the fingertip as it snaps down */
const SnapLines: React.FC<{pose: FPose; k: number}> = ({pose, k}) => {
  if (k <= 0.01) return null;
  const ip = indexPts(pose);
  const c = ip[0];
  const tip = ip[3];
  const a = Math.atan2(tip.y - c.y, tip.x - c.x);
  const R = Math.hypot(tip.x - c.x, tip.y - c.y);
  const deg = Math.PI / 180;
  return (
    <g opacity={k} fill="none" strokeLinecap="round">
      {[0, 1, 2].map((i) => {
        const r = R + 30 - i * 95;
        const a0 = a + (8 + i * 3) * deg, a1 = a + (36 - i * 4) * deg;
        const P = (q: number) => `${fmt(c.x + Math.cos(q) * r)},${fmt(c.y + Math.sin(q) * r)}`;
        const d = `M${P(a0)} A${fmt(r)},${fmt(r)} 0 0 1 ${P(a1)}`;
        return (
          <g key={i}>
            <path d={d} stroke={K.cream} strokeWidth={22} />
            <path d={d} stroke={INK} strokeWidth={8} />
          </g>
        );
      })}
    </g>
  );
};
const Ecu: React.FC<{f: number; id: string; cam: CamS; pose: FPose; press: number; keyGlow: number; drive: number; portal?: number; gameT?: number; lines?: React.ReactNode}> = ({f, id, cam, pose, press, keyGlow, drive, portal = 0, gameT = 0, lines}) => {
  const dz = press * KEY.travel;
  const top = `M${KEY.x - KEY.w / 2 + 26},${KEY.y - KEY.depth + dz} L${PORTAL_X1},${KEY.y - KEY.depth + dz} L${PORTAL_X1},${KEY.y + dz} L${KEY.x - KEY.w / 2},${KEY.y + dz} Z`;
  return (
    <g>
      <rect x={0} y={0} width={1920} height={1080} fill={K.stoccoWall} />
      <World cam={cam}>
        <rect x={-3000} y={-2000} width={8000} height={KEY.y - 60 + 2000} fill={K.stoccoWall} />
        <FingerECU id={id} pose={pose} press={press} keyGlow={keyGlow} drive={drive} />
        {lines}
        {portal > 0.001 && (
          <g>
            <defs>
              <clipPath id={`${id}-portal`}>
                <path d={top} />
              </clipPath>
            </defs>
            <g clipPath={`url(#${id}-portal)`} opacity={clamp(portal)}>
              <g transform={portalT()}>
                <GameWorld t={gameT} events={[EV1]} trail />
              </g>
            </g>
          </g>
        )}
      </World>
    </g>
  );
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
/** a long bright trail behind the cannon shot (the line the match cut picks up) */
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
const gameT1 = (t: number): CamS => {
  // ride the shot: from the opening framing to the shot centred
  const g = gA(t);
  const s = shotPos(EV1, g).p;
  const w = easeInOut(clamp((t - T_PORTAL) / (T_CUT1 - 0.1 - T_PORTAL)));
  const zs = lerp(G0.z, 4.2, w);
  return {x: lerp(G0.x, s.x, w), y: lerp(G0.y, s.y, w), z: zs};
};

// ---------------------------------------------------------------- the campus camera (shared with B through 21.75 s)
const Ldeg = (x: number, y: number) => ({x, y});
/** the EEG cable point where the match cut lands, and the camera that frames it exactly like the shot */
const CUT_ZR = 3.1;
const cableCutCam = (): CamS => {
  // the shot's screen line passes through the centre; put the cable at the centre too
  const p = {x: 758, y: 664};
  return camL(p, CUT_ZR);
};
const raoHeadCam = (zr: number, dy = -12) => camL(Ldeg(RAO_HEAD.x, RAO_HEAD.y + dy), zr);
/** the monitor game seen through the room: game cam -> CW cam */
export const camGameL = (g: CamS): CamS => {
  const r = gameCamIn(RMON, g);
  return {...Lw(r), z: r.z * 3};
};
const padScreen = () => toScr(ECU_CAM, padPt(pressPose(1)));
const fire2Cam = (): CamS => {
  const m = shotPos(EV_ROOM()[1], T_FIRE2).muzzle;
  return camAt(m, padScreen(), 3.7);
};
/** the track across campus (9.05 -> 11.5): one eased move whose zoom dips as it passes the lawn */
const trackCam = (t: number): CamS => {
  const a = camL({x: 1000, y: 560}, 1.15), b = camR({x: 960, y: 540}, 1.1);
  const k = easeInOut(clamp((t - T_TRACK()) / (11.5 - T_TRACK())));
  const dip = Math.sin(Math.PI * k) ** 0.8;
  const lz = lerp(Math.log(a.z), Math.log(b.z), k) - dip * Math.log(2.35);
  return {x: lerp(a.x, b.x, k), y: lerp(a.y, b.y, k) + 40 * dip, z: Math.exp(lz)};
};
const CRANE: CamS = {x: 0, y: 150, z: 0.46};
const SPLIT_CAM: CamS = {x: -40, y: 260, z: 0.6};
/** CW camera for 1.9 s -> 21.75 s (A and the start of B) */
export const cwCam = (t: number): CamS => {
  if (t < T_OUT) {
    return camPath(t, [
      [T_CUT1, cableCutCam()],
      [2.3, camL({x: 750, y: 600}, 3.15), lin1],
      [2.78, raoHeadCam(3.35), easeOut],
      [T_OUT, raoHeadCam(3.5, -8), easeInOut],
    ]);
  }
  if (t < T_SIG()) {
    return camPath(t, [
      [T_OUT, raoHeadCam(3.5, -8)],
      [4.15, W0],
      [T_DIVE(), {x: -36, y: 470, z: 1.09}],
      [T_DIVE() + 0.68, raoHeadCam(3.2, -40)],
      [T_SIG(), raoHeadCam(3.55, -34)],
    ]);
  }
  if (t < T_ECU2) {
    const s0 = T_SIG();
    return camPath(t, [
      [s0, raoHeadCam(3.55, -34)],
      [s0 + 0.32, camL({x: 900, y: 640}, 2.3), easeIn],
      [s0 + 0.62, {x: WL.x + WL.w + 20, y: 520, z: 2.1}, lin1],
      [s0 + 0.88, {x: 0, y: 610, z: 1.5}, lin1],
      [s0 + 1.12, {...Rw({x: 120, y: 560}), z: 2.3}, lin1],
      [T_ECU2, camR({x: S_TIP.x - 30, y: 690}, 2.5), easeOut],
    ]);
  }
  if (t < T_TRACK()) {
    if (t < 8.25) return camGameL(clampG(camLerp(fire2Cam(), {x: 320, y: 200, z: 3}, easeOut(clamp((t - T_FIRE2) / (8.25 - T_FIRE2))))));
    return camPath(t, [
      [8.25, camGameL({x: 320, y: 200, z: 3})],
      [T_TRACK(), camL({x: 1000, y: 560}, 1.15)],
    ]);
  }
  if (t < 11.5) return trackCam(t);
  if (t < T_CRANE()) return camPath(t, [[11.5, camR({x: 960, y: 540}, 1.1)], [T_CRANE() - 0.05, camR({x: 1000, y: 380}, 1.85)]]);
  return camPath(t, [
    [T_CRANE(), camR({x: 1000, y: 380}, 1.85)],
    [15.1, {x: -470, y: 250, z: 0.62}],
    [15.55, {x: -380, y: 250, z: 0.62}, easeIn],
    [16.25, {x: 230, y: 250, z: 0.62}, lin1],
    [16.75, {x: 380, y: 250, z: 0.62}, easeOut],
    [T('two buildings') - 0.2, SPLIT_CAM],
    [20.0, camL({x: 720, y: 560}, 1.32)],
    [20.5, camL({x: 700, y: 552}, 1.38)],
    [21.3, camL({x: RMON.x, y: 520}, 2.3)],
    [21.75, camL({x: RMON.x, y: 516}, 2.55)],
  ]);
};

/** the signal head on the route for the first command (5.94 -> 7.25) */
const sigAt = (t: number) => {
  const s0 = T_SIG();
  if (t < s0) return -1;
  const ks: [number, number][] = [[s0, 0], [s0 + 0.3, ROUTE.kComp], [s0 + 0.56, ROUTE.kA], [s0 + 1.02, ROUTE.kB], [s0 + 1.3, 1]];
  for (let i = 0; i < ks.length - 1; i++) if (t <= ks[i + 1][0]) return lerp(ks[i][1], ks[i + 1][1], (t - ks[i][0]) / (ks[i + 1][0] - ks[i][0]));
  return t < s0 + 1.6 ? 1 : -1;
};
/** the second command across the wide campus (15.2 -> 16.6) */
const sig2At = (t: number) => (t < 15.1 || t > 16.95 ? -1 : clamp((t - 15.1) / 1.55));

// ---------------------------------------------------------------- foreground layers
const NEAR_TRACK = {x: 0, y: 520, z: 1.5};
const TrackNear: React.FC = () => (
  <g>
    {/* a nearer building's corner pillar and a tree in front of the lawn */}
    <rect x={430} y={-60} width={250} height={1200} fill="#9E5A43" stroke={INK} strokeWidth={8} />
    <rect x={430} y={-60} width={60} height={1200} fill="#B4694F" />
    {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => <path key={i} d={`M430,${40 + i * 100} L680,${40 + i * 100}`} stroke="#86493A" strokeWidth={6} />)}
    <rect x={1340} y={560} width={46} height={560} fill="#7A4F33" stroke={INK} strokeWidth={8} />
    <circle cx={1360} cy={470} r={210} fill="#5E8F55" stroke={INK} strokeWidth={9} />
    <circle cx={1290} cy={410} r={110} fill="#77A86B" opacity={0.85} />
  </g>
);
const CraneNear: React.FC = () => (
  <g>
    {/* tree crowns and a parapet in front of the camera as it rises */}
    <circle cx={140} cy={1290} r={250} fill="#557F4C" stroke={INK} strokeWidth={9} />
    <circle cx={230} cy={1210} r={120} fill="#77A86B" opacity={0.85} />
    <circle cx={1650} cy={1300} r={260} fill="#5E8F55" stroke={INK} strokeWidth={9} />
    <circle cx={1580} cy={1230} r={130} fill="#77A86B" opacity={0.85} />
    <circle cx={1980} cy={1200} r={230} fill="#557F4C" stroke={INK} strokeWidth={9} />
  </g>
);

// ---------------------------------------------------------------- the "split one video game" icons
const SplitIcons: React.FC<{t: number}> = ({t}) => {
  const ts = T_SPLIT();
  const tLand = T('two buildings') + 0.15;
  const appear = clamp((t - (ts - 0.05)) / 0.3);
  if (appear <= 0 || t >= tLand) return null;
  const k = easeInOut(clamp((t - (ts + 0.55)) / (tLand - ts - 0.55)));
  const home = {x: 0, y: 40};
  // the real monitor (Rao) and keyboard (Stocco) in the two windows
  const toL = Lw({x: RMON.x, y: RMON.y});
  const toR = Rw({x: SKB.x, y: SKB.y});
  const arc = Math.sin(Math.PI * k) * 140;
  const sep = easeOut(clamp((t - (ts + 0.25)) / 0.35));
  const s0 = 0.72 * (0.85 + 0.15 * easeOut(appear));
  const sm = Math.exp(lerp(Math.log(s0), Math.log(RMON.s / 3), k));
  const sk = Math.exp(lerp(Math.log(s0 * 0.9), Math.log(SKB.s / 3), k));
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

// ---------------------------------------------------------------- the sequence
export const VA: React.FC<{f: number}> = ({f}) => {
  const t = f / FPS;

  // ---- 1. the ECU, the press and the dive through the key (0 -> 0.66)
  if (t < T_PORTAL) {
    const from = mixF(F_LIFT, F_HOVER, 0.25);
    const st = snapState(t, tc1, from);
    const drive = lerp(0.55, 1.0, clamp(t / tc1)) + (t > tc1 ? (t - tc1) * 1.6 : 0);
    const keyGlow = t >= tc1 ? Math.max(0, 1 - (t - tc1) / 0.35) : 0;
    const follow = {...ECU_CAM, y: ECU_CAM.y + 10 * clamp((t - tc1) / 0.15)};
    const dk = clamp((t - 0.26) / (T_PORTAL - 0.26));
    const cam = t < 0.26 ? follow : camLerp(follow, {...P_DIVE, z: Z_END}, 0.5 * easeIn(dk) + 0.5 * easeInOut(dk));
    const portal = clamp((t - 0.28) / 0.14);
    const lines = t < tc1 + 0.08 ? <SnapLines pose={st.pose} k={clamp(1 - (t - tc1) / 0.08)} /> : null;
    return <Ecu f={f} id="va-ecu" cam={cam} pose={st.pose} press={st.press} keyGlow={keyGlow} drive={drive} portal={portal} gameT={gA(t)} lines={lines} />;
  }
  // ---- 2. inside the game: ride the shot (slow motion)
  if (t < T_CUT1) {
    const g = gA(t);
    return (
      <g>
        <rect x={0} y={0} width={1920} height={1080} fill="#9FD3EC" />
        <g transform={camT(gameT1(t))}>
          <GameWorld t={g} events={[EV1]} trail />
        </g>
      </g>
    );
  }
  // ---- 4. the second press, ECU (7.333 -> 7.633)
  if (t >= T_ECU2 && t < T_FIRE2) {
    const st = jerkState(t, T_ECU2, T_HIT2);
    const drive = clamp((t - T_ECU2) / 0.13) + (t > T_ECU2 + 0.13 ? (t - T_ECU2 - 0.13) * 1.4 : 0);
    const keyGlow = t >= T_HIT2 ? 1 : 0;
    return <Ecu f={f} id="va-ecu2" cam={ECU_CAM} pose={st.pose} press={st.press} keyGlow={keyGlow} drive={drive} />;
  }

  return <CampusAB f={f} />;
};

/** the campus world shot (A from 1.9 s, and B through 21.75 s) */
export const CampusAB: React.FC<{f: number; monGlow?: number; id?: string}> = ({f, monGlow = 0, id = 'va'}) => {
  const t = f / FPS;
  const cam = cwCam(t);
  const ev = EV_ROOM();
  const s0 = T_SIG();
  // Rao: thinking (cap lit) while he plays; grins at the hit
  const capLit = Math.max(
    clamp((t - 2.45) / 0.3) * (1 - clamp((t - 3.5) / 0.5)),
    clamp((t - (T_DIVE() + 0.3)) / 0.3) * (1 - clamp((t - (s0 + 0.5)) / 0.4)),
  );
  const conc = clamp((t - T_DIVE()) / 0.4) * (1 - clamp((t - (T_FIRE2 + 0.2)) / 0.4));
  const grin = clamp((t - (T_FIRE2 + 0.45)) / 0.3) * (1 - clamp((t - (T_TRACK() + 0.8)) / 0.4));
  const face = {brows: -0.35 * conc + 0.3 * grin, mouth: (grin > 0.5 ? 'grin' : conc > 0.5 ? 'flat' : 'smile') as 'grin' | 'flat' | 'smile', lookX: 0.85, lookY: 0.12};
  const compBlink = t > s0 + 0.22 && t < s0 + 0.7 ? 1 : 0;
  const handRing = clamp((t - (T('Watch the hand') + 0.1)) / 0.3) * (1 - clamp((t - (T('That’s the guy') - 0.15)) / 0.3));
  // the game shown on Rao's monitor; the full-screen push fades the glass and the screen edge
  const camZroom = cam.z * (1 / 3);
  const edge = clamp((2.6 - camZroom * RMON.s) / 0.6);
  const screen = <GameWorld id={id} t={t} events={ev} />;
  // Stocco: the coil pulse, the TMS display, the jerk starting as we cut
  const sg = sigAt(t);
  const coilPulse = t > s0 + 1.28 && t < s0 + 1.8 ? 1 - (t - (s0 + 1.28)) / 0.52 : 0;
  const tmsLit = t > s0 + 1.04 && t < s0 + 1.5 ? 1 : 0;
  const lift = clamp((t - (T_ECU2 - 0.06)) / 0.06);
  const pressB = t > T_HIT2 && t < T_HIT2 + 0.6 ? 0.6 : 0;
  const earGlow = clamp((t - (T('can’t even see') - 0.1)) / 0.3) * (1 - clamp((t - (T_CRANE() - 0.3)) / 0.4));
  const roomL = <RaoRoom id={`${id}-rao`} monGlow={monGlow} f={f} screen={screen} capLit={capLit} compBlink={compBlink} compColor={t > s0 + 0.3 ? K.saffron : K.teal} face={face} handRing={handRing} lens={1} lensContent={<GameScreen t={t} events={ev} />} edge={edge} glare={edge}
    cableGlow={clamp(1 - (t - T_CUT1) / 0.7)} flow={clamp((t - T_CUT1) / 0.1) * (1 - clamp((t - 3.4) / 0.4))} />;
  const roomR = <StoccoRoom id={`${id}-sto`} f={f} coilPulse={coilPulse} tmsLit={tmsLit} lift={t < T_FIRE2 + 0.4 ? lift * (1 - clamp((t - T_FIRE2) / 0.3)) : 0} press={pressB} space={pressB > 0 ? 0.7 : 0} earGlow={earGlow} />;
  // signals: the first command, then the second across the wide campus
  const sig = sg >= 0 ? sg : sig2At(t);
  // near layers
  const trackK = t > T_TRACK() && t < 11.5 ? 1 : 0;
  const craneK = t > T_CRANE() && t < 17.9 ? 1 : 0;
  const near = (
    <g>
      {trackK > 0 && (
        <Near cam={cam} ref0={NEAR_TRACK} k={1.6}>
          <TrackNear />
        </Near>
      )}
      {craneK > 0 && cam.z < 3 && (
        <Near cam={cam} ref0={CRANE} k={1.8}>
          <CraneNear />
        </Near>
      )}
    </g>
  );
  const ts = T_SPLIT();
  const tLand = T('two buildings') + 0.15;
  const glowL = clamp((t - tLand) / 0.15) * (1 - clamp((t - (tLand + 0.35)) / 0.35));
  const tagK = clamp((t - (T('In 2013') + 0.15)) / 0.35) * (1 - clamp((t - (ts - 0.3)) / 0.3));
  const chipK = clamp((t - (T('In 2013') + 0.5)) / 0.35) * (1 - clamp((t - 19.25) / 0.25));
  const stream = clamp((t - 16.7) / 0.3) * (1 - clamp((t - 18.3) / 0.4));
  return (
    <g>
      <Campus
        id={`${id}-cw`} f={f} cam={cam} roomL={roomL} roomR={roomR} sig={sig} sigLen={sg >= 0 ? 0.05 : 0.07} sigWidth={sg >= 0 ? undefined : 16} near={near} stream={stream * 0.9}
        glowL={glowL} glowR={glowL} glass={clamp((2.2 - cam.z) / 0.8)}
        overlay={<SplitIcons t={t} />}
      />
      <Tag x={960} y={96} text="University of Washington · 2013" size={46} k={tagK} />
      <Tag x={36} y={50} anchor="start" size={26} text="Animated reconstruction" fill="#FFFFFF" k={chipK} />
    </g>
  );
};

/** sound cues (gain dB) */
export const CUES_VA = (): {t: number; kind: string; gain?: number; dur?: number}[] => {
  const s0 = T_SIG();
  return [
    {t: tc1, kind: 'key_click', gain: 0},
    {t: 0.3, kind: 'whoosh', gain: -12, dur: 0.4},
    {t: G1_FIRE, kind: 'cannon', gain: -2},
    {t: 2.5, kind: 'tick', gain: -12},
    {t: T('Watch the hand') + 0.1, kind: 'pop', gain: -12},
    {t: s0, kind: 'packet_send', gain: -9},
    {t: s0 + 1.02, kind: 'packet_arrive', gain: -10},
    {t: s0 + 1.28, kind: 'coil_pulse', gain: -4},
    {t: T_HIT2, kind: 'key_click', gain: 0},
    {t: T_FIRE2, kind: 'cannon', gain: 0},
    {t: T_FIRE2 + 0.32, kind: 'boom', gain: -2},
    {t: T_TRACK(), kind: 'whoosh', gain: -11, dur: 1.4},
    {t: T('In 2013') + 0.15, kind: 'pop', gain: -9},
    {t: 15.15, kind: 'packet_send', gain: -12},
    {t: 16.6, kind: 'packet_arrive', gain: -12},
    {t: T('two buildings') + 0.15, kind: 'tick', gain: -9},
    {t: 18.4, kind: 'whoosh', gain: -11, dur: 1.4},
  ];
};
