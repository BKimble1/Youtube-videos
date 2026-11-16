// The original game shown on the screen: a bright third-person paint-blaster arena. The player's avatar "Zip" (a
// round orange robot) is seen from behind; purple goo-bots hover in the arena; a white crosshair aims. In versus
// mode the opponent is "Rex", a green robot. Everything is drawn in a 640×400 screen box and is a pure function of
// the GameState the gameplay script computes. No text anywhere; the only symbols are the W/A/S/D keys (scene 5).
import React from 'react';
import {clamp, lerp, hash, smoothPath, P} from '../lib';

export type Enemy = {id: number; x: number; z: number; hover: number; hit: number; alive: number; spawn: number; wob: number};
export type Orb = {x: number; z: number; a: number}; // world position of an incoming enemy shot, a = alpha
export type Shot = {from: P; to: P; u: number}; // a paint ball in screen space, u 0..1 along its flight
export type GameState = {
  t: number;
  camX: number; // the camera follows Zip laterally (world units)
  zipScreen: number; // Zip's screen offset from centre (px) while he strafes
  zipLean: number; // -1..1 lean into the strafe
  run: number; // run-cycle phase
  runAmt: number; // 0..1 how hard he is running
  fwd: number; // forward distance travelled (tile scroll)
  cross: P; // crosshair, screen px
  lock: number; // 0..1 lock-on ring
  recoil: number; // 0..1 blaster recoil
  enemies: Enemy[];
  orbs: Orb[];
  shots: Shot[];
  splats: {x: number; y: number; s: number; age: number; seed: number; col?: string}[];
  keys?: {w: number; a: number; s: number; d: number} | null;
  rex?: {x: number; z: number; hit: number; fire: number; alive: number} | null;
  win?: number; // 0..1 victory flourish
  wipe?: number; // 0..1 round reset wipe
  muzzle?: number; // 0..1 muzzle flash
  hitMark?: number; // 0..1 hit marker at the crosshair
  shake?: P; // screen shake offset (px)
  hop?: number; // Zip's victory hop (px up)
  charge?: number; // 0..1 the blaster charging before the winning shot
  confetti?: number; // seconds since the K.O. pop (< 0: none)
  flinch?: number; // 0..1 Rex flinching from a tag
  winX?: number; // screen x where the trophy rises (above Zip)
};
export type Ext = {t: number; b: number; l: number; r: number};
const NOEXT: Ext = {t: 0, b: 0, l: 0, r: 0};

const HZ = 148; // horizon (px)
const F = 300; // focal length
const CAM_H = 1.6;
export const projectG = (camX: number, x: number, z: number, y = 0) => {
  const s = F / Math.max(z, 0.3);
  return {x: 320 + (x - camX) * s * 0.5 * 2, y: HZ + (CAM_H - y) * s * 0.5, s};
};

const INK = '#162A32';
const ZIP = {body: '#FF8A3D', shade: '#D9622A', light: '#FFC08A', visor: '#2EC7D6', dark: '#2B2B33'};
const GOO = {body: '#9B5DE5', shade: '#6F3CB8', light: '#C9A2F5'};
const REX = {body: '#4FC36A', shade: '#2F8F4A', light: '#A8EBB3'};

const Ink: React.FC<{d: string; fill: string; w?: number; o?: number}> = ({d, fill, w = 2.4, o = 1}) => (
  <path d={d} fill={fill} stroke={INK} strokeWidth={w} strokeLinejoin="round" opacity={o} />
);

const Floor: React.FC<{g: GameState; id: string; e: Ext}> = ({g, id, e}) => {
  // perspective tiles; the vanishing point shifts with the lateral camera so strafing reads
  const lines: React.ReactNode[] = [];
  for (let k = -14; k <= 14; k++) {
    const wx = k * 1.2 - ((g.camX % 1.2) + 1.2) % 1.2;
    const a = projectG(0, wx, 0.25), b = projectG(0, wx, 60);
    lines.push(<line key={`v${k}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} />);
  }
  for (let k = 0; k < 30; k++) {
    const z = 0.3 + ((k * 1.4 - (g.fwd % 1.4) + 1.4 * 30) % (1.4 * 30));
    const p = projectG(0, 0, z);
    lines.push(<line key={`h${k}`} x1={-e.l} y1={p.y} x2={640 + e.r} y2={p.y} opacity={clamp(1 - z / 34)} />);
  }
  return (
    <g>
      <defs>
        <linearGradient id={`${id}-fl`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#B9E9DA" />
          <stop offset="1" stopColor="#5CC4A8" />
        </linearGradient>
      </defs>
      <rect x={-e.l} y={HZ} width={640 + e.l + e.r} height={400 - HZ + e.b} fill={`url(#${id}-fl)`} />
      <g stroke="#3FA58C" strokeWidth={1.6} opacity={0.55}>{lines}</g>
    </g>
  );
};

const Sky: React.FC<{g: GameState; id: string; e: Ext}> = ({g, id, e}) => {
  const par = -g.camX * 6;
  const isl = [
    {x: 90, y: 80, w: 120, c: '#C8B6F2'},
    {x: 330, y: 58, w: 90, c: '#D7C9F7'},
    {x: 520, y: 96, w: 140, c: '#BBA6EE'},
    {x: 760, y: 70, w: 110, c: '#CDBDF4'},
    {x: -150, y: 64, w: 100, c: '#D7C9F7'},
  ];
  return (
    <g>
      <defs>
        <linearGradient id={`${id}-sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#7CCBFF" />
          <stop offset="1" stopColor="#FFE3B3" />
        </linearGradient>
      </defs>
      <rect x={-e.l} y={-e.t} width={640 + e.l + e.r} height={HZ + 2 + e.t} fill={`url(#${id}-sky)`} />
      <circle cx={500 + par * 0.3} cy={46} r={22} fill="#FFF6D6" />
      {isl.map((q, i) => {
        const x = ((q.x + par * (0.5 + i * 0.1)) % 1400 + 1400) % 1400 - 380;
        return (
          <g key={i} transform={`translate(${x} ${q.y + Math.sin(g.t * 0.9 + i) * 3})`}>
            <path d={`M ${-q.w / 2} 0 Q 0 ${-q.w * 0.28} ${q.w / 2} 0 L ${q.w * 0.18} ${q.w * 0.22} Q 0 ${q.w * 0.34} ${-q.w * 0.18} ${q.w * 0.22} Z`} fill={q.c} />
          </g>
        );
      })}
      {/* far arena wall */}
      <rect x={-e.l} y={HZ - 16} width={640 + e.l + e.r} height={18} fill="#F7A9C4" />
      {Array.from({length: 40}).map((_, i) => {
        const x = ((i * 48 - g.camX * 22) % 1920 + 1920) % 1920 - 640;
        return <rect key={i} x={x} y={HZ - 16} width={22} height={18} fill="#FFD27A" opacity={0.85} />;
      })}
    </g>
  );
};

/** cover blocks placed in the arena (world positions) */
const BLOCKS = [
  {x: -5.2, z: 9, w: 2.0, h: 1.4, c: '#FF7A6B'},
  {x: 4.6, z: 12, w: 2.4, h: 1.8, c: '#FFC744'},
  {x: -2.0, z: 20, w: 3.0, h: 2.2, c: '#4FB6E8'},
  {x: 7.5, z: 24, w: 2.2, h: 1.6, c: '#FF7A6B'},
  {x: -9.0, z: 16, w: 2.6, h: 2.0, c: '#FFC744'},
];
const Blocks: React.FC<{g: GameState}> = ({g}) => (
  <g>
    {[...BLOCKS].sort((a, b) => b.z - a.z).map((b, i) => {
      const z = b.z - (g.fwd % 30);
      const zz = z < 4 ? z + 30 : z;
      const p0 = projectG(g.camX, b.x - b.w / 2, zz), p1 = projectG(g.camX, b.x + b.w / 2, zz, b.h);
      const top = projectG(g.camX, b.x - b.w / 2, zz + 1.2, b.h), top1 = projectG(g.camX, b.x + b.w / 2, zz + 1.2, b.h);
      const o = clamp((34 - zz) / 6);
      return (
        <g key={i} opacity={o}>
          <ellipse cx={(p0.x + p1.x) / 2} cy={p0.y + 2} rx={(p1.x - p0.x) * 0.62} ry={(p1.x - p0.x) * 0.1} fill="#2B6E5E" opacity={0.25} />
          <path d={`M${p0.x},${p1.y} L${top.x},${top.y} L${top1.x},${top1.y} L${p1.x},${p1.y} Z`} fill="#FFFFFF" opacity={0.55} stroke={INK} strokeWidth={2} strokeLinejoin="round" />
          <rect x={p0.x} y={p1.y} width={p1.x - p0.x} height={p0.y - p1.y} rx={(p1.x - p0.x) * 0.08} fill={b.c} stroke={INK} strokeWidth={2.2} />
          <rect x={p0.x + (p1.x - p0.x) * 0.12} y={p1.y + (p0.y - p1.y) * 0.18} width={(p1.x - p0.x) * 0.76} height={(p0.y - p1.y) * 0.12} rx={2} fill="#FFFFFF" opacity={0.35} />
        </g>
      );
    })}
  </g>
);

const GooBot: React.FC<{e: Enemy; g: GameState}> = ({e, g}) => {
  if (e.alive <= 0.001) return null;
  const p = projectG(g.camX, e.x, e.z, 0.9 + e.hover);
  const r = p.s * 0.55;
  const squash = 1 + 0.25 * Math.sin(e.hit * Math.PI);
  const wob = Math.sin(g.t * 7 + e.wob) * 0.06;
  const k = e.hit > 0 ? 1 - e.hit : 1;
  const sh = projectG(g.camX, e.x, e.z, 0);
  return (
    <g opacity={e.alive}>
      <ellipse cx={sh.x} cy={sh.y} rx={r * 0.8} ry={r * 0.18} fill="#2B6E5E" opacity={0.25 * k} />
      <g transform={`translate(${p.x} ${p.y}) scale(${(1 + wob) * k * (e.spawn)} ${(1 - wob) * k * e.spawn / squash})`}>
        <path d={`M ${-r} ${r * 0.45} Q ${-r * 1.05} ${-r * 1.1} 0 ${-r * 1.1} Q ${r * 1.05} ${-r * 1.1} ${r} ${r * 0.45} Q ${r * 0.5} ${r * 0.75} 0 ${r * 0.5} Q ${-r * 0.5} ${r * 0.75} ${-r} ${r * 0.45} Z`} fill={GOO.body} stroke={INK} strokeWidth={2.2} strokeLinejoin="round" />
        <path d={`M ${-r * 0.7} ${-r * 0.55} Q ${-r * 0.5} ${-r * 0.95} ${-r * 0.05} ${-r * 0.95}`} fill="none" stroke={GOO.light} strokeWidth={Math.max(2, r * 0.12)} strokeLinecap="round" />
        <circle cx={0} cy={-r * 0.2} r={r * 0.38} fill="#FFFFFF" stroke={INK} strokeWidth={2} />
        <circle cx={0} cy={-r * 0.16} r={r * 0.18} fill={INK} />
        <line x1={0} y1={-r * 1.1} x2={r * 0.2} y2={-r * 1.5} stroke={INK} strokeWidth={2} />
        <circle cx={r * 0.2} cy={-r * 1.55} r={r * 0.12} fill="#FFC744" stroke={INK} strokeWidth={1.6} />
      </g>
    </g>
  );
};

const Rex: React.FC<{r: NonNullable<GameState['rex']>; g: GameState}> = ({r, g}) => {
  const p = projectG(g.camX, r.x, r.z, 0);
  const s = p.s * 0.95;
  // K.O.: knocked back (slides away and up a little), spins once and lands on his back
  const k = clamp(r.hit / 0.45);
  const fall = 1 - Math.pow(1 - k, 3);
  const flinch = g.flinch ?? 0;
  const kx = fall * s * 0.6 + Math.sin(flinch * Math.PI) * s * 0.12, ky = -Math.sin(k * Math.PI) * s * 0.7;
  return (
    <g opacity={r.alive} transform={`translate(${p.x + kx} ${p.y + ky}) rotate(${fall * 270 + Math.sin(flinch * Math.PI) * 12}) scale(${1 + 0.15 * Math.sin(flinch * Math.PI)} ${1 - 0.12 * Math.sin(flinch * Math.PI)}) translate(${-p.x} ${-p.y})`}>
      <ellipse cx={p.x} cy={p.y} rx={s * 0.7} ry={s * 0.14} fill="#2B6E5E" opacity={0.3} />
      <g transform={`translate(${p.x} ${p.y - s * 0.1 * Math.abs(Math.sin(g.t * 9))})`}>
        <rect x={-s * 0.32} y={-s * 0.45} width={s * 0.18} height={s * 0.45} rx={s * 0.06} fill={REX.shade} stroke={INK} strokeWidth={2} />
        <rect x={s * 0.14} y={-s * 0.45} width={s * 0.18} height={s * 0.45} rx={s * 0.06} fill={REX.shade} stroke={INK} strokeWidth={2} />
        <rect x={-s * 0.55} y={-s * 1.55} width={s * 1.1} height={s * 1.15} rx={s * 0.45} fill={REX.body} stroke={INK} strokeWidth={2.4} />
        <rect x={-s * 0.36} y={-s * 1.32} width={s * 0.72} height={s * 0.32} rx={s * 0.16} fill={INK} />
        {r.hit > 0.05 || flinch > 0.3 ? (
          <g stroke="#B6FF6B" strokeWidth={Math.max(1.5, s * 0.04)} strokeLinecap="round">
            {[-1, 1].map((d) => <g key={d}><line x1={d * s * 0.14 - s * 0.06} y1={-s * 1.22} x2={d * s * 0.14 + s * 0.06} y2={-s * 1.1} /><line x1={d * s * 0.14 + s * 0.06} y1={-s * 1.22} x2={d * s * 0.14 - s * 0.06} y2={-s * 1.1} /></g>)}
          </g>
        ) : (
          <g>
            <circle cx={-s * 0.14} cy={-s * 1.16} r={s * 0.07} fill="#B6FF6B" />
            <circle cx={s * 0.14} cy={-s * 1.16} r={s * 0.07} fill="#B6FF6B" />
          </g>
        )}
        <path d={`M ${-s * 0.42} ${-s * 1.5} L ${-s * 0.3} ${-s * 1.75} L ${-s * 0.15} ${-s * 1.52} L 0 ${-s * 1.8} L ${s * 0.15} ${-s * 1.52} L ${s * 0.3} ${-s * 1.75} L ${s * 0.42} ${-s * 1.5}`} fill={REX.light} stroke={INK} strokeWidth={2} strokeLinejoin="round" />
        <rect x={s * 0.45} y={-s * 0.95} width={s * 0.5} height={s * 0.2} rx={s * 0.08} fill="#2B2B33" stroke={INK} strokeWidth={2} />
        {r.fire > 0 && <circle cx={s * 1.0} cy={-s * 0.85} r={s * 0.16 * r.fire} fill="#FF5FA2" opacity={r.fire} />}
      </g>
    </g>
  );
};

const Zip: React.FC<{g: GameState}> = ({g}) => {
  const x = 320 + g.zipScreen, y = 352;
  const bob = Math.abs(Math.sin(g.run * Math.PI)) * 7 * g.runAmt;
  const legA = Math.sin(g.run * Math.PI) * 10 * g.runAmt;
  const rec = g.recoil;
  const hop = g.hop ?? 0;
  const ch = g.charge ?? 0;
  return (
    <g transform={`translate(${x} ${y - bob - hop}) rotate(${g.zipLean * 9})`}>
      <ellipse cx={0} cy={bob + hop + 4} rx={52 * (1 - hop / 200)} ry={10 * (1 - hop / 200)} fill="#2B6E5E" opacity={0.3} />
      {ch > 0.01 && <circle cx={118} cy={-68} r={10 + 26 * ch + 4 * Math.sin(g.t * 60)} fill="#FFF3B0" opacity={0.35 + 0.5 * ch} />}
      {/* legs */}
      <rect x={-30} y={-26 + legA} width={20} height={30} rx={8} fill={ZIP.dark} stroke={INK} strokeWidth={2.4} />
      <rect x={10} y={-26 - legA} width={20} height={30} rx={8} fill={ZIP.dark} stroke={INK} strokeWidth={2.4} />
      {/* body (seen from behind) */}
      <path d="M -50 -40 Q -54 -118 0 -122 Q 54 -118 50 -40 Q 48 -16 0 -14 Q -48 -16 -50 -40 Z" fill={ZIP.body} stroke={INK} strokeWidth={3} strokeLinejoin="round" />
      <path d="M -36 -96 Q -30 -114 -8 -116" fill="none" stroke={ZIP.light} strokeWidth={7} strokeLinecap="round" />
      <rect x={-22} y={-82} width={44} height={34} rx={8} fill={ZIP.shade} stroke={INK} strokeWidth={2.4} />
      <circle cx={-8} cy={-65} r={4} fill="#FFE08A" />
      <circle cx={8} cy={-65} r={4} fill={ZIP.visor} />
      {/* antenna */}
      <line x1={14} y1={-120} x2={24} y2={-142} stroke={INK} strokeWidth={3} />
      <circle cx={25} cy={-146} r={7} fill="#FFC744" stroke={INK} strokeWidth={2.4} />
      {/* blaster arm (right) */}
      <g transform={`translate(44 -64) rotate(${-8 - rec * 10})`}>
        {(g.muzzle ?? 0) > 0.01 && <path transform={`translate(70 -4) scale(${0.6 + 0.8 * (g.muzzle ?? 0)})`} d="M 0 0 L 16 -14 L 12 -3 L 34 -6 L 14 4 L 26 18 L 4 8 Z" fill="#FFF3B0" stroke="#FFC744" strokeWidth={3} opacity={g.muzzle} />}
        <rect x={-8} y={-10} width={44} height={20} rx={8} fill={ZIP.body} stroke={INK} strokeWidth={2.4} />
        <rect x={18} y={-16} width={40} height={24} rx={7} fill="#2EC7D6" stroke={INK} strokeWidth={2.6} />
        <rect x={50 - rec * 6} y={-12} width={14} height={16} rx={4} fill="#FFC744" stroke={INK} strokeWidth={2.2} />
      </g>
      <rect x={-62} y={-72} width={20} height={34} rx={9} fill={ZIP.body} stroke={INK} strokeWidth={2.4} />
    </g>
  );
};

const Splat: React.FC<{x: number; y: number; s: number; age: number; seed: number; col?: string}> = ({x, y, s, age, seed, col = '#FF8A3D'}) => {
  if (age < 0 || age > 0.9) return null;
  const k = clamp(age / 0.08);
  const fade = 1 - clamp((age - 0.45) / 0.45);
  const ps: P[] = [];
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2;
    const r = (i % 2 ? 0.55 : 1) * (0.8 + 0.4 * hash(seed + i)) * s * k;
    ps.push({x: Math.cos(a) * r, y: Math.sin(a) * r * 0.8});
  }
  return (
    <g transform={`translate(${x} ${y})`} opacity={fade}>
      <path d={smoothPath(ps)} fill={col} stroke={INK} strokeWidth={2.2} />
      <path d={smoothPath(ps.map((q) => ({x: q.x * 0.5, y: q.y * 0.5})))} fill={col === '#FF8A3D' ? '#FFC744' : '#B6FF6B'} />
      {Array.from({length: 7}).map((_, i) => {
        const a = hash(seed * 3 + i) * Math.PI * 2;
        const d = s * (1.1 + age * 3.2) * (0.7 + hash(seed + i * 7) * 0.6);
        return <circle key={i} cx={Math.cos(a) * d} cy={Math.sin(a) * d * 0.8 + age * age * 60} r={s * 0.14 * (1 - age)} fill={col} stroke={INK} strokeWidth={1.6} />;
      })}
    </g>
  );
};

const Crosshair: React.FC<{g: GameState}> = ({g}) => {
  const {x, y} = g.cross;
  const r = 15 - 4 * g.lock;
  const hm = g.hitMark ?? 0;
  return (
    <g transform={`translate(${x} ${y})`} opacity={1 - (g.win ?? 0)}>
      {hm > 0.01 && (
        <g stroke="#FFFFFF" strokeWidth={4} strokeLinecap="round" opacity={hm}>
          {[45, 135, 225, 315].map((a) => {
            const c = Math.cos((a * Math.PI) / 180), sn = Math.sin((a * Math.PI) / 180), r0 = 18 + 6 * (1 - hm), r1 = 30 + 8 * (1 - hm);
            return <line key={a} x1={c * r0} y1={sn * r0} x2={c * r1} y2={sn * r1} />;
          })}
        </g>
      )}
      {g.lock > 0.01 && <circle r={26 - 8 * g.lock} fill="none" stroke="#FF5FA2" strokeWidth={3} opacity={g.lock} />}
      <g stroke={INK} strokeWidth={6} strokeLinecap="round">
        <circle r={r} fill="none" />
        <line x1={-r - 8} y1={0} x2={-r + 3} y2={0} /><line x1={r - 3} y1={0} x2={r + 8} y2={0} />
        <line x1={0} y1={-r - 8} x2={0} y2={-r + 3} /><line x1={0} y1={r - 3} x2={0} y2={r + 8} />
      </g>
      <g stroke="#FFFFFF" strokeWidth={2.6} strokeLinecap="round">
        <circle r={r} fill="none" />
        <line x1={-r - 8} y1={0} x2={-r + 3} y2={0} /><line x1={r - 3} y1={0} x2={r + 8} y2={0} />
        <line x1={0} y1={-r - 8} x2={0} y2={-r + 3} /><line x1={0} y1={r - 3} x2={0} y2={r + 8} />
      </g>
      <circle r={2.6} fill={g.lock > 0.5 ? '#FF5FA2' : '#FFFFFF'} stroke={INK} strokeWidth={1.2} />
    </g>
  );
};

const Keys: React.FC<{k: NonNullable<GameState['keys']>}> = ({k}) => {
  const key = (x: number, y: number, label: string, on: number) => (
    <g key={label} transform={`translate(${x} ${y + on * 3})`}>
      <rect x={-19} y={-19 + 5} width={38} height={38} rx={8} fill="#1B2B3A" opacity={0.5} />
      <rect x={-19} y={-19} width={38} height={38} rx={8} fill={on > 0.5 ? '#FFC744' : '#FFFFFF'} stroke={INK} strokeWidth={2.6} />
      <text x={0} y={8} textAnchor="middle" fontFamily="Fredoka Variable, Fredoka, sans-serif" fontWeight={700} fontSize={22} fill={INK}>{label}</text>
    </g>
  );
  return (
    <g transform="translate(78 300)">
      {key(0, -44, 'W', k.w)}
      {key(-44, 0, 'A', k.a)}
      {key(0, 0, 'S', k.s)}
      {key(44, 0, 'D', k.d)}
    </g>
  );
};

const Confetti: React.FC<{age: number; x: number; y: number}> = ({age, x, y}) => {
  if (age < 0 || age > 2.5) return null;
  const cols = ['#FFC744', '#FF5FA2', '#1CA7A0', '#FF8A3D', '#4F7CC9', '#B6FF6B'];
  return (
    <g>
      {Array.from({length: 26}).map((_, i) => {
        const a = (i / 26) * Math.PI * 2 + hash(i) * 0.4;
        const v = 140 + hash(i + 7) * 160;
        const px = x + Math.cos(a) * v * Math.min(age, 0.6) / 0.6 * (0.6 + 0.4 * hash(i + 3));
        const py = y + Math.sin(a) * v * 0.7 * Math.min(age, 0.6) / 0.6 + 90 * age * age;
        return <rect key={i} x={px - 4} y={py - 7} width={8} height={14} rx={2} fill={cols[i % cols.length]} transform={`rotate(${age * 400 + i * 37} ${px} ${py})`} opacity={1 - Math.max(0, (age - 1.6) / 0.9)} />;
      })}
    </g>
  );
};

const Trophy: React.FC<{w: number; x?: number}> = ({w, x = 320}) => {
  if (w <= 0.001) return null;
  const s = (0.6 + 0.4 * clamp(w * 1.4)) * 0.75;
  return (
    <g transform={`translate(${x} ${118 - 40 * clamp(w * 2)}) scale(${s})`} opacity={clamp(w * 3)}>
      {Array.from({length: 12}).map((_, i) => {
        const a = (i / 12) * Math.PI * 2 + w * 2;
        return <path key={i} d={`M 0 0 L ${Math.cos(a - 0.12) * 150} ${Math.sin(a - 0.12) * 150} L ${Math.cos(a + 0.12) * 150} ${Math.sin(a + 0.12) * 150} Z`} fill="#FFF3B0" opacity={0.45} />;
      })}
      <path d="M -40 -50 L 40 -50 Q 40 10 0 18 Q -40 10 -40 -50 Z" fill="#FFC744" stroke={INK} strokeWidth={3.5} />
      <path d="M -40 -38 Q -66 -38 -60 -12 Q -54 6 -30 4" fill="none" stroke={INK} strokeWidth={4} />
      <path d="M 40 -38 Q 66 -38 60 -12 Q 54 6 30 4" fill="none" stroke={INK} strokeWidth={4} />
      <rect x={-8} y={16} width={16} height={18} fill="#E7B33A" stroke={INK} strokeWidth={3} />
      <rect x={-28} y={32} width={56} height={14} rx={4} fill="#FF8A3D" stroke={INK} strokeWidth={3} />
      <path d="M -22 -40 Q -20 -10 -6 2" fill="none" stroke="#FFF3B0" strokeWidth={5} strokeLinecap="round" />
    </g>
  );
};

/** the whole game screen in a 640×400 box; `ext` extends the canvas (sky above, floor below, sides) for the vertical
 *  in-game camera; `hud` draws the hearts (and the W/A/S/D keys when shown) */
export const GameScreen: React.FC<{g: GameState; id: string; ext?: Ext; hud?: boolean}> = ({g, id, ext = NOEXT, hud = true}) => {
  const ens = [...g.enemies].sort((a, b) => b.z - a.z);
  const e = ext;
  const sh = g.shake ?? {x: 0, y: 0};
  return (
    <g>
      <defs>
        <clipPath id={`${id}-clip`}><rect x={-e.l} y={-e.t} width={640 + e.l + e.r} height={400 + e.t + e.b} /></clipPath>
      </defs>
      <g clipPath={`url(#${id}-clip)`}>
       <g transform={`translate(${sh.x} ${sh.y})`}>
        <Sky g={g} id={id} e={e} />
        <Floor g={g} id={id} e={e} />
        <Blocks g={g} />
        {g.rex && <Rex r={g.rex} g={g} />}
        {ens.map((en) => <GooBot key={en.id} e={en} g={g} />)}
        {g.orbs.map((o, i) => {
          const p = projectG(g.camX, o.x, o.z, 1.0);
          const r = Math.min(90, p.s * 0.22);
          return (
            <g key={i} opacity={o.a}>
              <circle cx={p.x} cy={p.y} r={r * 1.8} fill="#FF5FA2" opacity={0.25} />
              <circle cx={p.x} cy={p.y} r={r} fill="#FF5FA2" stroke={INK} strokeWidth={2} />
              <circle cx={p.x - r * 0.3} cy={p.y - r * 0.3} r={r * 0.3} fill="#FFD1E6" />
            </g>
          );
        })}
        {g.shots.map((s1, i) => {
          const x = lerp(s1.from.x, s1.to.x, s1.u), y = lerp(s1.from.y, s1.to.y, s1.u) - Math.sin(s1.u * Math.PI) * 18;
          const r = lerp(11, 5, s1.u);
          return (
            <g key={i}>
              <line x1={lerp(s1.from.x, s1.to.x, Math.max(0, s1.u - 0.25))} y1={lerp(s1.from.y, s1.to.y, Math.max(0, s1.u - 0.25))} x2={x} y2={y} stroke="#FFC744" strokeWidth={r} strokeLinecap="round" opacity={0.5} />
              <circle cx={x} cy={y} r={r} fill="#FF8A3D" stroke={INK} strokeWidth={2} />
            </g>
          );
        })}
        {g.splats.map((s1, i) => <Splat key={i} {...s1} />)}
        {g.rex && (g.confetti ?? -1) >= 0 && (() => { const p = projectG(g.camX, g.rex!.x, g.rex!.z, 1.0); return <Confetti age={g.confetti!} x={p.x + 30} y={p.y} />; })()}
        <Zip g={g} />
        <Crosshair g={g} />
        <Trophy w={g.win ?? 0} x={g.winX ?? 320} />
       </g>
        {hud && (
          <g transform={`translate(${22 - e.l * 0} 22)`}>
            {[0, 1, 2].map((i) => <path key={i} transform={`translate(${i * 30} 0)`} d="M 0 4 C 0 -4 12 -4 12 4 C 12 -4 24 -4 24 4 C 24 12 12 18 12 22 C 12 18 0 12 0 4 Z" fill="#FF5F6D" stroke={INK} strokeWidth={2.2} />)}
          </g>
        )}
        {hud && g.keys && <Keys k={g.keys} />}
      </g>
    </g>
  );
};
export const Hearts: React.FC = () => (
  <g>{[0, 1, 2].map((i) => <path key={i} transform={`translate(${i * 30} 0)`} d="M 0 4 C 0 -4 12 -4 12 4 C 12 -4 24 -4 24 4 C 24 12 12 18 12 22 C 12 18 0 12 0 4 Z" fill="#FF5F6D" stroke={INK} strokeWidth={2.2} />)}</g>
);
export {Keys};
