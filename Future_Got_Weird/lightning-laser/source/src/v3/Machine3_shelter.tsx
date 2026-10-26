// V3 beat C1 (7.81-8.95): the scientist at the control panel. Copied from v2/Console2.tsx (V2 keeps its own) and
// adapted. Layers, back to front:
//   1. the window: the 3D site through View3 (V3 scene art and palette), the cyan beam rising past the tower once the
//      laser fires
//   2. the wall and the window frame
//   3. the raised instrument panel (behind her reaching hand, beside her body: they never overlap)
//   4. the operator (rig mirrored so she faces the window; her body is never in front of the panel)
//   5. the desk in front of her (hides her from the hips down: the explicit foreground mask)
// One action: her hand is already travelling at the cut (7.81), the index fingertip lands on the FIRE cap at 8.01 (the
// click), the cap depresses, the relay (8.07) brings the machine up (cap lit, LED bar sweep, gauge, the pulse lamp
// strobing cyan, the trace jumping, the beam in the window), she holds the press through "machine", then one clean
// release: the finger lifts off (8.50) and the hand comes back toward her as she looks up at the window.
// The reaching hand is solved so the index fingertip is exactly on the cap (reachPose) while the room camera moves.
import React from 'react';
import {mix, shade} from '../dc/color';
import {DIM, Man, ManPose, manJoints} from '../dc/Man';
import {HandPose, mixHand} from '../dc/Hand';
import {Expr, mixExpr} from '../dc/Head';
import {add, clamp, fmt, mul, V} from '../dc/math';
import {E_FOCUS, E_TRACK, H_REST, OPERATOR, P} from '../cast';
import {ss} from '../lib';
import {sm5} from '../camera';
import {Cam3, TIP3, v3} from '../v2/p3';
import {camScreen} from '../v2/Composite';
import {stream} from '../v2/shots3d';
import {EXIT_H, G} from '../world/site';
import {View3} from './view3';
import {quietSt} from './states3';
import {PAL} from './palette';
import {B, EV} from './timeline3';
import {Beam3D} from './Scene3';
import {PulseBloom} from './Open3_fx';
import {BeamGlow, HeadFlare} from './Machine3_fx';

const INK = '#0B151C';
export const MIRROR = 540;
const mx = (p: V): V => ({x: 2 * MIRROR - p.x, y: p.y});
/** the ARM and FIRE buttons (stage) and the other panel parts */
export const ARM: V = {x: 694, y: 1100};
export const FIRE: V = {x: 826, y: 1104};
export const PANEL = {x0: 612, y0: 930, x1: 1060, y1: 1345};
export const DESK_Y = 1342;
export const WIN = {x0: 470, y0: 150, x1: 1080, y1: 880};

const H_POINT: HandPose = {curl: [0.04, 0.86, 0.9, 0.93], spread: 0.15, thumb: 26, thumbCurl: 0.6};
const H_OPEN: HandPose = {curl: [0.18, 0.3, 0.36, 0.42], spread: 0.3, thumb: 26, thumbCurl: 0.45};

// ------------------------------------------------------------------ timing (film seconds)
export const C1_T0 = B.C; // the cut from B: the hand is already travelling
export const T_TOUCH = EV.fireClick; // 8.01: fingertip on the cap (the click); = C1_T0 + 0.2, as V2's solver
export const T_RELAY = EV.fireRelay; // 8.07: the machine comes up
export const T_LIFT = 8.5; // the finger leaves the cap (one release)
export const T_BACK = 8.86; // the hand is back by her

/** the index fingertip for a hand (same construction as dc/Hand.tsx, straight index) */
const tipOffset = (ang: number, L: number, ts: number) => {
  const d = {x: Math.cos((ang * Math.PI) / 180), y: Math.sin((ang * Math.PI) / 180)};
  const n = {x: -d.y, y: d.x};
  return add(mul(d, 0.84 * L), mul(n, 0.185 * L * ts));
};

const BASE: ManPose = P({x: 700, y: 1452, s: 1.16, torso: 8, chest: 5, neck: -4, turn: 0.55, lElb: -1, rTu: -300, rTv: -80, rElb: 1, lHip: 6, rHip: -6});

/** solve the near arm so the index tip reaches `tipS` (stage), the hand pointing at `angS` (stage deg) */
const reachPose = (base: ManPose, tipS: V, angS: number): ManPose => {
  const s = base.s;
  const L = DIM.hand * s;
  // mirror into rig space: angles reflect about the vertical
  const tipR = mx(tipS);
  const angR = 180 - angS;
  const wristHand = add(tipR, mul(tipOffset(angR, L, 1), -1));
  let p: ManPose = {...base, lW: 1, lWx: wristHand.x, lWy: wristHand.y, lWr: 0};
  for (let i = 0; i < 3; i++) {
    const j = manJoints(p);
    // the hand's wrist is drawn 6 s back along the forearm from the arm's wrist joint
    const target = add(wristHand, mul(j.L.foreDir, 6 * s));
    const foreAng = (Math.atan2(j.L.foreDir.y, j.L.foreDir.x) * 180) / Math.PI;
    p = {...p, lWx: target.x, lWy: target.y, lWr: ((((angR - foreAng) % 360) + 540) % 360) - 180};
  }
  return p;
};
/** the approach path of the fingertip (stage): from her lap up past the button row's underside to the cap */
const APP: V[] = [{x: 600, y: 1300}, {x: 785, y: 1232}];
/** the release path of the fingertip (stage): back off the cap, down below the buttons, to rest in front of her */
const REL: V[] = [{x: 795, y: 1112}, {x: 745, y: 1262}, {x: 610, y: 1296}];
const REL_ANG = 26; // the hand turns down a little as it relaxes (deg)
const bez = (a: V, b: V, c: V, d: V, k: number): V => {
  const m = 1 - k;
  return {x: m * m * m * a.x + 3 * m * m * k * b.x + 3 * m * k * k * c.x + k * k * k * d.x, y: m * m * m * a.y + 3 * m * m * k * b.y + 3 * m * k * k * c.y + k * k * k * d.y};
};

export type Op = {pose: ManPose; expr: Expr; hand: HandPose; press: number; reach: number; lift: number};
/** her performance: approach (already travelling at the cut), touch at 8.01, press, hold, one release, look up */
export const opC = (t: number): Op => {
  const u = t - C1_T0;
  const uT = T_TOUCH - C1_T0;
  // the hand is already travelling when the shot starts; the fingertip touches at uT (contact, no hover)
  const reach = ss(u, -0.18, uT);
  // the cap goes down with the touch and springs back up as the finger leaves it
  const down = ss(u, uT, uT + 0.08);
  const press = down * (1 - ss(t, T_LIFT, T_LIFT + 0.07));
  // the release: the fingertip backs off the cap, the hand drops below the button row (never back across ARM) and
  // comes to rest in front of her above the desk edge, relaxing, as she straightens to look up at the window
  const lift = ss(t, T_LIFT, T_BACK);
  // the approach rises from below the button row into the FIRE cap (it never crosses the ARM button)
  const m = 1 - reach;
  const tip0 = {x: m * m * APP[0].x + 2 * m * reach * APP[1].x + reach * reach * FIRE.x, y: m * m * APP[0].y + 2 * m * reach * APP[1].y + reach * reach * FIRE.y};
  const held = {x: tip0.x - 5 * down, y: tip0.y + 4 * down};
  const tip = lift > 0 ? bez(held, REL[0], REL[1], REL[2], lift) : held;
  const settle = ss(t, T_LIFT - 0.05, T_BACK + 0.05);
  const base: ManPose = {...BASE, torso: BASE.torso + 3 - 7 * settle, chest: BASE.chest - 3 * settle, neck: -4 + 14 * settle, turn: 0.55 + 0.08 * settle, breath: 0.3 + 0.2 * Math.sin(t * 2.2)};
  const pose = reachPose(base, tip, -6 + 8 * down + REL_ANG * lift);
  // eyes on the button for the press, then up to the window as the machine comes up
  const look = ss(t, T_LIFT - 0.12, T_LIFT + 0.3);
  const ex = mixExpr({...E_FOCUS, gx: -0.55, gy: 0.55, browDown: 0.35}, {...E_TRACK, gx: -0.62, gy: -0.9, browIn: 0.45, open: 0.14}, look);
  const hand = reach < 1 ? mixHand(H_OPEN, H_POINT, ss(u, -0.12, 0.14)) : lift > 0 ? mixHand(H_POINT, H_REST, lift) : H_POINT;
  return {pose, expr: ex, hand, press, reach, lift};
};

/** a cool directional light on the figure from the window (screen-right), strength `k` */
const LitFigure: React.FC<{children: React.ReactNode; k: number; id: string}> = ({children, k, id}) => (
  <g>
    {children}
    {k > 0.01 && (
      <g>
        <defs>
          <filter id={`${id}-lf`} colorInterpolationFilters="sRGB">
            <feColorMatrix type="matrix" values="0.55 0.2 0.25 0 0.18  0.2 0.6 0.25 0 0.2  0.2 0.25 0.7 0 0.3  0 0 0 1 0" />
          </filter>
          <linearGradient id={`${id}-lg`} gradientUnits="userSpaceOnUse" x1={220} y1={0} x2={520} y2={0}>
            <stop offset="0" stopColor="#000" />
            <stop offset="0.3" stopColor="#333" />
            <stop offset="1" stopColor="#FFF" />
          </linearGradient>
          <mask id={`${id}-lm`}>
            <rect x={-200} y={-200} width={1480} height={2320} fill={`url(#${id}-lg)`} />
          </mask>
        </defs>
        <g mask={`url(#${id}-lm)`} opacity={clamp(k)} filter={`url(#${id}-lf)`} style={{mixBlendMode: 'screen'}}>
          {children}
        </g>
      </g>
    )}
  </g>
);

// ------------------------------------------------------------------ the window view (View3, V3 art and palette)
/** from the shelter beside the tower base: the tower and its tip, the beam rising past it from the left */
/** the room camera pushes in about a fixed point (a dolly), so the distant view stays put on screen behind the
 *  growing window frame: the window view is a fixed screen-space camera (with the storm's slow drift) */
export const WIN_TIP = {x: 800, y: 210};
export const windowCam = (t: number): Cam3 => camScreen(v3(95 + 0.3 * (t - B.C), -12, -120), TIP3, 900, WIN_TIP.x, WIN_TIP.y);
/** the beam comes on with the relay: its front shoots up from the telescope (below the window) into the storm */
export const beamOn = (t: number) => ss(t, T_RELAY, T_RELAY + 0.06);
const FRONT_T = 0.22; // s for the front to cross the sky
export const beamFront = (t: number) => {
  const u = clamp((t - T_RELAY) / FRONT_T);
  return EXIT_H + (G + 700 - EXIT_H) * (1 - (1 - u) * (1 - u));
};
/** the window: the site in the storm; nothing until the relay, then the beam and its packet train */
const WindowView: React.FC<{t: number; tag: string}> = ({t, tag}) => {
  const cam = windowCam(t);
  const on = beamOn(t);
  const front = beamFront(t);
  const pulses = on > 0 ? stream(t).filter((h) => h < front - 30) : [];
  const st = {...quietSt(t, 0), beam: 0, pulses: []};
  const lead = on * (1 - ss(t, T_RELAY + FRONT_T, T_RELAY + FRONT_T + 0.12));
  return (
    <View3 cam={cam} st={st} t={t} tag={`${tag}-v`}>
      {on > 0 && (
        <g>
          <BeamGlow cam={cam} h0={EXIT_H} h1={front} k={1.7 * on} wide={2.2} narrow={0.7} />
          <Beam3D cam={cam} alpha={0.95 * on} pulses={pulses} channel={0} hTop={front} id={`${tag}-bm`} />
          <PulseBloom cam={cam} pulses={pulses} k={0.95 * on} size={1.3} id={`${tag}-pb`} />
          <HeadFlare cam={cam} h={front} k={lead} id={`${tag}-hf`} r={1.4} />
        </g>
      )}
    </View3>
  );
};

// ------------------------------------------------------------------ the room camera
export type RoomCam = {x: number; y: number; z: number};
export const DEBUG_WIDE = false;
/** the opening framing: her face, the reaching hand, the panel, the window above */
const RC0 = {x: 660, y: 1000, z: 1.32};
/** one slow push-in about a point between the FIRE cap and the window (it stays put on screen) */
const RQ = {x: 750, y: 850};
const RZ1 = 1.45;
export const roomCam = (t: number): RoomCam => {
  if (DEBUG_WIDE) return {x: 540, y: 960, z: 1};
  const k = sm5(clamp((t - C1_T0) / (B.C2 - C1_T0)));
  const z = Math.exp(Math.log(RC0.z) + (Math.log(RZ1) - Math.log(RC0.z)) * k);
  const sq = {x: 540 + (RQ.x - RC0.x) * RC0.z, y: 960 + (RQ.y - RC0.y) * RC0.z};
  return {x: RQ.x - (sq.x - 540) / z, y: RQ.y - (sq.y - 960) / z, z};
};

export const ShelterC: React.FC<{t: number}> = ({t}) => {
  const tag = `c1-${Math.round(t * 30)}`;
  const cam = roomCam(t);
  const fl = 0;
  const op = opC(t);
  // the panel: armed before the shot (ARM lit, standby LEDs); FIRE lights the red cap, the relay sweeps the LED bar,
  // swings the gauge, strobes the pulse lamp and makes the trace jump
  const fireT = t - T_TOUCH;
  const relT = t - T_RELAY;
  const leds = Array.from({length: 10}, (_, i) => (i < 3 ? 1 : ss(relT, 0.02 + i * 0.03, 0.05 + i * 0.03)));
  const gauge = -60 + 110 * ss(relT, 0.0, 0.35) + 6 * Math.sin(t * 13) * ss(relT, 0.2, 0.5);
  const armLit = 1;
  const fireLit = ss(fireT, 0, 0.05);
  const strobe = ss(relT, 0, 0.02) * (Math.sin(t * 2 * Math.PI * 6) > 0 ? 1 : 0.25);
  const wall = '#1A2C33';
  const tr = `translate(540 960) scale(${fmt(cam.z)}) translate(${fmt(-cam.x)} ${fmt(-cam.y)})`;
  const j = manJoints(op.pose);
  return (
    <g>
      <defs>
        <clipPath id={`${tag}-win`}>
          <rect x={WIN.x0} y={WIN.y0} width={WIN.x1 - WIN.x0} height={WIN.y1 - WIN.y0} transform={tr} />
        </clipPath>
        <linearGradient id={`${tag}-desk`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#56656C" />
          <stop offset="0.12" stopColor="#36434A" />
          <stop offset="1" stopColor="#141C21" />
        </linearGradient>
        <linearGradient id={`${tag}-panel`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#3E4C54" />
          <stop offset="1" stopColor="#222D33" />
        </linearGradient>
        <radialGradient id={`${tag}-wl`} gradientUnits="userSpaceOnUse" cx={900} cy={500} r={1200}>
          <stop offset="0" stopColor="#C9D2FF" stopOpacity={0.55} />
          <stop offset="1" stopColor="#7E8CD0" stopOpacity={0} />
        </radialGradient>
      </defs>
      <g clipPath={`url(#${tag}-win)`}>
        <WindowView t={t} tag={tag} />
      </g>
      <g transform={tr}>
        {/* rain running down the glass */}
        {Array.from({length: 16}, (_, i) => {
          const x = WIN.x0 + 24 + i * 38 + 8 * Math.sin(i * 7);
          const y = WIN.y0 + ((i * 137 + t * 150) % (WIN.y1 - WIN.y0));
          return <path key={i} d={`M${fmt(x)},${fmt(y)} q3,30 -1,62`} stroke="#B8C8D8" strokeOpacity={0.35} strokeWidth={3} fill="none" strokeLinecap="round" />;
        })}
        {/* walls, window frame and mullion */}
        <path d={`M-400,-400 L1480,-400 L1480,${WIN.y0} L${WIN.x0},${WIN.y0} L${WIN.x0},${WIN.y1} L1480,${WIN.y1} L1480,2320 L-400,2320 Z`} fill={wall} />
        {[150, 330].map((x) => <line key={x} x1={x} y1={-400} x2={x} y2={2320} stroke="#0D181C" strokeOpacity={0.45} strokeWidth={3} />)}
        <rect x={WIN.x0 - 16} y={WIN.y0 - 16} width={WIN.x1 - WIN.x0 + 40} height={WIN.y1 - WIN.y0 + 32} fill="none" stroke="#2C3C42" strokeWidth={30} />
        <rect x={WIN.x0 - 16} y={WIN.y0 - 16} width={WIN.x1 - WIN.x0 + 40} height={WIN.y1 - WIN.y0 + 32} fill="none" stroke={INK} strokeWidth={3} />
        <line x1={WIN.x0} y1={WIN.y0 + 360} x2={WIN.x1} y2={WIN.y0 + 360} stroke="#2C3C42" strokeWidth={16} />
        <ellipse cx={180} cy={-60} rx={320} ry={150} fill="#E8B46A" opacity={0.16} />
        {/* the raised instrument panel */}
        <path d={`M${PANEL.x0},${PANEL.y0 + 18} L${PANEL.x1 + 40},${PANEL.y0} L${PANEL.x1 + 40},${PANEL.y1} L${PANEL.x0 - 14},${PANEL.y1} Z`} fill={`url(#${tag}-panel)`} stroke={INK} strokeWidth={4} strokeLinejoin="round" />
        <path d={`M${PANEL.x0},${PANEL.y0 + 18} L${PANEL.x1 + 40},${PANEL.y0} L${PANEL.x1 + 40},${PANEL.y0 + 14} L${PANEL.x0},${PANEL.y0 + 32} Z`} fill="#6E7E86" />
        {/* LED bar: standby, then the sweep with the relay */}
        {leds.map((v, i) => (
          <g key={i}>
            <rect x={640 + i * 32} y={980} width={24} height={34} rx={5} fill={v > 0.5 ? (i < 7 ? '#5BF08A' : '#F0B85B') : '#1E2C26'} stroke={INK} strokeWidth={2.5} />
            {v > 0.5 && <rect x={634 + i * 32} y={974} width={36} height={46} rx={8} fill={i < 7 ? '#5BF08A' : '#F0B85B'} opacity={0.22} />}
          </g>
        ))}
        {/* ARM (amber, lit: armed before the shot) and the guarded FIRE (red, flip guard raised) */}
        {[{c: ARM, lit: armLit, col: ['#B86A10', '#FFD27A'], press: 0, guard: false}, {c: FIRE, lit: fireLit, col: ['#8E1E18', '#FF7A62'], press: op.press, guard: true}].map((b, i) => (
          <g key={i}>
            <defs>
              <radialGradient id={`${tag}-b${i}`}>
                <stop offset="0" stopColor={mix(b.col[0], b.col[1], 0.35 + 0.65 * b.lit)} />
                <stop offset="1" stopColor={shade(b.col[0], 0.2 - 0.2 * b.lit)} />
              </radialGradient>
            </defs>
            <circle cx={b.c.x} cy={b.c.y} r={64} fill="#2A3238" stroke={INK} strokeWidth={4} />
            {b.guard && <path d={`M${b.c.x - 62},${b.c.y - 30} L${b.c.x - 40},${b.c.y - 112} L${b.c.x + 40},${b.c.y - 112} L${b.c.x + 62},${b.c.y - 30} Z`} fill="#C9D0D6" opacity={0.55} stroke={INK} strokeWidth={3} />}
            {b.lit > 0 && <circle cx={b.c.x} cy={b.c.y} r={110} fill={b.col[1]} opacity={0.18 * b.lit} />}
            <circle cx={b.c.x} cy={b.c.y + 4 * b.press} r={46 - 3 * b.press} fill={`url(#${tag}-b${i})`} stroke={INK} strokeWidth={4} />
            <ellipse cx={b.c.x - 14} cy={b.c.y - 16 + 4 * b.press} rx={16} ry={8} fill="#FFFFFF" opacity={0.35 - 0.2 * b.press} />
          </g>
        ))}
        {/* pulse lamp (strobes cyan while firing), toggles, gauge, trace monitor */}
        <circle cx={990} cy={994} r={18} fill={strobe > 0.5 ? PAL.laser : '#24323A'} stroke={INK} strokeWidth={3} />
        {strobe > 0.5 && <circle cx={990} cy={994} r={40} fill={PAL.laser} opacity={0.3} />}
        {[0, 1, 2].map((i) => (
          <g key={i}>
            <rect x={650 + i * 44} y={1206} width={28} height={52} rx={6} fill="#B9C3CA" stroke={INK} strokeWidth={3} />
            <rect x={655 + i * 44} y={i === 1 ? 1212 : 1232} width={18} height={20} rx={4} fill={i === 1 ? '#5BF08A' : '#4A565C'} />
          </g>
        ))}
        <circle cx={1000} cy={1100} r={50} fill="#E9ECEE" stroke={INK} strokeWidth={4} />
        {[-60, -30, 0, 30, 60].map((a) => {
          const r0 = 40, r1 = 48, A = ((a - 90) * Math.PI) / 180;
          return <line key={a} x1={fmt(1000 + Math.cos(A) * r0)} y1={fmt(1100 + Math.sin(A) * r0)} x2={fmt(1000 + Math.cos(A) * r1)} y2={fmt(1100 + Math.sin(A) * r1)} stroke={INK} strokeWidth={3} />;
        })}
        <line x1={1000} y1={1100} x2={fmt(1000 + Math.cos(((gauge - 90) * Math.PI) / 180) * 38)} y2={fmt(1100 + Math.sin(((gauge - 90) * Math.PI) / 180) * 38)} stroke="#D23B2E" strokeWidth={5} strokeLinecap="round" />
        <circle cx={1000} cy={1100} r={7} fill={INK} />
        <rect x={880} y={1180} width={170} height={130} rx={10} fill="#0E1A20" stroke={INK} strokeWidth={4} />
        <path d={Array.from({length: 16}, (_, i) => `${i ? 'L' : 'M'}${fmt(892 + i * 9.5)},${fmt(1260 - 40 * Math.max(0.12, ss(relT, 0, 0.06)) * Math.abs(Math.sin(i * 1.3 + t * 12)) * (i % 3 === 0 ? 1 : 0.35) - 5 * Math.sin(i * 0.5 + t * 4))}`).join(' ')} fill="none" stroke="#5BF08A" strokeWidth={3} />
        {/* the operator, lit from the window */}
        <LitFigure k={0.18 + 0.9 * fl} id={`${tag}-op`}>
          <g transform={`translate(${2 * MIRROR} 0) scale(-1 1)`}>
            <Man id={`${tag}-man`} pose={op.pose} expr={op.expr} lHand={op.hand} rHand={H_REST} outfit={OPERATOR} />
          </g>
        </LitFigure>
        {/* the desk in front of her */}
        <path d={`M-400,${DESK_Y} L1480,${DESK_Y - 20} L1480,2320 L-400,2320 Z`} fill={`url(#${tag}-desk)`} stroke={INK} strokeWidth={4} />
        <path d={`M-400,${DESK_Y} L1480,${DESK_Y - 20} L1480,${DESK_Y + 8} L-400,${DESK_Y + 28} Z`} fill="#7A8A92" />
        <DeskProps fl={fl} t={t} />
        {DEBUG_WIDE && <circle cx={j.head.x} cy={j.head.y} r={8} fill="#F0F" />}
      </g>
      {/* the window's light on the room */}
      <rect x={0} y={0} width={1080} height={1920} fill={`url(#${tag}-wl)`} opacity={0.12 + 0.6 * fl} style={{mixBlendMode: 'screen'}} />
    </g>
  );
};

/** what sits on the desk in front of her: a keyboard, an open logbook with a pen, a mug, a cable run to the panel */
const DeskProps: React.FC<{fl: number; t: number}> = ({fl, t}) => {
  const top = (x: number) => DESK_Y - (20 * (x + 400)) / 1880; // the desk's front edge line
  const lit = (c: string, k = 0.35) => mix(c, '#B8C2EE', fl * k);
  // keyboard: a slab in perspective (the desk top recedes up the screen)
  const kx0 = 170, kx1 = 520, ky = top(340) + 70;
  const kb = `M${kx0 + 24},${ky} L${kx1 + 14},${ky - 6} L${kx1 + 30},${ky + 66} L${kx0},${ky + 72} Z`;
  return (
    <g>
      {/* cable from the panel down the desk */}
      <path d={`M${PANEL.x0 + 30},${PANEL.y1 - 4} C${PANEL.x0 + 10},${DESK_Y + 30} ${PANEL.x0 + 120},${DESK_Y + 46} ${PANEL.x0 + 240},${DESK_Y + 40}`} fill="none" stroke="#11191E" strokeWidth={12} strokeLinecap="round" />
      {/* keyboard */}
      <path d={kb} fill={lit('#2E3A42')} stroke={INK} strokeWidth={4} strokeLinejoin="round" />
      {Array.from({length: 4}, (_, r) => Array.from({length: 12}, (_, c) => {
        const u = (c + 0.5) / 12, v = (r + 0.6) / 4.4;
        const x = kx0 + 24 + (kx1 + 14 - kx0 - 24) * u - 24 * v + 16 * u * v, y = ky + 4 - 6 * u + 66 * v;
        return <rect key={`${r}-${c}`} x={fmt(x - 10)} y={fmt(y - 5)} width={20} height={11} rx={3} fill={lit('#4A5862', 0.5)} stroke="#151E24" strokeWidth={1.5} />;
      }))}
      <path d={`M${kx0},${ky + 72} L${kx1 + 30},${ky + 66} L${kx1 + 30},${ky + 76} L${kx0},${ky + 82} Z`} fill="#141C21" />
      {/* the logbook, open, with a pen */}
      <g transform={`translate(640 ${fmt(top(640) + 60)}) rotate(-4)`}>
        <path d="M0,0 L150,-8 L162,96 L4,108 Z" fill={lit('#E4E0D2', 0.45)} stroke={INK} strokeWidth={4} strokeLinejoin="round" />
        <path d="M150,-8 L298,-2 L316,96 L162,96 Z" fill={lit('#ECE8DA', 0.45)} stroke={INK} strokeWidth={4} strokeLinejoin="round" />
        <path d="M150,-8 L162,96" stroke="#8A8676" strokeWidth={3} />
        {[0, 1, 2, 3, 4].map((i) => <path key={i} d={`M${18 + i},${18 + i * 17} L${128 + i * 2},${12 + i * 17}`} stroke="#7A8AA8" strokeWidth={2.5} opacity={0.8} />)}
        {[0, 1, 2].map((i) => <path key={`r${i}`} d={`M${176 + i * 2},${16 + i * 18} L${270 + i * 3},${20 + i * 18}`} stroke="#7A8AA8" strokeWidth={2.5} opacity={0.8} />)}
        <path d="M184,70 q14,-12 26,0 t26,0 t26,-4" fill="none" stroke="#3050A0" strokeWidth={3} />
        <g transform="translate(206 44) rotate(-28)">
          <rect x={-70} y={-6} width={140} height={12} rx={6} fill="#C23B2E" stroke={INK} strokeWidth={3} />
          <path d="M70,-6 L88,0 L70,6 Z" fill="#D8D2C0" stroke={INK} strokeWidth={2.5} />
        </g>
      </g>
      {/* mug, steam curling */}
      <g transform={`translate(70 ${fmt(top(70) + 40)})`}>
        <path d="M-6,4 L-2,96 Q38,108 78,96 L82,4 Z" fill={lit('#D9DDE0', 0.45)} stroke={INK} strokeWidth={4} strokeLinejoin="round" />
        <ellipse cx={38} cy={4} rx={44} ry={12} fill="#3A2A20" stroke={INK} strokeWidth={4} />
        <path d="M82,24 q34,4 30,30 q-4,24 -32,22" fill="none" stroke={INK} strokeWidth={14} />
        <path d="M82,24 q34,4 30,30 q-4,24 -32,22" fill="none" stroke={lit('#D9DDE0', 0.45)} strokeWidth={7} />
        <path d="M6,40 L70,40" stroke="#2F6FB0" strokeWidth={10} />
        {[0, 1].map((k) => {
          const a = ((t * 0.7 + k * 0.5) % 1);
          return <path key={k} d={`M${24 + k * 22},${-10 - a * 70} q-12,-14 0,-28 t0,-28`} fill="none" stroke="#C8D2DA" strokeWidth={5} strokeLinecap="round" opacity={0.35 * Math.sin(a * Math.PI)} />;
        })}
      </g>
    </g>
  );
};
