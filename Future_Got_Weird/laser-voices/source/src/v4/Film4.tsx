// FGW Laser Voices V4: the film. Five worlds (the atrium, the ear in section, the air at molecular scale, the
// transmitter's optics, the lab), joined by camera moves: push-throughs, match cuts and wipes. Narration-locked.
import React from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame} from 'remotion';
import {FPS, W, H, T_BLOCK, T_CLEAR, clamp, ss, kv} from './core4';
import {AtriumShot} from './AtriumShot4';
import {Captions3} from '../v3/Captions3';
import {SEC, whisperAt} from './cues4';
import {EarWorld} from './EarWorld4';
import {LabShot} from './LabShot4';

const Layer: React.FC<{op: number; children: React.ReactNode}> = ({op, children}) =>
  op <= 0.001 ? null : <AbsoluteFill style={{opacity: op}}>{children}</AbsoluteFill>;

export const Scene4: React.FC<{t: number}> = ({t}) => {
  const out: React.ReactNode[] = [];
  // atrium: A (0..5.9), B (6.8..9.15), F..H (23.4..)
  const atr = t < SEC.secIn + 0.06 ? 1 : t < SEC.secOut ? 0 : t < SEC.microIn + 0.12 ? 1 : t >= SEC.atrium2 ? 1 : 0;
  const ir = t < 20 ? kv(t, [[7.95, 0], [8.45, 1]]) : kv(t, [[27.95, 0], [28.2, 1], [30.32, 1], [30.56, 0]]);
  const irDir = t > 30.3 && t < 31 ? -1 : 1;
  if (atr) out.push(<Layer key="atr" op={1}><AtriumShot t={t} ir={ir} irDir={irDir as 1 | -1} whisper={whisperAt(t).visual} /></Layer>);
  // the ear section and the molecular air (one 2D world): B (5.75..6.95) and C (8.95..15.0)
  const earOp = t < SEC.secIn - 0.1 ? 0 : t < SEC.secOut + 0.1 ? ss(SEC.secIn - 0.12, SEC.secIn + 0.05, t) * (1 - ss(SEC.secOut - 0.05, SEC.secOut + 0.1, t))
    : t < SEC.lab ? ss(SEC.microIn - 0.1, SEC.microIn + 0.12, t) : 0;
  if (earOp > 0) out.push(<Layer key="ear" op={earOp}><EarWorld t={t} /></Layer>);
  if (t >= SEC.lab && t < SEC.atrium2) out.push(<Layer key="lab" op={1}><LabShot t={t} /></Layer>);
  return <>{out}</>;
};

export const Film4: React.FC<{audio?: string | false; captions?: boolean}> = ({audio = 'mix_v4', captions = true}) => {
  const t = useCurrentFrame() / FPS;
  return (
    <AbsoluteFill style={{background: '#1B2A31'}}>
      <Scene4 t={t} />
      {captions && <Captions3 t={t} />}
      {audio && <Audio src={staticFile(`audio/${audio}.wav`)} />}
    </AbsoluteFill>
  );
};
export const Film4Still: React.FC<{t: number; captions?: boolean}> = ({t, captions = true}) => (
  <AbsoluteFill style={{background: '#1B2A31'}}>
    <Scene4 t={t} />
    {captions && <Captions3 t={t} />}
  </AbsoluteFill>
);
export {T_BLOCK, T_CLEAR, clamp, W, H};
