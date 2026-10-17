// The schematic car: the approved traced Roadster (companion3/Car3), mirrored to face left like the real car in Tesla's
// side replay, with a generic cold-gas system revealed by lifting off its lower side panel: a tank of gas (dots), a valve,
// a manifold and four nozzles (two lift jets, a small nose and tail thruster for pitch). Nothing here is Tesla's layout;
// the lift-jet exits sit where the replay shows plumes. Plumes are built from puffs emitted while a nozzle fires, so a
// burst leaves as a separate puff and a steady jet looks continuous. Exhaust is cold gas: pale, no flame.
import React from 'react';
import {Car3, OUTLINE_D, WHEELS3, roofAt3} from '../companion3/Car3';
import {C} from '../theme';
import {Arrow, FLOW, FLOW_LIGHT, FORCE, rnd} from './kit';
import {CG, DOT_TRAVEL, DOTS, MANIFOLD_Y, NOZ, NozKey, VALVE, nozzleAt, pathTo, tankAt} from './sim';

const INK = '#0B1418';
export type RigState = {
  t: number;            // film time
  cut: number;          // 0..1 the side panel lifted off (cutaway)
  shell?: number;       // 0..1 heavier tank wall and mounts
  cage?: number;        // 0..1 protective frame closed around the tank
  flowGlow?: number;    // extra brightness of the gas ribbon
  tankGlow?: number;    // saffron rim on the tank
  cgMark?: number;      // 0..1 centre-of-mass marker
  offset?: {o: number; d: number}; // resultant lift thrust drawn off the centre (opacity, distance behind it)
  pulseArrows?: boolean;
  plumeLen?: number;    // world units of a full-strength lift plume
  hideDots?: boolean;
};

// ---------------------------------------------------------------- plumes
const EMIT = 1 / 60;
const Plume: React.FC<{t: number; k: (t: number) => number; x: number; y: number; small?: boolean; len: number; seed: number}> = ({t, k, x, y, small, len, seed}) => {
  const life = small ? 0.38 : 0.62;
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
    const r = (small ? 4 : 7) + u * (small ? 16 : 30) * Math.min(1.4, ke);
    const jx = (rnd(n + seed) - 0.5) * 10 * u;
    const cy = y + 6 + a * speed * Math.min(1.25, 0.6 + 0.45 * ke);
    const op = Math.min(1, ke) * (1 - u) ** 1.6 * 0.34;
    puffs.push(<circle key={n} cx={x + jx} cy={cy} r={r} fill="#EAF2FA" opacity={op} />);
  }
  const kn = k(t);
  const core = kn > 0.02 ? (
    <g opacity={Math.min(1, kn)}>
      <path d={`M ${x - (small ? 3 : 5)} ${y} L ${x + (small ? 3 : 5)} ${y} L ${x + (small ? 8 : 15) * kn} ${y + len * 0.55 * Math.min(1.3, kn)} L ${x - (small ? 8 : 15) * kn} ${y + len * 0.55 * Math.min(1.3, kn)} Z`} fill="url(#rkJet)" />
      {/* flow lines: the exhaust goes down */}
      {[0, 1, 2].map((i) => {
        const ph = ((t * (small ? 3.2 : 2.4) + i / 3) % 1);
        const y0 = y + 8 + ph * len * 0.42, y1 = y0 + len * 0.1;
        const xo = (i - 1) * (small ? 3 : 7);
        return <line key={i} x1={x + xo} y1={y0} x2={x + xo * 1.5} y2={y1} stroke={FLOW} strokeWidth={small ? 2.4 : 3.6} strokeLinecap="round" opacity={0.75 * (1 - ph)} />;
      })}
    </g>
  ) : null;
  return <g>{puffs}{core}</g>;
};

const Nozzle: React.FC<{x: number; y: number; small?: boolean}> = ({x, y, small}) => {
  const w = small ? 6 : 10, h = small ? 7 : 11;
  return <path d={`M ${x - w * 0.55} ${y - h} L ${x + w * 0.55} ${y - h} L ${x + w} ${y} L ${x - w} ${y} Z`} fill="#5A646A" stroke={INK} strokeWidth={2} strokeLinejoin="round" />;
};

const ptOn = (pts: [number, number][], u: number): [number, number] => {
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

/** Everything in car-local coordinates; the caller places it (translate, mirror, pitch about CG). */
export const CarRig: React.FC<{s: RigState}> = ({s}) => {
  const {t} = s;
  const cut = s.cut;
  const tank = tankAt(t);
  const noz = nozzleAt(t);
  const len = s.plumeLen ?? 260;
  const k = (key: NozKey) => (tt: number) => nozzleAt(tt)[key];
  const firing = (key: NozKey) => noz[key] > 0.05;
  const shell = s.shell ?? 0, cage = s.cage ?? 0;
  const tw = tank.x1 - tank.x0, th = tank.y1 - tank.y0;
  return (
    <g>
      <defs>
        <linearGradient id="rkJet" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity={0.9} />
          <stop offset="0.5" stopColor="#DCEBF8" stopOpacity={0.42} />
          <stop offset="1" stopColor="#C8DDF3" stopOpacity={0} />
        </linearGradient>
        <linearGradient id="rkTank" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#E8EDF0" />
          <stop offset="0.5" stopColor="#C4CDD3" />
          <stop offset="1" stopColor="#97A3AB" />
        </linearGradient>
        <linearGradient id="rkInside" x1="0" y1={-100} x2="0" y2={0} gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#56636E" />
          <stop offset="1" stopColor="#3E4A54" />
        </linearGradient>
        <clipPath id="rkBody"><path d={OUTLINE_D} /></clipPath>
        <mask id="rkCutMask" maskUnits="userSpaceOnUse" x={-260} y={-160} width={520} height={200}>
          <rect x={-260} y={-101} width={520} height={140} fill="#fff" />
          {WHEELS3.map((w, i) => <circle key={i} cx={w.x} cy={w.y} r={w.r + 3} fill="#000" />)}
        </mask>
      </defs>
      {/* plumes first: they leave from under the body */}
      <Plume t={t} k={k('front')} x={NOZ.front.x} y={NOZ.front.y} len={len} seed={11} />
      <Plume t={t} k={k('rear')} x={NOZ.rear.x} y={NOZ.rear.y} len={len} seed={53} />
      <Plume t={t} k={k('nose')} x={NOZ.nose.x} y={NOZ.nose.y} len={len * 0.42} small seed={97} />
      <Plume t={t} k={k('tail')} x={NOZ.tail.x} y={NOZ.tail.y} len={len * 0.42} small seed={131} />
      <Car3 x={0} y={0} id="rk" refl={-60 + 30 * Math.sin(t * 0.7)} />
      {/* the cutaway: the lower side panel lifts off and fades, showing the inside */}
      {cut > 0.001 && (
        <g mask="url(#rkCutMask)">
          <g clipPath="url(#rkBody)">
            <rect x={-240} y={-105} width={480} height={120} fill="url(#rkInside)" opacity={Math.min(1, cut * 1.4)} />
            <rect x={-240} y={-105} width={480} height={8} fill="#2A343C" opacity={Math.min(1, cut * 1.4)} />
            {/* hardware */}
            <g opacity={Math.min(1, Math.max(0, (cut - 0.25) / 0.6))}>
              {/* manifold and drops (lift lines thick, pitch lines thin) */}
              <path d={`M ${VALVE.x} ${tank.y1} L ${VALVE.x} ${MANIFOLD_Y}`} stroke="#9AA6AD" strokeWidth={6} />
              <path d={`M ${NOZ.rear.x} ${MANIFOLD_Y} L ${NOZ.front.x} ${MANIFOLD_Y} M ${NOZ.front.x} ${MANIFOLD_Y} L ${NOZ.front.x} ${NOZ.front.y - 8} M ${NOZ.rear.x} ${MANIFOLD_Y} L ${NOZ.rear.x} ${NOZ.rear.y - 8}`} stroke="#9AA6AD" strokeWidth={6} fill="none" strokeLinejoin="round" />
              <path d={`M ${VALVE.x} ${MANIFOLD_Y - 6} L ${NOZ.nose.x} ${MANIFOLD_Y - 6} L ${NOZ.nose.x} ${NOZ.nose.y - 6} M ${VALVE.x} ${MANIFOLD_Y - 6} L ${NOZ.tail.x} ${MANIFOLD_Y - 6} L ${NOZ.tail.x} ${NOZ.tail.y - 6}`} stroke="#8995A0" strokeWidth={3} fill="none" strokeLinejoin="round" />
              {/* gas ribbons to the nozzles that are firing */}
              {(['front', 'rear', 'nose', 'tail'] as NozKey[]).map((key) => {
                const f = Math.min(1, noz[key]);
                if (f < 0.04) return null;
                const pts = pathTo(key, tank);
                const d = 'M ' + pts.map((p) => p.join(' ')).join(' L ');
                const small = key === 'nose' || key === 'tail';
                return (
                  <g key={key} opacity={f * (0.75 + 0.25 * (s.flowGlow ?? 0))}>
                    <path d={d} stroke={FLOW_LIGHT} strokeWidth={small ? 6 : 9} fill="none" strokeLinejoin="round" opacity={0.75} />
                    <path d={d} stroke={FLOW} strokeWidth={small ? 2.6 : 3.6} fill="none" strokeLinejoin="round" strokeDasharray="10 14" strokeDashoffset={-t * 90} />
                  </g>
                );
              })}
              {/* tank: shell, rim, mounts */}
              {shell > 0 && [0.22, 0.78].map((f) => {
                const mx = tank.x0 + tw * f;
                return (
                  <g key={f} opacity={shell}>
                    <path d={`M ${mx - 9} ${tank.y1 + 1} L ${mx - 5} ${tank.y1 + 12 * shell} L ${mx + 5} ${tank.y1 + 12 * shell} L ${mx + 9} ${tank.y1 + 1}`} fill="#6B7780" stroke={INK} strokeWidth={2} />
                    <path d={`M ${mx - 9} ${tank.y0 - 1} L ${mx - 5} ${tank.y0 - 7 * shell} L ${mx + 5} ${tank.y0 - 7 * shell} L ${mx + 9} ${tank.y0 - 1}`} fill="#6B7780" stroke={INK} strokeWidth={2} />
                  </g>
                );
              })}
              <rect x={tank.x0} y={tank.y0} width={tw} height={th} rx={th / 2} fill="url(#rkTank)" stroke={INK} strokeWidth={2.4 + 3.6 * shell} />
              <rect x={tank.x0 + 4 + 2 * shell} y={tank.y0 + 3 + 2 * shell} width={tw - 8 - 4 * shell} height={th - 6 - 4 * shell} rx={(th - 6) / 2} fill="#20303E" />
              {!s.hideDots && DOTS.map((d, i) => {
                if (d.born > t) return null;
                const bornO = Math.min(1, (t - d.born) / 0.25);
                const inner = {x0: tank.x0 + 9, x1: tank.x1 - 9, y0: tank.y0 + 6, y1: tank.y1 - 6};
                const jig = Math.sin(t * 7 + i * 1.7) * 1.2;
                const hx = inner.x0 + (inner.x1 - inner.x0) * d.u + jig, hy = inner.y0 + (inner.y1 - inner.y0) * d.v + Math.cos(t * 6 + i) * 1.0;
                if (t < d.leave) return <circle key={i} cx={hx} cy={hy} r={2.6} fill="#9CC2F2" opacity={bornO} />;
                const a = (t - d.leave) / DOT_TRAVEL;
                if (a > 1.4) return null;
                const pts: [number, number][] = [[hx, hy], ...pathTo(d.to, tank)];
                const [px, py] = a <= 1 ? ptOn(pts, a) : [NOZ[d.to].x, NOZ[d.to].y + (a - 1) * 120];
                return <circle key={i} cx={px} cy={py} r={3} fill="#CFE2FA" stroke={FLOW} strokeWidth={1.4} opacity={a > 1 ? 1 - (a - 1) / 0.4 : 1} />;
              })}
              {(s.tankGlow ?? 0) > 0 && <rect x={tank.x0 - 5} y={tank.y0 - 5} width={tw + 10} height={th + 10} rx={th / 2 + 5} fill="none" stroke={C.saffron} strokeWidth={4} opacity={s.tankGlow} />}
              {/* protective frame: two halves close around the tank */}
              {cage > 0.001 && (
                <g>
                  {[-1, 1].map((side) => {
                    const off = (1 - cage) * 34 * side;
                    const ya = side < 0 ? tank.y0 - 8 : tank.y1 + 8;
                    return (
                      <g key={side} transform={`translate(0 ${off})`} opacity={Math.min(1, cage * 2)}>
                        <path d={`M ${tank.x0 - 6} ${(tank.y0 + tank.y1) / 2} L ${tank.x0 - 6} ${ya} L ${tank.x1 + 6} ${ya} L ${tank.x1 + 6} ${(tank.y0 + tank.y1) / 2}`} fill="none" stroke="#D9A441" strokeWidth={4.5} strokeLinejoin="round" />
                        {Array.from({length: 5}, (_, j) => {
                          const x = tank.x0 + 8 + (j * (tw - 16)) / 4;
                          return <line key={j} x1={x} y1={ya} x2={x + 16} y2={(tank.y0 + tank.y1) / 2 + side * 2} stroke="#D9A441" strokeWidth={3} opacity={0.85} />;
                        })}
                      </g>
                    );
                  })}
                </g>
              )}
              {/* valve: body and lever (along the pipe when gas flows) */}
              <rect x={VALVE.x - 9} y={VALVE.y - 9} width={18} height={18} rx={4} fill={C.blue} stroke={INK} strokeWidth={2.2} />
              <g transform={`translate(${VALVE.x} ${VALVE.y}) rotate(${90 - 90 * Math.min(1, noz.front + noz.rear + noz.nose + noz.tail)})`}>
                <rect x={-13} y={-2.4} width={26} height={4.8} rx={2.4} fill={C.coral} stroke={INK} strokeWidth={1.4} />
                <circle r={3} fill={INK} />
              </g>
            </g>
            {/* cut edge: the panel's thickness */}
            <path d={OUTLINE_D} fill="none" stroke="#F4F7F8" strokeWidth={7} opacity={cut} />
          </g>
          {/* the panel itself, lifting away */}
          <g clipPath="url(#rkBody)" opacity={Math.max(0, 1 - cut * 1.6)} transform={`translate(0 ${-34 * cut})`}>
            <rect x={-240} y={-101} width={480} height={120} fill="#EEF2F4" />
          </g>
        </g>
      )}
      {/* nozzles under the body */}
      <Nozzle x={NOZ.front.x} y={NOZ.front.y} />
      <Nozzle x={NOZ.rear.x} y={NOZ.rear.y} />
      <Nozzle x={NOZ.nose.x} y={NOZ.nose.y} small />
      <Nozzle x={NOZ.tail.x} y={NOZ.tail.y} small />
      {/* body-fixed annotations */}
      {(s.cgMark ?? 0) > 0 && (
        <g transform={`translate(${CG.x} ${CG.y}) scale(${0.6 + 0.4 * (s.cgMark ?? 0)})`} opacity={s.cgMark}>
          <circle r={14} fill="#fff" stroke={INK} strokeWidth={3} />
          <path d="M 0 -14 A 14 14 0 0 1 14 0 L 0 0 Z M 0 14 A 14 14 0 0 1 -14 0 L 0 0 Z" fill={INK} />
        </g>
      )}
      {s.offset && s.offset.o > 0 && (() => {
        // the resultant lift thrust, drawn along its line of action behind the centre of mass: the lever arm
        const lx = CG.x - s.offset.d, top = roofAt3(lx) - 4;
        return (
          <g opacity={s.offset.o}>
            <line x1={lx} y1={top} x2={lx} y2={CG.y} stroke={INK} strokeWidth={2.5} strokeDasharray="6 6" />
            <line x1={CG.x} y1={CG.y} x2={lx} y2={CG.y} stroke={C.coralDeep} strokeWidth={4} />
            <line x1={lx} y1={CG.y - 10} x2={lx} y2={CG.y + 10} stroke={C.coralDeep} strokeWidth={4} />
            <Arrow x1={lx} y1={top} x2={lx} y2={top - 150} color={FORCE} w={14} />
          </g>
        );
      })()}
      {s.pulseArrows && (['nose', 'tail'] as NozKey[]).map((key) => {
        const f = Math.min(1, noz[key] * 1.6);
        if (f < 0.05) return null;
        const top = roofAt3(NOZ[key].x) - 4;
        return <Arrow key={key} x1={NOZ[key].x} y1={top} x2={NOZ[key].x} y2={top - 95} color={FORCE} w={10} opacity={f} />;
      })}
    </g>
  );
};
