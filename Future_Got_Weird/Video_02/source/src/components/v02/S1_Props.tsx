import React from 'react';
import {C, F, OUTLINE} from '../../theme';
import {E} from '../../lib/motion';
import track from '../../data/evidence/tracking_topdown.json';

/**
 * S1 only: small props and screen-space cards for the cold open.
 *  - Webcam: a desk webcam with stubby arms that can shrug (the "your webcam can't time that" gag).
 *  - Stopwatch: a stopwatch glyph (for the sensor readout in the close-up).
 *  - MiniTrackScreen: the sensor readout as a tiny top-view tracking plot (the board grows out of it).
 *  - ArrivalRace: the mini arrival timeline (wall echo first, the roundabout echo later; illustrative).
 *  - RulerCard: "1 nanosecond ≈ 30 cm ≈ 1 ft" with a light ruler a pulse runs along.
 *  - NSS: wraps SVG content so every stroke keeps its nominal width (4 px ink) however much the content is scaled.
 * All pure functions of their props.
 */

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const f2 = (n: number) => Math.round(n * 100) / 100;
const pop = (t: number) => (t <= 0 ? 0 : t >= 1 ? 1 : E.back(t));

/** Non-scaling strokes for everything inside (a scaled-up prop keeps the 4 px house outline). */
export const NSS: React.FC<{children: React.ReactNode; transform?: string}> = ({children, transform}) => (
  <g className="s1nss" transform={transform}>
    <style>{'.s1nss path, .s1nss rect, .s1nss circle, .s1nss ellipse, .s1nss line, .s1nss polyline, .s1nss polygon { vector-effect: non-scaling-stroke; }'}</style>
    {children}
  </g>
);

/* ------------------------------------------------------------------ webcam */

export type WebcamProps = {
  /** 0..1 shrug (arms up, palms out, body lifts and tilts) */
  shrug?: number;
  /** 0..1 sad: the LED turns coral, the mouth frowns */
  sad?: number;
  /** head tilt, deg */
  tilt?: number;
  /** pupil (lens glint) offset -1..1 */
  lookX?: number;
  lookY?: number;
};

/** A desk webcam (local px, ~230 wide, base on y = 0, top near y = -250). Outlines 4 px at scale 1. */
export const Webcam: React.FC<WebcamProps> = ({shrug = 0, sad = 0, tilt = 0, lookX = 0, lookY = 0}) => {
  const s = clamp01(shrug);
  const lift = -14 * s;
  const ink = {stroke: C.ink, strokeWidth: OUTLINE, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const};
  // arms: shoulder at the body side, elbow, hand; rest = hanging, shrug = forearm up, palm out
  const arm = (side: -1 | 1) => {
    const sh = {x: side * 92, y: -150 + lift};
    const el = {x: side * (104 + 22 * s), y: -112 + lift - 22 * s};
    const hd = {x: side * (110 + 30 * s), y: -86 + lift - 78 * s};
    return (
      <g key={side}>
        <path d={`M ${sh.x} ${sh.y} L ${f2(el.x)} ${f2(el.y)} L ${f2(hd.x)} ${f2(hd.y)}`} fill="none" {...ink} strokeWidth={14} />
        <path d={`M ${sh.x} ${sh.y} L ${f2(el.x)} ${f2(el.y)} L ${f2(hd.x)} ${f2(hd.y)}`} fill="none" stroke={C.blueDeep} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" />
        <circle cx={f2(hd.x)} cy={f2(hd.y)} r={11} fill={C.blueLight} {...ink} strokeWidth={3.5} />
      </g>
    );
  };
  const mouthY = -110 + lift;
  const frown = sad;
  return (
    <g>
      {/* monitor-clip base */}
      <ellipse cx={0} cy={4} rx={86} ry={10} fill={C.shadow} />
      <path d="M -66 0 L -50 -30 L 50 -30 L 66 0 Z" fill={C.inkSoft} {...ink} />
      <rect x={-12} y={-66 + lift} width={24} height={40 - lift} rx={8} fill={C.inkMuted} {...ink} />
      {arm(-1)}
      {arm(1)}
      <g transform={`rotate(${f2(tilt + 6 * s)} 0 ${-120 + lift})`}>
        {/* body */}
        <rect x={-98} y={-214 + lift} width={196} height={140} rx={56} fill={C.blueLight} {...ink} />
        {/* lens */}
        <circle cx={0} cy={-150 + lift} r={44} fill={C.cream} {...ink} />
        <circle cx={0} cy={-150 + lift} r={30} fill={C.blueDeep} {...ink} strokeWidth={3.5} />
        <circle cx={f2(lookX * 9)} cy={f2(-150 + lift + lookY * 9)} r={13} fill={C.ink} />
        <circle cx={f2(lookX * 9 - 9)} cy={f2(-159 + lift + lookY * 9)} r={6} fill={C.cream} />
        {/* LED and mic slit */}
        <circle cx={62} cy={-182 + lift} r={8} fill={sad > 0.5 ? C.coral : C.teal} {...ink} strokeWidth={3} />
        <path d={`M -70 ${-186 + lift} L -48 ${-186 + lift}`} stroke={C.inkSoft} strokeWidth={4} strokeLinecap="round" />
        {/* mouth: a small line that frowns when sad */}
        <path d={`M -16 ${f2(mouthY + 6 * frown)} Q 0 ${f2(mouthY - 8 * frown + 4 * (1 - frown))} 16 ${f2(mouthY + 6 * frown)}`} fill="none" stroke={C.ink} strokeWidth={4} strokeLinecap="round" />
      </g>
      {/* shrug lines beside the shoulders */}
      {s > 0.4 && (
        <g opacity={clamp01((s - 0.4) * 2.5)}>
          {[-1, 1].map((side) => (
            <path key={side} d={`M ${side * 128} ${-176 + lift} L ${side * 146} ${-196 + lift} M ${side * 134} ${-158 + lift} L ${side * 158} ${-166 + lift}`} stroke={C.ink} strokeWidth={4} strokeLinecap="round" />
          ))}
        </g>
      )}
    </g>
  );
};

/** A question mark that spins about its vertical axis (spin 0..1 = turns) and pops in with t. */
export const SpinningQuestion: React.FC<{x: number; y: number; t: number; spin: number; size?: number}> = ({x, y, t, spin, size = 96}) => {
  if (t <= 0) return null;
  const sx = Math.cos(spin * Math.PI * 2);
  return (
    <g transform={`translate(${f2(x)} ${f2(y)}) scale(${f2(pop(t) * (Math.abs(sx) < 0.08 ? 0.08 * Math.sign(sx || 1) : sx))} ${f2(pop(t))})`}>
      <text x={0} y={size * 0.36} textAnchor="middle" fontFamily={F.display} fontWeight={700} fontSize={size} fill={C.saffron} stroke={C.ink} strokeWidth={8} strokeLinejoin="round" paintOrder="stroke">
        ?
      </text>
    </g>
  );
};

/* ------------------------------------------------------------------ stopwatch glyph */

/** A stopwatch glyph centred at (x, y), radius r; `hand` in turns. Strokes scale with r (r = 12 → 2 px). */
export const Stopwatch: React.FC<{x: number; y: number; r: number; hand: number; color?: string}> = ({x, y, r, hand, color = C.teal}) => {
  const sw = Math.max(1.4, r / 6);
  const a = hand * Math.PI * 2 - Math.PI / 2;
  return (
    <g>
      <rect x={f2(x - r * 0.22)} y={f2(y - r * 1.42)} width={f2(r * 0.44)} height={f2(r * 0.34)} rx={f2(r * 0.1)} fill={C.ink} />
      <path d={`M ${f2(x + r * 0.62)} ${f2(y - r * 0.95)} L ${f2(x + r * 0.86)} ${f2(y - r * 1.18)}`} stroke={C.ink} strokeWidth={f2(sw * 1.1)} strokeLinecap="round" />
      <circle cx={f2(x)} cy={f2(y)} r={f2(r)} fill={C.white} stroke={C.ink} strokeWidth={f2(sw)} />
      <circle cx={f2(x)} cy={f2(y)} r={f2(r * 0.72)} fill={C.tealLight} />
      <path d={`M ${f2(x)} ${f2(y)} L ${f2(x + Math.cos(a) * r * 0.66)} ${f2(y + Math.sin(a) * r * 0.66)}`} stroke={color === C.teal ? C.coralDeep : color} strokeWidth={f2(sw * 1.05)} strokeLinecap="round" />
      <circle cx={f2(x)} cy={f2(y)} r={f2(sw * 0.9)} fill={C.ink} />
    </g>
  );
};

/* ------------------------------------------------------------------ the readout as a tiny tracking plot */

type XZ = [number, number];
const TRACK = (track as unknown as {ours_xz: XZ[]; num_frames: number}).ours_xz;

/** The sensor's readout (screen-local px, w x h) showing a tiny top view: wall, partition, sensor, the estimate. */
export const MiniTrackScreen: React.FC<{w: number; h: number; idx: number; on: number}> = ({w, h, idx, on}) => {
  if (on <= 0) return <rect x={0} y={0} width={w} height={h} fill={C.paperLine} />;
  const X = (dx: number) => 3 + ((dx + 0.15) / 1.9) * (w - 6);
  const Y = (z: number) => 5 + ((z + 0.02) / 1.42) * (h - 8);
  const i = ((Math.floor(idx) % TRACK.length) + TRACK.length) % TRACK.length;
  const cur = TRACK[i];
  const trail = Array.from({length: Math.min(10, i)}).map((_, j) => TRACK[i - j - 1]);
  return (
    <g opacity={clamp01(on)}>
      <line x1={2} y1={Y(0)} x2={w - 2} y2={Y(0)} stroke={C.ink} strokeWidth={2} />
      <line x1={X(0.3)} y1={Y(0.65)} x2={X(0.3)} y2={Y(1.4)} stroke={C.coral} strokeWidth={2.4} strokeLinecap="round" />
      <rect x={X(0) - 2.5} y={Y(0.82) - 2} width={5} height={4} rx={1} fill={C.tealDeep} />
      {trail.map((p, j) => (
        <circle key={j} cx={f2(X(-p[0]))} cy={f2(Y(p[1]))} r={1.1} fill={C.teal} opacity={0.7 * (1 - j / 10)} />
      ))}
      <circle cx={f2(X(-cur[0]))} cy={f2(Y(cur[1]))} r={2.6} fill={C.teal} stroke={C.ink} strokeWidth={0.8} />
    </g>
  );
};

/* ------------------------------------------------------------------ arrival race (screen space) */

export type ArrivalRaceProps = {
  /** arrival times in ns (illustrative, from the layout) */
  tQuick: number;
  tLong: number;
  /** 0..1 drop of each block onto the axis */
  quick: number;
  long: number;
  /** 0..1 the bracket and its label */
  bracket: number;
  /** 0..1 highlight pulse on the bracket (s08 callback) */
  glow?: number;
  width?: number;
  /** the bracket's label (the scene derives it from the two arrival times) */
  gapLabel?: string;
};

/** Mini arrival timeline: two blocks drop where each echo arrives; a bracket names the delay. Card-local px. */
export const ArrivalRace: React.FC<ArrivalRaceProps> = ({tQuick, tLong, quick, long, bracket, glow = 0, width = 760, gapLabel = `≈ ${Math.round(tLong - tQuick)} ns later`}) => {
  const H = 318;
  const ax0 = 46;
  const ax1 = width - 70;
  const nsMax = 16;
  const AX = (ns: number) => ax0 + (ns / nsMax) * (ax1 - ax0);
  const axisY = 214;
  const block = (ns: number, t: number, h: number, fill: string, key: string) => {
    if (t <= 0) return null;
    // falls from above, lands at t = 1 with a small squash
    const land = clamp01(t / 0.8);
    const y = -120 * (1 - land * land);
    const sq = t > 0.8 ? Math.sin(((t - 0.8) / 0.2) * Math.PI) * 0.12 : 0;
    const w = 30 * (1 + sq);
    const hh = h * (1 - sq);
    return <rect key={key} x={f2(AX(ns) - w / 2)} y={f2(axisY - hh + y)} width={f2(w)} height={f2(hh)} rx={7} fill={fill} stroke={C.ink} strokeWidth={OUTLINE} />;
  };
  const b = clamp01(bracket);
  const bx0 = AX(tQuick);
  const bx1 = AX(tLong);
  const by = 122;
  return (
    <svg width={width} height={H} style={{overflow: 'visible', display: 'block'}}>
      <rect x={2} y={2} width={width - 4} height={H - 4} rx={20} fill={C.cream} stroke={C.ink} strokeWidth={OUTLINE} />
      <text x={30} y={52} fontFamily={F.body} fontWeight={800} fontSize={34} fill={C.inkSoft}>
        arrival time
      </text>
      <g transform={`translate(${width - 196} 20)`}>
        <rect x={0} y={0} width={170} height={46} rx={23} fill={C.white} stroke={C.inkMuted} strokeWidth={3} />
        <text x={85} y={33} textAnchor="middle" fontFamily={F.body} fontWeight={800} fontSize={30} fill={C.inkSoft}>
          illustrative
        </text>
      </g>
      {/* axis with 1 ns ticks */}
      <line x1={ax0} y1={axisY} x2={ax1 + 10} y2={axisY} stroke={C.ink} strokeWidth={4} strokeLinecap="round" />
      {Array.from({length: nsMax + 1}).map((_, i) => (
        <line key={i} x1={f2(AX(i))} y1={axisY} x2={f2(AX(i))} y2={axisY + (i % 5 === 0 ? 14 : 8)} stroke={C.ink} strokeWidth={i % 5 === 0 ? 3.5 : 2.5} strokeLinecap="round" />
      ))}
      {[0, 5, 10, 15].map((v) => (
        <text key={v} x={f2(AX(v))} y={axisY + 44} textAnchor="middle" fontFamily={F.mono} fontWeight={700} fontSize={30} fill={C.inkSoft}>
          {v}
        </text>
      ))}
      <text x={ax1 + 22} y={axisY + 44} fontFamily={F.mono} fontWeight={700} fontSize={30} fill={C.inkSoft}>
        ns
      </text>
      {block(tQuick, quick, 62, C.teal, 'q')}
      {block(tLong, long, 34, C.saffron, 'l')}
      {/* block names, under the numbers */}
      <text x={f2(AX(tQuick))} y={axisY + 88} textAnchor="middle" fontFamily={F.body} fontWeight={800} fontSize={34} fill={C.tealDeep} opacity={clamp01(quick * 1.6 - 0.6)}>
        quick bounce
      </text>
      <text x={f2(AX(tLong))} y={axisY + 88} textAnchor="middle" fontFamily={F.body} fontWeight={800} fontSize={34} fill={C.saffronDeep} opacity={clamp01(long * 1.6 - 0.6)}>
        longer trip
      </text>
      {/* bracket */}
      {b > 0 && (
        <g opacity={clamp01(b * 2)}>
          {glow > 0 && <rect x={f2(bx0 - 14)} y={by - 64} width={f2(bx1 - bx0 + 28)} height={88} rx={16} fill={C.saffronLight} opacity={clamp01(glow)} />}
          <path d={`M ${f2(bx0)} ${by + 18} L ${f2(bx0)} ${by} L ${f2(bx0 + (bx1 - bx0) * E.out(b))} ${by} ${b > 0.95 ? `L ${f2(bx1)} ${by + 18}` : ''}`} fill="none" stroke={C.ink} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />
          <text x={f2((bx0 + bx1) / 2)} y={by - 16} textAnchor="middle" fontFamily={F.mono} fontWeight={700} fontSize={44} fill={C.ink} opacity={clamp01((b - 0.4) * 2.5)}>
            {gapLabel}
          </text>
        </g>
      )}
    </svg>
  );
};

/* ------------------------------------------------------------------ the light ruler card (screen space) */

/** "1 nanosecond ≈ 30 cm ≈ 1 ft": a light ruler of 30 cm segments; a pulse dot runs along it. Card-local px. */
export const RulerCard: React.FC<{t: number; pulse: number; first: number; head: number; width?: number}> = ({t, pulse, first, head, width = 760}) => {
  const H = 290;
  const x0 = 44;
  const seg = 150; // px per 30 cm segment
  const n = 4;
  const y = 176;
  const k = E.out(clamp01(t));
  const px = x0 + clamp01(pulse) * seg * n;
  return (
    <svg width={width} height={H} style={{overflow: 'visible', display: 'block'}}>
      <rect x={2} y={2} width={width - 4} height={H - 4} rx={20} fill={C.cream} stroke={C.ink} strokeWidth={OUTLINE} />
      <text x={34} y={70} fontFamily={F.display} fontWeight={600} fontSize={48} fill={C.ink} opacity={clamp01(head * 2)}>
        1 nanosecond ≈ 30 cm ≈ 1 ft
      </text>
      {/* ruler tape */}
      <rect x={x0} y={y - 16} width={f2(seg * n * k)} height={32} rx={8} fill={C.saffronLight} stroke={C.ink} strokeWidth={4} />
      {Array.from({length: n + 1}).map((_, i) =>
        i * seg <= seg * n * k + 1 ? <line key={i} x1={x0 + i * seg} y1={y - 16} x2={x0 + i * seg} y2={y + 16} stroke={C.ink} strokeWidth={4} /> : null,
      )}
      {/* the first segment is named: 1 ns of light travel = 30 cm */}
      <g opacity={clamp01(first * 2)}>
        <path d={`M ${x0 + 4} ${y - 30} L ${x0 + 4} ${y - 40} L ${x0 + seg - 4} ${y - 40} L ${x0 + seg - 4} ${y - 30}`} fill="none" stroke={C.saffronDeep} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />
        <text x={x0 + seg / 2} y={y - 52} textAnchor="middle" fontFamily={F.mono} fontWeight={700} fontSize={34} fill={C.saffronDeep}>
          1 ns
        </text>
        <text x={x0 + seg / 2} y={y + 58} textAnchor="middle" fontFamily={F.mono} fontWeight={700} fontSize={34} fill={C.inkSoft}>
          30 cm
        </text>
      </g>
      {pulse > 0 && pulse < 1.02 && (
        <g>
          <circle cx={f2(px)} cy={y} r={14} fill={C.saffron} stroke={C.ink} strokeWidth={3.5} />
          <circle cx={f2(px - 4)} cy={y - 4} r={4.5} fill={C.cream} />
        </g>
      )}
    </svg>
  );
};
