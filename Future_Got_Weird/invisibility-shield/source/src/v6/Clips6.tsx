// V4 Runway clip-replacement slots. Each slot names the shot, the film time range, the clip file (placed in
// source/public/runway/, conformed to 1080x1920 at 30 fps), the frame offset into the clip, the blend and opacity.
// A slot with src null renders nothing, so the vector animation always stands on its own. In this build every slot
// is empty: the Runway outputs could not be downloaded into the render environment (see
// production/v4/RUNWAY_MANIFEST.md), so none could be inspected or composited.
// The layer sits above the vector picture and below the captions; Runway output never carries text into the film.
import React from 'react';
import {OffthreadVideo, Sequence, staticFile} from 'remotion';

export type ClipSlot = {id: string; shot: string; t0: number; t1: number; src: string | null; offset: number; blend: React.CSSProperties['mixBlendMode']; opacity: number; note: string};
export const CLIP_SLOTS: ClipSlot[] = [
  {id: 'RW01', shot: 'lens (macro hold)', t0: 8.05, t1: 10.6, src: null, offset: 0.4, blend: 'screen', opacity: 0.3,
    note: 'light-only glints on the ribs; screen-blended so only highlights add; the vector ribs and slivers stay underneath'},
  {id: 'RW02', shot: 'pov (she sinks behind the panel)', t0: 2.95, t1: 4.42, src: null, offset: 0, blend: 'normal', opacity: 1,
    note: 'start/end-frame interpolation of our two POV frames; only usable if her design and the panel stay locked'},
  {id: 'RW03', shot: 'pov3 (the floating hand)', t0: 20.05, t1: 20.9, src: null, offset: 0, blend: 'normal', opacity: 1,
    note: 'finger wiggle from our POV frame; reject on any extra finger, morph or line boil'},
];

export const ClipLayer: React.FC = () => (
  <>
    {CLIP_SLOTS.filter((s) => s.src).map((s) => (
      <Sequence key={s.id} from={Math.round(s.t0 * 30)} durationInFrames={Math.round((s.t1 - s.t0) * 30)}>
        <div style={{position: 'absolute', inset: 0, mixBlendMode: s.blend, opacity: s.opacity}}>
          <OffthreadVideo src={staticFile(`runway/${s.src}`)} startFrom={Math.round(s.offset * 30)} muted style={{width: 1080, height: 1920, objectFit: 'cover'}} />
        </div>
      </Sequence>
    ))}
  </>
);
export const Clip4: React.FC<{t: number; shot: string}> = () => null;
