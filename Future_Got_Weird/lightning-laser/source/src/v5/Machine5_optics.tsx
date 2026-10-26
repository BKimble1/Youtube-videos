// V5 shot C1: the inside of the laser enclosure as seen through its viewport. A copy of V3's C2 optics bench
// (v3/Machine3_optics.tsx OpticsC2, which V5 reuses unchanged from 8.95) so that, at the cut, C1's last frame shows
// exactly C2's first: the same stage layout, the same packet train (packet k leaves the head on EV.opticsPackets + k/9,
// the same speeds), the same colours. What C1 adds is the power-up: before the relay (8.07) the bench is dim and no
// beam runs; on the relay the pump light floods it, and the train starts with packet FIRST_K (the first tick after the
// relay), the beam line growing out behind the first packet. Packets born before that are never drawn here; at the cut
// they would be up the relay duct, off C2's opening frame.
import React from 'react';
import {mix} from '../dc/color';
import {clamp, fmt} from '../dc/math';
import {ss} from '../lib';
import {MICRO_ANG} from '../v3/cams3';
import {PAL} from '../v3/palette';
import {EV} from '../v3/timeline3';
import {E0} from '../v3/Machine3_reveal';

const INK = '#0B151C';
const PULSE_HZ = 9;
export const BENCH_Y = 1210;
export const BEAM_Y = 1130;
export const MIRROR_X = 900;
export const AP_X = 250;
const RUN = MIRROR_X - AP_X;
const PATH_LEN = RUN + BEAM_Y + 900;
const pathPt = (s: number) => (s < RUN ? {x: AP_X + s, y: BEAM_Y} : {x: MIRROR_X, y: BEAM_Y - (s - RUN)});
// the packet kinematics, exactly V3's (see Machine3_optics.tsx)
const Z1 = 1.7;
const RAD = (MICRO_ANG * Math.PI) / 180;
const MIRROR_SY = 1440;
const Y_E = BEAM_Y - (MIRROR_SY - E0.y) / Math.cos(RAD) / Z1;
const V_D = 800;
const S_E = RUN + (BEAM_Y - Y_E);
const TAU_E = EV.windowPackets - EV.opticsPackets;
const S_A = 520;
const V_B = (() => {
  const b = V_D * TAU_E + S_A - 2 * S_E;
  return (-b + Math.sqrt(b * b + 4 * TAU_E * V_D * S_A)) / (2 * TAU_E);
})();
const TAU_A = S_A / V_B;
export const sOf = (tau: number) => {
  if (tau <= TAU_A) return V_B * tau;
  if (tau >= TAU_E) return S_E + V_D * (tau - TAU_E);
  const x = (tau - TAU_A) / (TAU_E - TAU_A);
  return V_B * tau + (V_D - V_B) * (TAU_E - TAU_A) * (x * x * x - (x * x * x * x) / 2);
};
const vOf = (tau: number) => {
  const x = clamp((tau - TAU_A) / (TAU_E - TAU_A));
  return V_B + (V_D - V_B) * x * x * (3 - 2 * x);
};
export const born = (k: number) => EV.opticsPackets + k / PULSE_HZ;
/** the first packet C1 draws: the first tick after the relay closes (8.07): k = -7, 8.122 */
export const FIRST_K = (() => {
  let k = -30;
  while (born(k) < EV.fireRelay) k++;
  return k;
})();
const packets = (t: number) => {
  const out: {s: number; v: number; k: number}[] = [];
  for (let k = FIRST_K; k < 12; k++) {
    if (t < born(k)) break;
    const s = sOf(t - born(k));
    if (s < PATH_LEN) out.push({s, v: vOf(t - born(k)), k});
  }
  return out;
};
const passLight = (ps: {s: number}[], at: number, w: number) => ps.reduce((a, p) => Math.max(a, Math.exp(-(((p.s - at) / w) ** 2))), 0);
/** the head's aperture flash on each tick from the first packet on */
export const tickC1 = (t: number) => {
  let a = 0;
  for (let k = FIRST_K; k < 7; k++) if (t >= born(k)) a += Math.exp(-(t - born(k)) / 0.06);
  return a;
};
/** C2's opening camera (stage units): where C1's push must land at 8.95 */
export const C2_OPEN = {x: 430, y: 1060, z: 1.6};

/** the bench at time t. `xf` is the stage transform (C2's camera form); `pw` the power state: lit (bench lighting,
 *  1 = C2's), hum (0..1, the pump modules coming up), flash (the relay's pump flash, 0..~1.3), strobe (the pump lamps:
 *  a double strobe on the relay, then a pulse per packet; it has died away by the cut, where the lamps are C2's) */
export const BenchC1: React.FC<{t: number; xf: string; tag: string; pw: {lit: number; hum: number; flash: number; strobe: number}}> = ({t, xf, tag, pw}) => {
  const ps = packets(t);
  const steel = '#4E5C66', steelL = '#7E8C96';
  const pumpL = passLight(ps, 270, 48);
  const lensL = passLight(ps, 480, 40);
  const mirL = passLight(ps, RUN, 40);
  const tick = tickC1(t);
  // the beam line grows out behind the first packet (a little ahead of it: the packet's own head), then is whole
  const front = t >= born(FIRST_K) ? Math.min(PATH_LEN, sOf(t - born(FIRST_K)) + 10) : 0;
  const beamLine = front <= 0 ? '' : front < RUN ? `M${AP_X},${BEAM_Y} L${fmt(AP_X + front)},${BEAM_Y}` : `M${AP_X},${BEAM_Y} L${MIRROR_X},${BEAM_Y} L${MIRROR_X},${fmt(BEAM_Y - (front - RUN))}`;
  const pumpBase = 0.3 * pw.hum;
  const fl = clamp(pw.flash, 0, 1.4);
  // the pump lamps strobe: full on the relay, a pulse with each early packet, gone (C2's grey) well before the cut
  const st = clamp(pw.strobe) * (1 - ss(t, 8.5, 8.75));
  return (
    <g>
      <defs>
        <linearGradient id={`${tag}-wall`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1B2A32" />
          <stop offset="1" stopColor="#25353E" />
        </linearGradient>
        <linearGradient id={`${tag}-box`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#D9DEE2" />
          <stop offset="1" stopColor="#8E9AA2" />
        </linearGradient>
        <radialGradient id={`${tag}-pump`}>
          <stop offset="0" stopColor={PAL.packet} stopOpacity={0.95} />
          <stop offset="0.4" stopColor={PAL.laser} stopOpacity={0.5} />
          <stop offset="1" stopColor={PAL.laserGlow} stopOpacity={0} />
        </radialGradient>
        <radialGradient id={`${tag}-pk`}>
          <stop offset="0" stopColor="#FFFFFF" stopOpacity={1} />
          <stop offset="0.3" stopColor={PAL.packet} stopOpacity={0.75} />
          <stop offset="1" stopColor={PAL.laserGlow} stopOpacity={0} />
        </radialGradient>
        {/* the relay's flash over the bench: saturated cyan, white only at the lamps */}
        <radialGradient id={`${tag}-wash`}>
          <stop offset="0" stopColor={PAL.laser} stopOpacity={0.55} />
          <stop offset="0.45" stopColor={PAL.laserGlow} stopOpacity={0.25} />
          <stop offset="1" stopColor={PAL.laserGlow} stopOpacity={0} />
        </radialGradient>
        <radialGradient id={`${tag}-fl`}>
          <stop offset="0" stopColor="#FFFFFF" stopOpacity={0.9} />
          <stop offset="0.25" stopColor={PAL.packet} stopOpacity={0.6} />
          <stop offset="0.6" stopColor={PAL.laser} stopOpacity={0.22} />
          <stop offset="1" stopColor={PAL.laserGlow} stopOpacity={0} />
        </radialGradient>
      </defs>
      <rect x={-2000} y={-2000} width={5080} height={5920} fill="#141E24" />
      <g transform={xf}>
        <rect x={-700} y={-1300} width={2600} height={3300} fill={`url(#${tag}-wall)`} />
        {Array.from({length: 20}, (_, i) => <rect key={i} x={-680 + i * 130} y={-1300} width={10} height={BENCH_Y + 1300} fill="#0F1A20" opacity={0.6} />)}
        <circle cx={300} cy={600} r={92} fill="#0B141A" stroke={steel} strokeWidth={18} />
        <circle cx={300} cy={600} r={92} fill="#223046" opacity={0.9} />
        <path d="M244,566 A70,70 0 0 1 300,532" fill="none" stroke="#8FA4BC" strokeWidth={6} strokeLinecap="round" opacity={0.3} />
        <circle cx={300} cy={600} r={92} fill="none" stroke={INK} strokeWidth={4} />
        <rect x={-700} y={760} width={2600} height={34} fill="#2C3A42" stroke={INK} strokeWidth={3} />
        {[0, 1, 2, 3].map((i) => <path key={i} d={`M-700,${812 + i * 22} C200,${830 + i * 22} 500,${806 + i * 22} 1900,${820 + i * 22}`} fill="none" stroke={['#2F6FB0', '#B0402F', '#1C262C', '#E0B040'][i]} strokeWidth={12} />)}
        <rect x={MIRROR_X - 54} y={-1300} width={108} height={BEAM_Y - 60 + 1300} fill={steel} stroke={INK} strokeWidth={4} />
        <rect x={MIRROR_X - 40} y={-1300} width={80} height={BEAM_Y - 60 + 1300} fill="#0E171C" />
        {[-1000, -700, -400, -100, 200, 500, 800].map((y) => <rect key={y} x={MIRROR_X - 64} y={y} width={128} height={22} rx={4} fill={steelL} stroke={INK} strokeWidth={3} />)}
        <rect x={-700} y={BENCH_Y} width={2600} height={120} fill="#3A4850" stroke={INK} strokeWidth={4} />
        {Array.from({length: 56}, (_, i) => <circle key={i} cx={-680 + i * 46} cy={BENCH_Y + 30} r={5} fill="#1C262C" />)}
        <rect x={-700} y={BENCH_Y + 120} width={2600} height={900} fill="#1A2329" />
        {Array.from({length: 8}, (_, i) => (
          <g key={i}>
            <rect x={-560 + i * 300} y={BENCH_Y + 150} width={270} height={300} rx={8} fill="#222D34" stroke={INK} strokeWidth={3} />
            <rect x={-450 + i * 300} y={BENCH_Y + 180} width={50} height={10} rx={4} fill="#5E6C74" />
            {Array.from({length: 5}, (_, k) => <rect key={k} x={-540 + i * 300} y={BENCH_Y + 230 + k * 36} width={230} height={8} rx={3} fill="#121A1F" />)}
          </g>
        ))}
        {/* laser head (its aperture flashes as each packet leaves); the middle lamp is the tick lamp, as in C2 */}
        <rect x={-120} y={BEAM_Y - 110} width={370} height={200} rx={16} fill={`url(#${tag}-box)`} stroke={INK} strokeWidth={4} />
        <rect x={-90} y={BEAM_Y - 80} width={170} height={40} rx={6} fill="#26323A" />
        {[0, 1, 2].map((i) => <circle key={i} cx={120 + i * 34} cy={BEAM_Y - 60} r={9} fill={i === 0 ? '#5BF08A' : i === 1 ? (tick > 0.4 ? PAL.laser : '#24343A') : pw.hum > 0.5 ? '#F0B85B' : '#4A3E2C'} stroke={INK} strokeWidth={2.5} />)}
        <rect x={236} y={BEAM_Y - 24} width={24} height={48} rx={4} fill="#1C262C" stroke={INK} strokeWidth={3} />
        <path d={`M-120,${BEAM_Y + 60} C-180,${BEAM_Y + 60} -200,${BEAM_Y + 140} -260,${BEAM_Y + 150}`} fill="none" stroke="#1C262C" strokeWidth={14} />
        {/* amplifier module (pump glow comes up with the hum, flares as a packet passes) */}
        <rect x={420} y={BEAM_Y - 90} width={200} height={160} rx={12} fill="#3E4C54" stroke={INK} strokeWidth={4} />
        <rect x={444} y={BEAM_Y - 26} width={152} height={52} rx={6} fill="#0E1E24" stroke={INK} strokeWidth={3} />
        <ellipse cx={520} cy={BEAM_Y} rx={100 + 40 * Math.max(pumpL, fl * 0.8)} ry={46 + 20 * Math.max(pumpL, fl * 0.8)} fill={`url(#${tag}-pump)`} opacity={fmt(clamp(pumpBase + 0.7 * pumpL + 0.7 * fl))} style={{mixBlendMode: 'screen'}} />
        {/* the pump lamps on the amplifier: they flash on the relay (C2's grey once it has passed) */}
        {[0, 1, 2, 3].map((i) => <rect key={i} x={452 + i * 38} y={BEAM_Y - 82} width={22} height={30} rx={3} fill={mix('#5E6C74', '#F2FEFF', clamp(Math.max(fl * 1.2, st * (0.75 + 0.25 * ((i + Math.round(t * 30)) % 2)))))} stroke={INK} strokeWidth={2} />)}
        {Math.max(fl, st) > 0.02 && <ellipse cx={520} cy={BEAM_Y - 67} rx={110 + 30 * st} ry={40 + 10 * st} fill={`url(#${tag}-fl)`} opacity={fmt(clamp(Math.max(fl, 0.8 * st)))} style={{mixBlendMode: 'screen'}} />}
        {[700, 760].map((x, i) => (
          <g key={x}>
            <rect x={x - 14} y={BEAM_Y + 44} width={28} height={BENCH_Y - BEAM_Y - 44} fill={steel} stroke={INK} strokeWidth={3} />
            <ellipse cx={x} cy={BEAM_Y} rx={14} ry={i ? 58 : 44} fill={mix('#9FC3E0', '#E8FCFF', lensL)} fillOpacity={0.55 + 0.35 * lensL} stroke={INK} strokeWidth={4} />
            <ellipse cx={x - 4} cy={BEAM_Y - 16} rx={4} ry={14} fill="#FFFFFF" opacity={0.45 + 0.5 * lensL} />
          </g>
        ))}
        <rect x={MIRROR_X - 20} y={BEAM_Y + 30} width={40} height={BENCH_Y - BEAM_Y - 30} fill={steel} stroke={INK} strokeWidth={3} />
        <g transform={`translate(${MIRROR_X} ${BEAM_Y}) rotate(-45)`}>
          <rect x={-70} y={-12} width={140} height={24} rx={6} fill={steelL} stroke={INK} strokeWidth={4} />
          <rect x={-62} y={-14} width={124} height={8} rx={3} fill={mix('#CFE0EE', '#FFFFFF', mirL)} />
        </g>
        {mirL > 0.05 && <circle cx={MIRROR_X} cy={BEAM_Y} r={60 + 30 * mirL} fill={`url(#${tag}-pk)`} opacity={0.6 * mirL} style={{mixBlendMode: 'screen'}} />}
        <g style={{mixBlendMode: 'screen'}}>
          {beamLine && <path d={beamLine} fill="none" stroke={PAL.laserGlow} strokeOpacity={0.4} strokeWidth={10} strokeLinejoin="round" />}
          {beamLine && <path d={beamLine} fill="none" stroke={PAL.laser} strokeOpacity={0.7} strokeWidth={3} strokeLinejoin="round" />}
          {tick > 0.02 && <ellipse cx={AP_X + 6} cy={BEAM_Y} rx={40 + 30 * clamp(tick)} ry={26 + 16 * clamp(tick)} fill={`url(#${tag}-pk)`} opacity={clamp(tick)} />}
          {ps.map(({s, v, k}) => {
            const p = pathPt(s);
            const vert = s > RUN;
            const L = Math.min(s, 0.044 * v);
            const q = pathPt(s - L);
            const d = vert && s - L < RUN ? `M${fmt(MIRROR_X)},${fmt(BEAM_Y)} L${fmt(p.x)},${fmt(p.y)}` : `M${fmt(q.x)},${fmt(q.y)} L${fmt(p.x)},${fmt(p.y)}`;
            const m = pathPt(s - L / 2);
            const hl = L / 2 + 16;
            return (
              <g key={k}>
                <ellipse cx={fmt(m.x)} cy={fmt(m.y)} rx={fmt(vert ? 17 : hl)} ry={fmt(vert ? hl : 17)} fill={`url(#${tag}-pk)`} opacity={0.55} />
                <path d={d} stroke={PAL.laserGlow} strokeOpacity={0.5} strokeWidth={14} strokeLinecap="round" fill="none" />
                <path d={d} stroke={PAL.packet} strokeWidth={4.5} strokeLinecap="round" fill="none" />
              </g>
            );
          })}
          {/* the relay's pump flash: the amplifier and the head blaze for a moment, lighting the bench */}
          {fl > 0.02 && <ellipse cx={460} cy={BEAM_Y} rx={360} ry={200} fill={`url(#${tag}-wash)`} opacity={fmt(clamp(fl * 0.85))} />}
          {fl > 0.02 && <ellipse cx={520} cy={BEAM_Y} rx={150} ry={70} fill={`url(#${tag}-fl)`} opacity={fmt(clamp(fl))} />}
          {fl > 0.02 && <ellipse cx={AP_X} cy={BEAM_Y} rx={90} ry={60} fill={`url(#${tag}-fl)`} opacity={fmt(clamp(fl * 0.8))} />}
        </g>
      </g>
      {/* before the power-up the bench is dim (C2's lighting is lit = 1) */}
      {pw.lit < 0.999 && <rect x={-2000} y={-2000} width={5080} height={5920} fill="#04080C" opacity={fmt(0.62 * (1 - clamp(pw.lit)))} />}
    </g>
  );
};
