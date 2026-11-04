// S7 ending: back to the film's first composition (S1 at frame 0: the two lab windows side by side, Rao frame left,
// Stocco frame right, composed through Campus at campusCam(0)). Stocco's panel is a copy of S1's StoccoPanel with the
// hand's pose and placement opened up (S1Hook.tsx is shared and not edited), so the hand can do two different things:
//  1. "the pulse helped decide when somebody else's hand moved": a saffron pulse at the wrist, the involuntary
//     up-and-down strike on the space bar (S1's tapPose), the cannon fires on Rao's screen and the rocket is hit;
//  2. "a pulse could give you advice ... decide the other guy was wrong": one brief, soft arc over the hand while a
//     friendly supply plane crosses Rao's screen; the finger lifts, then the hand calmly draws back off the keyboard
//     and lies flat on the desk. The cannon stays quiet, the plane lands safely, and the two hands hold, both at rest.
import React from 'react';
import {clamp, easeInOut, lerp} from '../dc/math';
import {lit, shade} from '../dc/color';
import {FPS, T, wi} from '../lib/core';
import {GEvent} from '../art/game';
import {FLAT, HandPoseP, HOVER, mixP, SideHand} from '../art/hand';
import {Cam, INK, K, Keyboard} from '../art/kit';
import {SoftArc} from '../art/s6world';
import {Campus, campusCam, PH, PW, RaoPanel, STOCCO_WRIST, tapPose} from './S1Hook';

const pr = (t: number, a: number, b: number) => easeInOut(clamp((t - a) / (b - a || 1e-6)));
const win = (t: number, a: number, b: number, c: number, d: number) => pr(t, a, b) * (1 - pr(t, c, d));

// copied from S1Hook (not exported there): the desk room and the keyboard placement
const KB = {x: 430, y: 862, s: 1.45};
const HS = 1.72;
const DeskRoom: React.FC<{id: string; wall: string; wallDeep: string; top?: string}> = ({id, wall, wallDeep, top = K.deskTop}) => (
  <g>
    <defs>
      <linearGradient id={`${id}-wall`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={lit(wall, 0.2)} />
        <stop offset="1" stopColor={wall} />
      </linearGradient>
      <linearGradient id={`${id}-top`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={shade(top, 0.12)} />
        <stop offset="1" stopColor={lit(top, 0.1)} />
      </linearGradient>
    </defs>
    <rect x={0} y={0} width={PW} height={PH} fill={`url(#${id}-wall)`} />
    <rect x={0} y={440} width={PW} height={28} fill={wallDeep} />
    <path d={`M-40,480 L${PW + 40},480 L${PW + 40},${PH} L-40,${PH} Z`} fill={`url(#${id}-top)`} stroke={INK} strokeWidth={6} />
    <path d={`M-40,480 L${PW + 40},480`} stroke={lit(top, 0.35)} strokeWidth={8} />
  </g>
);

export const endTimes = () => {
  const cut = T('Go back to that finger') - 0.06;
  const pulse = T('the pulse helped') + 0.05;
  const tap = pulse + 0.55; // S1's tapPose lifts 0.55 s before contact: the lift starts on the pulse
  const plane0 = T('Six years later') - 0.25;
  const advice = T('a pulse could give') + 0.3;
  const decide = T('And you could decide');
  const rise = decide + 0.12;
  const settle0 = rise + 0.5, settle1 = settle0 + 1.35;
  const lastWord = T('wrong', wi('the other guy was'));
  return {cut, pulse, tap, plane0, advice, rise, settle0, settle1, lastWord};
};

const RAISE: HandPoseP = {wrist: -9, idx: [-12, 8, 4], curl: 0.38, thumb: 0.42};
/** Stocco's hand at time t: pose, wrist offset, contact shadow */
const handAt = (t: number) => {
  const e = endTimes();
  if (t < e.rise) return {pose: tapPose(t, [e.tap]), dx: 0, dy: 0, contact: 0};
  const r = pr(t, e.rise, e.settle0);
  const s = pr(t, e.settle0, e.settle1);
  const pose = s > 0 ? mixP(RAISE, FLAT, s) : mixP(HOVER, RAISE, r);
  // the hand draws back off the keys (toward the body) and lifts clear of the keyboard and settles flat on the desk behind it: plainly not pressing, fully in frame
  return {pose, dx: lerp(0, 90, s), dy: lerp(-10 * r, -185, s), contact: s};
};

const S7StoccoPanel: React.FC<{f: number}> = ({f}) => {
  const t = f / FPS;
  const e = endTimes();
  const h = handAt(t);
  const press = t >= e.tap && t < e.tap + 0.12 ? 1 - (t - e.tap) / 0.12 : 0;
  const k = (t - e.tap) / 0.35;
  return (
    <g>
      <DeskRoom id="s7sto" wall={K.stoccoWall} wallDeep={K.stoccoWallDeep} top="#D9A773" />
      <rect x={560} y={150} width={150} height={190} rx={8} fill="#F8EEDC" stroke={INK} strokeWidth={5} />
      <path d="M585,190 L685,190 M585,220 L665,220 M585,250 L690,250 M585,280 L650,280" stroke="#C8B79A" strokeWidth={8} strokeLinecap="round" />
      <Keyboard id="s7kb" x={KB.x} y={KB.y} s={KB.s} spaceDown={press} />
      <SideHand id="s7h" x={STOCCO_WRIST.x + h.dx} y={STOCCO_WRIST.y + h.dy} s={HS} dir={-1} side="thumb" pose={h.pose} skin={K.stoccoSkin} sleeve={K.stoccoSleeve} arm={560} armAng={lerp(-8, -2, h.contact)} contact={h.contact} surfaceY={58} />
      {k >= 0 && k <= 1 && (
        <g opacity={1 - k} stroke={K.saffron} strokeWidth={8} strokeLinecap="round">
          <path d={`M${KB.x - 150},${KB.y - 40 - 40 * k} l-30,-24`} />
          <path d={`M${KB.x + 150},${KB.y - 40 - 40 * k} l30,-24`} />
          <path d={`M${KB.x},${KB.y - 70 - 46 * k} l0,-30`} />
        </g>
      )}
    </g>
  );
};

/** the 2013 pulse: sharp saffron field arcs that drive the wrist (panel-local) */
const Zap: React.FC<{x: number; y: number; k: number}> = ({x, y, k}) => {
  if (k <= 0 || k >= 1) return null;
  return (
    <g fill="none" stroke={K.saffron} strokeLinecap="round" opacity={1 - k}>
      {[0, 1, 2].map((i) => (
        <path key={i} d={`M${x - 80 - i * 44},${y - 34 - i * 26 - 24 * k} Q${x},${y + 26 - i * 34 - 24 * k} ${x + 80 + i * 44},${y - 34 - i * 26 - 24 * k}`} strokeWidth={12 - i * 3} />
      ))}
    </g>
  );
};

export const Ending: React.FC<{f: number}> = ({f}) => {
  const t = f / FPS;
  const e = endTimes();
  const cam = campusCam(0);
  const events: GEvent[] = [
    {kind: 'rocket', t0: e.tap - 1.95, dur: 3.4, fire: e.tap + 0.03},
    {kind: 'plane', t0: e.plane0, dur: 4.9},
  ];
  // panel-local positions of the right hand (Stocco's panel starts at x 966 in the frame)
  const wrist = STOCCO_WRIST;
  const advK = win(t, e.advice, e.advice + 0.16, e.advice + 0.42, e.advice + 0.9);
  return (
    <g>
      <Cam x={cam.x} y={cam.y} z={cam.z}>
        <Campus f={f} shift={cam.shift} frameK={0} rao={<RaoPanel f={f} events={events} />} stocco={<S7StoccoPanel f={f} />} />
      </Cam>
      <g transform="translate(966 0)">
        <Zap x={wrist.x - 150} y={wrist.y - 120} k={(t - e.pulse) / 0.42} />
        <SoftArc x={wrist.x - 260} y={wrist.y - 250} w={430} k={advK} />
      </g>
    </g>
  );
};

export const endingCues = (): {t: number; kind: string; gain?: number}[] => {
  const e = endTimes();
  return [
    {t: e.tap - 1.95, kind: 'rocket_launch', gain: 0.5},
    {t: e.pulse, kind: 'coil_pulse'},
    {t: e.tap, kind: 'key_click'},
    {t: e.tap + 0.03, kind: 'cannon'},
    {t: e.tap + 0.35, kind: 'boom'},
    {t: e.plane0, kind: 'plane_pass', gain: 0.6},
    {t: e.advice, kind: 'flash'},
  ];
};
