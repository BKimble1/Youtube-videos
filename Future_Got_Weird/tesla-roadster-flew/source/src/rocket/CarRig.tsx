// The schematic car: the approved traced Roadster (companion3/Car3) with a generic cold-gas system, all drawn in ONE
// car-local frame (sim.ts) that the scene places once (height, mirror to face left, pitch about the centre of mass).
//   Outside: three nozzle units, each a housing bolted into the underbody (its top edge sits inside the sill, the rear
//   overhang or the bumper) with a bell below it. Each plume starts at its bell's exit and only its puffs drift.
//   Cutaway: the lower side panel lifts off (the sill opens too): the tank with gas markers, the valve, the manifold
//   and the pipes to each nozzle mount. Markers leave the tank along those pipes when a nozzle fires; the gas in the tank
//   pales as the reserve drops (no number). Brackets bolt the tank to the sill and the roof rail; a frame can close
//   around it.
//   Phantom: with the panel shut, a dashed outline of the tank and the nose pipe shows gas going to the nose thruster.
// Nothing here is Tesla's layout. Exhaust is cold gas: pale, no flame.
import React from 'react';
import {Car3, OUTLINE_D, SKIRT_OUTLINE_D, WHEELS3, roofAt3} from '../companion3/Car3';
import {C} from '../theme';
import {Arrow, FLOW, FLOW_LIGHT, FORCE, rnd} from './kit';
import {CG, DOT_TRAVEL, DOTS, MANIFOLD_Y, MOUNT, NOZ, NozKey, VALVE, nozzleAt, pathTo, reserveAt, tankAt} from './sim';

const INK = '#0B1418';
export const AMBER = '#E39A12';
export type RigState = {
  t: number;            // film time
  cut: number;          // 0..1 the side panel lifted off (cutaway)
  shell?: number;       // 0..1 heavier tank wall
  brackets?: number;    // 0..1 mounting brackets bolted on
  cage?: number;        // 0..1 protective frame closed around the tank
  flowGlow?: number;    // extra brightness of the gas ribbon
  tankWeight?: number;  // 0..1 a small weight arrow under the tank (its added mass)
  cgMark?: number;      // 0..1 centre-of-mass dot
  cgAmber?: number;     // 0..1 the dot's ring amber (unbalanced) instead of white (settled)
  offset?: {o: number; d: number}; // resultant lift thrust drawn off the centre (opacity, distance behind it)
  noseArrow?: boolean;  // upward push at the nose while the nose thruster fires
  phantom?: number;     // 0..1 dashed tank and nose pipe over the closed body
  plumeLen?: number;    // world units of a full-strength lift plume
};

const lerpHex = (a: string, b: string, u: number) => {
  const p = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const A = p(a), B = p(b);
  return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * Math.max(0, Math.min(1, u))).toString(16).padStart(2, '0')).join('');
};
export const gasTint = (r: number) => lerpHex('#25323C', '#3D78C6', r);

// ---------------------------------------------------------------- plumes
const EMIT = 1 / 60;
/** Exhaust from a fixed exit (x, y): a core cone that starts at the exit's width, flow lines, and puffs emitted while
 *  the nozzle fires (a burst leaves as a separate puff; puffs drift and spread, the origin never moves). */
const Plume: React.FC<{t: number; k: (t: number) => number; x: number; y: number; ew: number; small?: boolean; len: number; seed: number}> = ({t, k, x, y, ew, small, len, seed}) => {
  const life = small ? 0.4 : 0.62;
  const speed = len / life;
  const puffs: React.ReactNode[] = [];
  const n0 = Math.floor((t - life) / EMIT), n1 = Math.floor(t / EMIT);
  for (let n = n0; n <= n1; n++) {
    const e = n * EMIT;
    const ke = k(e);
    if (ke <= 0.02) continue;
    const a = t - e;
    if (a < 0 || a > life) continue;
    const u = a / life;
    const r = ew * 0.8 + u * (small ? 18 : 30) * Math.min(1.4, ke);
    const jx = (rnd(n + seed) - 0.5) * 10 * u;
    const cy = y + 3 + a * speed * Math.min(1.25, 0.6 + 0.45 * ke);
    const op = Math.min(1, ke) * (1 - u) ** 1.6 * 0.34;
    puffs.push(<circle key={n} cx={x + jx} cy={cy} r={r} fill="#EAF2FA" opacity={op} />);
  }
  const kn = k(t);
  const L = len * 0.55 * Math.min(1.3, kn);
  const spread = (small ? 9 : 16) * Math.min(1.3, kn);
  const core = kn > 0.02 ? (
    <g opacity={Math.min(1, kn)}>
      <path d={`M ${x - ew * 0.85} ${y} L ${x + ew * 0.85} ${y} L ${x + ew * 0.85 + spread} ${y + L} L ${x - ew * 0.85 - spread} ${y + L} Z`} fill="url(#rkJet)" />
      {[0, 1, 2].map((i) => {
        const ph = ((t * (small ? 3.2 : 2.4) + i / 3) % 1);
        const y0 = y + 6 + ph * len * 0.42, y1 = y0 + len * 0.1;
        const xo = (i - 1) * (small ? 2.5 : 5);
        return <line key={i} x1={x + xo} y1={y0} x2={x + xo * 1.6} y2={y1} stroke={FLOW} strokeWidth={small ? 2.4 : 3.6} strokeLinecap="round" opacity={0.75 * (1 - ph)} />;
      })}
    </g>
  ) : null;
  return <g>{puffs}{core}</g>;
};

/** A nozzle unit: housing bolted into the underbody, then the bell; its exit (NOZ) is where the plume starts. */
const NozzleUnit: React.FC<{k: NozKey; glow: number}> = ({k, glow}) => {
  const n = NOZ[k], m = MOUNT[k];
  const xl = n.x - m.w, xr = n.x + m.w;
  const housing = `M ${xl} ${m.top[0]} L ${xr} ${m.top[1]} L ${xr - 1.5} ${m.bot} L ${xl + 1.5} ${m.bot} Z`;
  const bell = `M ${n.x - m.bell} ${m.bot} L ${n.x + m.bell} ${m.bot} L ${n.x + m.exit} ${n.y} L ${n.x - m.exit} ${n.y} Z`;
  const bolt = m.w > 8 ? 2 : 1.4;
  const by = (m.top[0] + m.top[1]) / 2 + 3.2;
  return (
    <g>
      <path d={housing} fill="url(#rkMetal)" stroke={INK} strokeWidth={2} strokeLinejoin="round" />
      <circle cx={xl + 3.6} cy={by} r={bolt} fill="#C9D2D8" stroke={INK} strokeWidth={0.9} />
      <circle cx={xr - 3.6} cy={by} r={bolt} fill="#C9D2D8" stroke={INK} strokeWidth={0.9} />
      <path d={bell} fill="url(#rkBell)" stroke={INK} strokeWidth={2} strokeLinejoin="round" />
      <ellipse cx={n.x} cy={n.y} rx={m.exit} ry={m.exit * 0.28} fill={glow > 0.05 ? '#DCEBF8' : '#1A2329'} stroke={INK} strokeWidth={1.4} />
    </g>
  );
};

export const ptOn = (pts: [number, number][], u: number): [number, number] => {
  const seg = pts.slice(1).map((p, i) => Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1]));
  const L = seg.reduce((a, b) => a + b, 0);
  let d = Math.max(0, Math.min(1, u)) * L;
  for (let i = 0; i < seg.length; i++) {
    if (d <= seg[i] || i === seg.length - 1) {
      const f = seg[i] ? Math.min(1, d / seg[i]) : 0;
      return [pts[i][0] + (pts[i + 1][0] - pts[i][0]) * f, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * f];
    }
    d -= seg[i];
  }
  return pts[pts.length - 1];
};
const dPath = (pts: [number, number][]) => 'M ' + pts.map((p) => p.join(' ')).join(' L ');

/** Markers: at rest in the tank (slow drift), or travelling along the pipe to their nozzle, then out of the exit. */
const Markers: React.FC<{t: number; tank: ReturnType<typeof tankAt>; only?: NozKey; restO?: number}> = ({t, tank, only, restO = 1}) => {
  const inner = {x0: tank.x0 + 8, x1: tank.x1 - 8, y0: tank.y0 + 6, y1: tank.y1 - 6};
  return (
    <g>
      {DOTS.map((d, i) => {
        if (d.born > t) return null;
        const bornO = Math.min(1, (t - d.born) / 0.3);
        const hx = inner.x0 + (inner.x1 - inner.x0) * d.u + Math.sin(t * 0.9 + i * 1.7) * 0.8;
        const hy = inner.y0 + (inner.y1 - inner.y0) * d.v + Math.cos(t * 0.8 + i) * 0.6;
        if (t < d.leave) return restO > 0 && !only ? <circle key={i} cx={hx} cy={hy} r={3.4} fill="#A9CCF6" stroke="#2C5DA6" strokeWidth={0.8} opacity={bornO * restO} /> : null;
        if (only && d.to !== only) return null;
        const a = (t - d.leave) / DOT_TRAVEL;
        if (a > 1.35) return null;
        const pts: [number, number][] = [[hx, hy], ...pathTo(d.to, tank)];
        const n = NOZ[d.to];
        const [px, py] = a <= 1 ? ptOn(pts, a) : [n.x, n.y + (a - 1) * 140];
        return <circle key={i} cx={px} cy={py} r={3.8} fill="#E3EEFC" stroke={FLOW} strokeWidth={1.6} opacity={a > 1 ? 1 - (a - 1) / 0.35 : 1} />;
      })}
    </g>
  );
};

/** Everything in car-local coordinates; the caller places it (translate, mirror, pitch about CG). */
export const CarRig: React.FC<{s: RigState}> = ({s}) => {
  const {t} = s;
  const cut = s.cut;
  const tank = tankAt(t);
  const noz = nozzleAt(t);
  const len = s.plumeLen ?? 260;
  const k = (key: NozKey) => (tt: number) => nozzleAt(tt)[key];
  const shell = s.shell ?? 0, cage = s.cage ?? 0, brk = s.brackets ?? 0;
  const tw = tank.x1 - tank.x0, th = tank.y1 - tank.y0;
  const reserve = reserveAt(t);
  const open = Math.min(1, Math.max(...(['front', 'rear', 'nose'] as NozKey[]).map((q) => nozzleAt(t + 0.05)[q])));
  const hw = Math.min(1, Math.max(0, (cut - 0.25) / 0.6));
  const ph = s.phantom ?? 0;
  const ribs = [-90, -60, -30, 0, 30, 60, 90].map((x) => <line key={x} x1={x} y1={-100} x2={x} y2={-40} stroke="#4A5762" strokeWidth={2} />);
  return (
    <g>
      <defs>
        <linearGradient id="rkJet" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity={0.92} />
          <stop offset="0.5" stopColor="#DCEBF8" stopOpacity={0.42} />
          <stop offset="1" stopColor="#C8DDF3" stopOpacity={0} />
        </linearGradient>
        <linearGradient id="rkTank" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#F2F5F7" />
          <stop offset="0.22" stopColor="#FFFFFF" />
          <stop offset="0.6" stopColor="#BCC6CD" />
          <stop offset="1" stopColor="#7F8C95" />
        </linearGradient>
        <linearGradient id="rkMetal" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#59656D" />
          <stop offset="1" stopColor="#323C43" />
        </linearGradient>
        <linearGradient id="rkBell" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#4C565D" />
          <stop offset="0.4" stopColor="#9AA6AE" />
          <stop offset="1" stopColor="#3A444A" />
        </linearGradient>
        <linearGradient id="rkInside" x1="0" y1={-100} x2="0" y2={0} gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#5A6772" />
          <stop offset="1" stopColor="#36424B" />
        </linearGradient>
        <linearGradient id="rkPipe" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#C3CCD2" />
          <stop offset="1" stopColor="#7D8991" />
        </linearGradient>
        <clipPath id="rkBody"><path d={OUTLINE_D} /><path d={SKIRT_OUTLINE_D} /></clipPath>
        {/* the cut edge follows the outside of body + sill only: each outline is hidden where it runs along the other */}
        <mask id="rkEdgeBody" maskUnits="userSpaceOnUse" x={-260} y={-160} width={520} height={200}>
          <rect x={-260} y={-160} width={520} height={200} fill="#fff" />
          <path d={SKIRT_OUTLINE_D} fill="#000" stroke="#000" strokeWidth={9} />
        </mask>
        <mask id="rkEdgeSkirt" maskUnits="userSpaceOnUse" x={-260} y={-160} width={520} height={200}>
          <rect x={-260} y={-160} width={520} height={200} fill="#fff" />
          <path d={OUTLINE_D} fill="#000" stroke="#000" strokeWidth={9} />
        </mask>
        <mask id="rkCutMask" maskUnits="userSpaceOnUse" x={-260} y={-160} width={520} height={200}>
          <rect x={-260} y={-101} width={520} height={140} fill="#fff" />
          {WHEELS3.map((w, i) => <circle key={i} cx={w.x} cy={w.y} r={w.r + 3} fill="#000" />)}
        </mask>
      </defs>
      {/* plumes first: they leave from the exits under the body */}
      <Plume t={t} k={k('front')} x={NOZ.front.x} y={NOZ.front.y} ew={MOUNT.front.exit} len={len} seed={11} />
      <Plume t={t} k={k('rear')} x={NOZ.rear.x} y={NOZ.rear.y} ew={MOUNT.rear.exit} len={len} seed={53} />
      <Plume t={t} k={k('nose')} x={NOZ.nose.x} y={NOZ.nose.y} ew={MOUNT.nose.exit} len={len * 0.42} small seed={97} />
      <Car3 x={0} y={0} id="rk" refl={-60 + 30 * Math.sin(t * 0.7)} />
      {/* the cutaway: the lower side panel (and the sill) lifts off and fades, showing the inside */}
      {cut > 0.001 && (
        <g mask="url(#rkCutMask)">
          <g clipPath="url(#rkBody)">
            <g opacity={Math.min(1, cut * 1.4)}>
              <rect x={-240} y={-105} width={480} height={120} fill="url(#rkInside)" />
              {ribs}
              <rect x={-240} y={-105} width={480} height={6} fill="#2A343C" />
              <rect x={-240} y={-52} width={480} height={4} fill="#2E3940" opacity={0.7} />
            </g>
            <g opacity={hw}>
              {/* pipes: valve drop, manifold along the sill, lift lines (thick) and the nose line (thin) to each mount */}
              {(['front', 'rear', 'nose'] as NozKey[]).map((key) => {
                const pts = pathTo(key, tank).slice(1, -1);
                const end = MOUNT[key];
                const last = pts[pts.length - 1];
                const full: [number, number][] = [...pts, [last[0], (end.top[0] + end.top[1]) / 2 + 2]];
                const w = key === 'nose' ? 3.2 : 6;
                return (
                  <g key={key}>
                    <path d={dPath(full)} stroke={INK} strokeWidth={w + 2.4} fill="none" strokeLinejoin="round" />
                    <path d={dPath(full)} stroke="url(#rkPipe)" strokeWidth={w} fill="none" strokeLinejoin="round" />
                  </g>
                );
              })}
              <path d={`M ${tank.x0 + tw / 2} ${tank.y1} L ${VALVE.x} ${VALVE.y}`} stroke={INK} strokeWidth={8.4} />
              <path d={`M ${tank.x0 + tw / 2} ${tank.y1} L ${VALVE.x} ${VALVE.y}`} stroke="url(#rkPipe)" strokeWidth={6} />
              {/* gas ribbon to each nozzle that is firing */}
              {(['front', 'rear', 'nose'] as NozKey[]).map((key) => {
                const f = Math.min(1, noz[key]);
                if (f < 0.04) return null;
                const d = dPath(pathTo(key, tank));
                const small = key === 'nose';
                return (
                  <g key={key} opacity={f * (0.75 + 0.25 * (s.flowGlow ?? 0))}>
                    <path d={d} stroke={FLOW_LIGHT} strokeWidth={small ? 4 : 5.5} fill="none" strokeLinejoin="round" opacity={0.85} />
                    <path d={d} stroke={FLOW} strokeWidth={small ? 2 : 2.8} fill="none" strokeLinejoin="round" strokeDasharray="9 11" strokeDashoffset={-t * 110} />
                  </g>
                );
              })}
              {/* brackets: straps round the tank, feet bolted to the sill below and the roof rail above */}
              {brk > 0.001 && [0.2, 0.8].map((f) => {
                const mx = tank.x0 + tw * f;
                const drop = 8 * (1 - brk);
                return (
                  <g key={f} opacity={Math.min(1, brk * 1.5)} transform={`translate(0 ${-drop})`}>
                    <path d={`M ${mx - 7} ${tank.y1 + 1} L ${mx - 10} -49 L ${mx + 10} -49 L ${mx + 7} ${tank.y1 + 1} Z`} fill="url(#rkMetal)" stroke={INK} strokeWidth={1.8} strokeLinejoin="round" />
                    <path d={`M ${mx - 7} ${tank.y0 - 1} L ${mx - 10} -100 L ${mx + 10} -100 L ${mx + 7} ${tank.y0 - 1} Z`} fill="url(#rkMetal)" stroke={INK} strokeWidth={1.8} strokeLinejoin="round" />
                    {[-6, 6].map((dx) => <circle key={dx} cx={mx + dx} cy={-52} r={1.7} fill="#C9D2D8" stroke={INK} strokeWidth={0.8} />)}
                    {[-6, 6].map((dx) => <circle key={'u' + dx} cx={mx + dx} cy={-97} r={1.7} fill="#C9D2D8" stroke={INK} strokeWidth={0.8} />)}
                  </g>
                );
              })}
              {/* tank: shell (wall thickens with `shell`), gas inside tinted by the reserve, markers */}
              <rect x={tank.x0} y={tank.y0} width={tw} height={th} rx={th / 2} fill="url(#rkTank)" stroke={INK} strokeWidth={2.2 + 1.6 * shell} />
              <rect x={tank.x0 + 3 + 3 * shell} y={tank.y0 + 3 + 3 * shell} width={tw - 6 - 6 * shell} height={th - 6 - 6 * shell} rx={(th - 6 - 6 * shell) / 2} fill={gasTint(reserve)} stroke="#15222B" strokeWidth={1} />
              <rect x={tank.x0 + th * 0.4} y={tank.y0 + 3 + 3 * shell + 1.5} width={tw - th * 0.8} height={2.4} rx={1.2} fill="#FFFFFF" opacity={0.28} />
              {brk > 0.001 && [0.2, 0.8].map((f) => (
                <rect key={f} x={tank.x0 + tw * f - 7} y={tank.y0 - 1.5} width={14} height={th + 3} rx={2} fill="url(#rkMetal)" stroke={INK} strokeWidth={1.6} opacity={Math.min(1, brk * 1.5)} />
              ))}
              <Markers t={t} tank={tank} />
              {/* protective frame: two halves close around the tank */}
              {cage > 0.001 && [-1, 1].map((side) => {
                const off = (1 - cage) * 30 * side;
                const ya = side < 0 ? tank.y0 - 7 : tank.y1 + 7;
                const mid = (tank.y0 + tank.y1) / 2;
                return (
                  <g key={side} transform={`translate(0 ${off})`} opacity={Math.min(1, cage * 2)}>
                    <path d={`M ${tank.x0 - 7} ${mid} L ${tank.x0 - 7} ${ya} L ${tank.x1 + 7} ${ya} L ${tank.x1 + 7} ${mid}`} fill="none" stroke={INK} strokeWidth={7} strokeLinejoin="round" />
                    <path d={`M ${tank.x0 - 7} ${mid} L ${tank.x0 - 7} ${ya} L ${tank.x1 + 7} ${ya} L ${tank.x1 + 7} ${mid}`} fill="none" stroke="#E2AC3F" strokeWidth={4.2} strokeLinejoin="round" />
                    {Array.from({length: 4}, (_, j) => {
                      const x = tank.x0 + tw * (0.2 + 0.2 * j);
                      return (
                        <g key={j}>
                          <line x1={x} y1={ya} x2={x} y2={mid} stroke={INK} strokeWidth={6} />
                          <line x1={x} y1={ya} x2={x} y2={mid} stroke="#E2AC3F" strokeWidth={3.4} />
                        </g>
                      );
                    })}
                  </g>
                );
              })}
              {/* valve: body, a window that turns blue when open, and the lever (along the pipe when open) */}
              <rect x={VALVE.x - 8} y={VALVE.y - 8} width={16} height={16} rx={3.5} fill={C.blue} stroke={INK} strokeWidth={2} />
              <rect x={VALVE.x - 3} y={VALVE.y - 5} width={6} height={10} rx={2} fill={open > 0.3 ? FLOW_LIGHT : '#1B2733'} />
              <g transform={`translate(${VALVE.x + 10} ${VALVE.y}) rotate(${90 - 90 * open})`}>
                <rect x={-2} y={-2} width={20} height={4} rx={2} fill={C.coral} stroke={INK} strokeWidth={1.2} />
                <circle r={2.6} fill={INK} />
              </g>
            </g>
            {/* cut edge: the panel's thickness */}
            <g opacity={cut}>
              <path d={OUTLINE_D} fill="none" stroke="#F4F7F8" strokeWidth={6} mask="url(#rkEdgeBody)" />
              <path d={SKIRT_OUTLINE_D} fill="none" stroke="#F4F7F8" strokeWidth={6} mask="url(#rkEdgeSkirt)" />
            </g>
          </g>
          {/* the panel itself, lifting away */}
          <g clipPath="url(#rkBody)" opacity={Math.max(0, 1 - cut * 1.6)} transform={`translate(0 ${-34 * cut})`}>
            <rect x={-240} y={-101} width={480} height={120} fill="#EEF2F4" />
          </g>
        </g>
      )}
      {/* phantom: the tank and the nose pipe through the closed body, gas going to the nose thruster */}
      {ph > 0.01 && (
        <g opacity={ph}>
          <rect x={tank.x0} y={tank.y0} width={tw} height={th} rx={th / 2} fill={gasTint(reserve)} opacity={0.42} />
          <Markers t={t} tank={tank} restO={0.85} />
          <path d={dPath(pathTo('nose', tank))} stroke="#FFFFFF" strokeWidth={3} strokeDasharray="7 6" fill="none" strokeLinejoin="round" opacity={0.9} />
          <rect x={tank.x0} y={tank.y0} width={tw} height={th} rx={th / 2} fill="none" stroke="#FFFFFF" strokeWidth={3} strokeDasharray="8 6" />
          <Markers t={t} tank={tank} only="nose" restO={0} />
        </g>
      )}
      {/* nozzle units, on the body */}
      {(['front', 'rear', 'nose'] as NozKey[]).map((key) => <NozzleUnit key={key} k={key} glow={noz[key]} />)}
      {/* body-fixed annotations */}
      {s.offset && s.offset.o > 0 && (() => {
        // the resultant lift thrust along its line of action behind the centre of mass; the lever arm to the centre
        const lx = CG.x - s.offset.d, top = roofAt3(lx) - 4;
        return (
          <g opacity={s.offset.o}>
            <line x1={lx} y1={top} x2={lx} y2={CG.y} stroke={INK} strokeWidth={2.5} strokeDasharray="6 6" />
            <line x1={CG.x} y1={CG.y} x2={lx} y2={CG.y} stroke={AMBER} strokeWidth={5} />
            <line x1={lx} y1={CG.y - 9} x2={lx} y2={CG.y + 9} stroke={AMBER} strokeWidth={5} />
            <Arrow x1={lx} y1={top} x2={lx} y2={top - 140} color={AMBER} w={14} />
          </g>
        );
      })()}
      {s.noseArrow && (() => {
        const f = Math.min(1, noz.nose * 1.2);
        if (f < 0.05) return null;
        const top = roofAt3(NOZ.nose.x) - 4;
        return <Arrow x1={NOZ.nose.x} y1={top} x2={NOZ.nose.x} y2={top - 110} color={FORCE} w={13} opacity={f} />;
      })()}
      {(s.tankWeight ?? 0) > 0.01 && (
        // under the tank, beside the valve; short enough to stay above the captions in the close-up
        <Arrow x1={tank.x0 + tw * 0.68} y1={tank.y1 + 3} x2={tank.x0 + tw * 0.68} y2={tank.y1 + 3 + 14 + 16 * (s.tankWeight ?? 0)} color="#3A4A52" w={6} opacity={Math.min(1, (s.tankWeight ?? 0) * 3)} />
      )}
      {(s.cgMark ?? 0) > 0 && (
        <g transform={`translate(${CG.x} ${CG.y}) scale(${0.6 + 0.4 * (s.cgMark ?? 0)})`} opacity={s.cgMark}>
          <circle r={11} fill={s.cgAmber && s.cgAmber > 0.02 ? lerpHex('#FFFFFF', AMBER, s.cgAmber) : '#FFFFFF'} stroke={INK} strokeWidth={3} />
          <circle r={5} fill={INK} />
        </g>
      )}
    </g>
  );
};
