// Working still: the master sea slug design in its key states, for inspection before animation.
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {H, W} from '../lib';
import {Path, projector} from '../geo';
import {BlurDefs, Piece, SlugPiece, SlugShadow} from '../slug/Slug';

const path = new Path([[0, 200], [0, 0], [0, -200]]);
// tip at arc 260 => snout at y = -60 (the path runs toward -y, so the head points down the screen)
const base = {path, tip: 250, t: 0.6};
type Cell = {label: string; pieces: Piece[]; tilt: number; zoom: number};
const cells: Cell[] = [
  {label: 'intact, top', tilt: 88, zoom: 7.4, pieces: [{...base, id: 'a', a0: 0, a1: 100}]},
  {label: 'intact, 58°', tilt: 58, zoom: 7.4, pieces: [{...base, id: 'b', a0: 0, a1: 100}]},
  {label: 'neck pulling', tilt: 78, zoom: 7.4, pieces: [{...base, id: 'c', a0: 0, a1: 100, gap: 8, pinch: 0.6}]},
  {label: 'separated', tilt: 78, zoom: 7.4, pieces: [{...base, id: 'd', tip: 266, a0: 0, a1: 25, gap: 3, pinch: 1, seal: 1}, {...base, id: 'e', a0: 25, a1: 100, gap: 3, pinch: 1, seal: 1}]},
  {label: 'x-ray heart', tilt: 82, zoom: 7.4, pieces: [{...base, id: 'f', a0: 0, a1: 100, xray: 1, heart: 1, beat: 0.5}]},
  {label: 'day 7', tilt: 70, zoom: 7.4, pieces: [{...base, id: 'g', a0: 0, a1: 100, grow: 0.12, xray: 0.8, heart: 1}]},
  {label: 'day 14', tilt: 70, zoom: 7.4, pieces: [{...base, id: 'h', a0: 0, a1: 100, grow: 0.5}]},
  {label: 'body flinch', tilt: 70, zoom: 7.4, pieces: [{...base, id: 'i', a0: 25, a1: 100, pinch: 1, seal: 1, flinch: 1}]},
];

export const ModelSheet: React.FC = () => (
  <AbsoluteFill style={{backgroundColor: '#1d2326'}}>
    {cells.map((c, i) => {
      const pr = projector({x: 0, y: 0, yaw: Math.PI / 2, tilt: c.tilt, zoom: c.zoom, oy: H / 2 - 40});
      return (
        <div key={i} style={{position: 'absolute', left: (i % 4) * 270, top: Math.floor(i / 4) * 480 + 480, width: W, height: H, transform: 'scale(0.25)', transformOrigin: '0 0', overflow: 'hidden', background: '#E6ECEE'}}>
          <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
            <BlurDefs />
            {c.pieces.map((p) => <SlugShadow key={p.id + 's'} p={p} pr={pr} />)}
            {c.pieces.map((p) => <SlugPiece key={p.id} p={p} pr={pr} />)}
          </svg>
          <div style={{position: 'absolute', left: 30, top: 24, fontSize: 80, fontFamily: 'monospace', color: '#333'}}>{c.label}</div>
        </div>
      );
    })}
  </AbsoluteFill>
);

/** one big view for detail checks */
export const ModelBig: React.FC<{tilt: number; zoom: number; grow?: number; xray?: number}> = ({tilt, zoom, grow, xray}) => {
  const pr = projector({x: 0, y: 0, yaw: Math.PI / 2, tilt, zoom});
  const p: Piece = {...base, id: 'big', a0: 0, a1: 100, grow, xray, heart: xray};
  return (
    <AbsoluteFill style={{backgroundColor: '#E6ECEE'}}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        <BlurDefs />
        <SlugShadow p={p} pr={pr} />
        <SlugPiece p={p} pr={pr} />
      </svg>
    </AbsoluteFill>
  );
};
