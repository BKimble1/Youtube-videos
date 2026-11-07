// DUCK module test sheets: the preserved mallard robot on its pond (surface views, the waterline split view with the
// below-water schematic, the pond layers) and full-frame stills at the film's cameras.
import React from 'react';
import {AbsoluteFill, Composition, registerRoot} from 'remotion';
import {add3, basis, Basis, Orbit, V3} from '../three';
import {resetIds} from '../core/ids';
import {Duck, DuckLook, Pond} from '../art/duck';

const W = 1080, H = 1920;
// the film's pond timing (story.ts): the duck swims +x at 38 cm/s from x = -30 at t = 15.56
const T0 = 15.56;
const duckPos = (t: number): V3 => [38 * (t - T0) - 30, 0, 0];
const surfCam = (t: number): Orbit => ({target: add3(duckPos(t), [4, 8, 0]), yaw: 10, pitch: 6, dist: 700, scale: 14, cy: 1000});
const filmSurf = (t: number): Orbit => ({target: add3(duckPos(t), [4, 8, 0]), yaw: 10, pitch: 8, dist: 700, scale: 15, cy: 1000});
const splitCam = (t: number): Orbit => ({target: add3(duckPos(t), [3, -2, 0]), yaw: 6, pitch: 0.5, dist: 500, scale: 17, cy: 960});
const lerpO = (a: Orbit, b: Orbit, u: number): Orbit => ({
  target: [a.target[0] + (b.target[0] - a.target[0]) * u, a.target[1] + (b.target[1] - a.target[1]) * u, a.target[2] + (b.target[2] - a.target[2]) * u],
  yaw: a.yaw + (b.yaw - a.yaw) * u,
  pitch: a.pitch + (b.pitch - a.pitch) * u,
  dist: a.dist * Math.pow(b.dist / a.dist, u),
  scale: a.scale * Math.pow(b.scale / a.scale, u),
  cy: (a.cy ?? 960) + ((b.cy ?? 960) - (a.cy ?? 960)) * u,
});

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
        {cells.map((c, i) => (
          <g key={i} transform={`translate(${(i % cols) * w},${Math.floor(i / cols) * h}) scale(0.5)`}>
            <clipPath id={`cell${i}`}><rect width={W} height={H} /></clipPath>
            <g clipPath={`url(#cell${i})`}>
              <Frame1 B={basis(c.cam)} t={c.t} look={c.look} layers={c.layers} bg={c.bg} />
              {/* safe-area guides: caption band and the Shorts title band */}
              <rect y={470} width={W} height={1030} fill="none" stroke="rgba(255,0,0,0.35)" strokeWidth={3} strokeDasharray="12 10" />
            </g>
            <rect width={W} height={H} fill="none" stroke="#000" strokeWidth={4} />
          </g>
        ))}
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
  {cam: filmSurf(17.0), t: 17.0},
];
// sheet 2: the waterline split view with cut = 1 at two times, the transition, and the pond layers alone
const S2: Cell[] = [
  {cam: splitCam(17.95), t: 17.95, look: {cut: 1}},
  {cam: splitCam(18.18), t: 18.18, look: {cut: 1}},
  {cam: lerpO(filmSurf(17.7), splitCam(17.7), 0.5), t: 17.7, look: {cut: 0.5}},
  {cam: splitCam(18.0), t: 18.0, layers: {back: true, under: true, surface: true, front: true}},
];
// sheet 3: pond layers one by one at the split camera and the surface camera
const S3: Cell[] = [
  {cam: splitCam(18.0), t: 18.0, layers: {back: true}},
  {cam: splitCam(18.0), t: 18.0, layers: {under: true, surface: true}, bg: '#30363A'},
  {cam: filmSurf(16.5), t: 16.5, layers: {back: true, surface: true, front: true}},
  {cam: splitCam(18.0), t: 18.0, layers: {duck: true}, look: {cut: 1}, bg: '#CBD5D8'},
];

const Root: React.FC = () => (
  <>
    <Composition id="DuckSheet1" component={() => <Sheet cells={S1} />} durationInFrames={1} fps={30} width={W} height={H} />
    <Composition id="DuckSheet2" component={() => <Sheet cells={S2} />} durationInFrames={1} fps={30} width={W} height={H} />
    <Composition id="DuckSheet3" component={() => <Sheet cells={S3} />} durationInFrames={1} fps={30} width={W} height={H} />
    <Composition id="DuckSurfaceFull" component={() => <Full cam={filmSurf(16.6)} t={16.6} />} durationInFrames={1} fps={30} width={W} height={H} />
    <Composition id="DuckSplitFull" component={() => <Full cam={splitCam(18.05)} t={18.05} look={{cut: 1}} />} durationInFrames={1} fps={30} width={W} height={H} />
    <Composition id="DuckSurfaceClose" component={() => <Full cam={{...surfCam(16.3), scale: 30, cy: 1100}} t={16.3} />} durationInFrames={1} fps={30} width={W} height={H} />
  </>
);
registerRoot(Root);
