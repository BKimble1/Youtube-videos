import React from 'react';
import {C, OUTLINE} from '../theme';
import {blink as blinkFn, rand} from '../lib/anim';
import {drift} from '../lib/motion';

/**
 * Cutout character rig (SVG). Ground point is (0,0); the figure stands about 440 px tall.
 * Everything is driven by a Pose (interpolated by the scene) plus a Look (colours, hair, outfit,
 * accessories). Characters are metaphorical teaching devices: the clerks, the fact-checker and the
 * quiz pair never stand for a specific company's product.
 */
export type Arm = {a: number; b: number}; // a: upper arm from straight-down (deg, + = away from body); b: elbow bend (deg, + = forearm swings out/up)
export type Mouth = 'smile' | 'grin' | 'flat' | 'o' | 'smirk' | 'frown' | 'hmm' | 'talk';
export type Pose = {
  armL: Arm;
  armR: Arm;
  lean: number; // whole-body lean, deg (+ = viewer's right)
  tilt: number; // head tilt, deg
  lookX: number; // -1..1
  lookY: number; // -1..1
  brows: number; // -1 (down/angry) .. 1 (raised)
  browAsym?: number; // raises the right brow (skeptical) 0..1
  mouth: Mouth;
  bob?: number; // vertical offset, px
  blink?: number; // 1 = open (override)
};
export type Hair = 'crop' | 'bun' | 'curly' | 'swoop' | 'bob' | 'bald' | 'spiky';
export type Accessory = 'glasses' | 'roundGlasses' | 'visor' | 'bowtie' | 'nametag' | 'headset' | 'pencil' | 'tie' | 'beard' | 'earring';
export type Look = {
  skin: string;
  hair: Hair;
  hairColor: string;
  shirt: string;
  overlay?: 'vest' | 'cardigan' | 'apron' | 'jacket';
  overlayColor?: string;
  pants: string;
  shoes: string;
  accessories: Accessory[];
  stripes?: string; // shirt stripe colour (loud shirt)
  cheeks?: boolean;
};

export const IDLE: Pose = {armL: {a: 8, b: 10}, armR: {a: 8, b: 10}, lean: 0, tilt: 0, lookX: 0, lookY: 0, brows: 0, mouth: 'smile'};

export const mixPose = (p: Pose, q: Pose, t: number): Pose => {
  const m = (a: number, b: number) => a + (b - a) * t;
  return {
    armL: {a: m(p.armL.a, q.armL.a), b: m(p.armL.b, q.armL.b)},
    armR: {a: m(p.armR.a, q.armR.a), b: m(p.armR.b, q.armR.b)},
    lean: m(p.lean, q.lean),
    tilt: m(p.tilt, q.tilt),
    lookX: m(p.lookX, q.lookX),
    lookY: m(p.lookY, q.lookY),
    brows: m(p.brows, q.brows),
    browAsym: m(p.browAsym ?? 0, q.browAsym ?? 0),
    mouth: t < 0.5 ? p.mouth : q.mouth,
    bob: m(p.bob ?? 0, q.bob ?? 0),
    blink: q.blink ?? p.blink,
  };
};

// Geometry (SVG coords, y down, ground at 0)
const SHOULDER_Y = -292;
const SHOULDER_X = 66;
const UPPER = 84;
const FORE = 78;
const HEAD_Y = -372;
const HEAD_R = 58;
const ARM_W = 30;

const rad = (d: number) => (d * Math.PI) / 180;

/** Hand position in character-local coords for an arm on side s (-1 = L, +1 = R). */
export const handPos = (arm: Arm, side: -1 | 1) => {
  const sx = SHOULDER_X * side;
  const ex = sx + side * Math.sin(rad(arm.a)) * UPPER;
  const ey = SHOULDER_Y + Math.cos(rad(arm.a)) * UPPER;
  const hx = ex + side * Math.sin(rad(arm.a + arm.b)) * FORE;
  const hy = ey + Math.cos(rad(arm.a + arm.b)) * FORE;
  return {ex, ey, hx, hy, angle: side * (arm.a + arm.b)};
};

/**
 * Two-bone IK: the arm (side -1 = L, +1 = R) that puts the hand on a point in character-local coords (ground at 0,0,
 * before scale and bob). elbow 1 = elbow hangs below the shoulder-hand line (natural), -1 = elbow up.
 * Out-of-reach targets give a straight arm pointing at them.
 */
export const reachLocal = (tx: number, ty: number, side: -1 | 1, elbow: 1 | -1 = 1): Arm => {
  const sx = SHOULDER_X * side;
  const dx = (tx - sx) * side;
  const dy = ty - SHOULDER_Y;
  const d = Math.min(UPPER + FORE - 0.5, Math.max(Math.abs(UPPER - FORE) + 0.5, Math.hypot(dx, dy)));
  const th = Math.atan2(dx, dy);
  const gam = Math.acos(Math.max(-1, Math.min(1, (UPPER * UPPER + d * d - FORE * FORE) / (2 * UPPER * d))));
  const a = th - elbow * gam;
  const ex = Math.sin(a) * UPPER;
  const ey = Math.cos(a) * UPPER;
  const f = Math.atan2(dx - ex, dy - ey);
  return {a: (a * 180) / Math.PI, b: ((f - a) * 180) / Math.PI};
};

/** World-space reach for a character drawn at (x, y) with `scale` and pose bob `bob`. */
export const reach = (ch: {x: number; y: number; scale: number; bob?: number}, side: -1 | 1, wx: number, wy: number, elbow: 1 | -1 = 1): Arm =>
  reachLocal((wx - ch.x) / ch.scale, (wy - ch.y) / ch.scale - (ch.bob ?? 0), side, elbow);

/** Where the hand of an arm lands in world space for a character at (x, y, scale, bob). */
export const handWorld = (ch: {x: number; y: number; scale: number; bob?: number}, arm: Arm, side: -1 | 1) => {
  const h = handPos(arm, side);
  return {x: ch.x + h.hx * ch.scale, y: ch.y + (h.hy + (ch.bob ?? 0)) * ch.scale};
};

const ArmShape: React.FC<{arm: Arm; side: -1 | 1; skin: string; sleeve: string; children?: React.ReactNode}> = ({arm, side, skin, sleeve, children}) => {
  const {ex, ey, hx, hy, angle} = handPos(arm, side);
  const sx = SHOULDER_X * side;
  return (
    <g>
      <polyline points={`${sx},${SHOULDER_Y} ${ex},${ey} ${hx},${hy}`} fill="none" stroke={C.ink} strokeWidth={ARM_W + OUTLINE * 2} strokeLinecap="round" strokeLinejoin="round" />
      <polyline points={`${sx},${SHOULDER_Y} ${ex},${ey}`} fill="none" stroke={sleeve} strokeWidth={ARM_W} strokeLinecap="round" strokeLinejoin="round" />
      <polyline points={`${ex},${ey} ${hx},${hy}`} fill="none" stroke={skin} strokeWidth={ARM_W} strokeLinecap="round" strokeLinejoin="round" />
      {/* hand: mitt with a thumb */}
      <g transform={`translate(${hx}, ${hy}) rotate(${angle})`}>
        <ellipse cx={0} cy={6} rx={20} ry={18} fill={skin} stroke={C.ink} strokeWidth={OUTLINE} />
        <ellipse cx={side * -14} cy={-2} rx={8} ry={10} fill={skin} stroke={C.ink} strokeWidth={OUTLINE} transform={`rotate(${side * -30})`} />
        <ellipse cx={side * -14} cy={-2} rx={6} ry={8} fill={skin} transform={`rotate(${side * -30})`} />
      </g>
      {children && <g transform={`translate(${hx}, ${hy})`}>{children}</g>}
    </g>
  );
};

const HairShape: React.FC<{hair: Hair; color: string}> = ({hair, color}) => {
  const cy = HEAD_Y;
  const r = HEAD_R;
  const st = {fill: color, stroke: C.ink, strokeWidth: OUTLINE, strokeLinejoin: 'round' as const};
  switch (hair) {
    case 'crop':
      return <path d={`M ${-r - 2} ${cy - 8} Q ${-r} ${cy - r - 18} 0 ${cy - r - 16} Q ${r} ${cy - r - 18} ${r + 2} ${cy - 8} Q ${r * 0.6} ${cy - r * 0.55} 0 ${cy - r * 0.6} Q ${-r * 0.6} ${cy - r * 0.55} ${-r - 2} ${cy - 8} Z`} {...st} />;
    case 'bun':
      return (
        <g>
          <circle cx={0} cy={cy - r - 20} r={20} {...st} />
          <path d={`M ${-r - 2} ${cy - 8} Q ${-r} ${cy - r - 16} 0 ${cy - r - 14} Q ${r} ${cy - r - 16} ${r + 2} ${cy - 8} Q ${r * 0.6} ${cy - r * 0.5} 0 ${cy - r * 0.55} Q ${-r * 0.6} ${cy - r * 0.5} ${-r - 2} ${cy - 8} Z`} {...st} />
        </g>
      );
    case 'curly':
      return (
        <g>
          {[-48, -30, -10, 10, 30, 48].map((x, i) => (
            <circle key={i} cx={x} cy={cy - r + 6 - (i === 0 || i === 5 ? 0 : 14)} r={i === 0 || i === 5 ? 20 : 24} {...st} />
          ))}
          <circle cx={-62} cy={cy - 10} r={16} {...st} />
          <circle cx={62} cy={cy - 10} r={16} {...st} />
        </g>
      );
    case 'swoop':
      return (
        <path d={`M ${-r - 4} ${cy - 4} Q ${-r - 6} ${cy - r - 24} ${-10} ${cy - r - 20} Q ${r + 10} ${cy - r - 30} ${r + 8} ${cy - r + 10} Q ${r - 10} ${cy - r - 2} ${20} ${cy - r + 2} Q ${-20} ${cy - r + 4} ${-r - 4} ${cy - 4} Z`} {...st} />
      );
    case 'bob':
      return (
        <path d={`M ${-r - 10} ${cy + 26} L ${-r - 10} ${cy - 10} Q ${-r - 6} ${cy - r - 20} 0 ${cy - r - 18} Q ${r + 6} ${cy - r - 20} ${r + 10} ${cy - 10} L ${r + 10} ${cy + 26} L ${r - 6} ${cy + 26} L ${r - 6} ${cy - 20} Q ${r * 0.5} ${cy - r * 0.6} 0 ${cy - r * 0.62} Q ${-r * 0.5} ${cy - r * 0.6} ${-r + 6} ${cy - 20} L ${-r + 6} ${cy + 26} Z`} {...st} />
      );
    case 'spiky':
      return (
        <path d={`M ${-r} ${cy - 12} L ${-r + 4} ${cy - r - 22} L ${-28} ${cy - r - 4} L ${-14} ${cy - r - 34} L 0 ${cy - r - 6} L 14 ${cy - r - 36} L 28 ${cy - r - 4} L ${r - 4} ${cy - r - 22} L ${r} ${cy - 12} Q ${r * 0.6} ${cy - r * 0.55} 0 ${cy - r * 0.6} Q ${-r * 0.6} ${cy - r * 0.55} ${-r} ${cy - 12} Z`} {...st} />
      );
    default:
      return null;
  }
};

const MouthShape: React.FC<{mouth: Mouth; y: number; talkPhase?: number}> = ({mouth, y, talkPhase = 0}) => {
  const st = {fill: 'none', stroke: C.ink, strokeWidth: OUTLINE, strokeLinecap: 'round' as const};
  switch (mouth) {
    case 'smile':
      return <path d={`M -16 ${y} Q 0 ${y + 14} 16 ${y}`} {...st} />;
    case 'grin':
      return (
        <g>
          <path d={`M -22 ${y - 2} Q 0 ${y + 30} 22 ${y - 2} Z`} fill={C.ink} stroke={C.ink} strokeWidth={OUTLINE} strokeLinejoin="round" />
          <path d={`M -16 ${y + 1} Q 0 ${y + 9} 16 ${y + 1} L 16 ${y + 5} Q 0 ${y + 12} -16 ${y + 5} Z`} fill={C.white} />
        </g>
      );
    case 'flat':
      return <path d={`M -14 ${y + 2} L 14 ${y + 2}`} {...st} />;
    case 'o':
      return <ellipse cx={0} cy={y + 4} rx={8} ry={10} fill={C.ink} />;
    case 'smirk':
      return <path d={`M -14 ${y + 4} Q 4 ${y + 12} 17 ${y - 3}`} {...st} />;
    case 'frown':
      return <path d={`M -16 ${y + 6} Q 0 ${y - 6} 16 ${y + 6}`} {...st} />;
    case 'hmm':
      return <path d={`M -14 ${y + 2} Q -4 ${y + 7} 4 ${y + 1} Q 10 ${y - 3} 14 ${y + 3}`} {...st} />;
    case 'talk': {
      const open = 3 + 7 * Math.abs(Math.sin(talkPhase));
      return <ellipse cx={0} cy={y + 4} rx={9} ry={open} fill={C.ink} />;
    }
    default:
      return null;
  }
};

export const Character: React.FC<{
  look: Look;
  pose: Pose;
  frame: number; // for blink / talk phase (deterministic)
  seed?: number;
  x?: number;
  y?: number;
  scale?: number;
  flip?: boolean; // face the other way
  /** Which arm is drawn in a separate front pass (so a hand can rest on a counter drawn between). */
  front?: 'L' | 'R' | 'none';
  pass?: 'all' | 'body' | 'frontArm';
  holdL?: React.ReactNode; // prop attached to the left hand (character-local coords, hand at 0,0)
  holdR?: React.ReactNode;
  shadow?: boolean;
  style?: React.CSSProperties;
  /** Background life: slow head/weight drift and small eye movements (0 = frozen, 1 = default). Scenes lower it
   *  while a character performs a precise action, and can switch eye darts off when the look must stay put. */
  life?: number;
  eyeDarts?: boolean;
}> = ({look, pose: pose0, frame, seed = 1, x = 0, y = 0, scale = 1, flip = false, front = 'none', pass = 'all', holdL, holdR, shadow = true, style, life = 1, eyeDarts = true}) => {
  // idle life is layered on top of the scene's pose, never replacing it
  const saccade = (() => {
    if (!eyeDarts || life <= 0) return {x: 0, y: 0};
    const period = 70 + Math.floor(rand(seed * 11) * 50);
    const k = Math.floor((frame + seed * 13) / period);
    const p = (frame + seed * 13) % period;
    const tx = (rand(seed * 101 + k) - 0.5) * 0.36;
    const ty = (rand(seed * 211 + k) - 0.5) * 0.22;
    const px = (rand(seed * 101 + k - 1) - 0.5) * 0.36;
    const py = (rand(seed * 211 + k - 1) - 0.5) * 0.22;
    const u = Math.min(1, p / 4);
    return {x: (px + (tx - px) * u) * life, y: (py + (ty - py) * u) * life};
  })();
  const pose: Pose = {
    ...pose0,
    tilt: pose0.tilt + drift(frame, seed, 170) * 1.3 * life,
    lean: pose0.lean + drift(frame, seed + 7, 210) * 0.7 * life,
    bob: (pose0.bob ?? 0) + drift(frame, seed + 3, 96) * 1.4 * life,
    lookX: Math.max(-1, Math.min(1, pose0.lookX + saccade.x)),
    lookY: Math.max(-1, Math.min(1, pose0.lookY + saccade.y)),
  };
  const bl = pose.blink ?? blinkFn(frame, seed);
  const bob = pose.bob ?? 0;
  const breathe = Math.sin((frame / 48 + seed) * Math.PI * 2) * 1.2;
  const eyeY = HEAD_Y - 6;
  const drawBody = pass !== 'frontArm';
  const drawFrontArm = pass !== 'body';
  const frontIsL = front === 'L';
  const frontIsR = front === 'R';
  const sleeve = look.overlay ? look.overlayColor ?? look.shirt : look.shirt;
  const LArm = (
    <ArmShape arm={pose.armL} side={-1} skin={look.skin} sleeve={sleeve}>
      {holdL}
    </ArmShape>
  );
  const RArm = (
    <ArmShape arm={pose.armR} side={1} skin={look.skin} sleeve={sleeve}>
      {holdR}
    </ArmShape>
  );
  const browL = -12 - pose.brows * 6;
  const browR = -12 - pose.brows * 6 - (pose.browAsym ?? 0) * 8;
  return (
    <svg
      viewBox="-200 -500 400 520"
      width={400 * scale}
      height={520 * scale}
      style={{position: 'absolute', left: x - 200 * scale, top: y - 500 * scale, overflow: 'visible', ...style}}
    >
      <g transform={`${flip ? 'scale(-1,1)' : ''} translate(0, ${bob})`}>
        {shadow && drawBody && <ellipse cx={0} cy={2} rx={92} ry={14} fill={C.shadow} />}
        <g transform={`rotate(${pose.lean} 0 -150)`}>
          {/* back arm(s) */}
          {drawBody && !frontIsL && LArm}
          {drawBody && !frontIsR && RArm}
          {drawBody && (
            <g>
              {/* legs */}
              <rect x={-52} y={-170} width={38} height={160} rx={16} fill={look.pants} stroke={C.ink} strokeWidth={OUTLINE} />
              <rect x={14} y={-170} width={38} height={160} rx={16} fill={look.pants} stroke={C.ink} strokeWidth={OUTLINE} />
              <ellipse cx={-34} cy={-6} rx={30} ry={13} fill={look.shoes} stroke={C.ink} strokeWidth={OUTLINE} />
              <ellipse cx={34} cy={-6} rx={30} ry={13} fill={look.shoes} stroke={C.ink} strokeWidth={OUTLINE} />
              {/* torso (breathes) */}
              <g transform={`translate(0 ${-150}) scale(1 ${1 + breathe / 300}) translate(0 150)`}>
                <path d={`M -76 ${SHOULDER_Y + 2} Q -82 ${SHOULDER_Y - 18} -52 ${SHOULDER_Y - 22} L 52 ${SHOULDER_Y - 22} Q 82 ${SHOULDER_Y - 18} 76 ${SHOULDER_Y + 2} L 66 -150 Q 0 -138 -66 -150 Z`} fill={look.shirt} stroke={C.ink} strokeWidth={OUTLINE} strokeLinejoin="round" />
                {look.stripes && (
                  <g clipPath="url(#torsoClip)">
                    {[0, 1, 2, 3, 4].map((i) => (
                      <rect key={i} x={-90} y={SHOULDER_Y - 10 + i * 30} width={180} height={14} fill={look.stripes} />
                    ))}
                  </g>
                )}
                <defs>
                  <clipPath id="torsoClip">
                    <path d={`M -76 ${SHOULDER_Y + 2} Q -82 ${SHOULDER_Y - 18} -52 ${SHOULDER_Y - 22} L 52 ${SHOULDER_Y - 22} Q 82 ${SHOULDER_Y - 18} 76 ${SHOULDER_Y + 2} L 66 -150 Q 0 -138 -66 -150 Z`} />
                  </clipPath>
                </defs>
                {look.overlay === 'vest' && (
                  <path d={`M -58 ${SHOULDER_Y - 16} L -26 ${SHOULDER_Y - 18} L -14 ${SHOULDER_Y + 40} L -40 -152 L -62 -152 Z M 58 ${SHOULDER_Y - 16} L 26 ${SHOULDER_Y - 18} L 14 ${SHOULDER_Y + 40} L 40 -152 L 62 -152 Z`} fill={look.overlayColor} stroke={C.ink} strokeWidth={OUTLINE} strokeLinejoin="round" />
                )}
                {look.overlay === 'cardigan' && (
                  <path d={`M -76 ${SHOULDER_Y + 2} Q -82 ${SHOULDER_Y - 18} -52 ${SHOULDER_Y - 22} L -22 ${SHOULDER_Y - 22} L -10 -150 L -66 -150 Z M 76 ${SHOULDER_Y + 2} Q 82 ${SHOULDER_Y - 18} 52 ${SHOULDER_Y - 22} L 22 ${SHOULDER_Y - 22} L 10 -150 L 66 -150 Z`} fill={look.overlayColor} stroke={C.ink} strokeWidth={OUTLINE} strokeLinejoin="round" />
                )}
                {look.overlay === 'apron' && (
                  <path d={`M -34 ${SHOULDER_Y - 10} L 34 ${SHOULDER_Y - 10} L 60 -150 L -60 -150 Z`} fill={look.overlayColor} stroke={C.ink} strokeWidth={OUTLINE} strokeLinejoin="round" />
                )}
                {look.overlay === 'jacket' && (
                  <path d={`M -76 ${SHOULDER_Y + 2} Q -82 ${SHOULDER_Y - 18} -52 ${SHOULDER_Y - 22} L -30 ${SHOULDER_Y - 22} L 0 ${SHOULDER_Y + 50} L -8 -150 L -66 -150 Z M 76 ${SHOULDER_Y + 2} Q 82 ${SHOULDER_Y - 18} 52 ${SHOULDER_Y - 22} L 30 ${SHOULDER_Y - 22} L 0 ${SHOULDER_Y + 50} L 8 -150 L 66 -150 Z`} fill={look.overlayColor} stroke={C.ink} strokeWidth={OUTLINE} strokeLinejoin="round" />
                )}
                {look.accessories.includes('tie') && <path d={`M -9 ${SHOULDER_Y - 16} L 9 ${SHOULDER_Y - 16} L 12 ${SHOULDER_Y + 60} L 0 ${SHOULDER_Y + 74} L -12 ${SHOULDER_Y + 60} Z`} fill={C.coral} stroke={C.ink} strokeWidth={OUTLINE} strokeLinejoin="round" />}
                {look.accessories.includes('nametag') && <rect x={18} y={SHOULDER_Y + 10} width={40} height={22} rx={4} fill={C.white} stroke={C.ink} strokeWidth={3} />}
                {look.accessories.includes('nametag') && <rect x={24} y={SHOULDER_Y + 18} width={28} height={5} rx={2} fill={C.inkMuted} />}
              </g>
              {/* neck */}
              <rect x={-16} y={HEAD_Y + 40} width={32} height={34} fill={look.skin} stroke={C.ink} strokeWidth={OUTLINE} />
              {look.accessories.includes('bowtie') && (
                <g transform={`translate(0 ${SHOULDER_Y - 14})`}>
                  <path d="M -26 -12 L 0 0 L -26 12 Z M 26 -12 L 0 0 L 26 12 Z" fill={C.coral} stroke={C.ink} strokeWidth={OUTLINE} strokeLinejoin="round" />
                  <circle cx={0} cy={0} r={6} fill={C.coralDeep} stroke={C.ink} strokeWidth={3} />
                </g>
              )}
              {/* head */}
              <g transform={`rotate(${pose.tilt} 0 ${HEAD_Y + 50})`}>
                {look.hair === 'bob' && <HairShape hair="bob" color={look.hairColor} />}
                <ellipse cx={0} cy={HEAD_Y} rx={HEAD_R} ry={HEAD_R + 4} fill={look.skin} stroke={C.ink} strokeWidth={OUTLINE} />
                {/* ears */}
                <ellipse cx={-HEAD_R - 2} cy={HEAD_Y + 6} rx={9} ry={12} fill={look.skin} stroke={C.ink} strokeWidth={OUTLINE} />
                <ellipse cx={HEAD_R + 2} cy={HEAD_Y + 6} rx={9} ry={12} fill={look.skin} stroke={C.ink} strokeWidth={OUTLINE} />
                {look.accessories.includes('earring') && <circle cx={HEAD_R + 2} cy={HEAD_Y + 20} r={5} fill={C.saffron} stroke={C.ink} strokeWidth={3} />}
                {look.hair !== 'bob' && <HairShape hair={look.hair} color={look.hairColor} />}
                {look.accessories.includes('beard') && (
                  <path d={`M -44 ${HEAD_Y + 14} Q -46 ${HEAD_Y + 70} 0 ${HEAD_Y + 74} Q 46 ${HEAD_Y + 70} 44 ${HEAD_Y + 14} Q 30 ${HEAD_Y + 36} 0 ${HEAD_Y + 34} Q -30 ${HEAD_Y + 36} -44 ${HEAD_Y + 14} Z`} fill={look.hairColor} stroke={C.ink} strokeWidth={OUTLINE} strokeLinejoin="round" />
                )}
                {look.cheeks && (
                  <g opacity={0.55}>
                    <circle cx={-34} cy={HEAD_Y + 16} r={9} fill={C.coral} />
                    <circle cx={34} cy={HEAD_Y + 16} r={9} fill={C.coral} />
                  </g>
                )}
                {/* eyes */}
                {[-1, 1].map((s) => (
                  <g key={s} transform={`translate(${s * 21} ${eyeY})`}>
                    <ellipse cx={0} cy={0} rx={12} ry={Math.max(0.6, 13 * bl)} fill={C.white} stroke={C.ink} strokeWidth={3} />
                    {bl > 0.25 && <circle cx={pose.lookX * 5} cy={pose.lookY * 4} r={5.5} fill={C.ink} />}
                    {bl > 0.25 && <circle cx={pose.lookX * 5 + 2} cy={pose.lookY * 4 - 2} r={1.6} fill={C.white} />}
                    <line x1={-12} y1={s < 0 ? browL : browR} x2={12} y2={(s < 0 ? browL : browR) + s * pose.brows * 6} stroke={C.ink} strokeWidth={OUTLINE + 1} strokeLinecap="round" transform={`translate(0 -10)`} />
                  </g>
                ))}
                {/* nose */}
                <path d={`M 2 ${HEAD_Y + 2} Q 10 ${HEAD_Y + 16} 0 ${HEAD_Y + 18}`} fill="none" stroke={C.ink} strokeWidth={3} strokeLinecap="round" />
                <MouthShape mouth={pose.mouth} y={HEAD_Y + 30} talkPhase={frame / 2.2} />
                {/* accessories on the face */}
                {look.accessories.includes('glasses') && (
                  <g fill="none" stroke={C.ink} strokeWidth={3.5}>
                    <rect x={-37} y={eyeY - 15} width={30} height={26} rx={7} />
                    <rect x={7} y={eyeY - 15} width={30} height={26} rx={7} />
                    <line x1={-7} y1={eyeY - 4} x2={7} y2={eyeY - 4} />
                  </g>
                )}
                {look.accessories.includes('roundGlasses') && (
                  <g fill="none" stroke={C.ink} strokeWidth={3.5}>
                    <circle cx={-21} cy={eyeY} r={17} />
                    <circle cx={21} cy={eyeY} r={17} />
                    <line x1={-4} y1={eyeY - 2} x2={4} y2={eyeY - 2} />
                  </g>
                )}
                {look.accessories.includes('visor') && (
                  <g>
                    <path d={`M ${-HEAD_R - 8} ${HEAD_Y - 30} Q 0 ${HEAD_Y - 44} ${HEAD_R + 8} ${HEAD_Y - 30} L ${HEAD_R + 20} ${HEAD_Y - 14} Q 0 ${HEAD_Y - 2} ${-HEAD_R - 20} ${HEAD_Y - 14} Z`} fill={C.teal} stroke={C.ink} strokeWidth={OUTLINE} strokeLinejoin="round" />
                  </g>
                )}
                {look.accessories.includes('headset') && (
                  <g fill="none" stroke={C.ink} strokeWidth={4}>
                    <path d={`M ${-HEAD_R - 6} ${HEAD_Y} Q ${-HEAD_R - 6} ${HEAD_Y - HEAD_R - 14} 0 ${HEAD_Y - HEAD_R - 16} Q ${HEAD_R + 6} ${HEAD_Y - HEAD_R - 14} ${HEAD_R + 6} ${HEAD_Y}`} />
                    <rect x={HEAD_R - 2} y={HEAD_Y - 6} width={14} height={22} rx={5} fill={C.ink} />
                    <path d={`M ${HEAD_R + 4} ${HEAD_Y + 16} Q ${HEAD_R + 10} ${HEAD_Y + 46} 22 ${HEAD_Y + 42}`} />
                  </g>
                )}
                {look.accessories.includes('pencil') && (
                  <g transform={`translate(${HEAD_R - 6} ${HEAD_Y - 20}) rotate(-70)`}>
                    <rect x={-5} y={-30} width={10} height={60} rx={2} fill={C.saffron} stroke={C.ink} strokeWidth={3} />
                    <path d="M -5 30 L 0 40 L 5 30 Z" fill={look.skin} stroke={C.ink} strokeWidth={3} />
                  </g>
                )}
              </g>
            </g>
          )}
          {/* front arm pass */}
          {drawFrontArm && frontIsL && LArm}
          {drawFrontArm && frontIsR && RArm}
        </g>
      </g>
    </svg>
  );
};

