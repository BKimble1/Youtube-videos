import React, {createContext, useContext} from 'react';
import {AbsoluteFill} from 'remotion';
import {H, W} from '../theme';

/**
 * Shot-by-shot camera. A scene renders its world in a 1920x1080 space; the camera
 * frames it with a zoom about a point (cx, cy) in that space. Layers declare a depth
 * (0 = infinitely far, 1 = the subject plane, >1 = foreground) and move with parallax.
 * Everything is a plain frame-driven transform, so nothing re-flows text while moving.
 */
export type Cam = {cx: number; cy: number; zoom: number};
const Ctx = createContext<Cam>({cx: W / 2, cy: H / 2, zoom: 1});
export const useCam = () => useContext(Ctx);

export const Camera: React.FC<{cam: Cam; children: React.ReactNode}> = ({cam, children}) => (
  <Ctx.Provider value={cam}>{children}</Ctx.Provider>
);

/** Interpolate between two framings. */
export const camLerp = (a: Cam, b: Cam, t: number): Cam => ({
  cx: a.cx + (b.cx - a.cx) * t,
  cy: a.cy + (b.cy - a.cy) * t,
  zoom: a.zoom + (b.zoom - a.zoom) * t,
});

export const Layer: React.FC<{depth?: number; children: React.ReactNode; style?: React.CSSProperties}> = ({depth = 1, children, style}) => {
  const cam = useCam();
  // Parallax: a layer at depth d is displaced by d × the camera offset; zoom is applied around the
  // frame centre so that the subject plane (depth 1) lands exactly where the camera points.
  const z = 1 + (cam.zoom - 1) * depth;
  const dx = (W / 2 - cam.cx) * depth * cam.zoom;
  const dy = (H / 2 - cam.cy) * depth * cam.zoom;
  return (
    <AbsoluteFill style={{transform: `translate(${dx}px, ${dy}px) scale(${z})`, transformOrigin: '50% 50%', ...style}}>{children}</AbsoluteFill>
  );
};
