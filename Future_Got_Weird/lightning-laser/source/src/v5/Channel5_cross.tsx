// V5 D3 (13.33-14.64) "and HEATING a narrow channel": a side cross-section of a stretch of storm air along the beam
// (diagram-like: a clean slab of air, its molecules a fine field of small dumbbells, the cyan path through it).
// The pulse train passes again and again (one packet every 0.2 s, illustrative slow motion). Each packet:
//   - ionizes the air it passes: the molecules on the path glitter white-cyan and a white-cyan sheath trails it,
//     fading in about 0.15 s;
//   - heats it: a V-shaped pressure wake spreads out from the path behind the packet, and where it passes the
//     molecules are pushed outward (their displacement accumulates pulse by pulse, so the air on the path thins);
//   - adds warmth: the restrained warm band along the path brightens and widens a step with every packet, the new
//     warmth following the packet up the frame.
// By "channel" (14.30) the band is a narrow warm channel of lower density (a few molecules stay inside), the cyan line
// solid within it. The camera rides slowly up the axis with the pulses (one direction, constant speed; no zoom). The
// axis runs up and to the right at MICRO_ANG through (AX, AY), where D2's and E2's do (cut-to-cut eye position).
import React from 'react';
import {mix} from '../dc/color';
import {clamp, fmt, hash, noise1} from '../dc/math';
import {ss} from '../lib';
import {PAL} from '../v3/palette';
import {camTr, frameBox, MCam} from '../v3/Channel3_field';
import {MICRO_ANG} from '../v3/cams3';

const INK = '#0B151C';
const T0 = 13.33, T1 = 14.64;
const AX = 620, AY = 960;
/** the camera's ride up the axis (slab px per s) */
const V_CAM = 150;
export const crossCam = (t: number): MCam => ({ax: AX, ay: AY, cy: -V_CAM * (t - T0), z: 1});

// ------------------------------------------------------------------ the pulse train
/** packet speed along the axis (px/s; illustrative slow motion) and the times each passes the slab origin (y = 0) */
const V_P = 5200;
const PULSES = Array.from({length: 8}, (_, k) => 13.3 + 0.2 * k);
const N_HEAT = 7; // the pulses that heat the slab during the shot
/** the time pulse k passes axis height y (slab coords: up = -y) */
const tauK = (k: number, y: number) => PULSES[k] - y / V_P;
/** packet head (slab y) */
const headY = (k: number, t: number) => -V_P * (t - PULSES[k]);
/** the pressure wake's outward speed (px/s): its front trails each packet as a V */
const C_W = 820;
/** heating per pulse: a smooth step over T_H after the packet passes */
const T_H = 0.22;
const sStep = (x: number) => ss(x, 0, 1);
/** the warm level at axis height y (sum of pulses passed, each eased in) and the heat 0..1 */
const warmL = (y: number, t: number) => PULSES.reduce((a, _, k) => a + sStep((t - tauK(k, y)) / T_H), 0);
const heatOf = (L: number) => clamp(L / N_HEAT) ** 0.9;
/** the cleared half-width the pushed air leaves (px) for heat h */
const CLEAR = 150;

// ------------------------------------------------------------------ the air (one field of small dumbbells)
const SPD = 56;
type Air = {x: number; y: number; o2: boolean; th: number; ph: number; id: number; keep: boolean; r1: number};
const airCell = (i: number, j: number): Air => {
  const id = (i * 7919 + j * 104729 + 977) | 0;
  return {
    x: (i + 0.15 + 0.7 * hash(id, 3)) * SPD, y: (j + 0.15 + 0.7 * hash(id, 5)) * SPD, o2: hash(id, 7) < 0.21,
    th: 360 * hash(id, 9), ph: 6.283 * hash(id, 11), id, keep: hash(id, 13) < 0.2, r1: hash(id, 15),
  };
};
/** a molecule's push: when the pulse's wake front reaches it (|x|/C_W after the packet), it is pushed outward a step;
 *  the steps accumulate (h in 0..1), mapping |x| to sqrt(x^2 + (CLEAR h)^2): monotonic, strongest on the axis */
const pushH = (m: Air, t: number) => {
  const d = Math.abs(m.x) / C_W;
  let h = 0;
  for (let k = 0; k < PULSES.length; k++) h += sStep((t - tauK(k, m.y) - d) / 0.14);
  return heatOf(h);
};
const airState = (m: Air, t: number) => {
  const h = pushH(m, t);
  const c = CLEAR * h * (m.keep ? 0.28 : 1);
  const ax = Math.abs(m.x), sg = Math.sign(m.x) || (m.id % 2 ? 1 : -1);
  const r = Math.sqrt(ax * ax + c * c);
  // warm where it is now (the heated column)
  const hy = heatOf(warmL(m.y, t));
  const heat = hy * Math.exp(-((r / (CLEAR * 1.05 + 30)) ** 2));
  const jg = 2.2 + 6 * heat;
  const x = sg * r + jg * noise1(t * 1.6 + m.ph, m.id % 997);
  const y = m.y + jg * noise1(t * 1.4 + m.ph * 2, (m.id % 997) + 9);
  const th = m.th + (30 + 160 * heat) * t * (m.id % 2 ? 1 : -1);
  return {x, y, th, heat, r};
};

// ------------------------------------------------------------------ the background: storm air, soft cloud, rain
/** soft cloud masses far behind the slab (parallax 0.3), in screen space round the anchor */
const CLOUDS = Array.from({length: 9}, (_, i) => ({
  x: -520 + 1040 * hash(i, 301), y: -1300 + 2600 * hash(i, 303), rx: 260 + 260 * hash(i, 305), ry: 160 + 160 * hash(i, 307),
  c: mix('#0E1723', '#172434', hash(i, 309)), a: 0.4 + 0.25 * hash(i, 311),
}));
const Backdrop: React.FC<{mc: MCam; t: number}> = ({mc, t}) => {
  const k = 0.3;
  const dy = -mc.cy * k; // the far layer rises with the camera, slower
  return (
    <g>
      <defs>
        <linearGradient id="d3-sky" x1="0" y1="0" x2="0.35" y2="1">
          <stop offset="0" stopColor="#0C1521" />
          <stop offset="0.55" stopColor="#131F2F" />
          <stop offset="1" stopColor="#101A27" />
        </linearGradient>
        <filter id="d3-cb" filterUnits="userSpaceOnUse" x={-500} y={-500} width={2080} height={2920}>
          <feGaussianBlur stdDeviation={110} />
        </filter>
      </defs>
      <rect x={-20} y={-20} width={1120} height={1960} fill="url(#d3-sky)" />
      <g filter="url(#d3-cb)">
        <g transform={`translate(${fmt(AX)} ${fmt(AY + dy)}) rotate(${fmt(MICRO_ANG * 0.4)})`}>
          {CLOUDS.map((c, i) => (
            <ellipse key={i} cx={fmt(c.x + 18 * noise1(t * 0.3, i))} cy={fmt(c.y)} rx={fmt(c.rx)} ry={fmt(c.ry)} fill={c.c} opacity={fmt(c.a)} />
          ))}
        </g>
      </g>
    </g>
  );
};
/** rain: thin falling streaks over everything (screen space, wind-slanted), held back in the caption band */
const RAIN = Array.from({length: 64}, (_, i) => ({x: 1140 * hash(i, 401) - 30, ph: hash(i, 403), L: 46 + 40 * hash(i, 405), sp: 0.85 + 0.3 * hash(i, 407), a: 0.1 + 0.12 * hash(i, 409)}));
const Rain: React.FC<{t: number}> = ({t}) => {
  const d: string[] = [];
  const dl: string[] = [];
  RAIN.forEach((r) => {
    const y = ((r.ph * 2100 + t * 1650 * r.sp) % 2100) - 90;
    const x = r.x - 0.16 * y;
    const seg = `M${fmt(x)},${fmt(y)} L${fmt(x - 0.16 * r.L)},${fmt(y - r.L)}`;
    (y > 1500 && y < 1800 ? dl : d).push(seg);
  });
  return (
    <g fill="none" stroke="#8FA6BC" strokeWidth={2} strokeLinecap="round">
      <path d={d.join(' ')} strokeOpacity={0.16} />
      <path d={dl.join(' ')} strokeOpacity={0.07} />
    </g>
  );
};

// ------------------------------------------------------------------ the warm band (accumulating, widening)
const Band: React.FC<{box: {y0: number; y1: number}; t: number}> = ({box, t}) => {
  const N = 44;
  const ys = Array.from({length: N + 1}, (_, i) => box.y0 + ((box.y1 - box.y0) * i) / N);
  const hs = ys.map((y) => heatOf(warmL(y, t)));
  const shimmer = 1 + 0.1 * noise1(t * 7, 91) * ss(t, 13.43, 13.7);
  const rib = (w: (h: number) => number) => {
    const L = ys.map((y, i) => `${fmt(-w(hs[i]))},${fmt(y)}`);
    const R = ys.map((y, i) => `${fmt(w(hs[i]))},${fmt(y)}`).reverse();
    return `M${L.join(' L')} L${R.join(' L')} Z`;
  };
  const grad = (id: string, a: number, col: string) => (
    <linearGradient id={id} gradientUnits="userSpaceOnUse" x1={0} y1={fmt(box.y0)} x2={0} y2={fmt(box.y1)}>
      {ys.map((_, i) => <stop key={i} offset={(i / N).toFixed(4)} stopColor={col} stopOpacity={clamp(a * hs[i] * shimmer).toFixed(4)} />)}
    </linearGradient>
  );
  return (
    <g style={{mixBlendMode: 'screen'}}>
      <defs>
        {grad('d3-bo', 0.3, PAL.channelMacro)}
        {grad('d3-bm', 0.3, PAL.channel)}
        {grad('d3-bc', 0.16, PAL.channelEdge)}
        <filter id="d3-bb" filterUnits="userSpaceOnUse" x={-2000} y={-4000} width={4000} height={8000}>
          <feGaussianBlur stdDeviation={22} />
        </filter>
      </defs>
      <g filter="url(#d3-bb)">
        <path d={rib((h) => 30 + (CLEAR + 50) * h)} fill="url(#d3-bo)" />
        <path d={rib((h) => 18 + (CLEAR - 10) * h)} fill="url(#d3-bm)" />
        <path d={rib((h) => 10 + 0.45 * CLEAR * h)} fill="url(#d3-bc)" />
      </g>
    </g>
  );
};

// ------------------------------------------------------------------ the pulses: packet, ionized sheath, pressure wake
const Pulses: React.FC<{box: {y0: number; y1: number}; t: number}> = ({box, t}) => {
  const els: React.ReactNode[] = [];
  PULSES.forEach((_, k) => {
    const hy = headY(k, t);
    if (hy > box.y1 + 400 || hy < box.y0 - 2600) return;
    const id = `d3-p${k}`;
    // the ionized sheath trailing the packet: white-cyan, fading over ~0.12 s of its passage
    const tail = V_P * 0.16;
    const y0 = Math.max(hy, box.y0), y1 = Math.min(hy + tail, box.y1);
    // the V-shaped pressure wake: front at |x| = C_W * (age) behind the head, fading over 0.42 s
    const wakeL = Math.min(V_P * 0.26, box.y1 - hy);
    const wx = (C_W * wakeL) / V_P;
    els.push(
      <g key={k} style={{mixBlendMode: 'screen'}}>
        <defs>
          <linearGradient id={`${id}-s`} gradientUnits="userSpaceOnUse" x1={0} y1={fmt(hy)} x2={0} y2={fmt(hy + tail)}>
            <stop offset="0" stopColor="#FFFFFF" stopOpacity={0.85} />
            <stop offset="0.2" stopColor="#CFF6FF" stopOpacity={0.45} />
            <stop offset="0.55" stopColor="#9FE6F5" stopOpacity={0.14} />
            <stop offset="1" stopColor="#7FD8EC" stopOpacity={0} />
          </linearGradient>
          <linearGradient id={`${id}-w`} gradientUnits="userSpaceOnUse" x1={0} y1={fmt(hy)} x2={0} y2={fmt(hy + V_P * 0.26)}>
            <stop offset="0" stopColor="#DDF4FF" stopOpacity={0} />
            <stop offset="0.05" stopColor="#DDF4FF" stopOpacity={0.5} />
            <stop offset="0.45" stopColor="#C8E4F5" stopOpacity={0.22} />
            <stop offset="1" stopColor="#C8E4F5" stopOpacity={0} />
          </linearGradient>
          <radialGradient id={`${id}-b`}>
            <stop offset="0" stopColor={PAL.packet} stopOpacity={0.75} />
            <stop offset="0.4" stopColor={PAL.laser} stopOpacity={0.3} />
            <stop offset="1" stopColor={PAL.laserGlow} stopOpacity={0} />
          </radialGradient>
          <linearGradient id={`${id}-c`} gradientUnits="userSpaceOnUse" x1={0} y1={fmt(hy)} x2={0} y2={fmt(hy + 260)}>
            <stop offset="0" stopColor="#FFFFFF" stopOpacity={0.95} />
            <stop offset="0.25" stopColor={PAL.packet} stopOpacity={0.75} />
            <stop offset="1" stopColor={PAL.laser} stopOpacity={0} />
          </linearGradient>
        </defs>
        {y1 > y0 && (
          <g>
            <rect x={-40} y={fmt(y0)} width={80} height={fmt(y1 - y0)} fill={`url(#${id}-s)`} opacity={0.3} filter="url(#d3-sb)" />
            <rect x={-3.5} y={fmt(y0)} width={7} height={fmt(y1 - y0)} fill={`url(#${id}-s)`} opacity={0.45} />
          </g>
        )}
        {wakeL > 0 && (
          <path d={`M${fmt(-wx)},${fmt(hy + wakeL)} L0,${fmt(hy)} L${fmt(wx)},${fmt(hy + wakeL)}`} fill="none" stroke={`url(#${id}-w)`} strokeWidth={9} strokeLinejoin="round" filter="url(#d3-wb)" />
        )}
        <ellipse cx={0} cy={fmt(hy + 70)} rx={90} ry={280} fill={`url(#${id}-b)`} />
        <path d={`M-10,${fmt(hy + 6)} Q-9,${fmt(hy - 26)} 0,${fmt(hy - 36)} Q9,${fmt(hy - 26)} 10,${fmt(hy + 6)} L2.5,${fmt(hy + 260)} L-2.5,${fmt(hy + 260)} Z`} fill={`url(#${id}-c)`} />
        <ellipse cx={0} cy={fmt(hy - 6)} rx={6} ry={30} fill="#FFFFFF" />
      </g>,
    );
  });
  return <g>{els}</g>;
};

// ------------------------------------------------------------------ the molecules (and their ionization glitter)
const Air: React.FC<{mc: MCam; t: number}> = ({mc, t}) => {
  const box = frameBox(mc, 1, 60);
  const i0 = Math.floor((box.x0 - CLEAR) / SPD), i1 = Math.ceil((box.x1 + CLEAR) / SPD);
  const j0 = Math.floor(box.y0 / SPD), j1 = Math.ceil(box.y1 / SPD);
  const nP: string[] = [], oP: string[] = [];
  const glows: React.ReactNode[] = [];
  const sparks: React.ReactNode[] = [];
  const hot: React.ReactNode[] = [];
  for (let i = i0; i <= i1; i++) for (let j = j0; j <= j1; j++) {
    const m = airCell(i, j);
    const s = airState(m, t);
    if (s.x < box.x0 || s.x > box.x1 || s.y < box.y0 || s.y > box.y1) continue;
    const th = (s.th * Math.PI) / 180, c = Math.cos(th) * 5.8, sn = Math.sin(th) * 5.8;
    const r = 7;
    const d = `M${fmt(s.x + c + r)},${fmt(s.y + sn)} a${r},${r} 0 1,0 ${fmt(-2 * r)},0 a${r},${r} 0 1,0 ${fmt(2 * r)},0 M${fmt(s.x - c + r)},${fmt(s.y - sn)} a${r},${r} 0 1,0 ${fmt(-2 * r)},0 a${r},${r} 0 1,0 ${fmt(2 * r)},0`;
    if (s.heat > 0.12) {
      glows.push(<circle key={`g${m.id}`} cx={fmt(s.x)} cy={fmt(s.y)} r={24} fill="url(#d3-heat)" opacity={fmt(clamp(s.heat * 0.7))} />);
      const col = mix(m.o2 ? '#B0706A' : '#6A8AA6', PAL.channel, 0.32 * s.heat);
      hot.push(<path key={`h${m.id}`} d={d} fill={col} />);
    } else (m.o2 ? oP : nP).push(d);
    // ionization: the molecules on the path flash as a packet passes
    for (let k = 0; k < PULSES.length; k++) {
      const age = t - tauK(k, m.y);
      if (age < 0 || age > 0.16 || s.r > 70) continue;
      const a = (1 - age / 0.16) * (1 - s.r / 86);
      const L = 17 * (1 - 0.5 * age / 0.16);
      const rot = m.ph;
      sparks.push(
        <g key={`s${m.id}-${k}`} opacity={fmt(a)}>
          <circle cx={fmt(s.x)} cy={fmt(s.y)} r={20} fill="url(#d3-ion)" />
          <path d={`M${fmt(s.x - Math.cos(rot) * L)},${fmt(s.y - Math.sin(rot) * L)} L${fmt(s.x + Math.cos(rot) * L)},${fmt(s.y + Math.sin(rot) * L)} M${fmt(s.x + Math.sin(rot) * L * 0.6)},${fmt(s.y - Math.cos(rot) * L * 0.6)} L${fmt(s.x - Math.sin(rot) * L * 0.6)},${fmt(s.y + Math.cos(rot) * L * 0.6)}`} stroke="#FFFFFF" strokeWidth={2.2} strokeLinecap="round" />
        </g>,
      );
    }
  }
  return (
    <g>
      <defs>
        <radialGradient id="d3-heat">
          <stop offset="0" stopColor={PAL.channel} stopOpacity={0.5} />
          <stop offset="0.55" stopColor={PAL.channel} stopOpacity={0.16} />
          <stop offset="1" stopColor={PAL.channel} stopOpacity={0} />
        </radialGradient>
        <radialGradient id="d3-ion">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity={0.9} />
          <stop offset="0.4" stopColor="#CFF6FF" stopOpacity={0.4} />
          <stop offset="1" stopColor="#9FE6F5" stopOpacity={0} />
        </radialGradient>
      </defs>
      <g style={{mixBlendMode: 'screen'}}>{glows}</g>
      <g stroke={INK} strokeWidth={1.9}>
        <path d={nP.join(' ')} fill="#5F7E99" />
        <path d={oP.join(' ')} fill="#A86A60" />
        {hot}
      </g>
      <g style={{mixBlendMode: 'screen'}}>{sparks}</g>
    </g>
  );
};

/** the far air: tiny dim dots behind the slab (parallax 0.6), thinning a little on the path as it heats */
const FarDots: React.FC<{mc: MCam; t: number}> = ({mc, t}) => {
  const k = 0.6;
  const box = frameBox(mc, k, 40);
  const sp = 70;
  const out: string[] = [];
  for (let i = Math.floor(box.x0 / sp); i <= Math.ceil(box.x1 / sp); i++) for (let j = Math.floor(box.y0 / sp); j <= Math.ceil(box.y1 / sp); j++) {
    const id = (i * 7919 + j * 104729 + 433) | 0;
    const x = (i + hash(id, 3)) * sp, y = (j + hash(id, 5)) * sp;
    const h = heatOf(warmL(y, t)) * Math.exp(-((x / 120) ** 2));
    if (hash(id, 7) < h * 0.8) continue;
    out.push(`M${fmt(x + 3.2)},${fmt(y)} a3.2,3.2 0 1,0 -6.4,0 a3.2,3.2 0 1,0 6.4,0`);
  }
  return (
    <g transform={camTr(mc, k)}>
      <path d={out.join(' ')} fill="#3F5670" opacity={0.5} />
    </g>
  );
};

/** the laser's path: a thin cyan line, solid over a soft dark underlay inside the warm band */
const Line: React.FC<{box: {y0: number; y1: number}}> = ({box}) => {
  const L = `M0,${fmt(box.y0)} L0,${fmt(box.y1)}`;
  return (
    <g>
      <path d={L} stroke="#0E1724" strokeOpacity={0.4} strokeWidth={10} />
      <g style={{mixBlendMode: 'screen'}}>
        <path d={L} stroke={PAL.laserGlow} strokeOpacity={0.28} strokeWidth={14} />
      </g>
      <path d={L} stroke={PAL.laser} strokeOpacity={0.9} strokeWidth={3.6} />
    </g>
  );
};

export const CrossD3: React.FC<{t: number}> = ({t}) => {
  const mc = crossCam(t);
  const box = frameBox(mc, 1, 200);
  return (
    <g>
      <defs>
        <filter id="d3-sb" filterUnits="userSpaceOnUse" x={-3000} y={-6000} width={6000} height={12000}>
          <feGaussianBlur stdDeviation={9} />
        </filter>
        <filter id="d3-wb" filterUnits="userSpaceOnUse" x={-3000} y={-6000} width={6000} height={12000}>
          <feGaussianBlur stdDeviation={3.5} />
        </filter>
        <radialGradient id="d3-vig" cx="0.5" cy="0.46" r="0.75">
          <stop offset="0.55" stopColor="#05090F" stopOpacity={0} />
          <stop offset="1" stopColor="#05090F" stopOpacity={0.55} />
        </radialGradient>
        <linearGradient id="d3-cap" gradientUnits="userSpaceOnUse" x1="0" y1="1520" x2="0" y2="1820">
          <stop offset="0" stopColor="#0A121C" stopOpacity={0} />
          <stop offset="0.3" stopColor="#0A121C" stopOpacity={0.3} />
          <stop offset="0.7" stopColor="#0A121C" stopOpacity={0.3} />
          <stop offset="1" stopColor="#0A121C" stopOpacity={0} />
        </linearGradient>
      </defs>
      <Backdrop mc={mc} t={t} />
      <FarDots mc={mc} t={t} />
      <g transform={camTr(mc)}>
        <Band box={box} t={t} />
        <Line box={box} />
        <Air mc={mc} t={t} />
        <Pulses box={box} t={t} />
      </g>
      <Rain t={t} />
      <rect x={0} y={0} width={1080} height={1920} fill="url(#d3-vig)" />
      <rect x={0} y={1520} width={1080} height={300} fill="url(#d3-cap)" />
    </g>
  );
};
export const D3_T1 = T1;
