import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Lab, LabState} from '../it/lab';
import {orbit, Cam3} from '../it/cam3';
import {H_POINT} from '../it/hand';
import {DEV_TOP} from '../it/device';
import {BASE_MAN, EXN} from '../it/cast';

const pad = {x: 0, y: -(DEV_TOP + 80)};
const tg = (y: number, x = 0) => ({x, y, z: 0});
export const CAMS: Cam3[] = [
  orbit(tg(150, 120), 2600, 0, -4, 1500),
  orbit(tg(100, 60), 1400, 0, -6, 1500),
  orbit(tg(-pad.y, -10), 420, -18, -4, 1500),
  orbit(tg(50, 0), 900, 0, 1, 1500),
  orbit(tg(DEV_TOP, 0), 300, 0, -89, 1500),
  orbit(tg(DEV_TOP, 0), 380, 20, -35, 1500),
];
export const LabTest: React.FC<{i: number}> = ({i}) => {
  const s: LabState = {cam: CAMS[i], man: BASE_MAN, expr: EXN.wonder, hand: {pose: H_POINT, ang: 148, pad}};
  return (
    <AbsoluteFill style={{background: '#000'}}>
      <svg width={1080} height={1920} viewBox="0 0 1080 1920">
        <Lab s={s} id="t" />
      </svg>
    </AbsoluteFill>
  );
};
