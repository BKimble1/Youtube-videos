import React from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame} from 'remotion';
import {FPS} from './lib';
import {T} from './it/timing';
import {labAt, labEndAt} from './it/labShots';
import {LabView} from './it/LabView';
import {Captions} from './Captions';
import {CarView, carActive} from './it/car';
import {KioskView, kioskActive} from './it/kiosk';

/** the caption zone each shot leaves free (screen y of the caption's centre) */
export const capY = (t: number) => {
  if (t < T.look - 0.05) return 430; // hook: the finger is mid-frame, the array below; the upper zone is open wall
  if (t < T.so - 0.07) return 430; // low angle: the gap is centre; captions high
  if (t < T.move) return 1420;
  if (t < T.now) return 1440;
  if (t < T.and2) return 400; // car and kiosk: the controls are mid-frame
  return 1400;
};

export const Frame: React.FC<{t: number; captions: boolean}> = ({t, captions}) => {
  let body: React.ReactNode = null;
  const a = labAt(t);
  if (a) body = <LabView s={a} t={t} id="lab" />;
  else if (carActive(t)) body = <CarView t={t} />;
  else if (kioskActive(t)) body = <KioskView t={t} />;
  else {
    const b = labEndAt(t);
    if (b) body = <LabView s={b} t={t} id="lab" />;
  }
  return (
    <AbsoluteFill style={{background: '#0B1E2B'}}>
      <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}}>
        {body}
      </svg>
      {captions && <Captions t={t} y={capY} />}
    </AbsoluteFill>
  );
};

export const Film: React.FC<{audio: string | false; captions: boolean}> = ({audio, captions}) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <Frame t={f / FPS} captions={captions} />
      {audio && <Audio src={staticFile(`audio/${audio}.wav`)} />}
    </AbsoluteFill>
  );
};

/** contact sheet of frames */
export const Sheet: React.FC<{fs: number[]; captions: boolean; cols: number}> = ({fs, captions, cols}) => {
  const rows = Math.ceil(fs.length / cols);
  const sc = 1 / cols;
  return (
    <AbsoluteFill style={{background: '#fff'}}>
      {fs.map((f, i) => (
        <div key={i} style={{position: 'absolute', left: (i % cols) * 1080 * sc, top: Math.floor(i / cols) * 1920 * sc * (cols / Math.max(cols, rows)), width: 1080, height: 1920, transform: `scale(${sc * (cols / Math.max(cols, rows))})`, transformOrigin: '0 0', overflow: 'hidden'}}>
          <Frame t={f / FPS} captions={captions} />
          <div style={{position: 'absolute', left: 10, top: 10, font: '700 60px sans-serif', color: '#ff0', textShadow: '0 0 6px #000'}}>{f}</div>
        </div>
      ))}
    </AbsoluteFill>
  );
};
