// The forest floor (units mm, y down, the frog's ground at y = 0). Every layer repeats with period JUMP (the distance of
// the frog's final hop), so the spot it lands on is, frame for frame, the spot the film opens on: the loop is exact.
// Layers: a cold sky and soft tree trunks (far), a mound of litter and stems (mid), the leaf-litter floor (near: the
// 2.5D ground plane below the horizon of the litter), a snowpack drawn as a clean cross-section with a pocket around the
// frog (winter), falling snow, meltwater, a few new shoots near the wintering spot (spring only).
import React from 'react';
import {P, closed, pt} from '../core/geo';
import {mix, rgba} from '../core/color';
import {uid} from '../core/ids';
import {clamp, hash, lerp, ss} from '../lib';
import {Leaf} from './frog';

export const JUMP = 128;
export type EnvState = {
  t: number;
  cold: number;    // 0 spring .. 1 deep cold (palette)
  frost: number;   // 0..1 rime on the litter
  snow: number;    // 0..1 the snowpack present
  depth: number;   // snow above the pocket's top (mm)
  falling: number; // 0..1 snowfall
  night: number;   // 0..1
  melt: number;    // 0..1 the snowpack melting away
  wet: number;     // 0..1 wet, glistening litter
  shoots: number;  // 0..1 spring shoots near the wintering spot
  pocket: P;       // the frog's wintering spot (pocket centre, frog space)
  frostX?: number; // the ice wave's front across the litter (world x); leaves left of it are frosted
  sun?: number;    // the sky's clock in days (the sun and moon arc across: time passing); undefined = no disc
  sunOp?: number;  // the disc's opacity (it clouds over as the cold returns)
};
const LEAF_COLS = ['#8A5A2B', '#A3672F', '#6E4424', '#B9853F', '#5E3B22', '#94512A', '#7C4A26'];
const tiles = (x0: number, x1: number) => {
  const out: number[] = [];
  for (let k = Math.floor((x0 - JUMP) / JUMP); k <= Math.ceil((x1 + JUMP) / JUMP); k++) out.push(k * JUMP);
  return out;
};
type L = {x: number; y: number; ang: number; len: number; col: string; sy: number; i: number};
const mkLeaves = (n: number, y0: number, y1: number, len0: number, len1: number, seed: number): L[] =>
  Array.from({length: n}, (_, i) => {
    const y = y0 + hash(i * 3.7 + seed) * (y1 - y0);
    const depth = (y - y0) / (y1 - y0 || 1);
    return {x: -JUMP / 2 + hash(i * 1.9 + seed) * JUMP, y, ang: (hash(i * 5.1 + seed) - 0.5) * 140, len: lerp(len0, len1, depth) * (0.75 + 0.5 * hash(i * 2.3 + seed)),
      col: LEAF_COLS[Math.floor(hash(i * 7.7 + seed) * LEAF_COLS.length)], sy: 0.42 + 0.25 * depth, i};
  }).sort((a, b) => a.y - b.y);
const NEAR = mkLeaves(120, -5, 46, 9, 26, 3);
const NEAR_BACK = mkLeaves(70, -15, -5, 5, 9, 29);
const BACK = mkLeaves(70, -16, -4, 5, 9, 17);

const pal = (e: EnvState) => {
  const c = clamp(e.cold);
  return {
    skyTop: mix('#9CC0CF', '#4F6577', c), skyBot: mix('#E6E2BE', '#93A9B8', c),
    trunk: mix('#6A5A46', '#2E3A46', c), soil: mix('#3E2A1A', '#2A2228', c), litterTint: mix('#FFE2A8', '#B9CCDA', c),
  };
};
const Leaves: React.FC<{ls: L[]; e: EnvState; x0: number; x1: number; dark?: number}> = ({ls, e, x0, x1, dark = 0}) => {
  const c = clamp(e.cold);
  return (
    <g>
      {tiles(x0, x1).map((ox) => (
        <g key={ox} transform={`translate(${ox} 0)`}>
          {ls.filter((l) => l.x + ox > x0 - 30 && l.x + ox < x1 + 30).map((l) => (
            <g key={l.i} transform={`translate(${l.x} ${l.y}) scale(1 ${l.sy})`}>
              <Leaf c={pt(0, 0)} ang={l.ang} len={l.len} col={mix(mix(l.col, '#3A4656', 0.35 * c + dark), '#20160E', 0.0)} frost={e.frost * 0.9 * (e.frostX === undefined ? 1 : ss(e.frostX - (l.x + ox), -14, 10))} />
            </g>
          ))}
        </g>
      ))}
    </g>
  );
};

export const Far: React.FC<{e: EnvState; x0: number; x1: number; y0?: number; y1?: number}> = ({e, x0, x1, y0 = -300, y1 = 100}) => {
  const p = pal(e);
  const id = uid('sk');
  const trunks: React.ReactNode[] = [];
  tiles(x0, x1).forEach((ox) => {
    for (let i = 0; i < 3; i++) {
      const x = ox - JUMP / 2 + (i + 0.3 + 0.4 * hash(i * 9.1)) * (JUMP / 3);
      const w = 9 + 10 * hash(i * 3.3);
      trunks.push(<rect key={`${ox}_${i}`} x={x - w / 2} y={-600} width={w} height={600} fill={p.trunk} opacity={0.5 + 0.3 * hash(i)} />);
    }
  });
  return (
    <g>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset={0} stopColor={p.skyTop} />
          <stop offset={1} stopColor={p.skyBot} />
        </linearGradient>
      </defs>
      <rect x={x0 - 400} y={-700} width={x1 - x0 + 800} height={720} fill={`url(#${id})`} />
      {e.sun !== undefined && (() => {
        // one day = the sun crossing, one night = the moon crossing (each over half a day)
        const ph = ((e.sun % 1) + 1) % 1;
        const day = ph < 0.5, u = day ? ph / 0.5 : (ph - 0.5) / 0.5;
        const cx = (x0 + x1) / 2, span = (x1 - x0) * 0.62;
        const top = Math.max(y0 + 40, -260), hor = Math.min(-40, y1 - 60);
        const x = cx - span / 2 + span * u, y = hor - (hor - top) * Math.sin(Math.PI * u);
        return day
          ? <g opacity={e.sunOp ?? 1}><circle cx={x} cy={y} r={34} fill="#FFF2C2" opacity={0.35} /><circle cx={x} cy={y} r={20} fill="#FFF6D8" /></g>
          : <g opacity={e.sunOp ?? 1}><circle cx={x} cy={y} r={16} fill="#E8EEF6" /><circle cx={x + 6} cy={y - 3} r={13} fill={p.skyTop} opacity={0.9} /></g>;
      })()}
      {trunks}
      {/* far snow on the ground line in winter */}
      <rect x={x0 - 400} y={-30} width={x1 - x0 + 800} height={60} fill={mix(p.soil, '#DCE6EE', 0.85 * e.snow * (1 - e.melt))} opacity={0.9} />
    </g>
  );
};
export const Mid: React.FC<{e: EnvState; x0: number; x1: number}> = ({e, x0, x1}) => {
  const p = pal(e);
  const stems: React.ReactNode[] = [];
  tiles(x0, x1).forEach((ox) => {
    for (let i = 0; i < 5; i++) {
      const x = ox - JUMP / 2 + hash(i * 4.3 + 1) * JUMP;
      const h = 18 + 26 * hash(i * 2.9);
      stems.push(<path key={`${ox}_${i}`} d={`M${x} -6 q${2 + 4 * hash(i)} ${-h * 0.6} ${-1 + 6 * hash(i * 5)} ${-h}`} stroke={mix('#4A3A2A', '#3A4450', e.cold)} strokeWidth={0.9} fill="none" />);
    }
  });
  return (
    <g>
      <path d={`M${x0 - 200} -4 L${x1 + 200} -4 L${x1 + 200} 40 L${x0 - 200} 40 Z`} fill={mix(p.soil, '#7A5A3A', 0.35)} />
      {stems}
      <Leaves ls={BACK} e={e} x0={x0} x1={x1} dark={0.18} />
      {e.snow > 0.01 && <rect x={x0 - 200} y={-14} width={x1 - x0 + 400} height={14} fill="#E4ECF2" opacity={0.92 * e.snow * (1 - e.melt)} />}
    </g>
  );
};
export const Ground: React.FC<{e: EnvState; x0: number; x1: number}> = ({e, x0, x1}) => {
  const p = pal(e);
  const id = uid('gd');
  return (
    <g>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset={0} stopColor={mix(p.soil, '#5A4030', 0.4)} />
          <stop offset={1} stopColor={p.soil} />
        </linearGradient>
      </defs>
      <rect x={x0 - 200} y={-16} width={x1 - x0 + 400} height={130} fill={`url(#${id})`} />
      <Leaves ls={NEAR_BACK} e={e} x0={x0} x1={x1} dark={0.1} />
      <Leaves ls={NEAR} e={e} x0={x0} x1={x1} />
      {/* snow over the floor in winter */}
      {e.snow > 0.01 && (
        <g opacity={e.snow * (1 - ss(e.melt, 0.3, 1))}>
          <rect x={x0 - 200} y={-17} width={x1 - x0 + 400} height={131} fill="#E6EEF5" />
          {Array.from({length: 30}, (_, i) => (
            <ellipse key={i} cx={x0 + hash(i * 3.9) * (x1 - x0)} cy={-12 + hash(i * 6.1) * 50} rx={6 + 10 * hash(i)} ry={1.2} fill="#C7D5E2" opacity={0.6} />
          ))}
        </g>
      )}
      {/* rime haze over the litter */}
      {e.frost > 0.01 && <rect x={x0 - 200} y={-16} width={x1 - x0 + 400} height={130} fill="#D8E8F2" opacity={0.18 * e.frost} />}
      {/* wet sheen (spring) */}
      {e.wet > 0.01 && Array.from({length: 24}, (_, i) => (
        <ellipse key={i} cx={x0 + hash(i * 3.1) * (x1 - x0)} cy={2 + hash(i * 7.3) * 30} rx={2 + 3 * hash(i)} ry={0.5} fill="#FFFFFF" opacity={0.35 * e.wet} />
      ))}
    </g>
  );
};
/** spring shoots, only near the wintering spot (so the landing spot, like the opening, has none) */
export const Shoots: React.FC<{e: EnvState}> = ({e}) => {
  if (e.shoots <= 0.01) return null;
  const at = [-62, -52, 48, 58];
  return (
    <g>
      {at.map((x, i) => {
        const h = (10 + 6 * hash(i)) * ss(e.shoots, i * 0.1, 0.6 + i * 0.1);
        const X = e.pocket.x + x;
        return (
          <g key={i}>
            <path d={`M${X} 2 q1 ${-h * 0.5} ${2 * (i % 2 ? 1 : -1)} ${-h}`} stroke="#3E7A2A" strokeWidth={1.1} fill="none" strokeLinecap="round" />
            <path d={closed([pt(X + 2 * (i % 2 ? 1 : -1), -h), pt(X + 6 * (i % 2 ? 1 : -1), -h - 2.5), pt(X + 3 * (i % 2 ? 1 : -1), -h + 1.5)], 0.8)} fill="#6DB33F" stroke="#24461A" strokeWidth={0.3} opacity={h > 3 ? 1 : 0} />
          </g>
        );
      })}
    </g>
  );
};
/** the snowpack as a cut face, with the frog's pocket of air and leaves cleared out of it */
export const SnowPack: React.FC<{e: EnvState; x0: number; x1: number}> = ({e, x0, x1}) => {
  if (e.snow <= 0.01) return null;
  const id = {m: uid('sm'), g: uid('sg')};
  const k = e.snow * (1 - ss(e.melt, 0.55, 1));
  const top = -(44 + e.depth * (1 - 0.85 * e.melt));
  const P0 = e.pocket;
  const rx = 37 + 4 * e.melt, ry = 26 + 6 * e.melt;
  const surf: P[] = [];
  for (let x = x0 - 60; x <= x1 + 60; x += 12) surf.push(pt(x, top + 1.6 * Math.sin(x * 0.07) + 1.2 * Math.sin(x * 0.19 + 1)));
  const d = `M${x0 - 60} 60 ` + surf.map((q) => `L${q.x.toFixed(1)} ${q.y.toFixed(1)}`).join(' ') + ` L${x1 + 60} 60 Z`;
  return (
    <g opacity={k}>
      <defs>
        <linearGradient id={id.g} x1="0" y1="0" x2="0" y2="1">
          <stop offset={0} stopColor={mix('#F6FAFF', '#DDE7F2', e.melt)} />
          <stop offset={1} stopColor={mix('#C9D8E6', '#B4C4D2', e.melt)} />
        </linearGradient>
        <mask id={id.m} maskUnits="userSpaceOnUse" x={x0 - 100} y={-400} width={x1 - x0 + 200} height={500}>
          <rect x={x0 - 100} y={-400} width={x1 - x0 + 200} height={500} fill="#FFF" />
          <ellipse cx={P0.x} cy={P0.y} rx={rx} ry={ry} fill="#000" />
        </mask>
      </defs>
      <g mask={`url(#${id.m})`}>
        <path d={d} fill={`url(#${id.g})`} stroke="#5E7690" strokeWidth={0.6} />
        {/* strata of the snowfalls */}
        {[0.3, 0.55, 0.78].map((u, i) => (
          <path key={i} d={`M${x0 - 60} ${lerp(top, 0, u)} ` + surf.map((q) => `L${q.x.toFixed(1)} ${(lerp(top, 0, u) + 1.2 * Math.sin(q.x * 0.05 + i)).toFixed(1)}`).join(' ')} stroke="#A9BDD0" strokeWidth={0.5} fill="none" opacity={0.7} />
        ))}
        {/* sparkle */}
        {Array.from({length: 40}, (_, i) => {
          const x = x0 + hash(i * 3.3) * (x1 - x0), y = lerp(top, 0, hash(i * 7.1));
          return <circle key={i} cx={x} cy={y} r={0.35} fill="#FFFFFF" opacity={0.6 + 0.4 * Math.sin(e.t * 3 + i)} />;
        })}
      </g>
      {/* the pocket's rim */}
      <ellipse cx={P0.x} cy={P0.y} rx={rx} ry={ry} stroke="#8EA6BE" strokeWidth={0.8} fill="none" />
    </g>
  );
};
/** the pocket's floor: the leaf litter the frog sits in under the snow (frog space; drawn beneath the frog) */
export const PocketFloor: React.FC<{e: EnvState}> = ({e}) => {
  if (e.snow <= 0.01) return null;
  const P0 = e.pocket;
  const rx = 37 + 4 * e.melt, ry = 26 + 6 * e.melt;
  const id = uid('pf');
  return (
    <g opacity={e.snow}>
      <clipPath id={id}><ellipse cx={P0.x} cy={P0.y} rx={rx} ry={ry} /></clipPath>
      <g clipPath={`url(#${id})`}>
        <rect x={P0.x - rx} y={-3} width={rx * 2} height={ry + 20} fill="#4A3524" />
        {Array.from({length: 14}, (_, i) => (
          <g key={i} transform={`translate(${P0.x - rx + hash(i * 2.7) * rx * 2} ${-1 + hash(i * 5.3) * 9}) scale(1 0.5)`}>
            <Leaf c={pt(0, 0)} ang={(hash(i) - 0.5) * 120} len={9 + 6 * hash(i * 1.7)} col={LEAF_COLS[i % LEAF_COLS.length]} frost={0.6 * (1 - e.melt)} />
          </g>
        ))}
      </g>
    </g>
  );
};
/** snowflakes drifting down through the near layer */
export const Falling: React.FC<{e: EnvState; x0: number; x1: number; y0: number; y1: number}> = ({e, x0, x1, y0, y1}) => {
  if (e.falling <= 0.01) return null;
  const W = x1 - x0, H = y1 - y0;
  return (
    <g>
      {Array.from({length: 90}, (_, i) => {
        const sp = 0.5 + hash(i * 2.2);
        const y = y0 + ((hash(i * 1.3) * H + e.t * H * 0.45 * sp) % H);
        const x = x0 + ((hash(i * 4.1) * W + Math.sin(e.t * 1.5 + i) * W * 0.03) % W);
        const r = (0.25 + 0.5 * hash(i * 9.9)) * (W / 120);
        return <circle key={i} cx={x} cy={y} r={r} fill="#FFFFFF" opacity={e.falling * (0.5 + 0.5 * hash(i))} />;
      })}
    </g>
  );
};
/** meltwater drops falling from the snow onto the frog */
export const Drips: React.FC<{e: EnvState; t: number}> = ({e, t}) => {
  if (e.melt <= 0.01 || e.melt >= 0.99) return null;
  return (
    <g>
      {Array.from({length: 8}, (_, i) => {
        const ph = (t * 1.6 + hash(i * 3.1)) % 1;
        const x = e.pocket.x - 26 + hash(i * 5.5) * 50;
        const y = lerp(e.pocket.y - 24, e.pocket.y + 10, ph * ph);
        return <ellipse key={i} cx={x} cy={y} rx={0.7} ry={1.1} fill="#CFEAFF" stroke="#4A6A8A" strokeWidth={0.15} opacity={Math.sin(Math.PI * e.melt) * 0.9} />;
      })}
    </g>
  );
};
export const rgbaPub = rgba;
