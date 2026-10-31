// Turnaround of the parasite model (adult and juvenile, several cameras) for checking the anatomy.
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {basis, V3} from '../core/three';
import {isopodEl, resetIsoIds} from '../isopod';

const ALL: {eye: V3; t: V3; k: number; L: number; label: string; extra?: object}[] = [
  {eye: [15, -60, 12], t: [15, 0, 2], k: 1, L: 30, label: 'side'},
  {eye: [-30, 0, 22], t: [10, 0, 0], k: 1, L: 30, label: 'front-above'},
  {eye: [15, -8, 70], t: [15, 0, 0], k: 1, L: 30, label: 'top'},
  {eye: [3, -14, 3], t: [3, 0, 1], k: 0, L: 6, label: 'juvenile side', extra: {gut: 0.8}},
  {eye: [14, -45, 30], t: [14, 0, 0], k: 1, L: 30, label: 'three-quarter', extra: {tongue: 0}},
  {eye: [14, -45, 30], t: [14, 0, 0], k: 1, L: 30, label: 'tongue look', extra: {tongue: 1, tuck: 1}},
];
const views = (globalThis as any).ISOV ? ALL.slice(0, 1) : ALL;
export const IsoTest: React.FC<{only?: number}> = ({only}) => (
  <AbsoluteFill style={{backgroundColor: '#5a2a2c'}}>
    <svg width={1080} height={1920}>
      {(only !== undefined ? [ALL[only]] : views).map((v, i) => {
        resetIsoIds(`v${i}`);
        const B = basis({eye: v.eye, target: v.t, f: only !== undefined ? 3000 : 900, cx: only !== undefined ? 540 : 270 + (i % 2) * 540, cy: only !== undefined ? 960 : 320 + Math.floor(i / 2) * 640});
        return <g key={i}>{isopodEl(B, {o: [0, 0, 0], fwd: [-1, 0, 0], up: [0, 0, 1], L: v.L, k: v.k, grip: 1, ...(v.extra ?? {})}, undefined, `k${i}`)}<text x={20 + (i % 2) * 540} y={40 + Math.floor(i / 2) * 640} fill="#fff" fontSize={28}>{v.label}</text></g>;
      })}
    </svg>
  </AbsoluteFill>
);
