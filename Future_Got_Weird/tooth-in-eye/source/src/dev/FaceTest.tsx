import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Face, NEUTRAL, NO_POCKET, EL} from '../face';
import {camT} from '../cam';

export const FaceTest: React.FC<{z: number; x: number; y: number; reveal: number; yaw: number; smile: number; brow: number; open: number; pocket: boolean}> = ({z, x, y, reveal, yaw, smile, brow, open, pocket}) => {
  const c = {x, y, z};
  return (
    <AbsoluteFill style={{backgroundColor: '#2B3A4A'}}>
      <svg width={1080} height={1920}>
        <g transform={camT(c)}>
          <Face id="f" px={1 / z} left="ookp" reveal={reveal} implRot={{yaw, pitch: 0, roll: 0}} parallax={0} expr={{...NEUTRAL, smile, brow, open}}
            pocket={pocket ? {...NO_POCKET, show: 1, see: 1, incision: 1, sutured: 1, heal: 0.2, tissue: 0.6, vessels: 0.6} : NO_POCKET}
            pocketImplant={pocket ? {x: 39, y: 16.5, rot: {yaw: 0, pitch: 0, roll: 0}} : null} light={1} />
        </g>
      </svg>
    </AbsoluteFill>
  );
};
