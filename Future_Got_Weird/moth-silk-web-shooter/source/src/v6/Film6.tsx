// FGW "Real Web Fluid" V3: the composition. Picture rebuilt on the locked V1 narration (same words, same timing);
// each frame is one scene function of the frame number; captions in screen space on top.
import React from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame} from 'remotion';
import '../fonts';
import {Captions} from '../Captions';
import {FPS} from '../lib';
import {capY6} from './captions6';
import {SA, StreetScene6} from './Street6';
import {MacroScene6, MC} from './Macro6';
import {EndTransition6} from './End6';
import {LabScene6} from './Lab6';
import {LT6} from './labWorld6';

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
export const SceneAt6: React.FC<{f: number}> = ({f}) => {
  if (f < MC.start) return <StreetScene6 f={f} />;
  if (f < MC.in1) return <Blend u={(f - MC.start + 1) / (MC.in1 - MC.start + 1)} a={<StreetScene6 f={f} />} b={<MacroScene6 f={f} />} />;
  if (f < LT6.match) return <MacroScene6 f={f} />;
  if (f < MC.end) return <Blend u={(f - LT6.match + 1) / (MC.end - LT6.match + 1)} a={<MacroScene6 f={f} />} b={<LabScene6 f={f} />} />;
  if (f < LT6.toDevice) return <LabScene6 f={f} />;
  return <EndTransition6 f={f} />;
};

export const Frame6: React.FC<{f: number; captions: boolean}> = ({f, captions}) => (
  <AbsoluteFill style={{backgroundColor: '#10202A', overflow: 'hidden'}}>
    <SceneAt6 f={f} />
    {captions && <Captions t={f / FPS} cy={capY6(f / FPS)} />}
  </AbsoluteFill>
);

export const Film6: React.FC<{audio: string | false; captions: boolean}> = ({audio, captions}) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <Frame6 f={f} captions={captions} />
      {audio && <Audio src={staticFile(`audio/${audio}.wav`)} />}
    </AbsoluteFill>
  );
};
export const FilmStill6: React.FC<{t: number; captions: boolean}> = ({t, captions}) => <Frame6 f={t * FPS} captions={captions} />;

/** contact sheet: up to 12 frames (given as frame numbers), 4 across at quarter size */
export const Sheet6: React.FC<{fs: number[]; captions: boolean}> = ({fs, captions}) => (
  <AbsoluteFill style={{backgroundColor: '#111'}}>
    {fs.map((f, i) => (
      <div key={i} style={{position: 'absolute', left: (i % 4) * 270, top: Math.floor(i / 4) * 480, width: 1080, height: 1920, transform: 'scale(0.25)', transformOrigin: '0 0', overflow: 'hidden'}}>
        <Frame6 f={f} captions={captions} />
        <div style={{position: 'absolute', left: 20, top: 20, fontSize: 90, color: '#FF0', fontFamily: 'monospace', textShadow: '0 0 8px #000'}}>{`${f} (${(f / FPS).toFixed(2)})`}</div>
      </div>
    ))}
  </AbsoluteFill>
);
