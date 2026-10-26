// Dev stills for the V8 wedge section and the molecular view (contact sheets + single frames). Not part of the film.
// Text labels appear only in these dev sheets, never in the art.
import React from 'react';
import {Still} from 'remotion';
import {H, W} from '../../lib';
import {BRICK_CAM, camAt, FACE_SX, viewOf, WedgeContent, WedgeSplit, WedgeState, WedgeView, WEDGE_CAM} from '../Wedge8';
import {MicroBeat8, MolView, WedgeToMol} from '../Mol8';
import {Cam} from '../../dc/camera';

const G = (approach: number, shear: number, focus?: number): WedgeState => ({surface: 'glass', approach, shear, focus});
const K = (approach: number, shear: number, slip = 0): WedgeState => ({surface: 'brick', approach, shear, slip});

type FrameProps = {kind: string; surface?: 'glass' | 'brick'; approach?: number; shear?: number; slip?: number; focus?: number; focusK?: number; u?: number; close?: number; cam?: Cam; t?: number; f?: number; gShear?: number; label?: string};
const Scene: React.FC<FrameProps & {id: string}> = ({id, kind, surface = 'glass', approach = 1, shear = 0, slip = 0, focus, focusK, cam, u = 0, close = 0, t, f = 300, gShear}) => {
  if (kind === 'trans') return <WedgeToMol id={id} u={u} close={close} t={t} />;
  if (kind === 'mol') return <MolView id={id} close={close} t={t} />;
  if (kind === 'beat') return <MicroBeat8 f={f} id={id} />;
  if (kind === 'split') return <WedgeSplit id={id} glass={{surface: 'glass', approach: 1, shear: gShear ?? shear}} brick={{surface: 'brick', approach, shear, slip}} />;
  if (kind === 'nest') {
    // the section nested at a small scale inside another drawing (as at a tile's edge during a zoom from the device)
    const c = cam ?? {x: 300, y: 600, z: 1};
    const s = c.z;
    return (
      <g>
        <rect x={0} y={0} width={W} height={H} fill="#2A3A44" />
        <g transform={`translate(${FACE_SX} ${H / 2}) scale(${s}) translate(0 ${-c.y})`}>
          <WedgeContent id={id} st={{surface, approach, shear}} z={s} view={{x0: -FACE_SX / s, x1: (W - FACE_SX) / s, y0: c.y - H / 2 / s, y1: c.y + H / 2 / s}} />
        </g>
      </g>
    );
  }
  return <WedgeView id={id} st={{surface: kind === 'brick' ? 'brick' : 'glass', approach, shear, slip, focus, focusK}} cam={cam ?? (kind === 'brick' ? BRICK_CAM : WEDGE_CAM)} />;
};

const Sheet: React.FC<{cells: FrameProps[]; band?: boolean}> = ({cells, band = true}) => (
  <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute', inset: 0, background: '#000'}}>
    {cells.slice(0, 16).map((c, i) => (
      <svg key={i} x={(i % 4) * 270} y={Math.floor(i / 4) * 480} width={270} height={480} viewBox={`0 0 ${W} ${H}`}>
        <Scene {...c} id={`gs${i}`} />
        {band && <rect x={0} y={1380} width={W} height={180} fill="none" stroke="#FF4FD8" strokeWidth={4} strokeDasharray="20 16" opacity={0.45} />}
        {c.label && (
          <g>
            <rect x={0} y={0} width={W} height={92} fill="#000" opacity={0.5} />
            <text x={26} y={64} fontSize={48} fill="#FFFFFF" fontFamily="monospace">
              {c.label}
            </text>
          </g>
        )}
      </svg>
    ))}
    {[1, 2, 3].map((i) => <rect key={`v${i}`} x={i * 270 - 1} y={0} width={2} height={H} fill="#000" />)}
    {[1, 2, 3].map((i) => <rect key={`h${i}`} x={0} y={i * 480 - 1} width={W} height={2} fill="#000" />)}
  </svg>
);

/** the deliverable sheet (quarter size ~ phone size): glass approach 1 shear 0 / .3 / .6 / 1; brick approach 0 / 1,
 *  shear 1, slip 1; the move into the molecules u 0 / .3 / .6 / 1; the molecular gap closing 0 / .45 / .75 / 1 */
const SHEET: FrameProps[] = [
  {kind: 'glass', shear: 0, label: 'glass shear 0'},
  {kind: 'glass', shear: 0.3, label: 'glass shear .3'},
  {kind: 'glass', shear: 0.6, label: 'glass shear .6'},
  {kind: 'glass', shear: 1, focus: 2, label: 'glass shear 1 f2'},
  {kind: 'brick', approach: 0, label: 'brick appr 0'},
  {kind: 'brick', approach: 1, label: 'brick appr 1'},
  {kind: 'brick', approach: 1, shear: 1, label: 'brick shear 1'},
  {kind: 'brick', approach: 1, shear: 1, slip: 1, label: 'brick slip 1'},
  {kind: 'trans', u: 0, label: 'move u 0'},
  {kind: 'trans', u: 0.3, label: 'move u .3'},
  {kind: 'trans', u: 0.6, label: 'move u .6'},
  {kind: 'trans', u: 1, label: 'move u 1'},
  {kind: 'mol', close: 0, label: 'mol close 0'},
  {kind: 'mol', close: 0.45, label: 'mol close .45'},
  {kind: 'mol', close: 0.75, label: 'mol close .75'},
  {kind: 'mol', close: 1, label: 'mol close 1'},
];
export const WedgeSheet: React.FC = () => <Sheet cells={SHEET} />;

/** any 16 states as a 4 x 4 sheet at quarter size (props: cells, band) */
export const GridSheet: React.FC<{cells: FrameProps[]; band?: boolean}> = ({cells, band}) => <Sheet cells={cells} band={band} />;

/** the reference timeline at 16 film frames (quarter size) */
export const BeatSheet: React.FC<{frames: number[]}> = ({frames}) => <Sheet cells={frames.map((f) => ({kind: 'beat', f, label: `${f}`}))} />;

/** one state at full size, with the caption band marked (props: FrameProps + band) */
export const WedgeFrame: React.FC<FrameProps & {band?: boolean}> = ({band = true, ...p}) => (
  <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute', inset: 0}}>
    <Scene {...p} id="wf" />
    {band && <rect x={0} y={1380} width={W} height={180} fill="none" stroke="#FF4FD8" strokeWidth={2} strokeDasharray="12 10" opacity={0.5} />}
  </svg>
);
export const BeatFrame: React.FC<{f: number}> = ({f}) => (
  <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute', inset: 0}}>
    <MicroBeat8 f={f} />
  </svg>
);

// (keeps the camera helpers referenced for quick experiments from --props)
void camAt;
void viewOf;
void G;
void K;

const anyFC = <T,>(c: React.FC<T>) => c as unknown as React.FC<Record<string, unknown>>;
export const DevRoot: React.FC = () => (
  <>
    <Still id="WedgeSheet" component={WedgeSheet} width={W} height={H} />
    <Still id="BeatSheet" component={anyFC(BeatSheet)} width={W} height={H} defaultProps={{frames: [222, 250, 280, 300, 320, 340, 360, 378, 386, 394, 402, 410, 418, 440, 460, 486]}} />
    <Still id="BeatFrame" component={anyFC(BeatFrame)} width={W} height={H} defaultProps={{f: 300}} />
    <Still id="GridSheet" component={anyFC(GridSheet)} width={W} height={H} defaultProps={{cells: []}} />
    <Still id="WedgeFrame" component={anyFC(WedgeFrame)} width={W} height={H} defaultProps={{kind: 'glass', approach: 1, shear: 0}} />
  </>
);
