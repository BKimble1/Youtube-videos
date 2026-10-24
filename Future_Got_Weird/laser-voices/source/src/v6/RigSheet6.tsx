// Dev only: the V6 rig: the guesser's head through a turn (no hair on the jaw), arm and hand shapes, the cup grip.
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {basis, cardOf, v3} from '../v4/rig/geo4';
import {Crew6} from './rig/Crew6';
import {BODY_P, GUESSER, CLERK, EXTRAS} from '../v4/rig/cast4';
import {stand, FACES} from '../v4/rig/poses4';
import {Cup} from './props6';

export const RigSheet6: React.FC<{row: number}> = ({row}) => {
  const b = basis({pos: v3(0, 1.0, -6), yaw: 0, pitch: -2, f: 1500 * (row ? 2.2 : 1), cx: 540, cy: 960});
  const B = BODY_P;
  const heads = [180, 135, 90, 45, 0];
  const out: React.ReactNode[] = [];
  heads.forEach((h, i) => {
    const g = v3(-1.6 + i * 0.8, 1.55, 0);
    out.push(<Crew6 key={`a${i}`} id={`a${i}`} look={GUESSER} b={B} pose={stand(B, FACES.alarm)} cd={cardOf(b, g, h)} />);
  });
  // arm shapes on the guesser: cup at ear, point, open, fist, relax
  const shapes: [string, any][] = [
    ['cup', {hand: v3(B.R + 26, B.hipY + B.spine + B.headUp - 22, 4), shape: 'cup', pole: v3(1, -1, 0.2), wrist: 160}],
    ['point', {hand: v3(B.R + 8, B.hipY + B.spine + B.headUp - 14, 10), shape: 'point', pole: v3(1, -0.9, 0.1)}],
    ['open', {hand: v3(B.shW + 30, B.hipY + B.spine - 90, 56), shape: 'open'}],
    ['fist', {hand: v3(B.shW + 10, B.hipY + B.spine - 60, 70), shape: 'fist'}],
    ['relax', {hand: v3(B.shW + 16, B.hipY + B.spine - B.upper - B.fore + 12, 10), shape: 'relax'}],
  ];
  shapes.forEach(([, armL], i) => {
    const g = row ? v3(-0.8 + i * 0.4 - (i > 2 ? 99 : 0), 0.35, 0) : v3(-1.6 + i * 0.8, -0.1, 0);
    const p = {...stand(B, FACES.focus), armL};
    out.push(<Crew6 key={`b${i}`} id={`b${i}`} look={i % 2 ? GUESSER : EXTRAS[0]} b={B} pose={p} cd={cardOf(b, g, i === 4 ? 150 : 180)} />);
  });
  // clerk with cup: holding, sipping (two headings)
  [[180, 0], [180, 1], [150, 0], [150, 1], [120, 1]].forEach(([h, sip], i) => {
    const g = v3(-1.6 + i * 0.8, -1.75, 0);
    const hold = v3(-22, B.hipY + B.spine - 60, 62), mouth = v3(-30, B.hipY + B.spine + B.headUp - 52, 56);
    const hand = sip ? mouth : hold;
    const p = {...stand(B, FACES.neutral), armR: {hand, shape: 'grip' as const, pole: v3(-0.6, -0.7, -0.5), tilt: sip ? 22 : 0}};
    out.push(<Crew6 key={`c${i}`} id={`c${i}`} look={CLERK} b={B} pose={p} cd={cardOf(b, g, h)} holdR={<Cup />} />);
  });
  if (row === 2) {
    const bz = basis({pos: v3(0, 1.3, -6), yaw: 0, pitch: -1, f: 3600, cx: 540, cy: 960});
    const z: React.ReactNode[] = [];
    const hold = v3(-22, B.hipY + B.spine - 60, 62), mouth = v3(-30, B.hipY + B.spine + B.headUp - 52, 56);
    const cupEar = {hand: v3(B.R + 22, B.hipY + B.spine + B.headUp - 18, 2), shape: 'cup' as const, pole: v3(1, -0.25, -0.1), wrist: 170};
    const items: [any, any, number, number, number][] = [
      [CLERK, {...stand(B, FACES.neutral), armR: {hand: hold, shape: 'grip', pole: v3(-0.6, -0.7, -0.5), tilt: 0}}, 180, -0.42, 0.62],
      [CLERK, {...stand(B, FACES.neutral), armR: {hand: mouth, shape: 'grip', pole: v3(-0.6, -0.7, -0.5), tilt: 22}}, 180, 0.42, 0.62],
      [GUESSER, {...stand(B, FACES.alarm), armL: cupEar}, 180, -0.42, -0.62],
      [GUESSER, {...stand(B, FACES.alarm), armL: cupEar}, 150, 0.42, -0.62],
    ];
    items.forEach(([lk, p, h, x, y], i) => z.push(<Crew6 key={i} id={`z${i}`} look={lk} b={B} pose={p} cd={cardOf(bz, v3(x, y, 0), h)} holdR={lk === CLERK ? <Cup /> : undefined} />));
    return <AbsoluteFill style={{background: '#2C4A57'}}><svg width={1080} height={1920}>{z}</svg></AbsoluteFill>;
  }
  return <AbsoluteFill style={{background: '#2C4A57'}}><svg width={1080} height={1920}>{out}</svg></AbsoluteFill>;
};
