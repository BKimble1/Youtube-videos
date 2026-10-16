import React from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import words from '../data/short_words.json';
import {C} from '../theme';
import {E, tw} from '../lib/motion';
import {Paper, Chip} from '../kit/base';
import {Captions, Word} from '../kit/Captions';
import {FootageShot, SlotId} from '../kit/Footage';
import {SuctionDiagram, ThrusterDiagram} from '../kit/Diagrams';
import {AccelCard, TargetCard, TrimCards} from '../kit/Cards';

export const FPS = 30;
const fr = (s: number) => Math.round(s * FPS);

/**
 * Shot list in seconds, cut to the selected narration take (short_t4_KPLc, word times in data/short_words.json).
 * Footage shots play official Tesla clips from data/footage.json; anim shots are our own vector explainers.
 */
type Shot =
  | {id: string; a: number; b: number; kind: 'foot'; slot: SlotId; offset?: number; push?: number}
  | {id: string; a: number; b: number; kind: 'suction' | 'thrust' | 'trims' | 'accel' | 'target'};

export const SHOTS: Shot[] = [
  {id: 'sh01', a: 0.0, b: 2.4, kind: 'foot', slot: 'F1_AIRBORNE', push: 0.05},        // "Tesla just made its Roadster FLY."
  {id: 'sh02', a: 2.4, b: 4.4, kind: 'foot', slot: 'F2_RAMP_CLIMB'},                   // "It drove up a curved ramp until it hung"
  {id: 'sh03', a: 4.4, b: 5.8, kind: 'foot', slot: 'F3_INVERTED'},                     // "upside down…"
  {id: 'sh04', a: 5.8, b: 8.7, kind: 'foot', slot: 'F4_LAUNCH_ROLL'},                  // "then launched off, rolled itself upright in midair,"
  {id: 'sh05', a: 8.7, b: 9.95, kind: 'foot', slot: 'F5_LANDING'},                     // "and landed."
  {id: 'sh06', a: 9.95, b: 10.6, kind: 'foot', slot: 'F3_INVERTED', offset: 1.4, push: 0.12}, // match-cut source: the real underside
  {id: 'sh07', a: 10.6, b: 13.95, kind: 'suction'},                                    // "…fans pull air from under the car, pinning it to the ramp."
  {id: 'sh08', a: 13.95, b: 17.65, kind: 'thrust'},                                    // "In the air, jets of compressed gas help control the roll."
  {id: 'sh09', a: 17.65, b: 21.88, kind: 'foot', slot: 'F6_FIVE_VEHICLES'},            // "It even cleared five of Tesla's own vehicles — a Semi included."
  {id: 'sh10', a: 21.88, b: 29.85, kind: 'trims'},                                     // "But the version that flies is the Rocket … public roads."
  {id: 'sh11', a: 29.85, b: 34.55, kind: 'accel'},                                     // "That 0 to 60 in 0.81 seconds? Tesla's own test."
  {id: 'sh12', a: 34.55, b: 36.92, kind: 'target'},                                    // "Production is targeted for 2028."
  {id: 'sh13', a: 36.92, b: 38.7, kind: 'foot', slot: 'F5_LANDING', offset: 0.2},      // "So yes, the demo flew." (landing replay)
  {id: 'sh14', a: 38.7, b: 42.1, kind: 'foot', slot: 'F1_AIRBORNE', offset: -3.4, push: 0.03}, // "The flying commute? Still a question." ends on frame 0's image (loop)
];
export const SHORT_FRAMES = fr(42.1);
export const SHORT_SLOTS = Array.from(new Set(SHOTS.flatMap((s) => (s.kind === 'foot' ? [s.slot] : [])))) as SlotId[];

const at = (word: string, after = 0) => {
  const w = (words.words as Word[]).find((x) => x.w.startsWith(word) && x.s >= after);
  if (!w) throw new Error('cue word not found: ' + word);
  return w.s;
};

/** Iris reveal for the first frames of an animated shot (the footage stays visible outside the circle). */
const Iris: React.FC<{children: React.ReactNode; cx?: number; cy?: number; dur?: number}> = ({children, cx = 540, cy = 640, dur = 8}) => {
  const f = useCurrentFrame();
  const r = tw(f, 0, dur, E.inOut) * 2300;
  return <AbsoluteFill style={{clipPath: f >= dur ? undefined : `circle(${r}px at ${cx}px ${cy}px)`}}>{children}</AbsoluteFill>;
};

/** Push-in from below for anim→anim changes. */
const PushIn: React.FC<{children: React.ReactNode; dur?: number}> = ({children, dur = 8}) => {
  const f = useCurrentFrame();
  const u = tw(f, 0, dur, E.out);
  return <AbsoluteFill style={{transform: `translateY(${(1 - u) * 420}px)`, opacity: Math.min(1, u * 1.6)}}>{children}</AbsoluteFill>;
};

const DiagramStage: React.FC<{children: React.ReactNode; chip?: string}> = ({children, chip = "ILLUSTRATION · not Tesla's actual layout"}) => (
  <Paper>
    <div style={{position: 'absolute', left: 0, right: 0, top: 230, textAlign: 'center'}}>
      <Chip text={chip} kind="illus" size={30} />
    </div>
    <div style={{position: 'absolute', left: 0, top: 260, width: 1080, height: 1080}}>{children}</div>
  </Paper>
);

const AnimShot: React.FC<{shot: Shot}> = ({shot}) => {
  const f = useCurrentFrame();
  const t0 = shot.a;
  switch (shot.kind) {
    case 'suction':
      return <Iris cx={540} cy={700}><DiagramStage><SuctionDiagram f={f + 4} /></DiagramStage></Iris>;
    case 'thrust':
      return <PushIn><DiagramStage><ThrusterDiagram f={f} /></DiagramStage></PushIn>;
    case 'trims':
      return (
        <Paper>
          <div style={{position: 'absolute', left: 80, top: 250}}>
            <TrimCards f={f} highlightAt={fr(at('Rocket') - t0) - 2} stampAt={fr(at('approved') - t0)} />
          </div>
        </Paper>
      );
    case 'accel':
      return (
        <PushIn>
          <Paper><div style={{position: 'absolute', left: 80, top: 260}}><AccelCard f={f} tagAt={fr(at("Tesla's", 32) - t0)} /></div></Paper>
        </PushIn>
      );
    case 'target':
      return (
        <PushIn>
          <Paper><div style={{position: 'absolute', left: 80, top: 330}}><TargetCard f={f} /></div></Paper>
        </PushIn>
      );
    default:
      return null;
  }
};

export const ShortMain: React.FC<{audio?: boolean}> = ({audio = true}) => {
  const {width} = useVideoConfig();
  return (
    <AbsoluteFill style={{background: C.paper, width}}>
      {SHOTS.map((s) => (
        <Sequence key={s.id} from={fr(s.a)} durationInFrames={fr(s.b) - fr(s.a)} name={s.id}>
          {s.kind === 'foot' ? <FootageShot id={s.slot} offset={s.offset ?? 0} push={s.push ?? 0.04} /> : <AnimShot shot={s} />}
        </Sequence>
      ))}
      <Captions words={words.words as Word[]} y={1340} size={68} />
      {audio && <Audio src={staticFile('short/narration_short.mp3')} />}
      {audio && <Audio src={staticFile('short/sfx_short.wav')} />}
    </AbsoluteFill>
  );
};
