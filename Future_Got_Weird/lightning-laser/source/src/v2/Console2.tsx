// V2: the control shelter (C1 medium, C2 close, F1 panel close-up). Layers, back to front:
//   1. wall and the window (the 3D site seen from the shelter, lit by the discharge)
//   2. the raised instrument panel (behind her reaching hand, beside her body: they never overlap)
//   3. the operator (rig mirrored so she faces the window; her body is never in front of the panel)
//   4. the desk in front of her (hides her from the hips down: the explicit foreground mask)
//   5. her near forearm and hand are part of layer 3 and sit above the panel face, never over the desk
// The reaching hand is solved so the index fingertip lands on the FIRE button (fingertip()).
import React from 'react';
import {mix, shade} from '../dc/color';
import {DIM, Man, ManPose, manJoints} from '../dc/Man';
import {HandPose, mixHand} from '../dc/Hand';
import {Expr, mixExpr} from '../dc/Head';
import {add, clamp, fmt, mul, V} from '../dc/math';
import {E_FOCUS, E_TRACK, H_REST, OPERATOR, P} from '../cast';
import {ss} from '../lib';
import {lookAt, v3} from './p3';
import {St3, View3D, loopState} from './shots3d';
import {camScreen} from './Composite';

const INK = '#0B151C';
export const MIRROR = 540;
const mx = (p: V): V => ({x: 2 * MIRROR - p.x, y: p.y});
/** the ARM and FIRE buttons (screen) and the other panel parts */
export const ARM: V = {x: 694, y: 1100};
export const FIRE: V = {x: 826, y: 1104};
export const PANEL = {x0: 612, y0: 930, x1: 1060, y1: 1345};
export const DESK_Y = 1342;
export const WIN = {x0: 470, y0: 150, x1: 1080, y1: 880};

const H_POINT: HandPose = {curl: [0.04, 0.86, 0.9, 0.93], spread: 0.15, thumb: 26, thumbCurl: 0.6};
const H_OPEN: HandPose = {curl: [0.18, 0.3, 0.36, 0.42], spread: 0.3, thumb: 26, thumbCurl: 0.45};

/** the index fingertip for a hand (same construction as dc/Hand.tsx, straight index) */
const tipOffset = (ang: number, L: number, ts: number) => {
  const d = {x: Math.cos((ang * Math.PI) / 180), y: Math.sin((ang * Math.PI) / 180)};
  const n = {x: -d.y, y: d.x};
  return add(mul(d, 0.84 * L), mul(n, 0.185 * L * ts));
};

const BASE: ManPose = P({x: 700, y: 1452, s: 1.16, torso: 8, chest: 5, neck: -4, turn: 0.55, lElb: -1, rTu: -300, rTv: -80, rElb: 1, lHip: 6, rHip: -6});

/** solve the near arm so the index tip reaches `tipS` (screen), the hand pointing at `angS` (screen deg) */
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

export type Op = {pose: ManPose; expr: Expr; hand: HandPose; press: number; reach: number};
/** her performance: `mode` arm (C1: touch at t0 + 0.2) or fire (F1); t0 is the shot's start */
export const opAt = (t: number, mode: 'arm' | 'fire', t0: number): Op => {
  const btn = mode === 'arm' ? ARM : FIRE;
  const u = t - t0;
  // the hand is already travelling when the shot starts; the fingertip touches at u = 0.2
  const reach = ss(u, -0.18, 0.2);
  const press = ss(u, 0.2, 0.28) * (mode === 'arm' ? 1 - ss(u, 0.5, 0.6) : 1);
  const lift = mode === 'arm' ? ss(u, 0.6, 1.03) : 0;
  const restTip: V = {x: 560, y: 1290};
  const tip0 = {x: restTip.x + (btn.x - restTip.x) * reach, y: restTip.y + (btn.y - restTip.y) * reach - 34 * Math.sin(reach * Math.PI)};
  const tip = {x: tip0.x - 5 * press, y: tip0.y + 4 * press};
  const settleT = mode === 'arm' ? ss(u, 0.53, 1.08) : 0;
  const base: ManPose = {...BASE, torso: BASE.torso - 6 * settleT + (mode === 'fire' ? 3 : 0), chest: BASE.chest - 3 * settleT, neck: -4 + 16 * (mode === 'arm' ? ss(u, 0.5, 1.08) : 0), turn: 0.55 + 0.1 * settleT, breath: 0.3 + 0.2 * Math.sin(t * 2.2)};
  let pose = reachPose(base, tip, -6 + 8 * press);
  if (lift > 0) {
    // the hand comes back off the button toward her chest (torso-space target) as she straightens to look up
    // only the world/torso weight and the torso target blend; the world target stays where the hand left it
    const off: ManPose = {...pose, lW: 0, lTu: -175, lTv: -120, lElb: -1, lWr: 10};
    const o = {} as ManPose;
    (Object.keys(pose) as (keyof ManPose)[]).forEach((k) => ((o as Record<string, number>)[k] = (pose[k] ?? 0) + (((off[k] ?? pose[k]) ?? 0) - (pose[k] ?? 0)) * lift));
    pose = o;
  }
  const look = mode === 'arm' ? ss(u, 0.5, 0.98) : 0;
  const ex = mixExpr({...E_FOCUS, gx: -0.55, gy: 0.55, browDown: 0.35}, {...E_TRACK, gx: -0.62, gy: -0.9, browIn: 0.45, open: 0.16 + 0.1 * ss(u, 1.08, 1.38)}, look);
  const hand = reach < 1 ? mixHand(H_OPEN, H_POINT, ss(u, -0.12, 0.14)) : lift > 0 ? mixHand(H_POINT, H_REST, lift) : H_POINT;
  return {pose, expr: ex, hand, press, reach};
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

const WINDOW_CAM = (t: number) => camScreen(v3(52 - 0.4 * (t - 2.5), -36, -20), v3(0, 124, 0), 980, 790, 640);

export const ShelterV2: React.FC<{t: number; cam: {x: number; y: number; z: number}; st?: St3; mode: 'arm' | 'fire'; t0: number}> = ({t, cam, st: st0, mode, t0}) => {
  // C1/C2: a restrike down the same channel at ~3.55 s lights her face and flashes in her glasses
  const rs = mode === 'arm' ? [3.52, 3.64, 3.83].reduce((x, p0, k) => x + (t >= p0 ? Math.exp(-(t - p0) / 0.07) * (1 - 0.25 * k) : 0), 0) : 0;
  const st1 = st0 ?? loopState(t);
  const st = rs > 0.01 ? {...st1, flash: Math.max(st1.flash, Math.min(1, rs)), core: st1.core + 0.9 * rs} : st1;
  const fl = st.flash;
  const op = opAt(t, mode, t0);
  // the panel: ARM (C1) ramps the LED bar and the gauge; FIRE (F1) lights the red cap and strobes the pulse lamp
  const armT = mode === 'arm' ? t - t0 : 9;
  const fireT = mode === 'fire' ? t - t0 : -9;
  const leds = Array.from({length: 10}, (_, i) => ss(armT, 0.26 + i * 0.035, 0.3 + i * 0.035));
  const gauge = -60 + 110 * ss(armT, 0.3, 0.8) + 6 * Math.sin(t * 13) * ss(armT, 0.5, 0.9);
  const armLit = ss(armT, 0.22, 0.28);
  const fireLit = ss(fireT, 0.22, 0.28);
  const strobe = fireLit * (Math.sin(t * 2 * Math.PI * 6) > 0 ? 1 : 0.25);
  const wall = mix('#1A2C33', '#3A4A6E', fl * 0.45);
  const tr = `translate(540 960) scale(${fmt(cam.z)}) translate(${fmt(-cam.x)} ${fmt(-cam.y)})`;
  const j = manJoints(op.pose);
  // lightning reflected in her glasses (head-local coordinates of the lenses), only while the bolt is bright
  const refl = clamp(fl * 1.6);
  return (
    <g>
      {/* the window view: its own 3D camera, not affected by the room camera except for position */}
      <defs>
        <clipPath id="sv-win">
          <rect x={WIN.x0} y={WIN.y0} width={WIN.x1 - WIN.x0} height={WIN.y1 - WIN.y0} transform={tr} />
        </clipPath>
        <linearGradient id="sv-desk" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={mix('#56656C', '#9AA4D0', fl * 0.4)} />
          <stop offset="0.12" stopColor="#36434A" />
          <stop offset="1" stopColor="#141C21" />
        </linearGradient>
        <linearGradient id="sv-panel" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={mix('#3E4C54', '#7E88B8', fl * 0.45)} />
          <stop offset="1" stopColor="#222D33" />
        </linearGradient>
        <radialGradient id="sv-btn">
          <stop offset="0" stopColor={mix('#E06A2A', '#FFD08A', fireLit)} />
          <stop offset="1" stopColor={mix('#8C3A14', '#E8742E', fireLit)} />
        </radialGradient>
        <radialGradient id="sv-glow">
          <stop offset="0" stopColor="#FFB060" stopOpacity={0.7} />
          <stop offset="1" stopColor="#FF7A2A" stopOpacity={0} />
        </radialGradient>
        <radialGradient id="sv-wl" gradientUnits="userSpaceOnUse" cx={900} cy={500} r={1200}>
          <stop offset="0" stopColor="#C9D2FF" stopOpacity={0.55} />
          <stop offset="1" stopColor="#7E8CD0" stopOpacity={0} />
        </radialGradient>
      </defs>
      <g clipPath="url(#sv-win)">
        <View3D id="C1" t={t} tag="sv" camOverride={WINDOW_CAM(t)} stOverride={st} />
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
        <path d={`M${PANEL.x0},${PANEL.y0 + 18} L${PANEL.x1 + 40},${PANEL.y0} L${PANEL.x1 + 40},${PANEL.y1} L${PANEL.x0 - 14},${PANEL.y1} Z`} fill="url(#sv-panel)" stroke={INK} strokeWidth={4} strokeLinejoin="round" />
        <path d={`M${PANEL.x0},${PANEL.y0 + 18} L${PANEL.x1 + 40},${PANEL.y0} L${PANEL.x1 + 40},${PANEL.y0 + 14} L${PANEL.x0},${PANEL.y0 + 32} Z`} fill={mix('#6E7E86', '#B0BAE6', fl * 0.5)} />
        {/* LED bar (ramps when fired) */}
        {leds.map((v, i) => (
          <g key={i}>
            <rect x={640 + i * 32} y={980} width={24} height={34} rx={5} fill={v > 0.5 ? (i < 7 ? '#5BF08A' : '#F0B85B') : '#1E2C26'} stroke={INK} strokeWidth={2.5} />
            {v > 0.5 && <rect x={634 + i * 32} y={974} width={36} height={46} rx={8} fill={i < 7 ? '#5BF08A' : '#F0B85B'} opacity={0.22} />}
          </g>
        ))}
        {/* ARM (amber) and the guarded FIRE (red, flip guard raised) */}
        {[{c: ARM, lit: armLit, col: ['#B86A10', '#FFD27A'], press: mode === 'arm' ? op.press : 0, guard: false}, {c: FIRE, lit: fireLit, col: ['#8E1E18', '#FF7A62'], press: mode === 'fire' ? op.press : 0, guard: true}].map((b, i) => (
          <g key={i}>
            <defs>
              <radialGradient id={`sv-b${i}`}>
                <stop offset="0" stopColor={mix(b.col[0], b.col[1], 0.35 + 0.65 * b.lit)} />
                <stop offset="1" stopColor={shade(b.col[0], 0.2 - 0.2 * b.lit)} />
              </radialGradient>
            </defs>
            <circle cx={b.c.x} cy={b.c.y} r={64} fill="#2A3238" stroke={INK} strokeWidth={4} />
            {b.guard && <path d={`M${b.c.x - 62},${b.c.y - 30} L${b.c.x - 40},${b.c.y - 112} L${b.c.x + 40},${b.c.y - 112} L${b.c.x + 62},${b.c.y - 30} Z`} fill="#C9D0D6" opacity={0.55} stroke={INK} strokeWidth={3} />}
            {b.lit > 0 && <circle cx={b.c.x} cy={b.c.y} r={110} fill={b.col[1]} opacity={0.18 * b.lit} />}
            <circle cx={b.c.x} cy={b.c.y + 4 * b.press} r={46 - 3 * b.press} fill={`url(#sv-b${i})`} stroke={INK} strokeWidth={4} />
            <ellipse cx={b.c.x - 14} cy={b.c.y - 16 + 4 * b.press} rx={16} ry={8} fill="#FFFFFF" opacity={0.35 - 0.2 * b.press} />
          </g>
        ))}
        {/* pulse lamp (strobes while firing), toggles, gauge, trace monitor */}
        <circle cx={1020} cy={996} r={18} fill={strobe > 0.5 ? '#C9B6FF' : '#2A2F45'} stroke={INK} strokeWidth={3} />
        {strobe > 0.5 && <circle cx={1020} cy={996} r={40} fill="#C9B6FF" opacity={0.3} />}
        {[0, 1, 2].map((i) => (
          <g key={i}>
            <rect x={650 + i * 44} y={1206} width={28} height={52} rx={6} fill="#B9C3CA" stroke={INK} strokeWidth={3} />
            <rect x={655 + i * 44} y={(i === 1 && armLit > 0.5 ? 1212 : 1232)} width={18} height={20} rx={4} fill={i === 1 && armLit > 0.5 ? '#5BF08A' : '#4A565C'} />
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
        <path d={Array.from({length: 16}, (_, i) => `${i ? 'L' : 'M'}${fmt(892 + i * 9.5)},${fmt(1260 - 40 * Math.max(armLit * 0.4, fireLit) * Math.abs(Math.sin(i * 1.3 + t * 12)) * (i % 3 === 0 ? 1 : 0.35) - 5 * Math.sin(i * 0.5 + t * 4))}`).join(' ')} fill="none" stroke="#5BF08A" strokeWidth={3} />
        {/* the operator, lit from the window */}
        <LitFigure k={0.18 + 0.9 * fl} id="sv-op">
          <g transform={`translate(${2 * MIRROR} 0) scale(-1 1)`}>
            <Man id="op2" pose={op.pose} expr={op.expr} lHand={op.hand} rHand={H_REST} outfit={OPERATOR} />
            {refl > 0.05 && <GlassReflection j={j} pose={op.pose} k={refl} t={t} />}
          </g>
        </LitFigure>
        {/* the desk in front of her */}
        <path d={`M-400,${DESK_Y} L1480,${DESK_Y - 20} L1480,2320 L-400,2320 Z`} fill="url(#sv-desk)" stroke={INK} strokeWidth={4} />
        <path d={`M-400,${DESK_Y} L1480,${DESK_Y - 20} L1480,${DESK_Y + 8} L-400,${DESK_Y + 28} Z`} fill={mix('#7A8A92', '#B8C2EE', fl * 0.5)} />
        <DeskProps fl={fl} t={t} />
      </g>
      {/* the window's light on the room */}
      <rect x={0} y={0} width={1080} height={1920} fill="url(#sv-wl)" opacity={0.12 + 0.6 * fl} style={{mixBlendMode: 'screen'}} />
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

/** a few bright jagged streaks in her lenses (the bolt outside), in the head's own frame */
const GlassReflection: React.FC<{j: ReturnType<typeof manJoints>; pose: ManPose; k: number; t: number}> = ({j, pose, k, t}) => {
  const R = DIM.headR * pose.s;
  const roll = -(j.tc + pose.neck);
  const tt = pose.turn;
  const xf = -30 * tt;
  const nearX = xf + 37 * (1 - 0.08 * tt);
  const farX = xf - 37 * (1 - 0.3 * tt);
  const streak = (x: number, w: number) => `M${fmt(x - 8 * w)},-30 L${fmt(x + 2 * w)},-14 L${fmt(x - 4 * w)},-8 L${fmt(x + 8 * w)},8`;
  return (
    <g transform={`translate(${fmt(j.head.x)} ${fmt(j.head.y)}) rotate(${fmt(roll)}) scale(${fmt(R / 100)})`} opacity={k} style={{mixBlendMode: 'screen'}}>
      <path d={streak(nearX - 6, 1)} fill="none" stroke="#E8EEFF" strokeWidth={3.2} strokeLinecap="round" />
      <path d={streak(farX - 4, 0.7)} fill="none" stroke="#E8EEFF" strokeWidth={2.6} strokeLinecap="round" />
      <ellipse cx={fmt(nearX)} cy={-10} rx={22} ry={20} fill="#A8B6FF" opacity={0.18 + 0.1 * Math.sin(t * 40)} />
    </g>
  );
};
export {shade};
