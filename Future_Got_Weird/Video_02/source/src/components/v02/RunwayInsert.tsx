import React from 'react';
import {AbsoluteFill, OffthreadVideo, Sequence, staticFile, useCurrentFrame} from 'remotion';
import inserts from '../../data/inserts.json';
import {useG} from '../../lib/SceneFrame';
import {insertsOff} from '../../lib/plate';

/** One accepted Runway insert (data/inserts.json). `inScene` inserts are drawn by their scene (under its labels);
 *  the others by Main's InsertLayer over everything. `playbackRate` fits the generated clip to the window. */
export type Insert = {
  id: string;
  file: string;
  from: number;
  to: number;
  trimStartFrames?: number;
  scale?: number;
  inScene?: boolean;
  playbackRate?: number;
};

export const INSERTS = inserts as Insert[];

/**
 * Draw an in-scene Runway insert at its global window [from, to): an opaque full-frame clip that replaces the camera
 * picture beneath the scene's screen-space labels. Its start and end frames were rendered from the same Remotion shot
 * (with labels hidden, `plate: true`), so it begins and ends on the rig. Place it after the scene's camera block and
 * before its labels.
 */
export const RunwayInsert: React.FC<{id: string}> = ({id}) => {
  const local = useCurrentFrame();
  const g = useG();
  const ins = INSERTS.find((i) => i.id === id && i.inScene);
  if (!ins || insertsOff()) return null;
  const offset = g - local;
  return (
    <Sequence from={ins.from - offset} durationInFrames={ins.to - ins.from} name={`runway ${ins.id}`} layout="none">
      <AbsoluteFill>
        <OffthreadVideo
          src={staticFile(ins.file)}
          muted
          startFrom={ins.trimStartFrames ?? 0}
          playbackRate={ins.playbackRate ?? 1}
          style={{width: '100%', height: '100%', objectFit: 'cover', transform: ins.scale ? `scale(${ins.scale})` : undefined}}
        />
      </AbsoluteFill>
    </Sequence>
  );
};
