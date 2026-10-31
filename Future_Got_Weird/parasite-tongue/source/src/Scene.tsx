// One frame of the film (V2): the front set through the shot's camera, over the water, with the rewind look, the
// time-lapse's passing days and the grade (vignette, grain) on top.
import React from 'react';
import {basis} from './core/three';
import {FrontSet} from './front';
import {resetIsoIds} from './isopod';
import {Particles, WaterBg} from './water';
import {biteXAt, dayDimAt, foodAt, frontCam, gapeAt, parasiteAt, rewindAt, swallowAt, tongueAt} from './story';
import {DUR} from './lib';

export const Scene: React.FC<{t: number; fkey: string}> = ({t, fkey}) => {
  resetIsoIds(fkey);
  const tt = ((t % DUR) + DUR) % DUR;
  const B = basis(frontCam(tt));
  const rw = rewindAt(tt);
  const dim = dayDimAt(tt);
  const fid = `${fkey}rw`;
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute', left: 0, top: 0}}>
      <defs>
        <filter id={fid} x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
          <feColorMatrix type="saturate" values={(1 - 0.6 * rw).toFixed(3)} />
          <feColorMatrix type="matrix" values={`1 0 0 0 0  0 1 0 0 ${(0.015 * rw).toFixed(4)}  0 0 1 0 ${(0.05 * rw).toFixed(4)}  0 0 0 1 0`} />
        </filter>
      </defs>
      <g filter={rw > 0.001 ? `url(#${fid})` : undefined}>
        <WaterBg t={tt} />
        <Particles B={B} t={tt} box={[[-260, -150, -130], [-6, 150, 150]]} n={110} />
        <FrontSet s={{B, g: gapeAt(tt), t: tt, fkey, iso: parasiteAt(tt), food: foodAt(tt), swallow: swallowAt(tt), tongue: tongueAt(tt, biteXAt(tt))}} />
        {dim > 0.001 && <rect width={1080} height={1920} fill="#0A0204" opacity={dim} />}
      </g>
      {rw > 0.001 && <RewindLines t={tt} k={rw} />}
      <Grade t={tt} />
    </svg>
  );
};

/** a few faint horizontal scan bands drifting upward while time runs backward */
const RewindLines: React.FC<{t: number; k: number}> = ({t, k}) => (
  <g opacity={0.14 * k}>
    {[0, 1, 2].map((i) => {
      const y = 1920 - ((t * 900 + i * 640) % 2100);
      return <rect key={i} x={0} y={y} width={1080} height={6 + 4 * i} fill="#FFFFFF" />;
    })}
  </g>
);

const Grade: React.FC<{t: number}> = ({t}) => (
  <g pointerEvents="none">
    <defs>
      <radialGradient id="vig" cx="0.5" cy="0.5" r="0.75">
        <stop offset="0.55" stopColor="#000" stopOpacity={0} />
        <stop offset="1" stopColor="#020A0E" stopOpacity={0.5} />
      </radialGradient>
      <filter id="grain" x="0" y="0" width="100%" height="100%">
        <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={1} seed={Math.floor(t * 30) % 97} />
        <feColorMatrix type="matrix" values="0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0.06 0" />
      </filter>
    </defs>
    <rect width={1080} height={1920} fill="url(#vig)" />
    <rect width={1080} height={1920} filter="url(#grain)" />
  </g>
);
