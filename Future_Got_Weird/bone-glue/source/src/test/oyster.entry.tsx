// Test sheet for the oyster comparison (src/art/oyster.tsx). mode 'sheet': a 3×3 grid of phone-size (360×640) frames
// along the film's camera path (match-in 7.95 -> slow push to 9.95 -> push to the match-out 10.33); mode 'single': one
// full-size frame at t (camera from the path, or x/y/w). guide: a magenta cross at world (0,0) and a cyan line at
// screen y = 1090 (where both match framings put the cement's contact edge).
import React from 'react';
import {Composition, registerRoot} from 'remotion';
import {OysterWorld} from '../art/oyster';
import {Cam, Key, glide, travel, zoomAbout, toScreen} from '../camera';
import {pt} from '../core/geo';

const MATCH_IN: Cam = {x: 0, y: -12.0, w: 95};
const HOLD_END: Cam = {x: 2, y: -15, w: 80};
const MATCH_OUT: Cam = {x: 0, y: -3.9, w: 32};
const KEYS: Key[] = [
  [7.95, MATCH_IN],
  [9.95, HOLD_END, (u, a, b) => travel(u, a, b, (x) => x)],
  [10.33, MATCH_OUT, zoomAbout],
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
            const o = toScreen(cam, pt(0, 0));
            return (
              <g fill="none">
                <line x1={0} y1={1090} x2={1080} y2={1090} stroke="#22E0FF" strokeWidth={2} strokeDasharray="12 10" />
                <g stroke="#FF2D9A" strokeWidth={3}>
                  <line x1={o.x - 30} y1={o.y} x2={o.x + 30} y2={o.y} />
                  <line x1={o.x} y1={o.y - 30} x2={o.x} y2={o.y + 30} />
                </g>
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
  const times = ts ?? [7.95, 8.4, 8.9, 9.2, 9.4, 9.7, 9.95, 10.15, 10.33];
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
