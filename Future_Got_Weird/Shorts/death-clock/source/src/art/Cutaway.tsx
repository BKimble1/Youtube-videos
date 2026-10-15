// V4 chest window. A torso-shaped section on the VISIBLE front of his thorax (between the tee's front contour and
// the near arm, its back edge running under the near arm), at least 8 world units inside the tee everywhere.
// Everything is drawn in the torso's own frame (local x = v, toward his left/back; y = -u, down the spine; rig
// units), so it turns and breathes with him and has no parallax. It is mounted in Man's overTorso slot (after the
// tee, before the near thigh, the far forearm and hand, and the near arm and sleeve), so all of those occlude it
// and no organ ever draws over the arm.
//
// The interior is one self-consistent anterior layout (the anatomy reference, shifted toward his front and scaled
// to fit), tuned to read at phone size. V4 fix: the heart sits in the middle of the visible part of the window with
// lung on both sides (a right-lung crescent of about 10 units between the right atrium and the front cut edge, the
// left lung beside its left border), resting on the diaphragm with its apex down toward +V (his left), more than
// 10 world clear of the near arm; two light pink lungs with a soft darker rim, the larger right lung on the -V
// (front) side and the smaller left lung with its cardiac notch on +V (above and beside the heart, then under the
// arm), their anterior borders nearly meeting above the arch across a darker mediastinal gap. The right lung's
// anterior margin is drawn IN FRONT of the heart's right border (as in situ: over the outer part of the right
// atrium, just lateral of the vena cava, never over it), so one continuous pale crescent runs from the vena cava down
// to its base on the right dome and the heart visibly sits between the lungs. The great vessels sit above the heart
// between them (the vena cava, the one blue vessel, into the right atrium; the aortic arch toward +V, its end passing
// behind the left lung); the diaphragm band below, its right dome higher; under the right dome, on his right side in
// the window's lower front corner, the liver (the "organ failing" beat: warm orange-red, turning a dull desaturated
// grey-brown as it fails, never a dark hole), well toward -V of the apex; under the left dome (below the heart's
// lower border and the apex) the pale stomach. The back wall is a deep warm red. Edge: one thin, restrained matte cut
// band (skin, fat, muscle) with a thin ink line; no rim highlight, crescent, depth ring, gloss or white dots. The
// diagnostic trace's chest segment runs along that cut edge at skin level to a small contact dot on the rim (no wire
// across the lung into the heart). The window opens and closes by geometry alone, always fully opaque: it scales
// about a pivot under the near arm (WIN_PIVOT) from K_HIDE, where the whole window (band and ink line included)
// already lies under the near arm and sleeve, so it grows out from under the arm and slides back under it.
import React from 'react';
import {mix, shade} from '../lib/color';
import {INK} from '../lib/ink';
import {HeartState} from '../lib/heart4';
import {TracePulse} from '../lib/reveal4';
import {add, clamp, fmt, mul, rot, V} from '../lib/math';
import {LIGHT} from '../lib/shade';
import {alongPts, closedD, Heart4, HEART_TILT, openD, sensorColor, svcAt} from './Heart4';

export type UV = [number, number];
/** torso (u up the spine from C, v toward his back/left; rig units) -> the window group's local frame */
const L = ([u, v]: UV): V => ({x: v, y: -u});
/** the key light's direction in the window group's frame (it does not turn with the torso) */
const LIGHT_TN = (tc: number): V => rot(LIGHT, tc);

/** Right-hand low grip used while the chest window is shown (Journey and treatment): the free hand reaches down
 *  in front of him and grips his raised near knee, the fingers curled over its top (they pass behind the thigh's
 *  contour). The whole hand and forearm stay outside the tee outline, so Man draws them only as the far arm behind
 *  the body (complete ink, occluded by the thigh where they overlap) and nothing is cut at the tee's edge; the
 *  window stays clear. Torso target (rig units from the shoulder base) and wrist angle; the shots pin the target in
 *  world space (KNEE_GRIP in Journey3) so breathing does not slide the hand on the knee. */
export const LOW_GRIP = {rTu: -70, rTv: -155, rWr: 0};
export const HAND_GRIP = {curl: [0.64, 0.7, 0.74, 0.78] as [number, number, number, number], spread: 0.42, thumb: 20, thumbCurl: 0.5};

// ---------------------------------------------------------------- layout (torso u, v; PROP: tc 50, s 1.22)
export const CHEST4 = {
  window: [
    [122, -70],
    [132, -52],
    [136, -30],
    [136, -4],
    [131, 18],
    [100, 16],
    [70, -2],
    [42, -18],
    [28, -36],
    [24, -60],
    [30, -82],
    [46, -90],
    [70, -90],
    [92, -87.5],
    [110, -82],
  ] as UV[],
  /** heart centre and vessel scale. V4 fix: the heart sits between the lungs, with lung on both sides inside the
   *  window: its centre is 4 up and 7 toward +V of the first layout's and the drawn heart is HEART_BODY (0.88) of
   *  heartK (art/Heart4); heartK itself is the vena cava and treatment pulse scale the 987 match reads (Aftermath3
   *  MATCH), so it is unchanged. Its apex stays more than 10 world clear of the arm and sleeve ink edge, and the
   *  right atrium about 15 units inside the window's front edge (a right-lung crescent of about 10 units shows there) */
  heart: [86.5, -50.3] as UV,
  heartK: 1.15,
  /** right lung (larger), behind the heart: its medial edge runs behind the vena cava, the right atrium and the right
   *  ventricle, its base on the right dome (under the diaphragm band); inside the window it shows above the arch
   *  (where the two lungs' anterior borders nearly meet) and, with rFront in front of the heart, along the front edge.
   *  (The thoracic outlines are the first layout's, scaled 0.88 about its heart centre and moved with the heart.) */
  rLung: [
    [147.7, -26.3],
    [137.1, -23.6],
    [129.2, -24.1],
    [123.5, -26.3],
    [119.5, -30.7],
    [116.0, -38.6],
    [112.5, -47.4],
    [108.9, -54.4],
    [104.5, -58.8],
    [97.5, -62.4],
    [88.7, -64.1],
    [80.8, -63.7],
    [74.6, -61.9],
    [72.0, -61.9],
    [72.9, -65.9],
    [70.2, -70.3],
    [66.7, -76.4],
    [62.7, -82.6],
    [57.9, -89.6],
    [59.7, -100.2],
    [94.9, -100.2],
    [123.0, -91.4],
    [142.4, -73.8],
    [151.2, -49.2],
  ] as UV[],
  /** left lung (smaller): its medial edge passes in front of the end of the aortic arch and the left pulmonary
   *  artery (the hilum), then the cardiac notch curves round the heart's left border with a narrow mediastinal gap,
   *  and the lingula tucks in toward the apex; the rest runs under the near arm */
  lLung: [
    [142.4, -18.4],
    [134.5, -19.7],
    [128.3, -20.6],
    [122.1, -22.3],
    [116.0, -25.8],
    [110.7, -27.2],
    [105.4, -25.0],
    [100.1, -22.3],
    [93.1, -25.8],
    [86.9, -26.7],
    [80.8, -27.3],
    [74.6, -30.2],
    [68.9, -33.3],
    [63.6, -38.0],
    [62.3, -36.0],
    [60.1, -30.7],
    [56.6, -22.8],
    [50.9, -12.2],
    [44.7, 0.1],
    [39.4, 12.4],
    [54.4, 33.6],
    [101.9, 42.4],
    [130.1, 31.8],
    [144.1, 8.9],
  ] as UV[],
  /** the right lung's anterior margin, drawn IN FRONT of the heart's right border (as in situ): its medial edge runs
   *  just lateral of the vena cava (at least 1.5 units clear of it, so the vena cava and the treatment pulse in it are
   *  never covered), over the outer part of the right atrium and the right ventricle's border, into the cardiophrenic
   *  angle; below that it is cut by the diaphragm's top line (clip), so its base sits on the right dome. With the right
   *  lung behind it, this makes one continuous front crescent from the vena cava's exit to the dome, about 10 units
   *  wide beside the atrium. */
  rFront: [
    [126.0, -71.5],
    [116.0, -69.4],
    [110.7, -69.0],
    [105.9, -68.6],
    [101.9, -68.6],
    [97.5, -68.6],
    [93.1, -68.4],
    [88.7, -67.6],
    [84.7, -66.2],
    [80.3, -64.4],
    [75.9, -63.0],
    [72.0, -62.6],
    [66.0, -64.0],
    [58.0, -76.0],
    [50.0, -92.0],
    [66.7, -103.7],
    [101.9, -98.4],
    [123.0, -84.4],
  ] as UV[],
  /** one faint fissure per lung (right: the horizontal fissure across the front margin; left: the oblique fissure) */
  rFissure: [
    [93.8, -84.6],
    [92.3, -77.6],
    [90.3, -71.8],
  ] as UV[],
  lFissure: [
    [124.8, 1.9],
    [113.3, -8.7],
    [101.9, -14.8],
    [90.5, -20.1],
  ] as UV[],
  /** top edge of the diaphragm: the right dome high under the right lung (the liver under it), the heart resting on
   *  the central part (its lower border overlaps the band), lower again on the left under the left lung */
  diaphragm: [
    [50, -108],
    [58, -99],
    [65, -91],
    [70.5, -83],
    [73.5, -76],
    [73.5, -70],
    [71, -65],
    [67, -58],
    [62, -51],
    [59.5, -43],
    [56.5, -35],
    [52.5, -27],
    [46.5, -16],
    [39.5, -2],
    [32, 12],
  ] as UV[],
  diaphragmT: 5,
  /** liver (the failing organ): the right lobe under the right dome, in the window's lower front corner on his right
   *  (-V) side; its medial border runs from the cardiophrenic angle down to the window's bottom, well toward -V of the
   *  apex (nothing of it lies under the heart's left half). Its top is cut by the diaphragm band (clip). */
  liver: [
    [76, -66],
    [78, -76],
    [75, -84],
    [69, -93],
    [61, -102],
    [52, -112],
    [38, -116],
    [25, -106],
    [21, -92],
    [25, -83],
    [32, -76.5],
    [41, -72.5],
    [51, -70.2],
    [60, -68.8],
    [68, -67.5],
  ] as UV[],
  /** the stomach under the left dome (under the heart's lower border and the apex, running on under the near arm):
   *  pale and neutral, it fills the abdomen beside the liver so nothing under the heart reads as a dark hole. Its top
   *  is cut by the diaphragm band (clip); its -V edge runs on under the liver (drawn over it), so one edge separates them */
  stomach: [
    [64, -58],
    [62, -44],
    [58, -31],
    [52, -19],
    [44, -5],
    [36, 9],
    [22, 14],
    [10, 0],
    [7, -22],
    [10, -42],
    [14, -64],
    [22, -76],
    [33, -77],
    [45, -74],
    [56, -71],
    [63, -66],
  ] as UV[],
  liverSensors: [
    [62, -82],
    [50, -85],
    [40, -81],
  ] as UV[],
  /** the diagnostic trace's chest segment: along the window's cut edge at skin level (the rim), from under the sleeve
   *  at the window's top (+V) end to a small contact dot on the rim above the heart's base; no line crosses the
   *  interior. Given as the window outline's vertex span (start vertex index, end vertex index + fraction toward the
   *  next vertex down the -V side) */
  traceRim: {from: 4, to: 3, toFrac: 0.75, inset: 0.9},
  /** where the trace emerges from under the sleeve (camera framing landmark) */
  trace: [[131, 18]] as UV[],
};

const polyCentroid = (pts: V[]): V => {
  let a = 0;
  let cx = 0;
  let cy = 0;
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i];
    const q = pts[(i + 1) % pts.length];
    const c = p.x * q.y - q.x * p.y;
    a += c;
    cx += (p.x + q.x) * c;
    cy += (p.y + q.y) * c;
  }
  return {x: cx / (3 * a), y: cy / (3 * a)};
};
const WIN_L = CHEST4.window.map(L);
/** the window's centroid (local frame; camera framing) */
export const WIN_C = polyCentroid(WIN_L);
/** the open/close pivot: deep under the near arm at mid-height of the window (local frame) */
export const WIN_PIVOT = L([85, 40]);
/** window scale at which all of it (band and ink line included) lies at least 1 world unit inside the near arm and
 *  sleeve in every pose it is shown in (Journey 463-584, treatment 987-1036; probed: 0.40) */
export const K_HIDE = 0.38;
/** open amounts below this keep the window at K_HIDE (hidden): see ChestWindow */
const OPEN_MIN = 0.08;
/** The trace's chest segment along the window's cut edge (CHEST4.traceRim): points of the window outline's spline (the
 *  same Catmull-Rom curve closedD draws) from vertex `from` back to vertex `to` and on toFrac toward the next vertex,
 *  set `inset` units inside the edge (the skin stratum of the cut band), at window scale k about WIN_PIVOT. */
const rimTrace = (k: number): V[] => {
  const P = WIN_L;
  const n = P.length;
  const at = (i: number, t: number): V => {
    const p0 = P[(i - 1 + n) % n];
    const p1 = P[i % n];
    const p2 = P[(i + 1) % n];
    const p3 = P[(i + 2) % n];
    const c1 = add(p1, mul(add(p2, mul(p0, -1)), 1 / 6));
    const c2 = add(p2, mul(add(p3, mul(p1, -1)), -1 / 6));
    const u = 1 - t;
    return add(add(mul(p1, u * u * u), mul(c1, 3 * u * u * t)), add(mul(c2, 3 * u * t * t), mul(p2, t * t * t)));
  };
  const {from, to, toFrac, inset} = CHEST4.traceRim;
  const raw: V[] = [];
  for (let i = from - 1; i >= to; i--) for (let j = 8; j >= 1; j--) raw.push(at(i, j / 8));
  raw.push(at(to, 0) /* vertex `to` */);
  for (let j = 7; j >= Math.round(8 * (1 - toFrac)); j--) raw.push(at(to - 1, j / 8));
  return raw.map((p, i) => {
    const a = raw[Math.max(0, i - 1)];
    const b = raw[Math.min(raw.length - 1, i + 1)];
    const d = {x: b.x - a.x, y: b.y - a.y};
    const l = Math.hypot(d.x, d.y) || 1;
    let nrm = {x: -d.y / l, y: d.x / l};
    if ((WIN_C.x - p.x) * nrm.x + (WIN_C.y - p.y) * nrm.y < 0) nrm = mul(nrm, -1);
    const q = add(p, mul(nrm, inset));
    return add(WIN_PIVOT, mul(add(q, mul(WIN_PIVOT, -1)), k));
  });
};
const HEART_L = L(CHEST4.heart);
/** the heart landmark the treatment camera keys are set on (Aftermath3 camAt): the first layout's heart centre, kept
 *  fixed so that enlarging and re-centring the heart does not move any camera */
const HEART_CAM_L = L([86, -53.5]);

// ---------------------------------------------------------------- frames
const up = (a: number): V => ({x: -Math.sin((a * Math.PI) / 180), y: -Math.cos((a * Math.PI) / 180)});
const px = (a: number): V => ({x: Math.cos((a * Math.PI) / 180), y: -Math.sin((a * Math.PI) / 180)});
/** world point of a window-group local point */
export const chestToWorld = (C: V, tc: number, s: number, p: V): V => add(C, add(mul(px(tc), p.x * s), mul(up(tc), -p.y * s)));
/** world positions the cameras frame (from the man's chest base C, upper-torso angle tc and scale s) */
export const chestWorld = (C: V, tc: number, s: number) => ({
  centroid: chestToWorld(C, tc, s, WIN_C),
  heart: chestToWorld(C, tc, s, HEART_CAM_L),
  svcTop: chestToWorld(C, tc, s, add(HEART_L, mul(rot({x: -15.3, y: -33}, HEART_TILT), CHEST4.heartK))),
  liver: chestToWorld(C, tc, s, L([45, -72])),
  traceIn: chestToWorld(C, tc, s, L(CHEST4.trace[0])),
});

// ---------------------------------------------------------------- drawing helpers
const grad = (id: string, c: V, r: number, light: V, stops: [number, string][]) => (
  <radialGradient id={id} gradientUnits="userSpaceOnUse" cx={fmt(c.x)} cy={fmt(c.y)} r={fmt(r)} fx={fmt(c.x + light.x * r * 0.45)} fy={fmt(c.y + light.y * r * 0.45)}>
    {stops.map(([o, col], i) => (
      <stop key={i} offset={o} stopColor={col} />
    ))}
  </radialGradient>
);

/** A short diagnostic dash on a polyline (any units): amber signal or red warning, t = head position 0..1 of the
 *  polyline, len its length, w the trace width. A faint local glow (alpha 0.3, radius 2.6 w), normal blending. */
export const TraceDash: React.FC<{pts: V[]; t: number; len: number; kind: TracePulse['kind']; a: number; w: number; id: string}> = ({pts, t, len, kind, a, w, id}) => {
  const segs = pts.slice(1).map((p, i) => Math.hypot(p.x - pts[i].x, p.y - pts[i].y));
  const Lt = segs.reduce((x, y) => x + y, 0) || 1;
  const head = alongPts(pts, t);
  const tail = alongPts(pts, t - (kind === 'signal' ? 1 : -1) * (len / Lt));
  const core = kind === 'signal' ? '#FFE2A8' : '#FFD6D9';
  const rim = kind === 'signal' ? '#FFB23E' : '#FF4A5A';
  return (
    <g opacity={a}>
      <defs>
        <radialGradient id={id}>
          <stop offset="0" stopColor={rim} stopOpacity={0.3} />
          <stop offset="1" stopColor={rim} stopOpacity={0} />
        </radialGradient>
      </defs>
      <circle cx={fmt(head.x)} cy={fmt(head.y)} r={fmt(w * 2.6)} fill={`url(#${id})`} />
      <path d={`M${fmt(tail.x)},${fmt(tail.y)} L${fmt(head.x)},${fmt(head.y)}`} stroke={kind === 'signal' ? '#7A3E06' : '#6A0A14'} strokeOpacity={0.35} strokeWidth={fmt(w * 2.5)} strokeLinecap="round" />
      <path d={`M${fmt(tail.x)},${fmt(tail.y)} L${fmt(head.x)},${fmt(head.y)}`} stroke={rim} strokeWidth={fmt(w * 1.9)} strokeLinecap="round" />
      <path d={`M${fmt(tail.x)},${fmt(tail.y)} L${fmt(head.x)},${fmt(head.y)}`} stroke={core} strokeWidth={fmt(w * 0.9)} strokeLinecap="round" />
    </g>
  );
};

type Props = {
  id: string;
  f: number;
  /** the man's chest base, upper-torso angle and scale (manJoints C, tc, s) */
  C: V;
  tc: number;
  s: number;
  /** open amount 0..1 (reveal4 chestOpen): the window scale about WIN_PIVOT runs from K_HIDE to 1 */
  open: number;
  organDim: number;
  organSense: number;
  organWarn: number;
  heart: HeartState;
  heartSense: number;
  heartWarn: number;
  /** the diagnostic trace's chest segment and its pulses */
  traceA: number;
  pulses: TracePulse[];
  treat?: {t: number; a: number};
  treatLight?: number;
};

export const ChestWindow: React.FC<Props> = ({id, f, C, tc, s, open, organDim, organSense, organWarn, heart, heartSense, heartWarn, traceA, pulses, treat, treatLight = 0}) => {
  const o = clamp(open);
  // the window opens and closes by geometry alone: it scales from K_HIDE (all of it, band and ink line included,
  // under the near arm and sleeve) to 1 about WIN_PIVOT, always fully opaque, so every frame shows either an opaque
  // window of some size growing out from under the arm (or sliding back under it) or nothing. The scale leaves
  // K_HIDE only once the open amount passes OPEN_MIN, so the slow tail of the open/close ease is spent under the arm
  // and no thin crescent lingers beside the sleeve
  const g = clamp((o - OPEN_MIN) / (1 - OPEN_MIN));
  if (g <= 0) return null;
  const k = K_HIDE + (1 - K_HIDE) * g;
  const light = LIGHT_TN(tc);
  const winD = closedD(WIN_L);
  const scaleT = `translate(${fmt(WIN_PIVOT.x)} ${fmt(WIN_PIVOT.y)}) scale(${fmt(k)}) translate(${fmt(-WIN_PIVOT.x)} ${fmt(-WIN_PIVOT.y)})`;
  const rlD = closedD(CHEST4.rLung.map(L));
  const rfD = closedD(CHEST4.rFront.map(L));
  const llD = closedD(CHEST4.lLung.map(L));
  const dTop = CHEST4.diaphragm.map(L);
  const dBot = CHEST4.diaphragm.map(([u, v]) => L([u - CHEST4.diaphragmT, v])).reverse();
  // the failing liver: a warm, bright orange-red that turns a dull, desaturated grey-brown as it fails (it stays an
  // organ colour at about the same lightness, never a dark hole)
  const liverCol = mix('#D2643F', '#98705F', clamp(organDim));
  const lvD = closedD(CHEST4.liver.map(L));
  const hk = CHEST4.heartK;
  // the diagnostic trace's chest segment runs along the window's cut edge (skin level), scaled with the window
  const rim = rimTrace(k);
  const tracePulses = pulses.filter((p) => p.leg === 'chest');
  // the diaphragm's top line closed upward (the thorax) and downward (the abdomen): the right lung's front margin is
  // cut by the first, the liver by the second
  const dTopD = openD(dTop);
  const aboveD = `${dTopD} L${fmt(dTop[dTop.length - 1].x)},-250 L${fmt(dTop[0].x)},-250 Z`;
  const belowD = `${dTopD} L${fmt(dTop[dTop.length - 1].x)},60 L${fmt(dTop[0].x)},60 Z`;
  // lungs: light pink lit toward the head, deepening toward their edges, with a soft darker rim inside the outline
  const lungStops: [number, string][] = [
    [0, '#FBDADC'],
    [0.5, '#F0AAB4'],
    [1, '#CC7F8F'],
  ];
  const RIM = '#A65A6E';
  const lung = (d: string, g: string, clip: string) => (
    <>
      <path d={d} fill={`url(#${id}-${g})`} />
      <g clipPath={`url(#${id}-${clip})`}>
        <path d={d} fill="none" stroke={RIM} strokeWidth={8} opacity={0.26} strokeLinejoin="round" />
        <path d={d} fill="none" stroke={RIM} strokeWidth={3.4} opacity={0.42} strokeLinejoin="round" />
      </g>
      <path d={d} fill="none" stroke={INK} strokeOpacity={0.5} strokeWidth={0.8} strokeLinejoin="round" />
    </>
  );
  const fissure = (pts: UV[]) => <path d={openD(pts.map(L))} fill="none" stroke={RIM} strokeWidth={1.1} opacity={0.6} strokeLinecap="round" />;
  const band = (w: number, col: string, op = 1) => <path d={winD} transform={scaleT} fill="none" stroke={col} strokeWidth={fmt(w)} strokeLinejoin="round" opacity={op} />;
  // the liver sensors swell once as they turn amber (the start of the 'organ failing' beat), then stay small
  const lsR = 1.8 * (1 + 0.45 * Math.sin(Math.PI * clamp(organWarn / 0.4)) * (organWarn < 0.999 ? 1 : 0));
  return (
    <g transform={`translate(${fmt(C.x)} ${fmt(C.y)}) rotate(${fmt(-tc)}) scale(${fmt(s)})`}>
      <defs>
        <clipPath id={`${id}-w`}>
          <path d={winD} transform={scaleT} />
        </clipPath>
        {/* above u 96.6 the left lung's medial edge passes in front of the arch's end and the left pulmonary artery
            (there the lung never overlaps the heart itself, so the clip line is invisible) */}
        <clipPath id={`${id}-top`}>
          <rect x={-200} y={-200} width={400} height={103.4} />
        </clipPath>
        <clipPath id={`${id}-above`}>
          <path d={aboveD} />
        </clipPath>
        <clipPath id={`${id}-below`}>
          <path d={belowD} />
        </clipPath>
        <clipPath id={`${id}-rlc`}>
          <path d={rlD} />
        </clipPath>
        <clipPath id={`${id}-rfc`}>
          <path d={rfD} />
        </clipPath>
        <clipPath id={`${id}-llc`}>
          <path d={llD} />
        </clipPath>
        {/* the back wall: a deep warm red, a little darker in the mediastinum between the lungs above the arch */}
        <linearGradient id={`${id}-bg`} gradientUnits="userSpaceOnUse" x1={0} y1={-134} x2={0} y2={-24}>
          <stop offset="0" stopColor="#7A3036" />
          <stop offset="0.3" stopColor="#97464A" />
          <stop offset="1" stopColor="#8E4243" />
        </linearGradient>
        {/* below the diaphragm: a warm abdominal wall tone, lighter under the band (no dark hole under the heart) */}
        <linearGradient id={`${id}-ab`} gradientUnits="userSpaceOnUse" x1={0} y1={-70} x2={0} y2={-24}>
          <stop offset="0" stopColor="#B4615A" />
          <stop offset="1" stopColor="#9C5050" />
        </linearGradient>
        {grad(`${id}-rl`, L([116, -59.7]), 26.4, light, lungStops)}
        {/* the right lung's front margin is lit on its own (a rounded lobe edge: light along its middle, deeper at its
            heart border and base) */}
        {grad(`${id}-rf`, L([92, -76]), 21, light, lungStops)}
        {grad(`${id}-ll`, L([105.4, -19.2]), 35, light, lungStops)}
        {grad(`${id}-st`, L([40, -36]), 30, light, [
          [0, '#E6B6A4'],
          [0.55, '#CF9282'],
          [1, '#A86D60'],
        ])}
        {grad(`${id}-lv`, L([60, -84]), 24, light, [
          [0, mix(liverCol, '#F6CDB6', 0.22)],
          [0.6, liverCol],
          [1, shade(liverCol, 0.32)],
        ])}
      </defs>
      <g clipPath={`url(#${id}-w)`}>
        <rect x={-130} y={-150} width={190} height={140} fill={`url(#${id}-bg)`} />
        {/* lungs, behind the heart and its vessels: the larger right lung along the front edge, the left lung with
            its cardiac notch round the heart's left border, running under the near arm */}
        {lung(rlD, 'rl', 'rlc')}
        {lung(llD, 'll', 'llc')}
        {fissure(CHEST4.lFissure)}
        {/* below the diaphragm: the abdomen (the warm wall tone), the liver under the right dome in the lower front
            corner (dims when it starts failing), then the diaphragm band over their tops */}
        <path d={`${openD(dBot)} L${fmt(L([-20, -120]).x)},${fmt(L([-20, -120]).y)} L${fmt(L([-20, 40]).x)},${fmt(L([-20, 40]).y)} Z`} fill={`url(#${id}-ab)`} />
        <g clipPath={`url(#${id}-below)`}>
          <path d={closedD(CHEST4.stomach.map(L))} fill={`url(#${id}-st)`} stroke={INK} strokeOpacity={0.3} strokeWidth={0.6} />
          <path d={lvD} fill={`url(#${id}-lv)`} stroke={INK} strokeOpacity={0.35 + 0.15 * clamp(organDim)} strokeWidth={0.7} />
        </g>
        <path d={`${openD(dTop)} L${openD(dBot).slice(1)} Z`} fill="#B65A52" />
        <path d={openD(dBot.slice().reverse())} fill="none" stroke="#7E3434" strokeWidth={0.8} opacity={0.6} />
        <path d={openD(dTop)} fill="none" stroke="#E39A8E" strokeWidth={1.2} strokeLinecap="round" />
        <path d={openD(dTop)} fill="none" stroke={INK} strokeOpacity={0.3} strokeWidth={0.6} strokeLinecap="round" />
        {organSense > 0.01 &&
          CHEST4.liverSensors.map((q, i) => {
            const p = L(q);
            const col = sensorColor(organWarn);
            return <circle key={i} cx={fmt(p.x)} cy={fmt(p.y)} r={fmt(lsR)} fill={col} stroke={shade(col, 0.55)} strokeWidth={0.5} opacity={organSense} />;
          })}
        {/* the heart with its great vessels */}
        <Heart4 id={`${id}-h`} c={HEART_L} k={hk} st={heart} light={light} sense={heartSense} warn={heartWarn} treat={treat} treatLight={treatLight} />
        {/* the right lung's anterior margin over the heart's right border, so the heart sits between the lungs; its
            base is cut by the diaphragm's top line */}
        <g clipPath={`url(#${id}-above)`}>
          {lung(rfD, 'rf', 'rfc')}
          <g clipPath={`url(#${id}-rfc)`}>{fissure(CHEST4.rFissure)}</g>
        </g>
        {/* the aortic arch and the left pulmonary artery pass behind the left lung's medial edge */}
        <g clipPath={`url(#${id}-top)`}>
          {lung(llD, 'll', 'llc')}
          {fissure(CHEST4.lFissure)}
        </g>
        {/* the cut band: skin, fat and muscle strata, matte, thin and constant (the inside half of each stroke) */}
        {band(10.4, '#3A1216', 0.22)}
        {band(9, '#A9504B')}
        {band(5.6, '#DDBE84')}
        {band(3.2, '#E8BBA2')}
        {/* the diagnostic trace's chest segment: a thin line in the skin stratum of the cut edge, from under the sleeve
            to a small contact dot on the rim (no wire crosses the lungs or reaches the heart); its dashes run along it */}
        {traceA > 0.01 && (
          <g opacity={traceA < 0.999 ? fmt(traceA) : undefined}>
            <path d={openD(rim)} fill="none" stroke="#1B4E66" strokeWidth={1.4} strokeOpacity={0.25} strokeLinecap="round" />
            <path d={openD(rim)} fill="none" stroke="#9EEBFF" strokeWidth={0.7} strokeOpacity={0.6} strokeLinecap="round" />
            {tracePulses.map((p) => (
              <TraceDash key={`${p.kind}${p.key}`} id={`${id}-d${p.kind}${p.key}`} pts={rim} t={p.t} len={7} kind={p.kind} a={p.a} w={1} />
            ))}
            <circle cx={fmt(rim[rim.length - 1].x)} cy={fmt(rim[rim.length - 1].y)} r={1.7} fill={sensorColor(heartWarn)} stroke={shade(sensorColor(heartWarn), 0.55)} strokeWidth={0.55} />
          </g>
        )}
      </g>
      {/* the tee's cut edge: one thin ink line */}
      <path d={winD} transform={scaleT} fill="none" stroke={INK} strokeWidth={0.85} strokeOpacity={0.55} strokeLinejoin="round" />
    </g>
  );
};

/** world points of the chest trace segment (for camera keys) */
export const chestTraceWorld = (C: V, tc: number, s: number) => CHEST4.trace.map((q) => chestToWorld(C, tc, s, L(q)));
export {svcAt};
