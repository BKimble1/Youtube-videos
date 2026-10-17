// Crew equipment, drawn in the rig's own space so it never floats away from a grip:
//   plate (worn on the Director's left forearm), tether launcher + hip reel (clerkA), tablet with clip-on projector
//   (clerkB), pneumatic breaker (honest, two hands), drone controller (checker, two hands), halligan bar (guesser),
//   flare and smoke canister (host). No logos. One-handed props are HoldFns (hand-local: x toward the fingertips,
//   +y toward the thumb side, drawn between the palm and the curled fingers). Two-handed props are `extra` parts laid
//   along the line between the hands. `*Tip(rig)` return the drawn (screen-rig) points used for FX and collisions.
import React from 'react';
import {C, SYS} from '../../theme';
import {V2, V3, add3, sub3, mul3, norm3, len3, f2, lerp, clamp, rnd} from '../../kit/math';
import {HoldFn, WearFn, Rig2, Part, at} from './figure';
import {PlateState} from './crew';

const METAL = '#8E989F', METAL_D = '#5B646B', SLATE = '#3A444C', RUBBER = '#26292C';

// ------------------------------------------------------------------ the Director's plate (worn on the left forearm)
/** Salvaged machine armour plate strapped to the forearm's back (dorsal) side. Faces the dorsal direction. */
export const plateWear = (state: PlateState, o: {glint?: number} = {}): WearFn => (fa, s, ink, col) => {
  const nz = fa.dorsal.z;
  const front = nz > -0.12;
  const across = Math.max(0.16, Math.abs(nz));
  const L = 64, Wd = 46; // half-length along the forearm, half-width across (rig units)
  const mid = {x: lerp(fa.E.x, fa.W.x, 0.55), y: lerp(fa.E.y, fa.W.y, 0.55)};
  const dl = Math.hypot(fa.dorsal.x, fa.dorsal.y);
  const off = 13 * s * (dl > 1e-3 ? 1 : 0);
  const cx = mid.x + (dl > 1e-3 ? (fa.dorsal.x / dl) * off : 0), cy = mid.y + (dl > 1e-3 ? (fa.dorsal.y / dl) * off : 0);
  const k = s;
  const y = (v: number) => v * across;
  const outline: V2[] = [[-L, -Wd + 10], [-L + 12, -Wd], [L - 8, -Wd], [L, -Wd + 14], [L + 4, 0], [L, Wd - 14], [L - 8, Wd], [-L + 12, Wd], [-L, Wd - 10], [-L - 4, 0]].map(([a, b]) => ({x: a, y: b}));
  let shape = outline;
  if (state === 'shattered') {
    // only the strapped wrist-side fragment remains: a jagged line across
    shape = [{x: -6, y: -Wd}, {x: L - 8, y: -Wd}, {x: L, y: -Wd + 14}, {x: L + 4, y: 0}, {x: L, y: Wd - 14}, {x: L - 8, y: Wd}, {x: 10, y: Wd}, {x: 2, y: Wd - 18}, {x: 14, y: 10}, {x: -2, y: 4}, {x: 8, y: -14}, {x: -4, y: -24}];
  }
  const d = 'M ' + shape.map((q) => `${f2(q.x * k)} ${f2(y(q.y) * k)}`).join(' L ') + ' Z';
  const panel = col('#C9D1D6'), edge = col('#8C979F');
  const thick = Math.max(2, 8 * k * (1 - across));
  const el = (
    <g transform={`translate(${f2(cx)} ${f2(cy)}) rotate(${f2(fa.ang)})`}>
      {/* edge thickness (visible when the plate turns edge-on) */}
      <path d={d} transform={`translate(0 ${f2(thick * Math.sign(-nz || 1))})`} fill={edge} stroke={C.ink} strokeWidth={ink} strokeLinejoin="round" />
      <path d={d} fill={panel} stroke={C.ink} strokeWidth={ink} strokeLinejoin="round" />
      {front && across > 0.35 && (
        <g>
          {/* raised rim band and a bolt row: it was a machine's armour */}
          <path d={'M ' + shape.map((q) => `${f2(q.x * 0.8 * k)} ${f2(y(q.y) * 0.72 * k)}`).join(' L ') + ' Z'} fill="none" stroke={edge} strokeWidth={3 * k} strokeLinejoin="round" />
          {state !== 'shattered' && [-40, 40].map((xx) => <circle key={xx} cx={xx * k} cy={y(-Wd + 9) * k} r={3 * k} fill={col(METAL_D)} />)}
          {(state === 'dented' || state === 'cracked') && <ellipse cx={-14 * k} cy={y(6) * k} rx={13 * k} ry={y(10) * k} fill={col('#A9B2B8')} stroke={C.ink} strokeWidth={ink * 0.5} />}
          {(state === 'dented' || state === 'cracked') && [0, 1, 2].map((i) => <line key={i} x1={(10 + i * 9) * k} y1={y(-20 + i * 6) * k} x2={(34 + i * 9) * k} y2={y(-14 + i * 6) * k} stroke={C.ink} strokeWidth={ink * 0.45} strokeLinecap="round" opacity={0.6} />)}
          {state === 'cracked' && <path d={`M ${-L * k} ${y(-8) * k} L ${-30 * k} ${y(-2) * k} L ${-12 * k} ${y(8) * k} L ${8 * k} ${y(2) * k} L ${30 * k} ${y(16) * k} L ${50 * k} ${y(12) * k} M ${-12 * k} ${y(8) * k} L ${-4 * k} ${y(28) * k}`} fill="none" stroke={C.ink} strokeWidth={ink * 0.8} strokeLinecap="round" strokeLinejoin="round" />}
          {state === 'shattered' && <path d={`M ${20 * k} ${y(-30) * k} L ${36 * k} ${y(-6) * k} L ${30 * k} ${y(20) * k}`} fill="none" stroke={C.ink} strokeWidth={ink * 0.6} />}
          {(o.glint ?? 0) > 0 && <path d={`M ${-30 * k} ${y(-30) * k} L ${10 * k} ${y(-34) * k}`} stroke="#FFFFFF" strokeWidth={4 * k} strokeLinecap="round" opacity={o.glint} />}
        </g>
      )}
      {/* straps around the forearm */}
      {[-22, 30].map((xx) => <rect key={xx} x={(xx - 5) * k} y={-y(Wd + 4) * k} width={10 * k} height={y(2 * Wd + 8) * k} rx={3 * k} fill={col(RUBBER)} opacity={front ? 1 : 0.9} />)}
    </g>
  );
  return {el, front};
};

// ------------------------------------------------------------------ tether launcher (clerkA, right hand) + hip reel
export const tetherLauncher = (o: {loaded?: boolean; recoil?: number} = {}): HoldFn => (h, s, ink, col) => {
  const k = s, rc = (o.recoil ?? 0) * -8;
  return (
    <g transform={`translate(${f2(rc * k)} 0)`}>
      {/* grip through the fist, body above it (thumb side), barrel forward */}
      <rect x={14 * k} y={-6 * k} width={13 * k} height={30 * k} rx={4 * k} fill={col(RUBBER)} stroke={C.ink} strokeWidth={ink * 0.8} />
      <rect x={4 * k} y={18 * k} width={78 * k} height={20 * k} rx={6 * k} fill={col(SLATE)} stroke={C.ink} strokeWidth={ink * 0.9} />
      <rect x={18 * k} y={20 * k} width={26 * k} height={8 * k} rx={3 * k} fill={col('#E8C547')} />
      <circle cx={12 * k} cy={30 * k} r={9 * k} fill={col(METAL)} stroke={C.ink} strokeWidth={ink * 0.7} />
      {o.loaded !== false && (
        <g>
          <rect x={82 * k} y={16 * k} width={10 * k} height={24 * k} rx={3 * k} fill={col(METAL_D)} stroke={C.ink} strokeWidth={ink * 0.7} />
          {[-1, 0, 1].map((i) => <path key={i} d={`M ${92 * k} ${(28 + i * 9) * k} l ${9 * k} ${i * 4 * k}`} stroke={C.ink} strokeWidth={ink * 1.1} strokeLinecap="round" />)}
        </g>
      )}
    </g>
  );
};
/** Muzzle point (drawn frame) of the launcher held in hand i. */
export const launcherMuzzle = (r: Rig2, i: 0 | 1 = 1): V3 => {
  const h = r.hands[i];
  const k = r.s;
  const perp = {x: -h.dir.y, y: h.dir.x};
  const ws = lerp(0.55, 1, clamp(Math.abs(h.pv))) * h.thumb;
  return {x: h.pos.x + h.dir.x * 96 * k + perp.x * 28 * k * ws, y: h.pos.y + h.dir.y * 96 * k + perp.y * 28 * k * ws, z: h.pos.z};
};
export const hipReel = (spool = 1): ((r: Rig2) => Part[]) => (r) => {
  const c = at(r.P, r.base, 74 * r.s, 6 * r.s, 0);
  const k = r.s, ink = r.ink;
  return [{z: c.z > r.torsoZ ? r.torsoZ + 30 : r.torsoZ - 30, key: 'reel', el: (
    <g>
      <rect x={c.x - 15 * k} y={c.y - 20 * k} width={30 * k} height={40 * k} rx={9 * k} fill={SLATE} stroke={C.ink} strokeWidth={ink * 0.8} />
      <circle cx={c.x} cy={c.y} r={11 * k} fill={METAL} stroke={C.ink} strokeWidth={ink * 0.6} />
      <circle cx={c.x} cy={c.y} r={7 * k * clamp(spool)} fill={col2('#C46A2C')} />
    </g>
  )}];
};
const col2 = (c: string) => c;

// ------------------------------------------------------------------ tablet + clip-on projector (clerkB, left hand)
export const tablet = (o: {sketch?: number; figures?: number; smashed?: boolean; screen?: boolean; glow?: number} = {}): HoldFn => (h, s, ink, col) => {
  const k = s;
  const W = 70, Ht = 52; // tablet in hand-local: extends across (−y = away from the thumb) from the grip
  const x0 = 2, y0 = -Ht - 4;
  const showScreen = o.screen ?? true;
  const sk = clamp(o.sketch ?? 0);
  return (
    <g>
      <rect x={x0 * k} y={y0 * k} width={W * k} height={(Ht + 18) * k} rx={6 * k} fill={col(SLATE)} stroke={C.ink} strokeWidth={ink} />
      {showScreen ? (
        <g>
          <rect x={(x0 + 5) * k} y={(y0 + 5) * k} width={(W - 10) * k} height={(Ht + 8) * k} rx={3 * k} fill={o.smashed ? col('#1C2226') : col('#20343A')} />
          {!o.smashed && sk > 0 && Array.from({length: o.figures ?? 4}, (_, i) => {
            const fx = x0 + 14 + i * 13, fy = y0 + 18, part = clamp(sk * (o.figures ?? 4) - i);
            if (part <= 0) return null;
            const L = (n: number) => clamp(part * 5 - n);
            return (
              <g key={i} stroke={col('#9FF0FF')} strokeWidth={1.8 * k} strokeLinecap="round" fill="none" opacity={0.95}>
                {L(0) > 0 && <circle cx={fx * k} cy={fy * k} r={3 * k * L(0)} />}
                {L(1) > 0 && <line x1={fx * k} y1={(fy + 3) * k} x2={fx * k} y2={(fy + 3 + 13 * L(1)) * k} />}
                {L(2) > 0 && <line x1={fx * k} y1={(fy + 16) * k} x2={(fx - 4 * L(2)) * k} y2={(fy + 16 + 11 * L(2)) * k} />}
                {L(3) > 0 && <line x1={fx * k} y1={(fy + 16) * k} x2={(fx + 4 * L(3)) * k} y2={(fy + 16 + 11 * L(3)) * k} />}
                {L(4) > 0 && <line x1={(fx - 6 * L(4)) * k} y1={(fy + 7) * k} x2={(fx + 6 * L(4)) * k} y2={(fy + 9) * k} />}
              </g>
            );
          })}
          {/* the battered screen: a crack across one corner */}
          <path d={`M ${(x0 + W - 18) * k} ${(y0 + 5) * k} L ${(x0 + W - 26) * k} ${(y0 + 20) * k} L ${(x0 + W - 12) * k} ${(y0 + 30) * k}`} fill="none" stroke={col('#8FA6AD')} strokeWidth={1.2 * k} />
          {o.smashed && <path d={`M ${(x0 + 10) * k} ${(y0 + 10) * k} L ${(x0 + 30) * k} ${(y0 + 34) * k} L ${(x0 + 22) * k} ${(y0 + 52) * k} M ${(x0 + 30) * k} ${(y0 + 34) * k} L ${(x0 + 56) * k} ${(y0 + 26) * k} M ${(x0 + 30) * k} ${(y0 + 34) * k} L ${(x0 + 50) * k} ${(y0 + 58) * k}`} stroke={col('#9AA8AE')} strokeWidth={1.5 * k} fill="none" />}
          {(o.glow ?? 0) > 0 && !o.smashed && <rect x={(x0 + 5) * k} y={(y0 + 5) * k} width={(W - 10) * k} height={(Ht + 8) * k} rx={3 * k} fill="#BFF6FF" opacity={0.25 * (o.glow ?? 0)} />}
        </g>
      ) : (
        <rect x={(x0 + 18) * k} y={(y0 + 22) * k} width={22 * k} height={14 * k} rx={2 * k} fill={col('#4A555C')} />
      )}
      {/* clip-on projector on the top edge */}
      <rect x={(x0 + W / 2 - 13) * k} y={(y0 - 14) * k} width={26 * k} height={16 * k} rx={4 * k} fill={col(METAL_D)} stroke={C.ink} strokeWidth={ink * 0.8} />
      <circle cx={(x0 + W / 2) * k} cy={(y0 - 6) * k} r={5 * k} fill={o.smashed ? col('#2A2F33') : col('#BFF6FF')} stroke={C.ink} strokeWidth={ink * 0.5} />
    </g>
  );
};
/** Projector lens point (drawn frame) of the tablet held in hand i. */
export const projectorLens = (r: Rig2, i: 0 | 1 = 0): V3 => {
  const h = r.hands[i];
  const k = r.s;
  const perp = {x: -h.dir.y, y: h.dir.x};
  const ws = lerp(0.55, 1, clamp(Math.abs(h.pv))) * h.thumb;
  const lx = 2 + 35, ly = -56 - 4 - 6;
  return {x: h.pos.x + h.dir.x * lx * k + perp.x * ly * k * ws, y: h.pos.y + h.dir.y * lx * k + perp.y * ly * k * ws, z: h.pos.z};
};

// ------------------------------------------------------------------ flare and smoke canister (host)
export const flare = (o: {lit?: number; t?: number} = {}): HoldFn => (h, s, ink, col) => {
  const k = s, lit = clamp(o.lit ?? 0);
  const fl = 1 + 0.15 * Math.sin((o.t ?? 0) * 40);
  return (
    <g>
      <rect x={-10 * k} y={-6 * k} width={64 * k} height={12 * k} rx={4 * k} fill={col('#C0392B')} stroke={C.ink} strokeWidth={ink * 0.8} transform={`rotate(-90 ${21 * k} 0) translate(${21 * k} 0)`} />
      {lit > 0 && <g transform={`translate(${21 * k} ${-46 * k})`}>
        <circle r={18 * k * fl * lit} fill="#FFE2A0" opacity={0.55} />
        <circle r={8 * k * fl * lit} fill="#FFFFFF" />
      </g>}
    </g>
  );
};
export const canister = (): HoldFn => (h, s, ink, col) => {
  const k = s;
  return (
    <g transform={`translate(${21 * k} 0)`}>
      <rect x={-12 * k} y={-30 * k} width={24 * k} height={50 * k} rx={6 * k} fill={col('#7D8A90')} stroke={C.ink} strokeWidth={ink * 0.8} />
      <rect x={-12 * k} y={-30 * k} width={24 * k} height={9 * k} rx={3 * k} fill={col('#3E4A50')} />
      <rect x={-4 * k} y={-38 * k} width={8 * k} height={9 * k} rx={2 * k} fill={col(METAL_D)} />
    </g>
  );
};
/** Halligan bar held in one hand (hand-local angle of the bar, degrees: 0 = along the forearm). */
export const halligan1 = (o: {ang?: number; len?: number; along?: number} = {}): HoldFn => (h, s, ink, col) => {
  const k = s, L = o.len ?? 225, a = o.ang ?? 90, al = o.along ?? 0.42;
  return (
    <g transform={`translate(${21 * k} 0) rotate(${a})`}>
      {halliganShape(L, al, k, ink, col)}
    </g>
  );
};
const halliganShape = (L: number, along: number, k: number, ink: number, col: (c: string) => string) => {
  const x0 = -L * along, x1 = L * (1 - along);
  return (
    <g>
      <rect x={x0 * k} y={-6 * k} width={(x1 - x0) * k} height={12 * k} rx={5 * k} fill={col(METAL)} stroke={C.ink} strokeWidth={ink * 0.8} />
      {/* fork end */}
      <path d={`M ${x1 * k} ${-6 * k} L ${(x1 + 22) * k} ${-12 * k} L ${(x1 + 26) * k} ${-6 * k} L ${(x1 + 8) * k} ${-1 * k} L ${(x1 + 8) * k} ${1 * k} L ${(x1 + 26) * k} ${6 * k} L ${(x1 + 22) * k} ${12 * k} L ${x1 * k} ${6 * k} Z`} fill={col(METAL_D)} stroke={C.ink} strokeWidth={ink * 0.8} strokeLinejoin="round" />
      {/* adze + pike end */}
      <path d={`M ${x0 * k} ${-6 * k} L ${(x0 - 6) * k} ${-28 * k} L ${(x0 + 6) * k} ${-26 * k} L ${(x0 + 4) * k} ${-6 * k} Z`} fill={col(METAL_D)} stroke={C.ink} strokeWidth={ink * 0.8} strokeLinejoin="round" />
      <path d={`M ${x0 * k} ${6 * k} L ${(x0 - 4) * k} ${30 * k} L ${(x0 + 4) * k} ${6 * k} Z`} fill={col(METAL_D)} stroke={C.ink} strokeWidth={ink * 0.8} strokeLinejoin="round" />
      <rect x={(x0 + L * 0.12) * k} y={-6.5 * k} width={L * 0.18 * k} height={13 * k} rx={4 * k} fill={col(RUBBER)} />
    </g>
  );
};

// ------------------------------------------------------------------ two-handed tools along the line between the hands
const between = (r: Rig2, back: 0 | 1, front: 0 | 1) => {
  const a = r.hands[back].pos, b = r.hands[front].pos;
  const d = sub3(b, a), L = len3(d) || 1;
  const u = mul3(d, 1 / L);
  const ang = (Math.atan2(u.y, u.x) * 180) / Math.PI;
  return {a, b, u, L, ang, z: Math.max(a.z, b.z)};
};
/** honest's pneumatic breaker: rear hand on the trigger handle, front hand on the side handle; ram head forward. */
export const breaker = (o: {back?: 0 | 1; front?: 0 | 1; gauge?: number; fire?: number; recoil?: number} = {}): ((r: Rig2) => Part[]) => (r) => {
  const bk = o.back ?? 1, fr = o.front ?? 0;
  const g = between(r, bk, fr);
  const k = r.s, ink = r.ink;
  const ext = 110, rear = 60;
  const rc = (o.recoil ?? 0) * 10;
  const p0 = sub3(g.a, mul3(g.u, (rear + rc) * k));
  const len = g.L / k + ext + rear;
  const z = g.z + 0.5;
  const gauge = clamp(o.gauge ?? 1);
  void z;
  return [{z: r.toolZ, key: 'breaker', el: (
    <g transform={`translate(${f2(p0.x)} ${f2(p0.y)}) rotate(${f2(g.ang)})`}>
      {/* tank under the rear */}
      <rect x={-4 * k} y={8 * k} width={62 * k} height={26 * k} rx={13 * k} fill={'#B8483A'} stroke={C.ink} strokeWidth={ink * 0.9} />
      <circle cx={42 * k} cy={21 * k} r={9 * k} fill="#F2EEE4" stroke={C.ink} strokeWidth={ink * 0.6} />
      <line x1={42 * k} y1={21 * k} x2={(42 + Math.cos(Math.PI * (1.15 - gauge * 1.3)) * 7) * k} y2={(21 - Math.sin(Math.PI * (1.15 - gauge * 1.3)) * 7) * k} stroke={gauge < 0.15 ? '#C0392B' : C.ink} strokeWidth={ink * 0.6} strokeLinecap="round" />
      {/* body tube */}
      <rect x={0} y={-11 * k} width={len * k} height={22 * k} rx={8 * k} fill={METAL_D} stroke={C.ink} strokeWidth={ink} />
      <rect x={0} y={-11 * k} width={(rear + 14) * k} height={22 * k} rx={8 * k} fill={'#E8C547'} stroke={C.ink} strokeWidth={ink * 0.9} />
      {/* ram head */}
      <path d={`M ${len * k} ${-15 * k} L ${(len + 26) * k} ${-11 * k} L ${(len + 34) * k} 0 L ${(len + 26) * k} ${11 * k} L ${len * k} ${15 * k} Z`} fill={METAL} stroke={C.ink} strokeWidth={ink} strokeLinejoin="round" />
      {(o.fire ?? 0) > 0 && <circle cx={(len + 38) * k} cy={0} r={16 * k * (o.fire ?? 0)} fill="#FFF3C2" opacity={0.8} />}
      <path d={`M ${8 * k} ${-11 * k} q ${-10 * k} ${-24 * k} ${-26 * k} ${-14 * k}`} fill="none" stroke={RUBBER} strokeWidth={5 * k} strokeLinecap="round" />
    </g>
  )}];
};
export const breakerTip = (r: Rig2, back: 0 | 1 = 1, front: 0 | 1 = 0): V3 => {
  const g = between(r, back, front);
  return add3(g.b, mul3(g.u, 144 * r.s));
};
/** checker's drone controller held in both hands in front of the chest. */
export const controller = (o: {lit?: number} = {}): ((r: Rig2) => Part[]) => (r) => {
  const a = r.hands[0].pos, b = r.hands[1].pos;
  const c = {x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, z: Math.max(a.z, b.z)};
  const ang = (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI;
  const k = r.s, ink = r.ink;
  const w = Math.max(40, Math.hypot(b.x - a.x, b.y - a.y) / k * 0.9);
  const facing = r.up.F.z; // screen side visible when the body faces away
  return [{z: r.toolZ, key: 'ctrl', el: (
    <g transform={`translate(${f2(c.x)} ${f2(c.y - 4 * k)}) rotate(${f2(ang)})`}>
      <rect x={(-w / 2) * k} y={-14 * k} width={w * k} height={28 * k} rx={12 * k} fill={'#4A555C'} stroke={C.ink} strokeWidth={ink * 0.9} />
      {facing < 0.2 && <rect x={-16 * k} y={-9 * k} width={32 * k} height={18 * k} rx={3 * k} fill={'#2A4A55'} />}
      {facing < 0.2 && (o.lit ?? 1) > 0 && <circle cx={0} cy={0} r={3 * k} fill="#9FF0FF" />}
      <line x1={(w / 2 - 6) * k} y1={-14 * k} x2={(w / 2 + 2) * k} y2={-40 * k} stroke={C.ink} strokeWidth={2.4 * k} strokeLinecap="round" />
    </g>
  )}];
};
/** guesser's halligan held in both hands (pry: fork end at the front hand side). */
export const halligan2 = (o: {back?: 0 | 1; front?: 0 | 1} = {}): ((r: Rig2) => Part[]) => (r) => {
  const g = between(r, o.back ?? 1, o.front ?? 0);
  const k = r.s, ink = r.ink;
  const L = 225;
  const along = clamp((70 + 0) / L);
  const c = sub3(g.a, mul3(g.u, 70 * k));
  return [{z: r.toolZ, key: 'hal2', el: (
    <g transform={`translate(${f2(c.x)} ${f2(c.y)}) rotate(${f2(g.ang)})`}>
      {halliganShape(L, 0, k, ink, (x) => x)}
    </g>
  )}];
  void along;
};
export const halliganTip = (r: Rig2, back: 0 | 1 = 1, front: 0 | 1 = 0): V3 => {
  const g = between(r, back, front);
  return add3(sub3(g.a, mul3(g.u, 70 * r.s)), mul3(g.u, (225 + 22) * r.s));
};
void norm3; void rnd; void SYS;
