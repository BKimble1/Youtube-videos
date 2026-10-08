import React from 'react';
import {C, FPS, OUTLINE} from '../../theme';

/**
 * DeliveryBot: an original small wheeled delivery robot for act 5 (illustrative application, never a product).
 *
 * A squat rounded saffron box (~0.6 m to the top of its cargo lid) on spoked wheels, a teal cargo lid, a coral front
 * bumper and tail light, and a short cream mast carrying a small teal sensor head with an emitter window on its front.
 * Its face is two plain dot eyes on a cream front panel (neutral / cautious squint / pleased arcs). Deliberately not
 * the channel mascot: no speech-bubble head, no antenna, no disk; the face lives on the body, the head is a sensor.
 *
 * The side rig is a billboard drawn in a gentle three-quarter view facing +x (we see its right flank, its wheels, and
 * its front panel turned slightly toward us), like the upright Character rigs. Ground contact point (the footprint
 * centre) is (0, 0); 250 design units = 1 metre at scale 1 (BOT_UNITS_PER_M). `flip` faces it the other way.
 *
 * Motion inputs are plain numbers so a scene drives them from the frame:
 *  - `travelled` (m): distance rolled; the wheels turn travelled / r and the body has a faint road buzz.
 *  - `speed` (m/s, optional; botDrive().speed): above ~1.5 m/s at 30 fps the spokes would strobe backwards, so they
 *    fade to the hub.
 *  - `brake`: body pitch about the front axle; 1 = full nose-down braking dip (6 deg), negative = rock back on the
 *    rear axle (use for the settle overshoot or a wind-up).
 *  - `eyes`: 'neutral' | 'cautious' | 'pleased', or a blended EyeShape (mixEyes()).
 *  - `pulse` (0..1): one sensor pulse: the emitter lens flashes and three small arcs leave the window (0 = idle).
 *
 * Timing helpers (pure functions of the frame, no magic numbers in scenes):
 *  - botDrive(f, plan): position, distance rolled, speed and the spring-damped `brake` pitch for a drive described as
 *    speed keys (roll in at a speed, brake to a stop at an exact x, creep away...).
 *  - botPulseAt(f, start, every): the `pulse` phase of a repeating sensor ping.
 *
 * <BotTop/> is the plan-view glyph of the same robot (top-down, same colours, outlines in screen px).
 */

/** Design units per metre at scale 1. */
export const BOT_UNITS_PER_M = 250;

/** <DeliveryBot/>'s svg box: the ground point sits at (x, y) design units from the box's top-left corner (use it as
 *  the CSS transform-origin, times the scale, when the rig is squashed or faded; see whBotStyle). */
export const BOT_ORIGIN = {x: 130, y: 280, w: 260, h: 300};

/** Physical size (metres). */
export const BOT = {
  /** footprint (the side rig's flank is lengthM long; its front panel stands for widthM) */
  lengthM: 0.5,
  widthM: 0.46,
  /** body + lid */
  heightM: 0.6,
  /** to the top of the sensor head */
  totalM: 0.86,
  wheelR: 0.1,
  /** emitter window height above the floor */
  sensorH: 0.8,
  /** emitter window ahead of the footprint centre (m) */
  sensorAhead: 0.14,
};

export type BotEyes = 'neutral' | 'cautious' | 'pleased';
/** squint 0..1 (cautious), joy 0..1 (pleased arcs), look -1..1 (back .. forward), blink 1 open .. 0 closed */
export type EyeShape = {squint: number; joy: number; look: number; blink: number};

export const EYES: Record<BotEyes, EyeShape> = {
  neutral: {squint: 0, joy: 0, look: 0, blink: 1},
  cautious: {squint: 1, joy: 0, look: 0.3, blink: 1},
  pleased: {squint: 0, joy: 1, look: 0, blink: 1},
};

const toShape = (e: BotEyes | Partial<EyeShape> | undefined): EyeShape => (typeof e === 'string' ? EYES[e] : {...EYES.neutral, ...(e ?? {})});

/** Blend two eye states (t 0 = a, 1 = b). */
export const mixEyes = (a: BotEyes | EyeShape, b: BotEyes | EyeShape, t: number): EyeShape => {
  const p = toShape(a);
  const q = toShape(b);
  const m = (x: number, y: number) => x + (y - x) * t;
  return {squint: m(p.squint, q.squint), joy: m(p.joy, q.joy), look: m(p.look, q.look), blink: m(p.blink, q.blink)};
};

export type DeliveryBotProps = {
  /** ground point (footprint centre) in px */
  x: number;
  y: number;
  /** 1 = 250 px per metre; use whBotAt()/ppm / BOT_UNITS_PER_M for true size */
  scale?: number;
  /** metres rolled (drives wheel rotation) */
  travelled?: number;
  /** current speed, m/s (botDrive().speed); fades the spokes when they would strobe */
  speed?: number;
  /** body pitch: 1 = full nose-down braking dip, negative = rock back */
  brake?: number;
  eyes?: BotEyes | Partial<EyeShape>;
  /** extra eye shift -1..1 (added to the eye state's look) */
  look?: number;
  /** blink override: 1 open .. 0 closed (multiplies the eye state's blink) */
  blink?: number;
  /** sensor pulse phase 0..1 (0 = idle) */
  pulse?: number;
  /** face -x instead of +x */
  flip?: boolean;
  shadow?: boolean;
  style?: React.CSSProperties;
};

const TYRE = '#26363E';
const WINDOW = '#1D3540';
const R = 25; // wheel radius, units (0.1 m)
const AX_REAR = -60;
const AX_FRONT = 2;
const AX_Y = -R;

/** A spoked wheel at (cx, cy) turned by `deg`; `spokes` 0..1 fades the spokes (fast roll: no backward strobing). */
const Wheel: React.FC<{cx: number; cy: number; r: number; deg: number; far?: boolean; spokes?: number}> = ({cx, cy, r, deg, far, spokes = 1}) => (
  <g transform={`translate(${cx} ${cy})`}>
    <circle r={r} fill={far ? C.ink : TYRE} stroke={C.ink} strokeWidth={OUTLINE} />
    {!far && (
      <g>
        <circle r={r * 0.58} fill={C.cream} stroke={C.ink} strokeWidth={3} />
        {spokes > 0.01 && (
          <g transform={`rotate(${deg})`} stroke={C.ink} strokeWidth={3} strokeLinecap="round" opacity={spokes}>
            {[0, 72, 144, 216, 288].map((a) => (
              <line key={a} x1={0} y1={0} x2={Math.cos((a * Math.PI) / 180) * r * 0.5} y2={Math.sin((a * Math.PI) / 180) * r * 0.5} />
            ))}
          </g>
        )}
        <circle r={r * 0.17} fill={C.teal} stroke={C.ink} strokeWidth={2.5} />
      </g>
    )}
  </g>
);

/** One dot eye with squint lid and pleased arc. `side` -1 = rear (near) eye, +1 = front (far) eye.
 *  Cautious (after the A09 reference): each eye has its own short lid; at squint 1 the lid passes through the dot's
 *  centre and the dot is clipped below it (a half-disc), inner ends a touch higher (wary, not angry). */
const Eye: React.FC<{cx: number; cy: number; k: number; e: EyeShape; side: -1 | 1}> = ({cx, cy, k, e, side}) => {
  const uid = React.useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const open = Math.max(0, Math.min(1, e.blink)) * (1 - e.joy);
  const rx = 7.2 * k;
  const ry = 8.4 * k * open;
  const lidY = cy - ry + ry * e.squint;
  const t = -side * 0.9 * k * e.squint;
  const chord = rx + 0.6 * k;
  const showLid = e.squint > 0.02 && e.joy < 0.5;
  const clip = `bot-eye-${uid}`;
  return (
    <g>
      {showLid && (
        <defs>
          <clipPath id={clip}>
            <path d={`M ${cx - rx - 4} ${lidY + t * ((rx + 4) / rx)} L ${cx + rx + 4} ${lidY - t * ((rx + 4) / rx)} L ${cx + rx + 4} ${cy + ry + 4} L ${cx - rx - 4} ${cy + ry + 4} Z`} />
          </clipPath>
        </defs>
      )}
      {ry > 1.1 ? (
        <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill={C.ink} clipPath={showLid ? `url(#${clip})` : undefined} />
      ) : (
        e.joy < 0.5 && <line x1={cx - rx} y1={cy} x2={cx + rx} y2={cy} stroke={C.ink} strokeWidth={4} strokeLinecap="round" />
      )}
      {showLid && (
        <line x1={cx - chord} y1={lidY + t * (chord / rx)} x2={cx + chord} y2={lidY - t * (chord / rx)} stroke={C.ink} strokeWidth={4} strokeLinecap="round" opacity={Math.min(1, e.squint * 1.6)} />
      )}
      {e.joy > 0.02 && (
        <path d={`M ${cx - 6 * k} ${cy + 1.5 * k} Q ${cx} ${cy + 1.5 * k - 11 * k * e.joy} ${cx + 6 * k} ${cy + 1.5 * k}`} fill="none" stroke={C.ink} strokeWidth={4.5} strokeLinecap="round" opacity={Math.min(1, e.joy * 1.8)} />
      )}
    </g>
  );
};

/** Rounded polygon path (corner radius r) through the points. */
const roundPoly = (pts: [number, number][], r: number) => {
  const n = pts.length;
  let d = '';
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n];
    const p1 = pts[i];
    const p2 = pts[(i + 1) % n];
    const l1 = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]);
    const l2 = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]);
    const rr = Math.min(r, l1 / 2, l2 / 2);
    const a: [number, number] = [p1[0] + ((p0[0] - p1[0]) / l1) * rr, p1[1] + ((p0[1] - p1[1]) / l1) * rr];
    const b: [number, number] = [p1[0] + ((p2[0] - p1[0]) / l2) * rr, p1[1] + ((p2[1] - p1[1]) / l2) * rr];
    d += `${i ? 'L' : 'M'} ${a[0].toFixed(2)} ${a[1].toFixed(2)} Q ${p1[0]} ${p1[1]} ${b[0].toFixed(2)} ${b[1].toFixed(2)} `;
  }
  return d + 'Z';
};

// the front face recedes up-right: every unit of x across it rises by this much
const SLOPE = 0.125;
const NOSE_X0 = 30;
const NOSE_X1 = 86;
const ny = (x: number, y: number) => y - SLOPE * (x - NOSE_X0);

/** The robot as an SVG group (ground point at 0,0, facing +x, design units). */
export const DeliveryBotG: React.FC<Omit<DeliveryBotProps, 'x' | 'y' | 'scale' | 'style'>> = ({travelled = 0, speed = 0, brake = 0, eyes = 'neutral', look = 0, blink = 1, pulse = 0, flip = false, shadow = true}) => {
  const e0 = toShape(eyes);
  const e: EyeShape = {...e0, look: Math.max(-1, Math.min(1, e0.look + look)), blink: e0.blink * blink};
  const wheelDeg = ((travelled / BOT.wheelR) * 180) / Math.PI;
  // 5 spokes repeat every 72 deg: past ~29 deg per frame (0.05 m/frame) they start to read as turning backwards
  const spokes = 1 - smooth01((Math.abs(speed) / FPS - 0.05) / 0.025);
  const buzz = Math.sin((travelled * Math.PI * 2) / 0.31) * 0.7;
  const pitch = Math.max(-1.5, Math.min(1.5, brake)) * 6;
  const pivot = pitch >= 0 ? AX_FRONT : AX_REAR;
  const ph = Math.max(0, Math.min(1, pulse));
  const lens = ph > 0 && ph < 1 ? Math.sin(Math.min(1, ph * 2.2) * Math.PI) : 0;
  const lx = e.look * 3.5;

  // body outline pieces
  const flank: [number, number][] = [[-92, -124], [NOSE_X0, -124], [NOSE_X0, -16], [-92, -16]];
  const nose: [number, number][] = [[NOSE_X0, -124], [NOSE_X1, ny(NOSE_X1, -124)], [NOSE_X1, ny(NOSE_X1, -16)], [NOSE_X0, -16]];
  const panel: [number, number][] = [[38, ny(38, -112)], [79, ny(79, -112)], [79, ny(79, -66)], [38, ny(38, -66)]];
  const bumper: [number, number][] = [[NOSE_X0 - 2, ny(NOSE_X0, -46)], [NOSE_X1 + 4, ny(NOSE_X1, -46)], [NOSE_X1 + 4, ny(NOSE_X1, -19)], [NOSE_X0 - 2, ny(NOSE_X0, -19)]];
  const lidFlank: [number, number][] = [[-89, -139], [NOSE_X0 - 2, -139], [NOSE_X0 - 2, -122], [-89, -122]];
  const lidNose: [number, number][] = [[NOSE_X0 - 2, -139], [NOSE_X1 - 3, ny(NOSE_X1 - 3, -139)], [NOSE_X1 - 3, ny(NOSE_X1 - 3, -122)], [NOSE_X0 - 2, -122]];
  const lidTop: [number, number][] = [[-89, -139], [NOSE_X0 - 2, -139], [NOSE_X1 - 3, ny(NOSE_X1 - 3, -139)], [NOSE_X1 - 3 - (NOSE_X0 - 2 + 89), ny(NOSE_X1 - 3, -139)]];
  const ink = {stroke: C.ink, strokeWidth: OUTLINE, strokeLinejoin: 'round' as const};

  return (
    <g transform={flip ? 'scale(-1 1)' : undefined}>
      {shadow && <ellipse cx={-4} cy={1} rx={104} ry={11} fill={C.shadow} />}
      {/* far front wheel, peeking under the nose */}
      <Wheel cx={56} cy={AX_Y - 3} r={21} deg={wheelDeg} far />
      <g transform={`rotate(${pitch} ${pivot} ${AX_Y}) translate(0 ${buzz})`}>
        {/* mast and sensor head (behind the lid's front edge) */}
        <rect x={0} y={-190} width={15} height={56} rx={4} fill={C.cream} {...ink} strokeWidth={3.5} />
        <path d={roundPoly([[-20, -213], [22, -213], [22, -184], [-20, -184]], 10)} fill={C.teal} {...ink} />
        <path d={roundPoly([[22, -213], [39, -215], [39, -186], [22, -184]], 5)} fill={C.tealDeep} {...ink} />
        <path d={roundPoly([[25.5, -207.5], [35.5, -208.8], [35.5, -191.2], [25.5, -190]], 3)} fill={WINDOW} stroke={C.ink} strokeWidth={2.5} />
        <circle cx={30.5} cy={-199.3} r={3.4 + lens * 1.2} fill={lens > 0.05 ? C.saffronLight : C.saffron} />
        <rect x={-14} y={-205} width={22} height={5} rx={2.5} fill={C.tealLight} opacity={0.9} />
        {/* pulse: three small arcs leaving the emitter window */}
        {ph > 0 && ph < 1 && (
          <g fill="none" stroke={C.saffronDeep} strokeWidth={4} strokeLinecap="round">
            {[0, 1, 2].map((k) => {
              const t = Math.max(0, Math.min(1, ph * 1.5 - k * 0.22));
              if (t <= 0 || t >= 1) return null;
              const rr = 10 + 44 * t;
              const a = (36 * Math.PI) / 180;
              const cx = 40;
              const cy = -199;
              return <path key={k} d={`M ${cx + Math.cos(-a) * rr} ${cy + Math.sin(-a) * rr} A ${rr} ${rr} 0 0 1 ${cx + Math.cos(a) * rr} ${cy + Math.sin(a) * rr}`} opacity={(1 - t) * 0.95} />;
            })}
          </g>
        )}
        {/* body: flank (we see the right side) and the front face turned slightly toward us */}
        <path d={roundPoly(nose, 14)} fill={C.saffronLight} {...ink} />
        <path d={roundPoly(flank, 18)} fill={C.saffron} {...ink} />
        {/* chassis band along the flank bottom */}
        <path d={roundPoly([[-92, -46], [NOSE_X0, -46], [NOSE_X0, -16], [-92, -16]], 14)} fill={C.teal} {...ink} />
        {/* cargo door seam and a little parcel badge */}
        <path d={roundPoly([[-80, -113], [16, -113], [16, -56], [-80, -56]], 12)} fill="none" stroke={C.saffronDeep} strokeWidth={3.5} />
        <rect x={-42} y={-98} width={24} height={22} rx={4} fill={C.cream} stroke={C.ink} strokeWidth={3} />
        <rect x={-33} y={-98} width={6} height={22} fill={C.wood} />
        <rect x={-42} y={-98} width={24} height={22} rx={4} fill="none" stroke={C.ink} strokeWidth={3} />
        {/* tail light */}
        <rect x={-97} y={-104} width={10} height={24} rx={4} fill={C.coral} stroke={C.ink} strokeWidth={3} />
        {/* front bumper */}
        <path d={roundPoly(bumper, 8)} fill={C.coral} {...ink} />
        {/* face panel and eyes */}
        <path d={roundPoly(panel, 9)} fill={C.cream} {...ink} strokeWidth={3.5} />
        <Eye cx={49 + lx} cy={ny(49, -90)} k={1} e={e} side={-1} />
        <Eye cx={68.5 + lx * 0.9} cy={ny(68.5, -90)} k={0.9} e={e} side={1} />
        {/* cargo lid */}
        <path d={roundPoly(lidTop, 4)} fill={C.tealLight} {...ink} strokeWidth={3.5} />
        <path d={roundPoly(lidNose, 6)} fill={C.tealDeep} {...ink} strokeWidth={3.5} />
        <path d={roundPoly(lidFlank, 7)} fill={C.teal} {...ink} strokeWidth={3.5} />
        <rect x={-56} y={-134} width={34} height={7} rx={3.5} fill={C.tealDeep} />
      </g>
      {/* near wheels */}
      <Wheel cx={AX_REAR} cy={AX_Y} r={R} deg={wheelDeg} spokes={spokes} />
      <Wheel cx={AX_FRONT} cy={AX_Y} r={R} deg={wheelDeg + 17} spokes={spokes} />
    </g>
  );
};

/** The robot side rig as an absolutely positioned SVG (ground point at x, y in px). */
export const DeliveryBot: React.FC<DeliveryBotProps> = ({x, y, scale = 1, style, ...rest}) => (
  <svg
    viewBox={`${-BOT_ORIGIN.x} ${-BOT_ORIGIN.y} ${BOT_ORIGIN.w} ${BOT_ORIGIN.h}`}
    width={BOT_ORIGIN.w * scale}
    height={BOT_ORIGIN.h * scale}
    style={{position: 'absolute', left: x - BOT_ORIGIN.x * scale, top: y - BOT_ORIGIN.y * scale, overflow: 'visible', ...style}}
  >
    <DeliveryBotG {...rest} />
  </svg>
);

/* ------------------------------------------------------------------ driving: pure functions of the frame */

const smooth01 = (u: number) => {
  const v = Math.max(0, Math.min(1, u));
  return v * v * (3 - 2 * v);
};

/** A speed change: over frames [at, at + dur] the speed ramps linearly (constant acceleration) to `to` m/s. */
export type BotSpeedKey = {at: number; dur: number; to: number};

/**
 * A drive along one axis, described by its speed: `v0` m/s from frame 0, then the keys in time order. Give either
 * `x0` (position at frame 0) or `endX` (position when the last key ends, e.g. the stop pose: the roll-in is then
 * solved backwards so the robot stops exactly there).
 *
 *   roll in at 1.35 m/s and brake to a stop at x = 2.5 over 14 frames starting at frame 80:
 *     botDrive(f, {v0: 1.35, keys: [{at: 80, dur: 14, to: 0}], endX: 2.5})
 *   then creep on carefully from frame 150:  keys: [..., {at: 150, dur: 24, to: 0.3}]  (give x0 or endX accordingly)
 */
export type BotDrivePlan = {
  /** speed before the first key, m/s */
  v0: number;
  keys: BotSpeedKey[];
  /** x (m) at frame 0 (default 0 unless endX is given) */
  x0?: number;
  /** x (m) reached at the end of the last key; overrides x0 */
  endX?: number;
  /** +1 drives toward +x (default), -1 toward -x */
  dir?: 1 | -1;
  /** frames per second (default 30) */
  fps?: number;
  /** deceleration (m/s²) that gives the full braking dip, brake = 1 (default 2.9, i.e. 1.35 m/s to rest in 14 frames) */
  fullBrake?: number;
};

export type BotDriveState = {
  /** position along the axis, m */
  x: number;
  /** distance rolled since frame 0, m (feed to `travelled`) */
  travelled: number;
  /** current speed, m/s (feed it to the rig's `speed`) and m per frame */
  speed: number;
  speedPerFrame: number;
  /** acceleration, m/s² (negative while braking) */
  accel: number;
  /** body pitch for the rig's `brake` prop: a damped spring chasing the deceleration (dips, rocks back, settles) */
  brake: number;
};

/** Speed (m/s) and acceleration (m/s²) at frame t (keys sorted by `at`). */
const speedAt = (t: number, v0: number, keys: BotSpeedKey[], fps: number) => {
  let v = v0;
  for (const k of keys) {
    if (t < k.at) return {v, a: 0};
    const d = Math.max(1e-6, k.dur);
    if (t < k.at + d) {
      const u = (t - k.at) / d;
      return {v: v + (k.to - v) * u, a: ((k.to - v) * fps) / d};
    }
    v = k.to;
  }
  return {v, a: 0};
};

/** Distance (m) rolled from frame 0 to frame t (exact integral of the piecewise-linear speed). */
const distTo = (t: number, v0: number, keys: BotSpeedKey[], fps: number) => {
  let v = v0;
  let s = 0;
  let from = 0;
  for (const k of keys) {
    const d = Math.max(1e-6, k.dur);
    if (t <= k.at) return s + (v * (t - from)) / fps;
    s += (v * (k.at - from)) / fps;
    if (t <= k.at + d) {
      const u = t - k.at;
      return s + (v * u + ((k.to - v) * u * u) / (2 * d)) / fps;
    }
    s += (((v + k.to) / 2) * d) / fps;
    v = k.to;
    from = k.at + d;
  }
  return s + (v * (t - from)) / fps;
};

/**
 * The robot's drive at frame f (deterministic: the brake spring is integrated from frame 0 every call). The spring
 * dips the nose under braking (brake ≈ 1.1 peak for a full stop), rocks back past level and settles in ~20 frames;
 * accelerating rocks it back a little.
 */
export const botDrive = (f: number, plan: BotDrivePlan): BotDriveState => {
  const fps = plan.fps ?? 30;
  const dir = plan.dir ?? 1;
  const keys = [...plan.keys].sort((a, b) => a.at - b.at);
  const last = keys.length ? keys[keys.length - 1] : undefined;
  const x0 = plan.endX !== undefined ? plan.endX - dir * distTo(last ? last.at + Math.max(1e-6, last.dur) : 0, plan.v0, keys, fps) : plan.x0 ?? 0;
  const travelled = distTo(f, plan.v0, keys, fps);
  const {v, a} = speedAt(f, plan.v0, keys, fps);
  const full = plan.fullBrake ?? 2.9;
  let th = 0;
  let w = 0;
  for (let i = 0; i < Math.floor(f); i++) {
    const target = 0.78 * Math.max(-1.5, Math.min(1.5, -speedAt(i, plan.v0, keys, fps).a / full));
    w += 0.1 * (target - th) - 0.3 * w;
    th += w;
  }
  return {x: x0 + dir * travelled, travelled, speed: v, speedPerFrame: v / fps, accel: a, brake: th * 1.15};
};

/** Sensor ping phase for the rig's `pulse` prop: one `len`-frame pulse every `every` frames from `start`, until `end`. */
export const botPulseAt = (f: number, start: number, every: number, len = 18, end = Infinity) => {
  if (f < start || f >= end) return 0;
  const p = (f - start) % every;
  return p < len ? p / len : 0;
};

/* ------------------------------------------------------------------ plan glyph */

export type BotTopProps = {
  /** centre of the footprint, px */
  x: number;
  y: number;
  /** px per metre at the current view */
  ppm: number;
  /** heading in degrees on screen: 0 = +x (right), 90 = down the screen (+z in the plan) */
  heading?: number;
  /** sensor pulse phase 0..1 (0 = idle) */
  pulse?: number;
  /** extra uniform scale (e.g. the token pop-in from whFigureMix) */
  scale?: number;
  opacity?: number;
  /** foreshortening of the floor (1 in the plan); squashes the glyph vertically during a tilt */
  floor?: number;
};

/** Plan glyph as an SVG group (draw inside any world-px SVG). Outlines stay 4 px whatever the ppm. */
export const BotTopG: React.FC<BotTopProps> = ({x, y, ppm, heading = 0, pulse = 0, scale = 1, opacity = 1, floor = 1}) => {
  const k = ppm * scale; // px per metre
  const L = BOT.lengthM / 2;
  const Wd = BOT.widthM / 2;
  const ph = Math.max(0, Math.min(1, pulse));
  const lens = ph > 0 && ph < 1 ? Math.sin(Math.min(1, ph * 2.2) * Math.PI) : 0;
  const rr = (x0: number, y0: number, x1: number, y1: number, r: number, fill: string, sw = OUTLINE, key?: string) => (
    <rect key={key} x={x0 * k} y={y0 * k} width={(x1 - x0) * k} height={(y1 - y0) * k} rx={r * k} fill={fill} stroke={C.ink} strokeWidth={sw} />
  );
  const win = L - 0.075; // emitter window (front of the sensor head)
  return (
    <g opacity={opacity} transform={`translate(${x} ${y}) scale(1 ${floor}) rotate(${heading})`}>
      <rect x={-L * k + 5} y={-Wd * k + 7} width={2 * L * k} height={2 * Wd * k} rx={0.09 * k} fill={C.shadow} />
      {/* wheels poking out of the sides (front and rear on each side) */}
      {[-L + 0.12, L - 0.14].map((wx) => [-1, 1].map((sd) => rr(wx - 0.085, sd * Wd - 0.04 + sd * 0.025, wx + 0.085, sd * Wd + 0.04 + sd * 0.025, 0.03, TYRE, 3, `w${wx}${sd}`)))}
      {rr(-L, -Wd, L, Wd, 0.09, C.saffron)}
      {/* coral bumper at the front, tail light at the back */}
      {rr(L - 0.07, -Wd + 0.035, L + 0.025, Wd - 0.035, 0.03, C.coral, 3)}
      {rr(-L - 0.015, -0.08, -L + 0.035, 0.08, 0.02, C.coral, 3)}
      {/* cargo lid */}
      {rr(-L + 0.05, -Wd + 0.05, L - 0.1, Wd - 0.05, 0.05, C.teal, 3.5)}
      <rect x={(-L + 0.1) * k} y={-0.025 * k} width={0.12 * k} height={0.05 * k} rx={0.025 * k} fill={C.tealDeep} />
      {/* sensor head on its mast, emitter window facing forward */}
      {rr(win - 0.15, -0.07, win, 0.07, 0.035, C.tealDeep, 3.5)}
      <rect x={(win - 0.035) * k} y={-0.035 * k} width={0.045 * k} height={0.07 * k} rx={0.012 * k} fill={WINDOW} stroke={C.ink} strokeWidth={2} />
      <circle cx={(win - 0.012) * k} cy={0} r={(0.016 + lens * 0.007) * k} fill={lens > 0.05 ? C.saffronLight : C.saffron} />
      {ph > 0 && ph < 1 && (
        <g fill="none" stroke={C.saffronDeep} strokeWidth={4} strokeLinecap="round">
          {[0, 1, 2].map((i) => {
            const t = Math.max(0, Math.min(1, ph * 1.5 - i * 0.22));
            if (t <= 0 || t >= 1) return null;
            const r = (0.16 + 0.34 * t) * k;
            const a = (32 * Math.PI) / 180;
            const cx = win * k;
            return <path key={i} d={`M ${cx + Math.cos(-a) * r} ${Math.sin(-a) * r} A ${r} ${r} 0 0 1 ${cx + Math.cos(a) * r} ${Math.sin(a) * r}`} opacity={(1 - t) * 0.95} />;
          })}
        </g>
      )}
    </g>
  );
};

/** Plan glyph as an absolutely positioned full-world SVG (for item lists that hold HTML nodes). */
export const BotTop: React.FC<BotTopProps & {style?: React.CSSProperties}> = ({style, ...p}) => (
  <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible', ...style}}>
    <BotTopG {...p} />
  </svg>
);
