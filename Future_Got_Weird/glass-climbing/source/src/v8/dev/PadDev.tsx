// Dev stills for the V8 pad close-ups: the device from several angles, and contact sheets of the three scenes.
import React from 'react';
import {Still} from 'remotion';
import {Layer} from '../../dc/camera';
import {H, W} from '../../lib';
import {allTiles, Pad3D, Pad3DState} from '../Pad8';
import {ContactScene8, ContactView, SurfaceScene8} from '../PadScenes8';
import {ARM_HANG, ARM_REACH} from '../Pad8';
import {Cam} from '../../dc/camera';
import {H_BAR} from '../../world/rig';

const Cell: React.FC<{x: number; y: number; s: number; children: React.ReactNode}> = ({x, y, s, children}) => (
  <div style={{position: 'absolute', left: x, top: y, width: W, height: H, transform: `scale(${s})`, transformOrigin: '0 0', overflow: 'hidden'}}>{children}</div>
);

const base: Pad3DState = {yaw: 40, pitch: 10, load: 1, contact: allTiles(1), cover: 1, gap: 0, tilt: 0, slide: 0, surface: 'none', hand: H_BAR, strap: 1400, persp: 900};
const views: Partial<Pad3DState>[] = [
  {yaw: 0, pitch: 2},
  {yaw: 30, pitch: 8},
  {yaw: 58, pitch: 14},
  {yaw: 90, pitch: 10},
  {yaw: 122, pitch: 12},
  {yaw: 150, pitch: 8},
  {yaw: -78, pitch: 4},
  {yaw: 58, pitch: 14, cover: 0, cut: 1, emph: 1},
  {yaw: 122, pitch: 12, cover: 0, cut: 1, emph: 1},
];
export const PadViews: React.FC = () => (
  <div style={{position: 'absolute', inset: 0, background: '#9FB8C2'}}>
    {views.map((v, i) => (
      <Cell key={i} x={(i % 3) * 360} y={Math.floor(i / 3) * 640} s={1 / 3}>
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute', inset: 0}}>
          <rect width={W} height={H} fill="#A9C3CC" />
          <Layer cam={{x: 540, y: 960 - 80 / 2.6 * 0, z: 2.6}} depth={1}>
            <g transform="translate(540 960)">
              <Pad3D id={`pv${i}`} st={{...base, ...v}} z={2.6} />
            </g>
          </Layer>
        </svg>
      </Cell>
    ))}
  </div>
);

const big: Partial<Pad3DState>[] = [{yaw: 30, pitch: 8}, {yaw: 122, pitch: 12}, {yaw: 58, pitch: 14, cover: 0, cut: 1, emph: 1}, {yaw: 122, pitch: 12, cover: 0, cut: 1, emph: 1}];
export const PadBig: React.FC<{z: number}> = ({z}) => (
  <div style={{position: 'absolute', inset: 0, background: '#9FB8C2'}}>
    {big.map((v, i) => (
      <Cell key={i} x={(i % 2) * 540} y={Math.floor(i / 2) * 960} s={1 / 2}>
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute', inset: 0}}>
          <rect width={W} height={H} fill="#A9C3CC" />
          <Layer cam={{x: 540 + (i % 2 ? -20 : 60), y: 960 + 10, z}} depth={1}>
            <g transform="translate(540 960)">
              <Pad3D id={`pb${i}`} st={{...base, ...v}} z={z} />
            </g>
          </Layer>
        </svg>
      </Cell>
    ))}
  </div>
);

export const SceneA: React.FC<{load: number; drift: number}> = ({load, drift}) => <ContactScene8 id="sa" load={load} drift={drift} />;
/** a sheet of scene states at a given scale (columns x rows) */
const Sheet: React.FC<{cols: number; scale: number; cells: React.ReactNode[]}> = ({cols, scale, cells}) => (
  <div style={{position: 'absolute', inset: 0, background: '#111'}}>
    {cells.map((c, i) => (
      <Cell key={i} x={(i % cols) * W * scale} y={Math.floor(i / cols) * H * scale} s={scale}>
        {c}
      </Cell>
    ))}
  </div>
);
export const SheetA: React.FC = () => (
  <Sheet cols={2} scale={0.5} cells={[0.6, 0.75, 0.9, 1].map((l, i) => <ContactScene8 key={i} id={`a${i}`} load={l} drift={i / 3} />)} />
);

type VA = {view: ContactView; cam: Cam; arm?: 'hang' | 'reach'; load?: number};
export const ViewsA: React.FC<{v: VA[]}> = ({v}) => (
  <Sheet cols={2} scale={0.5} cells={v.map((q, i) => <ContactScene8 key={i} id={`va${i}`} load={q.load ?? 1} view={q.view} cam={q.cam} arm={q.arm === 'hang' ? ARM_HANG : ARM_REACH} />)} />
);

export const SceneB: React.FC<{gap: number; load: number}> = ({gap, load}) => <SurfaceScene8 id="sb" gap={gap} load={load} />;
export const SheetB: React.FC = () => (
  <Sheet cols={2} scale={0.5} cells={[[30, 0], [0, 0], [0, 0.45], [0, 1]].map(([g, l], i) => <SurfaceScene8 key={i} id={`b${i}`} gap={g} load={l} />)} />
);

export const DevRoot: React.FC = () => (
  <>
    <Still id="PadViews" component={PadViews} width={1080} height={1920} />
    <Still id="SceneA" component={SceneA} width={1080} height={1920} defaultProps={{load: 1, drift: 0}} />
    <Still id="SheetA" component={SheetA} width={1080} height={1920} />
    <Still id="SceneB" component={SceneB} width={1080} height={1920} defaultProps={{gap: 0, load: 0.5}} />
    <Still id="SheetB" component={SheetB} width={1080} height={1920} />
    <Still id="ViewsA" component={ViewsA} width={1080} height={1920} defaultProps={{v: []}} />
    <Still id="PadBig" component={PadBig} width={1080} height={1920} defaultProps={{z: 5}} />
  </>
);
