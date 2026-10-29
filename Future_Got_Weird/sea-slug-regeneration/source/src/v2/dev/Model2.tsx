// Working stills: the V2 creature in its key views and states, before animation.
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Path} from '../../geo';
import {Items} from '../../kit/draw3';
import {Scene} from '../../kit/scene';
import {orbitCam, V3} from '../../kit/three';
import {Piece} from '../slug/body';
import {SlugFloor, slugItem} from '../slug/Mesh';

const path = new Path([[0, 200], [0, 0], [0, -200]]);
const base = {path, tip: 250, t: 0.6};
type View = {label: string; az: number; el: number; d: number; f: number; pieces: Piece[]; target?: V3};
export const VIEWS: View[] = [
  {label: 'overhead', az: 0, el: 82, d: 300, f: 2300, pieces: [{...base, id: 'a', a0: 0, a1: 100}]},
  {label: '3/4 front macro', az: -38, el: 30, d: 260, f: 2300, pieces: [{...base, id: 'b', a0: 0, a1: 100}]},
  {label: 'low macro', az: -62, el: 11, d: 240, f: 2100, pieces: [{...base, id: 'c', a0: 0, a1: 100}]},
  {label: 'side', az: -90, el: 18, d: 300, f: 2300, pieces: [{...base, id: 'd', a0: 0, a1: 100}]},
  {label: 'neck pulling', az: -38, el: 30, d: 260, f: 2300, pieces: [{...base, id: 'e', a0: 0, a1: 100, gap: 7, pinch: 0.6}]},
  {label: 'separated', az: -38, el: 30, d: 260, f: 2300, pieces: [{...base, id: 'f', tip: 268, a0: 0, a1: 22, gap: 2, pinch: 1, seal: 1}, {...base, id: 'g', a0: 22, a1: 100, gap: 2, pinch: 1, seal: 1}]},
  {label: 'x-ray', az: -90, el: 22, d: 300, f: 2300, pieces: [{...base, id: 'h', a0: 0, a1: 100, xray: 0.8, heart: 1, beat: 0.5}]},
  {label: 'day 14', az: -38, el: 30, d: 260, f: 2300, pieces: [{...base, id: 'i', a0: 0, a1: 100, grow: 0.5}]},
];

export const Model2: React.FC<{i: number}> = ({i}) => {
  const v = VIEWS[i];
  const cam = orbitCam({target: v.target ?? [0, -10, 4], az: v.az, el: v.el, d: v.d, f: v.f});
  return (
    <AbsoluteFill>
      <Scene
        id={`m${i}`}
        cam={cam}
        bg="#E4EAEC"
        floor={(B) => v.pieces.map((p) => <SlugFloor key={p.id} B={B} p={p} id={`m${i}${p.id}`} />)}
        items={(B) => v.pieces.map((p) => slugItem(B, p))}
      />
      <div style={{position: 'absolute', left: 30, top: 24, fontSize: 60, fontFamily: 'monospace', color: '#333'}}>{v.label}</div>
    </AbsoluteFill>
  );
};

export const Model2Sheet: React.FC = () => (
  <AbsoluteFill style={{backgroundColor: '#111'}}>
    {VIEWS.map((_, i) => (
      <div key={i} style={{position: 'absolute', left: (i % 4) * 270, top: Math.floor(i / 4) * 480 + 480, width: 1080, height: 1920, transform: 'scale(0.25)', transformOrigin: '0 0', overflow: 'hidden'}}>
        <Model2 i={i} />
      </div>
    ))}
  </AbsoluteFill>
);
void Items;
