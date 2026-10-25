// Glass Climbing V5: the pad close-ups (Pad3D) in their setting. Seen from his side, the pad is on the tower's glass:
// a pane reflecting the sky, a mullion and the floor fin's edge for scale, the brick pier beside the bay when it is in
// view. Seen through the glass, his forearm and the sky are behind the pad. Units: mm (Pad3D's own).
import React from 'react';
import {Cam, Layer} from '../dc/camera';
import {Lin} from '../dc/shade';
import {Pad3D, Pad3DState} from './Pad3D';

/** what lies beyond the pad (screen-space backing before the pad's own glass plane is drawn) */
export const PadScene: React.FC<{id: string; st: Pad3DState; cam: Cam; tile?: {c: number; r: number; k: number}}> = ({id, st, cam}) => {
  const through = Math.sin((st.yaw * Math.PI) / 180) < 0; // looking through the glass at the pad's face
  return (
    <>
      <Layer cam={cam} depth={3}>
        {through ? (
          <g>
            <Lin id={`${id}-sk`} d="M-3000,-3000 H3000 V3000 H-3000 Z" from={{x: 0, y: -1600}} to={{x: 0, y: 1600}} stops={[[0, '#8FC0DA'], [0.6, '#C8E2EC'], [1, '#E8EEE8']]} />
            {[-1400, -700, 300, 1100].map((x, i) => (
              <rect key={i} x={x} y={-200 - i * 140} width={420 + i * 60} height={3000} fill="#7FA3B8" opacity={0.35} />
            ))}
          </g>
        ) : (
          <Lin id={`${id}-gb`} d="M-3000,-3000 H3000 V3000 H-3000 Z" from={{x: 0, y: -1600}} to={{x: 0, y: 1600}} stops={[[0, '#9CC7D4'], [0.5, '#6A9DB0'], [1, '#3F6E82']]} />
        )}
      </Layer>
      <Layer cam={cam} depth={1}>
        <Pad3D id={`${id}-p`} st={st} z={cam.z} />
      </Layer>
    </>
  );
};
export type {Pad3DState};
