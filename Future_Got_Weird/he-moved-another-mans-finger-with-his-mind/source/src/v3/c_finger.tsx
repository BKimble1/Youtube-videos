// V3 Sequence C copy of finger.tsx (shared file left untouched): the forearm is BARE skin to the frame edge (Stocco wears
// short sleeves in A/B/H), no green cuff at the wrist.
// V2: the extreme close-up (ECU) of Stocco's right index finger and the space bar, in the Weird Crew finish.
// Profile from the thumb side, the hand entering from frame-right and the finger pointing frame-left (the same
// screen geography as every Stocco shot). World units are frame pixels at camera zoom 1 (frame 1920 x 1080).
//
// Anatomy: the finger is a three-phalanx chain from the MCP knuckle (proximal 300, middle 200, distal 170, radius
// tapering 66 -> 52) with joint creases on the dorsal side, a nail on the distal phalanx and a soft pad underneath.
// The middle finger sits behind it (darker, a little more curled), the thumb rests in front below the index
// knuckle, and the back of the hand runs off frame-right to the wrist. The wrist pivot (W) is off frame: rotating
// the hand about W is the TMS-driven wrist jerk (extension up, then the drop), distinct from a finger tap.
//
// The space bar is drawn in oblique: a top face (depth 80) and a front face. `press` 0..1 moves the cap down 24 px
// (keyboard compression) and darkens the gap beneath. The key's position is solved so the DOWN pose's pad lands on
// the top face exactly: contact is geometry, not a guess.
import React from 'react';
import {lit, mix, shade} from '../dc/color';
import {Inked, InkLine} from '../dc/ink';
import {clamp, fmt, rad, V} from '../dc/math';
import {Blob, Capsule, SoftShadow} from '../dc/shade';
import {INK, K} from '../art/kit';

export type FPose = {
  /** hand rotation about the wrist pivot W (deg): negative lifts the knuckles (extension) */
  wrist: number;
  /** index joint flexion (deg): MCP, PIP, DIP; positive bends the finger down toward the palm */
  a: [number, number, number];
  /** middle-finger extra curl 0..1 */
  curl: number;
};
export const F_HOVER: FPose = {wrist: 0, a: [18, 22, 12], curl: 0.35};
export const F_LIFT: FPose = {wrist: -2, a: [-6, 10, 6], curl: 0.3};
export const F_DOWN: FPose = {wrist: 1.5, a: [30, 32, 18], curl: 0.42};
/** the TMS jerk: extension at the wrist, fingers trailing */
export const F_JERK: FPose = {wrist: -13, a: [8, 14, 8], curl: 0.3};
/** a relaxed, voluntary resting curl (the ending) */
export const F_REST: FPose = {wrist: 2, a: [14, 16, 10], curl: 0.4};
export const mixF = (p: FPose, q: FPose, t: number): FPose => ({
  wrist: p.wrist + (q.wrist - p.wrist) * t,
  a: [0, 1, 2].map((i) => p.a[i] + (q.a[i] - p.a[i]) * t) as FPose['a'],
  curl: p.curl + (q.curl - p.curl) * t,
});

const W: V = {x: 2250, y: 470}; // wrist pivot (off frame-right)
const KN: V = {x: 1360, y: 400}; // index MCP knuckle at wrist 0
const L = [300, 200, 170];
const R = [66, 60, 55, 52];
const dir = (deg: number): V => ({x: -Math.cos(rad(deg)), y: Math.sin(rad(deg))}); // 0 = pointing frame-left
const rotW = (p: V, deg: number): V => {
  const c = Math.cos(rad(deg)), s = Math.sin(rad(deg));
  const dx = p.x - W.x, dy = p.y - W.y;
  // positive wrist = flexion = knuckles DOWN (clockwise on screen for a hand pointing left is counter-clockwise)
  return {x: W.x + dx * c + dy * s, y: W.y - dx * s + dy * c};
};
const chain = (k: V, base: number, a: number[], Ls: number[]) => {
  const pts = [k];
  let ang = base;
  for (let i = 0; i < 3; i++) {
    ang += a[i];
    const d = dir(ang);
    const p = pts[i];
    pts.push({x: p.x + d.x * Ls[i], y: p.y + d.y * Ls[i]});
  }
  return pts;
};
/** palm-side unit normal of a segment direction d (finger pointing frame-left; flexion turns it toward the palm) */
const palmN = (d: V, l: number): V => {
  const a = Math.atan2(d.y / l, -d.x / l);
  return {x: Math.sin(a), y: Math.cos(a)};
};
/** index joints [MCP, PIP, DIP, tip] in world for a pose */
export const indexPts = (p: FPose) => chain(KN, 4, p.a, L).map((q) => rotW(q, p.wrist));
/** the finger pad's lowest point (contact point) for a pose */
export const padPt = (p: FPose): V => {
  const pts = indexPts(p);
  const d = {x: pts[3].x - pts[2].x, y: pts[3].y - pts[2].y};
  const l = Math.hypot(d.x, d.y) || 1;
  const nn = palmN(d, l); // the palm-side normal
  const c = {x: pts[2].x + d.x * 0.62, y: pts[2].y + d.y * 0.62};
  return {x: c.x + nn.x * R[3] * 0.95, y: c.y + nn.y * R[3] * 0.95};
};
const PAD_DOWN = padPt(F_DOWN);
/** the space bar's top-face front-edge centre, solved from the DOWN pose */
export const KEY = {x: PAD_DOWN.x + 40, y: PAD_DOWN.y + 40, w: 980, depth: 80, face: 66, travel: 24};
/** DOWN pose pushed through the key travel (press 0..1): the hand follows the cap down */
export const pressPose = (press: number): FPose => ({...F_DOWN, wrist: F_DOWN.wrist + 0.8 * press});

const Keycap: React.FC<{id: string; x: number; y: number; w: number; press: number; glow?: number; kind?: 'space' | 'key'}> = ({id, x, y, w, press, glow = 0, kind = 'space'}) => {
  const dz = press * KEY.travel;
  const d = KEY.depth, h = KEY.face;
  const sk = 26; // the back edge is inset (oblique)
  const top = `M${x - w / 2 + sk},${y - d + dz} L${x + w / 2 - sk},${y - d + dz} L${x + w / 2},${y + dz} L${x - w / 2},${y + dz} Z`;
  const front = `M${x - w / 2},${y + dz} L${x + w / 2},${y + dz} L${x + w / 2 - 6},${y + h + dz * 0.2} L${x - w / 2 + 6},${y + h + dz * 0.2} Z`;
  return (
    <g>
      <defs>
        <linearGradient id={`${id}-t`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={kind === 'space' ? '#F7F9FB' : '#EEF2F5'} />
          <stop offset="1" stopColor={kind === 'space' ? '#E2E8ED' : '#DCE3E9'} />
        </linearGradient>
        <linearGradient id={`${id}-f`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#C9D2DA" />
          <stop offset="1" stopColor="#A9B5C0" />
        </linearGradient>
      </defs>
      {/* the gap/shadow below the cap deepens as it travels down */}
      <rect x={x - w / 2 - 8} y={y + h - 6} width={w + 16} height={22} rx={6} fill={INK} opacity={0.25 + 0.25 * press} />
      <path d={front} fill={`url(#${id}-f)`} stroke={INK} strokeWidth={6} strokeLinejoin="round" />
      <path d={top} fill={`url(#${id}-t)`} stroke={INK} strokeWidth={6} strokeLinejoin="round" />
      {kind === 'space' && <path d={`M${x - w / 2 + 60},${y - d * 0.35 + dz} L${x + w / 2 - 60},${y - d * 0.35 + dz}`} stroke="#FFFFFF" strokeWidth={8} strokeLinecap="round" opacity={0.6} />}
      {glow > 0 && <path d={top} fill={K.saffron} opacity={0.5 * glow} />}
    </g>
  );
};

export const FingerECU: React.FC<{
  id: string;
  pose: FPose;
  /** space bar travel 0..1 */
  press?: number;
  /** saffron flash on the cap at contact 0..1 */
  keyGlow?: number;
  /** a travelling glow along the back of the hand toward the finger (the TMS-driven command), 0..1 progress; <0 off */
  drive?: number;
  /** the voluntary choice: a calm teal halo instead of the saffron drive (0..1) */
  calm?: number;
  skin?: string;
  sleeve?: string;
  /** draw the keyboard deck and neighbouring keys */
  deck?: boolean;
}> = ({id, pose, press = 0, keyGlow = 0, drive = -1, calm = 0, skin = K.stoccoSkin, deck = true}) => {
  const ip = indexPts(pose);
  const midPts = chain({x: KN.x + 40, y: KN.y - 34}, 3, [pose.a[0] + 4 + 8 * pose.curl, pose.a[1] + 6 + 14 * pose.curl, pose.a[2] + 4 + 8 * pose.curl], [300, 196, 160]).map((q) => rotW(q, pose.wrist));
  const hand = [
    {x: 1290, y: 330}, {x: 1600, y: 290}, {x: 2000, y: 330}, {x: 2300, y: 380},
    {x: 2300, y: 640}, {x: 1950, y: 620}, {x: 1600, y: 560}, {x: 1340, y: 470},
  ].map((q) => rotW(q, pose.wrist));
  const handD = `M${fmt(hand[0].x)},${fmt(hand[0].y)} C${fmt(hand[1].x)},${fmt(hand[1].y)} ${fmt(hand[2].x)},${fmt(hand[2].y)} ${fmt(hand[3].x)},${fmt(hand[3].y)} L${fmt(hand[4].x)},${fmt(hand[4].y)} C${fmt(hand[5].x)},${fmt(hand[5].y)} ${fmt(hand[6].x)},${fmt(hand[6].y)} ${fmt(hand[7].x)},${fmt(hand[7].y)} Z`;
  const th = [{x: 1720, y: 560}, {x: 1500, y: 680}, {x: 1340, y: 720}].map((q) => rotW(q, pose.wrist));
  const back = shade(skin, 0.2);
  // dorsal crease marks at the PIP and DIP joints (fill only)
  const crease = (j: number) => {
    const p = ip[j], a = ip[j - 1], b = ip[j + 1];
    const d = {x: b.x - a.x, y: b.y - a.y};
    const l = Math.hypot(d.x, d.y) || 1;
    const pn = palmN(d, l);
    const up = {x: -pn.x, y: -pn.y};
    const c = {x: p.x + up.x * R[j] * 0.78, y: p.y + up.y * R[j] * 0.78};
    const t = {x: d.x / l, y: d.y / l};
    return [-1, 1].map((s, i) => (
      <path key={i} d={`M${fmt(c.x + t.x * 14 * s - up.x * 4)},${fmt(c.y + t.y * 14 * s - up.y * 4)} q${fmt(up.x * 10)},${fmt(up.y * 10)} ${fmt(t.x * 6 * s)},${fmt(t.y * 6 * s + 2)}`} stroke={shade(skin, 0.4)} strokeWidth={5} fill="none" strokeLinecap="round" opacity={0.55} />
    ));
  };
  const nail = (() => {
    const a = ip[2], b = ip[3];
    const d = {x: b.x - a.x, y: b.y - a.y};
    const l = Math.hypot(d.x, d.y) || 1;
    const pn = palmN(d, l);
    const up = {x: -pn.x, y: -pn.y};
    const c = {x: a.x + d.x * 0.62 + up.x * R[3] * 0.62, y: a.y + d.y * 0.62 + up.y * R[3] * 0.62};
    const ang = (Math.atan2(d.y, d.x) * 180) / Math.PI;
    return (
      <g transform={`translate(${fmt(c.x)} ${fmt(c.y)}) rotate(${fmt(ang)})`}>
        <ellipse cx={0} cy={0} rx={70} ry={20} fill={mix(skin, '#FFFFFF', 0.45)} stroke={shade(skin, 0.35)} strokeWidth={4} />
        <ellipse cx={-14} cy={-5} rx={30} ry={6} fill="#FFFFFF" opacity={0.55} />
      </g>
    );
  })();
  // the drive glow: travels from the wrist (off frame-right) along the back of the hand to the fingertip
  const glowPath = [rotW({x: 2300, y: 420}, pose.wrist), rotW({x: 1700, y: 340}, pose.wrist), ip[0], ip[1], ip[2], ip[3]];
  const glowLen = glowPath.slice(1).reduce((s, p, i) => s + Math.hypot(p.x - glowPath[i].x, p.y - glowPath[i].y), 0);
  const glowD = `M${glowPath.map((p) => `${fmt(p.x)},${fmt(p.y - 18)}`).join(' L')}`;
  return (
    <g>
      {deck && (
        <g>
          {/* desk and keyboard deck, back row keys */}
          <rect x={-2000} y={KEY.y + 80} width={6000} height={1400} fill="#C99A68" />
          <rect x={-2000} y={KEY.y + 58} width={6000} height={40} fill="#B9C4CC" stroke={INK} strokeWidth={5} />
          {[-760, -380, 0, 380, 760, 1140].map((dx, i) => (
            <Keycap key={i} id={`${id}-bk${i}`} x={KEY.x - 420 + dx} y={KEY.y - KEY.depth - 18} w={330} press={0} kind="key" />
          ))}
          <Keycap id={`${id}-l`} x={KEY.x - KEY.w / 2 - 210} y={KEY.y} w={330} press={0} kind="key" />
          <Keycap id={`${id}-r`} x={KEY.x + KEY.w / 2 + 210} y={KEY.y} w={330} press={0} kind="key" />
        </g>
      )}
      <Keycap id={`${id}-sp`} x={KEY.x} y={KEY.y} w={KEY.w} press={press} glow={keyGlow} />
      {/* contact shadow of the finger on the cap */}
      <SoftShadow id={`${id}-cs`} c={{x: padPt(pose).x + 10, y: KEY.y - 20 + press * KEY.travel}} rx={150} ry={22} alpha={0.32 * clamp(1 - (KEY.y - padPt(pose).y) / 200)} />
      {/* middle finger behind */}
      <Inked w={10}>
        <Capsule id={`${id}-m1`} a={midPts[0]} b={midPts[1]} ra={64} rb={58} color={back} />
        <Capsule id={`${id}-m2`} a={midPts[1]} b={midPts[2]} ra={58} rb={54} color={back} />
        <Capsule id={`${id}-m3`} a={midPts[2]} b={midPts[3]} ra={54} rb={50} color={back} />
      </Inked>
      {/* hand + index (one contour), sleeve cuff off frame-right */}
      <Inked w={10}>
        <Blob id={`${id}-hand`} d={handD} c={rotW({x: 1700, y: 420}, pose.wrist)} r={520} color={skin} />
        <Capsule id={`${id}-i1`} a={ip[0]} b={ip[1]} ra={R[0]} rb={R[1]} color={skin} spec={0.2} />
        <Capsule id={`${id}-i2`} a={ip[1]} b={ip[2]} ra={R[1]} rb={R[2]} color={skin} spec={0.2} />
        <Capsule id={`${id}-i3`} a={ip[2]} b={ip[3]} ra={R[2]} rb={R[3]} color={skin} spec={0.3} />
        <Capsule id={`${id}-fa`} a={rotW({x: 2150, y: 486}, pose.wrist)} b={rotW({x: 2900, y: 560}, pose.wrist)} ra={150} rb={172} color={skin} spec={0.15} />
      </Inked>
      {/* knuckle bump and dorsal detail */}
      <InkLine d={`M${fmt(ip[0].x + 30)},${fmt(ip[0].y - 62)} q40,-18 80,-6`} w={6} opacity={0.4} />
      {crease(1)}
      {crease(2)}
      {nail}
      {drive >= 0 && drive <= 1.4 && (
        <path d={glowD} fill="none" stroke={K.saffron} strokeWidth={26} strokeLinecap="round" strokeLinejoin="round"
          strokeDasharray={`${fmt(glowLen * 0.22)} ${fmt(glowLen * 2)}`} strokeDashoffset={fmt(-glowLen * (drive * 1.0 - 0.22))} opacity={0.85 * clamp((1.4 - drive) / 0.4)} />
      )}
      {calm > 0 && <ellipse cx={fmt(ip[2].x)} cy={fmt(ip[2].y - 30)} rx={260} ry={160} fill="none" stroke={K.teal} strokeWidth={10} opacity={0.6 * calm} />}
      {/* thumb in front, resting above the keys */}
      <Inked w={10}>
        <Capsule id={`${id}-t1`} a={th[0]} b={th[1]} ra={78} rb={66} color={skin} />
        <Capsule id={`${id}-t2`} a={th[1]} b={th[2]} ra={66} rb={56} color={skin} spec={0.25} />
      </Inked>
    </g>
  );
};

/** the cap's current top surface y at the pad (for camera dives through the key) */
export const keyTopY = (press: number) => KEY.y - KEY.depth * 0.5 + press * KEY.travel;
export {lit};
