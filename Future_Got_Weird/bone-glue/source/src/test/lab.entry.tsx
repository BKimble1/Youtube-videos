// Test sheet for the lab and the droplet (src/art/lab.tsx).
//   mode 'single': one full-size frame. Either k = a key below, or t (film seconds) for labSuggest(t), or an explicit
//                  state st and camera cam ({x, y, w}).
//   mode 'sheet':  a 3×3 grid of phone-size (360×640) frames: ks = keys or film times ('t4.2').
//   guide: draw the json match band's glueTop / glueBottom (cyan) over the frame (use with k 'match').
//   oy: draw OysterWorld at OY_CAM_IN instead (t), mix: dissolve the lab frame into it (0..1).
// Keys: match (the cut), m2 (just after), pull (half way out), wide, press, move, drop0..drop3, fall0..fall2, pl0..pl3.
//   npx remotion still <bundle> Lab out.png --props='{"mode":"single","k":"match","guide":true}'
import React from 'react';
import {Composition, registerRoot} from 'remotion';
import {Cam} from '../camera';
import {resetIds} from '../core/ids';
import {LabWorld, LabState, LAB_MATCH, LAB_WIDE, LAB_DROP, LAB_PLUNGE, LAB_START, BEAD_MATCH, labSuggest} from '../art/lab';
import {OysterWorld, OY_CAM_IN} from '../art/oyster';
import BAND from '../../../production/v2_match_band.json';

type Shot = {t: number; cam: Cam; st: LabState};
const S = (st: Partial<LabState>): LabState => ({...LAB_START, ...st});
const KEYS: Record<string, Shot> = {
  match: {t: 3.72, cam: LAB_MATCH, st: S({})},
  m2: {t: 3.9, cam: {...LAB_MATCH, x: LAB_MATCH.x + 3, w: 34}, st: S({bead: BEAD_MATCH + 0.12})},
  pull: {t: 4.2, cam: {x: 6, y: 2, w: 90}, st: S({bead: 0.85})},
  wide: {t: 4.62, cam: LAB_WIDE, st: S({bead: 1})},
  press: {t: 5.0, cam: LAB_WIDE, st: S({bead: 1, press: 1})},
  pressC: {t: 5.0, cam: {x: -2, y: 4, w: 80}, st: S({bead: 1, press: 1})},
  move: {t: 5.25, cam: {x: -6, y: -60, w: 200}, st: S({bead: 1, press: 1, move: 0.5})},
  drop0: {t: 5.5, cam: LAB_DROP, st: S({bead: 1, press: 1, move: 1, drop: 0.1})},
  drop1: {t: 5.7, cam: LAB_DROP, st: S({bead: 1, press: 1, move: 1, drop: 0.5})},
  drop2: {t: 5.95, cam: LAB_DROP, st: S({bead: 1, press: 1, move: 1, drop: 0.85})},
  drop3: {t: 6.08, cam: LAB_DROP, st: S({bead: 1, press: 1, move: 1, drop: 1})},
  fall0: {t: 6.2, cam: LAB_DROP, st: S({bead: 1, press: 1, move: 1, drop: 1, fall: 0.3})},
  fall1: {t: 6.4, cam: LAB_DROP, st: S({bead: 1, press: 1, move: 1, drop: 1, fall: 0.7})},
  fall2: {t: 6.5, cam: LAB_DROP, st: S({bead: 1, press: 1, move: 1, drop: 1, fall: 1})},
  pl0: {t: 6.6, cam: {...LAB_DROP, y: LAB_DROP.y + 18}, st: S({bead: 1, press: 1, move: 1, drop: 1, fall: 1, plunge: 0.1})},
  pl1: {t: 6.8, cam: {...LAB_DROP, y: LAB_DROP.y + 40, w: 27}, st: S({bead: 1, press: 1, move: 1, drop: 1, fall: 1, plunge: 0.4})},
  pl2: {t: 7.0, cam: LAB_PLUNGE, st: S({bead: 1, press: 1, move: 1, drop: 1, fall: 1, plunge: 0.75})},
  pl3: {t: 7.13, cam: LAB_PLUNGE, st: S({bead: 1, press: 1, move: 1, drop: 1, fall: 1, plunge: 1})},
};
const shotOf = (k: string): Shot => {
  if (k.startsWith('t')) {
    const t = parseFloat(k.slice(1));
    return {t, ...labSuggest(t)};
  }
  return KEYS[k] ?? KEYS.match;
};

type Row = {glueTop: number[]; glueBottom: number[]};
const ROWS = (BAND as unknown as {rows: Row[]}).rows;
const Guide: React.FC = () => (
  <svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0}}>
    <polyline points={ROWS.map((r) => r.glueTop.join(',')).join(' ')} fill="none" stroke="#22E0FF" strokeWidth={2} strokeDasharray="10 8" />
    <polyline points={ROWS.map((r) => r.glueBottom.join(',')).join(' ')} fill="none" stroke="#FF2D9A" strokeWidth={2} strokeDasharray="10 8" />
  </svg>
);

const Frame: React.FC<{id: string; s: Shot; scale: number; left: number; top: number; guide?: boolean; oy?: boolean; mix?: number}> = ({id, s, scale, left, top, guide, oy, mix}) => (
  <div style={{position: 'absolute', left, top, width: 1080 * scale, height: 1920 * scale, overflow: 'hidden'}}>
    <div style={{position: 'absolute', left: 0, top: 0, width: 1080, height: 1920, transform: `scale(${scale})`, transformOrigin: '0 0'}}>
      {oy ? <OysterWorld id={`${id}o`} t={s.t} cam={OY_CAM_IN} /> : <LabWorld id={id} t={s.t} cam={s.cam} st={s.st} />}
      {!oy && mix !== undefined && mix > 0 && (
        <div style={{position: 'absolute', inset: 0, opacity: mix}}>
          <OysterWorld id={`${id}o`} t={7.13} cam={OY_CAM_IN} />
        </div>
      )}
      {guide && <Guide />}
    </div>
  </div>
);

type Props = {mode: string; k?: string; t?: number; st?: Partial<LabState>; cam?: Cam; ks?: string[]; guide?: boolean; oy?: boolean; mix?: number};
const Sheet: React.FC<Props> = ({mode, k, t, st, cam, ks, guide, oy, mix}) => {
  resetIds('lab');
  if (mode === 'single') {
    const s: Shot = cam && st ? {t: t ?? 5, cam, st: S(st)} : k ? shotOf(k) : t !== undefined ? {t, ...labSuggest(t)} : KEYS.match;
    return (
      <div style={{position: 'absolute', inset: 0, background: '#000'}}>
        <Frame id="s0" s={s} scale={1} left={0} top={0} guide={guide} oy={oy} mix={mix} />
      </div>
    );
  }
  const keys = ks ?? ['match', 'pull', 'wide', 'press', 'move', 'drop2', 'fall1', 'pl1', 'pl3'];
  return (
    <div style={{position: 'absolute', inset: 0, background: '#000'}}>
      {keys.map((kk, i) => (
        <Frame key={i} id={`f${i}`} s={shotOf(kk)} scale={1 / 3} left={(i % 3) * 360} top={Math.floor(i / 3) * 640} guide={guide} />
      ))}
    </div>
  );
};

registerRoot(() => (
  <Composition id="Lab" component={Sheet as unknown as React.FC<Record<string, unknown>>} durationInFrames={1} fps={30} width={1080} height={1920} defaultProps={{mode: 'sheet'}} />
));
