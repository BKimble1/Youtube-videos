// V2 firing close-ups. F2 (8.95-9.67): a cutaway of the laser enclosure: pulses leave the laser head, pass the
// amplifier (its pump light flares as each one goes through), a lens pair, and a turning mirror that sends them up the
// relay duct to the telescope; the camera trucks with the pulses and tilts up at the mirror. F3 (9.67-10.39): the
// telescope's exit window in the rain, seen from just below: each pulse lights the optics and leaves as a short,
// faint packet; the camera tilts up off the rim onto the beam (F4 then follows it in the 3D sky).
// The beam is infrared (invisible in reality): drawn restrained, a thin violet line with brighter packets.
import React from 'react';
import {mix} from '../dc/color';
import {clamp, fmt, hash} from '../dc/math';
import {ss} from '../lib';
import {sm5} from '../camera';
import {S} from './timeline2';

const INK = '#0B151C';
const PULSE_HZ = 9; // drawn packet rate (a stand-in: 1,000 per second can't be seen at 30 fps)

// ------------------------------------------------------------------------------------------- F2: enclosure cutaway
const BENCH_Y = 1210; // top of the optical table (stage units)
const BEAM_Y = 1130; // beam height along the bench
const MIRROR_X = 900; // the turning mirror (beam turns up the duct here)
const PATH_LEN = MIRROR_X - 250 + BEAM_Y + 400; // laser aperture (x 250) to the top of the duct (y -400)
/** position along the drawn optical path (0 = laser aperture) */
const pathPt = (s: number) => (s < MIRROR_X - 250 ? {x: 250 + s, y: BEAM_Y} : {x: MIRROR_X, y: BEAM_Y - (s - (MIRROR_X - 250))});
const PKT_V = 2600; // drawn packet speed (stage px/s)
const packets = (t: number) => {
  const out: number[] = [];
  const t0 = S.F2 - 0.05;
  for (let k = 0; k < 12; k++) {
    const born = t0 + k / PULSE_HZ;
    if (t < born) break;
    const s = (t - born) * PKT_V;
    if (s < PATH_LEN) out.push(s);
  }
  return out;
};
/** how strongly a component at path position `at` is being lit by a passing packet */
const passLight = (ps: number[], at: number, w = 120) => ps.reduce((a, s) => Math.max(a, Math.exp(-(((s - at) / w) ** 2))), 0);

export const F2Cutaway: React.FC<{t: number; flash: number}> = ({t, flash}) => {
  const u = sm5(clamp((t - S.F2) / (S.F3 - S.F2)));
  const cam = {x: 430 + 330 * u, y: 880 - 260 * ss(t, S.F2 + 0.3, S.F3 + 0.05), z: 1.6 + 0.1 * u};
  const tr = `translate(540 960) scale(${fmt(cam.z)}) translate(${fmt(-cam.x)} ${fmt(-cam.y)})`;
  const ps = packets(t);
  const steel = mix('#4E5C66', '#8A94C0', flash * 0.4), steelL = mix('#7E8C96', '#BCC4EE', flash * 0.4);
  const pumpL = passLight(ps, 260, 140);
  const lensL = passLight(ps, 470, 90);
  const mirL = passLight(ps, MIRROR_X - 250, 110);
  const beamLine = (s0: number, s1: number) => {
    const a = pathPt(s0), b = pathPt(Math.min(s1, MIRROR_X - 250)), c = pathPt(s1);
    return s1 <= MIRROR_X - 250 ? `M${fmt(a.x)},${fmt(a.y)} L${fmt(b.x)},${fmt(b.y)}` : `M${fmt(a.x)},${fmt(a.y)} L${fmt(b.x)},${fmt(b.y)} L${fmt(c.x)},${fmt(c.y)}`;
  };
  return (
    <g>
      <defs>
        <linearGradient id="f2-wall" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1B2A32" />
          <stop offset="1" stopColor="#25353E" />
        </linearGradient>
        <linearGradient id="f2-box" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={mix('#D9DEE2', '#EEF0FF', flash * 0.4)} />
          <stop offset="1" stopColor={mix('#8E9AA2', '#B0B8E0', flash * 0.4)} />
        </linearGradient>
        <radialGradient id="f2-pump">
          <stop offset="0" stopColor="#FFE2F4" stopOpacity={0.95} />
          <stop offset="0.4" stopColor="#E28BFF" stopOpacity={0.55} />
          <stop offset="1" stopColor="#8A5CFF" stopOpacity={0} />
        </radialGradient>
        <radialGradient id="f2-pk">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity={1} />
          <stop offset="0.3" stopColor="#D8C8FF" stopOpacity={0.7} />
          <stop offset="1" stopColor="#8C6CFF" stopOpacity={0} />
        </radialGradient>
      </defs>
      <rect x={0} y={0} width={1080} height={1920} fill="#141E24" />
      <g transform={tr}>
        {/* the enclosure interior: ribbed wall, cable tray, coolant lines, a porthole on the storm */}
        <rect x={-300} y={-900} width={1800} height={2300} fill="url(#f2-wall)" />
        {Array.from({length: 14}, (_, i) => <rect key={i} x={-280 + i * 130} y={-900} width={10} height={BENCH_Y + 900} fill="#0F1A20" opacity={0.6} />)}
        <circle cx={300} cy={560} r={92} fill="#0B141A" stroke={steel} strokeWidth={18} />
        <circle cx={300} cy={560} r={92} fill={mix('#2A3850', '#C6CEFF', flash)} opacity={0.9} />
        {Array.from({length: 6}, (_, i) => <line key={i} x1={300 - 70 + i * 26} y1={500 + ((i * 37 + t * 600) % 120)} x2={300 - 74 + i * 26} y2={524 + ((i * 37 + t * 600) % 120)} stroke="#AFC2D6" strokeWidth={3} opacity={0.5} />)}
        <circle cx={300} cy={560} r={92} fill="none" stroke={INK} strokeWidth={4} />
        <rect x={-300} y={760} width={1800} height={34} fill="#2C3A42" stroke={INK} strokeWidth={3} />
        {[0, 1, 2, 3].map((i) => <path key={i} d={`M-300,${812 + i * 22} C200,${830 + i * 22} 500,${806 + i * 22} 1500,${820 + i * 22}`} fill="none" stroke={['#2F6FB0', '#B0402F', '#1C262C', '#E0B040'][i]} strokeWidth={12} />)}
        {/* the relay duct rising from the turning mirror to the telescope */}
        <rect x={MIRROR_X - 54} y={-900} width={108} height={BEAM_Y - 60 + 900} fill={steel} stroke={INK} strokeWidth={4} />
        <rect x={MIRROR_X - 40} y={-900} width={80} height={BEAM_Y - 60 + 900} fill="#0E171C" />
        {[-400, -100, 200, 500, 800].map((y) => <rect key={y} x={MIRROR_X - 64} y={y} width={128} height={22} rx={4} fill={steelL} stroke={INK} strokeWidth={3} />)}
        {/* the optical table */}
        <rect x={-300} y={BENCH_Y} width={1800} height={120} fill="#3A4850" stroke={INK} strokeWidth={4} />
        {Array.from({length: 40}, (_, i) => <circle key={i} cx={-280 + i * 46} cy={BENCH_Y + 30} r={5} fill="#1C262C" />)}
        <rect x={-300} y={BENCH_Y + 120} width={1800} height={600} fill="#1A2329" />
        {Array.from({length: 6}, (_, i) => (
          <g key={i}>
            <rect x={-260 + i * 300} y={BENCH_Y + 150} width={270} height={300} rx={8} fill="#222D34" stroke={INK} strokeWidth={3} />
            <rect x={-150 + i * 300} y={BENCH_Y + 180} width={50} height={10} rx={4} fill="#5E6C74" />
            {Array.from({length: 5}, (_, k) => <rect key={k} x={-240 + i * 300} y={BENCH_Y + 230 + k * 36} width={230} height={8} rx={3} fill="#121A1F" />)}
          </g>
        ))}
        {/* laser head */}
        <rect x={-120} y={BEAM_Y - 110} width={370} height={200} rx={16} fill="url(#f2-box)" stroke={INK} strokeWidth={4} />
        <rect x={-90} y={BEAM_Y - 80} width={170} height={40} rx={6} fill="#26323A" />
        {[0, 1, 2].map((i) => <circle key={i} cx={120 + i * 34} cy={BEAM_Y - 60} r={9} fill={i === 0 ? '#5BF08A' : i === 1 ? (Math.sin(t * 40) > 0 ? '#C9B6FF' : '#3A3550') : '#F0B85B'} stroke={INK} strokeWidth={2.5} />)}
        <rect x={236} y={BEAM_Y - 24} width={24} height={48} rx={4} fill="#1C262C" stroke={INK} strokeWidth={3} />
        <path d={`M-120,${BEAM_Y + 60} C-180,${BEAM_Y + 60} -200,${BEAM_Y + 140} -260,${BEAM_Y + 150}`} fill="none" stroke="#1C262C" strokeWidth={14} />
        {/* amplifier module (pump glow flares as a packet passes) */}
        <rect x={420} y={BEAM_Y - 90} width={200} height={160} rx={12} fill={mix('#3E4C54', '#7E88B8', flash * 0.4)} stroke={INK} strokeWidth={4} />
        <rect x={444} y={BEAM_Y - 26} width={152} height={52} rx={6} fill="#1A1430" stroke={INK} strokeWidth={3} />
        <ellipse cx={520} cy={BEAM_Y} rx={100 + 40 * pumpL} ry={46 + 20 * pumpL} fill="url(#f2-pump)" opacity={0.35 + 0.65 * pumpL} style={{mixBlendMode: 'screen'}} />
        {[0, 1, 2, 3].map((i) => <rect key={i} x={452 + i * 38} y={BEAM_Y - 82} width={22} height={30} rx={3} fill="#5E6C74" stroke={INK} strokeWidth={2} />)}
        {/* lens pair (beam expander) */}
        {[700, 760].map((x, i) => (
          <g key={x}>
            <rect x={x - 14} y={BEAM_Y + 44} width={28} height={BENCH_Y - BEAM_Y - 44} fill={steel} stroke={INK} strokeWidth={3} />
            <ellipse cx={x} cy={BEAM_Y} rx={14} ry={i ? 58 : 44} fill={mix('#9FC3E0', '#F2EEFF', lensL)} fillOpacity={0.55 + 0.35 * lensL} stroke={INK} strokeWidth={4} />
            <ellipse cx={x - 4} cy={BEAM_Y - 16} rx={4} ry={14} fill="#FFFFFF" opacity={0.45 + 0.5 * lensL} />
          </g>
        ))}
        {/* turning mirror on its mount */}
        <rect x={MIRROR_X - 20} y={BEAM_Y + 30} width={40} height={BENCH_Y - BEAM_Y - 30} fill={steel} stroke={INK} strokeWidth={3} />
        <g transform={`translate(${MIRROR_X} ${BEAM_Y}) rotate(-45)`}>
          <rect x={-70} y={-12} width={140} height={24} rx={6} fill={steelL} stroke={INK} strokeWidth={4} />
          <rect x={-62} y={-14} width={124} height={8} rx={3} fill={mix('#CFE0EE', '#FFFFFF', mirL)} />
        </g>
        {mirL > 0.05 && <circle cx={MIRROR_X} cy={BEAM_Y} r={60 + 30 * mirL} fill="url(#f2-pk)" opacity={0.6 * mirL} style={{mixBlendMode: 'screen'}} />}
        {/* the beam: a faint continuous line once the first packet has passed, brighter packets riding it */}
        {ps.length > 0 && (
          <g style={{mixBlendMode: 'screen'}}>
            <path d={beamLine(0, Math.min(PATH_LEN, ps[0]))} fill="none" stroke="#9C84FF" strokeOpacity={0.35} strokeWidth={10} strokeLinejoin="round" />
            <path d={beamLine(0, Math.min(PATH_LEN, ps[0]))} fill="none" stroke="#D6CCFF" strokeOpacity={0.6} strokeWidth={3} strokeLinejoin="round" />
            {ps.map((s, k) => {
              const p = pathPt(s);
              const vert = s > MIRROR_X - 250;
              return (
                <g key={k}>
                  <ellipse cx={fmt(p.x)} cy={fmt(p.y)} rx={vert ? 22 : 70} ry={vert ? 70 : 22} fill="url(#f2-pk)" />
                  <ellipse cx={fmt(p.x)} cy={fmt(p.y)} rx={vert ? 5 : 26} ry={vert ? 26 : 5} fill="#FFFFFF" />
                </g>
              );
            })}
          </g>
        )}
      </g>
      {/* the storm flash through the porthole lights the room a little */}
      <rect x={0} y={0} width={1080} height={1920} fill="#B8C2FF" opacity={0.12 * flash} style={{mixBlendMode: 'screen'}} />
    </g>
  );
};

// ------------------------------------------------------------------------------------------- F3: the exit window
const LENS = {x: 520, y: 1260, rx: 330, ry: 250}; // the window seen from below-front (an ellipse)
const DIR = {x: 0.24, y: -0.97}; // the beam's screen direction (up and slightly right)

export const F3Aperture: React.FC<{t: number; flash: number}> = ({t, flash}) => {
  const tilt = ss(t, S.F3 + 0.22, S.F4 + 0.05);
  const dy = 1150 * sm5(tilt); // the frame moves up the beam
  const ox = 120 * sm5(tilt) * 0.24 / 0.97 * 4;
  const born = (k: number) => S.F3 - 0.06 + k / PULSE_HZ;
  const pk = Array.from({length: 10}, (_, k) => t - born(k)).filter((a) => a >= 0 && a < 0.5);
  const lensL = pk.reduce((a, age) => Math.max(a, Math.exp(-age / 0.05)), 0);
  const white = mix('#CDD5DA', '#F0F2FF', flash * 0.5), whiteD = mix('#6E7A84', '#A4ACD8', flash * 0.5);
  const far = (p: number) => ({x: LENS.x + DIR.x * p, y: LENS.y + DIR.y * p});
  return (
    <g>
      <defs>
        <linearGradient id="f3-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={mix('#2A3550', '#7C86C8', flash)} />
          <stop offset="1" stopColor={mix('#3A4660', '#9AA2D8', flash)} />
        </linearGradient>
        <radialGradient id="f3-lens" cx="0.42" cy="0.4">
          <stop offset="0" stopColor={mix('#4A5E8A', '#F4F0FF', lensL)} />
          <stop offset="0.55" stopColor={mix('#24304A', '#B8A6FF', lensL * 0.8)} />
          <stop offset="1" stopColor="#141A28" />
        </radialGradient>
        <radialGradient id="f3-pk">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity={1} />
          <stop offset="0.35" stopColor="#D2C4FF" stopOpacity={0.6} />
          <stop offset="1" stopColor="#8C6CFF" stopOpacity={0} />
        </radialGradient>
        <linearGradient id="f3-tube" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor={whiteD} />
          <stop offset="0.45" stopColor={white} />
          <stop offset="1" stopColor={whiteD} />
        </linearGradient>
      </defs>
      <rect x={0} y={0} width={1080} height={1920} fill="url(#f3-sky)" />
      {/* clouds overhead, lit by the storm */}
      <g transform={`translate(${fmt(-ox * 0.3)} ${fmt(dy * 0.35)})`}>
        {Array.from({length: 9}, (_, i) => (
          <ellipse key={i} cx={-100 + 160 * i + 60 * hash(i, 5)} cy={-260 + 120 * hash(i, 7) - 90 * (i % 2)} rx={240} ry={110} fill={mix('#3A4560', '#A6AEE6', flash * (0.6 + 0.4 * hash(i, 9)))} opacity={0.85} />
        ))}
      </g>
      <g transform={`translate(${fmt(-ox)} ${fmt(dy)})`}>
        {/* the beam above the window: a faint line, packets leaving */}
        <g style={{mixBlendMode: 'screen'}}>
          <path d={`M${LENS.x},${LENS.y} L${fmt(far(3200).x)},${fmt(far(3200).y)}`} stroke="#9C84FF" strokeOpacity={0.3} strokeWidth={26} strokeLinecap="round" />
          <path d={`M${LENS.x},${LENS.y} L${fmt(far(3200).x)},${fmt(far(3200).y)}`} stroke="#DCD2FF" strokeOpacity={0.5} strokeWidth={5} strokeLinecap="round" />
          {pk.map((age, k) => {
            const p = far(80 + age * 5200);
            return (
              <g key={k}>
                <ellipse cx={fmt(p.x)} cy={fmt(p.y)} rx={34} ry={120} transform={`rotate(14 ${fmt(p.x)} ${fmt(p.y)})`} fill="url(#f3-pk)" />
                <ellipse cx={fmt(p.x)} cy={fmt(p.y)} rx={7} ry={40} transform={`rotate(14 ${fmt(p.x)} ${fmt(p.y)})`} fill="#FFFFFF" />
              </g>
            );
          })}
        </g>
        {/* the telescope's dew shield and tube, from below */}
        <path d={`M${LENS.x - LENS.rx - 30},${LENS.y} L${LENS.x - LENS.rx + 10},${LENS.y + 900} L${LENS.x + LENS.rx - 70},${LENS.y + 900} L${LENS.x + LENS.rx + 30},${LENS.y} Z`} fill="url(#f3-tube)" stroke={INK} strokeWidth={5} strokeLinejoin="round" />
        {[260, 520].map((y) => <path key={y} d={`M${LENS.x - LENS.rx - 20 + y * 0.04},${LENS.y + y} Q${LENS.x},${LENS.y + y + 60} ${LENS.x + LENS.rx + 20 - y * 0.11},${LENS.y + y}`} fill="none" stroke={INK} strokeWidth={14} strokeOpacity={0.45} />)}
        <ellipse cx={LENS.x} cy={LENS.y} rx={LENS.rx + 34} ry={LENS.ry + 26} fill={mix('#5E6A74', '#A8B0DC', flash * 0.5)} stroke={INK} strokeWidth={5} />
        <ellipse cx={LENS.x} cy={LENS.y} rx={LENS.rx} ry={LENS.ry} fill="url(#f3-lens)" stroke={INK} strokeWidth={5} />
        {/* the optics inside: secondary mirror spider and reflections, which light with each pulse */}
        <ellipse cx={LENS.x} cy={LENS.y - 10} rx={86} ry={66} fill="#10151F" stroke={mix('#3A4660', '#E8E0FF', lensL)} strokeWidth={6} />
        {[-1, 1].map((k) => <line key={k} x1={LENS.x + k * 86} y1={LENS.y - 10} x2={LENS.x + k * (LENS.rx - 6)} y2={LENS.y - 10} stroke="#10151F" strokeWidth={8} />)}
        <line x1={LENS.x} y1={LENS.y - 76} x2={LENS.x} y2={LENS.y - LENS.ry + 6} stroke="#10151F" strokeWidth={8} />
        <path d={`M${LENS.x - 230},${LENS.y - 90} Q${LENS.x - 120},${LENS.y - 200} ${LENS.x + 40},${LENS.y - 214}`} fill="none" stroke="#FFFFFF" strokeOpacity={0.3 + 0.5 * lensL} strokeWidth={10} strokeLinecap="round" />
        {lensL > 0.05 && <ellipse cx={LENS.x} cy={LENS.y - 10} rx={LENS.rx * 0.75} ry={LENS.ry * 0.75} fill="url(#f3-pk)" opacity={0.75 * lensL} style={{mixBlendMode: 'screen'}} />}
        {/* rain beads on the rim and the glass, catching the light */}
        {Array.from({length: 28}, (_, i) => {
          const a = 6.28 * hash(i, 21);
          const rr = i < 16 ? 1.05 : 0.2 + 0.75 * hash(i, 23);
          const x = LENS.x + Math.cos(a) * LENS.rx * rr, y = LENS.y + Math.sin(a) * LENS.ry * rr + ((t * 40 * hash(i, 25)) % 16);
          return <circle key={i} cx={fmt(x)} cy={fmt(y)} r={4 + 6 * hash(i, 27)} fill={mix('#9FB4C8', '#FFFFFF', lensL * 0.8 + flash * 0.3)} opacity={0.7} stroke={INK} strokeOpacity={0.4} strokeWidth={1.5} />;
        })}
      </g>
      {/* rain at two depths, over everything */}
      {[{n: 26, len: 70, w: 3, sp: 2300, o: 0.4}, {n: 12, len: 160, w: 6, sp: 3400, o: 0.3}].map((L, li) => (
        <g key={li} stroke="#C8D4E2" strokeOpacity={L.o} strokeWidth={L.w} strokeLinecap="round">
          {Array.from({length: L.n}, (_, i) => {
            const x = 1080 * hash(i, 31 + li) + 30;
            const y = ((hash(i, 33 + li) * 2100 + t * L.sp) % 2100) - 120;
            return <line key={i} x1={fmt(x)} y1={fmt(y)} x2={fmt(x - L.len * 0.12)} y2={fmt(y + L.len)} />;
          })}
        </g>
      ))}
      <rect x={0} y={0} width={1080} height={1920} fill="#E2E6FF" opacity={0.18 * lensL} style={{mixBlendMode: 'screen'}} />
    </g>
  );
};
