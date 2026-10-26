// The research robot: a 2D drawing of a soft-skinned robotic face of the kind Columbia's Creative Machines Lab built
// (blue-violet silicone face over a motorised frame; cameras in the pupils; a light shell at the back of the head; a
// mechanical neck on a bench support). It is drawn for this film, not traced from the lab's photographs.
//
// Construction: every feature sits on an ellipsoid at an azimuth / elevation and is projected for the head's yaw, so
// the oblique, front, mirror and back views are the same drawing turned (no flat face slid across a disc). The mouth
// is one continuous deforming surface: four lip curves (upper outer / inner, lower inner / outer) share the corner
// points, so the corners can never detach. All shots sample one RobotState per frame (state.ts).
import React from 'react';
import {lit, mix, shade} from '../dc/color';
import {INK, Inked, InkLine, InkPath, useInk} from '../dc/ink';
import {clamp, fmt, lerp, V} from '../dc/math';

export type RobotState = {
  /** deg; 0 = facing the camera, +90 = facing screen-right, 180 = back to the camera */
  yaw: number;
  /** small nod (deg, + = chin down) */
  pitch: number;
  roll: number;
  /** 0..1 corners up and out, cheeks lifted */
  smile: number;
  /** 0..1 jaw drop */
  open: number;
  /** 0..1 lips rounded and pushed forward ("w", "oo") */
  round: number;
  /** 0..1 lips pressed together ("b", "m") */
  press: number;
  /** -1..1 lips stretched wide (+) or narrowed (-) */
  wide: number;
  /** -1..1 one corner up, the other down (untrained babbling) */
  asym: number;
  /** gaze -1..1 */
  gx: number;
  gy: number;
  blink: number;
  /** resting upper-lid closure 0..1 */
  lid: number;
  /** brow-ridge raise -1..1 */
  brow: number;
  /** an extra local pull on the skin (face units, see skinPull) */
  pull?: {u: number; v: number; dx: number; dy: number; r: number};
};

export const ROBOT_NEUTRAL: RobotState = {yaw: 0, pitch: 0, roll: 0, smile: 0, open: 0, round: 0, press: 0, wide: 0, asym: 0, gx: 0, gy: 0, blink: 0, lid: 0.16, brow: 0};
export const mixRobot = (a: RobotState, b: RobotState, t: number): RobotState => {
  const o = {...a} as RobotState;
  (Object.keys(a) as (keyof RobotState)[]).forEach((k) => {
    if (k === 'pull') return;
    (o as any)[k] = lerp(a[k] as number, b[k] as number, t);
  });
  o.pull = t < 0.5 ? a.pull : b.pull;
  return o;
};

export const RPAL = {
  skin: '#93A6E2',
  skinDeep: '#6A7CC0',
  lip: '#7C86CF',
  lipDeep: '#5B63AE',
  mouth: '#262B47',
  shell: '#E4E7EA',
  shellDeep: '#AEB6BF',
  metal: '#8B96A3',
  dark: '#3A4450',
  led: '#F5A33B',
  sclera: '#F5F7FB',
  iris: '#435775',
  lens: '#0F141E',
};

const RX = 100;
const RY = 116;
const D2R = Math.PI / 180;
export type P3 = {x: number; y: number; z: number};
/** project a point on the head (az / el in degrees, r = 1 on the surface) */
export const proj = (st: RobotState, az: number, el: number, r = 1): P3 => {
  const a = (az + st.yaw) * D2R;
  const e = (el - st.pitch * Math.cos((az) * D2R) * 0) * D2R;
  const ce = Math.cos(e);
  const y0 = -RY * r * Math.sin(e);
  const zf = Math.cos(a);
  // nod: rotate (y, depth) about the head's x axis
  const p = st.pitch * D2R;
  const dz = RX * r * ce * zf;
  const y = y0 * Math.cos(p) + dz * Math.sin(p) * 0.6;
  return {x: RX * r * ce * Math.sin(a), y, z: ce * zf};
};
/** clamp a point that is past the silhouette onto it (so a skin edge follows the limb) */
const projClamp = (st: RobotState, az: number, el: number, r = 1) => {
  let a = az + st.yaw;
  a = ((a + 540) % 360) - 180;
  // a hidden point goes to the limb on the side the face points to (keeps the mask a sliver in back views)
  const faceSide = Math.sin(st.yaw * D2R) >= 0 ? 90 : -90;
  const ca = Math.cos(a * D2R) >= 0 ? a : faceSide;
  return proj({...st, yaw: 0}, ca, el, r);
};
const vis = (st: RobotState, az: number) => Math.cos((az + st.yaw) * D2R);

// ---------------------------------------------------------------- mouth model (face units; mouth centre at az 0 / el -38)
const MOUTH_EL = -38;
const UAZ = 0.6; // deg per face unit across
const VEL = 0.55; // deg per face unit down
/** the extra local skin pull (gaussian) */
export const skinPull = (st: RobotState, u: number, v: number) => {
  const p = st.pull;
  if (!p) return {du: 0, dv: 0};
  const g = Math.exp(-((u - p.u) ** 2 + (v - p.v) ** 2) / (2 * p.r * p.r));
  return {du: p.dx * g, dv: p.dy * g};
};
export type MouthCurves = {hw: number; uo: [number, number, number][]; ui: [number, number, number][]; li: [number, number, number][]; lo: [number, number, number][]; chinDrop: number};
const N_LIP = 13;
export const mouthCurves = (st: RobotState): MouthCurves => {
  const sm = clamp(st.smile), j = clamp(st.open), rd = clamp(st.round), pz = clamp(st.press);
  const hw = 37 * (1 + 0.2 * st.wide + 0.17 * sm - 0.34 * rd) * (1 - 0.04 * pz);
  const D = 27 * j * (1 - 0.15 * rd);
  const uo: [number, number, number][] = [];
  const ui: [number, number, number][] = [];
  const li: [number, number, number][] = [];
  const lo: [number, number, number][] = [];
  for (let i = 0; i < N_LIP; i++) {
    const x = -1 + (2 * i) / (N_LIP - 1);
    const s = x < 0 ? -1 : 1;
    const q = 1 - x * x;
    // corners: up with the smile, one up / one down with asym (corner shared by all four curves)
    const cv = -12 * sm + 1.5 * rd + 1 * pz - st.asym * s * 6 * Math.abs(x) ** 0.5;
    const cornerPart = cv * x * x;
    const qr = Math.pow(q, 0.85 - 0.45 * rd); // a rounder opening when the lips round
    const gapUp = (1 - pz) * (1.1 + 2.6 * j + 3.2 * rd);
    const gapLo = (1 - pz) * (1.1 + D + 5.5 * rd);
    const upIn = cornerPart - gapUp * qr;
    const loIn = cornerPart + gapLo * qr - pz * 0.6 * q;
    const thU = (10 - 3 * pz + 2.5 * rd) * Math.pow(q, 0.62);
    const thL = (11.5 - 3.5 * pz + 3 * rd) * Math.pow(q, 0.58);
    const bow = 1.6 * Math.exp(-((x / 0.17) ** 2)) * (1 - 0.6 * rd);
    const u = x * hw * (1 - 0.18 * rd * q);
    const fwd = 1.03 + 0.055 * rd * q + 0.012 * q;
    const add = (arr: [number, number, number][], uu: number, vv: number, r: number) => {
      const p = skinPull(st, uu, vv);
      arr.push([uu + p.du, vv + p.dv, r]);
    };
    add(uo, u, upIn - thU + bow, fwd);
    add(ui, u * 0.985, upIn, fwd - 0.004);
    add(li, u * 0.985, loIn, fwd - 0.004);
    add(lo, u, loIn + thL, fwd - 0.002);
  }
  return {hw, uo, ui, li, lo, chinDrop: D};
};
/** face units -> head (az, el) */
export const faceAzEl = (u: number, v: number) => ({az: u * UAZ, el: MOUTH_EL - v * VEL});
export const projFace = (st: RobotState, u: number, v: number, r = 1.02) => {
  const {az, el} = faceAzEl(u, v);
  return proj(st, az, el, r);
};
/** lip anchor points (head-local screen coords), for the cutaway linkages: 10 attachments */
export const lipAnchors = (st: RobotState) => {
  const m = mouthCurves(st);
  const at = (arr: [number, number, number][], i: number) => proj(st, arr[i][0] * UAZ, MOUTH_EL - arr[i][1] * VEL, arr[i][2] - 0.02);
  const c = (N_LIP - 1) / 2;
  return [
    {k: 'cornerL', p: at(m.uo, 0)},
    {k: 'upperL', p: at(m.uo, 3)},
    {k: 'upperC', p: at(m.uo, c)},
    {k: 'upperR', p: at(m.uo, N_LIP - 4)},
    {k: 'cornerR', p: at(m.uo, N_LIP - 1)},
    {k: 'lowerL', p: at(m.lo, 3)},
    {k: 'lowerC', p: at(m.lo, c)},
    {k: 'lowerR', p: at(m.lo, N_LIP - 4)},
    {k: 'cheekL', p: proj(st, -(m.hw + 10) * UAZ, MOUTH_EL - (-12 - 6 * st.smile) * VEL, 1.0)},
    {k: 'cheekR', p: proj(st, (m.hw + 10) * UAZ, MOUTH_EL - (-12 - 6 * st.smile) * VEL, 1.0)},
  ];
};

// ---------------------------------------------------------------- path helpers
const P = (p: {x: number; y: number}) => `${fmt(p.x)},${fmt(p.y)}`;
/** Catmull-Rom through points (open) */
const smooth = (pts: {x: number; y: number}[], move = true) => {
  let d = move ? `M${P(pts[0])}` : `L${P(pts[0])}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
    const c1 = {x: p1.x + (p2.x - p0.x) / 6, y: p1.y + (p2.y - p0.y) / 6};
    const c2 = {x: p2.x - (p3.x - p1.x) / 6, y: p2.y - (p3.y - p1.y) / 6};
    d += ` C${P(c1)} ${P(c2)} ${P(p2)}`;
  }
  return d;
};
const closedSmooth = (pts: {x: number; y: number}[]) => {
  let d = `M${P(pts[0])}`;
  const n = pts.length;
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
    const c1 = {x: p1.x + (p2.x - p0.x) / 6, y: p1.y + (p2.y - p0.y) / 6};
    const c2 = {x: p2.x - (p3.x - p1.x) / 6, y: p2.y - (p3.y - p1.y) / 6};
    d += ` C${P(c1)} ${P(c2)} ${P(p2)}`;
  }
  return d + ' Z';
};

// ---------------------------------------------------------------- face mask (silhouette of the silicone skin)
const MASK: [number, number][] = [
  [0, 47], [26, 45], [50, 40], [66, 30], [76, 14], [78, -4], [74, -24], [64, -40], [52, -54], [36, -65], [17, -72], [0, -74],
  [-17, -72], [-36, -65], [-52, -54], [-64, -40], [-74, -24], [-78, -4], [-76, 14], [-66, 30], [-50, 40], [-26, 45],
];
export const maskPts = (st: RobotState) =>
  MASK.map(([az, el]) => {
    const p = projClamp(st, az, el, 1.012);
    // the chin and jaw skin follow the jaw drop
    const w = clamp((-el - 40) / 34);
    return {x: p.x, y: p.y + mouthCurves(st).chinDrop * 0.8 * w * w};
  });

export type Cutaway = {
  /** centre in face units (u across, v down from the mouth centre) */
  u: number;
  v: number;
  /** radius in head-local px */
  r: number;
  /** 0..1 opening */
  k: number;
  /** show the whole-head x-ray (motors through the frame) instead of a local window */
  xray?: number;
};

type Props = {
  id: string;
  st: RobotState;
  x: number;
  y: number;
  /** px per head unit (head half-width = 100 units) */
  s: number;
  /** colour grade (e.g. cooler in the mirror) */
  tint?: string;
  tintK?: number;
  cut?: Cutaway;
  /** draw the flexible-skin grid over the lower face (0..1) */
  grid?: number;
  /** limit the grid to a soft patch (face units) */
  gridAt?: {u: number; v: number; r: number};
  /** highlight the lip anchors (0..1) */
  anchors?: number;
  /** highlight one anchor key */
  focusAnchor?: string;
  /** soft glow on the mouth corners: the cue being matched (0..1) */
  cornerCue?: number;
  /** lens glint flash (camera activity) */
  lensGlow?: number;
  /** whole-head x-ray: representative motors behind the skin (0..1); one group can be highlighted */
  xray?: number;
  xrayHot?: string[];
  /** V2: darkness of the skin under the x-ray (V1 0.55); lower reads as translucent silicone */
  xrayDark?: number;
};

const inkW = 5.2;
/** cranium and the frame behind the jaw: full width at the temples, tapering to the neck housing */
const SHELL_D = `M0,${-RY} C${RX * 0.56},${-RY} ${RX},${-RY * 0.55} ${RX},-6 C${RX},${RY * 0.36} ${RX * 0.86},${RY * 0.62} ${RX * 0.6},${RY * 0.8} C${RX * 0.42},${RY * 0.9} ${-RX * 0.42},${RY * 0.9} ${-RX * 0.6},${RY * 0.8} C${-RX * 0.86},${RY * 0.62} ${-RX},${RY * 0.36} ${-RX},-6 C${-RX},${-RY * 0.55} ${-RX * 0.56},${-RY} 0,${-RY} Z`;

export const Robot: React.FC<Props> = ({id, st, x, y, s, tint, tintK = 0, cut, grid = 0, gridAt, anchors = 0, focusAnchor, cornerCue = 0, lensGlow = 0, xray = 0, xrayHot = [], xrayDark = 0.55}) => {
  const pass = useInk().pass;
  const T = (c: string) => (tint && tintK > 0 ? mix(c, tint, tintK) : c);
  const skin = T(RPAL.skin);
  const shell = T(RPAL.shell);
  const m = mouthCurves(st);
  const fp = (a: [number, number, number]) => proj(st, a[0] * UAZ, MOUTH_EL - a[1] * VEL, a[2]);
  const UO = m.uo.map(fp), UI = m.ui.map(fp), LI = m.li.map(fp), LO = m.lo.map(fp);
  const mask = maskPts(st);
  const maskD = closedSmooth(mask);
  const yawN = ((st.yaw + 540) % 360) - 180; // -180..180
  const faceVis = Math.cos(yawN * D2R); // >0 face toward camera
  const side = yawN >= 0 ? 1 : -1; // which way the face points on screen
  const L = {x: -0.62, y: -0.78};
  const sk = (k: string) => `${id}-${k}`;

  // ---------------- eyes
  const Eye = (sgn: 1 | -1) => {
    const az = 30 * sgn;
    const el = 6;
    const c = proj(st, az, el, 1.0);
    if (c.z < 0.08) return null;
    const fz = Math.pow(clamp(c.z), 0.85);
    const rx = 20 * fz;
    const ry = 16.5;
    const lidT = clamp(st.lid + st.blink * (1 - st.lid));
    // almond: upper arc higher at the middle, lower arc flatter
    const top = c.y - ry;
    const bot = c.y + ry * 0.82;
    const eyeD = `M${fmt(c.x - rx)},${fmt(c.y)} C${fmt(c.x - rx * 0.6)},${fmt(top - 3)} ${fmt(c.x + rx * 0.6)},${fmt(top - 3)} ${fmt(c.x + rx)},${fmt(c.y)} C${fmt(c.x + rx * 0.55)},${fmt(bot + 2)} ${fmt(c.x - rx * 0.55)},${fmt(bot + 2)} ${fmt(c.x - rx)},${fmt(c.y)} Z`;
    // iris on the eyeball: shifts with gaze and with the turn
    const ix = c.x + st.gx * rx * 0.42 + Math.sin((az + st.yaw) * D2R) * 2.5;
    const iy = c.y + 1 + st.gy * ry * 0.35;
    const ir = 9.6;
    const lidY = lerp(top - 4, bot + 2, lidT);
    const closed = lidT > 0.93;
    return (
      <g key={`eye${sgn}`}>
        <defs>
          <clipPath id={sk(`ec${sgn}`)}>
            <path d={eyeD} />
          </clipPath>
          <radialGradient id={sk(`es${sgn}`)} cx={fmt(c.x)} cy={fmt(c.y - 3)} r={fmt(ry * 1.5)} gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#FFFFFF" />
            <stop offset="0.6" stopColor={RPAL.sclera} />
            <stop offset="1" stopColor="#B9C3D6" />
          </radialGradient>
        </defs>
        {/* socket shade */}
        {pass !== 'ink' && <ellipse cx={fmt(c.x)} cy={fmt(c.y - 1)} rx={fmt(rx + 7)} ry={fmt(ry + 6)} fill={T(RPAL.skinDeep)} opacity={0.32} />}
        {closed ? (
          <InkLine d={`M${fmt(c.x - rx)},${fmt(c.y + 2)} Q${fmt(c.x)},${fmt(c.y + 8)} ${fmt(c.x + rx)},${fmt(c.y + 2)}`} w={3.4} />
        ) : (
          <g>
            <Inked w={2.6}>
              <InkPath d={eyeD} fill={`url(#${sk(`es${sgn}`)})`} />
            </Inked>
            {pass !== 'ink' && (
              <g clipPath={`url(#${sk(`ec${sgn}`)})`}>
                <ellipse cx={fmt(ix)} cy={fmt(iy)} rx={fmt(ir * Math.max(0.55, fz))} ry={fmt(ir)} fill={RPAL.iris} />
                <ellipse cx={fmt(ix)} cy={fmt(iy)} rx={fmt(ir * 0.78 * Math.max(0.55, fz))} ry={fmt(ir * 0.78)} fill="none" stroke="#7E9CC6" strokeWidth={1.4} opacity={0.8} />
                {/* the pupil is a camera lens */}
                <ellipse cx={fmt(ix)} cy={fmt(iy)} rx={fmt(4.9 * Math.max(0.55, fz))} ry={4.9} fill={RPAL.lens} />
                <ellipse cx={fmt(ix)} cy={fmt(iy)} rx={fmt(3.1 * Math.max(0.55, fz))} ry={3.1} fill="none" stroke="#3E5674" strokeWidth={0.9} />
                <circle cx={fmt(ix + 2.2)} cy={fmt(iy - 2.4)} r={1.7} fill="#FFFFFF" opacity={0.92} />
                <circle cx={fmt(ix - 1.6)} cy={fmt(iy + 1.8)} r={0.8} fill="#9FD2FF" opacity={0.7 + 0.3 * lensGlow} />
                {lensGlow > 0.01 && <circle cx={fmt(ix)} cy={fmt(iy)} r={6.5} fill="#8FD0FF" opacity={0.35 * lensGlow} />}
                {/* upper lid with a soft shadow on the eye */}
                <rect x={fmt(c.x - rx - 2)} y={fmt(lidY)} width={fmt(rx * 2 + 4)} height={5} fill="#3B4A77" opacity={0.18} />
                <path d={`M${fmt(c.x - rx - 3)},${fmt(top - 12)} L${fmt(c.x + rx + 3)},${fmt(top - 12)} L${fmt(c.x + rx + 3)},${fmt(lidY)} Q${fmt(c.x)},${fmt(lidY + 4)} ${fmt(c.x - rx - 3)},${fmt(lidY)} Z`} fill={mix(skin, T(RPAL.skinDeep), 0.25)} />
              </g>
            )}
            {lidT > 0.03 && <InkLine d={`M${fmt(c.x - rx - 1)},${fmt(lidY)} Q${fmt(c.x)},${fmt(lidY + 4)} ${fmt(c.x + rx + 1)},${fmt(lidY)}`} w={2.8} />}
          </g>
        )}
        {!closed && <InkLine d={`M${fmt(c.x - rx * 0.7)},${fmt(bot + 4)} Q${fmt(c.x)},${fmt(bot + 7)} ${fmt(c.x + rx * 0.7)},${fmt(bot + 4)}`} w={1.4} opacity={0.3} />}
        {/* lid crease */}
        <InkLine d={`M${fmt(c.x - rx * 0.85)},${fmt(top - 4 - st.brow * 2)} Q${fmt(c.x)},${fmt(top - 10 - st.brow * 3)} ${fmt(c.x + rx * 0.85)},${fmt(top - 4 - st.brow * 2)}`} w={1.7} opacity={0.45} />
      </g>
    );
  };

  // ---------------- nose (soft silicone, projected tip)
  const Nose = () => {
    const br = proj(st, 0, 2, 1.04);
    const tip = proj(st, 0, -17, 1.15);
    const wl = proj(st, -11, -20, 1.05);
    const wr = proj(st, 11, -20, 1.05);
    const base = proj(st, 0, -22, 1.07);
    if (tip.z < 0.05) return null;
    // the ridge line runs down the side away from the light / on the far side of the turn
    const farW = side > 0 ? wl : wr;
    const nearW = side > 0 ? wr : wl;
    const ridge = `M${P(br)} Q${fmt(lerp(br.x, tip.x, 0.6) + side * 1.5)},${fmt(lerp(br.y, tip.y, 0.55))} ${P(tip)}`;
    return (
      <g>
        {pass !== 'ink' && (
          <g>
            <path d={`M${P(br)} L${P(nearW)} Q${P(base)} ${P(farW)} Z`} fill={T(RPAL.skinDeep)} opacity={0.22} />
            <ellipse cx={fmt(tip.x)} cy={fmt(tip.y + 1)} rx={6.5} ry={5} fill={lit(skin, 0.18)} opacity={0.8} />
            <ellipse cx={fmt(tip.x - 2)} cy={fmt(tip.y - 1.5)} rx={2.4} ry={1.6} fill="#FFFFFF" opacity={0.55} />
            <ellipse cx={fmt(lerp(base.x, farW.x, 0.4))} cy={fmt(base.y + 1)} rx={3.2} ry={1.8} fill={T(RPAL.mouth)} opacity={0.5} />
            <ellipse cx={fmt(lerp(base.x, nearW.x, 0.5))} cy={fmt(base.y + 1)} rx={3.6} ry={1.9} fill={T(RPAL.mouth)} opacity={0.55} />
          </g>
        )}
        <InkLine d={ridge} w={2.2} opacity={0.55} />
        <InkLine d={`M${P(tip)} Q${fmt(lerp(tip.x, base.x, 0.5) - side * 2)},${fmt(base.y + 2)} ${P(lerpP(base, farW, 0.7))}`} w={2.4} opacity={0.8} />
        <InkLine d={`M${P(lerpP(base, nearW, 0.5))} Q${P(nearW)} ${fmt(nearW.x + side * 1)},${fmt(nearW.y - 5)}`} w={2.1} opacity={0.6} />
      </g>
    );
  };

  // ---------------- mouth
  const mouthOpen = st.open > 0.02 || st.round > 0.3;
  const mouthVis = proj(st, 0, MOUTH_EL, 1).z > 0.06;
  const innerD = smooth(UI) + ' ' + smooth([...LI].reverse(), false) + ' Z';
  const upperD = smooth(UO) + ' ' + smooth([...UI].reverse(), false) + ' Z';
  const lowerD = smooth(LI) + ' ' + smooth([...LO].reverse(), false) + ' Z';
  const cornerL = UO[0];
  const cornerR = UO[UO.length - 1];

  // ---------------- cheeks / creases (smile)
  const sm = clamp(st.smile);
  const cheek = (sgn: 1 | -1) => {
    const c = proj(st, 40 * sgn, -20 + 5 * sm, 1.0);
    if (c.z < 0.05) return null;
    return <ellipse key={`ck${sgn}`} cx={fmt(c.x)} cy={fmt(c.y)} rx={fmt(20 * Math.max(0.4, c.z))} ry={15} fill={lit(skin, 0.3)} opacity={0.18 + 0.32 * sm} />;
  };
  const crease = (sgn: 1 | -1) => {
    const a = proj(st, 14 * sgn, -21, 1.04);
    const b = proj(st, (m.hw * UAZ + 6) * sgn, -36 - 3 * sm, 1.02);
    const c = proj(st, (m.hw * UAZ + 5) * sgn, -48, 1.0);
    if (Math.min(a.z, b.z) < 0.12) return null;
    return <InkLine key={`cr${sgn}`} d={`M${P(a)} Q${P(b)} ${P(c)}`} w={2} opacity={0.12 + 0.45 * sm} />;
  };

  // ---------------- shell details (back of the head)
  const ear = (sgn: 1 | -1) => {
    const az = 100 * sgn;
    const c = proj(st, az, 2, 1.0);
    if (c.z < 0.02) return null;
    const fz = c.z;
    const led = sgn > 0; // the robot's LEFT side carries an orange status LED (it flips in the mirror)
    return (
      <g key={`ear${sgn}`}>
        <Inked w={2.6}>
          <InkPath d={`M${fmt(c.x - 19 * fz)},${fmt(c.y)} a${fmt(19 * fz)},21 0 1,0 ${fmt(38 * fz)},0 a${fmt(19 * fz)},21 0 1,0 ${fmt(-38 * fz)},0`} fill={mix(shell, RPAL.shellDeep, 0.35)} />
        </Inked>
        {pass !== 'ink' && (
          <g>
            <ellipse cx={fmt(c.x)} cy={fmt(c.y)} rx={fmt(11 * fz)} ry={12.5} fill={RPAL.dark} />
            <ellipse cx={fmt(c.x)} cy={fmt(c.y)} rx={fmt(5 * fz)} ry={5.5} fill={RPAL.metal} />
            {[0, 1, 2, 3].map((k) => {
              const a = (k * 90 + 45) * D2R;
              return <circle key={k} cx={fmt(c.x + Math.cos(a) * 15 * fz)} cy={fmt(c.y + Math.sin(a) * 17)} r={1.6} fill={RPAL.shellDeep} />;
            })}
            {led && <circle cx={fmt(c.x + 13 * fz)} cy={fmt(c.y - 20)} r={2.6} fill={RPAL.led} />}
            {led && <circle cx={fmt(c.x + 13 * fz)} cy={fmt(c.y - 20)} r={5.5} fill={RPAL.led} opacity={0.25} />}
          </g>
        )}
      </g>
    );
  };
  const seam = (az: number, k: string) => {
    const pts: P3[] = [];
    for (let el = 70; el >= -55; el -= 10) pts.push(proj(st, az, el, 1.0));
    const vis2 = pts.filter((p) => p.z > 0.02);
    if (vis2.length < 2) return null;
    return <InkLine key={k} d={smooth(vis2)} w={1.6} opacity={0.4} />;
  };
  // the back panel: an access hatch with screws and cable exits (seen in the back and over-shoulder views)
  const hatch = () => {
    const pts = [[160, 40], [200, 40], [205, -20], [155, -20]].map(([a, e]) => proj(st, a, e, 1.0));
    if (pts.some((p) => p.z < 0.05)) return null;
    return (
      <g>
        <Inked w={2}>
          <InkPath d={closedSmooth(pts)} fill={mix(shell, RPAL.shellDeep, 0.25)} />
        </Inked>
        {pass !== 'ink' &&
          [proj(st, 165, 33, 1), proj(st, 195, 33, 1), proj(st, 197, -13, 1), proj(st, 163, -13, 1)].map((p, i) => <circle key={i} cx={fmt(p.x)} cy={fmt(p.y)} r={1.8} fill={RPAL.metal} />)}
        {pass !== 'ink' &&
          [170, 180, 190].map((a, i) => {
            const p = proj(st, a, -32, 1);
            return p.z > 0 ? <ellipse key={i} cx={fmt(p.x)} cy={fmt(p.y)} rx={4} ry={3} fill={RPAL.dark} /> : null;
          })}
      </g>
    );
  };

  // ---------------- cutaway (a local section of the same face)
  const cutEls = () => {
    if (!cut || cut.k <= 0.001) return null;
    const c0 = projFace(st, cut.u, cut.v, 1.0);
    const r = cut.r * cut.k;
    const A = lipAnchors(st);
    // servos sit inside the frame behind the lower face; each horn points at its anchor
    const servo = (k: string) => {
      const a = A.find((q) => q.k === k)!.p;
      const base = {x: lerp(a.x, c0.x, 0.15) + (k.includes('L') ? -1 : k.includes('R') ? 1 : 0) * 8 * (faceVis > 0 ? 1 : -1), y: a.y + (k.startsWith('lower') ? 26 : k.startsWith('upper') ? -24 : 0) + (k.startsWith('cheek') ? -22 : 0)};
      return {a, base};
    };
    const keysUsed = ['cornerL', 'cornerR', 'upperL', 'upperC', 'upperR', 'lowerL', 'lowerC', 'lowerR', 'cheekL', 'cheekR'];
    return (
      <g>
        <defs>
          <clipPath id={sk('cut')}>
            <circle cx={fmt(c0.x)} cy={fmt(c0.y)} r={fmt(r)} />
          </clipPath>
          <radialGradient id={sk('cav')} cx={fmt(c0.x)} cy={fmt(c0.y)} r={fmt(Math.max(1, r))} gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#3A4466" />
            <stop offset="1" stopColor="#1E2438" />
          </radialGradient>
        </defs>
        <g clipPath={`url(#${sk('cut')})`}>
          <circle cx={fmt(c0.x)} cy={fmt(c0.y)} r={fmt(r + 2)} fill={`url(#${sk('cav')})`} />
          {/* frame ribs behind the skin */}
          {[-30, -10, 10, 30].map((dy, i) => (
            <line key={i} x1={fmt(c0.x - r)} y1={fmt(c0.y + dy)} x2={fmt(c0.x + r)} y2={fmt(c0.y + dy + 6)} stroke="#4C577A" strokeWidth={2.2} opacity={0.6} />
          ))}
          {/* ghost of the lips the anchors hold (the skin surface above this layer) */}
          <path d={upperD} fill={T(RPAL.lip)} opacity={0.22} />
          <path d={lowerD} fill={T(RPAL.lip)} opacity={0.22} />
          <path d={smooth(UO)} fill="none" stroke="#C9D3FF" strokeWidth={1.3} strokeDasharray="4 3" opacity={0.85} />
          <path d={smooth(LO)} fill="none" stroke="#C9D3FF" strokeWidth={1.3} strokeDasharray="4 3" opacity={0.85} />
          {keysUsed.map((k) => {
            const {a, base} = servo(k);
            const foc = focusAnchor === k;
            return (
              <g key={k}>
                {/* servo body */}
                <rect x={fmt(base.x - 8)} y={fmt(base.y - 5.5)} width={16} height={11} rx={2} fill="#59627E" stroke="#121624" strokeWidth={1.2} />
                <circle cx={fmt(base.x)} cy={fmt(base.y)} r={3} fill={foc ? RPAL.led : '#AEB8D6'} />
                {/* linkage rod to the lip anchor */}
                <line x1={fmt(base.x)} y1={fmt(base.y)} x2={fmt(a.x)} y2={fmt(a.y)} stroke={foc ? '#FFD18A' : '#C7CFE6'} strokeWidth={foc ? 2.4 : 1.7} strokeLinecap="round" />
                <circle cx={fmt(a.x)} cy={fmt(a.y)} r={foc ? 3.6 : 2.7} fill={foc ? RPAL.led : '#E8ECFA'} stroke="#121624" strokeWidth={0.9} />
              </g>
            );
          })}
        </g>
        {/* the cut edge of the skin: a rim with thickness */}
        <circle cx={fmt(c0.x)} cy={fmt(c0.y)} r={fmt(r)} fill="none" stroke={lit(skin, 0.1)} strokeWidth={5} />
        <circle cx={fmt(c0.x)} cy={fmt(c0.y)} r={fmt(r - 2.5)} fill="none" stroke={T(RPAL.skinDeep)} strokeWidth={1.6} />
        <circle cx={fmt(c0.x)} cy={fmt(c0.y)} r={fmt(r + 2.6)} fill="none" stroke={INK} strokeWidth={1.4} />
      </g>
    );
  };

  // ---------------- flexible-skin grid (face units), deformed by the same field as the lips
  const gridEls = () => {
    if (grid <= 0.001) return null;
    const at = ([u, v]: [number, number]) => {
      const d = skinPull(st, u, v);
      const near = Math.exp(-((Math.abs(u) - m.hw) ** 2 + v * v) / (2 * 22 * 22));
      const dv = -8 * st.smile * near * (Math.abs(u) > m.hw * 0.7 ? 1 : 0.3) + (v > 6 ? m.chinDrop * clamp((v - 6) / 30) : 0);
      return projFace(st, u + d.du, v + d.dv + dv, 1.015);
    };
    const line = (pts: [number, number][]) => {
      const pp = pts
        .map(([u, v]) => {
          const d = skinPull(st, u, v);
          // the mouth's own motion spreads into the skin around it (smile lifts, jaw drops)
          const near = Math.exp(-((Math.abs(u) - m.hw) ** 2 + v * v) / (2 * 22 * 22));
          const dv = -8 * st.smile * near * (Math.abs(u) > m.hw * 0.7 ? 1 : 0.3) + (v > 6 ? m.chinDrop * clamp((v - 6) / 30) : 0);
          return projFace(st, u + d.du, v + d.dv + dv, 1.015);
        })
        .filter((p) => p.z > 0.1);
      return pp.length > 1 ? smooth(pp) : '';
    };
    const ls: string[] = [];
    const gs = gridAt ? 12 : 8;
    for (let v = -34; v <= 40; v += gs) {
      const row: [number, number][] = [];
      for (let u = -62; u <= 62; u += 4) row.push([u, v]);
      ls.push(line(row));
    }
    for (let u = -60; u <= 60; u += gs) {
      const col: [number, number][] = [];
      for (let v = -36; v <= 42; v += 4) col.push([u, v]);
      ls.push(line(col));
    }
    return (
      <g opacity={grid}>
        <defs>
          <clipPath id={sk('gm')}>
            <path d={maskD} />
          </clipPath>
        </defs>
        {gridAt && (() => {
          const c = projFace(st, gridAt.u, gridAt.v, 1.0);
          return (
            <defs>
              <radialGradient id={sk('gr')} cx={fmt(c.x)} cy={fmt(c.y)} r={fmt(gridAt.r)} gradientUnits="userSpaceOnUse">
                <stop offset="0" stopColor="#FFF" />
                <stop offset="0.6" stopColor="#FFF" />
                <stop offset="1" stopColor="#000" />
              </radialGradient>
              <mask id={sk('grm')}>
                <rect x={-300} y={-300} width={600} height={600} fill={`url(#${sk('gr')})`} />
              </mask>
            </defs>
          );
        })()}
        <g clipPath={`url(#${sk('gm')})`} mask={gridAt ? `url(#${sk('grm')})` : undefined}>
          {ls.map((d, i) => (
            <path key={i} d={d} fill="none" stroke="#E9EEFF" strokeWidth={gridAt ? 0.7 : 1.1} opacity={gridAt ? 0.4 : 0.75} />
          ))}
          {gridAt &&
            (() => {
              const out: React.ReactNode[] = [];
              for (let v = -34; v <= 40; v += 12)
                for (let u = -60; u <= 60; u += 12) {
                  const p = at([u, v]);
                  if (p.z > 0.3) out.push(<circle key={`${u}_${v}`} cx={fmt(p.x)} cy={fmt(p.y)} r={1.6} fill="#F4F7FF" fillOpacity={0.85} stroke="#2A3566" strokeWidth={0.4} />);
                }
              return out;
            })()}
        </g>
      </g>
    );
  };

  const anchorEls = () => {
    if (anchors <= 0.001) return null;
    return (
      <g opacity={anchors}>
        {lipAnchors(st).map((a) =>
          a.p.z > 0.05 ? (
            <g key={a.k}>
              <circle cx={fmt(a.p.x)} cy={fmt(a.p.y)} r={a.k === focusAnchor ? 4.2 : 3} fill={a.k === focusAnchor ? RPAL.led : '#F2F5FF'} stroke={INK} strokeWidth={1} />
            </g>
          ) : null,
        )}
      </g>
    );
  };

  const cue = cornerCue > 0.001 && (
    <g opacity={cornerCue}>
      {[cornerL, cornerR].map((c, i) =>
        c.z > 0.1 ? <circle key={i} cx={fmt(c.x)} cy={fmt(c.y)} r={8} fill="none" stroke="#FFE3A6" strokeWidth={1.6} /> : null,
      )}
    </g>
  );

  // ---------------- x-ray: a representative set of the face's motors (not all 26), each linked to what it moves
  const xrayEls = () => {
    if (xray <= 0.001) return null;
    const A = lipAnchors(st);
    const anc = (k: string) => A.find((q) => q.k === k)!.p;
    const eyeL = proj(st, -30, 14, 1.0), eyeR = proj(st, 30, 14, 1.0);
    const browL = proj(st, -30, 27, 1.0), browR = proj(st, 30, 27, 1.0);
    const jaw = proj(st, 0, -70, 1.0);
    type M = {g: string; m: P3; to: {x: number; y: number}};
    const ms: M[] = [
      {g: 'brow', m: proj(st, -26, 40, 0.8), to: browL},
      {g: 'brow', m: proj(st, 26, 40, 0.8), to: browR},
      {g: 'lid', m: proj(st, -44, 18, 0.78), to: eyeL},
      {g: 'lid', m: proj(st, 44, 18, 0.78), to: eyeR},
      {g: 'cheek', m: proj(st, -50, -14, 0.8), to: anc('cheekL')},
      {g: 'cheek', m: proj(st, 50, -14, 0.8), to: anc('cheekR')},
      {g: 'corner', m: proj(st, -44, -36, 0.78), to: anc('cornerL')},
      {g: 'corner', m: proj(st, 44, -36, 0.78), to: anc('cornerR')},
      {g: 'lip', m: proj(st, -14, -22, 0.8), to: anc('upperL')},
      {g: 'lip', m: proj(st, 0, -20, 0.8), to: anc('upperC')},
      {g: 'lip', m: proj(st, 14, -22, 0.8), to: anc('upperR')},
      {g: 'lip', m: proj(st, -16, -56, 0.8), to: anc('lowerL')},
      {g: 'lip', m: proj(st, 0, -58, 0.8), to: anc('lowerC')},
      {g: 'lip', m: proj(st, 16, -56, 0.8), to: anc('lowerR')},
      {g: 'jaw', m: proj(st, 0, -48, 0.6), to: {x: jaw.x, y: jaw.y + m.chinDrop * 0.8}},
    ];
    return (
      <g opacity={xray}>
        <path d={maskD} fill="#1C2340" opacity={xrayDark} />
        {/* the frame under the skin */}
        {[-30, -10, 10, 30].map((az) => {
          const pts: P3[] = [];
          for (let el = 44; el >= -66; el -= 10) pts.push(proj(st, az, el, 0.86));
          const v = pts.filter((p) => p.z > 0.05);
          return v.length > 1 ? <path key={az} d={smooth(v)} fill="none" stroke="#5E6C9C" strokeWidth={2} opacity={0.7} /> : null;
        })}
        {[30, 0, -30, -55].map((el) => {
          const pts: P3[] = [];
          for (let az = -70; az <= 70; az += 10) pts.push(proj(st, az, el, 0.86));
          const v = pts.filter((p) => p.z > 0.05);
          return v.length > 1 ? <path key={el} d={smooth(v)} fill="none" stroke="#5E6C9C" strokeWidth={2} opacity={0.7} /> : null;
        })}
        {ms.map((q, i) => {
          if (q.m.z < 0.05) return null;
          const hot = xrayHot.includes(q.g);
          return (
            <g key={i}>
              <line x1={fmt(q.m.x)} y1={fmt(q.m.y)} x2={fmt(q.to.x)} y2={fmt(q.to.y)} stroke={hot ? '#FFD18A' : '#C7CFE6'} strokeWidth={hot ? 2.2 : 1.5} strokeLinecap="round" opacity={0.9} />
              <rect x={fmt(q.m.x - 7)} y={fmt(q.m.y - 5)} width={14} height={10} rx={2} fill={hot ? '#8A6A3A' : '#59627E'} stroke="#0E1220" strokeWidth={1.1} />
              <circle cx={fmt(q.m.x)} cy={fmt(q.m.y)} r={2.6} fill={hot ? RPAL.led : '#AEB8D6'} />
              <circle cx={fmt(q.to.x)} cy={fmt(q.to.y)} r={2.2} fill="#E8ECFA" stroke="#0E1220" strokeWidth={0.8} />
            </g>
          );
        })}
      </g>
    );
  };

  const showFace = faceVis > -0.92;
  return (
    <g transform={`translate(${fmt(x)} ${fmt(y)}) rotate(${fmt(st.roll)}) scale(${fmt(s)})`}>
      <defs>
        <radialGradient id={sk('sh')} cx={fmt(-25)} cy={fmt(-35)} r={150} gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor={lit(shell, 0.35)} />
          <stop offset="0.55" stopColor={shell} />
          <stop offset="1" stopColor={shade(shell, 0.28)} />
        </radialGradient>
        <radialGradient id={sk('sk')} cx={fmt(-20 + side * 10)} cy={-30} r={140} gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor={lit(skin, 0.24)} />
          <stop offset="0.5" stopColor={skin} />
          <stop offset="0.9" stopColor={mix(skin, T(RPAL.skinDeep), 0.6)} />
          <stop offset="1" stopColor={T(RPAL.skinDeep)} />
        </radialGradient>
        <linearGradient id={sk('lp')} x1="0" y1="-40" x2="0" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor={lit(T(RPAL.lip), 0.12)} />
          <stop offset="1" stopColor={T(RPAL.lipDeep)} />
        </linearGradient>
        <clipPath id={sk('mk')}>
          <path d={maskD} />
        </clipPath>
      </defs>
      {/* head shell */}
      <Inked w={inkW}>
        <InkPath d={SHELL_D} fill={`url(#${sk('sh')})`} />
        {showFace && <InkPath d={maskD} fill={`url(#${sk('sk')})`} />}
      </Inked>
      {pass !== 'ink' && (
        <g>
          {seam(84, 'sa')}
          {seam(-84, 'sb')}
          {seam(180, 'sc')}
          {hatch()}
          {ear(1)}
          {ear(-1)}
        </g>
      )}
      {showFace && pass !== 'ink' && (
        <g clipPath={`url(#${sk('mk')})`}>
          {/* the skin edge against the frame: a faint inner rim */}
          <path d={maskD} fill="none" stroke={lit(skin, 0.3)} strokeWidth={3} opacity={0.5} />
          {[-1, 1].map((sg) => {
            const c = proj(st, 56 * sg, -30, 1.0);
            return c.z > 0.05 ? <ellipse key={`cb${sg}`} cx={fmt(c.x)} cy={fmt(c.y)} rx={fmt(16 * Math.max(0.35, c.z))} ry={26} fill={T(RPAL.skinDeep)} opacity={0.2} /> : null;
          })}
          {cheek(1)}
          {cheek(-1)}
          {(() => {
            const c = proj(st, 0, -68, 1.0);
            return c.z > 0.1 ? <ellipse cx={fmt(c.x - 3)} cy={fmt(c.y + m.chinDrop * 0.75 - 2)} rx={9} ry={5} fill={lit(skin, 0.35)} opacity={0.35} /> : null;
          })()}
          {/* under-lip / chin shade */}
          {(() => {
            const c = proj(st, 0, -58, 1.0);
            return <ellipse cx={fmt(c.x)} cy={fmt(c.y + m.chinDrop * 0.5)} rx={fmt(26 * Math.max(0.5, c.z))} ry={9} fill={T(RPAL.skinDeep)} opacity={0.22} />;
          })()}
          {crease(1)}
          {crease(-1)}
        </g>
      )}
      {showFace && (
        <g>
          {Eye(-1)}
          {Eye(1)}
          {/* brow ridges (no hair: soft ridges in the silicone) */}
          {[-1, 1].map((sg) => {
            const a = proj(st, 17 * sg, 24 + st.brow * 3, 1.02);
            const b = proj(st, 33 * sg, 27 + st.brow * 4, 1.02);
            const c = proj(st, 46 * sg, 22 + st.brow * 2, 1.0);
            if (Math.min(a.z, c.z) < 0.1) return null;
            return <InkLine key={sg} d={`M${P(a)} Q${P(b)} ${P(c)}`} w={3.4} opacity={0.32} color={T(RPAL.skinDeep)} />;
          })}
          {Nose()}
          {/* mouth */}
          {mouthVis && <g>
          {(mouthOpen || st.open > 0.005) && pass !== 'ink' && <path d={innerD} fill={T(RPAL.mouth)} />}
          {pass !== 'ink' && <path d={lowerD} fill={`url(#${sk('lp')})`} />}
          {pass !== 'ink' && <path d={upperD} fill={mix(T(RPAL.lip), T(RPAL.lipDeep), 0.25)} />}
          {pass !== 'ink' && (
            <g>
              {/* lip highlights */}
              <path d={smooth(LO.slice(4, 9).map((p, i) => ({x: p.x, y: lerp(p.y, LI[4 + i].y, 0.45)})))} fill="none" stroke="#FFFFFF" strokeWidth={2.2} strokeLinecap="round" opacity={0.28} />
            </g>
          )}
          <InkLine d={smooth(UO)} w={2} opacity={0.55} />
          <InkLine d={smooth(LO)} w={1.8} opacity={0.4} />
          <InkLine d={smooth(UI)} w={2.4} opacity={0.9} />
          {(mouthOpen || st.open > 0.02) && <InkLine d={smooth(LI)} w={2} opacity={0.75} />}
          {/* corner dimples */}
          {[cornerL, cornerR].map((c, i) => (c.z > 0.1 ? <InkLine key={i} d={`M${fmt(c.x + (i ? 2 : -2))},${fmt(c.y - 2)} l${i ? 2.5 : -2.5},${fmt(2 + 2 * sm)}`} w={1.8} opacity={0.5} /> : null))}
          </g>}
          {cue}
          {gridEls()}
          {cutEls()}
          {xrayEls()}
          {anchorEls()}
          {/* glossy highlights on the silicone */}
          {pass !== 'ink' && (
            <g opacity={0.5}>
              {(() => {
                const f = proj(st, -18, 36, 1.0);
                return f.z > 0.2 ? <ellipse cx={fmt(f.x)} cy={fmt(f.y)} rx={16} ry={6} transform={`rotate(-14 ${fmt(f.x)} ${fmt(f.y)})`} fill="#FFFFFF" opacity={0.35} /> : null;
              })()}
            </g>
          )}
        </g>
      )}
    </g>
  );
};
const lerpP = (a: {x: number; y: number}, b: {x: number; y: number}, t: number) => ({x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t)});

/** The neck and bench support under the head: a short neck housing, a gimbal block on a steel post, and a base box
 *  with a status LED and a cable bundle. Drawn in the same local units as the head (origin = head centre). */
export const RobotSupport: React.FC<{id: string; x: number; y: number; s: number; yaw: number; postLen?: number; tint?: string; tintK?: number}> = ({id, x, y, s, yaw, postLen = 150, tint, tintK = 0}) => {
  const T = (c: string) => (tint && tintK > 0 ? mix(c, tint, tintK) : c);
  const pass = useInk().pass;
  const sk = (k: string) => `${id}-${k}`;
  const turn = Math.sin(yaw * D2R);
  return (
    <g transform={`translate(${fmt(x)} ${fmt(y)}) scale(${fmt(s)})`}>
      <defs>
        <linearGradient id={sk('post')} x1="-12" y1="0" x2="12" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor={lit(T(RPAL.metal), 0.4)} />
          <stop offset="0.5" stopColor={T(RPAL.metal)} />
          <stop offset="1" stopColor={shade(T(RPAL.metal), 0.4)} />
        </linearGradient>
        <linearGradient id={sk('box')} x1="0" y1="0" x2="0" y2="60" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor={lit(T(RPAL.dark), 0.15)} />
          <stop offset="1" stopColor={shade(T(RPAL.dark), 0.3)} />
        </linearGradient>
      </defs>
      <Inked w={4}>
        {/* neck housing (under the jaw) */}
        <InkPath d={`M-34,92 C-34,82 34,82 34,92 L30,138 C30,146 -30,146 -30,138 Z`} fill={T(RPAL.shellDeep)} />
        {/* gimbal block */}
        <InkPath d={`M-24,136 L24,136 L22,160 L-22,160 Z`} fill={T(RPAL.dark)} />
        {/* post */}
        <InkPath d={`M-9,158 L9,158 L9,${158 + postLen} L-9,${158 + postLen} Z`} fill={`url(#${sk('post')})`} />
        {/* base box */}
        <InkPath d={`M-70,${150 + postLen} L70,${150 + postLen} L74,${206 + postLen} L-74,${206 + postLen} Z`} fill={`url(#${sk('box')})`} />
      </Inked>
      {pass !== 'ink' && (
        <g>
          {/* neck servo horn and cables into the head */}
          <circle cx={fmt(turn * 6)} cy={148} r={6} fill={T(RPAL.metal)} stroke={INK} strokeWidth={1.2} />
          <path d={`M${fmt(-18 - turn * 6)},96 C-40,120 -38,170 -14,${190}`} fill="none" stroke="#2B313A" strokeWidth={4} strokeLinecap="round" />
          <path d={`M${fmt(-10 - turn * 6)},98 C-30,126 -26,170 -10,${196}`} fill="none" stroke="#C25B4E" strokeWidth={2.6} strokeLinecap="round" />
          <path d={`M${fmt(16 - turn * 6)},98 C34,130 30,170 12,${192}`} fill="none" stroke="#2B313A" strokeWidth={3.4} strokeLinecap="round" />
          <circle cx={46} cy={172 + postLen} r={3.6} fill="#7CE0A0" />
          <circle cx={46} cy={172 + postLen} r={7} fill="#7CE0A0" opacity={0.25} />
          <rect x={-56} y={166 + postLen} width={30} height={10} rx={2} fill="#1E242C" />
          <path d={`M-74,${196 + postLen} C-110,${200 + postLen} -130,${206 + postLen} -170,${206 + postLen}`} fill="none" stroke="#2B313A" strokeWidth={5} strokeLinecap="round" />
        </g>
      )}
    </g>
  );
};
