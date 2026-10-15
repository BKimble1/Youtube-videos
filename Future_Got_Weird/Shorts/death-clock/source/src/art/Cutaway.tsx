// V4 chest window. A torso-shaped section on the VISIBLE front of his thorax (between the tee's front contour and
// the near arm, its back edge running under the near arm), at least 8 world units inside the tee everywhere.
// Everything is drawn in the torso's own frame (local x = v, toward his left/back; y = -u, down the spine; rig
// units), so it turns and breathes with him and has no parallax. It is mounted in Man's overTorso slot (after the
// tee, before the near thigh, the far forearm and hand, and the near arm and sleeve), so all of those occlude it
// and no organ ever draws over the arm.
//
// The interior is one self-consistent anterior layout (the anatomy reference, shifted toward his front and scaled
// to fit), tuned to read at phone size: a large heart in the middle of the visible part of the window, resting on
// the diaphragm with its apex down toward +V (as far toward +V as the near arm allows); two light pink lungs with
// a soft darker rim, the larger right lung on the -V (front) side and the smaller left lung with its cardiac notch
// on +V (above and beside the heart, then under the arm), their anterior borders nearly meeting above the arch
// across a darker mediastinal gap. The right lung's anterior margin is drawn IN FRONT of the heart's right border
// (as in situ: over the outer part of the right atrium, just lateral of the vena cava), so one continuous pale
// crescent runs from the vena cava down to its rounded base on the diaphragm and the heart visibly sits between
// the lungs. The great vessels sit above the heart between them (the aortic arch toward +V, its end passing behind
// the left lung); the diaphragm band below; and, under it, the liver (the "organ failing" beat: warm orange-red,
// greying and darkening as it fails) in the lower front corner with its left lobe running on under the heart, on
// the warm wall tone of the abdomen. The back wall is a deep warm red. Edge: one thin, restrained matte cut band
// (skin, fat, muscle) with a thin ink line; no rim highlight, crescent, depth ring, gloss or white dots. The window
// opens and closes by scaling about a pivot under the near arm (WIN_PIVOT): at open 0 its scale is K_HIDE, where
// the whole window (band and ink line included) already lies under the near arm and sleeve, so it grows out from
// under the arm and slides back under it; its last sliver beside the sleeve (open below about 0.38, one or two
// frames) also fades out, so nothing small is ever left on the bare tee.
import React from 'react';
import {mix, shade} from '../lib/color';
import {INK} from '../lib/ink';
import {HeartState} from '../lib/heart4';
import {TracePulse} from '../lib/reveal4';
import {add, clamp, fmt, mul, rot, smooth, V} from '../lib/math';
import {LIGHT} from '../lib/shade';
import {alongPts, closedD, Heart4, HEART_TILT, heartSensorAt, openD, sensorColor, svcAt} from './Heart4';

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
  /** heart centre and scale: as large as the near arm allows (its apex, the part nearest the arm, stays 10 world
   *  clear of the arm and sleeve ink edge), low in the cavity on the diaphragm, the right atrium just inside the
   *  front cut band */
  heart: [82.5, -57.3] as UV,
  heartK: 1.15,
  /** right lung (larger), behind the heart: its medial edge runs behind the vena cava, the right atrium and the right
   *  ventricle, its base on the right dome (under the diaphragm band); inside the window it shows above the arch
   *  (where the two lungs' anterior borders nearly meet) and, with rFront in front of the heart, along the front edge */
  rLung: [
    [152, -30],
    [140, -27],
    [131, -27.5],
    [124.5, -30],
    [120, -35],
    [116, -44],
    [112, -54],
    [108, -62],
    [103, -67],
    [95, -71],
    [85, -73],
    [76, -72.5],
    [69, -70.5],
    [66, -70.5],
    [67, -75],
    [64, -80],
    [60, -87],
    [55.5, -94],
    [50, -102],
    [52, -114],
    [92, -114],
    [124, -104],
    [146, -84],
    [156, -56],
  ] as UV[],
  /** left lung (smaller): its medial edge passes in front of the end of the aortic arch and the left pulmonary
   *  artery (the hilum), then the cardiac notch curves round the heart's left border with a narrow mediastinal gap,
   *  and the lingula tucks in toward the apex; the rest runs under the near arm */
  lLung: [
    [146, -21],
    [137, -22.5],
    [130, -23.5],
    [123, -25.5],
    [116, -29.5],
    [110, -31],
    [104, -28.5],
    [98, -25.5],
    [90, -29.5],
    [83, -30.5],
    [76, -31.2],
    [69, -34.5],
    [62.5, -38],
    [56.5, -43.3],
    [55, -41],
    [52.5, -35],
    [48.5, -26],
    [42, -14],
    [35, 0],
    [29, 14],
    [46, 38],
    [100, 48],
    [132, 36],
    [148, 10],
  ] as UV[],
  /** the right lung's anterior margin, drawn IN FRONT of the heart's right border (as in situ): its medial edge runs
   *  just lateral of the vena cava, over the outer 2-3 units of the right atrium and the right ventricle's border, into
   *  the cardiophrenic angle, then its rounded base follows the top of the diaphragm out to the front edge; the rest of
   *  the outline lies outside the window. With the right lung behind it, this makes one continuous front crescent from
   *  the vena cava's exit to the diaphragm, at least 5 units wide beside the atrium. */
  rFront: [
    [126, -77],
    [116, -74.4],
    [110, -74.9],
    [104.5, -75.3],
    [100, -75.1],
    [95, -74.7],
    [90, -74.4],
    [85, -73.6],
    [80.5, -72.6],
    [75.5, -72.1],
    [70.5, -71.4],
    [67.2, -71.6],
    [65.3, -74.2],
    [62.2, -79.5],
    [57.6, -86.5],
    [51, -96],
    [44, -106],
    [60, -118],
    [100, -112],
    [124, -96],
  ] as UV[],
  /** one faint fissure per lung (right: the horizontal fissure across the front margin; left: the oblique fissure) */
  rFissure: [
    [88.5, -94],
    [86.8, -86],
    [84.6, -79.5],
  ] as UV[],
  lFissure: [
    [126, 2],
    [113, -10],
    [100, -17],
    [87, -23],
  ] as UV[],
  /** top edge of the diaphragm: the right dome under the right lung, the heart resting on it (its lower border
   *  overlaps the band), lower on the left under the left lung */
  diaphragm: [
    [46, -104],
    [54, -92],
    [60, -82],
    [64.5, -75.5],
    [65.5, -71],
    [62, -66.5],
    [59.5, -61],
    [57, -56],
    [54.6, -50],
    [54, -45],
    [51.5, -38],
    [46.5, -28],
    [40, -16],
    [33, 0],
    [27, 14],
  ] as UV[],
  diaphragmT: 5,
  /** liver: under the right dome in the window's lower front corner, its left lobe running on under the heart along
   *  the diaphragm toward +V (its top tucks under the diaphragm band) to a rounded tip short of the near arm; its
   *  inferior border rises from the window's bottom edge to that tip */
  liver: [
    [42, -104],
    [50, -92],
    [56, -82],
    [60.5, -75.5],
    [61.5, -71],
    [58, -66.5],
    [55.5, -61],
    [53, -56],
    [50.8, -51.5],
    [48.6, -48.2],
    [45, -47],
    [41.5, -49.2],
    [37.5, -53.5],
    [33.5, -60],
    [30, -69],
    [27, -82],
    [25, -96],
    [30, -110],
    [44, -113],
  ] as UV[],
  liverSensors: [
    [52, -79],
    [42, -70],
    [46, -56],
  ] as UV[],
  /** the diagnostic trace's chest segment: from under the near arm to the left-ventricle sensor */
  trace: [
    [68, -6],
    [71, -18],
    [73.5, -29],
  ] as UV[],
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
  if (o <= 0) return null;
  // the window scales from K_HIDE (all of it under the near arm) to 1 about WIN_PIVOT; its last sliver beside the
  // sleeve (open below about 0.38, a frame or two of the open and the close) also fades out, gone by open 0.08, so
  // it never lingers as a crescent
  const k = K_HIDE + (1 - K_HIDE) * o;
  const fadeA = smooth(clamp((o - 0.08) / 0.3));
  const light = LIGHT_TN(tc);
  const winD = closedD(WIN_L);
  const scaleT = `translate(${fmt(WIN_PIVOT.x)} ${fmt(WIN_PIVOT.y)}) scale(${fmt(k)}) translate(${fmt(-WIN_PIVOT.x)} ${fmt(-WIN_PIVOT.y)})`;
  const rlD = closedD(CHEST4.rLung.map(L));
  const rfD = closedD(CHEST4.rFront.map(L));
  const llD = closedD(CHEST4.lLung.map(L));
  const dTop = CHEST4.diaphragm.map(L);
  const dBot = CHEST4.diaphragm.map(([u, v]) => L([u - CHEST4.diaphragmT, v])).reverse();
  // the failing liver: a warm, bright orange-red that greys AND darkens (about 30% lower luma) as it fails
  const liverCol = mix('#D2643F', '#625753', clamp(organDim));
  const lvD = closedD(CHEST4.liver.map(L));
  const hk = CHEST4.heartK;
  const sensorEnd = heartSensorAt(heart, HEART_L, hk, 0);
  const tracePts = [...CHEST4.trace.map(L), sensorEnd];
  const tracePulses = pulses.filter((p) => p.leg === 'chest');
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
    <g transform={`translate(${fmt(C.x)} ${fmt(C.y)}) rotate(${fmt(-tc)}) scale(${fmt(s)})`} opacity={fadeA < 0.999 ? fmt(fadeA) : undefined}>
      <defs>
        <clipPath id={`${id}-w`}>
          <path d={winD} transform={scaleT} />
        </clipPath>
        {/* above u 94 the left lung's medial edge passes in front of the arch's end and the left pulmonary artery
            (there the lung never overlaps the heart itself, so the clip line is invisible) */}
        <clipPath id={`${id}-top`}>
          <rect x={-200} y={-200} width={400} height={106} />
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
        {/* below the diaphragm: the same warm wall tone, a touch lighter under the band */}
        <linearGradient id={`${id}-ab`} gradientUnits="userSpaceOnUse" x1={0} y1={-56} x2={0} y2={-24}>
          <stop offset="0" stopColor="#9C4A48" />
          <stop offset="1" stopColor="#874042" />
        </linearGradient>
        {grad(`${id}-rl`, L([116, -68]), 30, light, lungStops)}
        {/* the right lung's front margin is lit on its own (a rounded lobe edge: light along its middle, deeper at its
            heart border and base) */}
        {grad(`${id}-rf`, L([86, -82]), 24, light, lungStops)}
        {grad(`${id}-ll`, L([104, -22]), 40, light, lungStops)}
        {grad(`${id}-lv`, L([47, -68]), 26, light, [
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
        {/* below the diaphragm: the abdomen (the warm wall tone), the liver under the right dome with its left lobe
            under the heart (dims when it starts failing), then the diaphragm band over their tops */}
        <path d={`${openD(dBot)} L${fmt(L([-20, -120]).x)},${fmt(L([-20, -120]).y)} L${fmt(L([-20, 40]).x)},${fmt(L([-20, 40]).y)} Z`} fill={`url(#${id}-ab)`} />
        <path d={lvD} fill={`url(#${id}-lv)`} stroke={INK} strokeOpacity={0.35 + 0.2 * clamp(organDim)} strokeWidth={0.7} />
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
        {/* the heart with its great vessels; the trace's end sensor shows as soon as the trace reaches it */}
        <Heart4 id={`${id}-h`} c={HEART_L} k={hk} st={heart} light={light} sense={heartSense} senseEnd={traceA} warn={heartWarn} treat={treat} treatLight={treatLight} />
        {/* the right lung's anterior margin over the heart's right border, so the heart sits between the lungs */}
        {lung(rfD, 'rf', 'rfc')}
        <g clipPath={`url(#${id}-rfc)`}>{fissure(CHEST4.rFissure)}</g>
        {/* the aortic arch and the left pulmonary artery pass behind the left lung's medial edge */}
        <g clipPath={`url(#${id}-top)`}>
          {lung(llD, 'll', 'llc')}
          {fissure(CHEST4.lFissure)}
        </g>
        {/* the diagnostic trace's short chest segment, from under the arm to the heart sensor */}
        {traceA > 0.01 && (
          <g opacity={traceA}>
            <path d={openD(tracePts)} fill="none" stroke="#1B4E66" strokeWidth={1.5} strokeOpacity={0.3} strokeLinecap="round" />
            <path d={openD(tracePts)} fill="none" stroke="#9EEBFF" strokeWidth={0.75} strokeOpacity={0.5} strokeLinecap="round" />
            {tracePulses.map((p) => (
              <TraceDash key={`${p.kind}${p.key}`} id={`${id}-d${p.kind}${p.key}`} pts={tracePts} t={p.t} len={7} kind={p.kind} a={p.a} w={1} />
            ))}
          </g>
        )}
        {/* the cut band: skin, fat and muscle strata, matte, thin and constant (the inside half of each stroke) */}
        {band(10.4, '#3A1216', 0.22)}
        {band(9, '#A9504B')}
        {band(5.6, '#DDBE84')}
        {band(3.2, '#E8BBA2')}
      </g>
      {/* the tee's cut edge: one thin ink line */}
      <path d={winD} transform={scaleT} fill="none" stroke={INK} strokeWidth={0.85} strokeOpacity={0.55} strokeLinejoin="round" />
    </g>
  );
};

/** world points of the chest trace segment (for camera keys) */
export const chestTraceWorld = (C: V, tc: number, s: number) => CHEST4.trace.map((q) => chestToWorld(C, tc, s, L(q)));
export {svcAt};
