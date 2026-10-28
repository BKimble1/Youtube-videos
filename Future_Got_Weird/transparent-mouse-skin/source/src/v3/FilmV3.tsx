// V3: the picture is composited outside Remotion from Blender Cycles plates (tools/v3/comp_v3.py -> public/v3/picture.mp4);
// here it gets the channel captions and the V2 mix (the same narration take and effect timing).
import React from 'react';
import {AbsoluteFill, Audio, OffthreadVideo, staticFile, useCurrentFrame} from 'remotion';
import {CaptionsV2} from '../v2/CaptionsV2';

// caption heights per caption: clear of the subject in each V3 shot (and of the Shorts UI bands)
export const CAP_Y3: [string, number][] = [
  ['They made', 300], ['transparent', 300], ['And watched', 300], ['moving', 300], ['Without', 300],
  ['They’d', 300], ['onto', 300],
  ['You see', 300], ['normally', 300], ['scattering', 300], ['But the', 300], ['how the', 300], ['making', 300], ['more like', 300],
  ['Then', 300], ['and the', 300], ['the moving', 300],
];

export type FilmV3Props = {audio: string | null; captions: boolean};
export const FilmV3: React.FC<FilmV3Props> = ({audio, captions}) => {
  const t = useCurrentFrame() / 30;
  return (
    <AbsoluteFill style={{backgroundColor: '#000'}}>
      <OffthreadVideo src={staticFile('v3/picture.mp4')} muted style={{width: 1080, height: 1920}} />
      {captions && <CaptionsV2 t={t} table={CAP_Y3} />}
      {audio && <Audio src={staticFile(`audio/${audio}.wav`)} />}
    </AbsoluteFill>
  );
};
