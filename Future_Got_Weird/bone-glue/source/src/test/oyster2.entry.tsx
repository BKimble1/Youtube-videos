// Test entry for the V2 oyster (src/art/oyster.tsx). 'Sheet': phone-size panels (360×640) along the film's oyster
// shot at t 8.0, 8.5, 9.0, 9.5, 10.0, 10.3 on the lead's camera path (story.ts oysterCam, reproduced here) with the
// film's reveal. 'One': one full-size frame
// ({t, mode: 'in' | 'out' | 'path', reveal? (-1 or absent: the film's value), debug?}); debug overlays the bone glue band's glueTop (magenta) and
// glueBottom (yellow) from production/v2_match_band.json, and faceTop/faceBottom (thin cyan).
import React from 'react';
import {Composition, registerRoot} from 'remotion';
import {OysterWorld, OY_CAM_IN, OY_CAM_OUT} from '../art/oyster';
import {Cam, zoomAbout} from '../camera';
import {clamp, ss} from '../lib';
import BAND from '../../../production/v2_match_band.json';

const CUT_IN = 7.98, CUT_OUT = 10.33;
/** the lead's oyster camera (story.ts oysterCam): the medium shot holds ~0.6 s with a slow creep, the push runs into the
 *  base, then creeps on through the reveal and is still moving at the cut back */
const OY_CREEP = 0.07;
export const pathCam = (t: number): Cam => {
  const u = clamp((t - CUT_IN) / (CUT_OUT - CUT_IN));
  const e = (x: number) => OY_CREEP * x + (1 - OY_CREEP) * ss(x, 0.22, 0.7);
  return zoomAbout(u, OY_CAM_IN, OY_CAM_OUT, e);
};
const revealAt = (t: number) => ss(t, 9.42, 10.13);

type Rows = {rows: {glueTop: number[]; glueBottom: number[]; faceTop: number[]; faceBottom: number[]}[]};
const R = (BAND as unknown as Rows).rows;
const pl = (k: 'glueTop' | 'glueBottom' | 'faceTop' | 'faceBottom') => R.map((r) => `${r[k][0].toFixed(1)},${r[k][1].toFixed(1)}`).join(' ');

type Panel = {t: number; mode: 'in' | 'out' | 'path'; reveal?: number};
const camOf = (p: Panel): Cam => (p.mode === 'in' ? OY_CAM_IN : p.mode === 'out' ? OY_CAM_OUT : pathCam(p.t));
const revOf = (p: Panel) => (typeof p.reveal === 'number' && p.reveal >= 0 ? p.reveal : p.mode === 'path' ? revealAt(p.t) : p.mode === 'out' ? 1 : 0);

const Frame: React.FC<{id: string; p: Panel; debug?: boolean}> = ({id, p, debug}) => (
  <div style={{position: 'absolute', left: 0, top: 0, width: 1080, height: 1920, overflow: 'hidden'}}>
    <OysterWorld id={id} t={p.t} cam={camOf(p)} reveal={revOf(p)} />
    {debug && (
      <svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0}}>
        <polyline points={pl('faceTop')} fill="none" stroke="#22E0FF" strokeWidth={1} opacity={0.8} />
        <polyline points={pl('faceBottom')} fill="none" stroke="#22E0FF" strokeWidth={1} opacity={0.8} />
        <polyline points={pl('glueTop')} fill="none" stroke="#FF2D9A" strokeWidth={2} />
        <polyline points={pl('glueBottom')} fill="none" stroke="#FFE600" strokeWidth={2} />
      </svg>
    )}
  </div>
);

const PANELS: Panel[] = [
  {t: 8.0, mode: 'path'},
  {t: 8.5, mode: 'path'},
  {t: 9.0, mode: 'path'},
  {t: 9.5, mode: 'path'},
  {t: 10.0, mode: 'path'},
  {t: 10.3, mode: 'path'},
];
const Sheet: React.FC<{only?: number[]}> = ({only}) => (
  <div style={{position: 'absolute', inset: 0, background: '#000'}}>
    {PANELS.map((p, i) =>
      only && !only.includes(i) ? null : (
        <div key={i} style={{position: 'absolute', left: (i % 3) * 360, top: Math.floor(i / 3) * 640, width: 360, height: 640, overflow: 'hidden'}}>
          <div style={{width: 1080, height: 1920, transform: 'scale(0.3333333)', transformOrigin: '0 0'}}>
            <Frame id={`p${i}`} p={p} />
          </div>
        </div>
      ),
    )}
  </div>
);
const One: React.FC<Panel & {debug?: boolean}> = ({debug, ...p}) => (
  <div style={{position: 'absolute', inset: 0, background: '#000'}}>
    <Frame id="one" p={p} debug={debug} />
  </div>
);

registerRoot(() => (
  <>
    <Composition id="Sheet" component={Sheet as unknown as React.FC<Record<string, unknown>>} durationInFrames={1} fps={30} width={1080} height={1280} defaultProps={{}} />
    <Composition id="One" component={One as unknown as React.FC<Record<string, unknown>>} durationInFrames={1} fps={30} width={1080} height={1920} defaultProps={{t: 10.3, mode: 'out', reveal: -1, debug: false}} />
  </>
));
