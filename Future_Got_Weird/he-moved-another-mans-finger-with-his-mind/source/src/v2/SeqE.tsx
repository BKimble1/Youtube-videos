// V2 E. The 2014 study and its flipped-coil control (101.81 -> 135.87 s; PLOS ONE 2014, SOURCE_NOTES C12-C17).
//
// Worlds:
//  UNITS  three sender/receiver pairs as panel pairs on paper (the 2013 split-screen language, now one pair per
//         unit): a lit sender room with EEG cap and game, a cable over the gap, and a dark receiver room (seen from
//         behind, facing a blank wall, headphones, round coil on an articulated arm over the LEFT hemisphere =
//         frame-left in this back view, the TMS machine on the floor).
//  TC     the trial composition, used for every trial: the receiver room from behind (left) and, across a slanted
//         gutter, the same receiver's right hand resting over the touchpad in profile (orange sleeve) with the
//         sender's game as an inset. The command arrives down the network cable into the TMS machine, the machine
//         clicks, the coil fires, the wrist jerks up and drops onto the pad, the cannon fires.
//  AB     the comparison: the receiver room twice, coil in position | coil flipped; same game, same pulse.
//  BOARD  the assembled results: one column per pair; in position (game action + tallies) above, flipped below.
//
// Beats:
//  101.81 the dangling plug from D, now in a dark 2014 receiver room, drops into the TMS machine's port (click on
//         "A year later"); pull out to three panel pairs; the pairs appear on "three pairs of volunteers".
//  105.33 push into pair 1's receiver room to the coil; pan across the gutter to the hand over the touchpad; pull
//         back to the whole composition; the command arrives, the coil pulses, the wrist jerks and drops onto the
//         pad on "touchpad"; the cannon fires.
//  109.88 push into the coil: a gloved researcher hand turns it 180 deg about its handle (grey back face to the head).
//  113.04 the frame splits: coil in position | coil flipped. Same game (identical games), same pulse strength
//         (identical dials, identical click), participants can't tell (identical heads, "?").
//  119.3  the divider wipes away into the trial composition, coil in position, pair 1: rocket -> pulse -> tap ->
//         cannon -> rocket destroyed on "hit"; then the same pair shoots a friendly plane by mistake; tallies: 5 of 6
//         rockets, 3 of 8 planes.
//  123.65 the game and its tally fly into column 1 of the board; pair 2's game plays four rockets fast (1 of 4);
//         pair 3's tally; the flipped row waits with question marks.
//  126.45 cut: the SAME composition, coil flipped. Same rocket timing, the same click at the same level, the hand
//         does not move through the silence, the rocket hits the city.
//  129.55 the camera rises over the motionless pad (the hand sweeps out of frame above it) into the board's
//         flipped row: three pads, 0 presses each, every rocket through to the city.
//  134.69 push into pair 1's pad: on the last frame its surface fills PAD_RECT exactly.
import React from 'react';
import {clamp, easeIn, easeInOut, easeOut, easeOutBack, fmt, lerp} from '../dc/math';
import {lit, mix, shade} from '../dc/color';
import {CamS, FPS, T, TE, camKeys, pr} from './core2';
import {Cam, Desk, FONT_HEAD, INK, K, Label, Monitor, Tag, Touchpad} from '../art/kit';
import {GameScreen, GEvent, arcPt, evState} from '../art/game';
import {HandPoseP, indexTip, mixP, SideHand} from '../art/hand';
import {CrewChar, IDLE, Look} from '../art/crew';
import {EEGCap, V14} from '../art/people';
import {Burst, Chair, CoilArm, PlaneIcon, RedX, RocketIcon, S5Coil, TmsBox, MiniCity} from '../art/s5parts';
import {PAD_RECT} from './contracts';
import {anchorCam, Cable, D_PLUG, D_PLUG_END, HANG_DECAY, HANG_W, Plug, PLUG_JOIN, PLUG_TIP, toScr} from './SeqD';

// ---------------------------------------------------------------- timing
type Trial = {t0: number; up0: number; up1: number; pulse: number; tap: number; fire: number; kill: number; arrive: number};
const DUR = 2.75;
const mkTrial = (t0: number): Trial => ({t0, up0: t0 + 0.35, up1: t0 + 1.25, pulse: t0 + 1.4, tap: t0 + 1.62, fire: t0 + 1.67, kill: t0 + 1.99, arrive: t0 + DUR});
const tm = () => {
  const s = T('A year later') - 0.55; // 101.81
  const click = T('A year later'); // the plug seats
  const out0 = click + 0.3;
  const out1 = T('three pairs') - 0.05;
  const pops = [T('three pairs'), T('pairs of volunteers'), T('volunteers') + 0.1];
  const push0 = TE('volunteers') - 0.3;
  const sw = T('This time the') + 0.4; // units -> TC (seamless)
  const e2 = mkTrial(T('touchpad') - 0.07 - 1.4);
  const flipIn = T('In some rounds') + 0.05;
  const fs = T('flipped the coil over') - 0.05; // the coil turns
  const ab0 = T('Same game') - 0.42;
  const ab1 = ab0 + 0.5;
  const wipe0 = T('With the coil in position') - 0.7;
  const cutN = T('With the coil in position') - 0.24;
  const N = mkTrial(cutN + 0.25);
  const P = {t0: N.t0 + 1.85, up0: N.t0 + 1.95, up1: N.t0 + 2.38, pulse: N.t0 + 2.45, tap: N.t0 + 2.67, fire: N.t0 + 2.72, kill: N.t0 + 3.04, dur: 1.6};
  const brd = T('Another hit only') - 0.4;
  const cutF = T('With the coil flipped') - 0.18;
  const F = mkTrial(cutF + 0.25);
  const brd2 = F.arrive + 0.3; // push into the pad
  const thr = brd2 + 0.42; // through its surface into the board
  const thr1 = thr + 0.9;
  const nob = T('nobody pressed');
  const every = T('Every rocket got');
  const push = TE('got through') + 0.05;
  const end = T('Then the researchers gave') - 0.5;
  return {s, click, out0, out1, pops, push0, sw, e2, flipIn, fs, ab0, ab1, wipe0, cutN, N, P, brd, cutF, F, brd2, thr, thr1, nob, every, push, end};
};
type TM = ReturnType<typeof tm>;

// ---------------------------------------------------------------- people
type RLook = {skin: string; hair: 'curly' | 'spiky' | 'crop'; hairColor: string; shirt: string};
const RECV: RLook[] = [
  {skin: K.r14Skin, hair: 'curly', hairColor: '#2B1A10', shirt: K.r14Sleeve},
  {skin: V14.recv2.skin, hair: 'spiky', hairColor: V14.recv2.hairColor, shirt: V14.recv2.shirt},
  {skin: V14.recv3.skin, hair: 'crop', hairColor: V14.recv3.hairColor, shirt: V14.recv3.shirt},
];
const SEND: Look[] = [V14.send1, V14.send2, V14.send3];
const P = (x: number, y: number) => `${fmt(x)},${fmt(y)}`;

/** A 2014 receiver from behind (camera behind the chair: the person's left is frame-left). Upgraded copy of the
 *  V1 s5parts BackHead with a look and an id prefix. rs: right-shoulder lift (frame-right). */
const BackHead: React.FC<{id: string; hx: number; hy: number; look: RLook; rs?: number; glow?: number; gx?: number; gy?: number; tilt?: number}> = ({id, hx, hy, look, rs = 0, glow = 0, gx = 0, gy = 0, tilt = 0}) => {
  const {skin, shirt, hairColor: hair} = look;
  const RX = 128, RY = 142;
  const bumps: [number, number][] = [];
  const n = look.hair === 'spiky' ? 11 : 15;
  for (let i = 0; i <= n; i++) {
    const a = Math.PI * (1.02 + (i / n) * 0.96);
    const r = look.hair === 'curly' ? 1.06 + 0.05 * Math.sin(i * 2.1) : look.hair === 'spiky' ? (i % 2 ? 1.16 : 1.03) : 1.04;
    bumps.push([hx + Math.cos(a) * RX * r, hy + Math.sin(a) * RY * r]);
  }
  let d = `M${P(hx - RX * 1.02, hy + 70)} L${P(hx - RX * 1.06, hy + 10)} `;
  for (const [bx, by] of bumps) {
    if (look.hair === 'spiky') d += `L${P(bx, by)} `;
    else d += `Q${P(bx + (bx - hx) * 0.06, by + (by - hy) * 0.06)} ${P(bx, by)} `;
  }
  d += `L${P(hx + RX * 1.06, hy + 10)} L${P(hx + RX * 1.02, hy + 70)} Q${P(hx + RX * 0.7, hy + 112)} ${P(hx + 40, hy + 108)} Q${P(hx, hy + 122)} ${P(hx - 40, hy + 108)} Q${P(hx - RX * 0.7, hy + 112)} ${P(hx - RX * 1.02, hy + 70)} Z`;
  const curls: React.ReactNode[] = [];
  if (look.hair === 'curly')
    for (let i = 0; i < 26; i++) {
      const a = (i * 2.399) % (Math.PI * 2);
      const r = 0.18 + ((i * 0.37) % 0.72);
      const cx = hx + Math.cos(a) * RX * r * 0.95, cy = hy - 6 + Math.sin(a) * RY * r * 0.8;
      curls.push(<path key={i} d={`M${P(cx - 12, cy + 4)} q6,-14 13,-2 q6,-12 12,2`} fill="none" stroke={lit(hair, 0.18)} strokeWidth={4} strokeLinecap="round" opacity={0.75} />);
    }
  else
    for (let i = 0; i < 7; i++) {
      const x = hx - 70 + i * 23;
      curls.push(<path key={i} d={`M${P(x, hy - 110 + Math.abs(i - 3) * 10)} q8,40 -4,90`} fill="none" stroke={lit(hair, 0.22)} strokeWidth={5} strokeLinecap="round" opacity={0.55} />);
    }
  const shY = hy + 190;
  const torso = `M${P(hx - 290, 1180)} L${P(hx - 282, shY + 90)} Q${P(hx - 270, shY + 8)} ${P(hx - 150, shY - 2)} L${P(hx - 52, shY - 22)} L${P(hx + 52, shY - 22 - rs * 0.4)} L${P(hx + 150, shY - 2 - rs)} Q${P(hx + 270, shY + 8 - rs)} ${P(hx + 282, shY + 90 - rs * 0.5)} L${P(hx + 290, 1180)} Z`;
  return (
    <g>
      <defs>
        <linearGradient id={`${id}-sh`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor={lit(shirt, 0.12)} />
          <stop offset="0.6" stopColor={shirt} />
          <stop offset="1" stopColor={shade(shirt, 0.35)} />
        </linearGradient>
        <radialGradient id={`${id}-hr`} cx="0.38" cy="0.3" r="0.8">
          <stop offset="0" stopColor={lit(hair, 0.15)} />
          <stop offset="1" stopColor={hair} />
        </radialGradient>
        <radialGradient id={`${id}-gl`}>
          <stop offset="0" stopColor={K.saffron} stopOpacity={1} />
          <stop offset="1" stopColor={K.saffron} stopOpacity={0} />
        </radialGradient>
      </defs>
      <path d={torso} fill={`url(#${id}-sh)`} stroke={INK} strokeWidth={6} strokeLinejoin="round" />
      <path d={`M${P(hx - 150, shY + 30)} Q${P(hx - 70, shY + 60)} ${P(hx - 40, shY + 160)}`} fill="none" stroke={shade(shirt, 0.3)} strokeWidth={6} strokeLinecap="round" opacity={0.5} />
      <path d={`M${P(hx - 50, hy + 80)} L${P(hx - 54, shY - 18)} Q${P(hx, shY - 8)} ${P(hx + 54, shY - 18)} L${P(hx + 50, hy + 80)} Z`} fill={shade(skin, 0.12)} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
      <g transform={`rotate(${fmt(tilt)} ${fmt(hx)} ${fmt(hy + 100)})`}>
        <ellipse cx={hx - RX - 4} cy={hy + 14} rx={20} ry={32} fill={skin} stroke={INK} strokeWidth={5} />
        <ellipse cx={hx + RX + 4} cy={hy + 14} rx={20} ry={32} fill={shade(skin, 0.15)} stroke={INK} strokeWidth={5} />
        <path d={d} fill={`url(#${id}-hr)`} stroke={INK} strokeWidth={6} strokeLinejoin="round" />
        {curls}
        {glow > 0.001 && <ellipse cx={gx} cy={gy} rx={70} ry={52} fill={`url(#${id}-gl)`} opacity={0.85 * clamp(glow)} />}
        <path d={`M${P(hx - RX - 6, hy + 52)} Q${P(hx, hy + 150)} ${P(hx + RX + 6, hy + 52)}`} fill="none" stroke={INK} strokeWidth={20} strokeLinecap="round" />
        <path d={`M${P(hx - RX - 6, hy + 52)} Q${P(hx, hy + 150)} ${P(hx + RX + 6, hy + 52)}`} fill="none" stroke="#7D8B97" strokeWidth={10} strokeLinecap="round" />
        <rect x={hx - RX - 34} y={hy - 34} width={44} height={94} rx={18} fill="#6C7A86" stroke={INK} strokeWidth={5} />
        <rect x={hx - RX - 28} y={hy - 24} width={14} height={60} rx={7} fill="#93A1AC" />
        <rect x={hx + RX - 10} y={hy - 34} width={44} height={94} rx={18} fill="#56636E" stroke={INK} strokeWidth={5} />
      </g>
    </g>
  );
};

// ---------------------------------------------------------------- the receiver room from behind (TC left, AB, UNITS)
const HX = 450, HY = 470;
const COIL = {x: HX - 81, y: HY - 152, ang: -28, s: 0.72};
const SCALP = {x: HX - 58, y: HY - 117};
const BOX = {x: 10, y: 730};
const PORT = {x: BOX.x + 40, y: BOX.y};
const HANDLE_DIR = {x: -Math.cos((28 * Math.PI) / 180), y: Math.sin((28 * Math.PI) / 180)};
const onHandle = (u: number) => ({x: COIL.x + HANDLE_DIR.x * u * COIL.s, y: COIL.y + HANDLE_DIR.y * u * COIL.s});
const ARM_END = onHandle(250);
const HANDLE_END = onHandle(326);
/** pulse envelope (fast attack, short decay) */
const env = (t: number, p: number) => (t < p ? 0 : t < p + 0.04 ? (t - p) / 0.04 : Math.max(0, 1 - (t - p - 0.04) / 0.42));
const envs = (t: number, ps: number[]) => ps.reduce((m, p) => Math.max(m, env(t, p)), 0);

/** a researcher's gloved hand gripping the coil handle (k 0..1 reach-in; roll: small wrist roll during the turn) */
const Grip: React.FC<{k: number; roll: number}> = ({k, roll}) => {
  if (k <= 0.001) return null;
  const g = onHandle(150);
  const off = (1 - easeOut(clamp(k))) * 520;
  const gx = g.x - off * 0.55, gy = g.y - off;
  const glove = '#A9CBEA', gloveD = '#7FA7CC';
  const a = (-28 * Math.PI) / 180; // handle angle on screen
  const fx = Math.cos(a), fy = Math.sin(a);
  const elbow = {x: gx - 260, y: gy - 420};
  return (
    <g>
      {/* forearm in a lab-coat sleeve from the upper left */}
      <path d={`M${P(elbow.x - 70, elbow.y)} L${P(gx - 70, gy - 70)} L${P(gx + 10, gy - 60)} L${P(elbow.x + 60, elbow.y - 40)} Z`} fill="#EEF2F5" stroke={INK} strokeWidth={6} strokeLinejoin="round" />
      <path d={`M${P(gx - 74, gy - 92)} L${P(gx + 18, gy - 78)}`} stroke="#C9D2DA" strokeWidth={14} strokeLinecap="round" />
      {/* the fist round the handle: back of the hand, four knuckles over the top, the thumb along the handle */}
      <g transform={`rotate(${fmt(roll)} ${fmt(gx)} ${fmt(gy)})`}>
        <ellipse cx={gx - 18} cy={gy - 38} rx={62} ry={46} transform={`rotate(-28 ${fmt(gx - 18)} ${fmt(gy - 38)})`} fill={glove} stroke={INK} strokeWidth={6} />
        {[-1.5, -0.5, 0.5, 1.5].map((i) => (
          <ellipse key={i} cx={fmt(gx + fx * i * 26 + 6)} cy={fmt(gy + fy * i * 26 - 4)} rx={17} ry={22} transform={`rotate(-28 ${fmt(gx + fx * i * 26 + 6)} ${fmt(gy + fy * i * 26 - 4)})`} fill={glove} stroke={INK} strokeWidth={5} />
        ))}
        <path d={`M${P(gx - 60, gy - 30)} Q${P(gx - 40, gy + 8)} ${P(gx - 76, gy + 22)}`} fill="none" stroke={INK} strokeWidth={28} strokeLinecap="round" />
        <path d={`M${P(gx - 60, gy - 30)} Q${P(gx - 40, gy + 8)} ${P(gx - 76, gy + 22)}`} fill="none" stroke={gloveD} strokeWidth={18} strokeLinecap="round" />
      </g>
    </g>
  );
};

/** the network cable coming down to the plug in the machine's port (j: the plug's cable junction) */
const SeatedPlug: React.FC<{j: {x: number; y: number}; ang?: number}> = ({j, ang = 0}) => (
  <g>
    <Cable a={{x: PORT.x, y: -300}} b={j} w={13} />
    <g transform={`rotate(${fmt(ang)} ${fmt(j.x)} ${fmt(j.y)})`}>
      <Plug x={j.x} y={j.y + PLUG_JOIN * D_PLUG.LS} s={D_PLUG.LS} />
    </g>
  </g>
);
const SEAT_J = {x: PORT.x, y: PORT.y + 14 - PLUG_TIP * D_PLUG.LS - PLUG_JOIN * D_PLUG.LS};
/** the receiver room from behind. Coordinates: the room's own 900 x 1080 frame (TC left). */
const RecvRoom: React.FC<{
  f: number; id: string; look: RLook; flip: number; pulses: number[]; present?: number; rs?: number; axisK?: number;
  grip?: number; roll?: number; packets?: [number, number][]; tilt?: number; boxHi?: number; netGlow?: number; plug?: React.ReactNode; power?: number;
}> = ({f, id, look, flip, pulses, present = 1, rs = 0, axisK = 0, grip = 0, roll = 0, packets = [], tilt = 0, boxHi = 0, plug, power = 1}) => {
  const t = f / FPS;
  const e = envs(t, pulses);
  const active = flip < 0.5;
  const cableGlow = pulses.reduce((m, p) => Math.max(m, t >= p - 0.02 && t < p + 0.1 ? 1 : 0), 0);
  return (
    <g>
      <defs>
        <radialGradient id={`${id}-wall`} cx="0.52" cy="0.36" r="0.75">
          <stop offset="0" stopColor="#4C5E6F" />
          <stop offset="0.55" stopColor="#334250" />
          <stop offset="1" stopColor="#1C2630" />
        </radialGradient>
      </defs>
      <rect x={-400} y={-300} width={1400} height={1700} fill={`url(#${id}-wall)`} />
      <rect x={-400} y={940} width={1400} height={400} fill="#1A222A" opacity={0.6} />
      {packets.map(([a, b], i) => {
        const u = (t - a) / (b - a);
        if (u < 0 || u > 1) return null;
        const y = lerp(-20, SEAT_J.y - 26, easeIn(u));
        return (
          <g key={i}>
            <path d={`M${PORT.x},-20 L${PORT.x},${fmt(y)}`} stroke={K.saffron} strokeWidth={8} opacity={0.75} />
            <rect x={PORT.x - 26} y={fmt(y - 22)} width={52} height={44} rx={10} fill={K.saffron} stroke={INK} strokeWidth={5} />
          </g>
        );
      })}
      {/* the stand and its arm, the coil cable down to the machine */}
      <CoilArm base={{x: 92, y: 1140}} j1={{x: 92, y: 250}} j2={{x: 196, y: 150}} end={ARM_END} />
      <path d={`M${P(HANDLE_END.x, HANDLE_END.y)} C${P(HANDLE_END.x - 30, 560)} ${P(205, 620)} ${P(200, BOX.y + 4)}`} fill="none" stroke={INK} strokeWidth={14} strokeLinecap="round" />
      <path d={`M${P(HANDLE_END.x, HANDLE_END.y)} C${P(HANDLE_END.x - 30, 560)} ${P(205, 620)} ${P(200, BOX.y + 4)}`} fill="none" stroke={cableGlow ? K.saffron : '#2D363D'} strokeWidth={7} strokeLinecap="round" />
      {present > 0.001 && (
        <g opacity={clamp(present * 1.6)} transform={`translate(${HX} ${HY + 300}) scale(${fmt(0.9 + 0.1 * easeOutBack(clamp(present)))}) translate(${-HX} ${-(HY + 300)})`}>
          <BackHead id={`${id}-bh`} hx={HX} hy={HY} look={look} rs={rs} glow={active ? e : 0} gx={SCALP.x} gy={SCALP.y} tilt={tilt} />
        </g>
      )}
      <Chair hx={HX} hy={HY} />
      {boxHi > 0.001 && <rect x={BOX.x - 14} y={BOX.y - 14} width={258} height={178} rx={28} fill="none" stroke={K.saffron} strokeWidth={9} opacity={boxHi} />}
      <TmsBox x={BOX.x} y={BOX.y} lv={e > 0 ? 1 : 0} hi={boxHi} />
      {/* power light and the network port on the machine's top */}
      <circle cx={BOX.x + 206} cy={BOX.y + 44} r={9} fill={mix('#3A454F', '#5BE37D', power)} stroke={INK} strokeWidth={3} />
      <rect x={PORT.x - 24} y={PORT.y - 12} width={48} height={16} rx={4} fill="#2D363D" stroke={INK} strokeWidth={4} />
      {plug ?? <SeatedPlug j={SEAT_J} />}
      <S5Coil x={COIL.x} y={COIL.y} s={COIL.s} ang={COIL.ang} flip={flip} pulse={e} axisK={axisK} />
      <Grip k={grip} roll={roll} />
      {/* the click: identical rings whichever way the coil faces */}
      {pulses.map((p, i) => {
        const k = (t - p) / 0.45;
        if (k < 0 || k > 1) return null;
        return (
          <g key={i} opacity={1 - k} fill="none" stroke={K.cream} strokeWidth={7} strokeLinecap="round">
            {[0, 1, 2].map((j) => {
              const r = 60 + j * 30 + 40 * k;
              return <path key={j} d={`M${P(COIL.x + 40 - r * 0.7, COIL.y - 40 - r * 0.55)} A${fmt(r)} ${fmt(r)} 0 0 1 ${P(COIL.x + 40 + r * 0.7, COIL.y - 40 - r * 0.55)}`} />;
            })}
          </g>
        );
      })}
    </g>
  );
};

// ---------------------------------------------------------------- TC right: the hand over the touchpad and the game
const PAD = {x: 1250, y: 835, s: 1.1};
const HS = 1.3;
const REST: HandPoseP = {wrist: -5, idx: [8, 10, 6], curl: 0.2, thumb: 0.38};
const UP: HandPoseP = {wrist: -22, idx: [-4, 8, 4], curl: 0.26, thumb: 0.36};
const DOWN: HandPoseP = {wrist: 11, idx: [14, 14, 8], curl: 0.3, thumb: 0.42};
const PAD_TOP = PAD.y - 55 * PAD.s;
const DOWN_TIP = indexTip(DOWN, -1, HS);
const WRIST = {x: PAD.x - 40 - DOWN_TIP.x, y: PAD_TOP - 17 - DOWN_TIP.y};
const GAME = {x: 1190, y: 46, s: 0.78};
const ARM_ANG = 7;
/** the involuntary up-down jerk after a pulse */
const jerk = (t: number, pulse: number): {pose: HandPoseP; press: number; rs: number; drive: number} => {
  const d = t - pulse;
  const c = 0.22;
  if (d < 0.02 || d > 0.95) return {pose: REST, press: 0, rs: 0, drive: -1};
  const drive = d < 0.3 ? d / 0.3 : -1;
  if (d < 0.11) return {pose: mixP(REST, UP, easeOut((d - 0.02) / 0.09)), press: 0, rs: 12 * easeOut((d - 0.02) / 0.09), drive};
  if (d < c) return {pose: mixP(UP, DOWN, easeIn((d - 0.11) / (c - 0.11))), press: 0, rs: 12 * (1 - (d - 0.11) / (c - 0.11)), drive};
  if (d < c + 0.14) return {pose: DOWN, press: 1 - (d - c) / 0.14, rs: 0, drive};
  return {pose: mixP(DOWN, REST, easeInOut(clamp((d - c - 0.14) / 0.55))), press: 0, rs: 0, drive};
};
const rotp = (p: {x: number; y: number}, a: number) => ({x: p.x * Math.cos((a * Math.PI) / 180) - p.y * Math.sin((a * Math.PI) / 180), y: p.x * Math.sin((a * Math.PI) / 180) + p.y * Math.cos((a * Math.PI) / 180)});
/** a saffron streak along the forearm and the index finger (the stimulation-driven movement) */
const DriveGlow: React.FC<{pose: HandPoseP; k: number}> = ({pose, k}) => {
  if (k < 0 || k > 1) return null;
  const w = (p: {x: number; y: number}) => ({x: WRIST.x - HS * p.x, y: WRIST.y + HS * p.y});
  const pts = [w(rotp({x: -330, y: 0}, ARM_ANG)), w({x: 0, y: -6}), w(rotp({x: 150, y: -8}, pose.wrist)), (() => {
    const tip = indexTip(pose, -1, HS);
    return {x: WRIST.x + tip.x, y: WRIST.y + tip.y - 14};
  })()];
  const L = pts.slice(1).reduce((s, p, i) => s + Math.hypot(p.x - pts[i].x, p.y - pts[i].y), 0);
  const d = `M${pts.map((p) => P(p.x, p.y - 10)).join(' L')}`;
  return <path d={d} fill="none" stroke={K.saffron} strokeWidth={20} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={`${fmt(L * 0.3)} ${fmt(L * 2)}`} strokeDashoffset={fmt(-L * (k * 1.15 - 0.3))} opacity={0.9 * (1 - clamp((k - 0.75) / 0.25))} />;
};

const GameInset: React.FC<{id: string; t: number; events: GEvent[]; cursor?: number; cityHitAt?: number; x: number; y: number; s: number; tag?: number}> = ({id, t, events, cursor, cityHitAt, x, y, s, tag = 1}) => (
  <g>
    {cityHitAt !== undefined && t > cityHitAt && t < cityHitAt + 0.9 && (
      <rect x={x - 22} y={y - 22} width={640 * s + 44} height={400 * s + 44} rx={24} fill="none" stroke={K.coral} strokeWidth={12} opacity={1 - (t - cityHitAt) / 0.9} />
    )}
    <rect x={x - 12} y={y - 12} width={640 * s + 24} height={400 * s + 24} rx={16} fill={K.cream} stroke={INK} strokeWidth={6} />
    <defs>
      <clipPath id={id}>
        <rect x={x} y={y} width={640 * s} height={400 * s} rx={6} />
      </clipPath>
    </defs>
    <g clipPath={`url(#${id})`}>
      <g transform={`translate(${fmt(x)} ${fmt(y)}) scale(${fmt(s)})`}>
        <GameScreen t={t} events={events} cityHitAt={cityHitAt} cursor={cursor} />
      </g>
    </g>
    <rect x={x} y={y} width={640 * s} height={400 * s} rx={6} fill="none" stroke={INK} strokeWidth={4} />
    {tag > 0.001 && <Tag x={x + 120} y={y - 12} text="Sender's game" size={28} k={tag} />}
  </g>
);

// tallies (TC coords, under the game inset)
const TALLY = {x: 1224, rk: 394, pl: 438, pl2: 478, step: 58};
type Tally = {rk: number[]; rkHit: number[]; pl: number[]; plHit: number[]; plStep?: number};
const TallyRows: React.FC<{t: number; d: Tally; k?: number}> = ({t, d, k = 1}) => (
  <g opacity={k}>
    {d.rk.map((tt, i) => {
      const a = clamp((t - tt) / 0.16);
      if (a <= 0) return null;
      const hit = d.rkHit.includes(i);
      const x = TALLY.x + i * TALLY.step, y = TALLY.rk;
      return (
        <g key={`r${i}`} opacity={a}>
          <RocketIcon x={x} y={y} s={0.68} op={hit ? 0.45 : 1} />
          {hit && <Burst x={x - 4} y={y} r={24} k={a} />}
          {!hit && <path d={`M${P(x + 22, y - 18)} l14,-10 M${P(x + 24, y - 4)} l18,0`} stroke={K.coral} strokeWidth={5} strokeLinecap="round" />}
        </g>
      );
    })}
    {d.pl.map((tt, i) => {
      const a = clamp((t - tt) / 0.16);
      if (a <= 0) return null;
      const hit = d.plHit.includes(i);
      const per = 8;
      const x = TALLY.x + (i % per) * (d.plStep ?? TALLY.step), y = i < per ? TALLY.pl : TALLY.pl2;
      return (
        <g key={`p${i}`} opacity={a}>
          <PlaneIcon x={x} y={y} s={0.6} op={hit ? 0.55 : 1} />
          {hit && <RedX x={x} y={y} r={16} k={a} />}
        </g>
      );
    })}
  </g>
);
const spread = (a: number, b: number, n: number) => Array.from({length: n}, (_, i) => (n === 1 ? a : lerp(a, b, i / (n - 1))));
const tallies = (M: TM): Tally[] => [
  {rk: [M.N.kill, ...spread(M.N.kill + 0.16, M.N.kill + 0.66, 5)], rkHit: [0, 1, 2, 4, 5], pl: [...spread(M.P.kill - 0.3, M.P.kill - 0.1, 2), M.P.kill, ...spread(M.P.kill + 0.08, M.P.kill + 0.42, 5)], plHit: [2, 4, 6]},
  {rk: [M.brd + 1.12, M.brd + 1.5, M.brd + 1.85, M.brd + 2.3], rkHit: [2], pl: spread(M.brd + 1.9, M.brd + 2.3, 16), plHit: [3, 9, 14]},
  {rk: spread(M.brd + 2.25, M.brd + 2.6, 8), rkHit: [1, 4, 6], pl: spread(M.brd + 2.4, M.brd + 2.7, 8), plHit: []},
];

/** the hand, the pad and the game */
const RightSide: React.FC<{t: number; events: GEvent[]; cursor: number; cityHitAt?: number; pose: HandPoseP; press: number; drive: number; tally?: React.ReactNode; handDy?: number; handDx?: number; padMorph?: React.ReactNode; look: RLook; gameTag?: number; hideGame?: boolean}> = ({
  t, events, cursor, cityHitAt, pose, press, drive, tally, handDy = 0, handDx = 0, padMorph, look, gameTag = 1, hideGame,
}) => (
  <g>
    <defs>
      <linearGradient id="ve-rwall" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#24303B" />
        <stop offset="1" stopColor="#2E3B47" />
      </linearGradient>
      <radialGradient id="ve-pool" cx="0.5" cy="0.3" r="0.7">
        <stop offset="0" stopColor="#6E6258" />
        <stop offset="1" stopColor="#3A3632" />
      </radialGradient>
    </defs>
    <rect x={860} y={-300} width={1500} height={950} fill="url(#ve-rwall)" />
    <rect x={860} y={650} width={1500} height={700} fill="url(#ve-pool)" />
    <rect x={860} y={650} width={1500} height={10} fill="#7D7064" />
    {!hideGame && <GameInset id="ve-gclip" t={t} events={events} cursor={cursor} cityHitAt={cityHitAt} x={GAME.x} y={GAME.y} s={GAME.s} tag={gameTag} />}
    {!hideGame && tally}
    {padMorph ?? <Touchpad x={PAD.x} y={PAD.y} s={PAD.s} press={press} glow={press} />}
    <g transform={`translate(${fmt(handDx)} ${fmt(handDy)})`}>
      <SideHand id="ve-h" x={WRIST.x} y={WRIST.y} s={HS} dir={-1} side="thumb" pose={pose} skin={look.skin} sleeve={look.shirt} arm={420} armAng={ARM_ANG} />
      <DriveGlow pose={pose} k={drive} />
    </g>
    {press > 0 && (
      <g opacity={press} stroke={K.saffron} strokeWidth={8} strokeLinecap="round">
        <path d={`M${PAD.x - 150},${PAD_TOP - 10} l-34,-10`} />
        <path d={`M${PAD.x - 130},${PAD_TOP - 46} l-26,-26`} />
        <path d={`M${PAD.x + 70},${PAD_TOP + 8} l34,-4`} />
      </g>
    )}
  </g>
);

// slanted gutter between the two views
const GUT = {top: 905, bot: 870, w: 26};
const leftClip = `M-400,-400 L${GUT.top},-400 L${GUT.top},0 L${GUT.bot},1080 L${GUT.bot},1500 L-400,1500 Z`;
const Gutter: React.FC = () => <path d={`M${GUT.top},-400 L${GUT.top + GUT.w},-400 L${GUT.top + GUT.w},0 L${GUT.bot + GUT.w},1080 L${GUT.bot + GUT.w},1500 L${GUT.bot},1500 L${GUT.bot},1080 L${GUT.top},0 Z`} fill={INK} />;

/** the trial composition. mode: e2 (the first trial and the flip), N (coil in position, pair 1), F (coil flipped). */
const TC: React.FC<{f: number; mode: 'e2' | 'N' | 'F'; cam: CamS; handDy?: number; handDx?: number; padMorph?: React.ReactNode; tagK?: number; hideTally?: boolean}> = ({f, mode, cam, handDy, handDx, padMorph, tagK = 1, hideTally}) => {
  const t = f / FPS;
  const M = tm();
  const look = RECV[0];
  const tr = mode === 'e2' ? M.e2 : mode === 'N' ? M.N : M.F;
  const respond = mode !== 'F';
  const flip = mode === 'F' ? 1 : mode === 'N' ? 0 : pr(f, M.fs, M.fs + 0.9);
  const axisK = mode === 'e2' ? pr(f, M.fs - 0.35, M.fs - 0.05) * (1 - pr(f, M.fs + 0.9, M.ab0 - 0.02)) : 0;
  const grip = mode === 'e2' ? pr(f, M.fs - 1.1, M.fs - 0.45) * (1 - pr(f, M.fs + 0.95, M.ab0 - 0.02)) : 0;
  const roll = mode === 'e2' ? 14 * Math.sin(pr(f, M.fs, M.fs + 0.9) * Math.PI) : 0;
  const pulses = mode === 'N' ? [tr.pulse, M.P.pulse] : [tr.pulse];
  let j = {pose: REST, press: 0, rs: 0, drive: -1};
  if (respond) for (const p of pulses) {
    const jj = jerk(t, p);
    if (t - p > -0.01 && t - p < 1) j = jj;
  }
  const events: GEvent[] = [{kind: 'rocket', t0: tr.t0, dur: DUR, fire: respond ? tr.fire : undefined}];
  if (mode === 'N') events.push({kind: 'plane', t0: M.P.t0, dur: M.P.dur, fire: M.P.fire});
  const rise = (a: number, b: number, p: number) => pr(f, a, b) * (1 - pr(f, p + 0.1, p + 0.5));
  const cursor = Math.max(rise(tr.up0, tr.up1, tr.pulse), mode === 'N' ? rise(M.P.up0, M.P.up1, M.P.pulse) : 0);
  const packets: [number, number][] = pulses.map((p) => [p - 0.32, p - 0.03]);
  // a red X on the friendly plane
  const pl = mode === 'N' ? (() => {
    const e = events[1];
    const s = evState(e, t);
    const k = pr(f, M.P.kill, M.P.kill + 0.2, easeOut) * (1 - pr(f, M.P.kill + 1.0, M.P.kill + 1.3));
    if (k <= 0.001) return null;
    const hp = arcPt(s.uHit);
    return (
      <g transform={`translate(${GAME.x} ${GAME.y}) scale(${GAME.s})`}>
        <RedX x={hp.x} y={hp.y} r={30} k={k} />
      </g>
    );
  })() : null;
  const tagText = mode === 'F' ? 'Coil flipped' : 'Coil in position';
  // the game runs on the trial's own clock, so the normal and the flipped trial show identical game frames
  const gShift = 100 - tr.t0;
  const tagShow = mode === 'e2' ? 0 : tagK;
  return (
    <g>
      <Cam x={cam.x} y={cam.y} z={cam.z}>
        <g>
          <defs>
            <clipPath id="ve-lclip">
              <path d={leftClip} />
            </clipPath>
          </defs>
          <RightSide t={t + gShift} events={events.map((e) => ({...e, t0: e.t0 + gShift, fire: e.fire !== undefined ? e.fire + gShift : undefined}))} cursor={cursor} cityHitAt={respond ? undefined : tr.arrive + gShift} pose={j.pose} press={j.press} drive={j.drive} look={look}
            tally={mode === 'N' ? <TallyRows t={t} d={tallies(M)[0]} /> : null} hideGame={hideTally} handDy={handDy} handDx={handDx} padMorph={padMorph} />
          {!hideTally && pl}
          <g clipPath="url(#ve-lclip)">
            <RecvRoom f={f} id="ve-tc" look={look} flip={flip} pulses={pulses} rs={j.rs} axisK={axisK} grip={grip} roll={roll} packets={packets} />
          </g>
          <Gutter />
        </g>
      </Cam>
      {tagShow > 0.001 && <Tag x={430} y={70} text={tagText} size={38} fill={mode === 'F' ? '#D5DBE0' : lit(K.saffron, 0.45)} k={tagShow} />}
    </g>
  );
};

// ---------------------------------------------------------------- UNITS: three pairs
const U_PITCH = 2140;
const U_GAP = 200;
const RW = 900, RH = 1080;
const recvOrigin = (i: number) => ({x: i * U_PITCH + RW + U_GAP, y: 0});
const sendOrigin = (i: number) => ({x: i * U_PITCH, y: 0});
const UNITS_W = 2 * U_PITCH + 2 * RW + U_GAP;
const UNITS_CAM: CamS = {x: UNITS_W / 2, y: 470, z: 1920 / (UNITS_W + 160)};
const PANEL_R = 34;

const SenderRoom: React.FC<{f: number; i: number; present: number}> = ({f, i, present}) => {
  const t = f / FPS;
  const look = SEND[i];
  const sx = 380;
  return (
    <g>
      <defs>
        <linearGradient id={`ve-sw${i}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={lit('#CFE0EC', 0.25)} />
          <stop offset="1" stopColor="#CFE0EC" />
        </linearGradient>
      </defs>
      <rect x={-40} y={-40} width={RW + 80} height={RH + 80} fill={`url(#ve-sw${i})`} />
      <rect x={-40} y={520} width={RW + 80} height={26} fill="#B5C9D8" />
      <rect x={60} y={150} width={170} height={130} rx={8} fill="#FFFFFF" stroke={INK} strokeWidth={6} />
      <path d="M82,250 L120,214 L150,236 L206,180" fill="none" stroke={K.blue} strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" />
      {/* the network cable from the monitor up the wall to the top */}
      <path d={`M770,520 C800,400 790,200 800,-60`} fill="none" stroke={INK} strokeWidth={22} strokeLinecap="round" />
      <path d={`M770,520 C800,400 790,200 800,-60`} fill="none" stroke="#3D4852" strokeWidth={13} strokeLinecap="round" />
      <rect x={sx - 150} y={530} width={300} height={360} rx={44} fill="#4A5866" stroke={INK} strokeWidth={6} />
      {present > 0.001 && (
        <g opacity={clamp(present * 1.6)} transform={`translate(${sx} 1000) scale(${fmt(0.9 + 0.1 * easeOutBack(clamp(present)))}) translate(${-sx} -1000)`}>
          <CrewChar id={`ve-s${i}`} look={look} pose={{...IDLE, lookX: 0.8, lookY: 0.2, mouth: 'flat', armL: {a: 6, b: 4}, armR: {a: 6, b: 4}}} frame={f} seed={11 + i} x={sx} y={1000} scale={1.5} headGear={<EEGCap />} shadow={false} life={0.4} />
        </g>
      )}
      <Desk id={`ve-sd${i}`} x0={-60} x1={RW + 60} y={760} d={110} h={360} />
      <Monitor id={`ve-sm${i}`} x={660} y={712} s={0.4}>
        <GameScreen t={t} events={[]} />
      </Monitor>
    </g>
  );
};

const UnitsWorld: React.FC<{f: number}> = ({f}) => {
  const t = f / FPS;
  const M = tm();
  const plugProg = pr(f, M.s, M.click, (x) => easeInOut(x));
  // the plug from D: same pose (scale, sway) at the cut, then lowered into the port
  const th = (Math.PI / 2) * 0.92 * Math.exp(-(t - T('Bad connection')) * HANG_DECAY) * Math.cos((t - T('Bad connection')) * HANG_W);
  const ang = (-th * 180 / Math.PI) * (1 - plugProg);
  const LS = D_PLUG.LS;
  const seatY = PORT.y + 14 - PLUG_TIP * LS;
  const plugY = seatY - PLUG_DROP * (1 - plugProg);
  const pj = {x: PORT.x + Math.sin(th) * D_PLUG.L * (1 - plugProg), y: plugY - PLUG_JOIN * LS};
  const plug = <SeatedPlug j={pj} ang={ang} />;
  return (
    <g>
      {[0, 1, 2].map((i) => {
        const so = sendOrigin(i), ro = recvOrigin(i);
        const pk = pr(f, M.pops[i] - 0.05, M.pops[i] + 0.3, (x) => x);
        // the link between the two rooms: from the sender room's top to the receiver room's network cable
        const a = {x: so.x + 800, y: so.y + 6}, b = {x: ro.x + PORT.x, y: ro.y + 6};
        return (
          <g key={i}>
            <g transform={`translate(${so.x} ${so.y})`}>
              <defs>
                <clipPath id={`ve-su${i}`}>
                  <rect x={0} y={0} width={RW} height={RH} rx={PANEL_R} />
                </clipPath>
              </defs>
              <g clipPath={`url(#ve-su${i})`}>
                <SenderRoom f={f} i={i} present={pk} />
                {pk < 1 && <rect x={0} y={0} width={RW} height={RH} fill={INK} opacity={0.35 * (1 - pk)} />}
              </g>
              <rect x={0} y={0} width={RW} height={RH} rx={PANEL_R} fill="none" stroke={INK} strokeWidth={10} />
            </g>
            <g transform={`translate(${ro.x} ${ro.y})`}>
              <defs>
                <clipPath id={`ve-ru${i}`}>
                  <rect x={0} y={0} width={RW} height={RH} rx={PANEL_R} />
                </clipPath>
              </defs>
              <g clipPath={`url(#ve-ru${i})`}>
                <RecvRoom f={f} id={`ve-ru${i}r`} look={RECV[i]} flip={0} pulses={[]} present={pk} plug={i === 0 ? plug : undefined} power={i === 0 ? pr(f, M.click, M.click + 0.1) : pk} />
              </g>
              <rect x={0} y={0} width={RW} height={RH} rx={PANEL_R} fill="none" stroke={INK} strokeWidth={10} />
            </g>
            {/* the link over the gap */}
            <path d={`M${P(a.x, a.y)} C${P(a.x, -260)} ${P(b.x, -260)} ${P(b.x, b.y)}`} fill="none" stroke={INK} strokeWidth={22} strokeLinecap="round" />
            <path d={`M${P(a.x, a.y)} C${P(a.x, -260)} ${P(b.x, -260)} ${P(b.x, b.y)}`} fill="none" stroke="#3D4852" strokeWidth={13} strokeLinecap="round" />
            <Tag x={so.x + RW + U_GAP / 2} y={RH + 150} text={`Pair ${i + 1}`} size={110} fill={lit(RECV[i].shirt, 0.35)} k={pk} />
          </g>
        );
      })}
    </g>
  );
};
const PLUG_DROP = 110;

const camUnits = (f: number): CamS => {
  const t = f / FPS;
  const M = tm();
  const r0 = recvOrigin(0);
  const port = {x: r0.x + PORT.x, y: r0.y + PORT.y};
  const seatY = PORT.y + 14 - PLUG_TIP * D_PLUG.LS;
  if (t < M.click + 0.3) {
    // continue D's push on the plug: the plug holds its place in frame while it is lowered, the machine rises in
    const prog = pr(f, M.s, M.click, (x) => easeInOut(x));
    const plugO = {x: port.x, y: r0.y + seatY - PLUG_DROP * (1 - prog)};
    const u = easeOut(clamp((t - M.s) / (M.click + 0.3 - M.s)));
    return anchorCam(plugO, D_PLUG_END.screen, {x: 960, y: 470}, D_PLUG_END.z, 3.9, u);
  }
  if (t < M.out1) {
    const u = easeInOut(clamp((t - (M.click + 0.3)) / (M.out1 - (M.click + 0.3))));
    const seat = {x: port.x, y: r0.y + seatY};
    return anchorCam(seat, {x: 960, y: 470}, toScr(UNITS_CAM, seat), 3.9, UNITS_CAM.z, u);
  }
  if (t < M.push0) return camKeys(f, [[M.out1, UNITS_CAM], [M.push0, {...UNITS_CAM, z: UNITS_CAM.z * 1.02}]]);
  const z0 = UNITS_CAM.z * 1.02;
  const c0: CamS = {...UNITS_CAM, z: z0};
  const coil = {x: r0.x + COIL.x, y: r0.y + COIL.y};
  const end = SW_CAM;
  const u = easeInOut(clamp((t - M.push0) / (M.sw - M.push0)));
  return anchorCam(coil, toScr(c0, coil), toScr(end, COIL), z0, end.z, u);
};
/** the TC camera at the units -> TC switch (TC coords; units coords are the same plus the receiver origin) */
const SW_CAM: CamS = {x: HX, y: 420, z: 2.2};

// ---------------------------------------------------------------- TC cameras
const camE2 = (f: number): CamS => {
  const M = tm();
  const t = f / FPS;
  const hand = {x: 1330, y: 700, z: 1.55};
  if (t < M.flipIn)
    return camKeys(f, [
      [M.sw, SW_CAM],
      [M.sw + 1.0, hand],
      [M.e2.pulse - 0.1, {x: 960, y: 540, z: 1}],
      [M.flipIn, {x: 990, y: 540, z: 1.03}],
    ]);
  const c0: CamS = {x: 990, y: 540, z: 1.03};
  const u = easeInOut(clamp((t - M.flipIn) / 1.0));
  return anchorCam({x: COIL.x - 20, y: COIL.y + 10}, toScr(c0, {x: COIL.x - 20, y: COIL.y + 10}), {x: 900, y: 470}, 1.03, 2.25, u);
};
/** the trial camera for N and F: identical relative to the composition's cut */
const camTrial = (f: number, cut: number): CamS => {
  const k = pr(f, cut, cut + 3.0, (x) => x);
  return {x: 960 + 20 * k, y: 540 + 10 * k, z: 1 + 0.035 * easeInOut(k)};
};

// ---------------------------------------------------------------- AB: coil in position | coil flipped
const Eq: React.FC<{x: number; y: number; k: number}> = ({x, y, k}) =>
  k <= 0.001 ? null : (
    <g transform={`translate(${fmt(x)} ${fmt(y)}) scale(${fmt(0.6 + 0.4 * easeOutBack(clamp(k)))})`} opacity={clamp(k * 2)}>
      <circle r={40} fill={K.cream} stroke={INK} strokeWidth={6} />
      <path d="M-18,-9 L18,-9 M-18,9 L18,9" stroke={INK} strokeWidth={9} strokeLinecap="round" />
    </g>
  );
const Q: React.FC<{x: number; y: number; k: number}> = ({x, y, k}) =>
  k <= 0.001 ? null : (
    <g transform={`translate(${fmt(x)} ${fmt(y)}) scale(${fmt(1.4 * (0.6 + 0.4 * easeOutBack(clamp(k))))})`} opacity={clamp(k * 2)}>
      <path d="M-46,-40 Q-46,-62 -24,-62 L24,-62 Q46,-62 46,-40 L46,18 Q46,40 24,40 L-2,40 L-22,62 L-18,40 L-24,40 Q-46,40 -46,18 Z" fill={K.cream} stroke={INK} strokeWidth={6} strokeLinejoin="round" />
      <text x={0} y={2} textAnchor="middle" fontFamily={FONT_HEAD} fontWeight={700} fontSize={64} fill={INK} dominantBaseline="middle">?</text>
    </g>
  );

/** x of the gutter's centre line at height y (TC coords) */
const gutX = (y: number) => GUT.top + GUT.w / 2 + ((GUT.bot - GUT.top) * y) / 1080;
const AB: React.FC<{f: number}> = ({f}) => {
  const t = f / FPS;
  const M = tm();
  const form = easeInOut(pr(f, M.ab0, M.ab1, (x) => x));
  const wipe = easeInOut(pr(f, M.wipe0, M.cutN, (x) => x));
  const pS = T('Same pulse');
  const pulses = [pS + 0.35, T('couldn’t tell') - 0.6, T('which way the coil') + 0.4];
  const gameK = pr(f, T('Same game') - 0.05, T('Same game') + 0.2);
  const dialK = pr(f, pS - 0.05, pS + 0.2) * (1 - pr(f, T('Even the participants'), T('Even the participants') + 0.3));
  const qK = pr(f, T('couldn’t tell') - 0.1, T('couldn’t tell') + 0.15) * (1 - pr(f, M.wipe0 - 0.3, M.wipe0));
  const tilt = 4 * Math.sin(pr(f, T('couldn’t tell'), T('couldn’t tell') + 1.4) * Math.PI);
  const ev: GEvent[] = [{kind: 'plane', t0: T('Same game') - 0.1, dur: 2.4}];
  const gameOut = 1 - pr(f, M.wipe0 - 0.3, M.wipe0);
  // the flipped close-up settles into the right half; the in-position room slides in from the left as a panel
  const anchor = {x: COIL.x - 20, y: COIL.y + 10};
  const camF = anchorCam(anchor, {x: 900, y: 470}, anchor, 2.25, 1, form);
  const offR = lerp(0, 960, form) + wipe * 1100;
  const offL = lerp(-1000, 0, form);
  const extras = (side: 'L' | 'R') => (
    <g>
      {gameK > 0.001 && gameOut > 0.001 && (
        <g opacity={clamp(gameK * 1.5) * gameOut} transform={`translate(0 ${fmt(-30 * (1 - gameK))})`}>
          <GameInset id={`ve-abg${side}-${f}`} t={t} events={ev} x={575} y={112} s={0.47} tag={0} />
        </g>
      )}
      <Q x={HX + 250} y={HY - 40} k={qK} />
    </g>
  );
  const eqY = [190, 805, 480];
  const eqK = [pr(f, T('Same game') + 0.1, T('Same game') + 0.35) * gameOut, pr(f, pS + 0.1, pS + 0.35) * (1 - pr(f, M.wipe0 - 0.3, M.wipe0)), qK];
  return (
    <g>
      {/* under everything: the trial composition, revealed as the flipped half slides away */}
      {wipe > 0 && <TC f={f} mode="N" cam={camTrial(f, M.cutN)} tagK={0} />}
      {/* right half: coil flipped */}
      <g>
        <defs>
          <clipPath id={`ve-abR-${f}`}>
            <rect x={Math.max(0, offL + GUT.bot) + wipe * 1100} y={-10} width={3000} height={1100} />
          </clipPath>
        </defs>
        <g clipPath={`url(#ve-abR-${f})`}>
          <g transform={`translate(${fmt(offR)} 0)`}>
            <Cam x={camF.x} y={camF.y} z={camF.z}>
              <RecvRoom f={f} id="ve-abR" look={RECV[0]} flip={1} pulses={pulses} boxHi={dialK} tilt={tilt} />
            </Cam>
            {extras('R')}
          </g>
        </g>
        <Tag x={1390 + wipe * 1100} y={70} text="Coil flipped" size={38} fill="#D5DBE0" k={form} />
      </g>
      {/* left half: coil in position, a panel with the trial composition's slanted gutter */}
      <g transform={`translate(${fmt(offL)} 0)`}>
        <defs>
          <clipPath id={`ve-abL-${f}`}>
            <path d={leftClip} />
          </clipPath>
        </defs>
        <g clipPath={`url(#ve-abL-${f})`}>
          <RecvRoom f={f} id="ve-abL" look={RECV[0]} flip={0} pulses={pulses} boxHi={dialK} tilt={tilt} />
          {extras('L')}
        </g>
        <Gutter />
        {eqY.map((y, i) => <Eq key={i} x={gutX(y)} y={y} k={eqK[i]} />)}
        <Tag x={430} y={70} text="Coil in position" size={38} fill={lit(K.saffron, 0.45)} k={1} />
      </g>
    </g>
  );
};

// ---------------------------------------------------------------- BOARD
const COLX = [400, 960, 1520];
const GSC = 400 / (640 * GAME.s); // TC game -> board game window
const colT = (i: number) => ({x: COLX[i] - 200 - GAME.x * GSC, y: 110 - GAME.y * GSC});
const BPAD = {w: 260, h: 169, y: 560};
const padRect = (i: number) => ({x: COLX[i] - BPAD.w / 2, y: BPAD.y, w: BPAD.w, h: BPAD.h});

const FlatPadE: React.FC<{id: string; x: number; y: number; w: number; h: number; glow?: number; shadow?: number; dashed?: number}> = ({id, x, y, w, h, shadow = 1, dashed = 0}) => {
  const r = h * 0.11;
  if (dashed > 0) return <rect x={x + 3} y={y + 3} width={w - 6} height={h - 6} rx={r} fill="#FFFFFF" fillOpacity={0.4} stroke={INK} strokeWidth={6} strokeDasharray="20 14" opacity={dashed} />;
  return (
    <g>
      {shadow > 0 && <rect x={x + 6} y={y + 9} width={w} height={h} rx={r} fill={INK} opacity={0.18 * shadow} />}
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#F6F8FA" />
          <stop offset="1" stopColor="#DCE2E7" />
        </linearGradient>
      </defs>
      <rect x={x + 2.5} y={y + 2.5} width={w - 5} height={h - 5} rx={r - 2.5} fill={`url(#${id})`} stroke={INK} strokeWidth={5} />
    </g>
  );
};
/** a tiny coil-on-head icon (row labels) */
const CoilIcon: React.FC<{x: number; y: number; flip: number}> = ({x, y, flip}) => (
  <g>
    <path d={`M${x - 52},${y + 46} A52 52 0 0 1 ${x + 52},${y + 46} Z`} fill={K.r14Skin} stroke={INK} strokeWidth={5} />
    <path d={`M${x - 52},${y + 46} A52 52 0 0 1 ${x + 52},${y + 46}`} fill="none" stroke="#2B1A10" strokeWidth={14} transform="translate(0 3)" />
    <S5Coil x={x + 14} y={y - 24} s={0.36} ang={0} flip={flip} />
  </g>
);

/** the flipped row's pads in the assembled board (phase 2): bigger, the top row shrinks to make room */
const P2 = {w: 300, h: 195, y: 470};
const padRect2 = (i: number) => ({x: COLX[i] - P2.w / 2, y: P2.y, w: P2.w, h: P2.h});
const TOP2 = `translate(960 24) scale(0.8) translate(-960 -24)`;

const Board: React.FC<{f: number; phase: 1 | 2}> = ({f, phase}) => {
  const t = f / FPS;
  const M = tm();
  const T3 = tallies(M);
  const fly = easeInOut(pr(f, M.brd, M.brd + 0.45, (x) => x));
  const colIn = (i: number) => (i === 0 ? 1 : easeOut(pr(f, M.brd + 0.2 + i * 0.12, M.brd + 0.55 + i * 0.12, (x) => x)));
  // pair 2 plays four rockets fast; pair 3 two
  const ev2: GEvent[] = [0, 1, 2, 3].map((n) => ({kind: 'rocket', t0: M.brd + 0.35 + n * 0.38, dur: 0.85, fire: n === 2 ? M.brd + 0.35 + n * 0.38 + 0.4 : undefined}));
  const ev3: GEvent[] = [{kind: 'rocket', t0: M.brd + 1.95, dur: 0.85, fire: M.brd + 2.3}, {kind: 'rocket', t0: M.brd + 2.25, dur: 0.85}];
  const lastHit = (ev: GEvent[]) => {
    let h: number | undefined;
    for (const e of ev) if (e.fire === undefined && t >= e.t0 + e.dur) h = e.t0 + e.dur;
    return h;
  };
  const qK = phase === 1 ? 0.45 * pr(f, M.brd + 0.4, M.brd + 0.8) + 0.55 * pr(f, M.cutF - 0.55, M.cutF - 0.3) : 0;
  const zeroK = (i: number) => pr(f, M.nob + 0.05 + i * 0.25, M.nob + 0.3 + i * 0.25);
  const fadeEnd = 1 - pr(f, M.push + 0.05, M.push + 0.6);
  const top = (
    <g>
      <CoilIcon x={92} y={220} flip={0} />
      {[0, 1, 2].map((i) => {
        const k = colIn(i);
        return (
          <g key={i} transform={`translate(${fmt((1 - k) * 600)} 0)`} opacity={clamp(k * 1.5)}>
            <rect x={COLX[i] - 250} y={34} width={500} height={470} rx={26} fill={K.cream} stroke={INK} strokeWidth={5} opacity={0.9} />
            <Tag x={COLX[i]} y={34} text={`Pair ${i + 1}`} size={34} fill={lit(RECV[i].shirt, 0.35)} />
            {i > 0 && (
              <g transform={`translate(${fmt(colT(i).x)} ${fmt(colT(i).y)}) scale(${fmt(GSC)})`}>
                <GameInset id={`ve-bg${i}-${f}`} t={t} events={i === 1 ? ev2 : ev3} cityHitAt={lastHit(i === 1 ? ev2 : ev3)} x={GAME.x} y={GAME.y} s={GAME.s} tag={0} />
                <TallyRows t={t} d={T3[i]} />
              </g>
            )}
          </g>
        );
      })}
      {/* column 1's game + tally: carried from the trial composition */}
      {(() => {
        const {tx, ty, sc} = carryT(f);
        return (
          <g transform={`translate(${fmt(tx)} ${fmt(ty)}) scale(${fmt(sc)})`}>
            <GameInset id={`ve-bg0-${f}`} t={Math.min(t, M.brd + 0.5) + 100 - M.N.t0} events={[]} x={GAME.x} y={GAME.y} s={GAME.s} tag={1 - fly} />
            <TallyRows t={t} d={T3[0]} />
          </g>
        );
      })()}
    </g>
  );
  return (
    <g>
      <rect x={-2000} y={-2000} width={6000} height={5000} fill={K.paper} />
      <g opacity={fadeEnd}>
        {phase === 1 ? top : <g transform={TOP2}>{top}</g>}
        {qK > 0 && <g opacity={qK}><CoilIcon x={92} y={620} flip={1} /></g>}
        {phase === 2 && <CoilIcon x={92} y={540} flip={1} />}
        {/* flipped row: question marks (phase 1) */}
        {qK > 0 && [0, 1, 2].map((i) => {
          const r = padRect(i);
          return (
            <g key={i}>
              <FlatPadE id={`ve-qp${i}`} {...r} dashed={qK} />
              <text x={COLX[i]} y={r.y + r.h / 2 + 26} textAnchor="middle" fontFamily={FONT_HEAD} fontWeight={700} fontSize={80} fill={INK} opacity={0.6 * qK}>?</text>
            </g>
          );
        })}
      </g>
      {/* flipped row (phase 2): pads, 0 presses, every rocket through to the city */}
      {phase === 2 && [0, 1, 2].map((i) => {
        const r = padRect2(i);
        const city = {x: COLX[i] + 240, y: r.y + r.h};
        const rockets: React.ReactNode[] = [];
        let hit = 0;
        for (let n = 0; n < 2; n++) {
          const l0 = M.every - 0.75 + i * 0.18 + n * 0.55;
          const u = (t - l0) / 0.85;
          const p0 = {x: COLX[i] - 280, y: r.y + 40}, p1 = {x: COLX[i], y: r.y - 150}, p2 = {x: city.x + 10, y: city.y - 90};
          const q = (uu: number) => ({x: (1 - uu) ** 2 * p0.x + 2 * uu * (1 - uu) * p1.x + uu * uu * p2.x, y: (1 - uu) ** 2 * p0.y + 2 * uu * (1 - uu) * p1.y + uu * uu * p2.y});
          if (u >= 0 && u < 1) {
            const A = q(u), B = q(Math.min(1, u + 0.02));
            rockets.push(<RocketIcon key={n} x={A.x} y={A.y} s={1} a={(Math.atan2(B.y - A.y, B.x - A.x) * 180) / Math.PI} />);
          }
          const h = (t - (l0 + 0.85)) / 0.9;
          if (h >= 0 && h < 1) hit = h;
        }
        return (
          <g key={i}>
            <g opacity={fadeEnd}>
              <MiniCity x={city.x} y={city.y} s={0.95} hit={hit} />
              {rockets}
              <Label x={COLX[i]} y={r.y + r.h + 74} text="0 presses" size={54} weight={700} k={zeroK(i)} />
            </g>
            <g opacity={i === 0 ? 1 : fadeEnd}>
              <FlatPadE id={`ve-fp${i}`} {...r} shadow={i === 0 ? fadeEnd : 1} />
            </g>
          </g>
        );
      })}
    </g>
  );
};

/** board camera (phase 2): out of pad 1's surface to the whole board, then the push back into pad 1 that ends
 *  exactly on PAD_RECT */
const THROUGH_Z = 17; // TC zoom inside the touchpad's surface
const BOARD_Z0 = 8; // board zoom inside pad 1's surface at the switch
const camBoard = (f: number): CamS => {
  const M = tm();
  const t = f / FPS;
  const r = padRect2(0);
  const c = {x: r.x + r.w / 2, y: r.y + r.h / 2};
  // a slow drift toward pad 1 while the row fills in, continuing into the final push
  const DRIFT = 1.035;
  const sD = {x: lerp(c.x, 960, 0.06), y: lerp(c.y, 540, 0.06)};
  if (t < M.thr1) {
    const u = easeOut(clamp((t - M.thr) / (M.thr1 - M.thr)));
    return anchorCam(c, {x: 960, y: 540}, c, BOARD_Z0, 1, u);
  }
  if (t < M.push) {
    const u = clamp((t - M.thr1) / (M.push - M.thr1));
    return anchorCam(c, c, sD, 1, DRIFT, u * (2 - u) * 0.5 + u * 0.5);
  }
  const zEnd = (PAD_RECT.x1 - PAD_RECT.x0) / r.w;
  const sEnd = {x: (PAD_RECT.x0 + PAD_RECT.x1) / 2, y: (PAD_RECT.y0 + PAD_RECT.y1) / 2};
  const u = easeInOut(clamp((t - M.push) / (M.end - 0.07 - M.push)));
  return anchorCam(c, sD, sEnd, DRIFT, zEnd, u);
};

// ---------------------------------------------------------------- the TC -> board transition: through the pad
const PAD_IN = {x: PAD.x - 10, y: PAD.y - 55 * PAD.s}; // a point on the pad's top face, clear of the hovering hand
const camThrough = (f: number): CamS => {
  const M = tm();
  const t = f / FPS;
  const c0 = camTrial(Math.round(M.brd2 * FPS), M.cutF);
  const u = clamp((t - M.brd2) / (M.thr - M.brd2));
  return anchorCam(PAD_IN, toScr(c0, PAD_IN), {x: 960, y: 540}, c0.z, THROUGH_Z, u * u * u);
};

// ---------------------------------------------------------------- the sequence
export const VE: React.FC<{f: number}> = ({f}) => {
  const t = f / FPS;
  const M = tm();
  if (t < M.sw) {
    const cam = camUnits(f);
    const yearK = pr(f, M.click + 0.05, M.click + 0.35) * (1 - pr(f, M.push0, M.push0 + 0.3));
    return (
      <g>
        <rect x={0} y={0} width={1920} height={1080} fill={K.paper} />
        <Cam x={cam.x} y={cam.y} z={cam.z}>
          <UnitsWorld f={f} />
        </Cam>
        <Tag x={960} y={150} text="2014" size={64} k={yearK} />
      </g>
    );
  }
  // the first trial and the flip (the camera continues from the units world)
  if (t < M.ab0) return <TC f={f} mode="e2" cam={camE2(f)} />;
  if (t < M.cutN) return <AB f={f} />;
  if (t < M.brd) return <TC f={f} mode="N" cam={camTrial(f, M.cutN)} />;
  if (t < M.cutF) {
    const out = pr(f, M.brd, M.brd + 0.22);
    return (
      <g>
        <Board f={f} phase={1} />
        {out < 1 && (
          <g opacity={1 - out}>
            <TC f={f} mode="N" cam={camTrial(f, M.cutN)} hideTally />
          </g>
        )}
        {out < 1 && <BoardCarry f={f} />}
      </g>
    );
  }
  if (t < M.brd2) return <TC f={f} mode="F" cam={camTrial(f, M.cutF)} />;
  if (t < M.thr) return <TC f={f} mode="F" cam={camThrough(f)} />;
  const cam = camBoard(f);
  return (
    <g>
      <rect x={0} y={0} width={1920} height={1080} fill={K.paper} />
      <Cam x={cam.x} y={cam.y} z={cam.z}>
        <Board f={f} phase={2} />
      </Cam>
    </g>
  );
};
/** column 1's game group transform: from the trial camera (TC coords on screen) to its board slot */
const carryT = (f: number) => {
  const M = tm();
  const fly = easeInOut(pr(f, M.brd, M.brd + 0.45, (x) => x));
  const c0 = camTrial(Math.round(M.brd * FPS), M.cutN);
  const c = colT(0);
  return {tx: lerp(960 - c0.x * c0.z, c.x, fly), ty: lerp(540 - c0.y * c0.z, c.y, fly), sc: lerp(c0.z, GSC, fly)};
};
/** while the TC fades into the board, column 1's game is drawn on top (it is the carried element) */
const BoardCarry: React.FC<{f: number}> = ({f}) => {
  const t = f / FPS;
  const M = tm();
  const fly = easeInOut(pr(f, M.brd, M.brd + 0.45, (x) => x));
  const {tx, ty, sc} = carryT(f);
  return (
    <g transform={`translate(${fmt(tx)} ${fmt(ty)}) scale(${fmt(sc)})`}>
      <GameInset id={`ve-bc-${f}`} t={Math.min(t, M.brd + 0.5) + 100 - M.N.t0} events={[]} x={GAME.x} y={GAME.y} s={GAME.s} tag={1 - fly} />
      <TallyRows t={t} d={tallies(M)[0]} />
    </g>
  );
};

/** sound cues (gain in dB). coil_pulse has ONE gain everywhere: normal trials, the comparison and the flipped trial. */
export const CUES_VE = (): {t: number; kind: string; gain?: number; dur?: number}[] => {
  const M = tm();
  const PULSE = -4;
  const pS = T('Same pulse');
  const cues: {t: number; kind: string; gain?: number; dur?: number}[] = [
    {t: M.click, kind: 'tick', gain: -4},
    ...M.pops.map((p) => ({t: p, kind: 'pop', gain: -14})),
    // first trial (the apparatus)
    {t: M.e2.pulse - 0.32, kind: 'packet_arrive', gain: -14},
    {t: M.e2.pulse, kind: 'coil_pulse', gain: PULSE},
    {t: M.e2.tap, kind: 'pad_click', gain: -3},
    {t: M.e2.fire, kind: 'cannon', gain: -9},
    {t: M.e2.kill, kind: 'boom', gain: -10},
    // the flip
    {t: M.fs, kind: 'rotate', gain: -9},
    // the comparison: the same click, both halves at once
    {t: pS + 0.35, kind: 'coil_pulse', gain: PULSE},
    {t: T('couldn’t tell') - 0.6, kind: 'coil_pulse', gain: PULSE},
    {t: T('which way the coil') + 0.4, kind: 'coil_pulse', gain: PULSE},
    // coil in position, pair 1
    {t: M.N.t0, kind: 'rocket_launch', gain: -10},
    {t: M.N.pulse, kind: 'coil_pulse', gain: PULSE},
    {t: M.N.tap, kind: 'pad_click', gain: -3},
    {t: M.N.fire, kind: 'cannon', gain: -7},
    {t: M.N.kill, kind: 'boom', gain: -7},
    {t: M.P.t0, kind: 'plane_pass', gain: -14},
    {t: M.P.pulse, kind: 'coil_pulse', gain: PULSE},
    {t: M.P.tap, kind: 'pad_click', gain: -3},
    {t: M.P.fire, kind: 'cannon', gain: -8},
    {t: M.P.kill, kind: 'boom', gain: -9},
    // board: pair 2's fast game (quiet)
    ...[0, 1, 3].map((n) => ({t: M.brd + 0.35 + n * 0.38 + 0.85, kind: 'city_hit', gain: -16})),
    {t: M.brd + 0.35 + 2 * 0.38 + 0.4, kind: 'cannon', gain: -15},
    // coil flipped: the same launch, the same pulse at the same gain, no click, no cannon; the rocket hits
    {t: M.F.t0, kind: 'rocket_launch', gain: -10},
    {t: M.F.pulse, kind: 'coil_pulse', gain: PULSE},
    {t: M.F.arrive, kind: 'city_hit', gain: -4},
    // the flipped row
    ...[0, 1, 2].map((i) => ({t: M.nob + 0.05 + i * 0.25, kind: 'tick', gain: -13})),
    ...[0, 1, 2].map((i) => ({t: M.every - 0.75 + i * 0.18 + 0.85, kind: 'city_hit', gain: -15})),
  ];
  return cues.sort((a, b) => a.t - b.t);
};
