// S3 "the route": the three rooms the signal passes through, each drawn in its own "lab" space (1920 x 1080 main
// frame, extended above and below so it fills a campus window panel: lab y -543..1630 maps onto the panel's 1080).
//  RaoLab      Rao (front view) at his desk: EEG cap, cable, the computer, the game with its cursor window, and his
//              right hand flat on the desk (seen from the little-finger side: a right hand pointing right, as he
//              faces the camera with the forearm across the desk).
//  StoccoBack  Stocco from BEHIND, facing the bare wall (his left = frame left): swim cap, earbuds, a round coil
//              over the LEFT motor cortex, the TMS unit, a cutaway of the brain with the hand area of the motor
//              strip, and the signal path that crosses to his RIGHT arm.
//  StoccoClose the hand close-up of S1 (same keyboard and wrist placement) for the pulse-driven wrist jerk.
//  StoccoFront Stocco facing camera for the "nervous tic" reaction.
import React from 'react';
import {clamp, easeIn, easeInOut, easeOut, fmt, lerp, smooth} from '../dc/math';
import {lit, mix, shade} from '../dc/color';
import {Capsule} from '../dc/shade';
import {Inked} from '../dc/ink';
import {Computer, FONT_HEAD, INK, K, Keyboard, Monitor, RoundCoil, Tag} from './kit';
import {GameScreen, GEvent} from './game';
import {FLAT, HandPoseP, HOVER, mixP, SideHand} from './hand';
import {CrewChar, IDLE, mixPose, Pose, reachLocal} from './crew';
import {EEGCap, Earbuds, RAO, STOCCO, SwimCap} from './people';
import {PW} from '../shots/S1Hook';
import {cursorAt, G_DUR, G_FIRE, gameClock, hitTime, tm} from '../shots/s3time';

type V = {x: number; y: number};
export const LAB_A = PW / 1920;
export const LAB_OY = 543;
/** draws lab-space children inside a campus window panel (panel-local 954 x 1080) */
export const LabInPanel: React.FC<{children: React.ReactNode}> = ({children}) => <g transform={`scale(${fmt(LAB_A)}) translate(0 ${LAB_OY})`}>{children}</g>;

// ---------------------------------------------------------------- small geometry helpers
export const bz = (p0: V, p1: V, p2: V, p3: V, u: number): V => {
  const a = (1 - u) ** 3, b = 3 * u * (1 - u) ** 2, c = 3 * u * u * (1 - u), d = u ** 3;
  return {x: a * p0.x + b * p1.x + c * p2.x + d * p3.x, y: a * p0.y + b * p1.y + c * p2.y + d * p3.y};
};
const bzD = (p: V[]) => `M${fmt(p[0].x)},${fmt(p[0].y)} C${fmt(p[1].x)},${fmt(p[1].y)} ${fmt(p[2].x)},${fmt(p[2].y)} ${fmt(p[3].x)},${fmt(p[3].y)}`;
/** Catmull-Rom sampled polyline through points; returns samples with cumulative length */
const spline = (pts: V[], per = 14) => {
  const out: V[] = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
    for (let k = 0; k < per; k++) {
      const u = k / per, u2 = u * u, u3 = u2 * u;
      const f = (a: number, b: number, c: number, d: number) => 0.5 * (2 * b + (-a + c) * u + (2 * a - 5 * b + 4 * c - d) * u2 + (-a + 3 * b - 3 * c + d) * u3);
      out.push({x: f(p0.x, p1.x, p2.x, p3.x), y: f(p0.y, p1.y, p2.y, p3.y)});
    }
  }
  out.push(pts[pts.length - 1]);
  const L = [0];
  for (let i = 1; i < out.length; i++) L.push(L[i - 1] + Math.hypot(out[i].x - out[i - 1].x, out[i].y - out[i - 1].y));
  return {pts: out, L};
};
/** partial path (0..k of the length) and its head point */
const partial = (sp: ReturnType<typeof spline>, k0: number, k1: number) => {
  const tot = sp.L[sp.L.length - 1];
  const a = tot * clamp(k0), b = tot * clamp(k1);
  let d = '';
  let head = sp.pts[0];
  for (let i = 0; i < sp.pts.length; i++) {
    if (sp.L[i] < a) continue;
    if (sp.L[i] > b) {
      const j = i - 1;
      const u = (b - sp.L[j]) / (sp.L[i] - sp.L[j] || 1);
      head = {x: lerp(sp.pts[j].x, sp.pts[i].x, u), y: lerp(sp.pts[j].y, sp.pts[i].y, u)};
      d += `${d ? 'L' : 'M'}${fmt(head.x)},${fmt(head.y)}`;
      return {d, head};
    }
    d += `${d ? 'L' : 'M'}${fmt(sp.pts[i].x)},${fmt(sp.pts[i].y)}`;
    head = sp.pts[i];
  }
  return {d, head};
};

/** flowing dots along a cubic cable (k 0..1 intensity) */
const CableFlow: React.FC<{p: V[]; t: number; k: number; color?: string; n?: number; speed?: number; r?: number}> = ({p, t, k, color = K.saffron, n = 5, speed = 0.9, r = 9}) => {
  if (k <= 0.01) return null;
  return (
    <g opacity={clamp(k)}>
      {Array.from({length: n}, (_, i) => {
        const u = (t * speed + i / n) % 1;
        const q = bz(p[0], p[1], p[2], p[3], u);
        return (
          <g key={i}>
            <circle cx={fmt(q.x)} cy={fmt(q.y)} r={r * 2} fill={color} opacity={0.3} />
            <circle cx={fmt(q.x)} cy={fmt(q.y)} r={r} fill={color} stroke={INK} strokeWidth={2.5} />
          </g>
        );
      })}
    </g>
  );
};
const Cable: React.FC<{p: V[]; w?: number; color?: string}> = ({p, w = 9, color = '#3B4A57'}) => (
  <g fill="none" strokeLinecap="round">
    <path d={bzD(p)} stroke={INK} strokeWidth={w + 6} />
    <path d={bzD(p)} stroke={color} strokeWidth={w} />
  </g>
);

// ---------------------------------------------------------------- the BCI cursor window (with a slide-in reveal)
const CursorWin: React.FC<{cursor: number; k: number; hit: number}> = ({cursor, k, hit}) => {
  if (k <= 0.001) return null;
  return (
    <g transform={`translate(${fmt(-110 * (1 - easeOut(k)))} 0)`}>
      <rect x={6} y={6} width={92} height={388} rx={10} fill="#1F3442" opacity={0.92} stroke={INK} strokeWidth={3} />
      <circle cx={52} cy={52} r={34} fill={K.blue} stroke="#FFFFFF" strokeWidth={4} />
      <text x={52} y={59} textAnchor="middle" fontFamily={FONT_HEAD} fontWeight={700} fontSize={19} fill="#FFFFFF">FIRE</text>
      <line x1={52} y1={92} x2={52} y2={370} stroke="#FFFFFF" strokeWidth={2} strokeDasharray="4 8" opacity={0.35} />
      <rect x={36} y={fmt(354 - clamp(cursor) * 300)} width={32} height={20} rx={4} fill="#FFFFFF" stroke={INK} strokeWidth={2.5} />
      {hit > 0 && <circle cx={52} cy={52} r={40 + 8 * hit} fill="none" stroke={K.saffron} strokeWidth={7} opacity={hit} />}
    </g>
  );
};

// ---------------------------------------------------------------- the scope (brain rhythm, mu band)
const Scope: React.FC<{t: number; k: number; dropAt: number; label: string; labelK: number}> = ({t, k, dropAt, label, labelK}) => {
  if (k <= 0.001) return null;
  const x0 = 700, x1 = 1020, cy = 232, SPEED = 210;
  const amp = (ts: number) => 1 - 0.8 * smooth(clamp((ts - dropAt) / 0.5));
  let d = '';
  const N = 120;
  for (let i = 0; i <= N; i++) {
    const x = x0 + ((x1 - x0) * i) / N;
    const ts = t - (x1 - x) / SPEED;
    const y = cy - 58 * amp(ts) * Math.sin(ts * Math.PI * 2 * 4.2) * (0.85 + 0.15 * Math.sin(ts * 3.1)) - 4 * Math.sin(ts * 23);
    d += `${i ? 'L' : 'M'}${fmt(x)},${fmt(y)}`;
  }
  const s = 0.85 + 0.15 * easeOut(clamp(k));
  return (
    <g opacity={clamp(k * 1.5)} transform={`translate(860 215) scale(${fmt(s)}) translate(-860 -215)`}>
      <rect x={684} y={114} width={360} height={220} rx={20} fill={INK} opacity={0.2} transform="translate(6 8)" />
      <rect x={680} y={110} width={360} height={220} rx={20} fill={K.screenDark} stroke={INK} strokeWidth={6} />
      <text x={700} y={146} fontFamily={FONT_HEAD} fontWeight={600} fontSize={26} fill="#FFFFFF" opacity={0.85}>brain rhythm</text>
      <circle cx={1012} cy={137} r={8} fill={K.teal} />
      <line x1={x0} y1={cy} x2={x1} y2={cy} stroke="#FFFFFF" strokeWidth={2} opacity={0.15} />
      <path d={d} fill="none" stroke={K.teal} strokeWidth={6} strokeLinejoin="round" strokeLinecap="round" />
      <Tag x={860} y={332} text={label} size={30} k={labelK} fill={label === 'imagining' ? K.saffron : K.cream} />
    </g>
  );
};

// ---------------------------------------------------------------- Rao's lab
const RAO_X = 470, RAO_GY = 1034, RAO_S = 2;
const HAND = {x: 780, y: 740, s: 0.8, arm: 567, ang: 7.6};
const MON = {x: 1480, y: 655, s: 0.95};
const COMP = {x: 1050, y: 640, s: 0.68};
export const RAO_CAP_CABLE: V[] = [{x: 636, y: 528}, {x: 720, y: 640}, {x: 900, y: 560}, {x: 1000, y: 584}];
export const RAO_MON_CABLE: V[] = [{x: 1098, y: 612}, {x: 1180, y: 664}, {x: 1330, y: 672}, {x: 1432, y: 646}];
export const RAO_COMP_OUT = {x: COMP.x, y: COMP.y - 140};
/** the ghost (imagined) lift cycle: 1.4 s, lift and lower the fingers and wrist */
const LIFT: HandPoseP = {wrist: -20, idx: [-8, 4, 2], curl: 0.12, thumb: 0.3};
const ghostPose = (t: number) => {
  const ph = ((t % 1.4) + 1.4) % 1.4;
  const k = ph < 0.55 ? easeInOut(ph / 0.55) : ph < 0.75 ? 1 : ph < 1.3 ? 1 - easeInOut((ph - 0.75) / 0.55) : 0;
  return mixP(FLAT, LIFT, k);
};
export const ghostK = (t: number) => {
  const m = tm();
  const a = clamp((t - (m.imagines + 0.15)) / 0.3) * (1 - clamp((t - (m.stays + 1.25)) / 0.3));
  const b = clamp((t - (m.changes - 0.3)) / 0.3) * (1 - clamp((t - (m.command + 0.2)) / 0.4));
  return Math.max(a, b);
};

export const RaoLab: React.FC<{t: number; f: number}> = ({t, f}) => {
  const m = tm();
  const g = gameClock(t);
  const events: GEvent[] = [{kind: 'rocket', t0: 0, dur: G_DUR, fire: G_FIRE}];
  const cur = cursorAt(t);
  const curK = clamp((t - (m.screen - 0.05)) / 0.45);
  const hitK = t > m.target - 0.04 ? 1 - clamp((t - (m.internet + 0.4)) / 0.5) : 0;
  const scopeK = clamp((t - (m.capW - 0.1)) / 0.4) * (1 - clamp((t - (m.screen - 0.45)) / 0.35));
  const imag = t >= m.changes + 0.05;
  const labelK = clamp((t - (m.rhythm - 0.2)) / 0.3);
  const capFlow = clamp((t - (m.computer - 0.2)) / 0.4) * (1 - clamp((t - (m.target + 0.3)) / 0.4));
  const monFlow = clamp((t - (m.screen - 0.3)) / 0.4) * (1 - clamp((t - (m.target + 0.3)) / 0.4));
  const watch = clamp((t - (m.computer + 0.4)) / 0.3) * (1 - clamp((t - (m.screen - 0.2)) / 0.3));
  const blink = t > m.computer && t < m.target + 1.5 ? 0.45 + 0.55 * (Math.sin(t * 9) > 0 ? 1 : 0) : t > m.sends && t < m.internet + 0.5 ? 1 : 0;
  const gk = ghostK(t);
  const concentrate = clamp((t - m.imagines) / 0.4) * (1 - clamp((t - (m.command + 0.3)) / 0.5));
  const happy = clamp((t - (tm().cannon)) / 0.4);
  const pose: Pose = {
    ...IDLE,
    armR: {a: 6, b: 6},
    lookX: 0.75,
    lookY: 0.3,
    brows: -0.35 * concentrate + 0.3 * happy,
    mouth: happy > 0.5 ? 'grin' : concentrate > 0.5 ? 'flat' : 'smile',
  };
  const okK = clamp((t - (hitTime() + 0.95)) / 0.25) * (1 - clamp((t - (m.disappears + 1.4)) / 0.3));
  const slowK = clamp((t - (m.imagines - 0.4)) / 0.3) * (1 - clamp((t - (m.stays + 1.0)) / 0.3));
  return (
    <g>
      <defs>
        <linearGradient id="s3rl-wall" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={lit(K.raoWall, 0.25)} />
          <stop offset="1" stopColor={K.raoWall} />
        </linearGradient>
        <linearGradient id="s3rl-top" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={shade(K.deskTop, 0.12)} />
          <stop offset="1" stopColor={lit(K.deskTop, 0.12)} />
        </linearGradient>
      </defs>
      <rect x={-40} y={-600} width={2000} height={1240} fill="url(#s3rl-wall)" />
      <rect x={-40} y={582} width={2000} height={28} fill={K.raoWallDeep} />
      {/* pinboard: Rao's room (as in S1) */}
      <rect x={60} y={70} width={240} height={170} rx={8} fill="#E9D8B8" stroke={INK} strokeWidth={6} />
      <rect x={92} y={98} width={70} height={54} fill="#FFFFFF" stroke={INK} strokeWidth={4} transform="rotate(-4 127 125)" />
      <rect x={190} y={108} width={74} height={86} fill={K.blueLight} stroke={INK} strokeWidth={4} transform="rotate(5 227 151)" />
      {/* Rao, without his right arm (drawn below as the big desk arm) */}
      <CrewChar look={RAO} pose={pose} frame={f} x={RAO_X} y={RAO_GY} scale={RAO_S} front="L" pass="body" shadow={false} life={0.5} eyeDarts={false} id="s3rao" headGear={<EEGCap glow={0} />} seed={3} />
      {/* desk */}
      <path d="M-40,610 L1960,610 L1960,1660 L-40,1660 Z" fill="url(#s3rl-top)" stroke={INK} strokeWidth={6} />
      <path d="M-40,610 L1960,610" stroke={lit(K.deskTop, 0.35)} strokeWidth={8} />
      {/* cables: cap -> computer -> monitor */}
      <Cable p={RAO_CAP_CABLE} />
      <Cable p={RAO_MON_CABLE} />
      <Computer x={COMP.x} y={COMP.y} s={COMP.s} blink={blink} color={t > m.target - 0.1 && t < m.internet + 0.6 ? K.saffron : K.teal} />
      <Monitor id="s3mon" x={MON.x} y={MON.y} s={MON.s}>
        <GameScreen t={g} events={events} />
        <CursorWin cursor={cur} k={curK} hit={hitK} />
        <Tag x={520} y={38} text="slow motion" size={32} k={slowK} fill={K.cream} />
        {okK > 0.01 && (
          <g transform={`translate(466 196) scale(${fmt(0.7 + 0.3 * okK)})`} opacity={okK}>
            <circle r={30} fill={K.green} stroke={INK} strokeWidth={5} />
            <path d="M-14,0 L-4,11 L15,-11" fill="none" stroke="#FFFFFF" strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" />
          </g>
        )}
      </Monitor>
      <CableFlow p={RAO_CAP_CABLE} t={t} k={capFlow} color={K.teal} />
      <CableFlow p={RAO_MON_CABLE} t={t} k={monFlow} />
      {/* Rao's right arm on the desk */}
      <Inked w={7}>
        <Capsule id="s3rua" a={{x: 352, y: 478}} b={{x: 332, y: 684}} ra={56} rb={58} color={K.raoSleeve} spec={0.12} />
      </Inked>
      <SideHand id="s3rh" x={HAND.x} y={HAND.y} s={HAND.s} dir={1} side="pinky" pose={FLAT} skin={K.raoSkin} sleeve={K.raoSleeve} arm={HAND.arm} armAng={HAND.ang} contact={1} surfaceY={56} />
      {gk > 0.01 && (
        <g opacity={Math.min(1, gk * 1.6)}>
          <SideHand id="s3rg0" x={HAND.x} y={HAND.y} s={HAND.s} dir={1} side="pinky" pose={ghostPose(t - m.imagines)} skin={K.raoSkin} sleeve={K.raoSleeve} arm={HAND.arm} armAng={HAND.ang} ghost />
          <SideHand id="s3rg" x={HAND.x} y={HAND.y} s={HAND.s} dir={1} side="pinky" pose={ghostPose(t - m.imagines)} skin={K.raoSkin} sleeve={K.raoSleeve} arm={HAND.arm} armAng={HAND.ang} ghost />
        </g>
      )}
      {/* dashed leader cap -> scope */}
      {scopeK > 0.01 && <path d="M592,262 Q640,250 676,236" fill="none" stroke={INK} strokeWidth={4} strokeDasharray="10 9" opacity={scopeK * 0.7} />}
      <Scope t={t} k={scopeK} dropAt={m.changes} label={imag ? 'imagining' : 'resting'} labelK={labelK} />
      {/* labels */}
      <Tag x={830} y={596} text="imagined move" size={36} k={clamp((t - (m.imagines + 0.3)) / 0.3) * (1 - clamp((t - (m.stays - 0.3)) / 0.25))} fill={K.cream} />
      <Tag x={640} y={596} text="real hand stays put" size={36} k={clamp((t - (m.stays - 0.05)) / 0.3) * (1 - clamp((t - (m.cap + 0.2)) / 0.3))} fill={K.cream} />
      <Tag x={860} y={466} text="watching for the drop" size={30} k={watch} fill={K.cream} />
    </g>
  );
};

// ---------------------------------------------------------------- Stocco from behind
const HD = {x: 960, y: 330, rx: 118, ry: 128};
export const HAND_AREA: V = {x: 907, y: 287};
const COIL = {x: 853, y: 240, s: 0.5, ang: -50.9};
const HANDLE_END = {x: 938, y: 135};
export const TMS_DISPLAY: V = {x: 325, y: 468};
const TMS_CABLE: V[] = [{x: 300, y: 402}, {x: 300, y: 130}, {x: 700, y: 10}, {x: 940, y: 131}];
const SIGNAL = spline([HAND_AREA, {x: 918, y: 345}, {x: 944, y: 410}, {x: 962, y: 446}, {x: 990, y: 476}, {x: 1070, y: 512}, {x: 1160, y: 548}, {x: 1215, y: 600}, {x: 1252, y: 700}, {x: 1282, y: 806}]);

export const StoccoBack: React.FC<{t: number; f: number}> = ({t, f}) => {
  const m = tm();
  const docked = t > m.across + 1.3;
  const brainK = clamp((t - (m.brain - 0.15)) / 0.5);
  const handAreaK = clamp((t - (m.rightHand - 0.1)) / 0.4);
  const cableK = clamp((t - (m.trigger + 0.15)) / (m.pulse - m.trigger - 0.2));
  const pulseK = t >= m.pulse ? Math.max(0, 1 - (t - m.pulse) / 0.5) : 0;
  const sigK = clamp((t - (m.pulse + 0.08)) / (m.handCut - m.pulse - 0.25));
  const coilTagK = clamp((t - (m.coil - 0.1)) / 0.3) * (1 - clamp((t - (m.brain - 0.3)) / 0.3));
  const cortexTagK = clamp((t - (m.brain + 0.1)) / 0.3) * (1 - clamp((t - (m.trigger - 0.2)) / 0.3));
  const lrK = clamp((t - (m.rightHand - 0.2)) / 0.3);
  const armTagK = clamp((t - (m.pulse + 0.35)) / 0.3);
  const fired = t > m.trigger + 0.1;
  const bob = Math.sin(t * 1.4) * 1.5;
  const sk = K.stoccoSkin;
  return (
    <g>
      <defs>
        <linearGradient id="s3sb-wall" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={lit(K.stoccoWall, 0.22)} />
          <stop offset="1" stopColor={K.stoccoWall} />
        </linearGradient>
        <linearGradient id="s3sb-shirt" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor={lit(K.stoccoSleeve, 0.18)} />
          <stop offset="1" stopColor={shade(K.stoccoSleeve, 0.22)} />
        </linearGradient>
        <radialGradient id="s3sb-head" cx="0.38" cy="0.32" r="0.8">
          <stop offset="0" stopColor={lit(sk, 0.2)} />
          <stop offset="1" stopColor={shade(sk, 0.18)} />
        </radialGradient>
        <radialGradient id="s3sb-cap" cx="0.35" cy="0.25" r="0.85">
          <stop offset="0" stopColor={lit(K.swimCap, 0.25)} />
          <stop offset="1" stopColor={shade(K.swimCap, 0.2)} />
        </radialGradient>
        <radialGradient id="s3sb-brain" cx="0.4" cy="0.3" r="0.8">
          <stop offset="0" stopColor="#F9CFC6" />
          <stop offset="1" stopColor="#E59A92" />
        </radialGradient>
        <clipPath id="s3sb-hclip"><ellipse cx={HD.x} cy={HD.y} rx={HD.rx} ry={HD.ry} /></clipPath>
        <clipPath id="s3sb-bclip"><ellipse cx={HD.x} cy={HD.y - 12} rx={HD.rx - 14} ry={HD.ry - 22} /></clipPath>
      </defs>
      {/* the bare wall he faces */}
      <rect x={-40} y={-600} width={2000} height={1210} fill="url(#s3sb-wall)" />
      <rect x={-40} y={584} width={2000} height={26} fill={K.stoccoWallDeep} />
      <rect x={1330} y={110} width={190} height={240} rx={10} fill="#F8EEDC" stroke={INK} strokeWidth={6} />
      <path d="M1362,160 L1488,160 M1362,198 L1462,198 M1362,236 L1494,236 M1362,274 L1440,274" stroke="#C8B79A" strokeWidth={10} strokeLinecap="round" />
      {/* desk top (seen past him), under-desk shadow, floor */}
      <path d="M-40,610 L1960,610 L1960,770 L-40,770 Z" fill="#D9A773" stroke={INK} strokeWidth={6} />
      <path d="M-40,610 L1960,610" stroke={lit('#D9A773', 0.35)} strokeWidth={8} />
      <rect x={-40} y={770} width={2000} height={36} fill={shade('#D9A773', 0.25)} stroke={INK} strokeWidth={5} />
      <rect x={-40} y={806} width={2000} height={420} fill="#6F5B4A" />
      <rect x={-40} y={1226} width={2000} height={440} fill="#CFC2AE" />
      <Keyboard id="s3sbkb" x={1150} y={726} s={0.55} />
      {/* TMS unit on a cart (frame left) */}
      <g>
        <rect x={236} y={690} width={180} height={30} fill="#7E8B96" stroke={INK} strokeWidth={5} />
        <rect x={250} y={720} width={14} height={500} fill="#7E8B96" stroke={INK} strokeWidth={4} />
        <rect x={392} y={720} width={14} height={500} fill="#7E8B96" stroke={INK} strokeWidth={4} />
        <circle cx={257} cy={1232} r={18} fill="#2D363D" stroke={INK} strokeWidth={4} />
        <circle cx={399} cy={1232} r={18} fill="#2D363D" stroke={INK} strokeWidth={4} />
        <rect x={212} y={398} width={226} height={296} rx={16} fill="#D9DEE2" stroke={INK} strokeWidth={6} />
        <rect x={244} y={432} width={162} height={74} rx={8} fill={K.screenDark} stroke={INK} strokeWidth={4} />
        {docked && (
          <text x={TMS_DISPLAY.x} y={TMS_DISPLAY.y + 14} textAnchor="middle" fontFamily={FONT_HEAD} fontWeight={700} fontSize={38} fill={K.saffron} opacity={fired ? 1 - clamp((t - m.trigger - 0.1) / 0.4) : 0.65 + 0.35 * Math.sin(t * 6)}>
            FIRE
          </text>
        )}
        {[0, 1, 2].map((i) => <rect key={i} x={250 + i * 52} y={540} width={40} height={14} rx={6} fill="#B5BEC6" />)}
        <circle cx={392} cy={630} r={16} fill={mix('#6E7C86', K.saffron, fired ? Math.max(pulseK, cableK > 0 && cableK < 1 ? 1 : 0) : 0)} stroke={INK} strokeWidth={4} />
      </g>
      {/* coil holder arm and cable */}
      <g fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path d={`M420,410 L560,70 L${HANDLE_END.x - 6},${HANDLE_END.y - 14}`} stroke={INK} strokeWidth={26} />
        <path d={`M420,410 L560,70 L${HANDLE_END.x - 6},${HANDLE_END.y - 14}`} stroke="#9AA7B1" strokeWidth={14} />
        <circle cx={560} cy={70} r={16} fill="#7E8B96" stroke={INK} strokeWidth={5} />
      </g>
      <Cable p={TMS_CABLE} w={10} color="#2D363D" />
      {cableK > 0 && cableK < 1 && (() => {
        const q = bz(TMS_CABLE[0], TMS_CABLE[1], TMS_CABLE[2], TMS_CABLE[3], easeIn(cableK));
        return (
          <g>
            <circle cx={q.x} cy={q.y} r={34} fill={K.saffron} opacity={0.35} />
            <circle cx={q.x} cy={q.y} r={16} fill={K.saffron} stroke={INK} strokeWidth={3} />
          </g>
        );
      })()}
      {/* Stocco from behind, sitting on a chair */}
      <g transform={`translate(0 ${fmt(bob)})`}>
        {/* right forearm going forward to the keyboard (behind the torso edge) */}
        <Inked w={7}>
          <Capsule id="s3sb-rfa" a={{x: 1288, y: 822}} b={{x: 1238, y: 720}} ra={40} rb={34} color={K.stoccoSleeve} />
          <Capsule id="s3sb-lfa" a={{x: 632, y: 822}} b={{x: 690, y: 728}} ra={40} rb={34} color={K.stoccoSleeve} />
        </Inked>
        <rect x={918} y={400} width={84} height={110} fill={sk} stroke={INK} strokeWidth={6} />
        <path d="M650,1140 L668,650 Q676,566 770,538 L908,494 Q960,484 1012,494 L1150,538 Q1244,566 1252,650 L1270,1140 Z" fill="url(#s3sb-shirt)" stroke={INK} strokeWidth={7} strokeLinejoin="round" />
        <path d="M908,494 Q960,520 1012,494" fill="none" stroke={shade(K.stoccoSleeve, 0.35)} strokeWidth={6} strokeLinecap="round" />
        <path d="M960,520 L960,880" stroke={shade(K.stoccoSleeve, 0.25)} strokeWidth={5} opacity={0.5} />
        <Inked w={7}>
          <Capsule id="s3sb-lua" a={{x: 724, y: 590}} b={{x: 640, y: 822}} ra={52} rb={44} color={K.stoccoSleeve} spec={0.1} />
          <Capsule id="s3sb-rua" a={{x: 1196, y: 590}} b={{x: 1282, y: 822}} ra={52} rb={44} color={shade(K.stoccoSleeve, 0.06)} spec={0.1} />
        </Inked>
        {/* chair back */}
        <rect x={720} y={880} width={480} height={300} rx={40} fill="#46525C" stroke={INK} strokeWidth={7} />
        <rect x={744} y={900} width={160} height={30} rx={14} fill="#5D6B76" opacity={0.7} />
        {/* ears + earbuds */}
        {[-1, 1].map((sd) => (
          <g key={sd}>
            <ellipse cx={HD.x + sd * (HD.rx - 2)} cy={HD.y + 30} rx={16} ry={28} fill={shade(sk, 0.08)} stroke={INK} strokeWidth={6} />
            <circle cx={HD.x + sd * (HD.rx + 4)} cy={HD.y + 32} r={11} fill="#F4F6F8" stroke={INK} strokeWidth={4} />
            <rect x={HD.x + sd * (HD.rx + 4) - 4} y={HD.y + 38} width={8} height={26} rx={4} fill="#F4F6F8" stroke={INK} strokeWidth={3} />
          </g>
        ))}
        {/* head: skin, hair at the nape, then the swim cap over the top */}
        <ellipse cx={HD.x} cy={HD.y} rx={HD.rx} ry={HD.ry} fill="url(#s3sb-head)" />
        <g clipPath="url(#s3sb-hclip)">
          <path d={`M${HD.x - 130},372 Q${HD.x},420 ${HD.x + 130},372 L${HD.x + 130},430 Q${HD.x},468 ${HD.x - 130},430 Z`} fill={STOCCO.hairColor} />
          <path d={`M${HD.x - 140},160 L${HD.x + 140},160 L${HD.x + 140},368 Q${HD.x},404 ${HD.x - 140},368 Z`} fill="url(#s3sb-cap)" />
          <path d={`M${HD.x - 130},362 Q${HD.x},398 ${HD.x + 130},362`} fill="none" stroke={shade(K.swimCap, 0.35)} strokeWidth={8} />
          <path d={`M${HD.x - 70},226 Q${HD.x - 30},208 ${HD.x + 10},214`} fill="none" stroke="#FFFFFF" strokeWidth={10} strokeLinecap="round" opacity={0.3} />
        </g>
        <ellipse cx={HD.x} cy={HD.y} rx={HD.rx} ry={HD.ry} fill="none" stroke={INK} strokeWidth={7} />
        {/* brain cutaway (back-top view): his left hemisphere is frame left */}
        {brainK > 0.01 && (
          <g opacity={brainK}>
            <g clipPath="url(#s3sb-bclip)">
              <rect x={HD.x - 130} y={HD.y - 150} width={260} height={300} fill="url(#s3sb-brain)" />
              <g fill="none" stroke={shade('#E59A92', 0.3)} strokeWidth={4} strokeLinecap="round" opacity={0.6}>
                <path d="M880,250 q18,-14 30,4 t30,0" />
                <path d="M872,320 q16,-16 32,0 t32,-2" />
                <path d="M890,380 q14,-12 28,2" />
                <path d="M1010,250 q18,-14 30,4 t30,0" />
                <path d="M1000,320 q16,-16 32,0 t32,-2" />
                <path d="M1006,382 q14,-12 28,2" />
              </g>
              {/* motor strip: a band over the top of both hemispheres */}
              <path d="M862,352 Q960,172 1058,352 L1036,358 Q960,206 884,358 Z" fill="#F07C66" opacity={0.85} />
              {/* hand area on the LEFT hemisphere */}
              <circle cx={HAND_AREA.x} cy={HAND_AREA.y} r={22 + 6 * handAreaK + 24 * pulseK} fill={K.saffron} opacity={0.35 * handAreaK + 0.5 * pulseK} />
              <circle cx={HAND_AREA.x} cy={HAND_AREA.y} r={15} fill={mix('#F07C66', K.saffron, handAreaK)} stroke={INK} strokeWidth={handAreaK > 0.1 ? 4 : 0} />
              {/* midline */}
              <path d={`M${HD.x},${HD.y - 120} L${HD.x},${HD.y + 120}`} stroke={INK} strokeWidth={5} />
            </g>
            <ellipse cx={HD.x} cy={HD.y - 12} rx={HD.rx - 14} ry={HD.ry - 22} fill="none" stroke={INK} strokeWidth={4} opacity={0.6} />
          </g>
        )}
        {/* signal: hand area -> crosses the midline low in the brainstem -> right shoulder -> right arm */}
        {sigK > 0 && (() => {
          const pp = partial(SIGNAL, 0, easeInOut(sigK));
          return (
            <g fill="none" strokeLinecap="round" strokeLinejoin="round">
              <path d={pp.d} stroke={K.saffron} strokeWidth={30} opacity={0.3} />
              <path d={pp.d} stroke={K.saffron} strokeWidth={11} />
              <circle cx={pp.head.x} cy={pp.head.y} r={30} fill={K.saffron} opacity={0.4} />
              <circle cx={pp.head.x} cy={pp.head.y} r={15} fill={K.saffron} stroke={INK} strokeWidth={3} />
            </g>
          );
        })()}
        {/* coil over the left motor cortex: active face toward the head */}
        <RoundCoil x={COIL.x} y={COIL.y} s={COIL.s} ang={COIL.ang} pulse={pulseK} />
      </g>
      {/* labels */}
      <Tag x={700} y={300} text="magnetic coil" size={36} k={coilTagK} />
      {cortexTagK > 0.01 && <path d={`M790,318 Q860,300 ${HAND_AREA.x - 20},${HAND_AREA.y + 6}`} fill="none" stroke={INK} strokeWidth={5} opacity={cortexTagK} />}
      <Tag x={640} y={330} text="left motor cortex" size={36} k={cortexTagK} />
      <Tag x={HD.x - 165} y={HD.y + 108} text="L" size={34} k={lrK} />
      <Tag x={HD.x + 165} y={HD.y + 108} text="R" size={34} k={lrK} />
      <Tag x={1450} y={560} text="to the right hand" size={36} k={armTagK} />
    </g>
  );
};

// ---------------------------------------------------------------- the hand close-up (S1 geometry, full frame)
export const KB = {x: 430, y: 862, s: 1.45};
const HS = 1.72;
const DOWN: HandPoseP = {wrist: -4, idx: [26, 26, 14], curl: 0.42, thumb: 0.45};
const TRAIL: HandPoseP = {wrist: -17, idx: [30, 30, 16], curl: 0.55, thumb: 0.48};
const UP: HandPoseP = {wrist: -29, idx: [4, 8, 4], curl: 0.3, thumb: 0.4};
/** the TMS-driven movement: a sharp involuntary wrist extension (fingers trailing), a brief mechanical hold, then
 *  the hand drops and the index fingertip lands on the space bar at `contact`. */
export const jerkPose = (t: number): HandPoseP => {
  const m = tm();
  const d = t - m.jerk;
  const drop0 = m.contact - 0.32;
  if (d < 0) return HOVER;
  if (d < 0.07) return mixP(HOVER, TRAIL, easeIn(d / 0.07));
  if (d < 0.15) return mixP(TRAIL, UP, easeOut((d - 0.07) / 0.08));
  if (t < drop0) {
    const e = d - 0.15;
    const osc = Math.exp(-e * 9) * Math.sin(e * 38);
    return {...UP, wrist: UP.wrist + 3.5 * osc, idx: [UP.idx[0] - 4 * osc, UP.idx[1], UP.idx[2]]};
  }
  if (t < m.contact) return mixP(UP, DOWN, easeIn(clamp((t - drop0) / 0.32)) ** 1.1);
  return mixP(DOWN, HOVER, easeInOut(clamp((t - m.contact - 0.1) / 0.5)));
};

export const StoccoClose: React.FC<{t: number; wrist: V}> = ({t, wrist}) => {
  const m = tm();
  const pose = jerkPose(t);
  const press = t >= m.contact && t < m.contact + 0.14 ? 1 - (t - m.contact) / 0.14 : 0;
  // the signal along the extensor (top) side of the forearm, elbow -> wrist
  const E = {x: wrist.x + 954, y: wrist.y + 134};
  const nrm = {x: 0.139, y: -0.99};
  const sk = clamp((t - (m.handCut + 0.02)) / (m.jerk - m.handCut - 0.02));
  const sigOut = 1 - clamp((t - (m.jerk + 0.25)) / 0.35);
  const mus = clamp((t - (m.jerk - 0.12)) / 0.1) * (1 - clamp((t - (m.jerk + 0.3)) / 0.4));
  const pt = (u: number, off: number) => ({x: lerp(E.x, wrist.x, u) + nrm.x * off, y: lerp(E.y, wrist.y, u) + nrm.y * off});
  const u0 = 0.2, u1 = lerp(0.2, 1, easeIn(sk));
  const a = pt(u0, lerp(86, 58, u0)), b = pt(u1, lerp(86, 58, u1));
  const upK = clamp((t - m.jerk) / 0.08) * (1 - clamp((t - (m.contact - 0.3)) / 0.15));
  const dnK = clamp((t - (m.contact - 0.3)) / 0.06) * (1 - clamp((t - (m.contact + 0.2)) / 0.2));
  return (
    <g>
      <defs>
        <linearGradient id="s3sc-wall" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={lit(K.stoccoWall, 0.2)} />
          <stop offset="1" stopColor={K.stoccoWall} />
        </linearGradient>
        <linearGradient id="s3sc-top" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={shade('#D9A773', 0.12)} />
          <stop offset="1" stopColor={lit('#D9A773', 0.1)} />
        </linearGradient>
      </defs>
      <rect x={-900} y={-200} width={3600} height={680} fill="url(#s3sc-wall)" />
      <rect x={-900} y={440} width={3600} height={28} fill={K.stoccoWallDeep} />
      <path d="M-900,480 L2700,480 L2700,1500 L-900,1500 Z" fill="url(#s3sc-top)" stroke={INK} strokeWidth={6} />
      <path d="M-900,480 L2700,480" stroke={lit('#D9A773', 0.35)} strokeWidth={8} />
      <rect x={560} y={150} width={150} height={190} rx={8} fill="#F8EEDC" stroke={INK} strokeWidth={5} />
      <path d="M585,190 L685,190 M585,220 L665,220 M585,250 L690,250 M585,280 L650,280" stroke="#C8B79A" strokeWidth={8} strokeLinecap="round" />
      <Keyboard id="s3sckb" x={KB.x} y={KB.y} s={KB.s} spaceDown={press} />
      <SideHand id="s3sh" x={wrist.x} y={wrist.y} s={HS} dir={-1} side="thumb" pose={pose} skin={K.stoccoSkin} sleeve={K.stoccoSleeve} arm={560} armAng={-8} />
      {/* extensor muscles light up as the wrist is pulled up */}
      {mus > 0.01 && (
        <path d={`M${fmt(pt(0.55, 50).x)},${fmt(pt(0.55, 50).y)} L${fmt(pt(0.93, 40).x)},${fmt(pt(0.93, 40).y)}`} stroke={K.saffron} strokeWidth={34} strokeLinecap="round" opacity={0.45 * mus} />
      )}
      {sk > 0 && sigOut > 0 && (
        <g opacity={sigOut} strokeLinecap="round">
          <path d={`M${fmt(a.x)},${fmt(a.y)} L${fmt(b.x)},${fmt(b.y)}`} stroke={K.saffron} strokeWidth={30} opacity={0.3} />
          <path d={`M${fmt(a.x)},${fmt(a.y)} L${fmt(b.x)},${fmt(b.y)}`} stroke={K.saffron} strokeWidth={11} />
          <circle cx={b.x} cy={b.y} r={28} fill={K.saffron} opacity={0.4} />
          <circle cx={b.x} cy={b.y} r={14} fill={K.saffron} stroke={INK} strokeWidth={3} />
        </g>
      )}
      {/* motion marks: an arc about the wrist on the way up, a drop arrow on the way down */}
      {upK > 0.01 && (() => {
        // an arc about the wrist joint, just beyond the fingertips: the hand rotates UP at the wrist
        const R = 560, a0 = (172 * Math.PI) / 180, a1 = (206 * Math.PI) / 180;
        const P = (a: number, r = R) => `${fmt(wrist.x + Math.cos(a) * r)},${fmt(wrist.y + Math.sin(a) * r)}`;
        const head = `M${P(a1 - 0.07, R - 26)} L${P(a1)} L${P(a1 - 0.07, R + 26)}`;
        return (
          <g opacity={upK} fill="none" strokeLinecap="round" strokeLinejoin="round">
            <path d={`M${P(a0)} A${R},${R} 0 0 1 ${P(a1)}`} stroke={K.cream} strokeWidth={20} />
            <path d={head} stroke={K.cream} strokeWidth={20} />
            <path d={`M${P(a0)} A${R},${R} 0 0 1 ${P(a1)}`} stroke={INK} strokeWidth={9} />
            <path d={head} stroke={INK} strokeWidth={9} />
          </g>
        );
      })()}
      {dnK > 0.01 && (
        <g opacity={dnK} fill="none" strokeLinecap="round" strokeLinejoin="round">
          {[K.cream, INK].map((c, i) => (
            <g key={i} stroke={c} strokeWidth={i ? 9 : 20}>
              <path d={`M${KB.x - 150},${KB.y - 360} L${KB.x - 150},${KB.y - 230}`} />
              <path d={`M${KB.x - 174},${KB.y - 258} L${KB.x - 150},${KB.y - 230} L${KB.x - 126},${KB.y - 258}`} />
            </g>
          ))}
        </g>
      )}
      {/* click mark on contact */}
      {(() => {
        const k = (t - m.contact) / 0.35;
        if (k < 0 || k > 1) return null;
        return (
          <g opacity={1 - k} stroke={K.saffron} strokeWidth={8} strokeLinecap="round">
            <path d={`M${KB.x - 150},${KB.y - 40 - 40 * k} l-30,-24`} />
            <path d={`M${KB.x + 150},${KB.y - 40 - 40 * k} l30,-24`} />
            <path d={`M${KB.x},${KB.y - 70 - 46 * k} l0,-30`} />
          </g>
        );
      })()}
      <Tag x={wrist.x + 170} y={wrist.y - 300} text="wrist jerks up" size={40} k={clamp((t - (m.jerk + 0.05)) / 0.2)} />
    </g>
  );
};

// ---------------------------------------------------------------- Stocco facing camera (reaction)
export const StoccoFront: React.FC<{t: number; f: number}> = ({t, f}) => {
  const m = tm();
  const raise = clamp((t - (m.described - 0.2)) / 0.6) * (1 - clamp((t - (m.imagine - 0.3)) / 0.6));
  const twitch = (c: number) => {
    const d = t - c;
    return d > 0 && d < 0.35 ? Math.sin(d * 60) * Math.exp(-d * 10) : 0;
  };
  const tw = twitch(m.described + 0.9) + twitch(m.tic + 0.05);
  const hand = {x: -128, y: -318 + 14 * tw};
  const down: Pose = {...IDLE, armL: {a: 6, b: 6}, armR: {a: 6, b: 6}, lookX: 0, lookY: 0.1, brows: 0, mouth: 'flat'};
  const looking: Pose = {...down, armL: reachLocal(hand.x, hand.y, -1), lookX: -0.95, lookY: 0.15, brows: 0.35, browAsym: 0.8, mouth: 'hmm', tilt: -5};
  const pose = mixPose(down, looking, easeInOut(raise));
  return (
    <g>
      <defs>
        <linearGradient id="s3sf-wall" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={lit(K.stoccoWall, 0.22)} />
          <stop offset="1" stopColor={K.stoccoWall} />
        </linearGradient>
      </defs>
      <rect x={-40} y={-600} width={2000} height={1210} fill="url(#s3sf-wall)" />
      <rect x={-40} y={584} width={2000} height={26} fill={K.stoccoWallDeep} />
      {/* the room behind him: a door and a coat hook */}
      <rect x={1380} y={-120} width={300} height={706} rx={8} fill="#C9A27A" stroke={INK} strokeWidth={6} />
      <rect x={1410} y={-90} width={240} height={250} rx={6} fill={shade('#C9A27A', 0.08)} stroke={INK} strokeWidth={4} />
      <rect x={1410} y={200} width={240} height={340} rx={6} fill={shade('#C9A27A', 0.08)} stroke={INK} strokeWidth={4} />
      <circle cx={1420} cy={360} r={14} fill={K.saffron} stroke={INK} strokeWidth={4} />
      <circle cx={360} cy={170} r={70} fill="#FFFFFF" stroke={INK} strokeWidth={6} />
      <path d="M360,170 L360,124 M360,170 L392,186" stroke={INK} strokeWidth={6} strokeLinecap="round" />
      <CrewChar look={STOCCO} pose={pose} frame={f} x={960} y={1034} scale={2} shadow={false} id="s3stoF" seed={5} headGear={<><SwimCap mark={false} /><Earbuds /><g stroke="#FFFFFF" strokeWidth={4} strokeLinecap="round"><path d="M 18 -424 l 12 12 M 30 -424 l -12 12" /></g></>} life={0.6} />
      <path d="M-40,610 L1960,610 L1960,1660 L-40,1660 Z" fill="#D9A773" stroke={INK} strokeWidth={6} />
      <path d="M-40,610 L1960,610" stroke={lit('#D9A773', 0.35)} strokeWidth={8} />
      {/* the raised hand is drawn again in front of the desk edge when it is up */}
      {raise > 0.5 && <CrewChar look={STOCCO} pose={pose} frame={f} x={960} y={1034} scale={2} shadow={false} id="s3stoF2" seed={5} front="L" pass="frontArm" life={0.6} />}
      <Tag x={1370} y={104} text="felt like a nervous tic" size={40} k={clamp((t - (m.tic - 0.25)) / 0.3) * (1 - clamp((t - (m.imagine - 0.2)) / 0.3))} />
    </g>
  );
};
