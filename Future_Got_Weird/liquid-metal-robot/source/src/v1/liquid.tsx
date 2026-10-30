// Liquid gallium. The liquid is built as a height field: every blob (bead, puddle, neck, the melting figure's parts)
// is a soft white dome; the domes are blurred together, so they merge and neck like surface tension, and the blurred
// field is cut at a level to give a crisp edge. The same field lights the surface (diffuse through a mirror-metal
// ramp that reflects the dark teal bench at the rim, plus a sharp specular glint from the key light, upper left),
// and the cut edge gets the channel's thin ink contour. All in screen space.
import React from 'react';
import {INK} from '../shared/ink';
import {Ell} from './cam';

export type Goo =
  | {k: 'e'; e: Ell; g?: 'dome' | 'flat'; a?: number}
  | {k: 'p'; d: string; g?: 'dome' | 'flat'; a?: number; tf?: string; b?: Box};

export type Box = {x0: number; y0: number; x1: number; y1: number};
export const gooBox = (items: Goo[], pad: number, extra?: Box): Box => {
  let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
  for (const it of items) {
    if (it.k === 'e') {
      const r = Math.max(it.e.rx, it.e.ry);
      x0 = Math.min(x0, it.e.cx - r);
      x1 = Math.max(x1, it.e.cx + r);
      y0 = Math.min(y0, it.e.cy - r);
      y1 = Math.max(y1, it.e.cy + r);
    } else if (it.b) {
      x0 = Math.min(x0, it.b.x0);
      x1 = Math.max(x1, it.b.x1);
      y0 = Math.min(y0, it.b.y0);
      y1 = Math.max(y1, it.b.y1);
    }
  }
  if (extra) {
    x0 = Math.min(x0, extra.x0);
    y0 = Math.min(y0, extra.y0);
    x1 = Math.max(x1, extra.x1);
    y1 = Math.max(y1, extra.y1);
  }
  return {x0: Math.max(-200, x0 - pad), y0: Math.max(-200, y0 - pad), x1: Math.min(1280, x1 + pad), y1: Math.min(2120, y1 + pad)};
};

/** the mirror-metal ramp (diffuse light level 0..1 -> colour): the dark rim reflects the teal bench, the flat top a
 *  soft overcast lab ceiling, the lit slopes go to white */
const RAMP = {
  r: [0.2, 0.2, 0.24, 0.29, 0.35, 0.43, 0.53, 0.66, 0.83, 0.95, 1.0],
  g: [0.3, 0.26, 0.29, 0.34, 0.4, 0.49, 0.59, 0.71, 0.87, 0.97, 1.0],
  b: [0.36, 0.34, 0.37, 0.42, 0.48, 0.57, 0.67, 0.78, 0.91, 0.99, 1.0],
};
/** the matte, slightly grainy solid (frozen) gallium ramp: lower contrast, no mirror */
const RAMP_SOLID = {
  r: [0.26, 0.29, 0.34, 0.4, 0.46, 0.51, 0.56, 0.61, 0.65, 0.69, 0.72],
  g: [0.29, 0.32, 0.37, 0.43, 0.49, 0.54, 0.59, 0.64, 0.68, 0.72, 0.75],
  b: [0.33, 0.36, 0.41, 0.47, 0.53, 0.58, 0.63, 0.68, 0.72, 0.76, 0.79],
};

export const GooLayer: React.FC<{
  id: string;
  items: Goo[];
  /** blur (px): sets how readily blobs merge and how round the surface reads */
  sigma: number;
  box: Box;
  ink: number;
  /** 0 liquid mirror .. 1 matte solid */
  solid?: number;
  /** highlight strength */
  spec?: number;
  clip?: string;
  mask?: string;
  opacity?: number;
}> = ({id, items, sigma, box, ink, solid = 0, spec = 1, clip, mask, opacity}) => {
  if (items.length === 0) return null;
  const ramp = solid > 0 ? {
    r: RAMP.r.map((x, i) => x + (RAMP_SOLID.r[i] - x) * solid),
    g: RAMP.g.map((x, i) => x + (RAMP_SOLID.g[i] - x) * solid),
    b: RAMP.b.map((x, i) => x + (RAMP_SOLID.b[i] - x) * solid),
  } : RAMP;
  const S = sigma * 4.2;
  const w = box.x1 - box.x0, h = box.y1 - box.y0;
  if (w <= 0 || h <= 0) return null;
  return (
    <g clipPath={clip} mask={mask} opacity={opacity}>
      <defs>
        <radialGradient id={`${id}-dome`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#FFF" stopOpacity={0.6} />
          <stop offset="0.55" stopColor="#FFF" stopOpacity={0.48} />
          <stop offset="1" stopColor="#FFF" stopOpacity={0.22} />
        </radialGradient>
        <radialGradient id={`${id}-flat`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#FFF" stopOpacity={0.6} />
          <stop offset="0.78" stopColor="#FFF" stopOpacity={0.6} />
          <stop offset="1" stopColor="#FFF" stopOpacity={0.25} />
        </radialGradient>
        <filter id={`${id}-f`} filterUnits="userSpaceOnUse" x={box.x0} y={box.y0} width={w} height={h} colorInterpolationFilters="sRGB">
          <feGaussianBlur in="SourceGraphic" stdDeviation={sigma.toFixed(2)} result="b" />
          <feComponentTransfer in="b" result="shape">
            <feFuncA type="linear" slope="20" intercept={(-20 * 0.17).toFixed(2)} />
          </feComponentTransfer>
          <feDiffuseLighting in="b" surfaceScale={S.toFixed(2)} diffuseConstant="1" lightingColor="#FFFFFF" result="dif">
            <feDistantLight azimuth="235" elevation="36" />
          </feDiffuseLighting>
          <feGaussianBlur in="dif" stdDeviation="2.6" result="difs" />
          <feComponentTransfer in="difs" result="env">
            <feFuncR type="table" tableValues={ramp.r.map((x) => x.toFixed(3)).join(' ')} />
            <feFuncG type="table" tableValues={ramp.g.map((x) => x.toFixed(3)).join(' ')} />
            <feFuncB type="table" tableValues={ramp.b.map((x) => x.toFixed(3)).join(' ')} />
          </feComponentTransfer>
          <feSpecularLighting in="b" surfaceScale={S.toFixed(2)} specularConstant={(1.25 * spec * (1 - 0.8 * solid)).toFixed(3)} specularExponent={(30 - 20 * solid).toFixed(1)} lightingColor="#FFFFFF" result="spc0">
            <feDistantLight azimuth="235" elevation="52" />
          </feSpecularLighting>
          <feGaussianBlur in="spc0" stdDeviation="1.4" result="spc" />
          <feComposite in="spc" in2="env" operator="arithmetic" k1="0" k2="1" k3="1" k4="0" result="lit" />
          <feComposite in="lit" in2="shape" operator="in" result="metal" />
          <feMorphology in="shape" operator="dilate" radius={ink.toFixed(2)} result="dil" />
          <feFlood floodColor={INK} result="inkc" />
          <feComposite in="inkc" in2="dil" operator="in" result="ink" />
          <feMerge>
            <feMergeNode in="ink" />
            <feMergeNode in="metal" />
          </feMerge>
        </filter>
      </defs>
      <g filter={`url(#${id}-f)`}>
        {items.map((it, i) =>
          it.k === 'e' ? (
            <ellipse key={i} cx={it.e.cx.toFixed(1)} cy={it.e.cy.toFixed(1)} rx={it.e.rx.toFixed(1)} ry={it.e.ry.toFixed(1)}
              transform={`rotate(${it.e.rot.toFixed(2)} ${it.e.cx.toFixed(1)} ${it.e.cy.toFixed(1)})`} fill={`url(#${id}-${it.g ?? 'dome'})`} opacity={it.a} />
          ) : (
            <path key={i} d={it.d} transform={it.tf} fill={`url(#${id}-${it.g ?? 'dome'})`} opacity={it.a} />
          ),
        )}
      </g>
    </g>
  );
};
