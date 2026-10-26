// S02 (1.90-3.40 s) "And a person holding a remote": the controller close-up. The cut is on the related action: the
// operator's gloved thumb is still down on the red fire button from the shot, and it releases: the thumb lifts up and
// away and the cap springs back (the soft click echoes the latch click of S01). The status LED stays amber (fired).
// Background: the lab, out of focus, seen past his hand from a little above the bench.
import React from 'react';
import {lookAt} from '../lib/cam';
import {V3} from '../lib/v3';
import {clamp, noise1, sr, smooth} from '../lib/ease';
import {LabBackdrop} from '../sets/Lab';
import {RemoteCloseUp} from '../crew/operator';
import {ShotProps} from './index';
import {FPS} from '../timeline';

/** the release: the thumb starts lifting two frames into the shot */
export const S02_RELEASE = 1.97;

export const S02: React.FC<ShotProps> = ({f}) => {
  const t = f / FPS;
  const lift = sr(t, S02_RELEASE, S02_RELEASE + 0.3);
  // the hand is held, not tripod-still: a slow, small sway (no shake)
  const sx = 4 * noise1(t * 0.7, 3), sy = 3 * noise1(t * 0.6, 7), rot = -6 + 0.8 * noise1(t * 0.5, 11);
  // the background moves with the hand very slightly (the operator's own small movement), soft
  const cam = lookAt([300, 900 + 20 * noise1(t * 0.5, 5), 700], [60, 780, -300] as V3, 900);
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920">
      <LabBackdrop id="s02b" cam={cam} blur={26} />
      <defs>
        <radialGradient id="s02v" cx="0.5" cy="0.45" r="0.75">
          <stop offset="0.55" stopColor="#0E1820" stopOpacity={0} />
          <stop offset="1" stopColor="#0E1820" stopOpacity={0.35} />
        </radialGradient>
      </defs>
      <rect width={1080} height={1920} fill="url(#s02v)" />
      <RemoteCloseUp id="s02cu" press={1 - 0.0 * lift} lift={lift} led="fired" x={560 + sx} y={830 + sy} scale={1.12} rotation={rot} />
    </svg>
  );
};
