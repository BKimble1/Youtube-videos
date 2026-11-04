// S2 / S4 lab rooms: Rao's lab (screen, no keyboard) and Stocco's lab (keyboard, no screen), each drawn in a
// room-local 1920 x 1080 frame so a medium shot is the room at zoom 1 and a two-shot is both rooms side by side as
// split-screen panels (the film's opening language). People are the approved CrewChar cast seated behind a desk:
// body behind the desk, both arms drawn in front of it so the hands rest on the desk top.
// Left/right: the rig is a front view, so a person's RIGHT hand is frame-left. Stocco is drawn mirrored (flip) so his
// swim-cap mark, and the coil over his LEFT motor cortex, sit frame-right, which is his left in a front view.
import React from 'react';
import {Arm, CrewChar, IDLE, Look, Pose, reachLocal} from './crew';
import {EEGCap, Earbuds, RAO, STOCCO, SwimCap} from './people';
import {GameScreen, GEvent} from './game';
import {Desk, INK, K, Keyboard, Monitor, RoundCoil} from './kit';
import {lit, shade} from '../dc/color';
import {clamp, easeInOut, fmt, lerp} from '../dc/math';

export const RW = 1920, RH = 1080;
export const DESK_Y = 760;
export const DESK_D = 130;
/** Rao's monitor and Stocco's keyboard (room-local) */
export const RAO_MON = {x: 1420, y: 708, s: 0.62};
export const STO_KB = {x: 560, y: 750, s: 0.7};
const RAO_X = 760, STO_X = 860, GROUND = 1000, CS = 1.5;
/** head centres (room-local) */
export const RAO_HEAD = {x: RAO_X, y: GROUND - 372 * CS};
export const STO_HEAD = {x: STO_X, y: GROUND - 372 * CS};
/** where the coil sits on Stocco's head (over the cap mark, his left hemisphere = frame-right) */
export const STO_COIL = {x: STO_X + 48, y: GROUND - 420 * CS - 20};

/** arm that puts the hand at room point (wx, wy) for a character at x, GROUND, CS (flip mirrors x) */
const armTo = (cx: number, flip: boolean, side: -1 | 1, wx: number, wy: number): Arm =>
  reachLocal(((flip ? -1 : 1) * (wx - cx)) / CS, (wy - GROUND) / CS, side);

/** A seated cast member: body behind the desk (children), both arms in front of it. */
const Seated: React.FC<{
  id: string; look: Look; f: number; x: number; flip: boolean; seed: number; gear: React.ReactNode;
  /** hand targets: anatomical right / left (room-local) */
  rightHand: {x: number; y: number}; leftHand: {x: number; y: number};
  face: Partial<Pose>; desk: React.ReactNode; props?: React.ReactNode; chair: string;
}> = ({id, look, f, x, flip, seed, gear, rightHand, leftHand, face, desk, props, chair}) => {
  // front view: the right hand is rig side -1 unflipped, +1 when mirrored
  const sR: -1 | 1 = flip ? 1 : -1;
  const aR = armTo(x, flip, sR, rightHand.x, rightHand.y);
  const aL = armTo(x, flip, (-sR) as -1 | 1, leftHand.x, leftHand.y);
  const pose: Pose = {...IDLE, ...face, armL: sR === -1 ? aR : aL, armR: sR === -1 ? aL : aR};
  const common = {look, pose, frame: f, seed, x, y: GROUND, scale: CS, flip, life: 0.5, headGear: gear, id, shadow: false};
  return (
    <g>
      {/* chair back */}
      <rect x={x - 150} y={GROUND - 470} width={300} height={360} rx={44} fill={chair} stroke={INK} strokeWidth={6} />
      <rect x={x - 118} y={GROUND - 446} width={236} height={40} rx={18} fill={lit(chair, 0.18)} opacity={0.6} />
      <CrewChar {...common} front="L" pass="body" />
      {desk}
      {props}
      <CrewChar {...common} front="L" pass="frontArm" />
      <CrewChar {...common} front="R" pass="frontArm" />
    </g>
  );
};

/** Dashed silhouette of a keyboard (the missing fire button) */
export const GhostKeyboard: React.FC<{x: number; y: number; s: number; k: number; color?: string}> = ({x, y, s, k, color = INK}) =>
  k <= 0.001 ? null : (
    <g transform={`translate(${fmt(x)} ${fmt(y)}) scale(${fmt(s)})`} opacity={k}>
      <path d="M-200,-150 L200,-150 L260,0 L260,18 L-260,18 L-260,0 Z" fill="#FFFFFF" fillOpacity={0.35} stroke={color} strokeWidth={7} strokeDasharray="22 16" strokeLinejoin="round" />
      <path d="M-90,-30 L90,-30 L96,-8 L-96,-8 Z" fill="none" stroke={color} strokeWidth={5} strokeDasharray="12 10" opacity={0.7} />
    </g>
  );

/** Dashed silhouette of a monitor (no screen here) */
export const GhostMonitor: React.FC<{x: number; y: number; s: number; k: number; color?: string}> = ({x, y, s, k, color = INK}) =>
  k <= 0.001 ? null : (
    <g transform={`translate(${fmt(x)} ${fmt(y)}) scale(${fmt(s)})`} opacity={k}>
      <rect x={-350} y={-540} width={700} height={460} rx={22} fill="#FFFFFF" fillOpacity={0.35} stroke={color} strokeWidth={9} strokeDasharray="30 20" />
      <path d="M-22,-80 L-22,-18 M22,-80 L22,-18 M-90,0 L90,0" stroke={color} strokeWidth={8} strokeDasharray="18 14" fill="none" />
    </g>
  );

/** A saffron ring around a prop (emphasis) */
export const Ring: React.FC<{x: number; y: number; w: number; h: number; k: number; r?: number}> = ({x, y, w, h, k, r = 30}) =>
  k <= 0.001 ? null : (
    <g opacity={k}>
      <rect x={x - w / 2 - 12} y={y - h / 2 - 12} width={w + 24} height={h + 24} rx={r} fill="none" stroke={K.saffron} strokeWidth={16} />
      <rect x={x - w / 2 - 12} y={y - h / 2 - 12} width={w + 24} height={h + 24} rx={r} fill="none" stroke={INK} strokeWidth={3} opacity={0.5} />
    </g>
  );

/** Spinner (a waiting connection): 8 dots chasing */
export const Spinner: React.FC<{x: number; y: number; r: number; t: number; k: number; color?: string}> = ({x, y, r, t, k, color = '#FFFFFF'}) =>
  k <= 0.001 ? null : (
    <g transform={`translate(${fmt(x)} ${fmt(y)})`} opacity={k}>
      {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
        const a = (i / 8) * Math.PI * 2;
        const head = (t * 1.6) % 1;
        const age = ((head * 8 - i) % 8 + 8) % 8;
        return <circle key={i} cx={fmt(Math.cos(a - Math.PI / 2) * r)} cy={fmt(Math.sin(a - Math.PI / 2) * r)} r={fmt(r * 0.2)} fill={color} opacity={fmt(1 - age / 8.5)} />;
      })}
    </g>
  );

const Wall: React.FC<{id: string; wall: string; deep: string}> = ({id, wall, deep}) => (
  <g>
    <defs>
      <linearGradient id={`${id}-wl`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={lit(wall, 0.25)} />
        <stop offset="1" stopColor={wall} />
      </linearGradient>
    </defs>
    <rect x={-40} y={-40} width={RW + 80} height={RH + 80} fill={`url(#${id}-wl)`} />
    <rect x={-40} y={540} width={RW + 80} height={30} fill={deep} />
  </g>
);

export type RoomOpts = {
  f: number;
  /** draw the prop in the room (false while the scene carries it) */
  prop?: boolean;
  /** dashed missing-prop silhouette 0..1 */
  ghost?: number;
  /** emphasis ring on the prop 0..1 */
  ring?: number;
  face?: Partial<Pose>;
  /** darken the room 0..1 (two-shot focus) */
  dim?: number;
};

export const RaoRoom: React.FC<RoomOpts & {events: GEvent[]; gameDim?: number; spin?: number; capGlow?: number; screen?: React.ReactNode}> = ({
  f, prop = true, ghost = 0, ring = 0, face = {}, dim = 0, events, gameDim = 0, spin = 0, capGlow = 0, screen,
}) => {
  const t = f / 30;
  return (
    <g>
      <Wall id="s2rao" wall={K.raoWall} deep={K.raoWallDeep} />
      {/* pinboard + a framed plot: Rao's room */}
      <rect x={150} y={150} width={250} height={180} rx={8} fill="#E9D8B8" stroke={INK} strokeWidth={6} />
      <rect x={182} y={176} width={78} height={60} fill="#FFFFFF" stroke={INK} strokeWidth={4} transform="rotate(-4 221 206)" />
      <rect x={282} y={186} width={84} height={98} fill={K.blueLight} stroke={INK} strokeWidth={4} transform="rotate(5 324 235)" />
      <circle cx={222} cy={178} r={7} fill={K.coral} stroke={INK} strokeWidth={3} />
      <rect x={1640} y={170} width={170} height={130} rx={6} fill="#FFFFFF" stroke={INK} strokeWidth={6} />
      <path d="M1662,270 L1700,236 L1730,256 L1786,198" fill="none" stroke={K.blue} strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" />
      <Seated
        id="s2rao-c" look={RAO} f={f} x={RAO_X} flip={false} seed={3} gear={<EEGCap glow={capGlow} />}
        rightHand={{x: 560, y: 712}} leftHand={{x: 962, y: 712}}
        face={{lookX: 0.85, lookY: 0.15, mouth: 'smile', ...face}}
        chair="#4A5866"
        desk={<Desk id="s2raodesk" x0={190} x1={2000} y={DESK_Y} d={DESK_D} h={340} />}
        props={
          <g>
            <GhostKeyboard x={RAO_X} y={DESK_Y - 8} s={0.62} k={ghost} />
            {prop && (
              <Monitor id="s2raomon" x={RAO_MON.x} y={RAO_MON.y} s={RAO_MON.s}>
                {screen ?? <GameScreen t={t} events={events} dim={gameDim} />}
                <Spinner x={320} y={200} r={54} t={t} k={spin} />
              </Monitor>
            )}
            {prop && <Ring x={RAO_MON.x} y={RAO_MON.y - 310 * RAO_MON.s} w={700 * RAO_MON.s} h={460 * RAO_MON.s} k={ring} r={24} />}
          </g>
        }
      />
      {dim > 0 && <rect x={-40} y={-40} width={RW + 80} height={RH + 80} fill={INK} opacity={0.4 * dim} />}
    </g>
  );
};

export const StoccoRoom: React.FC<RoomOpts & {coil?: number; coilPulse?: number; space?: number; handOff?: number}> = ({
  f, prop = true, ghost = 0, ring = 0, face = {}, dim = 0, coil = 0, coilPulse = 0, space = 0, handOff = 0,
}) => {
  const kbTip = {x: STO_KB.x + 6, y: STO_KB.y - 24};
  const rest = {x: 700, y: 718};
  const rh = {x: kbTip.x + (rest.x - kbTip.x) * handOff, y: kbTip.y + (rest.y - kbTip.y) * handOff - Math.sin(handOff * Math.PI) * 30};
  return (
    <g>
      <Wall id="s2sto" wall={K.stoccoWall} deep={K.stoccoWallDeep} />
      {/* a bare wall: one note, nothing to watch */}
      <rect x={1380} y={170} width={150} height={190} rx={8} fill="#F8EEDC" stroke={INK} strokeWidth={6} />
      <path d="M1405,210 L1505,210 M1405,240 L1485,240 M1405,270 L1510,270 M1405,300 L1470,300" stroke="#C8B79A" strokeWidth={8} strokeLinecap="round" />
      <Seated
        id="s2sto-c" look={STOCCO} f={f} x={STO_X} flip seed={5}
        gear={<><SwimCap /><Earbuds /></>}
        rightHand={rh} leftHand={{x: 1060, y: 714}}
        face={{lookX: 0, lookY: 0.05, mouth: 'flat', ...face}}
        chair="#6B5A4A"
        desk={<Desk id="s2stodesk" x0={-80} x1={1700} y={DESK_Y} d={DESK_D} h={340} top="#D9A773" face={shade('#C98F57', 0.02)} />}
        props={
          <g>
            <GhostMonitor x={1300} y={RAO_MON.y} s={RAO_MON.s} k={ghost} />
            {prop && <Keyboard id="s2stokb" x={STO_KB.x} y={STO_KB.y} s={STO_KB.s} glowSpace={space} />}
            {prop && <Ring x={STO_KB.x} y={STO_KB.y - 50} w={540 * STO_KB.s} h={150} k={ring} r={30} />}
          </g>
        }
      />
      {coil > 0.001 && (
        <g opacity={Math.min(1, coil * 1.5)}>
          {/* the coil on its stand arm, over the cap mark */}
          <path d={`M${STO_COIL.x + 300},-40 L${STO_COIL.x + 260},${STO_COIL.y - 150} L${STO_COIL.x + 110},${STO_COIL.y - 40}`} fill="none" stroke={INK} strokeWidth={22} strokeLinecap="round" strokeLinejoin="round" />
          <path d={`M${STO_COIL.x + 300},-40 L${STO_COIL.x + 260},${STO_COIL.y - 150} L${STO_COIL.x + 110},${STO_COIL.y - 40}`} fill="none" stroke={K.metal} strokeWidth={12} strokeLinecap="round" strokeLinejoin="round" />
          <RoundCoil x={STO_COIL.x} y={STO_COIL.y} s={0.5} ang={-24} pulse={coilPulse} arcSide={1} />
        </g>
      )}
      {dim > 0 && <rect x={-40} y={-40} width={RW + 80} height={RH + 80} fill={INK} opacity={0.4 * dim} />}
    </g>
  );
};

/** A room as a split-screen panel: clipped, with a rounded ink border. ox, oy: panel origin; s: panel scale. */
export const Panel: React.FC<{id: string; ox: number; oy: number; s?: number; children: React.ReactNode; border?: boolean}> = ({id, ox, oy, s = 1, children, border = true}) => (
  <g transform={`translate(${fmt(ox)} ${fmt(oy)}) scale(${fmt(s)})`}>
    <defs>
      <clipPath id={`${id}-clip`}>
        <rect x={0} y={0} width={RW} height={RH} rx={36} />
      </clipPath>
    </defs>
    <g clipPath={`url(#${id}-clip)`}>{children}</g>
    {border && <rect x={0} y={0} width={RW} height={RH} rx={36} fill="none" stroke={INK} strokeWidth={10} />}
  </g>
);

// ---------------------------------------------------------------- the two-shot world and its camera (S2, S4)
export const G2 = 560; // gap between the two lab panels (world units)
export const RA = {x: -G2 / 2 - RW, y: 0};
export const SB = {x: G2 / 2, y: 0};
export const Z2 = 1920 / (2 * RW + G2 + 120);
export type CamS = {x: number; y: number; z: number};
/** zoom-pan interpolation: zoom is exponential, the centre follows the visible window so targets stay in view */
export const camLerp = (a: CamS, b: CamS, k: number): CamS => {
  if (Math.abs(a.z - b.z) < 1e-6) return {x: lerp(a.x, b.x, k), y: lerp(a.y, b.y, k), z: a.z};
  const z = a.z * Math.pow(b.z / a.z, k);
  const w = (1 / a.z - 1 / z) / (1 / a.z - 1 / b.z);
  return {x: lerp(a.x, b.x, w), y: lerp(a.y, b.y, w), z};
};
export const camKeys = (t: number, ks: [number, CamS][]): CamS => {
  if (t <= ks[0][0]) return ks[0][1];
  for (let i = 0; i < ks.length - 1; i++) {
    const [ta, a] = ks[i];
    const [tb, b] = ks[i + 1];
    if (t <= tb) return camLerp(a, b, easeInOut(clamp((t - ta) / (tb - ta || 1e-6))));
  }
  return ks[ks.length - 1][1];
};
export const toScreen = (c: CamS, x: number, y: number) => ({x: 960 + (x - c.x) * c.z, y: 540 + (y - c.y) * c.z});
