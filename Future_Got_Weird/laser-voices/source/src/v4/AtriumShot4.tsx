// V4 atrium shots: the scene through the atrium camera, with the infrared-camera view (the beam visualised, the
// rest dimmed to a cool monochrome) revealed by a wipe, and the whisper's local air shimmer at his ear.
import React from 'react';
import {basis, proj, v3, V3, B} from './rig/geo4';
import {GUESSER, CLERK} from './rig/cast4';
import {AtriumView, Who} from './atriumScene4';
import {atriumCam} from './camAtrium4';
import {leadAt, friendAt, earOf, BEAM, beamStop, CharState} from './story4';
import {lineNode, depthOf} from './draw3';
import {Cam, W, H, clamp, FPS} from './core4';

export const IR_FILTER = (id: string) => (
  <filter id={id} x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
    <feColorMatrix type="saturate" values="0" />
    <feComponentTransfer>
      <feFuncR type="table" tableValues="0.02 0.16 0.42 0.62" />
      <feFuncG type="table" tableValues="0.05 0.22 0.5 0.7" />
      <feFuncB type="table" tableValues="0.09 0.28 0.55 0.72" />
    </feComponentTransfer>
  </filter>
);

/** the visualised beam: window to where it stops; a soft glow, a hot core and the modulation pulses travelling along it */
export const BeamViz: React.FC<{b: B; o: V3; e: V3; t: number; amt?: number; id: string}> = ({b, o, e, t, amt = 1, id}) => {
  const p = proj(b, o), q = proj(b, e);
  if (p.z < 0.05 && q.z < 0.05) return null;
  const L = Math.hypot(q.x - p.x, q.y - p.y);
  const off = -((t * 900) % 60);
  return (
    <g opacity={amt}>
      <defs><filter id={`${id}g`} x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation={6} /></filter></defs>
      <g filter={`url(#${id}g)`}>{lineNode(b, o, e, {stroke: '#FF9A2E', sw: 16, op: 0.7})}</g>
      {lineNode(b, o, e, {stroke: '#FFB347', sw: 5})}
      {lineNode(b, o, e, {stroke: '#FFF3D6', sw: 2})}
      {L > 4 && <line x1={p.x} y1={p.y} x2={q.x} y2={q.y} stroke="#FFFFFF" strokeWidth={4} strokeDasharray="6 54" strokeDashoffset={off} strokeLinecap="round" opacity={0.85} />}
      {/* where it stops: a small hot spot */}
      <circle cx={q.x} cy={q.y} r={Math.max(3, 0.03 * b.c.f / Math.max(0.3, q.z))} fill="#FFE2A8" opacity={0.9} filter={`url(#${id}g)`} />
    </g>
  );
};

/** the whisper at his ear: the air there shimmers (a local displacement of the picture behind it) */
export const Shimmer: React.FC<{b: B; at: V3; amt: number; t: number; id: string; children: React.ReactNode}> = ({b, at, amt, t, id, children}) => {
  if (amt <= 0.01) return null;
  const c = proj(b, at);
  if (c.z < 0.1) return null;
  const r = clamp((0.16 * b.c.f) / c.z, 30, 420);
  const fr = Math.round(t * FPS);
  return (
    <g>
      <defs>
        <filter id={`${id}f`} x="-20%" y="-20%" width="140%" height="140%">
          <feTurbulence type="fractalNoise" baseFrequency={`${(0.9 / r * 6).toFixed(4)} ${(1.6 / r * 6).toFixed(4)}`} numOctaves={2} seed={fr % 97} />
          <feDisplacementMap in="SourceGraphic" scale={(r * 0.13 * amt).toFixed(1)} xChannelSelector="R" yChannelSelector="G" />
        </filter>
        <radialGradient id={`${id}rg`}><stop offset="0.35" stopColor="#fff" stopOpacity={1} /><stop offset="1" stopColor="#fff" stopOpacity={0} /></radialGradient>
        <mask id={`${id}m`}><circle cx={c.x} cy={c.y} r={r} fill={`url(#${id}rg)`} /></mask>
      </defs>
      <g mask={`url(#${id}m)`}>
        <g filter={`url(#${id}f)`}>{children}</g>
        {/* the air thickens: a faint cool ring of pressure, breathing */}
        <circle cx={c.x} cy={c.y} r={r * (0.55 + 0.12 * Math.sin(t * 19))} fill="none" stroke="#DDF4F7" strokeWidth={r * 0.05} opacity={0.26 * amt} />
      </g>
    </g>
  );
};

export type AtriumShotProps = {t: number; cam?: Cam; ir?: number; irDir?: 1 | -1; whisper?: number; who?: Who[]};
export const atriumWho = (t: number): Who[] => [
  {s: leadAt(t), look: GUESSER, id: 'lead'},
  {s: friendAt(t), look: CLERK, id: 'fr', cup: 1},
];
export const AtriumShot: React.FC<AtriumShotProps> = ({t, cam, ir = 0, irDir = 1, whisper = 0, who}) => {
  const b = basis(cam ?? atriumCam(t));
  const people = who ?? atriumWho(t);
  const lead = people[0].s as CharState;
  const scene = <AtriumView b={b} t={t} who={people} />;
  const u = beamStop(people.slice(1).map((w) => w.s));
  const e = v3(BEAM.o.x + (BEAM.end.x - BEAM.o.x) * u, BEAM.o.y + (BEAM.end.y - BEAM.o.y) * u, BEAM.o.z + (BEAM.end.z - BEAM.o.z) * u);
  const wipeX = irDir > 0 ? ir * (W + 80) - 40 : W + 40 - ir * (W + 80);
  return (
    <svg width={W} height={H} style={{position: 'absolute'}}>
      <defs>
        {IR_FILTER('irf')}
        <clipPath id="irclip"><rect x={irDir > 0 ? 0 : wipeX} y={0} width={irDir > 0 ? Math.max(0, wipeX) : W - wipeX} height={H} /></clipPath>
      </defs>
      {scene}
      {whisper > 0 && <Shimmer b={b} at={earOf(lead)} amt={whisper} t={t} id="sh">{scene}</Shimmer>}
      {ir > 0 && (
        <g clipPath="url(#irclip)">
          <g filter="url(#irf)">{scene}</g>
          <BeamViz b={b} o={BEAM.o} e={e} t={t} id="bv" />
        </g>
      )}
      {ir > 0 && ir < 1 && <line x1={wipeX} y1={0} x2={wipeX} y2={H} stroke="#FFD08A" strokeWidth={3} opacity={0.8} />}
    </svg>
  );
};
export {depthOf};
