// Opening: Tesla's side replay of the hop, one continuous camera at the recording's own speed (rec_224911 0:35.25 to
// 0:38.70): the car climbing on its jets above the parked Teslas and the Semi, rolling inverted, rolling back upright on
// four downward jets. The 9:16 crop follows the car (keys from frame-by-frame measurement, footage/CLIP_LEDGER.md).
// One brief tag, "Rocket version", says which version this is (the version Tesla lists as the one that flies).
import React from 'react';
import {AbsoluteFill, Audio, Sequence, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {Clip, Key} from '../short3/Clip';
import {C, F} from '../theme';
import {FPS, HOP_FILE0, OPEN_SRC, T, words} from './data';

// car centre in the replay (rec_224911 seconds -> source px), measured every 0.25 s on magnified frames; the crop follows a
// Catmull-Rom curve through them, sampled per frame
const RAW: [number, number][] = [[34.45, 870], [34.55, 875], [34.8, 890], [35.05, 935], [35.25, 1002], [35.5, 1135], [35.75, 1138], [36.0, 1075], [36.25, 998], [36.5, 915], [36.75, 832],
  [37.0, 755], [37.25, 655], [37.5, 585], [37.75, 575], [38.0, 655], [38.25, 848], [38.5, 975], [38.75, 1068], [39.0, 1100]];
const cr = (t: number) => {
  let i = RAW.findIndex(([s2], k) => k < RAW.length - 1 && t >= s2 && t <= RAW[k + 1][0]);
  if (i < 0) i = t < RAW[0][0] ? 0 : RAW.length - 2;
  const p0 = RAW[Math.max(0, i - 1)][1], p1 = RAW[i][1], p2 = RAW[i + 1][1], p3 = RAW[Math.min(RAW.length - 1, i + 2)][1];
  const u = Math.max(0, Math.min(1, (t - RAW[i][0]) / (RAW[i + 1][0] - RAW[i][0])));
  return 0.5 * (2 * p1 + (-p0 + p2) * u + (2 * p0 - 5 * p1 + 4 * p2 - p3) * u * u + (-p0 + 3 * p1 - 3 * p2 + p3) * u * u * u);
};
export const hopCarX = cr;
export const HOP_CX: Key[] = Array.from({length: Math.round((39.0 - 34.4) * FPS) + 1}, (_, i) => {
  const src = 34.4 + i / FPS;
  return [src - HOP_FILE0, cr(src) / 1920];
});

/** 0 while a narration word is spoken (with a margin), rising to 1 in the gaps: the replay's own sound ducks under it. */
export const speechFree = (t: number, margin = 0.1, fade = 0.15) => {
  let d = Infinity;
  for (const w of words) {
    if (t >= w.s - margin && t <= w.e + margin) return 0;
    d = Math.min(d, Math.abs(t - (w.s - margin)), Math.abs(t - (w.e + margin)));
  }
  return Math.min(1, d / fade);
};
const duck = (t: number) => 0.2 + 0.8 * speechFree(t);

export const Opening: React.FC<{audio?: boolean}> = ({audio = true}) => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const label = interpolate(t, [0.25, 0.45, 1.75, 2.0], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <AbsoluteFill>
      <Clip src="rk_hop.mp4" from={OPEN_SRC - HOP_FILE0} cx={HOP_CX} />
      {/* the replay's own sound (jets and crowd), low under the voice */}
      {audio && (
        <Sequence from={0} durationInFrames={Math.round((T.swap + 0.6) * FPS)}>
          <Audio src={staticFile('footage/rk_hop.mp4')} trimBefore={Math.round((OPEN_SRC - HOP_FILE0) * FPS)}
            volume={(f) => duck(f / FPS) * interpolate(f / FPS, [0, T.swap - 0.1, T.swap + 0.55], [0.16, 0.16, 0], {extrapolateRight: 'clamp'})} />
        </Sequence>
      )}
      {label > 0 && (
        <div style={{position: 'absolute', top: 236, width: 1080, textAlign: 'center', opacity: label}}>
          <span style={{fontFamily: F.body, fontWeight: 700, fontSize: 30, letterSpacing: 1.5, color: C.cream, background: 'rgba(10,16,20,0.55)', borderRadius: 16, padding: '5px 18px'}}>Rocket version</span>
        </div>
      )}
    </AbsoluteFill>
  );
};
