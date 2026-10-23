// The laser head on the cart: a compact housing on a post, an exit tube with a dark window. Its local frame (mm) has
// the exit at the origin and +x along the path as it appears on screen. `open` slides the side cover off to show the
// section: the laser module firing up into the scanning mirror (on its galvo), which folds the beam out of the
// exit. The mirror's swing is drawn larger and much slower than the real one (documented in the source notes).
import React from 'react';
import {C, ROOM as R, LIGHT} from './theme2';
import {pp, proj, EXIT, EAR, CART} from './world2';
import {P, Pt, f3, clamp, lerp} from './lib2';

const ex = pp(EXIT), er = pp(EAR);
export const TX_ANG = (Math.atan2(er.y - ex.y, er.x - ex.x) * 180) / Math.PI; // screen angle of the path at the exit
export const TX_K = proj(EXIT).s / 1000; // L0 px per mm at the exit
export const txToL0 = (q: Pt): Pt => {
  const r = (TX_ANG * Math.PI) / 180, c = Math.cos(r), s = Math.sin(r);
  return P(ex.x + TX_K * (q.x * c - q.y * s), ex.y + TX_K * (q.x * s + q.y * c));
};
export const MIRROR = P(-120, 0);
// mirror deflection (deg) about its 45 deg rest angle: slowed swing, turning round on the existing mirror ticks
export const SWEEP0 = 16.06, SWEEP_T = 1.613;
export const mirrorDev = (t: number, on: number) => 6 * on * Math.cos((2 * Math.PI * (t - SWEEP0)) / SWEEP_T);

export const LaserHead: React.FC<{t: number; open: number; sweep: number; id: string}> = ({t, open, sweep, id}) => {
  const dev = mirrorDev(t, sweep);
  const centre = txToL0(P(-150, 40));
  const postBot = P(centre.x, centre.y + (EXIT.y - CART.top) * proj(EXIT).s * 0.95);
  const cover = clamp(open);
  return (
    <g>
      {/* post and clamp to the cart */}
      <line x1={centre.x} y1={centre.y} x2={postBot.x} y2={postBot.y} stroke={C.ink} strokeWidth={TX_K * 46} strokeLinecap="round" />
      <line x1={centre.x} y1={centre.y} x2={postBot.x} y2={postBot.y} stroke={R.metal} strokeWidth={TX_K * 34} strokeLinecap="round" />
      <ellipse cx={postBot.x} cy={postBot.y} rx={TX_K * 70} ry={TX_K * 22} fill={R.metalDeep} stroke={C.ink} strokeWidth={2.5} />
      <g transform={`translate(${f3(ex.x)} ${f3(ex.y)}) rotate(${f3(TX_ANG)}) scale(${f3(TX_K)})`}>
        <defs><clipPath id={`${id}-in`}><rect x={-286} y={-74} width={248} height={218} rx={26} /></clipPath></defs>
        {/* body */}
        <rect x={-300} y={-88} width={276} height={246} rx={34} fill={R.housing} stroke={C.ink} strokeWidth={9} />
        {/* exit tube and window */}
        <rect x={-40} y={-34} width={44} height={68} rx={8} fill={R.housingLight} stroke={C.ink} strokeWidth={8} />
        <rect x={-6} y={-30} width={16} height={60} rx={6} fill="#4A1C22" stroke={C.ink} strokeWidth={6} />
        {/* section (revealed as the cover slides away) */}
        {cover > 0.001 && (
          <g clipPath={`url(#${id}-in)`}>
            <rect x={-300} y={-88} width={276} height={246} fill="#1C2A31" />
            {/* laser module, vertical, firing up */}
            <rect x={-160} y={52} width={80} height={130} rx={12} fill={R.metalDeep} stroke={C.ink} strokeWidth={7} />
            <rect x={-146} y={40} width={52} height={18} rx={4} fill={R.metal} stroke={C.ink} strokeWidth={5} />
            {[80, 110, 140].map((y) => <line key={y} x1={-158} x2={-82} y1={y} y2={y} stroke={R.metal} strokeWidth={5} opacity={0.6} />)}
            {/* beam inside (illustrated, amber dashes) */}
            <line x1={MIRROR.x} y1={40} x2={MIRROR.x} y2={6} stroke={LIGHT.ir} strokeWidth={9} strokeDasharray="16 12" strokeDashoffset={-t * 120} />
            {(() => {
              const out = 2 * dev; // reflected beam turns by twice the mirror deviation
              const r = (out * Math.PI) / 180, L = 130;
              return <line x1={MIRROR.x} y1={0} x2={MIRROR.x + Math.cos(r) * L} y2={Math.sin(r) * L} stroke={LIGHT.ir} strokeWidth={9} strokeDasharray="16 12" strokeDashoffset={-t * 120} />;
            })()}
            {/* galvo motor and the mirror on its shaft */}
            <circle cx={MIRROR.x - 40} cy={-40} r={30} fill={R.metalDeep} stroke={C.ink} strokeWidth={7} />
            <line x1={MIRROR.x - 40} y1={-40} x2={MIRROR.x} y2={0} stroke={R.metal} strokeWidth={10} strokeLinecap="round" />
            <g transform={`translate(${MIRROR.x} ${MIRROR.y}) rotate(${f3(-45 + dev)})`}>
              <rect x={-46} y={-9} width={92} height={18} rx={4} fill={R.metalLight} stroke={C.ink} strokeWidth={6} />
              <rect x={-40} y={-9} width={80} height={6} fill="#FFFFFF" opacity={0.8} />
            </g>
            {/* motion arc showing the swing (slowed) */}
            {sweep > 0.05 && <path d={`M${MIRROR.x + 52 * Math.cos((-50 * Math.PI) / 180)} ${52 * Math.sin((-50 * Math.PI) / 180)} A52 52 0 0 1 ${MIRROR.x + 52 * Math.cos((-30 * Math.PI) / 180)} ${52 * Math.sin((-30 * Math.PI) / 180)}`} fill="none" stroke={C.cream} strokeWidth={5} opacity={0.6 * sweep} strokeLinecap="round" />}
          </g>
        )}
        {/* the side cover: slides down and away off the body */}
        {cover < 0.999 && (
          <g transform={`translate(0 ${f3(lerp(0, 330, cover * cover))})`} opacity={1 - clamp((cover - 0.7) / 0.3)}>
            <rect x={-286} y={-74} width={248} height={218} rx={26} fill={R.housingLight} stroke={C.ink} strokeWidth={6} />
            <path d={`M-262 -50 L-80 -50`} stroke="#4D5761" strokeWidth={8} strokeLinecap="round" />
            {[-262, -62].map((x) => [ -50, 120 ].map((y) => <circle key={`${x}${y}`} cx={x} cy={y} r={7} fill="#596470" stroke={C.ink} strokeWidth={3} />))}
          </g>
        )}
      </g>
    </g>
  );
};
