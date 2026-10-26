// Dev stills for the V8 wedge section and the molecular view (contact sheet + single frames). Not part of the film.
import React from 'react';
import {Still} from 'remotion';
import {H, W} from '../../lib';
import {WedgeSplit, WedgeState, WedgeView, WEDGE_CAM} from '../Wedge8';
import {MolView, WedgeToMol} from '../Mol8';

const Cell: React.FC<{x: number; y: number; s: number; children: React.ReactNode}> = ({x, y, s, children}) => (
  <svg x={x} y={y} width={W * s} height={H * s} viewBox={`0 0 ${W} ${H}`}>
    {children}
  </svg>
);
const G = (approach: number, shear: number, focus?: number): WedgeState => ({surface: 'glass', approach, shear, focus});
const K = (approach: number, shear: number, slip = 0): WedgeState => ({surface: 'brick', approach, shear, slip});

export const WedgeSheet: React.FC = () => {
  const s = 0.25;
  const cells: React.ReactNode[] = [];
  const glass = [G(1, 0), G(1, 0.3), G(1, 0.6), G(1, 1, 2)];
  const brick = [K(0, 0), K(1, 0), K(1, 1), K(1, 1, 1)];
  glass.forEach((st, i) => cells.push(<Cell key={`g${i}`} x={i * 270} y={0} s={s}><WedgeView id={`sg${i}`} st={st} /></Cell>));
  brick.forEach((st, i) => cells.push(<Cell key={`b${i}`} x={i * 270} y={480} s={s}><WedgeView id={`sb${i}`} st={st} /></Cell>));
  [0, 0.3, 0.6, 1].forEach((u, i) => cells.push(<Cell key={`t${i}`} x={i * 270} y={960} s={s}><WedgeToMol id={`st${i}`} u={u} /></Cell>));
  [0, 0.4, 0.7, 1].forEach((c, i) => cells.push(<Cell key={`m${i}`} x={i * 270} y={1440} s={s}><MolView id={`sm${i}`} close={c} /></Cell>));
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute', inset: 0, background: '#000'}}>
      {cells}
      {[1, 2, 3].map((i) => <rect key={`v${i}`} x={i * 270 - 1} y={0} width={2} height={H} fill="#000" />)}
      {[1, 2, 3].map((i) => <rect key={`h${i}`} x={0} y={i * 480 - 1} width={W} height={2} fill="#000" />)}
    </svg>
  );
};

type FrameProps = {kind: string; approach?: number; shear?: number; slip?: number; focus?: number; u?: number; close?: number; cam?: {x: number; y: number; z: number}; t?: number};
const Scene: React.FC<FrameProps & {id: string}> = ({id, kind, approach = 1, shear = 0, slip = 0, focus, cam, u = 0, close = 0, t = 0}) =>
  kind === 'trans' ? (
    <WedgeToMol id={id} u={u} close={close} t={t} />
  ) : kind === 'mol' ? (
    <MolView id={id} close={close} t={t} />
  ) : kind === 'split' ? (
    <WedgeSplit id={id} glass={{surface: 'glass', approach, shear}} brick={{surface: 'brick', approach, shear, slip}} />
  ) : (
    <WedgeView id={id} st={{surface: kind === 'brick' ? 'brick' : 'glass', approach, shear, slip, focus}} cam={cam ?? WEDGE_CAM} />
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

export const DevRoot: React.FC = () => (
  <>
    <Still id="WedgeSheet" component={WedgeSheet} width={W} height={H} />
    <Still id="GridSheet" component={GridSheet as unknown as React.FC<Record<string, unknown>>} width={W} height={H} defaultProps={{cells: []}} />
    <Still id="WedgeFrame" component={WedgeFrame as React.FC<Record<string, unknown>>} width={W} height={H} defaultProps={{kind: 'glass', approach: 1, shear: 0}} />
  </>
);
