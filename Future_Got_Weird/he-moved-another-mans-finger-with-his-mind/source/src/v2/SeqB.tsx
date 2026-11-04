// V2 B (19.54 -> 44.64 s): who had what, the desk gag, and the game's one decision.
// 19.54  in Rao's lab (the camera arrives through his window): "Rajesh Rao" ... trucks to his game screen
// 21.75  GRAPHIC MATCH: Rao's screen -> the same rectangle on Stocco's bare wall, dashed and empty; pull back over
//        his swim cap (coil site, earbuds) to the keyboard
// 22.95  his hand over the space bar (profile); on "Together" the keyboard is yanked out from under it ->
// 24.98  CUT ON THE MOTION: the keyboard flies in from the right onto an ordinary desk, Rao's screen from the left,
//        an empty office chair rolls in and bumps the desk on "desk"; the screen wakes; push through the bezel into
// 29.95  the game: the little city; a supply plane flies the arc (Rao watches, hands still) and lands safely; a rocket
//        launches along the SAME arc; CUT ON THE CLICK: Stocco's finger is driven down -> the cannon fires (muzzle
//        flash where the key flashed) -> the rocket bursts
// 38.45  Stocco faces his bare wall, unaware ("Easy enough") -> Rao, the only one who sees (the game in his glasses)
//        -> his hand on an empty desk: no fire button -> tilt up into his screen: the plain game, full frame (C)
import React from 'react';
import {clamp, easeIn, easeInOut, easeOut, fmt, lerp} from '../dc/math';
import {lit, shade} from '../dc/color';
import {arcPt, GEvent, GameScreen} from '../art/game';
import {FLAT, HOVER, SideHand} from '../art/hand';
import {INK, K, Keyboard, Tag} from '../art/kit';
import {STOCCO_WRIST} from '../shots/S1Hook';
import {FPS, T, sp} from './core2';
import {ECU_CAM, GAME_FULL} from './contracts';
import {F_DOWN, F_HOVER, F_JERK, FingerECU, FPose, mixF, padPt, pressPose} from './finger';
import {
  ArcGhost, camAt, camLerp, camPath, CamS, camT, clampG, fullGameCam, lin1, MonitorV2, OfficeChair, PlainDesk, RAO_HEAD,
  GHOST, RaoRoom, RMON, shotPos, StoccoRoom, toScr, World,
} from './abworld';
import {CampusAB, cwCam, GameWorld} from './SeqA';

// ---------------------------------------------------------------- timing
const T_STO = 21.75; // graphic match to Stocco's wall
const T_HAND = 22.95; // the profile hand over the space bar
const T_YANK = () => T('Together') + 0.02;
const T_STAGE = 24.98; // cut to the ordinary desk
const T_GAME = 29.95; // inside the game
const T_PLANE = () => T('A supply plane') + 0.02;
const T_RAO1 = 32.75; // Rao watches the plane
const T_GAME2 = () => T('Let it through') + 0.59; // back to the game (33.95)
const T_SHIP = 34.95;
const T_ROCKET = 35.5;
const T_ECU = 36.55; // cut to the finger
const T_HIT = 1109 / FPS; // contact (36.967) on "Shoot"
const T_FIRE = 1110 / FPS; // cut on the click (37.0): the cannon fires
const T_STO2 = 38.45;
const T_RAOF = () => T('except') - 0.03;
const T_RHAND = () => T('had no way') - 0.01;
const T_END = 1339 / FPS; // B's last frame = GAME_FULL

const EVB = (): GEvent[] => [
  {kind: 'plane', t0: T_PLANE(), dur: 2.5},
  {kind: 'rocket', t0: T_ROCKET, dur: 3.4, fire: T_FIRE},
];
/** what Rao's glasses reflect while "the only person who could see the difference" (a plane, then a rocket) */
const EV_LENS = (): GEvent[] => [
  {kind: 'plane', t0: T('except') - 0.4, dur: 1.6},
  {kind: 'rocket', t0: T('the difference') - 0.6, dur: 1.6},
];

// ---------------------------------------------------------------- shared bits
const jerkState = (t: number, t0: number, tc: number) => {
  const d = t - t0;
  if (t >= tc) {
    const press = Math.min(1.22, sp(t * FPS, tc, {damping: 9, stiffness: 520}));
    return {pose: pressPose(press), press};
  }
  if (d < 0.05) return {pose: F_HOVER, press: 0};
  if (d < 0.12) return {pose: mixF(F_HOVER, F_JERK, easeOut((d - 0.05) / 0.07)), press: 0};
  const drop0 = tc - 0.11;
  if (t < drop0) {
    const e = d - 0.12;
    const osc = Math.exp(-e * 14) * Math.sin(e * 46);
    return {pose: {...F_JERK, wrist: F_JERK.wrist + 1.6 * osc}, press: 0};
  }
  return {pose: mixF(F_JERK, F_DOWN, easeIn(clamp((t - drop0) / 0.11)) ** 1.3), press: 0};
};
const GameShot: React.FC<{cam: CamS; t: number; events: GEvent[]; children?: React.ReactNode}> = ({cam, t, events, children}) => (
  <g>
    <rect x={0} y={0} width={1920} height={1080} fill="#9FD3EC" />
    <g transform={camT(cam)}>
      <GameWorld id="vb" t={t} events={events} trail>
        {children}
      </GameWorld>
    </g>
  </g>
);
const RoomShot: React.FC<{cam: CamS; children: React.ReactNode}> = ({cam, children}) => (
  <g>
    <rect x={0} y={0} width={1920} height={1080} fill={K.paper} />
    <World cam={cam}>{children}</World>
  </g>
);

// ---------------------------------------------------------------- Stocco's keyboard in profile (S1 geometry, panel-local)
const KB0 = {x: 430, y: 862, s: 1.45};
const ProfileDesk: React.FC<{t: number; kbX: number; space: number; twitch: number}> = ({t, kbX, space, twitch}) => {
  const top = '#D9A773';
  const pose = {...HOVER, wrist: HOVER.wrist - 2 * twitch, idx: [HOVER.idx[0] - 6 * twitch, HOVER.idx[1], HOVER.idx[2]] as [number, number, number]};
  return (
    <g>
      <defs>
        <linearGradient id="vb-pw" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={lit(K.stoccoWall, 0.2)} />
          <stop offset="1" stopColor={K.stoccoWall} />
        </linearGradient>
        <linearGradient id="vb-pt" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={shade(top, 0.12)} />
          <stop offset="1" stopColor={lit(top, 0.1)} />
        </linearGradient>
      </defs>
      <rect x={-3000} y={-600} width={6000} height={1080} fill="url(#vb-pw)" />
      <rect x={-3000} y={440} width={6000} height={28} fill={K.stoccoWallDeep} />
      <path d="M-3000,480 L3000,480 L3000,1700 L-3000,1700 Z" fill="url(#vb-pt)" stroke={INK} strokeWidth={6} />
      <path d="M-3000,480 L3000,480" stroke={lit(top, 0.35)} strokeWidth={8} />
      <Keyboard id="vb-pkb" x={kbX} y={KB0.y} s={KB0.s} glowSpace={space} />
      {space > 0.01 && (
        <g opacity={space}>
          <rect x={kbX - 128} y={KB0.y - 44} width={256} height={46} rx={18} fill="none" stroke={K.saffron} strokeWidth={12} />
          <rect x={kbX - 128} y={KB0.y - 44} width={256} height={46} rx={18} fill="none" stroke={INK} strokeWidth={3} opacity={0.5} />
        </g>
      )}
      <SideHand id="vb-ph" x={STOCCO_WRIST.x} y={STOCCO_WRIST.y} s={1.72} dir={-1} side="thumb" pose={pose} skin={K.stoccoSkin} sleeve={K.stoccoSleeve} arm={560} armAng={-8} />
    </g>
  );
};

// ---------------------------------------------------------------- the ordinary desk (stage, front elevation)
const SD = {x0: -560, x1: 560, y: 822, d: 132, h: 270};
const S_MON = {x: -70, y: 760, s: 0.66};
const S_KB = {x: -60, y: 812, s: 0.72};
/** a tossed prop: flies in on an arc and lands with a small squash-and-bounce */
const toss = (t: number, t0: number, t1: number, from: {x: number; y: number}, to: {x: number; y: number}, h: number) => {
  if (t < t0) return {x: from.x, y: from.y, sq: 0, rot: 0, k: 0};
  const u = clamp((t - t0) / (t1 - t0));
  const e = easeOut(u);
  const x = lerp(from.x, to.x, e);
  const y = lerp(from.y, to.y, u * u) - h * Math.sin(Math.PI * u) * (1 - u * 0.2);
  const after = t - t1;
  const sq = after > 0 ? Math.exp(-after * 9) * Math.sin(after * 30) * 0.08 : 0;
  const rot = u < 1 ? (1 - u) * (from.x < to.x ? -10 : 10) : 0;
  return {x, y, sq, rot, k: 1};
};
const Stage: React.FC<{t: number; f: number; glare: number}> = ({t, f, glare}) => {
  const tEq = T('the equipment');
  const kb = toss(t, T_STAGE - 0.02, T_STAGE + 0.36, {x: 1500, y: 640}, S_KB, 160);
  const mon = toss(t, tEq - 0.25, tEq + 0.2, {x: -1500, y: 560}, S_MON, 220);
  const tDesk = T('desk') + 0.03;
  const chairK = clamp((t - (tDesk - 0.7)) / 0.7);
  const chairX = lerp(1400, 300, easeOut(chairK));
  const after = t - tDesk;
  const chairRock = after > 0 ? Math.sin(after * 16) * 4 * Math.exp(-after * 4) : 0;
  const deskJolt = after > 0 && after < 0.4 ? Math.sin(after * 40) * 3 * Math.exp(-after * 10) : 0;
  return (
    <g>
      <defs>
        <linearGradient id="vb-sw" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={lit(K.cream, 0.1)} />
          <stop offset="1" stopColor="#F1E6CF" />
        </linearGradient>
      </defs>
      <rect x={-3000} y={-1000} width={6000} height={2090} fill="url(#vb-sw)" />
      <rect x={-3000} y={560} width={6000} height={26} fill="#E2D3B5" />
      <rect x={-3000} y={1090} width={6000} height={800} fill="#D8CBB4" />
      <path d="M-3000,1090 L3000,1090" stroke={INK} strokeWidth={5} opacity={0.5} />
      {/* a light switch and a framed print: an ordinary office */}
      <rect x={760} y={420} width={50} height={80} rx={8} fill="#FBF6EA" stroke={INK} strokeWidth={4} />
      <rect x={-900} y={110} width={260} height={190} rx={6} fill="#FFFFFF" stroke={INK} strokeWidth={6} />
      <path d="M-870,270 L-800,190 L-750,240 L-700,170 L-670,270 Z" fill={K.green} opacity={0.6} />
      <g transform={`translate(0 ${fmt(deskJolt)})`}>
        <PlainDesk id="vb-sdesk" x0={SD.x0} x1={SD.x1} y={SD.y} d={SD.d} h={SD.h} />
        {mon.k > 0 && (
          <g transform={`translate(${fmt(mon.x)} ${fmt(mon.y)}) rotate(${fmt(mon.rot)}) scale(${fmt(1 + mon.sq)} ${fmt(1 - mon.sq)}) translate(${fmt(-mon.x)} ${fmt(-mon.y)})`}>
            <MonitorV2 id="vb-smon" x={mon.x} y={mon.y} s={S_MON.s} glare={glare} edge={glare}>
              <GameScreen t={t} events={[]} />
            </MonitorV2>
          </g>
        )}
        {kb.k > 0 && (
          <g transform={`translate(${fmt(kb.x)} ${fmt(kb.y)}) rotate(${fmt(kb.rot)}) scale(${fmt(1 + kb.sq)} ${fmt(1 - kb.sq)}) translate(${fmt(-kb.x)} ${fmt(-kb.y)})`}>
            <Keyboard id="vb-skb" x={kb.x} y={kb.y} s={S_KB.s} />
          </g>
        )}
      </g>
      {chairK > 0 && <OfficeChair x={chairX} y={SD.y + SD.h + 26} s={0.95} rock={chairRock} spin={chairX / 30} />}
    </g>
  );
};
const stageCam = (t: number): CamS => {
  const g = fullGameCam(S_MON);
  return camPath(t, [
    [T_STAGE, {x: 240, y: 700, z: 1.12}],
    [T_STAGE + 0.5, {x: 150, y: 690, z: 1.08}, easeOut],
    [T('the equipment') + 0.3, {x: 20, y: 660, z: 0.9}],
    [T('sitting'), {x: 80, y: 670, z: 0.86}],
    [T('desk') + 0.1, {x: 90, y: 680, z: 0.88}, lin1],
    [T('Rao’s job') - 0.35, {x: 20, y: 650, z: 0.93}],
    [T_GAME - 0.25, {...g, z: g.z * 0.62}, easeIn],
    [T_GAME, {...g, z: g.z * 1.06}, lin1],
  ]);
};

// ---------------------------------------------------------------- Rao's hand on an empty desk (no fire button)
const RH_MON = {x: 1250, y: 560, s: 1.0};
const RaoHandDesk: React.FC<{t: number; glare: number; spot: number}> = ({t, glare, spot}) => (
  <g>
    <defs>
      <linearGradient id="vb-rw" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={lit(K.raoWall, 0.25)} />
        <stop offset="1" stopColor={K.raoWall} />
      </linearGradient>
      <linearGradient id="vb-rt" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={shade(K.deskTop, 0.12)} />
        <stop offset="1" stopColor={lit(K.deskTop, 0.12)} />
      </linearGradient>
    </defs>
    <rect x={-2000} y={-1200} width={6000} height={1800} fill="url(#vb-rw)" />
    <rect x={-2000} y={470} width={6000} height={26} fill={K.raoWallDeep} />
    <path d="M-2000,520 L4000,520 L4000,2000 L-2000,2000 Z" fill="url(#vb-rt)" stroke={INK} strokeWidth={6} />
    <path d="M-2000,520 L4000,520" stroke={lit(K.deskTop, 0.35)} strokeWidth={8} />
    <MonitorV2 id="vb-rhmon" x={RH_MON.x} y={RH_MON.y} s={RH_MON.s} glare={glare} edge={glare}>
      <GameScreen t={t} events={[]} />
    </MonitorV2>
    {/* the empty spot where a fire button would be */}
    {spot > 0.01 && (
      <g opacity={spot}>
        <path d="M1010,840 L1450,840 L1490,930 L970,930 Z" fill="#FFFFFF" fillOpacity={0.25} stroke={INK} strokeWidth={7} strokeDasharray="26 18" strokeLinejoin="round" />
        <path d="M1130,894 L1330,894 L1338,914 L1122,914 Z" fill="none" stroke={INK} strokeWidth={5} strokeDasharray="12 10" opacity={0.8} />
      </g>
    )}
    <SideHand id="vb-rh" x={360} y={790} s={2.0} dir={1} side="pinky" pose={FLAT} skin={K.raoSkin} sleeve={K.raoSleeve} arm={600} armAng={6} contact={1} surfaceY={56} />
  </g>
);

/** what the glasses reflect: a close crop of the game around whatever is flying (plane, then rocket) */
const LensCrop: React.FC<{t: number}> = ({t}) => {
  const ev = EV_LENS();
  const live = ev.find((e) => t >= e.t0 && t < e.t0 + e.dur) ?? ev[0];
  const p = arcPt(clamp((t - live.t0) / live.dur));
  return (
    <g transform={`translate(320 200) scale(2.6) translate(${fmt(-p.x)} ${fmt(-p.y)})`}>
      <GameScreen t={t} events={ev} />
    </g>
  );
};

// ---------------------------------------------------------------- the sequence
export const VB: React.FC<{f: number}> = ({f}) => {
  const t = f / FPS;
  const ev = EVB();

  // ---- 1. Rao's lab (the campus camera continues from A)
  if (t < T_STO) {
    const cam = cwCam(t);
    const head = toScr(cam, {x: -880 + RAO_HEAD.x / 3, y: 300 + (RAO_HEAD.y - 120) / 3});
    const tagK = clamp((t - (T('Rajesh Rao') + 0.15)) / 0.3) * (1 - clamp((t - (T('screen') + 0.05)) / 0.3));
    const glow = clamp((t - (T('screen') - 0.1)) / 0.25);
    return (
      <g>
        <CampusAB f={f} id="vb" monGlow={glow} />
        <Tag x={head.x} y={Math.max(110, head.y - 60)} text="Rajesh Rao" size={48} k={tagK} />
      </g>
    );
  }
  // ---- 2. Stocco's lab from behind: the bare wall where a screen would be
  if (t < T_HAND) {
    const cam = camPath(t, [
      [T_STO, {x: GHOST.x, y: GHOST.y, z: 2.55}],
      [T_STO + 0.2, {x: GHOST.x - 10, y: GHOST.y + 8, z: 2.45}, lin1],
      [T_HAND - 0.12, {x: 1080, y: 520, z: 1.22}],
      [T_HAND, {x: 1110, y: 540, z: 1.25}, lin1],
    ]);
    const ghost = 1 - clamp((t - (T_STO + 0.35)) / 0.4);
    const tagK = clamp((t - (T('Andrea Stocco') + 0.05)) / 0.3);
    const hd = toScr(cam, {x: 960, y: 170});
    return (
      <g>
        <RoomShot cam={cam}>
          <StoccoRoom id="vb-sto2" f={f} ghostScreen={ghost} />
        </RoomShot>
        <Tag x={clamp(hd.x, 260, 1660)} y={Math.max(110, hd.y)} text="Andrea Stocco" size={48} k={tagK} />
      </g>
    );
  }
  // ---- 3. his hand over the space bar; the keyboard is yanked out from under it
  if (t < T_STAGE) {
    const ty = T_YANK();
    const yk = clamp((t - ty) / 0.24);
    const kbX = KB0.x - 2300 * easeIn(yk);
    const cam = camPath(t, [
      [T_HAND, {x: 520, y: 700, z: 1.45}],
      [ty, {x: 470, y: 730, z: 1.62}],
      [T_STAGE, {x: 160, y: 730, z: 1.6}, easeIn],
    ]);
    const space = clamp((t - (T('space bar') - 0.05)) / 0.2) * (1 - clamp((t - (ty - 0.2)) / 0.2));
    const twitch = t > ty + 0.05 ? Math.exp(-(t - ty - 0.05) * 8) * Math.sin((t - ty - 0.05) * 30) : 0;
    return (
      <g>
        <RoomShot cam={cam}>
          <ProfileDesk t={t} kbX={kbX} space={space} twitch={twitch * 0.5} />
        </RoomShot>
      </g>
    );
  }
  // ---- 4. the ordinary desk
  if (t < T_GAME) {
    const cam = stageCam(t);
    return (
      <RoomShot cam={cam}>
        <Stage t={t} f={f} glare={clamp((3.6 - cam.z * S_MON.s) / 1.2)} />
      </RoomShot>
    );
  }
  // ---- 5. the game: the city, the plane
  if (t < T_RAO1) {
    const tp = T_PLANE();
    const pu = clamp((t - tp) / 2.5);
    const pp = arcPt(pu);
    const cam = camPath(t, [
      [T_GAME, {x: 320, y: 200, z: 3.18}],
      [T_GAME + 0.5, {x: 360, y: 250, z: 3.5}, easeOut],
      [T('little city') + 0.1, {x: 500, y: 250, z: 3.6}],
      [tp - 0.05, {x: 200, y: 250, z: 3.5}],
      [T_RAO1, {x: pp.x + 30, y: pp.y + 40, z: 3.7}, easeOut],
    ]);
    const follow = t > tp ? camLerp(cam, {x: pp.x + 30, y: pp.y + 50, z: 3.7}, easeInOut(clamp((t - tp) / 0.5))) : cam;
    const tagK = clamp((t - (tp + 0.25)) / 0.3);
    const tg = toScr(follow, {x: pp.x, y: pp.y + 52});
    return (
      <g>
        <GameShot cam={follow} t={t} events={ev} />
        <Tag x={tg.x} y={tg.y} text="supply plane" size={44} k={tagK} fill="#E3F4EC" />
      </g>
    );
  }
  // ---- 6. Rao watches it through (hands still)
  if (t < T_GAME2()) {
    const cam = camPath(t, [
      [T_RAO1, {x: 930, y: 520, z: 1.42}],
      [T_GAME2(), {x: 1010, y: 500, z: 1.52}, lin1],
    ]);
    const pu = clamp((t - T_PLANE()) / 2.5);
    return (
      <RoomShot cam={cam}>
        <RaoRoom id="vb-rao2" f={f} screen={<GameWorld id="vb" t={t} events={ev} />} face={{lookX: 0.85, lookY: lerp(0.0, -0.5, Math.sin(Math.PI * pu)), mouth: 'smile', brows: 0.15}} lens={1} lensContent={<GameScreen t={t} events={ev} />} />
      </RoomShot>
    );
  }
  // ---- 7. the plane arrives; then the ship, the rocket on the same arc
  if (t < T_ECU) {
    const okK = clamp((t - (T_PLANE() + 2.5)) / 0.2) * (1 - clamp((t - (T_SHIP - 0.1)) / 0.25));
    const ru = clamp((t - T_ROCKET) / 3.4);
    const rp = arcPt(ru);
    const cam = camPath(t, [
      [T_GAME2(), {x: 470, y: 230, z: 3.3}],
      [T_SHIP, {x: 430, y: 225, z: 3.2}, lin1],
      [T_ROCKET - 0.05, {x: 175, y: 285, z: 4.6}],
      [T_ECU, {x: rp.x + 40, y: rp.y + 40, z: 3.7}, easeInOut],
    ]);
    const ghostK = clamp((t - (T_ROCKET + 0.15)) / 0.3);
    const tagK = clamp((t - (T('rocket') + 0.0)) / 0.25);
    const okP = toScr(cam, {x: 560, y: 228});
    const tagP = toScr(cam, {x: 300, y: 64});
    return (
      <g>
        <GameShot cam={cam} t={t} events={ev}>
          <ArcGhost k={ghostK} u0={0} u1={1} w={3} />
        </GameShot>
        {okK > 0.01 && (
          <g transform={`translate(${fmt(okP.x)} ${fmt(okP.y)}) scale(${fmt(0.7 + 0.3 * okK)})`} opacity={okK}>
            <circle r={44} fill={K.green} stroke={INK} strokeWidth={6} />
            <path d="M-20,0 L-6,15 L22,-15" fill="none" stroke="#FFFFFF" strokeWidth={10} strokeLinecap="round" strokeLinejoin="round" />
          </g>
        )}
        <Tag x={tagP.x} y={Math.max(110, tagP.y)} text="same path" size={42} k={tagK} />
      </g>
    );
  }
  // ---- 8. "Shoot it down": the finger is driven down (ECU) ...
  if (t < T_FIRE) {
    const st = jerkState(t, T_ECU, T_HIT);
    const drive = clamp((t - T_ECU) / 0.15) + (t > T_ECU + 0.15 ? (t - T_ECU - 0.15) * 1.4 : 0);
    return (
      <g>
        <rect x={0} y={0} width={1920} height={1080} fill={K.stoccoWall} />
        <World cam={ECU_CAM}>
          <rect x={-3000} y={-2000} width={8000} height={2900} fill={K.stoccoWall} />
          <FingerECU id="vb-ecu" pose={st.pose} press={st.press} keyGlow={t >= T_HIT ? 1 : 0} drive={drive} />
        </World>
      </g>
    );
  }
  // ---- 9. ... CUT ON THE CLICK: the cannon fires, the rocket bursts
  if (t < T_STO2) {
    const m = shotPos(ev[1], T_FIRE).muzzle;
    const pad = toScr(ECU_CAM, padPt(pressPose(1)));
    const c0 = camAt(m, pad, 3.7);
    const cam = camLerp(c0, {x: 360, y: 210, z: 3.3}, easeOut(clamp((t - T_FIRE) / 0.85)));
    return <GameShot cam={cam} t={t} events={ev} />;
  }
  // ---- 10. "Easy enough": Stocco never saw any of it
  if (t < T_RAOF()) {
    const cam = camPath(t, [
      [T_STO2, {x: 1060, y: 470, z: 1.18}],
      [T_RAOF(), {x: 1010, y: 420, z: 1.36}, lin1],
    ]);
    return (
      <RoomShot cam={cam}>
        <StoccoRoom id="vb-sto3" f={f} space={clamp(1 - (t - T_STO2) / 0.5) * 0.8} />
      </RoomShot>
    );
  }
  // ---- 11. the only person who could see the difference
  if (t < T_RHAND()) {
    const cam = camPath(t, [
      [T_RAOF(), {x: RAO_HEAD.x + 40, y: RAO_HEAD.y + 20, z: 2.5}],
      [T_RHAND(), {x: RAO_HEAD.x + 10, y: RAO_HEAD.y - 4, z: 3.6}, easeInOut],
    ]);
    const lk = 1;
    return (
      <RoomShot cam={cam}>
        <RaoRoom id="vb-rao3" f={f} screen={<GameWorld id="vb" t={t} events={EV_LENS()} />} face={{lookX: 0.85, lookY: 0.05, mouth: 'flat', brows: 0.2}} lens={lk} lensContent={<LensCrop t={t} />} />
      </RoomShot>
    );
  }
  // ---- 12. no way to press fire himself -> into his screen (GAME_FULL at T_END)
  if (t < T_END - 1e-6) {
    const fin = fullGameCam(RH_MON);
    const cam = camPath(t, [
      [T_RHAND(), {x: 760, y: 700, z: 1.32}],
      [T('press fire') + 0.1, {x: 1060, y: 760, z: 1.28}],
      [T('himself') + 0.05, {x: 1110, y: 700, z: 1.3}, lin1],
      [T_END - 0.3, {...fin, z: fin.z * 1.03}, easeInOut],
      [T_END - 0.1, fin, easeInOut],
    ]);
    const spot = clamp((t - (T('no way') - 0.05)) / 0.3);
    const glare = clamp((2.6 - cam.z) / 0.5);
    return (
      <RoomShot cam={cam}>
        <RaoHandDesk t={t} glare={glare} spot={spot * (1 - clamp((t - (T('himself') + 0.3)) / 0.3))} />
      </RoomShot>
    );
  }
  return (
    <g>
      <rect x={0} y={0} width={1920} height={1080} fill="#9FD3EC" />
      <g transform={GAME_FULL}>
        <GameScreen t={t} events={[]} />
      </g>
    </g>
  );
};

/** sound cues (gain dB) */
export const CUES_VB = (): {t: number; kind: string; gain?: number; dur?: number}[] => {
  const ev = EVB();
  return [
    {t: T('screen') - 0.05, kind: 'tick', gain: -12},
    {t: T('Andrea Stocco') + 0.05, kind: 'pop', gain: -12},
    {t: T('space bar') - 0.02, kind: 'tick', gain: -9},
    {t: T_YANK(), kind: 'whoosh', gain: -7, dur: 0.35},
    {t: T_STAGE + 0.36, kind: 'tick', gain: -6},
    {t: T('the equipment') + 0.2, kind: 'tick', gain: -6},
    {t: T('desk') + 0.03, kind: 'tick', gain: -3},
    {t: T_GAME - 0.25, kind: 'whoosh', gain: -11, dur: 0.4},
    {t: ev[0].t0, kind: 'plane_pass', gain: -5, dur: ev[0].dur},
    {t: ev[0].t0 + ev[0].dur, kind: 'pop', gain: -9},
    {t: ev[1].t0, kind: 'rocket_launch', gain: -5},
    {t: T_HIT, kind: 'key_click', gain: 0},
    {t: T_FIRE, kind: 'cannon', gain: 0},
    {t: T_FIRE + 0.32, kind: 'boom', gain: 0},
    {t: T('no way') + 0.1, kind: 'pop', gain: -12},
    {t: T('himself') + 0.1, kind: 'whoosh', gain: -12, dur: 1.1},
  ];
};
