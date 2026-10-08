import React from 'react';
import {C, OUTLINE} from '../../theme';
import {rand} from '../../lib/anim';

/**
 * S2 only: the magnified cross-section of the painted relay wall (S2.3, "rough up close"). Oriented like the plan view
 * (the wall at the top, the room below), so light arrives from below and scatters back down into the room. Screen px
 * (1920x1080). Flat fills: plaster, a paint layer whose room-facing surface is a row of seeded pigment grains (round
 * bumps of mixed sizes, so it reads as rough), and the room.
 */

const f2 = (n: number) => Math.round(n * 100) / 100;

/** Mean surface line (px), the paint layer's top, the extent of the drawing, colours. */
export const SECTION = {base: 430, paintTop: 318, x0: -360, x1: 2280, plaster: '#DDBF8F', paint: '#F5E4C6'};

/** The pigment grains along the surface: circles whose lower parts make the rough profile. */
export const GRAINS: {x: number; y: number; r: number}[] = (() => {
  const out: {x: number; y: number; r: number}[] = [];
  let x = SECTION.x0;
  let i = 0;
  while (x < SECTION.x1) {
    const r = 17 + 36 * Math.pow(rand(i * 11 + 7), 1.3);
    const y = SECTION.base - r * 0.55 + (rand(i * 5 + 3) - 0.5) * 30;
    out.push({x, y, r});
    x += r * (0.95 + 0.6 * rand(i * 3 + 1));
    i++;
  }
  return out;
})();

/** The surface height (px, the lowest point of paint) at screen x. */
export const profileY = (x: number) => {
  let y = SECTION.base - 14;
  for (const gr of GRAINS) {
    const dx = x - gr.x;
    if (Math.abs(dx) < gr.r) y = Math.max(y, gr.y + Math.sqrt(gr.r * gr.r - dx * dx));
  }
  return y;
};

// the plaster/paint boundary: a gentle seeded wave
const innerD = (() => {
  const pts: string[] = [];
  for (let x = SECTION.x0, k = 0; x <= SECTION.x1; x += 40, k++) {
    const y = SECTION.paintTop + 9 * Math.sin(x / 170 + 0.6) + 5 * Math.sin(x / 61 + 2.1);
    pts.push(`${k ? 'L' : 'M'} ${f2(x)} ${f2(y)}`);
  }
  return pts.join(' ');
})();

/** The section drawing (screen px): room (paper), paint layer with its grains, plaster, outlines. The grains' union
 *  outline is drawn by stroking every grain first and filling them all on top (no inner lines). */
export const SectionBackdrop: React.FC = () => {
  const bodyBottom = SECTION.base - 14;
  return (
    <g>
      <rect x={-400} y={-400} width={2760} height={1880} fill={C.paper} />
      {/* outline pass */}
      <rect x={SECTION.x0} y={-400} width={SECTION.x1 - SECTION.x0} height={bodyBottom + 400} fill="none" stroke={C.ink} strokeWidth={OUTLINE * 2} />
      {GRAINS.map((gr, i) => (
        <circle key={`o${i}`} cx={f2(gr.x)} cy={f2(gr.y)} r={f2(gr.r)} fill={C.ink} stroke={C.ink} strokeWidth={OUTLINE * 2} />
      ))}
      {/* fill pass: paint body and grains */}
      <rect x={SECTION.x0} y={-400} width={SECTION.x1 - SECTION.x0} height={bodyBottom + 400} fill={SECTION.paint} />
      {GRAINS.map((gr, i) => (
        <circle key={`f${i}`} cx={f2(gr.x)} cy={f2(gr.y)} r={f2(gr.r)} fill={SECTION.paint} />
      ))}
      {/* plaster body above the paint */}
      <path d={`${innerD} L ${SECTION.x1} -400 L ${SECTION.x0} -400 Z`} fill={SECTION.plaster} />
      <path d={innerD} fill="none" stroke={C.inkSoft} strokeWidth={3.5} strokeLinejoin="round" />
    </g>
  );
};

/** The bottom tip of the most protruding grain near screen x (a good place for a ray to land). */
export const grainTipNear = (x: number, within = 70) => {
  let best = GRAINS[0];
  let bestY = -Infinity;
  for (const gr of GRAINS) {
    if (Math.abs(gr.x - x) > within) continue;
    const y = profileY(gr.x);
    if (y > bestY) {
      bestY = y;
      best = gr;
    }
  }
  return {x: best.x, y: profileY(best.x)};
};
