// Close-up hand for the film's hand beats (the slip, the reach, the grip on the lever, the catch, the grip that lets go,
// the hand on glass). Same vector language as the cast (flat skin, ink contour, mitt-like soft fingers) but with four
// fingers and a thumb that curl. Origin at the wrist centre; the hand points along +x at angle `rot`.
//   view 'back'  – dorsal view: curling foreshortens the fingers toward the viewer (slip, glass, reach)
//   view 'side'  – thumb-side profile: fingers curl in the picture plane (grip a bar, clasp a hand)
// Size: palm ≈ 100 units long at s = 1 (a cast hand at about 5× close-up).
import React from 'react';
import {C, BLOOD} from '../theme';
import {blob} from './actor';
import {clamp, lerp, rad, smoothPath, V2} from '../kit/math';

export type HandCUProps = {
  x: number; y: number; rot?: number; s?: number; skin: string; sleeve?: string; cuffTorn?: boolean;
  view?: 'back' | 'side'; side?: 'L' | 'R';
  curl?: number | [number, number, number, number]; thumb?: number; spread?: number;
  blood?: number; scrape?: number; dirt?: number; ink?: number; flatten?: number;
  children?: React.ReactNode; // drawn between palm and fingers (an object held in the grip)
};

const SEG = [[30, 22, 18], [34, 25, 19], [32, 23, 18], [25, 18, 15]]; // finger segment lengths (index..little)
const ROOT_Y = [-27, -9, 9, 26]; // across the knuckles
const W = [17, 18, 17, 14];

export const HandCU: React.FC<HandCUProps> = ({x, y, rot = 0, s = 1, skin, sleeve, cuffTorn, view = 'back', side = 'R', curl = 0.2, thumb = 0.2, spread = 0.3, blood = 0, scrape = 0, dirt = 0, ink = 4, flatten = 0, children}) => {
  const cu = Array.isArray(curl) ? curl : [curl, curl * 1.03, curl * 1.06, curl * 1.1].map((c) => clamp(c));
  const mir = side === 'L' ? -1 : 1; // mirror across the hand axis for the left hand
  const k = s;
  const fingers: React.ReactElement[] = [];
  const palmLen = 92;
  // palm outline (rounded trapezoid, knuckles at x = palmLen)
  const palm: V2[] = [{x: 0, y: -30}, {x: 30, y: -38}, {x: palmLen - 4, y: -36}, {x: palmLen + 6, y: -12}, {x: palmLen + 6, y: 14}, {x: palmLen - 6, y: 36}, {x: 30, y: 36}, {x: 0, y: 30}];
  const order = view === 'side' ? [3, 2, 1, 0] : [0, 1, 2, 3];
  order.forEach((i) => {
    const c = cu[i];
    const fan = (i - 1.5) * spread * 9; // degrees
    let px = palmLen + 2, py = ROOT_Y[i] * (view === 'side' ? 0.28 : 1);
    let ang = rad(fan);
    const pts: V2[] = [{x: px, y: py}];
    SEG[i].forEach((L, j) => {
      const bend = c * [62, 84, 58][j];
      if (view === 'side') {
        ang += rad(bend) * 1; // curl toward the palm side (+y)
        px += Math.cos(ang) * L; py += Math.sin(ang) * L;
      } else {
        // dorsal: the finger points away; curling foreshortens it toward the viewer and drops slightly toward the palm
        const total = rad(bend);
        ang += total;
        px += Math.cos(ang) * L * (view === 'back' ? 1 : 1);
        py += Math.sin(rad(fan)) * L * 0.25;
      }
      pts.push({x: px, y: py});
    });
    let pp = pts;
    if (view === 'back') {
      // foreshorten: project the curled finger onto the hand plane (cos of accumulated bend), keep the knuckle fixed
      let acc = 0, qx = pts[0].x, qy = pts[0].y;
      pp = [{x: qx, y: qy}];
      SEG[i].forEach((L, j) => {
        acc += rad(c * [62, 84, 58][j]);
        const eff = Math.cos(Math.min(acc, Math.PI * 0.95)) * (1 - flatten * 0) ;
        qx += eff * L * Math.cos(rad(fan)); qy += L * Math.sin(rad(fan)) * 0.6 + (acc > Math.PI / 2 ? 0 : 0);
        pp.push({x: qx, y: qy});
      });
    }
    const w = W[i];
    const d = pp.map((q) => `${(q.x * k).toFixed(1)},${(q.y * k * mir).toFixed(1)}`).join(' ');
    fingers.push(
      <g key={`f${i}`}>
        <polyline points={d} fill="none" stroke={C.ink} strokeWidth={(w + ink * 0.5) * k} strokeLinecap="round" strokeLinejoin="round" />
        <polyline points={d} fill="none" stroke={skin} strokeWidth={(w - ink * 1.5) * k} strokeLinecap="round" strokeLinejoin="round" />
        {/* knuckle crease */}
        {view === 'back' && cu[i] > 0.35 && <circle cx={pp[1].x * k} cy={pp[1].y * k * mir} r={2.2 * k} fill={C.ink} opacity={0.35} />}
      </g>,
    );
  });
  // thumb
  const th: V2[] = [{x: 26, y: 28}];
  {
    let a = rad(42 - thumb * 70), px = 26, py = 28;
    [30, 24, 18].forEach((L, j) => {
      a += rad(thumb * [10, 34, 40][j]);
      px += Math.cos(a) * L; py += Math.sin(a) * L * (view === 'side' ? 0.55 : 1);
      th.push({x: px, y: py});
    });
  }
  const thD = th.map((q) => `${(q.x * k).toFixed(1)},${(q.y * k * mir).toFixed(1)}`).join(' ');
  const thumbEl = (
    <g key="thumb">
      <polyline points={thD} fill="none" stroke={C.ink} strokeWidth={(21 + ink * 0.5) * k} strokeLinecap="round" strokeLinejoin="round" />
      <polyline points={thD} fill="none" stroke={skin} strokeWidth={(21 - ink * 1.5) * k} strokeLinecap="round" strokeLinejoin="round" />
    </g>
  );
  const palmD = smoothPath(palm.map((q) => ({x: q.x * k, y: q.y * k * mir})), true, 0.5);
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot})`}>
      {sleeve && (
        <g>
          <path d={`M ${-140 * k} ${-42 * k} L ${4 * k} ${-40 * k} ${cuffTorn ? `L ${10 * k} ${-18 * k} L ${-2 * k} ${-6 * k} L ${12 * k} ${8 * k} L ${0 * k} ${22 * k}` : ''} L ${4 * k} ${40 * k} L ${-140 * k} ${42 * k} Z`} fill={sleeve} stroke={C.ink} strokeWidth={ink} strokeLinejoin="round" />
        </g>
      )}
      {view === 'side' ? thumbEl : null}
      <path d={palmD} fill={skin} stroke={C.ink} strokeWidth={ink} strokeLinejoin="round" />
      {children}
      {fingers}
      {view !== 'side' ? thumbEl : null}
      {scrape > 0 && [0, 1, 2].map((i) => <line key={i} x1={(40 + i * 12) * k} y1={(-20 + i * 9) * k * mir} x2={(62 + i * 12) * k} y2={(-14 + i * 9) * k * mir} stroke={BLOOD.scrape} strokeWidth={3 * k} strokeLinecap="round" opacity={scrape} />)}
      {blood > 0 && <path d={blob(16 * k, 31, 10, 0.5, 1.4, 0.8)} transform={`translate(${58 * k} ${8 * k * mir})`} fill={BLOOD.main} opacity={blood} />}
      {dirt > 0 && <path d={blob(14 * k, 8, 9, 0.5)} transform={`translate(${30 * k} ${-14 * k * mir})`} fill="rgba(60,45,40,0.3)" opacity={dirt} />}
    </g>
  );
};
void lerp;
