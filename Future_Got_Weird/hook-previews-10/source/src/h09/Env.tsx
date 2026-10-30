// Underwater set for HOOK 09: muted teal water with soft light shafts, a far out-of-focus rubble/reef band, a sand
// floor in world space (grains and pebbles give the scale), and suspended particles at several sizes. Particles are
// pushed by the bubble (incompressible flow: r^3 - R^3 conserved), pulled in by its collapse, and kicked by the
// shockwave as it passes, so the water itself shows what the pressure is doing.
import React from 'react';
import {hash, noise1} from '../shared/lib';
import {mix, rgba, shade, lit} from '../shared/color';
import {fmt, V} from './math';
import {ANCHOR, bubbleC, bubbleR, Cam, FLOOR_Y, HORIZON_Y, PC, ringR, T, toScreen} from './timeline';

const WATER_TOP = '#3A7A78';
const WATER_MID = '#25595C';
const WATER_LOW = '#1B4549';
const SAND = '#8F9474';

/** screen-space water, light shafts, far reef band (parallax: moves and scales much less than the world) */
export const Backdrop: React.FC<{cam: Cam; t: number; tau: number}> = ({cam, t, tau}) => {
  const sf = 12 * Math.pow(cam.s / 12, 0.22); // far layer scale
  const fx = (x: number) => ANCHOR.x + (x - cam.cx * 0.55) * sf;
  const horizon = ANCHOR.y + (HORIZON_Y - 1.5 - cam.cy) * sf; // far reef base (screen)
  const farA = 1 - Math.min(1, Math.max(0, (cam.s - 60) / 90));
  const shafts = [
    {x: 170, w: 120, a: 0.075},
    {x: 470, w: 80, a: 0.06},
    {x: 820, w: 150, a: 0.05},
  ];
  const reef: [number, number, number, number][] = [];
  for (let i = 0; i < 26; i++) reef.push([-110 + i * 9 + hash(i * 3.1) * 6, 2 + hash(i * 7.7) * 7, 3 + hash(i * 1.9) * 5, hash(i * 5.3)]);
  return (
    <svg width={1080} height={1920} style={{position: 'absolute'}}>
      <defs>
        <linearGradient id="h9-water" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={WATER_TOP} />
          <stop offset="0.5" stopColor={WATER_MID} />
          <stop offset="1" stopColor={WATER_LOW} />
        </linearGradient>
        <linearGradient id="h9-shaft" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#E8F6E8" stopOpacity="1" />
          <stop offset="1" stopColor="#E8F6E8" stopOpacity="0" />
        </linearGradient>
        <filter id="h9-farblur" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation={14} />
        </filter>
      </defs>
      <rect width={1080} height={1920} fill="url(#h9-water)" />
      {shafts.map((s, i) => {
        const x = s.x + 40 * Math.sin(t * 0.35 + i * 2) - (cam.cx * 0.6) % 60;
        const sk = 260 + 40 * i;
        return <path key={i} d={`M${fmt(x)},-20 L${fmt(x + s.w)},-20 L${fmt(x + s.w + sk)},1500 L${fmt(x + sk - s.w * 0.6)},1500 Z`} fill="url(#h9-shaft)" opacity={s.a * (0.8 + 0.2 * Math.sin(t * 0.9 + i))} />;
      })}
      {farA > 0 && (
        <g opacity={farA} filter="url(#h9-farblur)">
          {/* far sand haze and rubble/coral heads on it */}
          <rect x={-200} y={fmt(horizon)} width={1480} height={2400} fill={mix(SAND, WATER_MID, 0.62)} />
          {reef.map(([x, h, wdt, k], i) => {
            const X = fx(x), Y = horizon + 4, R = wdt * sf * 0.5, Hh = h * sf;
            const col = k < 0.35 ? mix('#5E7A5A', WATER_MID, 0.55) : k < 0.7 ? mix('#7A6E58', WATER_MID, 0.6) : mix('#4F7068', WATER_MID, 0.5);
            return <ellipse key={i} cx={fmt(X)} cy={fmt(Y)} rx={fmt(R)} ry={fmt(Hh * 0.6)} fill={col} opacity={0.85} />;
          })}
          {/* a branching soft coral far behind-left */}
          <path d={`M${fmt(fx(-46))},${fmt(horizon)} C${fmt(fx(-48))},${fmt(horizon - 14 * sf)} ${fmt(fx(-40))},${fmt(horizon - 20 * sf)} ${fmt(fx(-43))},${fmt(horizon - 30 * sf)}`} stroke={mix('#8A6F6A', WATER_MID, 0.55)} strokeWidth={fmt(2.4 * sf)} fill="none" strokeLinecap="round" />
          <path d={`M${fmt(fx(-45))},${fmt(horizon - 12 * sf)} C${fmt(fx(-38))},${fmt(horizon - 17 * sf)} ${fmt(fx(-36))},${fmt(horizon - 22 * sf)} ${fmt(fx(-34))},${fmt(horizon - 27 * sf)}`} stroke={mix('#8A6F6A', WATER_MID, 0.6)} strokeWidth={fmt(1.8 * sf)} fill="none" strokeLinecap="round" />
          <path d={`M${fmt(fx(54))},${fmt(horizon)} C${fmt(fx(52))},${fmt(horizon - 10 * sf)} ${fmt(fx(60))},${fmt(horizon - 16 * sf)} ${fmt(fx(57))},${fmt(horizon - 24 * sf)}`} stroke={mix('#6E8A6A', WATER_MID, 0.55)} strokeWidth={fmt(3 * sf)} fill="none" strokeLinecap="round" />
        </g>
      )}
      {/* moving caustic shimmer high in the water (very faint) */}
      <g opacity={0.05}>
        {[0, 1, 2, 3].map((i) => (
          <ellipse key={i} cx={fmt(200 + i * 230 + 50 * noise1(tau * 0.4 + i, 3))} cy={fmt(260 + 90 * noise1(tau * 0.3 + i, 5))} rx={160} ry={40} fill="#F2FFF4" />
        ))}
      </g>
    </svg>
  );
};

/** the sand floor, drawn in world space (inside the camera transform) */
export const Floor: React.FC<{tau: number}> = ({tau}) => {
  const grains: React.ReactElement[] = [];
  for (let i = 0; i < 360; i++) {
    const x = -70 + hash(i * 1.37) * 140;
    const u = hash(i * 4.11);
    const y = HORIZON_Y + 0.8 + u * u * 26;
    const depth = (y - HORIZON_Y) / 26;
    const r = 0.12 + hash(i * 2.9) * 0.28 + depth * 0.6;
    const k = hash(i * 8.3);
    const col = k < 0.45 ? lit(SAND, 0.32) : k < 0.75 ? shade(SAND, 0.32) : k < 0.88 ? '#B09A78' : '#6F7C70';
    grains.push(<ellipse key={i} cx={fmt(x)} cy={fmt(y)} rx={fmt(r)} ry={fmt(r * 0.55)} fill={col} opacity={0.35 + 0.4 * Math.min(1, depth * 2)} />);
  }
  const pebbles: [number, number, number, string][] = [
    [-27, 10.6, 2.2, '#8D8A76'], [9.5, 11.6, 1.6, '#9C9478'], [-46, 12.4, 3.4, '#7F8A78'], [24, 10.2, 1.2, '#A39A7E'], [36, 13.5, 3.0, '#87856F'], [-60, 9.6, 2.0, '#8C8F7A'], [-5, 15.5, 2.6, '#958C72'],
  ];
  return (
    <g>
      <defs>
        <linearGradient id="h9-sand" gradientUnits="userSpaceOnUse" x1="0" y1={HORIZON_Y - 0.5} x2="0" y2={HORIZON_Y + 30}>
          <stop offset="0" stopColor={mix(SAND, WATER_MID, 0.75)} stopOpacity="0" />
          <stop offset="0.08" stopColor={mix(SAND, WATER_MID, 0.55)} stopOpacity="0.9" />
          <stop offset="0.25" stopColor={mix(SAND, WATER_MID, 0.25)} />
          <stop offset="0.6" stopColor={SAND} />
          <stop offset="1" stopColor={shade(SAND, 0.18)} />
        </linearGradient>
        <radialGradient id="h9-caus">
          <stop offset="0" stopColor="#F4FBE8" stopOpacity="0.22" />
          <stop offset="1" stopColor="#F4FBE8" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect x={-400} y={HORIZON_Y - 0.5} width={800} height={200} fill="url(#h9-sand)" />
      {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
        <ellipse key={i} cx={fmt(-50 + i * 14 + 3 * noise1(tau * 0.25 + i, 9))} cy={fmt(FLOOR_Y + 1 + (i % 3) * 3.5)} rx={6} ry={1.4} fill="url(#h9-caus)" />
      ))}
      {grains}
      {/* algae tufts (sway with the slow-motion clock) */}
      {([[-33, 9.4, 4.2], [14, 9.0, 3.2], [-55, 10.5, 5.5], [31, 12.5, 4.8], [-18, 14.5, 3.8]] as [number, number, number][]).map(([x, y, h], i) => (
        <g key={`al${i}`}>
          {[0, 1, 2, 3, 4].map((k) => {
            const sw = 0.5 * Math.sin(tau * 1.3 + i + k * 0.7);
            const bx = x + (k - 2) * 0.35 * (h / 4);
            const hh = h * (0.6 + 0.4 * ((k * 37) % 5) / 4);
            const col = i % 2 ? '#6E7F4A' : '#7C6A44';
            return <path key={k} d={`M${fmt(bx)},${fmt(y)} Q${fmt(bx + (k - 2) * 0.5 + sw * 0.5)},${fmt(y - hh * 0.55)} ${fmt(bx + (k - 2) * 0.9 + sw)},${fmt(y - hh)}`}
              stroke={mix(col, WATER_MID, 0.15)} strokeWidth={fmt(0.22 * (h / 4))} fill="none" strokeLinecap="round" />;
          })}
        </g>
      ))}
      {/* a broken shell fragment */}
      <g transform="translate(-8 13.2) rotate(-12)">
        <path d="M-3,0.6 C-2.6,-1.6 2.4,-1.9 3.2,0.4 C1.4,1.1 -1.2,1.2 -3,0.6 Z" fill="url(#h9-shell)" stroke="#172B3A" strokeWidth={0.1} />
        {[-2, -1, 0, 1, 2].map((k) => <path key={k} d={`M${k * 0.55},0.9 Q${k * 0.75},-0.4 ${k * 1.0},-1.25`} stroke="#9C8468" strokeWidth={0.08} fill="none" opacity={0.7} />)}
      </g>
      <defs>
        <linearGradient id="h9-shell" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#EADBC2" />
          <stop offset="1" stopColor="#B49C7E" />
        </linearGradient>
      </defs>
      {pebbles.map(([x, y, r, c], i) => (
        <g key={i}>
          <ellipse cx={fmt(x + r * 0.15)} cy={fmt(y + r * 0.45)} rx={fmt(r * 1.25)} ry={fmt(r * 0.32)} fill="#203A36" opacity={0.25} />
          <defs>
            <radialGradient id={`h9-peb${i}`} gradientUnits="userSpaceOnUse" cx={fmt(x)} cy={fmt(y)} r={fmt(r * 1.1)} fx={fmt(x - r * 0.4)} fy={fmt(y - r * 0.45)}>
              <stop offset="0" stopColor={lit(c, 0.3)} />
              <stop offset="0.7" stopColor={c} />
              <stop offset="1" stopColor={shade(c, 0.35)} />
            </radialGradient>
          </defs>
          <path d={`M${fmt(x - r)},${fmt(y + r * 0.3)} C${fmt(x - r)},${fmt(y - r * 0.7)} ${fmt(x + r * 0.8)},${fmt(y - r * 0.8)} ${fmt(x + r)},${fmt(y + r * 0.2)} C${fmt(x + r * 0.9)},${fmt(y + r * 0.5)} ${fmt(x - r * 0.8)},${fmt(y + r * 0.55)} ${fmt(x - r)},${fmt(y + r * 0.3)} Z`}
            fill={`url(#h9-peb${i})`} stroke="#172B3A" strokeWidth={fmt(r * 0.035 + 0.04)} />
        </g>
      ))}
    </g>
  );
};

// ---------------- suspended particles ----------------
type Part = {p: V; r: number; vx: number; vy: number; ph: number; micro: boolean};
const PARTS: Part[] = (() => {
  const out: Part[] = [];
  // micro particles in the focal plane around the bubble's path (visible only when zoomed in)
  for (let i = 0; i < 230; i++) {
    out.push({p: {x: PC.x - 9 + hash(i * 3.7 + 1) * 16, y: PC.y - 7 + hash(i * 5.1 + 2) * 14}, r: 0.01 + hash(i * 9.3) ** 2 * 0.035, vx: (hash(i * 1.3) - 0.5) * 0.5, vy: (hash(i * 2.3) - 0.3) * 0.4, ph: hash(i * 6.6) * 6.28, micro: true});
  }
  // marine snow over the whole set
  for (let i = 0; i < 190; i++) {
    out.push({p: {x: -75 + hash(i * 7.9 + 3) * 140, y: -75 + hash(i * 3.3 + 4) * 82}, r: 0.06 + hash(i * 4.4) ** 2 * 0.22, vx: (hash(i * 8.1) - 0.5) * 1.2, vy: (hash(i * 2.9) - 0.3) * 0.9, ph: hash(i * 1.1) * 6.28, micro: false});
  }
  return out;
})();

/** where a particle that would be at q (undisturbed) actually is at time t */
const displaced = (q: V, t: number): V => {
  let x = q.x, y = q.y;
  // bubble: radial push/pull, incompressible: r^3 = r0^3 + R^3
  const R = bubbleR(t);
  if (R > 0) {
    const c = bubbleC(t);
    const dx = x - c.x, dy = y - c.y, r0 = Math.hypot(dx, dy) + 1e-6;
    const r = Math.cbrt(r0 * r0 * r0 + R * R * R);
    x = c.x + (dx / r0) * r;
    y = c.y + (dy / r0) * r;
  }
  // shockwave: a sharp outward kick as the front passes, leaving a small residual push
  const rs = ringR(t);
  if (rs > 0) {
    const dx = x - PC.x, dy = y - PC.y, r0 = Math.hypot(dx, dy) + 1e-6;
    const a = Math.exp(-(((r0 - rs) / 0.45) ** 2)) * 0.45 / (1 + 0.25 * r0) + (rs > r0 ? 0.12 / (1 + 0.3 * r0) : 0);
    x += (dx / r0) * a;
    y += (dy / r0) * a;
  }
  return {x, y};
};

export const Particles: React.FC<{cam: Cam; t: number; tau: number; flash: number}> = ({cam, t, tau, flash}) => {
  const dt = 1 / 30;
  const els: React.ReactElement[] = [];
  PARTS.forEach((pp, i) => {
    const q = (tt: number, ta: number): V => ({x: pp.p.x + pp.vx * ta + 0.08 * Math.sin(ta * 1.3 + pp.ph), y: pp.p.y + pp.vy * ta + 0.08 * Math.cos(ta * 1.1 + pp.ph)});
    const w = displaced(q(t, tau), t);
    const S = toScreen(cam, w);
    if (S.x < -60 || S.x > 1140 || S.y < -60 || S.y > 1980) return;
    const rpx = pp.r * cam.s;
    if (rpx < 0.7) return;
    const a = Math.min(1, (rpx - 0.7) / 1.6) * (pp.micro ? 0.75 : 0.55);
    // motion streak in world terms (own displacement only, not camera motion)
    const wPrev = displaced(q(t - dt, tau), t - dt);
    const mv = {x: (w.x - wPrev.x) * cam.s, y: (w.y - wPrev.y) * cam.s};
    const ml = Math.hypot(mv.x, mv.y);
    const dFl = Math.hypot(w.x - PC.x, w.y - PC.y);
    const glint = flash * Math.exp(-dFl / 0.7);
    const col = glint > 0.05 ? mix('#DCE6D2', '#F4FBFF', Math.min(1, glint * 2)) : '#DCE6D2';
    const r = Math.max(0.9, Math.min(rpx, 26));
    // a short soft trail only while the collapse drags the water inward (no radial tick marks)
    if (ml > r * 1.5 && t < T.collapse) {
      const k = Math.min(1, (r * 4) / ml);
      els.push(<line key={i} x1={fmt(S.x - mv.x * k)} y1={fmt(S.y - mv.y * k)} x2={fmt(S.x)} y2={fmt(S.y)} stroke={rgba(col, a * 0.8)} strokeWidth={fmt(r * 1.8)} strokeLinecap="round" />);
    } else {
      els.push(<circle key={i} cx={fmt(S.x)} cy={fmt(S.y)} r={fmt(r)} fill={rgba(col, Math.min(1, a + glint))} />);
    }
  });
  return <g>{els}</g>;
};

/** out-of-focus foreground motes (screen space with a soft parallax), give depth in the macro shots */
export const Bokeh: React.FC<{cam: Cam; tau: number}> = ({cam, tau}) => {
  const sb = 10 * Math.pow(cam.s / 12, 0.75);
  const els: React.ReactElement[] = [];
  for (let i = 0; i < 16; i++) {
    const wx = PC.x - 60 + hash(i * 12.7) * 120, wy = PC.y - 60 + hash(i * 3.9) * 110;
    const X = ANCHOR.x + (wx + 0.6 * tau - cam.cx) * sb * 0.5 + 0;
    const Y = ANCHOR.y + (wy + 0.3 * Math.sin(tau + i) - cam.cy) * sb * 0.5;
    const R = (14 + hash(i * 5.5) * 30) * Math.pow(cam.s / 40, 0.35);
    if (X < -R || X > 1080 + R || Y < -R || Y > 1920 + R) continue;
    els.push(<circle key={i} cx={fmt(X)} cy={fmt(Y)} r={fmt(R)} fill="url(#h9-bokeh)" opacity={0.5} />);
  }
  return (
    <g>
      <defs>
        <radialGradient id="h9-bokeh">
          <stop offset="0" stopColor="#E6F2E4" stopOpacity="0.16" />
          <stop offset="0.75" stopColor="#E6F2E4" stopOpacity="0.1" />
          <stop offset="1" stopColor="#E6F2E4" stopOpacity="0" />
        </radialGradient>
      </defs>
      {els}
    </g>
  );
};
export {T};
