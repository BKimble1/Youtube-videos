import React from 'react';
import {Composition, registerRoot} from 'remotion';
import {LowerLeg3D, TurnRing} from '../art/leg3d';
import {BioFoot} from '../art/wyatt';

const yaws = [0, 30, 60, 90, 120, 150, 180, 180];
const Test: React.FC = () => {
  const w = 1080 / 2, h = 1920 / 4, s = 9;
  return (
    <div style={{width: 1080, height: 1920, background: '#e3eef3', position: 'relative'}}>
      {yaws.map((y, i) => (
        <svg key={i} width={w} height={h} style={{position: 'absolute', left: (i % 2) * w, top: Math.floor(i / 2) * h}}>
          <text x={10} y={30} fontSize={26}>{y}</text>
          <g transform={`translate(${w / 2} ${h * 0.78}) scale(${s})`}>
            {i < 7 ? (
              <>
                <TurnRing g={{A: {x: 0, y: 0}, sa: 0, yaw: y, point: 0, top: -12}} y={-5} r={6.5} a={1} dir={-1} half="back" iw={0.7} />
                <LowerLeg3D id={`l${i}`} g={{A: {x: 0, y: 0}, sa: 0, yaw: y, point: 0, top: -12}} iw={0.7} />
                <TurnRing g={{A: {x: 0, y: 0}, sa: 0, yaw: y, point: 0, top: -12}} y={-5} r={6.5} a={1} dir={-1} half="front" iw={0.7} />
              </>
            ) : (
              <BioFoot id="bf" A={{x: 0, y: 0}} fa={-90} h={-1} iw={0.7} />
            )}
          </g>
        </svg>
      ))}
    </div>
  );
};
registerRoot(() => <Composition id="L3" component={Test} durationInFrames={1} fps={30} width={1080} height={1920} />);
