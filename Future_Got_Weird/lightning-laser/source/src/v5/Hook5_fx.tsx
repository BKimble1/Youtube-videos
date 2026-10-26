// V5 hook post effects (HOOK owner), applied to the whole frame:
//   the glitch (1.73-2.0, on the crack): RGB channel split, horizontal tear bands (slices of the image shifted
//     sideways), a brief shake of the IMAGE (the camera rig does not move), scanlines; frame-locked and short
//   the whip (2.13-2.37): vertical motion blur and streaks while the camera whips up out of the room and rockets on
//     outside (strongest on the cut, gone as the rocket slows)
import React from 'react';
import {clamp, fmt, hash} from '../dc/math';

type Tear = {y: number; h: number; dx: number};
export type Glitch = {rgb: number; shake: {x: number; y: number}; tears: Tear[]; scan: number};
/** per film frame (the crack is at 1.75 = frame 52.5) */
const G: Record<number, {rgb: number; sx: number; sy: number; tears: number; amp: number; scan: number}> = {
  52: {rgb: 3, sx: 0, sy: 0, tears: 1, amp: 18, scan: 0.12},
  53: {rgb: 16, sx: 12, sy: -7, tears: 3, amp: 60, scan: 0.3},
  54: {rgb: 10, sx: -9, sy: 5, tears: 2, amp: 46, scan: 0.35},
  55: {rgb: 13, sx: 7, sy: 3, tears: 4, amp: 70, scan: 0.3},
  56: {rgb: 7, sx: -5, sy: -3, tears: 2, amp: 36, scan: 0.25},
  57: {rgb: 4, sx: 2, sy: 0, tears: 2, amp: 22, scan: 0.16},
  58: {rgb: 2, sx: 0, sy: 0, tears: 1, amp: 12, scan: 0.08},
  59: {rgb: 0, sx: 0, sy: 0, tears: 0, amp: 0, scan: 0.04},
};
export const glitchAt = (t: number): Glitch | null => {
  if (t > 3) return null;
  const f = Math.round(t * 30);
  const g = G[f];
  if (!g) return null;
  const tears: Tear[] = Array.from({length: g.tears}, (_, i) => {
    const y = 160 + 1560 * hash(f * 7 + i, 6101);
    const h = 26 + 120 * hash(f * 11 + i, 6103);
    const dx = (hash(f * 13 + i, 6105) < 0.5 ? -1 : 1) * g.amp * (0.5 + 0.5 * hash(f * 17 + i, 6107));
    return {y, h, dx};
  });
  return {rgb: g.rgb, shake: {x: g.sx, y: g.sy}, tears, scan: g.scan};
};

/** the whip's vertical blur (px) by film time: the room's last frames and the rocket's first */
export const whipBlur = (t: number) => {
  const f = Math.round(t * 30);
  return ({64: 6, 65: 22, 66: 60, 67: 110, 68: 90, 69: 50, 70: 24, 71: 10} as Record<number, number>)[f] ?? 0;
};

/** the glitch as one filter pass over the frame (the scene is drawn once): the RGB channel split, then each tear band
 *  is the split image offset sideways inside its band (a primitive subregion), with a faint colour cast */
const glitchFilter = (id: string, g: Glitch) => (
  <filter id={id} filterUnits="userSpaceOnUse" x={-40} y={-40} width={1160} height={2000} colorInterpolationFilters="sRGB">
    {g.rgb > 0 ? (
      <>
        <feColorMatrix in="SourceGraphic" type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="r" />
        <feOffset in="r" dx={fmt(-g.rgb)} dy={fmt(g.rgb * 0.25)} result="ro" />
        <feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0" result="gg" />
        <feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" result="b" />
        <feOffset in="b" dx={fmt(g.rgb)} dy={fmt(-g.rgb * 0.25)} result="bo" />
        <feComposite in="ro" in2="gg" operator="arithmetic" k1={0} k2={1} k3={1} k4={0} result="rg" />
        <feComposite in="rg" in2="bo" operator="arithmetic" k1={0} k2={1} k3={1} k4={0} result="split" />
      </>
    ) : (
      <feOffset in="SourceGraphic" dx={0} dy={0} result="split" />
    )}
    {g.tears.map((b, i) => (
      <React.Fragment key={i}>
        <feOffset in="split" dx={fmt(b.dx)} dy={0} x={-40} y={fmt(b.y)} width={1160} height={fmt(b.h)} result={`t${i}`} />
        <feFlood floodColor={i % 2 ? '#7CF4FF' : '#C9A8FF'} floodOpacity={0.12} x={-40} y={fmt(b.y)} width={1160} height={fmt(b.h)} result={`c${i}`} />
        <feBlend in={`c${i}`} in2={`t${i}`} mode="screen" x={-40} y={fmt(b.y)} width={1160} height={fmt(b.h)} result={`u${i}`} />
      </React.Fragment>
    ))}
    <feMerge>
      <feMergeNode in="split" />
      {g.tears.map((_, i) => <feMergeNode key={i} in={`u${i}`} />)}
    </feMerge>
  </filter>
);

/** the frame through the glitch and the whip (children: the whole scene, drawn once) */
export const Post5: React.FC<{t: number; id: string; children: React.ReactNode}> = ({t, id, children}) => {
  const g = glitchAt(t);
  const wb = whipBlur(t);
  if (!g && wb <= 0) return <>{children}</>;
  const shake = g ? g.shake : {x: 0, y: 0};
  const sc = g && (shake.x || shake.y) ? 1.03 : 1;
  const tr = `translate(${fmt(540 + shake.x)} ${fmt(960 + shake.y)}) scale(${sc}) translate(-540 -960)`;
  return (
    <g>
      <defs>
        {g && glitchFilter(`${id}-gl`, g)}
        {wb > 0 && (
          <filter id={`${id}-wb`} filterUnits="userSpaceOnUse" x={-40} y={-200} width={1160} height={2320}>
            <feGaussianBlur stdDeviation={`0 ${fmt(wb)}`} />
          </filter>
        )}
      </defs>
      <g filter={g ? `url(#${id}-gl)` : undefined}>
        <g transform={tr} filter={wb > 0 ? `url(#${id}-wb)` : undefined}>
          {children}
        </g>
      </g>
      {g && g.scan > 0 && (
        <g opacity={fmt(g.scan)}>
          {Array.from({length: 96}, (_, i) => <rect key={i} x={0} y={i * 20} width={1080} height={6} fill="#05060C" />)}
        </g>
      )}
      {wb > 0 && <Streaks t={t} k={clamp(wb / 110)} />}
    </g>
  );
};

/** the whip's speed lines: thin vertical streaks across the frame, cyan-white, a new set each frame */
const Streaks: React.FC<{t: number; k: number}> = ({t, k}) => {
  const f = Math.round(t * 30);
  const n = Math.round(10 + 18 * k);
  const d = Array.from({length: n}, (_, i) => {
    const x = 1080 * hash(f * 31 + i, 6201);
    const y = -200 + 2000 * hash(f * 37 + i, 6203);
    const L = (300 + 700 * hash(f * 41 + i, 6205)) * k;
    return `M${fmt(x)},${fmt(y)} l0,${fmt(L)}`;
  }).join(' ');
  return (
    <g style={{mixBlendMode: 'screen'}} opacity={fmt(0.5 * k)}>
      <path d={d} stroke="#BFF6FF" strokeWidth={3} strokeLinecap="round" opacity={0.6} fill="none" />
      <path d={d} stroke="#FFFFFF" strokeWidth={1.2} strokeLinecap="round" fill="none" />
    </g>
  );
};
