// V2 near-eye content for close-ups (L1 head coordinates, drawn inside the lead's eye fissure) and the contact lens
// in flight. The lens is a transparent dome: inside its outline the eye behind it is magnified (refraction), with a
// faint tint, a bright rim, glint crescents and a sweep highlight. On contact it squashes, overshoots and settles, and
// a tear-film ripple spreads from its edge. The pupil can constrict (visible light) or stay put (infrared).
import React from 'react';
import {LEADC as L} from '../theme';
import {Pt, P, lerp, clamp} from '../lib';
import {EYE} from '../art/Lead';

export type EyeState = {
  gx: number; gy: number;
  pupil: number; // 1 normal, < 1 constricted
  glow: number; // warm light registering in the eye (0..1)
  lensOn: number; // 0 no lens on the eye .. 1 seated
  squash: number; // lens rx factor (1 = rest)
  glint: number; // 0..1 sweep position of a highlight across the lens
  ripple: number; // 0..1 tear-film ripple after contact
};
export const EYE0: EyeState = {gx: 0.15, gy: 0, pupil: 1, glow: 0, lensOn: 0, squash: 1, glint: -1, ripple: -1};
export const LENS_C = P(EYE.iris.x + 1, EYE.iris.y);

const Iris: React.FC<{e: EyeState; id: string}> = ({e, id}) => {
  const ir = {x: EYE.iris.x + e.gx * 6, y: EYE.iris.y + e.gy * 5};
  const pr = 7.2 * e.pupil, pry = 10.2 * e.pupil;
  return (
    <g>
      <ellipse cx={ir.x} cy={ir.y} rx={EYE.irx} ry={EYE.iry} fill={`url(#${id}-iris)`} />
      {Array.from({length: 18}, (_, i) => {
        const a = (i / 18) * Math.PI * 2;
        return <line key={i} x1={ir.x + Math.cos(a) * pr * 1.15} y1={ir.y + Math.sin(a) * pry * 1.15} x2={ir.x + Math.cos(a) * 15.5} y2={ir.y + Math.sin(a) * 22} stroke={L.irisDeep} strokeWidth={0.9} opacity={0.35} />;
      })}
      <ellipse cx={ir.x} cy={ir.y} rx={EYE.irx * 0.62} ry={EYE.iry * 0.62} fill="none" stroke="#B9CDB2" strokeWidth={1.2} opacity={0.35} />
      <ellipse cx={ir.x} cy={ir.y} rx={EYE.irx} ry={EYE.iry} fill="none" stroke={L.irisDeep} strokeWidth={2.2} />
      <ellipse cx={ir.x + 0.6} cy={ir.y} rx={pr} ry={pry} fill="#110C0A" />
      {e.glow > 0.01 && <ellipse cx={ir.x} cy={ir.y} rx={EYE.irx} ry={EYE.iry} fill="#FFE08A" opacity={0.28 * e.glow} />}
      <ellipse cx={ir.x - 5} cy={ir.y - 9} rx={4.2} ry={5} fill="#FFFFFF" opacity={0.95} />
      <circle cx={ir.x + 6} cy={ir.y + 8} r={1.8} fill="#FFFFFF" opacity={0.75} />
    </g>
  );
};

const LensBody: React.FC<{c: Pt; rx: number; ry: number; e: EyeState; id: string; mag: number; behind: React.ReactNode}> = ({c, rx, ry, e, id, mag, behind}) => (
  <g>
    <defs>
      <clipPath id={`${id}-lc`}>
        <ellipse cx={c.x} cy={c.y} rx={rx} ry={ry} />
      </clipPath>
      <radialGradient id={`${id}-lt`} cx="0.35" cy="0.3" r="0.8">
        <stop offset="0" stopColor="#FFFFFF" stopOpacity={0.28} />
        <stop offset="0.6" stopColor="#DFF8FC" stopOpacity={0.08} />
        <stop offset="1" stopColor="#9FE0EA" stopOpacity={0.3} />
      </radialGradient>
    </defs>
    {/* refraction: what is behind the dome appears magnified inside its outline */}
    <g clipPath={`url(#${id}-lc)`}>
      <g transform={`translate(${c.x} ${c.y}) scale(${mag}) translate(${-c.x} ${-c.y})`}>{behind}</g>
      <ellipse cx={c.x} cy={c.y} rx={rx} ry={ry} fill={`url(#${id}-lt)`} />
      {e.glint > -0.5 && e.glint < 1.5 && (
        <rect x={c.x - rx * 2 + e.glint * rx * 4} y={c.y - ry * 1.4} width={rx * 0.35} height={ry * 2.8} fill="#FFFFFF" opacity={0.32} transform={`rotate(24 ${c.x} ${c.y})`} />
      )}
    </g>
    {/* rim: the thin edge of the lens catches light */}
    <ellipse cx={c.x} cy={c.y} rx={rx} ry={ry} fill="none" stroke="#7ED3DE" strokeWidth={2.2} />
    <ellipse cx={c.x} cy={c.y} rx={rx - 1.4} ry={ry - 1.4} fill="none" stroke="#FFFFFF" strokeWidth={1} opacity={0.6} />
    <path d={`M${c.x - rx * 0.62} ${c.y - ry * 0.55} Q${c.x - rx * 0.05} ${c.y - ry * 1.02} ${c.x + rx * 0.62} ${c.y - ry * 0.62}`} fill="none" stroke="#FFFFFF" strokeWidth={2.8} strokeLinecap="round" opacity={0.8} />
    <path d={`M${c.x + rx * 0.5} ${c.y + ry * 0.55} Q${c.x + rx * 0.75} ${c.y + ry * 0.2} ${c.x + rx * 0.78} ${c.y - ry * 0.05}`} fill="none" stroke="#FFFFFF" strokeWidth={1.8} strokeLinecap="round" opacity={0.55} />
    <circle cx={c.x - rx * 0.38} cy={c.y - ry * 0.5} r={2.2} fill="#FFFFFF" />
  </g>
);

// eye content drawn inside the fissure (sclera already painted by the head)
export const EyeContent: React.FC<{e: EyeState; id: string}> = ({e, id}) => {
  const rx = EYE.lens.rx * e.squash, ry = EYE.lens.ry / Math.sqrt(e.squash);
  return (
    <g>
      <defs>
        <radialGradient id={`${id}-iris`} cx="0.45" cy="0.42" r="0.6">
          <stop offset="0" stopColor={L.irisLight} />
          <stop offset="0.65" stopColor={L.iris} />
          <stop offset="1" stopColor={L.irisDeep} />
        </radialGradient>
      </defs>
      <Iris e={e} id={id} />
      {e.lensOn > 0.001 && (
        <g opacity={clamp(e.lensOn * 2)}>
          <LensBody c={LENS_C} rx={rx} ry={ry} e={e} id={`${id}-on`} mag={1.08} behind={<Iris e={e} id={id} />} />
          {e.ripple > 0 && e.ripple < 1 && (
            <ellipse cx={LENS_C.x} cy={LENS_C.y} rx={rx + 22 * e.ripple} ry={ry + 26 * e.ripple} fill="none" stroke="#FFFFFF" strokeWidth={2.4 * (1 - e.ripple)} opacity={0.8 * (1 - e.ripple)} />
          )}
        </g>
      )}
    </g>
  );
};

// the lens in flight on the fingertip: a larger dome (closer to camera) refracting the eye behind it
export const LensFlight: React.FC<{c: Pt; s: number; e: EyeState; id: string; fissure: string}> = ({c, s, e, id, fissure}) => {
  const rx = EYE.lens.rx * s * 0.92, ry = EYE.lens.ry * s;
  return (
    <LensBody c={c} rx={rx} ry={ry} e={e} id={`${id}-fl`} mag={1.12}
      behind={
        <g>
          <rect x={c.x - 80} y={c.y - 80} width={160} height={160} fill={L.skin} />
          <defs>
            <clipPath id={`${id}-flf`}>
              <path d={fissure} />
            </clipPath>
          </defs>
          <g clipPath={`url(#${id}-flf)`}>
            <path d={fissure} fill="#F7F2EA" />
            <Iris e={e} id="ec" />
          </g>
        </g>
      }
    />
  );
};
export {lerp};
