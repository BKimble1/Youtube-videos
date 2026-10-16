// Short v4 (owner's final pass on v3): airborne lift-off held 1.6 s in frame 0, "And hang upside down" on the car under
// the ramp, a three-beat suction diagram (6.3 s), 0–60 labels on the stream's timed run, and a short close on a clear
// airborne shot. Shared pieces (Clip, Airborne, RocketBeat, PhraseCaptions, the traced Roadster) come from short3/.
import React from 'react';
import {AbsoluteFill, Audio, Sequence, interpolate, staticFile, useCurrentFrame} from 'remotion';
import data from '../data/short4_words.json';
import {Clip} from '../short3/Clip';
import {Airborne} from '../short3/Airborne';
import {PhraseCaptions, RocketBeat} from '../short3/Overlays';
import {Suction4} from './Suction4';
import {SourceChip4, ZeroSixty4} from './Overlays4';

const FPS = 30;
const words = data.words;
const w = (text: string, n = 0) => words.filter((x) => x.w.replace(/[.,?!]+$/, '') === text)[n].s;
const lastWord = words[words.length - 1];
export const V4_DURATION = Math.round((lastWord.e + 0.5) * FPS) / FPS;
export const V4_FRAMES = Math.round(V4_DURATION * FPS);

export const ShortV4: React.FC<{audio?: boolean; narration?: boolean}> = ({audio = true, narration = true}) => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const invStart = w('fly') + 0.33;            // just after "fly." lands, before "And"
  const suctionStart = w('Tesla', 1) - 0.08;  // "Tesla says…"
  const airStart = w('Once') - 0.2;
  const semiStart = w('It', 0) - 0.08;        // "It even cleared…"
  const zeroStart = w('Zero') - 0.08;
  const overheadCut = zeroStart + 2.56;        // side angle through the timer reaching 01.00, then the overhead replay
  const rocketStart = w('And', 1) - 0.1;      // "And flight?"
  const endStart = w('It', 1) - 0.08;         // "It flew."
  const seq = (a: number, b: number, node: React.ReactNode, key: string) => (
    <Sequence key={key} from={Math.round(a * FPS)} durationInFrames={Math.round(b * FPS) - Math.round(a * FPS)}>{node}</Sequence>
  );
  const flash = Math.max(
    interpolate(t, [suctionStart, suctionStart + 0.12], [0.5, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}) * (t >= suctionStart ? 1 : 0),
    interpolate(t, [airStart, airStart + 0.12], [0.4, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}) * (t >= airStart ? 1 : 0),
  );
  return (
    <AbsoluteFill style={{background: '#000'}}>
      {/* 1. lift-off: rec_224911 0:34.45–0:35.76 (side replay), 0.84x, the car rising on its jets above the parked Teslas */}
      {seq(0, invStart, <Clip src="v4_open.mp4" from={0} cx={[[0, 0.446], [0.42, 0.462], [0.89, 0.49], [1.31, 0.57], [1.49, 0.59], [1.6, 0.6]]} />, 's01')}
      {/* 2. "And hang upside down. How does it stick?": under the ramp, first run, close-up from below (ends before 1:19.90) */}
      {seq(invStart, suctionStart, <Clip src="v3_inverted.mp4" from={0.57} rate={0.92} cx={0.36} cy={0.42} zoom={1.05} push={0.16} />, 's02')}
      {/* 3. suction, three beats */}
      {seq(suctionStart, airStart, <Suction4 start={suctionStart} cues={{pull: w('fans'), lower: w('Lower'), surround: w('surrounding'), press: w('press'), ramp: w('ramp')}} />, 's03')}
      {/* 4. airborne control on the real flip, half speed, vectors on visible plumes */}
      {seq(airStart, semiStart, <Airborne from={0.6} start={airStart} cues={{jets: w('compressed-gas'), rotate: w('rotate'), hold: w('hold')}} />, 's04')}
      {/* 5. the Semi hop, front then side, real sound */}
      {seq(semiStart, zeroStart, <Clip src="v3_hop_front.mp4" from={1.3} cx={[[1.3, 0.5], [3.16, 0.5], [3.17, 0.6], [4.6, 0.6]]} volume={(x) => interpolate(x, [0, 0.1, 2.9, 3.0, 3.18, 3.28], [0, 0.07, 0.07, 0.4, 0.4, 0])} />, 's05')}
      {/* 6. 0–60 over the stream's timed run (rec_225218 0:16.0 → launch 0:17.0 → timer 01.00 at 0:18.1), then its overhead replay;
             the burned-in stream timer is cropped out so it doesn't stack against the captions */}
      {seq(zeroStart, overheadCut, <Clip src="v3_accel.mp4" from={0.5} cx={0.495} cy={0} zoom={1.2} volume={(x) => interpolate(x, [0, 0.1, 0.8, 1.05, 1.35, 1.5, 2.4, 2.56], [0, 0.06, 0.06, 0.5, 0.5, 0.06, 0.06, 0])} />, 's06a')}
      {seq(overheadCut, rocketStart, <Clip src="v3_accel.mp4" from={6.1} cx={[[6.1, 0.39], [6.7, 0.4], [6.9, 0.44], [7.1, 0.52], [7.3, 0.65], [7.5, 0.8]]} cy={0} zoom={1.2} />, 's06b')}
      {/* the stream's burned-in timer sits below the captions: a dark band keeps it from competing with them */}
      {seq(zeroStart, rocketStart, <AbsoluteFill style={{background: 'linear-gradient(rgba(0,0,0,0) 0px, rgba(0,0,0,0) 1450px, rgba(0,0,0,0.97) 1590px, rgba(0,0,0,0.98) 1920px)'}} />, 'shade06')}
      {seq(zeroStart, rocketStart, <ZeroSixty4 start={zeroStart} cues={{zero: w('Zero'), num: w('0.81'), shown: w('by')}} />, 'o06')}
      {/* 7. the Rocket qualification over the ramp run's aerial (inverted at the top, launch, roll), dimmed */}
      {seq(rocketStart, endStart, <Clip src="v3_ramp_aerial.mp4" from={1.32} cx={[[1.32, 0.57], [2.5, 0.565], [3.0, 0.54], [3.5, 0.45], [4.5, 0.5], [7.3, 0.52]]} cy={0.36} zoom={1.2} dim={0.5} />, 's07')}
      {seq(rocketStart, endStart, <RocketBeat start={rocketStart} cues={{flight: w('flight'), lists: w('lists'), rocket: w('Rocket'), approved: w('approved')}} />, 'o07')}
      {/* 8. close: rec_224911 0:38.14–0:39.22 (second side angle), 0.37x, the car upright on two jets, still airborne at the last frame */}
      {seq(endStart, V4_DURATION, <Clip src="v4_end_slow.mp4" from={0} cx={[[0, 0.421], [0.48, 0.48], [0.96, 0.518], [1.43, 0.547], [1.9, 0.577], [2.37, 0.581], [2.84, 0.566], [3.03, 0.55]]} />, 's08')}
      {flash > 0 && <AbsoluteFill style={{background: '#fff', opacity: flash}} />}
      <SourceChip4 until={suctionStart} />
      <PhraseCaptions words={words} sizes={[6, 4, 4, 5, 4, 3, 4, 6, 3, 6, 4, 8, 2, 3, 6, 2, 8, 8, 2, 1, 2]} y={1290} end={V4_DURATION} />
      {audio && narration && <Audio src={staticFile('short4/narration.wav')} />}
      {audio && <Audio src={staticFile('short4/sfx.wav')} />}
      {/* real lift-off sound under the opening, at speed */}
      {audio && (
        <Sequence from={0} durationInFrames={Math.round(invStart * FPS)}>
          <Audio src={staticFile('footage/v3_hop_side.mp4')} trimBefore={Math.round(0.65 * FPS)} volume={(f) => interpolate(f, [0, 4, Math.round(invStart * FPS) - 6, Math.round(invStart * FPS)], [0, 0.1, 0.1, 0], {extrapolateRight: 'clamp'})} />
        </Sequence>
      )}
    </AbsoluteFill>
  );
};
