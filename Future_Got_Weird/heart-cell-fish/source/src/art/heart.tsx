// The human heart, anterior view, in heart-local units (about 330 tall, origin at the base of the ventricles, y down;
// the apex points down and to the viewer's right, as in the body). One drawing serves twice: the painted plastic
// teaching model on the bench (style 'model') and the living, beating heart (style 'live'). Same silhouette, so the
// push into the model can cut to the living heart in place.
//
// The beat: the atria squeeze first, then the ventricles shorten toward the base and narrow (the apex rises), the
// great arteries swell a little as blood is ejected. The surface shows the myocardium's spiralling fibre bands.
import React from 'react';
import {smoothClosed, V2} from '../core/three';
import {mix, shade, lit} from '../dc/color';
import {INK} from '../dc/ink';

const f1 = (n: number) => n.toFixed(1);
type Pt = [number, number];
const V_OUT: Pt[] = [[-62, -38], [-92, -8], [-104, 40], [-92, 92], [-62, 136], [-18, 170], [28, 192], [62, 200], [84, 188], [98, 150], [108, 96], [108, 40], [96, -10], [72, -40], [34, -50], [-18, -50]];
const RA: Pt[] = [[-70, -40], [-112, -30], [-136, -64], [-128, -104], [-98, -118], [-74, -104], [-60, -76]];
const RAUR: Pt[] = [[-74, -104], [-62, -128], [-40, -122], [-34, -98], [-52, -82]];
const LAUR: Pt[] = [[72, -42], [100, -58], [118, -44], [112, -20], [92, -12]];
const SEPTUM: Pt[] = [[22, -48], [16, 10], [22, 70], [36, 130], [58, 196]];
const RCA: Pt[] = [[-56, -44], [-88, -14], [-100, 36], [-92, 84]];
const BAND = (k: number): Pt[] => {
  // spiral fibre bands: from the base on the right ventricle sweeping down toward the apex
  const y0 = -30 + k * 30;
  return [[-100, y0], [-50, y0 + 18 + k * 4], [10, y0 + 40 + k * 6], [70, y0 + 60 + k * 8], [112, y0 + 70 + k * 9]];
};

export type HeartStyle = 'model' | 'live';
const PALS = {
  live: {myo: '#B5303D', myoDeep: '#701524', myoLight: '#E06A70', art: '#C92E3A', vein: '#5A62A6', aorta: '#E3A39B', pulm: '#D88E9A', fat: '#EBC873', ra: '#9E2B3F', svc: '#5F67AE'},
  model: {myo: '#D8454D', myoDeep: '#9C2430', myoLight: '#F28A86', art: '#E63946', vein: '#3F72CF', aorta: '#E5605F', pulm: '#4C86D9', fat: '#F2D27A', ra: '#C63A47', svc: '#3F72CF'},
};
const lerpP = (a: Pt, b: Pt, t: number): Pt => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
const xf = (pts: Pt[], o: Pt, sx: number, sy: number): V2[] => pts.map(([x, y]) => ({x: o[0] + (x - o[0]) * sx, y: o[1] + (y - o[1]) * sy}));
const open = (pts: V2[]) => {
  let d = `M${f1(pts[0].x)},${f1(pts[0].y)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
    d += ` C${f1(p1.x + (p2.x - p0.x) / 6)},${f1(p1.y + (p2.y - p0.y) / 6)} ${f1(p2.x - (p3.x - p1.x) / 6)},${f1(p2.y - (p3.y - p1.y) / 6)} ${f1(p2.x)},${f1(p2.y)}`;
  }
  return d;
};

/** ventricular contraction (0 relaxed .. 1 full systole) and atrial contraction for a beat phase 0..1 */
export const beatAt = (ph: number) => {
  const p = ((ph % 1) + 1) % 1;
  const atr = Math.max(0, Math.sin(Math.PI * Math.min(1, Math.max(0, (p - 0.0) / 0.16))));
  const v = p < 0.14 ? 0 : p < 0.3 ? Math.sin(((p - 0.14) / 0.16) * Math.PI * 0.5) : p < 0.52 ? 1 - 0.15 * ((p - 0.3) / 0.22) : p < 0.7 ? 0.85 * (1 - Math.sin(((p - 0.52) / 0.18) * Math.PI * 0.5)) : 0;
  return {atr, ven: v};
};

/** the left ventricle's free wall, where the close-up lands (heart-local) */
export const LV_WALL: Pt = [72, 80];
export const LV_FIBRE_DEG = 13;
export const Heart: React.FC<{id: string; style: HeartStyle; beat?: {atr: number; ven: number}; ink?: number; detail?: number; gloss?: number; micro?: number}> = ({id, style, beat = {atr: 0, ven: 0}, ink = 3, detail = 1, gloss = 1, micro = 0}) => {
  const C = PALS[style];
  const v = beat.ven, a = beat.atr;
  const base: Pt = [0, -46];
  // ventricles shorten (apex rises) and narrow; a slight twist
  const vs = xf(V_OUT, base, 1 - 0.07 * v, 1 - 0.1 * v).map((p) => ({x: p.x - 4 * v * ((p.y + 46) / 240), y: p.y}));
  const ra = xf(RA, [-98, -74], 1 - 0.1 * a, 1 - 0.08 * a);
  const raur = xf(RAUR, [-60, -104], 1 - 0.12 * a, 1 - 0.12 * a);
  const laur = xf(LAUR, [96, -36], 1 - 0.12 * a, 1 - 0.12 * a);
  const swell = 1 + 0.07 * Math.max(0, v - 0.2);
  const sep = xf(SEPTUM, base, 1 - 0.07 * v, 1 - 0.1 * v);
  const rca = xf(RCA, base, 1 - 0.07 * v, 1 - 0.1 * v);
  const bands = [0, 1, 2, 3, 4, 5].map((k) => xf(BAND(k), base, 1 - 0.07 * v, 1 - 0.1 * v));
  const tube = (d: string, w: number, col: string, key: string) => (
    <g key={key}>
      <path d={d} fill="none" stroke={INK} strokeWidth={w + ink * 2} strokeLinecap="round" />
      <path d={d} fill="none" stroke={col} strokeWidth={w} strokeLinecap="round" />
      <path d={d} fill="none" stroke={lit(col, 0.45)} strokeWidth={w * 0.26} strokeLinecap="round" opacity={0.55} transform={`translate(${f1(-w * 0.18)} ${f1(-w * 0.12)})`} />
    </g>
  );
  const aorta = `M4,-60 C4,-120 8,-160 40,-178 C70,-194 102,-176 108,-140`;
  const pulm = `M-26,-46 C-22,-86 -6,-112 26,-120 C52,-126 80,-118 98,-104`;
  const svc = `M-104,-104 L-104,-220`;
  const vd = smoothClosed(vs);
  const gl = style === 'model' ? 0.75 : 0.45;
  return (
    <g>
      <defs>
        <radialGradient id={`${id}-vg`} gradientUnits="userSpaceOnUse" cx="-30" cy="10" r="210" fx="-50" fy="-10">
          <stop offset="0" stopColor={lit(C.myo, 0.18)} />
          <stop offset="0.6" stopColor={C.myo} />
          <stop offset="1" stopColor={shade(C.myo, 0.5)} />
        </radialGradient>
        <clipPath id={`${id}-vc`}>
          <path d={vd} />
        </clipPath>
      </defs>
      {/* behind: superior vena cava, the aorta's arch and its three branches */}
      {tube(svc, 40 * swell, C.svc, 'svc')}
      {[[30, -186, 22, -250], [56, -190, 58, -252], [80, -180, 96, -240]].map(([x0, y0, x1, y1], i) => tube(`M${x0},${y0} L${x1},${y1}`, 15 * swell, C.aorta, `br${i}`))}
      {tube(aorta, 46 * swell, C.aorta, 'ao')}
      {/* right atrium and auricles */}
      <path d={smoothClosed(ra)} fill={C.ra} stroke={INK} strokeWidth={ink} />
      <path d={smoothClosed(raur)} fill={lit(C.ra, 0.12)} stroke={INK} strokeWidth={ink} />
      <path d={smoothClosed(laur)} fill={lit(C.ra, 0.08)} stroke={INK} strokeWidth={ink} />
      {/* the ventricles */}
      <path d={vd} fill={`url(#${id}-vg)`} />
      <g clipPath={`url(#${id}-vc)`}>
        {detail > 0 && bands.map((b, k) => <path key={k} d={open(b)} fill="none" stroke={shade(C.myo, 0.35)} strokeWidth={style === 'live' ? 7 : 3} opacity={(style === 'live' ? 0.32 : 0.12) * detail} strokeLinecap="round" />)}
        {detail > 0 && bands.map((b, k) => <path key={`l${k}`} d={open(b.map((p) => ({x: p.x, y: p.y + 12})))} fill="none" stroke={lit(C.myo, 0.35)} strokeWidth={style === 'live' ? 3 : 2} opacity={(style === 'live' ? 0.25 : 0.1) * detail} strokeLinecap="round" />)}
        {/* fat along the grooves (live) */}
        {style === 'live' && <path d={open(sep)} fill="none" stroke={C.fat} strokeWidth={22} opacity={0.55} strokeLinecap="round" />}
        {style === 'live' && <path d={open(rca)} fill="none" stroke={C.fat} strokeWidth={20} opacity={0.5} strokeLinecap="round" />}
        {micro > 0 && (
          <g opacity={micro} transform={`translate(0 -46) scale(${f1(1 - 0.07 * v)} ${(1 - 0.1 * v).toFixed(3)}) translate(0 46) rotate(${LV_FIBRE_DEG} ${LV_WALL[0]} ${LV_WALL[1]})`}>
            {Array.from({length: 40}, (_, k) => {
              const y = LV_WALL[1] - 50 + k * 2.5 + 0.6 * Math.sin(k * 2.3);
              return <path key={`mf${k}`} d={`M${LV_WALL[0] - 80},${f1(y)} C${LV_WALL[0] - 30},${f1(y + 1.2 * Math.sin(k))} ${LV_WALL[0] + 30},${f1(y - 1.2 * Math.cos(k))} ${LV_WALL[0] + 80},${f1(y)}`} fill="none" stroke={shade(C.myo, 0.4)} strokeWidth={0.35} opacity={0.6} />;
            })}
            {Array.from({length: 220}, (_, k) => {
              const h = Math.sin(k * 91.7) * 43758.5;
              const r1 = h - Math.floor(h), r2 = Math.abs((h * 7.13) % 1);
              const x = LV_WALL[0] - 70 + 140 * r1, y = LV_WALL[1] - 50 + 100 * r2;
              const light = k % 3 === 0;
              return <ellipse key={`mc${k}`} cx={f1(x)} cy={f1(y)} rx={2.6 * (1 - 0.08 * v)} ry={0.7} fill={light ? lit(C.myo, 0.35) : shade(C.myo, 0.3)} opacity={0.4} />;
            })}
          </g>
        )}
        <ellipse cx={-48} cy={-6} rx={44} ry={26} fill="#FFFFFF" opacity={0.18 * gl * gloss} transform="rotate(-30 -48 -6)" />
        <ellipse cx={-60} cy={-14} rx={14} ry={7} fill="#FFFFFF" opacity={0.55 * gl * gloss} transform="rotate(-30 -60 -14)" />
      </g>
      <path d={vd} fill="none" stroke={INK} strokeWidth={ink} />
      {/* coronary arteries in the grooves, and a vein alongside */}
      <path d={open(sep)} fill="none" stroke={INK} strokeWidth={9 + ink} strokeLinecap="round" />
      <path d={open(sep)} fill="none" stroke={C.art} strokeWidth={9} strokeLinecap="round" />
      <path d={open(sep.map((p) => ({x: p.x + 12, y: p.y + 4})))} fill="none" stroke={C.vein} strokeWidth={5} strokeLinecap="round" opacity={0.9} />
      <path d={open(rca)} fill="none" stroke={INK} strokeWidth={8 + ink} strokeLinecap="round" />
      <path d={open(rca)} fill="none" stroke={C.art} strokeWidth={8} strokeLinecap="round" />
      {[0.3, 0.55].map((u, i) => {
        const p = sep[Math.floor(u * (sep.length - 1))];
        return <path key={i} d={`M${f1(p.x)},${f1(p.y)} q${-30 - 10 * i},${20} ${-50 - 6 * i},${58}`} fill="none" stroke={C.art} strokeWidth={5} strokeLinecap="round" />;
      })}
      {/* the pulmonary trunk in front of the aorta */}
      {tube(pulm, 40 * swell, C.pulm, 'pa')}
    </g>
  );
};
export {lerpP};
