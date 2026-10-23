// V2 shield: one rigid, flat, passive lens-array panel (0.74 m x 1.12 m, 14 mm thick, vertical lenticules on the front
// face, two grips on the back) placed in the corridor by its centre, yaw and lift. The optical treatment is confined to
// the projected panel and depends on the viewpoint:
//   - from the lens side, close to the panel's normal (the guard's line): the corridor behind it is redrawn smeared along
//     the lens axis (horizontal in panel space) with a slight magnification, and the person behind is redrawn far more
//     spread and faint: her outline becomes a blurred patch of the corridor;
//   - from the lens side but off-axis: the smear weakens and she shows through, distorted;
//   - from behind (her side): a clear slab; she is in front of it.
// The panel stays perceptible: bevelled rim, edge thickness when oblique, lens ridges, glints from the torch.
import React from 'react';
import {clamp, lerp} from '../lib/math';
import {a3, Basis, d3, fmt, fwdOf, l3, m3, n3, polyD, proj, projPoly, quad, s3, V2, V3, v3} from './p3';

export const SH = {w: 0.74, h: 1.12, th: 0.005, pitch: 0.00185, gripX: 0.2, gripY: [0.3, 0.54] as [number, number]};
export type ShieldState = {c: V3; yaw: number; tilt: number; speed: number};
export const shieldFrame = (s: ShieldState) => {
  const n = fwdOf(s.yaw); // lens side faces this way
  const r = v3(Math.cos(s.yaw), 0, -Math.sin(s.yaw));
  // tilt: rotate up about r (positive leans the top toward n)
  const up = n3(a3(v3(0, Math.cos(s.tilt), 0), m3(n, Math.sin(s.tilt))));
  const nn = n3(a3(m3(n, Math.cos(s.tilt)), v3(0, -Math.sin(s.tilt), 0)));
  return {n: nn, r, up};
};
export const shieldCorners = (s: ShieldState, inset = 0, off = 0) => {
  const {n, r, up} = shieldFrame(s);
  const hw = SH.w / 2 - inset, hh = SH.h / 2 - inset;
  const c = a3(s.c, m3(n, off));
  return [a3(a3(c, m3(r, -hw)), m3(up, -hh)), a3(a3(c, m3(r, hw)), m3(up, -hh)), a3(a3(c, m3(r, hw)), m3(up, hh)), a3(a3(c, m3(r, -hw)), m3(up, hh))];
};
/** world point on the panel from panel-local (u across -0.5..0.5, v up -0.5..0.5, along normal) */
export const onShield = (s: ShieldState, u: number, vv: number, along = 0) => {
  const {n, r, up} = shieldFrame(s);
  return a3(a3(a3(s.c, m3(r, u * SH.w)), m3(up, vv * SH.h)), m3(n, along));
};
export const viewSide = (b: Basis, s: ShieldState) => {
  // vertical lenticules redirect light only across the panel: the alignment that matters is horizontal
  const {n} = shieldFrame(s);
  const tc = s3(b.pos, s.c);
  const toCam = n3(v3(tc.x, 0, tc.z));
  return d3(n3(v3(n.x, 0, n.z)), toCam); // 1: dead on the lens side, 0: edge-on, <0: behind
};

export const Shield3: React.FC<{
  id: string;
  b: Basis;
  s: ShieldState;
  t: number;
  behindScene: React.ReactNode; // what lies behind the panel from this camera (corridor, torch light)
  subject: React.ReactNode; // the person behind the panel (redrawn as spread residual light)
  glint?: number; // torch light falling on the lens face (0..1)
  alignBoost?: number; // extra alignment (for the guard's exact line)
  ridgeK?: number;
}> = ({id, b, s, t, behindScene, subject, glint = 0, alignBoost = 0, ridgeK}) => {
  const {n, r, up} = shieldFrame(s);
  const side = viewSide(b, s);
  const front = projPoly(b, shieldCorners(s, 0, SH.th / 2));
  const backF = projPoly(b, shieldCorners(s, 0, -SH.th / 2));
  if (front.length < 3) return null;
  const cP = proj(b, s.c);
  // projected width / lens axis direction
  const L = proj(b, a3(s.c, m3(r, -SH.w / 2))), R = proj(b, a3(s.c, m3(r, SH.w / 2)));
  const ang = (Math.atan2(R.y - L.y, R.x - L.x) * 180) / Math.PI;
  const wpx = Math.hypot(R.x - L.x, R.y - L.y);
  const align = clamp((side - 0.72) / 0.24 + alignBoost);
  const motion = clamp(s.speed / 1.2);
  const sigma = Math.max(2, wpx * lerp(0.05, 0.2, align));
  const residA = side > 0 ? clamp(lerp(0.62, 0.07, align) + 0.18 * motion) : 0;
  const residSig = Math.max(3, wpx * lerp(0.06, 0.48, align));
  const lensSide = side > 0.02;
  const fr = {x: cP.x - wpx * 2.5 - 50, y: cP.y - wpx * 3 - 50, w: wpx * 5 + 100, h: wpx * 6 + 100};
  const rot = (inner: React.ReactNode, fid: string) => (
    <g transform={`rotate(${fmt(ang)} ${fmt(cP.x)} ${fmt(cP.y)})`}>
      <g filter={`url(#${fid})`}>
        <g transform={`rotate(${fmt(-ang)} ${fmt(cP.x)} ${fmt(cP.y)})`}>{inner}</g>
      </g>
    </g>
  );
  // lens ridges: draw every m-th lenticule so the on-screen spacing stays >= 3 px
  const pitchPx = SH.pitch * wpx / SH.w;
  const m = Math.max(1, Math.ceil(3.2 / Math.max(1e-6, pitchPx)));
  const nR = Math.floor(SH.w / (SH.pitch * m));
  const ridgeA = ridgeK ?? clamp(0.45 + pitchPx * 0.9);
  const ridges: React.ReactNode[] = [];
  if (lensSide && nR < 900) {
    for (let i = 1; i < nR; i++) {
      const u = -0.5 + (i * SH.pitch * m) / SH.w;
      const a = proj(b, onShield(s, u, -0.49, SH.th / 2)), c2 = proj(b, onShield(s, u, 0.49, SH.th / 2));
      ridges.push(<line key={i} x1={fmt(a.x)} y1={fmt(a.y)} x2={fmt(c2.x)} y2={fmt(c2.y)} stroke={i % 2 ? '#FFFFFF' : '#0B2530'} strokeWidth={Math.max(0.6, Math.min(2.4, pitchPx * m * 0.18))} opacity={(i % 2 ? 0.16 : 0.1) * ridgeA} />);
    }
  }
  // torch glint: vertical highlights sliding along the ridges where the beam lands
  const gl = glint > 0.01 && lensSide ? (
    <g style={{mixBlendMode: 'screen'}} opacity={glint}>
      {Array.from({length: 7}, (_, i) => {
        const u = -0.35 + i * 0.1 + 0.04 * Math.sin(t * 3 + i);
        const a = proj(b, onShield(s, u, -0.45, SH.th)), c2 = proj(b, onShield(s, u, 0.45, SH.th));
        return <line key={i} x1={fmt(a.x)} y1={fmt(a.y)} x2={fmt(c2.x)} y2={fmt(c2.y)} stroke="#FFF4D0" strokeWidth={Math.max(1, wpx * 0.012)} opacity={0.35 * (1 - Math.abs(i - 3) / 4)} />;
      })}
    </g>
  ) : null;
  const edgeVis = 1 - Math.abs(side);
  const sideFaces: React.ReactNode[] = [];
  if (edgeVis > 0.05) {
    const cf = shieldCorners(s, 0, SH.th / 2), cb = shieldCorners(s, 0, -SH.th / 2);
    for (let i = 0; i < 4; i++) {
      const q = projPoly(b, [cf[i], cf[(i + 1) % 4], cb[(i + 1) % 4], cb[i]]);
      if (q.length >= 3) sideFaces.push(<path key={i} d={polyD(q)} fill="#9FD9E0" opacity={0.55} stroke="#1E3A44" strokeWidth={1} />);
    }
  }
  const rimW = Math.min(22, Math.max(1.2, wpx * 0.012));
  return (
    <g>
      <defs>
        <clipPath id={`${id}-clip`}>
          <path d={polyD(front)} />
        </clipPath>
        <filter id={`${id}-bg`} filterUnits="userSpaceOnUse" x={fmt(fr.x)} y={fmt(fr.y)} width={fmt(fr.w)} height={fmt(fr.h)} colorInterpolationFilters="sRGB">
          <feGaussianBlur stdDeviation={`${fmt(sigma)} ${fmt(sigma * 0.04)}`} />
        </filter>
        <filter id={`${id}-rs`} filterUnits="userSpaceOnUse" x={fmt(fr.x)} y={fmt(fr.y)} width={fmt(fr.w)} height={fmt(fr.h)} colorInterpolationFilters="sRGB">
          <feGaussianBlur stdDeviation={`${fmt(residSig)} ${fmt(residSig * lerp(0.4, 0.03, align))}`} />
        </filter>
      </defs>
      {sideFaces}
      <g clipPath={`url(#${id}-clip)`}>
        {lensSide ? (
          <>
            {rot(<g transform={`translate(${fmt(cP.x)} ${fmt(cP.y)}) scale(1.1 1) translate(${fmt(-cP.x)} ${fmt(-cP.y)})`}>{behindScene}</g>, `${id}-bg`)}
            {residA > 0.004 && <g opacity={fmt(residA)}>{rot(subject, `${id}-rs`)}</g>}
            <path d={polyD(front)} fill="#CFF3F6" opacity={0.06} />
          </>
        ) : (
          // from behind: a clear slab with a mild smear of what is beyond it
          <>
            {rot(behindScene, `${id}-bg`)}
            <path d={polyD(front)} fill="#CFF3F6" opacity={0.1} />
          </>
        )}
        {ridges}
        {gl}
      </g>
      {/* rim: bevelled edge, catchlight along the top-left */}
      <path d={polyD(front)} fill="none" stroke="#E9FBFF" strokeWidth={rimW * 1.6} opacity={0.75} strokeLinejoin="round" />
      <path d={polyD(front)} fill="none" stroke="#163039" strokeWidth={rimW} opacity={0.9} strokeLinejoin="round" />
      {backF.length >= 3 && edgeVis > 0.3 && <path d={polyD(backF)} fill="none" stroke="#163039" strokeWidth={rimW * 0.7} opacity={0.5} />}
    </g>
  );
};
export const gripWorld = (s: ShieldState, sd: 1 | -1, k = 0.5) => {
  // grips on the back face; sd +1 toward the panel's +r side
  const vv = -0.5 + (SH.gripY[0] + (SH.gripY[1] - SH.gripY[0]) * k) / SH.h;
  return onShield(s, (sd * SH.gripX) / SH.w, vv, -SH.th / 2 - 0.035);
};
export const Grips3: React.FC<{b: Basis; s: ShieldState}> = ({b, s}) => (
  <g>
    {[-1, 1].map((sd) => {
      const a = proj(b, gripWorld(s, sd as 1 | -1, 0)), c = proj(b, gripWorld(s, sd as 1 | -1, 1));
      return <line key={sd} x1={fmt(a.x)} y1={fmt(a.y)} x2={fmt(c.x)} y2={fmt(c.y)} stroke="#20262E" strokeWidth={Math.max(2, 0.03 * a.k)} strokeLinecap="round" />;
    })}
  </g>
);
export {l3, quad};
export type {V2};
