// Short v3 (owner's revision brief, 16 Oct 2026): bright real Roadster in frame 0, upside-down and launch footage by
// 0.5 s, two explainers built on the traced car / real footage, the Semi hop as the mid-video payoff, one quick trim
// beat, and a last shot that runs straight into the first (the seam is the broadcast's own camera cut at 38.12–38.14 s).
import React from 'react';
import {AbsoluteFill, Audio, Sequence, interpolate, staticFile, useCurrentFrame} from 'remotion';
import data from '../data/short3_words.json';
import {Clip, ClipProps} from './Clip';
import {Suction} from './Suction';
import {Airborne} from './Airborne';
import {PhraseCaptions, RocketBeat, SourceChip, ZeroSixty} from './Overlays';

const FPS = 30;
const words = data.words;
const w = (text: string, n = 0) => words.filter((x) => x.w.replace(/[.,?!]+$/, '') === text)[n].s;
export const V3_DURATION = 36.733;
export const V3_FRAMES = Math.round(V3_DURATION * FPS); // 1102

type Shot = {id: string; a: number; b: number; clip?: ClipProps; node?: React.ReactNode};
const hopSideCx: [number, number][] = [
  // rec_224911 side replay, file = source - 33.8 s; car centre x / 1920 (hand-keyed from gridded frames)
  [2.05, 0.5625], [2.2, 0.546], [2.4, 0.518], [2.6, 0.49], [2.8, 0.455], [3.0, 0.42], [3.2, 0.382], [3.4, 0.34],
  [3.6, 0.31], [3.8, 0.3], [4.0, 0.297], [4.2, 0.365], [4.32, 0.396], [4.33, 0.432], [4.4, 0.44], [4.5, 0.461], [4.7, 0.516], [4.9, 0.557], [5.05, 0.585],
];

const SHOTS: Shot[] = [
  // 0–0.53: hero. The Roadster upright in midair on two gas jets, bright, whole car in frame (rec_224911 38.30–38.83;
  // the loop seam skips 0.2 s across the broadcast's own camera cut)
  {id: 's01', a: 0, b: 0.53, clip: {src: 'v3_hop_side.mp4', from: 4.5, cx: hopSideCx, volume: 0.35}},
  // "…unveiled Roadster": top view of the car on the ramp (first run)
  {id: 's02', a: 0.53, b: w('hung'), clip: {src: 'v3_overhead.mp4', from: 1.3, cx: 0.515, cy: 0.5, zoom: 1.1, push: 0.08}},
  // "hung upside down on a ramp": close-up from below, first run
  {id: 's03', a: w('hung'), b: w('On') - 0.06, clip: {src: 'v3_inverted.mp4', from: 0.6, cx: 0.36, cy: 0.42, zoom: 1.05, push: 0.06}},
  // "On another run, it flew off, rolled upright,": aerial, second run, leaves the ramp and rolls on its jets
  {id: 's04', a: w('On') - 0.06, b: 5.85, clip: {src: 'v3_ramp_aerial.mp4', from: 1.32, cx: [[1.32, 0.57], [2.5, 0.565], [3.0, 0.54], [3.5, 0.45], [3.75, 0.47]], cy: 0.33, zoom: 1.25}},
  // "and landed.": same run, settling into its landing
  {id: 's05', a: 5.85, b: w('How') - 0.06, clip: {src: 'v3_ramp_aerial.mp4', from: 7.1, cx: 0.52, cy: 0.43, zoom: 1.25}},
  // "How does a car stick upside down?": back under the ramp, slow push toward the car's floor (ends at 1:19.85,
  // before Tesla's close-up cuts to the dark wide shot at 1:19.90)
  {id: 's06', a: w('How') - 0.06, b: w('Tesla', 0) - 0.08, clip: {src: 'v3_inverted.mp4', from: 1.75, rate: 0.65, cx: 0.36, cy: 0.42, zoom: 1.1, push: 0.2}},
];

export const ShortV3: React.FC<{audio?: boolean}> = ({audio = true}) => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const suctionStart = w('Tesla', 0) - 0.08;
  const airStart = w('Once') - 0.08;
  const semiStart = w('It', 0) - 0.08;
  const zeroStart = w('Zero') - 0.15;
  const liveCut = 24.7;
  const rocketStart = w('And') - 0.1;
  const flewStart = w('So') - 0.16;
  const endStart = w('A') - 0.13;
  const seq = (a: number, b: number, node: React.ReactNode, key: string) => (
    <Sequence key={key} from={Math.round(a * FPS)} durationInFrames={Math.round(b * FPS) - Math.round(a * FPS)}>{node}</Sequence>
  );
  // a short white flash on the cut into each explainer
  const flash = Math.max(
    interpolate(t, [suctionStart, suctionStart + 0.12], [0.55, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}) * (t >= suctionStart ? 1 : 0),
    interpolate(t, [airStart, airStart + 0.12], [0.45, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}) * (t >= airStart ? 1 : 0),
  );
  return (
    <AbsoluteFill style={{background: '#000'}}>
      {SHOTS.map((s) => seq(s.a, s.b, <Clip {...s.clip!} />, s.id))}
      {seq(suctionStart, airStart, <Suction start={suctionStart} cues={{pull: w('pull'), thin: w('thin'), lower: w('Lower'), normal: w('normal'), presses: w('presses'), ramp: w('ramp', 1)}} />, 's07')}
      {seq(airStart, semiStart, <Airborne from={0.6} start={airStart} cues={{jets: w('compressed-gas'), rotate: w('rotate'), hold: w('hold')}} />, 's08')}
      {/* the Semi hop, front angle then side: approach, lift over the row, flip above the Semi, touchdown (real sound) */}
      {seq(semiStart, zeroStart, <Clip src="v3_hop_front.mp4" from={1.6} cx={[[1.6, 0.5], [3.16, 0.5], [3.17, 0.6], [4.7, 0.6]]} volume={(x) => interpolate(x, [0, 0.4, 2.6, 3.0], [0.35, 0.6, 0.6, 0.3])} />, 's09')}
      {/* 0–60: the live run (no on-screen timer), real launch blast, then the launch at 0.4x */}
      {seq(zeroStart, liveCut, <Clip src="v3_live.mp4" from={0.6 + (zeroStart - 23.45)} cx={0.57} cy={0.55} />, 's10a')}
      {seq(liveCut, rocketStart, <Clip src="v3_live_slow.mp4" from={0} cx={[[0, 0.56], [0.5, 0.52], [0.75, 0.41], [1.0, 0.27], [1.25, 0.2], [2.9, 0.28]]} cy={0.55} />, 's10b')}
      {seq(zeroStart, rocketStart, <ZeroSixty start={zeroStart} cues={{zero: w('Zero'), num: w('0.81'), numEnd: words.find((x) => x.w === '0.81')!.e, own: w('by')}} />, 'o10')}
      {/* which version flies: aerial replay of the hop, dimmed under the one trim beat */}
      {seq(rocketStart, flewStart, <Clip src="v3_hop_aerial.mp4" from={2.4} cx={0.68} cy={0.32} dim={0.5} volume={0.2} />, 's11')}
      {seq(rocketStart, flewStart, <RocketBeat start={rocketStart} cues={{flight: w('flight'), lists: w('lists'), rocket: w('Rocket'), approved: w('approved')}} />, 'o11')}
      {/* "So the demo flew.": midair on its jets, aerial */}
      {seq(flewStart, endStart, <Clip src="v3_ramp_aerial.mp4" from={5.0} cx={0.495} cy={0.38} zoom={1.25} />, 's12')}
      {/* last shot: the hop flip in real time, ending one frame before the broadcast cut that frame 0 follows */}
      {seq(endStart, V3_DURATION, <Clip src="v3_hop_side.mp4" from={4.317 - (V3_DURATION - endStart)} cx={hopSideCx} volume={0.35} />, 's13')}
      {flash > 0 && <AbsoluteFill style={{background: '#fff', opacity: flash}} />}
      <SourceChip until={w('On')} />
      <PhraseCaptions words={words} sizes={[4, 6, 6, 4, 7, 6, 6, 3, 3, 5, 5, 3, 6, 4, 8, 2, 3, 6, 2, 8, 8, 4, 4, 2]} y={1290} end={V3_DURATION} />
      {audio && <Audio src={staticFile('short3/narration.wav')} />}
      {audio && <Audio src={staticFile('short3/sfx.wav')} />}
      {/* real launch blast of the live run, at speed, over the cut into slow motion */}
      {audio && (
        <Sequence from={Math.round((liveCut - 0.3) * FPS)} durationInFrames={Math.round(1.7 * FPS)}>
          <Audio src={staticFile('footage/v3_live.mp4')} trimBefore={Math.round(1.55 * FPS)} volume={(f) => interpolate(f, [0, 3, 30, 51], [0, 0.85, 0.7, 0], {extrapolateRight: 'clamp'})} />
        </Sequence>
      )}
    </AbsoluteFill>
  );
};
