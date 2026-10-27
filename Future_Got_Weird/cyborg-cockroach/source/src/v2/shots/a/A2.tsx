// A2 (55-82, "And a person holding a"): close-up of the operator's gloved left hand on the research remote, the lab
// soft behind it. The thumb hovers over the red fire button, gathers, comes down onto the cap and drives it into its
// guard (bottoming out at 2.35 s, on "person"); the status LED turns from green to amber; hand and remote give a little
// with the press and settle. One slow push toward the button through the shot ends with the pressed cap on MATCH, the
// spot where A3's backpack LED opens (the match cut).
import React from 'react';
import {RemoteCloseUp} from '../../../crew/operator';
import {LabWall2, Bench2} from '../../sets/Lab2';
import {ShotProps} from '../index2';
import {a2Props, a2Background, FPS_A} from './timingA';

/** the lab behind the hand: wall, shelves, the teal stripe and the bench, far out of focus */
export const SoftLab: React.FC<{id: string; dx: number; dy: number; z: number; blur?: number; benchTop?: number}> = ({id, dx, dy, z, blur = 14, benchTop = 1340}) => (
  <g>
    <defs>
      <filter id={`${id}-bl`} x="-10%" y="-10%" width="120%" height="120%">
        <feGaussianBlur stdDeviation={blur} />
      </filter>
      <radialGradient id={`${id}-vg`} cx="0.5" cy="0.5" r="0.75">
        <stop offset="0.5" stopColor="#0E1820" stopOpacity={0} />
        <stop offset="1" stopColor="#0E1820" stopOpacity={0.3} />
      </radialGradient>
    </defs>
    <rect width={1080} height={1920} fill="#D6E4EA" />
    <g filter={`url(#${id}-bl)`}>
      <g transform={`translate(${540 + dx} ${960 + dy}) scale(${z}) translate(-540 -960)`}>
        <g transform="translate(-260 -120) scale(1.35)">
          <LabWall2 id={`${id}w`} />
        </g>
        <Bench2 id={`${id}b`} top={benchTop} k={1.6} />
      </g>
    </g>
    <rect width={1080} height={1920} fill={`url(#${id}-vg)`} />
  </g>
);

export const A2: React.FC<ShotProps> = ({f}) => {
  const t = f / FPS_A;
  const p = a2Props(t);
  const bg = a2Background(t);
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920">
      <SoftLab id="a2l" {...bg} />
      <RemoteCloseUp id="a2cu" {...p} />
    </svg>
  );
};
