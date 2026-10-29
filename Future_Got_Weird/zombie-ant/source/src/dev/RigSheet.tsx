// Rig check: the master ant from several cameras (standing, and mandibles open/closed).
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {basis, orbitCam, V3} from '../core/three';
import {Items} from '../core/draw3';
import {frame, toW} from '../core/frame';
import {AntState, planted, REST_FOOT, solve} from '../ant/rig';
import {antItems} from '../ant/draw';

const standing = (mand: number): AntState => {
  const body = frame([0, 0, 1.45], [1, 0, 0], [0, 0, 1]);
  const st: AntState = {body, headPitch: 18, headYaw: 0, mand, antSpread: 0.5, antTw: [0, 0], legs: [], gasterPitch: 6, dead: 0};
  st.legs = REST_FOOT.map((p, i) => {
    const w = toW(body, p);
    return planted(st, i, [w[0], w[1], 0], [0, 0, 1]);
  });
  return st;
};
const VIEWS: {az: number; el: number; mand: number; label: string}[] = [
  {az: 0, el: 5, mand: 0.2, label: 'side'},
  {az: 0, el: 89, mand: 1, label: 'top, open'},
  {az: 90, el: 15, mand: 1, label: 'front, open'},
  {az: 35, el: 30, mand: 0, label: '3/4 closed'},
  {az: -140, el: 25, mand: 0.5, label: 'rear 3/4'},
  {az: 60, el: -30, mand: 1, label: 'below'},
];
export const RigSheet: React.FC = () => (
  <AbsoluteFill style={{background: '#DCE7D8'}}>
    {VIEWS.map((v, k) => {
      const B = basis(orbitCam({target: [0, 0, 1] as V3, az: v.az, el: v.el, d: 60, f: 60 * 30, cx: 270 + (k % 2) * 540, cy: 320 + Math.floor(k / 2) * 640}));
      const R = solve(standing(v.mand));
      return (
        <svg key={k} width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0}}>
          <Items items={antItems(B, R)} />
          <text x={(k % 2) * 540 + 20} y={Math.floor(k / 2) * 640 + 40} fontSize={30} fill="#333">{v.label}</text>
        </svg>
      );
    })}
  </AbsoluteFill>
);
