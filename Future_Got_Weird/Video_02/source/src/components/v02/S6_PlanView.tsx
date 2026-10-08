import React from 'react';
import {C, OUTLINE} from '../../theme';
import {Camera, Layer, worldToScreen, type Cam} from '../../lib/camera';
import {project} from '../../lib/room';
import {bandMembership, extractContours, type BandSpec, type GridSpec, type P2, type ScalarField} from '../../lib/optics';
import {RoomSet, type RoomItem} from './RoomSet';

/**
 * The plan board (RoomSet at tilt 1) shown through a framed window, so one component covers the three ways S6 uses it:
 *  - S6.4: small "photo" cards of the plan (the whole 1920×1080 plan frame scaled down into a card);
 *  - S6.5: the full-screen plan at CAM_PLAN_ACT (the card grows into it);
 *  - S6.6: two side-by-side panels, each with its own camera (the full plan splits into them).
 *
 * `geo` places the window: the clip rectangle (x, y, w, h, screen px, with a corner radius and an ink border whose
 * opacity is `border`), and where the inner 1920×1080 camera frame sits on screen: its top-left at (tx, ty), scaled by
 * `s`. Inside, a camera <Layer> holds the RoomSet; `backdrop` (bands, clouds: under the partition), `items` and
 * `children` (tokens, sensor, markers: on top) are in the plan's world px (lib/room project at tilt 1).
 */
export type PanelGeo = {x: number; y: number; w: number; h: number; tx: number; ty: number; s: number; radius: number; border: number};

export const FULL_GEO: PanelGeo = {x: 0, y: 0, w: 1920, h: 1080, tx: 0, ty: 0, s: 1, radius: 0, border: 0};

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Interpolate two window placements. */
export const lerpGeo = (a: PanelGeo, b: PanelGeo, t: number): PanelGeo => ({
  x: lerp(a.x, b.x, t),
  y: lerp(a.y, b.y, t),
  w: lerp(a.w, b.w, t),
  h: lerp(a.h, b.h, t),
  tx: lerp(a.tx, b.tx, t),
  ty: lerp(a.ty, b.ty, t),
  s: lerp(a.s, b.s, t),
  radius: lerp(a.radius, b.radius, t),
  border: lerp(a.border, b.border, t),
});

/** A card window that shows the whole camera frame scaled into the rectangle (x, y, w) at 16:9. */
export const cardGeo = (x: number, y: number, w: number, radius = 16): PanelGeo => ({x, y, w, h: (w * 9) / 16, tx: x, ty: y, s: w / 1920, radius, border: 1});

/** Plan metres → the plan board's world px (tilt 1). */
export const planPx = (p: P2) => {
  const q = project({x: p.x, z: p.z, h: 0}, 1);
  return {x: q.x, y: q.y};
};

/** Plan metres → screen px through a window and its camera. */
export const planToScreen = (geo: PanelGeo, cam: Cam, p: P2) => {
  const q = planPx(p);
  const f = worldToScreen(cam, q.x, q.y);
  return {x: geo.tx + f.x * geo.s, y: geo.ty + f.y * geo.s};
};

/** Camera that centres the plan point (x, z) at a zoom. */
export const camOnPlan = (x: number, z: number, zoom: number): Cam => {
  const q = planPx({x, z});
  return {cx: q.x, cy: q.y, zoom};
};

export const PlanView: React.FC<{
  geo: PanelGeo;
  cam: Cam;
  backdrop?: React.ReactNode;
  items?: RoomItem[];
  children?: React.ReactNode;
  /** screen-space overlay inside the window (clipped with it), e.g. a dimming veil or grain */
  veil?: React.ReactNode;
  opacity?: number;
  shadow?: number;
  /** rotate the whole window (deg) about its centre, e.g. a tossed photo card */
  rot?: number;
}> = ({geo, cam, backdrop, items, children, veil, opacity = 1, shadow = 0, rot = 0}) => {
  if (opacity <= 0 || geo.w <= 1 || geo.h <= 1) return null;
  const spin = Math.abs(rot) > 0.001 ? {transform: `rotate(${rot.toFixed(3)}deg)`, transformOrigin: `${(geo.x + geo.w / 2).toFixed(2)}px ${(geo.y + geo.h / 2).toFixed(2)}px`} : {};
  return (
    <div style={{position: 'absolute', left: 0, top: 0, width: 1920, height: 1080, opacity, ...spin}}>
      {shadow > 0 && <div style={{position: 'absolute', left: geo.x + 10, top: geo.y + 12, width: geo.w, height: geo.h, borderRadius: geo.radius, background: C.shadow, opacity: shadow}} />}
      <div style={{position: 'absolute', left: geo.x, top: geo.y, width: geo.w, height: geo.h, overflow: 'hidden', borderRadius: geo.radius, background: C.paper}}>
        <div style={{position: 'absolute', left: geo.tx - geo.x, top: geo.ty - geo.y, width: 1920, height: 1080, transform: `scale(${geo.s})`, transformOrigin: '0 0'}}>
          <Camera cam={cam}>
            <Layer>
              <RoomSet tilt={1} items={items} backdrop={backdrop}>
                {children}
              </RoomSet>
            </Layer>
          </Camera>
        </div>
        {veil}
      </div>
      {geo.border > 0.001 && (
        <div style={{position: 'absolute', left: geo.x, top: geo.y, width: geo.w, height: geo.h, borderRadius: geo.radius, border: `${OUTLINE}px solid ${C.ink}`, boxSizing: 'border-box', opacity: Math.min(1, geo.border)}} />
      )}
    </div>
  );
};

/** An overlay <svg> in the plan board's world px, for RoomSet's backdrop / children slots. */
export const PlanSvg: React.FC<{children: React.ReactNode}> = ({children}) => (
  <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
    {children}
  </svg>
);

/** Confocal bands for wall points `Ws` and a hidden point `H`: radius |W H| each (optionally measured from shifted
 *  wall points `actual`, i.e. the sensor jiggled but the bands are still drawn round the assumed points). */
export const bandsFor = (Ws: P2[], H: P2, halfWidth: number, actual?: P2[]): BandSpec[] =>
  Ws.map((W, i) => {
    const A = actual ? actual[i] : W;
    return {W, r: Math.hypot(H.x - A.x, H.z - A.z), halfWidth};
  });

/**
 * "Plain averaging" of several frames: for each wall point, the frames' band memberships are AVERAGED (the averaged
 * arrival histogram has a bump for every frame), then the wall points are combined as independent evidence (product),
 * as possibleCloud does. frames[k][i] is wall point i in frame k (same assumed W in every frame). Normalised so the
 * peak is 1 (the levels of PossibleCloud then mean the same as for a single frame). Built from lib/optics
 * bandMembership; returns the same ScalarField shape as possibleCloud, so PossibleCloud / extractContours draw it.
 */
export const averagedCloud = (grid: GridSpec, frames: BandSpec[][]): ScalarField => {
  const nx = Math.max(2, Math.floor((grid.x1 - grid.x0) / grid.step + 1e-9) + 1);
  const nz = Math.max(2, Math.floor((grid.z1 - grid.z0) / grid.step + 1e-9) + 1);
  const values = new Float32Array(nx * nz);
  const nW = frames[0].length;
  let max = 0;
  let argmax: P2 = {x: grid.x0, z: grid.z0};
  for (let j = 0; j < nz; j++) {
    const z = grid.z0 + j * grid.step;
    for (let i = 0; i < nx; i++) {
      const x = grid.x0 + i * grid.step;
      let v = 1;
      for (let w = 0; w < nW && v > 1e-7; w++) {
        let m = 0;
        for (const f of frames) m += bandMembership({x, z}, f[w].W, f[w].r, f[w].halfWidth, f[w].sharpness ?? 4);
        v *= m / frames.length;
      }
      values[j * nx + i] = v;
      if (v > max) {
        max = v;
        argmax = {x, z};
      }
    }
  }
  if (max > 0) for (let k = 0; k < values.length; k++) values[k] /= max;
  return {spec: grid, nx, nz, values, max: max > 0 ? 1 : 0, argmax};
};

/**
 * The possible-locations region as S6 draws it on the busy plan (over a character token): the kit's two nested flat
 * fills (pale outer level, denser inner level, crisp inner line) plus a thin INK line round the outer level, so the
 * shape reads against the token's hair and shirt. Fades with `t` (no growth: these regions change shape every frame
 * and a scale pop would read as a jump). Contours come from lib/optics extractContours, in plan metres.
 */
export const CloudShape: React.FC<{field: ScalarField; toPx: (p: P2) => {x: number; y: number}; t: number; tone: 'teal' | 'coral'; levels?: [number, number]; ink?: number}> = ({field, toPx, t, tone, levels = [0.25, 0.6], ink = 2.5}) => {
  if (t <= 0) return null;
  const col = tone === 'teal' ? {main: C.teal, deep: C.tealDeep, light: C.tealLight} : {main: C.coral, deep: C.coralDeep, light: C.coralLight};
  const d = (lv: number) =>
    extractContours(field, lv)
      .map((l) => l.map(toPx))
      .map((l) => (l.length ? `M ${l.map((p) => `${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(' L ')} Z` : ''))
      .join(' ');
  const outer = d(levels[0]);
  const inner = d(levels[1]);
  return (
    <g opacity={Math.min(1, t)}>
      <path d={outer} fill="none" stroke={C.cream} strokeWidth={ink + 5} strokeLinejoin="round" />
      <path d={outer} fill={col.light} fillOpacity={0.85} fillRule="evenodd" />
      <path d={inner} fill={col.main} fillOpacity={0.92} fillRule="evenodd" />
      <path d={inner} fill="none" stroke={col.deep} strokeWidth={2} strokeLinejoin="round" />
      <path d={outer} fill="none" stroke={C.ink} strokeWidth={ink} strokeLinejoin="round" />
    </g>
  );
};
