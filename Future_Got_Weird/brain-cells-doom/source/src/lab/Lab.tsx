// The lab artwork (Weird Crew finish: flat fills with one warm upper-left key light, cel-like gradients, navy ink of
// constant on-screen width). Drawn in lab centimetres; `iw` is the ink width in cm for the current zoom.
//   Wall      the back wall (a parallax layer): cabinets, shelves of glassware, an incubator, a window
//   LabBack   bench, monitor arm, both monitors (the control UI), the PC tower, the CL1's inside (media bottles,
//             pump, tubing, the headstage that holds the MEA)
//   LabFront  the CL1's clear lid and front glass, its white base with the touchscreen, the cables, screen glare
// The CL1's look follows published descriptions: a shoebox-sized white unit with a transparent enclosure showing its
// life support (pumps, media reservoirs, filtration, gas). No official drawing exists, so proportions are ours.
import React from 'react';
import {lit, mix, rgba, shade} from '../color';
import {recorded} from '../micro/culture';
import {CABLE_CL1_PC, CABLE_PC_CTRL, CHIP, CHIP_K, CL1, CTRL, GAME, PC, BENCH_BACK, BENCH_FRONT, Pt} from './geo';
import {ControlUI, MONO} from './Control';

export const INK = '#172B3A';
const poly = (p: Pt[]) => p.map((q) => `${q.x.toFixed(3)},${q.y.toFixed(3)}`).join(' ');
const curve = (p: Pt[]) => {
  let d = `M${p[0].x} ${p[0].y}`;
  for (let i = 1; i < p.length - 1; i++) d += ` Q${p[i].x} ${p[i].y} ${(p[i].x + p[i + 1].x) / 2} ${(p[i].y + p[i + 1].y) / 2}`;
  return d + ` L${p[p.length - 1].x} ${p[p.length - 1].y}`;
};
const Grad: React.FC<{id: string; c: string; k?: number; x1?: number; y1?: number; x2?: number; y2?: number}> = ({id, c, k = 1, x1 = 0, y1 = 0, x2 = 0.35, y2 = 1}) => (
  <linearGradient id={id} x1={x1} y1={y1} x2={x2} y2={y2}>
    <stop offset="0" stopColor={lit(c, 0.22 * k)} />
    <stop offset="0.55" stopColor={c} />
    <stop offset="1" stopColor={shade(c, 0.32 * k)} />
  </linearGradient>
);

// ------------------------------------------------------------------ the back wall (parallax layer, its own units)
export const Wall: React.FC<{iw: number; t: number}> = ({iw}) => {
  const bottle = (x: number, y: number, h: number, c: string, k: number) => (
    <g key={k}>
      <rect x={x} y={y - h} width={h * 0.42} height={h} rx={h * 0.08} fill={rgba(c, 0.55)} stroke={INK} strokeWidth={iw} />
      <rect x={x + h * 0.12} y={y - h - h * 0.18} width={h * 0.18} height={h * 0.2} fill={shade(c, 0.4)} stroke={INK} strokeWidth={iw} />
      <rect x={x + h * 0.06} y={y - h * 0.55} width={h * 0.08} height={h * 0.4} fill="#FFFFFF" opacity={0.35} />
    </g>
  );
  return (
    <g>
      <defs>
        <linearGradient id="wallG" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#14222F" />
          <stop offset="0.6" stopColor="#21384A" />
          <stop offset="1" stopColor="#2A465A" />
        </linearGradient>
        <radialGradient id="glowG" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#5FB4D9" stopOpacity="0.32" />
          <stop offset="1" stopColor="#5FB4D9" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="winG" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#C9E6F2" />
          <stop offset="1" stopColor="#7FB0C8" />
        </linearGradient>
        <Grad id="incG" c="#DCE2E2" />
        <Grad id="cabG" c="#3D5568" />
      </defs>
      <rect x={-500} y={-420} width={1000} height={520} fill="url(#wallG)" />
      {/* ceiling edge and a light strip */}
      <rect x={-500} y={-420} width={1000} height={130} fill="#0E1822" />
      <rect x={-160} y={-298} width={320} height={7} rx={3} fill="#E9F4F8" opacity={0.85} />
      <rect x={-500} y={-292} width={1000} height={3} fill="#0A121A" />
      {/* the monitors' glow on the wall */}
      <ellipse cx={0} cy={-80} rx={120} ry={95} fill="url(#glowG)" />
      {/* upper cabinets */}
      {[-178, -98, 52, 132].map((x, i) => (
        <g key={i}>
          <rect x={x} y={-282} width={76} height={78} rx={2} fill="url(#cabG)" stroke={INK} strokeWidth={iw} />
          <line x1={x + 38} y1={-282} x2={x + 38} y2={-204} stroke={INK} strokeWidth={iw} />
          <rect x={x + 31} y={-226} width={2.4} height={12} rx={1} fill="#A9BCC8" />
          <rect x={x + 42.5} y={-226} width={2.4} height={12} rx={1} fill="#A9BCC8" />
        </g>
      ))}
      {/* shelves with glassware */}
      {[[-160, -150], [50, -150], [-160, -114], [50, -114]].map(([x, y], i) => (
        <g key={i}>
          <rect x={x} y={y} width={136} height={3.2} fill="#8EA3B1" stroke={INK} strokeWidth={iw} />
          {[0, 1, 2, 3, 4, 5].map((k) => bottle(x + 8 + k * 21, y, 10 + ((k * 7 + i * 3) % 9), ['#9ED7E8', '#F1B7C8', '#E9E3B0', '#B9E3C6'][(k + i) % 4], k))}
        </g>
      ))}
      {/* window (cool daylight) */}
      <g>
        <rect x={205} y={-270} width={130} height={170} rx={3} fill="url(#winG)" stroke={INK} strokeWidth={iw * 1.4} />
        {Array.from({length: 13}, (_, k) => <rect key={k} x={207} y={-266 + k * 13} width={126} height={5.5} fill="#E6F3F8" opacity={0.55} />)}
      </g>
      {/* incubator on the left */}
      <g>
        <rect x={-270} y={-120} width={92} height={210} rx={4} fill="url(#incG)" stroke={INK} strokeWidth={iw * 1.3} />
        <rect x={-262} y={-110} width={76} height={120} rx={3} fill="#9DB4BE" stroke={INK} strokeWidth={iw} />
        <rect x={-256} y={-104} width={64} height={108} rx={2} fill="#C8DCE3" opacity={0.6} />
        <rect x={-240} y={20} width={34} height={12} rx={2} fill="#132430" stroke={INK} strokeWidth={iw} />
        <text x={-223} y={29.5} textAnchor="middle" fontFamily={MONO} fontWeight={700} fontSize={7} fill="#7FE3B5">37.0</text>
      </g>
    </g>
  );
};

// ------------------------------------------------------------------ bench, monitors, PC, the CL1's inside
export const LabBack: React.FC<{iw: number; t: number}> = ({iw, t}) => {
  const c = CL1;
  return (
    <g>
      <defs>
        <linearGradient id="benchTop" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#7E8F99" />
          <stop offset="1" stopColor="#B7C4CA" />
        </linearGradient>
        <Grad id="benchBody" c="#4B6272" />
        <Grad id="bezel" c="#1A2025" k={0.6} />
        <Grad id="pcG" c="#2F3943" x1={0} y1={0} x2={1} y2={0.3} />
        <Grad id="pole" c="#59656E" x1={0} y1={0} x2={1} y2={0} />
        <linearGradient id="inner" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#C9D3D8" />
          <stop offset="1" stopColor="#E7ECEE" />
        </linearGradient>
        <radialGradient id="headG" cx="0.4" cy="0.35" r="0.7">
          <stop offset="0" stopColor="#5C6973" />
          <stop offset="1" stopColor="#262E35" />
        </radialGradient>
        <linearGradient id="media" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#F28FB0" />
          <stop offset="1" stopColor="#C9507E" />
        </linearGradient>
      </defs>
      {/* floor and bench */}
      <rect x={-600} y={88} width={1200} height={200} fill="#1A2731" />
      <rect x={-600} y={BENCH_BACK} width={1200} height={BENCH_FRONT - BENCH_BACK} fill="url(#benchTop)" />
      <rect x={-600} y={BENCH_FRONT} width={1200} height={3} fill="#E2E9EC" stroke={INK} strokeWidth={iw} />
      <rect x={-600} y={BENCH_FRONT + 3} width={1200} height={68} fill="url(#benchBody)" stroke={INK} strokeWidth={iw} />
      {[-150, -90, -30, 30, 90].map((x, i) => (
        <g key={i}>
          <rect x={x + 2} y={BENCH_FRONT + 8} width={56} height={56} rx={1.5} fill="none" stroke={shade('#4B6272', 0.5)} strokeWidth={iw} />
          <rect x={x + 24} y={BENCH_FRONT + 13} width={12} height={2.2} rx={1} fill="#A9BCC8" stroke={INK} strokeWidth={iw * 0.6} />
        </g>
      ))}
      {/* monitor arm */}
      <rect x={-1.6} y={-50} width={3.2} height={46} fill="url(#pole)" stroke={INK} strokeWidth={iw} />
      <rect x={-6} y={-6.5} width={12} height={3} rx={1} fill="#3B464F" stroke={INK} strokeWidth={iw} />
      {/* the game monitor */}
      <rect x={GAME.x0 - 1.2} y={GAME.y0 - 1.2} width={GAME.x1 - GAME.x0 + 2.4} height={GAME.y1 - GAME.y0 + 2.6} rx={0.8} fill="url(#bezel)" stroke={INK} strokeWidth={iw * 1.2} />
      <rect x={GAME.x0} y={GAME.y0} width={GAME.x1 - GAME.x0} height={GAME.y1 - GAME.y0} fill="#000" />
      <text x={0} y={GAME.y1 + 1.0} textAnchor="middle" fontFamily={MONO} fontWeight={500} fontSize={0.72} fill="#7E8F99">illustrative recreation · not experiment footage</text>
      {/* the control monitor and its software */}
      <rect x={CTRL.x0 - 1.2} y={CTRL.y0 - 1.2} width={CTRL.x1 - CTRL.x0 + 2.4} height={CTRL.y1 - CTRL.y0 + 2.6} rx={0.8} fill="url(#bezel)" stroke={INK} strokeWidth={iw * 1.2} />
      <g transform={`translate(${CTRL.x0} ${CTRL.y0}) scale(${(CTRL.x1 - CTRL.x0) / 1600})`}>
        <ControlUI t={t} />
      </g>
      {/* the PC tower */}
      <g>
        <polygon points={poly([{x: PC.x0, y: PC.top}, {x: PC.x0 + 2.5, y: PC.top - 4}, {x: PC.x1 + 2.5, y: PC.top - 4}, {x: PC.x1, y: PC.top}])} fill="#46525C" stroke={INK} strokeWidth={iw} />
        <rect x={PC.x0} y={PC.top} width={PC.x1 - PC.x0} height={PC.bottom - PC.top} rx={0.8} fill="url(#pcG)" stroke={INK} strokeWidth={iw * 1.2} />
        <rect x={PC.x0 + 1.5} y={PC.top + 2} width={PC.x1 - PC.x0 - 3} height={6} rx={0.6} fill="#262F37" />
        <circle cx={PC.x0 + 4} cy={PC.top + 5} r={1.3} fill="#1B2228" stroke="#46D2FF" strokeWidth={0.35} />
        <rect x={PC.x0 + 7} y={PC.top + 4.4} width={2.2} height={1.2} rx={0.3} fill="#11171C" />
        <rect x={PC.x0 + 10} y={PC.top + 4.4} width={2.2} height={1.2} rx={0.3} fill="#11171C" />
        {Array.from({length: 13 * 9}, (_, k) => (
          <circle key={k} cx={PC.x0 + 2.6 + (k % 9) * 1.48} cy={PC.top + 11 + Math.floor(k / 9) * 2.2} r={0.42} fill="#151B20" />
        ))}
        <rect x={PC.x0 + 1.5} y={PC.bottom - 9} width={PC.x1 - PC.x0 - 3} height={6} rx={0.6} fill="#262F37" />
        <circle cx={PC.x1 - 3} cy={PC.bottom - 6} r={0.45} fill="#53E0A1" opacity={0.6 + 0.4 * Math.abs(Math.sin(t * 7))} />
      </g>
      {/* cable from the PC to the monitors (behind the control monitor's bezel) */}
      <path d={curve(CABLE_PC_CTRL)} fill="none" stroke={INK} strokeWidth={1.25 + iw * 2} strokeLinecap="round" />
      <path d={curve(CABLE_PC_CTRL)} fill="none" stroke="#2C3640" strokeWidth={1.25} strokeLinecap="round" />
      {/* CL1: shadow, the enclosure's inside */}
      <ellipse cx={(c.x0 + c.x1) / 2} cy={c.foot + 0.3} rx={21} ry={2.2} fill="#0A141B" opacity={0.35} />
      <polygon points={poly([{x: c.x0 + 0.8, y: c.top}, {x: c.x1 - 0.8, y: c.top}, {x: c.x1, y: c.lidFront}, {x: c.x1, y: c.glassBottom}, {x: c.x0, y: c.glassBottom}, {x: c.x0, y: c.lidFront}])} fill="url(#inner)" />
      {/* the inner deck (seen through the lid) */}
      <polygon points={poly([{x: c.x0 + 1.6, y: c.top + 1.4}, {x: c.x1 - 1.6, y: c.top + 1.4}, {x: c.x1 - 0.8, y: c.lidFront - 0.2}, {x: c.x0 + 0.8, y: c.lidFront - 0.2}])} fill="#D2DBDF" stroke={rgba(INK, 0.35)} strokeWidth={iw} />
      {/* the headstage (holds the MEA, locks shut over it) */}
      <ellipse cx={CHIP.x} cy={CHIP.y + 0.35} rx={5.6} ry={5.6 * CHIP_K} fill="#1C2329" />
      <ellipse cx={CHIP.x} cy={CHIP.y} rx={5.4} ry={5.4 * CHIP_K} fill="url(#headG)" stroke={INK} strokeWidth={iw} />
      <ellipse cx={CHIP.x} cy={CHIP.y} rx={4.1} ry={4.1 * CHIP_K} fill="none" stroke="#C59A45" strokeWidth={0.32} />
      <rect x={CHIP.x + 4.6} y={CHIP.y - 0.5} width={1.8} height={0.9} rx={0.3} fill="#8C99A3" stroke={INK} strokeWidth={iw * 0.7} />
      {/* media reservoirs, pump, filter and tubing (life support) */}
      {[[-8.2, 3.6], [-3.4, 3.6]].map(([x, w], i) => (
        <g key={i}>
          <rect x={x} y={-7.2} width={w} height={8} rx={0.6} fill={rgba('#E8F4F8', 0.75)} stroke={INK} strokeWidth={iw} />
          <rect x={x + 0.25} y={-3.6} width={w - 0.5} height={4.2} rx={0.4} fill="url(#media)" />
          <rect x={x + 0.7} y={-8.4} width={w - 1.4} height={1.3} rx={0.3} fill="#5E6A73" stroke={INK} strokeWidth={iw} />
          <rect x={x + 0.45} y={-6.6} width={0.45} height={5.6} fill="#FFFFFF" opacity={0.6} />
        </g>
      ))}
      <g>
        <rect x={16.6} y={-5.8} width={6.2} height={6.4} rx={0.8} fill="#EEF2F4" stroke={INK} strokeWidth={iw} />
        <circle cx={19.7} cy={-2.6} r={2.1} fill="#3E4A54" stroke={INK} strokeWidth={iw} />
        {[0, 1, 2].map((k) => {
          const a = t * 2.4 + (k * Math.PI * 2) / 3;
          return <circle key={k} cx={19.7 + Math.cos(a) * 1.35} cy={-2.6 + Math.sin(a) * 1.35} r={0.42} fill="#B9C6CF" />;
        })}
        <rect x={23.6} y={-7.4} width={1.4} height={7.8} rx={0.5} fill="#F6F0D8" stroke={INK} strokeWidth={iw} />
      </g>
      {/* tubes: medium out of the reservoirs to the culture, and on through the pump to the filter */}
      {[
        [{x: -6.4, y: -8.4}, {x: -6.4, y: -11.6}, {x: 0.5, y: -12.2}, {x: 3.0, y: -11.0}],
        [{x: -1.6, y: -8.4}, {x: -1.6, y: -10.2}, {x: 1.6, y: -10.6}, {x: 3.2, y: -10.2}],
        [{x: 12.9, y: -10.4}, {x: 16.5, y: -10.8}, {x: 18.8, y: -8.2}, {x: 18.6, y: -4.6}],
        [{x: 21.2, y: -4.9}, {x: 22.6, y: -8.6}, {x: 24.3, y: -8.6}, {x: 24.3, y: -7.4}],
      ].map((p, i) => {
        const d = curve(p as Pt[]);
        const flow = ((t * 0.55 + i * 0.27) % 1) * 100;
        return (
          <g key={i}>
            <path d={d} fill="none" stroke={INK} strokeWidth={0.62 + iw * 1.6} strokeLinecap="round" opacity={0.75} />
            <path d={d} fill="none" stroke="#F4BCD0" strokeWidth={0.62} strokeLinecap="round" />
            <path d={d} fill="none" stroke="#D9578A" strokeWidth={0.34} strokeLinecap="round" strokeDasharray="1.1 2.2" strokeDashoffset={-flow * 0.12} pathLength={undefined} />
          </g>
        );
      })}
    </g>
  );
};

// ------------------------------------------------------------------ the CL1's clear lid and front, cables, glare
export const LabFront: React.FC<{iw: number; t: number; lidAlpha?: number}> = ({iw, t, lidAlpha = 1}) => {
  const c = CL1;
  const act = Math.min(1, (recorded(33, t) + recorded(30, t) + recorded(41, t)) / 1.5);
  // the touchscreen's little trace: the summed recording over the last 1.2 s
  const trace: Pt[] = [];
  for (let k = 0; k <= 40; k++) {
    const tt = t - 1.2 + (k / 40) * 1.2;
    const v = Math.min(1.4, recorded(33, tt) + recorded(30, tt) * 0.8 + recorded(41, tt) * 0.6);
    trace.push({x: 14.2 + (k / 40) * 8.6, y: 8.4 - v * 2.2 - Math.sin(k * 1.7 + t * 9) * 0.12});
  }
  return (
    <g>
      <defs>
        <linearGradient id="baseG" x1="0" y1="0" x2="0.25" y2="1">
          <stop offset="0" stopColor="#FFFFFF" />
          <stop offset="0.6" stopColor="#ECF0F2" />
          <stop offset="1" stopColor="#C4CDD2" />
        </linearGradient>
        <linearGradient id="glassG" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity="0.32" />
          <stop offset="0.45" stopColor="#D8EEF6" stopOpacity="0.08" />
          <stop offset="1" stopColor="#9CC3D3" stopOpacity="0.2" />
        </linearGradient>
      </defs>
      {/* cable: CL1 -> PC */}
      <path d={curve(CABLE_CL1_PC)} fill="none" stroke={INK} strokeWidth={1.3 + iw * 2} strokeLinecap="round" />
      <path d={curve(CABLE_CL1_PC)} fill="none" stroke="#2C3640" strokeWidth={1.3} strokeLinecap="round" />
      {/* the clear lid (top) and front glass */}
      <g opacity={lidAlpha}>
        <polygon points={poly([{x: c.x0 + 0.8, y: c.top}, {x: c.x1 - 0.8, y: c.top}, {x: c.x1, y: c.lidFront}, {x: c.x0, y: c.lidFront}])} fill="url(#glassG)" stroke={INK} strokeWidth={iw * 1.2} />
        <path d={`M${c.x0 + 3} ${c.lidFront - 0.6} L${c.x0 + 9} ${c.top + 0.6}`} stroke="#FFFFFF" strokeWidth={0.5} opacity={0.55} strokeLinecap="round" />
        <path d={`M${c.x0 + 5.2} ${c.lidFront - 0.6} L${c.x0 + 10.4} ${c.top + 0.6}`} stroke="#FFFFFF" strokeWidth={0.22} opacity={0.45} strokeLinecap="round" />
      </g>
      <rect x={c.x0} y={c.lidFront} width={c.x1 - c.x0} height={c.glassBottom - c.lidFront} fill="url(#glassG)" stroke={INK} strokeWidth={iw * 1.2} />
      <path d={`M${c.x1 - 9} ${c.glassBottom - 0.5} L${c.x1 - 4} ${c.lidFront + 0.5}`} stroke="#FFFFFF" strokeWidth={0.45} opacity={0.45} strokeLinecap="round" />
      {/* the white base */}
      <path d={`M${c.x0} ${c.glassBottom} H${c.x1} V${c.base - 1.4} Q${c.x1} ${c.base} ${c.x1 - 1.4} ${c.base} H${c.x0 + 1.4} Q${c.x0} ${c.base} ${c.x0} ${c.base - 1.4} Z`} fill="url(#baseG)" stroke={INK} strokeWidth={iw * 1.2} />
      <rect x={c.x0 + 0.8} y={c.base} width={c.x1 - c.x0 - 1.6} height={c.foot - c.base} rx={0.5} fill="#2B3540" stroke={INK} strokeWidth={iw} />
      <text x={c.x0 + 2.4} y={8.6} fontFamily='"Nunito Variable", sans-serif' fontWeight={900} fontSize={3.4} fill="#33414C">CL1</text>
      {[0, 1, 2, 3].map((k) => <rect key={k} x={c.x0 + 2.4 + k * 1.3} y={9.9} width={0.6} height={1.1} rx={0.25} fill="#B6C1C7" />)}
      {/* touchscreen */}
      <rect x={13.4} y={2.6} width={10.2} height={7.4} rx={0.7} fill="#0C1A22" stroke={INK} strokeWidth={iw} />
      <text x={14.2} y={4.4} fontFamily={MONO} fontWeight={700} fontSize={0.95} fill="#53E0A1">37.0 °C</text>
      <circle cx={22.6} cy={4.05} r={0.32} fill={act > 0.1 ? '#FFB23F' : '#3E5260'} />
      <polyline points={poly(trace)} fill="none" stroke="#FFB23F" strokeWidth={0.18} strokeLinejoin="round" />
      <rect x={13.4} y={2.6} width={10.2} height={2.2} rx={0.7} fill="#FFFFFF" opacity={0.05} />
    </g>
  );
};

/** soft sheen over the game screen */
export const ScreenGlare: React.FC<{iw: number}> = () => (
  <g>
    <defs>
      <linearGradient id="sheen" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#FFFFFF" stopOpacity="0.07" />
        <stop offset="0.4" stopColor="#FFFFFF" stopOpacity="0" />
      </linearGradient>
    </defs>
    <rect x={GAME.x0} y={GAME.y0} width={GAME.x1 - GAME.x0} height={GAME.y1 - GAME.y0} fill="url(#sheen)" />
  </g>
);
export {mix};
