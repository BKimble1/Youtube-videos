import React from 'react';
import {C, W, H} from '../theme';
import {rand} from '../lib/anim';
import {CharacterSide, SidePose, sideFK} from '../v2/side';
import {MugSide, MUG, COFFEE, COFFEE_HI} from '../v2/props';
import {BikeWorld} from '../v2/Bike2';
import {BIKE_R, BIKE_Y, GSY, GYW, SC} from '../v2/choreo2';
import {Box, Chair} from '../film2/Plaza';
import {cl, lerp, sm} from '../film2/ui';

/** shared drawing + tiny physics for the street beats (P1 carried east, P2 the still street, P3 the wind). World px unless a component says "screen". +x is east (screen right). */
export const rotCW = (x: number, y: number, deg: number) => { const a = (deg * Math.PI) / 180; return {x: x * Math.cos(a) - y * Math.sin(a), y: x * Math.sin(a) + y * Math.cos(a)}; };

/* ------------------------------------------------------------------ hero + scarf + coffee (P1) */
export const ScarfFly: React.FC<{n: {x: number; y: number}; z: number; f: number; k?: number}> = ({n, z, f, k = 1}) => {
  const K = 9;
  const pts = Array.from({length: K}).map((_, i) => ({x: n.x - (22 + 34 * i * k) * z, y: n.y + (-5 * i + (7 + 3 * i) * Math.sin(f * 0.95 + i * 0.9)) * z, w: Math.max(24, 44 - 2 * i) * z}));
  const rev = [...pts].reverse();
  return (
    <g>
      {rev.map((p, ri) => { const i = K - 1 - ri, a = i === 0 ? n : pts[i - 1]; return <line key={`o${i}`} x1={a.x} y1={a.y} x2={p.x} y2={p.y} stroke={C.ink} strokeWidth={p.w + 8 * z} strokeLinecap="round" />; })}
      {rev.map((p, ri) => { const i = K - 1 - ri, a = i === 0 ? n : pts[i - 1]; return <line key={`i${i}`} x1={a.x} y1={a.y} x2={p.x} y2={p.y} stroke={i % 3 === 1 ? C.cream : C.coral} strokeWidth={p.w} strokeLinecap="round" />; })}
    </g>
  );
};

export const FgLamp: React.FC<{x: number; w?: number}> = ({x, w = 40}) => {
  const ax = x - 210, ay = 190;
  return (
    <g>
      <rect x={x - w / 2} y={-60} width={w} height={1780} fill={C.ink} />
      <rect x={x - w / 2 + 6} y={-60} width={7} height={1780} fill={C.inkSoft} />
      <rect x={x - w * 1.15} y={1650} width={w * 2.3} height={50} rx={8} fill={C.ink} />
      <path d={`M ${x} 330 Q ${x} ${ay} ${ax} ${ay}`} fill="none" stroke={C.ink} strokeWidth={w * 0.62} strokeLinecap="round" />
      <path d={`M ${ax - 60} ${ay + 4} h 124 l -16 56 h -92 z`} fill={C.saffron} stroke={C.ink} strokeWidth={6} strokeLinejoin="round" />
    </g>
  );
};

/** the coffee leaving the mug: one tapered ribbon that breaks into drops; screen space, emitter and direction supplied per birth frame */
export const Stream3: React.FC<{f: number; f0: number; mouth: (fb: number) => {x: number; y: number; dx: number; dy: number}; speed?: number; g?: number; scale?: number}> = ({f, f0, mouth, speed = 9, g = 1.1, scale = 1}) => {
  const K = 44, TB = 12;
  type Pt = {x: number; y: number; w: number; age: number; r: number};
  const ps: Pt[] = [];
  for (let k = 0; k < K; k++) {
    const born = f0 + 0.45 * k, age = f - born;
    if (age < 0 || age > 46) continue;
    const m = mouth(born), t = k / K;
    const sp = (speed - 4 * Math.pow(t, 1.1)) * scale;
    const post = Math.max(0, age - TB);
    const dx = (rand(k * 7 + 1) - 0.5) * 3.6 * Math.pow(post, 1.1), dy = (rand(k * 7 + 2) - 0.5) * 3.2 * Math.pow(post, 1.1);
    ps.push({x: m.x + m.dx * sp * age + dx * scale, y: m.y + m.dy * sp * age + 0.5 * g * age * age * scale + dy * scale, w: (12 + 34 * Math.pow(1 - t, 0.8)) * scale, age, r: (4 + 11 * Math.pow(rand(k * 7 + 3), 1.6)) * scale});
  }
  const rib = ps.filter((p) => p.age < TB).sort((a, b) => a.age - b.age);
  const drops = ps.filter((p) => p.age >= TB);
  let ribbon: React.ReactNode = null;
  if (rib.length > 3) {
    const Ls: {x: number; y: number}[] = [], Rs: {x: number; y: number}[] = [];
    rib.forEach((p, i) => {
      const a = rib[Math.max(0, i - 1)], b = rib[Math.min(rib.length - 1, i + 1)];
      let nx = -(b.y - a.y), ny = b.x - a.x; const len = Math.hypot(nx, ny) || 1; nx /= len; ny /= len;
      const h = (p.w * Math.pow(Math.max(0, 1 - p.age / TB), 0.65)) / 2;
      Ls.push({x: p.x + nx * h, y: p.y + ny * h}); Rs.push({x: p.x - nx * h, y: p.y - ny * h});
    });
    const d = `M ${Ls.map((p) => `${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' L ')} L ${[...Rs].reverse().map((p) => `${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' L ')} Z`;
    ribbon = <g><path d={d} fill={COFFEE} stroke={C.ink} strokeWidth={3} strokeLinejoin="round" /><path d={`M ${Ls.slice(0, -2).map((p) => `${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' L ')}`} fill="none" stroke={COFFEE_HI} strokeWidth={3} strokeLinecap="round" opacity={0.7} /></g>;
  }
  return (
    <g>
      {ribbon}
      {drops.map((p, i) => <ellipse key={i} cx={p.x} cy={p.y} rx={p.r * 1.5} ry={p.r} fill={COFFEE} stroke={p.r > 8 ? C.ink : 'none'} strokeWidth={2.4} />)}
    </g>
  );
};

/* ------------------------------------------------------------------ tiny physics: pure function of the frame (step-integrated) */
export type Hit = {x: number; vxK: number; vy: number; spin: number};
export type Body = {x0: number; y0: number; vx: number; vy: number; spin: number; g: number; floor: number; e: number; fr: number; t0: number; hits?: Hit[]; rollR?: number; roll?: number /* per-frame speed factor while on the floor */};
export type BodyState = {x: number; y: number; rot: number; vx: number; vy: number; on: boolean; events: {t: number; x: number; y: number; kind: 'floor' | 'hit'}[]; hitT: number[]};
export const simBody = (b: Body, f: number): BodyState => {
  let x = b.x0, y = b.y0, vx = b.vx, vy = b.vy, rot = 0, sp = b.spin, t = b.t0, on = false;
  const events: BodyState['events'] = [], hitT: number[] = [];
  const hits = (b.hits ?? []).map((h) => ({...h, done: false}));
  if (f <= b.t0) return {x, y, rot, vx, vy, on, events, hitT};
  while (t < f - 1e-9) {
    const dt = Math.min(1, f - t);
    x += vx * dt; y += vy * dt; vy += b.g * dt; rot += sp * dt;
    for (const h of hits) if (!h.done && x >= h.x) { h.done = true; vx *= h.vxK; vy = h.vy; sp += h.spin; events.push({t: t + dt, x, y, kind: 'hit'}); hitT.push(t + dt); }
    on = false;
    if (y >= b.floor) {
      y = b.floor; on = true;
      if (vy > 2.5) { events.push({t: t + dt, x, y, kind: 'floor'}); vy = -vy * b.e; vx *= b.fr; sp *= 0.72; } else { vy = 0; vx *= b.roll ?? b.fr * 0.985; sp *= 0.86; }
    }
    if (b.rollR && on) rot = (x - b.x0) / b.rollR * (180 / Math.PI);
    t += dt;
  }
  return {x, y, rot, vx, vy, on, events, hitT};
};

/* ------------------------------------------------------------------ objects (world px, drawn about their centre) */
export const DrawBox: React.FC<{x: number; y: number; rot: number; s?: number}> = ({x, y, rot, s = 1.3}) => (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s}) translate(0 38)`}><Box /></g>
);
export const DrawChair: React.FC<{x: number; y: number; rot: number; s?: number}> = ({x, y, rot, s = 1.2}) => (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s}) translate(0 70)`}><Chair /></g>
);
export const DrawBike: React.FC<{x: number; y: number; rot: number; ang: number}> = ({x, y, rot, ang}) => (
  <g transform={`translate(${x} ${y}) rotate(${rot}) translate(0 ${BIKE_R - BIKE_Y})`}><BikeWorld f={0} at={{x: 0, ang, tilt: 0}} /></g>
);
export const DrawMug: React.FC<{x: number; y: number; rot: number; s?: number}> = ({x, y, rot, s = 1.3}) => (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s}) translate(${-MUG.cx} ${-MUG.cy})`}>
    <g transform="translate(0 0)"><MugSide tilt={0} sc={1} /></g>
  </g>
);
export const DrawBin: React.FC<{x: number; y: number; rot: number; s?: number}> = ({x, y, rot, s = 1.4}) => (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
    <path d="M -36 -52 L 36 -52 L 30 52 Q 30 58 24 58 L -24 58 Q -30 58 -30 52 Z" fill={C.teal} stroke={C.ink} strokeWidth={5} strokeLinejoin="round" />
    {[-14, 0, 14].map((xx) => <line key={xx} x1={xx} y1={-40} x2={xx * 0.85} y2={44} stroke={C.tealDeep} strokeWidth={5} strokeLinecap="round" />)}
    <rect x={-42} y={-66} width={84} height={18} rx={7} fill={C.tealDeep} stroke={C.ink} strokeWidth={5} />
    <rect x={-8} y={-78} width={16} height={14} rx={5} fill={C.ink} />
  </g>
);
export const DrawPot: React.FC<{x: number; y: number; rot: number; s?: number}> = ({x, y, rot, s = 1.3}) => (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
    <path d="M -34 -20 L 34 -20 L 26 44 Q 25 50 18 50 L -18 50 Q -25 50 -26 44 Z" fill="#E0834F" stroke={C.ink} strokeWidth={5} strokeLinejoin="round" />
    <rect x={-40} y={-34} width={80} height={18} rx={7} fill="#C9693A" stroke={C.ink} strokeWidth={5} />
    {[-24, -8, 10, 26].map((a, i) => <path key={i} d={`M ${a * 0.3} -32 Q ${a * 1.6} ${-80 - (i % 2) * 24} ${a * 2.2} ${-60 - (i % 2) * 10}`} fill="none" stroke={C.ink} strokeWidth={13} strokeLinecap="round" />)}
    {[-24, -8, 10, 26].map((a, i) => <path key={`g${i}`} d={`M ${a * 0.3} -32 Q ${a * 1.6} ${-80 - (i % 2) * 24} ${a * 2.2} ${-60 - (i % 2) * 10}`} fill="none" stroke={i % 2 ? C.tealLight : C.teal} strokeWidth={7} strokeLinecap="round" />)}
  </g>
);
export const DrawSheet: React.FC<{x: number; y: number; rot: number; s?: number; kind?: number; k?: number}> = ({x, y, rot, s = 1, kind = 0, k = 0}) => (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s}) skewX(${Math.sin(k * 0.8) * 24})`}>
    {kind === 0 && <g><rect x={-28} y={-20} width={56} height={40} fill={C.white} stroke={C.ink} strokeWidth={4} />{[-9, 1, 11].map((yy) => <line key={yy} x1={-20} y1={yy} x2={20} y2={yy} stroke={C.inkMuted} strokeWidth={3} />)}</g>}
    {kind === 1 && <g><path d="M -22 -16 L 24 -20 L 20 18 L -26 14 Z" fill={C.saffronLight} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" /><line x1={-14} y1={-4} x2={14} y2={-6} stroke={C.coralDeep} strokeWidth={3} /></g>}
    {kind === 2 && <path d="M -22 0 Q 0 -18 22 0 Q 0 16 -22 0 Z" fill={C.teal} stroke={C.ink} strokeWidth={3} />}
  </g>
);

/** screen-space speed lines behind a moving thing: three short lines trailing opposite to its velocity */
export const Trail: React.FC<{x: number; y: number; vx: number; vy: number; len?: number; col?: string; w?: number}> = ({x, y, vx, vy, len = 3, col = C.cream, w = 5}) => {
  const sp = Math.hypot(vx, vy); if (sp < 6) return null;
  const ux = -vx / sp, uy = -vy / sp, L = Math.min(260, sp * len);
  return (
    <g opacity={0.85}>
      {[-1, 0, 1].map((i) => <line key={i} x1={x + ux * 30 - uy * i * 22} y1={y + uy * 30 + ux * i * 22} x2={x + ux * (30 + L * (1 - Math.abs(i) * 0.3)) - uy * i * 22} y2={y + uy * (30 + L * (1 - Math.abs(i) * 0.3)) + ux * i * 22} stroke={col} strokeWidth={w} strokeLinecap="round" />)}
    </g>
  );
};

/** wind palm: trunk bends east, fronds stream east and flutter. Base at (x, baseY). */
export const PalmWind: React.FC<{x: number; baseY: number; h: number; k: number; f: number; seed: number; shake?: number}> = ({x, baseY, h, k, f, seed, shake = 0}) => {
  const lean = ((6 + 40 * k) * Math.PI) / 180, sway = Math.sin(f * 0.11 + seed) * (1.2 + 3.4 * k) * Math.PI / 180 + (shake * Math.PI) / 180;
  const top = {x: x + h * Math.sin(lean + sway), y: baseY - h * Math.cos(lean + sway)};
  const mid = {x: x + h * 0.5 * Math.sin(lean * 0.4), y: baseY - h * 0.52};
  const fl = (i: number) => Math.sin(f * (0.55 + 0.06 * i) + i * 1.7 + seed) * (3 + 11 * k);
  const base = [-172, -142, -108, -72, -38, -6, 24, 158];
  return (
    <g>
      <path d={`M ${x - 17} ${baseY} Q ${mid.x - 18} ${mid.y} ${top.x - 13} ${top.y} L ${top.x + 13} ${top.y} Q ${mid.x + 18} ${mid.y} ${x + 17} ${baseY} Z`} fill={C.woodLight} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
      {[0.2, 0.36, 0.52, 0.68, 0.84].map((t) => <line key={t} x1={lerp(x - 16, top.x - 12, t * t)} y1={lerp(baseY, top.y, t)} x2={lerp(x + 16, top.x + 12, t * t)} y2={lerp(baseY, top.y, t) - 4} stroke={C.woodDeep} strokeWidth={4} />)}
      {base.map((a0, i) => {
        const aw = ((a0 + 540) % 360) - 180;
        const a = aw + (-6 - aw) * 0.8 * k + fl(i);
        const r = (150 + 24 * (i % 2)) * (1 + 0.2 * k);
        const ux = Math.cos((a * Math.PI) / 180), uy = Math.sin((a * Math.PI) / 180);
        const droop = r * 0.34 * (1 - 0.85 * k);
        const tip = {x: top.x + ux * r, y: top.y + uy * r + droop};
        const nx = -uy, ny = ux, wd = 32;
        const c1 = {x: top.x + ux * r * 0.5 + nx * wd, y: top.y + uy * r * 0.5 + ny * wd - r * 0.12 + droop * 0.2};
        const c2 = {x: top.x + ux * r * 0.5 - nx * wd, y: top.y + uy * r * 0.5 - ny * wd - r * 0.04 + droop * 0.5};
        return <path key={i} d={`M ${top.x} ${top.y} Q ${c1.x} ${c1.y} ${tip.x} ${tip.y} Q ${c2.x} ${c2.y} ${top.x} ${top.y + 6}  Z`} fill={i % 2 ? C.tealLight : C.teal} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />;
      })}
      <circle cx={top.x} cy={top.y + 6} r={15} fill={C.woodDeep} stroke={C.ink} strokeWidth={3} />
    </g>
  );
};

export const Lamp3: React.FC<{x: number; wob?: number}> = ({x, wob = 0}) => (
  <g transform={`rotate(${wob} ${x} 1235)`}>
    <rect x={x - 9} y={640} width={18} height={1235 - 640} fill={C.ink} />
    <rect x={x - 20} y={1215} width={40} height={24} rx={5} fill={C.ink} />
    <path d={`M ${x} 650 q 0 -70 78 -70`} fill="none" stroke={C.ink} strokeWidth={13} strokeLinecap="round" />
    <path d={`M ${x + 44} 580 h 78 l -12 38 h -56 z`} fill={C.saffron} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
  </g>
);
void cl; void sm; void W; void H; void GSY; void GYW; void SC; void CharacterSide; void sideFK;
export type {SidePose};
