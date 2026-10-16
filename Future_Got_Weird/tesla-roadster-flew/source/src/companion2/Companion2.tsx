// Companion v2 (16:9): "Tesla's Roadster Actually Flew. Here's How." Timeline driven by the placed narration
// (data/companion2_words.json, built by tools/build_c2_narration.py from audio/companion_v2/plan.json).
//   0.0  opening: second run from the air; the first run's hang with the Crew; match into the illustration
//  12.9  mechanism 1, pressure: one connected illustrated scene (fan-car aside 65.6-74.4), the car leaves the ramp
//  80.6  mechanism 2, gas thrust: real footage, conceptual tank, zero-g analogy, rear-view roll, arrows on footage
// 123.9  the hop over a row of Teslas (real sound)    131.6 performance (0-60)    150.7 the three versions
// 173.2  mechanism 3, the limits    186.7 the answer over real airborne footage, one Crew reaction
import React from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile} from 'remotion';
import {FPS, speechFree, Tag} from './kit';
import {RampScene} from './RampScene';
import {Opening, OPEN} from './Opening';
import {FanCarAside} from './FanCarAside';
import {TankDiagram} from './TankDiagram';
import {Floating} from './Floating';
import {ThrustDiagram} from './ThrustDiagram';
import {FootVectors, FV} from './FootVectors';
import {Perf, PERF} from './Perf';
import {Versions} from './Versions';
import {Limits, LIM, Ending, END} from './LimitsEnd';
import {Foot} from './Foot';

export const C2_DURATION = END.end;
export const C2_FRAMES = Math.round(C2_DURATION * FPS);
export const STUNT = {start: FV.end, side: 129.15, end: PERF.start};

const seq = (a: number, b: number, node: React.ReactNode, key: string) => (
  <Sequence key={key} from={Math.round(a * FPS)} durationInFrames={Math.round(b * FPS) - Math.round(a * FPS)}>{node}</Sequence>
);
/** Event sound for a shot that starts at film time s0: ducked under every word, full in the pauses. */
const ev = (base: number, s0: number) => (ts: number) => base * (0.1 + 0.9 * speechFree(s0 + ts));

export const Companion2: React.FC<{audio?: boolean; narration?: boolean}> = ({audio = true, narration = true}) => (
  <AbsoluteFill style={{background: '#000'}}>
    {seq(12.9, 65.55, <RampScene start={12.9} />, 'ramp')}
    {seq(0, OPEN.matchEnd, <Opening />, 'open')}
    {seq(65.55, 74.4, <FanCarAside start={65.55} />, 'aside')}
    {seq(74.4, 80.6, <RampScene start={74.4} />, 'ramp2')}
    {seq(80.6, 85.05, <><Foot src="c2_side_run2.mp4" muted /><Tag kind="footage" text="Tesla footage · second run" /></>, 'run2')}
    {seq(85.05, 91.0, <TankDiagram start={85.05} />, 'tank')}
    {seq(91.0, 98.6, <Floating start={91.0} end={98.6} />, 'float')}
    {seq(98.6, FV.hopStart, <ThrustDiagram start={98.6} end={FV.hopStart} />, 'thrust')}
    {seq(FV.hopStart, FV.end, <FootVectors />, 'vectors')}
    {/* the hop, live: front angle (lift-off at 20.0) and Tesla's cut to the side angle, then the side replay's lift-off beside the row */}
    {seq(STUNT.start, STUNT.side, <><Foot src="c2_hop_front.mp4" from={0.25} volume={ev(0.8, STUNT.start)} /><Tag kind="footage" text="Tesla footage · the hop, live" /></>, 'hop')}
    {seq(STUNT.side, STUNT.end, <><Foot src="c2_hop_siderep.mp4" volume={ev(0.6, STUNT.side)} /><Tag kind="footage" text="Tesla footage · the hop, replay" /></>, 'hop2')}
    {seq(PERF.start, PERF.end, <Perf />, 'perf')}
    {seq(PERF.end, LIM.start, <Versions start={PERF.end} end={LIM.start} />, 'versions')}
    {seq(LIM.start, LIM.end, <Limits />, 'limits')}
    {seq(END.start, END.end, <Ending />, 'end')}
    {audio && narration && <Audio src={staticFile('companion2/narration.wav')} />}
    {audio && <Audio src={staticFile('companion2/bed.wav')} />}
  </AbsoluteFill>
);
