// FGW "Real Web Fluid" V3: the composition. Picture rebuilt on the locked V1 narration (same words, same timing);
// each frame is one scene function of the frame number; captions in screen space on top.
import React from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame} from 'remotion';
import '../fonts';
import {Captions} from '../Captions';
import {FPS} from '../lib';
import {capY4} from './captions4';
import {SA, StreetScene4} from './Street4';
import {DV, DeviceScene4} from './Device4';
import {LabScene4} from './Lab4';
import {LT4} from './labWorld4';

/** street (0-65), the wrist device (66-149), the lab (150-951); the device's fluid and the syringe's are matched at
 *  150 and the frame edges (window corners vs barrel walls) are blended over six frames */
export const SceneAt4: React.FC<{f: number}> = ({f}) => {
  if (f < SA.end) return <StreetScene4 f={f} />;
  if (f < DV.end) return <DeviceScene4 f={f} />;
  if (f < LT4.fade) {
    const u = (f - DV.end + 1) / (LT4.fade - DV.end + 1);
    return (
      <>
        <DeviceScene4 f={f} />
        <div style={{position: 'absolute', inset: 0, opacity: u * u * (3 - 2 * u)}}>
          <LabScene4 f={f} />
        </div>
      </>
    );
  }
  return <LabScene4 f={f} />;
};

export const Frame4: React.FC<{f: number; captions: boolean}> = ({f, captions}) => (
  <AbsoluteFill style={{backgroundColor: '#10202A', overflow: 'hidden'}}>
    <SceneAt4 f={f} />
    {captions && <Captions t={f / FPS} cy={capY4(f / FPS)} />}
  </AbsoluteFill>
);

export const Film4: React.FC<{audio: string | false; captions: boolean}> = ({audio, captions}) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <Frame4 f={f} captions={captions} />
      {audio && <Audio src={staticFile(`audio/${audio}.wav`)} />}
    </AbsoluteFill>
  );
};
export const FilmStill4: React.FC<{t: number; captions: boolean}> = ({t, captions}) => <Frame4 f={t * FPS} captions={captions} />;

/** contact sheet: up to 12 frames (given as frame numbers), 4 across at quarter size */
export const Sheet4: React.FC<{fs: number[]; captions: boolean}> = ({fs, captions}) => (
  <AbsoluteFill style={{backgroundColor: '#111'}}>
    {fs.map((f, i) => (
      <div key={i} style={{position: 'absolute', left: (i % 4) * 270, top: Math.floor(i / 4) * 480, width: 1080, height: 1920, transform: 'scale(0.25)', transformOrigin: '0 0', overflow: 'hidden'}}>
        <Frame4 f={f} captions={captions} />
        <div style={{position: 'absolute', left: 20, top: 20, fontSize: 90, color: '#FF0', fontFamily: 'monospace', textShadow: '0 0 8px #000'}}>{`${f} (${(f / FPS).toFixed(2)})`}</div>
      </div>
    ))}
  </AbsoluteFill>
);
