// V5 shot C1 (7.81-8.95) "But this MACHINE fired". The hook now carries the operator's press, so C1 is the machine
// itself: the laser enclosure's side wall, close, out in the storm at night, with the optics bench showing through its
// viewport. The wall is in the storm's dark; the only light on it is the machine's own (the viewport, the vents, the
// lamps and the charge column), with real falloff. It powers up on the hum (7.81: the charge column climbs, the amber
// lamp blinks, the pump light comes up behind the louvres and in the bench), takes the FIRE click (8.01: red lamp, the
// surge runs up the armoured cables) and the relay (8.07: the pump lamps strobe, light blasts out of the viewport and
// the vents onto the wet steel, the rain and the pad, the first pulses leave the head and the beam line grows out
// behind them; then the pumps tick with every pulse and the hot louvres steam in the rain). One motivated move: from
// a low, canted angle beside the power unit, a push up and in, levelling as it goes, straight into the viewport,
// following the energy in. It lands on V3's C2 opening framing exactly (Machine5_optics C2_OPEN), level, so the cut
// at 8.95 is a cut inside the machine.
//   camera  a dolly toward the viewport: wall plane at distance D (0.9 -> 1/3.2, eased in log space), the bench Delta
//           behind it, so the bezel opens past the frame faster than the bench grows (2.5D parallax); rain in front
//           and the storm sky over the roof sit at their own depths; the roll eases out with the push
import React from 'react';
import {clamp, fmt, hash} from '../dc/math';
import {sm5} from '../camera';
import {ss} from '../lib';
import {PAL} from '../v3/palette';
import {EV} from '../v3/timeline3';
import {B5} from './timeline5';
import {BenchC1, C2_OPEN, tickC1} from './Machine5_optics';
import {GlassC1, PAD_Y, PowerC1, W_C, W_OPEN, WallC1} from './Machine5_ext';

const T0 = B5.C, T1 = B5.C2;
const D0 = 0.9, D1 = 1 / 3.2;
/** the bench's depth behind the wall, and its stage-units-to-world scale (so it lands at C2's zoom at D1) */
const DELTA = 0.3;
const MU = C2_OPEN.z * (D1 + DELTA);
/** the first framing: low and left of the viewport, the power unit's charge column at the left edge, the lamps and the
 *  louvred vent at the right; the head's lamps, its aperture and the amplifier show through the glass */
const CAM0 = {x: 468, y: 1004};
/** the opening cant (deg): it levels out with the push */
const ROLL0 = -6;
export const camC1 = (t: number) => {
  // eased in and out, its peak pushed late (the push takes off with the firing, not the hum) so it settles onto C2's
  // framing only in the last few frames
  const u = sm5(Math.pow(clamp((t - T0) / (T1 - T0)), 1.45));
  const D = Math.exp(Math.log(D0) + (Math.log(D1) - Math.log(D0)) * u);
  const w = (D0 - D) / (D0 - D1); // a straight dolly line in depth
  return {D, x: CAM0.x + (W_C.x - CAM0.x) * w, y: CAM0.y + (W_C.y - CAM0.y) * w, roll: ROLL0 * (1 - u)};
};
const spike = (t: number, t0: number, tau: number) => (t >= t0 ? Math.exp(-(t - t0) / tau) : 0);
/** the power state */
export const pwC1 = (t: number): PowerC1 & {lit: number} => {
  const hum = ss(t, T0, EV.fireRelay - 0.02);
  const tick = tickC1(t);
  const flash = 1.3 * spike(t, EV.fireRelay, 0.1) + 0.25 * spike(t, EV.fireRelay + 0.05, 0.08);
  const on = t >= EV.fireRelay;
  // the charge column climbs to full on the hum, dumps into the pumps on the relay and holds there, re-topping per pulse
  const charge = !on ? 0.4 + 0.6 * ss(t, T0, EV.fireClick - 0.01) : 0.58 + 0.42 * Math.exp(-(t - EV.fireRelay) / 0.035) + 0.07 * clamp(tick);
  // the needle has some weight: it falls back more slowly than the segments
  const gauge = !on ? charge : 0.6 + 0.4 * Math.exp(-(t - EV.fireRelay) / 0.16);
  const amber = t < EV.fireClick && Math.sin((t - T0) * 2 * Math.PI * 7) > -0.3 ? 1 : 0;
  const red = t >= EV.fireClick ? 1 : 0;
  const cable = t >= EV.fireClick - 0.01 && t < EV.fireRelay + 0.03 ? clamp((t - (EV.fireClick - 0.01)) / (EV.fireRelay - EV.fireClick + 0.01)) : 0;
  // the pump lamps: a double strobe on the relay, then a pulse with every packet
  const strobe = on ? spike(t, EV.fireRelay, 0.045) + 0.7 * spike(t, EV.fireRelay + 0.034, 0.04) + 0.45 * clamp(tick) : 0;
  // the machine's steady light (what reaches the wall round the viewport): low on the hum, up once it runs
  const light = clamp(0.14 + 0.3 * hum + (on ? 0.4 : 0) + 0.06 * clamp(tick));
  // the vents: the pump modules behind the louvres, strobing with the lamps
  const vent = clamp(0.1 + 0.3 * hum + (on ? 0.42 : 0) + 0.22 * clamp(strobe) + 0.5 * clamp(flash), 0, 1.4);
  const glow = clamp(light + 0.55 * flash, 0, 1.4);
  const lit = on ? 1 : 0.3 + 0.4 * hum;
  // heat: the hot louvres steam in the rain once it runs
  const steam = ss(t, EV.fireRelay + 0.02, EV.fireRelay + 0.3);
  return {hum, charge, gauge, amber, red, flash, tick, glow, cable, lit, strobe, light, vent, steam};
};

const rr = (x0: number, y0: number, x1: number, y1: number, r: number) =>
  `M${fmt(x0 + r)},${fmt(y0)} L${fmt(x1 - r)},${fmt(y0)} Q${fmt(x1)},${fmt(y0)} ${fmt(x1)},${fmt(y0 + r)} L${fmt(x1)},${fmt(y1 - r)} Q${fmt(x1)},${fmt(y1)} ${fmt(x1 - r)},${fmt(y1)} L${fmt(x0 + r)},${fmt(y1)} Q${fmt(x0)},${fmt(y1)} ${fmt(x0)},${fmt(y1 - r)} L${fmt(x0)},${fmt(y0 + r)} Q${fmt(x0)},${fmt(y0)} ${fmt(x0 + r)},${fmt(y0)} Z`;

export const MachineC5: React.FC<{t: number}> = ({t}) => {
  const frame = Math.round(t * 30);
  const tag = `c1-${frame}`;
  const cam = camC1(t);
  const pw = pwC1(t);
  // a plane at depth d (1:1 at D = 1)
  const sc = (d: number) => (1 + d) / (cam.D + d);
  const xf = (d: number) => `translate(540 960) scale(${fmt(sc(d))}) translate(${fmt(-cam.x)} ${fmt(-cam.y)})`;
  const sw = sc(0);
  const X = (x: number) => 540 + (x - cam.x) * sw, Y = (y: number) => 960 + (y - cam.y) * sw;
  // the bench: C2's stage transform, with the parallax of its depth
  const si = MU / (cam.D + DELTA);
  const ci = {x: C2_OPEN.x + (cam.x - W_C.x) / MU, y: C2_OPEN.y + (cam.y - W_C.y) / MU};
  const benchXf = `translate(540 960) scale(${fmt(si)}) translate(${fmt(-ci.x)} ${fmt(-ci.y)})`;
  // the glass (its beads, runs and sheen) and the rain in front fade as the camera closes on the glass: over about
  // eight frames, ending as the bezel leaves the frame (nothing of it is left by the cut: C2's frame is clean)
  const g = 1 - ss(t, 8.41, 8.69);
  const rainK = 1 - ss(t, 8.36, 8.66);
  const F = clamp(pw.flash, 0, 1.3);
  return (
    <g transform={Math.abs(cam.roll) > 0.005 ? `rotate(${fmt(cam.roll)} 540 960)` : undefined}>
      <defs>
        <clipPath id={`${tag}-op`}>
          <path d={rr(X(W_OPEN.x0), Y(W_OPEN.y0), X(W_OPEN.x1), Y(W_OPEN.y1), W_OPEN.r * sw)} />
        </clipPath>
        <linearGradient id={`${tag}-sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#081220" />
          <stop offset="1" stopColor="#152637" />
        </linearGradient>
        <linearGradient id={`${tag}-pad`} gradientUnits="userSpaceOnUse" x1="0" y1={PAD_Y} x2="0" y2={PAD_Y + 500}>
          <stop offset="0" stopColor="#1C252C" />
          <stop offset="1" stopColor="#0A1014" />
        </linearGradient>
        <radialGradient id={`${tag}-refl`} gradientUnits="userSpaceOnUse" cx={W_C.x} cy={PAD_Y} r={460} gradientTransform={`translate(${W_C.x} ${PAD_Y}) scale(1 0.4) translate(${-W_C.x} ${-PAD_Y})`}>
          <stop offset="0" stopColor={PAL.laser} stopOpacity={0.55} />
          <stop offset="0.4" stopColor={PAL.laserGlow} stopOpacity={0.22} />
          <stop offset="1" stopColor={PAL.laserGlow} stopOpacity={0} />
        </radialGradient>
      </defs>
      {/* the storm over the roof (far: it barely moves; the machine's light does not reach it) */}
      <g transform={xf(4)}>
        <rect x={-900} y={-1000} width={2900} height={1300} fill={`url(#${tag}-sky)`} />
        {Array.from({length: 10}, (_, i) => (
          <ellipse key={i} cx={fmt(-400 + i * 190 + 60 * hash(i, 501))} cy={fmt(20 + 70 * hash(i, 503))} rx={fmt(150 + 60 * hash(i, 505))} ry={fmt(60 + 26 * hash(i, 507))} fill={i % 2 ? '#132233' : '#172839'} />
        ))}
      </g>
      {/* the bench through the viewport */}
      <g clipPath={`url(#${tag}-op)`}>
        <BenchC1 t={t} xf={benchXf} tag={tag} pw={{lit: pw.lit, hum: pw.hum, flash: pw.flash, strobe: pw.strobe}} />
      </g>
      <g transform={xf(0)}>
        <WallC1 tag={tag} pw={pw} t={t} />
        <GlassC1 tag={tag} g={g} t={t} glow={pw.glow} />
        {/* the wet pad in front of the skid, the machine's light smeared in it */}
        <rect x={-900} y={PAD_Y} width={2900} height={900} fill={`url(#${tag}-pad)`} />
        <rect x={-900} y={PAD_Y} width={2900} height={8} fill="#0B151C" opacity={0.6} />
        <rect x={-900} y={PAD_Y} width={2900} height={420} fill={`url(#${tag}-refl)`} opacity={fmt(clamp(0.08 + 0.4 * pw.light + 0.5 * F))} style={{mixBlendMode: 'screen'}} />
      </g>
      {/* rain in front of the wall: the streaks passing the viewport catch its light (all of them on the relay's blast) */}
      {rainK > 0.01 && (
        <g transform={xf(-0.12)} opacity={fmt(rainK)}>
          {Array.from({length: 52}, (_, i) => {
            const x = -300 + 1700 * hash(i, 601);
            const y = -200 + ((hash(i, 603) * 2300 + t * 1900) % 2300);
            const near = Math.exp(-(((x - W_C.x) / 380) ** 2 + ((y - W_C.y) / 560) ** 2)) * clamp(pw.light + 0.8 * F);
            return <line key={i} x1={fmt(x)} y1={fmt(y)} x2={fmt(x - 10)} y2={fmt(y + 64)} stroke={near > 0.15 ? PAL.packet : '#9FB2C2'} strokeOpacity={fmt(0.12 + 0.14 * hash(i, 605) + 0.6 * near)} strokeWidth={2.4} strokeLinecap="round" />;
          })}
        </g>
      )}
    </g>
  );
};
