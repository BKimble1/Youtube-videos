import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {Head, EXPR_PAIN, EXPR_GASP, EXPR_RELIEF, EXPR_UNEASY, EXPR_WINCE, EXPR_NEUTRAL} from '../art/Head';
import {Hand, HAND_RELAXED, HAND_CLUTCH, HAND_BRACE, HAND_LIMP} from '../art/Hand';
import {Man, ManPose} from '../art/Man';
import {PAL} from '../lib/color';
import {HAND_CLUTCH as HC} from '../art/Hand';

export const STAND: ManPose = {
  x: 540, y: 1010, s: 0.95, torso: 10, chest: 8, neck: 6, turn: 0.45, pelvis: 4,
  lTu: -292, lTv: 52, lWx: 0, lWy: 0, lW: 0, lElb: -1, lWr: 6,
  rTu: -86, rTv: -6, rWx: 0, rWy: 0, rW: 0, rElb: 1, rWr: -18,
  lHip: 8, lKnee: 18, lAnk: 0, rHip: -10, rKnee: 6, rAnk: 0, lFs: 1, lFsh: 1, rFs: 1, rFsh: 1, breath: 0.5,
};

export const LabMan: React.FC = () => (
  <AbsoluteFill style={{background: '#DCEFF5'}}>
    <svg width={1080} height={1920} viewBox="0 0 1080 1920">
      <rect x={0} y={1380} width={1080} height={540} fill={PAL.grass} />
      <Man id="m" pose={STAND} expr={EXPR_PAIN} lHand={HAND_RELAXED} rHand={HC} />
    </svg>
  </AbsoluteFill>
);

export const LabParts: React.FC = () => {
  const f = useCurrentFrame();
  void f;
  const exprs = [EXPR_NEUTRAL, EXPR_PAIN, EXPR_WINCE, EXPR_GASP, EXPR_RELIEF, EXPR_UNEASY];
  return (
    <AbsoluteFill style={{background: '#E9EEF0'}}>
      <svg width={1080} height={1920} viewBox="0 0 1080 1920">
        {exprs.map((e, i) => (
          <Head key={i} id={`h${i}`} c={{x: 190 + (i % 3) * 350, y: 230 + Math.floor(i / 3) * 330}} R={150} roll={0} turn={0.45} expr={e} />
        ))}
        {[HAND_RELAXED, HAND_CLUTCH, HAND_BRACE, HAND_LIMP].map((h, i) => (
          <Hand key={i} id={`hd${i}`} wrist={{x: 160 + i * 250, y: 900}} ang={90} L={200} thumbSide={1} view="back" pose={h} color={PAL.skin} />
        ))}
        {[HAND_RELAXED, HAND_CLUTCH].map((h, i) => (
          <Hand key={i} id={`hr${i}`} wrist={{x: 120, y: 1350 + i * 300}} ang={-10} L={220} thumbSide={-1} view="back" pose={h} color={PAL.skin} />
        ))}
        <Head id="hroll" c={{x: 760, y: 1500}} R={140} roll={-80} turn={0.45} expr={EXPR_PAIN} />
      </svg>
    </AbsoluteFill>
  );
};
