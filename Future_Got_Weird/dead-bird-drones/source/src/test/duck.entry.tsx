// DUCK module test sheets: the preserved mallard robot on its pond (surface views, the waterline split view with the
// below-water schematic, the pond layers) and full-frame stills at the film's cameras.
import React from 'react';
import {AbsoluteFill, Composition, registerRoot} from 'remotion';
import {add3, basis, Basis, Orbit} from '../three';
import {resetIds, uid} from '../core/ids';
import {Duck, DuckLook, Pond} from '../art/duck';
// the film's own pond cameras and timing (story.ts): the dip and split cells use them exactly
import {duckCut, duckPos, pondCam} from '../story';

const W = 1080, H = 1920;
/** the contract's surface view: yaw 10, pitch 6, 14 px/cm */
const surfCam = (t: number): Orbit => ({target: add3(duckPos(t), [4, 8, 0]), yaw: 10, pitch: 6, dist: 700, scale: 14, cy: 1000});
const filmLook = (t: number): DuckLook => ({cut: duckCut(t), wake: 1});

type Layers = {back?: boolean; under?: boolean; duck?: boolean; surface?: boolean; front?: boolean};
const ALL: Layers = {back: true, under: true, duck: true, surface: true, front: true};
const Frame1: React.FC<{B: Basis; t: number; look?: DuckLook; layers?: Layers; bg?: string}> = ({B, t, look, layers = ALL, bg = '#8C9AA0'}) => (
  <g>
    <rect width={W} height={H} fill={bg} />
    {layers.back && <Pond B={B} t={t} layer="back" />}
    {layers.under && <Pond B={B} t={t} layer="under" />}
    {layers.duck && <Duck B={B} t={t} o={duckPos(t)} look={look} />}
    {layers.surface && <Pond B={B} t={t} layer="surface" />}
    {layers.front && <Pond B={B} t={t} layer="front" />}
  </g>
);

type Cell = {cam: Orbit; t: number; look?: DuckLook; layers?: Layers; bg?: string};
const Sheet: React.FC<{cells: Cell[]}> = ({cells}) => {
  resetIds('dk_');
  const cols = 2, w = W / cols, h = H / 2;
  return (
    <AbsoluteFill style={{background: '#444'}}>
      <svg width={W} height={H}>
        {cells.map((c, i) => {
          const cid = uid('cell');
          return (
          <g key={i} transform={`translate(${(i % cols) * w},${Math.floor(i / cols) * h}) scale(0.5)`}>
            <clipPath id={cid}><rect width={W} height={H} /></clipPath>
            <g clipPath={`url(#${cid})`}>
              <Frame1 B={basis(c.cam)} t={c.t} look={c.look} layers={c.layers} bg={c.bg} />
              {/* safe-area guides: caption band and the Shorts title band */}
              <rect y={470} width={W} height={1030} fill="none" stroke="rgba(255,0,0,0.35)" strokeWidth={3} strokeDasharray="12 10" />
            </g>
            <rect width={W} height={H} fill="none" stroke="#000" strokeWidth={4} />
          </g>
          );
        })}
      </svg>
    </AbsoluteFill>
  );
};
const Full: React.FC<{cam: Orbit; t: number; look?: DuckLook}> = ({cam, t, look}) => {
  resetIds('dkf_');
  return (
    <AbsoluteFill>
      <svg width={W} height={H}>
        <Frame1 B={basis(cam)} t={t} look={look} />
      </svg>
    </AbsoluteFill>
  );
};

// sheet 1: surface view (yaw 10, pitch 6, 14 px/cm) at three times + the film's surface camera
const S1: Cell[] = [
  {cam: surfCam(16.0), t: 16.0},
  {cam: surfCam(16.23), t: 16.23},
  {cam: surfCam(16.47), t: 16.47},
  {cam: pondCam(16.9), t: 16.9, look: filmLook(16.9)},
];
// sheet 2: the film's waterline split (cut = 1) at two times, mid-dip, and the pond layers alone at the split camera
const S2: Cell[] = [
  {cam: pondCam(18.0), t: 18.0, look: filmLook(18.0)},
  {cam: pondCam(18.27), t: 18.27, look: filmLook(18.27)},
  {cam: pondCam(17.56), t: 17.56, look: filmLook(17.56)},
  {cam: pondCam(18.1), t: 18.1, layers: {back: true, under: true, surface: true, front: true}},
];
// sheet 3: pond layers one by one at the split camera and the surface camera
const S3: Cell[] = [
  {cam: pondCam(18.1), t: 18.1, layers: {back: true}},
  {cam: pondCam(18.1), t: 18.1, layers: {under: true, surface: true}, bg: '#30363A'},
  {cam: pondCam(16.5), t: 16.5, layers: {back: true, surface: true, front: true}},
  {cam: pondCam(18.1), t: 18.1, layers: {duck: true}, look: {cut: 1}, bg: '#CBD5D8'},
];
// sheet 4: the film's camera dip (story.ts pondCam / duckCut) at four moments, the wipe rising with it
const S4: Cell[] = [17.42, 17.5, 17.58, 17.68].map((t) => ({cam: pondCam(t), t, look: filmLook(t)}));

// mechanism close-ups at four crank phases (one paddle cycle = 1 / 1.5 s), from the film's split camera angle
const MechSheet: React.FC = () => {
  resetIds('dkm_');
  const ts = [18.0, 18.0 + 1 / 6, 18.0 + 2 / 6, 18.0 + 3 / 6];
  return (
    <AbsoluteFill style={{background: '#444'}}>
      <svg width={W} height={H}>
        {ts.map((t, i) => {
          const cam: Orbit = {...pondCam(t), target: add3(duckPos(t), [-2, -3.5, 0]), scale: 34, cx: 540, cy: 900};
          const cid = uid('mcell');
          return (
            <g key={i} transform={`translate(${(i % 2) * 540},${Math.floor(i / 2) * 960}) scale(0.5)`}>
              <clipPath id={cid}><rect width={W} height={H} /></clipPath>
              <g clipPath={`url(#${cid})`}><Frame1 B={basis(cam)} t={t} look={{cut: 1}} /></g>
              <rect width={W} height={H} fill="none" stroke="#000" strokeWidth={4} />
            </g>
          );
        })}
      </svg>
    </AbsoluteFill>
  );
};

/** 8 consecutive film frames (30 fps) at the film's own cameras (story.ts pondCam / duckCut / duckPos), each cell a
 *  crop of the full frame (centre `crop`, magnified `zoom`), 2 columns x 4 rows: for checking motion frame to frame
 *  (the feet unfolding and folding over several frames; the pond floor sliding by without fading). */
const Strip: React.FC<{f0: number; crop?: {x: number; y: number}; zoom?: number}> = ({f0, crop = {x: 390, y: 1030}, zoom = 2}) => {
  resetIds('dkst_');
  const cw = 540, ch = 480;
  return (
    <AbsoluteFill style={{background: '#444'}}>
      <svg width={W} height={H}>
        {Array.from({length: 8}, (_, i) => {
          const f = f0 + i, t = f / 30;
          const cid = uid('scell');
          return (
            <g key={i} transform={`translate(${(i % 2) * cw},${Math.floor(i / 2) * ch})`}>
              <clipPath id={cid}><rect width={cw} height={ch} /></clipPath>
              <g clipPath={`url(#${cid})`}>
                <g transform={`translate(${cw / 2},${ch / 2}) scale(${zoom}) translate(${-crop.x},${-crop.y})`}>
                  <Frame1 B={basis(pondCam(t))} t={t} look={filmLook(t)} />
                </g>
              </g>
              <rect width={cw} height={ch} fill="none" stroke="#000" strokeWidth={3} />
              <rect x={8} y={8} width={64} height={30} fill="#000" opacity={0.6} />
              <text x={14} y={30} fill="#fff" fontSize={20} fontFamily="monospace">{f}</text>
            </g>
          );
        })}
      </svg>
    </AbsoluteFill>
  );
};

const Root: React.FC = () => (
  <>
    {/* the near foot unfolds (forward reversal between 546 and 547) while the far foot folds; then the reverse */}
    <Composition id="DuckFootStripA" component={() => <Strip f0={544} />} durationInFrames={1} fps={30} width={W} height={H} />
    <Composition id="DuckFootStripB" component={() => <Strip f0={534} />} durationInFrames={1} fps={30} width={W} height={H} />
    {/* the near pond floor under the duck at the split camera: pebbles and clumps slide by, world-anchored */}
    <Composition id="DuckFloorStrip" component={() => <Strip f0={548} crop={{x: 560, y: 1380}} zoom={1} />} durationInFrames={1} fps={30} width={W} height={H} />
    {/* the duck's reflection at the film's surface camera: broken ripple bands, frame to frame */}
    <Composition id="DuckReflStrip" component={() => <Strip f0={498} crop={{x: 620, y: 1190}} zoom={1.2} />} durationInFrames={1} fps={30} width={W} height={H} />
    <Composition id="DuckSheet1" component={() => <Sheet cells={S1} />} durationInFrames={1} fps={30} width={W} height={H} />
    <Composition id="DuckSheet2" component={() => <Sheet cells={S2} />} durationInFrames={1} fps={30} width={W} height={H} />
    <Composition id="DuckSheet3" component={() => <Sheet cells={S3} />} durationInFrames={1} fps={30} width={W} height={H} />
    <Composition id="DuckSheet4" component={() => <Sheet cells={S4} />} durationInFrames={1} fps={30} width={W} height={H} />
    <Composition id="DuckSurfaceFull" component={() => <Full cam={pondCam(16.6)} t={16.6} look={filmLook(16.6)} />} durationInFrames={1} fps={30} width={W} height={H} />
    <Composition id="DuckSplitFull" component={() => <Full cam={pondCam(18.2)} t={18.2} look={filmLook(18.2)} />} durationInFrames={1} fps={30} width={W} height={H} />
    <Composition id="DuckDipFull" component={() => <Full cam={pondCam(17.6)} t={17.6} look={filmLook(17.6)} />} durationInFrames={1} fps={30} width={W} height={H} />
    <Composition id="DuckMechClose" component={() => <MechSheet />} durationInFrames={1} fps={30} width={W} height={H} />
    <Composition id="DuckHeadClose" component={() => <Full cam={{target: add3(duckPos(16.3), [17, 14, 0]), yaw: 10, pitch: 6, dist: 700, scale: 48, cy: 960}} t={16.3} />} durationInFrames={1} fps={30} width={W} height={H} />
    <Composition id="DuckSurfaceClose" component={() => <Full cam={{...surfCam(16.3), target: add3(duckPos(16.3), [-6, 6, 0]), scale: 30, cy: 1000}} t={16.3} />} durationInFrames={1} fps={30} width={W} height={H} />
  </>
);
registerRoot(Root);
