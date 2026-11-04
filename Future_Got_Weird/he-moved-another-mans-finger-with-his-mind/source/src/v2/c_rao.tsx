// Sequence C, part 1 (44.64 -> ~63.7 s): the game, Rao, his brain rhythm, the EEG computer, the cursor and the
// one command leaving Rao's lab. One world ("R", 1920 x 1080 lab units) that the camera travels through:
//  - the game seen full-frame (the B->C contract) launches the rocket and tracks it into slow motion;
//  - pull-out: the game is the reflection in Rao's glasses, and his concentrating face appears around it;
//  - down his arm to his RIGHT hand: the imagined movement is a dashed ghost, the real hand stays flat;
//  - up to the EEG cap and into the electrode over his LEFT motor cortex (frame-right in this front view): the
//    brain's regular rhythm (mu band) fills the frame and SHRINKS when he imagines the movement;
//  - the same trace becomes the EEG computer's readout; the pull-out reveals the cap, cable and computer, which
//    watches for the drop (threshold);
//  - along the cable to his screen: an extreme close-up follows the cursor up to the blue FIRE target;
//  - the computer sends one FIRE command up the network cable; the camera rides it to the wall jack (match-cut to
//    the campus in c_campus).
import React from 'react';
import {lit, mix, shade} from '../dc/color';
import {Inked} from '../dc/ink';
import {clamp, easeIn, easeInOut, easeOut, fmt, hash, lerp, smooth} from '../dc/math';
import {Capsule, SoftShadow} from '../dc/shade';
import {GameScreen, GEvent} from '../art/game';
import {FLAT, HandPoseP, mixP, SideHand} from '../art/hand';
import {CrewChar, IDLE, Pose} from '../art/crew';
import {EEGCap, RAO} from '../art/people';
import {FONT_HEAD, INK, K, Monitor, Packet, Tag} from '../art/kit';
import {CamS, FPS} from './core2';
import {GAME_FULL} from './contracts';
import {camPath, camT, toScreen} from './c_cam';
import {ct, cursorAt, G_DUR, G_FIRE, gameClock} from './c_time';

type V = {x: number; y: number};
export const gameEvents = (): GEvent[] => [{kind: 'rocket', t0: 0, dur: G_DUR, fire: G_FIRE}];

// ---------------------------------------------------------------- layout of the R world
const RAO_X = 520, RAO_GY = 1080, RAO_S = 2.1;
const HEAD_C = {x: RAO_X, y: RAO_GY - 372 * RAO_S};
/** the frame-right lens of Rao's glasses (his LEFT eye) */
const LENS = {x0: RAO_X + 7 * RAO_S, y0: RAO_GY + (-378 - 15) * RAO_S, w: 30 * RAO_S, h: 26 * RAO_S, rx: 7 * RAO_S};
const LENS_L = {...LENS, x0: RAO_X - 37 * RAO_S};
const GS = LENS.w / 640; // game units -> R units in the lens
const G0 = {x: LENS.x0 + LENS.w / 2 - 320 * GS, y: LENS.y0 + LENS.h / 2 - 200 * GS};
/** the electrode over his left motor cortex (C3; frame-right in a front view) */
export const ELEC = {x: RAO_X + 40 * RAO_S, y: RAO_GY + (-372 - 58 + 22 - 12) * RAO_S, r: 6.5 * RAO_S};
const HAND = {x: 815, y: 760, s: 0.8, arm: 567, ang: 7.6};
const SHOULDER = {x: RAO_X - 66 * RAO_S, y: RAO_GY - 292 * RAO_S};
const DESK_Y = 640;
const TOWER = {x0: 1040, x1: 1260, y0: 420, y1: 720};
export const LCD = {x0: 1062, x1: 1238, y0: 446, y1: 560};
const LCD_C = {x: (LCD.x0 + LCD.x1) / 2, y: (LCD.y0 + LCD.y1) / 2};
export const LCD_Z = 1920 / (LCD.x1 - LCD.x0);
const MON = {x: 1760, y: 720, s: 1};
const SCR = {x: MON.x - 320, y: MON.y - 510};
const PLATE = {x: 1300, y: 132};
const CAP_CABLE: V[] = [{x: 696, y: 551}, {x: 740, y: 660}, {x: 900, y: 700}, {x: 1040, y: 640}];
const MON_CABLE: V[] = [{x: 1260, y: 660}, {x: 1360, y: 712}, {x: 1560, y: 726}, {x: 1700, y: 712}];
const NET_CABLE: V[] = [{x: 1205, y: 420}, {x: 1210, y: 300}, {x: 1296, y: 260}, {x: PLATE.x, y: PLATE.y + 40}];
/** cursor centre in R (0 bottom .. 1 FIRE target) */
const cursorR = (c: number) => ({x: SCR.x + 52, y: SCR.y + 364 - clamp(c) * 300});
const TARGET_R = {x: SCR.x + 52, y: SCR.y + 52};

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
export const CableFlow: React.FC<{p: V[]; t: number; k: number; color?: string; n?: number; speed?: number; r?: number}> = ({p, t, k, color = K.teal, n = 5, speed = 0.8, r = 7}) => {
  if (k <= 0.01) return null;
  return (
    <g opacity={clamp(k)}>
      {Array.from({length: n}, (_, i) => {
        const u = (((t * speed + i / n) % 1) + 1) % 1;
        const q = bz(p, u);
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

// ---------------------------------------------------------------- the rhythm trace (shared by the brain view and the LCD)
/** relative rhythm amplitude at signal time s: the regular mu rhythm, which shrinks when he imagines */
const rhythmAmp = (s: number) => 1 - 0.76 * smooth(clamp((s - ct().changes) / 0.45));
/** a scope trace over [x0, x1] centred on cy: newest signal at the right edge, scrolling left */
const tracePath = (t: number, x0: number, x1: number, cy: number, A: number, n = 160) => {
  const span = 1.7; // seconds of signal across the width
  let d = '';
  for (let i = 0; i <= n; i++) {
    const u = i / n;
    const s = t - (1 - u) * span;
    const a = rhythmAmp(s);
    const y = cy - A * a * Math.sin(s * Math.PI * 2 * 2.9) * (0.88 + 0.12 * Math.sin(s * 4.3)) - A * 0.07 * Math.sin(s * 41 + 1) * (1.2 - a);
    d += `${i ? 'L' : 'M'}${fmt(lerp(x0, x1, u))},${fmt(y)}`;
  }
  return d;
};

let gyri: {d: string; cx: number}[] | null = null;
const GYRI = () =>
  (gyri ??= (() => {
    const out: {d: string; cx: number}[] = [];
    let n = 0;
    for (let gx = 0; gx < 9; gx++)
      for (let gyy = 0; gyy < 6; gyy++) {
        n++;
        let x = -260 + gx * 300 + 120 * hash(n, 1), y = -180 + gyy * 270 + 120 * hash(n, 2);
        let a = hash(n, 3) * Math.PI * 2;
        let d = `M${fmt(x)},${fmt(y)}`;
        for (let k = 0; k < 7; k++) {
          a += (hash(n * 13 + k, 4) - 0.5) * 2.4;
          const nx = x + Math.cos(a) * 95, ny = y + Math.sin(a) * 95;
          d += ` Q${fmt(x + Math.cos(a - 0.6) * 70)},${fmt(y + Math.sin(a - 0.6) * 70)} ${fmt(nx)},${fmt(ny)}`;
          x = nx;
          y = ny;
        }
        out.push({d, cx: -260 + gx * 300});
      }
    return out;
  })());

/** the brain's rhythm, full frame (screen space). bg 0 = cortex tissue, 1 = the computer's readout screen */
export const RhythmView: React.FC<{t: number; bg: number; s?: number}> = ({t, bg, s = 1}) => {
  const c = ct();
  const amp = rhythmAmp(t);
  const ph = Math.sin(t * Math.PI * 2 * 2.9);
  // gyri: convoluted folds of the cortex surface; each brightens with the rhythm (in sync before the change)
  const gy = GYRI().map((gp, i) => {
    const sync = amp * (0.5 + 0.5 * Math.sin(t * Math.PI * 2 * 2.9 - gp.cx / 520));
    return (
      <g key={i}>
        <path d={gp.d} fill="none" stroke="#F0B2A8" strokeWidth={96} strokeLinecap="round" strokeLinejoin="round" />
        <path d={gp.d} fill="none" stroke={K.teal} strokeWidth={96} strokeLinecap="round" strokeLinejoin="round" opacity={0.28 * sync} />
        <path d={gp.d} fill="none" stroke="#FAD6CE" strokeWidth={34} strokeLinecap="round" strokeLinejoin="round" opacity={0.7} transform="translate(-10 -14)" />
      </g>
    );
  });
  const A = 24 * LCD_Z;
  const trace = tracePath(t, 0, 1920, 540, A);
  const tagA = clamp((t - (c.rhythm + 0.02)) / 0.25) * (1 - clamp((t - (c.changes + 0.05)) / 0.2));
  const tagB = clamp((t - (c.changes + 0.3)) / 0.25) * (1 - clamp((t - (c.changesE + 0.2)) / 0.2));
  return (
    <g>
      <defs>
        <radialGradient id="vc-rv-vig" cx="0.5" cy="0.5" r="0.75">
          <stop offset="0.55" stopColor={INK} stopOpacity={0} />
          <stop offset="1" stopColor={INK} stopOpacity={0.45} />
        </radialGradient>
      </defs>
      <g transform={`translate(960 540) scale(${fmt(s)}) translate(-960 -540)`}>
        <g opacity={1 - bg}>
          <rect x={-400} y={-300} width={2720} height={1680} fill="#B9706E" />
          {gy}
          <circle cx={960} cy={540} r={620} fill={K.teal} opacity={0.1 * amp * (0.5 + 0.5 * ph)} />
        </g>
      </g>
      {bg > 0 && (
        <g opacity={bg}>
          <rect x={0} y={0} width={1920} height={1080} fill={K.screenDark} />
          {Array.from({length: 9}, (_, i) => (
            <line key={i} x1={(i + 1) * (1920 / 9)} y1={0} x2={(i + 1) * (1920 / 9)} y2={1080} stroke="#FFFFFF" strokeWidth={3} opacity={0.07} />
          ))}
          <line x1={0} y1={540} x2={1920} y2={540} stroke="#FFFFFF" strokeWidth={3} opacity={0.12} />
        </g>
      )}
      <path d={trace} fill="none" stroke={K.teal} strokeWidth={60} strokeLinejoin="round" strokeLinecap="round" opacity={0.25 * (1 - bg)} />
      <path d={trace} fill="none" stroke={mix(K.teal, '#FFFFFF', 0.35 * (1 - bg))} strokeWidth={LCD_Z * 1.3} strokeLinejoin="round" strokeLinecap="round" />
      <rect x={0} y={0} width={1920} height={1080} fill="url(#vc-rv-vig)" opacity={1 - bg} />
      <Tag x={960} y={150} text="brain rhythm" size={46} k={tagA} />
      <Tag x={960} y={150} text="rhythm drops" size={46} k={tagB} fill={K.saffron} />
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
      {[0, 1, 2].map((i) => <rect key={i} x={x0 + 40} y={590 + i * 22} width={x1 - x0 - 110} height={12} rx={6} fill="#B5BEC6" />)}
      {/* electrode input sockets on the left edge (the cap cable plugs in) */}
      <rect x={x0 - 14} y={620} width={20} height={34} rx={5} fill="#46525C" stroke={INK} strokeWidth={4} />
      <circle cx={x1 - 36} cy={652} r={13} fill={mix('#6E7C86', lightColor, light)} stroke={INK} strokeWidth={4} />
      {light > 0.05 && <circle cx={x1 - 36} cy={652} r={28} fill={lightColor} opacity={0.3 * light} />}
      <path d={`M${x0 + 30},${y1 - 26} L${x1 - 30},${y1 - 26}`} stroke="#B5BEC6" strokeWidth={6} strokeLinecap="round" />
    </g>
  );
};

// ---------------------------------------------------------------- the BCI cursor window (with a slide-in reveal)
export const CursorWin: React.FC<{cursor: number; k: number; hit: number; merge?: number}> = ({cursor, k, hit, merge = 0}) => {
  if (k <= 0.001) return null;
  return (
    <g transform={`translate(${fmt(-110 * (1 - easeOut(k)))} 0)`}>
      <rect x={6} y={6} width={92} height={388} rx={10} fill="#1F3442" opacity={0.92} stroke={INK} strokeWidth={3} />
      <circle cx={52} cy={52} r={34} fill={mix(K.blue, '#7FA6EA', hit)} stroke="#FFFFFF" strokeWidth={4} />
      <text x={52} y={59} textAnchor="middle" fontFamily={FONT_HEAD} fontWeight={700} fontSize={19} fill="#FFFFFF">FIRE</text>
      <line x1={52} y1={92} x2={52} y2={370} stroke="#FFFFFF" strokeWidth={2} strokeDasharray="4 8" opacity={0.35} />
      <rect x={36} y={fmt(354 - clamp(cursor) * 300)} width={32} height={20} rx={4} fill="#FFFFFF" stroke={INK} strokeWidth={2.5} opacity={1 - merge} />
      {hit > 0 && <circle cx={52} cy={52} r={40 + 14 * (1 - hit)} fill="none" stroke={K.saffron} strokeWidth={7} opacity={hit} />}
    </g>
  );
};

// ---------------------------------------------------------------- the imagined movement (dashed ghost)
const GLIFT: HandPoseP = {wrist: -30, idx: [-14, 2, 0], curl: 0.08, thumb: 0.3};
/** two imagined lifts of the right hand: on "moving his right hand" and again while "his real hand stays put" */
const ghostLift = (t: number) => {
  const c = ct();
  const cyc = (a: number) => {
    const d = t - a;
    if (d < 0 || d > 1.25) return 0;
    return d < 0.4 ? easeInOut(d / 0.4) : d < 0.75 ? 1 : 1 - easeInOut((d - 0.75) / 0.5);
  };
  return Math.max(cyc(c.moving + 0.15), cyc(c.stays + 0.45));
};
export const ghostK = (t: number) => {
  const c = ct();
  return clamp((t - (c.moving + 0.05)) / 0.25) * (1 - clamp((t - (c.putE + 0.25)) / 0.3));
};

// ---------------------------------------------------------------- the room
export const RaoRoom: React.FC<{t: number; f: number; lens?: number}> = ({t, f, lens = 0}) => {
  const c = ct();
  const g = gameClock(t);
  const conc = clamp((t - (c.imag - 0.1)) / 0.4) * (1 - clamp((t - (c.target + 0.6)) / 0.5));
  const pose: Pose = {...IDLE, armR: {a: 6, b: 6}, lookX: 0.8, lookY: 0.25, brows: -0.4 * conc, mouth: conc > 0.5 ? 'flat' : 'smile', tilt: 0, lean: 0};
  const gk = ghostK(t);
  const lift = ghostLift(t);
  const cur = cursorAt(t);
  const curK = clamp((t - (c.screen - 0.05)) / 0.4);
  const hitK = t > c.target ? 1 - clamp((t - (c.target + 0.7)) / 0.6) : 0;
  const capFlow = clamp((t - (c.computer - 0.3)) / 0.4) * (1 - clamp((t - (c.target + 0.4)) / 0.4));
  const monFlow = clamp((t - (c.screen - 0.4)) / 0.4) * (1 - clamp((t - (c.target + 0.3)) / 0.4));
  const thr = clamp((t - (c.watching - 0.1)) / 0.5);
  const up = clamp((t - (c.watching + 0.35)) / 0.25);
  const sent = t > c.sends - 0.15 && t < c.internetE + 0.4;
  const light = sent ? 1 : t > c.computer ? 0.5 + 0.5 * (Math.sin(t * 10) > 0 ? 1 : 0) : 0;
  const pk = packetAt(t);
  const plateGlow = clamp((t - (c.internet - 0.2)) / 0.3);
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
        <clipPath id="vc-r-lens"><rect x={LENS.x0} y={LENS.y0} width={LENS.w} height={LENS.h} rx={LENS.rx} /></clipPath>
        <clipPath id="vc-r-lensl"><rect x={LENS_L.x0} y={LENS_L.y0} width={LENS_L.w} height={LENS_L.h} rx={LENS_L.rx} /></clipPath>
      </defs>
      <rect x={-600} y={-700} width={3400} height={1360} fill="url(#vc-r-wall)" />
      <rect x={-600} y={DESK_Y - 30} width={3400} height={30} fill={K.raoWallDeep} />
      {/* pinboard and a window on the campus (Rao's room, as in the hook) */}
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
        {plateGlow > 0 && <rect x={PLATE.x - 16} y={PLATE.y - 22} width={32} height={26} rx={3} fill={K.saffron} opacity={0.8 * plateGlow} />}
      </g>
      {/* Rao (body pass, without his right arm: that is the desk arm below) */}
      <CrewChar look={RAO} pose={pose} frame={f} x={RAO_X} y={RAO_GY} scale={RAO_S} front="L" pass="body" shadow={false} life={0} eyeDarts={false} id="vc-rao" headGear={<EEGCap />} seed={3} />
      {/* screen light on his face from the game (frame right) */}
      <ellipse cx={HEAD_C.x + 60} cy={HEAD_C.y + 20} rx={90} ry={110} fill={K.blueLight} opacity={0.12} />
      {lens > 0.001 && (
        <g>
          {[['vc-r-lens', LENS], ['vc-r-lensl', LENS_L]].map(([id, L], i) => {
            const LL = L as typeof LENS;
            const g0 = {x: LL.x0 + LL.w / 2 - 320 * GS, y: G0.y};
            return (
              <g key={i} clipPath={`url(#${id})`} opacity={lens}>
                <g transform={`translate(${fmt(g0.x)} ${fmt(g0.y)}) scale(${GS.toFixed(6)})`}>
                  <GameScreen t={g} events={gameEvents()} />
                </g>
                <path d={`M${LL.x0},${LL.y0 + LL.h * 0.7} L${LL.x0 + LL.w * 0.5},${LL.y0} L${LL.x0 + LL.w * 0.75},${LL.y0} L${LL.x0},${LL.y0 + LL.h}`} fill="#FFFFFF" opacity={0.3 * clamp(1 - lens) + 0.05} />
              </g>
            );
          })}
        </g>
      )}
      {/* desk */}
      <path d={`M-600,${DESK_Y} L2800,${DESK_Y} L2800,1700 L-600,1700 Z`} fill="url(#vc-r-top)" stroke={INK} strokeWidth={6} />
      <path d={`M-600,${DESK_Y} L2800,${DESK_Y}`} stroke={lit(K.deskTop, 0.35)} strokeWidth={8} />
      {/* cables: cap -> computer -> monitor; computer -> network plate */}
      <Cable p={CAP_CABLE} />
      <Cable p={NET_CABLE} color="#5D6B76" w={8} />
      <Cable p={MON_CABLE} />
      <Tower light={light} lightColor={sent || t > c.target - 0.1 ? K.saffron : K.teal} />
      <LcdTrace t={t} thr={thr} up={up} />
      <Monitor id="vc-rmon" x={MON.x} y={MON.y} s={MON.s}>
        <GameScreen t={g} events={gameEvents()} />
        <CursorWin cursor={cur} k={curK} hit={hitK} merge={clamp((t - c.target) / 0.15) * (1 - clamp((t - (c.target + 1.6)) / 0.2))} />
      </Monitor>
      <CableFlow p={CAP_CABLE} t={t} k={capFlow} color={K.teal} />
      <CableFlow p={MON_CABLE} t={t} k={monFlow} color={K.teal} speed={1.1} />
      {/* Rao's right arm on the desk, the hand flat; the imagined lift is a dashed ghost */}
      <Inked w={7}>
        <Capsule id="vc-rua" a={SHOULDER} b={{x: 370, y: 700}} ra={56} rb={58} color={K.raoSleeve} spec={0.12} />
      </Inked>
      <SideHand id="vc-rh" x={HAND.x} y={HAND.y} s={HAND.s} dir={1} side="pinky" pose={FLAT} skin={K.raoSkin} sleeve={K.raoSleeve} arm={HAND.arm} armAng={HAND.ang} contact={1} surfaceY={56} />
      {gk > 0.01 && (
        <g opacity={Math.min(1, gk * 1.4)}>
          <SideHand id="vc-rg" x={HAND.x} y={HAND.y} s={HAND.s} dir={1} side="pinky" pose={mixP(FLAT, GLIFT, lift)} skin={K.raoSkin} sleeve={K.raoSleeve} arm={HAND.arm} armAng={HAND.ang} ghost />
          <SideHand id="vc-rg2" x={HAND.x} y={HAND.y} s={HAND.s} dir={1} side="pinky" pose={mixP(FLAT, GLIFT, lift)} skin={K.raoSkin} sleeve={K.raoSleeve} arm={HAND.arm} armAng={HAND.ang} ghost />
        </g>
      )}
      <Tag x={HAND.x + 40} y={HAND.y - 250} text="imagined" size={40} k={clamp((t - (c.right - 0.05)) / 0.25) * (1 - clamp((t - (c.stays + 0.1)) / 0.25))} />
      <Tag x={HAND.x - 40} y={HAND.y - 250} text="real hand: still" size={40} k={clamp((t - (c.stays + 0.3)) / 0.25) * (1 - clamp((t - (c.but - 0.05)) / 0.25))} />
      <Tag x={(TOWER.x0 + TOWER.x1) / 2} y={TOWER.y0 - 56} text="watching for the drop" size={34} k={clamp((t - (c.watching - 0.05)) / 0.3) * (1 - clamp((t - (c.changeE + 0.35)) / 0.3))} />
      {pk && <Packet x={pk.x} y={pk.y} s={pk.s} k={pk.k} />}
    </g>
  );
};

// ---------------------------------------------------------------- the FIRE command leaving the computer
export const PACKET_SCREEN_S = 1.0;
/** packet position along the network cable (R world); s is set by the caller for constant screen size */
export const packetPath = (t: number) => {
  const c = ct();
  const t0 = c.sends + 0.02, t1 = c.internet + 0.05;
  const u = easeInOut(clamp((t - t0) / (t1 - t0)));
  return {p: bz(NET_CABLE, u), k: clamp((t - t0) / 0.15), t0, t1};
};
let camAtR: (t: number) => CamS = () => ({x: 0, y: 0, z: 1});
const packetAt = (t: number) => {
  const pp = packetPath(t);
  if (t < pp.t0) return null;
  const cam = camAtR(t);
  return {x: pp.p.x, y: pp.p.y, s: PACKET_SCREEN_S / cam.z, k: pp.k};
};

// ---------------------------------------------------------------- cameras
/** game camera in game units (gz = 1 is GAME_FULL) */
export const gameCam = (t: number): CamS => {
  const c = ct();
  const g = camPath(t, [
    [c.start, {x: 320, y: 200, z: 1}],
    [c.watch + 0.1, {x: 320, y: 200, z: 1}],
    [c.rocket - 0.05, {x: 210, y: 235, z: 1.22}],
    [c.rocket + 0.85, {x: 250, y: 178, z: 1.6}],
  ]);
  // never show past the game's edges
  return {...g, x: clamp(g.x, 320 / g.z, 640 - 320 / g.z), y: clamp(g.y, 20 + 180 / g.z, 380 - 180 / g.z)};
};
export const gameT = (gc: CamS) => `translate(960 540) scale(${fmt(3 * gc.z)}) translate(${fmt(-gc.x)} ${fmt(-gc.y)})`;
const T_SWITCH = () => ct().rocket + 0.8;
const fromGame = (gc: CamS): CamS => ({x: G0.x + GS * gc.x, y: G0.y + GS * gc.y, z: (3 * gc.z) / GS});

export const raoCam = (t: number): CamS => {
  const c = ct();
  const ts = T_SWITCH();
  const FACE: CamS = {x: 700, y: 330, z: 2.25};
  const HANDC: CamS = {x: 690, y: 640, z: 1.8};
  const CAPC: CamS = {x: 640, y: 225, z: 3.0};
  const IN: CamS = {x: ELEC.x, y: ELEC.y, z: 96};
  const LCDF: CamS = {x: LCD_C.x, y: LCD_C.y, z: LCD_Z};
  const WIDE: CamS = {x: 860, y: 410, z: 1.42};
  const cy = (tt: number) => cursorR(cursorAt(tt)).y;
  const CUR0: CamS = {x: SCR.x + 52 + 150, y: cy(c.cursor) - 60, z: 3.3};
  const TGT: CamS = {x: SCR.x + 52 + 170, y: TARGET_R.y + 40, z: 4.0};
  const TOWERC: CamS = {x: 1220, y: 420, z: 2.3};
  const pe = packetPath(c.internet + 0.05).p;
  const PLATEC: CamS = {x: pe.x, y: pe.y, z: 4.2};
  if (t < c.screen + 0.55) {
    return camPath(t, [
      [ts, fromGame(gameCam(ts))],
      [c.imag + 0.35, FACE],
      [c.moving + 0.1, {...FACE, x: 690, y: 350, z: 2.15}],
      [c.right + 0.25, HANDC],
      [c.putE, {...HANDC, x: 740, y: 650, z: 1.95}],
      [c.cap + 0.02, CAPC],
      [c.rhythm - 0.04, IN, easeIn],
      [c.changesE + 0.36, LCDF],
      [c.watching + 0.15, WIDE],
      [c.changeE + 0.1, {...WIDE, x: 960, y: 430, z: 1.62}],
      [c.screen + 0.55, CUR0],
    ]);
  }
  if (t < c.target) {
    // the cursor ECU: the camera rides up with the cursor and pushes in as it nears the target
    const u = clamp((t - (c.screen + 0.55)) / (c.target - (c.screen + 0.55)));
    const q = clamp((cy(c.cursor) - cy(t)) / (cy(c.cursor) - TARGET_R.y));
    return {x: lerp(CUR0.x, TGT.x, smooth(u)), y: lerp(CUR0.y, TGT.y, q), z: lerp(CUR0.z, TGT.z, smooth(u))};
  }
  if (t < c.sends + 0.05) return camPath(t, [[c.target, TGT], [c.target + 0.35, {...TGT, z: 3.7}], [c.sends + 0.05, TOWERC]]);
  // ride the packet up the network cable to the wall plate
  const pp = packetPath(t);
  const k = smooth(clamp((t - (c.sends + 0.05)) / 0.4));
  const zz = lerp(TOWERC.z, PLATEC.z, easeInOut(clamp((t - (c.sends + 0.05)) / (c.internet - c.sends))));
  return {x: lerp(TOWERC.x, pp.p.x, k), y: lerp(TOWERC.y, pp.p.y, k), z: zz};
};
camAtR = raoCam;

/** the whole part-1 shot (screen space) */
export const RaoShot: React.FC<{t: number; f: number}> = ({t, f}) => {
  const c = ct();
  const ts = T_SWITCH();
  const slowK = clamp((t - (c.rocket + 0.6)) / 0.25) * (1 - clamp((t - (c.imag + 0.9)) / 0.3));
  const slowTag = <Tag x={1720} y={70} text="slow motion" size={30} k={slowK} fill="#FFFFFF" />;
  if (t < ts) {
    const gc = gameCam(t);
    return (
      <g>
        <rect x={0} y={0} width={1920} height={1080} fill={K.screenDark} />
        <g transform={t <= c.start + 1 / FPS ? GAME_FULL : gameT(gc)}>
          <GameScreen t={gameClock(t)} events={gameEvents()} />
        </g>
        {slowTag}
      </g>
    );
  }
  const cam = raoCam(t);
  const lens = 1 - clamp((t - ts - 0.4) / 0.55) * 0.62 - 0.38 * clamp((t - (c.moving + 0.1)) / 0.5);
  // the electrode iris into the brain rhythm, and back out of the computer's readout
  const er = ELEC.r * cam.z;
  const ec = toScreen(cam, ELEC);
  const inBrain = t >= c.cap && t < c.changesE + 0.36;
  const room = <g transform={camT(cam)}><RaoRoom t={t} f={f} lens={lens} /></g>;
  if (inBrain) {
    const morph = smooth(clamp((t - (c.changesE - 0.05)) / 0.35));
    const full = er > 1120 || t >= c.rhythm - 0.04;
    const s = 1 + 0.05 * clamp((t - c.rhythm) / 2.2);
    const rv = <RhythmView t={t} bg={morph} s={s} />;
    if (full) return <g>{rv}</g>;
    const open = clamp((er - 50) / 220);
    return (
      <g>
        {room}
        {open > 0 && (
          <g>
            <defs><clipPath id={`vc-iris${f}`}><circle cx={fmt(ec.x)} cy={fmt(ec.y)} r={fmt(er * 0.86)} /></clipPath></defs>
            <g clipPath={`url(#vc-iris${f})`} opacity={open}>{rv}</g>
          </g>
        )}
        {slowTag}
      </g>
    );
  }
  return (
    <g>
      {room}
      {slowTag}
    </g>
  );
};
