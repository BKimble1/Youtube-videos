// Opening footage: the hop already airborne (Tesla's side replay, its own speed, with the parked Teslas and the Semi
// for scale), cut on the inverted profile to the first run's hang (close-up from below), cropped so Tesla's on-screen
// gauges stay out of frame; it fades away under the drawn car's outline (TraceOverlay) into the illustration.
import React from 'react';
import {AbsoluteFill, Sequence} from 'remotion';
import {Foot} from '../companion2/Foot';
import {E, ev, FPS, ramp, useT} from './kit3';

export const OPEN3 = {cut: 2.45, fadeA: 4.5, end: 4.73};
export const OpeningFoot: React.FC = () => {
  const t = useT(0);
  const out = 1 - ramp(t, OPEN3.fadeA, OPEN3.end - 0.05, E.inOut);
  return (
    <AbsoluteFill style={{opacity: out}}>
      <Sequence from={0} durationInFrames={Math.round(OPEN3.cut * FPS)}>
        <Foot src="c3_open_hop.mp4" volume={ev(0.7, 0)} view={() => ({x: 1000, y: 430, z: 1.2})} />
      </Sequence>
      <Sequence from={Math.round(OPEN3.cut * FPS)}>
        <Foot src="c3_hang.mp4" muted view={() => ({x: 900, y: 420, z: 1.3})} />
      </Sequence>
    </AbsoluteFill>
  );
};
