// V3 lab apparatus (from V2's) in the Death Clock art system: one ink contour per object, gradients from the fixed
// upper-left key light, restrained highlights. All drawn in lab world coordinates (20 px = 1 cm). `k` scales contour widths so a
// close-up keeps a cartoon line rather than a heavy one (k ~ 1/sqrt(zoom)).
import React from 'react';
import {lit, mix, shade} from './dc/color';
import {Deco, INK, Inked, InkLine, InkPath} from './dc/ink';
import {add, fmt, mul, norm, P as Pt, perp, sub, V} from './dc/math';
import {Capsule, Glow, Lin, SoftShadow} from './dc/shade';
import {BEAKER, BENCH_Y, COCOON_DISH, NOZ, PUMP, SAND, SYR_ACE, SYR_SILK, TRAY} from './labWorld4';

export const SILK = '#F2CE6A';
export const SILK_PALE = '#F7E7B4';
export const ACETONE = '#5CC8C0';
export const STEEL = '#B9C7D2';
export const GLASS = '#DCEFF6';

const rr = (x0: number, y0: number, x1: number, y1: number, r: number) =>
  `M${fmt(x0 + r)},${fmt(y0)} H${fmt(x1 - r)} Q${fmt(x1)},${fmt(y0)} ${fmt(x1)},${fmt(y0 + r)} V${fmt(y1 - r)} Q${fmt(x1)},${fmt(y1)} ${fmt(x1 - r)},${fmt(y1)} H${fmt(x0 + r)} Q${fmt(x0)},${fmt(y1)} ${fmt(x0)},${fmt(y1 - r)} V${fmt(y0 + r)} Q${fmt(x0)},${fmt(y0)} ${fmt(x0 + r)},${fmt(y0)} Z`;

/** glass: a translucent gradient with an ink outline (no filled ink silhouette under it, which would show through) */
const Glass: React.FC<{id: string; d: string; from: V; to: V; stops: [number, string, number?][]; k: number}> = ({id, d, from, to, stops, k}) => (
  <g>
    <Lin id={id} d={d} from={from} to={to} stops={stops} />
    <path d={d} fill="none" stroke={INK} strokeWidth={fmt(2.2 * k)} strokeLinejoin="round" />
  </g>
);

// ------------------------------------------------------------------ room
export const LabWall: React.FC<{id: string}> = ({id}) => (
  <g>
    <Lin id={`${id}-w`} d="M-2500,-1500 H3500 V3200 H-2500 Z" from={{x: 0, y: -400}} to={{x: 0, y: 1400}} stops={[[0, '#C9DCE6'], [1, '#E3EDF1']]} />
    <path d="M-2500,960 H3500 V1010 H-2500 Z" fill="#2FA7A0" opacity={0.75} />
    {[-1800, -600, 600, 1800].map((x, i) => (
      <g key={i}>
        <path d={`M${x - 360},${420} H${x + 360} V${436} H${x - 360} Z`} fill="#9AAAB3" />
        <path d={`M${x - 360},${700} H${x + 360} V${716} H${x - 360} Z`} fill="#9AAAB3" />
        {[0, 1, 2, 3, 4, 5].map((k) => {
          const bx = x - 300 + k * 110;
          const h = 90 + ((k * 37 + i * 13) % 50);
          const c = ['#7FC9C2', '#F2C46A', '#E98F7A', '#BFD8E6', '#9ED0B0', '#F0E2C0'][(k + i) % 6];
          return (
            <g key={k}>
              <path d={rr(bx, 420 - h, bx + 56, 420, 12)} fill={c} opacity={0.85} />
              <path d={rr(bx + 4, 700 - h * 0.8, bx + 52, 700, 10)} fill={['#BFD8E6', '#F2C46A', '#7FC9C2'][(k + i * 2) % 3]} opacity={0.75} />
            </g>
          );
        })}
      </g>
    ))}
    <path d="M1250,120 H1700 V860 H1250 Z" fill="#EAF6FB" stroke="#9AAAB3" strokeWidth={16} />
    <path d="M1475,120 V860 M1250,490 H1700" stroke="#9AAAB3" strokeWidth={10} />
  </g>
);

export const Bench: React.FC<{id: string; k: number}> = ({id, k}) => (
  <g>
    <Inked w={5 * k}>
      <Lin id={`${id}-top`} d={`M-2500,${BENCH_Y - 14} H3500 V${BENCH_Y + 18} H-2500 Z`} from={{x: 0, y: BENCH_Y - 14}} to={{x: 0, y: BENCH_Y + 18}} stops={[[0, '#5E6B74'], [1, '#46535C']]} />
      <Lin id={`${id}-fr`} d={`M-2500,${BENCH_Y + 18} H3500 V${BENCH_Y + 1400} H-2500 Z`} from={{x: 0, y: BENCH_Y + 18}} to={{x: 0, y: BENCH_Y + 700}} stops={[[0, '#3A6E7A'], [1, '#2C5560']]} />
    </Inked>
    <Deco>
      <path d={`M-2500,${BENCH_Y - 13} H3500`} stroke="#FFFFFF" strokeWidth={2 * k} opacity={0.25} />
      {[-1700, -900, -100, 700, 1500, 2300].map((x) => (
        <g key={x}>
          <path d={rr(x - 360, BENCH_Y + 60, x + 360, BENCH_Y + 560, 18)} fill="none" stroke="#244852" strokeWidth={6 * k} />
          <path d={`M${x - 80},${BENCH_Y + 100} H${x + 80}`} stroke="#C9D6DC" strokeWidth={10 * k} strokeLinecap="round" />
        </g>
      ))}
    </Deco>
  </g>
);

// ------------------------------------------------------------------ cocoons, dish, beaker
/** a moth cocoon: an elongated, slightly waisted oval wrapped in fine silk (a few loose loops of the outer floss) */
export const COCOON_LEN = 40;
export const Cocoon: React.FC<{id: string; c: V; ang: number; k: number; len?: number; loosen?: number; floss?: number}> = ({id, c, ang, k, len = COCOON_LEN, loosen = 0, floss = 0.5}) => {
  const a = len / 2;
  const b = len * 0.31;
  const d = `M${-a},0 C${-a},${-b * 1.1} ${-a * 0.2},${-b * 1.05} 0,${-b * 0.86} C${a * 0.2},${-b * 1.05} ${a},${-b * 1.1} ${a},0 C${a},${b * 1.1} ${a * 0.2},${b * 1.05} 0,${b * 0.86} C${-a * 0.2},${b * 1.05} ${-a},${b * 1.1} ${-a},0 Z`;
  const fw = Math.max(0.35, 0.55 * k);
  return (
    <g transform={`translate(${fmt(c.x)} ${fmt(c.y)}) rotate(${fmt(ang)})`}>
      <Inked w={2.2 * k}>
        <Lin id={`${id}-c`} d={d} from={{x: -a * 0.4, y: -b}} to={{x: a * 0.4, y: b}} stops={[[0, '#FFFBEF'], [0.6, '#F1E6CA'], [1, '#DDCDA6']]} />
      </Inked>
      <Deco>
        {/* the wound thread: fine crossing arcs over the surface */}
        {[-0.7, -0.45, -0.2, 0.05, 0.3, 0.55, 0.78].map((t, i) => (
          <path key={i} d={`M${fmt(a * t - 3)},${fmt(-b * 0.9)} Q${fmt(a * t + (i % 2 ? 5 : -2))},0 ${fmt(a * t + 3)},${fmt(b * 0.9)}`} fill="none" stroke="#C7B48A" strokeWidth={fmt(fw)} opacity={0.75} />
        ))}
        {[-0.5, 0.0, 0.45].map((t, i) => (
          <path key={`x${i}`} d={`M${fmt(a * t - 8)},${fmt(-b * 0.55)} Q${fmt(a * t)},${fmt(b * 0.2)} ${fmt(a * t + 9)},${fmt(-b * 0.1)}`} fill="none" stroke="#CDBB92" strokeWidth={fmt(fw)} opacity={0.6} />
        ))}
        {/* loose floss loops standing off the surface */}
        {floss > 0 &&
          [0, 1, 2, 3].map((i) => {
            const x = -a * 0.7 + i * a * 0.45;
            const s = i % 2 ? 1 : -1;
            return <path key={`f${i}`} d={`M${fmt(x)},${fmt(s * b * 0.92)} q${fmt(5 + i)},${fmt(s * (5 + 3 * floss))} ${fmt(11 + i)},${fmt(s * 0.5)}`} fill="none" stroke="#FFF6DD" strokeWidth={fmt(fw * 1.2)} opacity={floss} />;
          })}
        {loosen > 0 &&
          [0, 1, 2, 3, 4].map((i) => (
            <path key={`l${i}`} d={`M${fmt(-a * 0.6 + i * a * 0.3)},${fmt(-b * 0.9)} q${fmt(6 + i * 2)},${fmt(-10 * loosen - i * 3)} ${fmt(14 + i * 4)},${fmt(-6 * loosen)}`} fill="none" stroke="#FFF8E2" strokeWidth={fmt(fw * 1.4)} opacity={loosen} />
          ))}
        <ellipse cx={fmt(-a * 0.35)} cy={fmt(-b * 0.45)} rx={fmt(a * 0.28)} ry={fmt(b * 0.16)} fill="#FFFFFF" opacity={0.35} />
      </Deco>
    </g>
  );
};

/** fine silk fibres drawn out of a cocoon (from points on its surface to where they are pulled), slightly slack */
export const PulledFibres: React.FC<{from: V[]; to: V[]; sag: number; k: number; op?: number}> = ({from, to, sag, k, op = 1}) => (
  <g opacity={op}>
    {from.map((a, i) => {
      const b = to[i];
      const m = add(lerp2(a, b, 0.5), {x: 0, y: sag * (0.6 + 0.2 * i)});
      const d = `M${Pt(a)} Q${Pt(m)} ${Pt(b)}`;
      return (
        <g key={i}>
          <path d={d} fill="none" stroke="#8C7A55" strokeWidth={fmt(Math.max(0.6, 1.3 * k))} opacity={0.5} />
          <path d={d} fill="none" stroke="#FFF8E6" strokeWidth={fmt(Math.max(0.35, 0.7 * k))} />
        </g>
      );
    })}
  </g>
);
const lerp2 = (a: V, b: V, t: number): V => ({x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t});

/** the glass stirring rod from its foot to its top */
export const Rod: React.FC<{id: string; foot: V; top: V; r: number; k: number; op?: number}> = ({id, foot, top, r, k, op = 1}) => (
  <g opacity={op}>
    <Capsule id={`${id}-r`} a={foot} b={top} ra={r} rb={r} color="#E4F2F7" spec={0.4} k={0.9} />
    <path d={`M${Pt(add(foot, mul(perp(norm(sub(top, foot))), r * 0.9)))} L${Pt(add(top, mul(perp(norm(sub(top, foot))), r * 0.9)))}`} stroke={INK} strokeWidth={fmt(1.3 * k)} />
    <path d={`M${Pt(add(foot, mul(perp(norm(sub(top, foot))), -r * 0.9)))} L${Pt(add(top, mul(perp(norm(sub(top, foot))), -r * 0.9)))}`} stroke={INK} strokeWidth={fmt(1.3 * k)} />
    <circle cx={fmt(top.x)} cy={fmt(top.y)} r={fmt(r)} fill="#E4F2F7" stroke={INK} strokeWidth={fmt(1.3 * k)} />
  </g>
);

export const CocoonDish: React.FC<{id: string; k: number}> = ({id, k}) => {
  const {x, w, h} = COCOON_DISH;
  return (
    <g>
      <SoftShadow id={`${id}-s`} c={{x, y: BENCH_Y}} rx={w * 0.6} ry={5} alpha={0.3} />
      <Glass id={`${id}-d`} d={rr(x - w / 2, BENCH_Y - h, x + w / 2, BENCH_Y, 4)} from={{x: 0, y: BENCH_Y - h}} to={{x: 0, y: BENCH_Y}} stops={[[0, '#EEF7FB', 0.9], [1, '#BFD5DF', 0.9]]} k={k} />
      <Deco>
        <path d={`M${x - w / 2 + 4},${BENCH_Y - h + 4} H${x + w / 2 - 4}`} stroke="#FFFFFF" strokeWidth={2 * k} opacity={0.8} />
      </Deco>
    </g>
  );
};

/** beaker interior (liquid region) for clipping and for the field that lives in it */
export const beakerInner = () => {
  const {x, w, h} = BEAKER;
  return {x0: x - w / 2 + 4, x1: x + w / 2 - 4, y0: BENCH_Y - h + 6, y1: BENCH_Y - 4};
};
export const beakerLevelY = (level: number) => {
  const b = beakerInner();
  return b.y1 - (b.y1 - b.y0) * level;
};

/** the beaker: glass with graduations; `liquid` colours the solution (pale to gold), `inside` is drawn in the liquid */
export const Beaker: React.FC<{id: string; k: number; level: number; liquid: string; inside?: React.ReactNode; front?: React.ReactNode}> = ({id, k, level, liquid, inside, front}) => {
  const {x, w, h} = BEAKER;
  const b = beakerInner();
  const ly = beakerLevelY(level);
  const outer = `M${x - w / 2},${BENCH_Y - h} L${x - w / 2 - 4},${BENCH_Y - h - 6} L${x - w / 2 + 6},${BENCH_Y - h} L${x - w / 2},${BENCH_Y - h + 4} V${BENCH_Y - 6} Q${x - w / 2},${BENCH_Y} ${x - w / 2 + 6},${BENCH_Y} H${x + w / 2 - 6} Q${x + w / 2},${BENCH_Y} ${x + w / 2},${BENCH_Y - 6} V${BENCH_Y - h} Z`;
  const liq = `M${b.x0},${ly} H${b.x1} V${b.y1 - 4} Q${b.x1},${b.y1} ${b.x1 - 4},${b.y1} H${b.x0 + 4} Q${b.x0},${b.y1} ${b.x0},${b.y1 - 4} Z`;
  return (
    <g>
      <SoftShadow id={`${id}-s`} c={{x, y: BENCH_Y}} rx={w * 0.62} ry={6} alpha={0.3} />
      <Glass id={`${id}-g`} d={outer} from={{x: x - w / 2, y: 0}} to={{x: x + w / 2, y: 0}} stops={[[0, '#F4FBFE', 0.55], [0.5, '#DCEFF6', 0.3], [1, '#B8D3DF', 0.6]]} k={k} />
      <defs>
        <clipPath id={`${id}-lc`}>
          <path d={liq} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${id}-lc)`}>
        <Lin id={`${id}-l`} d={liq} from={{x: 0, y: ly}} to={{x: 0, y: b.y1}} stops={[[0, lit(liquid, 0.25)], [1, shade(liquid, 0.12)]]} />
        {inside}
      </g>
      <Deco>
        <path d={`M${b.x0},${ly} H${b.x1}`} stroke={lit(liquid, 0.5)} strokeWidth={2 * k} />
        {[0.25, 0.5, 0.75].map((t) => (
          <path key={t} d={`M${x + w / 2 - 4},${fmt(BENCH_Y - h * t)} h${-10}`} stroke="#7D97A4" strokeWidth={1.2 * k} />
        ))}
        <path d={`M${x - w / 2 + 7},${BENCH_Y - h + 12} V${BENCH_Y - 14}`} stroke="#FFFFFF" strokeWidth={4 * k} strokeLinecap="round" opacity={0.6} />
      </Deco>
      {front}
    </g>
  );
};

// ------------------------------------------------------------------ pump and syringes
/** the silk syringe's liquid region (for the material match and its clip) */
export const syringeLiquid = (s: {x0: number; x1: number; y: number; r: number}, fill: number, plunger: number) => {
  const px = s.x0 + 6 + (s.x1 - s.x0 - 10) * (1 - plunger);
  const fx = s.x0 + 4;
  const fEnd = fx + (px - fx) * fill;
  return {x0: fx, x1: Math.max(fx + 2, fEnd), y0: s.y - s.r + 2.5, y1: s.y + s.r - 2.5};
};
const Syringe: React.FC<{id: string; s: {x0: number; x1: number; y: number; r: number}; k: number; fill: number; color: string; plunger: number; far?: boolean; inside?: React.ReactNode}> = ({id, s, k, fill, color, plunger, far, inside}) => {
  const {x0, x1, y, r} = s;
  const len = x1 - x0;
  const px = x0 + 6 + (len - 10) * (1 - plunger);
  const fx = x0 + 4;
  const fEnd = x0 + 4 + (px - fx) * fill;
  const glassC = far ? shade(GLASS, 0.1) : GLASS;
  return (
    <g>
      <Inked w={2.4 * k}>
        {/* plunger rod and thumb disc */}
        <path d={rr(px, y - r * 0.28, x1 + 34, y + r * 0.28, 2)} fill={far ? '#D2D9DE' : '#E8EDF0'} />
        <path d={rr(x1 + 30, y - r * 1.15, x1 + 38, y + r * 1.15, 3)} fill={far ? '#C3CCD2' : '#DCE3E8'} />
        {/* barrel, flange, luer tip */}
        <path d={rr(x1, y - r * 1.5, x1 + 5, y + r * 1.5, 2)} fill="#E8EDF0" />
        <path d={`M${x0},${y - r * 0.45} L${x0 - 10},${y - r * 0.28} V${y + r * 0.28} L${x0},${y + r * 0.45} Z`} fill="#E8EDF0" />
      </Inked>
      <Glass id={`${id}-b`} d={rr(x0, y - r, x1, y + r, 4)} from={{x: 0, y: y - r}} to={{x: 0, y: y + r}} stops={[[0, '#FFFFFF', 0.9], [0.5, glassC, 0.75], [1, '#A9C3CF', 0.9]]} k={k} />
      <Deco>
        {fill > 0.01 && <path d={rr(fx, y - r + 2.5, Math.max(fx + 2, fEnd), y + r - 2.5, 3)} fill={color} opacity={0.92} />}
        {inside && (
          <>
            <defs>
              <clipPath id={`${id}-in`}>
                <path d={rr(fx, y - r + 2.5, Math.max(fx + 2, fEnd), y + r - 2.5, 3)} />
              </clipPath>
            </defs>
            <g clipPath={`url(#${id}-in)`}>{inside}</g>
          </>
        )}
        <path d={rr(px - 4, y - r + 1.5, px + 2, y + r - 1.5, 2)} fill="#3B4A55" />
        {[0.2, 0.4, 0.6, 0.8].map((t) => (
          <path key={t} d={`M${fmt(x0 + len * t)},${y - r} v${fmt(r * 0.5)}`} stroke="#5E7684" strokeWidth={1 * k} />
        ))}
        <path d={`M${x0 + 4},${y - r + 2} H${x1 - 4}`} stroke="#FFFFFF" strokeWidth={1.6 * k} opacity={0.75} />
      </Deco>
    </g>
  );
};

/** the pump's start button (centre, radius) */
export const PUMP_BTN = {x: PUMP.x1 - 24, y: PUMP.top + 34, r: 9};
export const Pump: React.FC<{id: string; k: number; silkFill: number; silkPlunger: number; aceFill: number; acePlunger: number; run: number; press?: number; silkInside?: React.ReactNode}> = ({id, k, silkFill, silkPlunger, aceFill, acePlunger, run, press = 0, silkInside}) => {
  const {x0, x1, top} = PUMP;
  return (
    <g>
      <SoftShadow id={`${id}-s`} c={{x: (x0 + x1) / 2, y: BENCH_Y}} rx={(x1 - x0) * 0.6} ry={7} alpha={0.32} />
      <Syringe id={`${id}-a`} s={SYR_ACE} k={k} fill={aceFill} color={ACETONE} plunger={acePlunger} far />
      <Inked w={3 * k}>
        <Lin id={`${id}-body`} d={rr(x0, top, x1, BENCH_Y, 8)} from={{x: x0, y: top}} to={{x: x1, y: BENCH_Y}} stops={[[0, '#F1F4F6'], [0.6, '#D9E0E5'], [1, '#B4C0C8']]} />
      </Inked>
      <Deco>
        <path d={rr(x0 + 12, top + 18, x0 + 70, top + 50, 5)} fill="#1F3440" />
        <path d={rr(x0 + 16, top + 22, x0 + 66, top + 46, 3)} fill={run > 0.01 ? '#7EE3C8' : '#3E6B66'} opacity={0.9} />
        <circle cx={x1 - 24} cy={top + 34} r={11} fill="#B4C0C8" stroke={INK} strokeWidth={1.2 * k} />
        <circle cx={x1 - 24} cy={top + 34 + 1.5 * press} r={9 - 1.2 * press} fill={run > 0.01 || press > 0.5 ? '#2FA7A0' : '#8A9AA4'} stroke={INK} strokeWidth={1.6 * k} />
        <path d={`M${x0 + 8},${top + 6} H${x1 - 8}`} stroke="#FFFFFF" strokeWidth={2 * k} opacity={0.7} />
      </Deco>
      <Syringe id={`${id}-s1`} s={SYR_SILK} k={k} fill={silkFill} color={SILK} plunger={silkPlunger} inside={silkInside} />
      {/* the pusher block that drives both plungers */}
      <Inked w={2.6 * k}>
        <path d={rr(SYR_SILK.x1 + 40 - (SYR_SILK.x1 - SYR_SILK.x0 - 10) * silkPlunger, SYR_ACE.y - 16, SYR_SILK.x1 + 56 - (SYR_SILK.x1 - SYR_SILK.x0 - 10) * silkPlunger, top + 4, 4)} fill="#8FA2AE" />
      </Inked>
    </g>
  );
};

// ------------------------------------------------------------------ tubes
/** a flexible tube along points (Catmull-Rom), with an optional liquid front advancing from its start (0..1) */
export const Tube: React.FC<{id: string; pts: V[]; r: number; k: number; liquid?: string; front?: number; far?: boolean}> = ({id, pts, r, k, liquid, front = 0, far}) => {
  const path = (ps: V[]) => {
    let d = `M${Pt(ps[0])}`;
    for (let i = 0; i < ps.length - 1; i++) {
      const p0 = ps[Math.max(0, i - 1)];
      const p1 = ps[i];
      const p2 = ps[i + 1];
      const p3 = ps[Math.min(ps.length - 1, i + 2)];
      d += ` C${Pt(add(p1, mul(sub(p2, p0), 1 / 6)))} ${Pt(add(p2, mul(sub(p1, p3), 1 / 6)))} ${Pt(p2)}`;
    }
    return d;
  };
  const d = path(pts);
  return (
    <g>
      <path d={d} fill="none" stroke={INK} strokeWidth={fmt(r * 2 + 3.2 * k)} strokeLinecap="round" />
      <path d={d} fill="none" stroke={far ? '#CFDCE3' : '#E6EFF3'} strokeWidth={fmt(r * 2)} strokeLinecap="round" />
      {liquid && front > 0.001 && <path d={d} fill="none" stroke={liquid} strokeWidth={fmt(r * 1.1)} strokeLinecap="round" pathLength={1000} strokeDasharray={`${fmt(front * 1000)} 2000`} />}
      <path d={d} fill="none" stroke="#FFFFFF" strokeWidth={fmt(r * 0.45)} strokeLinecap="round" opacity={0.6} transform={`translate(${fmt(-r * 0.3)} ${fmt(-r * 0.35)})`} />
    </g>
  );
};

// ------------------------------------------------------------------ nozzle
/** nozzle frame: x along the axis from the tip (0) to the rear (len), y across (the side toward +n) */
export const nozFrame = (rear: V = NOZ.rear, tip: V = NOZ.tip) => {
  const ax = norm(sub(rear, tip));
  const n = perp(ax);
  const len = Math.hypot(rear.x - tip.x, rear.y - tip.y);
  const at = (x: number, y: number): V => add(tip, add(mul(ax, x), mul(n, y)));
  const ang = (Math.atan2(ax.y, ax.x) * 180) / Math.PI;
  return {ax, n, len, at, ang, tip, rear};
};
/** coaxial nozzle geometry in the nozzle frame (world px): outer needle, inner needle, body */
export const NZ = {outerR: 4.6, outerIn: 3.6, innerR: 1.9, innerIn: 1.1, needleLen: 30, coneLen: 42, bodyR: 12, innerRecess: 1.4, portX: 178};

export const Nozzle: React.FC<{id: string; k: number; rear: V; tip: V; cut: number; silk: number; ace: number; core: number; flow?: number}> = ({id, k, rear, tip, cut, silk, ace, core, flow = 1}) => {
  const F = nozFrame(rear, tip);
  const {len} = F;
  const P = (x: number, y: number) => Pt(F.at(x, y));
  const R = NZ.bodyR;
  // outer silhouette: needle (x 0..needleLen), cone, body
  const x1 = NZ.needleLen;
  const x2 = NZ.needleLen + NZ.coneLen;
  const outline = `M${P(0, -NZ.outerR)} L${P(x1, -NZ.outerR)} L${P(x2, -R)} L${P(len - 4, -R)} Q${P(len, -R)} ${P(len, -R + 4)} L${P(len, R - 4)} Q${P(len, R)} ${P(len - 4, R)} L${P(x2, R)} L${P(x1, NZ.outerR)} L${P(0, NZ.outerR)} Z`;
  const port = `M${P(NZ.portX - 6, R)} L${P(NZ.portX - 6, R + 9)} L${P(NZ.portX + 6, R + 9)} L${P(NZ.portX + 6, R)} Z`;
  // the cutaway: the near half of the wall removed over the front of the nozzle, sweeping rear to front
  const cx = len - (len + 2) * cut;
  return (
    <g>
      <Inked w={2.4 * k}>
        <path d={port} fill="#D6DEE3" />
      </Inked>
      <Inked w={2.6 * k}>
        <Lin id={`${id}-b`} d={outline} from={F.at(len / 2, -R)} to={F.at(len / 2, R)} stops={[[0, '#FFFFFF'], [0.45, '#E3E9ED'], [1, '#9FB0BB']]} />
      </Inked>
      <Deco>
        <path d={`M${P(x2 + 4, -R * 0.55)} L${P(len - 6, -R * 0.55)}`} stroke="#FFFFFF" strokeWidth={2 * k} strokeLinecap="round" opacity={0.8} />
        <path d={`M${P(x2 + 10, R * 0.2)} L${P(len - 10, R * 0.2)}`} stroke={ACETONE} strokeWidth={1.2 * k} opacity={0.5} />
      </Deco>
      {cut > 0.001 && <NozzleInterior F={F} cx={cx} silk={silk} ace={ace} core={core} k={k} flow={flow} />}
    </g>
  );
};

/** the revealed interior, drawn from x = cx (the cut edge) to the tip */
const NozzleInterior: React.FC<{F: ReturnType<typeof nozFrame>; cx: number; silk: number; ace: number; core: number; k: number; flow: number}> = ({F, cx, silk, ace, core, k, flow}) => {
  const {len} = F;
  const P = (x: number, y: number) => Pt(F.at(x, y));
  const xa = Math.max(0, cx);
  const x1 = NZ.needleLen;
  const x2 = NZ.needleLen + NZ.coneLen;
  const R = NZ.bodyR - 2;
  const inner = NZ.innerR;
  // outer channel (acetone): from the side port along the body, through the cone into the annulus to the tip
  const aceFront = len - (len - 0) * ace; // acetone front position (x), advancing from the rear to the tip
  const silkFront = len - len * silk;
  const outerCh = `M${P(Math.max(xa, aceFront), -NZ.outerIn)} L${P(x1, -NZ.outerIn)} L${P(x2, -R)} L${P(len - 6, -R)} L${P(len - 6, R)} L${P(x2, R)} L${P(x1, NZ.outerIn)} L${P(Math.max(xa, aceFront), NZ.outerIn)} Z`;
  const innerNeedle = `M${P(NZ.innerRecess, -inner)} L${P(len - 6, -inner)} L${P(len - 6, inner)} L${P(NZ.innerRecess, inner)} Z`;
  const bore = (xs: number) => `M${P(Math.max(NZ.innerRecess, xs), -NZ.innerIn)} L${P(len - 6, -NZ.innerIn)} L${P(len - 6, NZ.innerIn)} L${P(Math.max(NZ.innerRecess, xs), NZ.innerIn)} Z`;
  const clipD = `M${P(xa, -NZ.bodyR - 1)} L${P(len - 5, -NZ.bodyR - 1)} L${P(len - 5, NZ.bodyR + 1)} L${P(xa, NZ.bodyR + 1)} Z`;
  const id = `ni${Math.round(cx * 10)}`;
  return (
    <g>
      <defs>
        <clipPath id={id}>
          <path d={clipD} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${id})`}>
        <path d={`M${P(xa, -NZ.outerIn)} L${P(x1, -NZ.outerIn)} L${P(x2, -R)} L${P(len - 6, -R)} L${P(len - 6, R)} L${P(x2, R)} L${P(x1, NZ.outerIn)} L${P(xa, NZ.outerIn)} Z`} fill="#E9F1F4" stroke={INK} strokeWidth={0.6 * k} />
        {ace > 0.001 && <path d={outerCh} fill={ACETONE} opacity={0.9} />}
        <path d={innerNeedle} fill={STEEL} stroke={INK} strokeWidth={0.5 * k} />
        <path d={bore(len)} fill="#FFFFFF" />
        {silk > 0.001 && <path d={bore(silkFront)} fill={SILK} />}
        {/* the flow, moving toward the tip: dashes along the core (silk) and along both sides of the outer channel
            (acetone), each starting where that liquid has reached */}
        {silk > 0.001 && (
          <path d={`M${P(len - 8, 0)} L${P(Math.max(silkFront, NZ.innerRecess), 0)}`} fill="none" stroke={shade(SILK, 0.38)} strokeWidth={fmt(0.75)} strokeLinecap="round" strokeDasharray="5 6" strokeDashoffset={fmt(core * 30 * flow)} />
        )}
        {ace > 0.001 &&
          [-1, 1].map((sd) => {
            const ym = (NZ.outerIn + inner) / 2;
            const yb = (R + inner) / 2 + 1;
            const xs = Math.min(len - 8, Math.max(aceFront, 0));
            const pts: [number, number][] = [[len - 8, yb], [x2, yb], [x1, ym], [0, ym]];
            const kept = pts.filter(([x]) => x <= xs + 0.01);
            const start: [number, number] = xs >= x2 ? [xs, yb] : xs >= x1 ? [xs, ym + ((xs - x1) / (x2 - x1)) * (yb - ym)] : [xs, ym];
            const d = `M${[start, ...kept.filter(([x]) => x < xs)].map(([x, y]) => P(x, sd * y)).join(' L')}`;
            return <path key={sd} d={d} fill="none" stroke={shade(ACETONE, 0.38)} strokeWidth={fmt(0.75)} strokeLinecap="round" strokeLinejoin="round" strokeDasharray="5 6" strokeDashoffset={fmt(core * 30 * flow + sd * 3)} />;
          })}
      </g>
      <path d={`M${P(xa, -NZ.bodyR)} L${P(xa, NZ.bodyR)}`} stroke={INK} strokeWidth={0.8 * k} />
    </g>
  );
};

// ------------------------------------------------------------------ sand dish, blade, tray
export const SandDish: React.FC<{id: string; k: number; back?: boolean}> = ({id, k, back}) => {
  const {x, w, wall, surf} = SAND;
  const x0 = x - w / 2;
  const x1 = x + w / 2;
  if (back)
    return (
      <g>
        <SoftShadow id={`${id}-s`} c={{x, y: BENCH_Y}} rx={w * 0.6} ry={6} alpha={0.3} />
        <path d={rr(x0, BENCH_Y - wall, x1, BENCH_Y, 5)} fill="#C9DCE4" opacity={0.6} />
      </g>
    );
  return (
    <g>
      <Inked w={2.6 * k}>
        <Lin id={`${id}-sd`} d={`M${x0 + 2},${surf} Q${x},${surf - 2} ${x1 - 2},${surf} V${BENCH_Y - 3} H${x0 + 2} Z`} from={{x: 0, y: surf}} to={{x: 0, y: BENCH_Y}} stops={[[0, '#E9CE95'], [1, '#C9A866']]} />
      </Inked>
      <Deco>
        {Array.from({length: 40}).map((_, i) => {
          const gx = x0 + 6 + ((i * 37) % (w - 12));
          const gy = surf + 4 + ((i * 13) % (BENCH_Y - surf - 8));
          return <circle key={i} cx={gx} cy={gy} r={0.9} fill={i % 3 ? '#B8955A' : '#F5E2B5'} />;
        })}
      </Deco>
      <Glass id={`${id}-gl`} d={rr(x0, BENCH_Y - wall, x1, BENCH_Y, 5)} from={{x: x0, y: 0}} to={{x: x1, y: 0}} stops={[[0, '#F4FBFE', 0.4], [0.5, '#DCEFF6', 0.12], [1, '#B8D3DF', 0.45]]} k={k} />
      <Deco>
        <path d={`M${x0 + 5},${BENCH_Y - wall + 5} V${BENCH_Y - 6}`} stroke="#FFFFFF" strokeWidth={2.4 * k} opacity={0.6} strokeLinecap="round" />
      </Deco>
    </g>
  );
};

/** scalpel blade (no-handle blade): local x from the cutting tip (0) to the tang end (len), y across */
export const bladeShape = (len: number) => {
  const h = len * 0.26;
  return `M0,0 C${len * 0.18},${-h * 0.95} ${len * 0.5},${-h} ${len * 0.62},${-h * 0.62} L${len},${-h * 0.42} L${len},${h * 0.3} L${len * 0.2},${h * 0.3} C${len * 0.08},${h * 0.25} ${len * 0.02},${h * 0.12} 0,0 Z`;
};
export const Blade: React.FC<{id: string; k: number; T: V; E: V; len: number; clipBelow?: number}> = ({id, k, T, E, len, clipBelow}) => {
  const ang = (Math.atan2(E.y - T.y, E.x - T.x) * 180) / Math.PI;
  const d = bladeShape(len);
  const body = (
    <g transform={`translate(${fmt(T.x)} ${fmt(T.y)}) rotate(${fmt(ang)})`}>
      <Inked w={2.2 * k}>
        <Lin id={`${id}-bl`} d={d} from={{x: 0, y: -len * 0.26}} to={{x: 0, y: len * 0.3}} stops={[[0, '#F4F8FA'], [0.45, '#C8D3DA'], [1, '#8D9EA8']]} />
      </Inked>
      <Deco>
        <path d={`M${len * 0.66},${-len * 0.06} H${len * 0.9}`} stroke="#5C6C76" strokeWidth={len * 0.07} strokeLinecap="round" />
        <path d={`M${len * 0.06},${-len * 0.05} Q${len * 0.3},${-len * 0.2} ${len * 0.58},${-len * 0.14}`} fill="none" stroke="#FFFFFF" strokeWidth={1.2 * k} opacity={0.85} />
      </Deco>
    </g>
  );
  if (clipBelow === undefined) return body;
  return (
    <g>
      <defs>
        <clipPath id={`${id}-cb`}>
          <path d={`M-4000,-4000 H4000 V${fmt(clipBelow)} H-4000 Z`} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${id}-cb)`}>{body}</g>
    </g>
  );
};

export const Tray: React.FC<{id: string; k: number}> = ({id, k}) => {
  const {x0, x1, h} = TRAY;
  return (
    <g>
      <SoftShadow id={`${id}-s`} c={{x: (x0 + x1) / 2, y: BENCH_Y}} rx={(x1 - x0) * 0.6} ry={6} alpha={0.32} />
      <Inked w={2.6 * k}>
        <Lin id={`${id}-t`} d={`M${x0},${BENCH_Y - h} L${x0 + 8},${BENCH_Y} H${x1 - 8} L${x1},${BENCH_Y - h} H${x1 - 5} L${x1 - 11},${BENCH_Y - 5} H${x0 + 11} L${x0 + 5},${BENCH_Y - h} Z`} from={{x: 0, y: BENCH_Y - h}} to={{x: 0, y: BENCH_Y}} stops={[[0, '#E6ECEF'], [1, '#A9B7C0']]} />
      </Inked>
    </g>
  );
};

export const FrontTray: React.FC<{id: string; k: number}> = ({id, k}) => {
  const {x0, x1, h} = TRAY;
  return (
    <Inked w={2.6 * k}>
      <Lin id={`${id}-tf`} d={`M${x0 + 2},${BENCH_Y - h * 0.55} L${x0 + 8},${BENCH_Y} H${x1 - 8} L${x1 - 2},${BENCH_Y - h * 0.55} Z`} from={{x: 0, y: BENCH_Y - h}} to={{x: 0, y: BENCH_Y}} stops={[[0, '#DDE5EA'], [1, '#9FAFB9']]} />
    </Inked>
  );
};

export {Glow, Capsule, mix};
