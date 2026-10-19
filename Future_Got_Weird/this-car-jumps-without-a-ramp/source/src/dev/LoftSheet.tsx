// Model sheet for the 3D loft car: low front three-quarter, rear three-quarter, overhead, side.
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {C, F} from '../theme';
import {LoftCar} from '../car/loft';
import {Cam3} from '../kit/view3d';

export const LoftSheet: React.FC = () => {
  const views: {label: string; cam: Cam3}[] = [
    {label: 'low front three-quarter (from the outside of the bend)', cam: {eye: [5600, 620, -4400], yaw: Math.atan2(4400, -5600), pitch: 0.02, f: 1500}},
    {label: 'rear three-quarter, high', cam: {eye: [-6200, 2300, 5200], yaw: Math.atan2(-5200, 6200), pitch: -0.2, f: 1500}},
    {label: 'overhead', cam: {eye: [0, 9500, 0], yaw: Math.PI / 2, pitch: -Math.PI / 2, f: 1400}},
    {label: 'side (from the south)', cam: {eye: [0, 640, -9500], yaw: Math.PI / 2, pitch: 0, f: 1900}},
  ];
  return (
    <AbsoluteFill style={{background: C.paper}}>
      <svg width={1920} height={1080}>
        {views.map((v, i) => {
          const ox = (i % 2) * 960, oy = Math.floor(i / 2) * 540;
          const cam = {...v.cam, f: v.cam.f * 0.5, cx: 480, cy: 270};
          return (
            <g key={i}>
              <defs><clipPath id={`ls${i}`}><rect x={ox} y={oy} width={960} height={540} /></clipPath></defs>
              <rect x={ox} y={oy} width={960} height={540} fill={i % 3 === 0 ? '#CFE3B8' : '#BFD9A8'} />
              <g clipPath={`url(#ls${i})`}>
                <g transform={`translate(${ox} ${oy})`}>
                  <LoftCar cam={cam} pose={{e: 0, n: 0, psi: 0}} id={`l${i}`} ink={2} />
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
