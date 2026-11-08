import React from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame} from 'remotion';
import {FPS} from './lib';
import {T} from './it/timing';
import {labAt, labEndAt, LAB_CUT_T} from './it/labShots';
import {focusPoint} from './it/LabView';
import {figMatrix, project} from './it/cam3';
import {setCarEntry} from './it/car';
import {LabView} from './it/LabView';
import {Captions} from './Captions';
import {CarView, carActive} from './it/car';
import {KioskView, kioskActive} from './it/kiosk';

/** the caption zone each shot leaves free (screen y of the caption's centre) */
export const capY = (t: number) => {
  if (t < T.look - 0.05) return 1400; // hook: the finger is upper-middle; the lower wall is clear (and matches the loop's last caption)
  if (t < T.so - 0.07) return 430; // low angle: the gap is centre; captions high
  if (t < T.move) return 1420;
  if (t < T.now) return 1440;
  if (t < T.without - 0.05) return 1470; // car: the head is high in frame; captions over the door sill
  if (t < T.and2) return 330; // kiosk: the lobby's upper wall is clear
  return 1400;
};

// the car shot opens with the hand exactly where the lab shot left it (screen point and scale of the index pad)
(() => {
  const l = labEndAt(LAB_CUT_T);
  if (!l) return;
  const p = project(l.cam, {x: l.pad.x, y: -l.pad.y, z: 0});
  setCarEntry({sx: p.x, sy: p.y, k: figMatrix(l.cam, l.pad.x, -l.pad.y).scale});
  void focusPoint;
})();

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
