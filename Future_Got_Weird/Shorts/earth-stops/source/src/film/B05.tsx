import React from 'react';
import {C, H, W} from '../theme';
import {E} from '../lib/motion';
import {rand} from '../lib/anim';
import {HED_FONT} from '../fonts4';
import {Chip, cl, lerp, popScale, ramp} from './ui';
import {T, WORD, fs} from './timeline';

/**
 * B05: "Farther from the equator, it's slower - but even at eighty degrees north, it starts at Category five hurricane speed."
 * The planet seen from above the North Pole (it turns counter-clockwise = east). The ground's speed at latitude phi is v = omega * R * cos(phi): the rings are drawn at their true
 * radii (cos 0, cos 40, cos 80 = 1, 0.766, 0.174), the arrows and the bars are proportional to the speeds (computed in script/speed_table.json: 1,040 / 798 / 181 mph).
 */
export const B5 = {disc: T.b05 + 6, zoom0: fs(WORD.category - 0.3), zoom1: fs(WORD.five + 0.2), starting: fs(WORD.starts - 0.15), cat: fs(WORD.category - 0.15)}; // picture events (frames)
export const DISC = {cx: 540, cy: 880, R: 235};
export const LAT = [{lat: 0, v: 1040.4, label: '0°', name: 'EQUATOR', phi: 0, f: fs(WORD.equator + 0.1)}, {lat: 40, v: 798.1, label: '40°', name: '', phi: 38, f: fs(WORD.slower - 0.02)}, {lat: 80, v: 181.3, label: '80°', name: 'NORTH', phi: 62, f: fs(WORD.eighty - 0.1)}];
const BAR = {x0: 250, xMax: 660, k0: 0.38, k1: 2.1, y0: 1340, pitch: 92, h: 72, vx: 940};
const CAT5 = 157;
const rad = (d: number) => (d * Math.PI) / 180;
const closed = (pts: {x: number; y: number}[]): string => {
  const n = pts.length;
  let d = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
    d += ` C ${(p1.x + (p2.x - p0.x) / 6).toFixed(1)} ${(p1.y + (p2.y - p0.y) / 6).toFixed(1)} ${(p2.x - (p3.x - p1.x) / 6).toFixed(1)} ${(p2.y - (p3.y - p1.y) / 6).toFixed(1)} ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
  }
  return d + ' Z';
};
const LANDS = [{lon: -120, lat: 48, dl: 40, dp: 18}, {lon: -50, lat: 66, dl: 30, dp: 12}, {lon: 10, lat: 52, dl: 34, dp: 14}, {lon: 70, lat: 58, dl: 46, dp: 14}, {lon: 125, lat: 40, dl: 36, dp: 16}, {lon: -170, lat: 62, dl: 28, dp: 10}, {lon: 175, lat: 70, dl: 24, dp: 8}, {lon: -85, lat: 28, dl: 30, dp: 12}, {lon: 30, lat: 22, dl: 26, dp: 12}];

const polarPt = (lonDeg: number, latDeg: number, rot: number) => {
  const a = rad(lonDeg + rot), r = DISC.R * Math.cos(rad(latDeg));
  return {x: DISC.cx + r * Math.cos(a), y: DISC.cy - r * Math.sin(a)};
};
const tangentArrow = (phiDeg: number, r: number, L: number, key: string, col: string) => {
  const a = rad(phiDeg), p = {x: DISC.cx + r * Math.cos(a), y: DISC.cy - r * Math.sin(a)}, u = {x: -Math.sin(a), y: -Math.cos(a)};
  const hd = Math.min(34, Math.max(18, L * 0.45)), e = {x: p.x + u.x * L, y: p.y + u.y * L}, n = {x: -u.y, y: u.x};
  const base = {x: e.x - u.x * hd * 0.5, y: e.y - u.y * hd * 0.5};
  void base;
  const tip = {x: e.x + u.x * hd, y: e.y + u.y * hd};
  return (
    <g key={key}>
      <line x1={p.x} y1={p.y} x2={e.x} y2={e.y} stroke={C.ink} strokeWidth={22} strokeLinecap="round" />
      <path d={`M ${e.x + n.x * hd * 0.85} ${e.y + n.y * hd * 0.85} L ${tip.x} ${tip.y} L ${e.x - n.x * hd * 0.85} ${e.y - n.y * hd * 0.85} Z`} fill={C.ink} stroke={C.ink} strokeWidth={10} strokeLinejoin="round" />
      <line x1={p.x} y1={p.y} x2={e.x} y2={e.y} stroke={col} strokeWidth={12} strokeLinecap="round" />
      <path d={`M ${e.x + n.x * hd * 0.85} ${e.y + n.y * hd * 0.85} L ${tip.x} ${tip.y} L ${e.x - n.x * hd * 0.85} ${e.y - n.y * hd * 0.85} Z`} fill={col} strokeLinejoin="round" />
    </g>
  );
};

const Hurricane: React.FC<{x: number; y: number; s: number; ang: number}> = ({x, y, s, ang}) => (
  <g transform={`translate(${x} ${y}) scale(${s}) rotate(${ang})`}>
    <circle r={30} fill={C.cream} stroke={C.ink} strokeWidth={4} />
    {[0, 1, 2].map((i) => <path key={i} d="M 0 0 C 8 -12 22 -12 26 -2 C 18 -6 10 -4 0 0" transform={`rotate(${i * 120})`} fill={C.teal} stroke={C.ink} strokeWidth={3} strokeLinejoin="round" />)}
    <circle r={6} fill={C.ink} />
  </g>
);

export const Polar: React.FC<{f: number}> = ({f}) => {
  const rot = f * 1.3; // degrees per frame, counter-clockwise (east)
  const pop = popScale(f, B5.disc);
  const push = 1 + 0.07 * ramp(f, T.b05, T.b05end, (x) => x); // a slow push-in on the whole view
  const bgDeep = ramp(f, T.wipe2B, T.wipe2B + 14, (x) => x);
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute', left: 0, top: 0}}>
      <rect x={0} y={0} width={W} height={H} fill={C.teal} />
      <rect x={0} y={0} width={W} height={H} fill={C.tealDeep} opacity={bgDeep} />
      <g transform={`translate(${DISC.cx} ${DISC.cy}) scale(${push}) translate(${-DISC.cx} ${-DISC.cy})`}>
      {[330, 420, 520, 640].map((r, i) => <circle key={i} cx={DISC.cx} cy={DISC.cy} r={r} fill="none" stroke={C.cream} strokeWidth={4} opacity={0.12 * bgDeep} />)}
      <g transform={`translate(${DISC.cx} ${DISC.cy}) scale(${pop}) translate(${-DISC.cx} ${-DISC.cy})`}>
        <circle cx={DISC.cx} cy={DISC.cy} r={DISC.R + 20} fill={C.cream} opacity={0.35} />
        <circle cx={DISC.cx} cy={DISC.cy} r={DISC.R} fill={C.tealLight} />
        {LANDS.map((l, i) => {
          const pts = Array.from({length: 14}).map((_, k) => { const a = (k / 14) * Math.PI * 2, kk = 0.7 + 0.5 * rand(i * 31 + k * 5); return polarPt(l.lon + l.dl * Math.cos(a) * kk, l.lat + l.dp * Math.sin(a) * kk, rot); });
          return <path key={i} d={closed(pts)} fill={C.saffronLight} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />;
        })}
        {[20, 60].map((lat) => <circle key={lat} cx={DISC.cx} cy={DISC.cy} r={DISC.R * Math.cos(rad(lat))} fill="none" stroke={C.teal} strokeWidth={3} opacity={0.5} />)}
        {LAT.map((l, i) => {
          const on = ramp(f, l.f, l.f + 8, (x) => x);
          return <circle key={i} cx={DISC.cx} cy={DISC.cy} r={DISC.R * Math.cos(rad(l.lat))} fill="none" stroke={i === 2 ? C.coral : C.ink} strokeWidth={lerp(3, i === 2 ? 9 : 7, on)} opacity={lerp(0.35, 1, on)} />;
        })}
        {LAT.map((l, i) => {
          const on = ramp(f, l.f, l.f + 8, (x) => x), r = DISC.R * Math.cos(rad(l.lat));
          return <circle key={`d${i}`} cx={DISC.cx} cy={DISC.cy} r={r} fill="none" stroke={C.cream} strokeWidth={i === 2 ? 7 : 9} strokeLinecap="round" strokeDasharray={`${Math.max(8, r * 0.16)} ${Math.max(14, r * 0.3)}`} strokeDashoffset={-(rot * Math.PI / 180) * r} opacity={0.85 * on} />;
        })}
        <circle cx={DISC.cx} cy={DISC.cy} r={DISC.R} fill="none" stroke={C.ink} strokeWidth={8} />
        <circle cx={DISC.cx} cy={DISC.cy} r={9} fill={C.ink} />
      </g>
      {/* arrows: counter-clockwise (east) on each ring, length proportional to the ground's speed */}
      {LAT.map((l, i) => {
        const s = popScale(f, l.f);
        if (s <= 0.01) return null;
        const r = DISC.R * Math.cos(rad(l.lat)), L = l.v * 0.2;
        return <g key={i} transform={`translate(${DISC.cx + r * Math.cos(rad(l.phi))} ${DISC.cy - r * Math.sin(rad(l.phi))}) scale(${s}) translate(${-(DISC.cx + r * Math.cos(rad(l.phi)))} ${-(DISC.cy - r * Math.sin(rad(l.phi)))})`}>{tangentArrow(l.phi, r, L, `a${i}`, i === 2 ? C.coral : C.saffron)}</g>;
      })}
      </g>
      <PolarChart f={f} />
    </svg>
  );
};

const PolarChart: React.FC<{f: number}> = ({f}) => {
  const rows = LAT.map((l, i) => ({...l, i, g: ramp(f, l.f + 6, l.f + 26, E.out), y: BAR.y0 + i * BAR.pitch}));
  const zoom = ramp(f, fs(WORD.category - 0.3), fs(WORD.five + 0.2), E.inOut); // the axis is magnified so 181 can be read against 157
  const k = Math.exp(lerp(Math.log(BAR.k0), Math.log(BAR.k1), zoom));
  const cat = ramp(f, fs(WORD.category - 0.15), fs(WORD.category + 0.25), E.out);
  const starting = popScale(f, fs(WORD.starts - 0.15));
  const out = ramp(f, T.b05end - 26, T.b05end - 19, E.inOut); // the chart leaves first (f720-727), then the disc turns into the globe
  const xl = BAR.x0 + CAT5 * k;
  return (
    <g opacity={1 - out}>
      <clipPath id="barClip"><rect x={BAR.x0 - 4} y={BAR.y0 - 140} width={BAR.xMax - BAR.x0 + 10} height={460} /></clipPath>
      {rows.map((r) => {
        if (r.g <= 0.01) return null;
        const full = r.v * k * r.g, w = Math.max(8, full), val = Math.round(r.v * r.g), hot = r.i === 2;
        return (
          <g key={r.i}>
            <text x={40} y={r.y} dy="0.36em" fontFamily={HED_FONT} fontWeight={800} fontSize={44} letterSpacing={1.2} fill={C.cream} stroke={C.ink} strokeWidth={8} paintOrder="stroke">{r.label}{r.name ? ` ${r.name}` : ''}</text>
            <g clipPath="url(#barClip)">
              <rect x={BAR.x0 + 5} y={r.y - BAR.h / 2 + 7} width={w} height={BAR.h} rx={12} fill={C.ink} />
              <rect x={BAR.x0} y={r.y - BAR.h / 2} width={w} height={BAR.h} rx={12} fill={hot ? C.coral : C.saffron} stroke={C.ink} strokeWidth={5} />
            </g>
            {BAR.x0 + full > BAR.xMax && <path d={`M ${BAR.xMax - 36} ${r.y - 20} l 24 20 l -24 20`} fill="none" stroke={C.ink} strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" />}
            <text x={BAR.vx} y={r.y} dy="0.36em" textAnchor="end" fontFamily={HED_FONT} fontWeight={800} fontSize={68} letterSpacing={1} fill={C.cream} stroke={C.ink} strokeWidth={10} paintOrder="stroke">{val.toLocaleString('en-US')}<tspan fontSize={34} dx={8}>MPH</tspan></text>
          </g>
        );
      })}
      {cat > 0.01 && (
        <g opacity={cat}>
          <line x1={xl} y1={BAR.y0 - 82} x2={xl} y2={BAR.y0 + 2 * BAR.pitch + 54} stroke={C.cream} strokeWidth={6} strokeDasharray="14 10" />
          <g transform={`translate(${Math.min(xl - 180, 470)} ${BAR.y0 - 112})`}>
            <rect x={0} y={-30} width={440} height={60} rx={14} fill={C.cream} stroke={C.ink} strokeWidth={5} />
            <text x={220} y={0} dy="0.36em" textAnchor="middle" fontFamily={HED_FONT} fontWeight={800} fontSize={38} letterSpacing={1.2} fill={C.ink}>157 MPH = CATEGORY 5</text>
          </g>
          <Hurricane x={Math.min(xl - 180, 470) - 14} y={BAR.y0 - 112} s={0.95} ang={f * 14} />
        </g>
      )}
      <Chip x={540} y={1160} w={560} text="STARTING SPEED ONLY" tone="move" scale={starting} />
    </g>
  );
};
void cl;
