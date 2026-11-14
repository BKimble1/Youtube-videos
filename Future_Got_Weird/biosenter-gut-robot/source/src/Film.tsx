import React from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame} from 'remotion';
import {DUR, FPS} from './lib';
import {TunnelShot} from './scenes/tunnel';
import {InsideShot, wideView} from './scenes/inside';
import {handover, PigScene, Z0, zoomAt} from './scenes/pig';
import {Captions} from './Captions';
import {ToolsShot} from './scenes/tools';
import {LabShot} from './scenes/lab';
import {add3, mul3, norm3} from './core/three';

export const SCENES = {s2: 3.5, s3: 6.85, s4: 11.55, s5: 16.83, s6: 19.45, s7: 21.15};

/** S3 -> S4: the cutaway camera pulls straight back (same target, same lens) as the diagram zooms out with it */
const PullBack: React.FC<{t: number}> = ({t}) => {
  const h = handover(t);
  const v = wideView(t);
  const dist = v.dist * (Z0 / zoomAt(t));
  const cam = {eye: add3(v.target, mul3(norm3(v.dir), dist)), target: v.target, f: v.f, cy: v.cy};
  return (
    <>
      {h < 1 && <InsideShot tau={t} camOverride={cam} />}
      {h > 0 && <div style={{position: 'absolute', inset: 0, opacity: h}}><PigScene t={t} /></div>}
    </>
  );
};

export const FilmFrame: React.FC<{t: number}> = ({t}) => {
  if (t < SCENES.s2) return <TunnelShot tau={t} />;
  if (t < SCENES.s4) return <InsideShot tau={t} />;
  if (t < 13.0) return <PullBack t={t} />;
  if (t < SCENES.s5) return <PigScene t={t} />;
  if (t >= SCENES.s7) return <TunnelShot tau={t - DUR} />;
  if (t < SCENES.s6) return <ToolsShot t={t} />;
  return <LabShot t={t} />;
};

export const Film: React.FC<{captions: boolean; audio: string | false}> = ({captions, audio}) => {
  const f = useCurrentFrame();
  const t = f / FPS;
  return (
    <AbsoluteFill style={{background: '#000'}}>
      <FilmFrame t={t} />
      {captions && <Captions t={t} />}
      {audio && <Audio src={staticFile(`audio/${audio}.wav`)} />}
    </AbsoluteFill>
  );
};

/** a contact sheet of frames (for review) */
export const Sheet: React.FC<{fs: number[]; cols: number; captions?: boolean}> = ({fs, cols, captions}) => {
  const s = 1 / cols;
  return (
    <AbsoluteFill style={{background: '#111'}}>
      {fs.map((f, i) => (
        <div key={i} style={{position: 'absolute', left: (i % cols) * 1080 * s, top: Math.floor(i / cols) * 1920 * s, width: 1080, height: 1920, transform: `scale(${s})`, transformOrigin: '0 0', overflow: 'hidden'}}>
          <FilmFrame t={f / FPS} />
          {captions && <Captions t={f / FPS} />}
          <div style={{position: 'absolute', left: 0, top: 0, background: '#000', color: '#ff0', font: '60px monospace', padding: 10}}>{f} {(f / FPS).toFixed(2)}s</div>
        </div>
      ))}
    </AbsoluteFill>
  );
};
