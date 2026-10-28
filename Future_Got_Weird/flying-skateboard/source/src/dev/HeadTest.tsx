// Working sheet: head and helmet close-ups across a head turn and nod, from four camera angles (V5 rig check).
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Pilot} from '../art/Pilot';
import {pilotJoints, POSE0} from '../art/rig';
import {a3, frameYPR, H, lens, orbit, v3, W} from '../eng/v3';

export const HeadTest: React.FC<{az?: number[]; looks?: number[]; nod?: number; listen?: number; el?: number; dist?: number}> = ({az = [-40, -90, 20, 160], looks = [20, 50, 80], nod = 12, listen = 0, el = 8, dist = 1.1}) => {
  const B = frameYPR(v3(0, 1, 0), 0, 0, 0);
  const tiles: {a: number; look: number}[] = [];
  for (const a of az) for (const look of looks) tiles.push({a, look});
  return (
    <AbsoluteFill style={{backgroundColor: '#111'}}>
      {tiles.map(({a, look}, i) => {
        const j = pilotJoints(B, {...POSE0, look, nod, listen, level: 0.8, upright: 0.75});
        const L = lens(orbit(a3(j.Hc, v3(0, -0.12, 0)), a, el, dist, 0, 40));
        return (
          <div key={i} style={{position: 'absolute', left: (i % 4) * 270, top: Math.floor(i / 4) * 480, width: W, height: H, transform: 'scale(0.25)', transformOrigin: '0 0', overflow: 'hidden', background: 'linear-gradient(#BFE0EE,#E8F2F4)'}}>
            <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
              <Pilot id={`p${i}`} L={L} j={j} coach={0.6} />
            </svg>
            <div style={{position: 'absolute', left: 20, top: 20, fontSize: 70, color: '#000', fontFamily: 'monospace'}}>{`az${a} look${look}`}</div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};
