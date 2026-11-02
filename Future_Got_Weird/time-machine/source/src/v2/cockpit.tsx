// V2 cockpit (shot 4.70-8.20 s): inside the capsule. He raises his wrist; a physical wristwatch (Watch2) on a big
// foreground forearm (ForeArm) advances ONE HOUR in a time-compressed move (minute hand one turn, hour hand 30 deg,
// seconds hand 60 turns smeared into a translucent disc), then the wrist lowers to reveal his unchanged face and the
// black hole through the round window behind him (Cockpit + CockpitFront).
// Weird Crew finish: flat fills, one ink outline per part, one cel shadow per part (key light from the upper left),
// no gradients, no text or numerals anywhere (the dial has bars and ticks only, no sub-dial).
import React from 'react';
import {getStaticFiles, staticFile} from 'remotion';
import {closed, P} from '../core/geo';
import {mix} from '../core/color';
import {clamp, sm, ss} from '../lib';
import {C, INK, OUT} from '../art/crew';
import {AstroPose, GLOVE, HEAD_Y, HELMET, SHOULDER_Y, SUIT, SUIT_DEEP} from '../art/figures';
import {BlackHole, bhFrame, hasWide} from '../art/space';
import {useImages} from './preload';

const rad = (d: number) => (d * Math.PI) / 180;
const f2 = (n: number) => (Math.abs(n) < 1e-6 ? '0' : n.toFixed(2));

// =====================================================================================================================
// 4. time compression for one hour
// =====================================================================================================================
/** speed profile: smooth ramp up over [0, a], full speed over [a, b], a longer gentle landing over [b, 1] */
export const HOUR_EASE = {a: 0.3, b: 0.62};
/** suggested duration (s) of the one-hour move: V2 timing hourStart 5.55 -> hourEnd 7.145 */
export const HOUR_DUR = 1.6;
const HOUR_T = (1 + HOUR_EASE.b - HOUR_EASE.a) / 2; // integral of the speed profile
const hourV = (u: number) => {
  const {a, b} = HOUR_EASE;
  if (u <= 0 || u >= 1) return 0;
  return u < a ? sm(u / a) : u < b ? 1 : 1 - sm((u - b) / (1 - b));
};
const smI = (x: number) => x * x * x - (x * x * x * x) / 2; // integral of smoothstep from 0 to x
const hourI = (u0: number) => {
  const {a, b} = HOUR_EASE;
  const u = clamp(u0);
  if (u < a) return a * smI(u / a);
  if (u < b) return a / 2 + (u - a);
  const y = (u - b) / (1 - b);
  return a / 2 + (b - a) + (1 - b) * (y - smI(y));
};
/** u 0..1 -> minutes after 12:00, 600 (10:00) .. 660 (11:00): slow start, fast middle, gentle landing exactly on 660 */
export const hourMinutes = (u: number) => (u >= 1 ? 660 : u <= 0 ? 600 : 600 + (60 * hourI(u)) / HOUR_T);
/** d(minutes)/du */
export const hourRate = (u: number) => (60 * hourV(clamp(u))) / HOUR_T;
/** seconds-hand motion blur for the move: the hand's travel per frame (360-degree shutter) mapped to 0..1. 0 at rest, 1 (a
 *  full disc) through the fast middle. dur = the move's length in seconds (the integrator's hourEnd - hourStart). */
export const secBlurAt = (u: number, dur = HOUR_DUR, fps = 30) => {
  const degPerFrame = (hourRate(u) * 360) / Math.max(1e-6, dur * fps);
  return clamp((degPerFrame - 6) / 330);
};

// =====================================================================================================================
// 1. Watch2: the physical analog wristwatch (no Earth inset, no numerals)
// =====================================================================================================================
export const WATCH = {
  dial: '#13213A', dialSh: '#0A1426', cream: '#FFF3D6', creamSh: '#E2D2AE',
  steel: '#B9C4CC', steelLit: '#DDE4E9', steelSh: '#8796A2',
  strap: '#2C3A47', strapSh: '#1D2832', coral: C.coral,
  /** radii as multiples of r (the dial radius) */
  caseR: 1.14, bezelR: 1.045, crownX: 1.41,
  /** strap width (along 3-9) and stub end (along 12-6), multiples of r */
  strapW: 1.04, stubEnd: 1.62,
};
/** mechanically consistent hand angles (deg clockwise from 12) for minutes after 12:00 */
export const watchAngles = (minutes: number) => ({hour: (minutes * 0.5) % 360, minute: (minutes * 6) % 360, second: (minutes * 360) % 360});

/** a pie wedge from angle a0 to a1 (deg clockwise from 12) */
const wedge = (r: number, a0: number, a1: number) => {
  const p = (a: number) => `${f2(r * Math.sin(rad(a)))} ${f2(-r * Math.cos(rad(a)))}`;
  return `M 0 0 L ${p(a0)} A ${r} ${r} 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${p(a1)} Z`;
};
const HOUR_HAND = 'M -5.5 14 L -6.8 0 L -4.6 -43 L 0 -54 L 4.6 -43 L 6.8 0 L 5.5 14 Z';
const HOUR_FACET = 'M 0 14 L 0 -54 L 4.6 -43 L 6.8 0 L 5.5 14 Z';
const MIN_HAND = 'M -4.4 17 L -5.2 0 L -3.2 -71 L 0 -82 L 3.2 -71 L 5.2 0 L 4.4 17 Z';
const MIN_FACET = 'M 0 17 L 0 -82 L 3.2 -71 L 5.2 0 L 4.4 17 Z';

export const Watch2: React.FC<{r: number; minutes: number; id: string; secBlur?: number; /** draw the short strap stubs (ForeArm draws its own full strap) */ strap?: boolean;
  /** V3: a fainter seconds blur (a graded fan that fades away from the hand, no rings), so the navy dial never tints */
  soft?: boolean; /** V3: the seconds hand's opacity, overriding the soft fade */ secA?: number}> = ({r, minutes, id, secBlur = 0, strap = true, soft = false, secA}) => {
  const k = r / 100;
  const A = watchAngles(minutes);
  const b = clamp(secBlur);
  const fan = b * 360; // the seconds hand's travel during one frame
  const disc = sm((fan - 240) / 105); // wedge -> uniform disc
  const cid = `${id}-w2`;
  const W = WATCH;
  return (
    <g transform={`scale(${k})`}>
      <defs>
        <clipPath id={`${cid}-case`}><circle r={114} /></clipPath>
        <clipPath id={`${cid}-dial`}><circle r={99} /></clipPath>
        <clipPath id={`${cid}-crown`}><rect x={121} y={-19} width={20} height={38} rx={5} /></clipPath>
      </defs>
      {/* strap stubs (12 and 6) */}
      {strap && [-1, 1].map((s) => (
        <g key={s}>
          <rect x={-52} y={s < 0 ? -162 : 96} width={104} height={66} rx={3} fill={W.strap} stroke={INK} strokeWidth={OUT} strokeLinejoin="round" />
          <rect x={26} y={s < 0 ? -160 : 98} width={24} height={62} fill={W.strapSh} />
          <path d={`M -42 ${s * 104} L -42 ${s * 154} M 42 ${s * 104} L 42 ${s * 154}`} stroke={W.cream} strokeWidth={1.6} strokeDasharray="5 5" opacity={0.28} />
          <rect x={-52} y={s < 0 ? -162 : 96} width={104} height={66} rx={3} fill="none" stroke={INK} strokeWidth={OUT} strokeLinejoin="round" />
        </g>
      ))}
      {/* lugs */}
      {[-1, 1].map((sx) => [-1, 1].map((sy) => (
        <path key={`${sx}${sy}`} d={`M ${sx * 52} ${sy * 92} L ${sx * 52} ${sy * 124} Q ${sx * 58} ${sy * 130} ${sx * 64} ${sy * 124} L ${sx * 66} ${sy * 88} Z`} fill={sx > 0 ? W.steelSh : W.steel} stroke={INK} strokeWidth={2.6} strokeLinejoin="round" />
      )))}
      {/* crown at 3 o'clock */}
      <rect x={108} y={-8} width={16} height={16} fill={W.steelSh} stroke={INK} strokeWidth={2.4} />
      <rect x={121} y={-19} width={20} height={38} rx={5} fill={W.steel} />
      <g clipPath={`url(#${cid}-crown)`}>
        <rect x={121} y={5} width={20} height={16} fill={W.steelSh} />
        {[126, 131, 136].map((x) => <line key={x} x1={x} y1={-16} x2={x} y2={16} stroke={INK} strokeWidth={1.5} opacity={0.5} />)}
      </g>
      <rect x={121} y={-19} width={20} height={38} rx={5} fill="none" stroke={INK} strokeWidth={3} />
      {/* case: brushed steel ring, one cel shadow (lower right), polished bezel edge */}
      <circle r={114} fill={W.steelSh} />
      <circle cx={-5} cy={-6} r={113} fill={W.steel} clipPath={`url(#${cid}-case)`} />
      {Array.from({length: 5}, (_, i) => (
        <circle key={i} r={105.5 + i * 1.8} fill="none" stroke={i % 2 ? '#FFFFFF' : INK} strokeWidth={0.7} opacity={i % 2 ? 0.28 : 0.08} />
      ))}
      <path d={`M ${f2(-109 * Math.cos(rad(35)))} ${f2(-109 * Math.sin(rad(35)))} A 109 109 0 0 1 ${f2(-109 * Math.cos(rad(80)))} ${f2(-109 * Math.sin(rad(80)))}`} fill="none" stroke="#FFFFFF" strokeWidth={4} strokeLinecap="round" opacity={0.7} />
      <circle r={104.5} fill="none" stroke={W.steelLit} strokeWidth={2.2} opacity={0.9} />
      <circle r={114} fill="none" stroke={INK} strokeWidth={OUT} />
      {/* dial, with the bezel's shadow on its upper-left inner edge */}
      <circle r={100} fill={W.dialSh} />
      <circle cx={4} cy={5} r={99} fill={W.dial} clipPath={`url(#${cid}-dial)`} />
      <circle r={100} fill="none" stroke={INK} strokeWidth={3} />
      {/* minute ticks */}
      {Array.from({length: 60}, (_, i) => i % 5 === 0 ? null : (
        <line key={i} x1={0} y1={-94} x2={0} y2={-88} stroke={W.cream} strokeWidth={1.5} strokeLinecap="round" transform={`rotate(${i * 6})`} opacity={0.85} />
      ))}
      {/* 12 applied hour bars (a double bar at 12), each with a small cast shadow */}
      {Array.from({length: 12}, (_, i) => {
        const bars = i === 0 ? [-5.5, 5.5] : [0];
        const w = i === 0 ? 5.4 : 7;
        const y0 = i % 3 === 0 ? -93 : -92, len = i % 3 === 0 ? 25 : 21;
        return (
          <g key={i} transform={`rotate(${i * 30})`}>
            {bars.map((bx) => (
              <g key={bx}>
                <rect x={bx - w / 2 + 1.4} y={y0 + 1.6} width={w} height={len} rx={1.2} fill="#000000" opacity={0.35} />
                <rect x={bx - w / 2} y={y0} width={w} height={len} rx={1.2} fill={W.cream} stroke="#08101E" strokeWidth={1.1} />
              </g>
            ))}
          </g>
        );
      })}
      {/* hand shadows (offset down-right, away from the key light) */}
      <g transform="translate(2.6 3.6)" opacity={0.4}>
        <path d={HOUR_HAND} transform={`rotate(${A.hour})`} fill="#000000" />
        <path d={MIN_HAND} transform={`rotate(${A.minute})`} fill="#000000" />
      </g>
      {/* hour hand */}
      <g transform={`rotate(${A.hour})`}>
        <path d={HOUR_HAND} fill={W.cream} />
        <path d={HOUR_FACET} fill={W.creamSh} />
        <path d={HOUR_HAND} fill="none" stroke={INK} strokeWidth={1.6} strokeLinejoin="round" />
      </g>
      {/* minute hand, with a faint trailing smear when the hour races */}
      {b > 0.05 && <path d={wedge(80, A.minute - 14 * b, A.minute)} fill={W.cream} opacity={0.12 * b} />}
      <g transform={`rotate(${A.minute})`}>
        <path d={MIN_HAND} fill={W.cream} />
        <path d={MIN_FACET} fill={W.creamSh} />
        <path d={MIN_HAND} fill="none" stroke={INK} strokeWidth={1.5} strokeLinejoin="round" />
      </g>
      {/* seconds hand: at speed it smears into a translucent coral fan, then a disc (never a strobe) */}
      {!soft && b > 0.01 && disc < 0.999 && [1, 2, 3, 4, 5].map((i) => (
        <path key={i} d={wedge(88, A.second - (Math.max(fan, 4) * i) / 5, A.second)} fill={W.coral} opacity={0.07 * (1 - disc)} />
      ))}
      {!soft && disc > 0.001 && (
        <g opacity={disc}>
          <circle r={88} fill={W.coral} opacity={0.085} />
          <circle r={86} fill="none" stroke={W.coral} strokeWidth={4} opacity={0.28} />
          <circle r={17} fill="none" stroke={W.coral} strokeWidth={7} opacity={0.14} />
        </g>
      )}
      {/* (soft: while its travel per frame is too fast to read, the seconds hand is simply not drawn - no fan, no strobe -
          and it fades back in as it slows below ~20 degrees a frame) */}
      <g transform={`rotate(${A.second})`} opacity={secA !== undefined ? secA : soft ? 1 - ss(b, 0.025, 0.07) : 1 - 0.78 * b}>
        <line x1={0} y1={24} x2={0} y2={-88} stroke={W.coral} strokeWidth={2.1} strokeLinecap="round" />
        <circle cy={17} r={4.6} fill={W.coral} stroke={INK} strokeWidth={1} />
      </g>
      {/* centre cap */}
      <circle r={6.2} fill={W.coral} stroke={INK} strokeWidth={1.6} />
      <circle cx={-1.8} cy={-1.8} r={1.7} fill="#FFFFFF" opacity={0.7} />
      {/* crystal: one flat sheen, a glint arc and a sparkle */}
      <g clipPath={`url(#${cid}-dial)`}>
        <path d="M -110 -110 L 110 -110 L 110 -58 Q 10 -40 -110 64 Z" fill="#FFFFFF" opacity={0.06} />
      </g>
      <path d={`M ${f2(-84 * Math.cos(rad(28)))} ${f2(-84 * Math.sin(rad(28)))} A 84 84 0 0 1 ${f2(-84 * Math.cos(rad(62)))} ${f2(-84 * Math.sin(rad(62)))}`} fill="none" stroke="#FFFFFF" strokeWidth={5} strokeLinecap="round" opacity={0.5} />
      <circle cx={-80} cy={-12} r={2.6} fill="#FFFFFF" opacity={0.5} />
      <path d={`M ${f2(84 * Math.cos(rad(20)))} ${f2(84 * Math.sin(rad(20)))} A 84 84 0 0 1 ${f2(84 * Math.cos(rad(48)))} ${f2(84 * Math.sin(rad(48)))}`} fill="none" stroke="#FFFFFF" strokeWidth={2.5} strokeLinecap="round" opacity={0.18} />
    </g>
  );
};

// =====================================================================================================================
// 2. ForeArm: his LEFT forearm, close to camera, with Watch2 strapped over the suit sleeve
// =====================================================================================================================
/** ForeArm local frame: watch centre (0, 0), watch r = 100. The arm axis is rotated by ANGLE (deg): the elbow lies
 *  down-left (off any frame edge), the glove up-right. The watch's 3 o'clock (crown) points toward the hand. */
export const FOREARM = {
  angle: -24, watchR: 100, len: 900,
  /** sleeve half-width at the watch and at the far end */
  halfW: 146, halfWFar: 166,
  /** saffron cuff ring (glove joint), along the axis */
  cuff0: 156, cuff1: 206, cuffHalfW: 158,
  /** glove: gauntlet start, wrist pivot and wrist bend (deg, + = hand droops) */
  gauntlet0: 198, wrist: 238, bend: 14,
  /** saffron sleeve stripes along the axis (wide, thin) */
  stripe: [-470, -424, -406, -392],
};
const SH_OVER = '#3A5A78'; // cool shadow overlay (0.22 over white = SUIT_SH)
const GLOVE_SH = mix(GLOVE, SUIT_DEEP, 0.6);
/** a point at distance d along the forearm axis (+ = toward the hand) and o across it (+ = lower side), ForeArm-local */
export const forearmPoint = (d: number, o = 0, s = 1) => {
  const a = rad(FOREARM.angle);
  return {x: s * (d * Math.cos(a) - o * Math.sin(a)), y: s * (d * Math.sin(a) + o * Math.cos(a))};
};
/** attach points, ForeArm-local at s = 1 */
export const FOREARM_GLOVE = forearmPoint(FOREARM.wrist + 100, 24);
export const FOREARM_ELBOW = forearmPoint(-FOREARM.len, 0);
export const FOREARM_CUFF = forearmPoint((FOREARM.cuff0 + FOREARM.cuff1) / 2, 0);

/** fill + clipped cel shadow (and extras) + one ink outline */
const Part: React.FC<{d: string; fill: string; id: string; sh?: string; shD?: string; shOp?: number; w?: number; children?: React.ReactNode}> = ({d, fill, id, sh, shD, shOp = 1, w = OUT, children}) => (
  <g>
    <path d={d} fill={fill} />
    {(shD || children) && (
      <>
        <clipPath id={id}><path d={d} /></clipPath>
        <g clipPath={`url(#${id})`}>
          {shD && <path d={shD} fill={sh ?? INK} opacity={shOp} />}
          {children}
        </g>
      </>
    )}
    <path d={d} fill="none" stroke={INK} strokeWidth={w} strokeLinejoin="round" strokeLinecap="round" />
  </g>
);
/** a band around the sleeve between x0 and x1 (arm frame), its edges bowed toward the far (elbow) end */
const band = (x0: number, x1: number, h: number, bow: number) => `M ${x0} ${-h} Q ${x0 - 2 * bow} 0 ${x0} ${h} L ${x1} ${h} Q ${x1 - 2 * bow} 0 ${x1} ${-h} Z`;
const pts = (a: number[][]): P[] => a.map(([x, y]) => ({x, y}));
// the glove hand, in hand-local units (origin at the wrist pivot, x toward the fingers, +y = the thumb side, lower):
// a relaxed, loosely curled left hand seen from the back: back of the hand with four knuckle bumps, the fingers folded
// down into a rounded fist front (three creases part them), the thumb tucked along the lower side.
const BACK_OF_HAND = closed(pts([[-14, -106], [40, -114], [90, -118], [118, -110], [133, -92], [128, -66], [139, -44], [134, -18], [143, 8], [138, 34], [141, 58], [128, 84], [104, 104], [60, 114], [10, 116], [-14, 110]]));
const FIST = closed(pts([[96, -112], [138, -112], [170, -98], [190, -70], [202, -32], [204, 10], [198, 50], [182, 86], [156, 112], [124, 124], [100, 112], [92, 0]]));
const THUMB = closed(pts([[24, 70], [74, 104], [124, 124], [162, 124], [186, 106], [192, 84], [178, 72], [158, 82], [126, 96], [82, 86], [40, 62]]));
const CREASES = [-62, -6, 48];
const PIPS = [-88, -34, 20, 70];

/** outline weight of the forearm's parts in local units: a little heavier than OUT, since the arm is the nearest thing
 *  to the camera (at s = 1.5 it draws ~8 px, matching the seated figure's ~9 px at COCKPIT_ASTRO.s) */
export const FOREARM_INK = 5.5;
export const ForeArm: React.FC<{minutes: number; secBlur: number; id: string; s?: number; /** extra rotation (deg) about the watch centre */ rot?: number; /** outline weight (local units) */ ink?: number}> = ({minutes, secBlur, id, s = 1, rot = 0, ink = FOREARM_INK}) => {
  const F = FOREARM;
  const L = F.len, hw = F.halfW, hwF = F.halfWFar;
  const sleeve = `M ${-L} ${-hwF} C ${-L * 0.55} ${-hwF + 2} -260 ${-hw - 5} ${F.cuff0 + 10} ${-hw} L ${F.cuff0 + 10} ${hw} C -260 ${hw + 6} ${-L * 0.55} ${hwF + 3} ${-L} ${hwF + 2} Z`;
  const sleeveSh = `M ${-L - 10} ${hwF - 66} C -620 ${hwF - 50} -330 ${hw - 26} -150 ${hw - 44} C -40 ${hw - 56} 60 ${hw - 40} ${F.cuff0 + 20} ${hw - 44} L ${F.cuff0 + 20} ${hw + 40} L ${-L - 10} ${hwF + 60} Z`;
  const fold = (d: string, op = 0.4, w = 3) => <path d={d} fill="none" stroke={INK} strokeWidth={w} strokeLinecap="round" opacity={op} />;
  const gx0 = F.gauntlet0, gx1 = F.wrist + 14;
  return (
    <g transform={`scale(${s}) rotate(${F.angle + rot})`}>
      {/* ---- the sleeve ---- */}
      <Part w={ink} id={`${id}-slv`} d={sleeve} fill={SUIT}>
        {/* saffron stripes around the forearm (his striped tee, carried into the suit) */}
        <path d={band(F.stripe[0], F.stripe[1], hwF + 20, 14)} fill={C.saffron} />
        <path d={band(F.stripe[2], F.stripe[3], hwF + 20, 14)} fill={C.saffron} />
        <path d={sleeveSh} fill={SH_OVER} opacity={0.22} />
        {/* fabric folds: the sleeve bunches under the strap and toward the cuff */}
        {fold(`M -92 ${-hw - 2} Q -110 ${-hw + 40} -86 ${-hw + 68}`)}
        {fold(`M -146 ${-hw - 4} Q -156 ${-hw + 20} -136 ${-hw + 36}`, 0.3, 2.6)}
        {fold(`M -112 ${hw + 2} Q -136 ${hw - 40} -102 ${hw - 70}`)}
        {fold(`M -180 ${hw + 4} Q -190 ${hw - 20} -170 ${hw - 38}`, 0.3, 2.6)}
        {fold(`M 92 ${-hw - 2} Q 84 ${-hw + 26} 100 ${-hw + 46}`, 0.35, 2.6)}
        {fold(`M 104 ${hw + 2} Q 96 ${hw - 26} 114 ${hw - 46}`, 0.35, 2.6)}
        {fold(`M -640 -50 Q -560 -20 -470 -38`, 0.18, 3)}
        {fold(`M -330 60 Q -260 80 -200 64`, 0.18, 3)}
        {/* the watch's cast shadow on the sleeve */}
        <ellipse cx={12} cy={16} rx={130} ry={126} fill={SH_OVER} opacity={0.18} />
      </Part>
      {/* ---- the strap, wrapped round the sleeve ---- */}
      <Part w={ink} id={`${id}-strap`} d={band(-52, 52, hw + 5, 6)} fill={WATCH.strap} sh={WATCH.strapSh} shD={`M -80 ${hw - 34} L 80 ${hw - 34} L 80 ${hw + 20} L -80 ${hw + 20} Z`}>
        <path d={`M -42 ${-hw} L -42 -118 M 42 ${-hw} L 42 -118 M -42 ${hw} L -42 118 M 42 ${hw} L 42 118`} stroke={WATCH.cream} strokeWidth={1.6} strokeDasharray="5 5" opacity={0.25} />
      </Part>
      <ellipse cx={9} cy={13} rx={118} ry={118} fill="#000000" opacity={0.16} />
      <Watch2 r={F.watchR} minutes={minutes} secBlur={secBlur} id={`${id}-w`} strap={false} />
      {/* ---- the glove: gauntlet, then the hand curled beyond the cuff ---- */}
      <Part w={ink} id={`${id}-gnt`} d={`M ${gx0} -140 L ${gx1} -128 Q ${gx1 + 12} 0 ${gx1} 128 L ${gx0} 140 Z`} fill={GLOVE} sh={GLOVE_SH} shD={`M ${gx0 - 10} 84 Q ${gx0 + 40} 96 ${gx1 + 20} 86 L ${gx1 + 20} 200 L ${gx0 - 10} 200 Z`}>
        {/* the cuff ring's cast shadow */}
        <path d={band(F.cuff1 - 4, F.cuff1 + 12, 200, 8)} fill={SH_OVER} opacity={0.25} />
      </Part>
      <g transform={`translate(${F.wrist} 0) rotate(${F.bend})`}>
        <Part w={ink} id={`${id}-fist`} d={FIST} fill={GLOVE} sh={GLOVE_SH} shD="M 80 36 Q 150 30 230 0 L 230 200 L 80 200 Z">
          {CREASES.map((y, i) => (
            <path key={i} d={`M 136 ${y} Q 170 ${y + 4 + i * 3} 194 ${y + 14 + i * 8}`} fill="none" stroke={INK} strokeWidth={3} strokeLinecap="round" opacity={0.55} />
          ))}
          {PIPS.map((y, i) => (
            <path key={i} d={`M 176 ${y - 13 + i * 3} Q 188 ${y + i * 3} 178 ${y + 13 + i * 3}`} fill="none" stroke={INK} strokeWidth={2.2} strokeLinecap="round" opacity={0.22} />
          ))}
          <path d="M 150 -104 Q 180 -92 194 -62" fill="none" stroke="#FFFFFF" strokeWidth={6} strokeLinecap="round" opacity={0.75} />
        </Part>
        <Part w={ink} id={`${id}-thb`} d={THUMB} fill={GLOVE} sh={GLOVE_SH} shD="M 0 96 Q 100 122 210 96 L 210 220 L 0 220 Z">
          <path d="M 164 90 Q 176 98 172 112" fill="none" stroke={INK} strokeWidth={2.2} strokeLinecap="round" opacity={0.3} />
        </Part>
        <Part w={ink} id={`${id}-boh`} d={BACK_OF_HAND} fill={GLOVE} sh={GLOVE_SH} shD="M -40 66 Q 60 90 170 74 L 170 220 L -40 220 Z">
          {/* knuckles, two stitched seams and a highlight */}
          {PIPS.map((y, i) => (
            <path key={i} d={`M 112 ${y - 12} Q 124 ${y} 112 ${y + 12}`} fill="none" stroke={INK} strokeWidth={2.4} strokeLinecap="round" opacity={0.28} />
          ))}
          <path d="M 4 -60 Q 54 -70 98 -66" fill="none" stroke={SUIT_DEEP} strokeWidth={2.4} strokeDasharray="7 6" strokeLinecap="round" opacity={0.8} />
          <path d="M 4 28 Q 54 20 98 26" fill="none" stroke={SUIT_DEEP} strokeWidth={2.4} strokeDasharray="7 6" strokeLinecap="round" opacity={0.6} />
          <path d="M 14 -94 Q 60 -104 104 -100" fill="none" stroke="#FFFFFF" strokeWidth={6} strokeLinecap="round" opacity={0.75} />
        </Part>
      </g>
      {/* ---- the saffron cuff ring (glove joint), over the sleeve end and the gauntlet ---- */}
      <Part w={ink} id={`${id}-cuff`} d={band(F.cuff0, F.cuff1, F.cuffHalfW, 8)} fill={C.saffron} sh={C.saffronDeep} shD={`M ${F.cuff0 - 40} 84 Q ${F.cuff0 + 20} 96 ${F.cuff1 + 20} 88 L ${F.cuff1 + 20} 240 L ${F.cuff0 - 40} 240 Z`}>
        <path d={`M ${(F.cuff0 + F.cuff1) / 2} ${-F.cuffHalfW} Q ${(F.cuff0 + F.cuff1) / 2 - 16} 0 ${(F.cuff0 + F.cuff1) / 2} ${F.cuffHalfW}`} fill="none" stroke={INK} strokeWidth={2.4} opacity={0.35} />
        <path d={`M ${F.cuff0 + 8} ${-F.cuffHalfW + 9} L ${F.cuff1 - 12} ${-F.cuffHalfW + 9}`} stroke="#FFFFFF" strokeWidth={5} strokeLinecap="round" opacity={0.55} />
      </Part>
    </g>
  );
};

// =====================================================================================================================
// 3. Cockpit: the cabin set (world px, framing a 1080x1920 view centred on 540, 960)
// =====================================================================================================================
/** the round window (glass radius r) up-left behind his head */
export const COCKPIT_WIN = {x: 352, y: 700, r: 288};
/** steel rim width around the glass */
export const COCKPIT_RIM = 52;
/** where to draw the seated Astronaut: translate(x y) scale(s) (his local ground at y = 0 lies below the frame) */
export const COCKPIT_ASTRO = {x: 612, y: 2034, s: 2.25};
/** his helmet bubble in world px (derived) */
export const COCKPIT_HELMET = {
  x: COCKPIT_ASTRO.x + HELMET.cx * COCKPIT_ASTRO.s,
  y: COCKPIT_ASTRO.y + (HEAD_Y + HELMET.cy) * COCKPIT_ASTRO.s,
  r: HELMET.r * COCKPIT_ASTRO.s,
};
/** his face centre in world px (head centre) */
export const COCKPIT_FACE = {x: COCKPIT_ASTRO.x, y: COCKPIT_ASTRO.y + HEAD_Y * COCKPIT_ASTRO.s};
/** the black-hole image inside the window: px per M and the offset that centres the lensed disk in the glass */
const BH_K = (0.86 * 2 * COCKPIT_WIN.r) / 30.5;
export const COCKPIT_BH = {k: BH_K, dx: 1.75 * BH_K, dy: 0.55 * BH_K};
/** seat back (headrest top, widths) and the console's top edge (CockpitFront), world px */
export const COCKPIT_SEAT = {x: COCKPIT_ASTRO.x, headTop: 902, headW: 372, backTop: 1236, backW: 660};
export const COCKPIT_CONSOLE_Y = 1690;
/** a suggested seated pose: left arm hangs (the foreground ForeArm stands in for it), right arm rests; look 0..1 = eyes
 *  on the watch (down-left) */
export const cockpitPose = (look = 1): AstroPose => ({
  armL: {a: 16, b: 8}, armR: {a: 14, b: 18},
  e: {mouth: 'soft', brows: 0.1, lookX: -0.45 * look, lookY: 0.2 + 0.6 * look, blink: 1},
});

const WALL = {
  base: '#2B4D5A', panel: '#33596A', lit: '#4A7889', dark: '#20404C', screw: '#5D8796',
  side: '#1F3B47', sidePanel: '#264654', ceil: '#183039', ceilPanel: '#1F3A45',
  seat: '#4A69A8', seatSh: '#37528C', seatLit: '#6787C4', seatSeam: '#2E4577',
  glow: '#FF9A55', glowHot: '#FFC27A',
};

/** black-hole frames exist only for some film times; inside the cockpit (4.70-8.20 s) the window plays the nearest
 *  available frames (ping-pong over 0..5 s) unless frames for t itself exist (e.g. after V2 renders them). */
let staticNames: Set<string> | null = null;
const frameExists = (n: number) => {
  if (staticNames === null) {
    try {
      staticNames = new Set(getStaticFiles().map((f) => f.name.replace(/^\/+/, '')));
    } catch {
      staticNames = new Set();
    }
  }
  if (staticNames.size > 0) return staticNames.has(`bh/f_${String(n).padStart(4, '0')}.jpg`);
  return (n >= 0 && n <= 150) || (n >= 538 && n <= 708);
};
export const cockpitBhT = (t: number) => {
  if (frameExists(bhFrame(t))) return t;
  const x = ((t % 10) + 10) % 10;
  return x <= 5 ? x : 10 - x;
};
/** the image URLs the window shows at film time t (Cockpit preloads them itself) */
export const cockpitBhUrls = (bhT: number) => {
  const n = bhFrame(bhT);
  const f4 = String(n).padStart(4, '0');
  return [staticFile(`bh/f_${f4}.jpg`), ...(hasWide(n) ? [staticFile(`bhw/f_${f4}.jpg`)] : [])];
};

/** a raised wall panel: ink outline, lit top-left inner edge, shadowed bottom-right inner edge, corner screws */
const Panel: React.FC<{x: number; y: number; w: number; h: number; c?: string; lit?: string; dark?: string; rx?: number; screws?: boolean}> = ({x, y, w, h, c = WALL.panel, lit = WALL.lit, dark = WALL.dark, rx = 20, screws = true}) => {
  const i = 9;
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={rx} fill={c} stroke={INK} strokeWidth={3.5} />
      <path d={`M ${x + i} ${y + h - rx} L ${x + i} ${y + rx} Q ${x + i} ${y + i} ${x + rx} ${y + i} L ${x + w - rx} ${y + i}`} fill="none" stroke={lit} strokeWidth={3.5} strokeLinecap="round" />
      <path d={`M ${x + w - i} ${y + rx} L ${x + w - i} ${y + h - rx} Q ${x + w - i} ${y + h - i} ${x + w - rx} ${y + h - i} L ${x + rx} ${y + h - i}`} fill="none" stroke={dark} strokeWidth={3.5} strokeLinecap="round" />
      {screws && [[x + 22, y + 22], [x + w - 22, y + 22], [x + 22, y + h - 22], [x + w - 22, y + h - 22]].map(([sx, sy], k) => (
        <circle key={k} cx={sx} cy={sy} r={4.5} fill={WALL.screw} stroke={INK} strokeWidth={1.6} />
      ))}
    </g>
  );
};
/** an indicator light with a small halo; on 0..1 */
const Lamp: React.FC<{x: number; y: number; c: string; on?: number; r?: number}> = ({x, y, c, on = 1, r = 9}) => (
  <g>
    <circle cx={x} cy={y} r={r * 2.4} fill={c} opacity={0.16 * on} />
    <circle cx={x} cy={y} r={r} fill={mix('#1A2A30', c, 0.35 + 0.65 * on)} stroke={INK} strokeWidth={2.5} />
    <circle cx={x - r * 0.3} cy={y - r * 0.3} r={r * 0.3} fill="#FFFFFF" opacity={0.6 * on} />
  </g>
);
const blink = (t: number, period: number, phase: number, duty = 0.5) => ((((t / period + phase) % 1) + 1) % 1 < duty ? 1 : 0.25);

export const Cockpit: React.FC<{t: number; id: string; /** override the black-hole image time */ bhT?: number}> = ({t, id, bhT}) => {
  const bt = bhT ?? cockpitBhT(t);
  useImages(cockpitBhUrls(bt));
  const Wn = COCKPIT_WIN, R = COCKPIT_RIM;
  const S = COCKPIT_SEAT;
  // back wall: a tall rounded bay; the curved side walls and ceiling show around it
  const bay = `M 70 2700 L 56 720 Q 66 236 540 176 Q 1014 236 1024 720 L 1010 2700 Z`;
  const head = `M ${S.x - S.headW / 2} ${S.headTop + 90} Q ${S.x - S.headW / 2} ${S.headTop} ${S.x} ${S.headTop - 4} Q ${S.x + S.headW / 2} ${S.headTop} ${S.x + S.headW / 2} ${S.headTop + 90} L ${S.x + S.headW / 2 - 8} ${S.backTop + 30} L ${S.x - S.headW / 2 + 8} ${S.backTop + 30} Z`;
  const back = `M ${S.x - S.backW / 2} 2600 L ${S.x - S.backW / 2} ${S.backTop + 120} Q ${S.x - S.backW / 2} ${S.backTop} ${S.x - S.backW / 2 + 120} ${S.backTop} L ${S.x + S.backW / 2 - 120} ${S.backTop} Q ${S.x + S.backW / 2} ${S.backTop} ${S.x + S.backW / 2} ${S.backTop + 120} L ${S.x + S.backW / 2} 2600 Z`;
  const toWin = Math.atan2(Wn.y - S.headTop, Wn.x - S.x); // direction from the seat to the window (for rim light)
  // panels near the window catch the disk's warm light on their lit edges
  const warmAt = (x: number, y: number, w: number, h: number) => {
    const d = Math.hypot(clamp(Wn.x, x, x + w) - Wn.x, clamp(Wn.y, y, y + h) - Wn.y) - (Wn.r + R);
    return clamp(1 - d / 240);
  };
  return (
    <g>
      <defs>
        <clipPath id={`${id}-glass`}><circle cx={Wn.x} cy={Wn.y} r={Wn.r} /></clipPath>
        <clipPath id={`${id}-bay`}><path d={bay} /></clipPath>
        <clipPath id={`${id}-head`}><path d={head} /></clipPath>
        <clipPath id={`${id}-back`}><path d={back} /></clipPath>
      </defs>
      {/* ---- side walls and ceiling (turned away from the light: darker), curved seams converging ---- */}
      <rect x={-800} y={-900} width={2680} height={3800} fill={WALL.side} />
      {[-1, 1].map((sd) => (
        <g key={sd}>
          {[0, 1, 2, 3, 4, 5, 6].map((k) => {
            const y = 300 + k * 330;
            const xi = sd < 0 ? 56 : 1024, xo = sd < 0 ? -700 : 1780;
            return <path key={k} d={`M ${xi} ${y} Q ${(xi + xo) / 2} ${y + 40 + k * 26} ${xo} ${y + 120 + k * 70}`} fill="none" stroke={INK} strokeWidth={3.5} opacity={0.55} />;
          })}
          <path d={`M ${sd < 0 ? 18 : 1062} 2700 L ${sd < 0 ? 4 : 1076} 700 Q ${sd < 0 ? 14 : 1066} 300 ${sd < 0 ? 150 : 930} 230`} fill="none" stroke={WALL.sidePanel} strokeWidth={22} />
        </g>
      ))}
      {/* ceiling: panels and a cabin light strip along the curve */}
      <path d="M -700 -900 L 1780 -900 L 1780 330 Q 1014 140 540 120 Q 66 140 -700 330 Z" fill={WALL.ceil} />
      {[-560, -300, -40, 220, 480, 740, 1000, 1260, 1520].map((x, k) => (
        <path key={k} d={`M ${x + 120} -900 L ${540 + (x + 120 - 540) * 0.62} ${150 + Math.abs(x + 120 - 540) * 0.09}`} stroke={INK} strokeWidth={3.5} opacity={0.5} fill="none" />
      ))}
      <path d="M 170 120 Q 540 34 910 120" fill="none" stroke={INK} strokeWidth={30} strokeLinecap="round" />
      <path d="M 170 120 Q 540 34 910 120" fill="none" stroke="#FFF3D6" strokeWidth={22} strokeLinecap="round" />
      <path d="M 200 128 Q 540 50 880 128" fill="none" stroke="#FFF3D6" strokeWidth={90} strokeLinecap="round" opacity={0.08} />
      {/* ---- the back wall ---- */}
      <path d={bay} fill={WALL.base} />
      <g clipPath={`url(#${id}-bay)`}>
        {/* panels in rows that follow the hull's curve */}
        {[[80, 250, 230, 300], [320, 210, 230, 300], [560, 210, 220, 300], [790, 250, 222, 300],
          [80, 566, 230, 330], [320, 526, 230, 330], [560, 526, 220, 330], [790, 566, 222, 330],
          [80, 912, 230, 330], [320, 872, 230, 330], [560, 872, 220, 330], [790, 912, 222, 330],
          [80, 1258, 230, 360], [320, 1218, 230, 360], [560, 1218, 220, 360], [790, 1258, 222, 360],
          [80, 1634, 230, 420], [320, 1594, 230, 420], [560, 1594, 220, 420], [790, 1634, 222, 420]].map(([x, y, w, h], k) => (
          <Panel key={k} x={x} y={y} w={w} h={h} c={k % 4 === 0 || k % 4 === 3 ? mix(WALL.panel, WALL.side, 0.25) : WALL.panel} lit={mix(WALL.lit, WALL.glowHot, 0.7 * warmAt(x, y, w, h))} />
        ))}
        {/* a structural rib on the right and a stringer behind the seat */}
        <rect x={1000} y={160} width={40} height={2600} fill={WALL.sidePanel} stroke={INK} strokeWidth={3.5} />
        <rect x={-40} y={1560} width={1200} height={34} rx={6} fill="#8FA3AE" stroke={INK} strokeWidth={3.5} />
        <rect x={-40} y={1560} width={1200} height={10} rx={4} fill="#B7C6CE" />
        {[150, 960].map((x) => <rect key={x} x={x - 14} y={1552} width={28} height={50} rx={5} fill="#5D7380" stroke={INK} strokeWidth={3} />)}
        {/* instrument cluster, upper right: a scope screen with a trace, a dial gauge, toggles and lamps (no text) */}
        <g>
          <rect x={808} y={300} width={190} height={130} rx={16} fill="#13282E" stroke={INK} strokeWidth={4} />
          <path d={`M 822 ${365} ${Array.from({length: 33}, (_, i) => `L ${822 + i * 5} ${f2(365 + 26 * Math.sin(i * 0.55 + t * 5) * Math.exp(-((i - 16) ** 2) / 180))}`).join(' ')}`} fill="none" stroke="#5FE0C8" strokeWidth={3.5} strokeLinejoin="round" />
          <path d="M 822 365 L 984 365" stroke="#5FE0C8" strokeWidth={1.5} opacity={0.3} />
          <path d="M 826 316 L 862 316" stroke="#FFFFFF" strokeWidth={4} strokeLinecap="round" opacity={0.25} />
          <circle cx={868} cy={520} r={52} fill={C.cream} stroke={INK} strokeWidth={4} />
          {Array.from({length: 9}, (_, i) => <line key={i} x1={868} y1={478} x2={868} y2={490} stroke={INK} strokeWidth={3} strokeLinecap="round" transform={`rotate(${-120 + i * 30} 868 520)`} />)}
          <path d="M 868 520 A 40 40 0 0 1 902 498" fill="none" stroke={C.coral} strokeWidth={6} opacity={0.6} transform="rotate(35 868 520)" />
          <line x1={868} y1={520} x2={868} y2={482} stroke={C.coralDeep} strokeWidth={4.5} strokeLinecap="round" transform={`rotate(${-30 + 6 * Math.sin(t * 2.1)} 868 520)`} />
          <circle cx={868} cy={520} r={7} fill={INK} />
          {[0, 1, 2].map((i) => (
            <g key={i}>
              <rect x={826 + i * 44} y={598} width={30} height={46} rx={8} fill="#1B3038" stroke={INK} strokeWidth={3} />
              <rect x={832 + i * 44} y={i === 1 ? 622 : 602} width={18} height={18} rx={5} fill={i === 1 ? C.saffron : '#C9D3DC'} stroke={INK} strokeWidth={2.5} />
            </g>
          ))}
          <Lamp x={958} y={488} c={C.teal} on={1} />
          <Lamp x={958} y={526} c={C.saffron} on={blink(t, 1.1, 0.2)} />
          <Lamp x={958} y={564} c={C.coral} on={blink(t, 0.7, 0.55, 0.35)} />
        </g>
        {/* lamps lower left, and a vent grille */}
        <rect x={110} y={1300} width={170} height={110} rx={14} fill="#1E3944" stroke={INK} strokeWidth={3.5} />
        {[0, 1, 2, 3, 4].map((i) => <rect key={i} x={126} y={1314 + i * 19} width={138} height={9} rx={4.5} fill="#0F2229" />)}
        <Lamp x={140} y={1470} c={C.teal} on={blink(t, 2.0, 0.1, 0.8)} />
        <Lamp x={180} y={1470} c={C.saffron} on={1} />
        <Lamp x={220} y={1470} c={C.teal} on={blink(t, 1.6, 0.6, 0.6)} />
        {/* grab handle, right */}
        <path d="M 930 760 L 958 760 L 958 1040 L 930 1040" fill="none" stroke={INK} strokeWidth={26} strokeLinejoin="round" strokeLinecap="round" />
        <path d="M 930 760 L 958 760 L 958 1040 L 930 1040" fill="none" stroke={C.saffron} strokeWidth={16} strokeLinejoin="round" strokeLinecap="round" />
        <path d="M 952 790 L 952 1010" stroke={C.saffronDeep} strokeWidth={5} strokeLinecap="round" />
        {/* the disk's warm light spilling around the window (stepped, flat) */}
        {[170, 80].map((d, k) => <circle key={k} cx={Wn.x} cy={Wn.y} r={Wn.r + R + d} fill="#FF7A2E" opacity={0.075} />)}
      </g>
      <path d={bay} fill="none" stroke={INK} strokeWidth={5} />
      {/* ---- the window: steel rim with bolts, a tunnel bevel, the glass with the black hole ---- */}
      <circle cx={Wn.x} cy={Wn.y} r={Wn.r + R} fill="#A3B4BF" />
      <circle cx={Wn.x + 7} cy={Wn.y + 8} r={Wn.r + R - 4} fill="#7E909C" clipPath={`url(#${id}-glassrim)`} />
      <clipPath id={`${id}-glassrim`}><circle cx={Wn.x} cy={Wn.y} r={Wn.r + R} /></clipPath>
      <circle cx={Wn.x - 3} cy={Wn.y - 4} r={Wn.r + R - 6} fill="#A3B4BF" clipPath={`url(#${id}-glassrim)`} />
      <path d={`M ${f2(Wn.x + (Wn.r + R - 10) * Math.cos(rad(200)))} ${f2(Wn.y + (Wn.r + R - 10) * Math.sin(rad(200)))} A ${Wn.r + R - 10} ${Wn.r + R - 10} 0 0 1 ${f2(Wn.x + (Wn.r + R - 10) * Math.cos(rad(262)))} ${f2(Wn.y + (Wn.r + R - 10) * Math.sin(rad(262)))}`} fill="none" stroke="#FFFFFF" strokeWidth={6} strokeLinecap="round" opacity={0.55} />
      {Array.from({length: 16}, (_, i) => {
        const a = rad(i * 22.5 + 11.25), rr = Wn.r + R * 0.62;
        return <circle key={i} cx={Wn.x + rr * Math.cos(a)} cy={Wn.y + rr * Math.sin(a)} r={6.5} fill="#6E808C" stroke={INK} strokeWidth={2} />;
      })}
      <circle cx={Wn.x} cy={Wn.y} r={Wn.r + R} fill="none" stroke={INK} strokeWidth={6} />
      {/* tunnel bevel: shadowed on the upper left, lit warm by the disk on the lower right */}
      <circle cx={Wn.x} cy={Wn.y} r={Wn.r + 20} fill="#3E5561" stroke={INK} strokeWidth={3.5} />
      <path d={`M ${f2(Wn.x + (Wn.r + 10) * Math.cos(rad(-20)))} ${f2(Wn.y + (Wn.r + 10) * Math.sin(rad(-20)))} A ${Wn.r + 10} ${Wn.r + 10} 0 0 1 ${f2(Wn.x + (Wn.r + 10) * Math.cos(rad(120)))} ${f2(Wn.y + (Wn.r + 10) * Math.sin(rad(120)))}`} fill="none" stroke={WALL.glow} strokeWidth={14} opacity={0.75} />
      <g clipPath={`url(#${id}-glass)`}>
        <rect x={Wn.x - Wn.r} y={Wn.y - Wn.r} width={2 * Wn.r} height={2 * Wn.r} fill="#0B0E1D" />
        <g transform={`translate(${f2(Wn.x + COCKPIT_BH.dx)} ${f2(Wn.y + COCKPIT_BH.dy)}) scale(${f2(COCKPIT_BH.k)})`}>
          <BlackHole t={bt} />
        </g>
        {/* glass: a cool tint, one flat sheen band and glints */}
        <rect x={Wn.x - Wn.r} y={Wn.y - Wn.r} width={2 * Wn.r} height={2 * Wn.r} fill="#9CC8FF" opacity={0.05} />
        <path d={`M ${Wn.x - Wn.r} ${Wn.y - Wn.r * 0.2} L ${Wn.x - Wn.r * 0.2} ${Wn.y - Wn.r} L ${Wn.x + Wn.r * 0.05} ${Wn.y - Wn.r} L ${Wn.x - Wn.r} ${Wn.y + Wn.r * 0.05} Z`} fill="#FFFFFF" opacity={0.07} />
        <path d={`M ${Wn.x - Wn.r} ${Wn.y + Wn.r * 0.18} L ${Wn.x + Wn.r * 0.18} ${Wn.y - Wn.r} L ${Wn.x + Wn.r * 0.26} ${Wn.y - Wn.r} L ${Wn.x - Wn.r} ${Wn.y + Wn.r * 0.26} Z`} fill="#FFFFFF" opacity={0.05} />
      </g>
      <path d={`M ${f2(Wn.x + (Wn.r - 22) * Math.cos(rad(196)))} ${f2(Wn.y + (Wn.r - 22) * Math.sin(rad(196)))} A ${Wn.r - 22} ${Wn.r - 22} 0 0 1 ${f2(Wn.x + (Wn.r - 22) * Math.cos(rad(238)))} ${f2(Wn.y + (Wn.r - 22) * Math.sin(rad(238)))}`} fill="none" stroke="#FFFFFF" strokeWidth={10} strokeLinecap="round" opacity={0.4} />
      <circle cx={Wn.x - Wn.r * 0.62} cy={Wn.y - Wn.r * 0.2} r={6} fill="#FFFFFF" opacity={0.45} />
      <path d={`M ${f2(Wn.x + (Wn.r - 20) * Math.cos(rad(24)))} ${f2(Wn.y + (Wn.r - 20) * Math.sin(rad(24)))} A ${Wn.r - 20} ${Wn.r - 20} 0 0 1 ${f2(Wn.x + (Wn.r - 20) * Math.cos(rad(58)))} ${f2(Wn.y + (Wn.r - 20) * Math.sin(rad(58)))}`} fill="none" stroke="#FFFFFF" strokeWidth={5} strokeLinecap="round" opacity={0.2} />
      <circle cx={Wn.x} cy={Wn.y} r={Wn.r} fill="none" stroke={INK} strokeWidth={6} />
      {/* ---- the seat back behind him: padded headrest and back, rim-lit warm on the window side ---- */}
      <path d={back} fill={WALL.seat} />
      <g clipPath={`url(#${id}-back)`}>
        <path d={`M ${S.x + S.backW / 2 - 110} ${S.backTop - 20} Q ${S.x + S.backW / 2 - 70} 1800 ${S.x + S.backW / 2 - 120} 2600 L ${S.x + S.backW} 2600 L ${S.x + S.backW} ${S.backTop - 20} Z`} fill={WALL.seatSh} />
        <path d={`M ${S.x - S.backW / 2 + 70} ${S.backTop + 140} L ${S.x - S.backW / 2 + 70} 2600 M ${S.x + S.backW / 2 - 70} ${S.backTop + 140} L ${S.x + S.backW / 2 - 70} 2600`} stroke={WALL.seatSeam} strokeWidth={4} strokeLinecap="round" />
        <path d={`M ${S.x - S.backW / 2 + 10} ${S.backTop + 130} Q ${S.x - S.backW / 2 + 12} ${S.backTop + 14} ${S.x - S.backW / 2 + 120} ${S.backTop + 12} L ${S.x - 40} ${S.backTop + 12}`} fill="none" stroke={WALL.glowHot} strokeWidth={9} strokeLinecap="round" opacity={0.55} />
      </g>
      <path d={back} fill="none" stroke={INK} strokeWidth={6} strokeLinejoin="round" />
      {[-1, 1].map((sd) => <rect key={sd} x={S.x + sd * 100 - 14} y={S.backTop - 10} width={28} height={40} fill="#7E909C" stroke={INK} strokeWidth={3} />)}
      <path d={head} fill={WALL.seat} />
      <g clipPath={`url(#${id}-head)`}>
        <path d={`M ${S.x + S.headW / 2 - 70} ${S.headTop - 10} Q ${S.x + S.headW / 2 - 40} ${S.headTop + 200} ${S.x + S.headW / 2 - 76} ${S.backTop + 40} L ${S.x + S.headW} ${S.backTop + 40} L ${S.x + S.headW} ${S.headTop - 10} Z`} fill={WALL.seatSh} />
        <path d={`M ${S.x - 70} ${S.headTop + 40} L ${S.x - 70} ${S.backTop} M ${S.x + 70} ${S.headTop + 40} L ${S.x + 70} ${S.backTop}`} stroke={WALL.seatSeam} strokeWidth={4} strokeLinecap="round" />
        <path d={`M ${S.x - S.headW / 2 + 12} ${S.headTop + 120} Q ${S.x - S.headW / 2 + 12} ${S.headTop + 16} ${S.x + Math.cos(toWin) * 40} ${S.headTop + 12}`} fill="none" stroke={WALL.glowHot} strokeWidth={10} strokeLinecap="round" opacity={0.6} />
      </g>
      <path d={head} fill="none" stroke={INK} strokeWidth={6} strokeLinejoin="round" />
    </g>
  );
};

/** foreground pieces drawn AFTER the Astronaut: the warm rim light from the window on his helmet and left shoulder
 *  (assumes he is drawn at COCKPIT_ASTRO with no lean or head tilt; rim = 0 to omit) and the console lip that hides
 *  his lap. */
export const CockpitFront: React.FC<{t: number; id: string; rim?: number; console?: boolean; /** V3: the shoulder's rim light (fades as that arm rises) */ shoulder?: number}> = ({t, rim = 1, console = true, shoulder = 1}) => {
  const Hm = COCKPIT_HELMET, A = COCKPIT_ASTRO;
  const toWin = (Math.atan2(COCKPIT_WIN.y - Hm.y, COCKPIT_WIN.x - Hm.x) * 180) / Math.PI;
  const arc = (r: number, a0: number, a1: number) => `M ${f2(Hm.x + r * Math.cos(rad(a0)))} ${f2(Hm.y + r * Math.sin(rad(a0)))} A ${r} ${r} 0 0 1 ${f2(Hm.x + r * Math.cos(rad(a1)))} ${f2(Hm.y + r * Math.sin(rad(a1)))}`;
  const cy = COCKPIT_CONSOLE_Y;
  return (
    <g>
      {rim > 0.001 && (
        <g opacity={rim}>
          <path d={arc(Hm.r - 7, toWin - 46, toWin + 40)} fill="none" stroke={WALL.glowHot} strokeWidth={7} strokeLinecap="round" opacity={0.75} />
          <path d={arc(Hm.r - 16, toWin - 22, toWin + 16)} fill="none" stroke={WALL.glow} strokeWidth={4} strokeLinecap="round" opacity={0.45} />
          <g transform={`translate(${A.x} ${A.y}) scale(${A.s})`}>
            {shoulder > 0.01 && <path d={`M -82 ${SHOULDER_Y + 2} Q -88 ${SHOULDER_Y - 18} -60 ${SHOULDER_Y - 24}`} fill="none" stroke={WALL.glowHot} strokeWidth={3.2} strokeLinecap="round" opacity={0.7 * shoulder} />}
          </g>
        </g>
      )}
      {console && (
        <g>
          <path d={`M -400 ${cy + 60} Q 540 ${cy - 40} 1480 ${cy + 60} L 1480 2700 L -400 2700 Z`} fill="#2A4956" stroke={INK} strokeWidth={5} strokeLinejoin="round" />
          <path d={`M -400 ${cy + 60} Q 540 ${cy - 40} 1480 ${cy + 60} L 1480 ${cy + 96} Q 540 ${cy - 4} -400 ${cy + 96} Z`} fill="#4A7484" stroke={INK} strokeWidth={4} strokeLinejoin="round" />
          <path d={`M -200 ${cy + 52} Q 540 ${cy - 30} 1280 ${cy + 52}`} fill="none" stroke="#7FA6B4" strokeWidth={5} strokeLinecap="round" opacity={0.7} />
          {/* a few switches and lamps on the console face (no text) */}
          {[150, 250, 830, 930].map((x, i) => (
            <g key={x}>
              <rect x={x - 34} y={cy + 118 + Math.abs(x - 540) * 0.02} width={68} height={44} rx={10} fill="#1B3038" stroke={INK} strokeWidth={3} />
              <Lamp x={x} y={cy + 140 + Math.abs(x - 540) * 0.02} c={[C.teal, C.saffron, C.coral, C.teal][i]} on={i === 2 ? blink(t, 0.9, 0.3, 0.5) : 1} r={8} />
            </g>
          ))}
        </g>
      )}
    </g>
  );
};
