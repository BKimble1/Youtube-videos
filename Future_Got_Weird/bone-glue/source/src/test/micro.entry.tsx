// Test sheet for the micro bonding section (src/art/micro.tsx).
//   Micro  mode 'sheet': a 3×3 grid of phone-size (360×640) frames along the suggested path (microCam / microState,
//          10.45 -> 11.40 s), or at the given ts; mode 'single': one full-size frame at t (camera and state from the
//          path unless x/y/w or flow/grip/wet are given). guide: cyan lines at the macro band's glueTop / glueBottom at
//          screen x 540 (production/v2_match_band.json) and a magenta line at MICRO_Y.
//   Phone  one frame at t rendered at 360×640 (a real phone-size render, not a downscale of the full frame).
import React from 'react';
import {Composition, registerRoot} from 'remotion';
import {MicroWorld, MicroState, microCam, microState, MICRO_Y} from '../art/micro';
import {Cam} from '../camera';
import BAND from '../../../production/v2_match_band.json';

type Row = {glueTop: number[]; glueBottom: number[]};
const ROWS = (BAND as unknown as {rows: Row[]}).rows;
const at540 = (k: 'glueTop' | 'glueBottom') => {
  const ps = ROWS.map((r) => r[k]).sort((a, b) => a[0] - b[0]);
  for (let i = 1; i < ps.length; i++) {
    if (ps[i][0] >= 540) {
      const u = (540 - ps[i - 1][0]) / (ps[i][0] - ps[i - 1][0]);
      return ps[i - 1][1] + (ps[i][1] - ps[i - 1][1]) * u;
    }
  }
  return ps[ps.length - 1][1];
};
const G_TOP = at540('glueTop'), G_BOT = at540('glueBottom');

type Props = {mode: string; t: number; x?: number; y?: number; w?: number; flow?: number; grip?: number; wet?: number; ts?: number[]; guide?: boolean};

const stateAt = (p: Props, t: number): MicroState => {
  const s = microState(t);
  return {flow: p.flow ?? s.flow, grip: p.grip ?? s.grip, wet: p.wet ?? s.wet};
};
const camAt = (p: Props, t: number): Cam => (p.w ? {x: p.x ?? 0, y: p.y ?? 0, w: p.w} : microCam(t));

const Frame: React.FC<{id: string; t: number; cam: Cam; st: MicroState; scale: number; left: number; top: number; guide?: boolean}> = ({id, t, cam, st, scale, left, top, guide}) => (
  <div style={{position: 'absolute', left, top, width: 1080 * scale, height: 1920 * scale, overflow: 'hidden'}}>
    <div style={{position: 'absolute', left: 0, top: 0, width: 1080, height: 1920, transform: `scale(${scale})`, transformOrigin: '0 0'}}>
      <MicroWorld id={id} t={t} cam={cam} st={st} />
      {guide && (
        <svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0}}>
          <g fill="none" strokeWidth={2}>
            <line x1={0} y1={G_TOP} x2={1080} y2={G_TOP} stroke="#22E0FF" strokeDasharray="12 10" />
            <line x1={0} y1={G_BOT} x2={1080} y2={G_BOT} stroke="#22E0FF" strokeDasharray="12 10" />
            <line x1={0} y1={MICRO_Y} x2={1080} y2={MICRO_Y} stroke="#FF2D9A" strokeDasharray="6 12" />
          </g>
        </svg>
      )}
    </div>
  </div>
);

const Sheet: React.FC<Props> = (p) => {
  if (p.mode === 'single') {
    return (
      <div style={{position: 'absolute', inset: 0, background: '#000'}}>
        <Frame id="s0" t={p.t} cam={camAt(p, p.t)} st={stateAt(p, p.t)} scale={1} left={0} top={0} guide={p.guide} />
      </div>
    );
  }
  const times = p.ts ?? [10.45, 10.55, 10.65, 10.75, 10.85, 10.95, 11.05, 11.2, 11.4];
  return (
    <div style={{position: 'absolute', inset: 0, background: '#000'}}>
      {times.map((tt, i) => (
        <Frame key={i} id={`f${i}`} t={tt} cam={camAt(p, tt)} st={stateAt(p, tt)} scale={1 / 3} left={(i % 3) * 360} top={Math.floor(i / 3) * 640} guide={p.guide} />
      ))}
    </div>
  );
};

const Phone: React.FC<Props> = (p) => (
  <div style={{position: 'absolute', inset: 0, background: '#000'}}>
    <Frame id="ph" t={p.t} cam={camAt(p, p.t)} st={stateAt(p, p.t)} scale={1 / 3} left={0} top={0} guide={p.guide} />
  </div>
);

registerRoot(() => (
  <>
    <Composition id="Micro" component={Sheet as unknown as React.FC<Record<string, unknown>>} durationInFrames={1} fps={30} width={1080} height={1920} defaultProps={{mode: 'sheet', t: 10.8}} />
    <Composition id="Phone" component={Phone as unknown as React.FC<Record<string, unknown>>} durationInFrames={1} fps={30} width={360} height={640} defaultProps={{mode: 'single', t: 10.8}} />
  </>
));
