// The two Weird Crew characters of the Telepathy Flaw Short, drawn as busts in the Death Clock finish (dimensional
// gradients from the fixed upper-left key light, one ink contour per figure, glossy highlights):
//  - the SENDER is the cast's "guesser" (red spiky hair, white tee with saffron stripes), seen in 3/4 facing screen-right
//    (his Head is mirrored, the light is not);
//  - the RECEIVER is the cast's "fact-checker" (grey bob, round glasses, cream shirt, coral cardigan), facing screen-left.
// Everything is a pure function of its props; the sender's near arm is a two-bone IK chain for the cancel reach.
import React from 'react';
import {lit, mix, shade} from '../lib/color';
import {Deco, INK, Inked, InkLine, InkPath} from '../lib/ink';
import {Limb} from '../lib/limb';
import {add, clamp, fmt, len, mul, norm, P, perp, sub, V} from '../lib/math';
import {Blob, Capsule, Lin} from '../lib/shade';
import {CREW, Expr, Head} from './Head';
import {Hand, HAND_RELAXED, HandPose} from './Hand';

export const SENDER_C: V = {x: 225, y: 830};
export const SENDER_R = 135;
export const RECEIVER_C: V = {x: 855, y: 852};
export const RECEIVER_R = 125;

export const SAFFRON = '#FFC744';
export const CORAL = '#EF6B55';
export const CREAM = '#F4EFE3';

/** soft two-bone IK: elbow on side `side` (+1 clockwise of the shoulder -> target line) */
export const ik2 = (S: V, T: V, l1: number, l2: number, side: number) => {
  const d0 = sub(T, S);
  const Lt = l1 + l2;
  const d = Math.min(Math.max(len(d0), Math.abs(l1 - l2) + 1), Lt * 0.985);
  const dir = norm(d0);
  const a = (l1 * l1 + d * d - l2 * l2) / (2 * d);
  const h = Math.sqrt(Math.max(0, l1 * l1 - a * a));
  return {E: add(add(S, mul(dir, a)), mul(perp(dir), h * side)), W: add(S, mul(dir, d))};
};

// ---------------------------------------------------------------------------------------------------------------
// Sender
// ---------------------------------------------------------------------------------------------------------------
export type SenderPose = {
  /** head roll (deg), turn 0..1 toward the receiver, torso shift (px) used for recoils */
  roll: number;
  turn: number;
  shiftX: number;
  shiftY: number;
  /** cancel arm: 0 = hanging, 1 = hand at `reachTo` */
  reach: number;
  reachTo: V;
  /** finger tap press 0..1 (the hand pushes toward the panel) */
  press: number;
};

export const senderShoulder = (c: V, R: number, p: {shiftX: number; shiftY: number}): V => ({x: c.x - R * 0.55 + p.shiftX, y: c.y + R * 1.86 + p.shiftY});

/** Joint positions of the sender's near arm (shared with the panel placement and the camera). */
export const senderArm = (c: V, R: number, p: SenderPose) => {
  const S = senderShoulder(c, R, p);
  const l1 = R * 1.55;
  const l2 = R * 1.38;
  const rest = ik2(S, {x: S.x - R * 0.22, y: S.y + (l1 + l2) * 0.93}, l1, l2, -1);
  const reachT = {x: p.reachTo.x - p.press * R * 0.22, y: p.reachTo.y};
  const rch = ik2(S, reachT, l1, l2, 1);
  const E = add(mul(rest.E, 1 - p.reach), mul(rch.E, p.reach));
  const Wp = add(mul(rest.W, 1 - p.reach), mul(rch.W, p.reach));
  return {S, E, W: Wp, l1, l2};
};

export const Sender: React.FC<{
  id: string;
  c?: V;
  R?: number;
  pose: SenderPose;
  expr: Expr;
  blink?: number;
  hand?: HandPose;
  /** head-space layers of the cranial section: under the face features / over everything */
  underlay?: React.ReactNode;
  overlay?: React.ReactNode;
  /** drawn over the torso, in world space (neck window) */
  bodyOverlay?: React.ReactNode;
}> = ({id, c = SENDER_C, R = SENDER_R, pose, expr, blink = 0, hand = HAND_RELAXED, underlay, overlay, bodyOverlay}) => {
  const hc = {x: c.x + pose.shiftX * 0.7, y: c.y + pose.shiftY * 0.7};
  const sh = {x: pose.shiftX, y: pose.shiftY};
  const sy = c.y + R * 1.58 + sh.y; // shoulder top
  const cx = c.x + sh.x;
  const torsoD = `M${fmt(cx - R * 1.36)},${fmt(sy + R * 0.34)} C${fmt(cx - R * 1.36)},${fmt(sy - R * 0.02)} ${fmt(cx - R * 0.95)},${fmt(sy - R * 0.28)} ${fmt(cx - R * 0.42)},${fmt(sy - R * 0.31)} L${fmt(cx + R * 0.36)},${fmt(sy - R * 0.31)} C${fmt(cx + R * 0.86)},${fmt(sy - R * 0.28)} ${fmt(cx + R * 1.12)},${fmt(sy - R * 0.02)} ${fmt(cx + R * 1.14)},${fmt(sy + R * 0.42)} L${fmt(cx + R * 1.2)},${fmt(sy + R * 7)} L${fmt(cx - R * 1.42)},${fmt(sy + R * 7)} Z`;
  const neckA = {x: hc.x + R * 0.04, y: hc.y + R * 0.78};
  const neckB = {x: cx + R * 0.04, y: sy - R * 0.1};
  const arm = senderArm(c, R, pose);
  const reaching = pose.reach > 0.02;
  const wristAng = (Math.atan2(arm.W.y - arm.E.y, arm.W.x - arm.E.x) * 180) / Math.PI;
  const handL = R * 0.98;
  // stripes: saffron bands across the tee, tilted a few degrees like the cast rig
  const bands = Array.from({length: 14}, (_, k) => k);
  return (
    <g>
      <Inked w={R * 0.05} id={`${id}-fig`}>
        {/* far arm: a sleeve and forearm hanging behind the torso, mostly outside the frame */}
        <Capsule id={`${id}-fa`} a={{x: cx + R * 0.9, y: sy + R * 0.1}} b={{x: cx + R * 0.98, y: sy + R * 2.2}} ra={R * 0.34} rb={R * 0.3} color={mix('#FFFFFF', '#DCE6EE', 0.4)} k={0.9} />
        {/* torso (white tee) */}
        <Blob id={`${id}-torso`} d={torsoD} c={{x: cx - R * 0.35, y: sy + R * 0.5}} r={R * 2.3} color="#FFFFFF" k={0.8} focal={0.5} />
        {/* neck */}
        <Capsule id={`${id}-neck`} a={neckA} b={neckB} ra={R * 0.27} rb={R * 0.3} color={CREW.skin} k={1} />
      </Inked>
      <Deco>
        <clipPath id={`${id}-tc`}>
          <path d={torsoD} />
        </clipPath>
        <g clipPath={`url(#${id}-tc)`}>
          {bands.map((k) => (
            <path key={k} d={`M${fmt(cx - R * 1.6)},${fmt(sy + R * 0.16 + k * R * 0.52 + R * 0.04)} L${fmt(cx + R * 1.4)},${fmt(sy + R * 0.16 + k * R * 0.52 - R * 0.05)} L${fmt(cx + R * 1.4)},${fmt(sy + R * 0.16 + k * R * 0.52 + R * 0.2)} L${fmt(cx - R * 1.6)},${fmt(sy + R * 0.16 + k * R * 0.52 + R * 0.29)} Z`} fill={SAFFRON} />
          ))}
          {/* form shading: lit from the upper-left, the right side and the underside fall away */}
          <Lin id={`${id}-tsh`} d={torsoD} from={{x: cx - R * 1.2, y: sy}} to={{x: cx + R * 1.3, y: sy + R * 0.12}} stops={[[0, '#FFFFFF', 0.3], [0.4, '#FFFFFF', 0], [0.75, '#2B4A78', 0.08], [1, '#2B4A78', 0.24]]} />
        </g>
        {/* collar: a rolled tee neckline round the neck */}
        <path d={`M${fmt(neckB.x - R * 0.32)},${fmt(neckB.y - R * 0.04)} Q${fmt(neckB.x)},${fmt(neckB.y + R * 0.34)} ${fmt(neckB.x + R * 0.33)},${fmt(neckB.y - R * 0.05)}`} fill="none" stroke={INK} strokeWidth={R * 0.05} strokeLinecap="round" />
        <path d={`M${fmt(neckB.x - R * 0.3)},${fmt(neckB.y - R * 0.12)} Q${fmt(neckB.x)},${fmt(neckB.y + R * 0.2)} ${fmt(neckB.x + R * 0.31)},${fmt(neckB.y - R * 0.13)} L${fmt(neckB.x + R * 0.3)},${fmt(neckB.y - R * 0.3)} L${fmt(neckB.x - R * 0.3)},${fmt(neckB.y - R * 0.3)} Z`} fill={shade(CREW.skin, 0.12)} opacity={0.55} />
        {/* neck shadow under the chin */}
        <ellipse cx={fmt(hc.x + R * 0.06)} cy={fmt(hc.y + R * 0.98)} rx={R * 0.3} ry={R * 0.16} fill={shade(CREW.skin, 0.5)} opacity={0.45} />
      </Deco>
      {bodyOverlay}
      {/* near arm: sleeve and forearm, hand */}
      <Inked w={R * 0.045} id={`${id}-arm`} fade={[{c: arm.S, r: R * 0.62}]}>
        <Limb id={`${id}-limb`} A={arm.S} B={arm.E} C={arm.W} rA={R * 0.3} rB={R * 0.25} rC={R * 0.21} color={CREW.skin} spec={0.25} crease={R * 0.03} />
        <Limb id={`${id}-slv`} A={arm.S} B={add(arm.S, mul(norm(sub(arm.E, arm.S)), arm.l1 * 0.28))} C={add(arm.S, mul(norm(sub(arm.E, arm.S)), arm.l1 * 0.56))} rA={R * 0.37} rB={R * 0.36} rC={R * 0.35} color="#FFFFFF" capC="flat" k={0.85} />
        <Hand id={`${id}-hand`} wrist={arm.W} ang={wristAng} L={handL} thumbSide={-1} view={reaching ? 'palm' : 'back'} pose={reaching ? {curl: [0.05, 0.38, 0.5, 0.56], spread: 0.3, thumb: 36, thumbCurl: 0.5} : hand} color={CREW.skin} bare />
      </Inked>
      <Head id={`${id}-head`} c={hc} R={R} roll={pose.roll} turn={pose.turn} expr={expr} blink={blink} flip underlay={underlay} overlay={overlay} />
    </g>
  );
};

// ---------------------------------------------------------------------------------------------------------------
// Receiver
// ---------------------------------------------------------------------------------------------------------------
export type ReceiverPose = {
  roll: number;
  turn: number;
  /** body drawn back (a flinch) in px along +x */
  shiftX: number;
  shiftY: number;
};

export const Receiver: React.FC<{id: string; c?: V; R?: number; pose: ReceiverPose; expr: Expr; blink?: number}> = ({id, c = RECEIVER_C, R = RECEIVER_R, pose, expr, blink = 0}) => {
  const hc = {x: c.x + pose.shiftX * 0.8, y: c.y + pose.shiftY * 0.8};
  const cx = c.x + pose.shiftX;
  const sy = c.y + R * 1.58 + pose.shiftY;
  const torsoD = `M${fmt(cx - R * 1.14)},${fmt(sy + R * 0.42)} C${fmt(cx - R * 1.12)},${fmt(sy - R * 0.02)} ${fmt(cx - R * 0.86)},${fmt(sy - R * 0.28)} ${fmt(cx - R * 0.36)},${fmt(sy - R * 0.31)} L${fmt(cx + R * 0.42)},${fmt(sy - R * 0.31)} C${fmt(cx + R * 0.95)},${fmt(sy - R * 0.28)} ${fmt(cx + R * 1.36)},${fmt(sy - R * 0.02)} ${fmt(cx + R * 1.36)},${fmt(sy + R * 0.34)} L${fmt(cx + R * 1.42)},${fmt(sy + R * 7)} L${fmt(cx - R * 1.2)},${fmt(sy + R * 7)} Z`;
  // coral cardigan: two front panels leaving a cream V
  const lp = `M${fmt(cx - R * 1.14)},${fmt(sy + R * 0.4)} C${fmt(cx - R * 1.12)},${fmt(sy)} ${fmt(cx - R * 0.86)},${fmt(sy - R * 0.28)} ${fmt(cx - R * 0.4)},${fmt(sy - R * 0.31)} L${fmt(cx - R * 0.14)},${fmt(sy - R * 0.2)} L${fmt(cx - R * 0.02)},${fmt(sy + R * 1.5)} L${fmt(cx - R * 0.3)},${fmt(sy + R * 7)} L${fmt(cx - R * 1.2)},${fmt(sy + R * 7)} Z`;
  const rp = `M${fmt(cx + R * 1.36)},${fmt(sy + R * 0.32)} C${fmt(cx + R * 1.36)},${fmt(sy - R * 0.02)} ${fmt(cx + R * 0.95)},${fmt(sy - R * 0.28)} ${fmt(cx + R * 0.46)},${fmt(sy - R * 0.31)} L${fmt(cx + R * 0.2)},${fmt(sy - R * 0.2)} L${fmt(cx + R * 0.1)},${fmt(sy + R * 1.5)} L${fmt(cx + R * 0.3)},${fmt(sy + R * 7)} L${fmt(cx + R * 1.42)},${fmt(sy + R * 7)} Z`;
  const neckA = {x: hc.x - R * 0.02, y: hc.y + R * 0.78};
  const neckB = {x: cx + R * 0.02, y: sy - R * 0.1};
  const skin = '#F7D9C4';
  return (
    <g>
      <Inked w={R * 0.05} id={`${id}-sl`}>
        <Capsule id={`${id}-sl0`} a={{x: cx - R * 1.06, y: sy + R * 0.2}} b={{x: cx - R * 1.3, y: sy + R * 2.9}} ra={R * 0.33} rb={R * 0.3} color={CORAL} k={0.9} />
        <Capsule id={`${id}-sl1`} a={{x: cx + R * 1.18, y: sy + R * 0.2}} b={{x: cx + R * 1.36, y: sy + R * 2.9}} ra={R * 0.33} rb={R * 0.3} color={CORAL} k={0.9} />
      </Inked>
      <Inked w={R * 0.05} id={`${id}-fig`}>
        <Blob id={`${id}-torso`} d={torsoD} c={{x: cx - R * 0.2, y: sy + R * 0.4}} r={R * 2.3} color={CREAM} k={0.8} focal={0.5} />
        <Capsule id={`${id}-neck`} a={neckA} b={neckB} ra={R * 0.26} rb={R * 0.29} color={skin} k={1} />
      </Inked>
      <Inked w={R * 0.05} id={`${id}-card`}>
        <Blob id={`${id}-lp`} d={lp} c={{x: cx - R * 0.7, y: sy + R * 0.6}} r={R * 2.2} color={CORAL} k={0.9} focal={0.55} />
        <Blob id={`${id}-rp`} d={rp} c={{x: cx + R * 0.6, y: sy + R * 0.6}} r={R * 2.2} color={CORAL} k={0.9} focal={0.55} />
      </Inked>
      <Deco>
        <path d={`M${fmt(cx - R * 0.32)},${fmt(sy - R * 0.28)} Q${fmt(cx)},${fmt(sy + R * 0.3)} ${fmt(cx + R * 0.32)},${fmt(sy - R * 0.28)}`} fill="none" stroke={INK} strokeWidth={R * 0.045} strokeLinecap="round" opacity={0.9} />
        <ellipse cx={fmt(hc.x - R * 0.02)} cy={fmt(hc.y + R * 0.98)} rx={R * 0.3} ry={R * 0.16} fill={shade(skin, 0.5)} opacity={0.4} />
        {/* cardigan buttons */}
        {[0.62, 1.02, 1.42].map((k, i) => (
          <circle key={i} cx={fmt(cx + R * 0.15)} cy={fmt(sy + R * k)} r={R * 0.05} fill={lit(CORAL, 0.35)} stroke={INK} strokeWidth={R * 0.02} />
        ))}
      </Deco>
      <Head id={`${id}-head`} c={hc} R={R} roll={pose.roll} turn={pose.turn} expr={expr} blink={blink} skin={skin} hair="#8A8A93" style="bob" glasses />
    </g>
  );
};
