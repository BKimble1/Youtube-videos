// V5 control room set (HOOK owner): the room the hook (A1, A2) and the loop shot (H3) play in. Copied from V3's
// shelter (v3/Machine3_shelter.tsx) and rebuilt for a dramatic medium close-up. Layers, back to front:
//   1. the window: the site through View3 (V3 art and palette) from down the slope: the tower top, the beam rising
//      past it, the storm deck; the beam's state follows the machine (H3: firing, the warm channel extended; 32.9:
//      the train stops, standby; the press: the beam ignites, a bright front racing up into the storm). The view is
//      graded a little brighter than the room (the eye is adapted to the dark room), so the storm reads.
//   2. the wall, the window frame and its rain
//   3. the instrument panel (behind her reaching hand, beside her body): the guarded FIRE control in a hazard ring,
//      the LED bar, gauge, pulse lamp, trace; it spits sparks while the machine charges (the crackle)
//   4. the operator (the V3 rig mirrored to face the window; the near hand solved onto the cap: Room5_op.tsx), lit
//      by the window (cool, from behind on her window side) and, once fired, by the beam (cyan) and the red cap
//   5. the desk in front of her (the foreground mask: it hides her from the hips down)
//   6. the console's electric surge (1.2-1.75): arcs crawling over the panel to her hand, the room light stuttering
// The x-ray frames (the crack) swap the figure for its own outline turned x-ray with the glowing skeleton inside.
import React from 'react';
import {mix, shade} from '../dc/color';
import {manJoints} from '../dc/Man';
import {Man5} from './Room5_man';
import {clamp, fmt, hash} from '../dc/math';
import {H_REST, OPERATOR} from '../cast';
import {ss} from '../lib';
import {XRayFilter} from '../art/Skeleton';
import {Skeleton5} from './Room5_skel';
import {axis3, Cam3, projector} from '../v2/p3';
import {EXIT_H} from '../world/site';
import {stream} from '../v2/shots3d';
import {View3, St} from '../v3/view3';
import {PAL} from '../v3/palette';
import {tau3} from '../v3/timeline3';
import {Beam3D} from '../v3/Scene3';
import {axisRuns, BeamGlow, HeadFlare} from '../v3/Machine3_fx';
import {PulseBloom} from '../v3/Open3_fx';
import {CH_TOP} from '../v3/Open3_end';
import {SiteExtras} from '../v3/features3';
import {ChannelGrow4} from '../v4/End4_fx';
import {RoomCam5, roomTr, winCam5} from './cams5_hook';
import {flashK, StormFlash5, T_THUNDER} from './Hook5_ext';
import {capAt, CAP_R, DESK_Y, FIRE, MIRROR, op5, PANEL, T_CHARGE, T_CRACK, T_RELAY, T_SURGE0, T_TOUCH, WIN, xrayOn} from './Room5_op';

/** the x-ray frames' look: the first on a white-violet flash, the second with the room dropped to dark violet, the
 *  last (after one normal frame) on the dark room again */
const xrayLook = (t: number): {bg: 'white' | 'dark'; k: number} => {
  const f = Math.round(t * 30);
  // (V5 fix HOOK-8: the last x-ray frame is on the dark room too, not a second white flash: one frame-wide flash,
  // more margin under the flash limit, and the on-off-on flicker still reads)
  return f === 53 ? {bg: 'white', k: 0.78} : f === 54 ? {bg: 'dark', k: 0.75} : {bg: 'dark', k: 0.55};
};

const INK = '#0B151C';

// ------------------------------------------------------------------ the machine's state (loop clock)
/** standby: the pulse train stops when the machine starts charging (32.9) and the beam drops to a faint line */
const standbyK = (tau: number) => (tau < 0 ? ss(tau, T_CHARGE + 0.05, T_CHARGE + 0.45) : tau < T_RELAY ? 1 : 0);
/** the fired beam's front (axis height): from below the window to the storm in ~0.2 s */
const FRONT_T = 0.2;
const frontH = (tau: number) => {
  const u = clamp((tau - T_RELAY) / FRONT_T);
  return EXIT_H + (1500 - EXIT_H) * (1 - (1 - u) * (1 - u));
};
/** the fired train: dense, fast packets (the hook's blaze) */
const FAST_V = 1250, FAST_GAP = 150;
const firedPulses = (tau: number) => {
  const out: number[] = [];
  const head = EXIT_H + FAST_V * (tau - T_RELAY);
  for (let k = 0; k < 40; k++) {
    const h = head - k * FAST_GAP;
    if (h < EXIT_H) break;
    if (h < 1500) out.push(h);
  }
  return out;
};
/** the beam's light on the room: a flash as it ignites, then a steady blaze with the packets' flicker */
export const beamLight = (t: number) => {
  const tau = tau3(t);
  if (tau < 0) return 0.3 * (1 - standbyK(tau));
  if (tau < T_RELAY) return 0;
  const f = tau - T_RELAY;
  return 0.5 + 0.7 * Math.exp(-f / 0.1) + 0.05 * Math.sin(tau * 60);
};
/** the surge (0..1): builds from 1.2 to the crack, gone after it */
export const surgeK = (t: number) => {
  const tau = tau3(t);
  if (tau < T_SURGE0 || tau > T_CRACK + 0.25) return 0;
  return tau < T_CRACK ? Math.pow(ss(tau, T_SURGE0, T_CRACK), 1.4) : 1 - ss(tau, T_CRACK, T_CRACK + 0.25);
};
/** the room light's stutter in the surge (1 = steady); frame-locked, so it is the same on every render */
export const stutter = (t: number) => {
  const tau = tau3(t);
  const k = surgeK(t);
  if (k <= 0 || tau > T_CRACK) return 1;
  const fr = Math.round(t * 30);
  return 1 - 0.6 * k * (hash(fr, 5101) > 0.5 ? 1 : 0.15);
};
/** charging (32.9 to the press): the machine crackles, small sparks spit from the panel's seams */
const chargeK = (tau: number) => (tau >= T_CHARGE && tau < T_TOUCH + 0.1 ? ss(tau, T_CHARGE, T_CHARGE + 0.3) : 0);

// ------------------------------------------------------------------ the window view
/** the beam's packets (as Beam3D draws them: a cyan glow and a cyan-white core along the axis), with their own
 *  opacity, so the train can fade independently of the line */
const Packets5: React.FC<{cam: Cam3; pulses: number[]; a: number; hTop: number}> = ({cam, pulses, a, hTop}) => {
  if (a <= 0.01 || !pulses.length) return null;
  const P = projector(cam);
  const f = cam.f;
  return (
    <g style={{mixBlendMode: 'screen'}} opacity={fmt(clamp(a))}>
      {pulses.map((h, i) => {
        if (h < -880 || h > hTop) return null;
        const p0 = P(axis3(Math.max(-880, h - 26))), p1 = P(axis3(h));
        if (!p0.ok || !p1.ok) return null;
        const w = clamp((f * 1.4) / p1.z, 3, 12);
        return (
          <g key={i}>
            <line x1={fmt(p0.x)} y1={fmt(p0.y)} x2={fmt(p1.x)} y2={fmt(p1.y)} stroke={PAL.laserGlow} strokeOpacity={0.45} strokeWidth={fmt(w * 2.4)} strokeLinecap="round" />
            <line x1={fmt(p0.x)} y1={fmt(p0.y)} x2={fmt(p1.x)} y2={fmt(p1.y)} stroke={PAL.packet} strokeWidth={fmt(w * 0.7)} strokeLinecap="round" />
          </g>
        );
      })}
    </g>
  );
};
/** V5 fix (HOOK-2, HOOK-3, END-5), the beam through the window on the loop clock:
 *   H3          firing: the thin cyan line, the packet stream, the extended warm channel
 *   32.9 (T_CHARGE)  the machine stops firing to charge: no new packets leave; the train already in flight climbs on
 *               and fades out (gone by frame 1001), the line drops to a dim standby (aiming) line and the warm channel
 *               cools to a trace, so the loop seam carries nothing that could pop, and frames 0-8 show a laser that is
 *               plainly in standby before she fires it
 *   the relay   it fires: a bright front races up past the tower, then a steady thin cyan line with a dense packet
 *               train and a restrained warm band (no white column: white-violet is the discharge's alone), matching
 *               the beam outside after the whip */
const WindowView5: React.FC<{t: number; rc: RoomCam5; tag: string}> = ({t, rc, tag}) => {
  const tau = tau3(t);
  const cam: Cam3 = winCam5(t, rc);
  const sb = standbyK(tau);
  const fired = tau >= T_RELAY;
  const front = fired ? frontH(tau) : 1500;
  const cut = EXIT_H - 30 + 520 * Math.max(0, tau - T_CHARGE);
  const leftK = tau < T_CHARGE ? 1 : 1 - ss(tau, T_CHARGE + 0.12, -0.12);
  const left = tau < T_RELAY && leftK > 0.01 ? stream(tau).filter((h) => h > cut) : [];
  const firedP = fired ? firedPulses(tau).filter((h) => h < front - 20) : [];
  // the prepared channel: extended in H3, cooling to a trace in standby, warming again (restrained) once fired
  const chK = tau < 0 ? 1 - 0.9 * sb : fired ? 0.1 + 0.32 * ss(tau, T_RELAY + 0.15, 1.6) : 0.1;
  const lineA = 0.92 - 0.78 * (tau < T_RELAY ? sb : 0);
  const fieldB = tau < 0 ? ss(tau, 31.88 - 33.5, 32.5 - 33.5) : 1 - ss(tau, 2.0, 2.3);
  const corona = 0.6 * fieldB * (0.5 + 0.5 * Math.abs(Math.sin(tau * 23)));
  // (the extended channel stays as long as it was: it cools to a trace and warms again, so the seam is continuous)
  const top = CH_TOP;
  const st: St = {s: -1, core: 0, flash: 0, beam: fired ? 0 : lineA, pulses: [], channel: 0.8 * chK, channelTop: top, tipCorona: corona};
  const lead = fired ? 1 - ss(tau, T_RELAY + FRONT_T, T_RELAY + FRONT_T + 0.12) : 0;
  // the ignition burst (the front's race up and a few frames after it), then the steady beam
  const burst = fired ? Math.exp(-(tau - T_RELAY) / 0.12) : 0;
  const blaze = fired ? 0.45 + 1.1 * burst : 0;
  return (
    <SiteExtras.Provider value={null}>
      <View3 cam={cam} st={st} t={t} tag={`${tag}-v`}>
        <ChannelGrow4 cam={cam} t={31.5} top={top} k={chK} wS={3.4} gain={tau < 0 ? 2.8 : 2.0} id={`${tag}-cg`} />
        {/* the standby / H3 line (View3 draws it); fired: the beam up to its front with the dense train */}
        {fired && (
          <g>
            <BlazeGlow cam={cam} h1={front} k={blaze} burst={burst} id={`${tag}-bz`} />
            <BeamGlow cam={cam} h0={EXIT_H} h1={front} k={0.7 + 0.8 * burst} wide={2.2} narrow={0.75} />
            <Beam3D cam={cam} alpha={0.95} pulses={[]} channel={0} hTop={front} id={`${tag}-bm`} />
            <HeadFlare cam={cam} h={front} k={lead} id={`${tag}-hf`} r={2.4} />
          </g>
        )}
        {!fired && <BeamGlow cam={cam} h0={EXIT_H} h1={1500} k={0.9 * (1 - sb) + 0.05 * sb} wide={2} narrow={0.7} />}
        <Packets5 cam={cam} pulses={left} a={0.92 * leftK} hTop={1500} />
        <Packets5 cam={cam} pulses={firedP} a={0.95} hTop={front} />
        <PulseBloom cam={cam} pulses={left} k={0.9 * leftK} size={1.4} id={`${tag}-pb`} />
        <PulseBloom cam={cam} pulses={firedP} k={0.75} size={1.2} id={`${tag}-pf`} />
        {tau > 1.9 && tau < 2.6 && <StormFlash5 cam={cam} t={tau} id={`${tag}-sf`} />}
      </View3>
    </SiteExtras.Provider>
  );
};

/** the fired beam's light in the window: a soft cyan bloom along it (screen-blended), strongest in the ignition burst;
 *  a white-cyan core only while the front races up (the steady beam is the thin cyan line) */
const BlazeGlow: React.FC<{cam: Cam3; h1: number; k: number; burst: number; id: string}> = ({cam, h1, k, burst, id}) => {
  if (k <= 0.01) return null;
  const runs = axisRuns(cam, EXIT_H, h1, 1, 1, 1, 30);
  if (!runs.length) return null;
  const d = runs.map((r) => r.d).join(' ');
  return (
    <g style={{mixBlendMode: 'screen'}}>
      <defs>
        <filter id={`${id}-b`} filterUnits="userSpaceOnUse" x={-200} y={-200} width={1480} height={2320}>
          <feGaussianBlur stdDeviation={16} />
        </filter>
      </defs>
      <path d={d} fill="none" stroke={PAL.laserGlow} strokeWidth={56} strokeOpacity={fmt(clamp(0.22 * k))} strokeLinecap="round" filter={`url(#${id}-b)`} />
      <path d={d} fill="none" stroke={PAL.laser} strokeWidth={8} strokeOpacity={fmt(clamp(0.3 * k))} strokeLinecap="round" />
      {burst > 0.02 && <path d={d} fill="none" stroke={PAL.packet} strokeWidth={4} strokeOpacity={fmt(clamp(0.6 * burst))} strokeLinecap="round" />}
    </g>
  );
};

// ------------------------------------------------------------------ the figure's light
/** the figure drawn again with a colour matrix through a mask (screen-blended): a directional or local light. The
 *  matrices carry no offsets, so the ink and the shadows stay dark and only the lit colours lift */
const Lit: React.FC<{children: React.ReactNode; k: number; id: string; matrix: string; mask: React.ReactNode}> = ({children, k, id, matrix, mask}) =>
  k > 0.01 ? (
    <g>
      <defs>
        <filter id={`${id}-f`} colorInterpolationFilters="sRGB">
          <feColorMatrix type="matrix" values={matrix} />
        </filter>
        <mask id={`${id}-m`}>{mask}</mask>
      </defs>
      <g mask={`url(#${id}-m)`} opacity={fmt(clamp(k))} filter={`url(#${id}-f)`} style={{mixBlendMode: 'screen'}}>
        {children}
      </g>
    </g>
  ) : null;
const COOL = '0.25 0.2 0.2 0 0  0.25 0.35 0.3 0 0  0.3 0.4 0.55 0 0  0 0 0 1 0';
const CYAN = '0.08 0.12 0.12 0 0  0.25 0.48 0.34 0 0.01  0.26 0.48 0.52 0 0.02  0 0 0 1 0';
const RED = '0.75 0.3 0.15 0 0.04  0.06 0.08 0.04 0 0  0.04 0.05 0.04 0 0  0 0 0 1 0';
const DIM = '0.74 0 0 0 0  0 0.76 0 0 0  0 0 0.84 0 0  0 0 0 1 0';

// ------------------------------------------------------------------ the panel
const Panel5: React.FC<{t: number; tag: string; press: number}> = ({t, tag, press}) => {
  const tau = tau3(t);
  const fired = tau >= T_TOUCH;
  const relT = tau - T_RELAY;
  // the LED bar: charging (from 32.9: a fill that climbs and blinks), then the sweep to full with the relay
  const charge = tau < 0 ? ss(tau, T_CHARGE, 0) : 1;
  const NL = 8;
  const leds = Array.from({length: NL}, (_, i) => {
    if (tau >= T_RELAY) return i < 7 ? 1 : ss(relT, 0.02 + (i - 7) * 0.03, 0.04 + (i - 7) * 0.03);
    if (tau < T_CHARGE) return i < 3 ? 1 : 0;
    const n = 3 + Math.floor(4 * charge);
    return i < n || (i === n && Math.sin(tau * 40) > 0) ? 1 : 0;
  });
  const gauge = tau >= T_RELAY ? -60 + 118 * ss(relT, 0, 0.3) + 4 * Math.sin(tau * 17) * ss(relT, 0.2, 0.5) : tau < T_CHARGE ? 34 : 34 - 60 * ss(tau, T_CHARGE, T_CHARGE + 0.25) + 20 * charge;
  // the cap: a slow standby pulse; charging, it pulses faster; fired, it is lit
  const fireLit = fired ? ss(tau, T_TOUCH, T_TOUCH + 0.04) : 0.18 + (tau >= T_CHARGE ? 0.22 * (0.5 + 0.5 * Math.sin(tau * 16)) : 0.08 * (0.5 + 0.5 * Math.sin(tau * 5)));
  const strobe = tau >= T_RELAY ? ((((tau - T_RELAY) * 9) % 1) < 0.5 ? 1 : 0.25) : 0;
  const c = capAt(FIRE, press);
  const s = c.r / CAP_R;
  // the hazard ring: alternate yellow / black wedges in an annulus
  const R0 = 58, R1 = 76;
  const wedges = Array.from({length: 16}, (_, i) => {
    const a0 = ((i / 16) * 360 + 8) * (Math.PI / 180), a1 = (((i + 0.5) / 16) * 360 + 8) * (Math.PI / 180);
    const p = (r: number, a: number) => `${fmt(FIRE.x + Math.cos(a) * r)},${fmt(FIRE.y + Math.sin(a) * r)}`;
    return `M${p(R0, a0)} L${p(R1, a0)} A${R1},${R1} 0 0,1 ${p(R1, a1)} L${p(R0, a1)} A${R0},${R0} 0 0,0 ${p(R0, a0)} Z`;
  });
  // the clear flip cover, raised on its hinge above the ring (seen from the front: a tall, thin lid)
  const gx0 = FIRE.x - 60, gx1 = FIRE.x + 60, gy1 = FIRE.y - R1 - 6, gy0 = gy1 - 44;
  return (
    <g>
      <defs>
        <linearGradient id={`${tag}-panel`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#36444C" />
          <stop offset="1" stopColor="#1B252A" />
        </linearGradient>
        <radialGradient id={`${tag}-cap`} cx="0.42" cy="0.38">
          <stop offset="0" stopColor={mix('#A8281E', '#FF9A80', 0.2 + 0.8 * fireLit)} />
          <stop offset="0.7" stopColor={mix('#7A1812', '#E8342A', fireLit)} />
          <stop offset="1" stopColor={shade('#8E1E18', 0.35 - 0.2 * fireLit)} />
        </radialGradient>
        <radialGradient id={`${tag}-glow`}>
          <stop offset="0" stopColor="#FF5A44" stopOpacity={0.6} />
          <stop offset="1" stopColor="#FF2A20" stopOpacity={0} />
        </radialGradient>
        <linearGradient id={`${tag}-lid`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFD8D0" stopOpacity={0.45} />
          <stop offset="1" stopColor="#E86A58" stopOpacity={0.22} />
        </linearGradient>
      </defs>
      <path d={`M${PANEL.x0},${PANEL.y0 + 18} L${PANEL.x1},${PANEL.y0} L${PANEL.x1},${PANEL.y1} L${PANEL.x0 - 14},${PANEL.y1} Z`} fill={`url(#${tag}-panel)`} stroke={INK} strokeWidth={4} strokeLinejoin="round" />
      <path d={`M${PANEL.x0},${PANEL.y0 + 18} L${PANEL.x1},${PANEL.y0} L${PANEL.x1},${PANEL.y0 + 14} L${PANEL.x0},${PANEL.y0 + 32} Z`} fill="#6E7E86" />
      {/* panel seams and screws */}
      <path d={`M${PANEL.x0 + 6},1196 L${PANEL.x1},1188`} stroke="#121A1F" strokeWidth={3} opacity={0.7} />
      {[[624, 962], [1070, 952], [622, 1320], [1070, 1320]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r={5} fill="#5A6870" stroke={INK} strokeWidth={2} />)}
      {/* the "armed" lamp (amber) and the LED bar */}
      <circle cx={646} cy={975} r={13} fill="#FFB43A" stroke={INK} strokeWidth={3} />
      <circle cx={646} cy={975} r={26} fill="#FFB43A" opacity={0.2} />
      {leds.map((v, i) => {
        const col = i < 5 ? '#5BF08A' : i < 7 ? '#F0B85B' : '#FF5A48';
        return (
          <g key={i}>
            <rect x={676 + i * 28} y={960} width={20} height={30} rx={5} fill={v > 0.5 ? col : '#1E2C26'} stroke={INK} strokeWidth={2.5} />
            {v > 0.5 && <rect x={670 + i * 28} y={954} width={32} height={42} rx={8} fill={col} opacity={0.22} />}
          </g>
        );
      })}
      {/* the FIRE control: hazard ring, socket, the cap (it goes in with the fingertip) */}
      <circle cx={FIRE.x} cy={FIRE.y} r={160} fill={`url(#${tag}-glow)`} opacity={fmt(clamp(0.25 + 0.75 * fireLit))} />
      <circle cx={FIRE.x} cy={FIRE.y} r={R1 + 5} fill="#14191C" stroke={INK} strokeWidth={4} />
      <circle cx={FIRE.x} cy={FIRE.y} r={R1} fill="#E8B51E" />
      {wedges.map((d, i) => <path key={i} d={d} fill="#1A1A18" />)}
      <circle cx={FIRE.x} cy={FIRE.y} r={R1} fill="none" stroke={INK} strokeWidth={3} />
      <circle cx={FIRE.x} cy={FIRE.y} r={R0 - 2} fill="#0A1014" stroke={INK} strokeWidth={3} />
      <circle cx={fmt(c.x)} cy={fmt(c.y)} r={fmt(c.r)} fill={`url(#${tag}-cap)`} stroke={INK} strokeWidth={4} />
      {press > 0.01 && <circle cx={fmt(c.x)} cy={fmt(c.y)} r={fmt(c.r - 6)} fill="none" stroke="#000" strokeOpacity={fmt(0.4 * press)} strokeWidth={8} />}
      <ellipse cx={fmt(c.x - 14 * s)} cy={fmt(c.y - 16 * s)} rx={fmt(16 * s)} ry={fmt(8 * s)} fill="#FFFFFF" opacity={fmt(0.4 - 0.22 * press)} />
      {/* the flip cover, raised: hinge bar on the ring's top, the clear lid standing above it */}
      <path d={`M${gx0 + 6},${gy1} L${gx0 + 14},${gy0} Q${FIRE.x},${gy0 - 10} ${gx1 - 14},${gy0} L${gx1 - 6},${gy1} Z`} fill={`url(#${tag}-lid)`} stroke={INK} strokeWidth={3} strokeLinejoin="round" />
      <path d={`M${gx0 + 22},${gy0 + 10} Q${FIRE.x - 10},${gy0 + 2} ${FIRE.x + 18},${gy0 + 6}`} fill="none" stroke="#FFFFFF" strokeOpacity={0.55} strokeWidth={4} strokeLinecap="round" />
      <rect x={gx0} y={gy1 - 2} width={gx1 - gx0} height={11} rx={4} fill="#4A545A" stroke={INK} strokeWidth={2.5} />
      {[gx0 + 10, gx1 - 10].map((x) => <circle key={x} cx={x} cy={gy1 + 3} r={4} fill="#9AA6AC" stroke={INK} strokeWidth={1.5} />)}
      {/* pulse lamp, toggles, gauge, trace */}
      <circle cx={1040} cy={975} r={16} fill={strobe > 0.5 ? PAL.laser : '#24323A'} stroke={INK} strokeWidth={3} />
      {strobe > 0.5 && <circle cx={1040} cy={975} r={36} fill={PAL.laser} opacity={0.3} />}
      {[0, 1, 2].map((i) => (
        <g key={i}>
          <rect x={640 + i * 44} y={1228} width={28} height={52} rx={6} fill="#AEB8BF" stroke={INK} strokeWidth={3} />
          <rect x={645 + i * 44} y={i === 1 ? 1234 : 1254} width={18} height={20} rx={4} fill={i === 1 ? '#5BF08A' : '#4A565C'} />
        </g>
      ))}
      <circle cx={1010} cy={1100} r={48} fill="#E2E6E8" stroke={INK} strokeWidth={4} />
      {[-60, -30, 0, 30, 60].map((a) => {
        const A = ((a - 90) * Math.PI) / 180;
        return <line key={a} x1={fmt(1010 + Math.cos(A) * 38)} y1={fmt(1100 + Math.sin(A) * 38)} x2={fmt(1010 + Math.cos(A) * 46)} y2={fmt(1100 + Math.sin(A) * 46)} stroke={INK} strokeWidth={3} />;
      })}
      <line x1={1010} y1={1100} x2={fmt(1010 + Math.cos(((gauge - 90) * Math.PI) / 180) * 36)} y2={fmt(1100 + Math.sin(((gauge - 90) * Math.PI) / 180) * 36)} stroke="#D23B2E" strokeWidth={5} strokeLinecap="round" />
      <circle cx={1010} cy={1100} r={7} fill={INK} />
      <rect x={904} y={1222} width={176} height={104} rx={10} fill="#0E1A20" stroke={INK} strokeWidth={4} />
      <path d={Array.from({length: 18}, (_, i) => `${i ? 'L' : 'M'}${fmt(914 + i * 8.9)},${fmt(1284 - 38 * (tau >= T_RELAY ? 1 : 0.15 + 0.3 * charge) * Math.abs(Math.sin(i * 1.3 + tau * 12)) * (i % 3 === 0 ? 1 : 0.35) - 5 * Math.sin(i * 0.5 + tau * 4))}`).join(' ')} fill="none" stroke="#5BF08A" strokeWidth={3} />
    </g>
  );
};

// ------------------------------------------------------------------ sparks and arcs
type Pt = {x: number; y: number};
const jag = (a: Pt, b: Pt, n: number, amp: number, seed: number) => {
  const pts: Pt[] = [a];
  const dx = b.x - a.x, dy = b.y - a.y, L = Math.hypot(dx, dy) || 1;
  const nx = -dy / L, ny = dx / L;
  for (let i = 1; i < n; i++) {
    const u = i / n;
    const o = amp * L * (hash(seed * 31 + i, 5203) - 0.5) * Math.sin(Math.PI * u) * 1.6;
    pts.push({x: a.x + dx * u + nx * o, y: a.y + dy * u + ny * o});
  }
  pts.push(b);
  return `M${pts.map((p) => `${fmt(p.x)},${fmt(p.y)}`).join(' L')}`;
};
/** the surge: arcs jump between the panel's metal round the control and to her fingertip and wrist (more and longer
 *  as it builds); a fresh set every frame (frame-locked hashes, so a render is repeatable) */
const Arcs5: React.FC<{t: number; k: number; tag: string; hand: Pt; wrist: Pt}> = ({t, k, tag, hand, wrist}) => {
  if (k <= 0.02) return null;
  const fr = Math.round(t * 30);
  const anchors: Pt[] = [{x: FIRE.x - 84, y: FIRE.y - 10}, {x: FIRE.x + 82, y: FIRE.y + 14}, {x: FIRE.x + 8, y: FIRE.y + 84}, {x: 700, y: 994}, {x: 850, y: 994}, {x: 650, y: 1206}, {x: 960, y: 1100}, {x: FIRE.x - 50, y: FIRE.y - 128}];
  const n = 2 + Math.round(5 * k);
  const arcs: {d: string; w: number}[] = [];
  for (let i = 0; i < n; i++) {
    const h = hash(fr * 13 + i, 5207);
    const a = anchors[Math.floor(hash(fr * 17 + i, 5209) * anchors.length)];
    const b = i % 3 === 0 ? hand : i % 3 === 1 ? wrist : anchors[Math.floor(h * anchors.length)];
    if (Math.hypot(a.x - b.x, a.y - b.y) < 30) continue;
    arcs.push({d: jag(a, b, 7, 0.18, fr * 7 + i), w: 0.7 + 0.6 * hash(fr * 19 + i, 5211)});
  }
  return (
    <g style={{mixBlendMode: 'screen'}} opacity={fmt(clamp(0.45 + 0.6 * k))}>
      <defs>
        <filter id={`${tag}-ab`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation={7} />
        </filter>
      </defs>
      <g filter={`url(#${tag}-ab)`}>
        {arcs.map((a, i) => <path key={`h${i}`} d={a.d} fill="none" stroke={PAL.halo} strokeWidth={fmt(16 * a.w)} strokeLinejoin="round" strokeLinecap="round" />)}
      </g>
      {arcs.map((a, i) => <path key={`m${i}`} d={a.d} fill="none" stroke={PAL.mid} strokeWidth={fmt(6 * a.w)} strokeLinejoin="round" strokeLinecap="round" />)}
      {arcs.map((a, i) => <path key={`c${i}`} d={a.d} fill="none" stroke="#FFFFFF" strokeWidth={fmt(2.4 * a.w)} strokeLinejoin="round" strokeLinecap="round" />)}
      <circle cx={fmt(hand.x)} cy={fmt(hand.y)} r={fmt(34 + 30 * k)} fill={PAL.mid} opacity={fmt(0.25 * k)} />
    </g>
  );
};
/** sparks spitting from the panel's seams while the machine charges (the crackle) and through the surge: real
 *  particles (each launched at a fixed time with its own velocity, falling under gravity, drawn as a short motion
 *  streak), so they fly in arcs from frame to frame instead of flashing at random */
const SPARK_SRC: Pt[] = [{x: FIRE.x + 74, y: FIRE.y - 36}, {x: 940, y: 1190}, {x: FIRE.x + 40, y: FIRE.y + 78}];
const SPARKS = (() => {
  const out: {t0: number; o: Pt; vx: number; vy: number; life: number}[] = [];
  for (let k = 0; k < 260; k++) {
    const t0 = T_CHARGE - 0.05 + k * 0.012 + 0.008 * hash(k, 5401);
    if (t0 > T_CRACK + 0.1) break;
    // charging (to the press): one emitter in four bursts; the surge: all three, often
    const surge = t0 > T_SURGE0;
    const burst = surge ? hash(Math.floor(k / 3), 5403) < 0.75 : hash(Math.floor(k / 5), 5405) < 0.35 && t0 < T_TOUCH + 0.05;
    if (!burst) continue;
    const o = SPARK_SRC[surge ? k % 3 : 0];
    const a = (-150 + 120 * hash(k, 5407)) * (Math.PI / 180);
    const v = 260 + 380 * hash(k, 5409);
    out.push({t0, o, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 0.18 + 0.16 * hash(k, 5411)});
  }
  return out;
})();
const Sparks5: React.FC<{tau: number}> = ({tau}) => {
  const segs: string[] = [];
  const heads: Pt[] = [];
  const g = 1900;
  for (const sp of SPARKS) {
    const u = tau - sp.t0;
    if (u < 0 || u > sp.life) continue;
    const at = (w: number) => ({x: sp.o.x + sp.vx * w, y: sp.o.y + sp.vy * w + 0.5 * g * w * w});
    const p1 = at(u), p0 = at(Math.max(0, u - 0.03));
    segs.push(`M${fmt(p0.x)},${fmt(p0.y)} L${fmt(p1.x)},${fmt(p1.y)}`);
    heads.push(p1);
  }
  if (!segs.length) return null;
  return (
    <g style={{mixBlendMode: 'screen'}}>
      <path d={segs.join(' ')} stroke="#FFB45A" strokeWidth={7} strokeLinecap="round" opacity={0.35} fill="none" />
      <path d={segs.join(' ')} stroke="#FFF1C8" strokeWidth={2.6} strokeLinecap="round" fill="none" />
      {heads.map((h, i) => <circle key={i} cx={fmt(h.x)} cy={fmt(h.y)} r={3} fill="#FFFFFF" />)}
    </g>
  );
};
/** the press: a ring of light and sparks off the cap's rim at contact (a few frames). V5 fix (HOOK-5): the ring is
 *  the cap's rim lighting up, drawn on the panel behind her hand (no ghost circle over the hand); only the sparks
 *  fly in front */
const Impact5: React.FC<{t: number; part: 'ring' | 'sparks'}> = ({t, part}) => {
  const tau = tau3(t);
  const u = (tau - T_TOUCH) / 0.22;
  if (u < 0 || u > 1) return null;
  const r = 60 + 140 * (1 - Math.pow(1 - u, 2));
  const sparks = Array.from({length: 10}, (_, i) => {
    const a = (-160 + i * 32 + 14 * (hash(i, 5301) - 0.5)) * (Math.PI / 180);
    const d0 = 64 + 130 * u * (0.7 + 0.5 * hash(i, 5303));
    const L = 30 * (1 - u) + 4;
    return `M${fmt(FIRE.x + Math.cos(a) * d0)},${fmt(FIRE.y + Math.sin(a) * d0 + 60 * u * u)} l${fmt(Math.cos(a) * L)},${fmt(Math.sin(a) * L + 6)}`;
  });
  return part === 'ring' ? (
    <g style={{mixBlendMode: 'screen'}}>
      <circle cx={FIRE.x} cy={FIRE.y} r={fmt(r)} fill="none" stroke="#FFD2B8" strokeOpacity={fmt(0.45 * (1 - u) * (1 - u))} strokeWidth={fmt(9 * (1 - u) + 2)} />
      <circle cx={FIRE.x} cy={FIRE.y} r={fmt(r * 0.75)} fill="#FF6A50" opacity={fmt(0.3 * (1 - u))} />
    </g>
  ) : (
    <g style={{mixBlendMode: 'screen'}}>
      <path d={sparks.join(' ')} stroke="#FFE6A0" strokeWidth={4} strokeLinecap="round" opacity={fmt(1 - u)} fill="none" />
    </g>
  );
};

// ------------------------------------------------------------------ the room
export const Room5: React.FC<{t: number; rc: RoomCam5; tag: string}> = ({t, rc, tag}) => {
  const tau = tau3(t);
  const op = op5(t);
  const tr = roomTr(rc);
  const bl = beamLight(t);
  const sk = surgeK(t);
  const stt = stutter(t);
  const xr = xrayOn(t) ? xrayLook(t) : null;
  const fireLit = tau >= T_TOUCH ? ss(tau, T_TOUCH, T_TOUCH + 0.04) : 0;
  const ign = tau >= T_RELAY ? Math.exp(-(tau - T_RELAY) / 0.08) * ss(tau, T_RELAY, T_RELAY + 0.03) : 0;
  // the thunder flash outside (2.02): a cold flicker on the glass and on her
  const thk = tau > 1.9 && tau < 2.6 ? flashK(tau, T_THUNDER) : 0;
  const wall = '#132228';
  // her fingertip and wrist on stage (the arcs reach them)
  const capC = capAt(FIRE, op.press);
  const jw = manJoints(op.pose).L.W;
  const handPt = {x: capC.x - 30, y: capC.y - 6};
  const wristPt = {x: 2 * MIRROR - jw.x, y: jw.y};
  // the far arm hangs behind her body and the desk (not drawn); the near sleeve runs clean to a cuff at the wrist,
  // and the reaching arm shades the jacket it crosses
  const man = <Man5 id={`${tag}-man`} pose={op.pose} expr={op.expr} lHand={op.hand} rHand={H_REST} outfit={OPERATOR} farArm={false} seamSleeve nearShadow={0.34} />;
  const fig = <g transform={`translate(${2 * MIRROR} 0) scale(-1 1)`}>{man}</g>;
  const full = <rect x={-600} y={-600} width={2300} height={3000} fill="#FFF" />;
  return (
    <g>
      <defs>
        <clipPath id={`${tag}-win`}>
          <rect x={WIN.x0} y={WIN.y0} width={WIN.x1 - WIN.x0} height={WIN.y1 - WIN.y0} transform={tr} />
        </clipPath>
        <linearGradient id={`${tag}-desk`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#47555C" />
          <stop offset="0.1" stopColor="#28343A" />
          <stop offset="1" stopColor="#0D1418" />
        </linearGradient>
        {/* her window side (screen-right, the front of her face and her reaching arm) */}
        <linearGradient id={`${tag}-lg`} gradientUnits="userSpaceOnUse" x1={360} y1={0} x2={560} y2={0}>
          <stop offset="0" stopColor="#000" />
          <stop offset="0.5" stopColor="#555" />
          <stop offset="1" stopColor="#FFF" />
        </linearGradient>
        <radialGradient id={`${tag}-rg`} gradientUnits="userSpaceOnUse" cx={FIRE.x - 60} cy={FIRE.y + 10} r={420}>
          <stop offset="0" stopColor="#FFF" />
          <stop offset="0.45" stopColor="#777" />
          <stop offset="1" stopColor="#000" />
        </radialGradient>
        <radialGradient id={`${tag}-wl`} gradientUnits="userSpaceOnUse" cx={820} cy={360} r={1100}>
          <stop offset="0" stopColor="#BFF4FF" stopOpacity={0.6} />
          <stop offset="1" stopColor="#5CC6E0" stopOpacity={0} />
        </radialGradient>
        <radialGradient id={`${tag}-vg`} gradientUnits="userSpaceOnUse" cx={600} cy={760} r={1250}>
          <stop offset="0.5" stopColor="#000" stopOpacity={0} />
          <stop offset="1" stopColor="#000" stopOpacity={0.55} />
        </radialGradient>
        {/* the window view graded up a little (the eye is adapted to the dark room) */}
        <filter id={`${tag}-wg`} colorInterpolationFilters="sRGB">
          <feComponentTransfer>
            <feFuncR type="linear" slope={1.28} intercept={0.01} />
            <feFuncG type="linear" slope={1.3} intercept={0.012} />
            <feFuncB type="linear" slope={1.3} intercept={0.016} />
          </feComponentTransfer>
        </filter>
        <XRayFilter id={`${tag}-xr`} />
        <filter id={`${tag}-skg`} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation={9} />
          <feColorMatrix type="matrix" values="0.7 0 0 0 0.25  0 0.7 0 0 0.2  0 0 0.8 0 0.3  0 0 0 1.6 0" />
        </filter>
        {/* the electric glow round her outline (the silhouette blurred, violet) */}
        <filter id={`${tag}-og`} x="-20%" y="-20%" width="140%" height="140%" colorInterpolationFilters="sRGB">
          <feColorMatrix type="matrix" values="0 0 0 0 0.62  0 0 0 0 0.6  0 0 0 0 1  0 0 0 1 0" />
          <feGaussianBlur stdDeviation={18} />
          <feComponentTransfer>
            <feFuncA type="linear" slope={2.4} />
          </feComponentTransfer>
        </filter>
      </defs>
      <g clipPath={`url(#${tag}-win)`} filter={`url(#${tag}-wg)`}>
        <g transform={`rotate(${fmt(rc.roll)} 540 960)`}>
          <WindowView5 t={t} rc={rc} tag={tag} />
        </g>
        {/* the ignition: the glass floods with the beam's light for a few frames */}
        {ign > 0.01 && <rect x={0} y={0} width={1080} height={1920} fill="#C8FBFF" opacity={fmt(0.55 * ign)} style={{mixBlendMode: 'screen'}} />}
        {thk > 0.01 && <rect x={0} y={0} width={1080} height={1920} fill="#B8BEFF" opacity={fmt(0.22 * thk)} style={{mixBlendMode: 'screen'}} />}
      </g>
      <g transform={tr}>
        {/* rain running down the glass */}
        {Array.from({length: 18}, (_, i) => {
          const x = WIN.x0 + 24 + i * 38 + 8 * Math.sin(i * 7);
          const y = WIN.y0 + ((i * 137 + (tau + 40) * 150) % (WIN.y1 - WIN.y0));
          return <path key={i} d={`M${fmt(x)},${fmt(y)} q3,30 -1,62`} stroke="#B8C8D8" strokeOpacity={0.28} strokeWidth={3} fill="none" strokeLinecap="round" />;
        })}
        {/* walls, window frame and transom */}
        <path d={`M-600,-600 L1700,-600 L1700,${WIN.y0} L${WIN.x0},${WIN.y0} L${WIN.x0},${WIN.y1} L1700,${WIN.y1} L1700,2400 L-600,2400 Z`} fill={wall} />
        {[180, 360].map((x) => <line key={x} x1={x} y1={-600} x2={x} y2={2400} stroke="#0A1418" strokeOpacity={0.5} strokeWidth={3} />)}
        {/* a conduit down the wall beside the window */}
        <rect x={WIN.x0 - 96} y={-600} width={22} height={1600} fill="#20323A" stroke={INK} strokeWidth={3} />
        <rect x={WIN.x0 - 26} y={WIN.y0 - 26} width={WIN.x1 - WIN.x0 + 52} height={WIN.y1 - WIN.y0 + 52} fill="none" stroke="#26363C" strokeWidth={40} />
        <rect x={WIN.x0 - 6} y={WIN.y0 - 6} width={WIN.x1 - WIN.x0 + 12} height={WIN.y1 - WIN.y0 + 12} fill="none" stroke={INK} strokeWidth={4} />
        <rect x={WIN.x0 - 46} y={WIN.y0 - 46} width={WIN.x1 - WIN.x0 + 92} height={WIN.y1 - WIN.y0 + 92} fill="none" stroke={INK} strokeWidth={3} />
        <line x1={WIN.x0} y1={WIN.y0 + 250} x2={WIN.x1} y2={WIN.y0 + 250} stroke="#26363C" strokeWidth={18} />
        <line x1={WIN.x0} y1={WIN.y0 + 241} x2={WIN.x1} y2={WIN.y0 + 241} stroke={INK} strokeWidth={2.5} opacity={0.8} />
        <line x1={WIN.x0} y1={WIN.y0 + 259} x2={WIN.x1} y2={WIN.y0 + 259} stroke={INK} strokeWidth={2.5} opacity={0.8} />
        {/* the window's cold light along the frame's inner edge */}
        <rect x={WIN.x0 - 8} y={WIN.y0 - 8} width={WIN.x1 - WIN.x0 + 16} height={WIN.y1 - WIN.y0 + 16} fill="none" stroke="#7FD8E8" strokeOpacity={fmt(0.08 + 0.4 * bl)} strokeWidth={6} />
        {/* the sill */}
        <path d={`M${WIN.x0 - 50},${WIN.y1 + 6} L${WIN.x1 + 60},${WIN.y1 + 6} L${WIN.x1 + 60},${WIN.y1 + 30} L${WIN.x0 - 60},${WIN.y1 + 30} Z`} fill="#34444C" stroke={INK} strokeWidth={3} />
        <path d={`M${WIN.x0 - 50},${WIN.y1 + 6} L${WIN.x1 + 60},${WIN.y1 + 6}`} stroke="#8EE6F0" strokeOpacity={fmt(0.1 + 0.5 * bl)} strokeWidth={4} />
        <Panel5 t={t} tag={`${tag}-p`} press={op.press} />
        <Impact5 t={t} part="ring" />
        {/* the operator: lit by the window (cool), the fired beam (cyan) and the lit cap below her face (red) */}
        {xr ? (
          <g>
            {/* the crack's flash on everything behind her (white-violet, or the room dropping to dark violet), then
                her own outline turned x-ray over it, an electric glow round it, the skeleton glowing inside */}
            {xr.bg === 'white' ? (
              <rect x={-600} y={-600} width={2300} height={3000} fill="#E6E2FF" opacity={fmt(xr.k)} style={{mixBlendMode: 'screen'}} />
            ) : (
              <rect x={-600} y={-600} width={2300} height={3000} fill="#1A1240" opacity={fmt(xr.k)} style={{mixBlendMode: 'multiply'}} />
            )}
            <g filter={`url(#${tag}-og)`} opacity={xr.bg === 'white' ? 0.7 : 0.95} style={{mixBlendMode: 'screen'}}>
              {fig}
            </g>
            <g filter={`url(#${tag}-xr)`}>{fig}</g>
            <g transform={`translate(${2 * MIRROR} 0) scale(-1 1)`}>
              <g filter={`url(#${tag}-skg)`} style={{mixBlendMode: 'screen'}}>
                <Skeleton5 pose={op.pose} spread={op.hand.spread} curl={op.hand.curl} />
              </g>
              <Skeleton5 pose={op.pose} spread={op.hand.spread} curl={op.hand.curl} />
            </g>
          </g>
        ) : (
          <g>
            {/* the room is dim: the figure is drawn a step darker, then lit by the lights that reach her */}
            <defs>
              <filter id={`${tag}-dim`} colorInterpolationFilters="sRGB">
                <feColorMatrix type="matrix" values={DIM} />
              </filter>
            </defs>
            <g filter={`url(#${tag}-dim)`}>{fig}</g>
            <Lit k={0.7 + 0.6 * thk} id={`${tag}-lc`} matrix={COOL} mask={<rect x={-600} y={-600} width={2300} height={3000} fill={`url(#${tag}-lg)`} />}>
              {fig}
            </Lit>
            <Lit k={0.9 * bl} id={`${tag}-lb`} matrix={CYAN} mask={<rect x={-600} y={-600} width={2300} height={3000} fill={`url(#${tag}-lg)`} />}>
              {fig}
            </Lit>
            <Lit k={0.55 * fireLit + 0.25 * (1 - fireLit) * clamp(chargeK(tau) * 2)} id={`${tag}-lr`} matrix={RED} mask={<rect x={-600} y={-600} width={2300} height={3000} fill={`url(#${tag}-rg)`} />}>
              {fig}
            </Lit>
          </g>
        )}
        <Impact5 t={t} part="sparks" />
        <Sparks5 tau={tau} />
        <Arcs5 t={t} k={sk} tag={`${tag}-ar`} hand={handPt} wrist={wristPt} />
        {/* the desk in front of her */}
        <path d={`M-600,${DESK_Y} L1700,${DESK_Y - 22} L1700,2400 L-600,2400 Z`} fill={`url(#${tag}-desk)`} stroke={INK} strokeWidth={4} />
        <path d={`M-600,${DESK_Y} L1700,${DESK_Y - 22} L1700,${DESK_Y + 8} L-600,${DESK_Y + 30} Z`} fill="#62727A" />
        <path d={`M-600,${DESK_Y + 2} L1700,${DESK_Y - 20}`} stroke="#9FE6F0" strokeOpacity={fmt(0.06 + 0.3 * bl)} strokeWidth={3} />
        {xr && (
          <path d={`M-600,${DESK_Y} L1700,${DESK_Y - 22} L1700,2400 L-600,2400 Z`} fill={xr.bg === 'white' ? '#E6E2FF' : '#1A1240'} opacity={fmt(xr.k)} style={{mixBlendMode: xr.bg === 'white' ? 'screen' : 'multiply'}} />
        )}
      </g>
      {/* the beam's light through the window on the room, the room light's stutter, a soft vignette */}
      <rect x={0} y={0} width={1080} height={1920} fill={`url(#${tag}-wl)`} opacity={fmt(0.06 + 0.3 * bl)} style={{mixBlendMode: 'screen'}} transform={`rotate(${fmt(rc.roll)} 540 960)`} />
      {stt < 0.999 && <rect x={0} y={0} width={1080} height={1920} fill="#04080C" opacity={fmt(0.5 * (1 - stt))} />}
      <rect x={0} y={0} width={1080} height={1920} fill={`url(#${tag}-vg)`} />
    </g>
  );
};
