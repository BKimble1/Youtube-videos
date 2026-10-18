// The real demonstration footage (BYD's official stationary-hop clip), and how it lines up with the vector car.
// Everything that depends on the actual frames lives here: which source seconds are used, and where the car's wheels
// sit in the source frame (measured from the frames, see footage/README.md), so the vector car can be laid exactly
// over the real one for the match cut.
import React from 'react';
import {OffthreadVideo, staticFile} from 'remotion';
import {C, F} from './theme';

export type ClipCut = {file: string; from: number; to: number; rate?: number};
export const FOOTAGE = {
  available: false, // set true once public/footage/<file> exists and the ranges below are checked against frames
  file: 'footage/byd_ev-tech03.mp4',
  width: 1920,
  height: 1080,
  // source seconds of the side-profile hop used in the opening and the replay (to be confirmed on frames)
  opening: {from: 8.3, to: 11.3},
  replay: {from: 8.3, to: 11.3},
  // where the rear and front wheel centres sit in the source frame at rest (px), and the car's facing (+1 = right)
  wheelRear: {x: 560, y: 760},
  wheelFront: {x: 1360, y: 760},
  facing: 1 as 1 | -1,
  credit: 'BYD demonstration video',
};

/** The real clip, full-frame, starting at source second `from`, played from global time t0. */
export const RealClip: React.FC<{from: number; t0: number; t: number; opacity?: number}> = ({from, t0, t, opacity = 1}) => {
  if (opacity <= 0.001) return null;
  if (!FOOTAGE.available) {
    // Development placeholder only: never in the delivered master (the render script refuses while unavailable).
    return (
      <div style={{position: 'absolute', inset: 0, opacity, background: '#3A4650', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
        <div style={{fontFamily: F.display, fontSize: 54, color: C.cream, textAlign: 'center'}}>
          REAL FOOTAGE PENDING
          <div style={{fontSize: 32, opacity: 0.8}}>source {from.toFixed(2)} s + {(t - t0).toFixed(2)} s</div>
        </div>
      </div>
    );
  }
  return (
    <div style={{position: 'absolute', inset: 0, opacity}}>
      <OffthreadVideo src={staticFile(FOOTAGE.file)} startFrom={Math.round(from * 30)} muted style={{width: '100%', height: '100%', objectFit: 'cover'}} />
    </div>
  );
};
