import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';
import {Camera, Cam, Layer, worldToScreen} from '../lib/camera';
import {useG} from '../lib/SceneFrame';
import {at, segEnd} from '../lib/timeline';
import {lerp} from '../lib/anim';
import {E, SNAP, SOFT, camKick, camPath, drop, hop, impact, ring, sp, tw} from '../lib/motion';
import {textWidth, useFontsReady} from '../lib/measure';
import {C, F, OUTLINE} from '../theme';
import {CounterSet} from '../components/Sets';
import {Arm, Character, IDLE, Pose, mixPose, reach} from '../components/Character';
import {CAST} from '../components/cast';
import {Bell, RingMark} from '../components/Props';
import {AnswerSlipArt, SLIP_A_FINAL, SLIP_H, SLIP_STAMP_AT, SLIP_W, SlipOnScreen} from '../components/v2/AnswerSlip';
import {StampArm} from '../components/v2/StampArm';
import {Chip, Headline} from '../components/Text';
import {Sfx} from '../lib/sfx';

/**
 * S1 — cold open at the answer counter. Escalation: three answers that sound certain → they disagree → all wrong →
 * the man in the question wrote the paper → "Very professional. Very fictional."
 * Every beat is keyed to a word of the V2 narration (timeline.json); see V2_DIRECTION.md for the conventions.
 */

export {SLIPS} from '../components/v2/AnswerSlip';

/* ------------------------------------------------------------------ world layout */
const WIN_X = [480, 960, 1440];
const CLERK_Y = 790;
const CLERK_S = 0.98;
const CHECKER = {x: 120, y: 790, scale: 0.92};
const SLIP_TOP = 598;
const SLIP_ROT = [-1.5, 0.8, 1.6];
// WRONG mark centre in slip-local px, per slip: B's text runs a line lower, so its stamp sits below the year line
const STAMP_AT = [SLIP_STAMP_AT, {x: 232, y: 246}, SLIP_STAMP_AT];
const COUNTER_TOP = 690;

const TICKET_TOP = 176;
const TICKET_PAD_X = 40;
const Q_FONT = 54;
const Q_WORDS = ['What', 'was', 'the', 'title', 'of', 'Adam', 'Kalai’s', 'dissertation', '?'];
const NAME = [5, 6]; // "Adam Kalai’s" is set bold and is the s04 callback

// paper header (real crop), world placement on the counter
const PAPER_IMG_W = 1240;
const PAPER_IMG_H = (PAPER_IMG_W * 883) / 4000;
const PAPER_PAD = 22;
const PAPER_W = PAPER_IMG_W + PAPER_PAD * 2 + OUTLINE * 2;
const PAPER_H = PAPER_IMG_H + PAPER_PAD * 2 + OUTLINE * 2;
const PAPER_X = 960 - PAPER_W / 2;
const PAPER_Y = 488;
const imgX = (fx: number) => PAPER_X + OUTLINE + PAPER_PAD + fx * PAPER_IMG_W;
const imgY = (fy: number) => PAPER_Y + OUTLINE + PAPER_PAD + fy * PAPER_IMG_H;
const AUTHOR = {x: imgX(0.052), y: imgY(0.43), w: imgX(0.3) - imgX(0.052), h: imgY(0.72) - imgY(0.43)};

/* ------------------------------------------------------------------ cues (global frames) */
const K = {
  s01: at('s01'),
  three: at('s01', 'Three'),
  popular: at('s01', 'popular'),
  ai: at('s01', 'AI'),
  asked: at('s01', 'asked'),
  question: at('s01', 'question:'),
  qWords: ['what', 'was', 'the', 'title', 'of', 'Adam', "Kalai's", 'dissertation?'].map((w) => at('s01', w)),
  s01End: segEnd('s01'),
  chat: at('s02', 'ChatGPT'),
  handed: at('s02', 'handed'),
  title: at('s02', 'title,'),
  uni: at('s02', 'university,'),
  year: at('s02', 'year.'),
  deep: at('s02', 'DeepSeek'),
  different: at('s02', 'different'),
  llama: at('s02', 'Llama'),
  third: at('s02', 'third.'),
  s02End: segEnd('s02'),
  s03: at('s03'),
  diff3: at('s03', 'different'),
  answers: at('s03', 'answers.'),
  none: at('s03', 'None'),
  them: at('s03', 'them'),
  right: at('s03', 'right.'),
  not: at('s03', 'Not'),
  rightYear: at('s03', 'right', 2),
  s03End: segEnd('s03'),
  and: at('s04', 'And'),
  kalai: at('s04', 'Kalai?'),
  hes: at('s04', "He's"),
  lead: at('s04', 'lead'),
  paper: at('s04', 'paper'),
  reported: at('s04', 'reported'),
  s04End: segEnd('s04'),
  very: at('s05', 'Very'),
  very2: at('s05', 'Very', 2),
  fictional: at('s05', 'fictional.'),
  s05End: segEnd('s05'),
};
const QTYPE = [...K.qWords, K.qWords[7] + 12]; // the "?" lands a beat after "dissertation"
const POP = [K.three, K.popular + 2, K.ai];
// hand-overs: the slip rises from behind the counter, is presented, then slid to the viewer
const HAND = [
  {rise: K.chat - 2, slide: K.chat + 12, land: K.handed},
  {rise: K.deep - 3, slide: K.deep + 6, land: K.deep + 18},
  {rise: K.llama - 2, slide: K.llama + 6, land: K.llama + 18},
];
const MARK = {title: K.title, uni: K.uni, year: K.year};
const SWEEP = [K.title, K.different, K.third - 2];
const HITS = [K.none, K.them + 2, K.right + 2];
const RINGS = [K.not + 3, K.not + 11, K.not + 19];
const PULSE = [K.diff3, K.diff3 + 4, K.diff3 + 8];
export const S1_END_LIFT = K.s05End;

/** The question ticket's vertical offset: drops in at the top of the scene, is pulled up out of the way once the
 *  answers start, drops back for "And Adam Kalai?", and is pulled up again as the ring leaves it. */
const ticketY = (g: number) => {
  const up = -440;
  let y = drop(g, 15, 430, 11);
  y += up * tw(g, K.chat - 8, 14, E.in);
  y -= up * tw(g, K.and - 6, 12, E.out);
  y += -14 * ring(g, K.and + 6, 0.5, 0.15);
  y += up * tw(g, K.hes + 6, 14, E.in);
  return y;
};

/* ------------------------------------------------------------------ sound cues (see lib/sfx.ts) */
export const SFX: Sfx[] = [
  {f: 0, kind: 'amb_counter', dur: 27.3},
  {f: 15, kind: 'paper_flap', gain: -4},
  {f: 15, kind: 'hanger_click'},
  ...POP.map((f, i) => ({f, kind: 'pop_tick' as const, pitch: i * 2, gain: -6})),
  {f: K.asked - 1, kind: 'stamp_light', gain: -12, note: 'guard-rail label stamped on the ticket'},
  ...QTYPE.slice(0, 8).map((f) => ({f: f - 1, kind: 'typewriter_tick' as const, gain: -5})),
  {f: QTYPE[8] - 1, kind: 'bell_ding', gain: -4}, // V3: clear of the end of 'dissertation'
  {f: K.chat - 8, kind: 'paper_swish', gain: -12, note: 'ticket pulled up on its strings'},
  ...HAND.flatMap((h, i) => [
    {f: h.rise, kind: 'paper_lift' as const, pitch: -2 * i, gain: -8},
    {f: h.slide, kind: 'paper_slide' as const, pitch: -2 * i},
    {f: h.land, kind: 'paper_slap' as const, pitch: -2 * i, gain: -7},
    {f: h.land + 1, kind: 'glint' as const, gain: -12},
  ]),
  {f: MARK.title, kind: 'marker_sweep'},
  {f: MARK.uni, kind: 'marker_circle', pitch: 2},
  {f: MARK.year, kind: 'marker_sweep', pitch: 4},
  {f: MARK.year + 8, kind: 'pencil_tap', gain: -8, note: 'A taps his slip twice'},
  {f: MARK.year + 15, kind: 'pencil_tap', gain: -9},
  {f: SWEEP[1], kind: 'marker_sweep', pitch: 1},
  {f: SWEEP[2], kind: 'marker_sweep', pitch: 3},
  ...PULSE.map((f, i) => ({f, kind: 'glint' as const, pitch: i * 2, gain: -10})),
  {f: K.answers + 8, kind: 'whoosh_soft', gain: -12, note: 'the checking hand rises into frame'},
  {f: HITS[0], kind: 'stamp_light'},
  {f: HITS[1], kind: 'stamp_light', pitch: -1},
  {f: HITS[2], kind: 'stamp_heavy'},
  ...RINGS.map((f, i) => ({f, kind: 'marker_circle' as const, pitch: -2 + i * 2, gain: -3})),
  {f: K.rightYear + 6, kind: 'chip_pop'},
  {f: K.and - 6, kind: 'paper_flap', gain: -6, note: 'the ticket drops back down'},
  {f: K.and + 6, kind: 'hanger_click', gain: -3},
  {f: K.kalai - 2, kind: 'marker_circle', pitch: 3},
  {f: K.hes + 1, kind: 'whoosh_soft', gain: -14, note: 'the ring lifts off the ticket'},
  {f: K.hes + 9, kind: 'paper_slap', gain: -3, note: 'the paper lands on the counter'},
  {f: K.hes + 13, kind: 'tape_rip', gain: -8},
  {f: K.hes + 17, kind: 'tape_rip', gain: -10, pitch: 2},
  {f: K.lead + 3, kind: 'chip_pop', note: 'Lead author'},
  {f: K.paper - 1, kind: 'marker_sweep', gain: -3},
  {f: K.paper + 7, kind: 'marker_sweep', gain: -6, pitch: 3},
  {f: K.reported - 2, kind: 'paper_slide', gain: -5, note: 'source tab slides out'},
  {f: K.s04End + 1, kind: 'paper_swish', note: 'the checker whisks the paper away'},
  {f: K.very - 1, kind: 'chip_pop', gain: -4},
  {f: K.fictional + 2, kind: 'stamp_light', gain: -4, note: 'the punchline stamps in (an echo of the WRONG stamps)'},
  {f: K.fictional + 18, kind: 'pencil_tap', gain: -6},
  {f: K.s05End, kind: 'paper_lift', gain: -4, note: 'slip A lifts toward camera into S2'},
];

/* ------------------------------------------------------------------ camera */
const SHOTS = {
  wide0: {cx: 960, cy: 540, zoom: 0.96},
  wide1: {cx: 940, cy: 530, zoom: 1.0},
  a: {cx: 600, cy: 600, zoom: 1.5},
  b: {cx: 930, cy: 600, zoom: 1.4},
  c: {cx: 1320, cy: 600, zoom: 1.5},
  wide2: {cx: 940, cy: 560, zoom: 1.0},
  row: {cx: 935, cy: 590, zoom: 1.03},
  ticket: {cx: 1000, cy: 300, zoom: 1.22},
  paper: {cx: 950, cy: 650, zoom: 1.28},
  joke: {cx: 570, cy: 560, zoom: 1.57},
  cu: {cx: 300, cy: 452, zoom: 2.3},
};
const camAt = (g: number): Cam => {
  const c = camPath(g, SHOTS.wide0, [
    {at: 4, dur: K.s01End - 4, to: SHOTS.wide1, ease: E.inOut},
    {at: K.handed + 6, dur: 20, to: SHOTS.a},
    {at: K.year + 8, dur: 20, to: SHOTS.b},
    {at: K.llama - 16, dur: 18, to: SHOTS.c},
    {at: K.third + 2, dur: 16, to: SHOTS.wide2},
    {at: K.s03 + 6, dur: 30, to: SHOTS.row, ease: E.out},
    {at: K.and, dur: 20, to: SHOTS.ticket},
    {at: K.hes, dur: 22, to: SHOTS.paper},
    {at: K.s04End + 2, dur: 16, to: SHOTS.joke},
    {at: K.very2, dur: 14, to: SHOTS.cu},
  ]);
  return {...c, zoom: c.zoom * camKick(g, [HITS[2]], 0.018)};
};

/* ------------------------------------------------------------------ helpers */
const bell = (g: number, t0: number, dur: number) => (g < t0 || g > t0 + dur ? 0 : Math.sin(((g - t0) / dur) * Math.PI));

type SlipPose = {cx: number; top: number; s: number; rot: number; clip: boolean; visible: boolean};
const slipPose = (i: number, g: number): SlipPose => {
  const h = HAND[i];
  const x0 = WIN_X[i] + 34;
  const s0 = 0.55;
  if (g < h.rise) return {cx: x0, top: COUNTER_TOP, s: s0, rot: 0, clip: true, visible: false};
  const riseT = tw(g, h.rise, 8, E.out);
  if (g < h.slide) {
    const top = lerp(COUNTER_TOP, COUNTER_TOP - SLIP_H * s0, riseT);
    return {cx: x0, top, s: s0, rot: 1.2 * ring(g, h.rise + 8, 0.7, 0.25), clip: riseT < 1, visible: true};
  }
  const u = sp(g, h.slide, SNAP);
  // presenting nudge on "Three different answers", and the jolt when its stamp hits
  const present = bell(g, K.diff3 - 2, 22) * 0.025;
  const jolt = g >= HITS[i] ? 5 * Math.exp(-(g - HITS[i]) * 0.35) : 0;
  return {
    cx: lerp(x0, WIN_X[i], u),
    top: lerp(COUNTER_TOP - SLIP_H * s0, SLIP_TOP, u) + jolt - present * 120,
    s: lerp(s0, 1, u) * (1 + present),
    rot: lerp(0, SLIP_ROT[i], u) + 1.1 * ring(g, h.land, 0.8, 0.22) + 1.6 * ring(g, HITS[i], 1.1, 0.3),
    clip: false,
    visible: true,
  };
};
/** world point of a slip-local point (lx, ly) for a slip pose (rotation about the slip's top centre) */
const slipToWorld = (p: SlipPose, lx: number, ly: number) => {
  const r = (p.rot * Math.PI) / 180;
  const dx = (lx - SLIP_W / 2) * p.s;
  const dy = ly * p.s;
  return {x: p.cx + dx * Math.cos(r) - dy * Math.sin(r), y: p.top + dx * Math.sin(r) + dy * Math.cos(r)};
};

/* ------------------------------------------------------------------ the answer slip */
const AnswerSlip: React.FC<{i: number; g: number; pose: SlipPose}> = ({i, g, pose}) => {
  const hit = HITS[i];
  const [ix, iy] = impact(g, hit, 0.1, 8);
  const inkPop = g >= hit ? lerp(1.15, 1, tw(g, hit, 6, E.out)) : 1;
  // one gold glint along the border when it lands, and again on "Three different answers"
  const glintA = g < HAND[i].land + 16 ? tw(g, HAND[i].land + 1, 14, E.inOut) : 0;
  const glintB = g < PULSE[i] + 15 ? tw(g, PULSE[i], 14, E.inOut) : 0;
  return (
    <div
      style={{
        position: 'absolute',
        left: pose.cx - SLIP_W / 2,
        top: pose.top,
        width: SLIP_W,
        height: SLIP_H,
        transform: `rotate(${pose.rot}deg) scale(${pose.s})`,
        transformOrigin: '50% 0%',
      }}
    >
      <AnswerSlipArt
        i={i}
        marks={{
          title: tw(g, SWEEP[i], i === 0 ? 14 : 11, E.out),
          uni: i === 0 ? tw(g, MARK.uni, 10) : 0,
          year: i === 0 ? tw(g, MARK.year, 10) : 0,
          ring: tw(g, RINGS[i], 9, E.inOut),
          pulse: bell(g, PULSE[i], 12),
          glint: Math.max(glintA, glintB),
        }}
        stamps={g >= hit ? [{text: 'Wrong', x: STAMP_AT[i].x, y: STAMP_AT[i].y, size: i === 1 ? 44 : 48, rotate: i === 1 ? -5 : -11, scale: inkPop, sx: ix, sy: iy}] : []}
      />
    </div>
  );
};

/* ------------------------------------------------------------------ the hanging question ticket */
const qFont = (w: number) => `${NAME.includes(w) ? 600 : 400} ${Q_FONT}px "Source Serif 4 Variable"`;
const ticketLayout = () => {
  const space = textWidth(' ', qFont(0));
  let x = 0;
  const xs = Q_WORDS.map((w, i) => {
    const x0 = x;
    x += textWidth(w, qFont(i)) + (i < Q_WORDS.length - 2 ? space : 0);
    return x0;
  });
  return {xs, width: x, nameX: xs[NAME[0]], nameW: xs[NAME[1]] + textWidth(Q_WORDS[NAME[1]], qFont(NAME[1])) - xs[NAME[0]]};
};

const Ticket: React.FC<{g: number}> = ({g}) => {
  const L = ticketLayout();
  const w = L.width + TICKET_PAD_X * 2 + OUTLINE * 2;
  const left = 960 - w / 2;
  const labelT = tw(g, K.asked - 1, 7, E.out);
  const typed = QTYPE.filter((f) => g >= f - 1).length;
  const caretX = typed === 0 ? 0 : L.xs[typed - 1] + textWidth(Q_WORDS[typed - 1], qFont(typed - 1));
  const caretOn = typed >= Q_WORDS.length ? false : g < QTYPE[0] - 1 ? Math.floor(g / 9) % 2 === 0 : true;
  const nameLine = tw(g, K.qWords[6], 12, E.out);
  const ringT = g < K.hes + 2 ? tw(g, K.kalai - 2, 12, E.inOut) : 0;
  return (
    <div style={{position: 'absolute', left, top: TICKET_TOP, width: w}}>
      {/* strings */}
      <div style={{position: 'absolute', left: 70, top: -900, width: 4, height: 904, background: C.ink}} />
      <div style={{position: 'absolute', right: 70, top: -900, width: 4, height: 904, background: C.ink}} />
      <div style={{position: 'relative', background: C.cream, border: `${OUTLINE}px solid ${C.ink}`, borderRadius: 14, boxShadow: `8px 10px 0 ${C.shadow}`, padding: `14px ${TICKET_PAD_X}px 16px`}}>
        <div style={{position: 'absolute', left: 58, top: -8, width: 28, height: 16, borderRadius: 8, background: C.paperDeep, border: `3px solid ${C.ink}`}} />
        <div style={{position: 'absolute', right: 58, top: -8, width: 28, height: 16, borderRadius: 8, background: C.paperDeep, border: `3px solid ${C.ink}`}} />
        {/* guard-rail label: stamped on as "asked" is said */}
        <div style={{height: 38, display: 'flex', alignItems: 'center'}}>
          <div style={{fontFamily: F.body, fontWeight: 800, fontSize: 30, color: C.inkSoft, letterSpacing: '0.01em', opacity: labelT, transform: `scale(${lerp(1.18, 1, labelT)})`, transformOrigin: '0% 50%', whiteSpace: 'nowrap'}}>
            Asked of GPT-4o, DeepSeek-R1 and Llama-4-Scout · 9 May 2025
          </div>
        </div>
        <div style={{position: 'relative', height: Q_FONT * 1.28, marginTop: 6, width: L.width}}>
          {Q_WORDS.map((word, i) => {
            const t = tw(g, QTYPE[i] - 1, 3, E.out);
            const isQ = i === Q_WORDS.length - 1;
            const qs = isQ && t > 0 ? sp(g, QTYPE[i] - 1, SNAP) : 1;
            return (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  left: L.xs[i],
                  top: 0,
                  font: qFont(i),
                  lineHeight: 1.28,
                  color: NAME.includes(i) ? C.tealDeep : C.ink,
                  opacity: t,
                  transform: isQ ? `scale(${lerp(1.6, 1, qs)})` : `translateY(${(1 - t) * 6}px)`,
                  transformOrigin: '30% 80%',
                  whiteSpace: 'pre',
                }}
              >
                {word}
              </div>
            );
          })}
          {/* teal underline under the name: the hook for s04 */}
          <div style={{position: 'absolute', left: L.nameX, top: Q_FONT * 1.16, width: L.nameW * nameLine, height: 5, borderRadius: 3, background: C.teal}} />
          {/* the circle drawn round the name on "Kalai?" (it later lifts off and travels to the paper) */}
          {ringT > 0 && (
            <div style={{position: 'absolute', left: L.nameX, top: 4, width: L.nameW, height: Q_FONT * 1.12}}>
              <RingMark t={ringT} tone="teal" padX={18} padY={15} width={6} />
            </div>
          )}
          {caretOn && <div style={{position: 'absolute', left: caretX + 6, top: 10, width: 4, height: Q_FONT * 0.98, background: C.ink}} />}
        </div>
      </div>
    </div>
  );
};

/** World rectangle of the name on the ticket (ticket layer), for the ring's travel to the paper. */
const ticketNameRect = () => {
  const L = ticketLayout();
  const w = L.width + TICKET_PAD_X * 2 + OUTLINE * 2;
  const left = 960 - w / 2 + OUTLINE + TICKET_PAD_X;
  const top = TICKET_TOP + OUTLINE + 14 + 38 + 6;
  return {x: left + L.nameX - 18, y: top + 4 - 15, w: L.nameW + 36, h: Q_FONT * 1.12 + 30};
};

/* ------------------------------------------------------------------ the paper header */
const paperOffset = (g: number) => {
  const inU = sp(g, K.hes - 3, {damping: 15, stiffness: 150, mass: 1});
  const outU = tw(g, K.s04End + 1, 14, E.in);
  return {dx: lerp(760, 0, inU) - outU * 1700, dy: lerp(430, 0, inU) + outU * 60, rot: lerp(7, -0.8, inU) - outU * 5, on: g >= K.hes - 3 && outU < 1};
};

const Paper: React.FC<{g: number}> = ({g}) => {
  const o = paperOffset(g);
  if (!o.on) return null;
  const titleT = tw(g, K.paper - 1, 12, E.out);
  const dateT = tw(g, K.paper + 7, 9, E.out);
  const tabT = sp(g, K.reported - 2, SOFT);
  const ul = (x0: number, x1: number, y: number, t: number, col: string) => (
    <div style={{position: 'absolute', left: x0 - PAPER_X, top: y - PAPER_Y, width: (x1 - x0) * t, height: 7, borderRadius: 4, background: col, opacity: 0.9}} />
  );
  return (
    <div style={{position: 'absolute', left: PAPER_X, top: PAPER_Y, width: PAPER_W, height: PAPER_H, transform: `translate(${o.dx}px, ${o.dy}px) rotate(${o.rot}deg)`, transformOrigin: '50% 50%'}}>
      {/* source tab, slides out from under the paper */}
      <div style={{position: 'absolute', left: 40, top: PAPER_H - 20, transform: `translateY(${lerp(-110, 0, tabT)}px)`, background: C.cream, border: `3px solid ${C.inkMuted}`, borderRadius: '0 0 14px 14px', padding: '26px 26px 14px', fontFamily: F.body, fontWeight: 800, fontSize: 30, lineHeight: 1.25, color: C.inkSoft, whiteSpace: 'nowrap', opacity: tabT > 0.01 ? 1 : 0}}>
        <div>Published test · Kalai, Nachum, Vempala &amp; Zhang (2025)</div>
        <div>“Why Language Models Hallucinate,” arXiv · no web search</div>
      </div>
      <div style={{position: 'absolute', inset: 0, background: C.white, border: `${OUTLINE}px solid ${C.ink}`, borderRadius: 8, boxShadow: `10px 12px 0 ${C.shadow}`, padding: PAPER_PAD}}>
        <Img src={staticFile('img/paper_p01_header.png')} style={{width: PAPER_IMG_W, height: PAPER_IMG_H, display: 'block'}} />
      </div>
      {ul(imgX(0.245), imgX(0.755), imgY(0.32), titleT, C.saffronDeep)}
      {ul(imgX(0.4), imgX(0.6), imgY(0.97), dateT, C.saffronDeep)}
      {/* tape */}
      <div style={{position: 'absolute', left: -26, top: -14, width: 110, height: 34, background: 'rgba(255,233,168,0.85)', border: `2px solid ${C.saffronDeep}`, transform: 'rotate(-8deg)'}} />
      <div style={{position: 'absolute', right: -26, top: -14, width: 110, height: 34, background: 'rgba(255,233,168,0.85)', border: `2px solid ${C.saffronDeep}`, transform: 'rotate(7deg)'}} />
    </div>
  );
};

/* ------------------------------------------------------------------ poses */
const P = (p: Partial<Pose>): Pose => ({...IDLE, ...p});

const clerkPose = (i: number, g: number, slip: SlipPose): {pose: Pose; life: number} => {
  const ch = {x: WIN_X[i], y: CLERK_Y, scale: CLERK_S};
  const side = i === 0 ? 1 : i === 2 ? -1 : 0;
  // 1. busy, heads down → pop to attention (dip, overshoot, settle) one per stressed word
  const busy = P({lookY: 1, lookX: -0.25 * side + 0.1, tilt: 7 - i * 5, brows: -0.3, mouth: 'hmm', bob: 46, lean: 3 - i * 2});
  const attn = P({lookY: 0.05, lookX: 0.1 * side, mouth: 'grin', brows: 0.45});
  const popT = sp(g, POP[i], SNAP);
  const dip = g >= POP[i] - 3 && g < POP[i] ? (g - (POP[i] - 3)) * 2.5 : 0;
  let p = mixPose(busy, attn, popT);
  p = {...p, bob: (p.bob ?? 0) + dip};
  // 2. look up at the ticket on "one question:", then track the words as they are typed
  const L = ticketLayout();
  const tleft = 960 - L.width / 2;
  const typed = QTYPE.filter((f) => g >= f - 1).length;
  const caret = tleft + (typed === 0 ? L.width * 0.1 : L.xs[Math.min(typed, Q_WORDS.length) - 1] + 40);
  const look = tw(g, K.question - 2 + i * 2, 8);
  p = mixPose(p, P({...p, lookY: -0.62, lookX: Math.max(-0.8, Math.min(0.8, (caret - ch.x) / 520)), mouth: 'smile', brows: 0.55}), look);
  // 3. the "?" lands: everyone ducks for a slip (anticipation), then pops back up, eager
  const duck = bell(g, QTYPE[8] + 2, 14);
  p = {...p, bob: (p.bob ?? 0) + duck * 16, lookY: lerp(p.lookY, 0.7, duck)};
  const eager = tw(g, QTYPE[8] + 10, 8);
  // during the hand-overs everyone watches the slip being handed over
  const active = HAND.findIndex((h, k) => g >= h.rise - 4 && (k === 2 || g < HAND[k + 1].rise - 4));
  const activeSlipX = active >= 0 ? WIN_X[active] : WIN_X[i];
  p = mixPose(p, P({lookX: Math.max(-0.9, Math.min(0.9, (activeSlipX - ch.x) / 300)), lookY: 0.45, mouth: 'grin', brows: 0.5, lean: 2 * Math.sign(activeSlipX - ch.x)}), eager * (1 - tw(g, K.s03 - 4, 10)));
  // 4. own hand-over: proud chin-up on each mark (A), grin
  if (i === 0) {
    const nod = hop(g, MARK.title + 2, 4, 9) + hop(g, MARK.uni + 2, 4, 9) + hop(g, MARK.year + 2, 4, 9);
    p = {...p, bob: (p.bob ?? 0) + nod, lookY: p.lookY - (nod ? 0.15 : 0)};
  }
  // 5. "Three different answers": straighten, grin at the viewer, presenting
  const present = tw(g, K.diff3 - 2 + i * 3, 8) * (1 - tw(g, HITS[i] - 1, 2));
  p = mixPose(p, P({lookX: 0, lookY: 0.05, mouth: 'grin', brows: 0.8, bob: -5}), present);
  // 6. stamp: flinch (blink, shoulders up, "o"), then caught
  const flinch = bell(g, HITS[i], 10);
  const caught = tw(g, HITS[i], 4) * (1 - tw(g, K.and - 6, 10));
  p = mixPose(p, P({lookX: 0.15 * side, lookY: 0.55, mouth: 'o', brows: 1, bob: -2}), caught);
  p = {...p, bob: (p.bob ?? 0) - flinch * 9, blink: flinch > 0.25 ? 0 : undefined};
  // 7. year circled: deflate
  const deflate = tw(g, RINGS[i] + 2, 10) * (1 - tw(g, K.and - 6, 10));
  p = mixPose(p, P({lookX: 0.1 * side, lookY: 0.75, mouth: 'frown', brows: 0.25, bob: 6, tilt: 3 * (i - 1)}), deflate);
  // 8. "And Adam Kalai?": look up at the ticket, puzzled
  const puzzled = tw(g, K.and + 2 + i * 3, 9) * (1 - tw(g, K.hes + 2, 8));
  p = mixPose(p, P({lookX: Math.max(-0.7, Math.min(0.7, (1060 - ch.x) / 500)), lookY: -0.8, mouth: 'hmm', brows: 0.9}), puzzled);
  // 9. the paper lands: lean in to read; "lead author": the penny drops (A jaw, B covers mouth, C slip ↔ paper)
  const read = tw(g, K.hes + 6, 10) * (1 - tw(g, K.s04End, 10));
  p = mixPose(p, P({lookX: Math.max(-0.6, Math.min(0.6, (AUTHOR.x + 140 - ch.x) / 600)), lookY: 0.6, mouth: 'flat', brows: 0.3, lean: 3 * Math.sign(560 - ch.x)}), read);
  const shock = tw(g, K.lead + 2 + i * 5, 6) * (1 - tw(g, K.s04End + 4, 10));
  const cLook = i === 2 ? (Math.floor((g - K.lead) / 9) % 2 === 0 ? 0.75 : 0.2) : 0.5;
  p = mixPose(p, P({lookX: i === 2 ? -0.5 : 0.1 * side, lookY: cLook, mouth: i === 1 ? 'flat' : 'o', brows: 1, bob: -3}), shock);
  if (i === 1) p = {...p, armL: mixArm(p.armL, reach(ch, -1, ch.x - 8, CLERK_Y - 0.98 * 342, 1), shock)};
  // 10. the paper is whisked away to the left: look after it
  const after = bell(g, K.s04End + 2, 22);
  p = mixPose(p, P({...p, lookX: -0.9, lookY: 0.3}), after);
  // 11. "Very professional…": proud again, one grooming gesture each
  const proud = tw(g, K.very - 2 + i * 4, 8);
  p = mixPose(p, P({lookX: 0, lookY: -0.1, mouth: 'grin', brows: 0.8, bob: -4, tilt: -2 + i * 2}), proud);
  const groom = bell(g, K.very + 4 + i * 6, 16);
  if (groom > 0) {
    if (i === 0) p = {...p, armL: mixArm(p.armL, reach(ch, -1, ch.x - 30, CLERK_Y - 0.98 * 440, -1), groom)};
    if (i === 1) p = {...p, armL: mixArm(p.armL, reach(ch, -1, ch.x + 20 + Math.sin(g * 0.8) * 14, CLERK_Y - 0.98 * 230, 1), groom)};
    if (i === 2) p = {...p, armL: mixArm(p.armL, reach(ch, -1, ch.x - 46, CLERK_Y - 0.98 * 360, 1), groom)};
  }
  // secondary life in s01: one small gesture each while the question is typed
  const fidget = bell(g, [K.qWords[1], K.qWords[3], K.qWords[2]][i] - 4, 14);
  if (fidget > 0) {
    if (i === 0) p = {...p, armL: mixArm(p.armL, reach(ch, -1, ch.x - 4 + Math.sin(g * 1.3) * 7, CLERK_Y - 0.98 * 205, 1), fidget)};
    if (i === 1) p = {...p, armL: mixArm(p.armL, reach(ch, -1, ch.x - 18, CLERK_Y - 0.98 * 385, -1), fidget)};
    if (i === 2) p = {...p, armL: mixArm(p.armL, reach(ch, -1, ch.x - 40, CLERK_Y - 0.98 * 350, 1), fidget)};
  }
  // front (right) arm: rests on the counter; reaches for and pushes its slip; then holds the slip's corner
  // before the pop the hand is busy on the counter (sorting, scribbling); after it rests on the edge
  const busyK = 1 - Math.min(1, popT);
  const restR = reach({...ch, bob: p.bob}, 1, ch.x + 92 - busyK * (36 - Math.sin(g * 0.55 + i * 2) * 14), COUNTER_TOP + 4 + busyK * Math.abs(Math.sin(g * 0.55 + i * 2)) * -6);
  const h = HAND[i];
  let armR: Arm = restR;
  if (g >= h.rise - 6) {
    const grab = reach({...ch, bob: p.bob}, 1, ch.x + 44, COUNTER_TOP + 8);
    armR = mixArm(restR, grab, tw(g, h.rise - 6, 5));
    if (g >= h.rise - 1) {
      const edge = slipToWorld(slip, SLIP_W * 0.66, 8);
      armR = reach({...ch, bob: p.bob}, 1, edge.x, edge.y);
    }
    const corner = slipToWorld(slip, SLIP_W - 16, 14);
    const tapLift = i === 0 ? (bell(g, MARK.year + 5, 6) + bell(g, MARK.year + 12, 6)) * 14 : 0;
    const toCorner = tw(g, h.land + 2, 6);
    if (toCorner > 0) armR = mixArm(armR, reach({...ch, bob: p.bob}, 1, corner.x - 8, corner.y - tapLift), toCorner);
    // let go before the stamp comes down, and stay clear until the end
    const off = tw(g, HITS[i] - 8, 6);
    armR = mixArm(armR, restR, off);
    // A: a small proud hand-to-chest just before the lift, so nothing of the clerk rests on the slip when it leaves
    if (i === 0) armR = mixArm(armR, reach({...ch, bob: p.bob}, 1, ch.x + 34, CLERK_Y - 0.98 * 290), tw(g, S1_END_LIFT - 8, 6));
  }
  p = {...p, armR};
  const life = g >= h.rise - 6 && g < HITS[i] - 2 ? 0.25 : 1;
  return {pose: p, life};
};
const mixArm = (a: Arm, b: Arm, t: number): Arm => ({a: a.a + (b.a - a.a) * t, b: a.b + (b.b - a.b) * t});

const checkerPose = (g: number): Pose => {
  const ch = CHECKER;
  const pencil = reach(ch, 1, ch.x + 48, ch.y - 0.92 * 222);
  let p = P({armR: pencil, armL: {a: 6, b: 8}, mouth: 'flat', lookX: 0.55, lookY: 0.1, brows: 0, tilt: -1});
  // raises the pencil when the question is announced, squints at the name
  const raise = bell(g, K.question - 2, 34);
  p = {...p, armR: mixArm(p.armR, reach(ch, 1, ch.x + 92, ch.y - 0.92 * 330), raise)};
  p = mixPose(p, P({...p, lookX: 0.7, lookY: -0.55}), tw(g, K.question, 8) * (1 - tw(g, K.chat, 10)));
  p = mixPose(p, P({...p, brows: -0.55, lookX: 0.8, lookY: -0.6}), tw(g, K.qWords[6], 6) * (1 - tw(g, K.chat - 6, 10)));
  // watches A's slip with narrowing eyes
  p = mixPose(p, P({...p, lookX: 0.9, lookY: 0.4, brows: -0.25}), tw(g, K.chat + 6, 8) * (1 - tw(g, K.s03, 10)));
  // one eyebrow up at "Three different answers"
  p = mixPose(p, P({...p, lookX: 0.8, lookY: 0.3, browAsym: 1, brows: 0}), tw(g, K.diff3, 8) * (1 - tw(g, K.none + 20, 10)));
  // a small satisfied nod after the third stamp; then looks up at the ticket ("the right year")
  p = {...p, bob: (p.bob ?? 0) + hop(g, HITS[2] + 6, -5, 10)};
  p = mixPose(p, P({...p, lookX: 0.8, lookY: -0.75, brows: 0.2}), tw(g, K.and - 4, 8) * (1 - tw(g, K.hes, 10)));
  // whisks the paper away to the left
  const whisk = bell(g, K.s04End, 18);
  p = {...p, armR: mixArm(p.armR, reach(ch, 1, ch.x + 120, ch.y - 0.92 * 250), whisk), lookX: lerp(p.lookX, 0.6, whisk), lookY: lerp(p.lookY, 0.5, whisk)};
  // the joke: watches the clerks preen, eyes drop to the WRONG stamp, then turns to camera, deadpan
  p = mixPose(p, P({...p, lookX: 0.85, lookY: 0.05, brows: 0, browAsym: 0}), tw(g, K.very, 8));
  p = mixPose(p, P({...p, lookX: 0.6, lookY: 0.75}), tw(g, K.very2 - 10, 5));
  const deadpan = tw(g, K.very2 + 4, 6);
  p = mixPose(p, P({...p, lookX: 0, lookY: 0.02, browAsym: 1, brows: -0.15, tilt: -3, mouth: 'flat'}), deadpan);
  if (deadpan > 0.5) p = {...p, blink: g < K.fictional + 2 ? 1 : g < K.fictional + 16 ? 0.42 : 1};
  // pencil tap on the counter after the line
  p = {...p, armR: mixArm(p.armR, reach(ch, 1, ch.x + 78, ch.y - 0.92 * 236 - 10 * bell(g, K.fictional + 18, 5)), tw(g, K.fictional + 12, 5))};
  return p;
};

/* ------------------------------------------------------------------ scene */
export const S1Counter: React.FC = () => {
  const g = useG();
  useFontsReady();
  const cam = camAt(g);
  const slips = [0, 1, 2].map((i) => slipPose(i, g));

  // set responses
  const nudge = HITS.reduce((acc, h, k) => acc + (k === 2 ? 2.2 : 1.2) * ring(g, h, 1.6, 0.45), 0);
  const signRot = 1.6 * ring(g, POP[1] + 2, 0.45, 0.09) + 2.4 * ring(g, HITS[2], 0.42, 0.07);
  const tDrop = ticketY(g);
  const tSwing = 1.4 * ring(g, 15, 0.42, 0.08) + 0.9 * ring(g, HITS[2], 0.4, 0.07);

  // stamp arm, screen space
  const stampPt = (i: number) => {
    const w = slipToWorld({...slips[i], rot: SLIP_ROT[i], top: SLIP_TOP, cx: WIN_X[i], s: 1}, STAMP_AT[i].x, STAMP_AT[i].y);
    return worldToScreen(cam, w.x, w.y, 1.08);
  };
  const pts = [0, 1, 2].map(stampPt);

  // the ring that travels from the ticket to the paper's author line, then becomes the "Lead author" box
  const travel = tw(g, K.hes + 1, 17, E.inOut);
  const tn = ticketNameRect();
  const tnA = worldToScreen(cam, tn.x, tn.y + tDrop, 0.9);
  const tnB = worldToScreen(cam, tn.x + tn.w, tn.y + tn.h + tDrop, 0.9);
  const po = paperOffset(g);
  const au = {x: AUTHOR.x - 14 + po.dx, y: AUTHOR.y - 10 + po.dy, w: AUTHOR.w + 28, h: AUTHOR.h + 20};
  const auA = worldToScreen(cam, au.x, au.y, 1.1);
  const auB = worldToScreen(cam, au.x + au.w, au.y + au.h, 1.1);
  const rr = {
    x: lerp(tnA.x, auA.x, travel),
    y: lerp(tnA.y, auA.y, travel) - Math.sin(travel * Math.PI) * 60,
    w: lerp(tnB.x - tnA.x, auB.x - auA.x, travel),
    h: lerp(tnB.y - tnA.y, auB.y - auA.y, travel),
  };
  const boxT = tw(g, K.lead, 6, E.out);
  const tagT = sp(g, K.lead + 3, SNAP);
  const ringVisible = g >= K.hes + 2 && g < K.s04End + 1;

  // caption: "Very professional…" then "Very fictional." stamps in beside it
  const capFont = `600 64px "Fredoka Variable"`;
  const w1 = textWidth('Very professional.', capFont);
  const w2 = textWidth('Very fictional.', capFont);
  const gap = 24;
  const cap1 = sp(g, K.very - 1, SNAP);
  const cap2 = g >= K.fictional - 1 ? sp(g, K.fictional - 1, SNAP) : 0;
  const capOut = tw(g, K.s05End + 6, 8, E.in);
  const spread = tw(g, K.fictional - 4, 4, E.out);
  const boxW = w1 + (gap + w2) * spread + 72;
  const [cx2, cy2] = impact(g, K.fictional + 2, 0.12, 8);
  const jolt = 3 * ring(g, K.fictional + 2, 1.4, 0.4);

  // chip after the years are circled
  const chipT = g >= K.rightYear - 2 && g < K.and + 30 ? 1 : 0;
  const chipY = drop(g, K.rightYear + 6, 50, 8);

  // the world falls away under slip A at the end (into S2)
  const fall = tw(g, S1_END_LIFT + 2, 13, E.in);

  return (
    <AbsoluteFill style={{background: C.paper}}>
      <AbsoluteFill style={{transform: `translateY(${fall * 1150}px)`, overflow: 'hidden'}}>
        <AbsoluteFill style={{background: C.saffron}} />
        <Camera cam={cam}>
          <CounterSet
            signRotate={signRot}
            counterNudge={nudge}
            front={
              <>
                {slips.map((pose, i) => {
                  if (!pose.visible) return null;
                  if (i === 0 && g >= S1_END_LIFT) return null; // handed to the screen-space lift
                  const el = <AnswerSlip key={i} i={i} g={g} pose={pose} />;
                  return pose.clip ? (
                    <div key={i} style={{position: 'absolute', left: -600, top: -600, width: 3200, height: COUNTER_TOP + 600, overflow: 'hidden'}}>
                      <div style={{position: 'absolute', left: 600, top: 600}}>{el}</div>
                    </div>
                  ) : (
                    el
                  );
                })}
                <div style={{position: 'absolute', left: 1745, top: COUNTER_TOP + 2 + hop(g, QTYPE[8], 6, 6)}}>
                  <Bell scale={1.25} ding={bell(g, QTYPE[8], 6)} />
                </div>
                {chipT > 0 && (
                  <div style={{position: 'absolute', left: 0, width: 1920, top: 902 + chipY, textAlign: 'center'}}>
                    <Chip tone="coral" size={44}>
                      2002 · 2005 · 2007 — none of them right
                    </Chip>
                  </div>
                )}
              </>
            }
          >
            {/* the hanging question, between the sign and the clerks */}
            <Layer depth={0.9}>
              <div style={{position: 'absolute', inset: 0, transform: `translateY(${tDrop}px) rotate(${tSwing * 0.25}deg)`, transformOrigin: '960px -900px'}}>
                <Ticket g={g} />
              </div>
            </Layer>
            {/* clerks and the checker behind the counter */}
            <Layer depth={1}>
              <Character look={CAST.checker} pose={checkerPose(g)} frame={g} seed={9} x={CHECKER.x} y={CHECKER.y} scale={CHECKER.scale} life={0.7} holdR={<Pencil />} />
              {['clerkA', 'clerkB', 'clerkC'].map((n, i) => {
                const {pose, life} = clerkPose(i, g, slips[i]);
                return <Character key={n} look={CAST[n]} pose={pose} frame={g} seed={i + 2} x={WIN_X[i]} y={CLERK_Y} scale={CLERK_S} front="R" pass="body" life={life} />;
              })}
            </Layer>
          </CounterSet>
          {/* clerks' front arms, over the counter and the slips */}
          <Layer depth={1.08}>
            <div style={{position: 'absolute', inset: 0, transform: `translateY(${nudge}px)`}}>
              {['clerkA', 'clerkB', 'clerkC'].map((n, i) => {
                const {pose, life} = clerkPose(i, g, slips[i]);
                return <Character key={n} look={CAST[n]} pose={pose} frame={g} seed={i + 2} x={WIN_X[i]} y={CLERK_Y} scale={CLERK_S} front="R" pass="frontArm" shadow={false} life={life} />;
              })}
            </div>
          </Layer>
          {/* the paper header slides onto the counter */}
          <Layer depth={1.1}>
            <Paper g={g} />
          </Layer>
        </Camera>

        {/* the checking hand (point of view): three stamps, the third the heaviest */}
        <StampArm
          g={g}
          scale={1.5}
          hover={110}
          sleeve={C.teal}
          arcHeight={40}
          enter={K.answers + 8}
          exit={K.not + 12}
          targets={[
            {at: K.answers + 22, x: pts[0].x, y: pts[0].y},
            {at: HITS[1] - 3, x: pts[1].x, y: pts[1].y, move: 6},
            {at: HITS[2] - 4, x: pts[2].x, y: pts[2].y, move: 7},
          ]}
          hits={HITS}
          shapes={[
            {lift: 6, down: 3, hold: 2, up: 4, wind: 0.6},
            {lift: 1, down: 2, hold: 1, up: 3, wind: 0.2},
            {lift: 3, down: 2, hold: 4, up: 10, wind: 0.9},
          ]}
        />

        {/* the circle round the name lifts off the ticket and lands on the author line */}
        {ringVisible && (
          <div style={{position: 'absolute', left: rr.x, top: rr.y, width: rr.w, height: rr.h}}>
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'visible'}}>
              <rect x={0} y={0} width={100} height={100} rx={lerp(50, 8, boxT)} ry={lerp(50, 22, boxT)} fill={`rgba(28,167,160,${0.16 * boxT})`} stroke={C.teal} strokeWidth={7} vectorEffect="non-scaling-stroke" />
            </svg>
            {tagT > 0 && (
              <div style={{position: 'absolute', left: 0, top: '100%', marginTop: 12, transform: `scale(${tagT})`, transformOrigin: '0% 0%'}}>
                <Chip tone="teal" size={36}>
                  Lead author
                </Chip>
              </div>
            )}
          </div>
        )}
      </AbsoluteFill>

      {/* slip A lifts toward the viewer and carries the eye into S2 */}
      {g >= S1_END_LIFT && <LiftedSlip g={g} cam={camAt(S1_END_LIFT)} pose={slipPose(0, S1_END_LIFT)} />}

      {/* the joke caption */}
      {cap1 > 0 && capOut < 1 && (
        <div style={{position: 'absolute', left: 960 - boxW / 2, top: 64 + jolt, width: boxW, height: 104, transform: `scale(${lerp(0.9, 1, cap1) * (1 - capOut * 0.1)})`, opacity: 1 - capOut, transformOrigin: '50% 50%'}}>
          <div style={{position: 'absolute', inset: 0, background: C.cream, border: `4px solid ${C.ink}`, borderRadius: 18, boxShadow: `8px 10px 0 ${C.shadow}`, transform: `scale(${cx2}, ${cy2})`}} />
          <Headline size={64} align="left" style={{position: 'absolute', left: 36, top: 16, whiteSpace: 'nowrap'}}>
            Very professional.
          </Headline>
          {cap2 > 0 && (
            <Headline size={64} align="left" color={C.coral} style={{position: 'absolute', left: 36 + w1 + gap, top: 16, whiteSpace: 'nowrap', transform: `scale(${lerp(1.16, 1, cap2)})`, transformOrigin: '50% 60%'}}>
              Very fictional.
            </Headline>
          )}
        </div>
      )}
    </AbsoluteFill>
  );
};

const Pencil: React.FC = () => (
  <g transform="rotate(-30)">
    <rect x={-6} y={-60} width={12} height={62} rx={3} fill={C.saffron} stroke={C.ink} strokeWidth={3} />
    <path d="M -6 2 L 6 2 L 0 16 Z" fill={C.woodLight} stroke={C.ink} strokeWidth={3} strokeLinejoin="round" />
    <rect x={-6} y={-70} width={12} height={12} rx={3} fill={C.coralLight} stroke={C.ink} strokeWidth={3} />
  </g>
);

/* ------------------------------------------------------------------ hand-off to S2 */
/** Screen pose of slip A at the end of the lift; S2 starts from exactly this (TRANSITIONS.S2 is a cut). */
export const HANDOFF = {cx: 960, cy: 560, scale: 1.75, rot: -3};
export const LIFT_FRAMES = 15;

export const liftPose = (g: number, from: {cx: number; cy: number; scale: number; rot: number}) => {
  const u = tw(g, S1_END_LIFT, LIFT_FRAMES, E.inOut);
  const lift = Math.sin(u * Math.PI);
  return {cx: lerp(from.cx, HANDOFF.cx, u), cy: lerp(from.cy, HANDOFF.cy, u), scale: lerp(from.scale, HANDOFF.scale, u) * (1 + 0.08 * lift), rot: lerp(from.rot, HANDOFF.rot, u), lift};
};

const LiftedSlip: React.FC<{g: number; cam: Cam; pose: SlipPose}> = ({g, cam, pose}) => {
  const c = slipToWorld(pose, SLIP_W / 2, SLIP_H / 2);
  const s = worldToScreen(cam, c.x, c.y, 1.08);
  const p = liftPose(g, {cx: s.x, cy: s.y, scale: s.scale * pose.s, rot: pose.rot});
  return <SlipOnScreen i={0} cx={p.cx} cy={p.cy} scale={p.scale} rot={p.rot} lift={p.lift} marks={SLIP_A_FINAL.marks} stamps={SLIP_A_FINAL.stamps} />;
};
