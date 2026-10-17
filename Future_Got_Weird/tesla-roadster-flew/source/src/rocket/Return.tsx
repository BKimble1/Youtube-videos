// Payoff: Tesla's aerial of the second ramp run, at the recording's own speed (rec_224730 2:20.14 to 2:24.60): the car
// rolling upright on its jets, side jets firing, jets down into smoke, touchdown (2:24.3) just after "problems". No
// graphics ride on it: the real controlled landing carries the line.
import React from 'react';
import {AbsoluteFill, OffthreadVideo, staticFile, useCurrentFrame} from 'remotion';
import {Key, keyed} from '../short3/Clip';
import {AER_FILE0, AER_IN, FPS, WIPE} from './data';

const k = (pts: [number, number][]): Key[] => pts.map(([s, v]) => [s - AER_FILE0, v]);
// crop: centre (fractions of 1920 x 1080) and zoom over the 9:16 cover fit, keyed on rec_224730 time
const CX = k([[139.8, 0.47], [140.8, 0.48], [141.7, 0.49], [142.6, 0.5], [143.5, 0.528], [144.4, 0.538], [145.3, 0.538], [146.2, 0.512], [146.75, 0.51]]);
const CY = k([[139.8, 0.44], [141.7, 0.42], [143.5, 0.385], [144.4, 0.38], [145.3, 0.37], [145.75, 0.37], [146.4, 0.45], [146.75, 0.5]]);
const ZM = k([[139.8, 1.3], [144.3, 1.3], [145.6, 1.12], [146.75, 1.05]]);
const W = 1080, H = 1920;
const view = (tf: number) => {
  const S = (H / 1080) * keyed(ZM, tf);
  const vw = 1920 * S, vh = 1080 * S;
  const left = Math.min(0, Math.max(W - vw, W / 2 - keyed(CX, tf) * vw));
  const top = Math.min(0, Math.max(H - vh, H / 2 - keyed(CY, tf) * vh));
  return {S, vw, vh, left, top};
};

export const Return: React.FC<{start: number}> = ({start}) => {
  const frame = useCurrentFrame();
  const t = start + frame / FPS;
  const tf = AER_IN - AER_FILE0 + (t - WIPE);       // seconds into rk_aerial.mp4
  const v = view(tf);
  return (
    <AbsoluteFill style={{background: '#000'}}>
      <AbsoluteFill style={{overflow: 'hidden'}}>
        <OffthreadVideo src={staticFile('footage/rk_aerial.mp4')} trimBefore={Math.round((AER_IN - AER_FILE0) * FPS)} muted
          style={{position: 'absolute', left: v.left, top: v.top, width: v.vw, height: v.vh}} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
