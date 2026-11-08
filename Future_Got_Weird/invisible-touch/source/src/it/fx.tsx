// Explanatory overlays (never part of the real scene): cyan, glowing, thin. The physics they illustrate:
//  - a phased array focuses by DELAYING each transducer so that every wavelet's crest reaches the focal point at the
//    same moment (outer transducers, farther from the focus, fire first);
//  - the wavelets' envelope is a spherical wave converging on the focus; between crests the pressure there is low;
//  - at the focus the pressure is high enough to press on skin very slightly; it is switched on and off (modulated) at
//    a rate the skin can feel, so the touch is a pressure / vibration sensation, not a solid surface.
// The drawn wavelength (14 u) and speed are stylised for legibility (the real 40 kHz wavelength is about 8.6 mm).
import React from 'react';
import {V} from '../dc/math';
import {DEV, DEV_TOP} from './device';

export const CYAN = '#46CFFF';
export const CYAN_HI = '#C8F4FF';
export const LAMBDA = 14;
export const SPEED = 62; // u per second
export const PERIOD = LAMBDA / SPEED;

/** the cross-section row's emitter x positions (figure plane) */
export const ROW = Array.from({length: DEV.n}, (_, i) => (i - (DEV.n - 1) / 2) * DEV.pitch);
const EY = -DEV_TOP; // emitter faces, figure v (down)

/** delay of emitter at x so its crest arrives at F with the others */
export const delayOf = (x: number, F: V) => {
  const dmax = Math.max(...ROW.map((xx) => Math.hypot(xx - F.x, EY - F.y)));
  return (dmax - Math.hypot(x - F.x, EY - F.y)) / SPEED;
};

/** top-view emitter brightness for the firing pattern (concentric rings of phase around the point under F) */
export const phaseGlow = (t: number, i: number, j: number, F: {x: number; y: number; z: number}, on: number) => {
  if (on <= 0.001) return 0;
  const x = (i - (DEV.n - 1) / 2) * DEV.pitch, z = (j - (DEV.n - 1) / 2) * DEV.pitch;
  const d = Math.hypot(x - F.x, DEV_TOP - F.y, z - F.z);
  const ph = (t * SPEED + d) / LAMBDA;
  return on * (0.28 + 0.72 * Math.max(0, Math.cos(2 * Math.PI * ph)) ** 2);
};

type WaveProps = {
  t: number;
  F: V;
  /** 0..1 how much is shown */
  on: number;
  /** show individual wavelets */
  wavelets?: number;
  /** show the converging envelope */
  envelope?: number;
  /** stroke width in figure units */
  w: number;
  /** emission starts at this time (no crest before) */
  t0: number;
  id: string;
};

const arc = (c: V, r: number, a0: number, a1: number) => {
  const p0 = {x: c.x + r * Math.cos(a0), y: c.y + r * Math.sin(a0)};
  const p1 = {x: c.x + r * Math.cos(a1), y: c.y + r * Math.sin(a1)};
  const large = Math.abs(a1 - a0) > Math.PI ? 1 : 0;
  return `M${p0.x.toFixed(2)},${p0.y.toFixed(2)} A${r.toFixed(2)},${r.toFixed(2)} 0 ${large} 1 ${p1.x.toFixed(2)},${p1.y.toFixed(2)}`;
};

export const Waves: React.FC<WaveProps> = ({t, F, on, wavelets = 1, envelope = 1, w, t0, id}) => {
  if (on <= 0.001) return null;
  const els: React.ReactNode[] = [];
  // wavelets: each emitter, crests emitted every PERIOD after its own delay
  if (wavelets > 0.01) {
    ROW.forEach((x, i) => {
      const tau = delayOf(x, F);
      const toF = Math.atan2(F.y - EY, F.x - x);
      const dF = Math.hypot(F.x - x, F.y - EY);
      for (let k = 0; k < 12; k++) {
        const te = t0 + tau + k * PERIOD;
        const r = (t - te) * SPEED;
        if (r <= 0.3 || r > dF + 2) continue;
        const fade = Math.min(1, r / 4) * Math.min(1, (dF + 2 - r) / 8);
        els.push(<path key={`w${i}-${k}`} d={arc({x, y: EY}, r, toF - 0.62, toF + 0.62)} fill="none" stroke={CYAN} strokeWidth={w * 0.55} strokeOpacity={0.5 * fade * wavelets} strokeLinecap="round" />);
      }
    });
  }
  // envelope: converging spherical crests centred on F, limited to the directions that meet the array
  if (envelope > 0.01) {
    const aL = Math.atan2(EY - F.y, ROW[0] - F.x);
    const aR = Math.atan2(EY - F.y, ROW[ROW.length - 1] - F.x);
    const dmax = Math.max(...ROW.map((xx) => Math.hypot(xx - F.x, EY - F.y)));
    const dmin = Math.abs(EY - F.y);
    for (let k = 0; k < 14; k++) {
      // crest k leaves the array (outermost emitters) at t0 + k*PERIOD and arrives at F dmax/SPEED later
      const r = dmax - (t - t0 - k * PERIOD) * SPEED;
      if (r > dmax || r < 0.5) continue;
      // near the array, the crest only exists where its wavelets have formed it
      const born = Math.min(1, (dmax - r) / 10);
      const lens = Math.min(1, (dmin + 6 - Math.min(r, dmin + 6)) / 6 + 0.35);
      const near = 1 - Math.min(1, r / dmax) * 0.5;
      const st = {stroke: CYAN_HI, strokeWidth: w * (0.9 + 0.9 * near), strokeOpacity: 0.85 * born * envelope * Math.min(1, lens + 0.4)};
      const dy = EY - F.y;
      if (r <= Math.abs(dy) + 0.01) {
        els.push(<path key={`e${k}`} d={arc(F, r, aR, aL)} fill="none" {...st} strokeLinecap="round" filter={`url(#${id}-gl)`} />);
      } else {
        // the centre transducers have not fired yet: the crest exists only where the array lies at least r away
        const hx = Math.sqrt(r * r - dy * dy);
        const a1 = Math.atan2(dy, hx), a2 = Math.atan2(dy, -hx);
        if (a1 > aR) els.push(<path key={`e${k}a`} d={arc(F, r, aR, a1)} fill="none" {...st} strokeLinecap="round" filter={`url(#${id}-gl)`} />);
        if (aL > a2) els.push(<path key={`e${k}b`} d={arc(F, r, a2, aL)} fill="none" {...st} strokeLinecap="round" filter={`url(#${id}-gl)`} />);
      }
    }
  }
  return (
    <g opacity={on}>
      <defs>
        <filter id={`${id}-gl`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation={(w * 0.6).toFixed(2)} result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      {els}
    </g>
  );
};

/** the focal spot: a soft cyan bloom whose strength follows the arriving crests (and the modulation) */
export const Focus: React.FC<{c: V; r: number; a: number; id: string; squash?: number}> = ({c, r, a, id, squash = 1}) =>
  a <= 0.001 ? null : (
    <g opacity={Math.min(1, a)}>
      <defs>
        <radialGradient id={`${id}-fg`}>
          <stop offset="0" stopColor="#FFFFFF" stopOpacity="0.95" />
          <stop offset="0.25" stopColor={CYAN_HI} stopOpacity="0.8" />
          <stop offset="0.6" stopColor={CYAN} stopOpacity="0.35" />
          <stop offset="1" stopColor={CYAN} stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx={c.x} cy={c.y} rx={r} ry={r * squash} fill={`url(#${id}-fg)`} />
    </g>
  );

/** a tactile pulse at a contact point: rings expanding in the horizontal plane (an ellipse), quickly fading */
export const Pulse: React.FC<{c: V; age: number; size: number; w: number; tilt?: number; dur?: number}> = ({c, age, size, w, tilt = 0.32, dur = 0.55}) => {
  if (age < 0 || age > dur) return null;
  const u = age / dur;
  return (
    <g>
      {[0, 0.28].map((d, k) => {
        const v = (u - d) / (1 - d);
        if (v <= 0 || v >= 1) return null;
        const r = size * (0.25 + 0.95 * Math.sqrt(v));
        return <ellipse key={k} cx={c.x} cy={c.y} rx={r} ry={r * tilt} fill="none" stroke={CYAN} strokeWidth={w * (1 - v * 0.6)} strokeOpacity={(1 - v) * 0.9} />;
      })}
    </g>
  );
};
