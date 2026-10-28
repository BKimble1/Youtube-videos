// V3 café: an illustration (the laptop's software says DEMO) of Wi-Fi identification, the separate experiment.
// E (from the lab, 14.9 to 22.3): the camera pulls back from the café router's status light; its Wi-Fi spreads through
// the café and out through the glass; he walks along the sidewalk, the signal scatters off his body; when he has
// passed the window the camera pushes to the analysis laptop on the ledge: incoming signal, his gait signature,
// comparison, match; then no phone; then back out to him walking on, empty-handed.
// H (27.0 to 31.9): the same street; his signature was stored on an earlier visit; as he walks past it is matched
// again (SEEN BEFORE), and the camera moves from him to the screen and back to him.
// The street set is scenes/cafeSet.tsx (router and laptop both in the right-hand window).
import React from 'react';
import {add3, B, basis, Cam, camPath, proj, scaleAt, v3, V3} from '../world/cam';
import {Poly, rz} from '../world/draw';
import {cardAt, FloorShadow, Person, U} from '../art/person';
import {walk, Gait, heelStrikes} from '../art/walk';
import {ManPose, manJoints} from '../dc/Man';
import {EXPR_NEUTRAL, EXPR_UNEASY, Expr, mixExpr} from '../dc/Head';
import {HandPose} from '../dc/Hand';
import {BladeSign, CafeBack, CafeFore, CafeGround, CC, FACADE, MONI, PATH_Z, ROUTER} from '../scenes/cafeSet';
import {clamp, f1, hash, ss, useUid, word} from '../lib';
import {INK} from '../world/draw';
import {LAB_OUT} from './Lab3';

const W = word;
const T_ = (w: string, n = 0) => W(w, n).start;
export const CB3 = {
  in1: LAB_OUT,
  sep: T_('separate'),
  sci: T_('scientists', 1),
  ordinary: T_('ordinary'),
  signals: T_('signals'),
  identify: T_('identify'),
  people: T_('people', 0),
  walking: T_('walking', 0),
  even: T_('even'),
  phones: T_('phones'),
  they: T_('they', 1),
  so: T_('so'),
  walking2: T_('walking', 1),
  cafe: T_('cafe'),
  recognizes: T_('recognizes'),
  without2: T_('without', 1),
  anything: T_('anything'),
  now: T_('now'),
};
/** E ends (the ad panel wipes to the study) and H begins (out of the study's display) */
export const E_OUT = CB3.they - 0.12;
export const H_IN = CB3.so - 0.2;

// ------------------------------------------------------------------ him
const GE: Gait = {x0: 2.25 * U + 600 * 16.57, v: 600, T: 0.98, ph: 0.15, arm: 19, elbow: 16, lean: 4};
const GH: Gait = {x0: 2.6 * U + 660 * 27.7, v: 660, T: 0.94, ph: 0.55, arm: 19, elbow: 16, lean: 4};
export const cafeGait = (t: number) => (t < (E_OUT + H_IN) / 2 ? GE : GH);
const heroX = (t: number) => walk(cafeGait(t), t).x / U;
/** his card at his own floor point, the pose shifted to match */
const heroAt = (t: number) => {
  const p = walk(cafeGait(t), t);
  const dx = p.x;
  return {at: v3(dx / U, 0, PATH_Z), p: {...p, x: 0, lAx: (p.lAx ?? 0) - dx, rAx: (p.rAx ?? 0) - dx} as ManPose, wx: dx / U};
};
export const cafeFootsteps = () => [
  ...heelStrikes(GE, CB3.sci - 0.2, E_OUT + 0.1).map((s) => ({...s, who: 'hero (café)', gain: 0.75})),
  ...heelStrikes(GH, H_IN, CB3.now).map((s) => ({...s, who: 'hero (café, again)', gain: 0.75})),
];

// ------------------------------------------------------------------ the foreground ad panel (the wipe to and from the study)
/** a bus-stop advertising panel by the curb: as the camera tracks past it, it fills the lens, and the next place is
 *  revealed behind its trailing edge */
export const PANEL = {x0: -3.95, x1: -3.2, z: 0.4, y0: 0.05, y1: 2.25};
export const panelEdge = (b: B) => proj(b, v3(PANEL.x0, 1.2, PANEL.z)).x;
const AdPanel: React.FC<{b: B}> = ({b}) => (
  <g>
    <Poly b={b} pts={rz(PANEL.z + 0.02, PANEL.x0 - 0.06, PANEL.x1 + 0.06, -0.14, PANEL.y1 + 0.08)} fill="#2E3A42" />
    <Poly b={b} pts={rz(PANEL.z, PANEL.x0, PANEL.x1, PANEL.y0 + 0.25, PANEL.y1)} fill="#F4EBD3" />
    <Poly b={b} pts={rz(PANEL.z - 0.002, PANEL.x0 + 0.08, PANEL.x1 - 0.08, PANEL.y0 + 0.36, PANEL.y1 - 0.1)} fill="#F7D774" stroke={false} />
    {/* a plain poster: a coffee cup and stripes (nothing to read) */}
    <Poly b={b} pts={rz(PANEL.z - 0.004, PANEL.x0 + 0.3, PANEL.x1 - 0.3, 0.95, 1.55)} fill="#FFFFFF" />
    <Poly b={b} pts={rz(PANEL.z - 0.005, PANEL.x0 + 0.38, PANEL.x1 - 0.38, 1.05, 1.45)} fill="#8A5A3B" stroke={false} />
    {[0, 1, 2].map((i) => <Poly key={i} b={b} pts={rz(PANEL.z - 0.004, PANEL.x0 + 0.12, PANEL.x1 - 0.12, 1.75 + i * 0.12, 1.8 + i * 0.12)} fill={i % 2 ? '#E05D4F' : '#2E8F8A'} stroke={false} />)}
  </g>
);

// ------------------------------------------------------------------ cameras
const cam = (x: number, y: number, z: number, f = 1450, cy = 900): Cam => ({pos: v3(x, y, z), yaw: 0, pitch: 0, f, cx: 540, cy});
const LED = v3(ROUTER.x - 0.02, ROUTER.y - 0.028, ROUTER.z - 0.03);
const track = (t: number, lead = 0.12, z = -0.78) => cam(heroX(t) - lead, 1.3, z, 1450, 900);
const LAPTOP_C = (d: number) => cam(MONI.x, MONI.y, MONI.z - d, 1500, 960);
export const cafeCam = (t: number): Cam => {
  if (t < (E_OUT + H_IN) / 2) {
    const tr = (tt: number) => track(tt);
    return camPath(t, [
      [CB3.in1, {...cam(LED.x, LED.y, LED.z - 0.42, 9000, 960)}],
      [CB3.in1 + 0.25, {...cam(LED.x, LED.y + 0.01, LED.z - 0.5, 4200, 960)}],
      [CB3.sep + 0.3, cam(ROUTER.x - 0.1, 1.38, 0.9, 1500, 940)],
      [CB3.sci - 0.15, cam(2.05, 1.32, -0.6, 1450, 900)],
      // tracking beside him: in close on his walk, then easing out and round so the window and its laptop join him
      [CB3.sci + 0.5, track(CB3.sci + 0.5, 0.1, -0.55)],
      [CB3.ordinary + 0.4, track(CB3.ordinary + 0.4, 0.25, -0.75)],
      [CB3.signals, {...track(CB3.signals, -0.25, -0.95), pos: v3(heroX(CB3.signals) + 0.25, 1.45, -0.95)}],
      [CB3.identify + 0.1, LAPTOP_C(0.95), true],
      [CB3.even + 0.4, LAPTOP_C(0.84), true],
      [CB3.even + 0.95, track(CB3.even + 0.95, 0.15, -0.8)],
      [E_OUT + 0.3, cam(-4.75, 1.3, -0.8), true],
    ]);
  }
  return camPath(t, [
    [H_IN, LAPTOP_C(0.8)],
    [H_IN + 0.35, LAPTOP_C(0.95)],
    [CB3.walking2 + 0.2, cam(1.25, 1.32, -0.7, 1450, 900)],
    [CB3.cafe + 0.3, track(CB3.cafe + 0.3, 0.2, -0.95)],
    [CB3.recognizes - 0.05, {...track(CB3.recognizes - 0.05, -0.1, -0.6), pos: v3(heroX(CB3.recognizes - 0.05) + 0.1, 1.4, -0.6)}],
    [CB3.recognizes + 0.45, LAPTOP_C(0.95), true],
    [CB3.without2 - 0.05, LAPTOP_C(0.86), true],
    [CB3.without2 + 0.6, track(CB3.without2 + 0.6, -0.15, -0.8)],
    [CB3.anything + 0.1, track(CB3.anything + 0.1, 0.2, -0.8)],
    [CB3.now + 0.1, cam(-4.75, 1.3, -0.8), true],
  ]);
};

// ------------------------------------------------------------------ Wi-Fi
const RING_SPEED = 1.3;
const RING_PERIOD = 0.42;
/** the router's broadcast: wavefronts spreading from it (through the café, out through the glass); where a front
 *  passes his body, scattered arcs head back to the laptop's antenna */
const Wifi: React.FC<{b: B; t: number; him: V3; on: number}> = ({b, t, him, on: on0}) => {
  let on = on0;
  if (on <= 0) return null;
  const c = proj(b, add3(ROUTER, v3(0, 0.12, -0.08)));
  const k = scaleAt(b, ROUTER);
  const far = clamp((b.c.f / k - 1.6) / 1.4);
  on = on * (0.25 + 0.75 * far);
  const out: React.ReactNode[] = [];
  const ant = v3(MONI.x + MONI.w / 2 + 0.05, 1.45, MONI.z + 0.05);
  const dHim = Math.hypot(him.x - ROUTER.x, him.y - ROUTER.y, him.z - ROUTER.z);
  const t0 = Math.floor((t - 0.1) / RING_PERIOD);
  for (let n = t0 - 12; n <= t0; n++) {
    const te = n * RING_PERIOD;
    const R = (t - te) * RING_SPEED;
    if (R <= 0.05 || R > 4.2) continue;
    const a = on * clamp(R / 0.3) * clamp((4.2 - R) / 1.5) * (R > FACADE - ROUTER.z + 0.1 ? 0.9 : 1);
    out.push(<circle key={`r${n}`} cx={f1(c.x)} cy={f1(c.y)} r={f1(k * R)} fill="none" stroke="#BFF6FF" strokeWidth={Math.max(1.4, k * 0.009)} opacity={0.55 * a} />);
    // scattering off his body: launched when the front reaches him, travelling to the laptop's antenna
    const ts = te + dHim / RING_SPEED;
    if (t > ts && t < ts + 1.4) {
      const back = v3(ant.x - him.x, ant.y - him.y, ant.z - him.z);
      const dist = Math.hypot(back.x, back.y, back.z);
      const r = (t - ts) * 2.2;
      if (r < dist) {
        const ctr = add3(him, v3((back.x / dist) * r, (back.y / dist) * r, (back.z / dist) * r));
        const P = proj(b, ctr), kk = scaleAt(b, ctr);
        const rr = (0.08 + r * 0.06) * kk;
        const ang = (Math.atan2(P.y - proj(b, him).y, P.x - proj(b, him).x) * 180) / Math.PI;
        const A = (d: number) => ({x: P.x + Math.cos(((ang + d) * Math.PI) / 180) * rr, y: P.y + Math.sin(((ang + d) * Math.PI) / 180) * rr});
        const p0 = A(-60), p1 = A(60);
        out.push(<path key={`s${n}`} d={`M${f1(p0.x)},${f1(p0.y)} A${f1(rr)},${f1(rr)} 0 0 1 ${f1(p1.x)},${f1(p1.y)}`} fill="none" stroke="#FFE68A" strokeWidth={Math.max(1.4, kk * 0.008)} opacity={on * 0.8 * clamp(r / 0.1) * clamp((dist - r) / 0.3)} />);
      }
    }
  }
  return <g style={{mixBlendMode: 'screen'}}>{out}</g>;
};
/** the moments a scattered front from his body reaches the laptop (they drive the incoming-signal readout) */
const arrivalsAt = (t: number, him: V3) => {
  const ant = v3(MONI.x + MONI.w / 2 + 0.05, 1.45, MONI.z + 0.05);
  const dHim = Math.hypot(him.x - ROUTER.x, him.y - ROUTER.y, him.z - ROUTER.z);
  const dist = Math.hypot(ant.x - him.x, ant.y - him.y, ant.z - him.z);
  const n = Math.floor((t - dHim / RING_SPEED - dist / 2.2) / RING_PERIOD);
  return t - (n * RING_PERIOD + dHim / RING_SPEED + dist / 2.2);
};

// ------------------------------------------------------------------ the analysis laptop
const PAL = ['#173B6B', '#1E6FA8', '#25A6B8', '#7FE0C2', '#F6D26B', '#F08A4B'];
/** a gait signature: columns of colour over time (deterministic per person; stripes repeat at the step rate) */
export const Signature: React.FC<{x: number; y: number; w: number; h: number; seed: number; reveal?: number; cols?: number; rows?: number}> = ({x, y, w, h, seed, reveal = 1, cols = 30, rows = 5}) => (
  <g>
    {Array.from({length: cols}, (_, i) => {
      if (i / cols > reveal) return null;
      return Array.from({length: rows}, (_, j) => {
        const step = Math.sin((i / cols) * Math.PI * 2 * (3 + (seed % 3)) + j * 0.7 + seed);
        const v = 0.5 + 0.32 * step + (hash(i * 7 + j, seed) - 0.5) * 0.4;
        return <rect key={`${i}-${j}`} x={f1(x + (i / cols) * w)} y={f1(y + (j / rows) * h)} width={f1(w / cols + 0.6)} height={f1(h / rows + 0.6)} fill={PAL[Math.max(0, Math.min(5, Math.round(v * 5)))]} />;
      });
    })}
  </g>
);
const mono = 'JetBrains Mono, monospace';
export const Analyzer: React.FC<{b: B; t: number; him: V3}> = ({b, t, him}) => {
  const u = useUid();
  const tl = proj(b, v3(MONI.x - MONI.w / 2, MONI.y + MONI.h / 2, MONI.z)), br = proj(b, v3(MONI.x + MONI.w / 2, MONI.y - MONI.h / 2, MONI.z));
  const r = {x: tl.x, y: tl.y, w: br.x - tl.x, h: br.y - tl.y};
  const fs = r.h * 0.058;
  const H = t > (E_OUT + H_IN) / 2;
  // E: incoming -> signature -> compare -> match -> no phone. H: stored record -> live -> seen before.
  const sig = H ? ss(t, CB3.recognizes - 0.4, CB3.recognizes + 0.3) : ss(t, CB3.identify - 0.1, CB3.people + 0.2);
  const cmp = H ? ss(t, CB3.recognizes + 0.25, CB3.recognizes + 0.55) : ss(t, CB3.people + 0.15, CB3.walking + 0.45);
  const match = H ? ss(t, CB3.recognizes + 0.5, CB3.recognizes + 0.6) : ss(t, CB3.walking + 0.4, CB3.walking + 0.5);
  const phone = H ? 0 : ss(t, CB3.even - 0.05, CB3.even + 0.1);
  // the incoming signal (channel amplitude across subcarriers): flat-ish when the street is empty, rippled by his body
  const near = clamp(1 - Math.abs(him.x - MONI.x) / 2.6);
  const since = arrivalsAt(t, him);
  const kick = near * Math.exp(-since / 0.25);
  const wave = Array.from({length: 40}, (_, i) => {
    const x = r.x + r.w * (0.06 + 0.88 * (i / 39));
    const base = 0.5 + 0.12 * Math.sin(i * 0.35) + 0.05 * Math.sin(i * 1.3 + t * 3);
    const y = base + (0.12 * near + 0.25 * kick) * Math.sin(i * 0.9 + t * 9) * Math.sin(i * 0.21 + 1);
    return `${f1(x)},${f1(r.y + r.h * (0.17 + 0.17 * (1 - y)))}`;
  }).join(' ');
  const rowsE = [{id: '#07', s: 0.34}, {id: '#12', s: 0.94}, {id: '#31', s: 0.41}, {id: '#45', s: 0.28}];
  return (
    <g>
      {/* lid back edge and base on the ledge, the USB antenna */}
      <Poly b={b} pts={rz(MONI.z + 0.012, MONI.x - MONI.w / 2 - 0.018, MONI.x + MONI.w / 2 + 0.018, MONI.y - MONI.h / 2 - 0.02, MONI.y + MONI.h / 2 + 0.018)} fill="#3A4650" />
      <Poly b={b} pts={[v3(MONI.x - MONI.w / 2 - 0.02, 1.23, MONI.z - 0.03), v3(MONI.x + MONI.w / 2 + 0.02, 1.23, MONI.z - 0.03), v3(MONI.x + MONI.w / 2 + 0.03, 1.25, MONI.z + 0.24), v3(MONI.x - MONI.w / 2 - 0.03, 1.25, MONI.z + 0.24)]} fill="#7E8B94" />
      <defs><clipPath id={`${u}ana`}><rect x={r.x} y={r.y} width={r.w} height={r.h} /></clipPath></defs>
      <rect x={r.x} y={r.y} width={r.w} height={r.h} fill="#0B1522" />
      <g clipPath={`url(#${u}ana)`}>
        <rect x={r.x} y={r.y} width={r.w} height={f1(r.h * 0.085)} fill="#15273A" />
        <text x={f1(r.x + r.w * 0.04)} y={f1(r.y + r.h * 0.062)} fontSize={f1(fs * 0.85)} fill="#9CC3DE" fontFamily={mono}>WI-FI SENSING · DEMO</text>
        <circle cx={f1(r.x + r.w * 0.94)} cy={f1(r.y + r.h * 0.043)} r={f1(r.h * 0.018)} fill={Math.floor(t * 2) % 2 ? '#FF4D4D' : '#A33'} />
        {/* 1: incoming signal */}
        <text x={f1(r.x + r.w * 0.05)} y={f1(r.y + r.h * 0.15)} fontSize={f1(fs * 0.8)} fill="#7FA9C9" fontFamily={mono}>INCOMING SIGNAL</text>
        <polyline points={wave} fill="none" stroke="#7CFFB2" strokeWidth={f1(Math.max(1, r.h * 0.009))} strokeLinejoin="round" />
        {/* 2: the signature it builds */}
        <text x={f1(r.x + r.w * 0.05)} y={f1(r.y + r.h * 0.41)} fontSize={f1(fs * 0.8)} fill="#7FA9C9" fontFamily={mono}>{H ? 'WALKER · LIVE' : 'GAIT SIGNATURE'}</text>
        <Signature x={r.x + r.w * 0.05} y={r.y + r.h * 0.43} w={r.w * 0.56} h={r.h * 0.12} seed={12} reveal={sig} />
        {!H && (
          <g opacity={cmp}>
            <text x={f1(r.x + r.w * 0.05)} y={f1(r.y + r.h * 0.63)} fontSize={f1(fs * 0.8)} fill="#7FA9C9" fontFamily={mono}>COMPARE</text>
            {rowsE.map((row, i) => {
              const y = r.y + r.h * (0.67 + i * 0.075);
              const hit = row.id === '#12';
              const bar = clamp(cmp * 1.2 - i * 0.05) * row.s;
              return (
                <g key={row.id}>
                  {hit && match > 0 && <rect x={f1(r.x + r.w * 0.03)} y={f1(y - r.h * 0.005)} width={f1(r.w * 0.94)} height={f1(r.h * 0.065)} fill="#1D6B4A" opacity={match} />}
                  <text x={f1(r.x + r.w * 0.05)} y={f1(y + r.h * 0.045)} fontSize={f1(fs * 0.8)} fill="#DDE8EF" fontFamily={mono}>{row.id}</text>
                  <rect x={f1(r.x + r.w * 0.2)} y={f1(y + r.h * 0.012)} width={f1(r.w * 0.5 * bar)} height={f1(r.h * 0.035)} fill={hit ? '#7CFFB2' : '#4E6E86'} />
                </g>
              );
            })}
            {match > 0 && <text x={f1(r.x + r.w * 0.95)} y={f1(r.y + r.h * 0.76)} textAnchor="end" fontSize={f1(fs * 1.2)} fill="#7CFFB2" fontFamily={mono} fontWeight={700} opacity={match}>MATCH</text>}
          </g>
        )}
        {!H && phone > 0 && (
          <g opacity={phone}>
            <rect x={f1(r.x + r.w * 0.66)} y={f1(r.y + r.h * 0.4)} width={f1(r.w * 0.3)} height={f1(r.h * 0.18)} rx={f1(r.h * 0.02)} fill="#13283A" stroke="#FFD24A" strokeWidth={f1(r.h * 0.006)} />
            {/* a phone outline, crossed: no device of his is involved */}
            <rect x={f1(r.x + r.w * 0.69)} y={f1(r.y + r.h * 0.425)} width={f1(r.w * 0.05)} height={f1(r.h * 0.13)} rx={f1(r.h * 0.012)} fill="none" stroke="#FFD24A" strokeWidth={f1(r.h * 0.008)} />
            <line x1={f1(r.x + r.w * 0.68)} y1={f1(r.y + r.h * 0.565)} x2={f1(r.x + r.w * 0.75)} y2={f1(r.y + r.h * 0.415)} stroke="#FF6B5A" strokeWidth={f1(r.h * 0.01)} />
            <text x={f1(r.x + r.w * 0.77)} y={f1(r.y + r.h * 0.47)} fontSize={f1(fs * 0.62)} fill="#FFD24A" fontFamily={mono}>PHONE</text>
            <text x={f1(r.x + r.w * 0.77)} y={f1(r.y + r.h * 0.53)} fontSize={f1(fs * 0.62)} fill="#FFD24A" fontFamily={mono}>NONE</text>
          </g>
        )}
        {H && (
          <g>
            <text x={f1(r.x + r.w * 0.05)} y={f1(r.y + r.h * 0.63)} fontSize={f1(fs * 0.8)} fill="#7FA9C9" fontFamily={mono}>STORED · MON 08:41</text>
            <Signature x={r.x + r.w * 0.05} y={r.y + r.h * 0.65} w={r.w * 0.56} h={r.h * 0.12} seed={12} reveal={1} />
            <text x={f1(r.x + r.w * 0.66)} y={f1(r.y + r.h * 0.73)} fontSize={f1(fs * 1.0)} fill="#DDE8EF" fontFamily={mono}>#12</text>
            {cmp > 0 && <rect x={f1(r.x + r.w * 0.05)} y={f1(r.y + r.h * 0.84)} width={f1(r.w * 0.56 * cmp * 0.95)} height={f1(r.h * 0.035)} fill="#7CFFB2" />}
            {match > 0 && <text x={f1(r.x + r.w * 0.05)} y={f1(r.y + r.h * 0.95)} fontSize={f1(fs * 1.05)} fill="#7CFFB2" fontFamily={mono} fontWeight={700} opacity={match}>SEEN BEFORE · #12</text>}
          </g>
        )}
      </g>
      {/* the screen's glass: a soft reflection band */}
      <path d={`M${f1(r.x + r.w * 0.55)},${f1(r.y)} L${f1(r.x + r.w * 0.7)},${f1(r.y)} L${f1(r.x + r.w * 0.45)},${f1(r.y + r.h)} L${f1(r.x + r.w * 0.3)},${f1(r.y + r.h)} Z`} fill="#FFFFFF" opacity={0.04} />
      {/* the small USB antenna */}
      <line x1={f1(br.x + r.w * 0.06)} y1={f1(br.y + r.h * 0.12)} x2={f1(br.x + r.w * 0.12)} y2={f1(tl.y + r.h * 0.1)} stroke={INK} strokeWidth={Math.max(1.5, scaleAt(b, v3(MONI.x, MONI.y, MONI.z)) * 0.012)} strokeLinecap="round" />
    </g>
  );
};

// ------------------------------------------------------------------ the scene
const HANDS: HandPose = {curl: [0.16, 0.2, 0.24, 0.28], spread: 0.4, thumb: 28, thumbCurl: 0.25};
export const CafeScene3: React.FC<{t: number}> = ({t}) => {
  const u = useUid();
  const b = basis(cafeCam(t));
  const H = t > (E_OUT + H_IN) / 2;
  const h = heroAt(t);
  const cd = cardAt(b, h.at);
  const him = v3(h.wx, 1.15, PATH_Z);
  // H: the glance at the window as the match lands (head toward the camera, eyes to the right, uneasy)
  const notice = H ? ss(t, CB3.anything - 0.35, CB3.anything + 0.1) * (1 - ss(t, CB3.now - 0.2, CB3.now + 0.1)) : 0;
  const ex: Expr = mixExpr({...EXPR_NEUTRAL, smile: 0.3, gx: -0.5}, {...EXPR_UNEASY, gx: 0.9, gy: -0.1, browIn: 0.95, pupil: 0.72}, notice);
  const p = {...h.p, turn: h.p.turn - 0.25 * notice, neck: h.p.neck + 3 * notice};
  const wifiOn = ss(t, CB3.in1 + 0.25, CB3.in1 + 0.6);
  void manJoints;
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}}>
      <rect width={1080} height={1920} fill={CC.sky} />
      <CafeBack b={b} t={t} />
      <Analyzer b={b} t={t} him={him} />
      <BladeSign b={b} />
      <CafeGround b={b} />
      <FloorShadow cd={cd} x={0} w={210} />
      <Person id={`${u}hero`} cd={cd} p={p} farBehind look={{expr: ex, lHand: HANDS, rHand: HANDS, hairSway: 2 * Math.sin(t * 6.4)}} />
      <Wifi b={b} t={t} him={him} on={wifiOn} />
      <CafeFore b={b} />
      <AdPanel b={b} />
    </svg>
  );
};
