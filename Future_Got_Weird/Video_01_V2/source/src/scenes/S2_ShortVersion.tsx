import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Camera, Layer} from '../lib/camera';
import {useG} from '../lib/SceneFrame';
import {at, scene, segEnd} from '../lib/timeline';
import {lerp} from '../lib/anim';
import {E, SNAP, SOFT, camPath, drop, hop, impact, ring, sp, tw} from '../lib/motion';
import {textWidth, useFontsReady} from '../lib/measure';
import {Sfx} from '../lib/sfx';
import {C, F, OUTLINE} from '../theme';
import {Chip, Headline} from '../components/Text';
import {StampMark} from '../components/Props';
import {Wordmark} from '../components/Sets';
import {RollingNumber} from '../components/v2/RollingNumber';
import {SLIP_A_FINAL, SlipOnScreen} from '../components/v2/AnswerSlip';
import {HANDOFF} from './S1_Counter';

/**
 * S2 — the short version. Slip A arrives from the counter (cut from S1's lift), the title builds round the question,
 * then three claim cards are dealt and each one performs its claim; the channel card drops in over them and lifts
 * away to reveal the token machine (TRANSITIONS.S3 = reveal).
 */

/* ------------------------------------------------------------------ cues */
const K = {
  start: scene('S2').from,
  end: scene('S2').to,
  so: at('s06', 'So'),
  how: at('s06', 'how'),
  wrong: at('s06', 'wrong'),
  sound: at('s06', 'sound'),
  sure: at('s06', 'sure?'),
  heres: at('s06', "Here's"),
  short: at('s06', 'short'),
  s06End: segEnd('s06'),
  a: at('s07', 'A'),
  built: at('s07', 'built'),
  write: at('s07', 'write'),
  likely: at('s07', 'likely'),
  come: at('s07', 'come'),
  next: at('s07', 'next.'),
  checking: at('s07', 'Checking'),
  true_: at('s07', 'true'),
  is: at('s07', 'is', 2),
  different: at('s07', 'different'),
  job: at('s07', 'job.'),
  and: at('s07', 'And'),
  tests: at('s07', 'tests'),
  used: at('s07', 'used'),
  systems: at('s07', 'systems'),
  quietly: at('s07', 'quietly'),
  reward: at('s07', 'reward'),
  guessing: at('s07', 'guessing.'),
  s07End: segEnd('s07'),
};
const LAND = [K.heres + 12, K.heres + 17, K.heres + 22];
const FLIP = [K.a - 2, K.checking - 2, K.tests - 2];
const STAMP = K.guessing + 3;
const STING = K.s07End + 10; // the brand card lands
const LIFT = K.end - 14; // ... and lifts away to reveal S3 (S3 is mounted under S2 from here)
// score steps on "used to grade these systems", the sly 7th on "quietly"
const STEPS_G = [0, 1, 2, 3, 4, 5].map((k) => K.used + 2 + k * 6);
const STEPS_H = STEPS_G.map((f) => f + 3);

/* ------------------------------------------------------------------ layout (S2 world = screen at zoom 1) */
const CW = 540;
const CH = 530;
const CX = [114, 690, 1266];
const CY = 140;

/* ------------------------------------------------------------------ sound */
export const SFX: Sfx[] = [
  {f: K.start + 1, kind: 'thud_soft', gain: -6, note: 'slip A lands on the paper'},
  {f: K.start + 6, kind: 'stamp_light', gain: -14, note: 'WRONG after-thump'},
  {f: K.so + 2, kind: 'paper_slide', gain: -14, note: 'kicker slides down'},
  {f: K.wrong, kind: 'pop_tick', gain: -6},
  {f: K.wrong + 4, kind: 'pop_tick', gain: -6, pitch: 2},
  {f: K.sure + 1, kind: 'logo_hit', gain: -6, note: 'Confidently drops into the title'},
  {f: K.sure + 6, kind: 'glint', gain: -10},
  {f: K.heres, kind: 'paper_swish', gain: -6},
  {f: K.short, kind: 'chip_pop'},
  ...LAND.map((f, i) => ({f, kind: 'paper_slap' as const, gain: -8, pitch: -i})),
  ...FLIP.map((f) => ({f: f + 4, kind: 'card_flick' as const})),
  {f: K.built, kind: 'prob_tick', gain: -14},
  {f: K.write, kind: 'prob_tick', gain: -14, pitch: 2},
  {f: K.likely, kind: 'token_select'},
  {f: K.come + 2, kind: 'paper_lift', gain: -12},
  {f: K.next + 1, kind: 'token_lock'},
  {f: K.checking + 4, kind: 'conveyor_run', gain: -12, dur: 2.1},
  {f: K.true_, kind: 'machine_clunk', gain: -6, note: 'the locked shutter rattles'},
  {f: K.is + 2, kind: 'hanger_click', gain: -8, note: 'CLOSED sign swings'},
  {f: K.different, kind: 'card_flick', gain: -8, note: 'slip deflected past the booth'},
  {f: K.job + 2, kind: 'stamp_light', gain: -9},
  {f: K.tests + 6, kind: 'chip_pop', gain: -8},
  ...STEPS_G.map((f) => ({f, kind: 'score_flip' as const, gain: -9})),
  ...STEPS_H.map((f) => ({f, kind: 'score_flip' as const, gain: -11, pitch: -2})),
  {f: K.quietly + 2, kind: 'score_flip', gain: -6, pitch: 3, note: 'the sly seventh point'},
  {f: K.reward, kind: 'glint', gain: -8},
  {f: STAMP, kind: 'stamp_heavy', gain: -4, note: 'GUESSING PAYS'},
  {f: STING - 10, kind: 'whoosh_soft', gain: -8},
  {f: STING, kind: 'thud_soft'},
  {f: STING + 2, kind: 'pop_tick', gain: -8},
  {f: STING + 6, kind: 'pop_tick', gain: -8, pitch: 2},
  {f: STING + 10, kind: 'pop_tick', gain: -8, pitch: 4},
  {f: STING + 12, kind: 'logo_hit'},
  {f: LIFT, kind: 'whoosh_soft', gain: -10, note: 'brand card lifts away'},
];

/* ------------------------------------------------------------------ helpers */
const bell = (g: number, t0: number, dur: number) => (g < t0 || g > t0 + dur ? 0 : Math.sin(((g - t0) / dur) * Math.PI));
const steps = (g: number, fs: number[]) => fs.reduce((v, f) => v + (g >= f ? Math.min(1.06, sp(g, f, SNAP)) : 0), 0);

/* ------------------------------------------------------------------ the title */
const TITLE_FONT = `600 100px "Fredoka Variable"`;
const Title: React.FC<{g: number}> = ({g}) => {
  const sp_ = textWidth(' ', TITLE_FONT);
  const w1 = textWidth('Why AI Is So', TITLE_FONT);
  const w2 = textWidth('Confidently', TITLE_FONT);
  const w3 = textWidth('Wrong', TITLE_FONT);
  const total = w1 + sp_ + w2 + sp_ + w3;
  const x0 = 960 - total / 2;
  const a = sp(g, K.wrong - 2, SNAP);
  const b = sp(g, K.wrong + 3, SNAP);
  const c = sp(g, K.sure - 1, {damping: 11, stiffness: 230, mass: 0.9});
  const [cx, cy] = impact(g, K.sure + 5, 0.1, 9);
  const nudge = 9 * Math.exp(-Math.max(0, g - (K.sure + 5)) * 0.3) * (g >= K.sure + 5 ? 1 : 0);
  const out = tw(g, K.heres - 6, 12, E.in);
  const y = 112 - out * 330;
  const word = (text: string, x: number, t: number, col: string, extra = '') => (
    <div style={{position: 'absolute', left: x, top: y - (1 - t) * 26, font: TITLE_FONT, lineHeight: 1.1, color: col, opacity: t > 0.02 ? 1 : 0, transform: `scale(${lerp(0.94, 1, Math.min(1, t))}) ${extra}`, transformOrigin: '50% 100%', whiteSpace: 'nowrap'}}>
      {text}
    </div>
  );
  return (
    <>
      {/* kicker */}
      <div style={{position: 'absolute', left: 0, right: 0, top: 46 - (1 - tw(g, K.so, 12)) * 40 - out * 330, textAlign: 'center', opacity: tw(g, K.so, 8)}}>
        <span style={{fontFamily: F.body, fontWeight: 800, fontSize: 34, letterSpacing: '0.12em', color: C.inkMuted}}>FUTURE GOT WEIRD · EPISODE 1</span>
      </div>
      {word('Why AI Is So', x0 - nudge, a, C.ink)}
      {c > 0 && word('Confidently', x0 + w1 + sp_, c, C.coral, `scale(${cx}, ${cy})`)}
      {word('Wrong', x0 + w1 + sp_ + w2 + sp_ + nudge, b, C.ink)}
    </>
  );
};

/* ------------------------------------------------------------------ the claim cards */
const CardBack: React.FC<{n: number}> = ({n}) => (
  <div style={{position: 'absolute', inset: 0, background: C.inkSoft, border: `${OUTLINE}px solid ${C.ink}`, borderRadius: 24, boxShadow: `8px 10px 0 ${C.shadow}`}}>
    <div style={{position: 'absolute', inset: 16, border: `3px solid rgba(255,251,240,0.35)`, borderRadius: 16}} />
    <div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: F.display, fontWeight: 700, fontSize: 170, color: C.cream}}>{n}</div>
  </div>
);

const CANDS = ['ai', 'ian', 'os'];
const Card1: React.FC<{g: number}> = ({g}) => {
  // three candidate next chunks; their bars jostle, one wins on "likely", lifts and drops into the sentence on "come next."
  const jost = tw(g, FLIP[0] + 8, 8) * (1 - tw(g, K.likely - 2, 6));
  const win = sp(g, K.likely - 1, SOFT);
  const base = [0.46, 0.38, 0.3];
  const final = [0.88, 0.22, 0.1];
  const bars = base.map((b, i) => lerp(b + jost * 0.22 * Math.sin(g * 0.42 + i * 2.1), final[i], Math.min(1, win)));
  const fly = tw(g, K.come + 1, K.next - K.come, E.inOut); // lands exactly as the tile is handed to the sentence
  const lifted = bell(g, K.come - 3, 6) * -10;
  const landed = g >= K.next + 1;
  const strip = 'Adam Tauman Kal';
  const sFont = `400 42px "Source Serif 4 Variable"`;
  const sw = textWidth(strip, sFont);
  const tileX = (i: number) => 50 + i * 160;
  const wx = lerp(tileX(0), sw + 6, fly);
  const wy = lerp(226, 88, fly) - Math.sin(fly * Math.PI) * 50 + lifted;
  const [bx, by] = impact(g, K.next + 1, 0.12, 8);
  return (
    <div style={{position: 'absolute', inset: 0, background: C.blueLight, border: `${OUTLINE}px solid ${C.ink}`, borderRadius: 24, boxShadow: `8px 10px 0 ${C.shadow}`, overflow: 'hidden'}}>
      <div style={{position: 'absolute', left: 0, right: 0, top: 18, textAlign: 'center', fontFamily: F.display, fontWeight: 700, fontSize: 34, color: C.blueDeep, letterSpacing: '0.03em'}}>WHAT COMES NEXT?</div>
      {/* the sentence being written */}
      <div style={{position: 'absolute', left: 30, top: 78, width: CW - 60 - 8, height: 84, background: C.cream, border: `${OUTLINE}px solid ${C.ink}`, borderRadius: 12, transform: `scale(${bx}, ${by})`}}>
        <div style={{position: 'absolute', left: 18, top: 14, font: sFont, color: C.ink, whiteSpace: 'nowrap'}}>
          {strip}
          {landed && <span style={{background: C.saffronLight, borderRadius: 4}}>ai</span>}
          {(g % 16 < 9 || g < K.a) && <span style={{display: 'inline-block', width: 4, height: 44, marginLeft: 4, background: C.ink, verticalAlign: 'middle'}} />}
        </div>
      </div>
      {/* candidates and their scores */}
      {CANDS.map((c, i) => {
        const isWin = i === 0;
        const sel = isWin ? Math.min(1, win) : 0;
        const dim = !isWin ? Math.min(1, win) : 0;
        if (isWin && landed) return null;
        const x = isWin ? wx : tileX(i);
        const bob = jost * 4 * Math.sin(g * 0.42 + i * 2.1 + 1.2);
        const y = (isWin ? wy : 226 + dim * 4) + (isWin && fly > 0 ? 0 : bob);
        return (
          <div key={c} style={{position: 'absolute', left: x, top: y, width: 130, height: 76, background: sel > 0.5 ? C.saffron : C.cream, border: `${OUTLINE + sel * 2}px solid ${C.ink}`, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: F.serif, fontSize: 46, color: C.ink, opacity: 1 - dim * 0.45, transform: `scale(${1 + 0.15 * sel * (1 - fly)})`, boxShadow: `4px 5px 0 ${C.shadow}`}}>
            {c}
          </div>
        );
      })}
      {CANDS.map((c, i) => (
        <div key={c + 'b'} style={{position: 'absolute', left: tileX(i), top: 326, width: 130, height: 22, borderRadius: 11, background: 'rgba(58,95,160,0.18)'}}>
          <div style={{width: `${bars[i] * 100}%`, height: '100%', borderRadius: 11, background: i === 0 && win > 0.5 ? C.blueDeep : C.blue}} />
        </div>
      ))}
      <div style={{position: 'absolute', left: 0, right: 0, top: 376, textAlign: 'center', fontFamily: F.body, fontWeight: 800, fontSize: 32, color: C.blueDeep}}>scores: how likely each piece is</div>
      <div style={{position: 'absolute', right: 22, bottom: 18}}>
        <Chip tone="paper" size={30}>illustrative</Chip>
      </div>
    </div>
  );
};

const Card2: React.FC<{g: number}> = ({g}) => {
  // the slip rides the belt to the EVIDENCE CHECK booth, the shutter rattles but stays shut, the slip carries on past
  const arrive = tw(g, K.checking + 2, K.true_ - K.checking - 2, E.out);
  const leave = tw(g, K.different - 2, 18, E.in);
  const sx = lerp(-260, 150, arrive) + leave * 520 + 6 * ring(g, K.true_, 1.2, 0.35);
  const rattle = 3 * ring(g, K.true_, 2.4, 0.25);
  const swing = 9 * ring(g, K.is, 0.5, 0.1);
  const capT = sp(g, K.job, SNAP);
  const belt = (g * 4) % 40;
  return (
    <div style={{position: 'absolute', inset: 0, background: C.tealLight, border: `${OUTLINE}px solid ${C.ink}`, borderRadius: 24, boxShadow: `8px 10px 0 ${C.shadow}`, overflow: 'hidden'}}>
      {/* booth */}
      <div style={{position: 'absolute', left: 100, top: 36, width: 340, height: 290, background: C.cream, border: `${OUTLINE}px solid ${C.ink}`, borderRadius: 16}}>
        <div style={{position: 'absolute', left: -4, right: -4, top: -4, height: 62, background: C.teal, border: `${OUTLINE}px solid ${C.ink}`, borderRadius: '16px 16px 0 0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: F.display, fontWeight: 700, fontSize: 34, color: C.white}}>EVIDENCE CHECK</div>
        <div style={{position: 'absolute', right: 14, top: 76, width: 26, height: 26, borderRadius: 13, background: C.inkMuted, border: `3px solid ${C.ink}`}} />
        {/* window with a closed shutter */}
        <div style={{position: 'absolute', left: 40, top: 80, width: 230, height: 160, background: C.inkMuted, border: `${OUTLINE}px solid ${C.ink}`, borderRadius: 8, transform: `translateX(${rattle}px)`, overflow: 'hidden'}}>
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} style={{position: 'absolute', left: 0, right: 0, top: 12 + i * 25, height: 5, background: C.ink, opacity: 0.45}} />
          ))}
        </div>
        <div style={{position: 'absolute', left: 95, top: 108, transform: `rotate(${swing}deg)`, transformOrigin: '60px -10px'}}>
          <div style={{position: 'absolute', left: 30, top: -14, width: 3, height: 16, background: C.ink, transform: 'rotate(-30deg)'}} />
          <div style={{position: 'absolute', left: 86, top: -14, width: 3, height: 16, background: C.ink, transform: 'rotate(30deg)'}} />
          <div style={{background: C.coral, color: C.white, border: `3px solid ${C.ink}`, borderRadius: 8, padding: '4px 12px', fontFamily: F.display, fontWeight: 700, fontSize: 30}}>CLOSED</div>
        </div>
      </div>
      {/* belt */}
      <div style={{position: 'absolute', left: -10, right: -10, top: 392, height: 26, background: C.inkSoft, border: `${OUTLINE}px solid ${C.ink}`, borderRadius: 13, backgroundImage: `repeating-linear-gradient(90deg, rgba(255,255,255,0.18) 0 6px, transparent 6px 40px)`, backgroundPosition: `${belt}px 0`}} />
      {/* the slip riding it */}
      <div style={{position: 'absolute', left: sx, top: 330, width: 240, height: 64, background: C.cream, border: `${OUTLINE}px solid ${C.ink}`, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: F.serif, fontSize: 28, color: C.ink, transform: `rotate(${-2 + leave * 6}deg)`, boxShadow: `3px 4px 0 ${C.shadow}`}}>
        …in 2002 at CMU
      </div>
      {capT > 0 && (
        <div style={{position: 'absolute', left: 0, right: 0, top: 446, textAlign: 'center', transform: `scale(${lerp(1.3, 1, Math.min(1, capT))})`}}>
          <span style={{fontFamily: F.body, fontWeight: 800, fontSize: 32, color: C.coralDeep}}>not on the writing route</span>
        </div>
      )}
    </div>
  );
};

const Card3: React.FC<{g: number}> = ({g}) => {
  const vG = steps(g, STEPS_G) + (g >= K.quietly + 2 ? Math.min(1.06, sp(g, K.quietly + 2, SNAP)) : 0);
  const vH = steps(g, STEPS_H);
  const pulse = bell(g, K.reward, 12);
  const sag = tw(g, K.reward + 2, 8) * 4;
  // the stamp lands hard: a 3-frame drop from 1.35x, squash on contact, the card jolts (ClaimCard)
  const stIn = tw(g, STAMP - 3, 3, E.in);
  const [ix, iy] = impact(g, STAMP, 0.14, 9);
  const board = (v: number, bg: string, label: string, x: number, extra: React.CSSProperties) => (
    <div style={{position: 'absolute', left: x, top: 60, width: 200, textAlign: 'center', ...extra}}>
      <div style={{display: 'inline-block', border: `${OUTLINE}px solid ${C.ink}`, borderRadius: 22, boxShadow: `6px 8px 0 ${C.shadow}`}}>
        <RollingNumber from={0} to={1} t={v} size={120} bg={bg} />
      </div>
      <div style={{marginTop: 14, display: 'inline-block', background: C.cream, border: `3px solid ${C.ink}`, borderRadius: 10, padding: '2px 16px', fontFamily: F.body, fontWeight: 800, fontSize: 38, color: C.ink}}>{label}</div>
    </div>
  );
  return (
    <div style={{position: 'absolute', inset: 0, background: C.saffronLight, border: `${OUTLINE}px solid ${C.ink}`, borderRadius: 24, boxShadow: `8px 10px 0 ${C.shadow}`, overflow: 'hidden'}}>
      {board(vG, C.coral, 'guesser', 50, {transform: `scale(${1 + 0.07 * pulse})`, transformOrigin: '50% 100%'})}
      {board(vH, C.ink, 'honest', 290, {transform: `translateY(${sag}px)`})}
      {g >= STAMP - 3 && (
        <div style={{position: 'absolute', left: 0, right: 0, top: 372, textAlign: 'center', transform: g < STAMP ? `scale(${lerp(1.35, 1, stIn)})` : `scale(${ix}, ${iy})`}}>
          <StampMark text="Guessing pays" tone="coral" t={1} size={46} rotate={-5} />
        </div>
      )}
    </div>
  );
};

const LABELS: [string, string][] = [
  ['Built to write', 'what’s likely'],
  ['Checking if it’s true', 'is a different job'],
  ['Some tests quietly', 'reward guessing'],
];
const LABEL_TONE = [C.blueDeep, C.tealDeep, C.coralDeep];

const ClaimCard: React.FC<{g: number; i: number; active: number}> = ({g, i, active}) => {
  const land = LAND[i];
  const y = drop(g, land, 760, 10);
  if (g < land - 10) return null;
  const u = tw(g, FLIP[i], 10, E.inOut);
  const sx = Math.abs(Math.cos(u * Math.PI));
  const face = u >= 0.5;
  const lift = bell(g, FLIP[i], 10) * 0.05;
  const settle = ring(g, land, 0.7, 0.2) * 1.2;
  // the card being talked about stays bright; the others recede until the summary
  const focus = active < 0 ? 1 : active === i ? 1 : 0;
  const dimT = active < 0 ? 0 : 1 - focus;
  const labelT = face ? sp(g, FLIP[i] + 6, SNAP) : 0;
  const emph = i === 0 ? bell(g, K.likely, 16) : i === 1 ? bell(g, K.different, 18) : bell(g, K.reward, 18);
  const jolt = i === 2 ? 3 * ring(g, STAMP, 1.6, 0.4) : 0;
  return (
    <div style={{position: 'absolute', left: CX[i], top: CY + y + jolt, width: CW, height: CH + 140, transform: `scale(${1 - 0.03 * dimT})`, transformOrigin: '50% 40%', opacity: 1 - 0.38 * dimT}}>
      <div style={{position: 'absolute', left: 0, top: 0, width: CW, height: CH, transform: `rotate(${settle}deg) scale(${sx * (1 + lift)}, ${1 + lift})`, transformOrigin: '50% 50%'}}>
        {face ? (i === 0 ? <Card1 g={g} /> : i === 1 ? <Card2 g={g} /> : <Card3 g={g} />) : <CardBack n={i + 1} />}
      </div>
      {labelT > 0 && (
        <div style={{position: 'absolute', left: -20, right: -20, top: CH + 22 + (1 - Math.min(1, labelT)) * 16, textAlign: 'center', opacity: Math.min(1, labelT * 2)}}>
          <Headline size={44} style={{lineHeight: 1.08}}>
            {LABELS[i][0]}
            <br />
            <span style={{color: emph > 0.05 ? LABEL_TONE[i] : C.ink, display: 'inline-block', transform: `scale(${1 + 0.06 * emph})`}}>{LABELS[i][1]}</span>
          </Headline>
        </div>
      )}
    </div>
  );
};

/* ------------------------------------------------------------------ scene */
export const S2ShortVersion: React.FC = () => {
  const g = useG();
  useFontsReady();
  const cam = camPath(g, {cx: 960, cy: 540, zoom: 1}, [
    {at: K.wrong - 4, dur: K.sure + 8 - (K.wrong - 4), to: {cx: 960, cy: 430, zoom: 1.05}, ease: E.inOut},
    {at: K.heres, dur: 16, to: {cx: 960, cy: 540, zoom: 1}},
  ]);
  // slip A: arrives at HANDOFF (cut from S1), settles, hops on "sure?", then slides away on "Here's"
  const settle = sp(g, K.start, SOFT);
  const hopY = hop(g, K.sure + 4, 8, 10);
  const away = tw(g, K.heres - 3, 13, E.in);
  const [ax, ay] = impact(g, K.start + 6, 0.16, 8); // WRONG after-thump
  const slip = {
    cx: HANDOFF.cx - away * 120,
    cy: HANDOFF.cy + 6 * Math.sin(Math.min(1, settle) * Math.PI) + hopY + away * 760,
    scale: HANDOFF.scale * (1 - 0.015 * Math.min(1, settle)),
    rot: HANDOFF.rot + away * 8 + 0.4 * Math.sin(g / 30),
  };
  const glint = g < K.sure + 22 ? tw(g, K.sure + 6, 16, E.inOut) : 0;
  const chipT = sp(g, K.short - 2, SNAP);
  const active = g < FLIP[0] ? -1 : g >= STAMP + 8 ? -1 : g >= FLIP[2] ? 2 : g >= FLIP[1] ? 1 : 0;
  const citeT = sp(g, K.tests + 4, SNAP);
  // the brand card
  const cardY = drop(g, STING, 1150, 12) - tw(g, LIFT, 13, E.in) * 1200;
  const covered = g >= STING + 2;
  // capped so the words' overshoot never runs FUTURE / GOT / WEIRD into each other
  const pop = (f: number) => Math.min(1.05, sp(g, f, SNAP));
  const rev: [number, number, number] = [pop(STING + 2), pop(STING + 6), pop(STING + 10)];
  const push = tw(g, STING - 6, 8) * 0.03;
  return (
    <AbsoluteFill style={{background: g >= LIFT - 2 ? 'transparent' : C.paper}}>
      {!covered && (
        <AbsoluteFill style={{transform: `scale(${1 - push})`}}>
          <Camera cam={cam}>
            <Layer depth={1}>
              <Title g={g} />
              {away < 1 && <SlipOnScreen i={0} cx={slip.cx} cy={slip.cy} scale={slip.scale} rot={slip.rot} marks={{...SLIP_A_FINAL.marks, glint}} stamps={[{text: 'Wrong', sx: ax, sy: ay}]} />}
              {[0, 1, 2].map((i) => (
                <ClaimCard key={i} g={g} i={i} active={active} />
              ))}
              {/* drawn after the cards so card 2 drops and bounces behind the label */}
              {chipT > 0 && (
                <div style={{position: 'absolute', left: 0, right: 0, top: 54 + (1 - Math.min(1, chipT)) * -60, textAlign: 'center'}}>
                  <Chip tone="ink" size={42}>
                    The short version
                  </Chip>
                </div>
              )}
              {citeT > 0 && (
                <div style={{position: 'absolute', left: 0, right: 0, top: 884 + (1 - Math.min(1, citeT)) * 30, textAlign: 'center', opacity: Math.min(1, citeT * 2)}}>
                  <Chip tone="paper" size={30}>
                    argued in Kalai, Nachum, Vempala &amp; Zhang (2025) · simplified
                  </Chip>
                </div>
              )}
            </Layer>
          </Camera>
        </AbsoluteFill>
      )}
      {/* the brand card: drops in over the cards, builds, then lifts away to reveal the conveyor */}
      {g >= STING - 12 && cardY > -1150 && (
        <AbsoluteFill style={{transform: `translateY(${cardY}px)`}}>
          <AbsoluteFill style={{background: C.saffron, borderBottom: `6px solid ${C.ink}`, boxShadow: '0 18px 0 rgba(22,42,50,0.18)'}} />
          <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center'}}>
            <div style={{position: 'relative', zIndex: 0}}>
            <Wordmark size={150} tagline reveal={rev} underline={C.cream} underlineT={tw(g, STING + 12, 9, E.out)} taglineT={[sp(g, STING + 16, SOFT), sp(g, STING + 23, SOFT)]} />
            </div>
          </AbsoluteFill>
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};
