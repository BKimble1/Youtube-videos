// Sequence C, part 3 (~74.8 -> 90.0 s): the money shot and the payoff.
//  - Hand ECU (FingerECU): the drive glow arrives along the back of the hand, the wrist is yanked UP (F_JERK on a
//    stiff spring with overshoot and a decaying tremor), then the hand drops; the pad meets the space bar exactly
//    (solved geometrically each frame) and the key travels down with it.
//  - Match-cut on the bottom of the key travel to the cannon firing in Rao's game; the camera rides the shot in slow
//    motion to the rocket, which bursts on "shoots".
//  - Pull back out of the screen past Rao's shoulder (foreground occlusion): the smoke clears on his screen.
//  - Truck right through a building edge (near-layer wipe) to Stocco, facing camera, puzzled by his twitching right
//    hand (felt like a nervous tic).
//  - Reverse angle behind Stocco: he faces a blank wall. The camera pushes over his shoulder into the empty port of
//    the network wall plate... and lands inside the game he never sees (GAME_FULL, the C->D contract).
import React from 'react';
import {lit, shade} from '../dc/color';
import {Inked} from '../dc/ink';
import {clamp, easeIn, easeInOut, easeOut, fmt, lerp, smooth} from '../dc/math';
import {Capsule} from '../dc/shade';
import {arcPt, CANNON, GameScreen} from '../art/game';
import {CrewChar, IDLE, mixPose, Pose, reachLocal} from '../art/crew';
import {Earbuds, STOCCO, SwimCap} from '../art/people';
import {FONT_HEAD, INK, K, Keyboard, Monitor, RoundCoil, Tag} from '../art/kit';
import {CamS, sp} from './core2';
import {Depth} from './Depth';
import {F_DOWN, F_HOVER, F_JERK, FingerECU, FPose, KEY, keyTopY, mixF, padPt} from './finger';
import {camPath, camT} from './c_cam';
import {CursorWin, gameEvents} from './c_rao';
import {ct, cursorAt, G_DUR, G_FIRE, gameClock} from './c_time';

// ---------------------------------------------------------------- the hand ECU
/** the DOWN pose pushed through the key travel, solved so the pad stays exactly on the moving cap */
const pressExact = (press: number): FPose => {
  const want = keyTopY(press);
  let lo = 0, hi = 4;
  for (let i = 0; i < 22; i++) {
    const mid = (lo + hi) / 2;
    if (padPt({...F_DOWN, wrist: F_DOWN.wrist + mid}).y < want) lo = mid;
    else hi = mid;
  }
  return {...F_DOWN, wrist: F_DOWN.wrist + (lo + hi) / 2};
};
/** the wrist pose that brings the pad to height y (between the jerk and the contact), for a gravity-like drop */
export const ecuState = (t: number, f: number) => {
  const c = ct();
  const press = t < c.contact ? 0 : clamp((t - c.contact) / (2 / 30));
  // the involuntary jerk: a stiff spring toward the extension, with overshoot, then a decaying tremor while held,
  // and a slight sag as the stimulated muscles let go just before the hand falls
  const upAt = (tt: number) => {
    const ff = tt * 30;
    const k = sp(ff, c.jerk, {damping: 16, stiffness: 620});
    const held = tt - c.jerk;
    const trem = held > 0.16 ? Math.exp(-(held - 0.16) * 3.2) * Math.sin((held - 0.16) * 26) * 0.09 : 0;
    const sag = 0.16 * smooth(clamp((held - 0.35) / 0.5));
    return mixF(F_HOVER, F_JERK, k + trem - sag);
  };
  let pose: FPose;
  if (t < c.drop) pose = upAt(t);
  else if (t < c.contact) {
    // the hand falls (accelerating) from wherever the jerk left it onto the key
    const u = clamp((t - c.drop) / (c.contact - c.drop));
    pose = mixF(upAt(c.drop), F_DOWN, easeIn(u) * 0.85 + u * 0.15);
  } else pose = pressExact(press);
  const drive = t < c.ecu ? -1 : (t - c.ecu) / 0.3;
  const keyGlow = t >= c.contact ? 1 - clamp((t - c.contact - 0.05) / 0.4) : 0;
  return {pose, press, drive, keyGlow};
};
export const EcuShot: React.FC<{t: number; f: number}> = ({t, f}) => {
  const c = ct();
  const st = ecuState(t, f);
  const START: CamS = {x: KEY.x + 70, y: 735, z: 1.05};
  const UP: CamS = {x: KEY.x + 120, y: 585, z: 0.86};
  const DOWNC: CamS = {x: KEY.x + 60, y: 725, z: 1.0};
  const cam = camPath(t, [
    [c.ecu, START],
    [c.jerk, {...START, z: 1.07}],
    [c.jerk + 0.3, UP, easeOut],
    [c.drop, {...UP, y: 600, z: 0.93}],
    [c.contact, DOWNC, easeIn],
    [c.cut, {...DOWNC, z: 1.03}],
  ]);
  const invK = clamp((t - (c.jerk + 0.12)) / 0.2) * (1 - clamp((t - (c.drop + 0.05)) / 0.2));
  return (
    <g>
      <defs>
        <linearGradient id="vc-ecu-wall" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={lit(K.stoccoWall, 0.25)} />
          <stop offset="1" stopColor={K.stoccoWall} />
        </linearGradient>
      </defs>
      <rect x={0} y={0} width={1920} height={1080} fill="url(#vc-ecu-wall)" />
      <g transform={camT(cam)}>
        <FingerECU id="vc-ecu" pose={st.pose} press={st.press} keyGlow={st.keyGlow} drive={st.drive} />
      </g>
      <Tag x={430} y={150} text="involuntary" size={48} k={invK} />
    </g>
  );
};

// ---------------------------------------------------------------- the game, Rao's shoulder, the truck to Stocco
const SCR = {x: 830, y: 190}; // Rao's screen (O world), game units 1:1
const OMON = {x: SCR.x + 320, y: SCR.y + 510};
const SX = 2600; // Stocco's room offset in the O world
const gameO = (p: {x: number; y: number}) => ({x: SCR.x + p.x, y: SCR.y + p.y});
const FLY = 0.32;
const shotGeo = () => {
  const uHit = (G_FIRE + FLY) / G_DUR;
  const hp = arcPt(uHit);
  const want = Math.atan2(hp.y - CANNON.y, hp.x - CANNON.x);
  const m0 = {x: CANNON.x + Math.cos(want) * 50, y: CANNON.y + Math.sin(want) * 50};
  return {hp, m0};
};
const ballAt = (g: number) => {
  const {hp, m0} = shotGeo();
  const k = clamp((g - G_FIRE) / FLY);
  return {x: m0.x + (hp.x - CANNON.x) * k, y: m0.y + (hp.y - CANNON.y) * k};
};
const OS: CamS = {x: 900, y: 500, z: 1.0};
/** keep a camera framed inside Rao's screen (no bezel) */
const inGame = (cm: CamS): CamS => {
  const hw = 960 / cm.z, hh = 540 / cm.z;
  return {...cm, x: clamp(cm.x, SCR.x + hw, SCR.x + 640 - hw), y: clamp(cm.y, SCR.y + hh, SCR.y + 400 - hh)};
};
export const oCam = (t: number): CamS => {
  const c = ct();
  const g = gameClock(t);
  const {hp} = shotGeo();
  if (t < c.hit) {
    // ride the cannonball: start framed on the cannon, follow the ball up, widening to hold the rocket
    const u = clamp((t - c.cut) / (c.hit - c.cut));
    const b = gameO(ballAt(g));
    const c0 = gameO({x: CANNON.x + 40, y: CANNON.y - 12});
    const follow = smooth(clamp((u - 0.05) / 0.5));
    return inGame({x: lerp(c0.x, b.x + 20, follow), y: lerp(c0.y, b.y + 30, follow), z: lerp(7.2, 4.6, smooth(u))});
  }
  if (t < c.hit + 0.5) {
    const H = gameO({x: hp.x + 20, y: hp.y + 30});
    return inGame(camPath(t, [[c.hit, {...H, z: 4.6}], [c.hit + 0.5, {...H, z: 4.0}]]));
  }
  const H = gameO({x: hp.x + 20, y: hp.y + 30});
  const S1: CamS = {x: SX + 930, y: 520, z: 1.0};
  const S2: CamS = {x: SX + 880, y: 430, z: 1.34};
  return camPath(t, [
    [c.hit + 0.5, inGame({...H, z: 4.0})],
    [c.disappears + 0.15, OS],
    [c.raoScreenE - 0.1, {...OS, x: 940, z: 1.07}],
    [c.described + 0.05, S1],
    [c.ticE + 0.55, S2],
  ]);
};

/** Rao from behind (near layer, authored for the OS framing at d = 1.3) */
const RaoBack: React.FC<{t: number}> = ({t}) => {
  const c = ct();
  const relief = smooth(clamp((t - (c.disW - 0.1)) / 0.6));
  const nod = Math.sin(clamp((t - c.disW) / 0.7) * Math.PI * 2) * 8 * clamp((t - c.disW) / 0.1) * (1 - clamp((t - c.disW - 0.7) / 0.1));
  const hx = 680, hy = 810 + nod + 6 * relief;
  const sk = K.raoSkin;
  const sh = 6 * relief;
  const pump = smooth(clamp((t - (c.disW + 0.25)) / 0.3)) * (1 - smooth(clamp((t - (c.raoScreenE - 0.2)) / 0.4)));
  return (
    <g>
      {/* a small fist pump with his LEFT hand (frame left from behind) as the rocket goes */}
      {pump > 0.01 && (() => {
        const sh0 = {x: hx - 250, y: 990 + sh};
        const el = {x: hx - 320, y: lerp(1180, 910, pump)};
        const fi = {x: hx - 255, y: lerp(1250, 770, pump) + 14 * Math.sin(clamp((t - c.disW - 0.35) / 0.5) * Math.PI * 3) * pump};
        return (
          <g>
            <Inked w={7}>
              <Capsule id="vc-rb-ua" a={sh0} b={el} ra={52} rb={46} color={K.raoSleeve} />
              <Capsule id="vc-rb-fa" a={el} b={fi} ra={40} rb={36} color={sk} />
            </Inked>
            <circle cx={fi.x} cy={fi.y} r={50} fill={sk} stroke={INK} strokeWidth={7} />
            <path d={`M${fi.x - 30},${fi.y - 20} Q${fi.x},${fi.y - 34} ${fi.x + 30},${fi.y - 20}`} fill="none" stroke={shade(sk, 0.35)} strokeWidth={5} strokeLinecap="round" />
          </g>
        );
      })()}
      {/* shoulders and back (blue shirt) */}
      <path d={`M${hx - 360},1300 L${hx - 340},${1040 + sh} Q${hx - 320},${960 + sh} ${hx - 160},${942 + sh} L${hx + 160},${942 + sh} Q${hx + 320},${960 + sh} ${hx + 340},${1040 + sh} L${hx + 360},1300 Z`} fill={K.raoSleeve} stroke={INK} strokeWidth={7} strokeLinejoin="round" />
      <path d={`M${hx - 300},${1010 + sh} Q${hx - 200},${975 + sh} ${hx - 90},${972 + sh}`} fill="none" stroke={lit(K.raoSleeve, 0.3)} strokeWidth={14} strokeLinecap="round" opacity={0.6} />
      <rect x={hx - 52} y={hy + 60} width={104} height={110} fill={shade(sk, 0.12)} stroke={INK} strokeWidth={6} />
      {/* ears + glasses temples */}
      {[-1, 1].map((s) => (
        <g key={s}>
          <ellipse cx={hx + s * 118} cy={hy + 14} rx={20} ry={32} fill={shade(sk, 0.06)} stroke={INK} strokeWidth={6} />
          <path d={`M${hx + s * 112},${hy - 10} L${hx + s * 128},${hy + 6}`} stroke={INK} strokeWidth={6} strokeLinecap="round" />
        </g>
      ))}
      {/* head: hair at the nape, then the EEG cap with its electrodes and cable bundle */}
      <ellipse cx={hx} cy={hy} rx={118} ry={128} fill={sk} stroke={INK} strokeWidth={7} />
      <path d={`M${hx - 112},${hy + 30} Q${hx},${hy + 80} ${hx + 112},${hy + 30} L${hx + 100},${hy + 76} Q${hx},${hy + 118} ${hx - 100},${hy + 76} Z`} fill="#1E1A1A" />
      <path d={`M${hx - 120},${hy + 34} Q${hx - 126},${hy - 140} ${hx},${hy - 136} Q${hx + 126},${hy - 140} ${hx + 120},${hy + 34} Q${hx},${hy + 66} ${hx - 120},${hy + 34} Z`} fill="#3B4A57" stroke={INK} strokeWidth={7} strokeLinejoin="round" />
      {[[-70, -60], [-24, -96], [24, -96], [70, -60], [-90, 0], [-34, -36], [34, -36], [90, 0], [0, 10], [-50, 30], [50, 30]].map(([x, y], i) => (
        <circle key={i} cx={hx + x} cy={hy + y} r={13} fill="#D9DEE2" stroke={INK} strokeWidth={4} />
      ))}
      <path d={`M${hx + 40},${hy + 50} Q${hx + 90},${hy + 160} ${hx + 230},${hy + 200}`} fill="none" stroke={INK} strokeWidth={16} strokeLinecap="round" />
      <path d={`M${hx + 40},${hy + 50} Q${hx + 90},${hy + 160} ${hx + 230},${hy + 200}`} fill="none" stroke="#3B4A57" strokeWidth={9} strokeLinecap="round" />
    </g>
  );
};

/** Rao's side of the O world (mid layer): the wall, desk, monitor with the game */
const RaoDesk: React.FC<{t: number}> = ({t}) => {
  const g = gameClock(t);
  return (
    <g>
      <defs>
        <linearGradient id="vc-o-wall" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={lit(K.raoWall, 0.28)} />
          <stop offset="1" stopColor={K.raoWall} />
        </linearGradient>
      </defs>
      <rect x={-1200} y={-600} width={3300} height={1340} fill="url(#vc-o-wall)" />
      <rect x={-1200} y={700} width={3300} height={26} fill={K.raoWallDeep} />
      <rect x={180} y={120} width={300} height={200} rx={8} fill="#E9D8B8" stroke={INK} strokeWidth={6} />
      <rect x={212} y={150} width={90} height={70} fill="#FFFFFF" stroke={INK} strokeWidth={4} transform="rotate(-4 257 185)" />
      <rect x={330} y={160} width={100} height={110} fill={K.blueLight} stroke={INK} strokeWidth={4} transform="rotate(5 380 215)" />
      <path d="M-1200,726 L2100,726 L2100,1700 L-1200,1700 Z" fill={K.deskTop} stroke={INK} strokeWidth={6} />
      <Monitor id="vc-omon" x={OMON.x} y={OMON.y} s={1}>
        <GameScreen t={g} events={gameEvents()} />
        <CursorWin cursor={cursorAt(t)} k={1} hit={0} />
        {(() => {
          const k = clamp((t - (ct().disW + 0.15)) / 0.25) * (1 - clamp((t - (ct().raoScreenE + 0.3)) / 0.3));
          return k > 0.01 ? (
            <g transform={`translate(520 200) scale(${fmt(0.7 + 0.3 * easeOut(k))})`} opacity={k}>
              <circle r={32} fill={K.green} stroke={INK} strokeWidth={5} />
              <path d="M-15,0 L-4,12 L16,-12" fill="none" stroke="#FFFFFF" strokeWidth={8} strokeLinecap="round" strokeLinejoin="round" />
            </g>
          ) : null;
        })()}
      </Monitor>
      <rect x={1600} y={500} width={190} height={260} rx={14} fill="#D9DEE2" stroke={INK} strokeWidth={6} />
      <rect x={1622} y={524} width={146} height={92} rx={8} fill={K.screenDark} stroke={INK} strokeWidth={4} />
      {/* the right wall of Rao's lab ends here; outside is campus */}
      <rect x={2100} y={-600} width={60} height={2300} fill={shade(K.raoWall, 0.3)} stroke={INK} strokeWidth={6} />
    </g>
  );
};

/** Stocco facing camera (mid layer, offset SX): he looks at his right hand as it twitches */
const StoccoFront: React.FC<{t: number; f: number}> = ({t, f}) => {
  const c = ct();
  const raise = smooth(clamp((t - (c.described + 0.05)) / 0.55)) * (1 - smooth(clamp((t - (c.ticE + 0.35)) / 0.5)));
  const tw = (a: number) => {
    const d = t - a;
    return d > 0 && d < 0.32 ? Math.sin((d / 0.32) * Math.PI) * Math.exp(-d * 6) : 0;
  };
  const twitch = tw(c.something - 0.1) + tw(c.nervous + 0.05) + 0.7 * tw(c.nervous + 0.42);
  const X = SX + 1000, GY = 1090, S = 2.1;
  const rest = {x: -96, y: -128};
  const look = {x: -112, y: -326};
  const target = {x: lerp(rest.x, look.x, raise), y: lerp(rest.y, look.y, raise) - 28 * twitch};
  const down: Pose = {...IDLE, armL: reachLocal(rest.x, rest.y, -1), armR: {a: 8, b: 8}, lookX: 0, lookY: 0.15, brows: 0, mouth: 'flat'};
  const looking: Pose = {...down, armL: reachLocal(target.x, target.y, -1), lookX: -0.95, lookY: 0.25, brows: 0.45, browAsym: 0.9, mouth: 'hmm', tilt: -6};
  const pose = mixPose(down, looking, raise > 0.02 ? 1 : 0);
  pose.armL = reachLocal(target.x, target.y, -1);
  pose.brows = 0.45 * raise + 0.25 * twitch;
  pose.lookX = -0.95 * raise;
  pose.tilt = -6 * raise;
  const gear = (
    <>
      <SwimCap mark={false} />
      <Earbuds />
      <g stroke="#FFFFFF" strokeWidth={4} strokeLinecap="round"><path d="M 18 -424 l 12 12 M 30 -424 l -12 12" /></g>
    </>
  );
  const hw = {x: X + target.x * S, y: GY + target.y * S};
  return (
    <g>
      <defs>
        <linearGradient id="vc-sf-wall" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={lit(K.stoccoWall, 0.22)} />
          <stop offset="1" stopColor={K.stoccoWall} />
        </linearGradient>
      </defs>
      <rect x={SX - 440} y={-600} width={3000} height={1340} fill="url(#vc-sf-wall)" />
      <rect x={SX - 440} y={-600} width={60} height={2300} fill={shade(K.stoccoWall, 0.3)} stroke={INK} strokeWidth={6} />
      <rect x={SX + 1420} y={-120} width={300} height={706} rx={8} fill="#C9A27A" stroke={INK} strokeWidth={6} />
      <rect x={SX + 1450} y={-90} width={240} height={250} rx={6} fill={shade('#C9A27A', 0.08)} stroke={INK} strokeWidth={4} />
      <rect x={SX + 1450} y={200} width={240} height={340} rx={6} fill={shade('#C9A27A', 0.08)} stroke={INK} strokeWidth={4} />
      <circle cx={SX + 1460} cy={360} r={14} fill={K.saffron} stroke={INK} strokeWidth={4} />
      <circle cx={SX + 1270} cy={110} r={60} fill="#FFFFFF" stroke={INK} strokeWidth={6} />
      <path d={`M${SX + 1270},110 L${SX + 1270},72 M${SX + 1270},110 L${SX + 1270 + 28 * Math.cos(t * 0.6)},${110 + 28 * Math.sin(t * 0.6)}`} stroke={INK} strokeWidth={6} strokeLinecap="round" />
      {/* the coil holder from frame right, the coil over his LEFT motor cortex (frame-right in a front view) */}
      <g fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path d={`M${SX + 1500},-200 L${SX + 1330},40 L${X + 172},${GY - 482 * S}`} stroke={INK} strokeWidth={30} />
        <path d={`M${SX + 1500},-200 L${SX + 1330},40 L${X + 172},${GY - 482 * S}`} stroke="#9AA7B1" strokeWidth={17} />
      </g>
      <CrewChar look={STOCCO} pose={pose} frame={f} x={X} y={GY} scale={S} front="L" pass="body" shadow={false} id="vc-stoF" seed={5} headGear={gear} life={0.5} eyeDarts={false} />
      <RoundCoil x={X + 52} y={GY - 455 * S} s={0.5} ang={-24} />
      {/* desk, keyboard */}
      <path d={`M${SX - 440},700 L${SX + 2560},700 L${SX + 2560},1700 L${SX - 440},1700 Z`} fill="#D9A773" stroke={INK} strokeWidth={6} />
      <path d={`M${SX - 440},700 L${SX + 2560},700`} stroke={lit('#D9A773', 0.35)} strokeWidth={8} />
      <Keyboard id="vc-sfkb" x={X - 40} y={872} s={1.0} />
      <CrewChar look={STOCCO} pose={pose} frame={f} x={X} y={GY} scale={S} front="L" pass="frontArm" shadow={false} id="vc-stoF2" seed={5} life={0.5} eyeDarts={false} />
      {/* twitch marks beside the hand */}
      {twitch > 0.05 && (
        <g stroke={INK} strokeWidth={6} strokeLinecap="round" opacity={clamp(twitch * 2)}>
          <path d={`M${hw.x - 80},${hw.y - 20} l-26,-10`} />
          <path d={`M${hw.x - 78},${hw.y + 14} l-28,4`} />
          <path d={`M${hw.x - 60},${hw.y - 52} l-18,-22`} />
        </g>
      )}
      <Tag x={SX + 560} y={185} text="felt like a nervous tic" size={46} k={clamp((t - (c.nervous - 0.1)) / 0.3)} />
    </g>
  );
};

/** the building edge that wipes past during the truck (near layer d = 1.6) */
const Pillar: React.FC = () => {
  const cx = 1.6 * (930 + (SX + 930)) / 2;
  const x0 = cx - 1250, w = 2500;
  return (
    <g>
      <rect x={x0} y={-200} width={w} height={1500} fill={K.brick} stroke={INK} strokeWidth={8} />
      {Array.from({length: 18}, (_, i) => (
        <line key={i} x1={x0} y1={-200 + i * 80} x2={x0 + w} y2={-200 + i * 80} stroke={shade(K.brick, 0.2)} strokeWidth={6} opacity={0.6} />
      ))}
      <rect x={x0 + 380} y={-200} width={140} height={1500} fill={K.stone} stroke={INK} strokeWidth={6} />
      <rect x={x0 + w - 520} y={-200} width={140} height={1500} fill={K.stone} stroke={INK} strokeWidth={6} />
      <rect x={x0 + 900} y={160} width={700} height={560} rx={10} fill="#BFD9E8" stroke={INK} strokeWidth={8} />
      <rect x={x0 + 900} y={160} width={700} height={560} rx={10} fill="none" stroke={K.stone} strokeWidth={26} />
      <path d={`M${x0 + 940},${200} L${x0 + 1180},${200} L${x0 + 960},${560}`} fill="#FFFFFF" opacity={0.35} />
    </g>
  );
};

export const GameRaoShot: React.FC<{t: number; f: number}> = ({t, f}) => {
  const cam = oCam(t);
  const nearK = clamp((cam.z < 2.5 ? 1 : 0));
  return (
    <g>
      <rect x={0} y={0} width={1920} height={1080} fill={K.raoWall} />
      <Depth cam={cam} d={1}>
        <RaoDesk t={t} />
        <StoccoFront t={t} f={f} />
      </Depth>
      {nearK > 0 && (
        <Depth cam={cam} d={1.3}>
          <RaoBack t={t} />
        </Depth>
      )}
      {cam.x > 1500 && cam.x < SX + 400 && (
        <Depth cam={cam} d={1.6}>
          <Pillar />
        </Depth>
      )}
    </g>
  );
};

// ---------------------------------------------------------------- the ending: behind Stocco, into the wall
const HD = {x: 960, y: 330, rx: 118, ry: 128};
const PLATE = {x: 610, y: 470};
/** the empty network port we dive into: 48 x 27 (the GAME_FULL aspect), the game drawn inside at 48/640 */
const PORT = {x: PLATE.x + 26, y: PLATE.y};
const G2 = 48 / 640;
const FINAL: CamS = {x: PORT.x, y: PORT.y, z: 3 / G2};
export const endCam = (t: number): CamS => {
  const c = ct();
  return camPath(t, [
    [c.imagine - 0.2, {x: 960, y: 500, z: 1.0}],
    [c.missing - 0.05, {x: 840, y: 470, z: 1.28}],
    [c.end - 0.04, FINAL, (u) => easeInOut(u)],
  ]);
};
const StoccoBack: React.FC<{t: number; f: number}> = ({t}) => {
  const c = ct();
  const g = gameClock(t);
  const sk = K.stoccoSkin;
  const bob = Math.sin(t * 1.4) * 1.5;
  const tw = (() => {
    const d = t - (c.controller + 0.25);
    return d > 0 && d < 0.3 ? Math.sin((d / 0.3) * Math.PI) * Math.exp(-d * 6) : 0;
  })();
  const tilt = 4 * smooth(clamp((t - (c.missing - 0.4)) / 0.8));
  return (
    <g>
      <defs>
        <linearGradient id="vc-sb-wall" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={lit(K.stoccoWall, 0.22)} />
          <stop offset="1" stopColor={K.stoccoWall} />
        </linearGradient>
        <linearGradient id="vc-sb-shirt" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor={lit(K.stoccoSleeve, 0.18)} />
          <stop offset="1" stopColor={shade(K.stoccoSleeve, 0.22)} />
        </linearGradient>
        <radialGradient id="vc-sb-cap" cx="0.35" cy="0.25" r="0.85">
          <stop offset="0" stopColor={lit(K.swimCap, 0.25)} />
          <stop offset="1" stopColor={shade(K.swimCap, 0.2)} />
        </radialGradient>
        <clipPath id="vc-sb-hclip"><ellipse cx={HD.x} cy={HD.y} rx={HD.rx} ry={HD.ry} /></clipPath>
        <clipPath id="vc-sb-port"><rect x={PORT.x - 25} y={PORT.y - 14.25} width={50} height={28.5} rx={1.5} /></clipPath>
      </defs>
      {/* the blank wall he faces */}
      <rect x={-600} y={-600} width={3200} height={1210} fill="url(#vc-sb-wall)" />
      <rect x={-600} y={584} width={3200} height={26} fill={K.stoccoWallDeep} />
      {/* the network wall plate: the cable from the TMS machine is plugged into the left port; the right port is empty */}
      <rect x={PLATE.x - 52} y={PLATE.y - 34} width={104} height={68} rx={8} fill="#F4F6F8" stroke={INK} strokeWidth={5} />
      <rect x={PORT.x - 25} y={PORT.y - 14.25} width={50} height={28.5} rx={1.5} fill="#11161B" />
      <g clipPath="url(#vc-sb-port)">
        <g transform={`translate(${fmt(PORT.x - 320 * G2)} ${fmt(PORT.y - 200 * G2)}) scale(${G2.toFixed(6)})`}>
          <GameScreen t={g} events={gameEvents()} />
        </g>
      </g>
      <rect x={PORT.x - 25} y={PORT.y - 14.25} width={50} height={28.5} rx={1.5} fill="none" stroke={INK} strokeWidth={0.8} />
      <rect x={PLATE.x - 47} y={PLATE.y - 12} width={36} height={24} rx={2} fill="#2D363D" stroke={INK} strokeWidth={3} />
      <rect x={PLATE.x - 42} y={PLATE.y - 6} width={26} height={30} rx={3} fill="#5D6B76" stroke={INK} strokeWidth={3} />
      <path d={`M${PLATE.x - 29},${PLATE.y + 24} C${PLATE.x - 30},${PLATE.y + 120} ${440},${380} ${420},${430}`} fill="none" stroke={INK} strokeWidth={13} strokeLinecap="round" />
      <path d={`M${PLATE.x - 29},${PLATE.y + 24} C${PLATE.x - 30},${PLATE.y + 120} ${440},${380} ${420},${430}`} fill="none" stroke="#5D6B76" strokeWidth={7} strokeLinecap="round" />
      {/* desk, keyboard, floor */}
      <path d="M-600,610 L2600,610 L2600,770 L-600,770 Z" fill="#D9A773" stroke={INK} strokeWidth={6} />
      <path d="M-600,610 L2600,610" stroke={lit('#D9A773', 0.35)} strokeWidth={8} />
      <rect x={-600} y={770} width={3200} height={36} fill={shade('#D9A773', 0.25)} stroke={INK} strokeWidth={5} />
      <rect x={-600} y={806} width={3200} height={900} fill="#6F5B4A" />
      <Keyboard id="vc-sbkb" x={1150} y={726} s={0.55} />
      {/* TMS unit on its cart (frame left) */}
      <g>
        <rect x={236} y={690} width={180} height={30} fill="#7E8B96" stroke={INK} strokeWidth={5} />
        <rect x={250} y={720} width={14} height={500} fill="#7E8B96" stroke={INK} strokeWidth={4} />
        <rect x={392} y={720} width={14} height={500} fill="#7E8B96" stroke={INK} strokeWidth={4} />
        <rect x={212} y={398} width={226} height={296} rx={16} fill="#D9DEE2" stroke={INK} strokeWidth={6} />
        <rect x={244} y={432} width={162} height={74} rx={8} fill={K.screenDark} stroke={INK} strokeWidth={4} />
        <text x={325} y={482} textAnchor="middle" fontFamily={FONT_HEAD} fontWeight={700} fontSize={34} fill="#7FA6B8" opacity={0.8}>READY</text>
        {[0, 1, 2].map((i) => <rect key={i} x={250 + i * 52} y={540} width={40} height={14} rx={6} fill="#B5BEC6" />)}
      </g>
      <g fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path d="M420,410 L560,70 L932,121" stroke={INK} strokeWidth={26} />
        <path d="M420,410 L560,70 L932,121" stroke="#9AA7B1" strokeWidth={14} />
      </g>
      {/* Stocco from behind */}
      <g transform={`translate(0 ${fmt(bob)})`}>
        <Inked w={7}>
          <Capsule id="vc-sb-rfa" a={{x: 1288, y: 822}} b={{x: 1232, y: 724 - 8 * tw}} ra={40} rb={34} color={K.stoccoSleeve} />
          <Capsule id="vc-sb-lfa" a={{x: 632, y: 822}} b={{x: 690, y: 728}} ra={40} rb={34} color={K.stoccoSleeve} />
        </Inked>
        <ellipse cx={1226} cy={708 - 10 * tw} rx={30} ry={22} fill={sk} stroke={INK} strokeWidth={5} />
        <rect x={918} y={400} width={84} height={110} fill={sk} stroke={INK} strokeWidth={6} />
        <path d="M650,1140 L668,650 Q676,566 770,538 L908,494 Q960,484 1012,494 L1150,538 Q1244,566 1252,650 L1270,1140 Z" fill="url(#vc-sb-shirt)" stroke={INK} strokeWidth={7} strokeLinejoin="round" />
        <Inked w={7}>
          <Capsule id="vc-sb-lua" a={{x: 724, y: 590}} b={{x: 640, y: 822}} ra={52} rb={44} color={K.stoccoSleeve} spec={0.1} />
          <Capsule id="vc-sb-rua" a={{x: 1196, y: 590}} b={{x: 1282, y: 822}} ra={52} rb={44} color={shade(K.stoccoSleeve, 0.06)} spec={0.1} />
        </Inked>
        <rect x={720} y={880} width={480} height={300} rx={40} fill="#46525C" stroke={INK} strokeWidth={7} />
        <g transform={`rotate(${fmt(tilt)} ${HD.x} ${HD.y + 120})`}>
          {[-1, 1].map((sd) => (
            <g key={sd}>
              <ellipse cx={HD.x + sd * (HD.rx - 2)} cy={HD.y + 30} rx={16} ry={28} fill={shade(sk, 0.08)} stroke={INK} strokeWidth={6} />
              <circle cx={HD.x + sd * (HD.rx + 4)} cy={HD.y + 32} r={11} fill="#F4F6F8" stroke={INK} strokeWidth={4} />
            </g>
          ))}
          <ellipse cx={HD.x} cy={HD.y} rx={HD.rx} ry={HD.ry} fill={sk} />
          <g clipPath="url(#vc-sb-hclip)">
            <path d={`M${HD.x - 130},372 Q${HD.x},420 ${HD.x + 130},372 L${HD.x + 130},430 Q${HD.x},468 ${HD.x - 130},430 Z`} fill={STOCCO.hairColor} />
            <path d={`M${HD.x - 140},160 L${HD.x + 140},160 L${HD.x + 140},368 Q${HD.x},404 ${HD.x - 140},368 Z`} fill="url(#vc-sb-cap)" />
            <path d={`M${HD.x - 70},226 Q${HD.x - 30},208 ${HD.x + 10},214`} fill="none" stroke="#FFFFFF" strokeWidth={10} strokeLinecap="round" opacity={0.3} />
          </g>
          <ellipse cx={HD.x} cy={HD.y} rx={HD.rx} ry={HD.ry} fill="none" stroke={INK} strokeWidth={7} />
          {/* the coil over his LEFT motor cortex: frame left in this back view */}
          <RoundCoil x={853} y={240} s={0.5} ang={-50.9} />
        </g>
      </g>
    </g>
  );
};
export const EndShot: React.FC<{t: number; f: number}> = ({t, f}) => {
  const c = ct();
  const cam = endCam(t);
  // a deadpan museum label on "the controller"
  const lk = clamp((t - (c.controller - 0.05)) / 0.25) * (1 - clamp((t - (c.missing + 0.35)) / 0.25));
  return (
    <g>
      <rect x={0} y={0} width={1920} height={1080} fill={K.stoccoWall} />
      <g transform={camT(cam)}>
        <StoccoBack t={t} f={f} />
        {lk > 0.01 && <path d="M1250,262 Q1210,300 1086,316" fill="none" stroke={INK} strokeWidth={5} strokeLinecap="round" opacity={lk} />}
        <Tag x={1290} y={228} text="the controller" size={40} k={lk} />
      </g>
    </g>
  );
};
