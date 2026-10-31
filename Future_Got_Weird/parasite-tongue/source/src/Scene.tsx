// One frame of the film: the front set, the side set, or both while one dissolves into the other, over the water,
// with the grade (vignette, grain) on top.
import React from 'react';
import {basis} from './core/three';
import {FrontSet} from './front';
import {resetIsoIds} from './isopod';
import {SideSet} from './side';
import {Particles, WaterBg} from './water';
import {adult, cutAt, drawAt, flareAt, flowAt, foodAt, frontCam, gapeAt, juvenile, paleAt, parasiteOnTongue, shrinkAt, sideCam, swallowAt, X1, X2} from './story';
import {clamp, DUR, ss} from './lib';
import {IsoPose} from './isopod';

const Front: React.FC<{t: number; k: string}> = ({t, k}) => {
  const B = basis(frontCam(t));
  const food = foodAt(t);
  return (
    <g>
      <WaterBg t={t} />
      <Particles B={B} t={t} box={[[-260, -150, -130], [-6, 150, 150]]} n={110} />
      <FrontSet s={{B, g: gapeAt(t), t, fkey: k, iso: adult(t), food, swallow: swallowAt(t)}} />
    </g>
  );
};
const Side: React.FC<{t: number; k: string}> = ({t, k}) => {
  const B = basis(sideCam(t));
  const j = juvenile(t);
  const inside: IsoPose[] = [];
  const outside: IsoPose[] = [];
  if (t < 6.53 && j) (j.outside ? outside : inside).push(j.pose);
  else if (t >= 6.53) inside.push(t < 9.0 && j ? j.pose : parasiteOnTongue(t));
  const p0 = inside[0];
  return (
    <g>
      <WaterBg t={t} tone={1} />
      <Particles B={B} t={t} box={[[-80, 40, -140], [220, 420, 170]]} n={70} seed={3} />
      <SideSet s={{B, t, g: gapeAt(t), cut: cutAt(t), flare: flareAt(t), shrink: shrinkAt(t), flowOn: flowAt(t), draw: drawAt(t), biteX: p0 ? p0.o[0] + 0.4 : 13.9, pale: paleAt(t), inside, outside, fkey: k}} />
      <Particles B={B} t={t} box={[[-80, -300, -140], [220, -24, 170]]} n={40} seed={5} />
    </g>
  );
};

export const Scene: React.FC<{t: number; fkey: string}> = ({t, fkey}) => {
  resetIsoIds(fkey);
  const tt = ((t % DUR) + DUR) % DUR;
  const layers: React.ReactNode[] = [];
  const sideOp = tt < X1[0] || tt > X2[1] ? 0 : tt < X1[1] ? ss(tt, X1[0], X1[1]) : tt > X2[0] ? 1 - ss(tt, X2[0], X2[1]) : 1;
  if (sideOp < 1) layers.push(<Front key="f" t={tt} k={`${fkey}F`} />);
  if (sideOp > 0) layers.push(<g key="s" opacity={sideOp}><Side t={tt} k={`${fkey}S`} /></g>);
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute', left: 0, top: 0}}>
      {layers}
      <Grade t={tt} />
    </svg>
  );
};

const Grade: React.FC<{t: number}> = ({t}) => (
  <g pointerEvents="none">
    <defs>
      <radialGradient id="vig" cx="0.5" cy="0.5" r="0.75">
        <stop offset="0.55" stopColor="#000" stopOpacity={0} />
        <stop offset="1" stopColor="#020A0E" stopOpacity={0.55} />
      </radialGradient>
      <filter id="grain" x="0" y="0" width="100%" height="100%">
        <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={1} seed={Math.floor(t * 30) % 97} />
        <feColorMatrix type="matrix" values="0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0.06 0" />
      </filter>
    </defs>
    <rect width={1080} height={1920} fill="url(#vig)" />
    <rect width={1080} height={1920} filter="url(#grain)" opacity={clamp(1)} />
  </g>
);
