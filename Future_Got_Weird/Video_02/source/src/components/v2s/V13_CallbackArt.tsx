import React from 'react';
import {C, OUTLINE} from '../../theme';
import {CAST} from '../cast';
import {Character2, IDLE2, handWorld2, reach2, withPose, type Pose2, type RigPlace} from '../v02/Cast2';

/**
 * V13 callback art (end screen, x 640-940, y 560-930): a small coral folding screen seen front-on (the room's
 * partition: coral panels, arched tops, darker inset outlines, saffron hinges, stubby feet) with the guesser peeking
 * round its right-hand end toward the video guide, one mitt curled over the edge. Pure function of its props: `peek`
 * 0..1 (he leans out from behind the end; the 0.4 s settle), `look` 0..1 (0 = at the video guide, 1 = at the viewer),
 * `blink` 1 = open .. 0 = shut. The rig is frozen (life 0, a fixed rig frame: no breathing, no idle blink), so the art
 * is still whenever its props are.
 */

const f2 = (n: number) => Math.round(n * 100) / 100;

/** Screen geometry (px). */
export const ART = {
  box: {x0: 640, y0: 560, x1: 940, y1: 930},
  /** the screen: two panels side by side, x0..x1, panel tops (arch peaks) at top, panel bottoms at bottom, feet below */
  screen: {x0: 650, x1: 836, top: 568, bottom: 908, foot: 14, arch: 16},
  /** the guesser's ground point and scale (feet on the screen's floor line; on the screen's height scale: a 1.7 m
   *  person beside the 2 m screen), his body just behind its right-hand end */
  rig: {x: 822, y: 922, scale: 0.68},
  /** where his mitt grips the edge (screen px) */
  grip: {x: 836, y: 744},
};

const GUESSER_SEED = 22;

/** The guesser's pose: peeking out to the right, eyes toward the video guide (up and right) or at the viewer. */
export const peekPose = (peek: number, look: number, blink: number): Pose2 => {
  const base: Pose2 = withPose(
    {...IDLE2, armsFront: 'none'},
    {peek: 0.25 + 0.65 * peek, lean: 1.5 * peek, tilt: 4 * peek, lid: 0.12, eyes: 1.06, brows: 0.35, browAsym: 0.35, mouth: 'smile', lookX: 0.85, lookY: -0.35},
  );
  const looked = withPose(base, {lookX: 0, lookY: 0.05, brows: 0.45, browAsym: 0.2, tilt: 2 * peek}, look);
  return {...looked, blink};
};

const placeOf = (): RigPlace => ({x: ART.rig.x, y: ART.rig.y, scale: ART.rig.scale});

/** The partition drawn front-on (one SVG group, screen px). */
const FrontScreen: React.FC = () => {
  const {x0, x1, top, bottom, foot, arch} = ART.screen;
  const mid = (x0 + x1) / 2;
  const panel = (a: number, b: number) => `M ${a} ${bottom} L ${a} ${top + arch} Q ${(a + b) / 2} ${top - arch * 0.6} ${b} ${top + arch} L ${b} ${bottom} Z`;
  const inset = (a: number, b: number) => {
    const p = 12;
    return `M ${a + p} ${bottom - p} L ${a + p} ${top + arch + p} Q ${(a + b) / 2} ${top - arch * 0.6 + p} ${b - p} ${top + arch + p} L ${b - p} ${bottom - p} Z`;
  };
  const feet = [x0 + 18, mid - 18, mid + 18, x1 - 18];
  return (
    <g>
      {/* floor shadow */}
      <ellipse cx={f2(mid + 40)} cy={bottom + foot + 1} rx={128} ry={6} fill={C.shadow} />
      {feet.map((fx) => (
        <rect key={fx} x={fx - 9} y={bottom - 2} width={18} height={foot + 2} rx={4} fill={C.coralDeep} stroke={C.ink} strokeWidth={3} />
      ))}
      <path d={panel(x0, mid)} fill={C.coral} stroke={C.ink} strokeWidth={OUTLINE} strokeLinejoin="round" />
      <path d={panel(mid, x1)} fill={C.coral} stroke={C.ink} strokeWidth={OUTLINE} strokeLinejoin="round" />
      <path d={inset(x0, mid)} fill="none" stroke={C.coralDeep} strokeWidth={3} strokeLinejoin="round" />
      <path d={inset(mid, x1)} fill="none" stroke={C.coralDeep} strokeWidth={3} strokeLinejoin="round" />
      {[top + 60, bottom - 60].map((hy) => (
        <rect key={hy} x={mid - 5} y={hy - 9} width={10} height={18} rx={3} fill={C.saffronDeep} stroke={C.ink} strokeWidth={2.5} />
      ))}
    </g>
  );
};

export const CallbackArt: React.FC<{peek: number; look: number; blink: number}> = ({peek, look, blink}) => {
  const place = placeOf();
  let pose = peekPose(peek, look, blink);
  // his left mitt (screen left) on the screen's edge: the arm runs behind the panel; the curled mitt is drawn over it
  const armL = reach2(place, pose, -1, ART.grip.x + 4, ART.grip.y, -1);
  pose = {...pose, armL};
  const hand = handWorld2(place, pose, -1);
  const k = ART.rig.scale;
  return (
    <div style={{position: 'absolute', left: 0, top: 0, width: 1920, height: 1080}}>
      <Character2 look={CAST.guesser} pose={pose} frame={0} seed={GUESSER_SEED} x={place.x} y={place.y} scale={k} life={0} eyeDarts={false} shadow={false} />
      <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
        <FrontScreen />
        {/* the mitt curled over the edge (drawn over the panel's face; the arm runs behind the panel) */}
        <g transform={`translate(${f2(ART.grip.x)} ${f2(hand.y)})`}>
          <rect x={f2(-21 * k)} y={f2(-18 * k)} width={f2(27 * k)} height={f2(36 * k)} rx={f2(11 * k)} fill={CAST.guesser.skin} stroke={C.ink} strokeWidth={3.5} />
          <path d={`M ${f2(-21 * k)} ${f2(-6 * k)} L ${f2(-9 * k)} ${f2(-6 * k)} M ${f2(-21 * k)} ${f2(6 * k)} L ${f2(-9 * k)} ${f2(6 * k)}`} stroke={C.ink} strokeWidth={2.5} strokeLinecap="round" />
        </g>
      </svg>
    </div>
  );
};
