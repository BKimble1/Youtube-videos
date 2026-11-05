// V3 A/B/H: the profile arm and hand (Stocco's right hand on his keyboard, Rao's right hand flat on his desk).
// Copied from the shared V2 FingerECU (v3/finger.tsx) and extended, so the same anatomy works at every scale:
//  - hand units (HU) are the FingerECU's world (wrist pivot W, index MCP knuckle KN, phalanges 300 / 200 / 170);
//  - the whole arm is drawn: upper arm (sleeve) from the crew rig's shoulder, elbow, bare forearm, wrist, hand;
//  - a finite keyboard (space bar solved from the DOWN pose, so contact is geometry) or none (a flat desk);
//  - the ink contour width is passed in, so a medium shot matches the crew rig's line and an extreme close-up
//    stays fine-lined.
// In a front-view room the right hand is frame-left of the body: the forearm runs from the elbow (frame-right)
// toward frame-left, so the hand is seen in profile from the thumb side with the finger pointing frame-left: the
// same screen geography as the extreme close-up. A room places the wrist pivot at a room point P with scale HS.
import React from 'react';
import {lit, mix, shade} from '../dc/color';
import {Inked, InkLine} from '../dc/ink';
import {clamp, fmt, rad, V} from '../dc/math';
import {Capsule, Lin, SoftShadow} from '../dc/shade';
import {INK, K} from '../art/kit';

export type HPose = {
  /** hand rotation about the wrist pivot W (deg): negative lifts the knuckles (extension) */
  wrist: number;
  /** index joint flexion (deg): MCP, PIP, DIP; positive bends toward the palm */
  a: [number, number, number];
  /** middle-finger extra curl 0..1 */
  curl: number;
};
export const H_HOVER: HPose = {wrist: 0, a: [18, 22, 12], curl: 0.35};
export const H_LIFT: HPose = {wrist: -2, a: [-6, 10, 6], curl: 0.3};
export const H_DOWN: HPose = {wrist: 1.5, a: [30, 32, 18], curl: 0.42};
/** the TMS-driven jerk: wrist extension, fingers trailing (passive) */
export const H_JERK: HPose = {wrist: -13, a: [8, 14, 8], curl: 0.3};
/** relaxed, resting a little above the bar */
export const H_REST: HPose = {wrist: 2, a: [14, 16, 10], curl: 0.4};
/** a deliberate, voluntary curl back from the key (the decision not to press) */
export const H_TUCK: HPose = {wrist: -1, a: [4, 46, 30], curl: 0.55};
/** flat on a desk (Rao): fingers extended, the pads on the surface */
export const H_FLAT: HPose = {wrist: 4, a: [3, 4, 2], curl: 0.08};
export const mixH = (p: HPose, q: HPose, t: number): HPose => ({
  wrist: p.wrist + (q.wrist - p.wrist) * t,
  a: [0, 1, 2].map((i) => p.a[i] + (q.a[i] - p.a[i]) * t) as HPose['a'],
  curl: p.curl + (q.curl - p.curl) * t,
});

export const W: V = {x: 2250, y: 470}; // wrist pivot
const KN: V = {x: 1360, y: 400}; // index MCP knuckle at wrist 0
const L = [300, 200, 170];
const R = [66, 60, 55, 52];
/** hand units -> room units */
export const HS = 0.118;
/** forearm direction from the wrist toward the elbow (hand units), and the room lengths of the crew rig's arm */
export const FORE_DIR = (() => {
  const d = {x: 450, y: 50};
  const l = Math.hypot(d.x, d.y);
  return {x: d.x / l, y: d.y / l};
})();
export const FORE_ROOM = 117; // crew FORE 78 x 1.5
const lerpN = (a: number, b: number, k: number) => a + (b - a) * k;
const easeOutN = (t: number) => 1 - Math.pow(1 - Math.min(1, Math.max(0, t)), 3);
const dir = (deg: number): V => ({x: -Math.cos(rad(deg)), y: Math.sin(rad(deg))});
const rotW = (p: V, deg: number): V => {
  const c = Math.cos(rad(deg)), s = Math.sin(rad(deg));
  const dx = p.x - W.x, dy = p.y - W.y;
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
const palmN = (d: V, l: number): V => {
  const a = Math.atan2(d.y / l, -d.x / l);
  return {x: Math.sin(a), y: Math.cos(a)};
};
export const indexPts = (p: HPose) => chain(KN, 4, p.a, L).map((q) => rotW(q, p.wrist));
export const padPt = (p: HPose): V => {
  const pts = indexPts(p);
  const d = {x: pts[3].x - pts[2].x, y: pts[3].y - pts[2].y};
  const l = Math.hypot(d.x, d.y) || 1;
  const nn = palmN(d, l);
  const c = {x: pts[2].x + d.x * 0.62, y: pts[2].y + d.y * 0.62};
  return {x: c.x + nn.x * R[3] * 0.95, y: c.y + nn.y * R[3] * 0.95};
};
const PAD_DOWN = padPt(H_DOWN);
/** the space bar's top-face front-edge centre (hand units), solved from the DOWN pose */
export const KEY = {x: PAD_DOWN.x + 40, y: PAD_DOWN.y + 40, w: 980, depth: 80, face: 66, travel: 24};
/** the keyboard deck: its base top (hand units) */
export const KB = {x0: KEY.x - 1650, x1: KEY.x + 1180, top: KEY.y + 60, base: KEY.y + 132};
/** the DOWN pose pushed through the key travel: the hand follows the cap down */
export const pressPose = (press: number): HPose => ({...H_DOWN, wrist: H_DOWN.wrist + 0.8 * press});
export const keyTopY = (press: number) => KEY.y - KEY.depth * 0.5 + press * KEY.travel;
/** Rao's flat hand: the desk surface (hand units) under the H_FLAT pads */
export const FLAT_DESK_Y = (() => {
  const p = indexPts(H_FLAT);
  return Math.max(padPt(H_FLAT).y, p[3].y + R[3] * 0.9) + 2;
})();

/** room point of a hand-unit point, for a hand whose wrist pivot is at room point P */
export const h2r = (P: V, q: V): V => ({x: P.x + (q.x - W.x) * HS, y: P.y + (q.y - W.y) * HS});
export const r2h = (P: V, q: V): V => ({x: W.x + (q.x - P.x) / HS, y: W.y + (q.y - P.y) / HS});
/** the elbow (room) for a wrist pivot at P */
export const elbowOf = (P: V): V => ({x: P.x + FORE_DIR.x * FORE_ROOM, y: P.y + FORE_DIR.y * FORE_ROOM});
/** contour width (hand units) for a given room zoom: matches the crew rig's line in medium shots, stays fine in a
 *  close-up (on-screen outline ~ 3 px per unit of room zoom, eased toward ~6 px when very close) */
export const inkFor = (roomZ: number) => {
  const px = (3 * roomZ) / (1 + 0.32 * Math.max(0, roomZ - 1.4));
  return px / (0.36 * HS * roomZ);
};

const Keycap: React.FC<{id: string; x: number; y: number; w: number; press: number; glow?: number; kind?: 'space' | 'key'; inkW: number}> = ({id, x, y, w, press, glow = 0, kind = 'space', inkW}) => {
  const dz = press * KEY.travel;
  const d = KEY.depth, h = KEY.face;
  const sk = 26;
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
      <rect x={x - w / 2 - 8} y={y + h - 6} width={w + 16} height={22} rx={6} fill={INK} opacity={0.25 + 0.25 * press} />
      <path d={front} fill={`url(#${id}-f)`} stroke={INK} strokeWidth={inkW} strokeLinejoin="round" />
      <path d={top} fill={`url(#${id}-t)`} stroke={INK} strokeWidth={inkW} strokeLinejoin="round" />
      {kind === 'space' && <path d={`M${x - w / 2 + 60},${y - d * 0.35 + dz} L${x + w / 2 - 60},${y - d * 0.35 + dz}`} stroke="#FFFFFF" strokeWidth={8} strokeLinecap="round" opacity={0.6} />}
      {glow > 0 && <path d={top} fill={K.saffron} opacity={0.6 * glow} />}
    </g>
  );
};

/** the finite keyboard (hand units): base slab, two back rows, the front row with the space bar */
export const KeyboardHU: React.FC<{id: string; press?: number; keyGlow?: number; inkW: number; rise?: number}> = ({id, press = 0, keyGlow = 0, inkW, rise = 1}) => {
  const kw = Math.max(3, inkW * 0.6);
  // rise 0..1: the deck and keys build outward from the space bar (the ending's carry of the cleared line)
  const vis = (x: number) => clamp((rise * 1.5 - Math.abs(x - KEY.x) / 1800) / 0.35);
  const row = (y: number, n: number, x0: number, w: number, tag: string) =>
    Array.from({length: n}, (_, i) => {
      const x = x0 + i * (w + 46);
      if (x - w / 2 < KB.x0 + 30 || x + w / 2 > KB.x1 - 30) return null;
      const v = vis(x);
      if (v <= 0.001) return null;
      return (
        <g key={`${tag}${i}`} transform={`translate(0 ${fmt((1 - v) * 90)})`} opacity={clamp(v * 4)}>
          <Keycap id={`${id}-${tag}${i}`} x={x} y={y} w={w} press={0} kind="key" inkW={kw} />
        </g>
      );
    });
  const deck = clamp(rise * 1.6 - 0.25);
  return (
    <g>
      {deck > 0.001 && (
        <g transform={deck < 1 ? `translate(${fmt(KEY.x)} ${fmt(KEY.y)}) scale(${fmt(Math.max(0.36, easeOutN(deck)))} ${fmt(Math.max(0.5, easeOutN(deck)))}) translate(${fmt(-KEY.x)} ${fmt(-KEY.y)})` : undefined}>
          <path d={`M${KB.x0 + 60},${KEY.y - 2 * KEY.depth - 120} L${KB.x1 - 60},${KEY.y - 2 * KEY.depth - 120} L${KB.x1},${KB.top} L${KB.x0},${KB.top} Z`} fill="#C9D1D8" stroke={INK} strokeWidth={kw} strokeLinejoin="round" />
          <rect x={KB.x0} y={KB.top} width={KB.x1 - KB.x0} height={KB.base - KB.top} rx={18} fill="#A4AFB8" stroke={INK} strokeWidth={kw} />
        </g>
      )}
      {row(KEY.y - 2 * (KEY.depth + 18), 7, KEY.x - 1340, 300, 'b')}
      {row(KEY.y - (KEY.depth + 18), 7, KEY.x - 1190, 300, 'm')}
      {vis(KEY.x - KEY.w / 2 - 200) > 0 && (
        <g opacity={clamp(vis(KEY.x - 700) * 2)}>
          <Keycap id={`${id}-l`} x={KEY.x - KEY.w / 2 - 200} y={KEY.y} w={300} press={0} kind="key" inkW={kw} />
          <Keycap id={`${id}-r`} x={KEY.x + KEY.w / 2 + 200} y={KEY.y} w={300} press={0} kind="key" inkW={kw} />
        </g>
      )}
      <Keycap id={`${id}-sp`} x={KEY.x} y={KEY.y} w={KEY.w} press={press} glow={keyGlow} inkW={kw} />
    </g>
  );
};

export type ArmHandProps = {
  id: string;
  pose: HPose;
  /** the shoulder (hand units); the elbow is solved along the forearm */
  shoulder?: V;
  skin: string;
  sleeve: string;
  /** contour width (hand units) */
  inkW: number;
  press?: number;
  keyGlow?: number;
  /** travelling glow (the stimulation, metaphor) along shoulder -> elbow -> wrist -> fingertip, head 0..1; < 0 off */
  drive?: number;
  /** draw the keyboard */
  keyboard?: boolean;
  keyRise?: number;
  /** contact surface for a flat hand (no keyboard): y (hand units) */
  surfaceY?: number;
  /** extra wrist lift of the whole forearm (hand units), for a voluntary lift of the arm */
  armLift?: number;
  /** the whole drive path lit (the connection, frame 0) */
  driveLit?: number;
  /** offset (hand units) of the arm and hand only (the keyboard stays): the hand entering the shot */
  handOffset?: V;
};

/** The arm and hand in hand units (wrist pivot W). The forearm is bare (short sleeves, like the crew rig). */
export const ArmHand: React.FC<ArmHandProps> = ({id, pose, shoulder, skin, sleeve, inkW, press = 0, keyGlow = 0, drive = -1, keyboard = true, keyRise = 1, surfaceY, armLift = 0, driveLit = 0, handOffset}) => {
  const off = handOffset ?? {x: 0, y: 0};
  const shoulderL = shoulder ? {x: shoulder.x - off.x, y: shoulder.y - off.y} : undefined;
  const ip = indexPts(pose);
  const midPts = chain({x: KN.x + 40, y: KN.y - 34}, 3, [pose.a[0] + 4 + 8 * pose.curl, pose.a[1] + 6 + 14 * pose.curl, pose.a[2] + 4 + 8 * pose.curl], [300, 196, 160]).map((q) => rotW(q, pose.wrist));
  const ringPts = chain({x: KN.x + 92, y: KN.y - 56}, 2, [pose.a[0] + 10 + 12 * pose.curl, pose.a[1] + 14 + 18 * pose.curl, pose.a[2] + 8 + 10 * pose.curl], [270, 170, 140]).map((q) => rotW(q, pose.wrist));
  // one silhouette for the hand and the forearm: the hand points rotate about the wrist, the forearm does not, so the
  // outline bends at the wrist instead of showing a seam
  const elbow0 = {x: W.x + FORE_DIR.x * (FORE_ROOM / HS), y: W.y + FORE_DIR.y * (FORE_ROOM / HS) - armLift};
  const fn = {x: -FORE_DIR.y, y: FORE_DIR.x}; // forearm normal (down-ish)
  const hp = [{x: 1290, y: 330}, {x: 1600, y: 290}, {x: 2000, y: 330}, {x: 2190, y: 356}, {x: 2190, y: 628}, {x: 1950, y: 620}, {x: 1600, y: 560}, {x: 1340, y: 470}].map((q) => rotW(q, pose.wrist));
  const wT = rotW({x: 2330, y: 352}, pose.wrist * 0.45), wB = rotW({x: 2330, y: 640}, pose.wrist * 0.45);
  const eT = {x: elbow0.x - fn.x * 166, y: elbow0.y - fn.y * 166}, eB = {x: elbow0.x + fn.x * 166, y: elbow0.y + fn.y * 166};
  const P2 = (q: V) => `${fmt(q.x)},${fmt(q.y)}`;
  const handD = `M${P2(hp[0])} C${P2(hp[1])} ${P2(hp[2])} ${P2(hp[3])} Q${P2(wT)} ${P2({x: lerpN(wT.x, eT.x, 0.35), y: lerpN(wT.y, eT.y, 0.35)})} L${P2(eT)} A166,166 0 0 1 ${P2(eB)} L${P2({x: lerpN(wB.x, eB.x, 0.35), y: lerpN(wB.y, eB.y, 0.35)})} Q${P2(wB)} ${P2(hp[4])} C${P2(hp[5])} ${P2(hp[6])} ${P2(hp[7])} Z`;
  const armShadeA = {x: elbow0.x * 0.5 + 1700 * 0.5 - fn.x * 200, y: (elbow0.y + 420) * 0.5 - fn.y * 200 - 80};
  const armShadeB = {x: armShadeA.x + fn.x * 520, y: armShadeA.y + fn.y * 520};
  const th = [{x: 1720, y: 560}, {x: 1500, y: 680}, {x: 1340, y: 720}].map((q) => rotW(q, pose.wrist));
  const back = shade(skin, 0.2);
  const elbow = {x: W.x + FORE_DIR.x * (FORE_ROOM / HS), y: W.y + FORE_DIR.y * (FORE_ROOM / HS) - armLift};
  const wristC = rotW({x: 2230, y: 490}, pose.wrist * 0.5);
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
  // the drive: shoulder -> elbow -> wrist -> back of the hand -> index
  const sh = shoulderL ?? {x: elbow.x + 200, y: elbow.y - 1000};
  const glowPath = [sh, elbow, {x: wristC.x, y: wristC.y - 60}, rotW({x: 1700, y: 340}, pose.wrist), ip[0], ip[1], ip[2], ip[3]];
  const segL = glowPath.slice(1).map((p, i) => Math.hypot(p.x - glowPath[i].x, p.y - glowPath[i].y));
  const glowLen = segL.reduce((s, x) => s + x, 0);
  const glowD = `M${glowPath.map((p, i) => `${fmt(p.x)},${fmt(p.y - (i >= 3 ? 18 : 0))}`).join(' L')}`;
  const pad = padPt(pose);
  const surf = keyboard ? keyTopY(press) + KEY.depth * 0.5 : surfaceY ?? 99999;
  const fw = Math.max(26, inkW * 1.6);
  return (
    <g>
      {keyboard && <KeyboardHU id={`${id}-kb`} press={press} keyGlow={keyGlow} inkW={inkW * 0.72} rise={keyRise} />}
      <g transform={`translate(${fmt(off.x)} ${fmt(off.y)})`}>
      {/* contact shadow of the finger on the cap / desk */}
      <SoftShadow id={`${id}-cs`} c={{x: pad.x + 10, y: (keyboard ? KEY.y - 20 + press * KEY.travel : surf - 6)}} rx={150} ry={22} alpha={0.32 * clamp(1 - (surf - pad.y) / 220)} />
      {!keyboard && surfaceY !== undefined && <SoftShadow id={`${id}-hs`} c={{x: 1800, y: surfaceY - 4}} rx={620} ry={46} alpha={0.22} />}
      {/* the fingers behind: ring, middle */}
      <Inked w={inkW}>
        <Capsule id={`${id}-r1`} a={ringPts[0]} b={ringPts[1]} ra={58} rb={52} color={shade(skin, 0.3)} />
        <Capsule id={`${id}-r2`} a={ringPts[1]} b={ringPts[2]} ra={52} rb={48} color={shade(skin, 0.3)} />
        <Capsule id={`${id}-r3`} a={ringPts[2]} b={ringPts[3]} ra={48} rb={44} color={shade(skin, 0.3)} />
      </Inked>
      <Inked w={inkW}>
        <Capsule id={`${id}-m1`} a={midPts[0]} b={midPts[1]} ra={64} rb={58} color={back} />
        <Capsule id={`${id}-m2`} a={midPts[1]} b={midPts[2]} ra={58} rb={54} color={back} />
        <Capsule id={`${id}-m3`} a={midPts[2]} b={midPts[3]} ra={54} rb={50} color={back} />
      </Inked>
      {/* upper arm (sleeve), forearm, hand and index as one contour */}
      <Inked w={inkW}>
        {shoulderL && <Capsule id={`${id}-ua`} a={shoulderL} b={elbow} ra={196} rb={186} color={sleeve} spec={0.08} />}
        <Lin id={`${id}-hand`} d={handD} from={armShadeA} to={armShadeB} stops={[[0, lit(skin, 0.26)], [0.3, lit(skin, 0.08)], [0.62, skin], [1, shade(skin, 0.28)]]} />
        <Capsule id={`${id}-i1`} a={ip[0]} b={ip[1]} ra={R[0]} rb={R[1]} color={skin} spec={0.2} />
        <Capsule id={`${id}-i2`} a={ip[1]} b={ip[2]} ra={R[1]} rb={R[2]} color={skin} spec={0.2} />
        <Capsule id={`${id}-i3`} a={ip[2]} b={ip[3]} ra={R[2]} rb={R[3]} color={skin} spec={0.3} />
      </Inked>
      {shoulder && <path d={`M${fmt(elbow.x - 150)},${fmt(elbow.y - 120)} Q${fmt(elbow.x + 20)},${fmt(elbow.y - 30)} ${fmt(elbow.x + 190)},${fmt(elbow.y - 60)}`} fill="none" stroke={shade(sleeve, 0.3)} strokeWidth={Math.max(10, inkW * 0.5)} strokeLinecap="round" opacity={0.6} />}
      <InkLine d={`M${fmt(ip[0].x + 30)},${fmt(ip[0].y - 62)} q40,-18 80,-6`} w={6} opacity={0.4} />
      {crease(1)}
      {crease(2)}
      {nail}
      {driveLit > 0.01 && (
        <g fill="none" strokeLinecap="round" strokeLinejoin="round" opacity={driveLit}>
          <path d={glowD} stroke={K.saffron} strokeWidth={fw * 2.4} opacity={0.3} />
          <path d={glowD} stroke={K.saffron} strokeWidth={fw * 0.8} />
        </g>
      )}
      {drive >= 0 && drive <= 1.25 && (
        <path d={glowD} fill="none" stroke={K.saffron} strokeWidth={fw} strokeLinecap="round" strokeLinejoin="round"
          strokeDasharray={`${fmt(glowLen * 0.16)} ${fmt(glowLen * 2)}`} strokeDashoffset={fmt(-glowLen * (drive - 0.16))} opacity={0.9 * clamp((1.25 - drive) / 0.25)} />
      )}
      {/* thumb in front */}
      <Inked w={inkW}>
        <Capsule id={`${id}-t1`} a={th[0]} b={th[1]} ra={78} rb={66} color={skin} />
        <Capsule id={`${id}-t2`} a={th[1]} b={th[2]} ra={66} rb={56} color={skin} spec={0.25} />
      </Inked>
      </g>
    </g>
  );
};

/** the arm and hand placed in a room: wrist pivot at room point P (scale HS) */
export const RoomArm: React.FC<Omit<ArmHandProps, 'shoulder'> & {P: V; shoulderRoom?: V}> = ({P, shoulderRoom, ...rest}) => (
  <g transform={`translate(${fmt(P.x)} ${fmt(P.y)}) scale(${HS}) translate(${-W.x} ${-W.y})`}>
    <ArmHand {...rest} shoulder={shoulderRoom ? r2h(P, shoulderRoom) : undefined} />
  </g>
);

// ---------------------------------------------------------------- motion: the involuntary TMS press and the voluntary hover
/** the TMS-driven press. tp = the pulse (coil click); the wrist is yanked into extension on a stiff spring with a
 *  decaying tremor, then drops (accelerating) to contact; the key travels on a spring; then the hand is released
 *  passively and drifts back to hover. Returns the pose, key travel and the times. */
export const tmsPress = (t: number, tp: number, from: HPose = H_HOVER) => {
  const j0 = tp + 0.05; // nerve latency
  const j1 = j0 + 0.11; // peak extension
  const d0 = j1 + 0.09; // the drop begins
  const tc = d0 + 0.1; // contact
  const r0 = tc + 0.16; // release begins
  const r1 = r0 + 0.5;
  let pose = from;
  let press = 0;
  if (t < j0) pose = from;
  else if (t < j1) {
    const u = (t - j0) / (j1 - j0);
    const e = 1 - Math.pow(1 - u, 4);
    pose = mixH(from, H_JERK, e * 1.08);
  } else if (t < d0) {
    const e = t - j1;
    const osc = Math.exp(-e * 22) * Math.sin(e * 70);
    pose = {...mixH(from, H_JERK, 1.08 - 0.08 * clamp(e / 0.05)), wrist: H_JERK.wrist - 1.2 * osc};
  } else if (t < tc) {
    const u = (t - d0) / (tc - d0);
    pose = mixH(H_JERK, H_DOWN, u * u * u);
  } else if (t < r0) {
    const e = t - tc;
    press = Math.min(1.15, 1 - Math.exp(-e * 38) * Math.cos(e * 30));
    pose = pressPose(press);
  } else {
    const u = clamp((t - r0) / (r1 - r0));
    const e = 1 - Math.pow(1 - u, 3);
    press = Math.max(0, 1 - clamp((t - r0) / 0.09));
    // passive rebound: a small overshoot up past hover, then settle
    const reb = Math.sin(Math.PI * clamp(u * 1.4)) * 0.25 * (1 - u);
    pose = mixH(pressPose(press), H_HOVER, e);
    pose = {...pose, wrist: pose.wrist - 3 * reb, a: [pose.a[0] - 5 * reb, pose.a[1], pose.a[2]]};
  }
  return {pose, press, tc, j0, r1, keyGlow: t >= tc ? Math.max(0, 1 - (t - tc) / 0.4) : 0};
};
