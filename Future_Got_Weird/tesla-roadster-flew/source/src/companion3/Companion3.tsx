// Companion v3 (16:9): "Tesla's Roadster Actually Flew. Here's How." Timeline driven by the placed narration
// (data/companion3_words.json, built by tools/build_c3_narration.py from audio/companion_v3/plan.json).
//   0.0  real stunt (the hop), the real hang, match into the drawn car; two systems; stick, throw, land, air dial
//  15.4  grip: one connected scene in the demonstration bay (fans, seal, thinner gap air, the push, the climb, 2 g)
//  43.9  leaving the ramp: the surface ends, air floods in, the grip goes, the hall opens; tank, valve, nozzle
//  71.6  rear view: off-centre push, roll, opposite pair, downward thrust, hover needs thrust = weight; landing
//  89.9  the real second run (end-on, real speed)
//  94.9  the same push on the ground, the launch; the stream's recorded run with its own timer; shown vs claimed
// 113.9  versions on a moving assembly line; 130.3 the air supply; 143.7 the opening shot again, landing, the Crew
import React from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {FPS} from './kit3';
import {BayScene, TraceOverlay} from './BayScene';
import {OpeningFoot, OPEN3} from './OpeningFoot';
import {RollRear, ROLL} from './RollRear';
import {Shop, SHOP, ShownTag} from './Shop';
import {Foot} from '../companion2/Foot';
import {ev} from './kit3';

export const C3_DURATION = 166.5;
export const C3_FRAMES = Math.round(C3_DURATION * FPS);

const seq = (a: number, b: number, node: React.ReactNode, key: string) => (
  <Sequence key={key} from={Math.round(a * FPS)} durationInFrames={Math.round(b * FPS) - Math.round(a * FPS)}>{node}</Sequence>
);

const Bay: React.FC<{from: number}> = ({from}) => {
  const f = useCurrentFrame();
  return <BayScene t={from + f / FPS} />;
};
const Trace: React.FC<{from: number}> = ({from}) => {
  const f = useCurrentFrame();
  return <TraceOverlay t={from + f / FPS} />;
};

const ShopFrom: React.FC<{from: number}> = ({from}) => <Sequence from={-Math.round((from - SHOP.start) * FPS)}><Shop /></Sequence>;
const RecRun: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <Foot src="c3_rec_run.mp4" volume={ev(0.9, SHOP.footA)} />
      <ShownTag t={SHOP.footA + f / FPS} at={SHOP.footA + 2.47} />
    </AbsoluteFill>
  );
};

export const Companion3: React.FC<{audio?: boolean; narration?: boolean}> = ({audio = true, narration = true}) => (
  <AbsoluteFill style={{background: '#000'}}>
    {seq(4.2, 71.6, <Bay from={4.2} />, 'bay1')}
    {seq(0, OPEN3.end, <OpeningFoot />, 'open')}
    {seq(ROLL.start, ROLL.end, <RollRear />, 'roll')}
    {/* the real second run, end-on, its own speed (silent recording) */}
    {seq(ROLL.end, SHOP.start, <Foot src="c3_roll_real.mp4" muted />, 'rollreal')}
    {seq(SHOP.start, SHOP.footA, <Shop />, 'shop1')}
    {/* the stream's recorded run with its own timer and sound; the timer stops at 01.00 about 2.45 s in */}
    {seq(SHOP.footA, SHOP.footB, <RecRun />, 'recrun')}
    {seq(SHOP.footB, SHOP.end, <ShopFrom from={SHOP.footB} />, 'shop2')}
    {seq(4.1, 5.0, <Trace from={4.1} />, 'trace')}
    {seq(143.7, C3_DURATION, <Bay from={143.7} />, 'bay2')}
    {audio && narration && <Audio src={staticFile('companion3/narration.wav')} />}
    {audio && <Audio src={staticFile('companion3/bed.wav')} />}
  </AbsoluteFill>
);
