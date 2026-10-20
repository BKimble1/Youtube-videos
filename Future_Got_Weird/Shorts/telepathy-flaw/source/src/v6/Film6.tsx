// The Telepathy Flaw V4 film: hard cuts between shot compositions on the approved narration, 28.000 s / 840 frames.
// Every shot is a pure function of its local time; overlays (opening cue, captions) are screen-fixed.
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {Captions, FictionCue} from './shots/Overlay6';
import {FPS, shotAt} from './plan6';
import {renderShot} from './shots/registry';
import '../fonts';

export const Film6: React.FC<{captions: boolean}> = ({captions}) => {
  const f = useCurrentFrame();
  const t = f / FPS;
  const shot = shotAt(t);
  return (
    <AbsoluteFill style={{backgroundColor: '#0E1A24'}}>
      <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}}>
        {renderShot(shot.id, t, f, t - shot.a, shot)}
        <FictionCue f={f} />
        {captions && <Captions f={f} fade={0.05} />}
      </svg>
    </AbsoluteFill>
  );
};
