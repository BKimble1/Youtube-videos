import React, {useId} from 'react';
import {C, OUTLINE} from '../../theme';
import {handWorld2, reach2, type Pose2, type RigPlace} from './Cast2';

/**
 * The handheld time-of-flight sensor (Video 02 prop): a small teal box on a short grip, held in a rig hand.
 *
 * <HandheldSensor/> is drawn in CHARACTER-LOCAL coordinates with the holding hand at (0, 0): pass it as `holdR` /
 * `holdL` of <Character2>/<Character>. The grip runs up out of the fist; the box sits on top of it. The face toward the
 * camera carries a tiny readout (a mini arrival histogram: a tall first bar and a small late bump, or any custom
 * content) and a status LED. The working face (emitter + detector, toward the wall) faces away from us: it is implied
 * by the box's depth and by the two lens rims peeking over its top edge. Not a phone, no branding.
 *
 * <SensorTop/> is the same object seen from above for the plan view: a teal box with an emitter notch on the face
 * that points along `facing`.
 *
 * Both are pure functions of their props: animate `reveal`, `led`, `firing` and `bars` from the frame.
 *
 * Opt-in `burst` / `burstRing` (both default off, so nothing changes unless a scene passes them): a visible flash AT the
 * lens the moment a pulse is fired, before the pulse itself clears the box (review r1 D15: the sensor_pulse sound is on
 * the fire frame, while the pulse head is hidden inside the box for a few frames). `burst` 0..1 is a flat saffron halo
 * behind the lens rim (it shows over the box's top edge, i.e. from the far, working face); `burstRing` 0..1 is the phase
 * of a thin ring expanding from that lens and fading as it goes (animate it 0 -> 1 over ~6-10 frames from the fire
 * frame). Hold `burst` at 1 until the pulse is out of the box, then fade it over a few frames.
 */

/* ------------------------------------------------------------------ geometry (character-local px, hand at 0,0) */

/** Box front face, grip and readout geometry relative to the hand (scale 1). Use with sensorPoint(). */
export const SENSOR = {
  box: {x0: -46, y0: -108, x1: 40, y1: -50, r: 10},
  depth: {dx: 11, dy: -12},
  grip: {x0: -12, y0: -56, x1: 12, y1: 14, r: 9},
  screen: {x0: -38, y0: -100, w: 52, h: 34, r: 6},
  led: {x: 27, y: -91, r: 5.5},
} as const;

export type SensorPointName = 'boxLeft' | 'boxRight' | 'boxBottomLeft' | 'boxTop' | 'screen' | 'farFace' | 'grip' | 'cradle';

/**
 * A named point of the held sensor relative to the holding hand, in the same units as the hand's offset: pass the
 * product of the rig's scale and the sensor's own `scale` as `scale`, the sensor's `rotate`, and `flip` when the rig
 * is flipped; then add the hand's world position (handWorld2). `cradle` is where a supporting palm goes (under the
 * box, left of the grip; draw that hand under the box, see holdSensor); `farFace` is the centre of the working face
 * (emitter + detector) for starting light paths.
 */
export const sensorPoint = (name: SensorPointName, scale = 1, rotate = 0, flip = false): {x: number; y: number} => {
  const b = SENSOR.box;
  const p = (() => {
    switch (name) {
      case 'boxLeft':
        return {x: b.x0, y: (b.y0 + b.y1) / 2 + 6};
      case 'boxRight':
        return {x: b.x1 + SENSOR.depth.dx / 2, y: (b.y0 + b.y1) / 2};
      case 'boxBottomLeft':
        return {x: b.x0 + 10, y: b.y1};
      case 'boxTop':
        return {x: (b.x0 + b.x1) / 2, y: b.y0};
      case 'screen':
        return {x: SENSOR.screen.x0 + SENSOR.screen.w / 2, y: SENSOR.screen.y0 + SENSOR.screen.h / 2};
      case 'farFace':
        return {x: (b.x0 + b.x1) / 2 + SENSOR.depth.dx, y: (b.y0 + b.y1) / 2 + SENSOR.depth.dy};
      case 'cradle':
        return {x: b.x0 + CRADLE.dx, y: b.y1 + CRADLE.dy};
      case 'grip':
      default:
        return {x: 0, y: 0};
    }
  })();
  const r = (rotate * Math.PI) / 180;
  const x = (p.x * Math.cos(r) - p.y * Math.sin(r)) * scale;
  const y = (p.x * Math.sin(r) + p.y * Math.cos(r)) * scale;
  return {x: flip ? -x : x, y};
};

// the supporting palm: its centre this far right of the box's left edge and below its bottom edge (sensor px)
const CRADLE = {dx: 13, dy: 0};

/* ------------------------------------------------------------------ holding it (rig helper) */

export type SensorHoldOptions = {
  /** Grip-hand position, character-local ground frame (feet at 0,0): default chest height, in front of the right hip.
   *  Ignored when `gripWorld` or `farFaceAt` is given. */
  grip?: {x: number; y: number};
  /** Grip-hand position in world px. */
  gripWorld?: {x: number; y: number};
  /** Put the sensor's working (far) face on this world point instead, e.g. the projected layout sensor S. */
  farFaceAt?: {x: number; y: number};
  /** The other hand cradles the box from below (default true); false leaves `pose.armL` as it is. */
  support?: boolean;
  /** The <HandheldSensor> scale and rotate you will draw (default 1, 0). */
  sensorScale?: number;
  rotate?: number;
};

/** Default grip-hand position (character-local): chest height, just right of centre. */
export const SENSOR_GRIP = {x: 40, y: -176};

/**
 * Pose a <Character2> holding the sensor: the right hand (screen right, `holdR`) on the grip, the left hand cradling
 * the box from below (drawn under the box: armsFront 'both', frontTop 'R'). Returns the pose plus world points for the
 * grip hand, the box's screen and its far face (where pulses leave). Pass the same `ch` (with frame/seed/life for
 * exact contact) you draw the rig with, then render
 *   <Character2 {...ch} pose={held.pose} holdR={<HandheldSensor skin={look.skin} mirrored={ch.flip} .../>} />.
 */
export const holdSensor = (ch: RigPlace, pose: Pose2, opts: SensorHoldOptions = {}) => {
  const k = ch.scale * (opts.sensorScale ?? 1);
  const rotate = opts.rotate ?? 0;
  const flip = !!ch.flip;
  const sp = (n: SensorPointName) => sensorPoint(n, k, rotate, flip);
  const g0 = opts.grip ?? SENSOR_GRIP;
  const target = opts.farFaceAt
    ? {x: opts.farFaceAt.x - sp('farFace').x, y: opts.farFaceAt.y - sp('farFace').y}
    : opts.gripWorld ?? {x: ch.x + (flip ? -g0.x : g0.x) * ch.scale, y: ch.y + g0.y * ch.scale};
  const p0: Pose2 = {...pose, armsFront: opts.support === false ? 'R' : 'both', frontTop: 'R'};
  const armR = reach2(ch, p0, 1, target.x, target.y, -1);
  const withR: Pose2 = {...p0, armR};
  const hand = handWorld2(ch, withR, 1);
  const at = (n: SensorPointName) => ({x: hand.x + sp(n).x, y: hand.y + sp(n).y});
  const cradle = at('cradle');
  const out: Pose2 = opts.support === false ? withR : {...withR, armL: reach2(ch, withR, -1, cradle.x, cradle.y, -1)};
  return {pose: out, hand, screen: at('screen'), farFace: at('farFace'), cradle};
};

/** Default readout: arrival-time histogram with a tall first-bounce bar and a small late bump (illustrative). */
export const SENSOR_BARS = [0.06, 1, 0.46, 0.16, 0.08, 0.05, 0.07, 0.2, 0.3, 0.17, 0.06];
/** Index of the first bar of the late bump in SENSOR_BARS. */
export const SENSOR_BUMP_FROM = 6;

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const f2 = (n: number) => Math.round(n * 100) / 100;

/** Mix two #rrggbb colours. */
const mix = (a: string, b: string, t: number) => {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  const k = clamp01(t);
  return '#' + pa.map((v, i) => Math.round(v + (pb[i] - v) * k).toString(16).padStart(2, '0')).join('');
};

const TOP = mix(C.teal, C.tealLight, 0.45);

/* ------------------------------------------------------------------ the readout */

export type SensorReadoutProps = {
  /** Bar heights 0..1. */
  bars?: number[];
  /** Bars from this index on are the late bump (accent colour). */
  bumpFrom?: number;
  /** 0..1: a cursor sweeps left to right and bars rise as it passes (1 = full histogram, 0 = empty screen). */
  reveal?: number;
  /** 0..1: highlight the late bump (it pops a little and turns coral-deep). */
  bumpHighlight?: number;
  width: number;
  height: number;
};

/** The mini histogram on the sensor's screen (screen-local px, origin top-left). Also usable on its own. */
export const SensorReadout: React.FC<SensorReadoutProps> = ({bars = SENSOR_BARS, bumpFrom = SENSOR_BUMP_FROM, reveal = 1, bumpHighlight = 0, width, height}) => {
  const pad = 4;
  const n = bars.length;
  const gap = 1.6;
  const bw = (width - pad * 2 - gap * (n - 1)) / n;
  const baseY = height - pad - 1;
  const hMax = height - pad * 2 - 3;
  const sweep = clamp01(reveal);
  const cursorX = pad + sweep * (width - pad * 2);
  return (
    <g>
      {bars.map((v, i) => {
        const x = pad + i * (bw + gap);
        const rise = clamp01((cursorX - x) / (bw + gap));
        const late = i >= bumpFrom;
        const hl = late ? bumpHighlight : 0;
        const h = Math.max(0, v * hMax * rise * (1 + 0.12 * hl));
        if (h < 0.3) return null;
        return <rect key={i} x={f2(x)} y={f2(baseY - h)} width={f2(bw)} height={f2(h)} rx={Math.min(1.5, bw / 3)} fill={late ? mix(C.saffronDeep, C.coralDeep, hl) : C.tealDeep} />;
      })}
      <line x1={pad - 1} y1={baseY + 0.5} x2={width - pad + 1} y2={baseY + 0.5} stroke={C.inkSoft} strokeWidth={1.6} strokeLinecap="round" />
      {sweep > 0 && sweep < 1 && <line x1={f2(cursorX)} y1={pad} x2={f2(cursorX)} y2={baseY} stroke={C.coral} strokeWidth={1.6} strokeLinecap="round" />}
    </g>
  );
};

/* ------------------------------------------------------------------ HandheldSensor */

export type HandheldSensorProps = {
  /** Readout bars 0..1 (default: SENSOR_BARS). */
  bars?: number[];
  bumpFrom?: number;
  /** Readout sweep 0..1 (bars rise as a cursor passes). */
  reveal?: number;
  /** 0..1: emphasise the late bump on the readout. */
  bumpHighlight?: number;
  /** Custom screen content instead of the histogram (screen-local px: 0..SENSOR.screen.w × 0..SENSOR.screen.h). */
  screen?: React.ReactNode;
  /** Status LED 0 (off) .. 1 (lit). */
  led?: number;
  ledColor?: string;
  /** 0..1: the emitter rim over the top edge brightens (a pulse leaving the far face). */
  firing?: number;
  /** Opt-in 0..1 (default 0 = none): a saffron flash halo behind a lens rim, rx 13 + 16 * burst, opacity 0.7 * burst. */
  burst?: number;
  /** Opt-in 0..1 phase (default none): a thin saffron ring expanding from that lens (r 13 -> 47) and fading out. */
  burstRing?: number;
  /** Which lens rim flashes: 'right' (default; the dark rim, where the pulses come out over the box in the room
   *  views) or 'left' (the coral rim that `firing` tints). */
  burstLens?: 'right' | 'left';
  /** Skin of the holding hand: draws fingers wrapped round the grip in front of it. Omit for a free-standing prop. */
  skin?: string;
  scale?: number;
  /** Rotation about the hand (deg). */
  rotate?: number;
  /** Set when the holding rig is drawn flipped: the readout is mirrored back so time still runs left to right. */
  mirrored?: boolean;
};

/** The held sensor (character-local, hand at 0,0). See the file header. */
export const HandheldSensor: React.FC<HandheldSensorProps> = ({bars, bumpFrom, reveal = 1, bumpHighlight = 0, screen, led = 1, ledColor = C.saffron, firing = 0, burst = 0, burstRing, burstLens = 'right', skin, scale = 1, rotate = 0, mirrored = false}) => {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const b = SENSOR.box;
  const d = SENSOR.depth;
  const g = SENSOR.grip;
  const s = SENSOR.screen;
  const ink = {stroke: C.ink, strokeWidth: OUTLINE, strokeLinejoin: 'round' as const};
  const ledOn = clamp01(led);
  const fire = clamp01(firing);
  // top and side faces of the box (slightly oversized under the rounded front face)
  const top = `M ${b.x0 + 2} ${b.y0 + 4} L ${b.x0 + 2 + d.dx} ${b.y0 + d.dy} L ${b.x1 + d.dx} ${b.y0 + d.dy} L ${b.x1 - 2} ${b.y0 + 4} Z`;
  const side = `M ${b.x1 - 4} ${b.y0 + 2} L ${b.x1 + d.dx} ${b.y0 + d.dy} L ${b.x1 + d.dx} ${b.y1 + d.dy - 2} L ${b.x1 - 4} ${b.y1 - 2} Z`;
  // opt-in burst at a lens rim (centre of the rim ellipse below)
  const bu = clamp01(burst);
  const lens = {x: b.x0 + (burstLens === 'left' ? 24 : 56) + d.dx, y: b.y0 + d.dy - 1};
  const ring = burstRing === undefined ? -1 : clamp01(burstRing);
  return (
    <g transform={`rotate(${f2(rotate)}) scale(${f2(scale)})`}>
      {/* grip (runs from the fist up into the box), with a coral trigger */}
      <rect x={g.x0} y={g.y0} width={g.x1 - g.x0} height={g.y1 - g.y0} rx={g.r} fill={C.tealDeep} {...ink} />
      <rect x={-6} y={-40} width={12} height={14} rx={4} fill={C.coral} stroke={C.ink} strokeWidth={3} />
      {/* opt-in burst: a flat saffron halo behind the lens rim (the box hides its lower half: light from the far face) */}
      {bu > 0.001 && <ellipse cx={lens.x} cy={lens.y} rx={f2(13 + 16 * bu)} ry={f2((13 + 16 * bu) * 0.72)} fill={C.saffron} opacity={f2(0.7 * bu)} />}
      {/* lens rims of the far face peeking over the top edge: emitter (coral), detector (ink) */}
      <ellipse cx={b.x0 + 24 + d.dx} cy={b.y0 + d.dy - 1} rx={13} ry={8} fill={mix(C.coral, C.saffronLight, fire * 0.7)} {...ink} strokeWidth={3} />
      <ellipse cx={b.x0 + 56 + d.dx} cy={b.y0 + d.dy - 1} rx={9} ry={6.5} fill={C.inkSoft} {...ink} strokeWidth={3} />
      {/* opt-in burst ring: expands from the lens and fades (behind the box, like the halo) */}
      {ring > 0 && ring < 1 && <ellipse cx={lens.x} cy={lens.y} rx={f2(13 + 34 * ring)} ry={f2((13 + 34 * ring) * 0.72)} fill="none" stroke={C.saffronDeep} strokeWidth={3} opacity={f2(0.9 * (1 - ring))} />}
      {/* box: side, top, front */}
      <path d={side} fill={C.tealDeep} {...ink} />
      <path d={top} fill={TOP} {...ink} />
      <rect x={b.x0} y={b.y0} width={b.x1 - b.x0} height={b.y1 - b.y0} rx={b.r} fill={C.teal} {...ink} />
      {/* coral accent band along the bottom of the front face */}
      <defs>
        <clipPath id={`face${uid}`}>
          <rect x={b.x0} y={b.y0} width={b.x1 - b.x0} height={b.y1 - b.y0} rx={b.r} />
        </clipPath>
      </defs>
      <g clipPath={`url(#face${uid})`}>
        <rect x={b.x0 - 2} y={b.y1 - 10} width={b.x1 - b.x0 + 4} height={12} fill={C.coral} />
        <line x1={b.x0} y1={b.y1 - 10} x2={b.x1} y2={b.y1 - 10} stroke={C.ink} strokeWidth={3} />
      </g>
      <rect x={b.x0} y={b.y0} width={b.x1 - b.x0} height={b.y1 - b.y0} rx={b.r} fill="none" {...ink} />
      {/* readout screen */}
      <rect x={s.x0} y={s.y0} width={s.w} height={s.h} rx={s.r} fill={C.cream} stroke={C.ink} strokeWidth={3} />
      <defs>
        <clipPath id={`scr${uid}`}>
          <rect x={s.x0 + 1.5} y={s.y0 + 1.5} width={s.w - 3} height={s.h - 3} rx={s.r - 1.5} />
        </clipPath>
      </defs>
      <g clipPath={`url(#scr${uid})`}>
        <g transform={mirrored ? `translate(${s.x0 + s.w} ${s.y0}) scale(-1 1)` : `translate(${s.x0} ${s.y0})`}>{screen ??<SensorReadout bars={bars} bumpFrom={bumpFrom} reveal={reveal} bumpHighlight={bumpHighlight} width={s.w} height={s.h} />}</g>
      </g>
      {/* status LED and a small button */}
      <circle cx={SENSOR.led.x} cy={SENSOR.led.y} r={SENSOR.led.r} fill={mix(mix(C.tealDeep, C.inkSoft, 0.4), ledColor, ledOn)} stroke={C.ink} strokeWidth={3} />
      {ledOn > 0.3 && <circle cx={SENSOR.led.x - 1.6} cy={SENSOR.led.y - 1.6} r={1.6} fill={C.cream} opacity={ledOn} />}
      <rect x={21} y={-78} width={12} height={8} rx={3} fill={C.tealLight} stroke={C.ink} strokeWidth={2.5} />
      {/* fingers wrapped round the grip, in front of it */}
      {skin && (
        // three curled fingers stacked round the grip (the palm and thumb are the rig's mitt behind it)
        <g>
          {[8, -1, -10].map((fy) => (
            <rect key={fy} x={-16} y={fy - 5.5} width={31} height={12} rx={6} fill={skin} stroke={C.ink} strokeWidth={3} />
          ))}
        </g>
      )}
    </g>
  );
};

/* ------------------------------------------------------------------ SensorTop (plan view) */

export type SensorTopProps = {
  /** Centre (px) in the parent's space. */
  x: number;
  y: number;
  /** Body width across the facing direction, px (about 0.22 m in plan). */
  size?: number;
  /** Facing (deg, clockwise from screen-up): 0 = toward the top of the screen (the relay wall in the plan view). */
  facing?: number;
  /** 0..1: the emitter window lights up. */
  firing?: number;
  /** Opt-in 0..1 (default 0 = none): a saffron flash halo out of the emitter notch (opacity 0.7 * burst). */
  burst?: number;
  /** Opt-in 0..1 phase (default none): a thin saffron ring expanding from the emitter window and fading out. */
  burstRing?: number;
  opacity?: number;
  /** Extra uniform scale (pop-in). */
  scale?: number;
  /** Return a bare <g> for a parent <svg> instead of an overlay <svg>. */
  asGroup?: boolean;
};

/** Facing angle (deg, clockwise from screen-up) of a screen-space direction vector. */
export const facingOf = (dx: number, dy: number) => (Math.atan2(dx, -dy) * 180) / Math.PI;

/** The sensor seen from above: teal box, emitter notch (coral window) on the face that points along `facing`. */
export const SensorTop: React.FC<SensorTopProps> = ({x, y, size = 56, facing = 0, firing = 0, burst = 0, burstRing, opacity = 1, scale = 1, asGroup}) => {
  const w = size;
  const h = size * 0.5;
  const k = size / 56;
  const sw = Math.min(OUTLINE, Math.max(2.5, OUTLINE * k));
  const nw = w * 0.36; // notch width at the face
  const nd = h * 0.34; // notch depth
  const r = h * 0.22;
  // box outline with a trapezoid notch cut into the front (−y) edge
  const body = [
    `M ${-w / 2 + r} ${-h / 2}`,
    `L ${-nw / 2} ${-h / 2}`,
    `L ${-nw / 2 + nd * 0.45} ${-h / 2 + nd}`,
    `L ${nw / 2 - nd * 0.45} ${-h / 2 + nd}`,
    `L ${nw / 2} ${-h / 2}`,
    `L ${w / 2 - r} ${-h / 2}`,
    `Q ${w / 2} ${-h / 2} ${w / 2} ${-h / 2 + r}`,
    `L ${w / 2} ${h / 2 - r}`,
    `Q ${w / 2} ${h / 2} ${w / 2 - r} ${h / 2}`,
    `L ${-w / 2 + r} ${h / 2}`,
    `Q ${-w / 2} ${h / 2} ${-w / 2} ${h / 2 - r}`,
    `L ${-w / 2} ${-h / 2 + r}`,
    `Q ${-w / 2} ${-h / 2} ${-w / 2 + r} ${-h / 2}`,
    'Z',
  ].join(' ');
  const fire = clamp01(firing);
  const bu = clamp01(burst);
  const ring = burstRing === undefined ? -1 : clamp01(burstRing);
  const winY = -h / 2 + nd - 2.5 * k; // centre of the emitter window
  const g = (
    <g transform={`translate(${f2(x)} ${f2(y)}) rotate(${f2(facing)}) scale(${f2(scale)})`} opacity={opacity}>
      {/* shadow */}
      <rect x={-w / 2 + 3 * k} y={-h / 2 + 5 * k} width={w} height={h} rx={r} fill={C.shadow} />
      {/* opt-in burst: a saffron halo under the body, showing through the notch and past the front face */}
      {bu > 0.001 && <ellipse cx={0} cy={f2(winY - 2 * k)} rx={f2((9 + 11 * bu) * k)} ry={f2((9 + 11 * bu) * k * 0.8)} fill={C.saffron} opacity={f2(0.7 * bu)} />}
      {/* opt-in burst ring, expanding from the emitter window (under the body too: it shows ahead of the front face) */}
      {ring > 0 && ring < 1 && <circle cx={0} cy={f2(winY)} r={f2((6 + 26 * ring) * k)} fill="none" stroke={C.saffronDeep} strokeWidth={f2(Math.max(2, 2.5 * k))} opacity={f2(0.9 * (1 - ring))} />}
      {/* grip stub showing at the back */}
      <rect x={-w * 0.13} y={h / 2 - 4 * k} width={w * 0.26} height={h * 0.42} rx={w * 0.08} fill={C.tealDeep} stroke={C.ink} strokeWidth={sw} />
      <path d={body} fill={C.teal} stroke={C.ink} strokeWidth={sw} strokeLinejoin="round" />
      {/* emitter window inside the notch */}
      <rect x={-nw / 2 + nd * 0.45} y={-h / 2 + nd - 5 * k} width={nw - nd * 0.9} height={5 * k} rx={2 * k} fill={mix(C.coral, C.saffronLight, fire * 0.7)} stroke={C.ink} strokeWidth={sw * 0.7} />
      {/* readout edge at the back (the face toward the operator) */}
      <line x1={-w * 0.3} y1={h / 2 - 4.5 * k} x2={w * 0.12} y2={h / 2 - 4.5 * k} stroke={C.cream} strokeWidth={3 * k} strokeLinecap="round" />
      <circle cx={w * 0.3} cy={h / 2 - 5.5 * k} r={2.6 * k} fill={C.saffron} stroke={C.ink} strokeWidth={1.6 * k} />
    </g>
  );
  return asGroup ? (
    g
  ) : (
    <svg width={1} height={1} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible', pointerEvents: 'none'}}>
      {g}
    </svg>
  );
};
