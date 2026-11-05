// V2 D/E local copy of art/game.tsx's GameScreen (the shared file is untouched). Two changes: `aimLead` sets how
// long before firing the cannon starts to swing (the trial composition uses a short lead, so the cannon does not
// give the outcome away before the receiver's hand moves), and the sky gradient id takes a prefix (`idp`).
// The defend-the-city game (an original reconstruction of the experiment's simple game: a pirate ship fires rockets
// at a city, a friendly supply plane sometimes flies over instead, and a cannon can intercept). Drawn in a 640 x 400
// screen frame. Plane and rocket travel the SAME arc from the ship's side to the city, so the only difference is
// what the object is: the decision the player has to make.
// The BCI cursor window (left strip) follows the published game layout in spirit: a white cursor that rises to a
// blue circular FIRE target at the top when the sender imagines moving his right hand.
import React from 'react';
import {clamp, easeOut, fmt, lerp} from '../dc/math';
import {FONT_HEAD, INK, K} from '../art/kit';

export type GEvent = {
  kind: 'plane' | 'rocket';
  /** launch time (s, in the caller's clock) */
  t0: number;
  /** flight time from the ship side to the city (s) */
  dur: number;
  /** cannon fire time (s); the shot meets the object 0.32 s later */
  fire?: number;
};
const P0 = {x: 128, y: 300}, P1 = {x: 340, y: -60}, P2 = {x: 560, y: 300};
export const arcPt = (u: number) => {
  const a = (1 - u) * (1 - u), b = 2 * u * (1 - u), c = u * u;
  return {x: a * P0.x + b * P1.x + c * P2.x, y: a * P0.y + b * P1.y + c * P2.y};
};
const arcAng = (u: number) => {
  const dx = 2 * (1 - u) * (P1.x - P0.x) + 2 * u * (P2.x - P1.x);
  const dy = 2 * (1 - u) * (P1.y - P0.y) + 2 * u * (P2.y - P1.y);
  return (Math.atan2(dy, dx) * 180) / Math.PI;
};
export const CANNON = {x: 410, y: 352};
const FLY = 0.32;

/** state of one event at time t */
export const evState = (e: GEvent, t: number) => {
  const u = (t - e.t0) / e.dur;
  const hitT = e.fire !== undefined ? e.fire + FLY : Infinity;
  const uHit = (hitT - e.t0) / e.dur;
  const alive = t >= e.t0 && t < Math.min(hitT, e.t0 + e.dur);
  const arrived = e.fire === undefined && t >= e.t0 + e.dur;
  return {u: clamp(u), alive, hitT, uHit: clamp(uHit), arrived, arriveT: e.t0 + e.dur};
};

const Plane: React.FC<{x: number; y: number; a: number}> = ({x, y, a}) => (
  <g transform={`translate(${fmt(x)} ${fmt(y)}) rotate(${fmt(a)})`}>
    <path d="M-34,-4 Q-30,-14 0,-12 L30,-8 Q40,-2 30,4 L0,8 Q-30,10 -34,4 Z" fill="#F4F7F9" stroke={INK} strokeWidth={3} />
    <path d="M-6,-10 L-18,-34 L-8,-34 L10,-10 Z" fill={K.teal} stroke={INK} strokeWidth={3} strokeLinejoin="round" />
    <path d="M-6,6 L-16,26 L-6,26 L10,6 Z" fill={K.teal} stroke={INK} strokeWidth={3} strokeLinejoin="round" />
    <path d="M-34,-4 L-42,-18 L-32,-16 L-26,-6 Z" fill={K.teal} stroke={INK} strokeWidth={3} strokeLinejoin="round" />
    {/* supply crate badge */}
    <rect x={2} y={-7} width={14} height={11} fill="#E8C48A" stroke={INK} strokeWidth={2} />
    <path d="M9,-7 L9,4 M2,-1.5 L16,-1.5" stroke={INK} strokeWidth={1.6} />
  </g>
);

const Rocket: React.FC<{x: number; y: number; a: number; f: number}> = ({x, y, a, f}) => (
  <g transform={`translate(${fmt(x)} ${fmt(y)}) rotate(${fmt(a)})`}>
    <path d={`M-30,0 L${-52 - 6 * Math.sin(f * 1.9)},-7 L${-62 - 8 * Math.sin(f * 2.3)},0 L${-52 - 6 * Math.sin(f * 1.7)},7 Z`} fill={K.saffron} opacity={0.95} />
    <path d="M-30,0 L-44,-4 L-48,0 L-44,4 Z" fill="#FFF3C4" />
    <path d="M-30,-8 L14,-8 Q30,0 14,8 L-30,8 Z" fill={K.coral} stroke={INK} strokeWidth={3} />
    <path d="M-30,-8 L-40,-16 L-24,-8 Z M-30,8 L-40,16 L-24,8 Z" fill={K.coralDeep} stroke={INK} strokeWidth={2.5} strokeLinejoin="round" />
    <circle cx={2} cy={0} r={4} fill="#FFFFFF" stroke={INK} strokeWidth={2} />
  </g>
);

/** smoke/explosion puff 0..1 */
const Puff: React.FC<{x: number; y: number; k: number; color?: string; s?: number}> = ({x, y, k, color = K.saffron, s = 1}) => {
  if (k <= 0 || k >= 1) return null;
  const r = (8 + 34 * easeOut(k)) * s;
  return (
    <g opacity={1 - k * k}>
      {[0, 1, 2, 3, 4, 5].map((i) => {
        const a = (i / 6) * Math.PI * 2 + 0.3;
        return <circle key={i} cx={x + Math.cos(a) * r * 0.7} cy={y + Math.sin(a) * r * 0.6} r={r * 0.55} fill={i % 2 ? '#F2F2F2' : color} stroke={INK} strokeWidth={2.5} />;
      })}
      <circle cx={x} cy={y} r={r * 0.55} fill="#FFFFFF" />
    </g>
  );
};

const City: React.FC<{hit?: number}> = ({hit = 0}) => {
  const bs = [[452, 300, 38, 100], [494, 262, 44, 138], [542, 282, 36, 118], [582, 246, 50, 154]];
  return (
    <g>
      {bs.map(([x, y, w, h], i) => (
        <g key={i}>
          <rect x={x} y={y} width={w} height={h} fill={i % 2 ? '#7C9CB8' : '#93B1C9'} stroke={INK} strokeWidth={3} />
          {[0, 1, 2, 3, 4].map((r) =>
            [0, 1].map((c) => (r * 26 + 14 < h - 10 ? <rect key={`${r}${c}`} x={x + 7 + c * (w / 2 - 2)} y={y + 10 + r * 26} width={w / 2 - 12} height={12} fill="#FFE7A3" opacity={0.85} /> : null)),
          )}
        </g>
      ))}
      <Puff x={560} y={276} k={hit} color={K.coral} s={1.3} />
    </g>
  );
};

const Ship: React.FC<{t: number}> = ({t}) => {
  const bob = Math.sin(t * 2.2) * 2.5;
  return (
    <g transform={`translate(110 ${fmt(338 + bob)})`}>
      <path d="M-62,0 L62,0 L46,26 L-48,26 Z" fill="#8A5A3B" stroke={INK} strokeWidth={3} />
      <rect x={-3} y={-74} width={6} height={74} fill="#5A3C27" stroke={INK} strokeWidth={2} />
      <path d="M3,-68 L48,-46 L3,-22 Z" fill="#F4EDE0" stroke={INK} strokeWidth={3} strokeLinejoin="round" />
      <rect x={-34} y={-84} width={30} height={20} fill="#2B2B33" stroke={INK} strokeWidth={2} />
      <circle cx={-19} cy={-76} r={4.2} fill="#FFFFFF" />
      <path d="M-24,-70 L-14,-70" stroke="#FFFFFF" strokeWidth={2} />
    </g>
  );
};

const Cannon: React.FC<{aim: number; recoil: number}> = ({aim, recoil}) => (
  <g transform={`translate(${CANNON.x} ${CANNON.y})`}>
    <g transform={`rotate(${fmt(aim)}) translate(${fmt(-8 * recoil)} 0)`}>
      <rect x={-6} y={-11} width={52} height={22} rx={8} fill="#55606A" stroke={INK} strokeWidth={3} />
      <rect x={40} y={-13} width={10} height={26} rx={3} fill="#3F4A53" stroke={INK} strokeWidth={2.5} />
    </g>
    <path d="M-26,22 L26,22 L18,0 L-18,0 Z" fill="#6D5A49" stroke={INK} strokeWidth={3} strokeLinejoin="round" />
    <circle cx={0} cy={4} r={12} fill="#55606A" stroke={INK} strokeWidth={3} />
    <rect x={-40} y={22} width={80} height={26} fill="#C2B49B" stroke={INK} strokeWidth={3} />
  </g>
);

export const GameScreenDE: React.FC<{
  t: number;
  events: GEvent[];
  /** BCI cursor height 0 (bottom) .. 1 (the FIRE target); undefined hides the cursor window */
  cursor?: number;
  /** a red 'X' over the plane when it is shot by mistake */
  cityHitAt?: number;
  /** dim the whole screen (0..1) */
  dim?: number;
  /** seconds before firing that the cannon starts to swing */
  aimLead?: number;
  idp?: string;
}> = ({t, events, cursor, cityHitAt, dim = 0, aimLead = 0.6, idp = 'vde'}) => {
  const shots: React.ReactNode[] = [];
  const objs: React.ReactNode[] = [];
  let recoil = 0;
  let aim = -128;
  events.forEach((e, i) => {
    const s = evState(e, t);
    if (s.alive) {
      const p = arcPt(s.u);
      objs.push(e.kind === 'plane' ? <Plane key={i} x={p.x} y={p.y} a={arcAng(s.u)} /> : <Rocket key={i} x={p.x} y={p.y} a={arcAng(s.u)} f={t * 30} />);
    }
    if (e.fire !== undefined) {
      const hp = arcPt(s.uHit);
      const dx = hp.x - CANNON.x, dy = hp.y - CANNON.y;
      const want = (Math.atan2(dy, dx) * 180) / Math.PI;
      // the cannon swings to aim in the half second before it fires
      const ak = clamp((t - (e.fire - aimLead)) / Math.max(0.05, aimLead - 0.1));
      if (t > e.fire - aimLead && t < e.fire + 1.2) aim = lerp(-128, want, ak);
      const sk = (t - e.fire) / FLY;
      if (sk >= 0 && sk <= 1) {
        const q = {x: CANNON.x + Math.cos((want * Math.PI) / 180) * 50 + (hp.x - CANNON.x) * sk, y: CANNON.y + Math.sin((want * Math.PI) / 180) * 50 + (hp.y - CANNON.y) * sk};
        shots.push(<circle key={`s${i}`} cx={q.x} cy={q.y} r={7} fill="#2B2B33" stroke="#FFFFFF" strokeWidth={2} />);
        shots.push(<line key={`l${i}`} x1={q.x} y1={q.y} x2={q.x - dx * 0.12} y2={q.y - dy * 0.12} stroke="#FFFFFF" strokeWidth={4} strokeLinecap="round" opacity={0.7} />);
      }
      const rk = (t - e.fire) / 0.3;
      if (rk >= 0 && rk <= 1) recoil = Math.max(recoil, 1 - rk);
      const fk = (t - e.fire) / 0.18;
      if (fk >= 0 && fk <= 1) {
        const mz = {x: CANNON.x + Math.cos((want * Math.PI) / 180) * 58, y: CANNON.y + Math.sin((want * Math.PI) / 180) * 58};
        shots.push(<circle key={`m${i}`} cx={mz.x} cy={mz.y} r={22 * (1 - fk) + 6} fill={K.saffron} opacity={1 - fk} />);
      }
      shots.push(<Puff key={`p${i}`} x={hp.x} y={hp.y} k={(t - s.hitT) / 0.9} color={e.kind === 'plane' ? '#F2F2F2' : K.saffron} s={1.5} />);
    }
  });
  return (
    <g>
      <defs>
        <linearGradient id={`${idp}-gsky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#9FD3EC" />
          <stop offset="1" stopColor="#E3F4FA" />
        </linearGradient>
      </defs>
      <rect x={0} y={0} width={640} height={400} fill={`url(#${idp}-gsky)`} />
      <circle cx={520} cy={70} r={30} fill="#FFE08A" />
      <path d="M140,80 q20,-18 40,0 q14,-10 26,4 l-70,0 z" fill="#FFFFFF" opacity={0.8} />
      {/* sea, ship, ground */}
      <rect x={0} y={350} width={300} height={50} fill="#4F98C2" />
      <path d="M0,352 q20,-6 40,0 t40,0 t40,0 t40,0 t40,0 t40,0 t40,0 t40,0" fill="none" stroke="#FFFFFF" strokeWidth={3} opacity={0.6} />
      <rect x={300} y={374} width={340} height={26} fill="#8DB97A" />
      <Ship t={t} />
      <City hit={cityHitAt !== undefined ? (t - cityHitAt) / 1.1 : 0} />
      <Cannon aim={aim} recoil={recoil} />
      {objs}
      {shots}
      {cursor !== undefined && (
        <g>
          <rect x={6} y={6} width={92} height={388} rx={10} fill="#1F3442" opacity={0.88} stroke={INK} strokeWidth={3} />
          <circle cx={52} cy={52} r={34} fill={K.blue} stroke="#FFFFFF" strokeWidth={4} opacity={0.95} />
          <text x={52} y={60} textAnchor="middle" fontFamily={FONT_HEAD} fontWeight={700} fontSize={20} fill="#FFFFFF">FIRE</text>
          <line x1={52} y1={92} x2={52} y2={370} stroke="#FFFFFF" strokeWidth={2} strokeDasharray="4 8" opacity={0.35} />
          <rect x={36} y={fmt(354 - clamp(cursor) * 300)} width={32} height={20} rx={4} fill="#FFFFFF" stroke={INK} strokeWidth={2.5} />
          {cursor >= 0.999 && <circle cx={52} cy={52} r={44} fill="none" stroke={K.saffron} strokeWidth={6} />}
        </g>
      )}
      {dim > 0 && <rect x={0} y={0} width={640} height={400} fill="#1F3442" opacity={dim} />}
    </g>
  );
};
