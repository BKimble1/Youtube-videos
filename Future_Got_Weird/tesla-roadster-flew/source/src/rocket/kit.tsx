// Rocket Short drawing kit: the companion's camera, arrows and colours, for a 1080x1920 frame.
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {C, F} from '../theme';
import {E} from '../lib/motion';
import {Arrow, ArcArrow, FLOW, FLOW_LIGHT, FORCE, WEIGHT, ramp, track, lerp, rnd} from '../companion2/kit';

export {Arrow, ArcArrow, FLOW, FLOW_LIGHT, FORCE, WEIGHT, ramp, track, lerp, rnd, E};
export const PW = 1080, PH = 1920;
export type Cam = {x: number; y: number; z: number};

/** Camera keyframes [t, cam, ease]: x/y eased linearly in world units, zoom in log space so pushes feel even. */
export const camAt = (t: number, keys: [number, Cam, ((x: number) => number)?][]): Cam => ({
  x: track(t, keys.map(([k, c, e]) => [k, c.x, e] as [number, number, ((x: number) => number)?])),
  y: track(t, keys.map(([k, c, e]) => [k, c.y, e] as [number, number, ((x: number) => number)?])),
  z: Math.exp(track(t, keys.map(([k, c, e]) => [k, Math.log(c.z), e] as [number, number, ((x: number) => number)?]))),
});
export const toScreen = (cam: Cam, x: number, y: number) => ({x: PW / 2 + (x - cam.x) * cam.z, y: PH / 2 + (y - cam.y) * cam.z});

/** World layer: children in world units; the camera puts (cam.x, cam.y) at the frame centre. */
export const PWorld: React.FC<{cam: Cam; children: React.ReactNode}> = ({cam, children}) => (
  <AbsoluteFill style={{overflow: 'hidden'}}>
    <svg width={PW} height={PH} style={{position: 'absolute', left: 0, top: 0}}>
      <g transform={`translate(${PW / 2} ${PH / 2}) scale(${cam.z}) translate(${-cam.x} ${-cam.y})`}>{children}</g>
    </svg>
  </AbsoluteFill>
);

/** A small screen-space tag with an optional leader line to a point. */
export const Tag: React.FC<{x: number; y: number; text: string; o: number; to?: {x: number; y: number}; color?: string; bg?: string; size?: number}> = ({x, y, text, o, to, color = C.ink, bg = C.cream, size = 34}) => {
  if (o <= 0.001) return null;
  return (
    <>
      {to && (
        <svg width={PW} height={PH} style={{position: 'absolute', left: 0, top: 0, opacity: o}}>
          <line x1={x} y1={y} x2={to.x} y2={to.y} stroke={C.ink} strokeWidth={6} strokeLinecap="round" />
          <line x1={x} y1={y} x2={to.x} y2={to.y} stroke={bg} strokeWidth={2.5} strokeLinecap="round" />
          <circle cx={to.x} cy={to.y} r={6} fill={bg} stroke={C.ink} strokeWidth={3} />
        </svg>
      )}
      <div style={{position: 'absolute', left: x, top: y, transform: `translate(-50%, -50%) scale(${0.9 + 0.1 * o})`, opacity: o, whiteSpace: 'nowrap'}}>
        <span style={{fontFamily: F.body, fontWeight: 800, fontSize: size, color, background: bg, border: `3px solid ${C.ink}`, borderRadius: size * 0.55, padding: `${size * 0.08}px ${size * 0.42}px`, boxShadow: '0 4px 0 rgba(22,42,50,0.25)'}}>{text}</span>
      </div>
    </>
  );
};

/** Window 0..1 inside [a, b] with soft edges. */
export const win = (t: number, a: number, b: number, rin = 0.2, rout = 0.2) =>
  Math.min(ramp(t, a, a + rin, E.out), 1 - ramp(t, b - rout, b, E.in));
