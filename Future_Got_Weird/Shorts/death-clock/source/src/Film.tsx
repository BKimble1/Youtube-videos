// The V3 film: one world per stretch, chosen by the V3 beat table (lib/timeline3.ts); screen-fixed overlays on top.
// Frames 0-7 are the cold open, which is also the continuation of the film's last push into the glass (the loop).
// Captioned master = captions on; clean version = captions off (device UI and the opening cue stay).
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {Aftermath3} from './shots/Aftermath3';
import {Journey3} from './shots/Journey3';
import {Flyover, HospitalBay, MAP_END, MapBlip, RoofWipe, WIPE} from './shots/Dispatch';
import {Captions, FictionCue} from './shots/Overlay';
import {B} from './lib/timeline3';
import './fonts';

export const shotNode = (f: number): React.ReactNode => {
  if (f < B.cut) return <Aftermath3 id="af" f={f} />;
  if (f < B.map0) return <Journey3 id="j3" f={f} />;
  if (f < MAP_END) return <MapBlip id="mb" f={f} />;
  if (f < B.travel0) return <HospitalBay id="hb" f={f} />;
  if (f < WIPE.out1) return <RoofWipe id="rw" f={f} before={<Flyover id="fo" f={f} />} after={<Aftermath3 id="af" f={f} />} />;
  return <Aftermath3 id="af" f={f} />;
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
