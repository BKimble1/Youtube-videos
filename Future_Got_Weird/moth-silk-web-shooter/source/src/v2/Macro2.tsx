// V2 shot B (macro): inside the strand. The camera, already full-frame in the strand at the end of the street
// push-in, travels along it toward its source: the aligned, cross-linked chains of the fibre (they draw tight on
// "catches them") give way to loose chains drifting in the pale-gold silk solution, which the lab's beaker takes over.
import React from 'react';
import {FieldView} from './SilkField';
import {STRAND_DIR} from './Street2';

export const MACRO = {start: 118, tight0: 126, tight1: 140, travel0: 136, end: 160, U1: 3150};
const sm = (x: number) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));
export const macroView = (f: number) => {
  // slow drift through the fibre while it tightens, then a smooth travel into the liquid
  const U = 6 * (f - MACRO.start) + (MACRO.U1 - 6 * (MACRO.end - MACRO.start)) * sm((f - MACRO.travel0) / (MACRO.end - MACRO.travel0));
  const S = 1 + 0.1 * sm((f - MACRO.start) / (MACRO.end - MACRO.start));
  const ang = (Math.atan2(STRAND_DIR.y, STRAND_DIR.x) * 180) / Math.PI;
  const tight = sm((f - MACRO.tight0) / (MACRO.tight1 - MACRO.tight0));
  return {U, S, ang, tight};
};
export const MacroScene2: React.FC<{f: number}> = ({f}) => {
  const v = macroView(f);
  return <FieldView id={`m${Math.round(f * 100)}`} U={v.U} S={v.S} ang={v.ang} t={f / 30} tight={v.tight} />;
};
