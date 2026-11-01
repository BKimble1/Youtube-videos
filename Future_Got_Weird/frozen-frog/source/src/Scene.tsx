// One frame. The camera says which world we are in. The frog world is drawn as depth layers through a pinhole dolly
// (a push-in moves near things more than far ones), softened by distance from the focus plane. The tissue is nested in
// the frog's body frame at MICRO_B, revealed in a soft circle as the camera dives, and replaces its host once it fills
// the frame. Light (cold, night, spring warmth) and the frost creeping in at the frame's edges are screen-space grades
// that apply only while the camera is outside the body.
import React from 'react';
import {resetIds, uid} from './core/ids';
import {P, add, mul, pt} from './core/geo';
import {clamp, hash, ss} from './lib';
import {Frog, Leaf, MICRO_B, SIT, toWorld} from './art/frog';
import {Anatomy} from './art/anatomy';
import {Micro, microBounds} from './art/micro';
import {Drips, Falling, Far, Ground, Mid, PocketFloor, Shoots, SnowPack} from './art/forest';
import {Cam, EV, K_MICRO, M, airborne, kicks, MICRO_ROLL, MICRO_ROT_B, MW, Place, WCam, anatomyAt, camAt, edgeFrostAt, envAt, fallenLeavesAt, frogAt, microAt, microReveal, toMicro, warmAt} from './story';
import {Captions} from './Captions';
import {toOld} from './warp';

const F = 3600;
const layerScale = (c: Cam, delta: number) => {
  const s0 = 1080 / c.w;
  const d = F / s0;
  return F / (d + delta);
};
const Layer: React.FC<{c: Cam; delta: number; focus?: number; min?: number; max?: number; children: (x0: number, x1: number, y0: number, y1: number) => React.ReactNode}> = ({c, delta, focus = 0, min = 0, max = 40, children}) => {
  const s0 = 1080 / c.w;
  const d = F / s0;
  const s = F / (d + delta);
  const coc = 0.3 * F * Math.abs(1 / (d + focus) - 1 / (d + delta));
  const b = Math.max(min, Math.min(max, coc));
  const hw = 540 / s, hh = 960 / s;
  return (
    <div style={{position: 'absolute', inset: 0, filter: b > 0.4 ? `blur(${b.toFixed(1)}px)` : undefined}}>
      <svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
        <g transform={`translate(540 960) scale(${s}) translate(${-c.x} ${-c.y})`}>{children(c.x - hw, c.x + hw, c.y - hh, c.y + hh)}</g>
      </svg>
    </div>
  );
};
const corners = (c: Cam) => {
  const hw = c.w / 2, hh = (c.w * 16) / 9 / 2;
  return [[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([sx, sy]) => pt(c.x + sx * hw, c.y + sy * hh));
};
const covers = (c: Cam, p: P, r: number) => corners(c).every((q) => ((q.x - p.x) / r) ** 2 + ((q.y - p.y) / r) ** 2 < 0.8);

/** the tissue alone, full frame */
const MicroFull: React.FC<{t: number; c: Cam; roll: number}> = ({t, c, roll}) => (
  <svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0}}>
    <rect x={0} y={0} width={1080} height={1920} fill="#2E0F1C" />
    <g transform={`translate(540 960) rotate(${roll}) scale(${1080 / c.w}) translate(${-c.x} ${-c.y})`}>
      <Micro m={microAt(t)} view={microBounds(c.x, c.y, c.w, (roll * Math.PI) / 180)} />
    </g>
  </svg>
);
/** the tissue nested in the body frame at MICRO_B, inside a soft circle of radius r (mm) */
const NestedMicro: React.FC<{t: number; c: Cam; r: number}> = ({t, c, r}) => {
  const mc = toMicro(c);
  const id = {m: uid('nm'), g: uid('ng')};
  const R = r / K_MICRO;
  const b = microBounds(mc.x, mc.y, mc.w, (MICRO_ROLL * Math.PI) / 180);
  const vb = {x0: Math.max(b.x0, -R), y0: Math.max(b.y0, -R), x1: Math.min(b.x1, R), y1: Math.min(b.y1, R)};
  return (
    <g transform={`translate(${MICRO_B.x} ${MICRO_B.y}) rotate(${MICRO_ROT_B}) scale(${K_MICRO})`}>
      <defs>
        <radialGradient id={id.g} cx="0.5" cy="0.5" r="0.5">
          <stop offset={0.72} stopColor="#FFF" />
          <stop offset={1} stopColor="#000" />
        </radialGradient>
        <mask id={id.m} maskUnits="userSpaceOnUse" x={-R} y={-R} width={2 * R} height={2 * R}>
          <circle cx={0} cy={0} r={R} fill={`url(#${id.g})`} />
        </mask>
      </defs>
      <g mask={`url(#${id.m})`}>
        <Micro m={microAt(t)} view={vb} />
      </g>
    </g>
  );
};
/** frost creeping in from the frame's edges (screen space): fixed dendrites, revealed by distance from the edge */
type EF = {p: P; a: number; L: number; d: number};
const EDGE: EF[] = (() => {
  const out: EF[] = [];
  for (let i = 0; i < 420; i++) {
    const side = i % 4;
    const u = hash(i * 3.1), inset = hash(i * 7.7) ** 1.7 * 330;
    const p = side === 0 ? pt(u * 1080, inset) : side === 1 ? pt(1080 - inset, u * 1920) : side === 2 ? pt(u * 1080, 1920 - inset) : pt(inset, u * 1920);
    const inward = [Math.PI / 2, Math.PI, -Math.PI / 2, 0][side];
    out.push({p, a: inward + (hash(i * 5.3) - 0.5) * 1.6, L: 14 + 46 * hash(i * 2.9), d: inset});
  }
  return out;
})();
const EdgeFrost: React.FC<{k: number}> = ({k}) => {
  if (k <= 0.01) return null;
  const reach = 340 * k;
  return (
    <svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0}}>
      <defs>
        <linearGradient id="efL" x1="0" x2="1"><stop offset={0} stopColor="#E8F4FF" stopOpacity={0.5} /><stop offset={1} stopColor="#E8F4FF" stopOpacity={0} /></linearGradient>
        <linearGradient id="efR" x1="1" x2="0"><stop offset={0} stopColor="#E8F4FF" stopOpacity={0.5} /><stop offset={1} stopColor="#E8F4FF" stopOpacity={0} /></linearGradient>
        <linearGradient id="efT" y1="0" y2="1" x1="0" x2="0"><stop offset={0} stopColor="#E8F4FF" stopOpacity={0.5} /><stop offset={1} stopColor="#E8F4FF" stopOpacity={0} /></linearGradient>
        <linearGradient id="efB" y1="1" y2="0" x1="0" x2="0"><stop offset={0} stopColor="#E8F4FF" stopOpacity={0.5} /><stop offset={1} stopColor="#E8F4FF" stopOpacity={0} /></linearGradient>
      </defs>
      <rect x={0} y={0} width={reach * 0.6} height={1920} fill="url(#efL)" />
      <rect x={1080 - reach * 0.6} y={0} width={reach * 0.6} height={1920} fill="url(#efR)" />
      <rect x={0} y={0} width={1080} height={reach * 0.6} fill="url(#efT)" />
      <rect x={0} y={1920 - reach * 0.6} width={1080} height={reach * 0.6} fill="url(#efB)" />
      {EDGE.map((f, i) => {
        const g = clamp((reach - f.d) / 90);
        if (g <= 0) return null;
        const L = f.L * g;
        let d = '';
        const e = add(f.p, mul(pt(Math.cos(f.a), Math.sin(f.a)), L));
        d += `M${f.p.x.toFixed(1)} ${f.p.y.toFixed(1)}L${e.x.toFixed(1)} ${e.y.toFixed(1)}`;
        for (const b of [0.35, 0.6, 0.82]) {
          const m = add(f.p, mul(pt(Math.cos(f.a), Math.sin(f.a)), L * b));
          for (const sg of [-1, 1]) {
            const q = add(m, mul(pt(Math.cos(f.a + sg * 0.85), Math.sin(f.a + sg * 0.85)), L * 0.3 * (1 - b * 0.6)));
            d += `M${m.x.toFixed(1)} ${m.y.toFixed(1)}L${q.x.toFixed(1)} ${q.y.toFixed(1)}`;
          }
        }
        return <path key={i} d={d} stroke="#F4FAFF" strokeWidth={2.2} strokeLinecap="round" opacity={0.8 * g} />;
      })}
    </svg>
  );
};
/** how much the camera is outside the body (light grades apply only there) */
export const extAt = (t: number) => {
  if (t < 12) return 1 - ss(t, 0.5, 0.95);
  if (t < 17) return ss(t, 14.2, 14.7);
  if (t < 20) return 1 - ss(t, 18.2, 18.6);
  return ss(t, 20.3, 20.7);
};

const inDive = (t: number) => (t > 3.7 && t < 9.0) || (t > 9.7 && t < 14.6);
const FrogWorld: React.FC<{t: number; c: Cam; local: Cam; place: Place}> = ({t, c, local, place}) => {
  const e = envAt(t);
  const f = frogAt(t);
  const a = anatomyAt(t);
  const r = microReveal(local);
  const nested = r > 0.02 && inDive(t) ? <NestedMicro t={t} c={local} r={r} /> : null;
  const fl = fallenLeavesAt(t);
  const leafStart = [toWorld({...SIT} as never, pt(12, -12.6)), toWorld({...SIT} as never, pt(-0.5, -10))];
  const P = place;
  const toLocal = (x: number) => (x - P.x) / P.s;
  return (
    <>
      <Layer c={c} delta={700} min={6} max={30}>{(x0, x1, y0, y1) => <Far e={e} x0={x0} x1={x1} y0={y0} y1={y1} />}</Layer>
      <Layer c={c} delta={110} min={1.5} max={22}>{(x0, x1) => <Mid e={e} x0={x0} x1={x1} />}</Layer>
      <Layer c={c} delta={0} max={18}>
        {(x0, x1, y0, y1) => (
          <>
            <Ground e={e} x0={x0} x1={x1} />
            {/* the leaves that slid off its back stay at the wintering spot */}
            {fl > 0 && (
              <g transform={`translate(${M.x} ${M.y}) scale(${M.s})`}>
                {leafStart.map((p, i) => {
                  const q = pt(p.x - 8 * fl - 4 * i, p.y + (-p.y - 1.5) * fl * fl);
                  return <Leaf key={i} c={q} ang={[-8, -62][i] + 70 * fl * (i ? -1 : 1)} len={[17, 13][i]} col={['#8A5A2B', '#6E4424'][i]} />;
                })}
              </g>
            )}
            <g transform={`translate(${P.x} ${P.y}) scale(${P.s})`}>
              <PocketFloor e={e} />
              <Shoots e={e} />
              {/* the contact shadow (it stays on the ground while the frog is in the air) */}
              <ellipse cx={f.root.x + 22} cy={0.6 + (place.y < 0 && t > EV.launch && t < EV.land ? -place.y / place.s * 0.0 : 0)} rx={30} ry={2.4} fill="#000" opacity={0.35 * (airborne(t) ? 0 : 1)} />
              <Frog s={f} anatomy={<><Anatomy a={{...a, camW: local.w}} />{nested}</>} />
              <SnowPack e={e} x0={toLocal(x0)} x1={toLocal(x1)} />
              <Drips e={e} t={t} />
            </g>
            {/* leaf litter kicked up by each push-off and landing */}
            {kicks().map(([tk, pl, o], k) => {
              const dt = t - tk;
              if (dt < 0 || dt > 0.7) return null;
              return (
                <g key={`kick${k}`} transform={`translate(${pl.x} ${pl.y}) scale(${pl.s})`} opacity={1 - ss(dt, 0.45, 0.7)}>
                  {Array.from({length: 8}, (_, i) => {
                    const vx = (hash(i * 3.1 + k) - 0.65) * 60, vy = -(25 + 35 * hash(i * 5.7 + k));
                    const q = pt(o.x + vx * dt, Math.min(-0.5, o.y + vy * dt + 90 * dt * dt));
                    return <Leaf key={i} c={q} ang={hash(i * 7.3 + k) * 360 + 400 * dt * (i % 2 ? 1 : -1)} len={3 + 3 * hash(i * 1.9 + k)} col={['#8A5A2B', '#A3672F', '#6E4424', '#B9853F'][i % 4]} />;
                  })}
                </g>
              );
            })}
            <Falling e={e} x0={x0} x1={x1} y0={y0} y1={y1} />
          </>
        )}
      </Layer>
    </>
  );
};

export const Scene: React.FC<{t: number; fkey: string; captions?: boolean}> = ({t: tNew, fkey, captions = true}) => {
  resetIds(fkey);
  const t = toOld(tNew); // the picture runs on the V3 clock; the subtitles on the V4 narration's own times
  const wc: WCam = camAt(t);
  const c: Cam = {x: wc.x, y: wc.y, w: wc.w};
  let body: React.ReactNode;
  if (wc.world === 'micro') body = <MicroFull t={t} c={c} roll={MICRO_ROLL} />;
  else if (covers(wc.local, MW, microReveal(wc.local) * 0.8) && microReveal(wc.local) > 0.02 && inDive(t)) body = <MicroFull t={t} c={toMicro(wc.local)} roll={MICRO_ROLL} />;
  else body = <FrogWorld t={t} c={c} local={wc.local} place={wc.place} />;
  const e = envAt(t);
  const ext = extAt(t);
  const warm = warmAt(t) * ext;
  return (
    <div style={{position: 'absolute', inset: 0, filter: 'contrast(1.04) saturate(1.05)'}}>
      {body}
      {/* light: cold blue, night, spring sun */}
      <div style={{position: 'absolute', inset: 0, background: `rgba(64,104,150,${(0.2 * e.cold * ext).toFixed(3)})`, mixBlendMode: 'multiply'}} />
      <div style={{position: 'absolute', inset: 0, background: `rgba(8,14,36,${(0.6 * e.night * ext).toFixed(3)})`}} />
      <div style={{position: 'absolute', inset: 0, opacity: warm, background: 'radial-gradient(ellipse at 18% 12%, rgba(255,214,130,0.38) 0%, rgba(255,190,110,0.12) 45%, rgba(255,180,90,0) 75%)', mixBlendMode: 'screen'}} />
      <EdgeFrost k={edgeFrostAt(t) * ext} />
      <div style={{position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 46%, rgba(0,0,0,0) 55%, rgba(4,4,10,0.42) 100%)'}} />
      {captions && <Captions t={tNew} />}
    </div>
  );
};
void EV;
