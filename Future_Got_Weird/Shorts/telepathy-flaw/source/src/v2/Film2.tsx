// The Telepathy Flaw V2 film: the world under the V2 camera, plus the screen-fixed overlays (the opening cue, the dark
// bust that interrupts the internal imagery, the captions). 28.0 s, 840 frames; the last frame hands over to frame 0.
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {Captions, FictionCue} from '../shots/Overlay';
import {Silhouette} from './art/Ui2';
import {World2} from './shots/World2';
import {camAt2, FPS, glowWorld, motorTagAlpha, silhouetteFlash} from './choreo2';
import {Tag} from '../art/Ui';
import {toScreen} from '../lib/camera';
import '../fonts';

export const Film2: React.FC<{captions: boolean}> = ({captions}) => {
  const f = useCurrentFrame();
  const t = f / FPS;
  const cam = camAt2(t);
  const sil = silhouetteFlash(t);
  const tag = motorTagAlpha(t);
  const gs = toScreen(cam, glowWorld(t));
  return (
    <AbsoluteFill style={{backgroundColor: '#DDEBF2'}}>
      <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}}>
        <World2 p="a" t={t} cam={cam} />
        {sil > 0.01 && (
          <g>
            <rect x={0} y={0} width={1080} height={1920} fill="#14040C" opacity={0.55 * sil} />
            <rect x={0} y={0} width={1080} height={1920} fill="#EF3340" opacity={0.12 * sil} />
            <Silhouette id="fsil" c={{x: 540 + 6 * Math.sin(f * 2.1), y: 880}} h={1200} alpha={sil} rim={1} jitter={sil} />
          </g>
        )}
        {tag > 0.01 && (
          <g opacity={tag}>
            <line x1={gs.x + 14} y1={gs.y - 10} x2={gs.x - 120} y2={gs.y - 150} stroke="#FFFFFF" strokeWidth={4} strokeLinecap="round" opacity={0.9} />
            <circle cx={gs.x + 12} cy={gs.y - 9} r={8} fill="#FFFFFF" stroke="#172B3A" strokeWidth={2.5} />
            <rect x={gs.x - 470} y={gs.y - 215} width={352} height={68} rx={34} fill="#172B3A" opacity={0.9} />
            <Tag c={{x: gs.x - 453, y: gs.y - 168}} text="Motor cortex" alpha={1} size={46} />
          </g>
        )}
        <FictionCue f={f} />
        {captions && <Captions f={f} fade={0.05} />}
      </svg>
    </AbsoluteFill>
  );
};
