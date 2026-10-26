// Dev stills for the V8 wedge section and the molecular view (contact sheet + single frames). Not part of the film.
import React from 'react';
import {Still} from 'remotion';
import {H, W} from '../../lib';
import {BRICK_CAM, WedgeSplit, WedgeState, WedgeView, WEDGE_CAM} from '../Wedge8';
import {MicroBeat8, MolView, WedgeToMol} from '../Mol8';

const Cell: React.FC<{x: number; y: number; s: number; children: React.ReactNode}> = ({x, y, s, children}) => (
  <svg x={x} y={y} width={W * s} height={H * s} viewBox={`0 0 ${W} ${H}`}>
    {children}
  </svg>
);
const G = (approach: number, shear: number, focus?: number): WedgeState => ({surface: 'glass', approach, shear, focus});
const K = (approach: number, shear: number, slip = 0): WedgeState => ({surface: 'brick', approach, shear, slip});

/** the deliverable sheet: glass shear 0 / 0.3 / 0.6 / 1; brick approach 0 / 1, shear 1, slip 1; the move into the
 *  molecules u 0 / 0.3 / 0.6 / 1; the molecular gap closing (close 0 / 0.4 / 0.7 / 1). Quarter size ~ phone size. */
export const WedgeSheet: React.FC = () => {
  const s = 0.25;
  const cells: {node: React.ReactNode; label: string}[] = [];
  const glass: [WedgeState, string][] = [[G(1, 0), 'glass  shear 0'], [G(1, 0.3), 'glass  shear .3'], [G(1, 0.6), 'glass  shear .6'], [G(1, 1, 2), 'glass  shear 1  focus 2']];
  const brick: [WedgeState, string][] = [[K(0, 0), 'brick  approach 0'], [K(1, 0), 'brick  approach 1'], [K(1, 1), 'brick  shear 1'], [K(1, 1, 1), 'brick  slip 1']];
  glass.forEach(([st, l], i) => cells.push({node: <WedgeView id={`sg${i}`} st={st} />, label: l}));
  brick.forEach(([st, l], i) => cells.push({node: <WedgeView id={`sb${i}`} st={st} cam={BRICK_CAM} />, label: l}));
  [0, 0.3, 0.6, 1].forEach((u, i) => cells.push({node: <WedgeToMol id={`st${i}`} u={u} />, label: `move  u ${u}`}));
  [0, 0.4, 0.7, 1].forEach((c, i) => cells.push({node: <MolView id={`sm${i}`} close={c} />, label: `molecules  close ${c}`}));
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute', inset: 0, background: '#000'}}>
      {cells.map((c, i) => (
        <Cell key={i} x={(i % 4) * 270} y={Math.floor(i / 4) * 480} s={s}>
          {c.node}
          <rect x={0} y={0} width={W} height={96} fill="#000" opacity={0.45} />
          <text x={28} y={66} fontSize={50} fill="#FFFFFF" fontFamily="monospace">{c.label}</text>
        </Cell>
      ))}
      {[1, 2, 3].map((i) => <rect key={`v${i}`} x={i * 270 - 1} y={0} width={2} height={H} fill="#000" />)}
      {[1, 2, 3].map((i) => <rect key={`h${i}`} x={0} y={i * 480 - 1} width={W} height={2} fill="#000" />)}
    </svg>
  );
};

type FrameProps = {kind: string; approach?: number; shear?: number; slip?: number; focus?: number; u?: number; close?: number; cam?: {x: number; y: number; z: number}; t?: number};
const Scene: React.FC<FrameProps & {id: string}> = ({id, kind, approach = 1, shear = 0, slip = 0, focus, cam, u = 0, close = 0, t}) =>
  kind === 'trans' ? (
    <WedgeToMol id={id} u={u} close={close} t={t} />
  ) : kind === 'mol' ? (
    <MolView id={id} close={close} t={t} />
  ) : kind === 'split' ? (
    <WedgeSplit id={id} glass={{surface: 'glass', approach, shear}} brick={{surface: 'brick', approach, shear, slip}} />
  ) : (
    <WedgeView id={id} st={{surface: kind === 'brick' ? 'brick' : 'glass', approach, shear, slip, focus}} cam={cam ?? (kind === 'brick' ? BRICK_CAM : WEDGE_CAM)} />
  );
export const WedgeFrame: React.FC<FrameProps> = (p) => (
  <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute', inset: 0}}>
    <Scene {...p} id="wf" />
    {/* caption band guide */}
    <rect x={0} y={1380} width={W} height={180} fill="none" stroke="#FF00FF" strokeWidth={2} strokeDasharray="12 10" opacity={0.5} />
  </svg>
);

/** any 16 states as a 4 x 4 sheet at quarter size (props: cells) */
export const GridSheet: React.FC<{cells: FrameProps[]}> = ({cells}) => (
  <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute', inset: 0, background: '#000'}}>
    {cells.slice(0, 16).map((c, i) => (
      <svg key={i} x={(i % 4) * 270} y={Math.floor(i / 4) * 480} width={270} height={480} viewBox={`0 0 ${W} ${H}`}>
        <Scene {...c} id={`gs${i}`} />
      </svg>
    ))}
    {[1, 2, 3].map((i) => <rect key={`v${i}`} x={i * 270 - 1} y={0} width={2} height={H} fill="#000" />)}
    {[1, 2, 3].map((i) => <rect key={`h${i}`} x={0} y={i * 480 - 1} width={W} height={2} fill="#000" />)}
  </svg>
);

/** the reference timeline at 16 film frames (quarter size) */
export const BeatSheet: React.FC<{frames: number[]}> = ({frames}) => (
  <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute', inset: 0, background: '#000'}}>
    {frames.slice(0, 16).map((f, i) => (
      <svg key={i} x={(i % 4) * 270} y={Math.floor(i / 4) * 480} width={270} height={480} viewBox={`0 0 ${W} ${H}`}>
        <MicroBeat8 f={f} id={`bs${i}`} />
        <rect x={0} y={1380} width={W} height={180} fill="#000" opacity={0.25} />
        <text x={30} y={90} fontSize={72} fill="#FFFFFF" fontFamily="monospace" opacity={0.85}>{f}</text>
      </svg>
    ))}
    {[1, 2, 3].map((i) => <rect key={`v${i}`} x={i * 270 - 1} y={0} width={2} height={H} fill="#000" />)}
    {[1, 2, 3].map((i) => <rect key={`h${i}`} x={0} y={i * 480 - 1} width={W} height={2} fill="#000" />)}
  </svg>
);
export const BeatFrame: React.FC<{f: number}> = ({f}) => (
  <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute', inset: 0}}>
    <MicroBeat8 f={f} />
  </svg>
);

export const DevRoot: React.FC = () => (
  <>
    <Still id="WedgeSheet" component={WedgeSheet} width={W} height={H} />
    <Still id="BeatSheet" component={BeatSheet as unknown as React.FC<Record<string, unknown>>} width={W} height={H} defaultProps={{frames: [222, 240, 262, 285, 300, 318, 340, 372, 392, 404, 414, 424, 440, 462, 484, 498]}} />
    <Still id="BeatFrame" component={BeatFrame as unknown as React.FC<Record<string, unknown>>} width={W} height={H} defaultProps={{f: 300}} />
    <Still id="GridSheet" component={GridSheet as unknown as React.FC<Record<string, unknown>>} width={W} height={H} defaultProps={{cells: []}} />
    <Still id="WedgeFrame" component={WedgeFrame as React.FC<Record<string, unknown>>} width={W} height={H} defaultProps={{kind: 'glass', approach: 1, shear: 0}} />
  </>
);
