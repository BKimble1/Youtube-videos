// S5. The 2014 study and its flipped-coil control (PLOS ONE 2014; SOURCE_NOTES C12-C17).
//
// Beats (all times from the measured narration):
//  IN  hard cut from S4's deadpan: "2014", three NEW pairs pop in on "three pairs of volunteers" (sender with EEG
//      cap frame-left, receiver with headphones frame-right in a dark room); push in on pair 1's receiver.
//  CC  the control composition (cut on "This time"): frame-left, the receiver from behind in a dark room facing a
//      blank wall, neckband headphones, round coil on an articulated arm over the LEFT side of the head (frame-left);
//      frame-right, the orange-sleeved right hand resting just above a touchpad, with the sender's game as an inset.
//      One normal trial: rocket -> coil pulse -> wrist jerks up, then down onto the pad (click) -> cannon -> rocket
//      destroyed. Push in on the coil: it turns 180 deg about its handle (grey back face to the head). Pull back:
//      same game, same pulse strength (fixed dial), the participants couldn't tell.
//  RB  results board, coil in position: pair 1 hits 5 of 6 rockets AND 3 of 8 friendly planes (a replay shows a
//      plane shot down by mistake); pair 2 hits 1 of 4 rockets (Table 2: 83.33 / 37.5 and 25 %).
//  CC  the SAME composition again, coil flipped: same rocket timing, same coil_pulse at the same gain, the hand stays
//      still through the 2.2 s silence, the rocket hits the city.
//  TB  tally, coil flipped: 0 presses for each of the three pairs, every rocket through; push in on pair 1's pad
//      until its surface fills x 760..1160, y 380..640 on the last frame (S6 opens on a block with that box).
import React from 'react';
import {clamp, easeIn, easeInOut, easeOut, fmt, lerp} from '../dc/math';
import {lit, mix, shade} from '../dc/color';
import {FPS, T, TE, pr} from '../lib/core';
import {GameScreen, GEvent, arcPt, evState} from '../art/game';
import {HandPoseP, indexTip, mixP, SideHand} from '../art/hand';
import {Cam, FONT_HEAD, INK, K, Label, Tag, Touchpad} from '../art/kit';
import {CrewChar, IDLE, Look} from '../art/crew';
import {EEGCap, Headphones, V14} from '../art/people';
import {BackHead, Burst, Chair, CoilArm, FlatPad, MiniCity, PlaneIcon, RedX, RocketIcon, S5Coil, TmsBox} from '../art/s5parts';

// ---------------------------------------------------------------- timing (seconds, from the words)
const DUR = 3.4; // rocket flight in the trial composition
const LEAD = 0.25; // composition cut -> rocket launch
const TO_PULSE = 1.8; // rocket launch -> coil pulse
const TO_CLICK = 0.22; // pulse -> fingertip on the pad
const tm = () => {
  const start = T('A year later') - 0.55;
  const cutN = T('This time the') - 0.14; // normal trial composition
  const cutR = T('coil in position') - 0.78; // results board
  const cutF = TE('only one in four') + 0.06; // flipped trial composition (identical)
  const cutT = T('Across all three pairs') + 0.15; // tally
  const end = T('Then the researchers gave') - 0.5;
  const trial = (cut: number) => {
    const t0 = cut + LEAD;
    const pulse = t0 + TO_PULSE;
    return {t0, pulse, click: pulse + TO_CLICK, fire: pulse + TO_CLICK + 0.05, arrive: t0 + DUR};
  };
  return {start, cutN, cutR, cutF, cutT, end, N: trial(cutN), F: trial(cutF)};
};

// ---------------------------------------------------------------- the control composition (CC)
const HX = 470, HY = 455; // receiver's head (back view)
const COIL = {x: 389, y: 303, ang: -28, s: 0.72};
const SCALP = {x: 412, y: 338};
const PAD = {x: 1250, y: 835, s: 1.1};
const HS = 1.3;
const GAME = {x: 1150, y: 74, s: 0.86};
const REST: HandPoseP = {wrist: -5, idx: [8, 10, 6], curl: 0.2, thumb: 0.38};
const UP: HandPoseP = {wrist: -20, idx: [-4, 8, 4], curl: 0.26, thumb: 0.36};
const DOWN: HandPoseP = {wrist: 11, idx: [14, 14, 8], curl: 0.3, thumb: 0.42};
const PAD_TOP = PAD.y - 55 * PAD.s; // middle of the pad surface (y)
const DOWN_TIP = indexTip(DOWN, -1, HS);
const WRIST = {x: PAD.x - 40 - DOWN_TIP.x, y: PAD_TOP - 17 - DOWN_TIP.y};

/** the involuntary up-down jerk around a pulse time (null: no response) */
const jerk = (t: number, pulse: number | null): {pose: HandPoseP; press: number; rs: number} => {
  if (pulse === null) return {pose: REST, press: 0, rs: 0};
  const d = t - pulse;
  const c = TO_CLICK;
  if (d < 0.02 || d > 0.95) return {pose: REST, press: 0, rs: 0};
  if (d < 0.12) return {pose: mixP(REST, UP, easeOut((d - 0.02) / 0.1)), press: 0, rs: 10 * easeOut((d - 0.02) / 0.1)};
  if (d < c) return {pose: mixP(UP, DOWN, easeIn((d - 0.12) / (c - 0.12))), press: 0, rs: 10 * (1 - (d - 0.12) / (c - 0.12))};
  if (d < c + 0.14) return {pose: DOWN, press: 1 - (d - c) / 0.14, rs: 0};
  return {pose: mixP(DOWN, REST, easeInOut(clamp((d - c - 0.14) / 0.55))), press: 0, rs: 0};
};
/** pulse envelope (fast attack, short decay) */
const env = (t: number, p: number) => (t < p ? 0 : t < p + 0.04 ? (t - p) / 0.04 : Math.max(0, 1 - (t - p - 0.04) / 0.42));

const LeftPanel: React.FC<{t: number; flip: number; pulse: number; active: boolean; axisK: number; rs: number}> = ({t, flip, pulse, active, axisK, rs}) => {
  const click = pulse; // the sound mark: identical for both coil positions
  return (
    <g>
      <defs>
        <radialGradient id="s5-wall" cx="0.52" cy="0.36" r="0.75">
          <stop offset="0" stopColor="#4C5E6F" />
          <stop offset="0.55" stopColor="#334250" />
          <stop offset="1" stopColor="#1C2630" />
        </radialGradient>
      </defs>
      <rect x={-400} y={-200} width={1310} height={1500} fill="url(#s5-wall)" />
      {/* the stand and stimulator (behind the person, frame left) */}
      <CoilArm base={{x: 64, y: 1100}} j1={{x: 64, y: 300}} j2={{x: 150, y: 196}} end={{x: 205, y: 401}} />
      <path d={`M150,760 C120,600 120,520 186,420`} fill="none" stroke={INK} strokeWidth={12} strokeLinecap="round" />
      <path d={`M150,760 C120,600 120,520 186,420`} fill="none" stroke="#2D363D" strokeWidth={6} strokeLinecap="round" />
      <BackHead hx={HX} hy={HY} rs={rs} glow={active ? env(t, pulse) : 0} gx={SCALP.x} gy={SCALP.y} />
      <Chair hx={HX} hy={HY} />
      <TmsBox x={16} y={720} lv={env(t, pulse) > 0 ? 1 : 0} />
      <S5Coil x={COIL.x} y={COIL.y} s={COIL.s} ang={COIL.ang} flip={flip} pulse={env(t, pulse)} axisK={axisK} />
      {/* the click (same sound, same level, whichever way the coil faces) */}
      {(() => {
        const k = (t - click) / 0.4;
        if (k < 0 || k > 1) return null;
        return (
          <g opacity={1 - k} fill="none" stroke={K.cream} strokeWidth={7} strokeLinecap="round">
            {[0, 1, 2].map((i) => {
              const r = 40 + i * 26 + 30 * k;
              return <path key={i} d={`M${fmt(260 - r * 0.5)},${fmt(170 - r * 0.2)} A${fmt(r)} ${fmt(r)} 0 0 1 ${fmt(260 + r * 0.3)},${fmt(170 - r * 0.62)}`} transform="translate(30 0)" />;
            })}
          </g>
        );
      })()}
    </g>
  );
};

const RightPanel: React.FC<{t: number; events: GEvent[]; cityHitAt?: number; pose: HandPoseP; press: number; gameHi: number; glow: number}> = ({t, events, cityHitAt, pose, press, gameHi, glow}) => (
  <g>
    <defs>
      <linearGradient id="s5-rwall" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#24303B" />
        <stop offset="1" stopColor="#2E3B47" />
      </linearGradient>
      <radialGradient id="s5-pool" cx="0.5" cy="0.3" r="0.7">
        <stop offset="0" stopColor="#6E6258" />
        <stop offset="1" stopColor="#3A3632" />
      </radialGradient>
    </defs>
    <rect x={924} y={-200} width={1400} height={850} fill="url(#s5-rwall)" />
    <rect x={924} y={640} width={1400} height={700} fill="url(#s5-pool)" />
    <rect x={924} y={640} width={1400} height={10} fill="#7D7064" />
    {/* the sender's game (an inset: the receiver never sees it) */}
    <g>
      {cityHitAt !== undefined && t > cityHitAt && t < cityHitAt + 0.9 && (
        <rect x={GAME.x - 22} y={GAME.y - 22} width={640 * GAME.s + 44} height={400 * GAME.s + 44} rx={24} fill="none" stroke={K.coral} strokeWidth={10} opacity={1 - (t - cityHitAt) / 0.9} />
      )}
      {gameHi > 0.001 && <rect x={GAME.x - 26} y={GAME.y - 26} width={640 * GAME.s + 52} height={400 * GAME.s + 52} rx={26} fill={K.saffron} opacity={0.55 * gameHi} />}
      <rect x={GAME.x - 12} y={GAME.y - 12} width={640 * GAME.s + 24} height={400 * GAME.s + 24} rx={16} fill={K.cream} stroke={INK} strokeWidth={6} />
      <defs>
        <clipPath id="s5-gclip">
          <rect x={GAME.x} y={GAME.y} width={640 * GAME.s} height={400 * GAME.s} rx={6} />
        </clipPath>
      </defs>
      <g clipPath="url(#s5-gclip)">
        <g transform={`translate(${GAME.x} ${GAME.y}) scale(${GAME.s})`}>
          <GameScreen t={t} events={events} cityHitAt={cityHitAt} />
        </g>
      </g>
      <rect x={GAME.x} y={GAME.y} width={640 * GAME.s} height={400 * GAME.s} rx={6} fill="none" stroke={INK} strokeWidth={4} />
      <Tag x={GAME.x + 130} y={GAME.y - 10} text="Sender's game" size={30} />
    </g>
    {/* the touchpad and the resting right hand */}
    <Touchpad x={PAD.x} y={PAD.y} s={PAD.s} press={press} glow={glow} />
    <SideHand id="s5h" x={WRIST.x} y={WRIST.y} s={HS} dir={-1} side="thumb" pose={pose} skin={K.r14Skin} sleeve={K.r14Sleeve} arm={380} armAng={7} />
    {press > 0 && (
      <g opacity={press} stroke={K.saffron} strokeWidth={8} strokeLinecap="round">
        <path d={`M${PAD.x - 150},${PAD_TOP - 10} l-34,-10`} />
        <path d={`M${PAD.x - 130},${PAD_TOP - 46} l-26,-26`} />
        <path d={`M${PAD.x + 70},${PAD_TOP + 8} l34,-4`} />
      </g>
    )}
  </g>
);

/** the CC frame. `which`: the normal or the flipped trial (identical layout and timing relative to the cut). */
const ControlComp: React.FC<{f: number; which: 'N' | 'F'}> = ({f, which}) => {
  const t = f / FPS;
  const M = tm();
  const tr = which === 'N' ? M.N : M.F;
  // the coil turns over on "quietly flipped the coil over" (and stays flipped)
  const fs = T('flipped the coil over') - 0.05;
  const flip = which === 'F' ? 1 : pr(f, fs, fs + 1.25);
  const axisK = which === 'N' ? pr(f, fs - 0.45, fs - 0.1) * (1 - pr(f, fs + 1.5, fs + 1.9)) : 0;
  const respond = which === 'N';
  const j = jerk(t, respond ? tr.pulse : null);
  const events: GEvent[] = [{kind: 'rocket', t0: tr.t0, dur: DUR, fire: respond ? tr.fire : undefined}];
  if (which === 'N') events.push({kind: 'plane', t0: T('Same game') - 0.9, dur: 3.2});
  // camera (normal composition only; the flipped trial never moves)
  let cam = {x: 960, y: 540, z: 1};
  if (which === 'N') {
    const a = pr(f, T('In some rounds') + 0.05, T('In some rounds') + 1.1);
    const b = pr(f, T('Same game') - 0.25, T('Same game') + 0.5);
    const k = a * (1 - b);
    const z = Math.exp(lerp(0, Math.log(2.1), k));
    // keep the coil's screen path straight while the zoom grows
    const sx = lerp(COIL.x, 850, k), sy = lerp(COIL.y, 440, k);
    cam = {x: COIL.x - (sx - 960) / z, y: COIL.y - (sy - 540) / z, z};
  }
  const pulseT = tr.pulse;
  const tags = which === 'N'
    ? (
      <g>
        <Tag x={1040} y={700} text="Touchpad" size={34} k={pr(f, T('touchpad') - 1.0, T('touchpad') - 0.7) * (1 - pr(f, pulseT - 0.35, pulseT - 0.1))} />
        <Tag x={300} y={150} text="Flipped over" size={34} k={pr(f, fs + 0.8, fs + 1.1) * (1 - pr(f, T('Same game') - 0.3, T('Same game')))} />
        <Tag x={GAME.x + 275} y={GAME.y + 400 * GAME.s + 52} text="Same game" size={36} k={pr(f, T('Same game') - 0.05, T('Same game') + 0.25) * (1 - pr(f, T('Same pulse') - 0.1, T('Same pulse') + 0.2))} />
        <Tag x={220} y={680} text="Same pulse strength" size={34} k={pr(f, T('Same pulse') - 0.05, T('Same pulse') + 0.25) * (1 - pr(f, T('Even the participants') - 0.2, T('Even the participants') + 0.1))} />
        <Tag x={500} y={120} text="Couldn't tell which way" size={36} k={pr(f, T('couldn’t tell') - 0.25, T('couldn’t tell') + 0.1) * (1 - pr(f, M.cutR - 0.35, M.cutR - 0.05))} />
      </g>
    )
    : <Tag x={500} y={120} text="Coil flipped" size={36} fill="#D5DBE0" k={pr(f, T('coil flipped') - 0.25, T('coil flipped') + 0.1)} />;
  const dialHi = which === 'N' ? pr(f, T('Same pulse') - 0.05, T('Same pulse') + 0.25) * (1 - pr(f, T('Even the participants') - 0.2, T('Even the participants') + 0.1)) : 0;
  const gameHi = which === 'N' ? pr(f, T('Same game') - 0.05, T('Same game') + 0.25) * (1 - pr(f, T('Same pulse') - 0.1, T('Same pulse') + 0.2)) : 0;
  return (
    <Cam x={cam.x} y={cam.y} z={cam.z}>
      <LeftPanel t={t} flip={flip} pulse={pulseT} active={flip < 0.5} axisK={axisK} rs={j.rs} />
      {dialHi > 0.001 && <rect x={4} y={708} width={254} height={174} rx={24} fill="none" stroke={K.saffron} strokeWidth={8} opacity={dialHi} />}
      <RightPanel t={t} events={events} cityHitAt={respond ? undefined : tr.arrive} pose={j.pose} press={j.press} gameHi={gameHi} glow={0} />
      {/* the gutter between the two views */}
      <rect x={900} y={-300} width={24} height={1700} fill={INK} />
      {tags}
    </Cam>
  );
};

// ---------------------------------------------------------------- intro: three new pairs (IN)
const PAIRS: {send: Look; recv: Look; color: string}[] = [
  {send: V14.send1, recv: V14.recv1, color: V14.recv1.shirt},
  {send: V14.send2, recv: V14.recv2, color: V14.recv2.shirt},
  {send: V14.send3, recv: V14.recv3, color: V14.recv3.shirt},
];
const IN_CX = [330, 960, 1590];
const Intro: React.FC<{f: number}> = ({f}) => {
  const t = f / FPS;
  const tp = T('three pairs of volunteers');
  const push = easeIn(pr(f, TE('volunteers') - 0.25, T('This time the') - 0.14, (x) => x));
  const cam = {x: lerp(960, IN_CX[0] + 130, push), y: lerp(540, 420, push), z: Math.exp(lerp(0, Math.log(2.6), push))};
  return (
    <g>
      <rect x={0} y={0} width={1920} height={1080} fill={K.paper} />
      <Cam x={cam.x} y={cam.y} z={cam.z}>
        {IN_CX.map((c, i) => {
          const k = pr(f, tp + i * 0.28, tp + i * 0.28 + 0.3, easeOut);
          const p = PAIRS[i];
          return (
            <g key={i}>
              <rect x={c - 276} y={176} width={560} height={600} rx={30} fill={INK} opacity={0.12} />
              <defs>
                <clipPath id={`s5-card${i}`}>
                  <rect x={c - 280} y={170} width={560} height={600} rx={30} />
                </clipPath>
              </defs>
              <g clipPath={`url(#s5-card${i})`}>
                <rect x={c - 280} y={170} width={280} height={600} fill={K.raoWall} />
                <rect x={c - 280} y={640} width={280} height={130} fill="#C9BBA3" />
                <rect x={c} y={170} width={280} height={600} fill="#33414E" />
                <rect x={c} y={640} width={280} height={130} fill="#2A333B" />
                {k > 0.001 && (
                  <g opacity={clamp(k * 1.5)}>
                    <g transform={`translate(${c - 136} 742) scale(${fmt(0.82 + 0.18 * k)}) translate(${-(c - 136)} -742)`}>
                      <CrewChar id={`s5s${i}`} look={p.send} pose={{...IDLE, lookX: 0.5}} frame={f} seed={11 + i} x={c - 136} y={742} scale={0.92} headGear={<EEGCap />} />
                    </g>
                    <g transform={`translate(${c + 136} 742) scale(${fmt(0.82 + 0.18 * k)}) translate(${-(c + 136)} -742)`}>
                      <CrewChar id={`s5r${i}`} look={p.recv} pose={{...IDLE, lookX: -0.5}} frame={f} seed={21 + i} x={c + 136} y={742} scale={0.92} headGear={<Headphones color="#7D8B97" />} />
                    </g>
                  </g>
                )}
                <rect x={c - 5} y={170} width={10} height={600} fill={INK} />
                <text x={c - 140} y={222} textAnchor="middle" fontFamily={FONT_HEAD} fontWeight={600} fontSize={30} fill={INK} opacity={0.7}>Sender</text>
                <text x={c + 140} y={222} textAnchor="middle" fontFamily={FONT_HEAD} fontWeight={600} fontSize={30} fill="#E9EDF0" opacity={0.8}>Receiver</text>
              </g>
              <rect x={c - 280} y={170} width={560} height={600} rx={30} fill="none" stroke={INK} strokeWidth={6} />
              <Tag x={c} y={820} text={`Pair ${i + 1}`} size={36} fill={lit(p.color, 0.25)} k={k} />
            </g>
          );
        })}
        <Tag x={960} y={96} text="2014 · three new pairs" size={46} k={pr(f, T('A year later') - 0.1, T('A year later') + 0.25)} />
      </Cam>
      {t < 0 && null}
    </g>
  );
};

// ---------------------------------------------------------------- boards (RB, TB)
const CoilIcon: React.FC<{x: number; y: number; flip: number}> = ({x, y, flip}) => (
  <g>
    <path d={`M${x - 46},${y + 52} A46 46 0 0 1 ${x + 46},${y + 52} Z`} fill={K.r14Skin} stroke={INK} strokeWidth={5} />
    <path d={`M${x - 46},${y + 52} A46 46 0 0 1 ${x + 46},${y + 52}`} fill="none" stroke="#2B1A10" strokeWidth={14} transform={`translate(0 2)`} opacity={0.9} />
    <S5Coil x={x + 10} y={y - 18} s={0.34} ang={0} flip={flip} />
  </g>
);

const Replay: React.FC<{x: number; y: number; s: number; t: number; events: GEvent[]; cityHitAt?: number; id: string}> = ({x, y, s, t, events, cityHitAt, id}) => (
  <g>
    <rect x={x - 8} y={y - 8} width={640 * s + 16} height={400 * s + 16} rx={14} fill={K.cream} stroke={INK} strokeWidth={5} />
    <defs>
      <clipPath id={id}>
        <rect x={x} y={y} width={640 * s} height={400 * s} rx={6} />
      </clipPath>
    </defs>
    <g clipPath={`url(#${id})`}>
      <g transform={`translate(${x} ${y}) scale(${s})`}>
        <GameScreen t={t} events={events} cityHitAt={cityHitAt} />
      </g>
    </g>
    <rect x={x} y={y} width={640 * s} height={400 * s} rx={6} fill="none" stroke={INK} strokeWidth={3.5} />
  </g>
);

const RB_R1 = 340, RB_R2 = 670; // row centres
const RS = 0.6; // replay scale
const rbReplay = (a: number): GEvent[] => [
  {kind: 'rocket', t0: a - 1.25, dur: 1.7, fire: a - 0.25},
  {kind: 'plane', t0: a - 0.55, dur: 1.7},
  {kind: 'rocket', t0: a + 0.05, dur: 1.7, fire: a + 1.0},
  {kind: 'plane', t0: a + 0.65, dur: 1.7, fire: a + 1.55},
];
const RB1_ROCKET_MISS = 3; // the one rocket of six that got through
const RB1_PLANE_HITS = [1, 4, 6]; // three of eight friendly planes hit by mistake
const RB2_ROCKET_HIT = 2; // one of four

const ResultsBoard: React.FC<{f: number}> = ({f}) => {
  const t = f / FPS;
  const M = tm();
  const a = T('one pair hit about') + 0.1;
  const rk = [0, 1, 2, 3, 4, 5].map((i) => lerp(a, a + 1.5, i / 5));
  const pl = [0, 1, 2, 3, 4, 5, 6, 7].map((i) => lerp(a + 0.3, a + 1.9, i / 7));
  const c2 = T('Another hit only');
  const rk2 = [0, 1, 2, 3].map((i) => lerp(c2 + 0.35, TE('one in four') - 0.25, i / 3));
  const row2 = pr(f, c2 - 0.25, c2 + 0.1, easeOut);
  // replays (game time = film time): two rockets shot down, one plane let through, one plane shot by mistake
  const r1 = rbReplay(a);
  const planeHit = evState(r1[3], t);
  const hp = arcPt(planeHit.uHit);
  const oops = pr(f, r1[3].fire! + 0.32, r1[3].fire! + 0.55, easeOut);
  const r2: GEvent[] = [{kind: 'rocket', t0: c2 - 0.1, dur: 1.45}];
  const r2hit = c2 - 0.1 + 1.45;
  const resolve = (tt: number) => clamp((t - tt) / 0.18);
  return (
    <g>
      <rect x={0} y={0} width={1920} height={1080} fill={K.paper} />
      <CoilIcon x={690} y={74} flip={0} />
      <Tag x={1000} y={92} text="Coil in position" size={44} fill={lit(K.saffron, 0.5)} />
      {/* row 1: pair 1 */}
      <rect x={70} y={RB_R1 - 150} width={1780} height={300} rx={28} fill={K.cream} stroke={INK} strokeWidth={5} />
      <Tag x={190} y={RB_R1} text="Pair 1" size={40} fill={lit(PAIRS[0].color, 0.25)} />
      <Replay id="s5-rp1" x={330} y={RB_R1 - 120} s={RS} t={t} events={r1} />
      {oops > 0.001 && (
        <g>
          <g transform={`translate(330 ${RB_R1 - 120}) scale(${RS})`}>
            <RedX x={hp.x} y={hp.y} r={30} k={oops} />
          </g>
          <Tag x={330 + hp.x * RS} y={RB_R1 - 120 + hp.y * RS - 46} text="Friendly plane!" size={28} fill="#F7C9C0" k={oops} />
        </g>
      )}
      {rk.map((tt, i) => {
        const x = 830 + i * 92, y = RB_R1 - 52;
        const k = resolve(tt);
        const hit = i !== RB1_ROCKET_MISS;
        return (
          <g key={`r${i}`}>
            <RocketIcon x={x} y={y} s={0.95} op={hit ? 0.35 + 0.65 * (1 - k) : 0.35 + 0.65 * k} />
            {hit && <Burst x={x - 6} y={y} r={34} k={k} />}
          </g>
        );
      })}
      <Label x={1380} y={RB_R1 - 38} text="Rockets hit: 5 of 6" size={46} anchor="start" k={pr(f, rk[5] - 0.1, rk[5] + 0.2)} />
      {pl.map((tt, i) => {
        const x = 826 + i * 66, y = RB_R1 + 66;
        const k = resolve(tt);
        const hit = RB1_PLANE_HITS.includes(i);
        return (
          <g key={`p${i}`}>
            <PlaneIcon x={x} y={y} s={0.82} op={0.35 + 0.65 * k} />
            {hit && <RedX x={x} y={y} r={20} k={k} />}
          </g>
        );
      })}
      <Label x={1380} y={RB_R1 + 82} text="Planes hit: 3 of 8" size={46} color="#B23A2A" anchor="start" k={pr(f, pl[7] - 0.1, pl[7] + 0.2)} />
      {/* row 2: pair 2 */}
      {row2 > 0.001 && (
        <g opacity={clamp(row2 * 1.4)} transform={`translate(0 ${fmt(30 * (1 - row2))})`}>
          <rect x={70} y={RB_R2 - 150} width={1780} height={300} rx={28} fill={K.cream} stroke={INK} strokeWidth={5} />
          <Tag x={190} y={RB_R2} text="Pair 2" size={40} fill={lit(PAIRS[1].color, 0.25)} />
          <Replay id="s5-rp2" x={330} y={RB_R2 - 120} s={RS} t={t} events={r2} cityHitAt={r2hit} />
          {rk2.map((tt, i) => {
            const x = 830 + i * 92, y = RB_R2;
            const k = resolve(tt);
            const hit = i === RB2_ROCKET_HIT;
            return (
              <g key={`q${i}`}>
                <RocketIcon x={x} y={y} s={0.95} op={hit ? 0.35 + 0.65 * (1 - k) : 0.35 + 0.65 * k} />
                {hit && <Burst x={x - 6} y={y} r={34} k={k} />}
              </g>
            );
          })}
          <Label x={1380} y={RB_R2 + 16} text="Rockets hit: 1 of 4" size={46} anchor="start" k={pr(f, rk2[3] - 0.1, rk2[3] + 0.2)} />
        </g>
      )}
    </g>
  );
};

// tally board geometry: pad i surface (world). The push-in ends with pad 0 at x 760..1160, y 380..640.
const TB_CX = [400, 960, 1520];
const TPAD = {w: 200, h: 130, y: 300};
const TallyBoard: React.FC<{f: number}> = ({f}) => {
  const t = f / FPS;
  const M = tm();
  const nob = T('nobody pressed');
  const every = T('Every rocket got');
  // push in on pair 1's pad: pad centre (400, 365) -> screen (960, 510) at zoom 2
  const pk = pr(f, TE('got through') - 0.02, M.end - 0.1, easeInOut);
  const pc = {x: TB_CX[0], y: TPAD.y + TPAD.h / 2};
  const zEnd = 400 / TPAD.w;
  const z = Math.exp(lerp(0, Math.log(zEnd), pk));
  // keep the pad's screen path straight: interpolate the pad's SCREEN centre, derive the camera from it
  const sx = lerp(960 + (pc.x - 960), 960, pk), sy = lerp(540 + (pc.y - 540), 510, pk);
  const cam = {x: pc.x - (sx - 960) / z, y: pc.y - (sy - 540) / z, z};
  const fade = 1 - pr(f, TE('got through') - 0.02, TE('got through') + 0.6);
  return (
    <g>
      <rect x={0} y={0} width={1920} height={1080} fill={K.paper} />
      <Cam x={cam.x} y={cam.y} z={cam.z}>
        <g opacity={fade}>
          <CoilIcon x={700} y={74} flip={1} />
          <Tag x={990} y={92} text="Coil flipped" size={44} fill="#D5DBE0" />
        </g>
        {TB_CX.map((c, i) => {
          const k = pr(f, M.cutT + i * 0.22, M.cutT + i * 0.22 + 0.3, easeOut);
          const z0 = pr(f, nob + 0.1 + i * 0.3, nob + 0.4 + i * 0.3, easeOut);
          const st = pr(f, every + 0.15 + i * 0.25, every + 0.45 + i * 0.25, easeOut);
          const pad = (
            <FlatPad x={c - TPAD.w / 2} y={TPAD.y} w={TPAD.w} h={TPAD.h} shadow={i === 0 ? 1 - pk : 1} />
          );
          // a stream of rockets into the city (no count implied), from the column's left
          const rockets: React.ReactNode[] = [];
          const city = {x: c + 96, y: 780};
          let hit = 0;
          for (let n = 0; n < 6; n++) {
            const l0 = M.cutT + 0.5 + i * 0.37 + n * 0.95;
            const u = (t - l0) / 1.1;
            if (u >= 0 && u < 1) {
              const p0 = {x: c - 215, y: 720}, p1 = {x: c - 70, y: 560}, p2 = {x: city.x + 22, y: city.y - 84};
              const q = (uu: number) => ({x: (1 - uu) ** 2 * p0.x + 2 * uu * (1 - uu) * p1.x + uu * uu * p2.x, y: (1 - uu) ** 2 * p0.y + 2 * uu * (1 - uu) * p1.y + uu * uu * p2.y});
              const P0 = q(u), P1 = q(Math.min(1, u + 0.02));
              rockets.push(<RocketIcon key={n} x={P0.x} y={P0.y} s={0.85} a={(Math.atan2(P1.y - P0.y, P1.x - P0.x) * 180) / Math.PI} />);
            }
            const h = (t - (l0 + 1.1)) / 0.9;
            if (h >= 0 && h < 1) hit = h;
          }
          return (
            <g key={i}>
              <g opacity={(i === 0 ? 1 : fade) * clamp(k * 1.4)}>
                <g opacity={i === 0 ? fade : 1}>
                  <rect x={c - 255} y={160} width={510} height={700} rx={30} fill={K.cream} stroke={INK} strokeWidth={5} />
                  <Tag x={c} y={220} text={`Pair ${i + 1}`} size={38} fill={lit(PAIRS[i].color, 0.25)} />
                  <Label x={c} y={530} text="0 presses" size={56} k={z0} weight={700} />
                  <MiniCity x={city.x} y={city.y} s={1.22} hit={hit} />
                  {rockets}
                  <Label x={c} y={836} text="Rockets stopped: 0" size={38} k={st} color="#B23A2A" />
                </g>
                {pad}
              </g>
            </g>
          );
        })}
      </Cam>
    </g>
  );
};

// ---------------------------------------------------------------- the sequence
export const S5: React.FC<{f: number}> = ({f}) => {
  const t = f / FPS;
  const M = tm();
  if (t < M.cutN) return <Intro f={f} />;
  if (t < M.cutR) return <ControlComp f={f} which="N" />;
  if (t < M.cutF) return <ResultsBoard f={f} />;
  if (t < M.cutT) return <ControlComp f={f} which="F" />;
  return <TallyBoard f={f} />;
};

/** Sound cues for the mix. coil_pulse has the SAME gain in the normal and the flipped trial. */
export const CUES_S5 = (): {t: number; kind: string; gain?: number}[] => {
  const M = tm();
  const PULSE_GAIN = 0.9;
  const a = T('one pair hit about') + 0.1;
  const c2 = T('Another hit only');
  const fs = T('flipped the coil over') - 0.05;
  const cues: {t: number; kind: string; gain?: number}[] = [
    {t: T('A year later') - 0.05, kind: 'pop', gain: 0.5},
    ...[0, 1, 2].map((i) => ({t: T('three pairs of volunteers') + i * 0.28, kind: 'pop', gain: 0.35})),
    {t: TE('volunteers') - 0.2, kind: 'whoosh', gain: 0.35},
    // normal trial (coil in position)
    {t: M.N.t0, kind: 'rocket_launch', gain: 0.6},
    {t: M.N.pulse, kind: 'coil_pulse', gain: PULSE_GAIN},
    {t: M.N.click, kind: 'pad_click', gain: 0.9},
    {t: M.N.fire, kind: 'cannon', gain: 0.7},
    {t: M.N.fire + 0.32, kind: 'boom', gain: 0.7},
    // the flip and the explanations
    {t: fs, kind: 'flip', gain: 0.6},
    {t: T('Same game') - 0.1, kind: 'plane_pass', gain: 0.4},
    // results board (coil in position): replay sounds, quieter
    {t: M.cutR + 0.05, kind: 'pop', gain: 0.4},
    ...rbReplay(a).filter((e) => e.fire !== undefined).flatMap((e) => [
      {t: e.fire!, kind: 'cannon', gain: 0.45},
      {t: e.fire! + 0.32, kind: 'boom', gain: 0.45},
    ]),
    {t: a - 0.55, kind: 'plane_pass', gain: 0.3},
    {t: c2 - 0.25, kind: 'pop', gain: 0.35},
    {t: c2 - 0.1 + 1.45, kind: 'city_hit', gain: 0.45},
    // flipped trial: identical timing; the same pulse at the same gain; no click, no cannon
    {t: M.F.t0, kind: 'rocket_launch', gain: 0.6},
    {t: M.F.pulse, kind: 'coil_pulse', gain: PULSE_GAIN},
    {t: M.F.arrive, kind: 'city_hit', gain: 0.8},
    // tally
    {t: M.cutT + 0.05, kind: 'pop', gain: 0.4},
    ...[0, 1, 2].map((i) => ({t: T('nobody pressed') + 0.1 + i * 0.3, kind: 'tick', gain: 0.4})),
    ...[0, 1, 2].map((i) => ({t: M.cutT + 0.5 + i * 0.37 + 1.1, kind: 'city_hit', gain: 0.25})),
    {t: TE('got through') - 0.02, kind: 'whoosh', gain: 0.3},
  ];
  return cues.sort((p, q) => p.t - q.t);
};
