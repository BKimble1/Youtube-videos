// V3 beat C2 (8.95-9.67): the enclosure optics. Copied from v2/Firing2.tsx F2Cutaway (V2 keeps its own) and recoloured
// to the V3 laser palette (cyan line, cyan-white packets; violet stays the discharge's). A cutaway of the laser
// enclosure: each packet leaves the laser head on a tick (EV.opticsPackets + k/9), passes the amplifier (its pump light
// flares as the packet goes through), a lens pair, and a turning mirror that sends it up the relay duct toward the
// telescope. The train is already running when we cut in (the machine fired in C1). The camera trucks with the packets
// and tilts up at the mirror, rolling as it goes so that at the cut the duct runs up the screen at MICRO_ANG through E0:
// the line and direction C3's beam leaves the telescope on.
import React from 'react';
import {mix} from '../dc/color';
import {clamp, fmt} from '../dc/math';
import {sm5} from '../camera';
import {MICRO_ANG} from './cams3';
import {PAL} from './palette';
import {B, EV} from './timeline3';
import {E0} from './Machine3_reveal';

const INK = '#0B151C';
const PULSE_HZ = 9; // drawn packet rate (a stand-in: 1,000 per second can't be seen at 30 fps)

const BENCH_Y = 1210; // top of the optical table (stage units)
const BEAM_Y = 1130; // beam height along the bench
const MIRROR_X = 900; // the turning mirror (beam turns up the duct here)
const AP_X = 250; // the laser head's aperture
const RUN = MIRROR_X - AP_X; // aperture to the mirror
const PATH_LEN = RUN + BEAM_Y + 900; // aperture to the top of the duct (y -900)
/** position along the drawn optical path (0 = laser aperture) */
const pathPt = (s: number) => (s < RUN ? {x: AP_X + s, y: BEAM_Y} : {x: MIRROR_X, y: BEAM_Y - (s - RUN)});
// the framing at the cut (the camera below): the duct point (MIRROR_X, Y_E) sits on E0, where C3's exit window is, and
// the duct runs at MICRO_ANG, the mirror low in frame but above the caption band (screen y MIRROR_SY), at zoom Z1
const Z1 = 1.7;
const RAD = (MICRO_ANG * Math.PI) / 180;
const MIRROR_SY = 1440;
const Y_E = BEAM_Y - (MIRROR_SY - E0.y) / Math.cos(RAD) / Z1;

// ------------------------------------------------------------------ the packet train
// One train from the head to the cut, the same train C3 continues: packet k leaves the head on its tick (EV.opticsPackets
// + k/9) and passes the duct point Y_E exactly when C3's packet k leaves the exit window (EV.windowPackets + k/9). On the
// bench it runs at V_B; from just past the lens pair it eases (through the mirror's turn) to V_D, which it reaches at
// Y_E and keeps up the duct. V_D at Z1 is C3's train as it leaves the exit (about 1,300 screen px/s, packets about
// 150 px apart at 9 per second), so at the cut the packets above E0 carry straight on as C3's: same place, speed,
// spacing and direction.
/** the duct speed (stage px/s) */
const V_D = 800;
/** the path position of the duct point on E0 at the cut, and the time a packet takes to get there */
const S_E = RUN + (BEAM_Y - Y_E);
const TAU_E = EV.windowPackets - EV.opticsPackets;
/** the train starts easing to V_D here (just past the second lens) */
const S_A = 520;
/** the bench speed, from s(TAU_E) = S_E with the smoothstep slow-down over [TAU_A, TAU_E] and V_B TAU_A = S_A:
 *  TAU_E V_B^2 + (V_D TAU_E + S_A - 2 S_E) V_B - V_D S_A = 0 */
const V_B = (() => {
  const b = V_D * TAU_E + S_A - 2 * S_E;
  return (-b + Math.sqrt(b * b + 4 * TAU_E * V_D * S_A)) / (2 * TAU_E);
})();
const TAU_A = S_A / V_B;
/** a packet's path position and speed at age tau (s since it left the head) */
const sOf = (tau: number) => {
  if (tau <= TAU_A) return V_B * tau;
  if (tau >= TAU_E) return S_E + V_D * (tau - TAU_E);
  const x = (tau - TAU_A) / (TAU_E - TAU_A);
  return V_B * tau + (V_D - V_B) * (TAU_E - TAU_A) * (x * x * x - (x * x * x * x) / 2);
};
const vOf = (tau: number) => {
  const x = clamp((tau - TAU_A) / (TAU_E - TAU_A));
  return V_B + (V_D - V_B) * x * x * (3 - 2 * x);
};
/** packet k leaves the head on the tick EV.opticsPackets + k/9 (k < 0: the train already running at the cut) */
const born = (k: number) => EV.opticsPackets + k / PULSE_HZ;
const packets = (t: number) => {
  const out: {s: number; v: number; k: number}[] = [];
  for (let k = -30; k < 12; k++) {
    if (t < born(k)) break;
    const s = sOf(t - born(k));
    if (s < PATH_LEN) out.push({s, v: vOf(t - born(k)), k});
  }
  return out;
};
/** how strongly a component at path position `at` is being lit by a passing packet (w well under the spacing, so
 *  each packet's flare reads on its own) */
const passLight = (ps: {s: number}[], at: number, w: number) => ps.reduce((a, p) => Math.max(a, Math.exp(-(((p.s - at) / w) ** 2))), 0);
/** the head's aperture flash on each tick (k = 0..6 are sound-locked) */
const tickAt = (t: number) => Array.from({length: 7}, (_, k) => born(k)).reduce((a, b0) => a + (t >= b0 ? Math.exp(-(t - b0) / 0.06) : 0), 0);

// ------------------------------------------------------------------ the camera (stage units; roll in degrees)
const T0 = B.C2, T1 = B.C3;
/** the opening framing: the bench's beam line just below the frame centre (where C1 leaves the eye: the panel and
 *  the beam in the window), the laser head at the left */
const C0 = {x: 430, y: 1060, z: 1.6};
const END = (() => {
  // screen = (540, 960) + R(roll) (p - c) z  =>  c = p - R(-roll) (E0 - (540, 960)) / z
  const dx = (E0.x - 540) / Z1, dy = (E0.y - 960) / Z1;
  const c = Math.cos(-RAD), s = Math.sin(-RAD);
  return {x: MIRROR_X - (c * dx - s * dy), y: Y_E - (s * dx + c * dy)};
})();
export const opticsCam = (t: number) => {
  const k = sm5(clamp((t - T0) / (T1 - T0)));
  // the tilt up the duct follows the packets turning at the mirror (at its fastest it climbs about as fast as they do);
  // the roll is spread a little wider, so the duct leans to the beam's direction gently rather than in a snap
  const up = sm5(clamp((t - (T0 + 0.2)) / (T1 - T0 - 0.2)));
  const rl = sm5(clamp((t - (T0 + 0.12)) / (T1 - T0 - 0.12)));
  return {x: C0.x + (END.x - C0.x) * k, y: C0.y + (END.y - C0.y) * up, z: C0.z + (Z1 - C0.z) * k, roll: MICRO_ANG * rl};
};

export const OpticsC2: React.FC<{t: number}> = ({t}) => {
  const tag = `c2-${Math.round(t * 30)}`;
  const cam = opticsCam(t);
  const tr = `translate(540 960) rotate(${fmt(cam.roll)}) scale(${fmt(cam.z)}) translate(${fmt(-cam.x)} ${fmt(-cam.y)})`;
  const ps = packets(t);
  const flash = 0;
  const steel = mix('#4E5C66', '#8A94C0', flash * 0.4), steelL = mix('#7E8C96', '#BCC4EE', flash * 0.4);
  const pumpL = passLight(ps, 270, 48);
  const lensL = passLight(ps, 480, 40);
  const mirL = passLight(ps, RUN, 40);
  const tick = tickAt(t);
  const beamLine = `M${AP_X},${BEAM_Y} L${MIRROR_X},${BEAM_Y} L${MIRROR_X},-900`;
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
      </defs>
      <rect x={0} y={0} width={1080} height={1920} fill="#141E24" />
      <g transform={tr}>
        {/* the enclosure interior: ribbed wall, cable tray, coolant lines, a porthole on the storm (still glass: the
            only motion in this shot is the train) */}
        <rect x={-700} y={-1300} width={2600} height={3300} fill={`url(#${tag}-wall)`} />
        {Array.from({length: 20}, (_, i) => <rect key={i} x={-680 + i * 130} y={-1300} width={10} height={BENCH_Y + 1300} fill="#0F1A20" opacity={0.6} />)}
        <circle cx={300} cy={600} r={92} fill="#0B141A" stroke={steel} strokeWidth={18} />
        <circle cx={300} cy={600} r={92} fill="#223046" opacity={0.9} />
        <path d="M244,566 A70,70 0 0 1 300,532" fill="none" stroke="#8FA4BC" strokeWidth={6} strokeLinecap="round" opacity={0.3} />
        <circle cx={300} cy={600} r={92} fill="none" stroke={INK} strokeWidth={4} />
        <rect x={-700} y={760} width={2600} height={34} fill="#2C3A42" stroke={INK} strokeWidth={3} />
        {[0, 1, 2, 3].map((i) => <path key={i} d={`M-700,${812 + i * 22} C200,${830 + i * 22} 500,${806 + i * 22} 1900,${820 + i * 22}`} fill="none" stroke={['#2F6FB0', '#B0402F', '#1C262C', '#E0B040'][i]} strokeWidth={12} />)}
        {/* the relay duct rising from the turning mirror to the telescope */}
        <rect x={MIRROR_X - 54} y={-1300} width={108} height={BEAM_Y - 60 + 1300} fill={steel} stroke={INK} strokeWidth={4} />
        <rect x={MIRROR_X - 40} y={-1300} width={80} height={BEAM_Y - 60 + 1300} fill="#0E171C" />
        {[-1000, -700, -400, -100, 200, 500, 800].map((y) => <rect key={y} x={MIRROR_X - 64} y={y} width={128} height={22} rx={4} fill={steelL} stroke={INK} strokeWidth={3} />)}
        {/* the optical table */}
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
        {/* laser head (its aperture flashes as each packet leaves) */}
        <rect x={-120} y={BEAM_Y - 110} width={370} height={200} rx={16} fill={`url(#${tag}-box)`} stroke={INK} strokeWidth={4} />
        <rect x={-90} y={BEAM_Y - 80} width={170} height={40} rx={6} fill="#26323A" />
        {[0, 1, 2].map((i) => <circle key={i} cx={120 + i * 34} cy={BEAM_Y - 60} r={9} fill={i === 0 ? '#5BF08A' : i === 1 ? (tick > 0.4 ? PAL.laser : '#24343A') : '#F0B85B'} stroke={INK} strokeWidth={2.5} />)}
        <rect x={236} y={BEAM_Y - 24} width={24} height={48} rx={4} fill="#1C262C" stroke={INK} strokeWidth={3} />
        <path d={`M-120,${BEAM_Y + 60} C-180,${BEAM_Y + 60} -200,${BEAM_Y + 140} -260,${BEAM_Y + 150}`} fill="none" stroke="#1C262C" strokeWidth={14} />
        {/* amplifier module (pump glow flares as a packet passes) */}
        <rect x={420} y={BEAM_Y - 90} width={200} height={160} rx={12} fill="#3E4C54" stroke={INK} strokeWidth={4} />
        <rect x={444} y={BEAM_Y - 26} width={152} height={52} rx={6} fill="#0E1E24" stroke={INK} strokeWidth={3} />
        <ellipse cx={520} cy={BEAM_Y} rx={100 + 40 * pumpL} ry={46 + 20 * pumpL} fill={`url(#${tag}-pump)`} opacity={0.3 + 0.7 * pumpL} style={{mixBlendMode: 'screen'}} />
        {[0, 1, 2, 3].map((i) => <rect key={i} x={452 + i * 38} y={BEAM_Y - 82} width={22} height={30} rx={3} fill="#5E6C74" stroke={INK} strokeWidth={2} />)}
        {/* lens pair (beam expander) */}
        {[700, 760].map((x, i) => (
          <g key={x}>
            <rect x={x - 14} y={BEAM_Y + 44} width={28} height={BENCH_Y - BEAM_Y - 44} fill={steel} stroke={INK} strokeWidth={3} />
            <ellipse cx={x} cy={BEAM_Y} rx={14} ry={i ? 58 : 44} fill={mix('#9FC3E0', '#E8FCFF', lensL)} fillOpacity={0.55 + 0.35 * lensL} stroke={INK} strokeWidth={4} />
            <ellipse cx={x - 4} cy={BEAM_Y - 16} rx={4} ry={14} fill="#FFFFFF" opacity={0.45 + 0.5 * lensL} />
          </g>
        ))}
        {/* turning mirror on its mount */}
        <rect x={MIRROR_X - 20} y={BEAM_Y + 30} width={40} height={BENCH_Y - BEAM_Y - 30} fill={steel} stroke={INK} strokeWidth={3} />
        <g transform={`translate(${MIRROR_X} ${BEAM_Y}) rotate(-45)`}>
          <rect x={-70} y={-12} width={140} height={24} rx={6} fill={steelL} stroke={INK} strokeWidth={4} />
          <rect x={-62} y={-14} width={124} height={8} rx={3} fill={mix('#CFE0EE', '#FFFFFF', mirL)} />
        </g>
        {mirL > 0.05 && <circle cx={MIRROR_X} cy={BEAM_Y} r={60 + 30 * mirL} fill={`url(#${tag}-pk)`} opacity={0.6 * mirL} style={{mixBlendMode: 'screen'}} />}
        {/* the beam: a faint continuous cyan line (the train is running), brighter packets riding it */}
        <g style={{mixBlendMode: 'screen'}}>
          <path d={beamLine} fill="none" stroke={PAL.laserGlow} strokeOpacity={0.4} strokeWidth={10} strokeLinejoin="round" />
          <path d={beamLine} fill="none" stroke={PAL.laser} strokeOpacity={0.7} strokeWidth={3} strokeLinejoin="round" />
          {tick > 0.02 && <ellipse cx={AP_X + 6} cy={BEAM_Y} rx={40 + 30 * clamp(tick)} ry={26 + 16 * clamp(tick)} fill={`url(#${tag}-pk)`} opacity={clamp(tick)} />}
          {ps.map(({s, v, k}) => {
            const p = pathPt(s);
            const vert = s > RUN;
            // each packet is a short capsule along the path, drawn as Beam3D draws C3's (a cyan glow stroke round a
            // cyan-white core) with a soft halo; its length follows its speed (it covers it in about 1/23 s), so in
            // the duct, at the cut, it is C3's packet as it leaves the exit (about 60 px long)
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
        </g>
      </g>
    </g>
  );
};
