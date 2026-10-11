import React from 'react';
import {C, H, W} from '../theme';
import {rand} from '../lib/anim';
import {EVT, GY, STREAM_AGE, V0, camX, coffee, footX, grounded, hipX, hipY, neckWorld, theta, vHip} from './choreo';
import {SC} from './rig';

/** Everything below is in WORLD coordinates and drawn inside a camera-translated group, so world-fixed marks (dust, skid, splats) stay put while the hero and the camera move on. */
const WorldSvg: React.FC<{f: number; children: React.ReactNode}> = ({f, children}) => (
  <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute', left: 0, top: 0}}>
    <g transform={`translate(${-camX(f)} 0)`}>{children}</g>
  </svg>
);

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

/* ------------------------------------------------------------------ dust, skid marks, ground shadow, speed streaks, scarf (behind the hero) */
const Puff: React.FC<{x: number; y: number; age: number; seed: number}> = ({x, y, age, seed}) => {
  const life = 24;
  if (age < 0 || age > life) return null;
  const k = age / life;
  const r = 24 + age * 2.9;
  const o = 1 - k * k;
  const dx = (rand(seed) - 0.5) * 26;
  const rise = age * 0.7;
  const pts: [number, number, number, string][] = [
    [-0.6 * r + dx, 0, 0.8, '#FFFFFF'],
    [0.35 * r + dx, -0.45 * r, 1, '#FFFFFF'],
    [0.7 * r + dx, 0.1 * r, 0.7, '#FFFFFF'],
  ];
  return (
    <g opacity={o} transform={`translate(${x} ${y - rise})`}>
      {pts.map(([px, py, s], i) => (
        <circle key={`o${i}`} cx={px} cy={py} r={r * s * 0.7 + 4.5} fill={C.ink} />
      ))}
      {pts.map(([px, py, s], i) => (
        <circle key={`s${i}`} cx={px} cy={py + r * 0.12} r={r * s * 0.7} fill="#CDB98C" />
      ))}
      {pts.map(([px, py, s, fill], i) => (
        <circle key={`f${i}`} cx={px - r * 0.06} cy={py - r * 0.1} r={r * s * 0.62} fill={fill} />
      ))}
    </g>
  );
};

export const BehindFx: React.FC<{f: number; streaks?: boolean}> = ({f, streaks = true}) => {
  // emission frames of dust puffs: planted skid before launch, landing burst, then a skid trail
  const emit: number[] = [-8, -6, -4, -2, 0, 2, 4, 6, 8, EVT.land, EVT.land, EVT.land + 2];
  for (let e = EVT.land + 4; e <= EVT.skid_out; e += 3) emit.push(e);
  const hx = hipX(f);
  const hy = hipY(f);
  const v = vHip(f);
  const air = grounded(f) ? 0 : 1;
  // skid marks (world-fixed): planted skid, then landing skid
  const skidA = {x0: footX(-10), x1: footX(EVT.launch - 1)};
  const skidB = {x0: footX(EVT.land), x1: footX(Math.min(f, EVT.skid_out))};
  // ground shadow
  const height = Math.max(0, GY - 9 - (hy + 150 * SC - 150 * SC + 144 * SC)); // hips above the standing hip height
  const sh = clamp01(1 - height / 260);
  const shadowX = hx - 20 + 90 * Math.sin((theta(f) * Math.PI) / 180);
  // scarf: follow-the-leader ribbon from the neck
  const K = 10;
  const pts = Array.from({length: K}).map((_, k) => {
    const t = f - 1.25 * k;
    const n = neckWorld(t);
    return {x: n.x, y: n.y + 2.4 * k + (4 + 2.6 * k) * Math.sin(0.62 * t + 0.9 * k), w: Math.max(32, 50 - 1.7 * k)};
  });
  const streakY = [-260, -170, -90, 0, 90, 190];
  const streakL = [260, 180, 300, 220, 160, 240];
  return (
    <WorldSvg f={f}>
      <path d={`M ${skidA.x0} ${GY - 3} L ${skidA.x1} ${GY - 3}`} stroke={C.ink} strokeWidth={11} strokeLinecap="round" opacity={0.4} />
      <path d={`M ${skidA.x0 + 20} ${GY + 10} L ${skidA.x1} ${GY + 10}`} stroke={C.ink} strokeWidth={8} strokeLinecap="round" opacity={0.3} />
      {f > EVT.land && <path d={`M ${skidB.x0} ${GY - 3} L ${skidB.x1} ${GY - 3}`} stroke={C.ink} strokeWidth={11} strokeLinecap="round" opacity={0.4} />}
      {f > EVT.land && <path d={`M ${skidB.x0 + 20} ${GY + 10} L ${skidB.x1} ${GY + 10}`} stroke={C.ink} strokeWidth={8} strokeLinecap="round" opacity={0.3} />}
      <ellipse cx={shadowX} cy={GY + 3} rx={120 - 34 * (1 - sh)} ry={15} fill={C.shadow} opacity={0.3 + 0.7 * sh} />
      {emit.map((e, i) => (
        <Puff key={i} x={footX(e) - 22} y={GY - 16} age={f - e} seed={i * 7 + e + 40} />
      ))}
      {streaks &&
        streakY.map((dy, i) => {
          const len = streakL[i] * clamp01(v / V0);
          if (len < 20) return null;
          const x1 = hx - 250 - i * 14;
          return <line key={i} x1={x1 - len} y1={hy + dy} x2={x1} y2={hy + dy} stroke={C.inkSoft} strokeWidth={11} strokeLinecap="round" opacity={0.55 * clamp01(v / V0)} />;
        })}
      {/* scarf tail (behind the body): full-width flared end with stripes and fringe, so it reads as a scarf, not a stick */}
      {[...pts].reverse().map((p, ri) => {
        const k = K - 1 - ri;
        const q = k === 0 ? pts[0] : pts[k - 1];
        return <line key={`o${k}`} x1={q.x} y1={q.y} x2={p.x} y2={p.y} stroke={C.ink} strokeWidth={p.w + 8} strokeLinecap={k === K - 1 ? 'butt' : 'round'} />;
      })}
      {[...pts].reverse().map((p, ri) => {
        const k = K - 1 - ri;
        const q = k === 0 ? pts[0] : pts[k - 1];
        return <line key={`i${k}`} x1={q.x} y1={q.y} x2={p.x} y2={p.y} stroke={k % 3 === 1 ? C.cream : C.coral} strokeWidth={p.w} strokeLinecap={k === K - 1 ? 'butt' : 'round'} />;
      })}
      {[-1, 0, 1].map((i) => {
        const e = pts[K - 1];
        const q = pts[K - 2];
        const dx = e.x - q.x;
        const dy = e.y - q.y;
        const L = Math.hypot(dx, dy) || 1;
        const ux = dx / L, uy = dy / L;
        const nx = -uy, ny = ux;
        return <line key={`fr${i}`} x1={e.x + nx * i * 11} y1={e.y + ny * i * 11} x2={e.x + ux * 20 + nx * i * 15} y2={e.y + uy * 20 + ny * i * 15} stroke={C.ink} strokeWidth={5} strokeLinecap="round" />;
      })}
      {air > 2 && null}
    </WorldSvg>
  );
};

/* ------------------------------------------------------------------ coffee ribbon, droplets, splats, scarf wrap (in front of the hero) */
const COFFEE = '#33200F'; // darker than her skin (#8D5A3C) and the paving, so the jet never reads as an arm or a stick
const COFFEE_HI = '#B9824A';
export const FrontFx: React.FC<{f: number}> = ({f}) => {
  const ds = coffee(f);
  const stream = ds.filter((d) => !d.landed && d.age < STREAM_AGE).sort((a, b) => b.k - a.k); // newest (near the cup) first
  const rest = ds.filter((d) => !d.landed && d.age >= STREAM_AGE);
  const landed = ds.filter((d) => d.landed);
  const n = neckWorld(f);
  const th = theta(f);
  const wd = (d: {age: number}) => Math.max(15, 44 - d.age * 1.6);
  const bead = (d: {k: number; age: number}) => (wd(d) / 2) * (1.0 + 0.13 * Math.sin(d.k * 2.7));
  return (
    <WorldSvg f={f}>
      {/* splats on the pavement: varied stains with a lighter wet edge, world-fixed */}
      {landed.map((d) => {
        const rx = 14 + (d.k % 5) * 3.5 + d.r * 0.5;
        const ry = 5 + (d.k % 3) * 1.6;
        const jy = ((d.k * 7) % 5) - 2;
        return (
          <g key={`l${d.k}`}>
            <ellipse cx={d.x} cy={d.y + 2 + jy} rx={rx + 7} ry={ry + 4} fill="#7A4E2B" stroke={C.ink} strokeWidth={3} />
            <ellipse cx={d.x} cy={d.y + 1 + jy} rx={rx} ry={ry} fill={COFFEE} />
          </g>
        );
      })}
      {/* splash crown for a few frames after each drop lands */}
      {landed.filter((d) => d.sinceLand >= 0 && d.sinceLand < 9).map((d) =>
        [-3.2, 0.9, 3.8].map((vx, i) => {
          const t = d.sinceLand;
          const vy = [8, 11, 7][i];
          return <circle key={`c${d.k}-${i}`} cx={d.x + vx * t * 1.4} cy={d.y - (vy * t - 0.9 * 0.5 * t * t)} r={5.5 - t * 0.35} fill={COFFEE} stroke={C.ink} strokeWidth={2.5} />;
        }),
      )}
      {/* the stream: outline pass, then body (a chain of beads so it reads as liquid, not a rope), then gloss */}
      {stream.length > 1 && (
        <g>
          {stream.slice(1).map((d, i) => {
            const p = stream[i];
            return <line key={`so${d.k}`} x1={p.x} y1={p.y} x2={d.x} y2={d.y} stroke={C.ink} strokeWidth={wd(d) * 0.85 + 8} strokeLinecap="round" />;
          })}
          {stream.map((d) => (
            <circle key={`bo${d.k}`} cx={d.x} cy={d.y} r={bead(d) + 4.5} fill={C.ink} />
          ))}
          {stream.slice(1).map((d, i) => {
            const p = stream[i];
            return <line key={`si${d.k}`} x1={p.x} y1={p.y} x2={d.x} y2={d.y} stroke={COFFEE} strokeWidth={wd(d) * 0.85} strokeLinecap="round" />;
          })}
          {stream.map((d) => (
            <circle key={`bf${d.k}`} cx={d.x} cy={d.y} r={bead(d)} fill={COFFEE} />
          ))}
          {stream.map((d) => (
            <ellipse key={`bh${d.k}`} cx={d.x - bead(d) * 0.28} cy={d.y - bead(d) * 0.36} rx={bead(d) * 0.34} ry={bead(d) * 0.2} fill={COFFEE_HI} opacity={0.9} transform={`rotate(-18 ${d.x} ${d.y})`} />
          ))}
        </g>
      )}
      {/* free droplets */}
      {rest.map((d) => {
        const r = Math.max(7, d.r * (1 - (d.age - STREAM_AGE) / 60));
        return (
          <g key={`d${d.k}`}>
            <circle cx={d.x} cy={d.y} r={r + 3.5} fill={C.ink} />
            <circle cx={d.x} cy={d.y} r={r} fill={COFFEE} />
            <ellipse cx={d.x - r * 0.3} cy={d.y - r * 0.38} rx={r * 0.32} ry={r * 0.2} fill={COFFEE_HI} opacity={0.9} />
          </g>
        );
      })}
      {/* scarf wrap over the collar */}
      <g transform={`translate(${n.x} ${n.y}) rotate(${th})`}>
        <ellipse cx={0} cy={4} rx={50} ry={20} fill={C.coral} stroke={C.ink} strokeWidth={4} />
        <path d="M -30 8 Q 0 24 30 8" fill="none" stroke={C.coralDeep} strokeWidth={5} strokeLinecap="round" />
      </g>
    </WorldSvg>
  );
};
