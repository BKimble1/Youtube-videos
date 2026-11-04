// "Wyatt had bone cancer." The ball's round silhouette becomes the round field of a knee scan (a straight-on, frontal
// view of his right knee) on a clinic monitor. The lens pulls back to the monitor and the room, and the diseased
// section reveals itself inside the lower end of the thigh bone (mottled, spiculed bone, tinted from within).
// Screen-space drawing: the scan is laid out in its own units round the field's centre (field radius 330).
import React from 'react';
import {W, H} from '../camera';
import {fmt} from '../dc/math';
import {clamp, ss, ss5, lerp, hash} from '../lib';
import {INK} from '../dc/ink';
import {C} from '../art/pal';
import {T} from './story2';

const F = 330;
const pathOf = (pts: [number, number][]) => {
  let d = `M${fmt(pts[0][0])},${fmt(pts[0][1])}`;
  const n = pts.length;
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
    d += `C${fmt(p1[0] + (p2[0] - p0[0]) / 6)},${fmt(p1[1] + (p2[1] - p0[1]) / 6)} ${fmt(p2[0] - (p3[0] - p1[0]) / 6)},${fmt(p2[1] - (p3[1] - p1[1]) / 6)} ${fmt(p2[0])},${fmt(p2[1])}`;
  }
  return d + 'Z';
};
// frontal right knee, viewer's left = his outer (lateral) side
export const FEMUR: [number, number][] = [[-38, -420], [-30, -160], [-62, -96], [-104, -48], [-112, -14], [-86, 2], [-40, -6], [-8, -20], [24, -6], [70, 4], [104, -14], [100, -52], [62, -100], [34, -160], [40, -420]];
export const TIBIA: [number, number][] = [[-100, 22], [-40, 14], [0, 24], [44, 14], [100, 24], [96, 56], [46, 108], [40, 420], [-34, 420], [-42, 108], [-92, 60]];
const FIBULA: [number, number][] = [[-128, 58], [-104, 50], [-98, 82], [-108, 110], [-106, 420], [-126, 420], [-122, 110], [-134, 84]];
const SOFT: [number, number][] = [[-190, -420], [-182, -120], [-176, 20], [-166, 140], [-150, 420], [150, 420], [158, 140], [176, 20], [182, -120], [186, -420]];

export const ScanImage: React.FC<{k: string; tumor: number; r?: number}> = ({k, tumor, r = F}) => {
  const pulse = 0.85 + 0.15 * Math.sin(tumor * 7);
  const blots = Array.from({length: 26}, (_, i) => ({x: -54 + hash(i * 3.3) * 104, y: -150 + hash(i * 7.1) * 128, r: 6 + hash(i * 1.9) * 15}));
  return (
    <g>
      <defs>
        <clipPath id={`${k}fc`}><circle cx={0} cy={0} r={r} /></clipPath>
        <clipPath id={`${k}fem`}><path d={pathOf(FEMUR)} /></clipPath>
        <linearGradient id={`${k}bn`} x1="0" x2="1">
          <stop offset="0" stopColor="#F2F6F9" /><stop offset="0.22" stopColor="#C9D6DF" /><stop offset="0.5" stopColor="#A9BBC8" /><stop offset="0.78" stopColor="#C9D6DF" /><stop offset="1" stopColor="#F2F6F9" />
        </linearGradient>
        <radialGradient id={`${k}tg`}>
          <stop offset="0" stopColor={C.tumorGlow} stopOpacity={0.95} /><stop offset="0.6" stopColor={C.tumor} stopOpacity={0.7} /><stop offset="1" stopColor={C.tumor} stopOpacity={0} />
        </radialGradient>
      </defs>
      <g clipPath={`url(#${k}fc)`}>
        <rect x={-r} y={-r} width={2 * r} height={2 * r} fill="#08121A" />
        <path d={pathOf(SOFT)} fill="#22323F" />
        <path d={pathOf(FIBULA)} fill={`url(#${k}bn)`} opacity={0.85} />
        <path d={pathOf(TIBIA)} fill={`url(#${k}bn)`} />
        <path d={pathOf(FEMUR)} fill={`url(#${k}bn)`} />
        <ellipse cx={-6} cy={-44} rx={54} ry={66} fill="#E9F0F4" opacity={0.28} />
        {/* the diseased section: mottled, moth-eaten bone, then a magenta tint from inside the bone */}
        <g clipPath={`url(#${k}fem)`}>
          {blots.map((b, i) => <circle key={i} cx={fmt(b.x)} cy={fmt(b.y)} r={fmt(b.r)} fill={i % 3 ? '#7C8D9A' : '#E6EDF2'} opacity={0.55} />)}
          <ellipse cx={-4} cy={-88} rx={78} ry={86} fill={`url(#${k}tg)`} opacity={tumor * pulse} />
        </g>
        {Array.from({length: 11}, (_, i) => {
          const a = (-150 + i * 12) * (Math.PI / 180) + Math.PI / 2;
          const x0 = -4 + Math.cos(a) * 64, y0 = -88 + Math.sin(a) * 70, l = 16 + hash(i * 5.5) * 14;
          return <line key={i} x1={fmt(x0)} y1={fmt(y0)} x2={fmt(x0 + Math.cos(a) * l)} y2={fmt(y0 + Math.sin(a) * l)} stroke={tumor > 0.05 ? C.tumorGlow : '#9AAAB6'} strokeWidth={3} opacity={0.35 + 0.5 * tumor} strokeLinecap="round" />;
        })}
      </g>
      <circle cx={0} cy={0} r={r} fill="none" stroke="#3A4652" strokeWidth={10} />
      <circle cx={0} cy={0} r={r + 5} fill="none" stroke={INK} strokeWidth={3} />
    </g>
  );
};

/** the scan's layout scale and centre on screen at time t (1 = the field fills the ball's last circle) */
export const scanView = (t: number) => {
  const back = ss5(t, T.wyatt + 0.04, T.wyatt + 0.62);
  const push = ss5(t, T.cancer + 0.15, T.surgeons + 0.1);
  const s = lerp(lerp(1, 0.8, back), 1.3, push);
  const cy = lerp(0, 120, push), cx = lerp(0, 4, push);
  return {s, cx, cy};
};

export const ScanShot: React.FC<{t: number; k: string; noBack?: boolean}> = ({t, k, noBack}) => {
  const {s, cx, cy} = scanView(t);
  const tumor = ss(t, T.bone - 0.05, T.cancer + 0.15);
  return (
    <svg width={W} height={H} style={{position: 'absolute', left: 0, top: 0}}>
      {!noBack && (
        <g>
          <defs>
            <linearGradient id={`${k}wl`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={C.wall} /><stop offset="1" stopColor={C.wallDeep} /></linearGradient>
          </defs>
          <rect x={0} y={0} width={W} height={H} fill={`url(#${k}wl)`} />
        </g>
      )}
      <g transform={`translate(${W / 2} ${H / 2}) scale(${fmt(s)}) translate(${fmt(cx)} ${fmt(cy)})`}>
        {!noBack && (
          <g>
            {/* the clinic: a monitor on its arm, the desk edge below */}
            <rect x={-60} y={560} width={120} height={300} fill="#8C9AA6" />
            <rect x={-900} y={820} width={1800} height={600} fill="#C9B79A" />
            <rect x={-900} y={820} width={1800} height={22} fill="#A8957A" />
            <rect x={-430} y={-600} width={860} height={1180} rx={34} fill="#2A333D" stroke={INK} strokeWidth={5} />
            <rect x={-396} y={-566} width={792} height={1112} rx={14} fill="#05090D" />
            <circle cx={360} cy={540} r={7} fill="#6FE3A8" />
          </g>
        )}
        <ScanImage k={k} tumor={tumor} />
      </g>
      {void clamp}
    </svg>
  );
};
