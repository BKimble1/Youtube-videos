// The side set: the same fish seen from its left side (head to the left), in the same world as the front set. The
// skin (y = -17) carries the head: jaws, eye, gill cover, fins, scales. Under it, at their own depths, lie what the
// cutaway reveals: the far wall of the mouth (y = +12), the floor with the tongue and its artery (y = 0), the gill
// arches with their red filaments (y = -10). Each plane is parallel to the image, so it is drawn in millimetres under
// one affine transform per plane (correct parallax between planes for every camera position).
import React from 'react';
import {mix, rgba} from './core/color';
import {Basis, proj, V3} from './core/three';
import {roofAt} from './anatomy';
import {IsoPose, isopodItems} from './isopod';
import {clamp, hash, lerp} from './lib';

type Pt = [number, number];
const f2 = (n: number) => n.toFixed(2);
/** closed / open Catmull-Rom paths through [x, z] points (world mm; the plane's transform flips z) */
const crPath = (pts: Pt[], closed: boolean) => {
  const n = pts.length;
  const P = (i: number) => (closed ? pts[(i + n) % n] : pts[Math.max(0, Math.min(n - 1, i))]);
  let d = `M${f2(pts[0][0])},${f2(pts[0][1])}`;
  const last = closed ? n : n - 1;
  for (let i = 0; i < last; i++) {
    const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2);
    d += ` C${f2(p1[0] + (p2[0] - p0[0]) / 6)},${f2(p1[1] + (p2[1] - p0[1]) / 6)} ${f2(p2[0] - (p3[0] - p1[0]) / 6)},${f2(p2[1] - (p3[1] - p1[1]) / 6)} ${f2(p2[0])},${f2(p2[1])}`;
  }
  return closed ? d + ' Z' : d;
};
const poly = (pts: Pt[]) => `M${pts.map((p) => `${f2(p[0])},${f2(p[1])}`).join(' L')} Z`;

/** the affine transform of the plane y = yp (the camera looks along +y) */
const planeT = (B: Basis, yp: number) => {
  const o = proj(B, [0, yp, 0]);
  return {s: o.s, tr: `matrix(${o.s.toFixed(4)},0,0,${(-o.s).toFixed(4)},${o.x.toFixed(2)},${o.y.toFixed(2)})`, ok: o.z > 1};
};

export const SKIN_Y = -17;
export type SideState = {
  B: Basis;
  t: number;
  g: number;
  cut: number; // cutaway (0 skin opaque .. 1 open)
  flare: number; // gill cover flared open (shows the filaments in the gap)
  shrink: number; // tongue size (1 healthy .. ~0.2 a stub)
  flowOn: number; // blood flow in the tongue's artery
  draw: number; // blood drawn up into the parasite at the bite
  biteX: number;
  pale: number; // the tongue blanching
  inside: IsoPose[]; // parasites drawn under the skin
  outside: IsoPose[]; // in the water, over the skin
  fkey: string;
};

// ---------------------------------------------------------------- shapes (mm)
const headOutline = (R: number): Pt[] => [
  [-5.5, R + 1], [-4.6, R + 3.6], [-1.2, R + 6.2], [4, R + 8.6], [10, 39.5], [18, 47], [30, 57], [45, 66], [62, 74], [85, 80], [120, 84], [175, 86],
  [175, -54], [120, -53], [90, -50], [70, -46], [52, -38.5], [36, -28.5], [22, -18.5], [10, -10], [2, -5.6], [-3, -3.1], [-4.6, -1.2],
  // the gape: lower jaw's inner edge back to the corner of the mouth, then the upper jaw's inner edge forward
  [2, -0.3], [10, 2.6], [17, 9], [10, R - 6.5], [2, R - 1.8],
];
const CUT: Pt[] = [[1, -2.5], [4, 6], [12, 19], [25, 33], [43, 46], [60, 47], [72, 27], [75, 0], [67, -27], [50, -37], [30, -27], [16, -15], [6, -6], [1, -4]];
const CUTX: Pt[] = [[1, 4], [9, 23], [24, 37], [43, 51], [62, 51], [77, 28], [80, 0], [71, -30], [51, -42], [28, -31], [12, -18], [1, -6]];
const OPER: Pt[] = [[54, 51], [65, 41], [72.5, 23], [73.8, 5], [70, -12], [62, -28], [52, -37.5]];
const PREOP: Pt[] = [[31, 47], [33, 26], [34, 6], [37, -12], [47, -25]];
export const EYE: Pt = [21, 41];
const tongueTop = (x: number, shrink: number) => {
  const xt = 27 - 24 * shrink, h = 5.2 * (0.35 + 0.65 * shrink);
  if (x < xt || x > 27) return 0;
  const u = (x - xt) / (27 - xt);
  return h * Math.pow(Math.sin(Math.PI * Math.min(1, u * 1.9) / 2), 0.6) * (1 - 0.9 * Math.pow(u, 3));
};
export const tongueSurfaceZ = tongueTop;

export const SideSet: React.FC<{s: SideState}> = ({s}) => {
  const {B, t} = s;
  const R = roofAt(s.g);
  const key = s.fkey;
  const skin = planeT(B, SKIN_Y), farW = planeT(B, 12), mid = planeT(B, 0), arch = planeT(B, -10), gap = planeT(B, SKIN_Y - 0.4);
  const breathe = Math.sin((2 * Math.PI * t) / 1.5);

  // ---------------- far wall of the mouth and the throat (seen through the gape and the cutaway)
  const cavity: Pt[] = [[-3, R], [12, R * 1.0], [26, R * 0.92], [38, R * 0.8], [47, R * 0.66], [53, 12], [54, 5], [46, 2.4], [36, 0.6], [22, -0.8], [8, -0.6], [-3, 0.2]];
  const far = (
    <g transform={farW.tr}>
      <defs>
        <linearGradient id={`${key}fw`} gradientUnits="userSpaceOnUse" x1="-3" y1="0" x2="54" y2="0">
          <stop offset="0" stopColor="#B65C57" />
          <stop offset="0.45" stopColor="#7A2A2D" />
          <stop offset="1" stopColor="#2A080B" />
        </linearGradient>
        <radialGradient id={`${key}es`} gradientUnits="userSpaceOnUse" cx="50" cy="8" r="7">
          <stop offset="0" stopColor="#050102" />
          <stop offset="1" stopColor="#050102" stopOpacity={0} />
        </radialGradient>
      </defs>
      <filter id={`${key}dof`} x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="0.45" /></filter>
      <g filter={`url(#${key}dof)`}>
      <path d={crPath(cavity, true)} fill={`url(#${key}fw)`} />
      {/* folds of the palate and the cheek wall */}
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <path key={i} d={crPath([[2 + i * 6, R * 0.95 - i * 0.6], [5 + i * 6, R * 0.6], [3 + i * 6.5, R * 0.25]], false)} fill="none" stroke="#5A1A1E" strokeWidth={0.5} opacity={0.15 * (1 - i / 7)} />
      ))}
      <ellipse cx={50} cy={8} rx={6} ry={7} fill={`url(#${key}es)`} />
      <radialGradient id={`${key}gl`} gradientUnits="userSpaceOnUse" cx="0" cy={R * 0.6} r="30">
        <stop offset="0" stopColor="#F6C2B4" stopOpacity={0.35} />
        <stop offset="1" stopColor="#F6C2B4" stopOpacity={0} />
      </radialGradient>
      <path d={crPath(cavity, true)} fill={`url(#${key}gl)`} />
      {Array.from({length: 50}, (_, i) => {
        const x = lerp(-2, 44, hash(i * 3.3)), z = lerp(1, R * 0.9, hash(i * 7.1));
        return <ellipse key={`s${i}`} cx={f2(x)} cy={f2(z)} rx={f2(0.2 + 0.25 * hash(i))} ry={f2(0.15 + 0.15 * hash(i + 2))} fill={hash(i * 1.7) > 0.5 ? '#E9B2A8' : '#4A1216'} opacity={0.3 * (1 - x / 50)} />;
      })}
      </g>
    </g>
  );
  // ---------------- the flesh of the head inside the cutaway window (muscle, around the mouth cavity)
  const flesh = (
    <g transform={planeT(B, -4).tr}>
      <defs>
        <linearGradient id={`${key}ms`} gradientUnits="userSpaceOnUse" x1="0" y1="50" x2="0" y2="-40">
          <stop offset="0" stopColor="#B4524E" />
          <stop offset="0.5" stopColor="#C97670" />
          <stop offset="1" stopColor="#B0605A" />
        </linearGradient>
      </defs>
      <path d={crPath(headOutline(R), true)} fill={`url(#${key}ms)`} stroke="#B4524E" strokeWidth={3} />
      {Array.from({length: 9}, (_, i) => (
        <path key={i} d={crPath([[10 + i * 7, 46 - i * 0.5], [16 + i * 7, 20], [12 + i * 7.5, -6], [18 + i * 7, -30]], false)} fill="none" stroke="#8E3A3A" strokeWidth={0.35} opacity={0.3} />
      ))}
    </g>
  );

  // ---------------- gill chamber and arches (near side, under the gill cover)
  const chamber: Pt[] = [[27, 33], [44, 45], [59, 45], [70, 25], [71.5, 2], [68, -14], [60, -30], [46, -31], [32, -22], [27, -6]];
  const archEls: React.ReactNode[] = [];
  for (let k = 0; k < 4; k++) {
    const a0: Pt = [33 + 6 * k, -23 + 3 * k], ang: Pt = [51 + 5 * k, 3], a1: Pt = [45 + 5 * k, 31 - 3 * k];
    const pts: Pt[] = [];
    const N = 34;
    for (let i = 0; i <= N; i++) {
      const u = i / N;
      // quadratic through the angle (posterior bend)
      const p = u < 0.62 ? lerpP(a0, ang, u / 0.62) : lerpP(ang, a1, (u - 0.62) / 0.38);
      const bow = Math.sin(Math.PI * (u < 0.62 ? u / 0.62 : (u - 0.62) / 0.38)) * 2.2;
      pts.push([p[0] + bow, p[1]]);
    }
    // filaments: red, pointing back and out from the arch, swaying with the breathing
    const fil: React.ReactNode[] = [];
    for (let i = 1; i < N; i++) {
      const [x, z] = pts[i];
      const [xa, za] = pts[i - 1], [xb, zb] = pts[i + 1];
      let nx = zb - za, nz = -(xb - xa);
      const nl = Math.hypot(nx, nz) || 1;
      nx /= nl; nz /= nl;
      if (nx < 0) { nx = -nx; nz = -nz; }
      const len = 5.5 + 2 * hash(i + k * 40) - 1.5 * Math.abs(i / N - 0.6);
      const sw = 0.12 * Math.sin((2 * Math.PI * t) / 1.5 + i * 0.25 + k);
      const ex = x + (nx * Math.cos(sw) - nz * Math.sin(sw)) * len, ez = z + (nz * Math.cos(sw) + nx * Math.sin(sw)) * len;
      for (let q = -2; q <= 2; q++) {
        const ll = 0.85 + 0.15 * hash(i * 7 + q);
        fil.push(<path key={`${i}_${q}`} d={`M${f2(x + q * 0.18)},${f2(z + q * 0.05)} L${f2(x + (ex - x) * ll + q * 0.42)},${f2(z + (ez - z) * ll)}`} stroke={mix('#D8434B', '#8E1A22', hash(i * 3 + q + k * 11))} strokeWidth={0.26} strokeLinecap="round" />);
      }
    }
    const rakers: React.ReactNode[] = [];
    for (let i = 2; i < N - 1; i += 2) {
      const [x, z] = pts[i];
      rakers.push(<path key={i} d={`M${f2(x - 0.4)},${f2(z)} L${f2(x - 1.7)},${f2(z + 0.4)}`} stroke="#DDB9AE" strokeWidth={0.28} strokeLinecap="round" opacity={0.8} />);
    }
    archEls.push(
      <g key={k}>
        {fil}
        <path d={crPath(pts, false)} fill="none" stroke="#7E3E3C" strokeWidth={1.5} strokeLinecap="round" />
        <path d={crPath(pts, false)} fill="none" stroke="#D7A79C" strokeWidth={1.0} strokeLinecap="round" />
        <path d={crPath(pts.map(([x, z]) => [x - 0.25, z + 0.1] as Pt), false)} fill="none" stroke="#F2D6CC" strokeWidth={0.3} strokeLinecap="round" opacity={0.7} />
        {rakers}
      </g>,
    );
  }
  const gills = (
    <g transform={arch.tr}>
      <radialGradient id={`${key}gc`} gradientUnits="userSpaceOnUse" cx="50" cy="6" r="34">
        <stop offset="0" stopColor="#4E1418" />
        <stop offset="1" stopColor="#7A2A2C" />
      </radialGradient>
      <filter id={`${key}gb`} x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="1.2" /></filter>
      <path d={crPath(chamber, true)} fill={`url(#${key}gc)`} filter={`url(#${key}gb)`} />
      {archEls}
    </g>
  );

  // ---------------- floor of the mouth, tongue, artery (midline, y = 0)
  const sh = s.shrink;
  const xt = 27 - 24 * sh;
  const tPts: Pt[] = [];
  for (let i = 0; i <= 24; i++) {
    const x = lerp(xt, 27, i / 24);
    tPts.push([x, tongueTop(x, sh) + 0.1]);
  }
  const tongueShape: Pt[] = [...tPts, [27.5, -0.6], [xt + 1, -0.9], [xt - 0.3, -0.2]];
  const tongueCol = mix(mix('#D98A80', '#C89A92', s.pale), '#B9A39C', s.pale * 0.6);
  const art: Pt[] = [];
  for (let i = 0; i <= 16; i++) {
    const x = lerp(27.5, xt + 1.2, i / 16);
    art.push([x, Math.max(0.6, tongueTop(x, sh) * 0.48)]);
  }
  const flowEls: React.ReactNode[] = [];
  const pulse = 0.5 + 0.5 * Math.cos((2 * Math.PI * t) / 0.75);
  if (s.flowOn > 0.02) {
    for (let i = 0; i < 12; i++) {
      const u = ((i / 12 + (t * 0.55) / (0.5 + 0.5 * s.flowOn)) % 1 + 1) % 1;
      const p = alongP(art, u);
      flowEls.push(<ellipse key={i} cx={f2(p[0])} cy={f2(p[1])} rx={0.32} ry={0.15} fill="#FF6A6E" opacity={(0.35 + 0.35 * pulse) * s.flowOn} />);
    }
  }
  // the bite: blood drawn up from the artery into the parasite's mouth
  const drawEls: React.ReactNode[] = [];
  if (s.draw > 0.02) {
    const bx = s.biteX;
    const z0 = Math.max(0.6, tongueTop(bx, sh) * 0.48), z1 = tongueTop(bx, sh) + 0.5;
    drawEls.push(<path key="ch" d={`M${f2(bx + 0.4)},${f2(z0)} Q${f2(bx + 0.7)},${f2((z0 + z1) / 2)} ${f2(bx + 0.2)},${f2(z1)}`} fill="none" stroke="#B3121E" strokeWidth={0.22} opacity={0.75 * s.draw} />);
    for (let i = 0; i < 6; i++) {
      const u = ((i / 6 + t * 1.2) % 1 + 1) % 1;
      drawEls.push(<circle key={i} cx={f2(bx + 0.4 + 0.3 * Math.sin(u * Math.PI))} cy={f2(lerp(z0, z1, u))} r={0.13} fill="#FF4A50" opacity={0.9 * s.draw * Math.sin(Math.PI * u)} />);
    }
    // a small dark wound where the claws and mouthparts went in
    drawEls.push(<ellipse key="w" cx={f2(bx)} cy={f2(z1 - 0.35)} rx={0.9} ry={0.35} fill="#7A0F18" opacity={0.6 * s.draw} />);
  }
  const floor = (
    <g transform={mid.tr}>
      <defs>
        <linearGradient id={`${key}tg`} gradientUnits="userSpaceOnUse" x1="0" y1="6" x2="0" y2="-1">
          <stop offset="0" stopColor={mix(tongueCol, '#FFFFFF', 0.2)} />
          <stop offset="0.5" stopColor={tongueCol} />
          <stop offset="1" stopColor={mix(tongueCol, '#5A1A1E', 0.4)} />
        </linearGradient>
        <linearGradient id={`${key}fl`} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="-16">
          <stop offset="0" stopColor="#C77A72" />
          <stop offset="1" stopColor="#8E3E3E" />
        </linearGradient>
      </defs>
      {/* the flesh under the floor and the lower jaw bone */}
      <path d={crPath([[-4.5, 0.2], [10, -0.7], [24, -0.7], [38, 0.7], [47, 2.4], [52, -10], [40, -24], [22, -17], [8, -9.5], [-3, -3]], true)} fill={`url(#${key}fl)`} />
      <path d={crPath([[-4, -2.2], [8, -5.2], [22, -10], [30, -13.5]], false)} fill="none" stroke="#E6C9BD" strokeWidth={1.0} strokeLinecap="round" opacity={0.35} />
      {Array.from({length: 14}, (_, i) => (
        <path key={i} d={crPath([[2 + i * 3, -1.4], [4 + i * 3, -6 - 2 * hash(i)], [3 + i * 3.2, -11 - 2 * hash(i + 3)]], false)} fill="none" stroke="#A85550" strokeWidth={0.22} opacity={0.4} />
      ))}
      {/* the tongue */}
      <path d={crPath(tongueShape, true)} fill={`url(#${key}tg)`} stroke={mix('#8E3E3E', '#7E6A66', s.pale)} strokeWidth={0.18} />
      {/* papillae on its surface */}
      {Array.from({length: 26}, (_, i) => {
        const x = lerp(xt + 0.6, 26.5, hash(i * 4.4));
        const z = tongueTop(x, sh) - 0.25 - 1.2 * hash(i * 2.9);
        if (z < 0.3) return null;
        return <circle key={`p${i}`} cx={f2(x)} cy={f2(z)} r={0.16} fill={hash(i) > 0.5 ? '#F2C3B8' : '#A85A55'} opacity={0.5} />;
      })}
      {/* wrinkles as it withers */}
      {s.pale > 0.05 && [0.25, 0.45, 0.65].map((u, i) => {
        const x = lerp(xt, 27, u);
        const z = tongueTop(x, sh);
        return <path key={`wr${i}`} d={`M${f2(x - 0.3)},${f2(z)} Q${f2(x + 0.3)},${f2(z * 0.6)} ${f2(x)},${f2(z * 0.2)}`} fill="none" stroke="#7E5A55" strokeWidth={0.2} opacity={0.6 * s.pale} />;
      })}
      {/* the artery inside (seen through the translucent tissue) */}
      <filter id={`${key}tb`} x="-10%" y="-50%" width="120%" height="200%"><feGaussianBlur stdDeviation="0.12" /></filter>
      <g filter={`url(#${key}tb)`} clipPath={`url(#${key}tcl)`}>
        <clipPath id={`${key}tcl`}><path d={crPath(tongueShape, true)} /></clipPath>
        <path d={crPath(art, false)} fill="none" stroke="#8A1420" strokeWidth={lerp(0.35, 0.8, sh) * (0.5 + 0.5 * s.flowOn)} strokeLinecap="round" opacity={0.5 + 0.3 * s.flowOn} />
        <path d={crPath(art, false)} fill="none" stroke="#D3313B" strokeWidth={lerp(0.15, 0.4, sh) * (0.5 + 0.5 * s.flowOn) * (0.8 + 0.2 * pulse)} strokeLinecap="round" opacity={0.65 * s.flowOn} />
        {flowEls}
      </g>
      {drawEls}
    </g>
  );

  // ---------------- parasites under the skin (3D, the same model as the front view)
  const light: V3 = [-0.3, -0.35, 1];
  const isoEls = (list: IsoPose[], k: string) =>
    list.map((p, i) => (
      <g key={`${k}${i}`}>
        {isopodItems(B, p, light)
          .sort((a, b) => b.z - a.z)
          .map((it, j) => <React.Fragment key={j}>{it.el}</React.Fragment>)}
      </g>
    ));

  // ---------------- the skin
  const outline = headOutline(R);
  const cutLvl = Math.round(255 * (1 - 0.95 * s.cut));
  const scales: React.ReactNode[] = [];
  for (let zi = -48; zi <= 82; zi += 3.6) {
    for (let xi = 24; xi <= 175; xi += 4.2) {
      const xx = xi + ((Math.round(zi / 3.6) % 2) * 2.1);
      if (xx < 30 && zi > 20) continue;
      scales.push(<path key={`${xi}_${zi}`} d={`M${f2(xx - 2)},${f2(zi + 0.6)} Q${f2(xx)},${f2(zi - 1.8)} ${f2(xx + 2)},${f2(zi + 0.6)}`} fill="none" stroke="#5A1A1E" strokeWidth={0.22} opacity={0.22} />);
    }
  }
  const finBeat = Math.sin((2 * Math.PI * t) / 2);
  const skinEl = (
    <g transform={skin.tr}>
      <defs>
        <linearGradient id={`${key}sk`} gradientUnits="userSpaceOnUse" x1="0" y1="86" x2="0" y2="-54">
          <stop offset="0" stopColor="#A53639" />
          <stop offset="0.3" stopColor="#C85A50" />
          <stop offset="0.55" stopColor="#DC8775" />
          <stop offset="0.78" stopColor="#ECC6B7" />
          <stop offset="1" stopColor="#F3E4DB" />
        </linearGradient>
        <radialGradient id={`${key}ck`} gradientUnits="userSpaceOnUse" cx="30" cy="12" r="30">
          <stop offset="0" stopColor="#F2B9A6" stopOpacity={0.45} />
          <stop offset="1" stopColor="#F2B9A6" stopOpacity={0} />
        </radialGradient>
        <filter id={`${key}mb`} x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="1.8" /></filter>
        <mask id={`${key}cm`} maskUnits="userSpaceOnUse" x="-50" y="-80" width="260" height="200">
          <rect x={-50} y={-80} width={260} height={200} fill="#FFFFFF" />
          {s.cut > 0.005 && <path d={crPath(CUT, true)} fill={`rgb(${cutLvl},${cutLvl},${cutLvl})`} filter={`url(#${key}mb)`} />}
        </mask>
        <clipPath id={`${key}hc`}><path d={crPath(outline, true)} /></clipPath>
      </defs>
      <g mask={`url(#${key}cm)`}>
        {/* dorsal fin spines and membrane */}
        <path d={crPath([[78, 79], [84, 96], [92, 101], [102, 103], [114, 102], [126, 99], [140, 94], [150, 86]], false) + ' L150,84 L78,79 Z'} fill={rgba('#D06A60', 0.3)} />
        {[0, 1, 2, 3, 4, 5, 6].map((i) => <path key={`ds${i}`} d={`M${78 + i * 10},${80 + i * 0.6} L${84 + i * 10},${97 + 3 * Math.sin(i * 1.3)}`} stroke="#A2423F" strokeWidth={0.8} strokeLinecap="round" />)}
        <path d={crPath(outline, true)} fill={`url(#${key}sk)`} />
        <g clipPath={`url(#${key}hc)`}>
          <path d={crPath(outline, true)} fill={`url(#${key}ck)`} />
          {scales}
          {/* lateral line */}
          <path d={crPath([[66, 56], [90, 62], [130, 66], [175, 66]], false)} fill="none" stroke="#7E2A2E" strokeWidth={0.45} opacity={0.4} />
          {/* gill cover: a slightly darker plate behind the preopercle, with its soft membrane edge */}
          <path d={crPath([...PREOP, [52, -37.5], ...OPER.slice().reverse()], true)} fill="#A9403F" opacity={0.18} />
          <path d={crPath(PREOP, false)} fill="none" stroke="#7E2A2E" strokeWidth={0.6} opacity={0.5} />
          {/* the jaws: maxilla plate, lower jaw line */}
          <path d={crPath([[-2.5, R - 0.5], [8, R - 4], [18.5, 10.8], [20.5, 14.5], [10, R - 1], [0.5, R + 2.4]], true)} fill="#D9877A" stroke="#8E3436" strokeWidth={0.5} opacity={0.95} />
          <path d={crPath([[-4, -2], [8, -5.5], [20, -9.5], [26, -9]], false)} fill="none" stroke="#9C5A55" strokeWidth={0.5} opacity={0.5} />
          {/* nostrils */}
          <ellipse cx={9.5} cy={37} rx={0.9} ry={0.6} fill="#5A1A1E" opacity={0.7} />
          <ellipse cx={13} cy={38.6} rx={0.8} ry={0.55} fill="#5A1A1E" opacity={0.6} />
        </g>
  {/* teeth along the jaw edges */}
        {Array.from({length: 13}, (_, i) => {
          const u = (i + 0.5) / 13;
          const up = lerpP([-4.5, R + 0.4], [14, 11.5], u), lo = lerpP([-3.8, -0.8], [14, 6.5], u);
          const big = i === 1;
          return (
            <g key={`t${i}`} opacity={1 - s.cut}>
              <path d={`M${f2(up[0] - 0.35)},${f2(up[1])} L${f2(up[0] + 0.1)},${f2(up[1] - (big ? 1.8 : 0.8))} L${f2(up[0] + 0.35)},${f2(up[1])} Z`} fill="#E9DDCC" opacity={0.9} />
              <path d={`M${f2(lo[0] - 0.4)},${f2(lo[1])} L${f2(lo[0] + 0.1)},${f2(lo[1] + 0.9)} L${f2(lo[0] + 0.4)},${f2(lo[1])} Z`} fill="#E9DDCC" opacity={0.9} />
            </g>
          );
        })}
        {/* lips */}
        <path d={crPath([[17, 9], [10, R - 6.5], [2, R - 1.8], [-5.5, R + 1]], false)} fill="none" stroke="#B4504B" strokeWidth={1.1} strokeLinecap="round" />
        <path d={crPath([[-4.6, -1.2], [2, -0.3], [10, 2.6], [17, 9]], false)} fill="none" stroke="#B4504B" strokeWidth={0.9} strokeLinecap="round" />
        {/* the eye */}
        <circle cx={EYE[0]} cy={EYE[1]} r={10.6} fill="#8E3433" />
        <circle cx={EYE[0]} cy={EYE[1]} r={8.6} fill="#B37A3C" />
        <circle cx={EYE[0]} cy={EYE[1]} r={8.6} fill={`url(#${key}ir)`} />
        <radialGradient id={`${key}ir`} gradientUnits="userSpaceOnUse" cx={EYE[0]} cy={EYE[1]} r={8.6}>
          <stop offset="0.55" stopColor="#3A1A0E" stopOpacity={0} />
          <stop offset="0.85" stopColor="#E0A85A" stopOpacity={0.6} />
          <stop offset="1" stopColor="#5A2418" stopOpacity={0.9} />
        </radialGradient>
        <circle cx={EYE[0] - 0.3} cy={EYE[1]} r={5.2} fill="#0B0707" />
        <ellipse cx={EYE[0] - 2.2} cy={EYE[1] + 2.6} rx={1.6} ry={0.9} fill="#FFFFFF" opacity={0.6} />
        {/* the gill cover's free edge */}
        <path d={crPath(OPER, false)} fill="none" stroke="#6E2226" strokeWidth={0.8} opacity={0.75} />
        <path d={crPath(OPER.map(([x, z]) => [x - 1.2, z] as Pt), false)} fill="none" stroke="#E7A592" strokeWidth={0.5} opacity={0.4} />
        {/* pectoral fin (near side), fanning */}
        <path d={crPath([[77, -11], [96, -2 + 2 * finBeat], [111, -9 + 3 * finBeat], [104, -20], [82, -17.5]], true)} fill={rgba('#F2A898', 0.42)} stroke={rgba('#C26A60', 0.55)} strokeWidth={0.4} />
        {[0, 1, 2, 3, 4, 5].map((i) => <path key={`fr${i}`} d={`M78,-13 L${96 + i * 2.6},${-3 - i * 3 + (2.5 - i * 0.3) * finBeat}`} stroke={rgba('#C26A60', 0.4)} strokeWidth={0.3} />)}
      </g>
      {/* the ghost of the skin over the cutaway: outlines of the gill cover and jaw, so the window reads in place */}
      {s.cut > 0.01 && (
        <g opacity={0.5 * s.cut}>
          <path d={crPath(OPER, false)} fill="none" stroke="#F3D2C6" strokeWidth={0.45} strokeDasharray="0" />
          <path d={crPath(PREOP, false)} fill="none" stroke="#F3D2C6" strokeWidth={0.3} />
          <circle cx={EYE[0]} cy={EYE[1]} r={10.6} fill="none" stroke="#F3D2C6" strokeWidth={0.3} opacity={0.4} />
        </g>
      )}
    </g>
  );
  // the gap behind the flared gill cover: dark, with filaments
  const gapShape = crPath([...OPER, ...OPER.slice().reverse().map(([x, z]) => [x + 0.5 + 4.8 * s.flare * Math.sin(Math.PI * clamp((z + 38) / 90)), z] as Pt)], true);
  const gapEl = s.flare > 0.01 && (
    <g transform={gap.tr}>
      <clipPath id={`${key}gp`}><path d={gapShape} /></clipPath>
      <path d={gapShape} fill="#4A0E14" />
      <path d={gapShape} fill="none" stroke="#9E2630" strokeWidth={0.25} opacity={0.6} />
      <g clipPath={`url(#${key}gp)`} opacity={clamp((s.flare - 0.35) * 4)}>
      {Array.from({length: 46}, (_, i) => {
        const u = (i + 0.5) / 46;
        const p = alongP(OPER, u);
        const w = 0.6 + 4.6 * s.flare * Math.sin(Math.PI * clamp((p[1] + 38) / 90));
        const sw = 0.4 * Math.sin((2 * Math.PI * t) / 1.5 + i * 0.4);
        return [0, 1, 2].map((q) => <path key={`${i}_${q}`} d={`M${f2(p[0] - 1.5)},${f2(p[1] + q * 0.6)} L${f2(p[0] + w * 1.1)},${f2(p[1] + sw + q * 0.6)}`} stroke={mix('#D2404A', '#86191F', hash(i * 2.3 + q))} strokeWidth={0.4} strokeLinecap="round" />);
      })}
      </g>
    </g>
  );

  return (
    <g>
      {flesh}
      {far}
      {floor}
      {isoEls(s.inside.filter((p) => p.o[1] > -6), 'in')}
      {gills}
      {isoEls(s.inside.filter((p) => p.o[1] <= -6), 'ia')}
      {skinEl}
      {gapEl}
      {isoEls(s.outside, 'out')}
    </g>
  );
};

function lerpP(a: Pt, b: Pt, u: number): Pt {
  return [lerp(a[0], b[0], u), lerp(a[1], b[1], u)];
}
/** a point at fraction u of the length of a polyline */
function alongP(pts: Pt[], u: number): Pt {
  const seg: number[] = [];
  let tot = 0;
  for (let i = 0; i < pts.length - 1; i++) {
    const l = Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]);
    seg.push(l);
    tot += l;
  }
  let d = clamp(u) * tot;
  for (let i = 0; i < seg.length; i++) {
    if (d <= seg[i]) return lerpP(pts[i], pts[i + 1], d / (seg[i] || 1));
    d -= seg[i];
  }
  return pts[pts.length - 1];
}
