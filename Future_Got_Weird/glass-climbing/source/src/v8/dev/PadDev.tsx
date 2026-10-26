// Dev stills for the V8 pad close-ups (Pad8 + PadScenes8). Not part of the film's Root; entry: ./entry_pad.ts.
//   PadSheet8   the contact sheet: the three scenes at 16 film frames through the recommended curves (quarter size,
//               about phone size), no props needed
//   FilmSheet   any film frames through the recommended curves: props {frames: [['A'|'B'|'C', frame], ...], cols, scale}
//   SceneA/B/C  one scene at full size from explicit parameters
//   ViewsA/C    a scene at several explicit parameter sets (half size)
//   PadViews    the device alone from nine angles (perspective); LegacyViews: V7's own pad states through Pad8
//               (orthographic, legacy surface), the drop-in check
import React from 'react';
import {Still} from 'remotion';
import {Cam, Layer} from '../../dc/camera';
import {H, W} from '../../lib';
import {H_BAR} from '../../world/rig';
import {allTiles, ARM_HANG, ARM_REACH, Pad3D, Pad3DState} from '../Pad8';
import {ContactScene8, contactShot, ContactView, SpringScene8, springShot, SpringView, SurfaceScene8, surfaceShot} from '../PadScenes8';

const Cell: React.FC<{x: number; y: number; s: number; children: React.ReactNode}> = ({x, y, s, children}) => (
  <div style={{position: 'absolute', left: x, top: y, width: W, height: H, transform: `scale(${s})`, transformOrigin: '0 0', overflow: 'hidden'}}>{children}</div>
);
/** a sheet of full-frame scenes at a given scale (columns x rows) */
const Sheet: React.FC<{cols: number; scale: number; cells: React.ReactNode[]}> = ({cols, scale, cells}) => (
  <div style={{position: 'absolute', inset: 0, background: '#111'}}>
    {cells.map((c, i) => (
      <Cell key={i} x={(i % cols) * W * scale} y={Math.floor(i / cols) * H * scale} s={scale}>
        {c}
      </Cell>
    ))}
  </div>
);

// ---- the device alone
const base: Pad3DState = {yaw: 40, pitch: 10, load: 1, contact: allTiles(1), cover: 1, gap: 0, tilt: 0, slide: 0, surface: 'none', hand: H_BAR, arm: ARM_HANG, strap: 1400, persp: 900};
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
const PadAt: React.FC<{id: string; st: Pad3DState; z: number; bg: string; dx?: number}> = ({id, st, z, bg, dx = 0}) => (
  <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute', inset: 0}}>
    <rect width={W} height={H} fill={bg} />
    <Layer cam={{x: 540 + dx, y: 970, z}} depth={1}>
      <g transform="translate(540 960)">
        <Pad3D id={id} st={st} z={z} />
      </g>
    </Layer>
  </svg>
);
export const PadViews: React.FC = () => (
  <div style={{position: 'absolute', inset: 0, background: '#9FB8C2'}}>
    {views.map((v, i) => (
      <Cell key={i} x={(i % 3) * 360} y={Math.floor(i / 3) * 640} s={1 / 3}>
        <PadAt id={`pv${i}`} st={{...base, ...v}} z={2.6} bg="#A9C3CC" />
      </Cell>
    ))}
  </div>
);
/** V7's own pad states through Pad8 (orthographic, legacy surface): the drop-in check */
const LEGACY: [Pad3DState, number][] = [
  [{yaw: -82, pitch: 6, load: 1, contact: allTiles(1), cover: 1, gap: 0, tilt: 0, slide: 0, surface: 'glass', hand: H_BAR, strap: 2600, ridges: 0.6}, 2.7],
  [{yaw: 58, pitch: 14, load: 1, contact: allTiles(1), cover: 0, gap: 0, tilt: 0, slide: 0, surface: 'glass', hand: H_BAR, strap: 2600}, 4.3],
  [{yaw: -78, pitch: 4, load: 0.6, contact: allTiles(0.7), cover: 1, gap: 0, tilt: 0, slide: 0, surface: 'glass', hand: H_BAR, strap: 2600, ridges: 0.35}, 3.1],
  [{yaw: 14, pitch: 2.3, load: 1, contact: allTiles(1), cover: 1, gap: 0, tilt: 0, slide: 0, surface: 'glass', hand: H_BAR, strap: 2600}, 3.2],
];
export const LegacyViews: React.FC = () => (
  <div style={{position: 'absolute', inset: 0, background: '#9FB8C2'}}>
    {LEGACY.map(([st, z], i) => (
      <Cell key={i} x={(i % 2) * 540} y={Math.floor(i / 2) * 960} s={1 / 2}>
        <PadAt id={`lg${i}`} st={st} z={z} bg="#7FA9BC" dx={20} />
      </Cell>
    ))}
  </div>
);

// ---- the scenes from explicit parameters
export const SceneA: React.FC<{load: number; drift: number}> = ({load, drift}) => <ContactScene8 id="sa" load={load} drift={drift} />;
export const SceneB: React.FC<{gap: number; load: number}> = ({gap, load}) => <SurfaceScene8 id="sb" gap={gap} load={load} />;
type VC = {load: number; cover: number; lost?: number; view?: SpringView; cam?: Cam};
export const SceneC: React.FC<VC> = (p) => <SpringScene8 id="sc" {...p} />;
type VA = {view: ContactView; cam: Cam; arm?: 'hang' | 'reach'; load?: number};
export const ViewsA: React.FC<{v: VA[]}> = ({v}) => (
  <Sheet cols={2} scale={0.5} cells={v.map((q, i) => <ContactScene8 key={i} id={`va${i}`} load={q.load ?? 1} view={q.view} cam={q.cam} arm={q.arm === 'hang' ? ARM_HANG : ARM_REACH} />)} />
);
export const ViewsC: React.FC<{v: VC[]; cols?: number; scale?: number}> = ({v, cols = 2, scale = 0.5}) => (
  <Sheet cols={cols} scale={scale} cells={v.map((q, i) => <SpringScene8 key={i} id={`vc${i}`} {...q} />)} />
);

// ---- the film's frames through the recommended curves
const atFrame = (sc: string, f: number, id: string) => {
  if (sc === 'A') {
    const p = contactShot(f);
    return <ContactScene8 id={id} load={p.load} drift={p.drift} cam={p.cam} />;
  }
  if (sc === 'B') {
    const p = surfaceShot(f);
    return <SurfaceScene8 id={id} gap={p.gap} load={p.load} cam={p.cam} />;
  }
  const p = springShot(f);
  return <SpringScene8 id={id} load={p.load} cover={p.cover} lost={p.lost} view={p.view} cam={p.cam} />;
};
export const FilmSheet: React.FC<{frames: [string, number][]; cols?: number; scale?: number}> = ({frames, cols = 4, scale = 0.25}) => (
  <Sheet cols={cols} scale={scale} cells={frames.map(([sc, f], i) => <React.Fragment key={i}>{atFrame(sc, f, `f${sc}${i}`)}</React.Fragment>)} />
);
const SHEET_FRAMES: [string, number][] = [
  ['A', 24], ['A', 30], ['A', 40], ['A', 66],
  ['B', 894], ['B', 903], ['B', 910], ['B', 928],
  ['C', 528], ['C', 552], ['C', 578], ['C', 598],
  ['C', 612], ['C', 630], ['C', 646], ['C', 664],
];
export const PadSheet8: React.FC = () => <FilmSheet frames={SHEET_FRAMES} />;

export const DevRoot: React.FC = () => (
  <>
    <Still id="PadSheet8" component={PadSheet8} width={1080} height={1920} />
    <Still id="FilmSheet" component={FilmSheet} width={1080} height={1920} defaultProps={{frames: [['C', 598]], cols: 1, scale: 1}} />
    <Still id="SceneA" component={SceneA} width={1080} height={1920} defaultProps={{load: 1, drift: 0}} />
    <Still id="SceneB" component={SceneB} width={1080} height={1920} defaultProps={{gap: 0, load: 0.5}} />
    <Still id="SceneC" component={SceneC} width={1080} height={1920} defaultProps={{load: 1, cover: 0, lost: 0}} />
    <Still id="ViewsA" component={ViewsA} width={1080} height={1920} defaultProps={{v: []}} />
    <Still id="ViewsC" component={ViewsC} width={1080} height={1920} defaultProps={{v: []}} />
    <Still id="PadViews" component={PadViews} width={1080} height={1920} />
    <Still id="LegacyViews" component={LegacyViews} width={1080} height={1920} />
  </>
);
