// Dev: render any rebuild shot at a time t (no captions).
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {SideShot} from '../shots/Side';
import {PairShot} from '../shots/Pair';
import {MicroShot} from '../shots/Micro';
import {DeviceShot} from '../shots/Device';
import {AimShot} from '../shots/Aim';
import {CloseShot} from '../shots/Close';

export const RBShot: React.FC<{shot: string; t: number}> = ({shot, t}) => (
  <AbsoluteFill style={{background: '#0B1E26'}}>
    <svg width={1080} height={1920} viewBox="0 0 1080 1920">
      {shot === 'pair' && <PairShot t={t} />}
      {shot === 'micro' && <MicroShot t={t} />}
      {shot === 'device' && <DeviceShot t={t} />}
      {shot === 'loop' && <CloseShot t={t} mode="loop" />}
      {shot === 'stop' && <CloseShot t={t} mode="stop" />}
      {(shot === 'aim' || shot === 'cross' || shot === 'leave') && <AimShot t={t} mode={shot} />}
      {shot === 'side' && <SideShot t={t} mode="side" />}
      {shot === 'block' && <SideShot t={t} mode="block" />}
    </svg>
  </AbsoluteFill>
);
