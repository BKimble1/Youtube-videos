// FGW "Real Web Fluid" V3: the composition. Picture rebuilt on the locked V1 narration (same words, same timing);
// each frame is one scene function of the frame number; captions in screen space on top.
import React from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame} from 'remotion';
import '../fonts';
import {Captions} from '../Captions';
import {FPS} from '../lib';
import {capY5} from './captions5';
import {SA, StreetScene5} from './Street5';
import {MacroScene5, MC} from './Macro5';
import {EndTransition5} from './End5';
import {LabScene5} from './Lab5';
import {LT5} from './labWorld5';

/** street (0-65), the wrist device (66-149), the lab (150-951); the device's fluid and the syringe's are matched at
 *  150 and the frame edges (window corners vs barrel walls) are blended over six frames */
/** street (0-95, its pre-roll at the end), the web's material (84-160), the lab (150-889); cross-blends where the
 *  material close-up takes over from the band and gives way to the cocoon */
const Blend: React.FC<{u: number; a: React.ReactNode; b: React.ReactNode}> = ({u, a, b}) => (
  <>
    {a}
    <div style={{position: 'absolute', inset: 0, opacity: u * u * (3 - 2 * u)}}>{b}</div>
  </>
);
export const SceneAt5: React.FC<{f: number}> = ({f}) => {
  if (f < MC.start) return <StreetScene5 f={f} />;
  if (f < MC.in1) return <Blend u={(f - MC.start + 1) / (MC.in1 - MC.start + 1)} a={<StreetScene5 f={f} />} b={<MacroScene5 f={f} />} />;
  if (f < LT5.match) return <MacroScene5 f={f} />;
  if (f < MC.end) return <Blend u={(f - LT5.match + 1) / (MC.end - LT5.match + 1)} a={<MacroScene5 f={f} />} b={<LabScene5 f={f} />} />;
  if (f < LT5.toDevice) return <LabScene5 f={f} />;
  return <EndTransition5 f={f} />;
};

export const Frame5: React.FC<{f: number; captions: boolean}> = ({f, captions}) => (
  <AbsoluteFill style={{backgroundColor: '#10202A', overflow: 'hidden'}}>
    <SceneAt5 f={f} />
    {captions && <Captions t={f / FPS} cy={capY5(f / FPS)} />}
  </AbsoluteFill>
);

export const Film5: React.FC<{audio: string | false; captions: boolean}> = ({audio, captions}) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <Frame5 f={f} captions={captions} />
      {audio && <Audio src={staticFile(`audio/${audio}.wav`)} />}
    </AbsoluteFill>
  );
};
export const FilmStill5: React.FC<{t: number; captions: boolean}> = ({t, captions}) => <Frame5 f={t * FPS} captions={captions} />;

/** contact sheet: up to 12 frames (given as frame numbers), 4 across at quarter size */
export const Sheet5: React.FC<{fs: number[]; captions: boolean}> = ({fs, captions}) => (
  <AbsoluteFill style={{backgroundColor: '#111'}}>
    {fs.map((f, i) => (
      <div key={i} style={{position: 'absolute', left: (i % 4) * 270, top: Math.floor(i / 4) * 480, width: 1080, height: 1920, transform: 'scale(0.25)', transformOrigin: '0 0', overflow: 'hidden'}}>
        <Frame5 f={f} captions={captions} />
        <div style={{position: 'absolute', left: 20, top: 20, fontSize: 90, color: '#FF0', fontFamily: 'monospace', textShadow: '0 0 8px #000'}}>{`${f} (${(f / FPS).toFixed(2)})`}</div>
      </div>
    ))}
  </AbsoluteFill>
);
