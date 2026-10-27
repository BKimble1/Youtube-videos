// Working sheet: the pilot on the board from eight camera angles (rig and asset check).
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Board} from '../art/Board';
import {Pilot} from '../art/Pilot';
import {pilotJoints, POSE0, PilotPose} from '../art/rig';
import {frameYPR, H, lens, orbit, v3, W} from '../eng/v3';

const VIEWS: [number, number, number][] = [[-40, 12, 4.2], [-90, 5, 4.2], [-150, 20, 4.2], [160, 10, 4.2], [60, 25, 4.2], [20, -25, 4.0], [-60, -12, 3.2], [100, 60, 4.5]];
export const RigTest: React.FC<{pose?: Partial<PilotPose>; roll?: number; pitch?: number}> = ({pose = {}, roll = 0, pitch = 0}) => {
  const B = frameYPR(v3(0, 1, 0), 0, pitch, roll);
  const j = pilotJoints(B, {...POSE0, ...pose});
  return (
    <AbsoluteFill style={{backgroundColor: '#111'}}>
      {VIEWS.map(([az, el, d], i) => {
        const L = lens(orbit(v3(0, 1.75, 0), az, el, d, 0, 40));
        const above = el > 0;
        return (
          <div key={i} style={{position: 'absolute', left: (i % 4) * 270, top: Math.floor(i / 4) * 480, width: W, height: H, transform: 'scale(0.25)', transformOrigin: '0 0', overflow: 'hidden', background: 'linear-gradient(#BFE0EE,#E8F2F4)'}}>
            <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
              {above ? (
                <>
                  <Board id={`b${i}`} L={L} B={B} st={{phase: 0.1, rps: 4, thrust: 0.6}} />
                  <Pilot id={`p${i}`} L={L} j={j} coach={0.6} />
                </>
              ) : (
                <>
                  <Pilot id={`p${i}`} L={L} j={j} coach={0.6} />
                  <Board id={`b${i}`} L={L} B={B} st={{phase: 0.1, rps: 4, thrust: 0.6}} />
                </>
              )}
            </svg>
            <div style={{position: 'absolute', left: 20, top: 20, fontSize: 70, color: '#000', fontFamily: 'monospace'}}>{`az${az} el${el}`}</div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};
