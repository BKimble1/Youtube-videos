// V3 Sequence C, part 1 (44.64 -> 64.06 s): the game, Rao, his brain rhythm, the EEG computer, the cursor and the one
// command leaving Rao's lab. One world ("R", lab units) that the camera travels through without a cut:
//  - the plain game full frame (the B->C contract); the rocket launches on "rocket" and the camera follows it up;
//  - PULL BACK THROUGH THE SCREEN: the game was Rao's monitor; the pull-out reveals Rao (crew3 rig, front view) with his
//    eyes on the rocket;
//  - his concentration: brows knit, the head leans toward the screen, the eyes squint on each imagined attempt; his
//    real right hand (frame-left) lies still on the desk while a translucent "imagined" hand lifts and grips;
//  - PUSH TO THE CAP: the cap over his LEFT motor cortex (frame-right in this front view) turns see-through: the
//    brain's rhythm pulses in the cortex under the electrode, and the electrode's wire starts to carry it;
//  - the waveform rides the wire and the cap cable to the EEG computer (the camera follows it) and becomes the trace on
//    its readout, which shrinks on "changes";
//  - the computer watches (threshold band) and sends "up" to the screen: the cursor climbs to the FIRE target;
//  - on the hit a pulse returns to the computer, which sends ONE command (the FIRE chip) up the network cable; the
//    camera rides it into the wall jack (match cut to the campus, c_campus).
import React from 'react';
import {lit, mix, shade} from '../dc/color';
import {clamp, easeIn, easeInOut, easeOut, fmt, hash, lerp, smooth} from '../dc/math';
import {SoftShadow} from '../dc/shade';
import {GameScreen, GEvent} from '../art/game';
import {CrewChar, IDLE, Look, Pose} from './crew3';
import {RAO} from '../art/people';
import {FONT_HEAD, INK, K, Monitor, Packet, Tag} from '../art/kit';
import {CamS, FPS} from './core2';
import {GAME_FULL} from './contracts';
import {camPath, camT} from './c_cam';
import {ct, cursorAt, G_DUR, G_FIRE, gameClock} from './c_time';

type V = {x: number; y: number};
export const gameEvents = (): GEvent[] => [{kind: 'rocket', t0: 0, dur: G_DUR, fire: G_FIRE}];
const ramp = (t: number, a: number, b: number) => clamp((t - a) / (b - a || 1e-6));
const sramp = (t: number, a: number, b: number) => smooth(ramp(t, a, b));

// ---------------------------------------------------------------- layout of the R world
export const RAO_X = 520, RAO_GY = 1080, RAO_S = 2.1;
const HY = -372, HR = 58;
/** the electrode over his left motor cortex (C3; frame-right in a front view), head-local */
const C3 = {x: 40, y: HY - HR + 22 - 12};
const DESK_Y = 640;
const TOWER = {x0: 1040, x1: 1260, y0: 420, y1: 720};
export const LCD = {x0: 1062, x1: 1238, y0: 446, y1: 560};
const LCD_C = {x: (LCD.x0 + LCD.x1) / 2, y: (LCD.y0 + LCD.y1) / 2};
export const MON = {x: 1760, y: 720, s: 1};
/** Rao's game screen (top-left of the 640 x 400 screen) in the R world */
export const SCR = {x: MON.x - 320, y: MON.y - 510};
const PLATE = {x: 1300, y: 132};
const MON_CABLE: V[] = [{x: 1260, y: 660}, {x: 1360, y: 712}, {x: 1560, y: 726}, {x: 1700, y: 712}];
const NET_CABLE: V[] = [{x: 1205, y: 420}, {x: 1210, y: 300}, {x: 1296, y: 260}, {x: PLATE.x, y: PLATE.y + 40}];
const cursorR = (c: number) => ({x: SCR.x + 52, y: SCR.y + 364 - clamp(c) * 300});
const TARGET_R = {x: SCR.x + 52, y: SCR.y + 52};
/** his forearms rest on the desk, pointing inward; the right arm is rig side -1 (frame-left in this front view) */
const ARM_REST = {a: 18, b: -66};

export const bz = (p: V[], u: number): V => {
  const a = (1 - u) ** 3, b = 3 * u * (1 - u) ** 2, c = 3 * u * u * (1 - u), d = u ** 3;
  return {x: a * p[0].x + b * p[1].x + c * p[2].x + d * p[3].x, y: a * p[0].y + b * p[1].y + c * p[2].y + d * p[3].y};
};
const bzD = (p: V[]) => `M${fmt(p[0].x)},${fmt(p[0].y)} C${fmt(p[1].x)},${fmt(p[1].y)} ${fmt(p[2].x)},${fmt(p[2].y)} ${fmt(p[3].x)},${fmt(p[3].y)}`;
export const Cable: React.FC<{p: V[]; w?: number; color?: string}> = ({p, w = 9, color = '#3B4A57'}) => (
  <g fill="none" strokeLinecap="round">
    <path d={bzD(p)} stroke={INK} strokeWidth={w + 6} />
    <path d={bzD(p)} stroke={color} strokeWidth={w} />
  </g>
);
/** data dots flowing along a cable */
export const CableFlow: React.FC<{p: V[]; t: number; k: number; color?: string; n?: number; speed?: number; r?: number; reverse?: boolean}> = ({p, t, k, color = K.teal, n = 5, speed = 0.8, r = 7, reverse = false}) => {
  if (k <= 0.01) return null;
  return (
    <g opacity={clamp(k)}>
      {Array.from({length: n}, (_, i) => {
        const u0 = (((t * speed + i / n) % 1) + 1) % 1;
        const q = bz(p, reverse ? 1 - u0 : u0);
        return (
          <g key={i}>
            <circle cx={fmt(q.x)} cy={fmt(q.y)} r={r * 2} fill={color} opacity={0.3} />
            <circle cx={fmt(q.x)} cy={fmt(q.y)} r={r} fill={color} stroke={INK} strokeWidth={2} />
          </g>
        );
      })}
    </g>
  );
};

// ---------------------------------------------------------------- the rhythm (shared by the cortex, the wire and the LCD)
/** relative rhythm amplitude at signal time s: the regular mu rhythm, which shrinks when he imagines */
export const rhythmAmp = (s: number) => 1 - 0.76 * smooth(clamp((s - ct().changes) / 0.45));
const RHZ = 2.9; // the drawn rhythm (slowed for the eye)
/** a scope trace over [x0, x1] centred on cy: newest signal at the right edge, scrolling left */
const tracePath = (t: number, x0: number, x1: number, cy: number, A: number, n = 160) => {
  const span = 1.7;
  let d = '';
  for (let i = 0; i <= n; i++) {
    const u = i / n;
    const s = t - (1 - u) * span;
    const a = rhythmAmp(s);
    const y = cy - A * a * Math.sin(s * Math.PI * 2 * RHZ) * (0.88 + 0.12 * Math.sin(s * 4.3)) - A * 0.07 * Math.sin(s * 41 + 1) * (1.2 - a);
    d += `${i ? 'L' : 'M'}${fmt(lerp(x0, x1, u))},${fmt(y)}`;
  }
  return d;
};

// ---------------------------------------------------------------- Rao's acting
const attempt = (t: number, a: number) => {
  const d = t - a;
  if (d < 0 || d > 1.3) return 0;
  return d < 0.42 ? easeInOut(d / 0.42) : d < 0.72 ? 1 : 1 - easeInOut((d - 0.72) / 0.58);
};
/** the two imagined movements: on "moving his right hand" and again while "his real hand stays put" */
const attempts = (t: number) => {
  const c = ct();
  const a1 = c.moving + 0.08, a2 = c.stays + 0.32;
  return {k: Math.max(attempt(t, a1), attempt(t, a2)), grip: Math.max(sramp(t, a1 + 0.42, a1 + 0.66) * (1 - sramp(t, a1 + 0.8, a1 + 1.1)), sramp(t, a2 + 0.42, a2 + 0.66) * (1 - sramp(t, a2 + 0.8, a2 + 1.1)))};
};
export const ghostK = (t: number) => {
  const c = ct();
  return ramp(t, c.moving - 0.02, c.moving + 0.22) * (1 - ramp(t, c.putE + 0.2, c.putE + 0.5));
};
const pumpK = (t: number) => {
  const c = ct();
  // anticipation dip, a quick rise ending on the cut to Stocco (the matched upward motion)
  const dip = sramp(t, c.front - 0.42, c.front - 0.3) * (1 - sramp(t, c.front - 0.3, c.front - 0.22));
  const up = easeOut(ramp(t, c.front - 0.3, c.front + 0.02));
  return {dip, up};
};
export const raoPose = (t: number): Pose => {
  const c = ct();
  const conc = sramp(t, c.imag - 0.15, c.imag + 0.4) * (1 - 0.45 * sramp(t, c.target + 0.1, c.target + 0.6));
  const att = attempts(t);
  const relief = sramp(t, c.disW + 0.05, c.disW + 0.55);
  const tense = sramp(t, c.cut + 1.2, c.cut + 1.6) * (1 - relief);
  // the eyes follow the action on his screen: the rocket climbing, then the cursor climbing to FIRE
  const cur = cursorAt(t);
  const curLook = 0.25 - 0.55 * cur;
  const lookY = t < c.imag ? lerp(0.05, -0.3, sramp(t, c.rocket + 0.6, c.rocket + 1.2)) : t < c.screen ? lerp(-0.3, 0.1, sramp(t, c.imag, c.imag + 0.8)) : t < c.cut ? curLook : lerp(-0.1, -0.35, relief);
  const pump = pumpK(t);
  return {
    ...IDLE,
    armL: ARM_REST,
    armR: {a: ARM_REST.a + 4 * pump.dip + 22 * pump.up, b: ARM_REST.b - 8 * pump.dip + 200 * pump.up},
    handL: {curl: 0.14, spread: 0.18},
    handR: {curl: lerp(0.14, 0.95, sramp(t, c.front - 0.6, c.front - 0.42)), spread: 0.15},
    lean: -1.5 * relief,
    tilt: 2.6 * conc + 1.2 * att.k + 1.5 * tense - 3 * relief,
    lookX: 0.86,
    lookY,
    brows: -0.5 * conc - 0.25 * att.k - 0.3 * tense + 0.45 * relief,
    browAsym: 0,
    mouth: relief > 0.4 ? (t > c.disW + 0.5 ? 'grin' : 'smile') : conc > 0.4 || tense > 0.4 ? 'flat' : 'smile',
    bob: -5 * conc - 3 * att.k - 4 * tense + 4 * relief,
    blink: att.k > 0.3 ? 1 - 0.3 * att.k : tense > 0.5 ? 0.85 : undefined,
  };
};
const ghostPose = (t: number): Pose => {
  const att = attempts(t);
  const p = raoPose(t);
  return {...p, armL: {a: ARM_REST.a + 8 * att.k, b: ARM_REST.b - 58 * att.k}, handL: {curl: lerp(lerp(0.14, 0.02, att.k), 0.95, att.grip), spread: lerp(0.18, 0.75, att.k) * (1 - att.grip)}};
};
const GHOST: Look = {...RAO, skin: '#A5E3DD', shirt: '#A5E3DD'};

/** head-local point -> R world, through the rig's tilt, lean and bob (life 0) */
const rotAbout = (p: V, deg: number, o: V): V => {
  const a = (deg * Math.PI) / 180, cs = Math.cos(a), sn = Math.sin(a);
  const dx = p.x - o.x, dy = p.y - o.y;
  return {x: o.x + dx * cs - dy * sn, y: o.y + dx * sn + dy * cs};
};
const headW = (p: V, pose: Pose): V => {
  const a = rotAbout(p, pose.tilt, {x: 0, y: HY + 50});
  const b = rotAbout(a, pose.lean, {x: 0, y: -150});
  return {x: RAO_X + RAO_S * b.x, y: RAO_GY + RAO_S * (b.y + (pose.bob ?? 0))};
};

// ---------------------------------------------------------------- the EEG cap (with the see-through window at C3)
const CAP_D = `M ${-HR - 4} ${HY + 4} Q ${-HR - 6} ${HY - HR - 22} 0 ${HY - HR - 20} Q ${HR + 6} ${HY - HR - 22} ${HR + 4} ${HY + 4} Q ${HR * 0.5} ${HY - 18} 0 ${HY - 20} Q ${-HR * 0.5} ${HY - 18} ${-HR - 4} ${HY + 4} Z`;
const ELECS: [number, number][] = [[-40, -12], [-20, -34], [0, -40], [20, -34], [40, -12], [-30, 4], [0, -16], [30, 4], [-50, 6], [50, 6]];
/** sulci of the cortex patch under C3 (head-local): wavy folds running roughly front-to-back, the central sulcus
 *  crossing them */
let sulci: string[] | null = null;
const SULCI = () =>
  (sulci ??= Array.from({length: 9}, (_, n) => {
    const y0 = C3.y - 44 + n * 11;
    let d = `M${fmt(C3.x - 50)},${fmt(y0)}`;
    for (let k = 0; k < 10; k++) {
      const x1 = C3.x - 50 + (k + 1) * 10;
      const amp = 3 + 2.5 * hash(n * 7 + k, 5);
      d += ` Q${fmt(x1 - 5)},${fmt(y0 + (k % 2 ? amp : -amp) + 2 * Math.sin(n + k))} ${fmt(x1)},${fmt(y0 + 1.5 * Math.sin(n * 1.7 + k * 0.9))}`;
    }
    return d;
  }));
const RaoCap: React.FC<{t: number; xr: number; live: number}> = ({t, xr, live}) => {
  const amp = rhythmAmp(t);
  const ph = 0.5 + 0.5 * Math.sin(t * Math.PI * 2 * RHZ);
  const g = gameClock(t);
  return (
    <g>
      <defs>
        <clipPath id="vc-cap-clip"><path d={CAP_D} /></clipPath>
        <radialGradient id="vc-xr-g" cx={C3.x} cy={C3.y} r={36} gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity={1} />
          <stop offset="0.6" stopColor="#FFFFFF" stopOpacity={0.95} />
          <stop offset="1" stopColor="#FFFFFF" stopOpacity={0} />
        </radialGradient>
        <mask id="vc-xr-mask" maskUnits="userSpaceOnUse" x={C3.x - 60} y={C3.y - 60} width={120} height={120}>
          <rect x={C3.x - 60} y={C3.y - 60} width={120} height={120} fill="url(#vc-xr-g)" />
        </mask>
        <clipPath id="vc-lensR"><rect x={7} y={-393} width={30} height={26} rx={7} /></clipPath>
        <clipPath id="vc-lensL"><rect x={-37} y={-393} width={30} height={26} rx={7} /></clipPath>
      </defs>
      {/* the game reflected in his glasses: his eyes stay on the screen */}
      {[['vc-lensL', -22], ['vc-lensR', 22]].map(([id, cx]) => (
        <g key={id as string} clipPath={`url(#${id})`} opacity={0.2}>
          <g transform={`translate(${fmt((cx as number) - 15)} -393) scale(${(30 / 640).toFixed(5)})`}>
            <GameScreen t={g} events={gameEvents()} />
          </g>
        </g>
      ))}
      <path d={CAP_D} fill="#3B4A57" stroke={INK} strokeWidth={4} strokeLinejoin="round" />
      {xr > 0.005 && (
        <g clipPath="url(#vc-cap-clip)">
          <g mask="url(#vc-xr-mask)" opacity={xr}>
            <rect x={C3.x - 60} y={C3.y - 60} width={120} height={120} fill="#E9A39B" />
            <rect x={C3.x - 60} y={C3.y - 60} width={120} height={120} fill={K.teal} opacity={0.55 * amp * ph} />
            {SULCI().map((d, i) => <path key={i} d={d} fill="none" stroke="#B5615E" strokeWidth={1.8} strokeLinecap="round" opacity={0.8} />)}
            <path d={`M${C3.x - 14},${C3.y - 50} Q${C3.x - 4},${C3.y - 10} ${C3.x + 16},${C3.y + 40}`} fill="none" stroke="#9C4D4B" strokeWidth={2.8} strokeLinecap="round" />
          </g>
        </g>
      )}
      {ELECS.map(([x, y], i) => {
        const isC3 = i === 4;
        const gl = isC3 ? live * (0.35 + 0.65 * ph * amp) : 0;
        return (
          <g key={i}>
            {gl > 0.02 && <circle cx={x} cy={HY - HR + 22 + y} r={10} fill={K.teal} opacity={0.3 * gl} />}
            <circle cx={x} cy={HY - HR + 22 + y} r={6.5} fill={mix('#D9DEE2', K.teal, gl)} stroke={INK} strokeWidth={2.5} />
          </g>
        );
      })}
      {/* the electrode's lead under the cap to the bundle, then the bundle down to the shoulder */}
      <path d={`M ${C3.x} ${C3.y + 6} Q ${C3.x + 14} ${C3.y + 22} ${HR - 2} ${HY - 6}`} fill="none" stroke={INK} strokeWidth={3} opacity={0.35 + 0.65 * xr} />
      <path d={`M ${HR - 2} ${HY - 6} Q ${HR + 30} ${HY + 30} ${HR + 26} ${HY + 120}`} fill="none" stroke={INK} strokeWidth={7} strokeLinecap="round" />
    </g>
  );
};

// ---------------------------------------------------------------- the wave riding the wire (cap -> cable -> computer)
const quadPt = (a: V, b: V, c: V, u: number): V => ({x: (1 - u) * (1 - u) * a.x + 2 * u * (1 - u) * b.x + u * u * c.x, y: (1 - u) * (1 - u) * a.y + 2 * u * (1 - u) * b.y + u * u * c.y});
const capCable = (pose: Pose): V[] => {
  const s = headW({x: HR + 26, y: HY + 120}, pose);
  return [s, {x: s.x + 44, y: s.y + 109}, {x: 900, y: 700}, {x: 1040, y: 640}];
};
const wirePts = (pose: Pose) => {
  const pts: V[] = [];
  for (let i = 0; i <= 8; i++) pts.push(headW(quadPt({x: C3.x, y: C3.y + 6}, {x: C3.x + 14, y: C3.y + 22}, {x: HR - 2, y: HY - 6}, i / 8), pose));
  for (let i = 1; i <= 16; i++) pts.push(headW(quadPt({x: HR - 2, y: HY - 6}, {x: HR + 30, y: HY + 30}, {x: HR + 26, y: HY + 120}, i / 16), pose));
  const cc = capCable(pose);
  for (let i = 1; i <= 40; i++) pts.push(bz(cc, i / 40));
  const L = [0];
  for (let i = 1; i < pts.length; i++) L.push(L[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y));
  return {pts, L};
};
const WAVE_V = 700; // px per second along the wire
const WAVE_L = 205; // wavelength (px): about 3.4 cycles per second at the eye
export const waveT0 = () => ct().rhythm - 0.12;
const WireWave: React.FC<{t: number; pose: Pose; k: number}> = ({t, pose, k}) => {
  if (k <= 0.01) return null;
  const {pts, L} = wirePts(pose);
  const total = L[L.length - 1];
  const front = WAVE_V * (t - waveT0());
  if (front <= 0) return null;
  let d = '';
  const step = 5;
  for (let s = 0; s <= Math.min(front, total); s += step) {
    let i = 1;
    while (i < L.length - 1 && L[i] < s) i++;
    const u = (s - L[i - 1]) / (L[i] - L[i - 1] || 1);
    const p = {x: lerp(pts[i - 1].x, pts[i].x, u), y: lerp(pts[i - 1].y, pts[i].y, u)};
    const dx = pts[i].x - pts[i - 1].x, dy = pts[i].y - pts[i - 1].y, l = Math.hypot(dx, dy) || 1;
    const n = {x: -dy / l, y: dx / l};
    const env = clamp(s / 40) * clamp((front - s) / 60) * clamp((total - s) / 30);
    const a = 15 * rhythmAmp(t - s / WAVE_V) * env * Math.sin(((s - (t - waveT0()) * WAVE_V) / WAVE_L) * Math.PI * 2);
    d += `${d ? 'L' : 'M'}${fmt(p.x + n.x * a)},${fmt(p.y + n.y * a)}`;
  }
  return (
    <g fill="none" strokeLinecap="round" strokeLinejoin="round" opacity={k}>
      <path d={d} stroke={K.teal} strokeWidth={16} opacity={0.3} />
      <path d={d} stroke={lit(K.teal, 0.35)} strokeWidth={5} />
    </g>
  );
};

// ---------------------------------------------------------------- the EEG computer with its readout
const LcdTrace: React.FC<{t: number; thr: number; up: number}> = ({t, thr, up}) => {
  const A = 24;
  const cy = LCD_C.y;
  return (
    <g>
      <defs>
        <clipPath id="vc-lcd"><rect x={LCD.x0} y={LCD.y0} width={LCD.x1 - LCD.x0} height={LCD.y1 - LCD.y0} /></clipPath>
      </defs>
      <rect x={LCD.x0} y={LCD.y0} width={LCD.x1 - LCD.x0} height={LCD.y1 - LCD.y0} fill={K.screenDark} />
      <g clipPath="url(#vc-lcd)">
        {Array.from({length: 9}, (_, i) => (
          <line key={i} x1={LCD.x0 + (i + 1) * ((LCD.x1 - LCD.x0) / 9)} y1={LCD.y0} x2={LCD.x0 + (i + 1) * ((LCD.x1 - LCD.x0) / 9)} y2={LCD.y1} stroke="#FFFFFF" strokeWidth={0.28} opacity={0.07} />
        ))}
        <line x1={LCD.x0} y1={cy} x2={LCD.x1} y2={cy} stroke="#FFFFFF" strokeWidth={0.28} opacity={0.12} />
        {thr > 0 && (
          <g opacity={thr} stroke={K.saffron} strokeWidth={1.4} strokeDasharray="5 4">
            <line x1={LCD.x0} y1={cy - A * 0.5} x2={LCD.x0 + (LCD.x1 - LCD.x0) * thr} y2={cy - A * 0.5} />
            <line x1={LCD.x0} y1={cy + A * 0.5} x2={LCD.x0 + (LCD.x1 - LCD.x0) * thr} y2={cy + A * 0.5} />
          </g>
        )}
        <path d={tracePath(t, LCD.x0, LCD.x1, cy, A)} fill="none" stroke={K.teal} strokeWidth={1.3} strokeLinejoin="round" strokeLinecap="round" />
        {up > 0.01 && (
          <g transform={`translate(${LCD.x1 - 18} ${LCD.y0 + 20}) scale(${fmt(0.6 + 0.4 * up)})`} opacity={up}>
            <circle r={13} fill={K.saffron} stroke={INK} strokeWidth={1.5} />
            <path d="M0,-7 L7,3 L2,3 L2,8 L-2,8 L-2,3 L-7,3 Z" fill={INK} />
          </g>
        )}
      </g>
    </g>
  );
};

const Tower: React.FC<{light: number; lightColor: string}> = ({light, lightColor}) => {
  const {x0, x1, y0, y1} = TOWER;
  return (
    <g>
      <SoftShadow id="vc-tw-sh" c={{x: (x0 + x1) / 2, y: y1 + 4}} rx={150} ry={16} alpha={0.25} />
      <rect x={x0} y={y0} width={x1 - x0} height={y1 - y0} rx={16} fill="#D9DEE2" stroke={INK} strokeWidth={6} />
      <rect x={x0 + 8} y={y0 + 8} width={20} height={y1 - y0 - 16} rx={8} fill="#FFFFFF" opacity={0.35} />
      <rect x={LCD.x0 - 8} y={LCD.y0 - 8} width={LCD.x1 - LCD.x0 + 16} height={LCD.y1 - LCD.y0 + 16} rx={10} fill="#46525C" stroke={INK} strokeWidth={5} />
      <text x={x0 + 40} y={600} fontFamily={FONT_HEAD} fontWeight={700} fontSize={26} fill="#7E8B96">EEG</text>
      {[0, 1].map((i) => <rect key={i} x={x0 + 40} y={616 + i * 22} width={x1 - x0 - 110} height={12} rx={6} fill="#B5BEC6" />)}
      <rect x={x0 - 14} y={620} width={20} height={34} rx={5} fill="#46525C" stroke={INK} strokeWidth={4} />
      <circle cx={x1 - 36} cy={652} r={13} fill={mix('#6E7C86', lightColor, light)} stroke={INK} strokeWidth={4} />
      {light > 0.05 && <circle cx={x1 - 36} cy={652} r={24} fill={lightColor} opacity={0.3 * light} />}
      <path d={`M${x0 + 30},${y1 - 26} L${x1 - 30},${y1 - 26}`} stroke="#B5BEC6" strokeWidth={6} strokeLinecap="round" />
    </g>
  );
};

// ---------------------------------------------------------------- the BCI cursor window (slides in from the left edge)
export const CursorWin: React.FC<{cursor: number; k: number; hit: number; merge?: number}> = ({cursor, k, hit, merge = 0}) => {
  if (k <= 0.001) return null;
  const pop = 1 + 0.16 * Math.sin(clamp(hit * 1.6) * Math.PI) * (hit > 0 ? 1 : 0);
  return (
    <g transform={`translate(${fmt(-110 * (1 - easeOut(k)))} 0)`}>
      <rect x={6} y={6} width={92} height={388} rx={10} fill="#1F3442" opacity={0.92} stroke={INK} strokeWidth={3} />
      <g transform={`translate(52 52) scale(${fmt(pop)})`}>
        <circle cx={0} cy={0} r={34} fill={mix(K.blue, K.saffron, clamp(hit * 1.5))} stroke="#FFFFFF" strokeWidth={4} />
        <text x={0} y={7} textAnchor="middle" fontFamily={FONT_HEAD} fontWeight={700} fontSize={19} fill={hit > 0.4 ? INK : '#FFFFFF'}>FIRE</text>
      </g>
      <line x1={52} y1={92} x2={52} y2={370} stroke="#FFFFFF" strokeWidth={2} strokeDasharray="4 8" opacity={0.35} />
      <rect x={36} y={fmt(354 - clamp(cursor) * 300)} width={32} height={20} rx={4} fill="#FFFFFF" stroke={INK} strokeWidth={2.5} opacity={(1 - merge) * (1 - clamp(hit * 4))} />
    </g>
  );
};

// ---------------------------------------------------------------- the FIRE command
/** 0..1 progress of the hit pulse running back along the monitor cable to the computer */
const backPulse = (t: number) => {
  const c = ct();
  return ramp(t, c.target + 0.22, c.sends - 0.04);
};
export const packetPath = (t: number) => {
  const c = ct();
  const t0 = c.sends, t1 = c.internet + 0.02;
  const u = easeInOut(clamp((t - t0) / (t1 - t0)));
  return {p: bz(NET_CABLE, u), k: clamp((t - t0) / 0.12), t0, t1};
};
/** the chip's on-screen scale stays constant while the camera moves */
export const PACKET_SCREEN_S = 0.85;

// ---------------------------------------------------------------- the room
export const RaoRoom: React.FC<{t: number; f: number; cam: CamS}> = ({t, f, cam}) => {
  const c = ct();
  const g = gameClock(t);
  const pose = raoPose(t);
  const gk = ghostK(t);
  const cur = cursorAt(t);
  const curK = clamp((t - (c.computer + 0.9)) / 0.5);
  const hitK = t > c.target ? clamp((t - c.target) / 0.5) * (1 - clamp((t - (c.target + 1.0)) / 0.5)) : 0;
  const xr = sramp(t, c.cap - 0.1, c.cap + 0.45) * (1 - sramp(t, c.changes - 0.2, c.changes + 0.3));
  const live = sramp(t, c.cap, c.cap + 0.4);
  const waveK = clamp((t - waveT0()) / 0.1) * (1 - 0.6 * sramp(t, c.computer + 0.3, c.computer + 0.9)) * (1 - sramp(t, c.target, c.target + 0.4));
  const monFlow = sramp(t, c.watching - 0.1, c.watching + 0.3) * (1 - sramp(t, c.target - 0.1, c.target + 0.2));
  const thr = clamp((t - (c.computer + 0.05)) / 0.5);
  const up = clamp((t - (c.watching + 0.1)) / 0.25);
  const sent = t > c.sends - 0.08 && t < c.internetE + 0.4;
  const light = sent ? 1 : t > c.computer ? 0.35 + 0.35 * (Math.sin(t * 10) > 0 ? 1 : 0) : 0;
  const pp = packetPath(t);
  const plateGlow = clamp((t - (c.internet - 0.05)) / 0.2);
  const bp = backPulse(t);
  const common = {look: RAO, pose, frame: f, x: RAO_X, y: RAO_GY, scale: RAO_S, shadow: false, life: 0, eyeDarts: false, seed: 3};
  return (
    <g>
      <defs>
        <linearGradient id="vc-r-wall" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={lit(K.raoWall, 0.28)} />
          <stop offset="1" stopColor={K.raoWall} />
        </linearGradient>
        <linearGradient id="vc-r-top" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={shade(K.deskTop, 0.12)} />
          <stop offset="1" stopColor={lit(K.deskTop, 0.12)} />
        </linearGradient>
      </defs>
      <rect x={-900} y={-900} width={4000} height={1560} fill="url(#vc-r-wall)" />
      <rect x={-900} y={DESK_Y - 30} width={4000} height={30} fill={K.raoWallDeep} />
      {/* pinboard and a window on the campus */}
      <rect x={40} y={60} width={250} height={180} rx={8} fill="#E9D8B8" stroke={INK} strokeWidth={6} />
      <rect x={72} y={88} width={74} height={56} fill="#FFFFFF" stroke={INK} strokeWidth={4} transform="rotate(-4 109 116)" />
      <rect x={176} y={98} width={78} height={90} fill={K.blueLight} stroke={INK} strokeWidth={4} transform="rotate(5 215 143)" />
      <g>
        <rect x={760} y={40} width={250} height={300} rx={8} fill={K.sky} stroke={INK} strokeWidth={6} />
        <rect x={830} y={170} width={120} height={170} fill={K.brick} stroke={INK} strokeWidth={4} />
        {[0, 1, 2].map((r) => [0, 1].map((q) => <rect key={`${r}${q}`} x={846 + q * 52} y={188 + r * 48} width={36} height={30} fill="#BFD9E8" stroke={INK} strokeWidth={3} />))}
        <circle cx={790} cy={300} r={40} fill={K.grassDeep} stroke={INK} strokeWidth={4} />
        <rect x={760} y={40} width={250} height={300} rx={8} fill="none" stroke={K.stone} strokeWidth={14} />
        <rect x={760} y={40} width={250} height={300} rx={8} fill="none" stroke={INK} strokeWidth={5} />
        <line x1={885} y1={40} x2={885} y2={340} stroke={K.stone} strokeWidth={10} />
      </g>
      {/* the network wall plate (where the one command leaves the lab) */}
      <g>
        <rect x={PLATE.x - 34} y={PLATE.y - 44} width={68} height={88} rx={8} fill="#F4F6F8" stroke={INK} strokeWidth={5} />
        <rect x={PLATE.x - 16} y={PLATE.y - 22} width={32} height={26} rx={3} fill="#2D363D" stroke={INK} strokeWidth={3} />
        {plateGlow > 0 && <rect x={PLATE.x - 16} y={PLATE.y - 22} width={32} height={26} rx={3} fill={K.saffron} opacity={0.85 * plateGlow} />}
      </g>
      {/* Rao: body pass (the head carries the EEG cap and its see-through window) */}
      <CrewChar {...common} front="L" pass="body" id="vc-rao" headGear={<RaoCap t={t} xr={xr} live={live} />} />
      {/* desk */}
      <path d={`M-900,${DESK_Y} L3100,${DESK_Y} L3100,1900 L-900,1900 Z`} fill="url(#vc-r-top)" stroke={INK} strokeWidth={6} />
      <path d={`M-900,${DESK_Y} L3100,${DESK_Y}`} stroke={lit(K.deskTop, 0.35)} strokeWidth={8} />
      {/* cables: cap -> computer -> monitor; computer -> network plate */}
      <Cable p={capCable(pose)} />
      <Cable p={NET_CABLE} color="#5D6B76" w={8} />
      <Cable p={MON_CABLE} />
      <Tower light={light} lightColor={sent || t > c.target - 0.1 ? K.saffron : K.teal} />
      <LcdTrace t={t} thr={thr} up={up} />
      <Monitor id="vc-rmon" x={MON.x} y={MON.y} s={MON.s}>
        <GameScreen t={g} events={gameEvents()} />
        <CursorWin cursor={cur} k={curK} hit={hitK} />
      </Monitor>
      <CableFlow p={MON_CABLE} t={t} k={monFlow} color={K.teal} speed={1.1} />
      {bp > 0 && bp < 1 && (() => {
        const q = bz(MON_CABLE, 1 - easeInOut(bp));
        return (
          <g>
            <circle cx={q.x} cy={q.y} r={26} fill={K.saffron} opacity={0.35} />
            <circle cx={q.x} cy={q.y} r={12} fill={K.saffron} stroke={INK} strokeWidth={3} />
          </g>
        );
      })()}
      <WireWave t={t} pose={pose} k={waveK} />
      {/* Rao's arms on the desk (front passes): his right hand (frame-left) lies still */}
      <CrewChar {...common} front="L" pass="frontArm" id="vc-rao-l" />
      <CrewChar {...common} front="R" pass="frontArm" id="vc-rao-r" />
      {gk > 0.01 && (
        <g opacity={0.62 * gk}>
          <CrewChar {...common} look={GHOST} pose={ghostPose(t)} front="L" pass="frontArm" id="vc-rao-g" />
        </g>
      )}
      <Tag x={250} y={470} text="imagined" size={34} k={clamp((t - (c.right - 0.1)) / 0.25) * (1 - clamp((t - (c.putE + 0.1)) / 0.25))} />
      {t >= pp.t0 && t < pp.t1 + 0.12 && <Packet x={pp.p.x} y={pp.p.y} s={PACKET_SCREEN_S / cam.z} k={pp.k * (1 - clamp((t - pp.t1) / 0.1))} />}
    </g>
  );
};

// ---------------------------------------------------------------- cameras
/** game camera in game units (gz = 1 is GAME_FULL) */
export const gameCam = (t: number): CamS => {
  const c = ct();
  const g = camPath(t, [
    [c.start, {x: 320, y: 200, z: 1}],
    [c.watch + 0.1, {x: 320, y: 200, z: 1}],
    [c.rocket - 0.05, {x: 215, y: 238, z: 1.2}],
    [c.rocket + 0.75, {x: 250, y: 190, z: 1.45}],
  ]);
  return {...g, x: clamp(g.x, 320 / g.z, 640 - 320 / g.z), y: clamp(g.y, 20 + 180 / g.z, 380 - 180 / g.z)};
};
export const gameT = (gc: CamS) => `translate(960 540) scale(${fmt(3 * gc.z)}) translate(${fmt(-gc.x)} ${fmt(-gc.y)})`;
/** the game camera expressed in the R world (the game is Rao's monitor at 1:1) */
export const fromGame = (gc: CamS): CamS => ({x: SCR.x + gc.x, y: SCR.y + gc.y, z: 3 * gc.z});
const T_SWITCH = () => ct().rocket + 0.72;

export const raoCam = (t: number): CamS => {
  const c = ct();
  const ts = T_SWITCH();
  const TWO: CamS = {x: 1110, y: 430, z: 0.99};
  const MED: CamS = {x: 470, y: 505, z: 1.5};
  const STILL: CamS = {x: 440, y: 540, z: 1.72};
  const CAPC: CamS = {x: 585, y: 262, z: 3.5};
  const CAPX: CamS = {x: 600, y: 268, z: 3.9};
  const LCDF: CamS = {x: LCD_C.x, y: LCD_C.y + 6, z: 6.2};
  const WATCH: CamS = {x: 860, y: 440, z: 1.5};
  const MONV: CamS = {x: 1650, y: 430, z: 1.55};
  const cy = (tt: number) => cursorR(cursorAt(tt)).y;
  const CUR0: CamS = {x: SCR.x + 52 + 150, y: cy(c.cursor) - 60, z: 3.3};
  const TGT: CamS = {x: SCR.x + 52 + 170, y: TARGET_R.y + 40, z: 4.0};
  const BACK: CamS = {x: 1440, y: 520, z: 1.3};
  const TOWERC: CamS = {x: 1215, y: 430, z: 2.2};
  const pe = packetPath(c.internet).p;
  const PLATEC: CamS = {x: pe.x, y: pe.y, z: 4.2};
  if (t < c.screen + 0.5) {
    return camPath(t, [
      [ts, fromGame(gameCam(ts))],
      [c.imag + 0.62, TWO, (u) => easeInOut(u)],
      [c.moving + 0.05, {...TWO, x: 1060, z: 1.03}],
      [c.right + 0.35, MED],
      [c.stays, {...MED, x: 460, y: 515, z: 1.56}],
      [c.putE + 0.1, STILL],
      [c.but + 0.05, {...STILL, x: 450, y: 520, z: 1.8}],
      [c.cap + 0.15, CAPC],
      [c.rhythm - 0.05, CAPX],
      [c.rhythm + 0.45, {x: 700, y: 500, z: 2.6}, easeIn],
      [c.changes - 0.4, {x: 950, y: 610, z: 2.4}, (u) => u],
      [c.changes - 0.05, LCDF, easeOut],
      [c.changesE + 0.4, {...LCDF, z: 6.8}],
      [c.computer + 0.75, WATCH],
      [c.changeE + 0.15, {...WATCH, x: 960, z: 1.45}],
      [c.screen + 0.5, MONV],
    ]);
  }
  if (t < c.target) {
    const t0 = c.screen + 0.5;
    if (t < c.cursor) return camPath(t, [[t0, MONV], [c.cursor, CUR0]]);
    const u = clamp((t - c.cursor) / (c.target - c.cursor));
    const q = clamp((cy(c.cursor) - cy(t)) / (cy(c.cursor) - TARGET_R.y));
    return {x: lerp(CUR0.x, TGT.x, smooth(u)), y: lerp(CUR0.y, TGT.y, q), z: lerp(CUR0.z, TGT.z, smooth(u))};
  }
  if (t < c.sends) return camPath(t, [[c.target, TGT], [c.target + 0.3, {...TGT, z: 3.8}], [c.sends - 0.25, BACK], [c.sends, {...TOWERC, z: 2.0}]]);
  // ride the command up the network cable to the wall plate, then into the jack
  const pp = packetPath(t);
  const k = smooth(clamp((t - c.sends) / 0.35));
  const zz = lerp(2.0, PLATEC.z, easeInOut(clamp((t - c.sends) / (c.internet - c.sends))));
  const ride = {x: lerp(TOWERC.x, pp.p.x, k), y: lerp(TOWERC.y, pp.p.y, k), z: zz};
  const dive = easeIn(clamp((t - c.internet) / (c.internet + 0.1 - c.internet)));
  return {...ride, z: ride.z * Math.pow(2.1, dive)};
};

/** the whole part-1 shot (screen space) */
export const RaoShot: React.FC<{t: number; f: number}> = ({t, f}) => {
  const c = ct();
  const ts = T_SWITCH();
  if (t < ts) {
    const gc = gameCam(t);
    return (
      <g>
        <rect x={0} y={0} width={1920} height={1080} fill={K.screenDark} />
        <g transform={t <= c.start + 1 / FPS ? GAME_FULL : gameT(gc)}>
          <GameScreen t={gameClock(t)} events={gameEvents()} />
        </g>
      </g>
    );
  }
  const cam = raoCam(t);
  return <g transform={camT(cam)}><RaoRoom t={t} f={f} cam={cam} /></g>;
};

export {easeIn};
