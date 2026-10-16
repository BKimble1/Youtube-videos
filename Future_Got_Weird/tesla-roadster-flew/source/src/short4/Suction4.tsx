// Suction, simplified (final pass: three beats, about 6.3 s): the traced Roadster hangs upside down under the ramp. Air leaves the thin gap, the gap's
// pressure drops, and ordinary air pressure on the outside presses the car into the ramp. No fans are drawn (their
// layout isn't visible in any footage); the air simply leaves the gap. The gap is exaggerated slightly to read on a phone.
import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {C, F} from '../theme';
import {easeInOut, easeOut, pop} from '../lib/anim';
import {PROFILE, Roadster} from '../short3/Roadster';

const K = 1.72;          // drawing scale (source px -> screen px)
const DROOP = 10;        // source px of extra wheel drop, so the gap reads at phone size
const RAMP_Y = 640;      // ramp underside on screen
const CAR_X = 540 - ((PROFILE.xMax - PROFILE.xMin) * K) / 2;
const GAP_H = (PROFILE.wheelBottom + DROOP - PROFILE.floor) * K;   // ~34 px
const GAP_X0 = CAR_X + (800 - PROFILE.xMin) * K;                     // between the wheels
const GAP_X1 = CAR_X + (1125 - PROFILE.xMin) * K;
const ROOF_Y = RAMP_Y + (PROFILE.wheelBottom + DROOP - PROFILE.roof) * K;

export type SuctionCues = {pull: number; lower: number; surround: number; press: number; ramp: number};

const Arrow: React.FC<{x1: number; y1: number; x2: number; y2: number; w?: number; fill?: string; o?: number}> = ({x1, y1, x2, y2, w = 26, fill = C.cream, o = 1}) => {
  const dx = x2 - x1, dy = y2 - y1;
  const L = Math.hypot(dx, dy) || 1;
  const ux = dx / L, uy = dy / L, nx = -uy, ny = ux;
  const hl = w * 1.5, hw = w * 1.25;
  const bx = x2 - ux * hl, by = y2 - uy * hl;
  const d = `M ${x1 + nx * w / 2} ${y1 + ny * w / 2} L ${bx + nx * w / 2} ${by + ny * w / 2} L ${bx + nx * hw} ${by + ny * hw} L ${x2} ${y2} L ${bx - nx * hw} ${by - ny * hw} L ${bx - nx * w / 2} ${by - ny * w / 2} L ${x1 - nx * w / 2} ${y1 - ny * w / 2} Z`;
  return <path d={d} fill={fill} stroke={C.ink} strokeWidth={5} strokeLinejoin="round" opacity={o} />;
};

const Label: React.FC<{text: string; x: number; y: number; size?: number; color?: string; o?: number; s?: number}> = ({text, x, y, size = 60, color = C.cream, o = 1, s = 1}) => (
  <div style={{position: 'absolute', left: 0, width: 1080, top: y, textAlign: 'center', opacity: o, transform: `translateX(${x - 540}px) scale(${s})`}}>
    <span style={{fontFamily: F.display, fontWeight: 700, fontSize: size, color, letterSpacing: 1, WebkitTextStroke: `10px ${C.ink}`, paintOrder: 'stroke fill'}}>{text}</span>
  </div>
);

export const Suction4: React.FC<{start: number; cues: SuctionCues}> = ({start, cues}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = start + frame / fps;
  const at = (c: number) => (c - start) * fps; // cue -> local frame
  const clamp = {extrapolateLeft: 'clamp' as const, extrapolateRight: 'clamp' as const};

  // camera: one push-in on the gap for "Lower pressure there", one pull-back for "lets the surrounding air"
  const zin = interpolate(t, [cues.lower - 0.3, cues.lower + 0.2], [0, 1], {...clamp, easing: easeInOut});
  const zout = interpolate(t, [cues.surround - 0.4, cues.surround + 0.08], [0, 1], {...clamp, easing: easeInOut});
  const z = zin * (1 - zout);
  const scale = 1 + 1.25 * z;
  const fx = (GAP_X0 + GAP_X1) / 2, fy = RAMP_Y + GAP_H / 2;
  const gx = fx + (540 - fx) * z, gy = fy + (900 - fy) * z;
  const camT = `translate(${gx - scale * fx} ${gy - scale * fy}) scale(${scale})`;

  // intro: car rises into place against the ramp
  const intro = interpolate(frame, [0, 14], [0, 1], {...clamp, easing: easeOut});
  // press: outside air pushes; the car seats a few px closer
  const press = interpolate(t, [cues.press, cues.press + 0.25], [0, 1], {...clamp, easing: easeOut});
  // on "ramp" the car visibly seats against the ramp
  const seat = interpolate(t, [cues.ramp - 0.02, cues.ramp + 0.1, cues.ramp + 0.32], [0, 7, 3], clamp);
  const carY = RAMP_Y + (1 - intro) * 90 - press * 4 - seat;

  // gap air: dense at first, drained from "pull air out"
  const N = 24;
  const dots = Array.from({length: N}, (_, i) => {
    const u = (i + 0.5) / N;
    const x0 = GAP_X0 + u * (GAP_X1 - GAP_X0);
    const y0 = RAMP_Y + GAP_H * (0.3 + 0.4 * ((i * 7) % 5) / 4);
    const keep = i % 8 === 3; // a few molecules stay: low pressure, not a vacuum
    const leave = cues.pull + 0.05 + (Math.abs(u - 0.5) < 0.5 ? (0.5 - Math.abs(u - 0.5)) * 1.4 : 0);
    const p = keep ? 0 : interpolate(t, [leave, leave + 0.7], [0, 1], {...clamp, easing: (x) => x * x});
    const dir = u < 0.5 ? -1 : 1;
    const endX = dir < 0 ? GAP_X0 - 260 : GAP_X1 + 260;
    const x = x0 + (endX - x0) * p + Math.sin(frame * 0.45 + i * 1.7) * 6;
    const y = y0 + p * p * 60 + Math.cos(frame * 0.38 + i * 2.3) * Math.min(5, GAP_H * 0.15);
    return {x, y, o: 1 - interpolate(p, [0.7, 1], [0, 1], clamp)};
  });
  const pullArrows = interpolate(t, [cues.pull - 0.1, cues.pull + 0.15, cues.lower - 0.2, cues.lower + 0.05], [0, 1, 1, 0], clamp);
  const lowTint = interpolate(t, [cues.lower - 0.1, cues.lower + 0.25], [0, 1], clamp);
  const drain = interpolate(t, [cues.pull + 0.1, cues.pull + 1.1], [0, 1], clamp);

  // outside air: arrows from below pressing up on the (upside-down) car
  const outO = interpolate(t, [cues.surround - 0.1, cues.surround + 0.2], [0, 1], clamp);
  const push = interpolate(t, [cues.press - 0.05, cues.press + 0.3], [0, 1], {...clamp, easing: easeOut});
  const arrowsX = [180, 340, 540, 740, 900];
  const outDots = Array.from({length: 46}, (_, i) => {
    const ph = ((i * 53) % 230 - frame * (2.2 + push * 2.5) + 2300) % 230;
    return {x: 60 + ((i * 97) % 960) + Math.sin(frame * 0.2 + i) * 4, y: ROOF_Y + 40 + ph, r: 5, o: interpolate(ph, [0, 25, 200, 230], [0, 1, 1, 0])};
  });

  const labelPop = (c: number) => pop(frame, fps, at(c), 18);
  const hit = interpolate(t, [cues.ramp, cues.ramp + 0.08, cues.ramp + 0.35], [0, 1, 0], clamp);

  return (
    <AbsoluteFill style={{background: 'radial-gradient(ellipse 900px 1100px at 50% 45%, #22343E 0%, #101C22 60%, #0A1216 100%)'}}>
      <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
        <g transform={camT}>
          {/* the ramp (underside up top, red edge light as on the real ramp) */}
          <rect x={-200} y={RAMP_Y - 150} width={1480} height={150} fill="#A9B1B5" />
          <rect x={-200} y={RAMP_Y - 150} width={1480} height={150} fill="url(#rampShade)" />
          <defs>
            <linearGradient id="rampShade" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#ffffff" stopOpacity={0.18} />
              <stop offset="1" stopColor="#000000" stopOpacity={0.25} />
            </linearGradient>
          </defs>
          <rect x={-200} y={RAMP_Y - 8} width={1480} height={8} fill="#D8312A" />
          <line x1={-200} x2={1280} y1={RAMP_Y} y2={RAMP_Y} stroke={C.ink} strokeWidth={4} />
          {/* gap: normal air (pale) that drains away, then a low-pressure glow */}
          <rect x={GAP_X0 - 70} y={RAMP_Y} width={GAP_X1 - GAP_X0 + 140} height={GAP_H + (carY - RAMP_Y)} fill="#BFE6FF" opacity={0.42 * (1 - drain)} />
          <rect x={GAP_X0 - 70} y={RAMP_Y + 3} width={GAP_X1 - GAP_X0 + 140} height={Math.max(0, GAP_H + (carY - RAMP_Y) - 6)} fill="none" stroke="#4FA3E0" strokeWidth={6} opacity={lowTint * (0.7 + 0.3 * Math.sin(frame * 0.5))} />
          {/* outside air dots */}
          {outDots.map((d, i) => <circle key={i} cx={d.x} cy={d.y - push * 14} r={d.r} fill="#9CD3F5" opacity={0.75 * outO * d.o} />)}
          {/* the car, upside down, wheels on the ramp */}
          <Roadster x={CAR_X} y={carY} k={K} inverted droop={DROOP} />
          {/* gap air molecules */}
          {dots.map((d, i) => <circle key={i} cx={d.x} cy={d.y + (carY - RAMP_Y) * 0.5} r={6} fill="#BFE6FF" stroke={C.ink} strokeWidth={1.5} opacity={d.o * intro} />)}
          {/* air leaving the gap */}
          <g opacity={pullArrows}>
            <Arrow x1={GAP_X0 - 20} y1={RAMP_Y + GAP_H / 2} x2={GAP_X0 - 190} y2={RAMP_Y + GAP_H / 2 + 70} w={22} fill="#BFE6FF" />
            <Arrow x1={GAP_X1 + 20} y1={RAMP_Y + GAP_H / 2} x2={GAP_X1 + 190} y2={RAMP_Y + GAP_H / 2 + 70} w={22} fill="#BFE6FF" />
          </g>
          {/* pressure arrows */}
          {arrowsX.map((x, i) => {
            const pulse = Math.max(0, Math.sin(frame * 0.42 - i * 0.6)) * (1 + 0.8 * push);
            const len = 150 + push * 25 + pulse * 14;
            const y2 = ROOF_Y + 22 - push * 10 - pulse * 8 * (0.4 + push);
            return <Arrow key={i} x1={x} y1={y2 + len} x2={x} y2={y2} w={30} fill={C.saffron} o={outO * pop(frame, fps, at(cues.surround) + i * 2, 16)} />;
          })}
          {/* contact flash where the wheels press the ramp */}
          {[0, 1].map((i) => {
            const wx = CAR_X + ((i ? 1123 : 795) - PROFILE.xMin) * K;
            return <circle key={i} cx={wx} cy={RAMP_Y} r={30 + hit * 40} fill="none" stroke={C.saffron} strokeWidth={8} opacity={hit} />;
          })}
        </g>
      </svg>
      {/* labels (screen space, large) */}
      <Label text="FANS PULL AIR OUT" x={540} y={330} size={62} o={interpolate(t, [cues.pull - 0.15, cues.pull + 0.05, cues.lower - 0.35, cues.lower - 0.15], [0, 1, 1, 0], clamp)} />
      <Label text="LOW PRESSURE" x={540} y={858} size={58} color="#DDF1FF" o={interpolate(t, [cues.lower, cues.lower + 0.15, cues.surround - 0.45, cues.surround - 0.3], [0, 1, 1, 0], clamp)} s={0.9 + 0.1 * labelPop(cues.lower)} />
      <div style={{position: 'absolute', left: 0, width: 1080, top: RAMP_Y - 96, textAlign: 'center', opacity: interpolate(t, [cues.surround - 0.05, cues.surround + 0.15], [0, 1], clamp)}}>
        <span style={{fontFamily: F.display, fontWeight: 700, fontSize: 50, color: C.ink, letterSpacing: 1}}>▼ LOW PRESSURE ▼</span>
      </div>
      <Label text="SURROUNDING AIR" x={540} y={1145} size={58} color={C.saffron} o={interpolate(t, [cues.surround, cues.surround + 0.15, cues.press - 0.1, cues.press + 0.02], [0, 1, 1, 0], clamp)} />
      <Label text="PRESSES IT TO THE RAMP" x={540} y={1145} size={58} color={C.saffron} o={interpolate(t, [cues.press, cues.press + 0.12], [0, 1], clamp)} s={0.9 + 0.1 * labelPop(cues.press)} />
      {/* the one reconstruction label */}
      <div style={{position: 'absolute', top: 210, left: 0, width: 1080, textAlign: 'center'}}>
        <span style={{fontFamily: F.body, fontWeight: 800, fontSize: 34, color: C.ink, background: C.blueLight, border: `3px solid ${C.blueDeep}`, borderRadius: 22, padding: '6px 22px', letterSpacing: 1}}>SIMPLIFIED ILLUSTRATION</span>
      </div>
    </AbsoluteFill>
  );
};
