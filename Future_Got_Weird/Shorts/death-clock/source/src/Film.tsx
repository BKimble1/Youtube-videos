// The V2 film: units chosen by the beat table (lib/timeline.ts), screen-fixed overlays on top.
// Captioned master = captions on; clean version = captions off (device UI and the opening cue stay).
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {Aftermath} from './shots/Aftermath';
import {bandWorldAt, Journey, journeyCam} from './shots/Journey';
import {LiftOff, MapShot, RingWipe, Travel} from './shots/Rescue';
import {Captions, FictionCue} from './shots/Overlay';
import {toScreen} from './lib/camera';
import {B} from './lib/timeline';
import './fonts';

const ringAnchor = toScreen(journeyCam(B.ring), bandWorldAt(B.ring));

export const shotNode = (f: number): React.ReactNode => {
  if (f < B.ring) return <Journey id="j" f={f} />;
  if (f < B.map0 + 4) return <RingWipe id="rw" f={f} c={ringAnchor} under={<Journey id="j" f={f} />} over={<MapShot id="map" f={f} anchor={ringAnchor} />} />;
  if (f < B.lift0) return <MapShot id="map" f={f} anchor={ringAnchor} />;
  if (f < B.travel0) return <LiftOff id="lift" f={f} />;
  if (f < B.arrive0) return <Travel id="trav" f={f} />;
  return <Aftermath id="aft" f={f} />;
};

export const Film: React.FC<{captions: boolean}> = ({captions}) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{backgroundColor: '#DCEFF5'}}>
      <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}}>
        {shotNode(f)}
        <FictionCue f={f} />
        {captions && <Captions f={f} />}
      </svg>
    </AbsoluteFill>
  );
};
