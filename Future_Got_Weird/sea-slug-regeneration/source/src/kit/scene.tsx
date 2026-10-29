// Shared pieces for the shots: the scene frame (backdrop, floor pass, depth-sorted items, overlays) and the operator's
// gloved hand on the syringe (the Weird Crew lead's lab outfit: white coat sleeve, blue nitrile glove).
import React from 'react';
import {lit, shade} from './dc/color';
import {Hand, HandPose, digitTips} from './dc/Hand';
import {INK, Inked} from './dc/ink';
import {Capsule} from './dc/shade';
import {Item, Items, resetIds} from './draw3';
import {basis, Basis, Cam3, V2} from './three';

export const GLOVE = '#9DC3E6';
export const COAT = '#F4F7FA';

export const Scene: React.FC<{cam: Cam3; id: string; back?: (B: Basis) => React.ReactNode; floor?: (B: Basis) => React.ReactNode; items?: (B: Basis) => Item[]; over?: (B: Basis) => React.ReactNode; bg?: string}> = ({cam, id, back, floor, items, over, bg = '#DCE8EE'}) => {
  resetIds(id);
  const B = basis(cam);
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0, background: bg}}>
      {back?.(B)}
      {floor?.(B)}
      {items && <Items items={items(B)} />}
      {over?.(B)}
      <g id={id} />
    </svg>
  );
};

/** the classic syringe grip seen from the side: index and middle fingers hooked under the finger flange, the thumb on
 *  the plunger's thumb rest. `flange` and `thumbRest` are screen points, `axis` the screen direction from the tip end
 *  toward the plunger, `L` the hand length in px (wrist to the middle fingertip). The thumb is solved onto the rest. */
/** the plunger pressed by the gloved index finger from above (the syringe is held in a stand clamp); the fingertip
 *  stays on the thumb rest as it moves. `rest` = top centre of the thumb rest on screen, `down` = the screen direction of
 *  the press, `L` = hand length in px */
export const PressHand: React.FC<{id: string; rest: V2; down: V2; L: number; lift?: number; gap?: number}> = ({id, rest, down, L, lift = 0, gap = 0.02}) => {
  const d = norm(down);
  // the hand comes in from the upper right, pointing down and a little left
  const ang = (Math.atan2(d.y, d.x) * 180) / Math.PI + 32;
  const pose: HandPose = {curl: [0.08, 0.84, 0.9, 0.93], spread: 0.15, thumb: 26, thumbCurl: 0.55};
  const tip0 = digitTips({x: 0, y: 0}, ang, L, 1, pose).tips[0];
  const target = {x: rest.x - d.x * L * (gap + 0.12 * lift), y: rest.y - d.y * L * (gap + 0.12 * lift)};
  const wrist = {x: target.x - tip0.x, y: target.y - tip0.y};
  const fd = {x: Math.cos((ang * Math.PI) / 180), y: Math.sin((ang * Math.PI) / 180)};
  const cw = {x: -fd.y, y: fd.x};
  const elbow = {x: wrist.x - fd.x * L * 2.4, y: wrist.y - fd.y * L * 2.4};
  const rW = L * 0.21;
  return (
    <Inked w={Math.max(3.2, L * 0.022)}>
      <Capsule id={`${id}-sl`} a={elbow} b={{x: wrist.x - fd.x * L * 0.12, y: wrist.y - fd.y * L * 0.12}} ra={rW * 1.45} rb={rW * 1.22} color={COAT} spec={0.3} />
      <path d={`M${(wrist.x - fd.x * L * 0.12 + cw.x * rW * 1.2).toFixed(1)},${(wrist.y - fd.y * L * 0.12 + cw.y * rW * 1.2).toFixed(1)} L${(wrist.x - fd.x * L * 0.12 - cw.x * rW * 1.2).toFixed(1)},${(wrist.y - fd.y * L * 0.12 - cw.y * rW * 1.2).toFixed(1)}`} stroke={shade(COAT, 0.35)} strokeWidth={(L * 0.012).toFixed(2)} strokeLinecap="round" />
      <Capsule id={`${id}-cf`} a={{x: wrist.x - fd.x * L * 0.1, y: wrist.y - fd.y * L * 0.1}} b={{x: wrist.x + fd.x * L * 0.04, y: wrist.y + fd.y * L * 0.04}} ra={rW * 1.02} rb={rW * 0.98} color={lit(GLOVE, 0.05)} spec={0.4} />
      <Hand id={`${id}-h`} wrist={wrist} ang={ang} L={L} thumbSide={1} view="back" pose={pose} color={GLOVE} sheen={0.9} ink={Math.max(2, L * 0.016)} />
    </Inked>
  );
};

export const SyringeHand: React.FC<{id: string; flange: V2; thumbRest: V2; axis: V2; L: number; side?: 1 | -1; sleeveTo?: V2; press?: number}> = ({id, flange, thumbRest, axis, L, side = 1, sleeveTo}) => {
  const a = norm(axis);
  // fingers point across the barrel from the hand's side
  const across = side === 1 ? {x: -a.y, y: a.x} : {x: a.y, y: -a.x};
  const fd = {x: -across.x, y: -across.y};
  const ang = (Math.atan2(fd.y, fd.x) * 180) / Math.PI;
  // the curled fingers wrap the barrel just on the tip side of the flange
  const grip = {x: flange.x - a.x * L * 0.05, y: flange.y - a.y * L * 0.05};
  const wrist = {x: grip.x - fd.x * L * 0.44, y: grip.y - fd.y * L * 0.44};
  // which side of the hand axis the thumb is on: toward the plunger
  const cw = {x: -fd.y, y: fd.x};
  const ts: 1 | -1 = cw.x * a.x + cw.y * a.y > 0 ? 1 : -1;
  let best = {thumb: 60, curl: 0.3, d: Infinity};
  for (let th = 20; th <= 110; th += 3) {
    for (let c = 0; c <= 1.0001; c += 0.05) {
      const pose: HandPose = {curl: [0.78, 0.82, 0.88, 0.9], spread: 0.12, thumb: th, thumbCurl: c};
      const tip = digitTips(wrist, ang, L, ts, pose).thumb;
      const d = Math.hypot(tip.x - thumbRest.x, tip.y - thumbRest.y);
      if (d < best.d) best = {thumb: th, curl: c, d};
    }
  }
  const pose: HandPose = {curl: [0.78, 0.82, 0.88, 0.9], spread: 0.12, thumb: best.thumb, thumbCurl: best.curl};
  const elbow = sleeveTo ?? {x: wrist.x - fd.x * L * 2.2 + a.x * L * 0.3, y: wrist.y - fd.y * L * 2.2 + a.y * L * 0.3};
  const rW = L * 0.21;
  return (
    <Inked w={Math.max(3.2, L * 0.022)}>
      <Capsule id={`${id}-sl`} a={{x: elbow.x, y: elbow.y}} b={{x: wrist.x - fd.x * L * 0.12, y: wrist.y - fd.y * L * 0.12}} ra={rW * 1.45} rb={rW * 1.22} color={COAT} spec={0.3} />
      <path d={`M${(wrist.x - fd.x * L * 0.12 + cw.x * rW * 1.2).toFixed(1)},${(wrist.y - fd.y * L * 0.12 + cw.y * rW * 1.2).toFixed(1)} L${(wrist.x - fd.x * L * 0.12 - cw.x * rW * 1.2).toFixed(1)},${(wrist.y - fd.y * L * 0.12 - cw.y * rW * 1.2).toFixed(1)}`} stroke={shade(COAT, 0.35)} strokeWidth={(L * 0.012).toFixed(2)} strokeLinecap="round" />
      <Capsule id={`${id}-cf`} a={{x: wrist.x - fd.x * L * 0.1, y: wrist.y - fd.y * L * 0.1}} b={{x: wrist.x + fd.x * L * 0.04, y: wrist.y + fd.y * L * 0.04}} ra={rW * 1.02} rb={rW * 0.98} color={lit(GLOVE, 0.05)} spec={0.4} />
      <Hand id={`${id}-h`} wrist={wrist} ang={ang} L={L} thumbSide={ts} view="back" pose={pose} color={GLOVE} sheen={0.9} ink={Math.max(2, L * 0.016)} />
    </Inked>
  );
};
const norm = (v: V2) => {
  const l = Math.hypot(v.x, v.y) || 1;
  return {x: v.x / l, y: v.y / l};
};
export {INK};
