import React from 'react';
import layoutJson from '../../data/layout.json';
import {C} from '../../theme';
import {rand} from '../../lib/anim';
import type {Cam} from '../../lib/camera';
import {TOKEN_R} from '../../lib/room';
import {LAYOUT, assertPath, possibleCloud, sub, type BandSpec, type GridSpec, type P2, type ScalarField} from '../../lib/optics';
import {PlanSvg, PlanView, bandsFor, planPx, type PanelGeo} from '../v02/S6_PlanView';
import {LIKELY_CLOUD, LIKELY_RING, LikelyRing} from '../v02/S4_Parts';
import {Band, PossibleCloud, SensorGlyph, polyD} from '../v02/Optics';
import {GuesserToken} from '../v02/Tokens';
import {Chip} from '../v2k/Labels';

/**
 * V8 only: the plan of our room (layout.json, I1, illustrative) for V8.2's "bunched spots" callback and V8.3's night-mode
 * frames, built on the v1 S6 plan machinery (components/v02/S6_PlanView: RoomSet at tilt 1 through a framed window and
 * a camera).
 *
 * The V8 → V9 hand-off: V8's last frame is the full-frame plan at CAM_PLAN_ACT (FULL_GEO) with his token at H_A
 * (facing −90, the partition), the sensor glyph at frame A on its tripod (PlanStand, copied from the v1 S6_Small /
 * V9 PlanStand: same legs, feet and shadow), nothing else on the floor, and the "illustration" chip (30) top-left over a
 * paper backing that hides the wall ruler's tick (HandoffChip). V9's first frame draws exactly these, in this order:
 * token, tripod, sensor glyph.
 */

type LJ = {
  frames: Record<'A' | 'B1', {sensor: [number, number]; aimX: number; wallX: number[]}>;
  hidden: {x: number; z: number};
  wallSamples: {id: string; x: number}[];
  bandHalfWidth: {oneBin: number; twoBins: number};
};
const L = layoutJson as unknown as LJ;
export const P = (x: number, z: number, id?: string): P2 => ({x, z, id});

export const SA = P(L.frames.A.sensor[0], L.frames.A.sensor[1], 'S_A');
export const AIM_A = P(L.frames.A.aimX, 0);
export const WA = L.frames.A.wallX.map((x, i) => P(x, 0, `A.W${i + 1}`));
export const HA = P(L.hidden.x, L.hidden.z, 'H_A');
export const HW1 = L.bandHalfWidth.oneBin;
export const HW2 = L.bandHalfWidth.twoBins;
const WX: Record<string, number> = Object.fromEntries(L.wallSamples.map((w) => [w.id, w.x]));
/** V5.7's "close" pair: W2 and W3, the spots bunched together (the long, blurry patch) */
export const W2 = P(WX.W2, 0, 'W2');
export const W3 = P(WX.W3, 0, 'W3');

/** V8.2 callback: listening spots bunched on the small wall patch W2..W3 (a seeded, uneven cluster: not countable).
 *  Seven, drawn large enough to read as separate spots in the close framing (they just touch). */
export const BUNCH: P2[] = Array.from({length: 7}, (_, i) => {
  const u = i / 6;
  return P(W2.x + (W3.x - W2.x) * u + (rand(i * 17 + 3) - 0.5) * 0.006, 0.018 + 0.03 * rand(i * 29 + 5));
});
/** the bands the patch is made of (one bin each): the bunched patch's two ends, W2 and W3, exactly V5.7's "close" pair */
export const BUNCH_BANDS: BandSpec[] = bandsFor([W2, W3], HA, HW1);
const GRID_BUNCH: GridSpec = {x0: 1.85, x1: 3.45, z0: 0.0, z1: 1.75, step: 0.012};
export const BUNCH_PATCH: ScalarField = possibleCloud(GRID_BUNCH, BUNCH_BANDS);

// every light path the drawn bands and the wedge stand for clears the partition (throws at load if the layout breaks it)
for (const w of [W2, W3, ...BUNCH]) assertPath([SA, w, HA, w, SA], LAYOUT);
for (const w of WA) assertPath([SA, w, HA, w, SA], LAYOUT);

/** V8.3: six quick, dim frames of the same scene, each with its own timing noise (±3.5 cm) and two-bin bands, and the
 *  combined estimate (one-bin bands, no noise): frame A's four spots round H_A. */
const GRID_H: GridSpec = {x0: 2.1, x1: 3.3, z0: 0.25, z1: 1.45, step: 0.008};
const BANDS_A = bandsFor(WA, HA, HW1);
export const N_FRAMES = 6;
export const DIM_CLOUDS: ScalarField[] = Array.from({length: N_FRAMES}, (_, k) =>
  possibleCloud(
    GRID_H,
    BANDS_A.map((b, i) => ({W: b.W, r: b.r + (rand(k * 31 + i * 7 + 5) - 0.5) * 0.07, halfWidth: HW2})),
  ),
);
export const CLOUD_A: ScalarField = possibleCloud(GRID_H, BANDS_A);

/* ================================================================== drawing */

export const TOKEN_PX = 2 * TOKEN_R * 240;
const SENSOR_PX = 0.24 * 240;
const ROOM_CLIP = {x0: 0, x1: 4, z0: 0, z1: 3};

/** The sensor's tripod seen from above (the v1 S6_Small PlanStand, as V9 draws it). */
const STAND_LEG_M = 0.17;
const STAND_ANGLES = [90, 210, 330];
const STAND_LEG_W = 9;
const STAND_CORE = 4.5;
const STAND_FOOT_R = 6;
const STAND_SHADOW = {x: 3, y: 5};
export const PlanStand: React.FC<{at: P2; opacity?: number}> = ({at, opacity = 1}) => {
  const c = planPx(at);
  const feet = STAND_ANGLES.map((a) => planPx(P(at.x + Math.cos((a * Math.PI) / 180) * STAND_LEG_M, at.z + Math.sin((a * Math.PI) / 180) * STAND_LEG_M)));
  const leg = (f: {x: number; y: number}, dx = 0, dy = 0) => ({x1: c.x + dx, y1: c.y + dy, x2: f.x + dx, y2: f.y + dy});
  if (opacity <= 0.001) return null;
  return (
    <g opacity={opacity} strokeLinecap="round">
      {feet.map((f, i) => (
        <g key={`s${i}`}>
          <line {...leg(f, STAND_SHADOW.x, STAND_SHADOW.y)} stroke={C.shadow} strokeWidth={STAND_LEG_W} />
          <circle cx={f.x + STAND_SHADOW.x} cy={f.y + STAND_SHADOW.y} r={STAND_FOOT_R} fill={C.shadow} />
        </g>
      ))}
      {feet.map((f, i) => (
        <line key={`o${i}`} {...leg(f)} stroke={C.ink} strokeWidth={STAND_LEG_W} />
      ))}
      {feet.map((f, i) => (
        <line key={`c${i}`} {...leg(f)} stroke={C.inkSoft} strokeWidth={STAND_CORE} />
      ))}
      {feet.map((f, i) => (
        <circle key={`f${i}`} cx={f.x} cy={f.y} r={STAND_FOOT_R} fill={C.ink} />
      ))}
    </g>
  );
};

export type V8PlanState = {
  /** pale field-of-view wedge from the sensor to the bunched patch (0..1) */
  wedge?: number;
  /** the bunched listening spots (0..1 each pops in) */
  bunch?: number;
  /** the bunch's bands (0..1 opacity) */
  bands?: number;
  /** the long patch from the bunched spots (0..1) */
  patch?: number;
  /** a region under his token: a field, its opacity and its tone */
  cloud?: {field: ScalarField; t: number};
  /** the teal likely-location ring round him (S4_Parts LikelyRing, as V5.9), 0..1 */
  ring?: number;
  /** camera zoom, so the ring's stroke keeps its on-screen width */
  zoom?: number;
  guesser?: number;
};

const toPx = planPx;

/** RoomSet slots for a V8 plan state. The always-on base is exactly the V9 hand-off: token, tripod, sensor glyph. */
const planLayers = (s: V8PlanState) => {
  const sPx = planPx(SA);
  const backdrop = (
    <PlanSvg>
      {(s.wedge ?? 0) > 0.001 && <path d={polyD([sPx, planPx(P(W2.x - 0.02, 0)), planPx(P(W3.x + 0.02, 0))], true)} fill={C.saffronLight} opacity={0.8 * (s.wedge ?? 0)} />}
      {(s.bands ?? 0) > 0.001 && (
        <g opacity={s.bands}>
          {BUNCH_BANDS.map((b, i) => (
            <Band key={i} asGroup center={b.W} r={b.r} halfWidth={b.halfWidth} toPx={toPx} t={1} clip={ROOM_CLIP} tone="blue" fillOpacity={0.24} />
          ))}
        </g>
      )}
    </PlanSvg>
  );
  const children = (
    <PlanSvg>
      {(s.patch ?? 0) > 0.001 && <PossibleCloud asGroup toPx={toPx} field={BUNCH_PATCH} t={s.patch ?? 0} tone="teal" />}
      {(s.guesser ?? 1) > 0.001 && <GuesserToken asGroup x={planPx(HA).x} y={planPx(HA).y} size={TOKEN_PX} facing={-90} opacity={s.guesser ?? 1} />}
      {/* the estimate over his (dimmed) token in the reviewed likely-location style (S4_Parts LIKELY_CLOUD: a soft
          two-level region with a paper rim and an outline, never a stroke across his hair; v1 review D28) */}
      {s.cloud && s.cloud.t > 0.001 && <PossibleCloud asGroup toPx={toPx} field={s.cloud.field} t={s.cloud.t} tone="teal" {...LIKELY_CLOUD} />}
      {(s.ring ?? 0) > 0.001 && (
        <g opacity={Math.min(1, s.ring ?? 0)}>
          <LikelyRing cx={planPx(HA).x} cy={planPx(HA).y} r={LIKELY_RING.rM * 240} t={1} k={1 / (s.zoom ?? 2)} />
        </g>
      )}
      {(s.bunch ?? 0) > 0.001 &&
        BUNCH.map((p, i) => {
          const q = planPx(p);
          const t = Math.max(0, Math.min(1, (s.bunch ?? 0) * 1.6 - (i / BUNCH.length) * 0.6));
          if (t <= 0.001) return null;
          return (
            <g key={`b${i}`} opacity={Math.min(1, t * 1.5)}>
              <circle cx={q.x} cy={q.y} r={4.6 * t + 0.6} fill={C.cream} />
              <circle cx={q.x} cy={q.y} r={3.6 * t} fill={C.tealDeep} />
            </g>
          );
        })}
      <PlanStand at={SA} opacity={1} />
      <SensorGlyph asGroup p={SA} dir={sub(AIM_A, SA)} toPx={toPx} size={SENSOR_PX} firing={0} />
    </PlanSvg>
  );
  return {backdrop, children};
};

export const V8PlanStage: React.FC<{geo: PanelGeo; cam: Cam; state: V8PlanState; opacity?: number; shadow?: number; rot?: number; veil?: React.ReactNode}> = ({geo, cam, state, opacity, shadow, rot, veil}) => {
  const {backdrop, children} = planLayers(state);
  return (
    <PlanView geo={geo} cam={cam} backdrop={backdrop} opacity={opacity} shadow={shadow} rot={rot} veil={veil}>
      {children}
    </PlanView>
  );
};

/** The "illustration" chip, top-left, over a paper backing that hides the plan's wall ruler tick under it (as V9). */
export const HandoffChip: React.FC<{t?: number}> = ({t = 1}) =>
  t <= 0.001 ? null : (
    <>
      <div style={{position: 'absolute', left: 90, top: 38, width: 236, height: 76, background: C.paper, opacity: t}} />
      <Chip x={96} y={54} size={30} opacity={t}>
        illustration
      </Chip>
    </>
  );
