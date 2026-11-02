// Full figures in the Weird Crew construction (ground at 0, shoulders at -292, head centre at -372, legs 160,
// stroke limbs with an ink underlay, a flat trapezoid torso), from the approved cast rig.
//   Astronaut: the crew's "guesser" (red spiky hair, peach skin, coral cheeks) in a white suit with saffron stripes
//   (his striped tee carried into the suit), a clear bubble helmet and his wristwatch on the left wrist. He never
//   ages: no age parameter exists on him.
//   Friend: the crew's "honest" (warm brown skin, black swoop hair, green shirt), with the continuous age parameter
//   driving face, hands, posture (shoulders slump, back rounds, head pushes forward, knees soften) and clothes (a
//   cardigan grows over the shirt, trousers fade).
import React from 'react';
import {mix} from '../core/color';
import {clamp, sm} from '../lib';
import {C, Head, INK, Mitt, OUT} from './crew';

const ss = (x: number, a: number, b: number) => sm((x - a) / (b - a));
const rad = (d: number) => (d * Math.PI) / 180;
export const SHOULDER_Y = -292, HEAD_Y = -372, UPPER = 84, FORE = 78, SHOULDER_X = 66;

export type ArmA = {a: number; b: number}; // a: upper arm from straight down (+ = away from body), b: elbow bend
export const handPos = (arm: ArmA, side: -1 | 1, sx0 = SHOULDER_X, sy = SHOULDER_Y, up = UPPER, fo = FORE) => {
  const sx = sx0 * side;
  const ex = sx + side * Math.sin(rad(arm.a)) * up;
  const ey = sy + Math.cos(rad(arm.a)) * up;
  const hx = ex + side * Math.sin(rad(arm.a + arm.b)) * fo;
  const hy = ey + Math.cos(rad(arm.a + arm.b)) * fo;
  return {sx, sy, ex, ey, hx, hy, angle: side * (arm.a + arm.b)};
};
/** two-bone IK in character-local coordinates; elbow 1 = elbow below the line */
export const reach = (tx: number, ty: number, side: -1 | 1, elbow: 1 | -1 = 1, sx0 = SHOULDER_X, sy = SHOULDER_Y, up = UPPER, fo = FORE): ArmA => {
  const sx = sx0 * side;
  const dx = (tx - sx) * side, dy = ty - sy;
  const d = Math.min(up + fo - 0.5, Math.max(Math.abs(up - fo) + 0.5, Math.hypot(dx, dy)));
  const th = Math.atan2(dx, dy);
  const gam = Math.acos(clamp((up * up + d * d - fo * fo) / (2 * up * d), -1, 1));
  const a = th - elbow * gam;
  const ex = Math.sin(a) * up, ey = Math.cos(a) * up;
  const f = Math.atan2(dx - ex, dy - ey);
  return {a: (a * 180) / Math.PI, b: ((f - a) * 180) / Math.PI};
};

const Limb: React.FC<{pts: [number, number][]; w: number; colors: string[]}> = ({pts, w, colors}) => {
  const pl = pts.map((p) => p.join(',')).join(' ');
  return (
    <g>
      <polyline points={pl} fill="none" stroke={INK} strokeWidth={w + OUT * 2} strokeLinecap="round" strokeLinejoin="round" />
      {pts.slice(0, -1).map((p, i) => (
        <polyline key={i} points={`${p.join(',')} ${pts[i + 1].join(',')}`} fill="none" stroke={colors[Math.min(i, colors.length - 1)]} strokeWidth={w} strokeLinecap="round" />
      ))}
    </g>
  );
};

// ---------------------------------------------------------------------------------------------------------------------
export const SUIT = '#F4F6F8', SUIT_SH = '#C9D3DC', SUIT_DEEP = '#AEBBC6';
export const GUESSER = {skin: '#F2C9A8', hair: '#C0392B'};
export type AstroPose = {
  armL: ArmA; armR: ArmA; lean?: number; tilt?: number; e?: Parameters<typeof Head>[0]['e']; bob?: number;
  legs?: number; // walking phase (radians) amplitude by stride
  stride?: number;
  /** draw the left arm in front of the body and head (a raised wrist) */
  frontL?: boolean;
};
export const ASTRO_IDLE: AstroPose = {armL: {a: 10, b: 12}, armR: {a: 10, b: 12}};
/** the helmet bubble, in head-local coordinates (head centre at 0,0) */
export const HELMET = {cx: 0, cy: -8, r: 98};

/** the astronaut's arm geometry (shoulders are wider and limbs a little longer than the cast default: the suit) */
export const ASTRO_ARM = {sx: 70, sy: SHOULDER_Y + 4, up: 86, fo: 80};
export const astroReach = (tx: number, ty: number, side: -1 | 1, elbow: 1 | -1 = 1) => reach(tx, ty, side, elbow, ASTRO_ARM.sx, ASTRO_ARM.sy, ASTRO_ARM.up, ASTRO_ARM.fo);
/** where the watch sits on the left wrist (character-local), for a given left-arm pose */
export const astroWatchLocal = (armL: ArmA) => {
  const P = handPos(armL, -1, ASTRO_ARM.sx, ASTRO_ARM.sy, ASTRO_ARM.up, ASTRO_ARM.fo);
  return {x: P.ex + (P.hx - P.ex) * 0.66, y: P.ey + (P.hy - P.ey) * 0.66};
};
/** two-bone IK in a plane: joint position for a chain root -> target with lengths l1, l2; bend = +1/-1 picks the side */
export const ik2 = (rx: number, ry: number, tx: number, ty: number, l1: number, l2: number, bend: 1 | -1) => {
  const dx = tx - rx, dy = ty - ry;
  const d = Math.min(l1 + l2 - 0.5, Math.max(Math.abs(l1 - l2) + 0.5, Math.hypot(dx, dy)));
  const a = Math.atan2(dy, dx);
  const g = Math.acos(clamp((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d), -1, 1));
  const j = a - bend * g;
  const jx = rx + Math.cos(j) * l1, jy = ry + Math.sin(j) * l1;
  const k = Math.min(1, (l1 + l2 - 0.5) / Math.max(1e-6, Math.hypot(dx, dy)));
  return {jx, jy, ex: rx + dx * Math.min(1, k), ey: ry + dy * Math.min(1, k)};
};
/** V2: hand / wrist positions in character-local coordinates for a given arm pose */
export const astroHandLocal = (arm: ArmA, side: -1 | 1) => handPos(arm, side, ASTRO_ARM.sx, ASTRO_ARM.sy, ASTRO_ARM.up, ASTRO_ARM.fo);
export const GLOVE = '#EEF2F5';
export const Astronaut: React.FC<{
  pose: AstroPose; id: string; frame: number; reflection?: React.ReactNode; reflOpacity?: number; watchTime?: number; helmet?: boolean; shadow?: boolean;
  fullWatch?: boolean; earth?: React.ReactNode; eyeRefl?: Parameters<typeof Head>[0]['eyeRefl']; tint?: number;
  /** V2: glove colour (suit gloves with a saffron cuff); omitted = bare hands as in V1 */
  glove?: string;
  /** V2: draws the watch on the left wrist instead of the V1 watch (x, y = wrist centre, angle = forearm angle) */
  watchEl?: (p: {x: number; y: number; angle: number}) => React.ReactNode;
  /** V2: leave a hand undrawn (a close-up draws the clasp itself) */
  hideHands?: 'L' | 'R' | 'both';
  /** V2: planted feet (character-local targets, ground = 0); overrides the walk-cycle legs */
  feet?: {lx: number; ly: number; rx: number; ry: number};
}> = ({pose, id, frame, reflection, reflOpacity = 0.45, watchTime = 0, helmet = true, shadow = true, fullWatch = false, earth, eyeRefl, tint = 1, glove, watchEl, hideHands, feet}) => {
  const lean = pose.lean ?? 0;
  const stride = pose.stride ?? 0, ph = pose.legs ?? 0;
  const L = handPos(pose.armL, -1, ASTRO_ARM.sx, ASTRO_ARM.sy, ASTRO_ARM.up, ASTRO_ARM.fo);
  const R = handPos(pose.armR, 1, ASTRO_ARM.sx, ASTRO_ARM.sy, ASTRO_ARM.up, ASTRO_ARM.fo);
  const hipY = -168;
  const leg = (side: -1 | 1, phase: number) => {
    const sw = Math.sin(phase) * 24 * stride;
    const kn = Math.max(0, -Math.cos(phase)) * 30 * stride;
    const hx = side * 32, kx = hx + Math.sin(rad(sw)) * 82, ky = hipY + Math.cos(rad(sw)) * 82;
    const fx = kx + Math.sin(rad(sw - kn)) * 80, fy = ky + Math.cos(rad(sw - kn)) * 80;
    return {hx, kx, ky, fx, fy: Math.min(fy, -8)};
  };
  const legIK = (side: -1 | 1, fx: number, fy: number) => {
    const hx = side * 32;
    const k = ik2(hx, hipY, fx, Math.min(fy, -8), 82, 80, side < 0 ? 1 : -1);
    return {hx, kx: k.jx, ky: k.jy, fx: k.ex, fy: k.ey};
  };
  const lg = feet ? [legIK(-1, feet.lx, feet.ly), legIK(1, feet.rx, feet.ry)] : [leg(-1, ph), leg(1, ph + Math.PI)];
  const torso = `M -84 ${SHOULDER_Y + 10} Q -92 ${SHOULDER_Y - 22} -54 ${SHOULDER_Y - 28} L 54 ${SHOULDER_Y - 28} Q 92 ${SHOULDER_Y - 22} 84 ${SHOULDER_Y + 10} L 74 -150 Q 0 -134 -74 -150 Z`;
  const armColors = [SUIT, SUIT];
  const hand = (P: ReturnType<typeof handPos>, side: -1 | 1, withWatch: boolean) => (
    <g>
      <Limb pts={[[P.sx, P.sy], [P.ex, P.ey], [P.hx, P.hy]]} w={40} colors={armColors} />
      {/* saffron stripe on the upper arm (his striped tee, carried into the suit) */}
      <polyline points={`${P.sx + (P.ex - P.sx) * 0.42},${P.sy + (P.ey - P.sy) * 0.42} ${P.sx + (P.ex - P.sx) * 0.58},${P.sy + (P.ey - P.sy) * 0.58}`} stroke={C.saffron} strokeWidth={40} />
      {/* cuff */}
      <polyline points={`${P.ex + (P.hx - P.ex) * 0.8},${P.ey + (P.hy - P.ey) * 0.8} ${P.ex + (P.hx - P.ex) * 0.93},${P.ey + (P.hy - P.ey) * 0.93}`} stroke={C.saffron} strokeWidth={42} />
      <polyline points={`${P.ex + (P.hx - P.ex) * 0.8},${P.ey + (P.hy - P.ey) * 0.8} ${P.ex + (P.hx - P.ex) * 0.93},${P.ey + (P.hy - P.ey) * 0.93}`} stroke={INK} strokeWidth={2.5} fill="none" opacity={0.7} />
      {!(hideHands === 'both' || (hideHands === 'L' && side < 0) || (hideHands === 'R' && side > 0)) && (
        <g transform={`translate(${P.hx} ${P.hy}) rotate(${P.angle})`}>
          <Mitt skin={glove ?? GUESSER.skin} side={side} />
          {glove && <path d="M -19 -8 Q 0 -14 19 -8" fill="none" stroke={INK} strokeWidth={2} opacity={0.35} />}
        </g>
      )}
      {withWatch && watchEl && watchEl({x: P.ex + (P.hx - P.ex) * 0.66, y: P.ey + (P.hy - P.ey) * 0.66, angle: P.angle})}
      {withWatch && !watchEl && (fullWatch ? <Watch x={P.ex + (P.hx - P.ex) * 0.66} y={P.ey + (P.hy - P.ey) * 0.66} r={17} t={watchTime} rot={0} id={`${id}-w`} earth={earth} strap={P.angle} /> : <Watch x={P.ex + (P.hx - P.ex) * 0.66} y={P.ey + (P.hy - P.ey) * 0.66} r={17} t={watchTime} rot={P.angle} id={`${id}-w`} mini />)}
    </g>
  );
  return (
    <g transform={`translate(0 ${pose.bob ?? 0})`}>
      {shadow && <ellipse cx={0} cy={2} rx={100} ry={15} fill={C.shadow} />}
      <g transform={`rotate(${lean} 0 -150)`}>
        {!pose.frontL && hand(L, -1, true)}
        {/* legs */}
        {lg.map((g, i) => (
          <g key={i}>
            <Limb pts={[[g.hx, hipY], [g.kx, g.ky], [g.fx, g.fy]]} w={46} colors={[SUIT, SUIT]} />
            <ellipse cx={g.fx + 6} cy={g.fy + 2} rx={34} ry={15} fill="#5A6773" stroke={INK} strokeWidth={OUT} />
          </g>
        ))}
        <path d={torso} fill={SUIT} stroke={INK} strokeWidth={OUT} strokeLinejoin="round" />
        <clipPath id={`${id}-torso`}><path d={torso} /></clipPath>
        <g clipPath={`url(#${id}-torso)`}>
          <path d={`M 40 ${SHOULDER_Y - 40} Q 100 -220 60 -130 L 110 -130 L 110 ${SHOULDER_Y - 40} Z`} fill={SUIT_SH} opacity={0.75} />
          <rect x={-90} y={-196} width={180} height={14} fill={C.saffron} />
          <rect x={-90} y={-178} width={180} height={6} fill={C.saffron} />
        </g>
        {/* chest unit */}
        <rect x={-40} y={SHOULDER_Y + 18} width={80} height={52} rx={10} fill="#3F5560" stroke={INK} strokeWidth={OUT} />
        <circle cx={-20} cy={SHOULDER_Y + 44} r={7} fill={C.saffron} stroke={INK} strokeWidth={2.5} />
        <circle cx={0} cy={SHOULDER_Y + 44} r={7} fill={C.teal} stroke={INK} strokeWidth={2.5} />
        <circle cx={20} cy={SHOULDER_Y + 44} r={7} fill={C.coral} stroke={INK} strokeWidth={2.5} />
        {/* collar ring */}
        <rect x={-62} y={HEAD_Y + 62} width={124} height={30} rx={14} fill={SUIT_SH} stroke={INK} strokeWidth={OUT} />
        <rect x={-62} y={HEAD_Y + 62} width={124} height={10} rx={5} fill={SUIT} opacity={0.8} />
        {hand(R, 1, false)}
        {/* head + helmet */}
        <g transform={`translate(0 ${HEAD_Y}) rotate(${pose.tilt ?? 0} 0 50)`}>
          <Head skin={GUESSER.skin} hair="spiky" hairColor={GUESSER.hair} e={pose.e} id={`${id}-h`} eyeRefl={eyeRefl} />
          {helmet && <Helmet id={id} reflection={reflection} reflOpacity={reflOpacity} tint={tint} />}
        </g>
        {pose.frontL && hand(L, -1, true)}
      </g>
    </g>
  );
};

/** clear bubble helmet: glass tint, the reflection (a portal into another world, clipped to the glass), highlights */
export const Helmet: React.FC<{id: string; reflection?: React.ReactNode; reflOpacity?: number; tint?: number}> = ({id, reflection, reflOpacity = 0.45, tint = 1}) => {
  const {cx, cy, r} = HELMET;
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} fill={`rgba(190,225,255,${0.1 * tint})`} />
      {/* a reflection on glass adds light (screen blend: the dark sky reflects nothing, the bright disk does); near a
          portal hand-off it becomes the whole view (normal blend) */}
      {reflection && reflOpacity < 0.999 && (
        <g clipPath={`url(#${id}-glass)`} opacity={Math.min(1, reflOpacity * 1.6)} style={{mixBlendMode: 'screen'}}>
          {reflection}
        </g>
      )}
      {reflection && reflOpacity > 0.8 && (
        <g clipPath={`url(#${id}-glass)`} opacity={Math.min(1, (reflOpacity - 0.8) / 0.2)}>
          {reflection}
        </g>
      )}
      <clipPath id={`${id}-glass`}><circle cx={cx} cy={cy} r={r - 2} /></clipPath>
      {/* highlights */}
      <path d={`M ${cx - r * 0.72} ${cy - r * 0.32} A ${r * 0.8} ${r * 0.8} 0 0 1 ${cx - r * 0.18} ${cy - r * 0.8}`} fill="none" stroke="#FFFFFF" strokeWidth={9} strokeLinecap="round" opacity={0.7} />
      <circle cx={cx - r * 0.5} cy={cy - r * 0.08} r={5} fill="#FFFFFF" opacity={0.65} />
      <path d={`M ${cx + r * 0.62} ${cy + r * 0.5} A ${r * 0.8} ${r * 0.8} 0 0 1 ${cx + r * 0.25} ${cy + r * 0.76}`} fill="none" stroke="#FFFFFF" strokeWidth={5} strokeLinecap="round" opacity={0.35} />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={INK} strokeWidth={5} />
      <circle cx={cx} cy={cy} r={r - 7} fill="none" stroke="#FFFFFF" strokeWidth={2} opacity={0.25} />
    </g>
  );
};

/** his wristwatch: steel case, navy dial, cream hands, coral seconds hand sweeping at the real rate (6 deg/s), and a
 *  small Earth sub-dial at six o'clock. `t` is the watch's own time in seconds. */
export const Watch: React.FC<{x?: number; y?: number; r: number; t: number; rot?: number; id: string; mini?: boolean; earth?: React.ReactNode; earthOpacity?: number; secRate?: number; strap?: number}> = ({x = 0, y = 0, r, t, rot = 0, id, mini = false, earth, earthOpacity = 1, secRate = 1, strap}) => {
  const sec = ((t * secRate) % 60) * 6, min = (((t * secRate) / 60 + 37) % 60) * 6, hr = (((t * secRate) / 3600 + 10.6) % 12) * 30;
  const k = r / 100;
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot})`}>
      {!mini && <rect x={-52 * k} y={-170 * k} width={104 * k} height={340 * k} rx={22 * k} fill="#3F5560" stroke={INK} strokeWidth={Math.max(1.5, r * 0.04)} transform={strap !== undefined ? `rotate(${strap + 90})` : undefined} />}
      <circle r={r * 1.14} fill="#B9C4CC" stroke={INK} strokeWidth={mini ? 2.5 : OUT} />
      <circle r={r * 1.14} fill="none" stroke="#FFFFFF" strokeWidth={r * 0.05} opacity={0.5} strokeDasharray={`${r * 1.2} ${r * 9}`} transform="rotate(200)" />
      <circle r={r} fill="#13213A" stroke={INK} strokeWidth={mini ? 1.5 : 3} />
      {!mini && Array.from({length: 60}, (_, i) => (
        <line key={i} x1={0} y1={-r * 0.95} x2={0} y2={-r * (i % 5 === 0 ? 0.8 : 0.9)} stroke="#FFF3D6" strokeWidth={i % 5 === 0 ? r * 0.045 : r * 0.016} transform={`rotate(${i * 6})`} strokeLinecap="round" />
      ))}
      {mini && [0, 90, 180, 270].map((a) => <line key={a} x1={0} y1={-r * 0.92} x2={0} y2={-r * 0.72} stroke="#FFF3D6" strokeWidth={r * 0.1} transform={`rotate(${a})`} />)}
      {/* Earth sub-dial */}
      {!mini && (
        <g transform={`translate(0 ${r * 0.48})`}>
          <circle r={r * 0.27} fill="#0B1424" stroke="#FFF3D6" strokeWidth={r * 0.012} />
          <clipPath id={`${id}-sub`}><circle r={r * 0.25} /></clipPath>
          <g clipPath={`url(#${id}-sub)`} opacity={earthOpacity}>{earth}</g>
        </g>
      )}
      <line x1={0} y1={r * 0.1} x2={0} y2={-r * 0.5} stroke="#FFF3D6" strokeWidth={r * 0.07} strokeLinecap="round" transform={`rotate(${hr})`} />
      <line x1={0} y1={r * 0.12} x2={0} y2={-r * 0.74} stroke="#FFF3D6" strokeWidth={r * 0.05} strokeLinecap="round" transform={`rotate(${min})`} />
      {!mini && <line x1={0} y1={r * 0.2} x2={0} y2={-r * 0.86} stroke={C.coral} strokeWidth={r * 0.02} strokeLinecap="round" transform={`rotate(${sec})`} />}
      <circle r={r * 0.05} fill={C.coral} stroke={INK} strokeWidth={mini ? 0.8 : 1.5} />
      {/* crystal glint */}
      <path d={`M ${-r * 0.7} ${-r * 0.35} A ${r * 0.8} ${r * 0.8} 0 0 1 ${-r * 0.2} ${-r * 0.75}`} fill="none" stroke="#FFFFFF" strokeWidth={r * 0.06} strokeLinecap="round" opacity={0.35} />
    </g>
  );
};

// ---------------------------------------------------------------------------------------------------------------------
export const HONEST = {skin: '#C98B5E', hair: '#2B2B33', shirt: '#4F9A6B'};
export type FriendPose = {armL: ArmA; armR: ArmA; e?: Parameters<typeof Head>[0]['e']; lean?: number; bob?: number; cane?: boolean;
  /** V2: walking phase (radians) and stride (0 = standing) */ walk?: number; stride?: number};
/** V2: the friend's signature green. As he ages the green shirt gives way to a green cardigan over a cream shirt, so
 *  the green stays the dominant colour at every age. green = false keeps the V1 brown cardigan. */
export const FRIEND_CARDIGAN = '#3E7A52';
export const Friend: React.FC<{age: number; pose: FriendPose; id: string; facing?: -1 | 1; shadow?: boolean; hideHands?: 'L' | 'R' | 'both'; green?: boolean; /** V2: forearm colour override (long sleeves) */ forearm?: string; /** V2: upper-arm sleeve colour override */ sleeveC?: string}> = ({age, pose, id, facing = -1, shadow = true, hideHands, green = false, forearm, sleeveC}) => {
  const a = clamp(age);
  const s = ss(a, 0.45, 1); // stoop
  const shirt = mix(HONEST.shirt, '#E8E2D2', ss(a, 0.4, 0.9));
  const cardi = ss(a, 0.42, 0.85); // cardigan grows over the shirt
  const cardColor = green ? FRIEND_CARDIGAN : '#8C6450';
  const wk = pose.stride ?? 0, wph = pose.walk ?? 0;
  const footL = {x: -46 + Math.sin(wph) * 26 * wk, y: -10 - Math.max(0, Math.cos(wph)) * 12 * wk};
  const footR = {x: 44 + Math.sin(wph + Math.PI) * 26 * wk, y: -10 - Math.max(0, Math.cos(wph + Math.PI)) * 12 * wk};
  const pants = mix('#3F5560', '#9C8A70', ss(a, 0.3, 0.9));
  const shY = SHOULDER_Y + 10 * s;
  const shX = SHOULDER_X - 4 * s;
  const L = handPos(pose.armL, -1, shX, shY);
  const R = handPos(pose.armR, 1, shX, shY);
  const torso = `M -76 ${shY + 2} Q -82 ${shY - 18} -52 ${shY - 22} L 52 ${shY - 22} Q 82 ${shY - 18} 76 ${shY + 2} L 66 -150 Q 0 -138 -66 -150 Z`;
  const headY = HEAD_Y + 12 * s;
  const knee = 8 * s;
  return (
    <g transform={`translate(0 ${pose.bob ?? 0}) scale(${-facing} 1)`}>
      {shadow && <ellipse cx={0} cy={2} rx={92} ry={14} fill={C.shadow} />}
      {/* drawn facing screen-left; facing = 1 mirrors it. Stoop leans the top toward the face side */}
      <g transform={`rotate(${-(pose.lean ?? 0) - 7 * s} 0 -150)`}>
        <ArmF P={R} side={1} sleeve={sleeveC ?? (cardi > 0.5 ? cardColor : shirt)} skin={HONEST.skin} age={a} hide={hideHands === 'both' || hideHands === 'R'} fore={forearm} />
        {pose.cane && <Cane P={R} />}
        {/* legs (knees soften with age) */}
        <path d={`M -52 -170 L ${(-52 + footL.x) / 2 - 2} ${-90 + knee} L ${footL.x} ${footL.y}`} fill="none" stroke={INK} strokeWidth={38 + OUT * 2} strokeLinecap="round" strokeLinejoin="round" />
        <path d={`M -52 -170 L ${(-52 + footL.x) / 2 - 2} ${-90 + knee} L ${footL.x} ${footL.y}`} fill="none" stroke={pants} strokeWidth={38} strokeLinecap="round" strokeLinejoin="round" />
        <path d={`M 52 -170 L ${(52 + footR.x) / 2 - 2} ${-90 + knee} L ${footR.x} ${footR.y}`} fill="none" stroke={INK} strokeWidth={38 + OUT * 2} strokeLinecap="round" strokeLinejoin="round" />
        <path d={`M 52 -170 L ${(52 + footR.x) / 2 - 2} ${-90 + knee} L ${footR.x} ${footR.y}`} fill="none" stroke={pants} strokeWidth={38} strokeLinecap="round" strokeLinejoin="round" />
        <ellipse cx={footL.x + 6} cy={footL.y + 4} rx={30} ry={13} fill="#2B2B33" stroke={INK} strokeWidth={OUT} />
        <ellipse cx={footR.x - 4} cy={footR.y + 4} rx={30} ry={13} fill="#2B2B33" stroke={INK} strokeWidth={OUT} />
        <path d={torso} fill={shirt} stroke={INK} strokeWidth={OUT} strokeLinejoin="round" />
        {cardi > 0.01 && (
          <path d={`M -76 ${shY + 2} Q -82 ${shY - 18} -52 ${shY - 22} L ${-52 + 30 * cardi} ${shY - 22} L ${-66 + 56 * cardi} -150 L -66 -150 Z M 76 ${shY + 2} Q 82 ${shY - 18} 52 ${shY - 22} L ${52 - 30 * cardi} ${shY - 22} L ${66 - 56 * cardi} -150 L 66 -150 Z`} fill={cardColor} stroke={INK} strokeWidth={OUT} strokeLinejoin="round" opacity={clamp(cardi * 3)} />
        )}
        {cardi > 0.6 && [0, 1, 2].map((k) => <circle key={k} cx={-12} cy={shY + 30 + k * 34} r={4} fill="#5A3E30" opacity={(cardi - 0.6) * 2.5} />)}
        {/* neck */}
        <rect x={-16} y={headY + 40} width={32} height={34 - 6 * s} fill={mix(HONEST.skin, '#DCC2B2', 0.2 * s)} stroke={INK} strokeWidth={OUT} />
        {s > 0.2 && <path d={`M -8 ${headY + 52} q 8 4 16 0 M -8 ${headY + 60} q 8 4 16 0`} fill="none" stroke={INK} strokeWidth={2} opacity={0.5 * s} />}
        <ArmF P={L} side={-1} sleeve={sleeveC ?? (cardi > 0.5 ? cardColor : shirt)} skin={HONEST.skin} age={a} hide={hideHands === 'both' || hideHands === 'L'} fore={forearm} />
        <g transform={`translate(${-14 * s} ${headY})`}>
          <Head skin={HONEST.skin} hair="swoop" hairColor={HONEST.hair} age={a} e={pose.e} glasses={ss(a, 0.6, 0.72)} id={`${id}-h`} />
        </g>
      </g>
    </g>
  );
};
const ArmF: React.FC<{P: ReturnType<typeof handPos>; side: -1 | 1; sleeve: string; skin: string; age: number; hide?: boolean; fore?: string}> = ({P, side, sleeve, skin, age, hide, fore}) => (
  <g>
    <Limb pts={[[P.sx, P.sy], [P.ex, P.ey], [P.hx, P.hy]]} w={30} colors={[sleeve, fore ?? (age > 0.55 ? sleeve : skin)]} />
    {!hide && (
      <g transform={`translate(${P.hx} ${P.hy}) rotate(${P.angle})`}>
        <Mitt skin={skin} age={age} side={side} />
      </g>
    )}
  </g>
);
/** V2: the friend's hand position (character-local, before the facing mirror and stoop rotation) */
export const friendHandLocal = (arm: ArmA, side: -1 | 1, age: number) => {
  const s = ss(clamp(age), 0.45, 1);
  return handPos(arm, side, SHOULDER_X - 4 * s, SHOULDER_Y + 10 * s);
};
export const friendStoop = (age: number) => 7 * ss(clamp(age), 0.45, 1);
const Cane: React.FC<{P: ReturnType<typeof handPos>}> = ({P}) => (
  <g>
    <path d={`M ${P.hx} ${P.hy + 6} L ${P.hx + 6} -2`} stroke={INK} strokeWidth={13} strokeLinecap="round" />
    <path d={`M ${P.hx} ${P.hy + 6} L ${P.hx + 6} -2`} stroke="#7A5236" strokeWidth={7} strokeLinecap="round" />
    <path d={`M ${P.hx - 18} ${P.hy - 2} Q ${P.hx - 4} ${P.hy - 16} ${P.hx + 2} ${P.hy + 4}`} fill="none" stroke={INK} strokeWidth={13} strokeLinecap="round" />
    <path d={`M ${P.hx - 18} ${P.hy - 2} Q ${P.hx - 4} ${P.hy - 16} ${P.hx + 2} ${P.hy + 4}`} fill="none" stroke="#7A5236" strokeWidth={7} strokeLinecap="round" />
  </g>
);

/** a head-and-shoulders portrait (photographs): any crew face at any age */
export const Bust: React.FC<{skin: string; hair: 'spiky' | 'swoop' | 'bob'; hairColor: string; age: number; shirt: string; id: string; e?: Parameters<typeof Head>[0]['e']; glasses?: number}> = ({skin, hair, hairColor, age, shirt, id, e, glasses = 0}) => (
  <g>
    <path d={`M -80 140 Q -84 70 -40 62 L 40 62 Q 84 70 80 140 Z`} fill={shirt} stroke={INK} strokeWidth={OUT} strokeLinejoin="round" />
    <rect x={-15} y={40} width={30} height={26} fill={skin} stroke={INK} strokeWidth={OUT} />
    <Head skin={skin} hair={hair} hairColor={hairColor} age={age} e={e ?? {mouth: 'smile'}} glasses={glasses} id={id} />
  </g>
);
