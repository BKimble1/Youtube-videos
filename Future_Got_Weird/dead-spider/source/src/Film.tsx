// The film: one shot per time range (world.CUT), the captions in screen space on top, the mix underneath.
import React from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame} from 'remotion';
import {Captions} from './Captions';
import {FPS} from './lib';
import {ShotA} from './shots/A';
import {ShotC} from './shots/C';
import {ShotD} from './shots/D';
import {ShotE} from './shots/E';
import {ShotF} from './shots/F';
import {CUT} from './world';

export const shotAt = (t: number): React.ReactNode => {
  if (t < CUT.cutaway) return <ShotA t={t} />;
  if (t < CUT.specimenD) return <ShotC t={t} />;
  if (t < CUT.load) return <ShotD t={t} />;
  if (t < CUT.tray) return <ShotE t={t} />;
  return <ShotF t={t} />;
};

export const Frame: React.FC<{f: number; captions: boolean}> = ({f, captions}) => {
  const t = f / FPS;
  return (
    <AbsoluteFill style={{backgroundColor: '#10202A', overflow: 'hidden'}}>
      {shotAt(t)}
      {captions && <Captions t={t} />}
    </AbsoluteFill>
  );
};

export const Film: React.FC<{audio: string | false; captions: boolean}> = ({audio, captions}) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <Frame f={f} captions={captions} />
      {audio && <Audio src={staticFile(`audio/${audio}.wav`)} />}
    </AbsoluteFill>
  );
};
export const FilmStill: React.FC<{t: number; captions: boolean}> = ({t, captions}) => <Frame f={t * FPS} captions={captions} />;

/** contact sheet: up to 12 frames, 4 across at quarter size */
export const Sheet: React.FC<{fs: number[]; captions: boolean}> = ({fs, captions}) => (
  <AbsoluteFill style={{backgroundColor: '#111'}}>
    {fs.map((f, i) => (
      <div key={i} style={{position: 'absolute', left: (i % 4) * 270, top: Math.floor(i / 4) * 480, width: 1080, height: 1920, transform: 'scale(0.25)', transformOrigin: '0 0', overflow: 'hidden'}}>
        <Frame f={f} captions={captions} />
        <div style={{position: 'absolute', left: 20, top: 20, fontSize: 90, color: '#FF0', fontFamily: 'monospace', textShadow: '0 0 8px #000'}}>{`${f} (${(f / FPS).toFixed(2)})`}</div>
      </div>
    ))}
  </AbsoluteFill>
);
