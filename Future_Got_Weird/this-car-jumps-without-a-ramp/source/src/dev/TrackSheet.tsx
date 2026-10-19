// Dev sheet: the handling circuit from the low outside camera, the front-view camera and the overhead.
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {C, F} from '../theme';
import {LoftCar} from '../car/loft';
import {TrackScene, trackAt, BEND_START} from '../kit/track3d';
import {Cam3, carToWorld} from '../kit/view3d';

const lookAt = (eye: [number, number, number], tgt: [number, number, number], f: number, cx = 960, cy = 540): Cam3 => {
  const d = [tgt[0] - eye[0], tgt[1] - eye[1], tgt[2] - eye[2]];
  return {eye, yaw: Math.atan2(d[2], d[0]), pitch: Math.atan2(d[1], Math.hypot(d[0], d[2])), f, cx, cy};
};
export const TrackSheet: React.FC = () => {
  const s = BEND_START + 38000;
  const tp = trackAt(s);
  const pose = {e: tp.e, n: tp.n, psi: tp.psi};
  const carC = carToWorld(pose, [0, 480, 0]);
  const views: {label: string; cam: Cam3; s0: number; s1: number}[] = [
    {label: 'low three-quarter, outside', cam: lookAt(carToWorld(pose, [5400, 760, -5800]), carC, 1500), s0: s - 40000, s1: s + 120000},
    {label: 'front view (camera ahead, looking back)', cam: {eye: carToWorld(pose, [5200, 1500, 0]), yaw: tp.psi + Math.PI, pitch: 0, f: 2100, cx: 960, cy: 300}, s0: s - 140000, s1: s + 20000},
    {label: 'overhead', cam: {eye: [tp.e, 70000, tp.n], yaw: Math.PI / 2, pitch: -Math.PI / 2, f: 1500}, s0: s - 60000, s1: s + 120000},
    {label: 'overhead, high', cam: {eye: [BEND_START + 20000, 220000, 40000], yaw: Math.PI / 2, pitch: -Math.PI / 2, f: 1400}, s0: 100000, s1: 420000},
  ];
  return (
    <AbsoluteFill style={{background: C.paper}}>
      <svg width={1920} height={1080}>
        {views.map((v, i) => {
          const ox = (i % 2) * 960, oy = Math.floor(i / 2) * 540;
          const cam = {...v.cam, f: v.cam.f * 0.5, cx: (v.cam.cx ?? 960) * 0.5, cy: (v.cam.cy ?? 540) * 0.5};
          return (
            <g key={i}>
              <defs><clipPath id={`ts${i}`}><rect x={ox} y={oy} width={960} height={540} /></clipPath></defs>
              <g clipPath={`url(#ts${i})`}>
                <g transform={`translate(${ox} ${oy})`}>
                  <TrackScene cam={cam} s0={v.s0} s1={v.s1} />
                  <LoftCar cam={cam} pose={pose} ink={2} />
                </g>
              </g>
              <text x={ox + 20} y={oy + 40} fontFamily={F.display} fontWeight={600} fontSize={26} fill={C.ink}>{v.label}</text>
            </g>
          );
        })}
      </svg>
    </AbsoluteFill>
  );
};
