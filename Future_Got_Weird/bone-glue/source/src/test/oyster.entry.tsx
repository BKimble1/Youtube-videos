// Test sheet for the oyster comparison (src/art/oyster.tsx). mode 'sheet': a 3×3 grid of phone-size (360×640)
// frames along the film's camera path; mode 'single': one full-size frame at t (camera from the path, or x/y/w).
import React from 'react';
import {Composition, registerRoot} from 'remotion';
import {OysterWorld} from '../art/oyster';
import {Cam, Key, glide, travel, zoomAbout} from '../camera';

const KEYS: Key[] = [
  [8.0, {x: 0, y: -18, w: 150}],
  [9.8, {x: 4, y: -26, w: 115}, travel],
  [10.3, {x: 0, y: -2, w: 34}, zoomAbout],
];
const pathCam = (t: number): Cam => glide(t, KEYS);

type Props = {mode: string; t: number; x?: number; y?: number; w?: number; ts?: number[]; guide?: boolean};

const Frame: React.FC<{id: string; t: number; cam: Cam; scale: number; left: number; top: number; guide?: boolean}> = ({id, t, cam, scale, left, top, guide}) => (
  <div style={{position: 'absolute', left, top, width: 1080 * scale, height: 1920 * scale, overflow: 'hidden'}}>
    <div style={{position: 'absolute', left: 0, top: 0, width: 1080, height: 1920, transform: `scale(${scale})`, transformOrigin: '0 0'}}>
      <OysterWorld id={id} t={t} cam={cam} />
      {guide && (
        <svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0}}>
          {(() => {
            const s = 1080 / cam.w;
            const X = 540 + s * (0 - cam.x), Y = 960 + s * (0 - cam.y);
            return (
              <g stroke="#FF2D9A" strokeWidth={3} fill="none">
                <line x1={X - 30} y1={Y} x2={X + 30} y2={Y} />
                <line x1={X} y1={Y - 30} x2={X} y2={Y + 30} />
              </g>
            );
          })()}
        </svg>
      )}
    </div>
  </div>
);

const Sheet: React.FC<Props> = ({mode, t, x, y, w, ts, guide}) => {
  if (mode === 'single') {
    const cam = w ? {x: x ?? 0, y: y ?? 0, w} : pathCam(t);
    return (
      <div style={{position: 'absolute', inset: 0, background: '#000'}}>
        <Frame id="s0" t={t} cam={cam} scale={1} left={0} top={0} guide={guide} />
      </div>
    );
  }
  const times = ts ?? [8.0, 8.45, 8.9, 9.35, 9.8, 10.0, 10.12, 10.22, 10.3];
  return (
    <div style={{position: 'absolute', inset: 0, background: '#000'}}>
      {times.map((tt, i) => (
        <Frame key={i} id={`f${i}`} t={tt} cam={pathCam(tt)} scale={1 / 3} left={(i % 3) * 360} top={Math.floor(i / 3) * 640} guide={guide} />
      ))}
    </div>
  );
};

registerRoot(() => (
  <Composition id="Oyster" component={Sheet as unknown as React.FC<Record<string, unknown>>} durationInFrames={1} fps={30} width={1080} height={1920} defaultProps={{mode: 'sheet', t: 8}} />
));
